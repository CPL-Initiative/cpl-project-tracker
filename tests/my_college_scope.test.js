// My College — the scope-first flow. Sky167, 2026-08-17.
//
// Sam's asks against this tab: open on a CHOICE rather than a title; curate the
// second list from the first answer; only then welcome the reader and show the
// sections; make Sierra collapsible-but-open; add expand/collapse all and a
// report button.
//
// ⭐ TWO OF THE FIVE SCOPES HAVE NO DATA, AND THAT IS THE INTERESTING PART.
// Strong Workforce region and Academic Senate region do not exist anywhere in
// this repo. The region data we DO hold (`college_geo.region`) is a third,
// unrelated scheme — a hand-authored ~10-way macro-region built for Sierra's
// "which colleges near me" ranking. SWP has EIGHT regional consortia with
// different boundaries; the ASCCC has FOUR areas. Wiring college_geo behind
// either label would silently mis-group a college's peers in a view people act
// on. So those two render DISABLED WITH A REASON, and this file pins that —
// because the tempting "fix" for a disabled button is to point it at the
// nearest available column.
//
// Run from repo root: `npm test` (or `node tests/my_college_scope.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");

const COLLEGES = ["Allan Hancock College", "Bakersfield College", "Cabrillo College"];

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  if (opts.remember) w.localStorage.setItem("cplMyCollegeScope.v1", JSON.stringify(opts.remember));
  w.fetch = function () { return new Promise(function () {}); };
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  [TEAM, CHAT, BRIEFING].forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  const root = w.document.getElementById("college-briefing-root");
  // render() returns early when there is no briefing object, so the roll-up and
  // the sections never appear. A minimal one is enough for the structural
  // assertions here; the funding engine has its own tests.
  M._state.data = {
    colleges: COLLEGES, summaryByName: opts.summary || {}, raw: {},
    briefing: opts.noBriefing ? null
      : { unread: [], leads: [], programs: [], strategyTotal: 3, scenario: "Scenario 1", year: "1" }
  };
  if (opts.scope) M._state.scope = opts.scope;
  if (opts.college) M._state.college = opts.college;
  if (opts.district) M._state.district = opts.district;
  M.render(root);
  return { w: w, M: M, root: root };
}

// ── 1. The tab opens on the question, and on nothing else ─────────────────────
block("step 1", function () {
  const { root } = load();
  const txt = root.textContent || "";
  check("the scope question renders", /What would you like to look at\?/.test(txt));
  // ⭐ Sam: delete the main title so the choice is the page. A title over one
  // question is furniture, and it is the thing he asked to remove.
  check("⭐ NO welcome title before a choice is made", !/Welcome/.test(txt));
  check("no Sierra box before a choice is made", !root.querySelector(".cb-assist"));
  check("no collapsible sections before a choice is made",
    root.querySelectorAll("details.cb-sec").length === 0);
  check("no report button before a choice is made", !root.querySelector("#cb-report"));

  const opts = root.querySelectorAll(".cb-scope-b");
  check("all five scopes are offered", opts.length === 5);
  const enabled = root.querySelectorAll(".cb-scope-b:not([disabled])");
  check("three are usable — college, district, statewide", enabled.length === 3);
  const keys = Array.prototype.map.call(enabled, function (b) { return b.getAttribute("data-scope"); });
  check("…and they are the three with data",
    JSON.stringify(keys.sort()) === JSON.stringify(["college", "district", "statewide"]));
});

// ── 2. ⭐ A scope with no data says so, rather than pointing somewhere wrong ───
block("disabled scopes", function () {
  const { root } = load();
  const off = root.querySelectorAll(".cb-scope-b[disabled]");
  check("⭐ the two region scopes render, disabled", off.length === 2);
  check("…both are still READABLE as labels",
    Array.prototype.every.call(off, function (b) { return /[A-Za-z]{4}/.test(b.textContent); }));
  check("⭐ each says WHY it is off, not just that it is",
    Array.prototype.every.call(off, function (b) {
      const t = b.getAttribute("title") || "";
      return t.length > 30 && /list|export|MAP Dashboard/i.test(t);
    }),
    "a disabled control with no reason reads as broken, not as pending");
  check("neither is silently hidden",
    /Strong Workforce/.test(root.textContent) && /Academic Senate/.test(root.textContent));
  // ⚠ The trap this pins: college_geo.region exists and is RIGHT THERE. It is
  // a proximity grouping, not SWP consortia and not ASCCC areas.
  check("⚠ no region grouping is wired to either label yet",
    !/college_geo/.test(BRIEFING.split("var SCOPES")[1].split("];")[0] || ""),
    "college_geo.region is a ~10-way proximity map — not SWP (8) and not ASCCC (4)");
});

// ── 3. The second list is curated from the first answer ───────────────────────
block("step 2", function () {
  const c = load({ scope: "college" });
  check("college scope offers a college picker", !!c.root.querySelector("#cb-college"));
  check("…and still no welcome title", !/Welcome/.test(c.root.textContent));
  check("…and a way back to the question", !!c.root.querySelector("[data-scope-clear]"));

  const d = load({ scope: "district" });
  check("district scope does NOT offer the college picker", !d.root.querySelector("#cb-college"));
  check("district scope asks for a district", /Choose your district/.test(d.root.textContent));

  // Statewide needs no second pick — it IS the whole set, so it goes straight
  // through. A second list with one entry would be a step that asks nothing.
  const s = load({ scope: "statewide" });
  check("⭐ statewide skips the second list entirely",
    /Statewide CPL view/.test(s.root.textContent) && !s.root.querySelector("#cb-college"));
});

// ── 4. The title arrives with the choice ──────────────────────────────────────
block("step 3 header", function () {
  const { root, M } = load({ scope: "college", college: "Allan Hancock College" });
  check("⭐ the welcome title names the choice",
    /Welcome, Allan Hancock College/.test(root.textContent));
  check("the intro points at the two next steps",
    /Ask Sierra/.test(root.textContent) && /open a section/.test(root.textContent));
  check("the intro is SHORT — one sentence, not a second description of Sierra",
    (root.querySelector(".cb-welcome-p").textContent || "").length < 160,
    "she introduces herself immediately below; a paragraph here is the #1231 duplicate again");
  check("a report button is offered", !!root.querySelector("#cb-report"));
  check("expand all / collapse all are offered", root.querySelectorAll("[data-all]").length === 2);
  check("switching entity does not cost a trip through the scope question",
    !!root.querySelector("[data-entity-clear]"));

  // Statewide is named, not blanked — "Welcome, " with nothing after it is the
  // shape of a bug, and scopeLabel() returning null would produce exactly that.
  check("statewide has its own title", M._scopeLabel.call(null) !== "");
  const s = load({ scope: "statewide" });
  check("⭐ statewide is titled, not 'Welcome, '",
    /Statewide CPL view/.test(s.root.textContent) && !/Welcome,\s*</.test(s.root.innerHTML));
});

// ── 5. Sierra: collapsible, open by default, closed by Collapse all ───────────
block("sierra section", function () {
  const { root, M } = load({ scope: "college", college: "Allan Hancock College" });
  const sec = root.querySelector('details.cb-sec[data-sec="sierra"]');
  check("Sierra is a collapsible section", !!sec);
  check("⭐ …expanded by default", !!sec && sec.open);
  check("…and her summary names her",
    !!sec && /Sierra AI/.test(sec.querySelector("summary").textContent));

  // Sam chose the literal reading: Collapse all closes everything, Sierra too.
  M._setAllSections(false, root);
  const after = root.querySelector('details.cb-sec[data-sec="sierra"]');
  check("⭐ Collapse all closes Sierra as well", !!after && !after.open,
    "Sam's ruling: a control that silently exempts one section reads as broken");
  check("…and every other section too",
    Array.prototype.every.call(root.querySelectorAll("details.cb-sec"), function (d) { return !d.open; }));

  M._setAllSections(true, root);
  check("Expand all opens every section",
    Array.prototype.every.call(root.querySelectorAll("details.cb-sec"), function (d) { return d.open; }));
  check("…and the id list covers every section actually rendered",
    Array.prototype.every.call(root.querySelectorAll("details.cb-sec"), function (d) {
      return M._SECTION_IDS.indexOf(d.getAttribute("data-sec")) !== -1;
    }),
    "a section missing from SECTION_IDS is one Expand all silently skips");
});

// ── 6. ⭐ Asking Sierra must not type into a closed drawer ────────────────────
// The #1166 failure, one level up: the Sierra Training hand-off and the
// suggested questions both drive this widget, and a prefill into a collapsed
// <details> goes into a box nobody can see. Silent — the button looks unwired.
block("ask while collapsed", function () {
  const { root, M } = load({ scope: "college", college: "Allan Hancock College" });
  M._setAllSections(false, root);
  check("precondition: Sierra is closed",
    !root.querySelector('details.cb-sec[data-sec="sierra"]').open);
  M._askSierra("How is Allan Hancock College doing on CPL?");
  check("⭐ asking re-opens the Sierra section", !!M._state.open.sierra,
    "a prefill into a closed drawer is the invisible-input bug again");
});

// ── 7. ⭐ A roll-up must not leak a withheld college ──────────────────────────
// k=10 suppression withholds 13 colleges statewide. If the total included them,
// total − visible = the withheld figure, and a two-college district hands it
// over in one subtraction.
block("rollup disclosure", function () {
  const summary = {
    "Allan Hancock College": { articulated_waiting: 100, students: 50, suppressed: false },
    "Bakersfield College":   { articulated_waiting: 900, students: 400, suppressed: true },
    // Cabrillo deliberately absent from the summary entirely.
  };
  const { M } = load({ scope: "district", district: "Test CCD", summary: summary });
  const html = M._rollup(COLLEGES, null);
  check("the withheld college is named but not numbered", /withheld/.test(html));
  check("⭐ the total EXCLUDES the withheld college", /\b100\b/.test(html) && !/\b1,000\b/.test(html),
    "100 + 900 = 1,000 would hand back the suppressed figure by subtraction");
  check("⭐ the total is described as covering only the listed colleges",
    /nothing else is folded in/.test(html));
  check("the withheld college is COUNTED, so the total is not mistaken for the whole",
    /1 college is withheld/.test(html));
  check("…and it says why withheld is not zero", /not zero activity/.test(html));
  check("⭐ an ABSENT college is distinguished from a withheld one",
    /absent measurement, not a measured zero/.test(html) && /1 college is not in the credit summary/.test(html),
    "folding the two turns 'never measured' into 'does none'");
  check("only 1 of 3 colleges is claimed to be in the totals", /1 of 3/.test(html));
  check("every college is still listed and reachable",
    COLLEGES.every(function (n) { return html.indexOf(n) !== -1; }));
});

// ── 7b. ⭐ The briefing is a DOCUMENT, and it reads the screen ────────────────
// Sam, 2026-08-17: "Briefing should be docx". The property that matters is not
// the file format but where the figures come from: every one is lifted from the
// section the reader just looked at, so the document cannot disagree with the
// tab — and the disclosure control comes along for free, because a withheld
// college reads "withheld" on screen and therefore in the file.
block("briefing blocks", function () {
  const summary = {
    "Allan Hancock College": { articulated_waiting: 100, students: 50, suppressed: false },
    "Bakersfield College":   { articulated_waiting: 900, students: 400, suppressed: true }
  };
  // Statewide rather than district: districtIndex() reads the funding roster,
  // which is a separate lazy script and is not loaded here, so a district would
  // resolve to zero colleges and the table would be a header row alone.
  // Statewide's group is the whole college list, so it has real rows.
  const { M, root } = load({ scope: "statewide", summary: summary });
  const blocks = M._briefingBlocks(root);
  check("the extractor returns blocks from the rendered tab", blocks.length > 0);
  check("⭐ the Sierra chat is NOT in the document",
    !blocks.some(function (b) { return /Sierra AI/.test(b.text || ""); }),
    "a transcript of an empty chat box is not a briefing");

  // A closed section still contributes: unlike the print route this replaced,
  // nothing has to be expanded first, so a briefing of empty headings is
  // structurally impossible.
  M._setAllSections(false, root);
  const closed = M._briefingBlocks(root);
  check("⭐ a CLOSED section still contributes its content",
    closed.length === blocks.length && closed.length > 0,
    "details content is in the DOM regardless of open state");

  const kinds = closed.map(function (b) { return b.kind; });
  check("section headings are carried", kinds.indexOf("h2") !== -1);
  check("the closed-section summary figure leads its section", kinds.indexOf("lead") !== -1);
  check("no block is empty",
    closed.every(function (b) { return b.kind === "table" || (b.text || "").length > 0; }));
  check("a table comes through as rows, not flattened prose",
    closed.every(function (b) { return b.kind !== "table" || (b.rows && b.rows.length > 1); }));
  check("…and its cells are not concatenated into one string",
    closed.every(function (b) { return b.kind !== "table" || b.rows.every(function (r) { return r.length > 1; }); }));
  check("the visually-hidden new-tab cue does not reach the document",
    !closed.some(function (b) { return /opens in a new tab/.test(b.text || ""); }));
});

// ── 8. The remembered choice, and its escape hatch ────────────────────────────
block("persistence", function () {
  const r = load({ remember: { scope: "college", college: "Cabrillo College", district: "" } });
  r.M.activate();
  check("a remembered scope is restored", r.M._state.scope === "college");
  check("…and the remembered college with it", r.M._state.college === "Cabrillo College");

  // ⚠ A remembered scope that is not READY must not strand anyone on a blank
  // screen — e.g. a "swp" saved by a future build, read by this one.
  const bad = load({ remember: { scope: "swp" } });
  bad.M.activate();
  check("⚠ a remembered scope with no data is ignored, not restored",
    bad.M._state.scope !== "swp");
  // activate() puts the tab into its loading state on the way to fetching, so
  // render explicitly to see where the reader actually lands.
  bad.M._state.loading = false;
  bad.M.render(bad.root);
  check("…and the reader lands on the question instead",
    /What would you like to look at\?/.test(bad.root.textContent));
});

// ── 9. Words, not glyphs — the standing rule, on the new markup ───────────────
block("glyphs", function () {
  const GLYPH = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}✓✔⚠]/u;
  const a = load().root.textContent || "";
  const b = load({ scope: "college", college: "Allan Hancock College" }).root.textContent || "";
  check("no glyphs on the scope picker", !GLYPH.test(a), JSON.stringify((a.match(GLYPH) || [])[0]));
  check("no glyphs on the briefing view", !GLYPH.test(b), JSON.stringify((b.match(GLYPH) || [])[0]));
  // Paired, so a strip that blanked the controls could not pass the scan.
  check("…and the controls still carry their words",
    /Expand all/.test(b) && /Collapse all/.test(b) && /Create a briefing/.test(b));
});

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; console.log("  ok   " + r[0]); }
  else console.log("  FAIL " + r[0] + (r[2] ? "  (" + r[2] + ")" : ""));
});
console.log("\nmy_college_scope: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
