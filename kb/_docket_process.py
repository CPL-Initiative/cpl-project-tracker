#!/usr/bin/env python3
"""_docket_process.py — carry out the Docket's rulings without a session (#2963 step 3).

Sam's go in session (2026-11-09: "yes, start step 3"), on the order Sky set out on #2963: a scheduled job reads new
rulings and runs the procedure each case names; a reviewer can run the same job at once from the Commons ("Process my
rulings now", through the docket-process Edge Function). Each run writes a receipt and its undo, and marks the case
done.

What it will run, and what it never will:
  - Only the commands a case's `plans` names for the choice ruled, from kb/docket/cases.json as committed on main
    (a reviewed file); never text from the ruling itself, which carries only the choice and a reason.
  - Only a script on ALLOWED, each of whose writes is a committed file with an undo, and only with `--apply` beside
    `--expect N`, so the script refuses unless today's count is the count the case was ruled on.
  - A choice whose plan is words alone (a session's judgment) is reported for a session and left open.
  - Nothing on the hold list: a case is a Commons curation decision. Funding, outward, deletion and identity calls stay
    on the sheets and with a session (CLAUDE.md, decision sheets' one hold list).

  python3 kb/_docket_process.py                     dry run: what each ruling would run (needs the rulings; see below)
  python3 kb/_docket_process.py --apply             run them, write receipts, mark cases done, rebuild the Commons status
  python3 kb/_docket_process.py --rows rows.json    rulings from a file (a session reads them through the Supabase MCP)

Rulings come from kb/_docket_rulings.py (the REST API with SUPABASE_SERVICE_KEY in the workflow). The job exits 1 when a
command fails, so the workflow failure watch raises it; work already applied stays, with its receipt, and the case reads
`partial`.
"""
import argparse
import datetime as dt
import json
import os
import re
import shlex
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _docket_rulings as D  # noqa: E402

CASES = D.CASES
RECEIPTS = "kb/docket/receipts"
# Each allowed script, and the undo for a receipt it writes. A script joins only when every write it makes is a
# committed file it can restore from its own receipt.
ALLOWED = {
    "kb/_ccr_seed_confirm_apply.py": {"receipts": "kb/ccr_seed_confirm_out/",
                                      "undo": "python3 kb/_ccr_seed_confirm_apply.py --undo {receipt}"},
}
CALL_LOGS = ["program-requirements", "exhibit", "course", "cr", "subjects"]  # as kb/_build_commons_status.py reads them
SAFE_ARG = re.compile(r"^[A-Za-z0-9 _./:,()&'+=-]*$")


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def vet(cmd):
    """The argv a plan command may run, or the reason it may not."""
    try:
        argv = shlex.split(cmd)
    except ValueError as e:
        return None, "it does not parse (%s)" % e
    if len(argv) < 2 or argv[0] not in ("python3", "python"):
        return None, "it is not a python3 script"
    if argv[1] not in ALLOWED:
        return None, "%s is not on the processor's list" % argv[1]
    if "--apply" not in argv:
        return None, "it carries no --apply"
    if "--expect" not in argv or argv.index("--expect") + 1 >= len(argv) or not argv[argv.index("--expect") + 1].isdigit():
        return None, "it carries no --expect count"
    if any(not SAFE_ARG.match(a) for a in argv):
        return None, "an argument carries a character the processor does not pass"
    return [sys.executable] + argv[1:], None


def changed(root):
    out = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"], cwd=root, capture_output=True,
                         text=True, check=False).stdout
    return {line[3:].strip() for line in out.splitlines() if line.strip()}


def plan_for(item):
    """Every command vetted, or the reason the ruling cannot run here."""
    if not item["plan"]:
        return None, "the choice's plan is words for a session: " + (item.get("plan_words") or "none given")
    argvs = []
    for cmd in item["plan"]:
        argv, why = vet(cmd)
        if why:
            return None, "%r: %s" % (cmd, why)
        argvs.append((cmd, argv))
    return argvs, None


def carry_out(root, item, run_id):
    """Run one ruling's commands in order; a failure stops the rest. Returns the receipt."""
    argvs, why = plan_for(item)
    rec = {"case": item["case"], "choice": item["choice"], "ruled_at": item.get("at"), "dr": item.get("dr"),
           "ruling_key": D.PREFIX + item["case"], "run": run_id, "started": now_iso(), "steps": [], "undo": []}
    if why:
        rec.update(outcome="needs_session", why=why)
        return rec
    for cmd, argv in argvs:
        before = changed(root)
        p = subprocess.run(argv, cwd=root, capture_output=True, text=True, timeout=1800, check=False)
        new = sorted(changed(root) - before)
        script = ALLOWED[argv[1]]
        receipts = [f for f in new if f.startswith(script["receipts"]) and f.endswith(".json")]
        rec["steps"].append({"cmd": cmd, "exit": p.returncode, "out": (p.stdout or "")[-1500:],
                             "err": (p.stderr or "")[-1500:], "wrote": new, "receipts": receipts})
        rec["undo"] = [script["undo"].format(receipt=r) for r in receipts] + rec["undo"]
        if p.returncode != 0:
            rec.update(outcome="partial" if len(rec["steps"]) > 1 else "failed", why="%r exited %d" % (cmd, p.returncode))
            return rec
    rec.update(outcome="done")
    return rec


def mark(root, receipts_by_case):
    """Each case carried out (or partly) gets its status and its `done` record; a run-log call on the same sheet is
    answered with the ruling, so the Commons band stops waiting on it."""
    path = os.path.join(root, CASES)
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    sheets = {}
    for c in doc.get("cases") or []:
        rec = receipts_by_case.get(c.get("id"))
        if not rec or rec["outcome"] not in ("done", "partial"):
            continue
        c["status"] = rec["outcome"]
        c["done"] = {"choice": rec["choice"], "by": "a reviewer, ruling %s (%s)" % (rec["ruling_key"], str(rec.get("ruled_at") or "")[:10]),
                     "at": rec["finished"], "receipt": rec["path"], "run": rec.get("run")}
        if rec["outcome"] == "done" and c.get("sheet"):
            words = next((ch.get("words") for ch in c.get("choices") or [] if ch.get("value") == rec["choice"]), rec["choice"])
            sheets[c["sheet"]] = {"by": "the Docket", "at": rec["finished"][:10], "words": "%s (ruled in the Commons)" % words}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    for name in CALL_LOGS:
        p = os.path.join(root, "kb", "status", name + ".json")
        if not os.path.exists(p) or not sheets:
            continue
        with open(p, encoding="utf-8") as f:
            log = json.load(f)
        hit = False
        for call in log.get("calls") or []:
            if call.get("link") in sheets and not (call.get("answer") or {}).get("words"):
                call["answer"] = sheets[call["link"]]
                hit = True
        if hit:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(log, f, indent=2, ensure_ascii=False)
                f.write("\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".")
    ap.add_argument("--rows", help="a JSON file of kb_curation rows (kb/_docket_rulings.py --sql)")
    ap.add_argument("--apply", action="store_true", help="run the commands; without it, report what would run")
    ap.add_argument("--no-rebuild", action="store_true", help="skip the Commons status rebuild (tests)")
    a = ap.parse_args(argv)
    root = a.root
    cases = D.load_cases(root)
    if a.rows:
        with open(a.rows, encoding="utf-8") as f:
            rows = json.load(f)
    else:
        rows = D.fetch_rows()
    found = D.read(cases, rows)
    for r in found["refused"]:
        print("REFUSED %s: %s (%s)" % (r["case"], r.get("choice"), r["why"]))
    if not found["act"]:
        print("No open case carries a ruling.")
        return 0
    if not a.apply:
        for it in found["act"]:
            argvs, why = plan_for(it)
            print("WOULD %s: %s" % (it["case"], it["choice"]))
            if why:
                print("  held: %s" % why)
            for cmd, _ in argvs or []:
                print("  run:  %s" % cmd)
        return 0
    run_id = os.environ.get("GITHUB_RUN_ID") or "local"
    day = dt.date.today().isoformat()
    os.makedirs(os.path.join(root, RECEIPTS), exist_ok=True)
    by_case, bad = {}, False
    for it in found["act"]:
        rec = carry_out(root, it, run_id)
        rec["finished"] = now_iso()
        rel = "%s/%s-%s.json" % (RECEIPTS, day, it["case"])
        rec["path"] = rel
        with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
            json.dump(rec, f, indent=1, ensure_ascii=False)
            f.write("\n")
        by_case[it["case"]] = rec
        print("%s %s: %s%s" % (rec["outcome"].upper(), it["case"], it["choice"], (" (%s)" % rec["why"]) if rec.get("why") else ""))
        bad = bad or rec["outcome"] in ("failed", "partial")
    mark(root, by_case)
    if not a.no_rebuild:
        subprocess.run([sys.executable, "kb/_build_commons_status.py", "--quiet"], cwd=root, check=False)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
