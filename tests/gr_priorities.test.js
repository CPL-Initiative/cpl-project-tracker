// GR (Government Relations) gated advocacy briefing (gr_priorities.js).
//   - SECURITY: the committed JS carries NO advocacy content (it lives only in
//     Supabase gr_content, released by RLS gr_pass_ok()); the tab is EXCLUSIVE in
//     cobi_orgs.js (only under ?org=gr); rich text renders via an allowlist
//     tokenizer that CANNOT inject <script>/javascript: (the failure-mode guard).
//   - Rule 4: nav button + pane + boot block mirrored in both HTMLs.
//
// Run from repo root: `npm test` (or `node tests/gr_priorities.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── jsdom globals so the module can be required ──────────────────────────────
const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
  { url: "https://cpl-initiative.github.io/cpl-project-tracker/?org=gr" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.navigator = dom.window.navigator;
global.location = dom.window.location;
let fetchImpl = function () { return Promise.reject(new Error("no fetch")); };
global.fetch = function () { return fetchImpl.apply(null, arguments); };

const GR = require("../gr_priorities.js");

// ── Part A — static security invariants (no content / correct wiring) ────────
const jsSrc = fs.readFileSync("gr_priorities.js", "utf8");
check("gr_priorities.js exposes window.CPL_GR.activate", GR && typeof GR.activate === "function");
check("gr_priorities.js targets the GR-specific gate (gr_pass_ok, not team_pass_ok)",
  jsSrc.indexOf("rpc/gr_pass_ok") !== -1 && jsSrc.indexOf("rpc/team_pass_ok") === -1);
check("gr_priorities.js uses a GR-specific phrase key (cohort isolation client-side too)",
  jsSrc.indexOf("cpl_gr_pass") !== -1);
check("gr_priorities.js carries NO service key", jsSrc.indexOf("service_role") === -1);
// Content-leak guard: distinctive advocacy prose must NOT be in the committed file.
["geographic lottery", "phantom gatekeeping", "9,349", "$50.6M", "Standardized Attendance",
 "unfunded cost", "re-adjudication"].forEach(function (phrase) {
  check("no advocacy content in repo JS: '" + phrase + "'", jsSrc.indexOf(phrase) === -1);
});

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("HTML has the gr-priorities nav button", /data-tab="gr-priorities"[^>]*>GR Priorities</.test(cpl));
check("HTML has the gr-priorities pane root", /id="gr-priorities-root"/.test(cpl));
check("HTML lazy-loads gr_priorities.js via CPL_GR boot", /loadScript\('gr_priorities\.js', 'CPL_GR'/.test(cpl));

const orgs = fs.readFileSync("cobi_orgs.js", "utf8");
check("cobi_orgs.js registers the GR org", /id:\s*"gr"/.test(orgs) && /Government Relations/.test(orgs));
check("cobi_orgs.js marks gr-priorities EXCLUSIVE (hidden in default view)",
  /EXCLUSIVE\s*=\s*\[\s*"gr-priorities"/.test(orgs));

// ── Part B — rich-text renderer is XSS-safe (the failure-mode guard) ─────────
function frag() { return dom.window.document.createElement("div"); }

var evil = frag();
GR._appendRich(evil, '<script>window.__pwned=1</script><img src=x onerror="window.__pwned=1"> hello ' +
  '<a href="javascript:window.__pwned=1">click</a> <a href="http://x">insecure</a>');
check("renderer creates NO <script> element", evil.querySelector("script") === null);
check("renderer creates NO <img> element", evil.querySelector("img") === null);
check("renderer drops javascript: links (rendered as text, no anchor)", evil.querySelector("a[href^='javascript']") === null);
check("renderer drops non-https links (http:// not linked)", evil.querySelector("a[href^='http:']") === null);
check("renderer preserved the safe text", evil.textContent.indexOf("hello") !== -1);
check("no global pollution from injected markup", typeof dom.window.__pwned === "undefined");

var ok = frag();
GR._appendRich(ok, '<p>See <a href="https://www.law.cornell.edu/regulations/california/5-CCR-55050">§55050</a> and <b>bold</b> and <i>it</i>.</p>');
var link = ok.querySelector("a");
check("renderer keeps https links", link && link.getAttribute("href") === "https://www.law.cornell.edu/regulations/california/5-CCR-55050");
check("https links open in a new tab safely", link && link.getAttribute("target") === "_blank" && /noopener/.test(link.getAttribute("rel") || ""));
check("renderer keeps <b> and <i>", ok.querySelector("b") && ok.querySelector("i"));

// ── Part C — render + filter + Word export from a sample doc ─────────────────
var sampleDoc = {
  title: "Sample", eyebrow: "GR", updated: "2026-07-16", sub: "sub", thesis: "A <b>regulation</b>.",
  tiers: [{ k: "g", label: "Guidance", n: 2, blurb: "b" }, { k: "r", label: "Ed. Code", n: 1, blurb: "b" }],
  groups: [
    { grp: "A", sub: "Scope — flexibility", rows: [
      { n: 1, t: "Item one", inst: "§55050", path: ["g", "y"], ed: "No", d: "<p>Approach one <a href=\"https://x.example.org/a\">§55050</a>.</p>", c: "consider" },
      { n: 2, t: "Item two", inst: "§55023", path: ["y"], ed: "No", d: "<p>Approach two.</p>", c: "" }
    ]},
    { grp: "D", sub: "Funding", rows: [
      { n: 7, t: "Apportionment", inst: "§58050", path: ["r"], ed: "Yes", d: "<p>Hard one.</p>", c: "risk" }
    ]}
  ],
  priority: [
    { r: 1, ids: "#7", t: "Apportionment", tier: ["r"], why: "matters", path: "<a href=\"https://x.example.org/p\" style=\"color:#3d4a60\">§58050</a>", prec: "Yes" },
    { r: 2, ids: "#1", t: "Scope", tier: ["g", "y"], why: "value", path: "path", prec: "No" }
  ],
  ask: [{ k: "1", h: "now", p: "do <b>#12</b>" }],
  corrections: ["<b>AB 1985</b> is not CPL."],
  caveat: "Verify <b>before</b> external use."
};
var root = dom.window.document.createElement("div");
GR._renderBriefing(root, sampleDoc);
check("renders one .gx-item per row (3)", root.querySelectorAll(".gx-item").length === 3);
check("renders the tier summary cards (2)", root.querySelectorAll(".gx-tc").length === 2);
check("renders the group headers (2)", root.querySelectorAll(".gx-grp").length === 2);
check("item carries its primary-tier data + link in description",
  root.querySelector(".gx-item[data-tiers='g y']") && root.querySelector(".gx-desc a[href='https://x.example.org/a']"));
// filter: click the Ed.Code chip → only the r-tier item stays undimmed
var frChip = null;
root.querySelectorAll(".gx-chip").forEach(function (c) { if (c.getAttribute("data-f") === "r") frChip = c; });
frChip && frChip.click();
var undimmed = Array.prototype.filter.call(root.querySelectorAll(".gx-item"), function (i) { return !i.classList.contains("dim"); });
check("filter=Ed.Code leaves exactly the r-tier item visible", undimmed.length === 1 && undimmed[0].getAttribute("data-tiers") === "r");

var word = GR._draftDocBody(sampleDoc);
check("Word export orders by blast radius (intro says so)", word.indexOf("Ordered by blast radius") !== -1);
check("Word export pulls the intro from the doc thesis (not hardcoded)", word.indexOf("A <b>regulation</b>.") !== -1);
check("Word export lists the priorities in order (#7 before #1)",
  word.indexOf("1. Apportionment") !== -1 && word.indexOf("1. Apportionment") < word.indexOf("2. Scope"));

// ── Part D — lock screen when no phrase is stored ────────────────────────────
try { dom.window.localStorage.removeItem("cpl_gr_pass"); } catch (e) {}
var lockRoot = dom.window.document.createElement("div");
lockRoot.id = "gr-priorities-root";
dom.window.document.body.appendChild(lockRoot);
GR.activate();  // no stored phrase → lock card, no content fetch
check("with no phrase, shows the lock card (password input)", lockRoot.querySelector(".gx-lock input[type='password']") !== null);
check("lock card renders no advocacy items", lockRoot.querySelectorAll(".gx-item").length === 0);

// ── report ───────────────────────────────────────────────────────────────────
let fail = 0;
results.forEach(function (r) { console.log((r[1] ? "PASS" : "FAIL") + " — " + r[0]); if (!r[1]) fail++; });
console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed.");
process.exit(fail ? 1 : 0);
