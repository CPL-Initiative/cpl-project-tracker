#!/usr/bin/env python3
"""Unit tests for the memory-table auditor (kb/_memory_audit.py).

Each rule is tested both ways — it must FIRE on the defective row and must
NOT fire on the correct one. A lint that fires on truth gets muted within a
week (docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md), so
the "does not fire" half is the half that keeps the tool alive.

Also pins the pure-Python trigram similarity to pg_trgm's definition, because
the 0.55 near-duplicate cut was measured with pg_trgm (Session 190) and a port
that drifts from it would move the threshold silently.

Run: python3 tests/memory_audit_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "_memory_audit", os.path.join(ROOT, "kb", "_memory_audit.py"))
ma = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ma)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def row(**kw):
    base = {"id": kw.get("id", "00000000-0000-0000-0000-000000000000"), "slug": "a-row",
            "kind": "fact", "status": "proposed", "title": "A title", "summary": "A summary.",
            "detail": None, "plain": None, "tags": [], "source": None, "affects": [],
            "related": [], "author": "SkyTest S999", "verified_by": None, "verified_at": None,
            "event_date": "2026-09-01", "created_at": "2026-09-01T00:00:00+00:00",
            "superseded_by": None}
    base.update(kw)
    return base


def rules_of(findings):
    return sorted(f["rule"] for f in findings)


# ── trigram similarity pinned to pg_trgm ─────────────────────────────────
check("identical strings similarity 1.0", abs(ma.similarity("hello world", "hello world") - 1.0) < 1e-9)
check("disjoint strings similarity 0", ma.similarity("abc", "xyz") == 0.0)
check("pg_trgm padding: 'cat' has 4 trigrams", ma.trigrams("cat") == {"  c", " ca", "cat", "at "})
check("case and punctuation folded", ma.trigrams("Cat!") == ma.trigrams("cat"))

# ── M1 dead_path ─────────────────────────────────────────────────────────
exact = {"docs/reference/lanes/memory-tab.md", "cpl_memory.js"}
basenames = {"memory-tab.md", "cpl_memory.js"}
good = row(source="docs/reference/lanes/memory-tab.md and cpl_memory.js")
bad = row(source="see docs/reference/lanes/gone.md", affects=["ghost_tab.js"])
check("M1 does not fire on live paths", rules_of(ma.rule_paths([good], exact, basenames)) == [])
fs = ma.rule_paths([bad], exact, basenames)
check("M1 fires on a dead path", any(f["path"] == "docs/reference/lanes/gone.md" for f in fs))
check("M1 fires on a dead bare file name", any(f["path"] == "ghost_tab.js" and f["kind"] == "basename" for f in fs))
check("M1 skips superseded rows", ma.rule_paths([row(status="superseded", source="docs/x/gone.md")], exact, basenames) == [])
check("M1 strips trailing punctuation", ma.rule_paths([row(source="(docs/reference/lanes/memory-tab.md).")], exact, basenames) == [])

# ── M2/M3 related ────────────────────────────────────────────────────────
target = row(id="1", slug="target-row", status="verified")
retired = row(id="2", slug="old-row", status="superseded", superseded_by="target-row")
r_ok = row(id="3", slug="r-ok", related=["target-row"])
r_dangling = row(id="4", slug="r-dangling", related=["no-such-row"])
r_retired = row(id="5", slug="r-retired", related=["old-row"])
r_path = row(id="6", slug="r-path", related=["docs/some_lessons.md"])
fs = ma.rule_related([target, retired, r_ok, r_dangling, r_retired, r_path])
check("M2 does not fire on a live target", not any(f["row"] == "r-ok" for f in fs))
check("M2 fires on a dangling slug", any(f["rule"] == "dangling_related" and f["row"] == "r-dangling" for f in fs))
check("M3 fires on a retired target and names the successor",
      any(f["rule"] == "related_to_retired" and f["row"] == "r-retired" and f["follow"] == "target-row" for f in fs))
check("M2 leaves path-shaped related entries to M1", not any(f["row"] == "r-path" for f in fs))
r_note = row(id="7", slug="r-note", related=["a-guard-that-fails-on-truth-gets-muted"])
fs = ma.rule_related([r_note], stems={"methodology-a-guard-that-fails-on-truth-gets-muted": "docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md"})
check("M2 reports a KB-note name apart, not as dangling",
      rules_of(fs) == ["related_names_doc"] and fs[0]["note"].endswith("gets-muted.md"))
r_lane = row(id="8", slug="r-lane", related=["implementation-funding"])
fs = ma.rule_related([r_lane], stems={"implementation-funding": "docs/reference/lanes/implementation-funding.md"})
check("M2 reports a lane-file name apart, not as dangling", rules_of(fs) == ["related_names_doc"])

# ── M4 stamps ────────────────────────────────────────────────────────────
fs = ma.rule_stamps([row(status="verified", verified_by="Sam Lee")])
check("M4 silent on a verified row with a verifier", fs == [])
fs = ma.rule_stamps([row(status="stale", verified_by="curator", verified_at="2026-08-25T00:00:00Z")])
check("M4 fires stale_stamp on a stale row carrying a stamp", rules_of(fs) == ["stale_stamp"])
fs = ma.rule_stamps([row(status="verified", verified_by="")])
check("M4 fires unattributed_verified on verified without verifier", rules_of(fs) == ["unattributed_verified"])
check("M4 ignores superseded rows", ma.rule_stamps([row(status="superseded", verified_by="x")]) == [])

# ── M5 PRs ───────────────────────────────────────────────────────────────
merged = {"1000", "1192", "1194"}
reverted = {"1192": "1194"}
fs = ma.rule_prs([row(summary="Landed in PR #1000.")], merged, reverted)
check("M5 silent on a merged PR", fs == [])
fs = ma.rule_prs([row(summary="Landed in #4242.")], merged, reverted)
check("M5 fires pr_not_on_main", rules_of(fs) == ["pr_not_on_main"] and fs[0]["pr"] == 4242)
fs = ma.rule_prs([row(summary="Shipped in #1192.")], merged, reverted)
check("M5 fires pr_reverted with the reverting PR", rules_of(fs) == ["pr_reverted"] and fs[0]["reverted_by"] == 1194)
check("M5 does not read a 5-digit number as a PR", ma.rule_prs([row(summary="#12345 rows")], merged, reverted) == [])
check("M5 does not read a hex color as a PR", ma.rule_prs([row(summary="cobalt #0047AB and crimson #920000")], merged, reverted) == [])
check("M5 reports skip without git", rules_of(ma.rule_prs([row()], None, None)) == ["pr_check_skipped"])

# ── M6 duplicates ────────────────────────────────────────────────────────
a = row(id="a", slug="a", title="The briefing read summary not plain", summary="briefRow sent summary while the Report rendered plain text")
b = row(id="b", slug="b", title="The briefing read summary, not plain", summary="briefRow sent summary while the Report rendered the plain text")
c = row(id="c", slug="c", title="Unrelated: TOP codes are unreliable", summary="Never gate identity on TOP; it is a last-in-line corroborator")
fs = ma.rule_duplicates([a, b, c])
check("M6 fires on a near-duplicate pair", len(fs) == 1 and {fs[0]["a"], fs[0]["b"]} == {"a", "b"})
check("M6 silent on unrelated rows", not any("c" in (f["a"], f["b"]) for f in fs))
b2 = dict(b, superseded_by="a")
check("M6 skips an explicit supersede chain", ma.rule_duplicates([a, b2, c]) == [])
check("M6 ignores superseded rows", ma.rule_duplicates([a, dict(b, status="superseded")]) == [])

# ── M7 snapshot ──────────────────────────────────────────────────────────
snap = row(kind="fact", summary="358 proposed against 177 verified; 26 of 177 rows carry no verifier.")
dated = row(kind="fact", summary="Measured 2026-08-24: 358 proposed against 177 verified, 26 of 177 rows carry no verifier.")
rule = row(kind="fact", summary="Never force-push main; Pages serves from it.")
check("M7 fires on an undated count-carried claim", rules_of(ma.rule_snapshots([snap])) == ["snapshot_claim"])
check("M7 silent when the text carries its date", ma.rule_snapshots([dated]) == [])
check("M7 silent on a rule with no counts", ma.rule_snapshots([rule]) == [])
check("M7 ignores milestones", ma.rule_snapshots([dict(snap, kind="milestone")]) == [])

# ── M8 null slug ─────────────────────────────────────────────────────────
check("M8 fires on a null slug", rules_of(ma.rule_null_slug([row(slug=None)])) == ["null_slug"])
check("M8 silent with a slug", ma.rule_null_slug([row()]) == [])

# ── M9 author alias ──────────────────────────────────────────────────────
fs = ma.rule_author_alias([row(author="session-187-skyview"), row(author="SkyView (Session 187)"), row(author="Sky188 (Session 188)")])
check("M9 fires on one session under two strings", len(fs) == 1 and fs[0]["session"] == "187")
check("M9 silent on 'unknown'", ma.rule_author_alias([row(author="unknown"), row(author="unknown")]) == [])

# ── M10 human verifier on a proposed row ─────────────────────────────────
check("M10 fires on Sam as verifier of a proposed row",
      rules_of(ma.rule_human_verifier([row(verified_by="Sam (screenshot, 2026-08-28)")])) == ["proposed_with_human_verifier"])
check("M10 fires on an email", rules_of(ma.rule_human_verifier([row(verified_by="slee@cccco.edu")])) == ["proposed_with_human_verifier"])
check("M10 silent on a session verifier", ma.rule_human_verifier([row(verified_by="SkyLens S202")]) == [])
check("M10 silent on verified rows", ma.rule_human_verifier([row(status="verified", verified_by="Sam")]) == [])

# ── M11 question resolved ────────────────────────────────────────────────
q = row(id="q", slug="q-open", kind="question")
d = row(id="d", slug="d-ruled", kind="decision", status="verified", related=["q-open"])
q2 = row(id="q2", slug="q-linked", kind="question", related=["d-ruled"])
q3 = row(id="q3", slug="q-alone", kind="question")
fs = ma.rule_questions([q, d, q2, q3])
check("M11 fires when a decision links to the question", any(f["row"] == "q-open" and "d-ruled" in f["decisions"] for f in fs))
check("M11 fires when the question links to a decision", any(f["row"] == "q-linked" for f in fs))
check("M11 silent on an unlinked question", not any(f["row"] == "q-alone" for f in fs))

# ── loader accepts the MCP envelope and stringified arrays ───────────────
import json, tempfile
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
    json.dump({"result": 'noise [{"rows": [{"id": "x", "slug": "s", "status": "proposed", "tags": "{a,b}", "related": null}]}] noise'}, fh)
    p = fh.name
rows = ma.load_rows(p)
os.unlink(p)
check("loader unwraps the MCP envelope", len(rows) == 1 and rows[0]["slug"] == "s")
check("loader normalizes a stringified array", rows[0]["tags"] == ["a", "b"] and rows[0]["related"] == [])

# ── report ───────────────────────────────────────────────────────────────
payload = {"generated": "2026-09-05", "summary": {"rows": 3, "counts": {"dead_path": 1},
           "hopper": {"by_status": {"proposed": 2, "verified": 1}, "proposed_by_kind": {"fact": 2},
                      "proposed_age": {"0-7d": 2, "8-30d": 0, "31-60d": 0, "61d+": 0, "undated": 0}}, "defects": 1},
           "findings": [{"rule": "dead_path", "row": "a-row", "status": "proposed", "path": "docs/x.md", "kind": "path"}]}
md = ma.build_report(payload)
check("report names the rule and the row", "`dead_path`" in md and "**a-row**" in md)

# ── verdict ──────────────────────────────────────────────────────────────
failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ok  " if ok else "  FAIL") + " " + n)
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
