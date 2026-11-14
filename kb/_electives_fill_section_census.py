#!/usr/bin/env python3
"""How many passing program records rest on the electives fill's word guard with no electives word in their own
program's section (S652; COBIx on #3111, before draft #3293 changes the rule).

WHY. Session 651 found Lassen College 32083 (Psychology AA-T) passing because the word guard, electives_named in
kb/_program_requirements_score.py, found "elective" on PDF p.93, the next program's page, inside the reader's
range p.92-94 (cpl_memory p-word-guard-neighbor-page-pass-s651). COBIx kept the row and asked for the statewide
count of rows that pass the electives fill only on a match outside their own program's section. This measures
it. It writes no table and changes no rule.

WHAT IT READS. Committed files only, at the commit it runs on: the filed records
(kb/program_requirements_college/<slug>/records/*.json) and each college's capture sources
(kb/program_requirements_college/<slug>/sources.json: each program's reader route, URL, pages and heading). The
captured catalog text is not committed (it lives in the run artifacts, d-rescore-text-checked-from-artifacts-s647),
so where the guard's word sits in the text cannot be read here; the census classifies each row on what the files
do hold, and names the class that needs the artifacts.

DEFINITIONS.
  A guard-decided fill pass: a record the tab counts as passing (counts_passing_on_tab on the filed checks) whose
      record says electives fill its total (electives_fill_degree) and whose filed arithmetic shows a fill of more
      than zero units behind the guard: the program-total fill (against "program", "fill"), the degree check
      (against "degree", "fill"), or a major total met exactly with the degree check beside it passing on a fill
      (record shape 6, 32083's case). With the guard false, each of these fails. Records the guard gates with no
      shortfall to fill (an exact, overlapping or "meets" degree sum) are counted apart as gated_no_shortfall.
  Its own section: the captured text from the record's own heading (section_heading, where _heading_end finds it,
      as the guard's filed-sentence route already reads it) to the next program's heading in the same capture.
      From committed files this is page-grained on the PDF route (the record's pages up to the page where the
      next program at the college starts, which both share) and page-grained on the HTML route (the program's
      own page, when no other program's record was read from the same URL).
  Classes, each row in exactly one:
      inside_evidenced     the record's own reading quotes an electives word from its section: a block name, the
                           filed electives_fill_words sentence, or words quoted in its notes. The guard's word is
                           in the own section (a block heading only is listed apart: #3293 discounts those).
      own_window           no quoted word, and the reader's window holds no other program's section: a PDF range
                           no other program starts in, or an HTML page no other program was read from. Any match
                           is inside the record's own window (page furniture before the heading aside).
      outside_candidate    no quoted word, and the window runs into another program's section: a PDF range in
                           which another program starts after the record's first page (32083's case), or an HTML
                           URL another program was read from. The match may sit only outside; the captured text
                           decides each one. This is the upper bound of COBIx's count on this route.
      span_unknown         the files cannot place the window: another program starts on the record's own first
                           page (the order on the page is not filed), or the record has no capture source, or its
                           source URL differs from the capture's (a reread from another window).

    python3 kb/_electives_fill_section_census.py            # print the summary, write the JSON
    python3 kb/_electives_fill_section_census.py --check    # fail when the committed JSON is stale

Guard: tests/electives_fill_section_census_test.py (a fixture: one row matching inside, one only outside).
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_score as S  # noqa: E402

COLLEGES = os.path.join(HERE, "program_requirements_college")
OUT = os.path.join(HERE, "status", "electives_fill_section_census_2026-11-14.json")
# Quoted catalog words in a note: straight or curly quotes, single or double.
# A single quote opens or closes only beside a non-letter, so an apostrophe ("the section's description ('The
# remainder ... electives')", Mendocino 31957) neither opens nor closes a quotation.
QUOTED = re.compile(r"\"([^\"]{3,})\"|“([^”]{3,})”|(?<![A-Za-z])'(.{3,}?)'(?![A-Za-z])|‘([^’]{3,})’")
# Field names the reader writes into its notes ("so electives_fill_degree is true") are not catalog words.
FIELD_NAMES = re.compile(r"\b(?:electives_fill_degree|electives_fill_words|open_elective_units|degree_elective_units)\b")
SAMPLE = 10


def flat_checks(filed: dict) -> dict:
    sc = filed.get("score") or {}
    return {"coverage": (sc.get("coverage") or {}).get("pass"),
            "invented": (sc.get("invented") or {}).get("pass"),
            "arithmetic": (sc.get("arithmetic") or {}).get("status")}


def _shortfall(fill) -> bool:
    return isinstance(fill, list) and len(fill) == 2 and max(float(fill[0] or 0), float(fill[1] or 0)) > S.TOL


def guard_decided(filed: dict) -> dict | None:
    """How a passing record rests on the electives fill's word guard, or None. path is program_fill, degree or
    major_plus_degree; shortfall says whether the fill makes up units the record falls short of."""
    if not S.counts_passing_on_tab(flat_checks(filed)):
        return None
    prog = (filed.get("record") or {}).get("program") or {}
    if not prog.get("electives_fill_degree"):
        return None
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if not a.get("pass"):
        return None
    if a.get("against") == "program" and a.get("fill") is not None:
        return {"path": "program_fill", "fill": a["fill"], "shortfall": _shortfall(a["fill"])}
    if a.get("against") == "degree":
        return {"path": "degree", "fill": a.get("fill"), "shortfall": _shortfall(a.get("fill"))}
    deg = a.get("degree")
    if a.get("against") == "program" and isinstance(deg, dict) and deg.get("pass"):
        return {"path": "major_plus_degree", "fill": deg.get("fill"), "shortfall": _shortfall(deg.get("fill"))}
    return None


def own_words(record: dict) -> list[str]:
    """Where the record's own reading quotes an electives word from its section: 'block' (a block name),
    'sentence' (the filed electives_fill_words) or 'note' (words quoted in a note)."""
    out = []
    prog = record.get("program") or {}
    if any(S.ELECTIVE.search(b.get("name") or "") for b in record.get("blocks") or []):
        out.append("block")
    if isinstance(prog.get("electives_fill_words"), str) and prog["electives_fill_words"].strip():
        out.append("sentence")
    for n in record.get("notes") or []:
        if not isinstance(n, str):
            continue
        quotes = [next(g for g in m.groups() if g) for m in QUOTED.finditer(n)]
        if any(S.ELECTIVE.search(FIELD_NAMES.sub(" ", q)) for q in quotes):
            out.append("note")
            break
    return out


def paraphrased(record: dict) -> bool:
    """Whether a note names electives in the reader's own words, outside any quotation ("remaining units to 60
    from electives numbered 1-49", Lassen 30947, where 32083's note on the same catalog quotes "courses numbered
    1-49"). Never evidence of the catalog's words; listed beside each outside candidate for the artifact read."""
    for n in record.get("notes") or []:
        if isinstance(n, str) and S.ELECTIVE.search(QUOTED.sub(" ", FIELD_NAMES.sub(" ", n))):
            return True
    return False


def _bare(url: str | None) -> str:
    return (url or "").split("#", 1)[0].rstrip("/")


def _key(s: str | None) -> str:
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def same_section(a: dict, b: dict) -> bool:
    """Whether two capture entries read one printed section: the same heading found, or, where neither found one,
    the same state-file title (less a "2.0") and award. A program's legacy and 2.0 control numbers read one page
    (Golden West 30582 and 44209, Communication Studies AA-T), which is no neighbor."""
    ha, hb = _key((a.get("source") or {}).get("title")), _key((b.get("source") or {}).get("title"))
    if ha or hb:
        return ha == hb
    t = lambda e: _key(re.sub(r"\b2\.0\b", "", e.get("title") or "")) + "|" + _key(e.get("award"))  # noqa: E731
    return t(a) == t(b)


def window(filed: dict, entry: dict | None, college_entries: list) -> dict:
    """The record's reader window against the other programs' captures at its college."""
    cn = str(filed.get("control_number"))
    src = (entry or {}).get("source") or {}
    if not src:
        return {"kind": "span_unknown", "why": "no capture source"}
    if (filed.get("source_url") or "") != (src.get("url") or ""):
        return {"kind": "span_unknown", "why": "record read from another window than the capture's"}
    pages = [int(p) for p in src.get("pages") or []]
    others = [(e, (e.get("source") or {})) for e in college_entries
              if str(e.get("control_number")) != cn and (e.get("source") or {}).get("url")
              and not same_section(entry, e)]
    if pages:
        first, last = min(pages), max(pages)
        starts = []
        for e, s in others:
            op = [int(p) for p in s.get("pages") or []]
            if op and _bare(s.get("url")) == _bare(src.get("url")):
                starts.append((min(op), str(e.get("control_number")), s.get("title") or e.get("title")))
        after = sorted(x for x in starts if first < x[0] <= last)
        if after:
            return {"kind": "neighbor", "route": "pdf", "pages": [first, last], "section_ends": after[0][0],
                    "neighbor": after[0][1], "neighbor_title": after[0][2]}
        if any(x[0] == first for x in starts):
            return {"kind": "span_unknown", "why": "another program starts on the record's first page"}
        return {"kind": "own", "route": "pdf", "pages": [first, last]}
    shared = sorted(str(e.get("control_number")) for e, s in others if _bare(s.get("url")) == _bare(src.get("url")))
    if shared:
        return {"kind": "neighbor", "route": "html", "url": _bare(src.get("url")), "neighbor": shared[0],
                "shared_with": len(shared)}
    return {"kind": "own", "route": "html"}


def classify(filed: dict, entry: dict | None, college_entries: list) -> dict:
    words = own_words(filed.get("record") or {})
    w = window(filed, entry, college_entries)
    if words:
        cls = "inside_evidenced"
    elif w["kind"] == "own":
        cls = "own_window"
    elif w["kind"] == "neighbor":
        cls = "outside_candidate"
    else:
        cls = "span_unknown"
    return {"class": cls, "own_words": words, "window": w}


def load(root: str = COLLEGES) -> list[tuple[str, dict, dict | None, list]]:
    out = []
    for cdir in sorted(glob.glob(os.path.join(root, "*"))):
        sp = os.path.join(cdir, "sources.json")
        entries = []
        if os.path.exists(sp):
            with open(sp, encoding="utf-8") as fh:
                entries = json.load(fh) or []
        by_cn = {}
        for e in entries:
            by_cn.setdefault(str(e.get("control_number")), e)
        for f in sorted(glob.glob(os.path.join(cdir, "records", "*.json"))):
            with open(f, encoding="utf-8") as fh:
                d = json.load(fh)
            out.append((os.path.basename(cdir), d, by_cn.get(str(d.get("control_number"))), entries))
    return out


def census(rows: list) -> dict:
    classes = collections.Counter()
    no_shortfall = collections.Counter()
    by_path = collections.Counter()
    inside_block_only = 0
    by_college = collections.defaultdict(collections.Counter)
    candidates = []
    unknown_why = collections.Counter()
    total = passing = 0
    for slug, d, entry, entries in rows:
        total += 1
        passing += S.counts_passing_on_tab(flat_checks(d))
        g = guard_decided(d)
        if g is None:
            continue
        c = classify(d, entry, entries)
        if not g["shortfall"]:
            no_shortfall[c["class"]] += 1
            continue
        classes[c["class"]] += 1
        by_path[g["path"]] += 1
        if c["own_words"] == ["block"]:
            inside_block_only += 1
        by_college[d.get("college")][c["class"]] += 1
        if c["class"] == "span_unknown":
            unknown_why[c["window"]["why"]] += 1
        if c["class"] == "outside_candidate":
            w = c["window"]
            candidates.append({"college": d.get("college"), "control_number": str(d.get("control_number")),
                               "award": d.get("award"), "path": g["path"], "fill": g["fill"], "route": w["route"],
                               "pages": w.get("pages"), "section_ends_page": w.get("section_ends"),
                               "neighbor": w["neighbor"],
                               "reader_paraphrase": paraphrased(d.get("record") or {})})
    table = [{"college": col, "outside_candidate": n["outside_candidate"], "span_unknown": n["span_unknown"],
              "own_window": n["own_window"], "inside_evidenced": n["inside_evidenced"]}
             for col, n in by_college.items() if n["outside_candidate"]]
    table.sort(key=lambda r: (-r["outside_candidate"], r["college"]))
    candidates.sort(key=lambda r: (r["route"] != "pdf", r["college"], r["control_number"]))
    return {
        "census": "electives fill passes by where the guard's word can sit (S652, for COBIx on #3111)",
        "source": "committed files only: filed records and capture sources; no catalog text",
        "records": total,
        "passing_on_tab": passing,
        "fill_passes": sum(classes.values()),
        "fill_passes_by_path": dict(sorted(by_path.items())),
        "inside_evidenced": classes["inside_evidenced"],
        "inside_evidenced_block_heading_only": inside_block_only,
        "own_window": classes["own_window"],
        "outside_candidate": classes["outside_candidate"],
        "outside_candidate_pdf": sum(1 for r in candidates if r["route"] == "pdf"),
        "outside_candidate_html": sum(1 for r in candidates if r["route"] == "html"),
        "outside_candidate_reader_paraphrase": sum(1 for r in candidates if r["reader_paraphrase"]),
        "span_unknown": classes["span_unknown"],
        "span_unknown_why": dict(sorted(unknown_why.items())),
        "gated_no_shortfall": dict(sorted(no_shortfall.items())),
        "by_college": table,
        "outside_candidates": candidates,
    }


def summary(r: dict) -> str:
    lines = ["Electives-fill section census (committed files; no catalog text)",
             "  records %d, passing on the tab %d" % (r["records"], r["passing_on_tab"]),
             "  fill passes behind the word guard: %d %s" % (r["fill_passes"], r["fill_passes_by_path"]),
             "    inside, evidenced by the record's own words: %d (block heading only: %d)"
             % (r["inside_evidenced"], r["inside_evidenced_block_heading_only"]),
             "    own window, no other program in it: %d" % r["own_window"],
             "    outside candidates (window runs into another program): %d (pdf %d, html %d)"
             % (r["outside_candidate"], r["outside_candidate_pdf"], r["outside_candidate_html"]),
             "      of which a note names electives in the reader's own words: %d" % r["outside_candidate_reader_paraphrase"],
             "    span unknown: %d %s" % (r["span_unknown"], r["span_unknown_why"]),
             "  guard-gated passes with no shortfall: %s" % r["gated_no_shortfall"],
             "  colleges with an outside candidate: %d" % len(r["by_college"])]
    for row in r["by_college"][:12]:
        lines.append("    %-40s %d" % (row["college"], row["outside_candidate"]))
    return "\n".join(lines)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    r = census(load())
    text = json.dumps(r, indent=1, sort_keys=False) + "\n"
    if args.check:
        with open(OUT, encoding="utf-8") as fh:
            if fh.read() != text:
                print("stale: %s" % os.path.relpath(OUT, os.path.dirname(HERE)))
                return 1
        return 0
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(summary(r))
    return 0


if __name__ == "__main__":
    sys.exit(main())
