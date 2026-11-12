#!/usr/bin/env python3
"""The exhibit subject fill (kb/_exhibit_subject_fill.py). Sam, in session 2026-11-11: fill the exhibits'
missing subject as automatically as possible; ASE MIL7 "Heating, Ventilation & Air Conditioning" is automotive.

What has to stay true:
  - MIL7 (credited course AUTO G160, issuer ASE, title words HVAC) fills AUTO, from its course;
  - the rungs run in order: courses at several colleges, then one college, then the issuer family
    where no course yields a subject; a split vote fills nothing; title words never decide;
  - an issuer family or certification link that contradicts the courses holds the title for a person;
  - a subject the Common Subjects Reference does not hold is skipped and listed;
  - a subject already stored on a title, a person's or anyone's, is never touched;
  - a title the Catalog already reads a subject for (an M-ID or C-ID articulation) is not a blank;
  - the receipt is written before the INSERT; undo removes exactly the cohort's rows; a second run inserts nothing;
  - the remainder goes to the worklist with a title-word suggestion marked as one;
  - the committed issuer family table names only subjects the reference holds, and the nightly workflow runs
    the fill in preview by default.
Run from the repo root: python3 tests/exhibit_subject_fill_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _exhibit_subject_fill as F  # noqa: E402

fails = []
count = [0]


def check(cond, msg):
    count[0] += 1
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def T(ut, issuer="", arts=(), raw=(), ge=None):
    return {"ut": ut, "issuer": issuer, "articulations": list(arts), "raw_variants": [{"r": r} for r in raw],
            "ge_credit": ge}


def A(*colleges):
    """adoption entry: each college a list of course codes."""
    return {"a": {str(i): [3.0, [[c, "3 hours"] for c in cs]] for i, cs in enumerate(colleges)},
            "x": [["MAPX-%d" % i, "x", 3.0] for i in range(len(colleges) or 1)]}


INP = {
    "titles": [
        T("Heating and Air Conditioning", "National Institute for Automotive Service Excellence (ASE)",
          raw=["Automotive Service Excellence MIL7 - Heating, Ventilation & Air Conditioning"]),
        T("Welding Basics", arts=[{"cid": "WELD M1001", "sys": "M-ID"}]),          # the Catalog has a subject
        T("Justice Intro", arts=[{"cid": "AJ 110", "sys": "C-ID"}]),               # C-ID only: not blank
        T("Two College Nursing"),                                                   # rung a
        T("Brake Systems (ASE A5)", "ASE"),                                         # rung c, no course
        T("Brazing Qualification", "American Welding Society"),                    # held: WELD family, HVAC course
        T("Split Credential"),                                                      # courses split
        T("Drama Basics"),                                                          # discipline with no Common SUBJ
        T("Mystery Badge"),                                                         # no signal, suggestion from words
        T("Person Picked"),                                                         # a person's subject already stored
        T("Cohort Picked"),                                                         # this cohort wrote it last night
        T("IB Language B HL", "International Baccalaureate", ge={"program": "IB", "areas": ["Language"]}),
    ],
    "adoption": {
        "Heating and Air Conditioning": A(["AUTO G160"]),
        "Two College Nursing": A(["NURS 101"], ["NRSG 12"], ["HVAC 1"]),
        "Brazing Qualification": A(["HVAC 120"]),
        "Split Credential": A(["NURS 1", "AUTO 2"]),
        "Drama Basics": A(["THEA 1"]),
        "Person Picked": A(["AUTO 1"]),
        "Cohort Picked": A(["AUTO 1"]),
        "Mystery Badge": A(["ZZZ 1"]),
    },
    "subj_map": {"AUTO": "Automotive Technology", "NURS": "Nursing", "HVAC": "Air Conditioning, Refrigeration, Heating",
                 "THEA": "Theater Arts"},
    "csr": {"Automotive Technology": {"canonical_subj4": "AUTO"}, "Nursing": {"canonical_subj4": "NRSR",
            "local_subject_variants": {"NRSG": 40, "NURS": 100}},
            "Air Conditioning, Refrigeration, Heating": {"canonical_subj4": "HVAC"}, "Welding": {"canonical_subj4": "WELD"},
            "Theater Arts": {"canonical_subj4": None}, "Cryptozoology Badges": {"canonical_subj4": "CRYP"}},
    "cert_links": {"certs": {"ITC1": {"family": "AWS-Welding"}}, "links": {"Brazing Qualification": {"certs": ["ITC1"]}}},
    "families": json.load(open(os.path.join(ROOT, "kb", "reference", "issuer_family_subject.json")))["families"],
}
INP["titles"][8]["ut"] = "Mystery Cryptozoology Badge"
INP["adoption"]["Mystery Cryptozoology Badge"] = INP["adoption"].pop("Mystery Badge")

LIVE = {"Person Picked": {"subj_override": {"value": "BUSI", "reviewer_email": "carp@rccd.edu"}},
        "Cohort Picked": {"subj_override": {"value": "AUTO", "reviewer_email": F.COHORT},
                          "subj_source": {"value": "courses, one college", "reviewer_email": F.COHORT}}}


class FakeStore:
    """kb_curation in memory: (course_id, field) is the key; a duplicate is ignored."""

    def __init__(self, rows):
        self.rows = {(r["course_id"], r["field"]): dict(r) for r in rows}
        self.inserted_when_receipt = None
        self.receipt_dir = None

    def subjects(self):
        out = {}
        for (cid, f), r in self.rows.items():
            if cid.startswith(F.KEY_PREFIX) and f in (F.FIELD_SUBJ, F.FIELD_SOURCE):
                out.setdefault(cid[len(F.KEY_PREFIX):], {})[f] = r
        return out

    def insert(self, rows):
        if self.receipt_dir:
            saved = os.path.join(self.receipt_dir, "saved")
            self.inserted_when_receipt = os.path.isdir(saved) and any(n.startswith("saved_") for n in os.listdir(saved))
        got = []
        for r in rows:
            k = (r["course_id"], r["field"])
            if k not in self.rows:
                self.rows[k] = dict(r)
                got.append(dict(r))
        return got

    def undo(self, cohort):
        """What Curation.undo's DELETE filters on: the cohort, the prefix and the two subject fields."""
        mine = lambda k, r: (r.get("reviewer_email") == cohort and k[0].startswith(F.KEY_PREFIX)   # noqa: E731
                             and k[1] in (F.FIELD_SUBJ, F.FIELD_SOURCE))
        gone = [r for k, r in self.rows.items() if mine(k, r)]
        self.rows = {k: r for k, r in self.rows.items() if not mine(k, r)}
        return gone


def live_rows():
    out = []
    for t, fs in LIVE.items():
        for f, r in fs.items():
            out.append(dict(r, course_id=F.KEY_PREFIX + t, field=f))
    out.append({"course_id": F.KEY_PREFIX + "Person Picked", "field": "issuing_agency_override", "value": "X",
                "reviewer_email": "carp@rccd.edu"})
    out.append({"course_id": "_CANON_SUBJ4::Nursing", "field": F.FIELD_SUBJ, "value": "NRSR", "reviewer_email": F.COHORT})
    return out


p = F.plan(INP, LIVE)
fill = {f["title"]: f for f in p["fills"]}
left = {i["title"]: i for i in p["left"]}

check(fill.get("Heating and Air Conditioning", {}).get("subject") == "AUTO",
      "MIL7 (course AUTO G160, issuer ASE, title words HVAC) fills AUTO, not HVAC")
check(fill.get("Heating and Air Conditioning", {}).get("source") == "courses, one college",
      "MIL7 fills from its one college's course, rung b")
check("Welding Basics" not in fill and "Welding Basics" not in left, "a title with an M-ID articulation is not a blank")
check("Justice Intro" not in fill and "Justice Intro" not in left, "a title with only a C-ID articulation is not a blank")
check(fill.get("Two College Nursing", {}).get("subject") == "NRSR"
      and fill["Two College Nursing"]["source"] == "courses, several colleges",
      "courses at several colleges, two of three NRSR (one through the reference's variants), fill NRSR at rung a")
check(fill.get("Brake Systems (ASE A5)", {}).get("source") == "issuer family" and fill["Brake Systems (ASE A5)"]["subject"] == "AUTO",
      "no course named: the ASE family fills AUTO at rung c")
check(left.get("Brazing Qualification", {}).get("why", "").startswith("held"),
      "a certification link (AWS, welding) that contradicts the course (HVAC) holds the title for a person")
check(left.get("Split Credential", {}).get("why") == "courses split", "a 1-1 course vote fills nothing")
check(left.get("Drama Basics", {}).get("why") == "subject not in the Common Subjects Reference" and "Theater Arts" in p["not_held"],
      "a discipline the reference holds no Common SUBJ for is skipped and listed")
m = left.get("Mystery Cryptozoology Badge", {})
check(m.get("why") == "no signal" and m.get("suggested") == "CRYP" and "suggestion" in m.get("suggested_from", ""),
      "title words only suggest, marked as a suggestion, and never fill")
check(left.get("IB Language B HL", {}).get("why") == "credited to a GE area", "an exam credited to a GE area is left, so named")
check("Person Picked" not in fill and "Person Picked" not in left and p["already_live"] == 2,
      "a subject already stored on a title (a person's, or the cohort's from an earlier run) is never planned")
check(all(r["reviewer_email"] == F.COHORT for r in p["rows"]) and len(p["rows"]) == 2 * len(p["fills"]),
      "every row is under the cohort, and each fill writes subj_override and subj_source")
check({r["field"] for r in p["rows"]} == {F.FIELD_SUBJ, F.FIELD_SOURCE}, "only the two subject fields are written")

# the run: receipt before insert; person untouched; second run inserts nothing; undo removes exactly the cohort's rows
with tempfile.TemporaryDirectory() as tmp:
    store = FakeStore(live_rows())
    store.receipt_dir = tmp
    before_person = dict(store.rows[(F.KEY_PREFIX + "Person Picked", F.FIELD_SUBJ)])
    wl = os.path.join(tmp, "worklist.json")
    r1 = F.run("on", cur=store, inp=INP, out_dir=tmp, worklist=wl, out=lambda *a: None)
    check(store.inserted_when_receipt is True, "the receipt is on disk before the INSERT")
    check(r1["inserted"] == len(p["rows"]), "the first run inserts every planned row (%d)" % r1["inserted"])
    check(store.rows[(F.KEY_PREFIX + "Person Picked", F.FIELD_SUBJ)] == before_person, "a person's subject is untouched")
    rec = json.load(open(r1["receipt"]))
    check(rec["result"] == "written" and rec["cohort"] == F.COHORT and len(rec["inserted"]) == r1["inserted"],
          "the receipt names the cohort and every row that landed")
    w = json.load(open(wl))
    check(w["mode"] == "on" and w["no_subject"] == len(p["left"]) and w["written"] == len(p["fills"]),
          "the worklist counts what is left after the write")
    r2 = F.run("on", cur=store, inp=INP, out_dir=tmp, worklist=wl, out=lambda *a: None)
    check(r2.get("inserted", 0) == 0 and r2["planned"] == 0, "a second run plans and inserts nothing")
    others = {k: r for k, r in store.rows.items() if r.get("reviewer_email") != F.COHORT or not k[0].startswith(F.KEY_PREFIX)}
    cohort_n = len(store.rows) - len(others)
    u = F.undo(store, out_dir=tmp, out=lambda *a: None)
    check(u["removed"] == cohort_n and store.rows == others,
          "undo removes exactly the cohort's subject rows (%d) and nothing else" % cohort_n)
    check(("_CANON_SUBJ4::Nursing", F.FIELD_SUBJ) in store.rows, "undo leaves a row outside the credential namespace alone")
    pv = os.path.join(tmp, "wl2.json")
    store2 = FakeStore(live_rows())
    r3 = F.run("preview", cur=store2, inp=INP, out_dir=tmp, worklist=pv, out=lambda *a: None)
    check(r3["planned"] == len(p["fills"]) and len(store2.rows) == len(live_rows()), "preview reads live and writes no row")
    check(json.load(open(pv))["no_subject"] == len(p["left"]) + len(p["fills"]),
          "a preview counts the planned fills as still without a subject")

# the PostgREST shape: Range-paginated read, ignore-duplicates insert, delete by cohort on the two fields
seen = []


def transport(req, timeout):
    seen.append(req)
    if req.get_method() == "GET":
        rng = req.get_header("Range")
        start = int(rng.split("-")[0])
        return [{"course_id": F.KEY_PREFIX + "t%d" % (start + i), "field": F.FIELD_SUBJ, "value": "AUTO"}
                for i in range(F.PAGE if start == 0 else 3)]
    return []


cur = F.Curation("k", url="https://x.supabase.co", transport=transport, sleep=lambda s: None)
got = cur.subjects()
check(len(got) == F.PAGE + 3 and len([r for r in seen if r.get_method() == "GET"]) == 2, "the live read pages by Range")
check("subj_override" in seen[0].full_url and "subj_source" in seen[0].full_url, "the read asks for both subject fields")
cur.insert([{"course_id": "a", "field": "b"}])
check("on_conflict=course_id,field" in seen[-1].full_url and "ignore-duplicates" in seen[-1].get_header("Prefer"),
      "the INSERT ignores duplicates on (course_id, field)")
cur.undo()
check(seen[-1].get_method() == "DELETE" and "reviewer_email=eq.exhibit-subject-s638%40bot" in seen[-1].full_url
      and "subj_override" in seen[-1].full_url, "undo is one DELETE by the cohort on the subject fields")

# the committed files
fam = json.load(open(os.path.join(ROOT, "kb", "reference", "issuer_family_subject.json")))["families"]
held = {e.get("canonical_subj4") for e in json.load(open(os.path.join(ROOT, "kb", "discipline_canonical_subj4.json")))["disciplines"].values()}
check(fam.get("ASE", {}).get("subject") == "AUTO", "the family table says ASE is automotive")
check(all(f["subject"] in held for f in fam.values()), "every family subject is a Common SUBJ the reference holds")
wf = open(os.path.join(ROOT, ".github", "workflows", "cer-procedures.yml"), encoding="utf-8").read()
check("kb/_exhibit_subject_fill.py" in wf and "SUBJECT_FILL: ${{ inputs.subject_fill || 'preview' }}" in wf,
      "the nightly CER run carries the fill, preview unless a dispatch turns it on")
check("kb/exhibit_subject_out" in wf, "the nightly run commits the fill's receipts and worklist")
wl = json.load(open(os.path.join(ROOT, "kb", "exhibit_subject_out", "worklist.json")))
check(isinstance(wl.get("no_subject"), int) and all("why" in i for i in wl["items"]),
      "the committed worklist carries its count and a reason per credential")

print("\n%d checks, %d failed" % (count[0], len(fails)))
sys.exit(1 if fails else 0)
