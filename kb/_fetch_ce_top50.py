"""
Credential Engine's 50 most-referenced credentials -> kb/reference/credential_engine_top50.json.

Sam, 2026-10-26: Credential Engine sent the 50 industry credentials that sit in the
most collections of its Registry (the list is `kb/reference/credential_engine_top50_ctids.json`:
rank, CTID, collection_count). This reads each CTID's CTDL JSON-LD from
credentialengineregistry.org and keeps the terms the CER and the catalog use:
the class, name, description, status, owner and offerer, audience level, occupation
(SOC), industry (NAICS), CIP, duration, cost, renewal, prerequisites and the issuer's
own web page. The CTID is the join key to the Registry; the catalog builder
(`kb/_build_it_ai_credential_catalog.py`) joins these rows into the catalog.

Run from the repo root (needs credentialengineregistry.org):
  python3 kb/_fetch_ce_top50.py
"""
import json
import os
import subprocess
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LIST = os.path.join(ROOT, "kb", "reference", "credential_engine_top50_ctids.json")
OUT = os.path.join(ROOT, "kb", "reference", "credential_engine_top50.json")
BASE = "https://credentialengineregistry.org/resources/"


def fetch(ctid):
    p = subprocess.run(["curl", "-sS", "-m", "30", "-H", "Accept: application/json", BASE + ctid],
                       capture_output=True, text=True)
    if p.returncode:
        raise SystemExit(f"fetch failed for {ctid}: {p.stderr.strip()}")
    return json.loads(p.stdout)


def lang(v):
    """A CTDL language map or a plain string -> the English string."""
    if isinstance(v, dict):
        v = v.get("en-US") or next(iter(v.values()), None)
    if isinstance(v, list):
        v = "; ".join(str(x) for x in v)
    return v


def cao(items):
    """CredentialAlignmentObject list -> framework, code, name."""
    out = []
    for o in items or []:
        out.append({
            "framework": lang(o.get("ceterms:frameworkName")),
            "code": o.get("ceterms:codedNotation"),
            "name": lang(o.get("ceterms:targetNodeName")),
        })
    return out


def ctid_of(url):
    return url.rsplit("/", 1)[-1]


def agent(ctid, cache):
    if ctid not in cache:
        d = fetch(ctid)
        cache[ctid] = {"ctid": ctid, "name": lang(d.get("ceterms:name")), "type": d.get("@type"),
                       "url": lang(d.get("ceterms:subjectWebpage"))}
    return cache[ctid]


def record(entry, d, agents):
    prereq_ctids, conditions = [], []
    for c in d.get("ceterms:requires") or []:
        for t in c.get("ceterms:targetCredential") or []:
            prereq_ctids.append(ctid_of(t))
        if c.get("ceterms:condition"):
            conditions.append(lang(c["ceterms:condition"]))
    dur = []
    for e in d.get("ceterms:estimatedDuration") or []:
        dur.append(e.get("ceterms:exactDuration") or e.get("ceterms:minimumDuration") or e.get("ceterms:description"))
    cost = []
    for e in d.get("ceterms:estimatedCost") or []:
        cost.append({"price": e.get("ceterms:price"), "currency": e.get("ceterms:currency"),
                     "description": lang(e.get("ceterms:description"))})
    status = d.get("ceterms:credentialStatusType") or {}
    if isinstance(status, list):
        status = status[0] if status else {}
    return {
        "ctid": entry["ctid"],
        "rank": int(entry["rank"]),
        "collection_count": int(entry["collection_count"]),
        "ctdl_type": d.get("@type"),
        "name": lang(d.get("ceterms:name")),
        "alternate_names": [lang(a) if isinstance(a, dict) else a for a in d.get("ceterms:alternateName") or []],
        "description": lang(d.get("ceterms:description")),
        "subject_webpage": d.get("ceterms:subjectWebpage"),
        "same_as": d.get("ceterms:sameAs") or [],
        "status": lang(status.get("ceterms:targetNodeName")) if isinstance(status, dict) else None,
        "in_language": d.get("ceterms:inLanguage") or [],
        "owned_by": [agent(ctid_of(u), agents) for u in d.get("ceterms:ownedBy") or []],
        "offered_by": [agent(ctid_of(u), agents) for u in d.get("ceterms:offeredBy") or []],
        "audience_level": [x["name"] for x in cao(d.get("ceterms:audienceLevelType"))],
        "occupation_type": cao(d.get("ceterms:occupationType")),
        "industry_type": cao(d.get("ceterms:industryType")),
        "instructional_program_type": cao(d.get("ceterms:instructionalProgramType")),
        "subject": [lang(s) if isinstance(s, dict) else s for s in d.get("ceterms:subject") or []],
        "keyword": lang(d.get("ceterms:keyword")) if d.get("ceterms:keyword") else None,
        "estimated_duration": [x for x in dur if x],
        "estimated_cost": cost,
        "renewal_frequency": d.get("ceterms:renewalFrequency"),
        "date_effective": d.get("ceterms:dateEffective"),
        "requires_credential_ctids": sorted(set(prereq_ctids)),
        "requires_conditions": conditions,
        "is_part_of_n": len(d.get("ceterms:isPartOf") or []),
        "registry_url": BASE + entry["ctid"],
        "ctdl_terms_present": sorted(k for k in d if k.startswith("ceterms:")),
    }


def main():
    entries = json.load(open(LIST))["credentials"]
    agents, rows = {}, []
    for e in entries:
        rows.append(record(e, fetch(e["ctid"]), agents))
    out = {
        "_about": "The 50 credentials that appear in the most Credential Engine Registry collections, with the CTDL "
                  "terms the CER and the catalog keep. Written by kb/_fetch_ce_top50.py from each CTID's JSON-LD at "
                  "credentialengineregistry.org. Never hand-edited; rerun the fetch.",
        "_source_list": "Credential Engine, top_collection_member_credentials.xlsx, received by Sam Lee 2026-10-26",
        "_fetched_on": date.today().isoformat(),
        "credentials": rows,
    }
    json.dump(out, open(OUT, "w"), indent=1, ensure_ascii=False)
    open(OUT, "a").write("\n")
    print(f"wrote {OUT}: {len(rows)} credentials, {len(agents)} owners/offerers")


if __name__ == "__main__":
    sys.exit(main())
