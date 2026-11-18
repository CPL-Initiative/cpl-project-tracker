"""The colleges the collection lane holds tonight: every cheap-piles rule, count and plan leaves them out.

S681 conductor's split (one writer per college; docs/session_682_handoff.md on PR #3506): five colleges, set
before any cheap-piles write. Amended from seven on the second reader's round (#3508): Crafton Hills College and
College of the Siskiyous left the lane, since no collection run started at either and #3497's applied plan holds a
Siskiyous row. kb/_program_discontinued.py, kb/_program_requirements_units_rules.py and the named
gaps of kb/_harvest_gap_census.py import COLLECTION_LANE. Tomorrow's run empties it (or names the new split) to
pick these colleges up.

RELEASED names the colleges S680's lane held and S681 released: tonight's cheap-piles plan names records at
these seven alone (python3 kb/_program_requirements_units_rules.py --college NAME), so it cannot re-plan a record
S680 already applied elsewhere.
"""

COLLECTION_LANE = (
    "Lassen College", "Cosumnes River College", "Allan Hancock College", "Chabot College", "Santiago Canyon College",
)

# The old name, kept because another open branch still imports it. The next run removes this line.
COLLECTION_LANE_S680 = COLLECTION_LANE

RELEASED = (
    "Golden West College", "Coastline Community College", "Orange Coast College", "Los Medanos College",
    "Diablo Valley College", "College of the Redwoods", "Antelope Valley College",
)


def held(college, skip=()) -> bool:
    """Whether the collection lane holds this college (or the caller names it in skip)."""
    return (college or "") in COLLECTION_LANE or (college or "") in tuple(skip)
