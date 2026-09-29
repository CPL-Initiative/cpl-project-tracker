#!/usr/bin/env python3
"""Trail Crew 🥾 — CSR pass (method half). Deterministic, re-runnable, READ-ONLY.

Walks the Common Subject Reference (CSR) — the 146-discipline canonical-SUBJ4
registry `kb/discipline_canonical_subj4.json` (synced from Supabase
`_CANON_SUBJ4::` picks) — against the official CCN vocabulary, the M-ID
minting path, and the curated common-courses anchor. Every finding is a
CANDIDATE for the magic (adjudication) half; the scanner never writes.

Doctrine (Sam, 2026-07-10): the CSR is the KEY-GENERATING layer ("they are
used to mint MIDs; the CSR, CCR, CER constitute the heart of our ability to
scale CPL statewide then nationwide"). SUBJ4 re-keys stage EVIDENCE ONLY —
applies are Rule-7 re-mints under docs/coursecontrolnumber_remint.md.

CSR CANON (encoded rules)
  CS1 format        — every canonical_subj4 matches ^[A-Z]{4}$ (Rule-7 invariant).
  CS2 uniqueness    — one canonical per discipline; no two disciplines share a
                      canonical (umbrella disciplines FL**/KINE+ATHL are the
                      documented exception at the IDENTITY layer, not here).
                      A ruled fan-in, both entries naming each other in
                      `fan_in_with` (FTVE, Sam 2026-09-03), is exempt.
  CS3 no-squat      — a canonical MUST NOT equal an official CCN subject prefix
                      while meaning something different (semantic squatting).
                      Official prefixes come from the COCI extract's CCN column
                      (coci_lookup_data.js) ∪ official rows of common_courses.json.
  CS4 alignment     — where a discipline is the semantic twin of an official CCN
                      subject, sharing its prefix is PREFERRED (ENGL, PSYC …);
                      a twin using a different code is a missed alignment
                      (POSC vs official POLS) — curator judgment, evidence only.
  CS5 modal-respect — canonical differing from a STRONG 4-letter data modal
                      (share ≥ 0.5) needs a recorded reason (usually deliberate;
                      confirm lane).
  CS6 mnemonic      — canonical should be recognizably derived from the
                      discipline name OR appear among its observed local
                      subject variants (CRIM for Administration of Justice
                      passes via variants; an arbitrary code fails).
  CS7 hygiene       — needs_review must be false; reviewed_by present.
  CS8 wiring        — the registry must actually be CONSULTED by the mint path
                      (kb/_seed_coci_minted_mids.py) per Rule 7; a registry no
                      producer consults is decoration.
  CS9 anchor        — common_courses.json (CURATED ANCHOR, firewalled) M-ID
                      entries: keys in the dead pre-remint `M-ID SUBJ NNN`
                      format and id prefixes diverging from the CSR canonical
                      (umbrellas exempt) are staged evidence for the
                      promote-time re-key. The `subject` field is the modal
                      LOCAL code and never the comparison.

Usage:  python3 kb/_csr_trail.py            # writes kb/csr_out/<date>/findings.{json,csv}
"""

import csv
import json
import os
import re
import sys
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(HERE, "csr_out", str(date.today()))

UMBRELLA_DISCIPLINES = {"Foreign Languages", "Kinesiology", "Agriculture", "Agricultural Production"}  # kb/_row_audit.py

STOP = {"and", "of", "the", "for", "in", "to", "a", "an", "&", "/", "studies", "study",
        "science", "sciences", "technology", "general"}


def name_tokens(name):
    return [w for w in re.findall(r"[A-Za-z]+", name.upper()) if w.lower() not in STOP]


def _is_subsequence(needle, hay):
    it = iter(hay)
    return all(ch in it for ch in needle)


def mnemonic_ok(canon, disc, variants):
    """CS6 — canonical derivable from the name, or present in observed variants.

    Tuned 2026-07-10 per adjudicator CSR0040 (skeptic-upheld): also pass when
    the canonical is (a) a SUBSEQUENCE of the stopword-stripped discipline name
    (STMF ⊂ STeaMFitting) or (b) a prefix of any whitespace-stripped observed
    variant (STMF < STMFT) — the old heuristic generated low-value churn.
    """
    stripped = {v.upper().replace(" ", "") for v in variants}
    if canon in stripped:
        return True
    if any(v.startswith(canon) or canon.startswith(v) for v in stripped if len(v) >= 3):
        return True
    toks = name_tokens(disc)
    if not toks:
        return False
    joined = "".join(toks)
    if _is_subsequence(canon, joined):
        return True
    for t in toks:
        if t.startswith(canon):
            return True
    initials = "".join(t[0] for t in toks)
    if canon in initials or initials.startswith(canon[:2]):
        return True
    for a in range(1, 4):
        for t1 in toks:
            for t2 in toks:
                if t1 != t2 and (t1[:a] + t2[: 4 - a]) == canon:
                    return True
    return False


def load_official_ccn_prefixes():
    prefixes = Counter()
    # 1. COCI extract CCN column
    src = open(os.path.join(ROOT, "coci_lookup_data.js"), encoding="utf-8").read()
    payload = json.loads(src[src.find("=") + 1:].strip().rstrip(";"))
    for r in payload["rows"]:
        ccn = r[9] if len(r) > 9 else ""
        if ccn:
            prefixes[str(ccn).split()[0]] += 1
    # 2. official (non-M-ID) rows of the curated anchor
    anchor = json.load(open(os.path.join(HERE, "common_courses.json")))
    for key, rec in anchor.items():
        if isinstance(rec, dict) and rec.get("id_system") != "M-ID":
            prefixes[key.split()[0]] += 0  # presence only; COCI counts dominate
    return prefixes


def cs2_dups(disciplines):
    """Pairs of disciplines sharing one canonical: [(first, second, code)].

    A RULED FAN-IN IS NOT A DUPLICATE. Sam's 2026-09-03 rulings (item 13) put
    Film and Media Studies and Media Production on the C-ID code FTVE on
    purpose: two MQ disciplines, both names kept, one Common SUBJ. The registry
    records it on both entries (`fan_in_with`, `_fan_in_note`), and Rule 7 names
    the fan-in beside the umbrella as a structural exception. Only a MUTUAL
    declaration exempts a pair, so one entry cannot silence a collision alone."""
    seen, out = {}, []
    for disc, e in sorted(disciplines.items()):
        c = e.get("canonical_subj4") or ""
        if c in seen:
            first = seen[c]
            mine = e.get("fan_in_with") or []
            theirs = (disciplines.get(first) or {}).get("fan_in_with") or []
            if not (first in mine and disc in theirs):
                out.append((first, disc, c))
        else:
            seen[c] = disc
    return out


DEAD_ANCHOR_KEY = re.compile(r"M-ID ([A-Z/&\- ]+?) \d")


def cs9_anchor(anchor, disciplines):
    """The curated anchor's M-ID entries against the CSR: (dead, diverged).

    ⚠️ COMPARE THE IDENTITY, NEVER THE `subject` FIELD. The anchor was re-keyed
    from `M-ID SUBJ NNN` to `SUBJ4 M####`, and the old rule, finding no dead
    key to read, fell back to `rec["subject"]` -- the MODAL LOCAL code colleges
    typed (`ACCT` on `BUSI M11TR`, `MUS` on the 23 `MUSI` rows). On 2026-09-29
    that reported 108 anchors as re-mint questions whose ids already carried the
    canonical, and counted all 218 M-ID anchors as dead-format when 3 were.

    Umbrella disciplines are the documented exception at the identity layer
    (the module docstring's CS2 note): a language keeps its own code under
    Foreign Languages, ATHL sits under Kinesiology. CS6 skips them for the same
    reason, and so does this rule."""
    dead, diverged = [], []
    for key, rec in anchor.items():
        if not (isinstance(rec, dict) and rec.get("id_system") == "M-ID"):
            continue
        m = DEAD_ANCHOR_KEY.match(key)
        if m:
            dead.append(key)
            prefix = m.group(1).strip()
        else:
            prefix = key.split()[0] if key.split() else ""
        disc = rec.get("discipline")
        if not disc or disc in UMBRELLA_DISCIPLINES:
            continue
        canon = (disciplines.get(disc) or {}).get("canonical_subj4")
        if canon and prefix and prefix != canon:
            diverged.append((key, prefix, canon))
    return dead, diverged


def main():
    reg = json.load(open(os.path.join(HERE, "discipline_canonical_subj4.json")))
    disciplines = reg["disciplines"]
    official = load_official_ccn_prefixes()
    anchor = json.load(open(os.path.join(HERE, "common_courses.json")))

    findings = []
    fid = [0]

    def add(rule, item, evidence, needs_judgment, suggestion=None, group=None):
        fid[0] += 1
        findings.append({
            "id": "CSR%04d" % fid[0], "rule": rule, "item": item,
            "evidence": evidence, "suggestion": suggestion,
            "needs_judgment": needs_judgment, "group": group,
        })

    # ── CS1 + CS2 ──
    for disc, e in sorted(disciplines.items()):
        c = e.get("canonical_subj4") or ""
        if not re.fullmatch(r"[A-Z]{4}", c):
            add("cs1_format", disc, "canonical_subj4=%r violates ^[A-Z]{4}$" % c, False)
    for first, disc, c in cs2_dups(disciplines):
        add("cs2_dup", "%s ↔ %s" % (first, disc),
            "both map to %s" % c, True, group="dup:%s" % c)

    # ── CS3 squat / CS4 alignment ──
    twins = {  # official prefix -> substring the discipline name must contain to be its twin
        # COCI-observed CCN prefixes
        "ENGL": "english", "PSYC": "psycholog", "STAT": "statistic", "MATH": "mathemat",
        "COMM": "communication", "HIST": "history", "ECON": "econom", "POLS": "politic",
        "ANTH": "anthropolog", "ARTH": "art history", "BIOL": "biolog", "ASTR": "astronom",
        "SOCI": "sociolog", "CDEV": "child development",
        # anchor officials (0 COCI rows today — the CSR0014-class false positives
        # came from these missing; adjudicator-confirmed twins, 2026-07-10)
        "ACCT": "account", "EDUC": "education", "ENGR": "engineer", "GEOG": "geograph",
        "JOUR": "journalis", "HOSP": "hospitality", "SPAN": "spanish",
        "CMUS": "commercial music", "BSOT": "office technolog", "HIT": "health information",
        "ITIS": "information systems",
    }
    canon_by_prefix = {e["canonical_subj4"]: d for d, e in disciplines.items()}
    for prefix, n in sorted(official.items(), key=lambda x: -x[1]):
        holder = canon_by_prefix.get(prefix)
        twin_sub = twins.get(prefix, "")
        if holder:
            aligned = bool(twin_sub) and twin_sub in holder.lower()
            if aligned:
                add("cs4_aligned", holder,
                    "canonical %s == official CCN prefix (%d official rows) — semantic twin, ALIGNED" % (prefix, n),
                    True, suggestion="bless as aligned; record alignment doctrine", group="ccn")
            else:
                add("cs3_squat", holder,
                    "canonical %s == official CCN prefix (%d rows) but discipline %r is NOT its semantic twin" % (prefix, n, holder),
                    True, suggestion="re-key evidence (Rule-7 re-mint) — official prefixes are reserved", group="ccn")
        else:
            # official prefix unused by CSR — is there a twin discipline using a different code?
            twin = next((d for d in disciplines if twin_sub and twin_sub in d.lower()), None)
            if twin:
                add("cs4_missed_alignment", twin,
                    "official CCN prefix %s (%d rows) unused; twin discipline uses %s" % (prefix, n, disciplines[twin]["canonical_subj4"]),
                    True, suggestion="curator call: converge %s → %s (Rule-7 re-mint) or record divergence reason" % (disciplines[twin]["canonical_subj4"], prefix),
                    group="ccn")

    # ── CS5 modal-respect ──
    for disc, e in sorted(disciplines.items()):
        if e.get("data_modal_is_4letter") and (e.get("data_modal_share") or 0) >= 0.5 \
                and e["data_modal"] != e["canonical_subj4"] and not e.get("_notes"):
            add("cs5_modal_diverge", disc,
                "modal %s (share %.2f) but canonical %s, no _notes" % (e["data_modal"], e["data_modal_share"], e["canonical_subj4"]),
                True, suggestion="confirm choice + record a note")

    # ── CS6 mnemonic ──
    for disc, e in sorted(disciplines.items()):
        c = e["canonical_subj4"]
        if disc in UMBRELLA_DISCIPLINES:
            continue
        if not mnemonic_ok(c, disc, e.get("local_subject_variants", {})):
            add("cs6_weak_mnemonic", disc,
                "canonical %s not derivable from name and absent from %d observed variants" % (c, len(e.get("local_subject_variants", {}))),
                True, suggestion="confirm or improve mnemonic (re-key evidence only)")

    # ── CS7 hygiene ──
    for disc, e in sorted(disciplines.items()):
        if e.get("needs_review"):
            add("cs7_needs_review", disc, "needs_review=true", True)
        if not e.get("reviewed_by"):
            add("cs7_unreviewed", disc, "no reviewed_by stamp", True)

    # ── CS8 wiring ──
    seeder = open(os.path.join(HERE, "_seed_coci_minted_mids.py"), encoding="utf-8").read()
    if "discipline_canonical_subj4" not in seeder:
        add("cs8_seeder_bypass", "kb/_seed_coci_minted_mids.py",
            "Rule 7 says new mints consult discipline_canonical_subj4.json; the seeder "
            "numbers per MODAL subject via reference/subject_discipline_map.json and never "
            "references the canonical registry — new mints can re-introduce folded variants",
            True, suggestion="wire the seeder: after discipline resolution, key new M-IDs under the canonical SUBJ4")

    # ── CS9 anchor ──
    dead, diverged = cs9_anchor(anchor, disciplines)
    if dead:
        add("cs9_anchor_dead_format", "common_courses.json",
            "%d anchor entries keyed in the dead pre-remint 'M-ID SUBJ NNN' format" % len(dead),
            True, suggestion="promote-time re-key plan (Rule-7); anchor stays firewalled until then",
            group="anchor")
    for key, prefix, canon in diverged[:200]:
        add("cs9_anchor_subj_diverge", key,
            "anchor id prefix %s vs CSR canonical %s" % (prefix, canon), True,
            suggestion="fold to %s at promote-time" % canon, group="anchor")

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "findings.json"), "w") as f:
        json.dump({"_scanned_at": str(date.today()),
                   "_registry_synced_at": reg.get("_synced_at"),
                   "_disciplines": len(disciplines),
                   "_official_ccn_prefixes": dict(official),
                   "findings": findings}, f, indent=1, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "findings.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "rule", "item", "evidence", "suggestion", "needs_judgment", "group"])
        w.writeheader()
        w.writerows(findings)

    by_rule = Counter(f["rule"] for f in findings)
    print("CSR trail scan: %d findings across %d disciplines" % (len(findings), len(disciplines)))
    for r, n in by_rule.most_common():
        print("  %-24s %d" % (r, n))
    print("→ %s" % OUT_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main())
