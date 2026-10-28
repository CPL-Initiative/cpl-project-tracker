// map_links.js — the MAP link beside a credential a college could adopt, on the surfaces that
// name a credential by its common title and hold no exhibit ID (Sam, Open Asks Sheet 134 card 2,
// 2026-10-27, "build": CPL Pathways, My College, CER). Guards:
//   1. a title's line carries one chip per college that built a verified exhibit, each opening
//      MAP searched for that exhibit's own ID, named for its builder (card 1, "builder")
//   2. at most six chips, then "and N more colleges"
//   3. a title MAP lists nothing for, or no index at all, leaves the line empty
//   4. each surface asks for the line where it says a college could adopt, and My College asks
//      only for exhibits the college has not adopted
//   5. both COBI pages load the module (Rule 4)
//
// Run from repo root: `npm test` (or `node tests/map_links.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("map_links.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const found = {
  "MAPICI-DREB1-1-001": { college: "Saddleback College" },
  "MAPICI-DREB-1-001": { college: "Saddleback College" },
  "MAPICI-CREB1-1-001": { college: "West Los Angeles College" },
};
const by_title = { "California Real Estate Broker License": ["MAPICI-CREB1-1-001", "MAPICI-DREB-1-001", "MAPICI-DREB1-1-001"],
  "Many Builders": [] };
for (let i = 0; i < 9; i++) { found["MAPX-" + i] = { college: "College " + i }; by_title["Many Builders"].push("MAPX-" + i); }

function boot(response) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="host"></div></body></html>',
    { runScripts: "dangerously", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = () => Promise.resolve(response);
  w.cplCollegeShort = (n) => ({ "Saddleback College": "Saddleback", "West Los Angeles College": "West LA" }[n] || n);
  w.eval(src);
  return w;
}
const ok = { ok: true, status: 200, json: () => Promise.resolve({ found, by_title }) };
const A = boot(ok), B = boot({ ok: false, status: 404, json: () => Promise.resolve(null) });

const host = A.document.getElementById("host");
host.innerHTML = A.CPL_MAP_LINKS.placeholder("California Real Estate Broker License") +
  A.CPL_MAP_LINKS.placeholder("Many Builders") + A.CPL_MAP_LINKS.placeholder("No Such Credential");
host.appendChild(A.CPL_MAP_LINKS.node("California Real Estate Broker License"));
B.document.getElementById("host").innerHTML = B.CPL_MAP_LINKS.placeholder("California Real Estate Broker License");

setTimeout(() => {
  const lines = host.querySelectorAll(".cpl-maplinks");
  const re = lines[0], many = lines[1], none = lines[2], asNode = lines[3];
  const chips = Array.from(re.querySelectorAll("a.cpl-mapchip"));
  check("one chip per building college: Saddleback's two IDs give one chip", chips.length === 2);
  check("each chip is named for its builder and opens MAP searched for that exhibit's ID",
    chips[0].textContent.indexOf("West LA") === 0 &&
    chips[0].getAttribute("href") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=MAPICI-CREB1-1-001&View=Non-Military" &&
    chips[1].textContent.indexOf("Saddleback") === 0 && /\?Exhibit=MAPICI-DREB-1-001&View=Non-Military$/.test(chips[1].getAttribute("href")));
  check("a chip names its builder in full for a screen reader",
    / \(built by Saddleback College; opens MAP searched for MAPICI-DREB-1-001\)/.test(chips[1].textContent));
  check("a chip opens MAP in a new tab", chips[0].getAttribute("target") === "_blank" && /noopener/.test(chips[0].getAttribute("rel")));
  check("the line says what the chips do", /^Request Quick Adopt in MAP, from the exhibit each college built: /.test(re.textContent));
  check("at most six chips, then and N more colleges",
    many.querySelectorAll("a.cpl-mapchip").length === 6 && /and 3 more colleges$/.test(many.textContent));
  check("a title MAP lists nothing for leaves the line empty", none.innerHTML === "");
  check("node() fills the same way as placeholder()", asNode.querySelectorAll("a.cpl-mapchip").length === 2);
  check("no index file, no line", B.document.querySelector(".cpl-maplinks").innerHTML === "");
  const css = A.document.getElementById("cpl-maplinks-css");
  check("the chip is a 24px target, underlined, holding its hidden text (position:relative)",
    css && /\.cpl-mapchip\{position:relative;[^}]*min-height:24px;[^}]*text-decoration:underline;/.test(css.textContent));

  const cp = fs.readFileSync("cpl_pathways.js", "utf8");
  check("CPL Pathways: the pathway row's adopted-elsewhere panel asks for each credential's line",
    /adoptPanel\.appendChild\(ul\);\s*var ml = mapLinksNode\(o\.credential\);\s*if \(ml\) adoptPanel\.appendChild\(ml\);/.test(cp));
  check("CPL Pathways: each adoption opportunity's panel asks for its line before Quick Adopt",
    /panel\.appendChild\(ul\);\s*var ml = mapLinksNode\(pc\.credential\);\s*if \(ml\) panel\.appendChild\(ml\);\s*panel\.appendChild\(buildQuickAdopt/.test(cp));
  const cb = fs.readFileSync("college_briefing.js", "utf8");
  check("My College: an exhibit the college has not adopted asks for its line; an adopted one does not",
    /if \(!x\.adopted\) h \+= mapLinks\(x\.cer\);/.test(cb));
  check("My College: each top candidate by CPL type asks for its line", /\+ mapLinks\(c\.title\) \+ "<\/span>"/.test(cb));
  const cr = fs.readFileSync("credential_reference.js", "utf8");
  check("CER: potential adopters bring the line", /if \(orange\.length && M && r\.ut\) wrap\.appendChild\(M\.node\(r\.ut\)\);/.test(cr));
  const d = fs.readFileSync("CPL_Dashboard.html", "utf8"), ix = fs.readFileSync("index.html", "utf8");
  check("both COBI pages load map_links.js", d.indexOf('<script src="map_links.js"></script>') > 0 && ix.indexOf('<script src="map_links.js"></script>') > 0);

  let pass = 0;
  for (const [n, k] of results) { console.log((k ? "PASS" : "FAIL") + "  " + n); if (k) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 100);
