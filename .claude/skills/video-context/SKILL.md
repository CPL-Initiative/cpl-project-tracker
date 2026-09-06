---
name: video-context
description: Watch a video — a screen recording, a demo, a walkthrough, a meeting capture — by extracting scene-aware frames and a locally-transcribed narration, then reading them together. Use whenever a task points at an .mp4/.mov/.mkv/.webm file, or asks what someone said or showed in a recording, or hands over a bug report or UI review as a screen capture. Runs entirely on the machine holding the file: no audio, frames or file contents leave it. Triggers on "watch this video", "screen recording", "what did he say in the video", "analyze this recording", "transcribe", "the mp4", "walkthrough", "screen capture", "video of the bug".
---

# Watch a video without sending it anywhere

`kb/_video_context.py` cuts a recording into scene-aware stills and a timestamped
transcript, then writes ONE index that interleaves them. You read the index,
then open only the frames the words make interesting.

## Run it

⚠️ **On Windows the interpreter is `python`, not `python3`.** `python3` hits the
Microsoft Store app-execution alias and dies with "Python was not found" even
when Python is installed and on PATH. And the script path is relative, so **run
from the repo root** — from anywhere else `kb/_video_context.py` does not exist.

```powershell
cd "C:\Users\samuel.lee\Documents\GitHub\cpl-project-tracker"
git pull
pip install imageio-ffmpeg faster-whisper          # one time
python kb\_video_context.py "C:\Users\samuel.lee\Riverside Community College District\California MAP Initiative - Documents\CCCCO\Claude Prompts\Video Project 2.mp4"
```

macOS or Linux, same thing:

```bash
cd ~/GitHub/cpl-project-tracker
pip install imageio-ffmpeg faster-whisper
python3 kb/_video_context.py "<path to the video>"
```

Paths with spaces are fine on either — quote them, as above.

Output lands in `.video-context/<slug>/` (gitignored) unless you pass `--out`:

```
20260906_video-project-2_video-index.md  ← read this first
20260906_video-project-2_transcript.md   timestamped plain text
20260906_video-project-2_transcript.srt  for players and re-import
frames/frame_0007_t0083.20.png           stills, named by timestamp
```

Useful flags: `--device cpu|cuda|auto` (default `cpu` — see the cuBLAS note
below before reaching for `cuda`), `--model tiny|base|small|medium|large-v3` (default `small`;
`tiny` is roughly four times faster and noticeably worse on proper nouns),
`--max-frames N` (default 80), `--no-audio` for frames only,
`--scene-threshold` (default 0.15 — lower catches subtler cuts).

## Then read it

1. Read the `_video-index.md`. It is chronological: every spoken line and every frame
   in the order they happened.
2. Open frames with Read where the narration turns specific — "this is broken",
   "look at this count", "that should say". Those are the moments the words
   alone do not settle.
3. Quote the timestamp when you report a finding, so the reviewer can jump
   straight to it in the source video.

You do not need to open all 80 frames. The index exists so you can choose.

## ⚠️ This has to run where the file lives

A cloud session cannot do this, and the reason is worth knowing so nobody
retries it:

- The file sits on a local machine; a cloud container is a different machine,
  with no mount.
- The egress proxy denies `onedrive.live.com`, `rccd-my.sharepoint.com` and
  `drive.google.com`, so the bytes cannot be pulled in either.
- It also denies `huggingface.co` and `openaipublic.azureedge.net`, so a cloud
  container cannot fetch Whisper's weights. **The audio is unreachable there in
  principle**, whatever else changes.

ffmpeg itself DOES work in the cloud (the `imageio-ffmpeg` wheel is a static
binary and PyPI is reachable), so "the cloud cannot do video" is too strong —
what is missing is the file and the model weights. Run this in local Claude Code
or local Cowork, with folder access granted to the folder holding the video.

**To hand the result to a cloud session**, commit the index, the transcript and
the frames to the working branch and push. GitHub is reachable from a cloud
container, and it can Read both markdown and PNGs. Frames are gitignored by
default, so add them deliberately:

```bash
git add -f .video-context/<slug>/20260906_*_video-index.md \
           .video-context/<slug>/20260906_*_transcript.md \
           .video-context/<slug>/frames
```

## ⚠️ Why not the off-the-shelf plugin

`bradautomates/claude-video` and `jordanrendric/claude-video-vision` do the same
mechanical work, and the popular one transcribes by shipping the audio to Groq
or OpenAI. For a recording of COBI, SkyView or a MAP walkthrough — student
detail, unpublished CO policy, the funding model, staff names on screen — that
is a disclosure decision, not a default, and it belongs with Governance and the
privacy ADRs rather than a plugin's setup wizard. This skill exists so the
question does not come up per-recording.

Use those plugins freely for public material. Not for anything out of the RCCD
or CCCCO folders.

## Conventions this already honors

- Transcripts and indexes carry the mandatory `YYYYMMDD_` date-code prefix.
  Frames are working files and skip it.
- `.video-context/` is gitignored, so a 200-frame run never lands in a commit by
  accident.
- Deliverable naming lives in one function (`deliverable_name`), guarded by
  `tests/video_context_test.py`.

## When it misbehaves

- **One frame from a long video.** The recording barely changes; raise the
  sample floor with `--scene-threshold 0.05`, or force coverage with
  `--max-frames 120`.
- **Frames all bunched in a few seconds.** An animation or embedded video is
  emitting scene changes. Raise `--scene-threshold`.
- **`Library cublas64_12.dll is not found`** (or any cuBLAS/cuDNN load error).
  A CUDA-capable GPU is present but the CUDA runtime is not installed. The
  default device is `cpu` precisely so this cannot happen; you only see it if
  you passed `--device cuda` or `--device auto`. Drop the flag. CPU with `int8`
  transcribes several times faster than realtime and needs nothing installed.
- **Transcript empty, `asr` says the model failed.** First run downloads weights
  from HuggingFace — check the machine can reach it, then re-run. The
  unauthenticated-request warning from the Hub is normal and not an error.
- **`ffmpeg not found`.** `pip install imageio-ffmpeg`. Do not install ffmpeg
  system-wide just for this; the wheel needs no PATH changes.
