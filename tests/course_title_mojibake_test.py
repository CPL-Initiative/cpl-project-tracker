"""The course-title mojibake repair (kb/_build_college_courses.py fix_moji).

WHY THIS TEST EXISTS. On 2026-09-18 (S274) Sierra's new prospective-credit
block rendered Pasadena's NURS 102 to a student as "Fundamentals of Vocational
Nursing Ã¢â‚¬â€œ Theory". Measured on the live table: 381 of 141,696 course
titles across 84 colleges carry UTF-8 read back as cp1252, once or twice, and
186 of 16,097 offerings rows. The repair that existed round-tripped through
latin-1 and fired only on "Ã", so it fixed "CaÃ±ada" and none of these: the
double-encoded forms contain cp1252-only characters (‚ € œ ™) latin-1 cannot
encode, and the single round-trips never contained "Ã".

Pure stdlib; fixtures are titles copied from the live table.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("_text_repair", os.path.join(ROOT, "kb", "_text_repair.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
fix = mod.fix_moji

CASES = [
    # (live title, repaired title, shape)
    ("Fundamentals of Vocational Nursing Ã¢â‚¬â€œ Theory", "Fundamentals of Vocational Nursing – Theory", "en dash, twice"),
    ("Commercial Truck Driving: Preparation for the Learnerâ€™s Permit", "Commercial Truck Driving: Preparation for the Learner’s Permit", "right quote, once"),
    ("Music of AmericaÃ¢â‚¬â„¢s Musical Theater", "Music of America’s Musical Theater", "right quote, twice"),
    ("Advanced Creative Writing Ã¢â‚¬â€\x9d Nonfiction", "Advanced Creative Writing — Nonfiction", "em dash, twice (its last byte is the C1 control U+009D)"),
    ("Bowlingâ€”Advanced", "Bowling—Advanced", "em dash, once"),
    ("History of Musical Theater: From Vaudeville to Ã¢â‚¬Å“HamiltonÃ¢â‚¬Å“", "History of Musical Theater: From Vaudeville to “Hamilton“", "curly quotes, twice"),
    ("TRXÃ‚Â® Suspension Training IV", "TRX® Suspension Training IV", "registered mark, twice"),
    ("GYROKINESISÂ® Movement Yoga I", "GYROKINESIS® Movement Yoga I", "registered mark, once"),
    ("IntroductionÃ‚Â\xa0toÃ‚Â\xa0PublicÃ‚Â\xa0Health", "Introduction\u00a0to\u00a0Public\u00a0Health", "no-break space, twice (as the xlsx carries it, before clean() collapses it)"),
    ("Chicana and Chicano History: Pre-CuauhtÃƒÂ©moc to U.S.-Mexico War", "Chicana and Chicano History: Pre-Cuauhtémoc to U.S.-Mexico War", "é, twice"),
    ("Baile FolklÃ³rico: Regional Dances of Mexico I", "Baile Folklórico: Regional Dances of Mexico I", "ó, once"),
    ("CaÃ±ada College", "Cañada College", "ñ, once (the original case)"),
    ("Cisco Networking AcademyÃ¢â€žÂ¢: CCNA Cybersecurity Operations", "Cisco Networking Academy™: CCNA Cybersecurity Operations", "trademark, twice"),
]
UNTOUCHED = [
    "Fundamentals of Nursing",
    "Cañada College",
    "Plain Title – with dash",
    "Acute Care Nursing Assistant: Vocational Nursing Foundations",
    "Âme et corps",  # a genuine capital A-circumflex is not mojibake: the UTF-8 decode fails and it survives
    "",
    None,
]

results = []
def check(name, cond):
    results.append((name, bool(cond)))

for raw, want, shape in CASES:
    got = fix(raw)
    check(f"repairs {shape}: {raw[:40]!r}", got == want)
    check(f"idempotent on the repaired form ({shape})", fix(got) == got)
for t in UNTOUCHED:
    check(f"leaves non-mojibake alone: {t!r}", fix(t) == t)
check("the trigger sees the once-decoded forms that carry no Ã (â„¢, â€™)",
      mod._MOJI_RE.search("Academyâ„¢") and mod._MOJI_RE.search("Learnerâ€™s") and not mod._MOJI_RE.search("Fundamentals of Nursing"))
check("a non-string cell passes through", fix(12.5) == 12.5)
check("the course builder repairs BEFORE clean() so the no-break space survives to the round trip",
      'college = clean(fix_moji(r[ix["College"]]))' in open(os.path.join(ROOT, "kb", "_build_college_courses.py"), encoding="utf-8").read())
# BOTH loaders must import the one repair and apply it to the TITLE, not only
# the college name — two copies drifted once, and neither touched the title.
for rel, title_call in (("kb/_build_college_courses.py", 'title = clean(fix_moji(r[ix["CourseTitle"]]))'),
                        ("chatbox/build_coci_offerings.py", 'title = fix_moji(str(row[ci["CourseTitle"]] or "").strip())')):
    src = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    check(f"{rel} imports the shared repair rather than carrying a copy",
          "from _text_repair import fix_moji" in src and "def fix_moji" not in src)
    check(f"{rel} repairs the course TITLE", title_call in src)

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    if not ok:
        print("FAIL", name)
print(f"course_title_mojibake_test.py: {passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
