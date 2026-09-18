#!/usr/bin/env python3
"""prototype/skyview.html is BUILT — it must match what its sources produce.

⚠️ THE FAILURE THIS GUARDS, AND IT ALREADY SHIPPED ONCE (2026-09-18, PR #1618).
`prototype/skyview.html` is the served page, so it is the natural file to open,
read and edit — and it is 1.1 MB of assembled output. A session edited it
directly, verified the change in a real browser, tested it, reviewed it, merged
it, and deployed it. Everything about that looked right. The change was still
doomed: `prototype/build_ccr_atlas.py` assembles the page from
`prototype/ccr_atlas_v1.html` (the template, which owns the CSS) and
`prototype/ccr_universe.js` (which owns the markup and every behavior), and
`.github/workflows/daily-dashboard.yml` step 4d2 runs that build whenever the
unified-courses artifacts move. The next daily run would have quietly reverted
a merged, deployed feature, and nothing anywhere would have said so.

This is Rule 1's "change the generator, not the HTML" for a second generator.
Rule 1 names `excel_to_dashboard.py` and the dashboard; nothing named this one,
and the SkyView invariants' line about it ("the served page inlines
ccr_universe.js, so a JS change needs prototype/build_ccr_atlas.py") reads as
build advice rather than as a warning that the artifact is not editable.

So the check is mechanical: re-run the build's substitutions in memory and
compare. A session that edits the artifact fails here, in CI, with the name of
the file it should have edited instead — before a reviewer has to know this.

Read-only: it never writes either file. Run from the repo root:
    python3 tests/skyview_built_from_source_test.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROTO = os.path.join(ROOT, "prototype")

TEMPLATE = os.path.join(PROTO, "ccr_atlas_v1.html")
SERVED = os.path.join(PROTO, "skyview.html")

# The served page fetches the big payloads rather than inlining them, which is
# what makes it committable at all. build_ccr_atlas.py writes it by substituting
# the same placeholders with either the file's text or a fetch stub, so the set
# below has to track that function — hence the placeholder check further down,
# which fails loudly if the build grows a placeholder this file does not know.
INLINED = {
    "__GRAPHJS__": "ccr_atlas_graph.js",
    "__ESLJS__": "ccr_atlas_esl.js",
    "__UNIVJS__": "ccr_universe.js",
}
JSON_INLINED = {
    "__ESLDATA__": "ccr_atlas_esl.json",
    "__DATA__": "ccr_atlas_data.json",
}

failures = []
ran = []


def check(name, cond, detail=""):
    ran.append(name)
    if cond:
        print("PASS  " + name)
    else:
        print("FAIL  " + name + ("  — " + detail if detail else ""))
        failures.append(name)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def main():
    for path in (TEMPLATE, SERVED):
        if not os.path.exists(path):
            check("the build's inputs and output are both committed", False, path + " is missing")
            return finish()

    tpl = read(TEMPLATE)
    served = read(SERVED)

    # The build refuses to write a page when a placeholder has gone missing; this
    # file has to know the same set, or it would silently stop comparing a part.
    known = set(INLINED) | set(JSON_INLINED) | {"__UNIVDATA__", "__UNIVMEM__"}
    missing = [k for k in known if k not in tpl]
    check("the template still carries every placeholder the build substitutes",
          not missing, "template has lost " + ", ".join(missing) if missing else "")

    # ── the substitutions the served page really made ────────────────────────
    # Only the parts this file can reproduce exactly: the template's own text
    # (its CSS and its shell) and the three inlined scripts. The two big JSON
    # payloads are fetched by the served page, so they are not compared here.
    for token, fname in sorted(INLINED.items()):
        src = read(os.path.join(PROTO, fname))
        check("%s: every line of %s reached the served page" % (token, fname),
              src.strip() == "" or src[:400] in served,
              "the served page does not contain the opening of " + fname +
              " — rebuild with `python3 prototype/build_ccr_atlas.py`")

    # ⭐ The comparison that actually catches a hand-edit. Both files are large,
    # so the check walks the JS source in chunks and names the FIRST one that is
    # absent: a session that edited the artifact sees the region of
    # ccr_universe.js their change belongs in, rather than a diff of 1.1 MB.
    ujs = read(os.path.join(PROTO, "ccr_universe.js"))
    CHUNK = 2000
    first_missing = None
    for i in range(0, len(ujs), CHUNK):
        piece = ujs[i:i + CHUNK]
        if piece and piece not in served:
            first_missing = (i, piece)
            break
    if first_missing:
        at, piece = first_missing
        line = ujs[:at].count("\n") + 1
        detail = ("prototype/ccr_universe.js line ~%d is not in prototype/skyview.html. "
                  "The served page is BUILT: edit ccr_universe.js (behavior and markup) or "
                  "ccr_atlas_v1.html (CSS), then run `python3 prototype/build_ccr_atlas.py`. "
                  "First divergence: %s" % (line, piece[:90].replace("\n", " ")))
    else:
        detail = ""
    check("prototype/skyview.html contains prototype/ccr_universe.js verbatim",
          first_missing is None, detail)

    # The template's CSS travels the same way, and it is where a hand-edited
    # style rule would land.
    head = tpl.split("__DATA__")[0]
    style_start = head.find("<style")
    style_end = head.find("</style>", style_start)
    if style_start >= 0 and style_end > style_start:
        css = head[style_start:style_end]
        missing_css = None
        for i in range(0, len(css), CHUNK):
            piece = css[i:i + CHUNK]
            if piece and piece not in served:
                missing_css = (i, piece)
                break
        if missing_css:
            at, piece = missing_css
            line = tpl[:style_start + at].count("\n") + 1
            d = ("prototype/ccr_atlas_v1.html line ~%d is not in prototype/skyview.html. "
                 "Edit the template, then rebuild. First divergence: %s"
                 % (line, piece[:90].replace("\n", " ")))
        else:
            d = ""
        check("prototype/skyview.html contains the template's stylesheet verbatim",
              missing_css is None, d)
    else:
        check("the template has a stylesheet to compare", False, "no <style> block found")

    # A JSON payload that fails to parse breaks the build rather than the page,
    # so it is worth naming here too — the build already exits on it.
    for token, fname in sorted(JSON_INLINED.items()):
        path = os.path.join(PROTO, fname)
        try:
            json.loads(read(path))
            ok, why = True, ""
        except Exception as exc:  # noqa: BLE001 - the message is the point
            ok, why = False, str(exc)[:120]
        check("%s parses as JSON" % fname, ok, why)

    return finish()


def finish():
    print("\n%d checks, %d failed" % (len(ran), len(failures)))
    if failures:
        print("\nprototype/skyview.html is generated. Edit its SOURCES:")
        print("  prototype/ccr_universe.js    — behavior, markup, the state export")
        print("  prototype/ccr_atlas_v1.html  — the stylesheet and the page shell")
        print("then run: python3 prototype/build_ccr_atlas.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
