#!/usr/bin/env python3
"""Local subject titles, Step b of the Commons' curation order (S694).

Sam, 2026-11-20 (r-subjects-card-on-the-commons-sam-2026-11-20): "don't we need a commons card for subjects to house
the common subjects and local subject titles we'll be establishing from catalog data?" Under his delegation the same
day (d-step-b-owner-courses-bot-2026-11-20) the Courses bot drafts each local subject title from the state subject
code and the catalog's subject heading, and a curator settles the codes that disagree.

Reads (all committed):
  kb/hand_filed_catalogs/courses/index.json and each <slug>.json.gz   the printed catalogs: per row college, subject,
                                                                       sometimes subject_name, code, title.
  coci_lookup_data.js (window.CPL_COCI_LOOKUP)                         the state list: colleges, and rows of
                                                                       [college index, control number, subject, ...].
  kb/reference/subject_discipline_map.json                             local subject code -> MQ discipline.
  kb/discipline_canonical_subj4.json                                   MQ discipline -> its common SUBJ.
Writes kb/status/local_subject_titles.json: per college, each subject code the catalog prints or the state list
carries, the catalog's printed name (the draft local subject title) or null (TBA), the courses it heads on each side,
which side prints it, and the common subject code where the two maps give one. Never from a TOP code (CLAUDE.md
Rule 7). Nothing is written to any table.

Deterministic: no clock is read. A rerun on the same inputs writes the same bytes.

THE DAILY RUN (scripts/daily_build.sh, after the closest M-ID; S695). The file stores a fingerprint of what decides it:
the document less its _sources, whose state_list_built_at is the state list's own stamp and moves whenever that list is
rebuilt, whether or not a subject code moved. With --if-changed a run whose fingerprint matches the file's leaves the
file untouched; --check compares the same fingerprint.

  python3 kb/_build_local_subject_titles.py                write the file
  python3 kb/_build_local_subject_titles.py --if-changed   the daily run: write only when the content changed
  python3 kb/_build_local_subject_titles.py --check        exit 1 if the committed file is behind its inputs
"""
import gzip
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from subject_title_case import KEPT, SMALL, title_case  # noqa: E402
from _build_noncredit_subject_titles import MQ as NC_MQ  # noqa: E402
import subject_decisions as SD  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBJECTS = os.path.join("kb", "hand_filed_catalogs", "subjects")
CATALOGS = os.path.join("kb", "hand_filed_catalogs", "courses")
STATE = "coci_lookup_data.js"
SUBJECT_MAP = os.path.join("kb", "reference", "subject_discipline_map.json")
CANONICAL = os.path.join("kb", "discipline_canonical_subj4.json")
OUT = os.path.join("kb", "status", "local_subject_titles.json")
# A college's own list of its subject codes and their titles, where the college publishes one outside the catalog
# (Cerritos's class schedule names each code's "department"; Sam, 2026-11-22, S705,
# r-college-department-list-is-a-title-source-sam-2026-11-22). kb/reference/college_department_lists/<slug>.json.
DEPARTMENTS = os.path.join("kb", "reference", "college_department_lists")
DEPARTMENT_TITLE = "the college's department list"

COLUMNS = ["code", "printed_name", "catalog_courses", "state_courses", "side", "common", "discipline",
           "title_state", "title_source", "candidate", "address", "credit_courses", "noncredit_courses", "page_codes",
           "noncredit_plain", "noncredit_enhanced", "categories", "common_source", "decision", "noncredit_decisions"]
# Why a row has no title (Sam, 2026-11-21, #3655: "an indicator (chip) in the row to indicate that the catalog read was
# either blocked, title not in catalog, or not parsed yet"). A state comes from a recorded fact; a row nothing proves
# reads not_read, because calling a title absent when the catalog was never looked at is the worse error.
TITLE_STATES = ("catalog", "person", "not_read", "blocked", "not_in_catalog")
# Where a row's common subject code came from, first that answers (kb/subject_decisions.py resolve): a person's save
# for the college's code and band, a person's statewide filing in the Local subjects List, the subject map.
COMMON_SOURCES = ("person", "statewide_filing", "subject_map")
PERSON_TITLE = "a person's save"
# The state list's credit mark for a course (kb/_build_coci_lookup.py credit_char): C credit, N noncredit, E noncredit
# enhanced (Sam, 2026-11-22: "Coci has a credit, noncredit, noncredit enhanced indicator"). Noncredit and credit
# disciplines are separate in the MQs (Sam, 2026-11-21), so a row counts them apart, and N and E apart inside noncredit.
CREDIT_AT, CREDIT, ENHANCED = 6, "C", "E"
CATEGORIES = os.path.join("kb", "status", "noncredit_categories.json")
RULE = ("A catalog's subject code and the state list's are the same code when they are equal after trimming and "
        "upper-casing; nothing looser. A college is the same college when its names are equal after lower-casing and "
        "folding every run of other characters to one space (Los Angeles Trade-Technical College is Los Angeles Trade "
        "Technical College). A local subject title is the catalog's subject heading, saved in Title Case, less a parenthetical that only repeats a subject code: the name its "
        "course pages carry, else the heading filed from the catalog's index or from the lines above the subject's first "
        "course (kb/hand_filed_catalogs/subjects/). A code the catalog's index lists is in the catalog whether or not "
        "its page's courses are filed. A row with no title says why (title_state): not_read where the catalog was not "
        "read for it, blocked where the reader was refused, not_in_catalog where the catalog was read and gives it none. credit_courses and noncredit_courses count the code's courses in the state list apart, and noncredit_plain and noncredit_enhanced split the noncredit ones by the state list's N and E. categories names the COCI noncredit categories of the code's noncredit courses, most courses first (kb/status/noncredit_categories.json). The common subject code is read from the subject map (its keys: upper case, letters and "
        "digits only) and the discipline's canonical SUBJ; where either has nothing, it is blank. A person's saved decision "
        "for the college's code and band wins over the catalog's heading and the subject map, and a person's statewide "
        "filing of the code in the Local subjects List wins over the map (kb/subject_decisions.py). A noncredit decision "
        "(band nc:<category>) touches the code's noncredit courses in that category only: noncredit_decisions lists "
        "each with whether the code still holds courses there, and a code whose courses are all noncredit takes its "
        "title from its dominant category's decision (another category's stands, marked moved) and its common code "
        "from the dominant category's decision. A TOP code is never read.")


def code_key(s):
    return str(s or "").strip().upper()


def college_key(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def map_key(s):
    return re.sub(r"[^A-Z0-9]", "", code_key(s))


def without_code(name, codes):
    """A heading less the parenthetical that repeats a subject code: "Biology (BIOLOGY)" is Biology, "History
    (HIST/HISTORY)" is History, "English (CCN) (ENGL)" is English (S700). A parenthetical that is not a code of the
    college stays ("Basic Skills (Noncredit)"). A heading that was only its code is no heading: None."""
    if not name:
        return name

    def drop(m):
        parts = [map_key(p) for p in re.split(r"[/,]", m.group(1))]
        return " " if parts and all(p and (p in codes or p == "CCN") for p in parts) else m.group(0)

    out = re.sub(r"\s+", " ", re.sub(r"\(([^()]*)\)", drop, name)).strip(" ,-–")
    return out or None


def read_json(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def read_subjects(root, slug):
    """A college's filed subject headings (kb/_file_subject_headings.py), keyed by code; {} where none is filed."""
    path = os.path.join(root, SUBJECTS, slug + ".json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    by = {}
    for r in d.get("rows") or []:
        by.setdefault(code_key(r.get("code")), r)
    return {"by": by, "index": any(r.get("rule") == "index" for r in d.get("rows") or []),
            "blocked": {code_key(c) for c in d.get("blocked") or []}}


def read_departments(root, slug):
    """A college's department list, keyed by code; None where none is filed."""
    path = os.path.join(root, DEPARTMENTS, slug + ".json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    return {code_key(k): v for k, v in (d.get("codes") or {}).items() if v}


def read_state(root):
    src = open(os.path.join(root, STATE), encoding="utf-8").read()
    j = json.loads(src[src.index("{"):src.rindex("}") + 1])
    return j


def build(root=ROOT):
    index = read_json(root, os.path.join(CATALOGS, "index.json"))
    state = read_state(root)
    smap = read_json(root, SUBJECT_MAP).get("map", {})
    canon_doc = read_json(root, CANONICAL)
    canon = canon_doc.get("disciplines", {})
    dec = SD.load(root, canon_doc)
    applied, not_applied, nc_why = set(), [], {}
    cats = {}
    cat_path = os.path.join(root, CATEGORIES)
    for cc in (read_json(root, CATEGORIES).get("colleges") or []) if os.path.exists(cat_path) else []:
        for code, _cr, _nc, parts in cc["codes"]:
            cats[(college_key(cc["college"]), code_key(code))] = parts

    state_by_college = {}
    noncredit_by_college = {}
    enhanced_by_college = {}
    names = state.get("colleges") or []
    by_name = {college_key(n): i for i, n in enumerate(names)}
    for r in state.get("rows") or []:
        state_by_college.setdefault(r[0], {})
        k = code_key(r[2])
        if k:
            state_by_college[r[0]][k] = state_by_college[r[0]].get(k, 0) + 1
            if len(r) > CREDIT_AT and r[CREDIT_AT] != CREDIT:
                noncredit_by_college.setdefault(r[0], {})
                noncredit_by_college[r[0]][k] = noncredit_by_college[r[0]].get(k, 0) + 1
                if r[CREDIT_AT] == ENHANCED:
                    enhanced_by_college.setdefault(r[0], {})
                    enhanced_by_college[r[0]][k] = enhanced_by_college[r[0]].get(k, 0) + 1

    def common_of(code):
        disc = smap.get(map_key(code))
        sub = (canon.get(disc) or {}).get("canonical_subj4") if disc else None
        return (sub or None), (disc or None)

    out_colleges = []
    T = {"colleges": 0, "courses": 0, "codes": 0, "catalog_codes": 0, "named": 0, "both": 0, "catalog_only": 0,
         "state_only": 0, "with_common": 0, "not_read": 0, "blocked": 0, "not_in_catalog": 0,
         "noncredit_only": 0, "credit_and_noncredit": 0, "pages_not_read": 0,
         "colleges_named": 0, "colleges_not_in_state_list": 0, "named_by_person": 0, "common_by_person": 0,
         "common_by_statewide_filing": 0}
    for c in sorted(index.get("colleges") or [], key=lambda x: x["slug"]):
        with gzip.open(os.path.join(root, CATALOGS, c["file"]), "rt", encoding="utf-8") as f:
            doc = json.load(f)
        rows = doc.get("rows") or []
        # The pages that were read, and the codes each page prints its courses under: a subject the index lists as
        # A&P whose page prints AP 120 was read, and its courses sit under the other code (S700).
        pages = [p for key in ("pages", "pages_added") for p in (doc.get(key) or []) if isinstance(p, dict)]
        read_urls = {p.get("url") for p in pages if str(p.get("status")) == "200"}
        codes_at = {}
        for r in rows:
            codes_at.setdefault(r.get("source_url"), set()).add(code_key(r.get("subject")))
        cat = {}
        for r in rows:
            k = code_key(r.get("subject"))
            if not k:
                continue
            e = cat.setdefault(k, {"n": 0, "names": {}})
            e["n"] += 1
            nm = str(r.get("subject_name") or "").strip()
            if nm:
                e["names"][nm] = e["names"].get(nm, 0) + 1
        si = by_name.get(college_key(c["college"]))
        st = state_by_college.get(si, {}) if si is not None else {}
        ncs = noncredit_by_college.get(si, {}) if si is not None else {}
        ens = enhanced_by_college.get(si, {}) if si is not None else {}
        subj = read_subjects(root, c["slug"])
        filed = (subj or {}).get("by") or {}
        listed = {k for k, r in filed.items() if r.get("rule") == "index"}     # the codes the catalog's index lists
        depts = read_departments(root, c["slug"]) or {}
        dept_titles = {title_case(v) for v in depts.values()}
        out = []
        college_codes = {map_key(x) for x in set(cat) | set(st) | listed}
        for k in sorted(set(cat) | set(st) | listed):
            e = cat.get(k)
            in_catalog = bool(e) or k in listed
            # The name the catalog prints most often under the code (ties: A to Z); the files read today print one.
            name, source = None, None
            if e and e["names"]:
                name, source = sorted(e["names"].items(), key=lambda kv: (-kv[1], kv[0]))[0][0], "course pages"
            h = filed.get(k)
            if not name and h and h.get("heading"):
                name, source = h["heading"], {"index": "index", "former": "index, former code"}.get(h.get("rule"), "heading above the first course")
            name = title_case(without_code(name, college_codes))
            if not name:
                source = None
            # The college's department list (r-college-department-list-is-a-title-source-sam-2026-11-22) titles a code
            # the catalog gives none, and wins where the catalog's name is another code's department title (a heading
            # that names several codes, as Cerritos's "Mathematics (MATH & STAT)" gave STAT the name Mathematics).
            dt = title_case(depts[k]) if k in depts else None
            if dt and (not name or (name != dt and name in dept_titles)):
                name, source = dt, DEPARTMENT_TITLE
            side = "both" if (in_catalog and k in st) else ("catalog" if in_catalog else "state")
            if name:
                state_ = "catalog"
            elif k in ((subj or {}).get("blocked") or ()):
                state_ = "blocked"
            elif not in_catalog and c.get("scope") and st.get(k, 0) > ncs.get(k, 0):
                # A file that holds one section of the catalog (Santa Ana's School of Continuing Education, Mt. San
                # Antonio's noncredit pages; index.json "scope", S700) says nothing of the credit subjects it never read.
                state_ = "not_read"
            elif not in_catalog:
                state_ = "not_in_catalog"      # in the state list and nowhere in the catalog that was read
            elif subj and subj["index"]:
                state_ = "not_in_catalog"      # the index lists every subject, and gives this code no heading
            else:
                state_ = "not_read"            # courses under the code, and no heading read for it yet
            nc_n = ncs.get(k, 0)
            cr_n = st.get(k, 0) - nc_n
            # The noncredit hold (r-noncredit-hold-sam-2026-11-21) lifted on Sam's go of 2026-11-22
            # (r-noncredit-title-list-go-sam-2026-11-22): a noncredit-only row keeps its true reason.
            parts = cats.get((college_key(c["college"]), k)) if nc_n else None
            common, disc = common_of(k)
            common_src = "subject_map" if common else None
            # A person's save wins over the catalog, the subject map and any recommendation
            # (r-subject-save-path-kb-curation-sam-2026-11-22): the college's decision for the code's band, then a
            # person's statewide filing (kb/subject_decisions.py). The row keeps what the files gave in decision.was.
            band = "credit" if cr_n > 0 else ("noncredit" if nc_n > 0 else ("credit" if st.get(k, 0) else "whole"))
            rec, by = dec.resolve(c["slug"], k, band)
            # A noncredit decision (SUBJ:<college>|<code>|nc:<category>, #3655) touches the code's noncredit courses in
            # its category only. A noncredit-only code takes its title from the dominant category's row (another
            # category's stands, marked moved) and its common code from the dominant category's decision; a code with
            # credit courses keeps its title and code on the credit row. Each decision is listed in
            # noncredit_decisions, with whether the code still holds courses in its category (holds).
            ncd, nc_list, t_key = (dec.noncredit_for(c["slug"], k) if nc_n else {}), None, None
            if band == "noncredit" and ncd and not rec:
                dom = SD.dominant(parts)
                dom_slug = dec.slug_of.get(dom) if dom else None
                t_rec = dec.noncredit_title(c["slug"], k, dom_slug)
                c_rec = ncd.get(dom_slug) if dom_slug and (ncd.get(dom_slug) or {}).get("common_code") else None
                if t_rec or c_rec:
                    first = c_rec or t_rec
                    t_key = t_rec["key"] if t_rec else None
                    rec = {"key": first["key"], "from": "subject_decision", "who": first.get("who"), "at": first.get("at"),
                           "band": first["band"], "moved": False,
                           "local_title": t_rec["local_title"] if t_rec else None,
                           "common_code": c_rec["common_code"] if c_rec else None,
                           "discipline": c_rec["discipline"] if c_rec else None,
                           "title_key": t_key, "title_moved": bool(t_rec and t_rec["moved"])}
                    by = "subject_decision"
            if ncd:
                held = {n for n, cnt in (parts or []) if cnt}
                nc_list = [{"key": r["key"], "category": r["category"], "common_code": r["common_code"],
                            "discipline": r["discipline"], "local_title": r["local_title"], "who": r.get("who"),
                            "at": r.get("at"), "holds": r["category"] in held}
                           for _s, r in sorted(ncd.items())]
                # Applied is only what a built column takes: the row's title and its dominant category's code. Every
                # other noncredit decision is listed with why (no per-course reader takes it yet).
                taken = {rec["key"], t_key} if rec and band == "noncredit" else set()
                for r in nc_list:
                    if r["key"] in taken:
                        continue
                    if not r["holds"]:
                        nc_why[r["key"]] = "saved; COCI lists no noncredit course of %s under %s in %s now" % (c["slug"], k, r["category"])
                    elif r["local_title"] and not r["common_code"]:
                        nc_why[r["key"]] = ("saved; a title on the %s row of %s, whose title lives on its %s row"
                                            % (r["category"], k, "credit" if cr_n else "dominant category's"))
                    else:
                        nc_why[r["key"]] = ("saved; waiting on the per-course reader (kb/subject_decisions.py "
                                            "for_noncredit_course has no caller yet), so no built column takes it")
            decision = None
            if rec:
                was = {"printed_name": name, "title_state": state_, "title_source": source, "common": common,
                       "discipline": disc, "common_source": common_src}
                took_title = bool(by == "subject_decision" and rec.get("local_title"))
                if took_title:
                    name, state_, source = rec["local_title"], "person", PERSON_TITLE
                if rec.get("common_code"):
                    common, disc = rec["common_code"], rec["discipline"]
                    common_src = "person" if by == "subject_decision" else "statewide_filing"
                decision = {"key": rec["key"], "from": rec["from"], "who": rec.get("who"), "at": rec.get("at"),
                            "title": took_title, "common": bool(rec.get("common_code")), "was": was}
                if by == "subject_decision":
                    decision["band"], decision["moved"] = rec["band"], rec["moved"]
                    applied.add(rec["key"])
                if rec.get("title_key"):
                    decision["title_key"], decision["title_moved"] = rec["title_key"], rec["title_moved"]
                    applied.add(rec["title_key"])
            addr = (h or {}).get("address")
            page_codes = sorted(codes_at.get(addr) or ()) if addr and not e and addr in read_urls else None
            out.append([k, name, e["n"] if e else 0, st.get(k, 0), side, common, disc, state_, source,
                        (h or {}).get("candidate") if not name else None, addr, cr_n, nc_n, page_codes or None,
                        nc_n - ens.get(k, 0), ens.get(k, 0), parts or None, common_src, decision, nc_list])
        n = {"codes": len(out), "catalog_codes": len(set(cat) | listed), "named": sum(1 for r in out if r[1]),
             "both": sum(1 for r in out if r[4] == "both"), "catalog_only": sum(1 for r in out if r[4] == "catalog"),
             "state_only": sum(1 for r in out if r[4] == "state"), "with_common": sum(1 for r in out if r[5]),
             "not_read": sum(1 for r in out if r[7] == "not_read"), "blocked": sum(1 for r in out if r[7] == "blocked"),
             "not_in_catalog": sum(1 for r in out if r[7] == "not_in_catalog"),
             "noncredit_only": sum(1 for r in out if r[12] and not r[11]), "credit_and_noncredit": sum(1 for r in out if r[12] and r[11]),
             "pages_not_read": sum(1 for r in out if r[10] and not r[2] and r[10] not in read_urls),
             "named_by_person": sum(1 for r in out if r[7] == "person"),
             "common_by_person": sum(1 for r in out if r[17] == "person"),
             "common_by_statewide_filing": sum(1 for r in out if r[17] == "statewide_filing")}
        out_colleges.append({"slug": c["slug"], "college": c["college"], "catalog_year": c.get("catalog_year"),
                             "read_at": c.get("read_at"), "in_state_list": si is not None,
                             "courses": len(rows), **n, "rows": out})
        T["colleges"] += 1
        T["courses"] += len(rows)
        for k2 in n:
            T[k2] += n[k2]
        T["colleges_named"] += 1 if n["named"] else 0
        T["colleges_not_in_state_list"] += 0 if si is not None else 1

    for (slug, code, band), r in sorted(dec.college.items()):
        if r["key"] not in applied:
            not_applied.append({"key": r["key"], "why": "no Subjects row of %s under %s takes it (a noncredit row, or "
                                "a code the catalog and the state list do not print)" % (slug, code)})
    for (slug, code, _cat), r in sorted(dec.noncredit.items()):
        if r["key"] not in applied:
            not_applied.append({"key": r["key"], "why": nc_why.get(r["key"]) or "no Subjects row of %s under %s holds "
                                "a noncredit course" % (slug, code)})
    return {
        "_what": ("Step b of the Commons' curation order: each college's local subject codes, from its printed catalog "
                  "(kb/hand_filed_catalogs/courses/) beside the state list (coci_lookup_data.js). printed_name is the "
                  "catalog's subject heading and the draft local subject title (owner: the Courses bot, state: drafted); "
                  "null reads TBA. side says who prints the code: both, catalog (the catalog only) or state (the state "
                  "list only). The codes on one side only are the curator's list. common is the common subject code "
                  "(Step a) where the subject map and the canonical SUBJ give one. title_state says why a row has no title "
                  "(not_read, blocked, not_in_catalog; catalog where it has one; a college whose file holds one section "
                  "of its catalog, its index entry's scope, leaves the credit codes it never read not_read), "
                  "title_source where the title came from, "
                  "candidate a line for a reviewer where no heading was taken (never a title by itself), and address the "
                  "subject's own page where the catalog's index links one (pages_not_read counts the linked pages that were not read; page_codes names the codes a page that was read "
                  "prints its courses under, where that is not this code). A person's saved decision "
                  "(kb/status/subject_decisions.json) replaces the title and the common code it names: title_state "
                  "person, common_source person or statewide_filing (else subject_map), and decision names the save "
                  "with what the files gave in was. Built by kb/_build_local_subject_titles.py; "
                  "no clock is read, so read_at is each catalog's own."),
        "_rule": RULE,
        "_sources": {"catalogs": CATALOGS.replace(os.sep, "/") + "/index.json", "state_list": STATE,
                     "state_list_built_at": state.get("_built_at"), "subject_map": SUBJECT_MAP.replace(os.sep, "/"),
                     "canonical_subj": CANONICAL.replace(os.sep, "/"), "subject_decisions": SD.STATUS.replace(os.sep, "/"),
                     "department_lists": DEPARTMENTS.replace(os.sep, "/")},
        # The saved decisions this build honors (kb/subject_decisions.py): how many took a row, and each one refused
        # (never applied) or matched by no row, with the reason.
        "decisions": {"applied": len(applied), "refused": dec.refused, "not_applied": not_applied,
                      "statewide_filings": len(dec.statewide), "statewide_read": bool(dec.doc.get("statewide_read"))},
        "draft": {"owner": "Courses bot", "state": "drafted", "settled_by": "a curator, for the codes that disagree"},
        "totals": T,
        "columns": COLUMNS,
        "colleges": out_colleges,
        # The Subjects page's Edit and Save (S701, r-subject-save-path-kb-curation-sam-2026-11-22) refuses a common code
        # the canonical list does not hold and offers a typed title in Title Case. It reads both from here, so the page
        # carries no copy: each canonical SUBJ with its MQ discipline, and kb/subject_title_case.py's word lists.
        "common_codes": dict(sorted((v.get("canonical_subj4"), d) for d, v in canon.items() if v.get("canonical_subj4"))),
        "title_case": {"small": sorted(SMALL), "kept": sorted(KEPT)},
        # Each COCI noncredit category's noncredit MQ discipline and common subject code, from the one table in
        # kb/_build_noncredit_subject_titles.py (MQ); a category with no code keeps none and shows by name.
        "noncredit_mq": {cat: {"mq_discipline": d, "common_code": k} for cat, (d, k) in NC_MQ.items()},
        # Each COCI noncredit category's slug, the key a noncredit save is filed under (SUBJ:<college>|<code>|nc:<slug>),
        # copied from the one list in kb/status/noncredit_categories.json so the page holds no rule of its own.
        "noncredit_slugs": {cat: s for s, cat in sorted(dec.nc_slugs.items(), key=lambda kv: kv[1])},
    }


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def fingerprint(doc):
    """sha256 over what decides the file: the document less _sources (the state list's _built_at stamp) and less this
    field. Keys sorted, so a stable order."""
    body = {k: v for k, v in (doc or {}).items() if k not in ("_sources", "fingerprint")}
    return hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def committed_fingerprint(path):
    """The fingerprint of the file on disk, recomputed from its content (a file written before the field existed
    compares too), or None."""
    try:
        with open(path, encoding="utf-8") as f:
            return fingerprint(json.load(f))
    except (OSError, ValueError):
        return None


def main(argv):
    doc = build(ROOT)
    fp = doc["fingerprint"] = fingerprint(doc)
    text = dump(doc)
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        if committed_fingerprint(path) != fp:
            print(OUT + " is behind its inputs: run python3 kb/_build_local_subject_titles.py")
            return 1
        print(OUT + " is current")
        return 0
    if "--if-changed" in argv and committed_fingerprint(path) == fp:
        print("%s: the content is unchanged (fingerprint %s); left as built" % (OUT, fp[:12]))
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    t = json.loads(text)["totals"]
    print(OUT + ": " + json.dumps(t))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
