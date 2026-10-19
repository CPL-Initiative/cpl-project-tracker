#!/usr/bin/env python3
"""The Common Subjects Reference's nightly confirm of authority-coded picks (kb/_csr_confirm_authority.py).

Sam, Open Asks Sheet 99 card 2 (2026-10-19): on. What has to stay true:
  - only an unconfirmed pick whose code is the authority's own (the CCN subject code or one of
    the C-ID subject codes) qualifies; a code this reference minted waits for a person;
  - a finding other than the two that corroborate (cs7_unreviewed, cs4_aligned) holds the pick;
  - a live code row, whoever wrote it, holds the pick (the fresh read at write time);
  - the receipt is written before the insert and names what landed and what was held;
  - --undo is one delete by the cohort and clears the seed's stamps the sync wrote from it;
  - the committed procedure is on and the workflow carries the cohort and the receipt folder.
Run from the repo root: python3 tests/csr_confirm_authority_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _csr_confirm_authority as cc  # noqa: E402

fails = []
count = [0]


def check(cond, msg):
    count[0] += 1
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def entry(code, **extra):
    e = {"canonical_subj4": code, "source": "data_modal", "data_modal": code, "reviewed_at": None, "reviewed_by": None,
         "canonical_source": "csr", "ccn_subject_code": None, "cid_subject_codes": []}
    e.update(extra)
    return e


SEED = {"disciplines": {
    "Psychology": entry("PSYC", source="curator_override", reviewed_by="map@rccd.edu", reviewed_at="2026-06-12T17:00:00Z",
                        canonical_source="ccn", ccn_subject_code="PSYC"),
    "Cosmetology": entry("COSM"),                                                        # a code this reference minted: waits
    "Anthropology": entry("ANTH", canonical_source="ccn", ccn_subject_code="ANTH", cid_subject_codes=["ANTH"]),
    "Chemistry": entry("CHEM", canonical_source="c-id", cid_subject_codes=["CHEM"]),
    "Geography": entry("GEOG", canonical_source="c-id", cid_subject_codes=["GEOG"]),    # a weak mnemonic holds it
    "History": entry("HIST", canonical_source="ccn", ccn_subject_code="HIST"),           # a live row holds it
    "Upholstering": entry("THAR", canonical_source="ccn", ccn_subject_code="UPHL"),      # source says ccn, the code is not its own
    "Blank": entry(None),
}}
SCAN = {"findings": [
    {"rule": "cs7_unreviewed", "item": "Anthropology"}, {"rule": "cs4_aligned", "item": "Anthropology"},
    {"rule": "cs7_unreviewed", "item": "Chemistry"},
    {"rule": "cs7_unreviewed", "item": "Geography"}, {"rule": "cs6_weak_mnemonic", "item": "Geography"},
    {"rule": "cs7_unreviewed", "item": "History"},
]}
LIVE = {"History": {"canonical_subj4": {"course_id": "_CANON_SUBJ4::History", "field": "canonical_subj4", "value": "HIST",
                                        "reviewer_email": "map@rccd.edu", "reviewed_at": "2026-10-19T18:00:00Z"}},
        "Chemistry": {"canonical_subj4_notes": {"course_id": "_CANON_SUBJ4::Chemistry", "field": "canonical_subj4_notes", "value": "a note",
                                                "reviewer_email": "csr-doctrine-s111@bot", "reviewed_at": "2026-07-10T09:00:00Z"}}}

# ── the plan ──
p = cc.plan(SEED, SCAN, LIVE)
rows = {r["discipline"]: r for r in p["rows"]}
held = {h["discipline"]: h["reason"] for h in p["held"]}
check(sorted(rows) == ["Anthropology", "Chemistry"], "the two unconfirmed picks on the authority's own code qualify: %r" % sorted(rows))
check(rows["Anthropology"]["system"] == "CCN" and rows["Chemistry"]["system"] == "C-ID", "each row names the authority its code belongs to")
check(rows["Anthropology"]["course_id"] == "_CANON_SUBJ4::Anthropology" and rows["Anthropology"]["field"] == "canonical_subj4"
      and rows["Anthropology"]["value"] == "ANTH" and rows["Anthropology"]["reviewer_email"] == cc.COHORT,
      "a row is the tab's own save under the cohort csr-confirm-authority@bot")
check("Cosmetology" not in rows and "Cosmetology" not in held, "a pick on a code this reference minted neither qualifies nor is listed as held: it waits for a person")
check("Psychology" not in rows and "Psychology" not in held, "a pick a person confirmed is left alone")
check("weak_mnemonic" in held.get("Geography", ""), "a finding other than the two that corroborate holds the pick: %r" % held.get("Geography"))
check("live row" in held.get("History", "") and "map@rccd.edu" in held.get("History", ""), "a live code row holds the pick and the reason names who wrote it")
check("Chemistry" in rows, "a live note row (another field) does not hold the pick")
check("not the authority's own" in held.get("Upholstering", ""), "canonical_source alone is not enough: the code must be the authority's own")
check(p["waiting"] == 6, "the plan counts every unconfirmed pick with a code (%r)" % p["waiting"])
off = cc.plan(SEED, SCAN, None)
check(sorted(r["discipline"] for r in off["rows"]) == ["Anthropology", "Chemistry", "History"], "the offline plan (no live read) cannot see the live row")
nos = cc.plan(SEED, None, LIVE)
check(sorted(r["discipline"] for r in nos["rows"]) == ["Anthropology", "Chemistry", "Geography"], "without a scan no finding holds a pick")


# ── the write: receipt before the insert, then what landed ──
class Fake(cc.Curation):
    def __init__(self):
        super().__init__("key", transport=lambda req, t: [], sleep=lambda s: None)
        self.inserted, self.deleted, self.receipt_at_insert = [], [], None

    def picks(self):
        return LIVE

    def insert(self, rows):
        self.inserted = rows
        files = [f for f in os.listdir(OUT) if f.startswith("confirmed_")]
        self.receipt_at_insert = json.load(open(os.path.join(OUT, files[0]))) if files else None
        return [dict(r) for r in rows if r["course_id"] != "_CANON_SUBJ4::Chemistry"]   # one duplicate ignored live

    def undo(self, cohort=cc.COHORT):
        self.deleted.append(cohort)
        return [{"course_id": "_CANON_SUBJ4::Anthropology", "field": "canonical_subj4", "reviewer_email": cohort}]


tmp = tempfile.mkdtemp()
OUT = os.path.join(tmp, "confirm")
seed_path = os.path.join(tmp, "seed.json")
scan_path = os.path.join(tmp, "scan.json")
json.dump(SEED, open(seed_path, "w"))
json.dump(SCAN, open(scan_path, "w"))
fake = Fake()
lines = []
res = cc.run("on", cur=fake, run_id="run-1", seed_path=seed_path, scan_path=scan_path, out_dir=OUT, out=lines.append)
check(fake.receipt_at_insert is not None and fake.receipt_at_insert.get("result") == "pending",
      "the receipt is on disk, result pending, before the insert runs")
check(sorted(r["course_id"] for r in fake.inserted) == ["_CANON_SUBJ4::Anthropology", "_CANON_SUBJ4::Chemistry"]
      and all(set(r) == {"course_id", "field", "value", "reviewer_email"} for r in fake.inserted),
      "the insert carries the four columns of the tab's save and nothing else")
rec = json.load(open(res["receipt"]))
check(rec["result"] == "written" and [r["discipline"] for r in rec["inserted"]] == ["Anthropology"]
      and [r["discipline"] for r in rec["skipped_as_duplicate"]] == ["Chemistry"],
      "the receipt names what landed and what the store ignored as a duplicate")
check(rec["cohort"] == cc.COHORT and "Sheet 99" in rec["ruling"] and len(rec["held"]) == 3 and "--undo" in rec["undo"],
      "the receipt carries the cohort, the ruling, the held picks and the undo")
check(any("2 held" in ln or "held" in ln for ln in lines) and any("1 row(s) inserted" in ln for ln in lines), "the run says what it did")
preview = Fake()
lines2 = []
cc.run("preview", cur=preview, seed_path=seed_path, scan_path=scan_path, out_dir=OUT, out=lines2.append)
check(preview.inserted == [] and any("nothing written" in ln for ln in lines2), "preview reads live and writes nothing")
check(len([f for f in os.listdir(OUT) if f.startswith("confirmed_")]) == 1, "preview leaves no receipt")

# ── the undo ──
seed2 = json.load(open(seed_path))
seed2["disciplines"]["Anthropology"].update(reviewed_by=cc.COHORT, reviewed_at="2026-10-20T08:17:00Z", source="curator_override")
json.dump(seed2, open(seed_path, "w"))
u = cc.undo(fake, seed_path=seed_path, out_dir=OUT, out=lines.append)
after = json.load(open(seed_path))["disciplines"]["Anthropology"]
check(fake.deleted == [cc.COHORT] and u["removed"] == 1, "undo is one delete by the cohort")
check(after["reviewed_by"] is None and after["reviewed_at"] is None and after["source"] == "data_modal" and u["cleared"] == ["Anthropology"],
      "undo clears the seed's stamps the sync wrote from the cohort's rows")
check(json.load(open(seed_path))["disciplines"]["Psychology"]["reviewed_by"] == "map@rccd.edu", "undo leaves a person's confirmation alone")
check(os.path.exists(u["receipt"]), "undo writes its own receipt")

# ── the committed store and the workflow ──
procs = json.load(open(os.path.join(ROOT, "kb", "csr_procedures.json"), encoding="utf-8"))["procedures"]
conf = [p for p in procs if p["id"] == "confirmation"][0]
check(conf["on"] is True and "csr-confirm-authority@bot" in conf["rule"] and "Sheet 99" in conf["source"]["words"],
      "the confirmation procedure is on, names the cohort and cites the ruling")
wf = open(os.path.join(ROOT, ".github", "workflows", "csr-confirm.yml"), encoding="utf-8").read()
check("_csr_confirm_authority.py" in wf and "kb/csr_out/confirm" in wf and "SUPABASE_SERVICE_KEY" in wf and "options: [\"on\", \"preview\", \"off\"]" in wf,
      "the workflow runs the script with the key, commits the receipt folder and quotes its on/off options")
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
check(gov.get("mapped", {}).get("workflow:csr-confirm.yml") == "DR-04", "the governance surface map maps the workflow to DR-04")

print("\n%d/%d checks passed" % (count[0] - len(fails), count[0]))
sys.exit(1 if fails else 0)
