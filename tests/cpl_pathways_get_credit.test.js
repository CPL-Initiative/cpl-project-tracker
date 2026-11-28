// CPL Pathways: Get credit on a "CPL here" course (Sam, 2026-11-27, S744).
//
// "we could use the CPL Pathways views to add the 'Get Credit' button that goes to the lp. Maybe try cerritos college
// iron workers apprenticeship pathway and add the link the the CPL Here note on each card."
//
// MAP's landing page takes ?Exhibit=<MAP ID>[,<MAP ID>...] and lists those exhibits' courses (verified live S744 at
// Cerritos: MAPICA-RA4P-1-001 lists IWAP 40.07 and 40.50). A course code in the parameter does nothing; an exhibit code
// holding "&" finds nothing (Chaffey's MAPICI-BP&C-1-001), and one failing value makes MAP drop the whole parameter.
//
// Since the compact cards (Sam, 2026-11-27: "all links to lp go to bottom bar iframe of the lp") the CPL control on a
// card opens the landing page in the bottom bar's frame; tests/cpl_pathways_compact_cards.test.js guards the card and
// the bar's layout. This file keeps the guards on where the frame points.
//
// Guards, on Cerritos's Field Ironworkers A.S. (cerritos_42158):
//   (a) every "CPL here" card carries the CPL control, and it opens the landing page on that course's exhibits;
//   (b) the frame goes to the landing page from map_college_contacts_pub, never the MAP dashboard;
//   (c) a code MAP's own pattern refuses ("&", "--", a course code) is skipped, codes are deduped and capped at ten,
//       and with none left the frame opens the landing page alone;
//   (d) a college with no landing page on file says so, with no frame and no link;
//   (e) a card without CPL here carries no CPL control, and #3910's inline link is gone.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const LANDING = "https://cpldashboardcccco.azurewebsites.net/www.cerritos.edu";
const tick = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };

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
  await tick();
  return { w, T, root, asked, rec };
}
const tileOf = (r, code) => [...r.root.querySelectorAll(".cplpw-rtile")].find((x) => x.getAttribute("data-code") === code);
async function frameFor(r, code) {
  const t = tileOf(r, code);
  const b = t && t.querySelector(".cplpw-rcpl");
  if (!b) return null;
  b.dispatchEvent(new r.w.Event("click", { bubbles: true }));
  await tick();
  const bar = r.root.querySelector(".cplpw-gbar");
  return { bar, frame: bar && bar.querySelector("iframe") };
}
const srcOf = (f) => (f && f.frame ? f.frame.getAttribute("src") : null);

(async () => {
  const cer = [{ college: "Cerritos College", landing_page_url: LANDING }];
  const a = await render(cer);
  const tiles = [...a.root.querySelectorAll(".cplpw-rmap .cplpw-rtile")];
  const here = tiles.filter((t) => t.classList.contains("here"));
  check("(a) the program has CPL here cards", here.length >= 10, here.length);
  check("(a) every CPL here card carries the CPL control", here.every((t) => t.querySelector("button.cplpw-rcpl")),
    here.filter((t) => !t.querySelector(".cplpw-rcpl")).length);
  const exp = a.rec.display.courses["IWAP 40.50"].here.exhibits.map((e) => e.exhibit).filter(Boolean);
  const mb = await frameFor(a, "IWAP 40.50");
  check("(a) IWAP 40.50 opens the landing page on its exhibit, in the bar's frame",
    srcOf(mb) === LANDING + "?Exhibit=" + exp.map(encodeURIComponent).join(","), srcOf(mb));
  check("(a) the control names the course and college",
    /IWAP 40\.50 at Cerritos College/.test(tileOf(a, "IWAP 40.50").querySelector(".cplpw-rcpl").getAttribute("aria-label")));
  const srcs = [];
  for (const t of here) srcs.push(srcOf(await frameFor(a, t.getAttribute("data-code"))));
  check("(b) every frame opens the landing page, never the MAP dashboard",
    srcs.every((s) => s && s.indexOf(LANDING) === 0 && !/\/insights\//.test(s)), srcs.filter((s) => !s).length);
  check("(b) the landing pages are read once from the public contacts view",
    a.asked.filter((u) => /map_college_contacts_pub\?select=college,landing_page_url/.test(u)).length === 1,
    a.asked.filter((u) => /contacts/.test(u)).length);
  check("(e) a card without CPL here carries no CPL control",
    tiles.filter((t) => !t.classList.contains("here")).every((t) => !t.querySelector(".cplpw-rcpl")));
  check("(e) the inline Get credit link of #3910 is gone", !a.root.querySelector(".cplpw-getcredit") && !/function fillGetCredit/.test(SRC));

  const b = await render(cer, (rec) => {
    rec.display.courses["IWAP 40.50"].here.exhibits = [{ exhibit: "MAPICI-BP&C-1-001" }, { exhibit: "MAPICA-RA4P-1-001" }, { exhibit: "MAPICA-RA4P-1-001" }];
    rec.display.courses["IWAP 40.07"].here.exhibits = [{ exhibit: "MAPICI-E&ET-1-001" }, { exhibit: "MAPICI-E3S--1-001" }, { exhibit: "IWAP 40.07" }];
  });
  const s50 = await frameFor(b, "IWAP 40.50");
  check("(c) a code MAP refuses (&) is dropped and a repeat is sent once", srcOf(s50) === LANDING + "?Exhibit=MAPICA-RA4P-1-001", srcOf(s50));
  const s07 = await frameFor(b, "IWAP 40.07");
  check("(c) with no code MAP accepts (&, --, a course code) the frame opens the landing page alone", srcOf(s07) === LANDING, srcOf(s07));
  const many = [];
  for (let i = 1; i <= 12; i++) many.push({ exhibit: "MAPX-A" + i + "-1-001" });
  const codes = b.T._getCreditCodes(many);
  check("(c) at most ten codes, comma-joined", codes.length === 10 && b.T._getCreditUrl(LANDING, codes) === LANDING + "?Exhibit=" + codes.join(","), codes.length);
  check("(c) a landing page with a query of its own takes the codes after &",
    b.T._getCreditUrl(LANDING + "?x=1", ["MAPCXA-FO-1-001"]) === LANDING + "?x=1&Exhibit=MAPCXA-FO-1-001");
  check("(c) no landing page builds no URL", b.T._getCreditUrl("", ["MAPCXA-FO-1-001"]) === "");

  const c = await render([{ college: "Cerritos College", landing_page_url: "" }]);
  const nc = await frameFor(c, "IWAP 40.50");
  check("(d) no landing page on file: the bar says so, with no frame and no link",
    nc && nc.bar && !nc.frame && !nc.bar.querySelector("a") && /has no MAP landing page on file/.test(nc.bar.textContent),
    nc && nc.bar && nc.bar.textContent.slice(0, 200));

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways Get credit");
  if (failed) process.exit(1);
})();
