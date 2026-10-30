#!/usr/bin/env python3
"""queue_status.py — stamp and check kb/status/<project>.json, a Progress view's status file.

The Program Requirements tab's Progress view (program_requirements.js, Sam's 2026-10-07
ask: "a workflow dashboard to monitor the progress") reads the harvest's tables live,
every record included (Sam, Open Asks Sheet 67). What no browser read can know comes from
this file instead, written at every checkpoint (.claude/commands/checkpoint.md, step 12):
the run, meaning the session that last worked the queue and its handoff, the CPL Queue
routine's next firing, the next step, the calls waiting on Sam, and what changed
(program_source_registry_history has no anon grant).

The `unchecked` list (every record no person had checked) is no longer written: since
Sam's 2026-10-17 ruling ("I am trusting your procedures") no record waits on a person,
and the view counts every record from its own index. At 15,914 rows it made this file
3.5 MB, read on every visit (S415). A file that still carries one is validated.

It also keeps the headline's history (Sam, 2026-10-08: COCI's active programs beside
"the ones with complete harvested ROEP data", "so she can get the BIG vision and
progress"): one entry per day in `headline`, so the pair has a trend. Complete means an
active program's record passes the machine checks (program_record_machine_pass); entries
before 2026-10-18 counted the records a person checked (`checked`). The view reads the
pair live; the list is the record.

Never widen a policy to fill the view; this file is the chosen alternative (S343, the
handoff's option b).

Since S419 (the Commons' step 1, Sam's Open Asks Sheet 95 card 1) every common reference's
Progress view reads its own file under kb/status/, drawn by the shared commons_progress.js;
Program Requirements' is kb/status/program-requirements.json (kb/queue_status.json until
S418). `--project <id>` names another project's file; the default is Program Requirements'.

Usage, from the repo root:
  python3 scripts/queue_status.py --check [--project program-requirements]
      validate the committed file; exit 1 and name each fault
  python3 scripts/queue_status.py --stamp [--next-run 2026-10-08T15:07:00Z]
                                          [--headline ACTIVE COMPLETE COLLEGES]
      set written_at to now (UTC) and, if given, the routine's next firing (read it with
      get_trigger on the CPL Queue routine) and today's headline entry (read the three
      counts with the query --headline-sql prints; a second stamp the same day replaces
      that day's entry), then validate
  python3 scripts/queue_status.py --headline-sql
      print the headline's query (run it through the Supabase MCP)

  python3 scripts/queue_status.py --harvest-sql
      print the one query behind the whole-harvest measure (run it through the Supabase MCP)
  python3 scripts/queue_status.py --harvest '<the query's row as JSON>'
      set the harvest block (alone or with --stamp; it never moves written_at) (Sam, 2026-10-13: "an overall measure ... how far we are through
      the whole harvest process"): the five parts' counts, with the gaps the committed capture
      reports filed added to the programs with ROEP data

The session writes the prose fields; the script owns the clock. Guard:
tests/queue_status_test.py.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# One status file per common reference, kb/status/<project>.json (S419, the Commons' step 1; Sam's
# Open Asks Sheet 95 card 1). Program Requirements' was kb/queue_status.json from S343 to S418.
PROJECT = "program-requirements"
STATUS_DIR = os.path.join(ROOT, "kb", "status")
PATH = os.path.join(ROOT, "kb", "status", "program-requirements.json")
TAB = os.path.join(ROOT, "program_requirements.js")


def path_for(project):
    """The status file of a project, by its id (the file's basename)."""
    if not re.match(r"^[a-z][a-z0-9-]*$", project or ""):
        raise SystemExit("queue_status: a project id is lowercase words and hyphens, not %r" % (project,))
    return os.path.join(STATUS_DIR, project + ".json")

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$")
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# Outward-ish text on a COBI view: plain words (CLAUDE.md, presentation rules).
GLYPH = re.compile("[←-⇿☀-➿⬀-⯿\U0001f300-\U0001faff]")


def part_ids(src=None):
    """The PARTS ids the view defines, read from the view so the two never drift."""
    if src is None:
        with open(TAB, encoding="utf-8") as f:
            src = f.read()
    m = re.search(r"var PARTS = \[(.*?)\n  \];", src, re.S)
    return re.findall(r'\{ id: "([a-z_]+)", title:', m.group(1)) if m else []


def faults(q, root=ROOT, parts=None):
    """Every way q falls short of what the view reads; [] when it is sound."""
    out = []

    def need(cond, why):
        if not cond:
            out.append(why)

    def text(v, where, required=True):
        if v is None and not required:
            return
        if not isinstance(v, str) or not v.strip():
            out.append(where + " must be non-empty text")
            return
        if GLYPH.search(v):
            out.append(where + " carries a glyph; use words")
        if "**" in v or re.match(r"^\s*[-*•]\s", v):
            out.append(where + " carries markdown; the view shows plain text")

    if not isinstance(q, dict):
        return ["the file must hold one JSON object"]
    need(q.get("schema") == 1, "schema must be 1")
    text(q.get("project"), "project", required=False)
    need(isinstance(q.get("written_at"), str) and ISO.match(q.get("written_at") or ""),
         "written_at must be an ISO time in UTC (run --stamp)")
    need(isinstance(q.get("session"), int) and q.get("session") > 0, "session must be the session number")
    text(q.get("moniker"), "moniker")
    text(q.get("run"), "run")
    text(q.get("decider"), "decider", required=False)
    h = q.get("handoff")
    need(isinstance(h, str) and re.match(r"^docs/session_\d+_handoff\.md$", h or "")
         and os.path.exists(os.path.join(root, h or "")),
         "handoff must name a docs/session_<N>_handoff.md that exists")
    nr = q.get("next_run")
    if nr is not None:
        need(isinstance(nr, dict), "next_run must be an object")
        if isinstance(nr, dict):
            text(nr.get("name"), "next_run.name")
            need(isinstance(nr.get("at"), str) and ISO.match(nr.get("at") or ""), "next_run.at must be an ISO time in UTC")
            need(isinstance(nr.get("every_hours"), (int, float)) and nr.get("every_hours") >= 0,
                 "next_run.every_hours must be a number of hours (0 for a one-time run)")
    un = q.get("unchecked")
    need(un is None or isinstance(un, list), "unchecked must be a list when present (no longer written; see the docstring)")
    for i, u in enumerate(un if isinstance(un, list) else []):
        w = "unchecked[%d]" % i
        if not isinstance(u, dict):
            out.append(w + " must be an object")
            continue
        for k in ("college", "program", "control_number"):
            text(u.get(k), w + "." + k)
        need(isinstance(u.get("loaded"), str) and DAY.match(u.get("loaded") or ""), w + ".loaded must be a date, YYYY-MM-DD")
    ns = q.get("next_step")
    need(isinstance(ns, dict), "next_step must be an object with a title and text")
    if isinstance(ns, dict):
        text(ns.get("title"), "next_step.title")
        text(ns.get("text"), "next_step.text")
    calls = q.get("calls")
    need(isinstance(calls, list), "calls must be a list (empty when nothing waits on Sam)")
    for i, c in enumerate(calls if isinstance(calls, list) else []):
        w = "calls[%d]" % i
        if not isinstance(c, dict):
            out.append(w + " must be an object")
            continue
        text(c.get("title"), w + ".title")
        text(c.get("text"), w + ".text")
        text(c.get("if_no_reply"), w + ".if_no_reply", required=False)
        need(c.get("link") is None or (isinstance(c.get("link"), str) and c["link"].startswith("https://")),
             w + ".link must be an https address")
        text(c.get("link_text"), w + ".link_text", required=False)
        # The decider's answer from the sheet (Sam, 2026-10-21): a call carrying one counts as
        # answered on the Progress view, Sam's to-dos and the Commons dash, and shows its words.
        a = c.get("answer")
        if a is not None:
            need(isinstance(a, dict), w + ".answer must be an object with by, at and words")
            if isinstance(a, dict):
                text(a.get("by"), w + ".answer.by")
                text(a.get("words"), w + ".answer.words")
                need(isinstance(a.get("at"), str) and bool(DAY.match(a.get("at") or "")), w + ".answer.at must be a date, YYYY-MM-DD")
        v = c.get("view")
        if v is not None:
            need(isinstance(v, dict) and isinstance(v.get("href"), str)
                 and (v["href"].startswith("https://") or re.match(r"^#[A-Za-z0-9_.~-]+$", v["href"])),
                 w + ".view.href must be an https address or a COBI tab's bare hash (#cpl-pathways)")
            text((v or {}).get("text") if isinstance(v, dict) else None, w + ".view.text")
        # Where Sam answers it (Sam, 2026-10-13, on his phone: "if there are open questions I
        # can address for any, add a link on those card to where I can answer those"). S380's
        # three calls carried none, so the cards named a question with nowhere to tap.
        need(bool(c.get("link") or c.get("view") or c.get("records") or c.get("todo_id")),
             w + " needs a place to answer it: a link (the sheet card), a view, the records it names, or a todo_id")
        # A to-do Sam marks done on its card (S527, Sam 2026-10-30): the key queue_todo_done_add takes.
        if c.get("todo_id") is not None:
            need(isinstance(c.get("todo_id"), str) and bool(re.match(r"^[a-z0-9][a-z0-9-]{1,80}$", c.get("todo_id") or "")),
                 w + ".todo_id must be lower-case letters, digits and hyphens (the key queue_todo_done takes)")
        # The part whose card carries the call's answer link, beside the side column's card.
        if c.get("part") is not None:
            known_parts = parts if parts is not None else part_ids()
            need(c.get("part") in known_parts, w + ".part names no part (the view's parts: " + ", ".join(known_parts) + ")")
        # A call that names records (S354): the Progress card lists each with Confirm and
        # Needs a fix, so each needs the key the verdict RPC takes.
        recs = c.get("records")
        if recs is not None:
            need(isinstance(recs, list) and len(recs) > 0, w + ".records must be a non-empty list when present")
            for j, r in enumerate(recs if isinstance(recs, list) else []):
                rw = "%s.records[%d]" % (w, j)
                if not isinstance(r, dict):
                    out.append(rw + " must be an object")
                    continue
                text(r.get("college"), rw + ".college")
                text(r.get("control_number"), rw + ".control_number")
                text(r.get("label"), rw + ".label", required=False)
    notes = q.get("notes", {})
    need(isinstance(notes, dict), "notes must map a part id to its foot line")
    known = parts if parts is not None else part_ids()
    for k, v in (notes.items() if isinstance(notes, dict) else []):
        need(k in known, "notes." + k + " names no part (the view's parts: " + ", ".join(known) + ")")
        text(v, "notes." + k)
    hl = q.get("headline")
    need(isinstance(hl, list), "headline must be a list of the pair recorded at each checkpoint")
    prev = ""
    for i, e in enumerate(hl if isinstance(hl, list) else []):
        w = "headline[%d]" % i
        if not isinstance(e, dict):
            out.append(w + " must be an object")
            continue
        d = e.get("day")
        need(isinstance(d, str) and DAY.match(d or ""), w + ".day must be a date, YYYY-MM-DD")
        need("complete" in e or "checked" in e, w + " needs complete (or checked, before 2026-10-18)")
        for k in ("active", "colleges", "complete", "checked"):
            if k in ("complete", "checked") and k not in e:
                continue
            need(isinstance(e.get(k), int) and not isinstance(e.get(k), bool) and e.get(k) >= 0,
                 w + "." + k + " must be a whole number")
        for k in ("complete", "checked"):
            if isinstance(e.get("active"), int) and isinstance(e.get(k), int):
                need(e[k] <= e["active"], w + "." + k + " cannot exceed active")
        if isinstance(d, str):
            need(d > prev, w + ".day must come after the entry before it (one entry per day, oldest first)")
            prev = d
    if "harvest" in q:
        out.extend(harvest_faults(q.get("harvest")))
    ch = q.get("changes")
    need(isinstance(ch, list), "changes must be a list")
    for i, c in enumerate(ch if isinstance(ch, list) else []):
        w = "changes[%d]" % i
        if not isinstance(c, dict):
            out.append(w + " must be an object")
            continue
        need(isinstance(c.get("at"), str) and ISO.match(c.get("at") or ""), w + ".at must be an ISO time in UTC")
        text(c.get("text"), w + ".text")
    return out


# The headline's pair (Sam, 2026-10-08): COCI's active programs, the ones whose record passes the
# machine checks (complete), and the colleges they are at. The view counts the same live from its
# index; program_record_machine_pass is the server's own reading of the checks.
HEADLINE_SQL = """with act as (select college, control_number from coci_college_programs where status = 'Active'),
c as (select r.college from program_requirement_records r
      join act a on a.college = r.college and a.control_number = r.control_number
      where public.program_record_machine_pass(r.checks))
select (select count(*) from act) active, (select count(*) from c) complete,
  (select count(distinct college) from c) colleges;"""


# The whole harvest's counts, in one read (the Progress view's "The whole harvest" band). Programs
# and courses are COCI's active ones; a record counts when it is an active program's.
HARVEST_SQL = """with act as (select college, control_number from coci_college_programs where status = 'Active'),
rec as (select r.record, r.checks, r.display from program_requirement_records r
        join act a on a.college = r.college and a.control_number = r.control_number),
crs as (select distinct pc.college, pc.course_code from coci_program_courses pc
        join act a on a.college = pc.college and a.control_number = pc.program_control_number)
select (select count(*) from program_source_registry) colleges,
  (select count(*) from program_source_registry where catalog_url is not null) catalog_links,
  (select count(*) from program_source_registry where cor_access is not null) cms_links,
  (select count(*) from program_source_registry where sequence_source is not null and sequence_source <> 'unknown') ppm_links,
  (select count(*) from act) active_programs,
  (select count(*) from rec where display is not null) roep_programs,
  (select count(*) from rec where checks is not null) coci_compared,
  (select count(*) from rec where record->'program' ? 'outcomes') plo_read,
  (select count(*) from rec where record->'program' ? 'careers') careers_read,
  (select count(*) from crs) program_courses,
  (select count(*) from crs c where exists (select 1 from course_outcomes o
      where o.college = c.college and o.course_code = c.course_code)) slo_courses;"""
HARVEST_KEYS = ("colleges", "catalog_links", "cms_links", "ppm_links", "active_programs", "roep_programs",
                "coci_compared", "plo_read", "careers_read", "program_courses", "slo_courses")
WHOLE_PARTS = {"links": ("catalog", "cms", "ppm"), "roep": None, "coci": None,
               "outcomes": ("slo", "plo"), "careers": None}


def filed_gaps(root=ROOT):
    """Programs a read accounted for without a record: not found, a page another program
    claimed, or no course list in COCI, as each committed capture report files them."""
    import glob
    n = 0
    for p in glob.glob(os.path.join(root, "kb", "program_requirements_college", "*", "capture.json")):
        try:
            with open(p, encoding="utf-8") as f:
                c = json.load(f)
        except (OSError, ValueError):
            continue
        n += len(c.get("not_found") or []) + len(c.get("page_claimed") or [])
        n += int((c.get("by_method") or {}).get("no_closed_list") or 0)
    return n


def harvest_block(row, day, gaps):
    """The status file's harvest block from the query's row: each part a [have, of] pair."""
    r = {k: int(row[k]) for k in HARVEST_KEYS}
    act = r["active_programs"]
    return {
        "day": day,
        "gaps": gaps,
        "parts": {
            "links": {"catalog": [r["catalog_links"], r["colleges"]], "cms": [r["cms_links"], r["colleges"]],
                      "ppm": [r["ppm_links"], r["colleges"]]},
            "roep": [min(r["roep_programs"] + gaps, act), act],
            "coci": [r["coci_compared"], act],
            "outcomes": {"slo": [r["slo_courses"], r["program_courses"]], "plo": [r["plo_read"], act]},
            "careers": [r["careers_read"], act],
        },
    }


def harvest_faults(h):
    out = []
    if not isinstance(h, dict):
        return ["harvest must be an object"]
    if not (isinstance(h.get("day"), str) and DAY.match(h.get("day") or "")):
        out.append("harvest.day must be a date, YYYY-MM-DD")
    parts = h.get("parts")
    if not isinstance(parts, dict):
        return out + ["harvest.parts must be an object"]

    def pair(v, w):
        if not (isinstance(v, list) and len(v) == 2 and all(isinstance(n, int) and not isinstance(n, bool) and n >= 0 for n in v)):
            out.append(w + " must be a [have, of] pair of whole numbers")
        elif v[1] == 0 or v[0] > v[1]:
            out.append(w + " must have of > 0 and have <= of")

    for k, halves in WHOLE_PARTS.items():
        v = parts.get(k)
        if halves:
            if not isinstance(v, dict):
                out.append("harvest.parts." + k + " must hold " + ", ".join(halves))
                continue
            for hk in halves:
                pair(v.get(hk), "harvest.parts." + k + "." + hk)
        else:
            pair(v, "harvest.parts." + k)
    extra = set(parts) - set(WHOLE_PARTS)
    if extra:
        out.append("harvest.parts names parts the view does not draw: " + ", ".join(sorted(extra)))
    return out


def add_headline(hist, day, active, complete, colleges):
    """hist with day's entry set to the pair: replaced when the day is already there."""
    hist = [e for e in (hist if isinstance(hist, list) else []) if not (isinstance(e, dict) and e.get("day") == day)]
    hist.append({"day": day, "active": active, "complete": complete, "colleges": colleges})
    return sorted(hist, key=lambda e: str(e.get("day", "")))


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="validate the committed file")
    ap.add_argument("--stamp", action="store_true", help="set written_at to now, then validate")
    ap.add_argument("--next-run", help="the CPL Queue routine's next firing, ISO UTC (get_trigger's next_run_at)")
    ap.add_argument("--headline", nargs=3, type=int, metavar=("ACTIVE", "COMPLETE", "COLLEGES"),
                    help="today's pair: COCI's active programs, the complete ones, their colleges (--headline-sql)")
    ap.add_argument("--headline-sql", action="store_true", help="print the headline's query and exit")
    ap.add_argument("--harvest", metavar="ROW_JSON",
                    help="the whole-harvest query's row (--harvest-sql prints the query), as JSON")
    ap.add_argument("--harvest-sql", action="store_true", help="print the whole-harvest query and exit")
    ap.add_argument("--project", default=PROJECT, help="the project whose kb/status/<project>.json to read (default: Program Requirements')")
    ap.add_argument("--path", default=None, help="a file elsewhere (the tests); otherwise --project names it")
    a = ap.parse_args(argv)
    if a.path is None:
        a.path = path_for(a.project)
    if a.harvest_sql:
        print(HARVEST_SQL)
        return 0
    if a.headline_sql:
        print(HEADLINE_SQL)
        return 0
    with open(a.path, encoding="utf-8") as f:
        q = json.load(f)
    if a.stamp:
        q["written_at"] = now_iso()
        if a.next_run:
            nr = q.get("next_run") or {"name": "CPL Queue", "every_hours": 24}
            nr["at"] = re.sub(r"\.\d+Z$", "Z", a.next_run.replace("+00:00", "Z"))
            q["next_run"] = nr
        if a.headline:
            q["headline"] = add_headline(q.get("headline"), q["written_at"][:10], *a.headline)
    if a.harvest:
        # The harvest's own day; it never moves written_at, which names the last checkpoint.
        row = json.loads(a.harvest)
        if isinstance(row, list):
            row = row[0]
        q["harvest"] = harvest_block(row, now_iso()[:10], filed_gaps())
    if a.stamp or a.harvest:
        with open(a.path, "w", encoding="utf-8") as f:
            json.dump(q, f, indent=2, ensure_ascii=False)
            f.write("\n")
    bad = faults(q)
    for b in bad:
        print("queue_status: " + b)
    if not bad:
        print("queue_status: ok (written " + q["written_at"] + ", S" + str(q["session"]) + " " + q["moniker"] + ")")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
