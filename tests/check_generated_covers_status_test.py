#!/usr/bin/env python3
"""Every kb/status/*.json is checked by scripts/check_generated.sh, or listed below with its reason (2026-11-24).

WHY. scripts/check_generated.sh is the documented last step before a push, and it named 4 of the 31 status files.
S718 lost two CI rounds to the gap: a PR rebuilt kb/status/local_subject_titles.json, and
kb/status/statewide_subject_codes.json and kb/status/subject_sources.json, which read it, went stale while the script
said "All generated files are current"; CI's lints job then failed each one in turn. Sam, 2026-11-24: "I think we
have come to this conclusion several times in the past, but still it recurs. If there is something solid we can
embed..." This guard is that: a new status file fails here until it gets a check line or a reason.

THE RULE, for each file directly under kb/status/ ending in .json:
  * its file name appears in scripts/check_generated.sh (on its check line's label or in the comment above it), or
  * it is a key of NOT_CHECKED with a non-empty reason saying why no check can hold it, never both.
NOT_CHECKED may not go stale: an entry for a file that is gone fails.

The guard proves it can fail on every run: it is handed a made-up status file in neither place, a gone entry, an
empty reason and a file in both, and must name each.

Pure stdlib. Run from the repo root: python3 tests/check_generated_covers_status_test.py
"""
import glob
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(REPO, "scripts", "check_generated.sh")
STATUS = os.path.join(REPO, "kb", "status")

# file name -> why scripts/check_generated.sh cannot check it. Read the builder before adding one.
NOT_CHECKED = {
    "subject_title_guesses.json":
        "the lightning round's best-guess titles (S737), written once by four model reviewers and their web checks; "
        "no committed input rebuilds a guess, and a person's accept, never the file, makes a title",
    "commons.json":
        "kb/_build_commons_status.py stamps written_at with the clock on each daily run; the lints job rebuilds it "
        "from the tree and runs every test that reads it",
    "commons_history.json":
        "the same daily builder keeps one entry per UTC day, so a rerun on another day differs by design",
    "subject_decisions.json":
        "kb/_sync_subject_decisions.py copies people's saves from the live table on the daily run; no committed "
        "input rebuilds it",
    "program-requirements-checked.json":
        "kb/_sync_program_checked.py reads the live records with the service key on the daily run",
    "harvest_gap_census.json":
        "harvest-gap-census.yml writes it from a live anon read of the harvest's table (dispatch only)",
    "harvest_heading_agreement.json":
        "harvest-gap-census.yml writes it beside the census; it trails the records filed between those dispatches, "
        "so a check would fail every PR (a rerun on main on 2026-11-24 differs)",
    "harvest_no_closed_list.json":
        "kb/_harvest_no_closed_list_diagnosis.py takes its members from the live census JSON (--census), which only "
        "the runner holds",
    "harvest_ncl_lookup_census.json":
        "a measurement a session writes on demand (--write); it drifts as captures are filed and no job keeps it "
        "current (a rerun on main on 2026-11-24 differs)",
    "program_named_gaps.json":
        "kb/_program_named_gaps.py files labels wave by wave from the conductor's live read (--checked)",
    "electives_fill_section_census_2026-11-14.json":
        "a dated one-off census (S652) kept as written; its --check reports the records filed since that day",
    "mid_outcomes_compare_2026-11-12.json":
        "a dated comparison kb/_mid_outcomes_compare.py wrote once; kb/_outline_hunt.py reads it as an input",
}


def named(name, script_text):
    """True when the script names the file: the name with no word character, dot or dash glued to either side."""
    return re.search(r"(?<![\w.\-])" + re.escape(name) + r"(?![\w\-])", script_text) is not None


def faults(status_names, script_text, not_checked):
    out = []
    for name in sorted(status_names):
        in_script, listed = named(name, script_text), name in not_checked
        if not in_script and not listed:
            out.append("%s: not named in scripts/check_generated.sh and not in NOT_CHECKED" % name)
        if in_script and listed:
            out.append("%s: named in scripts/check_generated.sh and in NOT_CHECKED; keep one" % name)
    for name, why in sorted(not_checked.items()):
        if name not in status_names:
            out.append("%s: in NOT_CHECKED but kb/status/ holds no such file; remove the entry" % name)
        if not (why or "").strip():
            out.append("%s: NOT_CHECKED gives no reason" % name)
    return out


fails = []


def check(label, ok):
    print(("ok   " if ok else "FAIL ") + label)
    if not ok:
        fails.append(label)


with open(SCRIPT, encoding="utf-8") as f:
    TEXT = f.read()
NAMES = {os.path.basename(p) for p in glob.glob(os.path.join(STATUS, "*.json"))}

# Fail-first controls: each made-up case must be named.
fake = "zz_made_up_status.json"
got = faults(NAMES | {fake}, TEXT, NOT_CHECKED)
check("control: a status file in neither place is named", any(g.startswith(fake + ":") for g in got))
got = faults(NAMES, TEXT, dict(NOT_CHECKED, **{"zz_gone.json": "a reason"}))
check("control: a NOT_CHECKED entry for a gone file is named", any(g.startswith("zz_gone.json:") for g in got))
got = faults(NAMES | {fake}, TEXT, dict(NOT_CHECKED, **{fake: "  "}))
check("control: an empty reason is named", any(g.startswith(fake + ": NOT_CHECKED gives no reason") for g in got))
got = faults(NAMES | {fake}, TEXT + "\n# kb/status/" + fake + "\n", dict(NOT_CHECKED, **{fake: "a reason"}))
check("control: a file both named and listed is named", any("keep one" in g for g in got))
check("control: a name inside a longer one does not count (commons.json in my_commons.json.gz)",
      not named("commons.json", "my_commons.json.gz x_commons.json"))
check("control: a name on a label counts", named("mq_view.json", 'srun "status: mq_view.json" "python3 x"'))

# The rule on the real tree.
check("kb/status/ holds status files (the glob is right)", len(NAMES) >= 20)
got = faults(NAMES, TEXT, NOT_CHECKED)
for g in got:
    print("     " + g)
check("every kb/status/*.json is checked by scripts/check_generated.sh or in NOT_CHECKED with its reason", not got)

print()
if fails:
    print("%d failed" % len(fails))
    sys.exit(1)
print("all passed (%d status files: %d checked, %d not checked)" % (
    len(NAMES), len([n for n in NAMES if n not in NOT_CHECKED]), len(NOT_CHECKED)))
