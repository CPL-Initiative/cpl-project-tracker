#!/usr/bin/env python3
"""Find every glyph in COBI's RENDERED text, classify it, and remediate the safe ones.

Sam, 2026-09-09: "it would be good to remove all emoji glyphs and if any are
crucial replace with a muted glyph using white and CO blue as default. If color
is needed to clarify, keep it muted and aligned with the CO palette."

That is the presentation rule this repo already carries, applied at last to the
whole surface rather than to whatever a session happened to be editing:

    PLAIN WORDS, NOT GLYPHS. The default is no glyph. The burden of proof is on
    the mark, never on removing it: if you cannot say what a reader would
    misunderstand without it, delete it. Every control is a WORD.
    A glyph that earns its place is ghosted, not decorated: muted CO blue.

⚠️ WHAT MAKES THIS TOOL USEFUL IS WHAT IT DOES NOT REPORT. This repo writes ⚠️
and ⭐ deliberately and heavily in CODE COMMENTS — that is house style for
marking a hazard a future session must not walk into, and it renders to nobody.
Reporting those buries the 841 that DO render under 1,100 that do not. So a
comment line is never a finding, and the whole design rests on telling the two
apart.

⚠️ AND IT NEVER BLIND-STRIPS. Three classes, and only one is mechanical:
  * control  — a glyph inside a button/link/summary label. The rule is strictest
               here (every control is a word) and the fix is usually just to
               delete the mark and its space. SAFE to apply.
  * status   — a glyph in a message, hint or dialog string. Removing it often
               needs the sentence reworded ("❌ " -> "Error: "), so it is
               REPORTED, never rewritten.
  * decoration — everything else, including marks that may be load-bearing in a
               table or legend. REPORTED.

Reads : CPL_Dashboard.html, index.html, root-level *.js, fact-sheet/*.js,
        sierra/*.js, prototype/ccr_universe.js
Writes: kb/glyph_sweep/<date>.md and .json  (READ-ONLY unless --apply)

Run:
    python3 kb/_glyph_sweep.py              # report
    python3 kb/_glyph_sweep.py --apply      # + rewrite the SAFE control class
    python3 kb/_glyph_sweep.py --check      # exit 1 if any control-class glyph remains
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
from collections import Counter
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, "kb", "glyph_sweep")

# Pictographs, dingbats, arrows and the technical block, plus the variation
# selector and keycap combiner that ride with them. Deliberately NOT \w symbols
# like × or · which are typography, not glyphs.
EMOJI = re.compile(
    "(?:[\U0001F300-\U0001FAFF←-⇿⌀-⏿☀-➿⬀-⯿]"
    "[️⃣]?)"
)
# The generator writes some as HTML entities; both forms are the same glyph to a
# reader, and only one of them greps.
ENTITY = re.compile(r"&#(1[0-9]{5}|2[0-9]{4}|x[0-9A-Fa-f]{4,5});")

# ⚠️ A JS UNICODE ESCAPE RENDERS AS AN EMOJI AND READS AS ASCII. "\\u{1F512}" is a
# padlock on screen and seven plain characters to a scanner, so the sweep saw none
# of the THIRTEEN lock references still telling readers to click a header button
# that had moved into the About pane — found 2026-09-09 by reading a CONTRAST
# finding, not a glyph one. Matched here and decoded, so the report names the mark
# a reader actually sees.
JS_ESCAPE = re.compile(r"\\u\{([0-9A-Fa-f]{4,6})\}|\\u(D[89AB][0-9A-Fa-f]{2})\\u(D[C-F][0-9A-Fa-f]{2})")


def _escaped_glyphs(line):
    """Emoji written as a JS escape — \\u{1F512} or a surrogate pair — decoded."""
    out = []
    for m in JS_ESCAPE.finditer(line):
        try:
            if m.group(1):
                ch = chr(int(m.group(1), 16))
            else:
                hi, lo = int(m.group(2), 16), int(m.group(3), 16)
                ch = chr(0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00))
        except (ValueError, OverflowError):
            continue
        if EMOJI.fullmatch(ch):
            out.append(ch)
    return out

CONTROL_HINT = re.compile(
    r"<button|<summary|<a\s|class=\"(?:btn|u-ico|mode|linkish|cobi-util|cpl-tab)"
    r"|\.textContent\s*=|\.title\s*=|label:"
    # ⚠️ BOTH FORMS OF EVERY LABEL ATTRIBUTE. `aria-label=` catches the markup
    # form; setAttribute("aria-label", …) writes the SAME label from JS and was
    # missed until tests/glyph_sweep_test.py asked for it by name. A classifier
    # that sees one form and not the other under-reports the strictest class.
    r"|(?:aria-label|title|placeholder|alt)\s*(?:=|\"\s*,|'\s*,)",
    re.I,
)
STATUS_HINT = re.compile(r"setHint|alert\(|confirm\(|\.message|status|toast|hint", re.I)


def is_comment(line: str) -> bool:
    t = line.lstrip()
    return t.startswith(("//", "/*", "*/", "*", "#"))


# A generated data payload is one enormous line of JSON — course titles, college
# names, curator notes — and any `title`/`label` key inside it trips CONTROL_HINT.
# tmc_college_courses.js and unified_courses_suggestions.js contributed 8 "control"
# findings that way: arrows inside course titles nobody types and nobody clicks.
# Rewriting them would corrupt the data; they are not a surface at all.
DATA_PAYLOAD = re.compile(r'^\s*(?:window|var|const|let)\s*[.\w\[\]"\']*\s*=\s*[\[{]"')


def is_data_payload(line: str) -> bool:
    return len(line) > 2000 and bool(DATA_PAYLOAD.match(line))


def classify(line: str) -> str:
    if is_data_payload(line):
        return "decoration"          # reported, never rewritten
    if CONTROL_HINT.search(line):
        return "control"
    if STATUS_HINT.search(line):
        return "status"
    return "decoration"


def targets():
    out = ["CPL_Dashboard.html", "index.html"]
    out += [os.path.basename(f) for f in sorted(glob.glob(os.path.join(ROOT, "*.js")))
            if not f.endswith(".min.js")]
    for sub in ("fact-sheet", "sierra"):
        out += [os.path.join(sub, os.path.basename(f))
                for f in sorted(glob.glob(os.path.join(ROOT, sub, "*.js")))]
    out.append(os.path.join("prototype", "ccr_universe.js"))
    return [p for p in out if os.path.exists(os.path.join(ROOT, p))]


def scan_file(rel):
    """Findings for one file, each marked with whether it is OURS to fix.

    ⚠️ A COUNT THAT MIXES THE TWO IS A COUNT NOBODY CAN ACT ON. `--apply`
    already refuses a site inside a section the dashboard generator rewrites
    (Rule 1), but the report counted it anyway — so after the generator was
    fixed on 2026-09-09 the control class read 401 when 348 of those were
    stale HTML the next cron clears and only 53 were anybody's work. The flag
    is what lets the report say which is which.
    """
    path = os.path.join(ROOT, rel)
    src = open(path, encoding="utf-8").read()
    spans = regenerated_spans(src) if rel.endswith(".html") else []
    findings = []
    pos = 0
    for n, line in enumerate(src.split("\n"), 1):
        start = pos
        pos += len(line) + 1
        if is_comment(line):
            continue                          # house style; renders to nobody
        hits = EMOJI.findall(line) + ["&#%s;" % m for m in ENTITY.findall(line)]
        hits += _escaped_glyphs(line)
        if not hits:
            continue
        kind = classify(line)
        owned = any(a <= start < b for a, b in spans)
        for g in hits:
            findings.append({"file": rel, "line": n, "glyph": g, "kind": kind,
                             "generator_owned": owned,
                             "context": line.strip()[:160]})
    return findings


# ── the one mechanical fix ───────────────────────────────────────────────────
# A glyph at the START of a label, followed by a single space, inside a quoted
# string. That is the "📎 See Attachments" shape — the mark adds nothing the word
# does not, and deleting it and its space leaves a correct label. Anything else
# (a glyph mid-sentence, a lone glyph that IS the label, a status message) needs
# a human sentence and is only reported.
LEAD = re.compile(
    r"(?P<q>[\"'>])(?P<g>(?:[\U0001F300-\U0001FAFF←-⇿⌀-⏿"
    r"☀-➿⬀-⯿][️⃣]?|&#(?:1[0-9]{5}|2[0-9]{4}|x[0-9A-Fa-f]{4,5});))"
    r"(?P<sp>(?:&nbsp;|\s)+)(?P<rest>[A-Za-z])"
)


# ── Rule 1: a hand-edit inside a regenerated section is overwritten ──────────
# `excel_to_dashboard.py` REPLACES entire sections of CPL_Dashboard.html on every
# daily run (Filter Bar, Activity KPIs, Projects Grid, KPI section, title/h1).
# Stripping a glyph there "works", passes every test, and is silently undone by
# the next cron. Measured 2026-09-09 on the first real run of this tool: of the
# 16 rewritable sites in CPL_Dashboard.html, THIRTEEN were generator-owned — so
# the naive tool would have reverted itself overnight and reported success.
#
# The test is exact rather than heuristic: a rewritable fragment that also
# appears in the generator's SOURCE is written by the generator. Whatever the
# generator emits, it emits from a literal in that file.
GENERATOR = "excel_to_dashboard.py"
_GEN_SRC = None

# ⚠️ REGIONS, NOT FRAGMENTS. The first version of this guard asked "does this
# glyph+label appear as a literal in the generator?" — which is true only until
# somebody fixes the generator, and then the SAME html line reads as unowned.
# Measured 2026-09-09: with the generator still carrying the marks, 13 of 16
# sites were held; after fixing the generator first, 2. A guard whose protection
# depends on the order you do things in is worse than none, because it reports
# "held back: 2" either way.
#
# So the test is POSITIONAL and order-independent: these are the section
# boundaries `excel_to_dashboard.py` replaces wholesale. Anything between a
# start and its end is generator territory whatever the generator says today.
# Each marker is asserted to still exist in the generator source, so a renamed
# boundary fails loudly instead of quietly protecting nothing.
REGENERATED = [
    ("<!-- ═══ MAP Articulation Analysis Section ═══ -->",
     "<!-- ═══ Dashboard Sections End ═══ -->"),
    ("<!-- ═══ CPL Analytics Section ═══ -->",
     "<!-- ═══ Dashboard Sections End ═══ -->"),
    ("<!-- ═══ Workplan Activity Metrics Section ═══ -->",
     "<!-- Filter Bar -->"),
    ('<div class="activity-kpi-section" id="activityKpiSection">',
     "<!-- Projects Grid -->"),
    ("<!-- Projects Grid -->", "<!-- End Projects Grid -->"),
]


def generator_source():
    global _GEN_SRC
    if _GEN_SRC is None:
        p = os.path.join(ROOT, GENERATOR)
        _GEN_SRC = open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    return _GEN_SRC


def regenerated_spans(src):
    """Character ranges of `src` that the dashboard generator replaces."""
    spans = []
    for start, end in REGENERATED:
        at = 0
        while True:
            i = src.find(start, at)
            if i == -1:
                break
            j = src.find(end, i + len(start))
            spans.append((i, j if j != -1 else len(src)))
            at = i + len(start)
    return spans


def generator_owned(pos, spans, match=None):
    """True when this site is the dashboard generator's to change, not ours.

    ⚠️ TWO TESTS, AND THE UNION IS THE POINT — each covers the other's blind
    spot, so the guard fails SAFE rather than plausibly:

      * POSITION — inside a section the generator replaces wholesale. Order-
        independent, but only as complete as REGENERATED, and Rule 1 names six
        sections whose boundaries are not all marked in the HTML.
      * FRAGMENT — this exact glyph+label is a literal in the generator source.
        Catches what REGENERATED misses (the algo-details block is emitted by
        render_algo_details() and sits inside none of the marked regions), but
        stops recognizing a site the moment somebody fixes the generator.

    Measured 2026-09-09 on the original CPL_Dashboard.html: position alone held
    12 of 16, fragment alone 13, the union 13 — and only the union still holds
    13 after the generator is fixed.
    """
    if any(a <= pos < b for a, b in spans):
        return True
    if match is None:
        return False
    frag = match.group("g") + match.group("sp") + match.group("rest")
    return frag in generator_source()


def apply_safe(rel):
    path = os.path.join(ROOT, rel)
    src = open(path, encoding="utf-8").read()
    # Only the two dashboard HTMLs are generated; a .js file is a static asset
    # the generator never rewrites, so it has no protected regions.
    spans = regenerated_spans(src) if rel.endswith(".html") else []
    out, n, held, off = [], 0, [], 0
    for i, line in enumerate(src.splitlines(keepends=True), 1):
        if is_comment(line) or classify(line) != "control":
            out.append(line)
            off += len(line)
            continue

        # ⚠️ Count the REWRITES, not the matches — subn counts a held match too,
        # so a fully-held line would otherwise report as remediated.
        done = []

        def sub(m, _i=i, _off=off):
            if generator_owned(_off + m.start(), spans, m):
                held.append((_i, m.group("g")))
                return m.group(0)
            done.append(1)
            return m.group("q") + m.group("rest")

        new_line, _ = LEAD.subn(sub, line)
        n += len(done)
        out.append(new_line)
        off += len(line)
    if n:
        open(path, "w", encoding="utf-8").write("".join(out))
    return n, held


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="rewrite the safe control-class glyphs")
    ap.add_argument("--check", action="store_true", help="exit 1 if any control-class glyph remains")
    args = ap.parse_args()

    files = targets()
    if args.apply:
        total, all_held = 0, []
        for rel in files:
            k, held = apply_safe(rel)
            if k:
                print("  %-40s %d" % (rel, k))
                total += k
            if held:
                all_held.append((rel, held))
        print("\nremoved %d leading control glyphs" % total)
        if all_held:
            n = sum(len(h) for _, h in all_held)
            print("\nHELD BACK — %d generator-owned site(s) (Rule 1: fix %s,"
                  " not the HTML):" % (n, GENERATOR))
            for rel, held in all_held:
                print("  %-40s %d  lines %s" % (
                    rel, len(held), ", ".join(str(l) for l, _ in held[:8])
                    + (" …" if len(held) > 8 else "")))

    findings = []
    for rel in files:
        findings.extend(scan_file(rel))

    # Ours vs the generator's. Rule 1 makes the second set unfixable HERE, and
    # the next daily run clears it — so it is reported apart, never summed in.
    ours = [f for f in findings if not f.get("generator_owned")]
    gen  = [f for f in findings if f.get("generator_owned")]
    by_kind_ours = Counter(f["kind"] for f in ours)
    gen_ctrl = sum(1 for f in gen if f["kind"] == "control")
    by_kind = Counter(f["kind"] for f in findings)
    by_file = Counter(f["file"] for f in findings)
    by_glyph = Counter(f["glyph"] for f in findings)

    os.makedirs(OUTDIR, exist_ok=True)
    stamp = date.today().isoformat()
    with open(os.path.join(OUTDIR, stamp + ".json"), "w", encoding="utf-8") as fh:
        json.dump({"generated": stamp, "files_scanned": len(files),
                   "counts": dict(by_kind), "findings": findings}, fh, indent=1)

    lines = ["# Glyph sweep — %s" % stamp, "",
             "Rendered text only: a comment line is never a finding (this repo's",
             "⚠️/⭐ comment style renders to nobody and would bury the rest).", "",
             "| Class | Ours | Generator's | What the rule says |", "|---|---|---|---|",
             "| control | %d | %d | every control is a WORD — strictest, and the safe fix |"
             % (by_kind_ours["control"], gen_ctrl),
             "| status | %d | %d | needs the sentence reworded, so reported not rewritten |"
             % (by_kind_ours["status"], sum(1 for f in gen if f["kind"] == "status")),
             "| decoration | %d | %d | may be load-bearing in a table or legend — judgment |"
             % (by_kind_ours["decoration"], sum(1 for f in gen if f["kind"] == "decoration")),
             "",
             "**%d files scanned, %d findings — %d ours, %d the generator's.**"
             % (len(files), len(findings), len(ours), len(gen)),
             "",
             "⚠️ **The generator's column is NOT work.** Those sites sit inside a section",
             "`excel_to_dashboard.py` rewrites wholesale (Rule 1), so `--apply` refuses them",
             "and the next daily run clears them. Fix the generator, never the HTML.", "",
             "## Heaviest files", ""]
    for f, n in by_file.most_common(15):
        lines.append("- `%s` — %d" % (f, n))
    lines += ["", "## Most common glyphs", ""]
    for g, n in by_glyph.most_common(20):
        lines.append("- `%s` — %d" % (g, n))
    lines += ["", "## Control-class findings that are OURS (fix these first)", ""]
    ours_ctrl = [x for x in ours if x["kind"] == "control"]
    if not ours_ctrl:
        lines.append("_None — every remaining control-class glyph is the generator's._")
    # Grouped by file so one heavy file cannot eat the whole listing, which is
    # what the flat [:120] slice did: 120 slots, all of them one file.
    for fname in sorted({x["file"] for x in ours_ctrl}):
        rows = [x for x in ours_ctrl if x["file"] == fname]
        lines.append("")
        lines.append("**`%s`** — %d" % (fname, len(rows)))
        for f in rows[:40]:
            lines.append("- `%d` `%s` — %s" % (f["line"], f["glyph"], f["context"][:100]))
        if len(rows) > 40:
            lines.append("- _… %d more_" % (len(rows) - 40))
    md = os.path.join(OUTDIR, stamp + ".md")
    open(md, "w", encoding="utf-8").write("\n".join(lines) + "\n")

    print("glyph sweep — %d files, %d findings  (control %d · status %d · decoration %d)"
          % (len(files), len(findings), by_kind_ours["control"], by_kind_ours["status"],
             by_kind_ours["decoration"]))
    if gen:
        print("  + %d generator-owned (Rule 1 — the next daily run clears them; %d control)"
              % (len(gen), gen_ctrl))
    print("  -> %s" % os.path.relpath(md, ROOT))

    # The gate can only ever be about what a session can actually fix.
    if args.check and by_kind_ours["control"]:
        print("\nFAIL: %d control-class glyphs remain — every control is a word."
              % by_kind["control"])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
