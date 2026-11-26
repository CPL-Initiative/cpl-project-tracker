#!/usr/bin/env python3
"""S739 wave B: the gap census's Next wave at nineteen colleges: pins, named gaps and relists.

    python3 tests/program_requirements_lever_pins_s739b_test.py

WHY. The census of 2026-11-26 06:54Z (run 45771011713) lists 26 programs at these colleges on a paid lever: a page
the capture found and never extracted, or a filed record that places none of the state's listed courses. Free page
reads (college-page-read runs 45782471633, 45782712226, 45784839786 and 45786121488) printed each program's page as the capture
reads it. A program whose own section the catalog prints is pinned to it; one whose section the catalog does not
print, or prints under another award or another list, is a named gap with the page's own words; one a college's
earlier file already names is a relist and is filed nowhere again.

  1. PDF pins bind on the pages the read printed (tests/fixtures/program_requirements_wave_s739b.json): San Diego
     College of Continuing Education's Visual and Vector Design 38411 opens at the foot of p.61 and lists its two
     courses at the top of p.62; Yuba's LVN to RN Career Mobility Program 37946 opens at the foot of p.146 and
     prints its five courses and its 24-unit total on p.148. Each window opens on the pin's words, ends before the
     next section's, and places every listed course. The page each filed record was read from does not: the pin
     moved on the wrong page binds nothing.
  2. Each entry pins the one program and no other.
  3. Site pins: each pinned page's heading prints its program's title with its award (rule A), and the heading of
     the page the capture had handed the program does not.
  4. Named gaps: each college's named_gaps_s739.json names exactly its programs, each once, with a defined reason
     and a note, none also pinned; a relist (Santa Rosa Junior 37014, West Los Angeles 46261) stays in the file
     that already names it and is in no S739 file.
  5. A record read from its pinned section or page places its listed courses (whichever run filed it).
Pure stdlib.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def flat(s):
    return " ".join((s or "").split())


FIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_wave_s739b.json"), encoding="utf-8"))
STEPS = R.load_steps()
DIR = os.path.join(ROOT, "kb", "program_requirements_college")

# ── 1 and 2. the PDF pins ─────────────────────────────────────────────────────────────────────────────
PDF = [
    # fixture key, college, control number, title, listed codes, pinned page, through, filed page, what the window holds
    ("sdcce", "San Diego College of Continuing Education", "38411", "Visual and Vector Design",
     ["COMM 660", "COMM 661"], 61, 62, 57, ["Required Courses", "COMM 660 Visual Design", "COMM 661 Vector Design"]),
    ("yuba", "Yuba College", "37946", "LVN to RN Career Mobility Program",
     ["NURS 13A", "NURS 13B", "NURS 14A", "NURS 14B", "NURS 14C"], 146, 148, 146,
     ["PROGRAM REQUIREMENTS", "TOTAL UNITS REQUIRED FOR DEGREE MAJOR 24"]),
]
for key, college, cn, title, codes, page, through, filed_page, holds in PDF:
    fx = FIX[key]
    pins = (STEPS.get(college) or {}).get("pdf_pages") or {}
    pin = pins.get(cn) or {}
    check(pin.get("page") == page and pin.get("through") == through and pin.get("until") and "S739" in pin.get("evidence", ""),
          "%s's reconcile entry pins %s to pp.%d-%d, with the words the next section opens on (S739)" % (college, cn, page, through))
    check(sorted(pins) == [cn], "%s pins %s and no other program" % (college, cn))
    pages = [fx["pages"].get(str(i + 1), "") for i in range(fx["pages_total"])]
    prog = {"control_number": cn, "title": title, "closed_list": [{"code": c} for c in codes]}
    head, why = C.pdf_pinned_heading(pages, prog, pin)
    check(head is not None, "%s: the pin's words, its until words and every title word print on the pages read (%s)" % (cn, why))
    got = C.pdf_best("https://example.edu/c.pdf", pages, prog, prog["closed_list"], "pypdf", head) if head else None
    body = re.sub(r"\[page \d+\]\n", "", (got or {}).get("text") or "")
    check(bool(got) and got["pages"][0] == page and got["pages"][-1] == through,
          "%s: the window runs from p.%d to p.%d (%s)" % (cn, page, through, got and got["pages"]))
    check(flat(body).startswith(flat(pin.get("words", "-"))), "%s: the window opens on the pin's words" % cn)
    check(flat(pin.get("until", "-")) not in flat(body), "%s: the window ends before the next section's heading" % cn)
    check(all(h in flat(body) for h in holds) and all(c in body for c in codes),
          "%s: the window holds its list (%s)" % (cn, ", ".join(codes)))
    check(bool(got) and got["coverage"] == 1.0, "%s: the window places every listed course (%s)" % (cn, got and got["coverage"]))
    # The failure the pin answers. Where the filed record was read from another page, the pin's words do not print
    # there, so the pin binds nothing on it (Yuba's was read from the pinned page alone: the check below the loop).
    if filed_page != page:
        off, off_why = C.pdf_pinned_heading(pages, prog, dict(pin, page=filed_page, through=filed_page))
        check(off is None and bool(off_why), "%s: the pin moved to p.%d, the filed record's page, binds nothing (%s)"
              % (cn, filed_page, off_why))
        text = fx["pages"].get(str(filed_page), "")
        check(title in text and not all(c in text for c in codes),
              "%s: p.%d prints the title and not its list" % (cn, filed_page))

# Yuba's filed page is the pinned page: the record was read from p.146 alone, which ends inside the section.
check(not any(c in FIX["yuba"]["pages"]["146"].split("LVN TO RN CAREER MOBILITY")[-1] for c in ("NURS 13A", "NURS 14C")),
      "37946: p.146 below its heading prints none of its courses (the list prints on p.148)")

# ── 3. site pins ──────────────────────────────────────────────────────────────────────────────────────
SITE = [
    # college, control number, title, award, its own page, that page's heading, the heading of the page it was handed
    ("Mt. San Antonio College", "41116", "Electronics Technology - Level 1",
     "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
     "https://catalog.mtsac.edu/programs/programsaz/electronics/electronics-technology-level-1-certificate/",
     "Electronics Technology - Level 1 (Certificate M0679)",
     "Electronics and Computer Engineering Technology (Certificate T0906)"),
    ("Skyline College", "30882", "Mathematics", "A.S. T Degree",
     "https://catalog.skylinecollege.edu/current/programs/mathematics-for-transfer-2-0-as-t.php",
     " Mathematics for Transfer 2.0 Associate in Science Degree for Transfer",
     "Economics for Transfer Associate in Arts Degree for Transfer"),
]
for college, cn, title, award, url, own_h1, handed_h1 in SITE:
    pins = C.site_pin_entries(college)
    check(sorted(pins) == [cn] and pins[cn]["url"] == url and "S739" in (STEPS[college].get("site_pages_why") or ""),
          "%s's reconcile entry pins %s alone, to its own page (S739)" % (college, cn))
    prog = {"title": title, "award": award}
    own = {"url": url, "title": own_h1.strip(), "h1": own_h1, "body": ""}
    named, _ = C.site_heading_names(own, prog)
    other = dict(own, title=handed_h1, h1=handed_h1)
    refused, _ = C.site_heading_names(other, prog)
    check(named and not refused, "rule A binds %s on its own page's heading (%r) and refuses the page the capture "
                                 "handed it (%r)" % (cn, own_h1.strip(), handed_h1))
# A heading rule A refuses is never pinned: Reedley's Assistant Teacher entry (3519/3269) drops the state title's
# "Early Childhood Education", so 30465 is held for a reader change and carries no pin.
held, _ = C.site_heading_names({"url": "https://example.edu/x", "title": "Associate Teacher, Certificate of Achievement",
                                "h1": "Associate Teacher, Certificate of Achievement", "body": ""},
                               {"title": "Early Childhood Education: Assistant Teacher",
                                "award": "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units"})
check(not held and "30465" not in C.site_pin_entries("Reedley College"),
      "Reedley 30465: rule A refuses its entry's heading, and it is not pinned")

# ── 4. named gaps and relists ─────────────────────────────────────────────────────────────────────────
NAMED = {
    "berkeley_city": {"19976": "credit_not_in_catalog"},
    "chaffey": {"04779": "credit_not_in_catalog"},
    "lassen": {"43938": "credit_not_in_catalog"},
    "merced": {"40858": "credit_not_in_catalog"},
    "ohlone": {"37693": "catalog_award_differs"},
    "san_diego_city": {"22333": "credit_not_in_catalog"},
    "san_diego_of_continuing_education": {"40532": "catalog_list_differs"},
    "santa_rosa_junior": {"37016": "ge_pattern_certificate"},
    "sierra": {"21524": "text_window_cut", "21526": "text_window_cut"},
    "skyline": {"32964": "credit_not_in_catalog"},
    "taft": {"38661": "successor_printed", "38662": "successor_printed"},
    "victor_valley": {"04967": "list_printed_as_range"},
    "west_los_angeles": {"44945": "ge_pattern_certificate"},
}
RELISTS = [("santa_rosa_junior", "37014", os.path.join("held_for_person", "37014.json")),
           ("west_los_angeles", "46261", "named_gaps_s727.json")]
for slug, want in sorted(NAMED.items()):
    with open(os.path.join(DIR, slug, "named_gaps_s739.json"), encoding="utf-8") as fh:
        ng = json.load(fh)
    got_cns = [g["control_number"] for g in ng["programs"]]
    check(sorted(got_cns) == sorted(want) and len(set(got_cns)) == len(got_cns)
          and all(g["reason"] in ng["reasons"] and g.get("note") and g.get("title") and g.get("award") for g in ng["programs"]),
          "%s: the named gaps are %s, each once with a defined reason and a note" % (slug, sorted(want)))
    check(all(want[g["control_number"]] == g["reason"] for g in ng["programs"]),
          "%s: each gap carries the reason its page read supports (%s)" % (slug, sorted(set(want.values()))))
    check(not (set(got_cns) & set(C.site_pin_entries(ng["college"])))
          and not (set(got_cns) & set(((STEPS.get(ng["college"]) or {}).get("pdf_pages") or {}))),
          "%s: no named gap is also pinned" % slug)
    check(re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", ng.get("written") or "") is not None and ng.get("capture"),
          "%s: the file names when it was written and the capture it rests on" % slug)
S739 = {cn for want in NAMED.values() for cn in want}
for slug, cn, where in RELISTS:
    path = os.path.join(DIR, slug, where)
    held = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    names = ([g["control_number"] for g in held.get("programs") or []] or [held.get("control_number")])
    check(cn in names and cn not in S739, "%s %s is a relist: %s already names it, and no S739 file does" % (slug, cn, where))

# ── 5. a record read from its pinned section places its listed courses ────────────────────────────────
# Each check holds only while the record is the one read from the pin (another read may move it on).
for key, college, cn, title, codes, page, through, filed_page, holds in PDF:
    with open(os.path.join(DIR, C.slug_of(college), "records", cn + ".json"), encoding="utf-8") as fh:
        rec = json.load(fh)
    cov = (rec.get("score") or {}).get("coverage") or {}
    from_pin = (str(rec.get("source_url") or "").endswith("#page=%d" % page)
                and int(str(rec.get("extracted_run") or 0)) >= 45784241940)
    check(not from_pin or (cov.get("placed") == cov.get("listed") == len(codes)),
          "%s: its record, once read from the pinned section, places %d of %d (now: placed %s, run %s)"
          % (cn, len(codes), len(codes), cov.get("placed"), rec.get("extracted_run")))
SITE_PLACED = {"41116": 3, "30882": 4}   # Skyline's page does not print STAT C1000, the fifth course the state lists
for college, cn, title, award, url, own_h1, handed_h1 in SITE:
    with open(os.path.join(DIR, C.slug_of(college), "records", cn + ".json"), encoding="utf-8") as fh:
        rec = json.load(fh)
    cov = (rec.get("score") or {}).get("coverage") or {}
    from_pin = str(rec.get("source_url") or "").rstrip("/") == url.rstrip("/")
    check(not from_pin or (cov.get("placed") or 0) >= SITE_PLACED[cn],
          "%s: its record, once read from its own page, places at least %d of its listed courses (now: placed %s, "
          "page %s)" % (cn, SITE_PLACED[cn], cov.get("placed"), "its own" if from_pin else "another"))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
