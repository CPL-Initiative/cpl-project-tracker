#!/usr/bin/env python3
"""Would our guards have caught the failures we actually had?

Every scenario below is a REAL failure this repo experienced, with known ground
truth: we know it happened, and we know whether anything caught it (mostly
nothing did — a human did, days or weeks later).

The point is not to celebrate the guards that now pass. It is to score a
PROPOSED change to the guard set before building it: add a scenario for the
failure you are worried about, see whether today's configuration catches it,
then see whether your proposal would. An architecture argument becomes a table.

READ-ONLY: every scenario runs against a throwaway temp tree.
Run: python3 kb/_doctrine_scenarios.py [--verbose]
"""
import argparse, importlib.util, os, shutil, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("da", os.path.join(ROOT, "kb", "_docs_audit.py"))
da = importlib.util.module_from_spec(spec)
spec.loader.exec_module(da)


def sandbox(files):
    """A minimal repo: {relpath: contents}. Returns its root."""
    d = tempfile.mkdtemp(prefix="scenario-")
    for rel, body in files.items():
        p = os.path.join(d, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w", encoding="utf-8").write(body)
    return d


def any_guard_fires(root):
    """Run every rule that can see a repo of this shape. Returns the rule names
    that fired — the question is only ever 'did ANYTHING notice?'"""
    fired = []
    cm = os.path.join(root, "CLAUDE.md")
    if os.path.isfile(cm):
        e = {"rel": "CLAUDE.md", "path": cm, "lane": "always_loaded",
             "bytes": os.path.getsize(cm), "fm": {}, "has_fm": False}
        for fn, name in ((lambda x: da.rule_presentation_doctrine(x), "presentation_doctrine"),
                         (lambda x: da.rule_stacked_roadmap_cell(x), "stacked_roadmap_cell"),
                         (lambda x: da.rule_oversized_doc(x), "oversized_doc"),
                         (lambda x: da.rule_unreferenced_offload(x, root), "unreferenced_offload"),
                         (lambda x: da.rule_self_corrected_word_pair(x), "self_corrected_word_pair")):
            try:
                if fn(e):
                    fired.append(name)
            except Exception:
                pass
    # Runtime guards. Not every failure is visible in a repo tree -- the
    # 2026-08-29 compaction left no committed trace at all, so a harness that
    # only runs docs lints would score it "missed" forever and never notice the
    # hook that now catches it. A scenario may drop a transcript in its sandbox.
    tr = os.path.join(root, "transcript.jsonl")
    if os.path.isfile(tr):
        try:
            cbs = importlib.util.spec_from_file_location(
                "cb", os.path.join(ROOT, "kb", "_context_budget.py"))
            cb = importlib.util.module_from_spec(cbs)
            cbs.loader.exec_module(cb)
            if cb.measure(tr).get("status") in ("warn", "emergency"):
                fired.append("context_budget")
        except Exception:
            pass
    return fired


# ── the scenarios ────────────────────────────────────────────────────────────
# Each: (name, what really happened, files, should_be_caught)
BASE_RULES = """## Presentation rules

- **FIRST LIGHT, ALWAYS.** do not invent a palette.
- **ACCESSIBLE TO TODAY'S STANDARDS.** AA 4.5:1, aria-label, focus-visible.
- **MOBILE-FRIENDLY, ALWAYS.** single column below ~560px.
- **PLAIN WORDS, NOT GLYPHS.** every control is a word, never a decorative emoji.
- **AMERICAN SPELLING, ALWAYS.**
- **No horizontal scroll whenever feasible.**
- **PROSE RUNS THE FULL WIDTH.** `--cpl-measure`.
"""

def s_glyph_rule_relocated():
    """2026-08-28: the glyph rule sat in a §11 roadmap row; relocating that row
    to a lane file carried it out of the always-loaded file. Zero occurrences
    remained. Sam caught it, a day later, by asking."""
    rules = BASE_RULES.replace(
        "- **PLAIN WORDS, NOT GLYPHS.** every control is a word, never a decorative emoji.\n", "")
    return {"CLAUDE.md": "# CLAUDE\n\n" + rules + "\nsee docs/reference/lanes/admin.md\n",
            "docs/reference/lanes/admin.md": "# Admin\nPLAIN WORDS, NO GLYPHS: every control is a word.\n"}

def s_offload_without_pointer():
    """2026-08-28: docs/reference/statute/ held the texts the §55050 lane drafts
    against, reachable from scripts but from nothing CLAUDE.md points at."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES + "\nnothing points at the statute texts.\n",
            "docs/reference/statute/README.md": "# Statute texts\nthe authoritative regulation text.\n"}

def s_roadmap_cell_regrows():
    """The failure stacked_roadmap_cell exists for: a pointer row grown back
    into a paragraph."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES +
            "\n### Roadmap\n\n| Phase | What | Status |\n|---|---|---|\n"
            "| **Lane** | a thing | " + ("x" * 4500) + " |\n\n"
            "The auditor is the foundational instrument for everything.\n"}

def s_skill_loses_its_pointer():
    """NOT YET A GUARD. A skill is where we are about to put the M-ID re-mint
    rules. .claude/skills/ is outside the corpus walk entirely (0 of 732 files),
    so a skill nobody points at is invisible."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES + "\nno mention of any skill.\n",
            ".claude/skills/mid-remint/SKILL.md":
                "---\nname: mid-remint\n---\n# M-ID re-mint\nthe invariants live here.\n"}

def s_sweeper_corrupts_its_own_rule():
    """2026-08-29: american_spelling rewrote `whilst`/`amongst` INSIDE the
    parenthetical that named them, leaving 'while (not while)'. Nothing flags
    it — both halves are correctly spelled American English."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES.replace(
        "- **AMERICAN SPELLING, ALWAYS.**",
        "- **AMERICAN SPELLING, ALWAYS.** Use while (not while) and among (not among).")}

def s_memory_row_contradicts_doctrine():
    """NOT YET A GUARD. cpl_memory has no lint at all. A row can assert the
    opposite of the always-loaded file and nothing compares them."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES + "\nNever force-push `main`.\n"}

def s_checkpoint_never_ran():
    """Sam's scenario 1: 600k context, deep in a build, no checkpoint yet --
    "imagine you didn't know we are testing for a checkpoint prompt".

    ⚠️ THE ANSWER I GAVE HIM WAS THE FAILURE. I described commit, handoff,
    todos, "triage the rest" -- 2 of the 13 artifacts -- without ever saying the
    word CHECKPOINT. Improvising the procedure from memory is how the other 11
    go missing, and the answer LOOKED competent, which is what made it dangerous.

    This is the one behavioral scenario that leaves a TRACE: if a checkpoint did
    not run, the newest handoff is older than the work. That is observable, so it
    can be scored without asking the agent what it did."""
    import subprocess, os as _os
    d = tempfile.mkdtemp(prefix="scenario-")
    _os.makedirs(_os.path.join(d, "docs"))
    open(_os.path.join(d, "docs", "session_9_handoff.md"), "w").write("# handoff\n")
    for cmd in (["git","init","-q"], ["git","config","user.email","t@t"],
                ["git","config","user.name","t"], ["git","add","-A"],
                ["git","commit","-qm","handoff"]):
        subprocess.run(cmd, cwd=d, capture_output=True)
    for i in range(8):
        open(_os.path.join(d, f"work{i}.txt"), "w").write("x")
        subprocess.run(["git","add","-A"], cwd=d, capture_output=True)
        subprocess.run(["git","commit","-qm",f"work {i}"], cwd=d, capture_output=True)
    return d   # already a root, not a file map


def s_conditional_checkpoint_item():
    """2026-07-19 -> 41 days stale. Rule 9's CPLBrain bullet lists three stores
    in ONE paragraph, and freshness tracks the grammar exactly:

        07-session-notes/          "REQUIRED for any non-trivial session"  -> fresh
        04-projects/SESSION-NOTES  "WHEN the run worked inside a project"  -> 41d stale
        07-session-notes/README    "ONLY IF the convention itself changed" -> untouched

    Same repo, same rule, same author, same day. The only variable is
    unconditional vs conditional phrasing.

    ⚠️ The conditional is not WRONG -- "update it when you worked there" is a
    correct instruction. The defect is that nothing can observe whether the
    condition was met, so a missed update is indistinguishable from a run the
    condition never applied to. Uncaught today: the auditor walks this repo
    only, and cannot see the vault at all."""
    return {"CLAUDE.md": "# CLAUDE\n\n" + BASE_RULES +
            "\n- Update `04-projects/<project>/SESSION-NOTES.md` when the run "
            "worked inside a project folder.\n"}


def s_context_compacted_before_checkpoint():
    """2026-08-29, THIS session. Auto-compacted at 786,077 tokens with the
    checkpoint 150K stale; ~778,000 tokens of working context dropped. Nothing
    warned, because Rule 9's trigger said Claude Code "doesn't expose an exact
    counter; use proxies" -- a premise that was simply false. The exact counter
    is written to the transcript every turn. Caught now by kb/_context_budget.py
    behind a PostToolUse hook (Rule 9a)."""
    import json as _json
    d = tempfile.mkdtemp(prefix="scenario-")
    open(os.path.join(d, "transcript.jsonl"), "w").write(_json.dumps({
        "type": "assistant",
        "message": {"usage": {"input_tokens": 2,
                              "cache_read_input_tokens": 753_986,
                              "cache_creation_input_tokens": 0}},
    }) + "\n")
    return d


SCENARIOS = [
    ("glyph rule relocated out of the always-loaded file", s_glyph_rule_relocated, True),
    ("an offload nothing points at",                        s_offload_without_pointer, True),
    ("a roadmap pointer row regrows into a paragraph",      s_roadmap_cell_regrows, True),
    ("a SKILL nobody points at",                            s_skill_loses_its_pointer, True),
    ("the spelling sweeper corrupts its own word list",     s_sweeper_corrupts_its_own_rule, True),
    ("a cpl_memory row contradicting doctrine",             s_memory_row_contradicts_doctrine, True),
    ("work landed but the checkpoint never ran",            s_checkpoint_never_ran, True),
    ("a CONDITIONAL checkpoint item nobody can audit",      s_conditional_checkpoint_item, True),
    ("the session compacted before any checkpoint ran",     s_context_compacted_before_checkpoint, True),
]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    caught = missed = 0
    rows = []
    for name, build, should in SCENARIOS:
        built = build()
        root = built if isinstance(built, str) else sandbox(built)
        fired = any_guard_fires(root)
        try:
            if da.rule_checkpoint_overdue(root):
                fired.append("checkpoint_overdue")
        except Exception:
            pass
        shutil.rmtree(root, ignore_errors=True)
        ok = bool(fired) == should
        caught += bool(fired); missed += (not fired)
        rows.append((name, fired, ok))
    w = max(len(r[0]) for r in rows)
    print(f"{'scenario'.ljust(w)}   caught by")
    print("-" * (w + 40))
    for name, fired, ok in rows:
        print(f"{name.ljust(w)}   {', '.join(fired) if fired else '— NOTHING —'}")
    print("-" * (w + 40))
    print(f"{caught} of {len(rows)} real failures would be caught today; {missed} would not.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
