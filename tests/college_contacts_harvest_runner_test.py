#!/usr/bin/env python3
"""Guard for the contacts harvest's runner (kb/_college_contacts_harvest.py) over saved pages.

The failure modes: a student-body or foundation president read as the college's CEO; a vice
chancellor read as the district's CEO; a sign-in page or a link off the college's domain
followed; a title's address lost; a records file with a position outside Sam's list applied.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb"))
import _college_contacts_harvest as h  # noqa: E402

PAGE = """<html><head><style>.x{}</style><script>var president='no';</script></head><body>
<nav><a href="/about/administration/">Administration</a> <a href="https://my.example.edu/login">Leadership login</a>
<a href="https://www.somedistrict.edu/chancellor">Chancellor's Office</a>
<a href="https://news.othersite.com/leadership">Leadership</a>
<a href="/calendar">Calendar</a> <a href="/docs/org.pdf">Directory</a></nav>
<div class="card"><h3>Jane Q. Example</h3><p>Superintendent/President</p>
<p><a href="mailto:jexample@example.edu">Email</a></p></div>
<div class="card"><h3>Ana Sample</h3><p>Vice President, Instruction and Student Services</p></div>
<div class="card"><h3>Bo Person</h3><p>Associated Students President</p></div>
<div class="card"><h3>Cy Person</h3><p>Vice Chancellor, Educational Services</p></div>
<div class="card"><h3>Di Person</h3><p>Dean, Career and Technical Education</p></div>
<div class="card"><h3>Ed Person</h3><p>Director of Facilities</p></div>
</body></html>"""


def test_positions():
    assert h.position_of("Superintendent/President") == "college_ceo"
    assert h.position_of("President") == "college_ceo"
    assert h.position_of("Associated Students President") is None
    assert h.position_of("Foundation President") is None
    assert h.position_of("Chancellor") == "district_ceo"
    assert h.position_of("Vice Chancellor, Educational Services") == "vice_chancellor"
    assert h.position_of("Associate Vice Chancellor, Human Resources") == "assoc_vice_chancellor"
    assert h.position_of("Vice President, Academic Affairs") == "vpaa"
    assert h.position_of("Chief Instructional Officer") == "vpaa"
    assert h.position_of("Vice President, Instruction and Student Services") == "vpaa"
    assert h.position_of("Vice President of Student Services") == "vpss"
    assert h.position_of("Chief Business Officer") == "vpbs"
    assert h.position_of("Vice President, Business Services and Facilities") == "vpbs"
    assert h.position_of("Vice President, Administrative Services") is None  # not among Sam's variants (S537)
    assert h.position_of("Associate Vice President, Workforce") == "assoc_vp"
    assert h.position_of("Dean, Career and Technical Education") == "dean_cte"
    assert h.position_of("Dean of Admissions and Records") == "dean_ar"
    assert h.position_of("Veterans Resource Center Coordinator") == "vrc"
    assert h.position_of("Articulation Officer") == "articulation_officer"
    assert h.position_of("Director of Facilities") is None


def test_page_text_and_excerpts():
    lines, links = h.page_text(PAGE)
    assert not any("var president" in ln for ln in lines), "script text read"
    ex = h.title_excerpts(lines)
    by_line = {e["line"]: e for e in ex}
    assert by_line["Superintendent/President"]["position"] == "college_ceo"
    assert "Jane Q. Example" in by_line["Superintendent/President"]["window"]
    assert "jexample@example.edu" in by_line["Superintendent/President"]["emails"]
    assert by_line.get("Associated Students President", {}).get("position") is None
    assert by_line["Director of Facilities"]["position"] is None  # kept for Sam's list


def test_links():
    _, links = h.page_text(PAGE)
    got = h.leadership_links(links, "https://www.example.edu/", "www.example.edu")
    assert "https://www.example.edu/about/administration/" in got
    assert "https://www.somedistrict.edu/chancellor" in got, "a district's chancellor page is followed"
    assert not any("login" in u for u in got), "a sign-in page followed"
    assert not any("othersite.com" in u for u in got), "off-domain link followed"
    assert not any(u.endswith(".pdf") for u in got)
    assert not any("calendar" in u for u in got)


def test_batch_order():
    cs = [{"college": n} for n in ("A", "B", "C", "D")]
    got = [c["college"] for c in h.batch_order(cs, {"A": "2026-11-02", "C": "2026-11-01"})]
    assert got == ["B", "D", "C", "A"], got


def test_check_records():
    name = h.load_colleges()[0]["college"]
    good = {"run": "x", "colleges": [name], "rows": [
        {"college": name, "position": "vpaa", "title_as_printed": "Provost", "name": "A B",
         "email": "", "source_url": "https://x.edu/a"}]}
    assert h.check_records(good) == []
    bad = {"run": "x", "colleges": [name, "Nowhere College"], "rows": [
        {"college": name, "position": "dean_of_everything", "name": "A B", "email": "nope",
         "source_url": "x.edu"}]}
    errs = h.check_records(bad)
    assert any("Nowhere" in e for e in errs) and any("position" in e for e in errs)
    assert any("email" in e for e in errs) and any("source_url" in e for e in errs)


if __name__ == "__main__":
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f()
    print("college_contacts_harvest_runner_test: ok")
