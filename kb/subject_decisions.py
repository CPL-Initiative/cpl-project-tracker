#!/usr/bin/env python3
"""A person's saved subject decisions, read once for every builder that honors them (#3655).

Sam, 2026-11-22 (r-subject-save-path-kb-curation-sam-2026-11-22, "Fine."): a person's save wins over the catalog, the
subject map and any recommendation; the subject map stays the statewide default by PR. CLAUDE.md, Person-settled
wins: a person's save is terminal, keyed so it survives rebuilds.

THE FILE. kb/status/subject_decisions.json, written by kb/_sync_subject_decisions.py from kb_curation:
  decisions  the Subjects page's saves: course_id SUBJ:<college slug>|<local code>|<band>, field subject_decision,
             value JSON with local_title and or common_code. band is credit (the code's credit courses) or whole
             (a code COCI lists no course under).
  statewide  the Local subjects List's filings (csr_local_subjects.js): course_id _SUBJ_DISC::<CODE>, field
             subject_discipline_confirm, value the MQ discipline a person filed the code under, at every college.

PRECEDENCE for one college's code and band (resolve): the college-keyed decision, then a person's statewide filing,
then the subject map, then a recommendation (the last two are the callers' own). A credit decision never touches the
code's noncredit courses (r-noncredit-disciplines-separate-in-mqs-sam-2026-11-21), and a noncredit row takes no
decision until noncredit saves are keyed by category (d-subject-save-key-three-part-s698). Where the row's band has
no save and the other of credit and whole has one, that save stands, marked moved: the page's rule
(commons_subjects.js savedOf), so the page and the build read one decision.

REFUSED, never applied, each listed with its reason: a key that does not parse, a band other than credit and whole, a
value with neither a title nor a code, a common code kb/discipline_canonical_subj4.json does not hold, and a statewide
filing whose discipline has no canonical SUBJ.

THE MINT reads the college-keyed decisions alone (for_course). A statewide filing proposes a change to the subject map,
which the M-ID generator reads; the map changes through DR-25 with its ripple check (csr_local_subjects.js), so the
filing shows on the Subjects page and decides no M-ID.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATUS = os.path.join("kb", "status", "subject_decisions.json")
CANONICAL = os.path.join("kb", "discipline_canonical_subj4.json")
PREFIX, FIELD = "SUBJ:", "subject_decision"
STATEWIDE_PREFIX, STATEWIDE_FIELD = "_SUBJ_DISC::", "subject_discipline_confirm"
BANDS = ("credit", "whole")
OTHER_BAND = {"credit": "whole", "whole": "credit"}
CREDIT = "C"      # the state list's credit mark (kb/_build_coci_lookup.py credit_char)


def code_key(s):
    """kb/_build_local_subject_titles.py code_key: the Subjects rows' code."""
    return str(s or "").strip().upper()


def map_key(s):
    """The subject map's key form: upper case, letters and digits only."""
    return re.sub(r"[^A-Z0-9]", "", code_key(s))


def college_key(s):
    """kb/_build_local_subject_titles.py college_key."""
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def parse_key(course_id):
    """(slug, code, band) for SUBJ:<slug>|<code>|<band>, or None. A code may hold a bar; the band is the last part."""
    s = str(course_id or "")
    if not s.startswith(PREFIX):
        return None
    parts = s[len(PREFIX):].split("|")
    if len(parts) < 3 or not parts[0] or not parts[-1]:
        return None
    code = "|".join(parts[1:-1])
    return (parts[0], code, parts[-1]) if code else None


def canonical_codes(canon_doc):
    """canonical SUBJ -> its MQ discipline, and MQ discipline -> its canonical SUBJ."""
    by_code, by_disc = {}, {}
    for d, v in ((canon_doc or {}).get("disciplines") or {}).items():
        c = (v or {}).get("canonical_subj4")
        if c:
            by_code.setdefault(c, d)
            by_disc[d] = c
    return by_code, by_disc


class Decisions:
    """The decisions a build honors. college[(slug, code, band)] and statewide[map_key(code)] are records with
    key, common_code, local_title, discipline, who and at; refused lists what was not applied and why."""

    def __init__(self, doc, canon_doc):
        self.doc = doc or {}
        self.by_code, by_disc = canonical_codes(canon_doc)
        self.college, self.statewide, self.refused = {}, {}, []
        for d in self.doc.get("decisions") or []:
            why = None
            k = parse_key(d.get("key"))
            common = (d.get("common_code") or "").strip() or None
            title = (d.get("local_title") or "").strip() or None
            if not k:
                why = "the key does not read as SUBJ:<college>|<code>|<band>"
            elif k[2] not in BANDS:
                why = "the band %s is not credit or whole" % k[2]
            elif not common and not title:
                why = "the value holds neither a local title nor a common subject code"
            elif common and common not in self.by_code:
                why = "the common subject code %s is not a canonical SUBJ in %s" % (common, CANONICAL.replace(os.sep, "/"))
            if why:
                self.refused.append({"key": d.get("key"), "why": why})
                continue
            self.college[(k[0], code_key(k[1]), k[2])] = {
                "key": d["key"], "slug": k[0], "code": code_key(k[1]), "band": k[2], "common_code": common,
                "discipline": self.by_code.get(common) if common else None, "local_title": title,
                "who": d.get("who"), "at": d.get("at"), "from": "subject_decision"}
        for s in self.doc.get("statewide") or []:
            code, disc = map_key(s.get("code")), (s.get("discipline") or "").strip()
            common = by_disc.get(disc)
            if not code or not disc:
                self.refused.append({"key": s.get("key"), "why": "the filing names no code or no discipline"})
                continue
            if not common:
                self.refused.append({"key": s.get("key"), "why": "the discipline %s has no canonical SUBJ" % disc})
                continue
            self.statewide[code] = {"key": s.get("key"), "code": code, "common_code": common, "discipline": disc,
                                    "local_title": None, "who": s.get("who"), "at": s.get("at"),
                                    "from": "local_subjects_list"}

    def for_row(self, slug, code, band):
        """The college-keyed decision for a Subjects row under its band (credit, whole or noncredit), the other of
        credit and whole marked moved, or None. A noncredit row takes none."""
        if band not in BANDS:
            return None
        k = code_key(code)
        here = self.college.get((slug, k, band))
        if here:
            return dict(here, moved=False)
        there = self.college.get((slug, k, OTHER_BAND[band]))
        return dict(there, moved=True) if there else None

    def statewide_for(self, code):
        return self.statewide.get(map_key(code))

    def resolve(self, slug, code, band):
        """(record or None, source): source is subject_decision, local_subjects_list or None (the caller's subject
        map, then its recommendation, answer)."""
        r = self.for_row(slug, code, band)
        if r:
            return r, "subject_decision"
        if band in BANDS:
            s = self.statewide_for(code)
            if s:
                return s, "local_subjects_list"
        return None, None

    def for_course(self, slug, subject, credit_char):
        """The decision that gives one state-list course its Common SUBJ: the college-keyed decision with a common
        code, for a credit course only (its row's band is credit; a whole save stands, marked moved). None for a
        noncredit or noncredit enhanced course and for a statewide filing."""
        if credit_char != CREDIT or not slug:
            return None
        r = self.for_row(slug, subject, "credit")
        return r if r and r.get("common_code") else None


def read_status(root=ROOT, path=None):
    p = path or os.path.join(root, STATUS)
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def load(root=ROOT, canon_doc=None, path=None):
    if canon_doc is None:
        with open(os.path.join(root, CANONICAL), encoding="utf-8") as f:
            canon_doc = json.load(f)
    return Decisions(read_status(root, path), canon_doc)


def slugs_by_college(root=ROOT):
    """college_key(college name) -> the slug its filed catalog carries (kb/hand_filed_catalogs/courses/index.json),
    so a state-list course finds its college's decisions."""
    p = os.path.join(root, "kb", "hand_filed_catalogs", "courses", "index.json")
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        idx = json.load(f)
    return {college_key(c.get("college")): c.get("slug") for c in idx.get("colleges") or [] if c.get("slug")}
