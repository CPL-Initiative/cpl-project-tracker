#!/usr/bin/env python3
"""S742: a site_pages pin's heading reads a title word and its plural as one word, with its statewide self-recall.

    python3 tests/program_requirements_pin_plural_s742_test.py

WHY. The state's file lists two Communication Studies transfer degrees at Coastline: the legacy "Communication
Studies" (33014) and "Communications Studies 2.0" (43057). The 2026-27 catalog prints one page, headed
"Communication Studies 2.0, Associate in Arts Degree for Transfer". The capture gave it to the legacy degree, whose
title the heading prints in full, and left 43057 on the pathway's landing page, where its record placed none of its
courses. A pin for 43057 was refused: rule A asks for every title word as written, and the state writes
"Communications" (tests/program_requirements_lever_pins_s739_test.py pins that refusal; it stands).

THE CHANGE (kb/_program_requirements_college.py). site_pinned() takes a second reading where site_heading_names()
refuses the pinned page: site_heading_plural() swaps each title word the heading does not print for the heading's own
word where the two differ by one closing s (keep-better's singular()), and reads the heading against the swapped
title. It refuses where no word swaps, where the title and the heading disagree about 2.0, where another program at
the college holds this title only once a plural is folded (plural_longer), and where the heading prints another
program's fuller title (site_fuller_title). The pinned page is then read under the title as its heading prints it, so rule A in the
reader's page checks reads the same word. Only a pinned program is read this way: no capture without a pin moves.

Pinned here:
  1. site_plural_swap and site_fuller_title on their own.
  2. Coastline 43057 on the 2.0 page's heading as the filed capture holds it: refused as written, named a plural
     aside; the legacy 33014 is named as written, as before, and the plural reading adds nothing for it.
  3. The wrong joins: a legacy title on a 2.0 heading, a 2.0 title on a legacy heading, a plural twin, a heading
     that is another program's fuller title, a word the heading does not print at all, another award, and no list
     of the college's programs.
  4. site_pinned() binds 43057 on the 2.0 page (its list as records/33014.json holds it, the one record read from
     that page), marked for the reader's page checks as its filed record places none, at coverage 1.0, and moves no
     other program; with the fold off the pin is refused on its heading, as before S742.
  5. The entry: Coastline's site_pages pins 43057 to the page the filed capture gave 33014.
  6. The statewide self-recall (the S652 review rule) over every filed source on a site page. The answer held: a
     program alone on its page, whose filed record was read from that page and places its courses, read its own
     page. Counted, among the pairs the exact reading refuses: own pages the plural reading names (right), and
     pages it names for another program (against the held answer; each is printed with its heading). No answer the
     exact reading gives changes: the fold is read only after a refusal.
  7. Every pin a filed capture refused on its heading: which of them the plural reading would now bind.
Pure stdlib.
"""
import collections
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as PC  # noqa: E402  (closed_list: the state's course list, offline)
import _program_reread_keep_better as K  # noqa: E402
import _program_requirements_college as C  # noqa: E402

FAILS = []
N = [0]
RIGHT, AGAINST = 18, 2       # the statewide recall's pinned figures (2026-11-27)


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def plural(pg, prog, programs, on=True):
    C.SITE_PLURAL_ON = on
    try:
        return C.site_heading_plural(pg, prog, programs)
    finally:
        C.SITE_PLURAL_ON = True


CC = "Coastline Community College"
CC_DIR = os.path.join(ROOT, "kb", "program_requirements_college", "coastline_community")
with open(os.path.join(CC_DIR, "sources.json"), encoding="utf-8") as fh:
    CC_SRC = {str(x["control_number"]): x for x in json.load(fh)}
CC_SIB = [{"control_number": cn, "title": x["title"], "award": x["award"]} for cn, x in CC_SRC.items()]
AAT = "A.A- T Degree"
HEAD_20 = "Communication Studies 2.0, Associate in Arts Degree for Transfer"
PAGE_20 = {"url": CC_SRC["33014"]["source"]["url"], "h1": "", "title": HEAD_20 + " < Coastline College"}
P43057 = {"control_number": "43057", "title": CC_SRC["43057"]["title"], "award": CC_SRC["43057"]["award"]}
P33014 = {"control_number": "33014", "title": CC_SRC["33014"]["title"], "award": CC_SRC["33014"]["award"]}

# ── 1. the swap and the fuller title ──────────────────────────────────────────────────────────────
print("1. site_plural_swap and site_fuller_title")
check(C.site_plural_swap("Communications Studies 2.0", K.page_words(HEAD_20)) == {"Communications": "communication"},
      "the state's 'Communications' swaps for the heading's 'communication'; 'Studies' is printed and stays")
check(C.site_plural_swap("Studio Art", K.page_words("Studio Arts for Transfer")) == {"Art": "arts"}
      and C.site_plural_swap("Studio Arts", K.page_words("Studio Art for Transfer")) == {"Arts": "art"},
      "the fold runs both ways, a three-letter word included")
check(C.site_plural_swap("Business Management", K.page_words("Busines Management")) == {}
      and C.site_plural_swap("Communication Studies", K.page_words("Communication Studies, AA")) == {}
      and C.site_plural_swap("Nursing", K.page_words("Welding Technology")) == {},
      "a word ending in ss, a title the heading prints as written and a word the heading does not print swap nothing")
sibs = [{"control_number": "1", "title": "Communications", "award": "A.A. Degree"},
        {"control_number": "2", "title": "Communication Studies", "award": "A.A. Degree"},
        {"control_number": "3", "title": "Communication Studies 2.0", "award": AAT}]
check(C.site_fuller_title(sibs[0], sibs, K.page_words("Communication Studies, Associate of Arts Degree")) == ["2"],
      "the heading 'Communication Studies, ...' prints the fuller title of program 2, not program 3's (no 2.0)")
check(C.site_fuller_title(sibs[1], sibs, K.page_words("Communication Studies, Associate of Arts Degree")) == [],
      "a program whose own title the heading prints has no fuller title there")

# ── 2. Coastline 43057 and the legacy 33014 on the 2.0 page's heading ─────────────────────────────
print("2. Coastline's 2.0 page")
check(P43057["title"] == "Communications Studies 2.0" and P33014["title"] == "Communication Studies"
      and CC_SRC["33014"]["source"]["title"] == PAGE_20["title"],
      "the state's two titles, and the page's title as the filed capture holds it")
check(C.site_heading_names(PAGE_20, P43057)[0] is False, "as written, the heading refuses 43057 (S739's hold)")
check(plural(PAGE_20, P43057, CC_SIB) == ("Communication Studies 2.0", HEAD_20),
      "a plural aside, the heading names 43057, under the title as the page prints it")
check(plural(PAGE_20, P43057, CC_SIB, on=False) == (None, ""), "with the fold off the plural reading shows nothing")
check(C.site_heading_names(PAGE_20, P33014)[0] is True and plural(PAGE_20, P33014, CC_SIB) == (None, ""),
      "the legacy 33014 is named as written, as before; the plural reading adds nothing for it")

# ── 3. the wrong joins ────────────────────────────────────────────────────────────────────────────
print("3. the wrong joins")
legacy_s = {"control_number": "90001", "title": "Communications Studies", "award": AAT}
check(plural(PAGE_20, legacy_s, CC_SIB + [legacy_s]) == (None, ""),
      "a title without 2.0 never folds onto a 2.0 heading")
legacy_pg = {"url": "https://catalog.example.edu/communication-studies-aat/", "h1": "",
             "title": "Communication Studies, Associate in Arts Degree for Transfer < Example College"}
check(plural(legacy_pg, P43057, CC_SIB) == (None, ""), "a 2.0 title never folds onto a heading without 2.0")
twin = dict(P43057, control_number="90002", title="Communication Studies 2.0")
check(plural(PAGE_20, P43057, CC_SIB + [twin]) == (None, ""),
      "a program at the college whose title differs by a plural alone refuses the fold")
comm = {"control_number": "18053", "title": CC_SRC["18053"]["title"], "award": CC_SRC["18053"]["award"]}
aa_pg = {"url": CC_SRC["43030"]["source"]["url"], "h1": "",
         "title": "Communication Studies, Associate of Arts Degree < Coastline College"}
check(comm["title"] == "Communications" and CC_SRC["43030"]["title"] == "Communication Studies"
      and plural(aa_pg, comm, CC_SIB) == (None, ""),
      "Coastline's 'Communications' A.A. is not named by 'Communication Studies, Associate of Arts Degree', the "
      "fuller title of 43030")
other = dict(P43057, title="Journalisms Studies 2.0")
check(plural(PAGE_20, other, CC_SIB) == (None, ""), "a title with a word the heading does not print shows nothing")
cert = dict(P43057, award="Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")
check(plural(PAGE_20, cert, CC_SIB) == (None, ""), "a certificate takes nothing from the transfer degree's heading")
check(plural(PAGE_20, P43057, None) == (None, ""),
      "without the college's programs the twins cannot be read, and the fold shows nothing")

# ── 4. site_pinned() on the 2.0 page ──────────────────────────────────────────────────────────────
print("4. the pin binds through site_pinned()")
with open(os.path.join(CC_DIR, "records", "33014.json"), encoding="utf-8") as fh:
    REC = json.load(fh)["record"]
body = HEAD_20 + "\n\nProgram Requirements\n"
for b in REC["blocks"]:
    body += "%s\n" % b["name"] + "".join("%s Course %d 3\n" % (c["code"], k) for k, c in enumerate(b["courses"]))
body += "Total Units 18\n"


def page(url, h1, title, text):
    got = {"url": url, "final_url": url, "title": title, "h1": h1, "body": text, "content": text, "links": []}
    return {"url": url, "title": title, "h1": h1, "body": text, "content": text, "got": got,
            "codes": C.page_net(got)}


def program(cn, marked=False):
    x = CC_SRC[cn]
    return {"control_number": cn, "title": x["title"], "award": x["award"], "shape": x.get("shape"),
            "status": "Active", "closed_list": PC.closed_list(CC, cn), "load_id": "1", C.RC.MARK: marked}


with open(os.path.join(CC_DIR, "records", "43057.json"), encoding="utf-8") as fh:
    placed_none = json.load(fh)["score"]["coverage"].get("none_placed") is True
programs = [program(cn, marked=(cn == "43057" and placed_none)) for cn in sorted(CC_SRC) if PC.closed_list(CC, cn)]
pg20 = page(PAGE_20["url"], "", PAGE_20["title"], body)
landing = page(CC_SRC["43057"]["source"]["url"], "", CC_SRC["43057"]["source"]["title"],
               "Communication Studies\n" + body.split("\n", 1)[1])
PINS = C.site_pin_entries(CC)
check(placed_none and len(PC.closed_list(CC, "43057")) == 9,
      "43057's filed record places none of the nine courses the state lists, so the reader's page checks read it")
got = C.site_pinned(programs, [pg20, landing], PINS)
best = (got.get("43057") or {}).get("best") or {}
check(set(got) == {"43057"} and best.get("url") == PAGE_20["url"] and best.get("pinned") is True
      and best.get("coverage") == 1.0,
      "the pin binds on the 2.0 page, marked pinned, at coverage 1.0 (%s)" % (got.get("43057") or {}).get("why"))
check((best.get("program") or {}).get("title") == "Communication Studies 2.0" and best.get("field") is not None,
      "the page is read under the title as its heading prints it, through rule A")
before = C.assign(programs, [pg20, landing])
after, account = C.with_site_pins(before, got, PINS)
check(all(after[cn] is before[cn] for cn in before if cn != "43057")
      and account == {"43057": {"url": PINS["43057"]["url"], "bound": True}},
      "only 43057 moves; the legacy 33014 keeps what assign() gave it")
C.SITE_PLURAL_ON = False
try:
    off = C.site_pinned(programs, [pg20, landing], PINS)
finally:
    C.SITE_PLURAL_ON = True
check("heading" in (off.get("43057") or {}).get("why", ""), "with the fold off the pin is refused on its heading")
check("heading" in (C.site_pinned(programs, [pg20, landing], {"43057": {"url": landing["url"]}})
                    .get("43057") or {}).get("why", ""),
      "a pin to the landing page, headed 'Communication Studies', is refused: no 2.0")

# ── 5. the entry ──────────────────────────────────────────────────────────────────────────────────
print("5. Coastline's entry")
check(sorted(PINS) == ["43057"] and PINS["43057"]["url"] == CC_SRC["33014"]["source"]["url"]
      and PINS["43057"]["url"] != CC_SRC["43057"]["source"]["url"],
      "the entry pins 43057 alone, to the 2.0 page and not the landing page the capture read it from")
want = {C.P.norm_code(c["code"]) for c in PC.closed_list(CC, "43057")}
have = {C.P.norm_code(c["code"]) for b in REC["blocks"] for c in b["courses"]}
legacy = {C.P.norm_code(c["code"]) for c in PC.closed_list(CC, "33014")}
check(want <= have and sorted(legacy - have) == ["ENGLC1001"],
      "the list read from that page holds all nine of 43057's courses and misses one of the legacy degree's ten")


# ── 6. the statewide self-recall ──────────────────────────────────────────────────────────────────
print("6. the self-recall over every filed source on a site page")
right, against, pairs, tested, colleges, twins_out = [], [], 0, 0, 0, 0
for sp in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "sources.json"))):
    d = os.path.dirname(sp)
    try:
        with open(sp, encoding="utf-8") as fh:
            everyone = json.load(fh)
    except ValueError:
        continue
    srcs = [x for x in everyone if (x.get("source") or {}).get("url") and ".pdf" not in x["source"]["url"].lower()]
    if not srcs:
        continue
    # The banner a catalog prints as every page's h1 (the capture blanks it: drop_banner_h1) is no heading.
    h1s = collections.Counter((x["source"].get("h1") or "").strip() for x in srcs)
    banner = {h for h, n in h1s.items() if h and n >= C.BANNER_PAGES and n >= C.BANNER_SHARE * len(srcs)}
    on = collections.Counter(x["source"]["url"] for x in srcs)
    own = []
    for x in srcs:
        try:
            with open(os.path.join(d, "records", "%s.json" % x["control_number"]), encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        cov = (f.get("score") or {}).get("coverage") or {}
        if on[x["source"]["url"]] == 1 and cov.get("pass") is True and f.get("source_url") == x["source"]["url"]:
            own.append(x)
    if not own:
        continue
    colleges += 1
    sib = [{"control_number": x["control_number"], "title": x["title"], "award": x["award"]} for x in everyone]
    pages, words = {}, {}
    for b in own:
        s = b["source"]
        pg = {"url": s["url"], "h1": "" if (s.get("h1") or "").strip() in banner else s.get("h1"),
              "title": s.get("title")}
        pages[b["control_number"]] = pg
        heads = [pg["h1"] or "", C.TITLE_SPLIT.split(pg["title"] or "", 1)[0]]
        words[b["control_number"]] = [(w, K.singular(w)) for w in (K.page_words(h) for h in heads if h)]
    for a in everyone:
        pa = {"control_number": a["control_number"], "title": a["title"], "award": a["award"]}
        mine = [(w, next(iter(K.singular({w})))) for w in {x.lower() for x in re.findall(r"[A-Za-z]{3,}", a["title"])}]
        for b in own:
            same = a["control_number"] == b["control_number"]
            if not same and (a.get("source") or {}).get("url") == b["source"]["url"]:
                continue
            pairs += 1
            # The fold's own first refusal, read here on word sets so the recall runs in seconds: no title word is
            # missing from a heading that prints the same word a closing s apart (site_plural_swap's condition).
            if not any(w not in got and sg in sing for got, sing in words[b["control_number"]] for w, sg in mine):
                continue
            tested += 1
            pg = pages[b["control_number"]]
            if C.site_heading_names(pg, pa)[0]:
                continue                      # the exact reading answers; the fold is never read
            printed, head = C.site_heading_plural(pg, pa, sib)
            if not printed:
                continue
            row = (os.path.basename(d), a["control_number"], a["title"], b["control_number"], b["title"], head)
            (right if same else against).append(row)
print("   %d colleges, %d pairs, %d with a word that swaps; right %d, against the held answer %d"
      % (colleges, pairs, tested, len(right), len(against)))
by_college = collections.Counter(r[0] for r in right)
print("   own pages the plural reading names: %s" % ", ".join("%s %d" % kv for kv in sorted(by_college.items())))
for r in against:
    print("   against: %s %s %r on the page filed for %s %r, headed %r" % r)
check(colleges >= 70 and pairs > 2000000, "the recall read every site catalog's filed sources (%d colleges, %d pairs)"
      % (colleges, pairs))
check(len(right) == RIGHT, "the plural reading names %d own pages the exact reading refuses (pinned %d)"
      % (len(right), RIGHT))
check(sorted((r[0], r[1]) for r in against) == [("coastline_community", "43057"), ("grossmont", "19823")],
      "two pages are named for a program other than the one filed on them, each headed with that program's own "
      "title, a plural aside: Coastline's 2.0 page for 43057 (tonight's pin) and Grossmont's 'University Studies - "
      "Mathematics and Natural Science and Computer Science (AS)' for 19823 (%s)" % [(r[0], r[1]) for r in against])
check(len(against) == AGAINST, "no other page is named for another program (%d)" % len(against))

# ── 7. the pins filed captures refused on their heading ───────────────────────────────────────────
print("7. pins a filed capture refused on its heading")
refused = []
for cp in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "capture*.json"))):
    try:
        with open(cp, encoding="utf-8") as fh:
            cap = json.load(fh)
    except ValueError:
        continue
    for cn, acct in (cap.get("site_pins") or {}).items():
        if not acct.get("bound") and "heading" in (acct.get("why") or ""):
            refused.append((os.path.basename(os.path.dirname(cp)), os.path.basename(cp), cn, acct.get("why")))
for r in refused:
    print("   %s %s %s: %s" % (r[0], r[1], r[2], (r[3] or "")[:150]))
moves = []
for slug, _, cn, why in refused:
    with open(os.path.join(ROOT, "kb", "program_requirements_college", slug, "sources.json"), encoding="utf-8") as fh:
        srcs = json.load(fh)
    me = next((x for x in srcs if str(x["control_number"]) == cn), None)
    head = why.split("(", 1)[1].rsplit(")", 1)[0].strip("'\"") if "(" in (why or "") else ""
    if me and head and C.site_heading_plural({"url": "", "h1": head, "title": ""},
                                             {"control_number": cn, "title": me["title"], "award": me["award"]},
                                             [{"control_number": x["control_number"], "title": x["title"],
                                               "award": x["award"]} for x in srcs])[0]:
        moves.append((slug, cn))
check(not moves, "no pin a filed capture refused on its heading binds under the plural reading (%d refused, %s)"
      % (len(refused), moves))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
