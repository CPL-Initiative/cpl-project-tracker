// How to meet it, and the college panel's titles, memo and statute (Sam,
// 2026-10-15, calls 4, 5 and 6 on the one public funding page).
//
//   call 4: My CPL Funding keeps one text, so the four How to meet it passages
//           join it (mc_how_coord, mc_how_part, mc_how_vet, mc_how_exhibits);
//   call 5: each minimum condition carries the words How to meet it, in the
//           college panel and in the explainer's Eligibility requirements,
//           opening a dialog with the passage (focus in, Escape closes, focus
//           returns); the confirmation passage ends with Confirm now, which
//           opens the college's confirmation form;
//   call 6: ESS 25-82 links the memo, "max award" follows the amount, the
//           implementation tag links Ed. Code §78093.2, and each priority's
//           title and award sit together, a step larger.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_how_to_meet_it.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const MEMO = "https://www.cccco.edu/-/media/CCCCO-Website/docs/memo/ess-25-82-credit-for-prior-learning-funding-a11y.pdf";
const STATUTE = "https://california.public.law/codes/education_code_section_78093.2";

function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    (opts.explainer ? '<div id="cplFundStep1Mount"></div>' : "") +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div><div id="college-briefing-root"></div><div id="panel"></div></body></html>',
    { url: "https://example.org/" + (opts.explainer ? "funding-model/" : ""), runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  if (opts.explainer) { w.CPL_FUNDING_PUBLIC = true; w.CPL_FUNDING_EMBED = "college"; }
  w.fetch = function () { return new Promise(function () {}); };
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "team_phrase.js", "college_briefing.js"].forEach(run);
  const T = w.CPL_FUNDING_TAB, B = w.CPL_COLLEGE_BRIEFING;
  T.boot();
  T.render();
  return { w, doc: w.document, T, B };
}

// ── the panel (calls 5 and 6), as the funding pages draw it ───────────────
{
  const { w, doc, T, B } = setup();
  const KEY = w.CPL_FUNDING.colleges.find((c) => !/NOCE|Continuing|Calbright/i.test(c.college)).college;
  const el = doc.getElementById("panel");
  B.fundingPanel(el, KEY);
  const seed = Array.from(el.querySelectorAll(".cb-fbox header")).find((h) => /Seed Funding/.test(h.textContent));
  const impl = Array.from(el.querySelectorAll(".cb-fbox header")).find((h) => /Implementation Funding/.test(h.textContent));
  const memo = seed && seed.querySelector(".cb-tagword a");
  check("6a: ESS 25-82 links the memo, in a new tab, and the date stays",
    !!memo && memo.getAttribute("href") === MEMO && memo.textContent === "ESS 25-82" &&
    memo.getAttribute("target") === "_blank" && /, distributed spring 2026$/.test(seed.querySelector(".cb-tagword").textContent));
  const law = impl && impl.querySelector(".cb-tagword a");
  check("6b: the implementation tag is the statute, linked where max award was",
    !!law && law.getAttribute("href") === STATUTE && /Ed\. Code §78093\.2/.test(law.textContent) &&
    !/max award/.test(impl.querySelector(".cb-tagword").textContent));
  const big = impl && impl.parentNode.querySelector(".cb-fbig");
  check("6c: max award follows the amount it names",
    !!big && /^\$[\d,]+ max award$/.test(big.textContent.trim()) && !!big.querySelector(".cb-fbig-k"));
  const css = (doc.getElementById("cb-css") || doc.querySelector("style[data-cb]") || { textContent: "" }).textContent ||
    Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  check("6d: a priority's title and award sit together, a step larger, the award in the strong text color",
    /\.cb-prow \.cb-whead\{justify-content:flex-start;[^}]*font-size:1\.05rem;\}/.test(css) &&
    /\.cb-prow \.cb-whead \.v\{font-weight:600;color:var\(--text-strong\);font-size:1\.05rem;\}/.test(css));

  const how = Array.from(el.querySelectorAll("ol.cb-conds button.cb-howto"));
  check("5a: every minimum condition carries How to meet it, as a button that opens a dialog",
    how.length === el.querySelectorAll("ol.cb-conds > li").length && how.length >= 2 &&
    how.every((b) => b.textContent === "How to meet it" && b.getAttribute("aria-haspopup") === "dialog"));
  const coordBtn = how.find((b) => b.getAttribute("data-howto") === "coord");
  coordBtn.focus();
  coordBtn.click();
  const dlg = doc.getElementById("cplFundHowTo");
  check("5b: the dialog opens on its own heading, named for the college",
    !!dlg && dlg.hasAttribute("open") && doc.activeElement === dlg.querySelector("#cplFundHowToH") &&
    /Name your CPL Coordinator in MAP/.test(dlg.querySelector("h2").textContent) &&
    dlg.getAttribute("aria-labelledby") === "cplFundHowToH");
  const ol = dlg.querySelector(".cplfund-howto-body ol");
  check("5c: the passage renders as a block: its steps a numbered list, its link a link in a new tab",
    !!ol && ol.querySelectorAll("li").length === 3 &&
    !!dlg.querySelector('.cplfund-howto-body a[href="https://map.rccd.edu/get-involved/"][target="_blank"][rel="noopener"]'));
  dlg.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("5d: Escape closes it, and focus returns to the words", !dlg.hasAttribute("open") && doc.activeElement === coordBtn);

  const partBtn = how.find((b) => b.getAttribute("data-howto") === "part");
  partBtn.click();
  check("5e: the confirmation passage names the deadline and ends with Confirm now",
    /Confirm by [A-Z][a-z]+ \d{1,2}, \d{4}\./.test(dlg.textContent) &&
    !!dlg.querySelector("button[data-howtoconfirm]") && dlg.querySelector("button[data-howtoconfirm]").textContent === "Confirm now");
  dlg.querySelector("button[data-howtoconfirm]").click();
  check("5f: Confirm now closes the dialog and opens the college's confirmation form in the table",
    !dlg.hasAttribute("open") && T._state.collegeView === "all" && !!T._state.open["c:" + KEY]);

  // A curator's edit reaches the dialog; a link an author types is escaped.
  T._setShared({ text: { mc_how_coord: "Step one, see [the <b>office</b>](https://example.org/a?b=1&c=\"2\") " +
    "and [never](javascript:alert(1)).\n\n1. First\n2. Second" } });
  T.render();
  coordBtn.isConnected ? coordBtn.click() : el.querySelector('[data-howto="coord"]').click();
  const body = dlg.querySelector(".cplfund-howto-body");
  check("4a: the passage is the one text, so a curator's edit reaches the dialog", /Step one/.test(body.textContent));
  check("4b: an author's link is escaped, and only an http(s) address becomes one",
    !body.querySelector("b") && body.querySelectorAll("a").length === 1 &&
    !/javascript:/.test(body.querySelector("a").getAttribute("href")) && /javascript:alert/.test(body.textContent));
  T._setShared({});
  T.render();
  check("4c: the four passages are My CPL Funding text, each with a house default",
    ["mc_how_coord", "mc_how_part", "mc_how_vet", "mc_how_exhibits"].every((k) => {
      const h = T.mcBlockHtml(k, {});
      return h && h.length > 100 && !T.textIsCustom(k);
    }));
}

// ── the JST line, masked as the counts ADR requires ───────────────────────
{
  const { w, doc, T } = setup();
  const names = w.CPL_FUNDING.colleges.filter((c) => !/NOCE|Continuing|Calbright/i.test(c.college)).map((c) => c.college);
  const [A, Bn, C] = names;
  const star = {}; star[A] = true;
  const vj = {}; vj[Bn] = { vets: 140, jst: 61, pct: 61 / 140 }; vj[C] = { vets: 0, jst: 0, vets_suppressed: true, jst_suppressed: true };
  w.CPL_FUNDING_PERF = { as_of: "2026-10-15", vet_star: star, vet_jst: vj, vet_star_threshold: 0.75, suppress_below: 10 };
  const text = (c) => { T.howToOpen("vetstar", c, {}); return doc.getElementById("cplFundHowTo").textContent; };
  check("5g: a college that meets the JST condition is told so", /meets this condition today\./.test(text(A)));
  check("5h: a college short of it sees its counts and percent", /MAP holds 61 JSTs for 140 enrolled veterans at .+ \(44%\)\./.test(text(Bn)));
  const masked = text(C);
  check("5i: a masked count shows no count and no percent", /fewer than \d+ JSTs or enrolled veterans/.test(masked) && !/%\)/.test(masked));
  // The noncredit-only institutions are the feeders' rows, by their short names.
  check("5j: a noncredit-only institution's veteran condition opens the exhibits steps",
    /Post noncredit certificates as exhibits in MAP/.test(text("Calbright")));
}

// ── the explainer's Eligibility requirements, and My College's Confirm now ──
{
  const html = read("funding-model/index.html");
  check("5k: the explainer's Eligibility requirements offer How to meet it from the funding module",
    /hb\.className = "cplfund-howto-w"; hb\.textContent = "How to meet it";/.test(html) && /TT\.howToOpen\(kind,/.test(html));
  const { w, doc, T } = setup();
  const KEY = w.CPL_FUNDING.colleges[0].college;
  T.howToOpen("part", KEY, { surface: "mycollege" });
  const a = doc.querySelector("#cplFundHowTo a.cplfund-howto-go");
  check("5l: on My College, Confirm now opens the college's row on the public funding page",
    !!a && a.textContent === "Confirm now" &&
    a.getAttribute("href") === "funding-model/?college=" + encodeURIComponent(KEY) + "&confirm=1#institutions");
}
{
  // My CPL Funding moved to the funding page (Sam, 2026-10-21: "move funding to
  // Implementation Funding"): the block draws there by the roster's key, and
  // its How to meet it opens the college's own steps, with Confirm now opening
  // the row's form on the same page.
  const { w, doc, B } = setup();
  const KEY = w.CPL_FUNDING.colleges.find((c) => /^Laney$|^Chaffey$|^Cabrillo$/.test(c.college)).college;
  const root = doc.getElementById("college-briefing-root");
  const drew = B.fundingPanel(root, KEY);
  const part = root.querySelector('[data-howto="part"]');
  if (part) part.click();
  const go = doc.querySelector("#cplFundHowTo button.cplfund-howto-go[data-howtoconfirm]");
  check("5n: on the funding page, the college's block opens its own steps and Confirm now",
    drew && !!part && !!go && new RegExp(KEY).test(doc.getElementById("cplFundHowTo").textContent) &&
    !!doc.querySelector("#cplFundHowTo .cplfund-howto-who"));
}
{
  // The link it opens: the table shows and the row's confirmation form opens.
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="cplFundStep1Mount"></div><div id="cplFundingMount"></div></body></html>',
    { url: "https://example.org/funding-model/?college=" + encodeURIComponent("Cabrillo") + "&confirm=1", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {}; w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true; w.CPL_FUNDING_PUBLIC = true; w.CPL_FUNDING_EMBED = "college";
  w.fetch = function () { return new Promise(function () {}); };
  w.localStorage.setItem("cplfund_one_choice_v1", w.CPL_FUNDING ? "" : "Cabrillo");
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js"].forEach(run);
  w.CPL_FUNDING_TAB.boot();
  const wrap = Array.from(w.document.querySelectorAll("[data-optinwrap]")).find((x) => /Cabrillo/.test(x.getAttribute("data-optinwrap")));
  check("5m: ?college=…&confirm=1 lands on the table with that row's confirmation form open, whatever choice the browser remembers",
    w.CPL_FUNDING_TAB._state.collegeView === "all" && !!wrap && !!wrap.querySelector('[data-optinfield="name"]'));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
