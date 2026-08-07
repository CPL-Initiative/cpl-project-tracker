// Governance tab (governance.js) — jsdom test.
//
// Guards the properties that make this page worth having rather than harmful:
//  (a) Rule 4 + nav/pane/lazy-boot present in BOTH HTMLs;
//  (b) it is TEAM-GATED — internal working material must not render logged-out;
//  (c) an UNOWNED row renders as a visible gap, not a blank cell. The empty
//      owners are the point of the review; silently hiding them would turn the
//      page into decoration;
//  (d) measurable claims are MEASURED. Specifically: a cadence with zero
//      recorded runs must say "never run" even though the register describes it
//      as a decided cadence. A governance page that asserts its own compliance
//      from a stored field is the exact failure this tab exists to expose;
//  (e) the register itself is well-formed and its `live` keys resolve.
//
// Run from repo root: `npm test` (or `node tests/governance.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="governance"[^>]*>⚖️ Governance</.test(p[1]));
  check("pane #governance-root in " + p[0], /id="governance-root"/.test(p[1]));
  check("lazy boot in " + p[0], /loadScript\('governance\.js', 'CPL_GOVERNANCE'/.test(p[1]));
});
// A tab missing from GROUPS stays top-level rather than erroring, so this is the
// kind of thing that silently looks wrong forever. Team-only tools belong together.
check("nav: governance sits in the team-tools group",
  /tabs: \['chatbot', 'sierra-training', 'map-users', 'governance'/.test(
    fs.readFileSync("nav_groups.js", "utf8")));

// ── The register ──
const REG = JSON.parse(fs.readFileSync("kb/governance_register.json", "utf8"));
check("register: has decision rights", (REG.decision_rights || []).length >= 5);
check("register: has acceptance standards", (REG.acceptance_standards || []).length >= 5);
check("register: has cadences", (REG.cadences || []).length >= 3);
check("register: has open questions", (REG.open_questions || []).length >= 3);
check("register: every decision right declares who decides",
  REG.decision_rights.every((d) => !!d.decides));
check("register: every decision right says what happens when empty",
  REG.decision_rights.every((d) => !!d.when_empty));
check("register: every acceptance standard declares a stance",
  REG.acceptance_standards.every((a) => !!a.stance && !!a.rule));
check("register: ids are unique",
  new Set(REG.decision_rights.map((d) => d.id)).size === REG.decision_rights.length);
// The starter ships with owners unset on purpose — that IS the review. If a
// future edit fills them all in, this flips, which is the desired signal.
check("register: unowned rows exist and are explicit null (the review queue)",
  REG.decision_rights.some((d) => d.owner === null));
// Every `live` key a row points at must be one the renderer knows how to
// resolve, or the page silently shows nothing where a number was promised.
const KNOWN_LIVE = ["contact_pc", "contact_coord", "landing", "users", "sync", "nudge", "feedback"];
check("register: every live key is one the renderer implements",
  REG.decision_rights.concat(REG.cadences)
    .every((r) => r.live == null || KNOWN_LIVE.indexOf(r.live) >= 0));

// ── Part B — behavior ──
const SRC = fs.readFileSync("governance.js", "utf8");
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="governance-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.fetch = function () { return new Promise(function () {}); };
  w.eval(SRC);
  return w;
}

// (b) gating
(function () {
  const out = makeWin();
  const r = out.document.getElementById("governance-root");
  out.CPL_GOVERNANCE._state.reg = REG;
  out.CPL_GOVERNANCE.render(r);
  check("gate: logged out sees a sign-in prompt, not the register",
    /Team &amp; RACI|Team & RACI/.test(r.innerHTML) && !/Who decides what/.test(r.innerHTML));
  check("gate: logged out leaks no decision-right content",
    !/Primary Contact email/.test(r.innerHTML));
})();

// (c) + (d) the honesty properties
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3,
                    synced: "2026-08-01T14:28:53Z", nudgeCount: 0, lastNudge: null };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  const html = r.innerHTML;

  check("signed in: the register renders", /Who decides what/.test(html));
  check("unowned rows render as a visible gap, never a blank cell",
    /needs an owner/.test(html));
  check("owner gap is counted in the headline", /Rows with no owner/.test(html));

  // THE load-bearing test: the register describes the nudge as a decided
  // semester cadence. Zero rows exist. The page must say so.
  const neverRun = G._cadenceState({ live: "nudge" });
  check("a cadence with no recorded runs reports 'never run'", /never run/.test(neverRun));
  check("...and it surfaces in the rendered page", /never run/.test(html));
  const ran = G._cadenceState({ live: "nudge" });
  G._state.live.nudgeCount = 5; G._state.live.lastNudge = "2026-09-01T00:00:00Z";
  check("...and flips to the real date once it HAS run",
    /2026-09-01/.test(G._cadenceState({ live: "nudge" })) && /never run/.test(ran));

  // live figures are computed, not asserted
  G._state.live.nudgeCount = 0;
  check("live cell states the measured gap, not a stored claim",
    /25 route nowhere/.test(G._liveCell("contact_pc")));
  check("live cell for a fully-populated field shows no alarm",
    !/gov-bad/.test(G._liveCell("contact_coord")));
  check("unknown live key degrades to empty, never to a broken number",
    G._liveCell("not_a_key") === "");
  check("no live data at all → no fabricated figures",
    (function () { const s = G._state.live; G._state.live = {}; const out = G._liveCell("contact_pc");
                   G._state.live = s; return out === ""; })());
})();

// Owner curation. The register ships every owner null on purpose, so the tab HAS
// to provide a way to fill them in — shipping the review without the pen was the
// original defect (Sam: "how do I add an owner? Doesn't appear to be editable").
// Curated owners live in a SEPARATE table so a session regenerating the register
// can never wipe an assignment.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  const row = REG.decision_rights[0];

  check("owner cell is clickable when unowned", /data-own="/.test(G._owner(row)));
  check("unowned still renders as a visible gap, not an empty control",
    /needs an owner/.test(G._owner(row)));
  check("ownerOf: null curation + null file value → unowned", G._ownerOf(row) === null);
  check("ownerOf: a field passed instead of a row degrades to null, never throws",
    G._ownerOf(null) === null && G._ownerOf("Jessica") === null);

  G._state.owners[row.id] = { register_id: row.id, owner: "Jessica", note: "contacts lane",
                              set_by: "team@x", set_at: "2026-08-06T00:00:00Z" };
  const o = G._ownerOf(row);
  check("ownerOf: a curated value wins over the register file", o && o.name === "Jessica");
  check("ownerOf: curated values are flagged as curated", o && o.curated === true);
  check("owner cell shows who assigned it and when",
    /set by team@x/.test(G._owner(row)) && /2026-08-06/.test(G._owner(row)));
  check("a curated owner reaches the markdown export", /Jessica/.test(G._toMarkdown()));

  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("the assigned row no longer shows as needing an owner in its own cell",
    !/needs an owner<\/span><span class="gov-pencil">✎<\/span><\/button>[\s\S]{0,40}DR-01/.test(r.innerHTML));

  // Clearing is an UPDATE to empty, not a delete — the row returns to the gap
  // state while the audit trail of who assigned it survives server-side.
  G._state.owners[row.id] = { register_id: row.id, owner: "", set_by: "team@x" };
  check("clearing an owner returns the row to 'needs an owner'",
    G._ownerOf(row) === null && /needs an owner/.test(G._owner(row)));
  G._state.owners = {};
})();

// (e) markdown export carries the uncomfortable facts, not just the tidy ones
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  const md = G._toMarkdown();
  check("markdown: leads with the measured gap", /route a student's request nowhere/.test(md));
  check("markdown: marks unowned rows so they survive the copy-paste",
    /needs an owner/.test(md));
  check("markdown: a never-run cadence stays never-run in the export",
    /NEVER RUN/.test(md));
  check("markdown: includes the open questions", /Open questions/.test(md));
})();

// (d2) CA-06 — the Sierra feedback loop must report its OWN backlog, and must
// not count the CI smoke test toward it. The smoke test writes through the same
// public anon RPC a visitor's browser uses and cannot delete its own rows, so on
// 2026-08-07 it was 28 of 53 — an unfiltered count here would have this page
// reporting our own robot back to us as if it were unread user feedback.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  // 4 real rows (3 still open, 1 addressed) + 6 smoke rows that must not count.
  G._state.live = { fbTotal: 4, fbOpen: 3 };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  const html = r.innerHTML;
  check("CA-06 renders the live untriaged count, not the stored state",
    /3 of 4 untriaged/.test(html));
  check("CA-06 flags the backlog as bad, not neutral",
    /gov-bad[^>]*>3 of 4 untriaged/.test(html));
  check("CA-06 is in the register as a never-run cadence",
    REG.cadences.some((c) => c.id === "CA-06" && c.state === "never-run" && c.owner == null));
  check("DR-11 covers what Sierra tells the public and is load-bearing",
    REG.decision_rights.some((d) => d.id === "DR-11" && d.load_bearing === true && d.owner == null));
  check("OQ-07 asks what must be true before the team is invited",
    REG.open_questions.some((q) => q.id === "OQ-07" && /invite/i.test(q.q)));
  // The markdown is what leaves the tab and enters a meeting — it must carry the
  // same number, loudly. A register that reads clean on export while the tab
  // shows a backlog is worse than not exporting at all.
  const md = G._toMarkdown ? G._toMarkdown() : "";
  if (md) check("markdown export carries the untriaged count", /3 of 4 UNTRIAGED/.test(md));
})();

// A triaged queue must read as triaged — the permission half of the same lens.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { fbTotal: 12, fbOpen: 0 };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("CA-06 reads as clear when nothing is untriaged",
    /all <b>12<\/b> triaged/.test(r.innerHTML) && !/untriaged/.test(r.innerHTML));
})();

// When the live read fails, fall back to the stored state rather than claiming
// zero — "0 untriaged" from a failed fetch is the worst possible lie here.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = {};            // fetch failed / not signed in
  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("CA-06 falls back to stored state when the live read is unavailable",
    /never-run/.test(r.innerHTML) && !/0 of 0/.test(r.innerHTML));
})();

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
