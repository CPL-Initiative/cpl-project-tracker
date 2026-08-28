#!/usr/bin/env python3
"""Unit tests for the docs-index generator (kb/_build_docs_index.py).

`docs/INDEX.md` was hand-maintained and rotted to 273,616 B — 6.8x the 40,000 B
index budget — because every checkpoint appended rows, and a doc whose lane had
no table got a whole `## Added <date>` section instead. The listings are now
generated from each doc's own frontmatter into `docs/catalog/*.md`.

The invariants worth guarding are the ones whose failure is SILENT:

  1. Hand-written prose outside the markers must survive a rebuild. The
     generator owning the whole file would quietly eat the lane explanations,
     the orientation pointers and the update history.
  2. A note must stay reachable by BROWSING. Moving the listings out of INDEX.md
     is exactly the move that orphans 340 notes if the auditor still reads only
     INDEX.md — the rebuild would look like a tidy-up while making every note
     unreachable.
  3. `--check` must actually fail on a stale index, or CI silently permits drift
     and the file rots the same way by a different route.
  4. A doc with no frontmatter must still get a real title. 22 handoffs and 3
     workstream docs have none; falling back to the filename would render a
     catalog of slugs.

Run: python3 tests/docs_index_build_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(name, relpath):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, relpath))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


bi = _load("_build_docs_index", "kb/_build_docs_index.py")
da = _load("_docs_audit", "kb/_docs_audit.py")

results = []


def check(name, cond):
    results.append((name, bool(cond)))


INDEX = os.path.join(ROOT, "docs", "INDEX.md")
CATALOG = os.path.join(ROOT, "docs", "catalog")
index_text = open(INDEX, encoding="utf-8").read()

# ── 1. the committed tree is up to date ───────────────────────────────────
r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_docs_index.py"),
                    "--check"], capture_output=True, text=True, cwd=ROOT)
check("check: the committed index and catalogs are up to date", r.returncode == 0)

# ── 2. INDEX.md is inside the landing-page budget ─────────────────────────
budget = da.THRESHOLDS["index"]
check(f"budget: INDEX.md fits the {budget:,} B index lane",
      len(index_text.encode("utf-8")) <= budget)

# ── 3. hand-written prose survives outside the markers ────────────────────
for phrase in ("## The three lanes", "## Update history",
               "## Sierra integration docs", "## Top-level orientation docs"):
    check(f"prose: `{phrase}` survives generation", phrase in index_text)

check("prose: the generator only claims the marker block",
      index_text.count("<!-- generated:") == 1)

# ── 4. every KB note is reachable by browsing ─────────────────────────────
notes = [f for f in os.listdir(os.path.join(ROOT, "docs", "kb-notes"))
         if f.endswith(".md") and not f.startswith("_") and f != "README.md"]
browsable = da.read_browsable_index()
missing = [f for f in notes if f[:-3] not in browsable]
check(f"reach: all {len(notes)} KB notes are reachable from INDEX + catalogs",
      not missing)

# ── 5. …and reachability really depends on INDEX linking the catalog ──────
# A guard that cannot fail is not a guard. Unlink the catalog and the notes in
# it must go unreachable again.
_tmp = tempfile.mkdtemp()
try:
    shutil.copytree(os.path.join(ROOT, "docs"), os.path.join(_tmp, "docs"))
    unlinked = index_text.replace("(catalog/kb-notes.md)", "(catalog/GONE.md)")
    open(os.path.join(_tmp, "docs", "INDEX.md"), "w", encoding="utf-8").write(unlinked)
    _real_root = da.ROOT
    da.ROOT = _tmp
    try:
        broken = da.read_browsable_index()
    finally:
        da.ROOT = _real_root
    check("reach: unlinking a catalog makes its notes unreachable (the guard fails)",
          any(f[:-3] not in broken for f in notes))
finally:
    shutil.rmtree(_tmp, ignore_errors=True)

# ── 6. catalogs are complete and well-formed ──────────────────────────────
for slug, name, _glob, headers, fetch, _blurb in bi.LANES:
    path = os.path.join(CATALOG, f"{slug}.md")
    body = open(path, encoding="utf-8").read()
    rows = fetch()
    check(f"catalog/{slug}: exists and is non-empty", len(rows) > 0)
    check(f"catalog/{slug}: renders one row per document",
          body.count("\n| ") - 1 == len(rows))     # minus the header separator
    check(f"catalog/{slug}: header matches the lane's columns",
          "| " + " | ".join(headers) + " |" in body)

# ── 7. titles never degrade to a slug when frontmatter is absent ──────────
# reference-ui-design-system is a real note; the fallback path is exercised by
# the handoffs and workstream docs that carry no frontmatter at all.
nofm = []
for fn in os.listdir(os.path.join(ROOT, "docs")):
    if not fn.endswith(".md") or fn == "INDEX.md":
        continue
    p = os.path.join(ROOT, "docs", fn)
    raw = open(p, encoding="utf-8").read()
    if raw.startswith("---\n"):
        continue
    _fm, title, _t = bi.load(p)
    nofm.append((fn, title))
check("title: every frontmatter-less doc still resolves a heading, not its slug",
      nofm and all(t != fn[:-3] for fn, t in nofm))

# ── 8. table cells can never break the table ──────────────────────────────
check("cell: a pipe in a title is escaped", bi._cell("a | b") == "a \\| b")
check("cell: a newline in a title is folded", "\n" not in bi._cell("a\nb"))

# ── 9. the sort is deterministic (a rebuild must not churn the diff) ───────
check("sort: two builds of the same lane agree",
      [r["cells"] for r in sorted(bi.kb_notes(), key=lambda r: r["sort"])]
      == [r["cells"] for r in sorted(bi.kb_notes(), key=lambda r: r["sort"])])

# ── summary ───────────────────────────────────────────────────────────────
failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ok   " if ok else "  FAIL ") + n)
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
