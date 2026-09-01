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
check("the college table is painted from the engine's rows, all of them",
  doc.querySelectorAll("#tbody tr").length === D.rows.length && D.rows.length > 100);
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
    rows: doc.querySelectorAll("#tbody tr").length,
  };
  check("the first paint fills every container from the payload",
    before.cards === D.cards.length && before.prios === D.prios.length &&
    before.worked === D.prios.length && before.nc === 3 && before.rows === D.rows.length);
  win.CPL_PAINT_EXPLAINER(D);
  win.CPL_PAINT_EXPLAINER(D);
  check("repainting twice more changes NOTHING — no container accumulates",
    doc.querySelectorAll("#cards > *").length === before.cards &&
    doc.querySelectorAll("#prios > *").length === before.prios &&
    doc.querySelectorAll("#workedbody tr").length === before.worked &&
    doc.querySelectorAll("#nc-list li").length === before.nc &&
    doc.querySelectorAll("#tbody tr").length === before.rows);
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
  check("...and says the noncredit share stays visible rather than disappearing into the credit figure",
    /disappearing into the credit figure/i.test(ncText));
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
