#!/usr/bin/env python3
"""The CLAUDE.md prompt audit's open items, as one decision sheet (2026-09-27, S295).

Sam, 2026-09-27: "Thinking we should clean up claude.md". The audit
(kb/prompt_audit/20260927_claude_md_prompt_audit.md) applied what it may apply on its own:
fifteen incident stories and outdated wordings moved verbatim from the tracker's CLAUDE.md to
docs/reference/doctrine_provenance.md, every rule left in place. What remains needs Sam: stale
statements and conflicts the audit procedure lets a session propose but never apply on a
blanket request, the level of emphasis he asked for on 2026-09-09, and two questions about the
vault's framework updater. The card numbers match the report's findings as noted per card.

Published: https://claude.ai/artifact/Kd6K7yrAfGQKCtVyd4bhX5 (capabilities db + comments; its
`replies` store is keyed to these eight positions, so a changed card list goes out under a fresh
SHEET_ID and artifact, per docs/reference/decision_sheets.md).

Run: python3 kb/_build_claude_md_audit_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-27-claude-md-audit.html')
SHEET_ID = '2026-09-27-claude-md-audit'
CH_LATER = ('Later', 'later')


def items():
    I = []
    I.append({
        'title': 'The context warning never fires in a three-repo session',
        'ref': 'report F1 · CLAUDE.md Rule 9a · scripts/check_hooks_live.py · scripts/install-context-hook.ps1',
        'facts': (
            "Rule 9a says the context meter fires on its own from the repo's settings. With all three "
            "repos attached, Claude Code roots the session at their parent folder and loads none of the "
            "repo's settings. <code>check_hooks_live.py</code> records this, and its repair installs only "
            "the SQL and Bash guards. The meter reaches your Windows machine through "
            "<code>install-context-hook.ps1</code>, so desktop sessions hear it and cloud sessions do not. "
            "This session ran it by hand at 11:52 UTC: 100,298 of 786,077 tokens used."),
        'why': (
            "A session that trusts the rule waits for a warning that never comes and meets the "
            "compaction without a checkpoint."),
        'rec': (
            "<strong>Correct the rule, and have <code>check_hooks_live.py --fix</code> install the meter "
            "at the root beside the guards it already installs.</strong> Until that ships, sessions run "
            "the meter with Rule 9's commit count. <em>It might be wrong if</em> you want hooks kept out "
            "of the root settings after your 2026-09-24 ruling on the approval-prompt hooks; then the "
            "text correction alone applies."),
        'chips': [('Correct it and install the meter', 'both'), ('Correct the text only', 'text'), CH_LATER],
    })
    I.append({
        'title': 'Two instructions about the standing open-asks sheet disagree',
        'ref': 'report F2 · CLAUDE.md decision-sheets bullet and the §11 note · docs/reference/decision_sheets.md',
        'facts': (
            "The team-obligations list says to rebuild the open-asks sheet at every checkpoint and hand "
            "over the link. The note above the roadmap says <em>Do not republish it as-is</em>, because "
            "its reply store is keyed to the 21 cards you answered and the builder now holds 10. The "
            "reference doc settles it: a sheet whose cards changed goes out under a fresh sheet id and "
            "artifact."),
        'why': "Followed as written, the first instruction hands you the old link, which still shows the 21 answered cards.",
        'rec': (
            "<strong>Add the fresh-artifact step to the first instruction:</strong> rebuild at every "
            "checkpoint, and when the cards changed, publish under a fresh sheet id and hand over the new "
            "link. <em>It might be wrong if</em> you want the standing sheet to keep one address, which "
            "needs its store migrated by title."),
        'chips': [('Add the fresh-artifact step', 'fresh'), ('Keep one address', 'migrate'), CH_LATER],
    })
    I.append({
        'title': "Four statements in the tracker's CLAUDE.md no longer match the repository",
        'ref': 'report F3, F4, F5, F12 · CLAUDE.md lines 182, 265, 586, 718–719',
        'facts': (
            "The roadmap section says the two most recent session narratives stay beside its table under "
            "Rule 8's budget; the section holds the table alone, and the budget is Rule 9's. Rule 9 counts "
            "30 lane files; 32 exist. The naming rules say a Sierra guidance row is switched off in the "
            "🧭 pane; that mark left every page on 2026-09-09, and the switch lives in the Sierra training "
            "tab. The accessibility rule counts 38 COBI tabs; the checker reads the tabs from the page "
            "because, in its own words, a hand count goes stale."),
        'why': "Each sends a reader to something that is not there.",
        'rec': (
            "<strong>Correct all four as the report drafts them:</strong> drop the narratives clause and "
            "both counts, and name the Sierra training tab. <em>It might be wrong if</em> you want session "
            "narratives back beside the roadmap; then that clause stays and the next checkpoint writes "
            "one."),
        'chips': [('Correct all four', 'fix'), CH_LATER],
    })
    I.append({
        'title': "The vault's CLAUDE.md sends every session to two plans from 2025",
        'ref': 'report F6, F10 · CPLBrain/CLAUDE.md lines 47–52 and 155',
        'facts': (
            "Its Ongoing Work section tells every session to read <code>.claude/IMPLEMENTATION-TODO.md</code> "
            "and <code>.claude/SKILLS-MIGRATION-PLAN.md</code> before starting. Both date from 2025-10-31 "
            "and plan the COG framework's own move from an earlier personal-agent project, and their skill "
            "list no longer matches the vault. The same file counts 17 skills; 16 exist."),
        'why': "Each session opens by reading two plans that describe nothing current.",
        'rec': (
            "<strong>Remove the two pointers and the count,</strong> and keep the line that says to read a "
            "named file from disk before calling it missing. <em>It might be wrong if</em> you still work "
            "from either plan; then its pointer stays with a note on what in it is current."),
        'chips': [('Remove them', 'remove'), ('Keep the plans', 'keep'), CH_LATER],
    })
    I.append({
        'title': "The knowledge base's CLAUDE.md carries the tracker's title and an old rule number",
        'ref': 'report F7, F8, F9 · cpl-knowledge-base/CLAUDE.md lines 1, 19–22 and 66',
        'facts': (
            "Its heading reads CPL Project Tracker. It cites the tracker's checkpoint as Rule 8; the "
            "checkpoint is Rule 9. It sends sessions to fetch its files over the web, while its canonical "
            "copy, <code>claude/CLAUDE.md</code>, reads a local clone first, and a session attached to the "
            "repo holds every file on disk."),
        'why': "The public repo's own instructions misname it and send sessions to the network for files they already hold.",
        'rec': (
            "<strong>Correct the heading and the rule number, and add the canonical copy's local-clone "
            "step,</strong> as a pull request in the public repo that touches no curated content. "
            "<em>It might be wrong if</em> you want every change to the public repo to go through the "
            "curation pipeline, including its own instruction file."),
        'chips': [('Correct all three', 'fix'), ('Through curation', 'curate'), CH_LATER],
    })
    I.append({
        'title': 'Warning marks no longer single anything out',
        'ref': "report F11 · the tracker's CLAUDE.md, whole file · CPLBrain/CLAUDE.md headings",
        'facts': (
            "Before this audit the tracker's CLAUDE.md carried 42 ⚠️ marks and about 240 words in full "
            "capitals across 838 lines, with headings marked <em>do not violate</em> and "
            "<em>non-negotiable</em>; the vault's file marks four headings MANDATORY. Current models follow "
            "a plainly stated rule and over-apply a shouted one. On 2026-09-09 you asked for the "
            "checkpoint rule to stand out after it had been buried, so the level of emphasis is yours to "
            "set."),
        'why': "When most rules carry the mark, a session cannot tell which few failed again after being stated plainly.",
        'rec': (
            "<strong>Keep ⚠️ on the five rules whose failure recurred and set the rest in sentence case "
            "with bold:</strong> reading the memory table first, running the checkpoint without asking, "
            "resolving ids through the alias chain, reading sheet replies before acting, and leaving the "
            "26 kept glyphs alone. <em>It might be wrong if</em> the marks help you scan the file "
            "yourself; then they stay, and the report records the choice."),
        'chips': [('Tone it down', 'sweep'), ('Leave the marks', 'keep'), CH_LATER],
    })
    I.append({
        'title': "An update of the vault's framework can replace its CLAUDE.md",
        'ref': 'report F14 · CPLBrain/cog-update.sh line 62 · the update-cog skill',
        'facts': (
            "<code>cog-update.sh</code> lists CLAUDE.md among the upstream framework files. With "
            "<code>--force</code> it replaces the file and keeps a backup, and in its step-by-step mode "
            "Enter means update. Every vault rule you wrote lives in that file: the dated file names, "
            "session notes, capture on the fly, the three-repo check, the live-data rule and the curation "
            "boundary. The update-cog skill checks for local changes before it overwrites."),
        'why': "One update run could swap your rules for the upstream template.",
        'rec': (
            "<strong>Add one line to the vault's CLAUDE.md: merge upstream changes into this file by hand "
            "and keep it.</strong> The session that runs an update reads that line first. <em>It might be "
            "wrong if</em> you prefer to take CLAUDE.md off the updater's list; the script updates itself, "
            "so that edit would need repeating after each update."),
        'chips': [('Add the line', 'line'), ('Take it off the list', 'list'), CH_LATER],
    })
    I.append({
        'title': "The vault says fix a skill in place; the tracker's checkpoint says leave the vault's skills alone",
        'ref': 'report F15 · CPLBrain/CLAUDE.md lines 43–45 · cpl-project-tracker/.claude/commands/checkpoint.md step 11',
        'facts': (
            "The vault's rule: when a skill's instructions are wrong or incomplete, update its SKILL.md "
            "before the session ends. The tracker's checkpoint: touch nothing under the vault's "
            "<code>.claude/skills/</code>, because those are upstream framework files. Nine of the vault's "
            "16 skills come from upstream and seven are the vault's own. The upstream braindump skill "
            "already carries your on-the-fly mode of 2026-08-30, which an upstream update would remove."),
        'why': "A session following either rule breaks the other.",
        'rec': (
            "<strong>Fix the seven vault skills in place, and record a gap in an upstream skill in the "
            "session note.</strong> The braindump on-the-fly mode stays, and the line on card 7 names it "
            "for the updater. <em>It might be wrong if</em> you want local edits to upstream skills to "
            "continue; then the checkpoint's rule narrows to the files upstream ships unchanged."),
        'chips': [('Split by origin', 'split'), ('Allow edits to all', 'all'), CH_LATER],
    })
    return I


def build():
    I = items()
    framing = (
        "You asked on 2026-09-27 to clean up CLAUDE.md. The audit applied what it may apply on its "
        "own: fifteen incident stories and outdated wordings moved verbatim from the tracker's CLAUDE.md "
        "to docs/reference/doctrine_provenance.md, with every rule left in place, and the file now fits "
        "its budget at 59,436 of 60,000 bytes. These eight need your call: stale statements and "
        "conflicts the audit may propose but not apply, the level of emphasis, and two questions about "
        "the vault's updater. Each card arrives with my recommendation selected; change only what you "
        "want adjusted. The full report is in the tracker's kb/prompt_audit folder.")
    counts = f"{len(I)} items · 3 CLAUDE.md files"
    out = m.build_sheet(
        "CLAUDE.md Cleanup", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
