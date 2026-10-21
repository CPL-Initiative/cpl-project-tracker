// One college choice for CPL Pathways and My College (Sam, 2026-10-21: "go on step 1",
// the first step of folding My College into CPL Pathways).
//
// Guards:
//   (a) the two spellings meet: MAP's "Mt San Antonio College" and the catalog's
//       "Mt. San Antonio College" are one college to both tabs;
//   (b) CPL Pathways keeps the reader's college when the table's list lands and the tab
//       re-renders (it used to fall back to All colleges), and shares the pick;
//   (c) a college My College picked opens CPL Pathways on it, on the first visit and on a return;
//   (d) CPL Pathways' "Open My College" shares the college and opens the tab;
//   (e) a college CPL Pathways picked opens My College on it, in My College's own spelling;
//   (f) My College's "Open CPL Pathways" shares its college and opens the tab;
//   (g) a cleared choice, or a tab's own, moves nothing; the choice is never written to storage.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SHORT = fs.readFileSync("college_short_names.js", "utf8");
const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const PW = fs.readFileSync("cpl_pathways.js", "utf8");
const CB = fs.readFileSync("college_briefing.js", "utf8");
const flush = async (n) => { for (let i = 0; i < (n || 4); i++) await new Promise((r) => setTimeout(r, 0)); };
const MTSAC_MAP = "Mt San Antonio College", MTSAC_CAT = "Mt. San Antonio College";

function tabs(w, nav) {
  w.CPL_TABS = {
    navigate: (t) => { nav.push(t); w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: t } })); },
    loadScript: (src, g, cb) => cb()
  };
}
function pathways(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div><div id="college-briefing-root"></div></body>`,
    { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {};
  if (opts.fetch) w.fetch = opts.fetch;
  w.eval(SHORT); w.eval(DATA); w.eval(ROEP); w.eval(BACC);
  if (opts.nav) tabs(w, opts.nav);
  if (opts.choice) w.CPL_COLLEGE_CHOICE = opts.choice;
  w.eval(PW);
  return w;
}
function briefing(nav) {
  const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  for (const code of [SHORT, fs.readFileSync("team_phrase.js", "utf8"), CB]) {
    const s = w.document.createElement("script"); s.textContent = code; w.document.body.appendChild(s);
  }
  if (nav) tabs(w, nav);
  return w;
}
const pick = (w, sel, v) => { sel.value = v; sel.dispatchEvent(new w.Event("change", { bubbles: true })); };

(async () => {
  // ── (a) ──
  const wa = pathways(), wb = briefing();
  const kp = wa.CPL_PATHWAYS_TAB._choiceKey, kb = wb.CPL_COLLEGE_BRIEFING._shared.key;
  for (const [a, b] of [[MTSAC_MAP, MTSAC_CAT], ["College Of The Canyons", "College of the Canyons"], ["Miracosta College", "MiraCosta College"]]) {
    check("(a) " + a + " and " + b + " are one college to both tabs",
      kp(a) && kp(a) === kp(b) && kb(a) === kb(b) && kp(a) === kb(a), kp(a) + " / " + kp(b));
  }
  check("(a) two colleges stay two", kp("Cerritos College") !== kp(MTSAC_CAT));

  // ── (b) ──
  let releaseIndex = null;
  const fetchB = function (url) {
    if (/program_requirement_records\?select=college,/.test(url)) return new Promise((r) => { releaseIndex = () => r({ ok: true, status: 200, json: () => Promise.resolve([]) }); });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  const w1 = pathways({ fetch: fetchB });
  w1.CPL_PATHWAYS_TAB.activate();
  const r1 = w1.document.getElementById("cpl-pathways-root");
  pick(w1, r1.querySelector("select.cplpw-colsel"), MTSAC_CAT);
  check("(b) a pick here is shared", w1.CPL_COLLEGE_CHOICE && w1.CPL_COLLEGE_CHOICE.college === MTSAC_CAT && w1.CPL_COLLEGE_CHOICE.by === "cpl-pathways");
  await flush();
  releaseIndex && releaseIndex();
  await flush(6);
  const col1 = r1.querySelector("select.cplpw-colsel");
  check("(b) the list landing re-renders the tab", !!releaseIndex);
  check("(b) and the reader's college stays picked", col1.value === MTSAC_CAT, col1.value);
  check("(b) the pathways shown are still the college's",
    [...r1.querySelectorAll("select.cplpw-select option")].every((o) => o.textContent.startsWith(MTSAC_CAT + " — ")));

  // ── (c) ──
  const w2 = pathways({ choice: { college: MTSAC_MAP, by: "college-briefing" } });
  w2.CPL_PATHWAYS_TAB.activate();
  const c2 = w2.document.querySelector("#cpl-pathways-root select.cplpw-colsel");
  check("(c) a college My College picked opens the first visit on it", c2.value === MTSAC_CAT, c2.value);
  const w3 = pathways();
  w3.CPL_PATHWAYS_TAB.activate();
  check("(c) with no choice the tab opens on All colleges", w3.document.querySelector("#cpl-pathways-root select.cplpw-colsel").value === "");
  w3.CPL_COLLEGE_CHOICE = { college: "Cerritos College", by: "college-briefing" };
  w3.dispatchEvent(new w3.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-pathways" } }));
  check("(c) and a return after My College picked one shows it", w3.document.querySelector("#cpl-pathways-root select.cplpw-colsel").value === "Cerritos College");

  // ── (d) ──
  const nav4 = [];
  const w4 = pathways({ nav: nav4 });
  w4.CPL_PATHWAYS_TAB.activate();
  const r4 = w4.document.getElementById("cpl-pathways-root");
  pick(w4, r4.querySelector("select.cplpw-colsel"), "Cerritos College");
  const mine = [...r4.querySelectorAll("button.cplpw-oppact")].filter((b) => b.textContent === "Open My College")[0];
  check("(d) Open My College is a button beside the college's links", !!mine && mine.type === "button");
  w4.CPL_COLLEGE_CHOICE = null;
  mine && mine.click();
  check("(d) it shares the college and opens My College",
    w4.CPL_COLLEGE_CHOICE && w4.CPL_COLLEGE_CHOICE.college === "Cerritos College" && nav4.join() === "college-briefing", nav4.join());
  const w4b = pathways();
  w4b.CPL_PATHWAYS_TAB.activate();
  check("(d) without the tab router it is not offered", ![...w4b.document.querySelectorAll("button.cplpw-oppact")].some((b) => b.textContent === "Open My College"));

  // ── (e) ──
  const nav5 = [];
  const w5 = briefing(nav5);
  const M = w5.CPL_COLLEGE_BRIEFING, root5 = w5.document.getElementById("college-briefing-root");
  M.activate();
  M._state.data = { colleges: ["Cerritos College", MTSAC_MAP], summaryByName: {}, raw: {} };
  w5.CPL_COLLEGE_CHOICE = { college: MTSAC_CAT, by: "cpl-pathways" };
  w5.dispatchEvent(new w5.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
  check("(e) a college CPL Pathways picked opens My College on it, in My College's spelling",
    M._state.scope === "college" && M._state.college === MTSAC_MAP, M._state.scope + " " + M._state.college);
  check("(e) and My College shares it back as its own", w5.CPL_COLLEGE_CHOICE.by === "college-briefing" && w5.CPL_COLLEGE_CHOICE.college === MTSAC_MAP);

  // ── (f) ──
  M._state.loading = false; // the stubbed reads never answer; the page is past its load
  M.render(root5);
  const go = root5.querySelector("#cb-pathways");
  check("(f) Open CPL Pathways sits with the college's links", !!go && go.type === "button" && go.textContent === "Open CPL Pathways");
  go && go.click();
  check("(f) it opens CPL Pathways with the college shared", nav5.join() === "cpl-pathways" && w5.CPL_COLLEGE_CHOICE.college === MTSAC_MAP, nav5.join());

  // ── (g) ──
  w5.CPL_COLLEGE_CHOICE = { college: null, by: "cpl-pathways" };
  w5.dispatchEvent(new w5.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
  check("(g) All colleges on CPL Pathways leaves My College's college", M._state.college === MTSAC_MAP);
  w5.CPL_COLLEGE_CHOICE = { college: "Cerritos College", by: "college-briefing" };
  w5.dispatchEvent(new w5.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
  check("(g) a tab's own choice is never applied back to it", M._state.college === MTSAC_MAP);
  const stored = []
    .concat(Object.keys(w5.localStorage).map((k) => w5.localStorage.getItem(k)))
    .concat(Object.keys(w5.sessionStorage).map((k) => k))
    .concat(Object.keys(w1.localStorage)).concat(Object.keys(w1.sessionStorage));
  check("(g) the shared choice is never written to storage", !stored.some((v) => /CPL_COLLEGE_CHOICE|cplCollegeChoice/.test(String(v))), stored.join(" | "));

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + why + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " shared college choice checks passed");
  if (failed) process.exit(1);
})();
