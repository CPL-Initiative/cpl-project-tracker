"""
Cross-discipline over-merge re-mint APPLY step (PR-2).

Consumes the curator-reviewed plan at kb/overmerge_out/<date>/alias_map.json
(produced by kb/_overmerge_dryrun.py — the LATEST dated dir is used) and
re-keys, in place, the flagged over-merged M-IDs into their discipline-pure
pieces:

  * kb/coci_minted_courses.json     — minted M-ID catalog (corroborated pieces)
  * kb/coci_minted_singletons.json  — single-college M-IDs (singleton pieces)
  * kb/coci_minted_memberships.json — M-ID → member courses join
  * kb/coci_articulations.json      — earned articulations resolved to identity
  * kb/coci_unified_courses.json    — variant-unified clusters (members[] refs)
  * kb/coci_curation.json           — curation overlay (keys + merge_into ptrs)

Writes audit artifacts to kb/overmerge_apply/<date>/:

  * report.md       — human-readable apply summary + per-file counts + gates
  * validation.md   — the 4 apply-gate results (the apply receipt)
  * alias_map.json  — a FROZEN copy of the consumed plan (the rollback source)

DOES NOT touch Supabase. Supabase kb_curation row re-keys are done by
kb/_overmerge_apply_supabase.py AFTER this script's git mutations land, so the
two writes sequence safely inside the one cron window the apply workflow holds.

The plan model (per old M-ID, in alias_map["aliases"]):

  HELD entry  → {"held": true, ...}  (NO splits — left untouched everywhere)
  SPLIT entry → {"held": false, "old_id_retired": bool, "splits": [piece, …]}

  each piece = {
    "new_id", "kind" ("corroborated"|"singleton"), "discipline", "subj4",
    "band", "colleges": [...], "n_members", "is_plurality",
    "control_numbers": [...]   ← the reviewed member-assignment plan
  }

The per-piece `control_numbers` is authoritative: a piece's member courses are
exactly those whose `control_number` is in that list. A FRESH-READ gate aborts
the apply if any listed control_number is missing from the old M-ID's current
memberships (data drifted since the dry-run → re-run the dry-run).

Safety:
  * load_alias_map() refuses to run if the plan is missing / empty / malformed.
  * Every catalog mutation asserts NO CLOBBER — a piece new_id may never
    overwrite a surviving (non-flagged) row. The dry-run's V3 gate should have
    proven this; the apply re-asserts it as a belt-and-suspenders.
  * FRESH-READ gate per split M-ID (control_numbers ⊆ current memberships).
  * Atomic writes (temp sibling + os.replace) — a crash mid-write can't leave a
    half-written kb file on disk.
  * Idempotent: re-running on the already-applied state finds 0 split old_mids
    left in the catalog → nothing to do, all gates still PASS.

CLI:
  python3 kb/_overmerge_apply.py            # DRY (prints what it WOULD do)
  python3 kb/_overmerge_apply.py --commit   # actually writes the real kb files

The workflow (overmerge-apply.yml) passes --commit.

Run from repo root.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OVERMERGE_OUT = os.path.join(HERE, "overmerge_out")    # dry-run output (input here)
OUT_DIR = os.path.join(HERE, "overmerge_apply")        # apply receipts

COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
UNIFIED_COURSES = os.path.join(HERE, "coci_unified_courses.json")
CURATION = os.path.join(HERE, "coci_curation.json")

# A minted M-ID course_id is "<SUBJ> M<band><suffix>" — suffix is 3 digits
# (corroborated) or digit + 2 letters (stand-alone). SUBJ is normally 4 letters
# but a handful of flagged M-IDs carry the legacy 1-3-letter off-scheme subject
# (the `mid_id_off_scheme` residue) and the dry-run preserved it on the kept
# piece. This regex matches the dry-run's COURSE_ID_RE VERBATIM (1+ subject
# letters) so the apply consumes exactly what the reviewed plan produced — the
# 4-letter invariant is a dry-run/auditor concern, NOT an apply gate.
COURSE_ID_RE = re.compile(r"^[A-Z]+ M\d[A-Z0-9]{3}$")
# Member top_code in the memberships file is "NNNN.NN: Program Title" or a bare
# "NNNN.NN". Parse the leading 4-digit code (+ optional .NN). Mirrors the
# dry-run's parser so the modal full TOP code we carry matches the partition.
MEMBER_TOP_RE = re.compile(r"^\s*(\d{4})(\.\d{2})?")

# Singleton confidence — matches _seed_coci_minted_mids SINGLETON_CONF and the
# dry-run framing ("singleton → 0.5").
SINGLETON_CONF = 0.5
# Conservative corroborated confidence when the parent's can't be reused.
CORROBORATED_CONF = 0.7

NOW_ISO = None  # set in main()


# ── plan loading ───────────────────────────────────────────────────────────

def _latest_dryrun_dir():
    """Return (date_str, abs_path) of the newest YYYY-MM-DD dir under
    kb/overmerge_out/ that contains an alias_map.json. The apply always
    consumes the LATEST dated plan (the most recent curator-reviewed run)."""
    if not os.path.isdir(OVERMERGE_OUT):
        sys.exit(f"Missing {OVERMERGE_OUT} — run kb/_overmerge_dryrun.py first.")
    dated = []
    for name in os.listdir(OVERMERGE_OUT):
        full = os.path.join(OVERMERGE_OUT, name)
        if os.path.isdir(full) and re.match(r"^\d{4}-\d{2}-\d{2}$", name) \
                and os.path.exists(os.path.join(full, "alias_map.json")):
            dated.append(name)
    if not dated:
        sys.exit(f"No dated alias_map.json under {OVERMERGE_OUT} — run the dry-run first.")
    latest = max(dated)  # ISO dates sort lexicographically
    return latest, os.path.join(OVERMERGE_OUT, latest)


def load_alias_map():
    """Load + validate the latest dry-run alias_map.json.

    Refuses to run if it's missing, empty, or malformed (any non-held entry
    lacking splits, any piece with a bad/absent new_id). Returns
    (plan_date, doc, aliases)."""
    plan_date, plan_dir = _latest_dryrun_dir()
    path = os.path.join(plan_dir, "alias_map.json")
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    aliases = doc.get("aliases") or {}
    if not aliases:
        sys.exit(f"{path} has no aliases — nothing to apply.")

    bad = []
    for old, rec in aliases.items():
        if rec.get("held"):
            # Held entries carry no splits — that's correct.
            if rec.get("splits"):
                bad.append((old, "held entry unexpectedly has splits"))
            continue
        splits = rec.get("splits")
        if not splits:
            bad.append((old, "non-held entry has no splits"))
            continue
        for p in splits:
            nid = p.get("new_id")
            if not nid or not COURSE_ID_RE.match(nid):
                bad.append((old, f"piece new_id malformed: {nid!r}"))
            if p.get("kind") not in ("corroborated", "singleton"):
                bad.append((old, f"piece kind invalid: {p.get('kind')!r}"))
    if bad:
        sys.exit(f"alias_map malformed — {len(bad)} problem(s) (showing 8): {bad[:8]}")

    return plan_date, doc, aliases


def _atomic_write_json(path, obj):
    """Write JSON to a temp sibling then rename — same convention as the rest of
    kb/ (indent 2, UTF-8, terminating newline). A crash mid-write can't strand a
    half-written kb file."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


# ── member helpers ─────────────────────────────────────────────────────────

def parse_member_full_top(s):
    """('NNNN.NN: Program Title') → 'NNNN.NN'. Bare 'NNNN.NN' → 'NNNN.NN'.
    No numeric code → None. Mirrors the dry-run's parser."""
    if not s:
        return None
    code, _, _title = str(s).partition(":")
    m = MEMBER_TOP_RE.match(code)
    if not m:
        return None
    return m.group(1) + (m.group(2) or ".00")


def _modal(values):
    """Deterministic modal of a list: most common, ties broken by the
    lexicographically/numerically smallest value (so re-runs are stable)."""
    vals = [v for v in values if v is not None]
    if not vals:
        return None
    counts = Counter(vals)
    top = max(c for c in counts.values())
    winners = [v for v, c in counts.items() if c == top]
    # Sort by (str) so mixed types don't blow up; numbers compare among
    # themselves first via a (type-rank, value) key.
    return sorted(winners, key=lambda v: (0, v) if isinstance(v, (int, float))
                  else (1, str(v)))[0]


def _members_for_piece(piece, cn_to_members):
    """Gather the member dicts assigned to a piece: every member whose
    control_number ∈ piece.control_numbers. A control_number may map to >1
    member (a college that offered the course under two records sharing one
    CN); both members go to the piece (they share the same division → same
    piece, verified in the data)."""
    out = []
    for cn in piece.get("control_numbers", []):
        out.extend(cn_to_members.get(cn, []))
    return out


def _build_piece_record(old_mid, parent_rec, piece, members):
    """Construct the catalog record for one split piece.

    The over-merge was a *title collision*, so all pieces share the parent's
    common_title + description + credit_status. Discipline / SUBJ4 / band come
    from the (reviewed) piece. Units / subject / top_code are recomputed from
    the piece's own members (modal). `*_mixed` flags are recomputed
    conservatively from the piece's members."""
    colleges = sorted({m.get("college") for m in members if m.get("college")})
    n_colleges = len(colleges)

    modal_subject = _modal([m.get("subject") for m in members])
    modal_units = _modal([m.get("units") for m in members])
    full_tops = [parse_member_full_top(m.get("top_code")) for m in members]
    full_tops = [t for t in full_tops if t]
    modal_top = _modal(full_tops)
    member_cs = [m.get("credit_status") for m in members if m.get("credit_status")]
    member_units = [m.get("units") for m in members if m.get("units") is not None]
    member_subjects = [m.get("subject") for m in members if m.get("subject")]

    discipline = piece.get("discipline")
    rec = {
        "course_id": piece["new_id"],
        "id_system": "M-ID",
        "common_title": parent_rec.get("common_title"),
        "common_title_source": parent_rec.get("common_title_source"),
        "description": parent_rec.get("description"),
        "description_source": parent_rec.get("description_source"),
        "subject": modal_subject,
        "subject_4letter": piece.get("subj4"),
        "discipline": discipline,
        "discipline_source": "top_code" if discipline else None,
        "discipline_confidence": (parent_rec.get("discipline_confidence")
                                  if discipline else None),
        "discipline_inferred_at": (parent_rec.get("discipline_inferred_at")
                                   if discipline else None),
        "credit_status": parent_rec.get("credit_status"),
        # band is encoded into the id (M<band>...); kept as descriptive metadata
        # for parity with the dry-run framing (credit→1, noncredit→9).
        "band": piece.get("band"),
        "typical_units": modal_units,
        "top_code": modal_top,
        "noncredit_category": parent_rec.get("noncredit_category"),
        "noncredit_category_distribution": parent_rec.get("noncredit_category_distribution"),
        # ── variance flags, recomputed conservatively from THIS piece ──
        "credit_status_mixed": len(set(member_cs)) > 1,
        "top_code_mixed": len(set(full_tops)) > 1,
        "subject_spread": len(set(member_subjects)),
        "noncredit_category_mixed": bool(parent_rec.get("noncredit_category_mixed")),
        "top_code_distribution": dict(Counter(full_tops)) if full_tops else None,
        # ── corroboration ──
        "corroboration_members": n_colleges,
        "source_college_count": n_colleges,
        "subject_spread_members": len(members),
        # ── identity authorities carry through unchanged from the parent ──
        "c_id": parent_rec.get("c_id"),
        "ccn_id": parent_rec.get("ccn_id"),
        "cte": parent_rec.get("cte"),
        # ── provenance ──
        "classified_at": parent_rec.get("classified_at"),
        "classified_by": parent_rec.get("classified_by"),
        "reviewed_at": None,
        "reviewed_by": None,
        "_remint_from": {
            "old_id": old_mid,
            "reason": "member_top_divergence_split",
            "date": date.today().isoformat(),
        },
    }
    # confidence: corroborated reuses parent's (else conservative 0.7);
    # singleton → 0.5 (match the seed's SINGLETON_CONF + the dry-run framing).
    if piece["kind"] == "corroborated":
        rec["confidence"] = parent_rec.get("confidence") or CORROBORATED_CONF
    else:
        rec["confidence"] = SINGLETON_CONF
    return rec


# ── core build: per old M-ID → its piece records + member lists ──────────────

def build_piece_records(aliases, courses, memberships):
    """For every SPLIT old M-ID, build:
      * piece_records[new_id] = (kind, record)
      * piece_members[new_id] = [member dicts]   (the originals, unchanged)
    Runs the FRESH-READ gate (every listed control_number resolves to a current
    member of the old M-ID). Returns (piece_records, piece_members, split_mids,
    held_mids, retired_mids, fresh_read_errors)."""
    piece_records = {}
    piece_members = {}
    split_mids = []
    held_mids = set()
    retired_mids = set()
    fresh_read_errors = []

    for old_mid, rec in aliases.items():
        if rec.get("held"):
            held_mids.add(old_mid)
            continue
        split_mids.append(old_mid)
        if rec.get("old_id_retired"):
            retired_mids.add(old_mid)

        parent_rec = courses.get(old_mid)
        if parent_rec is None:
            # The old M-ID isn't in the current catalog. On a fresh apply this
            # is fatal (the plan references a row that's gone); on a re-run
            # (idempotency) the row is already deleted and this M-ID has no
            # work — distinguished by the caller via split-old-mids-present.
            fresh_read_errors.append(
                f"{old_mid}: not present in coci_minted_courses.json")
            continue

        members = memberships.get(old_mid) or []
        # control_number → list[member] for THIS old M-ID.
        cn_to_members = defaultdict(list)
        member_cns = set()
        for m in members:
            cn = m.get("control_number")
            if cn:
                cn_to_members[cn].append(m)
                member_cns.add(cn)

        # FRESH-READ gate: every control_number the plan assigns must exist in
        # the current memberships of this old M-ID. If any is missing, the data
        # drifted since the dry-run produced the plan → abort.
        planned_cns = set()
        for p in rec["splits"]:
            for cn in p.get("control_numbers", []):
                planned_cns.add(cn)
        missing = sorted(planned_cns - member_cns)
        if missing:
            fresh_read_errors.append(
                f"{old_mid}: {len(missing)} planned control_number(s) absent "
                f"from current memberships (drift): {missing[:5]}")
            continue

        for p in rec["splits"]:
            members_p = _members_for_piece(p, cn_to_members)
            piece_records[p["new_id"]] = (
                p["kind"], _build_piece_record(old_mid, parent_rec, p, members_p))
            piece_members[p["new_id"]] = members_p

    return (piece_records, piece_members, split_mids, held_mids,
            retired_mids, fresh_read_errors)


# ── catalog mutators (each asserts no clobber, atomic write) ─────────────────

def remap_courses(piece_records, split_mids, dry_run):
    """coci_minted_courses: delete every SPLIT old_mid; insert each
    corroborated-kind piece under its new_id. Held + non-flagged untouched.

    Asserts a piece new_id never lands on a SURVIVING (non-deleted) key."""
    with open(COURSES, encoding="utf-8") as f:
        blob = json.load(f)
    courses = blob["courses"]
    split_set = set(split_mids)

    # Survivors = current keys minus the split old_mids we're deleting.
    surviving = {k: v for k, v in courses.items() if k not in split_set}
    deleted = len(courses) - len(surviving)

    corr_pieces = {nid: r for nid, (kind, r) in piece_records.items()
                   if kind == "corroborated"}
    collisions = [nid for nid in corr_pieces if nid in surviving]
    if collisions:
        sys.exit(f"FATAL: {len(collisions)} corroborated piece new_ids would "
                 f"clobber a surviving row in coci_minted_courses.json. "
                 f"Sample: {collisions[:5]}. Re-run the dry-run; V3 should fail.")

    new_courses = dict(surviving)
    new_courses.update(corr_pieces)
    counts = {"deleted": deleted, "inserted": len(corr_pieces),
              "total_before": len(courses), "total_after": len(new_courses)}
    if not dry_run:
        blob["courses"] = new_courses
        blob["count"] = len(new_courses)
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(COURSES, blob)
    return counts


def remap_singletons(piece_records, dry_run):
    """coci_minted_singletons: insert each singleton-kind piece under its
    new_id. Asserts no piece new_id clobbers an existing singleton."""
    with open(SINGLETONS, encoding="utf-8") as f:
        blob = json.load(f)
    singletons = blob["courses"]

    sing_pieces = {nid: r for nid, (kind, r) in piece_records.items()
                   if kind == "singleton"}
    collisions = [nid for nid in sing_pieces if nid in singletons]
    if collisions:
        sys.exit(f"FATAL: {len(collisions)} singleton piece new_ids would "
                 f"clobber an existing singleton. Sample: {collisions[:5]}. "
                 f"Re-run the dry-run; V3 should fail.")

    new_sing = dict(singletons)
    new_sing.update(sing_pieces)
    counts = {"inserted": len(sing_pieces), "total_before": len(singletons),
              "total_after": len(new_sing)}
    if not dry_run:
        blob["courses"] = new_sing
        blob["count"] = len(new_sing)
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(SINGLETONS, blob)
    return counts


def remap_memberships(piece_members, split_mids, dry_run):
    """coci_minted_memberships: delete each SPLIT old_mid's entry; add one entry
    per piece keyed by new_id holding that piece's member dicts (originals,
    unchanged). Held + non-flagged untouched. Asserts no piece new_id clobbers a
    surviving membership key."""
    with open(MEMBERSHIPS, encoding="utf-8") as f:
        blob = json.load(f)
    memberships = blob["memberships"]
    split_set = set(split_mids)

    surviving = {k: v for k, v in memberships.items() if k not in split_set}
    deleted = len(memberships) - len(surviving)

    collisions = [nid for nid in piece_members if nid in surviving]
    if collisions:
        sys.exit(f"FATAL: {len(collisions)} piece new_ids would clobber a "
                 f"surviving membership key. Sample: {collisions[:5]}.")

    new_mem = dict(surviving)
    new_mem.update(piece_members)
    member_total = sum(len(v) for v in new_mem.values())
    counts = {"deleted": deleted, "inserted": len(piece_members),
              "total_before": len(memberships), "total_after": len(new_mem),
              "member_dicts_total": member_total}
    if not dry_run:
        blob["memberships"] = new_mem
        blob["count"] = len(new_mem)
        blob["member_courses_total"] = member_total
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(MEMBERSHIPS, blob)
    return counts


def _piece_meta_for_routing(aliases, memberships):
    """Per SPLIT old M-ID, derive routing metadata for each piece:
    {old_mid: [{new_id, colleges:set, div, n_members, is_plurality}]}.

    `div` (the piece's 2-digit TOP division) is recomputed from the piece's
    members (CN-matched) — the alias_map doesn't serialize per-piece div, and
    pieces are single-division by construction (the dry-run grouped by div)."""
    meta = {}
    for old_mid, rec in aliases.items():
        if rec.get("held"):
            continue
        members = memberships.get(old_mid) or []
        cn_to_members = defaultdict(list)
        for m in members:
            cn = m.get("control_number")
            if cn:
                cn_to_members[cn].append(m)
        pieces = []
        for p in rec["splits"]:
            pm = _members_for_piece(p, cn_to_members)
            divs = set()
            for m in pm:
                code = parse_member_full_top(m.get("top_code"))
                divs.add(code[:2] if code else "00")
            # single-division by construction; if (defensively) >1, take the
            # lexicographically smallest for determinism.
            the_div = next(iter(divs)) if len(divs) == 1 else (
                sorted(divs)[0] if divs else "00")
            pieces.append({
                "new_id": p["new_id"],
                "colleges": set(p.get("colleges", [])),
                "div": the_div,
                "n_members": p.get("n_members", 0),
                "is_plurality": bool(p.get("is_plurality")),
            })
        meta[old_mid] = pieces
    return meta


def _route_article(article, pieces):
    """Route one articulation (course_id is a split old M-ID) to its piece(s).

    Returns a list of (new_id, scoped_earned_list, scoped_local_courses) — one
    entry per output record — or None if truly unroutable.

    Mirrors the dry-run's article-level hit logic (college-intersection;
    fallback: article top_code division → piece division). For a MULTI match
    the earning colleges are partitioned DISJOINTLY across the matched pieces so
    the (article × earning-college) pair count is exactly preserved (V4): each
    earner goes to the matched piece that contains it; an earner contained in NO
    matched piece goes to a single deterministic default piece (the largest
    matched piece, tie-break is_plurality then new_id). `local_courses` is kept
    whole on each split record (it carries no college tag to partition by)."""
    earned = list(dict.fromkeys(article.get("earned_by_colleges") or []))
    local = article.get("local_courses") or []

    hits = [p for p in pieces if p["colleges"] & set(earned)]
    if not hits:
        code = parse_member_full_top(article.get("top_code"))
        a_div = code[:2] if code else None
        if a_div:
            hits = [p for p in pieces if p["div"] == a_div]
    if not hits:
        return None

    if len(hits) == 1:
        # Re-key to the single matched piece, keeping ALL earners (cardinality
        # preserved trivially).
        return [(hits[0]["new_id"], earned, local)]

    # Multi: disjoint-partition the earners.
    default = sorted(hits, key=lambda p: (-p["n_members"],
                                          0 if p["is_plurality"] else 1,
                                          p["new_id"]))[0]
    buckets = defaultdict(list)
    for c in earned:
        owners = [p for p in hits if c in p["colleges"]]
        owner = (sorted(owners, key=lambda p: (-p["n_members"],
                                               0 if p["is_plurality"] else 1,
                                               p["new_id"]))[0]
                 if owners else default)
        buckets[owner["new_id"]].append(c)
    # Stable output order: by new_id.
    return [(nid, buckets[nid], local) for nid in sorted(buckets)]


def remap_articulations(aliases, memberships, held_mids, dry_run):
    """coci_articulations: re-key (and split, when multi) each article whose
    course_id is a SPLIT old M-ID. Held old_mids' articles stay unchanged.

    Returns counts + the pre/post (article × earning-college) pair sums for the
    V4 gate."""
    with open(ARTICULATIONS, encoding="utf-8") as f:
        blob = json.load(f)
    arts = blob.get("articulations") or []
    pieces_meta = _piece_meta_for_routing(aliases, memberships)

    split_set = set(pieces_meta)          # split old_mids only (held excluded)
    flagged_set = set(aliases)

    pre_pairs_flagged = 0
    post_pairs_flagged = 0
    rekeyed = 0          # single-piece re-key
    split_into = 0       # articles that became >1 record
    records_added = 0    # extra records created by splits
    held_unchanged = 0
    untouched = 0
    unroutable = []
    touched_course_ids = set()  # course_ids this routing PRODUCED (for V3 scope)

    new_arts = []
    for a in arts:
        cid = a.get("course_id")
        if cid not in flagged_set:
            new_arts.append(a)
            untouched += 1
            continue
        pre_pairs_flagged += len(a.get("earned_by_colleges") or [])
        if cid in held_mids:
            # held → unchanged
            new_arts.append(a)
            held_unchanged += 1
            post_pairs_flagged += len(a.get("earned_by_colleges") or [])
            continue
        routed = _route_article(a, pieces_meta.get(cid, []))
        if routed is None:
            # Should be zero (dry-run V4 = 0 unroutable). Abort rather than
            # silently drop an articulation.
            unroutable.append({"course_id": cid,
                               "earned_by_colleges": a.get("earned_by_colleges")})
            new_arts.append(a)  # keep it (will be reported; gate fails)
            post_pairs_flagged += len(a.get("earned_by_colleges") or [])
            continue
        if len(routed) == 1:
            nid, earned, local = routed[0]
            r = dict(a)
            r["course_id"] = nid
            r["earned_by_colleges"] = earned
            r["local_courses"] = local
            new_arts.append(r)
            touched_course_ids.add(nid)
            rekeyed += 1
            post_pairs_flagged += len(earned)
        else:
            split_into += 1
            records_added += len(routed) - 1
            for nid, earned, local in routed:
                r = dict(a)
                r["course_id"] = nid
                r["earned_by_colleges"] = earned
                r["local_courses"] = local
                new_arts.append(r)
                touched_course_ids.add(nid)
                post_pairs_flagged += len(earned)

    counts = {
        "rekeyed_single": rekeyed,
        "split_into_multi": split_into,
        "records_added_by_split": records_added,
        "held_unchanged": held_unchanged,
        "untouched": untouched,
        "total_before": len(arts),
        "total_after": len(new_arts),
        "pre_pairs_flagged": pre_pairs_flagged,
        "post_pairs_flagged": post_pairs_flagged,
        "unroutable": unroutable,
        "touched_course_ids": touched_course_ids,
    }
    if not dry_run:
        blob["articulations"] = new_arts
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(ARTICULATIONS, blob)
    return counts


def remap_clusters(aliases, dry_run):
    """coci_unified_courses: in each cluster's members[], replace a split
    old_mid with its piece new_ids (held → unchanged). De-dup while preserving
    order otherwise."""
    with open(UNIFIED_COURSES, encoding="utf-8") as f:
        blob = json.load(f)
    clusters = blob.get("clusters") or {}

    # old_mid → [piece new_ids]  (split only; held map to themselves implicitly)
    expand = {}
    for old_mid, rec in aliases.items():
        if rec.get("held"):
            continue
        expand[old_mid] = [p["new_id"] for p in rec["splits"]]

    refs_replaced = 0
    clusters_touched = 0
    touched_refs = set()  # piece new_ids written into clusters (for V3 scope)
    for _uid, c in clusters.items():
        members = c.get("members") or []
        touched = False
        new_members = []
        seen = set()
        for m in members:
            if m in expand:
                touched = True
                for nid in expand[m]:
                    if nid not in seen:
                        new_members.append(nid)
                        seen.add(nid)
                    touched_refs.add(nid)
                refs_replaced += 1
            else:
                if m not in seen:
                    new_members.append(m)
                    seen.add(m)
        if touched:
            clusters_touched += 1
            if not dry_run:
                c["members"] = new_members
                c["member_count"] = len(new_members)
    counts = {"refs_replaced": refs_replaced, "clusters_touched": clusters_touched,
              "touched_refs": touched_refs}
    if not dry_run and clusters_touched:
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(UNIFIED_COURSES, blob)
    return counts


def remap_curation(aliases, dry_run):
    """coci_curation: re-point any entry KEYED BY a split old_mid, or whose
    merge_into TARGETS a split old_mid, to the split's plurality piece (the
    dominant lineage). Today 0 curation rows reference the flagged set — handled
    defensively + logged."""
    with open(CURATION, encoding="utf-8") as f:
        blob = json.load(f)
    curations = blob.get("curations") or {}

    # old_mid → plurality piece new_id (split only).
    plurality = {}
    for old_mid, rec in aliases.items():
        if rec.get("held"):
            continue
        plur = next((p["new_id"] for p in rec["splits"] if p.get("is_plurality")),
                    None)
        # Fallback: largest piece if no is_plurality flag (shouldn't happen).
        if plur is None and rec["splits"]:
            plur = max(rec["splits"],
                       key=lambda p: p.get("n_members", 0))["new_id"]
        plurality[old_mid] = plur

    key_rekeyed = 0
    mi_repointed = 0
    new_cur = {}
    for old_key, val in curations.items():
        val = dict(val) if isinstance(val, dict) else val
        # Re-point a merge_into that targets a split old_mid.
        if isinstance(val, dict):
            mi = val.get("merge_into")
            if mi in plurality and plurality[mi]:
                val["merge_into"] = plurality[mi]
                mi_repointed += 1
        # Re-key the entry itself if it's keyed by a split old_mid.
        if old_key in plurality and plurality[old_key]:
            new_cur[plurality[old_key]] = val
            key_rekeyed += 1
        else:
            new_cur[old_key] = val

    counts = {"key_rekeyed": key_rekeyed, "merge_into_repointed": mi_repointed,
              "total": len(curations)}
    if not dry_run and (key_rekeyed or mi_repointed):
        blob["curations"] = new_cur
        blob["count"] = len(new_cur)
        blob["_overmerge_remint_applied_at"] = NOW_ISO
        _atomic_write_json(CURATION, blob)
    return counts


# ── apply gates ──────────────────────────────────────────────────────────────

def compute_gates(*, courses_after, singletons_after, course_counts,
                  mem_counts, piece_records, piece_members, split_mids,
                  retired_mids, aliases, art_counts, cluster_member_refs_after,
                  touched_article_course_ids):
    """Compute the four apply gates (return dict of {name: {pass, detail}}).

    V1 plan-executed:   every piece new_id resolves in courses ∪ singletons,
                        and no flagged old_mid survives in `courses` as a STALE
                        original — any flagged key still present must be a
                        (freshly-rewritten) corroborated piece record. This
                        correctly allows (a) the 484 non-retired splits whose
                        plurality keeps the old key, and (b) retired old-id
                        strings the allocator REUSED as a fresh corroborated id
                        for a different lineage — both are live, rewritten rows.
    V2 member conserv.: total member dicts across all piece memberships ==
                        total across the split old_mids' original memberships;
                        every planned control_number lands in exactly one piece.
    V3 collision-free + no-orphan: no piece new_id clobbered a surviving id;
                        every cluster member-ref + every article course_id THE
                        RE-MINT TOUCHED resolves to courses ∪ singletons
                        post-apply. (Pre-existing C-ID/CCN-anchored articulations
                        that never pointed at the minted catalog are out of
                        scope — `touched_article_course_ids` is exactly the set
                        of course_ids the routing produced for formerly-flagged
                        articles.)
    V4 article cardinality: post-apply pair sum == pre-apply pair sum.
    """
    catalog_after = courses_after | singletons_after

    # ── V1 ──
    # Corroborated piece new_ids are the only flagged-old-id strings that may
    # legitimately survive in `courses` (kept plurality + reused-retired ids).
    corr_piece_ids = {nid for nid, (kind, _) in piece_records.items()
                      if kind == "corroborated"}
    flagged_set = set(aliases)
    v1_missing_pieces = [nid for nid in piece_records if nid not in catalog_after]
    # A flagged key still in courses that is NOT a corroborated piece new_id is
    # a stale, un-rewritten original → the plan didn't fully execute.
    v1_stale_survivors = [m for m in flagged_set
                          if m in courses_after and m not in corr_piece_ids
                          and m not in {h for h, v in aliases.items() if v.get("held")}]
    v1_pass = not v1_missing_pieces and not v1_stale_survivors

    # ── V2 ──
    # Original member-dict total across split old_mids (read fresh from the
    # mutated-or-not membership inputs we captured in mem_counts is post-apply;
    # we recompute the ORIGINAL from piece_members + (any) untouched—but the
    # cleanest invariant is: sum of piece member lists == sum of the originals).
    piece_member_total = sum(len(v) for v in piece_members.values())
    # every planned control_number → exactly one piece
    cn_piece_count = Counter()
    for old_mid, rec in aliases.items():
        if rec.get("held"):
            continue
        for p in rec["splits"]:
            for cn in p.get("control_numbers", []):
                cn_piece_count[(old_mid, cn)] += 1
    cn_multi = [k for k, c in cn_piece_count.items() if c > 1]
    # original member total for the split set (from the dry-run's V2 invariant,
    # recomputed here from the live original memberships).
    v2_orig_total = mem_counts["_orig_split_member_total"]
    v2_pass = (piece_member_total == v2_orig_total) and not cn_multi

    # ── V3 ──
    # Collisions are already fatal in the mutators; here we re-prove no-orphan,
    # scoped to what the re-mint TOUCHED. Article side: only the course_ids the
    # routing newly produced for formerly-flagged articles (pre-existing
    # C-ID/CCN-anchored articulations never resolved to the minted catalog and
    # are out of scope). Cluster side: only refs that the re-mint rewrote.
    art_orphans = [cid for cid in touched_article_course_ids
                   if cid not in catalog_after]
    cluster_orphans = [ref for ref in cluster_member_refs_after
                       if ref not in catalog_after]
    v3_pass = not art_orphans and not cluster_orphans

    # ── V4 ──
    v4_pass = (art_counts["pre_pairs_flagged"] == art_counts["post_pairs_flagged"]
               and not art_counts["unroutable"])

    return {
        "V1_plan_executed": {
            "pass": v1_pass,
            "pieces_missing_from_catalog": len(v1_missing_pieces),
            "stale_flagged_survivors_in_courses": len(v1_stale_survivors),
            "_sample_missing": v1_missing_pieces[:5],
            "_sample_stale": v1_stale_survivors[:5],
        },
        "V2_member_conservation": {
            "pass": v2_pass,
            "piece_member_total": piece_member_total,
            "orig_split_member_total": v2_orig_total,
            "control_numbers_in_multiple_pieces": len(cn_multi),
            "_sample_cn_multi": cn_multi[:5],
        },
        "V3_collision_free_no_orphan": {
            "pass": v3_pass,
            "article_course_id_orphans": len(art_orphans),
            "cluster_member_ref_orphans": len(cluster_orphans),
            "_sample_art_orphans": art_orphans[:5],
            "_sample_cluster_orphans": cluster_orphans[:5],
        },
        "V4_article_cardinality": {
            "pass": v4_pass,
            "pre_pairs": art_counts["pre_pairs_flagged"],
            "post_pairs": art_counts["post_pairs_flagged"],
            "unroutable": len(art_counts["unroutable"]),
        },
    }


# ── main ──────────────────────────────────────────────────────────────────

def run_apply(dry_run, paths=None):
    """Execute the apply. When dry_run, mutators compute but don't write; the
    gates still run on the would-be state. `paths` (a dict of file-constant
    overrides) lets the self-test point everything at temp copies."""
    global COURSES, SINGLETONS, MEMBERSHIPS, ARTICULATIONS, UNIFIED_COURSES
    global CURATION, OVERMERGE_OUT, OUT_DIR, NOW_ISO

    if paths:
        COURSES = paths.get("courses", COURSES)
        SINGLETONS = paths.get("singletons", SINGLETONS)
        MEMBERSHIPS = paths.get("memberships", MEMBERSHIPS)
        ARTICULATIONS = paths.get("articulations", ARTICULATIONS)
        UNIFIED_COURSES = paths.get("unified_courses", UNIFIED_COURSES)
        CURATION = paths.get("curation", CURATION)
        OVERMERGE_OUT = paths.get("overmerge_out", OVERMERGE_OUT)
        OUT_DIR = paths.get("out_dir", OUT_DIR)

    NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    today = date.today().isoformat()

    plan_date, doc, aliases = load_alias_map()
    mode = "DRY-RUN (no writes)" if dry_run else "COMMIT (writing kb files)"
    print(f"[overmerge_apply] {today}  mode: {mode}")
    print(f"  plan: kb/overmerge_out/{plan_date}/alias_map.json")
    print(f"  aliases: {len(aliases)} "
          f"(held {sum(1 for v in aliases.values() if v.get('held'))}, "
          f"split {sum(1 for v in aliases.values() if not v.get('held'))})")

    # ── Read originals we need for build + gate baselines ──
    with open(COURSES, encoding="utf-8") as f:
        courses = json.load(f)["courses"]
    with open(MEMBERSHIPS, encoding="utf-8") as f:
        memberships = json.load(f)["memberships"]

    # ── Idempotency model ────────────────────────────────────────────────────
    # A split old_mid is "PENDING" iff it's still in the catalog AS A STALE
    # original — i.e. present in `courses` without our split stamp. After a
    # successful apply, the catalog contains only piece records: the 752 retired
    # old_mids are gone, the 484 kept-id pieces (and reused-retired ids) carry
    # `_remint_from.reason == member_top_divergence_split`. So a kept-id piece
    # that survives at its old key is NOT pending (it's already a rewritten
    # piece), which is exactly what makes the re-run a clean no-op.
    def _is_applied_stamp(rec):
        rf = (rec or {}).get("_remint_from")
        return isinstance(rf, dict) and rf.get("reason") == "member_top_divergence_split"

    split_old = [m for m, v in aliases.items() if not v.get("held")]
    pending = [m for m in split_old
               if m in courses and not _is_applied_stamp(courses[m])]

    if not pending:
        # Already applied (or nothing to do). Emit a clean no-op + PASS gates.
        print("  no PENDING split old_mids (all gone or already stamped) — "
              "already applied (clean no-op). Nothing to write.")
        noop_gates = {
            "V1_plan_executed": {"pass": True, "note": "no-op (already applied)"},
            "V2_member_conservation": {"pass": True, "note": "no-op"},
            "V3_collision_free_no_orphan": {"pass": True, "note": "no-op"},
            "V4_article_cardinality": {"pass": True, "note": "no-op"},
        }
        for gk in noop_gates:
            print(f"    PASS  {gk}")
        return noop_gates

    # First apply must be ALL-OR-NOTHING: every split old_mid pending. A partial
    # set (some stamped, some stale) means a prior apply landed half-way — abort
    # rather than double-apply onto an inconsistent catalog.
    if len(pending) != len(split_old):
        already = len(split_old) - len(pending)
        print(f"  ::error::PARTIAL-APPLY STATE — {already} split old_mid(s) already "
              f"carry the split stamp but {len(pending)} are still stale. The "
              f"catalog is mid-apply; roll back the last apply commit before re-running.")
        sys.exit(2)

    (piece_records, piece_members, split_mids, held_mids, retired_mids,
     fresh_errors) = build_piece_records(aliases, courses, memberships)

    # FRESH-READ gate: on a true first apply (all pending) ANY mismatch between
    # the plan's control_numbers and the current memberships means the data
    # drifted since the dry-run produced the plan → abort, re-run the dry-run.
    if fresh_errors:
        print("  FRESH-READ GATE FAILED — the plan no longer matches the "
              "current data (drift since the dry-run). Re-run kb/_overmerge_dryrun.py.")
        for e in fresh_errors[:10]:
            print(f"    {e}")
        sys.exit(2)

    # Original member-dict total across the split set (V2 baseline) — computed
    # from the live memberships BEFORE mutation. On a re-run those keys are gone
    # → 0, and piece_members is also empty → V2 trivially holds (0 == 0).
    orig_split_member_total = sum(
        len(memberships.get(m, [])) for m in split_mids if m in memberships)

    # ── Mutate (or simulate) each file ──
    course_counts = remap_courses(piece_records, split_mids, dry_run)
    sing_counts = remap_singletons(piece_records, dry_run)
    mem_counts = remap_memberships(piece_members, split_mids, dry_run)
    mem_counts["_orig_split_member_total"] = orig_split_member_total
    art_counts = remap_articulations(aliases, memberships, held_mids, dry_run)
    cluster_counts = remap_clusters(aliases, dry_run)
    cur_counts = remap_curation(aliases, dry_run)

    # ── Compute the would-be post-apply catalogs + ref sets for the gates ──
    # (Re-read the files if committed; otherwise reconstruct in memory.)
    if dry_run:
        split_set = set(split_mids)
        courses_after = (set(courses) - split_set) | {
            nid for nid, (k, _) in piece_records.items() if k == "corroborated"}
        with open(SINGLETONS, encoding="utf-8") as f:
            singletons_now = set(json.load(f)["courses"])
        singletons_after = singletons_now | {
            nid for nid, (k, _) in piece_records.items() if k == "singleton"}
    else:
        with open(COURSES, encoding="utf-8") as f:
            courses_after = set(json.load(f)["courses"])
        with open(SINGLETONS, encoding="utf-8") as f:
            singletons_after = set(json.load(f)["courses"])

    # For V3 no-orphan we scope to what the re-mint TOUCHED — the article
    # course_ids the routing produced + the piece new_ids written into clusters.
    # Both are returned by their mutators (computed from the ORIGINAL inputs, so
    # they're identical in dry + commit modes — no re-reading a mutated file).
    touched_article_cids = art_counts["touched_course_ids"]
    cluster_refs_after = cluster_counts["touched_refs"]

    gates = compute_gates(
        courses_after=courses_after, singletons_after=singletons_after,
        course_counts=course_counts, mem_counts=mem_counts,
        piece_records=piece_records, piece_members=piece_members,
        split_mids=split_mids, retired_mids=retired_mids, aliases=aliases,
        art_counts=art_counts, cluster_member_refs_after=cluster_refs_after,
        touched_article_course_ids=touched_article_cids)

    all_pass = all(g["pass"] for g in gates.values())

    # ── Console summary ──
    print()
    print("  per-file changes:")
    print(f"    coci_minted_courses.json    -{course_counts['deleted']} +"
          f"{course_counts['inserted']}  "
          f"({course_counts['total_before']} -> {course_counts['total_after']})")
    print(f"    coci_minted_singletons.json +{sing_counts['inserted']}  "
          f"({sing_counts['total_before']} -> {sing_counts['total_after']})")
    print(f"    coci_minted_memberships.json -{mem_counts['deleted']} +"
          f"{mem_counts['inserted']}  "
          f"({mem_counts['total_before']} -> {mem_counts['total_after']}); "
          f"member dicts {mem_counts['member_dicts_total']}")
    print(f"    coci_articulations.json     rekey {art_counts['rekeyed_single']}, "
          f"split {art_counts['split_into_multi']} (+{art_counts['records_added_by_split']} recs), "
          f"held {art_counts['held_unchanged']}  "
          f"({art_counts['total_before']} -> {art_counts['total_after']})")
    print(f"    coci_unified_courses.json   {cluster_counts['refs_replaced']} refs in "
          f"{cluster_counts['clusters_touched']} clusters")
    print(f"    coci_curation.json          key_rekeyed {cur_counts['key_rekeyed']}, "
          f"merge_into_repointed {cur_counts['merge_into_repointed']}")
    print()
    print("  GATES:")
    for gk, gv in gates.items():
        print(f"    {'PASS' if gv['pass'] else 'FAIL'}  {gk}")
        if not gv["pass"]:
            for k, v in gv.items():
                if k != "pass":
                    print(f"          {k}: {v}")
    print(f"  apply gate: {'ALL PASS' if all_pass else 'FAILED'}")

    if not all_pass and not dry_run:
        # We should never reach a committed-but-failed state: the fatal
        # collision asserts already exited; the cardinality/orphan gates are
        # data-derived and were validated by the dry-run. If a gate still fails
        # post-write, surface loudly (the operator must roll back the commit).
        print("  ::error::Apply gates FAILED AFTER writing — roll back the commit "
              "(git revert) and re-run the dry-run.")

    # ── Write receipts (only on --commit; dry-run leaves the tree clean) ──
    if not dry_run:
        out_today = os.path.join(OUT_DIR, today)
        os.makedirs(out_today, exist_ok=True)
        # Freeze the consumed plan alongside the receipts (rollback source).
        _atomic_write_json(os.path.join(out_today, "alias_map.json"), doc)
        with open(os.path.join(out_today, "validation.md"), "w", encoding="utf-8") as f:
            f.write(_render_validation_md(today, plan_date, doc, gates))
        with open(os.path.join(out_today, "report.md"), "w", encoding="utf-8") as f:
            f.write(_render_apply_md(today, plan_date, doc, course_counts,
                                     sing_counts, mem_counts, art_counts,
                                     cluster_counts, cur_counts, gates))
        print(f"  artifacts: {out_today}/{{report.md, validation.md, alias_map.json}}")

    if not all_pass:
        sys.exit(2)
    return gates


def _render_validation_md(today, plan_date, doc, gates):
    lines = [
        "# Cross-discipline Over-merge Re-mint — APPLY validation receipt",
        "",
        f"- generated: `{NOW_ISO}`",
        f"- plan sourced from: `kb/overmerge_out/{plan_date}/alias_map.json`",
        f"- aliases applied: **{len(doc.get('aliases', {}))}** "
        f"(held {doc.get('_held_count')}, split {doc.get('_split_count')})",
        "",
        "## Apply gates",
        "",
        "| gate | result | detail |",
        "|---|---|---|",
    ]
    for gk, gv in gates.items():
        emoji = "✅ PASS" if gv["pass"] else "❌ FAIL"
        detail = ", ".join(f"{k}={v}" for k, v in gv.items()
                           if k != "pass" and not k.startswith("_"))
        lines.append(f"| `{gk}` | {emoji} | {detail} |")
    lines.append("")
    return "\n".join(lines)


def _render_apply_md(today, plan_date, doc, course_counts, sing_counts,
                     mem_counts, art_counts, cluster_counts, cur_counts, gates):
    all_pass = all(g["pass"] for g in gates.values())
    lines = [
        "---",
        "title: Cross-discipline Over-merge Re-mint Apply",
        f"date: {today}",
        "status: APPLIED — kb files mutated in place",
        "tags: [remint, over-merge, member-top-divergence, apply, m-id]",
        "artifacts:",
        f"  - kb/overmerge_apply/{today}/alias_map.json",
        f"  - kb/overmerge_apply/{today}/validation.md",
        f"  - kb/overmerge_out/{plan_date}/alias_map.json (plan, pre-apply)",
        "---",
        "",
        "# Cross-discipline Over-merge Re-mint Apply",
        "",
        "## TL;DR",
        "",
        f"- Plan: `kb/overmerge_out/{plan_date}/alias_map.json` "
        f"(**{len(doc.get('aliases', {}))}** aliases — "
        f"held {doc.get('_held_count')}, split {doc.get('_split_count')}).",
        f"- Apply timestamp: `{NOW_ISO}`.",
        f"- Apply gate: **{'ALL PASS ✅' if all_pass else 'FAILED ❌'}**.",
        "",
        "## Per-file mutation counts",
        "",
        "| file | change |",
        "|---|---|",
        f"| `kb/coci_minted_courses.json` | "
        f"−{course_counts['deleted']} split old_mids, +{course_counts['inserted']} "
        f"corroborated pieces ({course_counts['total_before']} → "
        f"{course_counts['total_after']}) |",
        f"| `kb/coci_minted_singletons.json` | "
        f"+{sing_counts['inserted']} singleton pieces "
        f"({sing_counts['total_before']} → {sing_counts['total_after']}) |",
        f"| `kb/coci_minted_memberships.json` | "
        f"−{mem_counts['deleted']} +{mem_counts['inserted']} "
        f"({mem_counts['total_before']} → {mem_counts['total_after']}); "
        f"{mem_counts['member_dicts_total']} member dicts |",
        f"| `kb/coci_articulations.json` | "
        f"rekey {art_counts['rekeyed_single']}, split {art_counts['split_into_multi']} "
        f"(+{art_counts['records_added_by_split']} records), held "
        f"{art_counts['held_unchanged']} ({art_counts['total_before']} → "
        f"{art_counts['total_after']}) |",
        f"| `kb/coci_unified_courses.json` | "
        f"{cluster_counts['refs_replaced']} member-refs in "
        f"{cluster_counts['clusters_touched']} clusters |",
        f"| `kb/coci_curation.json` | "
        f"key_rekeyed {cur_counts['key_rekeyed']}, merge_into_repointed "
        f"{cur_counts['merge_into_repointed']} (of {cur_counts['total']}) |",
        "",
        "## Apply gates",
        "",
        "See `validation.md`. Summary: "
        + ", ".join(f"{gk.split('_')[0]} {'✅' if gv['pass'] else '❌'}"
                    for gk, gv in gates.items()) + ".",
        "",
        "## Downstream (handled by the apply workflow)",
        "",
        "1. **Re-run the auditor** (`kb/_row_audit.py`). Expected: "
        "`member_top_divergence` drops sharply (the split M-IDs are now "
        "discipline-pure pieces; only the held set + any residual mixed-unit "
        "rows remain).",
        "2. **Supabase kb_curation re-key** (`kb/_overmerge_apply_supabase.py`) — "
        "re-points any curation row whose `course_id` is a split old_mid to its "
        "plurality piece. Today 0 rows reference the flagged set (no-op), but "
        "the step runs for the pattern + future re-mints.",
        "3. **Commit + push** the mutated kb files + these receipts + the "
        "refreshed audit, inside the one cron window the workflow holds "
        "(`concurrency: daily-dashboard`).",
        "",
        "## Rollback",
        "",
        f"The frozen plan at `kb/overmerge_apply/{today}/alias_map.json` is the "
        "rollback source (each split's pieces + the old_id it came from). "
        "`git revert` the apply commit on `main`; the daily cron's concurrency "
        "group serializes against the apply workflow so no half-state is served.",
        "",
    ]
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Apply the cross-discipline over-merge re-mint plan.")
    ap.add_argument("--commit", action="store_true",
                    help="Actually write the real kb files (default: dry-run, "
                         "no writes).")
    args = ap.parse_args(argv)
    run_apply(dry_run=not args.commit)


if __name__ == "__main__":
    main()
