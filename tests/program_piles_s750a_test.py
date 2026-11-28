#!/usr/bin/env python3
"""S750, the cheap piles, batch s750a: S748's reading state_course_not_on_page, assigned to eight records at six
colleges (kb/_program_piles_s750a.py; the reading and its statewide self-recall: tests/program_piles_s748c_test.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record is collected, never held for a reread
that brings nothing. Handoff 749 left eleven records whose capture finds a state-listed course on no line of the
program's own page; the S750 conductor gave this lane nine. The reading's fires are wrong about 4 times in 100, so a
row is planned only where a free read of its own page agrees with the capture. Pinned here:

  * the page reads (runs 46149637666 and 46150287204): each row's plan file names the record's own address, and the
    rows the read printed for the missing course's subject are committed beside the session's finding. Those rows
    are an answer the capture's finder did not make (the page's printed text, read from the run's log), and they are
    read here against it: they hold every course of that subject the capture found, and not the missing one;
  * the evidence's edges, 13 readings a row and 15 on a page another record was read from: s748c's nine; the row off
    its live run; the record as another college's; the record's own reader explaining the course; the units
    unstated; the own-section words changed, and taken away. And the evidence asked directly with one of its 16
    conditions moved at a time, since the rescore's own tests stand behind several of them;
  * the plan: eight rows at six colleges under one batch; each row's before-image fails coverage alone and its
    after-image is the load's image of the committed record: coverage true and nothing else moved, no gap, the
    record unchanged, the row passing as the live table counts it; the four SQL files are the receipts' own;
  * the UPDATE and its rollback, each rebuilt from the receipts' images to the byte with every guard clause once.
    29 changes to the two files (a guard dropped, expect moved, the count test dropped, the confirm guard dropped
    or loosened, an image moved, a row dropped or swapped) each fail here, so a row a person checked is skipped and
    a row that changed since the plan read it aborts the apply;
  * the hold: Madera 39810, whose page disagrees with itself (a 41-47 unit heading over 39.5 units of courses).

A mutation of the plan's code turns this test red too; the run that proved it is in the plan's commit message.

Run from repo root: python3 tests/program_piles_s750a_test.py
"""
import copy
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s750a as M  # noqa: E402
import _program_requirements_college as PRC  # noqa: E402

B, NG, S, C = M.B, M.NG, M.S, M.C
DAY = "2026-11-28"
READING = "state_course_not_on_page"
OWN = "its page is its own"
# (college, control number, the course, how the row is shown its own, the page read's run, its question)
ROWS = [("Cerritos College", "02235", "PHOT 242", OWN, "46149637666", "phot_242"),
        ("Citrus College", "02333", "ART 149", OWN, "46149637666", "art_149"),
        ("College of Marin", "46242", "ART 135", OWN, "46150287204", "art_135"),
        ("Foothill College", "11827", "APPT 190", "own_section", "46149637666", "appt_190"),
        ("Foothill College", "43194", "PHIL 7", OWN, "46149637666", "phil_7"),
        ("Irvine Valley College", "44922", "DMA 75", OWN, "46149637666", "dma_75"),
        ("Palomar College", "08929", "AP C 730", "own_section", "46149637666", "apc_730"),
        ("Palomar College", "22528", "AP C 730", "own_section", "46149637666", "apc_730")]
N = len(ROWS)
PILES = {w.college: w for w in M.PILES}
SHARED = {"11827": ["41696"], "08929": ["22528"], "22528": ["08929"]}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def subject(code: str) -> str:
    return re.match(r"[A-Z]+", S.norm_code(code)).group(0)


# ── the reading is S748's, unchanged ──
check(M.READING == NG.STATE_COURSE == READING and READING not in NG.GAPS
      and READING not in [n for n, _ in NG.RECORD_RULES],
      "the reading is S748's: no gap kind and no record rule, filed from a reviewed list alone")
check([w.college for w in M.PILES] == list(dict.fromkeys(r[0] for r in ROWS))
      and {cn for w in M.PILES for cn in w.keys} == {r[1] for r in ROWS}
      and all(w.passed[cn] == dict({"reading": READING, "not_on_page": [code]},
                                   **({"own_section": w.passed[cn].get("own_section")} if own != OWN else {}))
              for college, cn, code, own, _, _ in ROWS for w in [PILES[college]])
      and all(bool(PILES[c].passed[cn].get("own_section")) == (own != OWN) for c, cn, _, own, _, _ in ROWS),
      "the reviewed list is the eight rows, each naming its one course, and own-section words on a shared page only")

# ── the page reads ──
for college, cn, code, own, run, q in ROWS:
    w = PILES[college]
    with open(os.path.join(ROOT, "kb", "college_reads", "s750_piles_%s_coverage.json" % w.slug), encoding="utf-8") as fh:
        read = json.load(fh)
    f = w.load(cn)
    quoted = (read.get("_quoted") or {}).get(run) or {}
    printed = [S.norm_code(c) for c in (quoted.get("_rows") or {}).get(q) or []]
    check(run in M.PAGE_READS and read.get("college") == college and f["source_url"] in {p["url"] for p in read["pages"]}
          and any(q in (p.get("answers") or []) for p in read["pages"]) and q in read["questions"],
          "%s: the page read's plan is the college's, reads the record's own address and asks about the course" % cn)
    check(isinstance(quoted.get(q), str) and quoted[q].startswith("no line of ") and bool(printed),
          "%s: run %s's finding is committed with the rows the page printed" % (cn, run))
    found = {S.norm_code(c) for c in w.sources()[cn].get("codes_found") or []}
    mine = sorted(c for c in found if subject(c) == subject(code))
    check(S.norm_code(code) not in printed and S.norm_code(code) not in found,
          "%s: neither the page read's rows nor the capture's finder holds %s" % (cn, code))
    check(bool(mine) and all(c in printed for c in mine),
          "%s: the page read printed every %s course the capture found (%d): the two answers agree on what the page "
          "prints: %s" % (cn, subject(code), len(mine), [c for c in mine if c not in printed]))
with open(os.path.join(ROOT, "kb", "college_reads", "s750_piles_foothill_coverage.json"), encoding="utf-8") as fh:
    foothill_read = json.load(fh)
with open(os.path.join(ROOT, "kb", "college_reads", "s750_piles_palomar_coverage.json"), encoding="utf-8") as fh:
    palomar_read = json.load(fh)
check("Certificate of Achievement in Plumbing and Pipefitting Apprenticeship" in foothill_read["_quoted"]["46149637666"]["appt_190"]
      and "A.S. Degree Major/Cert. Achievement" in palomar_read["_quoted"]["46149637666"]["apc_730"],
      "the page reads print the heading that names both awards over each shared section")
mate = PILES["Foothill College"].load("41696")
check(S.passes_live(mate["score"]) and any(S.norm_code(m.get("code")) == "APPT190" and NG.NOT_IN_TEXT.search(str(m.get("why")))
                                           for m in mate["record"].get("missing_explained") or []),
      "Foothill 41696, the A.S. read from 11827's page, passes with its reader's own 'not in the text' for APPT 190")

# ── the evidence's edges ──
for w in M.PILES:
    bd = w.boundaries()
    rows = [r for r in ROWS if r[0] == w.college]
    shared = [r for r in rows if r[3] != OWN]
    check(not bd["wrong"] and sum(bd["counts"].values()) == 13 * len(rows) + 2 * len(shared)
          and len(bd["counts"]) == (15 if shared else 13) and all(k.endswith(" right") for k in bd["counts"]),
          "%s: every boundary reading passes nothing, 13 a row and 15 on a shared page: %s" % (w.name, bd))
    pr = w.precision()
    check(pr["right"] == pr["read"] == len(rows) and not pr["wrong"] and pr["by_answer"] == {B.PASSES: len(rows)},
          "%s: the self-recall reads each row right, before and after the plan writes: %s" % (w.name, pr))

# Two tests that stand one behind another, each asked with the other held still (a mutation run showed the test
# stayed green with either one gone).
# The rescore's college test: another college's record is refused before the scorer reads it. With the scorer's
# reading held at 'still unexplained', the college test alone must refuse it.
real_fresh = C.fresh_score
C.fresh_score = lambda filed: {"coverage": {"pass": False}}
try:
    for college, cn, code, own, run, q in ROWS:
        w = PILES[college]
        g = M.as_scored(w.load(cn))
        check(w.passing_score(g) is not None and w.passing_score(dict(g, college="Another College")) is None,
              "%s: the record as another college's is refused by the college test alone" % cn)
finally:
    C.fresh_score = real_fresh
# The plan's two tests on a row already written: the committed record passes, so the plan leaves it alone and holds
# nothing; and with the record read as the scorer scored it (as a load that had not yet been filed would leave it),
# the load's image, which passes, holds the row.
for w in M.PILES:
    done = w.plan(write=False)
    check(done == {"rows": [], "held": []}, "%s: a second run plans none and holds none: %s" % (w.name, done))
    real_load = w.load
    w.load = lambda cn, _real=real_load: M.as_scored(_real(cn))
    try:
        res = w.plan(write=False)
    finally:
        del w.load
    check(res["rows"] == [] and [h["control_number"] for h in res["held"]] == list(w.keys)
          and all("its image passes" in h["why"] for h in res["held"]),
          "%s: with the record read as scored, the load's passing image alone holds each row: %s" % (w.name, res))

# The evidence asked directly (NG.state_course_evidence), one condition moved at a time. The rescore's own tests
# stand behind several of these (a row must also pass as the live table counts it), so a boundary reading alone
# would stay right with one of the pair gone: each condition is pinned here on its own.
CUT_OFF = "The requirements table is cut off at the end of the provided text."
for college, cn, code, own, run, q in ROWS:
    w = PILES[college]
    G = M.as_scored(w.load(cn))
    SRC = w.sources()[cn]
    CLOSED = C.closed_list(college, cn)
    key = S.norm_code(code)

    def moved(path: tuple, value) -> dict:
        g = copy.deepcopy(G)
        at = g
        for k in path[:-1]:
            at = at[k]
        at[path[-1]] = value
        return g

    def stands(g=None, src=..., closed=None) -> bool:
        return NG.state_course_evidence(G if g is None else g, SRC if src is ... else src,
                                        CLOSED if closed is None else closed) is not None

    missing = {S.norm_code(c) for c in G["score"]["coverage"].get("missing") or []}
    placed = [c for c in CLOSED if S.norm_code(c["code"]) not in missing and NG._spaced(c["code"])]
    fakes = [{"code": "ZZZ %d" % n} for n in range(1, len(CLOSED) + 2)]
    grown = moved(("score", "coverage", "missing"), list(G["score"]["coverage"].get("missing") or [])
                  + [S.norm_code(c["code"]) for c in fakes])
    edges = {
        "coverage already passing": stands(moved(("score", "coverage", "pass"), True)),
        "no unexplained course": stands(moved(("score", "coverage", "unexplained"), [])),
        "none of the list placed": stands(moved(("score", "coverage", "none_placed"), True)),
        "a gap already filed": stands(moved(("score", "gaps"), [{"gap": "total_differs"}])),
        "invented failing": stands(moved(("score", "invented", "pass"), False)),
        "the units check failing": stands(moved(("score", "arithmetic", "pass"), False)),
        "the capture read another address": stands(src=dict(SRC, source=dict(SRC["source"], url=SRC["source"]["url"] + "x"))),
        "no capture of the program": stands(src=None),
        "the capture's text at its cap": stands(src=dict(SRC, text_chars=NG.STATE_COURSE_TEXT_CAP)),
        "the capture's text of no known length": stands(src=dict(SRC, text_chars=None)),
        "a note that the list is cut off": stands(moved(("record", "notes"), list(G["record"].get("notes") or []) + [CUT_OFF])),
        "the course off the state's list": stands(closed=[c for c in CLOSED if S.norm_code(c["code"]) != key]),
        "under half the state's list placed": stands(grown, closed=list(CLOSED) + fakes),
        "a placed course the capture does not find": stands(src=dict(SRC, codes_found=[
            c for c in SRC.get("codes_found") or [] if S.norm_code(c) != S.norm_code(placed[0]["code"])])),
        "the capture finds the course": stands(src=dict(SRC, codes_found=list(SRC.get("codes_found") or []) + [code])),
        "the course written with no space": stands(closed=[dict(c, code=key) if S.norm_code(c["code"]) == key else c
                                                             for c in CLOSED]),
    }
    check(stands() and len(edges) == 16 and not any(edges.values()),
          "%s: the evidence stands as filed, and with any one of 16 conditions moved it does not: %s"
          % (cn, sorted(k for k, v in edges.items() if v)))

# ── the plan ──
check(M.BATCH.tag == "s750a" and M.BATCH.piles == M.PILES and M.BATCH.session == "S750"
      and "S750" in M.BATCH.ruling and M.MADERA not in M.BATCH.piles,
      "one batch of six piles under one tag, named S750's; Madera is no pile of it")
receipts = {}
for w in M.PILES:
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts[w.college] = json.load(fh)
    check(os.path.basename(w.receipt_path(DAY)) == "program_requirement_records_piles_s750_%s_%s_s750a.json" % (w.slug, DAY),
          "%s: the receipt carries S750's name" % w.name)
members = [[c, cn, i] for i, (c, cn, _, _, _, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["members"] == members and r["batch"]["rows"] == N and r["representation"] == M.REPRESENTATION
          and "checks.coverage to true" in r["representation"] and r["by"] == {B.PASSES: r["moved"]}
          and r["gaps"] == {} and not r["held"] and "S750" in r["rule"] for r in receipts.values()),
      "every receipt names the batch's eight members, files no gap, and says what the plan writes to checks.coverage")
images = NG._load_images(set(PILES))
for i, (college, cn, code, own, run, q) in enumerate(ROWS, 1):
    w = PILES[college]
    r = next(x for x in receipts[college]["records"] if x["control_number"] == cn)
    bc, ac = r["before_image"]["checks"], r["after_image"]["checks"]
    check(r["i"] == i and r["moves_to"] == B.PASSES and r["reading"] == READING and r["own"] == own
          and w.shared_with(cn) == SHARED.get(cn, []) and receipts[college]["shared_pages"].get(cn, []) == SHARED.get(cn, []),
          "%s: the row is the batch's number %d, under the reading's name, shown its own as %s" % (cn, i, own))
    check(bc.get("coverage") is False and bc.get("invented") is True and bc.get("arithmetic") == "equal"
          and not bc.get("gaps"), "%s: before, the row fails on coverage alone and carries no gap" % cn)
    check(ac == dict(bc, coverage=True) and not ac.get("gaps"),
          "%s: after, coverage is true and nothing else in the checks moves; no gap" % cn)
    check(B.F.row_passes(ac) and S.counts_passing_on_tab(ac) and not S.counts_passing_on_tab(bc),
          "%s: the row passes as the live table counts it once applied, and did not before" % cn)
    f = w.load(cn)
    img = images[(college, cn)]
    check(img["checks"] == ac and img["record"] == r["before_image"]["record"]
          and str(img["extracted_run"]) == str(r["extracted_run"]) == str(r["before_image"]["extracted_run"]),
          "%s: the load's image of the committed record is the receipt's after-image, the record and run unchanged" % cn)
    cov = f["score"]["coverage"]
    check(cov["pass"] is True and cov["unexplained"] == [] and [S.norm_code(c) for c in cov["not_on_page"]]
          == [S.norm_code(code)] and cov["as_scored"] == {"pass": False, "unexplained": cov["not_on_page"]}
          and cov["rescored"] == M.RESCORED and "s750a" in cov["rescored"] and run in cov["rescored"]
          and not f["score"].get("gaps") and S.passes_live(f["score"]),
          "%s: the committed score passes, carries no gap, names this plan and its page read, and keeps the scorer's "
          "own coverage beside the rescored one" % cn)
    kept = PRC.keep_named_gaps(cn, f["score"], dict(f["score"]), f)
    check(kept == f["score"], "%s: the reconcile's keep_named_gaps leaves the committed score as it is" % cn)
    g = M.as_scored(f)
    fresh = C.fresh_score(g)["coverage"]
    check(g["score"]["coverage"]["pass"] is False and not S.passes_live(g["score"]) and fresh["pass"] is False
          and [S.norm_code(c) for c in fresh["unexplained"]] == [S.norm_code(code)],
          "%s: today's scorer still reads %s as the one unexplained course" % (cn, code))
    ev = w.evidence(g)
    got = w.passing_score(g)
    check(ev is not None and ev["not_on_page"] == [code] and got is not None and got[0] == f["score"]
          and got[1] == r["words"] and code in r["words"] and "on no line" in r["words"]
          and "(run %s)" % w.capture_run() in r["words"] and NG.answer(g) is None,
          "%s: the capture's evidence stands on the record as scored, the rescore is the committed score, the words "
          "name %s and the capture's run, and no record rule names a gap" % (cn, code))
    check(w.on_live_run(f) and w.on_live_run(f, skip=(M.TAG,)), "%s: the row is on its live run" % cn)
    check(w.outcome(f)[0] == B.PASSES and w.claim(g) == "stands", "%s: the entry stands and its claim stands" % cn)
for part, key in (("apply", "apply"), ("preread", "pre_read"), ("preread_md5", "pre_read_md5"), ("rollback", "rollback")):
    with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_%s.sql" % (DAY, M.TAG, part)),
              encoding="utf-8") as fh:
        sql = fh.read()
    bodies = {r[key] for r in receipts.values()}
    check(len(bodies) == 1 and sql.endswith(bodies.pop() + "\n") and "checks.coverage to true" in sql,
          "%s: one text, in the file and in every receipt, under a header that names the coverage rescore" % part)
    check(all("'%s'" % cn in sql for _, cn, _, _, _, _ in ROWS) and "'39810'" not in sql, "%s names the eight rows alone" % part)
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_apply.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    apply_sql = fh.read()
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_rollback.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    rollback_sql = fh.read()
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_preread_md5.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    md5_sql = "".join(ln for ln in fh.read().splitlines(True) if not ln.startswith("--"))
check(len(re.findall(r"^select json_build_object\(", md5_sql, re.M)) == 1 and md5_sql.strip().count(";") == 1
      and md5_sql.strip().endswith(";") and md5_sql.startswith("with v(") and "'listed'" in md5_sql
      and len(re.findall(r"^\s*\(\d+, '[^']+', '\d+', \d+, '[0-9a-f]{32}', '[0-9a-f]{32}', '[0-9a-f]{32}'\)", md5_sql, re.M)) == N
      and all(k in md5_sql for k in ("'on_run'", "'record_is_before'", "'checks_is_before'", "'already_after'",
                                     "'checked_now'", "'confirm_matches'"))
      and not re.search(r"\b(update|insert|delete)\b", md5_sql.split("with v(", 1)[1], re.I),
      "the compact pre-read is one read-only SELECT returning one JSON value with its seven counts")

# ── the UPDATE and its rollback as written ──
plan_rows = sorted((x for rc in receipts.values() for x in rc["records"]), key=lambda x: x["i"])
rebuilt_rows = [{"i": x["i"], "college": x["college"], "control_number": x["control_number"],
                 "extracted_run": images[(x["college"], x["control_number"])]["extracted_run"],
                 "before_image": {"record": x["before_image"]["record"], "checks": x["before_image"]["checks"]},
                 "after_image": {"checks": x["after_image"]["checks"]}} for x in plan_rows]
check([(x["college"], x["control_number"], x["i"]) for x in rebuilt_rows] == [(c, cn, i) for i, (c, cn, _, _, _, _) in enumerate(ROWS, 1)],
      "the receipts' rows are the batch's eight, numbered 1 to 8")
APPLY = M.B11.P.confirm_guarded_apply(rebuilt_rows, M.TAG + " piles")
ROLLBACK = NG.rollback_sql(rebuilt_rows, M.TAG + " piles rollback")
RUN, PERSON, EXPECT, COUNT = ("r.extracted_run = v.extracted_run", "r.checked is not true",
                              "e(expect) as (values (%d))" % N, "when s.n = e.expect - c.n")
CONFIRM = ("when f.n > 0", "lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(r.record)")
KEY = "r.college = v.college and r.control_number = v.control_number\n   and"
APPLY_GUARDS = (RUN, "r.checks = v.before_checks", "r.record = v.before_record", PERSON, EXPECT, COUNT,
                "set checks = v.after_checks", KEY) + CONFIRM
ROLLBACK_GUARDS = (RUN, "r.checks = v.after_checks", PERSON, EXPECT, COUNT, "set checks = v.before_checks", KEY)


def body(sql: str) -> str:
    """The SQL below the file's comment header."""
    return "".join(ln for ln in sql.splitlines(True) if not ln.startswith("--"))


def bare(sql: str) -> str:
    """The SQL below the header with each jsonb literal emptied: the statement's own words."""
    return re.sub(r"'((?:[^']|'')*)'::jsonb", "''::jsonb", body(sql))


def sql_images(sql: str) -> list:
    """Each values row's three jsonb literals as the file writes them, parsed: (before record, before checks, after
    checks)."""
    got = [json.loads(x.replace("''", "'")) for x in re.findall(r"'((?:[^']|'')*)'::jsonb", sql[sql.index("with v("):])]
    return [tuple(got[i:i + 3]) for i in range(0, len(got), 3)] if len(got) % 3 == 0 else []


def sql_keys(sql: str) -> list:
    """Each values row's number, college, control number and run, as the file writes them."""
    return [(int(i), c, cn, int(run)) for i, c, cn, run in
            re.findall(r"^\s*\((\d+), '((?:[^']|'')*)', '(\d+)', (\d+), '", sql, re.M)]


def apply_stands(sql: str) -> bool:
    """The file is the plan: the UPDATE rebuilt from the receipts' images to the byte, each guard clause in it once,
    and each row's key, run and three images the receipt's own."""
    return (body(sql) == APPLY + "\n" and all(sql.count(g) == 1 for g in APPLY_GUARDS)
            and sql_keys(sql) == [(x["i"], x["college"], x["control_number"], int(x["extracted_run"])) for x in rebuilt_rows]
            and sql_images(sql) == [(x["before_image"]["record"], x["before_image"]["checks"], x["after_image"]["checks"])
                                    for x in plan_rows])


def rollback_stands(sql: str) -> bool:
    """The rollback is the plan's: rebuilt from the same images to the byte (its own comment line on a partial
    rollback included), each of its guard clauses once, no confirm guard, and the apply's rows and images."""
    return (sql.endswith("\n" + ROLLBACK + "\n") and all(sql.count(g) == 1 for g in ROLLBACK_GUARDS)
            and "f.n" not in sql and sql_keys(sql) == sql_keys(apply_sql) and sql_images(sql) == sql_images(apply_sql))


check(apply_stands(apply_sql), "the apply file is the UPDATE rebuilt from the receipts' images, with every guard clause "
                               "once (the confirm guard among them) and each receipt's after-image inside it")
check(rollback_stands(rollback_sql),
      "the rollback file is the rollback rebuilt from the same images: checks back to the before-image only where the "
      "row still holds the after-image and no person's check, expecting the batch's eight rows")
check(all(a == dict(b, coverage=True) and a != b for _, b, a in sql_images(apply_sql)) and len(sql_images(apply_sql)) == N,
      "each after-image the UPDATE writes is its before-image with coverage true, nothing else")
check(apply_sql.count("update public.program_requirement_records") == 1 and rollback_sql.count("update public.program_requirement_records") == 1
      and not re.search(r"\b(insert|delete|drop|truncate|alter)\b", bare(apply_sql) + bare(rollback_sql), re.I),
      "each file holds one UPDATE of the one table and no other write")
CHANGED_APPLY = {
    "the run guard dropped": apply_sql.replace(RUN + " and ", ""),
    "the before-checks guard dropped": apply_sql.replace(" and r.checks = v.before_checks", ""),
    "the before-record guard dropped": apply_sql.replace(" and r.record = v.before_record", ""),
    "the person's-check guard dropped": apply_sql.replace("   and " + PERSON + "\n", ""),
    "the person's-check guard turned": apply_sql.replace(PERSON, "r.checked is true"),
    "expect moved": apply_sql.replace(EXPECT, "e(expect) as (values (%d))" % (N - 1)),
    "the count test dropped": apply_sql.replace(COUNT, "when true"),
    "the count forgets the checked rows": apply_sql.replace(COUNT, "when s.n <= e.expect"),
    "the confirm guard dropped": apply_sql.replace(CONFIRM[0], "when false"),
    "the confirm guard reads any verdict": apply_sql.replace("lv.verdict = 'confirm' and ", ""),
    "the key join loosened": apply_sql.replace(KEY, "r.college = v.college\n   and"),
    "a before-image moved": apply_sql.replace(NG._values([rebuilt_rows[0]]), NG._values(
        [dict(rebuilt_rows[0], before_image=dict(rebuilt_rows[0]["before_image"],
                                                  checks=dict(rebuilt_rows[0]["before_image"]["checks"], invented=False)))])),
    "a row dropped": apply_sql.replace(NG._values([rebuilt_rows[-1]]), NG._values([rebuilt_rows[-2]])),
    "a row's run moved": apply_sql.replace("'%s', %s, '" % (rebuilt_rows[2]["control_number"], rebuilt_rows[2]["extracted_run"]),
                                           "'%s', %s, '" % (rebuilt_rows[2]["control_number"], int(rebuilt_rows[2]["extracted_run"]) + 1)),
    "a row's key swapped for the held record's": apply_sql.replace("'Citrus College', '02333'", "'Madera College', '39810'"),
}
for x in rebuilt_rows:
    moved = copy.deepcopy(x)
    moved["after_image"]["checks"]["arithmetic"] = "unstated"
    CHANGED_APPLY["%s's after-image moved" % x["control_number"]] = apply_sql.replace(NG._values([x]), NG._values([moved]))
CHANGED_ROLLBACK = {
    "the rollback's after-checks guard dropped": rollback_sql.replace(" and r.checks = v.after_checks", ""),
    "the rollback's person's-check guard dropped": rollback_sql.replace("   and " + PERSON + "\n", ""),
    "the rollback's expect moved": rollback_sql.replace(EXPECT, "e(expect) as (values (%d))" % (N - 1)),
    "the rollback's count test dropped": rollback_sql.replace(COUNT, "when true"),
    "the rollback's run guard dropped": rollback_sql.replace(RUN + " and ", ""),
    "the rollback writes the after-image": rollback_sql.replace("set checks = v.before_checks", "set checks = v.after_checks"),
}
check(len(CHANGED_APPLY) == 15 + N and len(CHANGED_ROLLBACK) == 6,
      "15 changes to the apply, one more for each row's after-image, and six to the rollback: 29 in all")
for what, sql in CHANGED_APPLY.items():
    check(sql != apply_sql, "%s: the change lands on the apply file's text" % what)
    check(not apply_stands(sql), "%s: the test fails on it" % what)
for what, sql in CHANGED_ROLLBACK.items():
    check(sql != rollback_sql, "%s: the change lands on the rollback file's text" % what)
    check(not rollback_stands(sql), "%s: the test fails on it" % what)
check(all(w.plan(write=False)["rows"] == [] for w in M.PILES), "a second run plans none")

# ── the hold ──
W = M.MADERA
f = W.load("39810")
with open(os.path.join(ROOT, "kb", "college_reads", "s750_piles_madera_coverage.json"), encoding="utf-8") as fh:
    madera_read = json.load(fh)
finding = madera_read["_quoted"]["46149637666"]["polsc"]
core = next(b for b in f["record"]["blocks"] if b["name"] == "Required Core Courses")
units = sum(float(c["units"]) for c in core["courses"])
state = {S.norm_code(c["code"]): c for c in C.closed_list(W.college, "39810")}
check(W.evidence(M.as_scored(f)) is not None and sorted(S.norm_code(c) for c in W.evidence(M.as_scored(f))["not_on_page"])
      == ["POLSCC1000", "POLSCC1000H"] and not S.passes_live(f["score"]) and not f["score"].get("gaps"),
      "39810: the capture's evidence stands on two courses, and the record is left as the scorer scored it")
check(W.hand["39810"].startswith("held") and "41-47" in W.hand["39810"] and W.passed == {} and W.plan(write=False)["rows"] == []
      and W.precision()["wrong"] == [] and W.precision()["by_answer"] == {"none": 1},
      "39810: held by hand with its reason, no entry, no row")
check((core["stated"]["min"], core["stated"]["max"]) == (41, 47) and units == 39.5 and "(41-47 units)" in finding
      and "39.5" in finding and float(state["POLSCC1000"]["units"]) == 3.0
      and core["stated"]["min"] <= units + float(state["POLSCC1000"]["units"]) <= core["stated"]["max"] and units < core["stated"]["min"],
      "39810: the page heads its core 41-47 units over 39.5 units of courses, and the state's POLSC C1000 (3 units) "
      "brings it inside the heading's range: the reason it is held")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
