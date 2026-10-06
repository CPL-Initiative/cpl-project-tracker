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
//   - Start a piece saves a Requested record with its brief, In development shows
//     it at its step and keeps it out of the register and out of Not filed, and
//     Copy the brief hands over the whole paste, filer command included.
//
// Run from repo root: `npm test` (or `node tests/library.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

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

// ── (1) Wiring, Rule 4, the schema's posture ─────────────────────────────
block("(1)", function () {
  check("(1) both HTMLs are byte-identical", DASH === INDEX, "Rule 4");
  ['data-tab="library"', 'id="library-root"', "onActivate('library'", "loadScript('library.js', 'CPL_LIBRARY'"].forEach(function (f) {
    check("(1) the shell carries " + f, DASH.indexOf(f) >= 0);
  });
  check("(1) the Library sits in the team tools group", /'knowledge-base', 'library'/.test(NAV));
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
    check("(3) figures to refresh are counted", /1\s*with figures to refresh/.test(t));
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
    click(m.w, m.root.querySelector("#lib-add"));
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
      click(m.w, m.root.querySelector('[data-edit="a5"]'));
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
      click(m.w, m.root.querySelector('[data-edit="a5"]'));
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
    check("(9) the brief carries the filer command for this record", /python3 scripts\/library_file\.py <file> --slug summit-table-sheet-x1/.test(bt), bt);
    check("(9) the brief ends with what a good result looks like", /A good result: [^\n]+$/.test(bt), bt);
    check("(9) an unset source asks for live data first", /fetch live data first/.test(bt));
    m.M._state.rows.filter(function (r) { return r.id === "a2"; })[0].versions = [{ label: "v2", date: "2026-10-05", filed_at: "2026-10-05T18:42:10Z", size: "16 MB", status: "Draft" }];
    m.M.render();
    click(m.w, m.root.querySelector('[data-toggle="a2"]'));
    const vt = (m.w.document.getElementById("lib-d-a2") || {}).textContent || "";
    check("(9) a filed version shows the time it was filed (Sam's call 8)", /5 October 2026, 18:42 UTC/.test(vt), vt.slice(0, 400));
    click(m.w, m.root.querySelector("#lib-start"));
    const doc = m.w.document;
    check("(9) Start a piece opens its form", !!doc.getElementById("lib-startform"));
    doc.getElementById("ls-kind").value = "spreadsheet";
    doc.getElementById("ls-title").value = "Summit table";
    doc.getElementById("lib-startform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    check("(9) a brief without what it must say writes nothing", writes.length === 0 && /Say what the piece must say/.test(m.root.textContent));
    check("(9) the typed title survives that repaint", doc.getElementById("ls-title").value === "Summit table");
    doc.getElementById("ls-say").value = "Awards by college";
    doc.getElementById("ls-due").value = "Friday";
    doc.getElementById("lib-startform").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const w0 = writes[0] || { body: {}, init: { headers: {} } };
    const b = w0.body.brief || {};
    check("(9) Save the brief POSTs one Requested record", w0.init.method === "POST" && /\/rest\/v1\/cpl_library$/.test(w0.url) && w0.body.status === "requested", JSON.stringify(w0.body));
    check("(9) it has no file yet", w0.body.home === "not_filed" && w0.body.url === null);
    check("(9) the brief keeps what it must say, the date needed, and who asked", b.say === "Awards by college" && b.due === "Friday" && b.requested_by === "Sam" && /^\d{4}-\d{2}-\d{2}$/.test(b.requested_on || ""), JSON.stringify(b));
    check("(9) a spreadsheet is a kind", w0.body.kind === "spreadsheet");
    check("(9) For defaults to the team", w0.body.seen_by === "team");
    check("(9) the write carries the team phrase", w0.init.headers["x-team-pass"] === "p");
    check("(9) the saved brief opens for copying", m.M._state.briefShown.new1 === true && /Saved as Requested/.test(m.root.textContent));
  });
});

// ── (10) The schema takes the new kind, the new status and the brief ─────
block("(10)", function () {
  check("(10) kind accepts spreadsheet", /add constraint cpl_library_kind_ck\s+check \(kind in \('deck', 'film', 'document', 'spreadsheet'\)\)/.test(SQL));
  check("(10) status accepts requested", /add constraint cpl_library_status_ck\s+check \(status is null or status in \('requested', 'draft', 'approved', 'presented'\)\)/.test(SQL));
  check("(10) the brief is one bounded jsonb object", /add column if not exists brief jsonb/.test(SQL) && /jsonb_typeof\(brief\) = 'object'/.test(SQL));
  const M = loadModule({}).M;
  check("(10) a Requested record is in development, an approved one is not",
    M._isDev({ status: "requested" }) && M._isDev({ status: "draft", brief: {} }) && !M._isDev({ status: "approved", brief: {} }) && !M._isDev({ status: "draft" }));
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
