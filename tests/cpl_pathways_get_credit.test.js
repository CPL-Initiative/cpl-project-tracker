// CPL Pathways: Get credit on a "CPL here" course (Sam, 2026-11-27, S744).
//
// "we could use the CPL Pathways views to add the 'Get Credit' button that goes to the lp. Maybe try cerritos college
// iron workers apprenticeship pathway and add the link the the CPL Here note on each card."
//
// MAP's landing page takes ?Exhibit=<MAP ID> and lists that exhibit's courses (verified live S744 at Cerritos:
// MAPICA-RA4P-1-001 lists IWAP 40.07 and 40.50). A course code in the parameter does nothing; an exhibit code holding
// "&" finds nothing (Chaffey's MAPICI-BP&C-1-001).
//
// Guards, on Cerritos's Field Ironworkers A.S. (cerritos_42158):
//   (a) every "CPL here" tile carries Get credit, opening the college's landing page on that course's exhibit;
//   (b) the link goes to the landing page from map_college_contacts_pub, never the MAP dashboard;
//   (c) an exhibit code holding "&" is skipped, and with no usable code the link opens the landing page alone;
//   (d) a college with no landing page on file says so, with no link;
//   (e) a tile without CPL here carries no Get credit.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const LANDING = "https://cpldashboardcccco.azurewebsites.net/www.cerritos.edu";

async function render(landingRows, edit) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  const asked = [];
  w.fetch = (url) => {
    asked.push(String(url));
    const rows = /map_college_contacts_pub/.test(url) ? landingRows : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
  };
  w.eval(DATA);
  w.eval(ROEP);
  w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = JSON.parse(JSON.stringify(w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158")));
  if (edit) edit(rec);
  T._roepView.lay = "req"; T._roepView.who = "college";
  T._renderRoepProgram(root, rec);
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  return { root, asked, rec };
}

(async () => {
  const cer = [{ college: "Cerritos College", landing_page_url: LANDING }];
  const a = await render(cer);
  const tiles = [...a.root.querySelectorAll(".cplpw-rmap .cplpw-rtile")];
  const here = tiles.filter((t) => t.classList.contains("here"));
  const links = here.map((t) => t.querySelector(".cplpw-getcredit a"));
  check("(a) the program has CPL here tiles", here.length >= 10, here.length);
  check("(a) every CPL here tile carries Get credit", links.every(Boolean), links.filter((l) => !l).length);
  const mb = here.find((t) => t.getAttribute("data-code") === "IWAP 40.50");
  const mbHref = mb && mb.querySelector(".cplpw-getcredit a") && mb.querySelector(".cplpw-getcredit a").href;
  const exp = a.rec.display.courses["IWAP 40.50"].here.exhibits[0].exhibit;
  check("(a) IWAP 40.50 opens the landing page on its exhibit", mbHref === LANDING + "?Exhibit=" + encodeURIComponent(exp), mbHref);
  check("(a) the link says Get credit, opens a new tab, and names the course and college",
    mb && /^Get credit$/.test(mb.querySelector(".cplpw-getcredit a").textContent) &&
    mb.querySelector(".cplpw-getcredit a").target === "_blank" &&
    /IWAP 40\.50 at Cerritos College/.test(mb.querySelector(".cplpw-getcredit a").getAttribute("aria-label")));
  check("(b) every link goes to the landing page, never the MAP dashboard",
    links.every((l) => l && l.href.indexOf(LANDING) === 0 && !/\/insights\//.test(l.href)));
  check("(b) the landing pages are read once from the public contacts view",
    a.asked.filter((u) => /map_college_contacts_pub\?select=college,landing_page_url/.test(u)).length === 1, a.asked);
  check("(e) a tile without CPL here carries no Get credit",
    tiles.filter((t) => !t.classList.contains("here")).every((t) => !t.querySelector(".cplpw-getcredit")));

  const b = await render(cer, (rec) => {
    rec.display.courses["IWAP 40.50"].here.exhibits = [{ exhibit: "MAPICI-BP&C-1-001" }, { exhibit: "MAPICA-RA4P-1-001" }];
    rec.display.courses["IWAP 40.07"].here.exhibits = [{ exhibit: "MAPICI-E&ET-1-001" }];
  });
  const hrefOf = (r, code) => {
    const t = [...r.root.querySelectorAll(".cplpw-rtile")].find((x) => x.getAttribute("data-code") === code);
    const l = t && t.querySelector(".cplpw-getcredit a");
    return l ? l.href : null;
  };
  check("(c) a code holding & is skipped for the next usable one", hrefOf(b, "IWAP 40.50") === LANDING + "?Exhibit=MAPICA-RA4P-1-001", hrefOf(b, "IWAP 40.50"));
  check("(c) with no usable code the link opens the landing page alone", hrefOf(b, "IWAP 40.07") === LANDING, hrefOf(b, "IWAP 40.07"));

  const c = await render([{ college: "Cerritos College", landing_page_url: "" }]);
  const slots = [...c.root.querySelectorAll(".cplpw-getcredit")];
  check("(d) no landing page on file: each CPL here tile says so, with no link",
    slots.length > 0 && slots.every((s) => !s.querySelector("a") && /Landing page not on file/.test(s.textContent)));

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways Get credit");
  if (failed) process.exit(1);
})();
