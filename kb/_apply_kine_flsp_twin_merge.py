#!/usr/bin/env python3
"""KINE + FLSP strict twin-merge pass — Rule-7 merge (no re-numbering).

DRY-RUN by default (read-only, writes a review manifest); ``--apply`` mutates the KB.

The Session-38 convergences put all the PE/KIN duplicates into ONE SUBJ4 (and the
FL re-mint did the same for Spanish) — leaving exact twins like "Basketball II" /
"Basketball 2" or "Elementary Spanish I" / "Elementary Spanish 1" as separate
M-IDs. The Suggested-merges worklist surfaces them for curator confirms; this pass
(Sam-authorized 2026-06-10, Session 39) programmatically merges ONLY the strictest
twin class, leaving everything fuzzier to the worklist:

  twin key = (discipline, band, strict-fam-key, credit_status, typical_units)

  - strict-fam-key: the #334 ordinal-rule family key WITH the single-letter-roman
    fix ("Swimming V" ≠ "Swimming I" ≠ "Swimming") — only true same-level dups
    collapse (Golf I/II/III/IV stay distinct).
  - same band AND same credit_status string (noncredit never folds into credit,
    "Noncredit" never folds into "Noncredit Enhanced").
  - same typical_units (None == None counts as agreement; 4.0 vs 5.0 Spanish
    variants do NOT merge — the worklist can still propose those).

Winner per group = most corroborating colleges, tiebreak lowest M-number. Losers
fold in: corroboration summed, memberships extended, articulations re-pointed,
curation overlay re-keyed. MERGE ONLY — no identity gets a new number, so there is
no band-capacity concern and the alias map (loser → winner) is the full receipt.

⚠ Supabase mirror (the Session-39 lesson): kb/coci_curation.json is REBUILT from
Supabase ``kb_curation`` on every cron, so any curation re-key this apply makes
must ALSO be applied to Supabase or the next sync resurrects the dead ids. The
apply prints the exact (course_id, field, old → new) tuples that need mirroring.

Scope: parents only (coci_minted_courses.json). Singletons stay the worklist's
curator-confirmed lane. Run from repo root. Receipt: kb/twin_merge_out/<date>/.
"""
import json, re, sys, os
from collections import defaultdict
from datetime import datetime as _dt

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
def kb(p): return os.path.join(SD, p)

SCOPE_SUBJ4 = ("KINE", "FLSP")

# ── the STRICT level-safe family key (verbatim from kb/_apply_kin_pe_convergence.py:
# the canonical excel_to_dashboard.py:_fam_key PLUS the single-letter-roman fix) ──
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
        if w == "emt": toks += ["emergency", "medical", "technician"]
        elif w == "tech": toks.append("technician")
        else: toks.append(w)
    keep = []
    for w in toks:
        if w in _FAM_ROMAN: w = _FAM_ROMAN[w]
        if len(w) == 1 and not w.isdigit(): continue
        if w in _FAM_DROP or w in _FAM_FORMAT: continue
        if w.isdigit():
            if w == "1" or len(w) >= 2: continue
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

# Snapshot of every OUT-of-scope record for the untouched-lane gate (G5).
_out_of_scope_before = json.dumps(
    {k: v for k, v in courses.items() if v.get("subject_4letter") not in SCOPE_SUBJ4},
    sort_keys=True)

# ── plan: group scope parents by the strict twin key ─────────────────────────
groups = defaultdict(list)
for mid, v in courses.items():
    if v.get("subject_4letter") not in SCOPE_SUBJ4:
        continue
    fk = fam(v.get("common_title"))
    if not fk:
        continue
    key = (v.get("subject_4letter"), v.get("discipline"), band_of(v), fk,
           v.get("credit_status"), v.get("typical_units"))
    groups[key].append(mid)

alias = {}     # loser -> winner
merges = []    # (loser, winner, loser_title, winner_title)
per_subj = defaultdict(int)
for key, mids in sorted(groups.items()):
    if len(mids) < 2:
        continue
    ranked = sorted(mids, key=lambda m: (-(courses[m].get("corroboration_members") or 0), mseq(m)))
    winner = ranked[0]
    for loser in ranked[1:]:
        alias[loser] = winner
        merges.append((loser, winner,
                       courses[loser].get("common_title"), courses[winner].get("common_title")))
        per_subj[key[0]] += 1

# ── ripple measurement ───────────────────────────────────────────────────────
adoc = json.load(open(kb("coci_articulations.json")))
arts = adoc["articulations"] if isinstance(adoc, dict) else adoc
art_hits = sum(1 for a in arts if a.get("course_id") in alias)
mdoc = json.load(open(kb("coci_minted_memberships.json")))
MM = mdoc["memberships"]
mem_hits = sum(1 for k in MM if k in alias)
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
# Curation hits = entry KEYS on a loser + merge_into/merge_members VALUES naming a
# loser. These are the rows that ALSO need the Supabase kb_curation mirror.
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
print(f"KINE/FLSP strict twin-merge — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
n_groups = sum(1 for mids in groups.values() if len(mids) > 1)
print(f"  twin groups: {n_groups}   losers to merge: {len(alias)}   "
      f"({', '.join(f'{s}={n}' for s, n in sorted(per_subj.items()))})")
print(f"  ripple — articulations: {art_hits}/{len(arts)}   membership keys: {mem_hits}   "
      f"curation refs: {len(cur_hits)}")
if cur_hits:
    print("  ⚠ curation rows needing the SUPABASE mirror after --apply:")
    for k, f, old, new in cur_hits:
        print(f"     {k} | {f}: {old} → {new}")

outdir = kb(os.path.join("twin_merge_out", _dt.now().strftime("%Y-%m-%d")))
os.makedirs(outdir, exist_ok=True)
json.dump({"generated_at": _dt.now().isoformat(), "scope": list(SCOPE_SUBJ4),
           "twin_key": "(subj4, discipline, band, strict_fam, credit_status, typical_units)",
           "alias_map": alias,
           "merges": [{"from": a, "into": b, "from_title": t, "into_title": wt}
                      for a, b, t, wt in merges]},
          open(os.path.join(outdir, "twin_merge_manifest.json"), "w"), indent=1, ensure_ascii=False)
print(f"  manifest → {os.path.relpath(os.path.join(outdir, 'twin_merge_manifest.json'), SD)}")

print("\n  merges (review every line — same course, same level?):")
for a, b, t, wt in merges:
    print(f"     {a:13} '{t}'  →  {b:13} '{wt}'")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Re-run with --apply after reviewing the manifest.")
    sys.exit(0)

# ── apply ────────────────────────────────────────────────────────────────────
print("\n--apply: mutating KB …")

# 1) courses — losers absorbed (corroboration summed), winners keep their slot;
# rebuild in original key order so the diff is proportional.
for loser, winner in alias.items():
    courses[winner]["corroboration_members"] = (courses[winner].get("corroboration_members") or 0) + \
                                               (courses[loser].get("corroboration_members") or 0)
newC = {k: v for k, v in courses.items() if k not in alias}
cat["courses"] = newC
if "count" in cat: cat["count"] = len(newC)

# 2) memberships — extend the winner's member list with the loser's, drop the loser key.
for loser, winner in alias.items():
    if loser in MM:
        MM.setdefault(winner, []).extend(MM[loser])
newMM = {k: v for k, v in MM.items() if k not in alias}
mdoc["memberships"] = newMM
if "count" in mdoc: mdoc["count"] = len(newMM)

# 3) articulations — re-point loser course_ids.
n_art = 0
for a in arts:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]; n_art += 1

# 4) curation overlay — re-key loser entry keys (FIELD-MERGE if the winner already
# has an entry: the winner's own fields win, loser fields fill gaps) + re-point
# merge_into / merge_members values. Mirror these SAME edits to Supabase kb_curation.
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
    if not isinstance(ent, dict): continue
    if ent.get("merge_into") in alias:
        ent["merge_into"] = alias[ent["merge_into"]]; n_cur += 1
    if isinstance(ent.get("merge_members"), list):
        ent["merge_members"] = [alias.get(m, m) for m in ent["merge_members"]]

# ── V-gates ──────────────────────────────────────────────────────────────────
C = cat["courses"]
def _twin_count(cc):
    g = defaultdict(int)
    for mid, v in cc.items():
        if v.get("subject_4letter") not in SCOPE_SUBJ4: continue
        fk = fam(v.get("common_title"))
        if not fk: continue
        g[(v.get("subject_4letter"), v.get("discipline"), band_of(v), fk,
           v.get("credit_status"), v.get("typical_units"))] += 1
    return sum(1 for n in g.values() if n > 1)
gates = {}
gates["G1 every loser absorbed (gone from courses, winner present)"] = all(
    l not in C and w in C for l, w in alias.items())
gates["G2 zero twin groups remain in scope"] = _twin_count(C) == 0
gates["G3 id consistency (key == course_id)"] = all(
    k == v.get("course_id") for k, v in C.items())
gates["G4 no articulation points at a loser"] = not any(
    a.get("course_id") in alias for a in arts)
gates["G5 out-of-scope records byte-identical"] = _out_of_scope_before == json.dumps(
    {k: v for k, v in C.items() if v.get("subject_4letter") not in SCOPE_SUBJ4}, sort_keys=True)
gates["G6 no membership key on a loser"] = not any(k in alias for k in newMM)
print("  V-gates:")
for g, ok in gates.items():
    print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")

# ── write back ───────────────────────────────────────────────────────────────
def _w(path, obj, nl=False):
    with open(kb(path), "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        if nl: f.write("\n")   # kb/_apply_curation.py (the daily sync) writes a
                               # trailing newline — match it so the cron sees no diff
_w("coci_minted_courses.json", cat)
_w("coci_minted_memberships.json", mdoc)
_w("coci_articulations.json", adoc)
_w("coci_curation.json", cdoc, nl=True)
json.dump({"generated_at": _dt.now().isoformat(), "direction": "loser → winner (rollback = invert; losers were pure merges, no re-numbering)",
           "alias_map": alias,
           "merges": [{"from": a, "into": b} for a, b, _, _ in merges]},
          open(os.path.join(outdir, "alias_map.json"), "w"), ensure_ascii=False, indent=1)
print(f"  ✓ APPLIED. courses {len(newC)} (was {len(newC) + len(alias)}); articulations re-pointed {n_art}; "
      f"curation refs {n_cur}. alias receipt → {os.path.relpath(os.path.join(outdir, 'alias_map.json'), SD)}")
if cur_hits:
    print("  ⚠ NOW MIRROR THE CURATION RE-KEYS TO SUPABASE kb_curation (see the tuples above) —")
    print("    the daily sync rebuilds kb/coci_curation.json from Supabase and will otherwise")
    print("    resurrect the merged ids (the Session-39 PHYS M1265 lesson).")
print("  next: re-seed CSR (python3 kb/_seed_canonical_subj4.py), re-run kb/_row_audit.py, commit;")
print("        the cron regenerates unified_courses_*.js with the merged identities.")
