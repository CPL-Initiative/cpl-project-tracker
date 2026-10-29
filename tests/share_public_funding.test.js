// The public funding page in COBI's Share menu (Sam, 2026-10-29, S520: "add the
// public funding view to the Share COBI menu so it's publicly available").
//
// Guards the failure modes a launcher has:
//   - Rule 4: the anchor lives in BOTH HTMLs, byte-identical.
//   - It is a keyed external (data-nav-link), never a data-tab button, so
//     tabs.js ignores it and the Admin overlay and cobi_orgs.js can govern it.
//   - It opens funding-model/ (the one public funding page) in a new tab.
//   - nav_groups.js lists it in Share, and a real build lands it there beside
//     the Fact Sheet, Sierra and the Public Library.
//
// Run from repo root: `npm test` (or `node tests/share_public_funding.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");

check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);

const m = cpl.match(/<a class="cpl-tab cpl-tab-external" data-nav-link="public-funding"[\s\S]*?<\/a>/);
check("the CPL Funding launcher exists, keyed public-funding", !!m);
const anchor = m ? m[0] : "";
check("it opens the public funding page", /href="funding-model\/"/.test(anchor));
check("it opens in a new tab", /target="_blank"/.test(anchor) && /rel="noopener"/.test(anchor));
check("it is a launcher, never a tab button", !/data-tab=/.test(anchor));
check("its label is a word: CPL Funding", />CPL Funding<\/a>$/.test(anchor));
check("the page it opens exists", fs.existsSync("funding-model/index.html"));
check("nav_groups.js lists it in Share",
  /\{ id: 'share', label: 'Share', tabs: \[[^\]]*'public-funding'[^\]]*\] \}/.test(groupsSrc));

// A real build: the launcher lands inside the Share group, after the three it joins.
const dom = new JSDOM(`<!doctype html><html><body>
  <nav class="cpl-tabs">
    <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="implementation-funding">Implementation Funding</button>
    <a class="cpl-tab cpl-tab-external" data-nav-link="fact-sheet" href="fact-sheet/">CPL Fact Sheet</a>
    <a class="cpl-tab cpl-tab-external" data-nav-link="sierra" href="sierra/">Ask Sierra</a>
    <a class="cpl-tab cpl-tab-external" data-nav-link="public-library" href="library/">Public Library</a>
    ${anchor}
  </nav></body></html>`, { url: "https://example.org/", runScripts: "dangerously" });
const w = dom.window;
const s = w.document.createElement("script");
s.textContent = groupsSrc;
w.document.body.appendChild(s);
// jsdom is still "loading" here, so nav_groups.js waits for DOMContentLoaded;
// build() directly is the same call init() makes first.
w.CPL_NAV_GROUPS.build();

const share = w.document.querySelector('[data-nav-group="share"]');
check("the build paints a Share group", !!share);
const keys = share ? Array.from(share.querySelectorAll("[data-nav-link]")).map((a) => a.getAttribute("data-nav-link")) : [];
check("CPL Funding sits in Share", keys.indexOf("public-funding") !== -1);
check("Share reads Fact Sheet, Sierra, Public Library, CPL Funding",
  keys.join(",") === "fact-sheet,sierra,public-library,public-funding");
const fund = w.document.querySelector('[data-nav-group="funding"]');
check("the internal Funding group keeps only the tab", !fund || !fund.querySelector('[data-nav-link="public-funding"]'));

let fail = 0;
for (const [name, ok] of results) { if (!ok) fail++; console.log((ok ? "  PASS " : "  FAIL ") + name); }
console.log(`\nshare_public_funding: ${results.length - fail}/${results.length} passed`);
if (fail) process.exit(1);
