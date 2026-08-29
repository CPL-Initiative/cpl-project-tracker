#!/usr/bin/env python3
"""
Docs-corpus auditor — the prose counterpart to `kb/_row_audit.py`.

Purpose
-------
`_row_audit.py` keeps the DATA honest. Nothing keeps the PROSE honest, and the
docs corpus is now the larger of the two: ~600 markdown files, of which the
append-only lanes (lessons docs, session handoffs, the roadmap archive) grow
every checkpoint and are never compacted.

That asymmetry has a cost with a specific shape. Rule 8 gives us **ingest**
(`/checkpoint` writes) and sessions give us **query** (they read the docs). The
third operation — **lint** — has never existed, so the corpus accretes. The
failure mode is not "we lost something"; it is "a session finds the stale copy
and believes it", which has already happened once (a greeting citing session
handoff 105 when the authoritative one was 111 — see CLAUDE.md Rule 8).

This auditor is READ-ONLY by default. It reports; it does not tidy. The single
exception is `--apply`, which performs exactly one mutation (R1 below) and
nothing else, ever.

Rules
-----
  R1 superseded_handoff    — a `session_<N>_handoff.md` below the highest N that
                             is not stamped `superseded: true`. **FIXABLE.**
                             CLAUDE.md Rule 8 already declares only the highest
                             authoritative; this makes that machine-readable so
                             Obsidian search and future sessions can filter.
  R2 oversized_doc         — a file past its lane's compaction threshold. Lanes
                             have different budgets: an always-loaded file costs
                             every session, a KB note is supposed to be one
                             distilled concept, a lessons doc is allowed to be
                             long but not unbounded.
  R3 kb_note_frontmatter   — a KB note genuinely violating the contract in
                             `docs/kb-notes/README.md`: no title, no usable
                             `kb-status`, no creation date, or no type declared
                             by ANY dialect (see R3b).
  R3b kb_note_dialect      — a KB note that IS well-formed but declares itself in
                             a non-canonical dialect. Informational, not a defect.
                             The corpus grew three ways to state a type (`tags:`,
                             `type:`, `kb-type:`) and two to state a creation date
                             (`created:`, `date:`). A lint that called those 52
                             notes "broken" would be a guard that fails on truth,
                             and would get muted within a week — see
                             `docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md`.
                             So R3 accepts every dialect and R3b merely counts the drift,
                             leaving normalisation as Sam's call rather than the tool's.
  R4 frontmatter_log_chain — a frontmatter scalar that has become an append-only
                             log. `docs/INDEX.md`'s `updated:` is the worked
                             example: one line chaining six `prior:` entries.
  R5 unindexed_kb_note     — a KB note reachable from neither `docs/INDEX.md`
                             nor a `docs/catalog/*.md` that INDEX links to. The
                             index is the declared Obsidian entry point; a note
                             missing from it is unreachable by browsing.
  R6 vault_heavy_path      — a heavy non-markdown path that an Obsidian vault
                             containing this repo has to watch. This repo is
                             cloned INTO the vault, so its working tree is vault
                             weight; the report emits a paste-able
                             `userIgnoreFilters` block. NB Obsidian's exclusion
                             list is a *relevance* filter (search, graph, link
                             autocomplete) — it does not stop the file watcher or
                             Sync, so exclusion helps browsing, not load time.
                             The only real fix for load time is not keeping
                             hundreds of MB of build artifacts inside the vault.

Output
------
  kb/docs_audit/<YYYY-MM-DD>.json   — full findings (machine)
  kb/docs_audit/<YYYY-MM-DD>.md     — ranked report + context budget (human)
  kb/docs_audit/latest.json         — copy of the latest run

Run from repo root:
  python3 kb/_docs_audit.py                 # report only (default)
  python3 kb/_docs_audit.py --apply         # + stamp superseded handoffs (R1)
  python3 kb/_docs_audit.py --strict        # exit 1 if any finding (for CI)
  python3 kb/_docs_audit.py --quiet         # write artifacts, no stdout digest

No third-party dependencies: the repo carries zero PyYAML usage across every
`kb/*.py`, so the frontmatter reader here is a deliberately minimal hand-roll
(top-level scalars + inline/block lists) rather than a new dependency in the
checkpoint path.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "kb", "docs_audit")

# ─── lane budgets (bytes) ──────────────────────────────────────────────────
# Tuned to the corpus as of 2026-08-09 so the report opens as a short, real
# worklist rather than a wall. Raise a threshold when a lane is genuinely
# meant to be long; lower it when a lane has stopped being read.
THRESHOLDS = {
    "always_loaded": 60_000,   # CLAUDE.md — costs EVERY session, in 3 repos
    "kb_note":       40_000,   # one distilled concept; past this it's a lessons doc
    "index":         40_000,   # a landing page you must scroll is not a landing page
    "lessons":      120_000,   # scratchpads may be long, not unbounded
    "handoff":       60_000,   # ~4500 chars is the documented sweet spot
    "roadmap_lane":  12_000,   # one §11 lane's state; past this it is a log
    "other":        150_000,
}

# R4: a frontmatter scalar longer than this, or carrying repeated `prior:`
# markers, has stopped being a field and become a changelog.
FM_SCALAR_MAX_CHARS = 400
FM_PRIOR_CHAIN_MIN = 2

# R3/R3b: the contract from docs/kb-notes/README.md, as actually practised.
# Measured 2026-08-09 across 202 notes: type comes from `tags:` (135), `type:`
# (43) or `kb-type:` (21); the creation date from `created:` (154) or `date:`
# (48). All are accepted; R3b reports which dialect was used.
# `scope` is the seventh type: adopted in practice by three notes (all
# `type: scope`, all coherent scope documents) before it was ever written down.
# The lane README says the taxonomy should "grow as needed" — the corpus voted,
# so the lint follows it rather than calling three valid notes broken.
KB_TYPE_TAGS = {"methodology", "reference", "adr", "glossary", "playbook", "meta",
                "scope"}
KB_STATUSES = {"published", "archived", "internal", "candidate", "promoted"}
KB_TYPE_KEYS = ("type", "kb-type")          # canonical is a type tag inside `tags:`
KB_CREATED_KEYS = ("created", "date")        # canonical is `created:`

HANDOFF_RE = re.compile(r"^session_(\d+)_handoff\.md$")

# R6: an Obsidian vault containing this repo watches every one of these.
VAULT_HEAVY_FILE = 2_000_000     # flag an individual file at 2 MB
VAULT_HEAVY_DIR = 10_000_000     # …or roll up to its directory at 10 MB
VAULT_SKIP_DIRS = {".git", "node_modules", ".venv", "__pycache__"}


# ══════════════════════════════════════════════════════════════════════════
# Minimal frontmatter reader
# ══════════════════════════════════════════════════════════════════════════
def split_frontmatter(text: str):
    """Return (fm_lines, body_start_index, has_fm).

    `fm_lines` excludes the opening/closing `---`. `body_start_index` is the
    line index at which the body begins. Non-frontmatter files return
    ([], 0, False) so callers can treat both shapes uniformly.
    """
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return [], 0, False
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[1:i], i + 1, True
    return [], 0, False  # unterminated → treat as no frontmatter


def parse_frontmatter(fm_lines):
    """Parse top-level `key: value` pairs. Values stay raw strings; block and
    inline lists collapse to a list of raw item strings. Nested maps are not
    needed by any rule here and are skipped rather than half-parsed."""
    data, order = {}, []
    key = None
    for raw in fm_lines:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.startswith(("  ", "\t")):  # continuation of a block list
            item = raw.strip()
            if item.startswith("- ") and key is not None:
                data.setdefault(key, [])
                if isinstance(data[key], list):
                    data[key].append(item[2:].strip())
            continue
        m = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", raw)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        order.append(key)
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            data[key] = [t.strip() for t in inner.split(",") if t.strip()] if inner else []
        elif val == "":
            data[key] = []          # provisional: a block list may follow
        else:
            data[key] = val
    return data, order


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


# ══════════════════════════════════════════════════════════════════════════
# Corpus walk
# ══════════════════════════════════════════════════════════════════════════
def lane_of(relpath: str) -> str:
    """Classify a doc into a budget lane. Order matters — the first match wins."""
    if relpath in ("CLAUDE.md",):
        return "always_loaded"
    if relpath.startswith("docs/reference/lanes/"):
        return "roadmap_lane"
    if relpath.startswith("docs/kb-notes/"):
        return "kb_note"
    if relpath in ("docs/INDEX.md",) or relpath.endswith("/INDEX.md"):
        return "index"
    base = os.path.basename(relpath)
    if HANDOFF_RE.match(base):
        return "handoff"
    if base.endswith("_lessons.md"):
        return "lessons"
    return "other"


def collect(root: str):
    """Every markdown doc in scope: docs/** plus the root-level always-loaded
    and reader-facing files. Deliberately excludes .git, node_modules, and the
    auditor's own output directory."""
    docs = []
    for base in ("CLAUDE.md", "README.md"):
        p = os.path.join(root, base)
        if os.path.isfile(p):
            docs.append(p)
    docs_dir = os.path.join(root, "docs")
    for dirpath, dirnames, filenames in os.walk(docs_dir):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
        for fn in filenames:
            if fn.endswith(".md"):
                docs.append(os.path.join(dirpath, fn))
    return sorted(docs, key=rel)


# ══════════════════════════════════════════════════════════════════════════
# Rules
# ══════════════════════════════════════════════════════════════════════════
def find_handoff_max(docs):
    """Highest session_<N>_handoff.md — the one CLAUDE.md Rule 8 calls
    authoritative. Returns None when the lane is empty."""
    ns = [int(m.group(1)) for p in docs
          if (m := HANDOFF_RE.match(os.path.basename(p)))]
    return max(ns) if ns else None


def rule_superseded_handoff(entry, handoff_max, authoritative_created=None):
    """A lower-numbered handoff is superseded — UNLESS it is a parallel sibling.

    ⚠️ FIXED 2026-08-10, same day the bug bit. The rule assumed handoffs form a
    LINEAR CHAIN. They do not: Sam runs concurrent sessions, and on 2026-08-10 two
    checkpointed independently — SkyDeck wrote 136 (the CAC apprenticeship deck),
    SkyLine wrote 137 (Sierra + the corpus). `--apply` stamped 136 `superseded`,
    which is simply false: 137 does not carry the deck workstream at all, and a
    future session could reasonably skip a live document because of the stamp.

    A mechanical rule silently discarding a still-current document is the exact
    failure class this file was extended to catch, so it should not commit it.

    Fix: handoffs created on the SAME DATE as the authoritative one are treated as
    parallel siblings and left alone. Same-day is the available signal — sessions
    do not record a parent — and it is conservative in the right direction: the
    cost of not stamping a genuinely superseded sibling is one extra file in the
    reading list, while the cost of stamping a live one is a lost workstream.
    """
    if entry["lane"] != "handoff" or handoff_max is None:
        return None
    n = int(HANDOFF_RE.match(os.path.basename(entry["path"])).group(1))
    if n >= handoff_max:
        return None
    if authoritative_created and entry["fm"].get("created") == authoritative_created:
        return None   # parallel sibling, not superseded
    if str(entry["fm"].get("superseded", "")).lower() == "true":
        return None
    return {
        "rule": "superseded_handoff",
        "fixable": True,
        "detail": {"session": n, "authoritative": handoff_max,
                   "has_frontmatter": entry["has_fm"]},
        "message": (f"handoff {n} is below the authoritative {handoff_max} but is "
                    f"not stamped `superseded: true`"),
    }


def rule_oversized_doc(entry):
    limit = THRESHOLDS[entry["lane"]]
    if entry["bytes"] <= limit:
        return None
    return {
        "rule": "oversized_doc",
        "fixable": False,
        "detail": {"bytes": entry["bytes"], "limit": limit,
                   "lane": entry["lane"],
                   "over_by": entry["bytes"] - limit,
                   "ratio": round(entry["bytes"] / limit, 2)},
        "message": (f"{entry['bytes']:,} B is {entry['bytes'] / limit:.1f}× the "
                    f"{entry['lane']} budget ({limit:,} B) — candidate for compaction"),
    }


# ── stacked_roadmap_cell ─────────────────────────────────────────────────────
# WHY (added 2026-08-10, Sam's diagnosis): checkpoint discipline was never the
# problem — 182 cpl_memory rows, fed continuously since June. The problem is that
# NOTHING RETIRES. CLAUDE.md's §11 roadmap cells are append-only: each session
# prefixes its finding and the superseded text survives verbatim behind "*Prior:*".
#
# Measured the day this rule was written: the "Disposition grain" cell was 14,338
# characters in ONE table cell, carrying 3 "*Prior:*" markers, 3 corrections and
# 14 warnings — four generations of claims, including corrections of corrections.
# §11 was 45,037 chars, 44% of a 102,587-char file that auto-loads EVERY session.
#
# The consequence is not bloat, it is CONTRADICTION. That file simultaneously said
# Sierra "sits on colleges' own pages" and that "there is no internal COBI Sierra"
# — so Sam had to correct the same point on two consecutive days. No reading ORDER
# fixes a contradiction inside a single document.
#
# This is the repo's own documented lesson turned on itself: "two rules conflicted
# with nothing saying which governed, so the later one silently won."
#
# A roadmap cell must state CURRENT TRUTH. History belongs in the lessons doc,
# which Rule 8 already says to write ONCE. Sam does not review checkpoint output
# by design, so this has to be caught mechanically or not at all.
CELL_MAX_CHARS = 4_000     # a cell you cannot read in one breath is a log
CELL_MAX_PRIOR = 1         # one "*Prior:*" is context; two is an unretired log

# 2026-08-28 (Session 206, the consolidation): §11's detail moved to
# docs/reference/lanes/<lane>.md, so this rule follows it. Two failures found
# while moving it, both of the same shape — a guard that passes because it is
# not looking:
#
#   1. It hard-coded `rel != "CLAUDE.md"`, so the moment the cells moved it
#      would have gone silently green over an unguarded corpus.
#   2. It split rows on a bare `|`, then skipped any row with fewer than four
#      of them. The TWO LARGEST CELLS IN THE TABLE were both invisible to it:
#      "Implementation Funding" (4,930 chars, over the cap) was missing its
#      trailing pipe so the row was skipped outright, and "ESL packaging"
#      (4,447 chars) carries `1|2,3|4` inside a code span, so cells[3] read
#      1,289 chars of it. A malformed row is now a FINDING, not an exemption.


def split_table_row(line):
    """Split a markdown table row on pipes that are NOT inside a backtick code
    span. `1|2,3|4` in a cell is content, not two column breaks."""
    cells, buf, i, n, tick = [], [], 0, len(line), 0
    while i < n:
        ch = line[i]
        if ch == "`":
            j = i
            while j < n and line[j] == "`":
                j += 1
            run = j - i
            if tick == 0:
                tick = run
            elif run == tick:
                tick = 0
            buf.append(line[i:j]); i = j; continue
        if ch == "|" and tick == 0:
            cells.append("".join(buf)); buf = []; i += 1; continue
        buf.append(ch); i += 1
    cells.append("".join(buf))
    if cells and not cells[0].strip():
        cells = cells[1:]
    if cells and not cells[-1].strip():
        cells = cells[:-1]
    return cells


def _roadmap_offenders(text):
    """§11 pointer rows in CLAUDE.md that have grown back into paragraphs."""
    try:
        sec = text[text.index("### Roadmap"):]
    except ValueError:
        return []
    sec = sec.split("The auditor is the foundational instrument")[0]
    offenders = []
    for line in sec.split("\n"):
        if not line.startswith("|"):
            continue
        cells = split_table_row(line)
        name = (cells[0].strip().replace("*", "")[:40] if cells else "?")
        if name in ("Phase", "---", "?"):
            continue
        if len(cells) != 3:
            offenders.append({"row": name, "chars": len(line), "priors": 0,
                              "corrections": 0, "malformed": len(cells)})
            continue
        status = cells[2]
        priors = status.count("*Prior:*")
        if len(status) > CELL_MAX_CHARS or priors > CELL_MAX_PRIOR:
            offenders.append({"row": name, "chars": len(status), "priors": priors,
                              "corrections": status.count("CORRECT"),
                              "malformed": 0})
    return offenders


def _lane_offenders(rel, text):
    """A lane file that has become an append-only log. Size is covered by the
    `roadmap_lane` budget; this catches the stacking that precedes it."""
    priors = text.count("*Prior:*")
    if priors <= CELL_MAX_PRIOR:
        return []
    return [{"row": os.path.basename(rel), "chars": len(text), "priors": priors,
             "corrections": text.count("CORRECT"), "malformed": 0}]


def rule_stacked_roadmap_cell(entry):
    """Roadmap state that has become an append-only log rather than current
    truth — in CLAUDE.md's §11 pointer table, or in any lane file it points to."""
    rel = entry["rel"]
    is_claude = rel == "CLAUDE.md"
    is_lane = rel.startswith("docs/reference/lanes/") and rel.endswith(".md")
    if not (is_claude or is_lane):
        return None
    try:
        text = read(entry["path"])
    except Exception:
        return None

    offenders = (_roadmap_offenders(text) if is_claude
                 else _lane_offenders(rel, text))
    if not offenders:
        return None
    offenders.sort(key=lambda o: -o["chars"])
    worst = offenders[0]
    if worst.get("malformed"):
        detail = (f"\"{worst['row']}\" is a malformed table row "
                  f"({worst['malformed']} cells, expected 3) — a row this rule "
                  f"cannot parse is a row it cannot guard")
    else:
        detail = (f"worst is \"{worst['row']}\" at {worst['chars']:,} chars / "
                  f"{worst['priors']} *Prior:* markers")
    return {
        "rule": "stacked_roadmap_cell",
        "fixable": False,
        "detail": {"cells": offenders, "cell_max": CELL_MAX_CHARS,
                   "prior_max": CELL_MAX_PRIOR},
        "message": (
            f"{len(offenders)} roadmap cell(s)/lane file(s) have become "
            f"append-only logs — {detail}. State must be CURRENT truth; retire "
            f"superseded text to the lessons doc instead of prefixing it. "
            f"Contradictory claims inside one auto-loaded file are why the same "
            f"correction gets made twice."),
    }


def _flat(s):
    """Collapse whitespace so a doctrine pattern survives a line wrap.

    ⚠️ 2026-08-29: `critical_rule_doctrine` reported "Rule 10 — fresh live read
    at write-time" MISSING on a file that states it, because CLAUDE.md wraps it
    as "fresh live read\n   at write-time". Handoff 207 flagged line-rewraps as
    a false-positive class in the consolidation shingle audit; this is the same
    defect inside a guard, where it is worse — a rule reported missing gets
    "restored" by pasting a second copy in.
    """
    return re.sub(r"\s+", " ", s)


# ── probe_instrument_leak ────────────────────────────────────────────────────
# WHY (2026-08-29, Session 208): the doctrine-probe protocol was committed to
# the repository the probes clone. A probe gets `CLAUDE.md` plus the repo — the
# honest control condition — and the repo held `docs/scenarios/rubric.md` (109
# lines: every pass criterion for all five probes, plus the advance predictions)
# and all five probe prompts.
#
# The leak is not subtle. A probe's most natural first action is to search for
# the topic it was handed, and for P5 its distinctive topic phrase - held in
# the vault, deliberately NOT repeated here, and note that this very comment
# carried it verbatim until the self-check below caught it -
# matched EXACTLY ONE FILE in the whole repository — its own probe prompt. P5
# found it, recognized it was inside a test, and void-flagged its own result.
#
# Handoff 207 anticipated leakage but located it in the PROMPT ("re-read the
# probe prompt for a cue"). It was in the REPOSITORY.
#
# The instruments now live in the private vault
# (`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`), which probe sessions
# do not clone. The tracker keeps only docs/scenarios/README.md — the method,
# which names no criterion and is reusable knowledge.
#
# ⚠️ This rule exists because the natural repair for "the docs reference a file
# that isn't here" is to put the file back, and doing so silently re-breaks
# every future probe. THE INSTRUMENT MAY NOT LIVE INSIDE THE SYSTEM UNDER TEST.
# ⚠️ THE POST-MORTEM RE-LEAKED THE THING (2026-08-29, later the same day).
# Moving the instruments out of the repo closed the leak; then the write-ups
# EXPLAINING the leak quoted the probe topic phrases verbatim, and P5's phrase
# was back on `main` in four files within the hour - in documents that also
# explain what the probe is scored on, which is strictly worse than the prompt
# alone. This is the third instance of the same recursive shape in this repo:
# `presentation_doctrine`'s first cut was satisfied by the POST-MORTEM about
# losing the rule, and `american_spelling` corrupted the very word list that
# documented it.
#
# So the phrases cannot be stored here in plaintext - a lint holding the secrets
# it detects IS the leak. Salted hashes instead; the phrases live only in the
# vault beside the prompts.
#
# ⚠️ Scanned ONLY in docs that discuss the probe protocol. "relevel bands" is
# real ESL content and must not be flagged where it legitimately belongs; the
# defect is a probe topic quoted inside a document about probes.
PROBE_TOPIC_SALT = b"cpl-probe-topic-v1:"
PROBE_TOPIC_HASHES = {
    "940d1bc5b0b1b70d",
    "f1211527cb2787f1",
    "1cd16189141c0453",
    "c53cf76c63c82dfc",
}


def _probe_topic_hits(text):
    """Normalized word n-grams of `text` whose hash is a known probe topic."""
    import hashlib
    words = re.sub(r"[^a-z0-9]+", " ", text.lower()).split()
    hits = set()
    for n in range(2, 9):
        for i in range(len(words) - n + 1):
            gram = " ".join(words[i:i + n])
            d = hashlib.sha256(PROBE_TOPIC_SALT + gram.encode()).hexdigest()[:16]
            if d in PROBE_TOPIC_HASHES:
                hits.add(d)
    return hits


PROBE_INSTRUMENT_PATHS = (
    r"docs/scenarios/rubric\.md",
    r"docs/scenarios/probes/",
)


def rule_probe_instrument_leak(root):
    """A probe rubric or prompt has reappeared in the repo probes clone."""
    hits = []
    for rel in ("docs/scenarios/rubric.md",):
        if os.path.isfile(os.path.join(root, rel)):
            hits.append(rel)
    pdir = os.path.join(root, "docs", "scenarios", "probes")
    if os.path.isdir(pdir):
        hits.append("docs/scenarios/probes/")
    # A probe topic quoted inside a document ABOUT the probes is the same leak
    # one level up: the phrase is what a probe searches for, and the document
    # explains the test. Only such documents are scanned - see the note above.
    # ⚠️ THE HANDOFF IS A LEAK CHANNEL TOO (2026-08-29). CLAUDE.md tells every
    # session the highest-numbered handoff is authoritative, so a handoff that
    # describes the experiment hands it to its own subjects. session_209 carried
    # 22 lines about the probes and named a probe by number; caught only while
    # about to spawn that very probe against it. Its state lives in the vault
    # now and the handoff keeps a pointer.
    quoted = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(root, "docs")):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                body = read(fp)
            except Exception:
                continue
            low = body.lower()
            if "probe" not in low or ("rubric" not in low and "scenario" not in low):
                continue
            if _probe_topic_hits(body):
                quoted.append(os.path.relpath(fp, root))
    if not hits and not quoted:
        return None
    return {
        "rule": "probe_instrument_leak", "fixable": False,
        "detail": {"paths": hits, "topic_quoted_in": sorted(quoted)},
        "message": (
            f"Probe instrument(s) present in the repo probes clone: "
            f"{', '.join(hits)}. A probe searching for the topic it was handed "
            f"finds the document describing the test — measured 2026-08-29, "
            f"where one probe's topic phrase matched its own prompt and nothing "
            f"else. The rubric and prompts belong in the private vault at "
            f"`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`; keep only "
            f"`docs/scenarios/README.md` (the method) here."
            + (f" ALSO: {len(quoted)} doc(s) about the probes quote a probe's own "
               f"topic phrase verbatim, which puts it back in the repo probes "
               f"search: {', '.join(sorted(quoted))}. Describe the phrase, do not "
               f"reproduce it." if quoted else "")),
    }


# ── lane_retirement_signal ───────────────────────────────────────────────────
# WHY (2026-08-29, Session 208): §11's preamble states the retirement test as
# three literal tokens — "no NEXT, no NEEDS SAM, no BLOCKED in the row's own
# text" — one line after warning "read the lane file; do not grep for a tick".
# The phrasing invites exactly the grep it forbids, and the grep is wrong.
#
# Measured: THREE consecutive hand-greps for this in one session, each wrong a
# different way, before a per-file read got the true answer (0 of 30 retirable).
#   1. anchored the marker to line-start   -> 0 hits across all 30 lanes
#   2. searched `NEXT`, case-sensitive     -> missed `Next:` (4 lanes)
#   3. required a trailing colon           -> missed bare `BLOCKED` (3 lanes)
# Runs 2 and 3 each produced a plausible, confident, WRONG retirement list. The
# handoff before this one recorded the same mistake at a larger grain: five rows
# measured "retirable with no judgment calls", four of which carried an explicit
# open-work list in their own text.
#
# So the vocabulary below is MEASURED from the live corpus, not imagined, and
# the rule is deliberately FAIL-SAFE: any marker at all means "has open work".
# A false "has open work" costs nothing (the lane stays listed, which it already
# is); a false "retirable" costs a live workstream being filed as finished.
# This rule therefore never says "retire this" — it says "nothing in this file
# claims open work; go READ it", which is the §11 instruction, arrived at
# mechanically instead of by a fresh wrong grep every time.
LANE_OPEN_WORK_MARKERS = (
    r"NEXT\b", r"\bNext(?:\s+by\b[^:\n]{0,30})?\s*:",   # `NEXT:` and `Next by value/effort:`
    r"NEEDS SAM", r"(?i:blocked)",                       # incl. bare `BLOCKED ON JENNI`
    #   ⚠️ `blocked` is case-INSENSITIVE and `Remaining:` is here because the
    #   first cut of this list flagged `excel-to-supabase` as having no open
    #   work while its own text reads "Remaining: P3 ... blocked only by
    #   read_projects". Both were added by re-reading the file the lint was
    #   wrong about — which is the only way this vocabulary ever gets right.
    r"\bRemaining\s*:",
    r"\bOpen\s*:", r"\bOPEN\b",
    r"Still queued", r"Gap backlog", r"\bParked\s*:",
    r"\bOutstanding\b", r"Needs Input",
    r"\bawaiting\b", r"NOT built", r"not yet built",
)


def rule_lane_retirement_signal(root):
    """Lane files whose own text claims no open work — read them, per §11."""
    lanes_dir = os.path.join(root, "docs", "reference", "lanes")
    if not os.path.isdir(lanes_dir):
        return None
    names = [f for f in sorted(os.listdir(lanes_dir)) if f.endswith(".md")]
    quiet = []
    for fn in names:
        try:
            body = read(os.path.join(lanes_dir, fn))
        except Exception:
            continue
        # Strip frontmatter and the relocation banner: the banner is boilerplate
        # on every lane file and must never decide whether a lane has open work.
        body = re.sub(r"\A---.*?\n---\n", "", body, flags=re.S)
        body = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith(">"))
        if not any(re.search(m, body) for m in LANE_OPEN_WORK_MARKERS):
            quiet.append(fn[:-3])
    if not quiet:
        return None
    return {
        "rule": "lane_retirement_signal", "fixable": False,
        "detail": {"lanes": quiet, "checked": len(names)},
        "message": (
            f"{len(quiet)} of {len(names)} lane file(s) state no open work: "
            f"{', '.join(quiet)}. This is NOT a retirement instruction — it is "
            f"the §11 test run for you so you do not re-derive it with a fresh "
            f"wrong grep. READ each one. A lane with no NEXT / NEEDS SAM / "
            f"BLOCKED and no load-bearing invariants moves verbatim to "
            f"`docs/reference/finished_workstreams.md` and its §11 row leaves "
            f"the table; anything else stays."),
    }


# ── critical_rule_doctrine ───────────────────────────────────────────────────
# WHY (2026-08-29, Session 208): `presentation_doctrine` guards one section
# against one failure — a rule carried out of the always-loaded file by a
# relocation. That failure is not specific to presentation rules, and the
# Critical Rules are where it costs most.
#
# ⚠️ `unreferenced_offload` CANNOT see this class. It asks whether CLAUDE.md
# still POINTS AT the file content moved into — a FILE-level question. When
# Rule 7's structural invariants move to `docs/reference/mid_lifecycle.md`,
# that pointer is present and correct, so the guard stays green whether or not
# the TOP caveat rode along into the same file. Scored empirically before this
# was written: `kb/_doctrine_scenarios.py` scenarios "Rule 7's TOP caveat
# relocated, pointer intact" and "Rule 9's /checkpoint imperative relocated"
# both reported — NOTHING —.
#
# The registry is deliberately SHORT. It holds claims that are (a) PUSH — a
# session cannot know to ask for them — and (b) covered by no other guard.
# Growing it into a summary of every rule would make it a second copy of
# CLAUDE.md that drifts, which is the defect this whole lane exists to fix.
#
# ⚠️ Anchor each claim on phrasing only the DIRECTIVE uses. Patterns keyed on a
# rule's NAME are satisfied by a post-mortem ABOUT losing it — that mistake
# gave `presentation_doctrine` four false passes, one of them satisfied by a
# quotation from Sam sitting inside a neighbouring bullet.
CRITICAL_RULE_DOCTRINE = {
    "Rule 4 — the two HTMLs stay identical": (
        r"`?index\.html`?\s+must stay identical", r"must stay identical"),
    "Rule 5 — never force-push main": (r"[Nn]ever force-push",),
    "Rule 7 — TOP is never a gatekeeper": (
        r"[Nn]ever use TOP for gatekeeping", r"last-in-line corroborator"),
    "Rule 7 — re-mints follow the playbook": (
        r"[Nn]ever re-mint casually", r"playbook is\s+mandatory"),
    "Rule 8 — read the memory table before you work": (
        r"READ the memory table BEFORE", r"before you work"),
    "Rule 9 — run /checkpoint, do not improvise": (
        r"do not improvise", r"improvise one from memory"),
    "Rule 9 — update the lane file, not the row": (
        r"update the LANE FILE", r"THE USUAL CHECKPOINT EDIT"),
    "Rule 9 — the highest-numbered handoff is authoritative": (
        r"HIGHEST-numbered", r"highest-numbered"),
    "Rule 10 — fresh live read at write-time": (
        r"fresh live read at write-time", r"fresh-read at write-time"),
}


def rule_critical_rule_doctrine(entry):
    """A Critical Rule claim that has left the always-loaded file."""
    if entry["rel"] != "CLAUDE.md":
        return None
    try:
        text = read(entry["path"])
    except Exception:
        return None
    try:
        sec = text[text.index("## Critical Rules"):]
    except ValueError:
        return {
            "rule": "critical_rule_doctrine", "fixable": False,
            "detail": {"missing": ["(the whole section)"],
                       "checked": len(CRITICAL_RULE_DOCTRINE)},
            "message": ("CLAUDE.md has no `## Critical Rules` section."),
        }
    nxt = sec.find("\n## ", 1)
    if nxt != -1:
        sec = sec[:nxt]

    flat = _flat(sec)
    missing = [claim for claim, pats in CRITICAL_RULE_DOCTRINE.items()
               if not any(re.search(_flat(p), flat, re.I) for p in pats)]
    if not missing:
        return None
    return {
        "rule": "critical_rule_doctrine",
        "fixable": False,
        "detail": {"missing": missing, "checked": len(CRITICAL_RULE_DOCTRINE)},
        "message": (
            f"{len(missing)} Critical Rule claim(s) are no longer stated in "
            f"CLAUDE.md\u00a7Critical Rules: {'; '.join(missing)}. Each is PUSH — a "
            f"session cannot know to ask for it — and none is covered by another "
            f"guard. Moving one into a pulled store leaves `unreferenced_offload` "
            f"green (the FILE is still pointed at) while the rule itself stops "
            f"firing. Restore it, or delete it from CRITICAL_RULE_DOCTRINE "
            f"deliberately and say why."),
    }


# ── presentation_doctrine ────────────────────────────────────────────────────
# WHY (added 2026-08-28, at Sam's request): the rules that govern what a human
# LOOKS AT are the purest push case in the corpus — nobody stops to query "may I
# use an emoji here" before typing one. They are also the ones that scatter,
# because each arrives attached to whatever tab was being built that week.
#
# "PLAIN WORDS, NO GLYPHS" is the worked example, and it has now failed twice the
# same way. It was recorded in `cpl_memory` on 2026-08-14 and the Admin tab
# shipped covered in emoji that same week. It was then written into a §11 roadmap
# ROW, and the 2026-08-28 consolidation relocated that row to a lane file —
# carrying the rule out of the always-loaded file entirely, where it went from
# firing on every session to firing only for someone who opened one lane doc.
#
# Neither loss was visible: no file was deleted, no link broke, nothing went red.
# So presence in the PUSHED file is asserted here. Patterns are deliberately
# loose — several alternatives per topic — because this must survive rewording
# and only fail when a topic genuinely leaves.
# Patterns are matched case-INSENSITIVELY against the rule bullets only, and each
# is anchored to phrasing unique to its own rule. `tests/docs_audit_test.py`
# deletes each bullet in turn and asserts EXACTLY that topic is reported, so a
# pattern that drifts onto a neighbouring bullet fails the suite rather than
# quietly satisfying itself from the wrong rule.
PRESENTATION_DOCTRINE = {
    "First Light design": (r"first light",),
    # ⚠️ NOT a bare "accessib" / "mobile-friendly": Sam's quote inside the First
    # Light bullet ("make it always accessible and mobile friendly") contains
    # both, so those two rules could be deleted entirely and this stayed silent.
    # Anchor on phrasing only the DIRECTIVE uses, never wording a neighbouring
    # rule might quote.
    "accessibility": (r"AA 4\.5", r"aria-label", r"focus-visible",
                      r"verified,? not claimed"),
    "mobile-friendly": (r"single column below", r"clamp\(\) type"),
    "plain words / no decorative glyphs": (
        r"plain words", r"n[o|ot] glyphs", r"cheesy glyph", r"decorative\W{0,3}emoji"),
    "American spelling": (r"american spelling",),
    "no horizontal scroll": (r"horizontal scroll",),
    "text measure": (r"cpl-measure", r"full width"),
}


def rule_presentation_doctrine(entry):
    """A presentation rule that has left the always-loaded file."""
    if entry["rel"] != "CLAUDE.md":
        return None
    try:
        text = read(entry["path"])
    except Exception:
        return None
    # ⚠️ Search the RULE BULLETS ONLY, never the whole file. The first cut
    # searched all of CLAUDE.md and did not fire when the glyph bullet was
    # deleted, because the section's own preamble NAMES the rule while
    # explaining how it was once lost — a doctrine-presence check keyed on a
    # rule's name is satisfied by the post-mortem about losing it.
    try:
        sec = text[text.index("## Presentation rules"):]
    except ValueError:
        return {
            "rule": "presentation_doctrine", "fixable": False,
            "detail": {"missing": ["(the whole section)"],
                       "checked": len(PRESENTATION_DOCTRINE)},
            "message": ("CLAUDE.md has no `## Presentation rules` section. Every "
                        "rule governing what a human looks at is PUSH and belongs "
                        "in the always-loaded file."),
        }
    nxt = sec.find("\n## ", 1)
    if nxt != -1:
        sec = sec[:nxt]
    first = sec.find("\n- **")
    bullets = sec[first:] if first != -1 else ""

    flat = _flat(bullets)
    missing = [topic for topic, pats in PRESENTATION_DOCTRINE.items()
               if not any(re.search(_flat(p), flat, re.I) for p in pats)]
    if not missing:
        return None
    return {
        "rule": "presentation_doctrine",
        "fixable": False,
        "detail": {"missing": missing, "checked": len(PRESENTATION_DOCTRINE)},
        "message": (
            f"{len(missing)} presentation rule(s) are no longer stated in CLAUDE.md: "
            f"{', '.join(missing)}. These govern every view we ship and are PUSH — "
            f"nobody queries a formatting rule before typing. Relocating one to a "
            f"lane file or `cpl_memory` silently stops it firing (that is exactly "
            f"how \"PLAIN WORDS, NO GLYPHS\" was lost twice). Restore it to the "
            f"\u00a7Presentation rules section."),
    }


# ── checkpoint_overdue ───────────────────────────────────────────────────────
# WHY (2026-08-29): Rule 9 says checkpoint "roughly every ~100K tokens of context
# consumed... Claude Code doesn't expose an exact counter; use proxies". That is
# a condition NOTHING CAN OBSERVE — the same defect that left
# `04-projects/SESSION-NOTES.md` 41 days stale behind the words "when the run
# worked inside a project folder". A rule whose trigger cannot be checked decays
# silently, because there is no state in which it looks wrong.
#
# Commits since the newest handoff was last written IS observable, and it is a
# good proxy: a session that has landed work has consumed context. Measured over
# the last ~220 commits, handoffs land every 1-3 commits (median 2, p75 3, p90 5,
# max 9), so 6 fires on the tail rather than the normal rhythm.
#
# FAIL-SOFT BY DESIGN: no git, a shallow clone, or a repo with no handoffs yields
# NO finding rather than a wrong one. A lint that cannot measure should say
# nothing — claiming "you are fine" without looking is how the other guards in
# this file failed.
CHECKPOINT_COMMIT_BUDGET = 6


def rule_checkpoint_overdue(root):
    """Work has landed since the handoff was last refreshed."""
    import subprocess
    def git(*args):
        try:
            r = subprocess.run(["git", *args], cwd=root, capture_output=True,
                               text=True, timeout=10)
            return r.stdout.strip() if r.returncode == 0 else None
        except Exception:
            return None

    docs = os.path.join(root, "docs")
    if not os.path.isdir(docs):
        return None
    ns = [(int(m.group(1)), f) for f in os.listdir(docs)
          if (m := HANDOFF_RE.match(f))]
    if not ns:
        return None
    newest = max(ns)[1]
    rel = f"docs/{newest}"

    last = git("log", "-1", "--format=%H", "--", rel)
    if not last:
        return None
    head = git("rev-parse", "HEAD")
    if not head:
        return None
    count = git("rev-list", "--count", f"{last}..{head}")
    if count is None or not count.isdigit():
        return None
    n = int(count)
    if n <= CHECKPOINT_COMMIT_BUDGET:
        return None
    return {
        "rule": "checkpoint_overdue",
        "fixable": False,
        "path": rel,
        "detail": {"commits_since": n, "budget": CHECKPOINT_COMMIT_BUDGET,
                   "handoff": newest},
        "message": (
            f"{n} commit(s) have landed since `{rel}` was last written "
            f"(budget {CHECKPOINT_COMMIT_BUDGET}). Rule 9's own trigger — "
            f"'roughly every ~100K tokens' — is a condition nothing can observe, "
            f"so this is the observable stand-in. Run `/checkpoint`: improvising "
            f"one from memory is how nine of its thirteen artifacts go missing."),
    }


# ── self_corrected_word_pair ─────────────────────────────────────────────────
# WHY (2026-08-29): `american_spelling` rewrote `whilst` and `amongst` INSIDE the
# parenthetical that existed to name them, leaving "while (not while) · among
# (not among)" in the always-loaded file for weeks. The sentence still scans, so
# a reader skims past it as a formatting oddity rather than a destroyed rule, and
# NOTHING can flag it by spelling — both halves are correct American English.
#
# The general shape: any document that teaches a transformation contains examples
# of that transformation's INPUT, which is exactly what the transformation eats.
# Style guides, lint docs and glossaries are all self-consuming this way. The fix
# is to put the named form in a code span (prose_only masks those); this rule is
# how you find out you forgot.
SELF_CORRECTED_RE = re.compile(r"\b(\w{3,})\b\s*\(\s*not\s+\1\s*\)", re.I)


def rule_self_corrected_word_pair(entry):
    """A word pair that now names the same word on both sides.

    ⚠️ SCANS PROSE ONLY, and this rule shipped without doing so (Session 206).
    Its own message told you to "put the named form in a code span, which
    `prose_only()` masks" -- advice the implementation did not honor, because it
    matched raw text. So the documented fix did not silence it, and the repo's
    own post-mortem QUOTING the corruption was reported as the corruption. A
    guard whose remedy does not work is the muted-guard failure again: the only
    way to clear it would have been to delete the explanation.
    """
    try:
        text = prose_only(read(entry["path"]))
    except Exception:
        return None
    hits = [m.group(0) for m in SELF_CORRECTED_RE.finditer(text)]
    if not hits:
        return None
    return {
        "rule": "self_corrected_word_pair",
        "fixable": False,
        "detail": {"hits": hits[:8], "count": len(hits)},
        "message": (
            f"{len(hits)} word pair(s) name the same word on both sides: "
            f"{', '.join(hits[:3])}. A normalizer corrected the form the rule "
            f"existed to NAME — put the named form in a code span, which "
            f"`prose_only()` masks, or it will be eaten again on the next sweep."),
    }


# ── unreferenced_offload ─────────────────────────────────────────────────────
# WHY (added 2026-08-28, Session 206, the hour after the consolidation shipped):
# moving content into `docs/reference/` is only half the move. The other half is
# the POINTER left in CLAUDE.md — and the pointer is the safety mechanism, not a
# courtesy, because a pull store nobody was told exists is the same as no store.
#
# This rule exists because the consolidation itself got it wrong. It relocated
# §11's 29 lane cells to `docs/reference/lanes/`, updated
# `.claude/commands/checkpoint.md`, and left Rule 9's own checkpoint list in
# CLAUDE.md still naming only the three 2026-07-10 pare-down files. The slash
# command is the PULLED path and fires only when someone types it; Rule 9 is the
# PUSHED path and fires unprompted. So a checkpoint run from the rule would have
# refreshed the pointer table and left all 30 lane files to go stale — the exact
# failure the same session had just written a KB note about.
#
# A missing pointer is silent by construction: the offloaded file is fine, the
# always-loaded file is fine, and only the LINK between them is absent. Nothing
# else in this corpus can see that, so it is checked here.
REFERENCE_DIR = "docs/reference"


def rule_unreferenced_offload(entry, root):
    """An offload under docs/reference/ that CLAUDE.md never points at."""
    if entry["rel"] != "CLAUDE.md":
        return None
    try:
        text = read(entry["path"])
    except Exception:
        return None
    # ⚠️ No early return on a missing docs/reference/: skills and commands are
    # offloads in their own right, and a repo can have those without it. The
    # first cut returned here and scored "a SKILL nobody points at" as caught by
    # NOTHING in kb/_doctrine_scenarios.py — the exact gap the extension was for.
    ref_root = os.path.join(root, REFERENCE_DIR)

    targets = []
    # `.claude/skills/` and `.claude/commands/` are offloads too — a skill is
    # PULL content reached by a trigger, exactly like a reference doc. Added
    # 2026-08-29 after `kb/_doctrine_scenarios.py` scored "a SKILL nobody points
    # at" as caught by NOTHING, while the M-ID re-mint rules were about to be
    # moved into one.
    for extra in (".claude/skills", ".claude/commands"):
        ed = os.path.join(root, extra)
        if not os.path.isdir(ed):
            continue
        for name in sorted(os.listdir(ed)):
            sub = os.path.join(ed, name)
            if os.path.isdir(sub) and any(f.endswith(".md") for f in os.listdir(sub)):
                if name not in text:
                    targets.append(f"{extra}/{name}/")
            elif name.endswith(".md") and os.path.splitext(name)[0] not in text:
                targets.append(f"{extra}/{name}")

    for name in (sorted(os.listdir(ref_root)) if os.path.isdir(ref_root) else []):
        full = os.path.join(ref_root, name)
        if os.path.isdir(full):
            # a directory counts only when it actually holds prose
            if any(f.endswith(".md") for _, _, fs in os.walk(full) for f in fs):
                targets.append(name.rstrip("/") + "/")
        elif name.endswith(".md"):
            targets.append(name)

    # ⚠️ Match the PATH, never the bare name. The first cut tested for "lanes"
    # and passed on a deliberately broken file, because CLAUDE.md says "Three
    # doc lanes in this repo" for an unrelated reason — a guard passing on a
    # common English word is a guard that never fires.
    # REACHABILITY is the invariant, not a direct mention — the same standard
    # `unindexed_kb_note` already applies. An offload named by a doc CLAUDE.md
    # itself points at is findable, so one hop counts.
    hop = text
    for m in set(re.findall(r"docs/(?:reference|kb-notes)/[\w./-]+\.md", text)):
        fp = os.path.join(root, m)
        if os.path.isfile(fp):
            try:
                hop += read(fp)
            except Exception:
                pass

    def referenced(name):
        stem = name.rstrip("/")
        return (f"reference/{stem}" in hop
                or f"reference/{os.path.splitext(stem)[0]}" in hop)

    missing = [n for n in targets if n.startswith(".claude/") or not referenced(n)]
    if not missing:
        return None
    return {
        "rule": "unreferenced_offload",
        "fixable": False,
        "detail": {"missing": missing, "checked": len(targets)},
        "message": (
            f"{len(missing)} of {len(targets)} offload(s) under `{REFERENCE_DIR}/` "
            f"are never named in CLAUDE.md: {', '.join(missing)}. Content was moved "
            f"out without leaving the pointer, so the always-loaded file no longer "
            f"says the store exists — and a pull store nobody was told about is the "
            f"same as no store. Name it in Rule 9's checkpoint list (so it is "
            f"refreshed) and in the read-before stub (so it is found)."),
    }


def _is_kb_note(entry):
    if entry["lane"] != "kb_note":
        return False
    base = os.path.basename(entry["path"])
    return not (base.startswith("_") or base == "README.md")


def _clean(v):
    return v.strip().strip("\"'") if isinstance(v, str) else v


def kb_type_of(fm):
    """Resolve a note's type across every dialect in the corpus.
    Returns (type_or_None, dialect_or_None)."""
    tags = fm.get("tags", [])
    tags = tags if isinstance(tags, list) else [tags]
    hits = [t for t in (_clean(x) for x in tags) if t in KB_TYPE_TAGS]
    if hits:
        return hits[0], "tags:"
    for k in KB_TYPE_KEYS:
        v = _clean(fm.get(k))
        if v in KB_TYPE_TAGS:
            return v, f"{k}:"
    return None, None


def rule_kb_note_frontmatter(entry):
    """Hard defects only — a note a future session genuinely cannot classify."""
    if not _is_kb_note(entry):
        return None
    fm, problems = entry["fm"], []
    if not entry["has_fm"]:
        problems.append("no frontmatter block at all")
    else:
        if not fm.get("title"):
            problems.append("no title")
        if not any(k in fm for k in KB_CREATED_KEYS):
            problems.append("no creation date (`created:` or `date:`)")
        if kb_type_of(fm)[0] is None:
            problems.append("no type in any dialect (tags:/type:/kb-type:; one of "
                            + "/".join(sorted(KB_TYPE_TAGS)) + ")")
        status = _clean(fm.get("kb-status"))
        if status is None:
            problems.append("no kb-status")
        elif isinstance(status, str) and status not in KB_STATUSES:
            problems.append(f"invalid kb-status `{status}`")
    if not problems:
        return None
    return {
        "rule": "kb_note_frontmatter",
        "fixable": False,
        "detail": {"problems": problems},
        "message": "; ".join(problems),
    }


def rule_kb_note_dialect(entry):
    """Informational: a well-formed note using a non-canonical dialect.
    Never a defect — this exists so the drift is visible and Sam can decide
    whether normalising is worth a pass, not so the tool can nag."""
    if not _is_kb_note(entry) or not entry["has_fm"]:
        return None
    fm, drift = entry["fm"], []
    _t, dialect = kb_type_of(fm)
    if dialect and dialect != "tags:":
        drift.append(f"type via `{dialect}` (canonical: a type tag in `tags:`)")
    if "created" not in fm and "date" in fm:
        drift.append("`date:` (canonical: `created:`)")
    if not drift:
        return None
    return {
        "rule": "kb_note_dialect",
        "fixable": False,
        "detail": {"drift": drift},
        "message": "; ".join(drift),
    }


# ── American spelling ──────────────────────────────────────────────────────
# Sam, 2026-08-21: "As a Yank, I prefer American, of course." Claude drifts to
# British forms in prose, and Claude's own spell-check flags them as errors, so
# this is real friction rather than a style quibble.
#
# ⭐ THIS RULE EXISTS BECAUSE A CONVENTION NOBODY EXECUTES IS NOT A CONVENTION
# (methodology-a-rule-you-wrote-is-not-a-rule-you-applied). Recording the
# preference in CLAUDE.md would have been the same half-measure this repo keeps
# rediscovering: written down, never consulted at the moment it is violated.
#
# ⚠ PROSE ONLY, AND DELIBERATELY NARROW. `grey` is a valid CSS keyword and a
# token name is not a spelling, so this scans documents, never source. The list
# is the forms actually observed drifting here — widening it invites false
# positives on quoted external titles, which this corpus is full of.
# An entry is a regex, not a literal, when it carries regex syntax.
_IS_PATTERN = re.compile(r"[()\[\]|?*+\\]")

BRITISH_FORMS = [
    ("colour", "color"), ("behaviour", "behavior"), ("favour", "favor"),
    ("normalis", "normaliz"), ("organis", "organiz"), ("recognis", "recogniz"),
    ("generalis", "generaliz"), ("prioritis", "prioritiz"), ("minimis", "minimiz"),
    ("summaris", "summariz"), ("categoris", "categoriz"),
    # ⚠ NOT the bare stem "analys", and not a plain substring either.
    # `analysis`, `analyses`, `analyst` and `analytical` are all correct
    # AMERICAN spellings, so the stem flagged **430 correct words out of 433
    # matches** across this corpus — measured 2026-08-21, the day after the rule
    # shipped. A guard that fires on truth 99% of the time gets muted within a
    # week (methodology-a-guard-that-fails-on-truth-gets-muted).
    #
    # Only the VERB inflects British: analyse / analysed / analysing. The
    # lookahead pins those three and nothing else — in particular `analyses`,
    # which is the plural of `analysis` far more often than it is a verb here.
    (r"analys(?=e\b|ed\b|ing\b)", "analyz"),
    ("judgement", "judgment"), ("acknowledgement", "acknowledgment"),
    ("programme", "program"), ("catalogue", "catalog"), ("centred", "centered"),
    ("modelling", "modeling"), ("cancelled", "canceled"), ("labelled", "labeled"),
    ("whilst", "while"), ("amongst", "among"), ("sceptic", "skeptic"),
    ("defence", "defense"), ("enrol ", "enroll "), ("fulfil ", "fulfill "),
]


def prose_only(text):
    """Blank every region of a markdown doc that is NOT prose, keeping offsets.

    ⭐ THE LINT AND THE FIXER MUST SHARE ONE DEFINITION OF PROSE. Before this
    existed the rule scanned raw text, so it reported 25 findings that
    `kb/_fix_american_spelling.py` deliberately refuses to touch — a filename in
    link text, a word inside a code span, Sam quoted verbatim. A guard that
    reports work nobody can do is the muted-guard failure this corpus already
    documented (methodology-a-guard-that-fails-on-truth-gets-muted).

    Masked: fenced blocks, inline code, indented code, wikilinks, markdown link
    TARGETS, bare URLs, `*.md` filenames, and quoted spans.

    ⚠ QUOTED SPANS ARE PROSE TO A READER BUT NOT OURS TO EDIT. Sam, 2026-08-28:
    *"No need to fix any spellings we import...like COCI catalog or MAP Custom
    Reports data."* A quotation is someone else's text — an imported COCI title,
    a MAP field, or a person's own words — and correcting it makes our record
    disagree with its source.
    """
    out = list(text)

    def blank(m, g=0):
        for i in range(m.start(g), m.end(g)):
            out[i] = "\0"

    for pat, grp in ((r"```.*?```|~~~.*?~~~", 0), (r"`[^`\n]*`", 0),
                     (r"\[\[[^\]]*\]\]", 0), (r"\]\(([^)]*)\)", 1),
                     (r"https?://\S+", 0), (r"^\s{4,}\S.*$", 0),
                     (r"[\w./-]+\.md\b", 0),
                     (r"\"[^\"\n]*\"|\u201c[^\u201d\n]*\u201d", 0)):
        flags = re.S | re.M if grp == 0 else 0
        for m in re.finditer(pat, text, re.S | re.M):
            blank(m, grp)
    return "".join(out)


def rule_american_spelling(entry):
    """Informational: British spellings in a doc Sam reads.

    Never a defect — it reports so a pass can be made deliberately, in the same
    spirit as kb_note_dialect. Case-insensitive on the stem; reports the forms
    found and their count, not every offset.

    Scans `prose_only()` — the SAME mask `kb/_fix_american_spelling.py` applies,
    so the rule can never report a hit the fixer refuses to touch.
    """
    text = entry.get("text") or ""
    if not text:
        return None
    low = prose_only(text).lower()
    hits = {}
    for brit, amer in BRITISH_FORMS:
        # Plain stems stay a substring count (cheap, and "normalis" is meant to
        # catch normalise/normalising/normalisation alike). An entry carrying
        # regex syntax is compiled instead, so a form can exclude a lookalike
        # that is correct American — see the analys() entry above.
        if _IS_PATTERN.search(brit):
            n = len(re.findall(brit, low))
            label = re.sub(r"\(\?[=!][^)]*\)", "", brit)
        else:
            n = low.count(brit)
            label = brit
        if n:
            hits[label.strip()] = {"n": n, "prefer": amer.strip()}
    if not hits:
        return None
    total = sum(h["n"] for h in hits.values())
    top = sorted(hits.items(), key=lambda kv: -kv[1]["n"])[:6]
    return {
        "rule": "american_spelling",
        "fixable": False,
        "detail": {"total": total, "forms": hits},
        "message": "%d British form%s — %s" % (
            total, "" if total == 1 else "s",
            ", ".join("%s→%s" % (k, v["prefer"]) for k, v in top)),
    }


def rule_frontmatter_log_chain(entry):
    if not entry["has_fm"]:
        return None
    offenders = []
    for k, v in entry["fm"].items():
        if not isinstance(v, str):
            continue
        priors = v.count("prior:")
        if len(v) > FM_SCALAR_MAX_CHARS or priors >= FM_PRIOR_CHAIN_MIN:
            offenders.append({"key": k, "chars": len(v), "prior_entries": priors})
    if not offenders:
        return None
    worst = max(offenders, key=lambda o: o["chars"])
    return {
        "rule": "frontmatter_log_chain",
        "fixable": False,
        "detail": {"fields": offenders},
        "message": (f"frontmatter `{worst['key']}:` is {worst['chars']:,} chars"
                    + (f" chaining {worst['prior_entries']} `prior:` entries"
                       if worst["prior_entries"] else "")
                    + " — a field being used as a changelog"),
    }


def read_browsable_index():
    """The text a human can reach by BROWSING from `docs/INDEX.md`.

    INDEX.md is the landing page; the full per-lane listings live in the
    generated `docs/catalog/*.md` (`kb/_build_docs_index.py`), because 340
    KB-note rows cannot fit a 40,000 B landing-page budget at any width.

    A catalog counts only when INDEX actually LINKS to it — reachability is the
    invariant, not the file's existence. Unlink a catalog and every note in it
    correctly reports as unreachable again.
    """
    index_path = os.path.join(ROOT, "docs", "INDEX.md")
    if not os.path.isfile(index_path):
        return None
    text = read(index_path)
    parts = [text]
    for href in set(re.findall(r"\]\((catalog/[^)]+\.md)\)", text)):
        p = os.path.join(ROOT, "docs", href)
        if os.path.isfile(p):
            parts.append(read(p))
    return "\n".join(parts)


def rule_unindexed_kb_note(entry, index_text):
    if entry["lane"] != "kb_note" or index_text is None:
        return None
    base = os.path.basename(entry["path"])
    if base.startswith("_") or base == "README.md":
        return None
    if base[:-3] in index_text:      # stem match covers links, wikilinks, bare text
        return None
    return {
        "rule": "unindexed_kb_note",
        "fixable": False,
        "detail": {"stem": base[:-3]},
        "message": "not referenced from docs/INDEX.md or any catalog it "
                   "links to — unreachable by browsing",
    }


def scan_vault_weight(root: str):
    """R6 — what an Obsidian vault containing this repo has to carry.

    Returns (findings, stats). Heavy directories roll up so the recommendation
    is a short paste-able list rather than a file-by-file dump; individual heavy
    files are reported only when they sit outside an already-recommended
    directory.
    """
    sizes, total, count = {}, 0, 0
    dir_bytes, dir_md = {}, {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in VAULT_SKIP_DIRS]
        # Skip our OWN receipts. Counting them makes the total self-referential:
        # writing this run's JSON changes its size, so the next run reports a
        # different vault total and the committed receipt churns forever.
        if os.path.abspath(dirpath) == os.path.abspath(OUT_DIR):
            dirnames[:] = []
            continue
        d = rel(dirpath) if os.path.abspath(dirpath) != ROOT else ""
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            try:
                n = os.path.getsize(p)
            except OSError:
                continue
            sizes[rel(p)] = n
            total += n
            count += 1
            # roll the file into every ancestor directory
            parts = d.split("/") if d else []
            for i in range(len(parts) + 1):
                key = "/".join(parts[:i])
                if not key:
                    continue
                dir_bytes[key] = dir_bytes.get(key, 0) + n
                if fn.endswith(".md"):
                    dir_md[key] = dir_md.get(key, 0) + 1

    # A directory is safe to roll up ONLY if it holds no markdown at any depth —
    # otherwise excluding it would hide notes Sam reads in Obsidian. `docs/` is
    # 11 MB of attachments wrapped around the entire docs lane; rolling it up
    # would have excluded the corpus this auditor exists to protect.
    heavy_dirs, covered = [], set()
    for d in sorted(dir_bytes, key=lambda k: (k.count("/"), k)):
        if dir_bytes[d] < VAULT_HEAVY_DIR or dir_md.get(d, 0) > 0:
            continue
        if any(d == c or d.startswith(c + "/") for c in covered):
            continue
        covered.add(d)
        heavy_dirs.append((d, dir_bytes[d]))
    heavy_dirs.sort(key=lambda kv: -kv[1])

    heavy_files = [(r, n) for r, n in sizes.items()
                   if n >= VAULT_HEAVY_FILE
                   and not r.endswith(".md")
                   and not any(r.startswith(c + "/") for c in covered)]
    heavy_files.sort(key=lambda kv: -kv[1])

    findings = []
    for d, n in heavy_dirs:
        findings.append({"rule": "vault_heavy_path", "fixable": False, "path": d,
                         "detail": {"bytes": n, "kind": "dir"},
                         "message": f"directory totals {n:,} B inside the vault"})
    for r, n in heavy_files:
        findings.append({"rule": "vault_heavy_path", "fixable": False, "path": r,
                         "detail": {"bytes": n, "kind": "file"},
                         "message": f"{n:,} B single file inside the vault"})

    covered = sum(n for _d, n in heavy_dirs) + sum(n for _r, n in heavy_files)
    repo_name = os.path.basename(root)
    stats = {
        "files": count,
        "bytes": total,
        "heavy_bytes": covered,
        "heavy_share": round(covered / total, 3) if total else 0.0,
        "ignore_filters": [f"{repo_name}/{p}" for p, _n in heavy_dirs]
                          + [f"{repo_name}/{r}" for r, _n in heavy_files],
    }
    return findings, stats


# ══════════════════════════════════════════════════════════════════════════
# The one mutation
# ══════════════════════════════════════════════════════════════════════════
def apply_superseded(findings, handoff_max, verbose=True):
    """Stamp `superseded: true` + `superseded_by:` on every R1 finding.

    Scope is hard-bounded three ways: only findings whose rule is
    `superseded_handoff`, only basenames matching HANDOFF_RE, and never the
    authoritative handoff itself. Idempotent — a file already carrying the key
    produces no finding, so a second run is a no-op.
    """
    # `superseded_by` records the authoritative handoff AT STAMP TIME. It does
    # not self-heal when a newer handoff lands, and that is deliberate: the
    # statement "132 superseded this" stays TRUE forever, it merely stops being
    # the latest. Refreshing it would rewrite ~130 files on every checkpoint to
    # restate a rule ("read the highest-numbered") that CLAUDE.md already owns.
    changed = []
    target = f"session_{handoff_max}_handoff.md"
    for f in findings:
        if f["rule"] != "superseded_handoff":
            continue
        path = os.path.join(ROOT, f["path"])
        base = os.path.basename(path)
        if not HANDOFF_RE.match(base):          # belt-and-braces
            continue
        if int(HANDOFF_RE.match(base).group(1)) >= handoff_max:
            continue
        text = read(path)
        fm_lines, _, has_fm = split_frontmatter(text)
        stamp = ["superseded: true", f"superseded_by: {target}"]
        if has_fm:
            lines = text.split("\n")
            close = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
            new = lines[:close] + stamp + lines[close:]
            out = "\n".join(new)
        else:
            out = "---\n" + "\n".join(stamp) + "\n---\n\n" + text
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(out)
        changed.append(f["path"])
        if verbose:
            print(f"  stamped {f['path']}")
    return changed


# ══════════════════════════════════════════════════════════════════════════
# Report
# ══════════════════════════════════════════════════════════════════════════
def build_report(payload):
    s, L = payload["summary"], []
    L.append(f"# Docs-corpus audit — {payload['generated']}")
    L.append("")
    L.append("Prose counterpart to `kb/_row_audit.py`. READ-ONLY except `--apply`, "
             "which stamps superseded handoffs (R1) and touches nothing else.")
    L.append("")
    L.append("## Corpus")
    L.append("")
    L.append("| Lane | Files | Bytes | Over budget |")
    L.append("|---|---:|---:|---:|")
    for lane, d in sorted(s["lanes"].items(), key=lambda kv: -kv[1]["bytes"]):
        L.append(f"| `{lane}` | {d['files']:,} | {d['bytes']:,} | {d['over']:,} |")
    L.append(f"| **total** | **{s['files']:,}** | **{s['bytes']:,}** | "
             f"**{s['over_budget']:,}** |")
    L.append("")
    L.append("### Context budget (the bytes every session pays)")
    L.append("")
    L.append(f"- Always-loaded surface: **{s['always_loaded_bytes']:,} B** across "
             f"{s['always_loaded_files']} file(s), budget {THRESHOLDS['always_loaded']:,} B.")
    L.append(f"- Superseded handoff weight: **{s['superseded_bytes']:,} B** across "
             f"{s['superseded_files']} file(s) — indexed and searchable, but only "
             f"`session_{s['handoff_max']}_handoff.md` is authoritative.")
    L.append("")
    v = s["vault"]
    L.append("### Vault weight (this repo is cloned INTO the Obsidian vault)")
    L.append("")
    L.append(f"- Working tree: **{v['bytes']:,} B across {v['files']:,} files** — all of it "
             f"inside the vault, only {s['files']:,} of those files are markdown.")
    L.append(f"- Heavy paths below account for **{v['heavy_bytes']:,} B "
             f"({v['heavy_share'] * 100:.0f}%)** of the tree.")
    L.append("")
    L.append("⚠️ Obsidian's **Files & Links → Excluded files** is a *relevance* filter — it "
             "drops paths from search, graph and link autocomplete, but it does **not** stop "
             "the file watcher, the metadata cache, or Obsidian Sync. Excluding these makes "
             "the vault easier to browse; it does not make it load faster. The only fix for "
             "load time is keeping build artifacts out of the vault (a clone sited outside "
             "it, or `.md`-only sparse-checkout for the vault-side copy).")
    L.append("")
    if v["ignore_filters"]:
        L.append("Paste-able `userIgnoreFilters` block for `.obsidian/app.json`:")
        L.append("")
        L.append("```json")
        L.append(json.dumps(v["ignore_filters"], indent=2))
        L.append("```")
        L.append("")
    L.append("## Findings")
    L.append("")
    if not payload["findings"]:
        L.append("None. The corpus is inside every budget and every contract.")
        return "\n".join(L) + "\n"
    L.append("| Rule | Count | Fixable |")
    L.append("|---|---:|:--:|")
    for rule, n in sorted(s["by_rule"].items(), key=lambda kv: -kv[1]):
        fixable = any(f["fixable"] for f in payload["findings"] if f["rule"] == rule)
        L.append(f"| `{rule}` | {n} | {'yes' if fixable else '—'} |")
    L.append("")

    for rule in sorted(s["by_rule"], key=lambda r: -s["by_rule"][r]):
        rows = [f for f in payload["findings"] if f["rule"] == rule]
        L.append(f"### `{rule}` — {len(rows)}")
        L.append("")
        if rule == "oversized_doc":
            rows.sort(key=lambda f: -f["detail"]["over_by"])
            L.append("| File | Lane | Bytes | Budget | × |")
            L.append("|---|---|---:|---:|---:|")
            for f in rows[:40]:
                d = f["detail"]
                L.append(f"| `{f['path']}` | {d['lane']} | {d['bytes']:,} | "
                         f"{d['limit']:,} | {d['ratio']}× |")
        elif rule == "vault_heavy_path":
            rows.sort(key=lambda f: -f["detail"]["bytes"])
            L.append("| Path | Kind | Bytes |")
            L.append("|---|---|---:|")
            for f in rows:
                L.append(f"| `{f['path']}` | {f['detail']['kind']} | "
                         f"{f['detail']['bytes']:,} |")
        elif rule == "kb_note_dialect":
            kinds = {}
            for f in rows:
                for d in f["detail"]["drift"]:
                    kinds[d] = kinds.get(d, 0) + 1
            L.append("Well-formed notes using a non-canonical dialect. **Not defects** — "
                     "listed so the drift is visible and normalising stays a judgment call.")
            L.append("")
            L.append("| Drift | Notes |")
            L.append("|---|---:|")
            for k, n in sorted(kinds.items(), key=lambda kv: -kv[1]):
                L.append(f"| {k} | {n} |")
        elif rule == "superseded_handoff":
            rows.sort(key=lambda f: f["detail"]["session"])
            span = f"{rows[0]['detail']['session']}–{rows[-1]['detail']['session']}"
            no_fm = sum(1 for f in rows if not f["detail"]["has_frontmatter"])
            L.append(f"Sessions {span}. {no_fm} of {len(rows)} have no frontmatter "
                     f"block and will have a minimal one created by `--apply`.")
            L.append("")
            L.append("Run `python3 kb/_docs_audit.py --apply` to stamp all of them.")
        else:
            L.append("| File | Detail |")
            L.append("|---|---|")
            for f in rows[:60]:
                L.append(f"| `{f['path']}` | {f['message']} |")
            if len(rows) > 60:
                L.append("")
                L.append(f"_…and {len(rows) - 60} more (full list in the JSON)._")
        L.append("")
    return "\n".join(L) + "\n"


# ══════════════════════════════════════════════════════════════════════════
def main():
    ap = argparse.ArgumentParser(description="Audit the docs corpus for accretion.")
    ap.add_argument("--apply", action="store_true",
                    help="stamp superseded handoffs (R1). The ONLY mutation.")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 if any finding remains (for CI gating)")
    ap.add_argument("--quiet", action="store_true",
                    help="write artifacts without the stdout digest")
    args = ap.parse_args()

    docs = collect(ROOT)
    handoff_max = find_handoff_max(docs)
    index_text = read_browsable_index()

    entries = []
    for path in docs:
        text = read(path)
        fm_lines, _, has_fm = split_frontmatter(text)
        fm, _order = parse_frontmatter(fm_lines) if has_fm else ({}, [])
        r = rel(path)
        entries.append({"path": path, "rel": r, "lane": lane_of(r), "fm": fm,
                        "has_fm": has_fm, "bytes": len(text.encode("utf-8")),
                        # ⚠ The full text, needed by rule_american_spelling.
                        # Added 2026-08-21: that rule shipped reading entry["text"]
                        # when no such key existed, so it returned None for every
                        # file and reported a clean corpus. An unfailable check —
                        # the fifth this session — caught only by noticing the
                        # rule was ABSENT from the summary rather than at zero.
                        "text": text})

    auth_created = None
    for e in entries:
        if e["lane"] == "handoff" and handoff_max is not None:
            m = HANDOFF_RE.match(os.path.basename(e["path"]))
            if m and int(m.group(1)) == handoff_max:
                auth_created = e["fm"].get("created")

    findings = []
    for e in entries:
        for f in (rule_superseded_handoff(e, handoff_max, auth_created),
                  rule_oversized_doc(e),
                  rule_kb_note_frontmatter(e),
                  rule_kb_note_dialect(e),
                  rule_american_spelling(e),
                  rule_frontmatter_log_chain(e),
                  rule_unindexed_kb_note(e, index_text),
                  rule_stacked_roadmap_cell(e),
                  rule_unreferenced_offload(e, ROOT),
                  rule_presentation_doctrine(e),
                  rule_critical_rule_doctrine(e),
                  rule_self_corrected_word_pair(e)):
            if f:
                f["path"] = e["rel"]
                findings.append(f)

    vault_findings, vault_stats = scan_vault_weight(ROOT)
    findings.extend(vault_findings)

    leak = rule_probe_instrument_leak(ROOT)
    if leak:
        leak["path"] = "docs/scenarios/"
        findings.append(leak)

    quiet_lanes = rule_lane_retirement_signal(ROOT)
    if quiet_lanes:
        quiet_lanes["path"] = "docs/reference/lanes/"
        findings.append(quiet_lanes)

    overdue = rule_checkpoint_overdue(ROOT)
    if overdue:
        findings.append(overdue)

    lanes = {}
    for e in entries:
        d = lanes.setdefault(e["lane"], {"files": 0, "bytes": 0, "over": 0})
        d["files"] += 1
        d["bytes"] += e["bytes"]
        if e["bytes"] > THRESHOLDS[e["lane"]]:
            d["over"] += 1

    sup = [f for f in findings if f["rule"] == "superseded_handoff"]
    sup_paths = {f["path"] for f in sup}
    by_rule = {}
    for f in findings:
        by_rule[f["rule"]] = by_rule.get(f["rule"], 0) + 1

    # Deliberately date-only, no wall-clock stamp: the receipts are committed, so
    # a sub-day timestamp makes every verification re-run dirty the working tree
    # by one line per file and trip the stop-hook with a no-op diff. The dated
    # filename already identifies the run; two runs on the same day that find the
    # same things should produce byte-identical receipts.
    payload = {
        "generated": date.today().isoformat(),
        "thresholds": THRESHOLDS,
        "summary": {
            "files": len(entries),
            "bytes": sum(e["bytes"] for e in entries),
            "over_budget": sum(1 for f in findings if f["rule"] == "oversized_doc"),
            "handoff_max": handoff_max,
            "always_loaded_files": sum(1 for e in entries if e["lane"] == "always_loaded"),
            "always_loaded_bytes": sum(e["bytes"] for e in entries
                                       if e["lane"] == "always_loaded"),
            "superseded_files": len(sup),
            "superseded_bytes": sum(e["bytes"] for e in entries
                                    if e["rel"] in sup_paths),
            "lanes": lanes,
            "by_rule": by_rule,
            "vault": vault_stats,
        },
        "findings": findings,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    stamp = payload["generated"]
    with open(os.path.join(OUT_DIR, f"{stamp}.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "latest.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, f"{stamp}.md"), "w", encoding="utf-8") as fh:
        fh.write(build_report(payload))

    if not args.quiet:
        s = payload["summary"]
        print(f"docs audit — {s['files']} files, {s['bytes']:,} B")
        for rule, n in sorted(by_rule.items(), key=lambda kv: -kv[1]):
            print(f"  {rule:<24} {n:>5}")
        if not by_rule:
            print("  (no findings)")
        print(f"  → kb/docs_audit/{stamp}.md")

    if args.apply:
        if not sup:
            # Say WHY there is nothing to stamp. "All handoffs already marked" is
            # false whenever the rule spared same-day parallel siblings, which is
            # the common case on a day two sessions checkpoint — and a lint tool
            # reporting a clean bill for a reason it did not check is exactly the
            # failure this file exists to catch.
            same_day = [e for e in entries
                        if e["lane"] == "handoff" and auth_created
                        and e["fm"].get("created") == auth_created
                        and HANDOFF_RE.match(os.path.basename(e["path"]))
                        and int(HANDOFF_RE.match(
                            os.path.basename(e["path"])).group(1)) < handoff_max]
            if same_day:
                print(f"--apply: nothing to stamp — {len(same_day)} lower-numbered "
                      f"handoff(s) share the authoritative one's `created` date and "
                      f"are treated as PARALLEL SIBLINGS, not superseded.")
            else:
                print("--apply: nothing to stamp (all handoffs already marked).")
        else:
            print(f"--apply: stamping {len(sup)} superseded handoff(s) "
                  f"(authoritative = session {handoff_max})")
            changed = apply_superseded(findings, handoff_max, verbose=not args.quiet)
            print(f"--apply: {len(changed)} file(s) changed. "
                  f"Re-run without --apply to confirm R1 is clear.")

    if args.strict and findings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
