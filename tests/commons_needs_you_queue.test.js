// Needs you as the one ranked queue (the anchor page, step 4, S730; Sam's approved mock
// https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE, its Needs you opening each item's list from the front page, and his
// rule of 2026-11-23: "when I make edits or decisions, they are immediately reflected in the numbers").
//
// WHAT THIS GUARDS (each a way the queue would send a person somewhere stale, or the long way round):
//   The Common subject in doubt count, read live (commons_front.js doubtLive):
//     (Q1) with no ruling on file, Needs you's link, the Courses and M-IDs card's check and its quick link all read the
//          doubt file's cards;
//     (Q2) ⭐ a ruling saved in the Courses List moves all three at once, on the return to the tab;
//     (Q3) ⭐ a "not sure" ruling leaves its card in doubt, as the List's own filter does (coci_lookup.js ruledCard);
//     (Q4) ⭐ a ruling on a card the build already took off the file is not subtracted a second time;
//     (Q5) ⭐ a ruling on a card Rulings to find names takes it off that box too;
//     (Q6) a read that fails keeps the file's count;
//     (Q7) the read is read-only and Range-paged (Rule 10 b), on the rulings' own field.
//   The fold on landing:
//     (F1) ⭐ a Needs you link folds the page to the card that holds its item, at #commons/card/<key>, and the item's
//          link takes the focus and the highlight (Sam, S723: "go directly to the card link");
//     (F2) the trail's first link returns every card and Needs you.
// Fixtures: the doubt file and the rulings are injected; the committed files only give the page its shape.
// Run from repo root: `npm test` (or `node tests/commons_needs_you_queue.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_handover.js", "commons_data.js", "commons_front.js", "commons.js"]
  .map((f) => fs.readFileSync(f, "utf8"));
const BASE = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json"]
  .forEach((f) => { BASE[f] = J(f); });
BASE["kb/status/local_subject_titles.json"] = J("tests/fixtures/local_subject_titles_fixture.json");
BASE["kb/status/held_subject_codes.json"] = { totals: { held: 0, codes: 0, pairs: 0 }, codes: [] };
/* Three cards in doubt; KINE M1524 is one Rulings to find names (ASKED.doubt in commons_front.js). */
BASE["kb/ccr_doubt.json"] = { discipline: "Kinesiology", cards: [{ id: "KINE M1524" }, { id: "KINE M1553" }, { id: "KINE M1900" }] };
const ruling = (mid, r, at) => ({ course_id: "_CCR_PROCEDURE_REQUEST::" + (at || "2026-11-25T10:00:00Z") + "-" + mid.replace(/\s+/g, "_"),
  field: "ccr_procedure_request", value: JSON.stringify({ mid: mid, ruling: r }), reviewed_at: at || "2026-11-25T10:00:00Z" });

function load(hash, live) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-commons"><div class="main-container"><div id="commons-root">Loading</div></div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || "#commons"), runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, store = {}, calls = [];
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_SESSION = { get: () => null, isFresh: () => true, ensureFresh: () => Promise.resolve(null),
    authHeaders: (x) => Object.assign({ apikey: "anon-key", Authorization: "Bearer anon-key" }, x || {}) };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url, method: init.method || "GET", headers: init.headers || {} });
    const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
    if (/rpc\/commons_handover_summary/.test(url)) return ok([]);
    if (/rest\/v1\/kb_curation/.test(url)) {
      if (/field=eq\.ccr_procedure_request/.test(url)) return live.fail ? Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) }) : ok(live.rulings || []);
      return ok([]);
    }
    const hit = BASE[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return ok(hit);
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
async function comeBack(x) { x.w.dispatchEvent(new x.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } })); await settle(); }
const num = (s) => { const m = /([\d,]+)/.exec(s || ""); return m ? Number(m[1].replace(/,/g, "")) : null; };
function needsLink(x) { return Array.from(x.d.querySelectorAll("#cmf-rank li a")).filter((a) => /^Common subject in doubt/.test(txt(a)))[0] || null; }
function doubt(x) {
  const li = needsLink(x) && needsLink(x).closest("li");
  const card = x.d.querySelector('.cmf-card[data-key="courses"]');
  const chk = card && card.querySelector('.cmf-check[data-ref="doubt"] .cmf-check-fig');
  const q = card && Array.from(card.querySelectorAll(".cmf-quick a")).map(txt).filter((t) => /common subject is in doubt/.test(t))[0];
  return { needs: li ? num(txt(li.querySelector(".cmf-rank-n"))) : 0, fig: chk ? num(txt(chk)) : null, quick: q ? num(q) : 0 };
}
const owed = (x) => txt(x.d.getElementById("cmf-need-owed"));

(async function () {
  const live = { rulings: [] };
  let x = load("#commons", live);
  await x.M.boot(); await settle();
  let d0 = doubt(x);
  check("(Q1) with no ruling, Needs you, the card's check and its quick link read the file's 3 cards", d0.needs === 3 && d0.fig === 3 && d0.quick === 3, JSON.stringify(d0));
  check("(Q1) Rulings to find names KINE M1524 while it is in doubt", /M1524/.test(owed(x)), owed(x));

  live.rulings = [ruling("KINE M1553", "keep")];
  await comeBack(x);
  let d1 = doubt(x);
  check("(Q2) ⭐ a ruling saved in the Courses List moves all three at once (2)", d1.needs === 2 && d1.fig === 2 && d1.quick === 2, JSON.stringify(d1));

  live.rulings = [ruling("KINE M1553", "keep"), ruling("KINE M1900", "unsure")];
  await comeBack(x);
  let d2 = doubt(x);
  check("(Q3) ⭐ a not-sure ruling leaves its card in doubt (still 2)", d2.needs === 2 && d2.fig === 2, JSON.stringify(d2));

  live.rulings = [ruling("KINE M1553", "keep"), ruling("KINE M1142", "move")];
  await comeBack(x);
  let d3 = doubt(x);
  check("(Q4) ⭐ a ruling on a card the file no longer lists is not subtracted (still 2)", d3.needs === 2 && d3.fig === 2, JSON.stringify(d3));

  live.rulings = [ruling("KINE M1553", "keep"), ruling("KINE M1524", "keep")];
  await comeBack(x);
  let d4 = doubt(x);
  check("(Q5) ⭐ a ruling on KINE M1524 moves the count (1) and takes it off Rulings to find", d4.needs === 1 && d4.fig === 1 && !/M1524/.test(owed(x)), JSON.stringify(d4) + " | " + owed(x));
  const reads = x.calls.filter((c) => /field=eq\.ccr_procedure_request/.test(c.url));
  check("(Q7) the rulings read is a GET, Range-paged, on its own field and prefix", reads.length >= 1 && reads.every((c) => c.method === "GET" && c.headers.Range === "0-999"
    && c.headers["Range-Unit"] === "items" && /course_id=like\._CCR_PROCEDURE_REQUEST/.test(decodeURIComponent(c.url))), JSON.stringify(reads[0]));

  const failing = load("#commons", { fail: true });
  await failing.M.boot(); await settle();
  let d5 = doubt(failing);
  check("(Q6) a failed read keeps the file's count (3)", d5.needs === 3 && d5.fig === 3, JSON.stringify(d5));

  /* ── the fold on landing ── */
  const link = needsLink(x);
  link.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  await settle();
  const view = x.d.getElementById("cmf-foldview"), act = x.d.activeElement;
  check("(F1) ⭐ the Needs you link folds the page to the Courses and M-IDs card at #commons/card/courses",
    x.w.location.hash === "#commons/card/courses" && view && !view.hidden && !!view.querySelector('.cmf-card[data-key="courses"]'), x.w.location.hash);
  check("(F1) ⭐ the item's own link takes the focus and the highlight", act && act.getAttribute("href") === "#coci-lookup/list/doubt" && act.classList.contains("cmf-hl") && view.contains(act),
    act && act.outerHTML.slice(0, 120));
  const home = x.d.querySelector("#cmf-foldview a[data-fold-home]");
  if (home) home.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  await settle();
  check("(F2) the trail's first link returns every card and Needs you", !!home && x.w.location.hash === "#commons" && view.hidden && !!x.d.getElementById("cmf-rank") && !x.d.getElementById("cmf-needs").closest("[hidden]"),
    x.w.location.hash);

  let fail = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "\n     " + why)); if (!ok) fail++; });
  console.log(results.length - fail + "/" + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
