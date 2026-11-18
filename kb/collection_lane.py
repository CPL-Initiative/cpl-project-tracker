"""The colleges the collection lane holds tonight: every cheap-piles rule, count and plan leaves them out.

S680 conductor's frozen split (one writer per college; docs/session_681_handoff.md on PR #3487): twelve colleges,
set before any cheap-piles write. kb/_program_discontinued.py, kb/_program_requirements_units_rules.py and the
named gaps of kb/_harvest_gap_census.py import this one constant. Tomorrow's run empties it (or names the new
split) to pick these colleges up.
"""

COLLECTION_LANE_S680 = (
    "Golden West College", "Coastline Community College", "Orange Coast College", "Cosumnes River College",
    "Lassen College", "Los Medanos College", "Diablo Valley College", "College of the Redwoods",
    "Allan Hancock College", "Chabot College", "Antelope Valley College", "Santiago Canyon College",
)


def held(college, skip=()) -> bool:
    """Whether the collection lane holds this college (or the caller names it in skip)."""
    return (college or "") in COLLECTION_LANE_S680 or (college or "") in tuple(skip)
