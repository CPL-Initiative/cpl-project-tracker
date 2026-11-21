// The way back to the CPL Commons, College Data Collection's rows-only word, and College Data Collection's live wiring
// (Sam, 2026-11-21, in session: "make sure I can always get back to commons from any surface. adda collapse/expand at
// top of cdc to collapse everything except the college rows. make sure everything on cdc is wired correctly to update
// as needed.").
//
// WHAT THIS GUARDS:
//   (9)  ⭐ College Data Collection and every Commons view under #commons/, opened cold from its address, carry one
//        "Back to CPL Commons" link at the top of the pane, first in its tab order; a tab another view opens from a
//        Commons card carries it too, and the same tab opened from the side menu does not; the front page carries none.
//   (10) ⭐ one word at the top of College Data Collection closes every section but the college rows and their filter
//        controls, reads "Expand all" with aria-expanded false, and opens them again; it is never stored.
//   (11) ⭐ a hand-over made while College Data Collection is open takes the course off its to-do at once (it waited
//        for the nightly build before); a return to the tab reads the counts again; a hand-over our reader could not
//        read still waits.
//
// Run from repo root: `npm test` (or `node tests/commons_way_back.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_handover.js", "commons_data_sharing.js", "commons_data_integrations.js",
  "commons_data.js", "commons_front.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FILES = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json",
  "kb/status/held_subject_codes.json", "kb/status/local_subject_titles.json", "kb/exhibits_review.json"].forEach((f) => { FILES[f] = J(f); });
["exhibit", "cr", "course", "subjects"].forEach((k) => { FILES["kb/status/" + k + ".json"] = J("kb/status/" + k + ".json"); });
FILES["kb/status/cdc_integrations.json"] = { integrations: [] };
const HUNT = J("tests/fixtures/commons_hunt_open.json");
const PANES = ["commons", "exhibits", "program-requirements", "coci-lookup"];

function load(hash, opts) {
  opts = opts || {};
  const body = '<a class="skip-link" href="#main">Skip to the content</a>' + PANES.map((t) => '<div class="cpl-tab-pane" id="tab-' + t + '" data-tab="' + t + '"><div class="main-container"><div id="' + t + '-root">Loading</div></div></div>').join("");
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + body + "</body></html>", { url: "https://example.org/index.html" + hash, runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, store = {}, state = { summary: (opts.summary || []).slice() };
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.Element.prototype.scrollIntoView = function () {};
  w.scrollTo = () => {};
  w.CPL_SESSION = { get: () => null, isFresh: () => true, authHeaders: (x) => Object.assign({ apikey: "anon-key" }, x || {}) };
  const files = Object.assign({}, FILES, opts.files || {});
  w.fetch = function (url) {
    url = String(url);
    if (/rpc\/commons_handover_summary/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(state.summary.slice()) });
    if (/rest\/v1\//.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const hit = files[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, store, state };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
async function go(x, hash) {
  x.w.location.hash = hash; await settle();
  const t = hash.replace(/^#/, "").split("/")[0];
  x.w.dispatchEvent(new x.w.CustomEvent("cpl-tab-activated", { detail: { tab: t === "collect" ? "commons" : t } })); await settle();
}
function back(x, tab) { const pane = x.d.getElementById("tab-" + tab); return pane && pane.querySelector(":scope > #cpl-back-needs a"); }
function withHunt() { const d = JSON.parse(JSON.stringify(FILES["kb/status/commons_data.json"])); d.blocked_hunt = HUNT; return d; }

(async function () {
  // ── (9) the way back ──
  for (const hash of ["#collect", "#collect/outlines-blocked", "#collect/catalogs_stuck", "#commons/details", "#commons/subjects", "#commons/subjects/held"]) {
    const x = load(hash);
    await x.M.boot(); await settle();
    const l = back(x, "commons");
    check("(9) ⭐ " + hash + " opened cold carries Back to CPL Commons", l && txt(l) === "Back to CPL Commons" && l.getAttribute("href") === "#commons" && x.d.querySelectorAll("#cpl-back-needs").length === 1,
      l ? txt(l) : "none");
    if (hash === "#collect") {
      const pane = x.d.getElementById("tab-commons"), focusable = Array.from(pane.querySelectorAll("a[href], button, input, [tabindex='0']"));
      check("(9) it comes first in the pane's tab order, a word link 24px tall", focusable[0] === l && /\.cpl-back-needs a \{[^}]*min-height:24px[^}]*text-decoration:underline/.test(fs.readFileSync("commons_front.js", "utf8")));
    }
  }
  const front = load("#commons");
  await front.M.boot(); await settle();
  check("(9) the front page itself carries no back link", !front.d.getElementById("cpl-back-needs"));
  // a tab opened from a Commons card carries it; the same tab from the side menu does not
  const fromCard = front.d.querySelector('.cmf-card[data-key="programs"] .cmf-links a[href="#program-requirements/list"]');
  fromCard.dispatchEvent(new front.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await go(front, "#program-requirements/list");
  const pl = back(front, "program-requirements");
  check("(9) ⭐ a tab opened from a Commons card carries Back to CPL Commons", pl && txt(pl) === "Back to CPL Commons" && pl.getAttribute("href") === "#commons", pl ? txt(pl) : "none");
  await go(front, "#exhibits");
  check("(9) leaving that tab drops it", !front.d.getElementById("cpl-back-needs"));
  const menu = load("#program-requirements/list");
  await settle();
  menu.w.dispatchEvent(new menu.w.CustomEvent("cpl-tab-activated", { detail: { tab: "program-requirements" } })); await settle();
  check("(9) ⭐ the same tab opened from the side menu carries none", !menu.d.getElementById("cpl-back-needs"));
  // Needs you still says Back to Needs you
  const ny = load("#commons");
  await ny.M.boot(); await settle();
  const dec = ny.d.querySelector('#cmf-needs a[href="#commons/details/decisions"]');
  dec.dispatchEvent(new ny.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await go(ny, "#commons/details/decisions");
  check("(9) a view Needs you opened keeps going back to Needs you", txt(back(ny, "commons")) === "Back to Needs you");

  // ── (10) collapse all but the college rows ──
  const c = load("#collect");
  await c.M.boot(); await settle();
  const word = c.d.getElementById("cdd-rowsonly"), wrap = c.d.querySelector(".cdd");
  check("(10) ⭐ one word at the top of College Data Collection, a button with aria-expanded", word && word.tagName === "BUTTON" && txt(word) === "Collapse all but the college rows" && word.getAttribute("aria-expanded") === "true");
  word.click();
  const css = Array.from(c.d.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  const hiddenRule = /\.cdd-rows-only > :not\(\.cdd-trail\):not\(\.cmn-top\):not\(\.cdd-views\):not\(\.cdd-rowsonly-line\):not\(\.cdd-list\) \{ display:none; \}/.test(css);
  const kept = Array.from(wrap.children).filter((n) => n.matches(".cdd-trail, .cmn-top, .cdd-views, .cdd-rowsonly-line, .cdd-list"));
  const closed = Array.from(wrap.children).filter((n) => !kept.includes(n));
  check("(10) ⭐ pressed, every other section closes and the rows and their filter controls stay", wrap.classList.contains("cdd-rows-only") && hiddenRule && closed.length >= 3
    && !!wrap.querySelector(".cdd-list tbody tr") && !!wrap.querySelector(".cdd-list #cdd-q"), closed.map((n) => n.className).join(" | "));
  check("(10) it then reads Expand all, aria-expanded false", txt(word) === "Expand all" && word.getAttribute("aria-expanded") === "false");
  word.click();
  check("(10) pressed again, everything opens", !wrap.classList.contains("cdd-rows-only") && txt(word) === "Collapse all but the college rows");
  check("(10) nothing is stored", Object.keys(c.store).every((k) => !/rows|collapse/i.test(k)));

  // ── (11) the to-do takes a hand-over made while the page is open ──
  const C0 = HUNT.colleges.filter((h) => h.hunted && !h.filed)[0], course = C0.still_taught[0];
  const h = load("#collect/outlines-blocked", { files: { "kb/status/commons_data.json": withHunt() } });
  await h.M.boot(); await settle();
  const has = () => !!h.d.querySelector('#cdd-blocked [data-todo-course="' + course.control_number + '"]');
  check("(11) the to-do lists the course before any hand-over", has());
  h.state.summary = [{ dataset: "course_outlines", subject_kind: "course", college: C0.college, course_code: course.course, kind: "file", status: "waiting", n: 1 }];
  await go(h, "#collect/outlines-blocked");
  check("(11) ⭐ a return to the tab reads the counts again and the handed-over course leaves the to-do", !has() && !!h.d.querySelector("#cdd-blocked"));
  h.state.summary = [{ dataset: "course_outlines", subject_kind: "course", college: C0.college, course_code: course.course, kind: "link", status: "could_not_read", n: 1 }];
  await h.w.CPL_HANDOVER.summary(true); h.w.CPL_COMMONS_DATA.render(h.d.getElementById("commons-root"), h.w.CPL_COMMONS_DATA.model(withHunt()), "outlines-blocked"); await settle();
  check("(11) a hand-over our reader could not read still waits", has());
  // the college's own hand-over pane tells the page when something lands
  const SRC = fs.readFileSync("commons_data.js", "utf8"), HO = fs.readFileSync("commons_handover.js", "utf8");
  check("(11) ⭐ a hand-over in the college's pane redraws the to-do", /collegePane\(M, c, \{ datasets: datasets, onChange: refreshTodo \}\)/.test(SRC) && /if \(H && typeof H\.onChange === "function"\) H\.onChange\(\)/.test(HO));
  check("(11) the page reads the counts again when the window comes back into view", /visibilitychange[^\n]*liveRefresh\(true\)/.test(SRC));
  check("(11) read-only: no new write path in College Data Collection", !/method:\s*"(POST|PATCH|PUT|DELETE)"/.test(SRC));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
