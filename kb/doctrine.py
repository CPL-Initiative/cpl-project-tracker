#!/usr/bin/env python3
"""
Doctrine lookup — "what has this repo already decided about the files I am
about to touch?"

WHY THIS EXISTS
---------------
Rule 8 gives us **ingest** (checkpoints write), sessions give us **query** (they
read), and `_docs_audit.py` gives us **lint** (the corpus is kept honest). All
three assume someone REMEMBERS to consult the right note at the right second,
and that is precisely the step that keeps failing.

Measured 2026-08-21, after Session 178 shipped four defects that were each
covered by a rule already committed here:

  * 299 KB notes; 236 of them prescriptive (methodology / playbook / adr).
  * 238 notes (79%) declare, in `artifacts:`, exactly which files they govern.
  * `chatbox/supabase/functions/cpl-chat/index.ts` — the file where the
    "3 of 9 LACCD colleges" cap shipped — is named by **22 notes**, four of
    them about CAPS, one of them titled
    *"A capped list must never read as a census."*

So the knowledge was not merely written down. It was written down, distilled to
a title that states the rule, and **indexed to the exact file**. What was
missing was a way to ask. Recall does not scale past a few dozen notes; lookup
does.

    python3 kb/doctrine.py --changed              # ⭐ the one to use
    python3 kb/doctrine.py cpl_chat.js tests/x.js
    python3 kb/doctrine.py --topic caps

⚠ HONEST LIMIT — this still has to be INVOKED, which is the same weakness as any
rule that lives in prose. It is a smaller weakness only because `--changed`
needs no knowledge of WHICH note matters: it reads the diff. The mechanism that
needs no invocation is a test (see `tests/lib/check_ledger.js`), and where a
rule can be made into one, it should be. This is for the majority that cannot.

Pure stdlib. Read-only — it never writes a file.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTES_DIR = os.path.join(ROOT, "docs", "kb-notes")

# A note's TITLE in this corpus is the rule ("A capped list must never read as a
# census"), so the title is the payload — not a filename to go and open. That is
# what makes a 20-note answer readable instead of a reading list.
FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)
TITLE_RE = re.compile(r"^title:\s*(.+?)\s*$", re.M)
TAGS_RE = re.compile(r"^tags:\s*\[(.*?)\]", re.M | re.S)
STATUS_RE = re.compile(r"^kb-status:\s*(\S+)", re.M)
ARTIFACTS_RE = re.compile(r"^artifacts:\s*\n((?:[ \t]+-.*\n)*)", re.M)
LIST_ITEM_RE = re.compile(r"^[ \t]+-\s*(.+?)\s*$", re.M)
SUMMARY_RE = re.compile(r"^>\s*\*\*One-sentence summary\*\*\s*[—-]?\s*(.+?)(?:\n>\s*\n|\n\n)", re.S | re.M)

# Prescriptive lanes only. A `reference` or `glossary` note is a lookup card, not
# a rule you can violate, and mixing them in would bury the rules in trivia.
PRESCRIPTIVE = {"methodology", "playbook", "adr"}
# Paths so widely named that listing their notes tells you nothing specific.
NOISE = {"CLAUDE.md", "README.md", "docs/INDEX.md", "package.json"}


def _clean(s: str) -> str:
    return s.strip().strip('"').strip("'").strip()


def _norm(path: str) -> str:
    """Normalize a repo path WITHOUT eating a leading dot.

    ⚠ `lstrip("./")` strips any leading run of `.` and `/`, so
    `.github/workflows/x.yml` becomes `github/workflows/x.yml` — a dot-directory
    silently renamed. This repo has met the same class before: a `\b`-anchored
    path regex in the governance drift detector could not match before a `.` and
    reported a real file as missing. Strip the `./` PREFIX only.
    """
    p = path.replace(os.sep, "/").strip()
    while p.startswith("./"):
        p = p[2:]
    return p


def load_notes():
    """Parse every KB note once. Returns a list of dicts."""
    notes = []
    if not os.path.isdir(NOTES_DIR):
        return notes
    for fn in sorted(os.listdir(NOTES_DIR)):
        if not fn.endswith(".md") or fn.startswith("_") or fn == "README.md":
            continue
        path = os.path.join(NOTES_DIR, fn)
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        m = FM_RE.match(text)
        # ⚠ The trailing newline is load-bearing. FM_RE stops BEFORE the closing
        # `---`, so the frontmatter it captures ends without one — and the
        # artifact-list pattern requires each item to end in a newline. Without
        # this the LAST artifact of every note is silently dropped: 235 entries
        # across the corpus, the parser reporting a clean read the whole time.
        # Caught because a lookup on tests/run.js failed to surface the note
        # that names tests/run.js last.
        fm = (m.group(1) + "\n") if m else ""
        body = text[m.end():] if m else text
        tm = TITLE_RE.search(fm)
        tags = []
        gm = TAGS_RE.search(fm)
        if gm:
            tags = [_clean(x) for x in gm.group(1).split(",") if _clean(x)]
        am = ARTIFACTS_RE.search(fm)
        artifacts = []
        if am:
            artifacts = [_clean(x) for x in LIST_ITEM_RE.findall(am.group(1))]
            artifacts = [a for a in artifacts if a and not a.startswith("#")]
        sm = SUMMARY_RE.search(body)
        summary = " ".join(sm.group(1).split()) if sm else ""
        st = STATUS_RE.search(fm)
        notes.append({
            "slug": fn[:-3],
            "file": fn,
            "title": _clean(tm.group(1)) if tm else fn[:-3].replace("-", " "),
            "tags": tags,
            "artifacts": artifacts,
            "summary": summary,
            "status": _clean(st.group(1)) if st else "",
            "body": body,
            "kind": next((t for t in tags if t in PRESCRIPTIVE), None),
        })
    return notes


def build_index(notes):
    """file path -> [(tier, note)].

    Tier 1 — the note DECLARES the file in `artifacts:`. Precise, authored.
    Tier 2 — the file path appears in the note's prose. Noisier, but it found
             twice as many notes for `cpl-chat/index.ts` as the declarations
             did, and a rule you are about to break does not care which half of
             the note names your file.
    """
    idx = defaultdict(list)
    for n in notes:
        declared = set()
        for a in n["artifacts"]:
            if a in NOISE:
                continue
            idx[a].append((1, n))
            declared.add(a)
        # Body mentions: only paths that look like real repo files, and only
        # ones the note did not already declare.
        for path in set(re.findall(r"[A-Za-z0-9_./-]+\.(?:js|py|ts|json|html|css|sql|yml|md|sh)", n["body"])):
            path = _norm(path)
            if path in declared or path in NOISE:
                continue
            if path.startswith("docs/kb-notes/"):
                continue
            idx[path].append((2, n))
    return idx


def resolve(target, idx):
    """Match a path against the index, falling back to basename.

    A session names the file it is editing, which may be an absolute path, a
    repo-relative path, or just a basename — all three have to land.
    """
    t = os.path.relpath(os.path.abspath(target), ROOT) if os.path.exists(target) else target
    t = _norm(t)
    hits = list(idx.get(t, []))
    if hits:
        return t, hits
    base = os.path.basename(t)
    if base and base != t:
        for k, v in idx.items():
            if os.path.basename(k) == base:
                hits.extend(v)
    return t, hits


def _git(cmd):
    try:
        r = subprocess.run(["git"] + cmd, cwd=ROOT, capture_output=True, text=True, timeout=20)
        if r.returncode == 0:
            return [x.strip() for x in r.stdout.splitlines() if x.strip()]
    except (OSError, subprocess.SubprocessError):
        pass
    return []


def changed_files(base=None):
    """What am I working on right now?

    ⚠ UNTRACKED FILES ARE INCLUDED, and that is not a detail. The first run of
    this tool reported 132 files and silently omitted all three files the
    session had just written, because `git diff` does not see an untracked
    file — the same shape as every "a page that drops something still looks
    complete" finding in this repo. A brand-new file is exactly the one with no
    doctrine loaded in anyone's head.

    ⚠ The base-branch diff is OPT-IN (`--base`), never part of the default. A
    clone whose `origin/main` ref is stale turns `origin/main...HEAD` into
    138 files of already-merged work, and an answer that long is one nobody
    reads — which costs more than the few files it adds.
    """
    out = set()
    out.update(_git(["diff", "--name-only"]))
    out.update(_git(["diff", "--name-only", "--cached"]))
    out.update(_git(["ls-files", "--others", "--exclude-standard"]))
    if base:
        out.update(_git(["diff", "--name-only", base + "...HEAD"]))
    # A note is not a code file; listing doctrine about doctrine is noise.
    return sorted(f for f in out if not f.startswith("docs/kb-notes/"))


def rank(hits, prescriptive_only=True):
    """Dedupe by slug, best tier wins, rules before reference material."""
    best = {}
    for tier, n in hits:
        if prescriptive_only and not n["kind"]:
            continue
        if n["slug"] not in best or tier < best[n["slug"]][0]:
            best[n["slug"]] = (tier, n)
    return sorted(best.values(), key=lambda tn: (tn[0], tn[1]["title"].lower()))


def render(target, ranked, limit, show_summary):
    if not ranked:
        print("  (no note names this file)")
        return
    for tier, n in ranked[:limit]:
        mark = "*" if tier == 1 else " "
        print("  {} {}".format(mark, n["title"]))
        if show_summary and n["summary"]:
            s = n["summary"]
            print("      {}".format(s if len(s) <= 160 else s[:157] + "…"))
        print("      docs/kb-notes/{}.md".format(n["slug"]))
    if len(ranked) > limit:
        print("  … and {} more (use --limit {})".format(len(ranked) - limit, len(ranked)))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="What has this repo already decided about these files?")
    ap.add_argument("paths", nargs="*", help="files you are about to change")
    ap.add_argument("--changed", action="store_true",
                    help="read the files from the working diff (the usual way in)")
    ap.add_argument("--base", default=None,
                    help="also include everything changed since this ref (e.g. origin/main). "
                         "OFF by default — a stale remote ref makes the answer unreadably long.")
    ap.add_argument("--topic", help="search titles, tags and summaries for a word")
    ap.add_argument("--limit", type=int, default=8, help="notes shown per file")
    ap.add_argument("--summary", action="store_true", help="print each note's one-liner")
    ap.add_argument("--all-kinds", action="store_true",
                    help="include reference/glossary notes, not just rules")
    args = ap.parse_args(argv)

    notes = load_notes()
    if not notes:
        print("No KB notes found under docs/kb-notes/.", file=sys.stderr)
        return 1
    idx = build_index(notes)
    only_rules = not args.all_kinds

    if args.topic:
        q = args.topic.lower()
        hits = [(1, n) for n in notes
                if q in n["title"].lower() or q in " ".join(n["tags"]).lower()
                or q in n["summary"].lower()]
        print("\nNotes matching {!r}:".format(args.topic))
        render(args.topic, rank(hits, only_rules), args.limit, True)
        return 0

    targets = list(args.paths)
    if args.changed or not targets:
        found = changed_files(args.base)
        if not found and not targets:
            print("Nothing changed, and no paths given. Try:\n"
                  "  python3 kb/doctrine.py <file>…    python3 kb/doctrine.py --topic caps")
            return 0
        targets.extend(f for f in found if f not in targets)

    print("\n═══ Doctrine for {} file(s) — `*` = the note names this file explicitly"
          .format(len(targets)))
    total = 0
    for t in targets:
        resolved, hits = resolve(t, idx)
        ranked = rank(hits, only_rules)
        total += len(ranked)
        print("\n▸ {}".format(resolved))
        render(resolved, ranked, args.limit, args.summary)
    if total:
        print("\n{} rule(s) already committed about these files. Read the titles before you"
              " write — that is the whole point of this tool.".format(total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
