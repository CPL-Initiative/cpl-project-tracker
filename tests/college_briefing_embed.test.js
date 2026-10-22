// My College inside CPL Pathways — step 2 of folding My College into CPL Pathways
// (Sam, 2026-10-22: "go on step 2"). S448.
//
// The one renderer draws into a host CPL Pathways owns (data-cb-embed). Guards:
//   1. the host's picker chooses the college: no scope question, no college picker,
//      no "Choose another college" or "Change view", and no second copy of the CPL
//      Visual, the extract or the link back to CPL Pathways, all of which the host's
//      college line already carries;
//   2. the sections and Sierra (one per page) still draw, with Create a briefing;
//   3. a catalog spelling ("Mt. San Antonio College") finds MAP's name through the
//      short-name crosswalk, as the shared choice does;
//   4. a college My College does not hold says so instead of drawing another;
//   5. the tab's own root keeps its full header.
//
// Run from repo root: `node tests/college_briefing_embed.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const SHORT = fs.readFileSync("college_short_names.js", "utf8");

const COLLEGES = ["Allan Hancock College", "Cabrillo College", "Mt San Antonio College"];

const dom = new JSDOM(
  '<!doctype html><html><body><div id="college-briefing-root"></div><div class="cpl-tab-pane"><div id="host"></div></div></body></html>',
  { url: "https://example.org/", runScripts: "dangerously" }
);
const w = dom.window;
w.fetch = function () { return new Promise(function () {}); };
w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
[TEAM, SHORT, CHAT, BRIEFING].forEach(function (src) {
  const s = w.document.createElement("script");
  s.textContent = src;
  w.document.body.appendChild(s);
});
const M = w.CPL_COLLEGE_BRIEFING;
M._state.data = {
  colleges: COLLEGES, summaryByName: {}, raw: {},
  briefing: { unread: [], leads: [], programs: [], strategyTotal: 3, scenario: "Scenario 1", year: "1" }
};
M._state.loadedSignedIn = !!M._getSession();
const host = w.document.getElementById("host");

check("the module offers mountInto", typeof M.mountInto === "function");
M.mountInto(host, "Mt. San Antonio College");

// ── 3 ──
check("3. the catalog's spelling finds MAP's name", M._state.college === "Mt San Antonio College" && M._state.scope === "college", M._state.college);
check("the host is marked embedded", host.getAttribute("data-cb-embed") === "1");

// ── 1 ──
const t = host.textContent || "";
check("1. no scope question", !/What would you like to look at\?/.test(t));
check("1. no college picker", !host.querySelector("select"));
check("1. no Choose another college / Change view", !host.querySelector("[data-entity-clear], [data-scope-clear]"));
check("1. no second CPL Visual, extract or Open CPL Pathways", !host.querySelector("#cb-oppvisual, #cb-workbook, #cb-pathways"));
check("1. no Welcome title (the host names the college)", !/Welcome,/.test(t));

// ── 2 ──
check("2. Create a briefing stays", !!host.querySelector("#cb-report"));
check("2. Expand all / Collapse all stay", !!host.querySelector('[data-all="open"]') && !!host.querySelector('[data-all="close"]'));
check("2. Sierra draws, once", host.querySelectorAll(".cb-assist").length === 1);

// ── 4 ──
M.mountInto(host, "Nowhere Community College");
check("4. a college My College does not hold says so", /My College holds no record for Nowhere Community College/.test(host.textContent) && !host.querySelector(".cb-assist"), host.textContent);

// ── 5 ──
M._state.scope = "college"; M._state.college = "Cabrillo College";
const tab = w.document.getElementById("college-briefing-root");
M.render(tab);
check("5. the tab keeps its own header", /Welcome, Cabrillo College/.test(tab.textContent) && !!tab.querySelector("[data-scope-clear]"));

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + why + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " My College embed checks passed");
process.exit(failed ? 1 : 0);
