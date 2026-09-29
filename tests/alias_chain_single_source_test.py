#!/usr/bin/env python3
"""The alias chain is declared ONCE (Sam's ruling 8, 2026-09-05).

⚠️ This guard exists because a comment was tried first and lost. Before Session
232 the chain lived in kb/_rekey_promotions.py AND in
kb/_analyze_official_fold_evidence.py, the second under a comment reading "Must
stay in lockstep with kb/_rekey_promotions.py ALIAS_MAPS" — and it carried SEVEN
maps against the real fifteen. Eight applies behind, for months, with the
promise to stay in step sitting directly above the stale list. Nothing failed;
the analysis just quietly spoke a dead id era.

So the lockstep is structural now: kb/alias_chain.py holds the one list, the one
resolver and the one era guard, and this test fails any file that grows a second
copy — under that name or any other.

Checks, each a way the copy could come back:
  1. Only kb/alias_chain.py assigns ALIAS_MAPS (Python AST, so a rename of the
     module or a nested assignment does not sneak past a grep).
  2. No other file holds a LIST LITERAL of 3+ alias_map.json receipt paths —
     the copy-paste shape under a different variable name.
  3. No file that works with the APPLIED chain defines its own hop function
     (the {new_id} / {splits} unwrap) — a resolver copy is as dangerous as a
     chain copy, and it was duplicated too. Scoped to chain-aware files on
     purpose: the kb/_overmerge_* family unwraps the same shapes for the
     STAGED over-merge plan, which the chain deliberately excludes (see
     alias_chain's docstring), so it is not a copy of anything.
  4. Every map in the chain exists on disk, in chronological order by the date
     in its path, with no duplicates.
  5. The resolution semantics self-test passes (no within-map iteration, no
     liveness shortcut, cross-map chaining intact).

Run from repo root: python3 tests/alias_chain_single_source_test.py
"""
import ast
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import alias_chain as ac  # noqa: E402

SOURCE = "kb/alias_chain.py"
THIS = "tests/alias_chain_single_source_test.py"
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv"}
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"\n      {detail}" if detail and not cond else ""))


def py_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(".py"):
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
            rel = rel.replace("\\", "/")
            if rel == SOURCE:
                continue
            yield rel, os.path.join(dirpath, fn)


def is_hop_fn(node):
    """A function that unwraps an alias-map value: reads both 'new_id' and
    'splits' out of its argument. That is the resolver's hop, copied."""
    if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return False
    consts = {n.value for n in ast.walk(node)
              if isinstance(n, ast.Constant) and isinstance(n.value, str)}
    return "new_id" in consts and "splits" in consts


second_decl, list_copy, hop_copy, unparsable = [], [], [], []
for rel, path in py_files():
    try:
        tree = ast.parse(open(path, encoding="utf-8").read(), filename=rel)
    except SyntaxError as e:
        unparsable.append(f"{rel}: {e}")
        continue
    src = open(path, encoding="utf-8").read()
    chain_aware = ("ALIAS_MAPS" in src or "alias_chain" in src) and rel != THIS
    for node in ast.walk(tree):
        # 1. a second ALIAS_MAPS assignment
        targets = []
        if isinstance(node, ast.Assign):
            targets = node.targets
        elif isinstance(node, ast.AnnAssign):
            targets = [node.target]
        for t in targets:
            if isinstance(t, ast.Name) and t.id == "ALIAS_MAPS":
                second_decl.append(f"{rel}:{node.lineno}")
            elif isinstance(t, ast.Attribute) and t.attr == "ALIAS_MAPS":
                second_decl.append(f"{rel}:{node.lineno}")
        # 2. a chain-shaped list literal under any name
        if isinstance(node, (ast.List, ast.Tuple)):
            paths = {e.value for e in node.elts
                     if isinstance(e, ast.Constant) and isinstance(e.value, str)
                     and e.value.endswith("alias_map.json")}
            if len(paths) >= 3:
                list_copy.append(f"{rel}:{node.lineno} ({len(paths)} receipt paths)")
        # 3. a copied hop function, in a file that speaks to the applied chain
        if chain_aware and is_hop_fn(node):
            hop_copy.append(f"{rel}:{node.lineno} def {node.name}()")

check("every .py file parses", not unparsable, "; ".join(unparsable))
check("ALIAS_MAPS is assigned in kb/alias_chain.py and nowhere else",
      not second_decl,
      "second declaration in " + ", ".join(second_decl) +
      " — import it from alias_chain instead of restating it")
check("no file holds a chain-shaped list of receipt paths under another name",
      not list_copy,
      "chain copy in " + ", ".join(list_copy))
check("no chain-aware file defines its own alias-map hop function",
      not hop_copy,
      "resolver copy in " + ", ".join(hop_copy) +
      " — use alias_chain.step / alias_chain.resolve")

# 4. the chain itself
missing = [p for p in ac.ALIAS_MAPS if not os.path.exists(os.path.join(ROOT, p))]
check("every registered alias map exists on disk", not missing, "missing: " + ", ".join(missing))
check("no map is registered twice", len(set(ac.ALIAS_MAPS)) == len(ac.ALIAS_MAPS))

dates = [re.search(r"(\d{4}-\d{2}-\d{2})", p) for p in ac.ALIAS_MAPS]
dated = [(m.group(1), p) for m, p in zip(dates, ac.ALIAS_MAPS) if m]
check("dated maps are registered in chronological order",
      [d for d, _ in dated] == sorted(d for d, _ in dated),
      "out of order: " + ", ".join(p for _, p in dated))

# 5. the semantics that the chain exists to protect
try:
    ac.selftest()
    ok = True
except AssertionError as e:
    ok, err = False, str(e)
else:
    err = ""
check("resolution semantics self-test passes", ok, err)

slot_reuse, later = {"A": "B", "B": "C"}, {"C": "D"}
check("resolve returns (id, hops) and the hop trail records each apply",
      ac.resolve("B", [slot_reuse, later]) == ("D", ["C", "D"]))
check("resolve_id is resolve without the trail",
      ac.resolve_id("B", [slot_reuse, later]) == "D")

# the era guard: a pending set must be a chronological suffix
chain = ["m1", "m2", "m3", "m4"]
check("era guard: a doc's era list decides what is pending",
      ac.pending_maps(["m1", "m2"], None, chain) == (["m3", "m4"], chain))
check("era guard: nothing pending is fine", ac.pending_maps(chain, None, chain) == ([], chain))
check("era guard: a baseline names the era for a doc with no list",
      ac.pending_maps([], "m2", chain) == (["m3", "m4"], chain))
for bad, label in (((["m1", "m3"], None, chain), "an era list that is not a prefix"),
                   (([], None, chain), "no era list and no baseline"),
                   (([], "nope", chain), "a baseline outside the chain")):
    try:
        ac.pending_maps(*bad)
        raised = False
    except SystemExit:
        raised = True
    check(f"era guard: refuses {label}", raised)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
