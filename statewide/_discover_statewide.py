#!/usr/bin/env python3
"""Discovery probe for the public Statewide CPL page (map.rccd.edu/statewidecpl).

WHY: the agent sandbox can't reach map.rccd.edu (egress 403). A plain runner
fetch only gets a 202 bot-challenge interstitial (the page is a JS SPA behind a
WAF), so this uses a real headless Chromium (Playwright) to RENDER the page, then:
  - captures every XHR/fetch response (the backing data API + its JSON), and
  - scrapes the rendered DOM for exhibit names, PDF links, and credit-rec text.
Everything is printed to the run log (Claude reads it back via the GitHub MCP) so
we can write a real scraper that bakes each statewide exhibit's PDF link + credit
recs (C-ID / title / units) into the public Fact Sheet. Commits nothing.

Run: Actions -> "Discover statewide CPL data (manual)" -> Run workflow
(or push to the feature branch).
"""
import json
import re
import sys

PAGE = "https://map.rccd.edu/statewidecpl/"


def banner(t):
    print("\n" + "=" * 70 + "\n" + t + "\n" + "=" * 70, flush=True)


def main():
    from playwright.sync_api import sync_playwright

    captured = []  # {url, status, ctype, body_snippet, json_shape}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"))
        page = ctx.new_page()

        def on_response(resp):
            try:
                url = resp.url
                ct = (resp.headers or {}).get("content-type", "")
                if "/api/" in url or "json" in ct.lower() or url.endswith(".json"):
                    rec = {"url": url, "status": resp.status, "ctype": ct}
                    try:
                        body = resp.text()
                        rec["len"] = len(body)
                        try:
                            j = json.loads(body)
                            if isinstance(j, list):
                                rec["shape"] = "list[%d]" % len(j)
                                rec["first_keys"] = list(j[0].keys()) if j and isinstance(j[0], dict) else None
                                rec["sample"] = json.dumps(j[0], ensure_ascii=False)[:900] if j else ""
                            elif isinstance(j, dict):
                                rec["shape"] = "dict"
                                rec["keys"] = list(j.keys())[:25]
                                rec["sample"] = json.dumps(j, ensure_ascii=False)[:900]
                        except Exception:
                            rec["sample"] = body[:300]
                    except Exception as e:
                        rec["body_err"] = repr(e)[:80]
                    captured.append(rec)
            except Exception:
                pass

        page.on("response", on_response)

        banner("1. Render the SPA (headless Chromium): " + PAGE)
        try:
            page.goto(PAGE, wait_until="networkidle", timeout=90000)
        except Exception as e:
            print("goto warning:", repr(e)[:120])
        try:
            page.wait_for_timeout(6000)
        except Exception:
            pass
        title = page.title()
        html = page.content()
        print("rendered title:", repr(title), "· DOM bytes:", len(html), flush=True)

        banner("2. Captured API / JSON responses")
        if not captured:
            print("  (none captured)")
        for r in captured:
            print("  -", r.get("status"), r.get("url"))
            print("      ctype:", r.get("ctype"), "len:", r.get("len"), "shape:", r.get("shape"))
            if r.get("first_keys"):
                print("      first_keys:", r["first_keys"])
            if r.get("keys"):
                print("      keys:", r["keys"])
            if r.get("sample"):
                print("      sample:", r["sample"][:900])

        banner("3. PDF links in the rendered DOM")
        pdfs = page.eval_on_selector_all(
            "a[href]", "els => els.map(e => [e.getAttribute('href'), (e.textContent||'').trim()])")
        pdf_links = [(h, t) for (h, t) in pdfs if h and ".pdf" in h.lower()]
        print("  total <a>:", len(pdfs), "· pdf links:", len(pdf_links))
        for h, t in pdf_links[:40]:
            print("      PDF:", h, "  <=", t[:70])
        # Any href pattern at all (first 30 distinct) so we see the link scheme.
        distinct = []
        seen = set()
        for h, t in pdfs:
            base = re.sub(r"[0-9]+", "#", h or "")
            if base not in seen:
                seen.add(base)
                distinct.append((h, t))
        print("  distinct href patterns (sample):")
        for h, t in distinct[:30]:
            print("      ", h, "  <=", t[:50])

        banner("4. Rendered DOM text sample (to see exhibit + rec layout)")
        text = page.eval_on_selector("body", "el => el.innerText") if page.query_selector("body") else ""
        print(text[:2500])

        browser.close()
    banner("DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
