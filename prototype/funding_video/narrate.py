#!/usr/bin/env python3
"""Read the funding video's narration aloud and lay it on the narrated cut's timeline.

  python3 prototype/funding_video/narrate.py          -> narration_s1.mp3 + narration_s1_layout.json (committed; build.py n1 reads them)
                                                        and .narration/s1/: 01.wav ... 10.wav, timing.json, YYYYMMDD_CPL_Funding_Narration_s1.mp3
  python3 prototype/funding_video/narrate.py --check  -> phonemes only: applies the fixes and checks the bans, no audio

The voice is Kokoro-82M (af_heart, Apache-2.0), run locally with kokoro-onnx.
narration_s1.json holds the spoken form: its text is what the tokenizer reads,
and its phoneme_fixes correct the few words the tokenizer reads stiffly. Every
fix must fire at least once, so a change to the text or the tokenizer cannot
skip one silently. Its `never` list names readings Sam heard and rejected; a
scene whose phonemes still carry one fails the run.

The narration drives the narrated cut's clock: each scene lasts its lead-in, its
clip and its air (`layout` in the JSON), and the captions are the scene's text
cut at sentences and long clauses, timed by phoneme count and snapped to the
pauses the voice leaves. The track and the layout are committed because the
built page and the MP4 are made from them.

Needs: pip install kokoro-onnx soundfile imageio-ffmpeg. The model files come
from huggingface.co/fastrtc/kokoro-onnx into $KOKORO_DIR (default
~/.cache/kokoro), so the environment must allow huggingface.co.
"""
import json, os, pathlib, re, subprocess, sys, time, urllib.request
HERE = pathlib.Path(__file__).resolve().parent
MODELS = pathlib.Path(os.environ.get('KOKORO_DIR', pathlib.Path.home() / '.cache' / 'kokoro'))
HF = 'https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/'
FILES = ('kokoro-v1.0.onnx', 'voices-v1.0.bin')
CUE_CHARS = 88  # a caption holds two lines of about 44 characters

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
spec = json.loads((HERE / ('narration_%s.json' % variant)).read_text(encoding='utf8'))

from kokoro_onnx.tokenizer import Tokenizer
tok = Tokenizer()


def phonemes(text):
    ph = tok.phonemize(text, 'en-us')
    for fx in spec['phoneme_fixes']:
        ph = ph.replace(fx['find'], fx['use'])
    return ph


fired = {fx['find']: 0 for fx in spec['phoneme_fixes']}
scenes, problems = [], []
for s in spec['scenes']:
    raw = tok.phonemize(s['text'], 'en-us')
    for fx in spec['phoneme_fixes']:
        fired[fx['find']] += raw.count(fx['find'])
    ph = phonemes(s['text'])
    problems += ['%s still reads %s (%s)' % (s['scene'], ban['phonemes'], ban['why']) for ban in spec['never'] if ban['phonemes'] in ph]
    scenes.append((s['scene'], s['text'], ph))
problems += ['the fix for %s never fired: the text or the tokenizer changed' % f for f, n in fired.items() if not n]
if problems:
    sys.exit('\n'.join(problems))
if '--check' in sys.argv:
    for name, _, ph in scenes:
        print('%s: %s' % (name, ph))
    print('check ok: %d fixes fired %d times, no banned reading' % (len(fired), sum(fired.values())))
    sys.exit()

MODELS.mkdir(parents=True, exist_ok=True)
for f in FILES:
    if not (MODELS / f).exists():
        print('downloading', f)
        urllib.request.urlretrieve(HF + f, MODELS / (f + '.part'))
        (MODELS / (f + '.part')).rename(MODELS / f)

import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
voice = Kokoro(str(MODELS / FILES[0]), str(MODELS / FILES[1]))
out = HERE / '.narration' / variant
out.mkdir(parents=True, exist_ok=True)
clips, rate = [], 24000
for i, (name, _, ph) in enumerate(scenes, 1):
    audio, rate = voice.create(ph, voice=spec['voice'], speed=spec['speed'], lang='en-us', is_phonemes=True)
    sf.write(out / ('%02d.wav' % i), audio, rate)
    clips.append(audio)


def pauses(audio):
    """Midpoints (seconds) of the quiet runs the voice leaves between phrases."""
    f = int(0.01 * rate)
    n = len(audio) // f
    loud = np.sqrt((audio[:n * f].reshape(n, f) ** 2).mean(1))
    quiet = loud <= loud.max() * 10 ** (-40 / 20)
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if j - i >= 12 and i > 0 and j < n:
                runs.append((i + j) / 2 * 0.01)
            i = j
        else:
            i += 1
    return runs


def chunks(text):
    """The scene's text cut at sentences, and a long sentence at its commas."""
    out_ = []
    for sent in re.split(r'(?<=[.!?:])\s+', text.strip()):
        if len(sent) <= CUE_CHARS:
            out_.append(sent)
            continue
        cur = ''
        for part in re.split(r'(?<=,)\s+', sent):
            if cur and len(cur) + 1 + len(part) > CUE_CHARS:
                out_.append(cur)
                cur = part
            else:
                cur = (cur + ' ' + part).strip()
        # a short tail rejoins the line before it: a caption reading only
        # "twenty-seven year." would split the budget year at its comma
        if out_ and len(cur) < 25:
            out_[-1] = out_[-1] + ' ' + cur
        else:
            out_.append(cur)
    return out_


L = spec['layout']
layout, cues, at = [], [], 0.0
for i, ((name, text, _), audio) in enumerate(zip(scenes, clips)):
    lead = L['first_lead_s'] if i == 0 else L['lead_s']
    tail = L['last_tail_s'] if i == len(scenes) - 1 else L['tail_s']
    secs = len(audio) / rate
    s0, s1 = at + lead, at + lead + secs
    layout.append({'scene': name, 'start': round(at, 3), 'speech_start': round(s0, 3),
                   'speech_end': round(s1, 3), 'end': round(s1 + tail, 3)})
    parts = chunks(text)
    w = [max(1, len(phonemes(p))) for p in parts]
    est = [secs * sum(w[:k]) / sum(w) for k in range(1, len(parts))]
    gaps, cuts, prev = pauses(audio), [], 0.0
    for e in est:
        near = [g for g in gaps if g > prev + 0.3 and abs(g - e) <= 1.0]
        c = min(near, key=lambda g: abs(g - e)) if near else e
        cuts.append(c)
        prev = c
    edges = [0.0] + cuts + [secs]
    for k, p in enumerate(parts):
        cues.append({'start': round(s0 + edges[k], 3), 'end': round(s0 + edges[k + 1], 3),
                     'text': re.sub(r'\bmap\b', 'MAP', p)})
    at = s1 + tail

total = round(at, 3)
track = np.zeros(int(total * rate) + 1, dtype=np.float32)
for seg, audio in zip(layout, clips):
    a = int(seg['speech_start'] * rate)
    track[a:a + len(audio)] = audio
wav = out / 'track.wav'
sf.write(wav, track, rate)
(out / 'timing.json').write_text(json.dumps({'voice': spec['voice'], 'speed': spec['speed'],
                                             'clips': [round(len(c) / rate, 2) for c in clips]}, indent=1) + '\n', encoding='utf8')
(HERE / ('narration_%s_layout.json' % variant)).write_text(json.dumps({
    '_about': ('The narrated cut\'s timeline, written by narrate.py from narration_%s.json: each scene '
               'lasts its lead-in, its clip and its air; captions are the scene text cut at sentences '
               'and long clauses, timed by phoneme count and snapped to the voice\'s pauses. '
               'build.py n1 reads it; do not edit by hand.' % variant),
    'voice': spec['voice'], 'speed': spec['speed'], 'layout': L, 'total': total,
    'scenes': layout, 'cues': cues}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
try:
    import imageio_ffmpeg
    ffmpeg = os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
mp3 = HERE / ('narration_%s.mp3' % variant)
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3)], check=True)
preview = out / ('%s_CPL_Funding_Narration_%s.mp3' % (time.strftime('%Y%m%d'), variant))
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(mp3), '-c', 'copy', str(preview)], check=True)
print('read %d scenes, %d cues, %d:%02d on the narrated timeline, into %s' % (
    len(scenes), len(cues), total // 60, total % 60, mp3.relative_to(HERE.parent.parent)))
