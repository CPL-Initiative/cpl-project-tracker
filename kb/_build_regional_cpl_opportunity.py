#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""What CPL can THIS college create or adopt, against the occupations its REGION needs?

Built for the CPL Initiative's regional college meetings (Sam, Ashley and Sigrid,
2026-09-16). A college sits in the room and wants one thing: show me, against the
occupations my area actually has, what I could award CPL for today and what I would
have to build. Fifth instrument in the San Joaquin crosswalk lineage, and the first
that takes the REGION's occupation list rather than one partner's:

  kb/_build_partner_crosswalk.py           a partner's occupations -> CPL, statewide
  kb/_build_college_offering_crosswalk.py  those occupations -> ONE college, hand-curated
  kb/_build_domain_cpl_crosswalk.py        a DOMAIN -> every college, where the chain breaks
  kb/_build_occupation_cpl_crosswalk.py    an occupation -> every verified exhibit/college/course
  kb/_build_regional_cpl_opportunity.py    THIS ONE: a region's occupations x one college

THE DELIVERABLE IS THE CROSS, NOT EITHER COLUMN
-----------------------------------------------
Inherited unchanged from the Delta run, and it is the whole point:

                    | exhibit exists, college on it | exists, not on it | nothing anywhere
    college teaches |  ADOPT NOW (paperwork only)   |  ADOPT            |  BUILD FIRST-IN-STATE
    partial         |  ...                          |  ...              |  ...
    teaches nothing |  (not this college's move)    |  ...              |  (not a CPL question)

⚠️ "No exhibit exists anywhere" and "an exhibit exists and this college is not on
it" are the SAME EMPTY CELL and OPPOSITE next steps. Never collapse them.

EVERY MATCH IS A CANDIDATE WITH ITS EVIDENCE ATTACHED
-----------------------------------------------------
The Delta run answered "does this college teach it" from a HAND-CURATED offering map
-- 139 subject-matter rulings for one college. That does not scale to a region, so
here the match is MECHANICAL and is never presented as a determination. Every row
carries the program title, the course code and the exhibit title that produced it,
so the college staff in the room can confirm or kill it on sight. In a regional
meeting the curator IS in the room; this tool's job is to put a short, checkable
list in front of them, not to decide.

⚠️ A CAPABILITY CAN BE INVISIBLE TO A PROGRAM SEARCH (Delta run, 2026-08-19): its
10-course plumbing apprenticeship sits under no plumbing-named COCI program and the
prefix reads as construction. So the COURSE catalog is searched too, and a course-only
hit is reported as `partial`, never as `none`.

    python3 kb/_build_regional_cpl_opportunity.py \
        --college "Santa Rosa Junior College" \
        --occupations kb/reference/bay_region_coe_demand_2024_2029.json \
        --region-label "Bay Region"

Outputs to kb/regional_cpl_out/<date>-<slug>/ : the workbook, the HTML page, and
crosswalk.json (the run receipt). Per the artifact policy the workbook and page are
REGENERABLE and are not committed; the receipt is.
"""
import argparse, datetime, html, json, math, os, re, sys
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_window_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        s = fh.read()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


def jload(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return json.load(fh)


# ── tokenizing ───────────────────────────────────────────────────────────────
# SOC titles are long and full of connective tissue ("Except", "All Other").
# Stopping them is what keeps "Helpers, Except ..." from matching everything.
STOP = set("""a an and or of the for to in on with without except all other others general
miscellaneous not elsewhere classified including includes level entry first line workers worker
occupations occupation specialists specialist technicians technician assistants assistant
managers manager supervisors supervisor helpers helper operators operator installers installer
repairers repairer tenders tender setters setter services service related support
""".split())


EXCEPT = re.compile(r",?\s*\b(except|excluding|other than)\b[^,;]*", re.I)
ALLOTHER = re.compile(r",?\s*\ball other\b.*$", re.I)


def clean_title(s):
    """Strip the exclusion clauses SOC titles use. 'Dispatchers, Except Police,
    Fire, and Ambulance' is about dispatchers and is explicitly NOT about police
    or fire; tokenizing the whole string inverts its meaning."""
    return ALLOTHER.sub("", EXCEPT.sub("", s or "")).strip(" ,;")


def toks(s):
    return [t for t in re.split(r"[^a-z0-9]+", (s or "").lower())
            if len(t) > 2 and t not in STOP]


def stem(t):
    for suf in ("ing", "ers", "er", "ors", "or", "ies", "es", "s"):
        if len(t) > 4 and t.endswith(suf):
            return t[: -len(suf)]
    return t


def tokset(s):
    return {stem(t) for t in toks(s)}


class Matcher:
    """Conservative title matcher. A hit needs either two shared significant
    tokens, or one token rare enough across the corpus to carry alone
    ('cosmetology' does; 'medical' does not). Rarity is measured, not guessed."""

    def __init__(self, corpus):
        self.df = Counter()
        self.n = max(1, len(corpus))
        for s in corpus:
            for t in tokset(clean_title(s)):
                self.df[t] += 1

    def idf(self, t):
        return math.log(self.n / (1 + self.df.get(t, 0)))

    def rare(self, t):
        # present in under ~2% of the corpus -> distinctive enough to stand alone
        return self.df.get(t, 0) <= max(1, int(0.02 * self.n))

    def hit(self, a, b):
        """`a` is the occupation, `b` the candidate. A shared token is not enough:
        the shared set must COVER a real share of the occupation's meaning.
        Measured 2026-09-16 — without coverage, Santa Rosa returned 233 "adopt
        now" rows against Delta's 42, and the samples were wrong (a solar
        programme for Security and Fire Alarm Installers, Medical Assisting for
        Diagnostic Medical Sonographers). Generic words like "medical" and
        "manufacturing" clear a rarity test on a 150-row corpus while carrying
        almost no meaning; coverage is what rejects them."""
        A, B = tokset(clean_title(a)), tokset(clean_title(b))
        if not A:
            return None
        shared = A & B
        if not shared:
            return None
        cover = len(shared) / len(A)
        ok = (len(shared) >= 2 and cover >= 0.50) or \
             (len(shared) == 1 and cover >= 0.50 and all(self.df.get(t, 0) <= 2 for t in shared))
        if not ok:
            return None
        return dict(shared=sorted(shared), cover=round(cover, 2),
                    score=round(sum(self.idf(t) for t in shared), 2))
        if len(shared) >= 2 or any(self.rare(t) for t in shared):
            return dict(shared=sorted(shared),
                        score=round(sum(self.idf(t) for t in shared), 2))
        return None


# ── identity ─────────────────────────────────────────────────────────────────
def make_resolver():
    """College name -> canonical, through the committed roster. Never hand-rolled:
    COCI ships SHORT_CAPS ('ALAMEDA'), MAP ships display names."""
    DM = jload("kb/fire_electrical_domain_map.json")
    roster = jload("kb/college_short_names.json")["colleges"]
    ALIAS = DM["join"]["aliases"]
    FOLD = {k: v for k, v in DM["join"]["folds"].items() if not k.startswith("_")}
    caps = {c["short_caps"]: c["canonical"] for c in roster}

    def norm(s):
        s = (s or "").lower().replace("ñ", "n")
        s = re.sub(r"\b(community|junior|college)\b", "", s)
        return re.sub(r"[^a-z0-9]+", "", s)

    n2c = {}
    for c in roster:
        for k in [c["canonical"], c["short"], c["short_caps"]] + c.get("aliases", []):
            n2c.setdefault(norm(k), c["canonical"])

    def R(n):
        n = FOLD.get(n, n)
        r = ALIAS.get(n) or caps.get(n) or n2c.get(norm(n))
        return FOLD.get(r, r) if r else None
    return R, DM


# ── who is in the room ───────────────────────────────────────────────────────
IDENTITY = "kb/college_identity/2026-08-23/crosswalk.json"


def identity_rows():
    """The committed college/district taxonomy: 120 entities, 73 districts.
    ⚠️ IT CARRIES NO REGION FIELD OF ANY KIND — checked 2026-09-16. Strong
    Workforce consortia and ASCCC areas exist nowhere in this repo, which is why
    `college_briefing.js` ships those two scopes DISABLED with their reason. Do
    not substitute the ~10-way `college_geo.region` proximity scheme: SWP has
    eight consortia on different boundaries, and mis-grouping a college's peers
    on a page people act on is worse than the filter being absent."""
    return jload(IDENTITY)["colleges"]


def select_colleges(names, districts, region, R):
    """Resolve a multi-select into a set of canonical college names, and say
    where each came from so the page can show the filter that produced it."""
    rows = identity_rows()
    by_district = defaultdict(list)
    for r in rows:
        if r.get("district") and r.get("entity_kind") == "college":
            by_district[r["district"]].append(r["college_name"])

    picked, why = {}, {}
    for n in (names or []):
        c = R(n) or n
        picked[c] = True
        why[c] = "college"
    for d in (districts or []):
        matches = [k for k in by_district if k.lower() == d.lower()] or \
                  [k for k in by_district if d.lower() in k.lower()]
        if not matches:
            raise SystemExit("No district matches %r. Known districts: %d — try e.g. %r"
                             % (d, len(by_district), sorted(by_district)[0]))
        for k in matches:
            for c in by_district[k]:
                c = R(c) or c
                picked.setdefault(c, True)
                why.setdefault(c, "district: %s" % k)
    if region:
        DM = jload("kb/fire_electrical_domain_map.json")
        for r in DM["receipts"]["college_courses"]:
            if r["region"].lower() == region.lower():
                c = R(r["college"]) or r["college"]
                picked.setdefault(c, True)
                why.setdefault(c, "region: %s" % r["region"])
    return sorted(picked), why


# ── the college's own capability ─────────────────────────────────────────────
def college_capability(college, R):
    """What this college actually offers: Active/Approved COCI programs (CTE flagged)
    and its full course catalog. Both, because a capability can be invisible to a
    program search."""
    d = load_window_json("coci_programs_data.js")
    CO, AW, ST = d["colleges"], d["awards"], d["statuses"]
    progs = []
    for r in d["rows"]:
        if R(CO[r[0]]) != college or ST[r[6]] not in ("Active", "Approved"):
            continue
        progs.append(dict(title=r[2].strip(), award=AW[r[5]], units=r[7], cte=(r[9] == 1)))

    t = load_window_json("tmc_college_courses.js")
    names, courses = t["colleges"], t["courses"]
    cat = []
    for i, nm in enumerate(names):
        if R(nm) != college:
            continue
        for row in (courses.get(str(i)) or []):
            cat.append(dict(subj=str(row[0]).strip(), num=str(row[1]).strip(),
                            title=str(row[2]).strip()))
    return progs, cat


# ── MAP: which credentials exist, and is this college on them ────────────────
def map_exhibits(_unused=None):
    """unified title -> exhibit ids, adopters, potential, cpl types, discipline."""
    sw = load_window_json("statewide_data.js")
    info = defaultdict(lambda: dict(ids=set(), adopt=set(), pot=set(), types=set(),
                                    disc=set(), statewide=False))
    for e in sw["exhibits"]:
        ut = e.get("unified_title") or e.get("title")
        i = info[ut]
        for x in (e.get("exhibit_ids") or [e.get("exhibit_id")]):
            if x:
                i["ids"].add(x)
        i["adopt"].update(e.get("adopter_names") or [])
        i["pot"].update(e.get("potential_names") or [])
        if e.get("cpl_type"):
            i["types"].add(e["cpl_type"])
        if e.get("discipline"):
            i["disc"].add(e["discipline"])
        if e.get("collaborative_type") == "CCC Collaborative":
            i["statewide"] = True
    return info


# ── the cross ────────────────────────────────────────────────────────────────
FIT_ORDER = {"confirmed": 0, "partial": 1, "none": 2}
EX_ORDER = {"on_it": 0, "exists": 1, "nowhere": 2}

PRIORITY = {
    ("confirmed", "exists"):   ("P1", "Adopt now — you teach it, the exhibit exists, you are not on it"),
    ("confirmed", "on_it"):    ("P0", "Already yours — you teach it and you are on the exhibit"),
    ("confirmed", "nowhere"):  ("P2", "Build first-in-state — you teach it, no exhibit exists anywhere"),
    ("partial", "exists"):     ("P3", "Check the fit — courses look close, the exhibit exists"),
    ("partial", "on_it"):      ("P3", "Check the fit — you are on the exhibit, programs are indirect"),
    ("partial", "nowhere"):    ("P4", "Build later — partial capability, nothing to adopt"),
    ("none", "exists"):        ("P5", "Not yours today — the exhibit exists, you do not teach it"),
    ("none", "on_it"):         ("P5", "On the exhibit without the programs — worth a look"),
    ("none", "nowhere"):       ("P6", "Out of scope — no capability, no exhibit"),
}


def build(colleges, occ_path, region_label, why=None):
    """Cross a region's occupation list against EVERY selected college at once.
    The exhibit match is college-independent, so it is computed once and only the
    adoption check varies per college — 541 occupations x 2,617 exhibit titles is
    the expensive half and it should not run N times."""
    R, DM = make_resolver()
    canon_all = [R(c) or c for c in colleges]
    ex = map_exhibits(None)

    occ_doc = jload(occ_path)
    occs = occ_doc["occupations"] if isinstance(occ_doc, dict) else occ_doc

    ex_titles = list(ex.keys())
    mx = Matcher(ex_titles)
    occ_ex = {}
    for o in occs:
        t = o.get("title") or o.get("occupation") or ""
        hits = [(x, h) for x in ex_titles if (h := mx.hit(t, x))]
        hits.sort(key=lambda z: -z[1]["score"])
        occ_ex[t] = [x for x, _ in hits[:4]]

    per = {}
    for canon in canon_all:
        per[canon] = build_one(canon, occs, occ_ex, ex, R)

    agg = aggregate(occs, per, occ_ex, ex, canon_all)
    return dict(colleges=canon_all, why=why or {}, region=region_label,
                n_occupations=len(agg), per_college={c: v["summary"] for c, v in per.items()},
                rows=agg, detail=per)


def build_one(canon, occs, occ_ex, ex, R):
    progs, cat = college_capability(canon, R)
    mp = Matcher([p["title"] for p in progs])
    mc = Matcher([c["title"] for c in cat])
    rows = []
    for o in occs:
        title = o.get("title") or o.get("occupation") or ""
        if not title:
            continue

        pm = [(p, h) for p in progs if (h := mp.hit(title, p["title"]))]
        pm.sort(key=lambda x: -x[1]["score"])
        cm = [(c, h) for c in cat if (h := mc.hit(title, c["title"]))]
        cm.sort(key=lambda x: -x[1]["score"])
        fit = "confirmed" if pm else ("partial" if cm else "none")

        xt = occ_ex.get(title, [])
        on_it = [t for t in xt if canon in ex[t]["adopt"]]
        st = "on_it" if on_it else ("exists" if xt else "nowhere")

        pri, label = PRIORITY[(fit, st)]
        rows.append(dict(
            occupation=title, soc=o.get("soc", ""), education=o.get("education", ""),
            fit=fit, exhibit_status=st, priority=pri, priority_label=label,
            programs=[p["title"] for p, _ in pm[:4]],
            program_evidence="; ".join(sorted({t for _, h in pm[:4] for t in h["shared"]})),
            courses=[f"{c['subj']} {c['num']} — {c['title']}" for c, _ in cm[:5]],
            exhibits=xt[:4],
            exhibit_ids=sorted({i for t in xt[:4] for i in ex[t]["ids"]})[:4],
            exhibits_adopted=on_it[:4],
            cpl_types=sorted({y for t in xt[:4] for y in ex[t]["types"]}),
            n_programs=len(pm), n_courses=len(cm), n_exhibits=len(xt)))

    rows.sort(key=lambda r: (r["priority"], -r["n_programs"], r["occupation"].lower()))
    grid = Counter((r["fit"], r["exhibit_status"]) for r in rows)
    return dict(rows=rows, summary=dict(
        college=canon, n_programs=len(progs), n_cte=sum(1 for p in progs if p["cte"]),
        n_courses=len(cat),
        adopt_now=grid.get(("confirmed", "exists"), 0),
        already=grid.get(("confirmed", "on_it"), 0),
        build=grid.get(("confirmed", "nowhere"), 0)))


def aggregate(occs, per, occ_ex, ex, colleges):
    """One row per OCCUPATION, naming which colleges could act and how. A regional
    meeting has several colleges in the room; the useful unit is the occupation,
    with the colleges listed against it — not N separate reports to cross-read."""
    byocc = {}
    for c in colleges:
        for r in per[c]["rows"]:
            byocc.setdefault(r["occupation"], {})[c] = r
    out = []
    for o in occs:
        t = o.get("title") or o.get("occupation") or ""
        if not t or t not in byocc:
            continue
        m = byocc[t]
        teaches = [c for c in colleges if m[c]["fit"] == "confirmed"]
        partial = [c for c in colleges if m[c]["fit"] == "partial"]
        xt = occ_ex.get(t, [])
        on_it = [c for c in colleges if m[c]["exhibit_status"] == "on_it"]
        adopt = [c for c in teaches if c not in on_it and xt]
        build = [c for c in teaches if not xt]
        if xt:
            head = "Adopt" if adopt else ("Already held" if on_it else "Exhibit exists")
        else:
            head = "Build first-in-state" if teaches else "No exhibit, no programs"
        out.append(dict(
            occupation=t, soc=o.get("soc", ""), education=o.get("education", ""),
            headline=head, exhibits=xt[:3],
            exhibit_ids=sorted({i for x in xt[:3] for i in ex[x]["ids"]})[:3],
            n_teaching=len(teaches), teaching=teaches,
            n_partial=len(partial), partial=partial,
            already_on_it=on_it, could_adopt=adopt, could_build=build,
            evidence={c: (m[c]["programs"][:2] or m[c]["courses"][:2]) for c in teaches}))
    rank = {"Adopt": 0, "Build first-in-state": 1, "Already held": 2,
            "Exhibit exists": 3, "No exhibit, no programs": 4}
    out.sort(key=lambda r: (rank[r["headline"]], -r["n_teaching"], r["occupation"].lower()))
    return out


# ── outputs ──────────────────────────────────────────────────────────────────
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

NAVY, LIGHT, RULE = "002F6D", "EEF3FA", "C9D6E8"
COLS = [("What to do", 22), ("Occupation", 42), ("SOC", 10), ("Entry level", 26),
        ("Colleges that teach it", 15), ("Could adopt — the exhibit exists", 46),
        ("Could build — no exhibit anywhere", 46), ("Already on the exhibit", 34),
        ("MAP exhibit", 40), ("Exhibit ID", 22)]
KEYS = ["headline", "occupation", "soc", "education", "n_teaching", "could_adopt",
        "could_build", "already_on_it", "exhibits", "exhibit_ids"]


def write_workbook(path, res):
    wb = Workbook(); ws = wb.active; ws.title = "CPL Opportunities"
    thin = Side(style="thin", color=RULE)
    for i, (h, w) in enumerate(COLS, 1):
        c = ws.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF", size=11)
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 30; ws.freeze_panes = "A2"
    for ri, r in enumerate(res["rows"], start=2):
        for ci, k in enumerate(KEYS, 1):
            v = r[k]
            if isinstance(v, list): v = "; ".join(v)
            c = ws.cell(row=ri, column=ci, value=v)
            c.alignment = Alignment(vertical="top", wrap_text=k not in ("soc", "n_teaching"))
            c.border = Border(bottom=thin)
            if ri % 2 == 0: c.fill = PatternFill("solid", fgColor=LIGHT)
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{max(2, len(res['rows'])+1)}"

    w2 = wb.create_sheet("Colleges in this view")
    for i, (h, w) in enumerate([("College", 36), ("Why it is here", 34), ("Programs", 12),
                                ("CTE", 10), ("Courses", 12), ("Could adopt", 14),
                                ("Could build", 14), ("Already held", 14)], 1):
        c = w2.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=NAVY)
        w2.column_dimensions[get_column_letter(i)].width = w
    for ri, (col, sm) in enumerate(sorted(res["per_college"].items()), start=2):
        for ci, v in enumerate([col, res["why"].get(col, ""), sm["n_programs"], sm["n_cte"],
                                sm["n_courses"], sm["adopt_now"], sm["build"], sm["already"]], 1):
            w2.cell(row=ri, column=ci, value=v).alignment = Alignment(vertical="top")

    w3 = wb.create_sheet("How to read this")
    for i, (h, w) in enumerate([("Field", 28), ("Detail", 110)], 1):
        c = w3.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=NAVY)
        w3.column_dimensions[get_column_letter(i)].width = w
    notes = [
        ("What a row is", "One job the region has. The columns say which of the selected colleges "
                          "could act on it, and how."),
        ("Could adopt", "The college teaches it and a MAP exhibit already exists, but the college is "
                        "not on that exhibit. This is an articulation — paperwork, not new curriculum."),
        ("Could build", "The college teaches it and no exhibit exists anywhere in California. Whoever "
                        "does it is first in the state."),
        ("Two kinds of blank", "'An exhibit exists and we are not on it' and 'no exhibit exists' look "
                               "identical in a spreadsheet and are opposite next steps. They are kept "
                               "in separate columns on purpose."),
        ("EVERY MATCH IS A CANDIDATE", "Matches are made by comparing wording, not by a curriculum "
                                       "review. Some will be wrong. The programs and courses behind "
                                       "each one are in the receipt so a college can reject it on "
                                       "sight. Faculty decide, always."),
        ("Region occupation list", res["region"]),
        ("Colleges selected", "%d — see the 'Colleges in this view' sheet" % len(res["colleges"])),
        ("Built", datetime.date.today().isoformat()),
        ("Sources", "CCCCO COCI program export and per-college course catalog; MAP statewide exhibit "
                    "extract; the region's occupation list as supplied."),
        ("Questions", "MAP@rccd.edu"),
    ]
    for ri, (k, v) in enumerate(notes, start=2):
        a = w3.cell(row=ri, column=1, value=k); a.font = Font(bold=True)
        a.alignment = Alignment(vertical="top")
        w3.cell(row=ri, column=2, value=v).alignment = Alignment(vertical="top", wrap_text=True)
    wb.save(path)


PAGE_CSS = """
:root{--ink:#11223a;--muted:#55637a;--line:#c9d6e8;--bg:#f4f7fb;--card:#ffffff;
--navy:#002f6d;--cobalt:#0047ab;--soft:#eef3fa;--accent:#7da1d4;--measure:none}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#e7eef9;
--muted:#a6b4ca;--line:#2b3a52;--bg:#0e1522;--card:#151f2e;--navy:#7da1d4;
--cobalt:#7da1d4;--soft:#1a2637;--accent:#7da1d4}}
:root[data-theme="dark"]{--ink:#e7eef9;--muted:#a6b4ca;--line:#2b3a52;--bg:#0e1522;
--card:#151f2e;--navy:#7da1d4;--cobalt:#7da1d4;--soft:#1a2637;--accent:#7da1d4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.skip{position:absolute;left:-9999px}
.skip:focus{left:12px;top:12px;position:fixed;z-index:9;background:var(--card);
color:var(--ink);padding:10px 14px;border:2px solid var(--cobalt);border-radius:8px}
.wrap{max-width:1200px;margin:0 auto;padding-block:30px;padding-left:16px;padding-right:16px}
h1{font-size:clamp(1.45rem,3.2vw,2.1rem);margin:0 0 .15em;color:var(--navy)}
h2{font-size:clamp(1.05rem,2vw,1.3rem);margin:2em 0 .2em;color:var(--navy)}
.sub{color:var(--muted);margin:0 0 .6em}
.filters{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 22px}
.chip{display:inline-block;padding:3px 11px;border:1px solid var(--line);border-radius:999px;
font-size:.83rem;background:var(--card)}
.chip b{font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:13px;margin:6px 0 8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.card .n{font-size:2.1rem;font-weight:700;color:var(--cobalt);line-height:1.05}
.card .l{font-weight:600;margin:.3em 0 .15em}
.card .d{color:var(--muted);font-size:.89rem}
.note{background:var(--soft);border:1px solid var(--line);border-left:4px solid var(--accent);
border-radius:10px;padding:13px 16px;margin:22px 0;color:var(--ink)}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);
margin-top:.7em}
table{border-collapse:collapse;width:100%;font-size:.91rem;table-layout:fixed}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--soft);font-weight:600}
td.who{color:var(--muted);font-size:.87rem}
tbody tr:last-child td{border-bottom:none}
a{color:var(--cobalt)}
:focus-visible{outline:3px solid var(--cobalt);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (max-width:560px){.wrap{padding-block:20px}table{font-size:.85rem}
.card .n{font-size:1.8rem}}
"""


def write_page(path, res):
    E = html.escape
    rows = res["rows"]
    adopt = [r for r in rows if r["headline"] == "Adopt"]
    build = [r for r in rows if r["headline"] == "Build first-in-state"]
    held = [r for r in rows if r["headline"] == "Already held"]
    check = [r for r in rows if r["n_teaching"] == 0 and r["n_partial"] > 0]
    P = []
    P.append("<title>CPL opportunities — %s</title>" % E(res["region"]))
    P.append("<style>%s</style>" % PAGE_CSS)
    P.append('<a class="skip" href="#main">Skip to the opportunities</a>')
    P.append('<div class="wrap">')
    P.append("<h1>What CPL could these colleges create or adopt?</h1>")
    P.append('<p class="sub">Jobs in %s, crossed with what each college already teaches '
             "and what already exists in MAP.</p>" % E(res["region"]))

    # the filter that produced this view, stated plainly
    P.append('<div class="filters">')
    seen = []
    for c in res["colleges"]:
        w = res["why"].get(c, "college")
        lab = w if w.startswith("district") or w.startswith("region") else None
        if lab and lab not in seen:
            seen.append(lab)
            P.append('<span class="chip"><b>%s</b></span>' % E(lab))
    for c in res["colleges"]:
        if res["why"].get(c, "college") == "college":
            P.append('<span class="chip">%s</span>' % E(c))
    P.append('<span class="chip">%d colleges in view</span>' % len(res["colleges"]))
    P.append("</div>")

    cards = [(len(adopt), "Could adopt now",
              "A college teaches it and the credit already exists in MAP — it just is not signed up. "
              "Paperwork, not new curriculum."),
             (len(build), "Could build first in the state",
              "A college teaches it and no credit exists anywhere in California."),
             (len(held), "Already held",
              "Teaches it and is already on the exhibit."),
             (len(check), "Worth a look",
              "No matching program, but courses came close.")]
    P.append('<div class="grid">')
    for n, l, d in cards:
        P.append('<div class="card"><div class="n">%d</div><div class="l">%s</div>'
                 '<div class="d">%s</div></div>' % (n, E(l), E(d)))
    P.append("</div>")
    P.append('<div class="note"><strong>Read these as suggestions, not answers.</strong> '
             "The matches are made by comparing wording, not by reviewing curriculum, so some "
             "will be wrong. Each row shows the programme and the exhibit behind it so the "
             "college in the room can say yes or no on sight. Faculty decide.</div>")

    P.append('<div id="main">')
    def table(title, lede, items, third_head, third):
        if not items:
            return
        P.append("<h2>%s</h2>" % E(title))
        P.append('<p class="sub">%s</p>' % E(lede))
        P.append('<div class="scroll" role="region" aria-label="%s" tabindex="0"><table>' % E(title))
        P.append('<colgroup><col style="width:27%"><col style="width:9%">'
                 '<col style="width:32%"><col style="width:32%"></colgroup>')
        P.append("<thead><tr><th scope=\"col\">Job</th><th scope=\"col\">Entry level</th>"
                 "<th scope=\"col\">%s</th><th scope=\"col\">%s</th></tr></thead><tbody>"
                 % (E(third_head), "Credit that exists in MAP"))
        for r in items[:60]:
            who = "; ".join(third(r)) or "—"
            ex = "; ".join(r["exhibits"][:2]) or "Nothing in MAP yet"
            edu = (r["education"] or "").replace(" or equivalent", "")
            P.append("<tr><td>%s</td><td class=\"who\">%s</td><td class=\"who\">%s</td>"
                     "<td class=\"who\">%s</td></tr>"
                     % (E(r["occupation"]), E(edu), E(who), E(ex)))
        P.append("</tbody></table></div>")
        if len(items) > 60:
            P.append('<p class="sub">Showing the first 60 of %d — the spreadsheet has them all.</p>'
                     % len(items))

    table("Could adopt now", "The credit already exists. These colleges teach the subject and are "
          "not on the exhibit yet.", adopt, "Colleges that could adopt",
          lambda r: r["could_adopt"])
    table("Could build first in the state", "These colleges teach the subject and no credit for it "
          "exists anywhere in California.", build, "Colleges that teach it",
          lambda r: r["could_build"])
    table("Already held", "Teaching it and already on the exhibit.", held,
          "Colleges already on it", lambda r: r["already_on_it"])
    P.append("</div>")

    P.append("<h2>The colleges in this view</h2>")
    P.append('<div class="scroll" role="region" aria-label="Colleges in this view" tabindex="0"><table>')
    P.append('<colgroup><col style="width:32%"><col style="width:26%"><col style="width:14%">'
             '<col style="width:14%"><col style="width:14%"></colgroup>')
    P.append('<thead><tr><th scope="col">College</th><th scope="col">Why it is here</th>'
             '<th scope="col">Programs</th><th scope="col">Could adopt</th>'
             '<th scope="col">Could build</th></tr></thead><tbody>')
    for c, sm in sorted(res["per_college"].items()):
        P.append("<tr><td>%s</td><td class=\"who\">%s</td><td>%d</td><td>%d</td><td>%d</td></tr>"
                 % (E(c), E(res["why"].get(c, "college")), sm["n_programs"],
                    sm["adopt_now"], sm["build"]))
    P.append("</tbody></table></div>")
    P.append('<p class="sub" style="margin-top:26px">Built %s · CCCCO COCI programs and course '
             "catalog · MAP statewide exhibits · occupation list as supplied · MAP@rccd.edu</p>"
             % datetime.date.today().isoformat())
    P.append("</div>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(P))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--college", action="append", default=[],
                    help="repeatable; one or many")
    ap.add_argument("--district", action="append", default=[],
                    help="repeatable; expands to every college in the district")
    ap.add_argument("--region", default=None,
                    help="our internal macro-region. NOT a Strong Workforce consortium — "
                         "that roster does not exist in this repo yet.")
    ap.add_argument("--occupations", required=True)
    ap.add_argument("--region-label", default="the region")
    ap.add_argument("--slug", required=True)
    a = ap.parse_args()

    R, _ = make_resolver()
    colleges, why = select_colleges(a.college, a.district, a.region, R)
    if not colleges:
        raise SystemExit("Select at least one --college, --district or --region.")

    res = build(colleges, a.occupations, a.region_label, why)
    date = datetime.date.today().isoformat()
    out = os.path.join(ROOT, "kb/regional_cpl_out", f"{date}-{a.slug}")
    os.makedirs(out, exist_ok=True)
    xlsx = os.path.join(out, f"{date.replace('-', '')}_{a.slug}_CPL_Opportunities.xlsx")
    write_workbook(xlsx, res)
    page = os.path.join(out, f"{a.slug}_cpl_opportunities.html")
    write_page(page, res)
    with open(os.path.join(out, "crosswalk.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(_generated_at=datetime.datetime.now().isoformat(timespec="seconds"),
                       _generated_by="kb/_build_regional_cpl_opportunity.py", **res),
                  fh, indent=1, ensure_ascii=False)
    adopt = sum(1 for r in res["rows"] if r["headline"] == "Adopt")
    build_n = sum(1 for r in res["rows"] if r["headline"] == "Build first-in-state")
    print(f"{len(colleges)} colleges | {res['n_occupations']} occupations | "
          f"adopt {adopt} · build first-in-state {build_n}")
    print(xlsx); print(page)
    return 0


if __name__ == "__main__":
    sys.exit(main())
