#!/usr/bin/env python3
"""S742, lane 2's cheap piles: the shared plan code, S741's (kb/_program_piles_s741.py) with three things added.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap named
and a lower score on the 0-100 bar, never held for another night. S740 and S741 left their holds by key
(docs/program_requirements_harvest_lessons.md, S740 and S741, Holds by key). Three of the reasons those keys held are
answered here, each by something the code checks.

LIVE_READ, S741's form (kb/_program_piles_s741.py LiveRead), reading S742's committed live reads beside S741's
(kb/receipts/program_requirements_reread_s741_*_checked.json and ..._s742_*_checked.json): the conductor's read of a
row's live run, at the read's own time, on top of what the receipts post. The plan's pre-read and guarded UPDATE check
the live row itself, so a row that moved since the read is refused there.

PAGE WORDS, for a record whose own notes say nothing of its gap (Gavilan 08464 carries no note). The sentence the gap
stands on is the page's, read by a free college page read and committed in that read's plan file under the run it was
read by, as S741's own_lines keeps its lines:

    "words_at": "page_read", "words": "<the page's sentence>",
    "page_read": {"plan": "kb/college_reads/<plan>.json", "run": "<college-page-read run>", "line": "<its key>"}

The code checks what the committed files show: the plan file is committed and reads the address the record was read
from; the run is a run id; and the plan's _quoted holds that sentence under that run and key. The words filed say
where they come from ("The page prints: '...' (college page read N)"). The second reader reads the same run's log.

BATCH, one plan over a few colleges (the S742 conductor's brief: batched a few colleges per plan). Each college keeps
its own Pile, its own reviewed list, its own self-recall and its own receipt with each row's before-image, exactly as
S741's plans do; a Batch runs the piles in order, numbers their rows together and writes ONE pre-read, ONE guarded
UPDATE and ONE rollback over all of them (kb/migrations/<day>_<tag>_prreq_piles_*.sql), so the conductor applies once.
Every college's receipt carries the batch's SQL and names the batch's members, so each receipt alone shows what the
apply wrote. The UPDATE's guard counts the batch's rows: it writes all of them or none.

Each college's plan: kb/_program_piles_s742_<college>.py; each batch: kb/_program_piles_s742<letter>.py; guards:
tests/program_piles_s742<letter>_test.py.
"""
from __future__ import annotations

import collections
import copy
import glob
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s741 as B8  # noqa: E402

B, NG, S = B8.B, B8.NG, B8.S
P = B.P
ROOT = B.ROOT
PASSES = B.PASSES
WITHIN = B8.WITHIN
LIVE_READS = ("program_requirements_reread_s741_*_checked.json", "program_requirements_reread_s742_*_checked.json")
RULING_S742 = ("the S742 conductor's brief (2026-11-27): gaps noted instead of rereads; a gap is named only where it "
               "is true on the page; plans batched a few colleges each")


class LiveRead(B8.LiveRead):
    """S741's LiveRead over S741's and S742's committed live reads."""

    def live_read(self) -> dict:
        out: dict = {}
        for pattern in LIVE_READS:
            for path in sorted(glob.glob(os.path.join(NG.RECEIPTS, pattern))):
                try:
                    with open(path, encoding="utf-8") as fh:
                        d = json.load(fh)
                except (OSError, ValueError):
                    continue
                at = str(d.get("read_at") or "")
                for k, run in ((d.get("live_runs") or {}).get(self.college) or {}).items():
                    if run:
                        out.setdefault(str(k), []).append((at, str(run)))
        return out


def page_quote(o: dict | None) -> tuple[dict, str] | None:
    """(the committed page read's plan, its quoted sentence) for an entry's page_read, or None: the plan file is
    committed, the run is a run id, and the plan's _quoted holds a sentence under that run and key."""
    o = o or {}
    if not str(o.get("run") or "").isdigit() or not o.get("line") or not o.get("plan"):
        return None
    try:
        with open(os.path.join(ROOT, str(o["plan"])), encoding="utf-8") as fh:
            read = json.load(fh)
    except (OSError, ValueError):
        return None
    quoted = ((read.get("_quoted") or {}).get(str(o["run"])) or {}).get(str(o["line"]))
    return (read, quoted) if isinstance(quoted, str) and quoted else None


class Pile(B8.Pile):
    """S741's Pile with the page's own words, a college's own shape breaks and S742's receipt name."""

    def __init__(self, **kw):
        self.breaks = kw.pop("breaks", None) or {}
        super().__init__(**kw)

    # ── the page's own words ──
    def page_words(self, filed: dict, e: dict) -> str | None:
        got = page_quote(e.get("page_read"))
        if got is None:
            return None
        read, quoted = got
        urls = {str(p.get("url")) for p in read.get("pages") or []}
        if str(filed.get("source_url") or "") not in urls or quoted != e.get("words"):
            return None
        return "The page prints: '%s' (college page read %s)" % (quoted, e["page_read"]["run"])

    def words(self, filed: dict, e: dict) -> str | None:
        if e.get("words_at") == "page_read":
            return self.page_words(filed, e)
        return super().words(filed, e)

    # ── the boundary readings ──
    def break_shape(self, g: dict, e: dict, sh: str) -> dict | None:
        fn = self.breaks.get(sh)
        return fn(g, e) if fn else super().break_shape(g, e, sh)

    def boundaries(self) -> dict:
        """S741's boundary readings, and the page's words' own. An entry whose words are the page's has no note to
        take away, so the earlier readings skip it and its readings are made here: the page read's sentence another
        than the entry's, the record read from another address, the stated total one unit off, coverage failing and
        each of its shapes broken."""
        paged = {cn for cn, e in self.reviewed.items() if e.get("words_at") == "page_read"}
        saved = self.reviewed
        self.reviewed = {cn: e for cn, e in saved.items() if cn not in paged}
        try:
            base = super().boundaries()
        finally:
            self.reviewed = saved
        out, wrong = collections.Counter(base["counts"]), list(base["wrong"])

        def tally(name, ok, cn):
            out["%s %s" % (name, "right" if ok else "wrong")] += 1
            if not ok:
                wrong.append([cn, name])

        for cn in self.keys:
            e = self.reviewed.get(cn)
            f = self.load(cn)
            if f is None or cn not in paged or not self.gap_noted(f):
                continue
            tally("the page read's sentence another", self.gap_noted(f, {cn: dict(e, words=e["words"] + " x")}) is None, cn)
            g = copy.deepcopy(f)
            g["source_url"] = str(g.get("source_url") or "") + "/another"
            tally("the record read from another address", self.gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
            tally("the stated total one unit off", self.gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
            tally("coverage failing", self.gap_noted(g) is None, cn)
            shapes = e.get("shape") or []
            for sh in [shapes] if isinstance(shapes, str) else shapes:
                g = self.break_shape(copy.deepcopy(f), e, sh)
                if g is not None:
                    tally("the %s shape broken" % sh, not self.kind_closes(g, e), cn)
        return {"counts": dict(out), "wrong": wrong}

    def receipt_path(self, day: str, tag: str | None = None) -> str:
        return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s742_%s_%s_%s.json"
                            % (self.slug, day, tag or self.tag))


class Batch:
    """One plan over a few colleges' piles: each pile's own self-recall and receipt, one pre-read, one guarded UPDATE
    and one rollback over every pile's rows."""

    def __init__(self, *, tag: str, piles: list):
        self.tag, self.piles = tag, list(piles)
        if not self.piles or any(w.tag != tag for w in self.piles):
            raise SystemExit("a batch's piles carry the batch's tag")
        if len({w.college for w in self.piles}) != len(self.piles):
            raise SystemExit("a batch holds one pile a college")

    def self_recall(self) -> dict:
        """Each pile's precision, claim checks and boundary readings; a wrong answer anywhere writes no plan."""
        out = {}
        for w in self.piles:
            pr, cc, bd = w.precision(), w.claim_checks(), w.boundaries()
            out[w.college] = {"precision": pr, "claim_checks": cc, "boundaries": bd}
            if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"]:
                raise SystemExit("%s: the self-recall reads a wrong answer: no plan is written" % w.college)
        return out

    def plan(self, write: bool) -> list:
        """[(pile, its plan)] with the rows numbered across the batch, in the piles' order."""
        results = [(w, w.plan(write=write)) for w in self.piles]
        i = 0
        for _, res in results:
            for r in res["rows"]:
                i += 1
                r["i"] = i
        return results

    def main(self, argv=None, doc: str = "") -> int:
        import argparse
        ap = argparse.ArgumentParser(description=(doc or __doc__).splitlines()[0])
        ap.add_argument("--dry-run", action="store_true")
        a = ap.parse_args(argv)
        recall = self.self_recall()
        for college, r in recall.items():
            print("%s precision: %s" % (college, json.dumps(r["precision"])))
            print("%s claim checks: %s" % (college, json.dumps(r["claim_checks"])))
            print("%s boundaries: %s" % (college, json.dumps(r["boundaries"])))
        results = self.plan(write=not a.dry_run)
        rows = [r for _, res in results for r in res["rows"]]
        by = dict(collections.Counter(r["moves_to"] for r in rows))
        print("plan %s: %d rows %s at %d colleges; held %d" % (self.tag, len(rows), by, len(self.piles),
                                                               sum(len(res["held"]) for _, res in results)))
        for r in rows:
            print("  %d %s %s %s (%s)" % (r["i"], r["college"], r["control_number"], r["moves_to"], r["own"]))
        if a.dry_run or not rows:
            return 0
        empty = [w.college for w, res in results if not res["rows"]]
        if empty:
            raise SystemExit("a pile of the batch plans no row: %s" % empty)
        stamp = time.gmtime()
        day = time.strftime("%Y-%m-%d", stamp)
        sql = {"pre_read": P.confirm_pre_read(rows), "pre_read_md5": B.md5_pre_read(rows),
               "apply": P.confirm_guarded_apply(rows, self.tag + " piles"),
               "rollback": NG.rollback_sql(rows, self.tag + " piles rollback")}
        members = [[r["college"], r["control_number"], r["i"]] for r in rows]
        paths = []
        for w, res in results:
            mine = res["rows"]
            mine_by = dict(collections.Counter(r["moves_to"] for r in mine))
            body = {"rule": "%s; %s; %s. S742: %s's records %s held, read again by key: collected with their gaps "
                            "named where the gap is true on the page and the record is the program's own (no reread, "
                            "no reconcile, no record changed)"
                            % (NG.RULING, B.RULING_S739, RULING_S742, w.name, w.held_by),
                    "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": w.college,
                    "batch": {"tag": self.tag, "rows": len(rows), "colleges": [x.college for x in self.piles],
                              "members": members,
                              "what": "one pre-read, one guarded UPDATE and one rollback over every member; the "
                                      "UPDATE writes all of the batch's rows or none"},
                    "keys": {"from": w.held_by, "members": list(w.keys)},
                    "gaps": {g: NG.GAPS[g] for g in sorted(g for g in mine_by if g != PASSES)},
                    "moved": len(mine), "by": mine_by,
                    "precision": recall[w.college]["precision"], "claim_checks": recall[w.college]["claim_checks"],
                    "boundaries": recall[w.college]["boundaries"], "held": res["held"], "records": mine,
                    "live_run_proof": None,
                    "shared_pages": {r["control_number"]: w.shared_with(r["control_number"]) for r in mine
                                     if w.shared_with(r["control_number"])},
                    "representation": "checks.gaps and checks.confidence added as the load reads the filed score (a "
                                      "passing row: checks.arithmetic to equal); checks.coverage, invented and the "
                                      "record unchanged",
                    "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the "
                                          "codes it found, and a course an entry says the printed total leaves out "
                                          "on neither it nor the state's list. A note's quoted figures are the "
                                          "reader's words, never re-read here; a page read's sentence is committed "
                                          "in its plan file under its run."),
                    "follow_verdict": P.FOLLOW_VERDICT,
                    "pre_read": sql["pre_read"], "pre_read_md5": sql["pre_read_md5"], "apply": sql["apply"],
                    "rollback": sql["rollback"]}
            path = w.receipt_path(day, self.tag)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(body, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
            paths.append(os.path.relpath(path, ROOT))
        hdr = ("-- %s lane 2's cheap piles, one plan over %s (%d rows: %s). Each row's checks become the\n"
               "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,\n"
               "-- or checks.arithmetic to equal for a rescore; the record unchanged. Receipts (before_image per\n"
               "-- row), one a college:\n%s"
               % (self.tag.upper(), ", ".join(w.name for w in self.piles), len(rows),
                  ", ".join("%s %d" % kv for kv in sorted(by.items())),
                  "".join("--   %s\n" % p for p in paths)))
        base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, self.tag))
        parts = {
            "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb "
                                "text\n-- (the full before-values, the fallback where a hash does not match, are in "
                                "..._preread.sql).\n" + sql["pre_read_md5"]),
            "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + sql["pre_read"],
            "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and "
                          "checks,\n-- and no person's check. It aborts, writing nothing, unless it matches the plan's "
                          "%d rows less\n-- those a person checked (listed as skipped_checked), or a row holds a "
                          "matching confirm.\n" % len(rows) + sql["apply"]),
            "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                             "-- after-image, skipping and listing a row a person checked. A rollback lasts only until "
                             "the\n-- next load of that college: revert the record files too (git revert of this "
                             "plan's commit).\n" + sql["rollback"]),
        }
        for name, text in parts.items():
            with open(base + name, "w", encoding="utf-8") as fh:
                fh.write(hdr + text + "\n")
        for p in paths:
            print("receipt %s" % p)
        return 0
