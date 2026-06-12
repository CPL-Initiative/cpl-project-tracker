#!/usr/bin/env python3
"""KIN/PE convergence — PASS 2 (Session 51, 2026-06-12). Rule-7 re-key.

DRY-RUN by default (read-only, prints the plan + writes a review manifest);
``--apply`` mutates the KB.

Two jobs, one alias map:

1. ALIAS-CONTAMINATION REPAIR. The 2026-06-10 convergence folded discipline
   "Physical Education" -> Kinesiology (and "Theater Arts" -> Drama/Theater
   Arts) but left the inference lexicons pointing at the ALTERNATE names, so
   the Session-45 re-derivation resurrected "Physical Education" on 605 rows
   (83 minted + 422 singletons) and "Theater Arts" on 147 (24 + 123). Sam
   parked the PE rows on a curator-override canonical ``PEDU`` to unblock the
   Session-50 fold; this pass dissolves that parking lot: every
   PE-discipline row re-routes through the REFINED carve-out rules below and
   every Theater-Arts row flips to "Drama/Theater Arts" (already on THEA — no
   re-key). The lexicons were re-pointed in the same commit and all four
   inference passes now resolve targets through kb/_alias_canon.py, so the
   contamination cannot recur.

2. TOP-AWARE ATHLETICS SECOND PASS. The original carve-out detected
   athletics by title keywords only (intercollegiate|off-season|in-season|
   varsity), which missed roster courses titled like "Basketball, Men",
   "Competitive Soccer", "Baseball Team Activity" (Sam's screenshots,
   2026-06-12). Refined rule adds the colleges' own TOP assignment:

     athletics  := modal top_code == 0835.50 (Intercollegiate Athletics)
                     AND NOT an instruction-activity title (yoga/pilates/
                     aerobics/kickboxing/karate/martial-arts/tai-chi/zumba/
                     dance — colleges occasionally park activity ladders on
                     0835.50; "Yoga - Intermediate" mem=28 is the canonical
                     counterexample)
                   OR title keyword (the original ATHL_RE)
     adapted    := title ADAPT keyword OR top_code == 0835.80 (Adapted PE)
     core       := everything else -> KINE

   Per-id OVERRIDES route the two non-athletics "intercollegiate" rows the
   dropped lexicon keyword had mis-filed: Intercollegiate Forensics (speech &
   debate, TOP 1506.00) -> Communication Studies; Intercollegiate Logging
   Sports (TOP 0114.00 Forestry) -> Forestry/Natural Resources.

Discipline flips set the value and DROP discipline_source/confidence/
inferred_at: a value with no source is the inference passes' "manual" state,
which no re-derivation touches — the durable fix the original convergence
lacked. Rows whose discipline VALUE doesn't change (the KINE->ATHL movers,
already Kinesiology) keep their machine stamps.

Parents merge into an exact same-level twin when one exists in the target
space (the canonical level-safe fam key + same band — the §5.5 convergence
contract); singletons never merge at this layer (the worklist's job).
Allocation appends into free sequence slots (CCN/C-ID reservations honored
via kb/_subj4_dryrun.load_id_reservations); no global re-sequencing.

Receipt (rollback inverse): kb/kin_pe_pass2_out/<date>/alias_map.json.
Register it in kb/_rekey_promotions.py ALIAS_MAPS, then run
kb/_post_apply_chain.py. Scope doc: docs/kin_pe_convergence_scope.md §10
(this pass); the rules here are FROZEN — a future refinement is pass 3.
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime as _dt
from itertools import product

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SD)
from _subj4_dryrun import load_id_reservations  # CCN/C-ID seq reservations


def kb(p):
    return os.path.join(SD, p)


# ── frozen classification rules ──────────────────────────────────────────────
ADAPT = re.compile(r"adapt|disab|special needs|\bDSPS\b|special olymp", re.I)
ATHL_KW = re.compile(r"intercollegiate|off.?season|in.?season|\bvarsity\b", re.I)
INSTR_EXC = re.compile(r"yoga|pilates|aerobic|kickbox|karate|martial|tai.?chi|zumba|danc", re.I)
ATHL_TOP, ADAPT_TOP = "0835.50", "0835.80"
PE_DISC, KIN_DISC = "Physical Education", "Kinesiology"
PEDS_DISC = "Physical Education Disabled Students"
THEA_ALT, THEA_CANON = "Theater Arts", "Drama/Theater Arts"
# Non-athletics rows the dropped 'intercollegiate' lexicon keyword had
# mis-disciplined — explicit, auditable routing (id -> true discipline).
OVERRIDES = {
    "PEDU M1050": "Communication Studies",        # Intercollegiate Forensics, TOP 1506.00
    "PEDU M10NS": "Forestry/Natural Resources",   # Intercollegiate Logging Sports, TOP 0114.00
}


def is_athletics(title, top):
    t = title or ""
    if top == ATHL_TOP and not INSTR_EXC.search(t):
        return True
    return bool(ATHL_KW.search(t))


def pe_route(cid, rec):
    """PE-discipline row -> (dest_subj4, dest_discipline). dest_subj4 None
    means 'the canonical of dest_discipline' (override rows)."""
    if cid in OVERRIDES:
        return None, OVERRIDES[cid]
    t, top = rec.get("common_title") or "", rec.get("top_code") or ""
    if ADAPT.search(t) or top == ADAPT_TOP:
        return "PEDS", PEDS_DISC
    if is_athletics(t, top):
        return "ATHL", KIN_DISC
    return "KINE", KIN_DISC


# The canonical level-safe family key — copied VERBATIM from
# kb/_apply_kin_pe_convergence.py (incl. its stricter single-letter-roman fix)
# so this pass's twin merges agree with the original apply + the worklist.
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


CORR_RE = re.compile(r"^(\S+) M(\d)(\d{3})$")       # corroborated parent id
SA_RE = re.compile(r"^(\S+) M(\d)(\d[A-Z]{2})$")    # stand-alone singleton id

# ── load ─────────────────────────────────────────────────────────────────────
cat = json.load(open(kb("coci_minted_courses.json")))
C = cat["courses"]
sgdoc = json.load(open(kb("coci_minted_singletons.json")))
S = sgdoc["courses"]
cdoc = json.load(open(kb("coci_curation.json")))
CU = cdoc.get("curations", {})
canon = json.load(open(kb("discipline_canonical_subj4.json")))["disciplines"]


def canon_subj4(disc):
    e = canon.get(disc) or {}
    s4 = e.get("canonical_subj4")
    if not s4 or not re.match(r"^[A-Z]{4}$", s4):
        raise SystemExit(f"ABORT: no 4-letter canonical for {disc!r} in discipline_canonical_subj4.json")
    return s4


def eff_disc(cid, rec):
    """Curated discipline wins over the baseline (mirrors compute_plan)."""
    cur = CU.get(cid)
    if isinstance(cur, dict) and cur.get("discipline"):
        return cur["discipline"]
    return rec.get("discipline")


# ── allocators ───────────────────────────────────────────────────────────────
class Alloc:
    """Free corroborated <band><seq:03d> slots for one SUBJ4 — seeded with
    EVERY existing parent id in that SUBJ4 (any discipline; movers-out stay
    reserved, never reused) + the CCN/C-ID sequence reservations."""

    def __init__(self, subj, reservations):
        self.subj = subj
        self.used = {1: set(), 9: set()}
        for b in (1, 9):
            self.used[b] |= reservations.get((subj, str(b)), set())
        for cid in C:
            m = CORR_RE.match(cid)
            if m and m.group(1) == subj:
                self.used[int(m.group(2))].add(int(m.group(3)))
        self.cur = {1: 0, 9: 0}

    def take(self, band):
        s = self.cur[band] + 1
        while s in self.used[band]:
            s += 1
        if s > 999:
            raise RuntimeError(f"{self.subj} band {band} corroborated overflow (>999)")
        self.used[band].add(s)
        self.cur[band] = s
        return f"{self.subj} M{band}{s:03d}"


_LL = ["%d%s%s" % (d, a, b) for d, a, b in product(range(10),
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")]
occ = {}
for sid in S:
    m = SA_RE.match(sid)
    if m:
        occ.setdefault(m.group(1), {}).setdefault(int(m.group(2)), set()).add(m.group(3))


def take_sa(subj, band, want_tail):
    used = occ.setdefault(subj, {}).setdefault(band, set())
    tail = want_tail if want_tail not in used else next(t for t in _LL if t not in used)
    used.add(tail)
    return f"{subj} M{band}{tail}"


_reservations = load_id_reservations()
_allocs = {}


def alloc(subj):
    if subj not in _allocs:
        _allocs[subj] = Alloc(subj, _reservations)
    return _allocs[subj]


# ── plan: classify every row ─────────────────────────────────────────────────
alias = {}            # old_id -> new_id (includes merge losers -> twin)
merges = []           # (old_id, twin_id, title) — parents only
disc_set = {}         # FINAL id -> discipline to set (value-changing flips only)
plan = Counter()
skips = []            # (id, reason)
parent_moves = []     # (old_id, dest_subj4, dest_disc, band, fam_key, rec)
single_moves = []     # (old_id, dest_subj4, dest_disc, band, tail, rec)

# Scope A+C over parents.
for cid, rec in C.items():
    if rec.get("id_system") and rec["id_system"] != "M-ID":
        continue
    d = eff_disc(cid, rec)
    m = CORR_RE.match(cid)
    if d == PE_DISC:
        dest_s4, dest_d = pe_route(cid, rec)
        if dest_s4 is None:
            dest_s4 = canon_subj4(dest_d)
        if not m:
            skips.append((cid, "PE parent with off-scheme id"))
            continue
        parent_moves.append((cid, dest_s4, dest_d, int(m.group(2)), fam(rec.get("common_title")), rec))
        plan[f"PE->{dest_s4}"] += 1
    elif d == THEA_ALT:
        if rec.get("subject_4letter") != "THEA":
            skips.append((cid, "Theater-Arts parent off THEA — needs manual routing"))
            continue
        disc_set[cid] = THEA_CANON
        plan["TheaterArts->Drama/Theater (disc flip)"] += 1
    elif d == KIN_DISC and rec.get("subject_4letter") == "KINE":
        if is_athletics(rec.get("common_title"), rec.get("top_code") or ""):
            if not m:
                skips.append((cid, "KINE athletics parent with off-scheme id"))
                continue
            parent_moves.append((cid, "ATHL", KIN_DISC, int(m.group(2)), fam(rec.get("common_title")), rec))
            plan["KINE->ATHL"] += 1

# Guard: PE rows routed to ATHL purely on a keyword but with a non-PE TOP are
# the override class — any not in OVERRIDES is a finding for the operator.
for cid, dest_s4, dest_d, band, fk, rec in parent_moves:
    top = rec.get("top_code") or ""
    if dest_s4 == "ATHL" and top and not top.startswith("0835") and cid not in OVERRIDES:
        skips.append((cid, f"ATHL-bucket with non-PE TOP {top} — review (override candidate)"))
parent_moves = [t for t in parent_moves if t[0] not in {s[0] for s in skips}]

# Twin index per destination: (dest_subj4, band, fam) -> standing parent id.
moving_out = {t[0] for t in parent_moves}
twin_idx = {}
for cid, rec in C.items():
    if cid in moving_out:
        continue
    m = CORR_RE.match(cid)
    if not m:
        continue
    fk = fam(rec.get("common_title"))
    if fk:
        twin_idx.setdefault((m.group(1), int(m.group(2)), fk), cid)

# Deterministic order (title, id) inside each destination bucket.
parent_moves.sort(key=lambda t: (t[1], t[3], t[4], t[0]))
for old, dest_s4, dest_d, band, fk, rec in parent_moves:
    twin = twin_idx.get((dest_s4, band, fk)) if fk else None
    if twin:
        alias[old] = twin
        merges.append((old, twin, rec.get("common_title")))
        plan["merged into same-level twin"] += 1
        continue
    new = alloc(dest_s4).take(band)
    alias[old] = new
    if dest_d != rec.get("discipline"):
        disc_set[new] = dest_d
    if fk:
        # Later movers with the same fam land on this mover's NEW id.
        twin_idx[(dest_s4, band, fk)] = new

# Scope A+C over singletons.
for sid, rec in S.items():
    d = eff_disc(sid, rec)
    m = SA_RE.match(sid)
    if d == PE_DISC:
        dest_s4, dest_d = pe_route(sid, rec)
        if dest_s4 is None:
            dest_s4 = canon_subj4(dest_d)
        if not m:
            disc_set[sid] = dest_d
            plan[f"PE->{dest_s4} (disc only, off-scheme id)"] += 1
            continue
        single_moves.append((sid, dest_s4, dest_d, band_of(rec), m.group(3), rec))
        plan[f"PE singles->{dest_s4}"] += 1
    elif d == THEA_ALT:
        disc_set[sid] = THEA_CANON
        plan["TheaterArts singles (disc flip)"] += 1
    elif d == KIN_DISC and rec.get("subject_4letter") == "KINE" and m:
        if is_athletics(rec.get("common_title"), rec.get("top_code") or ""):
            single_moves.append((sid, "ATHL", KIN_DISC, band_of(rec), m.group(3), rec))
            plan["KINE singles->ATHL"] += 1

single_moves.sort(key=lambda t: (t[1], t[3], t[0]))
for old, dest_s4, dest_d, band, tail, rec in single_moves:
    m = SA_RE.match(old)
    occ[m.group(1)][int(m.group(2))].discard(m.group(3))   # vacate old slot
    new = take_sa(dest_s4, band, tail)
    alias[old] = new
    if dest_d != rec.get("discipline"):
        disc_set[new] = dest_d

# ── ripple (counts in dry-run; rewritten on --apply) ─────────────────────────
adoc = json.load(open(kb("coci_articulations.json")))
AA = adoc["articulations"]
art_hits = sum(1 for a in AA if a.get("course_id") in alias)
mdoc = json.load(open(kb("coci_minted_memberships.json")))
MM = mdoc["memberships"]
mem_hits = sum(1 for k in MM if k in alias)
cur_key_hits = [k for k in CU if k in alias]
cur_val_hits = [(k, e.get("merge_into")) for k, e in CU.items()
                if isinstance(e, dict) and e.get("merge_into") in alias]

# ── report ───────────────────────────────────────────────────────────────────
merge_losers = {a for a, _, _ in merges}
print(f"KIN/PE pass 2 — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
for k in sorted(plan):
    print(f"   {plan[k]:5}  {k}")
print(f"  ids re-keyed: {len(alias)}  (parents {len(parent_moves)}, singles {len(single_moves)}; "
      f"twin merges {len(merges)})")
print(f"  discipline flips (value change, stamped manual): {len(disc_set)}")
print(f"  ripple — articulations {art_hits}/{len(AA)} · memberships {mem_hits} · "
      f"curation keys {len(cur_key_hits)} {cur_key_hits} · curation merge_into {len(cur_val_hits)} {cur_val_hits}")
if skips:
    print("  SKIPS / findings:")
    for cid, why in skips:
        print(f"     {cid}: {why}")

outdir = kb(os.path.join("kin_pe_pass2_out", _dt.now().strftime("%Y-%m-%d")))
os.makedirs(outdir, exist_ok=True)
json.dump({
    "generated_at": _dt.now().isoformat(),
    "status": "APPLY" if APPLY else "DRY-RUN",
    "direction": "old -> new (rollback = invert); a simultaneous permutation — apply ONCE, never iterate",
    "rules": {"athletics": "modal TOP 0835.50 AND NOT instruction-activity title, OR title kw "
                           "(intercollegiate|off/in-season|varsity)",
              "adapted": "title kw (adapt|disab|special needs|DSPS|special olymp) OR TOP 0835.80",
              "instruction_exceptions": INSTR_EXC.pattern,
              "overrides": OVERRIDES},
    "plan": dict(plan),
    "alias_map": dict(sorted(alias.items())),
    "merges": [{"from": a, "into": b, "title": t} for a, b, t in merges],
    "disc_flips": {k: v for k, v in sorted(disc_set.items())},
    "skips": skips,
}, open(os.path.join(outdir, "alias_map.json"), "w"), ensure_ascii=False, indent=1)
print(f"  manifest -> {os.path.relpath(os.path.join(outdir, 'alias_map.json'), SD)}")

print("\n  twin merges (review: same course, same level?):")
_new_to_old = {n: o for o, n in alias.items() if o not in merge_losers}
for a, b, t in merges:
    tw = C.get(b) or C.get(_new_to_old.get(b, ""))   # twin may be a mover's NEW id
    print(f"     {a:13} -> {b:13}  {t}  (twin title: {(tw or {}).get('common_title')!r})")

if not APPLY:
    print("\nDRY-RUN only — no KB mutated. Review the manifest, then re-run with --apply.")
    sys.exit(0)

# ── apply ────────────────────────────────────────────────────────────────────
print("\n--apply: mutating KB …")
STAMP = "_kin_pe_pass2_from"


def flip_disc(rec, new_disc):
    """Value-changing flip -> the passes' 'manual' state (value, no source):
    no re-derivation will ever touch it again (the durable fix)."""
    rec["discipline"] = new_disc
    for k in ("discipline_source", "discipline_confidence", "discipline_inferred_at"):
        rec.pop(k, None)


# 1) parents — rebuild in original key order; merges bump the twin first.
for old, twin, _t in merges:
    tw = C.get(twin)
    if tw is not None and old in C:
        tw["corroboration_members"] = (tw.get("corroboration_members") or 0) + \
                                      (C[old].get("corroboration_members") or 0)
newC = {}
for old, rec in C.items():
    if old in merge_losers:
        continue
    new = alias.get(old, old)
    if new != old:
        rec["course_id"] = new
        rec["subject_4letter"] = new.split()[0]
        rec[STAMP] = old
    if new in disc_set:
        flip_disc(rec, disc_set[new])
    elif old in disc_set:                      # disc-flip-only rows (THEA parents)
        flip_disc(rec, disc_set[old])
    newC[new] = rec
cat["courses"] = newC
cat["count"] = len(newC)

# 2) singletons — same in-place rebuild (no merges at this layer).
newS = {}
for old, rec in S.items():
    new = alias.get(old, old)
    if new != old:
        rec["course_id"] = new
        rec["subject_4letter"] = new.split()[0]
        rec[STAMP] = old
    if new in disc_set:
        flip_disc(rec, disc_set[new])
    elif old in disc_set:
        flip_disc(rec, disc_set[old])
    newS[new] = rec
sgdoc["courses"] = newS
sgdoc["count"] = len(newS)

# 3) memberships — absorb merge losers into the twin, then re-key in order.
for old, twin, _t in merges:
    if old in MM:
        MM.setdefault(twin, []).extend(MM[old])
newMM = {}
for old, lst in MM.items():
    if old in merge_losers:
        continue
    newMM[alias.get(old, old)] = lst
mdoc["memberships"] = newMM
mdoc["count"] = len(newMM)

# 4) articulations
n_art = 0
for a in AA:
    if a.get("course_id") in alias:
        a["course_id"] = alias[a["course_id"]]
        n_art += 1

# 5) curation — re-key entry KEYS + re-point merge_into / merge_members.
n_cur = 0
for k in [k for k in CU if k in alias]:
    CU[alias[k]] = CU.pop(k)
    n_cur += 1
for k, e in CU.items():
    if not isinstance(e, dict):
        continue
    if e.get("merge_into") in alias:
        e["merge_into"] = alias[e["merge_into"]]
        n_cur += 1
    if isinstance(e.get("merge_members"), list):
        e["merge_members"] = [alias.get(x, x) for x in e["merge_members"]]

# ── V-gates ──────────────────────────────────────────────────────────────────
all_rows = list(newC.values()) + list(newS.values())
nonmerge_new = [v for k, v in alias.items() if k not in merge_losers]
gates = {
    "G1 no PE / Theater-Arts discipline remains":
        not any(v.get("discipline") in (PE_DISC, THEA_ALT) for v in all_rows),
    "G2 no PEDU subject_4letter remains":
        not any(v.get("subject_4letter") == "PEDU" for v in all_rows),
    "G3 key == course_id everywhere":
        all(k == v.get("course_id") for k, v in newC.items())
        and all(k == v.get("course_id") for k, v in newS.items()),
    "G4 counts conserved (parents -merges; singles exact)":
        len(newC) == len(C) - len(merges) and len(newS) == len(S),
    "G5 non-merge new ids unique + didn't overwrite a standing row":
        len(nonmerge_new) == len(set(nonmerge_new))
        and not (set(nonmerge_new) & ((set(C) | set(S)) - set(alias))),
    "G6 band preserved on every re-key":
        all((re.search(r" M(\d)", o) or [None, None])[1] == (re.search(r" M(\d)", n) or [None, None])[1]
            for o, n in alias.items()),
    "G7 umbrella conformance (Kinesiology on KINE|ATHL only)":
        all(v.get("subject_4letter") in ("KINE", "ATHL")
            for v in all_rows if v.get("discipline") == KIN_DISC),
    "G8 PEDS-discipline rows on PEDS only":
        all(v.get("subject_4letter") == "PEDS"
            for v in all_rows if v.get("discipline") == PEDS_DISC),
}
print("  V-gates:")
for g, ok in gates.items():
    print(f"     {'PASS' if ok else 'FAIL'}  {g}")
if not all(gates.values()):
    sys.exit("  ✗ V-gate failure — NOT writing. `git checkout kb/` to be safe.")


def _w(path, obj):
    json.dump(obj, open(kb(path), "w"), ensure_ascii=False, indent=2)


_w("coci_minted_courses.json", cat)
_w("coci_minted_singletons.json", sgdoc)
_w("coci_minted_memberships.json", mdoc)
_w("coci_articulations.json", adoc)
_w("coci_curation.json", cdoc)

# Supabase mirror ops (executed via MCP in the same window; fresh-read first).
ops = []
for k in cur_key_hits:
    ops.append({"op": "rename_course_id", "old": k, "new": alias[k]})
for k, tgt in cur_val_hits:
    ops.append({"op": "repoint_merge_into", "course_id": alias.get(k, k), "new_value": alias[tgt]})
ops.append({"op": "delete_canon_pin", "course_id": "_CANON_SUBJ4::Physical Education",
            "why": "discipline folded to zero rows again; pin was the Session-50 parking lot"})
ops.append({"op": "delete_canon_pin", "course_id": "_CANON_SUBJ4::Theater Arts",
            "why": "discipline folded to zero rows again"})
json.dump({"generated_at": _dt.now().isoformat(), "ops": ops},
          open(os.path.join(outdir, "supabase_ops.json"), "w"), ensure_ascii=False, indent=1)

print(f"  ✓ APPLIED. articulations re-pointed: {n_art}, curation refs: {n_cur}")
print(f"  receipts -> {os.path.relpath(outdir, SD)}/(alias_map.json, supabase_ops.json)")
print("  next: register the alias map in kb/_rekey_promotions.py ALIAS_MAPS, run "
      "kb/_post_apply_chain.py, execute supabase_ops.json (fresh-read first), commit.")
