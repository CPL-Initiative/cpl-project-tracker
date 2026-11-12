#!/usr/bin/env python3
"""A stored credential title is resolved in ONE place: kb/credential_aliases.py.

Why: tests/alias_chain_single_source_test.py exists because a copied M-ID chain sat eight applies behind for
months under a comment promising lockstep. The credential rename snapshots carry the same risk, and #3140's
fifth review round found the copy's fault already: a second snapshot finder with no in-force filter replayed
an undone apply. So the resolver is single-source, and this test fails a second one.

Checks, each a way the copy could come back:
  1. No Python file reads the credential rename snapshots (alias_map.json, by any path) except
     kb/credential_aliases.py and the apply, undo and dry-run scripts that own them (named below, each with why).
     Tests may build fixtures. Two planted copies prove the scan catches one.
  2. No Python file outside the module and the apply side defines a function that reads a snapshot's
     "renames", "merges" and "_applied_at" together: the resolver's shape under another name.
  3. No browser file reads the snapshots: map_links.js and every other page read kb/credential_title_moves.json,
     which kb/credential_aliases.py writes.
  4. That table is current, so the browser's answer is the module's.
  5. Every workflow that writes a snapshot (runs the apply or the undo) rebuilds the table and stages it.

Run from the repo root: python3 tests/credential_title_resolver_single_source_test.py
"""
import ast
import os
import shutil
import sys
import tempfile

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


def files(ext, root=ROOT):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(ext):
                p = os.path.join(dirpath, fn)
                yield os.path.relpath(p, root).replace("\\", "/"), p


def scan(root=ROOT):
    """(readers, resolver shapes, unparsable) among the Python files under root. A reader is any file outside the
    module, the apply side and tests/ that names alias_map and the credential rename world: "cred_rename" anywhere in
    its source (a path piece, an import of the apply's OUT_ROOT, a module name), or a snapshot's "renames" and
    "merges" keys. The M-ID re-mint scripts name alias_map.json too, and none of them names either."""
    readers, shapes, unparsable = [], [], []
    for rel, path in files(".py", root):
        if rel == SOURCE or rel in APPLY_SIDE or rel.startswith("tests/"):
            continue
        src = open(path, encoding="utf-8").read()
        if "alias_map" not in src and '"_applied_at"' not in src:
            continue
        try:
            tree = ast.parse(src, filename=rel)
        except SyntaxError as e:
            unparsable.append(f"{rel}: {e}")
            continue
        consts = {n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
        if "alias_map" in src and ("cred_rename" in src or {"renames", "merges"} <= consts):
            readers.append(rel)
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fc = {n.value for n in ast.walk(node) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
                if {"renames", "merges", "_applied_at"} <= fc:
                    shapes.append(f"{rel}:{node.lineno} def {node.name}()")
    return readers, shapes, unparsable


readers, shapes, unparsable = scan()
check("every candidate .py file parses", not unparsable, "; ".join(unparsable))
check("only kb/credential_aliases.py and the apply side read the rename snapshots", not readers,
      "second reader in " + ", ".join(readers) + " — import kb/credential_aliases.py (resolver, moves, load)")
check("no other file defines a resolver over a snapshot's renames, merges and _applied_at", not shapes,
      "resolver copy in " + ", ".join(shapes))

# The scan catches a planted copy: the two shapes review round one planted, neither with an in-force filter.
PLANTS = {
    "kb/_planted_one.py": "import glob, os\nfrom _cred_rename_apply import OUT_ROOT\n"
                          "def latest():\n    return sorted(glob.glob(os.path.join(OUT_ROOT, '*', 'alias_map.json')))[-1]\n",
    "kb/_planted_two.py": "import glob, json, os\nHERE = os.path.dirname(__file__)\n"
                          "def moves():\n    out = {}\n"
                          "    for p in glob.glob(os.path.join(HERE, 'cred_' + 'rename_out', '*', 'alias_map.json')):\n"
                          "        d = json.load(open(p)); out.update(d.get('renames') or {}); out.update(d.get('merges') or {})\n"
                          "    return out\n",
}
for rel, body in PLANTS.items():
    tmp = tempfile.mkdtemp(prefix="cred-title-plant-")
    try:
        os.makedirs(os.path.join(tmp, "kb"))
        with open(os.path.join(tmp, rel), "w", encoding="utf-8") as f:
            f.write(body)
        got = scan(tmp)[0]
        check(f"a planted second snapshot reader is caught ({rel})", got == [rel], got)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

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

# 5. Every workflow that writes a rename snapshot rebuilds the table and stages it, or the next apply leaves
#    main's table stale (S638's #3119 turned main red that way). A workflow writes a snapshot when it runs the
#    apply or the undo; the undo runs on no runner today, so scripts/check_generated.sh catches it locally.
stale_wf = []
wf_dir = os.path.join(ROOT, ".github", "workflows")
for fn in sorted(os.listdir(wf_dir)) if os.path.isdir(wf_dir) else []:
    if not fn.endswith((".yml", ".yaml")):
        continue
    txt = open(os.path.join(wf_dir, fn), encoding="utf-8").read()
    cmds = [l.strip()[4:].strip() if l.strip().startswith("run:") else l.strip() for l in txt.splitlines()]
    writes = any(c.startswith(("python ", "python3 ")) and
                 ("kb/_cred_rename_apply.py" in c or "kb/_cred_rename_undo.py" in c) for c in cmds)
    if writes:
        runs = any(c.startswith(("python3 kb/credential_aliases.py", "python kb/credential_aliases.py")) for c in cmds)
        stages = "kb/credential_title_moves.json" in txt
        if not (runs and stages):
            stale_wf.append(f"{fn} (runs builder: {runs}, stages the table: {stages})")
check("every workflow that writes a rename snapshot rebuilds and stages kb/credential_title_moves.json",
      not stale_wf, "; ".join(stale_wf))

have = open(os.path.join(ROOT, ca.TABLE), encoding="utf-8").read()
check("kb/credential_title_moves.json is current (python3 kb/credential_aliases.py)",
      ca._checked(have) == ca._checked(ca._render(ROOT)))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
