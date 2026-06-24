#!/usr/bin/env python3
"""Morphological-variant grouping DRY-RUN (Session 70, Sam's "Conversational ≠
Conversation" find).

Measure-first ONLY — writes a receipt, mutates NOTHING. Question it answers:
if the Suggested-merges title signature (`_sug_sig`) STEMMED its tokens before
grouping (so conversation↔conversational, assisting↔assistant, welding↔welds,
biology↔biological all collapse), how many MORE identities would join a
multi-member merge group, and how many of those new unions look like OVER-merges
(span ≥2 disciplines)?

Inputs (committed, read-only): unified_courses_data.js (main rows) +
unified_courses_standalone.js (singletons) + kb/synonym_map.json. It replicates
the generator's `_sug_sig` exactly, then compares current vs stemmed grouping.

Run from repo root:  python3 kb/_morphological_variant_dryrun.py
"""
import json, os, re, sys, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_js(path, prefix):
    with open(os.path.join(ROOT, path)) as f:
        txt = f.read()
    i = txt.index(prefix) + len(prefix)
    body = txt[i:].strip()
    if body.endswith(";"):
        body = body[:-1]
    return json.loads(body)


# ---- replicate the generator's _sug_sig (excel_to_dashboard.py) ----------------
_SUG_DROP = {"a", "an", "the", "of", "to", "and", "in", "for", "with", "on"}
_SUG_LEVELWORDS = {"beginning", "beginner", "elementary", "introductory",
                   "introduction", "intro", "first", "basic", "preparatory",
                   "prep", "developmental", "intermediate", "second",
                   "advanced", "third", "fourth"}
_SUG_ROMAN = {"i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"}
_SUG_SEGMENT = {"part", "semester", "module", "half", "level", "levels"}

try:
    _sm = json.load(open(os.path.join(ROOT, "kb", "synonym_map.json")))
    _syn = {str(k).lower().strip(): str(v).lower().strip()
            for k, v in (_sm.get("synonyms") or {}).items() if k and v}
except Exception:
    _syn = {}
_syn_pairs = [(re.compile(r"\b" + re.escape(k) + r"\b"), v)
              for k, v in sorted(_syn.items(), key=lambda kv: -len(kv[0]))]


def _toks(t):
    """The token list _sug_sig keeps (pre-stem), in raw form."""
    t = re.sub(r"\([^)]*\)", " ", str(t or "").lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    if _syn_pairs:
        t = " ".join(t.split())
        for rx, rep in _syn_pairs:
            t = rx.sub(rep, t)
    out = []
    for w in t.split():
        if w in _SUG_DROP or w in _SUG_LEVELWORDS or w in _SUG_ROMAN:
            continue
        if w in _SUG_SEGMENT:
            continue
        if w.isdigit():
            continue
        if len(w) == 1 and "a" <= w <= "h":
            continue
        out.append(w)
    return out


def sig_current(t):
    return " ".join(sorted(set(_toks(t))))


# ---- the proposed conservative morphological stemmer ---------------------------
# Suffix-strip rules, applied longest-meaningful-first, iterated until stable, with
# a 4-char minimum stem so we don't crush short roots. Tuned so VARIANTS converge
# (music/musical→music, conversation/conversational→convers, assisting/assistant→
# assist, biology/biological→biolog). Heuristic by nature — the cross-discipline
# flags below are how we catch over-collapse.
def _stem1(w):
    if len(w) <= 4:
        return w
    if w.endswith("ies") and len(w) - 3 >= 3:
        return w[:-3] + "y"
    for suf in ("ological",):
        if w.endswith(suf) and len(w) - len(suf) + 4 >= 4:
            return w[:-len(suf)] + "olog"
    if w.endswith("ology") and len(w) - 5 >= 3:
        return w[:-5] + "olog"
    for suf in ("ization", "ation", "ition", "ement", "ment", "ance", "ence",
                "ing", "ed", "ant", "ent", "ive", "ity", "al", "ics", "ic",
                "es", "er", "or"):
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            return w[:-len(suf)]
    if w.endswith("s") and not w.endswith("ss") and len(w) - 1 >= 4:
        return w[:-1]
    return w


def stem(w):
    prev = None
    for _ in range(4):
        if w == prev:
            break
        prev = w
        w = _stem1(w)
    return w


def sig_stem(t):
    return " ".join(sorted(set(stem(w) for w in _toks(t))))


# ---- build the eligible identity pool (mirror the generator's filter) ----------
def eligible_main(r):
    if r.get("locked") and r.get("id_system") in ("C-ID", "CCN-ID"):
        return True   # official anchor — joins as target
    if r.get("locked") or r.get("id_system") not in ("M-ID", "Unified"):
        return False
    if (r.get("match") or {}).get("cid_conflict"):
        return False
    return True


def main():
    data = _load_js("unified_courses_data.js", "window.CPL_UNIFIED_COURSES = ")
    sa = _load_js("unified_courses_standalone.js", "window.CPL_UC_STANDALONE = ")
    pool = []
    for r in data.get("rows") or []:
        if eligible_main(r):
            pool.append(r)
    for r in sa.get("rows") or []:
        pool.append(r)

    def disc(r):
        return r.get("disc") or ""

    cur_groups = collections.defaultdict(list)
    stem_groups = collections.defaultdict(list)
    for r in pool:
        cs = sig_current(r.get("title"))
        if not cs:
            continue
        cur_groups[cs].append(r)
        stem_groups[sig_stem(r.get("title"))].append(r)

    cur_multi = {k: v for k, v in cur_groups.items() if len(v) >= 2}
    stem_multi = {k: v for k, v in stem_groups.items() if len(v) >= 2}
    cur_in_multi = sum(len(v) for v in cur_multi.values())
    stem_in_multi = sum(len(v) for v in stem_multi.values())

    # NEW unions = stemmed multi-groups that merge ≥2 distinct CURRENT signatures.
    new_unions = []
    for sk, members in stem_multi.items():
        cur_sigs = set(sig_current(m.get("title")) for m in members)
        if len(cur_sigs) >= 2:                 # stemming actually fused groups
            discs = sorted(set(d for d in (disc(m) for m in members) if d))
            new_unions.append({
                "stem_sig": sk, "n": len(members), "cur_sigs": sorted(cur_sigs),
                "n_cur_sigs": len(cur_sigs), "disciplines": discs,
                "cross_discipline": len(discs) >= 2,
                "titles": sorted(set((m.get("title") or "") for m in members))[:12],
                "ids": [m.get("id") for m in members][:12],
            })
    new_unions.sort(key=lambda g: (-g["n"], -g["n_cur_sigs"]))

    clean = [g for g in new_unions if not g["cross_discipline"]]
    cross = [g for g in new_unions if g["cross_discipline"]]
    newly_grouped_ids = stem_in_multi - cur_in_multi   # net identities pulled into a merge group

    date = datetime.date.today().isoformat()
    outdir = os.path.join(ROOT, "kb", "morph_variant_out", date)
    os.makedirs(outdir, exist_ok=True)

    summary = {
        "as_of": date,
        "pool_identities": len(pool),
        "current_multi_groups": len(cur_multi),
        "stemmed_multi_groups": len(stem_multi),
        "identities_in_multi_current": cur_in_multi,
        "identities_in_multi_stemmed": stem_in_multi,
        "net_newly_grouped_identities": newly_grouped_ids,
        "new_union_groups": len(new_unions),
        "new_unions_clean_same_discipline": len(clean),
        "new_unions_cross_discipline_REVIEW": len(cross),
    }
    json.dump({"summary": summary, "new_unions": new_unions},
              open(os.path.join(outdir, "dryrun.json"), "w"), indent=1)

    def find(term):
        term = term.lower()
        for g in new_unions:
            if any(term in (t or "").lower() for t in g["titles"]):
                return g
        return None

    lines = []
    lines.append("# Morphological-variant grouping — DRY RUN (%s)\n" % date)
    lines.append("Measure-first. Mutates nothing. Stems title tokens before the "
                 "Suggested-merges signature so morphological variants converge.\n")
    lines.append("## Summary\n")
    for k, v in summary.items():
        lines.append("- **%s**: %s" % (k, v))
    lines.append("\n## Sample NEW unions — clean (single discipline)\n")
    for g in clean[:25]:
        lines.append("- **%s** · %d ids · %d current-sigs merged · %s\n  - %s"
                     % (g["stem_sig"], g["n"], g["n_cur_sigs"],
                        (g["disciplines"][0] if g["disciplines"] else "—"),
                        " | ".join(g["titles"])))
    lines.append("\n## Sample NEW unions — CROSS-DISCIPLINE (review for over-merge)\n")
    for g in cross[:25]:
        lines.append("- **%s** · %d ids · disciplines: %s\n  - %s"
                     % (g["stem_sig"], g["n"], ", ".join(g["disciplines"]),
                        " | ".join(g["titles"])))
    jc = find("conversational japanese") or find("japanese conversation")
    lines.append("\n## The motivating case (Japanese conversation)\n")
    lines.append(("- " + jc["stem_sig"] + " → " + " | ".join(jc["titles"])) if jc
                 else "- (not surfaced as a NEW union — already grouped or still split)")
    open(os.path.join(outdir, "report.md"), "w").write("\n".join(lines) + "\n")

    print("\n".join("%s: %s" % (k, v) for k, v in summary.items()))
    print("\nReceipt: kb/morph_variant_out/%s/{report.md,dryrun.json}" % date)
    print("\n--- sanity: a few stems ---")
    for w in ["conversation", "conversational", "assisting", "assistant",
              "welding", "welds", "biology", "biological", "music", "musical",
              "mathematics", "mathematical", "management", "manager"]:
        print("  %-16s -> %s" % (w, stem(w)))
    if jc:
        print("\nJapanese case:", jc["stem_sig"], "::", " | ".join(jc["titles"]))


if __name__ == "__main__":
    main()
