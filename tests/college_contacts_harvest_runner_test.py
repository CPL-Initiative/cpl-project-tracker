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
    assert h.position_of("Vice President, Administrative Services") == "vpbs"  # Sheet 151 card 1, "vpbs"
    assert h.position_of("VP Administrative Services") == "vpbs"
    # Sam, Open Asks Sheet 153 card 2, "count" (2026-11-01): Equity joined to the post, and Academic Services.
    assert h.position_of("Vice President, Equity and Student Services/Title IX Coordinator") == "vpss"
    assert h.position_of("Vice President of Equity and Student Services") == "vpss"
    assert h.position_of("Vice President for Student Services and Equity") == "vpss"
    assert h.position_of("Vice President, Equity and Instruction") == "vpaa"
    assert h.position_of("Vice President of Academic Services") == "vpaa"
    assert h.position_of("Vice President, Business and Administrative Services") == "vpbs"
    assert h.position_of("Vice President for Administrative Services") == "vpbs"
    assert h.position_of("Vice President, Instruction and Student Services") == "vpaa"
    assert h.position_of("Associate Vice President, Workforce") == "assoc_vp"
    assert h.position_of("Dean, Career and Technical Education") == "dean_cte"
    assert h.position_of("Dean, Career Technical Education") == "dean_cte"  # S549, from the S548 read
    assert h.position_of("Assistant Superintendent/Vice President, Finance and Business") == "vpbs"
    assert h.position_of("Vice President, Business and Finance") == "vpbs"
    assert h.position_of("Vice President, Finance and Administration") is None  # outside Sam's variants
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


def test_batch_order_leaves_a_held_college_out():
    """Sam, Sheet 158 card 1 (2026-11-02, "map"): a college in the seeds file's hold never enters a batch."""
    cs = [{"college": "A"}, {"college": "B"}, {"college": "C"}]
    got = [c["college"] for c in h.batch_order(cs, {}, {"B"})]
    assert got == ["A", "C"], got
    assert "Los Angeles City College" in h.load_hold(), "the committed hold names the thirteen refused colleges"
    assert len(h.load_hold()) == 13, h.load_hold()


def test_batch_order_counts_a_read_that_found_no_one(tmp=None):
    import tempfile, json as _j
    root = tempfile.mkdtemp()
    os.makedirs(os.path.join(root, "41", ), exist_ok=True)
    os.makedirs(os.path.join(root, "41_records"), exist_ok=True)
    _j.dump({"college": "B", "read_at": "2026-11-01T12:00:00+00:00"}, open(os.path.join(root, "41", "b.json"), "w"))
    _j.dump({"college": "D", "read_at": "2026-11-03T12:00:00+00:00"}, open(os.path.join(root, "41_records", "records.json"), "w"))
    hist = h.read_history(root)
    assert hist == {"B": "2026-11-01"}, hist
    cs = [{"college": n} for n in ("A", "B", "C", "D")]
    got = [c["college"] for c in h.batch_order(cs, h.last_read({"A": "2026-11-02T01:00:00", "C": "2026-10-30"}, hist))]
    assert got == ["D", "C", "B", "A"], got


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


def test_partial_load_names_no_college():
    # A load of held rows read no college whole: naming one would mark its other people gone.
    name = h.load_colleges()[0]["college"]
    row = {"college": name, "position": "vpbs", "title_as_printed": "Vice President, Administrative Services",
           "name": "A B", "email": "", "source_url": "https://x.edu/a"}
    assert h.check_records({"run": "x", "partial": True, "colleges": [], "rows": [row]}) == []
    assert h.check_records({"run": "x", "partial": True, "colleges": [name], "rows": [row]})
    assert h.check_records({"run": "x", "partial": True, "colleges": [],
                            "rows": [dict(row, college="Nowhere College")]})


def test_dash_between_vp_and_office():
    # Yuba prints "Interim Vice President - Instruction" (S550 filed it by hand).
    assert h.position_of("Interim Vice President - Instruction") == "vpaa"
    assert h.position_of("Vice President \u2013 Student Services") == "vpss"


def test_pdf_excerpts_keep_only_positions():
    # A catalog's faculty pages name many coordinators; only Sam's positions are kept.
    lines = ["Program Coordinator, Nursing"] * 80 + ["Dr. Jane Example", "President",
                                                     "Ana Sample", "Vice President, Academic Affairs"]
    ex = h.pdf_excerpts(lines)
    assert [e["position"] for e in ex] == ["college_ceo", "vpaa"]


def test_seeds_file_names_known_colleges():
    from _program_source_census import load_colleges
    names = {c["college"] for c in load_colleges()}
    seeds = h.load_seeds()
    assert seeds, "seeds file missing"
    assert not [c for c in seeds if c not in names], "a seed names a college the census does not"


class _FakeFetcher:
    def __init__(self, pages):
        self.pages, self.asked = pages, []

    def page(self, url):
        self.asked.append(url)
        return self.pages.get(url, {"url": url, "status": 403})


def test_seeds_read_after_a_refused_homepage():
    seed = "https://acme.curriqunet.com/catalog/cover"
    f = _FakeFetcher({seed: {"url": seed, "status": 200, "lines": ["Jo Lead", "Superintendent/President"],
                             "links": [("/catalog/administration", "Administration"),
                                       ("https://other.curriqunet.com/admin", "Administration"),
                                       ("https://www.acme.edu/leadership", "Leadership")]}})
    doc = h.read_college(f, "Acme College", "https://www.acme.edu/", [seed])
    assert f.asked[:2] == ["https://www.acme.edu/", seed]
    # A link on the seed's host stays on that exact host: another college's catalog is not followed.
    assert "https://acme.curriqunet.com/catalog/administration" in f.asked
    assert "https://other.curriqunet.com/admin" not in f.asked
    assert doc["pages"][1]["excerpts"][0]["position"] == "college_ceo"


if __name__ == "__main__":
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f()
    print("college_contacts_harvest_runner_test: ok")
