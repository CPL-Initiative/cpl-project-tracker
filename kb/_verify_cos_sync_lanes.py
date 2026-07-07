"""No-network verification for kb/_sync_cos_certifications.py's lane logic.

Run ad hoc after editing the sync script (the repo's JS jsdom harness doesn't
cover python; this is the committed equivalent for the COS lanes):

    python3 kb/_verify_cos_sync_lanes.py    # exit 0 = all checks pass

Covers the 2026-07-07 first-authenticated-probe hardening:
- split_name_acronym: the API embeds acronyms as a "Name - ACR" suffix
  ("50001 Certified Professional - 50001 CP"); the matcher expects a clean
  name + separate acronym (the bulk file's column shape). Level tokens
  ("Firefighter - II") and mixed-case suffixes ("- AutoCAD") must survive.
- _api_rec / parse_rows: both lanes emit the same record shape.
- lane_api pagination (mocked api_get): sub-limit server page caps still
  enumerate fully; a server that ignores startRecord bails instead of
  spinning; the empty-keyword full pass skips the a-z/0-9 fan-out; a failing
  keyword fails soft.
"""
import importlib.util
import os
import sys
import urllib.parse

os.environ.setdefault("COS_USER_ID", "verify-user")
os.environ.setdefault("COS_API_TOKEN", "verify-token")

_HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "cos_sync", os.path.join(_HERE, "_sync_cos_certifications.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

fails = []


def check(label, got, want):
    ok = got == want
    print(("PASS" if ok else "FAIL"), label, "→", got if ok else f"{got!r} (want {want!r})")
    if not ok:
        fails.append(label)


# ── split_name_acronym ──
check("dash acronym", mod.split_name_acronym("Certified Welder - CW"),
      ("Certified Welder", "CW"))
check("spaced acronym", mod.split_name_acronym("50001 Certified Professional - 50001 CP"),
      ("50001 Certified Professional", "50001 CP"))
check("lowercase suffix kept", mod.split_name_acronym("Autodesk Certified Professional - AutoCAD"),
      ("Autodesk Certified Professional - AutoCAD", None))
check("roman level kept", mod.split_name_acronym("Firefighter - II"),
      ("Firefighter - II", None))
check("pure digits kept", mod.split_name_acronym("Crane Operator - 2000"),
      ("Crane Operator - 2000", None))
check("no dash", mod.split_name_acronym("Project Management Professional"),
      ("Project Management Professional", None))
check("plus acronym", mod.split_name_acronym("CompTIA A Plus - A+"),
      ("CompTIA A Plus", "A+"))
check("empty", mod.split_name_acronym(""), ("", None))
check("hyphen not spaced", mod.split_name_acronym("Level-II Inspector"),
      ("Level-II Inspector", None))

# ── _api_rec ──
r = mod._api_rec({"Id": "13512-B", "Name": "50001 Certified Professional - 50001 CP",
                  "Url": "https://x", "Organization": "Association of Energy Engineers",
                  "Type": "Advanced"})
check("_api_rec name split", (r["name"], r.get("acronym")),
      ("50001 Certified Professional", "50001 CP"))
check("_api_rec org/type/url", (r["org"], r["type"], r["url"]),
      ("Association of Energy Engineers", "Advanced", "https://x"))
r2 = mod._api_rec({"Id": "1", "Name": "X Cert - XC", "Organization": "O", "Acronym": "REAL"})
check("_api_rec explicit Acronym wins (name untouched)",
      (r2["name"], r2["acronym"]), ("X Cert - XC", "REAL"))
r3 = mod._api_rec({"Id": "2", "Name": "Y Cert", "Organization": "O", "InDemand": "true"})
check("_api_rec in_demand", r3.get("in_demand"), True)

# ── parse_rows bulk fallback split ──
certs = mod.parse_rows(["Certification Name", "Organization"],
                       [["Certified Welder - CW", "AWS"]])
check("parse_rows splits when no acronym col",
      (certs[0]["name"], certs[0].get("acronym")), ("Certified Welder", "CW"))
certs = mod.parse_rows(["Certification Name", "Organization", "Acronym"],
                       [["Certified Welder - CW", "AWS", "CW2"]])
check("parse_rows keeps explicit acronym col",
      (certs[0]["name"], certs[0]["acronym"]), ("Certified Welder - CW", "CW2"))

# ── lane_api pagination scenarios (mock api_get) ──
ALL = [{"Id": f"C{i}", "Name": f"Cert {i} - C{i}X", "Organization": "Org"}
       for i in range(600)]


def paged(records, page_size=500):
    def f(start):
        return {"RecordCount": len(records),
                "CertList": records[start - 1:start - 1 + page_size]}
    return f


def run_lane(pages):
    """pages: keyword → callable(start) → response dict. Unknown keyword →
    empty result. Trips at >500 calls so a runaway loop fails the check
    instead of hanging."""
    calls = {"n": 0, "log": []}

    def fake_api_get(path):
        calls["n"] += 1
        if calls["n"] > 500:
            raise SystemExit("RUNAWAY: >500 api calls")
        parts = path.split("/")
        kw = urllib.parse.unquote(parts[4])   # /v1/certificationfinder/{user}/{kw}/...
        kw = "" if kw == " " else kw
        start = int(parts[-2])
        calls["log"].append((kw, start))
        resp = pages.get(kw)
        if resp is None:
            return {"RecordCount": 0, "CertList": []}
        return resp(start)

    mod.api_get = fake_api_get
    return mod.lane_api(probe=False), calls


# S1: empty keyword covers all in well-behaved pages of 500 + 100.
out, calls = run_lane({"": paged(ALL)})
check("S1 full registry via empty kw", len(out), 600)
check("S1 skipped letter fan-out", all(k == "" for k, _ in calls["log"]), True)
check("S1 api calls", calls["n"], 2)

# S2: server caps pages at 100 (below our 500 limit) — still gets all 600.
out, calls = run_lane({"": paged(ALL, page_size=100)})
check("S2 sub-limit page cap still complete", len(out), 600)
check("S2 api calls", calls["n"], 6)


# S3: server ignores startRecord → identical first page forever; must bail
# fast, then dedupe the letter fan-out against what the stuck pass captured.
def stuck(start):
    return {"RecordCount": 5000, "CertList": ALL[:500]}


out, calls = run_lane({"": stuck, "a": paged(ALL[:50])})
check("S3 non-advancing pagination bails (no runaway)", calls["n"] < 50, True)
check("S3 unique count after dedupe", len(out), 500)


# S4: empty keyword errors → letters still enumerate + dedupe.
def boom(start):
    raise ValueError("HTTP 400 simulated")


out, calls = run_lane({"": boom, "a": paged(ALL[:300]), "b": paged(ALL[200:400])})
check("S4 fail-soft empty kw, letters dedupe", len(out), 400)

print()
print("FAILURES:", fails or "none")
sys.exit(1 if fails else 0)
