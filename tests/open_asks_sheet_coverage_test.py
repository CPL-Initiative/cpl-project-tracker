#!/usr/bin/env python3
"""Guards the standing open-asks sheet — Sam, 2026-09-22:

    "Always give me a decision sheet for any outstanding items for me..."

⚠️ THE RULE IS "ALWAYS", AND AN ALWAYS THAT DEPENDS ON A SESSION REMEMBERING IS
NOT ONE. The builder's `audit_coverage()` is what makes it mechanical: a lane
that carries a NEEDS-SAM marker and no matching item REFUSES the build. This
suite proves the refusal actually fires, because a guard that only ever passes
is indistinguishable from no guard — the same lesson `alias_chain_single_source`
learned when a copy drifted to 7 maps against 15 under a comment promising
lockstep.

⚠️ AND IT PROVES THE DISMISSAL PATH IS NARROW. `NO_OPEN_ASK` exists so a marker
that is not an open ask can be named rather than deleted, but a bare exclusion
list would let a real ask be silenced with one line — so every dismissal must
carry a reason, and this checks that it does.

Run from repo root:  python3 tests/open_asks_sheet_coverage_test.py
"""
import importlib.util
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDER = os.path.join(ROOT, "kb", "_build_open_asks_decision_sheet.py")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load():
    spec = importlib.util.spec_from_file_location("_open_asks", BUILDER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


check("the builder exists", os.path.exists(BUILDER), BUILDER)
mod = load()
items = mod.items()
found = mod.lanes_with_asks()
EV = mod.evidence_of(items)

# ── the sheet is built and complete ──────────────────────────────────────────
# The sheet lives at the builder's own OUT, so a fresh SHEET_ID moves this check
# with it. With no marked lane there are no cards, and the builder writes nothing.
SHEET = mod.OUT
if items:
    check("the sheet is committed", os.path.exists(SHEET), SHEET)
    html = open(SHEET, encoding="utf-8").read() if os.path.exists(SHEET) else ""
    cards = html.count('class="card"')
    check("every item rendered a card", cards == len(items),
          "%d cards vs %d items" % (cards, len(items)))
    check("⭐ every item carries a reply control",
          html.count('class="reply" data-item=') == len(items),
          "an item with no way to answer it is a status report, not a decision sheet")
else:
    _before = os.path.getmtime(SHEET) if os.path.exists(SHEET) else None
    check("an empty backlog builds cleanly", mod.build() == 0,
          "no marked lane and no card is the answered state, not an error")
    check("⭐ an empty backlog writes no sheet",
          (os.path.getmtime(SHEET) if os.path.exists(SHEET) else None) == _before,
          "an empty sheet would read as a decision to make, and would overwrite the "
          "last published sheet's committed copy")

# ── every item is answerable ─────────────────────────────────────────────────
check("every item names its lane",
      all(it.get("lane") for it in items))
check("every item states what it is, why, and a proposal",
      all(it.get("facts") and it.get("why") and it.get("rec") for it in items),
      "an ask with no proposal makes the reader do the work the sheet exists to do")
check("⭐ every proposal says how it could be wrong",
      all("might be wrong if" in it["rec"] for it in items),
      "a recommendation with no failure condition is an assertion — the reader "
      "cannot weigh what they cannot see the other side of")
check("every item offers a way to defer",
      all(any(v == "later" for _, v in it.get("chips", [])) for it in items),
      "a sheet that cannot be deferred item-by-item gets deferred whole")
check("chips name an outcome, never agreement",
      not any(lbl.strip().lower() in ("yes", "no", "ok", "agree", "approve")
              for it in items for lbl, _ in it.get("chips", [])),
      "'Yes' records assent to a proposal nobody will remember; the outcome is the record")

# ── the coverage guard actually refuses ──────────────────────────────────────
_f, missing, _s, _d = mod.audit_coverage(items)
check("coverage passes as committed", not missing, f"uncovered: {missing}")

# ⚠️ THE REFUSAL IS PROVEN ON SYNTHETIC LANES, NOT THE LIVE ONES. Until
# 2026-09-27 these checks orphaned the live cards, which proves nothing on the
# day every ask is answered: with no marked lane, "missing" is empty whether the
# guard works or not, and the check failed on a correct tree. A fixture directory
# always carries two marked lanes, a dismissed README and a quiet lane.
_orig_lanes = mod.LANES
with tempfile.TemporaryDirectory() as _d:
    for _name, _body in (("alpha", "Open: NEEDS SAM (card pending)."),
                         ("beta", "needs Sam, lower case, still an ask."),
                         ("gamma", "Shipped; nothing waits."),
                         ("README", "Writing NEEDS SAM in a lane breaks the build.")):
        with open(os.path.join(_d, _name + ".md"), "w", encoding="utf-8") as _fh:
            _fh.write(_body)
    mod.LANES = _d
    try:
        _found = mod.lanes_with_asks()
        check("the marker is found in any case, and only where written",
              set(_found) == {"alpha", "beta", "README"}, str(sorted(_found)))
        _f2, missing2, _s2, _d2 = mod.audit_coverage([])
        check("⭐ THE GUARD REFUSES when no item covers a lane",
              missing2 == ["alpha", "beta"],
              f"got {missing2} — with no card, every marked lane that is not dismissed "
              "must surface, or the audit is decorative")
        _f3, missing3, _s3, _d3 = mod.audit_coverage([{"lane": "alpha"}])
        check("⭐ dropping ONE lane's items is caught",
              missing3 == ["beta"],
              f"got {missing3} — a partial miss is the realistic failure, not a total one")
        _f4, missing4, _s4, _d4 = mod.audit_coverage([{"lane": "alpha"}, {"lane": "beta"}])
        check("covering every marked lane passes", missing4 == [], str(missing4))
        check("⭐ the build itself refuses an uncovered lane",
              mod.build(check_only=True) == 1,
              "the audit's answer has to stop the build, or the sheet ships without the lane")
    finally:
        mod.LANES = _orig_lanes

# ── every card declares what its premise rests on ────────────────────────────
# ⚠️ THIS IS THE GUARD THE 2026-09-22 SHEET NEEDED AND DID NOT HAVE. Four of its
# twenty-one cards asked Sam to rule on a premise that had already moved, and he
# ruled on all four: the statewide ring was drawn (its comment cites his ask BY
# DATE), the CHECK constraint already allowed skyview-ask, "8 colleges" was five
# profiles and none of them a college, and item 16 stated its risk backwards.
# The cross-list sheet recomputed every count at build time; this one quoted lane
# prose, and lane prose lags the code.
check("⭐ every card declares its evidence",
      all(EV[n] for n in range(1, len(items) + 1)),
      "a card with no evidence kind is a claim nobody owns")

# ⚠️ S302 (2026-09-29): the evidence rides each card under `evidence`. A table
# keyed by POSITION renumbered on every dropped card, so two verdict PRs landing
# in parallel collided on every line after the first card they removed.
check("⭐ evidence rides the card, never a position-keyed table",
      not hasattr(mod, "EVIDENCE"),
      "a position-keyed table renumbers on every dropped card; keep it on the card")

KINDS = {"measured", "live", "quoted", "policy"}
check("every evidence entry carries a known kind",
      all(e.get("kind") in KINDS
          for n in range(1, len(items) + 1) for e in EV[n]),
      str(KINDS))

check("⭐ a live claim names the date it was checked",
      all(e.get("checked") and e.get("how")
          for n in range(1, len(items) + 1) for e in EV[n]
          if e["kind"] == "live"),
      "the builder cannot reach a running system, so the card must say when "
      "somebody last did")

check("⭐ a quoted claim names its source AND its date",
      all(e.get("src") and e.get("as_of")
          for n in range(1, len(items) + 1) for e in EV[n]
          if e["kind"] == "quoted"),
      "quoted is the honest label for a claim nobody re-checked; unlabeled, it "
      "reads as measured")

check("a measured claim carries a callable predicate",
      all(callable(e.get("fn"))
          for n in range(1, len(items) + 1) for e in EV[n]
          if e["kind"] == "measured"),
      "measured means answered at build time, not asserted")

# ── the premise check actually refuses ───────────────────────────────────────
check("⭐ THE BUILD REFUSES when a measured premise has closed",
      mod.build(check_only=True) == 1 or not mod.check_premises(items),
      "either every premise still holds, or the build refuses — silently "
      "building a sheet that asks about finished work is the failure")

_settled = mod.check_premises(items)
check("⭐ a settled premise names WHAT it measured",
      all(detail.strip() for _n, _t, detail in _settled),
      "a refusal that does not say what it found sends the reader back to guess")

# ⚠️ EACH PREDICATE IS TESTED TWO WAYS, AND TWO EARLIER VERSIONS OF THIS CHECK
# WERE WRONG — both caught by mutation on 2026-09-22, which is the only reason
# they are not still here:
#
#   v1 asked whether the SET of verdicts held both True and False. It does, so a
#      predicate hardcoded to `draws = False` hid among the honest ones.
#   v2 starved each predicate of input and required its answer to change. That
#      flags an HONEST predicate whose "closed" verdict coincides with its
#      empty-input verdict — p_text_faint_funding reads 0 sites either way — so
#      it failed on a correct tree.
#
# What actually settles it: feed each predicate content that must make it say
# OPEN, then content that must make it say CLOSED. A constant predicate gives
# the same answer to both.
FIXTURES = {
    "p_phantom_tokens":      ("a{color:var(--brand)}",            "a{color:var(--brand,var(--cobalt))}"),
    "p_text_faint_funding":  ("a{color:var(--text-faint)}",       "a{color:var(--text-muted)}"),
    "p_surface_light":       (":root {\n--paper:#fff;\n}",        ":root {\n--surface-1: #F7F5F1;\n}"),
    "p_statewide_ring":      ("if(x){ctx.arc(1,2,3)}",            "if(isExhibits() && nd.sw && dr>1.8){ ctx.arc(p[0],p[1],dr+3.2,0,6) }"),
    "p_phone_opening":       ("var sph={half:Math.PI*94/180};",   "if(narrowScreen()){ sph.half = Math.PI*75/180; }"),
    "p_eths_extension_open": ('{"courses": {"ETHS M10AA": {"common_title": "Advanced Fencing"}}}',
                              '{"courses": {"KINE M10AA": {"common_title": "Advanced Fencing"}}}'),
    # S300 (2026-09-29): the College Dashboard port's three measured asks.
    "p_cards_current_total": ("function earnedLineHtml(i) { return '<p title=\"' + t + '\">Current Total: <strong>' + x; }",
                              "function earnedLineHtml(i) { return '<p title=\"' + t + '\">Demonstrated: <strong>' + x; }"),
    "p_thankyou_acknowledge": ('var t = "The Chancellor&#39;s Office will acknowledge it; counted meanwhile.";',
                               'var t = "Your college counts as participating from today.";'),
    "p_explainer_reserve":   ("<p>The model reserves the funding an institution demonstrates for that institution.</p>",
                              "<p>The model counts every outcome an institution demonstrates toward that award.</p>"),
    # S301 (2026-09-29): the four Jev next steps and the Sierra Training call.
    "p_ccr_no_gate":         ('GATES = {\n    "ccrr": 0.85,\n}',
                              'GATES = {\n    "ccrr": 0.85,\n    "ccr": 0.7,\n}'),
    "p_ccrr_course_pairing": ("def build_pairs():\n    return []",
                              "def build_course_pairs():\n    return []"),
    "p_cer_judgment_open":   ('{"findings": [{"rule": "issuer_variant_cluster", "needs_judgment": true}]}',
                              '{"findings": [{"rule": "style_nits", "needs_judgment": false}]}'),
    "p_csr_autb_collision":  ('{"disciplines": {"Auto Body Technology": {"canonical_subj4": "AUTB"}, '
                              '"Agricultural Business and Related Services": {"canonical_subj4": "AUTB"}}}',
                              '{"disciplines": {"Auto Body Technology": {"canonical_subj4": "AUTB"}, '
                              '"Agricultural Business and Related Services": {"canonical_subj4": "AGAB"}}}'),
    "p_sierra_try_both_buttons": ("function tryGroup(src, labelId) {\n    return '<button>Sierra</button>'\n"
                                  "      + '<button>My College</button>';\n  }",
                                  "function tryGroup(src, labelId) {\n    if (sierraHost() !== 'chatbot') return '';\n"
                                  "    return '<button>Sierra</button>';\n  }"),
    # S301: the unit-range pass's two CR Reference calls.
    "p_crr_canonical_units": ('{"groups": [{"units_differ": true, "canonical_source": "most_colleges", '
                              '"canonical": "3 or 4 hours in Engine Performance"}]}',
                              '{"groups": [{"units_differ": true, "canonical_source": "most_colleges", '
                              '"canonical": "Engine Performance (2\u20135 units)"}]}'),
    "p_crr_rung4_units_screen": ("        if rung == 4 and units_differ:\n            acts = False",
                                 "        if not screen_ok:\n            acts = False"),
    # S301: the narrated draft's three measured calls.
    "p_video_narrated_unlinked": ('<a id="video-mp4" href="../prototype/funding_video/20260926_CPL_Funding_in_Motion_v2.mp4">',
                                  '<a href="../prototype/funding_video/funding_in_motion_n1.html">'),
    "p_video_timing_trails": ('{"scenes": [{"scene": "Timing", "cues": [{"word": "The full two-year amount", "skip": "late"}]}]}',
                              '{"scenes": [{"scene": "Timing", "cues": [{"word": "The full two-year amount", "at": 0.1}]}]}'),
    "p_video_sample_unnarrated": ('{"scenes": [{"scene": "Targets", "text": "Each priority has a target."}]}',
                                  '{"scenes": [{"scene": "Targets", "text": "Sample College\'s Access target is 44 FTES."}]}'),
}
_broken = []
for _name, (_open_src, _closed_src) in FIXTURES.items():
    _fn = getattr(mod, _name, None)
    if _fn is None:
        _broken.append(_name + " (missing)")
        continue
    _orig = mod._read
    try:
        mod._read = lambda _rel, _v=_open_src: _v
        _a = _fn()[0]
        mod._read = lambda _rel, _v=_closed_src: _v
        _b = _fn()[0]
    finally:
        mod._read = _orig
    if not (_a is True and _b is False):
        _broken.append("%s (open->%s, closed->%s)" % (_name, _a, _b))
check("⭐ every measured predicate answers BOTH ways on fixtures",
      not _broken,
      "; ".join(_broken) + " — a predicate that cannot say 'closed' is "
      "decoration, and would have let item 14 through exactly as the missing "
      "guard did")

check("every measured predicate has a fixture",
      all(getattr(e["fn"], "__name__", "") in FIXTURES or
          getattr(e["fn"], "__name__", "") == "p_eths_misprefixed"
          for n in range(1, len(items) + 1) for e in EV[n]
          if e["kind"] == "measured"),
      "an unfixtured predicate is untested; p_eths_misprefixed is exempt only "
      "because its input is a 16,000-row payload, and it fails SAFE (an "
      "unreadable payload reports the premise unverified rather than closed)")

check("the provenance line renders for every card",
      all(mod.provenance_line(EV[n]).strip()
          for n in range(1, len(items) + 1)),
      "the reader sees where each claim came from, or the label is for us only")

# ── the dismissal path stays narrow ──────────────────────────────────────────
check("⭐ every dismissal carries a reason",
      all(isinstance(v, str) and len(v.strip()) > 40
          for v in mod.NO_OPEN_ASK.values()),
      "a bare exclusion list silences a real ask with one line; the reason is the point")
check("no lane is both covered and dismissed",
      not ({it["lane"] for it in items} & set(mod.NO_OPEN_ASK)),
      "a lane answered in two places drifts")

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
