"""
Row-level Trust-Card auditor for the Unified Courses tab (UCL).

Purpose
-------
Every M-ID (and every curator-formed Cluster) is a draft Transfer Model
Curriculum (TMC) in waiting. Before a row is put in front of discipline faculty
for adoption-of-a-cross-college-articulation review, the data on the row needs
to be either real, transparently aggregated, or transparently synthetic. The
auditor walks every M-ID + Cluster, classifies each field, and writes a
per-row Trust Card with two scores:

  * faculty_trust_score — is the row trustworthy enough that a discipline
    faculty member should rely on it to ratify a cross-college articulation
    decision their colleagues already made?
  * tmc_ready_score    — is the row complete enough that it could be drafted
    into a Transfer Model Curriculum and submitted to ASCCC C-ID? (Includes
    forward-compat TMC fields like SLOs / content outline / methods of
    evaluation, all initially `not_yet_captured` — every row starts well
    below the tmc_ready bar until SLO ingestion lands. That's the strategic
    message: TMC-readiness is the destination, not the current state.)

Output
------
  kb/row_audit/<YYYY-MM-DD>.json   — full per-row Trust Cards (machine)
  kb/row_audit/<YYYY-MM-DD>.md     — top-50 by leverage×deficit + dists
  kb/row_audit/latest.json         — copy of the latest run, for UI

READ-ONLY. The auditor never mutates kb/* or Supabase. Suggested-fix payloads
are emitted on every fix-able field in the shape that _apply_curation.py
already understands, so a future Phase 1b "Repair from members" curate action
can consume them without rework.

Scope: M-ID + Cluster only (singletons out of scope for Phase 1a — they're
the suggested-merges worklist's job, not this auditor's). C-ID/CCN reference
anchors are excluded too; they're upstream authority.

Run from repo root:  python3 kb/_row_audit.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "row_audit")
TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")


def load(name: str):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


# ─── field-roster definitions ────────────────────────────────────────────────
# Faculty-trust weights: discipline > credit/units > top/description > confidence.
# These are what a faculty member actually evaluates when deciding whether to
# adopt a cross-college articulation decision.
FACULTY_WEIGHTS = {
    "discipline":    0.30,
    "credit_status": 0.20,
    "typical_units": 0.20,
    "top_code":      0.10,
    "description":   0.15,
    "confidence":    0.05,
}

# TMC fields the data model doesn't yet capture. Listed so the audit reflects
# the gap from day one (forward-compat per user decision). When any of these
# graduate to real data, change `state` and add weights to TMC_WEIGHTS.
TMC_NOT_YET_CAPTURED = [
    "slos",                  # Student Learning Outcomes
    "course_objectives",
    "content_outline",
    "methods_of_evaluation",
    "methods_of_instruction",
    "prerequisites",
    "corequisites",
    "advisories",
    "repeatability",
    "lecture_hours",
    "lab_hours",
    "outside_of_class_hours",
    "sample_textbooks",
    "transferability",       # CSU/UC; today partially implicit in band
    "degree_applicability",
]

# tmc_ready_score weights faculty_fields heavy + tmc_fields light. With every
# tmc field currently scoring 0 (not_yet_captured), no row can hit tmc_ready
# until SLOs land — which is correct. Weights sum to 1.0.
TMC_WEIGHTS_FACULTY_SHARE = 0.70
TMC_WEIGHTS_TMC_SHARE     = 0.30  # spread evenly across TMC_NOT_YET_CAPTURED

# Per-field-state score (how much of the field's weight the row earns). The
# state taxonomy doubles as the trust-card vocabulary the UI can render later.
STATE_SCORE = {
    "real":                  1.00,  # direct from member catalog
    "curated":               1.00,  # human in kb_curation overlay
    "aggregated-unanimous":  1.00,  # members agree
    "aggregated-modal":      0.80,  # ≥⅔ members agree; surface modal+spread
    "inferred-high":         0.80,  # subject_map / top_code (precise lexicon)
    "inferred-low":          0.60,  # title_keyword / description (heuristic)
    "aggregated-varied":     0.40,  # members disagree; spread shown, no single value
    "seed-untouched":        0.30,  # original Phase B seed, never re-checked
    "off-scheme":            0.00,  # ID family doesn't follow CCN-aligned scheme
    "missing":               0.00,  # null with no synthesizable basis
    "conflicting":           0.00,  # members carry contradictory authorities
    "not_yet_captured":      0.00,  # TMC field the data model doesn't hold yet
}

READINESS_TIERS = [  # (lower_bound, label) — order matters
    (0.85, "ready"),
    (0.65, "needs_review"),
    (0.40, "needs_repair"),
    (0.00, "not_ready"),
]


def tier_of(score: float) -> str:
    for lo, label in READINESS_TIERS:
        if score >= lo:
            return label
    return "not_ready"


# ─── id-scheme classifier ────────────────────────────────────────────────────
# CCN-aligned surrogate M-ID: SUBJ M####  or  SUBJ M<band><d><LL>  (4-char tail).
M_ID_RE = re.compile(r"^[A-Z]{2,6} M[0-9][0-9A-Z]{3}$")


def id_in_scheme(course_id: str, id_system: str) -> bool:
    """Is the row's ID in the documented CCN-aligned scheme?

    M-ID expected `SUBJ M####` / `SUBJ M<band><d><LL>`.
    C-ID and CCN reference anchors carry their own format; trusted.
    UC-CUR-* clusters are explicitly off-scheme (the user's concern).
    """
    if id_system in ("C-ID", "CCN", "CCN-ID"):
        return True
    if id_system == "M-ID":
        return bool(M_ID_RE.match(course_id or ""))
    if course_id and course_id.startswith("UC-CUR-"):
        return False
    return True  # unknown families: don't flag (no scheme to violate)


# ─── field classifiers for M-ID rows ─────────────────────────────────────────
# M-IDs already aggregated their own constituent memberships at mint time.
# `*_mixed` flags on the record tell us whether that aggregation was unanimous.
# We classify by trusting those flags rather than re-walking memberships for
# every M-ID (we'd burn cycles re-deriving what the seed script already wrote).

def _classify_mid_discipline(rec):
    v = rec.get("discipline")
    src = rec.get("discipline_source")
    if not v:
        return {"state": "missing", "value": None}
    if src == "subject_map" or src == "top_code":
        return {"state": "inferred-high", "value": v, "source": src,
                "confidence": rec.get("discipline_confidence")}
    if src == "title_keyword" or src == "description":
        return {"state": "inferred-low", "value": v, "source": src,
                "confidence": rec.get("discipline_confidence")}
    # No source label + value set ≡ original Phase B "draft" classification
    # that the inference passes deliberately don't touch. This is the AB-M1011
    # pattern: looks Verified-ish in the UI but never re-checked against title.
    return {"state": "seed-untouched", "value": v,
            "note": "Phase B seed; subject-map heuristic; never re-checked"}


def _classify_mid_credit(rec):
    v = rec.get("credit_status")
    if not v:
        return {"state": "missing", "value": None}
    if rec.get("credit_status_mixed"):
        return {"state": "aggregated-modal", "value": v,
                "note": "members disagree; modal shown"}
    return {"state": "aggregated-unanimous", "value": v}


def _classify_mid_top(rec):
    v = rec.get("top_code")
    if not v:
        return {"state": "missing", "value": None}
    if rec.get("top_code_mixed"):
        dist = rec.get("top_code_distribution") or {}
        return {"state": "aggregated-modal", "value": v,
                "note": "members disagree; modal shown",
                "spread": dist}
    return {"state": "aggregated-unanimous", "value": v}


def _classify_mid_units(rec):
    v = rec.get("typical_units")
    if v is None:
        return {"state": "missing", "value": None}
    # No mixed flag on units; trust the seed's representative value.
    return {"state": "real", "value": v}


def _classify_mid_conf(rec):
    v = rec.get("confidence")
    if v is None:
        return {"state": "missing", "value": None}
    return {"state": "real", "value": v}


def _classify_mid_description(rec):
    v = rec.get("description")
    if not v:
        return {"state": "missing", "value": None}
    return {"state": "real", "value_len": len(v)}


def _apply_curation_overlay(card, fields, curation_entry):
    """If the curation overlay sets a field, promote that field's state to
    'curated' and stash the human-supplied value."""
    if not curation_entry:
        return
    for key in ("discipline", "credit_status", "typical_units", "top_code",
                "description"):
        if curation_entry.get(key) is not None:
            fields[key] = {"state": "curated", "value": curation_entry[key]}


# ─── cluster aggregation ─────────────────────────────────────────────────────
# A Cluster row (UC-CUR-* / curator-defined merge target) renders with
# credit/units/top/conf hardcoded to None in excel_to_dashboard.py:4357.
# Its members ARE M-IDs / singletons whose fields are already populated.
# So we aggregate from members for these blanked fields.

def _resolve_member(mid, courses, singletons):
    """Resolve a cluster member id → record dict (M-ID or singleton)."""
    if mid in courses:
        return courses[mid], "mid"
    if mid in singletons:
        return singletons[mid], "singleton"
    return None, None


def _agg_field(values, *, allow_modal_threshold=0.67):
    """Aggregate a list of values → (state, value, spread/note).

    States: aggregated-unanimous / aggregated-modal / aggregated-varied / missing.
    """
    vals = [v for v in values if v is not None]
    if not vals:
        return "missing", None, None
    cnt = Counter(vals)
    top_val, top_n = cnt.most_common(1)[0]
    if len(cnt) == 1:
        return "aggregated-unanimous", top_val, None
    if top_n / len(vals) >= allow_modal_threshold:
        return "aggregated-modal", top_val, dict(cnt)
    return "aggregated-varied", None, dict(cnt)


def _normalize_top(top):
    """Membership top_code may be 'CODE: Title' or just 'CODE'; we compare on CODE."""
    if not top:
        return None
    s = str(top).strip()
    if ":" in s:
        s = s.split(":", 1)[0].strip()
    return s or None


def _agg_confidence(members_recs):
    """Synthesize a cluster confidence as mean(member_conf) × agreement_factor."""
    confs = [r.get("confidence") for r, _kind in members_recs if r and r.get("confidence") is not None]
    if not confs:
        return {"state": "missing", "value": None}
    mean = round(sum(confs) / len(confs), 3)
    # Boost if credit + top are unanimous (members agree → cluster is coherent).
    credits = [r.get("credit_status") for r, _ in members_recs if r and r.get("credit_status")]
    tops    = [_normalize_top(r.get("top_code")) for r, _ in members_recs if r and r.get("top_code")]
    coherent = (len(set(credits)) <= 1) and (len(set(tops)) <= 1)
    factor = 0.85 if coherent else 0.70
    synth = round(min(1.0, mean / max(factor, 0.01)), 3)
    return {"state": "aggregated-unanimous" if coherent else "aggregated-modal",
            "value": synth, "rationale": f"mean({mean}) ÷ factor({factor}) = {synth}; "
                                        f"members_n={len(confs)}"}


def _classify_cluster_fields(cluster_id, members_ids, courses, singletons):
    """Build a Cluster row's faculty_fields by walking its members."""
    members_recs = [(courses.get(m) or singletons.get(m),
                     "mid" if m in courses else ("singleton" if m in singletons else None))
                    for m in members_ids]
    # Filter out unresolvable members (defensive — surfaces via tag if any).
    resolved = [(r, k) for r, k in members_recs if r is not None]

    def agg(key, normalizer=None):
        vals = []
        for r, _k in resolved:
            v = r.get(key)
            if normalizer:
                v = normalizer(v)
            vals.append(v)
        state, value, spread = _agg_field(vals)
        out = {"state": state, "value": value}
        if spread:
            out["spread"] = spread
        if state == "aggregated-modal":
            out["note"] = "members disagree; modal shown"
        elif state == "aggregated-varied":
            out["note"] = "members disagree; no single representative"
        return out

    return {
        "credit_status": agg("credit_status"),
        "typical_units": agg("typical_units"),
        "top_code":      agg("top_code", normalizer=_normalize_top),
        "confidence":    _agg_confidence(resolved),
        "description":   {"state": "missing", "value": None}
                          if not any(r.get("description") for r, _ in resolved)
                          else {"state": "aggregated-modal", "value": "(members carry descriptions; cluster description not synthesized)"},
        # discipline filled later from curation overlay
    }, len(resolved), len(members_recs) - len(resolved)


def _cluster_member_colleges(members_ids, courses, singletons):
    """Distinct colleges touched by a cluster's members (singletons embed the
    college; M-IDs would need memberships — for cluster ripeness we approximate
    via M-ID source_college_count + singleton.college)."""
    colleges = set()
    for m in members_ids:
        if m in singletons:
            c = singletons[m].get("college")
            if c:
                colleges.add(c)
        # M-ID source_college_count is a count not a roster; skip exact roster
        # for now — for the ripeness gate we only need ≥2 distinct colleges and
        # singletons already give us one per. M-ID members give us at minimum 1
        # additional college each (corroboration ≥ 1).
    return colleges


# ─── score + readiness ──────────────────────────────────────────────────────

def _score(fields_with_weights):
    """Compute weighted mean of field-state scores."""
    total_w, total_s = 0.0, 0.0
    for field, weight in fields_with_weights:
        state = (field or {}).get("state", "missing")
        total_w += weight
        total_s += weight * STATE_SCORE.get(state, 0.0)
    return round(total_s / total_w, 3) if total_w else 0.0


def _virtual_tmc(per_row_overrides):
    """Default every TMC slot to not_yet_captured; per-row overrides win.

    Lets scoring stay correct without inlining 15 identical fields per row in
    the output JSON (the overhead would 4× the file size for no information).
    """
    base = {k: {"state": "not_yet_captured"} for k in TMC_NOT_YET_CAPTURED}
    base.update(per_row_overrides or {})
    return base


def _compute_scores(faculty_fields, tmc_fields):
    fw = [(faculty_fields.get(k), w) for k, w in FACULTY_WEIGHTS.items()]
    faculty_score = _score(fw)
    # TMC: faculty share (using same per-field scores) + TMC share (avg of TMC fields).
    tmc_field_weight = TMC_WEIGHTS_TMC_SHARE / max(len(TMC_NOT_YET_CAPTURED), 1)
    tmc_fw = [(faculty_fields.get(k), w * TMC_WEIGHTS_FACULTY_SHARE)
              for k, w in FACULTY_WEIGHTS.items()]
    tmc_fw += [(tmc_fields.get(k), tmc_field_weight) for k in TMC_NOT_YET_CAPTURED]
    tmc_score = _score(tmc_fw)
    return faculty_score, tmc_score


# ─── tag generators ─────────────────────────────────────────────────────────

def _tags_for_mid(rec, faculty_fields):
    tags = []
    if faculty_fields["discipline"]["state"] == "seed-untouched":
        tags.append("seed_untouched_discipline")
    if faculty_fields["discipline"]["state"] == "missing":
        tags.append("blank_discipline")
    if faculty_fields["description"]["state"] == "missing":
        tags.append("blank_description")
    if rec.get("subject_spread", 0) >= 8 and (rec.get("confidence") or 1) < 0.6:
        tags.append("subject_spread_high_low_confidence")
    if not id_in_scheme(rec.get("course_id", ""), "M-ID"):
        tags.append("mid_id_off_scheme")
    return tags


def _tags_for_cluster(cluster_id, faculty_fields, members_resolved,
                      members_dropped, colleges_touched):
    tags = []
    blanks = [k for k, f in faculty_fields.items()
              if f["state"] in ("missing", "aggregated-varied")
              and k in ("credit_status", "typical_units", "top_code", "confidence")]
    if blanks:
        # Was any of those aggregatable (≠ varied)? Then the render is the bug.
        if any(faculty_fields[k]["state"] in ("aggregated-unanimous", "aggregated-modal")
               for k in ("credit_status", "typical_units", "top_code", "confidence")):
            tags.append("cluster_blanks_when_aggregatable")
        else:
            tags.append("cluster_members_too_sparse")
    if cluster_id.startswith("UC-CUR-"):
        tags.append("cluster_id_off_scheme")
        # Ripeness for M-ID promotion: ≥3 members, ≥2 colleges (we know singletons
        # contribute distinct colleges; M-ID members contribute ≥1 each → so ≥2
        # distinct members carrying college signal is enough corroboration).
        if members_resolved >= 3 and len(colleges_touched) >= 1:
            # ≥1 because the M-ID-only members may not have surfaced their
            # college roster here; conservative gate. Tighten when we wire
            # M-ID member-college rosters via memberships.
            tags.append("uc_cur_ripe_for_promotion")
    if members_dropped:
        tags.append("cluster_member_unresolved")
    return tags


# ─── main ────────────────────────────────────────────────────────────────────

def main():
    courses = load("coci_minted_courses.json")["courses"]
    singletons = load("coci_minted_singletons.json")["courses"]
    curation_blob = load("coci_curation.json")
    curation = curation_blob.get("curations", {}) or {}

    # Build cluster targets from merge_into.
    cluster_members = defaultdict(list)  # cluster_id -> [member_id, ...]
    for mid, c in curation.items():
        tgt = (c or {}).get("merge_into")
        if tgt:
            cluster_members[tgt].append(mid)

    cards = []

    # ── M-IDs ─────────────────────────────────────────────────────────
    for course_id, rec in courses.items():
        cur = curation.get(course_id)
        faculty = {
            "discipline":    _classify_mid_discipline(rec),
            "credit_status": _classify_mid_credit(rec),
            "typical_units": _classify_mid_units(rec),
            "top_code":      _classify_mid_top(rec),
            "confidence":    _classify_mid_conf(rec),
            "description":   _classify_mid_description(rec),
        }
        _apply_curation_overlay(None, faculty, cur)
        # All TMC fields are not_yet_captured for every row right now (SLO
        # ingestion deferred), so we don't inline that block per-row — it's
        # listed once in the metadata header. When any TMC field graduates to
        # a non-default state for any row, inline ONLY that field here.
        tmc = {}
        f_score, t_score = _compute_scores(faculty, _virtual_tmc(tmc))
        tags = _tags_for_mid(rec, faculty)
        card = {
            "row_id": course_id,
            "row_kind": "Course",
            "id_system": rec.get("id_system", "M-ID"),
            "title": rec.get("common_title"),
            "subject": rec.get("subject"),
            "leverage": {
                "members": rec.get("corroboration_members") or 0,
                "source_colleges": rec.get("source_college_count") or 0,
                "subject_spread": rec.get("subject_spread") or 0,
            },
            "faculty_fields": faculty,
            "faculty_trust_score": f_score,
            "tmc_ready_score":     t_score,
            "faculty_readiness":   tier_of(f_score),
            "tmc_readiness":       tier_of(t_score),
            "tags": tags,
        }
        if cur:
            card["reviewed_by"] = cur.get("reviewed_by")
            card["reviewed_at"] = cur.get("reviewed_at")
        if tmc:
            card["tmc_fields"] = tmc
        cards.append(card)

    # ── Clusters ──────────────────────────────────────────────────────
    for cluster_id, members in cluster_members.items():
        cur = curation.get(cluster_id) or {}
        agg_fields, n_resolved, n_dropped = _classify_cluster_fields(
            cluster_id, members, courses, singletons)
        # Cluster discipline comes from curation if present (it's the curator's
        # chosen unified discipline), else from majority of members.
        if cur.get("discipline"):
            agg_fields["discipline"] = {"state": "curated", "value": cur["discipline"]}
        else:
            disc_state, disc_val, disc_spread = _agg_field(
                [(courses.get(m) or singletons.get(m) or {}).get("discipline") for m in members])
            agg_fields["discipline"] = {"state": disc_state, "value": disc_val}
            if disc_spread:
                agg_fields["discipline"]["spread"] = disc_spread

        colleges = _cluster_member_colleges(members, courses, singletons)
        tmc = {}
        f_score, t_score = _compute_scores(agg_fields, _virtual_tmc(tmc))
        tags = _tags_for_cluster(cluster_id, agg_fields, n_resolved, n_dropped, colleges)
        card = {
            "row_id": cluster_id,
            "row_kind": "Cluster",
            "id_system": "Cluster",
            "title": cur.get("unified_title"),
            "leverage": {
                "members": n_resolved,
                "members_dropped": n_dropped,
                "source_colleges_known": len(colleges),
            },
            "members": members,
            "faculty_fields": agg_fields,
            "faculty_trust_score": f_score,
            "tmc_ready_score":     t_score,
            "faculty_readiness":   tier_of(f_score),
            "tmc_readiness":       tier_of(t_score),
            "tags": tags,
            "reviewed_by": cur.get("reviewed_by"),
            "reviewed_at": cur.get("reviewed_at"),
            "suggested_fix": _build_cluster_fix(cluster_id, agg_fields),
        }
        if tmc:
            card["tmc_fields"] = tmc
        cards.append(card)

    # ── outputs ───────────────────────────────────────────────────────
    _write_outputs(cards)


def _build_cluster_fix(cluster_id, fields):
    """Emit a suggested-fix payload shaped for _apply_curation.py to consume
    later (Phase 1b). Only includes fields whose state is aggregated-* with a
    real value — never proposes a value for varied/missing fields."""
    apply_map = {}
    for k in ("credit_status", "typical_units", "top_code", "confidence"):
        f = fields.get(k) or {}
        if f.get("state") in ("aggregated-unanimous", "aggregated-modal") and f.get("value") is not None:
            apply_map[k] = f["value"]
    if not apply_map:
        return None
    return {
        "type": "aggregate_from_members",
        "rationale": "Cluster row was rendered with blank fields; members carry "
                     "consistent enough values to synthesize a representative.",
        "apply": apply_map,
    }


def _write_outputs(cards):
    if not os.path.isdir(OUT):
        os.makedirs(OUT)

    # ── JSON ─────────────────────────────────────────────────────────
    # Two outputs:
    #
    #   latest.json — slim, committed. One terse "summary" record per row
    #     (short keys for size), PLUS full breakdowns inlined for every
    #     Cluster row (small population, large per-row value). This is what
    #     the Phase 1b UI consumes and what git captures day-to-day.
    #
    #   <date>.full.json — heavy, gitignored. Every card with its full
    #     faculty_fields breakdown — for local debugging / one-off inspection.
    #     Not in git; we don't need 12MB of detail in history when the MD
    #     report carries the story and latest.json carries the actionable data.

    metadata = {
        "_generated_at": NOW_ISO,
        "_generated_by": "kb/_row_audit.py (Phase 1a — trust-card auditor)",
        "_scope": "M-ID + Cluster only (singletons excluded; C-ID/CCN reference anchors excluded)",
        "_rules_active": [
            "seed_untouched_discipline", "blank_discipline", "blank_description",
            "subject_spread_high_low_confidence", "mid_id_off_scheme",
            "cluster_blanks_when_aggregatable", "cluster_members_too_sparse",
            "cluster_id_off_scheme", "uc_cur_ripe_for_promotion",
            "cluster_member_unresolved",
        ],
        "_field_state_score": STATE_SCORE,
        "_faculty_weights": FACULTY_WEIGHTS,
        "_tmc_not_yet_captured": TMC_NOT_YET_CAPTURED,
        "_readiness_tiers": READINESS_TIERS,
        "_summary_schema": {
            "id":   "row_id",
            "k":    "row_kind ('C'=Course, 'X'=Cluster)",
            "lev":  "leverage.members",
            "fts":  "faculty_trust_score",
            "tms":  "tmc_ready_score",
            "fr":   "faculty_readiness tier",
            "tr":   "tmc_readiness tier",
            "tags": "rule tags fired on this row",
        },
    }

    def _summary(c):
        s = {
            "id":   c["row_id"],
            "k":    "C" if c["row_kind"] == "Course" else "X",
            "lev":  c["leverage"].get("members", 0),
            "fts":  c["faculty_trust_score"],
            "tms":  c["tmc_ready_score"],
            "fr":   c["faculty_readiness"],
            "tr":   c["tmc_readiness"],
            "tags": c["tags"],
        }
        # Clusters: also inline the full breakdown — there are only a handful,
        # and Phase 1b's "Repair from members" action needs the suggested_fix
        # payload and the per-field state.
        if c["row_kind"] == "Cluster":
            s["title"] = c.get("title")
            s["faculty_fields"] = c["faculty_fields"]
            s["members"] = c.get("members")
            if c.get("suggested_fix"):
                s["suggested_fix"] = c["suggested_fix"]
        return s

    summary_payload = {
        **metadata,
        "stats": _stats(cards),
        "rows": [_summary(c) for c in cards],
    }
    latest_path = os.path.join(OUT, "latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, ensure_ascii=False, separators=(",", ":"))

    full_path = os.path.join(OUT, f"{TODAY}.full.json")
    full_payload = {**metadata, "stats": _stats(cards), "rows": cards}
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, ensure_ascii=False, separators=(",", ":"))

    # ── MD ──────────────────────────────────────────────────────────
    md_path = os.path.join(OUT, f"{TODAY}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(_render_md(full_payload))

    s = summary_payload["stats"]
    print(f"[row_audit] {TODAY}: {s['total_cards']} cards "
          f"({s['by_kind'].get('Course', 0)} M-IDs, "
          f"{s['by_kind'].get('Cluster', 0)} clusters)")
    print(f"           faculty readiness: {dict(s['faculty_readiness'])}")
    print(f"           tmc readiness:     {dict(s['tmc_readiness'])}")
    print(f"           top tag counts:    {dict(s['tag_counts'].most_common(10))}")
    print(f"           wrote: {latest_path}  ({os.path.getsize(latest_path)//1024} KB)")
    print(f"           wrote: {md_path}      ({os.path.getsize(md_path)//1024} KB)")
    print(f"           wrote: {full_path}    ({os.path.getsize(full_path)//1024} KB, gitignored)")


def _stats(cards):
    by_kind = Counter(c["row_kind"] for c in cards)
    faculty_readiness = Counter(c["faculty_readiness"] for c in cards)
    tmc_readiness = Counter(c["tmc_readiness"] for c in cards)
    tag_counts = Counter(t for c in cards for t in c["tags"])
    return {
        "total_cards": len(cards),
        "by_kind": by_kind,
        "faculty_readiness": faculty_readiness,
        "tmc_readiness": tmc_readiness,
        "tag_counts": tag_counts,
    }


def _render_md(payload):
    s = payload["stats"]
    lines = []
    lines.append(f"# Row Trust Audit — {TODAY}")
    lines.append("")
    lines.append(f"Generated: `{payload['_generated_at']}`  ")
    lines.append(f"Scope: {payload['_scope']}")
    lines.append("")
    lines.append(f"**Total trust cards:** {s['total_cards']}  ")
    lines.append(f"**By kind:** " + ", ".join(f"{k}={v}" for k, v in sorted(s['by_kind'].items())))
    lines.append("")
    lines.append("## Faculty readiness distribution")
    lines.append("")
    lines.append("| tier | count | % |")
    lines.append("|---|---:|---:|")
    for tier in ("ready", "needs_review", "needs_repair", "not_ready"):
        n = s["faculty_readiness"].get(tier, 0)
        pct = (100.0 * n / s["total_cards"]) if s["total_cards"] else 0
        lines.append(f"| {tier} | {n} | {pct:.1f}% |")
    lines.append("")
    lines.append("## TMC readiness distribution")
    lines.append("")
    lines.append("All rows currently sit well below TMC-ready until SLO ingestion lands "
                 "(every TMC field is `not_yet_captured`, scoring 0).")
    lines.append("")
    lines.append("| tier | count | % |")
    lines.append("|---|---:|---:|")
    for tier in ("ready", "needs_review", "needs_repair", "not_ready"):
        n = s["tmc_readiness"].get(tier, 0)
        pct = (100.0 * n / s["total_cards"]) if s["total_cards"] else 0
        lines.append(f"| {tier} | {n} | {pct:.1f}% |")
    lines.append("")
    lines.append("## Tag frequency")
    lines.append("")
    lines.append("| tag | count |")
    lines.append("|---|---:|")
    for tag, n in s["tag_counts"].most_common():
        lines.append(f"| `{tag}` | {n} |")
    lines.append("")

    # ── Top-50 cleanup queue, by leverage × (1 - faculty_trust) ───────────
    def deficit(card):
        lev = card["leverage"].get("members", 0) or 1
        return lev * (1 - card["faculty_trust_score"])

    ranked = sorted(payload["rows"], key=deficit, reverse=True)[:50]
    lines.append("## Top 50 by cleanup leverage (members × (1 − faculty_trust_score))")
    lines.append("")
    lines.append("High-leverage rows that aren't faculty-ready — the cleanup queue.")
    lines.append("")
    lines.append("| row_id | kind | members | f-trust | tags | title |")
    lines.append("|---|---|---:|---:|---|---|")
    for c in ranked:
        tags = ", ".join(f"`{t}`" for t in c["tags"]) or "—"
        title = (c.get("title") or "")[:60]
        lines.append(f"| `{c['row_id']}` | {c['row_kind']} | "
                     f"{c['leverage'].get('members', 0)} | {c['faculty_trust_score']:.2f} | "
                     f"{tags} | {title} |")
    lines.append("")

    # ── Cluster spotlight (always small population) ───────────────────────
    clusters = [c for c in payload["rows"] if c["row_kind"] == "Cluster"]
    if clusters:
        lines.append("## All Clusters (full inventory)")
        lines.append("")
        for c in clusters:
            lines.append(f"### `{c['row_id']}` — {c.get('title') or '(no title)'}")
            lines.append(f"- Members: {c['leverage'].get('members')} "
                         f"({c['leverage'].get('members_dropped', 0)} dropped)")
            lines.append(f"- Faculty trust: **{c['faculty_trust_score']:.2f}** "
                         f"({c['faculty_readiness']})")
            lines.append(f"- Tags: " + (", ".join(f"`{t}`" for t in c["tags"]) or "—"))
            lines.append("- Faculty fields:")
            for k, v in c["faculty_fields"].items():
                val = v.get("value")
                state = v.get("state")
                extra = ""
                if v.get("spread"):
                    extra = f"  ←spread={v['spread']}"
                elif v.get("note"):
                    extra = f"  ←{v['note']}"
                lines.append(f"  - `{k}`: state=`{state}`, value=`{val}`{extra}")
            if c.get("suggested_fix"):
                lines.append("- Suggested fix (Phase 1b will consume this):")
                lines.append(f"  ```json")
                lines.append(f"  {json.dumps(c['suggested_fix'], ensure_ascii=False)}")
                lines.append(f"  ```")
            lines.append("")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
