#!/usr/bin/env python3
"""Guards for rules G and M in kb/_ccr_confidence_score.py and their apply, kb/_ccr_confidence_apply.py (S683; issue
3480 Sources 14 and 15, COBIx yes 2026-11-17 2:43 and 2:50 PM PT).

  G  "the colleges outvote the description": a waiting card held back only by its description reading clearly as
     another field is accepted, keeping its guess, when its colleges file it under the guess. Guards: past rulings
     (Art read as Art History) and noncredit (a noncredit card read as a noncredit field).
  M  the Music vs Commercial Music title split: Commercial Music words only move a waiting Music card to Commercial
     Music; Music words only keep it as Music; both or neither, it stays waiting.

The asks' cases were measured on the Courses bot's version 5 scorer, which never reached the repo; main's scorer is
a rebuild (#3467), so a case whose signals differ here is pinned to what main measures, and the rule's logic is
pinned on the ask's own figures with a unit case:
  - MUSI M1046 scores 79 on main (its subject codes land split between Music and Commercial Music in practice), under
    G's bar of 80; with version 5's figures (95) G accepts it.
  - ARTS M1002 is already auto-accepted by main's base scorer; the past-rulings guard is pinned on version 5's
    figures and on every card main's run holds back with it.
  - MUSI M1226 "College Symphony Orchestra" is out of M's scope on main: no signal names Commercial Music (the
    title word "College" names another field and the description reads as Electricity). It stays Music, waiting.
  - MUSI M1617 "Commercial/Jazz Theory and Musicianship" is out of M's scope on main too (no signal names Commercial
    Music), so it stays waiting for that reason; its title's "both" call, the ask's reason, is pinned as a unit case.

Self-recall (second reader on #3513): M's two word lists are a title matcher, so they are scored on every trusted
Music and Commercial Music card (a person or the subject map set the field): no wrong call, at least 40 right. G
makes no call on the held-out decided cards (no decided card meets its bar), so its only evidence is the sample the
PR reads; the test prints that count so the empty pass shows.

A move needs its code: the apply refuses a move whose card's SUBJ4 is not the new field's (rule M's MUSI moves to
Commercial Music, MUSC), so the field's most common code stays MUSC; the moves go to a re-mint worklist. The undo
resolves receipt ids through the alias maps applied since the apply, and reports an id it cannot find.

Flags (Sam's flag-and-hide rule, #3519): a card kb/_flags.py hidden_card_ids() names (retired, inactive, not
applicable) goes to the scorer's flagged band, so G and M never decide it and the apply refuses to stamp it; both files
import the one reader, never a copy; a card a named person reviewed stays in and is scored; a flag file stamped before
the latest re-mint is set aside. The undo reports cards that still hold their before-values as never stamped, on a
line of their own.

Also: nothing moves into Sam's band and nothing leaves auto-accept; G never changes a discipline and M changes only
Music to Commercial Music; a held, ruled or merged card is never decided by G or M; the notes are plain words; the
auditor counts the stamps as machine-decided, and a person's overlay discipline wins; and each --undo --rule
restores exactly its own cards (a fixture receipt, then the committed data on a scratch copy, byte for byte).

Run from repo root: python3 tests/ccr_rules_g_m_test.py
"""
import contextlib
import io
import json
import os
import re
import shutil
import sys
import tempfile
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
os.chdir(ROOT)
import _ccr_confidence_score as M  # noqa: E402
import _ccr_confidence_apply as A  # noqa: E402
import _row_audit as RA  # noqa: E402
import _flags as F  # noqa: E402
import plain_words  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), str(why)))


def card(score=95, agree=3, desc="Ethnic Studies_clear", title=None, narrow=None, contra=None, share=1.0,
         own="agree", colleges=4, members=4, colleges_sig="agree", mapped_colleges=None):
    """A scored card in score_card's shape, for the unit cases."""
    sig = {"own": own, "colleges": colleges_sig, "desc": desc}
    if title:
        sig["title"] = title
    if narrow:
        sig["narrow"] = narrow
    c = Counter(contra if contra is not None else ({desc.rsplit("_", 1)[0]: 1} if not desc.startswith("agree") else {}))
    return {"score": score, "agree": agree, "read": True, "signals": sig, "narrow": narrow, "contra": c,
            "subj_share": share, "colleges": colleges, "members": members,
            "mapped_colleges": colleges if mapped_colleges is None else mapped_colleges}


prec = json.load(open(os.path.join(ROOT, "kb", "ccr_curator_precedent.json")))["pairs"]

# ── rule G, unit cases on the ask's figures ──
check("(G) ⭐ MUSI M1046 on version 5's figures (95, four colleges, read as Ethnic Studies): accepted",
      M.rule_g("MUSI M1046", "Music", card(), prec) == ("accept", "Ethnic Studies"))
check("(G) ⭐ ARTS M1002 on version 5's figures (Art read as Art History): the past-rulings guard keeps it waiting",
      M.rule_g("ARTS M1002", "Art", card(87, desc="Art History_clear", colleges=2), prec)[0] == "past_rulings")
check("(G) ⭐ MATH M9037 (read as Mathematics-Basic Skills: Noncredit): the noncredit guard keeps it waiting",
      M.rule_g("MATH M9037", "Mathematics", card(92, desc="Mathematics-Basic Skills: Noncredit_clear", colleges=2),
               prec)[0] == "noncredit")
check("(G) the noncredit guard needs a noncredit card: a credit card read as a noncredit field is accepted",
      M.rule_g("MATH M1037", "Mathematics", card(92, desc="Mathematics-Basic Skills: Noncredit_clear", colleges=2),
               prec)[0] == "accept")
for name, kw in (("a score under 80", {"score": 79}), ("one agreeing signal", {"agree": 1}),
                 ("a description that agrees", {"desc": "agree_clear"}), ("a close reading", {"desc": "Ethnic Studies_close"}),
                 ("a title that names another field", {"title": "History"}), ("a narrower field named", {"narrow": "Commercial Music"}),
                 ("a field named twice", {"contra": {"Ethnic Studies": 2}}), ("under three-quarters of the subject codes", {"share": 0.7}),
                 ("no mapped subject code", {"share": None}), ("its own subject points elsewhere", {"own": "History"}),
                 ("one college", {"colleges": 1}),
                 ("one college's subject code mapped of four that teach it", {"mapped_colleges": 1})):
    check("(G) does not apply with %s" % name, M.rule_g("MUSI M1046", "Music", card(**kw), prec)[0] is None)
check("(G) the business-family hold: Business read as Accounting is not accepted",
      M.rule_g("BUSI M1001", "Business", card(desc="Accounting_clear"), prec)[0] is None)
check("(G) the past-rulings guard counts a held-out card's own ruling out",
      M.past_rulings_lean(prec, "Art", "Art History") and
      M.past_rulings_lean(prec, "Art", "Art History", leave_out=("Art", "Art History")))
note = M.g_note("Music", "Ethnic Studies")
check("(G) the reason in plain words, as the ask words it",
      note == "Kept as Music: the colleges that teach it file it under Music. Its description also touches another "
              "field (Ethnic Studies), but nothing else points there.", note)

# ── rule M, unit cases ──
for t, call in (("Recording Arts", "Commercial Music"), ("The Music Business", "Commercial Music"),
                ("College Symphony Orchestra", "Music"), ("Commercial/Jazz Theory and Musicianship", "both"),
                ("Studio Band", "neither"), ("American Popular Music", "Music"),
                ("History of Rap and Hip-Hop", "Music"), ("Live Sound", "Commercial Music"),
                ("Electronic Music Ensemble", "both"), ("Intro to MIDI", "Commercial Music"),
                ("Beginning Recorder", "neither"), ("Recorder Ensemble", "Music"),
                ("Records and Record Labels", "Commercial Music"), ("Instrument Restringing", "neither")):
    check("(M) title call: %r -> %s" % (t, call), M.split_call(t) == call, M.split_call(t))
check("(M) ⭐ MUSI M1617's title, Commercial/Jazz Theory and Musicianship, is a both call: it stays waiting",
      M.split_call("Commercial/Jazz Theory and Musicianship") == "both")
check("(M) the scope: a Music card whose disagreement is with Commercial Music",
      M.m_in_scope("Music", card(desc="Commercial Music_clear")) and M.m_in_scope("Music", card(desc="agree_clear", narrow="Commercial Music"))
      and not M.m_in_scope("Music", card(desc="Electricity_clear")) and not M.m_in_scope("Art", card(desc="Commercial Music_clear"))
      and not M.m_in_scope("Music", card(desc="Commercial Music_clear", members=0)))

# ── the committed data, with and without the membership fix ──
runs = {}
for fix in (False, True):
    tag = "fix" if fix else "base"
    with contextlib.redirect_stdout(io.StringIO()):
        inp = M.Inputs(fill_members=fix)
    ctx = M.context(inp)
    before = dict(M.run(inp, ("FPR",), ctx))
    after = dict(M.run(inp, M.DEFAULT_RULES, ctx))
    runs[tag] = (inp, before, after)
    g = [c for c, r in after.items() if r["rule"] == "G"]
    m = [c for c, r in after.items() if r["rule"] == "M"]
    check("(%s) ⭐ G and M decide cards on the committed data" % tag, len(g) >= 50 and len(m) >= 20, (len(g), len(m)))
    changed = [c for c in after if (after[c]["band"], after[c]["discipline"]) != (before[c]["band"], before[c]["discipline"])]
    check("(%s) ⭐ every change G and M make is waiting -> auto-accept, by G or M" % tag,
          all(before[c]["band"] == "waiting" and after[c]["band"] == "auto_accept" and after[c]["rule"] in ("G", "M")
              for c in changed), [(c, before[c]["band"], after[c]["band"]) for c in changed][:3])
    check("(%s) ⭐ no card goes to Sam's band, and no auto-accepted card leaves it" % tag,
          all(after[c]["band"] == "for_sam" for c in before if before[c]["band"] == "for_sam")
          and sum(1 for r in after.values() if r["band"] == "for_sam") == sum(1 for r in before.values() if r["band"] == "for_sam")
          and all(after[c]["band"] == "auto_accept" for c in before if before[c]["band"] == "auto_accept"))
    check("(%s) G never changes a discipline; M changes only Music to Commercial Music" % tag,
          all(after[c]["discipline"] == after[c]["guess"] for c in g)
          and all(after[c]["guess"] == "Music" and after[c]["discipline"] in ("Music", "Commercial Music") for c in m))
    check("(%s) no held, ruled, merged or not-openable card is decided by G or M" % tag,
          all(not r.get("held") and r["base"] == "waiting" for c, r in after.items() if r["rule"] in ("G", "M")))
    check("(%s) M never decides a card a person renamed" % tag,
          not [c for c in m if M.person_renamed(c, inp.cur)])
    # A Music card read as Commercial Music that the guard holds back is rule M's to decide, as in the ask's lists.
    check("(%s) every card the past-rulings guard holds back leans that way in kb/ccr_curator_precedent.json, and "
          "only M decides one after" % tag,
          all((r["band"] == "waiting" or r["rule"] == "M") and M.past_rulings_lean(inp.precedent, r["guess"], r["reads_as"])
              for r in after.values() if r.get("g_left") == "past rulings moved such cards"))
    check("(%s) every card the noncredit guard keeps waiting is an M9xxx card read as a noncredit field" % tag,
          all(r["band"] == "waiting" and r["mid"].split(" M")[-1].startswith("9") and r["reads_as"].endswith(": Noncredit")
              for r in after.values() if r.get("g_left") == "noncredit card read as a noncredit field"))
    check("(%s) M leaves both-or-neither titles waiting" % tag,
          all(r["band"] == "waiting" and r["discipline"] == "Music" for r in after.values() if r.get("m_call") in ("both", "neither")))
    bad = re.compile(r"\b[A-Z]{3,5} M\d{4}\b|#\d+|\bscore|\bsignal|\bcode\b|\bmodel\b|\bband\b", re.I)
    notes = {after[c]["note"] for c in g + m}
    check("(%s) ⭐ every G and M note is plain words" % tag,
          not [n for n in notes if bad.search(n) or plain_words.offenses(n)], sorted(notes)[:2])

    for mid in ("CRIM M1173", "AUTO M1036"):
        r = after.get(mid, {})
        check("(%s) ⭐ G: %s is accepted, guess kept, marked G" % (tag, mid),
              r.get("band") == "auto_accept" and r.get("rule") == "G" and r.get("discipline") == r.get("guess")
              and r.get("note", "").startswith("Kept as %s: the colleges" % r.get("guess")), json.dumps(r)[:300])
    r = after["MUSI M1046"]
    check("(%s) MUSI M1046 stays waiting on main's rebuild (it scores under 80 here), guess kept" % tag,
          r["band"] == "waiting" and r["discipline"] == "Music" and int(r["score"]) < M.AUTO, r.get("score"))
    r = after["ARTS M1002"]
    check("(%s) ARTS M1002 is not decided by G and stays Art" % tag, r["rule"] != "G" and r["discipline"] == "Art")
    r = after["MATH M9037"]
    check("(%s) ⭐ MATH M9037 stays waiting" % tag, r["band"] == "waiting" and r["rule"] == "" and r["discipline"] == "Mathematics")
    for mid in ("MUSI M1085", "MUSI M1159"):
        r = after.get(mid, {})
        check("(%s) ⭐ M: %s moves to Commercial Music, marked M" % (tag, mid),
              r.get("band") == "auto_accept" and r.get("rule") == "M" and r.get("discipline") == "Commercial Music"
              and r.get("note") == M.M_NOTES["Commercial Music"], json.dumps(r)[:300])
    r = after["MUSI M1226"]
    check("(%s) MUSI M1226 stays Music" % tag, r["discipline"] == "Music" and r["band"] in ("waiting", "auto_accept"))
    r = after["MUSI M1617"]
    check("(%s) ⭐ MUSI M1617 stays waiting as Music" % tag, r["band"] == "waiting" and r["discipline"] == "Music" and r["rule"] == "")

inp, _b, after = runs["fix"]
check("(fix) MATH M9037 is held back by the noncredit guard", after["MATH M9037"].get("g_left", "").startswith("noncredit"))

# ── self-recall ──
tally = Counter()
for cid, (d, _t, rec) in inp.trusted.items():
    if d not in M.M_PAIR:
        continue
    call = M.split_call(M.display_title(cid, rec, inp.cur))
    tally["right" if call == d else "wrong" if call in M.M_NOTES else "no call"] += 1
check("(recall) ⭐ M's word lists on the trusted Music and Commercial Music cards: no wrong call, at least 40 right "
      "(%d right, %d wrong, %d no call)" % (tally["right"], tally["wrong"], tally["no call"]),
      tally["wrong"] == 0 and tally["right"] >= 40, dict(tally))
with contextlib.redirect_stdout(io.StringIO()):
    cal = M.calibrate(inp, M.DEFAULT_RULES)
g_cal, m_cal = cal["per_rule"].get("G", {}), cal["per_rule"].get("M", {})
check("(recall) held out on the %d decided cards, G makes %d calls (%d wrong) and M %d (%d wrong): G's evidence is "
      "the sample reading" % (cal["decided"], sum(g_cal.values()), g_cal.get("wrong", 0), sum(m_cal.values()),
                              m_cal.get("wrong", 0)),
      "G" in cal["per_rule"] and g_cal.get("wrong", 0) == 0 and m_cal.get("wrong", 0) == 0, json.dumps(cal))

# ── flagged cards stay out (a fixture flag set over the committed data) ──
check("(flags) ⭐ the scorer and the apply import kb/_flags.py's hidden_card_ids, never a copy",
      M.hidden_card_ids is F.hidden_card_ids and A.hidden_card_ids is F.hidden_card_ids
      and not [p for p in ("kb/_ccr_confidence_score.py", "kb/_ccr_confidence_apply.py")
               if re.search(r"^def hidden_card_ids", open(os.path.join(ROOT, p)).read(), re.M)])
check("(flags) the scorer reads the committed flags", inp.flagged == F.hidden_card_ids())
g_ids = sorted(c for c, r in after.items() if r["rule"] == "G")
m_ids = sorted(c for c, r in after.items() if r["rule"] == "M")
base_ids = sorted(c for c, r in after.items() if r["base"] == "auto_accept")
pick = {"retired": g_ids[0], "inactive": g_ids[1], "not_applicable": m_ids[0], "kept": g_ids[2],
        "base": base_ids[0]}
with tempfile.TemporaryDirectory() as froot:
    os.makedirs(os.path.join(froot, "kb"))
    era = F.current_era()
    A.write(os.path.join(froot, "kb", "coci_curation.json"), {"curations": {
        pick["kept"]: {"reviewed_by": "curator@example.edu", "reviewed_at": "2026-11-09T00:00:00Z"}}})
    A.write(os.path.join(froot, "kb", "coci_retired_cards.json"), {F.ERA_KEY: era, "cards": {pick["retired"]: {}}})
    A.write(os.path.join(froot, "kb", "coci_inactive_cards.json"),
            {F.ERA_KEY: era, "cards": {pick["inactive"]: {}, pick["kept"]: {}, pick["base"]: {}}})
    A.write(os.path.join(froot, "kb", "coci_not_applicable.json"),
            {F.ERA_KEY: era, "cards": {pick["not_applicable"]: {"kind": "independent"}}, "courses": {}})
    hidden = F.hidden_card_ids(froot)
    check("(flags) the fixture hides four cards and keeps the one a person reviewed",
          hidden == {pick["retired"]: "retired", pick["inactive"]: "inactive", pick["base"]: "inactive",
                     pick["not_applicable"]: "not_applicable"}, hidden)
    saved = inp.flagged
    inp.flagged = hidden
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            fl = dict(M.run(inp, M.DEFAULT_RULES))
    finally:
        inp.flagged = saved
    check("(flags) ⭐ a flagged card G or M would decide goes to the flagged band: never scored, never decided",
          all(fl[pick[k]]["band"] == fl[pick[k]]["base"] == "flagged" and fl[pick[k]]["rule"] == ""
              and fl[pick[k]]["discipline"] == fl[pick[k]]["guess"] and fl[pick[k]]["flag"] == k
              for k in ("retired", "inactive", "not_applicable")), [fl[pick[k]] for k in ("retired", "not_applicable")])
    check("(flags) ⭐ a flagged card the base scorer would accept is out of auto-accept too",
          fl[pick["base"]]["band"] == "flagged" and fl[pick["base"]].get("flag") == "inactive")
    check("(flags) ⭐ a card a person reviewed stays in the counts and G still decides it",
          fl[pick["kept"]]["band"] == "auto_accept" and fl[pick["kept"]]["rule"] == "G")
    check("(flags) the flagged band takes exactly the flagged cards and moves no other",
          {c for c, r in fl.items() if r["band"] == "flagged"} == set(hidden)
          and all((fl[c]["band"], fl[c]["rule"]) == (after[c]["band"], after[c]["rule"])
                  for c in fl if c not in hidden and c not in saved))
    A.write(os.path.join(froot, "kb", "coci_retired_cards.json"),
            {F.ERA_KEY: "kb/an_older_remint/alias_map.json", "cards": {pick["retired"]: {}}})
    with contextlib.redirect_stderr(io.StringIO()) as err:
        stale = F.hidden_card_ids(froot)
    check("(flags) a flag file stamped before the latest re-mint is set aside, so its card comes back",
          pick["retired"] not in stale and pick["inactive"] in stale and "set aside" in err.getvalue())

# ── the auditor ──
g_rec = {"discipline": "Music", "discipline_source": "confidence_v1", "discipline_confidence": 0.87,
         "_confidence_from": {"rule": "G"}}
m_rec = {"discipline": "Commercial Music", "discipline_source": "music_split_v1", "discipline_confidence": 0.8,
         "_confidence_from": {"rule": "M", "from": "Music"}}
for name, rec in (("G", g_rec), ("M", m_rec)):
    st = RA._classify_mid_discipline(rec)
    check("(audit) ⭐ a rule %s stamp is machine-decided, never curated or a seed" % name,
          st["state"] == "machine-decided" and st.get("rule") == name, st)
fields = {"discipline": RA._classify_mid_discipline(m_rec)}
RA._apply_curation_overlay({}, fields, {"discipline": "Music"})
check("(audit) ⭐ a person's overlay discipline replaces the stamp", fields["discipline"] == {"state": "curated", "value": "Music"})
import _ccr_seed_recheck_dryrun as RS  # noqa: E402
check("(audit) the reseed leaves a rule M card alone", RS.curated("X", m_rec, {}))

# ── the apply and its undo, on a fixture ──
# A Music card already on MUSC and an Art card already on ARTH move without a re-mint; MUSI M8 cannot.
fixture = {"_status": "fixture", "courses": {
    "MUSI M1": {"course_id": "MUSI M1", "discipline": "Music", "common_title": "Music in American Culture"},
    "MUSC M2": {"course_id": "MUSC M2", "discipline": "Music", "common_title": "Recording Arts"},
    "MUSI M3": {"course_id": "MUSI M3", "discipline": "Music", "common_title": "College Symphony Orchestra"},
    "ARTH M4": {"course_id": "ARTH M4", "discipline": "Art", "common_title": "History of Art"},
    "CRIM M5": {"course_id": "CRIM M5", "discipline": "Administration of Justice", "common_title": "Criminal Law 2"},
    "KINE M6": {"course_id": "KINE M6", "discipline": "Kinesiology", "common_title": "Swim"},
    "MUSI M8": {"course_id": "MUSI M8", "discipline": "Music", "common_title": "Audio Production"}}, "count": 7}


def row(cid, guess, disc, rule, score=87):
    return (cid, {"mid": cid, "guess": guess, "discipline": disc, "rule": rule, "score": score, "agree": 3,
                  "reasons": "3 of 3 colleges file it under %s" % guess, "note": "a note", "title": "t"})


with tempfile.TemporaryDirectory() as tmp:
    path = os.path.join(tmp, "courses.json")
    out = os.path.join(tmp, "out")
    A.write(path, fixture)
    pristine = open(path, "rb").read()
    with contextlib.redirect_stdout(io.StringIO()):
        g_rows = [row("MUSI M1", "Music", "Music", "G", 95), row("CRIM M5", "Administration of Justice",
                                                                  "Administration of Justice", "G")]
        m_rows = [row("MUSC M2", "Music", "Commercial Music", "M", 77), row("MUSI M3", "Music", "Music", "M", 82)]
        f_rows = [row("ARTH M4", "Art", "Art History", "FPR")]
        check("(apply) ⭐ refuses a move whose card's SUBJ4 is not the new field's code (MUSI to Commercial Music)",
              A.apply("M", m_rows + [row("MUSI M8", "Music", "Commercial Music", "M")], 3, "S0", path, out) == 2
              and open(path, "rb").read() == pristine
              and [o["course_id"] for o in A.needs_remint(m_rows + [row("MUSI M8", "Music", "Commercial Music", "M")],
                                                          fixture["courses"], A.field_codes(fixture["courses"]))]
              == ["MUSI M8"])
        check("(apply) refuses without the expected count", A.apply("G", g_rows, 3, "S0", path, out) == 2
              and open(path, "rb").read() == pristine)
        check("(apply) ⭐ refuses to stamp a flagged card, and writes nothing",
              A.apply("G", g_rows, 2, "S0", path, out, hidden={"CRIM M5": "retired"}) == 2
              and open(path, "rb").read() == pristine and not os.path.exists(out))
        check("(apply) refuses a card that changed under the run",
              A.apply("G", [row("KINE M6", "Nursing", "Nursing", "G")], 1, "S0", path, out) == 2
              and open(path, "rb").read() == pristine)
        ok = (A.apply("G", g_rows, 2, "S0", path, out) == 0 and A.apply("M", m_rows, 2, "S0", path, out) == 0
              and A.apply("FPR", f_rows, 1, "S0", path, out) == 0)
    doc = A.read(path)["courses"]
    receipts = [os.path.join(out, d, "receipt.json") for d in os.listdir(out)]
    check("(apply) ⭐ three applies, one receipt with each apply's before-values", ok and len(receipts) == 1
          and [e["rule"] for e in A.read(receipts[0])["applies"]] == ["G", "M", "FPR"])
    check("(apply) ⭐ G stamps confidence_v1 with rule G and keeps the discipline",
          doc["MUSI M1"]["discipline"] == "Music" and doc["MUSI M1"]["discipline_source"] == "confidence_v1"
          and doc["MUSI M1"]["discipline_confidence"] == 0.95 and doc["MUSI M1"]["_confidence_from"]["rule"] == "G")
    check("(apply) ⭐ M's move writes Commercial Music, music_split_v1, and the old field",
          doc["MUSC M2"]["discipline"] == "Commercial Music" and doc["MUSC M2"]["discipline_source"] == "music_split_v1"
          and doc["MUSC M2"]["_confidence_from"]["from"] == "Music" and doc["MUSC M2"]["_confidence_from"]["rule"] == "M")
    check("(apply) M's keep is confidence_v1, discipline unchanged",
          doc["MUSI M3"]["discipline"] == "Music" and doc["MUSI M3"]["discipline_source"] == "confidence_v1")
    snap_after = A.read(path)
    # A person-equivalent change after the apply: a later run restamps CRIM M5; undo must leave it alone.
    snap_after["courses"]["CRIM M5"]["_confidence_from"] = dict(snap_after["courses"]["CRIM M5"]["_confidence_from"], run="S9")
    A.write(path, snap_after)
    with contextlib.redirect_stdout(io.StringIO()):
        n_g = A.undo("G", receipts, path)
    doc = A.read(path)["courses"]
    check("(undo) ⭐ --undo --rule G restores only its own unchanged cards",
          n_g == (1, 1, 0, 0) and doc["MUSI M1"] == fixture["courses"]["MUSI M1"]
          and doc["CRIM M5"]["_confidence_from"]["run"] == "S9"
          and doc["MUSC M2"]["discipline_source"] == "music_split_v1" and doc["ARTH M4"]["discipline"] == "Art History", n_g)
    with contextlib.redirect_stdout(io.StringIO()):
        n_m = A.undo("M", receipts, path)
    doc = A.read(path)["courses"]
    check("(undo) ⭐ --undo --rule M puts the moved card back to Music and clears both cards' stamps",
          n_m == (2, 0, 0, 0) and doc["MUSC M2"] == fixture["courses"]["MUSC M2"] and doc["MUSI M3"] == fixture["courses"]["MUSI M3"]
          and doc["ARTH M4"]["discipline_source"] == "past_rulings_v1", n_m)
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        again = A.undo("M", receipts, path)
    check("(undo) a second undo restores nothing, and says the cards hold their before-values",
          again == (0, 0, 0, 2) and "2 cards never stamped" in buf.getvalue(), (again, buf.getvalue()))

    # Write order (COBIx on #3513): the receipt lands before the course file, so a failed course write leaves a
    # receipt and no stamps, and the undo leaves those cards alone.
    p2, out_w = os.path.join(tmp, "courses_w.json"), os.path.join(tmp, "out_w")
    A.write(p2, fixture)
    before_w = open(p2, "rb").read()
    real_write = A.write

    def failing_write(target, obj):
        if target == p2:
            raise OSError("disk full")
        real_write(target, obj)
    A.write = failing_write
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            A.apply("G", g_rows, 2, "S0", p2, out_w)
        failed = False
    except OSError:
        failed = True
    finally:
        A.write = real_write
    rw = [os.path.join(out_w, d, "receipt.json") for d in os.listdir(out_w)] if os.path.isdir(out_w) else []
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        n_w = A.undo("G", rw, p2) if rw else None
    check("(apply) a failed course write leaves the receipt, no stamps, and an undo that touches nothing",
          failed and len(rw) == 1 and open(p2, "rb").read() == before_w and n_w == (0, 0, 0, 2)
          and not [f for f in os.listdir(tmp) if f.endswith(".tmp")], (failed, rw, n_w))
    out_lines = buf.getvalue().splitlines()
    check("(undo) ⭐ after a failed course write, the never-stamped cards get their own line, not 'changed since'",
          out_lines[0] == "rule G: restored 0 cards, left 0 alone (changed since), 0 not found"
          and out_lines[1].startswith("rule G: 2 cards never stamped: each still holds its before-values"),
          out_lines)

    # A re-mint between the apply and the undo: MUSC M2 becomes MUSC M7 under a new alias map.
    import alias_chain as AC  # noqa: E402
    with contextlib.redirect_stdout(io.StringIO()):
        A.apply("M", m_rows, 2, "S1", path, os.path.join(tmp, "out3"))
    receipts = [os.path.join(tmp, "out3", d, "receipt.json") for d in os.listdir(os.path.join(tmp, "out3"))]
    d = A.read(path)
    d["courses"]["MUSC M7"] = dict(d["courses"].pop("MUSC M2"), course_id="MUSC M7")
    A.write(path, d)
    amap = os.path.join(tmp, "alias_map.json")
    A.write(amap, {"alias": {"MUSC M2": "MUSC M7"}})
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        lost = A.undo("M", receipts, path)
    check("(undo) ⭐ a card re-minted after the apply and not in the chain is reported as not found, apart from a "
          "changed one", lost == (1, 0, 1, 0) and A.read(path)["courses"]["MUSC M7"]["discipline"] == "Commercial Music", lost)
    check("(undo) a partial undo says so", buf.getvalue().startswith("PARTIAL undo, rule M: restored 1"), buf.getvalue())
    with contextlib.redirect_stdout(io.StringIO()):
        found = A.undo("M", receipts, path, chain=AC.ALIAS_MAPS + [amap])
    doc = A.read(path)["courses"]
    check("(undo) ⭐ resolved through the alias chain, the re-minted card is found and restored to Music",
          found[0] == 1 and found[2] == 0 and doc["MUSC M7"]["discipline"] == "Music"
          and "_confidence_from" not in doc["MUSC M7"], found)

    # ── the committed data on a scratch copy: apply G and M, undo each, byte for byte ──
    real = os.path.join(tmp, "coci_minted_courses.json")
    shutil.copyfile(A.COURSES, real)
    orig = open(real, "rb").read()
    out2 = os.path.join(tmp, "out2")
    with contextlib.redirect_stdout(io.StringIO()):
        gd, md_all = A.decisions("G", True), A.decisions("M", True)
        md = [(c, r) for c, r in md_all if r["discipline"] == r["guess"]]
        refused = A.apply("M", md_all, len(md_all), "test", real, out2, True) == 2
    courses0 = A.read(real)["courses"]
    check("(real) ⭐ the scorer's G and M decisions name no flagged card",
          not ({c for c, _r in gd + md_all} & set(F.hidden_card_ids())))
    off = A.needs_remint(md_all, courses0, A.field_codes(courses0))
    moves = [c for c, r in md_all if r["discipline"] != r["guess"]]
    check("(real) ⭐ the apply refuses rule M's moves until they are re-minted (%d of %d moves need it), and writes "
          "nothing" % (len(off), len(moves)),
          refused and open(real, "rb").read() == orig and off and all(o["field_code"] == "MUSC" for o in off)
          and {o["course_id"] for o in off} == {c for c in moves if courses0[c].get("subject_4letter") != "MUSC"})

    def cm_modal(courses):
        return RA._build_disc_to_modal_subj4(courses).get("Commercial Music")

    unguarded = json.loads(json.dumps(courses0))
    for c, r in md_all:
        unguarded[c]["discipline"] = r["discipline"]
    check("(real) without the guard, M's moves would flip Commercial Music's most common code to MUSI",
          cm_modal(courses0) in (None, "MUSC") and cm_modal(unguarded) == "MUSI", (cm_modal(courses0), cm_modal(unguarded)))
    with contextlib.redirect_stdout(io.StringIO()):
        okg = A.apply("G", gd, len(gd), "test", real, out2, True) == 0
        okm = A.apply("M", md, len(md), "test", real, out2, True) == 0
    rc = [os.path.join(out2, d, "receipt.json") for d in os.listdir(out2)]
    stamped = A.read(real)["courses"]
    check("(real) ⭐ after G and M's keeps, Commercial Music's most common code stays MUSC",
          cm_modal(stamped) in (None, "MUSC"), cm_modal(stamped))
    check("(real) ⭐ the apply stamps exactly the scorer's G cards and M's keeps",
          okg and okm and {c for c, r in stamped.items() if isinstance(r, dict) and (r.get("_confidence_from") or {}).get("rule") == "G"} == {c for c, _r in gd}
          and {c for c, r in stamped.items() if isinstance(r, dict) and (r.get("_confidence_from") or {}).get("rule") == "M"} == {c for c, _r in md})
    with contextlib.redirect_stdout(io.StringIO()):
        A.undo("M", rc, real)
    mid_state = A.read(real)["courses"]
    check("(real) undoing M leaves every G stamp in place",
          all((mid_state[c].get("_confidence_from") or {}).get("rule") == "G" for c, _r in gd)
          and not any((mid_state[c].get("_confidence_from") or {}).get("rule") == "M" for c, _r in md))
    with contextlib.redirect_stdout(io.StringIO()):
        A.undo("G", rc, real)
    check("(real) ⭐ undoing G then M restores the committed file byte for byte", open(real, "rb").read() == orig)

fails = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  PASS " if ok else "  FAIL ") + name + ("" if ok else "  " + why[:400]))
print("ccr_rules_g_m_test.py: %d/%d passed" % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
