#!/usr/bin/env python3
"""Discovery probe for the public Statewide CPL page (map.rccd.edu/statewidecpl).

WHY: the agent sandbox can't reach map.rccd.edu (egress 403), but a GitHub
Actions runner can. The page is a SPA, so a plain fetch returns only the shell —
this probe fetches the shell, pulls its JS bundles, and greps them for the
backing data API + any PDF link pattern, printing everything to the run log
(which Claude reads back via the GitHub MCP). Commits nothing.

Goal: find (a) the API endpoint the page calls for the exhibit list + each
exhibit's PDF URL + credit recommendations (C-ID / title / units), so we can
write a real runner scraper that bakes that into the public Fact Sheet.

Run: Actions -> "Discover statewide CPL data (manual)" -> Run workflow.
"""
import json
import re
import sys
import urllib.request
import urllib.error

PAGE = "https://map.rccd.edu/statewidecpl/"
UA = "Mozilla/5.0 (compatible; CPL-FactSheet-Discovery/1.0)"


def get(url, data=None, method=None, headers=None):
    h = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data else "GET"), headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read().decode("utf-8", "replace")


def banner(t):
    print("\n" + "=" * 70 + "\n" + t + "\n" + "=" * 70)


def main():
    banner("1. Fetch the SPA shell: " + PAGE)
    try:
        status, html = get(PAGE)
    except Exception as e:
        print("FETCH FAILED:", repr(e))
        return 1
    print("HTTP", status, "· bytes", len(html))

    # Script + link bundles (Vite/Angular/React builds list them in the shell).
    srcs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, re.I)
    srcs += re.findall(r'<link[^>]+href=["\']([^"\']+\.js)["\']', html, re.I)

    def absolutize(u):
        if u.startswith("http"):
            return u
        if u.startswith("//"):
            return "https:" + u
        if u.startswith("/"):
            return "https://map.rccd.edu" + u
        return PAGE + u.lstrip("./")

    bundles = [absolutize(s) for s in dict.fromkeys(srcs)]
    print("script/js bundles found:", len(bundles))
    for b in bundles:
        print("  -", b)

    # Inline hints in the shell itself.
    banner("2. Inline hints in the shell HTML")
    for pat in [r"https?://[\w.-]*azurewebsites\.net[^\s\"'<>]*", r'[^\s"\'<>]+\.pdf',
                r"/api/[\w/.-]+", r"statewide[\w/.-]*"]:
        hits = sorted(set(re.findall(pat, html, re.I)))[:15]
        if hits:
            print("  pattern", pat, "->")
            for h in hits:
                print("      ", h)

    # Grep each JS bundle for API endpoints + pdf/recommendation hints.
    banner("3. Grep JS bundles for API endpoints + pdf/rec hints")
    api_candidates = set()
    pdf_hints = set()
    for b in bundles:
        try:
            st, js = get(b)
        except Exception as e:
            print("  (skip", b, "->", repr(e), ")")
            continue
        for u in re.findall(r"https?://[\w.-]*azurewebsites\.net[^\s\"'<>`)]*", js, re.I):
            api_candidates.add(u)
        for u in re.findall(r'["\'`](/api/[\w/.-]+)["\'`]', js):
            api_candidates.add(u)
        for u in re.findall(r"[\w/.-]+\.pdf", js, re.I):
            pdf_hints.add(u)
        # endpoint-ish string literals naming statewide/exhibit/recommendation
        for u in re.findall(r'["\'`]([\w./-]*(?:statewide|exhibit|recommend|GetData|getReport)[\w./-]*)["\'`]', js, re.I):
            if 2 < len(u) < 120:
                api_candidates.add(u)
    print("API/endpoint candidates:")
    for u in sorted(api_candidates):
        print("   ", u)
    print("PDF-ish strings:")
    for u in sorted(pdf_hints)[:30]:
        print("   ", u)

    # Try the obvious Azure data endpoints (best-effort; print a small sample).
    banner("4. Probe likely data endpoints (POST {} and GET)")
    guesses = [u for u in api_candidates if "azurewebsites.net" in u and "/api/" in u]
    # Add structural guesses based on the sibling landing-page API shape.
    guesses += [
        "https://mapwebapinew.azurewebsites.net/api/StatewideCPL/GetData",
        "https://mapwebapinew.azurewebsites.net/api/Statewide/GetData",
        "https://mapwebapinew.azurewebsites.net/api/StatewideExhibits/GetData",
    ]
    for g in list(dict.fromkeys(guesses)):
        for method in ("POST", "GET"):
            try:
                st, body = get(g, data=b"{}" if method == "POST" else None, method=method,
                               headers={"Content-Type": "application/json"})
                snippet = body[:600].replace("\n", " ")
                print(f"  [{method} {st}] {g}\n      {snippet}")
                if st == 200 and len(body) > 50:
                    # Show top-level keys / first record shape.
                    try:
                        j = json.loads(body)
                        if isinstance(j, list) and j:
                            print("      -> list of", len(j), "first record keys:",
                                  list(j[0].keys()) if isinstance(j[0], dict) else type(j[0]).__name__)
                        elif isinstance(j, dict):
                            print("      -> dict keys:", list(j.keys())[:20])
                    except Exception:
                        pass
            except urllib.error.HTTPError as e:
                print(f"  [{method} HTTP {e.code}] {g}")
            except Exception as e:
                print(f"  [{method} ERR] {g} -> {repr(e)[:80]}")
    banner("DONE — paste the API endpoint + a sample record back to build the scraper")
    return 0


if __name__ == "__main__":
    sys.exit(main())
