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
                           % (fmt(person), fmt(cohort), fmt(len(creds)), fmt(rec_stamped), fmt(len(records))), "open": tab}],
        "tests": ["curator-stamped", "procedure-settled"],
        "issues": [
            {"n": held_n, "words": "titles held for a person", "owner": "a curator" + (" (" + held_why + ")" if held_why else ""),
             "open": tab, "error": run["error"]},
            {"n": conflicts, "words": "saved assignments the fold holds", "owner": "a curator (a human-reviewed classification stands)",
             "open": tab, "error": run["error"]},
            {"n": left["n"], "words": "titles in the reference that have left MAP", "owner": "a curator (retire or keep)",
             "open": tab, "error": left["error"]},
        ],
        "procedures": [
            {"n": len(procs["n"]) if procs["n"] is not None else None,
             "words": "in force: %d rules applied by code, %d read by the classifier" % (kinds.get("rule", 0), kinds.get("guidance", 0))
             if procs["n"] is not None else "in force", "open": tab, "error": procs["error"]},
            {"words": "A procedure's saves undo together"},
        ],
        "machine": {"what": "the saving run and the fold", "at": max(stamps) if stamps else None, "every_hours": 24},
        "facts": {"titles": len(ut), "stamped": len(stamped), "person": person, "cohort": cohort, "credentials": len(creds),
                  "records": len(records), "records_stamped": rec_stamped, "saved_at": saved_at, "fold_at": fold_at},
        "sources": ["kb/unified_titles.json", "kb/credentials.json", "kb/exhibit_audit/latest.json",
                    "kb/cer_procedures_out/latest.json", "kb/cer_procedures.json", "kb/cer_procedures_out/saved/",
                    "kb/unclassified_fold/*/report.json"],
    }


# ── Common Course Reference ───────────────────────────────────────────────────────────────
def row_course(root):
    tab = "#unified-courses"
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
         "open": "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html", "error": canvas["error"]},
        {"words": "TOP is a last-in-line signal; an identity keeps one record across its unit range; a stored id resolves through the alias chain"},
        {"words": "Re-mints follow the playbook, one cron window each"},
    ]
    return {
        "key": "course", "title": "Common Course Reference", "tab": tab,
        # The CCR is SkyView (Sam, 2026-10-18 20:40Z: "the CCR should be the same as SkyView now"): the row
        # opens the map; the list tab, where the auditor's columns are, stays one word away and takes the counts.
        "links": [{"href": "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html", "text": "Open SkyView"},
                  {"href": tab, "text": "The list"}],
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
    return {
        "key": "cr", "title": "Common CR Reference", "tab": tab,
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/cr.json" if exists(root, "kb/status/cr.json") else None,
        "pair": [{"n": st["auto_groups"], "of": len(G), "words": "groups collapsed by a rung-1 to 4 rule", "open": tab},
                 {"n": len(decided) if receipts else None,
                  "words": "groups a curator decided: %s verdicts reaching %s of %s rows by its receipt" % (fmt(verdicts), fmt(reached), fmt(st["total_rows"])),
                  "open": tab}],
        "tests": ["assigned by rung", "curator-decided"],
        "issues": [
            {"n": st["rung_5_groups"], "words": "groups at rung 5, where similarity suggests a match for a curator to confirm", "owner": "a curator", "open": tab},
        ],
        "procedures": [
            {"words": "Five rungs; groups form on a shared key, each pair on its own; the course count gates a cartesian line"},
            {"words": "0 hours reads as noncredit; a range names the group"},
        ],
        "machine": {"what": "the worklist build, last changed", "at": git_stamp(root, "kb/cr_reference_worklist.json"), "every_hours": None},
        "facts": {"groups": len(G), "by_rule": st["auto_groups"], "rung_5": st["rung_5_groups"], "rows": st["total_rows"],
                  "decided": len(decided), "verdicts": verdicts, "reached": reached, "receipts": len(receipts)},
        "sources": ["kb/cr_reference_worklist.json", "kb/receipts/cr_reference_decisions_*.json"],
    }


# ── Common Subjects Reference ─────────────────────────────────────────────────────────────
def row_subjects(root):
    tab = "#canonical-subj4"
    seed = load_json(root, "kb/discipline_canonical_subj4.json")
    D = seed["disciplines"]
    confirmed = {k: v for k, v in D.items() if v.get("source") == "curator_override"}
    cohort = sum(1 for v in confirmed.values() if is_cohort(v.get("reviewed_by")))
    modal = [k for k, v in D.items() if v.get("source") == "data_modal"]
    by_code = {}
    for k, v in D.items():
        by_code.setdefault(v.get("canonical_subj4"), []).append(k)
    shared = {c: ks for c, ks in by_code.items() if c and len(ks) > 1}
    shared_words = "; ".join("%s%s" % (c, " by design" if any(D[k].get("fan_in_with") for k in ks) else "") for c, ks in sorted(shared.items()))
    return {
        "key": "subjects", "title": "Common Subjects Reference", "tab": tab,
        "links": [{"href": tab, "text": "Open the tab"}],
        "status_file": "kb/status/subjects.json" if exists(root, "kb/status/subjects.json") else None,
        "pair": [{"n": len(confirmed), "of": len(D),
                  "words": "disciplines carry a curator-confirmed subject code (%s by a person, %s by a session cohort)"
                           % (fmt(len(confirmed) - cohort), fmt(cohort)), "open": tab}],
        "tests": ["curator-confirmed"],
        "issues": [
            {"n": len(modal), "words": "disciplines on the data's modal code, unconfirmed", "owner": "a curator", "open": tab},
            {"n": len(shared), "words": "codes on two disciplines each" + (" (" + shared_words + ")" if shared_words else ""), "owner": "a curator", "open": tab},
        ],
        "procedures": [
            {"words": "A code is four letters; the subject map decides a discipline and TOP corroborates it"},
            {"words": "A re-key goes through the alias chain and lands in one cron window"},
        ],
        "machine": {"what": "the daily sync of the picks into the seed", "at": seed.get("_synced_at"), "every_hours": 24},
        "facts": {"disciplines": len(D), "confirmed": len(confirmed), "person": len(confirmed) - cohort, "cohort": cohort,
                  "modal": len(modal), "shared": sorted(shared)},
        "sources": ["kb/discipline_canonical_subj4.json"],
    }


# ── the frame ─────────────────────────────────────────────────────────────────────────────
ROWS = [
    ("requirements", "Program Requirements", "#program-requirements", row_requirements),
    ("exhibit", "Common Exhibit Reference", "#credential-reference", row_exhibit),
    ("course", "Common Course Reference", "#unified-courses", row_course),
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
