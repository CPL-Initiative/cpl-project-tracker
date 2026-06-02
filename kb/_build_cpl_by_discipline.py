#!/usr/bin/env python3
"""Standalone (re-runnable) generator for ``kb/discipline_cpl_rollup.json`` — the
Common Subjects Reference (CSR) tab's CPL-opportunities rollup.

The CSR rollup is the discipline grain of the CER/EACR · CCR · CSR "three grains"
family: for each discipline, how many distinct exhibits/credentials articulate to
its courses, across how many colleges. The data is a rollup of
``kb/coci_articulations.json`` by discipline (discipline sourced from the committed
minted catalogs).

This script imports the producer from ``excel_to_dashboard.py`` and writes the SAME
file the daily ``export_unified_courses()`` writes, so the committed artifact is
byte-identical to the daily regen and the feature is live on merge (not next-cron).
Deterministic (sorted keys, no timestamp). Run from the repo root:

    python3 kb/_build_cpl_by_discipline.py
"""
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO)

import excel_to_dashboard as E  # noqa: E402  (path set above)

n = E._write_cpl_by_discipline_json(E.SCRIPT_DIR)
if n is None:
    print("kb/coci_articulations.json or minted catalogs absent — nothing written")
    sys.exit(1)
print(f"wrote {os.path.join(E.SCRIPT_DIR, 'kb', 'discipline_cpl_rollup.json')} "
      f"— {n} disciplines with CPL opportunities")
