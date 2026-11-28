#!/usr/bin/env python3
"""kb/_alignment_remint_apply.py (S749; r-full-remint-for-new-joins-sam-2026-11-28, r-remint-dryrun-defaults-sam-2026-11-28).

Part 1 runs the apply on fixtures in a temp folder, in the committed files' own formats. Part 2 reads the committed
land. Each check goes red if its guard is removed:
  - every retired M-ID resolves through kb/alias_chain.py resolve to its planned new id;
  - no M-ID sits under two codes (no old id left beside its new one);
  - no new code collides with an M-ID prefix another discipline holds (AERN starts with none);
  - no person-curated row changes except the five on Sam's OK list (P4 refuses a sixth, and restores every byte);
  - the rollback receipt restores the files the apply wrote byte for byte;
  - the kb_curation migration touches only @bot rows, and aborts on a person's row.

Run from repo root: python3 tests/alignment_remint_apply_test.py
"""
import contextlib
import csv
import io
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _alignment_remint_apply as ap  # noqa: E402
import _alignment_remint_dryrun as ar  # noqa: E402
import _eths_remint as er  # noqa: E402
import alias_chain as ac  # noqa: E402
from _flags import is_person  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    er.dump(path, obj)


def row(cid, disc=None, title="T", subject=None, college="A College"):
    r = {"course_id": cid, "id_system": "M-ID", "common_title": title, "subject_4letter": cid.split(" ")[0],
         "subject": subject or cid.split(" ")[0], "college": college}
    if disc is not None:
        r["discipline"] = disc
    return r


BOT = {"reviewed_by": "csr@bot", "reviewed_at": "2026-11-01T00:00:00+00:00"}
SAM = {"reviewed_by": "map@rccd.edu", "reviewed_at": "2026-05-23T17:42:53+00:00"}


def fixture(tmp, extra_filings=(), person_pointer=False):
    """A temp repo: the five identity files, the seed, aliases, the S749 receipt, the minted list, one picks file, the
    filings. -> (paths, plan)."""
    kb = os.path.join(tmp, "kb")
    courses = {k: row(k, d, t, s) for k, d, t, s in [
        ("NUTR M1001", "Dietetics/Nutritional Science", "Nutrition", "NUTR"),
        ("NUTR M1002", "Dietetics/Nutritional Science", "Diet", "NF"),
        ("FDNT M1001", "Nutritional Science/Dietetics", "Basic Nutrition", "FDNT"),
        ("AERO M1001", None, "AS100", "AEROST"),
        ("PUBR M1001", None, "Principles of Public Relations", "PUB REL"),
        ("TOUR M1001", None, "Travel", "TOUR"),
        ("FLTA M1001", "Foreign Languages", "Filipino 1", "FIL"),
        ("AVIA M1001", "Aviation", "Flight", "AVIA")]}
    singles = {"PHTC M10AB": row("PHTC M10AB", None, "Studio Lighting", "PHTC", "Moorpark College"),
               "NUTR M10AA": row("NUTR M10AA", "Dietetics/Nutritional Science", "Sports Nutrition", "NUTR", "X")}
    dump(os.path.join(kb, "coci_minted_courses.json"), {"_status": "fixture", "count": len(courses), "courses": courses})
    dump(os.path.join(kb, "coci_minted_singletons.json"), {"_status": "fixture", "count": len(singles), "courses": singles})
    dump(os.path.join(kb, "coci_minted_memberships.json"), {"_status": "fixture", "memberships": {
        "NUTR M1001": [{"college": "A College", "subject": "NUTR"}], "FDNT M1001": [{"college": "B", "subject": "FDNT"}],
        "AERO M1001": [{"college": "Fresno City College", "subject": "AEROST"}]}})
    dump(os.path.join(kb, "coci_articulations.json"), {"_status": "fixture", "articulations": [
        {"course_id": "NUTR M1001", "college": "A"}, {"course_id": "AVIA M1001", "college": "B"}],
        "identities": {"NUTR M1002": {"n": 1}, "AVIA M1001": {"n": 2}}})
    cur = {"AERO M1001": {"unified_title": "AS100 Heritage", "reviewed_by": "automerge-titlelane-v1@bot", "reviewed_at": "x"},
           "NUTR M10AA": {"merge_into": "NUTR M1001", "reviewed_by": "automerge-titlelane-v1@bot", "reviewed_at": "x"},
           "FDNT M1001": {"honors_of": "NUTR M1002"},
           "AVIA M1001": {"unified_title": "Flight", "reviewed_by": "slee@cccco.edu", "reviewed_at": "y"}}
    if person_pointer:
        cur["AVIA M1001"]["merge_into"] = "TOUR M1001"
    dump(os.path.join(kb, "coci_curation.json"), {"_about": "fixture", "count": len(cur), "curations": dict(sorted(cur.items()))})
    seed = {"Aeronautics": {"canonical_subj4": "AERO", "source": "assigned", "basis": "college", "basis_words": "AERO", **BOT},
            "Aviation": {"canonical_subj4": "AVIA", **BOT},
            "Dietetics/Nutritional Science": {"canonical_subj4": "NUTR", "source": "curator_override", **SAM},
            "Nutritional Science/Dietetics": {"canonical_subj4": "FDNT", "source": "curator_override", **SAM},
            "Military Studies": {"canonical_subj4": "MILS", **BOT},
            "Photography": {"canonical_subj4": "PHOT", **BOT},
            "Photographic Technology/ Commercial Photography": {"canonical_subj4": "CPHT", **BOT},
            "Public Relations": {"canonical_subj4": "PREL", **BOT},
            "Travel Services": {"canonical_subj4": "TRVL", **BOT},
            "Flight Attendant Training": {"canonical_subj4": "FLTR", "reviewed_by": "Sam (in session, S717)"},
            "Foreign Languages": {"canonical_subj4": "FLNG", "umbrella_codes": ["FLTA"], **BOT},
            "Asian American Studies": {"canonical_subj4": "ASAM", **BOT},
            "African American Studies": {"canonical_subj4": "AFAM", **BOT}}
    for d, c in ar.SETTLED_CODES.items():
        seed[d] = {"canonical_subj4": c, "reviewed_by": "Sam (in session, S705)"}
    dump(os.path.join(kb, "discipline_canonical_subj4.json"),
         {"_about": "fixture", "_counts": {"total_disciplines": len(seed)}, "disciplines": seed})
    dump(os.path.join(kb, "discipline_aliases.json"), {"_about": "fixture", "aliases": {"Kinesiology": ["Physical Education"], "Communication Studies": ["Speech Communication"]}})
    receipt = {"changed": [{"discipline": "Photographic Technology/ Commercial Photography", "from": "PHTC", "to": "CPHT"}],
               "held": [{"discipline": "Aeronautics", "from": "AERO", "to": "AERN"},
                        {"discipline": "Flight Attendant Training", "from": "FLTR", "to": "FLTA"},
                        {"discipline": "Home Economics: Noncredit", "from": "HMEN", "to": "HECN"}], "added": []}
    dump(os.path.join(kb, "receipts", "minted_codes_s749.json"), receipt)
    os.makedirs(os.path.join(kb, "subject_title_hunt"), exist_ok=True)
    with open(os.path.join(kb, "subject_title_hunt", "minted_codes.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["mq_discipline", "proposed_code", "basis", "section", "x"])
        for d, c in (("Aeronautics", "AERN"), ("Flight Attendant Training", "FLTA"), ("Public Relations", "PUBR"),
                     ("Travel Services", "TOUR"), ("Home Economics: Noncredit", "HECN")):
            w.writerow([d, c, d + " MQ.", "s", "yes"])
    picks = ("college,local_subject_code,band,common_code,confidence,found_by,basis\n"
             "Allan Hancock College,SPACE,credit,AERN,100,Sam Lee,Sam ruling (Space Technology)\n"
             "Fresno City College,AEROST,credit,AERO,97,COBI,M-ID AERO\n"
             "Moorpark College,PHTC,credit,PHOT,90,COBI,\"Photography, the local code\"\n")
    with open(os.path.join(kb, "subject_title_hunt", "20261128_common_picks_slate2.csv"), "w", encoding="utf-8") as f:
        f.write(picks)
    filings = [{"key": "_SUBJ_DISC::NUTR", "code": "NUTR", "discipline": "Dietetics/Nutritional Science",
                "who": "a reviewer", "at": "2026-11-24T12:46:39."}, *extra_filings]
    dump(os.path.join(kb, "status", "subject_decisions.json"), {"statewide": filings})
    p = ap.paths(tmp)
    docs = er.load_docs(p["kb"])
    with open(p["minted_csv"], encoding="utf-8") as f:
        minted = list(csv.DictReader(f))
    plan = ar.compute_plan(docs["courses"]["courses"], docs["singletons"]["courses"], docs["curation"]["curations"],
                           docs["memberships"]["memberships"], seed, receipt, ap.load(p["aliases"]),
                           ap.load(p["decisions"]), ar.load_picks(tmp), {}, minted=minted)
    dump(p["plan"], ar.plan_doc(plan))
    with open(p["forwarding"], "w", encoding="utf-8") as f:
        f.write(ar.render_forwarding(plan))
    return p, plan


def snapshot(root):
    out = {}
    for d, _, files in os.walk(root):
        for n in files:
            path = os.path.join(d, n)
            with open(path, "rb") as f:
                out[os.path.relpath(path, root)] = f.read()
    return out


def quiet(fn, *a, **kw):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*a, **kw)


def refused(fn, *a, **kw):
    try:
        quiet(fn, *a, **kw)
    except SystemExit as e:
        return str(e)
    return None


# ── Part 1: fixtures ─────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp(prefix="s749_apply_")
try:
    p, plan = fixture(tmp)
    check(all(v["pass"] for v in plan["validation"].values()), "the fixture plan passes every dry-run gate")
    before = snapshot(tmp)
    receipt = quiet(ap.apply, p, at="2026-11-28T20:00:00+00:00", plan=plan)
    alias = {k: v["new_id"] for k, v in receipt["aliases"].items()}
    check(alias == plan["alias"] and len(alias) == 7, "the receipt is the plan's 7 moves")
    check(all(ac.resolve(o, [ap.load(p["receipt"])["aliases"]])[0] == n for o, n in plan["alias"].items()),
          "every retired M-ID resolves through alias_chain.resolve to its planned new id")
    docs = er.load_docs(p["kb"])
    ids = list(docs["courses"]["courses"]) + list(docs["singletons"]["courses"])
    check(not set(alias) & set(ids) and all(ids.count(n) == 1 for n in alias.values()),
          "no M-ID under two codes: every old id is gone and every new id appears once")
    check(not (set(alias) & (set(docs["memberships"]["memberships"]) | set(docs["curation"]["curations"]))),
          "no membership or overlay key left on an old id")
    check(docs["curation"]["curations"]["FDNT M1001"]["honors_of"] == alias["NUTR M1002"]
          and docs["curation"]["curations"][alias["NUTR M10AA"]]["merge_into"] == alias["NUTR M1001"],
          "pointers (honors_of, merge_into) follow their target")
    check(list(docs["curation"]["curations"]) == sorted(docs["curation"]["curations"]),
          "the overlay stays in key order, as kb/_apply_curation.py writes it")
    check(list(docs["courses"]["courses"])[:2] == [alias["NUTR M1001"], alias["NUTR M1002"]],
          "the catalog keeps its order: each id is re-keyed where it stands")
    check(all(docs["courses"]["courses"].get(n, docs["singletons"]["courses"].get(n, {})).get(ap.STAMP) == o
              for o, n in alias.items()), "each moved record carries its old id in _alignment_remint_from")
    seed = ap.load(p["seed"])["disciplines"]
    check("Dietetics/Nutritional Science" not in seed and
          "Dietetics/Nutritional Science" in ap.load(p["aliases"])["aliases"]["Nutritional Science/Dietetics"],
          "the NUTR fold: Dietetics/Nutritional Science leaves the seed and becomes an alias")
    check(seed["Aeronautics"]["canonical_subj4"] == "AERN" and seed["Aeronautics"]["formerly"][0]["code"] == "AERO",
          "Aeronautics takes AERN through the minted-code writer, and keeps AERO as formerly")
    check(seed["Public Relations"]["canonical_subj4"] == "PREL" and seed["Travel Services"]["canonical_subj4"] == "TRVL"
          and seed["Flight Attendant Training"]["canonical_subj4"] == "FLTR",
          "PREL, TRVL and FLTR stay once PUBR and TOUR prefix no M-ID (the writer's RULED codes)")
    codes = [e["canonical_subj4"] for e in seed.values()]
    pref = {i.split(" ")[0] for i in ids}
    check(len(codes) == len(set(codes)) and "AERN" not in pref,
          "no new code collides: each common code is one discipline's, and AERN prefixes no M-ID")
    owner = {e["canonical_subj4"]: d for d, e in seed.items()}
    moved_on = {(n.split(" ")[0], (docs["courses"]["courses"].get(n) or docs["singletons"]["courses"].get(n))["discipline"])
                for n in alias.values()}
    check(all(owner.get(c) == d for c, d in moved_on), "each moved id lands on its own discipline's code")
    with open(os.path.join(tmp, ap.PICK_EDITS[0]["file"]), encoding="utf-8") as f:
        lines = f.read().splitlines()
    check(lines[2].startswith("Fresno City College,AEROST,credit,MILS,97,COBI,") and lines[3].startswith("Moorpark")
          and lines[1].startswith("Allan Hancock"), "the AEROST pick moves to MILS on its own line; the file keeps its order")
    check(receipt["_person_rows_changed"] == ["filing:_SUBJ_DISC::NUTR", "seed:Dietetics/Nutritional Science"]
          and set(receipt["_person_rows_changed"]) <= set(ap.PERSON_OK),
          "person-curated rows: only the OK list changes (the fold's override and its filing)")
    with open(os.path.join(p["migrations"], ap.MIGRATION + "_apply.sql"), encoding="utf-8") as f:
        sql = f.read()
    upd = sql[sql.index("u as (update"):sql.index("returning")]
    check("k.reviewer_email like '%@bot'" in upd and "g.person_n = 0" in upd and "g.unplanned_n = 0" in upd
          and "g.landing_n = 0" in upd, "the migration's UPDATE touches only @bot rows, and only when no person's row "
                                        "or unplanned row touches a moving id")
    rows = ap.load(p["rows"])["rows"]
    check(len(rows) == 3 and not any(is_person(r["by"]) for r in rows)
          and {(r["course_id"], r["field"]) for r in rows} == {("AERO M1001", "unified_title"), ("NUTR M10AA", "merge_into"),
                                                               ("FDNT M1001", "honors_of")},
          "the migration moves the three bot rows on or at a moving id, and no person's row")
    check(f"when s.n = {len(rows)}" in sql and "::int::text::json" in sql, "the migration aborts unless it matches the plan's rows")
    check(refused(ap.apply, p, plan=plan) and "P0" in refused(ap.apply, p, plan=plan), "a second apply is refused (P0)")
    after = snapshot(tmp)
    quiet(ap.rollback, p)
    back = snapshot(tmp)
    written = [k for k in before if before[k] != after.get(k)]
    check(len(written) >= 8 and all(back.get(k) == before[k] for k in before),
          f"the rollback receipt restores all {len(written)} files the apply wrote, byte for byte "
          f"{[k for k in before if back.get(k) != before[k]]}")
    check(not os.path.exists(p["aern_receipt"]), "the rollback removes the AERN receipt the apply wrote")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# P4: a person-curated row outside the OK list refuses the apply, and the refusal leaves every byte as it was.
tmp = tempfile.mkdtemp(prefix="s749_apply_p4_")
try:
    p, plan = fixture(tmp, extra_filings=[{"key": "_SUBJ_DISC::DIET", "code": "DIET", "who": "a reviewer",
                                           "discipline": "Dietetics/Nutritional Science", "at": "2026-11-25"}])
    before = snapshot(tmp)
    why = refused(ap.apply, p, plan=plan)
    check(bool(why) and "P4" in why and "_SUBJ_DISC::DIET" in why, "P4 refuses a person-curated row not on Sam's OK list")
    check(snapshot(tmp) == before, "a refused apply leaves every file byte for byte as it was")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# A person's pointer at a moving id holds that id (the dry run's V6), and the apply refuses a held move (P1).
tmp = tempfile.mkdtemp(prefix="s749_apply_hold_")
try:
    p, plan = fixture(tmp, person_pointer=True)
    check(plan["moves"]["TOUR M1001"]["status"] == "held_person" and "TOUR M1001" not in plan["alias"],
          "a person's merge_into at TOUR M1001 holds it")
    why = refused(ap.apply, p, plan=plan)
    check(bool(why) and "P1_every_move_answered" in why, "the apply refuses a plan with a held move")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# P1: a forwarding map that is not the plan refuses the apply.
tmp = tempfile.mkdtemp(prefix="s749_apply_p1_")
try:
    p, plan = fixture(tmp)
    with open(p["forwarding"], encoding="utf-8") as f:
        text = f.read()
    with open(p["forwarding"], "w", encoding="utf-8") as f:
        f.write(text.replace("MILS M1001", "MILS M1002"))
    check("P1_matches_the_dry_run" in (refused(ap.apply, p, plan=plan) or ""), "a forwarding map that differs from the plan is refused (P1)")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── Part 2: the committed land ──────────────────────────────────────────────
P = ap.paths()
if not os.path.exists(P["receipt"]):
    check(False, "the committed receipt kb/alignment_remint_out/2026-11-28/alias_map.json exists")
else:
    R = ap.load(P["receipt"])
    REL = os.path.relpath(P["receipt"], ROOT).replace(os.sep, "/")
    check(bool(R.get("_applied_at")) and REL in ac.ALIAS_MAPS, "the receipt is applied and registered in ALIAS_MAPS")
    after_maps = ac.load_maps(ac.ALIAS_MAPS[ac.ALIAS_MAPS.index(REL) + 1:]) if REL in ac.ALIAS_MAPS else []
    from_here = ac.load_maps(ac.ALIAS_MAPS[ac.ALIAS_MAPS.index(REL):]) if REL in ac.ALIAS_MAPS else []
    alias = {k: v["new_id"] for k, v in R["aliases"].items()}
    with open(P["forwarding"], encoding="utf-8") as f:
        fwd = {r["old_mid"]: r["new_mid"] for r in csv.DictReader(f)}
    check(len(alias) == 346 and fwd == alias, "kb/mid_forwarding.csv is the receipt: 346 old M-IDs, one new id each")
    check(all(ac.resolve(o, from_here)[0] == ac.resolve(n, after_maps)[0] for o, n in alias.items()),
          "every retired M-ID resolves through alias_chain.resolve to its planned new id (and on through later maps)")
    by = {}
    for o, n in alias.items():
        by.setdefault((o.split(" ")[0], n.split(" ")[0]), 0)
        by[(o.split(" ")[0], n.split(" ")[0])] += 1
    check(by == {("NUTR", "FDNT"): 320, ("AERO", "MILS"): 9, ("PHTC", "PHOT"): 4, ("PUBR", "PREL"): 1, ("TOUR", "TRVL"): 12},
          "the totals Sam okayed: NUTR->FDNT 320, AERO->MILS 9, PHTC->PHOT 4, PUBR->PREL 1, TOUR->TRVL 12")
    docs = er.load_docs()
    live = set(docs["courses"]["courses"]) | set(docs["singletons"]["courses"])
    check(not set(alias) & live and not set(alias) & set(docs["curation"]["curations"]),
          "no M-ID under two codes: no old id is live, in the catalog, the stand-alones or the overlay")
    stray = [k for k in live if k.split(" ")[0] in ("NUTR", "AERO", "PHTC", "PUBR", "TOUR")]
    check(not stray, f"no live M-ID starts with a retired code ({stray[:3]})")
    seed = ap.load(P["seed"])["disciplines"]
    check((seed.get("Aeronautics") or {}).get("canonical_subj4") == "AERN" and "Dietetics/Nutritional Science" not in seed,
          "the seed: Aeronautics holds AERN; Dietetics/Nutritional Science is folded")
    aern = [k for k in live if k.startswith("AERN ")]
    check(all((docs["courses"]["courses"].get(k) or docs["singletons"]["courses"].get(k)).get("discipline") == "Aeronautics"
              for k in aern), "no new code collides: an AERN M-ID, if any, is Aeronautics'")
    for k in ("FLTR", "PREL", "TRVL"):
        check(sum(1 for e in seed.values() if e.get("canonical_subj4") == k) == 1, f"{k} stays one discipline's code")
    check(set(R["_person_rows_changed"]) <= set(ap.PERSON_OK) and all(R["_gates"].values()),
          "the land changed no person-curated row outside Sam's OK list, and passed every gate")
    rows = ap.load(P["rows"])["rows"]
    check(len(rows) == R["_kb_curation_rows"] and not any(is_person(r["by"]) for r in rows),
          f"the migration moves {len(rows)} rows, none a person's")
    sql = ap.migration_sql(alias, rows, REL, os.path.relpath(P["rows"], ROOT).replace(os.sep, "/"))
    for kind in ("preread", "apply", "rollback"):
        path = os.path.join(P["migrations"], f"{ap.MIGRATION}_{kind}.sql")
        with open(path, encoding="utf-8") as f:
            check(f.read() == sql[kind], f"the committed {kind} SQL is the one the receipt builds")
    with open(os.path.join(P["migrations"], ".apply"), encoding="utf-8") as f:
        check(ap.MIGRATION not in f.read(), "the migration is not queued in kb/migrations/.apply (the conductor applies it)")
    check(not re.search(r"\bdelete\b|\binsert\b", sql["apply"], re.I), "the migration only updates: no insert, no delete")
    # The fold's filings: a reviewer filed NF, NUTR, NUTRI and NUTRTN under Dietetics/Nutritional Science (2026-11-24).
    # The fold took that discipline out of the seed, so kb/subject_decisions.py follows kb/discipline_aliases.json to
    # FDNT; without that step all four are refused. And every Nov 28 pick applies, the Space Technology pick (AERN) too.
    import subject_decisions as S  # noqa: E402
    d = S.load()
    check({c: (d.statewide.get(c) or {}).get("common_code") for c in ("NF", "NUTR", "NUTRI", "NUTRTN")}
          == {c: "FDNT" for c in ("NF", "NUTR", "NUTRI", "NUTRTN")},
          "the four filings under Dietetics/Nutritional Science follow the fold to FDNT")
    csv_refused = [x for x in d.refused if ".csv:" in str(x["key"])]
    check(len(d.picks) >= 1663 and not csv_refused, f"all 1,663 Nov 28 picks apply, none refused ({len(d.picks)}, {csv_refused[:2]})")

print(f"\n{len(fails)} failure(s)" if fails else "\nall passed")
sys.exit(1 if fails else 0)
