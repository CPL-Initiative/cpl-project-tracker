#!/usr/bin/env python3
"""The frame planner has to survive both kinds of screen recording.

Scene detection is the right signal for a screen capture — the picture sits
still and then jumps — but it fails in opposite directions at both ends, and
both failures are silent:

  * A recording of someone reading one page produces almost NO scene changes.
    Taken literally, a twenty-minute walkthrough yields one frame, and the
    session reviewing it sees a title card and nothing else.
  * A fade, a spinner or a video embedded in the page produces a BURST. Taken
    literally, the whole frame budget is spent inside three seconds of
    animation and the remaining nineteen minutes go unsampled.

So `plan_frames` tops up a thin signal with uniform samples and drops
near-duplicates below a minimum gap. Neither correction announces itself; each
test below fails if its correction is deleted.

The date-code check guards the vault's mandatory `YYYYMMDD_` prefix, which is
easy to lose in a refactor and produces files that are wrong only by convention
— nothing errors, they just stop sorting with everything else.

Pure stdlib, no network, no ffmpeg.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from kb._video_context import (  # noqa: E402
    build_index, deliverable_name, device_plan, frame_filename, plan_frames,
    srt_timestamp,
)

FAILURES = []


def check(label, cond, detail=""):
    if cond:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label} {detail}")
        FAILURES.append(label)


def test_thin_scene_signal_is_topped_up():
    """A 20-minute read-through with two scene changes must not yield two frames."""
    times = plan_frames(duration_s=1200, scene_times=[3.0, 900.0])
    check("thin signal tops up", len(times) >= 8, f"got {len(times)}")
    check("top-up spans the video", max(times) > 600, f"max {max(times)}")


def test_burst_does_not_eat_the_budget():
    """A 3-second animation emits ~60 scene changes; they must not crowd out the rest."""
    burst = [10.0 + i * 0.05 for i in range(60)]
    times = plan_frames(duration_s=600, scene_times=burst)
    inside = [t for t in times if 9.0 <= t <= 13.5]
    check("burst is collapsed", len(inside) <= 4, f"{len(inside)} frames in the burst")
    gaps = [b - a for a, b in zip(times, times[1:])]
    check("minimum gap holds", not gaps or min(gaps) >= 1.5 - 1e-6,
          f"min gap {min(gaps) if gaps else 'n/a'}")


def test_cap_is_respected():
    dense = [i * 2.0 for i in range(500)]
    times = plan_frames(duration_s=1000, scene_times=dense, max_frames=25)
    check("cap respected", len(times) <= 25, f"got {len(times)}")


def test_opening_frame_and_degenerate_inputs():
    times = plan_frames(duration_s=300, scene_times=[240.0])
    check("opening frame exists", times and times[0] <= 1.5, f"first {times[:1]}")
    check("zero duration is empty", plan_frames(0, [1.0]) == [])
    check("no scenes still samples", len(plan_frames(120, [])) >= 6)


def test_frames_sort_lexically_in_time_order():
    names = [frame_filename(i, t) for i, t in enumerate([0.5, 9.0, 83.2, 600.0], 1)]
    check("frame names sort by time", names == sorted(names), str(names))


def test_srt_timestamp_carries_rounding():
    check("srt formats", srt_timestamp(83.2) == "00:01:23,200", srt_timestamp(83.2))
    check("srt rounds up cleanly", srt_timestamp(1.9999) == "00:00:02,000",
          srt_timestamp(1.9999))
    check("srt clamps negatives", srt_timestamp(-5) == "00:00:00,000")


def test_index_interleaves_in_time_order():
    segments = [{"start": 5.0, "end": 7.0, "text": "the welding cluster"},
                {"start": 95.0, "end": 97.0, "text": "and hide breaks here"}]
    frames = [(0.5, "frame_0001_t0000.50.png"), (90.0, "frame_0002_t0090.00.png")]
    md = build_index(segments, frames, {
        "title": "v.mp4", "source": "/tmp/v.mp4", "duration": 120.0,
        "asr": "faster-whisper small, local", "stamp": "20260906"})
    order = [md.index(x) for x in
             ("frame_0001", "welding cluster", "frame_0002", "hide breaks")]
    check("index is chronological", order == sorted(order), str(order))
    check("frames are referenced by path", "frames/frame_0002_t0090.00.png" in md)


def test_every_device_plan_ends_somewhere_without_a_gpu():
    """A GPU-first plan must degrade to CPU, not lose the transcript.

    Sam's first real run died on `Library cublas64_12.dll is not found`:
    faster-whisper's device="auto" selects CUDA whenever an NVIDIA GPU is
    visible, and a work laptop normally has the GPU without the CUDA runtime.
    Frames survived; the narration — the part he said mattered — did not.
    """
    for device in ("cpu", "cuda", "auto"):
        plan = device_plan(device)
        check(f"{device}: plan is non-empty", len(plan) >= 1)
        check(f"{device}: ends on cpu", plan[-1][0] == "cpu", str(plan))
        check(f"{device}: cpu appears once", [d for d, _ in plan].count("cpu") == 1, str(plan))
    check("cpu does not retry itself", device_plan("cpu") == [("cpu", "int8")])
    check("cuda is tried before cpu", device_plan("cuda")[0][0] == "cuda")
    check("auto still falls back", len(device_plan("auto")) == 2)


def test_deliverables_carry_the_date_code():
    name = deliverable_name("20260906", "video-project-2", "video-index.md")
    check("date-code prefix", name.startswith("20260906_"), name)
    check("full shape", name == "20260906_video-project-2_video-index.md", name)


if __name__ == "__main__":
    print("video-context frame planner + formatting")
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        fn()
    if FAILURES:
        print(f"\n{len(FAILURES)} check(s) failed")
        raise SystemExit(1)
    print("\nall checks passed")
