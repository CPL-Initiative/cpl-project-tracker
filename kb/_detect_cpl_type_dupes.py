#!/usr/bin/env python3
"""READ-ONLY detector for the CPL-type-duplicate / "10-Key" credential class — the
same underlying exhibit entered under ≥2 near-identical unified_titles (the
classifier split it, often by CPL type or `&`-vs-`and` punctuation). The CER keys
on unified_title, so such pairs show as two rows until merged.

Surfaces candidate (loser → winner) pairs for CURATOR REVIEW. Does NOT modify
anything. Confirmed pairs go into kb/credential_merges.json (loser/winner/
reviewed_by/reviewed_at/reason), applied by kb/_merge_credentials.py --apply.

Two signals:
  A — NORMALIZED-TITLE COLLISION (high precision): distinct unified_titles that
      collapse to the same string under (&→and, lowercase, punctuation→space).
      e.g. "AP Chinese Language & Culture" vs "…and Culture". Almost always a true
      dupe; the detector prints a ready-to-paste credential_merges.json snippet.
  B — SAME-EXHIBIT-DIFFERENT-TITLE (review carefully): two unified_titles whose
      articulations share the SAME course_id + SAME local course (the 10-Key
      signature). Higher-judgment — a course can legitimately articulate to two
      genuinely different credentials — so these are listed for manual review only.
      Pairs that share ONLY an elective-bucket course (a generic dumping-ground
      like COMM M1038 — two different exams both giving generic elective credit)
      are suppressed as noise, mirroring the R1 suppression in the CER producer.

Run from repo root: python3 kb/_detect_cpl_type_dupes.py
"""
import json, os, re, collections, datetime

HERE = os.path.dirname(os.path.abspath(__file__))

def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)

ut = load("unified_titles.json")            # raw_title -> {unified_title, ...}
cred = load("credentials.json")             # unified_title -> [records]
art = load("coci_articulations.json")["articulations"]

raws_by_ut = collections.Counter()
for _raw, ent in ut.items():
    u = ent.get("unified_title")
    if u:
        raws_by_ut[u] += 1
arts_by_ut = collections.defaultdict(list)
for a in art:
    u = a.get("unified_title")
    if u:
        arts_by_ut[u].append(a)
all_uts = set(raws_by_ut) | set(cred) | set(arts_by_ut)

def norm(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower().replace("&", "and")).strip()

def winner_of(titles):
    # Winner = the DOMINANT record (fewest articulations to re-point, the one with
    # real data survives): most articulations, then most raws; "&"→"and" cleanliness
    # is only a tie-breaker; then longer (more spelled-out), then alpha (determinism).
    def key(t):
        return (-len(arts_by_ut.get(t, [])), -raws_by_ut.get(t, 0), "&" in t, -len(t), t)
    return sorted(set(titles), key=key)[0]

def ev(t):
    return f"{raws_by_ut.get(t,0)} raw · {len(arts_by_ut.get(t,[]))} artic"

# ── Signal A: normalized-title collisions ──
groups = collections.defaultdict(set)
for u in all_uts:
    groups[norm(u)].add(u)
collisions = {k: v for k, v in groups.items() if len(v) >= 2}

print("=" * 78)
print(f"SIGNAL A — normalized-title collisions (the &/and class): {len(collisions)} group(s)")
print("=" * 78)
snippets = []
for k in sorted(collisions):
    titles = collisions[k]
    win = winner_of(titles)
    losers = sorted(t for t in titles if t != win)
    print(f"\n  winner: {win!r}  ({ev(win)})")
    for lo in losers:
        print(f"  loser : {lo!r}  ({ev(lo)})")
        snippets.append({
            "loser": lo, "winner": win,
            "reviewed_by": "map@rccd.edu",
            "reviewed_at": datetime.date.today().isoformat(),
            "reason": f"Normalized-title duplicate (differ only by punctuation/&-vs-and): "
                      f"{lo!r} == {win!r}. Same credential; CER keys on unified_title.",
        })

if snippets:
    print("\n" + "-" * 78)
    print("READY-TO-PASTE credential_merges.json entries for the Signal-A pairs")
    print("(review, then add the confirmed ones to kb/credential_merges.json):")
    print("-" * 78)
    print(json.dumps(snippets, indent=2, ensure_ascii=False))

# ── Signal B: same course_id + same local course, different unified_title ──
# Raw Signal B is noisy: genuinely-DISTINCT credentials routinely share a course
# (NCCER Welding L2/L3/L4, Firefighter 1/1A, FAA Airframe vs Powerplant). Gate to
# high precision: (1) full-title token Jaccard ≥ 0.5, AND (2) a LEVEL-SAFE guard —
# drop pairs whose token symmetric-difference is ALL level/number tokens (1, 1A,
# 232, level, part, II, basic…), since those are course-LEVEL distinctions, not
# dupes. What survives = "same credential under two phrasings" (e.g. FAA Airframe
# Mechanic Certification vs FAA Mechanic Certificate — Airframe Rating).
_LEVELWORDS = {"level", "part", "basic", "advanced", "i", "ii", "iii", "iv", "v",
               "vi", "vii", "viii", "a", "b", "c", "d"}
def _is_level_tok(t):
    return bool(re.fullmatch(r"[0-9]+[a-z]?", t)) or t in _LEVELWORDS
def _toks(t):
    return set(norm(t).split())
def _dupe_like(x, y):
    tx, ty = _toks(x), _toks(y)
    if not tx or not ty:
        return False
    jac = len(tx & ty) / len(tx | ty)
    if jac < 0.5:
        return False
    diff = tx ^ ty
    if diff and all(_is_level_tok(t) for t in diff):
        return False   # differ only by level/number → a level distinction, not a dupe
    return True

# (3) ELECTIVE-BUCKET gate — a single local course used as a generic elective
# dumping-ground: its credit recs are ~entirely "elective" AND it spans many
# unrelated credentials from ≤3 colleges (e.g. Clovis's COMM M1038 → 60+
# credentials, 100% "Elective Course Credits"). Two genuinely-DIFFERENT exams
# both articulating to one such bucket are NOT the same exhibit, so a pair that
# shares ONLY elective-bucket courses is noise. Mirrors the R1 suppression in
# excel_to_dashboard.py:export_credential_reference() (same ≥0.8 / ≥5 / ≤3 rule).
_eb_recs = collections.defaultdict(list)
for _a in art:
    if _a.get("course_id"):
        _eb_recs[_a["course_id"]].append(_a)
elective_bucket_ids = set()
for _cid, _recs in _eb_recs.items():
    _creds = {x.get("unified_title") for x in _recs}
    _elec = sum(1 for x in _recs if any("elective" in str(v).lower()
                for v in (x.get("credit_recommendations") or [])))
    _cols = {c for x in _recs for c in (x.get("earned_by_colleges") or [])}
    if _recs and _elec / len(_recs) >= 0.8 and len(_creds) >= 5 and len(_cols) <= 3:
        elective_bucket_ids.add(_cid)

key_to_uts = collections.defaultdict(set)
for a in art:
    cid, u = a.get("course_id"), a.get("unified_title")
    if not cid or not u:
        continue
    for lc in (a.get("local_courses") or []):
        key_to_uts[(cid, lc.get("subject"), lc.get("number"))].add(u)
sigB = collections.Counter()
pair_ev = {}
_pair_seen = set()          # pairs passing sim+level via ANY shared course (real or bucket)
for (cid, sub, num), uts in key_to_uts.items():
    if len(uts) < 2:
        continue
    uts = sorted(uts)
    for i in range(len(uts)):
        for j in range(i + 1, len(uts)):
            pair = (uts[i], uts[j])
            if norm(pair[0]) == norm(pair[1]):
                continue  # already a Signal-A collision
            if not _dupe_like(pair[0], pair[1]):
                continue  # noise gate (level/distinct credentials sharing a course)
            _pair_seen.add(pair)
            if cid in elective_bucket_ids:
                continue  # bucket share alone isn't evidence — needs a REAL shared course
            sigB[pair] += 1
            pair_ev.setdefault(pair, (cid, f"{sub} {num}"))
_bucket_only = len(_pair_seen) - len(sigB)   # passed gates but every shared course was a bucket

print("\n" + "=" * 78)
print(f"SIGNAL B — same exhibit, different phrasing ({len(sigB)} pair[s] after the "
      f"similarity + level-safe + elective-bucket gate)")
print(f"  ({_bucket_only} pair[s] suppressed: shared ONLY an elective-bucket course; "
      f"{len(elective_bucket_ids)} bucket id(s) detected)")
print("  (review CAREFULLY — confirm it's one credential, not two related ones)")
print("=" * 78)
for pair, n in sigB.most_common():
    cid, lc = pair_ev[pair]
    print(f"\n  {pair[0]!r}  ({ev(pair[0])})")
    print(f"  {pair[1]!r}  ({ev(pair[1])})")
    print(f"    shared via {n} (course_id, local course), e.g. {cid} · {lc}")

print(f"\nSummary: Signal A {len(collisions)} group(s) / {len(snippets)} pair(s) "
      f"[high-confidence]; Signal B {len(sigB)} pair(s) [review] "
      f"(+{_bucket_only} elective-bucket-only suppressed). Read-only.")
