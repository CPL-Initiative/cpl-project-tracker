#!/usr/bin/env python3
"""Fold "High School X" / "HS X" titled rows into their de-HS'd twins
(Sam, 2026-06-12: venue/mode markers don't belong in CPL-crosswalk titles;
an HS course is only in the table at all because a college signed an
articulation agreement — that agreement is the equivalence backstop. Cut the
marker "when there is a title match").

ANALYZE by default; ``--apply`` writes curation merges (kb_curation
``merge_into``, reversible) + the Supabase ops file.

Guards (the pushback Sam invited, folded into the rule):
  * SUBJECT-PHRASE protection — "High School Equivalency / Diploma /
    Completion / Proficiency / Exit", HiSET, GED: there the words ARE the
    subject, never a venue marker. Untouched.
  * SAME BAND only (credit/noncredit lanes never cross).
  * SAME SUBJ4 only — "High School Civics" (IDST, diploma program) vs
    "Civics" (ESOL, ESL citizenship) is a real program difference; those
    pairs are FLAGGED for the curator, not merged.
  * CHAIN FLATTENING — a twin that is itself merged resolves one hop to its
    final target; rows already merging INTO the HS row re-point to the final
    target (no transitive merge_into chains in the overlay).

Receipt: kb/kin_pe_pass2_out/<date>/hs_title_fold.{md,json}.
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.654321+00:00")
REVIEWER = "MAP@rccd.edu"

HS = re.compile(r"\bhigh school\b|\bhs\b", re.I)
SUBJECT_PHRASES = re.compile(
    r"high school (equivalen|diploma|completion|proficiency|exit)|\bhiset\b|\bged\b", re.I)


def kb(p):
    return os.path.join(SD, p)


def norm(t):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", str(t or "").lower())).strip()


def main():
    rows = {}
    for f in ("coci_minted_courses.json", "coci_minted_singletons.json"):
        for cid, r in json.load(open(kb(f)))["courses"].items():
            rows[cid] = r
    cdoc = json.load(open(kb("coci_curation.json")))
    CU = cdoc.setdefault("curations", {})

    def final_target(cid):
        e = CU.get(cid)
        if isinstance(e, dict) and isinstance(e.get("merge_into"), str):
            return e["merge_into"]
        return cid

    idx = defaultdict(list)   # (norm title, band, subj4) -> ids
    for cid, r in rows.items():
        m = re.search(r" M(\d)", cid)
        idx[(norm(r.get("common_title")), m.group(1) if m else "?",
             r.get("subject_4letter"))].append(cid)

    merges, flagged = [], []
    for cid, r in sorted(rows.items()):
        t = r.get("common_title") or ""
        if not HS.search(t) or SUBJECT_PHRASES.search(t):
            continue
        if isinstance(CU.get(cid), dict) and CU[cid].get("merge_into"):
            continue   # already merged by a curator
        stripped = re.sub(r"\(\s*\)|[-–—:]\s*$", "", HS.sub(" ", t)).strip()
        m = re.search(r" M(\d)", cid)
        band, s4 = (m.group(1) if m else "?"), r.get("subject_4letter")
        same = [x for x in idx.get((norm(stripped), band, s4), []) if x != cid]
        cross = [x for x in idx.get((norm(stripped), band, None), [])] if not same else []
        # cross-SUBJ4 twins: scan all subj4s for the flag list
        if not same:
            cross = [x for (nt, b, sx), ids in idx.items() if nt == norm(stripped) and b == band
                     and sx != s4 for x in ids]
        if same:
            tgt = final_target(sorted(same)[0])
            if tgt == cid:
                continue
            merges.append({"hs_id": cid, "hs_title": t, "target": tgt,
                           "target_title": rows.get(tgt, {}).get("common_title")})
        elif cross:
            flagged.append({"hs_id": cid, "hs_title": t, "cross_subj4_twins":
                            [(x, rows[x].get("common_title"), rows[x].get("subject_4letter"))
                             for x in cross[:3]]})

    # incoming pointers to HS rows that are now merging away -> re-point.
    merging_away = {m["hs_id"]: m["target"] for m in merges}
    repoints = []
    for k, e in CU.items():
        if isinstance(e, dict) and e.get("merge_into") in merging_away:
            repoints.append({"course_id": k, "old": e["merge_into"],
                             "new": merging_away[e["merge_into"]]})

    print(f"HS-title fold — {'APPLY' if APPLY else 'ANALYZE'} — merges {len(merges)}, "
          f"cross-SUBJ4 flagged {len(flagged)}, chain re-points {len(repoints)}")
    for m in merges[:12]:
        print(f"   {m['hs_id']:13} {m['hs_title'][:42]:42} -> {m['target']:13} {m['target_title']}")

    outdir = kb(os.path.join("kin_pe_pass2_out", datetime.now().strftime("%Y-%m-%d")))
    os.makedirs(outdir, exist_ok=True)
    lines = [f"# HS-title fold — {datetime.now():%Y-%m-%d}", "",
             "Venue markers ('High School X' / 'HS X') folded into the de-HS'd twin when one",
             "exists at the SAME band + SAME SUBJ4 (articulation agreements are the equivalence",
             "backstop — Sam 2026-06-12). Subject-phrases (HS Equivalency/Diploma/…) protected.", "",
             "## Merged"]
    lines += [f"- `{m['hs_id']}` “{m['hs_title']}” → `{m['target']}` “{m['target_title']}”"
              for m in merges]
    lines += ["", "## Cross-SUBJ4 twins — FLAGGED for curator (program may differ, e.g. ESL vs diploma)"]
    lines += [f"- `{f['hs_id']}` “{f['hs_title']}” ↔ " +
              ", ".join(f"`{x}` “{t}” ({s})" for x, t, s in f["cross_subj4_twins"])
              for f in flagged]
    lines += ["", f"## Merge-chain re-points ({len(repoints)})"]
    lines += [f"- `{r['course_id']}`.merge_into: `{r['old']}` → `{r['new']}`" for r in repoints]
    open(os.path.join(outdir, "hs_title_fold.md"), "w").write("\n".join(lines) + "\n")
    json.dump({"generated_at": NOW, "merges": merges, "flagged": flagged,
               "repoints": repoints},
              open(os.path.join(outdir, "hs_title_fold.json"), "w"), ensure_ascii=False, indent=1)
    print(f"  receipt -> {os.path.relpath(os.path.join(outdir, 'hs_title_fold.md'), SD)}")

    if not APPLY:
        print("ANALYZE only — re-run with --apply.")
        return

    ops = []
    for m in merges:
        e = CU.setdefault(m["hs_id"], {})
        e["merge_into"] = m["target"]
        e["reviewed_by"] = REVIEWER
        e["reviewed_at"] = NOW
        ops.append({"course_id": m["hs_id"], "field": "merge_into", "value": m["target"]})
    for r in repoints:
        CU[r["course_id"]]["merge_into"] = r["new"]
        CU[r["course_id"]]["reviewed_at"] = NOW
        ops.append({"course_id": r["course_id"], "field": "merge_into", "value": r["new"]})
    cdoc["count"] = len(CU)
    json.dump(cdoc, open(kb("coci_curation.json"), "w"), ensure_ascii=False, indent=2)
    with open(kb("coci_curation.json"), "a") as f:
        f.write("\n")
    json.dump({"generated_at": NOW, "reviewer": REVIEWER, "ops": ops},
              open(os.path.join(outdir, "supabase_hs_ops.json"), "w"), ensure_ascii=False, indent=1)
    print(f"  ✓ APPLIED locally: {len(ops)} rows; ops -> supabase_hs_ops.json")


if __name__ == "__main__":
    main()
