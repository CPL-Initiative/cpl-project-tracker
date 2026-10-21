// CPL Pathways: the chosen college's program data, in one line.
//
// Sam, 2026-10-21: when a college is chosen, show a small status line for its program data,
// "something like 90% complete: 200 programs ... · 500 SLOs from 88% of course outlines · 24
// COCI/catalog conflicts", each figure opening the matching list. And no "ROEP" or "catalog
// harvest" in on-screen text (code identifiers stay).
//
// Guards:
//   (a) the counts: complete is an active COCI program whose record passes the three machine
//       checks; SLOs sum each row's outcomes and cover the courses the state's Program Course File
//       lists for the college's programs, matched without spaces or hyphens; a disagreement is a
//       record failing the courses or off-list check; the date is the newest record's load;
//   (b) the line's machine checks agree with the Program Requirements tab's machineFails;
//   (c) the line shows only once a college is chosen, reads that college alone, and paints three
//       figures, each a button opening its own list;
//   (d) a figure opens the Records view on the Program Requirements tab, picked to the college,
//       with the matching Show filter, and the tab's "conflict" filter lists exactly what the line
//       counted;
//   (e) a slow answer for a college no longer chosen never paints; a failed read says so;
//   (f) without fetch the line stays hidden (the other selector tests run without one);
//   (g) no on-screen string in the three modules says ROEP or catalog harvest.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const PRH = fs.readFileSync("program_requirements.js", "utf8");
const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const BOOK = fs.readFileSync("college_cpl_workbook.js", "utf8");

const PASS = { coverage: true, invented: true, arithmetic: "equal" };
const FIX = {
  active: [{ control_number: "A1" }, { control_number: "A2" }, { control_number: "A3" }, { control_number: "A4" }],
  records: [
    { control_number: "A1", checks: PASS, loaded_at: "2026-10-16T17:39:49Z" },
    { control_number: "A2", checks: { coverage: false, invented: true, arithmetic: "equal" }, loaded_at: "2026-10-21T08:00:00Z" },
    { control_number: "A3", checks: { coverage: true, invented: false, arithmetic: "unstated" }, loaded_at: "2026-10-12T00:00:00Z" },
    { control_number: "A4", checks: { coverage: true, invented: true, arithmetic: "short" }, loaded_at: "2026-10-12T00:00:00Z" },
    { control_number: "X9", checks: PASS, loaded_at: "2026-10-12T00:00:00Z" }
  ],
  outcomes: [
    { course_code: "ENGL 1A", outcomes: ["a", "b", "c"], source_kind: "course_outline" },
    { course_code: "MATH-13", outcomes: ["a"], source_kind: "course_outline" },
    { course_code: "ART 2", outcomes: [], source_kind: "course_outline" }
  ],
  listed: [{ course_code: "ENGL1A" }, { course_code: "ENGL 1A" }, { course_code: "MATH 13" }, { course_code: "ART 2" }, { course_code: "BIO 1" }]
};

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  if (opts.fetch) w.fetch = opts.fetch;
  w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  return w;
}
const flush = () => new Promise((r) => setTimeout(r, 0));
function answer(body) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}
// A PostgREST stand-in: each table's fixture rows for the college the URL names.
function restFor(byCollege, asked, hold) {
  return function (url) {
    asked.push(url);
    const college = decodeURIComponent((/college=eq\.([^&]+)/.exec(url) || [])[1] || "");
    const table = (/\/rest\/v1\/([a-z_]+)\?/.exec(url) || [])[1];
    const key = { coci_college_programs: "active", program_requirement_records: "records",
      course_outcomes: "outcomes", coci_program_courses: "listed" }[table];
    const rows = key && byCollege[college] ? byCollege[college][key] : [];
    if (hold && hold[college]) return new Promise((r) => hold[college].push(() => r(answer(rows))));
    return answer(rows);
  };
}

(async () => {
  // ── (a) ──
  const w0 = boot();
  const S = w0.CPL_PATHWAYS_TAB._collegeStatus(FIX);
  check("(a) active programs counted from COCI", S.active === 4, S.active);
  check("(a) complete: active and passing, never a record off the active list", S.complete === 1 && S.pct === 25, S.complete + " " + S.pct);
  check("(a) a disagreement fails courses or off-list, never units alone", S.conflicts === 2, S.conflicts);
  check("(a) the date is the newest record's load", S.updated === "2026-10-21T08:00:00Z", S.updated);
  check("(a) SLOs sum each row's outcomes", S.slos === 4, S.slos);
  check("(a) the courses listed are counted once each, without spaces or hyphens", S.listed === 4, S.listed);
  check("(a) a course with an empty outcomes list does not count as covered", S.covered === 2 && S.coverPct === 50, S.covered + " " + S.coverPct);
  check("(a) the source is named", JSON.stringify(S.kinds) === '["course_outline"]', S.kinds);
  const none = w0.CPL_PATHWAYS_TAB._collegeStatus({});
  check("(a) a college with nothing read counts zero without dividing by it", none.active === 0 && none.pct === null && none.coverPct === null);

  // ── (b) ──
  const dp = new JSDOM('<!doctype html><html><head></head><body><div id="program-requirements-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  dp.window.fetch = () => new Promise(() => {});
  for (const code of [COMMONS, PRH]) { const s = dp.window.document.createElement("script"); s.textContent = code; dp.window.document.body.appendChild(s); }
  const M = dp.window.CPL_PROGRAM_REQUIREMENTS;
  const shapes = [PASS, {}, { coverage: true }, { coverage: true, invented: true }, { coverage: false, invented: false, arithmetic: "over" },
    { coverage: true, invented: true, arithmetic: "unstated" }, { coverage: "true", invented: true, arithmetic: "equal" }];
  const mine = shapes.map((c) => w0.CPL_PATHWAYS_TAB._collegeStatus({ active: [{ control_number: "K" }], records: [{ control_number: "K", checks: c }] }));
  const theirs = shapes.map((c) => M.machineFails({ checks: c }));
  check("(b) the line's complete count agrees with machineFails on every check shape",
    mine.every((s, i) => s.complete === (theirs[i].length === 0 ? 1 : 0)), JSON.stringify(theirs));
  check("(b) and its disagreement count with the courses and off-list failures",
    mine.every((s, i) => s.conflicts === (theirs[i].some((f) => f === "courses" || f === "off-list") ? 1 : 0)));

  // ── (c) ──
  const asked = [];
  const w = boot({ fetch: restFor({ "College of Alameda": FIX }, asked) });
  w.CPL_PATHWAYS_TAB.activate();
  await flush(); await flush(); await flush(); // the record list lands and the tab re-renders once
  asked.length = 0;
  const root = w.document.getElementById("cpl-pathways-root");
  const col = root.querySelector("select.cplpw-colsel");
  const line = () => root.querySelector(".cplpw-colstat");
  check("(c) the line waits for a college", line() && line().hidden === true);
  const has = [...col.options].some((o) => o.value === "College of Alameda");
  if (!has) { const o = w.document.createElement("option"); o.value = o.textContent = "College of Alameda"; col.appendChild(o); }
  col.value = "College of Alameda"; col.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("(c) choosing a college shows it, reading", !line().hidden && /Reading College of Alameda/.test(line().textContent));
  await flush(); await flush(); await flush();
  const txt = line().textContent;
  check("(c) one line of three figures", (txt.match(/ · /g) || []).length === 2, txt);
  check("(c) complete, with its count and the newest load", /^25% complete: 1 of 4 active programs, records updated 10\/21\/2026/.test(txt), txt);
  check("(c) SLOs, their source and their coverage", /4 SLOs from course outlines, for 50% of the 4 courses its programs list/.test(txt), txt);
  check("(c) the disagreements", /2 records disagree with the state's course list$/.test(txt), txt);
  const btns = [...line().querySelectorAll("button.go")];
  check("(c) each figure is a button", btns.length === 3 && btns.every((b) => b.type === "button"), btns.length);
  check("(c) the line is a polite status region", line().getAttribute("role") === "status" && line().getAttribute("aria-live") === "polite");
  check("(c) every read names the college", asked.length === 4 && asked.every((u) => /college=eq\.College%20of%20Alameda/.test(u)), asked.join("\n"));
  check("(c) the active programs are COCI's active ones", asked.some((u) => /coci_college_programs\?.*status=eq\.Active/.test(u)));

  // ── (d) ──
  const nav = [], went = [];
  w.CPL_TABS = { navigate: (t) => nav.push(t), loadScript: (src, g, cb) => cb() };
  w.CPL_PROGRAM_REQUIREMENTS = { goTo: (to) => went.push(to) };
  btns.forEach((b) => b.click());
  check("(d) a figure opens the Program Requirements tab", nav.length === 3 && nav.every((t) => t === "program-requirements"), nav);
  check("(d) on the Records view, picked to the college, with its filter",
    went.length === 3 && went.every((t) => t.view === "records" && t.rcollege === "College of Alameda" && t.sec === "records:find") &&
    went.map((t) => t.rshow).join(",") === "complete,all,conflict", JSON.stringify(went));
  // Not loaded yet: the request waits for that tab's first activation, which takes it once.
  delete w.CPL_PROGRAM_REQUIREMENTS;
  nav.length = 0;
  btns[2].click();
  check("(d) before that tab has loaded, the list waits as a request and the tab opens",
    nav.join() === "program-requirements" && w.CPL_PROGRAM_REQUIREMENTS_GOTO && w.CPL_PROGRAM_REQUIREMENTS_GOTO.rshow === "conflict"
    && w.CPL_PROGRAM_REQUIREMENTS_GOTO.rcollege === "College of Alameda");
  check("(d) and this tab never loads that tab's module", !/loadScript\("program_requirements\.js"/.test(SRC));
  dp.window.CPL_PROGRAM_REQUIREMENTS_GOTO = { view: "records", rcollege: "College of Alameda", rshow: "conflict", sec: "records:find" };
  M.activate();
  check("(d) the Program Requirements tab takes the request on activation, once",
    dp.window.CPL_PROGRAM_REQUIREMENTS_GOTO === null && M._state.view === "records" && M._state.rshow === "conflict"
    && (M._state.pick || []).indexOf("College of Alameda") >= 0);
  const P = FIX.records.map((r) => Object.assign({ college: "College of Alameda", program_title: r.control_number }, r));
  check("(d) the tab's conflict filter lists what the line counted",
    M.filterRecords(P, "", "conflict", "all").map((p) => p.control_number).join(",") === "A2,A3");
  check("(d) and the Records view offers it", /\["conflict", "Disagree with the state's course list"\]/.test(PRH));

  // ── (e) ──
  const hold = { "Cerritos College": [] };
  const asked2 = [];
  const w2 = boot({ fetch: restFor({ "College of Alameda": FIX, "Cerritos College": FIX }, asked2, hold) });
  w2.CPL_PATHWAYS_TAB.activate();
  await flush(); await flush(); await flush();
  const r2 = w2.document.getElementById("cpl-pathways-root");
  const c2 = r2.querySelector("select.cplpw-colsel");
  const pick = (v) => { if (![...c2.options].some((o) => o.value === v)) { const o = w2.document.createElement("option"); o.value = o.textContent = v; c2.appendChild(o); }
    c2.value = v; c2.dispatchEvent(new w2.Event("change", { bubbles: true })); };
  pick("Cerritos College");
  pick("College of Alameda");
  await flush(); await flush(); await flush();
  hold["Cerritos College"].forEach((f) => f());
  await flush(); await flush(); await flush();
  const l2 = r2.querySelector(".cplpw-colstat");
  check("(e) a late answer for the college no longer chosen never paints", /25% complete/.test(l2.textContent) && !/Cerritos/.test(l2.textContent), l2.textContent);
  const w3 = boot({ fetch: () => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve(null) }) });
  w3.CPL_PATHWAYS_TAB.activate();
  await flush(); await flush(); await flush();
  const r3 = w3.document.getElementById("cpl-pathways-root");
  const c3 = r3.querySelector("select.cplpw-colsel");
  c3.value = c3.options[1].value; c3.dispatchEvent(new w3.Event("change", { bubbles: true }));
  await flush(); await flush(); await flush();
  check("(e) a failed read says so", /could not be read \(.*503\)/.test(r3.querySelector(".cplpw-colstat").textContent), r3.querySelector(".cplpw-colstat").textContent);

  // ── (f) ──
  const w4 = boot();
  delete w4.fetch;
  w4.CPL_PATHWAYS_TAB.activate();
  const r4 = w4.document.getElementById("cpl-pathways-root");
  const c4 = r4.querySelector("select.cplpw-colsel");
  c4.value = c4.options[1].value; c4.dispatchEvent(new w4.Event("change", { bubbles: true }));
  check("(f) without fetch the line stays hidden", r4.querySelector(".cplpw-colstat").hidden === true);

  // ── (g) ──
  const said = [];
  for (const [name, code] of [["cpl_pathways.js", SRC], ["program_requirements.js", PRH], ["college_cpl_workbook.js", BOOK]]) {
    const lits = code.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g) || [];
    lits.filter((s) => / /.test(s) && /\bROEP\b|[Cc]atalog harvest/.test(s)).forEach((s) => said.push(name + ": " + s));
  }
  check("(g) no on-screen string says ROEP or catalog harvest", said.length === 0, said.join(" | "));

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + why + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " CPL Pathways college status checks passed");
  if (failed) process.exit(1);
})();
