#!/usr/bin/env python3
"""Lay the Noncredit Summit film's narration on the narrated cut's timeline.

  python3 prototype/noncredit_video/narrate.py          -> narration.mp3 + narration_layout.json (committed; build.py narrated reads them)
                                                          and .narration/: 01.wav ... 10.wav, timing.json, YYYYMMDD_Noncredit_Summit_Narration.mp3;
                                                          then cues.py --listen hears the read and pins the cues (narration_words.json)
  python3 prototype/noncredit_video/narrate.py --check  -> every committed clip was read from its scene's current text

The funding film's narrate.py (prototype/funding_video/), its ElevenLabs path
only. Sam, 2026-10-05: "another with voice over from our ElevenLabs narrator. See
if we have access to a female voice with a slight hispanic accent"; he picked
ladypatty1 by ear the same day ("Let's go with Ladypatty"). ElevenLabs reads each
scene through its connector, outside this script; the clips are committed under
the narration's `engine.clips` folder, and each scene's `read.text_sha1` is the
SHA-1 of the text its clip was read from, so a scene edited after its read fails
here until it is read again. A scene still waiting on its read carries `pending`,
the reason: it plays silent, at the music cut's own pace.

The narration drives the narrated cut's clock: each scene lasts its lead-in, its
clip and its air (`layout` in the JSON), and the captions are the scene's text
cut at sentences and long clauses, timed by letter count and snapped to the
pauses the voice leaves. A new read moves every word, so the run ends with
cues.py --listen, which pins each reveal to the word that names it.

Needs: pip install numpy soundfile imageio-ffmpeg faster-whisper; cues.py's
models come from huggingface.co, so the environment must allow it.
"""
import hashlib, json, os, pathlib, re, subprocess, sys, time
HERE = pathlib.Path(__file__).resolve().parent
CUE_CHARS = 88  # a caption holds two lines of about 44 characters

spec = json.loads((HERE / 'narration.json').read_text(encoding='utf8'))
assert (spec.get('engine') or {}).get('name') == 'elevenlabs', 'this film is read in ElevenLabs'
from narrate_spans import film_spans
SPANS = film_spans((HERE / 'noncredit_in_motion.src.html').read_text(encoding='utf8'))
assert len(SPANS) == len(spec['scenes']), 'the narration has %d scenes, the picture %d' % (len(spec['scenes']), len(SPANS))
out = HERE / '.narration'
out.mkdir(parents=True, exist_ok=True)
try:
    import imageio_ffmpeg
    ffmpeg = os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')


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
clips, rate, weight = read_elevenlabs()


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
(out / 'timing.json').write_text(json.dumps({'voice': spec['voice'], 'clips': [None if c is None else round(len(c) / rate, 2) for c in clips]},
                                            indent=1) + '\n', encoding='utf8')
(HERE / 'narration_layout.json').write_text(json.dumps({
    '_about': ('The narrated cut\'s timeline, written by narrate.py from narration.json: each scene lasts its lead-in, '
               'its clip and its air; captions (`cues`) are the scene text cut at sentences and long clauses, timed by '
               'letter count and snapped to the voice\'s pauses; a scene that waits on its read carries `pending` and '
               'plays its picture silent, at the film\'s own pace. Each scene\'s `anchors`, added by cues.py, pin a reveal '
               '(`at`, film seconds into the scene) to the narration time `t` of the word that names it (`said` is that '
               'word\'s onset; `t` differs only where the picture needs the room). build.py narrated reads it; do not '
               'edit by hand.'),
    'voice': spec['voice'], 'layout': L, 'total': total, 'scenes': layout, 'cues': cues}, ensure_ascii=False, indent=1) + '\n',
    encoding='utf8')
mp3 = HERE / 'narration.mp3'
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3)], check=True)
preview = out / ('%s_Noncredit_Summit_Narration.mp3' % time.strftime('%Y%m%d'))
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(mp3), '-c', 'copy', str(preview)], check=True)
print('read %d scenes, %d cues, %d:%02d on the narrated timeline, into %s' % (
    len(clips), len(cues), total // 60, total % 60, mp3.relative_to(HERE.parent.parent)))
# a new read moves every word: hear it, and pin each reveal to the word that names it again
subprocess.run([sys.executable, str(HERE / 'cues.py'), '--listen'], check=True)
