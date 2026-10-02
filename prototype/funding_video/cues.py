#!/usr/bin/env python3
"""Cue each reveal of the narrated cut to the word that names it.

Sam, 2026-09-27: before the explainer links the narrated draft, "cue each reveal
to the word that names it".

  python3 prototype/funding_video/cues.py --listen  -> hears narration_s1.mp3 into narration_s1_words.json (about a minute),
                                                        then pins the cues as below
  python3 prototype/funding_video/cues.py           -> pins each scene's cues (narration_s1.json) to the words and writes
                                                        them into narration_s1_layout.json as the scene's anchors

narrate.py runs `--listen` after every new read; the voice track itself is never
touched here. build.py n1 carries the anchors into the page, whose clock (ft/nt)
runs the picture through them.

WHEN A WORD BEGINS. faster-whisper (small) hears each scene's clip, and its
transcript is kept as the record that the voice read the script as written. Its
word times run early (0.1 to 0.5 s inside a sentence, about 1 s on a clip's first
word; measured 2026-09-29), so each onset comes from a forced alignment of the
scene's own text against the same clip (wav2vec2-base-960h, CTC). A word that
follows a pause (a silent run of 0.1 s or more, 40 dB under the track's peak)
begins where the voice resumes.

WHEN A CUE LANDS. A cue names one reveal: `at` is the film time in its scene
where the reveal begins (a count is cued where it lands, the moment its figure
reads), and `word` is the phrase that names it, found once in the scene's text;
the anchor is the onset of the phrase's first word. No stretch of the picture may
play faster than the 90-second introduction (MIN_STRETCH): where two cues sit
closer in the narration than in the picture, the earlier one moves earlier, so a
reveal may lead its word but never trails it. A cue with `skip` stays off the
clock, and its reason is the point: usually the voice names things in another
order than the picture shows them, and a clock can stretch the picture but never
reorder it. A scene that waits on its read (`pending` in the narration) has no
words to hear, so none of its cues is pinned and its picture keeps the film's pace.

Needs, for --listen only: pip install faster-whisper imageio-ffmpeg (onnxruntime
comes with faster-whisper). The first run downloads faster-whisper small and the
aligner (Xenova/wav2vec2-base-960h, quantized ONNX, about 95 MB) from
huggingface.co.
"""
import hashlib, json, os, pathlib, re, subprocess, sys, time, urllib.request
HERE = pathlib.Path(__file__).resolve().parent
MIN_STRETCH = 1.0  # narration seconds per film second, at least: never faster than the introduction
RATE = 16000
PAUSE_S, QUIET_DB = 0.1, -40
HEAR = {'model': 'small', 'revision': '536b0662742c02347bc0e980a01041f333bce120', 'compute_type': 'int8', 'beam_size': 5}
ALIGN = {'repo': 'Xenova/wav2vec2-base-960h', 'revision': 'a19f851b3d42865797e410752b4c570c871e4825',
         'file': 'onnx/model_quantized.onnx'}
CTC_DIR = pathlib.Path(os.environ.get('CTC_DIR', pathlib.Path.home() / '.cache' / 'wav2vec2-ctc'))
# letters the voice says one by one, spelled as the aligner hears them
SAY = {'CPL': 'SEE PEE ELL', 'EDD': 'EE DEE DEE', 'FTES': 'EFF TEE EE ESS'}

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
SPEC = HERE / ('narration_%s.json' % variant)
LAYOUT = HERE / ('narration_%s_layout.json' % variant)
WORDS = HERE / ('narration_%s_words.json' % variant)
MP3 = HERE / ('narration_%s.mp3' % variant)


def norm(tok):
    return re.sub(r"^[^\w']+|[^\w']+$", '', tok.replace('’', "'")).lower()


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def spans_of(spec):
    """Each scene's [t0, t1] in film seconds (film_spans.py), with the targets slide where the narration voices it."""
    from film_spans import film_spans, SLIDE
    return film_spans((HERE / 'funding_in_motion.src.html').read_text(encoding='utf8'),
                      any(s['scene'] == SLIDE for s in spec['scenes']))


def listen(spec, layout):
    """Hear the committed track, scene by scene; return the words file's content."""
    import numpy as np
    import imageio_ffmpeg
    raw = subprocess.run([os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(MP3),
                          '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, dtype=np.float32).copy()
    # the pauses: silent runs in a 20 ms window stepped 5 ms (a frame's center is 10 ms in)
    hop, win = RATE // 200, RATE // 50
    frames = np.lib.stride_tricks.sliding_window_view(audio, win)[::hop]
    level = np.sqrt((frames.astype(np.float64) ** 2).mean(1))
    loud = 20 * np.log10(level / level.max() + 1e-12) > QUIET_DB
    pauses, i = [], 0
    while i < len(loud):
        j = i
        while j < len(loud) and not loud[j]:
            j += 1
        if (j - i) * 0.005 >= PAUSE_S:
            pauses.append((i * 0.005 + 0.01, j * 0.005 + 0.01))
        i = max(j, i + 1)

    from faster_whisper import WhisperModel
    import faster_whisper, ctranslate2, onnxruntime as ort
    ear = WhisperModel(HEAR['model'], device='cpu', compute_type=HEAR['compute_type'], revision=HEAR['revision'])
    CTC_DIR.mkdir(parents=True, exist_ok=True)
    base = 'https://huggingface.co/%s/resolve/%s/' % (ALIGN['repo'], ALIGN['revision'])
    for f in (ALIGN['file'], 'vocab.json'):
        dest = CTC_DIR / pathlib.Path(f).name
        if not dest.exists():
            print('downloading', f)
            urllib.request.urlretrieve(base + f, str(dest) + '.part')
            os.rename(str(dest) + '.part', dest)
    vocab = json.loads((CTC_DIR / 'vocab.json').read_text())
    net = ort.InferenceSession(str(CTC_DIR / pathlib.Path(ALIGN['file']).name), providers=['CPUExecutionProvider'])

    def align(clip, words):
        """CTC forced alignment: (first, last) frame of each word, and the frame length in seconds."""
        x = ((clip - clip.mean()) / np.sqrt(clip.var() + 1e-7)).astype(np.float32)[None]
        lg = net.run(None, {net.get_inputs()[0].name: x})[0][0].astype(np.float64)
        lp = lg - lg.max(1, keepdims=True)
        lp -= np.log(np.exp(lp).sum(1, keepdims=True))
        ids, owner = [], []
        for wi, w in enumerate(words):
            for part in SAY.get(re.sub(r'[^A-Za-z]', '', w), w).upper().replace('-', ' ').split():
                letters = [c for c in part if c in vocab]
                if not letters:
                    continue
                if ids:
                    ids.append(vocab['|']); owner.append(-1)
                for c in letters:
                    ids.append(vocab[c]); owner.append(wi)
        T, S = lp.shape[0], 2 * len(ids) + 1
        y = np.zeros(S, dtype=int); y[1::2] = ids
        skip = np.zeros(S, bool); skip[3::2] = y[3::2] != y[1:-2:2]
        NEG = -1e30
        dp = np.full(S, NEG); dp[0], dp[1] = lp[0, 0], lp[0, y[1]]
        back = np.zeros((T, S), dtype=np.int8)
        for t in range(1, T):
            c1 = np.concatenate([[NEG], dp[:-1]])
            c2 = np.where(skip, np.concatenate([[NEG, NEG], dp[:-2]]), NEG)
            st = np.stack([dp, c1, c2]); k = st.argmax(0)
            dp = st[k, np.arange(S)] + lp[t, y]; back[t] = k
        s = S - 1 if dp[S - 1] >= dp[S - 2] else S - 2
        span = {}
        for t in range(T - 1, -1, -1):
            if s % 2 and owner[s // 2] >= 0:
                a, b = span.get(owner[s // 2], (t, t))
                span[owner[s // 2]] = (min(a, t), max(b, t))
            s -= int(back[t, s])
        return span, len(clip) / RATE / T

    scenes, worst = [], (0.0, '')
    for sc, lay in zip(spec['scenes'], layout['scenes']):
        if sc.get('pending'):
            scenes.append({'scene': sc['scene'], 'pending': sc['pending'], 'heard': '', 'words': [], 'whisper': []})
            print('heard %-20s pending: %s' % (sc['scene'], sc['pending'][:60]))
            continue
        s0, s1 = lay['start'], lay['end']
        clip = audio[int(s0 * RATE):int(s1 * RATE)]
        segs, _ = ear.transcribe(clip, language='en', word_timestamps=True, beam_size=HEAR['beam_size'],
                                 condition_on_previous_text=False)
        heard = [[round(s0 + w.start, 3), round(s0 + w.end, 3), w.word, round(w.probability, 3)] for g in segs for w in g.words]
        words = sc['text'].split()
        span, fr = align(clip, words)
        out, prev_end = [], s0
        for wi, w in enumerate(words):
            a, b = span[wi]
            on, end = s0 + a * fr, s0 + (b + 1) * fr
            # after a pause the word begins where the voice resumes
            after = [p[1] for p in pauses if prev_end <= p[1] < end]
            if after:
                on = after[-1]
            out.append([w, round(on, 3), round(end, 3)])
            prev_end = end
        # a check on the aligner: where whisper heard three or more words as written in a row,
        # its time for each (the scene's first word aside) sits within a second of the onset
        import difflib
        mh = []
        for w in heard:
            if mh and not w[2].startswith(' '):
                mh[-1] = [mh[-1][0], w[1], mh[-1][2] + w[2], w[3]]
            else:
                mh.append(list(w))
        sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[norm(w[2].strip()) for w in mh], autojunk=False)
        for blk in sm.get_matching_blocks():
            if blk.size >= 3:
                for k in range(blk.size):
                    if blk.a + k:
                        d = abs(out[blk.a + k][1] - mh[blk.b + k][0])
                        if d > worst[0]:
                            worst = (d, '%s: %s' % (sc['scene'], words[blk.a + k]))
        scenes.append({'scene': sc['scene'], 'heard': ''.join(w[2] for w in heard).strip(),
                       'words': out, 'whisper': heard})
        print('heard %-20s %3d words; whisper: %s' % (sc['scene'], len(words), scenes[-1]['heard']))
    if worst[0] > 1.0:
        sys.exit('the aligner and whisper disagree by %.2f s at %s: check the read' % worst)
    print('the aligner and whisper agree within %.2f s (largest at %s)' % worst)
    return {
        '_about': ('When each word of %s begins, heard %s. `words` is the scene text as the voice read it, each '
                   'word with its onset and end in the track (seconds): a forced alignment (CTC) of the text against '
                   'the scene\'s clip, and after a pause (%.1f s or more, %d dB under the peak) the moment the voice '
                   'resumes. `whisper` is what faster-whisper heard, raw: [start, end, word, probability]; its times '
                   'run early, so they check the alignment rather than set it. cues.py --listen writes this file; '
                   'cues.py pins the cues to it.' % (MP3.name, time.strftime('%Y-%m-%d'), PAUSE_S, QUIET_DB)),
        'audio': MP3.name, 'sha256': sha256(MP3), 'heard_on': time.strftime('%Y-%m-%d'),
        'hearing': dict(HEAR, engine='faster-whisper %s, ctranslate2 %s, CPU' % (faster_whisper.__version__, ctranslate2.__version__)),
        'alignment': dict(ALIGN, engine='onnxruntime %s, CTC Viterbi over letters, blank <pad>' % ort.__version__, say=SAY),
        'scenes': scenes}


def pin(spec, layout, heard):
    """Resolve each scene's cues to anchors; return the rows of the report."""
    spans, rows = spans_of(spec), []
    assert len(spans) == len(layout['scenes']) == len(spec['scenes']) == len(heard['scenes'])
    for sc, lay, hs, (f0, f1) in zip(spec['scenes'], layout['scenes'], heard['scenes'], spans):
        if sc.get('pending'):
            # nothing heard, nothing pinned: the picture keeps the film's pace until the scene is read
            lay['anchors'] = []
            rows += [(sc['scene'], c['why'], c['word'], float('nan'), lay['start'] + c['at'], lay['start'] + c['at'], True)
                     for c in sc.get('cues', [])]
            continue
        assert [w[0] for w in hs['words']] == sc['text'].split(), '%s: the words file was heard from other text' % sc['scene']
        toks = [norm(w[0]) for w in hs['words']]
        cues = []
        for c in sc.get('cues', []):
            ph = [norm(p) for p in c['word'].split()]
            hits = [i for i in range(len(toks) - len(ph) + 1) if toks[i:i + len(ph)] == ph]
            if len(hits) != 1:
                sys.exit('%s: "%s" occurs %d times in the scene; a cue names its word once' % (sc['scene'], c['word'], len(hits)))
            if not 0 < c['at'] < f1 - f0:
                sys.exit('%s: cue at %s lies outside the scene' % (sc['scene'], c['at']))
            cues.append(dict(c, said=hs['words'][hits[0]][1]))
        pins = sorted([c for c in cues if not c.get('skip')], key=lambda c: c['at'])
        for a, b in zip(pins, pins[1:]):
            if not (a['at'] < b['at'] and a['said'] < b['said']):
                sys.exit('%s: "%s" and "%s" come in one order in the picture and the other in the narration; '
                         'a clock cannot reorder them, so skip one' % (sc['scene'], a['word'], b['word']))
        # the clamp: the earlier cue moves earlier; if the scene's start then gets in the way, it moves later
        nxt = (lay['end'], f1 - f0)
        for c in reversed(pins):
            c['t'] = min(c['said'], nxt[0] - MIN_STRETCH * (nxt[1] - c['at']))
            nxt = (c['t'], c['at'])
        prv = (lay['start'], 0.0)
        for c in pins:
            c['t'] = max(c['t'], prv[0] + MIN_STRETCH * (c['at'] - prv[1]))
            prv = (c['t'], c['at'])
        knots = [(lay['start'], 0.0)] + [(c['t'], c['at']) for c in pins] + [(lay['end'], f1 - f0)]
        for (ta, fa), (tb, fb) in zip(knots, knots[1:]):
            if tb - ta < MIN_STRETCH * (fb - fa) - 1e-9:
                sys.exit('%s: the cues ask for more picture than the narration has room for; skip one' % sc['scene'])
        lay['anchors'] = [{'at': c['at'], 't': round(c['t'], 3), 'said': c['said'], 'word': c['word']} for c in pins]
        uniform = (lay['end'] - lay['start']) / (f1 - f0)

        def now(at):
            for (ta, fa), (tb, fb) in zip(knots, knots[1:]):
                if at <= fb:
                    return ta + (at - fa) / (fb - fa) * (tb - ta)
        for c in sorted(cues, key=lambda c: c['at']):
            rows.append((sc['scene'], c['why'], c['word'], c['said'], lay['start'] + c['at'] * uniform,
                         c['t'] if 't' in c else now(c['at']), bool(c.get('skip'))))
    return rows


spec = json.loads(SPEC.read_text(encoding='utf8'))
layout = json.loads(LAYOUT.read_text(encoding='utf8'))
if '--listen' in sys.argv:
    # one word to a line: a list of plain values stays on one line
    text = json.dumps(listen(spec, layout), ensure_ascii=False, indent=1)
    WORDS.write_text(re.sub(r'\[\s*([^\[\]{}]*?)\s*\]', lambda m: '[%s]' % re.sub(r',\s+', ', ', m.group(1)), text) + '\n',
                     encoding='utf8')
    print('wrote', WORDS.relative_to(HERE.parent.parent))
heard = json.loads(WORDS.read_text(encoding='utf8'))
if heard['sha256'] != sha256(MP3):
    sys.exit('%s was heard from another read of %s: run cues.py --listen' % (WORDS.name, MP3.name))
rows = pin(spec, layout, heard)
LAYOUT.write_text(json.dumps(layout, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
print('%-20s %-58s %-34s %7s %7s %7s %6s' % ('scene', 'reveal', 'cue', 'word', 'was', 'now', 'gap'))
for scene, why, word, said, was, now_, skip in rows:
    print('%-20s %-58s %-34s %7.2f %7.2f %7.2f %+6.2f%s' % (scene, why[:58], word[:34], said, was, now_, now_ - said,
                                                          '  (skipped)' if skip else ''))
pinned = [r for r in rows if not r[6]]
print('%d cues pinned, %d skipped; largest move %.2f s; wrote %s' % (
    len(pinned), len(rows) - len(pinned), max(abs(r[5] - r[3]) for r in pinned), LAYOUT.relative_to(HERE.parent.parent)))
