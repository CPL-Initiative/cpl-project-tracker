#!/usr/bin/env python3
"""Unit tests for the docs-corpus auditor (kb/_docs_audit.py).

Guards the two defects found while building it, both of which are the same
species — a lint that fires on CORRECT input:

  1. R3 flagged 52 well-formed KB notes as "broken" because the corpus declares
     a note's type three ways (`tags:`, `type:`, `kb-type:`) and its creation
     date two (`created:`, `date:`). Only 3 notes are genuinely typeless. A rule
     that cries wolf on 52 valid notes gets muted within a week — see
     docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md.
  2. R6 recommended excluding `cpl-project-tracker/docs` from the Obsidian
     vault, because docs/ carries 11 MB of .docx/.pdf attachments. That would
     have hidden the entire docs corpus this auditor exists to protect.

Plus the mutation invariants for --apply, which is the only thing here that
writes to a file: never touch the authoritative handoff, never touch a
non-handoff, stay idempotent.

Run: python3 tests/docs_audit_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "_docs_audit", os.path.join(ROOT, "kb", "_docs_audit.py"))
da = importlib.util.module_from_spec(spec)
spec.loader.exec_module(da)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def entry(relpath, text, lane=None):
    """Build the internal entry shape main() passes to the rules."""
    fm_lines, _b, has_fm = da.split_frontmatter(text)
    fm, _o = da.parse_frontmatter(fm_lines) if has_fm else ({}, [])
    return {"path": os.path.join(ROOT, relpath), "rel": relpath,
            "lane": lane or da.lane_of(relpath), "fm": fm, "has_fm": has_fm,
            "bytes": len(text.encode("utf-8"))}


def note(**keys):
    body = "---\n" + "\n".join(f"{k}: {v}" for k, v in keys.items()) + "\n---\n\n# X\n"
    return entry("docs/kb-notes/methodology-x.md", body)


# ── frontmatter parser ────────────────────────────────────────────────────
FM_BLOCK = """---
title: A note
tags: [methodology, cpl]
related:
  - "[[docs/INDEX]]"
  - "[[CLAUDE]]"
kb-status: published
---

# Body
"""
_lines, _start, _has = da.split_frontmatter(FM_BLOCK)
_fm, _order = da.parse_frontmatter(_lines)
check("parser: detects frontmatter", _has)
check("parser: inline list", _fm["tags"] == ["methodology", "cpl"])
check("parser: block list", len(_fm["related"]) == 2)
check("parser: key after a block list still parses", _fm.get("kb-status") == "published")
check("parser: no frontmatter → has_fm False", da.split_frontmatter("# Plain\n")[2] is False)
check("parser: unterminated frontmatter is not treated as frontmatter",
      da.split_frontmatter("---\ntitle: x\n\n# body\n")[2] is False)

# ── lane classification ───────────────────────────────────────────────────
check("lane: CLAUDE.md is always_loaded", da.lane_of("CLAUDE.md") == "always_loaded")
check("lane: kb-note", da.lane_of("docs/kb-notes/methodology-x.md") == "kb_note")
check("lane: session handoff", da.lane_of("docs/session_130_handoff.md") == "handoff")
check("lane: workstream handoff is NOT the session-handoff lane",
      da.lane_of("docs/cpl_funding_handoff.md") == "other")
check("lane: lessons", da.lane_of("docs/cpl_funding_lessons.md") == "lessons")
check("lane: index", da.lane_of("docs/INDEX.md") == "index")

# ── R3 — accepts every dialect the corpus actually uses ───────────────────
BASE = dict(title="T", **{"kb-status": "published"})
check("R3: canonical — type tag inside tags:",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", tags="[methodology, cpl]", **BASE)) is None)
check("R3: dialect — bare `type:` key accepted",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", type="methodology", tags="[cpl]", **BASE)) is None)
check("R3: dialect — `kb-type:` key accepted",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", **{"kb-type": "playbook"}, tags="[cpl]", **BASE)) is None)
check("R3: dialect — `date:` accepted in place of `created:`",
      da.rule_kb_note_frontmatter(note(date="2026-01-01", tags="[reference]", **BASE)) is None)
# …and still fires on the genuinely broken
check("R3: fires when NO dialect supplies a type",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", tags="[cpl, sierra]", **BASE)) is not None)
check("R3: `scope` is a valid type (adopted in practice, added to the taxonomy 2026-08-09)",
      da.rule_kb_note_frontmatter(note(date="2026-01-01", type="scope", tags="[tmc]", **BASE)) is None)
check("R3: fires on missing title",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", tags="[adr]", **{"kb-status": "published"})) is not None)
check("R3: fires on invalid kb-status",
      da.rule_kb_note_frontmatter(note(created="2026-01-01", tags="[adr]", title="T", **{"kb-status": "wip"})) is not None)
check("R3: fires when there is no date at all",
      da.rule_kb_note_frontmatter(note(tags="[adr]", **BASE)) is not None)
check("R3: ignores the lane README and _template",
      da.rule_kb_note_frontmatter(entry("docs/kb-notes/README.md", "# readme\n")) is None)

# ── R3b — reports dialect drift WITHOUT calling it a defect ───────────────
check("R3b: silent on the canonical dialect",
      da.rule_kb_note_dialect(note(created="2026-01-01", tags="[methodology]", **BASE)) is None)
check("R3b: flags `type:` drift",
      da.rule_kb_note_dialect(note(created="2026-01-01", type="methodology", **BASE)) is not None)
check("R3b: flags `date:` drift",
      da.rule_kb_note_dialect(note(date="2026-01-01", tags="[methodology]", **BASE)) is not None)
check("R3b: canonical tags: wins even when a redundant type: is present",
      da.rule_kb_note_dialect(note(created="2026-01-01", tags="[methodology]", type="methodology", **BASE)) is None)

# ── R1 — superseded handoffs ──────────────────────────────────────────────
H = "---\ntitle: h\n---\n\n# You are Session N\n"
check("R1: fires below the authoritative handoff",
      da.rule_superseded_handoff(entry("docs/session_100_handoff.md", H), 130) is not None)
check("R1: NEVER fires on the authoritative handoff",
      da.rule_superseded_handoff(entry("docs/session_130_handoff.md", H), 130) is None)
check("R1: silent once stamped (idempotent)",
      da.rule_superseded_handoff(
          entry("docs/session_100_handoff.md",
                "---\ntitle: h\nsuperseded: true\n---\n\n# x\n"), 130) is None)
check("R1: ignores workstream handoffs",
      da.rule_superseded_handoff(entry("docs/cpl_funding_handoff.md", H), 130) is None)
check("R1: no-op when the handoff lane is empty",
      da.rule_superseded_handoff(entry("docs/session_1_handoff.md", H), None) is None)

# ── R2 — lane budgets ─────────────────────────────────────────────────────
check("R2: an always_loaded file over budget fires",
      da.rule_oversized_doc({"lane": "always_loaded", "bytes": 88_546, "path": "CLAUDE.md"}) is not None)
check("R2: the same byte count is fine in the lessons lane",
      da.rule_oversized_doc({"lane": "lessons", "bytes": 88_546, "path": "docs/x_lessons.md"}) is None)

# ── R4 — a frontmatter field used as a changelog ──────────────────────────
check("R4: fires on a chained `prior:` log",
      da.rule_frontmatter_log_chain(
          entry("docs/INDEX.md",
                "---\nupdated: 2026-08-07 (a) · prior: 2026-08-06 (b) · prior: 2026-08-03 (c)\n---\n")) is not None)
check("R4: silent on an ordinary date field",
      da.rule_frontmatter_log_chain(entry("docs/INDEX.md", "---\nupdated: 2026-08-07\n---\n")) is None)

# ── R5 — a KB note missing from the index ─────────────────────────────────
check("R5: fires when the index never mentions the note",
      da.rule_unindexed_kb_note(note(created="2026-01-01", tags="[methodology]", **BASE),
                                "# Index\n- some other note\n") is not None)
check("R5: silent when the index links it",
      da.rule_unindexed_kb_note(note(created="2026-01-01", tags="[methodology]", **BASE),
                                "# Index\n- [x](kb-notes/methodology-x.md)\n") is None)

# ── R6 — vault weight must never hide markdown ────────────────────────────
tmp = tempfile.mkdtemp()
try:
    # artifacts/ is pure build output → safe to roll up.
    # docs/ is heavy too (attachments) but holds notes → must NOT be rolled up.
    os.makedirs(os.path.join(tmp, "artifacts"))
    os.makedirs(os.path.join(tmp, "docs"))
    with open(os.path.join(tmp, "artifacts", "big.json"), "wb") as fh:
        fh.write(b"0" * (da.VAULT_HEAVY_DIR + 1))
    with open(os.path.join(tmp, "docs", "attachment.pdf"), "wb") as fh:
        fh.write(b"0" * (da.VAULT_HEAVY_DIR + 1))
    with open(os.path.join(tmp, "docs", "note.md"), "w") as fh:
        fh.write("# a note the vault must keep\n")

    _saved, da.ROOT = da.ROOT, tmp          # rel() resolves against ROOT
    try:
        vf, vs = da.scan_vault_weight(tmp)
    finally:
        da.ROOT = _saved

    ignores = vs["ignore_filters"]
    check("R6: rolls up a markdown-free heavy directory",
          any(i.endswith("/artifacts") for i in ignores))
    check("R6: NEVER rolls up a directory containing markdown",
          not any(i.endswith("/docs") for i in ignores))
    check("R6: still names the heavy attachment inside docs/",
          any(i.endswith("docs/attachment.pdf") for i in ignores))
    check("R6: never names a markdown file",
          not any(i.endswith(".md") for i in ignores))
    check("R6: counts the whole tree", vs["files"] == 3)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── R6 must not count the auditor's OWN receipts ──────────────────────────
# Self-reference bug: writing this run's JSON changes its size, so the next run
# reported a different vault total and the committed receipt churned forever —
# one no-op line of diff per run, enough to trip the stop-hook.
tmp = tempfile.mkdtemp()
try:
    out = os.path.join(tmp, "kb", "docs_audit")
    os.makedirs(out)
    with open(os.path.join(out, "2026-01-01.json"), "wb") as fh:
        fh.write(b"0" * (da.VAULT_HEAVY_FILE + 1))
    with open(os.path.join(tmp, "payload.bin"), "wb") as fh:
        fh.write(b"0" * (da.VAULT_HEAVY_FILE + 1))

    _sr, _so = da.ROOT, da.OUT_DIR
    da.ROOT, da.OUT_DIR = tmp, out
    try:
        _vf, vs = da.scan_vault_weight(tmp)
    finally:
        da.ROOT, da.OUT_DIR = _sr, _so

    check("R6: excludes the auditor's own output dir (no self-reference)",
          not any("docs_audit" in i for i in vs["ignore_filters"]))
    check("R6: still counts everything else", vs["files"] == 1)
    check("R6: vault total ignores our receipts",
          vs["bytes"] == da.VAULT_HEAVY_FILE + 1)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# payload must carry no wall-clock stamp — a sub-day timestamp is what made
# committed receipts churn on every re-run
import inspect as _inspect
_src = _inspect.getsource(da.main)
check("determinism: payload carries no sub-day timestamp",
      "generated_at" not in _src)

# ── --apply mutation invariants ───────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    d = os.path.join(tmp, "docs")
    os.makedirs(d)
    with open(os.path.join(d, "session_10_handoff.md"), "w") as fh:
        fh.write("---\ntitle: ten\n---\n\n# You are Session 10\n")
    with open(os.path.join(d, "session_11_handoff.md"), "w") as fh:
        fh.write("# You are Session 11\n")            # no frontmatter at all
    with open(os.path.join(d, "session_12_handoff.md"), "w") as fh:
        fh.write("---\ntitle: twelve\n---\n\n# You are Session 12\n")

    _saved, da.ROOT = da.ROOT, tmp
    try:
        findings = [{"rule": "superseded_handoff", "path": "docs/session_10_handoff.md"},
                    {"rule": "superseded_handoff", "path": "docs/session_11_handoff.md"}]
        changed = da.apply_superseded(findings, 12, verbose=False)
        t10 = open(os.path.join(d, "session_10_handoff.md")).read()
        t11 = open(os.path.join(d, "session_11_handoff.md")).read()
        t12 = open(os.path.join(d, "session_12_handoff.md")).read()
    finally:
        da.ROOT = _saved

    check("apply: stamped both targets", len(changed) == 2)
    check("apply: existing frontmatter gains the key", "superseded: true" in t10)
    check("apply: existing title survives", "title: ten" in t10)
    check("apply: points at the authoritative handoff",
          "superseded_by: session_12_handoff.md" in t10)
    check("apply: creates frontmatter when there was none", t11.startswith("---\n"))
    check("apply: original body survives the new frontmatter", "# You are Session 11" in t11)
    check("apply: the AUTHORITATIVE handoff is untouched", "superseded" not in t12)
    check("apply: stamped file re-parses as valid frontmatter",
          da.parse_frontmatter(da.split_frontmatter(t10)[0])[0].get("superseded") == "true")
    check("apply: re-running finds nothing to do (idempotent)",
          da.rule_superseded_handoff(entry("docs/session_10_handoff.md", t10), 12) is None)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── superseded_handoff: parallel siblings ─────────────────────────────────
# Sam runs CONCURRENT sessions. On 2026-08-10 two checkpointed independently
# (SkyDeck 136, SkyLine 137) and --apply stamped 136 superseded — false, since
# 137 does not carry the deck workstream. A mechanical rule silently discarding a
# live document is the failure this file exists to catch, so it must not commit
# it. Same-day handoffs are siblings, not a chain.
def _handoff(n, created):
    return {"lane": "handoff", "path": f"docs/session_{n}_handoff.md",
            "rel": f"docs/session_{n}_handoff.md", "has_fm": True,
            "fm": {"created": created}}

check("handoff: a lower-numbered handoff from an EARLIER day is superseded",
      da.rule_superseded_handoff(_handoff(134, "2026-08-09"), 137, "2026-08-10") is not None)

check("handoff: a SAME-DAY sibling is NOT superseded (parallel sessions)",
      da.rule_superseded_handoff(_handoff(136, "2026-08-10"), 137, "2026-08-10") is None)

check("handoff: the authoritative one is never flagged",
      da.rule_superseded_handoff(_handoff(137, "2026-08-10"), 137, "2026-08-10") is None)

check("handoff: with no authoritative date known, the old behaviour holds",
      da.rule_superseded_handoff(_handoff(134, "2026-08-09"), 137, None) is not None)

_already = _handoff(130, "2026-08-01"); _already["fm"]["superseded"] = "true"
check("handoff: an already-stamped handoff is not re-flagged (idempotent)",
      da.rule_superseded_handoff(_already, 137, "2026-08-10") is None)

# ── stacked_roadmap_cell ──────────────────────────────────────────────────
# Guards the failure Sam diagnosed 2026-08-10: checkpoint discipline was fine,
# but NOTHING RETIRED, so CLAUDE.md asserted contradictory things at once and the
# same correction had to be made on two consecutive days. The rule must fire on a
# cell that has become a log, and must NOT fire on an ordinary current-state cell
# — a guard that flags healthy input gets muted, which is how three earlier rules
# in this same file nearly shipped broken.
import tempfile as _tf_unused, os as _os, re

def _claude_md_with(cell_status):
    body = ("### Roadmap\n\n| Phase | What | Status |\n|---|---|---|\n"
            f"| **Test row** | a thing | {cell_status} |\n\n"
            "The auditor is the foundational instrument for everything.\n")
    fd, path = tempfile.mkstemp(suffix=".md"); _os.write(fd, body.encode()); _os.close(fd)
    return {"rel": "CLAUDE.md", "path": path}

_healthy = _claude_md_with("in progress — one clear sentence about where this stands.")
check("stacked cell: silent on an ordinary current-state cell",
      da.rule_stacked_roadmap_cell(_healthy) is None)

_logged = _claude_md_with("done. " + ("x" * 5000) + " *Prior:* old. *Prior:* older.")
_f = da.rule_stacked_roadmap_cell(_logged)
check("stacked cell: fires on an oversized cell with stacked *Prior:* markers",
      _f is not None and _f["rule"] == "stacked_roadmap_cell")
check("stacked cell: reports the offending row and its size",
      _f is not None and _f["detail"]["cells"][0]["chars"] > da.CELL_MAX_CHARS
      and _f["detail"]["cells"][0]["priors"] == 2)

# Two *Prior:* markers alone are enough — a short cell can still be a log.
_short_log = _claude_md_with("now. *Prior:* then. *Prior:* before that.")
check("stacked cell: fires on stacked *Prior:* even when the cell is short",
      da.rule_stacked_roadmap_cell(_short_log) is not None)

# One *Prior:* is legitimate context, not a log.
_one_prior = _claude_md_with("current state. *Prior:* the thing it replaced.")
check("stacked cell: tolerates a single *Prior:* as context",
      da.rule_stacked_roadmap_cell(_one_prior) is None)

check("stacked cell: ignores docs outside §11 and the lane files",
      da.rule_stacked_roadmap_cell({"rel": "docs/other.md", "path": _logged["path"]}) is None)

# ── the two bypasses found on 2026-08-28 while moving §11's detail out ────
# Both are the same shape: a guard that passes because it is not looking. The
# rule split rows on a bare "|" and skipped anything with fewer than four, so
# the TWO LARGEST CELLS in the live table were invisible to it — the largest
# (4,930 chars, over the cap) because its row was missing a trailing pipe, and
# the second (4,447) because `1|2,3|4` inside a code span truncated the split.
_no_pipe = _claude_md_with("x" * 4500)
_no_pipe_body = open(_no_pipe["path"], encoding="utf-8").read().replace(
    "x" * 4500 + " |", "x" * 4500)
open(_no_pipe["path"], "w", encoding="utf-8").write(_no_pipe_body)
check("stacked cell: an oversized cell whose row is missing its trailing pipe still fires",
      da.rule_stacked_roadmap_cell(_no_pipe) is not None)

# Assert it fires as an OVERSIZED cell, not as a malformed row — under the old
# naive split this input also produced a finding, but for the wrong reason, so a
# bare is-not-None here would pass on the very parser it is meant to reject.
_code_pipes = _claude_md_with("`1|2,3|4` " + "x" * 4500)
_cp = da.rule_stacked_roadmap_cell(_code_pipes)
check("stacked cell: pipes inside a code span do not truncate the measured cell",
      _cp is not None and _cp["detail"]["cells"][0]["malformed"] == 0
      and _cp["detail"]["cells"][0]["chars"] > da.CELL_MAX_CHARS)

_code_ok = _claude_md_with("`1|2,3|4` live — [lane state](x.md)")
check("stacked cell: a healthy cell containing code-span pipes stays silent",
      da.rule_stacked_roadmap_cell(_code_ok) is None)

_malformed = _claude_md_with("live | stray")
check("stacked cell: a row it cannot parse is a finding, never an exemption",
      (_m := da.rule_stacked_roadmap_cell(_malformed)) is not None
      and _m["detail"]["cells"][0]["malformed"] == 4)

# The lane files are the surface the detail moved TO, so the rule follows it.
import tempfile as _tf
_fd, _lane_path = _tf.mkstemp(suffix=".md")
_os.write(_fd, b"current state. *Prior:* a. *Prior:* b."); _os.close(_fd)
check("stacked cell: a lane file stacking *Prior:* markers fires",
      da.rule_stacked_roadmap_cell(
          {"rel": "docs/reference/lanes/x.md", "path": _lane_path}) is not None)
_os.unlink(_lane_path)

check("lane budget: docs/reference/lanes/ is its own budget lane, not `other`",
      da.lane_of("docs/reference/lanes/esl-packaging.md") == "roadmap_lane"
      and da.THRESHOLDS["roadmap_lane"] < da.THRESHOLDS["other"])

for _e in (_no_pipe, _code_pipes, _code_ok, _malformed):
    _os.unlink(_e["path"])

for _e in (_healthy, _logged, _short_log, _one_prior):
    _os.unlink(_e["path"])

# ── unreferenced_offload ──────────────────────────────────────────────────
# Guards the failure the 2026-08-28 consolidation itself committed: it moved
# §11's 29 lane cells to docs/reference/lanes/, updated the /checkpoint slash
# command, and left Rule 9 in CLAUDE.md naming only the three 2026-07-10
# pare-down files. The slash command is the PULLED path; Rule 9 is the PUSHED
# one. A missing pointer is silent by construction — the offloaded file is fine,
# the always-loaded file is fine, only the LINK is gone.
import shutil as _sh

def _repo_with(offloads, claude_text):
    d = _tf.mkdtemp()
    _os.makedirs(_os.path.join(d, "docs", "reference"), exist_ok=True)
    for name, body in offloads.items():
        fp = _os.path.join(d, "docs", "reference", name)
        _os.makedirs(_os.path.dirname(fp), exist_ok=True)
        open(fp, "w", encoding="utf-8").write(body)
    cp = _os.path.join(d, "CLAUDE.md")
    open(cp, "w", encoding="utf-8").write(claude_text)
    return d, {"rel": "CLAUDE.md", "path": cp}

_d, _e = _repo_with({"lanes/funding.md": "# lane"}, "# CLAUDE\nnothing points anywhere.\n")
_u = da.rule_unreferenced_offload(_e, _d)
check("unreferenced offload: fires when an offload is named nowhere in CLAUDE.md",
      _u is not None and _u["detail"]["missing"] == ["lanes/"])
_sh.rmtree(_d)

_d, _e = _repo_with({"lanes/funding.md": "# lane"},
                    "# CLAUDE\nstate lives in docs/reference/lanes/ now.\n")
check("unreferenced offload: silent when CLAUDE.md names the path",
      da.rule_unreferenced_offload(_e, _d) is None)
_sh.rmtree(_d)

# ⚠️ The first cut matched the BARE name and passed on a deliberately broken
# file, because CLAUDE.md happens to say "Three doc lanes in this repo" for an
# unrelated reason. A guard satisfied by a common English word never fires.
_d, _e = _repo_with({"lanes/funding.md": "# lane"},
                    "# CLAUDE\nThree doc lanes in this repo, by lifecycle.\n")
check("unreferenced offload: a bare directory word does NOT satisfy the pointer",
      da.rule_unreferenced_offload(_e, _d) is not None)
_sh.rmtree(_d)

# Reachability, not direct mention — the standard unindexed_kb_note already uses.
_d, _e = _repo_with(
    {"statute/README.md": "# texts",
     "lanes/t5.md": "source texts in docs/reference/statute/"},
    "# CLAUDE\nsee docs/reference/lanes/t5.md\n")
check("unreferenced offload: one hop through a doc CLAUDE.md points at counts",
      da.rule_unreferenced_offload(_e, _d) is None)
_sh.rmtree(_d)

# A directory with no prose in it is not an offload.
_d, _e = _repo_with({"pdfs/x.txt": "raw"}, "# CLAUDE\nnothing.\n")
check("unreferenced offload: a directory holding no markdown is not an offload",
      da.rule_unreferenced_offload(_e, _d) is None)
_sh.rmtree(_d)

check("unreferenced offload: ignores docs that are not CLAUDE.md",
      da.rule_unreferenced_offload({"rel": "docs/other.md", "path": __file__}, ".") is None)

# ── checkpoint_overdue ────────────────────────────────────────────────────
# Rule 9's own trigger is "roughly every ~100K tokens... Claude Code doesn't
# expose an exact counter" — a condition nothing can observe, which is the same
# defect that left 04-projects/SESSION-NOTES.md 41 days stale. Commits since the
# newest handoff IS observable. Threshold measured over ~220 commits: handoffs
# land every 1-3 (median 2, p90 5, max 9), so 6 fires on the tail.
import subprocess as _sp

def _git_repo(handoff="session_9_handoff.md", extra_commits=0):
    d = _tf.mkdtemp()
    _os.makedirs(_os.path.join(d, "docs"))
    if handoff:
        open(_os.path.join(d, "docs", handoff), "w").write("# handoff\n")
    for cmd in (["git","init","-q"], ["git","config","user.email","t@t"],
                ["git","config","user.name","t"], ["git","add","-A"],
                ["git","commit","-qm","base","--allow-empty"]):
        _sp.run(cmd, cwd=d, capture_output=True)
    for i in range(extra_commits):
        open(_os.path.join(d, f"w{i}.txt"), "w").write("x")
        _sp.run(["git","add","-A"], cwd=d, capture_output=True)
        _sp.run(["git","commit","-qm",f"w{i}"], cwd=d, capture_output=True)
    return d

_d = _git_repo(extra_commits=8)
_f = da.rule_checkpoint_overdue(_d)
check("checkpoint overdue: fires when work outran the handoff",
      _f is not None and _f["detail"]["commits_since"] == 8)
_sh.rmtree(_d)

_d = _git_repo(extra_commits=2)
check("checkpoint overdue: silent within the normal 1-3 commit rhythm",
      da.rule_checkpoint_overdue(_d) is None)
_sh.rmtree(_d)

# ⚠️ FAIL-SOFT. A lint that cannot measure must say NOTHING rather than report a
# clean bill — claiming "you are fine" without looking is exactly how the other
# guards in this file failed.
_d = _tf.mkdtemp(); _os.makedirs(_os.path.join(_d, "docs"))
open(_os.path.join(_d, "docs", "session_9_handoff.md"), "w").write("# h\n")
check("checkpoint overdue: silent with NO git repo (fail-soft, not a clean bill)",
      da.rule_checkpoint_overdue(_d) is None)
_sh.rmtree(_d)

_d = _git_repo(handoff=None, extra_commits=9)
check("checkpoint overdue: silent when there are no handoffs to measure against",
      da.rule_checkpoint_overdue(_d) is None)
_sh.rmtree(_d)

# ── self_corrected_word_pair ──────────────────────────────────────────────
# The sweeper ate its own rule: `american_spelling` rewrote `whilst`/`amongst`
# INSIDE the parenthetical that named them, leaving "while (not while)" in the
# always-loaded file for weeks. Nothing could flag it by spelling — both halves
# are correct American English.
def _tmp_md(body):
    fd, path = _tf.mkstemp(suffix=".md"); _os.write(fd, body.encode()); _os.close(fd)
    return {"rel": "CLAUDE.md", "path": path}

_corrupt = _tmp_md("Use while (not while) and among (not among) in prose.")
_f = da.rule_self_corrected_word_pair(_corrupt)
check("self-corrected pair: fires when both sides name the same word",
      _f is not None and _f["detail"]["count"] == 2)
_os.unlink(_corrupt["path"])

# The fix is a code span, because prose_only() masks those. This asserts the FIX
# is recognised, not merely that the corruption is — a guard that flags the
# repaired form too would just get muted.
_fixed = _tmp_md("Use while (not `whilst`) and among (not `amongst`) in prose.")
check("self-corrected pair: silent once the named form is in a code span",
      da.rule_self_corrected_word_pair(_fixed) is None)
_os.unlink(_fixed["path"])

_ok = _tmp_md("Use color (not colour) and behavior (not behaviour).")
check("self-corrected pair: silent on a healthy pair naming two DIFFERENT words",
      da.rule_self_corrected_word_pair(_ok) is None)
_os.unlink(_ok["path"])

# ── unreferenced_offload now covers .claude/skills/ ───────────────────────
# A skill is PULL content reached by a trigger, exactly like a reference doc —
# and `.claude/skills/` sits outside the corpus walk (0 of 732 files), so a
# skill nobody points at was invisible. Found by kb/_doctrine_scenarios.py while
# the M-ID re-mint rules were about to be moved into one.
_d, _e = _repo_with({}, "# CLAUDE\nno mention of any skill.\n")
_os.makedirs(_os.path.join(_d, ".claude", "skills", "mid-remint"), exist_ok=True)
open(_os.path.join(_d, ".claude", "skills", "mid-remint", "SKILL.md"),
     "w", encoding="utf-8").write("# M-ID re-mint\n")
_u = da.rule_unreferenced_offload(_e, _d)
check("unreferenced offload: a skill CLAUDE.md never names is a finding",
      _u is not None and any("mid-remint" in m for m in _u["detail"]["missing"]))
_sh.rmtree(_d)

# ⚠️ It must find that WITHOUT docs/reference/ existing. The first cut returned
# early when that directory was absent, so the skills check never ran at all.
# ⚠️ Built WITHOUT docs/reference/ on purpose. `_repo_with` always creates that
# directory, so using it here would have made this test pass no matter what --
# which is exactly what happened on the first cut: the early return was restored
# and the suite stayed green.
_d2 = _tf.mkdtemp()
_os.makedirs(_os.path.join(_d2, ".claude", "skills", "mid-remint"), exist_ok=True)
open(_os.path.join(_d2, ".claude", "skills", "mid-remint", "SKILL.md"),
     "w", encoding="utf-8").write("# M-ID re-mint\n")
_cp2 = _os.path.join(_d2, "CLAUDE.md")
open(_cp2, "w", encoding="utf-8").write("# CLAUDE\nno mention of any skill.\n")
_u2 = da.rule_unreferenced_offload({"rel": "CLAUDE.md", "path": _cp2}, _d2)
check("unreferenced offload: finds an unnamed skill even with NO docs/reference/",
      _u2 is not None and any("mid-remint" in m for m in _u2["detail"]["missing"]))
_sh.rmtree(_d2)

# ── presentation_doctrine ─────────────────────────────────────────────────
# Sam, 2026-08-28: make sure the formatting preferences are preserved and
# properly prioritized. They are the purest PUSH case in the corpus — nobody
# queries a formatting rule before typing — and "PLAIN WORDS, NO GLYPHS" has now
# been lost twice the same way: recorded in cpl_memory on 2026-08-14 while the
# Admin tab shipped covered in emoji that week, then carried out of CLAUDE.md
# entirely when the consolidation relocated the §11 row that held it.
_SECTION = "## Presentation rules"

def _claude_presentation(bullets):
    body = (_SECTION + " — test\n\nintro prose naming NO GLYPHS and First Light "
            "in a post-mortem, which must NOT satisfy anything.\n\n"
            + "\n".join(bullets) + "\n\n## Next section\n")
    fd, path = _tf.mkstemp(suffix=".md"); _os.write(fd, body.encode()); _os.close(fd)
    return {"rel": "CLAUDE.md", "path": path}

_ALL = [
    "- **FIRST LIGHT, ALWAYS.** do not invent a palette.",
    "- **ACCESSIBLE TO TODAY'S STANDARDS.** AA 4.5:1, aria-label, focus-visible.",
    "- **MOBILE-FRIENDLY, ALWAYS.** single column below ~560px.",
    "- **PLAIN WORDS, NOT GLYPHS.** every control is a word, never a decorative emoji.",
    "- **AMERICAN SPELLING, ALWAYS.**",
    "- **No horizontal scroll whenever feasible.**",
    "- **PROSE RUNS THE FULL WIDTH.** `--cpl-measure`.",
]
_e = _claude_presentation(_ALL)
check("presentation doctrine: silent when every rule is stated",
      da.rule_presentation_doctrine(_e) is None)
_os.unlink(_e["path"])

# ⚠️ The first cut searched the WHOLE file and did not fire when the glyph rule
# was deleted, because the section's own preamble names it while explaining how
# it was once lost. A doctrine-presence check keyed on a rule's NAME is satisfied
# by the post-mortem about losing it, so it reads the rule BULLETS only.
for _i in range(len(_ALL)):
    _short = _ALL[:_i] + _ALL[_i + 1:]
    _e = _claude_presentation(_short)
    _f = da.rule_presentation_doctrine(_e)
    _os.unlink(_e["path"])
    check(f"presentation doctrine: deleting rule {_i + 1} reports exactly one topic",
          _f is not None and len(_f["detail"]["missing"]) == 1)

_e = _claude_presentation([])
_e2 = {"rel": "CLAUDE.md", "path": _e["path"]}
open(_e["path"], "w", encoding="utf-8").write("# CLAUDE\nno such section.\n")
_f = da.rule_presentation_doctrine(_e2)
check("presentation doctrine: a missing section is itself the finding",
      _f is not None and _f["detail"]["missing"] == ["(the whole section)"])
_os.unlink(_e["path"])

check("presentation doctrine: ignores docs that are not CLAUDE.md",
      da.rule_presentation_doctrine({"rel": "docs/x.md", "path": __file__}) is None)

# ⚠️ Run the SAME check against the REAL CLAUDE.md. The synthetic fixture above
# passed while the live file had two false passes: Sam's quote inside the First
# Light bullet ("make it always accessible and mobile friendly") satisfied both
# the accessibility and mobile patterns, so either rule could have been deleted
# in full and this stayed silent. A fixture is only as good as its messiness.
_LIVE = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))),
                      "CLAUDE.md")
if _os.path.isfile(_LIVE):
    _full = open(_LIVE, encoding="utf-8").read()
    check("presentation doctrine: the live CLAUDE.md states every rule",
          da.rule_presentation_doctrine({"rel": "CLAUDE.md", "path": _LIVE}) is None)
    _s = _full.index("## Presentation rules")
    _n = _full.find("\n## ", _s + 1)
    _sec = _full[_s:_n]
    _bs = [m.start() for m in re.finditer(r"\n- \*\*", _sec)] + [len(_sec)]
    _one_to_one = True
    for _i in range(len(_bs) - 1):
        _b = _sec[_bs[_i]:_bs[_i + 1]]
        _fd, _p = _tf.mkstemp(suffix=".md")
        _os.write(_fd, (_full[:_s] + _sec.replace(_b, "\n") + _full[_n:]).encode())
        _os.close(_fd)
        _f = da.rule_presentation_doctrine({"rel": "CLAUDE.md", "path": _p})
        _os.unlink(_p)
        if not (_f and len(_f["detail"]["missing"]) == 1):
            _one_to_one = False
    check("presentation doctrine: each LIVE rule bullet is guarded 1:1 "
          "(no rule satisfied by a neighbour's wording)", _one_to_one)

# ── critical_rule_doctrine ────────────────────────────────────────────────
# Run against the LIVE CLAUDE.md, not a fixture. The synthetic fixture for
# presentation_doctrine passed while the live file failed, because the fixture
# had no quotation in it — a guard checked only against text written to satisfy
# it is not checked at all.
if _os.path.isfile(_LIVE):
    _full = open(_LIVE, encoding="utf-8").read()
    check("critical rule doctrine: the live CLAUDE.md states every claim",
          da.rule_critical_rule_doctrine({"rel": "CLAUDE.md", "path": _LIVE}) is None)

    _s = _full.index("## Critical Rules")
    _n = _full.find("\n## ", _s + 1)
    _sec = _full[_s:_n] if _n != -1 else _full[_s:]

    # ⚠️ Redact against the FLATTENED section — the text the guard actually
    # reads. Redacting the raw section silently removes NOTHING for any claim
    # that wraps across lines, and the perturbation then "passes" by reporting
    # no finding, which reads identically to a guard that cannot see the
    # deletion. Rule 10 ("fresh live read at write-time" wraps after "read")
    # did exactly that while this test was being written.
    _flat_sec = da._flat(_sec)
    _one_to_one, _detail = True, []
    for _claim, _pats in da.CRITICAL_RULE_DOCTRINE.items():
        _mod = _flat_sec
        for _pat in _pats:
            _mod = re.sub(da._flat(_pat), "REDACTED", _mod, flags=re.I)
        if _mod == _flat_sec:
            _one_to_one = False
            _detail.append(f"{_claim}: patterns matched nothing to redact")
            continue
        _fd, _p2 = _tf.mkstemp(suffix=".md")
        _os.write(_fd, (_full[:_s] + _mod + (_full[_n:] if _n != -1 else "")).encode())
        _os.close(_fd)
        _f = da.rule_critical_rule_doctrine({"rel": "CLAUDE.md", "path": _p2})
        _os.unlink(_p2)
        if not (_f and _f["detail"]["missing"] == [_claim]):
            _one_to_one = False
            _detail.append(f"{_claim}: got {_f['detail']['missing'] if _f else None}")
    check("critical rule doctrine: each claim is guarded 1:1 "
          "(no claim satisfied by a neighbour's wording) " + "; ".join(_detail),
          _one_to_one)

    # _flat is load-bearing, not a tidy-up: prove at least one live claim is
    # only findable after whitespace collapse, so deleting _flat fails here.
    _wrapped = [c for c, ps in da.CRITICAL_RULE_DOCTRINE.items()
                if any(re.search(da._flat(x), _flat_sec, re.I) and
                       not re.search(da._flat(x), _sec, re.I) for x in ps)]
    check("critical rule doctrine: _flat is load-bearing "
          f"(claims findable only after collapsing whitespace: {len(_wrapped)})",
          len(_wrapped) >= 1)

# ── lane_retirement_signal ────────────────────────────────────────────────
_LANES = _os.path.join(ROOT, "docs", "reference", "lanes")
if _os.path.isdir(_LANES):
    # Ground truth, established 2026-08-29 by READING all 30 lane files one by
    # one: every lane carries open work, so nothing is retirable. Three separate
    # greps got this wrong first. If this assertion ever fails, a lane really
    # may have finished — go read it, do not delete the assertion.
    _f = da.rule_lane_retirement_signal(ROOT)
    check("lane retirement: the live corpus agrees with the per-file read "
          f"(quiet lanes: {_f['detail']['lanes'] if _f else []})",
          _f is None)

    # And prove it can FAIL. A guard that only ever passes is not a guard.
    _d = _tf.mkdtemp()
    _os.makedirs(_os.path.join(_d, "docs", "reference", "lanes"))
    _finished = _os.path.join(_d, "docs", "reference", "lanes", "done.md")
    open(_finished, "w").write(
        "---\ntitle: done\n---\n\n> Relocated verbatim from CLAUDE.md.\n\n"
        "# Done\n\n## Status\n\n✅ LIVE. Everything shipped and stable.\n")
    _f2 = da.rule_lane_retirement_signal(_d)
    check("lane retirement: fires on a lane stating no open work",
          bool(_f2) and _f2["detail"]["lanes"] == ["done"])

    # The relocation banner is boilerplate on EVERY lane file. A marker inside
    # it must not count, or the rule reads the template instead of the lane.
    open(_finished, "w").write(
        "---\ntitle: done\n---\n\n> Relocated verbatim. NEXT: update at every\n"
        "> checkpoint. BLOCKED on nothing.\n\n# Done\n\n## Status\n\n✅ LIVE.\n")
    _f3 = da.rule_lane_retirement_signal(_d)
    check("lane retirement: a marker inside the relocation banner does not count",
          bool(_f3) and _f3["detail"]["lanes"] == ["done"])

    # Each real marker shape seen in the live corpus is matched.
    for _txt, _label in (("**Next:** do the thing", "Next:"),
                         ("**Next by value÷effort:** thing", "Next by …:"),
                         ("**NEEDS SAM (4 questions)**", "bare NEEDS SAM"),
                         ("**BLOCKED ON JENNI:** thing", "bare BLOCKED"),
                         ("**Open:** 12 titles absent", "Open:"),
                         ("**Still queued:** cluster_title_drift", "Still queued"),
                         ("**Remaining: P3** and P5", "Remaining:"),
                         ("blocked only by `read_projects`", "lowercase blocked")):
        open(_finished, "w").write(
            "---\ntitle: done\n---\n\n> Relocated verbatim.\n\n# Done\n\n"
            f"## Status\n\n✅ LIVE. {_txt}\n")
        check(f"lane retirement: recognizes {_label}",
              da.rule_lane_retirement_signal(_d) is None)
    _sh.rmtree(_d, ignore_errors=True)

# ── probe_instrument_leak ─────────────────────────────────────────────────
check("probe instrument leak: clean once the rubric lives in the vault",
      da.rule_probe_instrument_leak(ROOT) is None)

_d = _tf.mkdtemp()
_os.makedirs(_os.path.join(_d, "docs", "scenarios"))
open(_os.path.join(_d, "docs", "scenarios", "rubric.md"), "w").write("# rubric\n")
_f = da.rule_probe_instrument_leak(_d)
check("probe instrument leak: fires when the rubric returns to the repo",
      bool(_f) and "docs/scenarios/rubric.md" in _f["detail"]["paths"])

_os.makedirs(_os.path.join(_d, "docs", "scenarios", "probes"))
_f = da.rule_probe_instrument_leak(_d)
check("probe instrument leak: fires on a probes/ directory too",
      bool(_f) and "docs/scenarios/probes/" in _f["detail"]["paths"])

# The METHOD may stay — only the instruments leak. A rule that also flagged
# README.md would push the methodology out of the corpus for no benefit.
_sh.rmtree(_os.path.join(_d, "docs", "scenarios", "probes"))
_os.unlink(_os.path.join(_d, "docs", "scenarios", "rubric.md"))
open(_os.path.join(_d, "docs", "scenarios", "README.md"), "w").write("# method\n")
check("probe instrument leak: docs/scenarios/README.md alone is fine",
      da.rule_probe_instrument_leak(_d) is None)
_sh.rmtree(_d, ignore_errors=True)

# ── probe topic quoted in a doc about the probes ──────────────────────────
# The post-mortem re-leaked the thing: within an hour of moving the instruments
# out, the write-ups EXPLAINING the leak had put a probe's topic phrase back on
# main in four files -- in documents that also say what the probe is scored on.
check("probe instrument leak: no doc about the probes quotes a probe topic",
      da.rule_probe_instrument_leak(ROOT) is None)

_d = _tf.mkdtemp()
_os.makedirs(_os.path.join(_d, "docs", "scenarios"))
_wp = _os.path.join(_d, "docs", "scenarios", "writeup.md")
# A doc that discusses the probes AND quotes a topic phrase -> must fire.
open(_wp, "w").write(
    "# The probe rubric leak\nP5's scenario turned on the "
    "comprehensive-vs-carve-out split, which matched one file.\n")
_f = da.rule_probe_instrument_leak(_d)
check("probe topic quote: fires on a probe write-up that reproduces the phrase",
      bool(_f) and _f["detail"]["topic_quoted_in"] == ["docs/scenarios/writeup.md"])

# The SAME phrase in a doc that is not about the probes is real content, not a
# leak. `relevel bands` and friends belong to the ESL lane and must stay legible.
open(_wp, "w").write(
    "# ESL relevel\nThe comprehensive-vs-carve-out split is decided before "
    "banding.\n")
check("probe topic quote: does NOT fire on genuine content outside a probe doc",
      da.rule_probe_instrument_leak(_d) is None)

# And the lint must not itself contain the secrets it detects.
_src = open(_os.path.join(ROOT, "kb", "_docs_audit.py"), encoding="utf-8").read()
check("probe topic quote: the lint stores hashes, never the phrases",
      not da._probe_topic_hits(_src))
_sh.rmtree(_d, ignore_errors=True)

# ── report renders ────────────────────────────────────────────────────────
_payload = {"generated": "2026-01-01",
            "summary": {"files": 1, "bytes": 10, "over_budget": 0, "handoff_max": 130,
                        "always_loaded_files": 1, "always_loaded_bytes": 10,
                        "superseded_files": 0, "superseded_bytes": 0,
                        "lanes": {"other": {"files": 1, "bytes": 10, "over": 0}},
                        "by_rule": {},
                        "vault": {"files": 1, "bytes": 10, "heavy_bytes": 0,
                                  "heavy_share": 0.0, "ignore_filters": []}},
            "findings": []}
check("report: renders a clean corpus without raising",
      "Docs-corpus audit" in da.build_report(_payload))

# ── summary ───────────────────────────────────────────────────────────────
failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ok   " if ok else "  FAIL ") + n)
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
