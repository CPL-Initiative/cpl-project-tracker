#!/usr/bin/env python3
"""A wave of the program requirements harvest: several colleges read at once, filed once.

WHY (S644). Each college was its own branch, PR and CI run, and the conductor
dispatched each step by hand, so a session finished about six colleges. The work
on the runner is cheap; the hand steps and the per-college PRs limit the harvest.
A wave reads up to eight colleges, on distinct catalog hosts, in one dispatch of
.github/workflows/program-requirements-wave.yml, and files them to ONE branch with
ONE table the conductor reads (kb/program_requirements_wave/<wave>.json and .md).

The reading itself is kb/_program_requirements_college.py, called step by step
exactly as program-requirements-college.yml calls it. This module adds four steps
around it, and holds no reading logic of its own:

  plan     validates the dispatch: at most eight colleges, none named twice, each
           a program_source_registry row (anon read), no two on one catalog host
           (the standing rule: never two reads on one host), a limit no higher than
           Sam's $40 standing go, and a wave branch named claude/harvest-wave-<wave>.
           Emits the matrix.
  price    after a college's capture: would_extract times the college's rate
           (the mean cost of its filed records that carry a real cost, never
           below 0.08, and 0.08 with fewer than 20 of them), plus 25%. Extraction
           goes ahead only when extract is "1", this is the run's first attempt,
           the capture answered at least 90% of the pages it listed, there is
           something to extract, and the price is within the limit. It files a
           provisional row first, so a job that stops still shows its price.
  verify   compares the run's records with the records committed on origin/main
           for that college, by the scorer's own passes_live and coverage share:
           fail to pass, pass to fail, lost coverage, kept (kept_passing.json),
           new records, cost. A verdict: ready, captured, held or failed.
  file     (one job, after the matrix) copies each college's filed folder from its
           artifact into the checkout and writes the wave's table.

Version 1 writes no table. The load, reread and display stay the college
workflow's dispatches, run by the conductor for each ready college after reading
the one table. Tests: tests/program_requirements_wave_test.py.
"""
from __future__ import annotations

import argparse
import glob
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

MAX_COLLEGES = 8
LIMIT_CEILING_USD = 40.0       # Sam's standing go, a college a run, on the estimate
                               # (cpl_memory sam-extraction-standing-go-40-per-college-2026-10-14)
DEFAULT_COST_PER_PROGRAM = 0.08   # also the floor: a college's rate never prices below it
PRICE_MARGIN = 1.25
PAGES_FLOOR = 0.9              # a capture answering less than this share of the pages it listed is partial
WAVE_NAME = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
WAVE_BRANCH = "claude/harvest-wave-"
WAVE_DIR = os.path.join(HERE, "program_requirements_wave")
# A catalog platform whose reader also calls the vendor's own host for every college on it.
VENDOR_HOSTS = {"elumen": "api-prod.elumenapp.com", "coursedog": "app.coursedog.com"}


class Refused(ValueError):
    """A dispatch the wave refuses, with the reason in plain words."""


# ── plan ─────────────────────────────────────────────────────────────────────
def parse_colleges(text: str) -> list[str]:
    names = [x.strip() for x in (text or "").split(",") if x.strip()]
    if not names:
        raise Refused("no college named")
    if len(names) > MAX_COLLEGES:
        raise Refused("%d colleges named; a wave reads at most %d" % (len(names), MAX_COLLEGES))
    seen: dict[str, str] = {}
    for n in names:
        if n.lower() in seen:
            raise Refused("%s is named twice" % n)
        seen[n.lower()] = n
    return names


def parse_limit(text: str) -> float:
    try:
        v = float(str(text).strip())
    except (TypeError, ValueError):
        raise Refused("limit_usd %r is not a number" % (text,))
    if not math.isfinite(v) or v <= 0:
        raise Refused("limit_usd must be above 0")
    if v > LIMIT_CEILING_USD:
        raise Refused("limit_usd %.2f is above Sam's standing limit of $%.0f a college a run; above it is a card"
                      % (v, LIMIT_CEILING_USD))
    return v


def parse_extract(text: str) -> bool:
    t = str(text or "").strip()
    if t not in ("0", "1"):
        raise Refused("extract must be 0 or 1, not %r" % (text,))
    return t == "1"


def check_branch(wave: str, ref_name: str) -> None:
    if not WAVE_NAME.match(wave or ""):
        raise Refused("wave %r: use lowercase letters, digits and hyphens, at most 40" % (wave,))
    if ref_name in ("main", "master") or not ref_name:
        raise Refused("a wave never runs on main: create %s%s and dispatch there" % (WAVE_BRANCH, wave))
    if ref_name != WAVE_BRANCH + wave:
        raise Refused("the wave %s files to %s%s; this dispatch ran on %s" % (wave, WAVE_BRANCH, wave, ref_name))


def check_attempt(extract: bool, attempt) -> None:
    """A re-run keeps the run id and its first commit, so it prices against the branch as it stood
    before the wave filed and would pay a second time for the programs the first attempt read
    (S644 review). An extracting wave runs once; a capture-only wave may run again."""
    try:
        n = int(str(attempt or "1").strip())
    except ValueError:
        n = 1
    if extract and n > 1:
        raise Refused("this is attempt %d of an extracting wave, and a re-run would pay again for what the "
                      "first attempt read: dispatch a new wave instead" % n)


def host_of(url: str | None) -> str | None:
    if not isinstance(url, str) or not url.startswith("http"):
        return None
    h = (urllib.parse.urlparse(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else (h or None)


def hosts_of(reg: dict, hand: dict | None = None, hand_file_on_disk: bool = False) -> list[str]:
    """Every host a college's capture reads. A hand-filed copy is read in place of the
    catalog (the capture opens no catalog host): its copy_url's host, or none when the
    file sits beside the record. Otherwise the registry's catalog address, the procedure
    record's catalog step (its start page and named file), and the vendor host a platform's
    reader calls for every college on it (eLumen's publish API, Coursedog's program search)."""
    import _program_requirements_pilot as P
    if hand:
        if hand_file_on_disk:
            return []
        return sorted(h for h in {host_of(hand.get("copy_url"))} if h)
    out = {host_of(reg.get("catalog_url"))}
    step = P.procedure_catalog(reg.get("procedure")) or {}
    out |= {host_of(step.get("start")), host_of(step.get("file"))}
    out.add(VENDOR_HOSTS.get(reg.get("catalog_platform") or ""))
    return sorted(h for h in out if h)


def plan_wave(names: list[str], registry: dict[str, dict], hosts: dict[str, list[str]]) -> list[dict]:
    """The matrix, or Refused. registry maps each named college to its row ({} when none);
    hosts maps it to hosts_of()."""
    import _program_requirements_college as C
    unknown = [n for n in names if not registry.get(n)]
    if unknown:
        raise Refused("not in program_source_registry: %s" % ", ".join(unknown))
    by_host: dict[str, list[str]] = {}
    for n in names:
        for h in hosts.get(n) or []:
            by_host.setdefault(h, []).append(n)
    clash = {h: ns for h, ns in by_host.items() if len(ns) > 1}
    if clash:
        raise Refused("two reads on one host: " + "; ".join("%s (%s)" % (h, ", ".join(ns))
                                                            for h, ns in sorted(clash.items())))
    slugs: dict[str, str] = {}
    for n in names:
        s = C.slug_of(n)
        if s in slugs:
            raise Refused("%s and %s file to one folder (%s)" % (slugs[s], n, s))
        slugs[s] = n
    return [{"college": n, "slug": C.slug_of(n), "hosts": hosts.get(n) or []} for n in names]


def plan_main(args) -> int:
    import _program_requirements_college as C
    import _program_requirements_pilot as P
    try:
        names = parse_colleges(args.colleges)
        check_attempt(parse_extract(args.extract), args.attempt)
        parse_limit(args.limit_usd)
        check_branch(args.wave, args.ref)
        registry, hosts = {}, {}
        for n in names:
            registry[n] = P.fetch_registry(n)
            found = C.hand_filed_meta(n)
            meta = found[1] if found else None
            on_disk = bool(meta and meta.get("file")
                           and os.path.isfile(os.path.join(C.HAND_FILED_DIR, os.path.basename(meta["file"]))))
            hosts[n] = hosts_of(registry[n], meta, on_disk)
        matrix = plan_wave(names, registry, hosts)
    except Refused as exc:
        print("::error::The wave is refused: %s" % exc)
        return 1
    for m in matrix:
        print("%-40s %s" % (m["college"], ", ".join(m["hosts"]) or "(a hand-filed copy beside its record)"))
    _output("matrix", json.dumps(matrix, separators=(",", ":")))
    return 0


# ── price ────────────────────────────────────────────────────────────────────
def cost_per_program(records: dict[str, dict]) -> tuple[float, str]:
    """The rate the price reads: the mean cost of the college's filed records that carry a positive
    cost, errored calls included (an errored call can still have been paid for), and never below the
    0.08 default, so a small sample can raise the rate and never lower it. summary.json's
    cost_per_program divides by every record, so each call with no price counts as a program at $0 and
    the rate reads low (S644 review). No priced record: the default."""
    priced = [r["cost_usd"] for r in records.values() if isinstance(r.get("cost_usd"), (int, float)) and r["cost_usd"] > 0]
    if not priced:
        return DEFAULT_COST_PER_PROGRAM, "no priced record: the default"
    rate = sum(priced) / len(priced)
    if rate < DEFAULT_COST_PER_PROGRAM:
        return DEFAULT_COST_PER_PROGRAM, "the college's rate %.4f over %d priced records is below the default" % (
            rate, len(priced))
    return round(rate, 4), "the college's %d priced records" % len(priced)


def pages_share(capture: dict | None) -> dict:
    """The pages the capture listed and answered (pages_account in the college script) and
    whether that is partial. A capture that counted no pages is held: nothing proves it whole."""
    c = capture or {}
    listed, answered = c.get("pages_listed"), c.get("pages_answered")
    if not isinstance(listed, int) or not isinstance(answered, int):
        return {"listed": listed, "answered": answered, "share": None, "partial": True,
                "why": "the capture did not count its pages"}
    if listed <= 0:
        return {"listed": listed, "answered": answered, "share": None, "partial": True,
                "why": "the capture listed no pages"}
    share = answered / listed
    return {"listed": listed, "answered": answered, "share": round(share, 3), "partial": share < PAGES_FLOOR,
            "why": ("%d of %d pages answered" % (answered, listed)) if share < PAGES_FLOOR else None}


def price(would: int, cpp: float, limit: float, extract: bool, pages: dict | None = None) -> dict:
    """The estimate and the gate. Extraction goes only when asked, on a whole capture, with
    something to send, and at a price within the limit."""
    est = round(would * cpp * PRICE_MARGIN, 2)
    within = est <= limit + 1e-9
    if not extract:
        go, why = False, "extract 0: capture and price only"
    elif pages and pages.get("partial"):
        go, why = False, "partial capture: " + (pages.get("why") or "")
    elif would <= 0:
        go, why = False, "nothing to extract"
    elif not within:
        go, why = False, "price $%.2f is over the limit of $%.2f" % (est, limit)
    else:
        go, why = True, "price $%.2f is within the limit of $%.2f" % (est, limit)
    return {"would_extract": would, "cost_per_program": cpp, "margin": PRICE_MARGIN, "price_usd": est,
            "limit_usd": limit, "within_limit": within, "extract_asked": extract, "go": go, "why": why}


def provisional_row(college: str, slug: str, run_id, priced: dict) -> dict:
    """The row the price step files before any model call, so a college whose job stops before its
    verify (a timeout, a runner lost) still shows what it was allowed to spend. The verify replaces it."""
    return {"college": college, "slug": slug, "run": str(run_id), "provisional": True,
            "would_extract": priced.get("would_extract"), "price_usd": priced.get("price_usd"),
            "price_why": priced.get("why"), "allowed_usd": priced.get("price_usd") if priced.get("go") else 0,
            "extracted": None, "cost_usd": None, "outcomes": {}, "pages": priced.get("pages"),
            "verdict": "failed: the job did not finish after its price" + (
                " (it was allowed up to $%.2f)" % priced["price_usd"] if priced.get("go") else "")}


def price_main(args) -> int:
    import _program_requirements_college as C
    slug = C.slug_of(args.college)
    capture = _read(os.path.join(args.out, "capture.json")) or {}
    cpp, cpp_from = cost_per_program(load_records(os.path.join(C.COLLEGE_DIR, slug)))
    pages = pages_share(capture)
    extract = parse_extract(args.extract)
    got = price(((capture.get("would_extract") or {}).get("programs")) or 0, cpp, parse_limit(args.limit_usd),
                extract, pages)
    got.update(cost_per_program_from=cpp_from, pages=pages)
    refused = None
    try:
        check_attempt(extract, args.attempt)
    except Refused as exc:
        refused = str(exc)
        got.update(go=False, why=refused, rerun=True)
    C._write(os.path.join(args.out, "wave_price.json"), got)
    os.makedirs(os.path.dirname(os.path.abspath(args.write)), exist_ok=True)
    C._write(args.write, provisional_row(args.college, slug, args.run, got))
    print("%s: %s" % (args.college, got["why"]))
    _output("go", "true" if got["go"] else "false")
    if refused:
        print("::error::%s: %s" % (args.college, refused))
        return 1
    return 0


# ── verify ───────────────────────────────────────────────────────────────────
def load_records(folder: str | None) -> dict[str, dict]:
    out = {}
    d = os.path.join(folder or "", "records")
    if folder and os.path.isdir(d):
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".json"):
                rec = _read(os.path.join(d, fn)) or {}
                out[rec.get("control_number") or fn[:-5]] = rec
    return out


def compare(base: dict[str, dict], run: dict[str, dict]) -> dict:
    """Each passing record of main's against the run's, by the scorer's own definitions:
    passes_live, and the coverage share score["coverage"]["share"] (placed / listed). A program
    whose passing record the run no longer files counts as pass to fail (absent)."""
    from _program_requirements_score import passes_live

    def share(rec):
        v = ((rec.get("score") or {}).get("coverage") or {}).get("share")
        return v if isinstance(v, (int, float)) else None
    f2p, p2f, lost, new = [], [], [], []
    for cn, r in sorted(run.items()):
        b = base.get(cn)
        if b is None:
            new.append(cn)
        elif not passes_live(b.get("score")) and passes_live(r.get("score")):
            f2p.append(cn)
    for cn, b in sorted(base.items()):
        if not passes_live(b.get("score")):
            continue
        r = run.get(cn)
        if r is None:
            p2f.append({"control_number": cn, "why": "absent"})
            continue
        if not passes_live(r.get("score")):
            p2f.append({"control_number": cn, "why": "fails"})
        old, now = share(b), share(r)
        if old is not None and now is not None and now < old:
            lost.append({"control_number": cn, "was": old, "now": now})
    return {"fail_to_pass": f2p, "pass_to_fail": p2f, "lost_coverage": lost, "new": new}


def run_cost(out_dir: str | None, run_id) -> dict:
    """Extracted, cost and kept for THIS run, read from the run's own out/ folder: out/records and
    out/kept_passing_*.json, which the extraction writes call by call, so a file step that never ran
    or stopped partway still shows what the model calls cost (S644 review). summary.json's cost_usd
    counts older runs too. A record the run moved to new pages with no model call (moved_record) or
    reconciled carries the run beside read_run, the run that paid for it; a fresh extraction carries
    no read_run."""
    rid = str(run_id)
    mine = [r for r in load_records(out_dir).values() if str(r.get("extracted_run")) == rid and "read_run" not in r]
    kept_list: list = []
    for path in sorted(glob.glob(os.path.join(out_dir or "", "kept_passing_*.json"))) if out_dir else []:
        kept_list.extend(_read(path) or [])
    cost = sum(r.get("cost_usd") or 0 for r in mine) + sum(k.get("cost_usd") or 0 for k in kept_list)
    # A call with usage and no price (a fallback model the table does not price) cost something the
    # sum cannot show: counted apart, and shown beside the cost.
    unpriced = sum(1 for x in mine + kept_list if x.get("usage") and not isinstance(x.get("cost_usd"), (int, float)))
    not_sent: list = []
    for path in sorted(glob.glob(os.path.join(out_dir or "", "not_sent_*.json"))) if out_dir else []:
        not_sent.extend((_read(path) or {}).get("programs") or [])
    # The extraction function's answer that stopped the read (503 or 401; extract_halt_<shard>.json, S647).
    # Its cost_usd is what the halting answers carried (paid parts of a read in parts), counted with the run's cost
    # (S648 review).
    halt = None
    for path in sorted(glob.glob(os.path.join(out_dir or "", "extract_halt_*.json"))) if out_dir else []:
        h = _read(path) or {}
        cost += h.get("cost_usd") or 0
        halt = halt or h or None
    return {"extracted": len(mine), "cost_usd": round(cost, 2), "kept": len(kept_list), "unpriced": unpriced,
            "not_sent": sorted(not_sent), "halt": halt}


def verdict(outcomes: dict, capture: dict | None, pages: dict, priced: dict | None, cmp: dict,
            extracted: int, not_sent: int = 0, halt: dict | None = None) -> str:
    """ready: extracted, no pass to fail, no passing record lost coverage (the conductor rereads it).
    captured: a whole capture, nothing extracted (priced only). held: a person reads it first.
    failed: a step did not finish. An extraction the function's answer stopped names it (halt, S647)."""
    if outcomes.get("capture") != "success" or not capture:
        return "failed: capture"
    if pages.get("partial"):
        return "held: partial capture (%s)" % pages.get("why")
    p = priced or {}
    if p.get("rerun"):
        return "held: a re-run never extracts (dispatch a new wave)"
    if p.get("extract_asked") and p.get("would_extract") and not p.get("within_limit"):
        return "held: price over the limit"
    if outcomes.get("extract") not in (None, "", "success", "skipped"):
        if halt:
            return "failed: extract stopped, HTTP %s%s: %s" % (
                halt.get("status"), " " + halt["reason"] if halt.get("reason") else "", halt.get("cause"))
        return "failed: extract"
    if outcomes.get("file") != "success":
        return "failed: file"
    if not_sent:
        return "held: reached the limit, %d programs not sent" % not_sent
    if cmp["pass_to_fail"] or cmp["lost_coverage"]:
        return "held: %d pass to fail, %d lost coverage" % (len(cmp["pass_to_fail"]), len(cmp["lost_coverage"]))
    if not extracted:
        return "captured" if p.get("would_extract") or not p.get("extract_asked") else "captured: nothing to extract"
    return "ready"


def verify(college: str, run_dir: str, base_dir: str | None, capture: dict | None, priced: dict | None,
           run_id, outcomes: dict, out_dir: str | None = None) -> dict:
    """run_dir: the college's folder as the file step left it; out_dir: the run's out/ folder, which
    the cost is read from."""
    run = load_records(run_dir)
    base = load_records(base_dir)
    cmp = compare(base, run)
    rc = run_cost(out_dir, run_id)
    extracted, cost, kept = rc["extracted"], rc["cost_usd"], rc["kept"]
    pages = pages_share(capture)
    p = priced or {}
    return {"college": college, "run": str(run_id), "hosts": None,
            "would_extract": p.get("would_extract"), "price_usd": p.get("price_usd"),
            "price_why": p.get("why"), "extracted": extracted, "cost_usd": cost, "unpriced": rc["unpriced"],
            "not_sent": len(rc["not_sent"]),
            "fail_to_pass": len(cmp["fail_to_pass"]), "pass_to_fail": len(cmp["pass_to_fail"]),
            "lost_coverage": len(cmp["lost_coverage"]), "kept": kept, "new": len(cmp["new"]),
            "records": len(run), "main_records": len(base), "pages": pages, "outcomes": outcomes,
            "verdict": verdict(outcomes, capture, pages, priced, cmp, extracted, len(rc["not_sent"]), rc["halt"]),
            "detail": dict(cmp, not_sent=rc["not_sent"], halt=rc["halt"])}


def baseline_from_git(ref: str, slug: str, dest: str) -> str | None:
    """main's filed folder for the college, unpacked under dest, or None when main files none."""
    path = "kb/program_requirements_college/%s" % slug
    got = subprocess.run(["git", "archive", "--format=tar", ref, "--", path], cwd=ROOT, capture_output=True)
    if got.returncode != 0:
        return None
    with tarfile.open(fileobj=io.BytesIO(got.stdout)) as tf:
        tf.extractall(dest, filter="data")
    return os.path.join(dest, path)


def verify_main(args) -> int:
    import _program_requirements_college as C
    slug = C.slug_of(args.college)
    outcomes = {"capture": args.capture_outcome, "extract": args.extract_outcome, "file": args.file_outcome}
    with tempfile.TemporaryDirectory() as tmp:
        base = baseline_from_git(args.baseline_ref, slug, tmp)
        got = verify(args.college, os.path.join(C.COLLEGE_DIR, slug), base,
                     _read(os.path.join(args.out, "capture.json")), _read(os.path.join(args.out, "wave_price.json")),
                     args.run, outcomes, args.out)
    got["slug"] = slug
    os.makedirs(os.path.dirname(os.path.abspath(args.write)), exist_ok=True)
    C._write(args.write, got)
    print(json.dumps({k: v for k, v in got.items() if k != "detail"}, indent=1))
    return 0


# ── file ─────────────────────────────────────────────────────────────────────
def summarize_wave(wave: str, run_id, extract: bool, limit: float, rows: list[dict]) -> dict:
    return {"wave": wave, "run": str(run_id), "extract": extract, "limit_usd": limit,
            "colleges": len(rows), "total_cost_usd": round(sum(r.get("cost_usd") or 0 for r in rows), 2),
            "total_price_usd": round(sum(r.get("price_usd") or 0 for r in rows), 2),
            "unpriced": sum(r.get("unpriced") or 0 for r in rows),
            # A job that stopped after its price: what it was allowed to spend, its cost unknown.
            "unfinished_allowed_usd": round(sum(r.get("allowed_usd") or 0 for r in rows if r.get("provisional")), 2),
            "ready": [r["college"] for r in rows if r.get("verdict") == "ready"],
            "rows": rows}


def _money(v) -> str:
    return "" if v is None else "$%.2f" % v


def table_md(summary: dict) -> str:
    head = ["College", "Would extract", "Price", "Extracted", "Cost", "Fail to pass", "Pass to fail",
            "Lost coverage", "Kept", "New", "Pages answered", "Verdict"]
    lines = ["# Program requirements wave %s (run %s)" % (summary["wave"], summary["run"]), "",
             "Extract %s, limit $%.2f a college. Total cost %s; total price %s. Filed by "
             "`kb/_program_requirements_wave.py file`; the procedure is in "
             "`docs/program_requirements_harvest_lessons.md`, *Running a wave*." % (
                 "1" if summary["extract"] else "0", summary["limit_usd"], _money(summary["total_cost_usd"]),
                 _money(summary["total_price_usd"])) + (
                 " The cost leaves out %d unpriced calls." % summary["unpriced"] if summary.get("unpriced") else "") + (
                 " Up to %s more at colleges whose job stopped after its price." % _money(summary["unfinished_allowed_usd"])
                 if summary.get("unfinished_allowed_usd") else ""), "",
             "| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    for r in summary["rows"]:
        pg = r.get("pages") or {}
        pages = "%s of %s" % (pg.get("answered"), pg.get("listed")) if pg.get("listed") is not None else ""
        cost = ("up to " + _money(r.get("allowed_usd"))) if r.get("provisional") and r.get("allowed_usd") \
            else _money(r.get("cost_usd"))
        if r.get("unpriced"):
            cost += " plus %d unpriced call%s" % (r["unpriced"], "" if r["unpriced"] == 1 else "s")
        cells = [r["college"], r.get("would_extract"), _money(r.get("price_usd")), r.get("extracted"),
                 cost, r.get("fail_to_pass"), r.get("pass_to_fail"), r.get("lost_coverage"),
                 r.get("kept"), r.get("new"), pages, r.get("verdict")]
        lines.append("| " + " | ".join("" if c is None else str(c) for c in cells) + " |")
    lines += ["", "Ready for the reread (`step=reread college=<name>` on this branch): %s." % (
        ", ".join(summary["ready"]) or "none")]
    for r in summary["rows"]:
        if r.get("filed") is False:
            lines.append("%s: its folder was not filed (%s)." % (r["college"], r.get("not_filed_why")))
    return "\n".join(lines) + "\n"


def artifact_name(run_id, slug: str, attempt=1) -> str:
    """The read job's upload for one college (program-requirements-wave.yml names it so). The attempt is
    in the name: a re-run keeps the run id, and a name cannot be uploaded twice in one run."""
    return "wave-filed-%s-%s-%s" % (run_id, attempt, slug)


def _row_of(art: str, slug: str) -> dict | None:
    # Laid out from the root when the folder rode along; the verify row alone lands at the top.
    return _read(os.path.join(art, "wave_out", slug + ".wave.json")) or _read(os.path.join(art, slug + ".wave.json"))


def paid(row: dict) -> bool:
    """An attempt that sent programs to the model, or was allowed to and stopped before its verify."""
    ext = (row.get("outcomes") or {}).get("extract")
    return (ext not in (None, "", "skipped") or (row.get("extracted") or 0) > 0 or (row.get("cost_usd") or 0) > 0
            or bool(row.get("provisional") and row.get("allowed_usd")))


def pick_attempt(artifacts: str, run_id, slug: str) -> tuple[str | None, dict | None, int | None]:
    """The artifact the filing takes for one college: the latest attempt that paid for model calls, else
    the latest attempt with a result. An extracting re-run never extracts (check_attempt), so a later
    capture-only attempt never displaces the paid records of the first."""
    pat = re.compile(r"^wave-filed-%s-(\d+)-%s$" % (re.escape(str(run_id)), re.escape(slug)))
    found = []
    for name in os.listdir(artifacts) if os.path.isdir(artifacts) else []:
        m = pat.match(name)
        row = _row_of(os.path.join(artifacts, name), slug) if m else None
        if row:
            found.append((int(m.group(1)), os.path.join(artifacts, name), row))
    if not found:
        return None, None, None
    pick = max((f for f in found if paid(f[2])), default=None, key=lambda f: f[0]) or max(found, key=lambda f: f[0])
    return pick[1], dict(pick[2], attempt=pick[0], attempts=sorted(f[0] for f in found)), pick[0]


def file_wave(wave: str, artifacts: str, matrix: list[dict], run_id, extract: bool, limit: float,
              root: str = ROOT) -> dict:
    """Each college's verify row and filed folder from its artifact (artifacts/<artifact_name>/, laid out
    from the repository's root), copied into the checkout at root; then the wave's table. A folder
    replaces the checkout's whole (the run's file step removed what it replaced); a college whose file
    step did not finish keeps the branch's folder, and the table says so."""
    rows = []
    for m in matrix:
        slug = m["slug"]
        art, row, _attempt = pick_attempt(artifacts, run_id, slug)
        if not row:
            rows.append({"college": m["college"], "slug": slug, "hosts": m.get("hosts"),
                         "verdict": "failed: no result", "filed": False, "not_filed_why": "the job filed no result"})
            continue
        row.update(college=m["college"], slug=slug, hosts=m.get("hosts"))
        src = os.path.join(art, "kb", "program_requirements_college", slug)
        dst = os.path.join(root, "kb", "program_requirements_college", slug)
        if (row.get("outcomes") or {}).get("file") == "success" and os.path.isdir(src):
            if os.path.isdir(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            row["filed"] = True
        else:
            row.update(filed=False, not_filed_why="its file step did not finish")
        hand = os.path.join(art, "kb", "hand_filed_catalogs", slug + ".json")
        if os.path.isfile(hand):
            shutil.copyfile(hand, os.path.join(root, "kb", "hand_filed_catalogs", slug + ".json"))
        rows.append(row)
    summary = summarize_wave(wave, run_id, extract, limit, rows)
    out = os.path.join(root, "kb", "program_requirements_wave")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, wave + ".json"), "w") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    with open(os.path.join(out, wave + ".md"), "w") as fh:
        fh.write(table_md(summary))
    return summary


def file_main(args) -> int:
    summary = file_wave(args.wave, args.artifacts, json.loads(args.matrix), args.run,
                        parse_extract(args.extract), parse_limit(args.limit_usd))
    print(table_md(summary))
    return 0


# ── helpers ──────────────────────────────────────────────────────────────────
def _read(path: str):
    try:
        with open(path) as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def _output(name: str, value: str) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as fh:
            fh.write("%s=%s\n" % (name, value))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("step", choices=["plan", "price", "verify", "file"])
    ap.add_argument("--colleges", default="")
    ap.add_argument("--college", default="")
    ap.add_argument("--extract", default="0")
    ap.add_argument("--limit-usd", default="40")
    ap.add_argument("--wave", default="")
    ap.add_argument("--ref", default=os.environ.get("GITHUB_REF_NAME", ""))
    ap.add_argument("--out", default="out")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    ap.add_argument("--attempt", default=os.environ.get("GITHUB_RUN_ATTEMPT", "1"))
    ap.add_argument("--baseline-ref", default="origin/main")
    ap.add_argument("--capture-outcome", default="")
    ap.add_argument("--extract-outcome", default="")
    ap.add_argument("--file-outcome", default="")
    ap.add_argument("--write", default="wave_out/result.json")
    ap.add_argument("--artifacts", default="wave_artifacts")
    ap.add_argument("--matrix", default="[]")
    args = ap.parse_args(argv)
    return {"plan": plan_main, "price": price_main, "verify": verify_main, "file": file_main}[args.step](args)


if __name__ == "__main__":
    sys.exit(main())
