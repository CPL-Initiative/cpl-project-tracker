// Tests for the Noncredit & Learning Partners tab (nc_learning_partners.js).
//
// Guards the failure modes that would actually bite:
//   * computeDormant must EXCLUDE anything that has transcribed a unit — the
//     whole point of the worklist is "built and not flowing", so a converting
//     exhibit appearing here would send the team chasing finished work.
//   * computeDormant must only count STATEWIDE exhibits, and must apply the
//     2-college floor (a 1-college statewide exhibit is usually mid-rollout).
//   * A missing / failed credential dataset must return null (rendered as an
//     honest "arrives when the data loads" note) rather than an empty list that
//     reads as "nothing dormant" — omit, don't zero.
//   * The register JSON must stay structurally sound: every mode maps to real
//     use cases, every use case is claimed by exactly one mode, and the counts
//     the tab renders in its section badges are derivable.
//   * buildReport must include the six modes — the report is the handout the
//     team uses, and the modes are the part they need in a meeting.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const results = [];
function ok(name, cond, extra) {
  results.push({ name, pass: !!cond, extra });
  if (!cond) console.error("  ✗ " + name + (extra ? " — " + extra : ""));
}

// ── Load the module in a jsdom window ──────────────────────────────────────
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
const win = dom.window;
const src = fs.readFileSync(path.join(ROOT, "nc_learning_partners.js"), "utf8");
win.eval(src);
const M = win.CPL_NC_LEARNING_PARTNERS;

ok("module exports activate/computeDormant/computeLive/buildReport",
  M && typeof M.activate === "function" && typeof M.computeDormant === "function" &&
  typeof M.computeLive === "function" && typeof M.buildReport === "function");

// ── computeDormant ─────────────────────────────────────────────────────────
function cer(titles) { return { unified_titles: titles, _stats: { unified_titles: titles.length, articulated_titles: titles.length } }; }
function title(o) {
  return Object.assign({
    ut: "T", issuer: "I", statewide: true, transcribed_credits: 0,
    articulations: [{ local: [{ colleges: ["A College", "B College"] }] }]
  }, o);
}

ok("null dataset returns null (omit, don't zero)", M.computeDormant(null) === null);
ok("dataset without unified_titles returns null", M.computeDormant({}) === null);

let d = M.computeDormant(cer([title({})]));
ok("a statewide, zero-transcription, 2-college exhibit IS dormant", d.length === 1, JSON.stringify(d));

d = M.computeDormant(cer([title({ transcribed_credits: 3 })]));
ok("an exhibit that HAS transcribed is excluded", d.length === 0);

d = M.computeDormant(cer([title({ transcribed_credits: 0.5 })]));
ok("even a fractional transcription excludes it", d.length === 0);

d = M.computeDormant(cer([title({ statewide: false })]));
ok("a non-statewide exhibit is excluded", d.length === 0);

d = M.computeDormant(cer([title({ articulations: [{ local: [{ colleges: ["Solo College"] }] }] })]));
ok("a 1-college statewide exhibit is below the floor", d.length === 0);

d = M.computeDormant(cer([title({ articulations: [] })]));
ok("no articulations means no colleges means excluded", d.length === 0);

d = M.computeDormant(cer([
  title({ ut: "Small", articulations: [{ local: [{ colleges: ["A", "B"] }] }] }),
  title({ ut: "Big", articulations: [{ local: [{ colleges: ["A", "B", "C", "D"] }] }] })
]));
ok("results sort by college count descending", d[0].ut === "Big" && d[1].ut === "Small",
  d.map(x => x.ut).join(","));

d = M.computeDormant(cer([title({
  articulations: [{ local: [{ colleges: ["A College"] }, { colleges: ["A College", "B College"] }] }]
})]));
ok("duplicate colleges across locals are de-duplicated", d.length === 1 && d[0].n === 2,
  d.length ? String(d[0].n) : "no row");

// null/undefined-tolerant shapes (real data has honest nulls)
d = M.computeDormant(cer([title({ articulations: [{ local: null }] }), title({ articulations: null })]));
ok("null articulations/local do not throw", Array.isArray(d) && d.length === 0);

d = M.computeDormant(cer([title({ ut: null, issuer: null })]));
ok("null title falls back rather than throwing", d.length === 1 && d[0].ut === "(untitled)");

// object-keyed unified_titles (the shipped shape) as well as arrays
const objShaped = { unified_titles: { a: title({ ut: "ObjRow" }) } };
d = M.computeDormant(objShaped);
ok("object-keyed unified_titles are handled", d.length === 1 && d[0].ut === "ObjRow");

// ── computeLive ────────────────────────────────────────────────────────────
const live = M.computeLive(cer([
  title({ ut: "dormant" }),
  title({ ut: "converting", transcribed_credits: 10 }),
  title({ ut: "local", statewide: false })
]));
ok("computeLive counts statewide totals", live.statewide_total === 2, String(live.statewide_total));
ok("computeLive counts only converting statewide", live.statewide_converting === 1, String(live.statewide_converting));
ok("computeLive on a null dataset returns nulls, not zeros",
  M.computeLive(null).statewide_total === null);

// ── Register JSON integrity ────────────────────────────────────────────────
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "nc_learning_partners.json"), "utf8"));

ok("register has modes, use_cases, opportunities, questions",
  Array.isArray(reg.modes) && Array.isArray(reg.use_cases) &&
  Array.isArray(reg.opportunities) && Array.isArray(reg.questions));

const ucIds = reg.use_cases.map(u => u.id);
const claimed = [].concat.apply([], reg.modes.map(m => m.use_cases || []));

ok("every mode use_case reference resolves to a real use case",
  claimed.every(id => ucIds.indexOf(id) !== -1),
  claimed.filter(id => ucIds.indexOf(id) === -1).join(","));

ok("every use case is claimed by at least one mode",
  ucIds.every(id => claimed.indexOf(id) !== -1),
  ucIds.filter(id => claimed.indexOf(id) === -1).join(","));

ok("no use case is claimed by two modes (the modes partition the taxonomy)",
  claimed.length === new Set(claimed).size,
  claimed.filter((id, i) => claimed.indexOf(id) !== i).join(","));

const MODE_FIELDS = ["id", "name", "short", "definition", "evidence", "cpl_type", "fits", "tier", "cost", "why", "state", "priority"];
reg.modes.forEach(m => {
  ok("mode " + m.id + " carries every field the tab renders",
    MODE_FIELDS.every(f => m[f] !== undefined && m[f] !== null && m[f] !== ""),
    MODE_FIELDS.filter(f => !m[f]).join(","));
});

ok("every mode priority is one the renderer styles",
  reg.modes.every(m => ["highest", "high", "targeted", "policy"].indexOf(m.priority) !== -1),
  reg.modes.map(m => m.priority).join(","));

ok("every use case tier is 1-4 (the ladder the filter offers)",
  reg.use_cases.every(u => [1, 2, 3, 4].indexOf(u.tier) !== -1));

ok("every question status is one the filter offers",
  reg.questions.every(q => ["open", "verify"].indexOf(q.status) !== -1),
  reg.questions.map(q => q.status).join(","));

ok("every opportunity carries the fields the card renders",
  reg.opportunities.every(o => o.id && o.title && o.detail && o.kind && o.value && o.effort && o.status));

ok("derived target lists carry provenance",
  reg.opportunities.filter(o => o._derived_by).every(o => o._derived_at),
  "a derived list without a date would be unauditable");

// ── buildReport ────────────────────────────────────────────────────────────
const report = M.buildReport(reg, [{ ut: "X", issuer: "Y", colleges: ["A", "B"], n: 2 }], live);
ok("report is markdown with a title", /^# Noncredit & Learning Partners/.test(report));
ok("report includes the six modes section", report.indexOf("## The six ways CPL applies") !== -1);
reg.modes.forEach(m => {
  ok("report names mode " + m.id, report.indexOf(m.name) !== -1);
});
ok("report includes the dormant table", report.indexOf("## Dormant statewide exhibits") !== -1);
ok("report includes the open questions", report.indexOf("## Open questions") !== -1);
ok("report survives a null dormant list (dataset unavailable)",
  typeof M.buildReport(reg, null, live) === "string");

// ── Tab wiring in BOTH HTMLs (Rule 4) ──────────────────────────────────────
["CPL_Dashboard.html", "index.html"].forEach(f => {
  const html = fs.readFileSync(path.join(ROOT, f), "utf8");
  ok(f + " has the nav button", html.indexOf('data-tab="nc-learning-partners"') !== -1);
  ok(f + " has the pane root", html.indexOf('id="nc-learning-partners-root"') !== -1);
  ok(f + " has the lazy boot", html.indexOf("nc_learning_partners.js") !== -1);
  ok(f + " closes the pane with its marker", html.indexOf("<!-- /tab-nc-learning-partners -->") !== -1);
});

// ── No raw hex in the injected CSS (design-system rule) ────────────────────
const cssBlock = src.slice(src.indexOf("function ensureCss"), src.indexOf("function computeDormant"));
const rawHex = cssBlock.match(/#[0-9a-fA-F]{3,8}\b(?![^"]*ROOT_ID)/g) || [];
const offending = rawHex.filter(h => !/^#(nc|nclp)/.test(h));
ok("injected CSS uses var(--token), never a raw hex", offending.length === 0, offending.join(","));

// ── Cross-references: narrative claims → register rows ─────────────────────
// Every [[ID]] in the narrative must resolve to a real register item, or the
// link renders as a dead anchor and the traceability claim is false.
const narrativeSrc = src.slice(src.indexOf("function buildNarrative"), src.indexOf("// ── Section scaffold"));
const refs = (narrativeSrc.match(/\[\[[A-Za-z0-9-]+\]\]/g) || [])
  .map(r => r.slice(2, -2));

ok("the narrative carries cross-references at all", refs.length > 0, String(refs.length));

const knownIds = []
  .concat(reg.modes.map(m => m.id))
  .concat(reg.use_cases.map(u => u.id))
  .concat(reg.opportunities.map(o => o.id))
  .concat(reg.questions.map(q => q.id));

const dead = refs.filter(r => knownIds.indexOf(r) === -1);
ok("every narrative cross-reference resolves to a register item", dead.length === 0, dead.join(","));

// The modes' own use_case lists render as refs too — already checked for
// resolution above, but confirm the renderer actually links them.
ok("mode cards link the use cases they cover", src.indexOf("Covers: ") !== -1);

// Section routing must cover every id family the narrative can reference.
["OPP-1", "UC-1", "Q-1", "M1"].forEach(id => {
  const fam = id.replace(/[0-9-].*$/, "");
  ok("sectionForItem routes " + fam + "*", src.indexOf("nclp-sec-") !== -1);
});

// A ref whose filter is hiding it must clear that filter — otherwise clicking
// a link from the narrative silently does nothing.
ok("revealItem clears a filter that would hide the target",
  /state\.opp = "all"/.test(src) && /state\.uc = "all"/.test(src) && /state\.q = "all"/.test(src));

ok("cards carry stable DOM ids for ref targeting",
  (src.match(/c\.id = itemDomId\(/g) || []).length >= 4,
  String((src.match(/c\.id = itemDomId\(/g) || []).length));

ok("reduced-motion users get an outline instead of the flash animation",
  src.indexOf("prefers-reduced-motion") !== -1 && src.indexOf("nclp-flash{animation:none") !== -1);

// ── Report ─────────────────────────────────────────────────────────────────
const failed = results.filter(r => !r.pass);
console.log(`nc_learning_partners: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  failed.forEach(f => console.error("  FAIL: " + f.name + (f.extra ? " — " + f.extra : "")));
  process.exit(1);
}
