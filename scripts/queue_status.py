#!/usr/bin/env python3
"""queue_status.py — stamp and check kb/queue_status.json, the Progress view's status file.

The Program Requirements tab's Progress view (program_requirements.js, Sam's 2026-10-07
ask: "a workflow dashboard to monitor the progress") reads the harvest's tables live. Two
things no browser read can know come from this file instead, written at every checkpoint
(.claude/commands/checkpoint.md, step 12):

  - the records waiting on a person's check: anon reads checked records only
    (policy program_requirement_records_read), so the view cannot count them; and
  - the run: the session that last worked the queue and its handoff, the CPL Queue
    routine's next firing, the next step, the calls waiting on Sam, and what changed
    (program_source_registry_history has no anon grant).

It also keeps the headline's history (Sam, 2026-10-08: COCI's active programs beside the
checked ones, "so she can get the BIG vision and progress"): one entry per day in
`headline`, so the pair has a trend. The view reads the pair live; the list is the record.

Never widen a policy to fill the view; this file is the chosen alternative (S343, the
handoff's option b).

Usage, from the repo root:
  python3 scripts/queue_status.py --check
      validate the committed file; exit 1 and name each fault
  python3 scripts/queue_status.py --stamp [--next-run 2026-10-08T15:07:00Z]
                                          [--headline ACTIVE CHECKED COLLEGES]
      set written_at to now (UTC) and, if given, the routine's next firing (read it with
      get_trigger on the CPL Queue routine) and today's headline entry (read the three
      counts with the SQL in .claude/commands/checkpoint.md step 12; a second stamp the
      same day replaces that day's entry), then validate

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
PATH = os.path.join(ROOT, "kb", "queue_status.json")
TAB = os.path.join(ROOT, "program_requirements.js")

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
    need(isinstance(un, list), "unchecked must be a list (empty when every record read is checked)")
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
        v = c.get("view")
        if v is not None:
            need(isinstance(v, dict) and isinstance(v.get("href"), str)
                 and (v["href"].startswith("https://") or re.match(r"^#[A-Za-z0-9_.~-]+$", v["href"])),
                 w + ".view.href must be an https address or a COBI tab's bare hash (#cpl-pathways)")
            text((v or {}).get("text") if isinstance(v, dict) else None, w + ".view.text")
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
        for k in ("active", "checked", "colleges"):
            need(isinstance(e.get(k), int) and not isinstance(e.get(k), bool) and e.get(k) >= 0,
                 w + "." + k + " must be a whole number")
        if isinstance(e.get("active"), int) and isinstance(e.get("checked"), int):
            need(e["checked"] <= e["active"], w + ".checked cannot exceed active")
        if isinstance(d, str):
            need(d > prev, w + ".day must come after the entry before it (one entry per day, oldest first)")
            prev = d
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


def add_headline(hist, day, active, checked, colleges):
    """hist with day's entry set to the pair: replaced when the day is already there."""
    hist = [e for e in (hist if isinstance(hist, list) else []) if not (isinstance(e, dict) and e.get("day") == day)]
    hist.append({"day": day, "active": active, "checked": checked, "colleges": colleges})
    return sorted(hist, key=lambda e: str(e.get("day", "")))


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="validate the committed file")
    ap.add_argument("--stamp", action="store_true", help="set written_at to now, then validate")
    ap.add_argument("--next-run", help="the CPL Queue routine's next firing, ISO UTC (get_trigger's next_run_at)")
    ap.add_argument("--headline", nargs=3, type=int, metavar=("ACTIVE", "CHECKED", "COLLEGES"),
                    help="today's pair: COCI's active programs, the checked records, their colleges")
    ap.add_argument("--path", default=PATH)
    a = ap.parse_args(argv)
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
