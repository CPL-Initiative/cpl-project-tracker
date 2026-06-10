#!/usr/bin/env python3
"""Extend the two 2026-06-10 fan-in convergences to the SINGLETON layer.

DRY-RUN by default; ``--apply`` mutates the KB.

The KIN/PE (kb/_apply_kin_pe_convergence.py) and Drama/Theater
(kb/_apply_drama_theater_convergence.py) applies converged the MINTED-PARENT layer
(coci_minted_courses.json) but not the ~56k single-college stand-alones
(coci_minted_singletons.json), which carry the same disciplines + SUBJ4-prefixed
stand-alone ids (``SUBJ M<band><d><LL>``) and feed the CSR seed, the CCR
Stand-Alone filter, and the Suggested-merges worklist.

Same rules, same decisions (scope §5 + Sam 2026-06-10):
  KIN/PE   — discipline "Physical Education" → bucket: adapted→PEDS(+new disc) /
             athletics→ATHL / core→KINE (disc Kinesiology). Kinesiology singletons
             also carve out their adapted/athletics. Physics stays on PHYS.
  Theater  — discipline "Theater Arts" → "Drama/Theater Arts" (id unchanged);
             ``DRAM`` singletons re-prefix → THEA.
No merging at this layer (single-college rows; the worklist's job). Collision-aware:
a re-prefixed id that collides in the target stand-alone space re-sequences to the
next free ``<band><d><LL>`` slot.

Receipt: kb/convergence_singletons_out/<date>/alias_map.json.
"""
import json, re, sys, os
from collections import Counter
from datetime import datetime as _dt
from itertools import product

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
def kb(p): return os.path.join(SD, p)

PE_DISC, KIN_DISC = "Physical Education", "Kinesiology"
PEDS_DISC = "Physical Education Disabled Students"
THEA_ALT, THEA_CANON = "Theater Arts", "Drama/Theater Arts"

ADAPT = re.compile(r"adapt|disab|special needs|\bDSPS\b|special olymp", re.I)
ATHL_RE = re.compile(r"intercollegiate|off.?season|in.?season|\bvarsity\b", re.I)
def pe_bucket(title):
    t = title or ""
    if ADAPT.search(t):   return "PEDS"
    if ATHL_RE.search(t): return "ATHL"
    return "KINE"

def band_of(rec):
    return 9 if str(rec.get("credit_status", "")).lower().startswith("noncredit") else 1

SA_RE = re.compile(r"^(\S+) M(\d)(\w{3})$")   # SUBJ M<band><d><LL> (3 tail chars)

sgdoc = json.load(open(kb("coci_minted_singletons.json")))
S = sgdoc["courses"]

# target-space occupancy: subj -> band -> set(tail3)  (seeded with EVERY current id
# so re-keys can't collide with rows that aren't moving)
occ = {}
for sid in S:
    m = SA_RE.match(sid)
    if m:
        occ.setdefault(m.group(1), {}).setdefault(int(m.group(2)), set()).add(m.group(3))

_LL = ["%d%s%s" % (d, a, b) for d, a, b in product(range(10),
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")]
def take(subj, band, want_tail):
    """Keep the row's own tail when free in the target space; else next free slot."""
    used = occ.setdefault(subj, {}).setdefault(band, set())
    tail = want_tail if want_tail not in used else next(t for t in _LL if t not in used)
    used.add(tail)
    return f"{subj} M{band}{tail}"

alias, disc_flip, plan = {}, {}, Counter()
for sid, v in S.items():
    d, s4 = v.get("discipline"), v.get("subject_4letter")
    m = SA_RE.match(sid)
    tail = m.group(3) if m else None
    if d == PE_DISC:
        dest = pe_bucket(v.get("common_title"))
        if tail is None:  # off-scheme id: discipline-flip only
            disc_flip[sid] = PEDS_DISC if dest == "PEDS" else KIN_DISC
            plan[f"PE→{dest} (disc only, off-scheme)"] += 1
            continue
        occ[s4][int(m.group(2))].discard(tail)         # vacate the old slot
        alias[sid] = take(dest, band_of(v), tail)
        disc_flip[alias[sid]] = PEDS_DISC if dest == "PEDS" else KIN_DISC
        plan[f"PE→{dest}"] += 1
    elif d == KIN_DISC and s4 == "KINE":
        dest = pe_bucket(v.get("common_title"))
        if dest != "KINE" and tail:
            occ[s4][int(m.group(2))].discard(tail)
            alias[sid] = take(dest, band_of(v), tail)
            disc_flip[alias[sid]] = PEDS_DISC if dest == "PEDS" else KIN_DISC
            plan[f"KINE→{dest}"] += 1
    elif d == THEA_ALT:
        disc_flip[alias.get(sid, sid)] = THEA_CANON
        plan["TheaterArts→Drama/Theater (disc flip)"] += 1
    elif d == THEA_CANON and s4 == "DRAM":
        if tail:
            occ[s4][int(m.group(2))].discard(tail)
            alias[sid] = take("THEA", band_of(v), tail)
            plan["DRAM→THEA"] += 1

# ripple
adoc = json.load(open(kb("coci_articulations.json")))
AA = adoc["articulations"]
art_hits = sum(1 for a in AA if a.get("course_id") in alias)
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
cur_hits = sum(1 for k in CU if k in alias) + sum(
    1 for e in CU.values() if isinstance(e, dict) and (e.get("merge_into") in alias or
    any(x in alias for x in (e.get("merge_members") or []))))

print(f"Singleton convergence extension — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
for k in sorted(plan): print(f"   {plan[k]:5}  {k}")
print(f"  ids re-keyed: {len(alias)}   discipline flips: {len(disc_flip)}")
print(f"  ripple — articulations: {art_hits}/{len(AA)}   curation refs: {cur_hits}")

outdir = kb(os.path.join("convergence_singletons_out", _dt.now().strftime("%Y-%m-%d")))
os.makedirs(outdir, exist_ok=True)
json.dump({"generated_at": _dt.now().isoformat(), "alias_map": alias,
           "plan": dict(plan)}, open(os.path.join(outdir, "alias_map.json"), "w"),
          ensure_ascii=False, indent=1)
print(f"  receipt → {os.path.relpath(os.path.join(outdir, 'alias_map.json'), SD)}")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Re-run with --apply after review.")
    sys.exit(0)

print("\n--apply: mutating KB …")
newS = {}
for sid, v in S.items():
    new = alias.get(sid, sid)
    if new != sid:
        v["course_id"] = new
        v["subject_4letter"] = new.split()[0]
    if new in disc_flip or sid in disc_flip:
        v["discipline"] = disc_flip.get(new, disc_flip.get(sid))
    newS[new] = v
sgdoc["courses"] = newS; sgdoc["count"] = len(newS)

n_art = 0
for a in AA:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]; n_art += 1
n_cur = 0
for k in [k for k in CU if k in alias]:
    CU[alias[k]] = CU.pop(k); n_cur += 1
for e in CU.values():
    if isinstance(e, dict):
        if e.get("merge_into") in alias:
            e["merge_into"] = alias[e["merge_into"]]; n_cur += 1
        if isinstance(e.get("merge_members"), list):
            e["merge_members"] = [alias.get(x, x) for x in e["merge_members"]]

gates = {
    "G1 no PE / Theater-Arts discipline remains": not any(
        v.get("discipline") in (PE_DISC, THEA_ALT) for v in newS.values()),
    "G2 PHYS singletons are Physics-family only": all(
        v.get("discipline") not in (PE_DISC,) for v in newS.values()
        if v.get("subject_4letter") == "PHYS"),
    "G3 no DRAM subject_4letter remains": not any(
        v.get("subject_4letter") == "DRAM" for v in newS.values()),
    "G4 id count preserved (no merge at this layer)": len(newS) == len(S),
    "G5 key == course_id everywhere": all(k == v.get("course_id") for k, v in newS.items()),
}
print("  V-gates:")
for g, ok in gates.items(): print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")

def _w(path, obj): json.dump(obj, open(kb(path), "w"), ensure_ascii=False, indent=2)
_w("coci_minted_singletons.json", sgdoc)
_w("coci_articulations.json", adoc)
_w("coci_curation.json", cdoc)
print(f"  ✓ APPLIED. articulations re-pointed: {n_art}, curation refs: {n_cur}")
print("  next: re-seed CSR, re-run the auditor, commit.")
