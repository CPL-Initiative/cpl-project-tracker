#!/usr/bin/env python3
"""Rewrite British spellings to American across the docs corpus — PROSE ONLY.

Sam, 2026-08-21: *"As a Yank, I prefer American, of course."* `kb/_docs_audit.py`
reports the drift (`american_spelling`); this applies it. The forms are IMPORTED
from the auditor's BRITISH_FORMS so the fixer can never fix something the lint
does not flag, or miss something it does.

⚠ THE RULE IS PROSE-ONLY AND SO IS THIS — via the SAME `prose_only()` mask the
auditor scans, so the lint can never report a hit this refuses to touch. A blind
substitution across a markdown corpus corrupts things that are NAMES, not
spellings. Masked out, offsets preserved:

  * fenced blocks, inline code spans and indented code — `grey` is a CSS
    keyword and a token name is not a spelling;
  * markdown link TARGETS and bare URLs — editing inside `](...)` silently
    breaks the link;
  * wikilinks `[[...]]`, including the quoted ones under `related:` — these
    address a note by filename;
  * any bare `*.md` filename appearing in prose.

⚠ FILENAMES ARE NEVER RENAMED. Five notes carry a British form in their own
filename (`methodology-normalise-both-sides-of-a-join.md` and friends). A
filename is an identifier referenced from CLAUDE.md, from other notes' `related:`
wikilinks and from `cpl_memory` rows, so renaming is a separate, coordinated
operation — this pass reports them and leaves them alone.

⭐ TAGS ARE REWRITTEN, DELIBERATELY. In Obsidian a tag is navigation, and the
corpus had `data-modelling` (4 notes) beside `data-modeling` (1), and
`prioritisation` (3) beside `prioritization` (3) — the tag pane renders each
pair as two unrelated tags, so on the 3/3 split NEITHER view is complete.

Generated files (`docs/catalog/*.md`) are skipped: their text comes from note
titles, so they are corrected by fixing the source note and rebuilding.

Usage:  python3 kb/_fix_american_spelling.py [--apply] [--skip <relpath> ...]
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _docs_audit import (BRITISH_FORMS, _IS_PATTERN, collect, prose_only,  # noqa: E402
                         rel, ROOT)

GENERATED = ("docs/catalog/",)
BRITISH_IN_NAME = re.compile(
    r"normalis|behaviour|colour|organis|recognis|generalis|prioritis|minimis|"
    r"summaris|categoris|judgement|programme|catalogue|modelling|labelled|"
    r"centred|defence|cancelled|acknowledgement|sceptic", re.I)



def match_case(src, repl):
    """Carry the source's case onto the replacement stem."""
    if src.isupper():
        return repl.upper()
    if src[:1].isupper():
        return repl[:1].upper() + repl[1:]
    return repl


def fix(text):
    masked = prose_only(text)
    spans = []
    for brit, amer in BRITISH_FORMS:
        pat = brit if _IS_PATTERN.search(brit) else re.escape(brit)
        for m in re.finditer(pat, masked, re.I):
            spans.append((m.start(), m.end(), amer))
    if not spans:
        return text, 0
    spans.sort(key=lambda s: -s[0])
    for a, b, amer in spans:
        text = text[:a] + match_case(text[a:b], amer) + text[b:]
    return text, len(spans)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--skip", nargs="*", default=[],
                    help="repo-relative paths to leave alone (e.g. another "
                         "live session's lane)")
    args = ap.parse_args()

    skip = set(args.skip)
    total = files = 0
    renames = []
    for path in collect(ROOT):
        r = rel(path)
        if r in skip or r.startswith(GENERATED):
            continue
        if BRITISH_IN_NAME.search(os.path.basename(r)):
            renames.append(r)
        text = open(path, encoding="utf-8").read()
        new, n = fix(text)
        if not n:
            continue
        files += 1
        total += n
        print(f"  {'FIX ' if args.apply else 'PLAN'}  {r}: {n}")
        if args.apply:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)

    print(f"\n{'applied' if args.apply else 'planned'}: {total} replacement(s) "
          f"in {files} file(s); skipped {len(skip)}")
    if renames:
        print("\nNOT renamed (a filename is an identifier — needs a coordinated "
              "pass over CLAUDE.md, `related:` wikilinks and cpl_memory):")
        for r in renames:
            print(f"  {r}")
    if not args.apply and total:
        print("\nre-run with --apply to write, then rebuild the catalogs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
