#!/usr/bin/env python3
"""The magic half, on Jev — ONE routine for every reference (CSR · CCR · CCRR · CER).

Sam, 2026-09-21: *"Let continue with Jev routines in CSR, CCR, CCRR, CER"*.

WHAT ALREADY EXISTED, AND WHAT DID NOT
--------------------------------------
The method+magic pattern is this repo's, not a new idea — `playbook-trail-crew-
method-magic-audit` ran it twice on 2026-07-10 (CER, then CSR) with Claude
Workflow adjudicators plus adversarial skeptics. Every reference already owns a
METHOD half:

    CER   kb/_trail_crew.py          → findings, 7 rules
    CSR   kb/_csr_trail.py           → findings, CS1-CS9
    CCR   kb/_row_audit.py           → Trust Cards, 8 rules, ~15.5k parents
    CCRR  kb/cr_reference_worklist.json → 2,159 groups on a 5-rung ladder

What differs per reference is the MAGIC half. CER and CSR got Claude Workflows;
the playbook records that the CCR "has never had the magic half at scale — the
backlog is adjudication, not detection"; and CCRR got the Jev trial on
2026-09-20 (51 anchored pairs, answered in 10 seconds, right 25 of 25 above
p >= 0.85 against Sam's own verdicts).

Jev is the cheap magic half. This module is the one place it lives, because the
alias chain was copy-pasted once and the copy drifted to 7 maps against 15 under
a comment promising lockstep (`tests/alias_chain_single_source_test.py` fails
that now). Four trial scripts would drift the same way.

THE THREE THINGS THIS ADDS TO THE 2026-09-20 TRIAL
--------------------------------------------------
1. **PER-RULE QUESTIONS.** The CSR run's own lesson: *"hand each adjudicator
   batch a rule-specific hint — verdict quality jumped versus the generic prompt
   of run 1."* The trial asked one generic pair of questions for every pair.

2. **AN INDEPENDENT SECOND LOOK ON ANYTHING THAT MERGES OR SPLITS.** The
   playbook requires *"an adversarial skeptic on EVERY merge proposal — wrong
   merges lose real distinctions, so a refuted merge falls back to the judgment
   queue instead of the plan."* The trial had none.

   ⚠️ **THE SKEPTIC NEVER SEES THE VERDICT IT IS CHECKING.** "Critique this
   proposal" invites agreement — the model is shown a conclusion and asked to
   find fault, which is the shape that produces rubber-stamping. The CSR run
   found the honest version: *"Skeptics must re-derive the numbers, not re-read
   the claim. Both kills this run came from skeptics recomputing variant counts
   / re-key targets from the registry and catching factual errors in otherwise-
   plausible proposals."* Jev cannot read a registry, so re-derivation here means
   asking the NEGATIVE question from the same evidence, in a separate call, with
   the first answer withheld. Two independent looks; disagreement routes to a
   human. Agreement between a question and its own restatement would measure
   nothing.

3. **HELD CURATOR DECISIONS ARE VISIBLE.** The playbook's first-run pitfall:
   *"Findings must know about held curator decisions (parked merge confirms) or
   the adjudicators will re-propose what the curator deliberately deferred."*
   `--held` drops those findings before a single call is spent.

⚠️ **THIS SUGGESTS. IT NEVER MERGES, SPLITS, RE-KEYS OR WRITES.** Rung 5 reads
"similarity suggests, never merges"; Rule 7 says an unreliable signal must never
gate identity; Rule 10 governs every shared-table write. The output is a ranked
worklist for a curator and, downstream, a decision sheet. Nothing here is a
decision.

RUN IT ON A RUNNER — typesafe.ai is egress-blocked from the agent sandbox
(the proxy answers 403 to CONNECT on api.typesafe.ai), so a session cannot call
Jev itself. `.github/workflows/typesafe-smoke.yml` dispatches it.

    python3 kb/_jev_adjudicate.py --ref csr  --limit 20
    python3 kb/_jev_adjudicate.py --ref ccrr           # the calibrated one
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _typesafe_smoke import noul, score, system_one  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "jev_out")

# ── the gate ────────────────────────────────────────────────────────────────
# Measured against Sam's 51 verdicts on 2026-09-20: above 0.85 Jev was right
# 25 of 25; BELOW it the number carried no signal at all (he kept the four 0.84
# pairs at first and folded the three lowest, at 0.32, 0.44 and 0.48). So the
# gate earns its place and the ordering under it does not — never present a
# sub-gate probability as a ranking.
GATE = 0.85

# ⚠️ A GATE BELONGS TO THE REFERENCE AND THE QUESTION IT WAS MEASURED ON.
# 0.85 was measured against Sam's 51 CCRR verdicts on one question — do these
# two recommendations describe the same content. Ladder item 3 (adopted
# 2026-09-21): *every center calibrates its own gate, and none inherits 0.85.*
# A reference absent from this map HAS NO GATE, and this module must never
# print `suggest` for one: the battery already measured what a borrowed prior
# does when the domain has overruled it (`units`, AUC 0.281, below chance).
#
# To add one: run a calibration sitting, get a curator's verdicts on rows they
# individually judged (`by: "sam"` — never an opt-out default), sweep the
# threshold for the highest recall at precision 1.00, and record it here with
# the receipt that measured it.
GATES = {
    # ccrr — 25/25 correct above 0.85 across 51 verdicts, 346 rows, precision
    # 1.00 / recall 0.61; receipt kb/receipts/cr_reference_decisions_2026-09-20_s280.json
    "ccrr": 0.85,
}


def gate_for(ref_key):
    """The measured gate for this reference, or None where none exists yet."""
    return GATES.get(ref_key)


def act_bucket(p, agree, gate=GATE):
    """What to do with a finding. `agree` is the independent second look.

    ⚠️ Confidence alone never reaches the plan: a proposal the second look
    contradicts goes to the curator however sure the first was. That is the
    playbook's "a refuted merge falls back to the judgment queue".

    ⚠️ NO GATE MEANS NO SUGGESTION. With `gate=None` every row reads
    `uncalibrated` and lands in front of a curator, whatever Jev's probability
    was. The probability is still recorded — that is what the calibration
    sitting exists to collect — but nothing is proposed off an uncalibrated
    number, which is the failure ladder item 3 was adopted to prevent."""
    if p is None:
        return "unscored"
    if gate is None:
        return "uncalibrated"   # ranked for a curator; nothing is proposed
    if p >= gate and agree is True:
        return "suggest"        # both looks agree; a curator still confirms
    if p >= gate and agree is False:
        return "contested"      # confident and contradicted — the interesting pile
    return "curator"            # everything under the gate


class Ref:
    """One reference's adapter: where its findings come from, and what to ask
    about each rule. The questions are the whole point — a generic prompt is
    what run 1 did, and run 2 beat it by asking per rule."""

    def __init__(self, key, title, loader, rules, merges):
        self.key, self.title, self.loader, self.rules = key, title, loader, rules
        self.merges = merges      # rules whose action merges/splits => second look

    def findings(self, held=()):
        rows = [f for f in self.loader() if f.get("id") not in held]
        return rows


# ── per-rule questions ──────────────────────────────────────────────────────
# Each entry: the positive question Jev answers about a finding, and the
# INDEPENDENT negative asked separately on anything that merges or splits.
# ⚠️ Keep the state tight — TypeSafe's own guidance is that irrelevant detail
# costs accuracy, and the 2026-09-20 trial held to three keys.

CSR_RULES = {
    "cs4_missed_alignment": {
        "ask": ("This discipline's canonical four-letter code differs from the official "
                "CCN subject prefix for what looks like the same subject. Should the "
                "canonical be changed to match the official prefix?"),
        "true": "Same subject. The official prefix is the better canonical.",
        "false": "Different subject, or the difference is deliberate.",
        "negative": ("Is there a reason this discipline should KEEP a canonical code "
                     "that differs from the official CCN prefix?"),
    },
    "cs6_weak_mnemonic": {
        "ask": ("Is this four-letter canonical code a poor mnemonic for its discipline — "
                "one a faculty member would fail to recognize or would confuse with "
                "another subject?"),
        "true": "Poor mnemonic. A reader would misread it.",
        "false": "Readable enough; it carries the discipline.",
        "negative": "Is this code recognizable to someone who teaches the discipline?",
    },
    "cs9_anchor_subj_diverge": {
        "ask": ("The curated anchor course for this discipline carries a different "
                "subject code from the discipline's canonical. Does that divergence "
                "indicate the canonical is wrong?"),
        "true": "The anchor is right and the canonical should follow it.",
        "false": "The anchor is an outlier; the canonical stands.",
        "negative": ("Is the anchor course simply an outlier, leaving the canonical "
                     "correct as it stands?"),
    },
}

CCRR_RULES = {
    # The 2026-09-20 trial's question, kept verbatim: it is the one with a
    # measured calibration against 51 human verdicts, and changing its wording
    # would silently invalidate that measurement.
    "anchored_pair": {
        "ask": ("Do these two credit recommendations describe the same course content, "
                "such that one college's award and the other's should be treated as the "
                "same recommendation?"),
        "true": "Same content. Wording differs only.",
        "false": "Different content, even though both map to the same course code.",
        "negative": ("Is there a difference in level, scope, units, lab against lecture, "
                     "or vendor specificity that means these two recommendations should "
                     "stay separate?"),
    },
}

CARE = score(
    "How much curator attention does this deserve before acting?",
    ["Obvious — act without review.",
     "Clear, a glance is enough.",
     "Genuinely arguable — a curator should decide.",
     "Likely wrong — needs a subject expert."])


def ask(state, spec, key):
    """The positive look: is the proposed action right, and how much care does
    it need? One call, two questions — Jev answers a set at once.

    ⚠️ A NOUL ANSWER IS A PROBABILITY, NOT A BOOLEAN (the named note on the
    2026-09-20 trial: an earlier cut tested `is True`, which a float never
    satisfies, and would have reported zero merges whatever Jev said — which
    reads exactly like a clean negative result)."""
    answers = (system_one(state, {
        "verdict": noul(spec["ask"], {"true": spec["true"], "false": spec["false"]}),
        "care": CARE,
    }, key).get("answers") or {})
    care = answers.get("care") or {}
    return {"p": (answers.get("verdict") or {}).get("noul"),
            "care": care.get("score"), "care_confidence": care.get("confidence")}


def second_look(state, spec, key):
    """The independent negative, in its own call, with the first answer WITHHELD.

    ⚠️ This is not "critique the proposal". Showing a model its own conclusion
    and asking for fault invites agreement; the playbook's working skeptics
    re-derived the evidence instead. Here the same evidence is put to the
    opposite question, and the two answers are compared by the caller.

    Returns True when the negative AGREES with the positive (i.e. it found no
    reason to hold back), False when it contradicts, None when unscored."""
    p = ((system_one(state, {
        "hold": noul(spec["negative"],
                     {"true": "Yes — there is a real reason to hold back.",
                      "false": "No such reason in this evidence."}),
    }, key).get("answers") or {}).get("hold") or {}).get("noul")
    if p is None:
        return None, None
    # Symmetric gate: the negative has to be as sure to overturn as the positive
    # was to propose. A 0.5 "maybe" is not a refutation, and must not read as one.
    return (p < (1 - GATE)), p


CER_RULES = {
    "norm_dup_titles": {
        "ask": ("Two credential titles normalize to the same string. Are they the same "
                "credential, such that one name should serve both?"),
        "true": "One credential under two spellings.",
        "false": "Two genuinely different credentials that happen to normalize alike.",
        "negative": ("Is there a difference in issuer, level, or content that means "
                     "these two titles name different credentials?"),
    },
    "bare_vs_leveled": {
        "ask": ("A bare credential title sits beside leveled siblings. Did the bare one "
                "lose a level indicator it needs?"),
        "true": "It needs a level; the bare form is incomplete.",
        "false": "The bare form is the credential's real name.",
        "negative": ("Is the bare title a complete credential name in its own right, "
                     "rather than a leveled one missing its level?"),
    },
    "issuer_variant_cluster": {
        "ask": ("These issuer strings look like spellings of one organization. Should "
                "they be folded to a single canonical issuer?"),
        "true": "One organization, several spellings.",
        "false": "Distinct organizations, or a parent and its division.",
        "negative": ("Are these separate organizations, or a parent body and a division "
                     "that should stay distinguishable?"),
    },
    "level_notation_twins": {
        "ask": ("These titles differ only in how the level is written (I/II against "
                "1/2). Should they be folded to one notation?"),
        "true": "Same credential, two notations.",
        "false": "The notation carries a real distinction here.",
        "negative": ("Does the notation difference carry meaning — a roman numeral that "
                     "is part of the credential's actual name, such as IV Therapy?"),
    },
    "issuer_family_mixed": {
        "ask": ("One credential family carries issuer strings from more than one "
                "organization. Is that a data error to be reconciled?"),
        "true": "It should carry one issuer.",
        "false": "The family genuinely spans issuers.",
        "negative": "Can one credential family legitimately be issued by several bodies?",
    },
}


def _latest(pattern):
    import glob
    hits = sorted(glob.glob(os.path.join(HERE, pattern)))
    if not hits:
        raise SystemExit(f"no method-half output matching {pattern} — run its scanner first")
    return hits[-1]


def _scanner_findings(pattern, rules):
    """CSR and CER both come off a Trail Crew scanner and share a shape.

    ⚠️ TRIAGE BY LEVERAGE, NOT ROW ORDER (the playbook's first CCR rule). Only
    findings the scanner itself marked `needs_judgment` reach Jev, and only for
    rules this module has a question for — 109 roman-numeral renames and 71
    style nits are mechanical, and spending a call on them buys nothing."""
    path = _latest(pattern)
    raw = json.load(open(path, encoding="utf-8"))
    rows = raw["findings"] if isinstance(raw, dict) and "findings" in raw else raw
    out = []
    for f in rows:
        if f.get("rule") not in rules or not f.get("needs_judgment"):
            continue
        out.append({
            "id": f.get("id"), "rule": f.get("rule"),
            "item": f.get("item") or f.get("key") or f.get("title") or "",
            "evidence": f.get("evidence") or "",
            "suggestion": f.get("suggestion") or "",
            "weight": 0,
        })
    return out, path


def csr_findings():
    return _scanner_findings(os.path.join("csr_out", "*", "findings.json"), CSR_RULES)


def cer_findings():
    return _scanner_findings(os.path.join("trail_crew_out", "*", "findings.json"), CER_RULES)


def ccrr_findings():
    """The anchored pairs of the 2026-09-20 trial.

    ⚠️ IMPORTED, NEVER REIMPLEMENTED. `build_pairs()` is the blocking that cuts
    1,873,080 brute-force pairs to the anchored set, and it is the join the
    receipt's 51 verdicts were keyed through. A second copy would drift exactly
    as the alias chain's copy did."""
    from _typesafe_cr_trial import build_pairs
    out = []
    for p in build_pairs():
        out.append({
            "id": f"{p['anchor_key']}||{p['cand_key']}",
            "rule": "anchored_pair",
            "item": p["cand_rec"],
            "evidence": (f"published line: {p['anchor_rec']} · "
                         f"shared course: {p['canonical']} · "
                         f"{p['rows']} articulation row(s) across {p['colleges']} college(s)"),
            "suggestion": f"fold into: {p['anchor_rec']}",
            "weight": p["rows"],
        })
    return out, "kb/cr_reference_worklist.json"


# ── CCR: the Trust Card adapter (S282, 2026-09-21) ──────────────────────────
# Sam ruled on the ladder sheet that the CCR gets the next sitting of verdicts.
# The CCR sat outside this module for a structural reason: `kb/_row_audit.py`
# emits Trust Cards — a per-row SCORE across 19 rules — where the CSR, CER and
# CCRR emit findings, which are discrete questions. Jev answers questions, so
# the adapter's whole job is deciding which tags ARE questions.
#
# ⚠️ MOST OF THE CCR's TAGS ARE NOT QUESTIONS, AND THREE OF THEM ARE TRAPS.
# Measured on 27,580 cards (kb/row_audit/latest.json, 2026-09-21):
#
#   STATE, not judgment — a curator repairs these, nobody adjudicates them:
#     seed_untouched_discipline 14,511 · cluster_blanks_when_aggregatable 7,158
#     blank_description 5,750 · blank_discipline 96 · mid_id_off_scheme 1
#     cluster_member_unresolved 1
#
#   ⚠️ THE TRAPS — 6,621 rows firing on signals THIS REPO HAS ALREADY RULED
#   NON-AUTHORITATIVE. Asking Jev about them spends calls to get a confident
#   answer pointing the wrong way, which is the most expensive kind of wrong:
#     unit_anomaly 4,179          — the lane rules units are NOT identity
#                                   (`SPAN 100` at 4/4.5/5 is one course). The
#                                   battery MEASURED Jev on exactly this
#                                   question and scored AUC 0.281, BELOW
#                                   CHANCE, because a general model assumes an
#                                   hours difference means a content
#                                   difference. Never ask it.
#     top_discipline_disagreement 1,189 · member_top_divergence 1,253
#                                 — Rule 7's TOP caveat: TOP is faculty-entered
#                                   with no gatekeeper, ~52% of consolidated
#                                   M-IDs are TOP-mixed, and it NEVER gates a
#                                   primary determination. A question whose
#                                   whole premise is "TOP disagrees" asks Jev
#                                   to gate on TOP.
#
#   ⚠️ IDENTITY-ADJACENT — Jev may RANK these, never rule on them. Same Rule 7
#   logic as item 9 held the CSR out for: a SUBJ4 change is a re-mint.
#     subject_discipline_outlier 322 · subject_collision_signal 113
#
# WHAT IS LEFT IS A CONTENT JUDGMENT, and it is the only thing worth a call:
#     discipline_title_mismatch 1,118 · description_discipline_disagreement 73
#     generic_title_concrete_discipline 46   =  1,237 questions
#
# So the CCR's 27,580 cards trIage to 1,237 — the same shape as the CER (239 to
# 59) and CSR (185 to 143), reached by asking which tags a curator would
# recognize as a question rather than by taking the biggest pile.
CCR_RULES = {
    "discipline_title_mismatch": {
        "ask": ("This course's title shares no subject vocabulary with the discipline it "
                "is filed under. Does the title belong to a DIFFERENT discipline than the "
                "one recorded?"),
        "true": "The title names a different discipline.",
        "false": "The title fits the recorded discipline; the wording is just generic.",
        "negative": ("Can this title reasonably sit inside the recorded discipline, as a "
                     "course that discipline would offer?"),
    },
    "description_discipline_disagreement": {
        "ask": ("This course's description describes subject matter that differs from the "
                "discipline it is filed under. Does the description indicate the "
                "discipline is wrong?"),
        "true": "The description names different subject matter.",
        "false": "The description is consistent with the recorded discipline.",
        "negative": ("Is the description consistent with the recorded discipline, allowing "
                     "for a course that spans more than one subject?"),
    },
    "generic_title_concrete_discipline": {
        "ask": ("This course carries a generic title under a specific discipline. Is the "
                "title too generic to identify what the course teaches?"),
        "true": "Too generic to identify the course.",
        "false": "Generic wording, but the course is still identifiable.",
        "negative": ("Does the title, read with its discipline, identify the course well "
                     "enough for a faculty member to recognize it?"),
    },
}

# Tags Jev is ASKED about. Everything else in the audit is state, a trap, or
# identity — see the block above, where each exclusion carries its reason.
# ⚠️ CCR_ASKABLE is the THREE content-judgment tags and nothing else — it is
# what rungs 1-3 select on, and widening it would pull the population rungs into
# the cumulative ladder, where they do not belong.
CCR_ASKABLE = ("discipline_title_mismatch",
               "description_discipline_disagreement",
               "generic_title_concrete_discipline")

# Held out of the ASK and named here so a future session reads the reason
# rather than re-deriving it and re-adding them.
# ⚠️ STILL NEVER ASKED. Both ask Jev to gate on TOP, which Rule 7 forbids
# outright — TOP is faculty-entered with no gatekeeper and ~52% of consolidated
# M-IDs are TOP-mixed. No domain rule rescues a question whose whole premise is
# "TOP disagrees", which is what separates these from units below.
CCR_NEVER_ASK = {
    "top_discipline_disagreement": "Rule 7: TOP never gates a primary determination",
    "member_top_divergence": "Rule 7: TOP never gates a primary determination",
}

# ⚠️ `unit_anomaly` LEFT THIS SET ON 2026-09-21, AND THE REASON MATTERS.
# It was never-ask because Jev scored AUC 0.281 on it — below chance — applying
# the general prior that different hours mean different content. Sam supplied
# the domain rule that overrules the prior (two units of variation is
# non-critical), so the question is now askable BECAUSE THE RULE IS STATED IN
# IT. The `units` rung clears 63% mechanically and asks the rest with the
# threshold given, so the model is never left to invent one. Re-adding it as a
# bare "do these units differ?" question would reproduce 0.281 exactly.
CCR_MOVED_TO_RUNG = {
    "unit_anomaly": "asked at the `units` rung, with Sam's 2-unit rule stated in the question",
    "subject_discipline_outlier": "asked at the `subject` rung; a curator still rules",
    "subject_collision_signal": "asked at the `subject` rung; a curator still rules",
}

# The subject tags are ASKED now (Sam, 2026-09-21), and their answer is still
# never an action: `CCR_NEVER_AUTO` names the rung, and a SUBJ4 change remains
# the re-mint playbook's call.
CCR_RANK_ONLY = {
    "subject_discipline_outlier": "a SUBJ4 change is a Rule 7 re-mint — ranked, never ruled",
    "subject_collision_signal": "a SUBJ4 change is a Rule 7 re-mint — ranked, never ruled",
}


def _clean_desc(d):
    """COCI descriptions arrive with literal `_x000D_` carriage-return escapes
    in them. TypeSafe's own guidance is that irrelevant detail costs accuracy,
    and a window spent on escape artifacts is a window not spent on the course.

    ⚠️ THE CATALOG BOILERPLATE STAYS. Stripping prerequisites and corequisites
    looks like the same cleanup and destroys the finding: the DEH-24
    prerequisite list IS what reveals that an `Ethics` row filed under
    Philosophy is a dental-hygiene course."""
    return " ".join(d.replace("_x000D_", " ").split())
# ── the CCR's LADDER (Sam, 2026-09-21) ──────────────────────────────────────
# First: *"title then CIP then course description"*. Revised the same day:
#   "make CIP the 3rd level and add units into the ladder. I'm thinking the
#    range should be 2 units variation as a non-critical difference. Add in a
#    rung for subject code outliers and untouched seeds, and blanks (where
#    there is something useful to work with in the aggregate)."
# And, on where this goes next: *"I will want similar rungs for the other
# datasets"* — so this ladder is the TEMPLATE for the CER, CSR and CCRR, not a
# one-off shape for the CCR.
#
# ⚠️ TWO KINDS OF RUNG, AND CONFLATING THEM WOULD COST A SITTING.
#   Rungs 1-3 are ONE question over ONE population (the 1,237 content-judgment
#   rows), asked with more evidence each time. They are CUMULATIVE — rung 2 is
#   rung 1 plus the description, rung 3 adds the CIP — so "escalate what rung 1
#   could not settle" is meaningful. Run one, calibrate its gate on a curator's
#   verdicts, escalate only the unsettled rows.
#   Rungs 4-6 are DIFFERENT questions over DIFFERENT populations. They neither
#   accumulate nor escalate into one another, and each earns its OWN gate.
# `CCR_RUNGS` keeps Sam's single ordering; `CCR_RUNG_KIND` says which is which,
# so a future session cannot read rung 4 as "rung 3 plus units".
CCR_RUNGS = ("title", "description", "cip", "units", "subject", "aggregate")
CCR_RUNG_KIND = {
    "title": "evidence", "description": "evidence", "cip": "evidence",
    "units": "population", "subject": "population", "aggregate": "population",
}
CCR_EVIDENCE_RUNGS = tuple(r for r in CCR_RUNGS if CCR_RUNG_KIND[r] == "evidence")

# ⚠️ SAM'S UNITS RULE IS THE DOMAIN PRIOR THE BATTERY WAS MISSING.
# `unit_anomaly` sat in CCR_NEVER_ASK because the pre-registered battery
# measured Jev on exactly that question at **AUC 0.281 — below chance** — it
# applies the general assumption that different hours mean different content,
# which this domain has overruled. Sam supplies the rule that overrules it:
# two units of variation is a non-critical difference.
#
# So units re-enter as a MEASURED SCREEN rather than a question put to a general
# model. Measured 2026-09-21 across all 4,179 `unit_anomaly` cards (every one
# carries two or more member unit values):
#     2,641 (63%) sit at or under 2 units apart  -> cleared mechanically, no call
#     1,538 (37%) sit above it, up to 33 apart   -> the real question
# The question states the rule, so the model is never left to invent a
# threshold of its own — which is what it did at 0.281.
UNITS_NONCRITICAL = 2.0

# ⚠️ THE SUBJECT RUNG ASKS, BUT ITS ANSWER IS NEVER AN ACTION. A subject-code
# change is a re-mint under the mandatory playbook, and Rule 7 holds that an
# unreliable signal never gates identity. Sam's framing makes the exploration
# safe (*"the MIDs are still experimental, so the stakes are low"*) — it does
# not make a model's answer a decision. `never_auto` says so in the data.
CCR_NEVER_AUTO = ("subject",)


def _cip_for(top):
    """The modal CIP colleges actually assigned to programs under this TOP.

    ⚠️ IT ARRIVES WITH ITS OWN MAJORITY ATTACHED. A TOP carries a mean of 2.85
    CIPs, so a bare code would read as fact where the truth is a 3-way split.
    `share` and `cips` ride into the evidence for the same reason Rule 7 keeps
    TOP a corroborator: the only route from a course to a CIP is its TOP code,
    so CIP inherits TOP's unreliability and CORROBORATES, NEVER GATES."""
    if not top:
        return None
    return (_TOP_CIP.get("map") or {}).get(str(top).strip())


def _load_top_cip():
    path = os.path.join(HERE, "top_cip_map.json")
    if not os.path.exists(path):
        return {}
    return json.load(open(path, encoding="utf-8"))


_TOP_CIP = _load_top_cip()


def _members(mid):
    return (_MEMBERSHIPS or {}).get(mid) or []


def _load_memberships():
    path = os.path.join(HERE, "coci_minted_memberships.json")
    if not os.path.exists(path):
        return {}
    return (json.load(open(path, encoding="utf-8")) or {}).get("memberships") or {}


_MEMBERSHIPS = _load_memberships()


_MEMBER_DESC = None


def _member_descs(mid):
    """The member courses' own descriptions, from `unified_courses_member_desc.js`.

    ⚠️ MEMBERSHIP RECORDS DO NOT CARRY DESCRIPTIONS. They hold college, control
    number, subject, course number, units, credit status and TOP — so the blank
    a cluster most often has (4,231 of the 7,158 aggregatable rows) cannot be
    filled from them at all. The member descriptions live in their own artifact,
    keyed by the same id, and 4,065 of those 4,231 have at least one.

    Loaded lazily: the file is ~47 MB and only the `aggregate` rung reads it."""
    global _MEMBER_DESC
    if _MEMBER_DESC is None:
        path = os.path.join(os.path.dirname(HERE), "unified_courses_member_desc.js")
        if not os.path.exists(path):
            _MEMBER_DESC = {}
        else:
            raw = open(path, encoding="utf-8").read()
            blob = json.loads(raw[raw.index("{", raw.index("=")):].rstrip().rstrip(";"))
            _MEMBER_DESC = blob.get("desc") or {}
    return _MEMBER_DESC.get(mid) or []


def _units_spread(mid):
    """How far apart the members' unit counts sit, or None when fewer than two
    members carry one. The spread is what Sam's rule is stated against."""
    us = [m.get("units") for m in _members(mid) if isinstance(m.get("units"), (int, float))]
    if len(us) < 2:
        return None
    return round(max(us) - min(us), 2)


def _clean_desc(d):
    """COCI descriptions arrive with literal `_x000D_` carriage-return escapes
    in them. TypeSafe's own guidance is that irrelevant detail costs accuracy,
    and a window spent on escape artifacts is a window not spent on the course.

    ⚠️ THE CATALOG BOILERPLATE STAYS. Stripping prerequisites and corequisites
    looks like the same cleanup and destroys the finding: the DEH-24
    prerequisite list IS what reveals that an `Ethics` row filed under
    Philosophy is a dental-hygiene course."""
    return " ".join(d.replace("_x000D_", " ").split())


# ── the per-rung questions ──────────────────────────────────────────────────
# Rungs 1-3 share the three content-judgment rules already in CCR_RULES; the
# population rungs each carry their own.

CCR_UNITS_RULE = {
    "ask": ("These colleges teach the same course at different unit counts. Given that a "
            "difference of two units or less is treated as non-critical in this system, is "
            "this spread large enough to mean the colleges are teaching DIFFERENT content?"),
    "true": "Too far apart to be the same course.",
    "false": "A scheduling or calendar difference, not a content difference.",
    "negative": ("Can one course reasonably be taught at this range of unit counts by "
                 "different colleges, on different academic calendars?"),
}

CCR_SUBJECT_RULE = {
    "ask": ("This course's subject code differs from the one its discipline normally uses. "
            "Does the course belong under the subject its own code names, rather than the "
            "discipline's?"),
    "true": "The course's own subject code is the right one.",
    "false": "The discipline's usual subject code is right; this one is an outlier.",
    "negative": ("Is this course a legitimate member of the discipline it is filed under, "
                 "with the subject code simply being a local naming choice?"),
}

CCR_AGGREGATE_RULE = {
    "ask": ("This consolidated course is missing a value that its member courses carry. Do "
            "the members agree closely enough that their common value should fill the "
            "blank?"),
    "true": "The members agree; take their value.",
    "false": "The members disagree, or the blank needs a curator rather than a majority.",
    "negative": ("Do the members disagree enough that filling the blank from them would "
                 "record something no college actually teaches?"),
}


def ccr_findings(rung=None):
    """Trust Cards to questions, per rung of Sam's ladder.

    Rungs 1-3 (`title` / `description` / `cip`) put ONE question — does this
    course belong under the discipline it is filed under — to the three
    content-judgment tags, with cumulative evidence. Rungs 4-6 (`units` /
    `subject` / `aggregate`) each carry their own population and question.

    ⚠️ A TOP-DERIVED DISCIPLINE IS LABELLED IN THE EVIDENCE. Rule 7's "gate
    identity, keep display" ruling holds that a discipline inferred from a TOP
    code displays but is held out of the canonical fold until a second signal
    agrees. Handing Jev such a discipline as though a curator had set it would
    ask it to judge a title against a guess."""
    audit = os.path.join(HERE, "row_audit", "latest.json")
    if not os.path.exists(audit):
        raise SystemExit("no Trust Cards — run `python3 kb/_row_audit.py` first")
    cards = json.load(open(audit, encoding="utf-8"))["rows"]
    courses = json.load(open(os.path.join(HERE, "coci_minted_courses.json"),
                             encoding="utf-8"))["courses"]
    src = "kb/row_audit/latest.json + kb/top_cip_map.json + kb/coci_minted_memberships.json"
    kind = CCR_RUNG_KIND.get(rung or "title")

    if kind == "population":
        return _ccr_population(rung, cards, courses), src
    return _ccr_evidence(rung, cards, courses), src


def _ccr_evidence(rung, cards, courses):
    """Rungs 1-3: one question, cumulative evidence, over the 1,237."""
    TOP_DERIVED = {"top_code", "top_division"}
    out = []
    for c in cards:
        hits = [t for t in (c.get("tags") or []) if t in CCR_ASKABLE]
        if not hits:
            continue
        rec = courses.get(c["id"]) or {}
        title = (rec.get("common_title") or "").strip()
        disc = (rec.get("discipline") or "").strip()
        desc = _clean_desc((rec.get("description") or "").strip())
        if not title or not disc:
            # With no title or no discipline there is no question to put: the
            # row is a blank to repair, which the `aggregate` rung handles.
            continue
        source = rec.get("discipline_source") or ""
        note = " (inferred from TOP, uncorroborated)" if source in TOP_DERIVED else ""
        members = c.get("lev") or 1
        cip = _cip_for(rec.get("top_code"))

        # RUNG 1 — the title alone, against the discipline it is filed under.
        r1 = [f"title: {title}", f"discipline: {disc}{note}",
              f"{members} member course(s) across the colleges that offer it"]
        # RUNG 2 — the description, which is what separates a real miss from the
        # token-overlap artifacts rung 1 cannot tell apart (Sam moved this ahead
        # of CIP on 2026-09-21).
        r2 = list(r1)
        if desc:
            r2.append(f"description: {desc[:300]}")
        # RUNG 3 — the CIP colleges assigned, WITH how thin its majority is.
        r3 = list(r2)
        if cip:
            r3.append(
                "CIP colleges assigned: "
                f"{cip['cip']} {cip['title']} (the modal CIP on "
                f"{int(cip['share'] * 100)}% of {cip['programs']} programs under this TOP"
                + (f", which carries {cip['cips']} CIPs in all)" if cip["cips"] > 1
                   else ", the only CIP under it)"))
        rungs = {"title": " · ".join(r1), "description": " · ".join(r2), "cip": " · ".join(r3)}

        for tag in hits:
            out.append({
                "id": f"{c['id']}||{tag}", "rule": tag, "item": title,
                "rungs": rungs,
                # A caller that names no rung is handed the FULLEST evidence
                # rather than silently the thinnest case.
                "evidence": rungs["cip"],
                "suggestion": f"review the discipline recorded for {c['id']}",
                "weight": members,
            })
    return out


def _ccr_population(rung, cards, courses):
    """Rungs 4-6: each its own population, its own question, its own gate."""
    out = []
    if rung == "units":
        for c in cards:
            if "unit_anomaly" not in (c.get("tags") or []):
                continue
            spread = _units_spread(c["id"])
            # ⚠️ SAM'S RULE CLEARS 63% WITHOUT A CALL. A spread at or under two
            # units is non-critical by his ruling, so it never becomes a
            # question — spending a call there is spending it to be told what
            # the rule already says.
            if spread is None or spread <= UNITS_NONCRITICAL:
                continue
            rec = courses.get(c["id"]) or {}
            title = (rec.get("common_title") or "").strip() or c["id"]
            us = sorted({m.get("units") for m in _members(c["id"])
                         if isinstance(m.get("units"), (int, float))})
            out.append({
                "id": f"{c['id']}||units", "rule": "units_spread", "item": title,
                "evidence": (f"title: {title} · units across members: "
                             f"{', '.join(str(u) for u in us)} · "
                             f"spread {spread} units, against a non-critical range of "
                             f"{UNITS_NONCRITICAL} · {len(us)} distinct values over "
                             f"{len(_members(c['id']))} member course(s)"),
                "suggestion": f"review whether {c['id']} holds one course or several",
                "weight": c.get("lev") or 1,
            })
    elif rung == "subject":
        for c in cards:
            hits = [t for t in (c.get("tags") or []) if t in CCR_RANK_ONLY]
            if not hits:
                continue
            rec = courses.get(c["id"]) or {}
            title = (rec.get("common_title") or "").strip() or c["id"]
            disc = (rec.get("discipline") or "").strip()
            subj = (rec.get("subject") or "").strip()
            canon = (rec.get("subject_4letter") or "").strip()
            out.append({
                "id": f"{c['id']}||{hits[0]}", "rule": hits[0], "item": title,
                "evidence": (f"title: {title} · discipline: {disc} · its own subject code: "
                             f"{subj or 'none'} · the discipline's canonical code: "
                             f"{canon or 'none'} · {c.get('lev') or 1} member course(s)"),
                # ⚠️ Never "re-mint": the suggestion names a review, because a
                # code change is the playbook's call and never a model's.
                "suggestion": f"a curator reviews the subject recorded for {c['id']}",
                "weight": c.get("lev") or 1,
            })
    elif rung == "aggregate":
        for c in cards:
            if "cluster_blanks_when_aggregatable" not in (c.get("tags") or []):
                continue
            rec = courses.get(c["id"]) or {}
            title = (rec.get("common_title") or "").strip() or c["id"]
            have = (rec.get("description") or "").strip()
            descs = [d.strip() for d in _member_descs(c["id"]) if (d or "").strip()]
            # ⚠️ SAM'S QUALIFIER IS THE WHOLE SCOPE: "where there is something
            # useful to work with in the aggregate". A cluster whose members
            # supply nothing is excluded rather than asked about — 8,132
            # blank/seed cards carry no members at all.
            if have or not descs:
                continue
            # Do the members agree? Near-identical text is a mechanical fill; a
            # split is the judgment worth a call.
            norm = {" ".join(d.lower().split())[:200] for d in descs}
            agree = len(norm) == 1
            out.append({
                "id": f"{c['id']}||aggregate", "rule": "aggregate_fill", "item": title,
                "evidence": (
                    f"title: {title} · this consolidated course has no description · "
                    f"{len(descs)} member course(s) describe it"
                    + (", all in the same words" if agree
                       else f", in {len(norm)} different wordings") + " · "
                    + " || ".join(f"member: {d[:220]}" for d in descs[:3])),
                "suggestion": f"fill {c['id']}'s description from its members",
                # Agreement is cheap to act on and split is where judgment sits,
                # so weight by how many members back it.
                "weight": len(descs),
                "members_agree": agree,
            })
    return out


# The population rungs' questions join the same table, so `run()` looks every
# rule up in one place. They are registered here rather than beside CCR_RULES
# because they are defined with the ladder they belong to.
CCR_RULES["units_spread"] = CCR_UNITS_RULE
CCR_RULES["subject_discipline_outlier"] = CCR_SUBJECT_RULE
CCR_RULES["subject_collision_signal"] = CCR_SUBJECT_RULE
CCR_RULES["aggregate_fill"] = CCR_AGGREGATE_RULE


REFS = {
    "csr": ("Common Subject Reference", csr_findings, CSR_RULES),
    "cer": ("Credential Reference", cer_findings, CER_RULES),
    "ccrr": ("Common CR Reference", ccrr_findings, CCRR_RULES),
    "ccr": ("Common Course Reference", ccr_findings, CCR_RULES),
}


RECEIPT = os.path.join(HERE, "receipts", "cr_reference_decisions_2026-09-20_s280.json")


def sam_verdicts():
    """Sam's 51 CCRR verdicts, as ground truth for scoring the routine.

    ⚠️ SCORE AGAINST HIS OWN CALLS ONLY. Since 2026-09-21 a decision sheet
    arrives opt-out, so an item he never touched carries the recommendation
    marked `by: "default"` — scoring against those would measure this routine
    against its own proposals and report the agreement as accuracy. The
    receipt predates opt-out and is entirely his, which is why it is the
    ground truth and a later sheet's untouched rows are not."""
    if not os.path.exists(RECEIPT):
        return {}
    r = json.load(open(RECEIPT, encoding="utf-8"))
    kept = set(r.get("calibration", {}).get("kept_after_review") or [])
    truth = {}
    for it in r.get("items") or []:
        n = it.get("item")
        truth[(it.get("anchor_key"), it.get("cand_key"))] = "keep" if n in kept else "fold"
    return truth


def run(ref_key, limit, held, key, score_only=False, rung=None):
    title, loader, rules = REFS[ref_key]
    # ⚠️ ONE RUNG PER RUN, AND THE RUNG PICKS THE POPULATION. The CCR's loader
    # takes the rung because rungs 4-6 each have their OWN population — asking
    # the units question of the title rung's 1,237 rows would be asking it of
    # rows that have no unit spread. Rungs 1-3 share one population and differ
    # only in evidence, which is what `rungs` on each finding carries.
    if rung and ref_key == "ccr":
        findings, source = loader(rung)
    else:
        findings, source = loader()
    if rung:
        if any("rungs" in f for f in findings):
            missing = [f["id"] for f in findings if rung not in (f.get("rungs") or {})]
            if missing:
                raise SystemExit(f"{len(missing)} finding(s) carry no '{rung}' rung")
            findings = [dict(f, evidence=f["rungs"][rung]) for f in findings]
        elif ref_key != "ccr":
            raise SystemExit(f"{ref_key} has no rungs — drop --rung")
    findings = [f for f in findings if f["id"] not in held]
    findings.sort(key=lambda f: -(f.get("weight") or 0))
    if limit:
        findings = findings[:limit]

    gate = gate_for(ref_key)
    kind = CCR_RUNG_KIND.get(rung) if ref_key == "ccr" else None
    at = (f" at rung '{rung}'" + (f" ({kind})" if kind else "")) if rung else ""
    print(f"{title} ({ref_key}) — {len(findings)} finding(s){at} from {source}")
    if gate is None:
        print(f"  NO CALIBRATED GATE for {ref_key} — this is a CALIBRATION run: "
              f"every row is ranked for a curator and nothing is suggested. "
              f"0.85 belongs to the ccrr and a different question.")
    else:
        print(f"  gate {gate} (measured on this reference's own verdicts)")
    if held:
        print(f"  {len(held)} held by the curator, dropped before any call was spent")
    by_rule = {}
    for f in findings:
        by_rule[f["rule"]] = by_rule.get(f["rule"], 0) + 1
    for r, n in sorted(by_rule.items(), key=lambda kv: -kv[1]):
        print(f"    {n:>4}  {r}")
    if score_only:
        return findings, []

    results = []
    for i, f in enumerate(findings, 1):
        spec = rules[f["rule"]]
        state = {"item": f["item"], "evidence": f["evidence"], "proposed": f["suggestion"]}
        try:
            first = ask(state, spec, key)
        except SystemExit as e:
            print(f"  stopped at {i}: {e}")
            break
        agree, p_hold = (None, None)
        # The second look is spent ONLY where the first one is confident enough
        # to matter. Below the gate the curator sees it regardless, so a second
        # call would change no outcome and still cost a call.
        # ⚠️ AND NOT AT ALL WITHOUT A GATE. A calibration sitting exists to put
        # Jev's probability beside a curator's verdict; there is nothing to be
        # confident against yet, so the skeptic would double the calls to refute
        # a proposal this run is not making.
        if gate is not None and first["p"] is not None and first["p"] >= gate:
            try:
                agree, p_hold = second_look(state, spec, key)
            except SystemExit as e:
                print(f"  second look unavailable at {i}: {e}")
        act = act_bucket(first["p"], agree, gate)
        results.append({**f, **first, "agree": agree, "p_hold": p_hold, "act": act})
        pr = f"{first['p']:.2f}" if isinstance(first["p"], (int, float)) else " -- "
        print(f"  {act:<9} p={pr} care={first['care']} {f['rule'][:22]:<22} {f['item'][:46]}")
    return findings, results


def report(ref_key, results):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{ref_key}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"_doc": f"Jev suggestions for {REFS[ref_key][0]}. SUGGESTS, never merges. "
                           "Nothing here is written to Supabase and nothing is decided.",
                   "_gate": GATE, "findings": results}, fh, indent=1)
    buckets = {}
    for r in results:
        buckets[r["act"]] = buckets.get(r["act"], 0) + 1
    print(f"\n{'=' * 70}")
    for b in ("suggest", "contested", "curator", "uncalibrated", "unscored"):
        if buckets.get(b):
            print(f"  {b:<10} {buckets[b]:>4}")
    # ⚠️ The trial's own guard: one bucket means the model is not discriminating,
    # which looks identical to a clean result and is not one.
    if results and len([b for b in buckets if buckets[b]]) == 1:
        if buckets.get("uncalibrated"):
            # Expected, and not the failure the guard below is looking for: with
            # no gate there is only one bucket by construction.
            print("  calibration run — one bucket by construction. Rank by p, "
                  "take a curator's verdicts, then record a gate in GATES.")
        else:
            print("  ⚠️ EVERY finding landed in one bucket — Jev is not discriminating here.")
    if buckets.get("contested"):
        print(f"  ⚠️ {buckets['contested']} confident proposal(s) the independent second "
              f"look contradicted — these are the ones worth a curator's time first.")
    print(f"Wrote {path} — a worklist for a curator, not a decision.")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ref", required=True, choices=sorted(REFS), help="which reference")
    ap.add_argument("--limit", type=int, help="cap to the N highest-weight findings")
    ap.add_argument("--held", help="JSON file of finding ids the curator has parked")
    ap.add_argument("--rung", choices=CCR_RUNGS,
                    help="CCR only: which evidence to ask with. Ordered and "
                         "cumulative (title -> cip -> description); run ONE, "
                         "calibrate its gate on Sam's verdicts, then escalate "
                         "only the rows it left unsettled.")
    ap.add_argument("--dry-run", action="store_true",
                    help="show what would be asked, spend no calls, need no key")
    a = ap.parse_args()

    held = set()
    if a.held:
        held = set(json.load(open(a.held, encoding="utf-8")))

    if a.rung and a.ref != "ccr":
        ap.error("--rung applies to --ref ccr")

    if a.dry_run:
        run(a.ref, a.limit, held, key=None, score_only=True, rung=a.rung)
        return 0

    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if not key:
        print("❌ TYPESAFE_API_KEY is not set. typesafe.ai is egress-blocked from the "
              "agent sandbox — dispatch .github/workflows/typesafe-smoke.yml instead.")
        return 2
    _, results = run(a.ref, a.limit, held, key, rung=a.rung)
    report(a.ref, results)
    return 0


if __name__ == "__main__":
    sys.exit(main())
