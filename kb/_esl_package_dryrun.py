"""
ESL 3-comprehensive packaging — DRY-RUN planner (P-3 / P-4, doctrine v0.13).

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, nothing to Supabase, nothing
to live curation. Reads the ESL identity space (discipline == "English as a
Second Language" [credit] ⋃ "…Noncredit 53412", per P-3's one-family framing) out
of kb/coci_minted_courses.json (M-IDs) + kb/coci_minted_singletons.json
(single-college unified courses), classifies each identity per the ratified ESL
doctrine, and produces reviewable artifacts under kb/esl_package_out/<date>/:

  esl_package_plan.json   — per-identity target + level + signal + confidence +
                            merge_note (the full 2,364-row mapping)
  esl_package_report.md   — human skim: bucket/level histograms, signal & confidence
                            breakdown, carve-out samples, ambiguous-row review list,
                            the apply surface (survivors, merge_into pointers,
                            downstream articulation/promotion re-key count), method

The doctrine (kb/merge_doctrine.md, P-4 "ESL 3-comprehensive collapse", ratified
Sam 2026-07-14):

  ALL of ESL (credit ⋃ noncredit) collapses to EXACTLY THREE comprehensive
  courses — Beginning · Intermediate · Advanced ESL — with every skill strand
  (reading/writing/listening/speaking/grammar/conversation/pronunciation/
  vocabulary/academic-prep/EAP) AND every content-for-ESL course (culture/film/
  computer-for-multilingual/US-life-&-culture) folded in by level. No strand or
  content course survives as its own identity (Q-STRANDS settled).

  Level assignment: the title's level mark; a course with NO explicit level
  defaults to BEGINNING (the CPL-safe under-claim — award at the entry band
  rather than over-claim). Combo levels follow the KINE precedent (P-11):
  Beginning–Intermediate combo → Beginning; Intermediate–Advanced combo →
  Advanced. Numeric ladders map per the ratified pinning: 1–2 → Beginning,
  3–4 → Intermediate, 5+ → Advanced.

  THREE carve-outs escape the collapse (kept as their own identity/family):
    1. Transfer-level / degree-applicable ESL (college/transfer composition —
       CPL awards real transferable credit; the rung IS the credit target). RARE.
       There is NO CB05/transferable flag in the source data and no c_id on any
       ESL identity, so this bucket is BEST-EFFORT title-signal and is emitted as
       a REVIEW bucket (Sam confirms) — never an auto-fold. A title that carries
       an explicit Beginning/Intermediate/Advanced level word is treated as a
       LEVELED ESL course that merely uses "composition" pedagogy (→ folds), NOT
       transfer-level.
    2. ESL Citizenship (naturalization/civics purpose).
    3. Vocational ESL / VESL (workforce/CTE purpose).

This is the flagship packaging pass (`package-esl@bot`). The apply (a separate,
Sam-gated step) is a curation write under Rule 9 (fresh live read at write-time,
INSERT-only ON CONFLICT DO NOTHING, cohort `package-esl-s117@bot`, receipt); a
packaging merge that changes a survivor id also re-keys any articulations /
promotions pointing at a folded ESL identity (Rule 7) — the downstream surface is
measured below so the apply scope is known.
"""
import json
import os
import re
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATE = "2026-07-15"
OUTDIR = os.path.join(ROOT, "kb", "esl_package_out", DATE)

ESL_DISCIPLINES = {
    "English as a Second Language",
    "English as a Second Language Noncredit 53412",
}

# ── Carve-out lexicons (title-PRIMARY — the carve-out theme must be the course's
#    subject, not incidental vocabulary; the KINE "primary frame" logic, P-11) ──
CITIZENSHIP = re.compile(r"\bcitizenship\b|\bnaturaliz", re.I)
VESL = re.compile(
    r"\bvocational\b|\bvesl\b|\bpre-?vocational\b|\bworkplace\b|\bworkforce\b"
    r"|\boccupational\b|\bfor the workplace\b|\bfor work\b|\bon the job\b"
    r"|\bworkforce readiness\b|\bcareer\b|\bjob skills\b", re.I)
# Transfer-level: college/transfer/freshman composition — degree-applicable.
TRANSFER = re.compile(
    r"\btransfer[- ]?level\b|\bcollege composition\b|\bfreshman composition\b"
    r"|\bcollege[- ]?level composition\b|composition for (non-native|multilingual)"
    r"|composition for esl|\bfor freshman comp\b|college reading and composition"
    r"|support for freshman composition", re.I)
# NOTE: a bare "1A"/"3A" catalog RUNG code (P-10a) is NOT a transfer signal — it is
# a level mark ("English 1A" the ESL rung, not transfer ENGL 1A). Excluded above.

# ── Level word lexicons ──
BEG = re.compile(r"\bbeginning\b|\bbeginner\b|\bbasic\b|\bliteracy\b|\bfoundation"
                 r"|\bintroductory\b|\bintro\b|\belementary\b|\bnovice\b|\bsurvival\b"
                 r"|\blow-?beginning\b|\bhigh-?beginning\b", re.I)
INT = re.compile(r"\bintermediate\b|\blow-?intermediate\b|\bhigh-?intermediate\b", re.I)
ADV = re.compile(r"\badvanced\b|\bhigh-?advanced\b", re.I)

# numeric level: "level N", "stage/step N", "ESL N", roman I–VII, or a trailing
# bare integer 1–7 (common ladder mark: "Academic Listening and Speaking 2")
LEVEL_NUM = re.compile(r"\b(?:level|stage|step|esl|part)\s*[-:]?\s*(\d)\b", re.I)
ROMAN = re.compile(r"\b(VII|VI|IV|V|III|II|I)\b")
TRAIL_INT = re.compile(r"\b([1-7])\b(?!\s*[A-Za-z])")
ROMAN_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}


def num_to_band(n):
    if n <= 2:
        return "Beginning"
    if n <= 4:
        return "Intermediate"
    return "Advanced"


def classify(title):
    """Return (bucket, level, signal, confidence, note)."""
    t = title or ""
    # ---- carve-outs (priority order) ----
    if CITIZENSHIP.search(t):
        return ("ESL Citizenship", _word_level(t), "carveout-citizenship",
                "high", "ESL Citizenship carve-out (naturalization/civics purpose)")
    if VESL.search(t):
        return ("Vocational ESL (VESL)", _word_level(t), "carveout-vesl",
                "high", "Vocational-ESL carve-out (workforce/CTE purpose)")
    if TRANSFER.search(t):
        # a transfer-composition title that ALSO carries an explicit level word is
        # really a leveled ESL course → fold; else emit the review carve-out.
        if not (BEG.search(t) or INT.search(t) or ADV.search(t)):
            return ("Transfer-level ESL (review)", None, "carveout-transfer",
                    "review", "Possible transfer-level/degree-applicable ESL "
                    "(college/transfer composition) — NO transferable flag in "
                    "source; Sam confirms before it escapes the 3-comprehensive fold")
    # ---- the 3-comprehensive fold, by level ----
    has_b, has_i, has_a = bool(BEG.search(t)), bool(INT.search(t)), bool(ADV.search(t))
    # combos first (KINE precedent P-11)
    if has_i and has_a:
        return ("Advanced ESL", "Advanced", "combo",
                "high", "Intermediate–Advanced combo → Advanced (P-11 combo rule)")
    if has_b and has_i:
        return ("Beginning ESL", "Beginning", "combo",
                "high", "Beginning–Intermediate combo → Beginning (P-11 combo rule)")
    if has_b and has_a:
        return ("Intermediate ESL", "Intermediate", "combo",
                "medium", "Beginning–Advanced span → Intermediate (midpoint; review)")
    # single word level
    if has_a:
        return ("Advanced ESL", "Advanced", "word", "high", "Level word: Advanced")
    if has_i:
        return ("Intermediate ESL", "Intermediate", "word", "high",
                "Level word: Intermediate")
    if has_b:
        return ("Beginning ESL", "Beginning", "word", "high", "Level word: Beginning")
    # numeric ladder
    n = _numeric_level(t)
    if n is not None:
        band = num_to_band(n)
        return (f"{band} ESL", band, "numeric", "medium",
                f"Numeric level {n} → {band} (ratified pinning 1–2/3–4/5+)")
    # default → Beginning (CPL-safe under-claim)
    return ("Beginning ESL", "Beginning", "default-beginning", "medium",
            "No explicit level → Beginning (CPL-safe under-claim, P-4)")


def _word_level(t):
    if ADV.search(t):
        return "Advanced"
    if INT.search(t):
        return "Intermediate"
    if BEG.search(t):
        return "Beginning"
    return None


def _numeric_level(t):
    m = LEVEL_NUM.search(t)
    if m:
        return int(m.group(1))
    m = ROMAN.search(t)
    if m:
        return ROMAN_MAP[m.group(1)]
    m = TRAIL_INT.search(t)
    if m:
        return int(m.group(1))
    return None


def load_esl():
    out = []
    for src, fn in (("mid", "coci_minted_courses.json"),
                    ("sing", "coci_minted_singletons.json")):
        data = json.load(open(os.path.join(ROOT, "kb", fn)))["courses"]
        for cid, c in data.items():
            if c.get("discipline") in ESL_DISCIPLINES:
                out.append({
                    "id": cid, "src": src,
                    "title": c.get("common_title") or "",
                    "credit_status": c.get("credit_status"),
                    "units": c.get("typical_units"),
                    "top_code": c.get("top_code"),
                })
    return out


def downstream_surface(esl_ids):
    """Count articulations / promotions pointing at any ESL identity (the Rule-7
    re-key surface the apply must carry)."""
    idset = set(esl_ids)
    counts = {}
    # promotions: keyed by course_id
    try:
        promos = json.load(open(os.path.join(ROOT, "kb", "promotions.json")))
        pdata = promos.get("promotions", promos) if isinstance(promos, dict) else promos
        keys = pdata.keys() if isinstance(pdata, dict) else \
            [p.get("course_id") for p in pdata]
        counts["promotions_pointing_at_esl"] = sum(1 for k in keys if k in idset)
    except Exception as e:
        counts["promotions_pointing_at_esl"] = f"n/a ({e})"
    # crosswalk: course_id per member row
    try:
        cw = json.load(open(os.path.join(ROOT, "kb", "course_crosswalk.json")))
        counts["crosswalk_rows_pointing_at_esl"] = sum(
            1 for v in cw.values() if isinstance(v, dict) and v.get("course_id") in idset)
    except Exception as e:
        counts["crosswalk_rows_pointing_at_esl"] = f"n/a ({e})"
    return counts


def main():
    esl = load_esl()
    for e in esl:
        b, lvl, sig, conf, note = classify(e["title"])
        e.update(bucket=b, level=lvl, signal=sig, confidence=conf, merge_note=note)

    os.makedirs(OUTDIR, exist_ok=True)
    plan = {
        "_status": "DRY-RUN — ESL 3-comprehensive packaging plan (P-3/P-4, v0.13). "
                   "Nothing written to kb_curation or the identity files.",
        "_generated_at": DATE,
        "_doctrine": ["P-3", "P-4", "P-10", "P-11(combo)"],
        "_population": {"total": len(esl),
                        "mid": sum(1 for e in esl if e["src"] == "mid"),
                        "sing": sum(1 for e in esl if e["src"] == "sing")},
        "identities": esl,
    }
    json.dump(plan, open(os.path.join(OUTDIR, "esl_package_plan.json"), "w"),
              indent=1, ensure_ascii=False)

    # ---- histograms ----
    bucket_h = collections.Counter(e["bucket"] for e in esl)
    sig_h = collections.Counter(e["signal"] for e in esl)
    conf_h = collections.Counter(e["confidence"] for e in esl)
    band_h = collections.Counter(e["level"] for e in esl
                                 if e["bucket"].endswith("ESL")
                                 and "review" not in e["bucket"]
                                 and e["bucket"] in ("Beginning ESL", "Intermediate ESL",
                                                     "Advanced ESL"))
    surface = downstream_surface([e["id"] for e in esl])

    def samp(pred, n=12):
        return [f'{e["id"]}  ·  {e["title"]}' for e in esl if pred(e)][:n]

    R = []
    R.append("# ESL 3-comprehensive packaging — DRY-RUN plan\n")
    R.append(f"_Generated {DATE} · doctrine v0.13 (P-3/P-4) · **measurement only**, "
             "nothing applied._\n")
    R.append(f"**Population: {len(esl)} ESL identities** "
             f"({plan['_population']['mid']} multi-college M-IDs + "
             f"{plan['_population']['sing']} single-college unified courses; "
             "disciplines *English as a Second Language* ⋃ *…Noncredit 53412*, per "
             "P-3's one-family framing).\n")

    R.append("## Where the 2,364 land\n")
    R.append("| Bucket | Count |")
    R.append("|---|---:|")
    order = ["Beginning ESL", "Intermediate ESL", "Advanced ESL",
             "Transfer-level ESL (review)", "ESL Citizenship", "Vocational ESL (VESL)"]
    for b in order:
        R.append(f"| {b} | {bucket_h.get(b, 0)} |")
    R.append(f"| **Total** | **{sum(bucket_h.values())}** |\n")
    three = bucket_h["Beginning ESL"] + bucket_h["Intermediate ESL"] + bucket_h["Advanced ESL"]
    carve = len(esl) - three
    R.append(f"→ **{three}** identities fold into the **3 comprehensives**; "
             f"**{carve}** peel off into the 3 carve-out families.\n")

    R.append("## The 3 comprehensives — level breakdown\n")
    R.append("| Level | Count |")
    R.append("|---|---:|")
    for lv in ("Beginning", "Intermediate", "Advanced"):
        R.append(f"| {lv} ESL | {band_h.get(lv, 0)} |")
    R.append("")

    R.append("## How each level was decided (signal)\n")
    R.append("| Signal | Count | Meaning |")
    R.append("|---|---:|---|")
    sig_desc = {
        "word": "explicit level word in the title (high confidence)",
        "combo": "combination level → KINE combo rule (P-11)",
        "numeric": "numeric ladder mark → 1–2/3–4/5+ pinning (spot-check)",
        "default-beginning": "no level in title → Beginning under-claim (spot-check)",
        "carveout-citizenship": "→ ESL Citizenship family",
        "carveout-vesl": "→ Vocational ESL family",
        "carveout-transfer": "→ transfer-level REVIEW bucket",
    }
    for s, cnt in sig_h.most_common():
        R.append(f"| {s} | {cnt} | {sig_desc.get(s, '')} |")
    R.append("")

    R.append("## Confidence\n")
    R.append("| Confidence | Count |")
    R.append("|---|---:|")
    for c in ("high", "medium", "review"):
        R.append(f"| {c} | {conf_h.get(c, 0)} |")
    R.append(f"\n**{conf_h.get('medium',0)+conf_h.get('review',0)} rows** are "
             "medium/review — the numeric-ladder, default-Beginning, and "
             "transfer-review assignments Sam should spot-check.\n")

    R.append("## Carve-out samples\n")
    R.append("**ESL Citizenship** (" + str(bucket_h["ESL Citizenship"]) + "):")
    for s in samp(lambda e: e["bucket"] == "ESL Citizenship"):
        R.append(f"- {s}")
    R.append("\n**Vocational ESL / VESL** (" + str(bucket_h["Vocational ESL (VESL)"]) + "):")
    for s in samp(lambda e: e["bucket"] == "Vocational ESL (VESL)"):
        R.append(f"- {s}")
    R.append("\n**Transfer-level ESL — REVIEW** (" +
             str(bucket_h["Transfer-level ESL (review)"]) +
             " — no transferable flag in source; confirm each before it escapes the fold):")
    for s in samp(lambda e: e["bucket"] == "Transfer-level ESL (review)", 20):
        R.append(f"- {s}")
    R.append("")

    R.append("## Spot-check queue — default-Beginning (no level word, folded to Beginning)\n")
    for s in samp(lambda e: e["signal"] == "default-beginning", 15):
        R.append(f"- {s}")
    R.append("")
    R.append("## Spot-check queue — numeric-ladder assignments\n")
    for s in samp(lambda e: e["signal"] == "numeric", 15):
        R.append(f"- {s}")
    R.append("")

    R.append("## Apply surface (for the Sam-gated apply step — NOT run here)\n")
    R.append("- **Survivors to mint/choose:** 3 comprehensive courses "
             "(Beginning / Intermediate / Advanced ESL) + the carve-out families "
             "(Citizenship, VESL each collapse to their own leveled set; "
             "transfer-review stays per-identity pending Sam).")
    R.append(f"- **`merge_into` pointers to write:** {three} (the identities folding "
             "into the 3 comprehensives) — INSERT-only, `ON CONFLICT DO NOTHING`, "
             "cohort `package-esl-s117@bot` (Rule 9).")
    R.append(f"- **Downstream re-key surface (Rule 7):** "
             f"{surface.get('promotions_pointing_at_esl')} promotions and "
             f"{surface.get('crosswalk_rows_pointing_at_esl')} crosswalk rows "
             "point at an ESL identity that would fold — these re-key to the "
             "survivor when the apply lands.")
    R.append("- **Band note (P-3/D-3 carve-out):** the fold deliberately spans "
             "credit ⋃ noncredit (the ESL family is one for packaging); each "
             "member's credit_status is preserved in its merge_note.\n")

    R.append("## Method / doctrine trace\n")
    R.append("- **P-4** — ESL collapses to exactly 3 comprehensives; all strands + "
             "content-for-ESL courses fold in by level; 3 carve-outs escape.")
    R.append("- **Level:** title level word > combo (P-11 rule) > numeric ladder "
             "(1–2/3–4/5+) > **default Beginning** (CPL-safe under-claim).")
    R.append("- **Carve-out detection is title-PRIMARY** (the theme must be the "
             "subject, not incidental vocabulary — the KINE primary-frame logic). "
             "Transfer-level has NO hard flag in source → emitted as REVIEW.")
    R.append("- Reversible + receipted (D-6): this plan is the receipt; the apply "
             "cites P-3/P-4 per row.\n")

    open(os.path.join(OUTDIR, "esl_package_report.md"), "w").write("\n".join(R))

    # ---- console summary ----
    print(f"ESL packaging dry-run — {len(esl)} identities")
    print("buckets:", dict(bucket_h))
    print("3-comprehensive levels:", dict(band_h))
    print("signals:", dict(sig_h))
    print("confidence:", dict(conf_h))
    print("downstream surface:", surface)
    print("written:", OUTDIR)


if __name__ == "__main__":
    main()
