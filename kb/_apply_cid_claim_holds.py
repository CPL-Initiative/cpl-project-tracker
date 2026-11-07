#!/usr/bin/env python3
"""Apply the COCI C-ID claims set aside in kb/reference/cid_claim_holds.json to
kb/coci_articulations.json (SkyHarbor, 2026-11-06).

WHY. Sam, 2026-11-06, on Sierra College's CPL Pathways visual: "the HIST course should
not be recommend for Basic Training... Definitely don't want Sierra recommending this."
Moreno Valley College's COCI row for HES 1 Health Science names the C-ID HIST 150 (World
History to 1500); the ASCCC approval table holds no such approval. The member export
trusted the claim, so Moreno Valley's Basic Military Training articulation to HES 1 read
as a peer articulation to every World History to 1500 course statewide: the CPL Pathways
visual and workbook, unified_courses_aligned.js, and Sierra's chatbox_peer_articulations.

WHAT. For each hold: the articulation records keyed to the claimed C-ID that only the held
college earns, on the held course, move to the hold's home (merged into the home's record
for the same exhibit, or re-keyed); the held college leaves the claimed C-ID's offering
list and every one of its records' could-adopt lists when the held course was its only
member there; it joins the home's offering list and the could-adopt lists of the home's
records it does not earn. Deltas only: the file's other could-adopt lists are never
recomputed. The member export honors the same file (excel_to_dashboard.py, CID_HOLDS).

    python3 kb/_apply_cid_claim_holds.py            # dry run: what would move
    python3 kb/_apply_cid_claim_holds.py --apply    # write, with a receipt
    python3 kb/_apply_cid_claim_holds.py --check    # exit 1 if a held claim still keys a record
    python3 kb/_apply_cid_claim_holds.py --rollback kb/cid_claim_holds_out/<receipt>.json

Idempotent: a second --apply finds nothing to move. Reversible (Rule 10 a2): the receipt
holds every touched record and identity as it was.
"""
from __future__ import annotations

import copy
import datetime as dt
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "kb", "coci_articulations.json")
HOLDS = os.path.join(ROOT, "kb", "reference", "cid_claim_holds.json")
LOOKUP = os.path.join(ROOT, "coci_lookup_data.js")
OUT = os.path.join(ROOT, "kb", "cid_claim_holds_out")


def norm(x):
    return " ".join(str(x or "").split()).upper()


def load_holds():
    with open(HOLDS, encoding="utf-8") as f:
        return json.load(f).get("holds", [])


def other_claimants(hold):
    """Other courses at the held college whose COCI row claims the same C-ID."""
    try:
        txt = open(LOOKUP, encoding="utf-8").read()
        doc = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
    except (IOError, ValueError):
        return None  # unknown: keep the college on the offering list
    cols = doc.get("colleges") or []
    out = 0
    for r in doc.get("rows") or []:
        if r[0] < len(cols) and cols[r[0]] == hold["college"] and norm(r[8]) == norm(hold["claimed_cid"]) \
                and norm(r[1]) != norm(hold["control_number"]):
            out += 1
    return out


def held_course(rec, hold):
    code = norm(hold["course"])
    lcs = rec.get("local_courses") or []
    return bool(lcs) and all(norm(f"{c.get('subject', '')} {c.get('number', '')}") == code for c in lcs)


def plan(doc, holds):
    arts, ids = doc["articulations"], doc["identities"]
    moves, notes = [], []
    for h in holds:
        claimed, home, college = h["claimed_cid"], h.get("home"), h["college"]
        for i, r in enumerate(arts):
            if r["course_id"] == claimed and r.get("earned_by_colleges") == [college] and held_course(r, h):
                moves.append({"hold": h, "index": i})
        others = other_claimants(h)
        leaves = others == 0 and college in ((ids.get(claimed) or {}).get("colleges_offering") or [])
        joins = bool(home) and home in ids and college not in (ids[home].get("colleges_offering") or [])
        notes.append({"hold": h, "leaves_claimed": leaves, "joins_home": joins, "other_claimants": others})
    return moves, notes


def write_art(doc):
    with open(ART, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")


def recount(doc):
    arts = doc["articulations"]
    doc["articulation_records"] = len(arts)
    doc["identities_with_articulations"] = len({r["course_id"] for r in arts})
    doc["records_with_nonempty_leverage"] = sum(1 for r in arts if r.get("adoption_leverage"))
    doc["total_adoption_leverage"] = sum(len(r.get("adoption_leverage") or []) for r in arts)


def apply(doc, holds):
    arts, ids = doc["articulations"], doc["identities"]
    moves, notes = plan(doc, holds)
    touched_ids = set()
    for n in notes:
        h = n["hold"]
        touched_ids.add(h["claimed_cid"])
        if h.get("home"):
            touched_ids.add(h["home"])
    before = {
        "articulations": {str(i): copy.deepcopy(r) for i, r in enumerate(arts) if r["course_id"] in touched_ids},
        "identities": {k: copy.deepcopy(ids.get(k)) for k in sorted(touched_ids)},
        "totals": {k: doc[k] for k in ("articulation_records", "identities_with_articulations",
                                        "records_with_nonempty_leverage", "total_adoption_leverage")},
    }
    drop, moved = set(), []
    for m in moves:
        h, r = m["hold"], arts[m["index"]]
        college, home = h["college"], h.get("home")
        if not home:
            continue
        target = next((x for x in arts if x["course_id"] == home and x["exhibit_id"] == r["exhibit_id"]), None)
        if target is not None:
            target["earned_by_colleges"] = sorted(set(target["earned_by_colleges"]) | {college})
            seen = {norm(f"{c.get('subject', '')} {c.get('number', '')}") for c in target.get("local_courses") or []}
            for c in r.get("local_courses") or []:
                if norm(f"{c.get('subject', '')} {c.get('number', '')}") not in seen:
                    target.setdefault("local_courses", []).append(c)
            for cr in r.get("credit_recommendations") or []:
                if cr not in (target.get("credit_recommendations") or []):
                    target.setdefault("credit_recommendations", []).append(cr)
            drop.add(m["index"])
            moved.append({"from": h["claimed_cid"], "to": home, "exhibit_id": r["exhibit_id"], "merged": True})
        else:
            r["course_id"] = home
            r["identity_system"] = (ids.get(home) or {}).get("identity_system") or "M-ID"
            r["_held_from"] = h["claimed_cid"]
            moved.append({"from": h["claimed_cid"], "to": home, "exhibit_id": r["exhibit_id"], "merged": False})
    doc["articulations"] = arts = [r for i, r in enumerate(arts) if i not in drop]
    for n in notes:
        h = n["hold"]
        college, claimed, home = h["college"], h["claimed_cid"], h.get("home")
        if n["leaves_claimed"]:
            ids[claimed]["colleges_offering"] = [c for c in ids[claimed]["colleges_offering"] if c != college]
            for r in arts:
                if r["course_id"] == claimed and college in (r.get("adoption_leverage") or []):
                    r["adoption_leverage"] = [c for c in r["adoption_leverage"] if c != college]
                    r["adoption_leverage_count"] = len(r["adoption_leverage"])
        if home and home in ids:
            if n["joins_home"]:
                ids[home]["colleges_offering"] = sorted(set(ids[home].get("colleges_offering") or []) | {college})
            for r in arts:
                if r["course_id"] != home:
                    continue
                lev = set(r.get("adoption_leverage") or [])
                if college in r.get("earned_by_colleges", []):
                    lev.discard(college)
                elif n["joins_home"]:
                    lev.add(college)
                if sorted(lev) != sorted(r.get("adoption_leverage") or []):
                    r["adoption_leverage"] = sorted(lev)
                    r["adoption_leverage_count"] = len(lev)
    recount(doc)
    return {"moved": moved, "notes": [{k: (v if k != "hold" else {"college": v["college"], "course": v["course"],
                                                                     "claimed_cid": v["claimed_cid"], "home": v.get("home")})
                                       for k, v in n.items()} for n in notes], "before": before}


def main(argv):
    holds = load_holds()
    with open(ART, encoding="utf-8") as f:
        doc = json.load(f)
    if "--rollback" in argv:
        path = argv[argv.index("--rollback") + 1]
        rec = json.load(open(path, encoding="utf-8"))
        b = rec["before"]
        touched = set(b["identities"])
        out = [r for r in doc["articulations"] if r["course_id"] not in touched]
        for k in sorted(b["articulations"], key=int):  # back to each record's original place
            out.insert(int(k), b["articulations"][k])
        doc["articulations"] = out
        for k, v in b["identities"].items():
            if v is None:
                doc["identities"].pop(k, None)
            else:
                doc["identities"][k] = v
        doc.update(b["totals"])
        write_art(doc)
        print(f"rolled back from {path}")
        return 0
    moves, notes = plan(doc, holds)
    if "--check" in argv:
        bad = [m for m in moves]
        stale = [n for n in notes if n["leaves_claimed"]]
        for m in bad:
            print(f"held claim still keys a record: {m['hold']['college']} {m['hold']['course']} -> {m['hold']['claimed_cid']}")
        for n in stale:
            print(f"held college still offers its claimed C-ID: {n['hold']['college']} -> {n['hold']['claimed_cid']}")
        print("cid claim holds: " + ("applied" if not bad and not stale else "NOT applied (run --apply)"))
        return 1 if (bad or stale) else 0
    for m in moves:
        h = m["hold"]
        print(f"move: {h['college']} {h['course']} record {h['claimed_cid']} -> {h.get('home')}")
    for n in notes:
        h = n["hold"]
        print(f"{h['college']} {h['course']}: leaves {h['claimed_cid']} offering={n['leaves_claimed']} "
              f"(other claimants {n['other_claimants']}), joins {h.get('home')} offering={n['joins_home']}")
    if "--apply" not in argv:
        print("dry run; --apply writes")
        return 0
    res = apply(doc, holds)
    if not res["moved"] and not any(n["leaves_claimed"] or n["joins_home"] for n in res["notes"]):
        print("nothing to apply")
        return 0
    write_art(doc)
    os.makedirs(OUT, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    rp = os.path.join(OUT, f"applied_{stamp}.json")
    with open(rp, "w", encoding="utf-8") as f:
        json.dump({"applied_at": stamp, "holds": HOLDS[len(ROOT) + 1:], **res}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"applied: {len(res['moved'])} record(s) moved; receipt {rp[len(ROOT) + 1:]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
