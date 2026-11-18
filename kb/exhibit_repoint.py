#!/usr/bin/env python3
"""exhibit_repoint.py — the pair re-point: move one (MAP exhibit id + local title) pair to another canonical title.

COBIx's item 6 on issue #3464 (S678), under Sam's framing of 2026-11-17: *"These are local exhibit titles, right? I
don't change those, just canonicalized titles they sit under."* The reviewed rename apply (kb/_cred_rename_apply.py)
re-keys whole credentials: every raw that points at an old name moves, and every articulation with that name is
re-issued. A Split (graded versus cert-based) and the American River CTCNC modules need the opposite grain: one
exhibit's link moves and its neighbors stay. One key covers both: the pair (MAP exhibit id + local title).

What a pair row does, and never does:
  * changes only that pair's canonical title, and re-issues only that pair's articulations;
  * never edits a local title (a kb/unified_titles.json key stays byte for byte), never renames the current canonical
    (its kb/credentials.json key stays), never moves another pair that shares the exhibit id or the local title;
  * never applies a tap-only row (a Sam-curated canonical): those wait for his tap and are listed, never applied;
  * creates a kb/credentials.json key when the target does not exist yet (a new graded canonical), and never writes the
    source canonical onto the target as an alias.

Where the link lives. kb/unified_titles.json is keyed by local title, one canonical per title. When every exhibit
that carries a local title moves to the same target, the row rewrites that title's `unified_title` value (the
"title" grain). When the title is shared with an exhibit that stays, the move is written to the title's
`exhibit_unified_titles` map, {exhibit id: canonical} (the "exhibit" grain). The dashboard's identity lookup
(excel_to_dashboard.py, _classify_exhibit) reads the title alone today, so an exhibit-grain row is HELD unless the
apply is run with --with-exhibit-grain; it waits on that reader.

Rollback: every apply writes kb/cred_rename_out/<date>-pairs[-N]/pair_undo.json with the before-value of every entry
it changed; undo_pairs() (python3 kb/_cred_rename_apply.py --undo-pairs <folder>) puts each back and refuses any value
changed since. With --force it leaves each local title that holds a changed value whole (its link and its
articulations, so the two stay in step) and any created canonical that changed or is still named, restores the rest,
and lists what it left in pair_undo_skipped.json.

Readers: kb/_build_exhibit_repoint_list.py (writes the list), kb/_cred_rename_apply.py --pairs (applies it).
"""
from __future__ import annotations

import copy
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import exhibit_paths  # noqa: E402

LIST_PATH = os.path.join(HERE, "exhibit_repoint_list.json")
COHORT = "exhibit-repoint-s678@bot"
CONFIRM_TO = 0.8  # a confirm-as-is row lifts confidence_title to at least the review threshold

# Sam's reviewer identities in the committed records (credentials.json, the kb_curation overlay, unified_titles.json).
SAM_IDS = {"slee@cccco.edu", "samueltlee"}

GRADED_TYPES = {"Credit By Exam", "Portfolio Review"}
CERT_TYPES = {"Industry Certification", "Standardized Assessment", "Military", "Other"}
PATH_GROUP = {"cx": "graded", "pr": "graded", "ic": "cert", "sa": "cert", "other": "cert"}
PATH_TYPE = {"cx": "Credit By Exam", "pr": "Portfolio Review", "ic": "Industry Certification",
             "sa": "Standardized Assessment", "other": "Other"}

APPLIED_ACTIONS = {"repoint", "assign", "confirm"}


def group_of(cpl_type):
    """graded for Credit By Exam and Portfolio Review; cert for the cert-based four; "" when unknown."""
    if cpl_type in GRADED_TYPES:
        return "graded"
    if cpl_type in CERT_TYPES:
        return "cert"
    return ""


def exhibit_type(exhibit_id, official_types):
    """One exhibit's CPL type: MAP's cpl_type_description, unless that is Other and the id's path is a clear
    non-Other path (COBIx's rule on the 49). Else the path read from the id (kb/exhibit_paths.py)."""
    off = sorted(official_types or ())
    path = exhibit_paths.path_of(exhibit_id)
    if len(off) == 1:
        if off[0] == "Other" and path and path != "other":
            return PATH_TYPE[path], "path"
        return off[0], "official"
    if path:
        return PATH_TYPE[path], "path"
    return "", ""


def norm(s):
    return " ".join((s or "").split())


# ── the index: who carries which local title ──────────────────────────────────────────────────────────────────────

def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def map_exhibits(path):
    """(exhibit id, local title, CPL type) from a MAP Custom Report snapshot (CustomReport_latest.json, the runner's
    copy; never committed). [] when the file is absent."""
    doc = load_json(path) if path else None
    if not doc:
        return []
    reports = doc.get("reports", doc) if isinstance(doc, dict) else doc
    out = []
    for r in reports:
        if r.get("viewName") != "View_ArticulatedMAPExhibits_APIDataset":
            continue
        cm = {c: i for i, c in enumerate(r.get("columnName", []))}
        i_id, i_t, i_ty = cm.get("ExhibitID"), cm.get("Exhibit Title"), cm.get("CPL Type Description")
        if i_id is None or i_t is None:
            continue
        for row in r.get("columnValue", []):
            out.append((str(row[i_id] or "").strip(), str(row[i_t] or ""),
                        str(row[i_ty] or "").strip() if i_ty is not None else ""))
    return out


class Index:
    """Pairs and types from the committed records (and MAP's snapshot when the runner has one)."""

    def __init__(self, ut, creds, arts, overlay=None, map_rows=None):
        self.ut, self.creds, self.arts = ut, creds, arts
        self.overlay = overlay or {}
        self.key_of = {}  # stripped title -> unified_titles key
        for k in ut:
            self.key_of.setdefault(k, k)
            self.key_of.setdefault(k.strip(), k)
        self.official = defaultdict(set)
        self.ids_of = defaultdict(set)  # unified_titles key -> exhibit ids that carry it
        self.arts_of = defaultdict(list)  # exhibit id -> articulation records
        for k, r in ut.items():
            for e in (r or {}).get("source_exhibit_ids") or []:
                self.ids_of[k].add(e)
        for a in arts:
            e = a.get("exhibit_id")
            self.arts_of[e].append(a)
            if a.get("cpl_type_description"):
                self.official[e].add(a["cpl_type_description"])
            k = self.key_of.get(a.get("exhibit_title") or "") or self.key_of.get((a.get("exhibit_title") or "").strip())
            if k:
                self.ids_of[k].add(e)
        for e, t, ty in map_rows or []:
            if ty:
                self.official[e].add(ty)
            k = self.key_of.get(t) or self.key_of.get(t.strip())
            if k and e:
                self.ids_of[k].add(e)
        self.titles_of_canon = defaultdict(list)
        for k, r in ut.items():
            self.titles_of_canon[(r or {}).get("unified_title")].append(k)

    def type_of(self, e):
        return exhibit_type(e, self.official.get(e))

    def pair_canonical(self, key, e):
        r = self.ut.get(key) or {}
        return (r.get("exhibit_unified_titles") or {}).get(e) or r.get("unified_title")

    def sam_curated(self, canon):
        """Sam's reviewer identity on any credentials.json record, on the overlay (reviewed_by or a field_reviews
        stamp), or on any local title under the canonical."""
        for rec in self.creds.get(canon) or []:
            if (rec or {}).get("reviewed_by") in SAM_IDS:
                return True
        ov = self.overlay.get(canon) or {}
        if ov.get("reviewed_by") in SAM_IDS or any((v or {}).get("by") in SAM_IDS
                                                   for v in (ov.get("field_reviews") or {}).values()):
            return True
        return any((self.ut.get(k) or {}).get("reviewed_by") in SAM_IDS for k in self.titles_of_canon.get(canon, []))


# ── apply ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def _row_key(row):
    return (row["exhibit_id"], row["local_title"])


def plan(rows, ut, creds, arts, with_exhibit_grain=False):
    """Decide each applicable row's grain, or why it is held. Pure: reads, never writes.

    Holds first, grain after (COBIx on #3472, S679): a title-grain rewrite moves every exhibit that reads the title,
    so a row takes it only when every other exhibit on the title moves to the same target in this same apply."""
    idx = Index(ut, creds, arts)
    live = [r for r in rows if r.get("action") in APPLIED_ACTIONS]
    seen, dupes = set(), set()
    for r in live:
        k = _row_key(r)
        if k in seen:
            dupes.add(k)
        seen.add(k)
    # Pass 1: every hold that does not depend on what the other rows do.
    decided = []
    for r in live:
        k = _row_key(r)
        held = None
        key = idx.key_of.get(r["local_title"]) or idx.key_of.get(r["local_title"].strip())
        grain = ""
        if k in dupes:
            held = "the pair is on the list twice"
        elif r["action"] == "assign":
            if key:
                held = "the local title already has a canonical (assign is for an unclassified title)"
            elif r.get("to") is None:
                held = "no target"
            else:
                grain = "new-title"
        elif not key:
            held = "local title not in kb/unified_titles.json"
        else:
            now = idx.pair_canonical(key, r["exhibit_id"])
            if now != r.get("from"):
                held = "drift: the pair now sits under %r, not %r" % (now, r.get("from"))
            elif r["action"] == "confirm":
                grain = "title"
            elif (r.get("target_sam_curated") or (r.get("to") in creds and idx.sam_curated(r["to"]))) \
                    and not r.get("allow_sam_target"):
                held = "target is Sam-curated; a bot row never lands on it unless its rule allows"
            elif r["exhibit_id"] not in idx.ids_of.get(key, set()):
                held = "exhibit id not seen on this local title"
            elif r.get("to") == r.get("from"):
                held = "target is the current canonical"
        decided.append([r, key, grain, held])
    # Pass 2: each repoint's grain, from the rows that really move. A held row stays where it is, so it never counts
    # as moving; holding a row can turn a sibling from title grain to exhibit grain (held too, without
    # --with-exhibit-grain), so the pass repeats until no new hold appears. Holds only grow, so it ends.
    while True:
        moving = defaultdict(dict)  # title key -> {exhibit id: target}, held rows left out
        for r, key, _grain, held in decided:
            if r["action"] == "repoint" and not held:
                moving[key][r["exhibit_id"]] = r["to"]
        new_hold = False
        for d in decided:
            r, key, _grain, held = d
            if held or r["action"] != "repoint":
                continue
            others = idx.ids_of.get(key, set()) - {r["exhibit_id"]}
            stay = [e for e in others if moving[key].get(e) != r["to"]]
            if stay:
                d[2] = "exhibit"
                if not with_exhibit_grain:
                    d[3] = ("exhibit grain: the title is shared with %d exhibit(s) that stay, and the dashboard "
                            "reads the title alone (pass --with-exhibit-grain once it reads "
                            "exhibit_unified_titles)" % len(stay))
                    new_hold = True
            else:
                d[2] = "title"
        if not new_hold:
            break
    return [dict(r, _key=key, _grain=grain, _held=held) for r, key, grain, held in decided]


def apply_rows(rows, ut, creds, arts, with_exhibit_grain=False, today=None):
    """Apply the list's applicable rows to in-memory copies. Returns (ut, creds, arts, undo, report). The caller
    decides whether to write; a dry run simply discards the copies."""
    today = today or date.today().isoformat()
    ut, creds = copy.deepcopy(ut), copy.deepcopy(creds)
    arts = copy.deepcopy(arts)
    decided = plan(rows, ut, creds, arts, with_exhibit_grain)
    ut_before, cred_created, art_changed = {}, {}, []
    applied, held = [], []
    pair_arts = defaultdict(list)
    for i, a in enumerate(arts):
        pair_arts[(a.get("exhibit_id"), norm(a.get("exhibit_title")))].append(i)
    untouched_before = {}
    for r in decided:
        if r["_held"]:
            held.append({"exhibit_id": r["exhibit_id"], "local_title": r["local_title"], "batch": r.get("batch"),
                         "action": r["action"], "why": r["_held"]})
            continue
        key, e, to = r["_key"], r["exhibit_id"], r.get("to")
        if r["action"] == "assign":
            key = r["local_title"]
            ut_before.setdefault(key, None)
            ut[key] = {"unified_title": to, "confidence_title": r.get("confidence", 0.85),
                       "classified_at": today, "classified_by": COHORT + " (" + (r.get("batch") or "") + ")",
                       "reviewed_at": None, "reviewed_by": None, "source_exhibit_ids": [e],
                       "quality_flag": None, "_notes": r.get("reason")}
        elif r["action"] == "confirm":
            ut_before.setdefault(key, copy.deepcopy(ut[key]))
            rec = ut[key]
            rec["confidence_title"] = max(float(rec.get("confidence_title") or 0.0), CONFIRM_TO)
            rec["confirmed_by"], rec["confirmed_at"] = COHORT, today
        else:
            ut_before.setdefault(key, copy.deepcopy(ut[key]))
            rec = ut[key]
            if r["_grain"] == "title":
                rec["unified_title"] = to
            else:
                rec.setdefault("exhibit_unified_titles", {})[e] = to
        if r["action"] in ("repoint", "assign"):
            # The articulation carries the target's issuer: the existing credential's highest-confidence record
            # (the dashboard's issuer_pick), else the row's issuer for a new key.
            recs = [x for x in creds.get(to) or [] if x]
            art_issuer = (sorted(recs, key=lambda x: (-(x.get("confidence_issuer") or 0.0),
                                                      x.get("issuing_agency") or ""))[0].get("issuing_agency")
                          if recs else r.get("target_issuer"))
            if to not in creds:
                cred_created[to] = None
                creds[to] = [{"issuing_agency": r.get("target_issuer"), "training_agency": None,
                              "confidence_issuer": 0.8, "confidence_trainer": None, "classified_at": today,
                              "classified_by": COHORT + " (" + (r.get("batch") or "") + ")",
                              "reviewed_at": None, "reviewed_by": None}]
            # Re-issue only this pair's articulations.
            for i in pair_arts.get((e, norm(r["local_title"])), []):
                a = arts[i]
                if r["action"] == "repoint" and a.get("unified_title") != r.get("from"):
                    continue
                before = {"unified_title": a.get("unified_title"), "issuing_agency": a.get("issuing_agency")}
                a["unified_title"] = to
                if art_issuer:
                    a["issuing_agency"] = art_issuer
                art_changed.append({"course_id": a.get("course_id"), "exhibit_id": e,
                                    "exhibit_title": a.get("exhibit_title"), "before": before,
                                    "after": {"unified_title": a["unified_title"],
                                              "issuing_agency": a.get("issuing_agency")}})
        applied.append({"exhibit_id": e, "local_title": r["local_title"], "batch": r.get("batch"),
                        "action": r["action"], "grain": r["_grain"], "from": r.get("from"), "to": to})
    # Guard: every articulation this apply did not name is byte-identical.
    changed_idx = {(c["course_id"], c["exhibit_id"], c["exhibit_title"]) for c in art_changed}
    _ = untouched_before
    undo = {
        "_about": "Every value the pair re-point changed, before and after. undo_pairs() reverses it; a value "
                  "changed since is refused. A title or credential absent before is null.",
        "unified_titles": {k: {"before": b, "after": copy.deepcopy(ut.get(k))} for k, b in ut_before.items()},
        "credentials_created": {k: copy.deepcopy(creds[k]) for k in cred_created},
        "articulations": art_changed,
    }
    report = {"applied": applied, "held": held,
              "counts": {"rows": len(rows), "applicable": len(decided), "applied": len(applied), "held": len(held),
                         "by_batch_applied": dict(Counter(a["batch"] for a in applied)),
                         "by_grain": dict(Counter(a["grain"] for a in applied)),
                         "titles_changed": len(ut_before), "credentials_created": len(cred_created),
                         "articulations_reissued": len(art_changed),
                         "articulation_pairs_reissued": len({(c["exhibit_id"], c["exhibit_title"]) for c in art_changed}),
                         "articulations_untouched": len(arts) - len(changed_idx)}}
    return ut, creds, arts, undo, report


def undo_pairs(undo, ut, creds, arts, force=False):
    """Reverse one pair apply from its pair_undo.json. Returns (ut, creds, arts, skipped).

    The unit is the local title: its unified_titles entry and the articulations the apply re-issued under it. A title
    whose entry or any of whose articulations changed since the apply is left whole, as it stands, so its link and its
    articulations stay in step. A created canonical is removed only when it is unchanged and nothing still names it
    after the undo. `skipped` lists every value left in place as (store, key, why); without `force` the caller
    refuses the whole undo when it is not empty, and with `force` the rest is restored and `skipped` is the report
    (COBIx on #3472, S679)."""
    ut, creds, arts = copy.deepcopy(ut), copy.deepcopy(creds), copy.deepcopy(arts)
    skipped = []
    by_pair = defaultdict(list)
    for i, a in enumerate(arts):
        by_pair[(a.get("course_id"), a.get("exhibit_id"), a.get("exhibit_title"))].append(i)
    groups = defaultdict(lambda: {"ut": [], "arts": []})  # normalized local title -> what the apply changed under it
    for k in (undo.get("unified_titles") or {}):
        groups[norm(k)]["ut"].append(k)
    for c in undo.get("articulations") or []:
        groups[norm(c["exhibit_title"])]["arts"].append(c)
    restores = []
    for g in groups.values():
        ut_changed = {k for k in g["ut"] if ut.get(k) != undo["unified_titles"][k]["after"]}
        taken, hits = set(), []  # hits: (articulation change, its index now, or None when it changed since)
        for c in g["arts"]:
            idxs = by_pair.get((c["course_id"], c["exhibit_id"], c["exhibit_title"]), [])
            hit = [i for i in idxs if i not in taken and arts[i].get("unified_title") == c["after"]["unified_title"]
                   and arts[i].get("issuing_agency") == c["after"]["issuing_agency"]]
            if hit:
                taken.add(hit[0])
            hits.append((c, hit[0] if hit else None))
        if ut_changed or any(i is None for _, i in hits):
            for k in g["ut"]:
                skipped.append(("unified_titles", k, "changed since the apply" if k in ut_changed
                                else "its local title changed since the apply"))
            for c, i in hits:
                skipped.append(("articulations", c["exhibit_id"] + " " + str(c["course_id"]),
                                "changed since the apply" if i is None
                                else "its local title changed since the apply"))
            continue
        restores.append((g, hits))
    for g, hits in restores:
        for k in g["ut"]:
            before = undo["unified_titles"][k]["before"]
            if before is None:
                ut.pop(k, None)
            else:
                ut[k] = copy.deepcopy(before)
        for c, i in hits:
            arts[i]["unified_title"] = c["before"]["unified_title"]
            arts[i]["issuing_agency"] = c["before"]["issuing_agency"]
    named = {a.get("unified_title") for a in arts}
    for r in ut.values():
        named.add((r or {}).get("unified_title"))
        named.update(((r or {}).get("exhibit_unified_titles") or {}).values())
    for k, after in (undo.get("credentials_created") or {}).items():
        if creds.get(k) != after:
            skipped.append(("credentials", k, "changed since the apply"))
        elif k in named:
            skipped.append(("credentials", k, "still named by a title or articulation the undo left in place"))
        else:
            creds.pop(k, None)
    return ut, creds, arts, skipped
