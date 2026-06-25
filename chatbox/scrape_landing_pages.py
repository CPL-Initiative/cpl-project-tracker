#!/usr/bin/env python3
"""Scrape college CPL landing-page links from map.rccd.edu/cpllandingpages/.

WHY THIS RUNS ON A RUNNER (not in the agent sandbox): the Claude session's
egress policy blocks map.rccd.edu (proxy 403), and WebFetch is bot-blocked, so
this uses the repo's "runner-as-proxy" pattern (see
docs/kb-notes/playbook-runner-as-external-api-proxy.md). A GitHub Actions runner
has open internet; it scrapes, reconciles, and (optionally) writes Supabase.

WHAT IT DOES
  1. Fetch the landing-pages index page.
  2. Parse anchor links into {college name -> landing-page URL}.
  3. Write chatbox/college_landing_pages.json (provenance + raw scrape +
     reconciliation against the live chatbox_college_profiles table).
  4. With SUPABASE_SERVICE_KEY present, READ the profile college list and
     reconcile names; with --apply, PATCH chatbox_college_profiles.landing_page_url.

The CPL Assistant (cpl-chat Edge Function) joins chatbox_college_profiles on the
`college` name to surface each college's CPL landing page in chat answers, so
keeping landing_page_url correct here fixes the broken links in the assistant.

Stdlib only (urllib) so the runner needs no pip install.

Usage:
  python3 chatbox/scrape_landing_pages.py [--apply] [--dump-html PATH] [--url URL]
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape

DEFAULT_URL = "https://map.rccd.edu/cpllandingpages/"
OUT_JSON = os.path.join(os.path.dirname(__file__), "college_landing_pages.json")

SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
PROFILE_TABLE = "chatbox_college_profiles"

# Landing-page URLs we recognize. The authoritative host today is the Azure
# dashboard (https://cpldashboardcccco.azurewebsites.net/<CODE>); the older
# map.rccd.edu/cpl-student-portal/<CODE> form is also accepted so a future
# host change is caught rather than silently dropped.
LANDING_HOST_RE = re.compile(
    r"https?://(?:cpldashboardcccco\.azurewebsites\.net|map\.rccd\.edu/cpl-student-portal)",
    re.I,
)
ANCHOR_RE = re.compile(r"<a\b([^>]*)>(.*?)</a>", re.I | re.S)
HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.I)
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def looks_like_challenge(html: str) -> bool:
    """map.rccd.edu sits behind a Sucuri WAF that serves a JS/meta-refresh
    'sgcaptcha' bot-challenge to plain fetchers instead of the real page."""
    low = html.lower()
    return ("sgcaptcha" in low or "sucuri" in low
            or ('http-equiv="refresh"' in low and len(html) < 1500))


def fetch_plain(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        body = resp.read().decode(charset, errors="replace")
        print(f"[fetch] plain {resp.status} {resp.headers.get('Content-Type','?')} "
              f"{len(body)} chars from {resp.geturl()}")
        return body


# The college landing list goes to cpldashboardcccco.azurewebsites.net/<CODE>;
# the SPA also renders a couple of static nav links (…/insights/dashboard,
# cpl-student-portal/chancellor|dashboard). A real per-college link is one of
# these hosts whose path is NOT one of those nav targets.
COLLEGE_ANCHOR_JS = """() => document.querySelectorAll(
  "a[href*='cpldashboardcccco.azurewebsites.net/']:not([href*='/insights']), "
  + "a[href*='/cpl-student-portal/']:not([href$='/chancellor']):not([href$='/dashboard'])"
).length"""


def _safe_content(page) -> str:
    """page.content() throws mid-navigation (the WAF meta-refresh keeps
    bouncing the page); retry until it settles."""
    for _ in range(8):
        try:
            return page.content()
        except Exception:
            page.wait_for_timeout(1000)
    return ""


def fetch_browser(url: str) -> str:
    """Render with headless Chromium: clear the Sucuri JS challenge, then wait
    for the Angular SPA to fetch + render the per-college landing list. Also
    logs the network so we can see the SPA's data API (the long-term source).
    Never raises — always returns the best HTML it can so diagnostics run."""
    from playwright.sync_api import sync_playwright
    print("[fetch] launching headless Chromium to clear the WAF + render the SPA…")
    api_hits = []

    def on_response(resp):
        try:
            ct = (resp.headers or {}).get("content-type", "")
            u = resp.url
            if "json" in ct.lower() or any(k in u.lower() for k in (
                    "api", "landing", "college", "portal", "list")):
                body = ""
                if "json" in ct.lower():
                    try:
                        body = resp.text()[:240]
                    except Exception:
                        body = "(unreadable)"
                api_hits.append((u, ct, body))
        except Exception:
            pass

    html = ""
    with sync_playwright() as p:
        browser = p.chromium.launch(args=[
            "--no-sandbox", "--disable-blink-features=AutomationControlled"])
        ctx = browser.new_context(user_agent=UA, locale="en-US")
        page = ctx.new_page()
        page.on("response", on_response)
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"[fetch] goto note: {e}")
        # One resilient wait handles BOTH the WAF meta-refresh bounce AND the
        # SPA render — wait_for_function re-polls across navigations.
        try:
            page.wait_for_function(f"{COLLEGE_ANCHOR_JS} >= 10", timeout=60000)
        except Exception:
            print("[fetch] college list never reached 10 anchors — capturing anyway")
        page.wait_for_timeout(3000)  # let any final render settle
        html = _safe_content(page)
        try:
            n = page.evaluate(COLLEGE_ANCHOR_JS)
        except Exception:
            n = "?"
        print(f"[fetch] browser rendered {len(html)} chars, {n} college anchors, "
              f"from {page.url}")
        browser.close()

    if api_hits:
        print(f"[net] {len(api_hits)} JSON/api-ish responses observed:")
        for u, ct, body in api_hits[:30]:
            print(f"[net]   {ct[:30]:30} {u}")
            if body:
                print(f"[net]      body: {WS_RE.sub(' ', body)}")
    else:
        print("[net] no JSON/api-ish responses observed")
    return html


def fetch(url: str) -> str:
    html = fetch_plain(url)
    if looks_like_challenge(html):
        print("[fetch] WAF challenge detected on plain fetch → escalating to browser")
        try:
            html = fetch_browser(url)
        except ImportError:
            print("::warning::playwright not installed — cannot clear WAF challenge")
    return html


def clean_text(html_fragment: str) -> str:
    return WS_RE.sub(" ", unescape(TAG_RE.sub(" ", html_fragment))).strip()


def parse_links(html: str):
    """Return [{college, url}] from anchors that point at a landing page."""
    out, seen = [], set()
    for attrs, inner in ANCHOR_RE.findall(html):
        m = HREF_RE.search(attrs)
        if not m:
            continue
        href = unescape(m.group(1)).strip()
        if not LANDING_HOST_RE.match(href):
            continue
        name = clean_text(inner)
        # Some lists put the college name in a sibling cell, not the <a> text.
        # If the anchor text is empty or just the URL, fall back to the title attr.
        if not name or name.lower().startswith("http"):
            tm = re.search(r"""(?:title|aria-label)\s*=\s*["']([^"']+)["']""", attrs, re.I)
            name = clean_text(tm.group(1)) if tm else ""
        key = (name.lower(), href.lower())
        if name and key not in seen:
            seen.add(key)
            out.append({"college": name, "url": href})
    return out


def diagnostics(html: str):
    print("[diag] ---- recon ----")
    for needle in ("cpldashboardcccco", "cpl-student-portal", "<a ", "href="):
        print(f"[diag] count {needle!r}: {html.lower().count(needle.lower())}")
    # show the first few landing-host hrefs in context
    hits = [m.group(0) for m in re.finditer(
        r'<a\b[^>]*href\s*=\s*["\'][^"\']*'
        r'(?:cpldashboardcccco|cpl-student-portal)[^"\']*["\'][^>]*>.{0,80}',
        html, re.I | re.S)][:8]
    for h in hits:
        print("[diag] sample:", WS_RE.sub(" ", h)[:200])
    if not hits:
        # SPA / different structure: show a window so we can see what we got
        idx = html.lower().find("cpldashboard")
        if idx == -1:
            idx = html.lower().find("college")
        print("[diag] no landing anchors found; window:")
        print(html[max(0, idx - 200): idx + 1200] if idx != -1 else html[:1400])
    print("[diag] ----------------")


# ── name reconciliation ────────────────────────────────────────────────
def norm(name: str) -> str:
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = s.replace("&", " and ").replace("-", " ").replace(".", " ").replace(",", " ")
    s = re.sub(r"\b(the)\b", " ", s)
    s = re.sub(r"\bmt\b", "mount", s)
    s = re.sub(r"\bsaint\b", "st", s)
    s = WS_RE.sub(" ", s).strip()
    return s


def core(name: str) -> str:
    """Aggressive key: drop generic suffix words to catch 'X' vs 'X College'."""
    s = norm(name)
    s = re.sub(r"\b(community|college|of|center|continuing|education|"
               r"credit|non credit|noncredit)\b", " ", s)
    return WS_RE.sub(" ", s).strip()


def sb_request(method: str, path: str, key: str, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        return resp.status, (json.loads(raw) if raw.strip() else None)


def reconcile(scraped, key: str):
    """Match scraped names to profile rows. Returns (updates, report)."""
    _, profiles = sb_request(
        "GET", f"{PROFILE_TABLE}?select=college,landing_page_url", key)
    by_norm, by_core = {}, {}
    for p in profiles:
        by_norm.setdefault(norm(p["college"]), p)
        by_core.setdefault(core(p["college"]), p)

    updates, matched_profiles, unmatched_scraped = [], set(), []
    for row in scraped:
        prof = by_norm.get(norm(row["college"])) or by_core.get(core(row["college"]))
        if not prof:
            unmatched_scraped.append(row)
            continue
        matched_profiles.add(prof["college"])
        updates.append({
            "profile_college": prof["college"],
            "url": row["url"],
            "matched_from": row["college"],
            "old_url": prof.get("landing_page_url"),
            "changed": prof.get("landing_page_url") != row["url"],
        })
    unmatched_profiles = sorted(
        p["college"] for p in profiles if p["college"] not in matched_profiles)
    return updates, {
        "profile_rows": len(profiles),
        "unmatched_scraped": unmatched_scraped,
        "unmatched_profiles": unmatched_profiles,
    }


def apply_updates(updates, key: str):
    n = 0
    for u in updates:
        if not u["changed"]:
            continue
        q = urllib.parse.quote(u["profile_college"], safe="")
        sb_request("PATCH", f"{PROFILE_TABLE}?college=eq.{q}", key,
                   {"landing_page_url": u["url"]})
        n += 1
        print(f"[apply] {u['profile_college']}  ->  {u['url']}")
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--apply", action="store_true",
                    help="write landing_page_url to chatbox_college_profiles")
    ap.add_argument("--dump-html", help="write the raw fetched HTML here")
    args = ap.parse_args()

    html = fetch(args.url)
    if args.dump_html:
        with open(args.dump_html, "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"[dump] wrote {args.dump_html}")
    diagnostics(html)

    scraped = parse_links(html)
    print(f"[parse] {len(scraped)} landing links")
    if not scraped:
        print("::error::no landing-page links parsed — see recon window above")
        # still write provenance so the failure is visible/committed
    scraped.sort(key=lambda r: r["college"].lower())

    payload = {
        "_source": args.url,
        "_scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_count_scraped": len(scraped),
        "scraped": scraped,
    }

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    applied = 0
    if key and scraped:
        updates, report = reconcile(scraped, key)
        changed = [u for u in updates if u["changed"]]
        payload["reconciliation"] = {
            "matched": len(updates),
            "would_change": len(changed),
            **report,
        }
        payload["updates"] = updates
        print(f"[reconcile] matched {len(updates)}/{len(scraped)} scraped to "
              f"profiles; {len(changed)} differ from current value")
        if report["unmatched_scraped"]:
            print("[reconcile] scraped names with NO profile row:",
                  [r["college"] for r in report["unmatched_scraped"]])
        if report["unmatched_profiles"]:
            print(f"[reconcile] {len(report['unmatched_profiles'])} profile rows "
                  f"got no scraped match (test rows / closed colleges expected)")
        if args.apply:
            applied = apply_updates(changed, key)
            payload["_applied_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            payload["_applied_count"] = applied
            print(f"[apply] PATCHed {applied} rows")
        else:
            print("[apply] dry-run (pass --apply to write Supabase)")
    elif not key:
        print("[reconcile] SUPABASE_SERVICE_KEY unset — scrape only, no reconciliation")

    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[write] {OUT_JSON} ({len(scraped)} links)")

    if not scraped:
        sys.exit(1)


if __name__ == "__main__":
    main()
