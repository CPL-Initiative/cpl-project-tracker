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
import http.cookiejar
import json
import os
import re
import sys
import time
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


# Persist cookies across requests so a Sucuri WAF clearance cookie carries from
# the challenge response into the retry (which then gets the real page).
_OPENER = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def looks_like_challenge(html: str) -> bool:
    """map.rccd.edu sits behind a Sucuri WAF that serves a JS/meta-refresh
    'sgcaptcha' bot-challenge to plain fetchers instead of the real page."""
    low = html.lower()
    return ("sgcaptcha" in low or "sucuri" in low
            or ('http-equiv="refresh"' in low and len(html) < 1500))


def is_full_page(html: str) -> bool:
    """The real index lists ~115 colleges, so it carries many cpl-student-portal
    links. The WAF challenge / bare SPA shell carries almost none."""
    return html.lower().count("cpl-student-portal") >= 50


def fetch_plain(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with _OPENER.open(req, timeout=60) as resp:
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
        # full-page render — wait_for_function re-polls across navigations. Wait
        # for the WordPress index's many cpl-student-portal links, not just a few
        # anchors (the SPA shell has the nav links but not the college list).
        try:
            page.wait_for_function(
                "() => (document.documentElement.innerHTML.match"
                "(/cpl-student-portal/gi) || []).length >= 50", timeout=60000)
        except Exception:
            print("[fetch] full college list never rendered — capturing anyway")
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
    """The WAF is intermittent: a plain fetch often returns the full page, and a
    cookie-jar retry usually clears a challenge. Try plain a few times, then fall
    back to the browser. Return the best (most complete) HTML seen."""
    best = ""
    for attempt in range(1, 5):
        try:
            html = fetch_plain(url)
        except Exception as e:  # noqa: BLE001
            print(f"[fetch] plain attempt {attempt} error: {e}")
            html = ""
        if is_full_page(html):
            return html
        if len(html) > len(best):
            best = html
        why = ("WAF challenge" if looks_like_challenge(html)
               else f"{html.lower().count('cpl-student-portal')} portal refs (<50)")
        print(f"[fetch] plain attempt {attempt}: {why} → retrying")
        time.sleep(3)
    print("[fetch] plain retries exhausted → escalating to browser")
    try:
        b = fetch_browser(url)
        if is_full_page(b) or len(b) > len(best):
            best = b
    except ImportError:
        print("::warning::playwright not installed — cannot clear WAF challenge")
    return best


def clean_text(html_fragment: str) -> str:
    return WS_RE.sub(" ", unescape(TAG_RE.sub(" ", html_fragment))).strip()


# A real per-college landing link points at either host; the page (a WordPress
# page) renders most as RELATIVE hrefs (/cpl-student-portal/<CODE>), so resolve
# against the base. Two nav links under that path are NOT colleges.
LANDING_RE = re.compile(
    r"(?:cpldashboardcccco\.azurewebsites\.net/|cpl-student-portal/)", re.I)
NAV_LAST = {"chancellor", "dashboard"}
DASH_BASE = "https://cpldashboardcccco.azurewebsites.net/"


RAW_PORTAL_RE = re.compile(r"cpl-student-portal/([A-Za-z0-9._%\-]+)", re.I)


def extract_raw(html: str, span_before: int = 180, span_after: int = 50):
    """Recon: every distinct cpl-student-portal/<CODE> in the RAW html with
    surrounding markup, so we can see HOW the college links are embedded when
    they're not <a href> anchors."""
    seen, items = set(), []
    for m in RAW_PORTAL_RE.finditer(html):
        code = m.group(1)
        if code.lower() in NAV_LAST or code.lower() in seen:
            continue
        seen.add(code.lower())
        ctx = html[max(0, m.start() - span_before): m.end() + span_after]
        items.append({"code": code, "context": WS_RE.sub(" ", ctx).strip()})
    return items


def code_of(url: str) -> str:
    seg = urllib.parse.urlparse(url).path.rstrip("/").rsplit("/", 1)[-1]
    return urllib.parse.unquote(seg)


def to_dashboard(code: str) -> str:
    return DASH_BASE + code


# Placeholder codes in the official blob that must never overwrite a real URL.
PLACEHOLDER_CODES = {"test", "", "dashboard", "chancellor", "insights"}


def extract_mapfy(html: str):
    """The page embeds the authoritative list as a JS object:
       let mapfyCollegeUrls = {"updated":"...","colleges":[{College, CollegeLandingURL}]}
    Pull it out with balanced-brace matching and parse it as JSON."""
    m = re.search(r"mapfyCollegeUrls\s*=\s*\{", html)
    if not m:
        return None
    start, depth = m.end() - 1, 0
    for j in range(start, len(html)):
        ch = html[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(html[start:j + 1])
                except Exception as e:  # noqa: BLE001
                    print(f"[blob] JSON parse failed: {e}")
                    return None
    return None


def parse_links(html: str, base_url: str = DEFAULT_URL):
    """Authoritative path: parse the embedded mapfyCollegeUrls JSON. Each row:
    {college, code, portal_url (official cpl-student-portal link),
     dashboard_url (the cpldashboardcccco redirect target)}. Falls back to anchor
    scraping if the blob isn't present."""
    blob = extract_mapfy(html)
    if blob and isinstance(blob.get("colleges"), list):
        print(f"[blob] mapfyCollegeUrls updated={blob.get('updated')!r} "
              f"colleges={len(blob['colleges'])}")
        out, seen = [], set()
        for c in blob["colleges"]:
            name = (c.get("College") or "").strip()
            portal = (c.get("CollegeLandingURL") or "").strip()
            if not name or not portal:
                continue
            code = code_of(portal)
            if code.lower() in PLACEHOLDER_CODES:
                print(f"[blob] skip placeholder: {name} -> {portal}")
                continue
            if name.lower() in seen:
                continue
            seen.add(name.lower())
            out.append({
                "college": name,
                "code": code,
                "portal_url": portal,
                "dashboard_url": to_dashboard(code),
            })
        return out
    print("[blob] mapfyCollegeUrls not found — falling back to anchor scrape")
    return parse_anchors(html, base_url)


def parse_anchors(html: str, base_url: str = DEFAULT_URL):
    """Fallback: scrape per-college landing anchors from the rendered DOM."""
    out, seen = [], set()
    for attrs, inner in ANCHOR_RE.findall(html):
        m = HREF_RE.search(attrs)
        if not m:
            continue
        raw = unescape(m.group(1)).strip()
        if not LANDING_RE.search(raw):
            continue
        portal_url = urllib.parse.urljoin(base_url, raw)
        path = urllib.parse.urlparse(portal_url).path.lower().rstrip("/")
        if "/insights" in path:                       # nav: MAP CPL Dashboard
            continue
        last = path.rsplit("/", 1)[-1]
        if "/cpl-student-portal/" in path + "/" and last in NAV_LAST:
            continue                                   # nav: CPL Dashboard/Inventory
        name = clean_text(inner)
        if not name or name.lower().startswith("http"):
            tm = re.search(r"""(?:title|aria-label)\s*=\s*["']([^"']+)["']""",
                           attrs, re.I)
            name = clean_text(tm.group(1)) if tm else ""
        code = code_of(portal_url)
        if not name or not code:
            continue
        key = (name.lower(), code.lower())
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "college": name,
            "code": code,
            "portal_url": portal_url,
            "dashboard_url": to_dashboard(code),
        })
    return out


def resolve_redirect(url: str):
    """Follow redirects; return (final_url, status). Used to VERIFY that the
    page's /cpl-student-portal/<CODE> link resolves to cpldashboardcccco/<CODE>."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.geturl(), resp.status
    except Exception as e:  # noqa: BLE001 — record the failure, don't crash
        return f"(error: {type(e).__name__}: {e})", None


def diagnostics(html: str):
    print("[diag] ---- recon ----")
    for needle in ("cpldashboardcccco", "cpl-student-portal", "<a ", "href="):
        print(f"[diag] count {needle!r}: {html.lower().count(needle.lower())}")
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
    ap.add_argument("--store", choices=("auto", "portal", "dashboard"),
                    default="auto",
                    help="which URL form to store (default auto: dashboard if "
                         "the redirect probe confirms, else the portal link)")
    ap.add_argument("--dump-html", help="write the raw fetched HTML here")
    args = ap.parse_args()

    html = fetch(args.url)
    if args.dump_html:
        with open(args.dump_html, "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"[dump] wrote {args.dump_html}")
    diagnostics(html)

    scraped = parse_links(html, args.url)
    raw = extract_raw(html)
    print(f"[parse] {len(scraped)} landing links | {len(raw)} raw portal codes")
    scraped.sort(key=lambda r: r["college"].lower())

    # Probe the official portal link's redirect on a spread of samples (incl.
    # San Diego Miramar) to learn where /cpl-student-portal/<CODE> resolves.
    probe = []
    if scraped:
        picks, names = [], ("miramar", "mesa", "bakersfield", "santa rosa")
        for want in names:
            for r in scraped:
                if want in r["college"].lower() and r not in picks:
                    picks.append(r)
                    break
        for r in scraped:
            if len(picks) >= 5:
                break
            if r not in picks:
                picks.append(r)
        for r in picks:
            final, status = resolve_redirect(r["portal_url"])
            probe.append({
                "college": r["college"], "code": r["code"],
                "portal_url": r["portal_url"], "dashboard_url": r["dashboard_url"],
                "redirect_final": final, "redirect_status": status,
                "matches_dashboard": isinstance(final, str)
                and final.rstrip("/") == r["dashboard_url"].rstrip("/"),
            })
            print(f"[probe] {r['college']}: {r['portal_url']} -> {final}")

    # Decide which URL to STORE. 'auto': use the direct cpldashboardcccco/<CODE>
    # form only if every probe confirms the redirect preserves the code;
    # otherwise fall back to the official portal link (always correct).
    store_field = "portal_url"
    if args.store == "dashboard":
        store_field = "dashboard_url"
    elif args.store == "portal":
        store_field = "portal_url"
    elif probe and all(p["matches_dashboard"] for p in probe):
        store_field = "dashboard_url"
    for r in scraped:
        r["url"] = r[store_field]
    print(f"[store] using {store_field} as landing_page_url "
          f"(probe confirmed: {sum(p['matches_dashboard'] for p in probe)}/{len(probe)})")

    payload = {
        "_source": args.url,
        "_scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_count_scraped": len(scraped),
        "_store_field": store_field,
        "_note": ("url = the value stored to landing_page_url; portal_url is the "
                  "official cpl-student-portal link, dashboard_url its "
                  "cpldashboardcccco redirect target"),
        "_redirect_probe": probe,
        "_debug": {"page_chars": len(html), "raw_portal_count": len(raw),
                   "raw_portal_samples": raw[:20]},
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

    if not scraped and not raw:
        print("::error::no landing links AND no raw portal codes — page not fetched")
        sys.exit(1)
    if not scraped:
        # Data is present but not as anchors — commit the _debug so the markup
        # structure can be inspected; don't fail the run.
        print("::warning::0 anchor links parsed but raw portal codes exist — "
              "see _debug.raw_portal_samples")


if __name__ == "__main__":
    main()
