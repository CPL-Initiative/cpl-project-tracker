// CPL Implementation Funding tab — the statutory goal spine, Ed. Code §78093.2(d)(1).
//
// Sam's ask (2026-08-28): "Wire the ABCD §78093.2 outcomes in and make them
// visible — superscript links from whatever serves each." §78093.2(d)(2) makes
// demonstrating those four goals a precondition of a campus allocation, so this
// section is the reporting artifact, not a caption.
//
// ⚠️ WHAT THESE ASSERTIONS PROTECT IS THE EMPTY HALF. Any build can render four
// goal cards and fill them; the reason this one is worth shipping is that goal
// (C) comes out FUNDED and UNMEASURED and says both, instead of being padded
// with the nearest available number. Most of the checks below fail if a future
// change collapses "funded" and "measured" into one status, or quietly derives
// a statutory tag from the Workplan's own goal names.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_statutory_goals.test.js`).
const fs = require("fs");
const { check, freshDom, boot, click, commit, finish } = require("./lib/cpl_funding_harness.js");

// Locate STRUCTURALLY — never by index, never by a literal sentence. Two suites
// broke on 2026-08-27 for exactly those two reasons.
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const goalCard = (doc, k) => doc.getElementById("cplfund-goal-" + k);
const goalCards = (doc) => Array.from(doc.querySelectorAll(".cplfund-goal"));
const axis = (card, name) =>
  Array.from(card.querySelectorAll(".cplfund-goal-ax")).find((s) =>
    new RegExp(name, "i").test(flat(s.querySelector("h5"))));
const laneSeg = (doc) => doc.getElementById("cplFundLane");
const laneBtn = (doc, v) => laneSeg(doc) && laneSeg(doc).querySelector('button[data-val="' + v + '"]');

const dom = freshDom();
const win = dom.window;
// ⚠️ LOAD THE REAL STORY CORPUS BEFORE BOOT. Goal (C)'s qualitative claim is
// COUNTED from window.CPL_STORIES at render, not quoted from a session that
// counted it once — so a harness without the corpus exercises the graceful path
// (no corpus -> no claim) and silently proves nothing about the claim itself.
// This is the same trap as testing a metric with no feed: the absence renders
// exactly like the success.
win.eval(fs.readFileSync(require("path").join(__dirname, "..", "fact-sheet", "cpl_stories.js"), "utf8"));
const doc = boot(win);
check("the real story corpus is loaded, so (C)'s claim is actually exercised",
  !!(win.CPL_STORIES && Array.isArray(win.CPL_STORIES.stories) && win.CPL_STORIES.stories.length > 0));

// ── 1. all four goals render, each anchored and cited ───────────────────────
check("all four statutory goals render", goalCards(doc).length === 4);
["A", "B", "C", "D"].forEach((k) => {
  check("goal (" + k + ") has an anchor a superscript can link to", !!goalCard(doc, k));
});
check("each goal cites its own subdivision", ["A", "B", "C", "D"].every((k) =>
  new RegExp("78093\\.2\\(d\\)\\(1\\)\\(" + k + "\\)").test(flat(goalCard(doc, k)))));
// The statute's own words, not a paraphrase — a reader has to be able to check
// the model against the law without leaving the tab.
check("each goal quotes the statute verbatim", ["A", "B", "C", "D"].every((k) =>
  !!goalCard(doc, k).querySelector(".cplfund-goal-quote")));
check("goal (D) names the MAP initiative, as the statute does",
  /Mapping Articulated Pathways/i.test(flat(goalCard(doc, "D"))));

// ── 2. FUNDED and MEASURED are two axes, never one status ───────────────────
// This is the assertion that fails if someone merges them into a traffic light.
check("every goal states funding and evidence as SEPARATE axes",
  goalCards(doc).every((c) => !!axis(c, "what funds it") && !!axis(c, "how it is evidenced")));

// ── 3. the derivation is structural, and it lands correctly ─────────────────
// A priority's goal comes from its MEASURE's milestone (eligible/applied -> A,
// transcribed -> B), never from its title's prose. On the live config that puts
// both Access priorities under (A) and Completion under (B) without reading a
// single word of a title — which is the whole point, since titles are curator-
// editable and drift.
const fundedA = flat(axis(goalCard(doc, "A"), "what funds it"));
const fundedB = flat(axis(goalCard(doc, "B"), "what funds it"));
check("an access/applied priority funds goal (A)", /Priority \d/.test(fundedA));
check("a transcribed priority funds goal (B)", /Priority \d/.test(fundedB));
check("(A) and (B) are not fed by the same priority set", fundedA !== fundedB);
// A derived tag SAYS it is derived — a curator must be able to tell an
// inference from a decision before pinning one.
check("a derived goal tag is labelled as derived",
  !!goalCard(doc, "A").querySelector(".cplfund-goal-derived"));

// ⚠️ THE DISCRIMINATING CASE, and without it this file proves nothing about the
// derivation. On the live config, matching a TITLE ("Access: …" -> A) and
// reading the MEASURE's milestone give the SAME answer for all three
// priorities — so a mutation swapping one for the other passed every assertion
// above. The property that actually matters is that a priority's statutory goal
// does not move when a curator renames it: titles are editable prose and drift,
// milestones are structural. Rename the transcribed priority to say "Access"
// and it must stay under (B).
(function renamingMustNotMoveTheGoal() {
  const titles = Array.from(doc.querySelectorAll('[data-edit="prio-title"]'));
  const bBefore = flat(axis(goalCard(doc, "B"), "what funds it"));
  const m = bBefore.match(/Priority (\d)/);
  if (!titles.length || !m) { check("SKIPPED: no editable priority title to rename", false); return; }
  const target = titles[Number(m[1]) - 1];
  if (!target) { check("SKIPPED: could not locate the (B) priority's title input", false); return; }
  commit(win, target, "Access: renamed by a curator");
  const d2 = win.document;
  const bAfter = flat(axis(goalCard(d2, "B"), "what funds it"));
  const aAfter = flat(axis(goalCard(d2, "A"), "what funds it"));
  check("renaming a priority 'Access…' does NOT move it to goal (A)",
    /Access: renamed by a curator/.test(bAfter) && !/renamed by a curator/.test(aAfter));
  check("the renamed priority still funds goal (B)", /Priority \d/.test(bAfter));
})();

// ── 4. (C) is funded and unmeasured, and says BOTH ──────────────────────────
// ⚠️ The single most important behaviour in this file. Sam ruled career
// attainment is carried by the project pool and reported qualitatively, with no
// invented metric. So (C) must show money AND an explicit absence of measure.
const cCard = goalCard(doc, "C");
const cFund = flat(axis(cCard, "what funds it"));
const cMeas = flat(axis(cCard, "how it is evidenced"));
check("goal (C) is shown as FUNDED", /\$[\d,]+/.test(cFund));
check("goal (C) reports NO performance measure", /no performance measure/i.test(cMeas));
check("goal (C) does not claim a metric it does not have",
  !/earned against/i.test(cMeas));
// And the honest half: the qualitative evidence documents a different goal.
check("goal (C) names what its qualitative evidence actually documents",
  /\bevidence for \(B\)/i.test(flat(cCard)));
// The figures are COUNTED, so they must agree with the corpus in the window —
// a hardcoded pair would pass the line above and drift the moment a story lands.
check("(C)'s story figures are counted from the corpus, not hardcoded", (function () {
  const total = win.CPL_STORIES.stories.length;
  const t = flat(cCard);
  return new RegExp("\\b" + total + "\\b").test(t);
})());
check("(C) reports the educational majority, which is the finding", (function () {
  const m = flat(cCard).match(/(\d+)\s*end at an educational destination/i);
  return !!m && Number(m[1]) > win.CPL_STORIES.stories.length / 2;
})());

// ── 5. (A)'s equity qualifier is not silently dropped ───────────────────────
// The statute says "equitably"; nothing in the model measures distribution
// across student populations. A card that shows (A) as cleanly measured would
// be overclaiming against the statute's own wording.
check("goal (A) states that 'equitably' is not measured",
  /equitably.{0,40}not measured/i.test(flat(goalCard(doc, "A"))));

// ── 6. superscript markers link cards back to the spine ─────────────────────
const sups = Array.from(doc.querySelectorAll(".cplfund-goalsup"));
check("superscript goal markers render", sups.length > 0);
check("every marker links to a goal anchor that exists", sups.every((a) => {
  const href = a.getAttribute("href") || "";
  return /^#cplfund-goal-[ABCD]$/.test(href) && !!doc.getElementById(href.slice(1));
}));
// ⚠️ Colour is never the only signal, and a raised letter alone is unreadable.
check("every marker carries an accessible name", sups.every((a) => !!a.getAttribute("aria-label")));
check("every marker names its goal in words on hover", sups.every((a) =>
  /78093\.2/.test(a.getAttribute("title") || "")));
check("a priority card carries a goal marker", (function () {
  const c = doc.querySelector(".cplfund-prio .p");
  return !!(c && c.querySelector(".cplfund-goalsup"));
})());

// ── 7. the Workplan register is honoured, not corrected ─────────────────────
// ⚠️ Sam, 2026-08-28: the register's goals predate §78093.2 and align with the
// CPL Workplan and Vision 2030 — they are the operational plan that DELIVERS
// these outcomes. This section must never read as though 32 projects are
// mis-tagged and need fixing.
const spine = flat(doc.getElementById("cplfund-goal-A").closest(".cplfund")
  ? doc.querySelector(".cplfund-goals").parentNode : doc.body);
check("the alignment stack is named, so the statute does not read as a replacement",
  /Vision 2030/.test(spine) && /Master Plan for Career Education/.test(spine) &&
  /CPL Workplan/.test(spine));
check("Ed. Code is cited as the §§78092–78093.2 range Sam named",
  /78092/.test(spine));
check("an untagged project is never called an error", !/mis-?tagged|incorrect|wrong goal/i.test(spine));
check("the register's own goals are named as the operational plan",
  /operational plan/i.test(spine) || /how the work gets done/i.test(spine));

// ── 8. the lane is named, and the two lanes are never summed ────────────────
check("the spine says which lane its figures describe", /credit lane/i.test(spine));
click(win, laneBtn(doc, "nc"));
check("flipping to noncredit re-scopes the spine, it does not add to it",
  /noncredit lane/i.test(flat(win.document.querySelector(".cplfund-goals").parentNode)));
click(win, laneBtn(win.document, "cr"));

// ── 9. Timing is its own collapsible section (Sam, 2026-08-28) ─────────────
// "The Timing block is now part of the priorities block and should probably
// have its own so it can be collapsible separately."
(function timingIsItsOwnSection() {
  const d = win.document;
  const sections = Array.from(d.querySelectorAll("#cplFundingMount details, #cplFundingMount section"));
  const timing = d.querySelector(".cplfund-timing");
  check("the timing block still renders", !!timing);
  if (!timing) return;
  // Its own collapsible ancestor, and NOT the priorities one — the whole point
  // is that collapsing priorities no longer takes Timing with it.
  const own = timing.closest("details");
  check("timing sits inside its own collapsible", !!own);
  const prioGrid = d.querySelector(".cplfund-prio");
  const prioOwn = prioGrid && prioGrid.closest("details");
  check("timing's collapsible is NOT the priorities one", !!own && own !== prioOwn);
  // The h3 was lifted into the summary, so the heading is not duplicated inside.
  check("the Timing heading reads as the section's own summary",
    !!own && /Timing/i.test(flat(own.querySelector("summary"))));
  // ⚠️ The add control has to survive the move — it is how a curator edits.
  check("the add-item control is still reachable inside it",
    !!own && !!own.querySelector("#cplFundTimingAdd"));
})();

finish();
