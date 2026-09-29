#!/usr/bin/env python3
"""
Memory-table auditor — the lint pass for `public.cpl_memory`.

Purpose
-------
`kb/_row_audit.py` keeps the DATA honest and `kb/_docs_audit.py` keeps the
PROSE honest. Nothing kept the MEMORY TABLE honest: governance row DR-19
records that "the memory table has no lint (one of the two known uncaught
doctrine scenarios)", and `kb/_doctrine_scenarios.py` carries the same gap as a
scenario that is NOT YET A GUARD. Rule 8 ingests rows at every checkpoint;
sessions query them; nothing ever asked whether a row still points at something
that exists, whether a stamp matches its status, or whether two rows say the
same thing.

Built 2026-09-05 (Session 229, SkyGrain) for Sam's ask: *"test all the
unverified memories we have stored against what we know is most current
knowledge and clear out anything stale."* The first run found that structural
staleness is RARE — 3 dead paths in 653 citations, 1 near-duplicate pair in 527
proposed rows — and that the real staleness is SEMANTIC (a claim overturned by a
later ruling), which only a reading against the lane files finds. This tool is
the structural half, run every time; the semantic half is a read, done by a
session against `docs/reference/lanes/` with a receipt (see
`kb/memory_audit/2026-09-05-receipt.json` for the worked example).

READ-ONLY, always. It never writes to the database. It reports.

Rules
-----
  M1  dead_path                 — a file path cited in `source`, `summary`,
                                  `detail`, `affects` or `related` that exists
                                  in none of the repo roots. A row pointing at a
                                  file that moved cannot be re-read.
  M2  dangling_related          — a `related` slug that names no row (a name
                                  that matches a KB note or a lane file is
                                  reported apart, as `related_names_doc` — a
                                  convention, not a typo).
  M3  related_to_retired        — a `related` slug whose target is superseded or
                                  stale (the pointer should follow
                                  `superseded_by`).
  M4  stamp_hygiene             — `stale_stamp`: a stale row still carrying
                                  `verified_by`/`verified_at` (the false stamp
                                  Session 193 found); `unattributed_verified`:
                                  verified with no `verified_by` — the
                                  corroboration rule leans entirely on that
                                  field; `proposed_with_session_verifier`: a
                                  session claimed corroboration but never
                                  flipped the status — a promotion candidate.
  M5  pr_not_on_main            — a cited `#NNNN` that never appears as a
                                  squash-merge on `main` (needs a git checkout;
                                  skipped otherwise). `pr_reverted` when a later
                                  commit on main reverts it — the row may
                                  describe a change that no longer exists.
  M6  near_duplicate            — two non-superseded rows whose title+summary
                                  trigram similarity is ≥ 0.55 (the same test
                                  Session 190 ran with pg_trgm; this is a pure-
                                  Python port of pg_trgm's similarity).
  M7  snapshot_claim            — a fact/pitfall/opportunity/risk whose summary
                                  is carried by counts ("N of M", "N rows", a
                                  percentage) with no date in the text. Such a
                                  row was true on its event_date and drifts;
                                  memory should hold the ruling and the reason,
                                  not the value. Informational.
  M8  null_slug                 — a row with no slug. It cannot be cited and a
                                  write keyed on slug PATCHes zero rows (Session
                                  193); writes must key on `id`.
  M9  author_alias              — one session number written under two or more
                                  author strings, which weakens "a second session
                                  corroborates". Informational.
  M10 proposed_with_human_verifier — a `proposed` row whose `verified_by` names
                                  a person. Real attribution, never swept; these
                                  are Sam's to promote (his check IS the gate).
  M11 question_resolved         — a `question`/`wishlist` row linked to a
                                  `decision` row via `related` in either
                                  direction: a candidate to supersede.
  M12 hopper                    — summary only: proposed rows by age, the
                                  ingest-to-corroboration ratio.

Defect classes (fail `--strict`): M1, M2, M4 stale_stamp, M5 pr_not_on_main,
M8. Everything else is a worklist or a signal.

Input
-----
The sandbox that runs sessions cannot reach `*.supabase.co` (CLAUDE.md Rule
10 (c)), so the default input is an EXPORT of the table:

  --from-json PATH   a JSON array of row objects (every column, arrays as
                     lists). Produce it through the Supabase MCP with
                       select json_agg(to_jsonb(m) order by m.created_at)
                       from cpl_memory m;
                     (the MCP saves an oversized result to a file; parse the
                     `result` field's JSON array out of it), or with
  --fetch            PostgREST with SUPABASE_SERVICE_KEY in the environment
                     (a machine that can reach Supabase — Sam's, or CI).

Output
------
  kb/memory_audit/<YYYY-MM-DD>.json   — full findings (machine)
  kb/memory_audit/<YYYY-MM-DD>.md     — ranked report (human)
  kb/memory_audit/latest.json         — copy of the latest run

Run from repo root:
  python3 kb/_memory_audit.py --from-json /path/to/export.json
  python3 kb/_memory_audit.py --fetch                    # needs the service key
  python3 kb/_memory_audit.py --from-json X --strict     # exit 1 on a defect
  python3 kb/_memory_audit.py --from-json X --repo-root ../CPLBrain

No third-party dependencies (same stance as `_docs_audit.py`).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "kb", "memory_audit")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")

DUP_THRESHOLD = 0.55            # Session 190's pg_trgm cut
DEFECT_RULES = {"dead_path", "dangling_related", "stale_stamp", "pr_not_on_main", "null_slug"}

# A cited repo path: a known top-level directory, then a file with a code/doc
# extension. Bare file names (`cpl_funding.js`) are checked by basename.
# Longest extension first and no word character after it: `.js` must not match
# the first two letters of `.json`, nor `.ts` the start of `.tsv` (the first run
# reported 110 phantom dead paths that way — a guard that fails on truth).
PATH_RE = re.compile(
    r"((?:docs|kb|prototype|scripts|tests|chatbox|sierra|supabase|\.claude|\.github|"
    r"CPLBrain|cpl-knowledge-base)/[A-Za-z0-9_./-]+"
    r"\.(?:jsonl|json|yaml|html|tsv|csv|ps1|yml|sql|md|py|js|ts))(?![\w])")
BARE_FILE_RE = re.compile(r"(?<![\w/.*-])([A-Za-z0-9_-]+\.(?:js|py|html|sql))(?![\w/-])")
# 3-4 digits, not starting with 0 and not followed by a hex letter: `#0047AB`
# (a First Light token) is a color, not PR 47.
PR_RE = re.compile(r"(?:PR ?#|#)([1-9]\d{2,3})(?![\dA-Fa-f])")
HUMAN_RE = re.compile(r"\b(sam|sam lee|jenni|ashley|jessica|malone|curator)\b|@[\w.-]+\.\w+", re.I)
SESSION_NUM_RE = re.compile(r"(?<!\d)(\d{2,3})(?!\d)")
DATE_IN_TEXT_RE = re.compile(r"\b20\d\d-\d\d(-\d\d)?\b|\bas of\b|\bmeasured\b", re.I)
COUNT_RE = re.compile(r"\d[\d,]*\s*(?:of\s+\d|rows?\b|%|percent\b|colleges?\b|entries\b|files?\b)", re.I)
# a bare number that is not a date, a rule number, a PR, a section, a version or a session
NUM_RE = re.compile(r"(?<![\w.#§$v-])\d[\d,]*(?:\.\d+)?%?(?![\w-])")


# ─── input ────────────────────────────────────────────────────────────────
def load_rows(path: str):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    # Accept the raw MCP envelope too: {"result": "...[...]..."} or [{"rows": [...]}]
    if isinstance(data, dict) and "result" in data and isinstance(data["result"], str):
        m = re.search(r"\[.*\]", data["result"], re.S)
        data = json.loads(m.group(0)) if m else []
    if isinstance(data, list) and len(data) == 1 and isinstance(data[0], dict) and "rows" in data[0]:
        data = data[0]["rows"]
    if not isinstance(data, list):
        raise SystemExit("export must be a JSON array of row objects")
    for r in data:
        for k in ("tags", "affects", "related"):
            v = r.get(k)
            if v is None:
                r[k] = []
            elif isinstance(v, str):      # a stringified Postgres array
                r[k] = [x.strip().strip('"') for x in v.strip("{}").split(",") if x.strip()]
    return data


def fetch_rows():
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("--fetch needs SUPABASE_SERVICE_KEY in the environment")
    rows, offset, page = [], 0, 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/cpl_memory?select=*&order=created_at&offset={offset}&limit={page}"
        req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            chunk = json.loads(resp.read().decode("utf-8"))
        rows.extend(chunk)
        if len(chunk) < page:
            return rows
        offset += page


# ─── helpers ──────────────────────────────────────────────────────────────
def text_of(r) -> str:
    return " ".join(str(r.get(k) or "") for k in ("source", "summary", "detail"))


def handle(r) -> str:
    return r.get("slug") or f"id:{r.get('id')}"


def trigrams(s: str):
    """pg_trgm's trigram set: lowercase, non-alphanumerics to spaces, each word
    padded with two leading and one trailing space."""
    out = set()
    for w in re.findall(r"[a-z0-9]+", (s or "").lower()):
        p = "  " + w + " "
        for i in range(len(p) - 2):
            out.add(p[i:i + 3])
    return out


def similarity(a: str, b: str) -> float:
    ta, tb = trigrams(a), trigrams(b)
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    return inter / (len(ta) + len(tb) - inter)


def build_file_index(roots):
    """exact relative paths + basenames, per root, from `git ls-files` when
    available (respects the same tree a session sees), else os.walk."""
    exact, basenames = set(), set()
    for root in roots:
        if not os.path.isdir(root):
            continue
        try:
            out = subprocess.run(["git", "-C", root, "ls-files"], capture_output=True,
                                 text=True, timeout=60, check=True).stdout.split("\n")
            files = [f for f in out if f]
        except Exception:
            files = []
            for dp, dns, fns in os.walk(root):
                dns[:] = [d for d in dns if d not in (".git", "node_modules")]
                for fn in fns:
                    files.append(os.path.relpath(os.path.join(dp, fn), root))
        for f in files:
            exact.add(f)
            basenames.add(os.path.basename(f))
    return exact, basenames


def prs_on_main(repo_root):
    """PR numbers that landed on main as squash-merges, and the ones a later
    commit reverts. None when git is unavailable."""
    for ref in ("origin/main", "main"):
        try:
            log = subprocess.run(["git", "-C", repo_root, "log", ref, "--oneline"],
                                 capture_output=True, text=True, timeout=120, check=True).stdout
            break
        except Exception:
            log = None
    if not log:
        return None, None
    merged, reverted = set(), {}
    for line in log.split("\n"):
        nums = re.findall(r"\(#(\d+)\)", line) + re.findall(r"[Mm]erge pull request #(\d+)", line)
        merged.update(nums)
        if re.search(r"\brevert", line, re.I):
            # "Revert "... (#1192)" (#1194)" — the inner number is the reverted PR
            inner = re.findall(r"\(#(\d+)\)", line)
            if len(inner) >= 2:
                reverted[inner[0]] = inner[-1]
    return merged, reverted


# ─── rules ────────────────────────────────────────────────────────────────
def rule_paths(rows, exact, basenames):
    findings = []
    for r in rows:
        if r.get("status") == "superseded":
            continue
        blob = text_of(r) + " " + " ".join(r.get("affects", [])) + " " + \
            " ".join(x for x in r.get("related", []) if "/" in x)
        seen = set()
        for m in PATH_RE.finditer(blob):
            p = m.group(1).rstrip(".,;:)")
            q = re.sub(r"^(CPLBrain|cpl-knowledge-base)/", "", p)
            if q in seen:
                continue
            seen.add(q)
            if q not in exact:
                findings.append({"rule": "dead_path", "row": handle(r), "status": r.get("status"),
                                 "path": p, "kind": "path"})
        for m in BARE_FILE_RE.finditer(blob):
            name = m.group(1)
            if name in seen or name in basenames:
                continue
            seen.add(name)
            if re.match(r"^(index|main|app|file|example|foo)\.", name):
                continue
            findings.append({"rule": "dead_path", "row": handle(r), "status": r.get("status"),
                             "path": name, "kind": "basename"})
    return findings


def doc_stems(root=ROOT):
    """KB-note and lane-file names, the two documented-name conventions the
    corpus uses inside `related` beside row slugs."""
    out = {}
    for sub in (("docs", "kb-notes"), ("docs", "reference", "lanes")):
        d = os.path.join(root, *sub)
        try:
            for f in os.listdir(d):
                if f.endswith(".md") and not f.startswith("_"):
                    out[f[:-3]] = "/".join(sub) + "/" + f
        except OSError:
            pass
    return out


def rule_related(rows, stems=None):
    """`related` is documented as slugs of other rows, but the corpus also uses
    it to name KB notes (with or without the `methodology-`/`adr-` prefix) and
    lane files. That is a convention, not a defect — reported as
    `related_names_doc` so the dangling list stays a list of real typos."""
    stems = stems or {}
    by_slug = {r["slug"]: r for r in rows if r.get("slug")}
    findings = []
    for r in rows:
        if r.get("status") == "superseded":
            continue
        for rel in r.get("related", []):
            if "/" in rel or rel.endswith(".md"):
                continue            # a path — rule_paths handles it
            t = by_slug.get(rel)
            if t is None:
                note = rel if rel in stems else next((k for k in stems if k.endswith("-" + rel)), None)
                if note:
                    findings.append({"rule": "related_names_doc", "row": handle(r), "related": rel,
                                     "note": stems[note]})
                else:
                    findings.append({"rule": "dangling_related", "row": handle(r), "related": rel})
            elif t.get("status") in ("superseded", "stale"):
                findings.append({"rule": "related_to_retired", "row": handle(r), "related": rel,
                                 "target_status": t.get("status"),
                                 "follow": t.get("superseded_by")})
    return findings


def rule_stamps(rows):
    """Three stamp shapes. `stale_stamp` is the defect (a stale row still wearing
    a verification stamp). A `proposed` row with a verifier is NOT a defect: when
    the verifier is a person it is real attribution (M10 — never swept, Sam's to
    promote); when it is a session it is a corroboration claim whose status was
    never flipped — a promotion candidate, reported as `proposed_with_session_verifier`."""
    findings = []
    for r in rows:
        st = r.get("status")
        vb, va = (r.get("verified_by") or "").strip(), r.get("verified_at")
        if st == "superseded":
            continue
        if st == "stale" and (vb or va):
            findings.append({"rule": "stale_stamp", "row": handle(r), "status": st,
                             "verified_by": vb, "verified_at": va})
        if st == "verified" and not vb:
            findings.append({"rule": "unattributed_verified", "row": handle(r),
                             "author": r.get("author"), "event_date": r.get("event_date")})
        if st == "proposed" and vb and not HUMAN_RE.search(vb):
            findings.append({"rule": "proposed_with_session_verifier", "row": handle(r),
                             "verified_by": vb, "kind": r.get("kind"), "event_date": r.get("event_date")})
    return findings


def rule_prs(rows, merged, reverted):
    if merged is None:
        return [{"rule": "pr_check_skipped", "note": "no git history available"}]
    findings = []
    for r in rows:
        if r.get("status") == "superseded":
            continue
        for n in sorted(set(PR_RE.findall(text_of(r)))):
            if n not in merged:
                findings.append({"rule": "pr_not_on_main", "row": handle(r), "pr": int(n)})
            elif n in reverted:
                findings.append({"rule": "pr_reverted", "row": handle(r), "pr": int(n),
                                 "reverted_by": int(reverted[n])})
    return findings


def rule_duplicates(rows, threshold=DUP_THRESHOLD):
    live = [r for r in rows if r.get("status") != "superseded"]
    keys = [(r, (r.get("title") or "") + " " + (r.get("summary") or "")) for r in live]
    tg = [trigrams(k) for _, k in keys]
    findings = []
    for i in range(len(keys)):
        if not tg[i]:
            continue
        for j in range(i + 1, len(keys)):
            if not tg[j]:
                continue
            inter = len(tg[i] & tg[j])
            if inter == 0:
                continue
            sim = inter / (len(tg[i]) + len(tg[j]) - inter)
            if sim >= threshold:
                a, b = keys[i][0], keys[j][0]
                if a.get("superseded_by") == b.get("slug") or b.get("superseded_by") == a.get("slug"):
                    continue
                findings.append({"rule": "near_duplicate", "a": handle(a), "b": handle(b),
                                 "a_status": a.get("status"), "b_status": b.get("status"),
                                 "similarity": round(sim, 2)})
    return sorted(findings, key=lambda f: -f["similarity"])


def rule_snapshots(rows):
    findings = []
    for r in rows:
        if r.get("status") in ("superseded", "stale") or r.get("kind") not in ("fact", "pitfall", "opportunity", "risk"):
            continue
        s = r.get("summary") or ""
        if DATE_IN_TEXT_RE.search(s):
            continue
        nums = [n for n in NUM_RE.findall(s) if not re.fullmatch(r"20\d\d", n)]
        if len(nums) >= 3 or (len(nums) >= 2 and COUNT_RE.search(s)):
            findings.append({"rule": "snapshot_claim", "row": handle(r), "kind": r.get("kind"),
                             "status": r.get("status"), "event_date": r.get("event_date"),
                             "summary": s[:160]})
    return findings


def rule_null_slug(rows):
    return [{"rule": "null_slug", "id": r.get("id"), "status": r.get("status"),
             "title": (r.get("title") or "")[:100]}
            for r in rows if not r.get("slug") and r.get("status") != "superseded"]


def rule_author_alias(rows):
    by_num = defaultdict(set)
    for r in rows:
        a = (r.get("author") or "").strip()
        if not a or a in ("unknown",):
            continue
        for n in SESSION_NUM_RE.findall(a):
            if 100 <= int(n) <= 999:
                by_num[n].add(a)
    return [{"rule": "author_alias", "session": n, "authors": sorted(v)}
            for n, v in sorted(by_num.items()) if len(v) > 1]


def rule_human_verifier(rows):
    return [{"rule": "proposed_with_human_verifier", "row": handle(r),
             "verified_by": r.get("verified_by"), "kind": r.get("kind"), "event_date": r.get("event_date")}
            for r in rows
            if r.get("status") == "proposed" and HUMAN_RE.search(r.get("verified_by") or "")]


def rule_questions(rows):
    by_slug = {r["slug"]: r for r in rows if r.get("slug")}
    decisions_linking = defaultdict(list)
    for r in rows:
        if r.get("kind") == "decision" and r.get("status") != "superseded":
            for rel in r.get("related", []):
                decisions_linking[rel].append(r["slug"] or f"id:{r['id']}")
    findings = []
    for r in rows:
        if r.get("kind") not in ("question", "wishlist") or r.get("status") in ("superseded", "stale"):
            continue
        links = list(decisions_linking.get(r.get("slug"), []))
        for rel in r.get("related", []):
            t = by_slug.get(rel)
            if t and t.get("kind") == "decision" and t.get("status") != "superseded":
                links.append(rel)
        if links:
            findings.append({"rule": "question_resolved", "row": handle(r), "kind": r.get("kind"),
                             "decisions": sorted(set(links))})
    return findings


def hopper(rows, today):
    buckets = {"0-7d": 0, "8-30d": 0, "31-60d": 0, "61d+": 0, "undated": 0}
    by_status, by_kind = defaultdict(int), defaultdict(int)
    for r in rows:
        by_status[r.get("status")] += 1
        if r.get("status") == "proposed":
            by_kind[r.get("kind")] += 1
            d = r.get("event_date") or (r.get("created_at") or "")[:10]
            try:
                age = (today - date.fromisoformat(d[:10])).days
            except Exception:
                buckets["undated"] += 1
                continue
            buckets["0-7d" if age <= 7 else "8-30d" if age <= 30 else "31-60d" if age <= 60 else "61d+"] += 1
    return {"by_status": dict(by_status), "proposed_by_kind": dict(by_kind), "proposed_age": buckets}


# ─── report ───────────────────────────────────────────────────────────────
def build_report(payload):
    L = []
    s = payload["summary"]
    L.append(f"# Memory-table audit — {payload['generated']}\n")
    L.append(f"{s['rows']} rows read · status: " +
             " · ".join(f"{k} {v}" for k, v in sorted(s['hopper']['by_status'].items())) + "\n")
    L.append("READ-ONLY. Findings are a worklist; defects (M1, M2, stale stamps, "
             "PRs not on main, null slugs) fail `--strict`.\n")
    L.append("## Counts\n")
    L.append("| Rule | Findings |\n|---|---|")
    for rule, n in sorted(s["counts"].items(), key=lambda kv: (-kv[1], kv[0])):
        L.append(f"| `{rule}` | {n} |")
    L.append("")
    L.append("## Hopper (proposed rows)\n")
    L.append("| Age | Rows |\n|---|---|")
    for k, v in s["hopper"]["proposed_age"].items():
        L.append(f"| {k} | {v} |")
    L.append("")
    L.append("By kind: " + " · ".join(f"{k} {v}" for k, v in sorted(s['hopper']['proposed_by_kind'].items())) + "\n")
    groups = defaultdict(list)
    for f in payload["findings"]:
        groups[f["rule"]].append(f)
    order = ["dead_path", "dangling_related", "related_names_doc", "related_to_retired", "stale_stamp", "unattributed_verified",
             "pr_not_on_main", "pr_reverted", "pr_check_skipped", "near_duplicate", "null_slug",
             "proposed_with_human_verifier", "question_resolved", "author_alias", "snapshot_claim"]
    for rule in order + [r for r in groups if r not in order]:
        fs = groups.get(rule)
        if not fs:
            continue
        L.append(f"## `{rule}` — {len(fs)}\n")
        for f in fs[:60]:
            bits = [f"**{f.get('row') or f.get('a') or f.get('id') or f.get('session') or ''}**"]
            for k, v in f.items():
                if k in ("rule", "row", "a"):
                    continue
                if isinstance(v, list):
                    v = ", ".join(str(x) for x in v)
                bits.append(f"{k}: {v}")
            L.append("- " + " · ".join(bits))
        if len(fs) > 60:
            L.append(f"- … {len(fs) - 60} more in the JSON")
        L.append("")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Audit the cpl_memory table for structural staleness.")
    ap.add_argument("--from-json", help="export of the table (JSON array of row objects)")
    ap.add_argument("--fetch", action="store_true", help="fetch via PostgREST (needs SUPABASE_SERVICE_KEY)")
    ap.add_argument("--repo-root", action="append", default=[],
                    help="extra repo roots for path checks (default: this repo + ../CPLBrain + ../cpl-knowledge-base when present)")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any defect-class finding")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--out-dir", default=OUT_DIR)
    args = ap.parse_args()

    if args.fetch:
        rows = fetch_rows()
    elif args.from_json:
        rows = load_rows(args.from_json)
    else:
        ap.error("give --from-json PATH or --fetch")

    roots = [ROOT] + [p for p in (os.path.join(os.path.dirname(ROOT), "CPLBrain"),
                                  os.path.join(os.path.dirname(ROOT), "cpl-knowledge-base"))
                      if os.path.isdir(p)] + args.repo_root
    exact, basenames = build_file_index(roots)
    merged, reverted = prs_on_main(ROOT)

    findings = []
    findings += rule_paths(rows, exact, basenames)
    findings += rule_related(rows, doc_stems())
    findings += rule_stamps(rows)
    findings += rule_prs(rows, merged, reverted)
    findings += rule_duplicates(rows)
    findings += rule_null_slug(rows)
    findings += rule_author_alias(rows)
    findings += rule_human_verifier(rows)
    findings += rule_questions(rows)
    findings += rule_snapshots(rows)

    today = date.today()
    counts = defaultdict(int)
    for f in findings:
        counts[f["rule"]] += 1
    payload = {
        "generated": today.isoformat(),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "roots": roots,
        "summary": {"rows": len(rows), "counts": dict(counts), "hopper": hopper(rows, today),
                    "defects": sum(v for k, v in counts.items() if k in DEFECT_RULES)},
        "findings": findings,
    }
    os.makedirs(args.out_dir, exist_ok=True)
    stamp = today.isoformat()
    with open(os.path.join(args.out_dir, f"{stamp}.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=1, ensure_ascii=False)
    with open(os.path.join(args.out_dir, "latest.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=1, ensure_ascii=False)
    with open(os.path.join(args.out_dir, f"{stamp}.md"), "w", encoding="utf-8") as fh:
        fh.write(build_report(payload))
    if not args.quiet:
        print(f"memory audit — {len(rows)} rows, {len(findings)} findings, {payload['summary']['defects']} defects")
        for rule, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
            print(f"  {rule:32s} {n}")
        print(f"  → {os.path.relpath(os.path.join(args.out_dir, stamp + '.md'), ROOT)}")
    if args.strict and payload["summary"]["defects"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
