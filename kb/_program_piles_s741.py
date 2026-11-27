#!/usr/bin/env python3
"""S741, lane 2's cheap piles: the shared plan code, S740's (kb/_program_piles_s740.py) with two readings added.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap named
and a lower score on the 0-100 bar, never held for another night. S740 left its holds by key, each with its reason
(docs/program_requirements_harvest_lessons.md, S740, Holds by key). Two of those reasons are evidence a later run can
bring, and each is a reviewed entry the code checks:

OWN_LINES, a fourth form of the own-page guard (kb/_program_piles_s739.py own(): own_section, own_heading, own_list).
A record read from a page another program was read from, whose heading sits on the page before, stands where a
committed page read prints the lines that close its section on the page the record was read from:

    "own_lines": {"plan": "kb/college_reads/<plan>.json", "run": "<college-page-read run>", "page": N,
                  "opens": "<the sentence above the record's lists>", "closes": "<the section's own totals line>",
                  "next": "<the words the next program's section opens on>"}

The code checks what the committed files can show: the plan file is committed, reads the record's own catalog
file and carries the same three lines under the run and page they were read from (its _quoted); the record was read
from page N; the record's own section_heading carries every word of the program's title
and names its kind of award (the reader said whose section it read); the closing line carries every word of the
title, names the kind of award and prints the record's stated total (the total the record holds is that line's);
the opening sentence carries every word of the title; and no page-mate's title is inside the closing line, a
same-title sister standing apart only by an award the line does not name. The quoted lines are the page read's,
read by a session from the run's log and cited by run; the second reader reads the same log.

LIVE_READ, the live run where no committed receipt posts it. S740 held seven records as on no proved live run: the
committed receipts post another run, or none, for the row. The conductor's live read of those rows
(kb/receipts/program_requirements_reread_s741_piles_checked.json: live_runs by college, the run each live row holds,
at read_at; S727's form at College of the Canyons) is the proof: LiveRead posts each key it names at its run, at the
read's own time, beside what the receipts post. The plan's pre-read and its guarded UPDATE check the live row
itself (the run, the record and the checks), so a row that moved since the read is refused there.

Each college's plan: kb/_program_piles_s741_<college>.py; guards: tests/program_piles_s741_<college>_test.py.
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B, NG, S = B7.B, B7.NG, B7.S
ROOT = B.ROOT
PASSES = B.PASSES
WITHIN = B7.WITHIN
LIVE_READS = "program_requirements_reread_s741_*_checked.json"


def _figure(v) -> str:
    v = float(v)
    return str(int(v)) if v == int(v) else str(v)


def printed_range(stated) -> list[str]:
    """How a page prints a total: '22-27', or '22' where both ends are one figure."""
    st = B.pair(stated)
    if st is None:
        return []
    lo, hi = _figure(st[0]), _figure(st[1])
    return [lo] if lo == hi else ["%s-%s" % (lo, hi), "%s - %s" % (lo, hi), "%s–%s" % (lo, hi)]


class LiveRead:
    """A college's live runs: what the committed receipts post (B.LiveRuns, or the college's earlier module), and the
    conductor's committed live read on top (LIVE_READS: {"read_at": ..., "live_runs": {college: {key: run}}})."""

    def __init__(self, college: str, slug: str, prior=None):
        self.college, self.slug = college, slug
        self.prior = prior if prior is not None else B.LiveRuns(college, slug)

    def live_read(self) -> dict:
        out: dict = {}
        for path in sorted(glob.glob(os.path.join(NG.RECEIPTS, LIVE_READS))):
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

    def posted_runs(self, skip: tuple = ()) -> dict:
        import inspect
        fn = self.prior.posted_runs
        got = fn(skip) if "skip" in inspect.signature(fn).parameters else fn()
        out = {k: list(v) for k, v in got.items()}
        for k, rows in self.live_read().items():
            out.setdefault(k, []).extend(rows)
        return out

    def on_live_run(self, filed: dict, skip: tuple = ()) -> bool:
        rows = self.posted_runs(skip).get(str(filed.get("control_number"))) or []
        return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


class Pile(B7.Pile):
    """S740's Pile with the own_lines form of the own-page guard."""

    def own(self, filed: dict, e: dict) -> str | None:
        got = super().own(filed, e)
        if got:
            return got
        return "own_lines" if self.own_lines(filed, e) else None

    def own_lines(self, filed: dict, e: dict) -> bool:
        o = e.get("own_lines")
        if not o:
            return False
        plan = os.path.join(ROOT, str(o.get("plan") or ""))
        try:
            with open(plan, encoding="utf-8") as fh:
                read = json.load(fh)
        except (OSError, ValueError):
            return False
        urls = {str(p.get("url")) for p in read.get("pages") or []}
        src = str(filed.get("source_url") or "")
        if not str(o.get("run") or "").isdigit() or src.split("#")[0] not in urls \
                or not src.endswith("#page=%s" % o.get("page")):
            return False
        # The quoted lines are committed in the page read's own plan file, under the run and the page they were
        # read from (_quoted), and the entry's are those (S741's second reader, MINOR: the guard trusts the quote,
        # so the quote sits where the read is).
        quoted = ((read.get("_quoted") or {}).get(str(o.get("run"))) or {}).get(str(o.get("page"))) or {}
        if any(not o.get(k) or quoted.get(k) != o.get(k) for k in ("opens", "closes", "next")):
            return False
        title = set(B._words(filed.get("title")))
        kind = B.award_kind(filed.get("award"))
        heading = str(((filed.get("record") or {}).get("program") or {}).get("section_heading") or "")
        closes, opens = str(o.get("closes") or ""), str(o.get("opens") or "")
        if not title or kind is None or not o.get("next"):
            return False
        if not (title <= set(B._words(heading)) and kind in B.kinds_named(heading)):
            return False
        if not (title <= set(B._words(closes)) and kind in B.kinds_named(closes) and title <= set(B._words(opens))):
            return False
        stated = ((filed.get("score") or {}).get("arithmetic") or {}).get("stated")
        if not any(re.search(r"(?<![\d.])%s(?![\d.])" % re.escape(p), closes) for p in printed_range(stated)):
            return False
        for m in self.shared_with(str(filed.get("control_number"))):
            g = self.load(m)
            if g is None:
                continue
            theirs = set(B._words(g.get("title")))
            if theirs == title:
                if B.award_kind(g.get("award")) in (None, kind) or B.award_kind(g.get("award")) in B.kinds_named(closes):
                    return False
            elif theirs <= set(B._words(closes)):
                return False
        return True

    def receipt_path(self, day: str, tag: str | None = None) -> str:
        return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s741_%s_%s_%s.json"
                            % (self.slug, day, tag or self.tag))
