"""
Description-similarity consolidation candidates for DARK M-IDs — the minted
identities untouched by any official authority (Session 45 dry-run).

Population: minted M-IDs with NO C-ID/CCN claim, NO c-id.net articulation
coverage on any member, NO promotions evidence, NO curation — after the
statewide router (#379), 13,922 of 16,143 M-IDs (86%). For these, official
routine rules can never fire; consolidation evidence must come from CONTENT:
the catalog description, corroborated across colleges.

What this finds that existing lanes cannot: the Suggested-merges worklist
groups by a LEVEL-SAFE TITLE SIGNATURE, so "Intro to Programming" vs
"Programming Fundamentals" (same course, different naming culture) never
group. Descriptions are the only signal connecting them.

Method (lightweight TF-IDF, no deps):
  * docs = the M-ID's representative description (>= 40 chars), tokenized to
    alpha tokens >= 3 chars, minus stopwords + curriculum boilerplate
    ("course", "students", "emphasis", ...). log-IDF, L2-normalized, cosine.
  * candidate pairs share >= 2 of each other's top-10 IDF tokens (inverted
    index; tokens with df > 200 don't generate pairs) — no O(n^2).
  * HARD GATES per pair:
      - cosine >= 0.60
      - same credit_status; units within 0.5 (or both null)
      - NOT the same title signature (those are already in the worklist)
      - LEVEL SAFETY: titles carrying DIFFERENT level markers (digits, roman
        numerals, A/B suffixes, beginning/intermediate/advanced/elementary,
        first/second semester) never pair — sequential levels share template
        descriptions and folding them is the FLSP M1379 sin.
      - GENDER SAFETY: "Men's Varsity X" vs "Women's Varsity X" never pair —
        athletics descriptions are template-identical across gender.
      - SPORT SAFETY: titles naming DIFFERENT sports never pair (the
        off-season-conditioning template gives Wrestling and Cross Country
        the same description at the same college).
  * RANKING per pair/group:
      - cross-college corroboration first (disjoint member-college sets =
        distinct colleges describing the same course independently); pairs
        whose member colleges overlap are flagged same_college and rank last
        (likely intra-college variants — the worklist's amber convention).
      - then cosine.
  * groups = connected components over passing pairs (capped at 8 members),
    carrying min/max cosine + the shared high-IDF terms for curator context.

NEVER auto-applies anything. Writes the receipt
kb/desc_consolidation_out/candidates.json + a console report. The shipping
decision (a desc_groups worklist lane) is made on this receipt's yield.

Run from repo root:  python3 kb/_desc_consolidation_dryrun.py
"""
import json
import math
import os
import re
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "desc_consolidation_out")

MIN_DESC = 40
COSINE_MIN = 0.60
PAIR_DF_CAP = 200      # tokens more common than this don't generate candidates
TOP_IDF_TOKENS = 10
SHARED_MIN = 2
GROUP_CAP = 8

STOP = set("""a an and are as at be been by for from has have in into is it its
of on or that the their this those to was were will with within which can may
who whose your you we our they them he she his her also than then so such not
no nor do does did done""".split())
BOILER = set("""course courses student students introduction introduces
introductory study studies studied emphasis emphasize emphasizes emphasized
topic topics skill skills include includes including included designed
provides provide focus focuses focusing learn learning learner cover covers
covered covering basic prerequisite prerequisites unit units lecture
laboratory lab class classes semester term week weeks hour hours practice
principles concepts techniques methods overview survey examination explore
explores exploration develop develops development understanding designed
intended required completion offered""".split())

ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7,
         "viii": 8}
LEVEL_WORDS = {"beginning": 1, "elementary": 1, "introductory": 1, "first": 1,
               "intermediate": 2, "second": 2, "advanced": 3, "third": 3,
               "fourth": 4}
GENDER = {"men": "m", "mens": "m", "male": "m", "women": "w", "womens": "w",
          "female": "w"}
# closed-ish list of sport nouns whose off-season/varsity template
# descriptions are interchangeable — titles naming DISJOINT sports never pair
# (subset-or-empty passes: "Cross Country" pairs with "Cross Country, Men")
SPORTS = {"baseball", "softball", "basketball", "volleyball", "soccer",
          "football", "wrestling", "tennis", "golf", "swimming", "diving",
          "badminton", "track", "country", "polo", "cheerleading",
          "lacrosse", "rowing", "crew"}


def title_marks(title, vocab):
    t = str(title or "").lower()
    out = set()
    for w in re.split(r"[^a-z]+", t):
        if w in vocab:
            out.add(vocab[w] if isinstance(vocab, dict) else w)
    return out


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def tokens(text):
    return [t for t in re.split(r"[^a-z]+", str(text).lower())
            if len(t) >= 3 and t not in STOP and t not in BOILER]


def title_levels(title):
    """Level markers in a course title: digits, roman numerals, trailing
    A/B letters, level words. Returns a frozenset of normalized markers."""
    t = str(title or "").lower()
    out = set()
    for w in re.split(r"[^a-z0-9]+", t):
        if not w:
            continue
        if w.isdigit() and len(w) <= 2:
            out.add(int(w))
        elif w in ROMAN:
            out.add(ROMAN[w])
        elif w in LEVEL_WORDS:
            out.add(LEVEL_WORDS[w])
    m = re.search(r"\b([1-9])?([ab])\b\s*$", t)
    if m and m.group(2):
        out.add(m.group(2))
    return frozenset(out)


def sig(title):
    """The worklist's level-safe signature, abbreviated: parentheticals out,
    articles out, roman->digit, tokens sorted. Pairs sharing it are already
    suggested by the title lane — this lane must skip them."""
    t = re.sub(r"\([^)]*\)", " ", str(title or "").lower())
    ws = []
    for w in re.split(r"[^a-z0-9]+", t):
        if not w or w in ("a", "an", "the", "of", "to", "and", "in", "for"):
            continue
        ws.append(str(ROMAN[w]) if w in ROMAN else w)
    return " ".join(sorted(ws))


def main():
    minted = load("coci_minted_courses.json")["courses"]
    proms = load("promotions.json").get("promotions", {})
    joins = load("cid_articulation_joins.json")["joins"]
    mem = load("coci_minted_memberships.json")["memberships"]
    cur = (load("coci_curation.json") or {}).get("curations", {})

    cn_cid = {str(j.get("control_number")).strip().upper() for j in joins}

    docs = {}      # cid -> token list
    meta = {}      # cid -> (title, units, credit, colleges, discipline)
    for cid, v in minted.items():
        if v.get("c_id") or v.get("ccn_id") or cid in proms or cid in cur:
            continue
        ms = mem.get(cid) or []
        if any(str(m.get("control_number", "")).strip().upper() in cn_cid
               for m in ms):
            continue
        desc = (v.get("description") or "").strip()
        if len(desc) < MIN_DESC:
            continue
        tk = tokens(desc)
        if len(tk) < 8:
            continue
        docs[cid] = tk
        meta[cid] = {
            "title": v.get("common_title") or "",
            "units": v.get("typical_units"),
            "credit": v.get("credit_status"),
            "colleges": frozenset(m.get("college") for m in ms if m.get("college")),
            "disc": v.get("discipline"),
        }

    n = len(docs)
    print(f"dark M-IDs with usable descriptions: {n}")

    # ---- tf-idf ---------------------------------------------------------------
    df = Counter()
    for tk in docs.values():
        df.update(set(tk))
    idf = {t: math.log(n / c) for t, c in df.items()}
    vec = {}
    for cid, tk in docs.items():
        tf = Counter(tk)
        v = {t: (1 + math.log(c)) * idf[t] for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vec[cid] = {t: x / norm for t, x in v.items()}

    # ---- candidate generation via top-IDF inverted index ----------------------
    posting = defaultdict(list)
    top_tokens = {}
    for cid, v in vec.items():
        tt = sorted(v, key=v.get, reverse=True)[:TOP_IDF_TOKENS]
        top_tokens[cid] = set(tt)
        for t in tt:
            if df[t] <= PAIR_DF_CAP:
                posting[t].append(cid)

    cand = Counter()
    for t, ids in posting.items():
        if len(ids) > 1:
            ids = sorted(ids)
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    cand[(ids[i], ids[j])] += 1
    pairs = [p for p, c in cand.items() if c >= SHARED_MIN]
    print(f"candidate pairs (>= {SHARED_MIN} shared top-IDF tokens): {len(pairs)}")

    # ---- gates -----------------------------------------------------------------
    passing = []
    stats = Counter()
    for a, b in pairs:
        ma, mb = meta[a], meta[b]
        if ma["credit"] != mb["credit"]:
            stats["credit_mismatch"] += 1
            continue
        ua, ub = ma["units"], mb["units"]
        if ua is not None and ub is not None and abs(ua - ub) > 0.5:
            stats["units_mismatch"] += 1
            continue
        if sig(ma["title"]) == sig(mb["title"]):
            stats["already_title_lane"] += 1
            continue
        la, lb = title_levels(ma["title"]), title_levels(mb["title"])
        if la and lb and la != lb:
            stats["level_risk"] += 1
            continue
        ga, gb = title_marks(ma["title"], GENDER), title_marks(mb["title"], GENDER)
        if ga and gb and ga != gb:
            stats["gender_risk"] += 1
            continue
        sa, sb = title_marks(ma["title"], SPORTS), title_marks(mb["title"], SPORTS)
        if sa and sb and not (sa <= sb or sb <= sa):
            stats["sport_risk"] += 1
            continue
        cos = sum(w * vec[b].get(t, 0.0) for t, w in vec[a].items())
        if cos < COSINE_MIN:
            stats["below_cosine"] += 1
            continue
        shared = sorted(top_tokens[a] & top_tokens[b],
                        key=lambda t: -idf.get(t, 0))[:6]
        passing.append({
            "a": a, "b": b, "cosine": round(cos, 3),
            "title_a": ma["title"], "title_b": mb["title"],
            "units": [ua, ub], "credit": ma["credit"],
            "disc": sorted({ma["disc"] or "?", mb["disc"] or "?"}),
            "same_college": bool(ma["colleges"] & mb["colleges"]),
            "shared_terms": shared,
        })
    print(f"pairs passing all gates @ cosine >= {COSINE_MIN}: {len(passing)}")
    print(f"  gate rejections: {dict(stats)}")

    # ---- connected components ---------------------------------------------------
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for p in sorted(passing, key=lambda p: -p["cosine"]):
        ra, rb = find(p["a"]), find(p["b"])
        if ra != rb:
            # cap group size — chained mega-components are over-merge factories
            size = sum(1 for x in parent if find(x) == ra) + \
                   sum(1 for x in parent if find(x) == rb)
            if size <= GROUP_CAP:
                parent[ra] = rb

    comp = defaultdict(list)
    for cid in parent:
        comp[find(cid)].append(cid)
    groups = []
    for ids in comp.values():
        if len(ids) < 2:
            continue
        ids = sorted(ids)
        gpairs = [p for p in passing if p["a"] in ids and p["b"] in ids]
        if not gpairs:
            continue
        cos = [p["cosine"] for p in gpairs]
        cross = any(not p["same_college"] for p in gpairs)
        groups.append({
            "members": [{"id": c, "title": meta[c]["title"],
                         "units": meta[c]["units"],
                         "disc": meta[c]["disc"],
                         "colleges": sorted(meta[c]["colleges"])} for c in ids],
            "n": len(ids),
            "cos_min": min(cos), "cos_max": max(cos),
            "cross_college": cross,
            "shared_terms": gpairs[0]["shared_terms"],
        })
    groups.sort(key=lambda g: (not g["cross_college"], -g["cos_max"]))

    cross_n = sum(1 for g in groups if g["cross_college"])
    print(f"groups: {len(groups)} ({cross_n} cross-college, "
          f"{len(groups) - cross_n} same-college-only)")

    os.makedirs(OUT_DIR, exist_ok=True)
    receipt = {
        "_generated_by": "kb/_desc_consolidation_dryrun.py",
        "_generated_at": date.today().isoformat(),
        "_status": "DRY-RUN — measurement receipt; nothing applied",
        "_params": {"cosine_min": COSINE_MIN, "min_desc": MIN_DESC,
                    "shared_min": SHARED_MIN, "group_cap": GROUP_CAP},
        "population": {"dark_mids_with_desc": n,
                       "candidate_pairs": len(pairs),
                       "passing_pairs": len(passing),
                       "gate_rejections": dict(stats)},
        "groups": groups,
    }
    out = os.path.join(OUT_DIR, "candidates.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"receipt: kb/desc_consolidation_out/candidates.json")

    print("\ntop cross-college groups:")
    shown = 0
    for g in groups:
        if not g["cross_college"]:
            continue
        print(f"  cos {g['cos_min']:.2f}-{g['cos_max']:.2f}  "
              f"terms: {', '.join(g['shared_terms'][:4])}")
        for m in g["members"]:
            print(f"     {m['id']:14} {str(m['title'])[:48]:48} u={m['units']} "
                  f"[{', '.join(c[:18] for c in m['colleges'][:3])}]")
        shown += 1
        if shown >= 12:
            break


if __name__ == "__main__":
    main()
