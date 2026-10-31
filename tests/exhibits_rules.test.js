// Rules (Sam, 2026-10-31): "can you add a link to a view of all the rules used to suggest or fold exhibit
// titles?", and Open Asks Sheet 149 card 2 ("routine"): a rule added in the Exhibits tab becomes a request
// row that the CPL queue routine builds switched off, dry-runs and returns for Turn on or Discard.
// These checks pin:
//   - the view: every procedure with its words, who set it and the last run's tallies; Another look's rules
//     with their cards; the rules sent to the routine, each in its state; reachable from the views row, from
//     Another look's rule filter and at #exhibits/rules;
//   - the writes: Send to the routine writes one request row (cer_procedure_request, JSON); Turn on and Discard
//     write the request's switch row, merging on its key; signed out, nothing is written;
//   - the record around it: Governance maps the three fields to DR-07, and step 7 of the scheduled sessions
//     page tells the routine how to work a request.
//
// Run from repo root: `npm test` (or `node tests/exhibits_rules.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── static ──
const src = fs.readFileSync("exhibits.js", "utf8");
const gov = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
check("Governance maps the request, built and switch fields to DR-07",
  ["cer_procedure_request", "cer_procedure_built", "cer_procedure_switch"].every(function (f) { return gov.mapped["field:kb_curation." + f] === "DR-07"; }));
const sched = fs.readFileSync("docs/reference/scheduled_sessions.md", "utf8");
check("the scheduled sessions page tells the routine how to work a request",
  /Rules sent from the Exhibits tab/.test(sched) && /_CER\\?_PROCEDURE\\?_REQUEST::/.test(sched) && /--try/.test(sched)
  && /cer_procedure_built/.test(sched) && /cer_procedure_switch/.test(sched));
check("exhibits.js writes the request rows under their own key", /"_CER_PROCEDURE_REQUEST::"/.test(src)
  && /"cer_procedure_request"/.test(src) && /"cer_procedure_switch"/.test(src));
check("the procedures store says what request and an off rule mean",
  /`request`/.test(JSON.parse(fs.readFileSync("kb/cer_procedures.json", "utf8"))._about));

// ── fixtures ──
const REVIEW = { schema: 1, written_at: "2026-11-01T07:50:00Z", sources: { procedures_run: "2026-11-01T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 },
  steps: {}, colleges: ["Las Positas College"],
  held: [{ raw: "Held one", step: "Proposed", title: "Held One", issuer: "", ids: ["X-1"], art: [0], could: [], under: [], under_count: 0, exists: false }] };
const SWEEP = { schema: 1, generated_at: "2026-11-01T07:52:00Z",
  rules: [{ id: "ase", label: "ASE", tip: "An automotive course gets the ASE test in parentheses.", words: "Auto exhibits are most often aligned with ASE cert titles" },
    { id: "numerals", label: "Numerals", tip: "Roman level numerals become 1, 2, 3." }],
  cards: [{ id: "c-ase", rules: ["ase"], current: "Engine Repair", proposed: "Engine Repair (ASE A1 Engine Repair)", why: ["the course is A1"],
    issuer: "", locals: [{ raw: "Noncredit for AUTO A1", colleges: [], course: "AUTO A1", credit: "" }],
    proposed_exists: false, proposed_locals: 0, proposed_issuer: "", current_locals: 1, moves_all: true }] };
const R = "_CER_PROCEDURE_REQUEST::";
const STORE = { _about: "x", procedures: [
  { id: "brand-family", name: "Brand families join the family", kind: "rule", on: true, rule: "An AP title takes College Board's official exam name.",
    lanes: ["family", "ap"], source: { who: "Sam", date: "2026-07-07", words: "all the APs should be an easy win, right?" },
    amended: [{ who: "Sam", date: "2026-10-31", words: "rely on the official titles from AP" }] },
  { id: "ase-paren", name: "Name the ASE test", kind: "guidance", on: true, rule: "An automotive course names its ASE test in parentheses.",
    source: { who: "Sam", date: "2026-10-31", words: "add those as the suggested titles" } },
  { id: "ib-official", name: "IB takes the official name", kind: "rule", on: false, rule: "An IB title takes the IBO's subject name.", lanes: ["ib"],
    request: R + "2026-10-31T20:00:00Z-aa11", source: { who: "Sam", date: "2026-10-31", words: "IB on the AP pattern" } },
  { id: "clep-official", name: "CLEP takes the official name", kind: "rule", on: true, rule: "A CLEP title takes the College Board's exam name.", lanes: ["clep"],
    request: R + "2026-10-30T20:00:00Z-bb22", source: { who: "Sam", date: "2026-10-30", words: "then CLEP's official names" } }] };
const REPORT = { _generated_at: "2026-11-01T07:47:00Z", procedures: [
  { id: "brand-family", settled: 30, held: 64 }, { id: "ase-paren", settled: 0, held: 2 }, { id: "classifier", settled: 12, held: 3 }] };
const BUILT_IB = JSON.stringify({ procedure: "ib-official", name: "IB takes the official name", kind: "rule", pr: 2630, at: "2026-11-01T06:20:00Z",
  queue: { waiting: 40, settled: 6, held: 1, changed: 6, examples: [["IB Hist HL", "IB History HL"]] },
  reference: { read: 201, differ: 9, examples: [["IB Lang A Lit", "IB Language A: Literature", "IB Language A: Literature HL"]] } });
function rows() {
  return [
    { course_id: R + "2026-10-31T20:00:00Z-aa11", field: "cer_procedure_request", value: JSON.stringify({ words: "IB on the AP pattern", raw: "IB Hist HL", title: "IB History HL", issuer: "International Baccalaureate" }), reviewer_email: "slee@cccco.edu", reviewed_at: "2026-10-31T20:00:00Z" },
    { course_id: R + "2026-10-31T20:00:00Z-aa11", field: "cer_procedure_built", value: BUILT_IB, reviewer_email: "cer-routine-s540@bot", reviewed_at: "2026-11-01T06:20:00Z" },
    { course_id: R + "2026-10-30T20:00:00Z-bb22", field: "cer_procedure_request", value: JSON.stringify({ words: "then CLEP's official names" }), reviewer_email: "slee@cccco.edu", reviewed_at: "2026-10-30T20:00:00Z" },
    { course_id: R + "2026-10-31T21:00:00Z-cc33", field: "cer_procedure_request", value: JSON.stringify({ words: "Drop a trailing for." }), reviewer_email: "slee@cccco.edu", reviewed_at: "2026-10-31T21:00:00Z" },
    { course_id: R + "2026-10-29T21:00:00Z-dd44", field: "cer_procedure_request", value: JSON.stringify({ words: "Something impossible" }), reviewer_email: "slee@cccco.edu", reviewed_at: "2026-10-29T21:00:00Z" },
    { course_id: R + "2026-10-29T21:00:00Z-dd44", field: "cer_procedure_built", value: JSON.stringify({ could_not: "The words name no title to change." }), reviewer_email: "cer-routine-s540@bot", reviewed_at: "2026-10-30T06:00:00Z" },
    { course_id: "_UNCLASSIFIED::Not a request", field: "cer_procedure_request", value: "{}", reviewer_email: "x", reviewed_at: "2026-10-29T00:00:00Z" }
  ];
}

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null, headers: init.headers || {} });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (url === "kb/exhibits_sweep.json") return ok(SWEEP);
    if (url === "kb/cer_procedures.json") return opts.noStore ? bad(404) : ok(STORE);
    if (url === "kb/cer_procedures_out/latest.json") return ok(REPORT);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return opts.rowsFail ? bad(503) : ok(opts.rows || rows());
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function byText(d, sel, t) { return Array.from(d.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
function writes(t) { return t.calls.filter(function (c) { return /kb_curation/.test(c.url) && c.method !== "GET"; }); }
function cardFor(d, words) { return Array.from(d.querySelectorAll("article.exh-rq")).find(function (a) { return txt(a.querySelector(".exh-rq-words")) === words; }); }

(async function () {
  // ── the view, signed out, opened by its address ──
  let t = load({ hash: "#exhibits/rules" });
  await t.M.boot(); await settle();
  const root = t.d.getElementById("exhibits-root");
  check("#exhibits/rules opens the Rules view, current in the views row",
    /^Rules/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))));
  check("the views row counts the rules waiting on a person (one built, not yet turned on)",
    txt(t.d.querySelector('.exh-views [aria-current="page"] .exh-n')) === "1");
  check("every procedure is listed with its name, in the store's order, and the classifier last",
    Array.from(t.d.querySelectorAll("#exh-rules-procs ~ .exh-rq-list h4")).map(txt).join("|")
      === "Brand families join the family|Name the ASE test|IB takes the official name|CLEP takes the official name|The classifier decides the rest");
  const bf = Array.from(t.d.querySelectorAll("article.exh-rq")).find(function (a) { return txt(a.querySelector("h4")) === "Brand families join the family"; });
  check("a procedure shows its words, who set it with their words, each amendment and the last run's tallies",
    /An AP title takes College Board's official exam name\./.test(txt(bf)) && /Set by Sam, 2026-07-07: “all the APs should be an easy win, right\?”/.test(txt(bf))
    && /Amended by Sam, 2026-10-31: “rely on the official titles from AP”/.test(txt(bf)) && /settled 30 and held 64 for a person/.test(txt(bf)));
  const ib = Array.from(t.d.querySelectorAll("article.exh-rq")).find(function (a) { return txt(a.querySelector("h4")) === "IB takes the official name"; });
  check("an off procedure sent from the tab says both", /Switched off\. Sent from this tab/.test(txt(ib)));
  check("the last run's time is named", /Last run 2026-11-01 07:47Z/.test(txt(root)));
  const swSec = t.d.getElementById("exh-rules-sweep");
  check("Another look's rules are listed with their words and tonight's cards",
    /Another look: titles already in the reference \(2\)/.test(txt(swSec)) && /An automotive course gets the ASE test in parentheses\./.test(txt(root))
    && /Sam, 2026-10-31: “Auto exhibits are most often aligned with ASE cert titles”/.test(txt(root)) && /1 card tonight/.test(txt(root)) && /0 cards tonight/.test(txt(root)));

  // the rules sent, newest first, each in its state
  const sent = Array.from(t.d.querySelectorAll("#exh-rules-sent ~ .exh-rq-list .exh-rq-words")).map(txt);
  check("the rules sent are listed newest first, and a row outside the request key is ignored",
    sent.join("|") === "Drop a trailing for.|IB on the AP pattern|then CLEP's official names|Something impossible");
  check("a request not yet built waits for the routine's run", /Waiting\. The CPL queue routine's first run of the night, at 10:12 PM Pacific/.test(txt(cardFor(t.d, "Drop a trailing for."))));
  const ibc = cardFor(t.d, "IB on the AP pattern");
  check("a built request shows its dry run on the queue and the reference, its examples and its pull request",
    /Ready for you\./.test(txt(ibc)) && /On the queue of 40 waiting titles, it settles 6 and holds 1 for you\./.test(txt(ibc))
    && /In the reference, it reads 201 titles, and 9 read differently from their canonical title\./.test(txt(ibc))
    && /IB Hist HL → IB History HL/.test(txt(ibc)) && /IB Lang A Lit: IB Language A: Literature → IB Language A: Literature HL/.test(txt(ibc))
    && ibc.querySelector('a[href="https://github.com/CPL-Initiative/cpl-project-tracker/pull/2630"]'));
  check("a built request offers Turn on and Discard", byText(ibc, "button", "Turn on") && byText(ibc, "button", "Discard"));
  check("the example the request was sent with is shown", /Example: “IB Hist HL” should read “IB History HL”, issued by International Baccalaureate\./.test(txt(ibc)));
  check("a request whose procedure the store has on reads On", /^On\./.test(txt(cardFor(t.d, "then CLEP's official names").querySelector(".exh-rq-state"))));
  check("a request the routine could not build says why", /Could not build\. The routine could not build it\. The words name no title to change\./.test(txt(cardFor(t.d, "Something impossible"))));
  byText(ibc, "button", "Turn on").click(); await settle();
  check("signed out, Turn on asks for a sign-in and writes nothing", writes(t).length === 0 && /Sign in as a reviewer to turn a rule on/.test(txt(t.d.querySelector(".exh-status"))));
  check("no emoji or pictograph in the view", !/\p{Extended_Pictographic}/u.test(txt(root)));

  // ── signed in: Turn on, then Discard instead ──
  t = load({ hash: "#exhibits/rules", signedIn: true });
  await t.M.boot(); await settle();
  byText(cardFor(t.d, "IB on the AP pattern"), "button", "Turn on").click(); await settle();
  let w = writes(t);
  check("Turn on writes the request's switch row, merging on its key",
    w.length === 1 && w[0].body.course_id === R + "2026-10-31T20:00:00Z-aa11" && w[0].body.field === "cer_procedure_switch"
    && w[0].body.value === "on" && w[0].body.reviewer_email === "reviewer@example.org" && /resolution=merge-duplicates/.test(w[0].headers.Prefer));
  check("the status says the routine switches it on at its next run", /The routine switches it on at its next run/.test(txt(t.d.querySelector(".exh-status"))));

  // the switch read back: turning on, with Discard instead
  const turned = rows().concat([{ course_id: R + "2026-10-31T20:00:00Z-aa11", field: "cer_procedure_switch", value: "on", reviewer_email: "slee@cccco.edu", reviewed_at: "2026-11-01T15:00:00Z" }]);
  t = load({ hash: "#exhibits/rules", signedIn: true, rows: turned });
  await t.M.boot(); await settle();
  const ibt = cardFor(t.d, "IB on the AP pattern");
  check("a switch row the routine has not carried out reads Turning on, by whom and when",
    /^Turning on\./.test(txt(ibt.querySelector(".exh-rq-state"))) && /Turned on 2026-11-01 15:00Z by slee@cccco\.edu/.test(txt(ibt)));
  byText(ibt, "button", "Discard instead").click(); await settle();
  w = writes(t);
  check("Discard instead replaces the switch", w.length === 1 && w[0].body.value === "discard" && w[0].body.field === "cer_procedure_switch");

  // the state function alone
  const S = t.M._requestState;
  check("the store settles a request's state; a switch shows until the routine acts",
    S({ proc: { on: true } }) === "on" && S({ proc: { on: false }, sw: "on" }) === "turning-on" && S({ proc: { on: false }, sw: "discard" }) === "discarding"
    && S({ sw: "discard" }) === "discarded" && S({ built: { could_not: "x" } }) === "could-not" && S({ built: { procedure: "p" } }) === "built"
    && S({ proc: { on: false } }) === "built" && S({}) === "waiting");

  // ── Send to the routine from a Review card ──
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  byText(t.d, ".exh-acts button", "Teach a rule").click(); await settle();
  byText(t.d, ".exh-teach button", "Send to the routine").click(); await settle();
  check("an empty rule asks for its words and writes nothing", writes(t).length === 0 && /Write the rule first/.test(txt(t.d.getElementById("exh-teach"))));
  const ta = t.d.getElementById("exh-teach-words");
  ta.value = "Drop a trailing for."; ta.dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-teach button", "Send to the routine").click(); await settle();
  w = writes(t);
  const ask = w.length === 1 ? JSON.parse(w[0].body.value) : {};
  check("Send to the routine writes one request row with the words, the example, its title and issuer",
    w.length === 1 && /^_CER_PROCEDURE_REQUEST::\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ-[0-9a-f]{1,4}$/.test(w[0].body.course_id)
    && w[0].body.field === "cer_procedure_request" && w[0].body.reviewer_email === "reviewer@example.org"
    && ask.words === "Drop a trailing for." && ask.raw === "Held one" && ask.title === "Held One" && ask.issuer === "");
  check("the card says it waits under Rules", /Sent to the routine\. It waits under Rules/.test(txt(t.d.querySelector(".exh-status"))));
  check("Copy for a session stays beside it", (function () {
    byText(t.d, ".exh-acts button", "Teach a rule").click();
    return !!byText(t.d, ".exh-teach button", "Copy for a session");
  })());

  // ── reached from Another look ──
  t = load({});
  await t.M.boot(); await settle();
  Array.from(t.d.querySelectorAll(".exh-step")).find(function (b) { return /Another look/.test(txt(b)); }).click(); await settle();
  byText(t.d, ".exh-views button", "Every rule, with its words").click(); await settle();
  check("Another look's rule filter links to every rule", /^Rules/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))) && !!t.d.getElementById("exh-rules-procs"));
  byText(t.d, "#exh-rules-sweep ~ .exh-rq-list button", "Open them").click(); await settle();
  check("Open them returns to Another look on that rule", /Current title: Engine Repair/.test(txt(t.d.querySelector("section.exh-card"))));

  // ── rows that cannot be read ──
  t = load({ hash: "#exhibits/rules", rowsFail: true });
  await t.M.boot(); await settle();
  check("rules sent that cannot be read say so, and the procedures still list",
    /The rules sent could not be read \(HTTP 503\)/.test(txt(t.d.getElementById("exhibits-root"))) && t.d.querySelectorAll("#exh-rules-procs ~ .exh-rq-list h4").length === 5);

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
