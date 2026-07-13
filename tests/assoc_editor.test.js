// assoc_editor.js — Activity↔Project association editor popover (jsdom).
//
// Reproduces + guards the 2026-07-13 bug: the "Contributes to which
// Activities?" editor on the Annual Workplan Goals tab (and the Dashboard
// project cards — same shared popover) got stuck in a permanent
//   Save failed — HTTP 409: {"code":"23505", ... "workplan_activity_associations_pkey"}
// loop. Root cause: the cell's data-assoc is a STATIC snapshot baked at
// dashboard-generation time. When a save landed the INSERTs but reported
// failure (partial/transient), the cell kept its stale snapshot, so every
// retry recomputed the same `toAdd` and re-POSTed rows that now exist →
// duplicate-key 409 forever. Fix: a 409 duplicate-key (Postgres 23505) on the
// association PK is the exact end-state an "add" wants, so it's treated as
// success — the curator is unstuck and the cell converges.
//
// Also exercises the everyday flows so a future refactor can't silently break
// them: happy add, remove (un-check), primary change, the empty-selection
// guard, backfilled-opens-empty, anonymous read-only, the delegated open, and
// a loud 403 on a genuine RLS denial.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("assoc_editor.js", "utf8");
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 5; i++) await tick(); }

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://cpl-initiative.github.io/cpl-project-tracker/",
    runScripts: "dangerously",
  });
  const w = dom.window;
  if (opts.signedIn !== false) {
    w.sessionStorage.setItem("cpl_sb",
      JSON.stringify({ access_token: "aaa.bbb.ccc", email: "MAP@rccd.edu" }));
  }
  w.__fetches = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const method = (init.method || "GET").toUpperCase();
    w.__fetches.push({ url, method, init });
    // is_primary column probe → column present
    if (method === "GET" && /select=is_primary/.test(url)) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve([{ is_primary: false }]),
        text: () => Promise.resolve(""),
      });
    }
    if (method === "POST") {
      const st = opts.postStatus || 201;
      const body = opts.postBody || "";
      return Promise.resolve({
        ok: st < 400, status: st,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve(body),
      });
    }
    // DELETE / PATCH — non-empty representation (a real landed write)
    const st = opts.writeStatus || 200;
    return Promise.resolve({
      ok: st < 400, status: st,
      json: () => Promise.resolve([{ project_id: "1.1", activity_id: "1" }]),
      text: () => Promise.resolve(""),
    });
  };
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  // jsdom leaves readyState "loading" while the injected script runs, so the
  // module defers init() (delegated listener + affordance paint) to
  // DOMContentLoaded — fire it, as the real page load does.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}

function makeCell(w, opts) {
  opts = opts || {};
  const acts = opts.activities || [
    { id: "1", name: "Activity 1" }, { id: "2", name: "Activity 2" },
    { id: "3", name: "Activity 3" }, { id: "4", name: "Activity 4" },
    { id: "5", name: "Activity 5" },
  ];
  const assoc = opts.assoc || [{ activity_id: "1", is_primary: true }];
  const pid = opts.pid || "1.1";
  const cell = w.document.createElement("div");
  cell.className = "wpg-assoc-cell";
  cell.setAttribute("data-assoc-edit", "1");
  cell.setAttribute("data-pid", pid);
  cell.setAttribute("data-assoc", JSON.stringify(assoc));
  cell.setAttribute("data-assoc-backfilled", opts.backfilled ? "1" : "0");
  cell.setAttribute("data-activities", JSON.stringify(acts));
  const lead = w.document.createElement("span");
  lead.textContent = "Contributes to:";
  cell.appendChild(lead);
  assoc.forEach(function (r) {
    const chip = w.document.createElement("span");
    chip.className = "wpg-act-chip" + (r.is_primary ? " wpg-act-chip-primary" : "");
    chip.textContent = (r.is_primary ? "★ " : "") + "Activity " + r.activity_id;
    cell.appendChild(chip);
  });
  const hint = w.document.createElement("span");
  hint.className = "wpg-assoc-edit-hint";
  hint.textContent = " ✎";
  cell.appendChild(hint);
  w.document.body.appendChild(cell);
  return cell;
}

function boxes(w, pid) {
  const m = {};
  const pre = "assoc-cb-" + pid + "-";
  w.document.querySelectorAll('.wpg-assoc-pop input[type="checkbox"]').forEach(function (cb) {
    m[cb.id.slice(pre.length)] = cb;
  });
  return m;
}
function radios(w) {
  const m = {};
  w.document.querySelectorAll('.wpg-assoc-pop input[type="radio"]').forEach(function (rd) {
    m[rd.value] = rd;
  });
  return m;
}
function saveBtn(w) { return w.document.querySelector(".wpg-assoc-save"); }
function statusText(w) {
  const s = w.document.querySelector(".wpg-assoc-pop-status");
  return s ? s.textContent : "";
}

(async function () {
  // ── (1) THE BUG: stale snapshot → re-POST → 409 dup-key is swallowed ──
  {
    const dupBody = '{"code":"23505","details":null,"hint":null,"message":'
      + '"duplicate key value violates unique constraint '
      + '\\"workplan_activity_associations_pkey\\""}';
    const w = makeWin({ postStatus: 409, postBody: dupBody });
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    const cb = boxes(w, "1.1");
    ["2", "3", "4", "5"].forEach(function (a) { cb[a].checked = true; });
    saveBtn(w).click();
    await settle();
    check("dup-409: 4 INSERTs attempted", w.__fetches.filter((f) => f.method === "POST").length === 4);
    check("dup-409: save SUCCEEDS despite every INSERT 409ing", !w.document.querySelector(".wpg-assoc-pop"));
    const rec = JSON.parse(cell.getAttribute("data-assoc"));
    check("dup-409: cell converges to all 5 associations", rec.length === 5);
    check("dup-409: 5 chips repainted", cell.querySelectorAll(".wpg-act-chip").length === 5);
    check("dup-409: activity 1 stays primary", (rec.find((r) => r.activity_id === "1") || {}).is_primary === true);
  }

  // ── (2) A genuine RLS denial (403) still fails LOUD (not swallowed) ──
  {
    const w = makeWin({ postStatus: 403, postBody: '{"message":"permission denied"}' });
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    boxes(w, "1.1")["2"].checked = true;
    saveBtn(w).click();
    await settle();
    check("403: popover stays open on failure", !!w.document.querySelector(".wpg-assoc-pop"));
    check("403: status surfaces 'Save failed'", /Save failed/.test(statusText(w)));
    check("403: cell NOT repainted (snapshot preserved)", JSON.parse(cell.getAttribute("data-assoc")).length === 1);
  }

  // ── (3) Happy add (201) repaints the new set ──
  {
    const w = makeWin({ postStatus: 201 });
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    boxes(w, "1.1")["3"].checked = true;
    saveBtn(w).click();
    await settle();
    check("add: one INSERT fired", w.__fetches.filter((f) => f.method === "POST").length === 1);
    check("add: save succeeds", !w.document.querySelector(".wpg-assoc-pop"));
    check("add: cell now has 2 associations", JSON.parse(cell.getAttribute("data-assoc")).length === 2);
  }

  // ── (4) Remove (un-check) fires a DELETE and shrinks the set ──
  {
    const w = makeWin({});
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }, { activity_id: "2", is_primary: false }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    boxes(w, "1.1")["2"].checked = false;
    saveBtn(w).click();
    await settle();
    check("remove: a DELETE fired", w.__fetches.some((f) => f.method === "DELETE"));
    check("remove: no INSERT fired", !w.__fetches.some((f) => f.method === "POST"));
    check("remove: cell down to 1 association", JSON.parse(cell.getAttribute("data-assoc")).length === 1);
  }

  // ── (5) Primary change PATCHes old-false + new-true ──
  {
    const w = makeWin({});
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }, { activity_id: "2", is_primary: false }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    const rd = radios(w);
    rd["1"].checked = false;
    rd["2"].checked = true;
    saveBtn(w).click();
    await settle();
    check("primary: 2 PATCHes fired (clear old + set new)", w.__fetches.filter((f) => f.method === "PATCH").length === 2);
    const rec = JSON.parse(cell.getAttribute("data-assoc"));
    check("primary: activity 2 is now primary, 1 is not",
      (rec.find((r) => r.activity_id === "2") || {}).is_primary === true
      && (rec.find((r) => r.activity_id === "1") || {}).is_primary === false);
  }

  // ── (6) Empty selection is blocked before any write ──
  {
    const w = makeWin({});
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }] });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    boxes(w, "1.1")["1"].checked = false;
    saveBtn(w).click();
    await settle();
    check("empty: blocked with a hint", /Pick at least one/.test(statusText(w)));
    check("empty: no write fired", w.__fetches.filter((f) => f.method !== "GET").length === 0);
    check("empty: popover stays open", !!w.document.querySelector(".wpg-assoc-pop"));
  }

  // ── (7) A backfilled (derived-guess) chip opens with NOTHING checked ──
  {
    const w = makeWin({});
    const cell = makeCell(w, { assoc: [{ activity_id: "1", is_primary: true }], backfilled: true });
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    const cb = boxes(w, "1.1");
    check("backfilled: opens with nothing pre-checked",
      Object.keys(cb).length === 5 && Object.keys(cb).every((a) => !cb[a].checked));
    check("backfilled: sub-note flags 'no link set yet'",
      /no link set yet/.test((w.document.querySelector(".wpg-assoc-pop-sub") || {}).textContent || ""));
  }

  // ── (8) Anonymous is read-only: no popover, isSignedIn false ──
  {
    const w = makeWin({ signedIn: false });
    const cell = makeCell(w, {});
    w.CPL_ASSOC_EDITOR.open(cell);
    await settle();
    check("anon: no popover opens", !w.document.querySelector(".wpg-assoc-pop"));
    check("anon: isSignedIn() === false", w.CPL_ASSOC_EDITOR.isSignedIn() === false);
  }

  // ── (9) Delegated click on the ✎ hint opens the shared popover ──
  {
    const w = makeWin({});
    const cell = makeCell(w, {});
    w.document.querySelector(".wpg-assoc-edit-hint").click();
    await settle();
    check("delegated: click opens exactly one popover", w.document.querySelectorAll(".wpg-assoc-pop").length === 1);
  }

  // ── (10) Source pins ──
  {
    const a = SRC;
    check("pin: 409 duplicate-key tolerated on the write path",
      /r\.status === 409 && \/23505\|duplicate key\/i\.test\(t\)/.test(a));
    check("pin: POST still return=minimal (Prefer unchanged — RLS 403 stays loud)",
      /method: "POST",\s*\n\s*headers: assocHeaders\(sess, "return=minimal"\)/.test(a));
    check("pin: DELETE/PATCH still request return=representation",
      /method: "DELETE",\s*\n\s*headers: assocHeaders\(sess, "return=representation"\)/.test(a)
      && /method: "PATCH",\s*\n\s*headers: assocHeaders\(sess, "return=representation"\)/.test(a));
    const h1 = fs.readFileSync("index.html", "utf8");
    const h2 = fs.readFileSync("CPL_Dashboard.html", "utf8");
    check("Rule 4: HTMLs identical", h1 === h2);
  }

  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error("FATAL", e); process.exit(1); });
