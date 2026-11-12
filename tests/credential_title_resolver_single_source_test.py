#!/usr/bin/env python3
"""A stored credential title is resolved in ONE place: kb/credential_aliases.py.

Why: tests/alias_chain_single_source_test.py exists because a copied M-ID chain sat eight applies behind for
months under a comment promising lockstep. The credential rename snapshots carry the same risk, and #3140's
fifth review round found the copy's fault already: a second snapshot finder with no in-force filter replayed
an undone apply. So the resolver is single-source, and this test fails a second one.

Checks, each a way the copy could come back:
  1. No Python file reads kb/cred_rename_out/*/alias_map.json except kb/credential_aliases.py and the apply
     side, which writes and undoes the snapshots (named below, each with why). Tests may build fixtures.
  2. No Python file outside the module and the apply side defines a function that reads a snapshot's
     "renames", "merges" and "_applied_at" together: the resolver's shape under another name.
  3. No browser file reads the snapshots: map_links.js and every other page read kb/credential_title_moves.json,
     which kb/credential_aliases.py writes.
  4. That table is current, so the browser's answer is the module's.

Run from the repo root: python3 tests/credential_title_resolver_single_source_test.py
"""
import ast
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import credential_aliases as ca  # noqa: E402

SOURCE = "kb/credential_aliases.py"
# The apply side: these write, guard and undo the snapshots; none resolves a stored title for a reader.
APPLY_SIDE = {
    "kb/_cred_rename_apply.py": "writes each apply's alias_map.json snapshot",
    "kb/_cred_rename_apply_supabase.py": "moves the kb_curation rows of the snapshot it is handed",
    "kb/_cred_rename_undo.py": "reverses one receipt and writes undone.json",
    "kb/_cred_rename_dryrun.py": "previews a plan before any snapshot exists",
}
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv"}
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"\n      {detail}" if detail and not cond else ""))


def files(ext):
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(ext):
                p = os.path.join(dirpath, fn)
                yield os.path.relpath(p, ROOT).replace("\\", "/"), p


readers, shapes, unparsable = [], [], []
for rel, path in files(".py"):
    if rel == SOURCE or rel in APPLY_SIDE or rel.startswith("tests/"):
        continue
    src = open(path, encoding="utf-8").read()
    if "alias_map.json" not in src or "cred_rename_out" not in src:
        if '"_applied_at"' not in src:
            continue
    try:
        tree = ast.parse(src, filename=rel)
    except SyntaxError as e:
        unparsable.append(f"{rel}: {e}")
        continue
    consts = {n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
    if any("alias_map.json" in c for c in consts) and any("cred_rename_out" in c for c in consts):
        readers.append(rel)
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            fc = {n.value for n in ast.walk(node) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
            if {"renames", "merges", "_applied_at"} <= fc:
                shapes.append(f"{rel}:{node.lineno} def {node.name}()")

check("every candidate .py file parses", not unparsable, "; ".join(unparsable))
check("only kb/credential_aliases.py and the apply side read the rename snapshots", not readers,
      "second reader in " + ", ".join(readers) + " — import kb/credential_aliases.py (resolver, moves, load)")
check("no other file defines a resolver over a snapshot's renames, merges and _applied_at", not shapes,
      "resolver copy in " + ", ".join(shapes))

js = []
for rel, path in files(".js"):
    if rel.startswith("tests/"):
        continue
    src = open(path, encoding="utf-8", errors="replace").read()
    if "cred_rename_out" in src:
        js.append(rel)
check("no browser file reads the snapshots (it reads kb/credential_title_moves.json)", not js, ", ".join(js))
src = open(os.path.join(ROOT, "map_links.js"), encoding="utf-8").read()
check("map_links.js reads the generated table", "kb/credential_title_moves.json" in src)

have = open(os.path.join(ROOT, ca.TABLE), encoding="utf-8").read()
check("kb/credential_title_moves.json is current (python3 kb/credential_aliases.py)", have == ca._render(ROOT))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
