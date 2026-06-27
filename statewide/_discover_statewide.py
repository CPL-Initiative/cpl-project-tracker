#!/usr/bin/env python3
"""Discovery probe (v3) for map.rccd.edu/statewidecpl — inspect the accordion markup.

Findings so far: the page is a WordPress page (no JSON API). Each discipline is an
accordion; expanding it reveals an exhibit + a "download" (PDF) + a "Full
Collaborative Discipline Review" (PDF). The credit-rec courses (C-ID/title/units)
live INSIDE those PDFs, not as page data.

This run: render with Chromium, EXPAND every accordion, then (1) dump the exact
outerHTML of the credit-rec section so we see how the per-exhibit PDF links are
encoded, (2) list every link in that section, and (3) download the FIRST content
PDF + dump its extracted text so we can judge whether the course table parses.
Everything to the run log; commits nothing.
"""
import re
import sys
import urllib.request

PAGE = "https://map.rccd.edu/statewidecpl/"


def banner(t):
    print("\n" + "=" * 70 + "\n" + t + "\n" + "=" * 70, flush=True)


def main():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"))
        page = ctx.new_page()
        banner("Render + expand accordions: " + PAGE)
        page.goto(PAGE, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(4000)

        # Click everything that looks like an accordion/discipline toggle, twice
        # over (newly revealed nested toggles), so all content is in the DOM.
        for _ in range(2):
            clicked = page.evaluate("""() => {
                const cands = Array.from(document.querySelectorAll(
                  '[aria-expanded], .accordion, .accordion-button, .elementor-tab-title, '
                  + '.elementor-accordion-title, summary, .et_pb_toggle_title, .et_pb_accordion_item, '
                  + 'h2,h3,h4,button,[role=button]'));
                let n = 0;
                for (const el of cands) {
                  const t = (el.textContent||'').trim();
                  if (t.length && t.length < 60) { try { el.click(); n++; } catch(e){} }
                }
                return n;
            }""")
            page.wait_for_timeout(1500)
        print("toggle clicks attempted:", clicked)

        # Locate the credit-rec section container and dump its HTML + links.
        banner("Credit-rec section outerHTML (truncated)")
        html = page.evaluate("""() => {
            // find a heading mentioning 'by Discipline' and walk up to a sizable container
            const hs = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
            let h = hs.find(e => /by Discipline/i.test(e.textContent||''));
            let node = h ? h.parentElement : null;
            for (let i=0;i<4 && node && node.parentElement;i++){
              if ((node.textContent||'').length > 1500) break;
              node = node.parentElement;
            }
            return node ? node.outerHTML : (document.querySelector('main')||document.body).outerHTML;
        }""")
        # Strip scripts/styles + collapse whitespace for readability.
        h = re.sub(r"<(script|style)[\s\S]*?</\1>", "", html, flags=re.I)
        h = re.sub(r"\s+", " ", h)
        print(h[:9000])

        banner("All links inside that section (text -> href)")
        links = page.evaluate("""() => {
            const hs = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
            let h = hs.find(e => /by Discipline/i.test(e.textContent||''));
            let node = h ? h.parentElement : document.body;
            for (let i=0;i<4 && node && node.parentElement;i++){
              if ((node.textContent||'').length > 1500) break; node = node.parentElement; }
            return Array.from(node.querySelectorAll('a[href]')).map(a => [
              (a.textContent||'').trim().slice(0,60),
              a.getAttribute('href'),
              a.getAttribute('download') || '' ]);
        }""")
        content_pdf = None
        for text, href, dl in links:
            print("   ", repr(text), "->", href, ("[download]" if dl else ""))
            if not content_pdf and href and (".pdf" in (href or "").lower() or "uploads" in (href or "").lower()):
                if not re.search(r"(Report|AB-123|Master-Plan|vision-2030|Fact_Sheet|Scaling|Economic|workplan|funding)", href, re.I):
                    content_pdf = href

        banner("First content PDF -> extract text (pymupdf)")
        if content_pdf:
            if content_pdf.startswith("/"):
                content_pdf = "https://map.rccd.edu" + content_pdf
            print("PDF:", content_pdf)
            try:
                req = urllib.request.Request(content_pdf, headers={"User-Agent": "Mozilla/5.0"})
                data = urllib.request.urlopen(req, timeout=90).read()
                print("downloaded bytes:", len(data))
                import fitz  # pymupdf
                doc = fitz.open(stream=data, filetype="pdf")
                print("pages:", doc.page_count)
                txt = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
                print("---- first pages text ----")
                print(txt[:4000])
            except Exception as e:
                print("PDF fetch/parse error:", repr(e)[:160])
        else:
            print("no content PDF link found in the section")
        browser.close()
    banner("DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
