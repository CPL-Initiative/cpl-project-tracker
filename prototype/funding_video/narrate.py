#!/usr/bin/env python3
"""Read the funding video's narration aloud and lay it on the narrated cut's timeline.

  python3 prototype/funding_video/narrate.py          -> narration_s1.mp3 + narration_s1_layout.json (committed; build.py n1 reads them)
                                                        and .narration/s1/: 01.wav ... 10.wav, timing.json, YYYYMMDD_CPL_Funding_Narration_s1.mp3;
                                                        then cues.py --listen hears the new read and pins the cues (narration_s1_words.json)
  python3 prototype/funding_video/narrate.py --check  -> phonemes only: applies the fixes and checks the bans, no audio

Two voices. Scenario 1's is Kokoro-82M (af_heart, Apache-2.0), run locally with
kokoro-onnx: narration_s1.json holds the spoken form, its text is what the
tokenizer reads, and its phoneme_fixes correct the few words the tokenizer reads
stiffly. Every fix must fire at least once, so a change to the text or the
tokenizer cannot skip one silently. Its `never` list names readings Sam heard and
rejected; a scene whose phonemes still carry one fails the run.

Scenario 2's is Sierra (Sam, 2026-10-02: "select a female voice model to narrate
and give her the name Sierra on the video"), an ElevenLabs voice. ElevenLabs reads
each scene through its connector, outside this script; the clips are committed
under the narration's `engine.clips` folder, and each scene's `read.text_sha1` is
the SHA-1 of the text its clip was read from, so a scene edited after its read
fails here until it is read again. A scene still waiting on its read carries
`pending`, the reason: it plays silent, at the introduction's own pace.

The narration drives the narrated cut's clock: each scene lasts its lead-in, its
clip and its air (`layout` in the JSON), and the captions are the scene's text
cut at sentences and long clauses, timed by phoneme count and snapped to the
pauses the voice leaves. The track and the layout are committed because the
built page and the MP4 are made from them. A new read moves every word, so the
run ends with cues.py --listen, which finds each word in the new track and pins
each reveal to the word that names it (the layout's anchors).

Needs: pip install kokoro-onnx soundfile imageio-ffmpeg faster-whisper (Sierra's
read needs no kokoro-onnx: numpy, soundfile, imageio-ffmpeg, faster-whisper). The
model files come from huggingface.co/fastrtc/kokoro-onnx into $KOKORO_DIR
(default ~/.cache/kokoro), and cues.py's from huggingface.co too, so the
environment must allow huggingface.co.
"""
import hashlib, json, os, pathlib, re, subprocess, sys, time, urllib.request
HERE = pathlib.Path(__file__).resolve().parent
MODELS = pathlib.Path(os.environ.get('KOKORO_DIR', pathlib.Path.home() / '.cache' / 'kokoro'))
HF = 'https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/'
FILES = ('kokoro-v1.0.onnx', 'voices-v1.0.bin')
CUE_CHARS = 88  # a caption holds two lines of about 44 characters

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
spec = json.loads((HERE / ('narration_%s.json' % variant)).read_text(encoding='utf8'))
ENGINE = (spec.get('engine') or {}).get('name', 'kokoro')
from film_spans import film_spans, SLIDE
SPANS = film_spans((HERE / 'funding_in_motion.src.html').read_text(encoding='utf8'),
                   any(s['scene'] == SLIDE for s in spec['scenes']))
assert len(SPANS) == len(spec['scenes']), 'the narration has %d scenes, the picture %d' % (len(spec['scenes']), len(SPANS))
out = HERE / '.narration' / variant
out.mkdir(parents=True, exist_ok=True)
try:
    import imageio_ffmpeg
    ffmpeg = os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')


def read_kokoro():
    """Scenario 1's read, synthesized here: (clips, rate, caption weight of a text)."""
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

    import soundfile as sf
    from kokoro_onnx import Kokoro
    voice = Kokoro(str(MODELS / FILES[0]), str(MODELS / FILES[1]))
    clips, rate = [], 24000
    for i, (name, _, ph) in enumerate(scenes, 1):
        audio, rate = voice.create(ph, voice=spec['voice'], speed=spec['speed'], lang='en-us', is_phonemes=True)
        sf.write(out / ('%02d.wav' % i), audio, rate)
        clips.append(audio)
    return clips, rate, lambda p: len(phonemes(p))


def read_elevenlabs():
    """Sierra's read, made in ElevenLabs and committed: (clips, rate, caption weight of a text).

    Each clip is cut to its voice (40 dB under its peak, with 50 ms before the first
    sound and 100 ms after the last, so the layout's lead-in and air set the spacing)
    and brought to the engine's speech level, so every scene sits at one loudness
    under the score. A pending scene has no clip (None)."""
    import numpy as np
    eng, rate, clips, problems = spec['engine'], 44100, [], []
    for s in spec['scenes']:
        if s.get('pending'):
            clips.append(None)
            continue
        read = s.get('read') or {}
        if read.get('text_sha1') != hashlib.sha1(s['text'].encode('utf8')).hexdigest():
            problems.append('%s: its clip was read from other text; read the scene again in ElevenLabs' % s['scene'])
            continue
        raw = subprocess.run([ffmpeg, '-v', 'error', '-i', str(HERE / eng['clips'] / read['clip']), '-f', 'f32le', '-ac', '1',
                              '-ar', str(rate), '-'], capture_output=True, check=True).stdout
        audio = np.frombuffer(raw, dtype=np.float32).copy()
        f = int(0.01 * rate)
        n = len(audio) // f
        level = np.sqrt((audio[:n * f].reshape(n, f) ** 2).mean(1))
        loud = np.nonzero(level > level.max() * 10 ** (-40 / 20))[0]
        audio = audio[max(0, loud[0] * f - int(0.05 * rate)):min(len(audio), (loud[-1] + 1) * f + int(0.1 * rate))]
        n = len(audio) // f
        frames = audio[:n * f].reshape(n, f)
        level = np.sqrt((frames ** 2).mean(1))
        speech = frames[level > level.max() * 10 ** (-40 / 20)]
        gain = 10 ** (eng['speech_rms_dbfs'] / 20) / np.sqrt((speech ** 2).mean())
        audio = (audio * min(gain, 0.98 / np.abs(audio).max())).astype(np.float32)
        clips.append(audio)
    if problems:
        sys.exit('\n'.join(problems))
    if '--check' in sys.argv:
        print('check ok: %d clips match their scene text, %d pending' % (sum(c is not None for c in clips), sum(c is None for c in clips)))
        sys.exit()
    import soundfile as sf
    for i, audio in enumerate(clips, 1):
        if audio is not None:
            sf.write(out / ('%02d.wav' % i), audio, rate)
    return clips, rate, lambda p: len(re.sub(r'[^A-Za-z]', '', p))


import numpy as np, soundfile as sf
clips, rate, weight = read_kokoro() if ENGINE == 'kokoro' else read_elevenlabs()


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
for i, (sc, audio, (f0, f1)) in enumerate(zip(spec['scenes'], clips, SPANS)):
    name, text = sc['scene'], sc['text']
    lead = L['first_lead_s'] if i == 0 else L['lead_s']
    # a scene may ask for more air (`air_s`, with its reason), where its picture runs on after the voice
    tail = sc.get('air_s', L['last_tail_s'] if i == len(clips) - 1 else L['tail_s'])
    secs = 0.0 if audio is None else len(audio) / rate
    s0, s1 = at + lead, at + lead + secs
    # no scene plays its picture faster than the introduction: a short read, or none, keeps the film's own pace
    end = max(s1 + tail, at + (f1 - f0))
    layout.append({'scene': name, 'start': round(at, 3), 'speech_start': round(s0, 3),
                   'speech_end': round(s1, 3), 'end': round(end, 3)})
    if audio is None:
        layout[-1]['pending'] = sc['pending']
        at = end
        continue
    parts = chunks(text)
    w = [max(1, weight(p)) for p in parts]
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
    at = end

total = round(at, 3)
track = np.zeros(int(total * rate) + 1, dtype=np.float32)
for seg, audio in zip(layout, clips):
    if audio is None:
        continue
    a = int(seg['speech_start'] * rate)
    track[a:a + len(audio)] = audio
wav = out / 'track.wav'
sf.write(wav, track, rate)
(out / 'timing.json').write_text(json.dumps({'voice': spec['voice'], 'speed': spec.get('speed'),
                                             'clips': [None if c is None else round(len(c) / rate, 2) for c in clips]}, indent=1) + '\n', encoding='utf8')
(HERE / ('narration_%s_layout.json' % variant)).write_text(json.dumps({
    '_about': ('The narrated cut\'s timeline, written by narrate.py from narration_%s.json: each scene '
               'lasts its lead-in, its clip and its air; captions (`cues`) are the scene text cut at sentences '
               'and long clauses, timed by phoneme (or letter) count and snapped to the voice\'s pauses; a scene '
               'that waits on its read carries `pending` and plays its picture silent, at the film\'s own pace. Each scene\'s '
               '`anchors`, added by cues.py, pin a reveal (`at`, film seconds into the scene) to the narration '
               'time `t` of the word that names it (`said` is that word\'s onset; `t` differs only where the '
               'picture needs the room). build.py n%s reads it; do not edit by hand.' % (variant, variant[1:])),
    'voice': spec['voice'], 'speed': spec.get('speed'), 'layout': L, 'total': total,
    'scenes': layout, 'cues': cues}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
mp3 = HERE / ('narration_%s.mp3' % variant)
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3)], check=True)
preview = out / ('%s_CPL_Funding_Narration_%s.mp3' % (time.strftime('%Y%m%d'), variant))
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(mp3), '-c', 'copy', str(preview)], check=True)
print('read %d scenes, %d cues, %d:%02d on the narrated timeline, into %s' % (
    len(clips), len(cues), total // 60, total % 60, mp3.relative_to(HERE.parent.parent)))
# a new read moves every word: hear it, and pin each reveal to the word that names it again
subprocess.run([sys.executable, str(HERE / 'cues.py'), '--listen', variant], check=True)
