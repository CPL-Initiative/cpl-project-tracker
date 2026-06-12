"""
Title-similarity consolidation candidates for DARK identities — minted M-IDs
with no official evidence anywhere PLUS single-college Stand-Alone courses
(Session 46 dry-run; the AUTO/smog case study).

Why this lane exists (what the others cannot see):
  * The TITLE lane groups only EXACT level-safe signatures — "Smog Check
    Training Level 2" vs "Level 2 Smog Technician Training" never group
    (filler/synonym drift: training/course/class, check vs technician,
    agency decorations "BAR" / "Bureau of Automotive Repair (BAR)" /
    "California State").
  * The DESC lane (kb/_desc_consolidation_dryrun.py) covers minted M-IDs
    ONLY — Stand-Alone singletons are invisible to it (the smog corpus is
    42 singletons + 10 M-IDs), and its units ±0.5 gate blocks externally
    standardized curricula whose UNIT PACKAGING legitimately varies by
    college (BAR smog: the same state spec offered at 1.0–7.0 units).
  * The FAMILY lane requires co-articulation — dark courses have none.
  Net: one BAR-regulated statewide curriculum fragmented across 52
  identities, with 3 trivial pairs surfaced. This lane is the generalized
  fix, statewide, not a smog special-case.

Method (lightweight TF-IDF over TITLE tokens, no deps):
  * docs = every dark M-ID + every un-merged Stand-Alone; title normalized
    (parentheticals out, roman + CARDINAL WORD-NUMBERS -> digits, articles +
    filler {training, course, class, level} out — "level" carries no info
    beyond its digit, which the level guard owns).
  * log-IDF weighting, L2-normalized, cosine — so ultra-rare content tokens
    ("smog") dominate and agency/geo decorations ("bureau", "california")
    can't hide a match the way they break exact-signature equality.
  * candidate pairs share >= 1 of each other's top-3 IDF tokens (inverted
    index, df-capped) — no O(n^2).
  * HARD GATES per pair:
      - cosine >= 0.62
      - same credit_status (Credit / Noncredit / Noncredit Enhanced)
      - corroboration axis: same discipline OR same 2-digit TOP division
        (either axis agreeing admits; catches the mis-disciplined AUTB
        "SMOG CHECK II" via TOP 09 while still blocking cross-field
        generic-title merges)
      - NOT the same title signature (the title lane already owns those —
        signature here mirrors _sug_sig INCLUDING its word-number fold)
      - NOT already co-grouped in the desc lane's committed receipt
        (complementary queues, no double-review)
      - LEVEL SAFETY (the FLSP M1379 sin): digits, roman numerals, level
        words AND cardinal word-numbers ("Level Two") — titles carrying
        different marks never pair.
      - YEAR SAFETY: 4-digit years are edition marks ("2019 Smog Check
        Update" vs "2021 ..." are catalog editions — and "US History to
        1865" vs "... 1877 to Present" are different courses).
      - GENDER + SPORT SAFETY (inherited from the desc lane's first run).
  * NO units gate — deliberate (the BAR lesson). The TITLE lane itself has
    never gated units; unit spread is REPORTED on each group (units_spread)
    so the curator sees packaging variance instead of losing the match.
  * groups = connected components over passing pairs, but CLIQUE-CONSISTENT
    on the hard guards: two components unite only if EVERY cross-pair
    passes level/year/gender/sport/credit — an unmarked title ("Smog Check
    Inspection Procedures") cannot chain Level 1 and Level 2 into one blob.
    (The desc lane lacks this and relies on its size cap; noted in docs.)

NEVER auto-applies anything. Writes the receipt
kb/title_consolidation_out/candidates.json + a console report. Like the
desc receipt, it is committed + re-run manually (termly), so the daily cron
stays byte-stable.

Run from repo root:  python3 kb/_title_consolidation_dryrun.py
"""
import json
import math
import os
import re
from collections import Counter, defaultdict
from datetime import date

from _consolidation_guards import (ROMAN, WORDNUM, extract_marks,
                                   marks_conflict)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "title_consolidation_out")

COSINE_MIN = 0.62
PAIR_DF_CAP = 60       # tokens more common than this don't generate candidates
TOP_IDF_TOKENS = 3     # titles are short — index each doc's 3 rarest tokens
GROUP_CAP = 10         # smog families run 8-12; chained blobs still capped
MIN_CONTENT_TOKENS = 2  # one-token titles ("Smog") are too thin to pair on

DROP = {"the", "of", "to", "and", "for", "with", "in", "a", "an", "on", "at",
        "as", "or"}
# Closed, deliberately tiny filler vocabulary — format words that carry no
# course identity. NOT included on purpose: lab/lecture (different courses),
# workshop/seminar (format-bearing), introduction/advanced (LEVEL words —
# the guard owns them), program (degree-bearing: "RN Program").
FILLER = {"training", "course", "class", "level"}

def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def words(title):
    t = re.sub(r"\([^)]*\)", " ", str(title or "").lower())
    return [w for w in re.split(r"[^a-z0-9]+", t) if w]


def content_tokens(title):
    """Normalized comparison tokens: roman + word-numbers folded to digits,
    articles + filler out. Digits are KEPT (harmless under the level guard)."""
    out = []
    for w in words(title):
        if w in ROMAN:
            w = str(ROMAN[w])
        elif w in WORDNUM:
            w = str(WORDNUM[w])
        if w in DROP or w in FILLER:
            continue
        out.append(w)
    return out


def sig(title):
    """The title lane's level-safe signature (kept in lockstep with the
    generator's _sug_sig INCLUDING the Session-46 word-number fold). Pairs
    sharing it are already suggested there — this lane must skip them."""
    ws = []
    for w in words(title):
        if w in DROP:
            continue
        if w in ROMAN:
            w = str(ROMAN[w])
        elif w in WORDNUM:
            w = str(WORDNUM[w])
        ws.append(w)
    return " ".join(sorted(ws))


def top2(top_code):
    m = re.match(r"\s*(\d{2})", str(top_code or ""))
    return m.group(1) if m else None


def pair_guard(ma, mb):
    """Hard guards shared by pair admission AND component clique-validation.
    Returns a rejection label or None. Title-safety marks (two-axis levels,
    years, variant-type, gender, sport) live in _consolidation_guards."""
    if ma["credit"] != mb["credit"]:
        return "credit_mismatch"
    why = marks_conflict(ma["marks"], mb["marks"])
    if why:
        return why
    # corroboration axis: discipline OR broad TOP division must agree
    # (one axis agreeing is enough — the AUTB mis-discipline lesson; a pair
    # with NEITHER axis resolvable on both sides has no corroboration).
    disc_ok = ma["disc"] and mb["disc"] and ma["disc"] == mb["disc"]
    top_ok = ma["top2"] and mb["top2"] and ma["top2"] == mb["top2"]
    if not (disc_ok or top_ok):
        return "no_corroboration"
    return None


def main():
    minted = load("coci_minted_courses.json")["courses"]
    singles = load("coci_minted_singletons.json")["courses"]
    proms = load("promotions.json").get("promotions", {})
    joins = load("cid_articulation_joins.json")["joins"]
    mem = load("coci_minted_memberships.json")["memberships"]
    cur = (load("coci_curation.json") or {}).get("curations", {})
    desc_doc = None
    try:
        desc_doc = load(os.path.join("desc_consolidation_out", "candidates.json"))
    except OSError:
        pass

    cn_cid = {str(j.get("control_number")).strip().upper() for j in joins}

    # pairs already co-grouped by the desc lane — skip (no double-queue)
    desc_grouped = set()
    for g in (desc_doc or {}).get("groups", []):
        ids = sorted(m["id"] for m in g.get("members", []))
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                desc_grouped.add((ids[i], ids[j]))

    meta = {}

    def add(cid, title, units, credit, colleges, disc, top_code, standalone):
        tk = content_tokens(title)
        if len(tk) < MIN_CONTENT_TOKENS:
            return
        meta[cid] = {
            "title": title or "", "tokens": tk, "units": units,
            "credit": credit, "colleges": frozenset(colleges), "disc": disc,
            "top2": top2(top_code), "standalone": standalone,
            "marks": extract_marks(title),
        }

    n_dark = 0
    for cid, v in minted.items():
        if v.get("c_id") or v.get("ccn_id") or cid in proms or cid in cur:
            continue
        ms = mem.get(cid) or []
        if any(str(m.get("control_number", "")).strip().upper() in cn_cid
               for m in ms):
            continue
        n_dark += 1
        add(cid, v.get("common_title"), v.get("typical_units"),
            v.get("credit_status"),
            (m.get("college") for m in ms if m.get("college")),
            v.get("discipline"), v.get("top_code"), False)

    n_sing = 0
    for sid, v in singles.items():
        if sid in cur:
            continue
        cn = str(v.get("control_number", "")).strip().upper()
        if cn and cn in cn_cid:
            continue  # carries official evidence — the router/evidence lanes own it
        n_sing += 1
        add(sid, v.get("common_title"), v.get("typical_units"),
            v.get("credit_status"),
            [v.get("college")] if v.get("college") else [],
            v.get("discipline"), v.get("top_code"), True)

    n = len(meta)
    print(f"population: {n_dark} dark M-IDs + {n_sing} stand-alones "
          f"-> {n} with usable titles")

    # ---- tf-idf over title tokens ---------------------------------------------
    df = Counter()
    for m in meta.values():
        df.update(set(m["tokens"]))
    idf = {t: math.log(n / c) for t, c in df.items()}
    vec = {}
    for cid, m in meta.items():
        tf = Counter(m["tokens"])
        v = {t: (1 + math.log(c)) * idf[t] for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vec[cid] = {t: x / norm for t, x in v.items()}

    # ---- candidates via top-IDF inverted index ----------------------------------
    posting = defaultdict(list)
    for cid, v in vec.items():
        for t in sorted(v, key=v.get, reverse=True)[:TOP_IDF_TOKENS]:
            if df[t] <= PAIR_DF_CAP:
                posting[t].append(cid)

    cand = set()
    for t, ids in posting.items():
        if len(ids) > 1:
            ids = sorted(ids)
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    cand.add((ids[i], ids[j]))
    print(f"candidate pairs (shared rare top-IDF token, df <= {PAIR_DF_CAP}): "
          f"{len(cand)}")

    # ---- gates ------------------------------------------------------------------
    passing = []
    stats = Counter()
    for a, b in cand:
        ma, mb = meta[a], meta[b]
        why = pair_guard(ma, mb)
        if why:
            stats[why] += 1
            continue
        # short-title trap ("Lifeguard Cadet" + "Firefighter Cadet I" pairing
        # on the lone rare token "cadet"): require >= 2 shared content tokens.
        if len(set(ma["tokens"]) & set(mb["tokens"])) < 2:
            stats["single_shared_token"] += 1
            continue
        if sig(ma["title"]) == sig(mb["title"]):
            stats["already_title_lane"] += 1
            continue
        if (a, b) in desc_grouped:
            stats["already_desc_lane"] += 1
            continue
        cos = sum(w * vec[b].get(t, 0.0) for t, w in vec[a].items())
        if cos < COSINE_MIN:
            stats["below_cosine"] += 1
            continue
        passing.append({"a": a, "b": b, "cosine": round(cos, 3)})
    print(f"pairs passing all gates @ cosine >= {COSINE_MIN}: {len(passing)}")
    print(f"  gate rejections: {dict(stats)}")

    # ---- clique-consistent connected components ----------------------------------
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    members_of = {}

    def comp_members(root):
        return members_of.setdefault(root, {root})

    blocked_unions = 0
    for p in sorted(passing, key=lambda p: -p["cosine"]):
        ra, rb = find(p["a"]), find(p["b"])
        if ra == rb:
            continue
        A, B = comp_members(ra), comp_members(rb)
        if len(A) + len(B) > GROUP_CAP:
            continue
        # clique rule: EVERY cross-pair must pass the hard guards, so an
        # unmarked title can't chain Level 1 and Level 2 into one component.
        if any(pair_guard(meta[x], meta[y]) for x in A for y in B):
            blocked_unions += 1
            continue
        parent[rb] = ra
        members_of[ra] = A | B
        members_of.pop(rb, None)
    print(f"guard-inconsistent unions blocked: {blocked_unions}")

    comp = defaultdict(list)
    for cid in parent:
        comp[find(cid)].append(cid)
    pair_by_key = {(p["a"], p["b"]): p for p in passing}
    groups = []
    for ids in comp.values():
        if len(ids) < 2:
            continue
        ids = sorted(ids)
        gpairs = [pair_by_key[(a, b)] for i, a in enumerate(ids)
                  for b in ids[i + 1:] if (a, b) in pair_by_key]
        if not gpairs:
            continue
        cos = [p["cosine"] for p in gpairs]
        all_colleges = [meta[c]["colleges"] for c in ids]
        cross = len(set().union(*all_colleges)) > 1
        units = [meta[c]["units"] for c in ids if meta[c]["units"] is not None]
        spread = round(max(units) - min(units), 2) if units else None
        # shared high-IDF context terms for the curator
        shared = set(meta[ids[0]]["tokens"])
        for c in ids[1:]:
            shared &= set(meta[c]["tokens"])
        shared = sorted(shared, key=lambda t: -idf.get(t, 0))[:6]
        groups.append({
            "members": [{"id": c, "title": meta[c]["title"],
                         "units": meta[c]["units"], "disc": meta[c]["disc"],
                         "standalone": meta[c]["standalone"],
                         "colleges": sorted(meta[c]["colleges"])} for c in ids],
            "n": len(ids),
            "cos_min": min(cos), "cos_max": max(cos),
            "cross_college": cross,
            "units_spread": spread,
            "shared_terms": shared,
        })
    groups.sort(key=lambda g: (not g["cross_college"], -g["cos_max"]))

    cross_n = sum(1 for g in groups if g["cross_college"])
    mixed_n = sum(1 for g in groups
                  if any(m["standalone"] for m in g["members"])
                  and any(not m["standalone"] for m in g["members"]))
    print(f"groups: {len(groups)} ({cross_n} cross-college; {mixed_n} mixed "
          f"M-ID+stand-alone)")

    os.makedirs(OUT_DIR, exist_ok=True)
    receipt = {
        "_generated_by": "kb/_title_consolidation_dryrun.py",
        "_generated_at": date.today().isoformat(),
        "_status": "DRY-RUN — measurement receipt; nothing applied",
        "_params": {"cosine_min": COSINE_MIN, "pair_df_cap": PAIR_DF_CAP,
                    "group_cap": GROUP_CAP},
        "population": {"dark_mids": n_dark, "standalones": n_sing,
                       "with_usable_titles": n,
                       "candidate_pairs": len(cand),
                       "passing_pairs": len(passing),
                       "gate_rejections": dict(stats),
                       "guard_inconsistent_unions_blocked": blocked_unions},
        "groups": groups,
    }
    out = os.path.join(OUT_DIR, "candidates.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"receipt: kb/title_consolidation_out/candidates.json")

    print("\ntop cross-college groups:")
    shown = 0
    for g in groups:
        if not g["cross_college"]:
            continue
        print(f"  cos {g['cos_min']:.2f}-{g['cos_max']:.2f} spread={g['units_spread']} "
              f"terms: {', '.join(g['shared_terms'][:4])}")
        for m in g["members"]:
            tag = "SA" if m["standalone"] else "M "
            print(f"   {tag} {m['id']:14} {str(m['title'])[:52]:52} u={m['units']} "
                  f"[{', '.join(c[:18] for c in m['colleges'][:3])}]")
        shown += 1
        if shown >= 15:
            break


if __name__ == "__main__":
    main()
