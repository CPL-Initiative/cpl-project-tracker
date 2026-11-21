// The Subjects card's held codes (S695): the local subject codes the pile mint holds on, at #commons/subjects/held.
// Sam, 2026-11-20: collection serves the M-IDs, fixes ranked by the M-ID cards they unblock.
//
// WHAT THIS GUARDS (each a way the view would mislead the person deciding codes):
//   (1) ⭐ #commons/subjects/held opens the list from its address and reports that address;
//   (2) ⭐ the codes rank by the held courses each releases, descending, whatever order the file holds them in;
//   (3) ⭐ the Subjects card's figure opens what it counts (#commons/subjects/held), and the subjects list links there;
//   (4) a vote is labeled a suggestion with its votes, never a decision; a code with none says what fell short;
//   (5) a press on the subjects list's link moves the address; the table carries th scope and a labeled region, and
//       the view stores nothing;
//   (6) a missing held file reads TBA on the card and the page still draws.
// The fixtures (tests/fixtures/held_subject_codes_fixture.json, local_subject_titles_fixture.json) stand in for the
// live files.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_held.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8")),
  "kb/status/held_subject_codes.json": JSON.parse(fs.readFileSync("tests/fixtures/held_subject_codes_fixture.json", "utf8"))
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
  return { w, d: w.document, M: w.CPL_COMMONS, writes: () => writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }

(async function () {
  /* (1)-(2), (4)-(5) the list from its address */
  let x = load("#commons/subjects/held");
  await x.M.boot(); await settle();
  let d = x.d;
  check("(1) ⭐ #commons/subjects/held opens the held codes", txt(d.getElementById("csb-h")) === "Local subject codes the M-ID mint holds on" && d.querySelector(".cmf-card") === null);
  check("(1) ⭐ the view reports its address", x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/held" && x.w.location.hash === "#commons/subjects/held");
  const rows = Array.from(d.querySelectorAll(".csb-held tbody tr"));
  const order = rows.map((r) => r.getAttribute("data-code"));
  check("(2) ⭐ the codes rank by held courses, descending", JSON.stringify(order) === JSON.stringify(["TUTR", "CD", "HUSV"]));
  check("(2) each row shows the count it releases", rows.map((r) => txt(r.children[1])).join(",") === "6,2,1");
  check("(2) the totals are on the page", /9 courses the M-ID mint holds wait on 3 local subject codes \(4 college-and-code pairs\)/.test(txt(d.querySelector(".csb-note"))));
  const tutr = rows[0];
  check("(2) the colleges using a code carry their counts", txt(tutr.children[2]) === "Alpha College 4; Beta College 2");
  check("(2) the printed name shows under the code", /Tutoring/.test(txt(tutr.querySelector("th .csb-sub"))));
  check("(2) example titles carry their college", /Supervised Tutoring \(Alpha College\)/.test(txt(tutr.children[3])));
  check("(4) ⭐ a vote is labeled a suggestion, not a decision, with its votes", /Suggestion, not a decision: EDUC, from the statewide vote \(9 votes, 78% share\)/.test(txt(tutr.children[4])));
  check("(4) the floor it missed is named", /9 votes under the floor of 100/.test(txt(tutr.children[4])) && /6 votes under the floor of 50/.test(txt(tutr.children[4])));
  check("(4) near entries are shown", /Near entries in the subject map: TUT \(Education\), TUTOR \(Education\)/.test(txt(tutr.children[4])));
  const cd = rows[1];
  check("(4) a code with no vote says what fell short and offers no suggestion", !/Suggestion/.test(txt(cd.children[4])) && /no statewide vote/.test(txt(cd.children[4])) && /2-character code/.test(txt(cd.children[4])));
  check("(5) every header cell carries a scope", Array.from(d.querySelectorAll(".csb-table th")).every((th) => th.getAttribute("scope")));
  check("(5) the table scrolls inside a labeled region", d.querySelector(".csb-held").parentNode.getAttribute("role") === "region" && !!d.querySelector(".csb-held").parentNode.getAttribute("aria-label"));
  check("(5) the view stores nothing", x.writes() === 0);
  check("(5) the rule is the held file's", /subject map's key form/.test(txt(d.querySelector(".csb-foot"))));
  check("(5) tokens only: no raw hex in the list's CSS", !/#[0-9a-fA-F]{3,8}\b/.test(x.w.CPL_COMMONS_SUBJECTS.CSS));

  /* (3), (5) the subjects list links to it, and a press moves the address */
  x = load("#commons/subjects");
  await x.M.boot(); await settle();
  d = x.d;
  const link = Array.from(d.querySelectorAll(".csb-stamp a")).find((a) => a.getAttribute("href") === "#commons/subjects/held");
  check("(3) the subjects list links to the held codes", !!link);
  link.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await settle();
  check("(5) ⭐ a press opens the held codes at their address", x.w.location.hash === "#commons/subjects/held" && d.querySelectorAll(".csb-held tbody tr").length === 3);

  /* (3) the card's figure on the front page */
  x = load("#commons");
  await x.M.boot(); await settle();
  const card = x.d.querySelector('.cmf-card[data-key="subjects"]');
  const fig = card && Array.from(card.querySelectorAll(".cmf-body a")).find((a) => /courses the M-ID mint holds/.test(txt(a)));
  check("(3) ⭐ the card's figure opens what it counts", fig && fig.getAttribute("href") === "#commons/subjects/held" && /^9 courses/.test(txt(fig)));
  check("(3) the card names the codes", /wait on 3 local subject codes/.test(txt(card)));
  check("(3) the card's link row opens the held codes", Array.from(card.querySelectorAll(".cmf-links a")).some((a) => a.getAttribute("href") === "#commons/subjects/held"));

  /* (6) no held file */
  x = load("#commons", { "kb/status/held_subject_codes.json": undefined });
  await x.M.boot(); await settle();
  const sc = x.d.querySelector('.cmf-card[data-key="subjects"]');
  check("(6) a missing held file reads TBA and the page still draws", sc && /common subject code: TBA/.test(txt(sc)) && x.d.querySelectorAll(".cmf-card").length === 9);
  x = load("#commons/subjects/held", { "kb/status/held_subject_codes.json": undefined });
  await x.M.boot(); await settle();
  check("(6) the held view says when its file cannot be read", /could not be read/.test(txt(x.d.querySelector(".csb-note"))));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
