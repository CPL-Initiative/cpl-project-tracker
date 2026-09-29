#!/usr/bin/env python3
"""Emit the static half of the Admin tab's surface map.

WHAT THIS IS FOR
----------------
Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by drag
and drop from a single place where I can manage the org where they appear,
hierarchy, naming, visibility, and access via either team phrase or magic link.
It's getting busy and needs to be organized better."

The trap in that request is the word *access*. A nav setting is a DISPLAY
control: hiding a menu item does not protect the data behind it, RLS does. A
manager UI with an access dropdown actively invites the opposite belief. So the
Admin tab shows both halves side by side, and the difference has to be
structural rather than a tooltip insisting on it.

WHAT IS GENERATED HERE, AND WHAT DELIBERATELY IS NOT
----------------------------------------------------
Only the part a browser cannot work out for itself: which Supabase tables each
tab's module touches, and whether it READS them or only writes them. That needs
static analysis over the repo.

Everything else is measured at load by admin.js and is NOT in this file:
  * the label, the group and the order      -> read from the live nav DOM
  * which sites (orgs) show a tab           -> read from window.CPL_ORGS
  * what actually gates each table          -> read LIVE from the database via
                                               the cobi_rls_gates() RPC

That split is the point. A carried list goes stale silently and this tab's whole
job is to tell the truth about access; the College action page states the same
rule as "measure at load, never carry a list". The one thing that cannot be
measured at load is generated here, and a test asserts it is fresh.

USAGE
-----
    python3 kb/_build_cobi_admin_surface.py            # write cobi_admin_surface.js
    python3 kb/_build_cobi_admin_surface.py --check    # exit 1 if it would change
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "CPL_Dashboard.html"
OUT = ROOT / "cobi_admin_surface.js"

WRITE_METHODS = ("POST", "PATCH", "PUT", "DELETE")
# How far after a table reference to look for the method of that call. Same
# window discipline as kb/_build_governance_candidates.py, and for the same
# reason: without it, a module that writes one table is credited with writing
# every table it merely reads.
WRITE_WINDOW = 400
# PostgREST exposes views and RPCs on the same path shape as tables. `rpc` is a
# namespace, not a table; the suffixes are this repo's derived-view convention.
DERIVED_SUFFIXES = ("_view", "_v", "_mv")


def fail(msg: str) -> "None":
    sys.stderr.write("ERROR: %s\n" % msg)
    raise SystemExit(2)


def tab_to_js(html: str) -> "dict":
    """tab id -> module file, from the BOOT dispatch.

    Deliberately NOT from proximity in the document: a tab's nav button and its
    loadScript call sit ~1.2M characters apart, so a window-based match finds
    nothing and does it silently. (That exact bug is recorded in
    _build_governance_candidates.py; this is the same lesson, reused.)
    """
    out = {}
    for m in re.finditer(r"onActivate\('([a-z0-9-]+)'", html):
        tab = m.group(1)
        # ALL loadScript calls in the block, not just the first. A tab may CHAIN
        # them — sierra-training pulls its generated rule defaults before its
        # implementation, admin does the same — and a non-greedy single match
        # stops at the data file, crediting the tab with the module that touches
        # no tables and silently dropping the one that touches all of them.
        block = html[m.end():m.end() + 1200]
        block = block.split("onActivate(")[0]
        for js in re.findall(r"loadScript\('([a-z0-9_.\-/]+\.js)'", block):
            out.setdefault(tab, [])
            if js not in out[tab]:
                out[tab].append(js)
    return out


def nav_tabs(html: str) -> "list":
    """Every tab in the nav rail, in document order."""
    return list(dict.fromkeys(re.findall(r'class="cpl-tab" data-tab="([a-z0-9-]+)"', html)))


def eager_modules(html: str) -> "list":
    """Modules loaded by a page-level <script src>, not by the boot dispatch.

    13 of the 35 tabs load this way. Missing them would not merely leave gaps —
    a tab with no modules renders as "touches no data", which reads as "nothing
    to protect". That is the same false-zero shape this repo keeps paying for,
    and on THIS tab it would be a claim about safety.
    """
    return list(dict.fromkeys(re.findall(r'<script[^>]*src="([a-z0-9_]+\.js)"', html)))


# Tabs whose module does not follow the tab-id naming convention. Kept as an
# explicit map with a REASON each, rather than a smarter regex: the cost of a
# wrong guess here is a tab credited with the wrong data surface, and a reason in
# a diff is reviewable in a way a heuristic is not. Anything not matched by
# convention OR listed here is reported as NOT MEASURED — never as "reads
# nothing".
MODULE_ALIASES = {
    # The CPL Assistant pane mounts the Sierra widget; cpl_chat.js is its module.
    "chatbot": ["cpl_chat.js"],
    # Vision 2030 renders through the statewide interactive exhibit module.
    "vision-2030": ["statewide_interactive.js"],
}


def modules_by_convention(tab: str, eager: "list") -> "list":
    """Eager modules belonging to `tab` by naming convention.

    Convention: the module basename equals the tab id with dashes as underscores,
    or begins with it followed by an underscore (budget -> budget_editor.js,
    budget_ledger.js). Prefix matching is deliberately anchored with the trailing
    underscore so `cpl-news` cannot claim `cpl_newsletter.js`.
    """
    stem = tab.replace("-", "_")
    return [m for m in eager if m[:-3] == stem or m.startswith(stem + "_")]


def tables_for(js_body: str) -> "tuple":
    """(reads, writes) — Supabase tables this module touches."""
    reads, writes = set(), set()
    # The slash is OPTIONAL because both conventions exist in this repo: most
    # modules define REST without a trailing slash and write `REST + "/tbl"`,
    # but cpl_memory.js defines it WITH one and writes `REST + "tbl"`. Requiring
    # the slash made that tab report zero tables — a false "nothing to protect"
    # on a tab that reads and writes the memory table.
    for m in re.finditer(r'(?:REST\s*\+\s*"|/rest/v1)/?([a-z0-9_]+)', js_body):
        t = m.group(1)
        if t == "rpc" or t.endswith(DERIVED_SUFFIXES):
            continue
        window = js_body[m.end():m.end() + WRITE_WINDOW]
        if re.search(r'method:\s*["\'](%s)["\']' % "|".join(WRITE_METHODS), window):
            writes.add(t)
        else:
            reads.add(t)
    # A table that is both read and written is a write surface; keeping it in
    # both lists would double-count it in the tab's own summary.
    return sorted(reads - writes), sorted(writes)


def rpcs_for(js_body: str) -> "list":
    return sorted(set(re.findall(r'/rest/v1/rpc/([a-z0-9_]+)', js_body)
                      + re.findall(r'REST\s*\+\s*"/?rpc/([a-z0-9_]+)', js_body)))


def build() -> str:
    if not DASHBOARD.exists():
        fail("cannot find %s" % DASHBOARD)
    html = DASHBOARD.read_text(encoding="utf-8")

    all_tabs = nav_tabs(html)
    if len(all_tabs) < 25:
        fail("only %d nav tabs matched (expected 25+) — the nav markup changed" % len(all_tabs))

    # Since 2026-08-30 the per-tab tables/rpcs PROJECT FROM THE DEPENDENCY MAP
    # (kb/_build_dependency_map.py) instead of a local per-module scan, because
    # the local scan had measurably stopped seeing surfaces: it could not
    # follow helper wrappers (raci.js's sbGet/sbWrite left the raci tab
    # reporting "reads: [], writes: []" while it touches four tables), chained
    # loadScript modules, or URL consts fetched far from their definition.
    # Four tabs under-reported 12 tables and 3 RPCs at once — on the tab whose
    # whole job is telling the truth about what is protected. One derivation,
    # CI-checked and adversarially sampled, both tabs project from it.
    #
    # tab_to_js/eager_modules/tables_for/rpcs_for above are NOT dead: the map
    # imports them — the boot-dispatch parsing still lives here, the map adds
    # the idioms this file's scan lacked, and this file reads the result back.
    dep_path = ROOT / "kb" / "dependency_map.json"
    try:
        dep = json.loads(dep_path.read_text(encoding="utf-8"))
    except OSError:
        dep = None
    if not dep or not dep.get("datasets") or not dep.get("module_tabs"):
        # An absent map must fail LOUD: emitting tabs with empty tables reads
        # as "nothing to protect" — the most dangerous wrong answer this tab
        # can give.
        fail("kb/dependency_map.json missing or empty — run "
             "python3 kb/_build_dependency_map.py first")

    module_tabs = dep["module_tabs"]
    if sum(1 for mods in module_tabs.values() for _ in mods) < 15:
        fail("the map attributes fewer than 15 module->tab edges — its boot "
             "dispatch parse broke, not the tabs")

    per_tab = {t: {"reads": set(), "writes": set(), "rpcs": set()} for t in all_tabs}
    for ds, d in dep["datasets"].items():
        is_table = ds.startswith("supabase:")
        is_rpc = ds.startswith("rpc:")
        if not (is_table or is_rpc):
            continue
        name = ds.split(":", 1)[1]
        # PostgREST exposes views on the same path shape; derived views stay
        # out of the display, as they always have (DERIVED_SUFFIXES above).
        if is_table and name.endswith(DERIVED_SUFFIXES):
            continue
        for e in d.get("consumers", []):
            for tab in e.get("tabs", []):
                if tab not in per_tab:
                    continue
                slot = per_tab[tab]
                if is_rpc:
                    slot["rpcs"].add(name)
                elif e.get("direction") == "write":
                    slot["writes"].add(name)
                else:
                    slot["reads"].add(name)

    tabs, unmeasured = {}, []
    for tab in all_tabs:
        modules = sorted(m for m, mtabs in module_tabs.items() if tab in mtabs)
        if not modules:
            # NOT the same as "touches no data". Recorded as its own state so
            # admin.js can say "not measured" — an absent measurement must never
            # render as a clean bill of health.
            unmeasured.append(tab)
            tabs[tab] = {"modules": [], "reads": [], "writes": [], "rpcs": [], "measured": False}
            continue
        slot = per_tab[tab]
        tabs[tab] = {
            "modules": modules,
            # A table that is both read and written is a write surface; keeping
            # it in both lists would double-count it in the tab's own summary.
            "reads": sorted(slot["reads"] - slot["writes"]),
            "writes": sorted(slot["writes"]),
            "rpcs": sorted(slot["rpcs"]),
            "measured": True,
        }

    payload = {
        "_about": "Which Supabase tables each COBI tab touches. GENERATED by "
                  "kb/_build_cobi_admin_surface.py — do not hand-edit. Labels, groups, "
                  "org visibility and the RLS gates are NOT here on purpose: admin.js "
                  "measures those at load, from the nav DOM, window.CPL_ORGS and the "
                  "cobi_rls_gates() RPC respectively.",
        "_source": "kb/dependency_map.json (kb/_build_dependency_map.py — boot dispatch, "
                   "script tags, helper wrappers, chained modules, URL consts), "
                   "projected onto the CPL_Dashboard.html nav",
        "unmeasured": unmeasured,
        "tabs": tabs,
    }
    return (
        "/* cobi_admin_surface.js — GENERATED. Do not hand-edit.\n"
        " *\n"
        " * Regenerate with: python3 kb/_build_cobi_admin_surface.py\n"
        " * tests/admin_tab.test.js fails if this drifts from the repo.\n"
        " *\n"
        " * Consumed by admin.js. Carries ONLY what a browser cannot derive: the\n"
        " * tables behind each tab. Everything else the Admin tab shows is measured\n"
        " * live, because a carried list goes stale silently and this tab's whole job\n"
        " * is telling the truth about what is protected.\n"
        " */\n"
        "window.COBI_ADMIN_SURFACE = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="exit 1 if it would change (never writes)")
    args = ap.parse_args()

    text = build()
    current = OUT.read_text(encoding="utf-8") if OUT.exists() else None
    if args.check:
        if current == text:
            print("cobi_admin_surface.js is up to date")
            return 0
        print("cobi_admin_surface.js is STALE — run: python3 kb/_build_cobi_admin_surface.py")
        return 1
    if current == text:
        print("cobi_admin_surface.js unchanged")
        return 0
    OUT.write_text(text, encoding="utf-8")
    d = json.loads(text[text.index("=") + 1:].rstrip().rstrip(";"))
    print("wrote %s (%d tabs)" % (OUT.relative_to(ROOT), len(d["tabs"])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
