#!/usr/bin/env python3
"""The no-closed-list lookup's census (kb/_harvest_ncl_lookup_census.py, S652; #3299 slice A).

WHY. The capture looks up a program with no closed list by title and award, and a college is looked up only
when the matcher finds its own closed-list programs on their filed pages (recall at NCL_FLOOR or above, and
none on another program's page). The census runs that test on the committed captures. A second reader of
#3300 measured the first matcher this way and found it 63% statewide and 0% at Cerritos; this file pins the
census's arithmetic on a fixture and its committed figure: no closed-list program in the committed captures
lands on another program's page. It also pins the pages the lookup gives back (ncl_yield, S668): none moves a
holder whose filed record passes live. Run from repo root: python3 tests/harvest_ncl_lookup_census_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _harvest_ncl_lookup_census as N  # noqa: E402
import _program_requirements_college as C  # noqa: E402

failures, checks = [], [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def src(cn, title, award, url=None, method="sitemap_page", label_title=1.0, h1=None):
    return {"control_number": cn, "title": title, "award": award, "method": method if url else "no_closed_list",
            "source": {"url": url, "title": h1 or title, "h1": h1 or title,
                       "label": {"award": 1, "title": label_title}} if url else None}


B = "https://catalog.example.edu/programs/"
sources = [src("1", "Accounting", "A.S. Degree", B + "accounting-as/"),
           src("2", "Biology", "A.S. Degree", B + "biology-as/"),
           src("3", "Chemistry", "A.S. Degree", B + "chemistry-as/"),
           src("4", "History", "A.A. Degree", B + "history-aa/"),
           src("5", "Mathematics", "A.S. Degree", B + "economics-as/", label_title=0.0, h1="Economics"),
           src("6", "Nursing", "A.S. Degree", B + "p6/", h1="Nursing Overview Studies Extra"),
           src("7", "Welding Technology 1", "Certificate of Achievement", B + "welding-technology-1-ca/"),
           src("8", "Welding Technology 2", "Certificate of Achievement", B + "welding-technology-2-ca/"),
           src("9", "Spanish I", "A.A. Degree", B + "spanish-i-aa/"),
           src("10", "Spanish", "A.A. Degree", B + "spanish-aa/"),
           src("11", "Paralegal", "A.S. Degree")]
cap = {"college": "Example College", "platform": "courseleaf"}
r = N.college_census(sources, cap)
check(r["route"] == "site" and r["ncl"] == 1, "a site capture is tested and its no-closed-list programs counted: %r" % r)
check(r["tested"] == 9 and r["hits"] == 8 and r["false"] == 0 and r["recall"] == round(8 / 9, 3),
      "a program whose page the search's own label does not name (Mathematics on Economics) is not tested; one whose "
      "heading carries other words (Nursing) is a miss; numbered and roman siblings each find their own: %r" % r)
check(r["false_off_own"] == 0 and r["searches"] is False,
      "nine tested is under the minimum of ten, so the college is not looked up whatever its recall: %r" % r)
r10 = N.college_census(sources + [src("12", "Geology", "A.S. Degree", B + "geology-as/")], cap)
check(r10["tested"] == 10 and r10["hits"] == 9 and r10["searches"] is True,
      "ten tested at 90%% with no false match opens the lookup: %r" % r10)
r_pdf = N.college_census(sources, {"college": "X", "platform": "pdf"})
check(r_pdf["route"].startswith("pdf") and "tested" not in r_pdf, "a PDF capture is not looked up in this slice")

# The committed captures: the census runs on every one, and no program lands on another program's page.
full = N.census()
sw = full["statewide"]
check(sw["false"] == 0 and sw["false_off_own"] == 0,
      "no closed-list program in the committed captures is matched to another program's page, nor found anywhere "
      "when its own page is set aside (the #3300 review's stricter measure; Diablo Valley's transfer pages): %r"
      % [(k, c["false_matches"][:2]) for k, c in full["colleges"].items() if c.get("false") or c.get("false_off_own")][:3])
check(sw["conversion"]["found_wrong"] == 0 and sw["conversion"]["converted"] > 1000,
      "a third of the closed-list programs, turned into programs with no list and their pages unclaimed, are never "
      "found on a wrong page (the second reader's real-use test): %r" % sw["conversion"])
check(full["colleges"]["merced"]["catalog_list"]["files_not_listed"] is False,
      "Merced's catalog list misses closed-list programs whose pages were read, so it files no not_listed")
check(sw["tested"] > 5000 and sw["recall"] is not None and sw["colleges_searched"] + sw["colleges_under_floor"]
      == sw["site_route"], "the census reads the committed captures whole: %r" % sw)

# The pages the lookup gives back (ncl_yield, S668), counted the way a capture would: a no-closed-list program takes
# its one page from the one closed-list program holding it when the page does not name the holder and the holder's
# filed record, read from that page, fails live. Skyline's Dance A.A. (10546) on dance-aa.php, held by Musical
# Theater (46296), is the shape.
FAIL = {"coverage": {"pass": False}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"}}
PASS = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
y_sources = sources + [src("12", "Geology", "A.S. Degree", B + "geology-as/"),
                       src("13", "Musical Theater", "Certificate of Achievement", B + "dance-aa/", label_title=0.0,
                           h1="Dance Associate in Arts Degree Program"),
                       src("14", "Dance", "A.A. Degree")]


def yield_census(score, cap_extra=None, record=True):
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "records"))
        if record:
            with open(os.path.join(td, "records", "13.json"), "w") as fh:
                json.dump({"control_number": "13", "source_url": B + "dance-aa/", "record": {}, "score": score}, fh)
        return N.college_census(y_sources, dict(cap, **(cap_extra or {})), td)


ry = yield_census(FAIL)
check(ry["searches"] and [(y["holder"], y["taker"], y["url"], y["holder_passes_live"]) for y in ry["yields"]]
      == [("13", "14", B + "dance-aa/", False)] and ry["yield_unjudged"] == 0 and ry["yield_refused_passing"] == 0,
      "a holder whose filed record from the page fails gives the page to the program it names: %r" % ry["yields"])
rp = yield_census(PASS)
check(rp["yields"] == [] and rp["yield_refused_passing"] == 1 and rp["yield_held"][0]["holder"] == "13",
      "a holder whose filed record passes live keeps its page (Lemoore 43533): %r" % rp["yield_held"])
ru = yield_census(FAIL, record=False)
check(ru["yields"] == [] and ru["yield_unjudged"] == 1, "a holder with no filed record keeps its page, unjudged")
check(yield_census(FAIL, {"prior": {"catalog_year": "2025-2026"}})["yields"] == []
      and yield_census(FAIL, {"reread": {"codes": []}})["yields"] == []
      and N.college_census(y_sources, cap)["yields"] == [],
      "a prior-year read, a re-read and a census without the filed records yield nothing")
check(N.college_census(sources, cap, "/nonexistent")["yields"] == [] and r["searches"] is False,
      "a college under the self-test's floor yields nothing")
# A record naming no year reads its filing's year, through capture()'s own rule (ncl_filed_records), and is compared
# with the year the lookup runs under: once the registry moves a year, the census and a capture both leave the page.
with tempfile.TemporaryDirectory() as td:
    os.makedirs(os.path.join(td, "records"))
    with open(os.path.join(td, "capture.json"), "w") as fh:
        json.dump({"catalog_year": "2026-2027"}, fh)
    with open(os.path.join(td, "records", "13.json"), "w") as fh:
        json.dump({"control_number": "13", "source_url": B + "dance-aa/", "record": {}, "score": FAIL}, fh)
    cap26 = dict(cap, catalog_year="2026-2027")
    same = N.college_census(y_sources, cap26, td)
    moved_year = N.college_census(y_sources, cap26, td, registry_year="2027-2028")
    stamped = C.ncl_filed_records(td)("13")
check([y["holder"] for y in same["yields"]] == ["13"] and moved_year["yields"] == []
      and moved_year["yield_unjudged"] == 1 and stamped["catalog_year"] == "2026-2027",
      "a record with no year reads the filed capture's 2026-2027 and moves the page under it; under a registry moved "
      "to 2027-2028 it judges nothing: %r" % moved_year["yield_held"])
# A yield the filing already applied (the #3408 review): the holder is filed page_claimed, so its page is no filed
# page and the lookup cannot see it; the census counts it from the filing's own record of it.
claimed_13 = dict(y_sources[-2], method="page_claimed", source=None)
taker_14 = dict(y_sources[-1], catalog_lookup={"result": "found", "took_from": "13",
                                               "page": {"url": B + "dance-aa/", "h1": "Dance Associate in Arts Degree Program"}})
acct_cap = dict(cap, catalog_lookup={"yields": [{"holder": "13", "holder_title": "Musical Theater", "taker": "14",
                                                 "taker_title": "Dance", "url": B + "dance-aa/", "h1": "x"}]})
with tempfile.TemporaryDirectory() as td:
    both = N.college_census(y_sources[:-2] + [claimed_13, taker_14], acct_cap, td)
    by_acct = N.college_census(y_sources[:-2] + [claimed_13, y_sources[-1]], acct_cap, td)
    by_took = N.college_census(y_sources[:-2] + [claimed_13, taker_14], cap, td)
    not_claimed = N.college_census(y_sources[:-1] + [taker_14], cap, td)
check([(y["holder"], y["taker"], y["applied"], y["holder_passes_live"]) for y in both["yields"]]
      == [("13", "14", True, False)]
      and [(y["holder"], y["taker"], y["applied"]) for y in by_acct["yields"]] == [("13", "14", True)]
      and [(y["holder"], y["taker"], y["applied"]) for y in by_took["yields"]] == [("13", "14", True)],
      "a yield already applied counts as a yield: its holder filed page_claimed, named by the capture's account, the "
      "taker's took_from, or both: %r" % [both["yields"], by_acct["yields"], by_took["yields"]])
# The same on Skyline's committed read, put in the state a filing of the yield leaves: 46296 and 32337 page_claimed,
# the takers' answers naming them. The pages are gone from the field, and the census still counts both.
SKY = os.path.join(C.COLLEGE_DIR, "skyline")
with open(os.path.join(SKY, "sources.json")) as fh:
    sky_src = json.load(fh)
with open(os.path.join(SKY, "capture.json")) as fh:
    sky_cap = json.load(fh)
sky_pages = {x["control_number"]: (x.get("source") or {}).get("url") for x in sky_src}
sky_after = [dict(x, method="page_claimed", source=None) if x["control_number"] in ("46296", "32337") else
             dict(x, catalog_lookup={"result": "found", "took_from": {"10546": "46296", "10529": "32337"}[x["control_number"]],
                                     "page": {"url": sky_pages[{"10546": "46296", "10529": "32337"}[x["control_number"]]]}})
             if x["control_number"] in ("10546", "10529") else x for x in sky_src]
sky_applied = N.college_census(sky_after, sky_cap, SKY)
check(sorted((y["holder"], y["taker"], y["applied"]) for y in sky_applied["yields"])
      == [("32337", "10529", True), ("46296", "10546", True)],
      "after a filing applies Skyline's two yields, the census still counts both: %r" % sky_applied["yields"])
check(not_claimed["yields"] == [] and not_claimed["yield_unjudged"] == 1,
      "a took_from beside a holder still filed on its page is no applied yield; the lookup judges it again (here with "
      "no record: unjudged): %r" % not_claimed["yields"])

# The committed captures (the self-recall test): every page given back is one whose holder's filed record, read from
# that page, fails live, and whose readings name the taker and not the holder. The conductor counted 15 failing holders
# on pages that name a no-closed-list program word for word (S668); more than that is a yield outside the measured set.
check(sw["yields_passing_moved"] == 0, "no holder whose filed record passes live loses its page: %r"
      % [y for y in sw["yield_list"]][:5])
bad = []
for slug, c in full["colleges"].items():
    if not c.get("yields"):
        continue
    d = os.path.join(C.COLLEGE_DIR, slug)
    with open(os.path.join(d, "sources.json")) as fh:
        srcs = json.load(fh)
    with open(os.path.join(d, "capture.json")) as fh:
        capj = json.load(fh)
    feats = C.ncl_pages(N.pages_of(srcs, capj), capj.get("college"), capj.get("catalog_year"))
    by = {s["control_number"]: s for s in srcs}
    for y in c["yields"]:
        rec = C._filed(os.path.join(d, "records", y["holder"] + ".json"))
        if y["applied"]:
            # Applied: the holder is filed page_claimed and no passing record of it was dropped by the move.
            if C._passing_filed_rec(rec) or by[y["holder"]].get("method") != "page_claimed" \
                    or by[y["taker"]].get("method") != "no_closed_list":
                bad.append((slug, y["holder"], y["taker"], "applied"))
            continue
        pg = next(f for f in feats if C.page_stem(y["url"]) in f["keys"])
        if (C._passing_filed_rec(rec) or not C.ncl_read_from(rec, pg) or C.ncl_match(pg, by[y["holder"]])
                or not C.ncl_match(pg, by[y["taker"]]) or by[y["taker"]].get("method") != "no_closed_list"
                or not c["searches"] or (rec.get("catalog_year") or capj.get("catalog_year"))
                != capj.get("catalog_year")):
            bad.append((slug, y["holder"], y["taker"]))
check(not bad, "every committed yield moves a failing record of the capture's year off a page that names the taker, "
      "not the holder: %r" % bad)
# The self-recall list (S668): the 13 the census yields on the committed captures, applied or not. The conductor
# counted 15 failing holders on pages naming a no-closed-list program word for word, outside GE-pattern and 2.0
# pages: these are 12 of them (Contra Costa 31021 and Foothill 06104 and 45656 sit under the self-test's floor),
# and Chaffey 18435, which holds the Cal-GETC certificate's page. A change here is a finding to judge, never a
# number to update.
YIELDS_S668 = [("cabrillo", "20410", "41948"), ("chaffey", "18435", "45032"), ("college_of_san_mateo", "32203", "05783"),
               ("crafton_hills", "11766", "11767"), ("feather_river", "36176", "04321"), ("gavilan", "21284", "18457"),
               ("gavilan", "33048", "21277"), ("gavilan", "45720", "18456"), ("gavilan", "46046", "08461"),
               ("lemoore", "10954", "20341"), ("lemoore", "19305", "33017"), ("skyline", "32337", "10529"),
               ("skyline", "46296", "10546")]
# Judged in S676 (#3456): three of the 13 no longer reach the yield, because the fresh captures under the #3408 code
# file each holder under page_claimed and the lookup finds the taker's own page, the end the yield was for. They
# leave the census's yield list and must stay resolved that way: holder claimed, taker found.
RESOLVED_BY_CLAIM_S676 = [("feather_river", "36176", "04321"), ("gavilan", "46046", "08461"),
                          ("lemoore", "19305", "33017")]
for slug, holder, taker in RESOLVED_BY_CLAIM_S676:
    capj = json.load(open(os.path.join(ROOT, "kb", "program_requirements_college", slug, "capture.json")))
    claimed = {p.get("control_number") for p in capj.get("page_claimed") or []}
    found = {p.get("control_number") for p in (capj.get("catalog_lookup") or {}).get("found_programs") or []}
    check(holder in claimed and taker in found,
          "%s %s stays page_claimed and %s stays found by the lookup (S676)" % (slug, holder, taker))
# Judged in S677: Chaffey 18435 (Physical Science), the suspect yield of S668, no longer holds the Cal-GETC page.
# The fresh capture files it under not_found, so the holder is unread and no taker's page is moved. The yield's
# premise is gone, which is the end the suspicion asked for. It must stay unread on that page.
RESOLVED_BY_NOT_FOUND_S677 = [("chaffey", "18435", "45032")]
for slug, holder, taker in RESOLVED_BY_NOT_FOUND_S677:
    capj = json.load(open(os.path.join(ROOT, "kb", "program_requirements_college", slug, "capture.json")))
    nf = {p.get("control_number") for p in capj.get("not_found") or []}
    rec = os.path.join(ROOT, "kb", "program_requirements_college", slug, "records", holder + ".json")
    check(holder in nf and not os.path.exists(rec),
          "%s %s stays not_found with no record filed, so it holds no page of %s (S677)" % (slug, holder, taker))
# Judged in S753 (lane 2, the matcher's fixes): four colleges' lookups opened by the fixes, and the lookup gave back
# four pages. Each is read from the census row: the page's own heading names the taker and not the holder, and the
# holder's filed record was read from that page and fails live (holder_passes_live false); a fifth, Marin 21935's
# Certificate of Achievement in Business, General, is refused because the holder's record passes (yield_refused_passing).
# Marin 46068 Biology holds "A.S. in Biology" for 03364 Biology; San Diego City 22333 (a Communications Technician
# Apprenticeship) holds "Electronics - Certificate of Achievement" for 05238 Electronics; San Diego Mesa 31695
# (Mathematics) holds the Liberal Arts and Sciences: Science Studies-Biological Science page for 18271, and 18270
# (Math & Pre-Engineering) the Science Studies-Chemistry page for 18272. They stay pinned until a filing moves them.
YIELDS_S753 = [("college_of_marin", "46068", "03364"), ("san_diego_city", "22333", "05238"),
               ("san_diego_mesa", "31695", "18271"), ("san_diego_mesa", "18270", "18272")]
expected = sorted((set(YIELDS_S668) | set(YIELDS_S753)) - set(RESOLVED_BY_CLAIM_S676) - set(RESOLVED_BY_NOT_FOUND_S677))
moved = sorted((y["college"], y["holder"], y["taker"]) for y in sw["yield_list"])
check(moved == expected and sw["yields"] == len(expected) and sw["yields_passing_moved"] == 0,
      "the census yields exactly the 13 judged in S668 less the 3 resolved by a page claim in S676 and Chaffey 18435 (S677), plus the 4 judged in S753, Skyline's Dance "
      "A.A. and Automotive Advanced Engine Performance Technology among them, whether a filing has applied them yet "
      "or not: %r" % moved)

# ── S753 (lane 2, the matcher's fixes): each pattern that held a college under the floor, on a fixture, its limit, and
# the committed census: every college a fix opened passes on merit, none that passed is lost, no false match anywhere.
def _prog(title, award="A.S. Degree", cn="1"):
    return {"control_number": cn, "title": title, "award": award, "closed_list": []}


def _pages(*items, college="Test College"):
    return C.ncl_pages([{"url": u, "h1": h, "title": h} for u, h in items], college)


def _hit(p, ps):
    return C.ncl_answer(p, ps, {}, [p])["result"] == "found"


U = "https://c.example.edu/p/"
CW = frozenset({"san", "diego", "city", "college"})

# 1. what follows the award is a tag, not the program's name
check(C.strip_tail("Accounting - Associate of Science Degree: City", CW) == "Accounting - Associate of Science Degree",
      "the campus after the award is set aside (San Diego City's 'Degree: City')")
check(C.strip_tail("Accounting - A.A. Degree - BUS") == "Accounting - A.A. Degree",
      "a department code after the award is set aside (Merritt)")
check(C.strip_tail("Math and Science - Associate of Science Degree - (AOE) NAS493/C") ==
      "Math and Science - Associate of Science Degree", "a program code after the award is set aside (Norco)")
check(C.strip_tail("Certificate of Achievement in Automotive Technology - Honda, Professional Automotive Career "
                   "Training (PACT)") != "Certificate of Achievement in Automotive Technology",
      "an award that leads the heading cuts nothing: what follows it is the title (Butte)")
check(C.strip_tail("Accounting: Credit Management - A.S. Degree - Cooperative Education Option") ==
      "Accounting: Credit Management - A.S. Degree - Cooperative Education Option",
      "a tag with words of its own is the title's, so it is kept")
check(C.strip_tail("ACCOUNTING - ASSOCIATE OF SCIENCE DEGREE - BUS") == "ACCOUNTING - ASSOCIATE OF SCIENCE DEGREE - BUS",
      "an all-capitals heading cannot tell a code from a word, so no code is cut from it")
check(_hit(_prog("Accounting"), _pages((U + "a", "Accounting - Associate of Science Degree: City"),
                                    college="San Diego City College")),
      "a program is found on a heading with its campus after the award")

# 2. award spellings
check(C.award_kinds_in("Geographic Information Systems Cert") == {"coa"}, "'Cert' at a heading's end names a certificate of achievement")
check(_hit(_prog("Welding", "Certificate of Achievement requiring 16S/24Q"), _pages((U + "w", "Welding Cert"))),
      "Antelope Valley's 'Welding Cert' is the certificate")
check(C.award_kinds_in("Fire Science Certificate") == set(), "the bare word certificate is no award kind, only a class")
ps = _pages((U + "fs-aa", "Fire Science AA"), (U + "fs-cert", "Fire Science Certificate"))
check(C.ncl_award_kinds({"url": U + "fs2", "h1": "Fire Science Certificate"}) == {"certificate"}
      and _hit(_prog("Fire Science", "A.A. Degree"), ps) and not _hit(_prog("Fire Science", "A.A. Degree", "2"), ps[1:]),
      "a heading ending in the word certificate names the class: an A.A. never takes the certificate's page")
check(C.ncl_award_kinds({"url": "https://m.example.edu/catalog/current/program/a-s-in-art-fall-2026-credit-noncredit",
                         "h1": "A.S. in Art"}) == {"as"},
      "Marin's '-credit-noncredit' address tag is not a noncredit award")
check(C.ncl_words("1. Certificate of Competency, ESL Beginning") == C.ncl_words("ESL Beginning"),
      "a heading's leading list number is no part of the title")
check(C.ncl_words("Studio Arts - AA-T Transfer Major (18 units or more)") == C.ncl_words("Studio Arts"),
      "'Transfer Major (18 units or more)' is decoration (Palomar)")
check(C.ncl_words("Pathway to Xfer: Business") == C.ncl_words("Pathway to Transfer: Business"),
      "Xfer is transfer (Grossmont)")
check(C.ncl_words("Pipe Welding (CM) certificate") == C.ncl_words("Pipe Welding")
      and C.ncl_words("Customer Relationship Management (CRM)") != C.ncl_words("Customer Relationship Management"),
      "a two-letter award code in parentheses before the award word is decoration (Merced); a title's own is not")
check(C.ncl_words("Accounting: Certificate of Achievement (Transcripted)") == C.ncl_words("Accounting"),
      "'(Transcripted)' is decoration (Santa Ana)")
check(C.ncl_words("Certificate of Achievement-Advanced (COA-A) Accounting") == C.ncl_words("Accounting"),
      "De Anza's Advanced certificate is the certificate")
check(C.ncl_words("Apprenticeship: Electrician") == C.ncl_words("Electrician"), "Imperial Valley's 'Apprenticeship:' prefix is decoration")
check(C.ncl_words("Liberal Arts Area of Emphasis: Allied Health") == C.ncl_words("Liberal Arts Allied Health"),
      "'Area of Emphasis' is decoration (Taft)")
check(C.ncl_words("Dental Hygiene Administration: Bachelor’s of Science") ==
      C.ncl_words("Dental Hygiene Administration: Bachelor of Science"), "Bachelor's of Science reads as Bachelor of Science (Taft)")

# 3. level and acronym readings are added beside the whole heading, never in place of it
lv = _pages((U + "re2", "Real Estate - Certificate of Achievement Level 2"))
check(_hit(_prog("Real Estate", "Certificate of Achievement requiring 16S"), lv)
      and _hit(_prog("Real Estate Level 2", "Certificate of Achievement requiring 16S"), lv),
      "a certificate's level tag is read both ways (San Jose City): the title with or without its level")
two = _pages((U + "re1", "Real Estate - Certificate of Achievement Level 1"), (U + "re2", "Real Estate - Certificate of Achievement Level 2"))
check(not _hit(_prog("Real Estate", "Certificate of Achievement requiring 16S"), two),
      "two levels of one program are a tie, and a tie is not found")
ac = _pages((U + "ifa", "Self Determination Program - Independent Facilitator (IF): Certificate of Completion"))
check(_hit(_prog("Self Determination Program: Independent Facilitator", "Noncredit program"), ac)
      and not _hit(_prog("Self Determination Program: Independent Facilitator (LVN)", "Noncredit program"), ac),
      "an abbreviation that spells the words before it is set aside (Taft); one that does not is a word")
check(C.strip_acronym("Registered Nurse (RN)") == "Registered Nurse" and C.strip_acronym("Registered Nurse (LVN)") == "Registered Nurse (LVN)",
      "strip_acronym cuts only the initials")

# 4. a printed award beats a page that prints none, and only that
pr = _pages((U + "weld", "Welding Technology"), (U + "weld-ca", "Welding Technology, CA"))
check(_hit(_prog("Welding Technology", "Certificate of Achievement requiring 16S"), pr),
      "where one page prints the program's award and one prints none, the printed one is the program's")
check(not _hit(_prog("Welding Technology", "Certificate of Achievement requiring 16S"),
              _pages((U + "weld", "Welding Technology"), (U + "weld2", "Welding Technology"))),
      "two pages that print no award stay a tie")
check(not _hit(_prog("Welding Technology", "Certificate of Achievement requiring 16S"),
              _pages((U + "w1-ca", "Welding Technology, CA"), (U + "w2-ca", "Welding Technology, COA"))),
      "two pages that print the award stay a tie")
# the other program's claim on the unprinted page does not block the one the printed page names
a_s, coa = _prog("Welding Technology", "A.S. Degree", "1"), _prog("Welding Technology", "Certificate of Achievement requiring 16S", "2")
check(_hit(a_s, pr) and _hit(coa, pr) and C.ncl_answer(a_s, pr, {}, [a_s, coa])["result"] == "found"
      and C.ncl_answer(coa, pr, {}, [a_s, coa])["result"] == "found",
      "the degree takes the page without an award and the certificate the page printing CA, neither blocked by the other")

# 5. DEPARTMENT/PROGRAM headings (Rio Hondo)
dept = _pages(*[(U + "d%d" % i, "DEPT%d/PROGRAM NUMBER%d - Associate of Science Degree" % (i, i)) for i in range(6)],
             *[(U + "x%d" % i, "PLAIN%d - Associate of Science Degree" % i) for i in range(6)])
check(_hit(_prog("Program Number3"), dept), "where a college's headings print DEPARTMENT/PROGRAM, the program's part reads too")
few = _pages((U + "h", "Hospitality/Management - Associate of Science Degree"),
            *[(U + "y%d" % i, "PLAIN%d - Associate of Science Degree" % i) for i in range(12)])
check(not _hit(_prog("Management"), few), "one slash in a college's headings gives no program a department's part (Hospitality/Management)")

# 6. the census: every college a fix opened passes on merit, none that passed is lost, no false match anywhere
NEWLY = ["antelope_valley", "college_of_marin", "college_of_the_redwoods", "college_of_the_siskiyous", "coalinga",
         "de_anza", "foothill", "grossmont", "imperial_valley", "lake_tahoe_community", "merced", "merritt",
         "mission", "moreno_valley", "norco", "palo_verde", "palomar", "rio_hondo", "san_diego_city", "san_diego_mesa",
         "san_diego_miramar", "san_jose_city", "santa_ana", "taft"]
STILL_UNDER = ["cerritos", "contra_costa", "madera", "miracosta", "sierra"]
rows = {}
for slug in NEWLY + STILL_UNDER:
    d = os.path.join(C.COLLEGE_DIR, slug)
    rows[slug] = N.college_census(json.load(open(d + "/sources.json")), json.load(open(d + "/capture.json")), d)
for slug in NEWLY:
    r = rows[slug]
    check(r["searches"] and r["recall"] >= C.NCL_FLOOR and r["tested"] >= C.NCL_MIN_TESTED and r["false"] == 0
          and r["false_off_own"] == 0, "%s passes its own self-test on merit: %r" % (slug, {k: r[k] for k in ("recall", "tested", "false", "false_off_own")}))
for slug in STILL_UNDER:
    check(not rows[slug]["searches"], "%s still reports not searched (the floor is %s, not lowered): %r" % (slug, C.NCL_FLOOR, rows[slug]["recall"]))
check(C.NCL_FLOOR == 0.8 and C.NCL_MIN_TESTED == 10, "the floor and the minimum are as S652 set them")
sw = N.census()["statewide"]
check(sw["false"] == 0 and sw["false_off_own"] == 0, "no college has a false match: %r" % ({k: sw[k] for k in ("false", "false_off_own")}))
check(sw["colleges_under_floor"] == len(STILL_UNDER),
      "the colleges under the floor are the five listed: %r" % sw["colleges_under_floor"])


if failures:
    print("FAIL: harvest ncl lookup census (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: harvest ncl lookup census" % (checks[0], checks[0]))
