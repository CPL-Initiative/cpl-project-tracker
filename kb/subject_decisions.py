#!/usr/bin/env python3
"""A person's saved subject decisions, read once for every builder that honors them (#3655).

Sam, 2026-11-22 (r-subject-save-path-kb-curation-sam-2026-11-22, "Fine."): a person's save wins over the catalog, the
subject map and any recommendation; the subject map stays the statewide default by PR. CLAUDE.md, Person-settled
wins: a person's save is terminal, keyed so it survives rebuilds.

THE FILE. kb/status/subject_decisions.json, written by kb/_sync_subject_decisions.py from kb_curation:
  decisions  the Subjects page's saves: course_id SUBJ:<college slug>|<local code>|<band>, field subject_decision,
             value JSON with local_title and or common_code. band is credit (the code's credit courses), whole (a
             code COCI lists no course under), or nc:<category slug> (the code's noncredit courses in one COCI
             noncredit category; d-subject-save-key-three-part-s698). The slugs are the one list
             kb/status/noncredit_categories.json carries (slugs, written by kb/_build_noncredit_categories.py).
  statewide  the Local subjects List's filings (csr_local_subjects.js): course_id _SUBJ_DISC::<CODE>, field
             subject_discipline_confirm, value the MQ discipline a person filed the code under, at every college.
  courses    the Subjects panel's course moves (r-subjects-move-courses-sam-2026-11-22, d-course-move-field-crs-key-s705):
             course_id CRS:<college slug>|<local code>|<course number>, field course_subject_decision, value JSON with
             common_code, from_mid, title and band. One person's decision for one course.

PRECEDENCE for one college's code and band (resolve): the college-keyed decision, then COBI's common-subject pick,
then a person's statewide filing, then the subject map, then a recommendation (the last two are the callers' own).

COBI'S PICKS (S749; Sam's alignment rulings of 2026-11-28, relayed by COBIx). kb/subject_title_hunt/*common_picks*.csv,
one row per college code: college (or slug), local_subject_code, band (credit or whole), common_code, confidence
(0-100), found_by, basis. A pick carries Sam's newer rulings over the Nov 24 statewide filings, so it stands ahead of a
filing, and a person's college save stands ahead of it (Person-settled wins). It sets the Subjects row's common code,
with common_source "cobi" and its confidence; it never routes a mint (for_course reads the college save alone), as a
filing never does. Refused and listed: a noncredit band (the noncredit flag is its own build), a common code the
canonical file does not hold (the per-language codes and WKPR wait for theirs), a confidence outside 0-100, a row with
no finder, a college with no slug. A credit decision never touches the
code's noncredit courses (r-noncredit-disciplines-separate-in-mqs-sam-2026-11-21). Where the row's band has no save and
the other of credit and whole has one, that save stands, marked moved: the page's rule (commons_subjects.js savedOf),
so the page and the build read one decision.

NONCREDIT (#3655). A noncredit decision touches the college's noncredit courses (COCI N and E alike) under the code in
its own category only (noncredit_for, for_noncredit_course). A code has one local title: a code with credit courses
keeps it on its credit row, and a noncredit-only code on the row of its dominant category, the one with the most
courses (noncredit_title; a title saved under another category stands, marked moved). A category whose noncredit MQ
discipline has no common subject code (d-noncredit-four-categories-no-code-s701) takes a title and no code.

REFUSED, never applied, each listed with its reason: a key that does not parse, a band other than credit, whole and
nc:<a listed slug>, a value with neither a title nor a code, a common code kb/discipline_canonical_subj4.json does not
hold, a common code on a noncredit category that has none, and a statewide filing whose discipline has no canonical
SUBJ.

A COURSE MOVE is the most specific decision a person makes, so it settles its one course ahead of the code's decision,
a filing and the map (for_course_move). The re-mint's readiness gate and dry run read it (kb/_mid_readiness.py); the
nightly builders do not, because an M-ID moves only at a re-mint (docs/coursecontrolnumber_remint.md), never in a
nightly build. A move whose common code the canonical file does not hold is refused and listed.

THE MINT reads the college-keyed credit and whole decisions alone (for_course). A noncredit decision is kept apart
(Decisions.noncredit), so it never routes a mint. A statewide filing proposes a change to the subject map, which the
M-ID generator reads; the map changes through DR-25 with its ripple check (csr_local_subjects.js), so the filing shows
on the Subjects page and decides no M-ID.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coci_campus_letter import base_code as campus_base_code, fold as fold_campus_letter, SLUG as CAMPUS_LETTER_SLUG  # noqa: E402
from coci_subject_folds import base_code as subject_base_code, fold as fold_subject, SLUG as SUBJECT_FOLD_SLUG  # noqa: E402

def base_code(slug, code):
    """Campus-letter fold first, then the 2026-11-27 subject-parse folds."""
    b = campus_base_code(slug, code)
    return subject_base_code(slug, b)


def fold_course(college, subject, number, title=None):
    s, n = fold_campus_letter(college, subject, number)
    return fold_subject(college, s, n, title)



ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATUS = os.path.join("kb", "status", "subject_decisions.json")
CANONICAL = os.path.join("kb", "discipline_canonical_subj4.json")
PREFIX, FIELD = "SUBJ:", "subject_decision"
STATEWIDE_PREFIX, STATEWIDE_FIELD = "_SUBJ_DISC::", "subject_discipline_confirm"
COURSE_PREFIX, COURSE_FIELD = "CRS:", "course_subject_decision"
BANDS = ("credit", "whole")
OTHER_BAND = {"credit": "whole", "whole": "credit"}
CREDIT = "C"      # the state list's credit mark (kb/_build_coci_lookup.py credit_char)
NONCREDIT_MARKS = ("N", "E")      # noncredit and noncredit enhanced: both noncredit for the key (Sam, 2026-11-22)
NC_PREFIX = "nc:"
NC_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CATEGORIES = os.path.join("kb", "status", "noncredit_categories.json")
NO_CATEGORY = "(no category in the export)"


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


def course_number_key(s):
    """A course number as the Subjects page and kb/_mid_readiness.py key it: trimmed, upper case."""
    return str(s or "").strip().upper()


def parse_course_key(course_id):
    """(slug, code, number) for CRS:<slug>|<code>|<number>, or None. The page never saves a number holding a bar, so
    the number is the last part and a code may hold one."""
    s = str(course_id or "")
    if not s.startswith(COURSE_PREFIX):
        return None
    parts = s[len(COURSE_PREFIX):].split("|")
    if len(parts) < 3 or not parts[0] or not parts[-1].strip():
        return None
    code = "|".join(parts[1:-1])
    return (parts[0], code, parts[-1]) if code.strip() else None


def nc_band(category_slug):
    return NC_PREFIX + category_slug


def nc_slug_of(band):
    """The category slug of an nc:<slug> band, or None (credit, whole, or a malformed band)."""
    b = str(band or "")
    if not b.startswith(NC_PREFIX):
        return None
    slug = b[len(NC_PREFIX):]
    return slug if NC_SLUG_RE.match(slug) else None


def read_slugs(root=ROOT, path=None):
    """{slug: category} from the one list (kb/status/noncredit_categories.json slugs); {} where the file is absent."""
    p = path or os.path.join(root, CATEGORIES)
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        return {v: k for k, v in (json.load(f).get("slugs") or {}).items()}


def dominant(parts):
    """The category a noncredit-only code keeps its title under: the one with the most noncredit courses (ties A to
    Z), a named category before the export's blank one; None for no parts. commons_subjects.js dominantOf is the
    same rule."""
    live = [(n, k) for n, k in (parts or []) if n and k]
    named = [p for p in live if p[0] != NO_CATEGORY] or live
    return sorted(named, key=lambda p: (-p[1], p[0]))[0][0] if named else None


def canonical_codes(canon_doc):
    """canonical SUBJ -> its MQ discipline, and MQ discipline -> its canonical SUBJ."""
    by_code, by_disc = {}, {}
    for d, v in ((canon_doc or {}).get("disciplines") or {}).items():
        c = (v or {}).get("canonical_subj4")
        if c:
            by_code.setdefault(c, d)
            by_disc[d] = c
    return by_code, by_disc


CHIPS = os.path.join("kb", "subject_title_hunt", "*common_chips*.csv")
FLNG_DISCIPLINE = "Foreign Languages"


def root_of(_canon_doc):
    return ROOT


RECODED = os.path.join("kb", "receipts", "minted_codes_s749.json")


def recoded(root=ROOT):
    """{old common code: new}, from kb/_apply_minted_codes_s749.py's receipt."""
    path = os.path.join(root, RECODED)
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return {c["from"]: c["to"] for c in json.load(f).get("changed") or []}


def language_codes(root=ROOT):
    """The per-language common codes: every common_code the chips file marks with an FLNG chip (S749; Sam's ruling 8)."""
    import csv
    import glob
    out = set()
    for path in glob.glob(os.path.join(root, CHIPS)):
        with open(path, encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                code = (r.get("common_code") or "").strip().upper()
                if (r.get("chip") or "").strip().upper() == "FLNG" and re.match(r"^[A-Z]{4}$", code):
                    out.add(code)
    return out


class Decisions:
    """The decisions a build honors. college[(slug, code, band)] and statewide[map_key(code)] are records with
    key, common_code, local_title, discipline, who and at; refused lists what was not applied and why."""

    def __init__(self, doc, canon_doc, nc_slugs=None, nc_codes=None, picks=None, slugs=None):
        """nc_slugs: {slug: category}, the one list (read_slugs); nc_codes: {category: its common code or None}, the
        noncredit MQ table (kb/_build_noncredit_subject_titles.py MQ). With none given, every nc: band is refused."""
        self.doc = doc or {}
        self.by_code, by_disc = canonical_codes(canon_doc)
        # A per-language common code (SPAN, LATN, ...; Sam, 2026-11-28) is a common code under Foreign Languages: the
        # chips file names it with an FLNG chip (language_codes). A pick to it stands; its discipline is Foreign Languages.
        for code in sorted(language_codes(root_of(canon_doc))):
            if code not in self.by_code and by_disc.get(FLNG_DISCIPLINE):
                self.by_code[code] = FLNG_DISCIPLINE
        self.nc_slugs, self.nc_codes = dict(nc_slugs or {}), dict(nc_codes or {})
        self.slug_of = {v: k for k, v in self.nc_slugs.items()}
        self.college, self.noncredit, self.statewide, self.refused = {}, {}, {}, []
        self.course = {}
        self.picks = {}
        carried = []
        for d in self.doc.get("decisions") or []:
            why = None
            k = parse_key(d.get("key"))
            common = (d.get("common_code") or "").strip() or None
            title = (d.get("local_title") or "").strip() or None
            cat_slug = nc_slug_of(k[2]) if k else None
            category = self.nc_slugs.get(cat_slug) if cat_slug else None
            if not k:
                why = "the key does not read as SUBJ:<college>|<code>|<band>"
            elif k[2] not in BANDS and not cat_slug:
                why = "the band %s is not credit, whole or nc:<noncredit category>" % k[2]
            elif cat_slug and not category:
                why = "the noncredit category %s is not one %s names" % (k[2], CATEGORIES.replace(os.sep, "/"))
            elif not common and not title and not d.get("not_a_subject"):
                why = "the value holds neither a local title nor a common subject code"
            elif common and common not in self.by_code:
                why = "the common subject code %s is not a canonical SUBJ in %s" % (common, CANONICAL.replace(os.sep, "/"))
            elif common and category and not self.nc_codes.get(category):
                why = "the noncredit category %s has no common subject code, so it takes a title only" % category
            if why:
                self.refused.append({"key": d.get("key"), "why": why})
                continue
            rec = {"key": d["key"], "slug": k[0], "code": code_key(k[1]), "band": k[2], "common_code": common,
                   "discipline": self.by_code.get(common) if common else None, "local_title": title,
                   "who": d.get("who"), "at": d.get("at"), "from": "subject_decision",
                   "not_a_subject": bool(d.get("not_a_subject"))}
            # A save on a code COCI glued a campus letter to (Cerro Coso's ADMJC) carries to the folded code (ADMJ),
            # unless a save on that code itself exists: kb/coci_campus_letter.py, S744.
            base = code_key(base_code(k[0], k[1]))
            if base != rec["code"]:
                carried.append((rec, base, cat_slug))
                continue
            if cat_slug:
                rec.update(category=category, category_slug=cat_slug)
                self.noncredit[(k[0], rec["code"], cat_slug)] = rec
            else:
                self.college[(k[0], rec["code"], k[2])] = rec
        for rec, base, cat_slug in carried:
            rec = dict(rec, code=base, carried_from=rec["code"])
            if cat_slug:
                rec.update(category=self.nc_slugs.get(cat_slug), category_slug=cat_slug)
                self.noncredit.setdefault((rec["slug"], base, cat_slug), rec)
            else:
                self.college.setdefault((rec["slug"], base, rec["band"]), rec)
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
        slugs = slugs or {}
        for p in picks or []:
            where = "%s:%s" % (p.get("_file"), p.get("_line"))
            who = (p.get("found_by") or "").strip()
            raw = (p.get("slug") or p.get("college") or "").strip()
            slug = slugs.get(raw) or slugs.get(raw.lower())
            code = code_key(p.get("local_subject_code"))
            band = (p.get("band") or "credit").strip().lower()
            common = (p.get("common_code") or "").strip().upper() or None
            # A pick written against a code the minted list re-coded (CVTC, now CVTE) follows it (S749 receipt).
            common = recoded().get(common, common)
            try:
                conf = int(float((p.get("confidence") or "").strip()))
            except ValueError:
                conf = None
            why = None
            if not slug:
                why = "no slug for college %r" % raw
            elif not code:
                why = "the row names no local subject code"
            elif band not in BANDS:
                why = "the band %s is not credit or whole: noncredit picks wait for the noncredit flag" % band
            elif not common:
                why = "the row names no common subject code"
            elif common not in self.by_code:
                why = "the common subject code %s is not a canonical SUBJ in %s yet" % (common, CANONICAL.replace(os.sep, "/"))
            elif conf is None or not 0 <= conf <= 100:
                why = "the confidence is not a number from 0 to 100"
            elif not who:
                why = "the row names no finder (found_by)"
            if why:
                self.refused.append({"key": where, "why": why})
                continue
            base = code_key(base_code(slug, code))
            self.picks[(slug, base, band)] = {
                "key": where, "slug": slug, "code": base, "band": band, "common_code": common,
                "discipline": self.by_code.get(common), "local_title": None, "confidence": conf, "who": who,
                "basis": (p.get("basis") or "").strip() or None, "from": "cobi_pick"}
        for c in self.doc.get("courses") or []:
            k = parse_course_key(c.get("key"))
            common = (c.get("common_code") or "").strip().upper() or None
            why = None
            if not k:
                why = "the key does not read as CRS:<college>|<code>|<course number>"
            elif not common:
                why = "the move names no common subject code"
            elif common not in self.by_code:
                why = "the common subject code %s is not a canonical SUBJ in %s" % (common, CANONICAL.replace(os.sep, "/"))
            if why:
                self.refused.append({"key": c.get("key"), "why": why})
                continue
            college = CAMPUS_LETTER_SLUG.get(k[0]) or SUBJECT_FOLD_SLUG.get(k[0], "")
            ccode, cnum = fold_course(college, code_key(k[1]), course_number_key(k[2]), c.get("title"))
            ccode, cnum = code_key(ccode), course_number_key(cnum)
            self.course[(k[0], ccode, cnum)] = {
                "key": c["key"], "slug": k[0], "code": ccode, "number": cnum,
                "common_code": common, "discipline": self.by_code.get(common), "from_mid": c.get("from_mid"),
                "title": c.get("title"), "band": c.get("band"), "who": c.get("who"), "at": c.get("at"),
                "from": "course_subject_decision"}

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

    def noncredit_for(self, slug, code):
        """Every noncredit decision for one college's code, {category slug: record}."""
        k = code_key(code)
        return {c: r for (s_, k_, c), r in self.noncredit.items() if s_ == slug and k_ == k}

    def for_noncredit_course(self, slug, subject, credit_char, category):
        """The decision that gives one noncredit (N or E) state-list course its common code: the college's decision
        for the code under the course's own category, where it names a code. None for a credit course, for a course of
        another category or college, and for a decision that names a title only."""
        if credit_char not in NONCREDIT_MARKS or not slug:
            return None
        cat_slug = self.slug_of.get(category or NO_CATEGORY)
        r = self.noncredit.get((slug, code_key(subject), cat_slug)) if cat_slug else None
        return r if r and r.get("common_code") else None

    def noncredit_title(self, slug, code, holder):
        """The title decision of a noncredit-only code: its holder's (the dominant category's slug) where it names a
        title, else another category's, marked moved (the latest first, then by key); None where none names one."""
        mine = self.noncredit_for(slug, code)
        here = mine.get(holder)
        if here and here.get("local_title"):
            return dict(here, moved=False)
        rest = sorted((r for c, r in mine.items() if c != holder and r.get("local_title")),
                      key=lambda r: (str(r.get("at") or ""), r["key"]), reverse=True)
        return dict(rest[0], moved=True) if rest else None

    def for_course_move(self, slug, code, number):
        """A person's move of one course (CRS:<slug>|<code>|<number>) to a common code, credit or noncredit alike, or
        None. Read by the re-mint's gate and dry run only; the nightly mint never reads it (for_course)."""
        if not slug:
            return None
        return self.course.get((slug, code_key(code), course_number_key(number)))

    def pick_for(self, slug, code, band):
        """COBI's common-subject pick for a row's band, the other of credit and whole marked moved, or None."""
        if band not in BANDS:
            return None
        k = code_key(code)
        here = self.picks.get((slug, k, band))
        if here:
            return dict(here, moved=False)
        there = self.picks.get((slug, k, OTHER_BAND[band]))
        return dict(there, moved=True) if there else None

    def statewide_for(self, code):
        return self.statewide.get(map_key(code))

    def resolve(self, slug, code, band):
        """(record or None, source): source is subject_decision, cobi_pick, local_subjects_list or None (the caller's
        subject map, then its recommendation, answer)."""
        r = self.for_row(slug, code, band)
        if r:
            return r, "subject_decision"
        if band in BANDS:
            p = self.pick_for(slug, code, band)
            if p:
                return p, "cobi_pick"
            s = self.statewide_for(code)
            if s:
                return s, "local_subjects_list"
        return None, None

    def for_course(self, slug, subject, credit_char):
        """The decision that gives one state-list course its Common SUBJ: the college-keyed decision with a common
        code, for a credit course only (its row's band is credit; a whole save stands, marked moved). None for a
        noncredit or noncredit enhanced course, for a statewide filing, and for every noncredit decision: self.college
        never holds one, so the mint never routes by one."""
        if credit_char != CREDIT or not slug:
            return None
        r = self.for_row(slug, subject, "credit")
        assert r is None or r["band"] in BANDS, "a noncredit decision reached the mint: %s" % r["key"]
        return r if r and r.get("common_code") else None


def read_status(root=ROOT, path=None):
    p = path or os.path.join(root, STATUS)
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def nc_codes_table():
    """{category: its noncredit MQ discipline's common code or None}, from the one table
    (kb/_build_noncredit_subject_titles.py MQ)."""
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    if here not in sys.path:
        sys.path.insert(0, here)
    from _build_noncredit_subject_titles import MQ  # noqa: E402
    return {cat: code for cat, (_d, code) in MQ.items()}


PICKS = os.path.join("kb", "subject_title_hunt", "*common_picks*.csv")


def college_slug_map(root=ROOT):
    """College name, lower-cased, and slug -> slug, from the Subjects record and the catalogs' index."""
    import glob
    m = {}
    for path in glob.glob(os.path.join(root, "kb", "hand_filed_catalogs", "subjects", "*.json")):
        slug = os.path.basename(path)[:-5]
        try:
            with open(path, encoding="utf-8") as f:
                name = (json.load(f).get("college") or "").strip().lower()
        except (OSError, ValueError):
            continue
        m[slug] = slug
        if name:
            m.setdefault(name, slug)
    index = os.path.join(root, "kb", "hand_filed_catalogs", "courses", "index.json")
    if os.path.exists(index):
        with open(index, encoding="utf-8") as f:
            for c in json.load(f).get("colleges") or []:
                if c.get("slug"):
                    m.setdefault(c["slug"], c["slug"])
                    m.setdefault(str(c.get("college") or "").strip().lower(), c["slug"])
    return m


def read_picks(root=ROOT):
    """COBI's common-subject picks: every row of kb/subject_title_hunt/*common_picks*.csv, with its file."""
    import csv
    import glob
    out = []
    for path in sorted(glob.glob(os.path.join(root, PICKS))):
        with open(path, encoding="utf-8", newline="") as f:
            for i, r in enumerate(csv.DictReader(f), start=2):
                out.append(dict(r, _file=os.path.relpath(path, root).replace(os.sep, "/"), _line=i))
    return out


def load(root=ROOT, canon_doc=None, path=None):
    if canon_doc is None:
        with open(os.path.join(root, CANONICAL), encoding="utf-8") as f:
            canon_doc = json.load(f)
    return Decisions(read_status(root, path), canon_doc, read_slugs(root), nc_codes_table(),
                     picks=read_picks(root), slugs=college_slug_map(root))


def slugs_by_college(root=ROOT):
    """college_key(college name) -> the slug its filed catalog carries (kb/hand_filed_catalogs/courses/index.json),
    so a state-list course finds its college's decisions."""
    p = os.path.join(root, "kb", "hand_filed_catalogs", "courses", "index.json")
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        idx = json.load(f)
    return {college_key(c.get("college")): c.get("slug") for c in idx.get("colleges") or [] if c.get("slug")}
