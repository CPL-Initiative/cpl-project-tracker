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
//   (a) when the table answers, the selector lists the table's programs, never the
//       file's: before this change the public saw the file's unchecked pilot programs
//       whatever the table allowed (fails on the old file);
//   (b) a signed-out page reads with the anon key; a reviewer's fresh session reads
//       with the reviewer's token, and an unchecked record says so in the selector;
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
const recordOptions = (sel) => [...sel.querySelectorAll("optgroup")].filter((g) => g.label === "Catalog records, Beta draft")
  .flatMap((g) => [...g.querySelectorAll("option")]);
const change = (w, s, v) => { s.value = v; s.dispatchEvent(new w.Event("change", { bubbles: true })); };
function pickRecord(w, root, title) {
  const sel = root.querySelector("select.cplpw-select");
  const opt = recordOptions(sel).find((o) => o.textContent.indexOf(title) >= 0);
  if (opt) change(w, sel, opt.value);
  return opt;
}

(async () => {
  // ── (a) + (b) signed out: the public list is the table's checked programs ──
  {
    const f = tableStub({ anonIndex: [T1], reviewerIndex: [T1, T2] });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const opts = recordOptions(root.querySelector("select.cplpw-select")).map((o) => o.textContent);
    check("(a) the selector lists the table's programs", opts.length === 1 && /Norco College — Table Program One/.test(opts[0]), opts);
    check("(a) and none of the pilot file's", !opts.some((t) => t.indexOf(uncheckedFile.title) >= 0 || t.indexOf(checkedFile.title) >= 0), opts);
    check("(a) a checked program carries no mark", !/not yet checked/.test(opts[0] || "x"), opts[0]);
    const listCall = f.calls.find((c) => /program_requirement_records\?select=/.test(c.url) && !/college=eq/.test(c.url));
    check("(b) a signed-out page reads the list with the anon key", !!listCall && !listCall.reviewer, listCall && listCall.auth);
    check("(b) the list read asks for the light columns only", !!listCall && !/record|display/.test(listCall.url.split("select=")[1].split("&")[0]), listCall && listCall.url);
  }

  // ── (b) a reviewer: every record, the unchecked one marked ──
  {
    const session = { current: { email: "reviewer@example.org", access_token: "user-token" } };
    const f = tableStub({ anonIndex: [T1], reviewerIndex: [T1, T2] });
    const w = freshWindow(f, session);
    w.CPL_PATHWAYS_TAB.activate();
    await settle();
    const root = w.document.getElementById("cpl-pathways-root");
    const opts = recordOptions(root.querySelector("select.cplpw-select")).map((o) => o.textContent);
    check("(b) a reviewer reads with the session's token", f.calls.some((c) => c.reviewer && /program_requirement_records/.test(c.url)));
    check("(b) a reviewer sees every record", opts.length === 2, opts);
    check("(b) an unchecked record says so", opts.some((t) => /Table Program Two/.test(t) && /\(not yet checked\)$/.test(t)), opts);
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
    const rec = f.calls.slice(before).filter((c) => /college=eq\./.test(c.url));
    check("(c) one record read, by college and control number", rec.length === 1
      && /college=eq\.Long%20Beach%20City%20College/.test(rec[0].url) && /control_number=eq\.90002/.test(rec[0].url), rec.map((c) => c.url));
    check("(c) it asks for the record and its display", rec.length === 1 && /record/.test(rec[0].url) && /display/.test(rec[0].url));
    const card = root.querySelector(".cplpw-rprog");
    check("(c) the record renders", !!card && /Table Program Two/.test(card.textContent));
    check("(c) the row's checked wins over the build's copy (built checked, row unchecked)",
      !!card && /Not yet checked/.test(card.textContent) && !/Checked record/.test(card.textContent), card && card.textContent.slice(0, 200));
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
    const opts = recordOptions(root.querySelector("select.cplpw-select"));
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
    const sel = root.querySelector("select.cplpw-select");
    change(w, sel, sel.options[0].value);
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
    pickRecord(w, root, "Table Program One");
    await settle();
    check("(g) signed out: one record listed", recordOptions(root.querySelector("select.cplpw-select")).length === 1);
    session.current = { email: "reviewer@example.org", access_token: "user-token" };
    const n = f.calls.length;
    w.dispatchEvent(new w.CustomEvent("cpl-session-changed"));
    await settle(10);
    const sel = root.querySelector("select.cplpw-select");
    check("(g) signing in re-reads the list as the reviewer", f.calls.slice(n).some((c) => c.reviewer && /program_requirement_records\?select=college,control_number,program_title/.test(c.url)));
    check("(g) and lists every record", recordOptions(sel).length === 2);
    check("(g) the pathway shown stays", /Table Program One/.test((sel.options[sel.selectedIndex] || {}).textContent || "")
      && !!root.querySelector(".cplpw-rprog") && /Table Program One/.test(root.querySelector(".cplpw-rprog").textContent));
    check("(g) the record is read again under the new session", f.calls.slice(n).some((c) => /control_number=eq\.90001/.test(c.url) && c.reviewer));
  }

  // ── (h) the tab never waits on the table ──
  {
    const indexHold = [];
    const f = tableStub({ anonIndex: [T1], indexHold });
    const w = freshWindow(f);
    w.CPL_PATHWAYS_TAB.activate();
    const root = w.document.getElementById("cpl-pathways-root");
    check("(h) the tab renders before the list answers", !!root.querySelector("select.cplpw-select"));
    const sel0 = root.querySelector("select.cplpw-select");
    check("(h) meanwhile the file's programs stand in", recordOptions(sel0).length === FILE.length);
    // the reader moves to the second pathway before the list lands
    const second = sel0.options[1] ? sel0.options[1].value : "";
    const secondText = sel0.options[1] ? sel0.options[1].textContent : "";
    change(w, sel0, second);
    await settle();
    indexHold.forEach((go) => go());
    await settle(10);
    const sel = root.querySelector("select.cplpw-select");
    check("(h) the list, once landed, replaces the file's", recordOptions(sel).length === 1);
    check("(h) and the reader's pick stays", (sel.options[sel.selectedIndex] || {}).textContent === secondText, (sel.options[sel.selectedIndex] || {}).textContent);
  }

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " CPL Pathways table-read checks passed");
  if (failed) process.exit(1);
})();
