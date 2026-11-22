#!/usr/bin/env python3
"""A person's saved subject decisions honored by the daily build (#3655).

kb/_sync_subject_decisions.py commits the saves (kb/status/subject_decisions.json); kb/subject_decisions.py reads
them once for kb/_build_local_subject_titles.py, kb/_held_subject_codes.py and the pile mint dry run
(kb/_pile_mint_dryrun.py route p). Ruling: r-subject-save-path-kb-curation-sam-2026-11-22, a person's save wins over the
catalog, the subject map and any recommendation.

WHAT THIS GUARDS (each a way a person's save would be lost, misapplied, or leak):
  (1) a decision beats the subject map and the catalog for its own college and band, and touches no other college's
      same code;
  (2) a credit decision leaves the code's noncredit courses alone (the mint), and a noncredit row takes none;
  (3) a statewide _SUBJ_DISC:: filing loses to a college-keyed decision and beats the subject map;
  (4) a failed, short or empty sync read leaves the committed file as it was;
  (5) a decision whose common code the canonical file does not hold is refused and listed, never applied;
  (6) the held list's released count equals the held courses under decided codes, ATH and PEX at Cerritos the worked
      example; the committed files agree with the decisions file;
  (7) no email appears in any committed file the sync or the builders write;
  (8) the daily build syncs before the titles, takes no secret, warns and restores on failure, and the workflow
      stages the file.

Run from repo root: python3 tests/subject_decisions_honored_test.py
"""
import copy
import gzip
import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, HERE)


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


sd = load("sd_h", "kb/subject_decisions.py")
lst = load("lst_h", "kb/_build_local_subject_titles.py")
sync = load("sync_h", "kb/_sync_subject_decisions.py")
hsc = load("hsc_h", "kb/_held_subject_codes.py")
import _pile_mint_dryrun as pm  # noqa: E402
import pile_mint_fixture as pmf  # noqa: E402

FAILS = []
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@(?!bot\b)[A-Za-z0-9-]+\.[A-Za-z]{2,}")


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


def gz(path, obj):
    with open(path, "wb") as f:
        f.write(gzip.compress(json.dumps(obj).encode("utf-8"), mtime=0))


def dec(key, common=None, title=None, who="a reviewer"):
    k = sd.parse_key(key)
    return {"key": key, "college": k[0], "code": k[1], "band": k[2], "local_title": title, "common_code": common,
            "who": who, "at": "2026-11-22T05:00:00Z"}


def fixture(root, decisions, statewide):
    cat = os.path.join(root, "kb", "hand_filed_catalogs", "courses")
    os.makedirs(cat)
    os.makedirs(os.path.join(root, "kb", "reference"))
    os.makedirs(os.path.join(root, "kb", "status"))
    json.dump({"colleges": [
        {"slug": "cerritos", "file": "cerritos.json.gz", "college": "Cerritos College"},
        {"slug": "other", "file": "other.json.gz", "college": "Other College"}]}, open(os.path.join(cat, "index.json"), "w"))
    gz(os.path.join(cat, "cerritos.json.gz"), {"rows": [
        {"subject": "ATH", "subject_name": "Athletics", "code": "ATH 1", "title": "Varsity"},
        {"subject": "PEX", "subject_name": "Physical Education", "code": "PEX 1", "title": "Yoga"},
        {"subject": "ENGL", "subject_name": "English", "code": "ENGL 1", "title": "Composition"},
        {"subject": "ZZZ", "subject_name": "Catalog Only", "code": "ZZZ 1", "title": "Only here"}]})
    gz(os.path.join(cat, "other.json.gz"), {"rows": [
        {"subject": "ATH", "subject_name": "Athletics", "code": "ATH 5", "title": "Track"},
        {"subject": "ENGL", "subject_name": "English", "code": "ENGL 9", "title": "Reading"}]})
    state = {"_built_at": "2026-11-22", "colleges": ["Cerritos College", "Other College"], "rows": [
        [0, "C1", "ATH", "1", "Varsity", 1, "C"], [0, "C2", "PEX", "1", "Yoga", 1, "C"], [0, "C3", "ENGL", "1", "Comp", 3, "C"],
        [0, "C4", "NCQ", "1", "Life Skills", 0, "N"],
        [1, "O1", "ATH", "5", "Track", 1, "C"], [1, "O2", "ENGL", "9", "Reading", 3, "C"]]}
    open(os.path.join(root, "coci_lookup_data.js"), "w").write("window.CPL_COCI_LOOKUP = " + json.dumps(state) + ";\n")
    json.dump({"map": {"ATH": "Physical Education", "ENGL": "English", "PEX": "Physical Education"}},
              open(os.path.join(root, "kb", "reference", "subject_discipline_map.json"), "w"))
    json.dump({"disciplines": {"English": {"canonical_subj4": "ENGL"}, "Kinesiology": {"canonical_subj4": "KINE"},
                               "Physical Education": {}, "Reading": {"canonical_subj4": "READ"}}},
              open(os.path.join(root, "kb", "discipline_canonical_subj4.json"), "w"))
    json.dump({"decisions": decisions, "statewide": statewide, "statewide_read": True},
              open(os.path.join(root, sd.STATUS), "w"))


# ── (1), (3), (5), (2 rows): the titles builder on a fixture ──────────────────
DECS = [dec("SUBJ:cerritos|ATH|credit", "KINE", who="Sam"), dec("SUBJ:cerritos|PEX|credit", "KINE", "Physical Education Activity"),
        dec("SUBJ:cerritos|ENGL|credit", "READ"), dec("SUBJ:cerritos|ZZZ|whole", "NOPE", "Refused Title"),
        dec("SUBJ:cerritos|NCQ|credit", "KINE"), dec("SUBJ:cerritos|ENGL|noncredit", "ENGL")]
STATE = [{"key": "_SUBJ_DISC::ENGL", "code": "ENGL", "discipline": "Kinesiology", "who": "a reviewer", "at": "2026-11-20"}]
root = tempfile.mkdtemp()
try:
    fixture(root, DECS, STATE)
    out = lst.build(root)
    cols = out["columns"]
    by = {c["slug"]: {r[0]: dict(zip(cols, r)) for r in c["rows"]} for c in out["colleges"]}
    Ce, O = by["cerritos"], by["other"]
    check("(1) ⭐ a decision beats the subject map: Cerritos ATH reads KINE from a person, the map's discipline replaced",
          Ce["ATH"]["common"] == "KINE" and Ce["ATH"]["discipline"] == "Kinesiology" and Ce["ATH"]["common_source"] == "person"
          and Ce["ATH"]["decision"]["key"] == "SUBJ:cerritos|ATH|credit" and Ce["ATH"]["decision"]["who"] == "Sam"
          and Ce["ATH"]["decision"]["was"]["discipline"] == "Physical Education")
    check("(1) ⭐ a decided title beats the catalog's heading, and the row says a person saved it",
          Ce["PEX"]["printed_name"] == "Physical Education Activity" and Ce["PEX"]["title_state"] == "person"
          and Ce["PEX"]["title_source"] == lst.PERSON_TITLE and Ce["PEX"]["decision"]["was"]["printed_name"] == "Physical Education")
    check("(1) ⭐ the same code at another college is untouched", O["ATH"]["common"] is None and O["ATH"]["discipline"] == "Physical Education"
          and O["ATH"]["decision"] is None and O["ATH"]["printed_name"] == "Athletics")
    check("(3) ⭐ a college's decision beats a statewide filing of the same code", Ce["ENGL"]["common"] == "READ"
          and Ce["ENGL"]["common_source"] == "person")
    check("(3) ⭐ a statewide filing beats the subject map at a college with no decision", O["ENGL"]["common"] == "KINE"
          and O["ENGL"]["common_source"] == "statewide_filing" and O["ENGL"]["decision"]["from"] == "local_subjects_list"
          and O["ENGL"]["printed_name"] == "English")
    check("(5) ⭐ a common code the canonical file does not hold is refused and listed, and nothing of it applied",
          Ce["ZZZ"]["common"] is None and Ce["ZZZ"]["printed_name"] == "Catalog Only" and Ce["ZZZ"]["decision"] is None
          and any(r["key"] == "SUBJ:cerritos|ZZZ|whole" and "NOPE" in r["why"] for r in out["decisions"]["refused"]))
    check("(5) a band other than credit and whole is refused and listed",
          any(r["key"] == "SUBJ:cerritos|ENGL|noncredit" for r in out["decisions"]["refused"]))
    check("(2) a noncredit-only row takes no credit decision; the decision is listed as not applied",
          Ce["NCQ"]["common"] is None and Ce["NCQ"]["decision"] is None
          and [r["key"] for r in out["decisions"]["not_applied"]] == ["SUBJ:cerritos|NCQ|credit"])
    T = out["totals"]
    check("(1) the totals say how many titles and codes come from a person",
          T["named_by_person"] == 1 and T["common_by_person"] == 3 and T["common_by_statewide_filing"] == 1
          and out["decisions"]["applied"] == 3, json.dumps({k: T[k] for k in ("named_by_person", "common_by_person")}))
    check("(1) a row a person titled is not counted as needing a title", T["named"] == sum(1 for c in by.values() for r in c.values() if r["printed_name"]))
    fp = lst.fingerprint(out)
    os.remove(os.path.join(root, sd.STATUS))
    check("(1) the fingerprint moves with the decisions, so the daily --if-changed run writes", lst.fingerprint(lst.build(root)) != fp)
    D = sd.Decisions({"decisions": [dec("SUBJ:cerritos|AP|whole", "KINE")]}, {"disciplines": {"Kinesiology": {"canonical_subj4": "KINE"}}})
    m = D.for_row("cerritos", "AP", "credit")
    check("(1) a save under the other band stands, marked moved (the page's rule)", m and m["moved"] and D.for_row("cerritos", "AP", "noncredit") is None)
finally:
    shutil.rmtree(root)

# ── (2), (5), (6): the pile mint dry run and the held list on the shared fixture ──
inp0 = pmf.fixture()
plan0 = pm.compute_plan(inp0, "2026-11-22")
canon = inp0["canon_doc"]
inp1 = pmf.fixture()
inp1["subject_decisions"] = sd.Decisions({"decisions": [
    dec("SUBJ:d|MATH|credit", "EDUC"),        # D College's MATH: its shell title with no convention (S4)
    dec("SUBJ:a|ZZZ|credit", "NRSR"),          # A College's unmapped code: held, no route (P8)
    dec("SUBJ:c|MATH|credit", "EDUC"),         # C College's MATH courses are noncredit (P3): never touched
    dec("SUBJ:c|ES|credit", "NOPE"),           # a code the canonical file does not hold: refused (P4 stays held)
]}, canon)
inp1["decision_slugs"] = {"a college": "a", "b college": "b", "c college": "c", "d college": "d"}
plan1 = pm.compute_plan(inp1, "2026-11-22")
dec_cn = {d["control_number"]: d for d in plan1["decided"]}


def held_cns(plan):
    return {r["control_number"]: k for k, v in plan["held"].items() for r in v}


h0, h1 = held_cns(plan0), held_cns(plan1)
rows1 = {cn: r for r in plan1["plan_rows"] for cn in r["control_numbers"]}
check("(6) ⭐ a shell title with no convention under a decided code mints under the decision, released from its hold",
      h0.get("S4") == "shell_title_no_convention" and "S4" not in h1 and rows1.get("S4", {}).get("route") == ["p"]
      and dec_cn["S4"]["machine"] == "held: shell_title_no_convention" and dec_cn["S4"]["subj4"] == "EDUC")
check("(6) ⭐ an ordinary title the routes held takes the decided code", h0.get("P8") == "no_route_gives_a_subj4"
      and "P8" not in h1 and dec_cn["P8"]["key"] == "SUBJ:a|ZZZ|credit" and rows1["P8"]["id"].startswith("NRSR "))
check("(1) ⭐ the same code at another college keeps its own route (A College's MATH reads the subject map)",
      "P1" not in dec_cn and "i" in rows1["P1"]["route"])
check("(2) ⭐ a credit decision leaves the code's noncredit course alone", "P3" not in dec_cn and "i" in rows1["P3"]["route"])
check("(5) ⭐ a refused decision is never applied: the course stays held", h1.get("P4") == h0.get("P4") == "no_route_gives_a_subj4"
      and any(r["key"] == "SUBJ:c|ES|credit" for r in inp1["subject_decisions"].refused))
check("(6) the records name the decision they were minted under, and every validation holds",
      all(rec.get("pile_mint_decision") for part in ("courses", "singletons") for rec in plan1["planned"][part].values()
          if rec.get("pile_mint_route") == "person_decision") and all(v["pass"] for v in plan1["validation"].values()))
held0, _ = hsc.held_of(plan0)
held1, thr = hsc.held_of(plan1)
doc = hsc.build(held1, thr, {}, {}, inp1["disc_map"], {}, decided=plan1["decided"])
under = [r for r in held0 if (r["college"], r["subject"]) in {("D College", "MATH"), ("A College", "ZZZ")}
         and r["control_number"] in {"S4", "P8"}]
check("(6) ⭐ the held list's released count equals the held courses under decided codes, and the held count falls by it",
      doc["totals"]["released"] == len(under) == len(held0) - len(held1) == 2, (doc["totals"]["released"], len(under), len(held0) - len(held1)))
# The worked example: ATH and PEX at Cerritos, a decision each, and one decided course the routes would have placed anyway.
DEC_ROWS = [{"college": "Cerritos College", "control_number": "A1", "title": "Varsity Sports", "subject": "ATH", "key": "SUBJ:cerritos|ATH|credit", "subj4": "KINE", "machine": "held: no_route_gives_a_subj4"},
            {"college": "Cerritos College", "control_number": "A2", "title": "Practicum", "subject": "ATH", "key": "SUBJ:cerritos|ATH|credit", "subj4": "KINE", "machine": "held: shell_title_no_convention"},
            {"college": "Cerritos College", "control_number": "P1", "title": "Yoga", "subject": "PEX", "key": "SUBJ:cerritos|PEX|credit", "subj4": "KINE", "machine": "held: route_i_below_its_floor"},
            {"college": "Cerritos College", "control_number": "P2", "title": "Swim", "subject": "PEX", "key": "SUBJ:cerritos|PEX|credit", "subj4": "KINE", "machine": "placed: KINE by subject_map"}]
rel = hsc.released_of(DEC_ROWS)
check("(6) ⭐ ATH and PEX at Cerritos: three courses released under two keys, the one already placed not counted",
      [(e["code"], e["courses"]) for e in rel] == [("ATH", 2), ("PEX", 1)] and rel[0]["was"] == {"no_route_gives_a_subj4": 1, "shell_title_no_convention": 1})

# ── (4), (7): the sync ────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    out_path = os.path.join(tmp, "subject_decisions.json")
    ROWS = [{"course_id": "SUBJ:cerritos|ATH|credit", "field": "subject_decision", "value": json.dumps({"common_code": "KINE", "decided_by": "Sam"}),
             "reviewed_at": "2026-11-22T04:45:00Z", "reviewer_label": "subjects-s701@bot"},
            {"course_id": "SUBJ:cerritos|PEX|credit", "field": "subject_decision", "value": json.dumps({"local_title": "Physical Education", "decided_by": "someone@rccd.edu"}),
             "reviewed_at": "2026-11-22T05:00:00Z", "reviewer_label": "a reviewer", "reviewer_email": "someone@rccd.edu"},
            {"course_id": "_SUBJ_DISC::KIN", "field": "subject_discipline_confirm", "value": "Kinesiology", "reviewed_at": "2026-11-20T01:00:00Z", "reviewer_label": "a reviewer"}]
    rows_path = os.path.join(tmp, "rows.json")
    json.dump(ROWS, open(rows_path, "w"))
    rc = sync.main(["--rows", rows_path, "--out", out_path])
    good = open(out_path, encoding="utf-8").read()
    d = json.loads(good)
    check("(7) ⭐ the sync keeps who the filing names and never an email, whatever a row carries",
          rc == 0 and not EMAIL.search(good) and [x["who"] for x in d["decisions"]] == ["Sam", "a reviewer"]
          and d["statewide"][0]["discipline"] == "Kinesiology" and d["totals"]["decisions"] == 2, good[:200])
    rc = sync.main(["--rows", rows_path, "--out", out_path])
    check("(4) a second read of the same rows writes the same bytes", rc == 0 and open(out_path, encoding="utf-8").read() == good)
    real_fetch, real_key = sync.fetch, sync.anon_key
    sync.anon_key = lambda: "ANON"

    def broken(*a, **k):
        raise OSError("the network failed")
    sync.fetch = broken
    check("(4) ⭐ a failed read exits non-zero and leaves the committed file as it was",
          sync.main(["--out", out_path]) == 1 and open(out_path, encoding="utf-8").read() == good)
    sync.fetch = lambda *a, **k: []
    check("(4) ⭐ an empty read is refused and leaves the committed file as it was",
          sync.main(["--out", out_path]) == 1 and open(out_path, encoding="utf-8").read() == good)
    check("(4) an empty read named as expected may empty it", sync.main(["--out", out_path, "--expect-empty"]) == 0
          and json.load(open(out_path))["totals"]["decisions"] == 0)
    sync.fetch, sync.anon_key = real_fetch, real_key

    def pages(sizes, total):
        it = iter(sizes)

        def opener(req):
            n = next(it)
            return [{"course_id": "SUBJ:x|C%d|credit" % i, "field": "subject_decision", "value": "{}"} for i in range(n)], "0-%d/%s" % (n, total)
        return opener
    try:
        sync.fetch("subject_decision", "SUBJ:", "K", opener=pages([1000, 3], 1005))
        short = False
    except ValueError as e:
        short = "short read" in str(e)
    check("(4) ⭐ a read short of the exact count raises, so the file stays", short)
    got = sync.fetch("subject_decision", "SUBJ:", "K", opener=pages([1000, 2], 1002))
    check("(4) the read pages by Range until a short page and checks the count", len(got) == 1002)
    url = []
    sync.fetch("subject_decision", "SUBJ:", "K", opener=lambda req: (url.append(req.full_url) or [], "*/0"))
    check("(7) ⭐ the read asks reviewer_label and never reviewer_email", "reviewer_label" in url[0] and "reviewer_email" not in url[0]
          and "field=eq.subject_decision" in url[0] and "course_id=like.SUBJ%3A*" in url[0], url[0])
finally:
    shutil.rmtree(tmp)

# ── (6), (7) the committed files ─────────────────────────────────────────────
committed = json.load(open(os.path.join(ROOT, sd.STATUS), encoding="utf-8"))
seed = sync.shape(sync.seed_rows(), statewide_read=False)
check("(6) the committed decisions hold every filed S701 row (the receipt's md5 checked)",
      {x["key"]: x["common_code"] for x in seed["decisions"]}.items() <= {x["key"]: x["common_code"] for x in committed["decisions"]}.items())
titles = json.load(open(os.path.join(ROOT, "kb", "status", "local_subject_titles.json"), encoding="utf-8"))
tc = titles["columns"]
rows = [(c["slug"], dict(zip(tc, r))) for c in titles["colleges"] for r in c["rows"]]
cer = {r["code"]: r for s, r in rows if s == "cerritos"}
check("(6) ⭐ the worked example in the committed file: Cerritos ATH and PEX read KINE from a person",
      all(cer[k]["common"] == "KINE" and cer[k]["common_source"] == "person" for k in ("ATH", "PEX")))
check("(1) every other college's ATH and PEX keep what the files give them",
      all(r["common_source"] != "person" for s, r in rows if s != "cerritos" and r["code"] in ("ATH", "PEX")))
keys = {x["key"] for x in committed["decisions"]}
check("(6) every applied decision is one the decisions file holds",
      all(r["decision"]["key"] in keys for s, r in rows if r["decision"] and r["decision"]["from"] == "subject_decision"))
held = json.load(open(os.path.join(ROOT, "kb", "status", "held_subject_codes.json"), encoding="utf-8"))
check("(6) the held list's released entries name decisions the file holds and sum to its total",
      all(e["key"] in keys for e in held.get("released") or []) and held["totals"]["released"] == sum(e["courses"] for e in held.get("released") or []))
leaks = [p for p in (sd.STATUS, "kb/status/local_subject_titles.json", "kb/status/held_subject_codes.json")
         if EMAIL.search(open(os.path.join(ROOT, p), encoding="utf-8").read())]
check("(7) ⭐ no email in the decisions file, the titles file or the held list", not leaks, leaks)

# ── (8) the daily build ──────────────────────────────────────────────────────
src = open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8").read()
blocks = re.findall(r'^step "([^"]+)"([^\n]*)<<\'STEP\'\n(.*?)^STEP$', src, re.M | re.S)
ix = {n: i for i, (n, _s, _b) in enumerate(blocks)}
s_i = next((i for i, (n, s, b) in enumerate(blocks) if "kb/_sync_subject_decisions.py" in b), -1)
t_i = next((i for i, (n, s, b) in enumerate(blocks) if "kb/_build_local_subject_titles.py" in b), -1)
check("(8) ⭐ the sync runs before the titles, the held list and the recommendations", 0 <= s_i < t_i)
check("(8) the sync takes no secret (the anon key), warns, and restores the committed file on failure",
      s_i >= 0 and not blocks[s_i][1].strip() and "::warning" in blocks[s_i][2]
      and "git checkout -- kb/status/subject_decisions.json" in blocks[s_i][2])
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
check("(8) the workflow stages the decisions file", "git add kb/status/subject_decisions.json" in wf)

print("\n%s" % ("all passed" if not FAILS else "%d failed" % len(FAILS)))
sys.exit(1 if FAILS else 0)
