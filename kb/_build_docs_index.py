#!/usr/bin/env python3
"""Generate `docs/INDEX.md` and the per-lane catalogs under `docs/catalog/`.

WHY THIS IS GENERATED
---------------------
`docs/INDEX.md` was hand-maintained: every checkpoint appended rows, and when a
doc's lane had no table the session appended a whole `## Added <date>` section
instead. It reached **273,616 B — 6.8x the 40,000 B index budget** — and half of
that was link TEXT: a KB note's entire thesis pasted into a table cell, even
though the note's own frontmatter already carries a short `title:`. An index you
have to read in full is not an index.

The budget comment says the intent outright: *"a landing page you must scroll is
not a landing page."* 340 KB-note rows cannot live on a landing page at any
width, so the catalog moves out:

  * `docs/INDEX.md`      — the landing page. Hand-written prose is PRESERVED;
                           only the marker-delimited blocks are generated.
  * `docs/catalog/*.md`  — one generated catalog per lane, linked from INDEX.

Every row is derived from the doc's own frontmatter, so a title can no longer
drift from the note it names, and a new doc is listed by rebuilding rather than
by remembering. Titles fall back to the first `# ` heading, then the filename —
22 handoffs and 3 workstream docs carry no frontmatter.

⚠ THE GENERATOR OWNS ONLY WHAT IS BETWEEN MARKERS. Everything outside
`<!-- generated:<name> -->` / `<!-- /generated:<name> -->` in INDEX.md survives
byte-for-byte, so the lane explanations, orientation pointers, Sierra docs and
the update history stay hand-written. This mirrors `excel_to_dashboard.py`,
which replaces whole sections of the dashboard and leaves the rest alone.

Usage:
  python3 kb/_build_docs_index.py           # write
  python3 kb/_build_docs_index.py --check   # exit 1 if a rebuild would change
                                            # anything (CI / tests)
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _docs_audit import parse_frontmatter, kb_type_of, HANDOFF_RE  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
NOTES = os.path.join(DOCS, "kb-notes")
CATALOG = os.path.join(DOCS, "catalog")
INDEX = os.path.join(DOCS, "INDEX.md")
FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)
MARKER = "<!-- generated:%s -->"
END = "<!-- /generated:%s -->"


# ── reading ────────────────────────────────────────────────────────────────
def load(path):
    """(frontmatter dict, title, body) for one doc, tolerating no frontmatter."""
    text = open(path, encoding="utf-8").read()
    m = FM_RE.match(text)
    fm = parse_frontmatter(m.group(1).split("\n"))[0] if m else {}
    title = _scalar(fm.get("title"))
    if not title:
        h = re.search(r"^#\s+(.+?)\s*$", text[m.end() if m else 0:], re.M)
        title = h.group(1) if h else os.path.basename(path)[:-3]
    return fm, title, text


def _scalar(v):
    if v is None or isinstance(v, list):
        return None
    return str(v).strip().strip("\"'") or None


def _date(fm, *keys):
    for k in keys:
        v = _scalar(fm.get(k))
        if v:
            return v[:10]
    return ""


def _cell(s):
    """Make a string safe inside a markdown table cell."""
    return re.sub(r"\s+", " ", str(s)).replace("|", "\\|").strip()


def _tags(fm):
    t = fm.get("tags") or []
    t = t if isinstance(t, list) else [t]
    return [x for x in (_scalar(v) for v in t) if x]


def _governs(fm):
    """`artifacts:` — the files a note declares it governs. This is what makes a
    theme traceable back to the document that set it."""
    a = fm.get("artifacts") or []
    a = a if isinstance(a, list) else [a]
    out = []
    for v in a:
        v = _scalar(v) or ""
        v = v.split("#")[0].split("(")[0].strip()   # strip trailing commentary
        if v:
            out.append(v)
    return out


def _link(text, href):
    return f"[{_cell(text)}]({href})"


# ── the lanes ──────────────────────────────────────────────────────────────
def kb_notes():
    rows = []
    for fn in sorted(os.listdir(NOTES)):
        if not fn.endswith(".md") or fn.startswith("_") or fn == "README.md":
            continue
        fm, title, _ = load(os.path.join(NOTES, fn))
        rows.append({
            "sort": (kb_type_of(fm)[0] or "~", title.lower()),
            "cells": [_link(title, f"../kb-notes/{fn}"),
                      kb_type_of(fm)[0] or "—",
                      _scalar(fm.get("kb-status")) or "—",
                      _date(fm, "created", "date"),
                      _date(fm, "updated")],
            "meta": {"path": f"docs/kb-notes/{fn}", "title": title,
                     "type": kb_type_of(fm)[0], "status": _scalar(fm.get("kb-status")),
                     "created": _date(fm, "created", "date"),
                     "updated": _date(fm, "updated"),
                     "tags": _tags(fm), "governs": _governs(fm)},
        })
    return rows


def _docs_matching(pred, sort_key):
    rows = []
    for fn in sorted(os.listdir(DOCS)):
        if not fn.endswith(".md") or fn == "INDEX.md" or not pred(fn):
            continue
        fm, title, _ = load(os.path.join(DOCS, fn))
        rows.append({
            "sort": sort_key(fn, title),
            "cells": [_link(title, f"../{fn}"), f"`{fn}`",
                      _date(fm, "created", "date"), _date(fm, "updated")],
            "meta": {"path": f"docs/{fn}", "title": title, "type": None,
                     "status": _scalar(fm.get("kb-status")),
                     "created": _date(fm, "created", "date"),
                     "updated": _date(fm, "updated"),
                     "tags": _tags(fm), "governs": _governs(fm)},
        })
    return rows


def lessons():
    return _docs_matching(lambda f: f.endswith(("_lessons.md", "_lessons_archive.md")),
                          lambda f, t: (t.lower(),))


def workstream_docs():
    def other(f):
        return not (HANDOFF_RE.match(f) or f.endswith(("_lessons.md",
                                                       "_lessons_archive.md")))
    return _docs_matching(other, lambda f, t: (t.lower(),))


def handoffs():
    rows = []
    for fn in sorted(os.listdir(DOCS)):
        m = HANDOFF_RE.match(fn)
        if not m:
            continue
        fm, title, _ = load(os.path.join(DOCS, fn))
        n = int(m.group(1))
        # Titles read "Session 101 handoff — after ..."; the number is already
        # the first column, so the redundant prefix is dropped.
        short = re.sub(r"^Session\s+\d+\s+handoff\s*[—–-]\s*", "", title)
        rows.append({"sort": (-n,),
                     "cells": [str(n), _link(short, f"../{fn}"),
                               _date(fm, "created", "date")],
                     "meta": {"path": f"docs/{fn}", "title": short, "n": n,
                              "type": None, "status": _scalar(fm.get("kb-status")),
                              "created": _date(fm, "created", "date"),
                              "updated": _date(fm, "updated"),
                              "tags": _tags(fm), "governs": []}})
    return rows


def doctrine_docs():
    """The files that SHAPE BEHAVIOR rather than record it.

    ⭐ `CLAUDE.md` auto-loads into every session, so when something the system
    does keeps disagreeing with what Sam expects, this is the likeliest source —
    yet `kb/doctrine.py` puts it in NOISE (correct for `--changed`, wrong for a
    "which document taught it that?" lookup). The commands are the procedures
    sessions follow verbatim; today proved they can go stale silently.
    """
    cmd_dir = os.path.join(ROOT, ".claude", "commands")
    paths = ["CLAUDE.md", "README.md", "kb/README.md"]
    if os.path.isdir(cmd_dir):
        paths += sorted(".claude/commands/" + f for f in os.listdir(cmd_dir)
                        if f.endswith(".md"))

    # ⚠ Dates come from FRONTMATTER only, never from git. These files mostly
    # carry none, so their date cells stay blank — deliberate. Deriving a date
    # from `git log` would make the committed artifact depend on history rather
    # than content, so every edit to CLAUDE.md would leave the index stale and
    # turn `--check` red until someone rebuilt. The entry point here is a THEME,
    # not a date, and GitHub shows last-changed on the page you land on.
    out = []
    for rel_path in paths:
        full = os.path.join(ROOT, rel_path)
        if not os.path.isfile(full):
            continue
        fm, title, _ = load(full)
        out.append({"sort": (rel_path.lower(),),
                    "cells": [_link(title, "../../" + rel_path), f"`{rel_path}`",
                              _date(fm, "created", "date"), _date(fm, "updated")],
                    "meta": {"path": rel_path, "title": title, "type": "doctrine",
                             "status": _scalar(fm.get("kb-status")),
                             "created": _date(fm, "created", "date"),
                             "updated": _date(fm, "updated"),
                             "tags": _tags(fm), "governs": []}})
    return out


LANES = [
    ("doctrine", "Doctrine (behavior-shaping)", "CLAUDE.md - README - .claude/commands/",
     ["Title", "File", "Created", "Updated"], doctrine_docs,
     "The files that shape how a session BEHAVES rather than record what it did. "
     "`CLAUDE.md` auto-loads into every session, so it is the likeliest source of "
     "a recurring mismatch between what the system does and what you expected."),
    ("kb-notes", "KB notes", "docs/kb-notes/",
     ["Title", "Type", "Status", "Created", "Updated"], kb_notes,
     "Distilled, durable, reusable knowledge — the Obsidian-target lane. "
     "Contract: [`kb-notes/README.md`](../kb-notes/README.md)."),
    ("lessons", "Lessons docs", "docs/*_lessons.md",
     ["Title", "File", "Created", "Updated"], lessons,
     "Workstream scratchpads. A dated section is appended at every checkpoint."),
    ("workstream-docs", "Workstream docs", "docs/*.md",
     ["Title", "File", "Created", "Updated"], workstream_docs,
     "Scopes, plans, specs, briefs and workstream handoffs — everything in "
     "`docs/` that is not a lessons doc or a session handoff."),
    ("session-handoffs", "Session handoffs", "docs/session_<N>_handoff.md",
     ["N", "Handoff", "Created"], handoffs,
     "One per session, newest first. **Only the highest-numbered handoff is "
     "authoritative** — the rest are history."),
]


# ── rendering ──────────────────────────────────────────────────────────────
def table(headers, rows):
    out = ["| " + " | ".join(headers) + " |",
           "|" + "|".join(["---"] * len(headers)) + "|"]
    for r in sorted(rows, key=lambda r: r["sort"]):
        out.append("| " + " | ".join(r["cells"]) + " |")
    return "\n".join(out)


def catalog_page(slug, name, glob, headers, rows, blurb):
    return "\n".join([
        "---",
        f"title: {name} — catalog",
        "created: 2026-08-28",
        "updated: 2026-08-28",
        "tags: [meta, index, obsidian-target, generated]",
        "kb-status: internal",
        "obsidian-folder: cpl-project-tracker/catalog",
        "related:",
        '  - "[[docs/INDEX]]"',
        "---",
        "",
        f"# {name} — catalog",
        "",
        f"**Generated** by `kb/_build_docs_index.py` from each doc's own "
        f"frontmatter. Do not hand-edit — rebuild instead. Source: `{glob}`.",
        "",
        blurb,
        "",
        f"{len(rows)} document(s).",
        "",
        table(headers, rows),
        "",
    ])


def summary_block(counts):
    lines = ["| Lane | Docs | Catalog |", "|---|---:|---|"]
    for slug, name, _glob, _h, _f, _b in LANES:
        lines.append(f"| {name} | {counts[slug]} | "
                     f"[`catalog/{slug}.md`](catalog/{slug}.md) |")
    lines.append(f"| **total** | **{sum(counts.values())}** | |")
    return "\n".join(lines)


def catalog_json(counts, lanes_rows):
    """Machine-readable twin of the catalogs, for the COBI Governance panel.

    ⭐ WHY JSON AND NOT "just link to GitHub": Sam's use case is diagnostic, not
    a review round — *"when I see recurring or thematic misalignments with my
    expectations that could be artifact-based."* That means the entry point is a
    THEME, and a theme can only be searched if titles, tags and the `artifacts:`
    a note declares it governs are queryable. A page of links cannot answer
    "which document taught it that?"; this can.

    ⚠ It is a projection of the same rows the markdown catalogs render, built in
    the same pass — so the panel and the catalogs cannot disagree about what
    exists. Adding a second collector here is how they would drift.
    """
    return json.dumps({
        "generated": "2026-08-28",
        "repo": "CPL-Initiative/cpl-project-tracker",
        "branch": "main",
        "total": sum(counts.values()),
        "lanes": [
            {"slug": slug, "name": name, "blurb": blurb, "count": counts[slug],
             "docs": [r["meta"] for r in sorted(rows, key=lambda r: r["sort"])
                      if r.get("meta")]}
            for (slug, name, _glob, _h, _f, blurb), rows in lanes_rows
        ],
    }, indent=1, sort_keys=True) + "\n"


def replace_block(text, slug, body):
    start, end = MARKER % slug, END % slug
    pat = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pat.search(text):
        raise SystemExit(f"docs/INDEX.md is missing the {start} … {end} markers")
    return pat.sub(lambda _: f"{start}\n{body}\n{end}", text)


def main():
    check = "--check" in sys.argv
    os.makedirs(CATALOG, exist_ok=True)
    counts, writes = {}, []

    lanes_rows = []
    for lane in LANES:
        slug, name, glob, headers, fetch, blurb = lane
        rows = fetch()
        counts[slug] = len(rows)
        lanes_rows.append((lane, rows))
        writes.append((os.path.join(CATALOG, f"{slug}.md"),
                       catalog_page(slug, name, glob, headers, rows, blurb)))
    writes.append((os.path.join(CATALOG, "index.json"),
                   catalog_json(counts, lanes_rows)))

    index = open(INDEX, encoding="utf-8").read()
    index = replace_block(index, "corpus", summary_block(counts))
    writes.append((INDEX, index))

    stale = []
    for path, body in writes:
        old = open(path, encoding="utf-8").read() if os.path.isfile(path) else None
        if old == body:
            continue
        stale.append(os.path.relpath(path, ROOT))
        if not check:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(body)

    total = sum(counts.values())
    if check:
        if stale:
            print("stale (rebuild needed):\n  " + "\n  ".join(stale))
            return 1
        print(f"docs index up to date — {total} docs across {len(LANES)} lanes")
        return 0
    print(f"docs index rebuilt — {total} docs across {len(LANES)} lanes")
    for slug, name, *_ in LANES:
        print(f"  {counts[slug]:>4}  {name}")
    if stale:
        print("changed:\n  " + "\n  ".join(stale))
    return 0


if __name__ == "__main__":
    sys.exit(main())
