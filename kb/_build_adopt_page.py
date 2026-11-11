#!/usr/bin/env python3
"""_build_adopt_page.py — the public adoption page's data, settled credentials only.

Sam, Open Asks Sheet 147 (2026-10-31): the public adoption page lists settled credentials only,
a person's or a rule's stamp, "so it grows as the CER finishes" (card 3); it takes Malone's CPL/AI
look (card 4); and card 1's facts move EACR's college matrix, its statewide and college filters
(CIP sector, ASCCC Area, SW Region, District, College), its exports and Create Handout to it.
Sam named it the Credential Catalog (Open Asks Sheet 148 card 1, 2026-10-31).

Settled: a credential is listed when at least one local title under it in kb/unified_titles.json
carries a review stamp (`reviewed_at`), a person's or a procedure cohort's (`...@bot`). That is the
mock-up's "Reviewed" tile ("titles with a person's or a rule's stamp") and the Commons' stamp count.
A credential only the batch classifier named, with no stamp, waits in the Exhibits tab.

What it joins, all committed files:
  kb/exhibits_adoption.json           per credential: each articulating college's lines and units,
                                      the course each could-adopt college already teaches (never the
                                      TOP or C-ID overlap: Sam, 2026-09-24), the CIP sector, the peer
                                      median
  kb/unified_titles.json              the review stamps
  credential_reference_data.js        each credential's issuer and CPL types
  kb/reference/map_cpl_opportunities_verified.json
                                      the exhibit IDs MAP lists per credential and the college that
                                      built each, for Request Quick Adopt
  college_lookup.js                   each college's district, SW region and ASCCC Area
  kb/college_short_names.json         the column headers' short names

Worth a faculty review (the mock-up's list, built 2026-10-31 at Sam's go): Credential Engine's 50
most-referenced credentials that MAP has no exhibit for, from
  kb/reference/credential_engine_top50.json            the CTDL terms (occupations, industries, levels)
  kb/reference/credential_engine_top50_map_check.json  the hand check against the reference (the
                                                       catalog's own join missed 11 MAP holds)
  kb/it_ai_credential_catalog.json                     the CIP code (CE's own where it gives one)
A row is listed when its check says related or not_in_map, and dropped again the day the reference
gains a title of the same name. A top-50 row with no check waits until one is written.

Writes library/adopt/adopt_data.json, which library/adopt/adopt.js reads, and since 2026-11-06
(Sam: the catalog is "a good beginning for our credential registry", and the public sees every
credit status) library/adopt/adopt_more.json beside it: the credentials with another credit status,
read after the first paint. In the page's public words and the Commons' curation words:
  held       Being reviewed              a credential in the reference no stamped title names yet
  harvested  Not yet evaluated           kb/it_ai_credential_catalog.json rows no MAP exhibit covers
             Known to a college,         the catalog rows MAP holds an exhibit for with no
             no credit yet               articulation (map_status "exhibit, not yet articulated")
Runs daily from daily-dashboard.yml after the Exhibits builder. It writes nothing anywhere else.

Usage, from the repo root:
  python3 kb/_build_adopt_page.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import credential_aliases  # noqa: E402

SCHEMA = 2
OUT = "library/adopt/adopt_data.json"
OUT_MORE = "library/adopt/adopt_more.json"
OUT_AI = "library/adopt/adopt_ai.json"
CPL_AI_JOIN = "kb/cpl_ai/exhibit_join.json"
CPL_AI_INDEX = "kb/cpl_ai/hosted/index.json"
CPL_AI_SHARDS = "kb/cpl_ai/hosted/shards"
STATEWIDE_RECS = "fact-sheet/statewide_recs.js"
SRC_KEY = {"CareerOneStop": "cos", "Credential Engine": "ce", "Credential Engine (California licenses)": "ca",
           "issuer site": "iss", "MAP": "map"}
LINES_CAP = 3        # credit lines kept per college; the hover says how many in all
LINE_CHARS = 140     # a line past this is cut at a word


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(root, rel, default=None):
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_js(root, rel):
    """A generated `window.X = {...};` file as its object."""
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        src = f.read()
    start = re.search(r"window\.\w+\s*=\s*\{", src).end() - 1
    return json.loads(src[start:src.rindex("}") + 1])


def college_lookup(root):
    """college_lookup.js is hand-kept JS (unquoted keys, comments); read its rows by pattern."""
    with open(os.path.join(root, "college_lookup.js"), encoding="utf-8") as f:
        src = f.read()
    out = {}
    row = re.compile(r'^\s*"([^"]+)":\s*\{\s*district:\s*"([^"]*)",\s*swRegion:\s*"([^"]*)"'
                     r'(?:,\s*ascccArea:\s*"([^"]*)")?', re.M)
    for m in row.finditer(src):
        out[m.group(1)] = {"district": m.group(2), "region": m.group(3), "area": m.group(4) or ""}
    return out


def short_names(root):
    d = load_json(root, "kb/college_short_names.json", {}) or {}
    out = {}
    for r in d.get("colleges") or []:
        for name in [r.get("canonical")] + list(r.get("aliases") or []):
            if name:
                out[name] = r.get("short") or r.get("canonical")
    return out


def settled_titles(unified_titles):
    """The credentials at least one stamped local title names."""
    out = set()
    for v in (unified_titles or {}).values():
        if isinstance(v, dict) and v.get("reviewed_at") and v.get("unified_title"):
            out.add(v["unified_title"])
    return out


def clip(s):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    if len(s) <= LINE_CHARS:
        return s
    cut = s[:LINE_CHARS].rsplit(" ", 1)[0]
    return cut + "…"


def line_text(lines):
    """[[course, credit recommendation], ...] as one reading: 'CIS 75: 3 hours in ...; ...'."""
    parts = []
    for course, rec in lines[:LINES_CAP]:
        course, rec = (course or "").strip(), (rec or "").strip()
        parts.append(clip(course + (": " + rec if rec and course else rec)))
    more = len(lines) - LINES_CAP
    text = "; ".join(p for p in parts if p)
    if more > 0:
        text += "; and %d more" % more
    return text


# ── Worth a faculty review ────────────────────────────────────────────────────────────────
REVIEW_OCC = 3       # occupations named per card; the rest are counted
REVIEW_IND = 2       # industries named per card
REGISTRY = "https://credentialengineregistry.org/resources/"
# CTDL audience levels, low to high, in the page's words. Beginner, Intermediate and Advanced
# describe the learner, not the schooling, so they do not set the range.
LEVELS = [("Secondary School or Equivalent", "high school"), ("Post-Secondary Level", "postsecondary"),
          ("Associates Degree Level", "associate"), ("Bachelors Degree Level", "bachelor's"),
          ("Graduate Level", "graduate"), ("Masters Degree Level", "graduate"),
          ("Doctoral Degree Level", "graduate")]


def norm_title(t):
    """A title for comparison: case, marks and spacing folded."""
    return re.sub(r"[^a-z0-9]+", " ", str(t or "").lower().replace("©", "").replace("®", "")).strip()


def level_phrase(levels):
    words = []
    for key, w in LEVELS:
        if key in (levels or []) and w not in words:
            words.append(w)
    if not words:
        return ""
    if len(words) == 1:
        return words[0][0].upper() + words[0][1:]
    return words[0][0].upper() + words[0][1:] + " through " + words[-1]


def code6(code):
    """An O*NET-SOC code to its six-digit SOC (51-4121.06 -> 51-4121)."""
    return str(code or "").split(".")[0]


def review_rows(root, reference_titles):
    top = (load_json(root, "kb/reference/credential_engine_top50.json") or {}).get("credentials") or []
    checks = {c["ctid"]: c for c in (load_json(root, "kb/reference/credential_engine_top50_map_check.json") or {}).get("checks") or []}
    cat = {}
    for x in (load_json(root, "kb/it_ai_credential_catalog.json") or {}).get("credentials") or []:
        if x.get("ctid") and x["ctid"] not in cat:
            cat[x["ctid"]] = x
    have = {norm_title(t) for t in reference_titles}
    out, unchecked, joined, sector_titles = [], 0, 0, {}
    for c in sorted(top, key=lambda c: c.get("rank") or 999):
        x = cat.get(c["ctid"]) or {}
        chk = checks.get(c["ctid"])
        if not chk:
            if x.get("map_status") == "not in MAP":
                unchecked += 1
            continue
        if chk.get("verdict") not in ("related", "not_in_map"):
            continue
        if norm_title(c.get("name")) in have:
            joined += 1     # the reference gained it since the check; it is a catalog credential now
            continue
        occ, seen = [], set()
        for o in c.get("occupation_type") or []:
            k = code6(o.get("code"))
            if k and k not in seen:
                seen.add(k)
                occ.append("%s (%s)" % (o.get("name") or "", k))
        ind = ["%s (NAICS %s)" % (o.get("name") or "", o.get("code")) for o in (c.get("industry_type") or []) if o.get("code")]
        cip = x.get("cip") or {}
        owner = ((c.get("owned_by") or [{}])[0] or {}).get("name") or x.get("issuer") or ""
        rec = {"t": c.get("name"), "i": owner, "k": c["ctid"]}
        if occ:
            rec["o"] = occ[:REVIEW_OCC]
            if len(occ) > REVIEW_OCC:
                rec["on"] = len(occ) - REVIEW_OCC
        if ind:
            rec["n"] = ind[:REVIEW_IND]
            if len(ind) > REVIEW_IND:
                rec["nn"] = len(ind) - REVIEW_IND
        if cip.get("code"):
            rec["f"] = "%s (CIP %s)" % (cip.get("title") or "", cip["code"])
            if cip.get("sector"):
                rec["s"] = str(cip["sector"]).zfill(2)
                if cip.get("sector_title"):
                    sector_titles.setdefault(rec["s"], cip["sector_title"])
        lvl = level_phrase(c.get("audience_level"))
        if lvl:
            rec["l"] = lvl
        if c.get("subject_webpage"):
            rec["u"] = c["subject_webpage"]
        if chk.get("verdict") == "related" and chk.get("map_title") in reference_titles:
            rec["r"] = chk["map_title"]
        out.append(rec)
    return out, unchecked, joined, sector_titles


def more_rows(root, adoption, settled, ref_by, col_at, src_names):
    """The credentials with another credit status: held (in the reference, no stamp) and harvested
    (the industry credential catalog's rows, those no settled title already names)."""
    held = []
    for ut, e in sorted((adoption.get("credentials") or {}).items(), key=lambda kv: kv[0].lower()):
        if ut in settled:
            continue
        n = sum(1 for k in (e.get("a") or {}) if src_names[int(k)] in col_at)
        rec = {"t": ut, "n": n}
        r = ref_by.get(ut) or {}
        if r.get("issuer"):
            rec["i"] = r["issuer"]
        if e.get("s"):
            rec["s"] = e["s"]
        held.append(rec)
    have = {norm_title(t) for t in settled} | {norm_title(h["t"]) for h in held}
    harvested = []
    for x in (load_json(root, "kb/it_ai_credential_catalog.json") or {}).get("credentials") or []:
        if x.get("map_status") == "articulated" or norm_title(x.get("name")) in have:
            continue
        rec = {"t": x.get("name"), "i": x.get("issuer"), "k": x.get("kind")}
        cip = x.get("cip") or {}
        if cip.get("sector"):
            rec["s"] = str(cip["sector"]).zfill(2)
        if x.get("status") and x["status"] != "active":
            rec["st"] = x["status"]
        src = sorted({SRC_KEY.get(s, "ex") for s in (x.get("sources") or [])})
        if src:
            rec["src"] = src
        if x.get("ctid"):
            rec["ct"] = 1
        if x.get("skills"):
            rec["sk"] = len(x["skills"])
        if x.get("url"):
            rec["u"] = x["url"]
        if x.get("map_status") == "exhibit, not yet articulated":
            rec["ms"] = "inmap"
        harvested.append(rec)
    return held, harvested


def statewide_recs(root):
    """The Fact Sheet's statewide credit recommendations by credential title: [{t, u, cid, id}]."""
    try:
        with open(os.path.join(root, STATEWIDE_RECS), encoding="utf-8") as fh:
            src = fh.read()
        return json.loads(src[src.index("{"):src.rindex("}") + 1])
    except (OSError, ValueError):
        return {}


def cpl_ai(root, col_at):
    """CPL-AI's certifications joined to the common exhibits, as the badges and the college view read them.

    Sam, 2026-11-06 (SkyLantern's run): "feature statewide credit recommendations and CPL-AI recommendations on the
    Credential Catalog as badges" and "I do want the CPL-AI recs on public view". Per exhibit title, each joined
    certification with its tier counts and, per college, the courses CPL-AI rated against it, strongest first:
    [course code, course title, tier, skill areas matched, skill areas, course id]. A college is its column index
    when the Catalog has one, else CPL-AI's own name for it (Calbright). The full recommendation stays in the hosted
    shard (kb/cpl_ai/hosted/shards/<code>.json.gz), which the panel reads on request.
    """
    import gzip
    join = load_json(root, CPL_AI_JOIN, {}) or {}
    index = load_json(root, CPL_AI_INDEX, {}) or {}
    names = join.get("colleges") or {}
    by_code = {x.get("code"): x for x in index.get("credentials") or []}
    shards, out = {}, {}
    for ut, certs in sorted((join.get("by_exhibit") or {}).items()):
        rows = []
        for cert in certs:
            code = cert.get("code")
            if code not in shards:
                try:
                    with gzip.open(os.path.join(root, CPL_AI_SHARDS, code + ".json.gz"), "rt", encoding="utf-8") as fh:
                        shards[code] = json.load(fh)
                except (OSError, ValueError):
                    shards[code] = None
            sh = shards[code]
            if not sh:
                continue
            courses, by_col = sh.get("courses") or {}, {}
            for pr in sh.get("pairs") or []:
                co = courses.get(pr.get("course")) or {}
                raw = co.get("college") or ""
                ours = names.get(raw, raw) if raw in names else raw
                key = str(col_at[ours]) if ours in col_at else (raw or "?")
                by_col.setdefault(key, []).append([co.get("code") or "", clip(co.get("title") or "")[:80],
                                                   pr.get("tier") or 3, pr.get("matched_n") or 0,
                                                   pr.get("domains_n") or 0, pr.get("course") or ""])
            for v in by_col.values():
                v.sort(key=lambda x: (x[2], -(x[3] / x[4] if x[4] else 0), x[0]))
            ix = by_code.get(code) or {}
            desc = (sh.get("credential") or {}).get("description") or ""
            rows.append({"code": code, "title": cert.get("title") or ix.get("title") or code, "kind": cert.get("kind"),
                         "by_tier": ix.get("by_tier") or {}, "colleges": ix.get("colleges") or len(by_col),
                         "d": desc[:420], "by_college": dict(sorted(by_col.items(), key=lambda kv: kv[0]))})
        if rows:
            out[ut] = rows
    return out, index


def build(root):
    adoption = load_json(root, "kb/exhibits_adoption.json") or {}
    aka = credential_aliases.load(root)
    settled = settled_titles(load_json(root, "kb/unified_titles.json", {}))
    ref = load_js(root, "credential_reference_data.js")
    ref_by = {e.get("ut"): e for e in (ref.get("unified_titles") or []) if e.get("ut")}
    verified = load_json(root, "kb/reference/map_cpl_opportunities_verified.json", {}) or {}
    found, by_title = verified.get("found") or {}, verified.get("by_title") or {}
    lookup = college_lookup(root)
    shorts = short_names(root)
    recs = statewide_recs(root)

    src_names = adoption.get("colleges") or []
    # Columns are California community colleges only: a name college_lookup.js does not hold
    # (California State University Los Angeles, 2026-10-31) is not one, so it takes no column.
    keep = sorted({n for n in src_names if n in lookup}, key=str.lower)
    col_at = {n: i for i, n in enumerate(keep)}
    colleges = [[n, shorts.get(n, n), lookup[n]["district"], lookup[n]["region"], lookup[n]["area"]] for n in keep]

    types, type_at = [], {}
    creds = []
    held = 0
    for ut, e in sorted((adoption.get("credentials") or {}).items(), key=lambda kv: kv[0].lower()):
        if ut not in settled:
            held += 1
            continue
        r = ref_by.get(ut) or {}
        art = []
        for k, (units, lines) in (e.get("a") or {}).items():
            name = src_names[int(k)]
            if name in col_at:
                art.append([col_at[name], units or 0, line_text(lines or [])])
        could = []
        for k, rows in (e.get("c") or {}).items():
            name = src_names[int(k)]
            if name in col_at and name not in {src_names[int(j)] for j in (e.get("a") or {})}:
                could.append([col_at[name], ", ".join(sorted({(row[0] or "").strip() for row in rows if row and row[0]}))])
        if not art and not could:
            continue
        ids = []
        for xid in by_title.get(ut) or []:
            builder = ((found.get(xid) or {}).get("college")) or ""
            ids.append([xid, col_at.get(builder, -1), builder if builder not in col_at else ""])
        ytypes = []
        for t in r.get("cpl_types") or []:
            if t not in type_at:
                type_at[t] = len(types)
                types.append(t)
            ytypes.append(type_at[t])
        rec = {"t": ut, "a": sorted(art), "y": ytypes}
        if aka.get(ut):
            # The titles it carried before a rename or a merge: the search still finds it by them (Sam,
            # 2026-11-11: "Approved renames keep the old title as a search alias").
            rec["aka"] = aka[ut]
        if r.get("issuer"):
            rec["i"] = r["issuer"]
        if e.get("s"):
            rec["s"] = e["s"]
        if e.get("p") is not None:
            rec["p"] = e["p"]
        if could:
            rec["c"] = sorted(could)
        if e.get("w"):
            rec["w"] = e["w"]
        if ids:
            rec["m"] = ids
        if recs.get(ut):
            rec["sw"] = recs[ut]
        creds.append(rec)

    # The type list sorts by name; renumber the credentials' indexes to match.
    order = sorted(range(len(types)), key=lambda i: types[i].lower())
    remap = {old: new for new, old in enumerate(order)}
    types = [types[i] for i in order]
    for c in creds:
        c["y"] = sorted(remap[i] for i in c["y"])

    review, unchecked, joined, review_sectors = review_rows(root, set((adoption.get("credentials") or {}).keys()))
    held_rows, harvested = more_rows(root, adoption, settled, ref_by, col_at, src_names)
    ai, ai_index = cpl_ai(root, col_at)
    for c in creds + held_rows + harvested:  # the badges: a statewide recommendation, a CPL-AI course match
        if c.get("t") in ai:
            c["ai"] = len(ai[c["t"]])
        if c not in creds and recs.get(c.get("t")):
            c["sw"] = recs[c["t"]]
    used = {c.get("s") for c in creds + review + held_rows + harvested if c.get("s")}
    # A review row's sector the adoption file does not name takes the catalog's CIP sector title.
    names = dict(review_sectors)
    for x in (load_json(root, "kb/it_ai_credential_catalog.json") or {}).get("credentials") or []:
        cip = x.get("cip") or {}
        if cip.get("sector") and cip.get("sector_title"):
            names.setdefault(str(cip["sector"]).zfill(2), cip["sector_title"])
    names.update(adoption.get("cip_sectors") or {})
    sectors = {k: v for k, v in sorted(names.items()) if k in used}
    more = {
        "schema": SCHEMA,
        "_about": "The public adoption page's other credit statuses (kb/_build_adopt_page.py), read after adopt_data.json. "
                  "held = in the reference, no stamped title yet (Being reviewed): t, i, s, n = colleges with an exhibit. "
                  "harvested = the industry credential catalog's rows no exhibit covers (Not yet evaluated), or with an "
                  "exhibit and no articulation (ms = inmap, Known to a college, no credit yet): t, i, k = kind, s = CIP "
                  "sector, st = status when not active, src = sources (cos CareerOneStop, ce Credential Engine, ca "
                  "California license, iss the issuer's page, map), ct = has a CTID, sk = issuer skill areas, u = the "
                  "issuer's page. Sector names for these live in adopt_data.json's sectors.",
        "written_at": iso_now(),
        "counts": {"held": len(held_rows), "harvested": sum(1 for h in harvested if h.get("ms") != "inmap"),
                   "inmap": sum(1 for h in harvested if h.get("ms") == "inmap")},
        "held": held_rows,
        "harvested": harvested,
    }
    return {
        "schema": SCHEMA,
        "_about": "The public adoption page (library/adopt/, kb/_build_adopt_page.py): settled credentials only "
                  "(a local title under it carries a person's or a rule's review stamp, Sam's Sheet 147 card 3). "
                  "colleges = [name, short, district, SW region, ASCCC Area]; per credential t = title, i = issuer, "
                  "y = CPL type indexes, s = CIP sector, p = the median articulating college's units, a = [[college, "
                  "units, credit lines]] for each college that articulated it, c = [[college, courses]] for each "
                  "college that already teaches a course mapped to its identity (never the TOP or C-ID overlap), "
                  "w = colleges withheld because the identity is over-merged, m = [[exhibit id, building college "
                  "index or -1, building college's name when it has no column]] for Request Quick Adopt. review = Worth "
                  "a faculty review, Credential Engine's most-referenced credentials MAP has no exhibit for: t, i, "
                  "k = CTID, o = occupations (on more), n = industries (nn more), f = field (CIP), s = CIP sector, "
                  "l = level, u = the issuer's page, r = the related credential MAP holds from the same issuer.",
        "written_at": iso_now(),
        "sources": {"adoption": adoption.get("written_at"), "reference": ref.get("_generated_at"),
                    "map_links": verified.get("checked_at")},
        "counts": {"settled": len(creds), "held": held,
                   "statewide": sum(1 for c in creds + held_rows + harvested if c.get("sw")),
                   "cplai": sum(1 for c in creds + held_rows + harvested if c.get("ai")), "in_reference": len(adoption.get("credentials") or {}),
                   "review": len(review), "review_unchecked": unchecked, "review_joined": joined,
                   "more_held": more["counts"]["held"], "more_harvested": more["counts"]["harvested"],
                   "more_inmap": more["counts"]["inmap"]},
        "colleges": colleges,
        "sectors": sectors,
        "types": types,
        "credentials": creds,
        "review": review,
        "_more": more,
        "_ai": {
            "schema": SCHEMA,
            "_about": "CPL-AI's course ratings for the Credential Catalog's badges and college view "
                      "(kb/_build_adopt_page.py, from kb/cpl_ai/). Per exhibit title, each joined certification: code, "
                      "title, kind (exact or related), by_tier = pairs per tier, colleges, d = its description, and "
                      "by_college = {college column index, or CPL-AI's name where the Catalog has no column: [[course "
                      "code, course title, tier, skill areas matched, skill areas, course id]]}, strongest first. The "
                      "full recommendation is kb/cpl_ai/hosted/shards/<code>.json.gz, pair id <code>_<course id>. colleges = "
                      "the college column names, in index order.",
            "written_at": iso_now(),
            "page": ai_index.get("page"), "credit": ai_index.get("credit"), "caveat": ai_index.get("caveat"),
            "tiers": ai_index.get("tiers") or {},
            # The college column names, so a reader without adopt_data.json (Sierra) resolves a
            # by_college index to its college (SkyFern, 2026-11-07).
            "colleges": [c[0] for c in colleges],
            "counts": {"exhibits": len(ai), "certifications": len({r["code"] for v in ai.values() for r in v})},
            "by_exhibit": ai,
        },
    }


def dump(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def write_if_changed(path, data):
    """Leave the file alone when nothing but its stamp would change."""
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                old = json.load(f)
            strip = lambda d: {k: v for k, v in (d or {}).items() if k != "written_at"}  # noqa: E731
            if strip(old) == strip(data):
                return False
        except (OSError, ValueError):
            pass
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(dump(data))
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--out", default=None)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    data = build(a.root)
    more = data.pop("_more")
    ai = data.pop("_ai")
    out = a.out or os.path.join(a.root, OUT)
    changed = write_if_changed(out, data)
    out_more = (os.path.join(os.path.dirname(out), os.path.basename(OUT_MORE)) if a.out else os.path.join(a.root, OUT_MORE))
    changed_more = write_if_changed(out_more, more)
    out_ai = (os.path.join(os.path.dirname(out), os.path.basename(OUT_AI)) if a.out else os.path.join(a.root, OUT_AI))
    changed_ai = write_if_changed(out_ai, ai)
    if not a.quiet:
        c = data["counts"]
        print("%s %s: %d settled credentials of %d (%d held), %d colleges; %d worth a faculty review (%d unchecked)"
              % ("wrote" if changed else "unchanged", os.path.relpath(out, a.root), c["settled"],
                 c["in_reference"], c["held"], len(data["colleges"]), c["review"], c["review_unchecked"]))
        print("%s %s: %d being reviewed, %d not yet evaluated, %d known to a college with no credit yet"
              % ("wrote" if changed_more else "unchanged", os.path.relpath(out_more, a.root),
                 more["counts"]["held"], more["counts"]["harvested"], more["counts"]["inmap"]))
        print("%s %s: %d exhibits joined to %d CPL-AI certifications; %d credentials with a statewide recommendation"
              % ("wrote" if changed_ai else "unchanged", os.path.relpath(out_ai, a.root), ai["counts"]["exhibits"],
                 ai["counts"]["certifications"], c["statewide"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
