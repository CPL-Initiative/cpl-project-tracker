// CPL Pathways: Request Adopt on the course cards, a course's SLOs and objectives beside the page, Ask Sierra in her
// side bar, the full window width, and the CPL Visual's build progress (Sam, 2026-11-16, S667):
//   1. "Add Request Adopt links to course cards on programs wherever possible"
//   2. "Add Sierra bubble on bottom right and have it open to sidebar instead of new tab"
//   3. "Add link on course cards to SLOs and Objectives if they are collected and have them open to a side bar"
//   4. "Use full width of window for everything on this tab"
//   5. "On open of View CPL Visual, add a timer that shows progress on creating the visual--since it takes a while to
//      open and the users needs to know to wait rather than click again"
//
// Guards the failure modes:
//   (a) every Could adopt or For consideration credential on a card gets map_links.js's line, each naming its
//       credential when a card holds two or more, and a card with neither gets no line;
//   (b) the SLOs word appears only on a course with collected rows, says which kinds it holds, matches codes printed
//       with or without a space or hyphen, reads the college's index once, and a failed read claims nothing;
//   (c) the panel is a labeled non-modal dialog showing the newest read of each kind, SLOs before objectives, and
//       Escape shuts it with focus back on the word;
//   (d) the chip shows on CPL Pathways and the Library whichever tab's listener runs last, hides elsewhere, and the
//       two tabs map the bar's tokens with one string;
//   (e) Ask Sierra opens her side bar with the program's question when the bar has loaded, and keeps its link otherwise;
//   (f) the tab lifts the shell's 1400px cap;
//   (g) the workbook reports its steps only to a caller that asks, and the visual page shows a bar, the step in a live
//       region and a clock outside it, from the first byte until the visual paints.
// Run from repo root: `npm test` (or `node tests/cpl_pathways_side_panels.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const LIB_TAB = fs.readFileSync("library.js", "utf8");
const WORKBOOK = fs.readFileSync("college_cpl_workbook.js", "utf8");
const VISUAL = fs.readFileSync("library/cpl-opportunity/index.html", "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms || 30));

function freshWindow(answer) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="cpl-pathways-root"></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/cpl/" });
  const w = dom.window, calls = [];
  w.fetch = function (url) {
    calls.push(String(url));
    const got = answer ? answer(decodeURIComponent(String(url))) : [];
    if (got instanceof Error) return Promise.reject(got);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(got) });
  };
  w.CPL_MAP_LINKS = { node: function (t) {
    const s = w.document.createElement("span");
    s.className = "cpl-maplinks";
    s.setAttribute("data-ml-title", t);
    s.textContent = "Request Quick Adopt in MAP";
    return s;
  } };
  w.eval(DATA); w.eval(ROEP); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  return { w, calls, T: w.CPL_PATHWAYS_TAB, root: w.document.getElementById("cpl-pathways-root") };
}
function record(w, college, control) {
  return w.CPL_PATHWAYS_ROEP.programs.find((p) => p.college === college && String(p.control_number) === String(control));
}
function tile(root, code) { return root.querySelector('.cplpw-rtile[data-code="' + code + '"]'); }

(async function () {
  // (a) Request Adopt on the cards.
  {
    const { w, T, root } = freshWindow();
    const two = record(w, "Cerritos College", "41982");
    T._renderRoepProgram(root, two);
    const t = tile(root, "HED 100");
    const lines = t ? [...t.querySelectorAll(".cplpw-radopt")] : [];
    const titles = (two.display.courses["HED 100"].adopt.credentials || []).map((a) => a.credential);
    check("(a) a card with two could-adopt credentials carries a Request Adopt line for each",
      lines.length >= 2 && titles.every((x) => lines.some((l) => l.querySelector(".cpl-maplinks").getAttribute("data-ml-title") === x)),
      lines.length + " lines");
    check("(a) and each line names its credential", lines.every((l) => l.querySelector(".nm") && titles.indexOf(l.querySelector(".nm").textContent) >= 0));
    const one = record(w, "Cerritos College", "42158");
    T._renderRoepProgram(root, one);
    const courses = one.display.courses;
    const single = Object.keys(courses).find((k) => {
      const n = ((courses[k].adopt || {}).credentials || []).length + (courses[k].consider || []).length;
      return n === 1;
    });
    const st = single && tile(root, single);
    check("(a) a card with one credential carries its line without repeating the name",
      !!st && st.querySelectorAll(".cplpw-radopt").length === 1 && !st.querySelector(".cplpw-radopt .nm"), single);
    const bare = Object.keys(courses).find((k) => !courses[k].adopt && !(courses[k].consider || []).length);
    check("(a) a card with nothing to adopt has no line", !!bare && !tile(root, bare).querySelector(".cplpw-radopts"), bare);
    const css = SRC.match(/\.cplpw-radopt:has\(> \.cpl-maplinks:empty\)/);
    check("(a) a line MAP lists no exhibit for hides", !!css);
  }

  // (b) and (c) the SLOs word and the panel.
  {
    const index = [{ course_code: "IWAP40.07", kind: "slo" }, { course_code: "IWAP 40.07", kind: "objective" }, { course_code: "IWAP-40.50", kind: "slo" }];
    const rows = [
      { course_code: "IWAP 40.07", kind: "slo", heading: "Student Learning Outcomes", outcomes: ["Old outcome."], fingerprint: "o", read_run: 2, source_kind: "course_outline", source_url: "https://example.org/old" },
      { course_code: "IWAP 40.07", kind: "objective", heading: "Course Objectives", outcomes: ["Describe the apprenticeship agreement."], fingerprint: "b", read_run: 3, source_kind: "course_outline", source_url: "https://example.org/cor" },
      { course_code: "IWAP40.07", kind: "slo", heading: "Student Learning Outcomes", outcomes: ["Identify jobsite hazards.", "Explain the trade's history."], fingerprint: "a", read_run: 3, source_kind: "course_outline", source_url: "https://example.org/cor", loaded_at: "2026-11-10T12:00:00Z" }];
    const { w, T, root, calls } = freshWindow((u) => /course_outcomes\?select=course_code,kind&/.test(u) ? index : rows);
    const rec = record(w, "Cerritos College", "42158");
    T._renderRoepProgram(root, rec);
    await wait(40);
    const word = (code) => { const t = tile(root, code); return t && t.querySelector(".cplpw-outword"); };
    check("(b) a course with SLOs and objectives says both", word("IWAP 40.07") && word("IWAP 40.07").textContent === "SLOs and objectives",
      word("IWAP 40.07") && word("IWAP 40.07").textContent);
    check("(b) a course with SLOs alone says SLOs, its code printed with a hyphen", word("IWAP 40.50") && word("IWAP 40.50").textContent === "SLOs");
    check("(b) a course with nothing collected has no word", !word("IWAP 40.56"));
    const b = word("IWAP 40.07");
    check("(b) the word is a button that names its dialog", b && b.tagName === "BUTTON" && b.getAttribute("aria-haspopup") === "dialog" &&
      b.getAttribute("aria-controls") === "cplpw-panel" && /IWAP 40\.07/.test(b.getAttribute("aria-label")));
    T._renderRoepProgram(root, rec);
    await wait(40);
    check("(b) the college's index is read once across re-renders",
      calls.filter((u) => /select=course_code,kind&/.test(decodeURIComponent(u))).length === 1);

    // #3412 item 1: a chip beside the word opens the same text on the card itself; the word still opens the panel.
    const chip = (code) => { const t = tile(root, code); return t && t.querySelector(".cplpw-outchip"); };
    check("(b2) a chip only where something is collected, worded like the word",
      chip("IWAP 40.07") && chip("IWAP 40.07").textContent === "SLOs and objectives" && chip("IWAP 40.50").textContent === "SLOs" && !chip("IWAP 40.56"));
    const ch = chip("IWAP 40.07"), reg = w.document.getElementById(ch.getAttribute("aria-controls"));
    check("(b2) the chip names what it does and starts closed", /show the text on this card/.test(ch.getAttribute("aria-label")) &&
      ch.getAttribute("aria-expanded") === "false" && reg && reg.hidden && tile(root, "IWAP 40.07").contains(reg));
    const before = calls.length;
    ch.dispatchEvent(new w.Event("click", { bubbles: true }));
    await wait(40);
    const pnl = w.document.getElementById("cplpw-panel");
    check("(b2) pressing it opens the text in place, SLOs first, and no panel",
      ch.getAttribute("aria-expanded") === "true" && !reg.hidden && (!pnl || pnl.hidden) &&
      [...reg.querySelectorAll(".cplpw-outblock h3")].map((h) => h.textContent).join(" | ") === "Student learning outcomes (2) | Course objectives (1)");
    ch.dispatchEvent(new w.Event("click", { bubbles: true }));
    ch.dispatchEvent(new w.Event("click", { bubbles: true }));
    await wait(20);
    check("(b2) it folds and reopens without reading again", calls.length === before + 1 && !reg.hidden && reg.querySelectorAll(".cplpw-outblock").length === 2);

    word("IWAP 40.07").dispatchEvent(new w.Event("click", { bubbles: true }));
    await wait(40);
    const panel = w.document.getElementById("cplpw-panel");
    check("(c) the panel opens as a labeled non-modal dialog", panel && !panel.hidden && panel.getAttribute("role") === "dialog" &&
      panel.getAttribute("aria-modal") === "false" && w.document.getElementById(panel.getAttribute("aria-labelledby")).textContent === "SLOs and objectives");
    const q = decodeURIComponent(calls[calls.length - 1]);
    check("(c) it names both kinds, so an objective never stands in for an SLO", /kind=in\.\(slo,objective\)/.test(q), q);
    check("(c) it reads both of the course's printed codes", /course_code=in\.\("IWAP40\.07","IWAP 40\.07"\)|course_code=in\.\("IWAP 40\.07","IWAP40\.07"\)/.test(q), q);
    const heads = [...panel.querySelectorAll(".cplpw-outblock h3")].map((h) => h.textContent);
    check("(c) SLOs first, then objectives, each counted", heads.join(" | ") === "Student learning outcomes (2) | Course objectives (1)", heads.join(" | "));
    check("(c) an older read of a kind is not shown", !/Old outcome/.test(panel.textContent));
    check("(c) each list names where it was printed", [...panel.querySelectorAll(".cplpw-outblock a")].every((a) => a.getAttribute("href") === "https://example.org/cor" && a.target === "_blank"));
    panel.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("(c) Escape shuts it and hands focus back to the word", panel.hidden && w.document.activeElement === word("IWAP 40.07"));
    check("(c) the outcome rows pick the newest run of each kind",
      T._currentOutcomeRows(rows).map((r) => r.fingerprint).sort().join(",") === "a,b");
  }
  {
    const { w, T, root } = freshWindow(() => new Error("Failed to fetch"));
    T._renderRoepProgram(root, record(w, "Cerritos College", "42158"));
    await wait(40);
    check("(b) a failed read claims no outcomes", !root.querySelector(".cplpw-outword"));
  }

  // (d) and (e) Ask Sierra.
  {
    const { w, T, root } = freshWindow();
    const loads = [], chips = [], asks = [];
    let tab = "cpl-pathways";
    w.CPL_TABS = { current: () => tab, loadScript: function (src, name, cb) {
      loads.push(src);
      w.CPL_SIERRA_BAR = { setChip: (on) => chips.push(on), ask: (q, from) => asks.push([q, from]), isOpen: () => false, close: () => {} };
      cb();
    } };
    T._ensureSierraBar();
    check("(d) the tab loads sierra/sidebar.js and shows the chip", loads.join() === "sierra/sidebar.js" && chips[chips.length - 1] === true);
    w.eval(LIB_TAB);
    const fire = (t) => { tab = t; w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: t } })); return chips[chips.length - 1]; };
    const onPathways = fire("cpl-pathways");
    const elsewhere = fire("dashboard");
    const onLibrary = fire("library");
    const backAgain = fire("cpl-pathways");
    check("(d) the chip shows on CPL Pathways and the Library whichever listener runs last, and hides elsewhere",
      onPathways === true && elsewhere === false && onLibrary === true && backAgain === true, JSON.stringify(chips));
    check("(d) the bar loads once", loads.length === 1);
    const libTokens = new Function("return " + (LIB_TAB.match(/st\.textContent = (".sbar,\.sbar-chip\{[\s\S]*?);\n/) || [])[1])();
    check("(d) the two tabs map the bar's tokens with one string", libTokens === T._SBAR_TOKENS);

    const rec = record(w, "Cerritos College", "42158");
    T._renderRoepProgram(root, rec);
    const ask = root.querySelector("a.cplpw-rask");
    const ev = new w.MouseEvent("click", { bubbles: true, cancelable: true });
    ask.dispatchEvent(ev);
    check("(e) Ask Sierra opens her side bar with the program's question, not a new tab",
      ev.defaultPrevented && asks.length === 1 && asks[0][0].indexOf(rec.college) >= 0 && asks[0][1] === ask);
    delete w.CPL_SIERRA_BAR;
    const ev2 = new w.MouseEvent("click", { bubbles: true, cancelable: true });
    ask.dispatchEvent(ev2);
    check("(e) before the bar has loaded, the link opens her page", !ev2.defaultPrevented && /^sierra\/\?ask=/.test(ask.getAttribute("href")));
  }

  // (f) the full width.
  check("(f) the tab lifts the shell's 1400px cap", /#tab-cpl-pathways \.main-container \{ max-width:none;/.test(SRC));

  // (g) the workbook's steps.
  {
    const dom = new JSDOM("<!doctype html><body></body>", { runScripts: "outside-only", url: "https://example.org/cpl/" });
    const w = dom.window;
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    w.eval(WORKBOOK);
    const W = w.CPL_COLLEGE_WORKBOOK;
    check("(g) the workbook names the five data files it reads", Array.isArray(W.need) && W.need.length === 5 && W.need.indexOf("coci_lookup_data.js") >= 0);
    ["CPL_COCI_LOOKUP", "CPL_UC_MEMBERS", "CPL_UC_ALIGNED", "CPL_STATEWIDE", "CPL_COCI_PROGRAMS"].forEach((g) => { w[g] = {}; });
    const steps = [];
    let doneAt = -1;
    await new Promise((resolve) => W.prepare({ college: "Cerritos College", loadScript: (s, g, cb) => cb(),
      onStep: (s) => steps.push(s) }, function () { doneAt = steps.length; resolve(); }));
    check("(g) a caller that asks hears the records step, then the build, before the result", steps.join() === "records,build" && doneAt === 2, steps.join());
    let plain = false;
    await new Promise((resolve) => W.prepare({ college: "Cerritos College", loadScript: (s, g, cb) => cb() }, function () { plain = true; resolve(); }));
    check("(g) a caller that does not ask still gets its result", plain);
  }

  // (g) the visual page's progress.
  {
    const inline = (VISUAL.match(/<script>\n(\(function \(\) \{\n  var W = window\.CPL_COLLEGE_WORKBOOK[\s\S]*?)<\/script>/) || [])[1];
    check("(g) the visual page's build script is found", !!inline);
    const dom = new JSDOM(VISUAL.replace(/<script[\s\S]*?<\/script>/g, ""),
      { runScripts: "outside-only", url: "https://example.org/cpl/library/cpl-opportunity/?college=Cerritos%20College" });
    const w = dom.window;
    w.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
    const NEED = ["coci_lookup_data.js", "unified_courses_members.js", "unified_courses_aligned.js", "statewide_data.js", "coci_programs_data.js"];
    const seen = {};
    const snap = (k) => {
      const m = w.document.getElementById("cpo-meter"), s = w.document.getElementById("cpo-step");
      seen[k] = { v: m ? Number(m.value) : null, step: s ? s.textContent : null };
    };
    w.CPL_COLLEGE_WORKBOOK = {
      need: NEED,
      load: function (opts, cb) {
        snap("start");
        let left = NEED.length;
        NEED.forEach((n, i) => { w["G" + i] = {}; opts.loadScript("../../" + n, "G" + i, () => { if (--left === 2) snap("three"); if (!left) cb(null); }); });
      },
      colleges: () => ["Cerritos College"], resolve: (names, want) => want,
      prepare: function (opts, cb) {
        opts.onStep("records"); snap("records");
        opts.onStep("build"); snap("build");
        setTimeout(() => cb(null, { college: "Cerritos College" }), 5);
      },
      pageHtml: () => '<p id="painted">The visual</p>', wirePage: () => {}, pageState: () => ({}), pageQuery: () => "",
      shareUrl: () => "", notesSlug: () => "cerritos"
    };
    w.eval(inline);
    await wait(60);
    const clock = w.document.getElementById("cpo-clock");
    check("(g) the bar shows from the first byte, at zero, with the files step", seen.start && seen.start.v === 0 && /Reading COBI's data files: 0 of 5/.test(seen.start.step), JSON.stringify(seen.start));
    check("(g) the bar moves as files land", seen.three && seen.three.v > 0 && /3 of 5/.test(seen.three.step), JSON.stringify(seen.three));
    check("(g) then the college's records, then the build, each further along",
      seen.records && /Cerritos College's catalog records/.test(seen.records.step) && seen.records.v > seen.three.v &&
      seen.build && seen.build.step === "Building the page" && seen.build.v > seen.records.v, JSON.stringify(seen));
    check("(g) the visual replaces the bar when it paints", !!w.document.getElementById("painted") && !w.document.getElementById("cpo-build") && !clock);
    const page = VISUAL;
    check("(g) the step is the live region and the clock sits outside it",
      /id="cpo-step" role="status" aria-live="polite"><\/span>' \+\s*'<span class="cpo-build-clock" id="cpo-clock"><\/span>/.test(page));
    check("(g) the bar is a labeled progress element, still under reduced motion",
      /<progress class="cpo-meter" id="cpo-meter" max="100" value="0" aria-labelledby="cpo-step">/.test(page) && /prefers-reduced-motion: reduce\) \{ \.cpo-meter/.test(page));
    w.close();
  }

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " CPL Pathways side panel checks passed");
  if (failed) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
