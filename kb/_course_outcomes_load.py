#!/usr/bin/env python3
"""Course outcomes load: the filed read into course_outcomes, insert-only, with a receipt.

Sam, Open Asks Sheet 70 card 3 (2026-10-12 20:42Z): "Every course in the loaded
records", SLOs kept by college and course. kb/_course_outcomes_read.py files what
each outline prints (kb/course_outcomes/<host>/read_<run>_p<i>of<n>.json); this
script turns each course into one row per college whose loaded program records
name it, and posts them a batch at a time to course_outcomes_load()
(chatbox/supabase_course_outcomes.sql), which inserts a block the table does not
hold and touches nothing already there. The service key is the only key it takes.

The receipt (kb/receipts/course_outcomes_<host>_<load run>.json) files every id
the load inserted and the statement that deletes them, so a load rolls back from
its receipt (Rule 10 a2).

--kind objective posts the objective rows only (the objectives reread, S649): the reread's SLO rows are held back
and counted in the receipt (held_back), so an SLO block that changed since its first load is never posted beside
the loaded one by an objectives load. The load is insert-only either way: an objective row never replaces an SLO row.

Usage (runner): python3 kb/_course_outcomes_load.py --host rccd
                python3 kb/_course_outcomes_load.py --host rccd --dry   (counts, no post)
                python3 kb/_course_outcomes_load.py --host rccd --kind objective   (the objectives reread)
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "course_outcomes")
RECEIPTS = os.path.join(HERE, "receipts")
RECORDS = os.path.join(HERE, "program_requirements_college")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
LOAD_RPC = "rpc/course_outcomes_load"
# The college codes an integrated outline prints under College:, by host. A course
# is kept for each college its outline names; an outline that names none is kept
# for the colleges whose loaded records name it.
OFFERED_AT = {"rccd": {"RIV": "Riverside City College", "MOV": "Moreno Valley College",
                       "NOR": "Norco College"}}
# The colleges an All Fields report names as its outcome groups, by host (SDCCD keeps
# each college's SLOs under its own Group Title; trial 38350787486). A group whose
# title is not here is skipped with its reason, never guessed.
GROUPS = {"sdccd": {"City": "San Diego City College", "Mesa": "San Diego Mesa College",
                    "Miramar": "San Diego Miramar College"}}
# A host folder whose outline report prints each SLO as its own untitled entry in an All Fields-style list: the reader
# files each entry as a group with no title (groups_from_html), and the load joins a page's untitled entries, in the
# order printed, into the one SLO block of the colleges whose records name the course, its objectives beside them.
# Irvine Valley's Official Course Outline of Record (198) on Saddleback's host (trial 44910471774, 12 of 12; S697). A
# page that carries one titled group keeps the GROUPS rule.
UNTITLED_GROUPS = {"saddleback": {"198"}}
BATCH = 200


def untitled_groups(host: str, row: dict) -> bool:
    """Whether the load joins this row's groups into one block for the colleges its records name: a report
    UNTITLED_GROUPS names at this host folder, every group untitled."""
    groups = row.get("groups") or []
    rid = (urllib.parse.parse_qs(urllib.parse.urlparse(row.get("report") or "").query).get("reportId") or [""])[0]
    return rid in UNTITLED_GROUPS.get(host, set()) and bool(groups) and not any(g.get("group") for g in groups)


# A filed SLO or objective with no letter in it is no outcome: report 198's pages that print no Outcome Text entry
# file the summary table's "123" (12 of Irvine Valley's 866 SLO rows, read 44913397609), and Saddleback's ARCH 10 a
# "#1" (S691). The load drops such a line, and a row left with none, and counts both (DROPPED, logged per load); the
# filed read stays as read, so no parser change and no recall gate moves (the conductor, S697).
LETTER = re.compile(r"[^\W\d_]")
DROPPED = {"lines": 0, "rows": 0}
# Two more cases from San Diego College of Continuing Education's All Fields report (4), trial 45017581874 (S703).
# Its Student Learning Objectives field lists each objective under an "Objective Text" label, and the field's Legacy
# Data subfield follows: on most pages (AUTO 411, HLTH 605) a numbered paragraph repeating the objectives above it,
# so a block whose objectives come first ends at the Legacy Data heading (that line and every line after it). Where
# the field prints no Objective Text entry (HMID 535) the paragraph is the page's only copy of its objectives
# (d-legacy-objectives-kept-when-only-copy-s703): the load drops the heading alone and loads the paragraph, one
# objective per number where it numbers them 1, 2, 3 in order, the lead-in before "1." left out. And HSDP 403's one
# entry reads "See specific course outline.": a line that only points to another outline drops. The filed read stays
# as read, so no parser change and no recall gate moves (as d-outline-load-strips-letterless-lines-s697).
FIELD_END = re.compile(r"^\s*legacy data\s*:?\s*$", re.I)
POINTER = re.compile(r"^\s*see (the )?(specific |individual )?course outlines?\.?\s*$", re.I)
NUMBERED = re.compile(r"(?:^|(?<=\s))(\d{1,2})[.)]\s+")
# Four label cases on Peralta's lan.curriqunet.com, full read 45031089800 (S713; d-peralta-load-cleans-labels-first-
# s713). The load cleans them at the lan folder only (LABEL_CLEAN_HOSTS), so no other host's load or re-post changes;
# the filed read stays as read, so no parser change and no recall gate or fingerprint moves (as
# d-outline-load-strips-letterless-lines-s697). (1) A leading ": " the Exit Skills field prints before an item is
# stripped (215 objectives). (2) The SCANS framework a page appends to its objectives (113 lines at 34 courses; College
# of Alameda AMT 058: "SCANS Competencies:", "Competency #3: Information", "Skill #1: Basic Skills"): a SCANS heading,
# a "Competency #N" or "Skill #N" line, or a "Scans competency No. N" line opens a run; it and every line after it that
# begins with a SCANS framework term drop, and the run ends at the first line that does not (Laney ECT 015 keeps the
# three objectives printed after its SCANS lines). A line that only names SCANS inside an objective ("Utilize and
# incorporate SCANS Competencies into the occupational learning experience:") stays. (3) A line that is only a "Part
# N" heading (Laney ARTH C1100 "Part 2", the trial's one wrong row) drops; "Part 1:: <text>" (COMM C1004) loses the
# label and keeps its text, which is the objective. (4) A line that is only a placeholder ("None", "N/A", "y") drops,
# and a block of nothing else loads nothing and is listed as a skip (7 blocks).
LABEL_CLEAN_HOSTS = {"lan"}
LABEL_CLEANED = {"colon": 0, "scans": 0, "part": 0, "placeholder": 0, "rows": 0}
LEAD_COLON = re.compile(r"^\s*:+\s*")
SCANS_OPEN = re.compile(r"^(scans\s+competenc\w*\s*:?\s*(competency\s*#\s*\d+.*)?|(competency|skill)\s*#\s*\d+\s*:?.*|"
                        r"scans\s+(competency\s+)?(no\.?\s*)?\d+\b.*)$", re.I)
SCANS_TERM = re.compile(
    r"^(information|interpersonal|technology|resources|systems|basic skills|thinking skills|personal qualities|"
    r"knowledge of industry|works with|acquires? and|organizes? and|interprets? and|uses? computers|selects? "
    r"technology|appl(y|ies) technology|maintains? and troubleshoots?|understands? systems|monitors? and corrects?|"
    r"improves? or designs?|participates? as|teaches? others|serves? clients|exercises? leadership|negotiates?|time|"
    r"money|materials?|human resources|reading|writing|arithmetic|mathematics|listening|speaking|creative thinking|"
    r"decision[- ]making|problem solving|seeing things|knowing how to learn|reasoning|responsibility|self-esteem|"
    r"sociability|self-management|integrity|displays? responsibility)\b", re.I)
PART_LABEL = re.compile(r"^part\s*\d+\s*:*\s*", re.I)
PLACEHOLDER = re.compile(r"^(none|n/?a|not applicable|tba|tbd|[a-z])\.?$", re.I)


def label_clean(block: dict) -> dict | None:
    """The block with the four lan label cases cleaned (LABEL_CLEAN_HOSTS): a leading ": " stripped, a SCANS run, a
    bare "Part N" heading and a placeholder line dropped, a "Part N:" label stripped from the text it heads. Its
    fingerprint and shape are taken from what is left; the block itself when nothing changes; None when no line is
    left (counted in LABEL_CLEANED["rows"])."""
    items = block.get("outcomes") or []
    maps = block.get("maps_to")
    aligned = isinstance(maps, list) and len(maps) == len(items)
    outs, kept_maps, in_scans, changed = [], [], False, False
    for i, raw in enumerate(items):
        text = raw or ""
        if LEAD_COLON.match(text):
            text = LEAD_COLON.sub("", text)
            LABEL_CLEANED["colon"] += 1
        bare = text.strip()
        if SCANS_OPEN.match(bare) or (in_scans and SCANS_TERM.match(bare)):
            in_scans = True
            LABEL_CLEANED["scans"] += 1
            changed = True
            continue
        in_scans = False
        if PART_LABEL.match(bare):
            rest = PART_LABEL.sub("", bare)
            LABEL_CLEANED["part"] += 1
            changed = True
            if not rest:
                continue
            text = rest
        if PLACEHOLDER.match(bare):
            LABEL_CLEANED["placeholder"] += 1
            changed = True
            continue
        changed = changed or text != raw
        outs.append(text)
        if aligned:
            kept_maps.append(maps[i])
    if not changed:
        return block
    if not outs:
        LABEL_CLEANED["rows"] += 1
        return None
    return {**block, "outcomes": outs, "maps_to": kept_maps if aligned else maps, "fingerprint": fingerprint(outs),
            "shape": "list" if len(outs) > 1 else "paragraph"}


def numbered_items(text: str) -> list[str] | None:
    """A paragraph's numbered objectives ("... to: 1. Adhere ... 2. Sew ..."), each without its number, when it
    numbers two or more of them 1, 2, 3 in order; None otherwise, and the paragraph loads whole."""
    marks = list(NUMBERED.finditer(text or ""))
    if len(marks) < 2 or [int(m.group(1)) for m in marks] != list(range(1, len(marks) + 1)):
        return None
    ends = [m.start() for m in marks[1:]] + [len(text)]
    out = [text[m.end():e].strip() for m, e in zip(marks, ends)]
    return out if all(LETTER.search(o) for o in out) else None


def no_letterless(block: dict) -> dict | None:
    """The block with every line that holds no letter dropped, and a line that only points to another outline
    (POINTER), its maps_to entries with each; a Legacy Data heading after the block's objectives ends it, and one
    that opens the block is dropped alone, its paragraph split by its numbers (FIELD_END, numbered_items; S703).
    Its fingerprint and shape are taken from what is left; the block itself when none drops; None when no line is
    left."""
    items = block.get("outcomes") or []
    if items and FIELD_END.match(items[0] or ""):
        legacy = []
        for o in items[1:]:
            legacy += numbered_items(o) or [o]
        DROPPED["lines"] += 1
        if not legacy:
            return None
        return no_letterless({**block, "outcomes": legacy, "maps_to": None, "fingerprint": fingerprint(legacy),
                              "shape": "list" if len(legacy) > 1 else "paragraph"})
    end = next((i for i, o in enumerate(items) if FIELD_END.match(o or "")), len(items))
    keep = [i for i, o in enumerate(items[:end]) if LETTER.search(o or "") and not POINTER.match(o or "")]
    if len(keep) == len(items):
        return block
    DROPPED["lines"] += len(items) - len(keep)
    if not keep:
        return None
    outs = [items[i] for i in keep]
    maps = block.get("maps_to")
    if isinstance(maps, list) and len(maps) == len(items):
        maps = [maps[i] for i in keep]
    return {**block, "outcomes": outs, "maps_to": maps, "fingerprint": fingerprint(outs),
            "shape": "list" if len(outs) > 1 else "paragraph"}


def why_all_dropped(block: dict) -> str:
    """Why the load dropped every line of a filed block: a bare number (the S697 reason), or a field heading and
    what follows it, or a pointer to another outline (S703)."""
    items = block.get("outcomes") or []
    if not any(LETTER.search(o or "") for o in items):
        return "every filed line holds no letter (a bare number)"
    return "every filed line holds no letter, is a Legacy Data heading or a line after it, or points to another outline"


def shared_folder_problem(host: str, slugs: list[str]) -> str | None:
    """Why a load names too few colleges: a host folder holding complete reads of two or more college sets
    (Saddleback's and Irvine Valley's under saddleback, the Coast district's under cccd) loads only with slugs=, or
    its receipt's key-scoped rollback would name every college's rows in the folder (second reader on #3642)."""
    sets = {_slug_set(d) for _, d in _heads(host) if d.get("complete")}
    if not slugs and len(sets) > 1:
        return ("%s holds the reads of %s: name the college with slugs=" % (host, "; ".join(
            sorted(",".join(sorted(s)) for s in sets))))
    return None
KINDS = ("all", "slo", "objective")


def only_kind(rows: list[dict], kind: str) -> tuple[list[dict], int]:
    """The rows of one kind ("all" keeps every row), and how many were held back."""
    if kind == "all":
        return rows, 0
    kept = [r for r in rows if r["kind"] == kind]
    return kept, len(rows) - len(kept)


def college_of(slug: str) -> str:
    """The registry name a college's loaded records carry."""
    for path in sorted(glob.glob(os.path.join(RECORDS, slug, "records", "*.json"))):
        name = (json.load(open(path)) or {}).get("college")
        if name:
            return name
    raise SystemExit("no loaded records name the college for %s" % slug)


def fingerprint(outcomes: list[str]) -> str:
    return hashlib.md5(json.dumps(outcomes, ensure_ascii=False).encode()).hexdigest()


def read_files(host: str, slugs: list[str] | None = None) -> list[str]:
    """The newest complete read of each slice (a college set's part of a read): a later run's slice replaces an
    earlier one of the same colleges. With slugs, only the
    reads whose slugs name one of them (the Coast district files three colleges under cccd: an objectives reread of
    one college must not repost the others)."""
    best: dict[tuple, tuple] = {}
    want = set(slugs or [])
    # A read queue.json's never_load names is never posted, nor stands in for a slice (S689: Feather River's
    # 44535960153 and Mt. San Antonio's 44695707506 filed table headers and a course listing as SLOs).
    queue = os.path.join(OUT_DIR, "queue.json")
    void = {str(k) for k in (json.load(open(queue)).get("never_load") or {})} if os.path.exists(queue) else set()
    for path in glob.glob(os.path.join(OUT_DIR, host, "read_*_p*of*.json")):
        d = json.load(open(path))
        if not d.get("complete") or str(d.get("run")) in void:
            continue
        if want and not (want & set(str(d.get("slugs") or "").split(","))):
            continue
        # A slice is one college set's part of one read: the Coast district files three colleges under cccd, so a
        # newer Coastline slice must never stand in for Golden West's (S670).
        key = (_slug_set(d), d["part"], d["of"])
        if key not in best or int(d["run"]) > int(best[key][0]):
            best[key] = (d["run"], path)
    # A college set re-read in a different number of parts: its newest run's split is the one that counts, so an
    # older split's parts never stand beside the new ones (COBIx on #3420, S670).
    newest_of: dict[frozenset, tuple] = {}
    for (sset, _part, of), (run, _path) in best.items():
        if sset not in newest_of or int(run) > int(newest_of[sset][0]):
            newest_of[sset] = (run, of)
    best = {k: v for k, v in best.items() if k[2] == newest_of[k[0]][1]}
    return [p for _, p in sorted(best.values(), key=lambda x: x[1])]


def _heads(host: str) -> list[tuple[str, dict]]:
    """Every slice file a host holds, complete or not, with its head (no rows)."""
    out = []
    for path in glob.glob(os.path.join(OUT_DIR, host, "read_*_p*of*.json")):
        d = json.load(open(path))
        out.append((path, {k: d.get(k) for k in ("run", "part", "of", "slugs", "complete")}))
    return out


def _slug_set(d: dict) -> frozenset:
    return frozenset(x for x in str(d.get("slugs") or "").split(",") if x)


def unknown_slugs(host: str, slugs: list[str]) -> list[str]:
    """The --slugs entries no complete read of the host names (a typo must fail, never load the rest quietly)."""
    named = set().union(*[_slug_set(d) for _, d in _heads(host) if d.get("complete")] or [set()])
    return [s for s in slugs if s not in named]


def whole_run_problem(host: str, slugs: list[str] | None, paths: list[str]) -> str | None:
    """For a kind= load (the objectives reread): each read's newest run must be filed whole, every part 1..of
    complete, and every chosen slice must come from it. Otherwise read_files would fall back to an earlier run's
    slice for an unfinished part, and the load would post objectives for only some of the courses."""
    want = set(slugs or [])
    newest: dict[frozenset, tuple] = {}
    for path, d in _heads(host):
        key = _slug_set(d)
        if want and not (want & key):
            continue
        run = int(d["run"])
        if key not in newest or run > newest[key][0]:
            newest[key] = (run, int(d["of"]), {})
        if run == newest[key][0]:
            newest[key][2][int(d["part"])] = (bool(d.get("complete")), int(d["of"]), path)
    chosen = {os.path.abspath(p) for p in paths}
    for key, (run, of, parts) in sorted(newest.items(), key=lambda kv: sorted(kv[0])):
        for i in range(1, of + 1):
            got = parts.get(i)
            if not got or not got[0] or got[1] != of:
                return ("read %s (%s): part %d of %d is %s; a kind= load takes one whole read run, never an earlier "
                        "run's slice in its place" % (run, ",".join(sorted(key)), i, of,
                                                      "not complete" if got else "not filed"))
            if os.path.abspath(got[2]) not in chosen:
                return "read %s part %d of %d is not among the chosen slices" % (run, i, of)
    return None


# Hosts where one course code holds several colleges' outlines and each page prints its own college (Peralta's four
# on lan.curriqunet.com, read into kb/course_outcomes/lan; the reader files college_printed). The page decides: a
# row is kept for the college it prints when that college's records name the code, and for no other; a page that
# prints no college, or one whose college's records do not name the code, loads nothing (S703).
PAGE_COLLEGE_HOSTS = {"lan"}


def page_college_problem(host: str, row: dict, names: dict) -> str | None:
    """Why a shared-code host's row loads for no college; None when it loads for the one its page prints."""
    if host not in PAGE_COLLEGE_HOSTS:
        return None
    printed = row.get("college_printed")
    if not printed:
        return "the page prints no college"
    named = [names.setdefault(slug, college_of(slug)) for slug in row.get("named_by") or []]
    if printed not in named:
        return "the page prints %s, whose records do not name the code" % printed
    return None


def colleges_for(host: str, row: dict, names: dict) -> list[str]:
    if host in PAGE_COLLEGE_HOSTS:
        return [] if page_college_problem(host, row, names) else [row["college_printed"]]
    codes = OFFERED_AT.get(host) or {}
    printed = [codes[c] for c in row.get("offered_at") or [] if c in codes]
    if printed:
        return printed
    return [names.setdefault(slug, college_of(slug)) for slug in row.get("named_by") or []]


def rows_from(paths: list[str], host: str = "") -> tuple[list[dict], list[dict]]:
    """One row per college and course; a course whose outline printed no outcomes is
    skipped with its reason. A course read as groups (SDCCD) gives one row per group,
    for the college its title names."""
    names: dict[str, str] = {}
    rows, skipped, seen = [], [], set()
    DROPPED.update(lines=0, rows=0)
    LABEL_CLEANED.update(colon=0, scans=0, part=0, placeholder=0, rows=0)

    def add(college, r, block, d, kind="slo"):
        if host in LABEL_CLEAN_HOSTS:
            cleaned = label_clean(block)
            if cleaned is None:
                skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": "none", "kind": kind,
                                "college": college, "why": "every filed line is a placeholder or a label (None, N/A, "
                                                           "a Part heading, the SCANS framework)"})
                return
            block = cleaned
        filed, block = block, no_letterless(block)
        if block is None:
            # Every line the page filed here holds no letter: nothing to load, and the row says why.
            DROPPED["rows"] += 1
            skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": "none", "kind": kind,
                            "college": college, "why": why_all_dropped(filed)})
            return
        key = (college, r["code"], r["report"], kind, block["fingerprint"])
        if key in seen:
            return
        seen.add(key)
        rows.append({"college": college, "course_code": r["code"], "course_title": r.get("title"), "kind": kind,
                     "heading": block.get("heading"), "lead": block.get("lead"), "outcomes": block["outcomes"],
                     "maps_to": block.get("maps_to"),
                     "shape": block["shape"], "fingerprint": block["fingerprint"], "source_url": r["report"],
                     "source_kind": d.get("source_kind", "course_outline"), "source_system": d.get("system", "curriqunet"),
                     "read_run": str(d["run"])})

    def add_objectives(colleges, r, d):
        """The course objectives a page printed (Sam, 2026-11-02), one row per college beside its SLOs; a read
        filed before the reader took them carries none and adds nothing."""
        items = r.get("objectives") or []
        if r.get("status") != 200 or not items:
            return
        if r.get("objectives_fingerprint") != fingerprint(items):
            raise SystemExit("%s: the filed objectives fingerprint does not match its objectives" % r.get("code"))
        block = {"heading": r.get("objectives_heading"), "lead": r.get("objectives_lead"), "outcomes": items,
                 "maps_to": None, "shape": "list" if len(items) > 1 else "paragraph", "fingerprint": fingerprint(items)}
        for college in colleges:
            add(college, r, block, d, kind="objective")

    for path in paths:
        d = json.load(open(path))
        for r in d["rows"]:
            why = page_college_problem(host, r, names) if r.get("status") == 200 else None
            if why:
                skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": r.get("shape"),
                                "course_id": r.get("course_id"), "why": why})
                continue
            if r.get("status") == 200 and r.get("shape") == "groups" and untitled_groups(host, r):
                for g in r["groups"]:
                    if g.get("outcomes") and g.get("fingerprint") != fingerprint(g["outcomes"]):
                        raise SystemExit("%s: the filed fingerprint does not match its outcomes" % r.get("code"))
                items = [o for g in r["groups"] for o in g.get("outcomes") or []]
                colleges = colleges_for(host, r, names)
                add_objectives(colleges, r, d)
                if not items:
                    skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": "groups",
                                    "why": "no untitled entry printed an outcome"})
                    continue
                block = {"heading": r.get("heading") or "Student Learning Outcomes", "lead": None, "outcomes": items,
                         "maps_to": None, "shape": "list" if len(items) > 1 else "paragraph",
                         "fingerprint": fingerprint(items)}
                for college in colleges:
                    add(college, r, block, d)
                continue
            if r.get("status") == 200 and r.get("objectives"):
                if r.get("shape") == "groups":
                    # A district report prints one set of objectives for the course: each college whose group it names.
                    cols = [(GROUPS.get(host) or {}).get(g.get("group") or "") for g in r.get("groups") or []]
                    add_objectives([c for c in dict.fromkeys(cols) if c], r, d)
                else:
                    add_objectives(colleges_for(host, r, names), r, d)
            if r.get("status") == 200 and r.get("shape") == "groups":
                for g in r.get("groups") or []:
                    if not g.get("outcomes"):
                        continue
                    if g.get("fingerprint") != fingerprint(g["outcomes"]):
                        raise SystemExit("%s (%s): the filed fingerprint does not match its outcomes"
                                         % (r.get("code"), g.get("group")))
                    college = (GROUPS.get(host) or {}).get(g.get("group") or "")
                    if not college:
                        skipped.append({"course_code": r.get("code"), "status": r.get("status"),
                                        "shape": "groups", "group": g.get("group"),
                                        "why": "the group names no college this host maps"})
                        continue
                    add(college, r, g, d)
                continue
            if r.get("status") != 200 or r.get("shape") not in ("list", "paragraph") or not r.get("outcomes"):
                skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": r.get("shape")})
                continue
            if r.get("fingerprint") != fingerprint(r["outcomes"]):
                raise SystemExit("%s: the filed fingerprint does not match its outcomes" % r.get("code"))
            for college in colleges_for(host, r, names):
                add(college, r, r, d)
    return rows, skipped


def _rpc(body: dict, key: str) -> dict:
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/" + LOAD_RPC, data=json.dumps(body).encode(),
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "{}")


def _lit(v) -> str:
    return "'%s'" % str(v).replace("'", "''")


def rollback_by_key(sent: list[dict]) -> str | None:
    """The delete that holds when a batch's response is lost (S649 review of #3263): every row this load could have
    inserted carries one of the sent rows' (college, read_run) pairs and kinds. read_run is a column of
    course_outcomes (chatbox/supabase_course_outcomes.sql), filed from the read, so a reread's fresh run scopes it
    exactly. It also takes rows an earlier load of the same read inserted, so run it only to undo every load of
    that read."""
    sent = [r for r in sent if r.get("college") and str(r.get("read_run") or "").isdigit()]
    if not sent:
        return None
    kinds = sorted({r.get("kind") or "slo" for r in sent})
    pairs = sorted({(r["college"], str(r["read_run"])) for r in sent})
    return ("-- also removes rows an earlier load of these read runs inserted\n"
            "delete from public.course_outcomes where kind in (%s) and (college, read_run) in (%s);"
            % (", ".join(_lit(k) for k in kinds), ", ".join("(%s, %s)" % (_lit(c), int(run)) for c, run in pairs)))


def receipt_of(host: str, run: str, paths: list[str], rows: list[dict], skipped: list[dict],
               results: list[dict], error: str | None, kind: str = "all", held_back: int = 0,
               sent: list[dict] | None = None) -> dict:
    """sent: the rows in batches actually posted (a batch that raised is counted: it may have committed).
    Default every row."""
    sent = rows if sent is None else sent
    ids = [k["id"] for res in results for k in res.get("inserted_keys") or []]
    return {
        "what": "course_outcomes_load: course SLOs as printed, by college and course (Sheet 70 card 3)",
        "host": host, "load_run": run, "reads": [os.path.relpath(p, os.path.dirname(HERE)) for p in paths],
        "kind": kind, "held_back": held_back,
        "posted": len(sent), "inserted": len(ids), "kept": sum(res.get("kept", 0) for res in results),
        "skipped": len(skipped), "skipped_rows": skipped, "error": error,
        "inserted_keys": [k for res in results for k in res.get("inserted_keys") or []],
        "rollback": ("delete from public.course_outcomes where id in (%s);" % ", ".join(map(str, ids)))
                    if ids else None,
        # Only when a batch failed: its response may be lost though it committed. On a clean load the ids are
        # the whole record, and a key-scoped delete would also take rows an earlier load of the same read inserted.
        "rollback_by_key_if_error": rollback_by_key(sent) if error else None,
        "rollback_note": ("rollback deletes the ids the responses named. rollback_by_key_if_error is filed only "
                          "when error is set: a batch may have committed without its response. It takes every "
                          "row of the sent kinds and (college, read_run) pairs, including any an earlier load "
                          "of the same read inserted."),
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", required=True, help="the read's host folder, e.g. rccd")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID", ""))
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--kind", default="all", choices=KINDS,
                    help="objective: post the objective rows only (the objectives reread); default every row")
    ap.add_argument("--slugs", default="", help="only the reads whose slugs name one of these (comma list)")
    a = ap.parse_args(argv)
    slugs = [x.strip() for x in a.slugs.split(",") if x.strip()]
    shared = shared_folder_problem(a.host, slugs)
    if shared:
        print("load refused: %s" % shared)
        return 2
    missing = unknown_slugs(a.host, slugs)
    if missing:
        print("--slugs names %s, which no complete read of %s names" % (", ".join(missing), a.host))
        return 2
    paths = read_files(a.host, slugs)
    if not paths:
        print("no complete read filed for %s" % a.host)
        return 2
    if a.kind != "all":
        problem = whole_run_problem(a.host, slugs, paths)
        if problem:
            print("kind=%s load refused: %s" % (a.kind, problem))
            return 1
    rows, skipped = rows_from(paths, a.host)
    rows, held_back = only_kind(rows, a.kind)
    if a.kind != "all" and not rows:
        # A kind= line left in .load must never turn a later ordinary load into a silent no-op.
        print("kind=%s found no %s rows in the reads of %s: nothing to load. A stale kind= line in "
              "kb/course_outcomes/.load? Remove it for an ordinary load." % (a.kind, a.kind, a.host))
        return 1
    colleges: dict[str, int] = {}
    for r in rows:
        colleges[r["college"]] = colleges.get(r["college"], 0) + 1
    print("reads: %d (%s)" % (len(paths), ", ".join(re.sub(r"^read_|\.json$", "", os.path.basename(p)) for p in paths)))
    print("reads: %d; rows: %d (%s); skipped courses: %d; kind %s, held back %d"
          % (len(paths), len(rows), ", ".join("%s %d" % kv for kv in sorted(colleges.items())), len(skipped),
             a.kind, held_back))
    print("dropped as holding no letter: %d line(s); %d row(s) left with none" % (DROPPED["lines"], DROPPED["rows"]))
    if a.host in LABEL_CLEAN_HOSTS:
        print("labels cleaned: %(colon)d leading colon(s) stripped; %(scans)d SCANS line(s), %(part)d Part heading(s) "
              "and %(placeholder)d placeholder(s) dropped; %(rows)d block(s) left with none" % LABEL_CLEANED)
    if a.dry:
        return 0
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the load function takes only the service role.")
        return 2
    if not a.run.isdigit():
        print("a numeric run id is required (--run, or GITHUB_RUN_ID)")
        return 2
    results, error, sent = [], None, []
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i + BATCH]
        sent.extend(batch)  # counted before the call: a batch that raises may still have committed
        try:
            results.append(_rpc({"p_run": a.run, "p_rows": batch}, key))
        except Exception as exc:  # the receipt still files what loaded before it
            error = "batch %d: %s" % (i // BATCH + 1, (str(exc).splitlines() or [type(exc).__name__])[0][:300])
            break
    receipt = receipt_of(a.host, a.run, paths, rows, skipped, results, error, a.kind, held_back, sent)
    os.makedirs(RECEIPTS, exist_ok=True)
    path = os.path.join(RECEIPTS, "course_outcomes_%s_%s.json" % (a.host, a.run))
    with open(path, "w") as f:
        json.dump(receipt, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("load: %d posted, %d inserted, %d kept%s; receipt %s"
          % (receipt["posted"], receipt["inserted"], receipt["kept"], "; STOPPED at " + error if error else "",
             os.path.relpath(path, os.path.dirname(HERE))))
    return 1 if error else 0


if __name__ == "__main__":
    sys.exit(main())
