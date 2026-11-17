#!/usr/bin/env python3
"""The discipline confidence scorer for the Common Course Reference's seedless cards (issues 3454 and 3447; COBIx's
item 3, "Courses: rulings stick, and three rules clear the waiting pile", S678).

A seedless card's discipline is the first machine guess, never re-checked (12,540 cards on 2026-11-17). This script
reads committed files only, scores each seedless card against the evidence, and puts it in one band:

  1. ruled           Sam (or a curator) ruled on it in the Discipline in doubt panel: final, never reopened by a rule.
  2. merged_away     the overlay folds it into another card.
  3. not_openable    the Courses List's file (unified_courses_members.js) does not carry it.
  4. auto_accept     score 80 or more, two agreeing signals, nothing clearly contrary, something to read, not held.
  5. for_sam         score 25 or less, with the same other field named by two or more signals.
  6. waiting         everything else.

Then three rules run on the waiting pile, each on different cards (COBIx, 2026-11-17 12:06 and 12:19 PM PT):

  W    anchor words. A title word that names another discipline does not count against guess D when the title also
       holds an anchor word for D (5+ letters, not generic, compared on its first 7 letters, in 3+ trusted titles,
       80%+ of them D). The named word is never its own anchor; the scan continues past an excused word.
  D    the pair default, on six fixed pairs: when two or more colleges vote and two-thirds keep the guess, the machine
       accepts it; two-thirds for the other field, or an even split, sends it to Sam with that field proposed.
  FPR  follow past rulings, on the five pairs where people always moved such cards to the narrower field
       (kb/ccr_curator_precedent.json: 3+ moves, no keep; Music vs Commercial Music and the business-family pairs left
       out), and only when the title names the narrower field. The discipline changes, source `past_rulings_v1`.
  Rule T (the 27 missing TOP codes) is held by COBIx and is not here.

Read-only: it writes no curation row, changes no discipline and edits no local MAP title. A person always wins: a
ruled, merged or person-curated card is never scored into a band a rule can move. `--expect N` exits non-zero
unless the auto-accept count equals N, the guard kb/_ccr_confidence_apply.py will carry.

Provenance and what differs from the asks. The Courses bot's version 5 script (`discipline_confidence.py`) never
reached this repo (its workspace is not reachable from a session and no copy was posted on #3464). This file is
built from the written method in the asks on #3464 (ask-sky-discipline-confidence.md sections 4 and 9,
ask-sky-rule-w.md, ask-sky-pair-default-d.md, ask-sky-follow-past-rulings.md, root-cause-waiting.md). The partition
counts it shares with version 5 reproduce exactly (12,540 seedless, 2,019 merged away, 840 not openable, 4,036 with no
minted membership and 113 after the fix); the score itself is a reconstruction, so its band counts differ from
version 5's. The PR that adds it reports both. Not built here: the retired, inactive and not-applicable flags (their
lists live in the bot's evidence folder), the auditor's title-mismatch flag, the C-ID signal and the outline-outcomes
description source.

Run from the repo root:
  python3 kb/_ccr_confidence_score.py                       # today's memberships, all rules
  python3 kb/_ccr_confidence_score.py --fill-members        # the membership fix
  python3 kb/_ccr_confidence_score.py --fill-members --expect 3737
  python3 kb/_ccr_confidence_score.py --no-rules            # the base bands only
  python3 kb/_ccr_confidence_score.py --out DIR             # also write DIR/scores.csv and DIR/summary.json
"""
import argparse
import contextlib
import csv
import io
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

AUTO, SAM_MAX = 80, 25
CAP_ONE_SIGNAL = 79

# Sam's six Keeps of 9 November (issue 3447) whose rows never saved: they are ruled whatever the overlay says until
# the backfill lands, and the overlay's `ruling` (kb/_apply_curation.py) covers every later one.
RULED_3447 = ("KINE M1152", "KINE M1524", "KINE M1553", "KINE M1568", "KINE M1762", "KINE M1847")

# COBIx's holds (#3454, 2026-11-17 5:52 and 8:26 AM PT).
HOLD_ALSO = {"COMP M9044", "COMP M9056", "COMP M9039", "COMP M9073"}
HOLD_NONCREDIT_PREFIXES = ("COMP", "VOCE")
NONCREDIT = {"Noncredit", "Noncredit Enhanced"}

# A title points to a narrower field inside an umbrella guess: the narrow field is proposed and the card never
# auto-accepts (version 2; the business-family hold). Subject codes read as the narrow field inside the scorer only;
# kb/reference/subject_discipline_map.json is not changed.
NARROW_SUBJ = {c: "Accounting" for c in ("ACCT", "ACCTG", "ACC", "ACCOUNT", "ACCTNG", "ACTG")}
NARROW_SUBJ.update({c: "Marketing" for c in ("MKT", "MARK", "MRKT")})
NARROW_SUBJ.update({"MNGT": "Management", "CMUS": "Commercial Music"})
COMPUTER = ("Computer Science", "Computer Information Systems")
UMBRELLA = {"Business": ("Accounting", "Marketing", "Management"), "Music": ("Commercial Music",),
            "Computer Science": ("Computer Service Technology",),
            "Computer Information Systems": ("Computer Service Technology",),
            "Physical Sciences": ("Earth Science",), "Geography": ("Earth Science",)}
NARROW_KW = {
    "Accounting": r"\b(accounting|bookkeeping|payroll|income tax|tax preparation|taxation|auditing|quickbooks)\b",
    "Marketing": r"\b(marketing|salesmanship|sales|advertising|retailing)\b",
    "Management": r"\b(management|supervision|supervisory|leadership)\b",
    "Commercial Music": r"\b(music business|music industry|recording|audio production|songwriting|music technology|"
                        r"electronic music|midi|commercial music|pro tools)\b",
    "Computer Service Technology": r"\b(a\+|computer repair|pc repair|hardware maintenance|computer maintenance|"
                                   r"computer service)\b",
    "Earth Science": r"\b(geology|earth science|earthquakes?|volcan\w*|mineral\w*|oceanograph\w*)\b",
}

# Words that never name a discipline by themselves (title check and anchors).
GENERIC = set("""introduction introductory intro beginning beginner intermediate advanced fundamentals fundamental
principles principle special topics topic studies study general applied applications application technology
technologies technical science sciences education development basic basics concepts theory theories practice
practicum practices seminar workshop selected issues survey methods method skills skill systems system program
programs course courses level levels part laboratory honors elementary contemporary modern american california
english""".split())

# Rule D's six pairs (guess, other field), fixed (ask-sky-pair-default-d.md).
D_PAIRS = {("History", "Ethnic Studies"), ("Computer Information Systems", "Computer Science"),
           ("Computer Information Systems", "Office Technologies"),
           ("Dietetics/Nutritional Science", "Culinary Arts/Food Technology"),
           ("Nursing", "Health Care Ancillaries"),
           ("Parent Education: Noncredit", "Child Development/Early Childhood Education")}

# "Follow past rulings": the selection rule, and the pairs it leaves out by COBIx's word.
FPR_MIN_MOVES = 3
FPR_EXCLUDED = {("Music", "Commercial Music"), ("Business", "Accounting"), ("Business", "Marketing")}
# The title check: the title names the narrower field (NAMES) and no studio or neighboring practice (BUT_NOT).
_I = re.IGNORECASE
FPR_TITLE = {
    "Art History": ([r"\bhistory\b", r"\bsurvey\b", r"\barts? of\b", r"\bmuseum", r"\bgaller", r"\bexhibition",
                     r"\bworld art\b"],
                    [r"\bstudio\b", r"\bceramic", r"\bsculpt", r"\bportfolio", r"\bdrawing", r"\bpainting",
                     r"\bjewelry", r"\bmetal", r"\bfabrication", r"\betching", r"\bprintmaking"]),
    "Graphic Arts": ([r"\bgraphic", r"\btypograph", r"\blayout", r"\bindesign\b", r"\billustrator\b", r"\bpre-?press",
                      r"\bweb design", r"\bui/ux\b", r"\binteraction design", r"\bprint design", r"\bletter ?forms?\b"],
                     [r"\bceramic", r"\betching", r"\bprintmaking", r"\bscreen ?print", r"\bphotoshop",
                      r"\bdrawing", r"\bpainting"]),
    "Photography": ([r"\bphotograph", r"\bphoto", r"\bdarkroom", r"\bcamera", r"\bdrone"],
                    [r"\bjewelry", r"\bmetal", r"\bfabrication", r"\betching", r"\bprintmaking", r"\bscreen ?print",
                     r"\bphotoshop", r"\bdrawing"]),
    "Office Technologies": ([r"\bkeyboard", r"\bword processing", r"\bmicrosoft\b", r"(?-i:\bWord\b)",
                             r"\bspreadsheet", r"\bexcel\b", r"\boffice\b", r"\bsecretar", r"\bpc applications",
                             r"\bcomputer applications", r"\bcomputer skills", r"\bdocument processing"], []),
    "Drafting/CADD": ([r"(?-i:\bCAD\b)", r"\bcomputer aided design", r"\bcomputer-aided design", r"\bsolidworks",
                       r"\bcreo\b", r"\bautocad", r"(?-i:\bInventor\b)", r"\bsiemens nx\b", r"\bdraft"], []),
}

WORD = re.compile(r"[a-z]+")


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def stem(w):
    return w[:7]


def title_words(title):
    return [w for w in WORD.findall((title or "").lower().replace("'s", "")) if len(w) >= 3]


# ── the inputs ──────────────────────────────────────────────────────────────────────────────────────────────────────

class Inputs:
    """Everything the scorer reads, from committed files."""

    def __init__(self, fill_members=False):
        import _ccr_desc_signal as S
        from _alias_canon import alternate_to_canonical, resolve_target
        self.S = S
        rev = alternate_to_canonical()
        quiet = io.StringIO()
        self.courses = load("kb/coci_minted_courses.json")["courses"]
        self.singles = load("kb/coci_minted_singletons.json")["courses"]
        mem = load("kb/coci_minted_memberships.json")
        mem = mem.get("memberships", mem)
        self.list_members = S.load_list_members(ROOT)
        self.filled = []
        if fill_members:
            mem, self.filled = S.fill_memberships(mem, self.list_members,
                                                  only={k for k in self.courses if not k.startswith("_")})
        self.mem = mem
        self.cur = load("kb/coci_curation.json").get("curations", {})
        with contextlib.redirect_stdout(quiet), contextlib.redirect_stderr(quiet):
            # resolve_target warns on each folded alternate name; the scorer only needs the canonical.
            self.subj = {c: resolve_target(d, rev, "subject_map[%s]" % c)
                         for c, d in load("kb/reference/subject_discipline_map.json")["map"].items()}
            self.top = {c: resolve_target(d, rev, "top_map[%s]" % c)
                        for c, d in load("kb/top_discipline_map.json")["map"].items()}
        self.subj.update(NARROW_SUBJ)
        self.mq = load("kb/reference/mq_disciplines.json")["disciplines"]
        self.desc = S.load_descriptions(ROOT)
        prec = load("kb/ccr_curator_precedent.json")["pairs"]
        self.fpr_pairs = fpr_pairs(prec)
        # Trusted cards: a person set the discipline, or the subject map filled it (`trusted_disc`).
        self.trusted = {}
        # Rule W's anchor table also reads the seed cards both second signals confirmed (`description_and_top`, Sam's
        # Sheet 174 card 1; the auditor's inferred-high beside subject_map): without them Nursing and Kinesiology,
        # the asks' own examples, have no trusted titles to learn an anchor from.
        self.anchor_cards = {}
        for d in (self.courses, self.singles):
            for cid, rec in d.items():
                if cid.startswith("_") or not isinstance(rec, dict):
                    continue
                c = self.cur.get(cid) or {}
                if c.get("merge_into"):
                    continue
                if c.get("discipline"):
                    self.trusted[cid] = (c["discipline"], rec.get("common_title") or "", rec)
                elif rec.get("discipline_source") == "subject_map" and rec.get("discipline"):
                    self.trusted[cid] = (rec["discipline"], rec.get("common_title") or "", rec)
                elif rec.get("discipline_source") == "description_and_top" and rec.get("discipline"):
                    self.anchor_cards[cid] = (rec["discipline"], rec.get("common_title") or "", rec)
        self.anchor_cards.update(self.trusted)


def fpr_pairs(precedent):
    """{(guess, narrower): (moved, kept)}: 3+ past moves to the narrower field and no keep, minus COBIx's exclusions."""
    out = {}
    for key, v in precedent.items():
        guess, _, other = key.partition(" -> ")
        moved, kept = int(v.get("moved_to_alt") or 0), int(v.get("kept") or 0)
        if moved >= FPR_MIN_MOVES and kept == 0 and (guess, other) not in FPR_EXCLUDED:
            out[(guess, other)] = (moved, kept)
    return out


# ── the learned tables ──────────────────────────────────────────────────────────────────────────────────────────────

def name_stems(mq):
    """{stem: [discipline]} for the words of each official discipline name (5+ letters, not generic)."""
    out = defaultdict(set)
    for d in mq:
        for w in title_words(d):
            if len(w) >= 5 and w not in GENERIC:
                out[stem(w)].add(d)
    # A stem in four or more names says nothing about any one of them.
    return {s: ds for s, ds in out.items() if len(ds) < 4}


def anchor_table(trusted, exclude=()):
    """Rule W's anchor words: {stem: discipline} for stems in 3+ trusted titles, 80%+ of them one discipline."""
    seen = defaultdict(Counter)
    for cid, (disc, title, _rec) in trusted.items():
        if cid in exclude:
            continue
        for s in {stem(w) for w in title_words(title) if len(w) >= 5 and w not in GENERIC}:
            seen[s][disc] += 1
    out = {}
    for s, c in seen.items():
        n = sum(c.values())
        d, k = c.most_common(1)[0]
        if n >= 3 and k / n >= 0.80:
            out[s] = d
    return out


def practice_table(trusted, mem):
    """{subject code: Counter(discipline)} over trusted cards' local courses: where a code lands in practice."""
    out = defaultdict(Counter)
    for cid, (disc, _t, rec) in trusted.items():
        subs = {m.get("subject") for m in (mem.get(cid) or [])} or {rec.get("subject")}
        for s in subs:
            if s:
                out[s][disc] += 1
    return out


# ── one card ────────────────────────────────────────────────────────────────────────────────────────────────────────

def college_votes(members, subj):
    """{discipline: colleges}: each college votes its own majority of subject-map disciplines; a tie or an unmapped
    code does not vote."""
    per = defaultdict(Counter)
    for m in members:
        d = subj.get((m.get("subject") or "").strip())
        if d:
            per[m.get("college")][d] += 1
    votes = Counter()
    for _c, cnt in per.items():
        top = cnt.most_common(2)
        if len(top) == 1 or top[0][1] > top[1][1]:
            votes[top[0][0]] += 1
    return votes


def title_names(title, guess, stems, anchors=None):
    """(other discipline the title names, the excused words). With `anchors` (rule W), a named word is skipped when
    the title holds an anchor word for the guess other than that word, and the scan goes on."""
    words = [w for w in title_words(title) if len(w) >= 5 and w not in GENERIC]
    st = [stem(w) for w in words]
    guess_words = {stem(w) for w in title_words(guess)}
    excused = []
    for w, s in zip(words, st):
        ds = stems.get(s)
        if not ds or guess in ds or s in guess_words:
            continue
        if anchors is not None and any(anchors.get(a) == guess for a in st if a != s):
            excused.append((w, sorted(ds)[0]))
            continue
        return sorted(ds)[0], excused
    return None, excused


def narrow_named(title, guess, subjects):
    """The narrower field inside an umbrella guess that the title or a subject code points to, else None."""
    for narrow in UMBRELLA.get(guess, ()):
        if re.search(NARROW_KW[narrow], (title or "").lower()):
            return narrow
        if any(NARROW_SUBJ.get(s) == narrow for s in subjects):
            return narrow
    return None


def score_card(cid, rec, guess, ctx, use_w):
    """{score, agree, contra, block, read, narrow, signals, reasons, votes}."""
    members = ctx["mem"].get(cid) or []
    subj, top = ctx["subj"], ctx["top"]
    pts, agree, contra = 50.0, 0, Counter()
    reasons, sig = [], {}
    title = rec.get("common_title") or ""
    n_col = len({m.get("college") for m in members if m.get("college")})

    own = subj.get((rec.get("subject") or "").strip())
    if own:
        if own == guess:
            pts += 15; agree += 1; sig["own"] = "agree"
        else:
            pts -= 15; contra[own] += 1; sig["own"] = own

    votes = college_votes(members, subj)
    voters = sum(votes.values())
    if voters:
        fo = votes.get(guess, 0)
        pts += 20.0 * (2 * fo - voters) / voters
        if fo * 2 > voters:
            agree += 1; sig["colleges"] = "agree"
            reasons.append("%d of %d colleges file it under %s" % (fo, voters, guess))
        else:
            other = next((d for d, _n in votes.most_common() if d != guess), None)
            if other and votes[other] > fo:
                contra[other] += 1; sig["colleges"] = other
                reasons.append("%d of %d colleges file it under %s" % (votes[other], voters, other))

    subs = {(m.get("subject") or "").strip() for m in members} - {""}
    prac = ctx["practice"]
    if subs:
        lands = [prac[s] for s in subs if sum(prac[s].values()) >= 5]
        if lands and all(c[guess] / sum(c.values()) >= 0.9 for c in lands):
            pts += 8; sig["practice"] = "agree"
        elif lands and all(c.most_common(1)[0][1] / sum(c.values()) < 0.6 for c in lands):
            pts -= 8; sig["practice"] = "split"

    tv = Counter(top[t] for t in (str(m.get("top_code") or "").split(":")[0].strip() for m in members) if t in top)
    tn = sum(tv.values())
    if tn:
        ft = tv.get(guess, 0)
        pts += 12.0 * (2 * ft - tn) / tn
        if ft * 2 > tn:
            agree += 1; sig["top"] = "agree"
        else:
            other = next((d for d, _n in tv.most_common() if d != guess), None)
            if other and tv[other] > ft:
                contra[other] += 1; sig["top"] = other

    S = ctx["S"]
    own_text = rec.get("description") or ""
    toks, weight = S.tokens(own_text), 1.0
    if len(toks) < 5:
        toks = S.tokens(" ".join(ctx["desc"].get(m.get("control_number")) or "" for m in members))
        weight = 0.5
    read = len(toks) >= 5
    block = False
    if read:
        r = ctx["model"].rank(toks)
        if r:
            band = S.margin_band(r)
            if r[0][0] == guess:
                pts += {"clear": 20, "close": 12, "thin": 6}[band] * weight
                agree += 1; sig["desc"] = "agree_" + band
                reasons.append("its description reads like %s" % guess)
            else:
                pts -= {"clear": 10, "close": 6, "thin": 3}[band] * weight
                contra[r[0][0]] += 1; sig["desc"] = r[0][0] + "_" + band
                if band == "clear":
                    block = True
                    reasons.append("its description reads more like %s" % r[0][0])

    named, excused = title_names(title, guess, ctx["stems"], ctx["anchors"] if use_w else None)
    if named:
        pts -= 15; contra[named] += 1; block = True; sig["title"] = named
        reasons.append("its title names %s" % named)
    for w, d in excused:
        g = guess.lower()
        reasons.append("the title word '%s' describes %s %s course here; it does not point to %s"
                       % (w, "an" if g[:1] in "aeiou" else "a", g, d))
    narrow = narrow_named(title, guess, subs | ({rec.get("subject")} - {None}))
    if narrow:
        pts -= 15; block = True; sig["narrow"] = narrow
        reasons.append("a narrower field may fit better: %s" % narrow)

    pts = max(0.0, min(100.0, pts))
    if agree < 2:
        pts = min(pts, CAP_ONE_SIGNAL)
    return {"score": int(round(pts)), "agree": agree, "contra": contra, "block": block, "read": read,
            "narrow": narrow, "signals": sig, "reasons": reasons, "votes": votes, "colleges": n_col,
            "members": len(members), "title_excused": [w for w, _d in excused]}


def held(cid, rec):
    if cid in HOLD_ALSO:
        return "held by COBIx"
    if cid.split(" ")[0] in HOLD_NONCREDIT_PREFIXES and rec.get("credit_status") in NONCREDIT:
        return "noncredit COMP or VOCE card, held until the noncredit rule runs"
    return None


def band_of(s, hold):
    if s["score"] >= AUTO and s["agree"] >= 2 and not s["block"] and s["read"] and not hold:
        return "auto_accept"
    top2 = s["contra"].most_common(1)
    if s["score"] <= SAM_MAX and top2 and top2[0][1] >= 2:
        return "for_sam"
    return "waiting"


def main_pair(s, guess):
    """The disagreement that holds a waiting card, as the other field: the description, then the title, then the
    colleges (root-cause-waiting.md causes 2-4)."""
    sig = s["signals"]
    d = sig.get("desc")
    if d and not d.startswith("agree"):
        return d.rsplit("_", 1)[0]
    if sig.get("title"):
        return sig["title"]
    c = sig.get("colleges")
    if c and c != "agree":
        return c
    return None


def fpr_title_ok(title, narrower):
    names, but_not = FPR_TITLE.get(narrower, ([], []))
    if not any(re.search(p, title or "", _I) for p in names):
        return False
    return not any(re.search(p, title or "", _I) for p in but_not)


# ── the run ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def ruled_set(cur):
    return {cid for cid, c in cur.items() if isinstance(c, dict) and c.get("ruling")} | set(RULED_3447)


def seedless(inp):
    for cid, rec in inp.courses.items():
        if cid.startswith("_") or not isinstance(rec, dict):
            continue
        if rec.get("discipline") and not rec.get("discipline_source") and not (inp.cur.get(cid) or {}).get("discipline"):
            yield cid, rec


def context(inp, exclude=()):
    S = inp.S
    train = [(d, S.tokens(S.record_text(cid, rec, inp.mem, inp.desc)))
             for cid, (d, _t, rec) in inp.trusted.items() if cid not in exclude]
    train = [(d, t) for d, t in train if len(t) >= 5]
    return {"S": S, "mem": inp.mem, "subj": inp.subj, "top": inp.top, "desc": inp.desc,
            "model": S.Model(train), "stems": name_stems(inp.mq),
            "anchors": anchor_table(inp.anchor_cards, exclude), "practice": practice_table(inp.trusted, inp.mem)}


def run(inp, rules=("W", "D", "FPR"), ctx=None):
    """[(cid, row)] for every seedless card, with its band before and after the rules."""
    ctx = ctx or context(inp)
    ruled = ruled_set(inp.cur)
    out = []
    for cid, rec in seedless(inp):
        guess = rec["discipline"]
        row = {"mid": cid, "title": rec.get("common_title"), "guess": guess, "discipline": guess, "rule": "",
               "proposed": "", "note": ""}
        c = inp.cur.get(cid) or {}
        if cid in ruled:
            row["band"] = row["base"] = "ruled"
        elif c.get("merge_into"):
            row["band"] = row["base"] = "merged_away"
        elif cid not in inp.list_members:
            row["band"] = row["base"] = "not_openable"
        else:
            hold = held(cid, rec)
            s0 = score_card(cid, rec, guess, ctx, use_w=False)
            row["base"] = band_of(s0, hold)
            s = score_card(cid, rec, guess, ctx, use_w="W" in rules) if "W" in rules else s0
            row["band"] = band_of(s, hold)
            if row["band"] != row["base"] and s["title_excused"]:
                row["rule"] = "W"
            row.update(score=s["score"], agree=s["agree"], held=hold or "", members=s["members"],
                       colleges=s["colleges"], reasons="; ".join(s["reasons"]),
                       college_votes="; ".join("%s %d" % kv for kv in s["votes"].most_common()))
            if s["narrow"]:
                row["proposed"] = s["narrow"]
            if row["band"] == "waiting" and not hold and s["members"] and not s["narrow"]:
                other = main_pair(s, guess)
                if other and "D" in rules and (guess, other) in D_PAIRS:
                    v = s["votes"]
                    n, fo, fx = sum(v.values()), v.get(guess, 0), v.get(other, 0)
                    if n >= 2 and fo * 3 >= 2 * n:
                        row.update(band="auto_accept", rule="D",
                                   note="Most of the colleges that teach this course file it under %s." % guess)
                    elif n >= 2 and (fx * 3 >= 2 * n or (fo == fx and fo > 0)):
                        row.update(band="for_sam", rule="D", proposed=other,
                                   note="The colleges that teach this course split toward %s." % other)
                elif other and "FPR" in rules and (guess, other) in inp.fpr_pairs:
                    if fpr_title_ok(rec.get("common_title"), other):
                        row.update(band="auto_accept", rule="FPR", discipline=other,
                                   note=("Moved from %s to %s, following past rulings: people moved every earlier "
                                         "course like this to %s. Sam can change it." % (guess, other, other)))
                    else:
                        row["fpr_left_alone"] = "title does not name %s" % other
        out.append((cid, row))
    return out


def summarize(rows):
    bands = Counter(r["band"] for _c, r in rows)
    base = Counter(r["base"] for _c, r in rows)
    moves = Counter((r["rule"], r["base"], r["band"]) for _c, r in rows if r["rule"])
    return {"seedless": len(rows), "bands": dict(sorted(bands.items())), "base_bands": dict(sorted(base.items())),
            "rule_moves": {"%s: %s -> %s" % k: n for k, n in sorted(moves.items())},
            "auto_accept": bands.get("auto_accept", 0),
            "held": sum(1 for _c, r in rows if r.get("held"))}


def calibrate(inp, rules, folds=5):
    """The decided cards (a person set the discipline over a seed), each scored as if still seedless by a model and
    anchor table that never saw its own label: right and wrong auto-accepts with and without the rules."""
    decided = []
    for cid, rec in inp.courses.items():
        if cid.startswith("_") or not isinstance(rec, dict):
            continue
        c = inp.cur.get(cid) or {}
        if rec.get("discipline") and not rec.get("discipline_source") and c.get("discipline") and not c.get("merge_into"):
            decided.append((cid, rec, c["discipline"]))
    res = {"decided": len(decided), "base": Counter(), "rules": Counter()}
    for f in range(folds):
        part = [x for i, x in enumerate(decided) if i % folds == f]
        ctx = context(inp, exclude={cid for cid, _r, _d in part})
        for cid, rec, person in part:
            guess = rec["discipline"]
            hold = held(cid, rec)
            for key, use in (("base", False), ("rules", "W" in rules)):
                s = score_card(cid, rec, guess, ctx, use_w=use)
                b = band_of(s, hold)
                final = guess
                if key == "rules" and b == "waiting" and not hold and s["members"] and not s["narrow"]:
                    other = main_pair(s, guess)
                    v = s["votes"]; n = sum(v.values())
                    if other and "D" in rules and (guess, other) in D_PAIRS and n >= 2 and v.get(guess, 0) * 3 >= 2 * n:
                        b = "auto_accept"
                    elif other and "FPR" in rules and (guess, other) in inp.fpr_pairs and \
                            fpr_title_ok(rec.get("common_title"), other):
                        b, final = "auto_accept", other
                if b == "auto_accept":
                    res[key]["right" if final == person else "wrong"] += 1
    return {"decided": res["decided"], "base": dict(res["base"]), "rules": dict(res["rules"])}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--fill-members", action="store_true", help="the membership fix: read unified_courses_members.js "
                                                                "for cards kb/coci_minted_memberships.json lacks")
    ap.add_argument("--no-rules", action="store_true", help="the base bands only (no W, D or FPR)")
    ap.add_argument("--rules", default="W,D,FPR", help="comma list of rules to run (default W,D,FPR)")
    ap.add_argument("--expect", type=int, help="exit 1 unless the auto-accept count equals this")
    ap.add_argument("--calibrate", action="store_true", help="also score the decided cards held out")
    ap.add_argument("--out", help="write scores.csv and summary.json here")
    args = ap.parse_args()
    rules = () if args.no_rules else tuple(r for r in args.rules.split(",") if r)
    inp = Inputs(fill_members=args.fill_members)
    rows = run(inp, rules)
    summ = summarize(rows)
    summ.update(fill_members=args.fill_members, rules=list(rules), filled=len(inp.filled),
                no_members=sum(1 for c, r in rows if r["band"] not in ("ruled", "merged_away", "not_openable")
                               and not inp.mem.get(c)),
                fpr_pairs={"%s -> %s" % k: {"moved": v[0], "kept": v[1]} for k, v in sorted(inp.fpr_pairs.items())})
    if args.calibrate:
        summ["calibration"] = calibrate(inp, rules)
    print(json.dumps(summ, indent=1))
    if args.out:
        os.makedirs(args.out, exist_ok=True)
        cols = ["mid", "title", "guess", "discipline", "base", "band", "rule", "proposed", "note", "score", "agree",
                "held", "members", "colleges", "college_votes", "reasons", "fpr_left_alone"]
        with open(os.path.join(args.out, "scores.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for _c, r in rows:
                w.writerow(r)
        with open(os.path.join(args.out, "summary.json"), "w", encoding="utf-8") as f:
            json.dump(summ, f, indent=1, sort_keys=True)
            f.write("\n")
    if args.expect is not None and summ["auto_accept"] != args.expect:
        print("expected %d auto-accepts, measured %d" % (args.expect, summ["auto_accept"]), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
