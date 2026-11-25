// The Courses List's Rows control (the anchor page, step 2; Sam on the mock
// https://claude.ai/artifact/35uJsJ2ahLQ6XcrvfMS8YE, S725: "looks great, let's go with it"). Guards:
//   (1) the Courses view carries Rows: Common courses | Local courses, under their common course; Local is the default;
//   (2) Common courses lists one row per common course of today's reference, with its common subject labeled
//       (code and name), its local courses and colleges counted from the identity file;
//   (3) the address carries the choice: #coci-lookup/courses/common opens it, and choosing writes it;
//   (4) a common course's title opens the bottom bar: Local courses (its local courses), Common subject, History;
//   (5) the Browse filters count common courses; Holds one local course finds the single-course rows;
//   (6) a new visit to the tab drops the choice (tabs never remember a filter);
//   (7) the arrow keys move the choice; no raw hex in the new code.
// Run from repo root: `node tests/coci_list_common_rows.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + (ms || 5000); while (!fn() && Date.now() < end) await sleep(10); return fn(); }

const LOOKUP = { _built_at: "2026-07-09", colleges: ["American River College", "Rio Hondo College", "Cypress College"],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "", "", "ENGL M1001"],
    [1, "CCC2", "ENGL", "101", "Composition and Reading", 3, "C", "1501.00: English", "", "", "ENGL M1001"],
    [2, "CCC3", "ENGL", "100", "Freshman Composition", 4, "C", "1501.00: English", "", "", "ENGL M1001"],
    [0, "CCC4", "CARPT", "111", "Tool and Equipment Applications", 1.5, "C", "0952.10: Carpentry", "", "", "CNST M1009"],
    [1, "CCC6", "ESL", "010", "English Fundamentals", 0, "N", "4930.87: ESL", "", "", "ESOL M9168"]
  ] };
const MEMBERS = { generated_at: "2026-11-25 05:18", colleges: ["American River College", "Rio Hondo College", "Cypress College"],
  members: { "ENGL M1001": [{ c: 0, cn: "CCC1" }, { c: 1, cn: "CCC2" }, { c: 2, cn: "CCC3" }], "CNST M1009": [{ c: 0, cn: "CCC4" }], "ESOL M9168": [{ c: 1, cn: "CCC6" }] } };
const UNIFIED = { generated_at: "2026-11-25T05:00:00Z", mq_disciplines: ["English", "Construction Technology", "English as a Second Language"],
  rows: [
    { kind: "Course", id: "ENGL M1001", title: "College Composition", disc: "English", credit: "Credit", units: 4, members: 3 },
    { kind: "Course", id: "CNST M1009", title: "Tool and Equipment Applications", disc: "Construction Technology", credit: "Credit", units: 1.5, members: 1 },
    { kind: "Course", id: "ESOL M9168", title: "Beginning ESL", disc: "English as a Second Language", credit: "Noncredit", units: 0, members: 1 }
  ] };

function tab(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window, fetches = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url) {
    fetches.push(String(url));
    if (/discipline_canonical_subj4\.json/.test(String(url))) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ disciplines: { "English": { canonical_subj4: "ENGL" }, "Construction Technology": { canonical_subj4: "CNST" }, "English as a Second Language": { canonical_subj4: "ESOL" } } }) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (s === "unified_courses_data.js") w.CPL_UNIFIED_COURSES = JSON.parse(JSON.stringify(UNIFIED));
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, fetches };
}
const rowsBtns = (d) => Array.from(d.querySelectorAll(".cplcoci-rows [role=radio]"));
const dataRows = (d) => Array.from(d.querySelectorAll(".ccl-table tbody tr")).filter((tr) => !tr.classList.contains("ccl-band") && !tr.classList.contains("ccl-editrow"));
const heads = (d) => Array.from(d.querySelectorAll(".ccl-table thead th")).map((th) => txt(th.querySelector(".ccl-sort"))).filter(Boolean);

(async () => {
  {
    const { d } = tab("#coci-lookup/courses");
    await until(() => dataRows(d).length > 0);
    const b = rowsBtns(d);
    check("(1) Rows offers the two choices, in the mock's order", b.map(txt).join(" | ") === "Common courses | Local courses, under their common course", b.map(txt).join(" | "));
    check("(1) Local is the default", b[1] && b[1].getAttribute("aria-checked") === "true" && b[0].getAttribute("aria-checked") === "false", "default");
    check("(1) the group is a labeled radiogroup", d.querySelector(".cplcoci-rows").getAttribute("role") === "radiogroup" && d.querySelector(".cplcoci-rows").getAttribute("aria-label") === "Rows", "aria");
    b[0].click();
    await until(() => /ENGL M1001/.test(txt(d.querySelector(".ccl-table"))) && heads(d).indexOf("Common course") >= 0);
    const W = d.defaultView;
    check("(3) choosing writes the address", W.location.hash === "#coci-lookup/courses/common", W.location.hash);
    check("(2) one row per common course", dataRows(d).length === 3, dataRows(d).map(txt).join(" / "));
    const H = heads(d);
    check("(2) the columns", ["Title", "Common course", "Common subject", "Units", "Local courses", "Colleges", "Credit", "Status"].every((h) => H.some((x) => x.indexOf(h) === 0)), H.join(", "));
    const engl = dataRows(d).find((tr) => /ENGL M1001/.test(txt(tr)));
    const cellAt = (tr, h) => tr.children[heads(d).findIndex((x) => x.indexOf(h) === 0) + 1];
    check("(2) its local courses and colleges come from the identity file", !!engl && txt(cellAt(engl, "Local courses")) === "3" && txt(cellAt(engl, "Colleges")) === "3", engl && txt(engl));
    await until(() => /ENGL English/.test(txt(cellAt(dataRows(d).find((tr) => /ENGL M1001/.test(txt(tr))), "Common subject"))));
    check("(2) the common subject reads with its code", txt(cellAt(dataRows(d).find((tr) => /ENGL M1001/.test(txt(tr))), "Common subject")) === "ENGL English", txt(engl));
    const rows = W.CPL_COCI_LOOKUP_TAB._commonRows();
    const e1 = rows.find((r) => r.mid === "ENGL M1001");
    check("(2) the row's counts", e1 && e1.n === 3 && e1.colleges === 3, JSON.stringify(e1));
    // (4) the bar
    const tb = engl && engl.querySelector("button");
    tb && tb.click();
    await until(() => d.getElementById("ccl-panel"));
    const tabs = Array.from(d.querySelectorAll(".ccl-ptabs [role=tab]")).map(txt);
    check("(4) the bar's tabs", tabs.join(" | ") === "Local courses | Common subject | History", tabs.join(" | "));
    check("(4) the bar is named for the common course", /Common course: ENGL M1001, College Composition/.test(txt(d.getElementById("ccl-panel-t"))), txt(d.getElementById("ccl-panel-t")));
    check("(4) Local courses lists its three local courses", /ENGL 300/.test(txt(d.getElementById("ccl-panel"))) && /ENGL 101/.test(txt(d.getElementById("ccl-panel"))) && /ENGL 100/.test(txt(d.getElementById("ccl-panel"))), txt(d.getElementById("ccl-panel")).slice(0, 300));
    Array.from(d.querySelectorAll(".ccl-ptabs [role=tab]")).find((x) => txt(x) === "History").click();
    await sleep(20);
    check("(4) History says what has been decided", /What has been decided about ENGL M1001/.test(txt(d.getElementById("ccl-panel"))), txt(d.getElementById("ccl-panel")).slice(0, 200));
    // (5) filters
    const fone = Array.from(d.querySelectorAll("button")).find((x) => /^Holds one local course/.test(txt(x)));
    check("(5) Holds one local course counts 2", !!fone && /\b2\b/.test(txt(fone)), fone && txt(fone));
    fone.click();
    await until(() => dataRows(d).length === 2);
    check("(5) and lists them", dataRows(d).length === 2 && !dataRows(d).some((tr) => /ENGL M1001/.test(txt(tr))), dataRows(d).map(txt).join(" / "));
    const fn = Array.from(d.querySelectorAll("button")).find((x) => /^Noncredit\b/.test(txt(x)) && !/enhanced/i.test(txt(x)));
    check("(5) Noncredit counts the one noncredit common course", !!fn && /\b1\b/.test(txt(fn)), fn && txt(fn));
    // (6) a new visit
    W.dispatchEvent(new W.CustomEvent("cpl-tab-activated", { detail: { tab: "other" } }));
    W.dispatchEvent(new W.CustomEvent("cpl-tab-activated", { detail: { tab: "coci-lookup" } }));
    await sleep(20);
    check("(6) a new visit drops the choice", W.CPL_COCI_LOOKUP_TAB._state.grain === "local", W.CPL_COCI_LOOKUP_TAB._state.grain);
  }
  {
    const { d, w } = tab("#coci-lookup/courses/common");
    await until(() => heads(d).indexOf("Common course") >= 0);
    check("(3) #coci-lookup/courses/common opens Common courses", rowsBtns(d)[0].getAttribute("aria-checked") === "true" && dataRows(d).length === 3, rowsBtns(d).map((b) => b.getAttribute("aria-checked")).join(","));
    rowsBtns(d)[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await until(() => rowsBtns(d)[1] && rowsBtns(d)[1].getAttribute("aria-checked") === "true");
    check("(7) an arrow key moves the choice and keeps focus on it", rowsBtns(d)[1].getAttribute("aria-checked") === "true" && d.activeElement === rowsBtns(d)[1] && w.location.hash === "#coci-lookup/courses", w.location.hash);
  }
  {
    const i = SRC.indexOf("/* ── The Courses List, Rows: Common courses"), j = SRC.indexOf("// ── shell ──", i);
    const block = SRC.slice(i, j) + SRC.slice(SRC.indexOf("function rowsControl()"), SRC.indexOf("function setGrain"));
    check("(7) no raw hex in the new code", i > 0 && !/#[0-9a-fA-F]{3,6}\b/.test(block), "hex");
  }

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  <- " + why)); });
  console.log(fail ? fail + " failed" : "all " + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
