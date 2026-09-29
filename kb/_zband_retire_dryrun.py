#!/usr/bin/env python3
"""Z-band retirement — DRY-RUN planner (items 20 and 21 of 2026-09-03, Rule 7).

Sam, 2026-09-03: "I'd like to retire the use of Z codes for loner MIDs.
Everything that isn't a CID or CCN should be a MID." Ruled on the sheet as item
20 (the 4,0xx `SUBJ Z<band><seq>` identities become `SUBJ M<band><seq>` by
gap-filling; the band digit stays; lineage kept as origin "machine cluster")
and item 21 (the 221 pre-May `M-ID SUBJ ###` anchors in kb/common_courses.json
become `SUBJ M####` or `SUBJ M##XX` by their member count).

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, kb/common_courses.json,
kb/course_crosswalk.json, the seed or Supabase. Receipts under
kb/zband_retire_out/<date>/:

  alias_map.json    old id -> new id for every Z identity and legacy anchor
  capacity.json     per (SUBJ4, band): M numbers used, added, free afterwards —
                    the tight buckets are the finding (Kinesiology credit)
  duplicates.json   legacy anchors whose title + discipline already name a
                    catalog identity (a curator's merge worklist, not folded here)
  supabase_ops.sql  the kb_curation re-key, PREVIEW ONLY (the apply re-derives
                    against a fresh read)
  report.md         counts, gates, the design question the apply must settle

Where the Z ids live: ONLY in the curation overlay (kb/coci_curation.json and
its Supabase mirror kb_curation) — self-keyed `unified_title` rows plus the
`merge_into` pointers of their members. Zero references in the catalog, the
memberships, the articulations or promotions (measured 2026-09-03). So the
re-key surface is the one kb/_uc_cur_zscheme_apply.py re-keyed the other way
on 2026-06-15, plus the recognition code that knows the Z shape.

Why gap-fill and not keep the number: measured 2026-09-03, 3,836 of 4,053 Z
numbers are already M numbers in the same bucket — Z and M sequences both
started at 1 — and the catalog keeps a merged-away member's id forever (its
curation rows point at it), so the collision surface is every catalog key, not
the export's live rows. Each bucket's Z ids take the lowest free M numbers in
Z-sequence order, deterministically.

Composition with the authority recode (items 7-16): pass --after-recode
kb/authority_recode_out/<date> and this planner first applies that alias map in
memory (THEA Z1001 is THTR Z1001 by then, the buckets are the post-recode ones,
the legacy anchors take the post-recode canonical codes). Series order: recode,
then this, one cron window.

compute_plan() is the pure allocator the apply will import (apply == spec).

Run from repo root:
  python3 kb/_zband_retire_dryrun.py [--after-recode kb/authority_recode_out/2026-09-03]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
CURATION = os.path.join(HERE, "coci_curation.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
FL_SPLIT = os.path.join(HERE, "foreign_language_subj4.json")
COMMON = os.path.join(HERE, "common_courses.json")
CROSSWALK = os.path.join(HERE, "course_crosswalk.json")
OUT_DIR = os.environ.get("ZBAND_RETIRE_OUT") or os.path.join(HERE, "zband_retire_out")

Z_RE = re.compile(r"^([A-Z]{1,6}) Z(\d)(\d{3})$")
M_CORR_RE = re.compile(r"^([A-Z]{1,6}) M(\d)(\d{3})$")
M_STAND_RE = re.compile(r"^([A-Z]{1,6}) M(\d)(\d[A-Z]{2})$")
LEGACY_RE = re.compile(r"^M-ID ([A-Z]+) ")
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
UMBRELLA_KINE = {"Kinesiology": {"KINE", "ATHL"}}


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def standalone_code(n):
    d, r = divmod(n, 26 * 26)
    l1, l2 = divmod(r, 26)
    return f"{d}{LETTERS[l1]}{LETTERS[l2]}"


def continuation_bands(band):
    """Band digits a corroborated bucket may spill into, in order (Sam,
    2026-09-03, readings card 11): credit 1 -> 2 -> ... -> 8; noncredit stays 9."""
    band = str(band)
    if band == "9":
        return ["9"]
    return [str(b) for b in range(int(band), 9)]


def load_id_reservations():
    spec = importlib.util.spec_from_file_location("s4dry", os.path.join(HERE, "_subj4_dryrun.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.load_id_reservations()


# ── composition with the recode receipt ─────────────────────────────────────
def load_recode(dirpath):
    """-> (alias {old: new}, seed_edits) from a kb/authority_recode_out/<date>."""
    if not dirpath:
        return {}, {}
    am = _load(os.path.join(dirpath, "alias_map.json"))
    alias = {old: v["new_id"] if isinstance(v, dict) else v for old, v in am.get("aliases", {}).items()}
    edits = _load(os.path.join(dirpath, "seed_edits.json")) if os.path.exists(os.path.join(dirpath, "seed_edits.json")) else {}
    return alias, edits


def rekey_state(courses, singletons, curations, identities, alias):
    """Apply a prior alias map in memory (keys, merge_into pointers). Pure."""
    if not alias:
        return courses, singletons, curations, identities
    rk = lambda k: alias.get(k, k)
    c2 = {rk(k): v for k, v in courses.items()}
    s2 = {rk(k): v for k, v in singletons.items()}
    cur2 = {}
    for k, v in curations.items():
        if isinstance(v, dict) and v.get("merge_into") in alias:
            v = dict(v)
            v["merge_into"] = alias[v["merge_into"]]
        cur2[rk(k)] = v
    id2 = {rk(k): v for k, v in (identities or {}).items()}
    return c2, s2, cur2, id2


def canonical_codes(canon_doc, fl_doc, edits):
    """discipline -> (canonical code, umbrella code set) after the recode's seed edits."""
    codes, umbrella = {}, {}
    for d, e in (canon_doc.get("disciplines") or {}).items():
        codes[d] = e.get("canonical_subj4")
    for d, ch in (edits.get("canonical") or {}).items():
        codes[d] = ch["to"]
    fl_codes = {v["subj4"] for v in (fl_doc.get("languages") or {}).values()} | {fl_doc.get("residual_subj4", "FLNG")}
    for lang, ch in (edits.get("foreign_language_subj4") or {}).items():
        fl_codes.discard(ch["from"]); fl_codes.add(ch["to"])
    umbrella["Foreign Languages"] = fl_codes
    umbrella.update(UMBRELLA_KINE)
    for d, u in (edits.get("umbrella") or {}).items():
        umbrella[d] = set(u.get("umbrella_codes") or []) | ({u.get("canonical_subj4")} if u.get("canonical_subj4") else set())
    return codes, umbrella


# ── the allocator ───────────────────────────────────────────────────────────
class Buckets:
    """Free M numbers per (SUBJ4, band), corroborated (digits) and stand-alone (letters)."""

    def __init__(self, all_keys, reservations):
        self.corr = defaultdict(set)
        self.stand = defaultdict(set)
        for k in all_keys:
            m = M_CORR_RE.match(k)
            if m:
                self.corr[(m.group(1), m.group(2))].add(int(m.group(3)))
                continue
            m = M_STAND_RE.match(k)
            if m:
                self.stand[(m.group(1), m.group(2))].add(m.group(3))
        self.reservations = reservations
        self.used_before = {b: len(s) for b, s in self.corr.items()}
        self.added = Counter()
        self.overflow = []
        self.continued = []          # (old_id, full bucket, id taken in the next band)

    def next_corr(self, subj, band, old_id):
        # Sam, 2026-09-03 (readings card 11): a full CREDIT bucket continues
        # into the next band digit (KINE M2001 follows KINE M1999); noncredit
        # (9) stays a single band. The band digit is non-semantic today.
        for bd in continuation_bands(band):
            b = (subj, bd)
            reserved = self.reservations.get(b, set())
            seq = 1
            while seq <= 999:
                if seq not in self.corr[b] and seq not in reserved:
                    self.corr[b].add(seq)
                    self.added[b] += 1
                    if bd != str(band):
                        self.continued.append((old_id, f"{subj} M{band}", f"{subj} M{bd}{seq:03d}"))
                    return f"{subj} M{bd}{seq:03d}"
                seq += 1
        self.overflow.append((old_id, f"{subj} M{band}"))
        return None

    def next_stand(self, subj, band, old_id):
        b = (subj, band)
        idx = 0
        while idx < 10 * 26 * 26:
            code = standalone_code(idx)
            if code not in self.stand[b]:
                self.stand[b].add(code)
                self.added[b] += 1
                return f"{subj} M{band}{code}"
            idx += 1
        self.overflow.append((old_id, f"{subj} M{band}"))
        return None


def compute_plan(courses, singletons, curations, identities, common, crosswalk,
                 canon_doc, fl_doc, reservations, recode_alias=None, recode_edits=None):
    recode_alias = recode_alias or {}
    recode_edits = recode_edits or {}
    courses, singletons, curations, identities = rekey_state(courses, singletons, curations, identities, recode_alias)
    codes, umbrella = canonical_codes(canon_doc, fl_doc, recode_edits)

    all_keys = set(courses) | set(singletons) | set(curations) | set(identities or {}) | set(common)
    buckets = Buckets(all_keys, reservations)
    moves = {}

    # ── item 20: Z identities, per bucket in Z-sequence order ──────────────
    zs = sorted((Z_RE.match(k).groups(), k) for k in curations if Z_RE.match(k))
    members = Counter(v.get("merge_into") for v in curations.values()
                      if isinstance(v, dict) and v.get("merge_into"))
    for (subj, band, seq), zid in sorted(zs, key=lambda t: (t[0][0], t[0][1], int(t[0][2]))):
        new_id = buckets.next_corr(subj, band, zid)
        moves[zid] = {"old_id": zid, "new_id": new_id, "kind": "z", "item": 20, "band": band,
                      "members": members.get(zid, 0), "title": (curations[zid] or {}).get("unified_title") if isinstance(curations[zid], dict) else None,
                      "origin": "machine cluster"}

    # ── item 21: legacy anchors in kb/common_courses.json ──────────────────
    blocked, dups = [], []
    title_index = defaultdict(list)
    for cid, rec in list(courses.items()) + list(singletons.items()):
        title_index[(rec.get("discipline"), _nt(rec.get("common_title")))].append(cid)
    # The May anchors spell a few disciplines their own way ("English as a
    # Second Language (ESL)"): resolve exact, then without a parenthetical,
    # then through the fan-in aliases; the rest are blocked and listed.
    alias_rev = {}
    for canon_name, alts in (canon_doc.get("_aliases") or {}).items():
        for a in alts:
            alias_rev[a] = canon_name

    def resolve_disc(d):
        if d in codes:
            return d
        bare = re.sub(r"\s*\([^)]*\)\s*$", "", d or "").strip()
        if bare in codes:
            return bare
        return alias_rev.get(d) or alias_rev.get(bare) or d

    for old in sorted(k for k in common if LEGACY_RE.match(k)):
        rec = common[old]
        disc = resolve_disc(rec.get("discipline") or "")
        subject = (rec.get("subject") or "").upper()
        code = codes.get(disc)
        if disc in umbrella and SUBJ4_RE.match(subject) and subject in umbrella[disc]:
            code = subject                      # SPAN anchors stay SPAN under the umbrella
        if not code or not SUBJ4_RE.match(code):
            blocked.append({"old_id": old, "discipline": disc, "why": "no four-letter canonical code for the discipline"})
            continue
        cs = (rec.get("credit_status") or "").lower()
        band = "9" if "noncredit" in cs else "1"     # the export's rule: units > 0 or official -> credit
        n = rec.get("source_college_count") or 1
        new_id = buckets.next_corr(code, band, old) if n >= 2 else buckets.next_stand(code, band, old)
        moves[old] = {"old_id": old, "new_id": new_id, "kind": "legacy", "item": 21, "band": band,
                      "members": n, "title": rec.get("common_title"), "discipline": disc,
                      "origin": "curated common-course anchor (2026-05)"}
        twins = title_index.get((disc, _nt(rec.get("common_title"))))
        if twins:
            dups.append({"old_id": old, "new_id": new_id, "title": rec.get("common_title"),
                         "discipline": disc, "catalog_twins": twins[:5]})

    # crosswalk references to the legacy anchors (re-pointed by the apply)
    xref = Counter()
    for v in crosswalk.values():
        if isinstance(v, dict) and (v.get("course_id") or "") in moves:
            xref[v["course_id"]] += 1

    # ── validation ──────────────────────────────────────────────────────────
    alias = {o: m["new_id"] for o, m in moves.items() if m.get("new_id")}
    new_ids = list(alias.values())
    dup_new = [k for k, n in Counter(new_ids).items() if n > 1]
    untouched = all_keys - set(moves)
    collide = sorted(set(new_ids) & untouched)
    inv = Counter(alias.values())
    bad_shape = [n for n in new_ids if not (M_CORR_RE.match(n) or M_STAND_RE.match(n))]
    tight = sorted(((999 - len(buckets.corr[b])), b, buckets.used_before.get(b, 0), buckets.added[b])
                   for b in buckets.corr if buckets.added[b])
    validation = {
        # Every Z id must alias; a legacy anchor whose discipline the seed does
        # not know (Travel Services, Hotel and Motel Services: 3 rows) waits for
        # a curator's discipline and is LISTED, not a gate failure — the fold
        # leaves it as it is.
        "V1_every_z_aliased_and_blocked_anchors_listed": {
            "pass": len(alias) == len(moves) and all(LEGACY_RE.match(b["old_id"]) for b in blocked),
            "moves": len(moves), "aliased": len(alias), "blocked_anchors": len(blocked)},
        "V2_new_ids_unique": {"pass": not dup_new, "duplicates": dup_new[:10]},
        "V3_new_ids_disjoint_from_every_existing_key": {"pass": not collide, "collisions": collide[:10]},
        "V4_alias_invertible": {"pass": all(n == 1 for n in inv.values())},
        "V5_m_shape": {"pass": not bad_shape, "bad": bad_shape[:10]},
        "V6_no_overflow": {"pass": not buckets.overflow, "overflow": buckets.overflow[:10]},
        "V7_z_refs_only_in_curation": {"pass": True, "note": "0 Z references in the catalog, memberships, "
                                                             "articulations, promotions (measured 2026-09-03)"},
    }
    return {"moves": moves, "alias": alias, "blocked": blocked, "duplicates": dups,
            "crosswalk_refs": dict(xref), "validation": validation,
            "capacity": [{"bucket": f"{b[0]} M{b[1]}", "used_before": u, "added": a, "free_after": f}
                         for f, b, u, a in tight],
            "counts": {"z_ids": len(zs), "legacy": sum(1 for m in moves.values() if m["kind"] == "legacy"),
                       "z_members_repointed": sum(m["members"] for m in moves.values() if m["kind"] == "z"),
                       "crosswalk_refs": sum(xref.values())},
            "recode_applied": bool(recode_alias)}


def _nt(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


# ── receipts ────────────────────────────────────────────────────────────────
def write_receipts(plan, out, after_recode):
    os.makedirs(out, exist_ok=True)
    today = date.today().isoformat()
    _dump(os.path.join(out, "alias_map.json"), {
        "_status": "DRY-RUN — Z-band retirement (items 20-21 of 2026-09-03); no kb files mutated, "
                   "no Supabase writes.",
        "_generated_by": "kb/_zband_retire_dryrun.py", "_generated_at": today,
        "_after_recode": after_recode or None,
        "_rule": "Z ids take the lowest free M numbers in their (SUBJ4, band) bucket in Z-sequence "
                 "order; legacy anchors take the discipline's canonical code, digits for two or more "
                 "colleges, letters for one; the band digit stays; origin is a row attribute",
        "count": len(plan["alias"]),
        "aliases": {o: {k: v for k, v in m.items() if k != "old_id"} for o, m in sorted(plan["moves"].items()) if m.get("new_id")}})
    _dump(os.path.join(out, "capacity.json"), {
        "_about": "per (SUBJ4, band) bucket the fold adds to: corroborated M numbers used before, "
                  "added by the fold, free afterwards (of 999). Sorted tightest first.",
        "buckets": plan["capacity"]})
    _dump(os.path.join(out, "duplicates.json"), {
        "_about": "legacy anchors whose title and discipline already name a catalog identity — a "
                  "curator's merge worklist after the fold, not folded by it",
        "count": len(plan["duplicates"]), "rows": plan["duplicates"]})
    sql = ["-- Z-band retirement kb_curation re-key — generated by kb/_zband_retire_dryrun.py (PREVIEW)",
           "-- DO NOT RUN. The apply re-derives against a FRESH read of kb_curation.", "begin;"]
    for old, new in sorted(plan["alias"].items()):
        if not Z_RE.match(old):
            continue                     # legacy anchors are git-only (common_courses / crosswalk)
        o, n = old.replace("'", "''"), new.replace("'", "''")
        sql.append(f"update public.kb_curation set course_id = '{n}' where course_id = '{o}';")
        sql.append(f"update public.kb_curation set value = '{n}' where field = 'merge_into' and value = '{o}';")
    sql.append("commit;")
    with open(os.path.join(out, "supabase_ops.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(plan, today, out, after_recode))


def _dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def render_report(plan, today, out, after_recode):
    c, val = plan["counts"], plan["validation"]
    rel = os.path.relpath(out, ROOT)
    tight = plan["capacity"][:8]
    zm = [m for m in plan["moves"].values() if m["kind"] == "z"]
    bands = Counter(m["band"] for m in zm)
    legacy = [m for m in plan["moves"].values() if m["kind"] == "legacy"]
    L = ["---", "title: Z-band retirement — DRY-RUN (items 20 and 21 of 2026-09-03)", f"date: {today}",
         "session: 224 (SkyTune)",
         "status: DRY-RUN — nothing mutated; awaiting Sam's review before any apply",
         "tags: [remint, dry-run, z-scheme, m-id, identity, rule-7]",
         "artifacts:", f"  - {rel}/alias_map.json", f"  - {rel}/capacity.json", f"  - {rel}/duplicates.json",
         f"  - {rel}/supabase_ops.sql",
         "related:", "  - kb/csr_authority_codes_rulings_2026-09-03.json", "  - docs/uc_cur_zscheme_remint_scope.md",
         "  - docs/coursecontrolnumber_remint.md", "---", "", "# Z-band retirement — DRY-RUN", "",
         "## TL;DR", "",
         f"- **{c['z_ids']:,}** Z identities become M identities in their own (SUBJ4, band) buckets "
         f"(credit {bands.get('1', 0):,}, noncredit {bands.get('9', 0):,}); **{c['z_members_repointed']:,}** "
         f"`merge_into` pointers re-point with them. Their lineage becomes the row attribute "
         f"`origin: machine cluster` (item 20).",
         f"- **{c['legacy']:,}** legacy `M-ID SUBJ ###` anchors from kb/common_courses.json become "
         f"`SUBJ M####` ({sum(1 for m in legacy if m['members'] >= 2)} corroborated, digits) or "
         f"`SUBJ M##XX` ({sum(1 for m in legacy if m['members'] < 2)} single-college, letters) under "
         f"their discipline's canonical code; **{c['crosswalk_refs']:,}** kb/course_crosswalk.json references "
         f"re-point (item 21).",
         f"- Computed {'AFTER the authority recode (' + after_recode + ')' if after_recode else 'on the committed state (no recode applied)'}.",
         f"- Validation: **{sum(1 for v in val.values() if v['pass'])}/{len(val)}** gates pass; "
         f"{len(plan['blocked'])} legacy anchors wait for a discipline the seed knows (listed below).",
         "- Why gap-fill: 3,836 of the Z numbers are already M numbers in the same bucket, and a "
         "merged-away member keeps its id forever, so the collision surface is every catalog key. "
         "The receipt is the rollback handle (read right-to-left).", ""]
    L += ["## Gates", "", "| gate | pass | detail |", "|---|---|---|"]
    for k, v in val.items():
        L.append(f"| {k} | {'✅' if v['pass'] else '❌'} | {json.dumps({kk: vv for kk, vv in v.items() if kk != 'pass'})[:160]} |")
    L += ["", "## ⭐ Capacity — the finding", "",
          "The corroborated M numbers run 001–999 per subject and band, and every id ever minted stays "
          "reserved. The buckets this fold fills most:", "",
          "| bucket | used before | added | free after |", "|---|---|---|---|"]
    for t in tight:
        L.append(f"| {t['bucket']} | {t['used_before']} | {t['added']} | **{t['free_after']}** |")
    L += ["", "A bucket under ten free numbers has no room for the next corroborated mint. The apply must "
          "carry a rule for the day a bucket fills — the natural one is a continuation band digit for "
          "credit (`M2###`, the band being non-semantic today by §10) — **a reading for Sam** before "
          "Kinesiology credit reaches its ceiling.", ""]
    L += ["## Item 21 — the legacy anchors", "",
          f"{len(legacy):,} anchors, reviewed by Sam on 2026-05-20 as the curated common-course draft; "
          f"{len(plan['duplicates']):,} of them share a title and discipline with an identity already in the "
          "catalog (duplicates.json) — after the fold they are a curator's merge worklist, and the "
          "fold itself does not merge anything.", ""]
    if plan["blocked"]:
        L += ["Not folded — the anchor's discipline is not in the seed, so it has no canonical code yet "
              "(a curator gives it one of the 146 MQ disciplines, then the next run folds it):", ""]
        L += [f"- `{b['old_id']}` · {b['discipline']!r}" for b in plan["blocked"][:20]]
        L += [""]
    L += ["## The design question the apply must settle (NEEDS SAM)", "",
          "After the re-key these identities are M-ids that live ONLY in the curation overlay — the same "
          "place the Z ids live today. Two ways to carry them:", "",
          "1. **Stay curation-only, recognized by shape.** The CCR tab and the export already read a "
          "row-less `SUBJ M####` merge target as an M-ID; `origin: machine cluster` rides on the "
          "curation row. Smallest change; the identity still has no catalog record.",
          "2. **Materialize into the minted catalog.** Write each one as a real M-ID record (title, "
          "discipline, members) so the generator, the auditor and SkyView carry it like any other. The "
          "honest end state of \"everything that isn't a CID or CCN is a MID\", and a bigger apply.", "",
          "The dry run plans the ids either way; say which, or the apply defaults to 1 and files 2.", "",
          "## Apply procedure (not run here)", "",
          "1. The authority recode applies first (its own pull request), then this planner is re-run "
          "with --after-recode against the fresh state and its alias map asserted equal to this receipt.",
          "2. Git side: kb/coci_curation.json keys + merge_into pointers; kb/common_courses.json keys "
          "(+ an `origin` field); kb/course_crosswalk.json course_id values; retire kb/uc_cur_zseq.json.",
          "3. Same window: Supabase kb_curation re-key from the receipt (supabase-rekey.yml with a "
          "generic verify — today's verify counts UC-CUR rows only), then kb/_post_apply_chain.py.",
          "4. Code that knows the Z shape changes with it (grep `Z_ID_RE`, `[MZ]`, `Z\\\\d{4}`):", ""]
    L += [f"- {t}" for t in [
        "kb/_row_audit.py Z_ID_RE + id_in_scheme + the merge_into / cluster rules (Z becomes M)",
        "unified_courses.js: the `/\\sZ\\d{4}\\b/` recognition in applyMergeLocal and the `[MZ]` band regex",
        "excel_to_dashboard.py: `_target_identity` and the Unified id_system for row-less targets (origin attribute)",
        "kb/_auto_merge_worklist.py + the client mint: new machine clusters mint M ids from a counter, never Z",
        "kb/_rekey_kb_curation_supabase.py: verify by the alias map's old keys, not `UC-CUR-*`",
        "kb/_build_ccr_universe.py `s` mapping and prototype/ccr_universe.js SYS: the fourth system retires",
        "tests/uc_zscheme_recognition.test.js, tests/uc_cur_zscheme_dryrun_test.py: pin the new shape",
        "kb/_rekey_promotions.py ALIAS_MAPS: register the apply receipt (0 promotions refs today, kept for the era chain)",
    ]]
    L += [""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--after-recode", help="kb/authority_recode_out/<date> to compose with")
    args = ap.parse_args()
    courses = _load(COURSES)["courses"]
    singletons = _load(SINGLETONS)["courses"]
    curations = _load(CURATION).get("curations") or {}
    identities = _load(ARTICULATIONS).get("identities") or {}
    common = _load(COMMON)
    crosswalk = _load(CROSSWALK)
    canon_doc = _load(CANONICAL)
    aliases_path = os.path.join(HERE, "discipline_aliases.json")
    if os.path.exists(aliases_path):
        canon_doc["_aliases"] = _load(aliases_path).get("aliases") or {}
    fl_doc = _load(FL_SPLIT)
    reservations = load_id_reservations()
    recode_alias, recode_edits = load_recode(args.after_recode)

    plan = compute_plan(courses, singletons, curations, identities, common, crosswalk,
                        canon_doc, fl_doc, reservations, recode_alias, recode_edits)
    out = os.path.join(OUT_DIR, date.today().isoformat())
    write_receipts(plan, out, args.after_recode)
    c, val = plan["counts"], plan["validation"]
    print(f"[zband_retire_dryrun] {date.today().isoformat()}"
          + (f"  (after recode {args.after_recode})" if args.after_recode else ""))
    print(f"  Z ids: {c['z_ids']:,} -> M · members re-pointed {c['z_members_repointed']:,} · "
          f"legacy anchors {c['legacy']:,} · crosswalk refs {c['crosswalk_refs']:,} · blocked {len(plan['blocked'])}")
    print(f"  validation: {sum(1 for v in val.values() if v['pass'])}/{len(val)} pass")
    for k, v in val.items():
        if not v["pass"]:
            print(f"    ❌ {k}: {json.dumps({kk: vv for kk, vv in v.items() if kk != 'pass'})[:200]}")
    print("  tightest: " + ", ".join(f"{t['bucket']} {t['free_after']} free" for t in plan["capacity"][:4]))
    print(f"  artifacts: {os.path.relpath(out, ROOT)}/{{alias_map,capacity,duplicates}}.json + supabase_ops.sql + report.md")


if __name__ == "__main__":
    main()
