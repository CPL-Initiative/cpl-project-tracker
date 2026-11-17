#!/usr/bin/env python3
"""Guards for kb/_ccr_confidence_score.py: the membership fix and tonight's three rules (issues 3454 and 3447; COBIx's
item 3 for S678). It runs the scorer on the committed data, so it pins rules and invariants rather than counts that
drift with the nightly files:

  1. The membership fix: the seedless cards with no minted membership (4,036 on 2026-11-17) read their courses from
     unified_courses_members.js, leaving only cards the List's file does not carry; the partition the scorer shares
     with the asks holds (merged away, not openable, ruled).
  2. A person always wins: a ruled or merged card is never moved by a rule, and no rule changes a ruled card's field.
  3. Rule W: a title word that names another field is excused by an anchor word for the guess (the asks' cases
     ATHL M1180 "women" and DANC M1223 "musical"); the named word is never its own anchor; a second contrary word
     still counts; no card the base scorer auto-accepts leaves auto-accept.
  4. Variant D: HIST M1032 and ITIS M1034 keep their guess; ITIS M1330 goes to Sam proposing Computer Science; D never
     changes a discipline and touches only its six pairs.
  5. Follow past rulings: the five pairs come from kb/ccr_curator_precedent.json by the selection rule; ARTS M1005,
     ARTS M1186 and BUSI M1137 move to the narrower field with the note; ARTS M1002 (title check) and BUSI M1035
     (business-family hold) do not; only this rule changes a discipline.
  6. Held out, the rules add no wrong auto-accept on the cards a person decided.
  7. Reason text is plain words: no M-ID, score, issue number, or the words signal, code, model or band.

Run from repo root: python3 tests/ccr_confidence_rules_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
os.chdir(ROOT)
import _ccr_confidence_score as M  # noqa: E402
import _ccr_desc_signal as S  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), str(why)))


# ── unit checks, no data ──
stems = {"surgica": {"Surgical Technology"}, "women": {"Women's Studies"}, "history": {"Art History", "History"},
         "account": {"Accounting"}}
anchors = {"nursing": "Nursing", "soccer": "Kinesiology"}
check("(3) without rule W a named word counts against the guess",
      M.title_names("Medical-Surgical Nursing", "Nursing", stems)[0] == "Surgical Technology")
check("(3) ⭐ rule W excuses it when the title holds an anchor for the guess",
      M.title_names("Medical-Surgical Nursing", "Nursing", stems, anchors) == (None, [("surgical", "Surgical Technology")]))
check("(3) the named word is never its own anchor",
      M.title_names("Surgical Care", "Nursing", stems, {"surgica": "Nursing"})[0] == "Surgical Technology")
# "women" is excused by the anchor "soccer"; the scan goes on, and "soccer" (which here also names a field) has no
# anchor but itself, so it still counts.
check("(3) the scan goes on past an excused word, and a second contrary word still counts",
      M.title_names("Women's Soccer", "Kinesiology", dict(stems, soccer={"Soccer Studies"}), {"soccer": "Kinesiology"})
      == ("Soccer Studies", [("women", "Women's Studies")]))
check("(3) an anchor for another field excuses nothing",
      M.title_names("Women's Soccer", "Dance", stems, anchors)[0] == "Women's Studies")
trusted = {"a%d" % i: ("Nursing", "Nursing Care %d" % i, {}) for i in range(4)}
trusted["b"] = ("Kinesiology", "Nursing Mothers Fitness", {})
check("(3) an anchor needs 3+ trusted titles, 80%+ one field", M.anchor_table(trusted).get("nursing") == "Nursing")
trusted["c"] = ("Health Care Ancillaries", "Nursing Assistant", {})
check("(3) under 80% it is no anchor", "nursing" not in M.anchor_table(trusted))

for t, f, ok in (("History of Western Art - 19th Century to Contemporary Times", "Art History", True),
                 ("Fiber Sculpture 1", "Art History", False), ("Ceramics Studio", "Art History", False),
                 ("Beginning Graphic Design", "Graphic Arts", True), ("Advanced Etching", "Photography", False),
                 ("Microsoft Word: Beginning", "Office Technologies", True),
                 ("Social Media for Business", "Office Technologies", False),
                 ("Small Scale Metal/Jewelry Fabrication 1", "Photography", False),
                 ("Introduction to SolidWorks", "Drafting/CADD", True)):
    check("(5) title check: %r %s %s" % (t, "names" if ok else "does not name", f), M.fpr_title_ok(t, f) is ok)

prec = json.load(open(os.path.join(ROOT, "kb", "ccr_curator_precedent.json")))["pairs"]
check("(5) ⭐ the selection rule picks exactly the five pairs",
      set(M.fpr_pairs(prec)) == {("Art", "Art History"), ("Art", "Graphic Arts"), ("Art", "Photography"),
                                 ("Business", "Office Technologies"), ("Manufacturing Technology", "Drafting/CADD")},
      sorted(M.fpr_pairs(prec)))
check("(4) D and past rulings share no pair", not (M.D_PAIRS & set(M.fpr_pairs(prec))))

# ── the committed data ──
mem = json.load(open(os.path.join(ROOT, "kb", "coci_minted_memberships.json")))
mem = mem.get("memberships", mem)
inp = M.Inputs(fill_members=True)
seed = dict(M.seedless(inp))
gap_before = sum(1 for k in seed if not mem.get(k))
gap_after = sum(1 for k in seed if not inp.mem.get(k))
check("(1) ⭐ the membership fix fills the seedless cards the minted memberships lack",
      gap_before > 3000 and gap_after < 200 and all(k not in inp.list_members or inp.list_members[k] == []
                                                     for k in seed if not inp.mem.get(k)),
      "%d -> %d" % (gap_before, gap_after))
check("(1) the fix never replaces a card's own minted membership",
      all(inp.mem[k] == v for k, v in mem.items() if v and k in inp.mem))

rows = dict(M.run(inp))
by = {}
for cid, r in rows.items():
    by.setdefault(r["band"], []).append(cid)
check("(1) every seedless card is in one band", len(rows) == len(seed) and set(by) <= {
    "ruled", "merged_away", "not_openable", "auto_accept", "for_sam", "waiting"}, sorted(by))
ruled = M.ruled_set(inp.cur)
check("(2) ⭐ the six ruled cards of issue 3447 land in ruled", all(rows[m]["band"] == "ruled" for m in M.RULED_3447))
check("(2) ⭐ no rule moves a ruled, merged or not-openable card",
      all(not r["rule"] and r["discipline"] == r["guess"] for r in rows.values()
          if r["base"] in ("ruled", "merged_away", "not_openable")))
check("(2) no held card is moved by a rule", all(not r["rule"] for r in rows.values() if r.get("held")))
check("(3) ⭐ no card the base auto-accepts leaves auto-accept",
      all(r["band"] == "auto_accept" for r in rows.values() if r["base"] == "auto_accept"))
for mid in ("ATHL M1180", "DANC M1223"):
    r = rows.get(mid, {})
    check("(3) ⭐ rule W: %s moves from waiting to auto-accept, guess kept" % mid,
          r.get("base") == "waiting" and r.get("band") == "auto_accept" and r.get("rule") == "W"
          and r.get("discipline") == r.get("guess"), json.dumps(r)[:400])
check("(3) a card rule W moves carries the plain note on the excused word",
      all(re.search(r"describes an? ", r["reasons"]) and "does not point to" in r["reasons"]
          for r in rows.values() if r["rule"] == "W" and r["band"] == "auto_accept"))
for mid, guess in (("HIST M1032", "History"), ("ITIS M1034", "Computer Information Systems")):
    r = rows.get(mid, {})
    check("(4) ⭐ D: %s is auto-accepted and stays %s" % (mid, guess),
          r.get("band") == "auto_accept" and r.get("rule") == "D" and r.get("discipline") == guess
          and r.get("note", "").startswith("Most of the colleges"), json.dumps(r)[:400])
r = rows.get("ITIS M1330", {})
check("(4) ⭐ D: ITIS M1330 goes to Sam proposing Computer Science, discipline unchanged",
      r.get("band") == "for_sam" and r.get("rule") == "D" and r.get("proposed") == "Computer Science"
      and r.get("discipline") == "Computer Information Systems", json.dumps(r)[:400])
check("(4) D never changes a discipline", all(r["discipline"] == r["guess"] for r in rows.values() if r["rule"] == "D"))
for mid, to in (("ARTS M1005", "Art History"), ("ARTS M1186", "Graphic Arts"), ("BUSI M1137", "Office Technologies")):
    r = rows.get(mid, {})
    check("(5) ⭐ past rulings: %s moves to %s with the note" % (mid, to),
          r.get("band") == "auto_accept" and r.get("rule") == "FPR" and r.get("discipline") == to
          and "following past rulings" in r.get("note", "") and "Sam can change it" in r.get("note", ""),
          json.dumps(r)[:400])
for mid in ("ARTS M1002", "BUSI M1035"):
    r = rows.get(mid, {})
    check("(5) past rulings leave %s alone" % mid, r.get("rule") != "FPR" and r.get("discipline") == r.get("guess"),
          json.dumps(r)[:400])
check("(5) only past rulings changes a discipline, and only to its pair's narrower field",
      all(r["rule"] == "FPR" and (r["guess"], r["discipline"]) in inp.fpr_pairs
          for r in rows.values() if r["discipline"] != r["guess"]))
check("(5) every rule move starts from waiting (Sam's band only loses cards to W)",
      all(r["base"] == "waiting" or (r["rule"] == "W" and r["base"] == "for_sam") for r in rows.values() if r["rule"]))

bad = re.compile(r"\b[A-Z]{3,5} M\d{4}\b|#\d+|\bscore|\bsignal|\bcode\b|\bmodel\b|\bband\b", re.I)
plain = [r for r in rows.values() if bad.search(r.get("reasons", "") + " " + r.get("note", ""))]
check("(7) ⭐ reasons and notes are plain words", not plain, plain[:1] and plain[0].get("reasons"))

cal = M.calibrate(inp, ("W", "D", "FPR"))
check("(6) ⭐ held out, the rules add no wrong auto-accept on the decided cards",
      cal["rules"].get("wrong", 0) <= cal["base"].get("wrong", 0), json.dumps(cal))

fails = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  PASS " if ok else "  FAIL ") + name + ("" if ok else "  " + why[:400]))
print("ccr_confidence_rules_test.py: %d/%d passed" % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
