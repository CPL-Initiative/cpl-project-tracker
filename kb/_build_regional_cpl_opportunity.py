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
def map_exhibits(college):
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


def build(college, occ_path, region_label):
    R, DM = make_resolver()
    canon = R(college) or college
    progs, cat = college_capability(canon, R)
    ex = map_exhibits(canon)

    occ_doc = jload(occ_path)
    occs = occ_doc["occupations"] if isinstance(occ_doc, dict) else occ_doc

    prog_titles = [p["title"] for p in progs]
    course_titles = [c["title"] for c in cat]
    ex_titles = list(ex.keys())
    mp, mc, mx = Matcher(prog_titles), Matcher(course_titles), Matcher(ex_titles)

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

        xm = [(t, h) for t in ex_titles if (h := mx.hit(title, t))]
        xm.sort(key=lambda x: -x[1]["score"])
        on_it = [t for t, _ in xm if canon in ex[t]["adopt"]]
        if on_it:
            st = "on_it"
        elif xm:
            st = "exists"
        else:
            st = "nowhere"

        pri, label = PRIORITY[(fit, st)]
        rows.append(dict(
            occupation=title, soc=o.get("soc", ""), education=o.get("education", ""),
            fit=fit, exhibit_status=st, priority=pri, priority_label=label,
            programs=[p["title"] for p, _ in pm[:4]],
            program_evidence="; ".join(sorted({t for _, h in pm[:4] for t in h["shared"]})),
            courses=[f"{c['subj']} {c['num']} — {c['title']}" for c, _ in cm[:5]],
            exhibits=[t for t, _ in xm[:4]],
            exhibit_ids=sorted({i for t, _ in xm[:4] for i in ex[t]["ids"]})[:4],
            exhibits_adopted=on_it[:4],
            cpl_types=sorted({y for t, _ in xm[:4] for y in ex[t]["types"]}),
            n_programs=len(pm), n_courses=len(cm), n_exhibits=len(xm)))

    rows.sort(key=lambda r: (r["priority"], -r["n_programs"], r["occupation"].lower()))
    grid = Counter((r["fit"], r["exhibit_status"]) for r in rows)
    return dict(college=canon, region=region_label,
                n_programs=len(progs), n_cte=sum(1 for p in progs if p["cte"]),
                n_courses=len(cat), n_occupations=len(rows),
                grid={f"{a}|{b}": n for (a, b), n in grid.items()}, rows=rows)


# ── outputs ──────────────────────────────────────────────────────────────────
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

NAVY, LIGHT, RULE = "002F6D", "EEF3FA", "C9D6E8"
COLS = [("Priority", 9), ("What this means", 46), ("Occupation", 40), ("SOC", 10),
        ("Entry level", 26), ("Do you teach it?", 16), ("Your programs", 40),
        ("Your courses", 40), ("Exhibit exists?", 16), ("MAP exhibit", 38),
        ("Exhibit ID", 20), ("CPL type", 22)]
KEYS = ["priority", "priority_label", "occupation", "soc", "education", "fit",
        "programs", "courses", "exhibit_status", "exhibits", "exhibit_ids", "cpl_types"]
FIT_WORD = {"confirmed": "Yes — program", "partial": "Partly — courses", "none": "No"}
EX_WORD = {"on_it": "Yes — you are on it", "exists": "Yes — not you", "nowhere": "None in MAP"}


def write_workbook(path, res):
    wb = Workbook()
    ws = wb.active
    ws.title = "CPL Opportunities"
    thin = Side(style="thin", color=RULE)
    for i, (h, w) in enumerate(COLS, 1):
        c = ws.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF", size=11)
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"
    for ri, r in enumerate(res["rows"], start=2):
        for ci, k in enumerate(KEYS, 1):
            v = r[k]
            if k == "fit":
                v = FIT_WORD[v]
            elif k == "exhibit_status":
                v = EX_WORD[v]
            elif isinstance(v, list):
                v = "; ".join(v)
            c = ws.cell(row=ri, column=ci, value=v)
            c.alignment = Alignment(vertical="top",
                                    wrap_text=k in ("priority_label", "occupation",
                                                    "programs", "courses", "exhibits"))
            c.border = Border(bottom=thin)
            if ri % 2 == 0:
                c.fill = PatternFill("solid", fgColor=LIGHT)
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{max(2, len(res['rows'])+1)}"

    w2 = wb.create_sheet("How to read this")
    for i, (h, w) in enumerate([("Field", 30), ("Detail", 108)], 1):
        c = w2.cell(row=1, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=NAVY)
        w2.column_dimensions[get_column_letter(i)].width = w
    notes = [
        ("College", res["college"]), ("Region occupation list", res["region"]),
        ("Built", datetime.date.today().isoformat()),
        ("What a row is", "One occupation your region has, crossed with whether you teach it and "
                          "whether a MAP exhibit exists for it."),
        ("P0 / P1 / P2", "P0 you already hold. P1 is the meeting: you teach it, the exhibit exists, "
                         "you are not on it — that is an articulation, not new curriculum. P2 you "
                         "teach it and no exhibit exists anywhere in California, so you would be first."),
        ("EVERY MATCH IS A CANDIDATE", "Matches are mechanical — made on title wording, not by a "
                                       "curriculum review. The program, course and exhibit that "
                                       "produced each row are shown so you can confirm or reject it "
                                       "on sight. Nothing here is a determination; faculty decide."),
        ("'Partly — courses'", "No program title matched, but courses did. A real capability can be "
                               "invisible to a program search — a 10-course apprenticeship can sit "
                               "under a program named something else entirely."),
        ("Two kinds of empty", "'Exhibit exists, not you' is an adoption task. 'None in MAP' is a "
                               "build opportunity. Same blank cell, opposite next step."),
        ("Your footprint", f"{res['n_programs']} active programs ({res['n_cte']} CTE) · "
                           f"{res['n_courses']} courses in the COCI catalog"),
        ("Sources", "CCCCO COCI program export and per-college course catalog; MAP statewide exhibit "
                    "extract; the region's occupation list as supplied."),
        ("Questions", "MAP@rccd.edu"),
    ]
    for ri, (k, v) in enumerate(notes, start=2):
        a = w2.cell(row=ri, column=1, value=k)
        a.font = Font(bold=True)
        a.alignment = Alignment(vertical="top")
        w2.cell(row=ri, column=2, value=v).alignment = Alignment(vertical="top", wrap_text=True)
    wb.save(path)


def write_page(path, res):
    g = res["grid"]
    def cell(f, s): return g.get(f"{f}|{s}", 0)
    E = html.escape
    band = [r for r in res["rows"] if r["priority"] in ("P0", "P1", "P2")]
    parts = ["""<title>CPL opportunities — %s</title><style>
:root{--ink:#11223a;--muted:#55637a;--line:#c9d6e8;--bg:#f7f9fc;--card:#fff;--navy:#002f6d;
--cobalt:#0047ab;--soft:#eef3fa;--ok:#1d6b3f;--warn:#8a5a00;--measure:none}
:root:not([data-theme="light"]){}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#e8eef8;--muted:#a8b6cc;
--line:#2b3a52;--bg:#0f1622;--card:#151f2e;--soft:#1b2738;--cobalt:#7da1d4}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding-block:28px;padding-left:16px;padding-right:16px}
h1{font-size:clamp(1.4rem,3vw,2rem);margin:0 0 .2em;color:var(--navy)}
@media (prefers-color-scheme:dark){h1{color:var(--cobalt)}}
.sub{color:var(--muted);margin:0 0 1.4em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 26px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.card .n{font-size:1.9rem;font-weight:700;color:var(--navy);line-height:1.1}
@media (prefers-color-scheme:dark){.card .n{color:var(--cobalt)}}
.card .l{font-weight:600;margin:.25em 0 .1em}.card .d{color:var(--muted);font-size:.9rem}
h2{font-size:1.15rem;margin:1.8em 0 .5em;color:var(--navy)}
@media (prefers-color-scheme:dark){h2{color:var(--cobalt)}}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--card)}
table{border-collapse:collapse;width:100%%;font-size:.9rem;table-layout:fixed}
th,td{text-align:left;padding:9px 11px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--soft);font-weight:600;position:sticky;top:0}
td.ev{color:var(--muted);font-size:.85rem}
.tag{display:inline-block;padding:1px 7px;border:1px solid var(--line);border-radius:999px;
font-size:.78rem;color:var(--muted);white-space:nowrap}
.note{background:var(--soft);border:1px solid var(--line);border-left:4px solid var(--cobalt);
border-radius:8px;padding:12px 15px;margin:0 0 22px;color:var(--ink)}
@media (max-width:560px){.wrap{padding-block:18px}table{font-size:.82rem}}
</style><div class="wrap">""" % E(res["college"])]
    parts.append("<h1>CPL opportunities — %s</h1>" % E(res["college"]))
    parts.append('<p class="sub">Occupations in %s, crossed with what %s teaches and what MAP already holds. '
                 "%d active programs (%d CTE) · %d courses · %d occupations examined.</p>"
                 % (E(res["region"]), E(res["college"]), res["n_programs"], res["n_cte"],
                    res["n_courses"], res["n_occupations"]))
    parts.append('<div class="note"><strong>Every match below is a candidate, not a determination.</strong> '
                 "Matches are made on title wording, not a curriculum review. The program, course and "
                 "exhibit behind each row are shown so you can confirm or reject it in the room. "
                 "Faculty decide.</div>")
    cards = [(cell("confirmed", "exists"), "Adopt now",
              "You teach it, the exhibit exists, you are not on it. An articulation, not new curriculum."),
             (cell("confirmed", "nowhere"), "Build first-in-state",
              "You teach it and no exhibit exists anywhere in California."),
             (cell("confirmed", "on_it"), "Already yours",
              "You teach it and you are on the exhibit."),
             (cell("partial", "exists") + cell("partial", "on_it"), "Worth checking",
              "Courses look close but no program title matched.")]
    parts.append('<div class="grid">')
    for n, l, d in cards:
        parts.append('<div class="card"><div class="n">%d</div><div class="l">%s</div>'
                     '<div class="d">%s</div></div>' % (n, E(l), E(d)))
    parts.append("</div>")
    parts.append("<h2>The occupations to talk about</h2>")
    parts.append('<div class="scroll" role="region" aria-label="CPL opportunities by occupation" tabindex="0"><table>')
    parts.append('<colgroup><col style="width:7%"><col style="width:21%"><col style="width:24%">'
                 '<col style="width:24%"><col style="width:24%"></colgroup>')
    parts.append("<thead><tr><th scope=\"col\">Priority</th><th scope=\"col\">Occupation</th>"
                 "<th scope=\"col\">What you teach</th><th scope=\"col\">What MAP holds</th>"
                 "<th scope=\"col\">Next step</th></tr></thead><tbody>")
    for r in band:
        ev = "; ".join(r["programs"][:2]) or "; ".join(r["courses"][:2]) or "—"
        mx = "; ".join(r["exhibits"][:2]) or "Nothing in MAP"
        parts.append("<tr><td><span class=\"tag\">%s</span></td><td>%s<br><span class=\"tag\">%s</span></td>"
                     "<td class=\"ev\">%s</td><td class=\"ev\">%s</td><td>%s</td></tr>"
                     % (E(r["priority"]), E(r["occupation"]), E(r["soc"] or "—"), E(ev), E(mx),
                        E(r["priority_label"])))
    parts.append("</tbody></table></div>")
    parts.append('<p class="sub" style="margin-top:22px">Built %s · CCCCO COCI program export and '
                 "per-college course catalog · MAP statewide exhibit extract · MAP@rccd.edu</p>"
                 % datetime.date.today().isoformat())
    parts.append("</div>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(parts))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--college", required=True)
    ap.add_argument("--occupations", required=True)
    ap.add_argument("--region-label", default="the region")
    ap.add_argument("--slug", default=None)
    a = ap.parse_args()

    res = build(a.college, a.occupations, a.region_label)
    slug = a.slug or re.sub(r"[^a-z0-9]+", "-", res["college"].lower()).strip("-")
    date = datetime.date.today().isoformat()
    out = os.path.join(ROOT, "kb/regional_cpl_out", f"{date}-{slug}")
    os.makedirs(out, exist_ok=True)

    xlsx = os.path.join(out, "%s_%s_CPL_Opportunities.xlsx"
                        % (date.replace("-", ""), res["college"].replace(" ", "_")))
    write_workbook(xlsx, res)
    page = os.path.join(out, "%s_cpl_opportunities.html" % slug)
    write_page(page, res)
    with open(os.path.join(out, "crosswalk.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(_generated_at=datetime.datetime.now().isoformat(timespec="seconds"),
                       _generated_by="kb/_build_regional_cpl_opportunity.py", **res),
                  fh, indent=1, ensure_ascii=False)
    g = res["grid"]
    print("%s — %d occupations | P0 already %d · P1 adopt now %d · P2 build %d"
          % (res["college"], res["n_occupations"], g.get("confirmed|on_it", 0),
             g.get("confirmed|exists", 0), g.get("confirmed|nowhere", 0)))
    print(xlsx); print(page)
    return 0


if __name__ == "__main__":
    sys.exit(main())
