// The decision-sheet template, rebuilt to Sam's rulings of 2026-09-20 — the
// run that produced them is the failure this file guards.
//
// He answered 51 items on the Jev CR Reference sheet, then had to reverse
// sixteen of them: "make your recommendation line more visually a focal point.
// I found myself saying yes to things that I later had to flip keep because I
// didn't pay attention to your rec." Two things had gone wrong at once.
//
//   * ⭐ THE PROPOSAL LOOKED LIKE A FACT. It was <dd class="ask"> — the same
//     gray as the two facts around it — with "Why" sitting between it and the
//     chips. Now it is a tinted panel with its own rule and label word, and it
//     is the LAST thing before the chip row.
//
//   * ⭐ A BARE "Yes" READS TWO WAYS. The sheet defined Yes as "take the
//     proposal" and its review band proposed hold-separate, so a Yes there
//     meant keep by the sheet and fold to Sam. The chip's stored value now
//     names the OUTCOME — `fold` means fold whatever was proposed — and its
//     label names the action: Keep the fold, Pull out.
//
// Also guarded here: two defects found in the shipped 2026-09-20 sheet while
// rebuilding. The how-to paragraph had been injected INSIDE item 1's chip row
// (the injector looked for </div> and that sheet's box is a <ul>), and the
// nested markers that left behind made _strip() orphan the outer reply block
// on any re-run.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_template.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "sheet-"));

// A sheet in the shape the builders emit: a <ul class="howto"> box (the tag
// that broke the old injector), a section, and cards whose proposal is a
// dd.ask. Card 3 arrives ALREADY injected, with a nested marker pair inside
// its reply block — exactly the wreckage the 2026-09-20 sheet shipped with.
function fixture(nCards) {
  const cards = [];
  for (let i = 1; i <= nCards; i++) {
    cards.push(
      `<article class="card" id="i${i}">\n<h3>${i} &middot; Item ${i}</h3>\n` +
      `<p class="ref">reference: REF-${i}</p>\n<dl>\n` +
      `<dt>What this is</dt><dd>Two wordings under one course. Carries ${i} articulation rows.</dd>\n` +
      `<dt>What I propose</dt><dd class="ask">Fold this wording into the published line.</dd>\n` +
      `<dt>Why</dt><dd>The probability they are the same is 0.9${i}.</dd>\n</dl>\n</article>`);
  }
  if (nCards >= 3) {
    cards[2] = cards[2].replace("</article>",
      '<!-- replies:start --><div class="reply" data-item="3" data-kind="item">' +
      '<div class="reply-row"><span class="reply-lbl">Your reply</span>' +
      '<!-- replies:start --><p>a nested injection</p><!-- replies:end --></div>' +
      '</div><!-- replies:end --></article>');
  }
  return `<title>Fixture</title>\n<style>\n:root{--seal-blue:#002F6D;}\n</style>\n<body>\n` +
    `<ul class="howto"><li>How to read this.</li></ul>\n` +
    `<section class="group">\n<h2>The proposals</h2>\n${cards.join("\n")}\n</section>\n</body>`;
}

function inject(html, name) {
  const f = path.join(TMP, name + ".html");
  fs.writeFileSync(f, html);
  execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", f], { stdio: "pipe" });
  return fs.readFileSync(f, "utf8");
}

/* ── 1. the build: the proposal is a focal point, the chips name outcomes ── */

const out = inject(fixture(45), "sheet");

const dom = new JSDOM(out, { runScripts: "dangerously", url: "https://sheet.test/s", virtualConsole: new VirtualConsole() });
const doc = dom.window.document;

const card1 = doc.getElementById("i1");
const rec = card1.querySelector(".reply-rec");
check("the proposal renders as a callout, not a fact in the same gray",
  rec && /Fold this wording/.test(rec.textContent) && !card1.querySelector("dd.ask"),
  "card 1 should carry .reply-rec holding the proposal, and no dd.ask");
check("the callout carries a label word, so it does not lean on the tint alone",
  rec && /What I propose/.test(rec.textContent), "expected the label 'What I propose'");

// ⭐ Focal point means ADJACENT: nothing may sit between the proposal and the
// chips. On the 51-item sheet "Why" sat in between and he read past the rec.
const chipRow = card1.querySelector(".reply-row");
const between = [];
for (let n = rec; n && n !== chipRow; n = n.nextElementSibling) if (n !== rec) between.push(n.tagName);
const recIsLastInDl = rec.parentElement.tagName === "DL" &&
  rec === rec.parentElement.lastElementChild;
check("nothing sits between the proposal and the chips",
  recIsLastInDl && card1.querySelector("dl").nextElementSibling === chipRow.parentElement,
  "the proposal must be the last thing in the dl and the reply block must follow it");

const chips = Array.from(card1.querySelectorAll(".reply-row > .reply-chip[data-v]"));
check("the first chip confirms the proposal and names the action",
  chips[0] && chips[0].getAttribute("data-v") === "fold" &&
  chips[0].textContent === "Keep the fold",
  "expected a first chip of Keep the fold / fold, got " +
  (chips[0] ? chips[0].textContent + " / " + chips[0].getAttribute("data-v") : "none"));
check("no chip anywhere on the sheet says a bare Yes",
  !Array.from(doc.querySelectorAll(".reply-chip")).some((b) => b.textContent.trim() === "Yes"),
  "a bare Yes reads both ways under a proposal — that is what produced the sixteen flips");
check("the stored value names the outcome, so the reply line cannot be misread",
  chips.map((c) => c.getAttribute("data-v")).join(",") === "fold,keep,later",
  "expected fold,keep,later");

const moreRow = card1.querySelector(".reply-more-row");
check("Edit sits behind Other, and Other is a word",
  moreRow && moreRow.hidden &&
  moreRow.querySelector('[data-v="edit"]') &&
  card1.querySelector(".reply-more").textContent === "Other",
  "Edit and Dismiss belong in a hidden row behind an Other toggle");

/* ── 2. the how-to box, and the nested-marker wreckage ── */

const howto = doc.querySelector(".howto");
check("the how-to paragraph lands in the how-to box",
  /Keep the fold/.test(howto.textContent),
  "the box is a <ul>; the old injector looked for </div> and buried this in item 1");
check("the how-to paragraph is not inside the first item",
  !/Click your reply under each item/.test(card1.textContent),
  "that is where it shipped on 2026-09-20");
check("a nested earlier injection strips clean",
  !/a nested injection/.test(out) &&
  doc.getElementById("i3").querySelectorAll(".reply[data-item]").length === 1,
  "card 3 arrived with a marker pair inside a marker pair; a non-greedy strip orphans the outer block");

/* ── 3. a stopping point every twenty items ── */

const rests = Array.from(doc.querySelectorAll(".reply-rest"));
check("a stopping point every twenty items, and none after the last",
  rests.length === 2 && /20 items behind you/.test(rests[0].textContent) &&
  /40 items behind you/.test(rests[1].textContent),
  "45 cards should carry rest markers after 20 and 40, got " + rests.length);
check("the stopping point says the replies are already saved",
  /already saved/.test(rests[0].textContent),
  "stopping has to read as a sitting that ended, not work abandoned");

/* ── 4. the runtime: undo, reversals, and the total in outcome terms ── */

function press(el, sel) { el.querySelector(sel).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); }
const c1 = doc.getElementById("i1").querySelector(".reply");
const store = () => JSON.parse(dom.window.localStorage.getItem("sheet-replies:sheet") || "{}");

// ⭐ OPT-OUT (Sam, 2026-09-21): "set the decision button for each item to your
// recommended and I will change only if needed." The recommendation arrives
// selected, in the MARKUP, so it holds before any script runs.
check("the recommended chip arrives selected",
  c1.querySelector('[data-v="fold"]').getAttribute("aria-pressed") === "true" &&
  /class="reply-chip" data-v="fold" aria-pressed="true"/.test(out),
  "the chip must be pressed in the HTML, not painted on load");
check("an item nobody has touched stores nothing",
  !store()["1"], "a pre-selected chip is not a reply; only a person makes one");
check("and the page says the chip is a proposal, not an answer",
  /Proposed: Keep the fold/.test(c1.querySelector(".reply-state").textContent),
  "a reader cannot otherwise tell a chip they set from one set for them");

press(c1, '[data-v="fold"]');
check("a chip records its verdict", store()["1"] && store()["1"].v === "fold",
  "expected v=fold, got " + JSON.stringify(store()["1"]));
check("a stored reply is stamped as the person's",
  store()["1"].by === "sam", "provenance is what keeps opt-out honest");
check("the state line says a second press undoes it",
  /Press it again to undo/.test(c1.querySelector(".reply-state").textContent),
  "undo is a toggle and has to be discoverable");

press(c1, '[data-v="keep"]');
check("a reversal is counted, and what it was is kept",
  store()["1"].flips === 1 && store()["1"].was === "fold",
  "the sixteen flips were the signal the proposal was not being read");

press(c1, '[data-v="keep"]');
check("undoing returns the item to carrying the proposal", !store()["1"],
  "a stored reply with an empty verdict would read as a deliberate blank, " +
  "which is a different claim from 'I did not touch this'");
check("and the proposal is painted again",
  c1.querySelector('[data-v="fold"]').getAttribute("aria-pressed") === "true", "");

// Other: a verdict chosen behind it has to be visible afterwards.
press(c1, ".reply-more");
check("Other opens the rarer replies", !c1.querySelector(".reply-more-row").hidden, "");
press(c1, '[data-v="edit"]');
check("a verdict from behind Other is still the person's",
  store()["1"] && store()["1"].v === "edit" && store()["1"].by === "sam", "");
// Seeded BEFORE the sheet's own script, which sits at the foot of the page.
const reloaded = new JSDOM(out.replace("<body>",
  `<body><script>localStorage.setItem("sheet-replies:sheet",${JSON.stringify(JSON.stringify(store()))});</script>`),
  { runScripts: "dangerously", url: "https://sheet.test/s", virtualConsole: new VirtualConsole() });
check("a verdict living behind Other is visible when the sheet is reopened",
  !reloaded.window.document.getElementById("i1").querySelector(".reply-more-row").hidden,
  "a selected chip inside a hidden row is a reply the reader cannot see");

/* ── 5. the running total is in outcome terms, and colleges are unioned ── */

const sheet2 = inject(fixture(2), "outcome");
const d2 = new JSDOM(sheet2, { runScripts: "dangerously", url: "https://sheet.test/s", virtualConsole: new VirtualConsole() });
const blocks = d2.window.document.querySelectorAll(".reply[data-item]");
// Two items, 10 rows each, reaching an OVERLAPPING pair of colleges.
blocks[0].setAttribute("data-rows", "10"); blocks[0].setAttribute("data-reach", "AAA BBB");
blocks[1].setAttribute("data-rows", "10"); blocks[1].setAttribute("data-reach", "BBB CCC");
blocks.forEach((b) => b.querySelector('[data-v]').dispatchEvent(new d2.window.MouseEvent("click", { bubbles: true })));
const outcome = d2.window.document.getElementById("reply-outcome").textContent;
check("the bar totals rows settled and colleges reached, never clicks",
  /20 articulation rows settled/.test(outcome) && /3 colleges reached/.test(outcome),
  "expected 20 rows and a UNION of 3 colleges, got: " + outcome);
check("colleges are unioned, so a sitting is not credited with reach it did not have",
  !/4 colleges/.test(outcome),
  "summing per-item college counts would report 4; two items share a college");

let threw = false;
try { execFileSync("python3", ["-c",
  "import sys;sys.path.insert(0,'kb');import _decision_sheet_replies as m;m.replies_block('1',reach=3)"],
  { stdio: "pipe" }); } catch (e) { threw = true; }
check("a college COUNT is refused, because a count cannot be totaled honestly", threw,
  "reach must take the ids; there is no honest union from counts");

/* ── 5b. the sheet opens on the decisions, and Complete tells the session ── */

// Sam, 2026-09-21: "You can delete the intro part of the decision sheet and
// start directly with the decisions" and "Add a Complete or Submit button at
// the end that alerts you in the chat that it's done."
const plain = inject(fixture(3), "plain");
const d3 = new JSDOM(plain, { runScripts: "dangerously", url: "https://sheet.test/s", virtualConsole: new VirtualConsole() });
const doc3 = d3.window.document;
check("a sheet built with no framing carries no intro to scroll past",
  !doc3.querySelector(".sheet-framing") && !/Click your reply under each item/.test(
    (doc3.querySelector(".card") || {}).textContent || ""),
  "the framing block belongs only to a sheet that asks for one");

const submit = doc3.querySelector(".submit");
const lastCard = Array.from(doc3.querySelectorAll("article.card")).pop();
check("Complete sits after the last item",
  submit && submit.previousElementSibling === lastCard,
  "the button is the end of the sitting, so it goes after the last card");
check("Complete is a word, not a glyph",
  doc3.getElementById("submit-btn").textContent.trim() === "Complete", "");

// The send: what it says, and what it refuses to assume.
function completeWith(canSend) {
  const sent = [];
  const stored = [];
  const cm = {
    canSendToClaude: () => Promise.resolve(canSend),
    anchorFor: () => Promise.resolve({ path: "p", x: 1, y: 2 }),
    sendToClaude: (t) => { sent.push(t); return Promise.resolve({ threadId: "t", commentId: "c" }); },
  };
  const db = { collection: () => ({
    doc: (id) => ({ set: (data) => { stored.push({ id, data }); return Promise.resolve(); } }),
    onSnapshot: (next) => { next({ docs: [] }); return () => {}; },
  }) };
  const dom2 = new JSDOM(plain, {
    runScripts: "dangerously", url: "https://sheet.test/s", virtualConsole: new VirtualConsole(),
    beforeParse(w) { w.claude = { use: (n) => Promise.resolve(n === "db" ? db : n === "comments" ? cm : null) }; },
  });
  return { dom: dom2, doc: dom2.window.document, sent, stored };
}

const okRun = completeWith("available");
const later = new Promise((r) => setTimeout(r, 60));
later.then(() => {
  // Answer ONE of three, then complete.
  const first = okRun.doc.querySelector(".reply[data-item]");
  first.querySelector('[data-v="fold"]').dispatchEvent(new okRun.dom.window.MouseEvent("click", { bubbles: true }));
  okRun.doc.getElementById("submit-btn").dispatchEvent(new okRun.dom.window.MouseEvent("click", { bubbles: true }));
  return new Promise((r) => setTimeout(r, 80));
}).then(() => {
  const text = (okRun.sent[0] || {}).text || "";
  check("Complete sends the session a message", okRun.sent.length === 1,
    "sendToClaude is the page's only route to Claude");
  check("the message counts what the reader themselves decided",
    /1 of 3 items your own call/.test(text), "got: " + text.slice(0, 140));
  // ⭐ THE FAILURE OPT-OUT COULD CAUSE, GUARDED. A pre-selected chip looks
  // exactly like an answered one, so a sheet stopped early would hand over
  // verdicts nobody read. They are handed over — that is what Sam asked for —
  // but never as his, and the count says how many rode the proposal.
  check("items taken as proposed are handed over marked, never as the reader's",
    /2 taken as proposed \(not individually reviewed\)/.test(text),
    "got: " + text.slice(0, 200));
  check("the paste line marks them too, where a refused send falls back",
    (text.match(/\(as proposed\)/g) || []).length === 2,
    "the fallback path is exactly where provenance would be lost: " + text.slice(0, 220));
  const committed = okRun.stored.filter((w) => w.id !== "done");
  check("each item taken as proposed is stored stamped by: default",
    committed.filter((w) => w.data.by === "default").length === 2 &&
    committed.filter((w) => w.data.by === "sam").length === 1,
    "got: " + JSON.stringify(committed.map((w) => [w.id, w.data.by])));
  const done = okRun.stored.filter((w) => w.id === "done");
  check("the completion is written to the store, not only sent",
    done.length === 1 && done[0].data.ruled === 1 && done[0].data.as_proposed === 2 &&
    done[0].data.items === 3 && done[0].data.sent === true,
    "the store is the record; the send is the doorbell. got: " + JSON.stringify(done[0] && done[0].data));
  check("the page says it reached the session",
    /Sent\. The session has it/.test(okRun.doc.getElementById("submit-state").textContent), "");
  check("the bar keeps the two kinds apart while working",
    /your call/.test(okRun.doc.getElementById("reply-count").textContent), "");

  // A refused send must still record, and must never claim it was sent.
  const noRun = completeWith("no_session");
  return new Promise((r) => setTimeout(r, 60)).then(() => {
    noRun.doc.getElementById("submit-btn").dispatchEvent(new noRun.dom.window.MouseEvent("click", { bubbles: true }));
    return new Promise((r) => setTimeout(r, 80));
  }).then(() => {
    const done = noRun.stored.filter((w) => w.id === "done");
    check("a refused send still records the completion",
      done.length === 1 && done[0].data.sent === false,
      "a send can be refused for reasons that say nothing about whether the sheet is finished");
    // ⭐ A FAILED DOORBELL MUST NOT READ LIKE A DELIVERED ONE. Sam, 2026-09-21:
    // "I hit complete on the new decision sheet but I don't know if it alerted
    // you in context" — it had not, and the page's wording was quiet enough
    // that he had to come and ask. Three signals now separate the two outcomes,
    // and the words carry it without the color (the glyph/color rule).
    const state = noRun.doc.getElementById("submit-state");
    const okState = okRun.doc.getElementById("submit-state");
    check("a refused send says so in plain words",
      /could NOT reach the session/.test(state.textContent) && !/^Sent\./.test(state.textContent),
      "got: " + state.textContent);
    check("and says the replies are safe and what to do instead",
      /replies are safe/.test(state.textContent) && /decisions done/.test(state.textContent),
      "the record IS readable off the sheet, so a refused send costs a sentence, never the work");
    check("the button itself distinguishes the two outcomes",
      noRun.doc.getElementById("submit-btn").textContent === "Completed — tell Claude" &&
      okRun.doc.getElementById("submit-btn").textContent === "Completed — sent",
      "the reader must not have to read carefully to tell delivered from not");
    // ⭐ SAY IT BEFORE THE PRESS. He should not have to press Complete to find
    // out it cannot reach anyone; canSendToClaude posts nothing and never
    // prompts, so the note above the button knows its own reach at load.
    check("when nothing is listening, the note says so BEFORE the press",
      /No Claude session is listening/.test(noRun.doc.getElementById("submit-note").textContent) &&
      /decisions done/.test(noRun.doc.getElementById("submit-note").textContent),
      "got: " + noRun.doc.getElementById("submit-note").textContent.slice(0, 160));
    check("and when a session IS listening the note stays out of the way",
      !/No Claude session/.test(okRun.doc.getElementById("submit-note").textContent),
      "the reachable case is the common one and needs no warning");
    check("the failed state is marked without relying on color alone",
      /missed/.test(state.className) && !/missed/.test(okState.className) &&
      /could NOT reach/.test(state.textContent),
      "the panel changes AND the words say it");
    report();
  });
});

/* ── 6. the callout's own colors, computed ── */

// A decision sheet is a one-off artifact and does not sit in a11y.config.js, so
// the pairs this module INTRODUCES are checked here instead of by `npm run
// a11y`. The fallbacks are what a sheet defining none of the tokens will paint
// with, so they are what must clear AA — the same failure mode as the chip that
// painted #fff on #fff in 2026-09-06 when --seal-blue was undefined.
function lum(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const PAIRS = [
  ["the proposal's text on its tint", "#1C1C1A", "#E8EFF8"],
  ["the proposal's label on its tint", "#002F6D", "#E8EFF8"],
  ["the stopping point's text on its tint", "#1C1C1A", "#FDF6E3"],
  ["the stopping point's label on its tint", "#8B6800", "#FDF6E3"],
  ["the bar's outcome total on the bar", "#002F6D", "#FFFFFF"],
];
for (const [what, fg, bg] of PAIRS) {
  const r = ratio(fg, bg);
  check(what + " clears AA", r >= 4.5, fg + " on " + bg + " is " + r.toFixed(2) + ":1, AA wants 4.5");
}
// Every rule this rebuild ADDED, checked for a token with no fallback. A
// declaration that is invalid at computed-value time falls back to
// transparent, and this block travels into sheets that define none of these.
const CSS = execFileSync("python3", ["-c",
  "import sys;sys.path.insert(0,'kb');import _decision_sheet_replies as m;print(m.REPLIES_CSS)"],
  { encoding: "utf8" });
const NEW_RULES = /^\s*(\.reply-rec|\.reply-rec-lbl|\.reply-rec-text|\.reply-rec-dl|\.reply-more-row|\.reply-rest|\.reply-rest-lbl|\.reply-outcome|\.sheet-framing)/;
const bare = CSS.split("}")
  .filter((r) => NEW_RULES.test(r.split("{")[0].replace(/\/\*[\s\S]*?\*\//g, "")))
  .flatMap((r) => (r.match(/var\(--[a-z-]+\)/g) || []));
check("every token in the rules this rebuild added carries a fallback",
  bare.length === 0, "no fallback on: " + bare.join(", "));

/* ── 6. idempotency, on the real sheet ── */

const REAL = "docs/visuals/2026-09-20-jev-cr-reference-pairs.html";
const f = path.join(TMP, "real.html");
fs.copyFileSync(REAL, f);
execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", f], { stdio: "pipe" });
const once = fs.readFileSync(f, "utf8");
execFileSync("python3", ["kb/_decision_sheet_replies.py", "--inject", f], { stdio: "pipe" });
check("a second pass over a real sheet changes nothing",
  once === fs.readFileSync(f, "utf8"),
  "the markers nest; the pass has to strip its own work exactly");
check("the real sheet's proposals are promoted, and none is left as a fact",
  !/<dd class="ask">/.test(once) &&
  (once.match(/class="reply-rec reply-rec-dl"/g) || []).length === 51,
  "all 51 proposals should be promoted to the foot of their dl");

/* ── report (called once the async Complete checks have landed) ── */
function report() {
  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) failed++;
    console.log((ok ? "ok   " : "FAIL ") + name + (ok || !why ? "" : "\n       " + why));
  }
  console.log((results.length - failed) + "/" + results.length + " passed");
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}
