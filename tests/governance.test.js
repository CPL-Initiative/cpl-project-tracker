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
  check("nav button in " + p[0], /data-tab="governance"[^>]*>Governance</.test(p[1]));
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
  // Load the shared phrase helper too — production ships both, and the locked
  // state renders its banner. Without it the tab falls back to a plain notice,
  // which is a real path but not the one a browser takes.
  w.eval(fs.readFileSync("team_phrase.js", "utf8"));
  w.eval(SRC);
  return w;
}

// (b) gating
(function () {
  const out = makeWin();
  const r = out.document.getElementById("governance-root");
  out.CPL_GOVERNANCE._state.reg = REG;
  out.CPL_GOVERNANCE.render(r);
  // Was: asserts the copy names "Team & RACI". That tab no longer offers a
  // magic link and never needed to be visited for the phrase, so the guard now
  // asserts the thing that actually matters — a locked tab hands you a way IN.
  check("gate: logged out gets an unlock box, not the register",
    /data-tp-locked/.test(r.innerHTML) && !/Who decides what/.test(r.innerHTML));
  check("gate: …and the box is a real input, not a pointer elsewhere",
    !!r.querySelector('[data-tp-locked] input[type="password"]'));
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

// ⚠️ FIRST-CLICK SAVE. Sam, 2026-08-07: "the save button doesn't work the first
// time clicked. Need to open it again and reclick, then it takes."
//
// Cause: commit() called render(root) BEFORE saveOwner(), but saveOwner is what
// performs the optimistic local write (state.owners[id] = payload) — so the
// repaint painted the pre-change state and nothing repainted on success. The
// second open+click worked only because the FIRST click's write was by then in
// state. The save had always reached Supabase; only the UI lied.
//
// Every existing owner test above passed straight through this bug, because they
// all set state.owners directly and called render(). None of them drove the
// actual button → dialog → Save path. This one does, and it asserts the thing
// the user actually experiences: ONE click, value visible.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.owners = {};
  const r = w.document.getElementById("governance-root");
  G.render(r);

  // The in-flight fetch never settles (makeWin's stub), which is exactly the
  // real-world moment under test: the optimistic write has happened, the network
  // has not come back yet. The row must already show the owner.
  const openBtn = r.querySelector('[data-own="DR-01"]');
  check("first-click: the owner cell is reachable as a button", !!openBtn);
  openBtn.dispatchEvent(new w.Event("click", { bubbles: true }));

  const dlg = w.document.getElementById("gov-own-dlg");
  check("first-click: clicking the cell opens the dialog", !!dlg);
  dlg.querySelector("#gov-own-name").value = "Jessica";
  dlg.querySelector("[data-own-save]").dispatchEvent(new w.Event("click", { bubbles: true }));

  check("first-click: the dialog closes on Save",
    !w.document.getElementById("gov-own-dlg"));
  check("first-click: the optimistic write reached state",
    G._state.owners["DR-01"] && G._state.owners["DR-01"].owner === "Jessica");
  // THE REGRESSION. Before the fix this was false — one click left the row
  // reading "needs an owner" and the user had to reopen and save again.
  check("⚠ first-click: the name is VISIBLE after a single Save",
    /Jessica/.test(r.innerHTML));
  check("first-click: DR-01 no longer advertises itself as unowned",
    !/DR-01[\s\S]{0,600}?needs an owner/.test(r.innerHTML));
})();

// The same path for Clear owner — it shares commit(), so it shared the bug.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.owners = { "DR-01": { register_id: "DR-01", owner: "Jessica", set_by: "t@x",
                                 set_at: "2026-08-06T00:00:00Z" } };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("clear: the assigned name renders before clearing", /Jessica/.test(r.innerHTML));

  r.querySelector('[data-own="DR-01"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  w.document.getElementById("gov-own-dlg")
    .querySelector("[data-own-clear]").dispatchEvent(new w.Event("click", { bubbles: true }));

  check("⚠ clear: the row reverts on a single click", !/Jessica/.test(r.innerHTML));
  check("clear: the row goes back to advertising the gap", /needs an owner/.test(r.innerHTML));
})();

// Enter in the name field is the same commit() path and must behave identically —
// a keyboard user must not hit the bug the mouse user just stopped hitting.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.owners = {};
  const r = w.document.getElementById("governance-root");
  G.render(r);
  r.querySelector('[data-own="CA-06"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  const nameEl = w.document.getElementById("gov-own-name");
  nameEl.value = "Malone";
  const ev = new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true });
  nameEl.dispatchEvent(ev);
  check("⚠ enter-key: a single Enter shows the owner too", /Malone/.test(r.innerHTML));
})();

// A FAILED OWNERS READ MUST NOT READ AS "NOBODY HAS AN OWNER". Found by the
// adversarial sweep run alongside the first-click fix. loadOwners used to do
// `r.ok ? r.json() : []`, so a 401 / 500 / RLS change produced an empty map:
// every colleague's assignment vanished from the page and the red "no owner"
// count jumped to its maximum, with nothing saying a read had failed. On a page
// whose whole job is showing who is accountable, silently answering "no one"
// because the network hiccuped is the worst available answer.
(function (done) {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.owners = { "DR-01": { register_id: "DR-01", owner: "Jessica", set_by: "t@x",
                                 set_at: "2026-08-06T00:00:00Z" } };
  // the shape that used to wipe everything: a reachable server refusing the read
  w.fetch = function () { return Promise.resolve({ ok: false, status: 401,
                                                   json: function () { return Promise.resolve([]); } }); };
  G._loadOwners().then(function () {
    check("⚠ failed owners read does NOT wipe the known owners",
      G._state.owners["DR-01"] && G._state.owners["DR-01"].owner === "Jessica");
    check("failed owners read raises the stale flag", G._state.ownersStale === true);
    const r = w.document.getElementById("governance-root");
    G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
    G.render(r);
    check("⚠ a stale owners read announces itself instead of rendering a confident count",
      /Could not read the assigned owners/.test(r.innerHTML));
    check("the last known-good owner is still shown while stale", /Jessica/.test(r.innerHTML));
    done();
  });
})(ownersOkTest);

// ...and a SUCCESSFUL read clears the flag, so the banner cannot stick.
function ownersOkTest() {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.ownersStale = true;
  w.fetch = function () {
    return Promise.resolve({ ok: true, json: function () {
      return Promise.resolve([{ register_id: "CA-06", owner: "Ashley", set_by: "t@x",
                                set_at: "2026-08-07T00:00:00Z" }]); } });
  };
  G._loadOwners().then(function () {
    check("a successful read clears the stale flag", G._state.ownersStale === false);
    check("a successful read replaces the map", G._state.owners["CA-06"].owner === "Ashley");
    const r = w.document.getElementById("governance-root");
    G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
    G.render(r);
    check("the stale banner is gone once the read succeeds",
      !/Could not read the assigned owners/.test(r.innerHTML));
    signInRefreshTest();
  });
}

// SIGNING IN AFTER OPENING THE TAB must re-run the gated reads. activate() used
// to early-return on `if (state.reg)`, so a tab first opened logged-out kept its
// empty owners and empty live figures forever — a fully-populated-looking
// register with every owner missing and a cadence accused in red of never having
// run, all of it an artifact of reads that were never made.
function signInRefreshTest() {
  const w = makeWin();                       // logged OUT
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.loadedSignedIn = false;           // loaded while logged out
  G._state.loading = false;
  check("precondition: the harness starts logged out", G._signedIn() === false);

  G.activate();
  check("no sign-in change → cheap re-render, no refetch", G._state.loading === false);

  w.localStorage.setItem("cpl_team_pass", "phrase-1");   // the user signs in
  check("precondition: now signed in", G._signedIn() === true);
  G.activate();
  check("⚠ signing in after load triggers a refetch of the gated reads",
    G._state.loading === true);
  finish();
}

// ── Drift candidates (OQ-08) ────────────────────────────────────────────────
// The detector PROPOSES; it must never look like it added anything. And the
// strip must not become the thing it was built to prevent: the first draft
// produced 39 undifferentiated candidates, which is a list read once and never
// again. Grouping + the surface map are what make it usable, so both are
// asserted here rather than left to inspection.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.cand = {
    _counts: { candidates: 3, already_mapped: 6, dismissed: 14, scanned: 23 },
    candidates: [
      { key: "stale:DR-99", kind: "stale_row", label: "DR-99 — gone", detail: "References kb/nope.py" },
      { key: "workflow:x.yml", kind: "cadence", label: "CPL News harvest", detail: "Scheduled: 17 13 * * *" },
      { key: "table:projects", kind: "decision_right", label: "projects", detail: "Written from project_add.js" },
    ],
  };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  const html = r.innerHTML;

  check("candidates strip renders with its count", /Not on the register \(3\)/.test(html));
  check("⚠ the strip says PROPOSALS ONLY, never auto-added",
    /proposals only/i.test(html) && /never added automatically/i.test(html));
  check("the strip discloses what was mapped and dismissed, not just what's left",
    /6 more surface\(s\) already map/.test(html) && /14 are dismissed/.test(html));
  check("the strip names where a dismissal reason lives",
    /governance_surface_map\.json/.test(html));
  // Ranking: a register row that is actively WRONG outranks a missing one.
  check("stale rows are grouped first", html.indexOf("no longer exists") < html.indexOf("no cadence row"));
  check("cadences outrank decision rights",
    html.indexOf("no cadence row") < html.indexOf("no decision right"));
  check("each candidate shows its evidence, not just a name",
    /Scheduled: 17 13/.test(html) && /Written from project_add\.js/.test(html));

  // The button must not overclaim. It re-reads a committed scan; it cannot scan
  // the repo from a browser, and saying otherwise would be the kind of quiet
  // false claim this whole tab exists to prevent.
  check("refresh button is present", !!r.querySelector("[data-gov-refresh]"));
  check("⚠ refresh does not claim to re-scan the codebase",
    /cannot re-scan the codebase from a browser/.test(html));
})();

// An empty candidate list must read as CLEAR, not as a broken scan.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.cand = { _counts: { candidates: 0, already_mapped: 9, dismissed: 14, scanned: 23 }, candidates: [] };
  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("no candidates reads as accounted-for, not as an error",
    /Nothing unaccounted for/.test(r.innerHTML));
})();

// A MISSING candidates file must not take the register down with it — the strip
// is an addition to this page, not a dependency of it.
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOVERNANCE;
  G._state.reg = REG;
  G._state.live = { total: 123, pc: 98, coord: 48, landing: 120, zeroUsers: 3, nudgeCount: 0 };
  G._state.cand = null;
  const r = w.document.getElementById("governance-root");
  G.render(r);
  check("a missing candidates file degrades to nothing, not to a broken page",
    G._renderCandidates() === "" && /Who decides what/.test(r.innerHTML));
})();

// The committed artifact must match what the detector produces right now —
// otherwise the tab shows yesterday's drift and quietly misleads.
(function () {
  const fsx = require("fs");
  if (!fsx.existsSync("kb/governance_candidates.json")) {
    check("committed candidates artifact exists", false);
    return;
  }
  const d = JSON.parse(fsx.readFileSync("kb/governance_candidates.json", "utf8"));
  check("committed candidates artifact exists", true);
  check("artifact records which script produced it",
    /_build_governance_candidates\.py/.test(d._generated_by || ""));
  check("artifact carries counts the strip can disclose",
    d._counts && typeof d._counts.candidates === "number" &&
    typeof d._counts.dismissed === "number");
  check("every candidate carries evidence a human can check",
    (d.candidates || []).every((c) => c.key && c.label && c.detail && c.where));
  check("candidate kinds are ones the renderer groups",
    (d.candidates || []).every((c) => ["stale_row", "cadence", "decision_right"].indexOf(c.kind) >= 0));
  // The noise guard, as a number. 39 was the unfiltered first draft; if the list
  // ever climbs back there the filters have stopped doing their job and the strip
  // is on its way to being ignored.
  //
  // Raised 25 -> 30 on 2026-08-30 for the dependency-map burst (15 human-write
  // tables surfaced at once — the detector improving, not the filters
  // decaying), and TIGHTENED BACK to 25 the same day after Sam ruled all 15
  // (the Fifteen Tables judgment: DR-19..DR-23 + CA-07, four folds, one
  // reasoned dismissal — kb/governance_surface_map.json carries the reasons).
  // Measured count after the rulings: 11. If the list climbs back toward this
  // ceiling without a detector improvement to explain it, that is real noise —
  // tighten the filters, not this number.
  check("⚠ the candidate list stays readable (< 25)", (d.candidates || []).length < 25);
})();

// ── report ──
// finish() rather than a bare tail: the owners-read and sign-in checks above are
// ASYNC (they exercise real promise paths in loadOwners/activate). A synchronous
// report would print, and process.exit would fire, before those ever resolved —
// silently scoring them as "not run" while looking green.
let reported = false;
function finish() {
  if (reported) return;
  reported = true;
  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
}
// Backstop: if an async chain never calls finish (a swallowed rejection), fail
// loudly instead of exiting 0 with a short, cheerful list.
setTimeout(function () {
  if (!reported) { console.error("FAIL  async chain never completed — a promise path was swallowed"); 
                   results.push(["async chain completed", false]); finish(); }
}, 8000).unref?.();
