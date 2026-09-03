#!/usr/bin/env python3
"""Derive the dataset -> consumers dependency map FROM THE CODE.

WHY THIS EXISTS (Sam's ruling A, 2026-08-29)
--------------------------------------------
Every session is ordered to "flag cross-impact before acting" and, until this
file, had no way to compute what the impacts are. Two independent test sessions
found the same hole: the doctrine arm called its cross-impact flag "guesswork
dressed as diligence"; the control arm said "the artifact that would let me do
it — dataset -> consuming tabs — doesn't exist." Both named it THE miss.
`cpl_memory` slug: no-dependency-map-from-dataset-to-consuming-tabs.

The knowledge was scattered across pipeline_reference §8 and thirty lane files,
and the docs are the incomplete thing. So this scanner derives the map from the
repo itself and REGENERATES on demand — a hand-written index drifts
(docs/INDEX.md reached 6.84x its budget that way and is generated now).

WHAT IT SCANS, AND THE TRAPS IT WAS BUILT AROUND
------------------------------------------------
A tag scan cannot see a fetch(): fact-sheet/ looks self-contained on its script
tags while factsheet.js fetches ../live_metrics.json at RUNTIME. Measured
idioms this scanner covers (each verified in the tree on 2026-08-29):

  * Supabase PostgREST in THREE base conventions — `SUPABASE_URL + "/rest/v1/t"`
    inline, `REST + "/t"` (REST without trailing slash), and `REST + "t"`
    (REST WITH trailing slash — cpl_memory.js, map_data_quality.js,
    map_cleanup_views.js). A scanner keying on `/rest/v1/<t>` alone misses the
    third form; kb/_build_cobi_admin_surface.py learned this first, and its
    `tables_for()` is reused here rather than re-derived.
  * Table names that live only at helper CALL SITES (raci.js sbGet("item_raci?…"),
    kb/_load_workplan_goals.py _fetch_table("workplan_goals" "?select=…")):
    any local helper whose body touches rest/v1 gets its string-literal call
    arguments harvested.
  * Edge functions (`functions/v1/<name>`) — absent from every earlier scanner.
  * supabase-js (`.from("t")` / `.rpc("f")`) in the edge-function TypeScript.
  * Shell: `$REST_BASE/<t>`, `$REST_BASE/$t` with `for t in <list>`.
  * Runtime file reads: fetch("x.json"), URL consts fetched far away
    (METRICS_URL), loadScript/ensureScript/_eraSrc chains, createElement-script
    .src, Node readFileSync, Python literal paths (resolved against the tree).
  * Generated window.* data .js files: producer from the header comment,
    consumers from loadScript args AND bare-global references (tmc_builder
    reaches its biggest dataset only through window[CC_GLOBAL]).
  * Workflows: every script a workflow runs, every `git add` list, and the
    push shape. THE DIRECT-TO-MAIN LANE IS THE POINT — daily-dashboard.yml
    commits straight to main while Pages serves from main, bypassing PRs; a
    scanner grepping only `HEAD:main` misses cpl-landing-pages.yml, which
    pushes `HEAD:${{github.ref_name}}` = main on its weekly cron, and the four
    bare `git push` workflows whose cron checkout IS main.

WHAT IT DELIBERATELY DOES NOT CLAIM
-----------------------------------
An absent measurement must never render as "no consumers" (the admin surface's
false-zero rule, honored here). Reads this scanner cannot resolve statically
are either carried by a SEED (below) or reported under "Not measured" — never
silently dropped. Seeds are not hand-maintained facts: each one is pinned to an
anchor regex in the file it describes, and a seed whose anchor no longer
matches is dropped WITH A WARNING in the output, so a refactor cannot leave a
stale edge lying.

Consumers deliberately out of scope: tests/** (guards, not surfaces),
docs/** (prose that NAMES datasets without reading them — the
Dashboard_Element_Map trap applies to markdown too), archive/** (dead
snapshots, confirmed excluded from the Pages site).

USAGE
-----
    python3 kb/_build_dependency_map.py            # write both artifacts
    python3 kb/_build_dependency_map.py --check    # exit 1 if a rebuild would
                                                   # change anything (CI)

Outputs:
  * kb/dependency_map.json        — full edge list with file:line evidence
  * docs/reference/dependency_map.md — the human artifact, compact
"""

from __future__ import annotations

import argparse
import functools
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _build_cobi_admin_surface import (  # noqa: E402
    MODULE_ALIASES, WRITE_METHODS, eager_modules, modules_by_convention,
    nav_tabs, tab_to_js, tables_for,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "kb" / "dependency_map.json"
OUT_MD = ROOT / "docs" / "reference" / "dependency_map.md"

# The date this artifact first existed. A CONSTANT on purpose: a generated file
# stamped with the run date can never pass --check twice.
CREATED = "2026-08-30"

WRITE_WINDOW = 400          # same window discipline as the admin surface
PY_WRITE_WINDOW = 260

# Segments after a Supabase base that are service plumbing, not datasets.
NOT_TABLES = {
    "rpc", "auth", "token", "otp", "storage", "object", "public", "sign",
    "functions", "v1", "rest", "http", "https", "select", "and", "or", "not",
    "on_conflict", "limit", "order", "offset",
}

# Files that SCAN OTHER FILES for the same idioms this scanner matches — their
# rest/v1 regexes are data, not dependencies. A naive scan credits
# _build_cobi_admin_surface.py with touching every table on the dashboard.
META_SCANNERS = {
    "kb/_build_cobi_admin_surface.py",
    "kb/_build_governance_candidates.py",
    "kb/_build_dependency_map.py",          # this file
}

# Vendored libraries: neither datasets nor consumers.
VENDORED = {"docx.min.js"}

# The two Cloudflare Worker sources are deploy-by-paste server code, never
# loaded by a page. worker-to-paste.js is the stale mirror of the pair.
WORKER_SOURCES = {"cloudflare-worker-proxy.js", "worker-to-paste.js"}

# ── seeds: dynamic reads a literal scan cannot resolve ──────────────────────
# Each entry is PINNED to an anchor regex in the named file. If the anchor no
# longer matches, the seed's edges are dropped and a warning lands in the
# output — a seed can go stale loudly, never silently.
SEEDS = [
    {   # coci_lookup.js line ~206: loadScript("coci_lookup_desc_" + key + ".js")
        "file": "coci_lookup.js",
        "anchor": r'loadScript\("coci_lookup_desc_"\s*\+',
        "datasets": [("file:coci_lookup_desc_*.js", "read")],
        "why": "shard key is the subject's first letter; no shard name is literal",
    },
    {   # cip_crosswalk.js line ~622: fetch("cip_fitcheck/" + slug + ".json")
        "file": "cip_crosswalk.js",
        "anchor": r'fetch\("cip_fitcheck/"\s*\+',
        "datasets": [("file:cip_fitcheck/*.json", "read")],
        "why": "per-college shards enumerated from cip_fitcheck_colleges.json",
    },
    {   # prototype/skyview.html: DESC_BASES = ["ccr_desc", <ccr-desc bucket>]; fetch(base+"/"+…+".json")
        "file": "prototype/skyview.html",
        "anchor": r'DESC_BASES\s*=',
        "datasets": [("file:prototype/ccr_desc/*.json", "read"), ("storage:ccr-desc", "read")],
        "why": "per-discipline description shards, generated by kb/_build_ccr_universe.py, NOT "
               "committed: served locally from ./ccr_desc or from the public Supabase Storage "
               "bucket ccr-desc (scripts/publish_skyview_desc_shards.sh)",
    },
    {   # team_phrase.js: fetch(SUPABASE_URL + '/rest/v1/rpc/' + rpcFor(site))
        "file": "team_phrase.js",
        "anchor": r"/rest/v1/rpc/'\s*\+\s*rpcFor\(",
        "datasets": [("rpc:team_pass_ok", "call"), ("rpc:gr_pass_ok", "call"),
                     ("rpc:fin_pass_ok", "call")],
        "why": "rpc name resolved from the SITES map at runtime",
    },
    {   # chatbox/smoke_test.sh: "$REST_BASE/$t" with `for t in …` lists
        "file": "chatbox/smoke_test.sh",
        "anchor": r'\$REST_BASE/\$t',
        "datasets": [("supabase:map_college_credit_summary", "read"),
                     ("supabase:map_college_goal2", "read"),
                     ("supabase:map_college_cr_unit", "read"),
                     ("supabase:map_student_credit", "read")],
        "why": "table names are shell loop variables (RLS-gate probes)",
    },
    {   # map_team_queue.js loads map_users.js purely to read _FALLBACK_CONTACTS
        "file": "map_team_queue.js",
        "anchor": r'loadScript\("map_users\.js"',
        "datasets": [("file:map_users.js", "read")],
        "why": "module loaded AS DATA — a script-src scan of the HTML never sees it",
    },
    {   # cpl-chat edge fn reads the tracker's own live_metrics.json over raw GitHub
        "file": "chatbox/supabase/functions/cpl-chat/index.ts",
        "anchor": r'raw\.githubusercontent\.com/CPL-Initiative/cpl-project-tracker/main/live_metrics\.json',
        "datasets": [("file:live_metrics.json", "read")],
        "why": "cross-service self-dependency: the repo file consumed via raw.githubusercontent",
    },
    {   # Sierra's pgvector retrieval tables: named only in docs; DDL applied live
        "file": "chatbox/supabase/functions/cpl-chat/index.ts",
        "anchor": r'match_document_sections',
        "datasets": [("supabase:cpl_documents", "read"),
                     ("supabase:cpl_document_sections", "read")],
        "why": "tables behind rpc:match_document_sections; DDL not in the repo",
    },
]


def fail(msg: str):
    sys.stderr.write("ERROR: %s\n" % msg)
    raise SystemExit(2)


# ── repo inventory ──────────────────────────────────────────────────────────
def tracked_files() -> list:
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True,
                         text=True)
    if out.returncode != 0:
        fail("git ls-files failed: %s" % out.stderr.strip())
    return [f for f in out.stdout.splitlines() if f]


@functools.lru_cache(maxsize=None)
def read(rel: str) -> str:
    try:
        return (ROOT / rel).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def canon_dates(path: str) -> str:
    """Collapse dated receipt dirs into one family so producer and consumer
    edges JOIN: writers stamp today's date, readers pin a literal one."""
    return re.sub(r"20\d{2}-\d{2}-\d{2}", "<date>", path)


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def commented(text: str, pos: int) -> bool:
    """True when the match sits after // or # on its own line — the
    gr_priorities.js phantom-'table' incident, mechanized."""
    start = text.rfind("\n", 0, pos) + 1
    head = text[start:pos]
    return "//" in head or head.lstrip().startswith(("#", "*"))


# ── data-file classification ────────────────────────────────────────────────
GLOBAL_RE = re.compile(r"window\.([A-Z][A-Za-z0-9_]{2,})\s*=")
PRODUCER_HEADER_RE = re.compile(
    r"(?:GENERATED by|Regenerate with:|[Aa]uto-generated by|Generated by)\s*:?"
    r"\s*(?:python3?\s+|node\s+)?([\w./\-]+\.(?:py|mjs|js))")


def classify_data_js(js_files: list) -> dict:
    """rel -> {global, producer} for generated/static data .js files.

    A data file assigns a window.* global near the top and carries (almost) no
    logic. The fetch/function tests run on the HEAD only: a 17 MB COCI shard's
    course descriptions can contain the word "function", and a module's code
    always shows in its first 8 KB."""
    out = {}
    for rel in js_files:
        base = os.path.basename(rel)
        if base in VENDORED or base in WORKER_SOURCES:
            continue
        text = read(rel)
        head = text[:8192]
        m = GLOBAL_RE.search(head)
        if not m:
            continue
        if head.count("fetch(") > 0 or len(re.findall(r"\bfunction\b", head)) > 3:
            continue
        ph = PRODUCER_HEADER_RE.search(text[:2000])
        producer = ph.group(1) if ph else None
        if not producer:
            mk = re.search(r'"_(?:built|generated)_by"\s*:\s*"([^"]+)"', head)
            producer = mk.group(1) if mk else None
        out[rel] = {"global": m.group(1), "producer": producer}
    return out


# ── Supabase / edge-function extraction (all languages) ─────────────────────
REST_LITERAL_RE = re.compile(r"/rest/v1/(rpc/)?([A-Za-z_][A-Za-z0-9_]*)")
# The admin surface's optional-slash concat rule, kept in sync by reusing its
# module for JS; this variant covers python f-strings and shell too.
REST_CONCAT_RE = re.compile(r'REST\s*\+\s*["\']/?(rpc/)?([A-Za-z_][A-Za-z0-9_]*)')
SHELL_REST_RE = re.compile(r"\$REST_BASE/(rpc/)?([A-Za-z_][A-Za-z0-9_]*)")
EDGEFN_RE = re.compile(r"functions/v1/([a-z0-9][a-z0-9_-]*)")
FROM_RE = re.compile(r'\.from\(\s*["\']([a-z0-9_]+)["\']\s*\)')
RPC_CALL_RE = re.compile(r'\.rpc\(\s*["\']([a-z0-9_]+)["\']')
STORAGE_RE = re.compile(r'storage/v1/object(?:/public|/sign)?/["\']?\s*(?:\+\s*)?([A-Za-z_][\w-]*)?')
METHOD_NEAR_RE = re.compile(
    r'method\s*[:=]\s*["\'](%s)["\']' % "|".join(WRITE_METHODS))
CURL_METHOD_RE = re.compile(r"-X\s+(POST|PATCH|PUT|DELETE)")


def direction_near(text: str, pos: int) -> str:
    window = text[pos:pos + WRITE_WINDOW]
    if METHOD_NEAR_RE.search(window) or CURL_METHOD_RE.search(window):
        return "write"
    return "read"


def supabase_edges(rel: str, text: str) -> list:
    """(dataset, direction, line) — tables, rpcs, edge functions, buckets."""
    edges = []
    seen = set()

    def add(ds, direction, pos):
        key = (ds, direction)
        if key in seen or commented(text, pos):
            return
        seen.add(key)
        edges.append((ds, direction, line_of(text, pos)))

    for rx in (REST_LITERAL_RE, REST_CONCAT_RE, SHELL_REST_RE):
        for m in rx.finditer(text):
            is_rpc, name = m.group(1), m.group(2)
            # every table/rpc in this system is lowercase snake_case; anything
            # else that reaches here is prose or UI copy near a REST base
            if name in NOT_TABLES or not re.fullmatch(r"[a-z][a-z0-9_]{2,}", name):
                continue
            if is_rpc:
                add("rpc:%s" % name, "call", m.start())
            else:
                add("supabase:%s" % name, direction_near(text, m.end()), m.start())
    # URL-const direction (governance-feed finding, 2026-08-30): NOTES_URL =
    # SUPABASE_URL + "/rest/v1/nc_partner_notes" is defined at the file top and
    # fetched hundreds of lines later — direction taken at the const line reads
    # every such table as read-only (cpl_adoption_interest's POST was lost).
    # Follow the identifier to its fetch()/usage sites and take direction THERE.
    for cm in re.finditer(
            r"([A-Za-z_]\w*)\s*=\s*[^=\n]*rest/v1/([a-z][a-z0-9_]{2,})", text):
        ident, tbl = cm.group(1), cm.group(2)
        if tbl in NOT_TABLES or tbl == "rpc":
            continue
        for um in re.finditer(r"\b%s\b" % re.escape(ident), text):
            if um.start() == cm.start(1) - 0 or commented(text, um.start()):
                continue
            if um.start() >= cm.start() and um.start() <= cm.end():
                continue        # the definition itself
            add("supabase:%s" % tbl, direction_near(text, um.end()), um.start())
    # module-constant table names: TABLE = "chatbox_credential_recs" reached as
    # f"…/rest/v1/{TABLE}?…" (the four kb/_sync_* upserts) or as
    # "/rest/v1/" + TABLE (reflections digest). The identifier, not the table,
    # sits at the URL — resolve it against a same-file literal assignment.
    for m in re.finditer(r'rest/v1/(?:\{(\w+)\}|["\']\s*\+\s*([A-Za-z_]\w*))', text):
        ident = m.group(1) or m.group(2)
        if not ident or not ident[0].isupper():
            continue        # lowercase = a helper parameter, handled elsewhere
        am = re.search(r'\b%s\s*=\s*["\']/?([a-z0-9_]+)["\']' % re.escape(ident), text)
        if not am:
            continue
        name = am.group(1)
        if name in NOT_TABLES or len(name) < 3:
            continue
        add("supabase:%s" % name, direction_near(text, m.end()), m.start())
    # a bare "rpc/<fn>" literal is a path CONSTANT handed to a helper by name
    # (CLEAR_STAGING_RPC = "rpc/map_clear_custom_report_staging")
    for m in re.finditer(r"""["']rpc/([a-z][a-z0-9_]{2,})["']""", text):
        add("rpc:%s" % m.group(1), "call", m.start())
    # ENDPOINT-const write detection (found by adversarial verify, 2026-08-30):
    # kb/_rekey_kb_curation_supabase.py holds the table in ENDPOINT =
    # f"…/rest/v1/kb_curation" and writes through _req("PATCH", "<filter>") —
    # the verb never sits near the table, so the const scored read-only. A
    # bulk live-table PATCH recorded as a reader is the worst direction error
    # the Rule-10 table can carry. Bind: const naming a table + a helper whose
    # method= comes from a parameter + a write-verb call site => write.
    endpoint_consts = {em.group(1): em.group(2) for em in re.finditer(
        r"""([A-Z][A-Z0-9_]*)\s*=\s*f?["'][^"'\n]*rest/v1/([a-z][a-z0-9_]{2,})""",
        text)}
    if endpoint_consts:
        for dm in re.finditer(r"def\s+(\w+)\s*\(\s*(\w+)", text):
            hname, first_param = dm.group(1), dm.group(2)
            body = text[dm.end():dm.end() + 900]
            used = [t for c, t in endpoint_consts.items() if re.search(r"\b%s\b" % c, body)]
            if not used or not re.search(r"method\s*=\s*%s\b" % re.escape(first_param), body):
                continue
            for cm in re.finditer(r"\b%s\(\s*[\"'](%s)[\"']"
                                  % (re.escape(hname), "|".join(WRITE_METHODS)), text):
                for t in used:
                    add("supabase:%s" % t, "write", cm.start())
    for m in EDGEFN_RE.finditer(text):
        add("edgefn:%s" % m.group(1), "call", m.start())
    for m in FROM_RE.finditer(text):
        window = text[m.end():m.end() + WRITE_WINDOW]
        w = re.search(r"\.(insert|upsert|update|delete)\(", window)
        add("supabase:%s" % m.group(1), "write" if w else "read", m.start())
    for m in RPC_CALL_RE.finditer(text):
        add("rpc:%s" % m.group(1), "call", m.start())
    for m in re.finditer(r'storage/v1/object', text):
        # bucket name is a nearby const (IMG_BUCKET/BUCKET = 'name')
        bk = re.search(r'(?:BUCKET|IMG_BUCKET)\s*=\s*["\']([\w-]+)["\']', text)
        if bk:
            add("storage:%s" % bk.group(1), direction_near(text, m.end()), m.start())
    return edges


HELPER_DEF_RE = {
    "js": re.compile(r"function\s+([A-Za-z_$][\w$]*)\s*\("),
    "py": re.compile(r"def\s+([A-Za-z_]\w*)\s*\("),
}


def helper_call_edges(rel: str, text: str) -> list:
    """Harvest table names that live ONLY at helper call sites.

    Any locally-defined function whose body (a bounded window) builds a
    /rest/v1 URL from its parameter gets its string-literal call arguments
    read as PostgREST paths. Covers raci.js sbGet(), cpl_memory.js writeReq()
    (trailing-slash REST), kb/_load_budget.py _fetch_table(), and the
    _eacr_flag_migrate "/kb_curation" call-site shape in one rule."""
    kind = "py" if rel.endswith(".py") else "js"
    edges, seen = [], set()

    # Pass 1: a helper qualifies only when one of ITS OWN parameters reaches
    # the REST URL in its body window. Proximity is not enough: gr_priorities'
    # el()/field() UI helpers sit right above fetch(REST + …) lines, and an
    # overlap test read their label strings ("Blast rank") as tables.
    defs = []
    for dm in HELPER_DEF_RE[kind].finditer(text):
        name = dm.group(1)
        sig = text[dm.end():text.find(")", dm.end()) + 1 if text.find(")", dm.end()) > 0 else dm.end()]
        params = re.findall(r"[A-Za-z_]\w*", sig)
        body = text[dm.end():dm.end() + 900]
        defs.append((name, params, body))
    accepted = {}          # name -> True when the parameter lands after rpc/
    for name, params, body in defs:
        if "rest/v1" not in body and "REST +" not in body and "REST+" not in body:
            continue
        for prm in params:
            if re.search(r"[+{]\s*%s\b" % re.escape(prm), body):
                accepted[name] = bool(
                    re.search(r"rpc/[\"']?\s*(?:\+\s*)?\{?%s\b" % re.escape(prm), body))
                break
    # Pass 2 (one hop): a wrapper qualifies when it forwards a parameter into
    # an already-accepted helper — insert(table, …) calling _request(f"{table}…").
    for name, params, body in defs:
        if name in accepted:
            continue
        for h in list(accepted):
            for prm in params:
                if re.search(r"\b%s\([^)]*\b%s\b" % (re.escape(h), re.escape(prm)), body):
                    accepted[name] = accepted[h]
                    break

    for name, param_is_rpc in accepted.items():
        # A leading HTTP-verb argument is skipped: _req("GET", "/kb_curation",
        # …) carries its table in the SECOND literal.
        for cm in re.finditer(
                r"\b%s\(\s*(?:[\"'](GET|POST|PATCH|PUT|DELETE|HEAD)[\"']\s*,\s*)?"
                r"[\"']/?([A-Za-z_][\w/]*)" % re.escape(name), text):
            verb, seg = cm.group(1), cm.group(2)
            if seg in ("GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"):
                continue
            if seg.startswith("rpc/") or param_is_rpc:
                ds = "rpc:%s" % seg.split("/")[-1].split("?")[0]
                direction = "call"
            else:
                tbl = seg.split("?")[0].split("/")[0]
                if tbl in NOT_TABLES or "." in tbl \
                        or not re.fullmatch(r"[a-z][a-z0-9_]{2,}", tbl):
                    continue
                ds = "supabase:%s" % tbl
                # writeReq("PATCH", "cpl_memory?…") carries the verb as its
                # FIRST argument — a look-ahead window never sees it
                direction = ("write" if verb in WRITE_METHODS
                             else direction_near(text, cm.end()))
            key = (ds, direction)
            if key in seen or commented(text, cm.start()):
                continue
            seen.add(key)
            edges.append((ds, direction, line_of(text, cm.start())))
    # python adjacent-string form: _fetch_table("workplan_goals" "?select=…")
    # is already caught above because the first literal is the captured arg.
    return edges


# ── file-dataset extraction ─────────────────────────────────────────────────
DATA_EXT = r"(?:json|csv|geojson|xlsx|txt)"
FETCH_LIT_RE = re.compile(r"""fetch\(\s*['"`]([^'"`)\s]+)['"`]""")
LOADSCRIPT_RE = re.compile(r"""(?:loadScript|ensureScript)\(\s*['"]([\w./\-]+\.js)['"]""")
ERASRC_RE = re.compile(r"""_eraSrc\(\s*['"]([\w./\-]+)['"]""")
CREATED_SRC_RE = re.compile(r"""\.src\s*=\s*['"]([\w./\-]+\.js)['"]""")
# path.join gets ALL its trailing string segments captured and joined:
# path.join(__dirname, "..", "x.js") once resolved to ".." alone, minting a
# bogus file:. dataset while dropping the real edge (verify finding).
NODE_FS_RE = re.compile(
    r"""(readFileSync|writeFileSync)\(\s*(?:path\.join\(\s*[\w.]+\s*,\s*((?:['"][^'"]+['"]\s*,\s*)*['"][^'"]+['"])|['"]([\w./\- ]+)['"])""")
URLCONST_RE = re.compile(r"""(?:var|const|let)\s+(\w+)\s*=\s*['"]([\w./\-]+\.(?:json|js|csv))['"]""")
PY_LIT_RE = re.compile(r"""['"]([\w./\- <>*]{2,140}?\.(?:json|js|csv|xlsx|geojson|txt|html|md|docx))['"]""")
# Line-local write evidence only. A +/-260-char window misfired three ways in
# one run (a read three lines above an f.write of a DIFFERENT file; a path
# inside a written string; a "_doc": metadata value) — and the stale-copy rule
# turns a wrong direction into a wrong published claim.
PY_WRITE_LINE = re.compile(
    r"""\bdump\(|,\s*["'][wa]b?["']|write_text|\.save\(|writestr|DictWriter""")
PY_READ_VAR = r"""json\.load\(\s*open\(\s*{v}|open\(\s*{v}\s*[,)][^)]*["']?r?|{v}\.read_text|load\(\s*{v}"""


def py_var_write(text: str, var: str) -> bool:
    """Does `var` (a path constant) ever reach a write? Dataflow-lite: the
    common shapes are open(VAR, "w"), json.dump(x, open(VAR…, VAR.write_text,
    wb.save(VAR), zipfile(VAR, "w")."""
    v = re.escape(var)
    return bool(re.search(
        r"""open\(\s*%s\s*,\s*["'][wa]b?["']|dump\([^)]*,\s*(?:open\(\s*)?%s\b|"""
        r"""%s\.write_text|\.save\(\s*%s\b|ZipFile\(\s*%s\b""" % (v, v, v, v, v),
        text))


def py_var_read(text: str, var: str) -> bool:
    v = re.escape(var)
    return bool(re.search(
        r"""json\.load\(\s*open\(\s*%s|open\(\s*%s\s*[,)]|%s\.read_text|"""
        r"""load_workbook\(\s*%s""" % (v, v, v, v), text))


def norm_rel(base_dir: str, target: str):
    """Resolve a fetched/loaded relative path against the page/module dir."""
    t = target.split("?")[0].split("#")[0]
    if t.startswith(("http://", "https://", "//")):
        return None
    p = os.path.normpath(os.path.join(base_dir, t)) if t.startswith(".") else \
        os.path.normpath(t)
    return p.replace("\\", "/")


def js_file_edges(rel: str, text: str, tracked: set) -> list:
    """(dataset, direction, line) for runtime file reads in a JS module."""
    base_dir = os.path.dirname(rel)
    edges, seen = [], set()

    def add(path, direction, pos, must_exist=False):
        if path is None:
            return
        path = canon_dates(path)
        if "*" not in path and must_exist and path not in tracked:
            return
        key = (path, direction)
        if key in seen or commented(text, pos):
            return
        seen.add(key)
        edges.append(("file:%s" % path, direction, line_of(text, pos)))

    for m in FETCH_LIT_RE.finditer(text):
        t = m.group(1)
        if re.search(r"\.%s$" % DATA_EXT, t.split("?")[0]) or t.endswith(".js") \
                or t.endswith(".html"):
            add(norm_rel(base_dir, t), "read", m.start())
    for rx in (LOADSCRIPT_RE, ERASRC_RE, CREATED_SRC_RE):
        for m in rx.finditer(text):
            add(norm_rel(base_dir, m.group(1)), "read", m.start())
    for m in NODE_FS_RE.finditer(text):
        d = "write" if m.group(1) == "writeFileSync" else "read"
        if m.group(2):      # path.join form: join every quoted segment
            parts = re.findall(r"['\"]([^'\"]+)['\"]", m.group(2))
            target = os.path.normpath(os.path.join(base_dir, *parts)).replace("\\", "/")
            # __dirname/".."-style joins hop above the module dir; if the
            # result escapes the repo, re-anchor at the root
            while target.startswith("../"):
                target = target[3:]
            if target in (".", ""):
                target = None
            add(target, d, m.start())
        else:
            add(norm_rel(base_dir, m.group(3)), d, m.start())
    # fs-helper harvest (verify finding): loadWindowJson("x.js") wraps
    # readFileSync(path.join(ROOT, file)) — the literal lives only at call
    # sites, same shape as the REST helpers.
    for dm in re.finditer(r"function\s+(\w+)\s*\(\s*(\w+)", text):
        hname, prm = dm.group(1), dm.group(2)
        body = text[dm.end():dm.end() + 600]
        if "readFileSync" not in body or not re.search(r"[,(]\s*%s\b" % re.escape(prm), body):
            continue
        for cm in re.finditer(r"\b%s\(\s*['\"]([\w./\-]+\.(?:js|json|csv|geojson|txt))['\"]"
                              % re.escape(hname), text):
            add(os.path.normpath(cm.group(1)).replace("\\", "/"), "read", cm.start())
    # URL-const two-pass: var METRICS_URL = '../live_metrics.json' … fetch(METRICS_URL)
    for m in URLCONST_RE.finditer(text):
        name, target = m.group(1), m.group(2)
        if re.search(r"\bfetch\(\s*%s\b" % re.escape(name), text) or \
           re.search(r"loadScript\(\s*%s\b" % re.escape(name), text):
            add(norm_rel(base_dir, target), "read", m.start())
    return edges


def py_file_edges(rel: str, text: str, tracked: set, basenames: dict) -> list:
    """Literal path references in a Python script, resolved against the tree.

    Resolution order for a bare basename: the script's own directory, then the
    repo root, then a UNIQUE basename match anywhere. Ambiguous or absent
    paths are dropped here and surface via the unresolved report instead."""
    script_dir = os.path.dirname(rel)
    edges, seen = [], set()
    for m in PY_LIT_RE.finditer(text):
        lit = m.group(1)
        if commented(text, m.start()):
            continue
        # a literal joined onto a temp dir is NOT the repo dataset it is named
        # after — kb/_verify_students_served.py bakes its own synthetic copy of
        # credential_reference_data.js under tempfile.mkdtemp and reads THAT
        line_start = text.rfind("\n", 0, m.start()) + 1
        line_end = text.find("\n", m.end())
        lit_line = text[line_start:line_end if line_end > 0 else len(text)]
        if re.search(r"\btmp\b|tempfile|mkdtemp|TemporaryDirectory", lit_line):
            continue
        cand = canon_dates(lit.replace("\\", "/"))
        resolved = None
        if "*" in cand or "<" in cand:
            resolved = cand
        elif cand in tracked:
            resolved = cand
        else:
            for prefix in (script_dir, "kb", ""):
                p = os.path.normpath(os.path.join(prefix, cand)).replace("\\", "/")
                if p in tracked:
                    resolved = p
                    break
            if resolved is None and "/" not in cand:
                hits = basenames.get(cand, [])
                if len(hits) == 1:
                    resolved = hits[0]
        if resolved is None:
            # A dated family whose concrete dir is not tracked still joins on
            # the canonical form when a writer produces it.
            if "<date>" in cand:
                resolved = cand if "/" in cand else None
        if resolved is None:
            continue
        if resolved == rel:
            continue
        # direction: line-local evidence, else follow the assigned variable —
        # but ONLY one assigned exactly once in the file. excel_to_dashboard
        # reuses `path` thousands of times, so an unscoped follow credits a
        # read-only config literal with an unrelated open(path, "w").
        line_start = text.rfind("\n", 0, m.start()) + 1
        line_end = text.find("\n", m.end())
        line = text[line_start:line_end if line_end > 0 else len(text)]
        directions = []
        if PY_WRITE_LINE.search(line):
            directions.append("write")
        before = text[line_start:m.start()]
        am = re.search(r"([A-Za-z_]\w*)\s*=\s*[^=]*$", before)
        if am:
            var = am.group(1)
            # a def-default binding (output_path="x.json") counts as one
            if len(re.findall(r"\b%s\s*=[^=]" % re.escape(var), text)) == 1:
                if py_var_write(text, var):
                    directions.append("write")
                if py_var_read(text, var):
                    directions.append("read")
        if not directions:
            directions = ["read"]
        for direction in dict.fromkeys(directions):
            key = (resolved, direction)
            if key in seen:
                continue
            seen.add(key)
            edges.append(("file:%s" % resolved, direction, line_of(text, m.start())))
    return edges


IMPORT_RE = re.compile(
    r"^\s*(?:import|from)\s+(excel_to_dashboard|kb\._load_projects|"
    r"kb\._load_budget|kb\._load_workplan_goals|_load_projects|_load_budget|"
    r"_load_workplan_goals|_validate_projects|_validate_workplan_goals)\b",
    re.M)

IMPORT_TARGETS = {
    "excel_to_dashboard": "excel_to_dashboard.py",
    "kb._load_projects": "kb/_load_projects.py",
    "kb._load_budget": "kb/_load_budget.py",
    "kb._load_workplan_goals": "kb/_load_workplan_goals.py",
    "_load_projects": "kb/_load_projects.py",
    "_load_budget": "kb/_load_budget.py",
    "_load_workplan_goals": "kb/_load_workplan_goals.py",
    "_validate_projects": "kb/_validate_projects.py",
    "_validate_workplan_goals": "kb/_validate_workplan_goals.py",
}


# ── HTML extraction ─────────────────────────────────────────────────────────
SCRIPT_SRC_RE = re.compile(r'<script[^>]*\bsrc="([^"?#]+\.js)')
SCRIPT_BLOCK_RE = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>",
                             re.S | re.I)
IFRAME_RE = re.compile(r'(?:<iframe[^>]*src="([^"]+\.html)"|\.src\s*=\s*"([\w./\-]+\.html)")')
MODULE_IMPORT_RE = re.compile(r'''import\s+[^"']*["'](\./[\w./\-]+\.js)["']''')


# ── workflow extraction ─────────────────────────────────────────────────────
RUN_SCRIPT_RE = re.compile(r"(?:python3?|node|bash)\s+([\w./\-]+\.(?:py|mjs|js|sh))")
# quotes are optional in YAML — credential-catalog-sync.yml's double-quoted
# cron read as "no schedule" under a single-quote-only pattern (verify finding)
CRON_RE = re.compile(r"""-\s*cron:\s*['"]?([\d*/,\- ]+?)['"]?\s*(?:#|$)""", re.M)
GIT_ADD_RE = re.compile(r"git add (.+)")
URL_RE = re.compile(r"https?://[^\s\"'\\]+")
DEPLOY_FN_RE = re.compile(r"supabase functions (?:deploy|delete)\s+\"?\$?\{?(\w[\w-]*)\}?\"?")
WF_RUN_RE = re.compile(r"workflows:\s*\[([^\]]+)\]")


def step_blocks(text: str):
    """Split a workflow body into step blocks so `if: ${{ false }}` steps can
    be dropped (discover-map-datasets.yml keeps five disabled probes)."""
    parts = re.split(r"\n(?=\s{4,6}- name:)", text)
    return [p for p in parts if "if: ${{ false }}" not in p]


def parse_workflow(rel: str, text: str) -> dict:
    name = None
    m = re.search(r"^name:\s*(.+)$", text, re.M)
    if m:
        name = m.group(1).strip().strip("\"'")
    crons = CRON_RE.findall(text)
    active = "\n".join(step_blocks(text))
    scripts = []
    for sm in RUN_SCRIPT_RE.finditer(active):
        s = sm.group(1)
        if s not in scripts:
            scripts.append(s)
    # drop comment lines BEFORE joining backslash continuations — a comment
    # mentioning `git add` otherwise donates its prose to the commit list
    no_comments = "\n".join(l for l in active.split("\n")
                            if not l.lstrip().startswith("#"))
    joined = re.sub(r"\\\n\s*", " ", no_comments)
    adds = []
    for am in GIT_ADD_RE.finditer(joined):
        args = am.group(1)
        args = args.split("&&")[0].split("||")[0].split("#")[0]
        args = re.sub(r"2>/dev/null", "", args)
        for tok in args.split():
            # a path has a dot or a slash; bare words are shell or prose
            if tok.startswith("-") or tok in (".",) \
                    or not re.fullmatch(r"[\w./*\-]+", tok) \
                    or ("." not in tok and "/" not in tok):
                continue
            adds.append(canon_dates(tok))
    push = None
    if "git push origin HEAD:main" in joined or "git push origin main" in joined:
        push = "main"
    elif re.search(r"git push origin HEAD:\$\{\{\s*github\.ref_name", joined):
        push = "main (cron checkout)" if crons else "triggering branch"
    elif re.search(r"^\s*git push\s*$", joined, re.M) or "git push\n" in joined:
        push = "main (cron checkout)" if crons else "checked-out branch"
    deploys = sorted(set(DEPLOY_FN_RE.findall(active)))
    # resolve ${VAR} function slugs from the env block
    resolved_deploys = []
    for d in deploys:
        if d.isupper():
            em = re.search(r"%s:\s*([\w-]+)" % d, text)
            resolved_deploys.append(em.group(1) if em else d)
        else:
            resolved_deploys.append(d)
    chain = []
    wm = WF_RUN_RE.search(text)
    if wm:
        chain = [c.strip().strip("\"'") for c in wm.group(1).split(",")]
    urls = sorted({re.sub(r"\$\{[^}]*\}", "", u).rstrip("\\\"'.,)")
                   for u in URL_RE.findall(active)
                   if "github.com/actions" not in u})
    return {"name": name, "crons": crons, "scripts": scripts, "adds": adds,
            "push": push, "deploys": sorted(set(resolved_deploys)),
            "chain": chain, "urls": urls}


def pages_excludes(text: str) -> list:
    """The prune list in pages.yml is ground truth for served-vs-internal."""
    return sorted({m.group(1).rstrip("/")
                   for m in re.finditer(r"rm -r?f?\s+(?:-rf\s+)?_site/([^\s;]+)", text)})


# ── externals ───────────────────────────────────────────────────────────────
def external_edges(text: str) -> list:
    out, seen = [], set()
    for m in URL_RE.finditer(text):
        if commented(text, m.start()):
            continue
        u = re.sub(r"\$\{[^}]*\}", "", m.group(0))
        host = re.sub(r"^https?://", "", u).split("/")[0].strip("`'\".,)\\;")
        if not host or "supabase.co" in host or host.endswith((".js", ".json")):
            continue
        if host in ("github.com", "raw.githubusercontent.com", "api.github.com"):
            # keep repo-level grain for the GitHub reads
            path = "/".join(re.sub(r"^https?://", "", u).split("/")[1:3])
            host = "%s/%s" % (host, path) if path.strip("/") else host
        ds = "external:%s" % host
        if ds in seen:
            continue
        seen.add(ds)
        out.append((ds, "read", line_of(text, m.start())))
    return out


# ── main build ──────────────────────────────────────────────────────────────
def build():
    tracked = tracked_files()
    tset = set(tracked)
    basenames = {}
    for f in tracked:
        basenames.setdefault(os.path.basename(f), []).append(f)

    warnings = []

    def excluded(rel: str) -> bool:
        return (rel.startswith(("tests/", "docs/", "archive/", "node_modules/",
                                "exports/", "reports/", "presentations/"))
                or rel in META_SCANNERS
                or os.path.basename(rel) in VENDORED)

    root_js = [f for f in tracked if f.endswith(".js") and "/" not in f]
    data_js = classify_data_js(root_js)
    # data files elsewhere (fact-sheet/cpl_stories.js etc.)
    sub_js = [f for f in tracked if f.endswith(".js") and "/" in f
              and not excluded(f)]
    data_js.update(classify_data_js(sub_js))

    # ── tab attribution, reusing the admin surface's parser ────────────────
    html = read("CPL_Dashboard.html")
    if not html:
        fail("cannot read CPL_Dashboard.html")
    lazy = tab_to_js(html)
    if len(lazy) < 15:
        fail("boot dispatch matched only %d tabs — the regex broke, not the tabs"
             % len(lazy))
    eager = eager_modules(html)
    tabs = nav_tabs(html)
    if len(tabs) < 25:
        fail("only %d nav tabs matched — the nav markup changed" % len(tabs))

    module_tabs = {}
    for tab in tabs:
        mods = list(lazy.get(tab, []))
        for mmod in MODULE_ALIASES.get(tab, []) + modules_by_convention(tab, eager):
            if mmod not in mods:
                mods.append(mmod)
        for mmod in mods:
            module_tabs.setdefault(mmod, []).append(tab)
    # one-hop chain: a tab module that loadScripts another CONSUMER module
    # carries its tab(s) onto it (report_generator -> master_report)
    for mod, mtabs in list(module_tabs.items()):
        text = read(mod)
        for lm in LOADSCRIPT_RE.finditer(text):
            target = lm.group(1)
            if target in data_js or target not in tset:
                continue
            for t in mtabs:
                module_tabs.setdefault(target, [])
                if t not in module_tabs[target]:
                    module_tabs[target].append(t)

    # ── page inventory ─────────────────────────────────────────────────────
    pages_yml = read(".github/workflows/pages.yml")
    not_served = pages_excludes(pages_yml)

    def served(rel: str) -> bool:
        return not any(rel == e or rel.startswith(e + "/") for e in not_served)

    # index.html is byte-identical to CPL_Dashboard.html by Rule 4 — scanning
    # both would double every dashboard edge, so the pair is treated as ONE page.
    html_pages = [f for f in tracked if f.endswith(".html")
                  and f != "index.html"
                  and not f.startswith(("tests/", "docs/", "node_modules/"))]

    # Config globals injected by one-line inline <script>s in the dashboard:
    # window.CPL_REPORT_PROXY_URL='https://…'. The URL literal lives ONLY in
    # the HTML while six modules fetch through the global — neither file alone
    # shows the edge, so resolve global -> host here and attribute at reference.
    inline_url_globals = {}
    for gm in re.finditer(r"window\.(CPL_[A-Z_]*URL)\s*=\s*'(https?://[^']+)'", html):
        host = re.sub(r"^https?://", "", gm.group(2)).split("/")[0]
        inline_url_globals[gm.group(1)] = host

    # ── edge collection ────────────────────────────────────────────────────
    consumers = {}      # consumer_id -> {kind, tabs?, page?, edges: []}
    producers = {}      # dataset -> [{by, how}]

    def consumer(cid, kind, **meta):
        c = consumers.setdefault(cid, {"kind": kind, "edges": []})
        c.update(meta)
        return c

    def add_edges(cid, kind, edges, how, **meta):
        if not edges:
            return
        c = consumer(cid, kind, **meta)
        for ds, direction, line in edges:
            c["edges"].append({"dataset": ds, "direction": direction,
                               "how": how, "line": line})

    def add_producer(ds, by, how):
        lst = producers.setdefault(ds, [])
        if not any(p["by"] == by for p in lst):
            lst.append({"by": by, "how": how})

    # data-file producers from headers
    for rel, meta in data_js.items():
        if meta["producer"]:
            add_producer("file:%s" % rel, "script:%s" % meta["producer"], "header")

    # JS modules (root + subdirs)
    js_modules = [f for f in root_js + sub_js
                  if f not in data_js and not excluded(f)
                  and os.path.basename(f) not in VENDORED]
    globals_index = {meta["global"]: rel for rel, meta in data_js.items()
                     if meta["global"]}
    for rel in js_modules:
        text = read(rel)
        kind = "worker" if os.path.basename(rel) in WORKER_SOURCES else "module"
        cid = "%s:%s" % (kind, rel)
        meta = {}
        if rel in module_tabs:
            meta["tabs"] = sorted(module_tabs[rel])
        add_edges(cid, kind, supabase_edges(rel, text), "literal", **meta)
        add_edges(cid, kind, helper_call_edges(rel, text), "helper", **meta)
        add_edges(cid, kind, js_file_edges(rel, text, tset), "literal", **meta)
        add_edges(cid, kind, external_edges(text), "url", **meta)
        # bare-global reads of data-file exports (window[CC_GLOBAL] included:
        # the global name appears as a string literal and \b matches it)
        gedges = []
        for g, target in globals_index.items():
            if target == rel:
                continue
            gm = re.search(r"\b%s\b" % re.escape(g), text)
            if gm:
                gedges.append(("file:%s" % target, "read", line_of(text, gm.start())))
        for g, host in inline_url_globals.items():
            gm = re.search(r"\b%s\b" % re.escape(g), text)
            if gm:
                gedges.append(("external:%s" % host, "read", line_of(text, gm.start())))
        add_edges(cid, kind, gedges, "global", **meta)

    # TypeScript edge functions: consumers of tables AND datasets themselves
    for rel in [f for f in tracked if f.endswith(".ts") and "functions/" in f]:
        text = read(rel)
        fn = rel.split("functions/")[-1].split("/")[0]
        cid = "edgefn:%s" % fn
        add_edges(cid, "edgefn", supabase_edges(rel, text), "literal", source=rel)
        add_edges(cid, "edgefn", external_edges(text), "url", source=rel)
        add_producer("edgefn:%s" % fn, "file:%s" % rel, "source")

    # shell scripts
    for rel in [f for f in tracked if f.endswith(".sh") and not excluded(f)]:
        text = read(rel)
        cid = "script:%s" % rel
        add_edges(cid, "script", supabase_edges(rel, text), "literal")
        add_edges(cid, "script", external_edges(text), "url")

    # python scripts
    py_files = [f for f in tracked if f.endswith(".py") and not excluded(f)]
    py_supabase = {}
    for rel in py_files:
        text = read(rel)
        cid = "script:%s" % rel
        se = supabase_edges(rel, text) + helper_call_edges(rel, text)
        py_supabase[rel] = se
        add_edges(cid, "script", se, "literal")
        add_edges(cid, "script", py_file_edges(rel, text, tset, basenames), "literal")
        add_edges(cid, "script", external_edges(text), "url")
    # one-hop import inheritance: a wrapper that imports the generator (or the
    # kb/_load_* helpers) inherits their Supabase edges — two zero-literal
    # scripts otherwise map as reading nothing
    for rel in py_files:
        text = read(rel)
        for im in IMPORT_RE.finditer(text):
            target = IMPORT_TARGETS.get(im.group(1))
            if not target or target == rel or target not in py_supabase:
                continue
            add_edges("script:%s" % rel, "script",
                      py_supabase.get(target, []), "via %s" % target)

    # mjs tools
    for rel in [f for f in tracked if f.endswith(".mjs") and not excluded(f)]:
        text = read(rel)
        cid = "script:%s" % rel
        add_edges(cid, "script", js_file_edges(rel, text, tset), "literal")
        add_edges(cid, "script", external_edges(text), "url")

    # HTML pages: script tags, inline script bodies, module imports, iframes
    for rel in html_pages:
        text = read(rel)
        base_dir = os.path.dirname(rel)
        cid = "page:%s" % rel
        meta = {"served": served(rel)}
        edges = []
        for m in SCRIPT_SRC_RE.finditer(text):
            p = norm_rel(base_dir, m.group(1))
            if p and (p in tset or "*" in p):
                edges.append(("file:%s" % p, "read", line_of(text, m.start())))
        for m in MODULE_IMPORT_RE.finditer(text):
            p = norm_rel(base_dir, m.group(1))
            if p and p in tset:
                edges.append(("file:%s" % p, "read", line_of(text, m.start())))
        for m in IFRAME_RE.finditer(text):
            p = norm_rel(base_dir, m.group(1) or m.group(2))
            if p and p in tset:
                edges.append(("file:%s" % p, "read", line_of(text, m.start())))
        add_edges(cid, "page", edges, "markup", **meta)
        inline = "\n".join(b for b in SCRIPT_BLOCK_RE.findall(text))
        if inline.strip():
            add_edges(cid, "page", supabase_edges(rel, inline), "inline", **meta)
            add_edges(cid, "page", js_file_edges(rel, inline, tset), "inline", **meta)
            # generator-emitted inline globals are datasets in their own right
            if rel in ("CPL_Dashboard.html", "index.html"):
                for gm in GLOBAL_RE.finditer(inline):
                    add_producer("inline:CPL_Dashboard.html#%s" % gm.group(1),
                                 "script:excel_to_dashboard.py", "inline-emit")

    # workflows
    wf_files = [f for f in tracked if f.startswith(".github/workflows/")]
    wf_info = {}
    name_index = {}
    for rel in wf_files:
        info = parse_workflow(rel, read(rel))
        wf_info[rel] = info
        if info["name"]:
            name_index[info["name"]] = rel
    for rel, info in wf_info.items():
        cid = "workflow:%s" % os.path.basename(rel)
        edges = []
        for s in info["scripts"]:
            if s in tset:
                edges.append(("file:%s" % s, "run", 0))
        for u in info["urls"]:
            host = re.sub(r"^https?://", "", u).split("/")[0]
            if host and "supabase.co" not in host:
                edges.append(("external:%s" % host, "read", 0))
        text = read(rel)
        edges += supabase_edges(rel, text)          # heredocs + curl in YAML
        edges += [("file:%s" % canon_dates(m.group(1)), "read", line_of(text, m.start()))
                  for m in re.finditer(r"open\('([^']+)'", text)]
        add_edges(cid, "workflow", edges, "yaml",
                  crons=info["crons"], push=info["push"], chain=info["chain"])
        for fn in info["deploys"]:
            add_producer("edgefn:%s" % fn, cid, "deploy")
        for a in info["adds"]:
            ds = "file:%s" % a.rstrip("/")
            if info["push"] and "main" in info["push"]:
                add_producer(ds, cid, "commit-to-main")
            else:
                add_producer(ds, cid, "commit")

    # seeds (anchor-verified)
    for seed in SEEDS:
        text = read(seed["file"])
        if not text or not re.search(seed["anchor"], text):
            warnings.append("seed anchor GONE: %s in %s (%s) — edges dropped"
                            % (seed["anchor"], seed["file"], seed["why"]))
            continue
        rel = seed["file"]
        if rel.endswith(".html"):
            cid, kind = "page:%s" % rel, "page"
        elif rel.endswith(".ts"):
            cid, kind = "edgefn:%s" % rel.split("functions/")[-1].split("/")[0], "edgefn"
        elif rel.endswith(".sh"):
            cid, kind = "script:%s" % rel, "script"
        else:
            cid, kind = "module:%s" % rel, "module"
            if rel in module_tabs:
                pass
        meta = {"tabs": sorted(module_tabs[rel])} if rel in module_tabs else {}
        add_edges(cid, kind,
                  [(ds, d, 0) for ds, d in seed["datasets"]], "seeded", **meta)

    # python writers of window.* artifacts (producer side)
    for rel in py_files:
        text = read(rel)
        for wm in re.finditer(r'''["']window\.([A-Z][A-Za-z0-9_]*)\s*=\s*["']''', text):
            g = wm.group(1)
            target = globals_index.get(g)
            if target:
                add_producer("file:%s" % target, "script:%s" % rel, "writes-global")

    # Line evidence from files the daily cron ITSELF rewrites (the dashboard
    # HTML, the generated college_activity.js) shifts on every run — keeping
    # those lines would make --check go stale on main three times a day and
    # block every PR behind it. Names are stable; the lines are not.
    daily_adds = set(wf_info.get(".github/workflows/daily-dashboard.yml",
                                 {}).get("adds", []))
    for cid, c in consumers.items():
        src = cid.split(":", 1)[1]
        if src in daily_adds or src == "CPL_Dashboard.html":
            for e in c["edges"]:
                e["line"] = 0

    # a module with no tab attribution but loaded by standalone pages belongs
    # to those pages in the reader's vocabulary (fact-sheet/factsheet.js)
    module_pages = {}
    for cid, c in consumers.items():
        if c["kind"] != "page":
            continue
        page = cid.split(":", 1)[1]
        for e in c["edges"]:
            if e["dataset"].startswith("file:") and e["dataset"].endswith(".js"):
                mod = e["dataset"][5:]
                module_pages.setdefault(mod, [])
                if page not in module_pages[mod]:
                    module_pages[mod].append(page)

    # ── aggregate dataset -> consumers (dedup on id + dataset + direction:
    # a literal hit and a global hit for the same read are one edge) ───────
    datasets = {}
    seen_agg = set()
    for cid, c in sorted(consumers.items()):
        for e in c["edges"]:
            key = (cid, e["dataset"], e["direction"])
            if key in seen_agg:
                continue
            seen_agg.add(key)
            ds = datasets.setdefault(e["dataset"], {"consumers": []})
            mod = cid.split(":", 1)[1]
            ds["consumers"].append({
                "id": cid, "kind": c["kind"], "direction": e["direction"],
                "how": e["how"], "line": e["line"],
                **({"tabs": c["tabs"]} if c.get("tabs") else {}),
                **({"pages": sorted(module_pages[mod])}
                   if c["kind"] == "module" and not c.get("tabs")
                   and mod in module_pages else {}),
            })
    for ds, plist in producers.items():
        datasets.setdefault(ds, {"consumers": []})["producers"] = plist
    for ds, d in datasets.items():
        if ds.startswith("file:"):
            p = ds[5:]
            d["served"] = served(p) and p in tset
        d["consumers"].sort(key=lambda e: (e["kind"], e["id"], e["direction"]))
        d["main_committers"] = sorted({p["by"] for p in d.get("producers", [])
                                       if p["how"] == "commit-to-main"})

    # stale-copy risk: a tracked artifact rebuilt by a script that a
    # main-committing workflow runs, yet ABSENT from that workflow's git add
    # list — its committed copy silently stales (found first on
    # cpl_pathways_ccr_data.js, rebuilt daily and never committed).
    def covered(dspath: str, adds: list) -> bool:
        for a in adds:
            if "*" in a:
                if dspath.startswith(a.split("*")[0]):
                    return True
            elif dspath == a or dspath.startswith(a.rstrip("/") + "/"):
                return True
        return False

    stale_risk = []
    for wf, info in wf_info.items():
        if not info["push"] or "main" not in info["push"]:
            continue
        for s in info["scripts"]:
            for e in consumers.get("script:%s" % s, {}).get("edges", []):
                dsn = e["dataset"]
                if not dsn.startswith("file:") or e["direction"] != "write":
                    continue
                path = dsn[5:]
                if "*" in path or "<date>" in path or path not in tset:
                    continue
                if not covered(path, info["adds"]):
                    row = "%s rebuilt by %s under %s but not in its commit list" \
                          % (path, s, os.path.basename(wf))
                    if row not in stale_risk:
                        stale_risk.append(row)

    # unresolved honesty report: files with fetch()/rest markers that yielded
    # nothing — an absent measurement must be visible, never a clean bill
    unresolved = []
    for rel in js_modules + py_files:
        cid_prefix = ("worker:" if os.path.basename(rel) in WORKER_SOURCES
                      else "module:" if rel.endswith(".js") else "script:")
        cid = cid_prefix + rel
        has_edges = bool(consumers.get(cid, {}).get("edges"))
        text = read(rel)
        if not has_edges and ("fetch(" in text or "rest/v1" in text
                              or "urlopen" in text or "urllib.request" in text):
            unresolved.append(rel)

    # sanity floors — fail loudly rather than emit a confident blank
    n_tables = sum(1 for d in datasets if d.startswith("supabase:"))
    n_rpcs = sum(1 for d in datasets if d.startswith("rpc:"))
    n_files = sum(1 for d in datasets if d.startswith("file:"))
    if n_tables < 40:
        fail("only %d Supabase tables found (expected 40+) — extraction broke" % n_tables)
    if n_rpcs < 15:
        fail("only %d RPCs found (expected 15+) — extraction broke" % n_rpcs)
    if n_files < 100:
        fail("only %d file datasets found (expected 100+) — extraction broke" % n_files)
    if len(wf_info) < 25:
        fail("only %d workflows parsed (expected 25+)" % len(wf_info))

    payload = {
        "_about": ("Dataset -> consumers dependency map, derived from the code. "
                   "GENERATED by kb/_build_dependency_map.py — do not hand-edit. "
                   "Regenerate: python3 kb/_build_dependency_map.py"),
        "stats": {
            "supabase_tables": n_tables, "rpcs": n_rpcs,
            "edge_functions": sum(1 for d in datasets if d.startswith("edgefn:")),
            "file_datasets": n_files,
            "external_services": sum(1 for d in datasets if d.startswith("external:")),
            "consumers": len(consumers), "workflows": len(wf_info),
            "data_js_files": len(data_js), "tabs": len(tabs),
        },
        "datasets": {k: datasets[k] for k in sorted(datasets)},
        "module_tabs": {k: sorted(v) for k, v in sorted(module_tabs.items())},
        "workflows": {os.path.basename(k): v for k, v in sorted(wf_info.items())},
        "data_files": {k: data_js[k] for k in sorted(data_js)},
        "not_served": not_served,
        "stale_risk": sorted(stale_risk),
        "unresolved": sorted(unresolved),
        "warnings": warnings,
    }
    return payload


# ── markdown rendering ──────────────────────────────────────────────────────
def display_consumers(entries, module_tabs) -> str:
    """Compact, deduplicated consumer list. COBI modules show as their tab ids
    (the vocabulary the team uses); everything else by path."""
    tabs, mods, pages, scripts, wfs, other = [], [], [], [], [], []
    seen = set()
    for e in entries:
        if e.get("tabs"):
            for t in e["tabs"]:
                if ("tab", t) not in seen:
                    seen.add(("tab", t))
                    tabs.append(t)
            continue
        if e.get("pages"):
            for pg in e["pages"]:
                if ("page", pg) not in seen:
                    seen.add(("page", pg))
                    pages.append(pg)
            continue
        name = e["id"].split(":", 1)[1]
        key = (e["kind"], name)
        if key in seen:
            continue
        seen.add(key)
        {"module": mods, "page": pages, "script": scripts,
         "workflow": wfs}.get(e["kind"], other).append(name)
    parts = []
    if tabs:
        parts.append("tabs: " + ", ".join("`%s`" % t for t in sorted(tabs)))
    if mods:
        parts.append("modules: " + ", ".join("`%s`" % m for m in sorted(mods)))
    if pages:
        parts.append("pages: " + ", ".join("`%s`" % p for p in sorted(pages)))
    if scripts:
        parts.append("scripts: " + ", ".join("`%s`" % s for s in sorted(scripts)))
    if wfs:
        parts.append("workflows: " + ", ".join("`%s`" % w for w in sorted(wfs)))
    if other:
        parts.append(", ".join("`%s`" % o for o in sorted(set(
            e["id"] for e in entries if e["kind"] not in
            ("module", "page", "script", "workflow") and not e.get("tabs")))))
    return " · ".join(parts) if parts else "none found"


def render_md(p: dict) -> str:
    ds = p["datasets"]
    mt = p["module_tabs"]
    L = []
    L.append("---")
    L.append("title: Dependency map — dataset to consuming tabs, scripts, workflows and surfaces")
    L.append("created: %s" % CREATED)
    L.append("tags: [reference, dependency-map, cross-impact, supabase, cron, pipeline]")
    L.append("kb-status: internal")
    L.append("obsidian-folder: cpl-project-tracker/reference")
    L.append("---")
    L.append("")
    L.append("# Dependency map — who consumes what")
    L.append("")
    L.append("**GENERATED — do not hand-edit.** Rebuild: `python3 kb/_build_dependency_map.py`")
    L.append("(`--check` exits 1 when stale; wired into `js-tests.yml`). Full edge list with")
    L.append("file:line evidence: [`kb/dependency_map.json`](../../kb/dependency_map.json).")
    L.append("")
    L.append("This answers the cross-impact question CLAUDE.md orders every session to ask:")
    L.append("*for a given dataset — Supabase table, generated JS, JSON — which tabs, scripts,")
    L.append("workflows and public surfaces consume it?* Derived from the code, not the docs.")
    L.append("Consumer vocabulary: **tabs** are COBI tab ids (`data-tab`); **modules** are JS")
    L.append("files not attributed to a tab; **pages** are standalone HTML surfaces; scripts")
    L.append("and workflows by path. tests/ and docs/ are deliberately not consumers.")
    L.append("")

    # 1. the direct-to-main lane
    L.append("## The direct-to-main lane (bypasses PRs — Pages serves from main)")
    L.append("")
    L.append("Workflows that commit to `main` without a PR. `js-tests` gating (ruling E)")
    L.append("closes the PR path only; THIS lane stays open by design.")
    L.append("")
    L.append("| Workflow | Schedule | Push shape | Commits |")
    L.append("|---|---|---|---|")
    for wf, info in sorted(p["workflows"].items()):
        if not info["push"] or "main" not in info["push"]:
            continue
        crons = "; ".join("`%s`" % c for c in info["crons"]) or "dispatch-only"
        adds = ", ".join("`%s`" % a for a in dict.fromkeys(info["adds"])) or "—"
        L.append("| `%s` | %s | %s | %s |" % (wf, crons, info["push"], adds))
    L.append("")
    chains = [(wf, info["chain"]) for wf, info in p["workflows"].items() if info["chain"]]
    for wf, chain in chains:
        L.append("`%s` deploys after %s by workflow NAME — runner-token pushes fire no"
                 % (wf, ", ".join("\"%s\"" % c for c in chain)))
        L.append("push triggers, so this name edge is the only deploy path for cron commits.")
    L.append("")

    def section(title, prefix, note=None):
        rows = [(k, v) for k, v in ds.items() if k.startswith(prefix)]
        if not rows:
            return
        L.append("## %s" % title)
        L.append("")
        if note:
            L.append(note)
            L.append("")
        L.append("| Dataset | Read by | Written by |")
        L.append("|---|---|---|")
        for k, v in rows:
            readers = [e for e in v["consumers"] if e["direction"] in ("read", "call", "run")]
            writers = [e for e in v["consumers"] if e["direction"] == "write"]
            wtxt = display_consumers(writers, mt) if writers else "—"
            prods = v.get("producers", [])
            if prods:
                ptxt = ", ".join("`%s`" % pr["by"].split(":", 1)[1] for pr in prods)
                wtxt = (wtxt + " · " if wtxt != "—" else "") + "produced by: " + ptxt
            L.append("| `%s` | %s | %s |"
                     % (k.split(":", 1)[1], display_consumers(readers, mt), wtxt))
        L.append("")

    section("Supabase tables", "supabase:",
            "Rule 10's blast-radius question, computed. Directions come from the HTTP\n"
            "method nearest each reference; a table both read and written lists in both\n"
            "columns. Sam curates these LIVE — check who else reads before any bulk write.")
    section("Supabase RPCs", "rpc:")
    section("Edge functions", "edgefn:")
    section("Storage buckets", "storage:")

    # generated data js
    L.append("## Generated JS data artifacts")
    L.append("")
    L.append("| File | Global | Producer | Consumed by |")
    L.append("|---|---|---|---|")
    for rel, meta in sorted(p["data_files"].items()):
        key = "file:%s" % rel
        cons = ds.get(key, {}).get("consumers", [])
        L.append("| `%s` | `%s` | %s | %s |" % (
            rel, meta["global"] or "—",
            "`%s`" % meta["producer"] if meta["producer"] else "not stated in header",
            display_consumers(cons, mt)))
    L.append("")

    # committed files (non data-js)
    L.append("## JSON / CSV / XLSX and other file datasets")
    L.append("")
    L.append("Only files with at least one code consumer or producer. Dated receipt dirs")
    L.append("collapse to one `<date>` family so writer and reader edges join.")
    L.append("")
    L.append("| File | Read by | Written by |")
    L.append("|---|---|---|")
    for k, v in ds.items():
        if not k.startswith("file:"):
            continue
        rel = k.split(":", 1)[1]
        if rel in p["data_files"]:
            continue
        readers = [e for e in v["consumers"] if e["direction"] in ("read", "run")]
        writers = [e for e in v["consumers"] if e["direction"] == "write"]
        if not readers and not writers and not v.get("producers"):
            continue
        wtxt = display_consumers(writers, mt) if writers else "—"
        prods = v.get("producers", [])
        if prods:
            ptxt = ", ".join("`%s`" % pr["by"].split(":", 1)[1] for pr in prods)
            wtxt = (wtxt + " · " if wtxt != "—" else "") + "committed by: " + ptxt
        L.append("| `%s` | %s | %s |" % (rel, display_consumers(readers, mt), wtxt))
    L.append("")

    # externals
    L.append("## External services")
    L.append("")
    L.append("| Service | Called by |")
    L.append("|---|---|")
    for k, v in ds.items():
        if not k.startswith("external:"):
            continue
        L.append("| `%s` | %s |" % (k.split(":", 1)[1],
                                    display_consumers(v["consumers"], mt)))
    L.append("")

    if p.get("stale_risk"):
        L.append("## Stale-copy risk")
        L.append("")
        L.append("Tracked artifacts a main-committing workflow REBUILDS but never commits —")
        L.append("the committed copy silently drifts from what the cron computed:")
        L.append("")
        for r in p["stale_risk"]:
            L.append("- %s" % r)
        L.append("")

    # honesty tail
    L.append("## Not measured")
    L.append("")
    L.append("An absent measurement is not a clean bill. Excluded on purpose: tests/")
    L.append("(guards), docs/ (prose naming datasets it does not read), archive/ (dead),")
    L.append("and the meta-scanners whose rest/v1 regexes are data, not dependencies:")
    L.append(", ".join("`%s`" % s for s in sorted(META_SCANNERS)) + ".")
    L.append("")
    if p["unresolved"]:
        L.append("Files with network/read markers where nothing could be attributed —")
        L.append("check these BY HAND before trusting an absence:")
        L.append("")
        for u in p["unresolved"]:
            L.append("- `%s`" % u)
        L.append("")
    if p["warnings"]:
        L.append("**Warnings (seed anchors that stopped matching):**")
        L.append("")
        for w in p["warnings"]:
            L.append("- %s" % w)
        L.append("")
    s = p["stats"]
    L.append("Coverage: %d Supabase tables · %d RPCs · %d edge functions · %d file"
             % (s["supabase_tables"], s["rpcs"], s["edge_functions"], s["file_datasets"]))
    L.append("datasets · %d external services · %d consumers · %d workflows · %d tabs."
             % (s["external_services"], s["consumers"], s["workflows"], s["tabs"]))
    L.append("")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description="dataset -> consumers map, from code")
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if a rebuild would change anything (never writes)")
    args = ap.parse_args()

    payload = build()
    js = json.dumps(payload, indent=1, ensure_ascii=False, sort_keys=False) + "\n"
    md = render_md(payload)

    cur_js = OUT_JSON.read_text(encoding="utf-8") if OUT_JSON.exists() else None
    cur_md = OUT_MD.read_text(encoding="utf-8") if OUT_MD.exists() else None
    stale = (cur_js != js) or (cur_md != md)
    if args.check:
        if stale:
            print("dependency map is STALE — run: python3 kb/_build_dependency_map.py")
            return 1
        print("dependency map is up to date")
        return 0
    if not stale:
        print("dependency map unchanged")
        return 0
    OUT_JSON.write_text(js, encoding="utf-8")
    OUT_MD.write_text(md, encoding="utf-8")
    s = payload["stats"]
    print("wrote %s + %s (%d datasets, %d consumers, %d warnings)"
          % (OUT_JSON.relative_to(ROOT), OUT_MD.relative_to(ROOT),
             len(payload["datasets"]), s["consumers"], len(payload["warnings"])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
