// CPL Pathways: every view has an address (2026-11-04, "make that fix on all COBI views").
//
// A magic sign-in link opens a new browser tab, so only the address survives. The tab writes no address of its own
// (the dashboard routes tabs on location.hash); it reads one as a visit starts and reports the view on screen:
//   #cpl-pathways[/college/<name>][/pathway/<id> | /record/<control number> | /none][/term][/public][/curate][/mine]
//
// WHAT THIS GUARDS:
//   (1) each part opens its view: the College select, a featured map or baccalaureate by id, a catalog record by
//       control number, No pathway chosen, By term, Student or public, the college side of the student / college
//       toggle, the My College section;
//   (2) ⭐ the provider reports what is on screen after a switch, as an address (1) opens again;
//   (3) ⭐ the bare #cpl-pathways (the side menu, every other tab's link) opens as before and reports itself;
//   (4) a later visit on an address that names a view opens it; the header unlock's re-fire keeps the reader's pick;
//       an unknown id changes nothing;
//   (5) nothing is written to the address, and nothing about the view is stored.
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const MEM = fs.readFileSync("cpl_pathways_membership_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function page(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="cpl-pathways-root"></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "outside-only" });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.eval(SESSION);
  w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(MEM);
  w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_PATHWAYS_TAB.activate();
  return { w, local, root: w.document.getElementById("cpl-pathways-root") };
}
function ask(p) { p.w.CPL_SESSION.stashReturnTab("cpl-pathways"); return (JSON.parse(p.local.cpl_sb_return_tab) || {}).tab; }
function pathText(p) { const s = p.root.querySelector("select.cplpw-select"); const o = s && s.options[s.selectedIndex]; return o ? o.textContent : ""; }
function change(p, s, v) { s.value = v; s.dispatchEvent(new p.w.Event("change", { bubbles: true })); }
function pressed(p, value) { const b = p.root.querySelector('.cplpw-rseg button[data-value="' + value + '"]'); return b && b.getAttribute("aria-pressed") === "true"; }
function visit(p, hash) {
  p.w.dispatchEvent(new p.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } }));
  p.w.history.replaceState(null, "", hash);
  p.w.dispatchEvent(new p.w.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-pathways" } }));
}

(function () {
  const D = new JSDOM("", { runScripts: "outside-only" }).window;
  D.eval(DATA); D.eval(ROEP); D.eval(BACC);
  const featured = D.CPL_PATHWAYS.programs, bacc = D.CPL_BACCALAUREATES.programs, recs = D.CPL_PATHWAYS_ROEP.programs;
  const F2 = featured[1], B = bacc.find((x) => x.control && /Fullerton/.test(x.college)) || bacc[0], R = recs[1];

  // (3) the bare address: the first pathway, All colleges, as before
  const bare = page("#cpl-pathways");
  const firstText = pathText(bare);
  check("(3) ⭐ the bare #cpl-pathways opens All colleges on the first pathway",
    bare.root.querySelector("select.cplpw-colsel").value === "" && new RegExp(featured[0].college).test(firstText), firstText);
  check("(3) ⭐ the bare tab reports itself", ask(bare) === "cpl-pathways", ask(bare));

  // (1) + (2) a featured map by id
  const a = page("#cpl-pathways/pathway/" + F2.id);
  check("(1) /pathway/<id> opens that featured map", pathText(a).indexOf(F2.program || "") >= 0 && !!(F2.program), pathText(a));
  check("(2) it reports cpl-pathways/pathway/<id>", ask(a) === "cpl-pathways/pathway/" + F2.id, ask(a));
  change(a, a.root.querySelector("select.cplpw-colsel"), F2.college);
  check("(2) with a college picked, it reports the college and the pathway",
    ask(a) === "cpl-pathways/college/" + encodeURIComponent(F2.college) + "/pathway/" + F2.id, ask(a));
  change(a, a.root.querySelector("select.cplpw-select"), "");
  check("(2) No pathway chosen reports none", ask(a) === "cpl-pathways/college/" + encodeURIComponent(F2.college) + "/none", ask(a));

  // (1) a college and none
  const n = page("#cpl-pathways/college/" + encodeURIComponent(F2.college) + "/none");
  check("(1) /college/<name>/none opens the college with no pathway chosen",
    n.root.querySelector("select.cplpw-colsel").value === F2.college && n.root.querySelector("select.cplpw-select").value === ""
    && /No pathway chosen/.test(n.root.textContent));
  check("(1) an arrived college is the shared choice too, as a pick is",
    n.w.CPL_COLLEGE_CHOICE && n.w.CPL_COLLEGE_CHOICE.college === F2.college && n.w.CPL_COLLEGE_CHOICE.by === "cpl-pathways");

  // (1) + (2) a catalog record, By term, Student or public
  const r = page("#cpl-pathways/college/" + encodeURIComponent(R.college) + "/record/" + R.control_number + "/term/public");
  check("(1) /record/<control> opens that catalog record", !!r.root.querySelector(".cplpw-roep")
    && (r.root.querySelector(".cplpw-rprog h2") || {}).textContent === R.title, pathText(r));
  check("(1) /term and /public open By term and Student or public", pressed(r, "term") && pressed(r, "public"));
  check("(2) it reports every part", ask(r) === "cpl-pathways/college/" + encodeURIComponent(R.college) + "/record/" + R.control_number + "/term/public", ask(r));
  r.root.querySelector('.cplpw-rseg button[data-value="req"]').dispatchEvent(new r.w.Event("click", { bubbles: true }));
  r.root.querySelector('.cplpw-rseg button[data-value="college"]').dispatchEvent(new r.w.Event("click", { bubbles: true }));
  check("(2) back to By requirement and College, the words drop", ask(r) === "cpl-pathways/college/" + encodeURIComponent(R.college) + "/record/" + R.control_number, ask(r));

  // (1) + (2) a baccalaureate with the membership view, on its college side
  const b = page("#cpl-pathways/pathway/" + B.id + "/curate");
  const box = b.root.querySelector(".cplccr");
  check("(1) /curate opens the baccalaureate on the college side of the toggle",
    box && box.classList.contains("view-college") && box.querySelectorAll(".ccr-vt")[1].getAttribute("aria-pressed") === "true");
  check("(2) it reports cpl-pathways/pathway/<id>/curate", ask(b) === "cpl-pathways/pathway/" + B.id + "/curate", ask(b));
  box.querySelectorAll(".ccr-vt")[0].dispatchEvent(new b.w.Event("click"));
  check("(2) switched to the student side, curate drops", ask(b) === "cpl-pathways/pathway/" + B.id, ask(b));

  // (1) + (2) My College open
  const m = page("#cpl-pathways/college/" + encodeURIComponent(F2.college) + "/mine");
  const det = m.root.querySelector("details.cplpw-mycollege");
  check("(1) /mine opens the My College section", det && det.open && !det.hidden);
  check("(2) it reports the college and mine", /^cpl-pathways\/college\/[^/]+\/pathway\/[^/]+\/mine$/.test(ask(m)), ask(m));
  det.open = false; det.dispatchEvent(new m.w.Event("toggle"));
  check("(2) closed, mine drops", !/\/mine$/.test(ask(m)), ask(m));

  // (4) a later visit, the unlock's re-fire, an unknown id
  visit(bare, "#cpl-pathways/pathway/" + F2.id);
  check("(4) a later visit on /pathway/<id> opens it", pathText(bare).indexOf(F2.program) >= 0, pathText(bare));
  change(bare, bare.root.querySelector("select.cplpw-select"), "0");
  bare.w.dispatchEvent(new bare.w.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-pathways" } }));
  check("(4) the unlock's re-fire on the same visit keeps the reader's pick", new RegExp(featured[0].college).test(pathText(bare)) && pathText(bare).indexOf(F2.program) < 0, pathText(bare));
  visit(bare, "#cpl-pathways");
  check("(4) a later visit by the bare address keeps the reader's place, as before", new RegExp(featured[0].college).test(pathText(bare)));
  const u = page("#cpl-pathways/pathway/no-such-pathway/record/00000");
  check("(4) an unknown id leaves the first pathway", pathText(u) === firstText, pathText(u));

  // (5) the address is never written, nothing is stored
  check("(5) nothing is written to the address", a.w.location.hash === "#cpl-pathways/pathway/" + F2.id && r.w.location.hash.indexOf("/term/public") > 0);
  check("(5) nothing about the view is stored",
    [a, r, b, m].every((p) => !Object.keys(p.local).some((k) => k !== "cpl_sb_return_tab" && /path|view|college|record/i.test(k))));

  [bare, a, n, r, b, m, u].forEach((p) => p.w.close());
  let pass = 0;
  for (const [nm, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + nm + (!ok && why ? "  — " + why : "")); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
