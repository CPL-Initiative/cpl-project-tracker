#!/usr/bin/env python3
"""cert_naming_test.py — an exhibit based on a certification is named by the certification.

Sam's ruling of 2026-11-11 (kb/cert_naming.py): the certification's official name first and its code in
parentheses, "Medium/Heavy Truck Parts Specialist (ASE P1)"; the program name does not lead. What this
pins, each a way the ruling could fail without an error:

  the rule    a new ASE card is proposed in the format, and a title already in the format gets no card
              again (the card that kept returning to Another look);
  no rename   a title in the reference under an older form is never moved by a card or by the builders:
              it is listed in the rename batch, and only a saved approval takes it out;
  the batch   program-first, code-first, missing-code and two-titles-for-one-certification rows, the
              title that leads a group, and what is left to a card or already decided;
  the alias   an applied rename keeps the old title searchable, in the Exhibits index and in the public
              Credential Catalog's records.

Run from the repo root:
    python3 tests/cert_naming_test.py
"""
import hashlib
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import cert_naming as cn  # noqa: E402
import credential_aliases  # noqa: E402
import _build_exhibits_related as rel  # noqa: E402
import _sweep_exhibit_titles as sw  # noqa: E402

results = []
ASE = cn.ASE_ISSUER
CCC = "California Community Colleges"


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f)


def digest(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


# ── the format ──
check("Sam's ruling for the card reads from the table", cn.ase_title("P1") == "Medium/Heavy Truck Parts Specialist (ASE P1)")
check("the rule records who set it, when, his words and the three paths in its notes",
      cn.RULE["set_by"] == "Sam" and cn.RULE["date"] == "2026-11-11" and "official name first" in cn.RULE["words"]
      and len(cn.RULE["notes"]) == 5 and "mirrored" in cn.RULE["notes"][1] and "CX CPL notation" in cn.RULE["notes"][2]
      and "existing articulation" in cn.RULE["notes"][3] and "not under the program" in cn.RULE["notes"][4])
check("a title in the format fits", cn.ase_read("Brakes (ASE A5)")["kind"] == "fits")
got = cn.ase_read("Automotive Technology (ASE A5 Brakes)", CCC)
check("a program name in front is program-first, with the certification's name proposed",
      got["kind"] == "program-first" and got["proposed"] == "Brakes (ASE A5)", got)
got = cn.ase_read("ASE A5 — Brakes", ASE)
check("the code in front is code-first", got["kind"] == "code-first" and got["proposed"] == "Brakes (ASE A5)", got)
got = cn.ase_read("ASE C1 — Service Consultant", ASE)
check("the proposed name is ASE's official one, not the reference's wording",
      got["proposed"] == "Automobile Service Consultant (ASE C1)", got)
got = cn.ase_read("Heating and Air Conditioning", ASE)
check("an ASE title with no code takes the one test its words name",
      got["kind"] == "missing-code" and got["proposed"] == "Heating and Air Conditioning (ASE A7)", got)
got = cn.ase_read("Automotive Braking Systems", ASE)
check("words that fit two tests (A5 and T4 are both Brakes) propose nothing", got["kind"] == "missing-code" and got["proposed"] == "", got)
for t in ("ASE Bundle — A4, A5", "ASE Master Automobile Technician (A1–A8 + L1)", "ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical",
          "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair", "ASE Master Automobile Technician"):
    got = cn.ase_read(t, ASE)
    check("more than one test has no single name: " + t, got["kind"] == "several" and got["proposed"] == "", got)
check("a title that is not ASE's is not read", cn.ase_read("Phase Change Materials", CCC) is None
      and cn.ase_read("CompTIA A+", "CompTIA") is None)
check("a new proposal goes out in the format; any other title goes out as it came",
      cn.canonical("Automotive Technology (ASE A7 Heating and Air Conditioning)") == "Heating and Air Conditioning (ASE A7)"
      and cn.canonical("ASE A1 — Engine Repair") == "Engine Repair (ASE A1)" and cn.canonical("Guitar 1") == "Guitar 1")
check("the families after ASE wait their turn, in Sam's order",
      [f["short"] for f in cn.FAMILIES] == ["ASE", "CompTIA", "AWS", "NCCER"] and [f["active"] for f in cn.FAMILIES] == [True, False, False, False])

# ── the sweep's rule ──
P1 = "Noncredit for AUTO P1"
got = sw.rule_ase(P1, "Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)", {}, True)
check("the card that kept returning is proposed as Sam ruled it", got and got[0] == "Medium/Heavy Truck Parts Specialist (ASE P1)", got)
check("and once it carries that title, it gets no card again", sw.rule_ase(P1, "Medium/Heavy Truck Parts Specialist (ASE P1)", {}, True) is None)
check("a title that names the right test in the older form is the batch's, never a card's",
      sw.rule_ase("Noncredit for AUTO A5", "Automotive Technology (ASE A5 Brakes)", {}, True) is None)
got = sw.rule_ase("Noncredit for AUTO A5", "Brakes", {}, True)
check("a new ASE card is proposed in the format, the program name gone", got and got[0] == "Brakes (ASE A5)", got)
check("the sweep's rule carries the ruling and its notes for the Rules view",
      sw.RULES[0]["id"] == "ase" and sw.RULES[0]["ruling"]["date"] == "2026-11-11" and sw.RULES[0]["notes"] == cn.RULE["notes"])
check("no other rule rewrites the format", sw.propose(P1, "Medium/Heavy Truck Parts Specialist (ASE P1)", {}, True)
      == ("Medium/Heavy Truck Parts Specialist (ASE P1)", []))


# ── the batch, on a fixture ──
def fixture(root, overlay=None):
    stamp = {"reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-10-31T10:00:00+00:00"}
    titles = {
        "ASE A5 cert": "ASE A5 — Brakes", "ASE A5 certificate (Brakes)": "ASE A5 — Brakes",
        "Noncredit for AUTO A5": "Automotive Technology (ASE A5 Brakes)",
        "Noncredit for AUTO A7": "Automotive Technology (ASE A7 Heating and Air Conditioning)",
        "ASE A4 A5 bundle": "ASE Bundle — A4, A5",
        "Noncredit for AUTO P1": "Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)",
        "Noncredit for AUTO A1": "Engine Repair (ASE A1)",
        "Guitar I": "Guitar 1",
    }
    write(os.path.join(root, "kb", "unified_titles.json"),
          {raw: dict(stamp, unified_title=t, source_exhibit_ids=["X-" + raw]) for raw, t in titles.items()})
    issuer = {"ASE A5 — Brakes": ASE, "ASE Bundle — A4, A5": ASE}
    write(os.path.join(root, "kb", "credentials.json"),
          {t: [{"issuing_agency": issuer.get(t, CCC)}] for t in set(titles.values())})
    write(os.path.join(root, "kb", "unclassified_assignments.json"),
          {"assignments": {"Smog check local": {"unified_title": "Smog Check Inspector", "issuing_agency": "Bureau of Automotive Repair"}}})
    write(os.path.join(root, "kb", "exhibits_review.json"), {"held": [{"raw": "Held", "title": "Held Proposal", "issuer": ""}]})
    write(os.path.join(root, "kb", "exhibits_adoption.json"), {"credentials": {"ASE A5 — Brakes": {"a": {"3": [], "9": []}}}})
    write(os.path.join(root, "kb", "exhibits_sweep.json"),
          {"cards": [{"current": "Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)"}]})
    write(os.path.join(root, "kb", "credential_review_overlay.json"), {"overrides": overlay or {}})
    write(os.path.join(root, "kb", "cred_rename_out", "2026-07-08", "alias_map.json"),
          {"_applied_at": "2026-07-08T12:00:00Z", "renames": {"Guitar I": "Guitar One"}, "merges": {}})
    write(os.path.join(root, "kb", "cred_rename_out", "2026-10-01", "alias_map.json"),
          {"_applied_at": "2026-10-01T12:00:00Z", "renames": {"Guitar One": "Guitar 1"}, "merges": {"Class Guitar": "Guitar 1"}})
    write(os.path.join(root, "kb", "cred_rename_out", "2026-11-01", "alias_map.json"),
          {"renames": {"Never Applied": "Guitar 1"}, "merges": {}})


tmp = tempfile.mkdtemp(prefix="cert-naming-test-")
try:
    fixture(tmp)
    before = {f: digest(os.path.join(tmp, "kb", f)) for f in ("unified_titles.json", "credentials.json")}
    d = rel.build(tmp)
    after = {f: digest(os.path.join(tmp, "kb", f)) for f in before}
    check("building the batch renames nothing: the reference's files are untouched", before == after)
    b = d["batches"][0]
    rows = {r["current"]: r for r in b["rows"]}
    check("the batch is ASE's, in the format's words", b["id"] == "ase" and b["format"] == "<Official cert name> (ASE <code>)")
    check("a title already in the format is counted and left out", b["fits"] == 1 and "Engine Repair (ASE A1)" not in rows)
    check("a title with its own open card in Another look is left to that card",
          b["left_to_cards"] == 1 and not any("P1" in t for t in rows))
    r = rows.get("ASE A5 — Brakes") or {}
    check("a row carries the current and proposed titles, the local titles, the colleges that articulate it and its exhibits",
          r.get("proposed") == "Brakes (ASE A5)" and r.get("locals") == 2 and r.get("adopted") == 2 and len(r.get("ids") or []) == 2, r)
    r2 = rows.get("Automotive Technology (ASE A5 Brakes)") or {}
    check("two titles for one certification share a proposed title; ASE's own title leads and the other folds into it",
          r.get("merge") is False and r2.get("merge") is True and r2.get("twins") == ["ASE A5 — Brakes"]
          and "one of 2 titles" in r2.get("why", ""), (r, r2))
    r3 = rows.get("ASE Bundle — A4, A5") or {}
    check("a bundle is listed with no proposed title", r3.get("kind") == "several" and r3.get("proposed") == "", r3)
    check("every undecided row is marked rename pending for the side panel",
          d["pending"].get("ASE A5 — Brakes") == "Brakes (ASE A5)" and "ASE Bundle — A4, A5" in d["pending"]
          and "Engine Repair (ASE A1)" not in d["pending"])
    check("the families that wait are named", d["waiting"] == ["CompTIA", "AWS", "NCCER"])
    idx = {row[0]: row for row in d["titles"]}
    check("the index carries every title with its issuer, local titles, colleges and whether it is in the reference",
          idx["ASE A5 — Brakes"][1:5] == [d["issuers"].index(ASE), 2, 2, 0], idx["ASE A5 — Brakes"])
    check("a title saved or held but not yet folded is proposed, with its issuer",
          idx["Smog Check Inspector"][4] == 1 and d["issuers"][idx["Smog Check Inspector"][1]] == "Bureau of Automotive Repair"
          and idx["Held Proposal"][4] == 1)
    check("a renamed title keeps the names it carried, oldest first, through a second rename and a merge",
          idx["Guitar 1"][5] == ["Guitar I", "Guitar One", "Class Guitar"], idx["Guitar 1"])
    aka = credential_aliases.load(tmp)
    check("a snapshot that was never applied names no alias", "Never Applied" not in aka.get("Guitar 1", []) and "Guitar One" not in aka)

    # A saved approval or a skip takes a row out; nothing else does.
    fixture(tmp, {"ASE A5 — Brakes": {"unified_title_override": "Brakes (ASE A5)"},
                  "Automotive Technology (ASE A7 Heating and Air Conditioning)": {"cert_rename_kept": "Heating and Air Conditioning (ASE A7)"},
                  "ASE Bundle — A4, A5": {"cert_rename_kept": "Some other proposal"}})
    d2 = rel.build(tmp)
    left = [r["current"] for r in d2["batches"][0]["rows"]]
    check("an approved row and a skipped row leave the batch; a skip of some other proposal does not",
          left == ["Automotive Technology (ASE A5 Brakes)", "ASE Bundle — A4, A5"], left)
    check("and the approved title is no longer marked rename pending", "ASE A5 — Brakes" not in d2["pending"])
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── the readers ──
with open(os.path.join(ROOT, "kb", "_apply_credential_review.py"), encoding="utf-8") as f:
    sync = f.read()
check("the sync carries a skipped row to the overlay, and a skip does not stamp the credential as reviewed",
      '"cert_rename_kept"' in sync and "DECISION_ONLY" in sync)
with open(os.path.join(ROOT, "kb", "_build_adopt_page.py"), encoding="utf-8") as f:
    adopt = f.read()
with open(os.path.join(ROOT, "library", "adopt", "adopt.js"), encoding="utf-8") as f:
    adopt_js = f.read()
check("the public Credential Catalog carries the earlier titles and searches them",
      'rec["aka"] = aka[ut]' in adopt and '(c.aka || []).join(" ")' in adopt_js)
with open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8") as f:
    gov = f.read()
check("the skip field is mapped to the decision right the other Exhibits fields carry", '"field:kb_curation.cert_rename_kept": "DR-07"' in gov)
for wf in ("cer-procedures.yml", "daily-dashboard.yml"):
    with open(os.path.join(ROOT, ".github", "workflows", wf), encoding="utf-8") as f:
        y = f.read()
    check(wf + " builds the related titles after Another look and commits the file",
          y.index("_sweep_exhibit_titles.py") < y.index("_build_exhibits_related.py") and "git add kb/exhibits_related.json" in y)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:500]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
