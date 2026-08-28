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
import tempfile, os as _os

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
