// tests/funding_model_page.test.js
//
// The LIVE funding explainer (funding-model/index.html), served from GitHub
// Pages. It replaced a published snapshot that had to be rebuilt and
// re-republished by hand every time a dial moved — and therefore silently
// disagreed with the model it claims to explain (Sam, 2026-08-23: he changed
// two floors, the tab recalculated, and the explainer did not).
//
// What this guards: the page computes from the ENGINE, carries no baked
// figures, and says so rather than showing stale ones if the computation fails.
//
// Run from repo root: `npm test` (or `node tests/funding_model_page.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "funding-model", "index.html"), "utf8");

// ── it must not ship a payload ────────────────────────────────────────────
check("the page carries NO baked payload block", html.indexOf('id="DATA"') === -1);

// A literal currency figure in the prose must carry an id, so the painter can
// fill it and the defaults lint can reach it. The every-college lead-in named
// the carve-out in a bare <b class="num">, so it alone still said $1,000,000
// after the figure moved to $1.8M while the page's three other mentions were
// repainted — and three agreeing with one dissenting reads as a deliberate
// exception rather than an oversight. This is a LIVE page: an unpainted figure
// here is wrong from the first model change, not merely at build time.
{
  const bare = (html.match(/<b[^>]*class="num"[^>]*>\$[0-9,]+<\/b>/g) || [])
    .filter(function (t) { return !/\bid=/.test(t); });
  check("every hard-coded money figure in the prose carries an id" +
        (bare.length ? " — bare: " + bare.join(", ") : ""), bare.length === 0);
}
// ── AND A FIGURE THAT IS NOT A DOLLAR SIGN ───────────────────────────────
// The guard above catches a bare "$..." only, and TWO of the page's load-bearing
// claims were not currency: the allocation basis ("all 115 … 1,069,182" — the
// model divides by combined credit + noncredit FTES over 118) and the funding
// factors ("all three currently set to 1.0" — Year 1 is 0.5). Both were written
// when they were true, survived the one-pool port, and were still asserting the
// retired model on a LIVE page nine days later. The painter only overwrites
// elements that carry an id, so an unpainted figure is not stale at build time —
// it is wrong from the first dial change.
//
// So: a large bare number or a bare N.N factor inside the page's prose has to
// carry an id. FTES counts, roster counts and factors are the shapes that bit
// us; years, section numbers and statute citations are not figures a dial moves.
{
  const body = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const prose = body.replace(/<script[\s\S]*?<\/script>/g, "");
  const offenders = [];
  // A thousands-separated number (1,069,182) not already inside an id-bearing tag.
  const idTag = /<(?:b|span|strong|td|div|p)[^>]*\bid=/;
  prose.split(/(?=<)/).forEach(function (chunk) {
    if (idTag.test(chunk)) return;                 // painted — the point of the rule
    const m = chunk.match(/>[^<]*?\b(\d{1,3}(?:,\d{3})+)\b/);
    if (m) offenders.push(m[1]);
  });
  check("no unpainted thousands-figure in the prose" +
        (offenders.length ? " — bare: " + offenders.join(", ") : ""), offenders.length === 0);
}

check("the page loads the engine and the shared payload builder",
  /src="\.\.\/cpl_funding\.js"/.test(html) &&
  /src="\.\.\/cpl_funding_data\.js"/.test(html) &&
  /src="\.\.\/funding_model_payload\.js"/.test(html));
check("it is a complete document, not an artifact fragment",
  /^<!doctype html>/i.test(html) && /<html lang="en">/.test(html) && /<\/body>\s*<\/html>/.test(html));
check("it repaints when the model changes, rather than painting once",
  /onModelChange/.test(html) && /ensureLoaded/.test(html));

// ── it must actually paint, from the engine ───────────────────────────────
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
const win = dom.window;
win.CPL_FUNDING_NO_REMOTE = true;          // no Supabase from a test
win.scrollTo = function () {};
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
win.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
// The page's own two inline scripts, in document order.
const inline = Array.from(dom.window.document.querySelectorAll("script:not([src])"))
  .map(function (s) { return s.textContent; });
inline.forEach(function (code) { win.eval(code); });

const doc = win.document;
const D = win.CPL_FUNDING_EXPLAINER.buildPayload(win.CPL_FUNDING_TAB, win.CPL_FUNDING);
const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

check("the engine's own figures reach the page's headline numbers",
  doc.getElementById("f-main").textContent === money(D.net_main) &&
  doc.getElementById("f-floorv").textContent === money(D.pool.floor));
// The institution table is the Implementation Funding tab's OWN college
// section since 2026-09-02 (Sam: the explainer is the public view, with "the
// college rows" in it), rendered into #cplFundingMount by cpl_funding.js in
// embed mode — one implementation of the rows and the drill-in, not a copy
// painted from the payload. So the page's rows are the tab's rows, and the
// payload's roster (which still feeds the basis and the cards) must agree.
check("the institution table is the tab's own rendering — one row per institution in the payload's roster",
  doc.querySelectorAll("#cplFundingMount tr.cplfund-row").length === D.rows.length && D.rows.length > 100);
check("...rendered in EMBED mode: the table, its footnote, and nothing of the tab's chrome",
  !!doc.querySelector("#cplFundingMount .cplfund-embed") &&
  !!doc.querySelector("#cplFundingMount .cplfund-foot") &&
  !doc.querySelector("#cplFundingMount details.cplfund-sec") &&
  !doc.querySelector("#cplFundingMount .cplfund-actions") &&
  !doc.querySelector("#cplFundingMount .cplfund-summary"));
check("...and in the PUBLIC rendering: no curate affordance reaches the page",
  !doc.querySelector("#cplFundingMount [data-edit], #cplFundingMount [data-textedit], #cplFundingMount #cplFundReset"));
check("the institution section sits directly after the introduction, before the first step (Sam, 2026-09-02)",
  (function () {
    const inst = doc.getElementById("institutions");
    const firstFold = doc.querySelector("main details.fold");
    const sections = Array.from(doc.querySelectorAll("main > section"));
    return !!inst && !!firstFold && sections.indexOf(inst) === 1 &&
      !!inst.querySelector("#cplFundingMount") &&
      !!(inst.compareDocumentPosition(firstFold) & 4);
  })());
check("the steps are folds, closed on open — the introduction and the table are not",
  (function () {
    const folds = Array.from(doc.querySelectorAll("main details.fold"));
    return folds.length === 5 &&
      folds.every((f) => !f.open && !!f.querySelector("summary h2") && !!f.querySelector("summary .fold-word")) &&
      !doc.querySelector("#institutions details.fold") &&
      !doc.querySelector("main > section:first-of-type details.fold");
  })());
check("...with a Show / Hide WORD, not a marker glyph",
  /details\.fold > summary \.fold-word::before\{content:"Show"\}/.test(html) &&
  /details\.fold\[open\] > summary \.fold-word::before\{content:"Hide"\}/.test(html) &&
  /details\.fold > summary::marker\{content:''\}/.test(html));
check("the page's own table rules are scoped to its own tables, so they never restyle the embedded one",
  !/\n(table|th,td|thead th|caption)\{/.test(html) && /\.tablebox table\{/.test(html));
check("the noncredit-share college count comes from the model, not a typed word",
  doc.getElementById("l-nc-count").textContent === String(D.nc.ncColleges));
check("the status line is empty on a successful paint",
  (doc.getElementById("live-status").textContent || "").trim() === "");

// ── repainting must REPLACE, never accumulate ─────────────────────────────
// The painter was written for a snapshot page that ran exactly once. The live
// page repaints on every model change — once from the baked defaults, again when
// the shared config lands — and three containers appended a second and third
// copy of themselves. Sam saw the two worked-example cards rendered three times.
//
// ⚠ The FIRST version of this suite already asserted a row count — on #tbody,
// the one container whose own draw() clears it. Asserting on the container that
// cannot fail is not a guard. This paints twice MORE and checks every container
// the painter appends into.
{
  const before = {
    cards: doc.querySelectorAll("#cards > *").length,
    prios: doc.querySelectorAll("#prios > *").length,
    worked: doc.querySelectorAll("#workedbody tr").length,
    nc: doc.querySelectorAll("#nc-list li").length,
    timing: doc.querySelectorAll("#timing-list li").length,
  };
  check("the first paint fills every container from the payload",
    before.cards === D.cards.length && before.prios === D.prios.length &&
    before.worked === D.prios.length && before.nc === 3 &&
    before.timing === D.timing.length && D.timing.length > 0);
  win.CPL_PAINT_EXPLAINER(D);
  win.CPL_PAINT_EXPLAINER(D);
  check("repainting twice more changes NOTHING — no container accumulates",
    doc.querySelectorAll("#cards > *").length === before.cards &&
    doc.querySelectorAll("#prios > *").length === before.prios &&
    doc.querySelectorAll("#workedbody tr").length === before.worked &&
    doc.querySelectorAll("#nc-list li").length === before.nc &&
    doc.querySelectorAll("#timing-list li").length === before.timing);
}

// ── THE TIMING AND THE STRATEGIES ARE PAINTED, FROM THE ENGINE ───────────
// Sam, 2026-09-02: "Make sure the timing and strategies are included in the
// Explainer (now public view)." Both are curator-edited lists on the tab, so
// they reach this page the way every figure does — through the payload — and
// the guard changes them through the layer a curator writes to, then requires
// the page to follow. A typed copy would pass a single-paint check and never
// move again (the factors lesson, 2026-09-02).
{
  const T = win.CPL_FUNDING_TAB;
  const repaint = function () {
    win.CPL_PAINT_EXPLAINER(win.CPL_FUNDING_EXPLAINER.buildPayload(T, win.CPL_FUNDING));
  };
  const painted = Array.from(doc.querySelectorAll("#timing-list li")).map((li) => li.textContent);
  check("the timing milestones are painted, one per item the engine reports, label and date",
    painted.length === D.timing.length && D.timing.length > 0 &&
    D.timing.every((t, i) => painted[i].indexOf(t.label) !== -1 &&
      (!t.date || painted[i].indexOf(t.date) !== -1)));
  check("...and a milestone with no date reads as contingent, never as a blank",
    (function () {
      const lis = doc.querySelectorAll("#timing-list li");
      return D.timing.every((t, i) => lis[i].classList.contains("open") === !String(t.date || "").trim());
    })());
  T._setShared({ timing: [{ label: "A milestone typed by a curator", date: "Jan 2027" }, { label: "Contingent", date: "" }] });
  repaint();
  const lis = Array.from(doc.querySelectorAll("#timing-list li"));
  check("a curator's edit to the timing reaches the page — through the payload, not a typed copy",
    lis.length === 2 && /typed by a curator/.test(lis[0].textContent) && /Jan 2027/.test(lis[0].textContent) &&
    lis[1].classList.contains("open"));
  // Strategies: the baked config carries none, so no card paints an empty
  // heading; set two on one priority and they appear under ITS card only.
  check("a priority with no strategies paints no empty heading",
    !doc.querySelector("#prios .prio .strat-h") && !doc.querySelector("#prios .prio ul.strat"));
  T._setShared({ yearPriorities: { "1": { "0": { strategies: ["Name a CPL coordinator", "Post every exhibit"] } } } });
  repaint();
  const lists = doc.querySelectorAll("#prios .prio ul.strat");
  const items = lists.length ? Array.from(lists[0].querySelectorAll("li")).map((li) => li.textContent) : [];
  check("the recommended strategies are painted under their own priority, from the engine",
    lists.length === 1 && items.length === 2 && items[0] === "Name a CPL coordinator" &&
    /Recommended strategies/.test(lists[0].closest(".prio").textContent));
  T._setShared({});
  repaint();
  check("...and clearing the override clears the page (no list lingers from a previous paint)",
    !doc.querySelector("#prios .prio ul.strat") &&
    doc.querySelectorAll("#timing-list li").length === D.timing.length);
}

// ── the noncredit DECOMPOSITION must be EXPLAINED, not just carried ──
// One pool (2026-08-31): no separate lane — the page states the CR/NC
// decomposition, its restriction, and the origination rule for the
// noncredit-only three. Every figure is written from the payload, so a dial
// change moves the prose.
{
  const ncText = doc.getElementById("nc-body").textContent + " " +
    Array.from(doc.querySelectorAll("#nc-list li")).map((li) => li.textContent).join(" ");
  check("the page states the decomposition's figures — college shares, the trio's origination hold, one window",
    ncText.indexOf(money(D.nc.collegeShares)) !== -1 &&
    ncText.indexOf(money(D.nc.trioHeld)) !== -1 &&
    ncText.indexOf(String(D.nc.ncColleges)) !== -1 &&
    ncText.indexOf(money(D.pool.floor)) !== -1 && ncText.indexOf(money(D.pool.cap)) !== -1);
  // The "No advances" phrase retired 2026-09-01 (Sam: no mention of the
  // advance concept on any funding surface); origination-as-the-earning-rule
  // is the claim that survives.
  check("...and states the restriction and the origination earning rule — without the advance concept",
    /restricted/i.test(ncText) && /originating|origination/i.test(ncText) && !/advance/i.test(ncText));
  // The REQUIREMENT is that the page says the noncredit share stays separately
  // visible — not one phrasing of it. Pinned to a literal sentence, this went
  // red on a register pass that left the claim intact (Sam, 2026-09-01), which
  // is the coupling this repo has now been bitten by three times.
  check("...and says the noncredit share stays visible rather than being merged into the credit figure",
    /(separately|visible)/i.test(ncText) && /credit figure/i.test(ncText));
}

// ── A DIAL CHANGE MUST MOVE THE PAGE ─────────────────────────────────────
// Every check above paints once and reads the result, which proves the figure
// came from the payload but NOT that the payload came from the model. The
// difference is not academic: `_prios()` omitted `factor` from its projection
// until 2026-09-01, the payload defaulted a missing factor to 1, and the page
// printed "all three factors are currently set to 1.0" at every setting — a
// hardcoded claim wearing a computed one's clothes, wrong from the day Year 1
// went to 0.5 and invisible to a single-paint assertion.
//
// So: change a dial through the same layer a curator writes to, repaint, and
// require the page to disagree with itself.
{
  const T = win.CPL_FUNDING_TAB;
  const before = doc.getElementById("t-factors").textContent;
  const repaint = function () {
    win.CPL_PAINT_EXPLAINER(win.CPL_FUNDING_EXPLAINER.buildPayload(T, win.CPL_FUNDING));
  };
  T._setShared({ yearPriorities: { "1": {
    "0": { factor: 0.5, share: 0.34 }, "1": { factor: 0.5, share: 0.33 }, "2": { factor: 0.5, share: 0.33 }
  } } });
  repaint();
  const after = doc.getElementById("t-factors").textContent;
  check("changing the funding factors moves the figure the page prints",
    before !== after && /0\.5/.test(after));
  check("...and the sentence that explains them moves with it, rather than the table alone",
    /0\.5/.test(doc.getElementById("l-factors").textContent));
  check("changing the shares moves the shares row too",
    /34%/.test(doc.getElementById("t-shares").textContent));
  // A MIXED set is the case the single-value sentence must not paper over: with
  // three different factors there is no "all three are set to N" to say.
  T._setShared({ yearPriorities: { "1": {
    "0": { factor: 1.5 }, "1": { factor: 0.5 }, "2": { factor: 1 }
  } } });
  repaint();
  const mixed = doc.getElementById("l-factors").textContent;
  check("mixed factors are stated as a list, never collapsed into a false 'all three'",
    /1\.5/.test(mixed) && /0\.5/.test(mixed) && !/All three/i.test(mixed));
  // Leave the fixture as it was found.
  T._setShared({});
  repaint();
}

// ── a failed computation must SAY so, never leave stale figures standing ──
{
  const dom2 = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w2 = dom2.window;
  w2.CPL_FUNDING_NO_REMOTE = true;
  w2.scrollTo = function () {};
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
  // Break the payload builder the way a real regression would.
  w2.CPL_FUNDING_EXPLAINER.buildPayload = function () { throw new Error("boom"); };
  Array.from(dom2.window.document.querySelectorAll("script:not([src])"))
    .map(function (s) { return s.textContent; })
    .forEach(function (code) { w2.eval(code); });
  const msg = (dom2.window.document.getElementById("live-status").textContent || "");
  check("a failed computation is disclosed, not silently left on placeholders",
    /out of date|could not compute/i.test(msg));
}

// ── every payload key the painter reads must still EXIST ──────────────────
// ⚠️ THIS SECTION EXISTS BECAUSE THE PAGE PRINTED "$NaN" TO THE PUBLIC
// (found by Sam, 2026-09-01). The painter read `P.feeder` — a carve-out the
// one-pool model retired on 2026-08-31 — so `hero` and `inst` were
// `number - undefined`, and the "allocated to the 118 institutions" box
// rendered `$NaN` while the prose beside it printed the right figure.
//
// ⚠️ AND EVERY ASSERTION ABOVE PASSED THROUGH IT. They read the page as TEXT:
// no baked payload, every figure carries an id, the disclosure fires. All true,
// all useless here, because none of them ever asks the payload whether a key
// the script names still exists. A static check cannot see a NaN; only the
// arithmetic can.
//
// So this guards the CLASS, not the instance: every `P.<key>` the inline script
// references must be a key the payload actually emits. A future retired dial
// fails here instead of on the public page.
{
  const { JSDOM: J3 } = require("jsdom");
  const dom3 = new J3(
    '<!DOCTYPE html><body><div class="cpl-tab-pane" id="tab-implementation-funding">' +
    '<div class="main-container"><div><h2>CPL Implementation Funding</h2>' +
    '<span id="cplFundTitleLink"></span></div><div id="cplFundingMount">x</div>' +
    "</div></div></body>", { runScripts: "outside-only", url: "https://example.org/" });
  const w3 = dom3.window;
  w3.scrollTo = function () {};
  w3.CPL_FUNDING_NO_REMOTE = true;
  w3.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
  w3.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
  const T3 = w3.CPL_FUNDING_TAB;
  T3.boot();
  const D3 = require(path.join(ROOT, "funding_model_payload.js"))
    .buildPayload(T3, w3.CPL_FUNDING);

  const poolKeys = Object.keys(D3.pool);
  const inlineRaw = html.split(/<script(?![^>]*\ssrc=)[^>]*>/i).slice(1)
    .map(function (c) { return c.split(/<\/script>/i)[0]; }).join("\n");
  // Scan CODE, not commentary. The comment explaining this very defect names
  // the retired key, and a scan that reads prose would fail on its own
  // post-mortem — the same shape as the spelling rule that corrected the words
  // documenting it. Strip block comments, then line comments (leaving `://` in
  // URLs alone).
  const inline = inlineRaw
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const referenced = Array.from(new Set(
    (inline.match(/\bP\.([A-Za-z_][A-Za-z0-9_]*)/g) || [])
      .map(function (m) { return m.slice(2); })));
  const missing = referenced.filter(function (k) { return poolKeys.indexOf(k) < 0; });
  check("the painter references at least one payload pool key (the scan works)",
    referenced.length > 0);
  check("EVERY pool key the painter reads still exists in the payload — a "
        + "retired dial fails here, not as $NaN on the public page"
        + (missing.length ? " [missing: " + missing.join(", ") + "]" : ""),
    missing.length === 0);

  // The figure that actually broke, asserted against the model's own authority
  // rather than against the arithmetic that produced it.
  const instBox = D3.pool.one_time - D3.pool.admin - D3.pool.scaling;
  check("what reaches institutions is a real number, not NaN",
    Number.isFinite(instBox));
  check("...and it equals the model's own net_college figure",
    Math.round(instBox) === Math.round(D3.net_main));
  check("the three destination boxes sum to the appropriation, by construction",
    Math.round(instBox + D3.pool.scaling + D3.pool.admin)
      === Math.round(D3.pool.one_time));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
