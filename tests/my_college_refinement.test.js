// My College tab — Sam's 2026-08-17 refinement pass (jsdom).
//
// Five asks, and each one has a failure mode that is SILENT if it regresses —
// nothing throws, the page just goes back to being worse. That is what these
// guard:
//
//  (1) REDUNDANCY. The box printed its own "Sierra AI" heading + purpose
//      paragraph and then mounted cpl_chat.js, which printed its own heading +
//      description. Two titles, two descriptions, one assistant. A duplicate
//      heading looks deliberate, so nobody files a bug about it — assert the
//      COUNT, in both the mounted and the unmounted case.
//      Plus: the "Your role" select was wired to `state.role`, assigned on
//      change and READ NOWHERE. A control that does nothing is invisible to
//      every test that only checks the page renders.
//  (2) GLYPHS. Sam's standing rule (cpl_memory cobi-no-cheesy-glyphs-design-rule,
//      2026-08-14) was recorded and then NOT applied — the Admin tab shipped
//      covered in emoji the same week. "A design rule needs a consumer or a
//      test, not a memory row." This file is that test.
//  (3) SIERRA AI + the Whitney mark, from the shared static SIERRA_MARK.
//  (4) THE LOG GROWS, and the page follows it. Growth WITHOUT page-follow is a
//      regression, not a fix: a growing box is not internally scrollable, so
//      scrollTop becomes a no-op while the answer walks off the fold.
//  (5) THE WIDTH, with the measure cap moved onto prose so tables can breathe.
//
// Run from repo root: `npm test` (or `node tests/my_college_refinement.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
// ⚠ val() guards the CHECK; the DRIVER is the other half. A throw in the
// imperative setup between checks skips every check after it and reports zero
// failures — so each block that can throw is wrapped.
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — setup did not throw", false, String(e && e.message)); }
}

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const CPL_HTML = fs.readFileSync("CPL_Dashboard.html", "utf8");
const IDX_HTML = fs.readFileSync("index.html", "utf8");

// Pictographic emoji + the specific dingbats this pass removed. Deliberately
// NOT a blanket "non-ASCII" scan: this repo's prose is full of legitimate
// em-dashes, curly quotes and accented college names, and the muted CO-blue
// disclosure caret (▸) is explicitly allowed by Sam's rule.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{1F900}-\u{1F9FF}☀-➿⬀-⯿️✅❌⏳⭐✔✖⇗↗◐]/u;

function loadTab(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");     // team-gated tab
  w.localStorage.setItem("cplSierraAudience.v1", "student");
  w.fetch = function () { return new Promise(function () {}); };  // never resolves
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  function run(src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  }
  run(TEAM);
  // withoutChat models the real fallback: cpl_chat.js failed to load, so
  // mountAssistant() returns false and nothing hoists.
  if (!opts.withoutChat) run(CHAT);
  run(BRIEFING);
  const root = w.document.getElementById("college-briefing-root");
  /* The tab now opens on a SCOPE question (Sam, 2026-08-17) and shows no
   * assistant, no title and no sections until it is answered — so every check
   * in this file needs the flow advanced past it first. Set on the module's own
   * state rather than by clicking, because these are structural assertions
   * about the briefing view, not about how one arrives at it; the picker itself
   * is guarded in my_college_scope.test.js. */
  if (!opts.noScope) {
    w.CPL_COLLEGE_BRIEFING._state.scope = opts.scope || "college";
    // …and a college, because the college scope shows the ENTITY picker until
    // one is chosen. scopeReady() is what the briefing view waits on.
    if ((opts.scope || "college") === "college" && !opts.noCollege) {
      w.CPL_COLLEGE_BRIEFING._state.college = opts.college || "Allan Hancock College";
    }
  }
  w.CPL_COLLEGE_BRIEFING.render(root);
  return { w: w, root: root };
}

// ── (1a) ONE heading, with the chat mounted ────────────────────────────────
block("(1a)", function () {
  const { root } = loadTab();
  const box = root.querySelector(".cb-assist");
  check("(1a) the assistant box renders", !!box);

  const heads = box ? box.querySelectorAll("h1, h2, h3") : [];
  check("(1a) ⭐ EXACTLY ONE heading in the assistant box", heads.length === 1,
    "found " + heads.length + " — the duplicate this pass removed");
  check("(1a) and it is Sierra AI", heads.length === 1 && /Sierra AI/.test(heads[0].textContent));

  // The old duplicate, by its own markers. Either one back = the bug is back.
  check("(1a) the tab's own purpose paragraph is gone", !box.querySelector(".cb-purpose"));
  check("(1a) the 'Answers come from…' tag is gone",
    !/Answers come from the CPL Initiative records/.test(box.textContent));
  check("(1a) 'CPL Assistant' is not a heading here",
    !Array.prototype.some.call(heads, function (h) { return /CPL Assistant/.test(h.textContent); }),
    "Sam: change the CPL Assistant title to Sierra AI");

  // Exactly one description too — two paragraphs saying the same thing was
  // half the redundancy, and a heading count alone would not catch it.
  check("(1a) the box describes her once, not twice",
    (box.textContent.match(/Ask her anything/g) || []).length === 1);
});

// ── (1b) reading order: title → what she is → pickers → chat ───────────────
block("(1b)", function () {
  const { root } = loadTab();
  const box = root.querySelector(".cb-assist");
  const head = box.querySelector("#cb-assist-head");
  const pick = box.querySelector("#cb-assist-pick");
  const mount = box.querySelector("#cb-assistant-mount");
  check("(1b) the heading slot holds the widget's OWN intro (hoisted)",
    !!head && !!head.querySelector(".cplchat-intro"),
    "not a forked copy — the fork is what created the duplicate");
  check("(1b) …and the intro no longer sits inside the mount",
    !!mount && !mount.querySelector(".cplchat-intro"));
  check("(1b) the fallback heading was dropped once the real one arrived",
    !box.querySelector(".cb-assist-fallback"));
  // DOCUMENT_POSITION_FOLLOWING === 4
  check("(1b) heading comes BEFORE the pickers",
    !!(head.compareDocumentPosition(pick) & 4));
  check("(1b) pickers come BEFORE the chat",
    !!(pick.compareDocumentPosition(mount) & 4));
});

// ── (1c) the fallback: still exactly one heading with no chat module ───────
block("(1c)", function () {
  const { root } = loadTab({ withoutChat: true });
  const box = root.querySelector(".cb-assist");
  const heads = box.querySelectorAll("h1, h2, h3");
  check("(1c) ⭐ chat module absent → STILL exactly one heading", heads.length === 1,
    "removing the duplicate must not trade it for a MISSING title");
  check("(1c) …and it still says Sierra AI", heads.length === 1 && /Sierra AI/.test(heads[0].textContent));
});

// ── (1d) the dead role picker is gone ──────────────────────────────────────
block("(1d)", function () {
  const { root } = loadTab();
  check("(1d) ⭐ no 'Your role' select", !root.querySelector("#cb-role"),
    "state.role was assigned on change and read nowhere — a decoy control");
  check("(1d) its options are gone from the source too",
    !/Anyone at the college/.test(BRIEFING) || /READ NOWHERE/.test(BRIEFING),
    "if the labels come back, they must come back wired to something");
  /* RESCOPED, not dropped (Sky167). The college picker moved to the scope
   * flow's second step (Sam, 2026-08-17), so it is legitimately absent from the
   * briefing view — but the positive control it provided is the whole reason
   * this block means anything: without one, "no #cb-role" would pass on a page
   * that rendered no selects at all. So the control now looks where the picker
   * actually lives, which also asserts it still exists. */
  const step2 = loadTab({ scope: "college", noCollege: true }).root;
  check("(1d) the college picker survives, on the choose-a-college step (positive control)",
    !!step2.querySelector("#cb-college"));
  check("(1d) …and the dead role select is not there either", !step2.querySelector("#cb-role"));
  // The chips ARE the role picker now, and they are on the same screen.
  const chips = root.querySelectorAll("#cplchat-audience .cplchat-aud-chip");
  check("(1d) the audience chips are the one role picker, and they render",
    chips.length === 5);
});

// ── (2) no emoji in anything a person reads ────────────────────────────────
block("(2)", function () {
  const { w, root } = loadTab();
  const text = root.textContent || "";
  const offenders = (text.match(new RegExp(EMOJI.source, "gu")) || []);
  check("(2) ⭐ no emoji in the rendered My College tab", offenders.length === 0,
    "found: " + JSON.stringify(offenders.slice(0, 8)));

  const labels = (w.CPL_CHAT.AUDIENCES || []).map(function (a) { return a.label; });
  check("(2) audience chip labels are plain text",
    labels.length === 5 && !labels.some(function (l) { return EMOJI.test(l); }),
    JSON.stringify(labels));
  check("(2) …and they still SAY who you are (text kept, not just stripped)",
    labels.join("|") === "Student / future student|Faculty|College administrator|Employer / industry|Civic leader");

  // Buttons whose meaning was carried ONLY by a glyph had to become words, or
  // removing the glyph would have destroyed the control.
  const html = root.innerHTML;
  /* The yellow Beta box was deleted 2026-08-21 (Sam) and its two duties moved
   * into the Note sentence: say she is unfinished, say not to type personal
   * information. Guarded as CONTENT, not as a box — deleting the box was the
   * ask; deleting the caution with it would not have been. */
  check("(2) ⭐ the caution survived the box being deleted",
    /development phase/.test(text) && /don.t enter personal information/i.test(text)
      && !/Beta — in development/.test(text) && !/🧪/.test(html),
    JSON.stringify(text.slice(0, 200)));

  // Resources live in a section that only renders once the briefing DATA has
  // landed, and this fetch never resolves — so read the pure builder rather
  // than asserting against markup that was never emitted. (A check that can
  // only pass on an unreachable path is not a guard; it is a vacuous one.)
  const resWrap = w.document.createElement("div");
  resWrap.innerHTML = w.CPL_COLLEGE_BRIEFING._resourcesHtml(true);
  check("(2) the resource list actually rendered (positive control)",
    resWrap.querySelectorAll(".cb-resi a").length >= 4);
  check("(2) the resource links dropped the ↗ …", !/↗/.test(resWrap.innerHTML) && !/↗/.test(html));
  check("(2) …but kept the cue, for a screen reader",
    /\(opens in a new tab\)/.test(resWrap.textContent) && !!resWrap.querySelector(".cb-resi a .cb-sr"),
    "the arrow was the only 'this leaves the page' warning");
});

// ── (2b) the two glyphs that carried meaning became words ──────────────────
block("(2b)", function () {
  const { w } = loadTab();
  const M = w.CPL_COLLEGE_BRIEFING;
  // ESS outcome marks: the glyph WAS the content, with no text beside it.
  const marks = ["met", "partial", "not", "na", "pending"].map(function (s) {
    const d = w.document.createElement("div");
    d.innerHTML = M._essMark ? M._essMark({ state: s }) : "";
    return d.textContent;
  });
  check("(2b) ESS outcome marks are words, not glyphs",
    marks.every(function (m) { return m && m.length > 1 && !EMOJI.test(m); }),
    JSON.stringify(marks));
  check("(2b) …and each state is still DISTINCT",
    new Set(marks).size === marks.length, JSON.stringify(marks));

  // Feedback buttons: a bare 👍 announces as "thumbs up", not as what it means.
  check("(2b) ⭐ the rating buttons carry a visible text label",
    /'up', 'Helpful'/.test(CHAT) && /'down', 'Not helpful'/.test(CHAT),
    "removing the thumb without a label would have destroyed the control");
  check("(2b) …and the aria-label is still the fuller sentence",
    /This answer was helpful/.test(CHAT) && /This answer was not helpful/.test(CHAT));
  check("(2b) the Copy pill is a word", /}, 'Copy'\);/.test(CHAT) && !/📋/.test(CHAT));
});

// ── (3) the Whitney mark rides with the title ──────────────────────────────
block("(3)", function () {
  const { w, root } = loadTab();
  const title = root.querySelector(".cb-assist .cplchat-title");
  check("(3) the heading is the titled element", !!title && /Sierra AI/.test(title.textContent));
  const svg = title && title.querySelector(".cplchat-title-mark svg");
  check("(3) ⭐ it carries the mountain mark as an inline SVG", !!svg);
  check("(3) the mark is decorative to a screen reader (the text says it)",
    !!title && title.querySelector(".cplchat-title-mark").getAttribute("aria-hidden") === "true");
  check("(3) it is the SAME static mark the answer avatars use",
    !!svg && !!w.CPL_CHAT.SIERRA_MARK && /circle/.test(w.CPL_CHAT.SIERRA_MARK)
      && svg.querySelectorAll("path").length === 2,
    "one identity — a second copy could drift");
});

// ── (4) the log grows, and the page follows it ─────────────────────────────
block("(4)", function () {
  [["CPL_Dashboard.html", CPL_HTML], ["index.html", IDX_HTML]].forEach(function (pair) {
    const rule = (pair[1].match(/\.cplchat-log \{[^}]*\}/) || [""])[0];
    check("(4) " + pair[0] + ": the log no longer has a FIXED height",
      !!rule && !/[^-]height: ?460px/.test(rule), rule.slice(0, 160));
    check("(4) " + pair[0] + ": it grows between a floor and a cap",
      /min-height:/.test(rule) && /max-height:/.test(rule), rule.slice(0, 160));
  });
});

// Async: scrollDown() defers a frame (requestAnimationFrame), so every drive
// has to be followed by a tick. Checking synchronously would have found zero
// calls every time and passed the "not yanked" assertion for the wrong reason.
async function scrollFollowChecks() {
  const { w, root } = loadTab();
  const log = root.querySelector(".cplchat-log");
  check("(4b) the chat log mounted on this tab", !!log);
  if (!log) return;
  const frame = () => new Promise((r) => setTimeout(r, 2));

  // jsdom has no layout, so the page-follow is driven by stubbing the geometry
  // the real code reads. Without the stub every rect is 0 and the follow
  // correctly does nothing — which is itself the "already in view" case.
  const calls = [];
  w.scrollBy = function (o) { calls.push(o); };
  Object.defineProperty(w, "innerHeight", { value: 800, configurable: true });

  log.getBoundingClientRect = function () { return { top: 0, bottom: 400 }; };
  w.CPL_CHAT._scrollDown();
  await frame();
  check("(4b) in view → the page is NOT scrolled", calls.length === 0,
    "a page that jumps when nothing moved is worse than one that never follows");

  log.getBoundingClientRect = function () { return { top: 0, bottom: 2000 }; };
  w.CPL_CHAT._scrollDown();
  await frame();
  check("(4b) ⭐ below the fold → the page follows, DOWNWARD",
    calls.length === 1 && calls[0].top > 0, JSON.stringify(calls));

  // A reader who scrolled up keeps control until they ask again.
  w.CPL_CHAT._setStick(false);
  w.CPL_CHAT._scrollDown();
  await frame();
  check("(4b) ⭐ a reader who scrolled away is NOT yanked back", calls.length === 1,
    "the failure mode that makes a chat UI unusable, and it is silent");
  w.CPL_CHAT._setStick(true);
  w.CPL_CHAT._scrollDown();
  await frame();
  check("(4b) …and asking again re-arms the follow", calls.length === 2);
}

// ── (5) the width, and the measure ─────────────────────────────────────────
block("(5)", function () {
  check("(5) Rule 4: the two HTMLs are identical", CPL_HTML === IDX_HTML);
  [["CPL_Dashboard.html", CPL_HTML], ["index.html", IDX_HTML]].forEach(function (pair) {
    const rule = (pair[1].match(/\n\s*\.cplchat \{[^}]*\}/) || [""])[0];
    check("(5) " + pair[0] + ": the 880px cap is gone", !!rule && !/max-width: ?880px/.test(rule), rule.trim());
    // Mobile gets MORE of the screen, not less — a phone has none to waste.
    const mob = (pair[1].match(/@media \(max-width: ?600px\) \{[\s\S]{0,700}?\n\s*\}\n/) || [""])[0];
    check("(5) " + pair[0] + ": the mobile block sizes the log too",
      /\.cplchat-log \{[^}]*max-height/.test(mob), mob.slice(0, 200));
  });
});

block("(5b)", function () {
  const { w, root } = loadTab();
  const css = w.document.getElementById("cplchat-aud-css");
  check("(5b) ⭐ the measure cap moved onto PROSE, not the bubble",
    !!css && /\.cplchat-bubble > p[^{]*\{[^}]*max-width: ?82ch/.test(css.textContent),
    "so a table or course list can use the width a paragraph must not");
  const bcss = w.document.getElementById("cpl-briefing-css");
  check("(5b) the tab ships a mobile breakpoint", !!bcss && /@media \(max-width:640px\)/.test(bcss.textContent));
  check("(5b) …and it makes the pickers full-width rather than 220px-ragged",
    !!bcss && /\.cb-bar select\{width:100%/.test(bcss.textContent));
  check("(5b) the visually-hidden helper is not display:none",
    !!bcss && /\.cb-sr\{position:absolute/.test(bcss.textContent) && !/\.cb-sr\{[^}]*display:none/.test(bcss.textContent),
    "display:none would drop it from the accessibility tree with the pixels");
  // Accessibility is a STANDING expectation (Sam, 2026-08-16), not a one-off.
  check("(5b) the assistant box is labelled for a screen reader",
    root.querySelector(".cb-assist").getAttribute("aria-label") === "Sierra AI");
});

// ── report ──
(async function () {
  // The async block runs LAST so its results land after the synchronous ones;
  // its own setup is wrapped for the same reason `block()` is.
  try { await scrollFollowChecks(); }
  catch (e) { check("(4b) — setup did not throw", false, String(e && e.message)); }

  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nmy_college_refinement.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
