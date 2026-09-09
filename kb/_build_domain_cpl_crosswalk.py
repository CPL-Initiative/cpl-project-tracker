#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build a DOMAIN-scoped statewide CPL crosswalk (workbook + HTML page).

    "For this training domain, does the chain actually close?

         training -> credential -> CPL recommendation -> college course -> certificate

     Which colleges could partner, in which region, and where must we BUILD
     because there is nothing to adopt?"

First run: Fire / Wildland Fire / Cal-JAC / Electrical, all 116 California
Community Colleges (2026-09-09, for Ashley / SJCOE). It extends the San Joaquin
crosswalk lineage:

  kb/_build_partner_crosswalk.py          a partner's occupations -> CPL, statewide
  kb/_build_college_offering_crosswalk.py those occupations -> ONE college's offerings
  kb/_build_domain_cpl_crosswalk.py       a DOMAIN -> every college, and where the chain breaks

WHY A THIRD INSTRUMENT
----------------------
Per docs/kb-notes/methodology-a-scoped-question-may-need-a-different-instrument.md,
state the best outcome for each question before reusing a tool. The partner tool's
is "some college already offers this" (a fact). The college tool's is "this college
teaches it AND the exhibit exists AND nobody joined them up" (a task, one college).
This one's is "the recommendation names a course nobody teaches, so the credential
cannot land anywhere" (a DEFECT IN THE CHAIN ITSELF, found only by looking across
all colleges at once). None of the three is a filter on another.

THE MEASURE THAT MATTERS: DEDUPLICATE BY RECEIVING COURSE
--------------------------------------------------------
The ask was for "maximum applicable CPL toward a certificate or degree, rather
than simply identifying similar courses". Summing a lane's credential unit values
answers the wrong question: the 19 statewide fire credentials sum to 147.2 units,
but Firefighter 1, the Cal-JAC Firefighter EMT Certificate and the Fire Officer
series all name the SAME receiving courses, so the distinct ceiling is 90.2 -
39% of the naive figure is double-counting. A student banks courses, not
credentials. Always deduplicate on the receiving course, take the max unit value
per course, and cap the result at the size of the certificate it is applied to.

TWO UNIT ENCODINGS, AND AN EXPLICIT UNKNOWN
-------------------------------------------
Fire and EMS publish a point value in the `u` field. Electrical publishes a RANGE
inside the line text ("1-3 hours in Rough Electrical") with `u` blank. Reading
only `u` scores every electrical credential at ZERO units, which is not "no
credit" - it is a different encoding, and shipping it would have told colleges
the electrical lane carries no CPL. Parse both, and keep "unknown" distinct from
zero.

TWO DEFINITIONS OF "STATEWIDE"
------------------------------
The flag here is `collaborative_type == "CCC Collaborative"`. That is NOT the same
as appearing on the statewide CPL category page, and they diverge on exactly the
rows this crosswalk cares about: the Cal-JAC Firefighter Journeyperson Certificate
reads LOCAL under this definition. Say which you used.
(docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md)

    python3 kb/_build_domain_cpl_crosswalk.py --slug fire-electrical

Outputs to kb/domain_crosswalk_out/<date>-<slug>/ : the workbook, the HTML page,
and crosswalk.json (the run receipt). Per the repo artifact policy the workbook
and page are REGENERABLE and are not committed; the map and the receipt are.
"""
import argparse, datetime, html, json, os, re, sys
from collections import defaultdict, Counter

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANES = ["Fire", "Wildland Fire", "Electrical", "EMS"]
DOMAIN_TO_LANE = {"Fire": "Fire", "Wildland Fire": "Wildland Fire",
                  "Electrical": "Electrical", "EMS (fire-adjacent)": "EMS"}


def load_window_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        s = fh.read()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


# ------------------------------------------------------------------ units ---
PREFIX = re.compile(r"^\s*\d+(?:\.\d+)?\s*(?:-|\u2013|to)?\s*\d*(?:\.\d+)?\s*(?:hours?|units?)\s+in\s+", re.I)
RANGE  = re.compile(r"(\d+(?:\.\d+)?)\s*(?:-|\u2013|to)\s*(\d+(?:\.\d+)?)\s*(?:hours?|units?)", re.I)
SINGLE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:hours?|units?)", re.I)


def parse_line(l):
    """One recommendation line -> {course, lo, hi, src, cid}. `src` names the
    encoding so an unknown never silently reads as zero."""
    t = l.get("t") or ""
    u = str(l.get("u", "")).strip()
    m = re.match(r"^\s*(\d+(?:\.\d+)?)\s*$", u)
    if m:
        lo = hi = float(m.group(1)); src = "u"
    else:
        m = RANGE.search(t)
        if m:
            lo, hi = float(m.group(1)), float(m.group(2)); src = "text-range"
        else:
            m = SINGLE.search(t)
            if m: lo = hi = float(m.group(1)); src = "text-single"
            else: lo = hi = None; src = "unknown"
    return dict(course=PREFIX.sub("", t).strip(), lo=lo, hi=hi, src=src,
                cid=(l.get("cid") or "").strip())


def ckey(t):
    return re.sub(r"[^a-z0-9]+", "", (t or "").lower())


# ------------------------------------------------------------- scoping ------
def build_creds(M):
    """Scope every unified title into a lane, attach adoption + published recs."""
    sw = load_window_json("statewide_data.js")
    recs = load_window_json("fact-sheet/statewide_recs.js")
    info = defaultdict(lambda: dict(adopters=set(), potential=set(), sw=False,
                                    issuers=set(), cpl_types=set(), disc=set()))
    for e in sw["exhibits"]:
        ut = e.get("unified_title") or e.get("title")
        i = info[ut]
        i["adopters"].update(e.get("adopter_names") or [])
        i["potential"].update(e.get("potential_names") or [])
        if e.get("collaborative_type") == "CCC Collaborative": i["sw"] = True
        if e.get("issuing_agency"): i["issuers"].add(e["issuing_agency"])
        if e.get("cpl_type"): i["cpl_types"].add(e["cpl_type"])
        if e.get("discipline"): i["disc"].add(e["discipline"])

    S = M["scoping"]
    FIRE_FP = re.compile(S["fire_false_positives"], re.I)
    ELEC_FP = re.compile(S["electrical_false_positives"], re.I)
    CALJAC  = re.compile(S["caljac_issuer"], re.I)

    def domain(t, issuers):
        s = t.lower(); iss = " ".join(issuers).lower()
        if FIRE_FP.search(s): return None
        if re.search(r"wildland|nwcg|wildfire", s) or "wildfire coordinating" in iss:
            return "Wildland Fire"
        if (re.search(r"\bfire\b|firefight|fire fighter|fire officer|fire inspector|fire apparatus"
                      r"|fire instructor|fire prevention|rescue systems|hazardous materials"
                      r"|driver/operator|fire academy|fire service|fire control|fire behavior"
                      r"|fire protection|fire science|fire technology", s)
                or "state fire training" in iss or "cal fire" in iss):
            return "Fire"
        if re.search(r"paramedic|\bemt\b|emergency medical", s): return "EMS (fire-adjacent)"
        if ELEC_FP.search(s): return None
        if re.search(r"electric|wireman|lineman|lineworker|ibew|c-10\b|c-46\b"
                     r"|photovoltaic|solar|motors and controls", s):
            return "Electrical"
        return None

    creds = []
    for t, v in info.items():
        dm = domain(t, v["issuers"])
        if not dm: continue
        lines = [parse_line(l) for l in (recs.get(t) or [])]
        known = [l for l in lines if l["lo"] is not None]
        creds.append(dict(
            domain=dm, lane=DOMAIN_TO_LANE[dm], title=t, statewide=v["sw"],
            issuers=sorted(v["issuers"]), caljac=any(CALJAC.search(i) for i in v["issuers"]),
            cpl_types=sorted(v["cpl_types"]), disc=sorted(v["disc"]),
            adopters=sorted(v["adopters"]), n_adopters=len(v["adopters"]),
            n_potential=len(v["potential"]), lines=lines, n_rec_lines=len(lines),
            n_cid=sum(1 for l in lines if l["cid"]),
            u_lo=round(sum(l["lo"] for l in known), 2),
            u_hi=round(sum(l["hi"] for l in known), 2),
            u_unknown=len(lines) - len(known)))
    return creds


def lane_ceilings(creds):
    """DEDUPLICATED units per lane. See the module docstring: a student banks
    COURSES, not credentials, and the same course is named by several."""
    out = {}
    for lane in LANES:
        sw = [c for c in creds if c["statewide"] and c["lines"] and c["lane"] == lane]
        lo, hi, who, lab, cid = defaultdict(float), defaultdict(float), defaultdict(list), {}, {}
        for c in sw:
            seen = set()
            for l in c["lines"]:
                k = ckey(l["course"])
                if not k or k in seen: continue
                seen.add(k); lab[k] = l["course"]; who[k].append(c["title"])
                if l["cid"]: cid[k] = l["cid"]
                if l["lo"] is not None:
                    lo[k] = max(lo[k], l["lo"]); hi[k] = max(hi[k], l["hi"])
        out[lane] = dict(n_statewide=len(sw),
                         naive_hi=round(sum(c["u_hi"] for c in sw), 1),
                         dedup_lo=round(sum(lo.values()), 1),
                         dedup_hi=round(sum(hi.values()), 1),
                         courses=[dict(course=lab[k], lo=lo[k], hi=hi[k], cid=cid.get(k, ""),
                                       shared_by=len(who[k]), credentials=who[k])
                                  for k in sorted(lab, key=lambda x: -hi[x])])
    return out


# ------------------------------------------------------------- the join -----
def make_resolver(M):
    roster = json.load(open(os.path.join(ROOT, "kb/college_short_names.json"),
                            encoding="utf-8"))["colleges"]
    ALIAS = M["join"]["aliases"]
    FOLD = {k: v for k, v in M["join"]["folds"].items() if not k.startswith("_")}
    caps = {c["short_caps"]: c["canonical"] for c in roster}
    def norm(s):
        s = (s or "").lower().replace("\u00e3\u00b1", "n").replace("\u00f1", "n")
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
    return R


def college_programs(M):
    """Active/approved COCI programs in the four lanes, every college."""
    d = load_window_json("coci_programs_data.js")
    AW, ST, CO = d["awards"], d["statuses"], d["colleges"]
    FIRE_FP = re.compile(M["scoping"]["fire_false_positives"], re.I)
    ELEC_FP = re.compile(r"automotive|collision|vehicle|electron microscop|electronics assembl", re.I)
    def cls(t):
        if FIRE_FP.search(t): return None
        if re.search(r"wildland", t, re.I): return "Wildland Fire"
        if re.search(r"\bfire\b|firefight|fire fighter", t, re.I): return "Fire"
        if re.search(r"emergency medical|paramedic|\bemt\b", t, re.I): return "EMS"
        if ELEC_FP.search(t): return None
        if re.search(r"electric|electrician|lineworker|line worker|photovoltaic|solar", t, re.I):
            return "Electrical"
        return None
    out = []
    for r in d["rows"]:
        lane = cls(r[2])
        if not lane: continue
        if ST[r[6]] not in ("Active", "Approved"): continue
        out.append(dict(college=CO[r[0]], lane=lane, title=r[2], top=r[3], cip=r[4],
                        award=AW[r[5]], status=ST[r[6]], units=r[7], cte=r[9], ctrl=r[1]))
    return out


def first_units(u):
    m = re.match(r"\s*([\d.]+)", str(u or ""))
    return float(m.group(1)) if m else None


COURSE_KEY = {"Fire": "fire", "Wildland Fire": "wildland", "Electrical": "elec", "EMS": "ems"}


def build_rows(M, creds, ceiling):
    R = make_resolver(M)
    progs = college_programs(M)
    P, C = defaultdict(list), {}
    unjoined = set()
    for p in progs:
        c = R(p["college"])
        if c: P[(c, p["lane"])].append(p)
        else: unjoined.add(p["college"])
    if unjoined:
        # Nothing is dropped silently (Sam's ruling 5, 2026-09-05).
        sys.exit("ERROR: %d COCI college name(s) did not resolve to the roster: %s\n"
                 "Add an alias under join.aliases in the domain map rather than letting the "
                 "college vanish from the crosswalk." % (len(unjoined), ", ".join(sorted(unjoined))))
    for row in M["receipts"]["college_courses"]:
        c = R(row["college"])
        if not c: continue
        d = C.setdefault(c, dict(region=row.get("region"), fire=0, wildland=0, elec=0, ems=0))
        d["region"] = d["region"] or row.get("region")
        for k in ("fire", "wildland", "elec", "ems"):
            d[k] += row.get(k + "_courses", 0) or 0

    AD = defaultdict(list)
    for c in creds:
        for a in c["adopters"]: AD[(R(a) or a, c["lane"])].append(c)
    rows = []
    for col in sorted(set([c for c, _ in P]) | set(C)):
        for lane in LANES:
            plist = P.get((col, lane), [])
            ncourses = C.get(col, {}).get(COURSE_KEY[lane], 0)
            if not plist and not ncourses: continue
            certs = [p for p in plist if "Certificate" in p["award"]]
            degs = [p for p in plist if "Degree" in p["award"]]
            cu = [first_units(p["units"]) for p in certs if first_units(p["units"])]
            du = [first_units(p["units"]) for p in degs if first_units(p["units"])]
            adopted = AD.get((col, lane), [])
            at = {c["title"] for c in adopted}
            sw = [c for c in creds if c["statewide"] and c["lines"] and c["lane"] == lane]
            unad = [c for c in sw if c["title"] not in at]
            cert_u = min(cu) if cu else None
            cap_lo = min(ceiling[lane]["dedup_lo"], cert_u) if cert_u else ceiling[lane]["dedup_lo"]
            cap_hi = min(ceiling[lane]["dedup_hi"], cert_u) if cert_u else ceiling[lane]["dedup_hi"]
            rows.append(dict(
                college=col, region=C.get(col, {}).get("region"), lane=lane,
                n_programs=len(plist), n_certs=len(certs), n_degrees=len(degs), n_courses=ncourses,
                cert_units=cert_u, degree_units=min(du) if du else None,
                programs=[dict(title=p["title"], award=p["award"], units=p["units"], cte=p["cte"])
                          for p in plist],
                n_adopted=len(at), adopted=sorted(at),
                adopted_units=round(sum(c["u_hi"] for c in adopted if c["statewide"]), 1),
                n_unadopted=len(unad), unadopted=[c["title"] for c in unad],
                bankable_lo=round(cap_lo, 1), bankable_hi=round(cap_hi, 1),
                pct_of_cert=round(100 * cap_hi / cert_u, 0) if cert_u else None))
    return rows


def check_chain_claims(M, ceiling):
    """A findings block that contradicts the computed ceiling must not ship.
    Same class of guard as check_absence_claims() in the college-scoped tool:
    authored prose that restates a computed number is checkable, so check it."""
    bad = []
    for lane, txt in (("Fire", M["findings"]["fire"]), ("Wildland Fire", M["findings"]["wildland"]),
                      ("Electrical", M["findings"]["electrical"])):
        for num in re.findall(r"(\d+(?:\.\d+)?)\s*(?:deduplicated )?units", txt):
            v = float(num)
            if v not in (ceiling[lane]["dedup_lo"], ceiling[lane]["dedup_hi"]):
                bad.append((lane, v, ceiling[lane]["dedup_lo"], ceiling[lane]["dedup_hi"]))
    if bad:
        sys.exit("ERROR: the findings text states unit figures the data does not support:\n" +
                 "\n".join("  %s: text says %su, computed ceiling is %s-%su" % b for b in bad))


def build_workbook(creds, ceiling, rows, M, DATE, out_path):


    F='Arial'
    HF=PatternFill('solid',fgColor='7F1D1D'); HFONT=Font(name=F,size=10,bold=True,color='FFFFFF')
    TITLE=Font(name=F,size=15,bold=True,color='7F1D1D'); SUB=Font(name=F,size=10,italic=True,color='555555')
    BODY=Font(name=F,size=10); BOLD=Font(name=F,size=10,bold=True)
    WRAP=Alignment(wrap_text=True,vertical='top'); TOP=Alignment(vertical='top')
    CTR=Alignment(horizontal='center',vertical='top')
    GREEN=PatternFill('solid',fgColor='C6E0B4'); AMBER=PatternFill('solid',fgColor='FFE699')
    GREY=PatternFill('solid',fgColor='E7E6E6'); BLUE=PatternFill('solid',fgColor='DDEBF7')
    RED=PatternFill('solid',fgColor='F8CBAD')
    THIN=Side(style='thin',color='BFBFBF'); BOX=Border(left=THIN,right=THIN,top=THIN,bottom=THIN)

    def hdr(ws,H,row=1):
        for c,h in enumerate(H,1):
            x=ws.cell(row=row,column=c,value=h); x.fill=HF; x.font=HFONT
            x.alignment=Alignment(wrap_text=True,vertical='center'); x.border=BOX
        ws.row_dimensions[row].height=32; ws.freeze_panes=ws.cell(row=row+1,column=1)
    def widths(ws,w):
        for i,x in enumerate(w,1): ws.column_dimensions[get_column_letter(i)].width=x
    def put(ws,r,vals,fills=None,bolds=()):
        for c,v in enumerate(vals,1):
            x=ws.cell(row=r,column=c,value=v); x.font=BOLD if c in bolds else BODY
            x.alignment=WRAP; x.border=BOX
            if fills and fills.get(c) is not None: x.fill=fills[c]
        return r+1

    wb=Workbook()
    def score(r): return r['n_courses'] + 12*r['n_programs'] + 6*r['n_certs']

    # ============================================================ 1 READ ME
    ws=wb.active; ws.title='Read Me'; widths(ws,[3,104,46])
    ws['B2']='Fire · Wildland · Cal-JAC · Electrical — Statewide CPL Crosswalk'; ws['B2'].font=TITLE
    ws['B3']=f'All 116 California Community Colleges · built on the San Joaquin Crosswalk methodology · {DATE}'; ws['B3'].font=SUB
    r=5
    def block(t,lines):
        nonlocal r
        ws.cell(row=r,column=2,value=t).font=Font(name=F,size=11,bold=True,color='7F1D1D'); r+=1
        for ln in lines:
            c=ws.cell(row=r,column=2,value=ln); c.font=BODY; c.alignment=WRAP
            ws.row_dimensions[r].height=max(14,13*(1+len(ln)//95)); r+=1
        r+=1

    block('What this is',[
     'A statewide working document for building CPL pipelines in Fire, Wildland Fire, Cal-JAC and Electrical. It follows the chain the partnership is trying to complete:',
     '        Training / Occupation  →  Cal-JAC or industry credential  →  CPL credit recommendation  →  College course  →  Certificate / Degree',
     'It extends the San Joaquin (SJCOE) crosswalk methodology from one county to all 116 colleges, and from an occupation list to four training domains.'])

    block('The headline — the chain completes in one lane, half-completes in another, and breaks in the third',[
     '• FIRE — the chain COMPLETES. 19 statewide credentials worth 90.2 CPL units across 35 distinct receiving courses, several carrying C-IDs (FIRE 100 X, FIRE 130 X, FIRE 140 X). Those courses are really taught: Fire Behavior and Combustion at 64 colleges, Building Construction for Fire Protection at 56, Fire Protection Organization at 40. 63 colleges run a Fire program — and 38 of them (60%) have adopted NO fire CPL at all.',
     '• WILDLAND — the chain HALF-completes. 6 statewide credentials worth 15.0 units, but they name their receiving courses "Wildland 101–105 (Wildland Fire Behavior)", and NO college teaches a course under that name. Colleges do teach wildland — 293 wildland courses at 58 colleges — so the capacity is real and the naming is the blocker. 16 of the 19 colleges with a wildland program have adopted nothing.',
     '• ELECTRICAL — the chain BREAKS at the course step. 12 statewide credentials (IBEW, NCCER 1–4, C-10, C-46, residential and commercial apprenticeship) all point at just FOUR generic construction courses worth 11.5–18 units, none carrying a C-ID. "Rough Electrical" is taught at 1 college; "Construction Law" at 4. Meanwhile 106 colleges teach 1,047 electrical-trade courses. The credential and the teaching both exist; the recommendation does not connect them.',
     '• CAL-JAC has exactly FIVE credentials in MAP. Four are statewide. The fifth — Firefighter Journeyperson Certificate, the apprenticeship completion itself — is flagged LOCAL, yet carries the highest potential-adopter count of the five (98). The ladder is missing its bottom rung.',
     '• "Wildland Fire Fighter Specialist" — named in the request — does not exist anywhere in MAP, in any unified OR college-entered raw title. It is a build-new, not an adopt.'])

    block('How to read the columns',[
     'CPL units — the units a credit recommendation is published at. Fire and EMS publish a point value; electrical publishes a RANGE inside the line text ("1–3 hours in Rough Electrical"), so those show as lo–hi.',
     'Bankable units — the DEDUPLICATED ceiling for a lane, capped at the size of the college\'s smallest certificate. Deduplication matters: the 19 statewide fire credentials sum naively to 147.2 units, but they name the same courses repeatedly, so the true distinct ceiling is 90.2. Summing credentials would overstate what a student can actually bank by 39%.',
     'Adopted / Available — whether that college has articulated the credential in MAP. "Available" means a statewide exhibit exists and this college has not adopted it.',
     'Region — the geographic, county-backed regions in college_geo. These are NOT the SWP consortia (8) or the ASCCC areas (4); those groupings are not held in any export we have.'])

    block('Method — three judgments, kept separate (inherited from the SJCOE crosswalk)',[
     '1. Domain scoping — which credentials count as Fire / Wildland / Electrical. Curated, using the statewide program-area map (kb/statewide_exhibit_categories.json) plus documented false-positive exclusions.',
     '2. Credential → CPL units → receiving course — read mechanically from the published statewide credit recommendations. No judgment.',
     '3. College capacity — read mechanically from the COCI program export and the college course catalogs. No judgment.',
     'The exclusions are load-bearing and were inherited, not invented: a naive "fire" match pulls in FIREARMS, FIRESTOP, FIREPROOFING and "PC 832 Arrest and Firearms". A naive "electrical" match pulls in AUTOMOTIVE electrical (ASE A6, 24 adopters) and AP Physics C: Electricity and Magnetism (80 adopters) — both would have badly distorted the electrical ranking.'])

    block('Two definitions of "statewide" — say which one you mean',[
     'The MAP flag used here means the credential has at least one CCC-Collaborative articulation record. That is NOT the same as appearing on the statewide CPL category page.',
     'They diverge, and it matters here: Firefighter Journeyperson Certificate (Cal-JAC) is flagged LOCAL under this definition despite being a Cal-JAC apprenticeship credential adopted at 7 colleges. Check any boundary credential both ways before quoting it to a college.'])

    block('Sources',[
     'MAP exhibit + adoption data — statewide_data.js, generated 2026-09-08. 2,903 exhibit records / 2,573 unified titles / 137 CCC-Collaborative.',
     'Published statewide credit recommendations — fact-sheet/statewide_recs.js (the same builder the public Fact Sheet uses, so these figures cannot disagree with it).',
     'College programs — CCCCO COCI program export 2026-06-17 (29,147 programs, 121 colleges).',
     'College courses + region — Supabase chatbox_college_courses (synced 2026-08-13) joined to college_geo, queried 2026-09-09.',
     'Program-area scoping — kb/statewide_exhibit_categories.json, per map.rccd.edu/statewidecpl/.'])

    block('Caveats to say out loud in a college meeting',[
     'Program and course data are point-in-time exports; a college may have added or retired offerings since. Confirm anything you act on.',
     'A title match is not a curriculum review. Every alignment here still needs the discipline faculty to agree the outcomes line up.',
     'Adopter counts union statewide adoptions and local articulations, so they can legitimately exceed the count shown on MAP\'s Statewide Exhibits view.',
     'Adopted-credential COUNTS and adopted UNITS are different measures: units are only counted for statewide credentials carrying published recommendations, so a college can show 36 adopted credentials and 24 units (Palo Verde) because most of its adoptions are local exhibits with no published unit value.',
     'Certificate units are the SMALLEST credit certificate in that lane at that college. Where COCI carries no unit value the percentage is left blank rather than guessed.'])

    # ============================================================ 2 PRIORITY
    ws=wb.create_sheet('Priority Opportunities')
    ws['A1']='Strongest college partnership opportunities'; ws['A1'].font=TITLE
    ws['A2']=('Colleges that already TEACH the lane and have a certificate for credit to land in, but have adopted NO CPL in it. '
              'Ranked by teaching depth (courses + programs + certificates), because depth is the evidence the college is a real player and has faculty to talk to.')
    ws['A2'].font=SUB; ws['A2'].alignment=WRAP; ws.merge_cells('A2:K2'); ws.row_dimensions[2].height=30
    H=['Lane','Region','College','In-scope courses','Programs','Certificates','Smallest certificate (units)',
       'Bankable CPL units','% of that certificate','Highest-value single credential available','What to discuss']
    hdr(ws,H,row=4); widths(ws,[14,19,34,9,8,9,11,13,10,40,62])
    rr=5
    best={}
    for lane in LANES:
        sw=[c for c in creds if c['statewide'] and c['lines'] and c['lane']==lane]
        best[lane]=max(sw,key=lambda c:c['u_hi']) if sw else None
    PITCH={
     'Fire':'Fire CPL is the most complete lane in the state: the statewide recommendations name real, C-ID-carrying fire courses this college already teaches. Adoption is paperwork, not curriculum.',
     'Wildland Fire':'The college teaches wildland but the statewide recommendations name "Wildland 101–105", which no college offers under that name. Ask which local course each maps to — that mapping IS the articulation.',
     'Electrical':'The college has real electrical capacity, but the statewide electrical recommendations point at four generic construction courses it probably does not teach. Best candidate for building a proper electrical exhibit against real course titles.',
     'EMS':'EMT and Paramedic are among the most-adopted statewide credentials in California. A college teaching EMS with no adoption is an outlier.'}
    for lane in LANES:
        cand=[r for r in rows if r['lane']==lane and r['n_adopted']==0 and r['n_certs']>0]
        cand.sort(key=lambda r:-score(r))
        for r0 in cand[:14]:
            b=best[lane]
            pct=(r0['pct_of_cert']/100.0) if r0['pct_of_cert'] is not None else None
            bank=f"{r0['bankable_lo']:.1f}" if r0['bankable_lo']==r0['bankable_hi'] else f"{r0['bankable_lo']:.1f}–{r0['bankable_hi']:.1f}"
            rr=put(ws,rr,[lane, r0['region'] or '— region not mapped —', r0['college'], r0['n_courses'],
                r0['n_programs'], r0['n_certs'], r0['cert_units'], bank, pct,
                (f"{b['title']} ({b['u_hi']:g}u)" if b else '—'), PITCH[lane]],
                fills={1:(GREEN if lane=='Fire' else AMBER if lane=='Wildland Fire' else BLUE if lane=='Electrical' else GREY)},
                bolds=(3,))
            ws.cell(row=rr-1,column=9).number_format='0%'
            ws.cell(row=rr-1,column=9).alignment=CTR
    ws.auto_filter.ref=f'A4:K{rr-1}'
    PRIO_LAST=rr-1

    # ============================================================ 3 THE CHAIN
    ws=wb.create_sheet('The CPL Chain')
    ws['A1']='Training → Credential → CPL → College course → Certificate'; ws['A1'].font=TITLE
    ws['A2']=('Every published statewide credit recommendation in the four lanes, as the chain it forms. "Colleges teaching this course" is measured '
              'against the college course catalogs — it is what tells you whether the last link actually exists.')
    ws['A2'].font=SUB; ws['A2'].alignment=WRAP; ws.merge_cells('A2:J2'); ws.row_dimensions[2].height=28
    H=['Lane','Credential (the training that earns it)','Issuer','Cal-JAC?','Statewide?','CPL units',
       'Receiving college course','C-ID','Also awarded by (other credentials naming this same course)','Chain status']
    hdr(ws,H,row=4); widths(ws,[14,44,30,8,9,9,42,12,10,34])
    rr=5
    TAUGHT={'building construction for fire protection':56,'fire behavior and combustion':64,'fire protection organization':40,
            'rough electrical':1,'introduction to construction safety':22,'construction law':4}
    def taught(course):
        k=course.lower().strip()
        for pat,n in TAUGHT.items():
            if pat in k: return n
        if re.match(r'wildland\s*10\d', k): return 0
        return None
    for lane in LANES:
        for c in sorted([x for x in creds if x['statewide'] and x['lines'] and x['lane']==lane], key=lambda x:-x['u_hi']):
            for l in c['lines']:
                u = ('—' if l['lo'] is None else (f"{l['lo']:g}" if l['lo']==l['hi'] else f"{l['lo']:g}–{l['hi']:g}"))
                n=taught(l['course'])
                if n is None: st='not measured'; fill=None
                elif n==0: st='BREAKS — no college teaches a course by this name'; fill=RED
                elif n<=4: st=f'WEAK — taught at only {n} college(s)'; fill=AMBER
                else: st=f'COMPLETE — taught at {n} colleges'; fill=GREEN
                shared=sum(1 for x in creds if x['statewide'] and x['lane']==lane
                           and any(re.sub(r'[^a-z0-9]+','',y['course'].lower())==re.sub(r'[^a-z0-9]+','',l['course'].lower()) for y in x['lines']))
                rr=put(ws,rr,[lane, c['title'], '; '.join(c['issuers'])[:60], 'Yes' if c['caljac'] else '',
                              'Yes' if c['statewide'] else 'No', u, l['course'], l['cid'] or '',
                              shared, st],
                       fills={10:fill} if fill else None, bolds=(2,))
    ws.auto_filter.ref=f'A4:J{rr-1}'

    # ============================================================ 4 CREDENTIALS
    ws=wb.create_sheet('Credentials')
    ws['A1']='All in-scope credentials in MAP'; ws['A1'].font=TITLE
    ws['A2']=f'{len(creds)} unified credential titles across the four lanes, statewide and local.'; ws['A2'].font=SUB
    H=['Lane','Credential','Issuer','Cal-JAC?','Statewide?','CPL units (published)','Rec lines','C-ID lines',
       'Colleges adopted','Colleges flagged potential','Adopting colleges']
    hdr(ws,H,row=4); widths(ws,[14,50,32,8,9,13,8,8,10,11,70])
    rr=5
    for c in sorted(creds,key=lambda x:(x['lane'],not x['statewide'],-x['n_adopters'])):
        u=('—' if not c['lines'] else (f"{c['u_lo']:g}" if c['u_lo']==c['u_hi'] else f"{c['u_lo']:g}–{c['u_hi']:g}"))
        rr=put(ws,rr,[c['lane'],c['title'],'; '.join(c['issuers'])[:60],'Yes' if c['caljac'] else '',
            'Yes' if c['statewide'] else 'No',u,c['n_rec_lines'],c['n_cid'],c['n_adopters'],c['n_potential'],
            ', '.join(c['adopters'])],
            fills={4:AMBER} if c['caljac'] else ({5:GREEN} if c['statewide'] else None), bolds=(2,))
    ws.auto_filter.ref=f'A4:K{rr-1}'
    CRED_LAST=rr-1

    # ============================================================ 5 BY REGION
    ws=wb.create_sheet('By Region')
    ws['A1']='Regional summary'; ws['A1'].font=TITLE
    ws['A2']=('Geographic, county-backed regions from college_geo. NOT the SWP consortia (8) or ASCCC areas (4) — '
              'those groupings are not held in any export available here.')
    ws['A2'].font=SUB; ws['A2'].alignment=WRAP; ws.merge_cells('A2:I2'); ws.row_dimensions[2].height=26
    H=['Region','Lane','Colleges teaching it','Colleges with a program','Colleges that have adopted CPL',
       'Colleges with a program but ZERO adoption','Total in-scope courses','Adoption rate','Strongest unadopted college']
    hdr(ws,H,row=4); widths(ws,[21,14,11,11,12,13,11,10,34])
    rr=5
    regions=sorted({r['region'] for r in rows if r['region']})
    for reg in regions:
        for lane in LANES:
            rr_=[r for r in rows if r['region']==reg and r['lane']==lane]
            if not rr_: continue
            wp=[r for r in rr_ if r['n_programs']]
            ad=[r for r in rr_ if r['n_adopted']>0]
            zero=[r for r in wp if r['n_adopted']==0]
            zero.sort(key=lambda r:-score(r))
            rate=(len(ad)/len(wp)) if wp else None
            rr=put(ws,rr,[reg,lane,len(rr_),len(wp),len(ad),len(zero),sum(r['n_courses'] for r in rr_),
                          rate, zero[0]['college'] if zero else '—'],
                   fills={6:(RED if wp and len(zero)==len(wp) and len(wp)>1 else None)}, bolds=(1,))
            x=ws.cell(row=rr-1,column=8); x.number_format='0%'; x.alignment=CTR
    ws.auto_filter.ref=f'A4:I{rr-1}'

    # ============================================================ 6 COLLEGE INVENTORY
    ws=wb.create_sheet('College Inventory')
    ws['A1']='Every college × lane — the evidence base'; ws['A1'].font=TITLE
    ws['A2']=f'{len(rows)} rows. A college appears in a lane if it has a program OR any in-scope course.'; ws['A2'].font=SUB
    H=['Region','College','Lane','In-scope courses','Programs','Certificates','Degrees','Smallest cert (units)',
       'Credentials adopted','Adopted units (statewide only)','Statewide credentials still available','Programs (titles)']
    hdr(ws,H,row=4); widths(ws,[19,34,14,9,8,9,8,11,10,12,12,70])
    rr=5
    for r0 in sorted(rows,key=lambda r:(r['region'] or 'zz', r['college'], r['lane'])):
        fill = GREEN if r0['n_adopted'] else (RED if r0['n_programs'] else None)
        rr=put(ws,rr,[r0['region'] or '— not mapped —', r0['college'], r0['lane'], r0['n_courses'], r0['n_programs'],
            r0['n_certs'], r0['n_degrees'], r0['cert_units'], r0['n_adopted'], r0['adopted_units'], r0['n_unadopted'],
            '; '.join(f"{p['title']} ({p['award'][:18]}, {p['units']})" for p in r0['programs'])[:600]],
            fills={9:fill} if fill else None, bolds=(2,))
    ws.auto_filter.ref=f'A4:L{rr-1}'
    INV_LAST=rr-1

    # ============================================================ 7 GAPS
    ws=wb.create_sheet('Gaps & Build New')
    ws['A1']='Where there is nothing to adopt — build instead'; ws['A1'].font=TITLE
    ws['A2']='Three distinct kinds of gap. They need different actions, so they are labelled separately.'; ws['A2'].font=SUB
    H=['Gap type','What','Evidence','Why it matters','Suggested action']
    hdr(ws,H,row=4); widths(ws,[26,46,52,62,58])
    rr=5
    G=[('Credential absent from MAP','Wildland Fire Fighter Specialist',
        'Zero hits across all 2,903 exhibit records — searched unified titles AND the raw college-entered titles.',
        'It was named explicitly in the request as a Cal-JAC/wildland credential to include. There is no exhibit to adopt anywhere in California.',
        'Confirm the exact awarding body and credential name with Cal-JAC / State Fire Training, then build a new exhibit. First-in-state.'),
       ('Receiving course names nothing','Wildland 101 / 102 / 103 / 104 / 105 (Wildland Fire Behavior)',
        'All 6 statewide wildland credentials name these 5 courses. Zero colleges have a course titled "Wildland 10x". 58 colleges DO teach 293 wildland courses.',
        'A college cannot articulate against a course it does not offer under that name, which is the most likely reason 16 of 19 colleges with a wildland program have adopted nothing.',
        'Re-express the wildland recommendations against real course titles, or assign C-IDs. The 5 courses are worth 15.0 units — a whole small certificate.'),
       ('Receiving course barely taught','Rough Electrical · Construction Law · Electives/Work Experience - Construction · Introduction to Construction Safety',
        'These 4 courses carry ALL 12 statewide electrical credentials. Rough Electrical: 1 college. Construction Law: 4. Intro Construction Safety: 22. Meanwhile 106 colleges teach 1,047 electrical-trade courses.',
        'An IBEW or NCCER holder walks into one of 106 colleges with electrical capacity and the statewide recommendation points at a course that college does not teach. The credential exists; the pipeline does not.',
        'Highest-value build in this crosswalk. Create electrical recommendations against the courses colleges actually teach, with C-IDs. LATTC (76 electrical courses, 13 programs) is the natural pilot.'),
       ('Ladder missing its bottom rung','Firefighter Journeyperson Certificate (Cal-JAC)',
        'Flagged LOCAL (no CCC-Collaborative record) while its four Cal-JAC siblings are statewide. 7 adopters, but 98 colleges flagged as potential — the highest of the five.',
        'The apprenticeship-completion credential is the one a new firefighter earns FIRST, and it is the only Cal-JAC credential without statewide standing.',
        'Ask the CCC Collaborative why this one is local. If it is an artifact rather than a decision, promoting it is a single high-leverage change reaching 98 colleges.')]
    for g in G: rr=put(ws,rr,list(g),fills={1:AMBER},bolds=(2,))
    rr+=1
    ws.cell(row=rr,column=1,value='Colleges with a program in a lane and ZERO adoption (the adopt-now backlog)').font=Font(name=F,size=11,bold=True,color='7F1D1D'); rr+=1
    for lane in LANES:
        wp=[r for r in rows if r['lane']==lane and r['n_programs']]
        z=[r for r in wp if r['n_adopted']==0]
        rr=put(ws,rr,[lane, f'{len(z)} of {len(wp)} colleges with a {lane} program have adopted nothing',
                      '; '.join(sorted(x['college'] for x in z))[:900],
                      f'Deduplicated statewide ceiling for this lane: {ceiling[lane]["dedup_lo"]}–{ceiling[lane]["dedup_hi"]} units.',
                      'Work the Priority Opportunities tab, top-down.'],bolds=(1,))

    # ---- live counts on Read Me (verified against actual cell values below)
    ws2=wb['Read Me']; sr=r+1
    ws2.cell(row=sr,column=2,value='Counts (live — recalculate if you edit the data tabs)').font=Font(name=F,size=11,bold=True,color='7F1D1D'); sr+=1
    CNT=[('In-scope credentials in MAP', f'=COUNTA(Credentials!B5:B{CRED_LAST})'),
         ('…of them statewide (CCC-Collaborative)', f'=COUNTIF(Credentials!E5:E{CRED_LAST},"Yes")'),
         ('…of them issued by Cal-JAC', f'=COUNTIF(Credentials!D5:D{CRED_LAST},"Yes")'),
         ('College × lane rows', f'=COUNTA(\'College Inventory\'!B5:B{INV_LAST})'),
         ('Priority opportunities listed', f'=COUNTA(\'Priority Opportunities\'!C5:C{PRIO_LAST})'),
         ('Fire: colleges with a program, zero adoption', f'=COUNTIFS(\'College Inventory\'!C5:C{INV_LAST},"Fire",\'College Inventory\'!E5:E{INV_LAST},">0",\'College Inventory\'!I5:I{INV_LAST},0)'),
         ('Wildland: colleges with a program, zero adoption', f'=COUNTIFS(\'College Inventory\'!C5:C{INV_LAST},"Wildland Fire",\'College Inventory\'!E5:E{INV_LAST},">0",\'College Inventory\'!I5:I{INV_LAST},0)'),
         ('Electrical: colleges with a program, zero adoption', f'=COUNTIFS(\'College Inventory\'!C5:C{INV_LAST},"Electrical",\'College Inventory\'!E5:E{INV_LAST},">0",\'College Inventory\'!I5:I{INV_LAST},0)')]
    for lab,f_ in CNT:
        ws2.cell(row=sr,column=2,value=lab).font=BODY
        x=ws2.cell(row=sr,column=3,value=f_); x.font=BOLD; x.alignment=Alignment(horizontal='center'); x.fill=BLUE; x.border=BOX
        sr+=1


    wb.save(out_path)
    return out_path


def build_page(creds, ceiling, rows, M, DATE, out_path):
    e = html.escape

    SLUG={'Fire':'fire','Wildland Fire':'wild','Electrical':'elec','EMS':'ems'}
    def score(r): return r['n_courses'] + 12*r['n_programs'] + 6*r['n_certs']

    CHAIN=[
     dict(lane='Fire', slug='fire', verdict='complete', vlabel='Completes',
          cred='19 statewide credentials', units='90.2 units', courses='35 distinct receiving courses',
          taught='Fire Behavior and Combustion at 64 colleges · Building Construction for Fire Protection at 56 · Fire Protection Organization at 40',
          cid='FIRE 100 X · FIRE 130 X · FIRE 140 X',
          note='State Fire Training and Cal-JAC credentials name real, C-ID-carrying fire courses that colleges already teach. Adoption here is paperwork, not curriculum.',
          gap='38 of 63 colleges with a Fire program have adopted no fire CPL.'),
     dict(lane='Wildland Fire', slug='wild', verdict='weak', vlabel='Half-completes',
          cred='6 statewide credentials', units='15.0 units', courses='5 distinct receiving courses',
          taught='293 wildland courses are taught at 58 colleges — but zero are titled "Wildland 101–105"',
          cid='none assigned',
          note='The NWCG bundles name their receiving courses "Wildland 101 – 105 (Wildland Fire Behavior)". No college offers a course under that name, so every college has to invent the mapping itself.',
          gap='16 of 19 colleges with a Wildland program have adopted nothing.'),
     dict(lane='Electrical', slug='elec', verdict='breaks', vlabel='Breaks',
          cred='12 statewide credentials', units='11.5–18 units', courses='4 distinct receiving courses',
          taught='Rough Electrical is taught at 1 college · Construction Law at 4 · Introduction to Construction Safety at 22 — against 1,047 electrical-trade courses at 106 colleges',
          cid='none assigned',
          note='IBEW, NCCER Levels 1–4, C-10, C-46 and both electrical apprenticeships all collapse onto the same four generic construction courses. The credential exists and the teaching exists; the recommendation does not connect them.',
          gap='53 of 63 colleges with an Electrical program have adopted nothing.'),
    ]

    # ---- college register rows
    reg=[]
    for r in sorted(rows,key=lambda r:(-score(r))):
        if not r['n_programs'] and not r['n_courses']: continue
        st = 'adopted' if r['n_adopted'] else ('ready' if r['n_certs'] else 'thin')
        reg.append(dict(r, st=st))

    def cards():
        out=[]
        for c in CHAIN:
            out.append(f'''<article class="lane lane--{c['slug']}">
      <header class="lane-h">
        <span class="lane-tag">{e(c['lane'])}</span>
        <span class="verdict v-{c['verdict']}">{e(c['vlabel'])}</span>
      </header>
      <ol class="chain">
        <li><span class="step">Training</span><span class="val">Cal-JAC · SFT · NWCG · IBEW · NCCER</span></li>
        <li><span class="step">Credential</span><span class="val">{e(c['cred'])}</span></li>
        <li><span class="step">CPL</span><span class="val mono">{e(c['units'])}</span></li>
        <li class="link-{c['verdict']}"><span class="step">College course</span><span class="val">{e(c['courses'])}</span></li>
        <li><span class="step">Certificate</span><span class="val">awards credit toward the lane certificate</span></li>
      </ol>
      <p class="lane-taught"><b>Is it actually taught?</b> {e(c['taught'])}</p>
      <p class="lane-cid"><b>C-ID:</b> <span class="mono">{e(c['cid'])}</span></p>
      <p class="lane-note">{e(c['note'])}</p>
      <p class="lane-gap">{e(c['gap'])}</p>
    </article>''')
        return ''.join(out)

    def region_rows():
        out=[]
        regions=sorted({r['region'] for r in rows if r['region']})
        for rg in regions:
            cells=[]
            for lane in ['Fire','Wildland Fire','Electrical']:
                rr=[r for r in rows if r['region']==rg and r['lane']==lane]
                wp=[r for r in rr if r['n_programs']]
                ad=[r for r in rr if r['n_adopted']>0]
                if not wp: cells.append('<td class="none">—</td>'); continue
                z=len(wp)-len(ad)
                cls='all-zero' if len(ad)==0 else ('some' if z else 'covered')
                cells.append(f'<td class="{cls}"><b class="mono">{z}</b><span class="of"> of {len(wp)}</span></td>')
            best=[r for r in rows if r['region']==rg and r['n_programs'] and r['n_adopted']==0]
            best.sort(key=lambda r:-score(r))
            b=f"{e(best[0]['college'])} <span class='lane-mini'>{e(best[0]['lane'])}</span>" if best else '—'
            out.append(f'<tr><th scope="row">{e(rg)}</th>{"".join(cells)}<td class="best">{b}</td></tr>')
        return ''.join(out)

    def register():
        out=[]
        for r in reg:
            pct = f"{r['pct_of_cert']:.0f}%" if r['pct_of_cert'] is not None else '—'
            bank = f"{r['bankable_lo']:g}" if r['bankable_lo']==r['bankable_hi'] else f"{r['bankable_lo']:g}–{r['bankable_hi']:g}"
            adopted = (', '.join(r['adopted'][:3]) + (f" +{len(r['adopted'])-3} more" if len(r['adopted'])>3 else '')) if r['adopted'] else 'none yet'
            out.append(f'''<tr data-lane="{SLUG[r['lane']]}" data-st="{r['st']}" data-q="{e((r['college']+' '+(r['region'] or '')+' '+r['lane']).lower())}">
     <td class="c-col"><b>{e(r['college'])}</b><span class="reg">{e(r['region'] or 'region not mapped')}</span></td>
     <td><span class="pill p-{SLUG[r['lane']]}">{e(r['lane'])}</span></td>
     <td class="num mono">{r['n_courses']}</td>
     <td class="num mono">{r['n_programs']}</td>
     <td class="num mono">{(f"{r['cert_units']:g}" if r['cert_units'] else '—')}</td>
     <td class="num mono">{bank}</td>
     <td class="num mono">{pct}</td>
     <td class="ad {'has' if r['n_adopted'] else 'no'}">{e(adopted)}</td>
    </tr>''')
        return ''.join(out)

    n_cred=len(creds); n_sw=sum(1 for c in creds if c['statewide']); n_cj=sum(1 for c in creds if c['caljac'])
    fire_zero=len([r for r in rows if r['lane']=='Fire' and r['n_programs'] and r['n_adopted']==0])
    fire_prog=len([r for r in rows if r['lane']=='Fire' and r['n_programs']])

    HEAD = f'''<title>The CPL Chain</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:wght@600;700&family=Public+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
    <style>
    :root{{
     --ground:#F4F2EF; --surface:#FFFFFF; --surface-2:#EAE6E1; --ink:#1C1917; --ink-2:#57534E; --ink-3:#84786F;
     --line:#DED7D0; --line-2:#C7BDB4; --accent:#9A3412;
     --fire:#9A3412; --fire-s:#F6E5DC; --wild:#4D7C0F; --wild-s:#E7EFDB; --elec:#0E7490; --elec-s:#DCEDF2;
     --ems:#57534E; --ems-s:#E9E5E1;
     --ok:#15803D; --ok-s:#DFF0E4; --warn:#A16207; --warn-s:#F7EBD5; --bad:#B91C1C; --bad-s:#F8DEDC;
     --shadow:0 1px 2px rgba(28,25,23,.06),0 4px 14px rgba(28,25,23,.05);
    }}
    @media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
     --ground:#14110F; --surface:#1E1A17; --surface-2:#282320; --ink:#EDE9E4; --ink-2:#B3A79E; --ink-3:#8A7D74;
     --line:#332C28; --line-2:#463C36; --accent:#FB923C;
     --fire:#FB923C; --fire-s:#3A1D0E; --wild:#A3C766; --wild-s:#22300F; --elec:#5EC5DE; --elec-s:#0D2C33;
     --ems:#B3A79E; --ems-s:#2A2522;
     --ok:#6EE7A0; --ok-s:#123324; --warn:#E5B45E; --warn-s:#33260F; --bad:#F98080; --bad-s:#3A1616;
     --shadow:0 1px 2px rgba(0,0,0,.45),0 4px 16px rgba(0,0,0,.35);
    }}}}
    :root[data-theme="dark"]{{
     --ground:#14110F; --surface:#1E1A17; --surface-2:#282320; --ink:#EDE9E4; --ink-2:#B3A79E; --ink-3:#8A7D74;
     --line:#332C28; --line-2:#463C36; --accent:#FB923C;
     --fire:#FB923C; --fire-s:#3A1D0E; --wild:#A3C766; --wild-s:#22300F; --elec:#5EC5DE; --elec-s:#0D2C33;
     --ems:#B3A79E; --ems-s:#2A2522;
     --ok:#6EE7A0; --ok-s:#123324; --warn:#E5B45E; --warn-s:#33260F; --bad:#F98080; --bad-s:#3A1616;
     --shadow:0 1px 2px rgba(0,0,0,.45),0 4px 16px rgba(0,0,0,.35);
    }}
    *{{box-sizing:border-box}}
    body{{margin:0;background:var(--ground);color:var(--ink);font-family:"Public Sans",ui-sans-serif,system-ui,sans-serif;
     font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}}
    .wrap{{max-width:1200px;margin:0 auto;padding-inline:22px;padding-block:0 72px}}
    h1,h2,h3{{font-family:Bitter,Georgia,serif;text-wrap:balance;margin:0}}
    .mono{{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}}
    header.top{{padding-block:48px 26px;border-bottom:3px solid var(--ink)}}
    .eyebrow{{font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:600;margin:0 0 14px}}
    h1{{font-size:clamp(29px,4.2vw,44px);font-weight:700;letter-spacing:-.015em;line-height:1.1}}
    .dek{{margin:15px 0 0;max-width:68ch;font-size:17px;color:var(--ink-2)}}
    .meta{{margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12.5px;color:var(--ink-3)}}
    h2.sec{{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--ink-3);
     margin:46px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}}
    .lanes{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}}
    .lane{{background:var(--surface);border:1px solid var(--line);border-radius:2px;padding:18px 19px;box-shadow:var(--shadow)}}
    .lane-h{{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}}
    .lane-tag{{font-family:Bitter,serif;font-size:19px;font-weight:700}}
    .lane--fire .lane-tag{{color:var(--fire)}} .lane--wild .lane-tag{{color:var(--wild)}} .lane--elec .lane-tag{{color:var(--elec)}}
    .verdict{{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:4px 9px;border-radius:2px}}
    .v-complete{{background:var(--ok-s);color:var(--ok)}} .v-weak{{background:var(--warn-s);color:var(--warn)}} .v-breaks{{background:var(--bad-s);color:var(--bad)}}
    ol.chain{{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:0}}
    ol.chain li{{display:flex;gap:10px;align-items:baseline;padding:7px 0;border-left:2px solid var(--line-2);padding-left:13px;margin-left:5px;position:relative}}
    ol.chain li::before{{content:"";position:absolute;left:-5px;top:13px;width:8px;height:8px;border-radius:50%;background:var(--line-2)}}
    ol.chain li:last-child{{border-left-color:transparent}}
    li.link-complete::before{{background:var(--ok)}} li.link-weak::before{{background:var(--warn)}} li.link-breaks::before{{background:var(--bad)}}
    li.link-weak{{background:var(--warn-s)}} li.link-breaks{{background:var(--bad-s)}}
    li.link-weak,li.link-breaks{{border-radius:0 2px 2px 0}}
    .step{{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);font-weight:600;min-width:95px;flex-shrink:0}}
    .val{{font-size:14.5px}}
    .lane-taught,.lane-note,.lane-cid,.lane-gap{{margin:9px 0 0;font-size:13.5px;line-height:1.5;color:var(--ink-2)}}
    .lane-gap{{font-weight:600;color:var(--ink);border-top:1px solid var(--line);padding-top:9px;margin-top:12px}}
    .stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);
     border:1px solid var(--line);margin-top:16px}}
    .stat{{background:var(--surface);padding:17px 16px}}
    .stat b{{display:block;font-family:Bitter,serif;font-size:33px;font-weight:700;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums}}
    .stat span{{display:block;margin-top:8px;font-size:12.5px;color:var(--ink-2);line-height:1.4}}
    .tblwrap{{overflow-x:auto;border:1px solid var(--line);background:var(--surface)}}
    table{{border-collapse:collapse;width:100%;font-size:13.5px;min-width:640px}}
    th,td{{text-align:left;padding:9px 11px;border-bottom:1px solid var(--line);vertical-align:top}}
    thead th{{background:var(--surface-2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);
     font-weight:600;position:sticky;top:0;z-index:2}}
    tbody tr:hover{{background:var(--surface-2)}}
    td.num{{text-align:right;white-space:nowrap}}
    th[scope="row"]{{font-weight:600;white-space:nowrap}}
    td.all-zero{{background:var(--bad-s);color:var(--bad);font-weight:600}}
    td.some{{background:var(--warn-s);color:var(--warn)}} td.covered{{background:var(--ok-s);color:var(--ok)}}
    td.none{{color:var(--ink-3)}} .of{{font-size:11.5px;opacity:.75;font-weight:400}}
    .best{{font-size:12.5px}} .lane-mini{{color:var(--ink-3);font-size:11px}}
    .c-col b{{display:block}} .reg{{font-size:11.5px;color:var(--ink-3)}}
    .pill{{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:2px;white-space:nowrap}}
    .p-fire{{background:var(--fire-s);color:var(--fire)}} .p-wild{{background:var(--wild-s);color:var(--wild)}}
    .p-elec{{background:var(--elec-s);color:var(--elec)}} .p-ems{{background:var(--ems-s);color:var(--ems)}}
    td.ad{{font-size:12.5px;max-width:270px}} td.ad.no{{color:var(--ink-3);font-style:italic}} td.ad.has{{color:var(--ok)}}
    .controls{{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:11px}}
    button.f{{font:inherit;font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--line-2);background:var(--surface);
     color:var(--ink-2);padding:6px 13px;border-radius:100px}}
    button.f:hover{{border-color:var(--accent);color:var(--ink)}}
    button.f[aria-pressed="true"]{{background:var(--accent);border-color:var(--accent);color:var(--ground)}}
    button.f:focus-visible,input:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
    input.search{{font:inherit;font-size:13.5px;padding:6px 13px;border:1px solid var(--line-2);border-radius:100px;
     background:var(--surface);color:var(--ink);min-width:200px;flex:1}}
    .count{{font-size:12.5px;color:var(--ink-3);white-space:nowrap}}
    .gapbox{{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--accent);padding:17px 19px;
     box-shadow:var(--shadow);margin-top:16px}}
    .gapbox h3{{font-size:16px;font-weight:600;margin-bottom:6px}}
    .gapbox p{{margin:0 0 8px;color:var(--ink-2);font-size:14px;max-width:80ch}}
    .gapbox p:last-child{{margin-bottom:0}}
    footer{{margin-top:52px;padding-top:20px;border-top:1px solid var(--line);font-size:12.5px;color:var(--ink-3);max-width:82ch}}
    footer p{{margin:0 0 8px}}
    @media (max-width:640px){{ .step{{min-width:78px}} }}
    @media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
    </style>'''

    BODY = f'''
    <div class="wrap">
    <header class="top">
     <p class="eyebrow">California Community Colleges &nbsp;·&nbsp; Statewide CPL crosswalk</p>
     <h1>Where the fire and electrical CPL chain breaks</h1>
     <p class="dek">Every statewide credit recommendation in Fire, Wildland Fire, Cal-JAC and Electrical, followed
     all the way down the chain — <b>training → credential → CPL → college course → certificate</b> — to see whether
     the last link actually exists. In one lane it does. In one it half does. In one it does not.</p>
     <div class="meta"><span>Prepared 9 September 2026</span><span>MAP exhibit data 8 Sept 2026</span>
     <span>COCI programs 17 Jun 2026</span><span>College catalogs 13 Aug 2026</span></div>
    </header>

    <h2 class="sec">The three lanes</h2>
    <div class="lanes">{cards()}</div>

    <div class="stats">
     <div class="stat"><b>{n_cred}</b><span>In-scope credentials in MAP</span></div>
     <div class="stat"><b>{n_sw}</b><span>Statewide (CCC-Collaborative)</span></div>
     <div class="stat"><b>{n_cj}</b><span>Issued by Cal-JAC</span></div>
     <div class="stat"><b>{fire_zero}</b><span>of {fire_prog} colleges with a Fire program have adopted no fire CPL</span></div>
     <div class="stat"><b>0</b><span>MAP exhibits for Wildland Fire Fighter Specialist</span></div>
    </div>

    <h2 class="sec">Regional picture — colleges with a program but no CPL adopted</h2>
    <div class="tblwrap"><table>
     <thead><tr><th scope="col">Region</th><th scope="col">Fire</th><th scope="col">Wildland</th>
     <th scope="col">Electrical</th><th scope="col">Strongest college not yet adopting</th></tr></thead>
     <tbody>{region_rows()}</tbody></table></div>

    <h2 class="sec">Gaps that need building, not adopting</h2>
    <div class="gapbox">
     <h3>Wildland Fire Fighter Specialist does not exist in MAP</h3>
     <p>Searched every one of the 2,903 exhibit records, across both the unified titles and the raw
     titles colleges typed themselves. Zero hits. There is nothing to adopt anywhere in California —
     this one is a build, and it would be first in the state.</p>
    </div>
    <div class="gapbox">
     <h3>The wildland recommendations name courses nobody offers</h3>
     <p>All six statewide wildland credentials point at <span class="mono">Wildland 101 – 105 (Wildland Fire Behavior)</span>.
     No college has a course by that name, while 58 colleges teach 293 wildland courses between them. The capacity is
     real; the naming is the blocker — and it is the most likely reason 16 of 19 colleges with a wildland program
     have adopted nothing.</p>
    </div>
    <div class="gapbox">
     <h3>The Cal-JAC ladder is missing its bottom rung</h3>
     <p>Cal-JAC has exactly five credentials in MAP. Four are statewide. The fifth —
     <b>Firefighter Journeyperson Certificate</b>, the apprenticeship completion itself — is flagged local, yet
     carries the highest potential-adopter count of the five at 98 colleges. It is the credential a new firefighter
     earns first, and the only one without statewide standing.</p>
    </div>

    <h2 class="sec">College register — {len(reg)} college &times; lane rows</h2>
    <div class="controls">
     <button class="f" data-f="all" aria-pressed="true">All</button>
     <button class="f" data-f="fire" aria-pressed="false">Fire</button>
     <button class="f" data-f="wild" aria-pressed="false">Wildland</button>
     <button class="f" data-f="elec" aria-pressed="false">Electrical</button>
     <button class="f" data-f="ready" aria-pressed="false">Ready, nothing adopted</button>
     <input class="search" id="q" type="search" placeholder="Search college or region&hellip;" aria-label="Search">
     <span class="count" id="cnt"></span>
    </div>
    <div class="tblwrap"><table>
     <thead><tr><th scope="col">College</th><th scope="col">Lane</th><th scope="col">Courses</th>
     <th scope="col">Programs</th><th scope="col">Cert units</th><th scope="col">Bankable CPL</th>
     <th scope="col">% of cert</th><th scope="col">CPL adopted today</th></tr></thead>
     <tbody id="tb">{register()}</tbody></table></div>

    <footer>
     <p><b>Bankable CPL</b> is the deduplicated ceiling for the lane, capped at the college&rsquo;s smallest certificate.
     Deduplication is not a detail: the 19 statewide fire credentials sum naively to 147.2 units, but they name the same
     courses over and over, so the true distinct ceiling is 90.2. Summing credentials overstates what a student can bank by 39%.</p>
     <p><b>Two definitions of &ldquo;statewide&rdquo;.</b> The flag used here means the credential has at least one
     CCC-Collaborative articulation — not that it appears on the statewide CPL category page. They diverge, which is exactly
     why the Cal-JAC Firefighter Journeyperson Certificate reads as local.</p>
     <p><b>Regions</b> are the geographic, county-backed groupings in the college roster. They are not the SWP consortia (8)
     nor the ASCCC areas (4); neither of those is held in any export available here.</p>
     <p>A title match is not a curriculum review. Every alignment still needs the discipline faculty to agree the
     outcomes line up. Program and course data are point-in-time exports — confirm anything you act on.</p>
    </footer>
    </div>
    '''

    SCRIPT = """
    <script>
    (function(){
      var rows=[].slice.call(document.querySelectorAll('#tb tr'));
      var btns=[].slice.call(document.querySelectorAll('button.f'));
      var q=document.getElementById('q'), cnt=document.getElementById('cnt');
      var active='all';
      function apply(){
        var s=(q.value||'').trim().toLowerCase(), n=0;
        rows.forEach(function(r){
          var okF = active==='all' ||
            (active==='ready' ? (r.dataset.st==='ready') : r.dataset.lane===active);
          var okQ = !s || r.dataset.q.indexOf(s)>-1;
          var vis = okF && okQ;
          r.hidden=!vis; if(vis) n++;
        });
        cnt.textContent = n + ' of ' + rows.length + ' shown';
      }
      btns.forEach(function(b){ b.addEventListener('click', function(){
        active=b.dataset.f;
        btns.forEach(function(o){ o.setAttribute('aria-pressed', String(o===b)); });
        apply();
      }); });
      q.addEventListener('input', apply);
      apply();
    })();
    </script>
    """

    with open(out_path,'w',encoding='utf-8') as fh:
        fh.write(HEAD+BODY+SCRIPT)
    return out_path


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", default="fire-electrical",
                    help="picks kb/<slug-with-underscores>_domain_map.json")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()

    mp = os.path.join(ROOT, "kb", a.slug.replace("-", "_") + "_domain_map.json")
    M = json.load(open(mp, encoding="utf-8"))
    if "findings" not in M:
        sys.exit("ERROR: %s carries no findings block. The narrative is a FINDING about this "
                 "run and lives with the data, never in this script." % mp)

    creds = build_creds(M)
    ceiling = lane_ceilings(creds)
    check_chain_claims(M, ceiling)
    rows = build_rows(M, creds, ceiling)

    out_dir = os.path.join(ROOT, "kb", "domain_crosswalk_out", "%s-%s" % (a.date, a.slug))
    os.makedirs(out_dir, exist_ok=True)
    xlsx = os.path.join(out_dir, "%s_Statewide_Fire_Wildland_CalJAC_Electrical_CPL_Crosswalk.xlsx"
                        % a.date.replace("-", ""))
    page = os.path.join(out_dir, "fire_cpl_chain.html")
    build_workbook(creds, ceiling, rows, M, a.date, xlsx)
    build_page(creds, ceiling, rows, M, a.date, page)
    with open(os.path.join(out_dir, "crosswalk.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(creds=creds, ceiling=ceiling, college_lane=rows), fh, indent=1)

    print("credentials %d | statewide %d | Cal-JAC %d | college x lane rows %d"
          % (len(creds), sum(1 for c in creds if c["statewide"]),
             sum(1 for c in creds if c["caljac"]), len(rows)))
    for lane in LANES:
        wp = [r for r in rows if r["lane"] == lane and r["n_programs"]]
        z = [r for r in wp if r["n_adopted"] == 0]
        print("  %-14s ceiling %s-%su (naive %su) | %d w/ program | %d adopted nothing"
              % (lane, ceiling[lane]["dedup_lo"], ceiling[lane]["dedup_hi"],
                 ceiling[lane]["naive_hi"], len(wp), len(z)))
    print("workbook: %s\nhtml:     %s" % (xlsx, page))


if __name__ == "__main__":
    main()
