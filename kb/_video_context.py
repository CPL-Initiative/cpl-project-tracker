#!/usr/bin/env python3
"""Watch a screen recording locally — frames, a transcript, and one index tying them together.

WHY THIS EXISTS (Session 234, 2026-09-06)
-----------------------------------------
Sam pointed a cloud session at a screen recording under
`…/CCCCO/Claude Prompts/` and asked it to watch. It could not, for two reasons
worth recording so nobody re-derives them:

  * The file is on his Windows machine. A cloud container is a DIFFERENT
    machine — there is no mount, and the video is not in Google Drive.
  * The egress proxy denies `onedrive.live.com`, `rccd-my.sharepoint.com` and
    `drive.google.com`, so the bytes cannot be pulled in either. It also denies
    `openaipublic.azureedge.net` and `huggingface.co`, and THAT is the fact
    that settles it: even holding the file, a cloud container cannot fetch
    Whisper's weights, so the AUDIO is unreachable there in principle. Frames
    alone would have worked — ffmpeg installs fine from the imageio-ffmpeg
    wheel — but the narration is usually the point.

⚠️ The prior session concluded "the cloud cannot do video." Half right. ffmpeg
is available there; what is missing is the file and the model weights. The
distinction matters the next time someone reaches for a cloud session.

WHY NOT THE OFF-THE-SHELF PLUGIN
--------------------------------
`bradautomates/claude-video` and `jordanrendric/claude-video-vision` do the
mechanical work well. The popular one transcribes by shipping the audio to Groq
or OpenAI. For a recording of SkyView taken from an RCCD SharePoint folder —
student detail, unpublished CO policy, the funding model, staff names — sending
it to a third party is a disclosure decision, not a default. Everything here
runs on the machine that already holds the video.

WHAT IT PRODUCES
----------------
    <out>/YYYYMMDD_<slug>_INDEX.md        ← read this one; it points at the rest
    <out>/YYYYMMDD_<slug>_transcript.md   timestamped plain text
    <out>/YYYYMMDD_<slug>_transcript.srt  for players and for re-import
    <out>/frames/frame_0007_t83.20.png    stills, named by their timestamp

The INDEX interleaves speech and stills in time order, so a session reads ONE
file and opens only the frames the words make interesting. The date-code prefix
follows the vault naming convention; frames are working files and skip it.

DESIGN NOTES THAT ARE NOT OBVIOUS
---------------------------------
  * ffmpeg comes from the `imageio-ffmpeg` wheel when it is not on PATH. That
    is a pip install rather than winget/choco plus PATH surgery, which is what
    makes this work the same way on Sam's Windows box and a teammate's Mac.
  * Scene timestamps are parsed from ffmpeg's stderr, NOT written with
    `metadata=print:file=`. On Windows that filter option swallows the `C:`
    drive colon as a filtergraph separator and the run dies. Reading stderr has
    no path in the filtergraph at all.
  * Frames are cut one `-ss`-before-`-i` invocation each. A single select pass
    is fewer processes but cannot name a file after the timestamp it landed on,
    and input seek makes each cut a few tens of milliseconds.

The planning and formatting halves are pure functions with no ffmpeg and no
network, which is what `tests/video_context_test.py` pins.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import os
import re
import shutil
import subprocess
import sys

SCENE_THRESHOLD = 0.15
MAX_FRAMES = 80
MIN_GAP_S = 1.5


# ─────────────────────────── pure helpers (tested) ───────────────────────────

def slugify(name: str) -> str:
    """A filename-safe, lowercase slug — the video's stem becomes the run's name."""
    s = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return re.sub(r"-{2,}", "-", s) or "video"


def deliverable_name(stamp: str, slug: str, suffix: str) -> str:
    """`YYYYMMDD_<slug>_<suffix>` — the vault convention, applied in one place."""
    return f"{stamp}_{slug}_{suffix}"


def hhmmss(seconds: float) -> str:
    total = max(0, int(seconds))
    return f"{total // 3600:02d}:{(total % 3600) // 60:02d}:{total % 60:02d}"


def srt_timestamp(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    ms = int(round((seconds - int(seconds)) * 1000))
    base = int(seconds)
    if ms == 1000:  # rounding carried into the next second
        base, ms = base + 1, 0
    return f"{base // 3600:02d}:{(base % 3600) // 60:02d}:{base % 60:02d},{ms:03d}"


def _enforce_gap(times, gap):
    out = []
    for t in sorted(times):
        if not out or t - out[-1] >= gap:
            out.append(t)
    return out


def _thin(times, k):
    """Keep k items, evenly spaced across the list, order preserved."""
    if k <= 0:
        return []
    if len(times) <= k:
        return list(times)
    step = len(times) / k
    return [times[min(len(times) - 1, int(i * step))] for i in range(k)]


def plan_frames(duration_s, scene_times, max_frames=MAX_FRAMES, min_gap_s=MIN_GAP_S):
    """Choose which timestamps to cut.

    Screen recordings sit still and then jump, so scene changes are the right
    signal — but a recording of someone reading a page produces almost none, and
    a fade produces a burst. So: drop near-duplicates, top up with uniform
    samples when the scene signal is thin, always keep an opening frame, and cap
    the total.
    """
    if duration_s <= 0:
        return []
    floor_n = max(8, min(max_frames, int(duration_s // 20)))
    picked = _enforce_gap([t for t in scene_times if 0 <= t <= duration_s], min_gap_s)
    if len(picked) < floor_n:
        uniform = [duration_s * (i + 0.5) / floor_n for i in range(floor_n)]
        picked = _enforce_gap(picked + uniform, min_gap_s)
    opening = min(0.5, duration_s / 2)
    if not picked or picked[0] > min_gap_s:
        picked = _enforce_gap([opening] + picked, min_gap_s)
    picked = _thin(picked, max_frames)
    return [round(t, 2) for t in picked]


def frame_filename(index: int, t: float) -> str:
    return f"frame_{index:04d}_t{t:07.2f}.png"


def build_srt(segments) -> str:
    out = []
    for i, seg in enumerate(segments, 1):
        out.append(
            f"{i}\n{srt_timestamp(seg['start'])} --> {srt_timestamp(seg['end'])}\n"
            f"{seg['text'].strip()}\n"
        )
    return "\n".join(out)


def build_transcript_md(segments, title) -> str:
    lines = [f"# Transcript — {title}", ""]
    if not segments:
        lines.append("_No speech transcribed._")
        return "\n".join(lines) + "\n"
    for seg in segments:
        lines.append(f"**[{hhmmss(seg['start'])}]** {seg['text'].strip()}")
        lines.append("")
    return "\n".join(lines)


def build_index(segments, frames, meta) -> str:
    """Interleave speech and stills in time order — the file a session reads first."""
    lines = [
        f"# Video context — {meta['title']}",
        "",
        f"- Source: `{meta['source']}`",
        f"- Duration: {hhmmss(meta['duration'])} · {len(frames)} frames"
        f" · {len(segments)} spoken segments",
        f"- Transcription: {meta['asr']}",
        f"- Extracted: {meta['stamp']} (all processing local)",
        "",
        "Read top to bottom. Each frame line is a still on disk — open it with",
        "Read when the words around it need a picture. Timestamps line the two up.",
        "",
        "---",
        "",
    ]
    events = [("frame", t, f) for t, f in frames]
    events += [("say", s["start"], s) for s in segments]
    events.sort(key=lambda e: (e[1], 0 if e[0] == "frame" else 1))
    for kind, t, payload in events:
        if kind == "frame":
            lines.append(f"`[{hhmmss(t)}]` — frame `frames/{payload}`")
        else:
            lines.append(f"**[{hhmmss(t)}]** {payload['text'].strip()}")
        lines.append("")
    if not events:
        lines.append("_Nothing extracted — check that the file has video and audio._")
        lines.append("")
    return "\n".join(lines)


# ────────────────────────────── ffmpeg plumbing ──────────────────────────────

def find_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit(
            "ffmpeg not found. Either install it, or:  pip install imageio-ffmpeg\n"
            "(the wheel ships a static binary — no PATH changes needed)"
        )


def _run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, errors="replace")


def probe_duration(ffmpeg, path) -> float:
    err = _run([ffmpeg, "-i", path]).stderr
    m = re.search(r"Duration:\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)", err)
    if not m:
        sys.exit(f"Could not read a duration from {path!r}. Is it a video file?")
    h, mnt, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mnt * 60 + s


def scene_timestamps(ffmpeg, path, threshold=SCENE_THRESHOLD):
    """Scene-change times, parsed from stderr — no file path inside the filtergraph."""
    res = _run([
        ffmpeg, "-nostdin", "-i", path,
        "-vf", f"select='gt(scene,{threshold})',metadata=print",
        "-an", "-f", "null", "-",
    ])
    return [float(x) for x in re.findall(r"pts_time:(\d+(?:\.\d+)?)", res.stderr)]


def cut_frames(ffmpeg, path, times, frames_dir):
    os.makedirs(frames_dir, exist_ok=True)
    cut = []
    for i, t in enumerate(times, 1):
        name = frame_filename(i, t)
        res = _run([
            ffmpeg, "-nostdin", "-y", "-ss", f"{t:.2f}", "-i", path,
            "-frames:v", "1", "-q:v", "2", os.path.join(frames_dir, name),
        ])
        if res.returncode == 0 and os.path.exists(os.path.join(frames_dir, name)):
            cut.append((t, name))
    return cut


def extract_audio(ffmpeg, path, wav_path) -> bool:
    res = _run([
        ffmpeg, "-nostdin", "-y", "-i", path,
        "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav_path,
    ])
    return res.returncode == 0 and os.path.exists(wav_path)


def transcribe(wav_path, model_size):
    """Local faster-whisper. Returns (segments, description-of-what-ran)."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return [], "skipped — faster-whisper not installed (pip install faster-whisper)"
    try:
        model = WhisperModel(model_size, device="auto", compute_type="int8")
        segments, _info = model.transcribe(wav_path, vad_filter=True)
        out = [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in segments if (s.text or "").strip()
        ]
        return out, f"faster-whisper {model_size}, local"
    except Exception as exc:  # model download blocked, bad audio, no memory
        return [], f"failed — {type(exc).__name__}: {exc}"


# ─────────────────────────────────── main ────────────────────────────────────

def main(argv=None):
    ap = argparse.ArgumentParser(description="Extract frames + a local transcript from a video.")
    ap.add_argument("video", help="path to the video file")
    ap.add_argument("--out", help="output directory (default: .video-context/<slug>/)")
    ap.add_argument("--model", default="small",
                    help="faster-whisper model: tiny/base/small/medium/large-v3 (default small)")
    ap.add_argument("--max-frames", type=int, default=MAX_FRAMES)
    ap.add_argument("--scene-threshold", type=float, default=SCENE_THRESHOLD)
    ap.add_argument("--no-audio", action="store_true", help="frames only, skip transcription")
    args = ap.parse_args(argv)

    video = os.path.abspath(os.path.expanduser(args.video))
    if not os.path.exists(video):
        sys.exit(f"No such file: {video}")

    slug = slugify(os.path.splitext(os.path.basename(video))[0])
    stamp = _dt.date.today().strftime("%Y%m%d")
    out_dir = os.path.abspath(args.out) if args.out else os.path.join(".video-context", slug)
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(out_dir, exist_ok=True)

    ffmpeg = find_ffmpeg()
    print(f"ffmpeg: {ffmpeg}")

    duration = probe_duration(ffmpeg, video)
    print(f"duration: {hhmmss(duration)}")

    print("finding scene changes…")
    scenes = scene_timestamps(ffmpeg, video, args.scene_threshold)
    times = plan_frames(duration, scenes, args.max_frames)
    print(f"  {len(scenes)} scene changes -> {len(times)} frames")

    print("cutting frames…")
    frames = cut_frames(ffmpeg, video, times, frames_dir)
    print(f"  {len(frames)} written to {frames_dir}")

    segments, asr = [], "skipped (--no-audio)"
    if not args.no_audio:
        wav = os.path.join(out_dir, "audio.wav")
        print("extracting audio…")
        if extract_audio(ffmpeg, video, wav):
            print(f"transcribing locally ({args.model})… first run downloads the model")
            segments, asr = transcribe(wav, args.model)
            print(f"  {len(segments)} segments — {asr}")
            try:
                os.remove(wav)
            except OSError:
                pass
        else:
            asr = "failed — no audio stream found"
            print(f"  {asr}")

    meta = {
        "title": os.path.basename(video), "source": video, "duration": duration,
        "asr": asr, "stamp": stamp,
    }
    written = []
    for suffix, text in (
        (f"{deliverable_name(stamp, slug, 'INDEX.md')}", build_index(segments, frames, meta)),
        (f"{deliverable_name(stamp, slug, 'transcript.md')}",
         build_transcript_md(segments, meta["title"])),
    ):
        p = os.path.join(out_dir, suffix)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(text)
        written.append(p)
    if segments:
        p = os.path.join(out_dir, deliverable_name(stamp, slug, "transcript.srt"))
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(build_srt(segments))
        written.append(p)

    print("\nwrote:")
    for p in written:
        print(f"  {p}")
    print(f"\nStart here: {written[0]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
