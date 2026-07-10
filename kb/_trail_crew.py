#!/usr/bin/env python3
"""TRAIL CREW 🥾 — the CER canon audit, METHOD half (S110; named by Sam's ask
for "a happy name so it sounds like a hopeful process"). The crew walks the
established trails (the canon), clears deadfall (anomalies), and repaints the
trail markers (titles + issuing agencies) so every hiker — and every future
MAP enterer prompted from this canon — finds the way.

Origin (S110, Sam: "a general audit procedure I
could fire for CER that would look for anomalies and exhibits or issuing
agencies that don't seem to follow established patterns or look like
candidates for consolidation or separating out… a mix of method and magic").

Deterministic scanner over the canonical credential layer (the fresh bake ⊕
an optional live kb_curation overlay dump). Emits tagged FINDINGS — always
candidates for review, never auto-applied. The MAGIC half (an LLM
adjudication pass encoding the same canon) consumes findings.json and writes
adjudicated.json beside it.

THE CANON (Sam's doctrine, 2026-07-09/10 — also the future MAP entry-prompt
vocabulary: "the goal is to have the user prompted to correctly enter all
this stuff in before it gets to the CER process"):
  C1. Level indicators in canonical titles are NUMERIC (1, 2, 3…), never
      roman (I, II, III) — except alphanumeric compounds (1A, 2B) which stay,
      and non-level romans ("IV Therapy" = intravenous) which stay roman.
  C2. Same content differing only in level NOTATION is ONE credential
      ("Welding II SMAW" vs "Welding 2 SMAW" → merge). Different level
      VALUES are distinct credentials.
  C3. A bare title coexisting with leveled siblings is suspect — the level
      may have been stripped when it should have stayed.
  C4. One canonical string per issuing agency (long form, short form in
      parens: "Carpenters Training Committee for Northern California
      (CTCNC)").
  C5. Canonical titles carry no course codes, no doubled spaces, no stray
      separators, and are not ALL-CAPS.

Run from repo root:
  python3 kb/_trail_crew.py [--overlay <overlay_dump.json>] [--out kb/trail_crew_out/<date>]
"""
import argparse
import csv
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
         "VIII": 8, "IX": 9, "X": 10}
ROMAN_TOKEN = re.compile(r"(?<![A-Za-z0-9])(I{1,3}|IV|V|VI{1,3}|IX|X|V I)(?![A-Za-z0-9])")
NUM_LEVEL = re.compile(r"(?<![A-Za-z0-9.])([1-9]|10)(?![0-9./])(?![A-Za-z])")
COURSE_CODE = re.compile(r"(?<![A-Za-z])[A-Z]{2,5}[- ]\d{2,4}[A-Za-z]{0,2}(?![A-Za-z0-9])")
# Non-level roman contexts — the token is part of the SUBJECT, not a level.
ROMAN_FALSE_FRIENDS = re.compile(
    r"\b(IV\s+(therapy|infusion|insertion|certification)|class\s+[IVX]+\b)", re.I)


def norm_ws(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return norm_ws(s)


def roman_levels_in(title):
    """Standalone roman tokens in a title, with their numeric values."""
    out = []
    for m in ROMAN_TOKEN.finditer(title):
        tok = m.group(1).replace(" ", "")
        if tok in ROMAN:
            out.append((tok, ROMAN[tok], m.start()))
    return out


def level_normalize(title):
    """Title with every standalone roman level token converted to numeric —
    the C2 comparison key. Alphanumeric compounds (1A) are untouched because
    ROMAN_TOKEN requires standalone tokens."""
    def sub(m):
        tok = m.group(1).replace(" ", "")
        return str(ROMAN[tok]) if tok in ROMAN else m.group(1)
    return ROMAN_TOKEN.sub(sub, title)


def strip_level(title):
    """Base title with a TRAILING level token removed (numeric or roman) —
    the C3 family key. Only trailing: mid-title levels ("Welding 2 SMAW")
    are handled by level_normalize, not here."""
    s = norm_ws(title)
    s2 = re.sub(r"[\s\-–—:,]*(?:(?:I{1,3}|IV|V|VI{1,3}|IX|X)|(?:[1-9]|10))\s*$", "", s)
    return norm_ws(s2) if s2 and s2 != s else None


def load_bake(path="credential_reference_data.js"):
    src = open(path, encoding="utf-8").read()
    payload = src[src.find("{"):src.rstrip().rstrip(";").rfind("}") + 1]
    return json.loads(payload)


def apply_overlay(rows, overlay_path):
    """Fold a live kb_curation dump (course_id/field/value) onto the baked
    rows so the audit sees CURRENT display titles + issuers."""
    if not overlay_path:
        return {}
    prefix = "_CREDENTIAL_REVIEW::"
    ov = defaultdict(dict)
    for r in json.load(open(overlay_path)):
        key = (r.get("course_id") or "")
        if not key.startswith(prefix):
            continue
        ov[key[len(prefix):]][r.get("field")] = r.get("value") or ""
    n_t = n_i = 0
    for row in rows:
        o = ov.get(row["ut"])
        if not o:
            continue
        if o.get("unified_title_override"):
            row["display"] = o["unified_title_override"]; n_t += 1
        if "issuing_agency_override" in o:
            row["issuer"] = o["issuing_agency_override"] or None; n_i += 1
    return {"title_overrides": n_t, "issuer_overrides": n_i}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--overlay", default=None)
    ap.add_argument("--out", default="kb/trail_crew_out/" + date.today().isoformat())
    args = ap.parse_args()

    bake = load_bake()
    rows = []
    for b in bake["unified_titles"]:
        rows.append({
            "ut": b.get("ut") or "",
            "display": b.get("ut") or "",
            "issuer": b.get("issuer") or None,
            "trainer": b.get("trainer") or None,
            "statewide": bool(b.get("statewide")),
            "raw_variants": [v.get("r", "") for v in (b.get("raw_variants") or [])],
            "initiated": bool(b.get("curated_at")),
        })
    ov_stats = apply_overlay(rows, args.overlay)

    findings = []
    fid = [0]

    def add(rule, row, evidence, suggestion=None, needs_judgment=False, group=None):
        fid[0] += 1
        findings.append({
            "id": "F%04d" % fid[0], "rule": rule, "key": row["ut"],
            "title": row["display"], "issuer": row["issuer"],
            "evidence": evidence, "suggestion": suggestion,
            "needs_judgment": needs_judgment,
            "group": group,
            "initiated": row["initiated"],
        })

    # ── R1 roman_level (C1) ──────────────────────────────────────────────
    for row in rows:
        t = row["display"]
        toks = roman_levels_in(t)
        if not toks:
            continue
        friendly = bool(ROMAN_FALSE_FRIENDS.search(t))
        conv = level_normalize(t)
        add("roman_level", row,
            "roman token(s) " + ", ".join(x[0] for x in toks)
            + (" — matches a known non-level context (verify)" if friendly else ""),
            suggestion=(None if friendly else conv),
            needs_judgment=friendly or any(v > 4 for _, v, _ in toks))

    # ── R3 level_notation_twins + R5 norm_dup_titles (C2) ───────────────
    by_norm = defaultdict(list)
    for row in rows:
        by_norm[fold(level_normalize(row["display"]))].append(row)
    gno = 0
    for key, grp in by_norm.items():
        if len(grp) < 2 or not key:
            continue
        gno += 1
        titles = sorted({r["display"] for r in grp})
        rule = ("level_notation_twins"
                if len({level_normalize(r["display"]) != r["display"] for r in grp}) > 1
                or any(level_normalize(r["display"]) != r["display"] for r in grp)
                else "norm_dup_titles")
        for row in grp:
            add(rule, row,
                "same normalized title as: "
                + " | ".join(t for t in titles if t != row["display"]),
                suggestion="merge candidates (one credential per C2)"
                if rule == "level_notation_twins" else
                "duplicate canonical keys after normalization — merge or differentiate",
                needs_judgment=True, group="G%03d" % gno)

    # ── R4 bare_vs_leveled (C3) ──────────────────────────────────────────
    base_of = {}
    bases = defaultdict(lambda: {"leveled": [], "bare": []})
    for row in rows:
        t = row["display"]
        base = strip_level(level_normalize(t))
        if base:
            bases[fold(base)]["leveled"].append(row)
            base_of[row["ut"]] = fold(base)
    for row in rows:
        f = fold(level_normalize(row["display"]))
        if f in bases and not base_of.get(row["ut"]) == f:
            grp = bases[f]["leveled"]
            if grp:
                add("bare_vs_leveled", row,
                    "bare title coexists with leveled sibling(s): "
                    + " | ".join(sorted({r["display"] for r in grp})[:4]),
                    suggestion="verify: should this carry a level (was one stripped)?",
                    needs_judgment=True)

    # ── R6 issuer_variant_clusters (C4) ──────────────────────────────────
    issuers = defaultdict(set)
    for row in rows:
        if row["issuer"]:
            issuers[fold(re.sub(r"\([^)]*\)", "", row["issuer"]))].add(row["issuer"])
    # acronym containment: "CTCNC" ⊂ "…Northern California (CTCNC)"
    all_iss = sorted({row["issuer"] for row in rows if row["issuer"]})
    acr = defaultdict(set)
    for s in all_iss:
        m = re.search(r"\(([A-Z][A-Z&]{1,9})\)", s)
        if m:
            acr[m.group(1)].add(s)
        elif re.fullmatch(r"[A-Z][A-Z&]{1,9}", s.strip()):
            acr[s.strip()].add(s)
    clusters = []
    seen_cluster = set()
    for k, variants in issuers.items():
        if len(variants) > 1:
            clusters.append(sorted(variants))
    for k, variants in acr.items():
        if len(variants) > 1:
            clusters.append(sorted(variants))
    for cl in clusters:
        sig = "||".join(cl)
        if sig in seen_cluster:
            continue
        seen_cluster.add(sig)
        gno += 1
        counts = {v: sum(1 for r in rows if r["issuer"] == v) for v in cl}
        rep = {"ut": "(issuer cluster)", "display": "", "issuer": None, "initiated": False}
        findings.append({
            "id": "F%04d" % (fid[0] + 1), "rule": "issuer_variant_cluster",
            "key": None, "title": None, "issuer": None,
            "evidence": " | ".join("%s (%d rows)" % (v, counts[v]) for v in cl),
            "suggestion": "consolidate to ONE canonical issuer string (C4: long form + short in parens)",
            "needs_judgment": True, "group": "G%03d" % gno, "initiated": False,
        })
        fid[0] += 1

    # ── R7 issuer_family_mixed within a C2/C3 family ─────────────────────
    fam = defaultdict(set)
    for row in rows:
        base = strip_level(level_normalize(row["display"]))
        if base and row["issuer"]:
            fam[fold(base)].add(row["issuer"])
    for row in rows:
        base = strip_level(level_normalize(row["display"]))
        if base and len(fam[fold(base)]) > 1 and row["issuer"]:
            add("issuer_family_mixed", row,
                "level family '" + base + "' spans issuers: "
                + " | ".join(sorted(fam[fold(base)])),
                suggestion="verify: same program family should share one issuer "
                           "(or these are genuinely different credentials)",
                needs_judgment=True)

    # ── R8 style_nits (C5) ───────────────────────────────────────────────
    for row in rows:
        t = row["display"]
        nits = []
        if "  " in t: nits.append("doubled space")
        if t != t.strip(): nits.append("leading/trailing whitespace")
        if re.search(r"[\s\-–—:;,/]$", t): nits.append("trailing separator")
        letters = re.sub(r"[^A-Za-z]", "", t)
        if len(letters) >= 6 and letters.isupper(): nits.append("ALL-CAPS title")
        if COURSE_CODE.search(t): nits.append("embedded course-code token "
            + COURSE_CODE.search(t).group(0))
        if nits:
            add("style_nits", row, "; ".join(nits),
                suggestion="normalize per C5", needs_judgment=False)

    os.makedirs(args.out, exist_ok=True)
    meta = {
        "_generated_at": date.today().isoformat(),
        "_generated_by": "kb/_trail_crew.py (Trail Crew — the METHOD half)",
        "_bake": bake.get("_generated_at"),
        "_overlay": ov_stats,
        "rows_scanned": len(rows),
        "by_rule": {},
    }
    for f in findings:
        meta["by_rule"][f["rule"]] = meta["by_rule"].get(f["rule"], 0) + 1
    doc = {"_meta": meta, "findings": findings}
    json.dump(doc, open(os.path.join(args.out, "findings.json"), "w"),
              indent=1, ensure_ascii=False)
    with open(os.path.join(args.out, "findings.csv"), "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "rule", "group", "key", "title", "issuer",
                    "evidence", "suggestion", "needs_judgment", "initiated"])
        for f in findings:
            w.writerow([f["id"], f["rule"], f.get("group") or "", f["key"],
                        f["title"], f["issuer"], f["evidence"],
                        f["suggestion"], f["needs_judgment"], f["initiated"]])
    print("rows scanned:", len(rows), "| overlay:", ov_stats)
    for rule, n in sorted(meta["by_rule"].items(), key=lambda kv: -kv[1]):
        print("  %-26s %d" % (rule, n))
    print("findings:", len(findings), "->", args.out)


if __name__ == "__main__":
    main()
