---
title: Render an HTML animation to MP4 from a headless browser
created: 2026-09-25
updated: 2026-09-25
type: methodology
kb-status: published
tags: [methodology, video, headless-chromium, web-audio]
related:
  - "[[cpl_funding_lessons]]"
---

# Render an HTML animation to MP4 from a headless browser

An animation can be turned into a video when every value it draws is a pure function of one clock `T`. Expose `seek(t)`, and the page can be sampled at any moment. Rendering then needs no screen recorder, and every frame is exact.

**Frames.** Launch Chromium with `--remote-debugging-port` and open the page over the DevTools WebSocket (Node 22 has `WebSocket` built in). For each frame, call `Runtime.evaluate` with `seek(f/30)` and capture it with `Page.captureScreenshot`. Headless capture runs at about 15 frames per second at 1920×1080.

**Audio.** Schedule the same Web Audio score into an `OfflineAudioContext` and call `startRendering()`, then encode the result as a WAV. A 90-second stereo WAV is about 29 MB in base64. Returned in one DevTools message, it stalls with no error, so store it on `window` and read it back in 1 MB slices.

**Fonts.** The sandbox can't reach Google Fonts. Fetch the fonts with `npm pack @fontsource/<family>` and load them with `@font-face` from local files.

**Encode.** Playwright's bundled ffmpeg has only VP8. The `imageio-ffmpeg` wheel's binary has libx264 and aac. Encode with `-framerate 30 -i f%05d.jpg -i music.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac`.

A worked example is `prototype/funding_video/render.sh`.
