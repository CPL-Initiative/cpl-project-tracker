// CPL Pathways: the Industry certs control on a program card (Sam, 2026-11-27).
//
// Sam: "when you find that there are also stackable industry certs associated with a program though a CPL exhibit or
// becasue the program teaches to a cert like CompTIA or both, can you note it with a chip that clicks to a sidebar for
// deatils?" kb/_build_program_certs.py files kb/status/program_certs/<slug>.json; the record view reads its college's
// file and puts the words "Industry certs" with a count on the program card.
//
// WHAT THIS GUARDS:
//   (a) no entry for the program, a missing file, or no fetch at all: no control, nothing thrown;
//   (b) entries: an underlined-word button reading "Industry certs (N)", a certification in both groups counted once,
//       on the program card;
//   (c) the click opens the sidebar beside the view (inside the split, the view keeps its place), with its frozen top
//       row and Close, and two headed groups: Earns CPL here and The program prepares for; the catalog's line quoted;
//       a certification in both groups says "Also earns CPL here" in words;
//   (d) Get credit opens the bottom bar on the college's landing page with only the exhibit codes MAP's ?Exhibit=
//       pattern accepts; an entry with no code opens the landing page alone and says why;
//   (e) Close shuts the sidebar and hands focus back; a second click on the control toggles it shut;
//   (f) no raw hex in the injected CSS, and motion respects the reader's setting.
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_program_certs.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const DIR = "kb/status/program_certs/";
const LANDING = "https://cpldashboardcccco.azurewebsites.net/www.cerritos.edu";
const GOOD = "MAPICI-CCNA7-1-001";

const FILE = { college: "Cerritos College", slug: "cerritos", programs: {
  "42158": {
    earns_cpl_here: [
      { t: "OSHA 30-Hour Construction", i: "U.S. Occupational Safety and Health Administration", courses: ["IWAP 40.07"],
        exhibits: [GOOD, "MAPICI-A&B-1-001"], both: true },
      { t: "Rigging Qualification", i: "NCCER", courses: ["IWAP 40.50", "IWAP 41.09"], exhibits: [] }
    ],
    prepares_for: [
      { key: "osha", name: "OSHA 10- or 30-hour card", issuer: "U.S. Occupational Safety and Health Administration",
        from: "outcomes", quote: "Earn the OSHA 30 card before the field placement.", both: true },
      { key: "aws_weld", name: "AWS welding certification", issuer: "American Welding Society",
        from: "careers", quote: "AWS certified structural welder" }
    ]
  }
} };

async function render(opts) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  if (!opts.noFetch) {
    w.fetch = (url) => {
      const u = String(url);
      if (u === DIR + "index.json" && !opts.missing) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ colleges: { "Cerritos College": "cerritos" } }) });
      if (u === DIR + "cerritos.json" && !opts.missing) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opts.file) });
      if (/map_college_contacts_pub/.test(u)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ college: "Cerritos College", landing_page_url: LANDING }]) });
      if (/kb\/status\//.test(u)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    };
  } else {
    w.fetch = undefined;
  }
  w.eval(DATA); w.eval(ROEP); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  const T = w.CPL_PATHWAYS_TAB, root = w.document.getElementById("cpl-pathways-root");
  const rec = JSON.parse(JSON.stringify(w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158")));
  T._roepView.lay = "req"; T._roepView.who = "college";
  let threw = null;
  try { T._renderRoepProgram(root, rec); } catch (e) { threw = e; }
  for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
  return { w, T, root, rec, threw };
}
const click = (w, n) => n.dispatchEvent(new w.Event("click", { bubbles: true }));

(async () => {
  // (a) nothing to show
  for (const [label, opts] of [["no entry for the program", { file: { college: "Cerritos College", slug: "cerritos", programs: { "99999": FILE.programs["42158"] } } }],
    ["a missing file", { missing: true }], ["no fetch at all", { noFetch: true }]]) {
    const r = await render(opts);
    const host = r.root.querySelector(".cplpw-rprog .cplpw-rcerts");
    check("(a) " + label + ": no control, nothing thrown", !r.threw && (!host || host.hidden) && !r.root.querySelector(".cplpw-rcerts-open"),
      r.threw ? String(r.threw) : host && host.outerHTML);
  }

  // (b) the control
  const r = await render({ file: FILE });
  const { w, root } = r;
  const b = root.querySelector(".cplpw-rcerts-open");
  check("(b) the control is a button on the program card", b && b.tagName === "BUTTON" && b.type === "button" && b.closest(".cplpw-rprog"));
  check("(b) it reads Industry certs with the count, a certification in both groups counted once",
    b && b.textContent === "Industry certs (3)", b && b.textContent);
  check("(b) it is an underlined word: no border, no fill",
    /"\.cplpw-rcerts-open \{[^"]*background:none; border:0;[^"]*text-decoration:underline;/.test(SRC));
  check("(b) it says the sidebar is shut and names what it controls",
    b && b.getAttribute("aria-expanded") === "false" && b.getAttribute("aria-controls") === "cplpw-cside");

  // (c) the sidebar
  click(w, b);
  const side = root.querySelector("aside.cplpw-cside");
  const split = root.querySelector(".cplpw-rsplit");
  check("(c) the click opens the sidebar beside the view, inside the split", side && side.parentNode === split && split.classList.contains("open")
    && split.querySelector(".cplpw-rmain"));
  check("(c) its top row names it and holds Close", side && side.querySelector(".cplpw-cside-head h3").textContent === "Industry certs"
    && side.querySelector(".cplpw-cside-head button.cplpw-cside-close").textContent === "Close");
  check("(c) it resizes from its inner edge", side && side.querySelector(".cplpw-cside-grip[role=separator]")
    && side.querySelector(".cplpw-cside-grip").getAttribute("aria-label") === "Resize the industry certs");
  const heads = side ? [...side.querySelectorAll(".cplpw-cside-body h4")].map((h) => h.textContent) : [];
  check("(c) two headed groups", heads[0] === "Earns CPL here (2)" && heads[1] === "The program prepares for (2)", heads);
  const earns = side ? [...side.querySelectorAll("section.earns li")] : [];
  check("(c) each earned certification: its title, issuer and the program's courses",
    earns.length === 2 && /OSHA 30-Hour Construction/.test(earns[0].textContent) && /Issued by U\.S\. Occupational/.test(earns[0].textContent)
      && /Gives credit for IWAP 40\.50, IWAP 41\.09 in this program/.test(earns[1].textContent), earns.map((e) => e.textContent));
  const prep = side ? [...side.querySelectorAll("section.prep li")] : [];
  check("(c) the catalog's line is quoted", prep.length === 2 && prep[0].querySelector("blockquote").textContent === "Earn the OSHA 30 card before the field placement."
    && /careers/.test(prep[1].textContent));
  check("(c) a certification in both groups says Also earns CPL here, in words",
    prep[0] && /Also earns CPL here/.test(prep[0].textContent) && !/Also earns CPL here/.test(prep[1].textContent));
  check("(c) the control says the sidebar is open", b.getAttribute("aria-expanded") === "true");

  // (d) Get credit
  const go = earns[0] && earns[0].querySelector("button.cplpw-rgo");
  check("(d) each earned certification has Get credit", go && go.textContent === "Get credit" && earns[1].querySelector("button.cplpw-rgo"));
  click(w, go);
  for (let i = 0; i < 6; i++) await new Promise((res) => setTimeout(res, 0));
  let bar = root.querySelector(".cplpw-gbar");
  let frame = bar && bar.querySelector("iframe");
  const src = frame && frame.getAttribute("src");
  const sent = src && src.indexOf("?Exhibit=") > 0 ? decodeURIComponent(src.split("?Exhibit=")[1]).split(",") : [];
  check("(d) the bar frames the landing page on the codes MAP accepts, the & code dropped",
    src === LANDING + "?Exhibit=" + GOOD && sent.every((x) => /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+){2,}$/.test(x)), src);
  check("(d) the bar's list heads the certification's CPL", bar && /CPL for this certification/.test(bar.querySelector(".list").textContent));
  click(w, earns[1].querySelector("button.cplpw-rgo"));
  for (let i = 0; i < 6; i++) await new Promise((res) => setTimeout(res, 0));
  bar = root.querySelector(".cplpw-gbar");
  frame = bar && bar.querySelector("iframe");
  check("(d) no code: the landing page alone, and the bar says why",
    frame && frame.getAttribute("src") === LANDING && /No exhibit for it is filed under Cerritos College/.test(bar.querySelector(".via").textContent),
    frame && frame.getAttribute("src"));
  check("(d) the codes the tab sends pass the same guard", JSON.stringify(r.T._getCreditCodes([{ exhibit: GOOD }, { exhibit: "MAPICI-A&B-1-001" }])) === JSON.stringify([GOOD]));

  // (e) Close and the toggle
  click(w, root.querySelector("aside.cplpw-cside .cplpw-cside-close"));
  check("(e) Close shuts the sidebar and hands focus back", !root.querySelector("aside.cplpw-cside") && !split.classList.contains("open")
    && w.document.activeElement === b && b.getAttribute("aria-expanded") === "false");
  click(w, b);
  click(w, b);
  check("(e) a second click on the control shuts it", !root.querySelector("aside.cplpw-cside"));

  // (f) tokens and motion
  const css = (SRC.split("var CERTS_CSS = [")[1] || "").split("].join")[0];
  check("(f) the injected CSS names tokens, never a raw hex", css.length > 200 && !/#[0-9a-fA-F]{3,8}\b/.test(css));
  check("(f) motion respects the reader's setting", /prefers-reduced-motion: reduce/.test(css));

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways industry certs");
  if (failed) process.exit(1);
})();
