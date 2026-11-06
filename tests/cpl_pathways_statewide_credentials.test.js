// CPL Pathways opens on every college, and carries the Credential Catalog (SkyHarbor, 2026-11-06). Sam: "CPL Pathways
// should, after all, open with a view of the whole system until you pick a college", then "a lazy load of the whole
// state when CPL Pathways opens...until you narrow down to a college"; "Can you mock up a way to incorporate the
// credential catalog in the Pathways view"; "I don't like to use the word carry"; "Need a Credential card too"; "Use
// full width"; on the recommended box, "would be cool" past two; then "build it into CPL Pathways--looks terrific!"
// Mock: https://claude.ai/artifact/BRUR7BRD4LxVFauQ23NahP. Guards:
//   - the index read asks for each program's counts, so the whole state's figures need no per-college read;
//   - no college: the statewide head, six cards (Credentials second), and one List naming each program's college;
//   - the wording is "CPL here", never "carry"; the tab is full width;
//   - the Credentials card and the Programs | Credentials switch show the Catalog's credentials, statewide or scoped;
//   - a college's recommended credentials: the strongest four, then Show all N in place, and back;
//   - a failed Catalog read says so on the card, never a zero.
// Run from repo root: `npm test` (or `node tests/cpl_pathways_statewide_credentials.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const DRIVE = require("./cpl_pathways_drive.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const txt = (n) => (n && n.textContent || "").replace(/\s+/g, " ").trim();
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const MT = "Mt. San Antonio College";

// Mt. SAC awards one credential, could add seven: six recommended (two both badges), one plain.
const ADOPT = {
  colleges: [[MT, "Mt. SAC"], ["Alpha College", "Alpha"]],
  sectors: { "11": "Computer Sciences", "47": "Mechanic and Repair" },
  credentials: [
    { t: "Awarded Here", i: "Issuer A", s: "11", p: 3, a: [[0, 3, "CIS 1: 3 hours"], [1, 3, ""]], c: [] },
    { t: "Both One", i: "ASE", s: "47", p: 3, sw: [{ t: "x" }], ai: 1, a: [[1, 3, ""]], c: [[0, "AUTO 1"]] },
    { t: "Both Two", i: "ASE", s: "47", p: 3, sw: [{ t: "x" }], ai: 1, a: [[1, 3, ""]], c: [[0, "AUTO 2"]] },
    { t: "Statewide Only", i: "POST", s: "11", p: 21, sw: [{ t: "x" }], a: [[1, 21, ""]], c: [[0, "AJ 1"]] },
    { t: "Statewide Two", i: "EMSA", s: "11", p: 8, sw: [{ t: "x" }], a: [[1, 8, ""]], c: [[0, "EMS 1"]] },
    { t: "AI Only", i: "CompTIA", s: "11", p: 3, ai: 1, a: [[1, 3, ""]], c: [[0, "CIS 9"]] },
    { t: "AI Two", i: "Microsoft", s: "11", p: 3, ai: 1, a: [[1, 3, ""]], c: [[0, "CIS 10"]] },
    { t: "Plain Could", i: "Someone", s: "11", p: 3, a: [[1, 3, ""]], c: [[0, "CIS 11"]] },
  ],
};

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  const urls = [];
  w.fetch = (url) => {
    urls.push(String(url));
    if (/adopt_data\.json/.test(url)) return opts.adoptFail ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(ADOPT))) });
    return Promise.reject(new Error("offline"));   // the table: the tab falls back to the pilot file
  };
  w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(SRC);
  DRIVE.withList(w);
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_PATHWAYS_TAB.activate();
  return { w, root: w.document.getElementById("cpl-pathways-root"), urls };
}

(async function () {
  check("the index read asks for each program's counts", /var ROEP_INDEX_SELECT = "college,control_number,program_title,award,checked,counts:display->counts";/.test(SRC));
  check("the tab runs full width", /"\.cplpw \{ color: var\(--text-body\); max-width: none; margin: 0; \}"/.test(SRC));
  check("the word is CPL here, never carry, in what the tab shows", !/["'][^"']*\b[Cc]arr(y|ies) CPL\b/.test(SRC) && /"CPL here"/.test(SRC));

  let t = load();
  await settle();
  const root = t.root;
  check("no college: every college, every program", txt(root.querySelector(".cplpw-h")) === "Every college, every program");
  const cards = [...root.querySelectorAll(".cplpw-card")];
  check("six cards, Credentials second", cards.length === 6 && txt(cards[1].querySelector(".cplpw-card-l")) === "Credentials",
    cards.map((c) => txt(c.querySelector(".cplpw-card-l"))).join(" | "));
  check("the Credentials card counts the credentials that earn credit somewhere", txt(cards[1].querySelector(".cplpw-card-n")) === "8");
  check("the CPL here card says what it counts in plain words", /a student can already earn at least one course through credit for prior learning/.test(txt(cards[2])));
  const head = [...root.querySelectorAll("#cplpw-list thead th")].map(txt);
  check("the statewide List names each program's college", head.some((h) => /^College\b/.test(h)), head.join(" | "));
  check("no My College fold without a college", !root.querySelector("#cplpw-mycollege"));
  check("the Catalog file is read once", t.urls.filter((u) => /adopt_data\.json/.test(u)).length === 1);

  const lensBtns = [...root.querySelectorAll(".cplpw-lens button")];
  check("the switch offers Programs and Credentials", lensBtns.length === 2 && /^Programs \(/.test(txt(lensBtns[0])) && /^Credentials \(8 earn credit\)$/.test(txt(lensBtns[1])),
    lensBtns.map(txt).join(" | "));
  lensBtns[1].click(); await settle();
  const credHead = [...root.querySelectorAll("#cplpw-list thead th")].map(txt);
  check("Credentials: the Catalog's columns, statewide", credHead.some((h) => /^Credential\b/.test(h)) && credHead.indexOf("Recommended") >= 0 && credHead.indexOf("Median units") >= 0, credHead.join(" | "));
  check("and the switch says which is shown", root.querySelector('.cplpw-lens button[aria-pressed="true"]') && /^Credentials/.test(txt(root.querySelector('.cplpw-lens button[aria-pressed="true"]'))));
  check("and the Credentials card reads pressed", root.querySelector('.cplpw-card[data-filter="creds"]').getAttribute("aria-pressed") === "true");

  // A college: its credentials, and the recommended box.
  DRIVE.chooseCollege(t.w, root, MT);
  await settle();
  check("a college's head names it", txt(root.querySelector(".cplpw-h")) === MT);
  const c2 = [...root.querySelectorAll(".cplpw-card")];
  check("its Credentials card: awarded here, and how many it could add", txt(c2[1].querySelector(".cplpw-card-n")) === "1" && /7 more it could add/.test(txt(c2[1])), txt(c2[1]));
  const box = root.querySelector(".cplpw-recs");
  check("the recommended box counts all six", box && /could adopt \(6\)/.test(txt(box.querySelector("h3"))), box && txt(box.querySelector("h3")));
  let names = [...root.querySelectorAll(".cplpw-rec h4")].map(txt);
  check("it shows the strongest four first: both badges, then by colleges", names.length === 4 && names[0] === "Both One" && names[1] === "Both Two", names.join(" | "));
  check("the plain could-add credential is not recommended", !/Plain Could/.test(txt(box)));
  const more = root.querySelector(".cplpw-more");
  check("Show all 6, collapsed", more && txt(more) === "Show all 6" && more.getAttribute("aria-expanded") === "false");
  more.click(); await settle();
  names = [...root.querySelectorAll(".cplpw-rec h4")].map(txt);
  check("Show all opens all six in place", names.length === 6 && txt(root.querySelector(".cplpw-more")) === "Show the first 4"
    && root.querySelector(".cplpw-more").getAttribute("aria-expanded") === "true");
  check("each names the course it lines up with and its badges", /teaches AUTO 1/.test(txt(root.querySelector(".cplpw-rec"))) && root.querySelectorAll(".cplpw-rec")[0].querySelectorAll(".cplpw-badge").length === 2);

  // A failed Catalog read says so.
  t = load({ adoptFail: true });
  await settle();
  check("a failed Catalog read reads TBA on the card, never a zero", txt(t.root.querySelectorAll(".cplpw-card")[1].querySelector(".cplpw-card-n")) === "TBA");

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  — " + r[2])));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
