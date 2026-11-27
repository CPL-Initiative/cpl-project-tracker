#!/usr/bin/env python3
"""Expand a compact live read into keep-better's --checked shape, after checking it (S742).

The conductor's live read of program_requirement_records comes back compact (the conductor, 2026-11-27): live_runs
grouped by run, {"<college>": {"<run>": "<cn>,<cn>,..."}}, with each college's row count and the md5 of its
"<cn>:<run>" pairs joined by commas in "C" order of control number; by_college (the checked control numbers) stays a
list. kb/_program_reread_keep_better.py reads {"by_college": {college: [cn]}, "live_runs": {college: {cn: run}}}.

This script checks the compact value against itself before anything reads it, and stops on the first disagreement:
a control number under two runs, a control number or run that is not ASCII digits (keep-better's own rule), a count
that is not the number of control numbers, or an md5 that is not the md5 of the pairs rebuilt here. The md5 is the
one the database computed over the live rows, so a value cut short or altered on its way fails here.

    python3 kb/_live_read_expand.py <compact.json> --out kb/receipts/<name>_checked.json

The output keeps what, read_at, count and md5 beside by_college and the expanded live_runs, and names the form it
came from. Guard: tests/live_read_expand_test.py.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys

CN = re.compile(r"[0-9]{5}")
RUN = re.compile(r"[0-9]+")


def expand(compact: dict) -> dict:
    """keep-better's shape from the compact value, or ValueError naming the first disagreement."""
    if compact.get("form") != "compact-by-run":
        raise ValueError("not a compact-by-run live read (form %r)" % compact.get("form"))
    grouped, counts, sums = compact.get("live_runs"), compact.get("count"), compact.get("md5")
    checked = compact.get("by_college")
    if not all(isinstance(x, dict) for x in (grouped, counts, sums, checked)):
        raise ValueError("live_runs, count, md5 and by_college must each be an object keyed by college")
    if not (set(grouped) == set(counts) == set(sums) == set(checked)):
        raise ValueError("live_runs, count, md5 and by_college name different colleges")
    out = {}
    for college, by_run in sorted(grouped.items()):
        runs: dict[str, str] = {}
        for run, cns in (by_run or {}).items():
            if not RUN.fullmatch(str(run)):
                raise ValueError("%s: run %r is not ASCII digits" % (college, run))
            for cn in str(cns).split(",") if cns else []:
                if not CN.fullmatch(cn):
                    raise ValueError("%s: control number %r is not five ASCII digits" % (college, cn))
                if cn in runs:
                    raise ValueError("%s: %s sits under two runs (%s, %s)" % (college, cn, runs[cn], run))
                runs[cn] = str(run)
        if len(runs) != counts[college]:
            raise ValueError("%s: %d control numbers, the read counted %s" % (college, len(runs), counts[college]))
        # "C" order of five ASCII digits is plain string order.
        pairs = ",".join("%s:%s" % (cn, runs[cn]) for cn in sorted(runs))
        got = hashlib.md5(pairs.encode("ascii")).hexdigest()
        if got != sums[college]:
            raise ValueError("%s: the pairs' md5 is %s, the read's %s" % (college, got, sums[college]))
        bad = [cn for cn in checked[college] or [] if not CN.fullmatch(str(cn)) or str(cn) not in runs]
        if bad:
            raise ValueError("%s: checked control numbers with no live row or a bad form: %s" % (college, bad[:5]))
        out[college] = {cn: runs[cn] for cn in sorted(runs)}
    return {"what": compact.get("what"), "read_at": compact.get("read_at"), "expanded_from": "compact-by-run",
            "count": counts, "md5": sums, "by_college": {c: list(checked[c] or []) for c in sorted(checked)},
            "live_runs": out}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("compact")
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)
    with open(args.compact, encoding="utf-8") as fh:
        compact = json.load(fh)
    try:
        value = expand(compact)
    except ValueError as exc:
        print("refused: %s" % exc)
        return 1
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(value, fh, separators=(",", ":"))
        fh.write("\n")
    for college, runs in value["live_runs"].items():
        print("%s: %d live rows, md5 %s, %d checked" % (college, len(runs), value["md5"][college],
                                                       len(value["by_college"][college])))
    print("wrote %s" % args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
