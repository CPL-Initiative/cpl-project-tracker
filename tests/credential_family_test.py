"""A credential family is a field, never a fold (Sam, 2026-11-11, in session; cpl_memory
sam-bundle-family-is-a-field-2026-11-11).

Each ASE bundle stays its own canonical title and carries the family "ASE Certificate Bundles"; his 31 saved
folds are read as family tags. Guards:
  1. kb/test_mix.py reads a bundle's tests; an "or" and a non-ASE part stay as written;
  2. kb/_family_tag_plan.py converts the 25 bundle titles and holds the six for Sam, untouched;
  3. its plan.sql, run on a fixture table with kb_curation's real columns (reviewer_label generated, as the
     2026-11-09 migration made it), tags each bundle and removes its fold rows; a title whose rows changed since the
     read is skipped whole (no half-converted title) and listed; rollback.sql restores the table exactly, never
     names a generated column, and skips whole a title a person has saved on since;
  4. after the plan no unified_title_override is left for a bundle, so no fold runs and every title, and every
     adoption read by title, stays as it was;
  5. the nightly sync carries the family onto kb/credentials.json and takes it off again after a rollback;
  6. kb/credential_aliases.py gives a member its tests as aliases, so A4 finds both A4 bundles;
  7. the field is mapped in kb/governance_surface_map.json;
  8. the members whose mix the parser cannot code fully (an "or", or a part no ASE code names, which joins "with")
     are one exception list for a person, and every member is proposed in the family's naming form
     ("ASE Certificate Bundles: A4 + A5") in the existing rename batch, two titles with one mix sharing one name.

Run from the repo root: python3 tests/credential_family_test.py
"""
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _apply_credential_review as acr  # noqa: E402
import _family_tag_plan as ftp  # noqa: E402
import credential_aliases  # noqa: E402
import test_mix  # noqa: E402

CHECKS = []


def check(name, cond):
    CHECKS.append((name, bool(cond)))


FAM = "ASE Certificate Bundles"
LEAD = "ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)"
SAVED = [LEAD, "Advanced Electrical and Electronic Systems", "ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical",
         "ASE A8 + L1 — Engine Performance and Advanced Engine Performance",
         "ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced", "ASE Bundle — A1, A6, A8, L1",
         "ASE Bundle — A2, A3, A6", "ASE Bundle — A4, A5", "ASE Bundle — A4, A5, A6", "ASE Bundle — A6 or T6 + L3",
         "ASE Bundle — A6, A8, L1", "ASE Bundle — L2, T8, SP/2 HD", "ASE Bundle — T2, T5, T7, T8 + MACS/609",
         "ASE Bundle — T2, T6, T8 + Snap-on 604", "ASE Bundle — T2, T8", "ASE Bundle — T3, T4, T5, T8",
         "ASE Bundle — T3, T8, SP/2 HD", "ASE Bundle — T4, T8, SP/2 HD", "ASE Bundle — T5, T8", "ASE Bundle — T5, T8, SP/2 HD",
         "ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD", "ASE Bundle — T6, T8 + Snap-on 604", "ASE Bundle — T7, T8 + MACS/609",
         "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair", "ASE Certification (any A1–A8)",
         "ASE G1 + ALI Lift It Right Bundle",
         "ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis", "ASE Master Automobile Technician",
         "ASE Master Automobile Technician (A1–A8 + L1)", "ASE Master Automobile Technician (A1–A8) or L3",
         "ASE Master Medium/Heavy Truck Technician (T1–T8)"]
HELD = {"Advanced Electrical and Electronic Systems", "ASE Certification (any A1–A8)", "ASE Master Automobile Technician",
        "ASE Master Automobile Technician (A1–A8 + L1)", "ASE Master Automobile Technician (A1–A8) or L3",
        "ASE Master Medium/Heavy Truck Technician (T1–T8)"}

# ── 1. the tests a title names ──────────────────────────────────────────
check("a bundle's tests read as codes", test_mix.from_title("ASE Bundle — A4, A5")["label"] == "A4, A5")
check("an 'or' stays as written", test_mix.components("ASE Bundle — A6 or T6 + L3")[-1] == "A6 or T6 + L3")
check("a non-ASE part stays as written", "T5, T8, SP/2 HD" in test_mix.components("ASE Bundle — T5, T8, SP/2 HD"))
check("each named test is an alias", test_mix.components("ASE Bundle — A4, A5, A6") == ["ASE A4", "ASE A5", "ASE A6"])

# ── 2. the plan ─────────────────────────────────────────────────────────
ROWS = []
for k, t in enumerate(SAVED):
    ts = "2026-11-11T15:26:%02d.%06d+00:00" % (54 + (k > 15), 1000 + k)
    base = {"course_id": ftp.PREFIX + t, "value": FAM, "reviewer_email": "slee@cccco.edu", "reviewed_at": ts,
            "validated_at": None, "validated_by": None, "reviewer_label": "a reviewer"}
    ROWS.append(dict(base, field="unified_title_override"))
    if t != LEAD:
        ROWS.append(dict(base, field="unified_title_merge_confirm"))
# A row from another field on a bundle stays out of the plan, whatever it holds.
ROWS.append({"course_id": ftp.PREFIX + "ASE Bundle — A4, A5", "field": "issuing_agency_override",
             "value": "National Institute for Automotive Service Excellence (ASE)", "reviewer_email": "map@rccd.edu",
             "reviewed_at": "2026-07-09T00:07:00+00:00", "validated_at": None, "validated_by": None,
             "reviewer_label": "a reviewer"})
fams = ftp.families()
check("the family is declared", FAM in fams and fams[FAM]["issuer"].endswith("(ASE)"))
p = ftp.plan(ROWS, fams)
conv = {it["title"] for it in p["convert"]}
check("25 bundle titles convert", len(conv) == 25 and LEAD in conv and "ASE Bundle — A4, A5" in conv)
check("the six titles Sam keeps or that are not bundles are held, untouched", {it["title"] for it in p["held"]} == HELD)
check("each converted title deletes only its own fold rows",
      all({r["field"] for r in it["rows"]} <= set(ftp.FOLD_FIELDS) for it in p["convert"]))

# ── 3. the SQL on a fixture table ───────────────────────────────────────
PG = re.compile(r"::timestamptz")


COLS = ("course_id", "field", "value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")


def table(rows):
    """kb_curation as it stands: reviewer_label is generated (2026-11-09_kb_curation_reviewer_label.sql), so an insert
    that names it fails here as it fails in Postgres."""
    db = sqlite3.connect(":memory:")
    db.execute("attach ':memory:' as public")
    db.execute("create table public.kb_curation (course_id text not null, field text not null, value text, "
               "reviewer_email text not null, "
               "reviewed_at text not null default (strftime('%Y-%m-%dT%H:%M:%f+00:00','now')), "
               "validated_at text, validated_by text, "
               "reviewer_label text generated always as (case when reviewer_email is null then null "
               "when reviewer_email like '%@bot' then reviewer_email else 'a reviewer' end) stored, "
               "primary key (course_id, field))")
    for r in rows:
        db.execute("insert into public.kb_curation (%s) values (%s)" % (", ".join(COLS), ", ".join("?" * len(COLS))),
                   tuple(r.get(c) for c in COLS))
    return db


def dump(db):
    return sorted(db.execute("select course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by, "
                             "reviewer_label from public.kb_curation"))


def run(db, sql):
    """Runs the generated SQL with only Postgres's cast syntax removed."""
    db.executescript(PG.sub("", sql))


def tagged_in(rows):
    return {c[len(ftp.PREFIX):] for c, f, v, who, *_ in rows if f == "credential_family" and v == FAM and who == ftp.CREDENTIAL_FAMILY_COHORT}


def folds_in(rows):
    return {(c[len(ftp.PREFIX):], f) for c, f, *_ in rows if f in ftp.FOLD_FIELDS}


sql_plan, sql_back = ftp.plan_sql(p), ftp.rollback_sql(p)
check("rollback.sql never names a generated column", "reviewer_label" not in sql_back and "reviewer_label" not in sql_plan)

T28, A45, T58 = "ASE Bundle — T2, T8", "ASE Bundle — A4, A5", "ASE Bundle — T5, T8"
live = [dict(r) for r in ROWS]
for r in live:
    # Sam re-saves one bundle's override after the read, and another bundle's merge confirm.
    if r["course_id"] == ftp.PREFIX + T28 and r["field"] == "unified_title_override":
        r["reviewed_at"] = "2026-11-11T18:00:00+00:00"
    if r["course_id"] == ftp.PREFIX + A45 and r["field"] == "unified_title_merge_confirm":
        r["reviewed_at"] = "2026-11-11T18:01:00+00:00"
# A third bundle already holds a credential_family row a person set.
live.append({"course_id": ftp.PREFIX + T58, "field": "credential_family", "value": FAM, "reviewer_email": "slee@cccco.edu",
             "reviewed_at": "2026-11-11T18:02:00+00:00", "validated_at": None, "validated_by": None})
db = table(live)
start = dump(db)
run(db, sql_plan)
after = dump(db)
tagged, left = tagged_in(after), folds_in(after)
moved = {T28, A45, T58}
check("plan.sql tags each bundle under the cohort, but no title whose rows changed since the read", tagged == conv - moved)
check("…and removes the fold rows of every tagged bundle", not any(t in tagged for t, _ in left))
check("a title whose override changed keeps both its rows: its merge confirm is not deleted alone",
      {(T28, "unified_title_override"), (T28, "unified_title_merge_confirm")} <= left)
check("a title whose merge confirm changed keeps both its rows and gains no family",
      {(A45, "unified_title_override"), (A45, "unified_title_merge_confirm")} <= left and A45 not in tagged)
check("a title that already holds a family row keeps its fold rows", {(T58, "unified_title_override"), (T58, "unified_title_merge_confirm")} <= left)
check("the held titles keep both their rows", all((t, "unified_title_override") in left for t in HELD)
      and all((t, "unified_title_merge_confirm") in left for t in HELD))
check("another field's row on a bundle is untouched", any(f == "issuing_agency_override" for c, f, *_ in after))
skipped = sorted(db.execute("select count(*) from sqlite_temp_master where name = ?", (ftp.SKIP,)))
check("the plan drops its skip list when done", skipped == [(0,)])
# The skip list the read-back names: run the plan's statements up to its read-back on a fresh copy.
db2 = table(live)
body = PG.sub("", sql_plan).split("\n-- Read back")[0].replace("begin;", "")
db2.executescript(body)
listed = {c[len(ftp.PREFIX):] for c, in db2.execute("select course_id from %s" % ftp.SKIP)}
check("the skipped titles are listed, and only they", listed == moved)
run(db, sql_back)
check("rollback.sql restores the table exactly, on the table with the generated column", dump(db) == start)

# A person saves on a converted title after the plan: the rollback leaves that title whole and restores the rest.
db = table(ROWS)
start = dump(db)
run(db, sql_plan)
db.execute("insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at) values (?,?,?,?,?)",
           (ftp.PREFIX + A45, "unified_title_override", "ASE Certificate Bundles: A4 + A5", "slee@cccco.edu", "2026-11-12T00:00:00+00:00"))
run(db, sql_back)
end = dump(db)
check("rollback skips whole a title saved on since: it keeps the person's row and its family row",
      (A45, "unified_title_override") in folds_in(end) and (A45, "unified_title_merge_confirm") not in folds_in(end)
      and A45 in tagged_in(end))
check("…and restores every other title exactly", [r for r in end if not r[0].endswith(A45)] == [r for r in start if not r[0].endswith(A45)])

# ── 4. no fold, so no title moves ───────────────────────────────────────
db = table(ROWS)
run(db, ftp.plan_sql(p))
overrides = {}
for c, f, v, who, ts, *_ in dump(db):
    overrides.setdefault(c[len(ftp.PREFIX):], {})[f] = v
check("after the plan no bundle carries a rename override, so the dry run folds none and every title stays",
      not any("unified_title_override" in overrides.get(t, {}) for t in conv))

# ── 5. the nightly sync ─────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(tmp, "kb", "reference"))
    shutil.copy(ftp.FAMILIES, os.path.join(tmp, "kb", "reference", "credential_families.json"))
    cr = {t: [{"issuing_agency": "National Institute for Automotive Service Excellence (ASE)"}] for t in SAVED}
    cr["Engine Repair (ASE A1)"] = [{"issuing_agency": "ASE"}]
    crp = os.path.join(tmp, "kb", "credentials.json")
    json.dump(cr, open(crp, "w", encoding="utf-8"))
    famp = os.path.join(tmp, "kb", "reference", "credential_families.json")
    put, cleared, und = acr.promote_families(overrides, crp, famp)
    got = json.load(open(crp, encoding="utf-8"))
    check("the sync carries the family onto every record of each tagged title", set(put) == conv
          and all(r.get("family") == FAM for t in conv for r in got[t]))
    check("…and onto no other title", all("family" not in r for t in set(got) - conv for r in got[t]))
    check("the sync field is read, and stamps no review", "credential_family" in acr.FIELDS and "credential_family" in acr.DECISION_ONLY)

    # ── 6. the aliases ──────────────────────────────────────────────────
    members = credential_aliases.family_members(tmp)
    a4 = sorted(t for t, m in members.items() if "ASE A4" in m["aliases"])
    check("a search alias ASE A4 finds both the A4+A5 and the A4+A5+A6 bundle", a4 == ["ASE Bundle — A4, A5", "ASE Bundle — A4, A5, A6"])
    check("a member keeps its 'or' as written", "A6 or T6 + L3" in members["ASE Bundle — A6 or T6 + L3"]["aliases"])

    acr.promote_families({}, crp, famp)
    check("after a rollback of the rows the sync takes the family off again",
          all("family" not in r for recs in json.load(open(crp, encoding="utf-8")).values() for r in recs))
    _, _, und = acr.promote_families({"ASE Bundle — A4, A5": {"credential_family": "No Such Family"}}, crp, famp)
    check("a family no file declares is never carried", und == [("ASE Bundle — A4, A5", "No Such Family")])
finally:
    shutil.rmtree(tmp)

# ── 7. governance ──────────────────────────────────────────────────────
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
check("the field is mapped in the governance surface map", "field:kb_curation.credential_family" in gov.get("mapped", {}))

# ── 8. the exception list and the proposed family titles ───────────────
import _build_exhibits_related as rel  # noqa: E402

EXC = {t for t in conv if test_mix.exception(t)}
check("the members the parser cannot code fully are the twelve with an 'or' or a non-ASE part",
      len(EXC) == 12 and {"ASE Bundle — A6 or T6 + L3", "ASE Bundle — T7, T8 + MACS/609", "ASE G1 + ALI Lift It Right Bundle",
                          "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair"} <= EXC
      and "ASE Bundle — A4, A5" not in EXC)
check("a non-ASE part joins with 'with', an 'or' stays inside its part",
      test_mix.exception("ASE Bundle — T7, T8 + MACS/609") == {"title": "ASE Bundle — T7, T8 + MACS/609", "mix": "T7, T8 + MACS/609",
                                                              "tests": ["T7", "T8"], "with": ["MACS/609"]}
      and test_mix.parts("ASE Bundle — A6 or T6 + L3") == {"tests": ["A6 or T6", "L3"], "with": []})
check("a member's proposed title is the family plus its tests",
      test_mix.family_title(FAM, "ASE Bundle — A4, A5") == "ASE Certificate Bundles: A4 + A5"
      and test_mix.family_title(FAM, "ASE G1 + ALI Lift It Right Bundle") == "ASE Certificate Bundles: G1 with ALI Lift It Right"
      and test_mix.family_title(FAM, "ASE Master Automobile Technician") is None)

_lj, _fm = rel.load_json, rel.credential_aliases.family_members
try:
    def lj(root, path, default=None):
        got = _lj(root, path, default)
        if path == "kb/credential_review_overlay.json" and got:
            # As after the plan runs: the converted titles hold no fold rows.
            got = dict(got, overrides={t: v for t, v in (got.get("overrides") or {}).items() if t not in conv})
        return got
    rel.load_json = lj
    rel.credential_aliases.family_members = lambda root=".": {t: {"family": FAM, "aliases": test_mix.components(t)} for t in conv}
    built = rel.build(ROOT)
finally:
    rel.load_json, rel.credential_aliases.family_members = _lj, _fm
famrows = [r for b in built["batches"] for r in b["rows"] if r.get("kind") == "family"]
present = {t for t in conv if any(x[0] == t for x in built["titles"])}
check("the rename batch proposes every member in the reference in the family form, and no held title",
      {r["current"] for r in famrows} == present and len(present) >= 20
      and all(r["proposed"] == test_mix.family_title(FAM, r["current"]) for r in famrows)
      and not any(r["current"] in HELD for r in famrows))
same = [r for r in famrows if r["proposed"] == "ASE Certificate Bundles: A2 + A3 + A6"]
check("two titles with one mix share one proposed title: one leads, the other folds into it",
      len(same) != 2 or sorted(bool(r["merge"]) for r in same) == [False, True])
exl = built["families"][FAM]["exceptions"]
check("the family's exception list holds the members to code by hand, each with its tests and its 'with' parts",
      {e["title"] for e in exl} == EXC & present and all("tests" in e and "with" in e for e in exl))

failed = [n for n, ok in CHECKS if not ok]
for n, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n)
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
