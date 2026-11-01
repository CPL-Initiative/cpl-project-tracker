// Library tab — one record per deck, film and document, linking to where the file lives.
//
// Sam, 2026-10-05: "I think I may need a COBI tab to store and retrieve artifacts like
// this ppt and video". He approved the mockup and ruled: build it; files live in the
// team Drive (CPLLibrary, drafts in its Drafts folder); nothing goes into a repo but
// the source that rebuilds it. These checks guard what the tab can get wrong:
//   - without the team phrase it fetches nothing and paints no count;
//   - a failed read names its table and paints no count;
//   - Needs attention is computed from the record (not filed, a public file with no
//     audience, figures to refresh), and a not-filed piece offers File it, never Open;
//   - every write carries the team phrase, names who made it, and never deletes:
//     Retire asks first, then sets retired_at;
//   - a record holds a link, never bytes (no Storage call);
//   - tokens (no raw hex), words (no glyphs), American spelling;
//   - a private window (localStorage throws) still renders;
//   - Changes to make (Sam, 2026-10-25): a reader's comments on a piece save on
//     the record, list it under Needs attention, and Copy the request hands over
//     the paste that rebuilds it from its source and keeps its link;
//   - Regenerate (Sam, 2026-10-26), now Revise and remediate from the one box (Sam,
//     2026-10-29): every record offers it; the box saves what to change, the documents
//     to work from (a link, or a file's words read here) and the request, the card shows
//     where the request stands, and a public copy holds until Replace the public copy;
//   - File it on a brief's card moves it to Draft and dates it (Sam, 2026-10-27);
//   - Start a piece saves a Requested record with its brief, In development shows
//     it at its step and keeps it out of the register and out of Not filed, and
//     Copy the brief hands over the whole paste, filer command included.
//
// Run from repo root: `npm test` (or `node tests/library.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { makePdf } = require("./pdf_fixture.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      pending.push(r.catch(function (e) { check(label + " — driver threw: " + (e && e.message), false); }));
    }
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("library.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");
const SQL = fs.readFileSync("kb/supabase_cpl_library.sql", "utf8");

const ROWS = [
  { id: "a1", slug: "noncredit-summit-cpl-slides", title: "Noncredit Summit CPL slides", kind: "deck",
    occasion: "Vision 2030 Noncredit Summit", made_on: "2026-10-05", version: "1", summary: "Five CPL slides",
    extent: "5 slides", file_type: "pptx", status: "draft", seen_by: null, home: "not_filed", url: null,
    refresh_note: "students served, the week of the summit", versions: [] },
  { id: "a2", slug: "noncredit-summit-in-motion", title: "Noncredit Summit in Motion", kind: "film",
    occasion: "Vision 2030 Noncredit Summit", made_on: "2026-10-05", version: "v1", summary: "Two cuts",
    extent: "1:41 and 3:08", file_type: "mp4", status: "draft", seen_by: null, home: "public_repo",
    url: "https://github.com/CPL-Initiative/cpl-project-tracker/blob/f5d45ad/prototype/noncredit_video/a.mp4",
    poster: "library/posters/noncredit-summit-in-motion.jpg", refresh_note: null,
    versions: [{ label: "Music cut, v1", date: "2026-10-05", size: "1:41", status: "Draft", url: "https://github.com/x/y.mp4" }] },
  { id: "a3", slug: "cpl-funding-in-motion", title: "CPL Funding in Motion", kind: "film",
    occasion: "2026–2028 Implementation Funding explainer", made_on: "2026-09-30", version: "4 cuts",
    status: "approved", seen_by: "colleges", home: "public_repo", url: "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/f.mp4",
    versions: [] },
  { id: "a4", slug: "keynote-2025", title: "Sonya Christian, Noncredit Summit keynote", kind: "document",
    occasion: "Vision 2030 Noncredit Summit", made_on: "2025-10-09", status: "presented", seen_by: null,
    home: "drive", url: "https://drive.google.com/file/d/abc/view", file_type: "pdf", versions: [] },
  { id: "a5", slug: "bog-update", title: "Update to the Board of Governors", kind: "deck",
    occasion: "Board of Governors, July 2026", made_on: "2026-07-16", status: null, seen_by: null,
    home: "public_repo", url: "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/presentations/b.pptx",
    extent: "12 slides", file_type: "pptx", versions: [] }
];

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}

function loadModule(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root">Loading</div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    calls.push({ url: String(url), init: init || {} });
    return opts.fetch ? opts.fetch(String(url), init || {}) : response(200, ROWS);
  };
  if (opts.noStorage) {
    Object.defineProperty(w, "localStorage", { get: function () { throw new Error("SecurityError"); } });
  } else if (opts.phrase) {
    w.localStorage.setItem("cpl_team_pass", opts.phrase);
    if (opts.author) w.localStorage.setItem("cpl_library_author", opts.author);
  }
  if (opts.banner) {
    w.CPL_TEAM_PHRASE = { lockedBanner: function (o) {
      const d = w.document.createElement("div"); d.setAttribute("data-tp-locked", ""); d.textContent = "Locked: " + o.what; return d; } };
  }
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return { w, calls, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}
function settle() { return new Promise(function (r) { setTimeout(r, 0); }).then(function () { return new Promise(function (r) { setTimeout(r, 0); }); }); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
// The one panel (Create or Remediate a Document) opens the filing form for a pasted link
// and the brief for instructions with nothing dropped.
function openAdd(m, url) {
  const d = m.w.document; d.getElementById("lc-link").value = url || "https://example.org/a-piece";
  click(m.w, d.getElementById("lib-go"));
}
function openStart(m, instr) {
  const d = m.w.document; d.getElementById("lc-instr").value = instr || "A visual";
  click(m.w, d.getElementById("lib-go"));
}

// ── (1) Wiring, Rule 4, the schema's posture ─────────────────────────────
block("(1)", function () {
  check("(1) both HTMLs are byte-identical", DASH === INDEX, "Rule 4");
  ['data-tab="library"', 'id="library-root"', "onActivate('library'", "loadScript('library.js', 'CPL_LIBRARY'"].forEach(function (f) {
    check("(1) the shell carries " + f, DASH.indexOf(f) >= 0);
  });
  check("(1) the Library sits in the team tools group, and the Knowledge Base tab is gone (folded into it, S459)", /'team-phrases', 'library'/.test(NAV) && !/'knowledge-base'/.test(NAV));
  check("(1) RLS gates read, insert and update on the team phrase or a reviewer",
    (SQL.match(/team_pass_ok\(\) or public\.is_allowed_reviewer\(\)/g) || []).length >= 5);
  check("(1) no delete policy, and delete is revoked", !/for delete/i.test(SQL) && /revoke delete on public\.cpl_library from anon, authenticated/.test(SQL));
  check("(1) every edit files the prior row in history", /after update on public\.cpl_library/.test(SQL) && /to_jsonb\(old\)/.test(SQL));
  check("(1) a filed row has a link and an unfiled one has none", /\(home = 'not_filed'\) = \(url is null\)/.test(SQL));
});

// ── (2) Locked: no phrase, no fetch, no count ────────────────────────────
block("(2)", function () {
  const m = loadModule({ banner: true });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(2) without the phrase the tab fetches nothing", m.calls.length === 0, JSON.stringify(m.calls));
    check("(2) it shows the team-phrase banner", !!m.root.querySelector("[data-tp-locked]") && /Locked: The Library/.test(m.root.textContent));
    check("(2) and paints no count", !/pieces|not filed/.test(m.root.textContent), m.root.textContent);
  });
});

// ── (3) Read and render ──────────────────────────────────────────────────
block("(3)", function () {
  const m = loadModule({ phrase: "open-sesame", author: "Sam" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const c = m.calls[0] || { init: {} };
    check("(3) reads cpl_library, live rows only", /\/rest\/v1\/cpl_library\?/.test(c.url) && /retired_at=is\.null/.test(c.url), c.url);
    check("(3) the read carries the team phrase", c.init.headers && c.init.headers["x-team-pass"] === "open-sesame");
    const t = m.root.textContent;
    check("(3) the count line names pieces and occasions", /5 pieces across 3 occasions/.test(t), t.slice(0, 600));
    check("(3) Needs attention counts not filed", /1\s*not filed/.test(t));
    check("(3) a public file with no audience is counted, a public one cleared for colleges is not",
      /2\s*public files with no audience set/.test(t), t.slice(0, 800));
    check("(3) changes to make are counted (the box held figures to refresh until S480)", /1\s*with changes to make/.test(t));
    const card = function (id) { return m.root.querySelector('#lib-t-' + id).closest("article"); };
    check("(3) a not-filed piece offers File it and no Open",
      !!card("a1").querySelector("[data-file]") && !card("a1").querySelector("a.lib-btn"));
    const open = card("a4").querySelector("a.lib-btn");
    check("(3) a filed piece opens its own link in a new tab", open && open.getAttribute("href") === ROWS[3].url && open.getAttribute("target") === "_blank");
    check("(3) a film shows its title frame", !!card("a2").querySelector('img[src="library/posters/noncredit-summit-in-motion.jpg"]'));
    check("(3) an unset status and audience say Not set in words", /Status: Not set/.test(card("a5").textContent) && /Seen by: Not set/.test(card("a5").textContent));
    const groups = Array.prototype.map.call(m.root.querySelectorAll(".lib-group h2"), function (h) { return h.textContent; });
    check("(3) occasions are grouped, newest first", groups[0] === "Vision 2030 Noncredit Summit" && groups[groups.length - 1] === "Board of Governors, July 2026", JSON.stringify(groups));
    click(m.w, card("a2").querySelector("[data-toggle]"));
    const d = m.w.document.getElementById("lib-d-a2");
    check("(3) Details opens the record with its versions table", d && !d.hidden && !!d.querySelector('table th[scope="col"]') && /Music cut, v1/.test(d.textContent));
    check("(3) the versions table scrolls inside a labeled region", !!d.querySelector('.lib-vwrap[role="region"][aria-label]'));
    check("(3) who can open it now is read from where it lives", /tracker repo is public/.test(d.textContent));
  });
});

// ── (4) A failed read names its table and paints no count ────────────────
block("(4)", function () {
  const m = loadModule({ phrase: "p", fetch: function () { return response(500, "boom"); } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const t = m.root.textContent;
    check("(4) the failure names cpl_library", /cpl_library/.test(t), t);
    check("(4) no count is painted", !/pieces|not filed|across/.test(t), t);
  });
});

// ── (5) Filters and search ───────────────────────────────────────────────
block("(5)", function () {
  const m = loadModule({ phrase: "p" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-kind="film"]'));
    check("(5) Films shows only films", m.root.querySelectorAll(".lib-item").length === 2 && /Showing 2 of 5/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-kind="all"]'));
    click(m.w, m.root.querySelector('[data-flag="not_filed"]'));
    check("(5) a Needs attention count filters to its pieces", m.root.querySelectorAll(".lib-item").length === 1);
    click(m.w, m.root.querySelector('[data-flag="not_filed"]'));
    const q = m.w.document.getElementById("lib-q");
    q.value = "summit "; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    const q2 = m.w.document.getElementById("lib-q");
    check("(5) typing a space keeps it and keeps the same box (the caret survives)", q2 === q && q2.value === "summit ");
    q.value = "summit motion"; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    check("(5) two words both have to match", m.root.querySelectorAll(".lib-item").length === 1 && /Showing 1 of 5/.test(m.root.textContent));
  });
});

// ── (6) Add, File it, Edit, Retire ───────────────────────────────────────
block("(6)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(201, [{}]); }
    return response(200, ROWS);
  } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    openAdd(m);
    const doc = m.w.document;
    doc.getElementById("la-url").value = "https://drive.google.com/file/d/xyz/view";
    doc.getElementById("la-title").value = "Summit deck, version 2";
    doc.getElementById("la-kind").value = "deck";
    doc.getElementById("lib-addform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    check("(6) Add refuses without a name, and writes nothing", writes.length === 0 && /Add your name/.test(m.root.textContent));
    check("(6) the typed link survives that repaint", doc.getElementById("la-url").value === "https://drive.google.com/file/d/xyz/view");
    doc.getElementById("la-by").value = "Ashley";
    doc.getElementById("lib-addform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle().then(function () {
      const w0 = writes[0] || { body: {}, init: { headers: {} } };
      check("(6) Add POSTs to cpl_library", w0.init.method === "POST" && /\/rest\/v1\/cpl_library$/.test(w0.url));
      check("(6) the write carries the team phrase", w0.init.headers["x-team-pass"] === "p");
      check("(6) a Drive link files as drive, with who added it", w0.body.home === "drive" && w0.body.added_by === "Ashley");
      check("(6) the slug fits the table's rule", /^[a-z0-9][a-z0-9-]{1,80}$/.test(w0.body.slug || ""), w0.body.slug);
      click(m.w, m.root.querySelector('[data-file="a1"]'));
      doc.getElementById("la-url").value = "https://drive.google.com/file/d/deck/view";
      doc.getElementById("lib-addform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
      return settle();
    }).then(function () {
      const w1 = writes[1] || { body: {}, init: {} };
      check("(6) File it PATCHes that one record with its link", w1.init.method === "PATCH" && /cpl_library\?id=eq\.a1$/.test(w1.url) &&
        w1.body.url === "https://drive.google.com/file/d/deck/view" && w1.body.home === "drive" && w1.body.updated_by === "Ashley");
      click(m.w, m.root.querySelector('[data-toggle="a5"]'));
      click(m.w, m.root.querySelector('[data-edittop="a5"]'));
      doc.getElementById("le-seen").value = "public";
      doc.getElementById("le-status").value = "presented";
      click(m.w, m.root.querySelector('[data-retire="a5"]'));
      check("(6) Retire asks first and writes nothing yet", writes.length === 2 && /Retire this record\?/.test(m.root.textContent));
      check("(6) the edit form keeps what was typed through that question", doc.getElementById("le-seen").value === "public");
      click(m.w, m.root.querySelector("[data-retireno]"));
      m.root.querySelector('[data-editform="a5"]').dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
      return settle();
    }).then(function () {
      const w2 = writes[2] || { body: {}, init: {} };
      check("(6) Save PATCHes status and audience with who changed it",
        w2.init.method === "PATCH" && w2.body.seen_by === "public" && w2.body.status === "presented" && w2.body.updated_by === "Ashley", JSON.stringify(w2.body));
      click(m.w, m.root.querySelector('[data-edittop="a5"]'));
      click(m.w, m.root.querySelector('[data-retire="a5"]'));
      click(m.w, m.root.querySelector('[data-retireyes="a5"]'));
      return settle();
    }).then(function () {
      const w3 = writes[3] || { body: {}, init: {} };
      check("(6) Retire sets retired_at; nothing is deleted", w3.init.method === "PATCH" && !!w3.body.retired_at);
      check("(6) no write ever uses DELETE", writes.every(function (x) { return x.init.method !== "DELETE"; }));
    });
  });
});

// ── (7) Links, not bytes; tokens; words ──────────────────────────────────
block("(7)", function () {
  const M = loadModule({}).M;
  check("(7) a Drive link reads as drive", M._homeForUrl("https://drive.google.com/file/d/x/view") === "drive");
  // Sam, 2026-10-08 (Open Asks Sheet 49): the team's files live on its SharePoint site,
  // stored under the same `drive` home value (cpl_library_home_ck has no other).
  check("(7) a SharePoint link files under the team home", M._homeForUrl("https://studentrcc.sharepoint.com/:p:/r/sites/MilitaryArticulationPlatform/Shared%20Documents/CCCCO/AI/CPLLibrary/deck.pptx") === "drive");
  check("(7) a team-home record names where its link goes",
    M._homeOf({ home: "drive", url: "https://studentrcc.sharepoint.com/:b:/r/sites/x/a.pdf" }).label === "Team SharePoint" &&
    M._homeOf({ home: "drive", url: "https://drive.google.com/file/d/x/view" }).label === "Google Drive");
  check("(7) the tab links the SharePoint CPLLibrary folder and no Drive folder",
    /studentrcc\.sharepoint\.com\/:f:\/r\/sites\/MilitaryArticulationPlatform\/Shared%20Documents\/CCCCO\/AI\/CPLLibrary"/.test(SRC) &&
    !/drive\.google\.com\/drive\/folders/.test(SRC));
  check("(7) a tracker link reads as the public repo", M._homeForUrl("https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/a.pptx") === "public_repo");
  check("(7) a vault link reads as the vault", M._homeForUrl("https://github.com/samueltlee/CPLBrain/blob/main/a.pptx") === "vault");
  check("(7) the tab never touches Storage", !/storage\/v1/.test(SRC));
  check("(7) the tab never deletes", !/method\s*:\s*["']DELETE/i.test(SRC) && !/"DELETE"/.test(SRC));
  const css = (SRC.match(/function ensureCss\(\)[\s\S]*?\n  }\n/) || [""])[0];
  check("(7) the injected CSS uses tokens, never a raw hex", css.length > 2000 && !/#[0-9a-fA-F]{3,8}\b(?![-\w])/.test(css.replace(/"#" \+ ROOT_ID/g, "")));
  check("(7) plain words, no emoji or marks", !/[\u{1F300}-\u{1FAFF}✅✔✓❌⚠🔒]/u.test(SRC));
  check("(7) American spelling in rendered text", !/\b(colour|behaviour|organisation|catalogue|centre|licence)\b/i.test(SRC));
});

// ── (8) A private window still renders ───────────────────────────────────
block("(8)", function () {
  const m = loadModule({ noStorage: true });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(8) with storage blocked the tab renders its locked state", /team phrase/.test(m.root.textContent) && m.calls.length === 0, m.root.textContent);
  });
});

// ── (9) Start a piece: a brief saves a Requested record, In development tracks it ──
// Sam, 2026-10-05, on mockup version 2: "Mockup looks great. Let's go with it."
const DEV_ROWS = ROWS.concat([
  { id: "b1", slug: "summit-table-sheet-x1", title: "Noncredit CPL by college, for the summit table", kind: "spreadsheet",
    occasion: "Vision 2030 Noncredit Summit", status: "requested", seen_by: "colleges", home: "not_filed", url: null,
    added_by: "Sam", created_at: "2026-10-06T01:00:00Z", versions: [],
    brief: { say: "Each college's noncredit CPL awards", due: "The week of the summit", requested_by: "Sam", requested_on: "2026-10-06" } },
  { id: "b2", slug: "funding-deck-x2", title: "What colleges can expect from the funding", kind: "deck",
    status: "draft", seen_by: "team", home: "drive", url: "https://drive.google.com/file/d/draft/view",
    added_by: "Ashley", created_at: "2026-10-05T01:00:00Z",
    versions: [{ label: "v1", date: "2026-10-05", filed_at: "2026-10-05T18:42:10Z", size: "200 KB", status: "Draft", url: "https://drive.google.com/file/d/draft/view" }],
    brief: { say: "Three points", requested_by: "Ashley", requested_on: "2026-10-05" } }
]);
block("(9)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(201, [{ id: "new1" }]); }
    return response(200, DEV_ROWS);
  } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const t = m.root.textContent;
    const dev = m.root.querySelector(".lib-dev");
    check("(9) In development lists the briefs that are not yet approved", dev && dev.querySelectorAll(".lib-devitem").length === 2, dev && dev.textContent);
    check("(9) the register leaves them out", /5 pieces across 3 occasions/.test(t) && !m.root.querySelector("#lib-register #lib-t-b1"), t.slice(0, 600));
    check("(9) a Requested piece is not counted as Not filed", /1\s*not filed/.test(t));
    const steps = function (id) { return m.root.querySelector("#lib-t-" + id).closest("article").querySelectorAll("ol.lib-steps li"); };
    const s1 = steps("b1"), s2 = steps("b2");
    check("(9) the four steps read Requested, Draft, Approved, Presented", Array.prototype.map.call(s1, function (l) { return l.textContent; }).join(",") === "Requested,Draft,Approved,Presented");
    check("(9) a Requested piece stands at step 1", s1[0].getAttribute("aria-current") === "step" && s1[0].className === "now");
    check("(9) a draft stands at step 2 with step 1 done", s2[0].className === "done" && s2[1].getAttribute("aria-current") === "step");
    const b2 = m.root.querySelector("#lib-t-b2").closest("article");
    check("(9) a filed draft opens from its card", !!b2.querySelector('a[href="https://drive.google.com/file/d/draft/view"]'));
    check("(9) the kind filter offers Spreadsheets", !!m.root.querySelector('[data-kind="spreadsheet"]'));
    click(m.w, m.root.querySelector('[data-brief="b1"]'));
    const ta = m.w.document.getElementById("lib-b-b1");
    const bt = ta ? ta.value : "";
    check("(9) Copy the brief shows the whole paste", !!ta && ta.hasAttribute("readonly"));
    check("(9) the brief names its record and what it must say", /record summit-table-sheet-x1/.test(bt) && /Kind: Spreadsheet/.test(bt) && /It must say: Each college's noncredit CPL awards/.test(bt) && /For: Colleges/.test(bt), bt);
    check("(9) the brief hands the file over for the SharePoint folder and files it on this record",
      /Send me the file/.test(bt) && /SharePoint folder \(CPLLibrary\)/.test(bt) && /File it on record summit-table-sheet-x1/.test(bt) &&
      !/library_file\.py/.test(bt), bt);
    check("(9) the brief ends with what a good result looks like", /A good result: [^\n]+$/.test(bt), bt);
    check("(9) an unset source asks for live data first", /fetch live data first/.test(bt));
    m.M._state.rows.filter(function (r) { return r.id === "a2"; })[0].versions = [{ label: "v2", date: "2026-10-05", filed_at: "2026-10-05T18:42:10Z", size: "16 MB", status: "Draft" }];
    m.M.render();
    click(m.w, m.root.querySelector('[data-toggle="a2"]'));
    const vt = (m.w.document.getElementById("lib-d-a2") || {}).textContent || "";
    check("(9) a filed version shows the time it was filed (Sam's call 8)", /5 October 2026, 18:42 UTC/.test(vt), vt.slice(0, 400));
    openStart(m, "A table of awards");
    const doc = m.w.document;
    check("(9) the panel's Start opens the brief, the instructions in What it must say", !!doc.getElementById("lib-startform") && doc.getElementById("ls-say").value === "A table of awards");
    doc.getElementById("ls-say").value = "";
    doc.getElementById("ls-kind").value = "spreadsheet";
    doc.getElementById("ls-title").value = "Summit table";
    doc.getElementById("lib-startform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    check("(9) a brief without what it must say writes nothing", writes.length === 0 && /Say what the piece must say/.test(m.root.textContent));
    check("(9) the typed title survives that repaint", doc.getElementById("ls-title").value === "Summit table");
    doc.getElementById("ls-say").value = "Awards by college";
    doc.getElementById("ls-due").value = "Friday";
    check("(9) Start a piece takes documents to work from", !!doc.querySelector("#lib-startform .lib-srcset") && !!doc.getElementById("ls-stext"));
    doc.getElementById("ls-stitle").value = "EDD notice";
    doc.getElementById("ls-stext").value = "Eight projects funded.";
    doc.getElementById("lib-startform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const w0 = writes[0] || { body: {}, init: { headers: {} } };
    const b = w0.body.brief || {};
    check("(9) Save the brief POSTs one Requested record", w0.init.method === "POST" && /\/rest\/v1\/cpl_library$/.test(w0.url) && w0.body.status === "requested", JSON.stringify(w0.body));
    check("(9) it has no file yet", w0.body.home === "not_filed" && w0.body.url === null);
    check("(9) the brief keeps what it must say, the date needed, and who asked", b.say === "Awards by college" && b.due === "Friday" && b.requested_by === "Sam" && /^\d{4}-\d{2}-\d{2}$/.test(b.requested_on || ""), JSON.stringify(b));
    check("(9) a spreadsheet is a kind", w0.body.kind === "spreadsheet");
    check("(9) ⭐ a document typed but not yet added saves with the brief (a new visual from an uploaded document)",
      Array.isArray(w0.body.sources) && w0.body.sources.length === 1 && w0.body.sources[0].title === "EDD notice" &&
      w0.body.sources[0].text === "Eight projects funded." && w0.body.sources[0].url === null, JSON.stringify(w0.body.sources));
    check("(9) For defaults to the team", w0.body.seen_by === "team");
    check("(9) the write carries the team phrase", w0.init.headers["x-team-pass"] === "p");
    check("(9) the saved brief opens for copying", m.M._state.briefShown.new1 === true && /Saved as Requested/.test(m.root.textContent));
  });
});

// ── (9b) File it on a brief moves it to Draft; a dateless record takes the day (Sam, 2026-10-27) ──
// Sam filed the Workplan Update through Edit record, the only control the In development card
// offered, set it to Approved, and it dropped to the bottom of the register with no date.
block("(9b)", function () {
  const writes = [];
  const rows = ROWS.concat([
    { id: "r1", slug: "workplan-update-x", title: "CPL Initiative Workplan Update", kind: "document", status: "requested",
      seen_by: "team", home: "not_filed", url: null, made_on: null, created_at: "2026-10-26T23:14:06Z",
      brief: { say: "Update the attached document.", due: "Today", requested_by: "Sam", requested_on: "2026-10-26" }, versions: [] },
    { id: "r2", slug: "approved-no-date", title: "Approved, no date", kind: "document", status: "requested",
      seen_by: "team", home: "not_filed", url: null, made_on: null, brief: { say: "x" }, versions: [] }
  ]);
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(201, [{}]); }
    return response(200, rows);
  } });
  const day = /^\d{4}-\d{2}-\d{2}$/;
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const doc = m.w.document;
    const card = doc.getElementById("lib-t-r1").closest("article");
    const btn = card.querySelector('[data-file="r1"]');
    check("(9b) a Requested card in In development offers File it", !!btn && card.closest(".lib-dev") !== null);
    click(m.w, btn);
    check("(9b) the File it form names the piece it files", /File CPL Initiative Workplan Update/.test(doc.getElementById("lib-addform").textContent));
    doc.getElementById("la-url").value = "https://studentrcc.sharepoint.com/sites/x/Drafts/20261026_Workplan.docx";
    submit(m, "#lib-addform");
    return settle();
  }).then(function () {
    const w0 = writes[0] || { body: {}, init: {} };
    check("(9b) ⭐ File it on a Requested piece moves it to Draft, as the brief's paste says",
      w0.init.method === "PATCH" && /id=eq\.r1$/.test(w0.url) && w0.body.status === "draft" && w0.body.home === "drive", JSON.stringify(w0.body));
    check("(9b) a record filed without a date takes the day it is filed", day.test(w0.body.made_on || ""), w0.body.made_on);
    check("(9b) and says where it went", /now a Draft, under In development/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-edittop="r2"]'));
    m.w.document.getElementById("le-status").value = "approved";
    submit(m, 'form[data-editform="r2"]');
    return settle();
  }).then(function () {
    const e = writes.filter(function (x) { return /id=eq\.r2$/.test(x.url); })[0] || { body: {} };
    check("(9b) Edit moving a dateless brief past Requested gives it today's date", e.body.status === "approved" && day.test(e.body.made_on || ""), JSON.stringify(e.body));
    click(m.w, m.root.querySelector('[data-edittop="r2"]'));
    m.w.document.getElementById("le-status").value = "requested";
    submit(m, 'form[data-editform="r2"]');
    return settle();
  }).then(function () {
    const e = writes.filter(function (x) { return /id=eq\.r2$/.test(x.url); })[1] || { body: {} };
    check("(9b) a brief kept at Requested stays undated (it is not made yet)", e.body.status === "requested" && !("made_on" in e.body), JSON.stringify(e.body));
    m.M._state.form = null; m.M._state.formFor = null; m.M.render();
    click(m.w, m.root.querySelector('[data-file="a1"]'));
    m.w.document.getElementById("la-url").value = "https://drive.google.com/file/d/deck/view";
    submit(m, "#lib-addform");
    return settle();
  }).then(function () {
    const e = writes.filter(function (x) { return /id=eq\.a1$/.test(x.url); })[0] || { body: {} };
    check("(9b) File it on a dated Draft changes only the link", !("status" in e.body) && !("made_on" in e.body) && e.body.url === "https://drive.google.com/file/d/deck/view", JSON.stringify(e.body));
  });
});

// ── (10) The schema takes the new kind, the new status and the brief ─────
block("(10)", function () {
  check("(10) kind accepts spreadsheet and visual", /add constraint cpl_library_kind_ck\s+check \(kind in \('deck', 'film', 'document', 'spreadsheet', 'visual'\)\)/.test(SQL));
  check("(10) status accepts requested", /add constraint cpl_library_status_ck\s+check \(status is null or status in \('requested', 'draft', 'approved', 'presented'\)\)/.test(SQL));
  check("(10) the brief is one bounded jsonb object", /add column if not exists brief jsonb/.test(SQL) && /jsonb_typeof\(brief\) = 'object'/.test(SQL));
  const M = loadModule({}).M;
  check("(10) a Requested record is in development, an approved one is not",
    M._isDev({ status: "requested" }) && M._isDev({ status: "draft", brief: {} }) && !M._isDev({ status: "approved", brief: {} }) && !M._isDev({ status: "draft" }));
});

// ── (11) Made for an entity (Sam, Open Asks Sheet 120, 2026-10-23) ───────
// Sam: "sort on the libraries for the type (college, agency, vendor, CO) and add the
// name of the entity we are making this for and have it filterable by whatever
// entities we've created something for"; his rulings: five types with a typed Other,
// a college's record pair in one step from the tab, and Kind gains visual.
const FOR_ROWS = [
  Object.assign({}, ROWS[2], { id: "f1", slug: "cpl-opportunity-bakersfield-visual", title: "Bakersfield College: CPL Opportunity Analysis", kind: "visual",
    occasion: "CPL college workgroup meeting", made_on: "2026-10-21", status: "draft", seen_by: "public", home: "web",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College", for_kind: "college", for_name: "Bakersfield College", versions: [] }),
  Object.assign({}, ROWS[3], { id: "f2", slug: "dsp-credit-starting-points", title: "DSP Credit Starting Points", kind: "visual", for_kind: "agency", for_name: "DDS, Aging and LWDA" }),
  Object.assign({}, ROWS[4], { id: "f3", slug: "ironworker-union-brief", title: "Ironworker union brief", kind: "document", for_kind: "other", for_category: "Union", for_name: "Ironworkers Local 433" }),
  ROWS[4]
];
const MAP_NAMES = [
  { college_name: "Bakersfield College", entity_kind: "college", district: "Kern Community College District" },
  { college_name: "Norco College", entity_kind: "college", district: "Riverside Community College District" },
  { college_name: "Riverside City College", entity_kind: "college", district: "Riverside Community College District" }
];
function loadFor(author) {
  const writes = [];
  const m = loadModule({ phrase: "p", author: author, fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(201, [{ id: "new" }]); }
    if (/map_colleges/.test(url)) return response(200, MAP_NAMES);
    return response(200, FOR_ROWS);
  } });
  m.writes = writes;
  return m;
}
function submit(m, sel) { m.root.querySelector(sel).dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true })); }
function change(m, id, value) { const n = m.w.document.getElementById(id); n.value = value; n.dispatchEvent(new m.w.Event("change", { bubbles: true })); }
block("(11)", function () {
  const m = loadFor("Ashley"), doc = m.w.document;
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(11) the Kind filter offers Visuals", !!m.root.querySelector('[data-kind="visual"]'));
    check("(11) a record says who it is made for, type and name", /Made for College · For Bakersfield College/.test(doc.getElementById("lib-t-f1").closest("article").textContent));
    check("(11) an Other record shows its typed category", /Made for Union · For Ironworkers Local 433/.test(doc.getElementById("lib-t-f3").closest("article").textContent));
    check("(11) a record made for no one entity says nothing of it", !/Made for/.test(doc.getElementById("lib-t-a5").closest("article").textContent));
    const forBtns = Array.prototype.map.call(m.root.querySelectorAll("[data-madefor]"), function (b) { return b.getAttribute("data-madefor"); });
    check("(11) Made for offers the five types, and Other because an Other piece exists", forBtns.join(",") === "all,college,district,agency,vendor,co,other", forBtns.join(","));
    click(m.w, m.root.querySelector('[data-madefor="agency"]'));
    check("(11) Agencies shows the agency piece alone", m.root.querySelectorAll(".lib-item").length === 1 && /Showing 1 of 4/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-madefor="all"]'));
    const names = Array.prototype.map.call(doc.getElementById("lib-for").options, function (o) { return o.value; });
    check("(11) For lists the names present, sorted, after Anyone", names.join("|") === "all|Bakersfield College|DDS, Aging and LWDA|Ironworkers Local 433", names.join("|"));
    change(m, "lib-for", "Bakersfield College");
    check("(11) picking a name shows that entity's pieces", m.root.querySelectorAll(".lib-item").length === 1);
    change(m, "lib-for", "all");
    const q = doc.getElementById("lib-q"); q.value = "ironworkers local"; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    check("(11) search finds a piece by the entity's name", m.root.querySelectorAll(".lib-item").length === 1);
    q.value = ""; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    openStart(m, "A visual for the college's CSM meeting");
    change(m, "ls-forkind", "college");
    return settle();
  }).then(function () {
    check("(11) a brief made for a college reads MAP's college list, with the phrase, once it opens",
      m.calls.some(function (c) { return /map_colleges\?select=college_name/.test(c.url) && c.init.headers["x-team-pass"] === "p"; }));
    check("(11) and offers the names as a datalist on the For field",
      !!doc.querySelector('#lib-names-colleges option[value="Riverside City College"]') && doc.getElementById("ls-forname").getAttribute("list") === "lib-names-colleges" && doc.getElementById("ls-kind").value === "visual");
    doc.getElementById("ls-forname").value = "riverside city college";
    doc.getElementById("ls-occasion").value = "CSM meeting, 2026-10-28";
    submit(m, "#lib-startform");
    return settle();
  }).then(settle).then(function () {
    const w = m.writes;
    check("(11) Make writes the pair: two POSTs to cpl_library", w.length === 2 && w.every(function (x) { return x.init.method === "POST" && /cpl_library$/.test(x.url); }), String(w.length));
    const v = w[0] ? w[0].body : {}, wb = w[1] ? w[1].body : {};
    check("(11) the page record: kind visual, the college as MAP spells it, the live page's link, under the library (Sheet 131 card 2)",
      v.kind === "visual" && v.for_kind === "college" && v.for_name === "Riverside City College" && v.home === "web" &&
      v.url === "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Riverside%20City%20College", JSON.stringify(v));
    check("(11) its slug follows the first twelve", v.slug === "cpl-opportunity-riverside-city-visual" && wb.slug === "cpl-opportunity-riverside-city-workbook", v.slug + " " + wb.slug);
    check("(11) the workbook record: a spreadsheet, not filed yet, made for the same college",
      wb.kind === "spreadsheet" && wb.home === "not_filed" && wb.url === null && wb.for_name === "Riverside City College" && /Download CPL Extract/.test(wb.rebuild_from), JSON.stringify(wb));
    check("(11) both say who made them and carry the occasion", v.added_by === "Ashley" && wb.added_by === "Ashley" && v.occasion === "CSM meeting, 2026-10-28" && /Ashley/.test(v.made_by));
    check("(11) and the tab says so in words", /Riverside City College's CPL Opportunity page and its workbook are in the Library/.test(m.root.textContent), m.root.textContent.slice(0, 400));
  });
});
block("(11b)", function () {
  const m = loadFor("Ashley"), doc = m.w.document;
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    openStart(m, "A visual");
    change(m, "ls-forkind", "college");
    return settle();
  }).then(function () {
    doc.getElementById("ls-forname").value = "Bakersfield College";
    submit(m, "#lib-startform");
    return settle();
  }).then(function () {
    check("(11b) a college whose pair exists is refused, and nothing is written", m.writes.length === 0 && /Bakersfield College's pair is already in the Library/.test(m.root.textContent));
    doc.getElementById("ls-forname").value = "Nowhere College";
    submit(m, "#lib-startform");
    return settle();
  }).then(function () {
    check("(11b) a name MAP does not list is refused", m.writes.length === 0 && /Pick the college from MAP's list/.test(m.root.textContent));
    change(m, "ls-forkind", "agency");
    doc.getElementById("ls-forname").value = "EDD ELL IET Fund grantees";
    doc.getElementById("ls-occasion").value = "Grantees meeting";
    doc.getElementById("ls-title").value = "ELL IET grantees";
    return settle();
  }).then(function () {
    check("(11b) for an agency the brief stays a brief, kind Visual and the entity set",
      !!doc.getElementById("lib-startform") && doc.getElementById("ls-kind").value === "visual" && doc.getElementById("ls-forkind").value === "agency" &&
      doc.getElementById("ls-forname").value === "EDD ELL IET Fund grantees" && doc.getElementById("ls-occasion").value === "Grantees meeting");
    doc.getElementById("ls-say").value = "What the grantees' training could earn as credit";
    submit(m, "#lib-startform");
    return settle();
  }).then(function () {
    const b = m.writes[0] ? m.writes[0].body : {};
    check("(11b) the brief saves Requested, kind visual, with the entity", b.status === "requested" && b.kind === "visual" && b.for_kind === "agency" && b.for_name === "EDD ELL IET Fund grantees" && b.for_category === null, JSON.stringify(b));
    const text = m.M._briefText({ slug: "ell-iet-grantees", title: "ELL IET grantees", kind: "visual", for_kind: "agency", for_name: "EDD ELL IET Fund grantees", brief: { say: "x" } });
    check("(11b) the paste names who it is made for and the agency template", /Made for: Made for Agency · For EDD ELL IET Fund grantees/.test(text) && /agency template/.test(text) && /20261020_DSP_Credit_Starting_Points\.html/.test(text), text);
    check("(11b) a college's paste names no agency template", !/agency template/.test(m.M._briefText({ slug: "s", title: "t", kind: "visual", for_kind: "college", for_name: "Norco College", brief: {} })));
  });
});
block("(11c)", function () {
  const m = loadFor("Sam"), doc = m.w.document;
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-edittop="a5"]'));
    check("(11c) Edit offers Made for, unset for an older record, and no name field yet", doc.getElementById("le-forkind").value === "" && !doc.getElementById("le-forname"));
    change(m, "le-forkind", "other");
    check("(11c) choosing Other asks for the category and the name", !!doc.getElementById("le-forcat") && !!doc.getElementById("le-forname"));
    doc.getElementById("le-forname").value = "Ironworkers Local 433";
    submit(m, '[data-editform="a5"]');
    check("(11c) Other without a category is refused in words, and nothing is written", m.writes.length === 0 && /Type the category for Other/.test(m.root.textContent));
    check("(11c) the typed name survives that repaint", doc.getElementById("le-forname").value === "Ironworkers Local 433");
    doc.getElementById("le-forcat").value = "Union";
    submit(m, '[data-editform="a5"]');
    return settle();
  }).then(function () {
    const b = m.writes[0] ? m.writes[0].body : {};
    check("(11c) Save PATCHes the type, the category and the name", m.writes[0] && m.writes[0].init.method === "PATCH" && b.for_kind === "other" && b.for_category === "Union" && b.for_name === "Ironworkers Local 433", JSON.stringify(b));
    openAdd(m);
    check("(11c) Add offers Visual first among the kinds", doc.getElementById("la-kind").options[0].value === "visual");
    doc.getElementById("la-url").value = "https://claude.ai/artifact/abc";
    doc.getElementById("la-title").value = "Ventura visual";
    change(m, "la-forkind", "college");
    return settle();
  }).then(function () {
    check("(11c) a college picked in Add offers MAP's names", doc.getElementById("la-forname").getAttribute("list") === "lib-names-colleges");
    doc.getElementById("la-forname").value = "bakersfield college";
    submit(m, "#lib-addform");
    return settle();
  }).then(function () {
    const b = m.writes[1] ? m.writes[1].body : {};
    check("(11c) Add writes kind visual with the college as MAP spells it", b.kind === "visual" && b.for_kind === "college" && b.for_name === "Bakersfield College" && b.for_category === null, JSON.stringify(b));
  });
});
block("(11d)", function () {
  check("(11d) the schema holds the three made-for columns under one check", /add column if not exists for_kind/.test(SQL) && /add column if not exists for_category/.test(SQL) && /add column if not exists for_name/.test(SQL) && /cpl_library_for_ck/.test(SQL));
  check("(11d) Other needs its category, a name needs a type, and the five types are named",
    /\(for_kind is not distinct from 'other'\) = \(for_category is not null\)/.test(SQL) && /for_name is null or for_kind is not null/.test(SQL) &&
    /for_kind in \('college', 'district', 'agency', 'vendor', 'co', 'other'\)/.test(SQL));
  const M = loadModule({}).M;
  check("(11d) the pair's slug follows the first twelve", M._collegeSlug("Mt San Antonio College") === "mt-san-antonio" && M._collegeSlug("San Bernardino Valley College") === "san-bernardino-valley" && M._collegeSlug("College of Alameda") === "college-of-alameda");
  check("(11d) who a piece is made for reads in words", M._forLine({ for_kind: "co" }) === "Made for Chancellor's Office" && M._forLine({ for_kind: "other", for_category: "Union", for_name: "Local 433" }) === "Made for Union · For Local 433" && M._forLine({}) === "");
});

// ── (13) Changes to make (Sam, 2026-10-25) ───────────────────────────────
// "I'd like to request some edits from the Library edit form but there's no place
// for me to enter my comments and then Refresh based on the input."
block("(13)", function () {
  const writes = [];
  const rows = JSON.parse(JSON.stringify(ROWS));
  rows[0].rebuild_from = "CPLBrain/04-projects/noncredit-summit/build.py";
  rows[0].updated_by = "Sam"; rows[0].updated_at = "2026-10-25T23:10:00Z";
  rows[0].url = "https://studentrcc.sharepoint.com/x/slides.pptx"; rows[0].home = "drive";
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(204, ""); }
    return response(200, rows);
  } });
  const doc = m.w.document;
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const card = function (id) { return m.root.querySelector("#lib-t-" + id).closest("article"); };
    check("(13) a piece with changes to make offers Copy the request; one without does not",
      !!card("a1").querySelector('[data-request="a1"]') && !card("a5").querySelector("[data-request]"));
    check("(13) its flag reads the changes in words", /Changes to make: students served/.test(card("a1").textContent));
    click(m.w, card("a1").querySelector('[data-request="a1"]'));
    const ta = doc.getElementById("lib-r-a1"), t = ta ? ta.value : "";
    check("(13) Copy the request shows the whole paste, read-only, labeled", !!ta && ta.hasAttribute("readonly") &&
      !!doc.querySelector('label[for="lib-r-a1"]'));
    check("(13) ⭐ the paste names the record, its link, its source and the changes, with who asked",
      /record noncredit-summit-cpl-slides/.test(t) && /Its link: https:\/\/studentrcc/.test(t) &&
      /Its source: CPLBrain\/04-projects\/noncredit-summit\/build\.py/.test(t) &&
      /Changes to make \(Sam, 25 October 2026\):\nstudents served, the week of the summit/.test(t), t);
    check("(13) it keeps the link, and empties the box and clears the request when done",
      /keep its link/.test(t) && /empty Changes to make and clear regen/.test(t) && /committed receipt/.test(t));
    check("(13) it ends with what a good result looks like", /A good result: [^\n]+$/.test(t));
    click(m.w, card("a5").querySelector('[data-edittop="a5"]'));
    check("(13) Edit opens in the one box, at Change its details, with no comment box of its own",
      !doc.getElementById("le-refresh") && !!doc.querySelector('#lib-drop [data-editform="a5"]') && doc.getElementById("lc-pu-details").checked);
  });
});

// ── (14) Regenerate (Sam, 2026-10-26) ────────────────────────────────────
// "I want to make sure I can Regenerate a visual when I either add a document or note
// to it ... Also, when I want to generate a new visual based on a document I upload."
block("(14)", function () {
  const writes = [];
  const rows = JSON.parse(JSON.stringify(ROWS));
  rows[2].public_listed = true; rows[2].refresh_note = "Name the noncredit lead";
  rows[2].sources = [{ title: "Sheet 129 notes", url: null, text: "Lead with the outcomes.", added_by: "Sam", added_on: "2026-10-26" }];
  rows[2].regen = { requested_at: "2026-10-26T14:05:00Z", requested_by: "Sam", publish: "show",
    ready_at: "2026-10-26T15:40:00Z", draft_url: "https://claude.ai/artifact/DRAFT1" };
  rows[3].regen = { requested_at: "2026-10-26T14:10:00Z", requested_by: "Ashley", publish: "show" };
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, init: init, body: JSON.parse(init.body) }); return response(204, ""); }
    return response(200, rows);
  } });
  const doc = m.w.document, M = m.M;
  const drop = function (file) {
    const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { files: [file] } });
    doc.getElementById("lib-drop").dispatchEvent(ev);
  };
  check("(14) a request's state reads from the record",
    M._regenState({}) === null && M._regenState({ regen: { requested_at: "x" } }) === "waiting" &&
    M._regenState({ regen: { requested_at: "x", ready_at: "y" } }) === "ready" &&
    M._regenState({ regen: { requested_at: "x", ready_at: "y", publish: "replace" } }) === "approved" &&
    M._regenState({ regen: { requested_at: "x", ready_at: "y", approved_at: "z" } }) === "approved");
  check("(14) the schema adds both columns under checks, re-runnably",
    /add column if not exists sources jsonb not null default '\[\]'::jsonb/.test(SQL) && /add column if not exists regen\s+jsonb/.test(SQL) &&
    /cpl_library_sources_ck check \(\s*jsonb_typeof\(sources\) = 'array'/.test(SQL) && /cpl_library_regen_ck check \(\s*regen is null or/.test(SQL));
  return Promise.resolve(M.activate()).then(settle).then(function () {
    const card = function (id) { return m.root.querySelector("#lib-t-" + id).closest("article"); };
    check("(14) ⭐ every record offers Revise and remediate", ["a1", "a2", "a3", "a4", "a5"].every(function (id) {
      return /Revise and remediate|Ask for more changes/.test((card(id).querySelector('[data-revise="' + id + '"]') || {}).textContent || ""); }));
    check("(14) a waiting request names who asked and when, in words, and offers Copy the request",
      /Rebuild requested by Ashley, 26 October 2026, 14:10 UTC/.test(card("a4").textContent) && !!card("a4").querySelector('[data-request="a4"]') &&
      /Rebuild requested/.test(card("a4").querySelector(".lib-flags").textContent));
    check("(14) a ready draft links the draft and offers Replace the public copy",
      /Draft ready to review/.test(card("a3").querySelector(".lib-flags").textContent) &&
      !!card("a3").querySelector('a[href="https://claude.ai/artifact/DRAFT1"]') &&
      !!card("a3").querySelector('[data-regenokform="a3"] button[type="submit"]') && /Ask for more changes/.test(card("a3").querySelector('[data-revise="a3"]').textContent));
    click(m.w, card("a3").querySelector('[data-request="a3"]'));
    const t = (doc.getElementById("lib-r-a3") || {}).value || "";
    check("(14) the paste lists the documents and says how to read pasted text",
      /Documents to work from:\n- Sheet 129 notes: text pasted into the record, 23 characters \(added by Sam, 26 October 2026\)/.test(t) &&
      /select sources from cpl_library where slug = 'cpl-funding-in-motion';/.test(t), t);
    check("(14) the paste for a public piece holds the public copy until someone replaces it",
      /the public copy stays until someone presses Replace the public copy/.test(t), t);
    check("(14) ⭐ the paste asks for the draft remediated before it comes back",
      /Remediate the draft before you hand it over/.test(t) && /npm run a11y/.test(t) && /library_remediate\.js/.test(t), t);
    click(m.w, card("a5").querySelector('[data-revise="a5"]'));
    const panel = doc.getElementById("lib-drop");
    check("(14) Revise and remediate opens the one box with the piece picked, its kind named",
      /Already in the Library/.test(panel.textContent) && /Update to the Board of Governors \u00b7 Deck/.test(panel.textContent) &&
      doc.getElementById("lc-pu-revise").checked && /Revise and remediate this piece/.test(panel.textContent), panel.textContent.slice(0, 300));
    check("(14) the box says what a session can read and what it does, and keeps a student's record out",
      /cannot open SharePoint until RCCD approves the Microsoft 365 connector/.test(panel.textContent) && /Never add a student's record/.test(panel.textContent) &&
      /checks its accessibility/.test(panel.textContent));
    check("(14) a piece off the public library asks no publish question", !panel.querySelector("select") && !/Replace the public copy/.test(panel.textContent));
    doc.getElementById("lc-instr").value = "Add the welding exhibit.";
    drop({ name: "Meeting notes.txt", text: function () { return Promise.resolve("The college asked about OSHA."); } });
    return settle();
  }).then(function () {
    check("(14) a file dropped on a picked piece becomes a document to work from, read here, and the instructions survive the repaint",
      /Meeting notes/.test(doc.querySelector("#lib-drop .lib-srcs").textContent) && doc.getElementById("lc-instr").value === "Add the welding exhibit.");
    drop({ name: "stray.txt", text: function () { return Promise.resolve("Not this one."); } });
    return settle();
  }).then(function () {
    click(m.w, m.root.querySelector('[data-srcdel="pc:1"]'));
    check("(14) Remove takes a document off the list", m.root.querySelectorAll("#lib-drop .lib-srcs li").length === 1);
    doc.getElementById("lc-link").value = "https://example.org/guide.pdf";
    click(m.w, doc.getElementById("lib-go"));
    return settle();
  }).then(function () {
    const w0 = writes[0] || { body: {}, init: {} };
    const b = w0.body || {};
    check("(14) ⭐ Revise and remediate writes the note, the documents and the request, with who asked",
      w0.init.method === "PATCH" && /id=eq\.a5$/.test(w0.url) && b.refresh_note === "Add the welding exhibit." && b.updated_by === "Sam" &&
      Array.isArray(b.sources) && b.sources.length === 2 &&
      b.sources[0].title === "Meeting notes" && b.sources[0].url === null && b.sources[0].text === "The college asked about OSHA." &&
      b.sources[1].title === "guide" && b.sources[1].url === "https://example.org/guide.pdf" && b.sources[1].text === null &&
      b.regen && b.regen.requested_by === "Sam" && b.regen.publish === "show" && /^\d{4}-\d{2}-\d{2}T/.test(b.regen.requested_at), JSON.stringify(b));
    check("(14) and says what happens next, beside the box, and lets the piece go", /Claude rebuilds Update to the Board of Governors from its source/.test(m.root.textContent) &&
      /checks its accessibility/.test(m.root.querySelector(".lib-msg").textContent) && !doc.getElementById("lc-pu-revise"));
    const card = function (id) { return m.root.querySelector("#lib-t-" + id).closest("article"); };
    submit({ w: m.w, root: m.root }, '[data-regenokform="a3"]');
    return settle().then(function () {
      const w1 = writes[1] || { body: {}, init: {} };
      const g = (w1.body || {}).regen || {};
      check("(14) Replace the public copy keeps the request and adds who approved it, and when",
        w1.init.method === "PATCH" && /id=eq\.a3$/.test(w1.url) && g.draft_url === "https://claude.ai/artifact/DRAFT1" &&
        g.requested_by === "Sam" && g.approved_by === "Sam" && /^\d{4}-\d{2}-\d{2}T/.test(g.approved_at || ""), JSON.stringify(w1.body));
      check("(14) no Regenerate write deletes", writes.every(function (x) { return x.init.method !== "DELETE"; }));
      return card;
    });
  });
});

// ── (15) One card per project (Sam, 2026-10-28; mockup Version 20) ───────
// Pieces sharing `project` draw as one card with a row per piece, each title its link;
// a project of one keeps the plain card; Edit sets the project; Make a visual files the
// college's visual and workbook under one project.
const PROJ_ROWS = [
  { id: "p1", slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points", kind: "visual", project: "ELL IET CPL",
    occasion: "Prepare to meet with grant recipients on CPL", made_on: "2026-10-23", version: "2", status: "draft", seen_by: "public",
    home: "web", url: "https://cpl-initiative.github.io/cpl-project-tracker/library/ell-iet/", public_listed: true,
    for_kind: "agency", for_name: "EDD ELL IET Fund grantees", summary: "A card per ELL IET Fund project", versions: [] },
  { id: "p2", slug: "ell-iet-cpl-ideas", title: "ELL IET CPL Ideas", kind: "document", project: "ELL IET CPL",
    occasion: "Prepare to meet with grant recipients on CPL", made_on: "2026-10-22", status: "draft", seen_by: "public",
    home: "web", url: "https://claude.ai/artifact/x", public_listed: false, for_kind: "agency", for_name: "EDD ELL IET Fund grantees", versions: [] },
  { id: "p3", slug: "lone-deck", title: "A lone deck", kind: "deck", project: "Only me",
    occasion: "Prepare to meet with grant recipients on CPL", made_on: "2026-10-21", status: "draft", seen_by: "team",
    home: "not_filed", url: null, versions: [] }
];
block("(15)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method && init.method !== "GET") { writes.push({ url: url, body: JSON.parse(init.body || "{}") }); return response(200, [{}]); }
    return response(200, PROJ_ROWS);
  } });
  const doc = m.w.document, M = m.M;
  return Promise.resolve(M.activate()).then(settle).then(function () {
    const cards = m.root.querySelectorAll("#lib-register article");
    check("(15) two pieces sharing a project draw as one card, a project of one as its own", cards.length === 2, cards.length);
    const proj = m.root.querySelector("article.lib-proj");
    check("(15) the project card names the project and counts its pieces", !!proj && /ELL IET CPL/.test(proj.querySelector("h3").textContent) && /2 pieces/.test(proj.textContent) && /Visual and document/.test(proj.textContent), proj && proj.textContent.slice(0, 200));
    check("(15) the card carries the public-library chip when a piece is listed", /In the public library/.test(proj.querySelector(".lib-body > .lib-chips").textContent));
    const rows = proj.querySelectorAll("li.lib-piece");
    check("(15) a row per piece, its title the link", rows.length === 2 && rows[0].querySelector("a#lib-t-p1").getAttribute("href") === PROJ_ROWS[0].url);
    check("(15) the unlisted piece offers List publicly, the listed one does not", !!rows[1].querySelector("[data-pubtop]") && !rows[0].querySelector("[data-pubtop]"));
    check("(15) the lone piece keeps the plain card with File it", !doc.getElementById("lib-t-p3").closest("article").classList.contains("lib-proj") && !!doc.getElementById("lib-t-p3").closest("article").querySelector("[data-file]"));
    click(m.w, rows[1].querySelector("[data-toggle]"));
    check("(15) Details opens under its own row", !doc.getElementById("lib-d-p2").hidden && doc.getElementById("lib-d-p2").closest("li.lib-piece") !== null);
    click(m.w, m.root.querySelector('li.lib-piece [data-edittop="p2"]'));
    const pf = doc.getElementById("le-project");
    check("(15) Edit offers Project, filled, with the known projects to pick from", !!pf && pf.value === "ELL IET CPL" && /ELL IET CPL/.test((doc.getElementById("lib-projects") || {}).innerHTML || ""));
    pf.value = "";
    submit(m, 'form[data-editform="p2"]');
    return settle();
  }).then(function () {
    const e = writes.filter(function (x) { return /id=eq\.p2/.test(x.url); })[0];
    check("(15) clearing Project saves null", !!e && e.body.project === null, e && JSON.stringify(e.body));
    const pair = M._collegePair ? M._collegePair("Norco College", "x", "Sam") : null;
    check("(15) Make a visual files the visual and workbook under one project", !pair || (pair[0].project === "Norco College: CPL Opportunity Analysis" && pair[1].project === pair[0].project));
    check("(15) the schema adds project, re-runnable and capped", /add column if not exists project\s+text/.test(SQL) && /cpl_library_project_ck/.test(SQL));
  });
});

function remDeck() {
  const JSZip = require("../jszip.min.js"), z = new JSZip();
  const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  z.file("docProps/core.xml", '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title></dc:title></cp:coreProperties>');
  z.file("ppt/slides/slide1.xml", '<p:sld ' + ns + '><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr/><a:t>Where the funding goes</a:t></a:r></a:p></p:txBody></p:sp>' +
    '<p:pic><p:nvPicPr><p:cNvPr id="4" name="Picture 3"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/></p:blipFill><p:spPr><a:xfrm><a:off x="600000" y="1500000"/><a:ext cx="5000000" cy="3000000"/></a:xfrm></p:spPr></p:pic>' +
    // A QR code (S517) with its label just below it.
    '<p:pic><p:nvPicPr><p:cNvPr id="6" name="Picture 5"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId3"/></p:blipFill><p:spPr><a:xfrm><a:off x="8000000" y="1500000"/><a:ext cx="2000000" cy="2000000"/></a:xfrm></p:spPr></p:pic>' +
    '<p:sp><p:nvSpPr><p:cNvPr id="7" name="TextBox 6"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="7800000" y="3600000"/><a:ext cx="2400000" cy="400000"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr sz="2000"/><a:t>MAP Website</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>');
  z.file("ppt/slides/_rels/slide1.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="image" Target="../media/image1.png"/><Relationship Id="rId3" Type="image" Target="../media/qr.png"/></Relationships>');
  z.file("ppt/media/image1.png", "png");
  z.file("ppt/media/qr.png", "qr png");
  return z.generateAsync({ type: "uint8array" }).then(function (u8) { return u8.buffer; });
}
// ── (16) Create or Remediate a Document (Sam, 2026-10-28; mockup Version 20) ──
// One place to add: the three buttons are gone; Start runs the path the choice names.
block("(16)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (/functions\/v1\/alt-text-draft/.test(url)) {
      aiCalls.push({ headers: init.headers, body: JSON.parse(init.body) });
      return new Promise(function (r) { setTimeout(function () { r(response(200, { alt: "Screenshot of the MAP CPL Dashboard's CPL Opportunities view", decorative: false })); }, 40); });
    }
    if (init && init.method && init.method !== "GET") {
      writes.push({ url: url, method: init.method, body: JSON.parse(init.body || "{}") });
      return response(201, [init.method === "POST" && /cpl_library/.test(url) ? Object.assign({ id: "rem" + writes.length }, JSON.parse(init.body || "{}")) : {}]);
    }
    return response(200, ROWS);
  } });
  const aiCalls = [];
  const doc = m.w.document;
  const drop = function (file) {
    const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { files: [file] } });
    doc.getElementById("lib-drop").dispatchEvent(ev);
  };
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(16) one panel, headed Create, Revise or Remediate a Document", /Create, Revise or Remediate a Document/.test(doc.getElementById("lib-panel-h").textContent));
    check("(16) no Make a visual, Start a piece or Add to the Library button", !doc.getElementById("lib-make") && !doc.getElementById("lib-start") && !doc.getElementById("lib-add"));
    check("(16) one word starts it", doc.getElementById("lib-go").textContent.trim() === "Start");
    click(m.w, doc.getElementById("lib-go"));
    check("(16) Start with nothing says what to do, and opens no form", /Drop a file, paste a link, or say in Instructions what to make/.test(m.root.textContent) && !doc.getElementById("lib-startform") && !doc.getElementById("lib-addform"));
    openStart(m, "A deck for the webinar on the funding");
    check("(16) instructions that name a deck open the brief as a deck on the CO template with a script in the notes",
      doc.getElementById("ls-kind").value === "deck" && /Chancellor's Office template, with a speaker script in each slide's notes/.test(doc.getElementById("ls-shape").value));
    click(m.w, m.root.querySelector("[data-startcancel]"));
    openStart(m, "A memo to the CIOs");
    check("(16) a memo starts in the CO styles", doc.getElementById("ls-kind").value === "document" && doc.getElementById("ls-shape").value === "The Chancellor's Office styles");
    click(m.w, m.root.querySelector("[data-startcancel]"));
    openAdd(m, "https://studentrcc.sharepoint.com/sites/x/20261030_Summit_Funding.pptx");
    check("(16) a pasted link files as is by default, the link and a title from its name filled in",
      !!doc.getElementById("lib-addform") && doc.getElementById("la-url").value === "https://studentrcc.sharepoint.com/sites/x/20261030_Summit_Funding.pptx" &&
      doc.getElementById("la-title").value === "Summit Funding" && doc.getElementById("la-kind").value === "deck");
    doc.getElementById("lc-use-background").checked = true;
    doc.getElementById("lc-use-background").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    doc.getElementById("lc-instr").value = "A one-page visual from this deck";
    click(m.w, doc.getElementById("lib-go"));
    check("(16) background opens the brief with the link as a document to work from",
      !!doc.getElementById("lib-startform") && (m.M._state.src.ls || []).length === 1 && m.M._state.src.ls[0].url === "https://studentrcc.sharepoint.com/sites/x/20261030_Summit_Funding.pptx");
    click(m.w, m.root.querySelector("[data-unpick]"));
    return remDeck();
  }).then(function (buf) {
    // The remediation module and its zip reader, as the page loads them on demand.
    m.w.JSZip = require("../jszip.min.js");
    m.w.CPL_REMEDIATE = require("../library_remediate.js");
    // The browser's image, canvas and QR reader, stood in for jsdom: the second picture
    // read (the QR code) holds a code; the first does not.
    m.w.URL.createObjectURL = function () { return "blob:pic"; };
    m.w.URL.revokeObjectURL = function () {};
    m.w.Image = function () { const self = this; Object.defineProperty(this, "src", { set: function () { self.naturalWidth = 3136; self.naturalHeight = 1000; setTimeout(function () { self.onload(); }, 0); } }); };
    m.w.HTMLCanvasElement.prototype.getContext = function () { return { drawImage: function () {}, fillRect: function () {}, getImageData: function (x, y, w, h) { return { data: new Uint8ClampedArray(4), width: w, height: h }; } }; };
    m.w.HTMLCanvasElement.prototype.toDataURL = function () { return "data:image/png;base64,QUJD"; };
    let qrReads = 0;
    m.w.jsQR = function () { qrReads++; return qrReads === 2 ? { data: "https://map.rccd.edu/" } : null; };
    drop({ name: "20261030_Webinar.pptx", arrayBuffer: function () { return Promise.resolve(buf); } });
    check("(16) a dropped deck offers Remediate, chosen", !!doc.getElementById("lc-use-remediate") && doc.getElementById("lc-use-remediate").checked && /20261030_Webinar\.pptx: what is it for\?/.test(m.root.textContent));
    const auto = doc.getElementById("lc-autodraft");
    check("(16) the panel says what leaves the browser when drafting is on", /with drafting on, each picture and the words around it go to Claude for its alt text, and nothing else leaves until you file it/.test(m.root.textContent));
    check("(16) Claude drafting every picture is on by default, and says each picture goes to Claude (S517)", !!auto && auto.checked && /Each picture and the words around it go to Claude; turn this off for a file that shows a student's record/.test(auto.parentNode.textContent));
    click(m.w, doc.getElementById("lib-go"));
    const ready = function (n) { return doc.querySelector("[data-remgo]") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return ready(n - 1); }); };
    const waiting = function (n) { return doc.querySelector("[data-remshow]") || doc.querySelector("[data-remgo]") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 5); }).then(function () { return waiting(n - 1); }); };
    return waiting(400).then(function () {
      check("(16) the report waits while Claude drafts, and says so", !doc.querySelector("[data-remgo]") && /Reading the pictures|Claude is drafting alt text/.test(doc.querySelector(".lib-rem").textContent) && !!doc.querySelector("[data-remshow]"));
      return ready(300);
    });
  }).then(function () {
    const rem = doc.querySelector(".lib-rem");
    check("(16) Remediate reads the deck here and reports Fixed for you and Needs you", !!rem && /Fixed for you \(\d+\)/.test(rem.textContent) && /Needs you \(\d+\)/.test(rem.textContent), rem && rem.textContent.slice(0, 300));
    const rec = writes.filter(function (w) { return w.method === "POST" && /cpl_library/.test(w.url); });
    check("(16) the file is in the Library as soon as it opens: one Draft record, no link yet, named for the file", rec.length === 1 && rec[0].body.status === "draft" && rec[0].body.home === "not_filed" &&
      rec[0].body.url === null && rec[0].body.file_name === "20261030_Webinar.pptx" && rec[0].body.title === "Webinar" && rec[0].body.kind === "deck" && rec[0].body.remediation === "in_remediation", JSON.stringify(rec));
    check("(16) the title it set is listed", /Document title set: Where the funding goes/.test(rem.textContent));
    check("(16) a deck's contrast is checked here, so the page no longer sends it to the Accessibility Checker", !/contrast is not checked here/i.test(rem.textContent));
    const fields = doc.querySelectorAll("[data-remtext]"), alt0 = fields[0], qrField = fields[1];
    check("(16) the report opens with Claude's draft in place, and says Claude drafted it", alt0.value === "Screenshot of the MAP CPL Dashboard's CPL Opportunities view" && /Drafted by Claude from the picture and its slide/.test(rem.textContent), alt0.value);
    const c = aiCalls[0] || { headers: {}, body: {} };
    check("(16) the picture goes to alt-text-draft shrunk to 1568 pixels, with the team phrase and the slide's words", c.body.image === "QUJD" && c.body.media_type === "image/png" && c.headers["x-team-pass"] === "p" &&
      /^The slide's title: Where the funding goes\nOther words on the slide, top to bottom: MAP Website$/.test(c.body.context), JSON.stringify(c.body).slice(0, 300));
    check("(16) a QR code the page read keeps its own draft, the address and the label below it, and is not sent to Claude", aiCalls.length === 1 && qrField.value === "QR code to MAP Website, map.rccd.edu" &&
      /The QR code reads https:\/\/map\.rccd\.edu\/\./.test(rem.textContent) && /On the slide, just below it: “MAP Website”/.test(rem.textContent), qrField.value + " / " + aiCalls.length);
    const slides = rem.querySelectorAll(".lib-remslide");
    check("(16) each picture shows its slide to its left, the picture outlined", slides.length === 2 && slides[0].querySelectorAll(".lib-remhit").length === 1 && /Slide 1 as laid out, the picture outlined/.test(slides[0].getAttribute("aria-label")) &&
      slides[0].parentNode.nextElementSibling.classList.contains("lib-remthumb"));
    click(m.w, rem.querySelector("[data-remzoom]"));
    check("(16) Larger slide draws the slide across the item, and Smaller slide puts it back", !!doc.querySelector(".lib-rembig .lib-remslide") && doc.querySelector("[data-remzoom]").getAttribute("aria-expanded") === "true" && /Smaller slide/.test(doc.querySelector("[data-remzoom]").textContent));
    click(m.w, doc.querySelector("[data-remzoom]"));
    const prog = function () { return (doc.getElementById("lib-remprog") || {}).textContent || ""; };
    check("(16) one bar at the top, a part per area, what the page fixed apart from what is left; a draft is left until a person keeps it",
      /^1 slide\. 2 items are left for you before the Chancellor's Office review; the page fixed 2 and 4 checks pass with nothing to fix\. Solid is fixed or passing, striped is yours, gray is left\./.test(prog()) &&
      /Remediation designed to meet WCAG 2\.2 AA, which includes 2\.1 AA, and California Government Code 7405, 11135 and 11546\.7/.test(doc.querySelector(".lib-rem .lib-kicker").textContent) && /Alt text \(WCAG 1\.1\.1\): 2 left/.test(prog()) &&
      /Document title \(WCAG 2\.4\.2\): 1 fixed, done/.test(prog()) && /Language \(WCAG 3\.1\.1\): 1 fixed, done/.test(prog()) && /Reading order \(WCAG 1\.3\.2\): passes/.test(prog()) && /Color contrast \(WCAG 1\.4\.3\): passes/.test(prog()) &&
      doc.querySelectorAll("#lib-remprog .bar").length === 7 && !doc.querySelector(".lib-rem .lib-remhead .lib-line"), prog());
    // Each check's words go to its first item left; a check the page fixed goes to its line in Fixed for you.
    click(m.w, doc.querySelector("#lib-remprog button[data-remgoto=alt]"));
    check("(16) a check's words link to its first item left, its field focused", doc.activeElement === doc.querySelector("[data-remtext]") && doc.querySelectorAll("#lib-remprog button.n").length === 3 && /^Alt text \(WCAG 1\.1\.1\): 2 left$/.test(doc.querySelector("#lib-remprog button[data-remgoto=alt]").textContent));
    click(m.w, doc.querySelector("#lib-remprog .bar[data-remgoto=lang]"));
    check("(16) the bar's part is a link too, and a fixed check goes to its line in Fixed for you", doc.activeElement && /^lib-remfix-/.test(doc.activeElement.id) && /Language set/.test(doc.activeElement.textContent) && !doc.querySelector("#lib-remprog [data-remgoto=order]"), doc.activeElement && doc.activeElement.id);
    click(m.w, doc.querySelector("[data-remkeep]"));
    check("(16) Keep counts an item, and says Kept", /Alt text \(WCAG 1\.1\.1\): 1 by you, 1 left/.test(prog()) && doc.querySelector("[data-remkeep]").getAttribute("aria-pressed") === "true" && doc.querySelector("[data-remkept]").textContent === "Kept", prog());
    // Keep all keeps every alt text with words at once.
    click(m.w, doc.querySelector("[data-remkeepall]"));
    check("(16) Keep all keeps every draft with words, and says how many", /Alt text \(WCAG 1\.1\.1\): 2 by you, done/.test(prog()) && /Kept 1 draft\./.test(m.root.textContent) &&
      doc.querySelectorAll("[data-remkept]")[1].textContent === "Kept", prog());
    click(m.w, doc.querySelectorAll("[data-remkeep]")[1]);
    const qf = doc.querySelectorAll("[data-remtext]")[1];
    qf.value = "QR code to the MAP website, map.rccd.edu"; qf.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    check("(16) an edit counts as kept, and an area with nothing left says done", /^1 slide\. Ready for the Chancellor's Office review; the page fixed 2, you have done 2 and 4 checks pass with nothing to fix\./.test(prog()) && /Alt text \(WCAG 1\.1\.1\): 2 by you, done/.test(prog()) &&
      doc.querySelector("#lib-remprog .bar[data-remgoto=alt] .you").style.width === "100%", prog());
    // Draft from the picture still drafts one picture again, on a press.
    click(m.w, doc.querySelector("[data-remai]"));
    const drafted = function (n) { return (aiCalls.length > 1 && !/Reading the picture/.test(doc.querySelector("[data-remai]").textContent)) || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return drafted(n - 1); }); };
    return drafted(200);
  }).then(function () {
    check("(16) Redraft from the slide asks again for that one picture, and says what goes", aiCalls.length === 2 && /Redraft from the slide/.test(doc.querySelector("[data-remai]").textContent) &&
      /Each draft sends one picture and its slide's words to Claude/.test(doc.querySelector(".lib-rem").textContent));
    const alt = doc.querySelector("[data-remtext]");
    const rem = doc.querySelector(".lib-rem");
    alt.value = "Bar chart: units by college"; alt.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    let downloaded = null;
    m.w.URL.createObjectURL = function () { return "blob:remediated"; };
    m.w.URL.revokeObjectURL = function () {};
    m.w.HTMLAnchorElement.prototype.click = function () { downloaded = this.download; };
    check("(16) the last step says what it does: Download the remediated file", rem.querySelector("[data-remgo]").textContent.trim() === "Download the remediated file");
    click(m.w, rem.querySelector("[data-remgo]"));
    const until = function (n) { return downloaded || n <= 0 ? Promise.resolve(downloaded) : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return until(n - 1); }); };
    return until(200);
  }).then(function (downloaded) {
    check("(16) Download the remediated file hands back the file under the original's name, the date code kept", downloaded === "20261030_Webinar_Remediated.pptx", String(downloaded));
    check("(16) and says what it wrote", /2 alt texts, 0 marked decorative/.test(m.root.textContent), (m.root.querySelector(".lib-msg") || {}).textContent);
    const patch = writes.filter(function (w) { return w.method === "PATCH"; }).pop();
    check("(16) the download notes the fixes on that record and opens its form for the link", !!patch && /id=eq\.rem\d+/.test(patch.url) && patch.body.file_name === "20261030_Webinar_Remediated.pptx" && patch.body.remediation === "remediated" &&
      /^Remediated in the Library on \d{4}-\d{2}-\d{2}: /.test(patch.body.note) && !!doc.getElementById("lib-addform") && m.M._state.formFor === patch.url.split("id=eq.")[1] &&
      /It is in the Library as a Draft, Webinar, with no link yet/.test(m.root.textContent), JSON.stringify(patch));
    // The main page counts and filters the files in remediation and remediated.
    // (The stand-in server keeps the record this run wrote; set it aside to count from a known list.)
    m.M._state.rows = m.M._state.rows.filter(function (r) { return !r.remediation; });
    const base = m.M._state.rows[0];
    m.M._state.rows = m.M._state.rows.concat([Object.assign({}, base, { id: "remA", slug: "rem-a", title: "Remediating A", remediation: "in_remediation" }),
      Object.assign({}, base, { id: "remB", slug: "rem-b", title: "Remediated B", remediation: "remediated" }), Object.assign({}, base, { id: "remC", slug: "rem-c", title: "Remediated C", remediation: "remediated" })]);
    m.M._state.form = null; m.M._state.formFor = null; m.M.render();
    const remBox = function (k) { return doc.querySelector('.lib-flag[data-flag="' + k + '"]'); };
    check("(16) a Remediation group counts the files in remediation and remediated", /^Remediation$/.test(doc.getElementById("lib-remflags-h").textContent) &&
      remBox("in_remediation").textContent === "1in remediation" && remBox("remediated").textContent === "2remediated", remBox("in_remediation") && remBox("in_remediation").textContent);
    click(m.w, remBox("remediated"));
    check("(16) its box filters the list to those files", m.M._state.flag === "remediated" && /Remediated B/.test(m.root.textContent) && /Remediated C/.test(m.root.textContent) && !/Remediating A/.test(m.root.textContent));
    click(m.w, remBox("remediated"));
    check("(16) the schema adds remediation, re-runnable and checked", /add column if not exists remediation text/.test(SQL) && /cpl_library_remediation_ck/.test(SQL));
    m.M._state.formFor = (writes.filter(function (w) { return w.method === "PATCH"; }).pop().url.split("id=eq.")[1]);
    click(m.w, doc.querySelector("[data-remfile]"));
    check("(16) File it in the Library opens that same record's form, for its link", !!doc.getElementById("lib-addform") && !!doc.getElementById("la-url") && /^rem\d+$/.test(m.M._state.formFor || ""), m.M._state.formFor);
    // Turned off, nothing goes to Claude, and each draft comes from the slide's own words.
    return remDeck();
  }).then(function (buf) {
    const before = aiCalls.length;
    drop({ name: "20261030_Webinar.pptx", arrayBuffer: function () { return Promise.resolve(buf); } });
    doc.getElementById("lc-autodraft").checked = false;
    doc.getElementById("lc-autodraft").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    click(m.w, doc.getElementById("lib-go"));
    const ready2 = function (n) { return doc.querySelector("[data-remgo]") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return ready2(n - 1); }); };
    return ready2(300).then(function () { return new Promise(function (r) { setTimeout(r, 60); }); }).then(function () {
      check("(16) with drafting turned off, no picture goes to Claude, and the draft is the slide's title", aiCalls.length === before && doc.querySelector("[data-remtext]").value === "Where the funding goes", doc.querySelector("[data-remtext]").value);
      // Remediate another file, from the report itself; it asks first when answers would go.
      const next = doc.getElementById("lc-file-next");
      check("(16) the report offers Remediate another file beside Close", !!next && /Remediate another file/.test(doc.querySelector('label[for="lc-file-next"]').textContent) && next.getAttribute("accept") === ".pptx,.docx,.xlsx,.pdf");
      click(m.w, doc.querySelector("[data-remkeep]"));
      let asked = 0;
      m.w.confirm = function () { asked++; return false; };
      const choose = function (name) {
        const el = doc.getElementById("lc-file-next");
        Object.defineProperty(el, "files", { configurable: true, value: [{ name: name, arrayBuffer: function () { return Promise.resolve(buf); } }] });
        el.dispatchEvent(new m.w.Event("change", { bubbles: true }));
      };
      choose("20261029_Other.pptx");
      check("(16) with a kept answer not yet downloaded, it asks, and No keeps this report", asked === 1 && doc.getElementById("lib-rem-h").textContent === "20261030_Webinar.pptx");
      m.w.confirm = function () { asked++; return true; };
      choose("20261029_Other.pptx");
      const opened = function (n) { return (doc.querySelector("[data-remgo]") && doc.getElementById("lib-rem-h").textContent === "20261029_Other.pptx") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return opened(n - 1); }); };
      return opened(300).then(function () {
        check("(16) Yes opens the next file's report in place", asked === 2 && doc.getElementById("lib-rem-h").textContent === "20261029_Other.pptx" && !!doc.querySelector("[data-remgo]"));
      });
    });
  }).then(function () {
    drop({ name: "20261029_College_Awards.xlsx" });
    check("(16) a dropped workbook offers Remediate, chosen (S514)", !!doc.getElementById("lc-use-remediate") && doc.getElementById("lc-use-remediate").checked);
    drop({ name: "Photo.png" });
    check("(16) a picture is not offered Remediate", !doc.getElementById("lc-use-remediate"));
    doc.getElementById("lc-use-asis").checked = true;
    doc.getElementById("lc-use-asis").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    click(m.w, doc.getElementById("lib-go"));
    check("(16) a dropped file to file as is asks for its SharePoint link (a record holds a link, never bytes)",
      !!doc.getElementById("lib-addform") && /Put Photo\.png in the CPLLibrary folder/.test(m.root.textContent) && doc.getElementById("la-title").value === "Photo");
    drop({ name: "notes.txt", text: function () { return Promise.resolve("Eight projects funded."); } });
    doc.getElementById("lc-instr").value = "A visual of the eight projects";
    click(m.w, doc.getElementById("lib-go"));
    return settle();
  }).then(function () {
    const src = m.M._state.src.ls || [];
    check("(16) a text file used as background is read here into the brief's documents", src.length === 1 && src[0].text === "Eight projects funded." && src[0].title === "notes", JSON.stringify(src));
    check("(16) the instructions name the kind", doc.getElementById("ls-kind").value === "visual");
    // (16) A PDF is fixed at its source (S513): Remediate reads it, names what made it,
    // the record that may hold its source, and offers the source file, never a download.
    const pdf = makePdf({ creator: "Microsoft PowerPoint", title: "Update to the Board of Governors" });
    drop({ name: "20260716_Update_to_the_Board_of_Governors.pdf", arrayBuffer: function () { return Promise.resolve(pdf); } });
    check("(16) a dropped PDF offers Remediate, chosen", !!doc.getElementById("lc-use-remediate") && doc.getElementById("lc-use-remediate").checked);
    click(m.w, doc.getElementById("lib-go"));
    const shown = function (n) { return /What the PDF carries/.test((doc.querySelector(".lib-rem") || {}).textContent || "") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return shown(n - 1); }); };
    return shown(200);
  }).then(function () {
    const rem = doc.querySelector(".lib-rem");
    const t = rem ? rem.textContent : "";
    check("(16) the PDF's report says what it carries in words, and where to fix it", /Needs its source: Not tagged/.test(t) && /It was made from a PowerPoint deck \(Microsoft PowerPoint\)/.test(t) && /Create PDF\/XPS/.test(t), t.slice(0, 400));
    const a = rem && rem.querySelector('a[href="https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/presentations/b.pptx"]');
    check("(16) the Library record whose title matches is named as its likely source", !!a && a.textContent === "Update to the Board of Governors");
    check("(16) it offers the source .pptx, and no Download the remediated file", !!rem.querySelector('label[for="lc-file"]') && /Choose the source \.pptx/.test(t) && !rem.querySelector("[data-remgo]"));
    const pdfRec = writes.filter(function (w) { return w.method === "POST" && w.body.file_name === "20260716_Update_to_the_Board_of_Governors.pdf"; });
    check("(16) a PDF opened for remediation is in the Library too, as a Draft with no link", pdfRec.length === 1 && pdfRec[0].body.status === "draft" && pdfRec[0].body.home === "not_filed");
    m.w.close(); // ends the download's one-minute revoke timer with the window
  });
});

// ── (17) Each slide an item names, drawn beside it (Sam, 2026-10-29) ─────
// "Is it possible to show the slides next to the problem item with these notes so the
// ppt doesn't need to be opened separately?" and "another example is the blank title box
// on slide 12 where it would be good to see the slide next to it."
function slidesDeck() {
  const JSZip = require("../jszip.min.js"), z = new JSZip();
  const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const box = function (id, y, words, rPr) {
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="TextBox ' + id + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="600000" y="' + y + '"/><a:ext cx="4000000" cy="400000"/></a:xfrm></p:spPr>' +
      '<p:txBody><a:bodyPr/><a:p><a:r><a:rPr sz="1400"' + (rPr || "/>") + '<a:t>' + words + '</a:t></a:r></a:p></p:txBody></p:sp>';
  };
  const title = function (words) {
    return '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="600000" y="200000"/><a:ext cx="10000000" cy="900000"/></a:xfrm></p:spPr>' +
      '<p:txBody><a:bodyPr/>' + (words ? '<a:p><a:r><a:rPr/><a:t>' + words + '</a:t></a:r></a:p>' : '<a:p><a:endParaRPr/></a:p>') + '</p:txBody></p:sp>';
  };
  const slide = function (body) { return '<p:sld ' + ns + '><p:cSld><p:spTree>' + body + '</p:spTree></p:cSld></p:sld>'; };
  z.file("docProps/core.xml", '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title></dc:title></cp:coreProperties>');
  // Slide 1: a title and ten text boxes, so its reading order is asked for.
  let crowd = title("The Summit's agenda");
  for (let i = 0; i < 10; i++) crowd += box(10 + i, 1200000 + i * 450000, "Item " + (i + 1));
  z.file("ppt/slides/slide1.xml", slide(crowd));
  // Slide 2: a title box left blank, and light gray words on white.
  z.file("ppt/slides/slide2.xml", slide(title("") + box(5, 2000000, "Metric:", '><a:solidFill><a:srgbClr val="CCCCCC"/></a:solidFill></a:rPr>')));
  // Slide 3: no title box at all.
  z.file("ppt/slides/slide3.xml", slide(box(5, 2000000, "Questions?")));
  // A layout, master and theme behind them, so contrast is measured.
  const rel = function (target) { return '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="x" Target="' + target + '"/></Relationships>'; };
  [1, 2, 3].forEach(function (k) { z.file("ppt/slides/_rels/slide" + k + ".xml.rels", rel("../slideLayouts/slideLayout1.xml")); });
  z.file("ppt/slideLayouts/slideLayout1.xml", '<p:sldLayout ' + ns + '><p:cSld><p:spTree/></p:cSld></p:sldLayout>');
  z.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", rel("../slideMasters/slideMaster1.xml"));
  z.file("ppt/slideMasters/slideMaster1.xml", '<p:sldMaster ' + ns + '><p:cSld><p:spTree/></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"/></p:sldMaster>');
  z.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", rel("../theme/theme1.xml"));
  z.file("ppt/theme/theme1.xml", '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="t"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1></a:clrScheme></a:themeElements></a:theme>');
  return z.generateAsync({ type: "uint8array" }).then(function (u8) { return u8.buffer; });
}
block("(17)", function () {
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method && init.method !== "GET") return response(201, [Object.assign({ id: "rem17" }, JSON.parse(init.body || "{}"))]);
    return response(200, ROWS);
  } });
  const doc = m.w.document;
  return Promise.resolve(m.M.activate()).then(settle).then(slidesDeck).then(function (buf) {
    m.w.JSZip = require("../jszip.min.js");
    m.w.CPL_REMEDIATE = require("../library_remediate.js");
    m.w.URL.createObjectURL = function () { return "blob:pic"; };
    m.w.URL.revokeObjectURL = function () {};
    const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { files: [{ name: "20261030_Agenda.pptx", arrayBuffer: function () { return Promise.resolve(buf); } }] } });
    doc.getElementById("lib-drop").dispatchEvent(ev);
    click(m.w, doc.getElementById("lib-go"));
    const ready = function (n) { return doc.querySelector("[data-remgo]") || n <= 0 ? Promise.resolve() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return ready(n - 1); }); };
    return ready(300);
  }).then(function () {
    const need = function (id) { return doc.getElementById("lib-remneed-" + id); };
    const t2 = need("t2"), c2 = need("c2-1"), ro = need("ro"), tp = need("t3");
    check("(17) the report holds the blank title, the contrast, the reading order and the missing title", !!t2 && !!c2 && !!ro && !!tp, m.M._state.rem && JSON.stringify(m.M._state.rem.report.needs.map(function (n) { return [n.id, n.slide, n.slides, (n.text || n.label || "").slice(0, 60)]; })));
    if (!t2 || !c2 || !ro || !tp) return;
    const s2 = t2.querySelector(".lib-remside .lib-remslide");
    check("(17) a blank title box shows its slide to its left, the empty box outlined", !!s2 && /^Slide 2 as laid out, its empty title box outlined$/.test(s2.getAttribute("aria-label")) &&
      s2.querySelectorAll(".lib-remhit").length === 1 && s2.parentNode.nextElementSibling.classList.contains("lib-field"), s2 && s2.getAttribute("aria-label"));
    // The blank title is drafted from the slide's own words, kept off the slide, and left until kept.
    const tIn = t2.querySelector("[data-remtext]"), tOff = t2.querySelector("[data-remoff]");
    check("(17) a blank title is drafted from the slide's words, its box kept off the slide, with Keep", !!tIn && tIn.value === "Metric:" && !!tOff && tOff.checked &&
      !!t2.querySelector("[data-remkeep]") && /Drafted from the largest words in the slide's top half/.test(t2.textContent) && !m.M._state.rem.kept.t2, tIn && tIn.value);
    tOff.checked = false; tOff.dispatchEvent(new m.w.Event("change", { bubbles: true }));
    check("(17) the off-the-slide box is the person's to clear", m.M._state.rem.answers.t2.off === false);
    const sc = c2.querySelector(".lib-remside .lib-remslide");
    check("(17) text below AA shows its slide, the words outlined, drawn in their own color", !!sc && /the text below AA outlined/.test(sc.getAttribute("aria-label")) && sc.querySelectorAll(".lib-remhit").length === 1 &&
      Array.prototype.some.call(sc.querySelectorAll("span"), function (x) { return x.textContent === "Metric:" && /color:\s*(#CCCCCC|rgb\(204, 204, 204\))/i.test(x.getAttribute("style")); }));
    const order = ro.querySelectorAll(".lib-remstrip .lib-remslide");
    const nums = order.length ? Array.prototype.map.call(order[0].querySelectorAll(".lib-remord"), function (x) { return x.textContent; }).join(",") : "";
    check("(17) a crowded slide is drawn under its item, each item numbered in the order a screen reader meets it", order.length === 1 && nums === "1,2,3,4,5,6,7,8,9,10,11" &&
      /each item numbered in the order a screen reader meets it/.test(order[0].getAttribute("aria-label")) && /The numbers on each slide below show the order/.test(ro.textContent), nums);
    check("(17) its reading order can be checked here", /Checked here or in PowerPoint/.test(ro.textContent));
    // A slide with no title box (Sam: "yes, add the title boxes to slides with none") asks for its title here.
    const tps = tp.querySelector(".lib-remside .lib-remslide"), tpIn = tp.querySelector("[data-remtext]"), tpOff = tp.querySelector("[data-remoff]");
    check("(17) a slide with no title box shows its slide, drafts its title, and keeps the new box off the slide", !!tps && /^Slide 3 as laid out$/.test(tps.getAttribute("aria-label")) &&
      /Slide 3 has no title box; the page adds one with the title you keep here/.test(tp.textContent) && !!tpIn && tpIn.value === "Questions?" && !!tpOff && tpOff.checked && !/PowerPoint/.test(tp.textContent), tp.textContent.slice(0, 300));
    click(m.w, ro.querySelector('[data-remzoom="ro"][data-remat="1"]'));
    const ro2 = need("ro");
    check("(17) a slide's number shows it larger, and again puts it back", !!ro2.querySelector(".lib-rembig .lib-remslide") && ro2.querySelector('[data-remat="1"]').getAttribute("aria-expanded") === "true" && doc.activeElement === ro2.querySelector('[data-remat="1"]'));
    click(m.w, ro2.querySelector('[data-remat="1"]'));
    check("(17) Smaller", !need("ro").querySelector(".lib-rembig"));
    click(m.w, need("t2").querySelector("[data-remzoom]"));
    check("(17) Larger slide on the blank title draws it across the item", !!need("t2").querySelector(".lib-rembig .lib-remslide") && /Smaller slide/.test(need("t2").querySelector("[data-remzoom]").textContent));
  });
});

// ── (18) Speaker notes: keep them, a script below, or a script in their place (Sam, 2026-10-29) ──
// "can you add a prompt once someone uploads a ppt for revision or remediation (maybe in the
// instructions window) to ask if they have notes that they want to preserve and the option for
// you to add a script below or replacing their notes?"
block("(18)", function () {
  const scriptCalls = [];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (/functions\/v1\/slide-script-draft/.test(url)) {
      const b = JSON.parse(init.body); scriptCalls.push({ headers: init.headers, body: b });
      return response(200, { script: "On slide " + b.slide + " we cover " + (b.title || "the agenda") + "." });
    }
    if (init && init.method && init.method !== "GET") return response(201, [Object.assign({ id: "rem18" }, JSON.parse(init.body || "{}"))]);
    return response(200, ROWS);
  } });
  const doc = m.w.document;
  const drop = function (name, buf) {
    const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { files: [{ name: name, arrayBuffer: function () { return Promise.resolve(buf); } }] } });
    doc.getElementById("lib-drop").dispatchEvent(ev);
  };
  let deck;
  return Promise.resolve(m.M.activate()).then(settle).then(slidesDeck).then(function (buf) {
    deck = buf;
    m.w.JSZip = require("../jszip.min.js");
    m.w.CPL_REMEDIATE = require("../library_remediate.js");
    m.w.URL.createObjectURL = function () { return "blob:pic"; };
    m.w.URL.revokeObjectURL = function () {};
    drop("20261030_Agenda.pptx", deck);
    const ask = doc.getElementById("lc-notes");
    check("(18) a dropped deck asks about its speaker notes, keeping them by default", !!ask && /does the deck have notes you want to keep/.test(ask.textContent) &&
      doc.getElementById("lc-notes-keep").checked && /Keep my notes and add Claude's script below them/.test(ask.textContent) && /Replace my notes with Claude's script/.test(ask.textContent) &&
      /never ask for one on a deck that shows a student's record/.test(ask.textContent));
    // As background, the choice rides in the brief to the session that makes the new deck.
    doc.getElementById("lc-notes-replace").checked = true;
    doc.getElementById("lc-notes-replace").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    doc.getElementById("lc-use-background").checked = true;
    doc.getElementById("lc-use-background").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    doc.getElementById("lc-instr").value = "A deck for the webinar from this one";
    click(m.w, doc.getElementById("lib-go"));
    check("(18) as background, the brief says what to do with the source deck's notes", !!doc.getElementById("ls-shape") &&
      doc.getElementById("ls-shape").value === "The Chancellor's Office template, with a speaker script in each slide's notes in place of the source deck's notes", doc.getElementById("ls-shape") && doc.getElementById("ls-shape").value);
    click(m.w, m.root.querySelector("[data-startcancel]"));
    // A document is asked nothing about notes.
    drop("20261030_Memo.docx", deck);
    check("(18) a document is not asked about speaker notes", !doc.getElementById("lc-notes"));
    // Remediate with a script below the notes.
    drop("20261030_Agenda.pptx", deck);
    doc.getElementById("lc-autodraft").checked = false;
    doc.getElementById("lc-autodraft").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    doc.getElementById("lc-notes-below").checked = true;
    doc.getElementById("lc-notes-below").dispatchEvent(new m.w.Event("change", { bubbles: true }));
    click(m.w, doc.getElementById("lib-go"));
    const ready = function (n) { return scriptCalls.length >= 3 && doc.querySelector('[data-remscript="3"]') && doc.querySelector('[data-remscript="3"]').value || n <= 0 ? settle() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return ready(n - 1); }); };
    return ready(300);
  }).then(function () {
    const sec = doc.querySelector(".lib-remnotes");
    check("(18) the report holds a script for each slide, said to go below the notes", !!sec && /Speaker notes: Claude's script below your notes \(3\)/.test(sec.textContent) && sec.querySelectorAll("[data-remscript]").length === 3, sec && sec.textContent.slice(0, 200));
    if (!sec) return;
    const c3 = scriptCalls.filter(function (c) { return c.body.slide === 3; })[0] || { body: {}, headers: {} };
    check("(18) each slide goes to slide-script-draft with the team phrase, its number, its words and the mode", scriptCalls.length === 3 && c3.headers["x-team-pass"] === "p" && c3.body.of === 3 &&
      c3.body.words === "Questions?" && c3.body.mode === "below" && c3.body.deck === "Agenda" && c3.body.title === "Questions?", JSON.stringify(c3.body));
    check("(18) each script lands in its box, its slide drawn beside it", doc.querySelector('[data-remscript="1"]').value === "On slide 1 we cover The Summit's agenda." &&
      !!doc.querySelector("#lib-remnote-1 .lib-remside .lib-remslide") && /Redraft the script/.test(doc.querySelector("#lib-remnote-1").textContent));
    const box = doc.querySelector('[data-remscript="2"]');
    box.value = "My own script."; box.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    check("(18) a person's edit is the script the download writes", m.M._state.rem.scripts[2] === "My own script." && m.M._state.rem.touched === true);
    click(m.w, doc.querySelector('[data-remscriptai="2"]'));
    return settle().then(settle).then(function () {
      check("(18) Redraft asks Claude again for that slide, with the title drafted for its blank title box", scriptCalls.length === 4 && scriptCalls[3].body.slide === 2 && doc.querySelector('[data-remscript="2"]').value === "On slide 2 we cover Metric:." && scriptCalls[3].body.title === "Metric:", doc.querySelector('[data-remscript="2"]').value);
    });
  });
});

// ── (19) Revise and remediate from the one box (Sam, 2026-10-29; mockup Version 21) ──
// "could be as simple as choosing an existing item in the drop box". Sam's ELL revision
// never reached its record: Regenerate's box took 4,000 characters, the column takes 600,
// and the refusal printed far above the card. The box now finds the piece (picked by a
// label naming its kind, its link pasted, or a page named for it dropped), keeps long
// instructions whole as a document, reads a Word file's words, and holds Edit, a new
// version and background in the same place.
block("(19)", function () {
  const writes = [];
  const rows = JSON.parse(JSON.stringify(PROJ_ROWS));
  rows[0].sources = [{ title: "ELL IET Ideas", url: "https://claude.ai/artifact/x", text: null, added_by: "Sam", added_on: "2026-10-23" }];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method && init.method !== "GET") { writes.push({ url: url, body: JSON.parse(init.body || "{}") }); return response(200, [{}]); }
    return response(200, rows);
  } });
  const JSZip = require("../jszip.min.js");
  m.w.JSZip = JSZip;
  const doc = m.w.document;
  const drop = function (file) {
    const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { files: [file] } });
    doc.getElementById("lib-drop").dispatchEvent(ev);
  };
  const type = function (id, v) { const n = doc.getElementById(id); n.value = v; n.dispatchEvent(new m.w.Event("input", { bubbles: true })); };
  const choose = function (v) { const n = doc.getElementById("lc-pu-" + v); n.checked = true; n.dispatchEvent(new m.w.Event("change", { bubbles: true })); };
  const box = function () { return doc.getElementById("lib-drop"); };
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const opts = Array.prototype.map.call(doc.querySelectorAll("#lib-pieces option"), function (o) { return o.value; });
    check("(19) ⭐ the picker names each piece's kind, so the visual and its document read apart",
      opts.indexOf("ELL IET CPL Starting Points (Visual, Version 2)") >= 0 && opts.indexOf("ELL IET CPL Ideas (Document)") >= 0, JSON.stringify(opts));
    type("lc-piece", "ELL IET CPL Starting Points (Visual, Version 2)");
    check("(19) choosing one picks it at Revise and remediate, its documents listed, the picker put away",
      /Already in the Library/.test(box().textContent) && doc.getElementById("lc-pu-revise").checked &&
      /ELL IET Ideas/.test(box().querySelector(".lib-srcs").textContent) && !doc.getElementById("lc-piece"));
    check("(19) the box offers four things to do with it", ["revise", "details", "version", "background"].every(function (v) { return !!doc.getElementById("lc-pu-" + v); }));
    check("(19) a public piece's draft waits for Replace the public copy, and the box asks nothing about it",
      /the public copy stays until you press Replace the public copy/.test(box().textContent) && !box().querySelector("select"));
    click(m.w, box().querySelector("[data-unpiece]"));
    check("(19) Clear lets the piece go and gives the picker back", !doc.getElementById("lc-pu-revise") && !!doc.getElementById("lc-piece"));
    type("lc-link", "https://cpl-initiative.github.io/cpl-project-tracker/library/ell-iet/");
    check("(19) pasting a piece's own link picks it, and says so",
      !!doc.getElementById("lc-pu-revise") && /This is ELL IET CPL Starting Points, already in the Library/.test(m.root.textContent) && doc.getElementById("lc-link").value === "");
    click(m.w, box().querySelector("[data-unpiece]"));
    drop({ name: "20261023_ELL_IET_CPL_Starting_Points_2.html", text: function () { return Promise.resolve("<html></html>"); } });
    check("(19) dropping the page named for a piece picks it, rather than starting a second record",
      /ELL IET CPL Starting Points/.test((box().querySelector(".lib-piecepick") || {}).textContent || "") && !m.M._state.pick);
    const z = new JSZip();
    z.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      "<w:p><w:r><w:t>Add a table to each grantee card.</w:t></w:r></w:p>" +
      '<w:p><w:r><w:t xml:space="preserve">Name the </w:t></w:r><w:r><w:t>college courses.</w:t></w:r></w:p></w:body></w:document>');
    return z.generateAsync({ type: "uint8array" }).then(function (u8) {
      drop({ name: "ELL revision notes.docx", arrayBuffer: function () { return Promise.resolve(u8.buffer); } });
      // Wait on the read itself, never a fixed count of ticks (S522). JSZip unzips
      // over several event-loop turns; on a quiet machine it lands after exactly the
      // two settles this once waited, so a loaded CI shard (#2570, shard 3, three
      // runs) checked before it finished and failed this check and the next.
      const read = function (n) { return (m.M._state.src.pc || []).some(function (x) { return x.title === "ELL revision notes"; }) || n <= 0 ? settle() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return read(n - 1); }); };
      return read(300);
    });
  }).then(function () {
    const pc = m.M._state.src.pc || [];
    check("(19) ⭐ a Word file dropped on it is read here into a document to work from",
      /ELL revision notes/.test(box().querySelector(".lib-srcs").textContent) &&
      pc.some(function (x) { return x.title === "ELL revision notes" && x.text === "Add a table to each grantee card.\nName the college courses."; }), JSON.stringify(pc));
    const long = new Array(41).join("Revise each grantee card. ").trim();
    doc.getElementById("lc-instr").value = long;
    click(m.w, doc.getElementById("lib-go"));
    const written = function (n) { return writes.length || n <= 0 ? settle() : new Promise(function (r) { setTimeout(r, 10); }).then(function () { return written(n - 1); }); };
    return written(300).then(function () { return long; });
  }).then(function (long) {
    const w0 = writes[0] || { body: {}, url: "" }, b = w0.body || {};
    check("(19) ⭐ instructions past the 600-character column are kept whole as a document, and the note points there",
      /id=eq\.p1$/.test(w0.url) && long.length > 600 && (b.refresh_note || "").length <= 600 &&
      /The whole instructions are under Documents to work from\.$/.test(b.refresh_note || "") && b.sources.length === 3 &&
      b.sources.some(function (x) { return /^Instructions from Sam, /.test(x.title) && x.text === long; }) && b.regen.publish === "show", JSON.stringify(b).slice(0, 500));
    check("(19) the column's cap is the schema's", /coalesce\(char_length\(refresh_note\), 0\) <= 600/.test(SQL));
    click(m.w, m.root.querySelector('li.lib-piece [data-edittop="p2"]'));
    check("(19) Edit opens the box at Change its details, with the record's own form and no Start",
      doc.getElementById("lc-pu-details").checked && !!box().querySelector('form[data-editform="p2"]') && !doc.getElementById("lc-instr") && !doc.getElementById("lib-go"));
    choose("version");
    check("(19) File a new version opens the filing form for that same record", !!doc.getElementById("lib-addform") && m.M._state.formFor === "p2" && !doc.getElementById("lib-go"));
    choose("background");
    doc.getElementById("lc-instr").value = "A deck for the grantee webinar";
    click(m.w, doc.getElementById("lib-go"));
    const ls = m.M._state.src.ls || [];
    check("(19) Use it as background opens the brief with the piece's own link first",
      !!doc.getElementById("lib-startform") && ls.length >= 1 && ls[0].url === PROJ_ROWS[1].url && doc.getElementById("ls-kind").value === "deck", JSON.stringify(ls));
    check("(19) every row says Revise and remediate", rows.every(function (r) { return /Revise and remediate/.test((m.root.querySelector('[data-revise="' + r.id + '"]') || {}).textContent || ""); }));
  });
});

Promise.all(pending).then(function () {
  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nlibrary.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
});

// (12) The Knowledge Base fold and the knowledge rule (Sam, Open Asks Sheet 121 card 1,
// 2026-10-23: fold-rule). The portal is a static frame beside the root; the tab shows it
// on the Knowledge Base view and hides it otherwise. A piece whose substance is
// knowledge without a KB note is a Needs attention flag; a typed note says knowledge.
const KB_ROWS = [
  Object.assign({}, FOR_ROWS[1], { id: "k1", knowledge: true, kb_note: null }),
  Object.assign({}, FOR_ROWS[0], { id: "k2", knowledge: true, kb_note: "methodology/cpl-opportunity-pages.md" }),
  Object.assign({}, FOR_ROWS[2], { id: "k3", knowledge: false, kb_note: null }),
  Object.assign({}, ROWS[4], { id: "k4" })
];
block("(12)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "Sam", fetch: function (url, init) {
    if (init && init.method) { writes.push({ url: url, body: JSON.parse(init.body) }); return response(201, [{ id: "new" }]); }
    if (/map_colleges/.test(url)) return response(200, MAP_NAMES);
    return response(200, KB_ROWS);
  } });
  const w = m.w, doc = w.document, M = m.M;
  const kb = doc.createElement("div"); kb.id = "library-kb"; kb.hidden = true; kb.innerHTML = '<iframe src="kb-portal/"></iframe>'; doc.body.appendChild(kb);
  check("(12) no hash means Pieces", M._viewFromHash() === "pieces");
  check("(12) a typed note says knowledge; otherwise the choice", M._knowledgeValue("", "a/note.md") === true && M._knowledgeValue("no", "") === false && M._knowledgeValue("yes", "") === true && M._knowledgeValue("", "") === null);
  check("(12) the flag reads a knowledge piece without a note, and only that",
    M._flagsOf(KB_ROWS[0]).indexOf("kb_note") >= 0 && M._flagsOf(KB_ROWS[1]).indexOf("kb_note") < 0 && M._flagsOf(KB_ROWS[2]).indexOf("kb_note") < 0 && M._flagsOf(KB_ROWS[3]).indexOf("kb_note") < 0);
  return Promise.resolve(M.activate()).then(settle).then(function () {
    check("(12) two views, Pieces pressed", m.root.querySelector('[data-view="pieces"]').getAttribute("aria-pressed") === "true" && m.root.querySelector('[data-view="kb"]').getAttribute("aria-pressed") === "false");
    check("(12) the portal stays hidden on Pieces", kb.hidden === true && !!m.root.querySelector("#lib-register"));
    const flag = m.root.querySelector('[data-flag="kb_note"]');
    check("(12) Needs attention counts the one knowledge piece without a note", !!flag && /^1/.test(flag.textContent.trim()) && /knowledge pieces with no KB note/.test(flag.textContent), flag && flag.textContent);
    click(w, m.root.querySelector('[data-view="kb"]'));
    check("(12) Knowledge Base shows the portal and hides the register", kb.hidden === false && !m.root.querySelector("#lib-register") && m.root.querySelector('[data-view="kb"]').getAttribute("aria-pressed") === "true");
    check("(12) the hash carries the view", /#library\/knowledge-base$/.test(w.location.hash), w.location.hash);
    click(w, m.root.querySelector('[data-view="pieces"]'));
    check("(12) back to Pieces hides the portal again", kb.hidden === true && !!m.root.querySelector("#lib-register") && w.location.hash === "#library");
    M._state.open.k1 = true; M._state.open.k2 = true; M._state.open.k3 = true; M.render();
    const t = function (id) { return doc.getElementById("lib-t-" + id).closest("article").textContent; };
    check("(12) a knowledge piece without a note says what to do", /Its substance is knowledge and no KB note links it yet/.test(t("k1")));
    check("(12) a knowledge piece links its note", /KB note/.test(t("k2")) && /methodology\/cpl-opportunity-pages\.md/.test(t("k2")));
    check("(12) a deck, film or data piece needs none", /no KB note needed/.test(t("k3")));
    M._state.open = { k1: true }; M.render();
    click(w, m.root.querySelector('[data-edittop="k1"]'));
    check("(12) Edit offers Knowledge and KB note", !!doc.getElementById("le-knowledge") && !!doc.getElementById("le-kbnote") && doc.getElementById("le-knowledge").value === "yes");
    doc.getElementById("le-kbnote").value = "reference/dsp-training.md";
    submit(m, 'form[data-editform="k1"]');
    return settle();
  }).then(function () {
    const e = writes.filter(function (x) { return /id=eq\.k1/.test(x.url); })[0];
    check("(12) Save writes the note and knowledge true", !!e && e.body.kb_note === "reference/dsp-training.md" && e.body.knowledge === true, e && JSON.stringify(e.body));
    openAdd(m);
    doc.getElementById("la-url").value = "https://studentrcc.sharepoint.com/x/deck.pptx";
    doc.getElementById("la-title").value = "A deck";
    doc.getElementById("la-knowledge").value = "no";
    submit(m, "#lib-addform");
    return settle();
  }).then(function () {
    const a = writes.filter(function (x) { return !/id=eq\./.test(x.url); })[0];
    check("(12) Add writes knowledge false and no note", !!a && a.body.knowledge === false && a.body.kb_note === null, a && JSON.stringify(a.body));
  });
});

// ── (20) SharePoint is closed to a session (Sam, 2026-11-01) ─────────────
// On the IACA request: "build in a note to the user that sharepoint is not currently
// accessible and offer instructions on what to do instead." The live case is a deck whose
// only file is on SharePoint, with no source to rebuild from and no document to read.
block("(20)", function () {
  const M = loadModule({ phrase: "p", author: "Sam", fetch: function () { return response(200, []); } }).M;
  const SP = "https://studentrcc.sharepoint.com/:p:/r/sites/MilitaryArticulationPlatform/Shared%20Documents/CCCCO/AI/CPLLibrary/IACA.pptx";
  const iaca = { title: "IACA", url: SP, rebuild_from: null, sources: [],
    regen: { publish: "show", requested_at: "2026-10-26T18:57:54.717Z", requested_by: "Crystal Nasio" } };
  check("(20) a request whose only file is on SharePoint is one a run cannot start", M._sharePointOnly(iaca) === true);
  check("(20) a source to rebuild from, a pasted text or a public link lets the run start",
    !M._sharePointOnly(Object.assign({}, iaca, { rebuild_from: "build.py" })) &&
    !M._sharePointOnly(Object.assign({}, iaca, { sources: [{ title: "x", url: null, text: "words" }] })) &&
    !M._sharePointOnly(Object.assign({}, iaca, { sources: [{ title: "x", url: "https://example.org/a.pdf", text: null }] })) &&
    !M._sharePointOnly(Object.assign({}, iaca, { url: "https://example.org/a.pdf" })));
  const w = M._regenWords(iaca);
  check("(20) ⭐ its card says SharePoint cannot be opened and what to do instead",
    /Rebuild requested by Crystal Nasio/.test(w) && /cannot open yet/.test(w) && /Microsoft 365 connector/.test(w) &&
    /Download a copy of the file from SharePoint/.test(w) && /Create, Revise or Remediate a Document/.test(w) &&
    !/Copy the request starts it/.test(w), w);
  check("(20) the advice never sends a file to SharePoint for a session to read",
    !/Put it in SharePoint and paste/.test(SRC) && !/put it in SharePoint and paste/.test(SRC));
});
