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
    return {
        "key": "requirements", "title": "Program Requirements", "tab": tab,
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/program-requirements.json" if exists(root, "kb/status/program-requirements.json") else None,
        "pair": [{"n": len(complete), "of": len(active),
                  "words": "complete at %d colleges" % len(set(c for c, _ in complete)), "open": tab}],
        "tests": ["machine-checked"],
        "issues": [
            {"n": failing, "words": "active programs whose record fails a check", "owner": "the college's reading procedure", "open": tab},
            {"n": unread, "words": "active programs with no record yet", "owner": "the harvest", "open": tab},
        ],
        "procedures": [
            {"n": len(colleges), "words": "reading procedures, one per college read, versioned", "open": tab},
            {"words": "A misread is fixed in the procedure, and the records it touched are reread together"},
        ],
        "machine": {"what": "the last college read", "at": max(starts) if starts else None, "every_hours": None},
        "facts": {"active": len(active), "complete": len(complete), "failing": failing, "unread": unread,
                  "records": len(recs), "colleges": len(colleges),
                  "outside_active": sum(1 for k in by_key if k not in active)},
        "sources": ["coci_programs_data.js", "kb/program_requirements_college/*/records/*.json",
                    "kb/program_requirements_pilot/records/*.json", "kb/program_requirements_college/*/capture.json"],
    }


# ── Common Exhibit Reference ──────────────────────────────────────────────────────────────
def is_cohort(who):
    """A review stamp's reviewer: a session or procedure cohort ends in @bot; a person is the rest."""
    return str(who or "").endswith("@bot")


def receipt_time(v):
    """A receipt's `at` writes the time part with hyphens (2026-10-18T17-37-29Z); the ISO form."""
    m = re.match(r"^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$", str(v or ""))
    return "%sT%s:%s:%sZ" % m.groups() if m else v


def row_exhibit(root):
    tab = "#credential-reference"
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
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/exhibit.json" if exists(root, "kb/status/exhibit.json") else None,
        "pair": [{"n": len(stamped), "of": len(ut),
                  "words": "titles carry a review stamp (%s a person's, %s a cohort's); %s credentials, %s of %s records stamped"
                           % (fmt(person), fmt(cohort), fmt(len(creds)), fmt(rec_stamped), fmt(len(records))), "open": tab + "/progress"}],
        "tests": ["curator-stamped", "procedure-settled"],
        "issues": [
            {"n": held_n, "words": "titles held for a person", "owner": "a curator" + (" (" + held_why + ")" if held_why else ""),
             "open": tab + "/held", "error": run["error"]},
            {"n": conflicts, "words": "saved assignments the fold holds", "owner": "a curator (a human-reviewed classification stands)",
             "open": tab + "/held", "error": run["error"]},
            {"n": left["n"], "words": "titles in the reference that have left MAP", "owner": "a curator (retire or keep)",
             "open": tab + "/all", "error": left["error"]},
        ],
        "procedures": [
            {"n": len(procs["n"]) if procs["n"] is not None else None,
             "words": "in force: %d rules applied by code, %d read by the classifier" % (kinds.get("rule", 0), kinds.get("guidance", 0))
             if procs["n"] is not None else "in force", "open": tab + "/procs", "error": procs["error"]},
            {"words": "A procedure's saves undo together"},
        ],
        "machine": {"what": "the saving run and the fold", "at": max(stamps) if stamps else None, "every_hours": 24},
        "facts": {"titles": len(ut), "stamped": len(stamped), "person": person, "cohort": cohort, "credentials": len(creds),
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
    # home and every count open the map; the list tab (#unified-courses) left the menu the same minute.
    tab = "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html"
    A = load_json(root, "kb/row_audit/latest.json")
    st, fr, tags = A["stats"], A["stats"]["faculty_readiness"], A["stats"]["tag_counts"]
    cap = figure(lambda: round(1 - A["_faculty_weights"]["discipline"] * (1 - A["_field_state_score"]["seed-untouched"]), 2))
    canvas = figure(lambda: load_json(root, "prototype/ccr_universe.json"))
    today = figure(lambda: js_object(root, "unified_courses_standalone.js"))
    cv = canvas["n"] or {}
    counts = cv.get("counts") or {}
    procedures = [
        {"n": counts.get("identities"), "words": "identities and %s stand-alone courses on the canvas (the %s layout)%s"
         % (fmt(counts.get("stand_alone")), str(cv.get("_generated_from", ""))[:10],
            "; %s stand-alone in today's build" % fmt(len(today["n"]["rows"])) if today["n"] else ""),
         "open": tab, "error": canvas["error"]},
        {"words": "TOP is a last-in-line signal; an identity keeps one record across its unit range; a stored id resolves through the alias chain"},
        {"words": "Re-mints follow the playbook, one cron window each"},
    ]
    return {
        "key": "course", "title": "Common Course Reference", "tab": tab,
        "links": [{"href": tab, "text": "Open SkyView"}],
        "status_file": "kb/status/course.json" if exists(root, "kb/status/course.json") else None,
        "pair": [{"n": fr["ready"], "of": st["total_cards"],
                  "words": "cards the auditor scores 0.85 or better; %s at needs review, %s at needs repair, %s not ready"
                           % (fmt(fr["needs_review"]), fmt(fr["needs_repair"]), fmt(fr["not_ready"])), "open": tab}],
        "tests": ["scored by the auditor"],
        "issues": [
            {"n": tags.get("seed_untouched_discipline"), "words": "cards carry a discipline no seed has touched, capped at %s" % (cap["n"] if cap["n"] is not None else "0.79"),
             "owner": "the Common Subjects reference", "open": tab},
            {"n": tags.get("unit_anomaly"), "words": "unit anomalies", "owner": "a curator (an identity keeps its unit range)", "open": tab},
            {"n": tags.get("top_discipline_disagreement"), "words": "TOP and discipline disagreements",
             "owner": "a curator (the subject map decides; TOP corroborates)", "open": tab},
            {"n": tags.get("blank_description"), "words": "blank descriptions", "owner": "the colleges' COCI entries", "open": tab},
        ],
        "procedures": procedures,
        "machine": {"what": "the auditor", "at": A.get("_generated_at"), "every_hours": 24},
        "facts": {"total": st["total_cards"], "ready": fr["ready"], "needs_review": fr["needs_review"],
                  "needs_repair": fr["needs_repair"], "not_ready": fr["not_ready"], "cap": cap["n"]},
        "sources": ["kb/row_audit/latest.json", "prototype/ccr_universe.json", "unified_courses_standalone.js"],
    }


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
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/cr.json" if exists(root, "kb/status/cr.json") else None,
        "pair": [{"n": len(settled), "of": len(rows_of), "words": words, "open": tab + "/progress"}],
        "tests": ["rule-settled", "curator-decided"],
        "issues": [
            {"n": len(unsettled), "words": "wordings no rule places and no curator has decided, where a curator judges across groups",
             "owner": "a curator", "open": tab + "/open"},
            {"n": len(names), "words": "groups an official number reaches whose title shares no word with the wordings, held for a check",
             "owner": "a curator", "open": tab + "/names"},
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
        {"n": len(modal), "words": "MQ disciplines on the data's modal code, unconfirmed", "owner": "a curator", "open": tab + "/pre_seeded"},
        {"n": len(shared), "words": "codes on two MQ disciplines" + (" (" + ", ".join(sorted(shared)) + ")" if shared else ""),
         "owner": "a curator", "open": tab + "/check"},
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
        judgments = rules.get("cs6_weak_mnemonic", 0) + rules.get("cs5_modal_diverge", 0)
        issues.append({"n": judgments, "words": "scan findings to confirm or note (a weak mnemonic, a modal choice without a note)",
                       "owner": "a curator, after Jev's sitting", "open": tab + "/progress"})
        mc = scan.get("_mid_codes") or {}
        issues.append({"n": mc.get("stray_codes"), "words": "identity codes that are neither a Common SUBJ nor an umbrella code, on %s identities" % fmt(mc.get("stray_ids")),
                       "owner": "a re-mint under the playbook", "open": tab + "/progress"})
        if missed:
            issues.append({"n": missed, "words": "missed alignments with an authority code", "owner": "a curator", "open": tab + "/chip"})
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
    machine = {"what": "the daily sync of the picks into the seed", "at": seed.get("_synced_at"), "every_hours": 24}
    if scan and scan.get("_scanned_at"):
        machine = {"what": "the daily sync of the picks and the daily scan", "at": max(seed.get("_synced_at") or "", scan["_scanned_at"]), "every_hours": 24}
    return {
        "key": "subjects", "title": "Common Subjects Reference", "tab": tab,
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/subjects.json" if exists(root, "kb/status/subjects.json") else None,
        "pair": [{"n": len(settled), "of": len(D),
                  "words": "MQ disciplines with courses carry a settled Common SUBJ: confirmed (by a person, or by the nightly procedure where the code is the authority's own), on the authority rule, in no collision (%s)" % who,
                  "open": tab + "/progress"}],
        "tests": ["confirmed", "authority rule", "collision-free"],
        "issues": issues,
        "procedures": procedures,
        "machine": machine,
        "facts": {"disciplines": len(D), "confirmed": len(confirmed), "person": len(confirmed) - cohort, "cohort": cohort,
                  "settled": len(settled), "modal": len(modal), "shared": sorted(shared), "missed_alignment": missed,
                  "scanned_at": scan.get("_scanned_at") if scan else None,
                  "procedures_on": sum(1 for p in (procs or {}).get("procedures", []) if p.get("on")) if procs else None},
        "sources": ["kb/discipline_canonical_subj4.json", "kb/csr_out/latest.json", "kb/csr_procedures.json"],
    }


# ── the frame ─────────────────────────────────────────────────────────────────────────────
ROWS = [
    ("requirements", "Program Requirements", "#program-requirements", row_requirements),
    ("exhibit", "Common Exhibit Reference", "#credential-reference", row_exhibit),
    ("course", "Common Course Reference", "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html", row_course),
    ("cr", "Common CR Reference", "#cr-reference", row_cr),
    ("subjects", "Common Subjects Reference", "#canonical-subj4", row_subjects),
]


def unread_row(key, title, tab, err):
    """A row whose reads failed as a whole: its frame stands, every figure null with the error."""
    return {"key": key, "title": title, "tab": tab, "links": [{"href": tab, "text": "Open the tab"}],
            "status_file": None, "pair": [{"n": None, "of": None, "words": "", "open": tab}], "tests": [],
            "issues": [], "procedures": [], "machine": {"what": None, "at": None, "every_hours": None},
            "error": err, "sources": []}


def build(root):
    rows = []
    for key, title, tab, fn in ROWS:
        try:
            row = fn(root)
        except Exception as e:  # noqa: BLE001
            row = unread_row(key, title, tab, "%s: %s" % (type(e).__name__, e))
        rows.append(row)
    return {"schema": SCHEMA, "written_at": iso_now(), "rows": rows}


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
