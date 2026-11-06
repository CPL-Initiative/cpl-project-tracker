// The CPL Pathways College list names every college (Ashley, 2026-11-04: Santiago Canyon
// College was missing because it had no pathway on record yet).
//
// Guards:
//   (a) every college on the College Identity roster (college_short_names.js) is listed;
//   (b) no college is listed twice under two spellings;
//   (c) picking a college with no pathway yet works and says it has none.

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const flush = async (n) => { for (let i = 0; i < (n || 4); i++) await new Promise((r) => setTimeout(r, 0)); };

(async () => {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`,
    { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {};
  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  for (const f of ["college_short_names.js", "cpl_pathways_data.js", "cpl_pathways_roep_data.js", "cpl_baccalaureates_data.js", "cpl_pathways.js"]) {
    w.eval(fs.readFileSync(f, "utf8"));
  }
  w.CPL_PATHWAYS_TAB.activate();
  await flush(8);
  const col = w.document.getElementById("cplpw-college-select");
  check("college select renders", !!col);
  const names = Array.prototype.map.call(col.options, (o) => o.value).filter(Boolean);
  const key = w.CPL_PATHWAYS_TAB._choiceKey;
  const keys = new Set(names.map(key));

  const missing = w.CPL_COLLEGE_SHORT.map((r) => r.canonical).filter((c) => !keys.has(key(c)));
  check("(a) every roster college is listed", missing.length === 0, missing.join(", "));
  check("(a) Santiago Canyon College is listed", names.includes("Santiago Canyon College"));
  check("(b) no college listed twice", keys.size === names.length,
    names.filter((n, i) => names.findIndex((m) => key(m) === key(n)) !== i).join(", "));
  check("(b) mid-name Of/The read lowercase", !names.some((n) => / (Of|The) /.test(n)), names.filter((n) => / (Of|The) /.test(n)).join(", "));

  col.value = "Santiago Canyon College";
  col.dispatchEvent(new w.Event("change", { bubbles: true }));
  await flush();
  const none = w.document.querySelector("#cplpw-list .cplpw-nopath");
  check("(c) a college with no pathway can be picked", col.value === "Santiago Canyon College");
  check("(c) its List says it has no pathway on record yet", none && /^Santiago Canyon College has no pathway on record yet/.test(none.textContent), none && none.textContent);

  let fail = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : " — " + why)); if (!ok) fail++; }
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
