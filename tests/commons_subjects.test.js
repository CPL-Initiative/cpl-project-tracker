// The CPL Commons' Subjects card and its list (S694; Sam, 2026-11-20: "don't we need a commons card for subjects to
// house the common subjects and local subject titles we'll be establishing from catalog data?").
//
// WHAT THIS GUARDS (each a way the card or the list would mislead):
//   (1) ⭐ the card sits first in Curate, before Courses and M-IDs (Step a and b come before Step c, the M-ID);
//   (2) ⭐ each Step b figure opens what it counts: the drafted titles and the colleges open #commons/subjects, the
//       one-sided codes open #commons/subjects/disagree, and Step a's figure opens the Common Subjects Reference;
//   (3) a missing titles file reads TBA on the card and the page still draws;
//   (4) the list opens from its address, from a college's address and from the curator's list address, and a college
//       whose catalog prints no names reads TBA (in its row and in each code's title);
//   (5) a press on a college moves the address, and the view reports it (every view has an address);
//   (6) the tables carry th scope, a labeled scrolling region, and the view stores nothing.
// The fixture (tests/fixtures/local_subject_titles_fixture.json) stands in for the live file, so these hold whatever
// catalogs are filed later.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX
};

function load(hash, files) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {};
  let writes = 0;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { writes++; o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  const all = Object.assign({}, FILES, files || {});
  w.fetch = function (url) {
    const hit = all[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, store: o, writes: () => writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

(async function () {
  /* (1)-(2) the card on the front page */
  let x = load("#commons");
  await x.M.boot(); await settle();
  let d = x.d;
  const curate = Array.from(d.querySelectorAll(".cmf-group")).find((g) => txt(g.querySelector(".cmf-group-h")) === "Curate");
  const first = curate && curate.querySelector(".cmf-card");
  check("(1) ⭐ Subjects is the first card in Curate", first && first.getAttribute("data-key") === "subjects" && txt(first.querySelector(".cmf-card-t")) === "Subjects");
  check("(1) Courses and M-IDs follows it", curate && curate.querySelectorAll(".cmf-card")[1].getAttribute("data-key") === "courses");
  const links = Array.from(first.querySelectorAll(".cmf-body a"));
  const by = (t) => links.find((l) => txt(l).indexOf(t) >= 0);
  check("(2) ⭐ the drafted titles open the subjects list", by("3 titles drafted") && by("3 titles drafted").getAttribute("href") === "#commons/subjects");
  check("(2) ⭐ the colleges open the subjects list", by("1 of 2 colleges") && by("1 of 2 colleges").getAttribute("href") === "#commons/subjects");
  check("(2) the one-sided codes open the curator's list", by("3 codes only one side prints") && by("3 codes only one side prints").getAttribute("href") === "#commons/subjects/disagree");
  check("(2) Step a's figure opens the Common Subjects Reference", links.some((l) => l.getAttribute("href") === "#canonical-subj4" && /disciplines settled/.test(txt(l))));
  check("(2) the card names an owner on each step", /Owner: a curator/.test(txt(first)) && /Owner: the Courses bot/.test(txt(first)));
  check("the card's link row opens the list", Array.from(first.querySelectorAll(".cmf-links a")).some((l) => l.getAttribute("href") === "#commons/subjects"));
  check("the fold key is known", x.w.CPL_COMMONS_FRONT.KEYS.indexOf("subjects") >= 0);

  /* (3) no titles file */
  x = load("#commons", { "kb/status/local_subject_titles.json": undefined });
  await x.M.boot(); await settle();
  const sc = x.d.querySelector('.cmf-card[data-key="subjects"]');
  check("(3) a missing titles file reads TBA and the page still draws", sc && /Step b, local subject title: TBA/.test(txt(sc)) && x.d.querySelectorAll(".cmf-card").length === 9);

  /* (4) the list from its address */
  x = load("#commons/subjects");
  await x.M.boot(); await settle();
  d = x.d;
  check("(4) ⭐ #commons/subjects opens the list", txt(d.getElementById("csb-h")) === "Subjects" && d.querySelector(".cmf-card") === null);
  const beta = d.querySelector('tr[data-college="beta"]');
  check("(4) ⭐ a college whose catalog prints no names reads TBA", beta && txt(beta.children[2]) === "TBA");
  check("(4) a college that prints names reads its count", txt(d.querySelector('tr[data-college="alpha"]').children[2]) === "3");
  check("(4) every code is listed", d.querySelectorAll(".csb-codes tbody tr").length === 6);
  const zzz = d.querySelector('.csb-codes tr[data-code="ZZZ"]'), math = d.querySelector('.csb-codes tr[data-code="MATH"]');
  check("(4) each code says who prints it", txt(zzz.children[5]) === "Catalog only" && txt(math.children[5]) === "State list only");
  check("(4) the common code shows where the maps give one, blank where not", txt(d.querySelector('.csb-codes tr[data-code="ENGL"]').children[3]) === "ENGL" && txt(zzz.children[3]) === "");
  check("(4) the rule is on the page", /trimming and upper-casing/.test(txt(d.querySelector(".csb-foot"))));

  /* (5) a press on a college moves the address and reports it */
  d.querySelector('tr[data-college="beta"] a').dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await settle();
  check("(5) ⭐ a press on a college opens it at its address", x.w.location.hash === "#commons/subjects/beta" && txt(d.getElementById("csb-h")) === "Subjects at Beta College");
  check("(5) the view reports its address", x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/beta");

  x = load("#commons/subjects/beta");
  await x.M.boot(); await settle();
  d = x.d;
  check("(4) ⭐ #commons/subjects/<slug> opens that college", txt(d.getElementById("csb-h")) === "Subjects at Beta College" && d.querySelectorAll(".csb-codes tbody tr").length === 2);
  check("(4) its titles read TBA, and the page says why", Array.from(d.querySelectorAll(".csb-codes tbody tr")).every((r) => txt(r.children[2]) === "TBA") && /prints the code alone/.test(txt(d.querySelector(".csb-note"))));

  x = load("#commons/subjects/disagree");
  await x.M.boot(); await settle();
  d = x.d;
  const sides = Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-side"));
  check("(4) the curator's list holds only the one-sided codes", sides.length === 3 && sides.every((s) => s !== "both"));

  x = load("#commons/subjects/nowhere");
  await x.M.boot(); await settle();
  check("(4) an unknown college says so and shows every college", /No college with a printed catalog is named nowhere/.test(txt(x.d.querySelector(".csb-note"))) && x.d.querySelectorAll(".csb-codes tbody tr").length === 6);

  /* (6) the tables */
  d = x.d;
  check("(6) every header cell carries a scope", Array.from(d.querySelectorAll(".csb-table th")).every((th) => th.getAttribute("scope")));
  check("(6) each table scrolls inside a labeled region", Array.from(d.querySelectorAll(".csb-table")).every((t) => t.parentNode.getAttribute("role") === "region" && t.parentNode.getAttribute("aria-label")));
  check("(6) the list stores nothing", x.writes() === 0);
  const CSS = x.w.CPL_COMMONS_SUBJECTS.CSS;
  check("(6) tokens only: no raw hex in the list's CSS", !/#[0-9a-fA-F]{3,8}\b/.test(CSS));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
