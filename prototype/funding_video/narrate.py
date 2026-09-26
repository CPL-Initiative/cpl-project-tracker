#!/usr/bin/env python3
"""Read the funding video's narration aloud: one WAV per scene and a preview of the whole read.

  python3 prototype/funding_video/narrate.py          -> .narration/s1/: 01.wav ... 10.wav, timing.json, YYYYMMDD_CPL_Funding_Narration_s1.mp3
  python3 prototype/funding_video/narrate.py --check  -> phonemes only: applies the fixes and checks the bans, no audio

The voice is Kokoro-82M (af_heart, Apache-2.0), run locally with kokoro-onnx.
narration_s1.json holds the spoken form: its text is what the tokenizer reads,
and its phoneme_fixes correct the few words the tokenizer reads stiffly. Every
fix must fire at least once, so a change to the text or the tokenizer cannot
skip one silently. Its `never` list names readings Sam heard and rejected; a
scene whose phonemes still carry one fails the run.

Needs: pip install kokoro-onnx soundfile imageio-ffmpeg. The model files come
from huggingface.co/fastrtc/kokoro-onnx into $KOKORO_DIR (default
~/.cache/kokoro), so the environment must allow huggingface.co.
"""
import json, os, pathlib, subprocess, sys, time, urllib.request
HERE = pathlib.Path(__file__).resolve().parent
MODELS = pathlib.Path(os.environ.get('KOKORO_DIR', pathlib.Path.home() / '.cache' / 'kokoro'))
HF = 'https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/'
FILES = ('kokoro-v1.0.onnx', 'voices-v1.0.bin')

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
spec = json.loads((HERE / ('narration_%s.json' % variant)).read_text(encoding='utf8'))

from kokoro_onnx.tokenizer import Tokenizer
tok = Tokenizer()
fired = {fx['find']: 0 for fx in spec['phoneme_fixes']}
scenes, problems = [], []
for s in spec['scenes']:
    ph = tok.phonemize(s['text'], 'en-us')
    for fx in spec['phoneme_fixes']:
        fired[fx['find']] += ph.count(fx['find'])
        ph = ph.replace(fx['find'], fx['use'])
    problems += ['%s still reads %s (%s)' % (s['scene'], ban['phonemes'], ban['why']) for ban in spec['never'] if ban['phonemes'] in ph]
    scenes.append((s['scene'], ph))
problems += ['the fix for %s never fired: the text or the tokenizer changed' % f for f, n in fired.items() if not n]
if problems:
    sys.exit('\n'.join(problems))
if '--check' in sys.argv:
    for name, ph in scenes:
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
parts, timing, at, rate = [], [], 0.0, 24000
for i, (name, ph) in enumerate(scenes, 1):
    audio, rate = voice.create(ph, voice=spec['voice'], speed=spec['speed'], lang='en-us', is_phonemes=True)
    sf.write(out / ('%02d.wav' % i), audio, rate)
    timing.append({'scene': name, 'file': '%02d.wav' % i, 'start': round(at, 2), 'seconds': round(len(audio) / rate, 2)})
    parts += [audio, np.zeros(int(spec['gap_s'] * rate), dtype=audio.dtype)]
    at += len(audio) / rate + spec['gap_s']
whole = np.concatenate(parts[:-1])
(out / 'timing.json').write_text(json.dumps({'voice': spec['voice'], 'speed': spec['speed'], 'gap_s': spec['gap_s'],
                                             'seconds': round(len(whole) / rate, 2), 'scenes': timing}, indent=1) + '\n', encoding='utf8')
wav = out / 'preview.wav'
sf.write(wav, whole, rate)
try:
    import imageio_ffmpeg
    ffmpeg = os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
mp3 = out / ('%s_CPL_Funding_Narration_%s.mp3' % (time.strftime('%Y%m%d'), variant))
subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '128k', str(mp3)], check=True)
secs = len(whole) / rate
print('read %d scenes, %d:%02d, into %s' % (len(scenes), secs // 60, secs % 60, mp3.relative_to(HERE.parent.parent)))
