#!/usr/bin/env python3
"""A college's own program map, read into terms: the sequence half of a program record.

WHY. The harvest's By term view (CPL Pathways, `roepTermMap` in cpl_pathways.js)
waits on a read map, and no pilot college publishes one this reader can open:
Miramar's Program Pathways Mapper answers 403 (sheet 29 card 3 put the refusal
on the college's record). The registry records two colleges whose own sites
publish maps and answer: Irvine Valley (All Program Maps) and Santa Monica
(Program Maps). College page read run 37372136739 (S336, 2026-10-05) read both
index pages and three of Santa Monica's program pages; this module turns the
text that run printed into terms, so the reading stays on the runner and the
parsing stays testable here.

Two shapes, measured on that run:

  Irvine Valley  one paginated page (seven pages) prints every map whole. A map
                 opens on its header ("Art, AA · AA-GE · 2 Years Full-Time ·
                 60-64 Units"), then each term ("Semester 3 · 15 Units") heads a
                 table whose rows are tab-separated: COURSE, TITLE, the GE area
                 or Major, UNITS.
  Santa Monica   one page per program (program.php?id=N). Each term ("Semester
                 1 (First 8 weeks) · 9 Units") lists items as CODE · TITLE ·
                 "1 unit", or TITLE · "3 units" for a slot the map leaves open
                 (a GE area, an elective, "Salon Experience").

The reader folds runs of short lines into one line joined by " · " (FOLD_UNDER
in kb/_college_page_read.py), so both parsers split on newlines and on that
separator alike.

Each item keeps the text as printed and gains a kind:
  course     one course code ("ART 85", "ENGL C1000 (WR 1)")
  choice     several codes, one to take ("HIST 20 or HIST 21"), or an open slot
             whose title matches closed-list courses ("Salon Experience")
  list       a slot filled from the catalog's list ("Art Major Course from List A")
  ge         a general education slot ("Natural Sciences GE Course")
  elective   an open elective
The catalog keeps the rule; the map names the pick where it names one (Sam,
2026-10-04 ~17:35Z, pathway-map-names-the-pick-inside-a-choice).

ACCEPTANCE, stated so a run can fail it (Sam, open-asks sheet 50 card 4,
2026-10-08, as proposed). A map is accepted for a program when it has at least
two terms and the listed courses it names outnumber the courses it names off
the list: a course in one of the program's own subjects that the state's
Program Course File does not list for the program. Each off-list course stays
on the map, marked (an item's "off_list"), and shows as recommended by the
college outside the program; Mt. San Antonio's Fire Technology page names 8
listed courses and three KINF courses the certificate does not list. A map
that names more off-list courses than listed ones belongs to another program
and is refused. The coverage figure (the closed list's courses the map names,
directly or inside a choice) is reported beside it and never gates: a map that
leaves the major's choices as list slots names the required core and nothing
else, which is a correct map (Irvine Valley's Art A.A. names 5 of 23).

It reads and writes nothing on the network. `build()` writes the sequence
records under kb/program_requirements_pilot/sequences/ from the sources filed
beside them; tests/program_map_parse_test.py covers the parsers on those
sources.
"""
from __future__ import annotations

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SEQ_DIR = os.path.join(HERE, "program_requirements_pilot", "sequences")

SEP = re.compile(r"\n| · ")
CODE = re.compile(r"^([A-Z]{2,6})\s+(C?\d{1,4}[A-Z]{0,2}(?:\.\d)?)\b")
UNITS = re.compile(r"^(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+units?$", re.I)
TERM = re.compile(r"^(Semester \d+(?: \([^)]*\))?|Summer|Winter|Intersession|Year \d+[^·]*)$", re.I)
TERM_UNITS = re.compile(r"^(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?) Units$")
IVC_HEADER = re.compile(r"^(?:(?:CSU|UC) Transfer: )?.+, (?:AA-T|AS-T|AA|AS|COA|COP|COC|Major)\*?$")
IVC_TABLE_HEAD = re.compile(r"^﻿?COURSE\tTITLE\t")
SMC_NOISE = {"EXPANDCOLLAPSE", "(opens in new window)", "(OPENS IN NEW WINDOW)"}


def norm(code: str) -> str:
    return re.sub(r"[^A-Z0-9.]", "", code.upper())


def tokens(text: str) -> list[str]:
    return [t.strip() for t in SEP.split(text or "") if t.strip()]


def codes_in(text: str, subject_hint: str | None = None) -> list[str]:
    """Course codes a cell names, in order: "STAT C1000 (MATH 10), ECON 10, MGT 10,
    or MATH 111" gives STAT C1000, ECON 10, MGT 10, MATH 111; "PHIL 1, 2, 5, 10, or
    11" carries PHIL to each bare number. A parenthetical old number is dropped."""
    s = re.sub(r"\([^)]*\)", " ", text)
    out, subj = [], subject_hint
    for part in re.split(r",\s*(?:or\s+|and\s+)?|\s+or\s+|\s+and/or\s+|\s*/\s*", s):
        part = part.strip()
        if not part:
            continue
        m = CODE.match(part)
        if m:
            subj = m.group(1)
            out.append("%s %s" % (m.group(1), m.group(2)))
            continue
        m = re.match(r"^(C?\d{1,4}[A-Z]{0,2}(?:\.\d)?)$", part)
        if m and subj:
            out.append("%s %s" % (subj, m.group(1)))
    return out


def resolve(code: str, closed: dict) -> str:
    """A footnote mark prints glued to a course number ("MATH 3A1", "PHYSICS 4A2").
    A code off the closed list that is on it once one trailing digit goes is that
    course; anything else stays as printed."""
    if norm(code) in closed or not code[-1:].isdigit():
        return code
    return code[:-1] if norm(code[:-1]) in closed else code


def classify(code_cell: str, title: str, closed: dict) -> dict:
    found = [resolve(c, closed) for c in codes_in(code_cell)]
    low = (code_cell + " " + title).lower()
    if re.search(r"\bfrom list\b|\bmajor course\b", low):
        return {"kind": "list", "codes": []}
    if "elective" in low and not found:
        return {"kind": "elective", "codes": []}
    if found:
        return {"kind": "course" if len(found) == 1 else "choice", "codes": found}
    if "ge course" in low or "ge area" in low or "ge lab" in low:
        return {"kind": "ge", "codes": []}
    by_title = [c for c, t in closed.items() if t and t.lower() == title.strip().lower()]
    if by_title:
        return {"kind": "choice", "codes": sorted(closed_codes(closed, by_title))}
    return {"kind": "ge", "codes": []}


def closed_codes(closed: dict, keys: list[str]) -> list[str]:
    return [closed[k + "#code"] for k in keys if k + "#code" in closed]


def closed_index(closed_list: list[dict]) -> dict:
    """norm(code) -> title, plus norm(code)#code -> the code as the state prints it."""
    idx = {}
    for c in closed_list:
        idx[norm(c["code"])] = c.get("title") or ""
        idx[norm(c["code"]) + "#code"] = c["code"]
    return idx


# ── Irvine Valley: every map on one page ─────────────────────────────────────
def ivc_maps(text: str) -> dict[str, list[str]]:
    """header -> its tokens, for every map the page prints."""
    maps, cur = {}, None
    for t in tokens(text):
        if IVC_HEADER.match(t) and "\t" not in t:
            cur = t
            maps[cur] = []
        elif cur is not None:
            maps[cur].append(t)
    return maps


def parse_ivc(header: str, toks: list[str], closed_list: list[dict]) -> dict:
    closed = closed_index(closed_list)
    pattern, terms, notes, term = [], [], [], None
    for t in toks:
        if TERM.match(t):
            term = {"label": t, "units": None, "items": []}
            terms.append(term)
        elif term is not None and term["units"] is None and TERM_UNITS.match(t):
            term["units"] = TERM_UNITS.match(t).group(1)
        elif IVC_TABLE_HEAD.match(t):
            continue
        elif term is not None and "\t" in t:
            cells = t.split("\t")
            code_cell, title = cells[0].strip(), (cells[1].strip() if len(cells) > 1 else "")
            item = {"text": t.replace("\t", " | "), "units": cells[-1].strip() or None}
            item.update(classify(code_cell, title, closed))
            term["items"].append(item)
        elif term is None:
            pattern.append(t)
        else:
            notes.append(t)
    return {"map_title": header, "pattern": " · ".join(p for p in pattern if not p.startswith("This is only")),
            "terms": terms, "notes": [n for n in notes if not n.startswith("This is only")]}


# ── Santa Monica: one page per program ───────────────────────────────────────
def parse_smc(text: str, closed_list: list[dict]) -> dict:
    closed = closed_index(closed_list)
    toks = tokens(text)
    title = toks[1] if len(toks) > 1 and toks[0].startswith("COLLEGE CATALOG") else ""
    award = toks[2] if len(toks) > 2 else ""
    terms, term, pending = [], None, []
    for t in toks:
        if t in SMC_NOISE:
            continue
        if TERM.match(t):
            term = {"label": t, "units": None, "items": []}
            terms.append(term)
            pending = []
            continue
        if term is None:
            continue
        if term["units"] is None and TERM_UNITS.match(t):
            term["units"] = TERM_UNITS.match(t).group(1)
            continue
        m = UNITS.match(t)
        if m:
            if pending:
                code_cell = pending[0] if CODE.match(pending[0]) else ""
                ttl = pending[-1] if code_cell and len(pending) > 1 else " ".join(pending)
                item = {"text": " · ".join(pending + [t]), "units": m.group(1)}
                item.update(classify(code_cell, ttl, closed))
                term["items"].append(item)
            pending = []
            continue
        pending.append(t)
    return {"map_title": title.replace("COLLEGE CATALOG · ", ""), "pattern": award, "terms": terms, "notes": []}


# ── Mt. San Antonio: a Guided Pathways page per program ──────────────────────
MTSAC_TERM = re.compile(r"^(?:Fall|Winter|Spring|Summer) Semester \(Year \d\)$")
MTSAC_HEAD = re.compile(r"^Course Prefix\tTitle\tUnits$")
MTSAC_TOTAL = re.compile(r"^Total:\t\s*\t(\d+(?:\.\d+)?)$")
MTSAC_TITLE = re.compile(r"^.+ [A-Z]\d{4}$")


def parse_mtsac(text: str, closed_list: list[dict]) -> dict:
    """Each term ("Fall Semester (Year 1)") heads a table of tab-separated rows,
    COURSE, TITLE, UNITS, closed by "Total: <units>". A row whose title opens
    "(or)" is the alternative to the row above it. A line inside a term that is
    no row (Winter: "EMT course see notes section") is a note on that term; the
    page's echoes of the program's own name (a line ending in its own local code)
    and its petition line are dropped. A line naming another award's code is kept:
    the Early Childhood Education page marks where each Child Development
    certificate falls due ("Certificate: Child Development, L1 M0663"). The page
    ends its map at "Program Notes"."""
    closed = closed_index(closed_list)
    title, own, terms, notes, term = "", "", [], [], None
    for t in tokens(text):
        if t == "Program Notes":
            break
        if MTSAC_TERM.match(t):
            term = {"label": t, "units": None, "items": []}
            terms.append(term)
            continue
        if term is None:
            if not title and MTSAC_TITLE.match(t) and "\t" not in t:
                title, own = t, t.split()[-1]
            continue
        if MTSAC_HEAD.match(t):
            continue
        m = MTSAC_TOTAL.match(t)
        if m:
            term["units"] = m.group(1)
            continue
        if "\t" in t:
            cells = [c.strip() for c in t.split("\t")]
            code_cell, ttl = cells[0], (cells[1] if len(cells) > 1 else "")
            alt = ttl.startswith("(or)")
            if alt and term["items"] and codes_in(code_cell):
                prev = term["items"][-1]
                prev["text"] += " · " + t.replace("\t", " | ")
                prev["codes"] = prev["codes"] + [resolve(c, closed) for c in codes_in(code_cell)]
                prev["kind"] = "choice"
                continue
            item = {"text": t.replace("\t", " | "), "units": (cells[2] if len(cells) > 2 else "") or None}
            item.update(classify(code_cell, ttl, closed))
            term["items"].append(item)
        elif not (own and t.endswith(own)) and not t.startswith("Submit petition"):
            notes.append("%s: %s" % (term["label"], t) if not term["items"] else t)
    return {"map_title": title, "pattern": "Guided Pathways for Success (GPS) suggested sequence",
            "terms": terms, "notes": notes}


# ── the record ───────────────────────────────────────────────────────────────
def subjects(closed_list: list[dict]) -> set:
    return {c["code"].split()[0] for c in closed_list if c.get("code")}


def coverage(parsed: dict, closed_list: list[dict]) -> dict:
    closed = closed_index(closed_list)
    named, off = [], []
    subj = subjects(closed_list)
    for term in parsed["terms"]:
        for it in term["items"]:
            for c in it.get("codes") or []:
                if norm(c) in closed:
                    named.append(closed[norm(c) + "#code"])
                elif c.split()[0] in subj:
                    off.append(c)
    named = sorted(set(named), key=named.index)
    listed = [c["code"] for c in closed_list]
    return {"closed_list": len(listed), "named": named, "share": round(len(named) / len(listed), 3) if listed else 0.0,
            "not_on_map": [c for c in listed if c not in named], "off_list": sorted(set(off)),
            "list_slots": sum(1 for t in parsed["terms"] for i in t["items"] if i["kind"] == "list")}


def accepts(parsed: dict, cov: dict) -> bool:
    """Two terms or more, and more listed courses named than off-list ones."""
    return len(parsed["terms"]) >= 2 and len(cov["named"]) > len(cov["off_list"])


def marked(parsed: dict, closed_list: list[dict]) -> list[dict]:
    """The terms, each item naming an off-list course carrying those codes in
    "off_list". An item with none carries no key, so a map with nothing off the
    list reads exactly as before the mark existed."""
    closed, subj = closed_index(closed_list), subjects(closed_list)
    out = []
    for term in parsed["terms"]:
        items = []
        for it in term["items"]:
            off = [c for c in it.get("codes") or [] if norm(c) not in closed and c.split()[0] in subj]
            items.append(dict(it, off_list=off) if off else it)
        out.append(dict(term, items=items))
    return out


def record(college: str, cn: str, program: dict, parsed: dict, closed_list: list[dict], source: dict) -> dict:
    cov = coverage(parsed, closed_list)
    return {
        "_what": "A program's term-by-term map as the college publishes it, read by kb/_program_map_parse.py "
                 "from the text a college page read printed. The catalog keeps the rule; the map names the pick.",
        "record_shape": "sequence 1",
        "college": college, "control_number": cn,
        "title": program.get("title"), "award": program.get("award"),
        "source": source,
        "map_title": parsed["map_title"], "pattern": parsed["pattern"],
        "terms": marked(parsed, closed_list), "notes": parsed["notes"],
        "coverage": cov, "accepted": accepts(parsed, cov),
    }


# The programs read so far, each with the source its text came from. A source
# file holds the page text exactly as its run printed it.
PROGRAMS = [
    {"college": "Santa Monica College", "control_number": "43767", "slug": "smc_43767",
     "source": "smc_program_219.json", "map": None},
    {"college": "Irvine Valley College", "control_number": "10265", "slug": "ivc_10265",
     "source": "ivc_all_program_maps_p1.json", "map": "Art, AA"},
    # Run 37810862182 (S345): Mt. San Antonio's Guided Pathways page for the local
    # code the catalog prints in the program's title (Certificate N0486).
    {"college": "Mt. San Antonio College", "control_number": "03086", "slug": "mtsac_03086",
     "source": "mtsac_gps_n0486.json", "map": None, "shape": "mtsac"},
    # Run 37812133411 (S345, filed S346): the Early Childhood Education AS-T, local
    # code S0401. Seven terms place all 12 listed CHLD courses, nothing off the list.
    {"college": "Mt. San Antonio College", "control_number": "33876", "slug": "mtsac_33876",
     "source": "mtsac_gps_s0401.json", "map": None, "shape": "mtsac"},
]


def build(write: bool = True) -> list[dict]:
    out = []
    for p in PROGRAMS:
        src = json.load(open(os.path.join(SEQ_DIR, "sources", p["source"]), encoding="utf-8"))
        closed_list = src["closed_lists"][p["control_number"]]
        program = src["programs"][p["control_number"]]
        if p["map"]:
            maps = ivc_maps(src["text"])
            parsed = parse_ivc(p["map"], maps[p["map"]], closed_list)
        elif p.get("shape") == "mtsac":
            parsed = parse_mtsac(src["text"], closed_list)
        else:
            parsed = parse_smc(src["text"], closed_list)
        source = {k: src[k] for k in ("url", "final_url", "run", "read_on", "sha256", "reader") if k in src}
        rec = record(p["college"], p["control_number"], program, parsed, closed_list, source)
        out.append(rec)
        if write:
            with open(os.path.join(SEQ_DIR, p["slug"] + ".json"), "w", encoding="utf-8") as f:
                json.dump(rec, f, indent=1, ensure_ascii=False)
                f.write("\n")
    return out


if __name__ == "__main__":
    for r in build():
        c = r["coverage"]
        print("%-22s %-6s accepted %-5s terms %d  named %d of %d (%.2f)  list slots %d  off list %s" % (
            r["college"][:22], r["control_number"], r["accepted"], len(r["terms"]), len(c["named"]),
            c["closed_list"], c["share"], c["list_slots"], c["off_list"] or "none"))
