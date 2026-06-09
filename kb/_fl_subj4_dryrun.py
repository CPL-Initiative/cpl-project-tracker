"""
_fl_subj4_dryrun.py — MEASURE-FIRST dry-run for the Foreign-Language SUBJ4 re-mint.

READ-ONLY. Classifies every 'Foreign Languages' M-ID + singleton to a language
(per kb/foreign_language_subj4.json) and reports what a SUBJ4 split would produce:
per-language counts, residuals, capacity per (new SUBJ4, band), and an old->new
SUBJ4 alias PREVIEW. Mutates NOTHING — the actual re-mint (deterministic M-number
re-sequencing + alias_map.json + atomic land) is a separate apply per Rule 7.

The discipline stays 'Foreign Languages' (authoritative MQ); only the SUBJ4 splits.

Classifier precedence (TOP labels are self-describing + authoritative):
  1. member/own TOP 11xx 6-digit code -> language  (e.g. 1105.00 -> Spanish)
  2. title keyword ("Spanish 1" -> Spanish)
  3. member local-subject code (SPAN/FREN/...) -> language
Unmatched (TOP 1101/1117.00/1199 general/other + no title signal; interpreting/
translation/linguistics) stay in the FLNG residual bucket for hand-curation.

Run from repo root:  python3 kb/_fl_subj4_dryrun.py
"""
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "fl_subj4_dryrun")


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


FLMAP = load("foreign_language_subj4.json")
cat = load("coci_minted_courses.json")["courses"]
mem = load("coci_minted_memberships.json")["memberships"]
sg = load("coci_minted_singletons.json")["courses"]

# Build the lookup tables from the curated map.
TOP2LANG, SUBJ2LANG, TITLE2LANG, LANG2SUBJ4 = {}, {}, {}, {}
for lang, d in FLMAP["languages"].items():
    LANG2SUBJ4[lang] = d["subj4"]
    for t in d.get("top", []):
        TOP2LANG[t] = lang
    for s in d.get("subjects", []):
        SUBJ2LANG[s.upper()] = lang
    TITLE2LANG[lang] = [k.lower() for k in d.get("title", [])]
RESIDUAL = FLMAP["residual_subj4"]


def lang_of_top(tc):
    code = str(tc or "").split(":")[0].strip()[:7]
    return TOP2LANG.get(code)


def lang_of_title(t):
    tl = " " + re.sub(r"[^a-z ]+", " ", str(t or "").lower()) + " "
    for lang, kws in TITLE2LANG.items():
        if any(" " + k + " " in tl or " " + k in tl for k in kws):
            return lang
    return None


def lang_of_subject(s):
    return SUBJ2LANG.get(str(s or "").upper().strip())


def classify_mid(mid, rec):
    members = mem.get(mid, [])
    # 1) modal TOP-language across members
    tv = collections.Counter(lang_of_top(m.get("top_code")) for m in members)
    tv.pop(None, None)
    if tv:
        return tv.most_common(1)[0][0], "member_top"
    # 2) title
    lt = lang_of_title(rec.get("common_title"))
    if lt:
        return lt, "title"
    # 3) modal member subject
    sv = collections.Counter(lang_of_subject(m.get("subject")) for m in members)
    sv.pop(None, None)
    if sv:
        return sv.most_common(1)[0][0], "member_subject"
    return None, "residual"


def classify_singleton(rec):
    lt = lang_of_top(rec.get("top_code"))
    if lt:
        return lt, "top"
    lt = lang_of_title(rec.get("common_title"))
    if lt:
        return lt, "title"
    return None, "residual"


def band_of(course_id):
    m = re.match(r"\S+\s+M(\d)", course_id or "")
    return m.group(1) if m else "?"


def main():
    fl_mids = {k: v for k, v in cat.items() if k.startswith("FLNG ")}
    fl_sing = {k: v for k, v in sg.items() if k.startswith("FLNG ")}

    by_lang = collections.Counter()
    by_src = collections.Counter()
    residual_titles = []
    cap = collections.Counter()        # (new_subj4, band) -> count
    alias_preview = []                 # [old_id, new_subj4, lang, band, source]

    for mid, rec in sorted(fl_mids.items()):
        lang, src = classify_mid(mid, rec)
        by_src[("mid", src)] += 1
        if lang:
            s4, b = LANG2SUBJ4[lang], band_of(mid)
            by_lang[("M-ID", lang)] += 1
            cap[(s4, b)] += 1
            alias_preview.append([mid, s4, lang, b, src])
        else:
            by_lang[("M-ID", "RESIDUAL")] += 1
            residual_titles.append(("M-ID", mid, rec.get("common_title")))

    for sid, rec in sorted(fl_sing.items()):
        lang, src = classify_singleton(rec)
        by_src[("singleton", src)] += 1
        if lang:
            s4, b = LANG2SUBJ4[lang], band_of(sid)
            by_lang[("singleton", lang)] += 1
            cap[(s4, b)] += 1
        else:
            by_lang[("singleton", "RESIDUAL")] += 1
            residual_titles.append(("singleton", sid, rec.get("common_title")))

    # ---- report ----
    print("=" * 72)
    print(f"FL SUBJ4 re-mint dry-run — {len(fl_mids)} FLNG M-IDs + {len(fl_sing)} FLNG singletons")
    print("=" * 72)
    langs = sorted({l for (_k, l) in by_lang}, key=lambda l: -(by_lang[("M-ID", l)] + by_lang[("singleton", l)]))
    print(f"\n{'language':<14}{'SUBJ4':<7}{'M-IDs':>7}{'singletons':>12}{'total':>8}")
    tot_m = tot_s = 0
    for l in langs:
        m, s = by_lang[("M-ID", l)], by_lang[("singleton", l)]
        tot_m += m; tot_s += s
        s4 = LANG2SUBJ4.get(l, RESIDUAL if l == "RESIDUAL" else "?")
        print(f"{l:<14}{s4:<7}{m:>7}{s:>12}{m + s:>8}")
    print(f"{'TOTAL':<14}{'':<7}{tot_m:>7}{tot_s:>12}{tot_m + tot_s:>8}")

    classified = sum(v for (k, l), v in by_lang.items() if l != "RESIDUAL")
    resid = sum(v for (k, l), v in by_lang.items() if l == "RESIDUAL")
    print(f"\nclassified: {classified} / {len(fl_mids) + len(fl_sing)} "
          f"({100 * classified / (len(fl_mids) + len(fl_sing)):.1f}%) · residual (stays FLNG): {resid}")
    print("classification source:", dict(by_src))

    print("\nCapacity check — M-IDs per (new SUBJ4, band); corroborated cap 496, standalone 6760 (§10):")
    over = [(k, v) for k, v in cap.items() if v > 496]
    for (s4, b), n in sorted(cap.items(), key=lambda x: -x[1])[:12]:
        print(f"   {s4} band {b}: {n}")
    print("   over the 496 corroborated cap:", over or "none")

    print(f"\nResidual sample ({len(residual_titles)}):")
    for kind, cid, t in residual_titles[:12]:
        print(f"   [{kind}] {cid}  {t!r}")

    os.makedirs(OUTDIR, exist_ok=True)
    manifest = {
        "_generated_by": "kb/_fl_subj4_dryrun.py (read-only)",
        "discipline": "Foreign Languages (unchanged — MQ authoritative)",
        "fl_mids": len(fl_mids), "fl_singletons": len(fl_sing),
        "classified": classified, "residual": resid,
        "by_language": {f"{k}|{l}": v for (k, l), v in by_lang.items()},
        "capacity_per_subj4_band": {f"{s4}|{b}": n for (s4, b), n in cap.items()},
        "alias_preview_count": len(alias_preview),
        "alias_preview_sample": alias_preview[:40],
        "residual_titles": residual_titles,
    }
    with open(os.path.join(OUTDIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nWrote {os.path.relpath(os.path.join(OUTDIR, 'manifest.json'), os.path.dirname(HERE))} (read-only; nothing mutated).")


if __name__ == "__main__":
    main()
