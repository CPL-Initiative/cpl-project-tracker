#!/usr/bin/env python3
"""kb/_live_read_expand.py: a compact live read expands to keep-better's shape only when it checks out (S742).

    python3 tests/live_read_expand_test.py

The conductor's live read comes back compact: live_runs grouped by run, with each college's row count and the md5 of
its "<cn>:<run>" pairs. The round trip is pinned on a real read, the conductor's whole read of seven colleges
(kb/receipts/program_requirements_reread_s742_readers_checked.json, 12:46Z): grouped by run and summed here as the
SQL does it, the expansion gives back the same live_runs, control number for control number. Then each refusal: a
control number under two runs, a dropped control number (the count and the md5 both catch it), an altered run (the
md5 alone catches it), a bad control number or run, a checked number with no live row, and a value in another form.
Pure stdlib.
"""
import copy
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _live_read_expand as X  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def refused(value):
    try:
        X.expand(value)
    except ValueError as exc:
        return str(exc)
    return None


with open(os.path.join(ROOT, "kb", "receipts", "program_requirements_reread_s742_readers_checked.json"),
          encoding="utf-8") as fh:
    WHOLE = json.load(fh)


def compact_of(whole):
    """The whole read in the compact form, built as the SQL builds it."""
    out = {"what": whole["what"], "form": "compact-by-run", "read_at": whole["read_at"], "count": {}, "md5": {},
           "by_college": copy.deepcopy(whole["by_college"]), "live_runs": {}}
    for college, runs in whole["live_runs"].items():
        by_run = {}
        for cn in sorted(runs):
            by_run.setdefault(runs[cn], []).append(cn)
        out["live_runs"][college] = {run: ",".join(cns) for run, cns in by_run.items()}
        out["count"][college] = len(runs)
        out["md5"][college] = hashlib.md5(",".join("%s:%s" % (cn, runs[cn]) for cn in sorted(runs))
                                          .encode("ascii")).hexdigest()
    return out


COMPACT = compact_of(WHOLE)
got = X.expand(COMPACT)
check(len(WHOLE["live_runs"]) == 7 and sum(len(v) for v in WHOLE["live_runs"].values()) > 1000,
      "the real read holds seven colleges and over a thousand live rows")
check(got["live_runs"] == WHOLE["live_runs"] and got["by_college"] == WHOLE["by_college"]
      and got["read_at"] == WHOLE["read_at"],
      "the compact form expands to the same live_runs and checked lists, control number for control number")
size_whole = len(json.dumps(WHOLE["live_runs"], separators=(",", ":")))
size_compact = len(json.dumps(COMPACT["live_runs"], separators=(",", ":")))
check(size_compact < 0.5 * size_whole, "the compact live_runs is under half the whole one's size (%d against %d)"
      % (size_compact, size_whole))

college = "Cuyamaca College"
run, cns = next(iter(COMPACT["live_runs"][college].items()))
first = cns.split(",")[0]

two = copy.deepcopy(COMPACT)
two["live_runs"][college]["99999999999"] = first
check("two runs" in (refused(two) or ""), "a control number under two runs is refused")

dropped = copy.deepcopy(COMPACT)
dropped["live_runs"][college][run] = ",".join(cns.split(",")[1:])
check("counted" in (refused(dropped) or ""), "a dropped control number is refused on the count")
dropped["count"][college] -= 1
check("md5" in (refused(dropped) or ""), "and on the md5 where the count was cut to match")

moved = copy.deepcopy(COMPACT)
moved["live_runs"][college] = {("1" + r if r == run else r): v for r, v in moved["live_runs"][college].items()}
check("md5" in (refused(moved) or ""), "an altered run is refused on the md5")

for label, edit in (("a control number that is not five digits", lambda v: v["live_runs"][college].update(
                        {run: cns.replace(first, first[:4], 1)})),
                    ("a run that is not digits", lambda v: v["live_runs"][college].update({"4600x": "00001"}))):
    bad = copy.deepcopy(COMPACT)
    edit(bad)
    check("ASCII digits" in (refused(bad) or ""), "%s is refused" % label)

chk = copy.deepcopy(COMPACT)
chk["by_college"][college] = ["00000"]
check("no live row" in (refused(chk) or ""), "a checked control number with no live row is refused")
one = copy.deepcopy(COMPACT)
one["by_college"][college] = [first]
check(X.expand(one)["by_college"][college] == [first], "a checked control number with a live row is kept")

check("compact-by-run" in (refused(WHOLE) or ""), "a read in the whole form is refused: it is not compact")
short = copy.deepcopy(COMPACT)
del short["md5"][college]
check("different colleges" in (refused(short) or ""), "a college with no md5 is refused")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
