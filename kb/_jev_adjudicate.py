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


def act_bucket(p, agree):
    """What to do with a finding. `agree` is the independent second look.

    ⚠️ Confidence alone never reaches the plan: a proposal the second look
    contradicts goes to the curator however sure the first was. That is the
    playbook's "a refuted merge falls back to the judgment queue"."""
    if p is None:
        return "unscored"
    if p >= GATE and agree is True:
        return "suggest"        # both looks agree; a curator still confirms
    if p >= GATE and agree is False:
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
CCR_ASKABLE = tuple(CCR_RULES)

# Held out of the ASK and named here so a future session reads the reason
# rather than re-deriving it and re-adding them.
CCR_NEVER_ASK = {
    "unit_anomaly": "units are not identity; Jev measured AUC 0.281 on this question",
    "top_discipline_disagreement": "Rule 7: TOP never gates a primary determination",
    "member_top_divergence": "Rule 7: TOP never gates a primary determination",
}
CCR_RANK_ONLY = {
    "subject_discipline_outlier": "a SUBJ4 change is a Rule 7 re-mint",
    "subject_collision_signal": "a SUBJ4 change is a Rule 7 re-mint",
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


def ccr_findings():
    """Trust Cards to questions, for the three tags that carry a content judgment.

    The card itself is compact (`id`, `tags`, `lev`, `fts` …) and holds no title,
    discipline or description, so the evidence is joined back from the minted
    course records the auditor read.

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

    TOP_DERIVED = {"top_code", "top_division"}
    out = []
    for c in cards:
        hits = [t for t in (c.get("tags") or []) if t in CCR_ASKABLE]
        if not hits:
            continue
        rec = courses.get(c["id"]) or {}
        title = (rec.get("common_title") or "").strip()
        disc = (rec.get("discipline") or "").strip()
        desc = (rec.get("description") or "").strip()
        if not title or not disc:
            # With no title or no discipline there is no question to put: the
            # row is a blank to repair, which `blank_*` already tags.
            continue
        src = rec.get("discipline_source") or ""
        disc_note = " (inferred from TOP, uncorroborated)" if src in TOP_DERIVED else ""
        desc = _clean_desc(desc)
        for tag in hits:
            # ⚠️ THE DESCRIPTION RIDES EVERY RULE, INCLUDING THE TITLE ONE.
            # `discipline_title_mismatch` fires on token overlap, so most of its
            # 1,118 rows are artifacts — `Three-Dimensional Design` under Art
            # and `Environmental Ethics` under Philosophy share no token with
            # their discipline and are both plainly right. The description is
            # the only evidence that separates those from a real miss, and the
            # real misses are obvious in it: an `Ethics` row under Philosophy
            # whose description is DEH-24's dental-hygiene prerequisites.
            # Withholding it would leave Jev judging a title against a label.
            ev = [f"title: {title}", f"discipline: {disc}{disc_note}"]
            if desc:
                ev.append(f"description: {desc[:300]}")
            ev.append(f"{c.get('lev') or 1} member course(s) across the colleges that offer it")
            out.append({
                "id": f"{c['id']}||{tag}",
                "rule": tag,
                "item": title,
                "evidence": " · ".join(ev),
                "suggestion": f"review the discipline recorded for {c['id']}",
                # The CCR's collapse-value analogue: how many local courses ride
                # this identity. Ranking by it puts the widest rows first.
                "weight": c.get("lev") or 1,
            })
    return out, "kb/row_audit/latest.json"


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


def run(ref_key, limit, held, key, score_only=False):
    title, loader, rules = REFS[ref_key]
    findings, source = loader()
    findings = [f for f in findings if f["id"] not in held]
    findings.sort(key=lambda f: -(f.get("weight") or 0))
    if limit:
        findings = findings[:limit]

    print(f"{title} ({ref_key}) — {len(findings)} finding(s) from {source}")
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
        if first["p"] is not None and first["p"] >= GATE:
            try:
                agree, p_hold = second_look(state, spec, key)
            except SystemExit as e:
                print(f"  second look unavailable at {i}: {e}")
        act = act_bucket(first["p"], agree)
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
    for b in ("suggest", "contested", "curator", "unscored"):
        if buckets.get(b):
            print(f"  {b:<10} {buckets[b]:>4}")
    # ⚠️ The trial's own guard: one bucket means the model is not discriminating,
    # which looks identical to a clean result and is not one.
    if results and len([b for b in buckets if buckets[b]]) == 1:
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
    ap.add_argument("--dry-run", action="store_true",
                    help="show what would be asked, spend no calls, need no key")
    a = ap.parse_args()

    held = set()
    if a.held:
        held = set(json.load(open(a.held, encoding="utf-8")))

    if a.dry_run:
        run(a.ref, a.limit, held, key=None, score_only=True)
        return 0

    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if not key:
        print("❌ TYPESAFE_API_KEY is not set. typesafe.ai is egress-blocked from the "
              "agent sandbox — dispatch .github/workflows/typesafe-smoke.yml instead.")
        return 2
    _, results = run(a.ref, a.limit, held, key)
    report(a.ref, results)
    return 0


if __name__ == "__main__":
    sys.exit(main())
