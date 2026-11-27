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
only while the capture's own entry names that page for the program; and the fold is refused where another program at
the college has a title that differs by a plural alone (plural_twins).

Pinned here:
  * singular and plural_twins on their own;
  * Cuyamaca 18637: on its own page, with the heading "Requirements", page_is_own shows nothing with the fold off
    (S727's refusal) and shows the page its own with it on; the filed record's page, Grossmont's, shows nothing either
    way (the capture names another page for the program);
  * the wrong joins: a title with a word the page does not print; a program with a plural twin at its college;
    another award's page; a page the capture does not name for the program;
  * the self-recall over every filed record statewide, the fold off and on, counting what the change joins (the S652
    review rule). The held answer is the capture's own: it gave the program that page by the share of its listed
    courses the page prints, a finding that reads no title word. Right where that share is at least the capture's
    accept share; no answer moves from shown to not shown; every college with a record that moves is printed. The
    change writes no row: it moves what keep-better decides about a later re-read that comes back under a generic
    heading.

Run from repo root: python3 tests/program_keep_better_plural_s741_test.py
"""
import collections
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_reread_keep_better as K  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402

checks, failures = [0], []
MOVED, RIGHT = 44, 44       # the statewide recall's pinned figures (2026-11-27)


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

print("the self-recall over every filed record")
read, moved, right, wrong, lost = 0, [], 0, [], []
for sp in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "sources.json"))):
    d = os.path.dirname(sp)
    try:
        with open(sp, encoding="utf-8") as fh:
            srcs = json.load(fh)
    except ValueError:
        continue
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
            share = (s or {}).get("coverage")
            if isinstance(share, (int, float)) and share >= P.ACCEPT_SHARE \
                    and K._page(((s or {}).get("source") or {}).get("url")) == K._page(f.get("source_url")):
                right += 1
            else:
                wrong.append((f.get("college"), cn, share))
by_college = collections.Counter(c for c, _ in moved)
print("read %d, moved %d (right %d, wrong %d), lost %d" % (read, len(moved), right, len(wrong), len(lost)))
print("colleges whose records move: %s" % ", ".join("%s %d" % kv for kv in sorted(by_college.items())))
check(read > 18000, "the recall read every filed record (%d)" % read)
check(not lost, "no answer moves from shown to not shown: %s" % lost[:5])
check(not wrong and right == len(moved), "every moved answer is right by the capture's own finding: %s" % wrong[:5])
check(len(moved) == MOVED and right == RIGHT, "the fold moves %d answers, all right (pinned %d)" % (len(moved), MOVED))
check(("Cuyamaca College", "18637") not in moved,
      "18637's filed record does not move (Grossmont's page); its re-read from its own page is what the fold reads")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
