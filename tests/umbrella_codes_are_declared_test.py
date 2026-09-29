#!/usr/bin/env python3
"""Every umbrella discipline's protection must be DATA, not only a literal.

An umbrella discipline legitimately spans several SUBJ4s. The Phase 1e re-mint
(kb/_subj4_dryrun.py) folds same-discipline SUBJ4 variants to the discipline's
canonical code, so a code that is NOT protected gets re-keyed away.

⚠️ WHY THIS EXISTS. Sam, 2026-09-08, on the subject-discipline decision sheet:
"The only one to double check is ATHL, which is in Kinesiology but is
differentiated from KINE which doesn't have the restrictions athletic PE or KIN
course." Checked, and it named a real hazard. The CSR lists ATHL as a
Kinesiology VARIANT carrying 1,468 M-IDs; Session 47 caught the dry-run folding
exactly those rows into KINE ("bursting the KINE M1### 999-seq capacity") and
fixed it with a hard-coded literal inside load_umbrella_allowances().

That literal worked, and it was the ONLY protection: Foreign Languages and both
Agriculture disciplines declare `is_umbrella` + `umbrella_codes` in the CSR,
which the reseeder and the Supabase sync both carry across, and which every CSR
reader can see -- SkyView's subject row included. Kinesiology did not. A
protection that lives in one function's literal is invisible to every other
consumer and disappears with one refactor.

So: both halves are pinned here. The literal must keep protecting ATHL, AND the
CSR must keep declaring it.

Run from repo root:  python3 tests/umbrella_codes_are_declared_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSR = os.path.join(ROOT, "kb", "discipline_canonical_subj4.json")

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))

seed = json.load(open(CSR, encoding="utf-8"))
disc = seed["disciplines"]

spec = importlib.util.spec_from_file_location("dr", os.path.join(ROOT, "kb", "_subj4_dryrun.py"))
dr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dr)
allow = dr.load_umbrella_allowances()

# ── the literal still guards ATHL ──
check("the fold's allowance keeps ATHL out of the KINE fold",
      "ATHL" in (allow.get("Kinesiology") or set()),
      sorted(allow.get("Kinesiology") or []))

# ── and the CSR says so too, so every other reader sees it ──
kin = disc.get("Kinesiology") or {}
check("the CSR declares Kinesiology an umbrella",
      kin.get("is_umbrella") is True)
check("the CSR names ATHL among Kinesiology's umbrella codes",
      "ATHL" in (kin.get("umbrella_codes") or []),
      json.dumps(kin.get("umbrella_codes")))
check("the declaration carries its reason",
      "ATHL" in str(kin.get("_umbrella_note") or ""))

# ⚠️ ATHL must stay a VARIANT too — the point is that it is a real, separate
# code inside Kinesiology, not that it has been moved out of the discipline.
check("ATHL is still recorded as a Kinesiology code, not moved out of it",
      "ATHL" in (kin.get("variants_observed") or {}),
      json.dumps(list((kin.get("variants_observed") or {}).keys())))

# ── every discipline the fold protects should be declared, not only literal ──
# The dry-run's own comment calls the seed declaration the general mechanism.
undeclared = [d for d in allow
              if d in disc and not (disc[d] or {}).get("is_umbrella")]
check("every discipline with a fold allowance declares is_umbrella in the CSR",
      not undeclared, ", ".join(undeclared))

# ── and a declared umbrella must not contradict the fold ──
mismatch = []
for d, e in disc.items():
    if not (e or {}).get("is_umbrella"):
        continue
    declared = set(e.get("umbrella_codes") or [])
    protected = allow.get(d) or set()
    if declared - protected:
        mismatch.append("%s: declared %s not protected" % (d, sorted(declared - protected)))
check("no declared umbrella code is left unprotected by the fold",
      not mismatch, "; ".join(mismatch))

failed = 0
for name, ok, detail in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not detail else "\n      → " + str(detail)))
    if not ok:
        failed += 1
print("\n%d/%d checks passed" % (len(results) - failed, len(results)))
sys.exit(1 if failed else 0)
