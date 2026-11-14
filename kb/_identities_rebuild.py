#!/usr/bin/env python3
"""Articulation identities map — rebuild every articulated M-ID's ENTRY from the
current catalog by the 1b entry rule. DRY RUN by default; --apply writes
kb/coci_articulations.json's `identities` and a receipt; --undo restores it.

kb/coci_articulations.json carries an `identities` map beside its articulation
records. The export's rollup (excel_to_dashboard.articulation_rollup, called by
export_unified_courses) builds every row's adopter and potential college lists
from it: for each member id it reads `identities[member]`, and a member with no
entry contributes nothing, neither its earning colleges nor the colleges that
teach it. A curator's merge_into folds a member's records into its target's
row, so a merged-away member with no entry never reaches its target (FIRE
M1274 into FIRE 130 X, 2026-11-13: the lists stayed 5 and 6).

The entries were last derived in May by the 1b entry rule
(kb/_remint_apply_articulations.py: catalog metadata, and colleges_offering =
the colleges of the id's control-number membership). Every later re-mint moved
the records' course_id and re-keyed only some entries, so the map now has
articulated ids with no entry, entries whose offering or title no longer
matches the id, and M-ID entries on ids no record names, whose title belongs
to another course (pre-fold keys that collide with a current id, so a liveness
test reads them as live).

An M-ID entry is purely a function of the catalog, so it is regenerated, never
re-keyed: the records' course_id is the authority for which ids need one. What
this builder does NOT recompute: the records' own `adoption_leverage`,
`adoption_leverage_count`, `over_merged` and `identity_confidence` (1b
recomputed those too). They feed public figures, so they wait for a measured
follow-up. Also not covered: a merge member with no articulation record gets
no entry (for example FIRE M10CH at Mt. San Jacinto), so its college never
reaches its target's potential list.

The plan, per id, branching on the records' identity_system first:

  fill          an articulated M-ID live in the catalog with no entry: add it
  refresh       an articulated live M-ID whose entry differs from the rule:
                replace it in place (a re-key stamp is kept, or moved to
                _superseded_rekeyed_from when the title differs in substance)
  same          an articulated live M-ID whose entry already matches
  keep_cid      a C-ID/CCN entry: untouched
  cid_no_entry  a C-ID/CCN record id with no entry: listed, nothing written
  null_key      a record whose course_id is the literal "NULL": flagged
  no_record     an M-ID record id in no catalog: listed, nothing written
  orphan        an M-ID entry no record names: HELD. Dropping one is a delete,
                so it needs --drop-orphans with a ruling, after the dry run's
                orphan_worklist.json (Sam's ruling 5, 2026-09-05)

Usage (from repo root):
  python3 kb/_identities_rebuild.py [--rows]          # dry run -> kb/identities_rebuild_out/<date>/
  python3 kb/_identities_rebuild.py --apply --expect-plan kb/identities_rebuild_out/<date>/plan.json
  python3 kb/_identities_rebuild.py --apply --expect-plan <plan> --drop-orphans --ruling "<who, when: what>"
  python3 kb/_identities_rebuild.py --undo kb/identities_rebuild_out/<date>/apply_receipt.json
  python3 kb/_identities_rebuild.py --check           # exit 1 when an articulated live M-ID has no entry
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, ROOT)
from _authority_recode_apply import _atomic_dump, _trailing_nl  # noqa: E402

KB = os.environ.get("IDENTITIES_REBUILD_KB") or HERE
OUT_DIR = os.environ.get("IDENTITIES_REBUILD_OUT") or os.path.join(HERE, "identities_rebuild_out")
OVER_MERGE_SPREAD = 8  # the 1b entry rule and the seed's (subject_spread >= 8 is over-merged)
REKEY_STAMP = "_identities_rekeyed_from"
SUPERSEDED_STAMP = "_superseded_rekeyed_from"
REBUILT_STAMP = "_identities_rebuilt_at"
STAMPS = (REKEY_STAMP, SUPERSEDED_STAMP, REBUILT_STAMP)
ERA = "_identities_rebuilt"
GENERATED_BY = "kb/_identities_rebuild.py"
RULE = ("the 1b entry rule (kb/_remint_apply_articulations.py) on the current catalog, for every articulated "
        "M-ID; C-ID/CCN entries pass through; M-ID entries no record names are held for a ruling. Not "
        "recomputed: the records' adoption_leverage, adoption_leverage_count, over_merged and "
        "identity_confidence. Not covered: a merge member with no articulation record gets no entry, so its "
        "college never reaches its target's potential list")


def _load(name):
    with open(os.path.join(KB, name), encoding="utf-8") as f:
        return json.load(f)


ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6", "vii": "7", "viii": "8",
         "ix": "9", "x": "10"}


def _nt(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def _fold(t):
    """Case, punctuation and Roman/Arabic numerals folded: 'Academy I' == 'academy 1'."""
    return " ".join(ROMAN.get(w, w) for w in _nt(t).split())


def title_differs_in_substance(a, b):
    return _fold(a) != _fold(b)


def derive_entry(cid, cat, sg, mem):
    """The 1b entry rule (kb/_remint_apply_articulations.py new_meta + offering),
    on the current catalog. None when the id is in neither M-ID catalog."""
    r = cat.get(cid)
    single = r is None
    if single:
        r = sg.get(cid)
    if r is None:
        return None
    if single:
        offering = {r["college"]} if r.get("college") else set()
    else:
        offering = {m["college"] for m in mem.get(cid, []) if m.get("college")}
    spread = r.get("subject_spread", 1) or 1
    off = sorted(offering)
    return {
        "identity_system": "M-ID",
        "title": r.get("common_title"),
        "discipline": r.get("discipline"),
        "confidence": r.get("confidence"),
        "subject_spread": r.get("subject_spread", 1),
        "over_merged": spread >= OVER_MERGE_SPREAD,
        "is_singleton": single,
        "credit_status": r.get("credit_status"),
        "credit_status_mixed": bool(r.get("credit_status_mixed")),
        "top_code_mixed": bool(r.get("top_code_mixed")),
        "noncredit_category_mixed": bool(r.get("noncredit_category_mixed")),
        "colleges_offering": off,
        "colleges_offering_count": len(off),
    }


def _bare(e):
    return {k: v for k, v in (e or {}).items() if k not in STAMPS}


def _record_systems(records):
    out = defaultdict(set)
    for r in records:
        if r.get("course_id"):
            out[r["course_id"]].add(r.get("identity_system") or "")
    return out


def _mid_branch(cid, systems, identities):
    """True when the id takes the M-ID rule: a record says M-ID and no C-ID/CCN entry holds it."""
    cur = identities.get(cid)
    if cur is not None and cur.get("identity_system") != "M-ID":
        return False
    return "M-ID" in systems.get(cid, set())


def refresh_why(cur, new):
    cur = _bare(cur)
    if title_differs_in_substance(cur.get("title"), new.get("title")):
        return "title differs in substance"
    if (cur.get("title") or "") != (new.get("title") or ""):
        return "title differs only by numerals, case or punctuation"
    if set(cur.get("colleges_offering") or []) != set(new["colleges_offering"]):
        return "offering differs from the membership"
    return "metadata only"


def compute_plan(identities, records, cat, sg, mem):
    """Pure. Returns the per-id dispositions and the entries to write."""
    systems = _record_systems(records)
    art_ids = sorted(systems)
    fill, refresh, why = {}, {}, {}
    same, keep_cid, cid_no_entry, null_key, no_record = [], [], [], [], []
    for cid in art_ids:
        cur = identities.get(cid)
        if cid == "NULL":
            null_key.append(cid)
            continue
        if not _mid_branch(cid, systems, identities):
            (keep_cid if cur is not None else cid_no_entry).append(cid)
            continue
        new = derive_entry(cid, cat, sg, mem)
        if new is None:
            no_record.append(cid)
            continue
        if cur is None:
            fill[cid] = new
        elif _bare(cur) == new:
            same.append(cid)
        else:
            refresh[cid] = new
            why[cid] = refresh_why(cur, new)
    art_set = set(art_ids)
    orphan = sorted(k for k, v in identities.items()
                    if k not in art_set and (v or {}).get("identity_system") == "M-ID")
    cid_unarticulated = sorted(k for k, v in identities.items()
                               if k not in art_set and (v or {}).get("identity_system") != "M-ID")
    return {"fill": fill, "refresh": refresh, "refresh_why": why, "same": same, "keep_cid": keep_cid,
            "cid_no_entry": cid_no_entry, "null_key": null_key, "no_record": no_record,
            "orphan": orphan, "cid_unarticulated": cid_unarticulated,
            "entries_before": len(identities), "articulated_ids": len(art_ids)}


def apply_plan(identities, plan, drop_orphans=False, now=None):
    """Pure. The new identities map, in the map's own key order: refreshes
    replaced in place, orphans dropped only when asked, fills appended in sorted
    order after the existing keys; every other entry is the same object."""
    drops = set(plan["orphan"]) if drop_orphans else set()
    out = {}
    for k, v in identities.items():
        if k in plan["refresh"]:
            e = dict(plan["refresh"][k])
            if REKEY_STAMP in v:
                substance = title_differs_in_substance(v.get("title"), e.get("title"))
                e[SUPERSEDED_STAMP if substance else REKEY_STAMP] = v[REKEY_STAMP]
            elif SUPERSEDED_STAMP in v:
                e[SUPERSEDED_STAMP] = v[SUPERSEDED_STAMP]
            if now:
                e[REBUILT_STAMP] = now
            out[k] = e
        elif k in drops:
            continue
        else:
            out[k] = v
    for k in sorted(plan["fill"]):
        e = dict(plan["fill"][k])
        if now:
            e[REBUILT_STAMP] = now
        out[k] = e
    return out


def missing_entries(identities, records, cat, sg):
    """Articulated M-ID ids live in the catalog with no identities entry: the
    rows whose lists the export's rollup cannot build, and every merged-away
    member that cannot reach its target. Empty is the invariant."""
    systems = _record_systems(records)
    return sorted(k for k in systems if k != "NULL" and k not in identities
                  and _mid_branch(k, systems, identities) and (k in cat or k in sg))


def apply_gates(identities, new_ident, records, cat, sg, mem):
    """The apply's gates. Each is checked by tests/identities_rebuild_test.py
    on a map that breaks it, so removing one fails the test."""
    return {
        "G1 every articulated live M-ID has an entry": not missing_entries(new_ident, records, cat, sg),
        "G2 every C-ID/CCN entry untouched": all(new_ident.get(k) == v for k, v in identities.items()
                                                 if (v or {}).get("identity_system") != "M-ID"),
        "G3 a second plan changes nothing": not (lambda p: p["fill"] or p["refresh"])(
            compute_plan(new_ident, records, cat, sg, mem)),
    }


def flatten(merge_into):
    """The export's own chain flattening (excel_to_dashboard.flatten_merge_chains)."""
    from excel_to_dashboard import flatten_merge_chains
    m = dict(merge_into)
    flatten_merge_chains(m)
    return m


def target_lists(identities, earned, mids):
    """The export's own rollup (excel_to_dashboard.articulation_rollup)."""
    from excel_to_dashboard import articulation_rollup
    return articulation_rollup(identities, earned, mids)


def merge_view(identities, new_ident, records, curation, cat, sg, cid_ref):
    """Per merge target with an articulated member: the lists before and after."""
    mi = flatten({k: v["merge_into"] for k, v in curation.items() if v.get("merge_into")})
    members = defaultdict(list)
    for src, tgt in mi.items():
        members[tgt].append(src)
    earned = defaultdict(set)
    for r in records:
        if r.get("course_id"):
            earned[r["course_id"]].update(r.get("earned_by_colleges") or [])
    rows = {}
    for tgt, mems in members.items():
        if not any(m in earned for m in mems):
            continue
        has_self = tgt in cat or tgt in sg or tgt in cid_ref or tgt in identities
        mids = ([tgt] if has_self else []) + sorted(mems)
        b = target_lists(identities, earned, mids)
        a = target_lists(new_ident, earned, mids)
        rows[tgt] = {"members_articulated": sorted(m for m in mems if m in earned),
                     "members_without_entry_before": sorted(m for m in mems if m in earned and m not in identities),
                     "adopted": [len(b[0]), len(a[0])], "potential": [len(b[1]), len(a[1])]}
    return rows


def public_figures(art, new_ident):
    """The public figures that read the map's over_merged flag, before and after:
    the Fact Sheet's "Could adopt" per sector (fact_sheet_metrics.json) and the
    credentials of statewide_prescriptive.js. Computed by the generator's own
    functions on the planned map."""
    import excel_to_dashboard as e
    after_doc = dict(art)
    after_doc["identities"] = new_ident
    cb, tb = e._statewide_could_adopt_by_sector(art)
    ca, ta = e._statewide_could_adopt_by_sector(after_doc)
    pb = e._build_statewide_prescriptive(art) or {}
    pa = e._build_statewide_prescriptive(after_doc) or {}
    sectors = {s: [cb.get(s, 0), ca.get(s, 0)] for s in sorted(set(cb) | set(ca)) if cb.get(s, 0) != ca.get(s, 0)}
    creds = sorted(u for u in set(pb) | set(pa) if pb.get(u) != pa.get(u))
    return {"could_adopt_total": [tb, ta], "could_adopt_sectors_changed": sectors,
            "prescriptive_credentials_changed": len(creds), "prescriptive_sample": creds[:10]}


# ── rows: the export on the current map and on the planned map ───────────────

_EXPORT = ("import sys, os; sys.path.insert(0, {root!r}); os.chdir({root!r}); "
           "import excel_to_dashboard as e; e.export_unified_courses()")


def _run_exports(docs, td):
    """Run export_unified_courses once on the committed kb ("before") and once
    per planned doc, each on a symlink copy of kb/ holding that doc. Returns
    {tag: output dir}."""
    runs = [("before", KB)]
    for tag, doc in docs.items():
        farm = os.path.join(td, "kb_" + tag)
        os.makedirs(farm)
        for name in os.listdir(KB):
            if name != "coci_articulations.json":
                os.symlink(os.path.join(KB, name), os.path.join(farm, name))
        with open(os.path.join(farm, "coci_articulations.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False)
        runs.append((tag, farm))
    procs = []
    for tag, kdir in runs:
        odir = os.path.join(td, tag)
        os.makedirs(odir)
        env = dict(os.environ, UC_KB_DIR=kdir, UC_OUT_DIR=odir)
        procs.append(subprocess.Popen([sys.executable, "-c", _EXPORT.format(root=ROOT)], env=env,
                                      stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True))
    for p in procs:
        _, err = p.communicate()
        if p.returncode:
            raise RuntimeError("export failed: " + (err or "")[-400:])
    return {tag: os.path.join(td, tag) for tag, _ in runs}


def _browser_rows(odir):
    s = open(os.path.join(odir, "unified_courses_data.js"), encoding="utf-8").read()
    doc = json.loads(s[s.index("=") + 1:].strip().rstrip(";"))
    cols = doc["colleges"]
    return {r["id"]: ({cols[i] for i in r.get("adopted") or []}, {cols[i] for i in r.get("potential") or []})
            for r in doc["rows"]}


def _export_rows(odir):
    from openpyxl import load_workbook
    wb = load_workbook(os.path.join(odir, "exports", "unified_courses.xlsx"), read_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    head = list(next(it))
    ia, ip = head.index("Adopted colleges"), head.index("Adoptable colleges")
    out = {}
    for n, row in enumerate(it):
        sp = lambda v: {x for x in str(v or "").split("; ") if x}
        out[(row[0], row[1], n)] = (sp(row[ia]), sp(row[ip]))
    return out


def _row_delta(before, after):
    c = Counter()
    for k in set(before) & set(after):
        (a1, p1), (a2, p2) = before[k], after[k]
        if (a1, p1) == (a2, p2):
            continue
        c["changed"] += 1
        if a2 - a1:
            c["gain adopters"] += 1
        if a1 - a2:
            c["lose adopters"] += 1
        if p2 - p1:
            c["gain potential"] += 1
        lost = p1 - p2
        if lost:
            c["lose potential"] += 1
            if lost <= a2:
                c["lose potential: every lost college became an adopter"] += 1
            else:
                c["lose potential: a college left the offering (stale offering refreshed)"] += 1
    c["universe"] = len(set(before) & set(after))
    return dict(c)


def orphan_row_impact(kept, dropped):
    """In-browser rows whose lists the held orphan entries move: the planned map
    with them kept against the same map with them dropped. A row with no list
    once they go had no articulation at all."""
    hit = [k for k in set(kept) & set(dropped) if kept[k] != dropped[k]]
    return {"rows": len(hit), "potential_colleges": sum(len(kept[k][1] - dropped[k][1]) for k in hit),
            "rows_with_no_articulation": sum(1 for k in hit if not dropped[k][0] and not dropped[k][1])}


def measure_rows(art, plan, new_ident):
    """(row deltas, orphan impact) from three runs of the export: the committed
    map, the planned map, and the planned map with the orphans dropped."""
    doc, doc_drop = dict(art), dict(art)
    doc["identities"] = new_ident
    doc_drop["identities"] = apply_plan(art.get("identities") or {}, plan, drop_orphans=True)
    with tempfile.TemporaryDirectory() as td:
        o = _run_exports({"after": doc, "after_drop": doc_drop}, td)
        rb, ra = _browser_rows(o["before"]), _browser_rows(o["after"])
        return ({"in_browser": _row_delta(rb, ra),
                 "export": _row_delta(_export_rows(o["before"]), _export_rows(o["after"]))},
                orphan_row_impact(ra, _browser_rows(o["after_drop"])))


# ── the receipt ──────────────────────────────────────────────────────────────

def write_receipt(plan, view, figures, rows, orphan_rows, identities, out, today):
    os.makedirs(out, exist_ok=True)
    changed = {t: v for t, v in view.items() if v["adopted"][0] != v["adopted"][1]
               or v["potential"][0] != v["potential"][1]}
    reached = {t: v for t, v in view.items() if v["members_without_entry_before"]}
    why = Counter(plan["refresh_why"].values())
    flips = Counter()
    for k, new in plan["refresh"].items():
        o = bool(identities[k].get("over_merged"))
        if o != new["over_merged"]:
            flips["true to false" if o else "false to true"] += 1
    fill_over = sum(1 for e in plan["fill"].values() if e["over_merged"])
    counts = {"articulated_ids": plan["articulated_ids"], "entries_before": plan["entries_before"],
              "fill": len(plan["fill"]), "refresh": len(plan["refresh"]),
              "refresh_substantive": why.get("title differs in substance", 0),
              "same": len(plan["same"]), "keep_cid": len(plan["keep_cid"]),
              "cid_no_entry": len(plan["cid_no_entry"]), "null_key": len(plan["null_key"]),
              "no_record": len(plan["no_record"]), "orphan_held": len(plan["orphan"]),
              "cid_unarticulated_kept": len(plan["cid_unarticulated"]),
              "entries_after_apply": plan["entries_before"] + len(plan["fill"]),
              "entries_after_apply_with_drop": plan["entries_before"] + len(plan["fill"]) - len(plan["orphan"]),
              "merge_targets_with_articulated_members": len(view),
              "merge_targets_reached_by_a_member_without_entry": len(reached),
              "merge_targets_whose_lists_change": len(changed)}
    doc = {"_status": f"DRY-RUN {today} — nothing applied", "_generated_by": GENERATED_BY, "_rule": RULE,
           "counts": counts, "refresh_why": dict(why), "over_merged_flips_on_refresh": dict(flips),
           "fills_over_merged": fill_over, "public_figures": figures, "rows": rows,
           "orphan_rows": orphan_rows,
           "fill": sorted(plan["fill"]), "refresh": {k: plan["refresh_why"][k] for k in sorted(plan["refresh"])},
           "orphan": plan["orphan"], "cid_no_entry": plan["cid_no_entry"], "null_key": plan["null_key"],
           "no_record": plan["no_record"], "merge_targets": {t: view[t] for t in sorted(reached)}}
    _atomic_dump(os.path.join(out, "plan.json"), doc, True)
    wl = [{"identity": k, "entry_title": identities[k].get("title"),
           "colleges_offering": len(identities[k].get("colleges_offering") or []),
           "rekeyed_from": identities[k].get(REKEY_STAMP),
           "why": "no articulation record names this id, so the export's rollup reads an entry with nothing to adopt"}
          for k in plan["orphan"]]
    _atomic_dump(os.path.join(out, "orphan_worklist.json"), {
        "_status": f"DRY-RUN {today} — held; nothing dropped", "_generated_by": GENERATED_BY,
        "_rule": "Sam's ruling 5, 2026-09-05: a removed set is a worklist, never a silent drop.",
        "count": len(wl), "rows": wl}, True)

    def rowline(name, d):
        if not d:
            return f"- {name}: not measured (run the dry run with --rows)"
        return (f"- {name}: {d.get('changed', 0):,} of {d['universe']:,} change; gain adopters "
                f"{d.get('gain adopters', 0):,}, lose adopters {d.get('lose adopters', 0):,}, gain potential "
                f"{d.get('gain potential', 0):,}, lose potential {d.get('lose potential', 0):,} (every lost college "
                f"became an adopter {d.get('lose potential: every lost college became an adopter', 0):,}; a college "
                f"left a stale offering {d.get('lose potential: a college left the offering (stale offering refreshed)', 0):,})")

    L = [f"# Identities map rebuild — dry run {today}", "", f"status: DRY-RUN {today}, nothing applied", "",
         f"Rule: {RULE}.", "",
         "## Entries", "",
         f"- articulated ids: {plan['articulated_ids']:,}; entries now: {plan['entries_before']:,}",
         f"- fill {len(plan['fill']):,} · refresh {len(plan['refresh']):,} · same {len(plan['same']):,} · "
         f"C-ID/CCN kept {len(plan['keep_cid']):,}",
         "- refresh, why: " + "; ".join(f"{k} {v:,}" for k, v in why.most_common()),
         f"- C-ID/CCN record ids with no entry: {len(plan['cid_no_entry']):,} ({', '.join(plan['cid_no_entry'][:5])}); "
         f"the literal NULL course_id: {len(plan['null_key'])}; M-ID record ids in no catalog: {len(plan['no_record']):,}",
         f"- orphan M-ID entries held: {len(plan['orphan']):,} (orphan_worklist.json); "
         f"C-ID/CCN entries with no record, kept: {len(plan['cid_unarticulated']):,}",
         f"- entries after --apply: {counts['entries_after_apply']:,}; with --drop-orphans: "
         f"{counts['entries_after_apply_with_drop']:,}", "",
         "## Public figures (the generator's own functions on the planned map)", "",
         "- over_merged flips on refresh: " + ("; ".join(f"{k} {v}" for k, v in sorted(flips.items())) or "none")
         + f"; fills born over-merged: {fill_over}"]
    if figures:
        t = figures["could_adopt_total"]
        L += [f"- Fact Sheet \"Could adopt\" total: {t[0]} to {t[1]}",
              "- by sector: " + ("; ".join(f"{s} {v[0]} to {v[1]}" for s, v in figures["could_adopt_sectors_changed"].items())
                                 or "no change"),
              f"- statewide_prescriptive.js credentials that change: {figures['prescriptive_credentials_changed']}"]
    else:
        L += ["- not measured"]
    L += ["", "## Rows (the export on the current map and on the planned map)", "",
          rowline("in-browser rows (unified_courses_data.js)", (rows or {}).get("in_browser")),
          rowline("export rows (exports/unified_courses.xlsx)", (rows or {}).get("export")),
          "- a row loses potential colleges when a member's earning colleges join its adopters, or when a "
          "refreshed entry's stale offering gives way to the membership",
          ("- the held orphan entries: %s in-browser rows show %s potential colleges from entries that describe "
           "other courses; %s of those rows carry no articulation at all"
           % (f"{orphan_rows['rows']:,}", f"{orphan_rows['potential_colleges']:,}",
              f"{orphan_rows['rows_with_no_articulation']:,}")) if orphan_rows
          else "- orphan entries today: not measured (run with --rows)",
          "", "## Merge targets", "",
          f"- targets with an articulated member: {len(view):,}",
          f"- reached by a member that had no entry: {len(reached):,}",
          f"- whose adopter or potential count changes: {len(changed):,}"]
    if "FIRE 130 X" in view:
        v = view["FIRE 130 X"]
        L.append(f"- FIRE 130 X: adopters {v['adopted'][0]} to {v['adopted'][1]}, potential "
                 f"{v['potential'][0]} to {v['potential'][1]}")
    L += ["", "| target | members without entry before | adopted | potential |", "|---|---|---|---|"]
    for t in sorted(reached, key=lambda t: (-len(reached[t]["members_without_entry_before"]), t))[:30]:
        v = reached[t]
        L.append(f"| `{t}` | {', '.join(v['members_without_entry_before'][:4])} | "
                 f"{v['adopted'][0]} to {v['adopted'][1]} | {v['potential'][0]} to {v['potential'][1]} |")
    L += ["", "## Apply and undo", "",
          "1. `python3 kb/_identities_rebuild.py --apply --expect-plan <this dir>/plan.json` writes the fills and",
          "   refreshes, keeps the orphans, and writes `apply_receipt.json` here with every key's before-value.",
          "   It aborts when the fill, refresh or orphan sets differ from this plan.",
          "2. Commit kb/coci_articulations.json and the receipt in one cron window; the daily run rebuilds the lists.",
          "3. Undo: `python3 kb/_identities_rebuild.py --undo <this dir>/apply_receipt.json`, or revert the commit.",
          "4. `--drop-orphans --ruling \"<who, when: what>\"` also drops the orphans, after this worklist.", ""]
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    return counts, doc


# ── apply and undo ───────────────────────────────────────────────────────────

def do_apply(args, art, art_path, identities, records, cat, sg, mem, plan):
    if not args.expect_plan:
        sys.exit("ABORT: --apply needs --expect-plan <plan.json> from the dry run.")
    if args.drop_orphans and not (args.ruling or "").strip():
        sys.exit("ABORT: --drop-orphans needs --ruling \"<who, when: what>\" (a drop is a delete).")
    expected = json.load(open(args.expect_plan, encoding="utf-8"))
    drift = {name: sorted(set(mine) ^ set(expected.get(name) or []))[:5]
             for name, mine in (("fill", plan["fill"]), ("refresh", plan["refresh"]), ("orphan", plan["orphan"]))
             if set(mine) != set(expected.get(name) or [])}
    if drift:
        sys.exit(f"ABORT: the plan moved since {args.expect_plan}: {drift} — re-run the dry run.")
    receipt_path = os.path.join(os.path.dirname(os.path.abspath(args.expect_plan)), "apply_receipt.json")
    if os.path.exists(receipt_path) and not json.load(open(receipt_path)).get("_undone_at"):
        sys.exit(f"ABORT: {receipt_path} records an apply not undone; never twice.")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    new_ident = apply_plan(identities, plan, drop_orphans=args.drop_orphans, now=now)
    gates = apply_gates(identities, new_ident, records, cat, sg, mem)
    for g, ok in gates.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {g}")
    if not all(gates.values()):
        sys.exit("gate failure — nothing written")
    entries = {}
    for k in sorted(plan["fill"]):
        entries[k] = {"action": "fill", "before": None, "after": new_ident[k]}
    for k in sorted(plan["refresh"]):
        entries[k] = {"action": "refresh", "before": identities[k], "after": new_ident[k]}
    if args.drop_orphans:
        for k in plan["orphan"]:
            entries[k] = {"action": "drop", "before": identities[k], "after": None}
    era = {"at": now, "plan": os.path.relpath(os.path.abspath(args.expect_plan), ROOT),
           "fill": len(plan["fill"]), "refresh": len(plan["refresh"]),
           "orphans_dropped": len(plan["orphan"]) if args.drop_orphans else 0}
    if args.ruling:
        era["ruling"] = args.ruling.strip()
    _atomic_dump(receipt_path, {"_status": f"APPLIED {now}", "_generated_by": GENERATED_BY, "_rule": RULE,
                                "applied_at": now, "era": era, "key_order_before": list(identities),
                                "entries": entries}, True)
    art["identities"] = new_ident
    art.setdefault(ERA, []).append(era)
    _atomic_dump(art_path, art, _trailing_nl(art_path))
    print(f"APPLIED: fill {len(plan['fill']):,} · refresh {len(plan['refresh']):,} · orphans "
          f"{'dropped' if args.drop_orphans else 'kept'} {len(plan['orphan']):,} · receipt {receipt_path}")
    return 0


def undo_map(identities, receipt):
    """Pure. The identities map the receipt's apply started from; raises
    ValueError when a key changed since the apply (the undo would discard it)."""
    entries = receipt["entries"]
    for k, e in entries.items():
        if identities.get(k) != e["after"]:
            raise ValueError(f"{k} changed since the apply")
    extra = [k for k in identities if k not in receipt["key_order_before"] and k not in entries]
    if extra:
        raise ValueError(f"keys added since the apply: {extra[:5]}")
    out = {}
    for k in receipt["key_order_before"]:
        out[k] = entries[k]["before"] if k in entries else identities[k]
    return out


def do_undo(path, art, art_path):
    receipt = json.load(open(path, encoding="utf-8"))
    if receipt.get("_undone_at"):
        sys.exit("ABORT: this receipt is already undone.")
    try:
        restored = undo_map(art.get("identities") or {}, receipt)
    except ValueError as err:
        sys.exit(f"ABORT: {err}")
    art["identities"] = restored
    era = [e for e in art.get(ERA, []) if e.get("at") != receipt["applied_at"]]
    if era:
        art[ERA] = era
    else:
        art.pop(ERA, None)
    _atomic_dump(art_path, art, _trailing_nl(art_path))
    receipt["_undone_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    _atomic_dump(path, receipt, True)
    print(f"UNDONE: {len(receipt['entries']):,} keys restored from {path}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--expect-plan")
    ap.add_argument("--drop-orphans", action="store_true")
    ap.add_argument("--ruling")
    ap.add_argument("--undo")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--rows", action="store_true", help="dry run: also run the export twice and count changed rows")
    ap.add_argument("--out")
    args = ap.parse_args()
    if args.drop_orphans and not args.apply:
        sys.exit("ABORT: --drop-orphans only goes with --apply.")
    today = date.today().isoformat()
    art_path = os.path.join(KB, "coci_articulations.json")
    art = _load("coci_articulations.json")
    if args.undo:
        return do_undo(args.undo, art, art_path)
    identities = art.get("identities") or {}
    records = art.get("articulations") or []
    cat = _load("coci_minted_courses.json")["courses"]
    sg = _load("coci_minted_singletons.json")["courses"]
    if args.check:
        miss = missing_entries(identities, records, cat, sg)
        print(f"articulated live M-IDs with no identities entry: {len(miss)}"
              + (f" (sample {miss[:5]})" if miss else ""))
        return 1 if miss else 0
    mem = _load("coci_minted_memberships.json")["memberships"]
    plan = compute_plan(identities, records, cat, sg, mem)
    subst = sum(1 for w in plan["refresh_why"].values() if w == "title differs in substance")
    print(f"articulated {plan['articulated_ids']:,} · entries {plan['entries_before']:,} · fill {len(plan['fill']):,} · "
          f"refresh {len(plan['refresh']):,} (substantive {subst:,}) · same {len(plan['same']):,} · C-ID kept "
          f"{len(plan['keep_cid']):,} · C-ID no entry {len(plan['cid_no_entry']):,} · NULL {len(plan['null_key'])} · "
          f"no record {len(plan['no_record']):,} · orphans held {len(plan['orphan']):,}")
    if args.apply:
        return do_apply(args, art, art_path, identities, records, cat, sg, mem, plan)
    curation = _load("coci_curation.json").get("curations", {})
    cid_ref = _load(os.path.join("reference", "coci_courses.json"))["courses"]
    new_ident = apply_plan(identities, plan)
    view = merge_view(identities, new_ident, records, curation, cat, sg, cid_ref)
    figures = public_figures(art, new_ident)
    t = figures["could_adopt_total"]
    print(f"Fact Sheet could-adopt total {t[0]} to {t[1]}; sectors "
          + ("; ".join(f"{s} {v[0]} to {v[1]}" for s, v in figures["could_adopt_sectors_changed"].items()) or "unchanged")
          + f"; statewide_prescriptive credentials changed {figures['prescriptive_credentials_changed']}")
    rows = orphan_rows = None
    if args.rows:
        rows, orphan_rows = measure_rows(art, plan, new_ident)
        print("rows: in-browser " + json.dumps(rows["in_browser"]) + " · export " + json.dumps(rows["export"])
              + " · orphan rows " + json.dumps(orphan_rows))
    out = args.out or os.path.join(OUT_DIR, today)
    counts, _ = write_receipt(plan, view, figures, rows, orphan_rows, identities, out, today)
    print(f"DRY RUN — receipt → {os.path.relpath(out, ROOT)}/ · merge targets reached "
          f"{counts['merge_targets_reached_by_a_member_without_entry']:,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
