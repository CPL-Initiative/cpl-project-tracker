#!/usr/bin/env python3
"""kb/_seed_canonical_subj4.py (the post-apply chain's csr-seed step) never loses what the committed file carries.

S733, 2026-11-25: the chain's csr-seed step re-seeded kb/discipline_canonical_subj4.json from 246 disciplines to 147.
It enumerated only disciplines with M-ID rows, so the 99 common subjects kb/_csr_assign_codes.py assigned ahead of
any M-ID (source `assigned`, canonical_source csr / c-id: ACCT, INDD and the rest) vanished, with the nightly sync's
_synced_at / _synced_from stamps, _authority_codes and the sync's _notes_by / _notes_at. The daily cron never re-runs
the assigner, so the loss would have stuck.

This runs the real seeder on the committed data into a temp copy of the committed file and checks that every
discipline survives, its common subject and sources are unchanged, every key it carried is still there, and every
top-level key the seeder does not build rides along. The committed file is never written. Pure stdlib.

Run from repo root: python3 tests/csr_seed_keeps_codes_test.py
"""
import contextlib
import importlib.util
import io
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CANON = os.path.join(ROOT, "kb", "discipline_canonical_subj4.json")
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec = importlib.util.spec_from_file_location("seed", os.path.join(ROOT, "kb", "_seed_canonical_subj4.py"))
seed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed)

failures = []


def check(label, cond, detail=""):
    print(("PASS  " if cond else "FAIL  ") + label + (f" ({detail})" if detail and not cond else ""))
    if not cond:
        failures.append(label)


with open(CANON, encoding="utf-8") as f:
    before = json.load(f)

tmp = tempfile.mkdtemp(prefix="csr_seed_keeps_")
try:
    out = os.path.join(tmp, "discipline_canonical_subj4.json")
    shutil.copyfile(CANON, out)
    seed.OUT = out
    with contextlib.redirect_stdout(io.StringIO()):
        seed.main()
    with open(out, encoding="utf-8") as f:
        after = json.load(f)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

bd, ad = before["disciplines"], after["disciplines"]
lost = sorted(set(bd) - set(ad))
check(f"every committed discipline survives the re-seed ({len(bd)} -> {len(ad)})", not lost, f"lost {len(lost)}: {lost[:5]}")

assigned = [d for d, e in bd.items() if e.get("source") == "assigned"]
check("the committed file carries assigned common subjects (the fixture still tests the S733 loss)", len(assigned) > 0)

for field in ("canonical_subj4", "source", "canonical_source", "cid_subject_codes", "ccn_subject_code", "reviewed_by"):
    moved = [d for d in bd if d in ad and bd[d].get(field) != ad[d].get(field)]
    check(f"no discipline's {field} changes", not moved, f"{len(moved)}: {moved[:5]}")

dropped = [(d, k) for d in bd if d in ad for k in bd[d] if k not in ad[d]]
check("no discipline loses a key it carried", not dropped, f"{len(dropped)}: {dropped[:5]}")

for k in ("_synced_at", "_synced_from", "_authority_codes"):
    if k in before:
        check(f"top-level {k} rides along unchanged", after.get(k) == before[k])
missing_top = [k for k in before if k not in after]
check("no top-level key is dropped", not missing_top, str(missing_top))
check("_counts.total_disciplines matches the entries", after["_counts"]["total_disciplines"] == len(ad))

print(f"\n{len(failures)} failure(s)" if failures else "\nall passed")
sys.exit(1 if failures else 0)
