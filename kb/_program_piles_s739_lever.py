#!/usr/bin/env python3
"""S739, lane 1 (the lever): two records the lane held, collected with each gap named (plan s739l).

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores. Sam, 2026-11-25 (r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25): each gap
carries a 0-100 confidence. The harvest lane's NEXT (3) lists both keys; neither record changes, each live row's
checks take the gap (the guarded UPDATE of S721's plans).

THE TWO KEYS (REVIEWED below, each a hand reading of the record's own notes and blocks):

  Cosumnes River 33542      option_lists_read_apart (40). Spanish A.A.-T.: the page prints 'OPTION I - Non-Native
                            Spanish Speaker' (16 units) and 'OPTION II - Native Spanish Speaker Units: 16', and Option
                            II takes two lists, SPAN 413 and 415 (8) and a minimum of 8 units from a list. The record
                            keeps the three blocks in one option group, each its own alternative, so its sum reads
                            11-19 against the printed 19. Read as two options (Option II its two lists together) the
                            record adds to 19 at both ends. S720's reconcile passed it on an electives fill of the
                            major, which no line of the page prints, so it was held on main's filing.
  East Los Angeles 33013    noted_figures_differ (40). Anthropology A.A.-T.: the page prints the core as 'ANTHRO 101
                            OR ANTHRO 101 AND ANTHRO 111' with a core subtotal of 9-10, and 'TOTAL UNITS FOR MAJOR:
                            22-24'. The record adds with the core at 9-10 (21-24) and states 22-24; with the lab
                            (ANTHRO 111) counted, the core at 10, it adds to 22-24 at both ends. The two printed
                            figures disagree by the lab's one unit, and no page read has settled whether the program
                            requires the lab. Held for a person by S714, S720 (s720e) and S727 (s727f), whose reason
                            was that the 9-10 read as one pool still gives 21-24; this reading is the lab's path alone.

EACH ENTRY'S OWN CHECK (kind_closes): the record re-added with the one reading its note names, by today's scorer with
no state list and no page text (so no electives fill), must give the printed major total at both ends:
  options   every block of the option group opens with 'OPTION <roman numeral>'; the blocks are named as the
            scorer's option parts ('Option k: <name>'), and nothing else changes.
  path      the option group's named shorter path is left out, so the longer path alone stands.
Read wrongly, neither closes: Option II's two lists both taken beside Option I (every block required) adds to 35
against 19, and the core without the lab adds to 21-23 against 22-24.

STANDING GUARDS: the filed score is collectable (coverage and invented pass) and fails; no record rule of
kb/_program_named_gaps.py names it under another kind; today's scorer does not pass it with no page text
(p-scorer-passes-guard-s720); on_live_run (the committed record's run is the run a committed receipt posted to the
live row); the own-page guard (kb/_program_pooled_s721.py own_page: a page shared_pages lists another program on is
the record's own only in its own PDF section, the heading naming its award); the claim check (every course an entry
names is among the codes today's capture found); the load posts the row and its image does not pass.

    python3 kb/_program_piles_s739_lever.py --dry-run
    python3 kb/_program_piles_s739_lever.py --tag s739l

Guard: tests/program_piles_s739_lever_test.py.
"""
from __future__ import annotations

import argparse
import collections
import contextlib
import copy
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_pooled_s721 as W  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
TAG = "s739l"
RULING = (NG.RULING + "; S739 (lane 1, the lever): Cosumnes River 33542 and East Los Angeles 33013, each held by "
          "earlier sessions, collected with the gap its own notes name (no reread, no reconcile, no record change)")
CRC, ELA = "Cosumnes River College", "East Los Angeles College"
LANE = {CRC: "cosumnes_river", ELA: "east_los_angeles"}

REVIEWED = {
    (CRC, "33542"): {
        "gap": "option_lists_read_apart", "computed": [11, 19], "stated": [19, 19],
        "words": "Option II consists of two blocks (SPAN 413 and 415 required, plus a minimum of 8 units from a list)",
        "options": "Option", "courses": ["SPAN413", "SPAN415", "SPAN401", "SPAN402", "SPAN411", "SPAN412"]},
    (ELA, "33013"): {
        "gap": "noted_figures_differ", "computed": [21, 24], "stated": [22, 24],
        "words": "The catalog's core subtotal is 9-10 units for ANTHRO 101(+111), 102 and 103 together",
        "path": {"group": "ANTHRO 101 with or without lab", "without": "Required Core Courses: ANTHRO 101",
                 "with": "Required Core Courses: ANTHRO 101 AND ANTHRO 111"},
        "courses": ["ANTHRO101", "ANTHRO111", "ANTHRO102", "ANTHRO103"]},
}
OPTION_ROMAN = re.compile(r"^\s*OPTION\s+([IVX]{1,4})\b", re.I)


@contextlib.contextmanager
def lane():
    """W's helpers (load, shared_with, posted_runs) key a college by W.LANE; these two join it for the call only."""
    saved = dict(W.LANE)
    W.LANE.update(LANE)
    try:
        yield
    finally:
        W.LANE.clear()
        W.LANE.update(saved)


def path(key: tuple) -> str:
    return os.path.join(NG.COLLEGE_DIR, LANE[key[0]], "records", key[1] + ".json")


def load(key: tuple) -> dict | None:
    if not os.path.isfile(path(key)):
        return None
    with open(path(key), encoding="utf-8") as fh:
        return json.load(fh)


def _pair(v):
    if isinstance(v, dict):
        v = [v.get("min"), v.get("max")]
    return None if v is None or v[0] is None else [float(v[0]), float(v[1] if v[1] is not None else v[0])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def major(record: dict, award) -> dict:
    """Today's arithmetic of the major, with no state list and no page text (so no electives fill): the program-level
    figures, which a degree record carries under 'major' once its degree is added."""
    a = S.score(record or {}, [], "", award).get("arithmetic") or {}
    return a.get("major") or a


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own major (p-scorer-passes-guard-s720)."""
    return major(filed.get("record") or {}, filed.get("award")).get("status") == "equal"


# ── each entry's own reading ──────────────────────────────────────────────
def option_keys(record: dict, group: str) -> dict:
    """{block index: the option's roman numeral} for the group, or {} unless every block of it opens with one, two
    or more options stand, and one of them holds two or more blocks."""
    out = {}
    for i, b in enumerate(record.get("blocks") or []):
        if b.get("option_group") != group:
            continue
        m = OPTION_ROMAN.match(str(b.get("name") or ""))
        if not m:
            return {}
        out[i] = m.group(1).upper()
    c = collections.Counter(out.values())
    return out if len(c) >= 2 and max(c.values()) >= 2 else {}


def as_option_parts(record: dict, group: str) -> dict | None:
    """The record with the group's blocks named as the scorer's option parts ('Option k: <name>'), k by numeral."""
    keys = option_keys(record, group)
    if not keys or S.option_parts(record):
        return None
    out, seen = copy.deepcopy(record), {}
    for i, k in sorted(keys.items()):
        seen.setdefault(k, str(len(seen) + 1))
        out["blocks"][i]["name"] = "Option %s: %s" % (seen[k], out["blocks"][i]["name"])
    return out


def as_both(record: dict, group: str) -> dict:
    """The wrong reading of the options: every block of the group required, no choice among them."""
    out = copy.deepcopy(record)
    for b in out.get("blocks") or []:
        if b.get("option_group") == group:
            b["option_group"] = None
    return out


def one_path(record: dict, p: dict, keep: str = "with") -> dict | None:
    """The record with one path of the two-path option group standing alone: 'with' (the longer) or 'without'."""
    blocks = record.get("blocks") or []
    names = [b.get("name") for b in blocks if b.get("option_group") == p["group"]]
    if sorted(names) != sorted([p["with"], p["without"]]):
        return None
    drop = p["without"] if keep == "with" else p["with"]
    out = copy.deepcopy(record)
    out["blocks"] = [b for b in out["blocks"] if not (b.get("option_group") == p["group"] and b.get("name") == drop)]
    return out


def reading(filed: dict, e: dict) -> dict | None:
    rec = filed.get("record") or {}
    if e.get("options"):
        return as_option_parts(rec, e["options"])
    if e.get("path"):
        return one_path(rec, e["path"])
    return None


def kind_closes(filed: dict, e: dict) -> bool:
    """With the entry's one reading, today's scorer gives the printed major total at both ends."""
    rec = reading(filed, e)
    if rec is None:
        return False
    a = major(rec, filed.get("award"))
    return a.get("status") == "equal" and _same(a.get("computed"), a.get("stated")) and _same(a.get("stated"), e["stated"])


# ── the decision ──────────────────────────────────────────────────────────
def claim(key: tuple, e: dict) -> str:
    src, _ = NG._sources(path(key))
    s = src.get(key[1])
    if not s:
        return "no capture"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    return "stands"


def gap_noted(key: tuple, filed: dict | None = None) -> tuple[str, str] | tuple[None, str]:
    """(gap, the note's words) where the reviewed entry stands on the record as filed; else (None, why)."""
    e = REVIEWED.get(key)
    f = load(key) if filed is None else filed
    if not e or f is None:
        return None, "not reviewed" if not e else "no record file"
    if f.get("college") != key[0] or str(f.get("control_number")) != key[1]:
        return None, "the file is another program's"
    sc = {k: v for k, v in (f.get("score") or {}).items() if k not in ("gaps", "confidence")}
    a = sc.get("arithmetic") or {}
    if not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None, "the filed score passes, or its coverage or invented check fails"
    words = next((n for n in _notes(f) if e["words"] in n), None)
    if not words:
        return None, "the note's words are not the record's"
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None, "the filed figures are not the entry's"
    rr = NG.answer(dict(f, score=sc))
    if rr and rr[0] != e["gap"]:
        return None, "a record rule names it %s" % rr[0]
    if scorer_passes(f):
        return None, "today's scorer passes it: a rescore's, not a gap"
    with lane():
        if not W.on_live_run(f):
            return None, "the committed record's run is not the run a committed receipt posted"
        if not W.own_page(f):
            return None, "read from a page shared_pages lists with %s, and its heading does not name its award" % (
                ", ".join(W.shared_with(*key)))
    if not kind_closes(f, e):
        return None, "the entry's reading does not give the printed total at both ends"
    c = claim(key, e)
    if c != "stands":
        return None, c
    return e["gap"], words


def boundaries() -> dict:
    """Each entry refused once its ground moves: the note's words gone, the stated total one unit off, coverage
    failing, the reading's own shape broken, the record read from a page whose heading names another award."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, key):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([key[0], key[1], name])

    for key, e in sorted(REVIEWED.items()):
        f = load(key)
        if f is None or gap_noted(key, f)[0] is None:
            continue
        g = copy.deepcopy(f)
        g["record"]["notes"] = [n.replace(e["words"], "") for n in _notes(g)]
        tally("the note's words gone", gap_noted(key, g)[0] is None, key)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
        tally("the stated total one unit off", gap_noted(key, g)[0] is None, key)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(key, g)[0] is None, key)
        g = copy.deepcopy(f)
        tp = g["record"]["program"]["total_units"]
        g["record"]["program"]["total_units"] = {"min": tp["min"] + 1, "max": tp["max"] + 1}
        tally("the reading against a total one unit off", not kind_closes(g, e), key)
        g = copy.deepcopy(f)
        if e.get("options"):
            g["record"] = as_both(g["record"], e["options"])
            tally("the options read as both", not kind_closes(g, e), key)
        else:
            g["record"] = one_path(g["record"], e["path"], keep="without")
            a = major(g["record"], g.get("award"))
            tally("the shorter path alone", a.get("status") != "equal", key)
        g = copy.deepcopy(f)
        g["record"]["program"]["section_heading"] = "Certificate of Achievement in Another Program"
        with lane():
            shared = bool(W.shared_with(*key))
        tally("a heading naming another award on a shared page", (gap_noted(key, g)[0] is None) == shared, key)
    return {"counts": dict(out), "wrong": wrong}


def recall_all() -> dict:
    """Every committed record statewide on which the options shape stands (an option group whose every block opens
    with 'OPTION <roman numeral>', one option holding two or more blocks), with what the reading does to it: the
    reader of this plan sees how wide the shape is. The plan writes only its reviewed keys."""
    fires, closes = [], []
    for _, f in W.every_record():
        rec = f.get("record") or {}
        groups = {b.get("option_group") for b in rec.get("blocks") or [] if b.get("option_group")}
        for g in sorted(groups):
            parts = as_option_parts(rec, g)
            if parts is None:
                continue
            key = "%s %s" % (f.get("college"), f.get("control_number"))
            fires.append(key)
            a = major(parts, f.get("award"))
            if not S.passes_live(f.get("score")) and a.get("status") == "equal" \
                    and _same(a.get("computed"), a.get("stated")):
                closes.append(key)
    return {"fires": len(fires), "failing_and_closed_by_the_reading": sorted(set(closes))}


def plan(write: bool) -> dict:
    rows, held, hits = [], [], []
    images = NG._load_images(set(LANE))
    for key in sorted(REVIEWED):
        f = load(key)
        if f is not None and (f.get("score") or {}).get("gaps"):
            continue    # written already by this plan
        gap, words = gap_noted(key, f)
        if gap is None:
            held.append({"college": key[0], "control_number": key[1], "why": words})
            continue
        img = images.get(key)
        if img is None or F.row_passes(img["checks"]):
            held.append({"college": key[0], "control_number": key[1],
                         "why": "the load leaves it out, or its image passes"})
            continue
        src, year = NG._sources(path(key))
        e = src.get(key[1]) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((key, f, score, gap, words, img))
    for key, f, score, gap, words, img in hits:
        row = {"college": key[0], "control_number": key[1], "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score.get("confidence"), "path": os.path.relpath(path(key), ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(path(key), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    if write and rows:
        after = NG._load_images(set(LANE))
        for r in rows:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"] or \
                    (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s %s: the record changed, or its image does not carry the gap"
                                 % (r["college"], r["control_number"]))
            if F.row_passes(img["checks"]):
                raise SystemExit("%s %s: the image passes" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    ap.add_argument("--recall", action="store_true", help="also count the options shape over every committed record")
    a = ap.parse_args(argv)
    bd = boundaries()
    print("boundaries: %s" % json.dumps(bd))
    if bd["wrong"]:
        raise SystemExit("a boundary reads wrong: no plan is written")
    rc = recall_all() if (a.recall or not a.dry_run) else None
    if rc is not None:
        print("the options shape statewide: %s" % json.dumps(rc))
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    for h in res["held"]:
        print("  held %s %s: %s" % (h["college"], h["control_number"], h["why"]))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    rpath = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s739_lever_%s_%s.json" % (day, a.tag))
    with lane():
        shared = {"%s %s" % (r["college"], r["control_number"]): W.shared_with(r["college"], r["control_number"])
                  for r in rows if W.shared_with(r["college"], r["control_number"])}
    body = {"rule": RULING, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "colleges": sorted(LANE),
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "boundaries": bd, "options_shape_statewide": rc, "held": res["held"], "records": rows,
            "shared_pages": shared,
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.coverage, invented, arithmetic and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found. The capture keeps no page text, so a note's quoted figures are the "
                                  "reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": PV.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(rpath, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(rpath, ROOT)
    hdr = ("-- %s lane 1's lever: two held records collected with named gaps (%d rows: %s). Each row's checks\n"
           "-- become the college load's image of its committed record (load_rows): checks.gaps and\n"
           "-- checks.confidence added; the record unchanged. Receipt: %s\n"
           "-- (before_image per row).\n" % (a.tag.upper(), len(rows),
                                             ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
