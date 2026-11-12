#!/usr/bin/env python3
"""The fold's issuer resolver is defined ONCE in Python and ONCE in JavaScript (#3116 redesign).

On the kb/alias_chain.py pattern (tests/alias_chain_single_source_test.py): a rule restated in a second
place drifts from the first without an error, and the reader holding the stale copy shows an issuer the
fold dropped. So the resolver lives in kb/fold_issuer.py (effective_issuer, enforce_records) and its one
port in issuer_resolution.js; every reader imports one of them. This test fails:

  1. a Python file other than kb/fold_issuer.py that defines effective_issuer or enforce_records, or any
     function that reads both "kept_additional" and "decided_at" (the resolver's shape, renamed);
  2. a JavaScript file other than issuer_resolution.js that reads "kept_additional" (a second port);
  3. a browser reader of issuer_resolution rows that does not go through window.CPL_ISSUER_RESOLUTION;
  4. an HTML that loads credential_reference.js without loading issuer_resolution.js before it.

Run from repo root: python3 tests/fold_issuer_single_source_test.py
"""
import ast
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {".git", "node_modules", "__pycache__", ".venv", "venv", ".claude"}
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"\n      {detail}" if detail and not cond else ""))


def files(ext):
    for d, dirs, fs in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP]
        for f in fs:
            if f.endswith(ext):
                p = os.path.join(d, f)
                yield os.path.relpath(p, ROOT).replace("\\", "/"), p


def resolver_shaped(node):
    if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return False
    if node.name in ("effective_issuer", "enforce_records"):
        return True
    consts = {n.value for n in ast.walk(node) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
    return "kept_additional" in consts and "decided_at" in consts


py_copies = []
for rel, p in files(".py"):
    if rel in ("kb/fold_issuer.py",) or rel.startswith("tests/"):
        continue
    try:
        tree = ast.parse(open(p, encoding="utf-8").read())
    except (SyntaxError, UnicodeDecodeError):
        continue
    py_copies += ["%s:%s" % (rel, n.name) for n in ast.walk(tree) if resolver_shaped(n)]
check("1. the Python resolver is defined only in kb/fold_issuer.py", not py_copies, str(py_copies))

js_copies, readers_bad = [], []
for rel, p in files(".js"):
    if rel.startswith("tests/") or rel == "issuer_resolution.js":
        continue
    src = open(p, encoding="utf-8", errors="replace").read()
    if "kept_additional" in src:
        js_copies.append(rel)
    if re.search(r"[\"']issuer_resolution[\"']", src) and "CPL_ISSUER_RESOLUTION" not in src:
        readers_bad.append(rel)
check("2. the JavaScript resolver is defined only in issuer_resolution.js", not js_copies, str(js_copies))
check("3. every browser reader of issuer_resolution rows resolves through CPL_ISSUER_RESOLUTION",
      not readers_bad, str(readers_bad))
for rel in ("exhibits.js", "credential_reference.js", "map_export.js"):
    src = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    check("3. %s reads the resolution field and resolves through the port" % rel,
          "issuer_resolution" in src and "CPL_ISSUER_RESOLUTION" in src)

for rel in ("CPL_Dashboard.html", "index.html"):
    src = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    a, b = src.find('src="issuer_resolution.js"'), src.find('src="credential_reference.js"')
    check("4. %s loads issuer_resolution.js before credential_reference.js" % rel, 0 <= a < b)

ok = all(r[1] for r in results)
print(f"{sum(r[1] for r in results)}/{len(results)} passed")
sys.exit(0 if ok else 1)
