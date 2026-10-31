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

Writes library/adopt/adopt_data.json, which library/adopt/adopt.js reads. Runs daily from
daily-dashboard.yml after the Exhibits builder. It writes nothing anywhere else.

Usage, from the repo root:
  python3 kb/_build_adopt_page.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

SCHEMA = 1
OUT = "library/adopt/adopt_data.json"
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


def build(root):
    adoption = load_json(root, "kb/exhibits_adoption.json") or {}
    settled = settled_titles(load_json(root, "kb/unified_titles.json", {}))
    ref = load_js(root, "credential_reference_data.js")
    ref_by = {e.get("ut"): e for e in (ref.get("unified_titles") or []) if e.get("ut")}
    verified = load_json(root, "kb/reference/map_cpl_opportunities_verified.json", {}) or {}
    found, by_title = verified.get("found") or {}, verified.get("by_title") or {}
    lookup = college_lookup(root)
    shorts = short_names(root)

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
        creds.append(rec)

    # The type list sorts by name; renumber the credentials' indexes to match.
    order = sorted(range(len(types)), key=lambda i: types[i].lower())
    remap = {old: new for new, old in enumerate(order)}
    types = [types[i] for i in order]
    for c in creds:
        c["y"] = sorted(remap[i] for i in c["y"])

    used = {c.get("s") for c in creds if c.get("s")}
    sectors = {k: v for k, v in sorted((adoption.get("cip_sectors") or {}).items()) if k in used}
    return {
        "schema": SCHEMA,
        "_about": "The public adoption page (library/adopt/, kb/_build_adopt_page.py): settled credentials only "
                  "(a local title under it carries a person's or a rule's review stamp, Sam's Sheet 147 card 3). "
                  "colleges = [name, short, district, SW region, ASCCC Area]; per credential t = title, i = issuer, "
                  "y = CPL type indexes, s = CIP sector, p = the median articulating college's units, a = [[college, "
                  "units, credit lines]] for each college that articulated it, c = [[college, courses]] for each "
                  "college that already teaches a course mapped to its identity (never the TOP or C-ID overlap), "
                  "w = colleges withheld because the identity is over-merged, m = [[exhibit id, building college "
                  "index or -1, building college's name when it has no column]] for Request Quick Adopt.",
        "written_at": iso_now(),
        "sources": {"adoption": adoption.get("written_at"), "reference": ref.get("_generated_at"),
                    "map_links": verified.get("checked_at")},
        "counts": {"settled": len(creds), "held": held, "in_reference": len(adoption.get("credentials") or {})},
        "colleges": colleges,
        "sectors": sectors,
        "types": types,
        "credentials": creds,
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
    out = a.out or os.path.join(a.root, OUT)
    changed = write_if_changed(out, data)
    if not a.quiet:
        c = data["counts"]
        print("%s %s: %d settled credentials of %d (%d held), %d colleges"
              % ("wrote" if changed else "unchanged", os.path.relpath(out, a.root), c["settled"],
                 c["in_reference"], c["held"], len(data["colleges"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
