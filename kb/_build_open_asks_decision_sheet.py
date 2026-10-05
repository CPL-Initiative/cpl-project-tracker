#!/usr/bin/env python3
"""Everything outstanding for Sam, as one numbered sheet.

Standing rule, his words (2026-09-22):

    "Always give me a decision sheet for any outstanding items for me..."

⚠️ THE FAILURE MODE IS A SHEET THAT QUIETLY MISSES A LANE, so this script does
not trust its own item list. `audit_coverage()` reads every
`docs/reference/lanes/*.md`, finds each NEEDS-SAM marker, and REFUSES TO BUILD
unless every lane carrying one is either covered by an item here or named in
`NO_OPEN_ASK` with a reason. That is Rule 10(a3)'s posture — map it or dismiss
it, and the reason is the point — pointed at the backlog instead of at a write
surface.

⚠️ THE ITEMS THEMSELVES ARE HAND-WRITTEN, AND THAT IS DELIBERATE. A lane's
NEEDS-SAM block is freehand prose; a parser could list the lanes but never
produce what a sheet needs — the ask in plain words, the measured context, and a
proposal with its draft reason. So the scan guards COVERAGE and a person writes
the CARD. When a lane's ask changes, the card here is what has to change with it.

⚠️ AND THIS SHEET REPORTS; IT NEVER RULES. An item that has drifted out of its
lane's wording is a bug in this file, never a license to update the lane from here.

⚠️ A RULING LEAVES THE SHEET IN THE SAME CHANGE THAT RECORDS IT IN ITS LANE.
Measured 2026-09-27 (S295): Sam completed the 2026-09-22 sheet through card 18,
and seven of the cards this builder still carried five days later were at or
below that mark, answered under his high-water rule. Their lanes still read
NEEDS SAM, so the coverage audit kept them here as asks. Four of the seven had
also been answered on 2026-08-14 (military scope §10), and two of the 09-22
proposals contradicted those August answers. When a verdict lands, change the
lane's marker in the same pull request, or the sheet asks again.

Sheet 42 (S335, 2026-10-05, SHEET_ID 2026-10-05-open-asks-42): sheet 41 carried no replies. Card 1 is its one
card, unchanged (all 20 records still read as before, 2026-10-05). Card 2: the display build 1cb75672ba6c, which adds
the two drafts for Miramar (MAP names AUTO 156G beside EMGM 106 and FIPT 321P) and nothing else. Card 3: the
My College half of sheet 32 card 2, since My College is the college's own page and a draft there reaches the college
before the MAP team sends it.
Published at https://claude.ai/artifact/HqVTZRKnuSqfUEpmm3VdSX (capabilities db + comments).

Sheet 41 (S334, 2026-10-05, SHEET_ID 2026-10-05-open-asks-41): sheet 40's one card, restated after the capture
read Mt. San Antonio's hidden Outcomes tab (#1871): the same guarded write, now carrying outcomes on 19 of the 20
records (all 20 still read as before, 2026-10-05). Sheet 40 carried no replies and is superseded by 41.
Published at https://claude.ai/artifact/RhDo9xjscquPDDMHsYGz1V (capabilities db + comments); sheet 40's artifact
was republished titled "Open Asks Sheet 40 (superseded by 41)". Sheet 41 carried no replies; S335 republished it titled
"Open Asks Sheet 41 (superseded by 42)" (https://claude.ai/artifact/HqVTZRKnuSqfUEpmm3VdSX).

Sheet 40 (S334, 2026-10-05, SHEET_ID 2026-10-05-open-asks-40): sheet 39 is answered and carried out. One card:
the guarded write that puts record shape 3's outcomes on the 20 live program records (all 20 read as before).
Published at https://claude.ai/artifact/9gwhdiKTKYNkyb9u7cqyxf (capabilities db + comments).

Sheet 39 (S333, 2026-10-05, SHEET_ID 2026-10-05-open-asks-39): sheet 38 is answered and its rename ran on
main (15:18Z). Two cards: apply the display build that carries the new name (799bfb9a7dbf), and one name for
OSHA as issuer in the CER, after Sam's rule in chat that a college teaching OSHA 30 is not the issuer.
Published at https://claude.ai/artifact/UcBESBRpoLZJKgZZG5NtXr (capabilities db + comments).

Sheet 37 (S331 checkpoint, 2026-10-05, SHEET_ID 2026-10-05-open-asks-37): sheet 36 is answered. One card:
whether to send the request for Cerritos's high school list, now that reads 7-12 (S331) tried every public route
(CATEMA, CTE Course Connect, the CCAP page, BoardDocs, DualEnroll, the archive) and the draft carries what they found.
Published at https://claude.ai/artifact/HNF6zXcqeCS5LRLYLB3x2F (capabilities db + comments).

Sheet 36 (S330, 2026-10-04, SHEET_ID 2026-10-04-open-asks-36): sheet 35 is answered (21:43Z). Two cards
from Cerritos reads 4 and 5 (#1859): paste the procedure record's second version (the connector timed out
at 60 s and wrote nothing, read back), and whether to send the drafted request for Cerritos's high school
articulation list, the one question every public source has now failed to answer. A third card, the
Ironworker film's draft v1, joined before any reply existed and was republished onto the same artifact;
Sam answered it in chat (23:42Z, "Video is excellent!") and it left, again before any reply existed.

Sheet 35 (S329 checkpoint, 2026-10-04, SHEET_ID 2026-10-04-open-asks-35): sheet 34 is answered (19:18Z).
One card: Cerritos's procedure record. Sam said "apply the procedure record" in session; the migration
(three columns, the trigger) landed, and the row's guarded UPDATE timed out twice at the connector, which
holds a bare UPDATE for a person. The card carries the UPDATE to paste. Its first build took the receipt's
first UPDATE, which sits in the rollback comment, so Sam's paste failed as a syntax error with nothing
written; rebuilt onto the same artifact (no reply existed) with the one statement and a guard against
comment lines in paste text.

Sheet 34 (S328, 2026-10-04, SHEET_ID 2026-10-04-open-asks-34): Sam answered all five cards of sheet 33
(https://claude.ai/artifact/HLeo1NxQvsVkZNUnqw8YCQ) at 18:52-18:57Z, and the lanes record them. Two new
cards: the statement of who CPL serves (his card 1 ask) and the per-college procedure record (his card 5
"Advise"). Published at https://claude.ai/artifact/PE2mmQZBvoArb5MTnC2gCG (capabilities db + comments).
Sam answered both at 19:18Z the same day (replies/done through 2, sent: true); the lanes record them.

Sheet 31 (S326 checkpoint, 2026-10-04, SHEET_ID 2026-10-04-open-asks-31): sheet 30 carried no replies; its
one card gains a fourth file, the privilege close for program_requirement_records (card 4's table).
Published at https://claude.ai/artifact/89S8oEi5Yi1ZpDeUwBsfJu (capabilities db + comments).

Sheet 30 (S326, 2026-10-04, SHEET_ID 2026-10-04-open-asks-30): Sam answered all five cards of sheet 29
(https://claude.ai/artifact/FhxQ5HXM1EBffhS5ce3Tj7) between 11:54Z and 12:00Z, each his own call: card 1
later, card 2 guard lifted (S326 ran the six addresses), card 3 a note on the college's record and no ask
for access (S326 filed it for 25 colleges and taught the reader), card 4 yes (Sierra's "required" for checked
records, built next), card 5 go (the addenda table, Part A applied). One card remains: three receipts to
paste, the two memory files carried from card 1 and the addenda table's privilege close. Published at
https://claude.ai/artifact/SKczLvwB5BxQMXNfJRdyD3 (capabilities db + comments).

Sheet 27 (S322, 2026-10-03, SHEET_ID 2026-10-03-open-asks-27): Sam answered all of sheet 26 at 23:01Z
(his own calls): card 1 later, card 2 "go", card 3 he asks the Tech Center after the first records. The
"go" met the repo's Supabase guard, which refuses a session's UPDATE to a shared table, so card 2 asks him
to paste the file or lift the guard for one run. Card 3 left with its ruling. Published at
https://claude.ai/artifact/Vhc8F8kDntLczhDeVdsdxu (capabilities db + comments).

Sheet 26 (S322, 2026-10-03, SHEET_ID 2026-10-03-open-asks-26): Sam answered sheet 25 at 22:57Z through
card 4 (his own picks). Card 1 "run while I watch": the connector's confirmation never reached him and the
call timed out with nothing written, so it is re-asked for the SQL editor. Card 2 "enter as given": his own
entry, still pending. Cards 3 (Culinary Arts) and 4 (Sam checks the sample) left with their rulings; card 5
was not reached and carries over. Published at https://claude.ai/artifact/J2mUFwbcpgFsifSjFgVaWV
(capabilities db + comments). Sheet 25 (https://claude.ai/artifact/SqKFZpLcY9Q4Jg1GLVGk1B) keeps its answers.

Sheet 25 (S322, 2026-10-03, SHEET_ID 2026-10-03-open-asks-25): sheet 24 carried no replies when S322
read it (21:10Z). Its two cards carry over unchanged, and three join them: the pilot's three names
(Riverside City's program, who checks the 20-program sample, who asks the Tech Center). Published at
https://claude.ai/artifact/SqKFZpLcY9Q4Jg1GLVGk1B (capabilities db + comments). Sheet 24
(https://claude.ai/artifact/PNcwBXXZZpb6wKXDheDfnA) keeps its own store; never republish onto it.

Sheet 24 (S321 checkpoint, 2026-10-03, SHEET_ID 2026-10-03-open-asks-24): sheet 23 was answered ("As
proposed", 15:05Z). Two cards for the program requirements harvest: paste the memory receipts, and enter
six catalog addresses the census cannot reach.

Sheet 22 (S318 checkpoint, 2026-10-02, SHEET_ID 2026-10-02-open-asks-22): sheet 21 was answered (card 1
ran, card 3 keep); its card 2, the ElevenLabs plan, answered "later", is the one card. Published at
https://claude.ai/artifact/NwAWv98uo2ytzYjQu4CYzo (capabilities db + comments).
Sheet 21 (S318, 2026-10-02, SHEET_ID 2026-10-02-open-asks-21): sheet 20 carried no replies when it was
superseded. Its two cards, plus the program-course migration (the programs loader that fills Sierra's join
key, and the grants closing the three catalog loaders; the connector's confirm had no one to answer it).
Published at https://claude.ai/artifact/2z9impotUrBZS5SDd4Rg2K (capabilities db + comments).
Sheet 20 (S317, 2026-10-02, SHEET_ID 2026-10-02-open-asks-20, https://claude.ai/artifact/2FmMPxYqndY2oKnobcKZQi): sheet 19 was answered and carried out
(S316). Two cards from Sam's Sierra ask: the ElevenLabs plan (ElevenLabs disabled the account's free tier
before Minimum conditions was read) and his verdict on the sample.
Sheet 19 (S315, 2026-10-02, SHEET_ID 2026-10-02-open-asks-19): sheet 18's one card, unanswered, plus the
statewide Access target (the 2.3% gap, measured: the maximum award trims the capped institutions' targets).
Sheet 18 carried no replies when it was superseded. Published at
https://claude.ai/artifact/HSGh2r1HAE5CzfWTW49K44 (capabilities db + comments).
Sheet 18 (S315, 2026-10-02, SHEET_ID 2026-10-02-open-asks-18): Sam answered sheet 17 at 04:18Z (card 2
"Apply them", written at 04:52Z; card 1 "Done" with no kb_curation row and no CER load). One card: the
session writes the AWS fold and the Microsoft title through a workflow, or he types them. Published at
https://claude.ai/artifact/NopXsApvXCGbnGjSTPRC5A (capabilities db + comments).
Sheet 17 (S314, 2026-10-02, SHEET_ID 2026-10-02-open-asks-17): Sam answered all five cards of sheet 16 at
00:36Z. Two asks remain: the CER titles and the AWS merge (sheet 16 named a button the CER draws only after
a title is typed), and cards 23-24 shown today beside the revision. Published at
https://claude.ai/artifact/BUSR19kLbQ8yponfQVk1AP (capabilities db + comments).
Sheet 16 (S313, 2026-10-01, SHEET_ID 2026-10-01-open-asks-16): five cards, published onto sheet 15's artifact
https://claude.ai/artifact/49Rh1tw4TZy4MS9o1jF7UH; its replies stay there.
Sheet 15 (S312 checkpoint, 2026-10-01, SHEET_ID 2026-10-01-open-asks-15): Sam answered all six cards of
sheet 14 at 21:22Z (each his own call; recorded in the lanes). Three asks remain: the Microsoft title and the
AWS fold (partner-crosswalks), cards 23-24 of the model sweep, and the confirmation deadline.
Published at https://claude.ai/artifact/49Rh1tw4TZy4MS9o1jF7UH (capabilities db + comments).
Sheet 14 (S312, 2026-10-01, SHEET_ID 2026-10-01-open-asks-14): sheet 13's five cards (no reply yet), then
S312's one: whether colleges get the explainer alone or the tab's Public view as well (Sam, 2026-10-01: "I may
also give access to the 'Public View'--depends on whether this view has everything needed").
Published at https://claude.ai/artifact/EpuRqmsBBiwjNK6ZsD4LaU (capabilities db + comments).
Sheet 13 (S311, 2026-10-01, SHEET_ID 2026-10-01-open-asks-13): sheet 12's one card (no reply), then
S311's three: running the CER rename receipt (#1803, Cisco and AWS), the Microsoft title (the exam was
renamed, not the credential), folding AWS's second SysOps record; and a pointer to the "model" sweep
sheet (artifact T2MTd4n2cP2LXZXRXvbBQ6), whose replies are the port's spec. Published at
https://claude.ai/artifact/CyhTj4tH2sSMjKtgaW6o69 (capabilities db + comments).
Sheet 12 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-12): one card, sheet 11's card 6 (the
City College of San Francisco check in Sierra), which Sam marked Later. Sheet 11's other eight left with his
rulings (replies/done at 22:48:37Z, all nine his own call), each recorded in its lane in the same change.
Published at https://claude.ai/artifact/B6Gnzmha8kArgiSQw1SdTe (capabilities db + comments).
Sheet 11 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-11): sheet 10's six cards (no reply yet),
then the credential side session's three asks for the partner-crosswalks lane: who verifies an issuer's
skills against course outcomes for the CER as a phase 0 credential registry; retitling the three
renamed-credential exhibits; the network allowlist for the watch agent. Published at
https://claude.ai/artifact/8CdZcCGsDU6hMwhBLRZViM (capabilities db + comments). Sheet 10's store stays where
it is; a reply there still counts for its card.
Sheet 10 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-10): six cards. Sheet 9's card (no reply
yet) with the catalog-year view's double count added; three S308 choices Sam may reverse (the Timeline's
type size, the priority cards' boxes, where the college sign-in sits); the note to Pedro about MAP's two
views; and the City College of San Francisco check in Sierra. Published at
https://claude.ai/artifact/DSky8iUvxg5WeemRm4wpW2 (capabilities db + comments). Sheet 9's store stays where
it is; a reply there still counts for its card.
Sheet 9 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-9): one card, whether Priority 1 counts credit
still at Needs Action (the question the Sierra chain handed the funding lane), set against MAP's student
view, which pa_u reads. Published at https://claude.ai/artifact/XnHFDLys7WRGjHC26NY9KP (capabilities db +
comments).

Sheet 8 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-8): one card, whether the CO style guide
gets a curated copy in the public knowledge base. Published at
https://claude.ai/artifact/7sb3cMt8iU9YWmjKyyHCT1 (capabilities db + comments). Sam answered it at
18:52Z the same day (`replies/done` through 1, his own call: curate a public draft).

Sheet 7 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-7): one card, how a college's staff sign
in to see its own reported expenditures (the Reporting box's college half). Published at
https://claude.ai/artifact/6VafxJwkrVpVyL8TCWFpNY (capabilities db + comments). Sam answered it at
17:09Z the same day (`replies/done` through 1, his own call: MAP's two contacts); the funding lane
records it and the card left in the same change.

Sheet 6 was answered in full at 15:26Z the same day (`replies/done` through 7, six his own call,
card 3 as proposed); its rulings are in the funding and My College lanes, and the builder holds no
card until a lane marks a new ask.

Sheet 6 (S306, 2026-09-30, SHEET_ID 2026-09-30-open-asks-6): sheet 5's five cards, which carried no
reply when S306 read its store, and two new ones: Scenario 2 reads as published in the stored model,
and Priority 1's wording against what `pa_u` counts. Published at
https://claude.ai/artifact/KCuKxKytRRWqNvqrusvtmr (capabilities db + comments); read its replies first.
Sheet 5's store stays where it is; a reply there still counts for its five.

Sheet 5 (S305, 2026-09-30, SHEET_ID 2026-09-30-open-asks-5): five cards, the Scenario 2 narrated
draft (card 8's review), the Reporting box's three calls and the "units waiting" label. Published
at https://claude.ai/artifact/4PhPMFSvUVJLxrV7PazTQr (capabilities db + comments); read its replies first.

Sheet 4 (S303, 2026-09-29, SHEET_ID 2026-09-29-open-asks-4): nine cards from the S303
handoff's list, less the gray-cell question Sam settled in session (round 9). JUST THE ITEMS:
no framing, count line or how-to box (Sam, 2026-09-29). Sam answered all nine that
evening (22:26Z, through 9, each his own call); the lanes record them. Published at
https://claude.ai/artifact/PzVQ6KftWPtbk8afPXbZmf (capabilities db + comments). Read its
replies before anything else; sheet 3's store keeps his eighteen answers, never republish onto it.

Published: https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag (2026-09-29, S301, SHEET_ID
2026-09-29-open-asks-3, capabilities db + comments, eighteen cards: sheet 2's twelve at the same
positions, two unit-range calls and the narrated draft's four). Its store keeps his answers;
never republish onto it. Sheet 2,
https://claude.ai/artifact/9Wikhf54XyJgWXDEw5AK7G (SHEET_ID 2026-09-29-open-asks-2, twelve
cards), held no replies when sheet 3 replaced it. Its cards 1-7 are the seven of
https://claude.ai/artifact/QiaDezD2AN6XDzctUCSCfw (2026-09-29, S300, SHEET_ID 2026-09-29-open-asks),
where Sam pressed Complete at 03:34Z with no card touched (`through: null`, nothing reviewed); that
sheet's thread points here, and a reply there still counts for its seven. Before it: https://claude.ai/artifact/C1uyRhneegqQ4XSPRKiC3B (2026-09-28, S297, SHEET_ID
2026-09-28-open-asks, capabilities db + comments, three cards; its store held no replies when
S300 read it on 2026-09-29). Its cards 1 and 2 are cards 3
and 4 of https://claude.ai/artifact/74AfMNmXPQYP5X7XKpjHfH (2026-09-27 evening, SHEET_ID
2026-09-27-funding-asks, four funding cards; Sam answered cards 1 and 2 there and left off at
card 3), so read BOTH stores' `replies` and `replies/done`, and the later answer stands; NEVER
republish onto either. The two-card 2026-09-27-funding-asks-2 was built, never published, and
is gone. Before them:
https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe (SHEET_ID 2026-09-27-open-asks; all eight
cards answered that day, through card 8, and recorded in their lanes). A card list that
changes is published under a fresh SHEET_ID, OUT and artifact. The 2026-09-22 sheet
(https://claude.ai/artifact/FTEhLfMxhRfv4YH6DGSPhn) keeps Sam's answers of that day;
never republish onto it, and give any sheet whose cards change a fresh SHEET_ID.

Run: python3 kb/_build_open_asks_decision_sheet.py
     python3 kb/_build_open_asks_decision_sheet.py --check   (coverage only)
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANES = os.path.join(ROOT, 'docs', 'reference', 'lanes')
OUT = os.path.join(ROOT, 'docs/visuals/2026-10-05-open-asks-42.html')
SHEET_ID = '2026-10-05-open-asks-42'

NEEDS = re.compile(r'NEEDS SAM', re.I)


def sheet_title(sheet_id=None):
    """The page's name, carrying its number. Every sheet used to be titled
    "Everything outstanding for you", so the gallery listed a column of
    identical names and Sam could not find sheet 28 or tell which was newest
    (2026-10-04)."""
    n = re.search(r'(\d+)$', sheet_id or SHEET_ID)
    return 'Open Asks Sheet %s' % n.group(1) if n else 'Open Asks Sheet'


# A lane whose marker is NOT an open ask. The reason is the point: a bare
# exclusion list would let a real ask be silenced by adding one line.
NO_OPEN_ASK = {
    'README':
        "the lanes index, which documents the marker rather than carrying one.",
}


def chips(*pairs):
    return list(pairs)

# ── what each card's premise rests on ────────────────────────────────────────
# ⚠️ FOUR OF THE 2026-09-22 SHEET'S TWENTY-ONE CARDS RESTED ON A PREMISE THAT
# HAD ALREADY MOVED, and Sam ruled on all four before anyone noticed:
#
#   item 14  "the treatment depends on the rest of the sentence" — ccr_universe.js
#            had been drawing the statewide ring since 2026-09-10, citing his ask
#            BY DATE in its own comment
#   item 15  "the live CHECK constraint does not allow skyview-ask" — it does
#   item 17  "8 colleges" — five profiles, and not one of them a community college
#   item 16  the risk was stated backwards: NODE_ZOOM fails islands as the window
#            WIDENS, so narrowing makes stars safer, never emptier
#
# The cause is specific and fixable. The cross-list sheet RECOMPUTED every count
# at build time; this builder QUOTED lane prose, and lane prose lags the code.
# So every card now declares its evidence, and the kinds that the repo can settle
# are settled HERE, on every build:
#
#   measured(fn)       the repo can answer it. Answered at build time, every time.
#                      If the predicate says the premise no longer holds, the
#                      BUILD REFUSES — the sheet stops asking what is already done.
#   live(date, how)    only a running system knows (Supabase, a deployed function),
#                      and this script cannot reach one. The card carries the date
#                      it was last checked and says so in the reader's own words.
#   quoted(src, as_of) copied from a lane file. The card names the file and the
#                      date, so a ruling is made knowing the number is second-hand.
#   policy()           a judgment with no factual premise; nothing to go stale.
#
# ⚠️ `quoted` IS NOT A LOOPHOLE. It is the honest label for a claim nobody
# re-checked, and it prints as one. If a claim CAN be measured, measure it.

def measured(fn, note=""):
    return {"kind": "measured", "fn": fn, "note": note}


def live(checked, how):
    return {"kind": "live", "checked": checked, "how": how}


def quoted(src, as_of):
    return {"kind": "quoted", "src": src, "as_of": as_of}


def policy():
    return {"kind": "policy"}


def _read(rel):
    try:
        return open(os.path.join(ROOT, rel), encoding="utf-8").read()
    except OSError:
        return ""


def _code(src):
    """Source with comments stripped — prose ABOUT a defect is not the defect."""
    return re.sub(r"/\*[\s\S]*?\*/", "", re.sub(r"^\s*//.*$", "", src, flags=re.M))


# ── the repo-checkable premises ──────────────────────────────────────────────
# Each returns (still_open, detail). A False is not an error: it means the work
# landed and the card has to go.

def p_cap_trims_targets():
    """Card: the statewide Access target. Open while a capped institution's target is still
    sized to the maximum (prioEntitlement scales by capScale), which is what makes the
    institutions' targets sum below the statewide division."""
    code = _code(_read("cpl_funding.js"))
    i = code.find("function prioEntitlement(")
    body = code[i:code.find("\n  }", i)] if i >= 0 else ""
    trims = "capScale(c)" in body
    return trims, ("prioEntitlement scales a capped institution's target by capScale()" if trims
                   else "prioEntitlement no longer scales by capScale(): re-measure the gap")


def p_phantom_tokens():
    bare = []
    for f in ("college_briefing.js", "cpl_funding.js", "map_users.js", "governance.js"):
        bare += re.findall(r"var\(--(brand|link|text)\)", _code(_read(f)))
    return bool(bare), "%d bare phantom-token use(s) in consumer JS" % len(bare)


def p_text_faint_funding():
    n = len(re.findall(r"var\(--text-faint\b", _code(_read("cpl_funding.js"))))
    return n > 0, "%d --text-faint site(s) on Implementation Funding" % n


def p_surface_light():
    src = _read("CPL_Dashboard.html")
    i = src.find(":root")
    light = src[i:src.find("}", i)] if i >= 0 else ""
    defined = bool(re.search(r"--surface-1:\s*#", light))
    return (not defined), ("--surface-1/2 are dark-only" if not defined
                           else "--surface-1/2 already carry light values")


def p_statewide_ring():
    src = _read("prototype/ccr_universe.js")
    draws = bool(re.search(r"nd\.sw\s*&&[\s\S]{0,200}?ctx\.arc", src))
    return (not draws), ("no statewide ring in ccr_universe.js" if not draws
                         else "ccr_universe.js already draws the statewide ring")


def p_phone_opening():
    src = _read("prototype/ccr_universe.js")
    aware = bool(re.search(r"(narrowScreen|matchMedia|innerWidth)[\s\S]{0,400}?sph\.half", src))
    return (not aware), ("sph.half is fixed for every viewport" if not aware
                         else "the opening already reads the viewport")


def p_eths_misprefixed():
    src = _read("unified_courses_data.js")
    if not src:
        return True, "unified_courses_data.js unreadable — premise unverified"
    try:
        rows = json.loads(src[src.index("{"):src.rindex("}") + 1])["rows"]
    except Exception:
        return True, "unified_courses_data.js unparsed — premise unverified"
    PHYS = ("fencing", "swim", "golf", "track", "yoga", "aerobic", "fitness",
            "weight", "aquatic", "tennis", "soccer", "basketball", "volleyball")
    n = sum(1 for r in rows
            if str(r.get("id", "")).startswith("ETHS")
            and any(w in (r.get("title") or "").lower() for w in PHYS))
    return n > 0, "%d ETHS-prefixed physical-activity identities" % n


def p_eths_extension_open():
    """Card 3: do ETHS stand-alones still carry the Exercise Science mix-up?"""
    from _build_crosslist_decision_sheet import PHYSICAL
    try:
        recs = (json.loads(_read("kb/coci_minted_singletons.json") or "{}").get("courses") or {})
    except ValueError:
        return True, "kb/coci_minted_singletons.json unparsed - premise unverified"
    n = sum(1 for k, r in recs.items() if k.split(" ")[0] == "ETHS"
            and any(w in (r.get("common_title") or "").lower() for w in PHYSICAL))
    return n > 0, "%d ETHS stand-alones carry a physical-activity title" % n


def p_cards_current_total():
    """Card 4: does the priority card still call the demonstrated figure Current Total?"""
    src = _code(_read("cpl_funding.js"))
    m = re.search(r"function earnedLineHtml[\s\S]{0,1500}?'\">Current Total: <strong>'", src)
    return bool(m), ("the priority card labels the demonstrated figure Current Total" if m
                     else "the priority card no longer says Current Total")


def p_thankyou_acknowledge():
    """Card 5: does the college thank-you still promise the CO will acknowledge it?"""
    n = len(re.findall(r"will acknowledge it", _code(_read("cpl_funding.js"))))
    return n > 0, "%d thank-you line(s) promise an acknowledgment" % n


def p_explainer_reserve():
    """Card 6: does the explainer's Step two note still say the model reserves funding?"""
    html = _read("funding-model/index.html")
    hit = "reserves the funding an institution demonstrates" in html
    return hit, ("the explainer's Step two note still says the model reserves funding" if hit
                 else "the explainer's Step two note no longer says reserves")


def _next_steps():
    """kb/_jev_next_steps.py, measured once per build (it reads the catalog)."""
    global _NEXT
    try:
        return _NEXT
    except NameError:
        import _jev_next_steps
        _NEXT = _jev_next_steps.measure()
        return _NEXT


def p_ccr_no_gate():
    """Card 8: the course reference still has no measured gate."""
    src = _code(_read("kb/_jev_adjudicate.py"))
    block = re.search(r"GATES = \{[\s\S]*?\n\}", src)
    open_ = bool(block) and '"ccr"' not in block.group(0)
    return open_, ("the ccr has no entry in GATES" if open_ else "the ccr has a gate in GATES")


def p_ccrr_course_pairing():
    """Card 9: pairing by shared course identity is measured and not yet built."""
    built = "def build_course_pairs" in _read("kb/_typesafe_cr_trial.py")
    n = _next_steps()["ccrr"]["course_pairs"]
    return (n > 0 and not built), ("%d course pairs measured; pairing %s" %
                                   (n, "built" if built else "not built"))


def _latest_rel(pattern):
    hits = sorted(glob.glob(os.path.join(ROOT, pattern)))
    return os.path.relpath(hits[-1], ROOT) if hits else ""


# The exhibit scanner's rules that need a person (kb/_jev_adjudicate.py CER_RULES).
CER_JUDGED = ("norm_dup_titles", "bare_vs_leveled", "issuer_variant_cluster",
              "level_notation_twins", "issuer_family_mixed")


def p_cer_judgment_open():
    """Card 10: the latest exhibit scan still reports findings that need judgment."""
    try:
        raw = json.loads(_read(_latest_rel("kb/trail_crew_out/*/findings.json")) or "{}")
    except ValueError:
        return True, "the exhibit findings did not parse - premise unverified"
    rows = raw.get("findings", []) if isinstance(raw, dict) else raw
    n = sum(1 for f in rows if f.get("needs_judgment") and f.get("rule") in CER_JUDGED)
    return n > 0, "%d exhibit findings need judgment" % n


def p_csr_autb_collision():
    """Card 11: AUTB still names two disciplines, with no fan-in declared."""
    try:
        reg = (json.loads(_read("kb/discipline_canonical_subj4.json") or "{}")
               .get("disciplines") or {})
    except ValueError:
        return True, "the CSR registry did not parse - premise unverified"
    names = [d for d, e in reg.items() if (e or {}).get("canonical_subj4") == "AUTB"]
    ruled = len(names) == 2 and all(
        set(names) - {d} <= set((reg[d] or {}).get("fan_in_with") or []) for d in names)
    open_ = len(names) > 1 and not ruled
    return open_, ("AUTB names %d disciplines" % len(names))


def p_sierra_try_both_buttons():
    """Card 12: Try it in still shows both buttons wherever CPL Assistant is hidden."""
    src = _code(_read("sierra_training.js"))
    m = re.search(r"function tryGroup\([\s\S]*?\n  \}", src)
    body = m.group(0) if m else ""
    open_ = ">Sierra</button>" in body and "sierraHost(" not in body and "org-hidden" not in body
    return open_, ("tryGroup draws Sierra and My College whatever the side menu hides" if open_
                   else "tryGroup already reads the side menu")


# The unit range (Sam, 2026-09-27: units never split an identity), read from the
# CR Reference worklist. Not memoized: the coverage fixtures swap _read per call.
_UNIT_LEAD = re.compile(r"^\s*[\d.]+(?:\s*(?:or|-|\u2013|to)\s*[\d.]+)?\s*(?:hours?|units?)\s+in\s+", re.I)


def _crr_units():
    try:
        groups = json.loads(_read("kb/cr_reference_worklist.json") or "{}").get("groups", [])
    except ValueError:
        groups = []
    vary = [g for g in groups if g.get("units_differ")]
    worded = [g for g in vary if g.get("canonical_source") in ("most_colleges", "published_statewide")
              and _UNIT_LEAD.match(g.get("canonical") or "")]
    held = [g for g in vary if g.get("rung") == 4 and "units" in (g.get("screens_objecting") or [])]
    return {"vary": len(vary), "worded": len(worded), "held": len(held),
            "published": sum(1 for g in worded if g.get("canonical_source") == "published_statewide")}


def p_crr_canonical_units():
    """A wording canonical still states one unit figure over wordings that differ."""
    n = _crr_units()["worded"]
    return n > 0, "%d wording canonicals state one figure over wordings that differ" % n


def p_crr_rung4_units_screen():
    """Units still hold a rung-4 twin merge for a curator."""
    open_ = "if rung == 4 and units_differ:" in _read("kb/_build_cr_reference.py")
    return open_, ("the rung-4 units screen is in the builder" if open_
                   else "the rung-4 units screen is gone")


# The narrated draft of CPL Funding in Motion (Sam, 2026-09-27: it comes back
# to him before the explainer links it), read from the committed files.
def p_video_narrated_unlinked():
    """The explainer still does not link the narrated cut."""
    page = _read("funding-model/index.html")
    open_ = "Narrated_Draft" not in page and "funding_in_motion_n1" not in page
    return open_, ("the explainer does not link the narrated cut" if open_
                   else "the explainer links the narrated cut")


def _video_scene(name):
    try:
        scenes = json.loads(_read("prototype/funding_video/narration_s1.json") or "{}").get("scenes", [])
    except ValueError:
        scenes = []
    return next((s for s in scenes if s.get("scene") == name), {})


def p_video_timing_trails():
    """The Timing scene's two-year line still trails its words (its cue is skipped)."""
    open_ = any(c.get("skip") and (c.get("word") or "").startswith("The full two-year amount")
                for c in _video_scene("Timing").get("cues", []))
    return open_, ("the two-year amount's cue is skipped" if open_
                   else "the two-year amount's cue is pinned")


def p_video_sample_unnarrated():
    """The Targets scene's voice still does not name Sample College."""
    text = _video_scene("Targets").get("text", "")
    open_ = bool(text) and "Sample College" not in text
    return open_, ("the Targets narration does not name Sample College" if open_
                   else "the Targets narration names Sample College")


_ZERO_RANGE = re.compile(r"\(0\s*[\u2013-]\s*[\d.]+ units?\)|^0(?:\.0+)?\s+hours?\s+in\s", re.I)


def p_crr_zero_hours():
    """Sheet 4, card 3: CR Reference groups still name a range or a figure of 0."""
    try:
        groups = json.loads(_read("kb/cr_reference_worklist.json") or "{}").get("groups", [])
    except ValueError:
        return True, "kb/cr_reference_worklist.json unparsed - premise unverified"
    n = sum(1 for g in groups if _ZERO_RANGE.search(g.get("canonical") or ""))
    return n > 0, "%d CR Reference group(s) named with a figure of 0" % n


# The narrated Scenario 2 draft (sheet 4 card 8, S305): the explainer must not
# link it until Sam approves the read AND the Chancellor finalizes Scenario 2.
def p_video_n2_unlinked():
    """The explainer does not link the Scenario 2 narrated draft."""
    page = _read("funding-model/index.html")
    open_ = "funding_in_motion_n2" not in page and "Scenario_2_Narrated" not in page
    return open_, ("the explainer does not link the Scenario 2 narrated draft" if open_
                   else "the explainer links the Scenario 2 narrated draft")


# Sierra's read of Scenario 2 (S317): a scene still waits on its read while the
# ElevenLabs account cannot generate.
def p_video_n2_pending():
    """narration_s2.json still carries a scene waiting on its read."""
    try:
        scenes = json.loads(_read("prototype/funding_video/narration_s2.json") or "{}").get("scenes", [])
    except ValueError:
        return True, "narration_s2.json unparsed - premise unverified"
    waiting = [s.get("scene") for s in scenes if s.get("pending")]
    return bool(waiting), ("%s still waits on its read" % ", ".join(waiting) if waiting
                           else "every scene of the Scenario 2 narration is read")


# Sierra's program course lists (S318): the programs loader that fills the join
# key, and the grants that close the three catalog loaders, are not yet live.
def p_program_ctl_pending():
    """The programs schema file still marks its loader and grants block unapplied."""
    sql = _read("chatbox/supabase_search_college_programs.sql")
    open_ = "are NOT yet" in sql and "applied" in sql
    return open_, ("the programs loader and the loader grants are marked not yet applied" if open_
                   else "the programs loader and the loader grants are marked applied")


# The Reporting box (sheet 4 card 2): nothing writes expenditures yet.
def p_reporting_box_unbuilt():
    """No consumer writes cpl_funding_reports yet."""
    n = sum(_code(_read(f)).count("cpl_funding_reports") for f in ("cpl_funding.js", "college_briefing.js"))
    return n == 0, ("no tab reads or writes cpl_funding_reports" if n == 0
                    else "%d reference(s) to cpl_funding_reports in the tabs" % n)


# The Reporting box's college half (sheet 6 card 4, S307): My College does not
# read cpl_funding_reports until Sam picks how a college's staff sign in.
def p_college_reports_unbuilt():
    """My College does not read the college's own reports yet."""
    n = _code(_read("college_briefing.js")).count("cpl_funding_reports")
    return n == 0, ("My College does not read cpl_funding_reports" if n == 0
                    else "My College reads cpl_funding_reports")


# Priority 1 on pa_u (Sam, 2026-09-30): the feed's applied measure still
# leaves out portal-origin students, whom ppa_u counts on their own.
def p_pa_excludes_portal():
    """cpl_funding_performance.js says PA and PPA describe disjoint cohorts."""
    src = _read("cpl_funding_performance.js")
    open_ = "PA and PPA describe disjoint cohorts" in src
    return open_, ("the feed's basis still says PA leaves out portal-origin students" if open_
                   else "the feed's basis no longer describes PA and PPA as disjoint")


# My College: two different figures carry the one label "units waiting".
def p_units_waiting_twice():
    """college_briefing.js labels two different figures 'units waiting'."""
    src = _code(_read("college_briefing.js"))
    dormant = bool(re.search(r'fmt\(dormant\)\s*\+\s*" units waiting"', src))
    art = bool(re.search(r'fmt\(st\.articulatedWaiting\)\s*\+\s*" units waiting', src))
    return dormant and art, ("both figures read 'units waiting'" if dormant and art
                             else "the two figures no longer share the label")


# ⚠️ EACH CARD CARRIES ITS OWN EVIDENCE (S302, 2026-09-29), under the key
# `evidence`. Until then a dict keyed by the card's POSITION held it, and every
# pull request that dropped one card renumbered every card after it, so two
# parallel verdict PRs could not both land without a hand-merged renumbering.
# The position is still the number Sam replies with; it is simply no longer a
# key anything else depends on.
def evidence_of(I):
    """The evidence each card declares, by the number the sheet shows it under."""
    return {n: list(it.get("evidence") or []) for n, it in enumerate(I, 1)}


PROVENANCE = {
    "measured": "Measured from the repo when this sheet was built.",
    "live": "Checked against the live system on %s. Re-verify before ruling — "
            "this builder cannot reach it.",
    "quoted": "Quoted from %s as of %s. Second-hand: nobody re-checked it for "
              "this sheet.",
    "policy": "A judgment, not a measurement — nothing here to go stale.",
}


def provenance_line(ev):
    bits = []
    for e in ev:
        k = e["kind"]
        if k == "live":
            bits.append(PROVENANCE[k] % e["checked"])
        elif k == "quoted":
            bits.append(PROVENANCE[k] % (e["src"], e["as_of"]))
        else:
            bits.append(PROVENANCE[k])
    return " ".join(bits)


def check_premises(I):
    """Run every measured premise. Returns the cards whose premise has moved."""
    settled = []
    for n, it in enumerate(I, 1):
        for e in it.get("evidence") or []:
            if e["kind"] != "measured":
                continue
            still_open, detail = e["fn"]()
            if not still_open:
                settled.append((n, it["title"], detail))
    return settled



CH_LATER = ('Later', 'later')

E = m.E

# Sheet 36 card 1: the guarded UPDATE, read from the S330 receipt at build time so the card and the
# receipt never differ. The paste text starts at the statement itself: the receipt's header and its
# rollback comment are comment lines, which sheet 35's first build pasted by mistake.
def _receipt_update(rel):
    text = _read(rel)
    i = text.find('\nupdate public.program_source_registry\n')
    if i < 0:
        raise SystemExit('REFUSING TO BUILD — no UPDATE statement in %s' % rel)
    return text[i + 1:].rstrip()


SQL_V2 = _receipt_update('kb/receipts/program_source_registry_procedure_2026-10-04_s330.sql')

# Sheet 37's card: the request, held for Sam (outward). House voice: CLAUDE.md, Naming & terminology.
# Revised S331 for reads 7-12: the 2016 list, Columbus High's two courses, the CCAP partnership.
REQUEST_DRAFT = ("Subject: Cerritos College high school articulation agreements\n\nGood afternoon,\n\n"
    "The CPL Initiative at the California Community Colleges Chancellor's Office is mapping one pathway at Cerritos "
    "College, from high school through the Field Ironworker Supervision bachelor's degree, so that a student can see "
    "which earlier learning counts toward each award. Cerritos's 2026-27 catalog and its Petition for Credit by "
    "Examination for Articulated High School Course explain how a student earns credit for an articulated course, "
    "and the pathway cites both.\n\n"
    "The most recent list of Cerritos's high school agreements we could find is the Statewide Career Pathways list "
    "of March 2016, which holds 57 agreements. Columbus High School now offers Welding and Materials Joining I and "
    "a capstone course, and Downey Unified describes the pathway as equivalent to WELD 100 Welding Fundamentals. "
    "Columbus High is also one of Cerritos's CCAP partner schools.\n\n"
    "The agreements are Cerritos's to keep and to publish as it chooses. If your office can share the current list, "
    "or tell us whether Columbus High's welding students earn Cerritos credit through an articulation agreement or "
    "through CCAP, we will show it on the pathway with Cerritos named as the source.\n\n"
    "Thank you for considering it.\n\n[Name]\nMAP team, CPL Initiative\nCalifornia Community Colleges Chancellor's Office")



# S332: the premises sheet 38's cards rest on.
def _uc_members():
    s = _read('unified_courses_members.js')
    k = 'window.CPL_UC_MEMBERS = '
    if k not in s:
        return {}, []
    d = json.loads(s[s.index(k) + len(k):s.rindex('}') + 1])
    return d.get('members') or {}, d.get('colleges') or []


def p_iwap_4109_alone():
    """Cerritos IWAP 41.09 still stands alone in the CCR, outside the OSHA 30 Construction identity."""
    mem, cols = _uc_members()
    homes = sorted(mid for mid, ms in mem.items() for m in ms
                   if cols and cols[m['c']] == 'Cerritos College' and m['n'] == 'IWAP 41.09')
    still_open = bool(homes) and 'CNST M1001' not in homes
    return still_open, ('Cerritos IWAP 41.09 sits under %s; CNST M1001 holds %d OSHA 30 Construction courses'
                        % (', '.join(homes) or 'no identity', len(mem.get('CNST M1001') or [])))


def p_ext_review_unclassified():
    """The CER still carries MAPCXA-E&R-1-001 under its raw title, Ext & Review."""
    u = json.loads(_read('kb/unified_titles.json') or '{}').get('Ext & Review') or {}
    still_open = u.get('unified_title') == 'Ext & Review'
    return still_open, ('the CER titles exhibit MAPCXA-E&R-1-001 "%s" (confidence %s)'
                        % (u.get('unified_title'), u.get('confidence_title')))


def p_fire_inspector_split():
    """The CER still holds both Fire Inspector 1C titles."""
    c = json.loads(_read('kb/credentials.json') or '{}')
    still_open = 'Fire Inspector 1C' in c and 'SFT Fire Inspector 1C' in c
    return still_open, ('the CER holds %s' % ('both Fire Inspector 1C titles' if still_open else 'one Fire Inspector 1C title'))


# S333: the premise of sheet 39's issuer card.
OSHA_NAMES = re.compile(r'Occupational Safety and Health Administration|^U\.S\. Department of Labor$')


def p_osha_issuer_names():
    """The CER still names OSHA more than one way as issuer, or a trainer as the OSHA 10 entry's issuer."""
    c = json.loads(_read('kb/credentials.json') or '{}')
    names = {}
    for recs in c.values():
        for r in (recs if isinstance(recs, list) else [recs]):
            ia = (r or {}).get('issuing_agency') or ''
            if OSHA_NAMES.search(ia):
                names[ia] = names.get(ia, 0) + 1
    ctcnc = [r.get('issuing_agency') for r in c.get('OSHA 10-hour Construction Training Course') or []]
    trainer_issues = any('CTCNC' in (ia or '') for ia in ctcnc)
    still_open = len(names) > 1 or trainer_issues
    return still_open, ('the CER names OSHA %d way(s) as issuer (%s); the OSHA 10-hour Construction entry names %s'
                        % (len(names), '; '.join('%s on %d' % kv for kv in sorted(names.items(), key=lambda x: -x[1])),
                           ', '.join(map(str, ctcnc)) or 'no issuer'))


# S327: the premises sheet 33's cards rest on.
def p_csu_la_counted():
    """CSU LA still sits in the scrape's tiers, so the count wording is still open."""
    lm = json.loads(_read('live_metrics.json'))
    names = json.dumps(lm.get('tiers') or {})
    on = 'California State University Los Angeles' in names
    return on, ('live_metrics.json (scraped %s) lists CSU LA among %s colleges'
                % (lm.get('scraped_at'), lm.get('college_count')) if on
                else 'live_metrics.json no longer lists CSU LA')


def p_csu_la_no_registry_row():
    """The harvest registry seeds from coci_college_programs, which holds no CSU."""
    sql = _read('kb/supabase_program_source_registry.sql')
    seeded = 'coci_college_programs' in sql and 'California State University' not in sql
    return seeded, ('the registry seeds from coci_college_programs and names no CSU' if seeded
                    else 'the registry SQL now names a CSU campus')


def p_outcomes_in_pilot_pages():
    """How many captured pilot pages print outcomes; the card holds while the record shape lacks them."""
    hits, n = 0, 0
    for path in sorted(glob.glob(os.path.join(ROOT, 'kb/program_requirements_pilot/sources/*.json'))):
        n += 1
        t = (json.load(open(path)).get('text') or '')
        if re.search(r'(program|student) learning outcomes?', t, re.I):
            hits += 1
    shape = (_read('kb/_program_requirements_extract.py')
             + _read('chatbox/supabase/functions/program-requirements-extract/index.ts'))
    still_open = 'outcomes' not in shape
    return still_open, ('%d of %d captured pilot pages print program or student learning outcomes; '
                        'the record shape %s them' % (hits, n, 'does not carry' if still_open else 'now carries'))


# S328: the premise sheet 34's card 2 rests on.
def p_no_procedure_record():
    """No per-college procedure record exists yet: the registry and the reader name none."""
    text = (_read('kb/supabase_program_source_registry.sql')
            + _read('kb/_program_requirements_pilot.py')
            + _read('kb/_program_requirements_extract.py'))
    still_open = not re.search(r'procedure', text, re.I)
    return still_open, ('the registry and the reader carry no procedure record' if still_open
                        else 'the registry or the reader now names a procedure record')


# ── the coverage audit ───────────────────────────────────────────────────────
def lanes_with_asks():
    out = {}
    for p in sorted(glob.glob(os.path.join(LANES, '*.md'))):
        text = open(p, encoding='utf-8').read()
        n = len(NEEDS.findall(text))
        if n:
            out[os.path.splitext(os.path.basename(p))[0]] = n
    return out


def audit_coverage(items):
    """Every lane carrying a NEEDS-SAM marker is covered or dismissed by name."""
    found = lanes_with_asks()
    covered = {it['lane'] for it in items}
    missing = sorted(set(found) - covered - set(NO_OPEN_ASK))
    stale = sorted(covered - set(found))
    dead = sorted(set(NO_OPEN_ASK) - set(found))
    return found, missing, stale, dead


# ── the items ────────────────────────────────────────────────────────────────
def items():
    """The cards: every ask a lane marks, one card each.

    2026-09-29 (S302): Sam answered all eighteen cards of sheet 3
    (`2026-09-29-open-asks-3`, `replies/done` through 18 at 12:39Z), and each
    ruling left with its lane's marker in one pull request. The predicates the
    cards rested on stay above: a later card may rest on the same premise, and
    the fixtures in `tests/open_asks_sheet_coverage_test.py` keep each one honest
    both ways.

    A card is a dict: lane, title, ref, facts, why, rec, chips, and `evidence`,
    a list of measured() / live() / quoted() / policy() entries.
    """
    I = []

    # Sheet 4's nine cards (S303) left with their rulings: Sam answered all nine
    # on 2026-09-29 (through 9, each his own call), and each lane records its
    # ruling in the same change. p_crr_zero_hours stays for a later card.

    # Sheet 6's seven cards (S306; sheet 5's five carried) left with their
    # rulings: Sam answered all seven at 15:26Z on 2026-09-30 (through 7; six
    # his own call, card 3 as proposed), and each lane records its ruling in the
    # same change. The predicates above stay for a later card.

    # Sheet 7's one card (S307) left with its ruling: Sam chose MAP's two
    # contacts at 17:09Z on 2026-09-30, and the funding lane records it.

    # Sheet 8's one card (S307) left with its ruling: Sam chose "curate" at
    # 18:52Z on 2026-09-30 (cpl-knowledge-base#24), and the governance lane
    # records it.

    # Sheet 14's six cards left with Sam's rulings (21:22Z, 2026-10-01, all his own call).
    # Sheet 16's five cards (S313) were all answered at 00:36Z on 2026-10-02 (through 5):
    # card 4 Dec 30 (applied, S314), card 5 keep $9,759,692. Card 1 "wrong" restated v76's
    # answer: no ask had reached v77; smoke 15e asked it and v77 answers right (sierra lane). Card 2 "Done" left
    # no write in kb_curation, and the card itself was wrong: the CER shows Confirm merge
    # only after the new title is typed. Card 3 asked what cards 23-24 are.
    # Sheet 19's two cards (S315) were answered at 11:52Z on 2026-10-02 (through 2, both his own
    # call): card 1 "write" (cer-decision-apply.yml, #1820) and card 2 "sum" (the statewide Access
    # target becomes the institutions' sum on the card, the explainer and the film; S316 builds it).
    # p_cap_trims_targets stays above for a later card.

    # Sheet 21 (S318) was answered at 19:04Z on 2026-10-02 (through 3, each his own call): card 1
    # "pasted" (he ran the loader and grants SQL at ~19:40Z, read back 19:42Z), card 2 "later" (carried
    # below), card 3 "keep" (the funding lane records it). p_program_ctl_pending stays for a later card.
    # Sheet 22's one card (S318, the ElevenLabs plan) was answered in chat at ~21:05Z on 2026-10-02:
    # "OK, we're on a paid plan with Elevenlabs" (Sam), with "Narration sounds good to start with".
    # S317 read Minimum conditions the same hour, rendered _Draft_3 and linked it from the explainer's
    # Scenario 2 view. p_video_n2_pending stays above for a later card.

    # Sheet 23 (S319), the program requirements harvest's eight calls, was answered at 15:05Z on
    # 2026-10-03: "As proposed" (his own pick). The lane records the rulings.

    # Sheet 29 (S325) was answered at 11:54-12:00Z on 2026-10-04 (through 5, each his own call): card 2
    # guard lifted, card 3 a note on the college's record, card 4 yes, card 5 go. Each lane records its
    # ruling in the same change (S326). Card 1 "later" is carried into the one card below.
    # Sheet 31 (S326) was answered at 16:56Z on 2026-10-04: card 1 pasted (as proposed). S326
    # handed the SQL in one paste, cut to the three memory rows still missing and both
    # privilege closes; the live read-back matched. Its card is retired.

    # Sheet 32 (S326) was answered at 17:33Z on 2026-10-04, both cards his own call, as proposed:
    # the CPL figure ("up to" plus the recommended path's, with CPL in three kinds per his note)
    # and where catalog-and-state-file differences go. The lane records both; no card remains.

    # Sheet 33 (S327) was answered at 18:52-18:57Z on 2026-10-04, all five his own call: card 1 one
    # concise statement of who CPL serves, card 2 CCC-only funding, card 3 CSU LA later, card 4 as
    # proposed, card 5 exhaust the agent before any request. Each lane records its ruling (S328).

    # Sheet 34 (S328) was answered at 19:18Z on 2026-10-04, both his own call: card 1 the statement as
    # drafted with two edits (no UpSkill line; "datasets", never "scrape"), card 2 the per-college
    # procedure record as proposed. Both lanes record the rulings; no card remains.

    # Sheet 35 (S329) was answered at 21:43Z on 2026-10-04 (through 1, his own call): "pasted",
    # "success no rows returned". Read back: Cerritos's procedure record on its row at 21:42:37Z. The
    # harvest lane records it and drops its NEEDS SAM in the same change; no card remains.

    # Sheet 36 (S330) was answered at 23:50-23:51Z on 2026-10-04 (through 2, both his own call): card 1
    # "pasted" ("it gave the correct read back"); card 2 edit and follow up ("lets work together to see if we
    # ca find these another way and close the gap"): the request stays held while sessions try other routes.
    # Then "go ahead on writing the function": program_source_procedure_set() writes a procedure record from a
    # session with no paste (v3, 00:1xZ). The harvest lane records both; no card remains.
    # Sheet 36's card 3 (the Ironworker film, draft v1) left with Sam's ruling in chat (2026-10-04 23:42Z):
    # "Video is excellent!" The film README and the harvest lane record it.

    # Sheet 37 (S331) was answered at 06:00Z on 2026-10-05 (through 1, his own call): card 1 hold, "Don't
    # worry about this for now until I investigate later." The request stays held and Sam investigates;
    # REQUEST_DRAFT stays above for the day he asks for it. The harvest lane records the ruling and drops
    # its NEEDS SAM in the same change (S332); no card remains.

    # Sheet 38 (S332) was answered at 06:36-06:44Z on 2026-10-05 (through 5): card 1 go (as proposed; the
    # display build and the S332 memory rows applied through apply_migration, read back against their
    # receipts); card 2 later, "Not sure I understand the problem here. I assume Cerritos teaches osha 30
    # imbedded in their class"; card 3 name it (kb/cer_decisions_out/2026-10-05); card 4 keep both, "I
    # think these are different though they sound the same"; card 5 go (Sierra docked in the tab). The
    # harvest lane records each ruling and drops its NEEDS SAM in the same change; no card remains.

    # Sheet 39 (S333) was answered at 15:52Z on 2026-10-05 (through 2, both his own call): card 1 go (display
    # build 799bfb9a7dbf applied as a two-path guarded update, all 20 rows matching its md5s; #1866); card 2
    # name (OSHA's one name as issuer: kb/credentials.json edited, five curator rows replaced through
    # kb/cer_decisions_out/2026-10-05-2). The harvest lane records both and drops its NEEDS SAM; no card remains.

    I.append({
        'lane': 'program-requirements-harvest',
        'title': "Write the program outcomes into the 20 live program records?",
        'ref': 'program-requirements-harvest NEEDS SAM · '
               'kb/receipts/program_requirement_records_outcomes_2026-10-05.sql · '
               'kb/_program_requirements_file.py',
        'facts': (
            "<p>Record shape 3, your sheet 33 card 4, now runs. Nineteen of the 20 pilot programs print learning "
            "outcomes, and their records hold them word for word, 1 to 11 each. The scorer checked every one against "
            "the catalog page it came from. Mt. San Antonio keeps its outcomes in a hidden Outcomes tab, which the "
            "reader now opens; its Early Childhood Education transfer degree links to an outcomes page instead.</p>"
            "<p>Each record keeps the requirements you read. Six came back from the rerun with a heading or a block "
            "name worded differently, so those keep your reading as filed and take only the outcomes. Your 20 verdicts "
            "hold, and the up-to figures, the CPL marks and Sierra's display facts stay as they are.</p>"
            "<p>The live table holds the records without outcomes. The write sets them on each row only while that "
            "row is still the record you read, and one query shows every row as before or after. A dry run on "
            "Cerritos's Ironworker A.S. in the database produced the after state the receipt expects.</p>"),
        'why': "Rule 10: a write to a shared table waits on your go and carries a receipt that rolls it back.",
        'rec': "<strong>Go:</strong> a session applies the receipt through <code>apply_migration</code>, reads back "
               "all 20 rows as after, and records it in the lane. <em>It might be wrong if</em> you want a person to "
               "read the outcomes before Sierra can quote them.",
        'chips': chips(('Go', 'go'), CH_LATER),
        'evidence': [live('2026-10-05', "md5(record::text) on all 20 program_requirement_records rows against the "
                          "state before outcomes (20 of 20 read before, re-read after Mt. San Antonio's outcomes were "
                          "filed), and a read-only jsonb_set dry run on Cerritos 42158 returning the after md5 the "
                          "loader computes")],
    })

    # Sheet 42 (S335): the drafts for the college, sheet 32 card 2's harvest-tab half, built.
    I.append({
        'lane': 'program-requirements-harvest',
        'title': "Write the display build that adds Miramar's two drafts?",
        'ref': 'program-requirements-harvest NEEDS SAM · '
               'kb/receipts/program_requirement_records_display_2026-10-05_1cb75672ba6c_delta.sql · '
               'kb/_build_roep_display.py second_courses',
        'facts': (
            "<p>Your sheet 32 card 2 sent the college's own differences to its row in the harvest tab as drafts, for "
            "the MAP team to send. The Program records view now gathers them under each college with the text to copy, "
            "and Catalogs can show only the colleges that have some. All five pilot colleges hold some, 26 today, each a "
            "place where the catalog and the state's Program Course File list different courses.</p>"
            "<p>The build adds two for Miramar. MAP's articulated-exhibit view lists AUTO 156G Engine and Related Systems "
            "on the EMT Certification articulation (0.3 hours in Perilaryngeal Airway Adjuncts/Defibrillation Training) "
            "beside EMGM 106, and on Driver Operator 1B (0.3 hours in Driver Operator - Pumping) beside FIPT 321P. "
            "Students received both credits on EMGM 106 and FIPT 321P at 0.25 hours, so none came through AUTO 156G. "
            "Across the whole feed the same test finds one other row, at San Bernardino Valley, outside the pilot.</p>"
            "<p>The two builds differ in two places only: the build stamp on all 20 rows and the gaps on Miramar's "
            "Entrepreneurship degree. Each statement changes a row only while it holds today's build, and a read-only "
            "query returned the expected result on all 20.</p>"),
        'why': "Rule 10: a write to a shared table waits on your go and carries a receipt that rolls it back.",
        'rec': "<strong>Go:</strong> a session applies the receipt through <code>apply_migration</code> and reads all "
               "20 rows back against the build. <em>It might be wrong if</em> Miramar's 0.3-hour versions are a "
               "catalog year MAP keeps on purpose; then the draft asks the college, which is its purpose.",
        'chips': chips(('Go', 'go'), CH_LATER),
        'evidence': [live('2026-10-05', "md5(display::text) on all 20 rows against build 799bfb9a7dbf (20 of 20 "
                          "match), a read-only jsonb_set run returning build 1cb75672ba6c's md5 on all 20, and "
                          "map_college_cr_unit for Miramar's two exhibits (students on EMGM-106 and FIPT-321P only)")],
    })

    I.append({
        'lane': 'program-requirements-harvest',
        'title': "When do the drafts show on My College?",
        'ref': 'program-requirements-harvest NEEDS SAM · my-college-action-page · college_briefing.js',
        'facts': (
            "<p>Your sheet 32 card 2 put the drafts in two places: the college's row in the harvest tab, and its "
            "My College to-dos, with the MAP team deciding when to send. The harvest tab half is built.</p>"
            "<p>My College is the college's own page. A college that opens it would read a draft there before the MAP "
            "team sends anything. The same card says <em>nothing goes to a college on its own</em>.</p>"),
        'why': "The two halves of your answer pull against each other on the college's own page.",
        'rec': "<strong>Once sent:</strong> My College lists an item after the MAP team has sent it, so the college "
               "reads there what it already heard from the team. That needs a record of what was sent, which a later "
               "session proposes on its own card. <em>It might be wrong if</em> you want colleges to see the open "
               "items first; then My College shows them now, marked for review.",
        'chips': chips(('Once sent', 'once-sent'), ('Show them now', 'now'), CH_LATER),
        'evidence': [policy()],
    })

    return I


def build(check_only=False):
    I = items()
    found, missing, stale, dead = audit_coverage(I)

    # ── every card declares its evidence ─────────────────────────────────────
    EV = evidence_of(I)
    undeclared = [n for n in range(1, len(I) + 1) if not EV[n]]
    if undeclared:
        print("REFUSING TO BUILD — these cards declare no evidence: %s\n"
              "Every card says what its premise rests on: measured(), live(), "
              "quoted() or policy(). A card with none is a claim nobody owns."
              % ", ".join(map(str, undeclared)), file=sys.stderr)
        return 1

    # ── and every measured premise is re-run, here, now ──────────────────────
    settled = check_premises(I)
    if settled:
        print("REFUSING TO BUILD — these cards ask about work that is already "
              "done. Measured just now:", file=sys.stderr)
        for n, title, detail in settled:
            print("  %2d. %s\n      -> %s" % (n, title, detail), file=sys.stderr)
        print("\nRemove the card, or correct it if the premise changed rather "
              "than closed. This guard exists because four cards on the "
              "2026-09-22 sheet asked Sam to rule on work that had already "
              "shipped — one of them citing his own ask, by date, in the very "
              "file that implemented it.", file=sys.stderr)
        return 1

    # ── a paste card carries the text to paste ───────────────────────────────
    # Sheet 31 named four file paths; Sam pasted a path into the SQL editor and
    # got a syntax error (2026-10-04). The SQL goes on the card, in a <pre> block.
    bare = [n for n, it in enumerate(I, 1)
            if re.search(r'\bpaste\b', it['title'], re.I)
            and '<pre' not in (it.get('facts', '') + it.get('rec', ''))]
    if bare:
        print("REFUSING TO BUILD — these paste cards carry no text to paste: %s\n"
              "Put the SQL itself on the card in a <pre> block, cut to what a live "
              "read shows is still missing." % ", ".join(map(str, bare)), file=sys.stderr)
        return 1

    if missing:
        print("REFUSING TO BUILD — these lanes carry a NEEDS-SAM marker that no item "
              "covers and no dismissal names:", file=sys.stderr)
        for lane in missing:
            print(f"  · {lane} ({found[lane]} marker(s))", file=sys.stderr)
        print("\nAdd an item with 'lane': '<name>', or name it in NO_OPEN_ASK with a "
              "reason. A sheet that silently misses a lane is the failure this guard "
              "exists for.", file=sys.stderr)
        return 1

    for lane in stale:
        print(f"note: item(s) cover '{lane}', which carries no NEEDS-SAM marker — "
              f"check the lane still holds the ask.", file=sys.stderr)
    for lane in dead:
        print(f"note: NO_OPEN_ASK names '{lane}', which carries no marker — "
              f"the dismissal can go.", file=sys.stderr)

    lanes = sorted({it['lane'] for it in I})
    if not I:
        # Nothing waits on Sam that a lane has marked. Write no sheet: an empty
        # one would read as a decision to make, and the last published sheet
        # keeps his answers in its own store.
        print("coverage ok — nothing outstanding: no lane carries a NEEDS-SAM "
              "marker, so no sheet is written")
        return 0
    if check_only:
        kinds = {}
        for n in range(1, len(I) + 1):
            for e in EV[n]:
                kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
        print(f"coverage ok — {len(I)} items across {len(lanes)} lanes; "
              f"{len(found)} lane(s) carry a marker, {len(NO_OPEN_ASK)} dismissed by name")
        print("evidence: " + " · ".join("%s %d" % (k, v) for k, v in sorted(kinds.items()))
              + "  (every measured premise re-checked and still open)")
        return 0

    # The reader sees where each claim came from, in their own words.
    I = [dict(it, facts=it["facts"]
              + '<p class="prov"><em>' + m.E(provenance_line(EV[n]))
              + '</em></p>')
         for n, it in enumerate(I, 1)]

    # JUST THE ITEMS (Sam, 2026-09-29): "Per our rules, no need for instruction
    # section on decision sheets; just the items." No framing, no count line,
    # no how-to box: build_sheet() draws its intro only when one is passed.
    out = m.build_sheet(sheet_title(), I, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(lanes)} lanes · {len(out):,} bytes "
          f"→ {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build(check_only='--check' in sys.argv[1:]))
