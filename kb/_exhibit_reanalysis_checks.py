#!/usr/bin/env python3
"""Exhibit re-analysis: the code checks (scheduled_sessions.md step 9; no model call).

Input: a JSON file of the sender's `_CREDENTIAL_REVIEW::` saves since the last done row
(`[{"course_id", "field", "value", "reviewed_at"}]`, as the session reads them from kb_curation),
and the request's own `changed` list. Reads `credential_reference_data.js` (the built rows, which
already carry the saves) and `kb/cred_rename_dryrun/collisions.json`. Writes nothing but stdout
unless --out is given.

Checks, per changed credential:
  rename_collision    a rename whose target is an existing key (the dry-run's collisions)
  issuer_spellings    the same issuer spelled two ways anywhere in the reference
  stem_issuer_differs siblings sharing the title's stem carry a different issuer
  no_cpl_type         the credential carries no CPL type
  shared_mid_same_issuer  another credential with the same issuer articulates to the same M-ID
                      (a candidate for one credential under two names; Jev's question, flagged only)

Usage: python3 kb/_exhibit_reanalysis_checks.py SAVES.json [--changed a,b] [--out FILE]
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_rows():
    s = (ROOT / "credential_reference_data.js").read_text(encoding="utf-8")
    s = s[s.index("=") + 1:].rstrip().rstrip(";")
    return json.loads(s)["unified_titles"]


def norm_issuer(x):
    x = (x or "").lower()
    x = re.sub(r"\([^)]*\)", " ", x)
    x = re.sub(r"\bthe\b", " ", x)
    x = re.sub(r"[^a-z0-9]+", " ", x)
    return " ".join(x.split())


def acronym(x):
    m = re.search(r"\(([A-Z][A-Za-z&]{1,9})\)", x or "")
    return m.group(1).lower() if m else None


STOP = {"to", "of", "and", "the", "in", "for", "a", "an", "on", "with"}
GENERIC_FIRST = {"intro", "introduction", "basic", "basics", "advanced", "fundamentals", "principles"}


def stem(title):
    t = title or ""
    for sep in (":", " — ", " - "):
        if sep in t:
            return t.split(sep)[0].strip().lower()
    w = re.findall(r"[a-z0-9]+", t.lower())
    if len(w) < 3 or w[0] in GENERIC_FIRST or w[1] in STOP:
        return None
    return " ".join(w[:2])


def issuers_of(r):
    out = list(r.get("issuers") or [])
    if r.get("issuer") and r["issuer"] not in out:
        out.insert(0, r["issuer"])
    return [i for i in out if i]


def run(saves, changed_extra):
    rows = load_rows()
    by_ut = {r["ut"]: r for r in rows}
    coll = json.loads((ROOT / "kb/cred_rename_dryrun/collisions.json").read_text())
    coll_keys = {c.get("from") or c.get("old") for c in coll.get("collisions", [])}

    spell = defaultdict(set)
    acr = defaultdict(set)
    stems = defaultdict(list)
    mids = defaultdict(set)
    for r in rows:
        for i in issuers_of(r):
            spell[norm_issuer(i)].add(i)
            a = acronym(i)
            if a:
                acr[a].add(i)
        st = stem(r["ut"])
        if st:
            stems[st].append(r)
        for a in r.get("articulations") or []:
            if a.get("sys") == "M-ID":
                mids[a["cid"]].add(r["ut"])

    changed = []
    for s in saves:
        ut = s["course_id"].split("::", 1)[1]
        if ut not in changed:
            changed.append(ut)
    for ut in changed_extra:
        if ut not in changed:
            changed.append(ut)

    findings = []
    for ut in changed:
        r = by_ut.get(ut)
        f = {"credential": ut, "saves": [{"field": s["field"], "value": s["value"]} for s in saves
                                          if s["course_id"].split("::", 1)[1] == ut], "checks": []}
        if r is None:
            f["checks"].append({"check": "not_in_reference", "detail": "no built row by this title"})
            findings.append(f)
            continue
        f["issuer_now"] = issuers_of(r)
        if ut in coll_keys:
            f["checks"].append({"check": "rename_collision"})
        for i in issuers_of(r):
            others = sorted(spell[norm_issuer(i)] - {i})
            a = acronym(i)
            if a:
                others += sorted(x for x in acr[a] - {i} if x not in others)
            if others:
                f["checks"].append({"check": "issuer_spellings", "issuer": i, "also_spelled": others})
        st = stem(ut)
        if st:
            mine = set(issuers_of(r))
            sib = [{"credential": x["ut"], "issuer": issuers_of(x)} for x in stems[st]
                   if x["ut"] != ut and issuers_of(x) and not (set(issuers_of(x)) & mine)]
            if sib:
                f["checks"].append({"check": "stem_issuer_differs", "stem": st, "siblings": sib[:8],
                                    "n_siblings": len(sib)})
        if not r.get("cpl_types"):
            f["checks"].append({"check": "no_cpl_type"})
        mine = set(issuers_of(r))
        dup = set()
        for a in r.get("articulations") or []:
            if a.get("sys") != "M-ID":
                continue
            for o in mids[a["cid"]] - {ut}:
                if set(issuers_of(by_ut[o])) & mine:
                    dup.add((a["cid"], o))
        if dup:
            f["checks"].append({"check": "shared_mid_same_issuer",
                                "pairs": [{"mid": m, "credential": o} for m, o in sorted(dup)][:10]})
        findings.append(f)
    return findings


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    saves = json.loads(Path(argv[0]).read_text())
    extra, out = [], None
    if "--changed" in argv:
        extra = [x for x in argv[argv.index("--changed") + 1].split(",") if x]
    if "--out" in argv:
        out = argv[argv.index("--out") + 1]
    findings = run(saves, extra)
    text = json.dumps(findings, indent=2, ensure_ascii=False)
    if out:
        Path(out).write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
