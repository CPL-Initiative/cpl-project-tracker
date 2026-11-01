#!/usr/bin/env python3
"""The Exhibits List's AI sort: every credential placed like with like, the groups in A to Z order.

Sam, 2026-11-01: "Can you add an AI-Sort button where you sort the list based on your understanding of the exhibits
(like with like in an alpha-like order)? This would allow me to get out of my literal sorting practice to see
opportunities based on your expanded view of things."

The method, so a reader can check a placement:
  1. Each title becomes its subject words: lower case, accents and punctuation off, plural and -ing endings off, and
     the level words set aside (Beginning, Intermediate, Advanced, Introduction, Fundamentals, 1, 2, II, Level ...),
     so "Advanced Acoustical Ceiling Installation" and "Acoustical Ceilings" share "acoustical ceiling".
  2. Words weigh by how rare they are across the reference (TF-IDF), so "acoustical" counts and "certification"
     barely does. The credential's discipline (the M-IDs' modal one) and its issuer add a lighter weight.
  3. Pairs of credentials that share a subject word and score at least THRESHOLD (cosine) join, strongest first, while
     the two groups' centers still agree and the group stays under MAX_GROUP; a chain of weak links cannot grow one
     group across the list.
  4. A group takes the name of the words most of its members share, in title order; a credential alone keeps its
     own subject words. Groups and singles run A to Z by that name; inside a group, by subject words, then level
     (Beginning before 1 before Intermediate before 2 before Advanced), then title.

Units, TOP and title quality play no part. Writes kb/exhibits_ai_sort.json; the daily run rebuilds it after the
credential reference, and the List view sorts by it when AI sort is pressed. Standard library only.

    python3 kb/_build_exhibits_ai_sort.py           # write
    python3 kb/_build_exhibits_ai_sort.py --check   # exit 1 when the file on disk is stale
"""
import json
import math
import pathlib
import re
import sys
import unicodedata
from collections import Counter, defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "credential_reference_data.js"
OUT = ROOT / "kb" / "exhibits_ai_sort.json"

THRESHOLD = 0.5
CENTER_AGREE = 0.4
MAX_GROUP = 60
CANDIDATE_DF = 150     # a word in more titles than this does not by itself make two credentials candidates
W_DISC = 0.6
W_ISSUER = 0.4

STOP = {"and", "of", "the", "for", "in", "to", "a", "an", "with", "on", "at", "by", "or", "from", "into", "your"}
LEVEL = {
    "beginning": 1, "beginner": 1, "beginners": 1, "basic": 1, "basics": 1, "intro": 1, "introduction": 1,
    "introductory": 1, "fundamental": 1, "fundamentals": 1, "elementary": 1, "principles": 1, "principle": 1,
    "foundation": 1, "foundations": 1, "intermediate": 3, "advanced": 5, "adv": 5,
    "level": 0, "part": 0, "course": 0,
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
}


def fold(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    return "".join(ch for ch in s if not unicodedata.combining(ch)).lower().replace("&", " and ")


def stem(w):
    if len(w) > 5 and w.endswith("ing"):
        return w[:-3]
    if len(w) > 4 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss") and not w.endswith("us") and not w.endswith("is"):
        return w[:-1]
    return w


def subject_words(title):
    """The title's words with the level words set aside, and the level they named (0 when none)."""
    words, level = [], 0
    for w in re.findall(r"[a-z0-9]+", fold(title)):
        if w in LEVEL:
            level = max(level, LEVEL[w])
            continue
        if w in STOP:
            continue
        words.append(stem(w))
    return words, level


def load_rows():
    text = SRC.read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"):text.rstrip().rstrip(";").rindex("}") + 1])
    return data["unified_titles"], data.get("_generated_at")


def cosine(a, b):
    if len(a) > len(b):
        a, b = b, a
    dot = sum(v * b.get(k, 0.0) for k, v in a.items())
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def build():
    rows, generated = load_rows()
    items = []
    for r in rows:
        ut = r.get("ut")
        if not ut:
            continue
        words, level = subject_words(ut)
        items.append({"ut": ut, "words": words, "level": level,
                      "disc": (r.get("disc_modal") or "").strip(), "issuer": (r.get("issuer") or "").strip()})
    n = len(items)
    df = Counter()
    for it in items:
        df.update(set(it["words"]))
    disc_df = Counter(it["disc"] for it in items if it["disc"])
    iss_df = Counter(it["issuer"] for it in items if it["issuer"])

    def idf(count):
        return math.log((n + 1) / (count + 1)) + 1.0

    for it in items:
        v = defaultdict(float)
        for w in it["words"]:
            v["w:" + w] += idf(df[w])
        if it["disc"]:
            v["d:" + it["disc"]] += W_DISC * idf(disc_df[it["disc"]])
        if it["issuer"]:
            v["i:" + it["issuer"]] += W_ISSUER * idf(iss_df[it["issuer"]])
        it["vec"] = dict(v)

    # Candidate pairs: two credentials that share a subject word no more common than CANDIDATE_DF.
    index = defaultdict(list)
    for i, it in enumerate(items):
        for w in set(it["words"]):
            if df[w] <= CANDIDATE_DF:
                index[w].append(i)
    pairs = {}
    for members in index.values():
        for x in range(len(members)):
            for y in range(x + 1, len(members)):
                a, b = members[x], members[y]
                if (a, b) not in pairs:
                    pairs[(a, b)] = cosine(items[a]["vec"], items[b]["vec"])
    edges = sorted(((s, a, b) for (a, b), s in pairs.items() if s >= THRESHOLD), key=lambda e: (-e[0], e[1], e[2]))

    parent = list(range(n))
    members = {i: [i] for i in range(n)}
    center = {i: dict(items[i]["vec"]) for i in range(n)}

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for s, a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb or len(members[ra]) + len(members[rb]) > MAX_GROUP:
            continue
        if cosine(center[ra], center[rb]) < CENTER_AGREE:
            continue
        if len(members[ra]) < len(members[rb]):
            ra, rb = rb, ra
        parent[rb] = ra
        members[ra].extend(members.pop(rb))
        c = center[ra]
        for k, v in center.pop(rb).items():
            c[k] = c.get(k, 0.0) + v

    def label_for(ids):
        if len(ids) == 1:
            return " ".join(items[ids[0]]["words"]) or fold(items[ids[0]]["ut"])
        share = Counter()
        pos = defaultdict(list)
        for i in ids:
            ws = items[i]["words"]
            for p, w in enumerate(dict.fromkeys(ws)):
                share[w] += 1
                pos[w].append(p)
        need = max(2, math.ceil(len(ids) / 2))
        common = [w for w, c in share.items() if c >= need]
        if not common:
            common = [w for w, _ in share.most_common(1)]
        common.sort(key=lambda w: (sum(pos[w]) / len(pos[w]), w))
        return " ".join(common[:4])

    def display(label, ids):
        """The label in the members' own casing: the first member title holding each word."""
        out = []
        for w in label.split():
            shown = w
            for i in ids:
                for orig in re.findall(r"[A-Za-zÀ-ÿ0-9]+", items[i]["ut"]):
                    if stem(fold(orig)) == w:
                        shown = orig
                        break
                else:
                    continue
                break
            out.append(shown)
        s = " ".join(out)
        return s[:1].upper() + s[1:]

    groups = []
    for root, ids in members.items():
        lab = label_for(ids)
        groups.append({"key": lab, "ids": ids, "name": display(lab, ids)})
    groups.sort(key=lambda g: (g["key"], g["name"].lower()))

    order, out_groups, rank = {}, [], 0
    for gi, g in enumerate(groups):
        ids = sorted(g["ids"], key=lambda i: (" ".join(items[i]["words"]), items[i]["level"], fold(items[i]["ut"])))
        out_groups.append({"name": g["name"], "n": len(ids)})
        for i in ids:
            order[items[i]["ut"]] = [gi, rank]
            rank += 1

    multi = [g for g in out_groups if g["n"] > 1]
    return {
        "schema": 1,
        "_what": "The Exhibits List's AI sort: credentials like with like, groups A to Z. Built by "
                 "kb/_build_exhibits_ai_sort.py from credential_reference_data.js; its docstring states the method.",
        "_reference_generated_at": generated,
        "_params": {"threshold": THRESHOLD, "center_agree": CENTER_AGREE, "max_group": MAX_GROUP,
                    "candidate_df": CANDIDATE_DF, "w_disc": W_DISC, "w_issuer": W_ISSUER},
        "counts": {"credentials": len(order), "groups_of_two_or_more": len(multi),
                   "credentials_in_groups": sum(g["n"] for g in multi), "alone": len(out_groups) - len(multi)},
        "groups": out_groups,
        "order": order,
    }


def main():
    data = build()
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("kb/exhibits_ai_sort.json is STALE — run: python3 kb/_build_exhibits_ai_sort.py")
            sys.exit(1)
        print("kb/exhibits_ai_sort.json ok")
        return
    OUT.write_text(text, encoding="utf-8")
    c = data["counts"]
    print(f"wrote {OUT.relative_to(ROOT)}: {c['credentials']} credentials, {c['groups_of_two_or_more']} groups holding "
          f"{c['credentials_in_groups']}, {c['alone']} alone")


if __name__ == "__main__":
    main()
