// The Common Exhibit Reference's Progress view (S436, 2026-10-20): the Commons' dash for the
// reference, drawn by the shared commons_progress.js from exhibit_progress.js's definitions.
//
// Sam, 2026-10-18: "each of our 'common' projects should have the same approach and tracking and
// feedback system... as we make changes to one, keep the other related dashes aligned". Guards:
//   - static: the tab carries a Progress view first, loads the module and the definitions lazily,
//     routes #credential-reference/<lane>, and the Commons row's counts link to those lanes;
//   - one definition: the headline pair is the Commons row's own pair (kb/status/commons.json);
//   - the view from a fixture: the headline pair, five milestones with You are here on the first
//     with work left, eight cards in order, the run log's next step;
//   - a count opens the lane that lists it (the tab's lane switch, lent through api.go);
//   - a failed read says so on the card, never a zero; without the module the view says so;
//   - tokens only, no glyph, American spelling.
//
// Run from repo root: `npm test` (or `node tests/exhibit_progress.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(n) { return (n && n.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("exhibit_progress.js", "utf8");
const TAB = fs.readFileSync("credential_reference.js", "utf8");
const MODULE = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
const BUILDER = fs.readFileSync("kb/_build_commons_status.py", "utf8");

// ───────────────────────────── Part A — static invariants ─────────────────────────────
check("the tab's views lead with Progress", /var VIEWS = \[\s*\{ k: "progress", label: "Progress", lanes: \["progress"\]/.test(TAB));
check("the tab loads the module, then the definitions",
  /loadScript\("commons_progress\.js", "CPL_COMMONS_PROGRESS", function \(\) \{\s*T\.loadScript\("exhibit_progress\.js", "CPL_EXHIBIT_PROGRESS", cb\)/.test(TAB));
check("the tab routes #credential-reference/<lane>", /function routeFromHash\(\)/.test(TAB) && /parts\[0\] !== "credential-reference"/.test(TAB));
check("the tab still opens on Needs you or Reference (openingLane unchanged)", /state\.lane = held \? "held" : "all";/.test(TAB));
check("the view reads the run log and the Commons figures", /kb\/status\/exhibit\.json/.test(SRC) && /kb\/status\/commons\.json/.test(SRC));
const ex = COMMONS.rows.filter((r) => r.key === "exhibit")[0];
check("the Commons row carries the auditor's tallies the view reads",
  ex && ["map_titles", "unclassified", "left_map", "below_80", "below_60"].every((k) => typeof ex.facts[k] === "number"));
check("the Commons row's counts open Exhibits, and left-MAP and procedures the CER (Sheet 148, link-retire)",
  ex && ex.pair[0].open === "#exhibits/credentials" && ex.issues.map((i) => i.open).join() === "#exhibits/held,#exhibits/conflict,#credential-reference/all"
  && ex.procedures[0].open === "#credential-reference/procs");
check("the builder writes those links", /"open": tab \+ "\/held"/.test(BUILDER) && /"open": tab \+ "\/conflict"/.test(BUILDER) && /"open": cer \+ "\/procs"/.test(BUILDER));
const css = SRC.slice(SRC.indexOf("function ensureCss()"), SRC.indexOf("function mount("));
check("the injected CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(css.replace(/#tab-credential-reference/g, "").replace(/#cx-/g, "")));
check("the injected CSS uses tokens", /var\(--cobalt\)/.test(css) && /var\(--border\)/.test(css) && /var\(--text-muted\)/.test(css));
check("the word controls are 24px tall, underlined, with no fill", /\.cx-word \{[^}]*background:none;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(css));
check("no glyph in the view's words", !/[←-⇿☀-➿⬀-⯿\u{1f300}-\u{1faff}]/u.test(SRC));
check("American spelling in the view's words", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst|licence)\b/i.test(SRC));
check("no funding word drifts in", !/\b(money|earn|earned)\b/i.test(SRC));

// ───────────────────────────── Part B — the view from a fixture ─────────────────────────────
const STATUS = {
  schema: 1, session: 436, moniker: "SkyTanbark", run: "the CPL Queue routine", decider: "Sam",
  handoff: "docs/session_437_handoff.md", calls: [], notes: {}, headline: [], written_at: "2026-10-20T12:00:00Z",
  project: "exhibit", next_step: { title: "Read the held titles", text: "Work Held first." }, changes: []
};
const REPORT = {
  _generated_at: "2026-10-20T07:47:00Z", waiting: 396, proposed: 361,
  procedures: [{ id: "a", kind: "rule" }, { id: "b", kind: "rule" }, { id: "c", kind: "guidance" }],
  needs_you: [{ why: "the classifier is unsure (0.75)" }, { why: "the classifier is unsure (0.61)" },
    { why: "a merge would join two issuers" }, { kind: "conflict", why: "a human-reviewed classification stands" }]
};

async function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="tab-credential-reference" class="cpl-tab-pane"><div id="mount"></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.test/" });
  const w = dom.window;
  w.fetch = (url) => {
    if (opts.fail && url.indexOf(opts.fail) >= 0) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
    const body = url.indexOf("kb/status/exhibit.json") >= 0 ? STATUS : url.indexOf("kb/status/commons.json") >= 0 ? COMMONS : null;
    return Promise.resolve({ ok: !!body, status: body ? 200 : 404, json: () => Promise.resolve(body) });
  };
  if (!opts.noModule) w.eval(MODULE);
  w.eval(SRC);
  const went = [];
  const api = Object.assign({ go: (l) => went.push(l), report: REPORT, reportError: false, unclassOpen: 12, issuerN: 30, mergeN: 2, credentials: 2441 }, opts.api || {});
  await w.CPL_EXHIBIT_PROGRESS.mount(w.document.getElementById("mount"), api);
  return { w, doc: w.document, went };
}

(async () => {
  const { doc, went } = await setup();
  const f = ex.facts;
  const nums = Array.from(doc.querySelectorAll(".prh-pg-n b")).map(txt);
  check("headline: every title, and the stamped ones (the Commons row's pair)",
    nums[0] === f.titles.toLocaleString("en-US") && nums[1] === f.stamped.toLocaleString("en-US") && ex.pair[0].n === f.stamped);
  check("headline: a person's and a cohort's stamps are said under the bar",
    txt(doc.querySelector(".prh-pg-within")).indexOf(f.person.toLocaleString("en-US") + " by a person") >= 0);
  const steps = Array.from(doc.querySelectorAll(".prh-pg-step h4")).map(txt);
  check("milestones: five, in order", steps.join(" | ") ===
    "Every MAP title classified | The held titles decided | An issuer for every credential | The reference matches MAP | Every title stamped");
  check("milestones: You are here on the first with work left",
    txt(doc.querySelector(".prh-pg-step.prh-pg-here h4")) === "Every MAP title classified");
  const cards = Array.from(doc.querySelectorAll(".prh-pg-part h4")).map(txt);
  check("cards: eight, in order", cards.join(" | ") ===
    "The titles from MAP | The nightly procedures | Held for a person | Issuers | Merges to confirm | Review stamps | The classifier's confidence | Titles that have left MAP");
  const held = Array.from(doc.querySelectorAll(".prh-pg-part")).filter((c) => txt(c.querySelector("h4")) === "Held for a person")[0];
  check("held card: the reasons are counted, the fold's conflict apart",
    /3 titles held last night \(the classifier is unsure 2, a merge would join two issuers 1\); 1 saved assignment/.test(txt(held)));
  const procs = Array.from(doc.querySelectorAll(".prh-pg-part")).filter((c) => txt(c.querySelector("h4")) === "The nightly procedures")[0];
  check("procedures card: live, the rules and the guidance counted", /Live/.test(txt(procs)) && /2 applied by code, 1 read by the classifier/.test(txt(procs)));
  check("side column: the run log's next step", /Read the held titles/.test(txt(doc.querySelector(".prh-pg-side"))));
  check("no NaN or undefined drawn", !/NaN|undefined/.test(txt(doc.body)));

  // A count opens the lane that lists it.
  const word = (re) => Array.from(doc.querySelectorAll("button.cx-word")).filter((b) => re.test(txt(b)))[0];
  word(/^Open the 12 waiting$/).click();
  word(/^Open the 4 held$/).click();
  word(/^Open the 30 in No issuer$/).click();
  word(/^Open the procedures$/).click();
  check("a count opens its lane: unc, held, noiss, procs", went.join(",") === "unc,held,noiss,procs");
  const chips = Array.from(doc.querySelectorAll(".prh-pg-left button.cx-word")).map(txt);
  check("left before the next milestone opens the waiting list", chips.length === 1 && chips[0] === "12 titles waiting for an identity");

  // The worklists still loading: the cards that need them say so, never a zero.
  const r2 = await setup({ api: { unclassOpen: null, issuerN: null, mergeN: null } });
  const issuers = Array.from(r2.doc.querySelectorAll(".prh-pg-part")).filter((c) => txt(c.querySelector("h4")) === "Issuers")[0];
  check("worklists loading: the Issuers card reads Could not be read", /Could not be read/.test(txt(issuers)) && /still loading/.test(txt(issuers)));

  // The Commons figures failing: the headline says so.
  const r3 = await setup({ fail: "kb/status/commons.json" });
  check("Commons figures unread: the headline says Could not be read", /Could not be read/.test(txt(r3.doc.querySelector(".prh-pg-hl"))));
  check("Commons figures unread: no zero in the headline", !/\b0 exhibit titles/.test(txt(r3.doc.body)));

  // The run log failing: the side column says so, the figures still draw.
  const r4 = await setup({ fail: "kb/status/exhibit.json" });
  check("run log unread: the side column names the file", /run log \(kb\/status\/exhibit\.json\) could not be read/.test(txt(r4.doc.querySelector(".prh-pg-side"))));

  // No module: the view says so.
  const r5 = await setup({ noModule: true });
  check("no module: the view says it could not be loaded", /could not be loaded/.test(txt(r5.doc.getElementById("mount"))));

  let failed = 0;
  results.forEach(([n, ok]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
