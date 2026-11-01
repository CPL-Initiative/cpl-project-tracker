#!/usr/bin/env python3
"""Guards the contacts harvest's runner (kb/_college_contacts_harvest.py) over a saved page, without a browser.

The failure modes: a title from Sam's variants that names no position (a missed dean), a position read
from a title that is not one (a student body president as the college CEO, the Chancellor's Office as a
district CEO), a link off the college's site followed as leadership, a sign-in page kept with text, and a
batch that reads the same colleges every night."""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _college_contacts_harvest as h  # noqa: E402

n = 0


def check(cond, msg):
    global n
    n += 1
    if not cond:
        print("FAIL:", msg)
        sys.exit(1)


# Sam's variants, each to its position.
cases = {
    "Superintendent/President": "college_ceo",
    "President": "college_ceo",
    "Chancellor": "district_ceo",
    "Vice Chancellor, Educational Services": "vice_chancellor",
    "Deputy Chancellor": "vice_chancellor",
    "Associate Vice Chancellor of Fiscal Services": "assoc_vice_chancellor",
    "Vice President, Instruction": "vpaa",
    "Vice President of Academic Affairs": "vpaa",
    "Vice President of Instruction and Student Services": "vpaa",
    "Provost": "vpaa",
    "Chief Instructional Officer": "vpaa",
    "Vice President of Student Services": "vpss",
    "Chief Student Services Officer": "vpss",
    "Vice President, Business Services and Facilities": "vpbs",
    "Chief Business Officer": "vpbs",
    "Associate Vice President, Human Resources": "assoc_vp",
    "Dean of Career Technical Education": "dean_cte",
    "Dean, Workforce Development": "dean_cte",
    "Dean of Instruction": "dean_instruction",
    "Director of Admissions and Records": "dean_ar",
    "Dean of Admissions & Records": "dean_ar",
    "Veterans Resource Center Coordinator": "vrc",
    "Director, Veterans Services": "vrc",
    "Articulation Officer": "articulation_officer",
}
for line, want in cases.items():
    got = h.position_of(line)
    check(got == want, "%r read as %s, not %s" % (line, got, want))

for line in ["Student Body President Alex Kim", "Chancellor's Office", "Campus Map", "Vice-President's Fund",
             "Library Hours"]:
    got = h.position_of(line)
    check(got is None, "%r read as %s, a title that names no position" % (line, got))

# Excerpts over a saved page: the title lines with their neighbours, the email beside the president.
text = open(os.path.join(ROOT, "tests", "fixtures", "contacts_harvest", "leadership_page.txt")).read()
ex = h.excerpts(text)
pos = [p for e in ex for p in e["positions"]]
for want in ["college_ceo", "vpaa", "vpss", "vpbs", "assoc_vp", "dean_cte", "dean_instruction", "dean_ar",
             "vrc", "articulation_officer"]:
    check(want in pos, "the saved page's %s excerpt is missing" % want)
lines = [ln for e in ex for ln in e["lines"]]
check("Dr. Jane Rivera" in lines and "Dana Wu" in lines, "a name beside its title is not kept")
check("jrivera@example.edu" in [m for e in ex for m in e["emails"]], "the printed email is not kept")
check("Bookstore" not in lines and "Foundation" not in lines, "lines far from any title are kept")
check(len(h.excerpts("\n".join(["Provost"] * 500), cap=5)) <= 5, "the excerpt cap does not hold")

# Links: leadership words on the college's own site only; the district link leaves it.
home = "https://www.example.edu/"
links = [
    {"text": "Administration", "href": "https://www.example.edu/about/administration/"},
    {"text": "President's Office", "href": "https://president.example.edu/"},
    {"text": "Veterans", "href": "https://www.example.edu/veterans/#top"},
    {"text": "Veterans", "href": "https://www.example.edu/veterans/"},
    {"text": "Directory", "href": "https://other.org/directory"},
    {"text": "Articulation", "href": "https://www.example.edu/articulation.pdf"},
    {"text": "Apply", "href": "https://www.example.edu/apply/"},
    {"text": "Email us", "href": "mailto:info@example.edu"},
    {"text": "Example Community College District", "href": "https://www.exampleccd.edu/about"},
]
got = h.leadership_links(links, home)
check(got == ["https://www.example.edu/about/administration/", "https://president.example.edu/",
              "https://www.example.edu/veterans/"], "leadership links: %s" % got)
check(h.district_link(links, home) == "https://www.exampleccd.edu/", "the district's site is not found")
check(h.district_link(links[:3], home) is None, "a district found where none is linked")

# Mailtos: decoded, deduplicated, never a malformed address.
m = h.mailtos([{"href": "mailto:J.Rivera@example.edu?subject=hi", "text": "Email"},
               {"href": "mailto:j.rivera@example.edu", "text": "again"}, {"href": "mailto:nobody", "text": "x"}])
check([x["email"] for x in m] == ["J.Rivera@example.edu"], "mailtos: %s" % m)

# No page behind a sign-in, and no text kept from one.
check(h.is_sign_in("https://sso.example.edu/login?x", False, "Example"), "a login address passes")
check(h.is_sign_in("https://www.example.edu/staff", True, "Staff"), "a password form passes")
check(not h.is_sign_in("https://www.example.edu/leadership/", False, "Leadership | Example College"),
      "a leadership page read as a sign-in")
rec = h.page_record("https://x.edu/", {"access": "sign_in", "title": "Sign In", "body": "Provost Jo"})
check("excerpts" not in rec, "a sign-in page keeps text")

# The batch: never read first, then the oldest run; reads come from the committed run folders.
with tempfile.TemporaryDirectory() as d:
    for run, names in [("20261101T000000Z", ["a_college", "b_college"]), ("20261102T000000Z", ["a_college"])]:
        os.makedirs(os.path.join(d, run))
        for s in names:
            json.dump({}, open(os.path.join(d, run, s + ".json"), "w"))
    read = h.last_read(d)
    check(read == {"a_college": "20261102T000000Z", "b_college": "20261101T000000Z"}, "last_read: %s" % read)
    cols = [{"college": c} for c in ["A College", "B College", "C College", "D College"]]
    got = [c["college"] for c in h.pick_batch(cols, 3, read)]
    check(got == ["C College", "D College", "B College"], "pick_batch: %s" % got)

check(h.slug("Cañada College") == "canada_college", "slug")
check("CPL Initiative" in h.UA_SUFFIX and h.UA_TOKEN in h.UA_SUFFIX, "the user agent names the CPL Initiative")
check(h.MAX_PAGES == 12, "at most 12 pages a site")

print("ok: college contacts harvest runner (%d checks)" % n)
