#!/usr/bin/env python3
"""Put a public Library piece made as a Claude artifact on GitHub Pages.

Sam, 2026-10-24, on ELL IET CPL Starting Points opening at a claude.ai address: "the
url that shows for the public library visuals has a claude url. Any way we can use an
alias for all public surfaces--with cplinitiative?" On 2026-10-25 he picked "GitHub
Pages now": each public piece made as a Claude artifact gets a copy at
https://cpl-initiative.github.io/cpl-project-tracker/library/<slug>/, its Library
record links there, and the claude.ai page stays the editable original.

    python3 scripts/library_page.py SLUG SOURCE.html

SOURCE is the piece's page as the artifact publishes it: the vault keeps it beside the
work (cpl_library.rebuild_from names it), and `Artifact read` with path index.html
returns it. Either form works: the fragment the artifact holds (a <title>, its styles
and its body, no <html>) or a whole document. The script writes
library/<SLUG>/index.html: the page's own head lines (title, meta, font links) in a
real <head>, the rest unchanged in <body>, with the claude.ai frame's base rules the
page was drawn against and no color of their own, and a theme line that opens it
Light unless the reader picked Dark. It writes nothing else and fetches
nothing.

Sierra reads a page there (cpl-chat's libraryHosted), so what the piece says reaches
her answers. Test: tests/library_pages.test.js.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
# The claude.ai frame's base rules, less its colors and font: the page sets its own.
BASE = ("<style>:root{box-sizing:border-box}html{scroll-padding-top:env(safe-area-inset-top,0px)}"
        "body{margin:0;padding:0}img{max-width:100%}"
        "[hidden]:not([hidden=until-found i]){display:none!important}</style>")
# Light unless the reader picked Dark (Sam, Open Asks Sheet 126 card 2, 2026-10-24: the public pages open
# Light as the library does), set before the page's own styles paint. The page's device rules are written
# under :root:not([data-theme="light"]), so a set theme stands them down; its public header's Light and
# Dark words write the same cpl_theme choice.
THEME = ('<script>(function(){var t=null;try{t=localStorage.getItem("cpl_theme")}catch(e){}'
         'document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")})()</script>')
HEAD_LINE = re.compile(r"^\s*(<title>.*?</title>|<meta\b[^>]*>|<link\b[^>]*>)\s*$", re.I)


def body_of(src):
    """The page's fragment: a whole document is cut back to what its <body> holds,
    with the frame's own <head> left behind."""
    m = re.search(r"<body\b[^>]*>(.*)</body>", src, re.I | re.S)
    return (m.group(1) if m else src).strip("\n")


def build(slug, src):
    lines = body_of(src).split("\n")
    head = []
    while lines and (HEAD_LINE.match(lines[0]) or not lines[0].strip()):
        if lines[0].strip():
            head.append(lines[0].strip())
        lines.pop(0)
    if not any(h.lower().startswith("<title>") for h in head):
        raise SystemExit("library_page: the page opens with no <title>; a public page needs its name")
    return "\n".join([
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        THEME,
        *head,
        '<link rel="icon" href="../../cccco_seal.png">',
        f"<!-- The CPL Library's public copy of {slug}; the claude.ai artifact is the editable"
        " original. Rebuilt by scripts/library_page.py; edit the source, never this file. -->",
        BASE,
        "</head>",
        "<body>",
        *lines,
        "</body>",
        "</html>",
        "",
    ])


def main(argv):
    if len(argv) != 3:
        raise SystemExit(__doc__)
    slug, source = argv[1], Path(argv[2])
    if not SLUG.match(slug):
        raise SystemExit(f"library_page: {slug!r} is not a Library slug (lower case, digits and hyphens)")
    out = ROOT / "library" / slug / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(slug, source.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}: https://cpl-initiative.github.io/cpl-project-tracker/library/{slug}/")


if __name__ == "__main__":
    main(sys.argv)
