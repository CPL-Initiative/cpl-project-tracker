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
