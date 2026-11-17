// CPL Pathways: Request Adopt on the course cards, a course's SLOs and objectives beside the page, Ask Sierra in her
// side bar, the full window width, and the CPL Visual's build progress (Sam, 2026-11-16, S667):
//   1. "Add Request Adopt links to course cards on programs wherever possible"
//   2. "Add Sierra bubble on bottom right and have it open to sidebar instead of new tab"
//   3. "Add link on course cards to SLOs and Objectives if they are collected and have them open to a side bar"
//   4. "Use full width of window for everything on this tab"
//   5. "On open of Create My College CPL Plan, add a timer that shows progress on creating the visual--since it takes a while to
//      open and the users needs to know to wait rather than click again"
//
// Guards the failure modes:
//   (a) a card with a Could adopt or For consideration credential gets ONE chip (adopt_panel.js, #3412 item 4) naming
//       a granting college, its own region first, and how many more; the panel lists every exhibit with its issuer,
//       units, colleges and a checkbox, and checking two sends one intake row for both; a card with neither gets none;
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
const ADOPT_PANEL = fs.readFileSync("adopt_panel.js", "utf8");
const LIB_TAB = fs.readFileSync("library.js", "utf8");
const WORKBOOK = fs.readFileSync("college_cpl_workbook.js", "utf8");
const VISUAL = fs.readFileSync("library/cpl-opportunity/index.html", "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms || 30));

function freshWindow(answer, posts) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="cpl-pathways-root"></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/cpl/" });
  const w = dom.window, calls = [];
  w.fetch = function (url, opts) {
    calls.push(String(url));
    if (opts && opts.method === "POST") { (posts || []).push({ url: String(url), body: opts.body }); return Promise.resolve({ ok: true, status: 201 }); }
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
  w.eval(ADOPT_PANEL); w.eval(DATA); w.eval(ROEP); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  return { w, calls, T: w.CPL_PATHWAYS_TAB, root: w.document.getElementById("cpl-pathways-root") };
}
function record(w, college, control) {
  return w.CPL_PATHWAYS_ROEP.programs.find((p) => p.college === college && String(p.control_number) === String(control));
}
function tile(root, code) { return root.querySelector('.cplpw-rtile[data-code="' + code + '"]'); }

(async function () {
  // (a) One Adopt chip per course card, opening the multi-select panel (#3412 item 4).
  {
    const CATALOG = JSON.parse(fs.readFileSync("library/adopt/adopt_data.json", "utf8"));
    const posts = [];
    const { w, T, root, calls } = freshWindow((u) => /adopt_data\.json/.test(u) ? CATALOG : [], posts);
    const P = w.CPL_ADOPT_PANEL;
    const hedRec = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.college === "Cerritos College" && p.display.courses["HED 110"]);
    T._renderRoepProgram(root, hedRec);
    await wait(60);
    check("(a) the Catalog is read once, for the chip and the tab", calls.filter((u) => /adopt_data\.json/.test(u)).length === 1);
    const t = tile(root, "HED 110");
    const chips = t ? [...t.querySelectorAll(".cpladp-chip")] : [];
    const info = hedRec.display.courses["HED 110"];
    check("(a) Cerritos HED 110 carries one chip and no per-credential lines", chips.length === 1 && !t.querySelector(".cplpw-radopt, .cpl-maplinks"), chips.length);
    const lab = chips[0] ? chips[0].textContent : "";
    const mm = lab.match(/^(.+) and (\d+) more give CPL for this course\.$/);
    check("(a) its label names one granting college and how many more", !!mm && info.adopt.credentials.some((a) => a.colleges.indexOf(mm[1]) >= 0)
      && Number(mm[2]) === info.adopt.colleges_n - 1, lab);
    check("(a) the chip is an underlined-word button that names its dialog", chips[0] && chips[0].tagName === "BUTTON" &&
      chips[0].getAttribute("aria-controls") === "cplpw-panel" && chips[0].getAttribute("aria-expanded") === "false");
    chips[0].dispatchEvent(new w.Event("click", { bubbles: true }));
    await wait(30);
    const panel = w.document.getElementById("cplpw-panel");
    check("(a) the chip opens the tab's side panel and says it is open", panel && !panel.hidden && chips[0].getAttribute("aria-expanded") === "true");
    const rows = [...panel.querySelectorAll(".cpladp-row")];
    check("(a) the panel lists every exhibit the record holds, each with a labeled checkbox",
      rows.length === info.adopt.credentials.length + (info.consider || []).length &&
      rows.every((r) => { const cb = r.querySelector('input[type="checkbox"]'); const lb = r.querySelector("label"); return cb && lb && lb.getAttribute("for") === cb.id; }), rows.length);
    const more = panel.querySelector(".cpladp-more");
    const missing = info.adopt.credentials_n - info.adopt.credentials.length;
    check("(a) until the display apply lands, the panel says how many more exist and when they arrive",
      missing <= 0 || (!!more && more.textContent.indexOf(missing + " more exhibits") === 0 && /next catalog display update/.test(more.textContent) &&
        more.textContent.indexOf("(" + info.adopt.credentials_n + " in all)") > 0), more && more.textContent);
    const facts = rows.map((r) => r.querySelector(".cpladp-facts").textContent);
    check("(a) each row gives its issuer, units and granting colleges, or says one is not on file",
      facts.every((f) => /Issuer: |issuer is not on file/.test(f) && /units/.test(f) && /Already gives CPL for it: |granting college|No college grants/.test(f)), facts[0]);
    const emt = rows.find((r) => r.querySelector("label").textContent === "EMT Certification");
    check("(a) the colleges on a row are the record's colleges", emt && /Already gives CPL for it: Cabrillo College, City College of San Francisco, Moreno Valley College, Norco College, Riverside City College\./.test(emt.textContent));
    check("(a) MAP's line sits beside a row inside the panel", rows.every((r) => r.querySelector(".cpl-maplinks")));

    const form = panel.querySelector(".cpladp-form");
    form.querySelector('[name="contact_email"]').value = "pat@example.edu";
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await wait(10);
    check("(a) nothing is sent until an exhibit is checked", posts.length === 0 && /Check at least one exhibit/.test(form.querySelector(".cpladp-err").textContent));
    check("(a) the adopter's college starts as the program's college", form.querySelector('[name="adopter_college"]').value === "Cerritos College");
    rows[0].querySelector("input").checked = true;
    rows[1].querySelector("input").checked = true;
    const two = [rows[0], rows[1]].map((r) => r.querySelector("label").textContent);
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await wait(30);
    const sent = posts.map((p) => JSON.parse(p.body));
    check("(a) checking two and sending records ONE intake row naming both", posts.length === 1 && /\/rest\/v1\/cpl_adoption_interest$/.test(posts[0].url) &&
      sent[0].credentials === two.join(" | ") && sent[0].course_code === "HED 110" && sent[0].adopter_college === "Cerritos College" &&
      sent[0].precedent.indexOf(two[0] + ": ") === 0 && sent[0].program_id === hedRec.key, posts.length && posts[0].body);
    check("(a) the panel says the request was recorded", /Request recorded for 2 exhibits\./.test(panel.textContent));
    panel.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("(a) Escape shuts the panel, focus returns to the chip, and it reads as closed",
      panel.hidden && w.document.activeElement === chips[0] && chips[0].getAttribute("aria-expanded") === "false");

    // After the display apply: a record that carries all ten lists all ten, with no "more" line.
    const full = JSON.parse(JSON.stringify(info));
    full.adopt.credentials = Array.from({ length: 10 }, (_, i) => i < 4 ? info.adopt.credentials[i] : { credential: "Exhibit " + i, colleges: ["Peer College " + i] });
    const fm = P.fromRoep(full);
    const host = w.document.createElement("div");
    w.document.body.appendChild(host);
    const fChip = P.chip(fm, { home: "Cerritos College", course: { code: "HED 110" }, open: () => host });
    fChip.dispatchEvent(new w.Event("click"));
    await wait(10);
    check("(a) with the full list, the panel lists all ten and claims nothing missing",
      host.querySelectorAll(".cpladp-row").length === 10 && !host.querySelector(".cpladp-more"), host.querySelectorAll(".cpladp-row").length);

    // A course with nothing to adopt has no chip; a one-college course names it alone.
    const one = record(w, "Cerritos College", "42158");
    T._renderRoepProgram(root, one);
    const courses = one.display.courses;
    const bare = Object.keys(courses).find((k) => !courses[k].adopt && !(courses[k].consider || []).length);
    check("(a) a card with nothing to adopt has no chip", !!bare && !tile(root, bare).querySelector(".cpladp-chip"), bare);
    const iw = tile(root, "IWAP 40.63");
    check("(a) a one-college course names that college with no \"and N more\"",
      iw && iw.querySelector(".cpladp-chip").textContent === "American River College gives CPL for this course.", iw && iw.textContent);

    // Region first (Sam, 2:21 PM): a Riverside City card names Norco (Inland Empire) before a college elsewhere with more.
    const rcc = record(w, "Riverside City College", "31456");
    T._renderRoepProgram(root, rcc);
    const adj = tile(root, "ADJ-4");
    check("(a) a Riverside City card names Norco College, its own region, before Bakersfield's two exhibits",
      adj && /^Norco College and \d+ more give CPL for this course\.$/.test(adj.querySelector(".cpladp-chip").textContent), adj && adj.querySelector(".cpladp-chip").textContent);
    const bay = P.fromRoep({ adopt: { credentials_n: 3, colleges_n: 2, credentials: [
      { credential: "A", colleges: ["Chabot College", "Norco College"] }, { credential: "B", colleges: ["Chabot College"] }, { credential: "C", colleges: ["Chabot College"] }] } });
    check("(a) Norco College before a Bay Area college on more exhibits", P.label(bay, "Riverside City College") === "Norco College and 1 more give CPL for this course.", P.label(bay, "Riverside City College"));
    check("(a) outside any shared region, the college on the most exhibits", P.label(bay, "College of the Redwoods") === "Chabot College and 1 more give CPL for this course.", P.label(bay, "College of the Redwoods"));
    const tie = P.fromRoep({ adopt: { credentials_n: 2, colleges_n: 2, credentials: [{ credential: "A", colleges: ["Zeta College"] }, { credential: "B", colleges: ["Alpha College"] }] } });
    check("(a) a tie goes to the first name alphabetically", /^Alpha College and 1 more/.test(P.label(tie, "")));
    const sw = P.fromRoep({ consider: [{ credential: "No Such Credential Anywhere", credit: "3 hours in Things", cid: "XYZ 100 X", colleges_n: 0 },
      { credential: "Another Unheld Recommendation", cid: "XYZ 100 X", colleges_n: 0 }] });
    check("(a) statewide recommendations with no granting college read Request Adopt (N)", P.label(sw, "Cerritos College") === "Request Adopt (2)", P.label(sw, "Cerritos College"));

    // The request stays one row and never drops a checked exhibit.
    const many = Array.from({ length: 30 }, (_, i) => ({ title: "Long Industry Credential Title Number " + i, colleges: ["College " + i] }));
    const r1 = P.requestBody({ program: { id: "x" }, course: { code: "C 1", title: "Course" } }, many, { adopter_college: "Norco College", contact_email: "a@b.edu", note: "Thanks." });
    check("(a) past 600 characters, credentials carries a count and the note lists every title",
      r1.body && r1.body.credentials === "30 exhibits, listed in the note" && many.every((m) => r1.body.note.indexOf(m.title) >= 0) &&
      r1.body.note.length <= 2000 && /Thanks\.$/.test(r1.body.note) && r1.body.precedent.length <= 1200, r1.error || (r1.body && r1.body.credentials));
    const huge = Array.from({ length: 60 }, (_, i) => ({ title: "An Exceptionally Long Industry Credential Title For Testing " + i, colleges: [] }));
    const r2 = P.requestBody({ program: { id: "x" }, course: { code: "C 1" } }, huge, { adopter_college: "Norco College", contact_email: "a@b.edu" });
    check("(a) a list too long for one row is refused in words, never trimmed", !r2.body && /too long for one request/.test(r2.error), r2.error);
    check("(a) the card code holds no per-credential cap", !/ADOPT_LINKS_MAX|roepAdoptLinks/.test(SRC));
    w.close();
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
