#!/usr/bin/env python3
"""STATEWIDE strict twin-merge pass — Rule-7 merge (no re-numbering).

DRY-RUN by default (read-only, writes a review manifest); ``--apply`` mutates the KB.

Session 46: Sam reviewed the CCR ("Still seeing some apparent MID
consolidations that should happen, so more rule sharpening — see AUTO M1001
'Smog Check Inspector Level 1 & 2 Training' and M1002") — M1001/M1002 are
TOKEN-IDENTICAL titles that had been parked in the suggestion queue since
the mint. This pass takes the Session-39 KINE/FLSP twin-merge
(kb/_apply_kine_flsp_twin_merge.py, Sam-authorized 2026-06-10) STATEWIDE —
the same widening move the c-id router made in #379 — merging ONLY the
strictest twin class and leaving everything fuzzier to the worklist lanes:

  twin key = (subj4, discipline, band, strict-fam-key, credit_status, typical_units)

  - identical to the Session-39 key; scope simply widens from (KINE, FLSP)
    to every SUBJ4. Blank-discipline parents are SKIPPED (strict tier wants
    real agreement, not blank==blank).
  - PLUS the Session-46 guard suite (kb/_consolidation_guards.py) as a
    CLIQUE gate per twin group: the ordinal-rule family key drops "1" as
    non-distinguishing, so "X Level 1 & 2" fam-equals "X Level 2" — the
    two-axis level marks ({1,2} != {2}) catch that, along with variant-type
    (refresher/instructor/module/honors), year-edition, gender and sport
    marks. ANY conflicting pair sends the WHOLE group to the worklist
    (skip + log) — no partial merges in the auto tier.

Winner per group = most corroborating members, tiebreak lowest M-number.
Losers fold in: corroboration summed, memberships extended, articulations
re-pointed, curation overlay re-keyed (field-merge). MERGE ONLY — no identity
gets a new number; the alias map (loser → winner) is the full receipt.

⚠ Supabase mirror (the Session-39 lesson): kb/coci_curation.json is REBUILT
from Supabase ``kb_curation`` on every cron, so any curation re-key this
apply makes must ALSO be applied to Supabase or the next sync resurrects the
dead ids. The apply prints the exact (course_id, field, old → new) tuples.

After --apply (the Rule-7 checklist):
  1. append kb/twin_merge_out/<date>/alias_map.json to ALIAS_MAPS in
     kb/_rekey_promotions.py and run  python3 kb/_rekey_promotions.py --apply
     (fold semantics: converged keys sum witnesses, union colleges)
  2. python3 kb/_seed_canonical_subj4.py   (CSR re-seed)
  3. python3 kb/_row_audit.py              (refresh the audit overlay)
  4. regenerate artifacts (cron / workflow_dispatch) — the worklist lanes
     self-clean: receipt members that died fold out via liveness validation.

Scope: parents only (coci_minted_courses.json). Singletons stay the
worklist's curator-confirmed lane. Run from repo root.
Receipt: kb/twin_merge_out/<date>/.
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime as _dt

from _consolidation_guards import extract_marks, marks_conflict

APPLY = "--apply" in sys.argv
# --tag=<suffix> appends to the receipt dir date (kb/twin_merge_out/<date>-<tag>/)
# so a same-day re-run (e.g. the Session-50 post-fold pass) NEVER overwrites an
# earlier receipt already registered in kb/_rekey_promotions.py ALIAS_MAPS.
TAG = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--tag=")), None)
SD = os.path.dirname(os.path.abspath(__file__))


def kb(p):
    return os.path.join(SD, p)


# ── the STRICT level-safe family key (verbatim from the Session-39 pass —
# the canonical excel_to_dashboard.py:_fam_key PLUS the single-letter-roman
# fix). NOTE: deliberately NOT word-number-enriched — keeping the key
# byte-compatible with the registered 2026-06-10 twin map's semantics; the
# word-number cases ("Level One and Level Two") are units-variant anyway and
# stay in the worklist. ──────────────────────────────────────────────────────
_FAM_FORMAT = {"basic", "training", "academy", "preparation", "prep", "certificate",
               "course", "application", "module", "part", "semester", "program"}
_FAM_DROP = {"the", "of", "to", "and", "for", "with", "in", "a", "an", "on", "at", "as", "or"}
_FAM_ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5",
              "vi": "6", "vii": "7", "viii": "8", "ix": "9"}


def fam(title):
    t = re.sub(r"\([^)]*\)", " ", str(title or "").lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    toks = []
    for w in t.split():
        if w == "emt":
            toks += ["emergency", "medical", "technician"]
        elif w == "tech":
            toks.append("technician")
        else:
            toks.append(w)
    keep = []
    for w in toks:
        if w in _FAM_ROMAN:
            w = _FAM_ROMAN[w]
        if len(w) == 1 and not w.isdigit():
            continue
        if w in _FAM_DROP or w in _FAM_FORMAT:
            continue
        if w.isdigit():
            if w == "1" or len(w) >= 2:
                continue
        keep.append(w)
    return " ".join(sorted(set(keep)))


def band_of(rec):
    return 9 if str(rec.get("credit_status", "")).lower().startswith("noncredit") else 1


def mseq(mid):
    m = re.search(r"M(\d)(\d{3})$", mid or "")
    return (int(m.group(1)), int(m.group(2))) if m else (9, 9999)


# ── load ─────────────────────────────────────────────────────────────────────
cat = json.load(open(kb("coci_minted_courses.json")))
courses = cat["courses"] if isinstance(cat, dict) and "courses" in cat else cat
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
# ids a curator has already designated as a merge TARGET in the UI — they
# outrank corroboration in the winner pick (see the planning loop).
_cur_targets = {ent.get("merge_into") for ent in CU.values()
                if isinstance(ent, dict) and ent.get("merge_into")}

# ── plan: group ALL disciplined parents by the strict twin key ───────────────
groups = defaultdict(list)
skipped_blank_disc = 0
for mid, v in courses.items():
    if not v.get("discipline"):
        skipped_blank_disc += 1
        continue
    fk = fam(v.get("common_title"))
    if not fk:
        continue
    key = (v.get("subject_4letter"), v.get("discipline"), band_of(v), fk,
           v.get("credit_status"), v.get("typical_units"))
    groups[key].append(mid)

alias = {}     # loser -> winner
merges = []    # (loser, winner, loser_title, winner_title)
guard_skipped = []   # twin groups a guard conflict sent back to the worklist
per_subj = defaultdict(int)
for key, mids in sorted(groups.items()):
    if len(mids) < 2:
        continue
    # Session-46 clique gate: every pair must be guard-clean or the WHOLE
    # group stays in the worklist (e.g. "X Level 1 & 2" vs "X Level 2" share
    # a fam key because "1" drops as non-distinguishing — level marks differ).
    marks = {m: extract_marks(courses[m].get("common_title")) for m in mids}
    conflict = None
    for i, a in enumerate(mids):
        for b in mids[i + 1:]:
            why = marks_conflict(marks[a], marks[b])
            if why:
                conflict = (a, b, why)
                break
        if conflict:
            break
    if conflict:
        guard_skipped.append({"key": list(map(str, key)), "mids": mids,
                              "pair": conflict[:2], "why": conflict[2],
                              "titles": [courses[m].get("common_title") for m in mids]})
        continue
    # Winner: an existing CURATOR merge-target outranks corroboration (the
    # BUSI/ENGL dry-run finding — a curator had already merged some twins in
    # the UI with their own target choice; honor it), then most corroborating
    # members, then lowest M-number.
    ranked = sorted(mids, key=lambda m: (-(m in _cur_targets),
                                         -(courses[m].get("corroboration_members") or 0),
                                         mseq(m)))
    winner = ranked[0]
    for loser in ranked[1:]:
        alias[loser] = winner
        merges.append((loser, winner,
                       courses[loser].get("common_title"), courses[winner].get("common_title")))
        per_subj[key[0]] += 1

# Snapshot of every untouched record (neither winner nor loser) for gate G5.
_touched = set(alias) | set(alias.values())
_untouched_before = json.dumps(
    {k: v for k, v in courses.items() if k not in _touched}, sort_keys=True)

# ── ripple measurement ───────────────────────────────────────────────────────
adoc = json.load(open(kb("coci_articulations.json")))
arts = adoc["articulations"] if isinstance(adoc, dict) else adoc
art_hits = sum(1 for a in arts if a.get("course_id") in alias)
mdoc = json.load(open(kb("coci_minted_memberships.json")))
MM = mdoc["memberships"]
mem_hits = sum(1 for k in MM if k in alias)
cur_hits = []
for k, ent in CU.items():
    if k in alias:
        cur_hits.append((k, "(entry key)", k, alias[k]))
    if isinstance(ent, dict):
        if ent.get("merge_into") in alias:
            cur_hits.append((k, "merge_into", ent["merge_into"], alias[ent["merge_into"]]))
        for m in (ent.get("merge_members") or []):
            if m in alias:
                cur_hits.append((k, "merge_members[]", m, alias[m]))

# ── report ───────────────────────────────────────────────────────────────────
print(f"STATEWIDE strict twin-merge — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
n_groups = sum(1 for mids in groups.values() if len(mids) > 1) - len(guard_skipped)
print(f"  twin groups: {n_groups}   losers to merge: {len(alias)}   "
      f"guard-skipped groups: {len(guard_skipped)}   blank-discipline parents skipped: {skipped_blank_disc}")
top = sorted(per_subj.items(), key=lambda x: -x[1])[:12]
print(f"  top SUBJ4s: {', '.join(f'{s}={n}' for s, n in top)}")
print(f"  ripple — articulations: {art_hits}/{len(arts)}   membership keys: {mem_hits}   "
      f"curation refs: {len(cur_hits)}")
if cur_hits:
    print("  ⚠ curation rows needing the SUPABASE mirror after --apply:")
    for k, f, old, new in cur_hits:
        print(f"     {k} | {f}: {old} → {new}")

outdir = kb(os.path.join("twin_merge_out",
                         _dt.now().strftime("%Y-%m-%d") + (f"-{TAG}" if TAG else "")))
os.makedirs(outdir, exist_ok=True)
json.dump({"generated_at": _dt.now().isoformat(), "scope": "STATEWIDE (all SUBJ4, disciplined parents)",
           "twin_key": "(subj4, discipline, band, strict_fam, credit_status, typical_units) + Session-46 guard clique",
           "alias_map": alias,
           "guard_skipped_groups": guard_skipped,
           # The Supabase-mirror worklist (Session-39 lesson): every kb_curation
           # row the apply re-keys, persisted here so the mirror ops are
           # receipted, not just printed.
           "curation_rekeys": [{"entry": k, "ref": f, "old": old, "new": new}
                               for k, f, old, new in cur_hits],
           "merges": [{"from": a, "into": b, "from_title": t, "into_title": wt}
                      for a, b, t, wt in merges]},
          open(os.path.join(outdir, "twin_merge_manifest.json"), "w"), indent=1, ensure_ascii=False)
print(f"  manifest → {os.path.relpath(os.path.join(outdir, 'twin_merge_manifest.json'), SD)}")

print(f"\n  guard-skipped groups (stay in the worklist) — {len(guard_skipped)}:")
for g in guard_skipped[:15]:
    print(f"     {g['why']:13} {g['mids']}  {g['titles']}")

print(f"\n  merges — first 40 of {len(merges)} (FULL list in the manifest; review before --apply):")
for a, b, t, wt in merges[:40]:
    print(f"     {a:13} '{t}'  →  {b:13} '{wt}'")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Re-run with --apply after reviewing the manifest.")
    sys.exit(0)

# ── apply ────────────────────────────────────────────────────────────────────
print("\n--apply: mutating KB …")

for loser, winner in alias.items():
    courses[winner]["corroboration_members"] = (courses[winner].get("corroboration_members") or 0) + \
                                               (courses[loser].get("corroboration_members") or 0)
newC = {k: v for k, v in courses.items() if k not in alias}
cat["courses"] = newC
if "count" in cat:
    cat["count"] = len(newC)

for loser, winner in alias.items():
    if loser in MM:
        MM.setdefault(winner, []).extend(MM[loser])
newMM = {k: v for k, v in MM.items() if k not in alias}
mdoc["memberships"] = newMM
if "count" in mdoc:
    mdoc["count"] = len(newMM)

n_art = 0
for a in arts:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]
        n_art += 1

n_cur = 0
for k in [k for k in list(CU) if k in alias]:
    tgt = alias[k]
    src = CU.pop(k)
    if tgt in CU and isinstance(CU[tgt], dict) and isinstance(src, dict):
        for f, val in src.items():
            CU[tgt].setdefault(f, val)
    else:
        CU[tgt] = src
    n_cur += 1
for k, ent in CU.items():
    if not isinstance(ent, dict):
        continue
    if ent.get("merge_into") in alias:
        ent["merge_into"] = alias[ent["merge_into"]]
        n_cur += 1
    # A re-key can leave a SELF-merge (the curator's old target lost the
    # winner pick, or a member's pointer now names itself) — vacuous after
    # the physical absorb; drop it rather than ship a row that merges into
    # itself. Same for an entry's own key inside merge_members.
    if ent.get("merge_into") == k:
        del ent["merge_into"]
        n_cur += 1
    if isinstance(ent.get("merge_members"), list):
        ent["merge_members"] = [alias.get(m, m) for m in ent["merge_members"]
                                if alias.get(m, m) != k]

# ── V-gates ──────────────────────────────────────────────────────────────────
C = cat["courses"]


def _twin_count(cc):
    g = defaultdict(list)
    for mid, v in cc.items():
        if not v.get("discipline"):
            continue
        fk = fam(v.get("common_title"))
        if not fk:
            continue
        g[(v.get("subject_4letter"), v.get("discipline"), band_of(v), fk,
           v.get("credit_status"), v.get("typical_units"))].append(mid)
    # guard-skipped groups legitimately remain — count only CLEAN twin groups
    n = 0
    for key, mids in g.items():
        if len(mids) < 2:
            continue
        marks = {m: extract_marks(cc[m].get("common_title")) for m in mids}
        if any(marks_conflict(marks[a], marks[b])
               for i, a in enumerate(mids) for b in mids[i + 1:]):
            continue
        n += 1
    return n


gates = {}
gates["G1 every loser absorbed (gone from courses, winner present)"] = all(
    l not in C and w in C for l, w in alias.items())
gates["G2 zero clean twin groups remain"] = _twin_count(C) == 0
gates["G3 id consistency (key == course_id)"] = all(
    k == v.get("course_id") for k, v in C.items())
gates["G4 no articulation points at a loser"] = not any(
    a.get("course_id") in alias for a in arts)
gates["G5 untouched records byte-identical"] = _untouched_before == json.dumps(
    {k: v for k, v in C.items() if k not in _touched}, sort_keys=True)
gates["G6 no membership key on a loser"] = not any(k in alias for k in newMM)
print("  V-gates:")
for g, ok in gates.items():
    print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")


def _w(path, obj, nl=False):
    with open(kb(path), "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        if nl:
            f.write("\n")


_w("coci_minted_courses.json", cat)
_w("coci_minted_memberships.json", mdoc)
_w("coci_articulations.json", adoc)
_w("coci_curation.json", cdoc, nl=True)
json.dump({"generated_at": _dt.now().isoformat(),
           "direction": "loser → winner (rollback = invert; losers were pure merges, no re-numbering)",
           "alias_map": alias,
           "merges": [{"from": a, "into": b} for a, b, _, _ in merges]},
          open(os.path.join(outdir, "alias_map.json"), "w"), ensure_ascii=False, indent=1)
print(f"  ✓ APPLIED. courses {len(newC)} (was {len(newC) + len(alias)}); articulations re-pointed {n_art}; "
      f"curation refs {n_cur}. alias receipt → {os.path.relpath(os.path.join(outdir, 'alias_map.json'), SD)}")
if cur_hits:
    print("  ⚠ NOW MIRROR THE CURATION RE-KEYS TO SUPABASE kb_curation (see the tuples above).")
print("  next (Rule-7 checklist): register the alias map in kb/_rekey_promotions.py ALIAS_MAPS +")
print("        run it with --apply; re-seed CSR; re-run kb/_row_audit.py; regenerate artifacts.")
