#!/usr/bin/env python3
"""frame_verdict (kb/_college_page_read.py, S745): whether another site may show a page in a frame."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb"))
from _college_page_read import frame_verdict  # noqa: E402

CASES = [
    ({}, "allowed"),
    ({"X-Frame-Options": "DENY"}, "blocked"),
    ({"x-frame-options": "sameorigin"}, "blocked"),
    ({"Content-Security-Policy": "default-src 'self'; frame-ancestors 'self'"}, "blocked"),
    ({"content-security-policy": "frame-ancestors 'none'"}, "blocked"),
    ({"content-security-policy": "frame-ancestors *"}, "allowed"),
    ({"content-security-policy": "frame-ancestors https:"}, "allowed"),
    ({"content-security-policy": "default-src 'self'"}, "allowed"),
]
ok = 0
for headers, want in CASES:
    got = frame_verdict(headers)
    if got.startswith(want):
        ok += 1
    else:
        print("FAIL", headers, "->", got)
print("%d/%d checks passed: college page read frame verdict" % (ok, len(CASES)))
sys.exit(0 if ok == len(CASES) else 1)
