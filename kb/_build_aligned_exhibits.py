#!/usr/bin/env python3
"""Standalone (re-runnable) generator for ``unified_courses_aligned.js`` — the CCR
inverse view's lazy data file (``window.CPL_UC_ALIGNED``).

The CCR inverse view is the mirror of the EACR: instead of one row per credential
listing the courses it articulates to, it shows — when a CCR (Common Course
Reference) row is expanded — the aligned exhibits/credentials that articulate to
that one course. The data is a pivot of ``kb/coci_articulations.json`` by course
identity (``course_id``).

This script imports the producer from ``excel_to_dashboard.py`` and writes the SAME
file the daily ``export_unified_courses()`` writes, so the committed artifact is
byte-identical to the daily regen and the feature is live on merge (not next-cron).
Reads ``kb/coci_articulations.json`` only; deterministic (no timestamp) so a later
daily regen is a no-op diff. Run from the repo root:

    python3 kb/_build_aligned_exhibits.py
"""
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO)

import excel_to_dashboard as E  # noqa: E402  (path set above)

n = E._write_aligned_exhibits_js(E.SCRIPT_DIR)
if n is None:
    print("kb/coci_articulations.json absent — nothing written")
    sys.exit(1)
print(f"wrote {os.path.join(E.SCRIPT_DIR, 'unified_courses_aligned.js')} "
      f"— {n} courses with aligned exhibits")
