// The Credential Catalog in COBI's Share menu (Sam, 2026-11-05: "can you create a tab for our credential
// catalog that I can add to our share section on cobi?"), on the pattern of the CPL Funding launcher.
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

const m = cpl.match(/<a class="cpl-tab cpl-tab-external" data-nav-link="credential-catalog"[\s\S]*?<\/a>/);
check("the Credential Catalog launcher exists, keyed credential-catalog", !!m);
const anchor = m ? m[0] : "";
check("it opens the public Credential Catalog", /href="library\/adopt\/"/.test(anchor));
check("it opens in a new tab", /target="_blank"/.test(anchor) && /rel="noopener"/.test(anchor));
check("it is a launcher, never a tab button", !/data-tab=/.test(anchor));
check("its label is words: Credential Catalog", />Credential Catalog<\/a>$/.test(anchor));
check("the page it opens exists", fs.existsSync("library/adopt/index.html"));
check("nav_groups.js lists it in Share",
  /\{ id: 'share', label: 'Share', tabs: \[[^\]]*'credential-catalog'[^\]]*\] \}/.test(groupsSrc));

// A real build: the launcher lands inside the Share group, after the three it joins.
const dom = new JSDOM(`<!doctype html><html><body>
  <nav class="cpl-tabs">
    <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="implementation-funding">Implementation Funding</button>
    <a class="cpl-tab cpl-tab-external" data-nav-link="fact-sheet" href="fact-sheet/">CPL Fact Sheet</a>
    <a class="cpl-tab cpl-tab-external" data-nav-link="sierra" href="sierra/">Ask Sierra</a>
    <a class="cpl-tab cpl-tab-external" data-nav-link="public-library" href="library/">Public Library</a>
    <a class="cpl-tab cpl-tab-external" data-nav-link="public-funding" href="funding-model/">CPL Funding</a>
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
check("the Credential Catalog sits in Share", keys.indexOf("credential-catalog") !== -1);
check("Share reads Fact Sheet, Sierra, Public Library, CPL Funding, Credential Catalog",
  keys.join(",") === "fact-sheet,sierra,public-library,public-funding,credential-catalog");

let fail = 0;
for (const [name, ok] of results) { if (!ok) fail++; console.log((ok ? "  PASS " : "  FAIL ") + name); }
console.log(`\nshare_credential_catalog: ${results.length - fail}/${results.length} passed`);
if (fail) process.exit(1);
