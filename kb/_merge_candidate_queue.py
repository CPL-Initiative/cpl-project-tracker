#!/usr/bin/env python3
"""Merge candidates for a faculty reviewer — a QUEUE, never a write.

Sam's ruling 6 (2026-09-05): queue WELD M1109 (24 colleges) · M1106 (2) · M10VQ
(1) as merge candidates with M1109 surviving, the identical-titled SMAW pair
behind them — and ⚠️ **the merge itself waits for a faculty reviewer, because
sufficiency is a curriculum judgment.**

So this is deliberately NOT kb/_auto_merge_worklist.py. That one plans
`merge_into` rows; this one plans nothing. It assembles the evidence a reviewer
needs to make the call and stops: who teaches each member, how many
articulations each carries, what band and credit status it sits in, which member
would survive and why. Nothing here reaches Supabase, and nothing here is an
apply gate — a reviewer reads the report and acts in the curation UI.

Two lanes, and the second is the general form of the first:

  seeded    — a group a human named (Sam's intro-welding trio). Recorded WITH
              its attribution, because a curator's judgment is a first-class
              input and must not be laundered into an anonymous value.
  same_title — identities in one discipline whose normalized titles are
              identical. Mechanical, reproducible, and the lane the SMAW pair
              falls out of.

⚠️ BANDS NEVER CROSS. An M-shaped id's band digit separates credit (1xxx) from
noncredit (9xxx); those are different courses for funding and for the student,
so a cross-band pair is surfaced FLAGGED rather than proposed. "Advanced Welding
Applications" is exactly this case: WELD M1009 (credit) and WELD M90AI
(noncredit) share a title and must not be merged on it.

⚠️ THE SURVIVOR IS A PROPOSAL, NOT A RANKING. Most-adopted usually survives, but
articulation runs OPPOSITE to adoption in this corpus (Session 232), so the
report prints BOTH counts and says which rule picked the survivor. A reviewer
who disagrees has the number they need in front of them.

Usage (from repo root):
  python3 kb/_merge_candidate_queue.py --discipline Welding
  python3 kb/_merge_candidate_queue.py --discipline Welding --out kb/merge_candidates/<date>
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(HERE, "merge_candidates")

# Sam named this group on the decision sheet; it is recorded as HIS, with the
# date, rather than presented as something the rule found.
SEEDED = [{
    "discipline": "Welding",
    "members": ["WELD M1109", "WELD M1106", "WELD M10VQ"],
    "survivor": "WELD M1109",
    "why": "the three intro-welding identities say the same thing three ways",
    "source": "Sam, 2026-09-05, decision sheet 2026-09-05-ten-open-rulings item 6",
}]

BAND_RE = re.compile(r"^[A-Z]{2,4} M(\d)")


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def norm(t):
    """Title down to what a merge would treat as 'the same words'."""
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def band(i):
    m = BAND_RE.match(i or "")
    return m.group(1) if m else None


def corpus():
    rows = {}
    for r in load_js("unified_courses_data.js")["rows"]:
        rows.setdefault(r["id"], r)
    for r in load_js("unified_courses_standalone.js")["rows"]:
        rows.setdefault(r["id"], r)
    arts = Counter()
    try:
        with open(os.path.join(HERE, "coci_articulations.json"), encoding="utf-8") as fh:
            for rec in (json.load(fh).get("articulations") or []):
                if rec.get("course_id"):
                    arts[rec["course_id"]] += 1
    except (OSError, ValueError):
        pass
    return rows, arts


def member(i, rows, arts):
    r = rows.get(i) or {}
    return {"id": i, "title": r.get("title"), "kind": r.get("kind"),
            "discipline": r.get("disc"), "colleges": int(r.get("members") or 0),
            "articulations": arts.get(i, 0), "credit": r.get("credit"),
            "band": band(i), "in_catalog": bool(r)}


def pick_survivor(ms):
    """Most colleges, then most articulations, then the lowest id — and SAY which
    rule decided, because a tie broken alphabetically is not evidence."""
    ordered = sorted(ms, key=lambda m: (-m["colleges"], -m["articulations"], m["id"]))
    win, run = ordered[0], ordered[1]
    basis = ("taught at more colleges" if win["colleges"] > run["colleges"]
             else "more articulations" if win["articulations"] > run["articulations"]
             else "alphabetically first (nothing else separates them)")
    return win, basis


def group_of(members, rows, arts, lane, why, source=None, survivor=None):
    ms = [member(i, rows, arts) for i in members]
    live = [m for m in ms if m["in_catalog"]]
    flags = []
    bands = {m["band"] for m in live if m["band"]}
    if len(bands) > 1:
        flags.append("bands cross (credit 1xxx vs noncredit 9xxx) — not mergeable on a title")
    discs = {m["discipline"] for m in live if m["discipline"]}
    if len(discs) > 1:
        flags.append("members sit in different disciplines: " + ", ".join(sorted(discs)))
    if len(live) < len(ms):
        flags.append("not in the catalog: " + ", ".join(m["id"] for m in ms if not m["in_catalog"]))
    basis = "named by a human"
    if survivor is None and len(live) >= 2:
        win, basis = pick_survivor(live)
        survivor = win["id"]
    return {"lane": lane, "members": ms, "survivor": survivor,
            "survivor_basis": basis, "why": why, "source": source,
            "flags": flags, "proposable": not flags and len(live) >= 2,
            "colleges_total": sum(m["colleges"] for m in live),
            "articulations_total": sum(m["articulations"] for m in live)}


def build(discipline, rows, arts):
    out, seen = [], set()
    for g in SEEDED:
        if discipline and g["discipline"] != discipline:
            continue
        out.append(group_of(g["members"], rows, arts, "seeded", g["why"],
                            g["source"], g["survivor"]))
        seen.update(g["members"])
    by_title = defaultdict(list)
    for i, r in rows.items():
        if discipline and r.get("disc") != discipline:
            continue
        by_title[norm(r.get("title"))].append(i)
    for t, ids in sorted(by_title.items()):
        if len(ids) < 2 or not t or any(i in seen for i in ids):
            continue
        out.append(group_of(sorted(ids), rows, arts, "same_title",
                            "identical titles once normalized"))
    # Seeded first (a human asked for those), then by how much is at stake.
    out.sort(key=lambda g: (0 if g["lane"] == "seeded" else 1,
                            -g["colleges_total"], -g["articulations_total"]))
    return out


def report(groups, discipline, today):
    L = [f"# Merge candidates — {discipline or 'all disciplines'} ({today})", "",
         "**A queue for a faculty reviewer, not a plan.** Nothing here writes a",
         "`merge_into` row, and nothing here is an apply gate: whether two courses",
         "are close enough to be one is a curriculum judgment (Sam, 2026-09-05,",
         "ruling 6). Read the evidence, then act in the curation UI.", "",
         "⚠️ **Articulation runs opposite to adoption in this corpus**, so the",
         "survivor rule (most colleges) is a proposal and both counts are printed.",
         "", f"{len(groups)} group(s); "
         f"{sum(1 for g in groups if g['proposable'])} with nothing blocking them.", ""]
    for n, g in enumerate(groups, 1):
        L += [f"## {n}. {g['survivor'] or '(no survivor proposed)'} — {g['lane']}", "",
              f"{g['why']}." + (f" Named by: {g['source']}." if g.get("source") else ""), ""]
        if g["flags"]:
            L += ["> ⚠️ " + f for f in g["flags"]] + [""]
        L += ["| identity | title | kind | colleges | articulations | credit | band |",
              "|---|---|---|---|---|---|---|"]
        for m in g["members"]:
            mark = " ⭐" if m["id"] == g["survivor"] else ""
            L.append(f"| `{m['id']}`{mark} | {m['title'] or '—'} | {m['kind'] or '—'} | "
                     f"{m['colleges']} | {m['articulations']} | {m['credit'] or '—'} | "
                     f"{m['band'] or '—'} |")
        L += ["", f"Proposed survivor: **{g['survivor'] or '—'}** — {g['survivor_basis']}.", ""]
    L += ["## What a reviewer does", "",
          "1. Read each group's titles side by side. The question is *sufficiency*,",
          "   not equivalence: would you want a student who has one to sit through",
          "   the other?", "2. Merge in the curation UI, which writes the",
          "   `merge_into` rows. This file writes none.",
          "3. A group flagged above is not merely unproposed — it is one the rule",
          "   says NOT to merge on a title alone.", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--discipline", default="Welding")
    ap.add_argument("--out")
    args = ap.parse_args()
    today = date.today().isoformat()
    rows, arts = corpus()
    groups = build(args.discipline, rows, arts)
    out = args.out or os.path.join(OUT_DIR, today)
    os.makedirs(out, exist_ok=True)
    doc = {"_status": f"QUEUE {today} — candidates for a faculty reviewer. NOTHING APPLIED.",
           "_generated_by": "kb/_merge_candidate_queue.py",
           "_rule": ("Sam's ruling 6, 2026-09-05: queue the candidates; the merge waits "
                     "for a faculty reviewer, because sufficiency is a curriculum judgment."),
           "_writes": "none — this tool never touches kb_curation or any live table",
           "discipline": args.discipline, "count": len(groups), "groups": groups}
    with open(os.path.join(out, "queue.json"), "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False); fh.write("\n")
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as fh:
        fh.write(report(groups, args.discipline, today))
    prop = sum(1 for g in groups if g["proposable"])
    print(f"{args.discipline}: {len(groups)} candidate group(s), {prop} unflagged "
          f"→ {os.path.relpath(out, ROOT)}/")
    for g in groups:
        print(f"  [{g['lane']:10s}] {g['survivor'] or '—':12s} <- "
              + ", ".join(m["id"] for m in g["members"] if m["id"] != g["survivor"])
              + ("   ⚠️ " + "; ".join(g["flags"]) if g["flags"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
