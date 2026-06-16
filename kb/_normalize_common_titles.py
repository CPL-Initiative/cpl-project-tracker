#!/usr/bin/env python3
"""Normalize minted/singleton ``common_title`` display text (Sam, 2026-06-12).

DRY-RUN by default (prints counts + samples, writes the receipt); ``--apply``
mutates kb/coci_minted_courses.json + kb/coci_minted_singletons.json.

Four transforms, in order, applied to every M-ID ``common_title``:

  1. Strip "(formerly …)" parentheticals — local college renumbering notes
     ("(formally …)" typos included), never part of the course's identity.
  1b. Strip noncredit-status parentheticals — "(NC)" / "(N/C)" / "(Noncredit)"
     / "(Non-Credit)". These are redundant with the credit_status field and
     are pure display noise; "we had a rule to eliminate extras like (NC) …
     but they're back" (Sam, 2026-06-16). Anchored to a lone parenthetical so
     "(NCAA)" and words like "INC" can never be caught; MEANINGFUL
     parentheticals ("(BIM)", "(QuickBooks)", "(Tableau)", "(EI)") are kept.
  2. Roman numerals -> digits for SEQUENCE romans (I, II, … IX):
       * II/III/VI/VII/VIII/IX convert anywhere (no English collision).
       * I converts only at title end / before a separator / in "I and II"
         constructions (protects the pronoun).
       * IV converts unless followed by a clinical word (IV Therapy/infusion
         — nursing titles use intravenous IV).
       * V converts only at end/separator and never after "Title" (Title V).
       * X never converts (Malcolm X, "Gen X", section letters).
  3. Title Case: first-letter capitalization per word, small words lowered
     (unless first/last or after a separator), hyphen/slash segments cased
     individually. In a MIXED-case title an ALL-CAPS token is presumed an
     acronym and preserved; in an ALL-CAPS (shouting) title case data is
     lost, so words re-case via ACRONYM_KEEP (EMT/CPR/HVAC/…) + MIXED_KEEP
     (QuickBooks/CompTIA/…). A small mojibake repair map runs first
     (double-encoded ’ etc. — "WomenÃ¢â‚¬â„¢s" -> "Women's").

DISPLAY-ONLY by design: course ids never change (no alias map needed), and
every identity-bearing comparator is invariant — the level-safe fam/_sug_sig
keys and the witness-kinship gate all lowercase, strip parentheticals, and
fold romans before comparing, and the member join is control-number exact
(post the 2026-05-22 re-mint). Curated ``unified_title`` values in
kb/coci_curation.json are Sam's own text — untouched.

Idempotent: a second run is a no-op. Receipt: kb/title_normalize_out/<date>/.
Run from repo root: python3 kb/_normalize_common_titles.py [--apply]
"""
import json
import os
import re
import sys
from collections import Counter
from datetime import datetime as _dt

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))


def kb(p):
    return os.path.join(SD, p)


# Mojibake repair (UTF-8 read as cp1252, once or twice) — only sequences that
# cannot occur in honest course titles. Upgraded 2026-06-12 (Sam's
# "IntroductionÃ‚Â To…" worklist find): fix_mojibake now leads with a bounded
# cp1252→UTF-8 decode loop (it only "succeeds" on character runs that map to
# VALID UTF-8 bytes, so honest text — incl. accented Spanish — can't be
# harmed), then falls back to this pair map for remnants the loop can't
# round-trip, then folds NBSPs to plain spaces. Mirror logic:
# excel_to_dashboard.py _fix_text_encoding() (raw member titles) — keep the
# two in sync.
MOJIBAKE = [
    ("Ã¢â‚¬â„¢", "'"), ("â€™", "'"), ("Ã¢â‚¬Ëœ", "'"), ("â€˜", "'"),
    ("Ã¢â‚¬â€œ", "–"), ("â€“", "–"), ("Ã¢â‚¬â€\x9d", "—"), ("â€”", "—"),
    ("Ã¢â‚¬Å“", '"'), ("â€œ", '"'), ("Ã¢â‚¬Â\x9d", '"'), ("â€\x9d", '"'),
    ("Ã©", "é"), ("Ã±", "ñ"), ("Ã¡", "á"), ("Ã³", "ó"), ("Ã­", "í"),
    ("Ã‚Â", " "), ("Ã‚â", " "), ("ã‚â", " "), ("Â ", " "), ("Â", ""),
]
MOJIBAKE_HINT = re.compile(r"[ÃÂ]|â€|ã‚â")

FORMERLY = re.compile(r"\s*\((?:formerly|formally)[^)]*\)", re.I)
# Noncredit-status noise — only a lone parenthetical whose ENTIRE contents are
# a noncredit marker (so "(NCAA)"/"(Inc.)" are safe); meaningful parentheticals
# pass through untouched.
CREDIT_NOISE = re.compile(r"\s*\(\s*(?:non[\s\-]?credit|n\s*/?\s*c)\s*\)", re.I)

ROMAN_VAL = {"I": "1", "II": "2", "III": "3", "IV": "4", "V": "5",
             "VI": "6", "VII": "7", "VIII": "8", "IX": "9"}
ALWAYS_ROMANS = {"II", "III", "VI", "VII", "VIII", "IX"}
SEP_AFTER = re.compile(r"^[\-–—:,;.)/&]")
CLINICAL_AFTER = re.compile(r"^(?:therap|infus|fluid|insertion|cert|med|push|pump|access|line)", re.I)

ACRONYM_KEEP = {
    "EMT", "EMS", "EMR", "CPR", "AED", "BLS", "ACLS", "PALS", "NRP", "WSI",
    "ESL", "VESL", "ESOL", "GED", "HSE", "ABE", "HISET", "TOEFL", "CASAS",
    "HVAC", "HVACR", "CNC", "CAD", "CADD", "CAM", "BIM", "GIS", "GPS",
    "MIG", "TIG", "GMAW", "SMAW", "GTAW", "FCAW", "AWS", "ASE", "OSHA",
    "MSHA", "EPA", "DOT", "FAA", "NFPA", "NIMS", "ICS", "SCBA", "ROP",
    "CTE", "STEM", "STEAM", "RN", "LVN", "CNA", "HHA", "RDA", "OTA", "PTA",
    "EKG", "ECG", "EEG", "ICU", "NICU", "NCLEX", "HIPAA", "ICD", "CPT",
    "CDL", "ASL", "SQL", "HTML", "CSS", "PHP", "API", "CCNA", "CCNP",
    "CISSP", "AC", "DC", "AC/DC", "PC", "AI", "IT", "CIS", "USA", "US",
    "UK", "TV", "AA", "BA", "MBA", "CPA", "IRS", "VA", "HR", "ROTC",
    "JROTC", "SAT", "PE", "MMA", "PGA", "NCAA", "CCCAA", "DSPS", "EOPS",
    "ABO", "NCO", "LGBTQ", "II", "III", "IV", "VI", "VII", "VIII", "IX",
}
MIXED_KEEP = {"quickbooks": "QuickBooks", "comptia": "CompTIA",
              "javascript": "JavaScript", "linkedin": "LinkedIn",
              "wordpress": "WordPress", "powerpoint": "PowerPoint",
              "autocad": "AutoCAD", "solidworks": "SolidWorks",
              "ios": "iOS", "ipad": "iPad", "iphone": "iPhone",
              "linux": "Linux", "excel": "Excel", "python": "Python",
              "photoshop": "Photoshop", "indesign": "InDesign",
              "illustrator": "Illustrator", "revit": "Revit",
              "mastercam": "Mastercam", "matlab": "MATLAB"}
SMALL = {"a", "an", "and", "as", "at", "but", "by", "for", "from", "in",
         "into", "nor", "of", "on", "or", "over", "the", "to", "via", "vs",
         "with"}
WORD_SPLIT = re.compile(r"(\s+)")
SUBSEG = re.compile(r"([/\-–—:])")


def fix_mojibake(t):
    if not MOJIBAKE_HINT.search(t):
        return t
    for _ in range(3):
        try:
            cand = t.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if cand == t:
            break
        t = cand
    for bad, good in MOJIBAKE:
        if bad in t:
            t = t.replace(bad, good)
    t = t.replace(" ", " ")
    return re.sub(r"\s{2,}", " ", t).strip()


def convert_romans(t):
    toks = t.split(" ")
    out = []
    for i, tok in enumerate(toks):
        core = tok.strip("()-–—:,;./&")
        up = core.upper()
        rest = toks[i + 1] if i + 1 < len(toks) else ""
        after_in_tok = tok[tok.find(core) + len(core):] if core else ""

        def nxt_sep():
            return (after_in_tok and SEP_AFTER.match(after_in_tok)) or \
                   (rest and SEP_AFTER.match(rest)) or not rest

        conv = None
        if up in ROMAN_VAL and core.isalpha() and (core.isupper() or t.islower()):
            if up in ALWAYS_ROMANS:
                conv = ROMAN_VAL[up]
            elif up == "I":
                nxt2 = toks[i + 2].strip("()-–—:,;./&").upper() if i + 2 < len(toks) else ""
                if nxt_sep() or (rest.lower() in ("and", "&") and nxt2 in ROMAN_VAL):
                    conv = "1"
            elif up == "IV":
                if not CLINICAL_AFTER.match(rest or ""):
                    conv = "4"
            elif up == "V":
                prev = toks[i - 1].strip("()-–—:,;./&").lower() if i else ""
                if nxt_sep() and prev != "title":
                    conv = "5"
        out.append(tok.replace(core, conv, 1) if conv else tok)
    return " ".join(out)


def _case_word(w, all_caps_title, first_or_last):
    if not w or not any(c.isalpha() for c in w):
        return w
    if re.match(r"^\d+[A-Za-z]{1,2}$", w):     # section letters: 1A, 2B, 101A
        return re.sub(r"[A-Za-z]+$", lambda m: m.group(0).upper(), w)
    low = w.lower()
    if low in MIXED_KEEP:
        return MIXED_KEEP[low]
    if all_caps_title:
        if w.upper() in ACRONYM_KEEP:
            return w.upper()
    else:
        if w.isupper():            # acronym in a mixed-case title — trust it
            return w
        if w[0].isupper() and any(c.isupper() for c in w[1:]):
            return w               # QuickBooks-style mixed case — trust it
    if low in SMALL and not first_or_last:
        return low
    return low[0].upper() + low[1:]


def title_case(t):
    letters = [c for c in t if c.isalpha()]
    all_caps = bool(letters) and all(c.isupper() for c in letters)
    parts = WORD_SPLIT.split(t)
    word_idx = [i for i, p in enumerate(parts) if p.strip()]
    out = []
    force_cap_next = True          # start of title
    for i, p in enumerate(parts):
        if not p.strip():
            out.append(p)
            continue
        first_or_last = force_cap_next or i == word_idx[-1]
        segs = SUBSEG.split(p)
        cased = []
        for j, s in enumerate(segs):
            if j % 2 == 1:
                cased.append(s)
                continue
            lead = re.match(r"^[(\"']*", s).group(0)
            trail = re.search(r"[)\"':,;.!?]*$", s).group(0)
            core = s[len(lead):len(s) - len(trail)] if trail else s[len(lead):]
            cased.append(lead + _case_word(core, all_caps, first_or_last or j > 0 and bool(segs[j - 1])) + trail)
        word = "".join(cased)
        out.append(word)
        force_cap_next = bool(re.search(r"[:–—]\s*$|^.*:$", word))
    return "".join(out)


def normalize(t):
    if not t:
        return t
    t0 = fix_mojibake(str(t))
    t0 = FORMERLY.sub("", t0)
    t0 = CREDIT_NOISE.sub("", t0)
    t0 = re.sub(r"\s{2,}", " ", t0).strip()
    t0 = convert_romans(t0)
    return title_case(t0)


def main():
    stats = Counter()
    samples = []
    docs = []
    for fname in ("coci_minted_courses.json", "coci_minted_singletons.json"):
        doc = json.load(open(kb(fname)))
        for cid, rec in doc["courses"].items():
            old = rec.get("common_title")
            if not old:
                continue
            new = normalize(old)
            if new != old:
                stats[fname] += 1
                if FORMERLY.search(str(old)):
                    stats["formerly_stripped"] += 1
                if CREDIT_NOISE.search(str(old)):
                    stats["credit_noise_stripped"] += 1
                if len(samples) < 60:
                    samples.append((cid, old, new))
                if APPLY:
                    rec["common_title"] = new
        docs.append((fname, doc))

    print(f"Title normalization — {'APPLY' if APPLY else 'DRY-RUN'} — {_dt.now():%Y-%m-%d %H:%M}")
    for k, v in sorted(stats.items()):
        print(f"   {v:6}  {k}")
    print("  samples:")
    for cid, old, new in samples[:40]:
        print(f"     {cid:13} {old!r:60} -> {new!r}")

    outdir = kb(os.path.join("title_normalize_out", _dt.now().strftime("%Y-%m-%d")))
    os.makedirs(outdir, exist_ok=True)
    json.dump({"generated_at": _dt.now().isoformat(),
               "status": "APPLY" if APPLY else "DRY-RUN",
               "counts": dict(stats),
               "samples": [{"id": c, "old": o, "new": n} for c, o, n in samples]},
              open(os.path.join(outdir, "receipt.json"), "w"), ensure_ascii=False, indent=1)
    print(f"  receipt -> {os.path.relpath(outdir, SD)}/receipt.json")

    if not APPLY:
        print("\nDRY-RUN only — re-run with --apply to write.")
        return
    for fname, doc in docs:
        json.dump(doc, open(kb(fname), "w"), ensure_ascii=False, indent=2)
    print("  ✓ APPLIED.")


if __name__ == "__main__":
    main()
