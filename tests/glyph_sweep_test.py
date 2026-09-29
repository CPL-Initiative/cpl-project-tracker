#!/usr/bin/env python3
"""kb/_glyph_sweep.py — the classifier and the safe-rewrite envelope.

⚠️ THIS GUARDS A TOOL THAT REWRITES 139 FILES. `--apply` edits rendered labels
across the whole of COBI, so what it REFUSES to touch matters more than what it
strips: a blind sweep would empty a label that is a lone glyph, cut a mark out of
the middle of a sentence, and rewrite the ⚠️/⭐ comment style this repo writes
deliberately.

Run:  python3 tests/glyph_sweep_test.py
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "gs", os.path.join(os.path.dirname(HERE), "kb", "_glyph_sweep.py"))
gs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gs)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def rewrite(s):
    return gs.LEAD.sub(lambda m: m.group("q") + m.group("rest"), s)


# ── a comment line is never a finding ───────────────────────────────────────
check("⭐ a // comment is not a finding — ⚠️/⭐ house style renders to nobody",
      gs.is_comment("  // ⚠️ THE THING TO KNOW"))
check("a /* block comment is not a finding", gs.is_comment("  /* ⭐ the point */"))
check("a continuation ' * ' line is not a finding", gs.is_comment("   * ⚠️ more"))
check("a python # comment is not a finding", gs.is_comment("# ⭐ note"))
check("a real line IS a finding", not gs.is_comment('  btn.textContent = "\U0001F513 Unlock";'))

# ── classification drives which class is mechanical ─────────────────────────
check("a button label classifies as control",
      gs.classify('h.push("<button>\U0001F4CB To-Do</button>");') == "control")
check("an aria-label classifies as control",
      gs.classify('x.setAttribute("aria-label", "⚙ Settings");') == "control")
check("a hint string classifies as status",
      gs.classify('setHint("❌ that failed");') == "status")
check("anything else is decoration",
      gs.classify('var legend = "★ means adopted";') == "decoration")

# ── ⭐ the rewrite envelope: what it strips ─────────────────────────────────
check("strips a leading glyph and its space from a label",
      rewrite('btn.textContent = "\U0001F513 Unlock editing";')
      == 'btn.textContent = "Unlock editing";')
check("strips the HTML-entity form the generator writes",
      rewrite("'>&#128206; See Attachments</a>'") == "'>See Attachments</a>'")
check("strips inside an attribute", rewrite('title="⚙ Settings"') == 'title="Settings"')

# ── ⭐ the rewrite envelope: what it REFUSES ────────────────────────────────
lone = 'x.textContent = "\U0001F9E0";'
check("⭐ REFUSES to empty a label that IS a lone glyph", rewrite(lone) == lone, rewrite(lone))
mid = 't = "Merge → target";'
check("⭐ REFUSES a mark mid-sentence — it may be load-bearing", rewrite(mid) == mid, rewrite(mid))
tail = 'b.textContent = "Saved ✓";'
check("⭐ REFUSES a trailing mark (only a LEADING one is unambiguous)",
      rewrite(tail) == tail, rewrite(tail))
concat = 'b.textContent="❌ "+err;'
check("⭐ REFUSES a glyph spliced onto a variable — needs a reworded sentence",
      rewrite(concat) == concat, rewrite(concat))
two = 'l = "\U0001F513 \U0001F4CB Both";'
# ⚠️ THE EXPECTATION HERE WAS WRONG FIRST TIME. I assumed it would strip the
# leading mark and leave the second; it refuses the line outright, because the
# rule requires a LETTER after the space. Refusing is the safer answer — two
# marks in a row is a deliberate arrangement, not a stray prefix — so the guard
# asserts the refusal rather than the behavior I guessed at.
check("⭐ REFUSES a doubled mark — two in a row is an arrangement, not a prefix",
      rewrite(two) == two, rewrite(two))

# ── Rule 1: never rewrite what the dashboard generator regenerates ──────────
# ⚠️ THIS IS THE GUARD THAT WAS MISSING ON THE FIRST REAL RUN, and it is why the
# run was staged rather than trusted: 13 of the 16 rewritable sites in
# CPL_Dashboard.html live inside a section `excel_to_dashboard.py` replaces
# wholesale, so a naive sweep "fixes" them and the next daily cron silently puts
# them back — green tests, reverted overnight, reported as success.
#
# The guard is the UNION of a positional test and a fragment test, and the tests
# below pin BOTH halves plus the union, because each half alone has a blind spot
# that the first implementation actually shipped with.
HTML = (
    '<html>\n'
    '<a class="btn" title="x">\U0001F4C4 Static</a>\n'
    '<!-- \u2550\u2550\u2550 CPL Analytics Section \u2550\u2550\u2550 -->\n'
    '<a class="btn" title="y">\U0001F465 Generated</a>\n'
    '<!-- \u2550\u2550\u2550 Dashboard Sections End \u2550\u2550\u2550 -->\n'
    '<a class="btn" title="z">\U0001F4E2 AlsoStatic</a>\n'
    '</html>\n'
)


def owned_at(needle, html=HTML, gen=""):
    """Is the LEAD match on the line containing `needle` held back?"""
    gs._GEN_SRC = gen
    spans = gs.regenerated_spans(html)
    off = 0
    for line in html.splitlines(keepends=True):
        if needle in line:
            for m in gs.LEAD.finditer(line):
                return gs.generator_owned(off + m.start(), spans, m)
        off += len(line)
    return None


check("regenerated_spans finds the marked region",
      len(gs.regenerated_spans(HTML)) == 1)
check("⭐ POSITION alone holds a site inside a regenerated section",
      owned_at("Generated") is True)
check("a site BEFORE the region is not held", owned_at("Static") is False)
check("a site AFTER the region is not held", owned_at("AlsoStatic") is False)

# The blind spot of the positional test: the generator also emits blocks that
# sit inside none of the marked regions (render_algo_details is the live case).
check("⭐ FRAGMENT alone holds a site the region list does not cover",
      owned_at("Static", gen='>\U0001F4C4 Static<') is True)

# The blind spot of the fragment test: it stops recognizing a site the moment
# the generator is fixed — which is the order-dependence that made the first
# implementation report "held back: 2" instead of 13.
check("⭐ ORDER-INDEPENDENT — still held after the generator no longer has it",
      owned_at("Generated", gen="") is True)

# A .js file is a static asset; nothing there is ever the generator's.
check("a .js file has no protected regions",
      gs.regenerated_spans('var s = "\U0001F4CB To-Do";') == [])

# Every marker must still exist in the generator, or the guard silently
# protects nothing — the failure mode this whole section exists to prevent.
# ⚠️ owned_at() above pokes the memoized gs._GEN_SRC; clear it or this reads an
# EMPTY generator and "fails" for a reason that has nothing to do with drift.
gs._GEN_SRC = None
_gen = gs.generator_source()
_missing = [m for pair in gs.REGENERATED for m in pair if m not in _gen]
check("⭐ every REGENERATED marker still appears in the generator source",
      not _missing, _missing)

# apply_safe must REPORT what it held, not just skip it silently.
import tempfile
_fd, _tmp = tempfile.mkstemp(suffix=".html", dir=gs.ROOT)
os.close(_fd)
try:
    with open(_tmp, "w", encoding="utf-8") as fh:
        fh.write(HTML)
    gs._GEN_SRC = ""
    n, held = gs.apply_safe(os.path.basename(_tmp))
    after = open(_tmp, encoding="utf-8").read()
    check("apply_safe rewrites the two static labels", n == 2, n)
    check("⭐ apply_safe REPORTS the held site rather than skipping it quietly",
          len(held) == 1, held)
    check("the generated label keeps its mark on disk",
          "\U0001F465 Generated" in after)
    check("the static labels lost theirs",
          ">Static<" in after and ">AlsoStatic<" in after)
finally:
    os.unlink(_tmp)

# ── the sweep still finds things after a rewrite pass (no silent zeroing) ────
check("EMOJI matches a pictograph", bool(gs.EMOJI.search("\U0001F4CB")))
check("EMOJI matches a dingbat arrow", bool(gs.EMOJI.search("→")))
check("EMOJI does not match ordinary punctuation",
      not gs.EMOJI.search("a - b × c · d"))

ok = sum(1 for _, c, _ in results if c)
for name, c, why in results:
    print(("PASS" if c else "FAIL") + "  " + name + ("" if c or not why else "  — " + repr(why)))
print("\n%d/%d checks passed" % (ok, len(results)))
sys.exit(0 if ok == len(results) else 1)
