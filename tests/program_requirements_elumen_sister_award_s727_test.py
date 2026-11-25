#!/usr/bin/env python3
"""S727: the eLumen sister-award swap (f-elumen-sister-award-swap-s721).

    python3 tests/program_requirements_elumen_sister_award_s727_test.py

WHY. Antelope Valley heads a degree "Electrical Technology AS" and its certificate "Electrical Technology Cert", at
addresses whose term tail (-as-fall-2026, -cert-fall-2025) slug_awards() sets aside (S689). The page's label named
neither award, so a degree and a certificate of one title tied on every page they both read, and assign() handed one
of them its sister's page by page order alone: about 47 programs at Antelope Valley. College of the Redwoods heads a
certificate "Aquaculture Technology, CA" and its degree "Aquaculture Technology" over "A.S. Degree (", and handed
42895 and 45557 their degree's page and 45595 its certificate's. label_score() now reads the heading's closing award
abbreviation (heading_award_tail) and the award line under a title-alone heading (page_award_subheading), and
candidates() ranks a page whose heading prints the title exactly above one whose heading only holds it
(heading_exact). HEADING_AWARD_READ = False reads as before.

  1. The failing input: Antelope Valley's Electrical Technology A.S. (14414) and certificate (20184), one title and the
     same nine courses, on the two pages page read 45381304038 printed. Before the fix the pair's pages follow the
     pages' order; after it each binds its own page in either order, every program unmarked and marked as the capture
     marks it (RC.mark over the committed folder, p-pin-test-sets-production-mark-s721).
  2. The same for Redwoods' Aquaculture Technology certificate (42895) and A.S. (42928), and Psychiatric Technician
     (45557, 45595), on the openings page read 45383284426 printed with each program's filed codes.
  3. The heading reading itself: the abbreviations it reads, a line in capitals it leaves alone, and the address
     still deciding first.
  4. Self-recall over every eLumen college's filed sources (the fixture): each filed page is built from its heading and
     the codes filed from it, and assign() runs with the reading off and on. A program's own page is known where its
     address names its award once the term tail is set aside, or, at Redwoods, from S721's hand list of own pages.
     After the fix no such program binds another page or none; the binds that change are counted, and no college
     outside Antelope Valley, Redwoods and Mission moves at all. Its programs are marked as the capture marks them.
  5. Off the eLumen road (every other platform's committed filed pages) no label and no rank changes: the readings
     apply on elumenapp.com addresses alone (on_elumen; the second reader, round 1).
The fixture is tests/fixtures/program_requirements_elumen_sister_award_s727.json.gz (sources.json as committed at
f790f9f1) beside S721's tests/fixtures/program_requirements_lever_pins_s721.json.gz. Pure stdlib.
"""
import collections
import glob
import gzip
import json
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_reread_keep_better as K  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def load(name):
    return json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", name), "rt", encoding="utf-8"))


S721 = load("program_requirements_lever_pins_s721.json.gz")
S727 = load("program_requirements_elumen_sister_award_s727.json.gz")
OPENINGS = {u: p["text"] for u, p in S721["recall"]["pages"].items()}
HAND = {e["control_number"]: e["own_url"] for e in S721["recall"]["programs"]}


def page(url, h1, body, title=None):
    got = {"url": url, "final_url": url, "title": title or h1, "h1": h1, "body": body, "content": body, "links": []}
    return {"url": url, "title": title or h1, "h1": h1, "body": body, "content": body, "got": got,
            "codes": C.page_net(got)}


def prog(cn, title, award, codes):
    return {"control_number": cn, "title": title, "award": award, "status": "Active", "shape": "x",
            "closed_list": [{"code": c} for c in codes], "load_id": "1"}


def binds(programs, pages, read):
    C.HEADING_AWARD_READ = read
    try:
        return {cn: (g.get("best") or {}).get("url") for cn, g in C.assign(programs, pages).items()}
    finally:
        C.HEADING_AWARD_READ = True


def marked(programs, slug, how):
    """The programs as the capture marks them (how "capture"), or every one unmarked or marked."""
    out = [dict(p) for p in programs]
    if how == "capture":
        C.RC.mark(out, os.path.join(ROOT, "kb", "program_requirements_college", slug))
    else:
        for p in out:
            p[C.RC.MARK] = how == "marked"
    return out


def pair_case(label, slug, programs, pages, own, marks=("unmarked", "capture")):
    for how in marks:
        ps = marked(programs, slug, how)
        flips = 0
        for order in (pages, pages[::-1]):
            before, after = binds(ps, order, False), binds(ps, order, True)
            flips += before != {cn: own[cn] for cn in own}
            check(after == own, "%s (%s, %s first): each binds its own page (%s)"
                  % (label, how, order[0]["url"].rsplit("/", 1)[1], {k: (v or "").rsplit("/", 1)[-1] for k, v in after.items()}))
        if how == "unmarked":
            check(flips >= 1, "%s (unmarked): with the reading off, one page order hands a sister's page (%d of 2)"
                  % (label, flips))


# ── 1. the failing input: Antelope Valley's Electrical Technology A.S. and certificate ──────────────────────────
AVC = S721["colleges"]["Antelope Valley College"]
AS = "https://avc.elumenapp.com/catalog/2026-27/program/electrical-technology-as-fall-2026"
CERT = "https://avc.elumenapp.com/catalog/2026-27/program/electrical-technology-cert-fall-2025"
avc_pages = [page(u, AVC["pages"][u]["h1"], AVC["pages"][u]["text"]) for u in (AS, CERT)]
p14, p20 = AVC["programs"]["14414"], AVC["others"]["20184"]
check(p14["codes"] == p20["codes"] and p14["title"] == p20["title"],
      "1 14414 (A.S.) and 20184 (certificate) share a title and their nine listed courses")
avc_progs = [prog("14414", p14["title"], p14["award"], p14["codes"]), prog("20184", p20["title"], p20["award"], p20["codes"])]
pair_case("1 Antelope Valley Electrical Technology", "antelope_valley", avc_progs, avc_pages,
          {"14414": AS, "20184": CERT})
# Marked as rules B, C and A read it, the A.S. page prints its GE map ("Any AVC GE Area 2"), so a marked degree binds it
# only through a site_pages pin (S721, RC.PIN_HEADING); the marked certificate still binds its own page.
both = binds(marked(avc_progs, "antelope_valley", "marked"), avc_pages, True)
check(both == {"14414": None, "20184": CERT},
      "1 every program marked: the certificate binds its own page, the A.S. none (rule B; a pin binds it), never its "
      "sister's (%s)" % both)

# ── 2. Redwoods' sister pairs on the openings S721 read, with their filed codes ───────────────────────────────────
CR = S727["colleges"]["College of the Redwoods"]
codes = {p[0]: p for p in CR["programs"]}
for title, cert, deg in (("Aquaculture Technology", "42895", "42928"), ("Psychiatric Technician", "45557", "45595")):
    ps = [prog(cn, codes[cn][1], codes[cn][2], codes[cn][4]) for cn in (cert, deg)]
    own = {cert: HAND[cert], deg: HAND[deg]}
    pgs = []
    for u in sorted(set(own.values())):
        body = OPENINGS[u] + "\n" + "\n".join("%s - Course 3" % c for c in sorted(set(codes[cert][4]) | set(codes[deg][4])))
        h1 = [ln for ln in OPENINGS[u].split("\n") if ln.strip() and ln.strip() != "Print"][0]
        pgs.append(page(u, h1, body))
    pair_case("2 Redwoods %s" % title, "college_of_the_redwoods", ps, pgs, own)

# ── 3. the heading reading ────────────────────────────────────────────────────────────────────────────────────
X = "https://x.elumenapp.com/catalog/2026-27/program/"
for h1, url, want in (("Welding AS", X + "welding-as-fall-2026", {"as"}),
                      ("Music AA", X + "music-aa-fall-2026", {"aa"}),
                      ("Welding Cert", X + "welding-cert-fall-2026", {"coa", "noncredit"}),
                      ("Addiction Studies, CA", X + "addiction-studies-ca-fall-2026", {"coa"}),
                      ("Welding - AS", X + "welding-as-winter-2023-intersession", {"as"}),
                      ("Airframe Manufacturing Technology BS", X + "amt-bs-fall-2026", {"bs"}),
                      ("Biology AS-T", X + "biology-as-t-fall-2026", {"adt"}),
                      ("ENGLISH AS", X + "english-fall-2026", set()),
                      ("English as a Second Language", X + "esl-fall-2026", set()),
                      ("Aquaculture Technology", X + "aquaculture-technology-fall-2023", set())):
    check(C.heading_award_tail(page(url, h1, h1)) == want, "3 %r reads as %s" % (h1, sorted(want)))
deg, cer = {"title": "Welding", "award": "A.S. Degree"}, {"title": "Welding", "award": "Certificate of Achievement"}
w_as, w_cert = page(X + "welding-as-fall-2026", "Welding AS", "x"), page(X + "welding-cert-fall-2026", "Welding Cert", "x")
check([C.label_score(w_as, deg)[0], C.label_score(w_as, cer)[0], C.label_score(w_cert, deg)[0], C.label_score(w_cert, cer)[0]]
      == [1, 0, 0, 1], "3 'Welding AS' names the A.S. alone and 'Welding Cert' the certificate alone")
C.HEADING_AWARD_READ = False
check([C.label_score(w_as, deg)[0], C.label_score(w_cert, cer)[0]] == [0, 0],
      "3 with HEADING_AWARD_READ off, neither heading names an award (as before S727)")
C.HEADING_AWARD_READ = True
check(C.label_score(page("https://x.edu/p/welding-technology-ca", "Welding AS", "x"), deg)[0] == 0,
      "3 an address that names an award still decides first ('-ca' over a heading closing on AS)")
aq = page("https://redwoods.elumenapp.com/catalog/2026-2027/program/aquaculture-technology-fall-2023",
          "Aquaculture Technology", "Print\nAquaculture Technology\nA.S. Degree (\n60.0 Credits\n)\nThe program")
check([C.label_score(aq, {"title": "Aquaculture Technology", "award": "A.S. Degree"})[0],
       C.label_score(aq, {"title": "Aquaculture Technology", "award": "Certificate of Achievement"})[0]] == [1, 0],
      "3 a title-alone heading over 'A.S. Degree (' names the A.S. and not the certificate")
ref = {"title": "Refrigeration Specialist", "award": "A.S. Degree"}
check([C.heading_exact(page(X + "refrigeration-specialist-as-fall-2026", "Refrigeration Specialist AS", "x"), ref),
       C.heading_exact(page(X + "air-conditioning-refrigeration-specialist-as-fall-2026",
                            "Air Conditioning & Refrigeration Specialist AS", "x"), ref)] == [1, 0],
      "3 heading_exact: 'Refrigeration Specialist AS' prints 10234's title exactly, the Air Conditioning page holds it")
bio = {"title": "Biology", "award": "A.S. Degree"}
check(C.heading_exact(page(X + "biology-as-t-fall-2026", "Biology AS-T", "x"), bio) == 0
      and C.heading_exact(page(X + "biology-as-fall-2026", "Biology AS", "x"), bio) == 1,
      "3 heading_exact reads the program's own award: an A.S. is exact on 'Biology AS', never on 'Biology AS-T'")
# Off an eLumen catalog nothing changes (the second reader, round 1, finding 1): El Camino's Acalog page heads an A.S.
# and its certificate "Marketing, AS" over the title "Degree & Certificate: ...", and both keep the award as before.
EC = "https://elcamino.smartcatalogiq.com/x/programs/marketing"
mk_cert = {"title": "Marketing", "award": "Certificate of Achievement requiring 18 to fewer than 30 semester units"}
mk_deg = {"title": "Marketing", "award": "A.S. Degree"}
ec = page(EC, "Marketing, AS", "Marketing, AS\nx", title="Degree & Certificate: Marketing")
C.HEADING_AWARD_READ = False
ec_before = [C.label_score(ec, mk_cert), C.label_score(ec, mk_deg)]
C.HEADING_AWARD_READ = True
check(not C.on_elumen(ec) and [C.label_score(ec, mk_cert), C.label_score(ec, mk_deg)] == ec_before
      and C.heading_award_tail(ec) == {"as"} and C.heading_exact(ec, mk_deg) == 0,
      "3 off eLumen the heading's closing 'AS' changes no label and no rank (%s)" % ec_before)


# ── 4. self-recall over every eLumen college's filed sources ─────────────────────────────────────────────────────
def bare_awards(url):
    """The awards an address names once its term tail is set aside (keep-the-better's TERM_TAIL), or none."""
    parts = urllib.parse.urlsplit(url)
    head, _, last = parts.path.rstrip("/").rpartition("/")
    bare = K.TERM_TAIL.sub("", last)
    return C.slug_awards(urllib.parse.urlunsplit(parts._replace(path=head + "/" + bare))) if bare != last else set()


tally = collections.Counter()
moved, order_dep = {}, {}
for college, part in sorted(S727["colleges"].items()):
    on_page = collections.defaultdict(set)
    for cn, title, award, url, found in part["programs"]:
        on_page[url] |= set(found)
    pages = [page(u, h1, (OPENINGS.get(u) or h1) + "\n" + "\n".join("%s - Course 3" % c for c in sorted(on_page[u])), title)
             for u, (h1, title) in sorted(part["pages"].items())]
    # Marked as the capture marks them (RC.mark over the committed folder, p-pin-test-sets-production-mark-s721).
    progs = marked([prog(cn, title, award, found) for cn, title, award, url, found in part["programs"]],
                   part["slug"], "capture")
    filed = {cn: url for cn, title, award, url, found in part["programs"]}
    # The capture's page order decided each tie before the fix, and the filed page is what it decided. assign() runs
    # over the pages in both orders with the reading off and on: a bind the fix settles holds in either order.
    run = {(read, k): binds(progs, pages if k == 0 else pages[::-1], read) for read in (False, True) for k in (0, 1)}
    moved[college] = sorted(cn for cn in filed if any(run[(True, k)][cn] != run[(False, k)][cn] for k in (0, 1)))
    order_dep[college] = [sum(run[(read, 0)][cn] != run[(read, 1)][cn] for cn in filed) for read in (False, True)]
    for p in progs:
        cn, kind = p["control_number"], C.P.award_kind(p["award"])
        if part["slug"] == "college_of_the_redwoods" and cn in HAND:
            own = HAND[cn]
        else:
            mine = [pg["url"] for pg in pages if kind in bare_awards(pg["url"]) and C.label_score(pg, p)[1] == 1.0]
            own = mine[0] if len(mine) == 1 else None
        if own is None or own not in part["pages"]:
            tally["own page unknown"] += 1
            continue
        verdict = lambda url: " right" if url == own else " wrong" if url else " none"  # noqa: E731
        tally["filed" + verdict(filed[cn])] += 1
        for k in (0, 1):
            tally["after" + verdict(run[(True, k)][cn])] += 1
        tally["changed from filed"] += run[(True, 0)][cn] != filed[cn]
print("self-recall:", dict(sorted(tally.items())))
print("moved by the reading:", {k: len(v) for k, v in moved.items() if v})
print("order-dependent binds (reading off, on):", {k: v for k, v in order_dep.items() if any(v)})
known = tally["filed right"] + tally["filed wrong"] + tally["filed none"]
check(known >= 1000 and tally["after right"] == 2 * known,
      "4 after the fix each of the %d programs whose own page is held binds it in either page order (%d right, %d "
      "wrong, %d none over both orders)" % (known, tally["after right"], tally["after wrong"], tally["after none"]))
check(tally["filed wrong"] >= 35 and tally["changed from filed"] == tally["filed wrong"] + tally["filed none"],
      "4 as filed, %d were read from another program's page and %d from none; the %d binds that change are exactly "
      "those" % (tally["filed wrong"], tally["filed none"], tally["changed from filed"]))
check({k for k, v in moved.items() if v} == {"Antelope Valley College", "College of the Redwoods", "Mission College"},
      "4 the reading moves binds at Antelope Valley (%d), Redwoods (%d) and Mission (%d), and nowhere else on the "
      "eLumen road" % (len(moved["Antelope Valley College"]), len(moved["College of the Redwoods"]),
                       len(moved["Mission College"])))
check(all(on <= off for off, on in order_dep.values()) and order_dep["Antelope Valley College"][1] <= 1
      and order_dep["College of the Redwoods"][1] == 0,
      "4 no college's binds depend more on page order with the reading on (Antelope Valley %s, Redwoods %s, off and on)"
      % (order_dep["Antelope Valley College"], order_dep["College of the Redwoods"]))
check({"42895", "45557", "45595"} <= set(moved["College of the Redwoods"]),
      "4 Redwoods' 42895, 45557 and 45595 are among the binds the reading moves (%s)" % moved["College of the Redwoods"])


# ── 5. no other road moves ──────────────────────────────────────────────────────────────────────────────────────
# Every committed filed page of every college off the eLumen road (sources.json as it stands; the readings are gated
# by the address, so the snapshot does not matter): no page is on eLumen; every program's label on its own filed page
# is the same with the reading off and on; and on each page whose heading closes on an award abbreviation, every
# program at the college whose title the page names at least halfway keeps its label, and no page ranks it exact.
off = collections.Counter()
for cap_path in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "capture.json"))):
    with open(cap_path, encoding="utf-8") as fh:
        cap = json.load(fh)
    if cap.get("platform") == "elumen":
        continue
    with open(os.path.join(os.path.dirname(cap_path), "sources.json"), encoding="utf-8") as fh:
        src = json.load(fh)
    pgs = {}
    for s in src:
        so = s.get("source") or {}
        if so.get("url"):
            pgs[so["url"]] = {"url": so["url"], "h1": so.get("h1") or "", "title": so.get("title") or "", "body": ""}
    off["pages"] += len(pgs)
    off["on eLumen"] += sum(C.on_elumen(pg) for pg in pgs.values())
    tailed = [pg for pg in pgs.values() if C.heading_award_tail(pg)]
    off["tailed pages"] += len(tailed)
    for s in src:
        pr = {"title": s["title"], "award": s["award"]}
        own = pgs.get((s.get("source") or {}).get("url"))
        for pg in ([own] if own else []) + tailed:
            C.HEADING_AWARD_READ = True
            new = C.label_score(pg, pr)
            if pg is not own and new[1] < 0.5:
                continue
            exact = C.heading_exact(pg, pr)
            C.HEADING_AWARD_READ = False
            old = C.label_score(pg, pr)
            C.HEADING_AWARD_READ = True
            off["pairs"] += 1
            off["changed"] += new != old or exact != 0
print("off the eLumen road:", dict(off))
check(off["pages"] >= 10000 and off["on eLumen"] == 0 and off["pairs"] >= off["pages"] and off["changed"] == 0,
      "5 off the eLumen road, %d filed pages (%d close on an award abbreviation), %d labels read: %d change"
      % (off["pages"], off["tailed pages"], off["pairs"], off["changed"]))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
