#!/usr/bin/env python3
"""The exhibit re-analysis's Jev runner, guarded at its failure modes — kb/_exhibit_reanalysis_jev.py.

  * It asks only step 9's two questions (same credential under two names; an issuer that is
    really a training site), and only about what the code checks put in front of it: the
    `shared_mid_same_issuer` pairs and the changed credentials' issuers.
  * A pair the checks flag from both sides is asked once.
  * It carries no gate (the exhibits have no measured one), so nothing it writes reads as a
    suggestion, and a noul answer is kept as the probability it is.
  * A dry run makes no call.

Pure stdlib, no network: Jev is replaced by a recorder. Run: python3 tests/exhibit_reanalysis_jev_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _exhibit_reanalysis_jev as R  # noqa: E402

results = []
def check(name, cond, why=""):
    results.append((name, bool(cond), why))

ROWS = [
    {"ut": "Alpha Cert", "issuer": "Acme Board", "cpl_types": ["IC"],
     "articulations": [{"sys": "M-ID", "cid": "M-1"}]},
    {"ut": "Alpha Certification", "issuer": "Acme Board", "cpl_types": ["IC"],
     "articulations": [{"sys": "M-ID", "cid": "M-1"}]},
]
R.C.load_rows = lambda: ROWS

DOC = {"request": "_EXHIBIT_REANALYSIS::t", "findings": [
    {"credential": "Alpha Cert", "issuer_now": ["Acme Board", "Acme Testing Center"],
     "checks": [{"check": "shared_mid_same_issuer", "pairs": [{"mid": "M-1", "credential": "Alpha Certification"}]}]},
    {"credential": "Alpha Certification", "issuer_now": ["Acme Board"],
     "checks": [{"check": "shared_mid_same_issuer", "pairs": [{"mid": "M-1", "credential": "Alpha Cert"}]},
                {"check": "no_cpl_type"}]},
]}

seen = []
def fake(state, questions, key, model=None):
    seen.append({"state": state, "questions": questions})
    return {"answers": {q: {"noul": 0.91} for q in questions}}
R.system_one = fake

out = R.run(DOC, key="k")
check("one pair asked once though flagged from both sides", len(out["same_credential"]) == 1)
check("two distinct issuers asked", sorted(i["issuer"] for i in out["training_site"]) ==
      ["Acme Board", "Acme Testing Center"])
check("calls = pairs + issuers", len(seen) == 3 and out["calls"] == 3)
check("only the two step-9 questions", {q["questions"]["verdict"]["instructions"] for q in seen} ==
      {R.Q_SAME, R.Q_SITE})
check("a pair's evidence carries both titles and the shared M-ID",
      any(s["state"].get("shared_mid") == "M-1" and s["state"]["credential_a"]["title"] == "Alpha Cert"
          for s in seen))
check("no gate, and nothing reads as suggested", out["gate"] is None and "suggest" not in
      " ".join(str(k) for it in out["same_credential"] + out["training_site"] for k in it))
check("a noul answer stays a probability", out["same_credential"][0]["p"] == 0.91)
check("the evidence leaves the written result", all("state" not in it for it in
      out["same_credential"] + out["training_site"]))

seen.clear()
dry = R.run(DOC, dry=True)
check("a dry run makes no call", not seen and dry["calls"] == 0)

bad = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  ok  " if ok else "  FAIL ") + name + (("  — " + why) if why and not ok else ""))
print("\n%d/%d checks passed" % (len(results) - len(bad), len(results)))
sys.exit(1 if bad else 0)
