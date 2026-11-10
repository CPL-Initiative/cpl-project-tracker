#!/usr/bin/env python3
"""The newest committed college identity crosswalk, by path.

`kb/college_identity/` holds one dated folder per baseline (`2026-08-23/`,
`2026-11-10/`), each with the builder's `crosswalk.json`, beside dated notes
whose names also begin with a date (`2026-08-23_test_org_removal.md`). A reader
that names one folder keeps reading it after a re-baseline, with nothing on the
page to say so (COBIx on #3019, 2026-11-10: two builders still opened
2026-08-23). A reader asks here instead.

The rule is the one `funding/_build_funding_performance.py` `_partner_stems()`
already applies: a folder named exactly YYYY-MM-DD that holds `crosswalk.json`;
the newest by name. A dated note is no folder and is never picked.
"""
import os
import re

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college_identity")
DATED = re.compile(r"\d{4}-\d{2}-\d{2}")


def latest_crosswalk_date(base=DIR):
    """The newest baseline's folder name, or None when there is none."""
    try:
        dates = sorted(d for d in os.listdir(base)
                       if DATED.fullmatch(d)
                       and os.path.isfile(os.path.join(base, d, "crosswalk.json")))
    except OSError:
        dates = []
    return dates[-1] if dates else None


def latest_crosswalk_path(base=DIR):
    """Path to the newest baseline's crosswalk.json. Raises when none exists:
    a reader with no identity must stop, never build on an empty roster."""
    d = latest_crosswalk_date(base)
    if not d:
        raise SystemExit("No college identity crosswalk under %s (a folder named "
                         "YYYY-MM-DD holding crosswalk.json)." % base)
    return os.path.join(base, d, "crosswalk.json")


if __name__ == "__main__":
    print(latest_crosswalk_path())
