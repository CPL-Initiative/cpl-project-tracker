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

    # Dump full CARD structure around the real link buttons so we can extract
    # the college name that pairs with each cpldashboardcccco/<code> button.
    out["linkbtn_cards"] = [WS(html[max(0, m.start() - 900): m.end() + 80])
                            for m in list(re.finditer(
                                r'<a[^>]*class="[^"]*mapfy-linkbtn[^"]*"[^>]*>',
                                html, re.I))[:3]]
    out["linkbtn_count"] = len(re.findall(r"mapfy-linkbtn", html))

    # The buttons are JS-built from a per-college data source. Dump the raw text
    # right after each mapfy* assignment so we can see which holds the CURRENT
    # cpldashboardcccco URLs + college names.
    out["mapfy_var_samples"] = {}
    for var in ("mapfyRDC", "mapfyStats", "mapfyCollegeUrls"):
        m = re.search(re.escape(var) + r"\s*=\s*", html)
        if m:
            out["mapfy_var_samples"][var] = WS(html[m.end(): m.end() + 1400])

    # Does the page contain Sam's real codes anywhere (a fresher source)?
    out["needle_hits"] = {}
    for needle in ("allan", "losmedanos", "mendocino", "LOSC", "MENC",
                   "/test", "CollegeLandingURL", "landingURL", "landing_url"):
        idx = html.lower().find(needle.lower())
        out["needle_hits"][needle] = {
            "count": html.lower().count(needle.lower()),
            "context": WS(html[max(0, idx - 120): idx + 120]) if idx >= 0 else None,
        }

    # The url-building JS: dump a window before the first linkbtn template.
    tm = re.search(r'<a[^>]*class="[^"]*mapfy-linkbtn', html, re.I)
    if tm:
        out["url_build_js"] = WS(html[max(0, tm.start() - 2600): tm.start()])

    # RENDER with Chromium so the JS builds the buttons, then read each
    # button's href (cpldashboardcccco/<code>) + aria-label (the college name).
    out["rendered"] = render_buttons(scr.DEFAULT_URL)

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[diag] wrote {OUT}: {out.get('blob_updated')=} "
          f"codes={out['all_portal_code_count']}")


def render_buttons(url):
    """Render with Chromium and read every mapfy-linkbtn (href + aria-label).
    Returns a dict so failures are visible, not silent."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"error": "playwright not installed"}
    EXTRACT = """() => Array.from(
        document.querySelectorAll('a.mapfy-linkbtn[href]')).map(a => ({
        url: a.href,
        label: a.getAttribute('aria-label') || a.getAttribute('title') || ''
    }))"""
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=["--no-sandbox",
                                        "--disable-blink-features=AutomationControlled"])
            pg = b.new_context(user_agent=scr.UA, locale="en-US").new_page()
            pg.goto(url, wait_until="domcontentloaded", timeout=60000)
            try:
                pg.wait_for_function(
                    "() => document.querySelectorAll('a.mapfy-linkbtn[href]')"
                    ".length >= 30", timeout=60000)
            except Exception:
                pass
            pg.wait_for_timeout(4000)
            items = pg.evaluate(EXTRACT)
            cnt = pg.evaluate("() => document.querySelectorAll('a.mapfy-linkbtn').length")
            b.close()
            return {"count_all": cnt, "count_with_href": len(items),
                    "buttons": items}
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"}


def WS(s):
    return re.sub(r"\s+", " ", s).strip()


if __name__ == "__main__":
    main()
