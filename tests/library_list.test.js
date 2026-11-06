// The Library's List view (Sam, 2026-11-05): "Add a list view option to the Library just like our CPL Commons list
// views and the current cards you have can be the sidebar details like in the Commons. Also use the new commons format."
//
// Guards what the List must not get wrong:
//   - a bare #library opens the List (as every Commons List opens first); #library/cards the Cards; both report it;
//   - every piece is a row, banded by its project, with where it stands in words;
//   - the filter words keep the drafts to review and the changes asked;
//   - a row's title opens its card beside the table: the state line, its next step, What changed, Details with Edit;
//   - Revise in the panel opens the card's box there, and a piece found in the top box opens its row's panel;
//   - the Library takes the Commons look (commons_look.js names #tab-library).
//
// Run from repo root: `npm test` (or `node tests/library_list.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const LIST = fs.readFileSync("commons_list.js", "utf8");
const LOOK = fs.readFileSync("commons_look.js", "utf8");
const P = "https://cpl-initiative.github.io/cpl-project-tracker/library/";

const ROWS = [
  { id: "l1", slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points", kind: "visual", project: "ELL IET CPL", occasion: "Grant call",
    made_on: "2026-10-23", version: "2", status: "draft", seen_by: "public", home: "web", url: P + "ell-iet-cpl-starting-points/", public_listed: true,
    extent: "One page", file_type: "html", for_kind: "agency", for_name: "EDD ELL IET Fund grantees", refresh_note: "Add Request Adopt links.",
    sources: [], versions: [], updated_at: "2026-11-05T10:00:00Z",
    regen: { requested_at: "2026-11-02T21:20:29Z", requested_by: "Sam", publish: "show", ready_at: "2026-11-03T06:21:50Z", draft_id: "d3" } },
  { id: "l2", slug: "ell-iet-ideas", title: "ELL IET CPL Ideas", kind: "document", project: "ELL IET CPL", occasion: "Grant call", made_on: "2026-10-22",
    status: "draft", seen_by: "public", home: "web", url: "https://claude.ai/artifact/ideas", sources: [], versions: [], updated_at: "2026-11-04T10:00:00Z" },
  { id: "l3", slug: "summit-deck", title: "Summit deck", kind: "deck", occasion: "Summit", made_on: "2026-10-20", version: "1", status: "approved",
    seen_by: "colleges", home: "drive", url: "https://studentrcc.sharepoint.com/sites/x/deck.pptx", refresh_note: "Update the counts.", sources: [], versions: [],
    updated_at: "2026-11-03T10:00:00Z", regen: { requested_at: "2026-11-05T08:00:00Z", requested_by: "Ashley", publish: "show" } },
  { id: "l4", slug: "memo", title: "A memo", kind: "document", occasion: "Summit", made_on: "2026-10-19", status: "presented", seen_by: "team",
    home: "web", url: "https://claude.ai/artifact/memo", sources: [], versions: [], updated_at: "2026-11-01T10:00:00Z" },
  // A project whose name sorts first and whose pieces are older: Sam's report of 2026-11-05 ("ELL is not at the top of
  // the list but was last modified") came from bands ordered by name.
  { id: "l5", slug: "adopt-guide", title: "Adopt guide", kind: "document", project: "Adopt kit", occasion: "Summit", made_on: "2026-10-18",
    status: "approved", seen_by: "team", home: "web", url: "https://claude.ai/artifact/adopt", sources: [], versions: [], updated_at: "2026-10-30T10:00:00Z" }
];

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); }, text: function () { return Promise.resolve(JSON.stringify(body)); } });
}
const settle = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

function load(hash, withList) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root"></div></body></html>',
    { url: "https://example.org/" + hash, runScripts: "dangerously" });
  const w = dom.window, writes = [];
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = function (url, init) {
    url = String(url);
    if (init && init.method && init.method !== "GET") { writes.push({ url: url, body: JSON.parse(init.body || "{}") }); return response(200, [{}]); }
    if (/cpl_library_drafts/.test(url)) return response(200, [{ id: "d3", summary: "Removed one grantee.", request: {}, html: "<!doctype html><html lang=\"en\"><head><title>T</title></head><body><h1>T</h1></body></html>" }]);
    return response(200, ROWS);
  };
  if (withList) { const l = w.document.createElement("script"); l.textContent = LIST; w.document.body.appendChild(l); }
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w: w, doc: w.document, writes: writes, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}

(async function () {
  {
    const m = load("#library", false);
    check("a bare #library opens the List", m.M._viewFromHash() === "list");
    const c = load("#library/cards", false);
    check("#library/cards opens the Cards", c.M._viewFromHash() === "cards");
  }

  const m = load("#library", true);
  await m.M.activate(); await settle();
  const doc = m.doc;
  const titles = Array.prototype.map.call(doc.querySelectorAll("#lib-list tbody tr"), function (tr) { return tr.textContent; }).join(" | ");
  check("⭐ every piece is a row of the List", ROWS.every(function (r) { return titles.indexOf(r.title) >= 0; }), titles.slice(0, 400));
  check("the List says where each piece stands, in words",
    /Draft to review/.test(titles) && /Changes asked; a session makes it/.test(titles), titles.slice(0, 400));
  check("pieces sharing a project sit under its band", /ELL IET CPL/.test(doc.getElementById("lib-list").textContent) && /2 pieces/.test(doc.getElementById("lib-list").textContent));
  check("three views: List pressed, Cards and Knowledge Base beside it",
    m.root.querySelector('[data-view="list"]').getAttribute("aria-pressed") === "true" && !!m.root.querySelector('[data-view="cards"]') && !!m.root.querySelector('[data-view="kb"]'));
  check("the box to create or remediate stays above the List", /Create or Remediate a Document/.test(m.root.textContent));
  check("and folds shut until opened, so the List leads", !!doc.getElementById("lib-boxfold") && !doc.getElementById("lib-boxfold").open);
  const order = Array.prototype.map.call(doc.querySelectorAll("#lib-list tbody tr"), function (tr) { return tr.textContent; })
    .filter(function (t) { return /Summit deck|A memo/.test(t); });
  check("⭐ last modified first, as the Cards (Sam, 2026-11-05)", order.length === 2 && /Summit deck/.test(order[0]) && /A memo/.test(order[1]), JSON.stringify(order));
  const bandOrder = Array.prototype.map.call(doc.querySelectorAll("#lib-list tbody tr"), function (tr) { return tr.textContent; })
    .map(function (t) { return /ELL IET CPL Starting Points|ELL IET CPL Ideas/.test(t) ? "ELL" : /Adopt guide/.test(t) ? "Adopt" : ""; })
    .filter(Boolean);
  check("⭐ the project holding the last-modified piece leads, so the modified-date sort holds across bands (Sam, 2026-11-05)",
    bandOrder[0] === "ELL" && bandOrder.indexOf("Adopt") > bandOrder.lastIndexOf("ELL"), JSON.stringify(bandOrder));
  const cards = load("#library/cards", false);
  await cards.M.activate(); await settle();
  const projs = Array.prototype.map.call(cards.doc.querySelectorAll(".lib-proj .lib-title, .lib-item:not(.lib-proj) .lib-title"), function (h) { return h.textContent; });
  check("the Cards order their projects the same way: newest piece first", projs.join("|").indexOf("ELL IET CPL") >= 0 &&
    (projs.indexOf("Adopt guide") < 0 || projs.indexOf("ELL IET CPL") < projs.indexOf("Adopt guide")), JSON.stringify(projs));
  check("six columns, no Seen by, so the table fits beside the side menu", m.M._state.ls.sort[0].col === 5 && !/>Seen by</.test(doc.querySelector("#lib-list thead").innerHTML));

  const st = m.M._state;
  st.ls.f = "ready"; m.M.render();
  const kept = Array.prototype.map.call(doc.querySelectorAll("#lib-list tbody tr"), function (tr) { return tr.textContent; }).join(" | ");
  check("the Draft to review filter keeps only the piece with a draft ready", /ELL IET CPL Starting Points/.test(kept) && !/Summit deck/.test(kept) && !/A memo/.test(kept), kept);
  st.ls.f = "asked"; m.M.render();
  const asked = Array.prototype.map.call(doc.querySelectorAll("#lib-list tbody tr"), function (tr) { return tr.textContent; }).join(" | ");
  check("the Changes asked filter keeps the waiting request", /Summit deck/.test(asked) && !/A memo/.test(asked), asked);
  st.ls.f = ""; m.M.render();

  // A row's title opens its card beside the table.
  const tbtn = Array.prototype.filter.call(doc.querySelectorAll("#lib-list tbody button, #lib-list tbody a"), function (b) { return /ELL IET CPL Starting Points/.test(b.textContent); })[0];
  check("a row's title is a control", !!tbtn);
  if (tbtn) click(m.w, tbtn);
  await settle(); await settle();
  const panel = doc.getElementById("libl-panel");
  check("⭐ pressing the title opens its card in the side panel", !!panel && /ELL IET CPL Starting Points/.test(panel.textContent), panel ? "" : doc.getElementById("lib-list").textContent.slice(0, 300));
  check("the panel carries the state line and the next step",
    !!panel && /Version 3 is ready to review/.test(panel.textContent) && !!panel.querySelector('[data-regenokform="l1"]') && !!panel.querySelector('[data-revise="l1"]'));
  check("the panel carries What changed, read from the draft", !!panel && /What changed in Version 3/.test(panel.textContent) && /Removed one grantee/.test(panel.textContent));
  check("and the record's Details with Edit the record", !!panel && !!panel.querySelector('[data-edittop="l1"]') && /Where it lives/.test(panel.textContent));
  click(m.w, panel.querySelector('[data-revise="l1"]'));
  await settle();
  const p2 = doc.getElementById("libl-panel");
  check("⭐ Ask for more changes opens the card's box inside the panel",
    !!p2 && !!p2.querySelector('form[data-cboxform="l1"]') && /More changes to Version 3/.test(p2.textContent) && doc.activeElement === doc.getElementById("cb-instr-l1"));
  click(m.w, p2.querySelector('[data-cboxcancel="l1"]'));
  await settle();
  click(m.w, doc.getElementById("libl-panel").querySelector('[data-edittop="l1"]'));
  check("Edit the record opens its form in the panel", !!doc.querySelector('#libl-panel form[data-editform="l1"]'));
  m.M._state.edit = null;

  // A piece found in the top box opens its row's panel and its box.
  const inp = doc.getElementById("lc-piece");
  inp.value = "A memo (Document)";
  inp.dispatchEvent(new m.w.Event("input", { bubbles: true }));
  await settle();
  const p3 = doc.getElementById("libl-panel");
  check("a piece found in the top box opens its row's panel and its Revise box", !!p3 && /A memo/.test(p3.textContent) && !!p3.querySelector('form[data-cboxform="l4"]'),
    p3 ? p3.textContent.slice(0, 200) : "no panel");

  check("⭐ the Library takes the Commons look", /"#tab-library"/.test(LOOK));
  check("the List is commons_list.js, loaded on first use", /loadScript\("commons_list\.js", "CPL_COMMONS_LIST"/.test(SRC) && /CPL_COMMONS_LIST\.create\(listSpec\(\)\)/.test(SRC));
  check("its view reports its address for a sign-in link", /viewAddress\("library"/.test(SRC));

  let pass = 0;
  results.forEach(([n, ok, why]) => { if (ok) pass += 1; console.log((ok ? "ok   " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
  console.log("\nlibrary_list.test.js: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
