#!/usr/bin/env python3
"""_build_exhibits_review.py — the Exhibits tab's Review queue, one record per held title.

Sam, Open Asks Sheet 147 card 1 (2026-10-31, "merge"): one Exhibits tab in the Catalog Commons
replaces the CER and EACR, and Review is built first. The drawn card is the mock-up at version 26
(docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html): the canonical title is the focus, the
local titles sit under it in small print, and the college chips say where the exhibit is
articulated and who could adopt it.

What it joins, all committed files:
  kb/cer_procedures_out/latest.json   the held titles (needs_you) and the step each is in
  kb/unclassified_suggestions.json    `aligned`: the course each title's exhibit articulates to,
                                      which names the proposal (Sam, 2026-10-30: "if there's a M-ID
                                      title aligned show it and let it determine the proposed
                                      classifyer")
  statewide_data.js                   each title's exhibits: their IDs and where they are articulated;
                                      per credential, what each college articulated (its credit
                                      recommendations and units) and the exhibits in MAP
  unified_courses_members.js          the colleges holding a course of the aligned identity, and
                                      those courses (a could-adopt chip opens them)
  statewide_prescriptive.js           the colleges that already teach a course mapped to a credential's
                                      M-ID identity, and the courses (over-merged identities withheld):
                                      Exhibit Adoption's could-adopt since Sam's ruling of 2026-09-24
  kb/unified_titles.json              the local titles already under the proposed title
  kb/credentials.json                 whether the proposed title is a credential yet, its training site
  kb/credential_review_overlay.json   the training sites a curator set in the credential panel, which
                                      stand in for the records' own
  kb/exhibit_audit/latest.json        the Names tile, and which titles still wait: the daily fold can settle
                                      a held title between the nightly run and this build
  kb/unclassified_assignments.json    titles a person or a rule saved since, which the fold has not added

Students per title are not here: they are a reviewer-only read of map_student_credit, k=10
(exhibit_title_students(), kb/migrations/), and the tab asks for them with each title's `ids`.

Could adopt never reads EACR's `potential_names`: that list is every college with a program under
one of the exhibit's TOP codes or a course carrying one of its C-IDs, and Exhibit Adoption took it off
every screen on 2026-09-24 (Sam; Rule 7, TOP is a last-in-line signal). A held title's could-adopt
colleges hold a course of the aligned identity, else teach a course mapped to the proposed credential
(the prescriptive layer), else none are named.

Runs nightly at the end of cer-procedures.yml and daily from daily-dashboard.yml. Writes
kb/exhibits_review.json and kb/exhibits_review_courses.json (the Review queue) and
kb/exhibits_adoption.json (the credential panel's "Who could adopt it?", Exhibit Adoption's
per-credential view folded into the Exhibits tab), which exhibits.js reads.

Usage, from the repo root:
  python3 kb/_build_exhibits_review.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import datetime as dt
import json
import os
import re
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _suggest_unclassified import load_js, norm_college  # noqa: E402
import cert_naming  # noqa: E402
import credential_aliases  # noqa: E402
import exhibit_paths  # noqa: E402
import title_in_use  # noqa: E402

SCHEMA = 1
OUT = "kb/exhibits_review.json"
COURSES_OUT = "kb/exhibits_review_courses.json"
ADOPTION_OUT = "kb/exhibits_adoption.json"
TEACHES = "teaches:"   # the courses file's key for a credential's prescriptive courses

PROPOSED = "Proposed"
WORDING = "Wording check"
TWO_ISSUERS = "Two issuers"
CONFLICT = "Conflict with the reference"
STEPS = [PROPOSED, WORDING, TWO_ISSUERS, CONFLICT]

KIND_WORD = {"ccn": "CCN", "cid": "C-ID", "mid": "M-ID"}

# Where a proposal came from (Sam's two rulings in session, 2026-11-12; the record's `proposal_source`):
#   in_use_statewide   a statewide exhibit already in the reference, same issuer (kb/title_in_use.py)
#   in_use_most_used   the most used title in the reference, same issuer (kb/title_in_use.py)
#   course             the course the exhibit articulates to (M-ID, C-ID, CCN or the college's own course)
#   official_name      the certification's official name (kb/cert_naming.py, the credential watch's catalog)
#   classifier, procedure, reference   the classifier's title, a CER procedure's, a person-reviewed one
SRC_STATEWIDE, SRC_MOST_USED = title_in_use.STATEWIDE, title_in_use.MOST_USED
SRC_COURSE, SRC_OFFICIAL = "course", "official_name"
SRC_CLASSIFIER, SRC_PROCEDURE, SRC_REFERENCE = "classifier", "procedure", "reference"
CATALOG = "kb/it_ai_credential_catalog.json"
STATEWIDE_RECS = "fact-sheet/statewide_recs.js"
UNDER_CAP = 40   # local titles kept per proposed title; the count says how many in all


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(root, rel, default=None):
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def step_of(item):
    """The CER step a held title is in, from the reason the procedures run wrote."""
    if item.get("fold_report"):
        return CONFLICT
    why = item.get("why") or ""
    if why.startswith("the classifier's title has"):
        return WORDING
    if "join two issuers" in why:
        return TWO_ISSUERS
    return PROPOSED


def basis_of(aligned):
    """'C-ID ARTS 250', or the college's own course when no common identity names it."""
    if not aligned:
        return ""
    word = KIND_WORD.get(aligned.get("kind"))
    if word:
        return word + " " + aligned["id"]
    return "the course " + aligned.get("code", "")


def is_credit_by_exam(ex):
    """Every exhibit behind the local title is credit by exam: its MAP id (kb/exhibit_paths.py), else MAP's CPL type."""
    paths = sorted({exhibit_paths.path_of(i) for i in ex.get("ids") or []} - {""})
    types = ex.get("types") or []
    return paths == ["cx"] if paths else (bool(types) and all(t == "Credit By Exam" for t in types))


def course_title_fits(ex, issuer=""):
    """Sam, in session, 2026-11-12 (`sam-cert-title-official-name-not-mid-2026-11-12`): "The MID title works well for
    cx because those are single course exhibits...but many if not most industry certs like Firefighter 1, POST, Real
    Estate Sales, Comptia Network+ have several CRs and need a non-course based canonical title that best aligns with
    the official name of the cert or license or training program". A course's title names the exhibit only when every
    exhibit behind the local title is credit by exam (its MAP id, kb/exhibit_paths.py; MAP's CPL type where no id
    names a path) and the exhibits carry at most one credit recommendation. A college-issued exhibit (the proposal's
    issuer is California Community Colleges) is a course of the college's, so its course title stands too (the review
    of #3168: AJ 61 keeps C-ID AJ 124's "Legal Aspects of Evidence"). Returns (fits, why not)."""
    paths = sorted({exhibit_paths.path_of(i) for i in ex.get("ids") or []} - {""})
    types = sorted(ex.get("types") or [])
    if not paths and not types:
        return True, ""   # no exhibit record says what path it is: an unknown is no evidence, so the course title stands
    cbe = is_credit_by_exam(ex)
    n = len(ex.get("recs") or [])
    if (cbe and n <= 1) or (issuer or "").strip() == title_in_use.LOCAL_ISSUER:
        return True, ""
    if not cbe:
        kind = exhibit_paths.PATHS[paths[0]][0] if len(paths) == 1 else (types[0].lower() if len(types) == 1 else "")
        return False, (kind + ", not credit by exam") if kind else "not credit by exam"
    return False, "%d credit recommendations" % n


def proposal_of(item, aligned, course_ok=True):
    """The proposed canonical title, its issuer, where it came from, and the alternates a person
    should see beside it. `course_ok` (course_title_fits) says whether the aligned course's title may name it; when
    it may not, the classifier's or the procedure's title leads (a course title stands only when nothing else is)."""
    props = [item["proposal"]] if item.get("proposal") else list(item.get("proposals") or [])
    first = props[0] if props else {}
    if item.get("fold_report"):
        # A conflict proposes the reference's person-reviewed title; the saved assignment is the
        # current decision it disagrees with.
        standing = item.get("standing") or []
        return {"title": standing[0] if standing else first.get("title", ""),
                "issuer": first.get("issuer", ""), "from": "the reference, reviewed by a person",
                "saved": first.get("title", ""), "alternates": standing[1:], "source": SRC_REFERENCE}
    alternates = [p.get("title", "") for p in props[1:] if p.get("title")]
    if aligned and (course_ok or not first.get("title")):
        if first.get("title") and first["title"] != aligned["title"]:
            alternates.insert(0, first["title"])
        return {"title": aligned["title"], "issuer": first.get("issuer", ""),
                "from": basis_of(aligned), "alternates": alternates, "source": SRC_COURSE}
    who = first.get("procedure") or "the classifier"
    return {"title": first.get("title", ""), "issuer": first.get("issuer", ""),
            "from": who if who.startswith("the ") else "the " + who + " rule",
            "alternates": alternates, "source": SRC_PROCEDURE if first.get("procedure") else SRC_CLASSIFIER}


def _norm_name(text):
    return " ".join(re.sub(r"[^a-z0-9+#]+", " ", re.sub(r"\([^)]*\)", " ", (text or "").lower())).split())


def official_names(catalog):
    """issuer (normalized, its parenthetical short name dropped) -> {name (case and spacing folded): the issuer's own
    spelling}, from the credential watch's joined catalog (kb/it_ai_credential_catalog.json). Read only."""
    out = {}
    for c in (catalog or {}).get("credentials") or []:
        iss, name = _norm_name(c.get("issuer")), (c.get("name") or "").strip()
        if iss and name:
            out.setdefault(iss, {}).setdefault(" ".join(name.lower().split()), name)
    return out


def official_name(names, title, issuer):
    """The issuer's own spelling of `title` when its catalog lists that name (case and spacing aside), else ""."""
    got = names.get(_norm_name(issuer)) or {}
    return got.get(" ".join((title or "").lower().split()), "")


def use_count(o):
    """"11 local titles, at 19 colleges": the reason an in-use proposal gives on the card."""
    words = "%d local title%s" % (o["locals"], "" if o["locals"] == 1 else "s")
    if o.get("adopted"):
        words += ", at %d college%s" % (o["adopted"], "" if o["adopted"] == 1 else "s")
    return words


def settle(prop, raw, ex, index, statewide, names, in_reference, set_aside=""):
    """Sam's two rulings of 2026-11-12, after the course gate in proposal_of: (1) a title already in use, by the one
    rule exhibits.js also follows (kb/title_in_use.py), before a new one; (2) an industry certification, license or
    training program with nothing in use takes its official name where the repo holds one (kb/cert_naming.py, already
    applied by the caller; the credential watch's catalog), else keeps the classifier's title and is flagged
    `needs_official_name`. Returns the proposal with `source` and, where they apply, `in_use` and
    `needs_official_name`. Never reads TOP, never calls a model or the network.

    `set_aside`, the course title the gate refused, is asked of the rule too when the proposal's own title finds
    nothing: it is never proposed, but it can point at the title in use (Firefighter Recruit Academy Certificate: the
    classifier's Firefighter 1 Academy keeps itself under rule (g), and M-ID FIRE M1219's Firefighter Academy points
    at the statewide Firefighter 1, Sam's call). A credit-by-exam card keeps its own issuer (rule (h); the review of
    #3168): a college's noncredit course for an ASE test stays the college's."""
    title = prop["title"]
    own = is_credit_by_exam(ex)
    a = title_in_use.in_use(index, statewide, title, raw, prop.get("issuer", ""), own_issuer=own) if title else None
    if not a and set_aside and set_aside != title:
        b = title_in_use.in_use(index, statewide, set_aside, raw, prop.get("issuer", ""), own_issuer=own)
        if b and b["o"]["t"] != title:
            a = dict(b, kind=SRC_STATEWIDE) if b["kind"] == title_in_use.SELF else b
    if a and a["kind"] == title_in_use.SELF:
        # The proposal is itself a statewide exhibit: the card's source line says so, as it does for a join (COBIx, #3168).
        out = dict(prop, source=SRC_STATEWIDE,
                   in_use={"title": a["o"]["t"], "locals": a["o"]["locals"], "adopted": a["o"]["adopted"]})
        out["from"] = "the statewide exhibit in use (%s)" % use_count(a["o"])
        return out
    if a:
        o = a["o"]
        word = "the statewide exhibit in use" if a["kind"] == SRC_STATEWIDE else "the most used title in the reference"
        out = dict(prop, title=o["t"], issuer=o["issuer"], source=a["kind"],
                   alternates=[title] + [x for x in prop.get("alternates") or [] if x not in (title, o["t"])],
                   in_use={"title": o["t"], "locals": o["locals"], "adopted": o["adopted"]})
        out["from"] = "%s (%s)" % (word, use_count(o))
        return out
    paths = {exhibit_paths.path_of(i) for i in ex.get("ids") or []} - {""}
    cert = paths == {"ic"} if paths else "Industry Certification" in (ex.get("types") or [])
    issuer = title_in_use.issuer_for(title, prop.get("issuer", ""))
    if (not cert or not title or title in in_reference or prop.get("source") == SRC_OFFICIAL
            or issuer == title_in_use.LOCAL_ISSUER):
        return prop
    named = official_name(names, title, issuer)
    if named:
        return dict(prop, title=named, source=SRC_OFFICIAL, alternates=[x for x in prop.get("alternates") or []
                                                                        if x != named])
    return dict(prop, needs_official_name=True)


def clean_college(name):
    """The members file carries a few names as COCI sent them: 'CaÃ±ada College', 'Cypress College '."""
    name = (name or "").strip()
    if "Ã" in name:
        try:
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return name


def exhibits_by_raw(statewide, raws):
    """raw title -> {ids, art, types, recs}: every exhibit record that lists the raw, with MAP's CPL types and the
    distinct credit recommendations (course, credit) the exhibits carry, which course_title_fits reads."""
    want, out = set(raws), {}
    for x in statewide.get("exhibits") or []:
        hits = [r for r in x.get("raw_titles") or [] if r in want]
        if not hits:
            continue
        ids = x.get("exhibit_ids") or [i for i in (x.get("exhibit_id") or "").split("|") if i]
        for raw in hits:
            rec = out.setdefault(raw, {"ids": [], "art": [], "types": [], "recs": []})
            if x.get("cpl_type") and x["cpl_type"] not in rec["types"]:
                rec["types"].append(x["cpl_type"])
            for r in x.get("credit_recs") or []:
                pair = [(r.get("course") or "").strip(), (r.get("credit") or "").strip()]
                if any(pair) and pair not in rec["recs"]:
                    rec["recs"].append(pair)
            for i in ids:
                if i not in rec["ids"]:
                    rec["ids"].append(i)
            for c in map(clean_college, x.get("adopter_names") or []):
                if c not in rec["art"]:
                    rec["art"].append(c)
    return out


def teaching_colleges(prescriptive, title):
    """college name -> [[code, "", units]] for the courses a college already teaches that map to the
    credential's M-ID identity (statewide_prescriptive.js), in the courses file's row shape."""
    out = {}
    for c in ((prescriptive or {}).get(title) or {}).get("colleges") or []:
        rows = []
        for x in c.get("courses") or []:
            row = [" ".join(p for p in ((x.get("subject") or "").strip(), (x.get("number") or "").strip()) if p),
                   "", x.get("units")]
            if row[0] and row not in rows:
                rows.append(row)
        have = out.setdefault(clean_college(c.get("college")), [])
        have.extend(r for r in rows if r not in have)
    return {c: rows for c, rows in out.items() if c and rows}


def rec_units(credit):
    """The leading figure of a credit recommendation ("3 hours in Child Growth" -> 3.0): Exhibit
    Adoption's own rule (_rec_units in excel_to_dashboard.py), so a college's units read the same."""
    m = re.search(r"(\d+(?:\.\d+)?)", credit or "")
    return float(m.group(1)) if m else 0.0


def adoption_file(statewide, prescriptive):
    """Exhibit Adoption's per-credential view, for the credential panel: per canonical credential,
    what each articulating college articulated (its distinct credit recommendation lines and their
    units), the courses each could-adopt college already teaches, the exhibits in MAP, the CIP sector
    and the peer benchmark (the median college's units). Classified cards only: an unclassified card
    is a held title, which the Review queue carries."""
    by = {}
    for x in statewide.get("exhibits") or []:
        if x.get("is_classified") is False:
            continue
        ut = x.get("unified_title") or ""
        if not ut:
            continue
        rec = by.setdefault(ut, {"art": {}, "records": [], "cip": x.get("cip_sector") or ""})
        if not rec["cip"]:
            rec["cip"] = x.get("cip_sector") or ""
        recs = x.get("credit_recs") or []
        for college, idx in (x.get("adopter_rec_idx") or {}).items():
            lines = rec["art"].setdefault(clean_college(college), [])
            for i in idx:
                if 0 <= i < len(recs):
                    line = [(recs[i].get("course") or "").strip(), (recs[i].get("credit") or "").strip()]
                    if line not in lines:
                        lines.append(line)
        for college in x.get("adopter_names") or []:
            rec["art"].setdefault(clean_college(college), [])
        for r in x.get("exhibit_records") or []:
            row = [r.get("id") or "", (r.get("title") or "").strip(), r.get("units")]
            if row[0] and row[0] not in [k[0] for k in rec["records"]]:
                rec["records"].append(row)
    for ut, p in (prescriptive or {}).items():
        if ut in by or (p or {}).get("n_colleges") or (p or {}).get("withheld"):
            by.setdefault(ut, {"art": {}, "records": [], "cip": ""})
    out = {}
    for ut in sorted(by):
        rec = by[ut]
        art = {c: lines for c, lines in sorted(rec["art"].items()) if c}
        units = {c: round(sum(rec_units(l[1]) for l in lines), 2) for c, lines in art.items() if lines}
        could = {c: rows for c, rows in sorted(teaching_colleges(prescriptive, ut).items()) if c not in art}
        entry = {"a": {c: [units.get(c, 0.0), lines] for c, lines in art.items()}}
        if could:
            entry["c"] = could
        held_back = ((prescriptive or {}).get(ut) or {}).get("withheld") or 0
        if held_back:
            entry["w"] = held_back
        if rec["records"]:
            entry["x"] = sorted(rec["records"])
        if rec["cip"]:
            entry["s"] = rec["cip"]
        vals = [u for u in units.values() if u]
        if vals:
            entry["p"] = round(statistics.median(vals), 2)
        out[ut] = entry
    names = sorted({c for e in out.values() for k in ("a", "c") for c in e.get(k, {})}, key=str.lower)
    at = {c: i for i, c in enumerate(names)}
    for e in out.values():
        for k in ("a", "c"):
            if k in e:
                e[k] = {str(at[c]): v for c, v in e[k].items()}
    return {
        "schema": SCHEMA,
        "_about": "The Exhibits tab's credential panel, \"Who could adopt it?\" (kb/_build_exhibits_review.py): "
                  "Exhibit Adoption's per-credential view. Per canonical credential: a = college index -> "
                  "[units, [[course, credit recommendation]]] for each college that articulated it; c = college "
                  "index -> [[course, \"\", units]] for each college that already teaches a course mapped to its "
                  "M-ID identity (statewide_prescriptive.js; never the TOP or C-ID program overlap); w = colleges "
                  "withheld because the identity is over-merged; x = [[exhibit id, MAP title, units]]; s = the "
                  "CIP sector; p = the median articulating college's units (the peer benchmark).",
        "written_at": iso_now(),
        "sources": {"statewide": statewide.get("generated_at")},
        "cip_sectors": statewide.get("cip_sectors") or {},
        "colleges": names,
        "credentials": out,
    }


def identity_colleges(members, ident):
    """college name -> [[code, title, units]] for the courses an identity holds at each college."""
    names = members.get("colleges") or []
    out = {}
    for r in (members.get("members") or {}).get(ident) or []:
        c = r.get("c")
        if c is None or c >= len(names):
            continue
        row = [(r.get("n") or "").strip(), (r.get("t") or "").strip(), r.get("u")]
        lst = out.setdefault(clean_college(names[c]), [])
        if row not in lst:
            lst.append(row)
    return out


def under_index(unified_titles):
    """canonical title -> the local titles under it."""
    idx = {}
    for raw, rec in (unified_titles or {}).items():
        t = (rec or {}).get("unified_title") if isinstance(rec, dict) else None
        if t:
            idx.setdefault(t, []).append(raw)
    for v in idx.values():
        v.sort(key=str.lower)
    return idx


def name_list(creds, field):
    """Every distinct name the reference's credential records give in `field`, sorted."""
    out = set()
    for recs in creds.values():
        for r in recs if isinstance(recs, list) else []:
            v = " ".join(str((r or {}).get(field) or "").split()) if isinstance(r, dict) else ""
            if v:
                out.add(v)
    return sorted(out, key=str.lower)


def build(root):
    report = load_json(root, "kb/cer_procedures_out/latest.json", {}) or {}
    sugg = load_json(root, "kb/unclassified_suggestions.json", {}) or {}
    aligned_all = sugg.get("aligned") or {}
    statewide = load_js(os.path.join(root, "statewide_data.js"))
    members = load_js(os.path.join(root, "unified_courses_members.js"))
    pres_path = os.path.join(root, "statewide_prescriptive.js")
    prescriptive = load_js(pres_path) if os.path.exists(pres_path) else {}
    under = under_index(load_json(root, "kb/unified_titles.json", {}))
    creds = load_json(root, "kb/credentials.json", {}) or {}
    site_lists = {t: e["training_sites"] for t, e in
                  ((load_json(root, "kb/credential_review_overlay.json", {}) or {}).get("overrides") or {}).items()
                  if isinstance(e, dict) and e.get("training_sites") is not None}
    audit = load_json(root, "kb/exhibit_audit/latest.json", {}) or {}
    saved = (load_json(root, "kb/unclassified_assignments.json", {}) or {}).get("assignments") or {}
    cards = audit.get("title_cards") or []
    still = {c.get("raw_title") for c in cards
             if not c.get("unified_title") and "unclassified_in_map" in (c.get("tags") or [])}

    # A conflict is never in the queue (the reference already holds the raw) and its saved assignment is
    # the point, so only the other steps drop a title that was folded or saved since the run.
    needs = [n for n in report.get("needs_you") or []
             if n.get("fold_report") or not cards
             or (n.get("raw_title") in still and n.get("raw_title") not in saved)]
    dropped = len(report.get("needs_you") or []) - len(needs)
    by_raw = exhibits_by_raw(statewide, [n.get("raw_title") for n in needs])
    adoption = adoption_file(statewide, prescriptive)
    # The titles in use (Sam, 2026-11-12): the reference's titles with their issuer, local titles and colleges, the
    # same counts kb/_build_exhibits_related.py writes for the Related titles panel, and the statewide list.
    unified = load_json(root, "kb/unified_titles.json", {}) or {}
    index = title_in_use.index_from_reference(creds, unified, adoption["credentials"], credential_aliases.load(root))
    in_reference = {o["t"] for o in index}
    statewide_titles = title_in_use.statewide_from_js(os.path.join(root, STATEWIDE_RECS))
    names_on_file = official_names(load_json(root, CATALOG, {}))
    items, courses = [], {}
    for n in needs:
        raw = n.get("raw_title") or ""
        if not raw:
            continue
        step = step_of(n)
        ex = by_raw.get(raw) or {"ids": [], "art": [], "types": [], "recs": []}
        aligned = aligned_all.get(raw) if step != CONFLICT else None
        first = n.get("proposal") or (n.get("proposals") or [{}])[0] or {}
        course_ok, course_why = course_title_fits(ex, first.get("issuer", "")) if aligned else (True, "")
        prop = proposal_of(n, aligned, course_ok)
        if step != CONFLICT:
            # A proposal based on a certification goes out in the format (kb/cert_naming.py, Sam's ruling of
            # 2026-11-11); the form the rule or the classifier wrote stays beside it as an alternate. A
            # conflict's proposal is a title a person already approved, which only the rename batch moves.
            formed = cert_naming.canonical(prop["title"], prop.get("issuer", ""))
            if formed != prop["title"]:
                prop = dict(prop, alternates=[prop["title"]] + [a for a in prop.get("alternates") or [] if a != formed],
                            title=formed, source=SRC_OFFICIAL)
            prop = settle(prop, raw, ex, index, statewide_titles, names_on_file, in_reference,
                          set_aside=aligned["title"] if aligned and not course_ok else "")
        typed = [clean_college(c) for c in n.get("colleges") or []]
        art = ex["art"] or typed
        art_keys = {norm_college(c) for c in art}
        title = prop["title"]
        basis, same, could, key = "", False, [], ""
        if aligned:
            basis = basis_of(aligned)
            if aligned["id"] not in courses:
                courses[aligned["id"]] = identity_colleges(members, aligned["id"])
            could = sorted((c for c in courses[aligned["id"]] if norm_college(c) not in art_keys),
                           key=str.lower)
            same = bool(could)
            key = aligned["id"] if same else ""
        if not could and title:
            # No same-identity course outside the articulating colleges: the colleges that already
            # teach a course mapped to the proposed credential (Exhibit Adoption's could-adopt), else none.
            teach_key = TEACHES + title
            if teach_key not in courses:
                courses[teach_key] = teaching_colleges(prescriptive, title)
            could = sorted((c for c in courses[teach_key] if norm_college(c) not in art_keys), key=str.lower)
            key = teach_key if could else ""
            if not courses[teach_key]:
                del courses[teach_key]
        rec = {
            "raw": raw,
            "step": step,
            "why": n.get("why") or "",
            "colleges": typed,
            "title": title,
            "issuer": prop["issuer"],
            "from": prop["from"],
            "proposal_source": prop.get("source", SRC_CLASSIFIER),
            "ids": ex["ids"],
            "art": art,
            "could": could,
            "basis": basis,
            "same": same,
        }
        if key:
            rec["courses_key"] = key
        conf = (n.get("proposal") or {}).get("confidence")
        if isinstance(conf, (int, float)):
            rec["confidence"] = conf
        if prop.get("saved"):
            rec["saved"] = prop["saved"]
        if prop.get("alternates"):
            rec["alternates"] = prop["alternates"]
        if prop.get("in_use"):
            rec["in_use"] = prop["in_use"]
        if prop.get("needs_official_name"):
            rec["needs_official_name"] = True
        if aligned and not course_ok and prop.get("source") != SRC_COURSE:
            # The course's title, set aside, and why (Sam's ruling of 2026-11-12): the card's course line still names it.
            rec["course_title_set_aside"] = {"title": aligned["title"], "basis": basis_of(aligned), "why": course_why}
        if aligned:
            rec["aligned_id"] = aligned["id"]
            rec["course"] = aligned.get("code", "")
            rec["course_college"] = aligned.get("college", "")
            if aligned.get("ambiguous"):
                rec["ambiguous"] = aligned["ambiguous"]
        others = [r for r in under.get(title, []) if r != raw]
        if others:
            rec["under"] = others[:UNDER_CAP]
            rec["under_count"] = len(others)
        cred = creds.get(title)
        if cred:
            rec["exists"] = True
            if title in site_lists:
                sites = [s["site"] + (" (" + s["college"] + ")" if s.get("college") else "") for s in site_lists[title]]
            else:
                sites = sorted({(c or {}).get("training_agency") or "" for c in cred} - {""})
            if sites:
                rec["trainers"] = sites
        items.append(rec)

    # Without students (a reviewer-only read), the most widely articulated title leads.
    items.sort(key=lambda r: (-len(r["art"]), r["raw"].lower()))
    # A college is named once, in `colleges`; the records carry its index (468 titles each listing
    # up to a hundred could-adopt colleges were 1.9 MB as names).
    names = sorted({c for r in items for c in r["art"] + r["could"] + r["colleges"]}
                   | {c for by in courses.values() for c in by}, key=str.lower)
    at = {c: i for i, c in enumerate(names)}
    for r in items:
        for k in ("art", "could", "colleges"):
            r[k] = [at[c] for c in r[k]]
    # The courses behind a could-adopt chip open on a click, so they sit in their own file the
    # tab loads then (unified_courses_members.js's pattern): identity -> college index -> rows.
    course_file = {"schema": SCHEMA, "colleges": names,
                   "courses": {i: {str(at[c]): rows for c, rows in sorted(by.items())}
                               for i, by in sorted(courses.items())}}
    titled = sum(1 for c in cards if c.get("unified_title"))
    waiting = sum(1 for c in cards if not c.get("unified_title")
                  and "unclassified_in_map" in (c.get("tags") or []))
    counts = {s: sum(1 for r in items if r["step"] == s) for s in STEPS}
    return {
        "schema": SCHEMA,
        "_about": "The Exhibits tab's Review queue (kb/_build_exhibits_review.py): one record per "
                  "title the CER procedures held, with its proposed canonical title and where that "
                  "came from, its exhibits, where it is articulated and who could adopt it. "
                  "Students per title are a reviewer-only read (exhibit_title_students).",
        "written_at": iso_now(),
        "sources": {
            "procedures_run": report.get("_generated_at"),
            "suggestions": sugg.get("_generated_at"),
            "statewide": statewide.get("generated_at"),
            "audit": audit.get("generated_at") or audit.get("_generated_at"),
        },
        "tiles": {
            "names": {"n": titled, "of": len(cards), "waiting": waiting},
            "aligned": {"n": sum(1 for r in items if r.get("course")), "of": len(items)},
            "saved_not_folded": report.get("saved_not_folded"),
            "settled_since_run": dropped,
        },
        "steps": counts,
        "colleges": names,
        # The names an issuer or training-site box offers as Sam types (2026-10-31: "it should search
        # for text matches for existing items and present option to click with each text entry").
        "issuers": name_list(creds, "issuing_agency"),
        "sites": sorted(set(name_list(creds, "training_agency"))
                        | {(s.get("site") or "").strip() for ss in site_lists.values() for s in ss
                           if isinstance(s, dict)} - {""}, key=str.lower),
        "held": items,
    }, course_file, adoption


def dump(data, list_key):
    """JSON with each entry of `list_key` on its own line, so a nightly diff reads by title."""
    head = {k: v for k, v in data.items() if k != list_key}
    body = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    entries = data[list_key]
    if isinstance(entries, dict):
        rows = ["  %s: %s" % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False))
                for k, v in entries.items()]
        return body + ',\n "%s": {\n%s\n }\n}\n' % (list_key, ",\n".join(rows))
    rows = ["  " + json.dumps(v, ensure_ascii=False) for v in entries]
    return body + ',\n "%s": [\n%s\n ]\n}\n' % (list_key, ",\n".join(rows))


def write_if_changed(path, data, list_key, stamp_key=None):
    """Leave the file alone when nothing but its stamp would change."""
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            try:
                prior = json.load(f)
            except ValueError:
                prior = None
        strip = lambda d: {k: v for k, v in (d or {}).items() if k != stamp_key}  # noqa: E731
        if prior is not None and strip(prior) == strip(json.loads(json.dumps(data))):
            return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(dump(data, list_key))
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=os.path.dirname(HERE))
    ap.add_argument("--out", default=None, help="the review file (the courses file is written beside it)")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    data, course_file, adoption = build(a.root)
    out = a.out or os.path.join(a.root, OUT)
    courses_out = os.path.join(os.path.dirname(out), os.path.basename(COURSES_OUT))
    adoption_out = os.path.join(os.path.dirname(out), os.path.basename(ADOPTION_OUT))
    wrote = [p for p, d, k, st in ((out, data, "held", "written_at"), (courses_out, course_file, "courses", None),
                                   (adoption_out, adoption, "credentials", "written_at"))
             if write_if_changed(p, d, k, st)]
    if not a.quiet:
        print("exhibits review: %d held | steps %s | aligned %d | adoption %d credentials | %s"
              % (len(data["held"]), data["steps"], data["tiles"]["aligned"]["n"], len(adoption["credentials"]),
                 "wrote " + ", ".join(wrote) if wrote else "unchanged"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
