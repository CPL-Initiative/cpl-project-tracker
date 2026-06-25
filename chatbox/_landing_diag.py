#!/usr/bin/env python3
"""One-shot diagnostic: is the embedded mapfyCollegeUrls blob the same as the
links the page actually serves? Sam reported real codes (Allan Hancock=/allan,
Los Medanos=/losmedanos) that differ from the blob (/test, /LOSC), and the blob's
`updated` field is 2025-08-18 — so the blob may be stale. This dumps the raw
page so we can see the truth, then is deleted. Runs on a runner (egress + WAF)."""
import importlib.util
import json
import re
import os

_spec = importlib.util.spec_from_file_location(
    "scr", os.path.join(os.path.dirname(__file__), "scrape_landing_pages.py"))
scr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(scr)

OUT = os.path.join(os.path.dirname(__file__), "_landing_diag.json")


def main():
    html = scr.fetch(scr.DEFAULT_URL)
    out = {"page_chars": len(html)}

    blob = scr.extract_mapfy(html)
    if blob:
        out["blob_updated"] = blob.get("updated")
        out["blob_count"] = len(blob.get("colleges", []))
        out["blob_map"] = {c.get("College"): scr.code_of(c.get("CollegeLandingURL", ""))
                           for c in blob.get("colleges", [])}

    # Every distinct cpl-student-portal/<code> in the RAW html (not deduped by
    # the blob) — the full code universe the page references.
    codes = sorted({m.group(1) for m in re.finditer(
        r"cpl-student-portal/([A-Za-z0-9._%\-]+)", html, re.I)})
    out["all_portal_codes"] = codes
    out["all_portal_code_count"] = len(codes)

    # Are there OTHER mapfy* / college-url JS structures besides the one blob?
    out["mapfy_assignments"] = [WS(m.group(0)) for m in re.finditer(
        r"\bmapfy[A-Za-z]*\s*=", html)][:10]

    # Does the page contain Sam's real codes anywhere (a fresher source)?
    out["needle_hits"] = {}
    for needle in ("allan", "losmedanos", "mendocino", "LOSC", "MENC",
                   "/test", "CollegeLandingURL", "landingURL", "landing_url"):
        idx = html.lower().find(needle.lower())
        out["needle_hits"][needle] = {
            "count": html.lower().count(needle.lower()),
            "context": WS(html[max(0, idx - 120): idx + 120]) if idx >= 0 else None,
        }

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[diag] wrote {OUT}: {out.get('blob_updated')=} "
          f"codes={out['all_portal_code_count']}")


def WS(s):
    return re.sub(r"\s+", " ", s).strip()


if __name__ == "__main__":
    main()
