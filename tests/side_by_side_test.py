#!/usr/bin/env python3
"""Guards for kb/_build_side_by_side.py (S678, COBIx's item 7 on #3464): the files behind the read-only Side by side
views in the Courses List and the Exhibits tab.

What this pins, against the committed files (the fixture cards are COBIx's case_studies.md on #3464):
  1. NRSR M1137 (held by a false title alarm): three college courses, all Active, TOP 1230.10 Registered Nursing, our
     TOP table and subject map both Nursing, and its own subject, its colleges' subjects and their TOP codes agree.
     The scorer and the List hold the same three, so the card carries no disagreement.
  2. AGAB M1002 (no college courses in the memberships file): the scorer reads 0 while the List shows 3; the three are
     Active, TOP 0112.00 is in neither of our tables, AGAB is not in the subject map, and every signal is missing.
  3. AUTO M9003 (nothing to read): its control number has no row in the program course file and no own description,
     and our tables agree on Automotive Technology.
  4. Exhibits: a Review card's exhibit says its official certification name is not on file and names the course the
     Review builder set aside (checked on a constructed exhibit through both builders' own functions, since curation
     can settle every such card; the committed file's cards of that kind, when any exist, read the same way); a CPL
     type falls back to the exhibit id's path only when MAP's type is not on record.
  5. The builder is read-only and independent of the scorer: it imports no kb/_ccr_confidence_score.py, writes only
     its two outputs, and the committed outputs are what it builds today (--check).

Run from repo root: python3 tests/side_by_side_test.py
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


src = open(os.path.join(ROOT, "kb/_build_side_by_side.py"), encoding="utf-8").read()
C = load("kb/side_by_side.json")
E = load("kb/exhibit_side_by_side.json")
status = {cn: st for st, cns in C["status"].items() for cn in cns}
LIST = {
    "NRSR M1137": ["CCC000502913", "CCC000642246", "CCC000593129"],
    "AGAB M1002": ["CCC000553356", "CCC000553354", "CCC000553355"],
    "AUTO M9003": ["CCC000421219"],
}

# 1. NRSR M1137
n = C["cards"].get("NRSR M1137") or {}
check("1 NRSR M1137 is a card the scorer reads, guess Nursing", n.get("g") == "Nursing", n)
check("1 its three signals agree", n.get("r") == ["agrees", "agrees", "agrees"], n.get("r"))
check("1 the scorer and the List hold the same courses (no disagreement)", "s" not in n, n.get("s"))
check("1 each college course is Active", all(status.get(cn) == "Active" for cn in LIST["NRSR M1137"]))
check("1 TOP 1230.10 is Registered Nursing, and our TOP table says Nursing", C["tops"].get("1230.10") == ["Registered Nursing", "Nursing"], C["tops"].get("1230.10"))
check("1 the subject map gives NURS Nursing", C["subjects"].get("NURS") == "Nursing")
check("1 its own description, first 200 characters", (n.get("d") or "").startswith("Focuses on the care of adult clients") and len(n["d"]) <= 201)

# 2. AGAB M1002
a = C["cards"].get("AGAB M1002") or {}
check("2 AGAB M1002: the scorer reads 0 college courses", a.get("s") == [], a)
check("2 its three are Active", all(status.get(cn) == "Active" for cn in LIST["AGAB M1002"]))
check("2 TOP 0112.00 is in neither table", C["tops"].get("0112.00") == ["Agriculture Business, Sales, and Service", None], C["tops"].get("0112.00"))
check("2 AGAB is not in the subject map", "AGAB" not in C["subjects"])
check("2 its own subject unmapped, the other signals missing", a.get("r") == ["unmapped", "missing", "missing"], a.get("r"))
check("2 no own description", "d" not in a)

# 3. AUTO M9003
u = C["cards"].get("AUTO M9003") or {}
check("3 AUTO M9003: no row in the program course file", "CCC000421219" not in status)
check("3 our tables agree on Automotive Technology", u.get("g") == "Automotive Technology" and u.get("r") == ["agrees", "agrees", "agrees"], u)
check("3 no own description", "d" not in u)
check("3 TOP 0948.00 reads Automotive Technology in our TOP table", (C["tops"].get("0948.00") or [None, None])[1] == "Automotive Technology")

# The disagreement counts the report names.
k = C["counts"]
check("the counts add up: seedless = merged away + not openable + openable",
      k["seedless"] == k["merged_away"] + k["not_openable"] + k["openable"], k)
check("every card that reads none is among those that differ", k["scorer_reads_none"] <= k["scorer_and_list_differ"], k)

# 4. Exhibits
# A Review card whose course was set aside lives only until a curator settles its title: Sam's curation of 2026-11-18
# settled all 28 cards that left the queue, the Dublin EMR card (MAPICH-HSA(-1-001) the last of this kind among them,
# and the daily of 2026-11-19 held none. So the check builds one: the smallest exhibit the Review builder sets a
# course aside for (an industry certification, MAP id path ic, aligned to a college course), run through the Review
# builder's own rule (course_title_fits) and the side by side builder's own build_exhibits on constructed inputs.
SET_ASIDE = re.compile(r"[A-Z][^()]+ [A-Z]{2,6} ?\d+[A-Z]? \([^()]+\) was set aside: this exhibit is an industry "
                       r"certification, not credit by exam\.")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import importlib.util  # noqa: E402


def module(rel, name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


REVIEW = module("kb/_build_exhibits_review.py", "_build_exhibits_review_t")
SBS = module("kb/_build_side_by_side.py", "_build_side_by_side_t")
FX = "MAPICX-TEST-1-001"
fits, why = REVIEW.course_title_fits({"ids": [FX], "types": ["Industry Certification"], "recs": ["one"]})
check("4 the Review builder sets an industry certification's course title aside", fits is False
      and why == "industry certification, not credit by exam", (fits, why))
inputs = {
    "kb/exhibits_adoption.json": {"credentials": {}},
    "kb/coci_articulations.json": {"articulations": [{"exhibit_id": FX, "exhibit_title": "EMR (test college)",
                                                      "unified_title": "Emergency Medical Responder",
                                                      "cpl_type_description": "Industry Certification"}]},
    "kb/unified_titles.json": {},
    "kb/exhibit_cert_links.json": {"links": {}, "certs": {}},
    "kb/exhibits_review.json": {"held": [{"raw": "EMR (test college)", "title": "Emergency Medical Responder",
                                          "ids": [FX], "course_college": "Las Positas College", "course": "EMS 30",
                                          "course_title_set_aside": {"title": "Emergency Medical Responder",
                                                                     "basis": "M-ID EMST M1056", "why": why}}]},
    "kb/coci_minted_courses.json": {"courses": {}},
    "kb/coci_minted_singletons.json": {"courses": {}},
    "kb/reference/cid_descriptors.json": {"descriptors": []},
    "kb/reference/ccn_courses.json": {"courses": []},
}
SBS.load = inputs.__getitem__
x = SBS.build_exhibits()["exhibits"].get(FX) or {}
check("4 the Review card's exhibit: no official certification name on file", x.get("n") == 1 and x.get("k") == "cert-based", x)
check("4 it names the course the Review builder set aside", bool(SET_ASIDE.fullmatch(x.get("a") or "")), x.get("a"))
# In the committed file, every exhibit of this kind reads the same way; today's count is printed, and may be 0.
live = [r for r in E["exhibits"].values() if "industry certification, not credit by exam" in (r.get("a") or "")]
print("exhibits whose course was set aside as an industry certification in today's file: %d" % len(live))
check("4 each such exhibit in the committed file has no official name on file and names its course",
      all(r.get("k") == "cert-based" and SET_ASIDE.fullmatch(r["a"]) for r in live),
      [r for r in live if not SET_ASIDE.fullmatch(r["a"])][:2])
check("4 the type comes from MAP's record when MAP has one",
      all(r.get("ts") == "map" for r in E["exhibits"].values() if r.get("t") in ("Credit By Exam", "Industry Certification")
          and r.get("ts") != "id") and E["counts"]["type_from_map"] > 0)
check("4 and from the exhibit id otherwise", (E["exhibits"].get("MAPCXS-B0BL-1-001") or {}).get("ts") == "id")
check("4 the local title is carried as the college entered it",
      (E["exhibits"].get("MAPCXS-B0BL-1-001") or {}).get("l") == "BUS 018: Business Law")

# 5. Read-only and independent
check("5 the builder never imports the scorer",
      not re.search(r"^\s*(import|from)\s+\S*(_ccr_confidence_score|discipline_confidence|_ccr_desc_signal)", src, re.M))
check("5 it writes only its two outputs", set(re.findall(r'OUT_[A-Z]+ = "([^"]+)"', src)) == {"kb/side_by_side.json", "kb/exhibit_side_by_side.json"}
      and src.count('open(path(rel), "w"') == 1)
check("5 it sends nothing over the network", not re.search(r"urllib|requests|http\.client|supabase", src.split('"""', 2)[2], re.I))
p = subprocess.run([sys.executable, "kb/_build_side_by_side.py", "--check"], cwd=ROOT, capture_output=True, text=True)
check("5 the committed files are what the builder builds today", p.returncode == 0, p.stderr.strip())
# A credential rename rewrites coci_articulations.json's canonical titles, which the rows read: the 2026-11-18 apply left
# kb/exhibit_side_by_side.json stale until S679 rebuilt it. The rename workflow rebuilds and commits both outputs.
rw = open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8").read()
rb = rw[rw.index("name: Rebuild the files derived from the credential keys"):]
rb = rb[:rb.index("- name:", 10)]
rc = rw[rw.index("name: Commit + push"):]
rc = rc[:rc.index("git diff --cached")]
check("5 the rename workflow rebuilds the side by side with the files derived from the credential keys, and commits it",
      "python3 kb/_build_side_by_side.py" in rb and "kb/side_by_side.json" in rc and "kb/exhibit_side_by_side.json" in rc)
# The CER procedures run rewrites kb/exhibits_review.json, which the exhibit rows read: run 44350607385 (2026-11-18)
# left kb/exhibit_side_by_side.json stale and every PR red. It rebuilds after the review queue and commits both files.
cw = open(os.path.join(ROOT, ".github", "workflows", "cer-procedures.yml"), encoding="utf-8").read()
cq, cs = cw.find("name: Build the Exhibits review queue"), cw.find("name: Build the Side by side views")
cc = cw[cw.index("name: Commit the run"):]
check("5 the CER procedures run rebuilds the side by side after its review queue, and commits both files",
      0 <= cq < cs and "python3 kb/_build_side_by_side.py" in cw[cs:cs + 400]
      and "kb/exhibit_side_by_side.json" in cc and "kb/side_by_side.json" in cc)
# A failed rebuild must not commit a new review queue beside a stale side by side (COBIx on #3520): the review files
# ride only on the rebuild's success, and a closing step turns the run red.
gate = cc[cc.find('steps.sbs.outcome }}" = "success"'):]
check("5 a failed rebuild holds the review queue out of the procedures commit and ends the run red",
      "id: sbs" in cw[cs:cs + 400] and gate and gate.find("kb/exhibits_review.json") < gate.find("else")
      and "kb/exhibits_review.json" not in cc[:cc.find('steps.sbs.outcome')]
      and "if: ${{ steps.sbs.outcome == 'failure' }}" in cw and "exit 1" in cw[cw.find("name: Red when the Side by side did not rebuild"):][:400])
# The daily rebuilds both files after the steps that write what the rows read (the review queue's
# kb/exhibits_adoption.json, the cert links), commits them, and a failure turns the run red under the failure watch.
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
build_sh = open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8").read()
full = wf.replace("run: bash scripts/daily_build.sh", "run: bash scripts/daily_build.sh\n" + build_sh, 1)
rq, cl = full.find('step "Build the Exhibits review queue"'), full.find('step "Build the exhibit-to-cert link"')
sb, cms = full.find('step "Build the Side by side views"'), full.find('step "Build the Commons status"')
check("5 the daily rebuilds the side by side after the review queue writes kb/exhibits_adoption.json and the cert links, "
      "before the Commons status", -1 < rq < cl < sb < cms and "python3 kb/_build_side_by_side.py" in full[sb:cms],
      (rq, cl, sb, cms))
blk = full[sb:full.find("\nSTEP", sb)]
check("5 a failed side by side build is an ::error and records SIDE_BY_SIDE_STATUS=failed, never a bare echo",
      "::error title=Side by side not rebuilt::" in blk and 'SIDE_BY_SIDE_STATUS=failed" >> "$GITHUB_ENV"' in blk
      and 'SIDE_BY_SIDE_STATUS=success" >> "$GITHUB_ENV"' in blk, blk[:400])
commit = full[full.find("name: Commit and push to main"):]
check("5 the daily commit carries both side by side files, and a rebuild on a new main restores the first build's status",
      "git add kb/exhibit_side_by_side.json kb/side_by_side.json" in commit
      and "first_side=${SIDE_BY_SIDE_STATUS:-}" in commit and 'echo "SIDE_BY_SIDE_STATUS=$first_side"' in commit)
fail = full[full.find("name: Fail the run when the Side by side views did not rebuild"):]
check("5 the run ends red when the side by side did not rebuild, so the failure watch reports it",
      "env.SIDE_BY_SIDE_STATUS == 'failed'" in fail[:400] and "always()" in fail[:400] and "exit 1" in fail[:700])

fails = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or why == "" else "\n     " + str(why)[:300]))
print("\n%d/%d passed" % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
