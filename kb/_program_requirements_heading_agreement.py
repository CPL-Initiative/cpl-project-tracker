#!/usr/bin/env python3
"""Does each harvested record's own heading agree with the program it is filed under?

WHY (S644). Santiago Canyon College's 2026-2027 catalog PDF prints "Control Number: N" AFTER each
program. The PDF reader (kb/_program_requirements_college.py, pdf_best) cuts the page from the line
that prints the program's number, the habit of catalogs that print it at the heading (East LA's
"Academic Plan E013343D", Los Angeles City's "State Code"), so at Santiago Canyon a local degree's
window opened on the transfer degree printed after it. COBIx checked five records by hand (#3194
comment 6841001207): Biology AS 11856 holds the Biology AS-T, and Economics AA 11943 and Sociology
AA 11947 PASS the machine checks while holding their AA-T's requirements. Coverage, invented and the
arithmetic cannot see it: the two degrees share most courses and each sums to its own total.

WHAT THIS MEASURES, from committed files only (read-only; writes no table):

  * every record under kb/program_requirements_college/<slug>/records/ against the program it is filed
    under (the capture's program list in sources.json: COCI title and award). Its own heading is the
    record's program.section_heading, as the reading recorded it. The award test is the scorer's
    heading_award_check (kb/_program_requirements_score.py, one copy); the title test is the share of
    the COCI title's words the heading prints. A record DISAGREES when its heading names another award
    type, or prints none of the title's words; AGREES when the heading names the program's award type
    (or prints its control number) and some of its title; anything else CANNOT TELL (a heading with
    the title and no award, no heading, or the model's own note that the heading is not in its text).
  * whether a disagreeing record passes: passes_live (the harvest's rule) and places_none (the load
    leaves those out), both the scorer's.
  * for every college read from a PDF (a record with method pdf_pages), where the catalog prints a
    control-number line (CN_LABEL) relative to the program it names, read from the capture's picks:
    each pick's window opening ("opens", the first 220 characters). A pick whose window opens on its
    own number line and then names another program's title and award is a number printed AFTER its
    program; one that then names its own is printed BEFORE; one on the heading's own line is AT the
    heading.
  * what heading_award_check would fail statewide among records that pass on the committed files
    (passes_live), by college: the number the conductor needs before the check is wired into any pass
    rule. It is not wired here. A heading naming an award and none of the program's title words is
    set aside in its own bucket (award_not_program: Pasadena prints one page for an A.S. and its
    certificate, S645 review of #3201).

The committed snapshot reads only the files this tree commits (git ls-files), and says the date of
the newest capture it reads. A college folder on an unmerged branch never enters it: measure one with
--extra and --college.

Run from repo root:
    python3 kb/_program_requirements_heading_agreement.py            # writes the snapshot
    python3 kb/_program_requirements_heading_agreement.py --check    # exit 1 when it is stale (check_generated.sh, CI)
    python3 kb/_program_requirements_heading_agreement.py --extra PATH:LABEL --college SLUG   # a folder off main
writes kb/status/harvest_heading_agreement.json and .md. Guard: tests/program_requirements_heading_agreement_test.py.
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_college as C  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT_JSON = os.path.join(HERE, "status", "harvest_heading_agreement.json")
OUT_MD = os.path.join(HERE, "status", "harvest_heading_agreement.md")

# A printed control-number line. The brief's four labels, and the two the reader already reads
# (pdf_control_number: East LA's "Academic Plan E013343D", Los Angeles Valley's "State Code").
CN_LABEL = re.compile(r"(?P<label>Program Control Number|CCCCO Control (?:Number|No\.?|#)|Control Number|Control No\.?"
                      r"|Control #|State Code|Academic Plan)\s*[:#]?\s*\(?\s*(?P<num>[A-Z]?\d{4,8}[A-Z]?)", re.I)


def norm_cn(s: str | None) -> str:
    """A control number's digits, leading zeros dropped ("E013343D" -> "13343")."""
    return re.sub(r"\D", "", s or "").lstrip("0")


def words(s: str | None) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", (s or "").lower()))


def title_share(text: str | None, title: str | None) -> float | None:
    """The share of the COCI title's words (pilot's title_tokens) the text prints; None for a title of none."""
    tokens = P.title_tokens(title or "")
    if not tokens:
        return None
    have = words(text)
    return round(sum(1 for t in tokens if t in have) / len(tokens), 3)


# Words a heading prints that name no program: "Program Requirements", "Requirements for the Major",
# "Associate in Science Degree Major Requirements", "Plan of Study Grid", "Cal-GETC Areas and Units".
# A heading of these words alone says nothing about which program it heads.
GENERIC = set("""
a aa aas aat adt ast as an and are area areas arts associate associates award awards b ba bs c ca cal catalog
certificate certificates certification coa completion competency complete core course courses csu curriculum d
degree degrees description education elective electives emphasis following for from general getc graduation grid i
id identification ii iii igetc in local major majors minimum maximum noncredit numbering of option options or plan
program programs proficiency recommended requirement requirements required science select sequence skills
specialization study system t the to total transfer uc unit units with achievement additional list page section
req reqs semester year first second third fourth fall spring summer pattern california ge breadth group
outcomes learning career careers information descriptions chapter support field time listing listings availability
per guide credit non after acceptance into active agreements exam is are be at on by this these other
code codes state academic number control
""".split())


def content_words(text: str | None) -> list[str]:
    """The heading's words that could name a program: no generic word, no number or code ("W003304C")."""
    return [w for w in re.findall(r"[a-z0-9]+", (text or "").lower())
            if w not in GENERIC and not re.search(r"\d", w) and len(w) > 1]


VOWELS = set("aeiou")


def _abbreviates(t: str, words_h: list[str], capitals: set[str]) -> bool:
    """A COCI title token that abbreviates the heading's words (S645 review of #3201, finding 18:
    Santa Rosa clips its COCI titles): a capitalized token of two to four letters that is the initials
    of consecutive heading words ("CS Cybersecurity": CS for Computer Studies), a clipped token whose
    letters run in order through the heading ("Mchtroncs:IndustrlMntnncTchncn" for Mechatronics:
    Industrial Maintenance Technician), or a compound of five letters or more holding a heading word
    of five or more ("cybersecurity" and "security")."""
    if t in capitals and any("".join(w[0] for w in words_h[i:i + len(t)]) == t for i in range(len(words_h))):
        return True
    if len(t) >= 6 and sum(ch in VOWELS for ch in t) <= 0.25 * len(t):
        it = iter("".join(words_h))
        if all(ch in it for ch in t):
            return True
    return len(t) >= 5 and any(len(w) >= 5 and (w in t or t in w) for w in words_h)


def names_other_title(heading: str | None, title: str | None) -> bool:
    """The heading names a program, and none of its naming words is the COCI title's: no title word,
    no shared stem of four letters or more, not the title's initials ("CIS" for Computer Information
    Systems), not a word in the title's parentheses, and no title token that abbreviates the
    heading's words (_abbreviates: Santa Rosa's clipped COCI titles)."""
    # A title of generic words alone ("IGETC", "CSU General Education Breadth") names no program to cross.
    tokens = [t for t in P.title_tokens(title or "") if t not in GENERIC]
    words_h = content_words(heading)
    if not tokens or not words_h:
        return False
    initials = "".join(t[0] for t in tokens)
    every_word = [w for w in re.findall(r"[a-z0-9]+", (heading or "").lower()) if not re.search(r"\d", w)]
    capitals = {w.lower() for w in re.findall(r"(?<![A-Za-z])[A-Z]{2,4}(?![A-Za-z])", title or "")}
    if any(_abbreviates(t, every_word, capitals) for t in tokens):
        return False
    for w in words_h:
        if w in tokens or w == initials:
            return False
        if any(len(w) >= 4 and len(t) >= 4 and (w[:5] == t[:5] or w.startswith(t) or t.startswith(w))
               for t in tokens):
            return False
    return True


def agreement(record: dict | None, title: str | None, award: str | None, cn: str | None) -> dict:
    """One record's verdict against the program it is filed under: agree, disagree or cannot_tell,
    with the reason (number, award, title, award_and_title; heading_absent, no_heading, award_unstated,
    generic_heading). A heading printing another program's control number disagrees ("Control Number:
    21666" on Santiago Canyon's 13230); one printing the program's own proves nothing (heading_award_check)."""
    chk = S.heading_award_check(record, award, cn, title)
    heading = chk["heading"]
    share = title_share(heading, title) if heading else None
    out = {"heading": heading, "filed_type": chk["filed"], "heading_types": chk.get("names") or [],
           "award_status": chk["status"], "title_share": share}
    if not heading:
        return dict(out, verdict="cannot_tell", reason="no_heading")
    if chk["status"] == "heading_absent":
        return dict(out, verdict="cannot_tell", reason="heading_absent")
    printed = {norm_cn(m.group("num")) for m in CN_LABEL.finditer(heading)}
    if printed and norm_cn(cn) not in printed:
        return dict(out, verdict="disagree", reason="number", kind=chk.get("kind"), heading_names_a_program=True)
    if chk["status"] == "names_award_not_program":
        # Pasadena's class: a heading naming an award and no word of the program's title ("Requirements
        # for the Certificate of Achievement" on the A.S. read from one "-as-cert-achievement/" page).
        return dict(out, verdict="cannot_tell", reason="award_not_program", kind=chk.get("kind"))
    title_off = names_other_title(heading, title)
    award_off = chk["status"] == "names_other_award"
    named = bool(content_words(heading))
    if award_off or title_off:
        return dict(out, verdict="disagree", kind=chk.get("kind"), heading_names_a_program=named,
                    reason="award_and_title" if award_off and title_off else "award" if award_off else "title")
    if chk["status"] == "agrees":
        return dict(out, verdict="agree", reason="award" if named else "award_only")
    return dict(out, verdict="cannot_tell", reason="award_unstated" if named else "generic_heading")


# The files the committed tree holds under the college folder (git ls-files), set by build(): a file
# the tree does not hold (a capture in progress, a stray copy) is never read, so the snapshot and its
# --check describe the commit alone. None reads the folder as it is (a --root or --extra outside git).
TRACKED: set[str] | None = None


def tracked_files(root: str) -> set[str] | None:
    """The absolute paths git tracks under root, or None when root is outside a git tree."""
    import subprocess
    try:
        top = subprocess.run(["git", "-C", root, "rev-parse", "--show-toplevel"], capture_output=True, text=True,
                             check=True).stdout.strip()
        out = subprocess.run(["git", "-C", top, "ls-files", "-z", "--", os.path.relpath(root, top)],
                             capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    return {os.path.join(top, p) for p in out.split("\0") if p}


def _readable(path: str) -> bool:
    return TRACKED is None or os.path.abspath(path) in TRACKED


def _load(path: str):
    if not _readable(path):
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def capture_of(cdir: str) -> dict:
    for name in ("capture.json", "capture_preview.json"):
        c = _load(os.path.join(cdir, name))
        if isinstance(c, dict):
            return c
    return {}


def programs_of(cdir: str) -> dict[str, dict]:
    """The capture's program list: control number -> title, award, method (sources.json)."""
    out = {}
    for s in _load(os.path.join(cdir, "sources.json")) or []:
        if isinstance(s, dict) and s.get("control_number"):
            out[str(s["control_number"])] = {"title": s.get("title"), "award": s.get("award"),
                                             "method": s.get("method")}
    return out


# A description, never a heading: East LA's "(Academic Plan E045491D) This is a program certificate
# that serves as a continuation for Animation Level I" names another program's title in its prose.
PROSE_OPENING = re.compile(r"^\W*(?:This|These|The|Students|Upon|Completion|In|An?|Our|Successful)\b")


def print_position(pick: dict, programs: dict[str, dict]) -> str | None:
    """Where a pick's window prints its own control number relative to the program it names, from the
    window's opening (whitespace collapsed by the capture): at_heading (the title on the number's own
    stretch before it), before (the program's title follows), after (another program's heading follows:
    another program's title and award, or the program's own title with an award type that is not its
    own), under_heading (the program's description follows: the number closes its heading, the title on
    the line above), unclear; None when the opening prints no own number."""
    opens = re.sub(r"^\[page \d+\]\s*", "", pick.get("opens") or "")
    own = norm_cn(pick.get("control_number"))
    prog = programs.get(str(pick.get("control_number"))) or {}
    for m in CN_LABEL.finditer(opens):
        if norm_cn(m.group("num")) != own:
            continue
        if title_share(opens[max(0, m.start() - 120):m.start()], prog.get("title")) == 1.0:
            return "at_heading"
        follow = opens[m.end():].lstrip(" )]:;,.")
        if PROSE_OPENING.match(follow):
            # The program's description follows the number: the number closes the program's heading.
            return "under_heading"

        # The reader's own test of a heading after a number line (one copy: pdf_text_names).
        self_named = C.pdf_text_names(follow, prog)
        crossed = not self_named and C.pdf_text_names(follow, dict(prog, award=None))
        other = crossed or any(norm_cn(cn) != own and C.pdf_text_names(follow, p, strict=True)
                               for cn, p in programs.items())
        if self_named and not other:
            return "before"
        if other and not self_named:
            return "after"
        return "unclear"
    return None


def control_number_print(cap: dict, programs: dict[str, dict], cdir: str) -> dict:
    """The control-number lines the committed capture text shows, by label, and where they print."""
    pdf = cap.get("pdf") or {}
    picks = pdf.get("picks") or []
    labels = collections.Counter()
    positions = collections.Counter()
    other_number = 0
    examples = {}
    for pk in picks:
        opens = pk.get("opens") or ""
        for m in CN_LABEL.finditer(opens):
            labels[re.sub(r"\s+", " ", m.group("label")).title()] += 1
            if norm_cn(m.group("num")) != norm_cn(pk.get("control_number")):
                other_number += 1
        pos = print_position(pk, programs)
        if pos:
            positions[pos] += 1
            examples.setdefault(pos, {"control_number": pk.get("control_number"), "opens": opens[:200]})
    first_lines = 0
    for s in _load(os.path.join(cdir, "sources.json")) or []:
        h1 = ((s or {}).get("source") or {}).get("h1") or ""
        if CN_LABEL.search(h1):
            first_lines += 1
    sample = sum(len(CN_LABEL.findall(t)) for t in pdf.get("sample") or [] if isinstance(t, str))
    verdict = None
    if positions:
        top, n = positions.most_common(1)[0]
        verdict = top if n >= 0.5 * sum(positions.values()) else "mixed"
    return {"picks": len(picks), "cn_printed_picks": sum(1 for p in picks if p.get("cn_printed")),
            "labels_in_openings": dict(labels), "positions": dict(positions), "prints": verdict,
            "openings_naming_another_number": other_number, "windows_opening_on_a_number_line": first_lines,
            "labels_in_text_sample": sample, "examples": examples,
            "unproven": len(pdf.get("unproven") or []),
            "captured_text": "pick openings" if picks else "first lines only" if first_lines else "none"}


def college_rows(cdir: str) -> list[dict]:
    """One row a record: the heading verdict, and for a PDF pick the window's print position (a window
    that opens on its own number line and then names another program is `after`: bound to the wrong one)."""
    programs = programs_of(cdir)
    picks = {str(p.get("control_number")): p for p in (capture_of(cdir).get("pdf") or {}).get("picks") or []}
    rows = []
    rdir = os.path.join(cdir, "records")
    if not os.path.isdir(rdir):
        return rows
    for name in sorted(os.listdir(rdir)):
        if not name.endswith(".json"):
            continue
        r = _load(os.path.join(rdir, name))
        if not isinstance(r, dict):
            continue
        cn = str(r.get("control_number") or name[:-5])
        prog = programs.get(cn) or {}
        title = prog.get("title") if prog.get("title") is not None else r.get("title")
        award = prog.get("award") if prog.get("award") is not None else r.get("award")
        a = agreement(r.get("record"), title, award, cn)
        sc = r.get("score")
        rows.append(dict(a, control_number=cn, title=title, award=award,
                         method=prog.get("method") or ("pdf_pages" if "#page=" in (r.get("source_url") or "")
                                                       else None),
                         passes_live=S.passes_live(sc), score_pass=bool((sc or {}).get("pass")),
                         places_none=S.places_none(sc),
                         window=print_position(picks[cn], programs) if cn in picks else None,
                         check_fails=a["award_status"] == "names_other_award"))
    return rows


def summarize(slug: str, cdir: str, read_from: str) -> dict:
    rows = college_rows(cdir)
    cap = capture_of(cdir)
    programs = programs_of(cdir)
    v = collections.Counter(r["verdict"] for r in rows)
    pdf_rows = [r for r in rows if r["method"] == "pdf_pages"]
    dis = [r for r in rows if r["verdict"] == "disagree"]
    pdf_dis = [r for r in pdf_rows if r["verdict"] == "disagree"]
    fails = [r for r in rows if r["check_fails"] and r["passes_live"]]
    after = [r for r in rows if r["window"] == "after"]
    suspect = [r for r in rows if r["verdict"] == "disagree" or r["window"] == "after"]
    out = {"slug": slug, "college": cap.get("college") or slug, "read_from": read_from,
           "platform": cap.get("platform"), "records": len(rows), "pdf_records": len(pdf_rows),
           "agree": v["agree"], "disagree": v["disagree"], "cannot_tell": v["cannot_tell"],
           "heading_absent": sum(1 for r in rows if r.get("reason") == "heading_absent"),
           "disagree_passing": sum(1 for r in dis if r["passes_live"]),
           "disagree_loaded": sum(1 for r in dis if not r["places_none"]),
           "pdf_disagree": len(pdf_dis), "pdf_disagree_passing": sum(1 for r in pdf_dis if r["passes_live"]),
           "pdf_suspect": sum(1 for r in pdf_rows if r["verdict"] == "disagree" or r["window"] == "after"),
           "pdf_suspect_passing": sum(1 for r in pdf_rows if (r["verdict"] == "disagree" or r["window"] == "after")
                                      and r["passes_live"]),
           "pdf_agree": sum(1 for r in pdf_rows if r["verdict"] == "agree"),
           "pdf_cannot_tell": sum(1 for r in pdf_rows if r["verdict"] == "cannot_tell"),
           "by_reason": dict(collections.Counter(r["reason"] for r in dis)),
           "check_would_fail_passing": len(fails),
           "check_would_fail_passing_transfer_local": sum(1 for r in fails if r.get("kind") in TRANSFER_LOCAL),
           "check_kinds_passing": dict(collections.Counter(r.get("kind") for r in fails)),
           "check_would_fail_passing_generic_heading": sum(1 for r in fails if not r.get("heading_names_a_program")),
           "award_not_program": sum(1 for r in rows if r.get("reason") == "award_not_program"),
           "award_not_program_passing": sum(1 for r in rows if r.get("reason") == "award_not_program"
                                            and r["passes_live"]),
           "window_after": len(after), "window_after_passing": sum(1 for r in after if r["passes_live"]),
           "suspect": len(suspect), "suspect_passing": sum(1 for r in suspect if r["passes_live"]),
           "suspect_loaded": sum(1 for r in suspect if not r["places_none"]),
           "disagreements": [{k: r.get(k) for k in ROW_KEYS} for r in suspect]}
    if pdf_rows:
        out["control_number_print"] = control_number_print(cap, programs, cdir)
    return out


TRANSFER_LOCAL = ("transfer_under_local_degree", "local_degree_under_transfer")
ROW_KEYS = ("control_number", "title", "award", "heading", "verdict", "reason", "kind", "heading_names_a_program",
            "title_share", "window", "passes_live", "places_none", "method")


def college_dirs(root: str, extra: list[str]) -> list[tuple[str, str, str]]:
    """(slug, folder, read_from) for each college: the root's folders that hold a records/ folder the
    tree tracks, then each --extra PATH:LABEL, which replaces the root's folder of the same name (an ad
    hoc measure only: the committed snapshot and its --check read the tree alone)."""
    out = {}
    if os.path.isdir(root):
        for d in sorted(os.listdir(root)):
            rdir = os.path.join(root, d, "records")
            if os.path.isdir(rdir) and (TRACKED is None or any(_readable(os.path.join(rdir, n))
                                                               for n in os.listdir(rdir))):
                out[d] = (d, os.path.join(root, d), "main")
    for e in extra:
        path, _, label = e.partition(":")
        slug = os.path.basename(os.path.normpath(path))
        out[slug] = (slug, path, label or path)
    return [out[k] for k in sorted(out)]


TOTAL_KEYS = ("records", "agree", "disagree", "cannot_tell", "heading_absent", "disagree_passing",
              "disagree_loaded", "check_would_fail_passing", "check_would_fail_passing_transfer_local",
              "window_after", "window_after_passing", "suspect", "suspect_passing",
              "check_would_fail_passing_generic_heading", "award_not_program", "award_not_program_passing")


def build(root: str = COLLEGE_DIR, extra: list[str] | None = None, tracked: bool = True) -> dict:
    """The report. tracked (the default, and always for the committed snapshot): only the files git
    tracks under root are read (tracked_files); an --extra folder is read as it is."""
    global TRACKED
    TRACKED = tracked_files(root) if tracked else None
    if TRACKED is not None:
        for e in extra or []:
            path = os.path.abspath(e.partition(":")[0])
            for dirpath, _, names in os.walk(path):
                TRACKED.update(os.path.join(dirpath, n) for n in names)
    try:
        colleges = [summarize(slug, path, read_from) for slug, path, read_from in college_dirs(root, extra or [])]
        as_of = max((str(capture_of(path).get("started") or "")[:10]
                     for _, path, _ in college_dirs(root, extra or [])), default="")
    finally:
        TRACKED = None
    pdf = [c for c in colleges if c["pdf_records"]]
    tot = collections.Counter()
    for c in colleges:
        for k in TOTAL_KEYS:
            tot[k] += c[k]
    return {
        "_readme": ("Written by kb/_program_requirements_heading_agreement.py from the files this tree commits "
                    "(git ls-files), a dated snapshot: as_of is the newest capture it reads. Kept current by "
                    "--check (scripts/check_generated.sh, CI). Each record's own heading "
                    "(program.section_heading) against the program it is filed under (sources.json: COCI "
                    "title and award). check_would_fail_passing counts the records that pass on the committed "
                    "files (passes_live) whose heading names another award type (heading_award_check, in no "
                    "pass rule). award_not_program counts headings that name an award and none of the "
                    "program's title words, set aside (Pasadena's one page for an A.S. and its certificate)."),
        "as_of": as_of,
        "read_from": sorted({c["read_from"] for c in colleges}),
        "totals": dict(tot),
        # Ranked by suspect records: a heading that disagrees, or a window bound to the next program.
        "pdf_ranked_by_disagree": [c["slug"] for c in sorted(pdf, key=lambda c: (-c["pdf_suspect"], c["slug"]))],
        "pdf_ranked_by_disagree_passing": [c["slug"] for c in sorted(
            pdf, key=lambda c: (-c["pdf_suspect_passing"], -c["pdf_suspect"], c["slug"]))],
        "colleges": colleges,
    }


def markdown(rep: dict) -> str:
    t = rep["totals"]
    by = {c["slug"]: c for c in rep["colleges"]}
    extra = [r for r in rep.get("read_from") or [] if r != "main"]
    lines = ["# Harvest heading agreement", "",
             "A dated snapshot, as of %s (the newest capture it reads), written by "
             "`kb/_program_requirements_heading_agreement.py` from the files this tree commits%s, and kept "
             "current by its `--check`. Each record's own heading against the program it is filed under (COCI "
             "title and award)." % (rep.get("as_of") or "no capture",
                                    "" if not extra else " plus folders read from %s" % ", ".join(extra)), "",
             "All colleges: %d records, %d agree, %d disagree (%d of them pass on the committed files), %d cannot "
             "tell (%d say the heading is not in their text; %d name an award and none of the program's title "
             "words, %d of them passing, set aside)."
             % (t["records"], t["agree"], t["disagree"], t["disagree_passing"], t["cannot_tell"],
                t["heading_absent"], t["award_not_program"], t["award_not_program_passing"]),
             "", "The heading check (a heading that names another award type and some of the program's title) "
             "would fail %d records that pass on the committed files (passes_live), %d of them a transfer degree "
             "and a local degree crossed. It is in no pass rule."
             % (t["check_would_fail_passing"], t["check_would_fail_passing_transfer_local"]), "",
             "A window bound to the next program (`after`) opens on the program's own control-number line and "
             "then names another program's title and award: the catalog prints the number after its program, "
             "and the reader cut the page from it. Seen only where the capture kept each pick's opening.", "",
             "## Colleges read from a PDF, by suspect records", "",
             "A suspect record has a heading that disagrees with its program, or was read from a window bound to "
             "the next program. Counts are of the college's PDF records.", "",
             "| College | Read from | PDF records | Agree | Disagree | Disagree, passing | Cannot tell "
             "| Window bound to the next program (passing) | Suspect (passing) | Control-number lines in openings "
             "| Prints |",
             "|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|"]
    for slug in rep["pdf_ranked_by_disagree"]:
        c = by[slug]
        cp = c.get("control_number_print") or {}
        labels = ", ".join("%s %d" % kv for kv in sorted((cp.get("labels_in_openings") or {}).items())) or "none seen"
        prints = cp.get("prints") or ("no openings kept" if not cp.get("picks") else "no number line")
        lines.append("| %s | %s | %d | %d | %d | %d | %d | %d (%d) | %d (%d) | %s | %s |" % (
            c["college"], c["read_from"], c["pdf_records"], c["pdf_agree"], c["pdf_disagree"],
            c["pdf_disagree_passing"], c["pdf_cannot_tell"], c["window_after"], c["window_after_passing"],
            c["pdf_suspect"], c["pdf_suspect_passing"], labels, prints))
    lines += ["", "## What the heading check would fail, among records that pass on the committed files", "",
              "| College | Would fail | Transfer and local crossed | Set aside: award, no title word (passing) |",
              "|---|---:|---:|---:|"]
    for c in sorted(rep["colleges"], key=lambda c: (-c["check_would_fail_passing"], c["slug"])):
        if c["check_would_fail_passing"] or c["award_not_program_passing"]:
            lines.append("| %s | %d | %d | %d |" % (c["college"], c["check_would_fail_passing"],
                                                   c["check_would_fail_passing_transfer_local"],
                                                   c["award_not_program_passing"]))
    return "\n".join(lines) + "\n"


def rendered(rep: dict) -> tuple[str, str]:
    """The two files' text, as written."""
    return json.dumps(rep, indent=1, sort_keys=False) + "\n", markdown(rep)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=COLLEGE_DIR)
    ap.add_argument("--extra", action="append", default=[],
                    help="PATH:LABEL, a college folder read from elsewhere (a branch), replacing main's: an ad hoc "
                         "measure, printed with --college or written to --out-json/--out-md elsewhere; the "
                         "committed snapshot never carries one")
    ap.add_argument("--out-json", default=OUT_JSON)
    ap.add_argument("--out-md", default=OUT_MD)
    ap.add_argument("--college", help="print one college's disagreements and write nothing")
    ap.add_argument("--check", action="store_true",
                    help="exit 1 when the committed snapshot differs from what the tree's files give")
    a = ap.parse_args(argv)
    if a.extra and not a.college and (os.path.abspath(a.out_json) == OUT_JSON or os.path.abspath(a.out_md) == OUT_MD
                                      or a.check):
        print("--extra reads a folder off this tree: print it with --college, or write it outside kb/status/")
        return 2
    rep = build(a.root, a.extra)
    if a.college:
        c = next((c for c in rep["colleges"] if c["slug"] == a.college), None)
        print(json.dumps(c, indent=1))
        return 0 if c else 1
    js, md = rendered(rep)
    if a.check:
        stale = []
        for path, want in ((a.out_json, js), (a.out_md, md)):
            try:
                with open(path) as f:
                    if f.read() != want:
                        stale.append(os.path.relpath(path, os.path.dirname(HERE)))
            except OSError:
                stale.append(os.path.relpath(path, os.path.dirname(HERE)))
        if stale:
            print("STALE: %s; run python3 kb/_program_requirements_heading_agreement.py and commit both"
                  % ", ".join(stale))
            return 1
        print("heading agreement snapshot is up to date")
        return 0
    with open(a.out_json, "w") as f:
        f.write(js)
    with open(a.out_md, "w") as f:
        f.write(md)
    t = rep["totals"]
    print("%d records: %d agree, %d disagree (%d passing), %d cannot tell; the check would fail %d passing"
          % (t["records"], t["agree"], t["disagree"], t["disagree_passing"], t["cannot_tell"],
             t["check_would_fail_passing"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
