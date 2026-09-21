// A sheet that proposes a PLAN must not fall back to a bare "Yes".
//
// `build_sheet` documented a `chips` argument from the day it was written and
// never used one. Every card's words came from `chips_for`, which reads the ask
// for "fold" or "merge" and otherwise returns CHIPS_DEFAULT — whose first word
// is the bare Yes that Sam's 2026-09-20 ruling retired after it cost him
// sixteen reversals on the 51-item Jev sheet.
//
// That was invisible while every built sheet was a reference sheet, because
// those asks all say "fold". The Jev ladder sheet proposes which center runs
// next and which step comes first; nothing in it folds anything, so every one
// of its items would have shipped carrying "Yes / Keep / Retire / Edit / Later"
// — the exact ambiguity the template was rebuilt to remove. A builder cannot
// honestly write the word fold into its ask to buy better chips, so the
// argument had to become real.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_plan_chips.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "plan-chips-"));

// Drive the real builder, exactly as a sheet generator does.
function build(py) {
  const f = path.join(TMP, "s" + Math.random().toString(36).slice(2) + ".py");
  fs.writeFileSync(f, "import sys\nsys.path.insert(0, 'kb')\n" +
    "import _decision_sheet_replies as m\n" + py);
  return execFileSync("python3", [f], { stdio: "pipe" }).toString();
}

function dom(html) {
  const vc = new VirtualConsole();          // the sheet's own script is not under test
  return new JSDOM(html, { virtualConsole: vc }).window.document;
}

function chipsOf(doc, id) {
  const card = doc.querySelector(`.reply[data-item="${id}"]`);
  if (!card) return null;
  return Array.from(card.querySelectorAll(".reply-row > .reply-chip[data-v]"))
    .map((c) => [c.textContent, c.getAttribute("data-v"), c.getAttribute("aria-pressed")]);
}

// An ask with NO "fold" and no "merge" in it — a plan, which is what a ladder
// sheet is made of.
const PLAN_ITEM =
  "{'title': 'Which center gets the next verdict set', 'ref': 'ladder-1'," +
  " 'facts': 'Four centers ride the same 9,413 rows.'," +
  " 'why': 'Only one of them carries human verdicts.'," +
  " 'rec': 'Give the CCR the next sitting of verdicts.', 'rows': 120}";

/* ── 1. the plan sheet gets outcome-named chips, never a bare Yes ─────────── */
const planHtml = build(
  `out = m.build_sheet('Ladder', [${PLAN_ITEM}], sheet_id='ladder', chips=m.CHIPS_PLAN)\n` +
  `sys.stdout.write(out)\n`);
const plan = chipsOf(dom(planHtml), "1");

check("a plan item renders the chips the builder named",
  plan && plan.map((c) => c[1]).join(",") === "adopt,drop,later",
  plan ? plan.map((c) => c[1]).join(",") : "no reply block");

check("no chip on a plan sheet is a bare Yes",
  plan && !plan.some((c) => c[1] === "yes" || c[0].trim() === "Yes"),
  plan ? plan.map((c) => c[0]).join(" / ") : "no reply block");

// Opt-out (Sam, 2026-09-21): the recommended chip ARRIVES pressed, in markup.
check("the confirming chip arrives selected",
  plan && plan[0][2] === "true" && plan.slice(1).every((c) => c[2] === "false"),
  plan ? plan.map((c) => c[1] + "=" + c[2]).join(" ") : "no reply block");

/* ── 2. an item may override the sheet's chips ────────────────────────────── */
const mixedHtml = build(
  `a = dict(${PLAN_ITEM})\n` +
  `b = dict(a, title='A wording under a published line', chips=m.CHIPS_FOLD)\n` +
  `sys.stdout.write(m.build_sheet('Mixed', [a, b], sheet_id='mixed', chips=m.CHIPS_PLAN))\n`);
const mixed = dom(mixedHtml);
check("the sheet's chips are the default and an item can override them",
  (chipsOf(mixed, "1") || []).map((c) => c[1]).join(",") === "adopt,drop,later" &&
  (chipsOf(mixed, "2") || []).map((c) => c[1]).join(",") === "fold,keep,later",
  (chipsOf(mixed, "1") || []).map((c) => c[1]).join(",") + " | " +
  (chipsOf(mixed, "2") || []).map((c) => c[1]).join(","));

/* ── 3. a card with no data-chips still falls back to chips_for ───────────── */
// Every sheet built before this change has no such attribute, and must keep
// the words it shipped with.
const legacy = path.join(TMP, "legacy.html");
fs.writeFileSync(legacy,
  '<title>L</title>\n<style>\n:root{}\n</style>\n<body>\n' +
  '<ul class="howto"><li>How to read this.</li></ul>\n' +
  '<section class="group">\n<h2>The proposals</h2>\n' +
  '<article class="card" id="i1">\n<h3>1 &middot; A wording</h3>\n' +
  '<p class="ref">reference: REF-1</p>\n<dl>\n' +
  '<dt>What this is</dt><dd>Two wordings under one course.</dd>\n' +
  '<dt>What I propose</dt><dd class="ask">Fold this wording into the published line.</dd>\n' +
  '</dl>\n</article>\n</section>\n</body>');
execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", legacy], { stdio: "pipe" });
const legacyChips = chipsOf(dom(fs.readFileSync(legacy, "utf8")), "1");
check("a card carrying no chips of its own still reads its ask",
  legacyChips && legacyChips.map((c) => c[1]).join(",") === "fold,keep,later",
  legacyChips ? legacyChips.map((c) => c[1]).join(",") : "no reply block");

/* ── 4. a chip word that would break the attribute is refused, not mangled ── */
let refused = false;
try {
  build(`m.build_sheet('X', [dict(${PLAN_ITEM}, chips=[('Run; now', 'run')])], sheet_id='x')\n`);
} catch (e) { refused = /cannot carry/.test(String(e.stderr || e)); }
check("a chip label carrying the attribute's own separator is refused",
  refused, "a malformed label would silently truncate the chip row");

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
for (const [name, ok, why] of results) {
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}${ok ? "" : "  — " + why}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
