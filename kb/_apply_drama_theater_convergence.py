#!/usr/bin/env python3
"""Drama/Theater Arts ⟵ Theater Arts convergence — Rule-7 fan-in re-mint #2.

DRY-RUN by default (read-only, writes a review manifest); ``--apply`` mutates the KB.

The second fan-in convergence (template: the KIN/PE one, kb/_apply_kin_pe_convergence.py),
and the simpler shape: the MQ vocab carries BOTH "Drama/Theater Arts" (54 ids, SUBJ4
``DRAM``) and "Theater Arts" (266 ids, SUBJ4 ``THEA``) for one field.

Decisions (Sam, 2026-06-10): canonical discipline = **"Drama/Theater Arts"** (the MQ
Disciplines-List slash form); canonical SUBJ4 = **THEA** (the majority space + natural
enrollment code); "Theater Arts" recorded as the **alternate name**.

Mechanics:
  - the 266 ``THEA`` rows keep their M-IDs; discipline flips Theater Arts → Drama/Theater Arts
  - the 54 ``DRAM`` rows re-key into ``THEA``: a level-safe (band, _fam_key) twin MERGES
    (4 expected); the rest re-sequence to free THEA numbers (all 54 old numbers collide)
  - no carve-outs (film-titled rows are stage/acting courses; "Film and Media Studies"
    is its own MQ, untouched); no PHYS-style SUBJ4 overload on either code (verified)
  - "Theater Arts" → alternate name in kb/discipline_aliases.json

Run from repo root. Alias receipt: kb/drama_theater_out/<date>/alias_map.json.
"""
import json, re, sys, os
from collections import defaultdict
from datetime import datetime as _dt

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
def kb(p): return os.path.join(SD, p)

CANON_DISC = "Drama/Theater Arts"
ALT_DISC   = "Theater Arts"
CANON_SUBJ = "THEA"
OLD_SUBJ   = "DRAM"

# ── level-safe family key — same strict variant as the KIN/PE apply (canonical
# _fam_key + single-letter-roman fix so "X V"≠"X I"≠"X"; safe direction = fewer merges).
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
        if w == "tech": toks.append("technician")
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
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)

# ── load ─────────────────────────────────────────────────────────────────────
cat = json.load(open(kb("coci_minted_courses.json")))
courses = cat["courses"]
dram = {m: v for m, v in courses.items() if v.get("subject_4letter") == OLD_SUBJ}
thea = {m: v for m, v in courses.items() if v.get("subject_4letter") == CANON_SUBJ}

# overload guard (the PHYS lesson): both codes must carry exactly their one discipline.
assert all(v.get("discipline") == CANON_DISC for v in dram.values()), "DRAM carries a non-Drama discipline — re-measure"
assert all(v.get("discipline") == ALT_DISC for v in thea.values()), "THEA carries a non-Theater-Arts discipline — re-measure"

class Alloc:
    def __init__(self, used):
        self.used = {1: set(), 9: set()}
        for b, s in used:
            if b in self.used: self.used[b].add(s)
        self.cur = {1: 0, 9: 0}
    def take(self, band):
        s = self.cur[band] + 1
        while s in self.used[band]: s += 1
        if s > 999: raise RuntimeError("THEA band overflow")
        self.used[band].add(s); self.cur[band] = s
        return f"{CANON_SUBJ} M{band}{s:03d}"

alloc = Alloc([mseq(m) for m in thea])
thea_by_fam = {}
for m, v in thea.items():
    fk = fam(v.get("common_title"))
    if fk: thea_by_fam.setdefault((band_of(v), fk), m)

alias, merges = {}, []
for m, v in dram.items():
    fk = fam(v.get("common_title"))
    twin = thea_by_fam.get((band_of(v), fk)) if fk else None
    if twin:
        alias[m] = twin; merges.append((m, twin, v.get("common_title")))
    else:
        alias[m] = alloc.take(band_of(v))

# ripple
arts_doc = json.load(open(kb("coci_articulations.json")))
AA = arts_doc["articulations"]
art_hits = sum(1 for a in AA if a.get("course_id") in alias)
mdoc = json.load(open(kb("coci_minted_memberships.json")))
MM = mdoc["memberships"]
mem_hits = sum(1 for k in MM if k in alias)
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
cur_hits = sum(1 for k in CU if k in alias) + sum(
    1 for e in CU.values() if isinstance(e, dict) and e.get("merge_into") in alias)

print(f"Drama/Theater convergence — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
print(f"  {OLD_SUBJ} (Drama/Theater Arts): {len(dram)}   {CANON_SUBJ} (Theater Arts): {len(thea)}")
print(f"  DRAM→THEA merges: {len(merges)}   re-sequenced: {len(alias)-len(merges)}")
print(f"  THEA discipline flips → {CANON_DISC!r}: {len(thea)}")
print(f"  THEA band-1 final: {max(alloc.used[1]) if alloc.used[1] else 0}/999")
print(f"  ripple — articulations: {art_hits}/{len(AA)}   memberships: {mem_hits}   curation: {cur_hits}")
for a, b, t in merges:
    print(f"     merge {a:12} → {b:12}  {t}")

outdir = kb(os.path.join("drama_theater_out", _dt.now().strftime("%Y-%m-%d")))
os.makedirs(outdir, exist_ok=True)
json.dump({"generated_at": _dt.now().isoformat(), "alias_map": alias,
           "merges": [{"from": a, "into": b, "title": t} for a, b, t in merges]},
          open(os.path.join(outdir, "convergence_manifest.json"), "w"), indent=1, ensure_ascii=False)
print(f"  manifest → {os.path.relpath(os.path.join(outdir, 'convergence_manifest.json'), SD)}")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Re-run with --apply after review.")
    sys.exit(0)

# ── apply ────────────────────────────────────────────────────────────────────
print("\n--apply: mutating KB …")
merge_into_twin = {a: b for a, b, _ in merges}
for old, twin in merge_into_twin.items():
    courses[twin]["corroboration_members"] = (courses[twin].get("corroboration_members") or 0) + \
                                              (courses[old].get("corroboration_members") or 0)
newC = {}
for old, rec in courses.items():
    if old in merge_into_twin: continue
    if old in alias:                                  # DRAM re-key (discipline already canonical)
        new = alias[old]
        rec["course_id"] = new
        rec["subject_4letter"] = CANON_SUBJ
        newC[new] = rec
    else:
        if rec.get("discipline") == ALT_DISC:         # THEA discipline flip, id unchanged
            rec["discipline"] = CANON_DISC
        newC[old] = rec
cat["courses"] = newC; cat["count"] = len(newC)

for old, twin in merge_into_twin.items():
    if old in MM: MM.setdefault(twin, []).extend(MM[old])
newMM = {}
for old, lst in MM.items():
    if old in merge_into_twin: continue
    newMM[alias.get(old, old)] = lst
mdoc["memberships"] = newMM; mdoc["count"] = len(newMM)

n_art = 0
for a in AA:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]; n_art += 1

n_cur = 0
for k in [k for k in CU if k in alias]:
    CU[alias[k]] = CU.pop(k); n_cur += 1
for ent in CU.values():
    if isinstance(ent, dict):
        if ent.get("merge_into") in alias:
            ent["merge_into"] = alias[ent["merge_into"]]; n_cur += 1
        if isinstance(ent.get("merge_members"), list):
            ent["merge_members"] = [alias.get(x, x) for x in ent["merge_members"]]

afile = json.load(open(kb("discipline_aliases.json")))
afile["aliases"][CANON_DISC] = sorted(set(afile["aliases"].get(CANON_DISC, []) + [ALT_DISC]))

gates = {
    "G1 no 'Theater Arts' discipline remains": not any(v.get("discipline") == ALT_DISC for v in newC.values()),
    "G2 no DRAM subject_4letter remains": not any(v.get("subject_4letter") == OLD_SUBJ for v in newC.values()),
    "G3 key == course_id everywhere": all(k == v.get("course_id") for k, v in newC.items()),
    "G4 new ids collision-free": len([n for o, n in alias.items() if o not in merge_into_twin]) ==
                                 len(set(n for o, n in alias.items() if o not in merge_into_twin)),
}
print("  V-gates:")
for g, ok in gates.items(): print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")

def _w(path, obj): json.dump(obj, open(kb(path), "w"), ensure_ascii=False, indent=2)
_w("coci_minted_courses.json", cat)
_w("coci_minted_memberships.json", mdoc)
_w("coci_articulations.json", arts_doc)
_w("coci_curation.json", cdoc)
_w("discipline_aliases.json", afile)
json.dump({"generated_at": _dt.now().isoformat(), "direction": "old → new (rollback = invert)",
           "alias_map": alias, "merges": [{"from": a, "into": b} for a, b, _ in merges],
           "discipline_flip": {ALT_DISC: CANON_DISC}},
          open(os.path.join(outdir, "alias_map.json"), "w"), ensure_ascii=False, indent=1)
print(f"  ✓ APPLIED. articulations re-pointed: {n_art}, curation refs: {n_cur}. "
      f"alias receipt → {os.path.relpath(os.path.join(outdir, 'alias_map.json'), SD)}")
print("  next: re-seed CSR (python3 kb/_seed_canonical_subj4.py), commit.")
