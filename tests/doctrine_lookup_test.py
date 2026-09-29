#!/usr/bin/env python3
"""
kb/doctrine.py — the doctrine lookup, and the two bugs it shipped with.

WHY THIS TEST EXISTS
--------------------
`kb/doctrine.py` answers "what has this repo already decided about the files I
am about to touch?" — a lookup meant to replace recall, because recall stopped
scaling at 299 KB notes. A lookup that silently omits something is worse than no
lookup: it answers confidently and short, and the reader has no way to tell a
quiet answer from a complete one. Its first run did exactly that, twice.

  1. **The last artifact of every note was dropped.** `FM_RE` captures the
     frontmatter WITHOUT its closing newline, and the artifact-list pattern
     requires each item to end in one. Measured across the corpus: **235
     declared artifact entries** were invisible, one per note, always the last.
     It surfaced only because a lookup on `tests/run.js` failed to return the
     note whose artifacts list ENDS with `tests/run.js`.

  2. **`--changed` omitted untracked files.** `git diff` does not see a file
     that was never added, so the three files the session had just written were
     missing from its own answer — and a brand-new file is precisely the one
     with no doctrine loaded in anyone's head.

Both are the shape this repo keeps meeting: a thing that drops content and still
looks complete. Run: `python3 tests/doctrine_lookup_test.py` (also a CI step in
.github/workflows/js-tests.yml, beside the other pure-stdlib lints).
"""
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import doctrine  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


def block(label, fn):
    """Nothing between checks may throw — a dead driver removes checks silently
    and a run that reports nothing reads exactly like a run that passed."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001
        check("%s — driver threw: %s" % (label, exc), False)


NOTES = doctrine.load_notes()
INDEX = doctrine.build_index(NOTES)


# ── (1) The corpus parses, and the LAST artifact survives ──────────────────
def t_parse():
    check("(1) the KB corpus loads", len(NOTES) > 200, "found %d notes" % len(NOTES))
    check("(1) every note has a title",
          all(n["title"] for n in NOTES),
          "the title IS the rule in this corpus; a blank one is a lost rule")

    # ⭐ The regression guard for bug 1. Counted INDEPENDENTLY from the raw file
    # rather than compared against a stored number: a stored count rots the
    # moment a note is added, and a `>=` comparison — which is what this check
    # said first — stays true while 235 entries go missing. A guard that cannot
    # fail is worse than none.
    import re
    parsed = sum(len(n["artifacts"]) for n in NOTES)
    raw = 0
    for n in NOTES:
        path = os.path.join(doctrine.NOTES_DIR, n["file"])
        text = open(path, encoding="utf-8", errors="replace").read()
        fm = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
        if not fm:
            continue
        m = re.search(r"^artifacts:\s*\n((?:[ \t]+-.*(?:\n|$))*)", fm.group(1) + "\n", re.M)
        if m:
            raw += len([x for x in re.findall(r"^[ \t]+-\s*(.+?)\s*$", m.group(1), re.M)
                        if x and not x.startswith("#")])
    check("(1) ⭐ EVERY declared artifact is parsed, including each note's last one",
          parsed == raw,
          "parsed %d of %d — FM_RE stops before the closing ---, so the last item "
          "carries no trailing newline and 235 entries were dropped this way" % (parsed, raw))

    # A concrete, named instance — the one that exposed the bug.
    never = [n for n in NOTES if n["slug"].endswith("a-check-that-never-registers-can-never-fail")]
    check("(1) the note that named tests/run.js LAST is indexed against it",
          never and "tests/run.js" in never[0]["artifacts"],
          "this exact note is how the dropped-last-artifact bug was found")


# ── (2) The lookup answers the question that motivated it ─────────────────
def t_lookup():
    target = "chatbox/supabase/functions/cpl-chat/index.ts"
    _resolved, hits = doctrine.resolve(target, INDEX)
    ranked = doctrine.rank(hits, prescriptive_only=True)
    titles = " | ".join(t["title"].lower() for _tier, t in ranked)

    check("(2) the cpl-chat edge function resolves to many rules",
          len(ranked) >= 8, "found %d" % len(ranked))
    check("(2) ⭐ including the rule Session 178 broke",
          "census" in titles,
          "'A capped list must never read as a census' is attached to the very "
          "file where the capped list shipped — the knowledge was indexed and unread")
    check("(2) ⭐ and the cap family is not a single lucky hit",
          titles.count("cap") >= 2,
          "four notes about caps sit on this one file")
    check("(2) declared artifacts outrank prose mentions",
          all(a <= b for a, b in zip([t for t, _ in ranked], [t for t, _ in ranked][1:])),
          "tier 1 (artifacts:) before tier 2 (body mention)")

    # Basename resolution — a session names the file it is editing, not a path.
    _r2, hits2 = doctrine.resolve("index.ts", INDEX)
    check("(2) a bare basename still resolves", len(hits2) > 0)

    # ⚠ A DOT-DIRECTORY MUST SURVIVE NORMALIZATION. `lstrip("./")` strips any
    # leading run of `.` and `/`, so `.github/workflows/x.yml` was silently
    # renamed to `github/workflows/x.yml` in the output and in the index key.
    # Same class as the governance detector's `\b`-before-a-dot bug, which
    # reported a real file as missing.
    r3, _h3 = doctrine.resolve(".github/workflows/js-tests.yml", INDEX)
    check("(3) ⚠ a dot-directory keeps its dot", r3.startswith(".github/"), r3)
    r4, _h4 = doctrine.resolve("./kb/doctrine.py", INDEX)
    check("(3) …while a ./ prefix is still stripped", r4 == "kb/doctrine.py", r4)

    # Reference/glossary notes are lookup cards, not rules; they must not bury
    # the rules when the caller asked for rules.
    allk = doctrine.rank(hits, prescriptive_only=False)
    check("(2) --all-kinds is a superset of the rules-only view",
          len(allk) >= len(ranked))


# ── (3) ⚠ --changed must not omit a brand-new file ────────────────────────
def t_changed():
    with tempfile.TemporaryDirectory() as tmp:
        run = lambda *a: subprocess.run(list(a), cwd=tmp, capture_output=True, text=True)
        run("git", "init", "-q")
        run("git", "config", "user.email", "t@t")
        run("git", "config", "user.name", "t")
        open(os.path.join(tmp, "tracked.js"), "w").write("// one\n")
        run("git", "add", "-A")
        run("git", "commit", "-qm", "base")
        # One modified, one brand new and never added.
        open(os.path.join(tmp, "tracked.js"), "w").write("// one\n// two\n")
        open(os.path.join(tmp, "brand_new.js"), "w").write("// new\n")

        real_root = doctrine.ROOT
        try:
            doctrine.ROOT = tmp
            found = doctrine.changed_files()
        finally:
            doctrine.ROOT = real_root

    check("(3) a modified tracked file is reported", "tracked.js" in found, str(found))
    check("(3) ⚠ an UNTRACKED file is reported too", "brand_new.js" in found,
          "git diff cannot see it; the first version of this tool omitted all "
          "three files the session had just written, from its own answer")
    check("(3) the base-branch diff is OFF by default",
          doctrine.changed_files.__defaults__ == (None,),
          "a stale origin/main turned this into 138 files of already-merged work, "
          "and an answer that long is one nobody reads")


# ── (4) The output is readable, not a reading list ────────────────────────
def t_output():
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "doctrine.py"),
                        "chatbox/supabase/functions/cpl-chat/index.ts", "--limit", "5"],
                       capture_output=True, text=True, cwd=ROOT)
    out = r.stdout
    check("(4) the CLI exits cleanly", r.returncode == 0, r.stderr[:200])
    check("(4) it prints rule TITLES, which are the rules themselves",
          "capped list must never read as a census" in out.lower(), out[:200])
    check("(4) it marks which notes name the file explicitly", "*" in out)
    check("(4) it says how many it withheld rather than truncating silently",
          "and" in out and "more" in out,
          "a capped list must never read as a census — including this tool's own")

    r2 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "doctrine.py"),
                         "--topic", "caps"], capture_output=True, text=True, cwd=ROOT)
    check("(4) --topic works", r2.returncode == 0 and len(r2.stdout) > 40, r2.stderr[:200])

    r3 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "doctrine.py"),
                         "does/not/exist.js"], capture_output=True, text=True, cwd=ROOT)
    check("(4) an unknown file says so plainly instead of failing",
          r3.returncode == 0 and "no note names this file" in r3.stdout,
          "silence would read as 'nothing to know'")


def t_read():
    """(5) --read: the analysis side (Sam's ruling 11, 2026-09-05).

    `--changed` reads the diff, so it is silent until code exists. The costly
    errors happen while READING — a number measured against the wrong set — and
    `--read` takes the files the session actually opened, from the transcript."""
    import json as _json
    import tempfile
    sys.path.insert(0, os.path.join(ROOT, "kb"))
    import doctrine as doc  # noqa: E402

    def tool(name, inp):
        return _json.dumps({"message": {"content": [
            {"type": "tool_use", "name": name, "input": inp}]}})

    with tempfile.TemporaryDirectory() as td:
        tpath = os.path.join(td, "s.jsonl")
        with open(tpath, "w", encoding="utf-8") as fh:
            fh.write(tool("Read", {"file_path": "kb/doctrine.py"}) + "\n")
            fh.write(tool("Bash", {"command": "sed -n '1,20p' kb/_context_budget.py"}) + "\n")
            fh.write(tool("Bash", {"command": "grep -n x kb/_docs_audit.py | head"}) + "\n")
            fh.write(tool("Bash", {"command": "ls -la"}) + "\n")
            fh.write(tool("Read", {"file_path": "kb/does_not_exist_xyz.py"}) + "\n")
            fh.write("{ this is not json\n")
            fh.write(tool("Bash", {"command": "cat <<'EOF' > /tmp/x\nsee cpl_chat.js and tests/lib/check_ledger.js\nEOF"}) + "\n")
            fh.write(tool("Grep", {"path": "kb/alias_chain.py"}) + "\n")
        got = doc.read_files(tpath)

    check("(5) a structured Read is picked up", "kb/doctrine.py" in got)
    check("(5) a path inside a Bash command is picked up (auto mode never calls Read)",
          "kb/_context_budget.py" in got and "kb/_docs_audit.py" in got,
          "an auto-mode session can open 40 files with zero Read calls")
    check("(5) a heredoc BODY is not a read", 
          "cpl_chat.js" not in got and "tests/lib/check_ledger.js" not in got,
          "a session that WRITES about a path never opened it")
    check("(5) a path that does not exist in the repo is dropped",
          "kb/does_not_exist_xyz.py" not in got)
    check("(5) a malformed transcript line does not stop the scan",
          "kb/alias_chain.py" in got, "the line after the bad one must still be read")
    check("(5) newest first — the tail is what the current conclusion rests on",
          got.index("kb/alias_chain.py") < got.index("kb/doctrine.py"))
    check("(5) no duplicates", len(got) == len(set(got)))
    check("(5) a missing transcript fails soft, never raises",
          doc.read_files(os.path.join(ROOT, "no", "such", "file.jsonl")) == [])

    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "doctrine.py"),
                        "--read", "--transcript", os.path.join(ROOT, "nope.jsonl")],
                       capture_output=True, text=True, cwd=ROOT)
    check("(5) --read with no transcript exits 0 and says why",
          r.returncode == 0 and "transcript" in (r.stderr + r.stdout).lower(),
          "an advisory tool must never be the thing that breaks the run")


for label, fn in [("(1)", t_parse), ("(2)", t_lookup), ("(3)", t_changed), ("(4)", t_output),
                  ("(5)", t_read)]:
    block(label, fn)

PASSED = 0
for name, ok, why in CHECKS:
    print(("  ok  " if ok else "FAIL  ") + name + (("\n        > " + why) if (not ok and why) else ""))
    if ok:
        PASSED += 1
print("\ndoctrine_lookup_test.py: %d/%d checks passed" % (PASSED, len(CHECKS)))
sys.exit(0 if PASSED == len(CHECKS) else 1)
