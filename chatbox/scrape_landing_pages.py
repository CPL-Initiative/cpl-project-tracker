#!/usr/bin/env python3
"""Scrape the college CPL landing-page links from map.rccd.edu/cpllandingpages/
and sync them into chatbox_college_profiles.landing_page_url.

WHY A RUNNER: the Claude session's egress policy blocks map.rccd.edu, so this
runs on a GitHub Actions runner (the repo's runner-as-proxy pattern — see
docs/kb-notes/playbook-runner-as-external-api-proxy.md).

WHERE THE DATA IS: the page (WordPress) embeds the authoritative list as a JS
object — `let mapfyCollegeUrls = {"updated":"…","colleges":[{College,
CollegeLandingURL}]}` — NOT as <a> anchors. We parse that blob directly.

WHAT WE STORE: each college's official `https://map.rccd.edu/cpl-student-portal/
<CODE>` link (path-encoded). That canonical link 302-redirects to wherever the
landing app currently lives (a Vercel app as of 2026-06), so it survives backend
moves. The CPL Assistant (cpl-chat Edge Function) joins chatbox_college_profiles
on the college name to surface these links in chat answers.

WHY IT CAN FAIL TO FETCH: map.rccd.edu sits behind an intermittent Sucuri WAF
('sgcaptcha'). We retry the plain fetch with a cookie jar and, as a last resort,
render with headless Chromium.

Stdlib only (except the optional playwright fallback) so the runner needs no pip
install for the common path.

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

ANCHOR_RE = re.compile(r"<a\b([^>]*)>(.*?)</a>", re.I | re.S)
HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.I)
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
# A per-college landing href points at either host; the page renders most as
# relative /cpl-student-portal/<CODE>. Two paths under it are nav, not colleges.
LANDING_RE = re.compile(
    r"(?:cpldashboardcccco\.azurewebsites\.net/|cpl-student-portal/)", re.I)
NAV_LAST = {"chancellor", "dashboard"}
# Placeholder codes in the official blob that must never overwrite a real URL.
PLACEHOLDER_CODES = {"test", "", "dashboard", "chancellor", "insights"}
RAW_PORTAL_RE = re.compile(r"cpl-student-portal/([A-Za-z0-9._%\-]+)", re.I)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

# Persist cookies across requests so a Sucuri WAF clearance cookie carries from
# the challenge response into the retry (which then gets the real page).
_OPENER = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


# ── fetch (WAF-aware) ──────────────────────────────────────────────────
def looks_like_challenge(html: str) -> bool:
    low = html.lower()
    return ("sgcaptcha" in low or "sucuri" in low
            or ('http-equiv="refresh"' in low and len(html) < 1500))


def is_full_page(html: str) -> bool:
    """The real index lists ~115 colleges, so it carries many cpl-student-portal
    references. The WAF challenge / bare SPA shell carries almost none."""
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


def _safe_content(page) -> str:
    for _ in range(8):
        try:
            return page.content()
        except Exception:
            page.wait_for_timeout(1000)
    return ""


def fetch_browser(url: str) -> str:
    """Last resort: headless Chromium clears the Sucuri JS challenge and waits
    for the full college list to render. Never raises."""
    from playwright.sync_api import sync_playwright
    print("[fetch] launching headless Chromium to clear the WAF…")
    html = ""
    with sync_playwright() as p:
        browser = p.chromium.launch(args=[
            "--no-sandbox", "--disable-blink-features=AutomationControlled"])
        ctx = browser.new_context(user_agent=UA, locale="en-US")
        page = ctx.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:  # noqa: BLE001
            print(f"[fetch] goto note: {e}")
        try:
            page.wait_for_function(
                "() => (document.documentElement.innerHTML.match"
                "(/cpl-student-portal/gi) || []).length >= 50", timeout=60000)
        except Exception:
            print("[fetch] full college list never rendered — capturing anyway")
        page.wait_for_timeout(3000)
        html = _safe_content(page)
        print(f"[fetch] browser rendered {len(html)} chars from {page.url}")
        browser.close()
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


# ── parse ──────────────────────────────────────────────────────────────
def clean_text(html_fragment: str) -> str:
    return WS_RE.sub(" ", unescape(TAG_RE.sub(" ", html_fragment))).strip()


def code_of(url: str) -> str:
    seg = urllib.parse.urlparse(url).path.rstrip("/").rsplit("/", 1)[-1]
    return urllib.parse.unquote(seg)


def encode_url(url: str) -> str:
    """Percent-encode the path so a stray space in the source (e.g. El Camino's
    'EL C') yields a valid, clickable URL."""
    p = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit(
        (p.scheme, p.netloc, urllib.parse.quote(p.path), p.query, p.fragment))


def extract_mapfy(html: str):
    """Pull `mapfyCollegeUrls = {…}` out with balanced-brace matching + JSON."""
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
    """Authoritative path: parse the embedded mapfyCollegeUrls JSON. Each row
    {college, code, url} where url is the official, path-encoded
    cpl-student-portal link. Falls back to anchor scraping if the blob is absent."""
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
            out.append({"college": name, "code": code, "url": encode_url(portal)})
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
        url = urllib.parse.urljoin(base_url, raw)
        path = urllib.parse.urlparse(url).path.lower().rstrip("/")
        if "/insights" in path:
            continue
        last = path.rsplit("/", 1)[-1]
        if "/cpl-student-portal/" in path + "/" and last in NAV_LAST:
            continue
        name = clean_text(inner)
        if not name or name.lower().startswith("http"):
            tm = re.search(r"""(?:title|aria-label)\s*=\s*["']([^"']+)["']""",
                           attrs, re.I)
            name = clean_text(tm.group(1)) if tm else ""
        code = code_of(url)
        if not name or not code:
            continue
        key = (name.lower(), code.lower())
        if key in seen:
            continue
        seen.add(key)
        out.append({"college": name, "code": code, "url": encode_url(url)})
    return out


def extract_raw(html: str, span_before: int = 160, span_after: int = 40):
    """Recon-only: distinct cpl-student-portal/<CODE> in the raw html with
    surrounding markup, so the embedding can be inspected if parsing ever drifts."""
    seen, items = set(), []
    for m in RAW_PORTAL_RE.finditer(html):
        code = m.group(1)
        if code.lower() in NAV_LAST or code.lower() in seen:
            continue
        seen.add(code.lower())
        ctx = html[max(0, m.start() - span_before): m.end() + span_after]
        items.append({"code": code, "context": WS_RE.sub(" ", ctx).strip()})
    return items


def resolve_redirect(url: str):
    """Follow redirects; return (final_url, status). Informational only — records
    where the official link currently resolves (a Vercel app as of 2026-06)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with _OPENER.open(req, timeout=30) as resp:
            return resp.geturl(), resp.status
    except Exception as e:  # noqa: BLE001
        return f"(error: {type(e).__name__}: {e})", None


def diagnostics(html: str):
    print("[diag] " + " | ".join(
        f"{n!r}={html.lower().count(n.lower())}"
        for n in ("cpldashboardcccco", "cpl-student-portal", "<a ", "href=")))


# ── name reconciliation ────────────────────────────────────────────────
def norm(name: str) -> str:
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = s.replace("&", " and ").replace("-", " ").replace(".", " ").replace(",", " ")
    s = re.sub(r"\b(the)\b", " ", s)
    s = re.sub(r"\bmt\b", "mount", s)
    s = re.sub(r"\bsaint\b", "st", s)
    return WS_RE.sub(" ", s).strip()


def nospace(name: str) -> str:
    """Space-insensitive key so 'Deanza' matches 'De Anza'."""
    return norm(name).replace(" ", "")


def core(name: str) -> str:
    s = re.sub(r"\b(community|college|of|center|continuing|education|"
               r"credit|non credit|noncredit)\b", " ", norm(name))
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
    by_norm, by_nospace, by_core = {}, {}, {}
    for p in profiles:
        by_norm.setdefault(norm(p["college"]), p)
        by_nospace.setdefault(nospace(p["college"]), p)
        by_core.setdefault(core(p["college"]), p)

    updates, matched_profiles, unmatched_scraped = [], set(), []
    for row in scraped:
        prof = (by_norm.get(norm(row["college"]))
                or by_nospace.get(nospace(row["college"]))
                or by_core.get(core(row["college"])))
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

    scraped = parse_links(html, args.url)
    raw = extract_raw(html)
    print(f"[parse] {len(scraped)} landing links | {len(raw)} raw portal codes")
    scraped.sort(key=lambda r: r["college"].lower())

    # Informational: where do the official links currently resolve? (Records the
    # current backend host without affecting what we store.)
    probe = []
    for r in scraped[:4]:
        final, status = resolve_redirect(r["url"])
        probe.append({"college": r["college"], "url": r["url"],
                      "resolves_to": final, "status": status})
        print(f"[probe] {r['college']}: {r['url']} -> {final}")

    payload = {
        "_source": args.url,
        "_scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_count_scraped": len(scraped),
        "_note": ("url = the official map.rccd.edu/cpl-student-portal/<CODE> link "
                  "(path-encoded); it 302-redirects to the current landing host "
                  "(see _redirect_probe.resolves_to)."),
        "_redirect_probe": probe,
        "_debug": {"page_chars": len(html), "raw_portal_count": len(raw),
                   "raw_portal_samples": raw[:12]},
        "scraped": scraped,
    }

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key and scraped:
        updates, report = reconcile(scraped, key)
        changed = [u for u in updates if u["changed"]]
        payload["reconciliation"] = {"matched": len(updates),
                                     "would_change": len(changed), **report}
        payload["updates"] = updates
        print(f"[reconcile] matched {len(updates)}/{len(scraped)}; "
              f"{len(changed)} differ from current value")
        if report["unmatched_scraped"]:
            print("[reconcile] scraped with NO profile row:",
                  [r["college"] for r in report["unmatched_scraped"]])
        if args.apply:
            n = apply_updates(changed, key)
            payload["_applied_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            payload["_applied_count"] = n
            print(f"[apply] PATCHed {n} rows")
        else:
            print("[apply] dry-run (pass --apply to write Supabase)")
    elif not key:
        print("[reconcile] SUPABASE_SERVICE_KEY unset — scrape only")

    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[write] {OUT_JSON} ({len(scraped)} links)")

    if not scraped and not raw:
        print("::error::no landing links AND no raw portal codes — page not fetched")
        sys.exit(1)
    if not scraped:
        print("::warning::0 links parsed but raw portal codes exist — see _debug")


if __name__ == "__main__":
    main()
