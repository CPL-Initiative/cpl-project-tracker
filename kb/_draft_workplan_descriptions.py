#!/usr/bin/env python3
"""Draft a description for each Annual Workplan Goals sub-activity that has none.

Sam, 2026-10-19 (S426): "add a procedure that drafts a description to insert in the
Descriptions box on the annual goals. Just use the best info you can find on our
artifacts. If you don't have any information for a particular activity, take your
best guess and I'll edit it."

The same day the tab offered "Add description" on every row while 32 of the 34
sub-activities carried one in `projects.description`: the generator read the key
`description` where the loader's contract names it `desc` (fixed in
build_workplan_goals_from_supabase). Two rows had none, 4.7 and 4.8. This file is
the procedure for those and for every row that is empty later.

THE PROCEDURE (a session runs it; the writing is the session's, from the brief):

  1. python3 kb/_draft_workplan_descriptions.py --brief
       Lists every sub-activity whose stored description is empty, with the facts
       the repo holds for it: its Activity and that Activity's description, what it
       counts and how, its milestones, latest update and workplan notes, its lead
       and team, and the repo documents that name it (docs/, kb/, and the vault
       when it sits beside the tracker).
  2. Write each draft into kb/workplan_description_drafts.json in the house voice:
       one or two sentences, plain words, active voice, the sub-activity's own
       facts, a best guess marked best_guess: true so the reader knows to edit it.
         {"<id>": {"draft": "...", "sources": ["..."], "best_guess": false,
                   "drafted_by": "S<N> <moniker>", "drafted_at": "YYYY-MM-DD"}}
  3. python3 kb/_draft_workplan_descriptions.py --check
       The drafts name rows that exist and are still empty, run 40 to 600
       characters, and carry no business register (leverage, utilize, robust,
       deep dive, synergy, operationalize, impactful).
  4. python3 kb/_draft_workplan_descriptions.py --sql > kb/receipts/<file>.sql
       The guarded UPDATE for the runner: each statement writes only where the
       description is still null, so a description Sam typed in the meantime
       wins; the rollback is in the header. Point kb/migrations/.apply at the
       file and push: supabase-migrate.yml applies it (Rule 10: a session never
       UPDATEs a shared table itself).
  5. Sam edits on the tab after the next build. The JSON keeps the record of what
       was drafted and from what; a row he has since filled drops out of --brief.

Reads the committed snapshots (kb/projects_snapshot.json, the daily cron's copy of
public.projects; kb/workplan_goals_snapshot.json for the Activity descriptions),
never the live database.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROJECTS = os.path.join(HERE, "projects_snapshot.json")
GOALS = os.path.join(HERE, "workplan_goals_snapshot.json")
DRAFTS = os.path.join(HERE, "workplan_description_drafts.json")
VAULT = os.environ.get("CPL_VAULT_ROOT") or os.path.join(os.path.dirname(ROOT), "CPLBrain")

BUSINESS = ("leverage", "utilize", "robust", "deep dive", "synergy", "operationalize", "impactful")
MIN_LEN, MAX_LEN = 40, 600


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def projects():
    """The sub-activities (no D.* helper rows), by id, from the committed snapshot."""
    rows = _load(PROJECTS).get("rows") or []
    return {str(r["id"]): r for r in rows if r.get("id") and not str(r["id"]).startswith("D.")}


def activity_descriptions():
    """{activity number: description} from the kind='activity' ladder rows."""
    out = {}
    for r in _load(GOALS).get("rows") or []:
        if r.get("kind") == "activity" and r.get("description") and r.get("activity_id"):
            out.setdefault(str(r["activity_id"]), r["description"])
    return out


def empty(p):
    return not (p.get("description") or "").strip()


def documents_naming(name):
    """Repo documents (and the vault's, when it is beside the tracker) whose text
    names the sub-activity. A grep, so the brief points at reading, not at a guess."""
    hits = []
    roots = [os.path.join(ROOT, "docs"), os.path.join(ROOT, "kb")]
    if os.path.isdir(VAULT):
        roots += [os.path.join(VAULT, d) for d in ("04-projects", "05-knowledge", "03-professional")]
    for root in roots:
        if not os.path.isdir(root):
            continue
        try:
            out = subprocess.run(["grep", "-rli", "--include=*.md", "--", name, root],
                                 capture_output=True, text=True, timeout=60).stdout
        except (OSError, subprocess.SubprocessError):
            continue
        for line in out.splitlines():
            rel = os.path.relpath(line, os.path.dirname(ROOT))
            if "session_" in rel or "node_modules" in rel or "/docs_audit/" in rel:
                continue
            hits.append(rel)
    return sorted(set(hits))[:12]


def brief():
    acts = activity_descriptions()
    rows = projects()
    todo = [pid for pid in sorted(rows, key=_natural) if empty(rows[pid])]
    if not todo:
        print("Every sub-activity in the snapshot carries a description; nothing to draft.")
        return 0
    print(f"{len(todo)} sub-activit{'y' if len(todo) == 1 else 'ies'} with no description "
          f"(snapshot {_load(PROJECTS).get('_fetched_at', '?')}):\n")
    for pid in todo:
        p = rows[pid]
        home = str(pid).split(".")[0]
        print(f"== {pid} {p.get('name', '')}")
        print(f"   Activity {home}: {acts.get(home, '(no description on the Activity row)')}")
        for label, key in (("Home field", "workplan_activity"), ("Counts", "kpi_unit"),
                           ("How it is counted", "count_note"), ("Status", "status"),
                           ("Lead", "lead"), ("Team", "team"), ("Milestones", "milestones"),
                           ("Latest update", "latest_update"), ("Workplan notes", "wp_notes"),
                           ("Vision 2030 action", "vision_2030_action"), ("CPL goal", "cpl_goal")):
            v = (p.get(key) or "").strip() if isinstance(p.get(key), str) else p.get(key)
            if v:
                print(f"   {label}: {v}")
        docs = documents_naming(p.get("name") or pid)
        print("   Documents naming it: " + (", ".join(docs) if docs else "none found; a best guess, marked as one"))
        print()
    return 0


def _natural(pid):
    return [int(x) if x.isdigit() else x for x in str(pid).split(".")]


def check(drafts_path=DRAFTS, quiet=False):
    """Why the drafts may not go out, as a list of problems (empty when they may)."""
    problems = []
    if not os.path.exists(drafts_path):
        return [f"no drafts file at {drafts_path}"]
    drafts = _entries(_load(drafts_path))
    rows = projects()
    if not drafts:
        return ["the drafts file holds no drafts"]
    for pid, d in drafts.items():
        text = (d.get("draft") or "").strip() if isinstance(d, dict) else ""
        if pid not in rows:
            problems.append(f"{pid}: no such sub-activity in the snapshot")
            continue
        if not empty(rows[pid]):
            problems.append(f"{pid}: already carries a description in the snapshot; the draft is stale")
        if len(text) < MIN_LEN:
            problems.append(f"{pid}: the draft is shorter than {MIN_LEN} characters")
        if len(text) > MAX_LEN:
            problems.append(f"{pid}: the draft runs past {MAX_LEN} characters ({len(text)})")
        low = text.lower()
        for w in BUSINESS:
            if re.search(r"\b" + re.escape(w) + r"\w*", low):
                problems.append(f"{pid}: business register ({w})")
        if not isinstance(d, dict) or not d.get("sources"):
            problems.append(f"{pid}: names no sources")
        if isinstance(d, dict) and "best_guess" not in d:
            problems.append(f"{pid}: says neither best_guess true nor false")
        if isinstance(d, dict) and not d.get("drafted_by"):
            problems.append(f"{pid}: names no drafter")
    if not quiet:
        for pr in problems:
            print("FAIL  " + pr)
        if not problems:
            print(f"ok — {len(drafts)} draft(s) for rows the snapshot shows empty: " + ", ".join(sorted(drafts, key=_natural)))
    return problems


def _entries(obj):
    """The drafts by id; a key starting with _ (the file's own note) is not one."""
    if not isinstance(obj, dict):
        return {}
    return {k: v for k, v in obj.items() if not str(k).startswith("_")}


def _dollar(text):
    tag = "d"
    while f"${tag}$" in text:
        tag += "d"
    return f"${tag}${text}${tag}$"


def sql(drafts_path=DRAFTS, session="S?"):
    """The guarded UPDATE file for the runner, with its rollback in the header."""
    drafts = _entries(_load(drafts_path))
    ids = sorted(drafts, key=_natural)
    out = []
    out.append("-- Annual Workplan Goals: descriptions drafted for the sub-activities that had none.")
    out.append("-- Procedure: kb/_draft_workplan_descriptions.py; the drafts and their sources:")
    out.append("-- kb/workplan_description_drafts.json. Sam, 2026-10-19: \"take your best guess and I'll edit it\".")
    out.append("-- Each UPDATE writes only where the description is still null, so a description typed")
    out.append("-- on the tab in the meantime wins. Sam edits the result on the Annual Workplan Goals tab.")
    out.append("--")
    out.append("-- ROLLBACK (each line clears only the draft this file wrote):")
    for pid in ids:
        out.append(f"--   update public.projects set description = null where id = '{pid}' and description = {_dollar(drafts[pid]['draft'].strip())};")
    out.append("")
    for pid in ids:
        d = drafts[pid]
        out.append(f"-- {pid}: " + ("a best guess, marked for editing" if d.get("best_guess") else "from the artifacts named in the drafts file")
                   + f" (drafted by {d.get('drafted_by', session)}, {d.get('drafted_at', '')}).")
        out.append("update public.projects")
        out.append(f"   set description = {_dollar(d['draft'].strip())},")
        out.append("       updated_at = now()")
        out.append(f" where id = '{pid}'")
        out.append("   and description is null;")
        out.append("")
    out.append("-- Read back: expect every id below with its draft.")
    out.append("select id, left(description, 80) as description from public.projects where id in ("
               + ", ".join(f"'{pid}'" for pid in ids) + ") order by id;")
    return "\n".join(out) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--brief", action="store_true", help="the facts for each sub-activity with no description")
    ap.add_argument("--check", action="store_true", help="validate kb/workplan_description_drafts.json")
    ap.add_argument("--sql", action="store_true", help="print the guarded UPDATE file for the runner")
    ap.add_argument("--drafts", default=DRAFTS, help="another drafts file (tests)")
    a = ap.parse_args(argv)
    if a.brief:
        return brief()
    if a.check:
        return 1 if check(a.drafts) else 0
    if a.sql:
        problems = check(a.drafts, quiet=True)
        if problems:
            for pr in problems:
                print("FAIL  " + pr, file=sys.stderr)
            return 1
        sys.stdout.write(sql(a.drafts))
        return 0
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
