// The statewide or most-used title named on a Review card, and related titles changed from the side panel (Sam, in
// session, 2026-11-12: "for the firefighter academy example, it should be renamed "Firefighter 1" which is the
// statewide exhibit ... it would be good to see some indication of the alignment with a statewide exhibit ... I would
// like to be able to change all those needing it to firefighter 1 in the sidebar"; and "i need to be able to use this
// title on the sidebar candidates that need it"). Guarded here:
//   - the statewide title is named on the card, in words, near Also proposed, and Use it fills the card's title;
//   - in the panel it is marked Statewide exhibit and sorted first; with none statewide the most used title (at least
//     POPULAR_MIN local titles, more than any other) is named and marked Most used; with neither, no line;
//   - nothing is checked by default; a title in a ruled plan, saved to be renamed, or one others wait to fold into,
//     has no checkbox and says why;
//   - the checked titles, or one row's own Change to control, ask first in the panel and save exactly the rename
//     batch's fold rows (renameRows), under the signed-in reviewer; unchecked titles write nothing;
//   - the rows are read again at the save and a title held since writes nothing; signed out, nothing saves;
//   - after a save the panel shows it at once, focus stays in the panel, and the titles join Changed this visit.
// Run from repo root: `npm test` (or `node tests/exhibits_related_actions.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const SFT = "California State Fire Training (SFT)";
const CCC = "California Community Colleges";
function held(raw, title, issuer, extra) {
  return Object.assign({ raw: raw, step: "Proposed", title: title, issuer: issuer, ids: ["X-" + raw], art: [0], could: [], under: [], under_count: 0, exists: false }, extra || {});
}
const FIRE = held("Firefighter Recruit Academy Certificate", "Firefighter Academy", SFT, { alternates: ["Firefighter 1 Academy"] });
const WELD = held("Welding Fundamentals Cert", "Welding Fundamentals", CCC);
const GUIT = held("Guitar Lessons Class", "Guitar Lessons", CCC);
function review(h) {
  return { schema: 1, written_at: "2026-11-12T07:50:00Z", sources: { procedures_run: "2026-11-12T07:47:00Z" },
    tiles: { names: { n: 1, of: 2, waiting: 1 }, aligned: { n: 0, of: 1 }, saved_not_folded: 0 }, steps: {}, colleges: ["American River College"], held: [h] };
}
const RELATED = { schema: 1, generated_at: "2026-11-12T07:55:00Z", rule: {}, issuers: [CCC, SFT], paths: {},
  titles: [
    ["Firefighter 1", 1, 11, 19, 0],
    ["Firefighter 1 Academy", 1, 2, 1, 0],
    ["Firefighter 1 Academy Physical Training", 1, 1, 1, 0],
    ["Firefighter 1 Academy — Advanced", 1, 1, 1, 0],
    ["Firefighter 1A", 1, 2, 11, 0],
    ["Firefighter Academy", 1, 0, 0, 1],
    ["Firefighter I Academy", 1, 1, 1, 0],
    ["Firefighter Pending Academy", 1, 1, 1, 0],
    ["Firefighter Ruled Academy", 1, 1, 1, 0],
    ["Firefighter Saved Academy", 1, 1, 1, 0],
    ["Guitar Lessons", 0, 0, 0, 1],
    ["Guitar Lessons Group", 0, 2, 2, 0],
    ["Guitar Lessons Solo", 0, 2, 2, 0],
    ["Welding Fundamentals", 0, 0, 0, 1],
    ["Welding Fundamentals Certificate", 0, 5, 4, 0],
    ["Welding Fundamentals Lab", 0, 2, 2, 0]],
  families: {}, pending: {}, batches: [], waiting: [] };
const ALIAS_MAP = { _generated_at: "2026-11-12T11:53:49Z", renames: {}, merges: {}, held_family: [], held_emptied: [],
  ruled: { applied: [{ old: "Firefighter Ruled Academy", "new": "Firefighter 2", kind: "rename", plan_id: "plan-x" }], held: [], done: [] } };
// The real files, for the four cards the #3160 review measured. The cards themselves are pinned in a fixture: the live
// kb/exhibits_review.json drops a card once a reviewer rules on it, and its held list may be empty (S643, S649).
const REAL_REVIEW = JSON.parse(fs.readFileSync("kb/exhibits_review.json", "utf8"));
const MEASURED = JSON.parse(fs.readFileSync("tests/fixtures/exhibits_review_measured_cards.json", "utf8"));
const REAL_RELATED = JSON.parse(fs.readFileSync("kb/exhibits_related.json", "utf8"));
const REAL_PLANS = JSON.parse(fs.readFileSync("kb/cred_rename_dryrun/alias_map.json", "utf8"));
const REAL_SW_SRC = fs.readFileSync("fact-sheet/statewide_recs.js", "utf8");
const REAL_STATEWIDE = JSON.parse(REAL_SW_SRC.slice(REAL_SW_SRC.indexOf("{"), REAL_SW_SRC.lastIndexOf("}") + 1));
function realCard(raw) { return MEASURED.held.find(function (h) { return h.raw === raw; }); }
const STATEWIDE = { "Firefighter 1": [{ t: "3 hours in Fire Protection Organization", id: "MAPICI-FF1-1-001" }], "Firefighter 1A": [{ t: "3 hours", id: "MAPICI-FF1A-1-001" }] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : null });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(review(opts.card || FIRE));
    if (url === "kb/exhibits_related.json") return ok(opts.real ? REAL_RELATED : RELATED);
    if (url === "kb/cred_rename_dryrun/alias_map.json") return opts.noPlans ? bad(404) : ok(opts.real ? REAL_PLANS : ALIAS_MAP);
    if (/\/rest\/v1\/rpc\//.test(url)) return ok([]);
    if (opts.store && /\/rest\/v1\/kb_curation/.test(url)) {
      if ((init.method || "GET") === "GET") return ok(Object.keys(opts.store).map(function (k) { return opts.store[k]; }));
      [].concat(JSON.parse(init.body)).forEach(function (r) { opts.store[r.course_id + "|" + r.field] = r; });
      return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    }
    if (/\/rest\/v1\/kb_curation\?select=/.test(url)) {
      const u = decodeURIComponent(url);
      if (opts.failLive && /field=in\.\(unified_title_override,unified_title_merge_confirm\)/.test(u)) return bad(503);
      if (opts.real) return ok([]);
      if (/&course_id=in\.\(/.test(u)) return ok([{ course_id: "_CREDENTIAL_REVIEW::Firefighter Saved Academy", field: "unified_title_override", value: "Firefighter 2" }].concat(opts.liveOwn || []));
      if (/&value=in\.\(/.test(u)) {
        const rows = [{ course_id: "_CREDENTIAL_REVIEW::Some Other Title", field: "unified_title_merge_confirm", value: "Firefighter Pending Academy" }].concat(opts.liveInto || []);
        if (opts.lateBlock) rows.push({ course_id: "_CREDENTIAL_REVIEW::A Late Title", field: "unified_title_override", value: opts.lateBlock });
        return ok(rows);
      }
      return ok([]);
    }
    if (/\/rest\/v1\/kb_curation$/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedOut ? null : { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (name, global, cb) {
    if (name === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    if (name === "credential_reference_data.js" && opts.credref) w[global] = JSON.parse(JSON.stringify(opts.credref));
    setTimeout(function () { if (name === "fact-sheet/statewide_recs.js" && !opts.noStatewide) w.CPL_STATEWIDE_RECS = JSON.parse(JSON.stringify(opts.real ? REAL_STATEWIDE : STATEWIDE)); cb(); }, 0);
  } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls, opts: opts };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
async function boot(opts) { const t = load(opts); await t.M.boot(); await settle(); return t; }
function panel(d) { return d.querySelector("aside.exh-rel"); }
function titles(d) { return Array.from(panel(d).querySelectorAll(".exh-rel-t")).map(txt); }
function item(d, title) { return Array.from(panel(d).querySelectorAll(".exh-rel-list li")).find(function (li) { return txt(li.querySelector(".exh-rel-t")) === title; }); }
function byText(root, sel, t) { return Array.from(root.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
function posts(t) { return t.calls.filter(function (c) { return c.method === "POST" && /\/rest\/v1\/kb_curation$/.test(c.url); }); }
function rowsOf(t) { return posts(t).reduce(function (a, c) { return a.concat(c.body); }, []); }
function cb(d, title) { const li = item(d, title); return li && li.querySelector("input[type=checkbox]"); }
async function showAll(t) { const b = Array.from(panel(t.d).querySelectorAll("button")).find(function (x) { return /^Show all/.test(txt(x)); }); if (b) { b.click(); await settle(); } }
async function tickBox(t, title) { const c = cb(t.d, title); c.checked = true; c.dispatchEvent(new t.w.Event("change")); }

(async function () {
  // ── the statewide exhibit on the card and first in the panel ──
  let t = await boot();
  let d = t.d;
  await showAll(t);
  const line = d.querySelector(".exh-align");
  check("the card names the statewide exhibit in words, with its local titles and colleges", line && !line.hidden
    && /^This looks like the statewide exhibit Firefighter 1 \(11 local titles, articulated at 19 colleges\)\. Use it$/.test(txt(line)), txt(line));
  check("the line sits beside Also proposed, inside the card's title block", line && line.closest(".exh-canon")
    && /Also proposed: Firefighter 1 Academy/.test(txt(line.previousElementSibling)));
  check("the panel sorts the statewide exhibit first, under its own words", titles(d)[0] === "Firefighter 1"
    && txt(panel(d).querySelector(".exh-rel-tier")) === "The statewide exhibit", titles(d).join("|"));
  check("its row is marked Statewide exhibit, in words; color is not the signal", /Statewide exhibit/.test(txt(item(d, "Firefighter 1").querySelector(".exh-rel-mark")))
    && /Statewide exhibit/.test(txt(item(d, "Firefighter 1A"))) && !/Statewide exhibit/.test(txt(item(d, "Firefighter 1 Academy"))));
  check("the target defaults to the statewide exhibit", d.getElementById("exh-rel-target") && d.getElementById("exh-rel-target").value === "Firefighter 1"
    && !!byText(panel(d), "button", "Change the checked titles to Firefighter 1"));
  check("the target chooser has a label", !!d.querySelector("label[for=exh-rel-target]"));
  await showAll(t);
  const boxes = Array.from(panel(d).querySelectorAll("input[type=checkbox]"));
  check("nothing is checked by default", boxes.length > 0 && boxes.every(function (b) { return !b.checked; }));
  check("each checkbox has a label naming its title", boxes.every(function (b) { const l = d.querySelector("label[for='" + b.id + "']"); return l && txt(l).length > 0; }));
  check("the titles that can change have a checkbox", ["Firefighter 1 Academy", "Firefighter 1 Academy Physical Training", "Firefighter 1 Academy — Advanced",
    "Firefighter I Academy", "Firefighter 1A"].every(function (x) { return !!cb(d, x); }));
  check("the target and a proposed title have none", !cb(d, "Firefighter 1") && !cb(d, "Firefighter Academy")
    && /The checked titles change to this one\./.test(txt(item(d, "Firefighter 1"))));
  check("a title in a ruled plan has no checkbox and says why", !cb(d, "Firefighter Ruled Academy")
    && /In a ruled plan \(plan-x\) that renames it to Firefighter 2\./.test(txt(item(d, "Firefighter Ruled Academy"))));
  check("a pending merge target has no checkbox and says why", !cb(d, "Firefighter Pending Academy")
    && /1 title is saved to fold into it, so it stays until they land\./.test(txt(item(d, "Firefighter Pending Academy"))));
  check("a title saved to be renamed has no checkbox and says why", !cb(d, "Firefighter Saved Academy")
    && /Already saved to be renamed Firefighter 2/.test(txt(item(d, "Firefighter Saved Academy"))));
  check("a held title offers no Change to control either", !Array.from(item(d, "Firefighter Ruled Academy").querySelectorAll("button")).some(function (b) { return /^Change to/.test(txt(b)); }));
  check("the rows were read live, with Range paging", t.calls.some(function (c) { return /kb_curation\?select=/.test(c.url) && /course_id=in\./.test(c.url) && c.headers.Range === "0-999"; }));

  byText(panel(d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  check("pressed with nothing checked, it says so and writes nothing", /Check one or more titles first\./.test(txt(d.getElementById("exh-rel-note"))) && posts(t).length === 0);
  await showAll(t);
  for (const x of ["Firefighter 1 Academy", "Firefighter 1 Academy Physical Training", "Firefighter I Academy"]) await tickBox(t, x);
  byText(panel(d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  const ask = d.getElementById("exh-rel-ask-h");
  check("the confirmation says how many titles, how many local titles, and the target", ask && txt(ask) === "3 titles, 4 local titles, will fold into Firefighter 1.", txt(ask));
  check("it lists each title with what will happen", /Firefighter 1 Academy, 2 local titles: folds into Firefighter 1; its name stays a search alias\./.test(txt(ask.parentNode))
    && /Firefighter I Academy, 1 local title: folds into Firefighter 1/.test(txt(ask.parentNode)));
  check("the confirmation is inside the panel, announced, and takes focus", !!ask.closest("aside.exh-rel") && ask.getAttribute("aria-live") === "polite"
    && d.activeElement === ask);
  check("nothing saves before the confirmation is answered", posts(t).length === 0);
  byText(panel(d), "button", "Cancel").click(); await settle();
  check("Cancel writes nothing", posts(t).length === 0 && !d.getElementById("exh-rel-ask-h"));
  byText(panel(d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  const before = t.calls.length;
  byText(panel(d), "button", "Save").click(); await settle();
  const rows = rowsOf(t);
  const firstPost = t.calls.findIndex(function (c, i) { return i >= before && c.method === "POST"; });
  check("the rows are read again at the save, before the write", t.calls.slice(before, firstPost).some(function (c) { return /kb_curation\?select=/.test(c.url); }));
  check("the save posts to kb_curation as an upsert, under the reviewer's token",
    posts(t).length === 1 && /resolution=merge-duplicates/.test(posts(t)[0].headers.Prefer) && /^Bearer aaaa/.test(posts(t)[0].headers.Authorization));
  const saved = ["Firefighter 1 Academy", "Firefighter 1 Academy Physical Training", "Firefighter I Academy"];
  const expect = t.M._renameRows("reviewer@example.org", { renames: saved.map(function (x) { return { r: { current: x }, to: "Firefighter 1", merge: true }; }), skips: [] });
  function strip(r) { return JSON.stringify([r.course_id, r.field, r.value, r.reviewer_email, Object.keys(r).sort()]); }
  check("each checked title saves exactly the rename batch's fold rows: the override and the merge confirm naming the target",
    rows.length === 6 && rows.map(strip).sort().join("\n") === expect.map(strip).sort().join("\n"), JSON.stringify(rows));
  check("the row shape is the batch's own: course_id, field, value, reviewer_email, reviewed_at",
    rows.every(function (r) { return Object.keys(r).sort().join(",") === "course_id,field,reviewed_at,reviewer_email,value"; })
    && rows.every(function (r) { return /^_CREDENTIAL_REVIEW::/.test(r.course_id) && r.reviewer_email === "reviewer@example.org"; })
    && rows.filter(function (r) { return r.field === "unified_title_override"; }).length === 3
    && rows.filter(function (r) { return r.field === "unified_title_merge_confirm"; }).length === 3);
  check("an unchecked title writes nothing", !rows.some(function (r) { return /Advanced|Firefighter 1A$/.test(r.course_id); }));
  check("no local title's assignment and no new row kind is written", rows.every(function (r) { return ["unified_title_override", "unified_title_merge_confirm"].indexOf(r.field) >= 0; }));
  await showAll(t);
  check("the panel shows the save at once: the saved titles say so and lose their checkbox",
    saved.every(function (x) { return !cb(d, x) && /Saved this visit: folds into Firefighter 1\./.test(txt(item(d, x))); }), txt(panel(d)));
  check("the note says what happens next, and focus stays in the panel",
    /Saved: 3 titles fold into Firefighter 1\. The daily dry run pairs them/.test(txt(d.getElementById("exh-rel-note"))) && !!d.activeElement.closest("aside.exh-rel"));
  check("the saved titles join the List's Changed this visit", saved.every(function (x) { return t.M._state.ls && t.M._state.ls.changed.indexOf(x) >= 0; })
    && t.M._state.cs.overlay["Firefighter 1 Academy"].title === "Firefighter 1" && t.M._state.cs.overlay["Firefighter 1 Academy"].merge === "Firefighter 1");

  // ── the card's Use it ──
  t = await boot();
  byText(t.d.querySelector(".exh-align"), "button", "Use it").click(); await settle();
  check("Use it on the line fills the card's title and the title's issuer, as Use this title does",
    t.d.getElementById("exh-title").value === "Firefighter 1" && t.d.getElementById("exh-issuer").value === SFT);
  check("once the card holds the statewide title, the line says so and suggests nothing else",
    txt(t.d.querySelector(".exh-align")) === "This is a statewide exhibit." && !t.d.querySelector(".exh-align button") && posts(t).length === 0);

  // ── one row's own Change to control (Sam: "use this title on the sidebar candidates that need it") ──
  t = await boot();
  await showAll(t);
  const one = byText(item(t.d, "Firefighter 1A"), "button", "Change to Firefighter 1");
  check("an eligible row has its own Change to control, named for the row", one && one.getAttribute("aria-label") === "Change Firefighter 1A to Firefighter 1");
  one.click(); await settle();
  check("it asks with the same confirmation, for that one row", txt(t.d.getElementById("exh-rel-ask-h")) === "1 title, 2 local titles, will fold into Firefighter 1." && posts(t).length === 0);
  byText(panel(t.d), "button", "Save").click(); await settle();
  let r1 = rowsOf(t);
  check("and saves the same two rows for that title alone", r1.length === 2 && r1.every(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::Firefighter 1A" && r.value === "Firefighter 1"; })
    && r1.map(function (r) { return r.field; }).sort().join(",") === "unified_title_merge_confirm,unified_title_override");

  // ── another target ──
  t = await boot();
  const sel = t.d.getElementById("exh-rel-target");
  sel.value = "Firefighter 1A"; sel.dispatchEvent(new t.w.Event("change")); await settle();
  check("choosing another target renames the control and frees the old one to be checked",
    !!byText(panel(t.d), "button", "Change the checked titles to Firefighter 1A") && !!cb(t.d, "Firefighter 1") && !cb(t.d, "Firefighter 1A")
    && t.d.activeElement && t.d.activeElement.id === "exh-rel-target");

  // ── a title held between the panel's read and the save ──
  t = await boot();
  await tickBox(t, "Firefighter 1 Academy");
  byText(panel(t.d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  t.opts.lateBlock = "Firefighter 1 Academy";
  byText(panel(t.d), "button", "Save").click(); await settle();
  check("a title another row now folds into is caught at the save, and nothing is written",
    posts(t).length === 0 && /Nothing was saved: Firefighter 1 Academy: 1 title is saved to fold into it/.test(txt(t.d.getElementById("exh-rel-note"))));

  // ── signed out ──
  t = await boot({ signedOut: true });
  await tickBox(t, "Firefighter 1 Academy");
  byText(panel(t.d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  byText(panel(t.d), "button", "Save").click(); await settle();
  check("signed out, the save writes nothing and says to sign in", posts(t).length === 0
    && /Sign in as a reviewer to save\. Nothing was saved\./.test(txt(t.d.getElementById("exh-rel-note"))));

  // ── the ruled plans unread: nothing can change ──
  t = await boot({ noPlans: true });
  check("without the ruled plans no title can be checked, and the panel says why", panel(t.d).querySelectorAll("input[type=checkbox]").length === 0
    && /ruled plans could not be read/.test(txt(panel(t.d))) && !byText(panel(t.d), "button", "Change the checked titles to Firefighter 1"));

  // ── the popular title when none is statewide ──
  t = await boot({ card: WELD });
  const wl = t.d.querySelector(".exh-align");
  check("with none statewide, the most used title is named", wl && !wl.hidden
    && txt(wl) === "A popular title for this is Welding Fundamentals Certificate (5 local titles, articulated at 4 colleges). Use it", txt(wl));
  check("and marked Most used, first in the panel", titles(t.d)[0] === "Welding Fundamentals Certificate"
    && txt(panel(t.d).querySelector(".exh-rel-tier")) === "The most used title" && /Most used/.test(txt(item(t.d, "Welding Fundamentals Certificate").querySelector(".exh-rel-mark")))
    && t.d.getElementById("exh-rel-target").value === "Welding Fundamentals Certificate");
  check("the threshold is stated in code: at least 3 local titles and more than any other", t.M._POPULAR_MIN === 3);

  t = await boot({ card: held("Welding Fundamentals Cert II", "Welding Fundamentals Certificate", CCC) });
  check("a card already on the most used title names no other title", t.d.querySelector(".exh-align").hidden
    && !/Most used/.test(txt(panel(t.d))) && t.d.getElementById("exh-rel-target").value === "Welding Fundamentals Certificate");

  // ── neither ──
  t = await boot({ card: GUIT });
  check("with neither a statewide nor a clearly most used title, no line and no mark",
    t.d.querySelector(".exh-align").hidden && !/Statewide exhibit|Most used/.test(txt(panel(t.d))));
  t = await boot({ noStatewide: true });
  // Since the #3168 review's level rule (f): a card naming no level reaches a title naming one (Firefighter 1) only as
  // the statewide exhibit's clear lead, so with the statewide list unread it is never offered as the most used title.
  check("the statewide list unread, a levelled title is not offered as the most used one",
    t.d.querySelector(".exh-align").hidden && !/Firefighter 1/.test(txt(t.d.querySelector(".exh-align"))), txt(t.d.querySelector(".exh-align")));

  // ── the #3160 review: the real files, four cards ──
  // A held card leaves kb/exhibits_review.json once a reviewer rules on it (the recruit academy card on 2026-11-12, the
  // rest on 2026-11-13, and each time the daily run then failed this file on main). The four cards are pinned in
  // tests/fixtures/exhibits_review_measured_cards.json and read against the real related, plans and statewide files.
  async function real(raw) { return boot({ real: true, card: realCard(raw) }); }
  const REAL_RAWS = ["Firefighter Recruit Academy Certificate", "Nor Cal Carpenters Training Carpenter Apprenticeship Year 1",
    "NorCal Valley Sheet Metal Apprenticeship Journeyperson", "Plumbers Pipefitters Union Refrigeration Service Technician Apprenticeship Level 1"];
  check("the fixture pins all four measured cards", REAL_RAWS.every(realCard), REAL_RAWS.filter(function (r) { return !realCard(r); }).join(" | "));
  // The live queue: a list, and an empty one is a valid state (every card ruled on and saved in COBI).
  check("real data: kb/exhibits_review.json carries a held list (empty is valid)", Array.isArray(REAL_REVIEW.held), typeof REAL_REVIEW.held);
  if (realCard(REAL_RAWS[0])) {
  t = await real("Firefighter Recruit Academy Certificate");
  // Since the S642 proposal step (kb/title_in_use.py), the pipeline proposes the statewide exhibit itself, so the card
  // reads it as its own title; the old "Firefighter Academy" proposal is checked through the same rule just below.
  check("real data: the recruit academy card now proposes Firefighter 1, the statewide exhibit (11 local titles against Firefighter 1A's 2)",
    realCard("Firefighter Recruit Academy Certificate").title === "Firefighter 1"
    && txt(t.d.querySelector(".exh-align")) === "This is a statewide exhibit." && t.d.getElementById("exh-rel-target").value === "Firefighter 1",
    txt(t.d.querySelector(".exh-align")));
  const fireLive = t.calls.filter(function (c) { return /kb_curation\?select=/.test(c.url) && /course_id=in\./.test(c.url); });
  check("real data: the live read goes in chunks, every URL short", fireLive.length >= 1 && t.calls.filter(function (c) { return /kb_curation\?select=/.test(c.url); })
    .every(function (c) { return c.url.length < 4000; }), fireLive.map(function (c) { return c.url.length; }).join(","));
  } else { for (let i = 0; i < 2; i++) check("real data: skipped, its card is no longer held (recruit academy)", true); }
  if (realCard(REAL_RAWS[1])) {
  t = await real("Nor Cal Carpenters Training Carpenter Apprenticeship Year 1");
  check("real data: a card whose own title is statewide says so and names no sibling",
    txt(t.d.querySelector(".exh-align")) === "This is a statewide exhibit." && !/Cabinetmaker/.test(txt(t.d.querySelector(".exh-align")))
    && t.d.getElementById("exh-rel-target").value === "Carpenters Apprenticeship — Carpenter", txt(t.d.querySelector(".exh-align")));
  } else { for (let i = 0; i < 1; i++) check("real data: skipped, its card is no longer held (carpenters)", true); }
  if (realCard(REAL_RAWS[2]) && realCard(REAL_RAWS[3])) {
  t = await real("NorCal Valley Sheet Metal Apprenticeship Journeyperson");
  check("real data: the SMART sheet metal card names no other issuer's title (never AWS's SMAW)",
    !/Shielded Metal Arc Welding/.test(txt(t.d.querySelector(".exh-align"))) && !/Shielded Metal Arc Welding/.test(t.d.getElementById("exh-rel-target") ? t.d.getElementById("exh-rel-target").value : ""),
    txt(t.d.querySelector(".exh-align")) + " | " + (t.d.getElementById("exh-rel-target") || {}).value);
  const smartAlign = t.d.querySelector(".exh-align");
  t = await real("Plumbers Pipefitters Union Refrigeration Service Technician Apprenticeship Level 1");
  const uaTarget = t.d.getElementById("exh-rel-target");
  check("real data: the UA refrigeration card names no ESCO title, and the target is not one",
    !/ESCO/.test(txt(t.d.querySelector(".exh-align"))) && !(uaTarget && /ESCO/.test(uaTarget.value)),
    txt(t.d.querySelector(".exh-align")) + " | " + (uaTarget || {}).value);
  check("with nothing named and the card's title proposed, the target waits for the reviewer's choice",
    (!smartAlign || smartAlign.hidden) ? (!uaTarget || uaTarget.value === "" || !/ESCO/.test(uaTarget.value)) : true);
  } else { for (let i = 0; i < 3; i++) check("real data: skipped, its card is no longer held (sheet metal, refrigeration)", true); }

  // ── the target's own saved rows: a chain and a cycle are held ──
  t = await boot({ liveOwn: [{ course_id: "_CREDENTIAL_REVIEW::Firefighter 1", field: "unified_title_override", value: "Firefighter 2" }] });
  check("a chain on the target (it is itself saved to be renamed) is held, and nothing can be changed into it",
    /Firefighter 1 is itself saved to be renamed Firefighter 2; choose that title\./.test(txt(panel(t.d))) && !byText(panel(t.d), "button", "Change the checked titles to Firefighter 1"));
  t = await boot({ liveOwn: [{ course_id: "_CREDENTIAL_REVIEW::Firefighter 1", field: "unified_title_merge_confirm", value: "Firefighter 1 Academy" },
    { course_id: "_CREDENTIAL_REVIEW::Firefighter 1", field: "unified_title_override", value: "Firefighter 1 Academy" }] });
  check("a cycle on the target (it folds into a title it would take in) is held",
    /Firefighter 1 is itself saved to be renamed Firefighter 1 Academy/.test(txt(panel(t.d))) && !byText(panel(t.d), "button", "Change the checked titles to Firefighter 1"));
  t = await boot({ liveOwn: [{ course_id: "_CREDENTIAL_REVIEW::Firefighter 1", field: "unified_title_merge_confirm", value: "Firefighter 1A" }] });
  check("a lone merge confirm on the target is held too", /Firefighter 1 is itself saved to fold into Firefighter 1A/.test(txt(panel(t.d))));

  // ── a lone merge confirm on a candidate ──
  t = await boot({ liveOwn: [{ course_id: "_CREDENTIAL_REVIEW::Firefighter I Academy", field: "unified_title_merge_confirm", value: "Firefighter 2" }] });
  await showAll(t);
  check("a candidate whose lone merge confirm names another title has no checkbox and says why",
    !cb(t.d, "Firefighter I Academy") && /A saved merge confirm folds it into Firefighter 2/.test(txt(item(t.d, "Firefighter I Academy"))));

  // ── a failed live read at the save writes nothing ──
  t = await boot();
  await tickBox(t, "Firefighter 1 Academy");
  byText(panel(t.d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  t.opts.failLive = true;
  byText(panel(t.d), "button", "Save").click(); await settle();
  check("a live read that fails at the save writes nothing and says so", posts(t).length === 0
    && /Nothing was saved: .*could not be read/.test(txt(t.d.getElementById("exh-rel-note"))), txt(t.d.getElementById("exh-rel-note")));
  t = await boot({ failLive: true });
  check("a live read that fails at the draw leaves nothing to check", panel(t.d).querySelectorAll("input[type=checkbox]").length === 0
    && /could not be read/.test(txt(panel(t.d))));

  // ── a double press writes once ──
  t = await boot();
  await tickBox(t, "Firefighter 1 Academy");
  byText(panel(t.d), "button", "Change the checked titles to Firefighter 1").click(); await settle();
  const sv = byText(panel(t.d), "button", "Save");
  sv.click(); sv.click();
  const sv2 = byText(panel(t.d), "button", "Saving…");
  if (sv2) sv2.click();
  await settle();
  check("a double press of Save writes once", posts(t).length === 1 && rowsOf(t).length === 2);

  // ── COBIx's regression cards (#3160, second review), from the real files ──
  async function realT(title) { return boot({ real: true, card: held("COBIx " + title, title, SFT) }); }
  for (const title of ["Fire Academy", "Fire Academy Conditioning", "Kern County Fire Recruit Academy"]) {
    t = await realT(title);
    const al = t.d.querySelector(".exh-align"), tg = t.d.getElementById("exh-rel-target");
    check("real data: " + title + " (SFT) shows no line and never names Fire Inspector 1A",
      (!al || al.hidden) && !/Fire Inspector 1A/.test(txt(al)) && !(tg && tg.value === "Fire Inspector 1A"), txt(al) + " | " + (tg || {}).value);
  }
  for (const title of ["Firefighter Academy", "Wildland Firefighter"]) {
    t = await realT(title);
    check("real data: " + title + " (SFT) names Firefighter 1", /^This looks like the statewide exhibit Firefighter 1 \(/.test(txt(t.d.querySelector(".exh-align")))
      && t.d.getElementById("exh-rel-target").value === "Firefighter 1", txt(t.d.querySelector(".exh-align")));
  }

  // ── the live read pages in a stated order ──
  t = await boot();
  const liveGets = t.calls.filter(function (c) { return /kb_curation\?select=course_id,field,value,reviewed_at&field=in\.\(unified_title_override,unified_title_merge_confirm\)/.test(c.url); });
  check("every live read names its order, so Range paging neither skips nor repeats a row",
    liveGets.length > 0 && liveGets.every(function (c) { return /&order=course_id\.asc,field\.asc/.test(c.url); }));

  // ── the undo before the apply: the List's Edit back clears both rows, and the old target is checkable again ──
  const store = {
    "_CREDENTIAL_REVIEW::Firefighter I Academy|unified_title_override": { course_id: "_CREDENTIAL_REVIEW::Firefighter I Academy", field: "unified_title_override", value: "Firefighter 1A", reviewed_at: "2026-11-12T10:00:00Z" },
    "_CREDENTIAL_REVIEW::Firefighter I Academy|unified_title_merge_confirm": { course_id: "_CREDENTIAL_REVIEW::Firefighter I Academy", field: "unified_title_merge_confirm", value: "Firefighter 1A", reviewed_at: "2026-11-12T10:00:00Z" } };
  const credref = { _generated_at: "2026-11-12T06:00:00Z", unified_titles: ["Firefighter 1", "Firefighter 1A", "Firefighter I Academy"].map(function (u) {
    return { ut: u, issuer: SFT, cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] }; }) };
  t = await boot({ store: store, credref: credref });
  await showAll(t);
  check("before the undo, the fold's target is held by the fold", !cb(t.d, "Firefighter 1A")
    && /1 title is saved to fold into it/.test(txt(item(t.d, "Firefighter 1A"))) && /Already saved to be renamed Firefighter 1A/.test(txt(item(t.d, "Firefighter I Academy"))));
  t.w.location.hash = "#exhibits/list"; t.M._routeFromHash(); t.M.render(); await settle(); await settle();
  const row = Array.from(t.d.querySelectorAll(".exh-l-table tbody tr")).find(function (tr) { return /folds Firefighter I Academy into this credential/.test(txt(tr)); });
  const eb = row && Array.from(row.querySelectorAll("button")).find(function (b) { return txt(b) === "Edit"; });
  check("the List shows the saved fold, with its Edit", !!eb);
  eb.click(); await settle();
  const tbox = t.d.getElementById("exh-l-t");
  tbox.value = "Firefighter I Academy"; tbox.dispatchEvent(new t.w.Event("input"));
  const before2 = posts(t).length;
  Array.from(t.d.querySelectorAll("button")).find(function (b) { return txt(b) === "Save"; }).click(); await settle();
  const undo = posts(t).slice(before2).map(function (c) { return c.body; });
  check("the Edit back clears the rename and the merge confirm beside it, each as \"\"",
    undo.some(function (r) { return r.field === "unified_title_override" && r.value === "" && r.course_id === "_CREDENTIAL_REVIEW::Firefighter I Academy"; })
    && undo.some(function (r) { return r.field === "unified_title_merge_confirm" && r.value === "" && r.course_id === "_CREDENTIAL_REVIEW::Firefighter I Academy"; }), JSON.stringify(undo));
  t.w.location.hash = "#exhibits";
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } })); await settle(); await settle();
  await showAll(t);
  check("after the undo, the old target and the undone title are checkable again", !!cb(t.d, "Firefighter 1A") && !!cb(t.d, "Firefighter I Academy"),
    txt(item(t.d, "Firefighter 1A")) + " | " + txt(item(t.d, "Firefighter I Academy")));
  t = await boot({ store: { "_CREDENTIAL_REVIEW::Firefighter I Academy|unified_title_merge_confirm": { course_id: "_CREDENTIAL_REVIEW::Firefighter I Academy", field: "unified_title_merge_confirm", value: "Firefighter 2" } } });
  await showAll(t);
  check("a lone merge confirm's hold names the step that ends it", /in the List, Edit its title to Firefighter 2 and Save, then Edit it back and Save/.test(txt(item(t.d, "Firefighter I Academy"))));

  // ── the look ──
  const css = src.slice(src.indexOf('".exh-rel-mark'), src.indexOf('".exh-align[hidden]'));
  check("the new CSS uses tokens, never a raw hex", css.length > 100 && !/#[0-9a-fA-F]{3,8}\b/.test(css));
  check("the controls are real buttons, underlined words", Array.from(panel(t.d).querySelectorAll(".exh-rel-acts button, .exh-rel-list button")).every(function (b) {
    return b.tagName === "BUTTON" && b.getAttribute("type") === "button" && /\bexh-w\b/.test(b.className); }));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
