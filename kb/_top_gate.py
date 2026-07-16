"""Shared TOP-gating predicate — the "TOP is a last-in-line signal" doctrine.

TOP codes are faculty-entered in COCI with no data-entry gatekeeper, so a
discipline inferred from TOP (`discipline_source` == "top_code" / "top_division",
confidence 0.4-0.5) is a low-confidence guess. Per Sam's 2026-07-16 ruling
("gate identity, keep display") such a discipline still DISPLAYS on the
dashboard (with the ⚙ generated-by badge) but must be HELD OUT of every
IDENTITY determination — the canonical-SUBJ4 vote and the fold that assigns a
row its M-ID SUBJ4 — until a stronger signal (subject_map / curator) corroborates
it.

Doctrine + rationale: docs/kb-notes/methodology-top-is-a-last-in-line-signal.md
"""

# The discipline_source values that mean "this discipline came SOLELY from TOP".
TOP_DISCIPLINE_SOURCES = ("top_code", "top_division")


def is_top_sourced(rec):
    """True iff the row's discipline was inferred from TOP alone (uncorroborated)."""
    return (rec or {}).get("discipline_source") in TOP_DISCIPLINE_SOURCES


def discipline_is_corroborated(rec):
    """True iff the row's discipline may participate in an IDENTITY decision
    (the canonical-SUBJ4 vote / fold): it has a discipline whose source is NOT
    TOP-only. Curated, reviewed, subject_map, title_keyword, and description
    sources all qualify; top_code / top_division do not (they wait for a second
    signal). A blank discipline never participates.
    """
    return bool((rec or {}).get("discipline")) and not is_top_sourced(rec)
