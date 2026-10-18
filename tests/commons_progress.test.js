// commons_progress.js — the Commons' shared Progress view (S419, step 1 of Sam's Sheet 95 "build").
//
// The Program Requirements tab's 417 checks (tests/program_requirements.test.js) guard the lift
// itself: with the module loaded first, that view draws exactly what it drew. This file guards
// what only a SHARED module can get wrong, which no host's test sees:
//   - a second host, with its own section classes, gets the CSS written in its classes and a
//     style of its own, while the first host's stays untouched;
//   - a spec without a whole measure draws no whole band, and a spec whose headline read failed
//     says so in both numbers instead of drawing a zero;
//   - readStatus() refuses a status file that names no written_at, and reads fresh;
//   - steps() places You are here on the first milestone with anything left, and a left item
//     whose read failed keeps its milestone open;
//   - the host tab without the module (a failed lazy load) says so on the Progress view and
//     still draws its other views, instead of dying at load.
//
// Run from repo root: `npm test` (or `node tests/commons_progress.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const SRC = fs.readFileSync("program_requirements.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");

function boot(scripts, fetchFn) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="program-requirements-root">Loading</div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = fetchFn || function () { return new Promise(function () {}); };
  scripts.forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  return w;
}

// A host as small as one can be: sections are plain <details>, a count's control is a button.
function host(w, classes) {
  const d = w.document;
  function el(tag, attrs, kids) {
    const e = d.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] == null) return;
      if (k === "text") e.textContent = attrs[k]; else if (k === "cls") e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? d.createTextNode(c) : c); });
    return e;
  }
  const opened = [];
  return {
    classes: classes,
    section: function (key, title, meta, kids, opts) {
      opts = opts || {};
      return el("details", { cls: "x-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key, open: "" }, [
        el("summary", {}, [opts.label ? el("span", { cls: "x-label", text: opts.label }) : null, el(opts.h || "h3", { text: title }),
          meta ? el("span", { text: meta }) : null]),
        el("div", { cls: "x-body" }, kids)]);
    },
    goControl: function (words, to, cls) {
      const b = el("button", { cls: "x-word " + (cls || ""), type: "button", text: words });
      b.addEventListener("click", function () { opened.push(to); });
      return b;
    },
    callAnswered: function (c) { return !!c.answered; },
    callRecords: function () { return null; },
    callLinks: function () { return null; },
    goToCall: function () {},
    opened: opened
  };
}

// A project with two milestones, two parts and no whole measure.
function spec(extra) {
  return Object.assign({
    title: "A reference", sub: "Progress", lede: "Where it stands.",
    milestones: [
      { id: "first", title: "Find them", fact: function (x) { return x.found + " of " + x.all; },
        left: function (x) { return [[x.all - x.found, "item to find", "items to find", { view: "list" }]]; } },
      { id: "second", title: "Settle them", needs: ["settled"], fact: function (x) { return x.settled + " settled"; },
        left: function (x) { return [[x.settled == null ? null : x.all - x.settled, "item to settle", "items to settle"]]; } }
    ],
    parts: [
      { id: "finding", title: "Finding", status: function (x) { return x.found < x.all ? "going" : "done"; },
        what: function (x) { return x.found + " found."; }, foot: function () { return "Nightly."; },
        meter: function (x) { return [x.found, x.all, "found"]; }, open: function (x) { return ["Open the " + x.found, { view: "list" }]; } },
      { id: "settling", title: "Settling", needs: ["settled"], status: function () { return "not"; },
        what: function (x) { return x.settled + " settled."; }, foot: function () { return ""; } }
    ],
    partsTitle: "Parts of the work",
    headline: {
      label: "Every item, and the settled ones", needs: ["settled"],
      all: { n: function (x) { return x.all; }, words: "items", small: "The universe" },
      mine: { n: function (x) { return x.settled; }, words: "items settled", small: function (x) { return "At " + x.found + " places."; } },
      barLabel: function (x) { return x.settled + " of " + x.all + " settled"; },
      within: function (x) { return [{ n: x.found, words: " found" }]; }
    },
    sources: { settled: "The settled table", Q: "The status file (kb/status/a-reference.json)" }
  }, extra || {});
}
function ctx(CP, S, over) {
  const x = Object.assign({ all: 10, found: 7, settled: 3, errors: {}, now: new Date("2026-10-18T19:00:00Z"), decider: "Sam",
    Q: { written_at: "2026-10-18T18:15:53Z", session: 418, moniker: "SkyMadrone", run: "Sam's session", handoff: "docs/session_419_handoff.md",
      next_step: { title: "Step one", text: "Lift the view." }, calls: [{ title: "A call", text: "Waits.", link: "https://claude.ai/artifact/x" }],
      changes: [{ at: "2026-10-18T17:37:00Z", text: "The first saving run." }], headline: [{ day: "2026-10-08", active: 10, complete: 1, colleges: 1 }] } }, over || {});
  const st = CP.steps(S.milestones, x);
  x.steps = st.steps; x.here = st.here; x.next = st.next;
  return x;
}

// ── 1. the module alone, with a host of its own ────────────────────────────
{
  const w = boot([COMMONS]);
  const CP = w.CPL_COMMONS_PROGRESS;
  check("(1) the module exports its renderer, its status read and its arithmetic",
    !!CP && ["render", "readStatus", "steps", "partView", "wholeFacts", "since", "nextRun", "nextWeekly", "ensureCss"].every(function (k) { return typeof CP[k] === "function"; }));
  const classes = { sec: "x-sec", secBody: "x-body", secTitle: "x-title", secLabel: "x-label", quiet: "x-quiet", caution: "x-caution", lede: "x-lede" };
  const H = host(w, classes), S = spec();
  const node = CP.render(S, ctx(CP, S), { readAt: new Date("2026-10-18T19:00:00Z") }, H);
  w.document.body.appendChild(node);
  const txt = node.textContent;
  check("(1) the head carries the title, the run status and the headline pair",
    /A reference/.test(node.querySelector(".prh-pg-head h3").textContent) && /Last run S418 SkyMadrone \(Sam's session\)/.test(txt) &&
    node.querySelectorAll(".prh-pg-hl .prh-pg-n b").length === 2 && node.querySelectorAll(".prh-pg-hl .prh-pg-n b")[1].textContent === "3", txt.slice(0, 300));
  check("(1) a spec with no whole measure draws no whole band", !node.querySelector(".prh-pg-whole"));
  check("(1) the headline's bar and its Up from fact read the pair and the history",
    node.querySelector('.prh-pg-bar[aria-label="3 of 10 settled"]') && /Up from 1 complete on Oct 8/.test(node.querySelector(".prh-pg-within").textContent),
    node.querySelector(".prh-pg-within") && node.querySelector(".prh-pg-within").textContent);
  const steps = node.querySelectorAll(".prh-pg-steps > li");
  check("(1) You are here sits on the first milestone with anything left",
    steps.length === 2 && steps[0].getAttribute("aria-current") === "step" && /3 items to find/.test(node.querySelector(".prh-pg-left").textContent) &&
    /Next milestone/.test(steps[1].textContent), node.querySelector(".prh-pg-left").textContent);
  check("(1) the host's section pattern and count control are what the view uses",
    node.querySelectorAll("details.x-sec").length >= 4 && !!node.querySelector(".prh-pg-grid .x-word.prh-pg-open") &&
    node.querySelector(".prh-pg-waiting") && /1 call waiting on Sam/.test(node.querySelector(".prh-pg-meta").textContent));
  node.querySelector(".prh-pg-grid .x-word.prh-pg-open").click();
  check("(1) a count's control opens the host's own list", H.opened.length === 1 && H.opened[0].view === "list");
  check("(1) the host's quiet and lede classes are the ones it named",
    !!node.querySelector("p.x-lede.prh-pg-lede") && !node.querySelector(".prh-quiet") && !node.querySelector(".prh-lede"));
  const style = w.document.getElementById("cpg-css-x-sec");
  check("(1) the CSS is injected once, in the host's classes, with none of the default host's left in it",
    !!style && /\.prh-pg-road > \.x-body/.test(style.textContent) && /\.prh-pg-answered \.x-label/.test(style.textContent) &&
    /\.prh-pg-within \.x-quiet/.test(style.textContent) && !/prh-sec|prh-quiet/.test(style.textContent) && !/%\w+%/.test(style.textContent),
    style && style.textContent.slice(0, 200));
  CP.render(S, ctx(CP, S), {}, H);
  check("(1) a second render injects nothing more", w.document.querySelectorAll("style").length === 1);
  const H2 = host(w, null);
  CP.render(S, ctx(CP, S), {}, H2);
  const style2 = w.document.getElementById("cpg-css-prh-sec");
  check("(1) a second host with the default classes gets a style of its own, the first's untouched",
    !!style2 && /\.prh-pg-road > \.prh-sec-b/.test(style2.textContent) && w.document.getElementById("cpg-css-x-sec").textContent === style.textContent);
  check("(1) tokens only: no raw hex in the module's CSS", !/#[0-9a-fA-F]{3,8}\b/.test(CP.CSS), (CP.CSS.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" "));

  // a failed read says so in both numbers and keeps the milestone open
  const x2 = ctx(CP, S, { settled: null, errors: { settled: "the settled table answered 503" } });
  const n2 = CP.render(S, x2, {}, H);
  const bs = n2.querySelectorAll(".prh-pg-hl .prh-pg-n b");
  check("(1) a failed headline read says Could not be read twice and draws no bar",
    bs.length === 2 && bs[0].textContent === "Could not be read" && bs[1].textContent === "Could not be read" && !n2.querySelector(".prh-pg-hl .prh-pg-bar") &&
    /The settled table could not be read \(the settled table answered 503\)/.test(n2.querySelector(".prh-pg-hl").textContent));
  const st2 = n2.querySelectorAll(".prh-pg-steps > li");
  check("(1) a milestone whose read failed says so in its fact and stays open as the next one",
    st2[0].getAttribute("aria-current") === "step" && /Could not be read/.test(st2[1].querySelector(".prh-pg-fact").textContent) && /Next milestone/.test(st2[1].textContent));
  const n2b = CP.render(S, ctx(CP, S, { found: 10, settled: null, errors: { settled: "the settled table answered 503" } }), {}, H);
  check("(1) a left item whose read failed keeps You are here on its milestone and is named as unread",
    n2b.querySelectorAll(".prh-pg-steps > li")[1].getAttribute("aria-current") === "step" &&
    /Items to settle \(could not be read\)/.test(n2b.querySelector(".prh-pg-left").textContent), n2b.querySelector(".prh-pg-left").textContent);
  const part2 = Array.prototype.filter.call(n2.querySelectorAll(".prh-pg-grid > li"), function (li) { return li.querySelector("h4").textContent === "Settling"; })[0];
  check("(1) a part whose read failed reads Could not be read and offers no list",
    !!part2 && part2.classList.contains("prh-pg-unread") && !part2.querySelector(".prh-pg-open"));

  // no status file: the side column and the run status say where the words come from
  const n3 = CP.render(S, ctx(CP, S, { Q: null, errors: { Q: "kb/status/a-reference.json answered 404" } }), {}, H);
  check("(1) with no status file the run status and the side column name it",
    /The status file \(kb\/status\/a-reference\.json\) could not be read \(kb\/status\/a-reference\.json answered 404\)/.test(n3.querySelector(".prh-pg-meta").textContent) &&
    /could not be read/.test(n3.querySelector(".prh-pg-side").textContent) && !n3.querySelector(".prh-pg-side .prh-pg-call"));
}

// ── 2. readStatus and the arithmetic ────────────────────────────────────────
{
  const asked = [];
  const w = boot([COMMONS], function (url, opts) {
    asked.push([url, opts]);
    if (/no-stamp/.test(url)) return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ session: 1 }); } });
    if (/gone/.test(url)) return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ written_at: "2026-10-18T18:15:53Z", calls: [] }); } });
  });
  const CP = w.CPL_COMMONS_PROGRESS;
  const done = Promise.all([
    CP.readStatus("kb/status/ok.json").then(function (j) { check("(2) a sound status file is read, fresh", j.written_at === "2026-10-18T18:15:53Z" && asked[0][1].cache === "no-store"); },
      function (e) { check("(2) a sound status file is read, fresh", false, e.message); }),
    CP.readStatus("kb/status/no-stamp.json").then(function () { check("(2) a file with no written_at is refused", false); },
      function (e) { check("(2) a file with no written_at is refused", /kb\/status\/no-stamp\.json names no written_at/.test(e.message), e.message); }),
    CP.readStatus("kb/status/gone.json").then(function () { check("(2) a 404 is refused by its status", false); },
      function (e) { check("(2) a 404 is refused by its status", /kb\/status\/gone\.json answered 404/.test(e.message), e.message); })
  ]);
  check("(2) nextRun rolls the recorded firing past now by its period, and a one-time run that passed is gone",
    CP.nextRun({ next_run: { at: "2026-10-08T15:07:00Z", every_hours: 24 } }, new Date("2026-10-10T16:00:00Z")).toISOString() === "2026-10-11T15:07:00.000Z" &&
    CP.nextRun({ next_run: { at: "2026-10-08T15:07:00Z", every_hours: 0 } }, new Date("2026-10-10T16:00:00Z")) === null);
  check("(2) wholeFacts counts equal parts, averages halves, and refuses a malformed block",
    (function () {
      const defs = [{ id: "a", title: "A", note: "n" }, { id: "b", title: "B", note: "n", halves: [["x", "xs"], ["y", "ys"]] }];
      const w1 = CP.wholeFacts(defs, { day: "2026-10-18", parts: { a: [1, 4], b: { x: [1, 2], y: [0, 2] } } });
      return w1 && Math.abs(w1.share - 0.25) < 1e-9 && CP.wholeFacts(defs, { parts: { a: [1, 0], b: {} } }) === null && CP.wholeFacts(defs, null) === null;
    })());
  check("(2) since() reads the first recorded complete count and only once the pair grew past it",
    JSON.stringify(CP.since({ headline: [{ day: "2026-10-08", complete: 1 }, { day: "2026-10-09", checked: 5 }] }, 3)) === JSON.stringify({ day: "Oct 8", complete: 1 }) &&
    CP.since({ headline: [{ day: "2026-10-08", complete: 3 }] }, 3) === null && CP.since(null, 3) === null);
  check("(2) the status words are the shared vocabulary",
    CP.STATUS.going === "In progress" && CP.STATUS.not === "Not started" && CP.STATUS.call === "Waiting on ");
  module.exports = done;
}

// ── 3. the host without the module: a failed lazy load ───────────────────────
{
  const w = boot([SRC]);
  const M = w.CPL_PROGRAM_REQUIREMENTS;
  check("(3) the tab still boots without the module", !!M && typeof M.activate === "function");
  if (M) {
    M._state.registry = [{ college: "Norco College", catalog_url: "https://x", catalog_year: "2026-2027" }];
    M._state.records = [];
    M._state.progress = { queue: null, errors: {}, readAt: new Date() };
    M._state.view = "progress";
    M._render();
    const root = w.document.getElementById("program-requirements-root");
    check("(3) the Progress view says the module could not be loaded, in words",
      /commons_progress\.js\) could not be loaded/.test(root.textContent) && !!root.querySelector('.prh-empty[role="alert"]'), root.textContent.slice(0, 200));
    M._state.view = "catalogs";
    M._render();
    check("(3) the other views draw as usual", /Norco/.test(root.textContent) && !/could not be loaded/.test(root.textContent));
  }
}

// ── 4. the boot block loads the module first, in both HTMLs ──────────────────
{
  const re = /loadScript\('commons_progress\.js', 'CPL_COMMONS_PROGRESS', function \(\) \{\s*window\.CPL_TABS\.loadScript\('program_requirements\.js'/;
  check("(4) both HTMLs load commons_progress.js before program_requirements.js", re.test(DASH) && re.test(INDEX) && DASH === INDEX);
  check("(4) the host names the status file under kb/status/ and reads it through the module",
    /var QUEUE_URL = "kb\/status\/program-requirements\.json";/.test(SRC) && /CP\.readStatus\(QUEUE_URL\)/.test(SRC) && !/fetch\(QUEUE_URL/.test(SRC));
  check("(4) the Progress CSS lives in the module alone", !/"\.prh-pg-steps \{/.test(SRC) && /"\.prh-pg-steps \{/.test(COMMONS));
}

module.exports.then(function () {
  let pass = 0;
  results.forEach(function (r) { if (r[1]) pass++; console.log((r[1] ? "  ok  " : "  FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "\n        " + String(r[2]).slice(0, 400))); });
  console.log("\ncommons_progress.test.js: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
});
