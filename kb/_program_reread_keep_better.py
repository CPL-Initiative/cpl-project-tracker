#!/usr/bin/env python3
"""Keep the better record after a paid re-read, before step=reread posts it (S683, d-reread-keep-the-better-s683).

WHY. The reader's page checks (rules A to D, #3514) hand a new page to programs whose filed record places none of its
courses, and at Mendocino and City College of San Francisco the capture also handed other programs a window naming a
larger share of their closed list. A paid read of such a program can come back worse than the record on file
(p-capture-can-lose-passing-page-s671), and step=reread replaces the live row with what an extraction run filed. The
extraction's own guard (kept_passing) keeps a filed record that passes where the read passes less or covers less; it
never compares two records that fail, nor a placed record against one that places none, nor asks whose page it read.

WHAT. After extract=1 has filed a college, this script compares each record whose extracted_run is the filing's run
with the same file at origin/main and keeps the better one.

  The re-read must hold its own program: its section_heading shares a word (the pilot's title_tokens) with the
  program's title, and the scorer's heading_award_check passes. A blank heading names no program. A CourseLeaf
  program page heads its list REQUIREMENTS, Course List, Major Requirements or Requirements, words the scorer's
  heading_content_words reads as naming no program; such a generic heading passes the first test only where the
  committed files show the page is the program's own (page_is_own): the last segment of the record's source_url, or
  the capture's sources.json entry for that page (heading_named, the page title, the h1), names every title word and
  no other award. S684 set aside Ventura's 4 and Evergreen Valley's 13 good re-reads on the word test alone. A
  heading carrying another program's words still fails, whatever the address. A re-read that fails is set aside
  whatever its score: the filed record is restored, or, with no filed record, the new record moves to
  <folder>/held_for_person/ (out of records/, so no load or reread posts it) and is listed there.

  The order of "better", first difference decides:
    1. score.pass true;
    2. passes_live (coverage and invented pass, arithmetic equal: the live row's test);
    3. score.coverage.pass true;
    4. score.coverage.none_placed false (places_none() where the key is missing);
    5. the higher score.coverage.share (a share either record lacks is no evidence, and the step is skipped);
    6. the arithmetic: equal, unstated that passes, unequal, unstated that does not pass, incomplete, anything else.
  A record with no score (an extraction error) loses every step. A tie keeps the re-read: it is the current catalog
  text. A program with no filed record keeps its new record.

  The order of the holds and tests, first that applies decides (COBIx on #3544 and #3547, S684 and S685):
    1. a program whose live row a person checked is never replaced. With a filed record it is restored; with no
       filed record at the base the new record moves to <folder>/held_for_person/ (outcome held), and no dispatch
       names it. The check is read first, whatever the base files.
    2. own program, both tests above. Where the live row already holds this run, a failing re-read is a wrong
       record live: it is held for a person (main's file restored, if any) and the why names the live run.
    3. when the conductor's live read supplies live_runs, a live row holding this run is already posted (a second
       pass after the reread posted): the record stays on the branch, the outcome is posted, and no dispatch adds
       the run again for it. Before S685 such a pass held the row and wrote main's file back, so the branch
       disagreed with the live row.
    4. a live row holding a run other than the filed record's (or any run at all where the base files none) is
       held for a person: the re-read moves to held_for_person/, the filed record (if any) is restored, and the
       why names both runs. A wave loads from its branch before it merges, so the live row can come from a run main
       lacks, and "better" judged against main would judge the wrong record.
    5. no filed record keeps the new one; otherwise the order of "better" below.
  A control number live_runs omits has no live row to protect. Without live_runs the script runs as before and the
  account says live_runs: "not supplied". A control number in either list is a string of five ASCII digits and a
  run is ASCII digits; anything else stops the run.

THE SCORES COMPARED. compare() reads each file's stored score: the re-read's was written by this run's scorer, the
filed record's at its own extraction, possibly under an older scorer (the units rules, the printed floor). A fresh
score of the filed side needs the program's closed course list (coci_program_courses, read live at capture) and the
page text the record was read from (sources.json keeps only text_chars). Neither is committed, so this script cannot
re-score the filed record offline and compares the stored scores as filed (COBIx on #3544, finding 3, measured S684).
The rescore passes (_program_requirements_rescore.py, _program_requirements_floor_rescore.py) bring a filed record's
arithmetic up to a later rule where they can. A decision that turns on the arithmetic or the share between records
scored under different rules is the one this limit can misjudge; the account's `why` names the step that decided.

A worse re-read is replaced by main's file byte for byte, so its extracted_run is main's. step=reread posts one
extraction run's records; with no run named it takes the highest run in the folder, which is main's once every
record of the new run is restored. So the account names the dispatch with the run pinned (input `force`, which the
workflow passes as EXTRACTED_RUN), one per run whose kept or new records no reread receipt has posted, or "no
dispatch". A second extraction on the same branch is carried: the account keeps every earlier run's decisions,
and that run's kept records still in the folder keep their own dispatch.

THE HOLD. No hold stops a paid read on the ground that a re-read came back worse: the reconcile file's `hold` keys
guard reconcile steps only, and the reader's held() lists (held_no_gain, held_worse_window, held_opens_on_list)
hold a passing filed record only where the new window names no larger share than the one it was read from. The
account marks each restored program with what held() says at the next read of this capture (`next_read_held`), and
lists the rest as `next_read_pays`.

--checked is required: the conductor's live read of checked rows, {"by_college": {"<college>": ["<control number>",
...]}, "live_runs": {"<college>": {"<control number>": "<extracted_run>"}}}; a college absent from by_college has
no checked rows, and one absent from a supplied live_runs has no live rows. live_runs is optional. It writes <folder>/reread_keep_better.json, prints one line a
program, writes nothing to Supabase and calls no model.

Run from the repo root, after extract=1 filed the college on its branch:
  python3 kb/_program_reread_keep_better.py kb/program_requirements_college/<slug> --checked <file>
      [--base origin/main] [--run <extraction run>] [--dry-run]
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

ACCOUNT = "reread_keep_better.json"
HELD_DIR = "held_for_person"
WORKFLOW = "program-requirements-college.yml"
RUN_INPUT = "force"   # the workflow's input that pins step=reread to one extraction run (EXTRACTED_RUN)
ARITH_ORDER = ("equal", "unstated_pass", "unequal", "unstated_fail", "incomplete")


def none_placed(score: dict | None) -> bool | None:
    cov = (score or {}).get("coverage") or {}
    if "none_placed" in cov:
        return bool(cov["none_placed"])
    if not score:
        return None
    from _program_requirements_score import places_none
    return places_none(score)


def passes_live(score: dict | None) -> bool:
    from _program_requirements_score import passes_live as pl
    return bool(score) and pl(score)


def arith_key(score: dict | None) -> str | None:
    a = (score or {}).get("arithmetic") or {}
    status = a.get("status")
    if status == "unstated":
        return "unstated_pass" if a.get("pass") is True else "unstated_fail"
    return status


def arith_rank(score: dict | None) -> int:
    k = arith_key(score)
    return ARITH_ORDER.index(k) if k in ARITH_ORDER else len(ARITH_ORDER)


def share(score: dict | None):
    v = ((score or {}).get("coverage") or {}).get("share")
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


STEPS = (
    ("score.pass", lambda s: (s or {}).get("pass") is True),
    ("passes_live", passes_live),
    ("score.coverage.pass", lambda s: ((s or {}).get("coverage") or {}).get("pass") is True),
    ("coverage.none_placed false", lambda s: none_placed(s) is False),
)


def compare(filed: dict | None, reread: dict | None) -> tuple[str, str]:
    """("filed" or "reread", why) for two scores, by the order in the module's docstring; a tie takes the re-read."""
    f, r = filed or None, reread or None
    for name, good in STEPS:
        a, b = good(f), good(r)
        if a != b:
            return ("filed", "the filed record holds %s and the re-read does not" % name) if a else \
                   ("reread", "the re-read holds %s and the filed record does not" % name)
    a, b = share(f), share(r)
    if a is not None and b is not None and a != b:
        return ("filed", "the filed record covers more (share %s against %s)" % (a, b)) if a > b else \
               ("reread", "the re-read covers more (share %s against %s)" % (b, a))
    a, b = arith_rank(f), arith_rank(r)
    if a != b:
        fs, rs = arith_key(f), arith_key(r)
        return ("filed", "the filed arithmetic reads %s, the re-read's %s" % (fs, rs)) if a < b else \
               ("reread", "the re-read's arithmetic reads %s, the filed record's %s" % (rs, fs))
    return "reread", "equal on every step: the re-read is the current catalog text"


def _page(url: str | None) -> str:
    """An address as one page: no fragment (a PDF's #page=), no trailing slash, scheme and host in lower case. The
    query stays: p.php?id=9 and p.php?id=12 are two programs' pages."""
    import urllib.parse
    p = urllib.parse.urlsplit((url or "").strip())
    return urllib.parse.urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path.rstrip("/"), p.query, ""))


def page_is_own(rec: dict, source: dict | None = None) -> str | None:
    """What the committed files show of the page the re-read was read from being the program's own, or None.
    A text shows it when it names every word of the program's title (the pilot's title_tokens) and the scorer's
    heading_award_check, read over that text, finds no other award. The texts, in order:
      * the last segment of the record's source_url, where the reader's slug_awards names no award or the program's
        (a CourseLeaf program address: .../criminal-justice/administration-justice-ast/);
      * the capture's entry for the control number in sources.json, when its source.url is the record's page: the
        reader's heading_named (a PDF window whose heading names the program), its page title less the site's name,
        then its h1.
    A directory never counts: .../administration-justice/community-service-officer-certificate-achievement/ names
    Administration of Justice in its directory and is another program's page."""
    import urllib.parse
    import _program_requirements_college as C
    from _program_requirements_pilot import award_kind, title_tokens
    from _program_requirements_score import heading_award_check
    title = rec.get("title") or ""
    want = set(title_tokens(title))
    if not want:
        return None

    def names(text: str) -> bool:
        if not want <= set(title_tokens(text)):
            return False
        chk = heading_award_check({"program": {"section_heading": text}}, rec.get("award"),
                                  rec.get("control_number"), title)
        return bool(chk.get("pass"))

    url = rec.get("source_url") or ""
    slug = urllib.parse.unquote(urllib.parse.urlsplit(url).path).rstrip("/").rsplit("/", 1)[-1]
    awards = C.slug_awards(url)
    if slug and names(re.sub(r"[-_]+", " ", slug)) and (not awards or award_kind(rec.get("award")) in awards):
        return "the address's last segment %r names the program" % slug[:80]
    src = (source or {}).get("source") if isinstance((source or {}).get("source"), dict) else {}
    if not src or not url or _page(src.get("url")) != _page(url):
        return None
    if src.get("heading_named") is True:
        return "the capture's window heading names the program (sources.json heading_named)"
    for key, label in (("title", "page title"), ("h1", "h1")):
        text = C.TITLE_SPLIT.split((src.get(key) or "").strip())[0]
        if text and names(text):
            return "the capture's %s %r names the program" % (label, text[:80])
    return None


def own_program_why(rec: dict, source: dict | None = None) -> tuple[str | None, str | None]:
    """(why the re-read does not hold its own program or None, the page evidence that let a generic heading pass or
    None). The heading must share a word with the title (the pilot's title_tokens). A heading that shares none and
    carries no word that could name a program (the scorer's heading_content_words: "REQUIREMENTS", "Course List",
    "Major Requirements") is generic: it passes only where page_is_own shows the page is the program's own (S685).
    A heading that carries another program's words still fails, whatever the address. Then the scorer's
    heading_award_check. A blank heading names no program and fails. source: the capture's sources.json entry."""
    from _program_requirements_pilot import title_tokens
    from _program_requirements_score import heading_award_check, heading_content_words
    record = rec.get("record") if isinstance(rec.get("record"), dict) else None
    heading = (((record or {}).get("program") or {}).get("section_heading") or "").strip()
    if not heading:
        return "the re-read prints no heading, so nothing shows it read its own program", None
    want = set(title_tokens(rec.get("title") or ""))
    evidence = None
    if want and not want & set(title_tokens(heading)):
        if heading_content_words(heading):
            return ("the re-read's heading %r shares no word with the title %r" % (heading[:80], rec.get("title")),
                    None)
        evidence = page_is_own(rec, source)
        if not evidence:
            return ("the re-read's heading %r is generic (it names no program), and nothing in the committed files "
                    "shows its page %s is the program's own" % (heading[:80], (rec.get("source_url") or "")[:120]),
                    None)
    chk = heading_award_check(record, rec.get("award"), rec.get("control_number"), rec.get("title"))
    if not chk.get("pass"):
        return "heading_award_check: %s" % "; ".join(chk.get("why") or [chk.get("status") or "fails"]), None
    return None, evidence


def own_program(rec: dict, source: dict | None = None) -> str | None:
    """Why the re-read does not hold its own program, or None when it does (own_program_why)."""
    return own_program_why(rec, source)[0]


def brief(score: dict | None) -> dict:
    s = score or {}
    cov = s.get("coverage") or {}
    return {"pass": s.get("pass"), "passes_live": passes_live(score), "coverage_pass": cov.get("pass"),
            "none_placed": none_placed(score), "share": share(score), "placed": cov.get("placed"),
            "listed": cov.get("listed"), "arithmetic": arith_key(score)}


def git(cwd: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True)


def base_bytes(root: str, base: str, rel: str) -> bytes | None:
    got = git(root, "show", "%s:%s" % (base, rel))
    return got.stdout if got.returncode == 0 else None


# Every committed record's control number is five ASCII digits (18,980 on main, S684). A number, or a string that
# lost its leading zero, would compare equal to nothing and skip the guard, so either stops the run.
CONTROL_NUMBER = re.compile(r"[0-9]{5}")
RUN = re.compile(r"[0-9]+")   # ASCII only: str.isdigit passes other scripts' digits


def control_number(x, where: str) -> str:
    if not (isinstance(x, str) and CONTROL_NUMBER.fullmatch(x)):
        raise SystemExit("%s: %r is not a control number: a control number is a string of five digits and keeps its "
                         "leading zeros (\"05839\", never 5839 or \"5839\")" % (where, x))
    return x


def is_run(v) -> bool:
    return isinstance(v, (str, int)) and not isinstance(v, bool) and bool(RUN.fullmatch(str(v)))


def read_checked(path: str | None, college: str | None) -> set[str]:
    """The control numbers of `college` whose live row a person checked, from the conductor's live read:
    {"by_college": {"<college>": ["<control number>", ...]}}. A college the file does not name has none.
    Anything else stops the run: a checked list read wrong lets a re-read replace a person's reading."""
    if not path:
        raise SystemExit("--checked is required: the live read of checked rows (by_college). Never run without it.")
    with open(path) as fh:
        got = json.load(fh)
    by = got.get("by_college") if isinstance(got, dict) else None
    if not isinstance(by, dict):
        raise SystemExit("%s has no by_college object: refusing to guess the checked rows" % path)
    if not college:
        raise SystemExit("the folder's records name no college, so its checked rows cannot be read")
    rows = by.get(college, [])
    if not isinstance(rows, list):
        raise SystemExit("by_college[%r] is not a list of control numbers" % college)
    return {control_number(x, "by_college[%r]" % college) for x in rows}


def read_live_runs(path: str | None, college: str | None) -> dict | None:
    """The live row's extracted_run for each control number of `college`, from the conductor's live read's optional
    "live_runs" key: {"live_runs": {"<college>": {"<control number>": "<run>"}}}. None when the key is absent (the
    script then compares as before); {} when it is supplied without the college (no live rows there). Malformed
    stops the run."""
    if not path:
        return None
    with open(path) as fh:
        got = json.load(fh)
    if not isinstance(got, dict) or "live_runs" not in got:
        return None
    lr = got["live_runs"]
    if not isinstance(lr, dict):
        raise SystemExit("%s: live_runs is not an object of colleges" % path)
    if not college:
        raise SystemExit("the folder's records name no college, so its live runs cannot be read")
    rows = lr.get(college, {})
    if not isinstance(rows, dict):
        raise SystemExit("live_runs[%r] is not an object of control number to extraction run" % college)
    for k, v in rows.items():
        control_number(k, "live_runs[%r]" % college)
        if not is_run(v):
            raise SystemExit("live_runs[%r][%r]: %r is not an extraction run (ASCII digits)" % (college, k, v))
    return {k: str(v) for k, v in rows.items()}


def read_sources(folder: str) -> dict:
    """The capture's sources.json entries by control number ({} when the folder has none or it does not parse:
    a generic heading then has only its address to show the page is the program's own)."""
    try:
        with open(os.path.join(folder, "sources.json")) as fh:
            got = json.load(fh)
    except (OSError, ValueError):
        return {}
    return {str(x["control_number"]): x for x in got if isinstance(x, dict) and x.get("control_number")} \
        if isinstance(got, list) else {}


def next_read_held(folder: str, cn: str) -> dict | None:
    """What the reader's held() says of the restored record at the next read of this capture (sources.json's entry)."""
    import _program_requirements_college as C
    try:
        with open(os.path.join(folder, "sources.json")) as fh:
            entry = {x["control_number"]: x for x in json.load(fh)}.get(cn)
    except (OSError, ValueError):
        entry = None
    if not entry:
        return None
    return C.held(os.path.join(folder, "records", cn + ".json"), entry, entry)


def posted_runs(root: str, college: str, slug: str) -> set[str]:
    """The extraction runs a reread receipt on this branch posted for the college without an error."""
    out = set()
    for path in glob.glob(os.path.join(root, "kb", "receipts", "program_requirement_records_college_reread_%s_*.json"
                                       % slug)):
        try:
            with open(path) as fh:
                r = json.load(fh)
        except (OSError, ValueError):
            continue
        if r.get("college") == college and r.get("extracted_run") and not r.get("error"):
            out.add(str(r["extracted_run"]))
    return out


def folder_college(folder: str) -> str | None:
    for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(path) as fh:
            c = json.load(fh).get("college")
        if c:
            return c
    return None


def keep_better(folder: str, base: str = "origin/main", run: str | None = None, checked: set[str] | None = None,
                dry_run: bool = False, out=print, live_runs: dict | None = None) -> dict:
    """live_runs: the folder's college's {control number: live extracted_run} (read_live_runs), or None."""
    if checked is None:
        raise SystemExit("the checked rows are required (--checked): never run without them")
    folder = os.path.abspath(folder)
    top = git(folder, "rev-parse", "--show-toplevel")
    if top.returncode != 0:
        raise SystemExit("%s is not inside a git checkout" % folder)
    root = top.stdout.decode().strip()
    base_sha = git(root, "rev-parse", base).stdout.decode().strip() or None
    if not base_sha:
        raise SystemExit("base %s does not resolve; fetch it by name first (git fetch --depth 30 origin main)" % base)
    if run is None:
        with open(os.path.join(folder, "capture.json")) as fh:
            run = str(json.load(fh).get("run") or "")
    run = str(run)
    if not RUN.fullmatch(run):
        raise SystemExit("no extraction run: capture.json names none and --run was not given (%r is not ASCII digits)"
                         % run)
    acct_path = os.path.join(folder, ACCOUNT)
    runs: dict = {}
    if os.path.isfile(acct_path):
        with open(acct_path) as fh:
            runs = json.load(fh).get("runs") or {}
    earlier = {e["control_number"]: e for e in (runs.get(run) or {}).get("programs") or []}
    sources = read_sources(folder)
    rows, college = [], None
    for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(path, "rb") as fh:
            raw = fh.read()
        rec = json.loads(raw)
        college = college or rec.get("college")
        cn = rec.get("control_number") or os.path.basename(path)[:-5]
        if str(rec.get("extracted_run")) != run:
            if cn in earlier:   # restored by an earlier pass over this run: it stays listed as it was decided
                rows.append(earlier.pop(cn))
            continue
        rel = os.path.relpath(path, root)
        filed_raw = base_bytes(root, base, rel)
        filed = json.loads(filed_raw) if filed_raw is not None else None
        new_score, filed_score = rec.get("score"), (filed or {}).get("score")
        row = {"control_number": cn, "title": rec.get("title"), "award": rec.get("award"),
               "source_url": rec.get("source_url"), "filed_source_url": (filed or {}).get("source_url"),
               "filed_run": (filed or {}).get("extracted_run"), "reread": brief(new_score)}
        not_own, own_page = own_program_why(rec, sources.get(str(cn)))
        if own_page:
            row["own_page"] = own_page
        live = None if live_runs is None else live_runs.get(str(cn))
        live = None if live is None else str(live)
        if live_runs is not None:
            row["live_run"] = live
        if filed is not None:
            row["filed"] = brief(filed_score)
            row["plain_reread_loses_pass"] = passes_live(filed_score) and not passes_live(new_score)
        # The order (COBIx on #3547): the checked list, own program, a live run equal to this run, a live run other
        # than the filed record's, then "better". A person's check first, whatever the base files (#3544, finding 1).
        if cn in checked:
            if filed is not None:
                row.update(outcome="restored", why="a person checked the live row: the filed record stands")
            else:
                row.update(outcome="held", held_checked=True,
                           why="a person checked the live row, and %s files no record to restore" % base)
        # A live row holding this run while the re-read is not its own program's: a wrong record is already live.
        elif not_own and live == run:
            row.update(outcome="held", held_live_run=True, not_own_program=True,
                       why="the live row already holds run %s, and %s: a wrong record is live, and a person decides"
                           % (live, not_own))
        elif not_own:
            if filed is None:
                row.update(outcome="held", not_own_program=True, why="no filed record, and " + not_own)
            else:
                row.update(outcome="restored", why=not_own, not_own_program=True)
        # This run is live already (a reread posted it): its record stays on the branch, and no dispatch names it.
        elif live == run:
            row.update(outcome="posted", why="the live row already holds run %s: a reread posted it" % run)
        # A live row from a run the base does not hold: "better" against the base judges the wrong record (finding 2).
        elif live is not None and (filed is None or live != str(row["filed_run"])):
            row.update(outcome="held", held_live_run=True,
                       why=("the live row holds run %s and %s files run %s: a person compares them"
                            % (live, base, row["filed_run"])) if filed is not None else
                           ("the live row holds run %s and %s files no record: a person compares them" % (live, base)))
        elif filed is None:
            row.update(outcome="new", why="no filed record on %s" % base)
        else:
            side, why = compare(filed_score, new_score)
            row.update(outcome="restored" if side == "filed" else "kept", why=why)
        if not dry_run and row["outcome"] == "held":
            os.makedirs(os.path.join(folder, HELD_DIR), exist_ok=True)
            with open(os.path.join(folder, HELD_DIR, cn + ".json"), "wb") as fh:
                fh.write(raw)
            if filed is None:
                os.remove(path)
        if not dry_run and row["outcome"] in ("restored", "held") and filed is not None:
            with open(path, "wb") as fh:
                fh.write(filed_raw)
        rows.append(row)
    # A program held for a person earlier in this run's account stays listed (its file is in held_for_person/).
    rows.extend(e for e in earlier.values() if e.get("outcome") == "held")
    college = college or folder_college(folder)
    labels = {"kept": "kept re-read", "restored": "restored filed", "new": "new record", "held": "for a person",
              "posted": "already live"}
    for row in rows:
        if row["outcome"] == "restored" and "next_read_held" not in row:
            h = None if dry_run else next_read_held(folder, row["control_number"])
            row["next_read_held"] = (h or {}).get("reason")
        out("%-6s %-15s %s" % (row["control_number"], labels[row["outcome"]], row["why"]))
    after = []
    for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(path) as fh:
            after.append(json.load(fh))
    kept_passing = {}
    try:
        with open(os.path.join(folder, "kept_passing.json")) as fh:
            kp = json.load(fh)
        if str(kp.get("run")) == run:
            kept_passing = {e["control_number"]: e.get("reason") for e in kp.get("programs") or []}
    except (OSError, ValueError):
        pass
    # Records main files that this filing dropped (the capture found no page for a failing one): reread never
    # deletes a live row, so each stays live as main holds it; named here so nobody counts them as re-read.
    have = {os.path.basename(p) for p in glob.glob(os.path.join(folder, "records", "*.json"))}
    rel_records = os.path.relpath(os.path.join(folder, "records"), root)
    listed = git(root, "ls-tree", "--name-only", "%s:%s" % (base, rel_records))
    dropped = []
    for name in (listed.stdout.decode().split() if listed.returncode == 0 else []):
        if name.endswith(".json") and name not in have:
            got = base_bytes(root, base, "%s/%s" % (rel_records, name))
            dropped.append({"control_number": name[:-5],
                            "filed_passes_live": passes_live(json.loads(got).get("score")) if got else None})
    restored = [r for r in rows if r["outcome"] == "restored"]
    counts = {
        "reread": len(rows), "kept": sum(r["outcome"] == "kept" for r in rows), "restored": len(restored),
        "restored_filed_pass": sum(bool((r.get("filed") or {}).get("passes_live")) for r in restored),
        "restored_not_own_program": sum(bool(r.get("not_own_program")) for r in restored),
        "held_for_person": sum(r["outcome"] == "held" for r in rows),
        "held_checked": sum(bool(r.get("held_checked")) for r in rows),
        "held_live_run": sum(bool(r.get("held_live_run")) for r in rows),
        "new": sum(r["outcome"] == "new" for r in rows),
        "already_live": sum(r["outcome"] == "posted" for r in rows),
        "kept_on_own_page": sum(bool(r.get("own_page")) and r["outcome"] in ("kept", "new", "posted") for r in rows),
        "plain_reread_would_lose_pass": sum(bool(r.get("plain_reread_loses_pass")) for r in rows),
        "kept_by_extraction_guard": len(kept_passing),
        "run_places_none_after": sum(1 for r in rows if r["outcome"] in ("kept", "new", "restored", "posted") and
                                     (r["filed"] if r["outcome"] == "restored" else r["reread"]).get("none_placed")),
        "folder_places_none_after": sum(1 for rec in after if none_placed(rec.get("score"))),
        "records_after": len(after),
        "dropped_by_filing": len(dropped),
        "dropped_filed_passes": sum(bool(d["filed_passes_live"]) for d in dropped),
    }
    runs[run] = {"base": base, "base_sha": base_sha, "decided": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                 "counts": counts, "kept_by_extraction_guard": kept_passing,
                 "next_read_pays": sorted(r["control_number"] for r in restored if not r.get("next_read_held")),
                 "dropped_by_filing": dropped, "programs": rows}
    # The dispatches: each run whose kept or new records are still in the folder at that run, and that no reread
    # receipt on this branch has posted, pinned by the run so reread never falls back to main's run.
    posted = posted_runs(root, college or "", os.path.basename(folder))
    at_run: dict[str, int] = {}
    for rec in after:
        at_run[str(rec.get("extracted_run"))] = at_run.get(str(rec.get("extracted_run")), 0) + 1
    dispatch, carried = [], {}
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD").stdout.decode().strip() or None
    for r_id in sorted(runs, key=int):
        decided = {e["control_number"] for e in runs[r_id].get("programs") or [] if e.get("outcome") in ("kept", "new")}
        still = sorted(rec["control_number"] for rec in after
                       if str(rec.get("extracted_run")) == r_id and rec.get("control_number") in decided)
        if r_id != run:
            carried[r_id] = still
        # A record already live at its run (outcome posted) never makes a dispatch; one that rides along with a run
        # dispatched for its other records is named, since step=reread writes every record of the run again.
        live_at = sorted(rec["control_number"] for rec in after if str(rec.get("extracted_run")) == r_id
                         and rec.get("control_number") in {e["control_number"] for e in runs[r_id].get("programs")
                                                           or [] if e.get("outcome") == "posted"})
        if still and r_id not in posted:
            dispatch.append({"workflow": WORKFLOW, "ref": branch,
                             "inputs": {"college": college, "step": "reread", RUN_INPUT: r_id},
                             "posts": len(still), "control_numbers": still,
                             **({"already_live": live_at} if live_at else {})})
    acct = {
        "college": college, "run": run, "written": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rule": "a checked live row restores, or is held where the base files none; then own program (a heading "
                "sharing a title word, or a generic heading on a page the address or the capture shows is the "
                "program's own; then heading_award_check), where a failing re-read is restored, or held where the "
                "base files none or the live row already holds this run; then a live row holding this run keeps "
                "its record and names no dispatch; then a supplied live run other than the filed record's is held "
                "for a person; then first difference decides: score.pass, passes_live, coverage.pass, none_placed "
                "false, higher share, arithmetic equal / unstated passing / unequal / unstated failing / incomplete; "
                "a tie keeps the re-read; no filed record keeps the new one (d-reread-keep-the-better-s683; COBIx on "
                "#3544 and #3547)",
        "checked": sorted(checked),
        "live_runs": "not supplied" if live_runs is None else {str(k): str(v) for k, v in sorted(live_runs.items())},
        "dispatch": dispatch or "no dispatch: no run holds a kept or new record that a reread has not posted",
        "carried_runs": carried,
        "counts": counts,
        "runs": runs,
    }
    if not dry_run:
        with open(acct_path, "w") as fh:
            json.dump(acct, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    out("%s run %s: re-read %d, kept %d, restored %d (%d filed passes, %d not its own program), for a person %d, "
        "new %d, already live %d; a plain reread would lose %d filed passes; the extraction's guard kept %d; dropped "
        "by the filing %d (%d filed passes); places none after: %d of this run, %d of %d in the folder%s"
        % (college, run, counts["reread"], counts["kept"], counts["restored"], counts["restored_filed_pass"],
           counts["restored_not_own_program"], counts["held_for_person"], counts["new"], counts["already_live"],
           counts["plain_reread_would_lose_pass"], counts["kept_by_extraction_guard"], counts["dropped_by_filing"],
           counts["dropped_filed_passes"], counts["run_places_none_after"], counts["folder_places_none_after"],
           counts["records_after"], " (dry run: nothing written)" if dry_run else ""))
    for d in dispatch:
        out("dispatch: %s on %s, %s" % (d["workflow"], d["ref"], ", ".join("%s=%s" % kv for kv in d["inputs"].items())))
    if not dispatch:
        out("no dispatch")
    return acct


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("folder", help="kb/program_requirements_college/<slug>, after extract=1 filed it")
    ap.add_argument("--checked", required=True,
                    help="the conductor's live read: {\"by_college\": {college: [control numbers]}, optional "
                         "\"live_runs\": {college: {control number: extracted_run}}}")
    ap.add_argument("--base", default="origin/main", help="the ref holding the filed records (default origin/main)")
    ap.add_argument("--run", default=None, help="the extraction run (default: capture.json's run)")
    ap.add_argument("--dry-run", action="store_true", help="print the decisions; write nothing")
    a = ap.parse_args(argv)
    college = folder_college(os.path.abspath(a.folder))
    keep_better(a.folder, a.base, a.run, read_checked(a.checked, college), a.dry_run,
                live_runs=read_live_runs(a.checked, college))
    return 0


if __name__ == "__main__":
    sys.exit(main())
