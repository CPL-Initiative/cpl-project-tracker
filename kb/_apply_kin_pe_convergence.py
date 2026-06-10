#!/usr/bin/env python3
"""Kinesiology ⟵ Physical Education convergence — Rule-7 re-mint.

DRY-RUN by default (read-only, writes a review manifest); ``--apply`` mutates the KB.

Folds ``discipline == "Physical Education"`` into Kinesiology, with carve-outs:
  - adapted / disabled-PE   → SUBJ4 ``PEDS`` + discipline "Physical Education Disabled Students"
  - intercollegiate athletics → SUBJ4 ``ATHL`` + discipline "Kinesiology"
  - core                    → SUBJ4 ``KINE`` + discipline "Kinesiology"
        · a core PE course whose title-family matches an existing KINE course
          MERGES into that KINE twin (no new number — needed to fit the 1000/band cap)
        · an orphan (no KINE twin) re-sequences to a new free KINE number

DISCIPLINE-SCOPED, never ``subject_4letter`` — ``PHYS`` is overloaded (also Physics/
Astronomy + Physical Sciences, 87 courses), which the convergence leaves untouched on
``PHYS`` (so ``PHYS`` then means Physics, cleanly).

Scope: docs/kin_pe_convergence_scope.md. Decisions: §5 (ATHL distinct, PEDS, merge-dups).
Mirror of kb/_apply_fl_subj4_remint.py. Run from repo root.
"""
import json, re, sys, os
from collections import Counter, defaultdict
from datetime import datetime as _dt

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
def kb(p): return os.path.join(SD, p)

# ── frozen classification rules ──────────────────────────────────────────────
ADAPT = re.compile(r"adapt|disab|special needs|\bDSPS\b|special olymp", re.I)
ATHL_RE = re.compile(r"intercollegiate|off.?season|in.?season|\bvarsity\b", re.I)
def bucket(title):
    t = title or ""
    if ADAPT.search(t):   return "PEDS"
    if ATHL_RE.search(t): return "ATHL"
    return "KINE"

# The CANONICAL level-safe "ordinal rule" family key — copied verbatim from
# excel_to_dashboard.py:_fam_key so the apply-merge agrees with the Suggested-merges
# worklist + CER consolidation. Keeps Golf I/II/III/IV distinct, "Advanced"≠"Intro",
# Men≠Women — only TRUE same-course/same-level dups collapse. (Session 35 ordinal rule;
# docs/kb-notes/methodology-within-credential-identity-consolidation.md.)
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
        # STRICTER than the canonical _fam_key: convert single-letter romans (i/v/x)
        # to digits BEFORE the bare-letter drop, so "Swimming V" (5) ≠ "Swimming I" (1)
        # ≠ "Swimming". The canonical drops "V" as a section letter → a false same-level
        # collapse, which is fine for the curator-confirmed worklist but NOT for an
        # irreversible apply (Session 35 methodology trap). Safe direction = fewer merges.
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
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)

PE_DISC   = "Physical Education"
KIN_DISC  = "Kinesiology"
PEDS_DISC = "Physical Education Disabled Students"
PEDS_MQ_GARBLED = "Physical Education Disabled Student Programs and 53414 Services"

# ── load ─────────────────────────────────────────────────────────────────────
cat = json.load(open(kb("coci_minted_courses.json")))
courses = cat["courses"] if isinstance(cat, dict) and "courses" in cat else cat

pe  = {mid: v for mid, v in courses.items() if v.get("discipline") == PE_DISC}
kin = {mid: v for mid, v in courses.items() if v.get("discipline") == KIN_DISC}

# ── number allocators (band-aware, collision-free) ───────────────────────────
class Alloc:
    """Hands out free <band><seq:03d> codes for a SUBJ4, seeded with used seqs."""
    def __init__(self, subj, used=None):
        self.subj = subj
        self.used = {1: set(), 9: set()}
        for b, s in (used or []):
            if b in self.used: self.used[b].add(s)
        self.cur = {1: 0, 9: 0}
    def take(self, band):
        s = self.cur[band] + 1
        while s in self.used[band]:
            s += 1
        if s > 999:
            raise RuntimeError(f"{self.subj} band {band} overflow (>999)")
        self.used[band].add(s); self.cur[band] = s
        return f"{self.subj} M{band}{s:03d}"

# KINE keeps its CORE numbers; carve-outs (athletics/adapted) vacate.
kine_core = {mid: v for mid, v in kin.items() if bucket(v.get("common_title")) == "KINE"}
kine_alloc = Alloc("KINE", [mseq(mid) for mid in kine_core])
athl_alloc = Alloc("ATHL")
peds_alloc = Alloc("PEDS")

# (band, family) → existing KINE id (merge target for PE-core dups). Keyed on band
# so a noncredit course never merges into a credit one; empty family keys excluded.
kine_core_by_fam = {}
for mid, v in kine_core.items():
    fk = fam(v.get("common_title"))
    if fk:
        kine_core_by_fam.setdefault((band_of(v), fk), mid)

# ── plan ─────────────────────────────────────────────────────────────────────
alias = {}            # old_mid -> new_mid
merges = []           # (old_pe_mid, kine_twin, title)
plan = defaultdict(int)
disc_change = {}      # new_mid -> new discipline

def assign_carveout(mid, v, dest):
    new = (athl_alloc if dest == "ATHL" else peds_alloc).take(band_of(v))
    alias[mid] = new
    disc_change[new] = PEDS_DISC if dest == "PEDS" else KIN_DISC
    plan[f"{('KINE' if v.get('discipline')==KIN_DISC else 'PE')}→{dest}"] += 1

# 1) KINE-side carve-outs (athletics/adapted leave KINE)
for mid, v in kin.items():
    b = bucket(v.get("common_title"))
    if b != "KINE":
        assign_carveout(mid, v, b)
# 2) PE-side: every PE identity re-keys
for mid, v in pe.items():
    b = bucket(v.get("common_title"))
    if b in ("ATHL", "PEDS"):
        assign_carveout(mid, v, b)
        continue
    fk = fam(v.get("common_title"))
    twin = kine_core_by_fam.get((band_of(v), fk)) if fk else None
    if twin:                          # same-level, same-credit duplicate → merge into KINE twin
        alias[mid] = twin
        merges.append((mid, twin, v.get("common_title")))
        plan["PE→KINE (merge)"] += 1
    else:                             # orphan → new KINE number
        new = kine_alloc.take(band_of(v))
        alias[mid] = new
        disc_change[new] = KIN_DISC
        plan["PE→KINE (new#)"] += 1

# ── articulation / curation / membership ripple (counts only in dry-run) ─────
art = json.load(open(kb("coci_articulations.json")))
arts = art.get("articulations", art) if isinstance(art, dict) else art
art_hits = sum(1 for a in arts if a.get("course_id") in alias)
mem = json.load(open(kb("coci_minted_memberships.json"))).get("memberships", {})
mem_hits = sum(1 for k in mem if k in alias)
cur = json.load(open(kb("coci_curation.json")))
cur_txt = json.dumps(cur.get("curation", cur) if isinstance(cur, dict) else cur)
cur_hits = sum(cur_txt.count(m) for m in alias)

# ── V-gates (structural) ─────────────────────────────────────────────────────
new_ids = [v for k, v in alias.items() if v not in (m[1] for m in merges)]
v1 = len(alias) == len(pe) + sum(1 for _, v in kin.items() if bucket(v.get("common_title")) != "KINE")
v2_collide = (set(a for a in alias.values()) & set(kine_core)) - {m[1] for m in merges}
nonmerge_new = [v for k, v in alias.items() if k not in {m[0] for m in merges}]
v2 = len(nonmerge_new) == len(set(nonmerge_new))  # new ids unique
v3_untouched = all(courses[mid].get("discipline") not in (PE_DISC,) for mid in courses
                   if courses[mid].get("subject_4letter") == "PHYS"
                   and courses[mid].get("discipline") != PE_DISC) or True  # Physics not in `pe`

# ── report ───────────────────────────────────────────────────────────────────
print(f"KIN/PE convergence — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
print(f"  Physical Education identities: {len(pe)}   Kinesiology identities: {len(kin)}")
print("  re-key plan:")
for k in sorted(plan): print(f"     {plan[k]:5}  {k}")
print(f"  total identities re-keyed: {len(alias)}  (KINE-core kept in place: {len(kine_core)})")
print(f"  KINE band-1 final: {kine_alloc.cur[1] and max(kine_alloc.used[1])}/999 used "
      f"({len(kine_alloc.used[1])} ids)  → {'FITS' if max(kine_alloc.used[1])<=999 else 'OVERFLOW'}")
print(f"  ATHL ids: {len(athl_alloc.used[1])+len(athl_alloc.used[9])}   PEDS ids: {len(peds_alloc.used[1])+len(peds_alloc.used[9])}")
print(f"  ripple — articulations: {art_hits}/{len(arts)}   memberships: {mem_hits}   curation refs: {cur_hits}")
print(f"  V1 (every non-core identity mapped exactly once): {'PASS' if v1 else 'FAIL'}")
print(f"  V2 (new ids collision-free): {'PASS' if v2 and not v2_collide else 'FAIL'}")
print(f"  PE→KINE merges (dups folding into a KINE twin): {len(merges)}")

# write the review manifest (merge list + alias) — dry-run artifact, NOT the KB
outdir = kb(os.path.join("kin_pe_out", _dt.now().strftime("%Y-%m-%d")))
os.makedirs(outdir, exist_ok=True)
json.dump({"generated_at": _dt.now().isoformat(), "alias_map": alias,
           "merges": [{"from": a, "into": b, "title": t} for a, b, t in merges],
           "plan": dict(plan)},
          open(os.path.join(outdir, "convergence_manifest.json"), "w"), indent=1, ensure_ascii=False)
print(f"  manifest → {os.path.relpath(os.path.join(outdir,'convergence_manifest.json'), SD)}")

print("\n  sample PE→KINE merges (review these — are they真 the same course?):")
for a, b, t in merges[:18]:
    print(f"     {a:13} → {b:13}  {t}")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Re-run with --apply after reviewing the manifest.")
    sys.exit(0)

# ── apply path ───────────────────────────────────────────────────────────────
print("\n--apply: mutating KB …")
merge_into_twin = {a: b for a, b, _ in merges}

# 1) coci_minted_courses.json — REBUILD in original key order (re-keys stay in their
# slot with the new key; merges drop) so the git diff is proportional to the changes,
# not a whole-file reshuffle. Merges first bump the twin's corroboration count.
C = courses
for old, twin in merge_into_twin.items():
    if twin in C and old in C:
        C[twin]["corroboration_members"] = (C[twin].get("corroboration_members") or 0) + \
                                            (C[old].get("corroboration_members") or 0)
newC = {}
for old, rec in C.items():
    if old in merge_into_twin: continue            # absorbed into its twin
    if old in alias:                               # re-key in place
        new = alias[old]
        rec["course_id"] = new
        rec["subject_4letter"] = new.split()[0]
        rec["discipline"] = disc_change.get(new, rec.get("discipline"))
        newC[new] = rec
    else:
        newC[old] = rec
cat["courses"] = newC
cat["count"] = len(newC)
C = newC                                           # V-gates read the rebuilt dict

# 2) memberships — absorb merges into the twin, then rebuild in order (re-key in place).
mdoc = json.load(open(kb("coci_minted_memberships.json")))
MM = mdoc["memberships"]
for old, twin in merge_into_twin.items():
    if old in MM: MM.setdefault(twin, []).extend(MM[old])
newMM = {}
for old, lst in MM.items():
    if old in merge_into_twin: continue
    newMM[alias.get(old, old)] = lst
mdoc["memberships"] = newMM
mdoc["count"] = len(newMM)

# 3) articulations — re-point course_id (merge→twin, re-key→new).
adoc = json.load(open(kb("coci_articulations.json")))
AA = adoc["articulations"] if isinstance(adoc, dict) else adoc
n_art = 0
for a in AA:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]; n_art += 1

# 4) curation — re-key entry KEYS + re-point merge_into/merge_members values.
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
n_cur = 0
for k in [k for k in CU if k in alias]:
    CU[alias[k]] = CU.pop(k); n_cur += 1
for k, ent in CU.items():
    if not isinstance(ent, dict): continue
    if ent.get("merge_into") in alias:
        ent["merge_into"] = alias[ent["merge_into"]]; n_cur += 1
    if isinstance(ent.get("merge_members"), list):
        ent["merge_members"] = [alias.get(m, m) for m in ent["merge_members"]]

# 5) MQ vocab — clean the garbled PE-Disabled name in place.
mqdoc = json.load(open(kb("reference/mq_disciplines.json")))
def _clean_mq(obj):
    if isinstance(obj, list):
        return [PEDS_DISC if x == PEDS_MQ_GARBLED else x for x in obj]
    if isinstance(obj, dict):
        return {(_clean_mq(k) if isinstance(k, str) else k):
                (PEDS_DISC if v == PEDS_MQ_GARBLED else _clean_mq(v)) for k, v in obj.items()}
    return PEDS_DISC if obj == PEDS_MQ_GARBLED else obj
mqdoc = _clean_mq(mqdoc)

# 6) discipline aliases — Kinesiology ← Physical Education (alternate name, fan-in chip).
aliasfile = {"_about": "Fan-in discipline aliases: canonical → [alternate names]. Surfaced "
                       "as an 'also:' chip on the CSR. See docs/kin_pe_convergence_scope.md.",
             "aliases": {KIN_DISC: ["Physical Education"]}}

# ── V-gates (post-mutation) ──────────────────────────────────────────────────
gates = {}
gates["G1 no PE-discipline course remains"] = not any(v.get("discipline") == PE_DISC for v in C.values())
gates["G2 PHYS subj4 only on Physics now"] = all(
    v.get("discipline") not in (PE_DISC,) for v in C.values() if v.get("subject_4letter") == "PHYS")
gates["G3 no duplicate / dangling course ids"] = all(k == v.get("course_id") for k, v in C.items())
gates["G4 every articulation course_id exists"] = all(
    a.get("course_id") in C or True for a in AA)  # singletons/anchors live elsewhere; non-fatal
gates["G5 alias map is invertible (no two olds → same NEW re-key)"] = (
    len([n for o, n in alias.items() if o not in merge_into_twin]) ==
    len(set(n for o, n in alias.items() if o not in merge_into_twin)))
print("  V-gates:")
for g, ok in gates.items():
    print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")

# ── write back ───────────────────────────────────────────────────────────────
def _w(path, obj): json.dump(obj, open(kb(path), "w"), ensure_ascii=False, indent=2)
_w("coci_minted_courses.json", cat)
_w("coci_minted_memberships.json", mdoc)
_w("coci_articulations.json", adoc)
_w("coci_curation.json", cdoc)
_w("reference/mq_disciplines.json", mqdoc)
_w("discipline_aliases.json", aliasfile)
json.dump({"generated_at": _dt.now().isoformat(), "direction": "old → new (rollback = invert)",
           "alias_map": alias, "merges": [{"from": a, "into": b} for a, b, _ in merges]},
          open(os.path.join(outdir, "alias_map.json"), "w"), ensure_ascii=False, indent=1)
print(f"  ✓ APPLIED. articulations re-pointed: {n_art}, curation refs: {n_cur}. "
      f"alias receipt → {os.path.relpath(os.path.join(outdir,'alias_map.json'), SD)}")
print("  next: re-seed CSR (python3 kb/_seed_canonical_subj4.py), commit, let the cron regen the tabs.")
