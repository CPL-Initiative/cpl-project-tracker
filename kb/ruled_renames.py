#!/usr/bin/env python3
"""ruled_renames.py — credential renames and merges a person ruled on a decision sheet, read by the rename route.

WHY. Sam answered Open Asks Sheet 181 on 2026-11-11 at 22:55Z, cards taken as decided (cpl_memory
d-sheet-181-replies-2026-11-11): the three ASE Master Automobile titles become one, and each ASE bundle takes the
family's naming form, "ASE Certificate Bundles: A4 + A5". The rename route reads a rename from a title's
unified_title_override row in kb_curation, and kb_curation holds one row per (course_id, field). Every one of these
titles already holds Sam's own saved fold into "ASE Certificate Bundles" in that slot (unified_title_override and
unified_title_merge_confirm, 2026-11-11 15:26Z), which his ruling C reads as a family tag, never a fold. An
insert-only row cannot take the slot, and a plan must not edit or delete his row. So the ruling is a committed plan
under kb/cred_rename_plans/, and this module lays it over the overlay the dry run and the apply read. Nothing here
writes kb_curation; the apply's own receipt (kb/cred_rename_out/<date>/) is the record once a dispatch lands.

THE RULE. A plan entry {old, new, kind} stands in for the title's rename rows in the overlay the rename route reads,
and only while:
  - the old title is still a credential or still holds an exhibit (else it is done: applied, or gone);
  - the slot holds nothing, the plan's own target, or a fold into a declared family title (Sam's tag rows; ruling C).
    A person's rename to any other title is a newer word and holds the entry;
  - an entry that names a family is still a member: its live row carries the family (credential_family) or its saved
    fold names it;
  - a rename's target is not already a credential (that needs a merge, which a person or a new plan names).
A held entry is listed, never forced. The overlay entry keeps every other field as stored (issuer rows, family tag),
so kb/fold_issuer.py's rules read the same rows; the fold's save time is the plan's decided_at.

Readers: kb/_cred_rename_dryrun.py, kb/_cred_rename_apply.py (both lay it over the same overlay, so the preview and
the apply agree), kb/_build_exhibits_related.py (a ruled title leaves the rename batch).
"""
import glob
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PLANS_DIR = os.path.join(HERE, "cred_rename_plans")
OVERRIDE = "unified_title_override"
CONFIRM = "unified_title_merge_confirm"
FAMILY_FIELD = "credential_family"


def load(plans_dir=PLANS_DIR):
    """Every committed plan, in file-name order. A plan is {"plan_id", "ruling", "decided_by", "decided_at",
    "entries": [{"old", "new", "kind": "rename" | "merge", "family"?, "why"}]}."""
    out = []
    for path in sorted(glob.glob(os.path.join(plans_dir, "*.json"))):
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
        if doc.get("plan_id") and doc.get("decided_at") and isinstance(doc.get("entries"), list):
            out.append(doc)
    return out


def _stamped(entry, field, value, by, at):
    fr = dict(entry.get("field_reviews") or {})
    fr[field] = {"by": by, "at": at}
    entry[field] = value
    entry["field_reviews"] = fr


def overlay(overrides, plans, families, credentials, holding):
    """(effective overrides, report). `overrides` is kb/credential_review_overlay.json's overrides, never changed in
    place; `families` the declared family titles (fold_issuer.family_titles); `credentials` kb/credentials.json;
    `holding` the titles some raw maps to (fold_issuer.titles_holding_exhibits). report: {"applied": [...],
    "held": [...], "done": [...]}, each item the entry plus its plan_id (and "why" for held and done)."""
    eff = dict(overrides or {})
    report = {"applied": [], "held": [], "done": []}
    fams = set(families or ())
    creds = credentials or {}
    for plan in plans or []:
        by = plan.get("decided_by") or "a person"
        at = plan["decided_at"]
        for e in plan["entries"]:
            old, new, kind = e["old"], e["new"], e.get("kind", "rename")
            item = dict(e, plan_id=plan["plan_id"])
            ov = eff.get(old) or {}
            if old not in creds and old not in holding:
                report["done"].append(dict(item, why="the old title is no longer a credential and holds no exhibit"))
                continue
            live = ov.get(OVERRIDE)
            if live and live != new and live not in fams:
                report["held"].append(dict(item, why="a person saved another title for it: %r" % live))
                continue
            conf = ov.get(CONFIRM)
            if kind == "merge" and conf and conf != new and conf not in fams:
                report["held"].append(dict(item, why="a person confirmed a merge into another title: %r" % conf))
                continue
            fam = e.get("family")
            if fam and ov.get(FAMILY_FIELD) != fam and live != fam:
                report["held"].append(dict(item, why="no longer a member of %s" % fam))
                continue
            if kind == "rename" and new in creds:
                report["held"].append(dict(item, why="the new title is already a credential; a merge would be needed"))
                continue
            ent = dict(ov)
            if live != new:
                _stamped(ent, OVERRIDE, new, by, at)
            if kind == "merge":
                if conf != new:
                    _stamped(ent, CONFIRM, new, by, at)
            elif conf in fams:
                # A lead's tag confirm says nothing about this rename; the dry run would read it as a stale confirm.
                ent.pop(CONFIRM, None)
                ent["field_reviews"] = {k: v for k, v in (ent.get("field_reviews") or {}).items() if k != CONFIRM}
            ent["ruled"] = {"plan_id": plan["plan_id"], "ruling": plan.get("ruling", ""),
                            "stored": {f: ov.get(f) for f in (OVERRIDE, CONFIRM) if ov.get(f)}}
            eff[old] = ent
            report["applied"].append(item)
    return eff, report


def pending(plans, credentials, holding):
    """{old: new} for every plan entry not yet done: the rename batch leaves these titles out (decided already)."""
    out = {}
    for plan in plans or []:
        for e in plan["entries"]:
            if e["old"] in (credentials or {}) or e["old"] in (holding or ()):
                out[e["old"]] = e["new"]
    return out
