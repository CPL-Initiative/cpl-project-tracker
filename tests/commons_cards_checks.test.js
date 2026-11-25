// The Commons front page's cards carry the Subjects card's design (S719; Sam, 2026-11-24: "In this session, let's
// finish the subjects work and apply the design from the subject card to the other commons cards"; his ask of
// 2026-11-23: "Then I will want to apply the same process and principles to the other commons cards"). Each card but
// the Plan: its headline, Needs action first, the short Why list, then Collect, Curate and Connect, folded, each
// holding numbered checks with a Where to act line (commons_front.js checksCard, over the Subjects card's helpers
// keyed by card).
//
// WHAT THIS GUARDS (each a way the design could look right and read wrong):
//   (1) ⭐ every converted card opens on its top section: Collect, Curate and Connect start folded (aria-expanded
//       false, the box hidden), and no stage is drawn empty;
//   (2) ⭐ every check has a Where to act line with a link, and every quick link opens its check's stage, scrolls to a
//       check that exists in its own card and focuses it;
//   (3) ⭐ every id on the page is unique, so the helpers are keyed by card and never collide;
//   (4) ⭐ a quick link whose figure is zero is left out (an injected zero), and the same figure above zero shows;
//   (5) ⭐ the Subjects card keeps its ids: cmf-subj-check-1 to 4, cmf-subj-quick, cmf-subj-stage-collect;
//   (6) ⭐ a card's title opens that card's own list (the anchor page, step 3: the Commons as home base).
// Fixtures: the figures the checks read are injected here (commons.json's facts for programs, courses, exhibits and
// credentials; the subject titles fixture); the committed files only give the page its shape, and no check reads a
// committed value.
// Run from repo root: `npm test` (or `node tests/commons_cards_checks.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_handover.js", "commons_data.js", "commons_front.js", "commons.js"]
  .map((f) => fs.readFileSync(f, "utf8"));
const CONVERTED = ["colleges", "programs", "courses-data", "cdc", "courses", "exhibit", "credentials", "cr", "interconnect"];
const BASE = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json"]
  .forEach((f) => { BASE[f] = J(f); });
BASE["kb/status/local_subject_titles.json"] = J("tests/fixtures/local_subject_titles_fixture.json");
BASE["kb/status/held_subject_codes.json"] = { totals: { held: 9, codes: 2, pairs: 2 }, codes: [] };

/* The figures the checks read, injected: each card gets at least one figure above zero to link to. */
function commonsWith(over) {
  const C = JSON.parse(JSON.stringify(BASE["kb/status/commons.json"]));
  const facts = (k) => { const r = (C.rows || []).concat(C.building || []).find((x) => x.key === k); if (!r) throw new Error("no " + k + " row"); return (r.facts = r.facts || {}); };
  Object.assign(facts("requirements"), { unread: 9, failing: 7 });
  Object.assign(facts("course"), { total: 80, ready: 20, needs_review: 40, needs_repair: 7 }, over.course || {});
  Object.assign(facts("exhibit"), { titles: 50, backlog: 0, stamped: 30, no_subject: 5, left_map: 3 }, over.exhibit || {});
  Object.assign(facts("credentials"), { credentials: 70, issuers: 12, with_issuer_skills: 8 });
  if ((C.building || []).concat(C.rows || []).some((x) => x.key === "skills")) Object.assign(facts("skills"), { with_issuer_skills: 8 });
  return C;
}
function load(over) {
  over = over || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-commons"><div class="main-container"><div id="commons-root">Loading</div></div></div></body></html>',
    { url: "https://example.org/index.html#commons", runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, store = {};
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.scrolled = [];
  w.Element.prototype.scrollIntoView = function () { w.scrolled.push(this.id || this.tagName); };
  w.CPL_SESSION = { get: () => null, isFresh: () => true, authHeaders: (x) => Object.assign({ apikey: "anon-key" }, x || {}) };
  const files = Object.assign({}, BASE, { "kb/status/commons.json": commonsWith(over) });
  w.fetch = function (url) {
    url = String(url);
    if (/rpc\/commons_handover_summary/.test(url) || /rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const hit = files[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
const cardOf = (d, k) => d.querySelector('.cmf-card[data-key="' + k + '"]');
const quickTexts = (d, k) => Array.from(cardOf(d, k).querySelectorAll(".cmf-quick a[data-onpage]")).map(txt);

(async function () {
  let x = load();
  await x.M.boot(); await settle();
  let d = x.d;
  check("the front page draws every card", CONVERTED.every((k) => cardOf(d, k)), CONVERTED.filter((k) => !cardOf(d, k)).join(","));

  /* (1) folded at the top section, no empty stage */
  const bad1 = [];
  CONVERTED.concat(["subjects"]).forEach((k) => {
    const c = cardOf(d, k), bs = Array.from(c.querySelectorAll("button.cmf-stage-b"));
    if (!bs.length) bad1.push(k + ": no stage");
    bs.forEach((b) => {
      const box = d.getElementById(b.getAttribute("aria-controls"));
      if (b.getAttribute("aria-expanded") !== "false" || !box || !box.hasAttribute("hidden")) bad1.push(k + " " + txt(b) + ": not folded");
      if (!box || !box.querySelector(".cmf-check")) bad1.push(k + " " + txt(b) + ": empty");
      if (["Collect", "Curate", "Connect"].indexOf(txt(b)) < 0) bad1.push(k + ": a stage named " + txt(b));
    });
    if (c.querySelector(".cmf-quick") && c.querySelector(".cmf-quick").closest("[hidden]")) bad1.push(k + ": the quick links sit inside a fold");
  });
  check("(1) ⭐ on every converted card Collect, Curate and Connect start folded, and no stage is empty", !bad1.length, bad1.join(" | "));
  check("(1) the Plan keeps its own shape, with no stage", !cardOf(d, "plan").querySelector(".cmf-stage-b") && cardOf(d, "plan").querySelectorAll(".cmf-phase").length === 3);
  const order = CONVERTED.every((k) => {
    const body = cardOf(d, k).querySelector(".cmf-body"), kids = Array.from(body.children);
    const q = kids.findIndex((n) => n.classList.contains("cmf-quick")), l = kids.findIndex((n) => n.matches("ul.cmf-list")), s = kids.findIndex((n) => n.classList.contains("cmf-stage"));
    const ok = l >= 0 && s > l && (q < 0 || q < l) && /^Why:/.test(txt(kids[l].querySelector("li")));
    return ok;
  });
  check("(1) each card reads top down: Needs action first, then Why, then the stages", order);

  /* (2) every check acts somewhere; every quick link lands on its check */
  const bad2 = [];
  Array.from(d.querySelectorAll(".cmf-card .cmf-check")).forEach((c) => {
    const acts = c.querySelectorAll(".cmf-act");
    const links = acts.length === 1 ? Array.from(acts[0].querySelectorAll("a")).filter((l) => (l.getAttribute("href") || "").length > 1) : [];
    if (acts.length !== 1 || !/^Where to act:/.test(txt(acts[0])) || !links.length) bad2.push(c.id);
  });
  check("(2) ⭐ every check has one Where to act line with at least one link", d.querySelectorAll(".cmf-card .cmf-check").length >= 25 && !bad2.length, bad2.join(", "));
  const quick = Array.from(d.querySelectorAll(".cmf-card .cmf-quick a[data-onpage]"));
  const missing = CONVERTED.filter((k) => k !== "cdc" && !cardOf(d, k).querySelector(".cmf-quick a"));   /* cdc's figures are the live file's */
  check("(2) every converted card carries its quick links, at most five, each with its count", !missing.length && quick.length >= 15
    && Array.from(d.querySelectorAll(".cmf-quick")).every((q) => q.querySelectorAll("a").length <= 5) && quick.every((l) => /^[\d,]+ \S/.test(txt(l))), missing.join(","));
  const bad3 = [];
  quick.forEach((l) => {
    const id = l.getAttribute("data-onpage"), t = d.getElementById(id), own = l.closest(".cmf-card");
    if (!t || !t.classList.contains("cmf-check") || t.closest(".cmf-card") !== own) { bad3.push(txt(l) + " -> " + id + ": no check in its card"); return; }
    const box = t.closest(".cmf-stage-x"), b = own.querySelector('button.cmf-stage-b[aria-controls="' + box.id + '"]');
    if (b.getAttribute("aria-expanded") === "true") b.click();   /* start folded, as a reader finds it */
    x.w.scrolled = [];
    l.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    if (b.getAttribute("aria-expanded") !== "true" || box.hasAttribute("hidden")) bad3.push(txt(l) + ": its stage stayed folded");
    /* S722 (Sam, 2026-11-24): "it should drop you on a lower link and highlight the link ... Do not just drop the user on
       text that has no link": the focus lands on a Where to act link inside the check, highlighted; the one the quick
       link names where it names one. */
    const to = l.getAttribute("data-onpage-to"), A = d.activeElement;
    /* S723: a list the check holds (.cmf-land: a college's own link, or a hand-over's summary) is a landing place too. */
    if (!A || (A.tagName !== "A" && A.tagName !== "SUMMARY") || !t.contains(A) || !A.closest(".cmf-act, .cmf-land")) bad3.push(txt(l) + ": focus on " + (A && (A.id || A.tagName)) + ", not a link in its check");
    else if (!A.classList.contains("cmf-hl")) bad3.push(txt(l) + ": its link is not highlighted");
    else if (to && A.getAttribute("href") !== to) bad3.push(txt(l) + ": landed on " + A.getAttribute("href") + ", not " + to);
    if (A && A.dispatchEvent) A.dispatchEvent(new x.w.FocusEvent("blur"));
    if (/#commons\//.test(x.w.location.hash)) bad3.push(txt(l) + ": it routed");
  });
  check("(2) ⭐ every quick link opens its stage and lands on a highlighted link in its check, in its own card", quick.length && !bad3.length, bad3.join(" | "));

  /* (3) one id, one element */
  const seen = {}, dup = [];
  Array.from(d.querySelectorAll("[id]")).forEach((n) => { if (seen[n.id]) dup.push(n.id); seen[n.id] = true; });
  check("(3) ⭐ every id on the page is unique", !dup.length && d.querySelectorAll("[id^='cmf-'][id*='-check-']").length >= 25, dup.slice(0, 8).join(", "));
  check("(3) each card's checks carry its own key", CONVERTED.every((k) => Array.from(cardOf(d, k).querySelectorAll(".cmf-check")).every((c) => c.id.indexOf("cmf-" + k + "-check-") === 0)));

  /* (5) the Subjects card's ids */
  const sc = cardOf(d, "subjects");
  const subjIds = ["cmf-subj-check-1", "cmf-subj-check-2", "cmf-subj-check-3", "cmf-subj-check-4", "cmf-subj-quick", "cmf-subj-stage-collect", "cmf-subj-stage-curate", "cmf-subj-stage-connect"];
  check("(5) ⭐ the Subjects card keeps cmf-subj-check-1 to 4, cmf-subj-quick and its stage ids", subjIds.every((id) => { const n = d.getElementById(id); return n && sc.contains(n); })
    && !sc.querySelector("[id^='cmf-subjects-']"), subjIds.filter((id) => !d.getElementById(id)).join(","));
  check("(5) the Subjects card's Curate check opens the MQ disciplines", !!d.querySelector('#cmf-subj-check-2 .cmf-act a[href="#commons/subjects/mq"]'));

  /* (4) a figure at zero is left out */
  check("(4) the injected figures above zero show as quick links", quickTexts(d, "courses").indexOf("7 cards that need repair") >= 0
    && quickTexts(d, "exhibit").indexOf("5 credentials with no common subject code") >= 0, quickTexts(d, "courses").concat(quickTexts(d, "exhibit")).join(" | "));
  x = load({ course: { needs_repair: 0 }, exhibit: { no_subject: 0 } });
  await x.M.boot(); await settle();
  d = x.d;
  check("(4) ⭐ a quick link whose figure is zero is left out", !quickTexts(d, "courses").some((t) => /need repair/.test(t)) && !quickTexts(d, "exhibit").some((t) => /common subject code/.test(t))
    && quickTexts(d, "courses").length >= 1, quickTexts(d, "courses").concat(quickTexts(d, "exhibit")).join(" | "));
  check("(4) the check itself still shows its zero", /0 with none/.test(txt(d.querySelector('.cmf-card[data-key="exhibit"] .cmf-check:last-of-type .cmf-check-fig'))) || Array.from(cardOf(d, "exhibit").querySelectorAll(".cmf-check-fig")).some((f) => txt(f) === "0 with none"));

  // (6) the Commons is home base (the anchor page, step 3): a card's title opens that card's own list.
  const LISTS = { subjects: "#commons/subjects", cdc: "#collect", colleges: "#collect", programs: "#program-requirements/list", "courses-data": "#coci-lookup/courses/common",
    courses: "#coci-lookup/courses", exhibit: "#exhibits/list", credentials: "#exhibits/list", cr: "#cr-reference" };
  Object.keys(LISTS).forEach((k) => {
    const t = d.querySelector('.cmf-card[data-key="' + k + '"] .cmf-card-t'), l = t && t.querySelector("a.cmf-card-tl");
    check("(6) ⭐ the " + k + " card's title opens its list", !!l && l.getAttribute("href") === LISTS[k] && txt(t) === txt(l) && /^Open the .+ list$/.test(l.getAttribute("aria-label")),
      t ? t.outerHTML.slice(0, 200) : "no title");
  });
  const inter = d.querySelector('.cmf-card[data-key="interconnect"] .cmf-card-t');
  check("(6) a card with no list of its own keeps a plain title", !!inter && !inter.querySelector("a"), inter && inter.outerHTML.slice(0, 160));

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); });
  console.log((results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
