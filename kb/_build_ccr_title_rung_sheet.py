#!/usr/bin/env python3
"""The CCR title-rung calibration sheet — 50 courses, and where each is filed.

Sam ruled the sitting (2026-09-21): *"CCR gets the next sitting"*, at
*"40 to 60"*. The run is recorded in
`kb/receipts/jev_ccr_title_rung_2026-09-22_s282.json`.

    python3 kb/_build_ccr_title_rung_sheet.py

⚠️ THIS SHEET IS THE CALIBRATION, NOT THE CLEANUP. The CCR has no measured gate
— every row came back `uncalibrated` and Jev suggested nothing. What earns the
title rung a gate is Sam's verdict beside Jev's probability, so **only rows he
individually rules on count**: under opt-out an untouched item commits the
proposal marked `by: "default"`, and scoring against those measures the sheet
against itself.

⚠️ THE CHIPS ARE PER ITEM, AND THAT IS THE POINT. The proposal differs row by
row — some courses are proposed to stay, some to move — so a single chip order
would mean a first chip that confirms on one card and reverses on the next.
That is precisely the ambiguity that cost Sam sixteen reversals on 2026-09-20.
Each card therefore orders its own chips so the FIRST one always confirms, and
the stored value names the OUTCOME (`keep` / `move`), never agreement.

⚠️ MOST OF THESE ARE EXPECTED TO BE FINE. `discipline_title_mismatch` fires on
token overlap, so *Three-Dimensional Design* under Art reads as a mismatch and
is plainly right. Ruling "leave it" on an artifact is as informative as catching
a real miss — telling the two apart IS what the rung measures.
"""
import json
import sys

sys.path.insert(0, 'kb')
import _decision_sheet_replies as m  # noqa: E402

RECEIPT = 'kb/receipts/jev_ccr_title_rung_2026-09-22_s282.json'
OUT = 'docs/visuals/2026-09-22-ccr-title-rung.html'
SHEET_ID = '2026-09-22-ccr-title-rung'

# Where Jev's probability stops reading as "it fits" and starts reading as
# "it is filed wrong". ⚠️ These are PRESENTATION bands, not a gate: the CCR has
# no measured threshold, and the whole point of the sitting is to find one.
FITS_BELOW = 0.35
MISFILED_AT = 0.60

CHIPS_KEEP = [("Leave it", "keep"), ("Move it", "move"), ("Later", "later")]
CHIPS_MOVE = [("Move it", "move"), ("Leave it", "keep"), ("Later", "later")]

RULE_SAYS = {
    'discipline_title_mismatch':
        'its title shares no subject vocabulary with the discipline',
    'description_discipline_disagreement':
        'its description describes different subject matter',
    'generic_title_concrete_discipline':
        'its title is too generic to say what it teaches',
}


def build():
    r = json.load(open(RECEIPT, encoding='utf-8'))
    items = []
    for it in r['items']:
        p, disc, title = it['p_different'], it['discipline'], it['title']
        members = it['members']
        fits = p < FITS_BELOW
        arguable = FITS_BELOW <= p < MISFILED_AT
        colleges = (f"{members} colleges teach a course under it"
                    if members != 1 else "one college teaches a course under it")
        facts = (f"<strong>{m.E(title)}</strong> is filed under "
                 f"<strong>{m.E(disc)}</strong>, and {colleges}. "
                 f"It was flagged because {RULE_SAYS.get(it['rule'], 'a check fired on it')}.")
        if fits:
            why = ("Jev reads the title as belonging where it is. The check that flagged it "
                   "compares words, so a course whose name shares no vocabulary with its "
                   "discipline trips it even when the filing is right.")
            rec = (f"<strong>Leave it under {m.E(disc)}.</strong> "
                   "<em>It might be wrong if</em> the name means something different here "
                   "from what it sounds like.")
        elif arguable:
            why = ("Jev is genuinely undecided on this one, and that is why it is on the "
                   "sheet. Your read is the one that settles it.")
            rec = (f"<strong>Leave it under {m.E(disc)}</strong>, because moving a course is "
                   "the change and leaving it is the present state. "
                   "<em>It might be wrong if</em> you recognize it as belonging elsewhere.")
        else:
            why = ("Both the check and Jev read this as filed in the wrong place, which is "
                   "the pattern worth catching.")
            rec = (f"<strong>Move it out of {m.E(disc)}.</strong> "
                   "<em>It might be wrong if</em> the discipline is broader than its name "
                   "suggests, or the course is cross-listed.")
        items.append({
            'title': title,
            'ref': it['id'],
            'facts': facts,
            'why': why,
            'rec': rec,
            'rows': members,
            'chips': CHIPS_KEEP if (fits or arguable) else CHIPS_MOVE,
        })

    out = m.build_sheet("Fifty courses, and where they are filed", items, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    keep = sum(1 for i in items if i['chips'] is CHIPS_KEEP)
    print(f"{len(items)} items · {keep} proposed to stay, {len(items)-keep} to move "
          f"· {len(out)} bytes → {OUT}")


if __name__ == '__main__':
    build()
