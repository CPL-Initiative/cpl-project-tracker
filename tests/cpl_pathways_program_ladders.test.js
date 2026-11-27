// CPL Pathways: the stack of programs at the top of a catalog record (Sam, 2026-11-27).
//
// Sam: "is it feasible to add a section ... that could expand to show a program such as the field iron worker BS that
// the AS feeds into?", then "would be nice to see a very compact set of cards in a top section of the pathway view
// showing the stackable possibilities". kb/_build_program_ladders.py files kb/status/program_ladders/<slug>.json; the
// record view reads its college's file and draws one row of cards above the requirement blocks.
//
// WHAT THIS GUARDS:
//   (a) Cerritos's A.S. 42158 shows, in stack order, the Reinforcing and Structural certificates, then the A.S. named
//       "This program" in words, then the planned B.S., and the row sits above the requirement blocks;
//   (b) each card carries a short award word, units where the record has them, and the kind in words;
//   (c) a certificate record shows its degree with the "Every course carries in" chip, and Why opens the counts in
//       place (aria-expanded);
//   (d) a card's link is the tab's own address for that program: a record by control number, the curated B.S. by its
//       featured pathway id; and that address opens the program;
//   (e) a missing ladder file, or no fetch at all, draws no section and throws nothing;
//   (f) no raw hex in the section's CSS.
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_program_ladders.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const MEM = fs.readFileSync("cpl_pathways_membership_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const DIR = "kb/status/program_ladders/";

// A fetch that serves the committed ladder files and refuses everything else (the table read falls back to the file).
function serve(w, missing) {
  w.fetch = function (url) {
    const u = String(url);
    if (u.indexOf(DIR) === 0 && !missing) {
      const p = path.join(DIR, u.slice(DIR.length));
      if (fs.existsSync(p)) {
        const body = JSON.parse(fs.readFileSync(p, "utf8"));
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
      }
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  };
}
function bare(opts) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  if (!opts || !opts.noFetch) serve(w, opts && opts.missing);
  w.eval(DATA); w.eval(ROEP); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  return w;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 6; i++) await tick(); }
function cards(root) {
  return [...root.querySelectorAll(".cplpw-rstack li")].map((li) => ({
    title: li.querySelector(".st").textContent, award: li.querySelector(".sa").textContent,
    kind: li.querySelector(".sk").textContent, href: (li.querySelector("a.st") || {}).getAttribute ? li.querySelector("a.st").getAttribute("href") : null,
    here: li.classList.contains("here"), li
  }));
}

(async function () {
  const w = bare(), T = w.CPL_PATHWAYS_TAB, root = w.document.getElementById("cpl-pathways-root");
  const A = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158");
  T._renderRoepProgram(root, A);
  await settle();
  const c = cards(root);
  // (a) the order
  check("(a) Cerritos 42158: the Reinforcing and Structural certificates, then This program, then the B.S.",
    c.length === 4 && /Reinforcing/.test(c[0].title) && /Structural/.test(c[1].title) && c[2].here && c[2].kind === "This program"
      && c[3].title === "B.S., Field Ironworker Supervisor", JSON.stringify(c.map((x) => [x.title, x.kind])));
  check("(a) this program is named in words, never by its border alone",
    c[2] && c[2].kind === "This program" && c[2].li.getAttribute("aria-current") === "true" && !c[2].li.querySelector("a"));
  const sec = root.querySelector(".cplpw-rstack"), grid = root.querySelector(".cplpw-rgrid");
  check("(a) the row sits above the requirement blocks, under the program card",
    !!sec && !!grid && !sec.hidden && (sec.compareDocumentPosition(grid) & w.Node.DOCUMENT_POSITION_FOLLOWING)
      && sec.previousElementSibling && sec.previousElementSibling.classList.contains("cplpw-rprog"));
  // (b) the words on a card
  check("(b) the certificates read Certificate with their units, and Every course carries in",
    c[0] && c[0].award === "Certificate · 34 units" && c[0].kind === "Every course carries in" && c[1].award === "Certificate · 38 units",
    c[0] && [c[0].award, c[1].award]);
  check("(b) the A.S. reads A.S. with its units", c[2] && /^A\.S\. · 34–38 units$/.test(c[2].award), c[2] && c[2].award);
  check("(b) the B.S. reads B.S. and Planned", c[3] && c[3].award === "B.S." && c[3].kind === "Planned", c[3] && [c[3].award, c[3].kind]);
  // (d) the links
  check("(d) a certificate opens its record at its college", c[0] && c[0].href === "#cpl-pathways/college/Cerritos%20College/record/36002", c[0] && c[0].href);
  check("(d) the planned B.S. opens the featured pathway", c[3] && c[3].href === "#cpl-pathways/college/Cerritos%20College/pathway/cerritos-field-ironworker-bs", c[3] && c[3].href);
  const why = c[3] && c[3].li.querySelector("button");
  why && why.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(c) Why opens the reason in place, aria-expanded",
    !!why && why.getAttribute("aria-expanded") === "true" && !c[3].li.querySelector(".sw").hidden && /First cohort Spring 2027/.test(c[3].li.querySelector(".sw").textContent));

  // (c) a certificate record: its degree with the every-course chip
  const cert = Object.assign({}, A, { key: "cerritos_36002", control_number: "36002", title: "Apprenticeship: Field Ironworkers Reinforcing",
    award: "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units" });
  T._renderRoepProgram(root, cert);
  await settle();
  const k = cards(root);
  check("(c) a certificate shows This program, then its degree with Every course carries in",
    k.length === 2 && k[0].here && k[1].title === "Apprenticeship: Field Ironworkers" && k[1].kind === "Every course carries in"
      && k[1].href === "#cpl-pathways/college/Cerritos%20College/record/42158", JSON.stringify(k.map((x) => [x.title, x.kind, x.href])));
  const b = k[1] && k[1].li.querySelector("button");
  check("(c) Why starts closed", !!b && b.getAttribute("aria-expanded") === "false" && k[1].li.querySelector(".sw").hidden);
  b && b.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(c) and gives the shared count", /16 of this certificate’s 16 courses/.test(k[1].li.querySelector(".sw").textContent));

  // (e) a missing file, and no fetch
  for (const [label, opts] of [["a missing file", { missing: true }], ["no fetch", { noFetch: true }]]) {
    const m = bare(opts), mr = m.document.getElementById("cpl-pathways-root");
    let threw = null;
    try { m.CPL_PATHWAYS_TAB._renderRoepProgram(mr, A); await settle(); } catch (e) { threw = e; }
    const s = mr.querySelector(".cplpw-rstack");
    check("(e) " + label + ": no section shows and nothing throws", !threw && (!s || s.hidden) && !mr.querySelector(".cplpw-rstack li") && !!mr.querySelector(".cplpw-rgrid"), threw && threw.message);
  }

  // (d) the card's address opens that program, by the tab's own address reading
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="cpl-pathways-root"></div></body></html>',
    { url: "https://example.org/index.html#cpl-pathways/college/Cerritos%20College/record/42158", runScripts: "outside-only" });
  const p = dom.window, bag = (o) => ({ getItem: (x) => (x in o ? o[x] : null), setItem: (x, v) => { o[x] = String(v); }, removeItem: (x) => { delete o[x]; } });
  Object.defineProperty(p, "localStorage", { value: bag({}), configurable: true });
  Object.defineProperty(p, "sessionStorage", { value: bag({}), configurable: true });
  serve(p);
  p.eval(SESSION); p.eval(DATA); p.eval(ROEP); p.eval(BACC); p.eval(MEM); p.eval(SRC);
  require("./cpl_pathways_drive.js").withList(p);
  p.Element.prototype.scrollIntoView = function () {};
  p.CPL_PATHWAYS_TAB.activate();
  await settle();
  const pr = p.document.getElementById("cpl-pathways-root");
  const pc = cards(pr);
  check("(d) the A.S.'s address opens it with its stack", pc.length === 4 && pc[2].here, pc.length);
  const go = pc[3] && pc[3].href;
  p.dispatchEvent(new p.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } }));
  p.history.replaceState(null, "", go || "#x");
  p.dispatchEvent(new p.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-pathways" } }));
  await settle();
  const head = pr.querySelector(".cplpw-path");
  check("(d) the planned B.S. card's address opens the Field Ironworker Supervisor pathway",
    !!head && /Field Ironworker Supervisor/.test(head.textContent) && !pr.querySelector(".cplpw-rstack li.here"), head && head.textContent.slice(0, 120));

  // (f) tokens only
  const css = (SRC.match(/var STACK_CSS = \[[\s\S]*?\]\.join/) || [""])[0];
  check("(f) the section's CSS uses tokens, no raw hex", css.length > 200 && !/#[0-9a-fA-F]{3,8}\b/.test(css));

  let failed = 0;
  for (const [name, ok, why2] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why2 !== undefined ? "  [" + (typeof why2 === "string" ? why2 : JSON.stringify(why2)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways program ladders");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log("FAIL threw: " + (e && e.stack)); process.exit(1); });
