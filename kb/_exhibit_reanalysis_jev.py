#!/usr/bin/env python3
"""Exhibit re-analysis: Jev's two questions, on a runner (scheduled_sessions.md step 9).

The code checks (`kb/_exhibit_reanalysis_checks.py`) run in the session and write
`kb/exhibits_reanalysis/<date>.json`. This script reads that file and asks Jev the two
questions step 9 allows, and no others:

  same_credential   two credentials that share an issuer and an M-ID (the checks'
                    `shared_mid_same_issuer` pairs): one credential under two names?
  training_site     each issuer on a changed credential: is it the place that trains,
                    rather than the body that issues the credential?

Never units, TOP, discipline or "is this a good title" (step 9).

⚠️ NO GATE. A gate belongs to the reference and the question it was measured on
(`kb/_jev_adjudicate.py` GATES: only the ccrr has one). The exhibits have none, so this
run is a calibration sitting: it reports Jev's probability beside each item for Sam's
word and marks nothing as suggested. Sam's verdicts on these items are what would earn
the exhibits a gate.

RUN IT ON A RUNNER. typesafe.ai is egress-blocked from the agent sandbox, so
`.github/workflows/typesafe-smoke.yml` dispatches it (input `reanalysis`, the findings
file). It writes `kb/jev_out/exhibit_reanalysis_<date>.json`, uploaded as an artifact;
it writes nothing to Supabase and commits nothing. The next session copies the result
into the dated findings file and `latest.json`.

    python3 kb/_exhibit_reanalysis_jev.py kb/exhibits_reanalysis/2026-11-10.json --dry-run
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _exhibit_reanalysis_checks as C  # noqa: E402
from _typesafe_smoke import noul, system_one  # noqa: E402

OUT = Path(__file__).resolve().parent / "jev_out"
GATE = None  # no measured gate for the exhibits; see the docstring

Q_SAME = ("Do these two titles name the same credential, issued by the same body, "
          "so that one should be folded into the other?")
Q_SITE = ("Is this name the place where people train or test (a school, an academy, a "
          "testing center, a training contractor) rather than the body that issues or "
          "certifies the credential?")


def same_credential_items(findings, by_ut):
    """One item per unordered pair the checks flagged, with the evidence Jev sees."""
    seen, items = set(), []
    for f in findings:
        for c in f.get("checks", []):
            if c.get("check") != "shared_mid_same_issuer":
                continue
            for p in c.get("pairs", []):
                a, b = f["credential"], p["credential"]
                key = tuple(sorted((a, b)))
                if key in seen:
                    continue
                seen.add(key)
                items.append({"a": key[0], "b": key[1], "mid": p.get("mid"),
                              "state": {"credential_a": _evidence(by_ut.get(key[0]), key[0]),
                                        "credential_b": _evidence(by_ut.get(key[1]), key[1]),
                                        "shared_mid": p.get("mid")}})
    return items


def training_site_items(findings):
    """One item per distinct issuer on a changed credential."""
    creds = {}
    for f in findings:
        for i in f.get("issuer_now") or []:
            creds.setdefault(i, []).append(f["credential"])
    return [{"issuer": i, "credentials": sorted(set(cs)),
             "state": {"issuer": i, "credentials_it_is_listed_on": sorted(set(cs))[:10]}}
            for i, cs in sorted(creds.items())]


def _evidence(row, ut):
    if not row:
        return {"title": ut}
    return {"title": row["ut"], "issuers": C.issuers_of(row),
            "cpl_types": row.get("cpl_types") or [],
            "m_ids": sorted({a["cid"] for a in row.get("articulations") or [] if a.get("sys") == "M-ID"})}


def ask(question, state, key):
    """One call, one noul question. The answer is a probability, never a boolean."""
    ans = (system_one(state, {"verdict": noul(question, {
        "true": "Yes.", "false": "No."})}, key).get("answers") or {})
    return (ans.get("verdict") or {}).get("noul")


def run(findings_doc, key=None, dry=False):
    rows = C.load_rows()
    by_ut = {r["ut"]: r for r in rows}
    findings = findings_doc.get("findings") or []
    same = same_credential_items(findings, by_ut)
    sites = training_site_items(findings)
    if not dry:
        for it in same:
            it["p"] = ask(Q_SAME, it["state"], key)
        for it in sites:
            it["p"] = ask(Q_SITE, it["state"], key)
    for it in same + sites:
        it.pop("state", None)
    return {"request": findings_doc.get("request"), "gate": GATE,
            "reading": ("calibration sitting: no measured gate, so each p is Jev's probability for "
                        "Sam's word and nothing is suggested"),
            "questions": {"same_credential": Q_SAME, "training_site": Q_SITE},
            "calls": 0 if dry else len(same) + len(sites),
            "same_credential": same, "training_site": sites}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("findings", help="kb/exhibits_reanalysis/<date>.json from the code checks")
    ap.add_argument("--dry-run", action="store_true", help="list the questions; no key, no call")
    a = ap.parse_args(argv)
    doc = json.loads(Path(a.findings).read_text(encoding="utf-8"))
    key = None
    if not a.dry_run:
        key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
        if not key:
            print("TYPESAFE_API_KEY is not set. typesafe.ai is egress-blocked from the sandbox; "
                  "dispatch typesafe-smoke.yml with the `reanalysis` input instead.")
            return 2
    out = run(doc, key, a.dry_run)
    OUT.mkdir(exist_ok=True)
    path = OUT / ("exhibit_reanalysis_%s.json" % Path(a.findings).stem)
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("%d same-credential pair(s), %d issuer(s), %d call(s) -> %s"
          % (len(out["same_credential"]), len(out["training_site"]), out["calls"], path))
    for it in out["same_credential"]:
        print("  same?  p=%s  %s | %s  (%s)" % (it.get("p"), it["a"], it["b"], it["mid"]))
    for it in out["training_site"]:
        print("  site?  p=%s  %s  (%d credential(s))" % (it.get("p"), it["issuer"], len(it["credentials"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
