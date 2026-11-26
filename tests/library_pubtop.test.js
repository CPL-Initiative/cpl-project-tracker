// The card's top Publish to Public Library lands in the form it opens (Sam, 2026-11-25, in session: on a piece's card
// the first Publish to Public Library did nothing; the one lower down, in the card's Details, worked).
//
// The cause: both buttons draw the same form, in the card's Details, below the card's face. The press then focused
// #lp-sum, and the form carries #lp-sum only once the piece's accessibility check passes. For a piece not yet certified
// focus stayed on the top button and the form drew out of sight, so the top press looked like nothing; the lower button
// sits beside the form, so its press showed.
//
// Guards the failure mode on both surfaces (the List's side panel and the Cards): pressing the top Publish to Public
// Library draws the form, and focus lands inside it, on the Public summary.
//
// Every publish form carries that summary, certified or not, prefilled from the internal one (Sam, 2026-11-25: "can you
// have library auto add a summary I can edit so if I forget and click publish, we'll still have a summary?"). Before,
// the not-yet-certified form had none, so a press saved publish_target 'public' with public_summary null, and the check
// run (scripts/library_check.py) lists a passing piece only when it holds a summary. Submitting with the field emptied
// sends the internal summary, through cpl_library_set_public with p_listed false.
//
// Run from repo root: `npm test` (or `node tests/library_pubtop.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const LIST = fs.readFileSync("commons_list.js", "utf8");

const BASE = { kind: "document", occasion: "Summit", made_on: "2026-10-19", status: "approved", seen_by: "team", home: "drive",
  sources: [], versions: [], updated_at: "2026-11-01T10:00:00Z", publish_target: null, template: false, division: "cobi" };
const ROWS = [
  Object.assign({}, BASE, { id: "m1", slug: "memo", title: "A memo", url: "https://studentrcc.sharepoint.com/sites/x/memo.docx", summary: "A memo for the summit." }),
  // No check record yet: the form draws its "Not yet certified" line and buttons, with no Public summary.
  Object.assign({}, BASE, { id: "m2", slug: "brief", title: "A brief", url: "https://studentrcc.sharepoint.com/sites/x/brief.docx", summary: "A brief.",
    updated_at: "2026-10-30T10:00:00Z" })
];
// A passing check record for m1's page as the record names it now.
const PASS = { library_id: "m1", version_key: "page", url: ROWS[0].url, standard: "WCAG 2.1 AA and Section 508", checked_at: "2026-11-19T18:00:00Z",
  tool_or_reviewer: "axe-core automated check", result: "pass", report_url: "https://example.org/report" };

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); }, text: function () { return Promise.resolve(JSON.stringify(body)); } });
}
const settle = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root"></div></body></html>',
    { url: "https://example.org/" + hash, runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = function (url, init) {
    url = String(url);
    if (init && init.method && init.method !== "GET") { calls.push({ url: url, method: init.method, body: JSON.parse(init.body || "{}") }); return response(200, [{}]); }
    if (/cpl_library_checks/.test(url)) return response(200, [PASS]);
    if (/cpl_library_drafts|cpl_library_division_settings|\/rpc\//.test(url)) return response(200, []);
    return response(200, ROWS);
  };
  const l = w.document.createElement("script"); l.textContent = LIST; w.document.body.appendChild(l);
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w: w, doc: w.document, calls: calls, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}

// Open the piece's card on the surface, press its top Publish to Public Library, and report what the press drew.
async function pressTop(hash, r) {
  const m = load(hash);
  await m.M.activate(); await settle();
  let top;
  if (hash === "#library") {
    const t = Array.prototype.filter.call(m.doc.querySelectorAll("#lib-list tbody button"), function (b) { return b.textContent.indexOf(r.title) === 0; })[0];
    if (t) click(m.w, t);
    await settle();
    const panel = m.doc.getElementById("libl-panel");
    top = panel && panel.querySelector('.lib-next [data-pubtop="' + r.id + '"]');
  } else {
    top = m.root.querySelector('.lib-acts [data-pubtop="' + r.id + '"]');
  }
  if (top) click(m.w, top);
  await settle();
  const form = m.root.querySelector('form[data-pubform="' + r.id + '"]');
  const at = m.doc.activeElement;
  return { m: m, top: !!top, form: form, at: at, inForm: !!(form && at && form.contains(at)),
    why: at ? at.outerHTML.slice(0, 120) : "nothing focused" };
}

(async function () {
  for (const [hash, where] of [["#library", "the List's card (its side panel)"], ["#library/cards", "the Cards' card"]]) {
    const a = await pressTop(hash, ROWS[0]);
    check(where + " offers Publish to Public Library at its top", a.top);
    check("⭐ " + where + ": the top press draws the form and focuses the Public summary",
      !!a.form && a.inForm && a.at.id === "lp-sum", a.why);
    const b = await pressTop(hash, ROWS[1]);
    check(where + " offers it for a piece not yet certified too", b.top);
    check("⭐ " + where + ": for a piece not yet certified the press draws the form and focuses its Public summary",
      !!b.form && b.inForm && b.at.id === "lp-sum" && /Not yet certified/.test(b.form.textContent), b.why);
    check("⭐ " + where + ": that summary starts from the internal one, to edit", !!b.at && b.at.value === ROWS[1].summary, b.at && b.at.value);
  }
  // A forgotten summary still lands: the field emptied, the press saves the internal summary, and lists nothing.
  {
    const b = await pressTop("#library/cards", ROWS[1]);
    b.at.value = "";
    b.form.dispatchEvent(new b.m.w.Event("submit", { bubbles: true, cancelable: true }));
    await settle(); await settle();
    const patch = b.m.calls.filter(function (c) { return c.method === "PATCH" && /\/cpl_library\?/.test(c.url); })[0];
    const rpc = b.m.calls.filter(function (c) { return /rpc\/cpl_library_set_public$/.test(c.url); });
    check("the press keeps the choice to publish (publish_target public)", !!patch && patch.body.publish_target === "public" && !("public_summary" in patch.body));
    check("⭐ an emptied summary saves the internal summary in its place, unlisted until the check passes",
      rpc.length === 1 && rpc[0].body.p_listed === false && rpc[0].body.p_summary === ROWS[1].summary && rpc[0].body.p_slug === "brief",
      JSON.stringify(rpc.map(function (c) { return c.body; })));
  }

  let fail = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "ok   " : "FAIL ") + name + (ok || !why ? "" : "\n       " + why));
    if (!ok) fail++;
  }
  console.log("\nlibrary_pubtop.test.js: " + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
