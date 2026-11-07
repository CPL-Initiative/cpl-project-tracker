// CPL Pathways reads its catalog records from program_requirement_records.
//
// Sam, Open Asks Sheet 65 card 2, 2026-10-11, in chat to S366: "Read from the table
// (Recommended)". CPL Pathways reads a program's record from the table when a reader
// opens it; the table's read policy decides who sees what (the public reads checked
// records, a reviewer signed in with the magic link reads every record, an unchecked
// one says so); the pilot file (cpl_pathways_roep_data.js) stays as the offline tier,
// and no file is written per college.
//
// Guards the failure modes:
//   (a) when the table answers, the colleges' Lists hold the table's programs, never the
//       file's: before this change the public saw the file's unchecked pilot programs
//       whatever the table allowed (fails on the old file);
//   (b) a signed-out page reads with the anon key; a reviewer's fresh session reads
//       with the reviewer's token, and an unchecked record reads Beta draft in its List;
//   (c) opening a program reads that one record, by college and control number, and
//       renders it; the row's `checked` wins over the display build's copy;
//   (d) a failed record read shows the file's copy and says why, or, with no copy,
//       says the read failed (never a blank or a zero);
//   (e) a failed list read falls back to the file's programs and says so;
//   (f) a later pick wins over a slower earlier read;
//   (g) a reviewer signing in re-reads the list and keeps the pathway shown, and the
//       records already read are dropped;
//   (h) the tab never waits on the table: it renders at once, and a list that lands
//       later re-renders it with the reader's pick kept.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

const ANON = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.exec(SRC)[0];
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle(n) { for (let i = 0; i < (n || 6); i++) await tick(); }

function freshWindow(fetchImpl, session) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  w.eval(DATA);
  w.eval(ROEP);
  w.Element.prototype.scrollIntoView = function () {};
  if (session) {
    w.CPL_SESSION = {
      get: () => session.current,
      isFresh: (s) => !!(s && s.access_token),
      ensureFresh: () => Promise.resolve(session.current),
      authHeaders: (extra) => Object.assign({ apikey: ANON, Authorization: "Bearer " + ((session.current && session.current.access_token) || ANON) }, extra || {}),
    };
  }
  if (fetchImpl) w.fetch = fetchImpl;
  w.eval(SRC);
  require("./cpl_pathways_drive.js").withList(w);
  return w;
}

const FILE = (() => {
  const w = new JSDOM("", { runScripts: "outside-only" }).window;
  w.eval(ROEP);
  return w.CPL_PATHWAYS_ROEP.programs;
})();
const checkedFile = FILE.find((p) => p.display.checks.checked);
const uncheckedFile = FILE.find((p) => !p.display.checks.checked);
// Two programs only the table holds: one checked, one not.
const T1 = { college: "Norco College", control_number: "90001", program_title: "Table Program One", award: "Associate in Science", checked: true };
const T2 = { college: "Long Beach City College", control_number: "90002", program_title: "Table Program Two", award: "Certificate of Achievement", checked: false };
function fullRow(idx, base) {
  return Object.assign({}, idx, {
    catalog_year: base.catalog_year, source_url: base.source_url, measure: base.measure,
    record: base.record, display: JSON.parse(JSON.stringify(base.display)),
  });
}

// A table stub: the list read answers per role, the record read answers by key.
function tableStub(opts) {
  const calls = [];
  const o = opts || {};
  function reply(body, status) {
    return Promise.resolve({ ok: !status || status < 400, status: status || 200, json: () => Promise.resolve(body) });
  }
  const f = function (url, init) {
    const auth = (init && init.headers && init.headers.Authorization) || "";
    const reviewer = auth !== "Bearer " + ANON;
    calls.push({ url, auth, reviewer });
    if (/program_source_registry/.test(url)) return reply([{ college: "Norco College", catalog_platform: "courseleaf" }]);
    // The college's own read for its List figures and status line (no control number): answered empty.
    if (/program_requirement_records/.test(url) && /college=eq\./.test(url) && !/control_number=eq\./.test(url)) return reply([]);
    if (/program_requirement_records/.test(url) && /college=eq\./.test(url)) {
      if (o.recordFail) return reply({ message: "boom" }, 503);
      if (o.hold) return new Promise((res) => o.hold.push(() => res({ ok: true, status: 200, json: () => Promise.resolve(o.rowFor(url)) })));
      return reply(o.rowFor ? o.rowFor(url) : []);
    }
    if (/program_requirement_records/.test(url)) {
      if (o.indexFail) return reply({ message: "boom" }, 500);
      const rows = reviewer ? (o.reviewerIndex || []) : (o.anonIndex || []);
      if (o.indexHold) return new Promise((res) => o.indexHold.push(() => res({ ok: true, status: 200, json: () => Promise.resolve(rows) })));
      return reply(rows);
    }
    return reply([]);
  };
  f.calls = calls;
  return f;
}
// The new format (Sam, 2026-11-06: "Require college first"): a record is listed in its college's List and opened by
// its title. recordTexts reads each college's catalog-record rows as the old selector's options read
// ("<college> — <title>", and " (not yet confirmed)" for a Beta draft).
const DRIVE = require("./cpl_pathways_drive.js");
const COLLEGES = () => [...new Set(FILE.map((p) => p.college).concat([T1.college, T2.college]))];
function recordTexts(w, root, colleges) {
  const out = [];
  (colleges || COLLEGES()).forEach((c) => {
    if (!DRIVE.chooseCollege(w, root, c)) return;
    DRIVE.titleButtons(root).forEach((b) => {
      const rec = b.closest("tr").lastChild.textContent.trim();
      if (rec === "Confirmed" || rec === "Beta draft") out.push(c + " — " + b.textContent + (rec === "Beta draft" ? " (not yet confirmed)" : ""));
    });
  });
  return out;
}
function pickRecord(w, root, title) {
  if (DRIVE.openPathway(w, root, null, title)) return true;
  for (const c of COLLEGES()) if (DRIVE.openPathway(w, root, c, title)) return true;
  return false;
}

(async () => {
  // ── (a) + (b) signed out: the public list is the table's checked programs ──
  {
    const f = tableStub({ anonIndex: [T1], reviewerIndex: [T1, T2] });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const opts = recordTexts(w, root);
    check("(a) the Lists hold the table's programs", opts.length === 1 && /Norco College — Table Program One/.test(opts[0]), opts);
    check("(a) and none of the pilot file's", !opts.some((t) => t.indexOf(uncheckedFile.title) >= 0 || t.indexOf(checkedFile.title) >= 0), opts);
    check("(a) a checked program carries no mark", !/not yet confirmed/.test(opts[0] || "x"), opts[0]);
    const listCall = f.calls.find((c) => /program_requirement_records\?select=/.test(c.url) && !/college=eq/.test(c.url));
    check("(b) a signed-out page reads the list with the anon key", !!listCall && !listCall.reviewer, listCall && listCall.auth);
    // The light columns plus each program's four counts (SkyHarbor, 2026-11-06: the statewide view's figures), never the
  // record or the whole display build.
  check("(b) the list read asks for the light columns and the counts only", !!listCall && (function (sel) {
    return sel === "college,control_number,program_title,award,checked,counts:display->counts" && !/(^|,)(record|display)(,|$)/.test(sel);
  })(listCall.url.split("select=")[1].split("&")[0]), listCall && listCall.url);
  }

  // ── (b) a reviewer: every record, the unchecked one marked ──
  {
    const session = { current: { email: "reviewer@example.org", access_token: "user-token" } };
    const f = tableStub({ anonIndex: [T1], reviewerIndex: [T1, T2] });
    const w = freshWindow(f, session);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const opts = recordTexts(w, root);
    check("(b) a reviewer reads with the session's token", f.calls.some((c) => c.reviewer && /program_requirement_records/.test(c.url)));
    check("(b) a reviewer sees every record", opts.length === 2, opts);
    check("(b) an unchecked record says so", opts.some((t) => /Table Program Two/.test(t) && /\(not yet confirmed\)$/.test(t)), opts);
  }

  // ── (c) opening a program reads that one record ──
  {
    const session = { current: { email: "reviewer@example.org", access_token: "user-token" } };
    const f = tableStub({
      anonIndex: [T1], reviewerIndex: [T1, T2],
      rowFor: (url) => (/control_number=eq\.90002/.test(url) ? [fullRow(T2, checkedFile)] : [fullRow(T1, uncheckedFile)]),
    });
    const w = freshWindow(f, session);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const before = f.calls.length;
    pickRecord(w, root, "Table Program Two");
    check("(c) the page says it is reading", /Reading Table Program Two/.test(root.textContent));
    await settle();
    const rec = f.calls.slice(before).filter((c) => /control_number=eq\./.test(c.url));
    check("(c) one record read, by college and control number", rec.length === 1
      && /college=eq\.Long%20Beach%20City%20College/.test(rec[0].url) && /control_number=eq\.90002/.test(rec[0].url), rec.map((c) => c.url));
    check("(c) it asks for the record and its display", rec.length === 1 && /record/.test(rec[0].url) && /display/.test(rec[0].url));
    const card = root.querySelector(".cplpw-rprog");
    check("(c) the record renders", !!card && /Table Program Two/.test(card.textContent));
    check("(c) the row's checked wins over the build's copy (built checked, row unchecked)",
      !!card && /Not yet confirmed/.test(card.textContent) && !/Checked record/.test(card.textContent), card && card.textContent.slice(0, 200));
    // opening it again reads nothing
    const n = f.calls.length;
    pickRecord(w, root, "Table Program One");
    await settle();
    pickRecord(w, root, "Table Program Two");
    await settle();
    check("(c) a record read once is not read again", f.calls.filter((c, i) => i >= n && /control_number=eq\.90002/.test(c.url)).length === 0);
    const one = root.querySelector(".cplpw-rprog");
    pickRecord(w, root, "Table Program One");
    await settle();
    const card1 = root.querySelector(".cplpw-rprog");
    check("(c) a checked row reads as checked though its build said not", !!card1 && /Checked record/.test(card1.textContent));
    check("(c) the provenance names the registry's platform", !!card1 && /CourseLeaf reading procedure/.test(card1.textContent), card1 && card1.textContent.slice(0, 300));
    void one;
  }

  // ── (d) a failed record read ──
  {
    const fileRow = { college: checkedFile.college, control_number: checkedFile.control_number, program_title: checkedFile.title, award: checkedFile.award, checked: true };
    const f = tableStub({ anonIndex: [fileRow, T1], recordFail: true });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    pickRecord(w, root, checkedFile.title);
    await settle();
    const note = root.querySelector(".cplpw-roep .cplpw-note");
    check("(d) with a file copy, the copy renders", !!root.querySelector(".cplpw-rprog"));
    check("(d) and the note says the table failed and names the build", !!note && /table could not be read \(program_requirement_records answered 503\)/.test(note.textContent)
      && /pilot file, display build/.test(note.textContent), note && note.textContent);
    pickRecord(w, root, "Table Program One");
    await settle();
    check("(d) with no copy, the page says the read failed", /record could not be read just now \(program_requirement_records answered 503\)/.test(root.textContent)
      && !root.querySelector(".cplpw-rprog"));
  }

  // ── (e) a failed list read ──
  {
    const f = tableStub({ indexFail: true });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const opts = recordTexts(w, root);
    check("(e) the file's programs stand in", opts.length === FILE.length, opts.length + " of " + FILE.length);
    const note = root.querySelector(".cplpw-rnote");
    check("(e) and the page says why", !!note && /pilot file for now: the table could not be read \(program_requirement_records answered 500\)/.test(note.textContent), note && note.textContent);
    check("(e) once", root.querySelectorAll(".cplpw-rnote").length === 1);
  }

  // ── (e) with no pilot file either, the page still says so ──
  {
    const f = tableStub({ indexFail: true });
    const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
    const w = dom.window;
    w.eval(DATA);
    w.Element.prototype.scrollIntoView = function () {};
    w.fetch = f;
    w.eval(SRC);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const note = w.document.querySelector(".cplpw-rnote");
    check("(e) no file and no table: the page says the records could not be read", !!note
      && /Catalog records could not be read just now \(program_requirement_records answered 500\)/.test(note.textContent), note && note.textContent);
  }

  // ── (f) a later pick wins over a slower earlier read ──
  {
    const hold = [];
    const f = tableStub({
      anonIndex: [T1, Object.assign({}, T2, { checked: true })], hold,
      rowFor: (url) => (/90002/.test(url) ? [fullRow(Object.assign({}, T2, { checked: true }), checkedFile)] : [fullRow(T1, checkedFile)]),
    });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    pickRecord(w, root, "Table Program One");
    pickRecord(w, root, "Table Program Two");
    check("(f) two reads in flight", hold.length === 2, hold.length);
    if (hold[1]) hold[1]();
    await settle();
    if (hold[0]) hold[0]();
    await settle();
    const card = root.querySelector(".cplpw-rprog");
    check("(f) the page shows the later pick", !!card && /Table Program Two/.test(card.textContent) && !/Table Program One/.test(card.textContent));
    // a record read in flight when the reader moves to a featured map never lands over it
    pickRecord(w, root, "Table Program One");
    const pending = hold.length;
    check("(f) a third read in flight", pending === 3, pending);
    DRIVE.openPathway(w, root, "Cerritos College", "Field Ironworker Supervisor");
    if (hold[2]) hold[2]();
    await settle();
    check("(f) a featured map picked meanwhile stays on screen", !root.querySelector(".cplpw-rprog") && !!root.querySelector(".cplpw-hero, .cplpw-ladder"),
      root.textContent.slice(0, 120));
  }

  // ── (g) a reviewer signing in ──
  {
    const session = { current: null };
    const f = tableStub({ anonIndex: [T1], reviewerIndex: [T1, T2], rowFor: () => [fullRow(T1, checkedFile)] });
    const w = freshWindow(f, session);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    check("(g) signed out: one record listed", recordTexts(w, root).length === 1);
    pickRecord(w, root, "Table Program One");
    await settle();
    session.current = { email: "reviewer@example.org", access_token: "user-token" };
    const n = f.calls.length;
    w.dispatchEvent(new w.CustomEvent("cpl-session-changed"));
    await settle(10);
    check("(g) signing in re-reads the list as the reviewer", f.calls.slice(n).some((c) => c.reviewer && /program_requirement_records\?select=college,control_number,program_title/.test(c.url)));
    check("(g) the pathway shown stays", !!root.querySelector(".cplpw-rprog") && /Table Program One/.test(root.querySelector(".cplpw-rprog").textContent));
    check("(g) the record is read again under the new session", f.calls.slice(n).some((c) => /control_number=eq\.90001/.test(c.url) && c.reviewer));
    check("(g) and the Lists hold every record", recordTexts(w, root).length === 2);
  }

  // ── (h) the tab never waits on the table ──
  {
    const indexHold = [];
    const f = tableStub({ anonIndex: [T1], indexHold });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    const root = w.document.getElementById("cpl-pathways-root");
    check("(h) the tab renders before the list answers", !!root.querySelector("select.cplpw-colsel"));
    check("(h) meanwhile the file's programs stand in", recordTexts(w, root).length === FILE.length);
    // the reader opens a featured map before the list lands
    DRIVE.openPathway(w, root, "Cerritos College", "Field Ironworker Supervisor");
    await settle();
    indexHold.forEach((go) => go());
    await settle(10);
    check("(h) and the reader's pick stays once the list lands", !!root.querySelector(".cplpw-path") && /Field Ironworker Supervisor/.test(root.querySelector(".cplpw-path").textContent));
    check("(h) the list, once landed, replaces the file's", recordTexts(w, root).length === 1);
  }

  // ── (i) every program arrives, in pages (2026-10-13) ──
  // PostgREST answers at most 1,000 rows a request: the one-shot list stopped at record
  // 1,000 of 2,840. The read pages under that cap, over its order, to the short page.
  {
    const many = [];
    for (let i = 0; i < 1300; i++) many.push({ college: "Norco College", control_number: String(50000 + i), program_title: "Paged Program " + i, award: "Associate in Science", checked: true });
    const ranges = [];
    const f = function (url, init) {
      const h = (init && init.headers) || {};
      const json = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
      if (/program_source_registry/.test(url)) return json([]);
      if (/program_requirement_records/.test(url) && !/college=eq\./.test(url)) {
        ranges.push({ range: h.Range, unit: h["Range-Unit"], url });
        const m = /^(\d+)-(\d+)$/.exec(h.Range || "");
        const from = m ? +m[1] : 0, to = m ? Math.min(+m[2], from + 999) : 999;
        return json(many.slice(from, to + 1));
      }
      return json([]);
    };
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle(20);
    const root = w.document.getElementById("cpl-pathways-root");
    DRIVE.chooseCollege(w, root, "Norco College");
    const nAll = root.querySelector(".cplpw-card-n").textContent;
    check("(i) all 1,300 programs reach the List, past the 1,000-row cap", nAll === "1,300", nAll);
    const fi = root.querySelector("#cplpwl-find"); fi.value = "Paged Program 1299"; fi.dispatchEvent(new w.Event("input", { bubbles: true }));
    check("(i) the last one included", DRIVE.listTitles(root).includes("Paged Program 1299"), DRIVE.listTitles(root));
    check("(i) each page asks for a range under the cap, over the stable order", ranges.length >= 3 && ranges.every((r) => {
      const m = /^(\d+)-(\d+)$/.exec(r.range || ""); return r.unit === "items" && m && (+m[2] - +m[1] + 1) <= 1000 && /order=college,control_number/.test(r.url); }),
      ranges.map((r) => r.range));
  }

  // ── (j) the pages after the first are read side by side (S448) ──
  // One after another, 17,439 records took 35 round trips. A short list still costs one.
  {
    const many = [];
    for (let i = 0; i < 2600; i++) many.push({ college: "Norco College", control_number: String(60000 + i), program_title: "Wave Program " + i, award: "Associate in Science", checked: true });
    let open = 0, most = 0, indexReads = 0;
    const f = function (url, init) {
      const h = (init && init.headers) || {};
      if (/program_source_registry/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      if (/program_requirement_records/.test(url) && !/college=eq\./.test(url)) {
        indexReads++; open++; most = Math.max(most, open);
        const m = /^(\d+)-(\d+)$/.exec(h.Range || "");
        const from = m ? +m[1] : 0, to = m ? +m[2] : 999;
        return new Promise((res) => setTimeout(() => { open--; res({ ok: true, status: 200, json: () => Promise.resolve(many.slice(from, to + 1)) }); }, 5));
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    };
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle(60);
    const root = w.document.getElementById("cpl-pathways-root");
    DRIVE.chooseCollege(w, root, "Norco College");
    const nAll = root.querySelector(".cplpw-card-n").textContent;
    const find = (q) => { const fi = root.querySelector("#cplpwl-find"); fi.value = q; fi.dispatchEvent(new w.Event("input", { bubbles: true })); return DRIVE.listTitles(root); };
    check("(j) all 2,600 programs arrive, the first and the last included", nAll === "2,600" && find("Wave Program 0").includes("Wave Program 0") && find("Wave Program 2599").includes("Wave Program 2599"), nAll);
    check("(j) the pages after the first are read side by side", most > 1, most);
    check("(j) and the read stops at the short page", indexReads <= 7, indexReads);
  }

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " CPL Pathways table-read checks passed");
  if (failed) process.exit(1);
})();
