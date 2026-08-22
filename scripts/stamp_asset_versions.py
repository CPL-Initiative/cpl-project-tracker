#!/usr/bin/env python3
"""Stamp a content hash onto every local .js/.css URL in the site's HTML.

    python3 scripts/stamp_asset_versions.py _site

WHY THIS EXISTS
---------------
Sam, 2026-08-22: "Since we are constantly making changes to COBI views, I fear
users may be looking at stale screens." He asked whether a splash screen should
tell people to press Ctrl+Shift+R.

Measured before building: `index.html` carries **38 local <script> tags and not
one version query**, so a browser holding a cached `college_briefing.js` keeps
using it. This is not hypothetical — `docs/fact_sheet_lessons.md` already lists
"a cached `factsheet_edit.js`/`factsheet.css` (no version query on the tags)" as
a rule-out step for a genuinely confusing episode.

Versioned URLs fix that structurally: the URL changes, so the browser MUST fetch.
Nobody has to remember a keystroke — which matters because this repo's own rule
is that a habit depending on a new user remembering it fails on their first day.
And a hard refresh would not have fixed the whole class anyway: it does not clear
localStorage/sessionStorage, where COBI keeps the remembered college, the
audience pick, the session keeper and the nav overlay cache.

WHY A CONTENT HASH AND NOT A BUILD STAMP
----------------------------------------
A global `?v=<date>` busts all 38 files whenever any one of them changes. A
per-file hash busts only what actually changed, so the daily cron — which
usually rewrites one data file — leaves the other 37 caches intact.

WHY THIS RUNS AT DEPLOY AND NOT IN excel_to_dashboard.py
--------------------------------------------------------
⚠️ THE OBVIOUS HOME IS THE WRONG ONE. Stamping during the daily data run
computes the hash from the files as they were THAT MORNING. A JS change merged
at noon would then be published under the morning's stamp — a version query that
looks precise and is wrong, which is worse than none because it reads as
deliberate. `pages.yml` assembles `_site` and uploads it on EVERY deploy (push to
main, the cron's workflow_run, manual dispatch), so hashing there means the stamp
is always taken from the exact bytes being published.

THE HTML TAGS ARE THE SHELL, NOT THE SUBSTANCE
----------------------------------------------
⚠️ A first cut of this script stamped only the `<script>` tags and claimed "every
UI module is covered". That was WRONG, and checking it is what found the real
shape: COBI lazy-loads **34 tab modules** by name through `CPL_TABS.loadScript`,
including `college_briefing.js` — the file whose stale-cache risk prompted this.
The 38 tags in index.html are the shell; the tabs are the substance.

So this also emits a MANIFEST (`window.CPL_ASSET_V`, name -> hash) for the site's
root-level assets, and `loadScript` appends the stamp when it finds one. One
manifest, one consumer, no per-tab bookkeeping.

WHAT THIS DELIBERATELY DOES NOT TOUCH
-------------------------------------
`unified_courses.js` builds its lazy URLs through its own `_eraSrc()`, which pins
them to the DATASET era rather than to file content (Session 42). That is not a
cache trick: re-mint slot reuse means one id can denote a different course family
in a different era, so an era-mixed join renders another family's members under a
row. A content hash cannot express that, so `_eraSrc` is left exactly as it is.

The three `docx.min.js` injections (annual_report, master_report,
college_report_generator) are a vendor bundle that changes ~never; left alone
rather than threaded through a helper for no benefit.
"""
import hashlib
import os
import re
import sys

# `src="foo.js"` / `href="foo.css"`, capturing any stamp ALREADY present so a
# re-run replaces it instead of appending. Idempotency is not a nicety here:
# `excel_to_dashboard.py` grew 34 stacked copies of one CSS block before its
# guard existed (CLAUDE.md Rule 2), and an accumulating `?v=a?v=b` would be the
# same failure wearing a query string.
REF = re.compile(r'((?:src|href)=")([^"?#]+\.(?:js|css))((?:\?v=[0-9a-f]{6,32})?)(")')

SKIP_PREFIXES = ("http://", "https://", "//", "data:", "blob:", "#")

# Markers so a re-run REPLACES the manifest instead of stacking copies of it —
# the same guard CLAUDE.md Rule 2 exists for.
MAN_START = "<!-- CPL-ASSET-VERSIONS -->"
MAN_END = "<!-- /CPL-ASSET-VERSIONS -->"
# ⚠️ THE SURROUNDING NEWLINES ARE PART OF THE BLOCK. Matching only the markers
# left the separator newline behind on removal, so every re-run added one more
# byte — an accumulating diff that no single run looks wrong. Caught by this
# script's own idempotency check; it is the Rule 2 failure in miniature.
MAN_BLOCK = re.compile(r"\n?" + re.escape(MAN_START) + r".*?"
                       + re.escape(MAN_END) + r"\n?", re.S)


def _hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:8]


def stamp_html(html, html_dir, cache=None):
    """Return (new_html, stamped, unresolved). Pure apart from reading assets."""
    cache = {} if cache is None else cache
    stamped, unresolved = 0, []

    def sub(m):
        nonlocal stamped
        pre, ref, _old, post = m.groups()
        if ref.startswith(SKIP_PREFIXES):
            return m.group(0)
        # ⚠️ RESOLVE AGAINST THE HTML'S OWN DIRECTORY, not the site root.
        # fact-sheet/index.html loads ./factsheet.js, and sierra/index.html loads
        # ./sierra.js; resolving from the root would miss both and quietly leave
        # the two public pages unstamped — which is exactly where the one
        # documented stale-asset incident happened.
        target = os.path.normpath(os.path.join(html_dir, ref))
        if not os.path.isfile(target):
            # Drop any stale stamp rather than inventing one for a file that is
            # not there. A wrong hash is worse than none: it reads as deliberate.
            unresolved.append(ref)
            return pre + ref + post
        if target not in cache:
            cache[target] = _hash(target)
        stamped += 1
        return "%s%s?v=%s%s" % (pre, ref, cache[target], post)

    return REF.sub(sub, html), stamped, unresolved


def build_manifest(root):
    """name -> hash for every ROOT-level .js/.css. Root-level because that is how
    loadScript names them: `loadScript('college_briefing.js', ...)`. Keeping the
    key space identical to the call space means no path juggling in the browser
    and no way for the two to disagree about what an entry refers to."""
    out = {}
    for name in sorted(os.listdir(root)):
        if not name.endswith((".js", ".css")):
            continue
        p = os.path.join(root, name)
        if os.path.isfile(p):
            out[name] = _hash(p)
    return out


def inject_manifest(html, manifest):
    """Put the manifest BEFORE the first <script> so tabs.js can read it.

    ⚠️ Ordering is the whole job: a manifest that loads after tabs.js is a
    manifest loadScript cannot see, and the failure is silent — every lazy tab
    simply goes back to being unversioned while the page looks fine."""
    payload = (MAN_START + "<script>window.CPL_ASSET_V="
               + _json_compact(manifest) + ";</script>" + MAN_END)
    html = MAN_BLOCK.sub("", html)          # replace, never stack
    i = html.lower().find("<script")
    if i < 0:
        i = html.lower().find("</head>")
        if i < 0:
            return html, False
    return html[:i] + payload + "\n" + html[i:], True


def _json_compact(d):
    import json
    return json.dumps(d, separators=(",", ":"), sort_keys=True)


def main(argv):
    root = argv[1] if len(argv) > 1 else "_site"
    if not os.path.isdir(root):
        print("stamp_asset_versions: no such directory: %s" % root, file=sys.stderr)
        return 2

    manifest = build_manifest(root)
    cache, files, total, missing, manifested = {}, 0, 0, [], 0
    for dirpath, _dirs, names in os.walk(root):
        for name in names:
            if not name.endswith(".html"):
                continue
            p = os.path.join(dirpath, name)
            try:
                html = open(p, encoding="utf-8").read()
            except (UnicodeDecodeError, OSError) as e:
                print("  skip %s (%s)" % (p, e))
                continue
            new, n, unresolved = stamp_html(html, dirpath, cache)
            # Only the ROOT pages get the manifest: loadScript resolves names
            # root-relative, so a page in a subdirectory could not use it anyway
            # and would just carry 4 KB it never reads.
            # ⚠️ ONLY PAGES THAT LOAD tabs.js. The manifest's sole consumer is
            # CPL_TABS.loadScript, so a page without tabs.js cannot use it and
            # would just carry ~4 KB forever. Condition on the consumer, not on
            # "is this a root page" — the latter was the first cut and put the
            # manifest on Dashboard_Element_Map.html and pipeline-diagram.html,
            # neither of which loads a script at all.
            did_man = False
            if dirpath == root and re.search(r'src="tabs\.js', new):
                new, did_man = inject_manifest(new, manifest)
            if n or did_man:
                open(p, "w", encoding="utf-8").write(new)
                files += 1
                total += n
                manifested += 1 if did_man else 0
                print("  %-46s %3d refs%s"
                      % (os.path.relpath(p, root), n, "  + manifest" if did_man else ""))
            missing.extend((os.path.relpath(p, root), r) for r in unresolved)

    print("stamped %d ref(s) across %d file(s); %d distinct asset(s); "
          "manifest of %d entries on %d root page(s)"
          % (total, files, len(cache), len(manifest), manifested))
    for where, ref in missing[:20]:
        print("  note: %s -> %s not found on disk (left unstamped)" % (where, ref))
    if len(missing) > 20:
        print("  ... and %d more" % (len(missing) - 20))

    # ⚠️ A SILENT NO-OP IS THE FAILURE MODE TO FEAR. If a future refactor changes
    # how assets are referenced, this script would keep exiting 0 while every
    # page shipped unversioned again — indistinguishable from working. The deploy
    # should fail loudly instead, the same posture as pages.yml's served-file
    # assertion right above the step that calls this.
    if total == 0:
        print("stamp_asset_versions: stamped NOTHING — refusing to call that a "
              "success. Either the HTML no longer references local .js/.css the "
              "way REF expects, or the wrong directory was passed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
