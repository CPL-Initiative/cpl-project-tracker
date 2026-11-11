#!/usr/bin/env python3
"""exhibit_paths.py — a local exhibit's CPL path, and who assessed the student, read from its MAP id.

Sam's ruling, 2026-11-11 (issue #3110, rulings 1 and 2, relayed by COBIx): the canonical title carries
the credential's issuer, and each local exhibit carries its own path and assessor. One title holds
exhibits that reach it by different paths: a college's own exam for the course, and the certificate
itself. In 551 of 2,412 titles at least one local exhibit was assessed by someone other than the
title's issuer (COBIx's count, 2026-11-11).

MAP writes the path into the exhibit id, after MAP (or CPL on fourteen older ASE ids): IC industry
certification, CX / Cx / CBE credit by exam, SA standardized assessment, PR portfolio, MM and O other.
The id agrees with MAP's own type code on all but 22 of about 7,000 civilian ids (COBIx, #3110), so
it is read, never typed. MAP records neither "mirrored or not" for credit by exam nor an
apprenticeship path; those wait on fields Sam is asking ITPI for (ruling 6).

Who assessed follows the path: the credential's issuer for an industry certification, the college for
its own exam or a portfolio, the exam body for an exam score.

Readers: kb/_build_exhibits_related.py (the Exhibits tab's related-titles panel and rename batch).
The design note is docs/reference/canonical_credential_model.md.
"""
import re

ID = re.compile(r"^(?:MAP|CPL)(IC|CX|Cx|CBE|SA|PR|MM|O)")
# path key -> (the words a reviewer reads, who assessed the student)
PATHS = {
    "ic": ("industry certification", "issuer"),
    "cx": ("credit by exam", "college"),
    "pr": ("portfolio", "college"),
    "sa": ("exam score", "issuer"),
    "other": ("another path", ""),
}
ORDER = ["ic", "cx", "pr", "sa", "other"]
_KEY = {"IC": "ic", "CX": "cx", "Cx": "cx", "CBE": "cx", "SA": "sa", "PR": "pr", "MM": "other", "O": "other"}


def path_of(exhibit_id):
    """The path key of a MAP exhibit id, or "" for an id that is not MAP's (an ACE military id)."""
    m = ID.match(exhibit_id or "")
    return _KEY[m.group(1)] if m else ""


def tally(exhibit_ids):
    """How many of a title's local exhibits arrive by each path, in ORDER: [[key, n], ...]."""
    counts = {}
    for i in dict.fromkeys(exhibit_ids or []):
        k = path_of(i)
        if k:
            counts[k] = counts.get(k, 0) + 1
    return [[k, counts[k]] for k in ORDER if k in counts]


def mixed(paths):
    """True where a title's local exhibits were not all assessed by the same kind of body."""
    who = {PATHS[k][1] for k, _ in paths if PATHS[k][1]}
    return len(who) > 1
