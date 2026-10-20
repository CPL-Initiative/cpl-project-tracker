// The Common CR Reference's Progress view (S437, 2026-10-20): the Commons' dash for the reference,
// drawn by the shared commons_progress.js from cr_progress.js's definitions.
//
// Sam, 2026-10-18: "each of our 'common' projects should have the same approach and tracking and
// feedback system... as we make changes to one, keep the other related dashes aligned". Guards:
//   - static: the tab carries a Progress view beside the worklist, loads the module and the
//     definitions lazily, routes #cr-reference/<view or filter>, and still opens on the worklist;
//   - one definition: the headline pair is the Commons row's own pair (kb/status/commons.json);
//   - the view from a fixture: the headline pair, five milestones with You are here on the first
//     with work left, eight cards in order, the run log's next step;
//   - a count opens the filter that lists it (the tab's filter switch, lent through api.go);
//   - the tab's two new filters count what the Commons row counts on the same groups;
//   - a failed read says so, never a zero; a Commons file from before S437 reads as unread;
//   - the live table differing from the receipts is said on the card;
//   - tokens only, no glyph, American spelling.
//
// Run from repo root: `npm test` (or `node tests/cr_progress.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(n) { return (n && n.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("cr_progress.js", "utf8");
const TAB = fs.readFileSync("cr_reference.js", "utf8");
const MODULE = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
const BUILDER = fs.readFileSync("kb/_build_commons_status.py", "utf8");
const cr = COMMONS.rows.filter((r) => r.key === "cr")[0];
const f = cr.facts;
const n = (v) => Number(v).toLocaleString("en-US");

// ───────────────────────────── Part A — static invariants ─────────────────────────────
check("the tab draws a view row, Progress first, then Worklist",
  /data-view="progress"[^]*?>Progress<\/button>[^]*?data-view="worklist"/.test(TAB));
check("the tab still opens on the worklist", /view: "worklist",/.test(TAB) && /filter: "todo"/.test(TAB));
check("the tab loads the module, then the definitions",
  /loadScript\("commons_progress\.js", "CPL_COMMONS_PROGRESS", function \(\) \{\s*T\.loadScript\("cr_progress\.js", "CPL_CR_PROGRESS", cb\)/.test(TAB));
check("the tab routes #cr-reference/<view or filter>", /function routeFromHash\(\)/.test(TAB) && /parts\[0\] !== "cr-reference"/.test(TAB));
check("the view reads the run log and the Commons figures", /kb\/status\/cr\.json/.test(SRC) && /kb\/status\/commons\.json/.test(SRC));
check("the Commons row carries the wording figures the view reads",
  ["wordings", "settled", "settled_rows", "rule_wordings", "rule_groups", "curator_only", "unsettled", "awaiting_look", "names_to_check"]
    .every((k) => typeof f[k] === "number") && f.head && f.head["50"] && typeof f.head["50"].settled === "number");
check("the Commons row's counts open the tab's view and filters",
  cr.pair[0].open === "#cr-reference/progress" && cr.issues.every((i) => /^#cr-reference\/(open|names)$/.test(i.open)));
check("the tab and the builder settle by the same decisions", /var SETTLES = \["confirmed", "not_a_topic"\];/.test(TAB)
  && /SETTLES = \("confirmed", "not_a_topic"\)/.test(BUILDER));
const css = SRC.slice(SRC.indexOf("function ensureCss()"), SRC.indexOf("function mount("));
check("the injected CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(css.replace(/#tab-cr-reference/g, "").replace(/#cq-/g, "")));
check("the injected CSS uses tokens", /var\(--cobalt\)/.test(css) && /var\(--border\)/.test(css) && /var\(--text-muted\)/.test(css));
check("the word controls are 24px tall, underlined, with no fill", /\.cq-word \{[^}]*background:none;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(css));
check("the view words are 24px tall and underlined", /button\.crr-view\{[^}]*background:none;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(TAB));
check("no glyph in the view's words", !/[←-⇿☀-➿⬀-⯿\u{1f300}-\u{1faff}]/u.test(SRC));
check("American spelling in the view's words", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst|licence)\b/i.test(SRC));
check("no funding word drifts in", !/\b(money|earn|earned)\b/i.test(SRC));

// ───────────────────────────── Part B — the view from a fixture ─────────────────────────────
const STATUS = {
  schema: 1, session: 437, moniker: "SkySagebrush", run: "a session Sam opened", decider: "Sam",
  handoff: "docs/session_438_handoff.md", calls: [], notes: {}, headline: [], written_at: "2026-10-20T14:00:00Z",
  project: "cr", next_step: { title: "Decide the head", text: "Six wordings in the top 50." }, changes: []
};
const OLD = JSON.parse(JSON.stringify(COMMONS));
OLD.rows.forEach((r) => { if (r.key === "cr") r.facts = { groups: 2159, by_rule: 156, rung_5: 1936, rows: 9413, decided: 30 }; });

async function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="mount"></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.test/" });
  const w = dom.window;
  w.fetch = (url) => {
    if (opts.fail && url.indexOf(opts.fail) >= 0) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
    const body = url.indexOf("kb/status/cr.json") >= 0 ? STATUS : url.indexOf("kb/status/commons.json") >= 0 ? (opts.commons || COMMONS) : null;
    return Promise.resolve({ ok: !!body, status: body ? 200 : 404, json: () => Promise.resolve(body) });
  };
  if (!opts.noModule) w.eval(MODULE);
  w.eval(SRC);
  const went = [];
  const api = Object.assign({ go: (l) => went.push(l), liveDecided: null }, opts.api || {});
  await w.CPL_CR_PROGRESS.mount(w.document.getElementById("mount"), api);
  return { w, doc: w.document, went };
}
const card = (doc, title) => Array.from(doc.querySelectorAll(".prh-pg-part")).filter((c) => txt(c.querySelector("h4")) === title)[0];

(async () => {
  const { doc, went } = await setup();
  const nums = Array.from(doc.querySelectorAll(".prh-pg-n b")).map(txt);
  check("headline: every wording, and the settled ones (the Commons row's pair)",
    nums[0] === n(f.wordings) && nums[1] === n(f.settled) && cr.pair[0].n === f.settled && cr.pair[0].of === f.wordings);
  const within = txt(doc.querySelector(".prh-pg-within"));
  check("headline: a rule's and a curator's wordings, and the articulations, are said under the bar",
    within.indexOf(n(f.rule_wordings) + " by a rule") >= 0 && within.indexOf(n(f.curator_only) + " more by a curator") >= 0
    && within.indexOf(n(f.settled_rows) + " of " + n(f.rows) + " articulations") >= 0);
  const steps = Array.from(doc.querySelectorAll(".prh-pg-step h4")).map(txt);
  check("milestones: five, in order", steps.join(" | ") ===
    "The rules applied | The head settled | The top 100 settled | The top 250 settled | Every wording settled");
  const firstLeft = f.held_by_screen ? "The rules applied" : f.head["50"].settled < f.head["50"].of ? "The head settled" : null;
  check("milestones: You are here on the first with work left",
    !firstLeft || txt(doc.querySelector(".prh-pg-step.prh-pg-here h4")) === firstLeft);
  const cards = Array.from(doc.querySelectorAll(".prh-pg-part h4")).map(txt);
  check("cards: eight, in order", cards.join(" | ") ===
    "The wordings | The rules | Rule groups to look at | Curator decisions | Across groups | Official names | Safety screens | Names and units");
  check("rules card: live, the wordings and groups a rule places",
    /Live/.test(txt(card(doc, "The rules"))) && txt(card(doc, "The rules")).indexOf("place " + n(f.rule_wordings) + " wordings in " + n(f.rule_groups) + " groups") >= 0);
  check("decisions card: the receipts' figures, and no word about the table when it was not read",
    txt(card(doc, "Curator decisions")).indexOf(n(f.decided) + " groups carry a decision") >= 0 && !/decisions table holds/.test(txt(card(doc, "Curator decisions"))));
  check("side column: the run log's next step", /Decide the head/.test(txt(doc.querySelector(".prh-pg-side"))));
  check("no NaN or undefined drawn", !/NaN|undefined/.test(txt(doc.body)));

  // A count opens the filter that lists it.
  const word = (re) => Array.from(doc.querySelectorAll("button.cq-word")).filter((b) => re.test(txt(b)))[0];
  word(new RegExp("^Open the " + n(f.unsettled) + " to decide$")).click();
  word(new RegExp("^Open the " + n(f.by_rule) + " folded$")).click();
  word(/^Open the decided$/).click();
  if (f.names_to_check) word(new RegExp("^Open the " + n(f.names_to_check) + " to check$")).click();
  check("a count opens its filter: open, auto, done, names",
    went.join(",") === "open,auto,done" + (f.names_to_check ? ",names" : ""));
  const chips = Array.from(doc.querySelectorAll(".prh-pg-left button.cq-word")).map(txt);
  check("left before the next milestone opens the wordings to decide",
    chips.length >= 1 && /wordings? to decide$/.test(chips[0]));

  // The live table, read: said on the card; differing from the receipts, said in its foot.
  const r1 = await setup({ api: { liveDecided: f.decided } });
  check("live table read and equal: the card says how many rows it holds, and no difference",
    txt(card(r1.doc, "Curator decisions")).indexOf("The decisions table holds " + n(f.decided) + " rows today") >= 0
    && !/differ/.test(txt(card(r1.doc, "Curator decisions"))));
  const r1b = await setup({ api: { liveDecided: f.decided + 7 } });
  check("live table ahead of the receipts: the card says a sitting has not landed its receipt",
    /has not landed its receipt/.test(txt(card(r1b.doc, "Curator decisions"))));

  // The Commons figures failing: the headline says so.
  const r3 = await setup({ fail: "kb/status/commons.json" });
  check("Commons figures unread: the headline says Could not be read", /Could not be read/.test(txt(r3.doc.querySelector(".prh-pg-hl"))));
  check("Commons figures unread: no zero in the headline", !/\b0 wordings/.test(txt(r3.doc.body)));
  // A Commons file from before S437: no wording figures, read as unread rather than drawn as zeros.
  const r3b = await setup({ commons: OLD });
  check("a Commons file without the wording figures reads Could not be read, never a zero",
    /Could not be read/.test(txt(r3b.doc.querySelector(".prh-pg-hl"))) && /no wording figures/.test(txt(r3b.doc.body)) && !/NaN|undefined/.test(txt(r3b.doc.body)));

  // The run log failing: the side column says so, the figures still draw.
  const r4 = await setup({ fail: "kb/status/cr.json" });
  check("run log unread: the side column names the file", /run log \(kb\/status\/cr\.json\) could not be read/.test(txt(r4.doc.querySelector(".prh-pg-side"))));

  // No module: the view says so.
  const r5 = await setup({ noModule: true });
  check("no module: the view says it could not be loaded", /could not be loaded/.test(txt(r5.doc.getElementById("mount"))));

  // ───────────────────────────── Part C — the tab ─────────────────────────────
  function tab(hash) {
    const dom = new JSDOM('<!doctype html><html><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
      { runScripts: "outside-only", url: "https://example.test/" + (hash || "") });
    const w = dom.window;
    w.fetch = () => new Promise(() => {});
    w.eval(TAB);
    return w;
  }
  const grp = (key, recs, extra) => Object.assign({ key, canonical: recs[0], rung: 5, acts_automatically: false, screens_objecting: [],
    wordings: recs.length, rows: 1, colleges: 1, credentials: 1, members: recs.map((r) => ({ rec: r, rows: 1 })) }, extra || {});
  const w = tab("#cr-reference/open");
  const S = w.CPL_CR_REFERENCE._state;
  check("#cr-reference/open opens the worklist on No rule or decision", w.CPL_CR_REFERENCE._route() && S.view === "worklist" && S.filter === "open");
  S.data = { _stats: {} }; S.stats = { distinct_strings: 6, total_rows: 6 }; S.loading = false;
  S.groups = [grp("a", ["a1", "a2"], { rung: 1, acts_automatically: true }), grp("b", ["b1"]), grp("c", ["c1"]), grp("d", ["d1"]),
    grp("n", ["n1"], { official_id: "AJ 110", title_divergent: true })];
  S.decisions = { b: { group_key: "b", decision: "confirmed", members: ["b1", "c1"], excluded: [] },
    d: { group_key: "d", decision: "deferred", members: ["d1"], excluded: [] } };
  const vis = w.CPL_CR_REFERENCE._visible().map((g) => g.key);
  check("No rule or decision: not a rule's group, not a decided one, not one whose wording was folded; a deferred one stays",
    vis.join(",") === "d,n");
  S.filter = "names";
  check("Name to check: the official number whose title shares no word", w.CPL_CR_REFERENCE._visible().map((g) => g.key).join(",") === "n");
  w.CPL_CR_REFERENCE._render();
  const chipText = Array.from(w.document.querySelectorAll(".crr-chip")).map(txt).join(" | ");
  check("the filter row counts the two new lists", /No rule or decision \(2\)/.test(chipText) && /Name to check \(1\)/.test(chipText));
  const views = Array.from(w.document.querySelectorAll("button.crr-view"));
  check("the view row: Progress, then Worklist pressed", views.map(txt).join(",") === "Progress,Worklist"
    && views[1].getAttribute("aria-pressed") === "true" && views[0].getAttribute("aria-pressed") === "false");
  const w1 = tab("");
  const root1 = w1.document.getElementById("cr-reference-root");
  root1.setAttribute("style", "border: 1px dashed var(--border-strong); text-align: center;");
  const S1 = w1.CPL_CR_REFERENCE._state;
  S1.data = { _stats: {} }; S1.stats = {}; S1.groups = []; S1.loading = false;
  w1.CPL_CR_REFERENCE._render();
  check("the module clears the shell's placeholder style once it paints (no centered text in a dashed box)", !root1.getAttribute("style"));
  const w2 = tab("#cr-reference/progress");
  check("#cr-reference/progress opens the Progress view", w2.CPL_CR_REFERENCE._route() && w2.CPL_CR_REFERENCE._state.view === "progress");
  const w3 = tab("#cr-reference/nope");
  check("an unknown word leaves the tab where it opens", !w3.CPL_CR_REFERENCE._route() && w3.CPL_CR_REFERENCE._state.view === "worklist"
    && w3.CPL_CR_REFERENCE._state.filter === "todo");
  check("the live count is withheld when no one is signed in", w.CPL_CR_REFERENCE._progressApi().liveDecided === null);

  let failed = 0;
  results.forEach(([name, ok]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + name); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
