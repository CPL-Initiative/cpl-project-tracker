#!/usr/bin/env python3
"""S741: keep-better's page_is_own reads a word and its plural as one word, with its statewide self-recall.

WHY. The state's file titles Cuyamaca 18637 "University Studies: Social and Behavioral Science". Its own page's
address ends university-studies-social-behavioral-sciences and its page title prints "University Studies: Social and
Behavioral Sciences". S727's paid re-read of that page placed 92 of its 92 listed courses under the generic heading
"Requirements", and keep-better set it aside: a generic heading stands only where page_is_own shows the page is the
program's own, and page_is_own compared "science" with "sciences" (the lane's NEXT (3)). The filed record, read from
Grossmont's page of the same title, places 64 of 92.

THE CHANGE (kb/_program_reread_keep_better.py, PLURAL_FOLD_ON): a second reading inside page_is_own, taken only where
the exact one shows nothing. Each word is compared less one closing s (singular). An address counts under the fold
only while the capture's own entry names that page for the program. The fold is refused where another program at
the college has a title that holds every word of this one's only once a plural is folded (plural_longer, which takes
in plural_twins). A page title or h1 is folded with its award phrase set aside (AWARD_PHRASE) and names the program
only where it prints nothing beside the title's words but an award's words or a program code (fold_names).

S742, the second reader's round 1 (two MAJORs, both answered here). The first recall could not report a wrong: its
"right" was the capture naming the page at the accept share, which holds for every page-matched filed record. And
the first fold, handed every sibling's page, admitted 386 programs on a page that was another's ("Art" on "Studio
Arts" and on any "Associate in Arts" page, "Art History" on the History AA-T page, "Physical Sciences" on "Physical
Therapist Assistant - Associate of Science"). The recall now has two halves, and the second can fail.

Pinned here:
  * singular, plural_twins, plural_longer and fold_names on their own;
  * Cuyamaca 18637: on its own page, with the heading "Requirements", page_is_own shows nothing with the fold off
    (S727's refusal) and shows the page its own with it on; the filed record's page, Grossmont's, shows nothing either
    way (the capture names another page for the program);
  * the wrong joins: a title with a word the page does not print; a program with a plural twin, or a longer
    sibling, at its college; another award's page; a page the capture does not name for the program; an award
    phrase standing in for a title word; a page title that prints more than the title;
  * the reach, over every filed record statewide, the fold off and on: the own-page answers that move from not shown
    to shown, none from shown to not shown, every college printed. Each sits on the page the capture names for the
    program, which holds by construction, so this half counts reach and proves no answer right;
  * the wrong-join recall (the S652 review rule): every program at a college is handed every sibling's page as if
    the capture had named it for the program, a page that is not its own and whose program has another title.
    Admitted there with the fold on and not with it off is wrong. Two remain, each printed, and each is a page
    whose address prints the program's own title, a plural aside, while the capture filed another program on it
    (Coastline's 2.0 page for 43057; Grossmont's University Studies page for 19823). The exact reading's own
    admissions on a sibling's page are counted beside them and are as they were.
  The change writes no row: it moves what keep-better decides about a later re-read that comes back under a
  generic heading.

Run from repo root: python3 tests/program_keep_better_plural_s741_test.py
"""
import collections
import glob
import json
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_reread_keep_better as K  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402

checks, failures = [0], []
MOVED = 37                  # own-page answers the fold moves (2026-11-27, S742's round 2)
EXACT_ON_SIBLING = 1800     # the exact reading's admissions on a sibling's page, as before the fold
WRONG = [("coastline_community", "43057", "33014"), ("grossmont", "19823", "19608")]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def own(rec, source, siblings, fold):
    K.PLURAL_FOLD_ON = fold
    try:
        return K.page_is_own(rec, source, None, siblings)
    finally:
        K.PLURAL_FOLD_ON = True


print("the fold")
check(K.singular({"sciences", "science", "arts", "business", "gis", "studies"})
      == {"science", "art", "business", "gis", "studie"}, "singular drops one closing s, never from ss or a short word")
SIB = [{"control_number": "1", "title": "Studio Art", "award": "A.A. Degree"},
       {"control_number": "2", "title": "Studio Arts", "award": "A.A- T Degree"},
       {"control_number": "3", "title": "Art History", "award": "A.A. Degree"}]
check(K.plural_twins(SIB[0], SIB) == ["2"] and K.plural_twins(SIB[1], SIB) == ["1"] and not K.plural_twins(SIB[2], SIB),
      "plural_twins names a program whose title differs by a plural alone, whatever its award")

ART = [{"control_number": "1", "title": "Art", "award": "A.A. Degree"},
       {"control_number": "2", "title": "Studio Arts", "award": "A.A- T Degree"},
       {"control_number": "3", "title": "Art History", "award": "A.A- T Degree"},
       {"control_number": "4", "title": "Athletics", "award": "Certificate of Achievement"},
       {"control_number": "5", "title": "Athletic Trainer Aide I", "award": "Certificate of Achievement"}]
check(K.plural_longer(ART[0], ART) == ["2"] and K.plural_longer(ART[3], ART) == ["5"]
      and not K.plural_longer(ART[2], ART) and not K.plural_longer(ART[1], ART)
      and K.plural_longer(SIB[0], SIB) == ["2"],
      "plural_longer names a sibling whose title holds this one's words only once a plural is folded ('Studio Arts' "
      "beside 'Art', 'Athletic Trainer Aide I' beside 'Athletics', a plural twin), never one that holds them as "
      "written ('Art History' beside 'Art')")
W = K.page_words
check(K.fold_names(W("Food Services Management"), "Food Service Management, Associate of Science - Major #5691")
      and K.fold_names(W("Sales Techniques"), "Sales Technique - Certificate of Completion - CC8016")
      and K.fold_names(W("Studio Arts"), "Studio Art for Transfer (AA-T)"),
      "fold_names: a page title names the title a plural aside, beside an award's words and a program code")
check(not K.fold_names(W("Art"), "Photography, Associate in Arts Degree")
      and not K.fold_names(W("Physical Sciences"), "Physical Therapist Assistant - Associate of Science")
      and not K.fold_names(W("Social Science"), "A.A. in Liberal Arts: Social and Behavioral Sciences Emphasis")
      and not K.fold_names(W("Electronics Technology"), "MUSIC TECHNOLOGY/INTRODUCTORY ELECTRONIC MUSIC - Certificate")
      and not K.fold_names(W("Registered Veterinary Technician"), "Registered Veterinary Technicians Job Skills "
                                                                  "Certificate"),
      "fold_names: an award phrase never stands in for a title word, and a page title that prints more than the "
      "title names another program")

print("Cuyamaca 18637")
CUY_DIR = os.path.join(ROOT, "kb", "program_requirements_college", "cuyamaca")
with open(os.path.join(CUY_DIR, "sources.json"), encoding="utf-8") as fh:
    cuy_src = json.load(fh)
by = {str(x.get("control_number")): x for x in cuy_src}
sib = [{"control_number": x.get("control_number"), "title": x.get("title"), "award": x.get("award")} for x in cuy_src]
OWN_PAGE = ("https://catalog.gcccd.edu/cuyamaca/associate-degree-programs-certificates/behavioral-social-sciences/"
            "university-studies-social-behavioral-sciences/")
GROSSMONT = ("https://catalog.gcccd.edu//grossmont/associate-degree-programs-certificates/social-behavioral-sciences/"
             "university-studies-social-behavioral-sciences-aa/")
reread = {"college": "Cuyamaca College", "control_number": "18637", "award": "A.A. Degree",
          "title": "University Studies: Social and Behavioral Science", "source_url": OWN_PAGE,
          "record": {"program": {"section_heading": "Requirements"}}}
src = by["18637"]
check((src.get("source") or {}).get("url") == OWN_PAGE and src.get("coverage") == 1.0
      and "Sciences" in (src["source"].get("title") or ""),
      "the capture names 18637's own Cuyamaca page for it, at a share of 1.0, and its page title prints 'Sciences'")
check(own(reread, src, sib, False) is None, "with the fold off the page shows nothing (S727's refusal)")
got = own(reread, src, sib, True)
check(got is not None and "a plural aside" in got, "with the fold on the page is the program's own: %s" % got)
why, _ = K.own_program_why(reread, src, {}, sib)
check(why is None, "keep-better's own-program test now passes the re-read under its generic heading: %s" % why)
filed = dict(reread, source_url=GROSSMONT)
check(own(filed, src, sib, False) is None and own(filed, src, sib, True) is None,
      "the filed record's page, Grossmont's, shows nothing either way: the capture names another page")

print("the wrong joins")
other = dict(reread, title="University Studies: Natural and Behavioral Science")
check(own(other, src, sib, True) is None, "a title with a word the page does not print shows nothing")
twin = sib + [{"control_number": "99999", "title": "University Studies: Social and Behavioral Sciences",
               "award": "A.A. Degree"}]
check(own(reread, src, twin, True) is None, "a plural twin at the college refuses the fold")
cert = dict(reread, award="Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
            source_url=OWN_PAGE[:-1] + "-aa/")
degree_page = dict(src, source=dict(src["source"], url=OWN_PAGE[:-1] + "-aa/",
                                    title="University Studies: Social and Behavioral Sciences A.A."))
check(own(cert, degree_page, sib, True) is None,
      "a certificate takes nothing from a page whose address and title name the A.A.")
elsewhere = dict(src, source=dict(src["source"], url=OWN_PAGE.replace("university-studies", "general-studies")))
check(own(reread, elsewhere, sib, True) is None, "a page the capture does not name for the program shows nothing")

longer = sib + [{"control_number": "99998", "title": "University Studies: Social and Behavioral Sciences and Arts",
                 "award": "A.A. Degree"}]
check(own(reread, src, longer, True) is None, "a longer sibling title the fold alone would hold refuses the fold")

print("the reach over every filed record's own page")
read, moved, lost = 0, [], []
SOURCES = {}
for sp in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "sources.json"))):
    d = os.path.dirname(sp)
    try:
        with open(sp, encoding="utf-8") as fh:
            srcs = json.load(fh)
    except ValueError:
        continue
    SOURCES[os.path.basename(d)] = srcs
    by = {str(x.get("control_number")): x for x in srcs}
    sib = [{"control_number": x.get("control_number"), "title": x.get("title"), "award": x.get("award")} for x in srcs]
    for path in sorted(glob.glob(os.path.join(d, "records", "*.json"))):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except ValueError:
            continue
        if not isinstance(f.get("record"), dict):
            continue
        read += 1
        cn = str(f.get("control_number"))
        s = by.get(cn)
        a, b = own(f, s, sib, False), own(f, s, sib, True)
        if a is not None and b is None:
            lost.append((f.get("college"), cn))
        if a is None and b is not None:
            moved.append((f.get("college"), cn))
by_college = collections.Counter(c for c, _ in moved)
print("read %d, moved %d, lost %d" % (read, len(moved), len(lost)))
print("colleges whose records move: %s" % ", ".join("%s %d" % kv for kv in sorted(by_college.items())))
check(read > 18000, "the reach read every filed record (%d)" % read)
check(not lost, "no answer moves from shown to not shown: %s" % lost[:5])
check(len(moved) == MOVED, "the fold moves %d own-page answers (pinned %d); the capture names each page for its "
      "program, so this counts reach" % (len(moved), MOVED))
check(("Cuyamaca College", "18637") not in moved,
      "18637's filed record does not move (Grossmont's page); its re-read from its own page is what the fold reads")

print("the wrong-join recall: every program on every sibling's page")
pairs, off, on, wrong = 0, 0, 0, []
for slug, srcs in sorted(SOURCES.items()):
    sib = [{"control_number": x.get("control_number"), "title": x.get("title"), "award": x.get("award")} for x in srcs]
    pages = []
    for b in srcs:
        s = b.get("source") if isinstance(b.get("source"), dict) else None
        if not s or not s.get("url"):
            continue
        seg = urllib.parse.unquote(urllib.parse.urlsplit(s["url"]).path).rstrip("/").rsplit("/", 1)[-1]
        words = K.singular(K.page_words(" ".join([s.get("title") or "", s.get("h1") or "", seg.replace("-", " ")])))
        pages.append((b, K._page(s["url"]), K.page_words(b.get("title")), words))
    for a in srcs:
        mine = K.page_words(a.get("title"))
        want = K.singular(mine)
        if not want:
            continue
        a_page = K._page(((a.get("source") or {}) if isinstance(a.get("source"), dict) else {}).get("url"))
        for b, b_page, b_title, words in pages:
            if b is a or b_page == a_page or b_title == mine:
                continue            # its own page, or a program of the same title and another award
            pairs += 1
            if not want <= words:
                continue            # neither reading can name it: the page prints a title word nowhere
            rec = {"college": a.get("college"), "control_number": a.get("control_number"), "award": a.get("award"),
                   "title": a.get("title"), "source_url": b["source"]["url"]}
            handed = dict(a, source=b["source"])
            x, y = own(rec, handed, sib, False), own(rec, handed, sib, True)
            off += x is not None
            on += y is not None
            if x is None and y is not None:
                wrong.append((slug, str(a.get("control_number")), str(b.get("control_number"))))
                print("  wrong: %s %s %r on the page filed for %s %r: %s"
                      % (slug, a.get("control_number"), a.get("title"), b.get("control_number"), b.get("title"), y[:90]))
print("pairs %d, admitted with the fold off %d, with it on %d, by the fold alone %d" % (pairs, off, on, len(wrong)))
check(pairs > 3000000, "the recall handed every program every sibling's page (%d pairs)" % pairs)
check(sorted(wrong) == sorted(WRONG),
      "the fold alone admits two programs on a sibling's page, each a page whose address prints the program's own "
      "title, a plural aside (pinned %s): %s" % (WRONG, wrong))
check(on - off == len(wrong) and off == EXACT_ON_SIBLING,
      "the exact reading's own admissions on a sibling's page are as they were (%d, pinned %d)"
      % (off, EXACT_ON_SIBLING))

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
