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
  statewide_data.js                   each title's exhibits: their IDs, where they are articulated,
                                      and EACR's could-adopt colleges
  unified_courses_members.js          the colleges holding a course of the aligned identity, and
                                      those courses (a could-adopt chip opens them)
  kb/unified_titles.json              the local titles already under the proposed title
  kb/credentials.json                 whether the proposed title is a credential yet, its training site
  kb/credential_review_overlay.json   the training sites a curator set in the credential panel, which
                                      stand in for the records' own
  kb/exhibit_audit/latest.json        the Names tile, and which titles still wait: the daily fold can settle
                                      a held title between the nightly run and this build
  kb/unclassified_assignments.json    titles a person or a rule saved since, which the fold has not added

Students per title are not here: they are a reviewer-only read of map_student_credit, k=10
(exhibit_title_students(), kb/migrations/), and the tab asks for them with each title's `ids`.

Runs nightly at the end of cer-procedures.yml and daily from daily-dashboard.yml. Writes
kb/exhibits_review.json, which exhibits.js reads.

Usage, from the repo root:
  python3 kb/_build_exhibits_review.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _suggest_unclassified import load_js, norm_college  # noqa: E402

SCHEMA = 1
OUT = "kb/exhibits_review.json"
COURSES_OUT = "kb/exhibits_review_courses.json"

PROPOSED = "Proposed"
WORDING = "Wording check"
TWO_ISSUERS = "Two issuers"
CONFLICT = "Conflict with the reference"
STEPS = [PROPOSED, WORDING, TWO_ISSUERS, CONFLICT]

KIND_WORD = {"ccn": "CCN", "cid": "C-ID", "mid": "M-ID"}
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


def proposal_of(item, aligned):
    """The proposed canonical title, its issuer, where it came from, and the alternates a person
    should see beside it."""
    props = [item["proposal"]] if item.get("proposal") else list(item.get("proposals") or [])
    first = props[0] if props else {}
    if item.get("fold_report"):
        # A conflict proposes the reference's person-reviewed title; the saved assignment is the
        # current decision it disagrees with.
        standing = item.get("standing") or []
        return {"title": standing[0] if standing else first.get("title", ""),
                "issuer": first.get("issuer", ""), "from": "the reference, reviewed by a person",
                "saved": first.get("title", ""), "alternates": standing[1:]}
    alternates = [p.get("title", "") for p in props[1:] if p.get("title")]
    if aligned:
        if first.get("title") and first["title"] != aligned["title"]:
            alternates.insert(0, first["title"])
        return {"title": aligned["title"], "issuer": first.get("issuer", ""),
                "from": basis_of(aligned), "alternates": alternates}
    who = first.get("procedure") or "the classifier"
    return {"title": first.get("title", ""), "issuer": first.get("issuer", ""),
            "from": who if who.startswith("the ") else "the " + who + " rule",
            "alternates": alternates}


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
    """raw title -> {ids, art, could}: every exhibit record that lists the raw."""
    want, out = set(raws), {}
    for x in statewide.get("exhibits") or []:
        hits = [r for r in x.get("raw_titles") or [] if r in want]
        if not hits:
            continue
        ids = x.get("exhibit_ids") or [i for i in (x.get("exhibit_id") or "").split("|") if i]
        for raw in hits:
            rec = out.setdefault(raw, {"ids": [], "art": [], "could": []})
            for i in ids:
                if i not in rec["ids"]:
                    rec["ids"].append(i)
            for c in map(clean_college, x.get("adopter_names") or []):
                if c not in rec["art"]:
                    rec["art"].append(c)
            for c in map(clean_college, x.get("potential_names") or []):
                if c not in rec["could"]:
                    rec["could"].append(c)
    return out


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


def build(root):
    report = load_json(root, "kb/cer_procedures_out/latest.json", {}) or {}
    sugg = load_json(root, "kb/unclassified_suggestions.json", {}) or {}
    aligned_all = sugg.get("aligned") or {}
    statewide = load_js(os.path.join(root, "statewide_data.js"))
    members = load_js(os.path.join(root, "unified_courses_members.js"))
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
    items, courses = [], {}
    for n in needs:
        raw = n.get("raw_title") or ""
        if not raw:
            continue
        step = step_of(n)
        aligned = aligned_all.get(raw) if step != CONFLICT else None
        prop = proposal_of(n, aligned)
        ex = by_raw.get(raw) or {"ids": [], "art": [], "could": []}
        typed = [clean_college(c) for c in n.get("colleges") or []]
        art = ex["art"] or typed
        art_keys = {norm_college(c) for c in art}
        basis, same, could = "", False, []
        if aligned:
            basis = basis_of(aligned)
            if aligned["id"] not in courses:
                courses[aligned["id"]] = identity_colleges(members, aligned["id"])
            could = sorted((c for c in courses[aligned["id"]] if norm_college(c) not in art_keys),
                           key=str.lower)
            same = bool(could)
        if not could:
            # No same-identity course outside the articulating colleges: EACR's list stands, and
            # each college's faculty choose the course.
            could = sorted((c for c in ex["could"] if norm_college(c) not in art_keys), key=str.lower)
        title = prop["title"]
        rec = {
            "raw": raw,
            "step": step,
            "why": n.get("why") or "",
            "colleges": typed,
            "title": title,
            "issuer": prop["issuer"],
            "from": prop["from"],
            "ids": ex["ids"],
            "art": art,
            "could": could,
            "basis": basis,
            "same": same,
        }
        conf = (n.get("proposal") or {}).get("confidence")
        if isinstance(conf, (int, float)):
            rec["confidence"] = conf
        if prop.get("saved"):
            rec["saved"] = prop["saved"]
        if prop.get("alternates"):
            rec["alternates"] = prop["alternates"]
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
        "held": items,
    }, course_file


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
    data, course_file = build(a.root)
    out = a.out or os.path.join(a.root, OUT)
    courses_out = os.path.join(os.path.dirname(out), os.path.basename(COURSES_OUT))
    wrote = [p for p, d, k, st in ((out, data, "held", "written_at"), (courses_out, course_file, "courses", None))
             if write_if_changed(p, d, k, st)]
    if not a.quiet:
        print("exhibits review: %d held | steps %s | aligned %d | %s"
              % (len(data["held"]), data["steps"], data["tiles"]["aligned"]["n"],
                 "wrote " + ", ".join(wrote) if wrote else "unchanged"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
