// The Subjects surfaces: Edit, the course panel and the counts from every surface, at the window's width (S702).
//
// Sam, 2026-11-22 (r-subjects-edit-counts-full-width-sam-2026-11-22): "I don't see how I can take action on subjects
// that need edit, such as all the AEDs that are in ELEC erroneously. need to be able to take action easily when signed
// in from all subject surfaces"; "cobi header has a sign in control so the page doesn't need it"; "on the main tab,
// there is no sidebar to view the courses assigned to the subjects for the counts, which should be clickable"; "the
// subjects surfaces should use the full width of window, which is a design standard".
//
// WHAT THIS GUARDS (each a way the page would fail him again):
//   (1) ⭐ a press on a code on the front list opens the panel OVER the front list (before, it moved to the college's
//       view), the address carries the surface and the panel, and Close returns to the surface it opened from;
//   (2) ⭐ every code row carries an Edit word, on the front list, a college's list and the no-title list;
//   (3) ⭐ signed out, the panel sends the reviewer to COBI's header and draws no sign-in of its own;
//   (4) ⭐ every count opens the rows it counts: the college table's five figures, the stamp's figures and each row's
//       Courses figure; the filter is said in words with a way back, and leaving the surface drops it;
//   (5) a code used at another college lists that college in the panel, and the word opens that college's form;
//   (6) the held list and the noncredit list open a college's code where its catalog is on file, plain words where not;
//   (7) the address round trip: all/<slug>/<code> and <list>/<slug>/<code> draw the panel on arrival;
//   (8) the surfaces drop the Commons' centered column (max-width:none), with tokens only;
//   (9) S718 (Sam, 2026-11-23: "the most important thing to see on the list is a column to indicate the number of
//       subjects that our confidence score indicates need attention. the sidebar should show immediate ways to take
//       action"): ⭐ Needs attention sits right after College and counts the codes below Confident or with no title, a
//       college's name matched with its punctuation set aside; it opens those codes; it reads TBA when the statewide list
//       cannot be read; no words say a person or curator settles a code; the panel leads with Act on it, whose Search
//       the web names the college, the code and its first course; and a course line reads CODE NUMBER Title.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_every_surface.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("commons_subjects.js", "utf8");
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
const FILES = {
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/subject_courses/alpha.json": { columns: ["number", "title", "band", "listed"], codes: { WELD: [["1", "Arc Welding", "C", "Both"]], MATH: [["1", "Algebra", "C", "COCI"]] } },
  "kb/status/subject_courses/beta.json": { columns: ["number", "title", "band", "listed"], codes: { WELD: [["10", "Welding Basics", "C", "Both"]] } },
  "kb/status/held_subject_codes.json": { totals: { held: 9, codes: 1, pairs: 2, top_20_release: 9 }, codes: [{ key: "WELD", code: "WELD", held: 9,
    colleges: [{ college: "Alpha College", held: 6 }, { college: "Gamma College", held: 3 }], examples: [], subject_map: {} }] },
  "kb/status/noncredit_subject_titles.json": { programs: [{ slug: "alpha", college: "Alpha College" }, { slug: "p9", college: "Program Nine" }], totals: {}, mq: {},
    titles: [{ title: "Welding", printed_as: ["Welding"], programs: 2, members: [{ college: "alpha", code: "WELD" }, { college: "p9", code: "WLD" }], catalog_courses: 3, category: null, categories: [], state: "" }] }
};

function load(hash, extra) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: "https://example.org/index.html" + hash, runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url) {
    const hit = Object.assign({}, FILES, extra || {})[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  const t = w.document.createElement("script"); t.textContent = SRC; w.document.body.appendChild(t);
  return { w, d: w.document, X: w.CPL_COMMONS_SUBJECTS, root: w.document.getElementById("root") };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const press = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));

(async function () {
  const alphaName = FIX.colleges.find((c) => c.slug === "alpha").college;

  /* (1)-(3) the front list */
  let x = load("#commons/subjects");
  await x.X.boot(x.root, ""); await settle();
  let d = x.d;
  const rows = Array.from(d.querySelectorAll(".csb-codes tbody tr"));
  check("(2) ⭐ every row of the front list carries an Edit word", rows.length === 6 && rows.every((r) => { const b = r.querySelector('button[data-csb-edit="yes"]'); return b && txt(b) === "Edit" && /^Edit /.test(b.getAttribute("aria-label")); }));
  const weldB = rows.find((r) => r.getAttribute("data-code") === "WELD" && /beta/.test(r.querySelector("button[data-csb-slug]").getAttribute("data-csb-slug")));
  press(x.w, weldB.querySelector('button[data-csb-edit="yes"]')); await settle();
  check("(1) ⭐ Edit on the front list opens the panel over the front list", d.getElementById("csb-panel") && txt(d.getElementById("csb-h")) === "Subjects" && d.querySelectorAll(".csb-codes tbody tr").length === 6);
  check("(1) ⭐ the address carries the surface and the panel", x.X.address() === "commons/subjects/all/beta/WELD" && x.w.location.hash === "#commons/subjects/all/beta/WELD");
  check("(3) ⭐ signed out, the panel sends the reviewer to COBI's header and has no sign-in of its own",
    /Sign in from the control in COBI’s header/.test(txt(d.getElementById("csb-edit-signin"))) && !d.querySelector("#csb-panel input, #csb-panel form, #csb-panel a[href*='sign']"));
  await settle();
  check("(1) the panel lists the code's courses at that college", /Welding Basics/.test(txt(d.getElementById("csb-panel-body"))));
  const other = d.querySelector("#csb-elsewhere button[data-csb-slug]");
  check("(5) a code used at another college names it in the panel", other && other.getAttribute("data-csb-slug") === "alpha" && txt(other) === alphaName && /each college’s code is settled on its own/.test(txt(d.getElementById("csb-elsewhere"))));
  press(x.w, other); await settle();
  check("(5) the word opens that college's form, still over the front list", x.X.address() === "commons/subjects/all/alpha/WELD" && /Arc Welding/.test(txt(d.getElementById("csb-panel-body"))));
  press(x.w, d.getElementById("csb-panel-close")); await settle();
  check("(1) ⭐ Close returns to the surface the panel opened from", !d.getElementById("csb-panel") && x.X.address() === "commons/subjects" && txt(d.getElementById("csb-h")) === "Subjects");

  /* (4) the counts */
  const alpha = d.querySelector('tr[data-college="alpha"]');
  const figs = Array.from(alpha.querySelectorAll("button[data-csb-pick]"));
  check("(4) ⭐ the college table's five figures are each a control", figs.map((b) => b.getAttribute("data-csb-pick")).join(",") === "incat,titled,both,catalog,state"
    && figs.every((b) => b.getAttribute("data-csb-pick-at") === "alpha" && /Show them\.$/.test(b.getAttribute("aria-label"))));
  check("(4) the Local titles figure says what it is out of", txt(alpha.children[3]) === "3 of 4 codes");
  press(x.w, figs[4]); await settle();
  let shown = Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-code"));
  check("(4) ⭐ COCI only opens that college's COCI-only codes, and says so", x.X.address() === "commons/subjects/alpha" && shown.join(",") === "MATH"
    && /Showing the 1 code in COCI only, of 4\./.test(txt(d.getElementById("csb-pick"))));
  press(x.w, d.querySelector('#csb-pick button[data-csb-pick=""]')); await settle();
  check("(4) Show every code clears the filter", d.querySelectorAll(".csb-codes tbody tr").length === 4 && !d.getElementById("csb-pick"));
  press(x.w, d.querySelector('tr[data-college="alpha"] button[data-csb-pick="both"]')); await settle();
  x.X.open(""); await settle();
  check("(4) leaving the surface drops the filter", d.querySelectorAll(".csb-codes tbody tr").length === 6 && !d.getElementById("csb-pick"));
  const stamp = Array.from(d.querySelectorAll(".csb-stamp button[data-csb-pick]")).map((b) => b.getAttribute("data-csb-pick"));
  check("(4) ⭐ the stamp's figures are controls", ["titled", "incat", "common"].every((k) => stamp.indexOf(k) >= 0));
  press(x.w, d.querySelector('.csb-stamp button[data-csb-pick="titled"]')); await settle();
  shown = Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-code"));
  check("(4) the stamp's titles figure opens the titled codes at every college", shown.join(",") === "ENGL,WELD,ZZZ" && /with a local title, of 6/.test(txt(d.getElementById("csb-pick"))));
  press(x.w, d.querySelector('#csb-pick button[data-csb-pick=""]')); await settle();
  const mathRow = d.querySelector('.csb-codes tr[data-code="MATH"]');
  const cnt = mathRow.children[4].querySelector("button[data-csb-code]");
  check("(4) ⭐ a row's Courses figure is a control", cnt && /^4 in COCI/.test(txt(cnt)) && /Show them\.$/.test(cnt.getAttribute("aria-label")));
  press(x.w, cnt); await settle();
  check("(4) and it opens the courses it counts", x.X.address() === "commons/subjects/all/alpha/MATH" && /Algebra/.test(txt(d.getElementById("csb-panel-body"))));

  /* (2) the other code lists */
  x = load("#commons/subjects/disagree");
  await x.X.boot(x.root, "disagree"); await settle();
  d = x.d;
  const dr = Array.from(d.querySelectorAll(".csb-codes tbody tr"));
  check("(2) ⭐ every row of the no-title list carries an Edit word", dr.length === 3 && dr.every((r) => r.querySelector('button[data-csb-edit="yes"]')));
  press(x.w, dr[0].querySelector('button[data-csb-edit="yes"]')); await settle();
  check("(1) the panel opens over the no-title list", d.getElementById("csb-panel") && txt(d.getElementById("csb-h")) === "Subject titles to check" && /^commons\/subjects\/disagree\/[a-z]+\/[A-Z]+$/.test(x.X.address()));
  x = load("#commons/subjects/alpha");
  await x.X.boot(x.root, "alpha"); await settle();
  check("(2) every row of a college's list carries an Edit word", Array.from(x.d.querySelectorAll(".csb-codes tbody tr")).every((r) => r.querySelector('button[data-csb-edit="yes"]')));
  press(x.w, x.d.querySelector('.csb-codes tr[data-code="WELD"] button[data-csb-edit="yes"]')); await settle();
  check("(7) a college's own view keeps its address, <slug>/<code>", x.X.address() === "commons/subjects/alpha/WELD");

  /* (6) the held list and the noncredit list */
  x = load("#commons/subjects/held");
  await x.X.boot(x.root, "held"); await settle();
  d = x.d;
  const cell = d.querySelector('.csb-held tr[data-code="WELD"]').children[2];
  const hb = cell.querySelectorAll("button[data-csb-code]");
  check("(6) ⭐ the held list opens a college's code where its catalog is on file, plain words where not",
    hb.length === 1 && hb[0].getAttribute("data-csb-slug") === "alpha" && /Gamma College 3/.test(txt(cell)));
  press(x.w, hb[0]); await settle();
  check("(6) the panel opens over the held list", d.getElementById("csb-panel") && x.X.address() === "commons/subjects/held/alpha/WELD" && d.querySelector(".csb-held"));
  press(x.w, d.getElementById("csb-panel-close")); await settle();
  check("(6) Close returns to the held list", x.X.address() === "commons/subjects/held" && d.querySelector(".csb-held") && !d.getElementById("csb-panel"));
  x = load("#commons/subjects/noncredit");
  await x.X.boot(x.root, "noncredit"); await settle();
  const nb = x.d.querySelectorAll(".csb-nc button[data-csb-code]");
  check("(6) the noncredit list opens a member's code where its catalog is on file", nb.length === 1 && nb[0].getAttribute("data-csb-slug") === "alpha" && /Program Nine WLD/.test(txt(x.d.querySelector(".csb-nc"))));

  /* (7) arrival */
  x = load("#commons/subjects/all/beta/WELD");
  await x.X.boot(x.root, "all/beta/WELD"); await settle();
  check("(7) ⭐ all/<slug>/<code> draws the panel over the front list on arrival", x.d.getElementById("csb-panel") && txt(x.d.getElementById("csb-h")) === "Subjects" && x.X.address() === "commons/subjects/all/beta/WELD");
  x = load("#commons/subjects/disagree/beta/WELD");
  await x.X.boot(x.root, "disagree/beta/WELD"); await settle();
  check("(7) <list>/<slug>/<code> draws the panel over that list on arrival", x.d.getElementById("csb-panel") && txt(x.d.getElementById("csb-h")) === "Subject titles to check");
  x = load("#commons/subjects/all/nowhere/WELD");
  await x.X.boot(x.root, "all/nowhere/WELD"); await settle();
  check("(7) a panel address naming no college draws the list and no panel", !x.d.getElementById("csb-panel") && x.X.address() === "commons/subjects");

  /* (9) Needs attention and Act on it (S718) */
  x = load("#commons/subjects");
  await x.X.boot(x.root, ""); await settle();
  check("(9) ⭐ without the statewide list the column reads TBA, never a guess", txt(x.d.querySelector('.csb-table:not(.csb-codes) tr[data-college="alpha"]').children[1]) === "TBA");
  const swc = (code, colleges, conf) => ({ code, spellings: [code], colleges, courses: 10, "class": "peers", filing: null,
    recommend: { common: code, discipline: { MATH: "Mathematics", WELD: "Welding" }[code] || "English", confidence: conf, why: "peers agree" } });
  const SW9 = { "kb/status/statewide_subject_codes.json": { totals: { codes: 3, colleges: 2, pairs: 4, courses: 28, one_college: 2 }, common_codes: [["ENGL", "English"], ["MATH", "Mathematics"], ["WELD", "Welding"]],
      self_recall: [], codes: [swc("ENGL", [["Alpha College", 11]], 0.95), swc("MATH", [["Alpha College", 4]], 0.8), swc("WELD", [["Alpha College", 6], ["Beta-College", 7]], 0.6)] },
    "kb/status/local_subject_recommendations.json": { colleges: [{ slug: "alpha", rows: [{ code: "MATH", title: { title: "Mathematics", level: "Medium", why: "other colleges.",
      search: { query: "Alpha College MATH", searched_on: "2026-11-21", result_title: "Mathematics Course Descriptions", result_url: "https://alpha.example.edu/math/", where: "college site" } } }] }] } };
  x = load("#commons/subjects", SW9);
  await x.X.boot(x.root, ""); await settle();
  d = x.d;
  const heads9 = Array.from(d.querySelectorAll(".csb-table:not(.csb-codes) thead th")).map((th) => txt(th).replace(/, (high to low|low to high|A to Z|Z to A)$/, ""));
  check("(9) ⭐ Needs attention is the column right after College", heads9[0] === "College" && heads9[1] === "Needs attention");
  const att = (slug) => d.querySelector('.csb-table:not(.csb-codes) tr[data-college="' + slug + '"]').children[1];
  check("(9) ⭐ it counts the codes below Confident or with no title: Alpha MATH, WELD and ZZZ; Beta ENG and WELD (Beta-College is Beta College)",
    att("alpha").getAttribute("data-attention") === "3" && att("beta").getAttribute("data-attention") === "2");
  check("(9) the college table opens sorted by Needs attention, most first", Array.from(d.querySelectorAll(".csb-table:not(.csb-codes) tbody tr")).map((r) => r.getAttribute("data-college")).join(",") === "alpha,beta"
    && d.querySelectorAll(".csb-table:not(.csb-codes) thead th")[1].getAttribute("aria-sort") === "descending");
  const attBtn = att("alpha").querySelector('button[data-csb-pick="attention"]');
  check("(9) the count is a control that names what it opens", attBtn && /^3 codes need attention at Alpha College\. Show them\.$/.test(attBtn.getAttribute("aria-label")));
  const words = txt(d.getElementById("root"));
  check("(9) ⭐ no words say a person or a curator settles a code", !/curator settles|person settles|settled by a person|\bSettle\b/i.test(words)
    && /A code is settled once that score is Confident/.test(words) && /Sky reads the codes not read yet in the nightly data collection/.test(words));
  press(x.w, attBtn); await settle();
  check("(9) ⭐ it opens that college's codes that need attention", Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-code")).join(",") === "MATH,WELD,ZZZ"
    && /Showing the 3 codes that need attention, of 4\./.test(txt(d.getElementById("csb-pick"))));
  press(x.w, d.querySelector('.csb-codes tr[data-code="MATH"] button[data-csb-edit="yes"]')); await settle();
  const act = d.getElementById("csb-act"), pin = d.getElementById("csb-panel").querySelector(".csb-panel-in");
  check("(9) ⭐ the panel leads with Act on it, and says why", act && pin.querySelector("section") === act
    && /Sky’s call for its common subject code, MATH Mathematics, is 80% Likely, below Confident\./.test(txt(d.getElementById("csb-act-why"))));
  const ws = d.getElementById("csb-act-search");
  check("(9) ⭐ Search the web names the college, the code and its first course, in a new tab", ws && txt(ws) === "Search the web" && ws.getAttribute("data-query") === "Alpha College MATH 1 Algebra"
    && ws.getAttribute("href") === "https://www.google.com/search?q=" + encodeURIComponent("Alpha College MATH 1 Algebra") && ws.getAttribute("target") === "_blank" && /noopener/.test(ws.getAttribute("rel")));
  check("(9) the query reads as Sam's example", x.X.webQuery("Cerritos College", "INST", { number: "273", title: "Mental Health Worker Field Experience" }) === "Cerritos College INST 273 Mental Health Worker Field Experience");
  check("(9) Sky's filed web search shows its result, and no catalog link is offered without an address", /found Mathematics Course Descriptions, on the college site\./.test(txt(d.getElementById("csb-act-found")))
    && !!d.querySelector('#csb-act-found a[href="https://alpha.example.edu/math/"]') && !d.getElementById("csb-act-catalog"));
  const crs = d.querySelector('#csb-panel .csb-courses tr[data-number="1"]');
  check("(9) ⭐ a course line reads the code before the number", crs && txt(crs.children[0]) + " " + txt(crs.children[1]) === "MATH 1 Algebra");
  x = load("#commons/subjects/alpha/ENGL", SW9);
  await x.X.boot(x.root, "alpha/ENGL"); await settle();
  check("(9) a Confident, titled code opens with no Act on it block", !!x.d.getElementById("csb-panel") && !x.d.getElementById("csb-act"));

  /* (8) width */
  check("(8) ⭐ the surfaces drop the Commons' centered column", /\.cmn-wrap\.csb \{[^}]*max-width:none/.test(x.X.CSS));
  check("(8) tokens only", !/#[0-9a-fA-F]{3,8}\b/.test(x.X.CSS));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
