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


def classify(line: str) -> str:
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
    path = os.path.join(ROOT, rel)
    findings = []
    with open(path, encoding="utf-8") as fh:
        for n, line in enumerate(fh, 1):
            if is_comment(line):
                continue                      # house style; renders to nobody
            hits = EMOJI.findall(line) + ["&#%s;" % m for m in ENTITY.findall(line)]
            if not hits:
                continue
            kind = classify(line)
            for g in hits:
                findings.append({"file": rel, "line": n, "glyph": g, "kind": kind,
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


def apply_safe(rel):
    path = os.path.join(ROOT, rel)
    src = open(path, encoding="utf-8").read()
    out, n = [], 0
    for line in src.splitlines(keepends=True):
        if is_comment(line) or classify(line) != "control":
            out.append(line)
            continue
        new, k = LEAD.subn(lambda m: m.group("q") + m.group("rest"), line)
        n += k
        out.append(new)
    if n:
        open(path, "w", encoding="utf-8").write("".join(out))
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="rewrite the safe control-class glyphs")
    ap.add_argument("--check", action="store_true", help="exit 1 if any control-class glyph remains")
    args = ap.parse_args()

    files = targets()
    if args.apply:
        total = 0
        for rel in files:
            k = apply_safe(rel)
            if k:
                print("  %-40s %d" % (rel, k))
                total += k
        print("\nremoved %d leading control glyphs" % total)

    findings = []
    for rel in files:
        findings.extend(scan_file(rel))

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
             "| Class | Count | What the rule says |", "|---|---|---|",
             "| control | %d | every control is a WORD — strictest, and the safe fix |" % by_kind["control"],
             "| status | %d | needs the sentence reworded, so reported not rewritten |" % by_kind["status"],
             "| decoration | %d | may be load-bearing in a table or legend — judgment |" % by_kind["decoration"],
             "", "**%d files scanned, %d findings.**" % (len(files), len(findings)), "",
             "## Heaviest files", ""]
    for f, n in by_file.most_common(15):
        lines.append("- `%s` — %d" % (f, n))
    lines += ["", "## Most common glyphs", ""]
    for g, n in by_glyph.most_common(20):
        lines.append("- `%s` — %d" % (g, n))
    lines += ["", "## Control-class findings (fix these first)", ""]
    for f in [x for x in findings if x["kind"] == "control"][:120]:
        lines.append("- `%s:%d` `%s` — %s" % (f["file"], f["line"], f["glyph"], f["context"][:100]))
    md = os.path.join(OUTDIR, stamp + ".md")
    open(md, "w", encoding="utf-8").write("\n".join(lines) + "\n")

    print("glyph sweep — %d files, %d findings  (control %d · status %d · decoration %d)"
          % (len(files), len(findings), by_kind["control"], by_kind["status"], by_kind["decoration"]))
    print("  -> %s" % os.path.relpath(md, ROOT))

    if args.check and by_kind["control"]:
        print("\nFAIL: %d control-class glyphs remain — every control is a word."
              % by_kind["control"])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
