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

Then rules run on the waiting pile, each on different cards (COBIx, 2026-11-17 12:06 and 12:19 PM PT). By default
only "follow past rulings" runs. Rules W and D are HELD (the conductor's second reader on #3467): held out on the
cards a person decided, D fires on none and W on one, so neither has evidence of its own yet, while they would move
hundreds of live cards. They run only with `--with-held-rules`, for a dry run. Rules G and M (S683) run by default,
after the others; every card they decide carries `rule` "G" or "M" so kb/_ccr_confidence_apply.py can undo it alone.

  W    (held) anchor words. A title word that names another discipline does not count against guess D when the title also
       holds an anchor word for D (5+ letters, not generic, compared on its first 7 letters, in 3+ trusted titles,
       80%+ of them D). The named word is never its own anchor; the scan continues past an excused word.
  D    (held) the pair default, on six fixed pairs: when two or more colleges vote and two-thirds keep the guess, the machine
       accepts it; two-thirds for the other field, or an even split, sends it to Sam with that field proposed.
  FPR  follow past rulings, on the pairs where people always moved such cards to the narrower field
       (kb/ccr_curator_precedent.json), counted leave-one-out so a card never votes for itself: a pair needs 3 or
       more moves besides any one card's and no keep (Art vs Art History, Business vs Office Technologies,
       Manufacturing Technology vs Drafting/CADD; Graphic Arts and Photography have 3 moves, 2 once one is left
       out). Music vs Commercial Music and the business-family pairs stay out. Only when the title, as the List shows
       it, names the narrower field. The discipline changes, source `past_rulings_v1`.
  G    the colleges outvote the description (#3480 Source 14, COBIx yes 2026-11-17 2:43 PM PT). Last on what is still
       waiting: a card that clears the scorer's own bar (80 or more, two agreeing signals, something to read) and is
       held back only by its description reading clearly as another field is accepted, keeping its guess, when the
       title names no other or narrower field, no field is named twice, three-quarters or more of its college
       courses' subject codes and its own subject code map to the guess, two or more colleges teach it, and two or
       more of those colleges' subject codes map (COBIx on #3513: one mapped code is not a college vote). Two
       guards keep it waiting: past rulings moved such cards to the field the description reads as more often than
       they kept the guess (Art read as Art History), or a noncredit card (M9xxx) reads as a noncredit field. Not on
       a held card, nor Business read as Accounting, Marketing or Management (the business-family hold).
  M    the Music vs Commercial Music title split (#3480 Source 15, COBIx yes 2:50 PM PT), straight after G: a card
       still waiting, guessed Music, whose disagreement is with Commercial Music. Commercial Music words only in the
       title move it to Commercial Music (source `music_split_v1`); Music words only keep it as Music; both kinds or
       neither, it stays waiting. Nothing goes to Sam's band.
  A card a person renamed (a person's unified_title in the overlay) is never moved to another field by any rule; only
  G, which keeps the guess and changes no field, accepts one.
  Rule T (the 27 missing TOP codes) is held by COBIx and is not here.

Read-only: it writes no curation row, changes no discipline and edits no local MAP title. A person always wins: a
ruled, merged or person-curated card is never scored into a band a rule can move. `--expect N` exits non-zero
unless the auto-accept count equals N, the guard kb/_ccr_confidence_apply.py carries.

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
  python3 kb/_ccr_confidence_score.py                       # today's memberships, follow past rulings
  python3 kb/_ccr_confidence_score.py --fill-members        # the membership fix
  python3 kb/_ccr_confidence_score.py --fill-members --expect 2862   # measured 2026-11-18 with G and M (S683)
  python3 kb/_ccr_confidence_score.py --fill-members --with-held-rules   # dry run of W and D, never applied
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
FPR_MIN_INDEPENDENT = 3   # moves besides the card's own (leave-one-out)
DEFAULT_RULES = ("FPR", "G", "M")
HELD_RULES = ("W", "D")
BOT_SUFFIX = "@" + "bot"
FPR_EXCLUDED = {("Music", "Commercial Music"), ("Business", "Accounting"), ("Business", "Marketing")}
# The title check: the title names the narrower field (NAMES) and no studio or neighboring practice (BUT_NOT).
_I = re.IGNORECASE
FPR_TITLE = {
    # No museum, gallery or exhibition: those words move practice courses (Museum and Gallery Techniques, Gallery
    # and Exhibition Design). A history of photography is refused by both sides, so the two never split it.
    "Art History": ([r"\bhistory\b", r"\bsurvey\b", r"\barts? of\b", r"\bworld art\b"],
                    [r"\bstudio\b", r"\bceramic", r"\bsculpt", r"\bportfolio", r"\bdrawing", r"\bpainting",
                     r"\bjewelry", r"\bmetal", r"\bfabrication", r"\betching", r"\bprintmaking", r"\bphotograph",
                     r"\bmuseum", r"\bgaller", r"\bexhibition", r"\btechniques\b", r"\bdesign\b"]),
    "Graphic Arts": ([r"\bgraphic", r"\btypograph", r"\blayout", r"\bindesign\b", r"\billustrator\b", r"\bpre-?press",
                      r"\bweb design", r"\bui/ux\b", r"\binteraction design", r"\bprint design", r"\bletter ?forms?\b"],
                     [r"\bceramic", r"\betching", r"\bprintmaking", r"\bscreen ?print", r"\bphotoshop",
                      r"\bdrawing", r"\bpainting"]),
    "Photography": ([r"\bphotograph", r"\bphoto", r"\bdarkroom", r"\bcamera", r"\bdrone"],
                    [r"\bjewelry", r"\bmetal", r"\bfabrication", r"\betching", r"\bprintmaking", r"\bscreen ?print",
                     r"\bphotoshop", r"\bdrawing", r"\bhistory\b", r"\bsurvey\b"]),
    "Office Technologies": ([r"\bkeyboard", r"\bword processing", r"\bmicrosoft\b", r"(?-i:\bWord\b)",
                             r"\bspreadsheet", r"\bexcel\b", r"\boffice\b", r"\bsecretar", r"\bpc applications",
                             r"\bcomputer applications", r"\bcomputer skills", r"\bdocument processing"], []),
    "Drafting/CADD": ([r"(?-i:\bCAD\b)", r"\bcomputer aided design", r"\bcomputer-aided design", r"\bsolidworks",
                       r"\bcreo\b", r"\bautocad", r"(?-i:\bInventor\b)", r"\bsiemens nx\b", r"\bdraft"], []),
}

# Rule G (#3480 Source 14): the colleges outvote the description.
G_MIN_COLLEGES = 2       # colleges that teach it, and colleges whose subject code maps (COBIx on #3513)
G_COLLEGE_SHARE = 0.75   # of the college courses' mapped subject codes, the share that must map to the guess
G_BUSINESS_FAMILY = {"Business": ("Accounting", "Marketing", "Management")}
G_NONCREDIT_SUFFIX = ": Noncredit"

# Rule M (#3480 Source 15): the Music vs Commercial Music title split, matched in the lower-cased title. "Popular",
# "rap" and "hip-hop" are left out of the Commercial Music words on purpose: American Popular Music and the History
# of Rap and Hip-Hop are music history, and the trusted cards file them under Music.
M_PAIR = ("Music", "Commercial Music")
M_CM_WORDS = (r"record(?!er)|audio|pro tools|production|producing|business|industry|entrepreneur|commercial|songwrit|"
              r"electronic music|computer music|\bmidi\b|digital audio|\bdj\b|mixer|\bsound\b|scoring for film|"
              r"film and multimedia|game audio|music technology|pop-commercial")
M_MUSIC_WORDS = (r"choir|chorus|choral|chorale|carol|orchestra|symphony|ensemble|piano|accompan|\bstring|woodwind|brass|"
                 r"percussion|marching|chamber|theory|musicianship|sight-?reading|recital|applied music|world music|"
                 r"music cultures|music in america|honors|\bvoice\b|vocal|singing|history|renaissance|quire|broadway|"
                 r"conduct|culture|appreciation|survey|popular music|american music")

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
        self.precedent = load("kb/ccr_curator_precedent.json")["pairs"]
        self.fpr_pairs = fpr_pairs(self.precedent)
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


def fpr_pairs(precedent, leave_out=None):
    """{(guess, narrower): (moved, kept)} for the pairs past rulings decide, counted leave-one-out (second reader on
    #3467): a pair keeps FPR_MIN_INDEPENDENT or more moves after any one card's own ruling is taken out, and no keep.
    `leave_out` = (guess, person's field) subtracts that card's own ruling first (the held-out check)."""
    out = {}
    for key, v in precedent.items():
        guess, _, other = key.partition(" -> ")
        moved, kept = int(v.get("moved_to_alt") or 0), int(v.get("kept") or 0)
        if leave_out and leave_out[0] == guess:
            if leave_out[1] == other:
                moved -= 1
            elif leave_out[1] == guess:
                kept -= 1
        if moved - (0 if leave_out else 1) >= FPR_MIN_INDEPENDENT and kept <= 0 and (guess, other) not in FPR_EXCLUDED:
            out[(guess, other)] = (moved, kept)
    return out


def display_title(cid, rec, cur):
    """The title the Courses List shows: a curated unified_title, else the minted common title."""
    return (cur.get(cid) or {}).get("unified_title") or rec.get("common_title") or ""


def person_renamed(cid, cur):
    """A person saved this card's title (the overlay's unified_title, last reviewed by a person). Never moved."""
    c = cur.get(cid) or {}
    who = (c.get("reviewed_by") or "").strip().lower()
    return bool(c.get("unified_title")) and bool(who) and not who.endswith(BOT_SUFFIX)


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
    title = ctx["title"](cid, rec)
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

    mapped_m = [(m.get("college"), subj.get((m.get("subject") or "").strip())) for m in members]
    mapped_m = [(c, d) for c, d in mapped_m if d]
    mapped = [d for _c, d in mapped_m]
    subj_share = (sum(1 for d in mapped if d == guess) / len(mapped)) if mapped else None
    mapped_colleges = len({c for c, _d in mapped_m if c})

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
            "members": len(members), "title_excused": [w for w, _d in excused], "subj_share": subj_share,
            "mapped_colleges": mapped_colleges}


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


def past_rulings_lean(precedent, guess, other, leave_out=None):
    """True when people moved cards of this guess to `other` more often than they kept the guess
    (kb/ccr_curator_precedent.json), with a held-out card's own ruling taken out."""
    v = precedent.get("%s -> %s" % (guess, other)) or {}
    moved, kept = int(v.get("moved_to_alt") or 0), int(v.get("kept") or 0)
    if leave_out and leave_out[0] == guess:
        if leave_out[1] == other:
            moved -= 1
        elif leave_out[1] == guess:
            kept -= 1
    return moved > kept


def rule_g(cid, guess, s, precedent, leave_out=None):
    """Rule G on a waiting, unheld card: (verdict, the field its description reads as). The verdict is "accept",
    "past_rulings" or "noncredit" (a guard keeps it waiting), or None when the rule does not apply."""
    if not (s["score"] >= AUTO and s["agree"] >= 2 and s["read"]):
        return None, None
    sig = s["signals"]
    d = sig.get("desc") or ""
    if d.startswith("agree") or not d.endswith("_clear"):
        return None, None
    reads = d.rsplit("_", 1)[0]
    if sig.get("title") or s["narrow"]:
        return None, reads
    top = s["contra"].most_common(1)
    if top and top[0][1] >= 2:
        return None, reads
    if s["subj_share"] is None or s["subj_share"] < G_COLLEGE_SHARE or sig.get("own") != "agree":
        return None, reads
    if s["colleges"] < G_MIN_COLLEGES or s["mapped_colleges"] < G_MIN_COLLEGES or reads in G_BUSINESS_FAMILY.get(guess, ()):
        return None, reads
    if past_rulings_lean(precedent, guess, reads, leave_out):
        return "past_rulings", reads
    num = cid.split(" M")[-1]
    if num.startswith("9") and reads.endswith(G_NONCREDIT_SUFFIX):
        return "noncredit", reads
    return "accept", reads


def g_note(guess, reads):
    return ("Kept as %s: the colleges that teach it file it under %s. Its description also touches another field "
            "(%s), but nothing else points there." % (guess, guess, reads))


def m_in_scope(guess, s):
    """Rule M's scope on a waiting, unheld card: guessed Music, and its disagreement is with Commercial Music."""
    return guess == M_PAIR[0] and bool(s["members"]) and M_PAIR[1] in (s["narrow"], main_pair(s, guess))


def split_call(title):
    """Rule M's title call: "Commercial Music", "Music", "both" or "neither"."""
    t = (title or "").lower()
    cm, mu = bool(re.search(M_CM_WORDS, t)), bool(re.search(M_MUSIC_WORDS, t))
    if cm and not mu:
        return M_PAIR[1]
    if mu and not cm:
        return M_PAIR[0]
    return "both" if cm else "neither"


M_NOTES = {
    M_PAIR[1]: ("Moved from Music to Commercial Music: the course title is about recording, production or the music "
                "business. Sam can change it."),
    M_PAIR[0]: "Kept as Music: the course title is about performance, ensembles, theory or music history.",
}


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
            "title": lambda cid, rec: display_title(cid, rec, inp.cur),
            "model": S.Model(train), "stems": name_stems(inp.mq),
            "anchors": anchor_table(inp.anchor_cards, exclude), "practice": practice_table(inp.trusted, inp.mem)}


def run(inp, rules=DEFAULT_RULES, ctx=None):
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
            renamed = person_renamed(cid, inp.cur)
            row["title"] = display_title(cid, rec, inp.cur)
            s0 = score_card(cid, rec, guess, ctx, use_w=False)
            row["base"] = band_of(s0, hold)
            s = score_card(cid, rec, guess, ctx, use_w=True) if "W" in rules and not renamed else s0
            row["band"] = band_of(s, hold)
            if row["band"] != row["base"] and s["title_excused"]:
                row["rule"] = "W"
            row.update(score=s["score"], agree=s["agree"], held=hold or "", members=s["members"],
                       colleges=s["colleges"], reasons="; ".join(s["reasons"]),
                       college_votes="; ".join("%s %d" % kv for kv in s["votes"].most_common()))
            if s["narrow"]:
                row["proposed"] = s["narrow"]
            row["renamed"] = "yes" if renamed else ""
            if row["band"] == "waiting" and not hold and not renamed and s["members"] and not s["narrow"]:
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
                    if fpr_title_ok(row["title"], other):
                        row.update(band="auto_accept", rule="FPR", discipline=other,
                                   note=("Moved from %s to %s, following past rulings: people moved every earlier "
                                         "course like this to %s. Sam can change it." % (guess, other, other)))
                    else:
                        row["fpr_left_alone"] = "title does not name %s" % other
            # G keeps the guess and changes no field, so it also reads a card whose title a person saved: the title
            # stays the person's, and the discipline was never ruled on. A rule that changes the discipline (FPR, M)
            # never touches such a card.
            # G and M read only cards the base scorer left waiting: a card in Sam's band stays his, whatever W does.
            if row["band"] == row["base"] == "waiting" and "G" in rules and not hold:
                verdict, reads = rule_g(cid, guess, s, inp.precedent)
                if verdict == "accept":
                    row.update(band="auto_accept", rule="G", reads_as=reads, note=g_note(guess, reads))
                elif verdict:
                    row.update(reads_as=reads, g_left={"past_rulings": "past rulings moved such cards",
                                                       "noncredit": "noncredit card read as a noncredit field"}[verdict])
            if row["band"] == row["base"] == "waiting" and "M" in rules and not hold and not renamed \
                    and m_in_scope(guess, s):
                call = split_call(row["title"])
                row["m_call"] = call
                if call in M_NOTES:
                    row.update(band="auto_accept", rule="M", discipline=call, note=M_NOTES[call])
        out.append((cid, row))
    return out


def summarize(rows):
    bands = Counter(r["band"] for _c, r in rows)
    base = Counter(r["base"] for _c, r in rows)
    moves = Counter((r["rule"], r["base"], r["band"]) for _c, r in rows if r["rule"])
    return {"seedless": len(rows), "bands": dict(sorted(bands.items())), "base_bands": dict(sorted(base.items())),
            "rule_moves": {"%s: %s -> %s" % k: n for k, n in sorted(moves.items())},
            "auto_accept": bands.get("auto_accept", 0),
            "held": sum(1 for _c, r in rows if r.get("held")),
            "rule_g_left_waiting": dict(sorted(Counter(r["g_left"] for _c, r in rows if r.get("g_left")).items())),
            "rule_m_calls": dict(sorted(Counter(r["m_call"] for _c, r in rows if r.get("m_call")).items()))}


def calibrate(inp, rules=DEFAULT_RULES + HELD_RULES, folds=5):
    """Self-recall on the decided cards (a person set the discipline over a seed): each is scored as if still
    seedless by a model and anchor table that never saw its own label, and by precedent with its own ruling taken
    out. Per rule: how often it fires, and how often its call matches the person's."""
    decided = []
    for cid, rec in inp.courses.items():
        if cid.startswith("_") or not isinstance(rec, dict):
            continue
        c = inp.cur.get(cid) or {}
        if rec.get("discipline") and not rec.get("discipline_source") and c.get("discipline") and not c.get("merge_into"):
            decided.append((cid, rec, c["discipline"]))
    per = {k: Counter() for k in ("base",) + tuple(rules)}
    for f in range(folds):
        part = [x for i, x in enumerate(decided) if i % folds == f]
        ctx = context(inp, exclude={cid for cid, _r, _d in part})
        for cid, rec, person in part:
            guess = rec["discipline"]
            hold = held(cid, rec)
            s0 = score_card(cid, rec, guess, ctx, use_w=False)
            b0 = band_of(s0, hold)
            if b0 == "auto_accept":
                per["base"]["right" if guess == person else "wrong"] += 1
            if b0 != "waiting" or hold:
                continue
            # The same order as run(): W, then D or FPR, then G and M on what is still waiting.
            if "W" in rules:
                sw = score_card(cid, rec, guess, ctx, use_w=True)
                if band_of(sw, hold) == "auto_accept":
                    per["W"]["right" if guess == person else "wrong"] += 1
                    continue
            other = main_pair(s0, guess)
            if other and s0["members"] and not s0["narrow"]:
                v = s0["votes"]; n = sum(v.values())
                if "D" in rules and (guess, other) in D_PAIRS:
                    fo, fx = v.get(guess, 0), v.get(other, 0)
                    if n >= 2 and fo * 3 >= 2 * n:
                        per["D"]["right" if guess == person else "wrong"] += 1
                        continue
                    if n >= 2 and (fx * 3 >= 2 * n or (fo == fx and fo > 0)):
                        continue  # D sends it to Sam's band; G and M never read it
                elif "FPR" in rules and (guess, other) in fpr_pairs(inp.precedent, leave_out=(guess, person)) and \
                        fpr_title_ok(display_title(cid, rec, inp.cur), other):
                    per["FPR"]["right" if other == person else "wrong"] += 1
                    continue
            # G and M run last, on what the rules above leave waiting.
            if "G" in rules and rule_g(cid, guess, s0, inp.precedent, leave_out=(guess, person))[0] == "accept":
                per["G"]["right" if guess == person else "wrong"] += 1
                continue
            if "M" in rules and m_in_scope(guess, s0):
                call = split_call(display_title(cid, rec, inp.cur))
                if call in M_NOTES:
                    per["M"]["right" if call == person else "wrong"] += 1
    return {"decided": len(decided), "per_rule": {k: dict(v) for k, v in per.items()}}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--fill-members", action="store_true", help="the membership fix: read unified_courses_members.js "
                                                                "for cards kb/coci_minted_memberships.json lacks")
    ap.add_argument("--no-rules", action="store_true", help="the base bands only (no rule runs)")
    ap.add_argument("--with-held-rules", action="store_true",
                    help="also run the HELD rules W and D (a dry run; they have no held-out evidence yet)")
    ap.add_argument("--expect", type=int, help="exit 1 unless the auto-accept count equals this")
    ap.add_argument("--calibrate", action="store_true", help="also score the decided cards held out")
    ap.add_argument("--out", help="write scores.csv and summary.json here")
    args = ap.parse_args()
    rules = () if args.no_rules else DEFAULT_RULES + (HELD_RULES if args.with_held_rules else ())
    inp = Inputs(fill_members=args.fill_members)
    rows = run(inp, rules)
    summ = summarize(rows)
    summ.update(fill_members=args.fill_members, rules=list(rules), filled=len(inp.filled),
                held_rules=("ran as a dry run (--with-held-rules)" if args.with_held_rules
                            else "W and D are held and did not run; --with-held-rules runs them as a dry run"),
                no_members=sum(1 for c, r in rows if r["band"] not in ("ruled", "merged_away", "not_openable")
                               and not inp.mem.get(c)),
                fpr_pairs={"%s -> %s" % k: {"moved": v[0], "kept": v[1]} for k, v in sorted(inp.fpr_pairs.items())})
    if args.calibrate:
        summ["calibration"] = calibrate(inp)
    print(json.dumps(summ, indent=1))
    if args.out:
        os.makedirs(args.out, exist_ok=True)
        cols = ["mid", "title", "guess", "discipline", "base", "band", "rule", "proposed", "note", "score", "agree",
                "held", "renamed", "members", "colleges", "college_votes", "reasons", "fpr_left_alone", "reads_as",
                "g_left", "m_call"]
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
