"""Probe a few catalog pages in the runner: what the reader sees on each tab.

Long Beach City's trial read (run 38139252216, S362) chose textContent for all
12 programs although #1980 reads a hidden Requirements tab: PAGE_JS's
tabPanels found nothing the reader could use. The sandbox cannot reach the
college's catalog, so this loads the pages through the census's Reader
(robots, the delay, the user agent that names the CPL Initiative) and files,
for each page, its HTML and an account of every tab-like link and the element
it points at. No model calls; anon reads none.

    python3 kb/_program_page_probe.py --out kb/program_requirements_college/long_beach_city/probe
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _program_requirements_pilot as P  # noqa: E402

PAGES = {
    "02616": ("https://lbcc-public.courseleaf.com/degrees-certificates/horticulture/horticulture-as/",
              "FLO286A FLO286B HORT11A HORT11B HORT11C HORT11D HORT15A HORT15B HORT19 HORT202 HORT21 "
              "HORT223 HORT227 HORT26A HORT26B HORT30 HORT430 MKTG47"),
    "02631": ("https://lbcc-public.courseleaf.com/degrees-certificates/journalism/journalism-aa/", ""),
    "02632": ("https://lbcc-public.courseleaf.com/degrees-certificates/television-producer/television-producer-aa/", ""),
    "02636": ("https://lbcc-public.courseleaf.com/degrees-certificates/kinesiology/kinesiology-aa/", ""),
}

TABS_JS = """() => {
  const MENU = 'nav, header, footer, [role=navigation]';
  const desc = e => e ? (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')
                         + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '')) : null;
  const subj = t => new Set(Array.from((t || '').matchAll(/\\b([A-Z][A-Z&]{1,7})[ \\u00a0]?\\d{1,4}[A-Z]?\\b/g)).map(m => m[1])).size;
  const tabs = Array.from(document.querySelectorAll(
      '[role=tab], [aria-controls], [role=tablist] a, ul.tabs a, #tabs a, a[href^="#"]'))
    .slice(0, 60).map(a => {
      const id = (a.getAttribute('aria-controls') || (a.getAttribute('href') || '').replace(/^#/, '')).trim();
      const el = id && !/[\\/:]/.test(id) ? document.getElementById(id) : null;
      const cs = el ? getComputedStyle(el) : null;
      return {label: (a.innerText || a.textContent || '').trim().slice(0, 60), tag: a.tagName,
              href: a.getAttribute('href'), role: a.getAttribute('role'),
              aria_controls: a.getAttribute('aria-controls'), onclick: (a.getAttribute('onclick') || '').slice(0, 80),
              in_menu: desc(a.closest(MENU)), in_tablist: desc(a.closest('[role=tablist]')),
              parents: [a.parentElement, a.parentElement && a.parentElement.parentElement,
                        a.parentElement && a.parentElement.parentElement && a.parentElement.parentElement.parentElement].map(desc),
              target: el ? {el: desc(el), rects: el.getClientRects().length, display: cs.display,
                            visibility: cs.visibility, aria_hidden: el.getAttribute('aria-hidden'),
                            hidden_attr: el.hasAttribute('hidden'), in_menu: desc(el.closest(MENU)),
                            text_chars: (el.textContent || '').trim().length,
                            inner_chars: (el.innerText || '').trim().length,
                            subjects: subj(el.textContent),
                            head: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 200)} : null};
    });
  // Every large element the reader cannot see, outermost first: where the
  // requirements and the course index actually sit.
  const hidden = Array.from(document.querySelectorAll('body *'))
    .filter(e => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg)$/i.test(e.tagName))
    .filter(e => !e.getClientRects().length && (e.textContent || '').trim().length > 400)
    .filter((e, i, all) => !all.some(o => o !== e && o.contains(e)))
    .slice(0, 30)
    .map(e => ({el: desc(e), parents: [e.parentElement, e.parentElement && e.parentElement.parentElement].map(desc),
                role: e.getAttribute('role'), labelledby: e.getAttribute('aria-labelledby'),
                display: getComputedStyle(e).display, visibility: getComputedStyle(e).visibility,
                in_menu: desc(e.closest(MENU)), text_chars: (e.textContent || '').trim().length,
                subjects: subj(e.textContent),
                head: (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 200)}));
  return {tabs, hidden, inner_chars: (document.body.innerText || '').length,
          content_chars: (document.body.textContent || '').length};
}"""


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    pw, browser, reader = P.open_reader(int(os.environ.get("CENSUS_DELAY_MS", "4000")))
    report = {}
    try:
        for cn, (url, codes) in PAGES.items():
            got = P.load(reader, url, {}, False)
            entry = {"url": url, "status": got.get("status"), "access": got.get("access"),
                     "final_url": got.get("final_url"), "error": got.get("error")}
            if got.get("access") == "ok":
                with open(os.path.join(a.out, cn + ".html"), "w", encoding="utf-8") as f:
                    f.write(reader.page.content())
                entry["probe"] = reader.page.evaluate(TABS_JS)
                entry["tabPanels"] = [{"label": t.get("label"), "id": t.get("id"),
                                       "chars": len(t.get("text") or "")} for t in got.get("tabPanels") or []]
                entry["hidden_tabs_chars"] = len(P.hidden_tabs_text(got))
                courses = [{"code": c} for c in codes.split()]
                if courses:
                    fb = P.find_codes(got.get("body") or "", courses)
                    fc = P.find_codes(got.get("content") or "", courses)
                    text, found, field = P.best_text(got, fb, fc, courses)
                    entry["best_text"] = {"field": field, "innerText": round(P.coverage(fb, courses), 3),
                                          "textContent": round(P.coverage(fc, courses), 3),
                                          "chosen": round(P.coverage(found, courses), 3)}
            report[cn] = entry
            print(cn, entry.get("status"), entry.get("access"), len((entry.get("probe") or {}).get("tabs") or []),
                  "tabs", entry.get("tabPanels"), flush=True)
    finally:
        browser.close()
        pw.stop()
    with open(os.path.join(a.out, "probe.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
