#!/usr/bin/env python3
"""Build the ESS 25-82 outcome-2 rollup sidecar for the Implementation Funding tab.

ESS 25-82 (Dec 9, 2025) tied the $50,000 CPL implementation grants to three
systemwide priority outcomes. Two are already measurable from the daily funding
performance artifact (`cpl_funding_performance.js`):

  * Outcome 1 (JSTs)            -> `vet_star` (>= 75% of enrolled veterans have a
                                   JST uploaded in MAP)
  * Outcome 3 (Proactive CPL)   -> `pe` (students identified as CPL-eligible) and
                                   `p2`/`p3` (transcribed CPL)

Outcome 2 -- "Implementing Statewide Credit Recommendations" (adopt or adapt the
ASCCC Pathways to Credit recommendations posted on MAP) -- is NOT in the MAP
student feed. It lives in the Credential Reference (CER) rollup: a college has
adopted a statewide recommendation when it carries at least one local
articulation against a credential flagged `statewide` in
`credential_reference_data.js`.

That file is ~2.9 MB, far too heavy to load in the funding tab for one boolean
per college, so this script rolls it up into a compact sidecar
(`cpl_funding_ess.js`, a few KB) keyed by the FUNDING roster's college names --
the same short-name space `_build_funding_performance.py` resolves into.

Emits:
    window.CPL_FUNDING_ESS = {
      "as_of": "<CER generated_at date>",
      "n_statewide_credentials": <int>,   # statewide-flagged credentials in the CER
      "n_adopters": <int>,                # colleges with >= 1 statewide articulation
      "statewide_adopters": { "<funding college name>": true, ... },
      "unmatched": { "<CER college name>": <line count> }   # name-join visibility
    }

PII: institutional aggregates only -- credential titles and college names. No
person-level data enters this artifact (the CER rollup itself is aggregate).

Usage:  python3 funding/_build_funding_ess.py
Exits 0 without writing when the CER artifact is absent (keeps any prior
sidecar), so a partial daily run never blanks the outcome column.
"""

import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CER = os.path.join(ROOT, "credential_reference_data.js")
SHORTS = os.path.join(ROOT, "kb", "college_short_names.json")
FUNDING = os.path.join(ROOT, "cpl_funding_data.js")
OUT = os.path.join(ROOT, "cpl_funding_ess.js")


def _norm(name):
    """Fold a college name for joining: strip accents/punctuation, drop the
    generic institution suffixes, collapse whitespace, uppercase."""
    s = unicodedata.normalize("NFKD", str(name or ""))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("&", " and ")
    s = re.sub(r"[^A-Za-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # Drop trailing institution words (College / Community College / District…).
    s = re.sub(
        r"\b(community\s+college\s+district|community\s+college|college|district|campus)\b",
        " ",
        s,
        flags=re.I,
    )
    s = re.sub(r"\b(the|of|at)\b", " ", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip().upper()


def _extract_window_object(path, var_names):
    """Pull the JSON object assigned to `window.<VAR> = {...};` out of a JS artifact."""
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()
    for var in var_names:
        m = re.search(r"window\.%s\s*=\s*" % re.escape(var), src)
        if not m:
            continue
        start = src.index("{", m.end())
        depth, in_str, esc, quote = 0, False, False, ""
        for i in range(start, len(src)):
            ch = src[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == quote:
                    in_str = False
                continue
            if ch in '"\'':
                in_str, quote = True, ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(src[start : i + 1])
    return None


def main():
    if not os.path.exists(CER):
        print("[ess] credential_reference_data.js absent — keeping any prior sidecar")
        return 0
    cer = _extract_window_object(
        CER, ["CPL_CREDENTIAL_REFERENCE", "CPL_CRED_REF", "CPL_CREDENTIALS"]
    )
    if not cer or not isinstance(cer.get("unified_titles"), list):
        print("[ess] CER artifact has no unified_titles — nothing to roll up")
        return 0

    # Funding roster (the join TARGET) + the short-name alias table.
    funding = _extract_window_object(FUNDING, ["CPL_FUNDING"]) or {}
    roster = [c.get("college") for c in funding.get("colleges", []) if c.get("college")]
    by_norm = {_norm(n): n for n in roster}
    if os.path.exists(SHORTS):
        try:
            with open(SHORTS, "r", encoding="utf-8") as fh:
                shorts = json.load(fh)
            records = (
                shorts
                if isinstance(shorts, list)
                else (shorts.get("colleges") or shorts.get("records") or [])
            )
            for rec in records:
                short = rec.get("short")
                target = by_norm.get(_norm(short))
                if not target:
                    continue
                for alias in [rec.get("canonical")] + list(rec.get("aliases") or []):
                    if alias:
                        by_norm.setdefault(_norm(alias), target)
        except Exception as exc:  # pragma: no cover - defensive
            print("[ess] short-name table unreadable (%s) — direct join only" % exc)

    adopters, unmatched = {}, {}
    n_statewide = 0
    for row in cer["unified_titles"]:
        if not row.get("statewide"):
            continue
        n_statewide += 1
        for art in row.get("articulations") or []:
            for local in art.get("local") or []:
                for college in local.get("colleges") or []:
                    hit = by_norm.get(_norm(college))
                    if hit:
                        adopters[hit] = True
                    else:
                        unmatched[college] = unmatched.get(college, 0) + 1

    payload = {
        "as_of": str(cer.get("_generated_at") or "")[:10],
        "source": "credential_reference_data.js — credentials flagged statewide "
        "(ASCCC Pathways to Credit) with >= 1 local articulation",
        "n_statewide_credentials": n_statewide,
        "n_adopters": len(adopters),
        "statewide_adopters": dict(sorted(adopters.items())),
        "unmatched": dict(sorted(unmatched.items())),
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(
            "// ESS 25-82 outcome-2 rollup — colleges that have ADOPTED at least one\n"
            "// statewide credit recommendation (>= 1 local articulation on a\n"
            "// statewide-flagged CER credential). Generated by\n"
            "// funding/_build_funding_ess.py in the daily workflow; do not hand-edit.\n"
            "// Institutional aggregates only — no person-level data.\n"
        )
        fh.write("window.CPL_FUNDING_ESS = ")
        json.dump(payload, fh, indent=1, ensure_ascii=False)
        fh.write(";\n")
    print(
        "[ess] %d statewide credentials → %d adopting colleges (%d unmatched CER names)"
        % (n_statewide, len(adopters), len(unmatched))
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
