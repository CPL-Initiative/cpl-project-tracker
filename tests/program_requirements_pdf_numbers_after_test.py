#!/usr/bin/env python3
"""A catalog PDF that prints each program's control number AFTER the program: the gated reading.

WHY (S644, rebuilt S645). Santiago Canyon's 2026-2027 catalog prints "Control Number: N" after each
program, and the PDF reader cut each page from the number's line, so a local degree's window opened
on the transfer degree printed next (COBIx, #3194 comment 6841001207). The S644 fix switched an
after-reading on from a statewide count of the catalog's own lines; the S645 review found it unsound
(13 findings). The conductor's design, pinned here on constructed catalogs, never on committed data:

  1. the reading is gated per college (the reconcile entry's pdf_numbers_after); the count of the
     habit (pdf_numbers_after) is a measurement: capture_pdf files it, a flag where a gated
     catalog's count disagrees, a lead (numbers_after_suspected) where an ungated one's says after;
  2. a program binds to the block that ends at its own number line only when the block opens on its
     own title and award; otherwise the heading picker runs, and the after path never returns None
     before it has;
  3. a window is refused only when the first number line at or after its heading is another LISTED
     program's number; a number no program holds refuses nothing;
  4. a refused or unbound program whose filed record passes keeps that record unless forced, and the
     capture's account names it (refused_passing, with the closing number);
  6. an empty slice never names a block's page; the extractor choice reads by the gated reading.

The fixtures are the reviewers' constructions: the number at the heading, under the heading and
after the program; a mixed catalog; a number that does not print; a stale or unlisted number; a
block spanning pages. capture_pdf is driven for both gate states, so forcing the after reading
everywhere, or nowhere, fails here.

Run from repo root: python3 tests/program_requirements_pdf_numbers_after_test.py
"""
import json
import os
import re
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


AA, AAT, AS, AST = "A.A. Degree", "A.A- T Degree", "A.S. Degree", "A.S. T Degree"
SUF = {AA: "AA", AAT: "AA-T", AS: "AS", AST: "AS-T"}
WORDS = {AA: "A.A. Degree", AAT: "A.A. Degree for Transfer", AS: "A.S. Degree", AST: "A.S. Degree for Transfer"}
PROGS = [{"control_number": "11700", "title": "Art", "award": AA},
         {"control_number": "11710", "title": "Art", "award": AAT},
         {"control_number": "11943", "title": "Economics", "award": AA},
         {"control_number": "35200", "title": "Economics", "award": AAT},
         {"control_number": "11856", "title": "Biology", "award": AS},
         {"control_number": "35110", "title": "Biology", "award": AST}]
BODY = {"Art": "ART 100 Drawing 3\nART 110 Color 3\n",
        "Economics": "ECON 120 Macroeconomics 3\nECON 121 Microeconomics 3\nMATH 219 Statistics 4\n",
        "Biology": "BIOL 211 Cell Biology 4\nCHEM 200A General Chemistry 5\n"}
CODES = {"Art": ("ART 100", "ART 110"), "Economics": ("ECON 120", "ECON 121", "MATH 219"),
         "Biology": ("BIOL 211", "CHEM 200A")}
HEADER = "92 / Credit Programs\nsccollege.edu\nCollege Catalog 2026/27\n"


def courses(p):
    return [{"code": c} for c in CODES[p["title"]]]


def own_head(p):
    return "%s, %s" % (p["title"], SUF[p["award"]])


def block(p, layout):
    head = "%s\n%s\n" % (own_head(p), WORDS[p["award"]])
    desc = "The %s in %s prepares students for further study.\nRequired courses\n" % (WORDS[p["award"]], p["title"])
    num = "Control Number: %s\n" % p["control_number"]
    return {"at_heading_line": "%s (Control Number: %s)\n%s\n" % (own_head(p), p["control_number"], WORDS[p["award"]])
                               + desc + BODY[p["title"]],
            "number_above_heading": num + head + desc + BODY[p["title"]],
            "under_heading": head + num + BODY[p["title"]],
            "after_program": head + desc + BODY[p["title"]] + num}[layout]


def catalog(layout, progs=PROGS):
    bl = [block(p, layout) for p in progs]
    return [HEADER.replace("92", str(92 + k // 2)) + bl[k] + (bl[k + 1] if k + 1 < len(bl) else "")
            for k in range(0, len(bl), 2)]


def heads_in(text):
    return re.findall(r"^(\w+, A[AS](?:-T)?)$", text or "", re.M)


def ctx_of(pages, progs=PROGS):
    return C.pdf_after_context(pages, progs)


def best(pages, p, ctx=False):
    return C.pdf_best("https://x.edu/c.pdf", pages, p, courses(p), "pypdf", numbers_after=ctx)


# ── 1. The count of the habit is a measurement, with its threshold pinned ────────────────────────
AFTER = catalog("after_program")
v = C.pdf_numbers_after(AFTER, PROGS)
check(v["after_mode"] and v["before"] == 0 and v["after"] >= 3, "after-program numbers vote after: %r" % v)
for layout in ("number_above_heading", "at_heading_line"):
    v = C.pdf_numbers_after(catalog(layout), PROGS)
    check(not v["after_mode"], "%s does not read as after: %r" % (layout, v))
# The threshold, on both sides: three after votes read as after, two do not; nor three against two before.
three = ["Art, AA\nA.A. Degree\nART 100 3\nControl Number: 11700\nArt, AA-T\nA.A. Degree for Transfer\n"
         "ART 100 3\nControl Number: 11710\nEconomics, AA\nA.A. Degree\nECON 120 3\nControl Number: 11943\n"
         "Economics, AA-T\nA.A. Degree for Transfer\n"]
check(C.pdf_numbers_after(three, PROGS) == {"after": 3, "before": 0, "after_mode": True},
      "three after votes read as after: %r" % C.pdf_numbers_after(three, PROGS))
two = [three[0].replace("Control Number: 11943\n", "")]
check(C.pdf_numbers_after(two, PROGS) == {"after": 2, "before": 0, "after_mode": False},
      "two after votes do not: %r" % C.pdf_numbers_after(two, PROGS))
against = three + ["Control Number: 11856\nBiology, AS\nA.S. Degree\nBIOL 211 4\n"
                   "Control Number: 35110\nBiology, AS-T\nA.S. Degree for Transfer\nBIOL 211 4\n"]
check(not C.pdf_numbers_after(against, PROGS)["after_mode"],
      "three after against two before do not (more than twice): %r" % C.pdf_numbers_after(against, PROGS))
# A number line that ends its page votes on the next page's opening, past the running header.
foot = [HEADER + block(PROGS[0], "after_program"), HEADER + block(PROGS[1], "after_program"), HEADER]
check(C.pdf_numbers_after(foot, PROGS)["after"] == 1, "a number at a page's foot votes on the next page's heading")

# ── 2. Bind only what names its program ─────────────────────────────────────────────────────────
ctx = ctx_of(AFTER)
check({"92 / credit programs", "sccollege.edu", "college catalog #/#"} <= {k.replace("92", "#") for k in ctx["running"]}
      or {"# / credit programs", "sccollege.edu", "college catalog #/#"} <= ctx["running"],
      "the running header is found: %r" % ctx["running"])
for p in PROGS:
    b = best(AFTER, p, ctx)
    check(b and b.get("bound") == "number_after" and heads_in(b["text"]) == [own_head(p)] and b["coverage"] == 1.0,
          "after the program: %s reads its own block alone: %r" % (own_head(p), b and heads_in(b["text"])))
    old = best(AFTER, p)
    check(old and "bound" not in old and "after_unbound" not in old,
          "ungated, %s reads by the heading picker, with no after field" % own_head(p))
check(heads_in(best(AFTER, PROGS[4])["text"]) != heads_in(best(AFTER, PROGS[4], ctx)["text"]),
      "ungated, the Biology A.S. window is the heading picker's (the S644 misread), gated its own")
# A block spanning pages: a program whose block runs from the foot of one page onto the next.
SPAN = ["%sArt, AA\nA.A. Degree\nART 100 Drawing 3\nControl Number: 11700\nEconomics, AA\nA.A. Degree\n"
        "ECON 120 Macroeconomics 3\n" % HEADER,
        "%sECON 121 Microeconomics 3\nMATH 219 Statistics 4\nControl Number: 11943\n" % HEADER.replace("92", "93"),
        "%sBiology, AS\nA.S. Degree\nBIOL 211 Cell Biology 4\nCHEM 200A General Chemistry 5\nControl Number: 11856\n"
        % HEADER.replace("92", "94")]
sctx = ctx_of(SPAN + [HEADER] * 2)
sp = best(SPAN + [HEADER] * 2, PROGS[2], sctx)
check(sp and sp.get("bound") == "number_after" and sp["pages"] == [1, 2] and sp["coverage"] == 1.0
      and heads_in(sp["text"]) == ["Economics, AA"], "a block spanning pages reads across them: %r" % (sp and sp["pages"]))
bio = best(SPAN + [HEADER] * 2, PROGS[4], sctx)
check(bio and bio["pages"] == [3] and bio["url"].endswith("#page=3") and "[page 2]" not in bio["text"],
      "a block whose page the previous number ends names its own page, never the empty slice before: %r"
      % ((bio and (bio["pages"], bio["url"])),))
# The number not printed: Economics AA's line is dropped, so the block ending at the AA-T's number opens
# on the AA. Never handed to the AA-T (review finding 9).
NOPRINT = [x.replace("Control Number: 11943\n", "") for x in AFTER]
nctx = ctx_of(NOPRINT)
aat = best(NOPRINT, PROGS[3], nctx)
check(aat is not None and aat.get("bound") is None and aat["text"] == best(NOPRINT, PROGS[3])["text"]
      and aat.get("after_unbound") == "block_not_named",
      "the AA-T never binds the block that opens on the AA; the heading picker reads it, as before: %r" % ((aat and (heads_in(aat.get("text")), aat.get("after_unbound"))),))
aa = best(NOPRINT, PROGS[2], nctx)
check(aa is not None and aa.get("after_unbound") == "number_not_printed" and aa.get("bound") is None,
      "a program whose number does not print goes to the heading picker: %r" % (aa and aa.get("after_unbound")))
# A transfer degree printing its number AT its heading, after an after-style local degree (finding 4):
# the block that ends at its number line is empty, so it never takes the AA's block.
SOC = [{"control_number": "11947", "title": "Sociology", "award": AA},
       {"control_number": "11961", "title": "Sociology", "award": AAT}]
soc_pages = ["%sSociology, AA\nA.A. Degree\nSOC 101 Intro 3\nSOC 102 Problems 3\nControl Number: 11947\n"
             "Control Number: 11961\nSociology, AA-T\nA.A. Degree for Transfer\nSOC 101 Intro 3\nSOC 102 Problems 3\n"
             "SOC 120 Family 3\n" % HEADER, HEADER, HEADER]
soc_c = [{"code": c} for c in ("SOC 101", "SOC 102")]
s_aat = C.pdf_best("u", soc_pages, SOC[1], soc_c, "pypdf", numbers_after=ctx_of(soc_pages, SOC))
check(s_aat and heads_in(s_aat["text"]) == ["Sociology, AA-T"] and s_aat.get("bound") is None and not s_aat.get("refused"),
      "a number at its own heading, after an after-style block, reads its own heading's window: %r"
      % ((s_aat and (heads_in(s_aat["text"]), s_aat.get("refused"))),))
s_aa = C.pdf_best("u", soc_pages, SOC[0], soc_c, "pypdf", numbers_after=ctx_of(soc_pages, SOC))
check(s_aa and s_aa.get("bound") == "number_after" and heads_in(s_aa["text"]) == ["Sociology, AA"],
      "and the AA its own block")

# A block that names its program and none of its listed courses (the list printed in a table elsewhere):
# the heading picker still runs, and the after path never answers None ahead of it.
TABLE = ["%sArt, AA\nA.A. Degree\nThe courses are listed in the table that follows.\nControl Number: 11700\n" % HEADER,
         "%sArt, AA course table\nART 100 Drawing 3\nART 110 Color 3\n" % HEADER.replace("92", "93"), HEADER]
tb = best(TABLE, PROGS[0], ctx_of(TABLE))
check(tb is not None and tb.get("after_unbound") == "block_names_no_listed_course" and tb["coverage"] == 1.0
      and tb["text"] == best(TABLE, PROGS[0])["text"],
      "a named block with no listed course goes to the heading picker: %r" % ((tb and tb.get("after_unbound")),))

# ── 3. Refuse narrowly ──────────────────────────────────────────────────────────────────────────
# A mixed catalog: after-style pages, then a page that prints the number AT the heading (finding 3).
ACC = {"control_number": "11858", "title": "Accounting", "award": AS}
acc_c = [{"code": c} for c in ("ACCT 101", "ACCT 102", "ACCT 103")]
MIXED = AFTER + ["%sControl Number: 11858\nAccounting, AS\nA.S. Degree\nACCT 101 3\nACCT 102 3\nACCT 103 3\n"
                 "Control Number: 11859\nPayroll, CA\nCertificate of Achievement\nACCT 110 3\n" % HEADER]
mprogs = PROGS + [ACC, {"control_number": "11859", "title": "Payroll", "award": "Certificate of Achievement"}]
mctx = ctx_of(MIXED, mprogs)
ac = C.pdf_best("u", MIXED, ACC, acc_c, "pypdf", numbers_after=mctx)
check(ac and ac["coverage"] == 1.0 and not ac.get("refused") and heads_in(ac["text"])[:1] == ["Accounting, AS"],
      "a mixed catalog's number-at-heading program reads its own window, not refused, not None: %r"
      % ((ac and (ac.get("refused"), ac["coverage"])),))
for p in PROGS:
    b = C.pdf_best("u", MIXED, p, courses(p), "pypdf", numbers_after=mctx)
    check(b and b.get("bound") == "number_after" and heads_in(b["text"]) == [own_head(p)],
          "and its after-style programs still bind: %s" % own_head(p))
# The previous program's number above the heading, and a stale number after the block (finding 2).
STALE = ["%sCHEM 101 General Chemistry 5\nControl Number: 11855\nAccounting, AS\nA.S. Degree\nACCT 101 3\nACCT 102 3\n"
         "ACCT 103 3\nControl Number: 09999\n" % HEADER, HEADER, HEADER]
sprogs = [ACC, {"control_number": "11855", "title": "Chemistry", "award": AS}]
st = C.pdf_best("u", STALE, ACC, acc_c, "pypdf", numbers_after=ctx_of(STALE, sprogs))
check(st and st["coverage"] == 1.0 and not st.get("refused"),
      "the number above the heading is the previous program's, and a number no program holds refuses nothing: %r"
      % (st and st.get("refused")))
# An unlisted number on the program's own closing line (finding 10).
UNLISTED = [x.replace("Control Number: 11943", "Control Number: 99999") for x in AFTER]
ul = best(UNLISTED, PROGS[2], ctx_of(UNLISTED))
check(ul and not ul.get("refused") and ul["coverage"] == 1.0 and ul["text"] == best(UNLISTED, PROGS[2])["text"],
      "a closing number no listed program holds refuses nothing: %r" % (ul and ul.get("refused")))
# The S644 misbind itself: a program whose block names something else, read by the heading picker from
# its own number line, opens on the next program and is refused by that program's number.
INTRO = [AFTER[0], AFTER[1], AFTER[2].replace("Biology, AS\nA.S. Degree\n", "The Department of Life Sciences offers several programs of study.\nBiology, AS\nA.S. Degree\n")]
rf = best(INTRO, PROGS[4], ctx_of(INTRO))
check(rf and rf.get("refused") == "35110" and rf["coverage"] == 0.0 and not rf["text"]
      and rf.get("after_unbound") == "block_not_named",
      "a window another listed program's number closes is refused, with that number: %r"
      % ((rf and (rf.get("refused"), rf.get("after_unbound"))),))
check(C.pdf_closed_by("Control Number: 11856\nBiology, AS-T\nA.S. Degree for Transfer\nControl Number: 35110\n",
                      PROGS[4], ctx) == "35110", "pdf_closed_by names the closing listed number")
check(C.pdf_closed_by("Control Number: 11856\nBiology, AS\nA.S. Degree\nControl Number: 35110\n", PROGS[4], ctx) is None,
      "and none when the program's own number heads it")


# ── 4. capture_pdf, both gate states, and the account ───────────────────────────────────────────
def capture(pages, gated, progs=PROGS, folder=None):
    tmp = tempfile.mkdtemp()
    os.makedirs(os.path.join(tmp, "sources"))
    programs = [dict(p, shape="1", status="active", load_id="1", closed_list=courses(p)) for p in progs]
    saved = (C.read_hand_filed, R.load_steps, C.COLLEGE_DIR)
    C.read_hand_filed = lambda hf: {"url": "https://x.edu/c.pdf", "access": "hand_filed", "pages": pages,
                                    "extractor": "pypdf"}
    R.load_steps = lambda path=R.STEPS: {"Fixture College": {"pdf_numbers_after": True, "steps": []}} if gated else {}
    try:
        report = {}
        recs = C.capture_pdf("Fixture College", tmp, programs, {"catalog_url": "https://x.edu/c.pdf"}, report,
                             {"meta": {"url": "https://x.edu/c.pdf", "fetched_by": "test", "fetched_at": "2026-11-13", "sha256": "0"}})
        srcs = {}
        for name in os.listdir(os.path.join(tmp, "sources")):
            with open(os.path.join(tmp, "sources", name)) as fh:
                srcs[name[:-5]] = json.load(fh)
        acct = C.refused_passing(folder, recs) if folder else None
        return report, srcs, acct
    finally:
        C.read_hand_filed, R.load_steps, C.COLLEGE_DIR = saved
        shutil.rmtree(tmp)


import contextlib  # noqa: E402
import io  # noqa: E402
with contextlib.redirect_stdout(io.StringIO()):
    rep_on, src_on, _ = capture(AFTER, True)
    rep_off, src_off, _ = capture(AFTER, False)
    rep_dis, src_dis, _ = capture(catalog("number_above_heading"), True)
    rep_ref, src_ref, _ = capture(catalog("under_heading"), False)
# The extractor choice (pypdf or pdfminer) counts accepted windows by the same gated reading.
seen_ctx, real_best = [], C.pdf_best
C.pdf_best = lambda *a, **k: seen_ctx.append((a[4], k.get("numbers_after"))) or real_best(*a, **k)
try:
    with contextlib.redirect_stdout(io.StringIO()):
        capture(AFTER, True)
finally:
    C.pdf_best = real_best
choice = [n for ex, n in seen_ctx if ex is None]
check(choice and all(isinstance(n, dict) and n.get("by_cn") for n in choice),
      "the extractor's count of accepted windows reads by the gated reading: %r" % [type(n).__name__ for n in choice[:3]])
na = rep_on["pdf"]["numbers_after"]
check(na["gated"] is True and na["read"] == "number_after" and na["after_mode"] is True,
      "gated: the capture files the votes and reads by number: %r" % na)
check(all(heads_in(src_on[p["control_number"]]["text"]) == [own_head(p)] for p in PROGS),
      "gated: every source holds its own program's block alone")
check(all(src_on[p["control_number"]]["method"] == "pdf_pages" for p in PROGS)
      and all(p.get("bound") == "number_after" for p in rep_on["pdf"]["picks"]), "gated: every pick is bound")
na = rep_off["pdf"]["numbers_after"]
check(na["gated"] is False and na["read"] == "heading" and rep_off["pdf"].get("numbers_after_suspected"),
      "ungated, an after count is a lead for a person, never the switch: %r" % na)
check(heads_in(src_off["11856"]["text"]) != ["Biology, AS"]
      and all("bound" not in p and "after_unbound" not in p for p in rep_off["pdf"]["picks"]),
      "ungated: the catalog reads exactly by the heading picker")
check(rep_dis["pdf"].get("numbers_after_disagrees") and rep_dis["pdf"]["numbers_after"]["read"] == "heading",
      "a gated catalog whose votes disagree files the flag and reads by the heading picker")


def picker_text(pages, p):
    """The source text the heading picker alone gives (ungated pdf_best, through source_record)."""
    prog = dict(p, shape="1", status="active", load_id="1", closed_list=courses(p))
    return C.source_record("Fixture College", prog, {}, best(pages, p), "pdf_pages")["text"]


check(all(src_dis[p["control_number"]]["text"] == picker_text(catalog("number_above_heading"), p) for p in PROGS),
      "and its text is the heading picker's, byte for byte")
check(all(src_off[p["control_number"]]["text"] == picker_text(AFTER, p) for p in PROGS),
      "ungated, an after-program catalog's text is the heading picker's, byte for byte")
check(not rep_ref["pdf"].get("numbers_after_disagrees")
      and all(src_ref[p["control_number"]]["text"] == picker_text(catalog("under_heading"), p) for p in PROGS),
      "ungated, an under-heading catalog reads by the heading picker whatever its count says: %r"
      % rep_ref["pdf"]["numbers_after"])

# The account: a refused program whose filed record passes is named, with its closing number.
PASS = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
FAIL = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"}}
folder = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(folder, "records"))
    for cn, sc in (("11856", PASS), ("11943", FAIL)):
        with open(os.path.join(folder, "records", cn + ".json"), "w") as fh:
            json.dump({"control_number": cn, "record": {"program": {}}, "score": sc, "extracted_run": "old"}, fh)
    with contextlib.redirect_stdout(io.StringIO()):
        rep, srcs, acct = capture(INTRO, True, folder=folder)
    check(srcs["11856"]["method"] == "not_found" and srcs["11856"]["after_unbound"]["refused"] == "35110",
          "the refused program is filed not_found with its closing number: %r" % srcs["11856"].get("after_unbound"))
    check(acct == [{"control_number": "11856", "title": "Biology", "award": AS, "closed_by": "35110",
                    "why": "block_not_named"}], "refused_passing names the passing one alone: %r" % acct)

    # The extraction keeps that passing record unless forced, and the filing keeps its source entry.
    import _program_requirements_extract as X
    calls = []
    X.call = lambda src, key: calls.append(src["control_number"]) or {"error": "no model call in a test"}

    def extract(force):
        out = tempfile.mkdtemp()
        os.makedirs(os.path.join(out, "sources"))
        # The refused source as filed, and the same refusal for a program whose filed record fails.
        for cn in ("11856", "11943"):
            with open(os.path.join(out, "sources", cn + ".json"), "w") as fh:
                json.dump(dict(srcs["11856"], control_number=cn), fh)
        os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-only")
        with contextlib.redirect_stdout(io.StringIO()):
            C.extract(out, 0, 1, "new", 1, folder, force)
        return out
    out = extract(None)
    kept = sorted(os.listdir(os.path.join(out, "records")))
    check(kept == ["11856.json"], "a passing refused record stays on file; a failing one does not: %r" % kept)
    listed = os.path.join(out, "kept_unbound_0.json")
    check(os.path.isfile(listed) and json.load(open(listed)) == {"programs": ["11856"]}, "and the run lists it")
    # Filing the run keeps the kept record's own source entry, never the refusal beside it.
    dest = tempfile.mkdtemp()
    saved_dir = C.COLLEGE_DIR
    C.COLLEGE_DIR = dest
    try:
        slug = os.path.join(dest, C.slug_of("Fixture College"))
        os.makedirs(slug)
        with open(os.path.join(slug, "sources.json"), "w") as fh:
            json.dump([{"control_number": "11856", "method": "pdf_pages", "coverage": 1.0, "source": {"url": "old"}}], fh)
        with open(os.path.join(out, "capture.json"), "w") as fh:
            json.dump({"college": "Fixture College"}, fh)
        with contextlib.redirect_stdout(io.StringIO()):
            C.file_run("Fixture College", out, "new")
        with open(os.path.join(slug, "sources.json")) as fh:
            entry = {x["control_number"]: x for x in json.load(fh)}
        check(entry.get("11856", {}).get("source") == {"url": "old"} and entry.get("11943", {}).get("method") == "not_found",
              "the filing keeps the kept record's source entry: %r" % entry.get("11856"))
        check(sorted(os.listdir(os.path.join(slug, "records"))) == ["11856.json"], "and files the kept record")
    finally:
        C.COLLEGE_DIR = saved_dir
        shutil.rmtree(dest)
    shutil.rmtree(out)
    out = extract({"11856"})
    check(os.listdir(os.path.join(out, "records")) == [], "a forced control number is not kept")
    shutil.rmtree(out)
    check(calls == [], "no source with text reached the model: %r" % calls)
finally:
    shutil.rmtree(folder)

# ── 5. The gate is the reconcile entry alone ────────────────────────────────────────────────────
check(R.numbers_after("X", {"X": {"pdf_numbers_after": True}}) and not R.numbers_after("X", {"X": {}})
      and not R.numbers_after("X", {"X": {"pdf_numbers_after": "yes"}}), "numbers_after reads the entry's true alone")

if failures:
    print("FAIL: %d of %d" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements PDF numbers printed after (%d checks)" % checks[0])
