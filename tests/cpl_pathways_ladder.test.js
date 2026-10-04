// CPL Pathways: the Cerritos Ironworker ladder, high school to career.
//
// Sam, 2026-10-04, after mock-up 1: "port it to CPL Pathways. Add a simple
// graphical map summarizing the steps leading to career at the beginning.
// Allow a click through to the sections of the steps."
//
// Guards the failure modes that would let the view look right and be wrong:
//   (a) the step map lists every step in order, and each step reaches its own
//       section (a missing id is a dead click);
//   (b) a click scrolls to the section and moves focus to its heading, and no
//       step is a #hash link (the dashboard routes tabs on location.hash);
//   (c) the associate degree and certificate figures come from the display
//       build, the file Sierra's figures come from, and the stale hand-built
//       "27–29 major units" appears nowhere;
//   (d) every curated line carries its word label, In our data or To confirm;
//   (e) a missing display build says so instead of printing a zero;
//   (f) the full tab boot loads the build and opens on the ladder, and the
//       B.S. step's button opens the B.S. course map.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function freshWindow(withRoep) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  w.eval(DATA);
  if (withRoep) w.eval(ROEP);
  w.eval(SRC);
  w.__scrolled = [];
  w.Element.prototype.scrollIntoView = function () { w.__scrolled.push(this.id || this.className); };
  return w;
}

function ladderOf(w) { return w.CPL_PATHWAYS.programs.find((p) => p.kind === "ladder"); }

// ── (a)-(d) the ladder rendered with the display build ──
{
  const w = freshWindow(true);
  const prog = ladderOf(w);
  const root = w.document.getElementById("cpl-pathways-root");
  const opened = [];
  w.CPL_PATHWAYS_TAB._renderLadder(root, prog, null, (id) => opened.push(id));
  const text = root.textContent;

  const steps = [...root.querySelectorAll(".cplpw-lmap button.cplpw-lstep")];
  check("(a) the map opens the view, before the first step section",
    !!root.querySelector(".cplpw-lmap") &&
    root.querySelector(".cplpw-lmap").compareDocumentPosition(root.querySelector(".cplpw-lsec")) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  check("(a) the map carries all seven steps", steps.length === 7, steps.length);
  check("(a) the steps run start to career",
    steps.map((b) => b.getAttribute("data-step")).join(",") === "start,noncredit,apprenticeship,certificates,associate,bachelor,career",
    steps.map((b) => b.getAttribute("data-step")).join(","));
  check("(a) every step reaches a section of its own",
    steps.every((b) => !!root.querySelector("#cplpw-step-" + b.getAttribute("data-step"))));
  check("(a) the map is a labeled nav", root.querySelector("nav.cplpw-lmap").getAttribute("aria-label") === "Steps from high school to career");

  const assoc = steps.find((b) => b.getAttribute("data-step") === "associate");
  if (assoc) assoc.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(b) a click scrolls to that step's section", w.__scrolled.includes("cplpw-step-associate"), w.__scrolled.join(","));
  check("(b) and moves focus to its heading",
    w.document.activeElement && w.document.activeElement.tagName === "H3" &&
    /Field Ironworkers/.test(w.document.activeElement.textContent));
  check("(b) no step is a #hash link", root.querySelectorAll('.cplpw-lmap a[href^="#"]').length === 0);
  check("(b) every step names its place in the sequence for a screen reader",
    steps.every((b, i) => b.getAttribute("aria-label").startsWith("Step " + (i + 1) + " of 7: ")));

  const rec = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === prog.roep_key);
  const fig = rec.display.figure;
  check("(c) the associate figure is the display build's",
    text.includes("up to " + fig.up_to + " of the " + fig.total.min + "–" + fig.total.max + " major units"), fig);
  check("(c) the map line agrees", !!assoc && assoc.textContent.includes("Up to " + fig.up_to + " of " + fig.total.min + "–" + fig.total.max + " units"));
  const sums = [...root.querySelectorAll(".cplpw-lblock .bsum")].map((n) => n.textContent);
  check("(c) the three blocks sum from the record (core 16.5 of 19, Reinforcing 15 of 15, Structural 0 of 19)",
    sums.join(" | ") === "16.5 of 19 units through CPL | 15 of 15 units through CPL | 0 of 19 units through CPL", sums.join(" | "));
  check("(c) Reinforcing certificate: 34 units, up to 31.5", /Reinforcing \(control number 36002\), 34 units: up to 31\.5 through CPL/.test(text));
  check("(c) Structural certificate: 38 units, up to 16.5", /Structural \(control number 36003\), 38 units: up to 16\.5 through CPL/.test(text));
  check("(c) the stale '27–29 major units' appears nowhere in the ladder", !/27\s*[–-]\s*29/.test(text));
  check("(c) the footer names the build Sierra reads", text.includes("display build " + rec.display.build));
  const rows = root.querySelectorAll(".cplpw-ltable tbody tr");
  check("(c) 24 course rows, each with a row header", rows.length === 24 && [...rows].every((r) => r.querySelector('th[scope="row"]')));
  check("(c) Welding I shows no CPL yet",
    [...rows].some((r) => /IWAP 40\.10/.test(r.textContent) && /None yet/.test(r.textContent)));

  const points = prog.steps.flatMap((s) => s.points || []);
  const confirms = points.filter((p) => p.s === "confirm").length;
  check("(d) one To confirm label per curated lead, plus the legend's",
    root.querySelectorAll(".cplpw-lpoints .cplpw-lchip.confirm").length === confirms, confirms);
  check("(d) every curated point carries a word label",
    [...root.querySelectorAll(".cplpw-lpoints li")].every((li) => /In our data|To confirm/.test(li.textContent)));
  check("(d) the 'before this goes public' list names each lead to read",
    root.querySelectorAll(".cplpw-lconfirm li").length === prog.confirm.length);
  check("(d) Sam's word: datasets, never scrape", !/scrape/i.test(text));

  const open = root.querySelector("#cplpw-step-bachelor button.cplpw-lopen");
  check("(f) the B.S. step carries an open button", !!open);
  if (open) open.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(f) the B.S. step opens the B.S. course map", opened.join(",") === "cerritos-field-ironworker-bs", opened.join(","));
}

// ── (e) no display build ──
{
  const w = freshWindow(false);
  const root = w.document.getElementById("cpl-pathways-root");
  w.CPL_PATHWAYS_TAB._renderLadder(root, ladderOf(w), null, null);
  const text = root.textContent;
  check("(e) a missing build says the record did not load", /The A\.S\. record did not load/.test(text));
  check("(e) and prints no zero figure for the degree", !/up to 0 of/.test(text));
  check("(e) the map still lists all seven steps", root.querySelectorAll(".cplpw-lmap button").length === 7);
}

// ── (f) the full tab boot ──
{
  const w = freshWindow(false);
  const loads = [];
  w.CPL_TABS = { loadScript: function (src, globalName, cb) {
    loads.push(src);
    if (src === "cpl_pathways_roep_data.js") w.eval(ROEP);
    cb();
  } };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  check("(f) the tab loads the display build when a ladder is listed", loads.includes("cpl_pathways_roep_data.js"), loads.join(","));
  check("(f) the tab opens on the ladder", !!root.querySelector(".cplpw-lmap") && /From high school to the job site/.test(root.textContent));
  const sel = root.querySelector("select.cplpw-select");
  check("(f) the selector lists the ladder first", sel && /Field Ironworkers, high school to career/.test(sel.options[0].textContent));
  const open2 = root.querySelector("#cplpw-step-bachelor button.cplpw-lopen");
  if (open2) open2.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(f) the open button switches the view to the B.S. course map",
    /Field Ironworker Supervisor/.test(root.textContent) && !root.querySelector(".cplpw-lmap"));
  check("(f) and the selector follows", !!sel && sel.options[sel.selectedIndex] && /Field Ironworker Supervisor/.test(sel.options[sel.selectedIndex].textContent));
}

const failed = results.filter((r) => !r[1]);
for (const [name, ok, why] of results) console.log(`${ok ? "  ✓" : "  ✗"} ${name}${ok || why === undefined ? "" : " — " + JSON.stringify(why).slice(0, 300)}`);
console.log(`cpl_pathways_ladder: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
