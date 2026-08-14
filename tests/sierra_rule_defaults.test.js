// Sierra's built-in rules pane (Session 156) — jsdom + equivalence test.
//
// #1186 made the ten built-in prompt rules curatable data (`sierra_rules`).
// Nothing could edit them but SQL, and nothing could SEE them at all — which is
// the half that mattered: on 2026-08-14 Sam wrote an instruction at 13:33, got
// the old behaviour at 14:49, and the cause was STATEWIDE_RULE quietly beating
// it. He could not see the rule, so he could not know it was there.
//
// TWO PROPERTIES CARRY THIS PANE, and both fail SILENTLY if they break.
//
// (1) THE PANE MUST SHOW WHAT SIERRA IS ACTUALLY RUNNING. The pane merges code
//     defaults with the curator overlay for display; cpl-chat does the same
//     merge for real in assembleRules(). A drifted mirror would show a curator a
//     rule that is not the one in force — worse than no pane, because they would
//     act on it. So this test LIFTS THE REAL assembleRules OUT OF index.ts and
//     runs both over the same fixtures. Equivalence is proven, not asserted.
//
// (2) AN EMPTY READ MEANS THE OPPOSITE OF WHAT IT MEANS ON TEAM PHRASES. There,
//     team_access is known non-empty, so 200 + [] proves "not a reviewer". Here
//     the table is SEEDED EMPTY on purpose, so [] is the normal, healthy state.
//     Reusing that inference would tell a reviewer they were locked out, and
//     tell a locked-out person that Sierra has no rules. The four states —
//     signed out / not a reviewer / read failed / genuinely empty — must render
//     distinguishably.
//
// Run from repo root: `npm test` (or `node tests/sierra_rule_defaults.test.js`).

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");
const DEFAULTS_SRC = fs.readFileSync("sierra_rule_defaults.js", "utf8");
const TS_PATH = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");

// ── (0) the generated file is not stale ─────────────────────────────────────
// sierra_rule_defaults.js is COPIED from index.ts. A hand-copied mirror of
// something that legitimately changes is exactly the stale TEST BOUND that put
// four red checks on main on 2026-08-14, so the copy is generated and its
// freshness is a check rather than a habit.
(function () {
  let ok = false, msg = "";
  try {
    execFileSync("python3", ["kb/_build_sierra_rule_defaults.py", "--check"], { stdio: "pipe" });
    ok = true;
  } catch (e) {
    msg = " — run: python3 kb/_build_sierra_rule_defaults.py";
  }
  check("sierra_rule_defaults.js is in sync with cpl-chat/index.ts" + msg, ok);
})();

// ── (1) equivalence with the REAL assembleRules ─────────────────────────────
(function () {
  let assembleRules, RULE_PREDICATES, liftError = null;
  try {
    ({ assembleRules, RULE_PREDICATES } = liftBlock(
      fs.readFileSync(TS_PATH, "utf8"),
      "// ─── RULE ASSEMBLY BLOCK START",
      "// ─── RULE ASSEMBLY BLOCK END",
      ["assembleRules", "RULE_PREDICATES", "PROTECTED_RULE_KEYS"],
    ));
  } catch (e) { liftError = e; }
  check("the real assembleRules lifts out of index.ts" + (liftError ? ` — ${liftError.message}` : ""), !liftError);
  if (liftError) return;

  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const defs = api._ruleDefaults().rules;
  check("the generated defaults carry all ten built-in rules", defs.length === 10);
  check("the protected set survives generation",
    defs.filter((r) => r.protected).map((r) => r.key).sort().join(",")
      === "credit_status,landing_page,portal,volume");

  // The shape assembleRules expects, from the same generated file the pane uses.
  const asDefaults = defs.map((d) => ({
    key: d.key, title: d.title, body: d.body,
    appliesWhen: d.applies_when, sortOrder: d.sort_order,
  }));

  // Fixtures chosen to hit every branch where the two implementations COULD
  // disagree: replace vs append, the ignored active=false, a reordering, and an
  // overlay whose body is blank (which must fall back to the code body, not
  // ship an empty rule).
  const OVERLAYS = {
    "no overlay at all (the seeded state)": [],
    "an ordinary rule replaced": [{ key: "statewide", body: "[TEAM STATEWIDE]", active: true }],
    "a protected rule added to": [{ key: "portal", body: "[TEAM PORTAL]", active: true }],
    "an ordinary rule switched off": [{ key: "credit_list", body: "[X]", active: false }],
    "a protected rule switched off (must be ignored)": [{ key: "volume", body: "[V]", active: false }],
    "a rule reordered to the front": [{ key: "landing_page", body: "[LP]", sort_order: 1, active: true }],
    "an overlay with a blank body": [{ key: "offerings", body: "   ", active: true }],
    "several at once": [
      { key: "statewide", body: "[SW]", active: true },
      { key: "portal", body: "[P]", active: false },
      { key: "alignment", body: "[A]", sort_order: 5, active: true },
    ],
  };
  const CONTEXTS = {
    "no context": { credentialContext: "", volumeContext: "", alignmentContext: "", creditContext: "" },
    "credential": { credentialContext: "c", volumeContext: "", alignmentContext: "", creditContext: "" },
    "volume": { credentialContext: "", volumeContext: "v", alignmentContext: "", creditContext: "" },
    "alignment+credit": { credentialContext: "", volumeContext: "", alignmentContext: "a", creditContext: "c" },
    "everything": { credentialContext: "c", volumeContext: "v", alignmentContext: "a", creditContext: "c" },
  };

  let agree = 0, disagree = [];
  Object.keys(OVERLAYS).forEach((oName) => {
    const overlayRows = OVERLAYS[oName];
    // What the FUNCTION does.
    const overlayMap = new Map(overlayRows.map((o) => [o.key, o]));
    // What the PANE shows.
    const shown = api._mergeRules(defs, overlayRows);

    Object.keys(CONTEXTS).forEach((cName) => {
      const ctx = CONTEXTS[cName];
      const real = assembleRules(asDefaults, overlayMap, ctx);
      // Derive the same answer from what the pane displays: the rules it shows
      // as active, in the order it shows them, whose context applies.
      const paneFired = shown
        .filter((r) => r.active)
        .filter((r) => (RULE_PREDICATES[r.appliesWhen] || RULE_PREDICATES.always)(ctx))
        .map((r) => r.key);
      const paneText = shown
        .filter((r) => r.active)
        .filter((r) => (RULE_PREDICATES[r.appliesWhen] || RULE_PREDICATES.always)(ctx))
        .map((r) => r.body).join("");
      const label = `${oName} / ${cName}`;
      if (paneFired.join(",") === real.fired.join(",") && paneText === real.text) agree++;
      else disagree.push(label);
    });
  });
  const total = Object.keys(OVERLAYS).length * Object.keys(CONTEXTS).length;
  check(`the pane shows exactly what Sierra runs — ${agree}/${total} overlay×context combinations`
    + (disagree.length ? ` (differs: ${disagree.slice(0, 3).join("; ")})` : ""),
    agree === total);

  // Called out separately because it is the guarantee most likely to be
  // "simplified" away by someone tidying the merge later, and losing it removes
  // a student-safety guard rather than a formatting nicety.
  const prot = api._mergeRules(defs, [{ key: "portal", body: "[ADDED]", active: false }])
    .filter((r) => r.key === "portal")[0];
  check("a protected rule keeps its built-in wording and stays on even when switched off",
    prot.active === true && /ADDED/.test(prot.body) && prot.body.indexOf(prot.defaultBody) === 0);
  const ord = api._mergeRules(defs, [{ key: "statewide", body: "[R]", active: true }])
    .filter((r) => r.key === "statewide")[0];
  check("an ordinary rule is REPLACED, not appended to",
    ord.body === "[R]" && ord.body !== ord.defaultBody);
})();

// ── jsdom harness ───────────────────────────────────────────────────────────
// `opts` controls the two reads the pane depends on, so each of the four states
// can be produced exactly as the server produces it.
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  if (opts.jwt) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc",
      email: "sam@x",
    }));
  }
  w.__fetches = [];
  w.alert = function (m) { w.__alert = m; };
  w.confirm = function () { return opts.confirm !== false; };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    w.__fetches.push({ url, init });
    // The reviewer probe.
    if (/team_access/.test(url)) {
      if (opts.probeFails) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.reviewer ? [{ id: "shared" }] : []) });
    }
    if (/sierra_rules/.test(url)) {
      if (opts.rulesReadFails) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
      if (init.method === "POST") {
        const rows = opts.writeEmpty ? [] : [JSON.parse(init.body)];
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rows) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.rules || []) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  // Defaults FIRST — the pane reads window.SIERRA_RULE_DEFAULTS at render time.
  [DEFAULTS_SRC, SRC].forEach((src) => {
    const el = w.document.createElement("script");
    el.textContent = src;
    w.document.body.appendChild(el);
  });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api._state.feedback = []; api._state.turns = [];
  return w;
}

// ── (2) the four states are distinguishable ─────────────────────────────────
(async function () {
  // (a) signed in with the team phrase only — a CLOSED DOOR, never an empty list.
  {
    const w = makeWin({ reviewer: false });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    await api._loadRulesPane(root);
    const h = root.innerHTML;
    check("team phrase alone lands on 'not a reviewer'", api._state.rulesState === "notreviewer");
    check("the closed door says the rules ARE working, not that there are none",
      /closed door, not an empty list/.test(h) && /magic link/i.test(h));
    check("the closed door does not leak the rule bodies",
      !/ABOUT STATEWIDE COLLABORATIVE/.test(h));
    check("the team phrase never even probes as a reviewer",
      w.__fetches.filter((f) => /team_access/.test(f.url)).length === 0);
  }
  // (b) reviewer, table empty — the NORMAL state. Must show all ten rules.
  {
    const w = makeWin({ jwt: true, reviewer: true });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    await api._loadRulesPane(root);
    check("a reviewer with an empty table lands on 'ok'", api._state.rulesState === "ok");
    check("an empty table still lists all ten built-in rules",
      root.querySelectorAll(".sit-rule").length === 10);
    check("an empty table reads as 'nothing changed', not as 'no rules'",
      /<b>0<\/b> changed by the team/.test(root.innerHTML));
  }
  // (c) the READ failed — never rendered as "switched off" or "none".
  {
    const w = makeWin({ jwt: true, reviewer: true, rulesReadFails: true });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    await api._loadRulesPane(root);
    check("a failed read lands on 'error'", api._state.rulesState === "error");
    check("a failed read says Sierra is still running the rules",
      /does <b>not<\/b> mean they are switched off/.test(root.innerHTML));
  }
  // (d) the PROBE failed — must not accuse a reviewer of not being one.
  {
    const w = makeWin({ jwt: true, probeFails: true });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    await api._loadRulesPane(root);
    check("a failed probe does NOT claim 'not a reviewer'", api._state.rulesState !== "notreviewer");
    check("a failed probe says it could not check", /could not confirm your sign-in/.test(root.innerHTML));
  }
  // (e) signed out entirely.
  {
    const w = makeWin({ teamPass: false });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    await api._loadRulesPane(root);
    check("signed out is its own state", api._state.rulesState === "signedout");
  }
  // (f) the generated file missing — a SITE problem, said as one.
  {
    const dom = new JSDOM('<!doctype html><html><body><div id="sierra-training-root"></div></body></html>',
      { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.localStorage.setItem("cpl_team_pass", "phrase");
    w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    const el = w.document.createElement("script"); el.textContent = SRC;
    w.document.body.appendChild(el);
    const api = w.CPL_SIERRA_TRAINING_TAB;
    api._state.feedback = []; api._state.turns = [];
    const root = w.document.getElementById("sierra-training-root");
    api.render(root);
    check("a missing defaults file reports a SITE problem, not a permission one",
      /sierra_rule_defaults\.js/.test(root.innerHTML) && /not a\s*permission one/.test(root.innerHTML));
  }
})();

// ── (3) writing ─────────────────────────────────────────────────────────────
(async function () {
  const w = makeWin({ jwt: true, reviewer: true });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  await api._loadRulesPane(root);

  await api._writeRule("statewide", { body: "[NEW]" }, root);
  const post = w.__fetches.filter((f) => f.init.method === "POST" && /sierra_rules/.test(f.url))[0];
  check("saving a rule UPSERTs (the row does not exist yet on a first edit)",
    post && post.init.headers["Prefer"] === "resolution=merge-duplicates,return=representation");
  const body = post && JSON.parse(post.init.body);
  check("the write carries every column, not just the changed one",
    body && body.key === "statewide" && body.body === "[NEW]" &&
    body.applies_when === "always" && typeof body.sort_order === "number" && body.active === true);
  check("the write records who changed it", body && body.updated_by === "sam@x");
  check("a saved override shows as Edited with the built-in wording still visible", (() => {
    api._state.rulesOpen.statewide = true;
    api.render(root);
    const h = root.innerHTML;
    return /✏️ Edited/.test(h) && /The built-in wording this replaced/.test(h);
  })());

  // The failure mode that made #1146 and the team_access lesson: PostgREST
  // answers a policy-filtered write with 200 and an EMPTY body.
  {
    const w2 = makeWin({ jwt: true, reviewer: true, writeEmpty: true });
    const api2 = w2.CPL_SIERRA_TRAINING_TAB;
    const root2 = w2.document.getElementById("sierra-training-root");
    await api2._loadRulesPane(root2);
    await api2._writeRule("statewide", { body: "[NEW]" }, root2);
    check("a write that touched NO row is reported as a failure, not a success",
      /isn’t a reviewer|not saved/.test(String(w2.__alert || "")));
    check("a failed write leaves the rule unchanged in the pane",
      (api2._state.rules || []).length === 0);
  }
})();

// ── (4) affordances match what the server will actually honour ──────────────
(function () {
  const w = makeWin({ jwt: true, reviewer: true });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.rulesState = "ok"; api._state.rules = [];
  api._state.rulesOpen = { portal: true, statewide: true };
  api.render(root);
  // A protected rule ignores active=false, so a Switch off button there would be
  // a control that does nothing — the `Clear owner` no-op repeated.
  check("a protected rule offers NO switch-off (it would be a no-op)",
    !root.querySelector('[data-ruletoggle="portal"]') && !!root.querySelector('[data-ruletoggle="statewide"]'));
  check("a protected rule invites ADDING to it, not replacing it",
    /Add to this rule/.test(root.querySelector('[data-ruleedit="portal"]').textContent));
  check("an unedited rule offers no Restore (nothing to restore to)",
    !root.querySelector('[data-rulerestore="statewide"]'));
  // The editor seeds a protected rule with the ADDITION, not the built-in text —
  // seeding the built-in text invites editing words that cannot be edited.
  api._openRuleEdit("portal", root);
  check("editing a protected rule starts from an EMPTY addition box",
    api._state.ruleEditBody === "");
  api._cancelRuleEdit(root);
  api._openRuleEdit("statewide", root);
  check("editing an ordinary rule starts from its current wording",
    api._state.ruleEditBody.indexOf("ABOUT STATEWIDE COLLABORATIVE") === 0);

  // Precedence is the reason the pane exists — it has to be on screen.
  api._cancelRuleEdit(root);
  check("the pane says the built-in rules outrank the team's instructions",
    /OUTRANK the instructions above/.test(root.innerHTML));
  check("each rule shows the order Sierra reads it in", /#10<\/span>/.test(root.innerHTML));
})();

// ── (5) XSS ─────────────────────────────────────────────────────────────────
(function () {
  const w = makeWin({ jwt: true, reviewer: true });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.rulesState = "ok";
  api._state.rules = [{ key: "statewide", body: '<img src=x onerror=alert(1)>', active: true,
    applies_when: "always", sort_order: 10, updated_by: '<script>bad()</script>' }];
  api._state.rulesOpen = { statewide: true };
  api.render(root);
  check("an overridden rule body renders escaped", !root.querySelector("img"));
  check("the author name renders escaped", root.querySelectorAll("script").length === 0);
})();

// ── report ──────────────────────────────────────────────────────────────────
setTimeout(function () {
  let pass = 0;
  results.forEach(([name, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + name); if (ok) pass++; });
  console.log(`\nsierra_rule_defaults.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
}, 250);
