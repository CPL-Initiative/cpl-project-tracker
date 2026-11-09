#!/usr/bin/env python3
"""_build_commons_status.py — the Commons tab's figures, read from the committed files.

Sam, 2026-10-18 20:10Z: "Build it as a tab now. I can live without the words on the cards —
pretty self explanatory and I am the main user." Each common reference's row in the mock-up's
shape (docs/visuals/2026-10-18-commons-mockup.html): the complete pair with the test behind it,
the known issues each naming its owner, the settled procedures, and the machine stamp. The
session side of a row (the next step, the calls waiting on Sam, the session stamp) stays in
kb/status/<project>.json, written at checkpoints; this file is the machine side.

Runs daily from daily-dashboard.yml after the builds it reads, and writes kb/status/commons.json,
which commons.js reads. A figure a source cannot supply is null beside its error, never a zero
(the S343 rule), so the tab says "could not be read" where the file could not.

Usage, from the repo root:
  python3 kb/_build_commons_status.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import datetime as dt
import glob
import json
import os
import re
import sys
import traceback

SCHEMA = 1
OUT = "kb/status/commons.json"


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def js_object(root, rel):
    """The one JSON object a data .js file assigns (coci_programs_data.js and its kin)."""
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        s = f.read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])


def figure(fn):
    """A figure, or null with the error that kept it from being read."""
    try:
        return {"n": fn(), "error": None}
    except Exception as e:  # noqa: BLE001 — every failure must land in the file, not stop the build
        return {"n": None, "error": "%s: %s" % (type(e).__name__, e)}


def exists(root, rel):
    return os.path.exists(os.path.join(root, rel))


def fmt(n):
    return "" if n is None else format(n, ",") if isinstance(n, int) else str(n)


# ── Program Requirements ──────────────────────────────────────────────────────────────────
# The college names COCI prints against the harvest's names, where a rule does not reach.
COLLEGE_NAMES = {
    "Los Angeles Pierce College": "L.A. PIERCE", "Los Angeles Harbor College": "L.A. HARBOR",
    "East Los Angeles College": "EAST L.A.", "Los Angeles Southwest College": "L.A. SOUTHWEST",
    "Los Angeles City College": "L.A. CITY", "Los Angeles Mission College": "L.A. MISSION",
    "Los Angeles Trade Technical College": "L.A. TRADE-TECH", "Los Angeles Valley College": "L.A. VALLEY",
    "West Los Angeles College": "WEST L.A.", "City College of San Francisco": "SAN FRANCISCO CITY",
    "Cañada College": "CANADA", "CaÃ±ada College": "CANADA", "MiraCosta College": "MIRA COSTA",
    "Santa Rosa Junior College": "SANTA ROSA", "Modesto Junior College": "MODESTO", "Madera College": "Madera",
    "San Bernardino Valley College": "SAN BERNARDINO", "Calbright College Credit": "CALBRIGHT",
    "San Diego College of Continuing Education": "SAN DIEGO ADULT",
}


def coci_name(name, cols):
    u = re.sub(r"\s+", " ", name.upper()).strip()
    for c in (u, re.sub(r"\s*COMMUNITY COLLEGE$", "", u).strip(), re.sub(r"\s*COLLEGE$", "", u).strip(),
              re.sub(r"^COLLEGE OF (THE )?", "", u).strip()):
        if c in cols:
            return c
    hit = COLLEGE_NAMES.get(name)
    return hit if hit in cols else None


def record_passes(d):
    """The three machine checks, as program_record_machine_pass reads them."""
    sc = d.get("score") or {}
    return ((sc.get("coverage") or {}).get("pass") is True and (sc.get("invented") or {}).get("pass") is True
            and (sc.get("arithmetic") or {}).get("status") in ("equal", "unstated"))


def row_requirements(root):
    j = js_object(root, "coci_programs_data.js")
    cols, statuses, rows = j["colleges"], j["statuses"], j["rows"]
    active_ix = statuses.index("Active")
    active = set((cols[r[0]], str(r[1])) for r in rows if r[6] == active_ix)
    files = (sorted(glob.glob(os.path.join(root, "kb/program_requirements_college/*/records/*.json")))
             + sorted(glob.glob(os.path.join(root, "kb/program_requirements_pilot/records/*.json"))))
    recs = {}
    for f in files:
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        recs.setdefault((d.get("college"), str(d.get("control_number"))), d)
    colleges = sorted(set(c for c, _ in recs))
    names = {c: coci_name(c, cols) for c in colleges}
    unmapped = [c for c, n in names.items() if not n]
    if unmapped:
        raise ValueError("harvest colleges COCI does not name: " + ", ".join(unmapped))
    by_key = {(names[c], cn): d for (c, cn), d in recs.items()}
    with_record = [k for k in active if k in by_key]
    complete = [k for k in with_record if record_passes(by_key[k])]
    failing = len(with_record) - len(complete)
    unread = len(active) - len(with_record)
    starts = []
    for f in glob.glob(os.path.join(root, "kb/program_requirements_college/*/capture.json")):
        with open(f, encoding="utf-8") as fh:
            s = json.load(fh).get("started")
        if s:
            starts.append(s)
    tab = "#program-requirements"
    # A person's Confirm in CPL Pathways sets the record's checked flag live (program_requirement_records); the
    # daily sync (kb/_sync_program_checked.py) commits which ones, without the person's address.
    chk = figure(lambda: set((names.get(r[0]) or coci_name(r[0], cols), str(r[1])) for r in
                             load_json(root, "kb/status/program-requirements-checked.json")["checked"]))
    checked = chk["n"]
    return {
        "key": "requirements", "title": "Program Requirements", "tab": tab,
        # Every Commons action opens the reference's List (Sam, 2026-11-03: "open the List view as the default for all
        # the commons actions"), on the filter a count names where the List has one.
        "links": [{"href": tab + "/list", "text": "Open the tab"}],
        "status_file": "kb/status/program-requirements.json" if exists(root, "kb/status/program-requirements.json") else None,
        "pair": [{"n": len(complete), "of": len(active),
                  "words": "complete at %d colleges" % len(set(c for c, _ in complete)), "open": tab + "/list"},
                 confirmed_pair(len(checked) if checked is not None else None, len(active),
                                sum(1 for k in complete if k in checked) if checked is not None else None,
                                "complete", tab + "/list", chk["error"])],
        "tests": ["machine-checked", "confirmed by a person"],
        "issues": [
            {"n": failing, "words": "active programs whose record fails a check", "owner": "the college's reading procedure", "carry": "routine", "open": tab + "/list/fail"},
            {"n": unread, "words": "active programs with no record yet", "owner": "the harvest", "carry": "routine", "open": tab + "/list/unread"},
        ],
        "procedures": [
            {"n": len(colleges), "words": "reading procedures, one per college read, versioned", "open": tab},
            {"words": "A misread is fixed in the procedure, and the records it touched are reread together"},
            {"words": "Counted from the records committed at the last checkpoint; the tab reads the harvest live, so between checkpoints its figures run ahead of these"},
        ],
        "machine": {"what": "the last college read", "at": max(starts) if starts else None, "every_hours": None},
        "facts": {"active": len(active), "complete": len(complete), "failing": failing, "unread": unread,
                  "records": len(recs), "colleges": len(colleges),
                  "outside_active": sum(1 for k in by_key if k not in active),
                  "confirmed": len(checked) if checked is not None else None,
                  "confirmed_complete": sum(1 for k in complete if k in checked) if checked is not None else None},
        "sources": ["coci_programs_data.js", "kb/program_requirements_college/*/records/*.json",
                    "kb/program_requirements_pilot/records/*.json", "kb/program_requirements_college/*/capture.json",
                    "kb/status/program-requirements-checked.json"],
    }


# ── Confirmed by a person (Sam, Open Asks Sheet 160, 2026-11-03) ─────────────────────────
# "The personal confirmation is an attribute we can give the reference when it occurs and we can then count
# confirmed CCRs." Complete stays each reference's own test; every row carries a second pair beside it, never in
# its place: how many of its units a person has confirmed, and how many of those are also complete. Sam asked for
# it on all five references on 2026-11-03 (S565: "yes to both, build them for all four").
def confirmed_pair(n, of, done, unit_done, open_, error=None):
    words = "confirmed by a person" + (", %s of them %s" % (fmt(done), unit_done) if done is not None and n else "")
    return {"n": n, "of": of, "words": words, "open": open_, "error": error}


# ── Common Exhibit Reference ──────────────────────────────────────────────────────────────
def is_cohort(who):
    """A review stamp's reviewer: a session or procedure cohort ends in @bot; a person is the rest."""
    return str(who or "").endswith("@bot")


def receipt_time(v):
    """A receipt's `at` writes the time part with hyphens (2026-10-18T17-37-29Z); the ISO form."""
    m = re.match(r"^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$", str(v or ""))
    return "%sT%s:%s:%sZ" % m.groups() if m else v


def row_exhibit(root):
    # The Exhibits tab carries the reference's queue now (Sam, Open Asks Sheet 148, 2026-10-31: link-retire);
    # the counts open its routes. Titles that left MAP stay at the CER's address, which still opens, until Exhibits
    # carries them; the procedures moved to Exhibits' Rules view, which lists every one (2026-11-03).
    tab = "#exhibits"
    cer = "#credential-reference"
    ut = load_json(root, "kb/unified_titles.json")
    stamped = [v for v in ut.values() if v.get("reviewed_at")]
    person = sum(1 for v in stamped if not is_cohort(v.get("reviewed_by")))
    cohort = len(stamped) - person
    creds = load_json(root, "kb/credentials.json")
    records = [r for lst in creds.values() for r in (lst if isinstance(lst, list) else [lst])]
    rec_stamped = sum(1 for r in records if r.get("reviewed_at"))
    left = figure(lambda: sum(1 for c in load_json(root, "kb/exhibit_audit/latest.json")["title_cards"]
                              if "unclassified_in_map" not in c["tags"] and "stale_kb_entry" in c["tags"]))
    # The auditor's own tallies, for the tab's Progress view (S436): the titles MAP carries today,
    # the ones with no identity yet, and the classifier's title confidence below 0.80 and 0.60.
    stats = figure(lambda: load_json(root, "kb/exhibit_audit/latest.json")["stats"])
    bands = (stats["n"] or {}).get("title_confidence_bands") or {}
    below_60 = sum(bands.get(b, 0) for b in ("0.40-0.59", "<0.40")) if bands else None
    below_80 = below_60 + bands.get("0.60-0.79", 0) if bands else None
    run = figure(lambda: load_json(root, "kb/cer_procedures_out/latest.json"))
    held_n, held_why, conflicts = None, "", None
    if run["n"] is not None:
        held = [e for e in run["n"].get("needs_you", []) if e.get("kind") != "conflict"]
        conflicts = sum(1 for e in run["n"].get("needs_you", []) if e.get("kind") == "conflict")
        why = {}
        for e in held:
            k = re.sub(r" \(\d\.\d+\)$", "", str(e.get("why", ""))).split(" (")[0]
            why[k] = why.get(k, 0) + 1
        held_n = len(held)
        held_why = ", ".join("%s %d" % (k, n) for k, n in sorted(why.items(), key=lambda kv: -kv[1]))
    procs = figure(lambda: [p for p in load_json(root, "kb/cer_procedures.json")["procedures"] if p.get("on")])
    kinds = {}
    for p in (procs["n"] or []):
        kinds[p.get("kind")] = kinds.get(p.get("kind"), 0) + 1
    saves = sorted(glob.glob(os.path.join(root, "kb/cer_procedures_out/saved/saved_*.json")))
    saved_at = None
    if saves:
        with open(saves[-1], encoding="utf-8") as f:
            saved_at = receipt_time(json.load(f).get("at"))
    folds = sorted(glob.glob(os.path.join(root, "kb/unclassified_fold/*/report.json")))
    fold_at = None
    if folds:
        with open(folds[-1], encoding="utf-8") as f:
            fold_at = json.load(f).get("_generated_at")
    stamps = [t for t in (saved_at, fold_at) if t]
    return {
        "key": "exhibit", "title": "Common Exhibit Reference", "tab": tab,
        # The card opens Exhibits' List (Sam, 2026-11-03); Progress is a word away. Held titles and the fold's
        # conflicts keep the Review card, where Change to Proposed Title and Teach a rule live.
        "links": [{"href": tab + "/list", "text": "Open Exhibits"}],
        "status_file": "kb/status/exhibit.json" if exists(root, "kb/status/exhibit.json") else None,
        "pair": [{"n": len(stamped), "of": len(ut),
                  "words": "titles carry a review stamp (%s a person's, %s a cohort's); %s credentials, %s of %s records stamped"
                           % (fmt(person), fmt(cohort), fmt(len(creds)), fmt(rec_stamped), fmt(len(records))), "open": tab + "/list"},
                 # A person's stamp is complete by definition here (complete is a review stamp), so no "of them" clause.
                 confirmed_pair(person, len(ut), None, "", tab + "/list")],
        "tests": ["curator-stamped", "procedure-settled", "confirmed by a person"],
        # An issue that reads zero has nothing in it and is left out; an unread one (null, its error) stays.
        # The fold's conflicts read 0 after the CER procedures run of 2026-11-01 14:34Z (dd95a03f).
        "issues": [i for i in [
            {"n": held_n, "words": "titles held for a person", "owner": "a curator" + (" (" + held_why + ")" if held_why else ""),
             "carry": "unsure", "open": tab + "/held", "error": run["error"]},
            {"n": conflicts, "words": "saved assignments the fold holds", "owner": "a curator (a human-reviewed classification stands)",
             "carry": "unsure", "open": tab + "/conflict", "error": run["error"]},
            # Said so a reader knows the job (Sam, 2026-11-04: "I keep seeing those 622 mentioned but don't know what to do
            # with them, so if you can clarify on the commons card or link, that would help").
            {"n": left["n"], "words": "old titles no MAP exhibit uses any more: nothing breaks while they stay; retire each, "
                                      "or keep one a college may enter again",
             "owner": "a curator",
             "carry": "keep_call", "open": tab + "/list/left", "error": left["error"]},
        ] if i["n"] != 0],
        "procedures": [
            {"n": len(procs["n"]) if procs["n"] is not None else None,
             "words": "in force: %d rules applied by code, %d read by the classifier" % (kinds.get("rule", 0), kinds.get("guidance", 0))
             if procs["n"] is not None else "in force", "open": tab + "/rules", "error": procs["error"]},
            {"words": "A procedure's saves undo together"},
            {"words": "Counted from the nightly procedures run; the tab's Progress view also lists its own queues (another look, rules to turn on) and drops a title from them the moment a person decides it"},
        ],
        "machine": {"what": "the saving run and the fold", "at": max(stamps) if stamps else None, "every_hours": 24},
        "facts": {"titles": len(ut), "stamped": len(stamped), "person": person, "cohort": cohort, "credentials": len(creds),
                  "confirmed": person,
                  "records": len(records), "records_stamped": rec_stamped, "saved_at": saved_at, "fold_at": fold_at,
                  "map_titles": (stats["n"] or {}).get("map_titles_in_current_dataset"),
                  "unclassified": (stats["n"] or {}).get("unclassified_in_map"),
                  "left_map": left["n"], "below_80": below_80, "below_60": below_60},
        "sources": ["kb/unified_titles.json", "kb/credentials.json", "kb/exhibit_audit/latest.json",
                    "kb/cer_procedures_out/latest.json", "kb/cer_procedures.json", "kb/cer_procedures_out/saved/",
                    "kb/unclassified_fold/*/report.json"],
    }


# ── Common Course Reference ───────────────────────────────────────────────────────────────
def row_course(root):
    # SkyView alone (Sam, 2026-10-18 20:46Z: "SkyView alone, since CCR is included as part of it"): the row's
    # home and every count open the map; the list tab (#unified-courses) left the menu the same minute. The Courses
    # List joined as a second word (Sam, 2026-11-01: "WE have the COCI lookup tab in COBI...maybe courses in that?"):
    # COCI Lookup's Courses view, every local course banded by its M-ID. SkyView stays the home.
    # The List first, SkyView beside it (Sam, 2026-11-04: "I want to be able to use list or skyview. Skyview is still
    # too buggy to make the main workspace"): the row's home, its links and its pair open the Courses List; SkyView is
    # the second word, and each band of the List opens its common course there.
    sky = "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html"
    tab = "#coci-lookup/courses"
    A = load_json(root, "kb/row_audit/latest.json")
    st, fr, tags = A["stats"], A["stats"]["faculty_readiness"], A["stats"]["tag_counts"]
    cap = figure(lambda: round(1 - A["_faculty_weights"]["discipline"] * (1 - A["_field_state_score"]["seed-untouched"]), 2))
    canvas = figure(lambda: load_json(root, "prototype/ccr_universe.json"))
    today = figure(lambda: js_object(root, "unified_courses_standalone.js"))
    cv = canvas["n"] or {}
    counts = cv.get("counts") or {}
    # Confirmed by a person (Sam, Sheet 160, 2026-11-03: "The personal confirmation is an attribute we can give the
    # reference when it occurs and we can then count confirmed CCRs"): a scored card whose SkyView save in the curation
    # overlay (kb/coci_curation.json, synced from kb_curation) names a person, never a cohort. Complete stays the
    # auditor's ready; this count sits beside it. The overlay keeps the latest reviewer a card, so a cohort save made
    # after a person's reads as the cohort's: the count is a floor.
    conf = figure(lambda: confirmed_cards(root, A))
    # Discipline in doubt (Sam, 2026-11-09: "make a built in way for me to rule on them so our procedures can be adjusted
    # to handle similar edge cases"): the active discipline's cards the daily re-check could not settle
    # (kb/_ccr_seed_recheck_dryrun.py --doubt). A ruled card is curated, so the next run leaves it out.
    doubt = figure(lambda: load_json(root, "kb/ccr_doubt.json"))
    dn = doubt["n"] or {}
    procedures = [
        {"n": counts.get("identities"), "words": "identities and %s stand-alone courses on the canvas (the %s layout)%s"
         % (fmt(counts.get("stand_alone")), str(cv.get("_generated_from", ""))[:10],
            "; %s stand-alone in today's build" % fmt(len(today["n"]["rows"])) if today["n"] else ""),
         "open": sky, "error": canvas["error"]},
        {"words": "TOP is a last-in-line signal; an identity keeps one record across its unit range; a stored id resolves through the alias chain"},
        {"words": "Re-mints follow the playbook, one cron window each"},
    ]
    return {
        "key": "course", "title": "Common Course Reference", "tab": tab,
        "links": [{"href": tab, "text": "Open the Courses List"}, {"href": sky, "text": "Open SkyView"},
                  {"href": "#coci-lookup/progress", "text": "Open Progress"}],
        "status_file": "kb/status/course.json" if exists(root, "kb/status/course.json") else None,
        "pair": [{"n": fr["ready"], "of": st["total_cards"],
                  "words": "cards the auditor scores 0.85 or better; %s at needs review, %s at needs repair, %s not ready"
                           % (fmt(fr["needs_review"]), fmt(fr["needs_repair"]), fmt(fr["not_ready"])),
                  "open": tab},
                 confirmed_pair(conf["n"]["confirmed"] if conf["n"] else None, st["total_cards"],
                                conf["n"]["ready"] if conf["n"] else None, "ready", tab, conf["error"])],
        "tests": ["scored by the auditor", "confirmed by a person"],
        "issues": [
            {"n": tags.get("seed_untouched_discipline"), "words": "cards carry a discipline no seed has touched, capped at %s" % (cap["n"] if cap["n"] is not None else "0.79"),
             "owner": "the Common Subjects reference", "carry": "no_procedure", "open": "#coci-lookup/list/seedless"},
            # The queue counts the description's cards alone: TOP is no person's item (Sam, 2026-11-04). The job also
            # lists the cards only TOP doubts, labeled as such, because Sam asked to see them (2026-11-09).
            {"n": (dn.get("counts") or {}).get("description") if doubt["n"] else None,
             "words": "cards whose catalog description reads as another discipline than the one they carry (%s)"
                      % (dn.get("discipline") or "the active discipline"),
             "owner": "Sam (rule on each and say why; a reason marked for similar cards becomes a procedure)",
             "carry": "unsure", "open": "#coci-lookup/list/doubt", "error": doubt["error"]},
            {"n": tags.get("unit_anomaly"), "words": "unit anomalies", "owner": "a curator (an identity keeps its unit range)", "carry": "no_procedure", "open": "#coci-lookup/list/units"},
            # TOP and discipline disagreements are no person's item (Sam, 2026-11-04: "I'm not generally worried about
            # TOP disagreement as those are input unchecked by colleges. CIP from the COCI programs records should be
            # more dependable"; Rule 7, TOP is last in line). The count stays in facts.tags for the Progress page.
            {"n": tags.get("blank_description"), "words": "blank descriptions", "owner": "the colleges' COCI entries", "carry": "routine", "open": "#coci-lookup/list/nodesc"},
        ],
        "procedures": procedures,
        "machine": {"what": "the auditor", "at": A.get("_generated_at"), "every_hours": 24},
        "facts": {"total": st["total_cards"], "ready": fr["ready"], "needs_review": fr["needs_review"],
                  "needs_repair": fr["needs_repair"], "not_ready": fr["not_ready"], "cap": cap["n"],
                  "confirmed": conf["n"]["confirmed"] if conf["n"] else None,
                  "confirmed_ready": conf["n"]["ready"] if conf["n"] else None,
                  # One count a tag, each a card carrying it (the auditor counts a card once): COCI Lookup's Progress
                  # view reads these for its three questions, so the page and this card share one read (S559).
                  "tags": {k: tags.get(k) for k in ("blank_description", "discipline_title_mismatch", "blank_discipline",
                           "seed_untouched_discipline", "top_discipline_disagreement", "unit_anomaly")}},
        "sources": ["kb/row_audit/latest.json", "kb/coci_curation.json", "prototype/ccr_universe.json",
                    "unified_courses_standalone.js", "kb/ccr_doubt.json"],
    }


def confirmed_cards(root, A):
    """The auditor's cards a person has saved in SkyView or COBI: {confirmed, ready} (ready = confirmed and scoring
    ready). A card counts when a person's save is keyed on it (its title, discipline, its own placement) or places a
    course into it (the save's merge_into target, Sam 2026-11-03: "yes"). A save naming no card the audit carries
    counts nowhere."""
    cur = load_json(root, "kb/coci_curation.json").get("curations") or {}
    hit = set()
    for k, v in cur.items():
        if not isinstance(v, dict) or not v.get("reviewed_by") or is_cohort(v.get("reviewed_by")):
            continue
        hit |= {t for t in (k, v.get("merge_into")) if t}
    # Counted in cards, the page's one denominator: an M-ID that is also a merge target is two cards (C and X).
    rows = [r for r in A.get("rows") or [] if r.get("id") in hit]
    return {"confirmed": len(rows), "ready": sum(1 for r in rows if r.get("fr") == "ready")}


# ── Common CR Reference ───────────────────────────────────────────────────────────────────
def git_stamp(root, rel):
    """When a committed file last changed, from git; null where the checkout cannot say."""
    import subprocess
    try:
        out = subprocess.run(["git", "-C", root, "log", "-1", "--format=%cI", "--", rel],
                             capture_output=True, text=True, timeout=30)
        v = out.stdout.strip()
        return v if out.returncode == 0 and v else None
    except Exception:  # noqa: BLE001
        return None


# Complete, for this reference (S437, the CR Progress view; Open Asks Sheet 108 card 5): a wording
# colleges wrote resolves to a settled reference when a rung 1 to 4 rule places it (the rules act
# without a curator) or a curator's decision names it, confirmed or set aside as not a topic. The
# unit is the wording, the way the Exhibit row counts titles; the articulations ride beside it,
# since the corpus is head-heavy (the top 50 wordings carry about half of them).
SETTLES = ("confirmed", "not_a_topic")
HEAD_BANDS = (50, 100, 250)


def row_cr(root):
    tab = "#cr-reference"
    W = load_json(root, "kb/cr_reference_worklist.json")
    G, st = W["groups"], W["_stats"]
    decided, verdicts, reached = {}, 0, 0
    receipts = sorted(glob.glob(os.path.join(root, "kb/receipts/cr_reference_decisions_*.json")))
    for p in receipts:
        with open(p, encoding="utf-8") as f:
            R = json.load(f)
        for r in R.get("rows", []):
            decided[r.get("group_key")] = r
        verdicts += len(R.get("items", []))
        reached += sum(int(i.get("rows") or 0) for i in R.get("items", []))
    # The latest receipt row per group stands; a cleared or deferred decision settles nothing.
    settling = {k: r for k, r in decided.items() if r.get("decision") in SETTLES}
    rows_of = {m["rec"]: int(m.get("rows") or 0) for g in G for m in g["members"]}
    by_rule = {m["rec"] for g in G if g.get("acts_automatically") for m in g["members"]}
    by_curator = set()
    for r in settling.values():
        out = set(r.get("excluded") or [])
        by_curator |= {w for w in (r.get("members") or []) if w not in out and w in rows_of}
    settled = by_rule | by_curator
    unsettled = [w for w in rows_of if w not in settled]
    ranked = sorted(rows_of, key=lambda w: (-rows_of[w], w))
    head = {str(n): {"settled": sum(1 for w in ranked[:n] if w in settled), "of": min(n, len(ranked)),
                     "rows": sum(rows_of[w] for w in ranked[:n])} for n in HEAD_BANDS}
    look = [g for g in G if g.get("acts_automatically") and g["wordings"] > 1 and g["key"] not in decided]
    names = [g for g in G if g.get("official_id") and g.get("title_divergent") and g["key"] not in settling]
    words = ("wordings resolve to a settled reference (%s by a rung 1 to 4 rule, %s more by a curator); %s of %s articulations"
             % (fmt(len(by_rule)), fmt(len(by_curator - by_rule)), fmt(sum(rows_of[w] for w in settled)), fmt(st["total_rows"])))
    return {
        "key": "cr", "title": "Common CR Reference", "tab": tab,
        # The card opens the reference's List (Sam, 2026-11-03); its issues keep the worklist's filters, which the
        # List's filters do not match (the worklist's open is not the List's Needs a decision).
        "links": [{"href": tab + "/list", "text": "Open the tab"}],
        "status_file": "kb/status/cr.json" if exists(root, "kb/status/cr.json") else None,
        "pair": [{"n": len(settled), "of": len(rows_of), "words": words, "open": tab + "/list"},
                 # The CR's curator decisions are a person's verdicts read from a decision sheet (the receipts' _doc).
                 confirmed_pair(len(by_curator), len(rows_of), len(by_curator & settled), "settled", tab + "/list")],
        "tests": ["rule-settled", "curator-decided", "confirmed by a person"],
        "issues": [
            {"n": len(unsettled), "words": "wordings no rule places and no curator has decided, where a curator judges across groups",
             "owner": "a curator", "carry": "no_procedure", "open": tab + "/open"},
            {"n": len(names), "words": "groups an official number reaches whose title shares no word with the wordings, held for a check",
             "owner": "a curator", "carry": "unsure", "open": tab + "/names"},
        ],
        "procedures": [
            {"n": st["auto_groups"], "words": "groups a rung 1 to 4 rule folds: five rungs, groups form on a shared key, the course count gates a cartesian line",
             "open": tab + "/auto"},
            {"words": "0 hours reads as noncredit; a range names the group"},
        ],
        "machine": {"what": "the worklist build, last changed", "at": git_stamp(root, "kb/cr_reference_worklist.json"), "every_hours": None},
        "facts": {"groups": len(G), "by_rule": st["auto_groups"], "rung_5": st["rung_5_groups"], "rows": st["total_rows"],
                  "decided": len(decided), "verdicts": verdicts, "reached": reached, "receipts": len(receipts),
                  "wordings": len(rows_of), "settled": len(settled), "settled_rows": sum(rows_of[w] for w in settled),
                  "rule_wordings": len(by_rule), "rule_rows": sum(rows_of[w] for w in by_rule),
                  "rule_groups": sum(1 for g in G if g.get("acts_automatically")),
                  "curator_wordings": len(by_curator), "curator_only": len(by_curator - by_rule),
                  "confirmed": len(by_curator), "confirmed_settled": len(by_curator & settled),
                  "curator_only_rows": sum(rows_of[w] for w in by_curator - by_rule),
                  "unsettled": len(unsettled), "unsettled_rows": sum(rows_of[w] for w in unsettled),
                  "head": head, "awaiting_look": len(look), "names_to_check": len(names),
                  "held_by_screen": st.get("groups_held_by_a_screen"), "named_by_range": st.get("groups_named_by_range"),
                  "named_noncredit": st.get("groups_named_noncredit"), "units_differ": sum(1 for g in G if g.get("units_differ")),
                  "named_official": sum(1 for g in G if g.get("official_applied"))},
        "sources": ["kb/cr_reference_worklist.json", "kb/receipts/cr_reference_decisions_*.json"],
    }


# ── Common Subjects Reference ─────────────────────────────────────────────────────────────
# Sam's words are "MQ discipline" (2026-10-19: the handbook's discipline beside our Common
# SUBJ, "to remember the difference between SUBJECT and DISCIPLINE"). The row's figures come
# from the seed, the daily scan's latest.json (kb/_csr_trail.py --latest, the step before this
# one) and the procedures store; a count's link opens the tab's own list (the Commons' step 3).
# The Subjects tab's own words for the scan's rules and the findings its page leaves to another item (canonical_subj4.js).
# The two anchor rules are re-key evidence, counted in their own item (SkyBeacon, 2026-11-06): no curator's note
# settles an anchor entry keyed off a Common SUBJ that changed; the anchor's next re-key does.
CSR_ANCHOR = ("cs9_anchor_subj_diverge", "cs9_anchor_dead_format")
CSR_ASK_SKIP = ("cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup") + CSR_ANCHOR
CSR_RULE_WORDS = {
    "cs1_format": "not four letters", "cs3_squat": "an official prefix on another subject",
    "cs4_divergence_noted": "a divergence the note records", "cs5_modal_diverge": "a modal choice without a note",
    "cs6_weak_mnemonic": "a weak mnemonic", "cs6_mnemonic_noted": "a mnemonic the note records", "cs7_needs_review": "needs review",
    "cs8_seeder_bypass": "the mint path skips the reference", "cs9_anchor_dead_format": "an anchor key in the dead format",
    "cs9_anchor_subj_diverge": "an anchor off its code",
}


def row_subjects(root):
    tab = "#canonical-subj4"
    seed = load_json(root, "kb/discipline_canonical_subj4.json")
    D = seed["disciplines"]
    four = re.compile(r"^[A-Z]{4}$")
    confirmed = {k: v for k, v in D.items() if v.get("source") == "curator_override" and four.match(v.get("canonical_subj4") or "")}
    cohort = sum(1 for v in confirmed.values() if is_cohort(v.get("reviewed_by")))
    modal = [k for k, v in D.items() if v.get("source") == "data_modal"]
    by_code = {}
    for k, v in D.items():
        by_code.setdefault(v.get("canonical_subj4"), []).append(k)
    # A code on two disciplines is a collision unless both entries declare the fan-in (CS2).
    shared = {}
    for c, ks in by_code.items():
        if not c or len(ks) < 2:
            continue
        mutual = all(set(ks) - {k} <= set(D[k].get("fan_in_with") or []) for k in ks)
        if not mutual:
            shared[c] = ks
    collided = {k for ks in shared.values() for k in ks}
    # Complete: confirmed by a person, on the authority rule (the recode of 2026-09-03 put every
    # discipline on it; the scan's missed-alignment rule guards it), and in no collision.
    settled = [k for k in confirmed if k not in collided]
    scan = load_json(root, "kb/csr_out/latest.json") if exists(root, "kb/csr_out/latest.json") else None
    procs = load_json(root, "kb/csr_procedures.json") if exists(root, "kb/csr_procedures.json") else None
    who = "%s by a person" % fmt(len(confirmed) - cohort) + (", %s by the nightly procedure or a session cohort" % fmt(cohort) if cohort else "")
    issues = [
        {"n": len(modal), "words": "MQ disciplines on the data's modal code, unconfirmed", "owner": "a curator", "carry": "unsure", "open": tab + "/open"},
        {"n": len(shared), "words": "codes on two MQ disciplines" + (" (" + ", ".join(sorted(shared)) + ")" if shared else ""),
         "owner": "a curator", "carry": "reaches", "open": tab + "/list/collision"},
    ]
    # A known issue with nothing in it is not an issue: the collisions row leaves the list at zero
    # (the AGAB re-key of 2026-10-19 closed the one), and facts.shared keeps the measure.
    issues = [i for i in issues if i.get("n") != 0]
    missed = None
    if scan:
        rules = {}
        for f in scan.get("findings") or []:
            rules[f.get("rule")] = rules.get(f.get("rule"), 0) + 1
        missed = rules.get("cs4_missed_alignment", 0)
        # The findings to confirm or note, counted as the Subjects tab's opened page counts them (S561): every
        # finding needing judgment less the ones another issue counts and the aligned ones (ASK_SKIP in
        # canonical_subj4.js). The card had counted two rules only, so it read 16 where the page read 17.
        ask = {}
        for f in scan.get("findings") or []:
            if f.get("needs_judgment") and f.get("rule") not in CSR_ASK_SKIP:
                ask[f.get("rule")] = ask.get(f.get("rule"), 0) + 1
        judgments = sum(ask.values())
        kinds = ", ".join(CSR_RULE_WORDS.get(r, r) for r, _ in sorted(ask.items(), key=lambda kv: -kv[1]))
        if judgments:
            issues.append({"n": judgments, "words": "scan findings to confirm or note" + (" (" + kinds + ")" if kinds else ""),
                           "owner": "a curator, after Jev's sitting", "carry": "unsure", "open": tab + "/list/scan"})
        anchors = sum(1 for f in scan.get("findings") or [] if f.get("rule") in CSR_ANCHOR)
        if anchors:
            issues.append({"n": anchors, "words": "curated anchor entries keyed off a Common SUBJ that changed, or in the dead key format",
                           "owner": "a re-key of the anchor under the playbook", "carry": "reaches", "open": tab + "/progress"})
        mc = scan.get("_mid_codes") or {}
        issues.append({"n": mc.get("stray_codes"), "words": "identity codes that are neither a Common SUBJ nor an umbrella code, on %s identities" % fmt(mc.get("stray_ids")),
                       "owner": "a re-mint under the playbook", "carry": "reaches", "open": "#coci-lookup/list/stray"})
        if missed:
            issues.append({"n": missed, "words": "missed alignments with an authority code", "owner": "a curator", "carry": "unsure", "open": tab + "/chip"})
    procedures = []
    if procs:
        ps = procs.get("procedures") or []
        on = [p for p in ps if p.get("on")]
        procedures.append({"n": len(on), "words": "procedures in force, of %d written" % len(ps), "open": tab + "/progress"})
        for p in ps:
            if p.get("kind") == "rule" and p.get("on"):
                procedures.append({"words": p.get("name")})
    else:
        procedures = [
            {"words": "A code is four letters; the subject map decides a discipline and TOP corroborates it"},
            {"words": "A re-key goes through the alias chain and lands in one cron window"},
        ]
    procedures.append({"words": "Counted from the picks as the daily sync committed them; the tab reads them live, so between syncs its figures run ahead of these"})
    machine = {"what": "the daily sync of the picks into the seed", "at": seed.get("_synced_at"), "every_hours": 24}
    if scan and scan.get("_scanned_at"):
        machine = {"what": "the daily sync of the picks and the daily scan", "at": max(seed.get("_synced_at") or "", scan["_scanned_at"]), "every_hours": 24}
    return {
        "key": "subjects", "title": "Common Subjects Reference", "tab": tab,
        # The card opens the reference's List (Sam, 2026-11-03), where a pick is confirmed.
        "links": [{"href": tab + "/list", "text": "Open the tab"}],
        "status_file": "kb/status/subjects.json" if exists(root, "kb/status/subjects.json") else None,
        "pair": [{"n": len(settled), "of": len(D),
                  "words": "MQ disciplines with courses carry a settled Common SUBJ: confirmed (by a person, or by the nightly procedure where the code is the authority's own), on the authority rule, in no collision (%s)" % who,
                  "open": tab + "/list"},
                 confirmed_pair(len(confirmed) - cohort, len(D),
                                sum(1 for k in settled if not is_cohort(confirmed[k].get("reviewed_by"))), "settled", tab + "/list/person")],
        "tests": ["confirmed", "authority rule", "collision-free", "confirmed by a person"],
        "issues": issues,
        "procedures": procedures,
        "machine": machine,
        "facts": {"disciplines": len(D), "confirmed": len(confirmed), "person": len(confirmed) - cohort, "cohort": cohort,
                  "person_settled": sum(1 for k in settled if not is_cohort(confirmed[k].get("reviewed_by"))),
                  "settled": len(settled), "modal": len(modal), "shared": sorted(shared), "missed_alignment": missed,
                  "scanned_at": scan.get("_scanned_at") if scan else None,
                  "procedures_on": sum(1 for p in (procs or {}).get("procedures", []) if p.get("on")) if procs else None},
        "sources": ["kb/discipline_canonical_subj4.json", "kb/csr_out/latest.json", "kb/csr_procedures.json"],
    }


# ── the frame ─────────────────────────────────────────────────────────────────────────────
ROWS = [
    ("requirements", "Program Requirements", "#program-requirements", row_requirements),
    ("exhibit", "Common Exhibit Reference", "#exhibits", row_exhibit),
    ("course", "Common Course Reference", "#coci-lookup/courses", row_course),
    ("cr", "Common CR Reference", "#cr-reference", row_cr),
    ("subjects", "Common Subjects Reference", "#canonical-subj4", row_subjects),
]


def unread_row(key, title, tab, err):
    """A row whose reads failed as a whole: its frame stands, every figure null with the error."""
    return {"key": key, "title": title, "tab": tab, "links": [{"href": tab, "text": "Open the tab"}],
            "status_file": None, "pair": [{"n": None, "of": None, "words": "", "open": tab}], "tests": [],
            "issues": [], "procedures": [], "machine": {"what": None, "at": None, "every_hours": None},
            "error": err, "sources": []}




# ── the building references (S552, 2026-11-02): the CPL Commons' three cards that are not yet a reference with a
# definition of complete. Each carries a count with no universe (the tab draws no meter), the machine stamp of the file
# it read, and its sources; a file that cannot be read is null beside its error, never a zero (the S343 rule).

def building_credentials(root):
    """Industry credentials: the credential watch's catalog (kb/it_ai_credential_catalog.json)."""
    rel = "kb/it_ai_credential_catalog.json"
    d = load_json(root, rel)
    st = d.get("_stats") or {}
    inp = d.get("_inputs") or {}
    n, issuers = st.get("credentials"), st.get("issuers")
    at = inp.get("watch_verified_on") or inp.get("cos_synced_at")
    if at and len(str(at)) == 10:
        at = str(at) + "T00:00:00Z"
    return {"key": "credentials", "title": "Industry credentials", "tab": "#exhibits",
            "links": [{"href": "#exhibits", "text": "Open Exhibits"}],
            "pair": [{"n": n, "of": None, "words": "credentials from %s issuers" % fmt_int(issuers), "open": "#exhibits"}],
            "tests": ["issuer-published"],
            "facts": {"credentials": n, "issuers": issuers, "in_map": st.get("in_map"), "articulated": st.get("articulated"),
                      "with_issuer_skills": st.get("with_issuer_skills"), "tech_giant": st.get("tech_giant_credentials")},
            "machine": {"what": "the credential watch's catalog", "at": at, "every_hours": None}, "sources": [rel]}


def building_outcomes(root):
    """Course outcomes: every committed outline read under kb/course_outcomes/<college>/read_*.json."""
    files = sorted(glob.glob(os.path.join(root, "kb", "course_outcomes", "*", "read_*.json")))
    if not files:
        raise FileNotFoundError("kb/course_outcomes/*/read_*.json")
    outcomes, courses, colleges, latest = 0, 0, set(), ""
    for f in files:
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        sm = d.get("summary") or {}
        o = sm.get("outcomes")
        if isinstance(o, int):
            outcomes += o
        for r in d.get("rows") or []:
            if isinstance(r, dict) and r.get("outcomes"):
                courses += 1
                for c in r.get("named_by") or []:
                    colleges.add(c)
        at = str(d.get("at") or "")
        if at > latest:
            latest = at
    return {"key": "outcomes", "title": "Course outcomes", "tab": "#coci-lookup",
            "links": [{"href": "#coci-lookup", "text": "Open the Courses List"}],
            "pair": [{"n": outcomes, "of": None, "words": "outcomes read from %s courses at %d colleges" % (fmt_int(courses), len(colleges)), "open": "#coci-lookup"}],
            "tests": ["read from the public outline"],
            "facts": {"outcomes": outcomes, "courses": courses, "colleges": sorted(colleges), "reads": len(files)},
            "machine": {"what": "the last outline read", "at": latest or None, "every_hours": None},
            "sources": ["kb/course_outcomes/*/read_*.json"]}


def building_skills(root):
    """Skills: the credentials whose issuer publishes a skills list, in the same catalog."""
    rel = "kb/it_ai_credential_catalog.json"
    d = load_json(root, rel)
    st = d.get("_stats") or {}
    inp = d.get("_inputs") or {}
    at = inp.get("watch_verified_on") or inp.get("cos_synced_at")
    if at and len(str(at)) == 10:
        at = str(at) + "T00:00:00Z"
    return {"key": "skills", "title": "Skills", "tab": None, "links": [],
            "pair": [{"n": st.get("with_issuer_skills"), "of": None, "words": "credentials list their issuer's skills so far", "open": None}],
            "tests": ["issuer-published"],
            "facts": {"with_issuer_skills": st.get("with_issuer_skills")},
            "machine": {"what": "the credential watch's catalog", "at": at, "every_hours": None}, "sources": [rel]}


def fmt_int(n):
    return "{:,}".format(n) if isinstance(n, int) else "an unknown number of"


# The one queue (Sam, 2026-11-04, S573: the routines carry the volume and "queue human decisions only when
# needed"). Every issue names who carries it: a routine (the harvest, a session fixing a procedure, a source
# outside the Commons), or a person for one of four reasons. The queue groups the person items by reason, in
# this order; an issue that names no reason lands under "unsorted", so a new issue cannot hide.
CARRY_REASONS = ["no_procedure", "unsure", "reaches", "keep_call"]
CARRY_KEYS = set(CARRY_REASONS) | {"routine"}


def build_queue(rows):
    groups = {k: [] for k in CARRY_REASONS}
    carried, unsorted = [], []
    for r in rows:
        for i in r.get("issues") or []:
            item = {"ref": r.get("key"), "title": r.get("title"), "n": i.get("n"), "words": i.get("words"),
                    "owner": i.get("owner"), "open": i.get("open")}
            if i.get("error"):
                item["error"] = i["error"]
            c = i.get("carry")
            if c == "routine":
                carried.append(item)
            elif c in groups:
                groups[c].append(item)
            else:
                unsorted.append(item)
    out = {"reasons": [{"key": k, "items": groups[k]} for k in CARRY_REASONS], "carried": carried}
    if unsorted:
        out["unsorted"] = unsorted
    return out


# The confidence count (Sam, 2026-11-04, S573: "automate as many of these procedures with confidence as
# possible"). A procedure earns trust by what a person does with its work afterward. Each procedure's committed
# receipts say what it placed; the committed reference says where each item sits now and whose stamp it carries.
# An item a person has looked at is kept (same place), renamed with its family (the person renamed or merged the
# whole family: its old name is gone and its siblings moved together), or moved (a correction). Items no person has
# looked at yet stay "untouched", so the share looked at reads beside the agreement.
CONF_KEYS = ["placed", "untouched", "kept", "renamed", "moved", "by_procedure", "left"]


def _norm(t):
    return " ".join(str(t or "").lower().split())


def _conf_counts(placed):
    c = {k: 0 for k in CONF_KEYS}
    for state in placed.values():
        c["placed"] += 1
        c[state] += 1
    c["looked"] = c["kept"] + c["renamed"] + c["moved"]
    return c


def confidence_exhibits(root):
    """Exhibit titles a CER procedure assigned (kb/cer_procedures_out/saved/), against kb/unified_titles.json now."""
    ut = load_json(root, "kb/unified_titles.json")
    saved = {}
    for f in sorted(glob.glob(os.path.join(root, "kb/cer_procedures_out/saved/saved_*.json"))):
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        for r in d.get("rows") or []:
            if r.get("field") == "unified_title_assignment" and r.get("course_id"):
                saved[r["course_id"]] = r   # the latest save of a title wins
    live = {}
    for v in ut.values():
        n = _norm(v.get("unified_title"))
        live[n] = live.get(n, 0) + 1
    # Where each family a procedure named now sits, so a split reads as a move, never as a rename.
    went = {}
    for cid, r in saved.items():
        e = ut.get(cid.partition("::")[2])
        if e:
            went.setdefault(_norm(r.get("value")), []).append(_norm(e.get("unified_title")))
    plural = {v: max(set(w), key=w.count) for v, w in went.items()}
    by = {}
    for cid, r in saved.items():
        proc = r.get("procedure") or str(r.get("reviewer_email") or "").replace("cer-procedure-", "").replace("@bot", "")
        e = ut.get(cid.partition("::")[2])
        old = _norm(r.get("value"))
        who = str((e or {}).get("reviewed_by") or "")
        if e is None:
            state = "left"
        elif not who or who == r.get("reviewer_email"):
            state = "untouched"
        elif who.endswith("@bot"):
            state = "by_procedure"
        elif _norm(e.get("unified_title")) == old:
            state = "kept"
        elif live.get(old, 0) == 0 and _norm(e.get("unified_title")) == plural.get(old):
            state = "renamed"
        else:
            state = "moved"
        by.setdefault(proc, {})[cid] = state
    procs = [dict(name=k, **_conf_counts(v)) for k, v in by.items()]
    procs.sort(key=lambda x: -x["placed"])
    allp = {}
    for v in by.values():
        allp.update(v)
    return {"ref": "exhibit", "unit": "titles", "procedures": procs, "total": _conf_counts(allp)}


def confidence_subjects(root):
    """Common SUBJ picks the nightly confirm settled (kb/csr_out/confirm/), against kb/discipline_canonical_subj4.json now."""
    seed = load_json(root, "kb/discipline_canonical_subj4.json").get("disciplines") or {}
    placed = {}
    proc_name = "confirm-authority"
    for f in sorted(glob.glob(os.path.join(root, "kb/csr_out/confirm/confirmed_*.json"))):
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        for r in d.get("rows") or []:
            disc = r.get("discipline")
            if not disc:
                continue
            e = seed.get(disc) or {}
            who = str(e.get("reviewed_by") or "")
            if not e.get("canonical_subj4"):
                state = "left"
            elif not who or who == r.get("reviewer_email"):
                state = "untouched"
            elif who.endswith("@bot"):
                state = "by_procedure"
            elif e.get("canonical_subj4") == r.get("value"):
                state = "kept"
            else:
                state = "moved"
            placed[disc] = state
    return {"ref": "subjects", "unit": "picks", "procedures": [dict(name=proc_name, **_conf_counts(placed))] if placed else [],
            "total": _conf_counts(placed)}


def build_confidence(root):
    out = []
    for ref, fn in (("exhibit", confidence_exhibits), ("subjects", confidence_subjects)):
        try:
            out.append(fn(root))
        except Exception as e:  # noqa: BLE001  (a source that cannot be read says so, never a zero)
            out.append({"ref": ref, "error": "%s: %s" % (type(e).__name__, e)})
    return out


def next_batch(root):
    """The one small batch the first view opens on (Sam's Commons rulings, 2026-11-08, #2921 item 2): Another look's
    open cards in Exhibits, six at most, decided with Keep or Change from the evidence, then stop. The sweep never
    shows a card again once a person has kept or changed it, so its card count is what is still open.

    `cards` names the six, with the kb_curation keys a decision saves under (`_UNCLASSIFIED::<local title>`, the
    keys exhibits.js reconcileSweep reads), so the Commons can count the batch decided from the saves themselves
    and close it on the spot (COBIx on #2921, 2026-11-09: the card still read open after Sam decided all six)."""
    d = load_json(root, "kb/exhibits_sweep.json")
    cards = d.get("cards") or []
    n = min(len(cards), 6)
    if not n:
        return None
    rules = sorted({r for c in cards[:n] for r in (c.get("rules") or [])})
    return {"kind": "another-look", "n": n, "of": len(cards), "open": "#exhibits/another-look/batch",
            "title": "Another look at %s exhibit title%s" % (fmt(n), "" if n == 1 else "s"),
            "teaches": "Keep what works, correct what does not; each answer teaches the next nightly sweep.",
            "stop": "The batch ends when its cards are decided.", "rules": rules,
            "cards": [{"id": c.get("id"), "current": c.get("current"),
                       "keys": [UNCLASS_PREFIX + l["raw"] for l in (c.get("locals") or []) if l.get("raw")]}
                      for c in cards[:n]],
            "at": d.get("generated_at")}


UNCLASS_PREFIX = "_UNCLASSIFIED::"
# The run logs whose open calls are decisions on a sheet (the session side of each row, kb/status/<project>.json).
CALL_LOGS = ["program-requirements", "exhibit", "course", "cr", "subjects"]


def decision_batches(root):
    """Each call a run log still holds open, one batch apiece, in the logs' order: the decision sheet it sits on.
    A log that cannot be read is named, never skipped as if it held nothing."""
    out = []
    for p in CALL_LOGS:
        try:
            d = load_json(root, "kb/status/%s.json" % p)
        except (OSError, ValueError) as e:
            out.append({"kind": "decision", "project": p, "error": "%s: %s" % (type(e).__name__, e)})
            continue
        for c in d.get("calls") or []:
            if (c.get("answer") or {}).get("words") or not c.get("title"):
                continue
            out.append({"kind": "decision", "project": p, "n": 1, "title": c.get("title"), "teaches": c.get("text"),
                        "open": c.get("link"), "todo_id": c.get("todo_id"),
                        "stop": "It ends when you answer the sheet."})
    return out


def job_batches(queue):
    """The queue's items a person named Sam carries (the owner says so), each a job that opens filtered."""
    out = []
    for g in (queue or {}).get("reasons") or []:
        for i in g.get("items") or []:
            if not str(i.get("owner") or "").startswith("Sam") or i.get("error") or not i.get("n"):
                continue
            out.append({"kind": "job", "ref": i.get("ref"), "n": i.get("n"), "title": i.get("title"),
                        "words": i.get("words"), "teaches": i.get("owner"), "open": i.get("open"), "reason": g.get("key")})
    return out


def docket(root):
    """The Docket's open cases (#2963 step 2), from kb/docket/cases.json: each a decision a reviewer rules on in the
    Commons, with its evidence, its choices and the plan each choice runs. A done case leaves the list."""
    d = load_json(root, "kb/docket/cases.json")
    keep = ("id", "source", "addressee", "dr", "lane", "ref", "decides", "size", "evidence", "links", "choices",
            "plan_words", "no_reply", "sheet", "filed_at")
    return [{k: c.get(k) for k in keep if c.get(k) is not None}
            for c in d.get("cases") or [] if c.get("status") not in ("done", "partial") and c.get("id") and c.get("choices")]


def batches(root, queue, cases=None):
    """The ordered list of small batches (COBIx on #2921, 2026-11-09, ask 2: "always offer the next step"): Another
    look, then the Docket's open cases (ruled in place, #2963 step 2), then each decision a run log holds open on a
    sheet no case carries, then the queue's jobs Sam carries. The first view shows the first one not done; when none
    is left it says so plainly."""
    out = []
    a = next_batch(root)
    if a:
        out.append(a)
    cases = cases or []
    for c in cases:
        out.append({"kind": "case", "id": c["id"], "n": (c.get("size") or {}).get("n"), "title": c.get("decides"),
                    "open": "#commons/case/" + c["id"], "addressee": c.get("addressee")})
    # A sheet a case now carries is ruled here, so its run-log call is no second batch.
    on_docket = {c.get("sheet") for c in cases if c.get("sheet")}
    out.extend(b for b in decision_batches(root) if b.get("error") or b.get("open") not in on_docket)
    out.extend(job_batches(queue))
    return out


BUILDING = [
    ("credentials", "Industry credentials", "#exhibits", building_credentials),
    ("outcomes", "Course outcomes", "#coci-lookup", building_outcomes),
    ("skills", "Skills", None, building_skills),
]

def build(root):
    rows = []
    for key, title, tab, fn in ROWS:
        try:
            row = fn(root)
        except Exception as e:  # noqa: BLE001
            row = unread_row(key, title, tab, "%s: %s" % (type(e).__name__, e))
        rows.append(row)
    building = []
    for key, title, tab, fn in BUILDING:
        try:
            row = fn(root)
        except Exception as e:  # noqa: BLE001
            row = unread_row(key, title, tab, "%s: %s" % (type(e).__name__, e))
        building.append(row)
    queue = build_queue(rows)
    dk = _safe(docket, root)
    bl = _safe(lambda r: batches(r, queue, dk if isinstance(dk, list) else []), root)
    nb = (next((b for b in bl if not b.get("error")), None) if isinstance(bl, list) else bl)
    return {"schema": SCHEMA, "written_at": iso_now(), "rows": rows, "building": building, "queue": queue,
            "confidence": build_confidence(root), "docket": dk, "batches": bl, "next_batch": nb}


def _safe(fn, root):
    try:
        return fn(root)
    except Exception as e:  # noqa: BLE001
        return {"error": "%s: %s" % (type(e).__name__, e)}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".", help="the repo root (default: the working directory)")
    ap.add_argument("--out", default=None, help="where to write (default: kb/status/commons.json under --root)")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    data = build(a.root)
    out = a.out or os.path.join(a.root, OUT)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write("\n")
    if not a.quiet:
        for r in data["rows"]:
            p = r["pair"][0]
            print("%-28s %s of %s%s" % (r["title"], p["n"], p["of"], ("  [" + r["error"] + "]") if r.get("error") else ""))
        print("wrote", out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
