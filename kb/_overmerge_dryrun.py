"""
Cross-discipline over-merge re-mint dry-run.

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, nothing to Supabase, nothing
to live curation. Reads the auditor's `member_top_divergence` flagged set (from
kb/row_audit/latest.json) plus the current M-ID catalog + memberships, simulates
splitting each flagged M-ID into discipline-pure pieces, and produces reviewable
artifacts under kb/overmerge_out/<date>/.

Pass-1 split logic (title/subject/description-aware — the FIRST matching branch
wins per flagged M-ID):
  1. REVIEW-HOLD — sister-pair / interdisciplinary-token courses are HELD for
     curator veto, never split.
  2. TITLE→DISCIPLINE KEEP-WHOLE — if the common_title matches a curator
     keep_whole entry in kb/overmerge_title_discipline.json, ONE piece = all
     members, discipline = the mapped MQ discipline (these are single courses
     whose TOP/subject merely varies by college — the title is ground truth).
  3. CONTAINER TITLES ("Independent Study", "Special Topics", …) — detected for
     reporting, then fall through to the per-member split (step 4).
  4. MEMBER-DISCIPLINE CASCADE + SPLIT (default) — resolve EACH member's
     discipline by priority a) SUBJ4→discipline (inverted from
     discipline_canonical_subj4.json) b) subject_map (discipline_inference.json)
     c) TOP→discipline (top_discipline_map.json) d) M-ID description
     (SAFE_PHRASES plurality). Group members by resolved discipline; members that
     resolve to None stay SUBJECT-SEPARATED (each raw subject its own group) so
     blank-discipline members are never lumped into a mislabeled bucket. Each
     group → a piece, stamped `disc_source` for the report.

Artifacts under kb/overmerge_out/<date>/:

  report.md          — human summary: totals, split-factor distribution, the 4
                       apply gates (PASS/FAIL), top-30 split previews, the
                       review-hold list with reasons, article + cluster impact.
  alias_map.json     — old M-ID -> {held, old_id_retired, splits:[…]} (the
                       canonical re-key receipt + rollback source for the apply).
  review_hold.json   — flagged M-IDs HELD for curator veto (likely-legitimate
                       interdisciplinary courses), NOT split — high-precision
                       sister-pair / interdisciplinary-token heuristic.
  collisions.json    — new course_ids that collide with an existing id or with
                       another new id (must be EMPTY if allocation is correct).

Re-runnable. The root cause is in kb/_seed_coci_minted_mids.py (groups raw
courses by normalized title alone); this dry-run plans the surgical re-key of the
known-bad 1,299 flagged M-IDs, mirroring the SUBJ4 / CourseControlNumber re-mint
dry-runs (kb/_subj4_dryrun.py). Apply gate's green light = all four gates PASS.

Background: docs/kb-notes/over-merge-remint-scope.md (forks + locked decisions)
and the "2026-05-29 — member_top_divergence" section of
docs/unified_courses_audit_lessons.md.

Run from repo root:  python3 kb/_overmerge_dryrun.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
UNIFIED_COURSES = os.path.join(HERE, "coci_unified_courses.json")
TOP_DISC_MAP = os.path.join(HERE, "top_discipline_map.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
SUBJECT_MAP = os.path.join(HERE, "discipline_inference.json")
TITLE_DISC_MAP = os.path.join(HERE, "overmerge_title_discipline.json")
ROW_AUDIT = os.path.join(HERE, "row_audit", "latest.json")
CCN_REF = os.path.join(HERE, "reference", "ccn_courses.json")
CID_REF = os.path.join(HERE, "reference", "cid_descriptors.json")
OUT_DIR = os.path.join(HERE, "overmerge_out")

SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
# A current M-ID course_id is "<SUBJ> M<band><suffix>" — suffix is 3 digits
# (corroborated) or digit + 2 letters (stand-alone). Same shape as the SUBJ4
# re-mint produced; reused here for collision-aware sequence reservation.
COURSE_ID_RE = re.compile(r"^([A-Z]+) M(\d)([A-Z0-9]{3})$")
# Member top_code in the memberships file is "NNNN.NN: Program Title" or a bare
# "NNNN.NN". Parse the leading 4-digit code (+ optional .NN).
MEMBER_TOP_RE = re.compile(r"^\s*(\d{4})(\.\d{2})?")
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
# Generic / scaffolding title tokens — copied verbatim from the 2026-05-22 +
# Phase 1e re-mints so the within-bucket sort order is stable across re-mints.
TITLE_STOP = {"and", "the", "of", "for", "with", "into", "from", "this", "that",
              "an", "a", "to", "in", "on", "or", "as", "by", "at", "is", "be"}

# Curated interdisciplinary-compound title tokens (locked in the scope doc).
# A flagged M-ID whose normalized title carries any of these is HELD for curator
# veto rather than auto-split — these names denote a single course that genuinely
# straddles two TOP divisions ("Photojournalism" = Photography + Journalism).
INTERDISCIPLINARY_TOKENS = {
    "photojournalism", "ethnoecology", "bioethics", "ethnomusicology",
    "biostatistics", "biotechnology", "psycholinguistics", "geopolitics",
    "biogeography", "biochemistry", "ethnobotany", "sociolinguistics",
}

# Known sister / adjacent discipline pairs — COPIED VERBATIM from
# kb/_row_audit.py (keep in sync). A flagged M-ID that splits into exactly two
# division groups whose two resolved disciplines form one of these pairs is a
# likely-legitimate cross-discipline course → HELD for curator veto, not split.
SISTER_PAIRS = {
    frozenset({"Kinesiology", "Physical Education"}),                  # 554 rows
    frozenset({"Computer Information Systems", "Computer Science"}),   #  95
    frozenset({"Carpentry", "Construction Technology"}),               #  75
    frozenset({"Commercial Music", "Music"}),                          #  70
    frozenset({"Stagecraft", "Theater Arts"}),                         #  63
    frozenset({"Business", "Office Technologies"}),                    #  41
    frozenset({"Construction Management", "Construction Technology"}), #  40
    frozenset({"Drama/Theater Arts", "Theater Arts"}),                 #  40
    frozenset({"Art", "Graphic Arts"}),                                #  37
    frozenset({"Culinary Arts/Food Technology",
               "Dietetics/Nutritional Science"}),                      #  36
    frozenset({"Law", "Legal Assisting"}),                             #  36
    frozenset({"Business", "Small Business Development"}),             #  34
    frozenset({"Film and Media Studies", "Media Production"}),         #  32
    frozenset({"Art", "Multimedia"}),                                  #  31
    frozenset({"Chicano Studies", "Ethnic Studies"}),                  #  31
    frozenset({"Computer Information Systems", "Office Technologies"}), # 25
    frozenset({"Sign Language, American",
               "Sign Language/ English Interpreting"}),                #  25
    frozenset({"Licensed Vocational Nursing", "Nursing"}),             #  24
    frozenset({"Graphic Arts", "Multimedia"}),                         #  20
    frozenset({"Business", "Management"}),                             #  18
    frozenset({"Business", "Marketing"}),                              #  17
}

# ── Container titles ─────────────────────────────────────────────────────────
# Course-scaffolding titles ("Independent Study", "Special Topics") that DON'T
# name a discipline — different colleges run them in unrelated program areas. A
# container is NEVER kept whole; it always falls through to the per-member
# discipline split (step 4). Detecting it is purely for the report (so a curator
# sees WHY a row was split many ways) and as a guard that a container can never
# be accidentally swept into the title→discipline keep-whole map. Substring,
# lowercased, against the M-ID common_title.
CONTAINER_PATTERNS = (
    "independent study", "independent studies", "independent project",
    "special topic", "selected topic", "directed study", "directed studies",
    "special project", "field studies", "regional field studies",
    "undergraduate research", "topics in",
)
# False-positive guard: "Independent Living" is a concrete discipline (DSPS /
# adapted ed), NOT an independent-study container.
CONTAINER_EXCLUDE = ("independent living",)

# Safe, high-precision description phrase set — COPIED VERBATIM from
# kb/_infer_disciplines_from_desc.py (keep in sync). Only terms decisive inside
# long prose. Used as the LAST cascade rung (step 4d) for blank members when the
# M-ID-level description names a single field; plurality scoring with a
# unique-winner gate (ties skipped) mirrors that module exactly.
SAFE_PHRASES = [
    (["welding", "gas tungsten arc", "gas metal arc", "shielded metal arc",
      "nondestructive testing", "non-destructive testing"], "Welding"),
    (["automotive"], "Automotive Technology"),
    (["dental"], "Dental Technology"),
    (["phlebotomy"], "Health Care Ancillaries"),
    (["cosmetology"], "Cosmetology"),
    (["barbering"], "Barbering"),
    (["heating, ventilation", "hvac", "refrigeration"], "Air Conditioning, Refrigeration, Heating"),
    (["paramedic", "emergency medical technician", "basic life support",
      "advanced cardiac life support"], "Emergency Medical Technologies"),
    (["surgical technolog", "operating room"], "Surgical Technology"),
    (["computer numerical control", "cnc machin"], "Machine Tool Technology"),
    (["industrial robot", "robotics"], "Robotics"),
    (["cybersecurity", "cyber security", "penetration testing"], "Computer Information Systems"),
    (["court reporting", "stenograph"], "Court Reporting"),
    (["embalming", "funeral service", "funeral director", "mortuary"], "Mortuary Science"),
    (["viticulture", "enology"], "Agricultural Production"),
    (["solidworks", "autocad", "computer-aided drafting", "computer aided drafting"], "Drafting/CADD"),
    (["photovoltaic"], "Environmental Technologies"),
    (["radiographic", "fluoroscopy"], "Radiological Technology"),
    (["veterinary"], "Registered Veterinary Technician"),
    (["aircraft", "airframe", "flight instructor", "private pilot"], "Aviation"),
    (["sonograph", "ultrasound"], "Diagnostic Medical Technology"),
    (["upholster"], "Upholstering"),
    (["locksmith"], "Locksmithing"),
    (["gunsmith"], "Gunsmithing"),
    (["floral design"], "Ornamental Horticulture"),
    (["sign language interpret", "american sign language"], "Sign Language, American"),
    (["pharmacy technician"], "Pharmacy Technology"),
]
_DESC_RULES = [
    (re.compile(r"\b(?:%s)\b" % "|".join(re.escape(t) for t in terms), re.I), disc)
    for terms, disc in SAFE_PHRASES
]


def classify_description(desc):
    """Plurality-scored discipline from a description via SAFE_PHRASES; unique
    winner only (tie → None). Mirrors _infer_disciplines_from_desc.classify."""
    if not desc or len(desc.strip()) < 20:
        return None
    score = Counter()
    for pat, disc in _DESC_RULES:
        n = len(pat.findall(desc))
        if n:
            score[disc] += n
    if not score:
        return None
    ranked = score.most_common()
    if len(ranked) > 1 and ranked[1][1] == ranked[0][1]:
        return None  # tie — ambiguous, skip
    return ranked[0][0]


def ntitle(t):
    """Normalized title — lowercased, non-alnum stripped, stopwords dropped,
    tokens sorted. Used as the deterministic within-bucket sort key so the
    dry-run produces identical id allocations across runs."""
    if not t:
        return ""
    t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
    tokens = [x for x in t.split() if x and x not in TITLE_STOP]
    return " ".join(sorted(tokens))


def standalone_code(n):
    """0-based seq → '<d><L><L>' (base 10·26·26 = 6,760 per bucket). Copied
    from _subj4_dryrun — the stand-alone suffix scheme is unchanged."""
    d, r = divmod(n, 26 * 26)
    l1, l2 = divmod(r, 26)
    return f"{d}{LETTERS[l1]}{LETTERS[l2]}"


def parse_member_top(s):
    """('NNNN.NN: Program Title') → ('NNNN.NN', 'Program Title').
    Bare 'NNNN.NN' → ('NNNN.NN', None). No numeric code → (None, label_or_None).
    Mirrors kb/_row_audit.py::_parse_member_top so the partition matches exactly
    the auditor that produced the flagged set."""
    if not s:
        return None, None
    code, _, title = str(s).partition(":")
    m = MEMBER_TOP_RE.match(code)
    if not m:
        return None, (title.strip() or None)
    return m.group(1) + (m.group(2) or ".00"), (title.strip() or None)


def fam2(code):
    """2-digit TOP division = first 2 chars of a 'NNNN.NN' code."""
    return code[:2] if code else None


def load_id_reservations():
    """Per-(SUBJ4, band) set of sequence numbers reserved by C-IDs and CCNs.

    The M-ID corroborated format `SUBJ M<band><seq:03d>` shares structure with
    CCN's `SUBJ C<band><seq:03d>` (only the prefix letter differs) and with the
    embedded sequence of C-ID `SUBJ <band><seq2>`. The allocator skips any seq
    already taken by a CCN/C-ID in the same (SUBJ4, band) bucket so a fresh M-ID
    never collides with — or reads as — an official identifier. Copied from
    _subj4_dryrun.load_id_reservations.

    Returns: {(subj4, band): set(reserved_seq_ints)}
    """
    reservations = defaultdict(set)

    # CCN courses → parse `C<band><seq3>` (e.g. BIOL C1001 → reserve seq 001, band 1).
    if os.path.exists(CCN_REF):
        with open(CCN_REF, encoding="utf-8") as f:
            ccns = json.load(f).get("courses", [])
        ccn_re = re.compile(r"^C(\d)(\d{3})")
        for c in ccns:
            subj = c.get("subject") or ""
            num = c.get("number") or ""
            if not SUBJ4_RE.match(subj):
                continue
            m = ccn_re.match(num)
            if not m:
                continue
            band, seq = m.group(1), int(m.group(2))
            reservations[(subj, band)].add(seq)

    # C-ID descriptors → parse `<band><seq2>` (3-digit number; leading digit =
    # level/band). Single-subject form only; hyphenated (AG-PS 104) skipped —
    # they don't share a SUBJ4 with any M-ID.
    if os.path.exists(CID_REF):
        with open(CID_REF, encoding="utf-8") as f:
            cids = json.load(f).get("descriptors", [])
        cid_re = re.compile(r"^([A-Z]+)\s+(\d)(\d{2})([A-Z]*)$")
        for d in cids:
            desc = (d.get("descriptor") or "").strip()
            m = cid_re.match(desc)
            if not m:
                continue
            subj, band, seq2, _suff = m.groups()
            if not SUBJ4_RE.match(subj):
                continue
            reservations[(subj, band)].add(int(seq2))

    return dict(reservations)


def main():
    # ── Load inputs (all read-only) ─────────────────────────────────────────
    with open(ROW_AUDIT, encoding="utf-8") as f:
        audit = json.load(f)
    flagged_ids = [r["id"] for r in audit.get("rows", [])
                   if "member_top_divergence" in (r.get("tags") or [])]
    flagged_set = set(flagged_ids)

    with open(COURSES, encoding="utf-8") as f:
        courses = json.load(f)["courses"]
    with open(SINGLETONS, encoding="utf-8") as f:
        singletons = json.load(f)["courses"]
    with open(MEMBERSHIPS, encoding="utf-8") as f:
        memberships = json.load(f)["memberships"]

    # top_discipline_map: drop None values + the 4930.* academic catch-all
    # (deliberately unmapped — see CLAUDE.md). What's left maps a full 6-digit
    # TOP code → MQ discipline.
    top_disc = {}
    if os.path.exists(TOP_DISC_MAP):
        with open(TOP_DISC_MAP, encoding="utf-8") as f:
            raw = json.load(f).get("map", {}) or {}
        for k, v in raw.items():
            if v is None or k.startswith("4930."):
                continue
            top_disc[k] = v

    # discipline → canonical 4-letter SUBJ (curator-confirmed where reviewed),
    # plus the INVERTED map: every SUBJ code a discipline owns (its
    # canonical_subj4 AND every code in variants_observed) → that discipline.
    # First-wins on the handful of cross-discipline collisions (e.g. CISC, COSM,
    # PHYS) — see CLAUDE.md §11 subject_collision_signal. This is cascade rung
    # (a): a member whose `subject` is a key resolves to that discipline.
    canon_map = {}
    subj4_to_disc = {}
    if os.path.exists(CANONICAL):
        with open(CANONICAL, encoding="utf-8") as f:
            canon_doc = json.load(f)
        for disc, rec in (canon_doc.get("disciplines", {}) or {}).items():
            rec = rec or {}
            c = rec.get("canonical_subj4")
            if c and SUBJ4_RE.match(c):
                canon_map[disc] = c
            codes = set((rec.get("variants_observed") or {}).keys())
            if c:
                codes.add(c)
            for code in codes:
                subj4_to_disc.setdefault(code, disc)  # first-wins on conflict

    def canonical_subj4(discipline):
        """discipline → curator-confirmed 4-letter SUBJ, else None."""
        return canon_map.get(discipline) if discipline else None

    # subject_map (discipline_inference.json): member subject code → discipline.
    # Cascade rung (b), consulted only when the inverted SUBJ4 map missed.
    subject_map = {}
    if os.path.exists(SUBJECT_MAP):
        with open(SUBJECT_MAP, encoding="utf-8") as f:
            subject_map = (json.load(f) or {}).get("subject_map", {}) or {}

    # Curator title→discipline keep-whole map (overmerge_title_discipline.json).
    # Branch 2: a flagged M-ID whose lowercased common_title CONTAINS a keep_whole
    # key is kept as ONE piece, discipline = the mapped MQ discipline. The
    # `_needs_check` section is intentionally ignored (not yet confirmed).
    title_keep_whole = []  # list of (lowercased_substring, discipline)
    if os.path.exists(TITLE_DISC_MAP):
        with open(TITLE_DISC_MAP, encoding="utf-8") as f:
            tdoc = json.load(f) or {}
        for sub, rec in (tdoc.get("entries", {}) or {}).items():
            rec = rec or {}
            if rec.get("keep_whole") and rec.get("discipline"):
                title_keep_whole.append((sub.lower(), rec["discipline"]))

    def member_discipline(subject, top_code, desc):
        """Cascade a member to a discipline by priority a→d; returns
        (discipline_or_None, disc_source). disc_source ∈ {subj4, subject_map,
        top_code, description, None}."""
        if subject in subj4_to_disc:
            return subj4_to_disc[subject], "subj4"
        if subject in subject_map:
            return subject_map[subject], "subject_map"
        code, _ = parse_member_top(top_code)
        if code and code in top_disc:
            return top_disc[code], "top_code"
        d = classify_description(desc)
        if d:
            return d, "description"
        return None, None

    # ── Index existing ids for collision-avoidance + sequence reservation ────
    # Existing corroborated seqs + standalone suffixes, per (SUBJ4, band), drawn
    # from the UNTOUCHED catalog (all minted M-IDs not in the flagged-being-split
    # set, plus every singleton). A fresh id must avoid these or the apply would
    # silently overwrite a real row. (Mirrors _subj4_dryrun's pre-reservation.)
    existing_corr_seqs = defaultdict(set)      # (s4, band) -> set(int seq)
    existing_sing_suffixes = defaultdict(set)  # (s4, band) -> set(3-char suffix)
    all_existing_ids = set()                    # every id in courses ∪ singletons

    def _parse_id(cid):
        m = COURSE_ID_RE.match(cid or "")
        if not m:
            return None
        return m.group(1), m.group(2), m.group(3)  # subj4, band, suffix

    for cid in courses:
        all_existing_ids.add(cid)
        # Flagged M-IDs may RETIRE or be re-keyed; their old seq must not be
        # reserved (the plurality keeps it via a separate path, handled below).
        if cid in flagged_set:
            continue
        parsed = _parse_id(cid)
        if not parsed:
            continue
        s4, band, suffix = parsed
        if suffix.isdigit():
            existing_corr_seqs[(s4, band)].add(int(suffix))
        elif re.match(r"^\d[A-Z]{2}$", suffix):
            existing_sing_suffixes[(s4, band)].add(suffix)

    for cid in singletons:
        all_existing_ids.add(cid)
        parsed = _parse_id(cid)
        if not parsed:
            continue
        s4, band, suffix = parsed
        if suffix.isdigit():
            existing_corr_seqs[(s4, band)].add(int(suffix))
        elif re.match(r"^\d[A-Z]{2}$", suffix):
            existing_sing_suffixes[(s4, band)].add(suffix)

    id_reservations = load_id_reservations()  # CCN/C-ID seq reservations

    # ── Pass 1: per flagged M-ID — title/subject/description-aware split ──────
    # A "plan" per M-ID records its pieces (groups), plus the held / retire
    # decision. Groups are built but NOT yet allocated ids (Pass 2). The FIRST
    # matching branch wins per M-ID: (1) review-hold, (2) title keep-whole,
    # (3) container [→ split], (4) member-discipline cascade split.
    plans = {}                # mid -> plan dict
    held = {}                 # mid -> hold record (held M-IDs are NOT split)
    retiring_old_ids = set()  # old M-IDs whose id retires (no group keeps it)
    n_blank_members = 0       # members the cascade couldn't resolve (→ raw-subject)
    n_container = 0           # M-IDs whose title matched a container pattern

    def _mk_group(grp_members, *, discipline, disc_source, subj4, band, norm):
        """Assemble one piece descriptor from a member list. kind = corroborated
        iff ≥2 distinct colleges. Mirrors the field set every downstream pass
        reads (div, members, colleges, kind, discipline, subj4, band, rep_title,
        norm_title, n_members, control_numbers) + the new disc_source."""
        colleges = sorted({m.get("college") for m in grp_members if m.get("college")})
        return {
            # `div` is repurposed as a traceability key: the group's discipline
            # (or its raw-subject fallback) rather than a TOP division. Downstream
            # passes use it only as an opaque label / sort tie-break.
            "div": discipline or subj4 or "?",
            "members": grp_members,
            "colleges": colleges,
            "kind": "corroborated" if len(colleges) >= 2 else "singleton",
            "discipline": discipline,
            "disc_source": disc_source,
            "subj4": subj4,
            "band": band,
            "rep_title": "",  # filled by caller (parent title)
            "norm_title": norm,
            "n_members": len(grp_members),
            "control_numbers": sorted(
                {m.get("control_number") for m in grp_members if m.get("control_number")}
            ),
        }

    def cascade_split(members, *, band, norm, desc, old_subj4):
        """Default branch: group members by resolved discipline (cascade a→d).
        Members resolving to None are SUBJECT-SEPARATED — each distinct raw
        subject becomes its own blank-discipline group (never lumped). Pure (no
        side effects) so it can also serve as the sister-pair hold probe. Returns
        a list of piece descriptors."""
        by_disc = defaultdict(list)   # discipline -> members (resolved)
        disc_src = {}                 # discipline -> disc_source of first member
        by_raw = defaultdict(list)    # raw subject -> members (unresolved)
        # Collapse members sharing a control_number into ONE atomic unit first.
        # A shared CourseControlNumber means a cross-listed course (one course
        # offered under two subject codes at one college, e.g. DMA C201 / DMAC
        # 201) — it is a SINGLE course and must land in ONE piece, else the
        # apply (which gathers each piece's members by control_number) would
        # double-count it (V2 member-conservation failure). Members without a CN
        # are their own unit. The unit's discipline = the modal of its members'
        # resolved disciplines; ties/all-None fall to the raw-subject bucket
        # keyed by the unit's modal subject.
        cn_units = defaultdict(list)
        for i, m in enumerate(members):
            cn = m.get("control_number")
            cn_units[cn if cn else ("_nocn", i)].append(m)
        for umembers in cn_units.values():
            resolved = [member_discipline(m.get("subject"), m.get("top_code"), desc)
                        for m in umembers]
            discs = [d for d, _ in resolved if d]
            if discs:
                d = Counter(discs).most_common(1)[0][0]
                src = next(s for dd, s in resolved if dd == d)
                by_disc[d].extend(umembers)
                disc_src.setdefault(d, src)
            else:
                subj = Counter(m.get("subject") or "" for m in umembers).most_common(1)[0][0]
                by_raw[subj].extend(umembers)
        groups = []
        for d in sorted(by_disc):
            subj4 = canonical_subj4(d) or old_subj4
            groups.append(_mk_group(by_disc[d], discipline=d,
                                    disc_source=disc_src[d], subj4=subj4,
                                    band=band, norm=norm))
        for raw_subj in sorted(by_raw):
            # Blank-discipline group keyed by its raw subject. subj4 = the raw
            # subject if it's already 4 uppercase letters, else the old M-ID's.
            subj4 = raw_subj if SUBJ4_RE.match(raw_subj) else old_subj4
            g = _mk_group(by_raw[raw_subj], discipline=None,
                          disc_source="raw_subject", subj4=subj4,
                          band=band, norm=norm)
            g["div"] = "RAW:" + raw_subj  # traceability label for blank pieces
            groups.append(g)
        return groups

    for mid in flagged_ids:
        rec = courses.get(mid, {})
        members = memberships.get(mid, []) or []
        title = rec.get("common_title") or ""
        title_lc = title.lower()
        desc = rec.get("description") or ""
        norm = ntitle(title)
        old_subj4 = rec.get("subject_4letter") or ""
        # band is derived from the M-ID's credit_status (member rows carry no
        # reliable credit_status for re-key purposes; the M-ID's is the source
        # of truth). Noncredit / Noncredit Enhanced → band 9, else band 1.
        band = "9" if rec.get("credit_status") in ("Noncredit", "Noncredit Enhanced") else "1"

        plan = {
            "mid": mid,
            "title": title,
            "norm_title": norm,
            "band": band,
            "old_subj4": old_subj4,
            "n_members": len(members),
        }

        # ── Branch 1: REVIEW-HOLD (high-precision — hold only likely-legit
        #    interdisciplinary courses). Fire on EITHER:
        #    (a) the normalized title carries an interdisciplinary-compound token;
        #        OR
        #    (b) the cascade split yields exactly 2 discipline groups whose two
        #        disciplines form a known sister/adjacent pair.
        #    Held M-IDs are recorded and NOT split (they keep their old id).
        hold_reason = None
        hold_detail = {}
        norm_tokens = set(norm.split())
        token_hit = norm_tokens & INTERDISCIPLINARY_TOKENS
        # The cascade split is computed ONCE per non-token-held M-ID — it both
        # answers the sister-pair probe AND becomes the default-branch result
        # (reused below; never recomputed).
        cascade_groups = None
        if token_hit:
            hold_reason = "interdisciplinary_token"
            hold_detail = {"tokens": sorted(token_hit)}
        else:
            cascade_groups = cascade_split(members, band=band, norm=norm,
                                           desc=desc, old_subj4=old_subj4)
            disc_groups = [g for g in cascade_groups if g["discipline"]]
            if len(cascade_groups) == 2 and len(disc_groups) == 2:
                d0, d1 = disc_groups[0]["discipline"], disc_groups[1]["discipline"]
                if frozenset({d0, d1}) in SISTER_PAIRS:
                    hold_reason = "sister_pair"
                    hold_detail = {"disciplines": sorted({d0, d1})}

        if hold_reason:
            held[mid] = {
                "held": True,
                "reason": hold_reason,
                "title": title,
                "disciplines": hold_detail.get("disciplines", []),
                "tokens": hold_detail.get("tokens", []),
            }
            plan["held"] = True
            plan["hold_reason"] = hold_reason
            plan["groups"] = []  # held → not split (no pieces)
            plans[mid] = plan
            continue

        plan["held"] = False

        # ── Branch 2: TITLE→DISCIPLINE KEEP-WHOLE. If the title contains a
        #    curator keep_whole substring, emit ONE piece = ALL members at the
        #    mapped discipline (these single courses just vary in TOP/subject by
        #    college). First matching key wins.
        keep_disc = None
        for sub, d in title_keep_whole:
            if sub in title_lc:
                keep_disc = d
                break
        if keep_disc is not None:
            subj4 = canonical_subj4(keep_disc) or old_subj4
            g = _mk_group(members, discipline=keep_disc, disc_source="title_map",
                          subj4=subj4, band=band, norm=norm)
            g["div"] = keep_disc
            plan["keep_whole"] = True
            plan["groups"] = [g]
        else:
            # ── Branch 3 (detection only) + Branch 4: CONTAINER / CASCADE SPLIT.
            # A container title is split exactly like any other M-ID (per-member
            # cascade); we only note it for the report. Reuses the cascade
            # computed for the sister-pair probe above.
            is_container = (any(p in title_lc for p in CONTAINER_PATTERNS)
                            and not any(x in title_lc for x in CONTAINER_EXCLUDE))
            if is_container:
                n_container += 1
                plan["container"] = True
            plan["groups"] = cascade_groups

        groups = plan["groups"]
        # Count members that landed in a blank-discipline (raw-subject) piece —
        # the residue the cascade couldn't resolve (for the report's blank rate).
        n_blank_members += sum(
            g["n_members"] for g in groups if g["disc_source"] == "raw_subject"
        )

        # ── id-retention decision (NON-held only) ───────────────────────────
        # The old id "SUBJ M<band><suffix>" may survive ONLY on a corroborated
        # group whose SUBJ4 STILL MATCHES the old id's SUBJ — otherwise keeping
        # it would create an id-prefix↔SUBJ4 mismatch. A keep-whole "Social
        # Media" relabeled OTEC→Multimedia must become MULT M####, NOT stay
        # OTEC M1212; likewise a cascade plurality whose resolved discipline maps
        # to a different SUBJ4 than the old prefix re-keys instead of inheriting.
        # If no corroborated group matches the old SUBJ, the old id RETIRES and
        # every group (incl. any corroborated one) gets a fresh id in its own
        # SUBJ4. The largest eligible (subj4-matching) group inherits the old id.
        m_old = COURSE_ID_RE.match(mid)
        old_subj4 = m_old.group(1) if m_old else None
        corr_groups = [g for g in groups if g["kind"] == "corroborated"]
        plan["any_corroborated"] = bool(corr_groups)
        eligible = [g for g in corr_groups if g["subj4"] == old_subj4]
        if eligible:
            keeper = min(eligible, key=lambda g: (-g["n_members"], g["div"]))
            keeper["keeps_old_id"] = True
            plan["old_id_retired"] = False
        else:
            plan["old_id_retired"] = True
            retiring_old_ids.add(mid)
        plans[mid] = plan

    # ── Pass 2: allocate fresh course_ids for NON-held, non-kept groups ──────
    # Group needing a fresh id is bucketed by (subj4, band, kind); within a
    # bucket, allocate by (norm_title, parent old_id) so the run is deterministic.
    fresh_corr_buckets = defaultdict(list)   # (s4, band) -> list of (group, mid)
    fresh_sing_buckets = defaultdict(list)   # (s4, band) -> list of (group, mid)
    for mid, plan in plans.items():
        if plan.get("held"):
            continue
        for g in plan["groups"]:
            if g.get("keeps_old_id"):
                g["new_id"] = mid  # plurality keeps the old id
                continue
            key = (g["subj4"], g["band"])
            if g["kind"] == "corroborated":
                fresh_corr_buckets[key].append((g, mid))
            else:
                fresh_sing_buckets[key].append((g, mid))

    # The plurality groups that KEEP an old id occupy that old id's seq inside
    # its (subj4, band) bucket — reserve it so a sibling fresh corroborated id
    # never duplicates it. (Old SUBJ4 may differ from a kept group's discipline-
    # canonical SUBJ4 only if the canonical SUBJ4 == old; either way the literal
    # kept id string is what matters for collision-avoidance.)
    # `preserved_ids` = every flagged M-ID id that KEEPS its literal string
    # post-apply — both plurality groups that keep the old id AND held M-IDs
    # (held rows aren't split, they keep their id). The upstream `courses` scan
    # skipped ALL flagged M-IDs (held wasn't known yet), so these preserved ids
    # must be re-reserved here or a fresh corroborated id could land on a held
    # M-ID's seq (caught 2026-05-29: 17 fresh ids collided with held M-IDs like
    # ARTS M1014). They're also excluded from the existing-id set the new ids
    # are collision-checked against (Pass 3).
    kept_ids = set()        # plurality groups that keep the old id
    for plan in plans.values():
        if plan.get("held"):
            continue
        for g in plan["groups"]:
            if g.get("keeps_old_id"):
                kept_ids.add(g["new_id"])
    preserved_ids = set(kept_ids) | set(held.keys())
    for pid in preserved_ids:
        parsed = _parse_id(pid)
        if parsed and parsed[2].isdigit():
            existing_corr_seqs[(parsed[0], parsed[1])].add(int(parsed[2]))
        elif parsed and re.match(r"^\d[A-Z]{2}$", parsed[2]):
            existing_sing_suffixes[(parsed[0], parsed[1])].add(parsed[2])

    overflow_corr = []
    overflow_sing = []

    # Corroborated fresh ids: `<SUBJ4> M<band><seq:03d>`, seq 1-based, skipping
    # existing untouched seqs + kept-id seqs + CCN/C-ID reservations.
    for (s4, band), entries in fresh_corr_buckets.items():
        entries.sort(key=lambda e: (e[0]["norm_title"], e[1], e[0]["div"]))
        reserved = set(existing_corr_seqs.get((s4, band), set()))
        reserved |= set(id_reservations.get((s4, band), set()))
        seq = 1
        for g, _mid in entries:
            while seq in reserved:
                seq += 1
            if seq > 999:
                overflow_corr.append((f"{s4} M{band}*", seq))
                g["new_id"] = None
            else:
                g["new_id"] = f"{s4} M{band}{seq:03d}"
                reserved.add(seq)
                seq += 1

    # Standalone fresh ids: `<SUBJ4> M<band><d><LL>`, skipping existing suffixes.
    for (s4, band), entries in fresh_sing_buckets.items():
        entries.sort(key=lambda e: (e[0]["norm_title"], e[1], e[0]["div"]))
        reserved_suffixes = set(existing_sing_suffixes.get((s4, band), set()))
        idx = 0
        for g, _mid in entries:
            while standalone_code(idx) in reserved_suffixes:
                idx += 1
            if idx >= 10 * 26 * 26:
                overflow_sing.append((f"{s4} M{band}*", idx))
                g["new_id"] = None
                idx += 1
                continue
            g["new_id"] = f"{s4} M{band}{standalone_code(idx)}"
            reserved_suffixes.add(standalone_code(idx))
            idx += 1

    # ── Pass 3: collision detection ──────────────────────────────────────────
    # A new id must not equal (i) any id that SURVIVES the apply — every existing
    # id minus the retiring (fully-dissolved) old ids, which still includes the
    # kept-plurality ids AND the held ids — nor (ii) any other new id. Kept/held
    # ids are live rows post-apply, so a fresh id landing on one would overwrite
    # it; the allocator already reserves their seqs (preserved_ids above), and
    # this gate is the backstop that proves it. (Fresh ids never carry a kept
    # group's own string — keeps_old_id groups are skipped below — so keeping
    # kept_ids in the forbidden set only catches a fresh id hitting ANOTHER
    # M-ID's surviving id, which is exactly the cross-bucket case worth gating.)
    existing_after_retire = all_existing_ids - retiring_old_ids
    new_ids = []
    for plan in plans.values():
        if plan.get("held"):
            continue
        for g in plan["groups"]:
            if g.get("keeps_old_id"):
                continue
            if g.get("new_id"):
                new_ids.append((g["new_id"], plan["mid"], g["div"]))

    collisions = []
    new_id_counter = Counter(nid for nid, _, _ in new_ids)
    for nid, mid, div in new_ids:
        why = []
        if nid in existing_after_retire:
            why.append("collides_with_existing_id")
        if new_id_counter[nid] > 1:
            why.append("duplicate_new_id")
        if why:
            collisions.append({"new_id": nid, "old_mid": mid, "division": div,
                               "reasons": why})

    # ── Pass 4: build the alias map ──────────────────────────────────────────
    # held M-IDs: {"held": true, reason fields}, no splits. Split M-IDs:
    # {"held": false, "old_id_retired": bool, "splits": [{…}]}.
    alias_map = {}
    for mid in flagged_ids:
        if mid in held:
            h = held[mid]
            alias_map[mid] = {
                "held": True,
                "reason": h["reason"],
                "disciplines": h["disciplines"],
                "tokens": h["tokens"],
                "title": h["title"],
            }
            continue
        plan = plans[mid]
        splits = []
        for g in plan["groups"]:
            splits.append({
                "new_id": g.get("new_id"),
                "kind": g["kind"],
                "discipline": g["discipline"],
                "subj4": g["subj4"],
                "band": g["band"],
                "colleges": g["colleges"],
                "n_members": g["n_members"],
                "is_plurality": False,  # set below
                "control_numbers": g["control_numbers"],
            })
        # Mark the plurality group explicitly: the group that keeps the old id
        # (non-retired), or — if the old id retired — the largest group, for
        # traceability of which piece is the dominant lineage.
        if plan["old_id_retired"]:
            # No group keeps the old id; mark the largest as is_plurality.
            def _pk(s):
                return (-s["n_members"], 0 if s["kind"] == "corroborated" else 1, s["new_id"] or "")
            plur = min(splits, key=_pk)
            for s in splits:
                s["is_plurality"] = (s is plur)
        else:
            for s in splits:
                s["is_plurality"] = (s["new_id"] == mid)
        alias_map[mid] = {
            "held": False,
            "old_id_retired": plan["old_id_retired"],
            "splits": splits,
        }

    # ── Pass 5: article routing ──────────────────────────────────────────────
    # For each articulation whose course_id is a flagged NON-held M-ID, route to
    # the split piece(s) whose colleges intersect the article's earned_by_colleges;
    # if 0 pieces, fall back to matching the article's top_code division to a
    # piece's division. Classify routable (1 piece) / multi (>1) / unroutable (0).
    art_routable = art_multi = art_unroutable = 0
    art_total_on_flagged = 0
    art_distinct_mids = set()
    art_unroutable_examples = []
    if os.path.exists(ARTICULATIONS):
        with open(ARTICULATIONS, encoding="utf-8") as f:
            arts = json.load(f).get("articulations", [])
        # Index split pieces by mid: list of (piece_id, set(colleges), div).
        piece_index = {}
        for mid, plan in plans.items():
            if plan.get("held"):
                continue
            pieces = []
            for g in plan["groups"]:
                pieces.append((g.get("new_id"), set(g["colleges"]), g["div"]))
            piece_index[mid] = pieces
        for a in arts:
            mid = a.get("course_id")
            if mid not in flagged_set:
                continue
            art_total_on_flagged += 1
            art_distinct_mids.add(mid)
            if mid in held:
                # Held M-IDs aren't split — the article stays on the old id, so
                # it's trivially routable (1 target: the unchanged id).
                art_routable += 1
                continue
            pieces = piece_index.get(mid, [])
            earned = set(a.get("earned_by_colleges") or [])
            hits = [pid for pid, cols, _ in pieces if cols & earned]
            if not hits:
                # Fallback: match article top_code division to a piece `div`.
                # Pieces are now discipline-keyed (not 2-digit-TOP-keyed), and the
                # articulation top_code is typically a short/truncated form that
                # parse_member_top can't parse — so this fallback is effectively a
                # no-op; primary college-intersection routing carries the load.
                # Preserved structurally; harmless (a 2-digit code never equals a
                # discipline / "RAW:" key).
                code, _ = parse_member_top(a.get("top_code"))
                a_div = fam2(code) if code else None
                if a_div:
                    hits = [pid for pid, _, div in pieces if div == a_div]
            if len(hits) == 1:
                art_routable += 1
            elif len(hits) > 1:
                art_multi += 1
            else:
                art_unroutable += 1
                if len(art_unroutable_examples) < 10:
                    art_unroutable_examples.append({"course_id": mid,
                                                    "earned_by_colleges": sorted(earned)})

    # ── Pass 6: cluster member-ref impact ────────────────────────────────────
    # For each cluster with ≥1 flagged member, map old-member → new-id(s):
    # the kept old id (plurality) or the split list (dissolved / re-keyed).
    cluster_affected = 0
    cluster_sample = []
    if os.path.exists(UNIFIED_COURSES):
        with open(UNIFIED_COURSES, encoding="utf-8") as f:
            clusters = json.load(f).get("clusters", {})
        for uid, c in clusters.items():
            members = c.get("members") or []
            flagged_members = [m for m in members if m in flagged_set]
            if not flagged_members:
                continue
            cluster_affected += 1
            mapping = {}
            for m in flagged_members:
                if m in held:
                    mapping[m] = [m]  # held → unchanged
                else:
                    plan = plans[m]
                    new_ids_for_m = []
                    for g in plan["groups"]:
                        nid = g.get("new_id")
                        if nid:
                            new_ids_for_m.append(nid)
                    mapping[m] = new_ids_for_m
            if len(cluster_sample) < 15:
                cluster_sample.append({"cluster": uid, "mapping": mapping})

    # ── Gates ────────────────────────────────────────────────────────────────
    # V1: every non-held flagged M-ID yields ≥1 split group.
    v1_bad = [mid for mid, plan in plans.items()
              if not plan.get("held") and len(plan["groups"]) < 1]
    v1_pass = not v1_bad

    # V2: member conservation — per split M-ID, sum of group member counts ==
    #     original member count; global sum also matches.
    v2_bad = []
    split_member_sum = 0
    orig_member_sum = 0
    for mid, plan in plans.items():
        if plan.get("held"):
            continue
        grp_sum = sum(g["n_members"] for g in plan["groups"])
        orig = plan["n_members"]
        split_member_sum += grp_sum
        orig_member_sum += orig
        if grp_sum != orig:
            v2_bad.append({"mid": mid, "group_sum": grp_sum, "orig": orig})
    v2_pass = (not v2_bad) and (split_member_sum == orig_member_sum)

    # V3: collision-free — zero new-id collisions.
    v3_pass = not collisions

    # V4: article routability — zero unroutable articles on split M-IDs.
    v4_pass = art_unroutable == 0

    gates = {
        "V1_every_split_yields_a_group": {"pass": v1_pass, "violations": v1_bad[:10]},
        "V2_member_conservation": {
            "pass": v2_pass,
            "global_split_sum": split_member_sum,
            "global_orig_sum": orig_member_sum,
            "per_mid_violations": v2_bad[:10],
        },
        "V3_collision_free": {"pass": v3_pass, "collision_count": len(collisions)},
        "V4_article_routability": {
            "pass": v4_pass,
            "routable": art_routable,
            "multi": art_multi,
            "unroutable": art_unroutable,
        },
    }

    # ── Aggregate stats for the report ───────────────────────────────────────
    split_plans = [p for p in plans.values() if not p.get("held")]
    n_flagged = len(flagged_ids)
    n_held = len(held)
    n_split = len(split_plans)
    n_fully_dissolved = sum(1 for p in split_plans if p["old_id_retired"])
    new_corr_groups = sum(
        1 for p in split_plans for g in p["groups"]
        if g["kind"] == "corroborated" and not g.get("keeps_old_id")
    )
    kept_corr_groups = len(kept_ids)
    new_singletons = sum(
        1 for p in split_plans for g in p["groups"]
        if g["kind"] == "singleton"
    )
    # Net corroborated-catalog delta = (kept corroborated groups + new corroborated
    # groups) − (flagged M-IDs that were corroborated, i.e. all non-held split
    # ones plus held ones since held stay corroborated). We compute against the
    # full flagged population for the headline (the ground-truth framing).
    corr_after = kept_corr_groups + new_corr_groups + n_held  # held stay corroborated M-IDs
    net_corr_delta = corr_after - n_flagged

    held_by_reason = Counter(h["reason"] for h in held.values())
    split_factor = Counter(len(p["groups"]) for p in split_plans)

    # disc_source breakdown over ALL pieces of non-held M-IDs (how each piece's
    # discipline was resolved) + the keep-whole / container M-ID counts + the
    # blank-piece rate (pieces whose discipline stayed None → raw-subject).
    disc_source_counts = Counter()
    n_pieces = 0
    n_blank_pieces = 0
    for p in split_plans:
        for g in p["groups"]:
            n_pieces += 1
            src = g.get("disc_source") or "blank"
            disc_source_counts[src] += 1
            if not g["discipline"]:
                n_blank_pieces += 1
    blank_piece_rate = (n_blank_pieces / n_pieces) if n_pieces else 0.0
    n_keep_whole = sum(1 for p in split_plans if p.get("keep_whole"))

    # ── Write artifacts ──────────────────────────────────────────────────────
    os.makedirs(OUT_DIR, exist_ok=True)
    today = date.today().isoformat()
    out_today = os.path.join(OUT_DIR, today)
    os.makedirs(out_today, exist_ok=True)

    alias_doc = {
        "_status": ("DRY-RUN — cross-discipline over-merge re-mint; no kb files "
                    "mutated, no Supabase writes."),
        "_generated_by": "kb/_overmerge_dryrun.py",
        "_generated_at": today,
        "_flagged_source": "kb/row_audit/latest.json (member_top_divergence)",
        "_flagged_count": n_flagged,
        "_held_count": n_held,
        "_split_count": n_split,
        "aliases": {k: alias_map[k] for k in sorted(alias_map)},
    }
    with open(os.path.join(out_today, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    review_hold_doc = {
        "_about": ("Flagged M-IDs HELD for curator veto — likely-legitimate "
                   "interdisciplinary courses that span ≥2 TOP divisions on "
                   "purpose. NOT split by the apply; they keep their old id. "
                   "Held by EITHER a known sister-pair split (exactly 2 division "
                   "groups whose disciplines form a SISTER_PAIRS entry) OR an "
                   "interdisciplinary-compound title token."),
        "_generated_by": "kb/_overmerge_dryrun.py",
        "_generated_at": today,
        "count": n_held,
        "by_reason": dict(held_by_reason),
        "held": {k: held[k] for k in sorted(held)},
    }
    with open(os.path.join(out_today, "review_hold.json"), "w", encoding="utf-8") as f:
        json.dump(review_hold_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    collisions_doc = {
        "_about": ("New course_ids that collide with an existing id (courses ∪ "
                   "singletons, minus retiring old ids) or with another new id. "
                   "MUST be empty if sequence allocation is correct."),
        "_generated_by": "kb/_overmerge_dryrun.py",
        "_generated_at": today,
        "count": len(collisions),
        "collisions": collisions,
    }
    with open(os.path.join(out_today, "collisions.json"), "w", encoding="utf-8") as f:
        json.dump(collisions_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    report = _render_report(
        today=today, n_flagged=n_flagged, n_held=n_held, n_split=n_split,
        n_fully_dissolved=n_fully_dissolved, new_corr_groups=new_corr_groups,
        kept_corr_groups=kept_corr_groups, new_singletons=new_singletons,
        net_corr_delta=net_corr_delta, corr_after=corr_after,
        held_by_reason=held_by_reason, split_factor=split_factor, gates=gates,
        plans=plans, held=held, alias_map=alias_map,
        art_total_on_flagged=art_total_on_flagged,
        art_distinct_mids=len(art_distinct_mids), art_routable=art_routable,
        art_multi=art_multi, art_unroutable=art_unroutable,
        art_unroutable_examples=art_unroutable_examples,
        cluster_affected=cluster_affected, cluster_sample=cluster_sample,
        n_blank_members=n_blank_members, n_container=n_container,
        n_keep_whole=n_keep_whole, disc_source_counts=disc_source_counts,
        n_pieces=n_pieces, n_blank_pieces=n_blank_pieces,
        blank_piece_rate=blank_piece_rate,
        overflow_corr=overflow_corr, overflow_sing=overflow_sing,
    )
    with open(os.path.join(out_today, "report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    # ── Console summary ──────────────────────────────────────────────────────
    print(f"[overmerge_dryrun] {today}")
    print(f"  flagged M-IDs:             {n_flagged}")
    print(f"  held (curator veto):       {n_held}  "
          f"({', '.join(f'{r}={c}' for r, c in held_by_reason.items()) or 'none'})")
    print(f"    keep-whole (title map):  {n_keep_whole}")
    print(f"    container titles:        {n_container}")
    print(f"  split:                     {n_split}")
    print(f"    fully de-corroborated:   {n_fully_dissolved}")
    print(f"    kept corroborated grps:  {kept_corr_groups}")
    print(f"    new corroborated grps:   {new_corr_groups}")
    print(f"    new singletons:          {new_singletons}")
    print(f"  corroborated after split:  {corr_after}  (net delta {net_corr_delta:+d})")
    print(f"  split-factor dist:         {dict(sorted(split_factor.items()))}")
    print(f"  pieces:                    {n_pieces}  "
          f"(blank {n_blank_pieces} = {blank_piece_rate:.1%})")
    print(f"  disc_source breakdown:     "
          f"{dict(disc_source_counts.most_common())}")
    print(f"  articulations on flagged:  {art_total_on_flagged} "
          f"(routable {art_routable}, multi {art_multi}, unroutable {art_unroutable})")
    print(f"  clusters touched:          {cluster_affected}")
    print(f"  collisions:                {len(collisions)}")
    print("  GATES:")
    for gk, gv in gates.items():
        print(f"    {'PASS' if gv['pass'] else 'FAIL'}  {gk}")
    print(f"  artifacts: {out_today}/{{report.md,alias_map.json,review_hold.json,collisions.json}}")


def _render_report(*, today, n_flagged, n_held, n_split, n_fully_dissolved,
                   new_corr_groups, kept_corr_groups, new_singletons,
                   net_corr_delta, corr_after, held_by_reason, split_factor,
                   gates, plans, held, alias_map, art_total_on_flagged,
                   art_distinct_mids, art_routable, art_multi, art_unroutable,
                   art_unroutable_examples, cluster_affected, cluster_sample,
                   n_blank_members, n_container, n_keep_whole,
                   disc_source_counts, n_pieces, n_blank_pieces,
                   blank_piece_rate, overflow_corr, overflow_sing):
    lines = []
    lines.append("---")
    lines.append("title: Cross-discipline Over-merge Re-mint Dry-Run")
    lines.append(f"date: {today}")
    lines.append("status: DRY-RUN — no kb files mutated, no Supabase writes")
    lines.append("tags: [remint, dry-run, over-merge, member-top-divergence, m-id]")
    lines.append("artifacts:")
    lines.append(f"  - kb/overmerge_out/{today}/alias_map.json")
    lines.append(f"  - kb/overmerge_out/{today}/review_hold.json")
    lines.append(f"  - kb/overmerge_out/{today}/collisions.json")
    lines.append("---\n")
    lines.append("# Cross-discipline Over-merge Re-mint Dry-Run\n")

    # TL;DR
    lines.append("## TL;DR\n")
    lines.append(f"- Flagged by `member_top_divergence`: **{n_flagged}** M-IDs "
                 "(members span ≥2 two-digit TOP divisions, minority share ≥ 0.30).")
    lines.append(f"- **{n_held}** HELD for curator veto (not split): "
                 + (", ".join(f"{r} {c}" for r, c in held_by_reason.items()) or "none") + ".")
    lines.append(f"- **{n_split}** split into discipline pieces via the member "
                 "**SUBJ4→subject_map→TOP→description cascade** (title keep-whole "
                 "map applied first; container titles split per-member).")
    lines.append(f"  - **{n_keep_whole}** kept WHOLE by the curator title→discipline "
                 "map (one piece, no split).")
    lines.append(f"  - **{n_container}** matched a container pattern "
                 "(Independent Study / Special Topics / …) → split per-member.")
    lines.append(f"  - **{n_fully_dissolved}** fully de-corroborate (dissolve to singletons — "
                 "the title collision was never a real consolidated course).")
    lines.append(f"  - **{kept_corr_groups}** plurality groups keep their old corroborated id.")
    lines.append(f"  - **{new_corr_groups}** NEW corroborated groups minted (fresh ids).")
    lines.append(f"  - **{new_singletons}** members peel to singleton status.")
    lines.append(f"- Corroborated catalog: **{n_flagged} → {corr_after}** "
                 f"(**{net_corr_delta:+d}**) — spurious corroborations removed.")
    lines.append(f"- Pieces: **{n_pieces}** total; **{n_blank_pieces}** "
                 f"(**{blank_piece_rate:.1%}**) stayed blank-discipline "
                 "(subject-separated for curator review).")
    lines.append("")

    # disc_source breakdown — how each piece's discipline was resolved.
    lines.append("## Discipline-source breakdown\n")
    lines.append("How the cascade resolved each piece's discipline "
                 "(`raw_subject` + `blank` = the blank-discipline residue, "
                 "subject-separated).\n")
    lines.append("| disc_source | pieces |")
    lines.append("|---|---:|")
    src_order = ["subj4", "subject_map", "top_code", "description", "title_map",
                 "raw_subject", "blank"]
    seen = set()
    for src in src_order:
        if src in disc_source_counts:
            lines.append(f"| `{src}` | {disc_source_counts[src]} |")
            seen.add(src)
    for src, c in disc_source_counts.most_common():
        if src not in seen:
            lines.append(f"| `{src}` | {c} |")
    lines.append(f"| **total** | **{n_pieces}** |")
    lines.append("")

    # Apply gate
    all_pass = all(g["pass"] for g in gates.values())
    lines.append("## Apply gate\n")
    if all_pass:
        lines.append("**✅ READY FOR APPLY** — all four gates PASS, collisions empty.")
    else:
        lines.append("**🟡 NOT READY** — failing gates:")
        for gk, gv in gates.items():
            if not gv["pass"]:
                lines.append(f"  - `{gk}`")
    lines.append("")

    # Gates detail
    lines.append("## Gates\n")
    for gk, gv in gates.items():
        emoji = "✅" if gv["pass"] else "❌"
        lines.append(f"- {emoji} **{gk}**: {'PASS' if gv['pass'] else 'FAIL'}")
        if gk == "V2_member_conservation":
            lines.append(f"  - global split member sum {gv['global_split_sum']} "
                         f"== orig sum {gv['global_orig_sum']}")
            for v in gv.get("per_mid_violations", []):
                lines.append(f"  - ❌ `{v['mid']}` group_sum {v['group_sum']} ≠ orig {v['orig']}")
        elif gk == "V3_collision_free":
            lines.append(f"  - {gv['collision_count']} collision(s) "
                         "(see `collisions.json` — must be 0)")
        elif gk == "V4_article_routability":
            lines.append(f"  - routable {gv['routable']} · multi {gv['multi']} · "
                         f"unroutable {gv['unroutable']}")
        elif gk == "V1_every_split_yields_a_group" and not gv["pass"]:
            lines.append(f"  - empty-split M-IDs: {gv['violations']}")
    lines.append("")

    # Split-factor distribution
    lines.append("## Split-factor distribution\n")
    lines.append("How many discipline pieces each SPLIT M-ID partitions into "
                 "(held M-IDs excluded; keep-whole M-IDs are 1).\n")
    lines.append("| pieces | M-IDs |")
    lines.append("|---:|---:|")
    for k in sorted(split_factor):
        lines.append(f"| {k} | {split_factor[k]} |")
    lines.append("")

    # Top-30 split previews
    lines.append("## Top 30 split previews\n")
    lines.append("Old M-ID → its pieces (`discipline` (n_colleges col, kind, "
                 "disc_source)). Ranked by split factor then member count. A "
                 "`*(blank)*` piece is subject-separated for curator review.\n")
    lines.append("| old M-ID | title | pieces |")
    lines.append("|---|---|---|")
    ranked = sorted(
        [p for p in plans.values() if not p.get("held")],
        key=lambda p: (-len(p["groups"]), -p["n_members"], p["mid"]),
    )[:30]
    for p in ranked:
        pieces = []
        for g in sorted(p["groups"], key=lambda g: (-g["n_members"], g["div"])):
            disc = g["discipline"] or f"*(blank: {g['div']})*"
            ncol = len(g["colleges"])
            kindmark = "keep" if g.get("keeps_old_id") else g["kind"][:4]
            src = g.get("disc_source") or "blank"
            pieces.append(f"{disc} ({ncol} col, {kindmark}, {src})")
        title = (p["title"] or "")[:40]
        lines.append(f"| `{p['mid']}` | {title} | " + " · ".join(pieces) + " |")
    lines.append("")

    # Review-hold list
    lines.append("## Review-hold (curator veto)\n")
    lines.append(f"**{n_held}** flagged M-IDs held — NOT split (kept old id). "
                 "High-precision heuristic: known sister-pair split OR an "
                 "interdisciplinary-compound title token.\n")
    if held:
        lines.append("| M-ID | title | reason | disciplines / tokens |")
        lines.append("|---|---|---|---|")
        for mid in sorted(held):
            h = held[mid]
            detail = (", ".join(h["disciplines"]) if h["reason"] == "sister_pair"
                      else ", ".join(h["tokens"]))
            title = (h["title"] or "")[:40]
            lines.append(f"| `{mid}` | {title} | {h['reason']} | {detail} |")
    else:
        lines.append("_(none held)_")
    lines.append("")

    # Article impact
    lines.append("## Articulation impact\n")
    lines.append(f"- Articulations referencing flagged M-IDs: **{art_total_on_flagged}** "
                 f"(across {art_distinct_mids} M-IDs).")
    lines.append(f"- Routing (primary: earned_by_colleges ∩ piece colleges; fallback: "
                 f"top_code division): routable **{art_routable}**, multi **{art_multi}**, "
                 f"unroutable **{art_unroutable}**.")
    if art_unroutable_examples:
        lines.append("- Unroutable examples:")
        for ex in art_unroutable_examples:
            lines.append(f"  - `{ex['course_id']}` earned by {ex['earned_by_colleges']}")
    lines.append("")

    # Cluster impact
    lines.append("## Cluster member-ref impact\n")
    lines.append(f"- Clusters in `coci_unified_courses.json` with ≥1 flagged member: "
                 f"**{cluster_affected}**.")
    if cluster_sample:
        lines.append("- Sample old-member → new-id(s) mappings:")
        for cs in cluster_sample:
            for old_m, new_ms in cs["mapping"].items():
                lines.append(f"  - `{cs['cluster']}` · `{old_m}` → {new_ms}")
    lines.append("")

    # Overflow note (should be empty)
    if overflow_corr or overflow_sing:
        lines.append("## ⚠ Sequence overflow\n")
        if overflow_corr:
            lines.append(f"- corroborated overflow: {overflow_corr[:5]}")
        if overflow_sing:
            lines.append(f"- standalone overflow: {overflow_sing[:5]}")
        lines.append("")

    # How to proceed
    lines.append("## How to proceed\n")
    lines.append("1. Review the split previews + the review-hold list. Confirm the "
                 "held set looks like genuine interdisciplinary courses.")
    lines.append("2. Re-run `python3 kb/_overmerge_dryrun.py` after any auditor / "
                 "canonical-map refresh to see the impact move.")
    lines.append("3. When all four gates are ✅, the apply step (`kb/_overmerge_apply.py` "
                 "+ Supabase + `workflow_dispatch`) re-keys minted M-IDs, memberships, "
                 "articulations, and cluster member-refs atomically in one cron window.")
    lines.append(f"4. Rollback inverse alias lives in `kb/overmerge_out/{today}/alias_map.json`.")
    lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
