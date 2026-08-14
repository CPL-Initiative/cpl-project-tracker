// Sierra guidance layer — Phase 2 (Session 94, SkySierra) — jsdom test.
//
// Guards the sierra_guidance loop end-to-end at the consumer level:
//  (a) the Training tab renders the Guidance pane — the production-widget
//      warning, the composer, and the honest "could not load" state;
//  (b) ADD — posts {rule, note, created_by} to /rest/v1/sierra_guidance with
//      the team auth headers + Prefer: return=representation, prepends the
//      returned row, and clears the composer drafts;
//  (c) TOGGLE — PATCHes active=!active on id=eq.<id> (deactivate, never
//      delete — the audit trail);
//  (d) SENT-CAP honesty — only the newest 10 ACTIVE rules are marked "sent"
//      (mirroring cpl-chat v25's GUIDANCE_MAX_RULES); older active rules are
//      marked "not sent"; inactive rows don't consume cap slots;
//  (e) XSS — rule + note text render escaped (team-authored, but the write
//      gate is shared — never trust it as markup);
//  (f) the committed cpl-chat source (v25) actually fetches sierra_guidance
//      in the parallel lookup and appends the block to the system prompt;
//  (g) the committed schema keeps the security shape: reviewer/team-phrase
//      gates on SELECT/INSERT/UPDATE, and NO delete policy.
//
// Run from repo root: `npm test` (or `node tests/sierra_guidance.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    if (/sierra_guidance/.test(url) && init && init.method === "POST") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([Object.assign(
        { id: "new-id", active: true, created_at: new Date().toISOString() },
        JSON.parse(init.body))]) });
    }
    if (/sierra_guidance/.test(url) && init && init.method === "PATCH") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    const body = /sierra_feedback\?/.test(url) ? (opts.feedback || [])
      : /chat_interactions\?/.test(url) ? (opts.turns || [])
      : /sierra_guidance\?/.test(url) ? (opts.guidance || [])
      : {};
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

const iso = (i) => new Date(Date.now() - i * 3600000).toISOString();

// ── (a) pane rendering ──
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.feedback = []; api._state.turns = [{ id: 1, question: "q", top_similarity: 0.9, response: "a" }];
  api._state.guidance = [];
  api.render(root);
  check("Guidance pane renders with the production-widget warning",
    /🧭 Instructions for Sierra/.test(root.innerHTML) && /public assistant/.test(root.innerHTML));
  check("composer (textarea + add button) present", root.querySelector(".sit-guid-input") && root.querySelector("[data-guid-add]"));
  check("empty state invites the first rule", /No instructions yet/.test(root.innerHTML));

  api._state.guidance = null;
  api.render(root);
  check("failed guidance load renders the honest error, composer hidden",
    /Could not load the guidance rules/.test(root.innerHTML) && !root.querySelector(".sit-guid-input"));
})();

// ── (b) add ──
(async function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.feedback = []; api._state.turns = []; api._state.guidance = [];
  api._state.draftRule = "Always mention the statewide EMS pathway for CPR questions.";
  api._state.draftNote = "From Sam's CPR feedback";
  await api._addGuidance(api._state.draftRule.trim(), api._state.draftNote.trim(), root);
  const post = w.__fetches.filter((f) => /\/rest\/v1\/sierra_guidance$/.test(f.url) && f.init.method === "POST")[0];
  check("add POSTs to /rest/v1/sierra_guidance", !!post);
  const body = post && JSON.parse(post.init.body);
  check("add body carries rule + note + author", body &&
    /statewide EMS pathway/.test(body.rule) && body.note === "From Sam's CPR feedback" && body.created_by === "(team)");
  check("add sends the team-pass header + representation prefer",
    post && post.init.headers["x-team-pass"] === "phrase" && post.init.headers["Prefer"] === "return=representation");
  check("returned row prepends to the list", api._state.guidance.length === 1 && api._state.guidance[0].id === "new-id");
  check("composer drafts cleared after a successful add", api._state.draftRule === "" && api._state.draftNote === "");
})().then(step2);

// ── (c) toggle + (d) sent-cap + (e) XSS ──
function step2() {
  (async function () {
    const w = makeWin();
    const api = w.CPL_SIERRA_TRAINING_TAB;
    const root = w.document.getElementById("sierra-training-root");
    api._state.feedback = []; api._state.turns = [];
    api._state.guidance = [{ id: "g1", rule: "rule one", active: true, created_at: iso(1) }];
    await api._toggleGuidance("g1", root);
    const patch = w.__fetches.filter((f) => /sierra_guidance\?id=eq\.g1/.test(f.url) && f.init.method === "PATCH")[0];
    check("toggle PATCHes id=eq.<id>", !!patch);
    check("toggle flips active (deactivate, never delete)",
      patch && JSON.parse(patch.init.body).active === false && api._state.guidance[0].active === false);
    check("no DELETE is ever issued", w.__fetches.every((f) => (f.init.method || "GET") !== "DELETE"));

    // sent-cap: 12 active + 1 inactive interleaved (newest first)
    const rows = [];
    for (let i = 0; i < 12; i++) rows.push({ id: "a" + i, rule: "active rule " + i, active: true, created_at: iso(i) });
    rows.splice(3, 0, { id: "off", rule: "inactive rule", active: false, created_at: iso(2.5) });
    api._state.guidance = rows;
    api.render(root);
    const html = root.innerHTML;
    check("newest 10 active rules marked sent", (html.match(/Sierra is using this/g) || []).length === 10);
    check("active rules beyond the cap marked not-sent", (html.match(/not reaching Sierra/g) || []).length === 2);
    check("inactive rule doesn't consume a cap slot and renders struck",
      /inactive rule/.test(html) && root.querySelectorAll(".sit-rule-off").length === 1);

    // XSS
    const evil = api._guidanceRow({ id: "x", rule: "<script>alert(1)</script>", active: true, note: "<img src=x onerror=1>", created_at: iso(0) }, true);
    check("rule + note text escaped in the row renderer",
      evil.indexOf("<script>") === -1 && evil.indexOf("<img") === -1 && /&lt;script&gt;/.test(evil));

    finish();
  })();
}

// ── (f)+(g) committed sources keep the wire + the security shape ──
function finish() {
  const fn = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
  check("cpl-chat defines fetchTeamGuidance with the row + char caps",
    /fetchTeamGuidance/.test(fn) && /GUIDANCE_MAX_RULES = 10/.test(fn)
    && /GUIDANCE_MAX_CHARS = 9000/.test(fn) && /GUIDANCE_MAX_CHARS_PER_RULE = 1500/.test(fn));
  // Asserts guidance is IN the parallel batch, not that it is the LAST member —
  // pinning the tail of the destructuring made this go red when v30 added
  // fetchCollegeGeoMap to the same batch, which is exactly the change it should
  // have been indifferent to.
  check("cpl-chat fetches guidance in the parallel lookup",
    /\[[^\]]*\bteamGuidance\b[^\]]*\] = await Promise\.all/.test(fn) && /fetchTeamGuidance\(sb\)/.test(fn));
  check("cpl-chat appends teamGuidance to the system prompt",
    /\$\{audienceRule\}\$\{teamGuidance\}/.test(fn));
  check("guidance reads only ACTIVE rows newest-first",
    /from\("sierra_guidance"\)[\s\S]{0,200}\.eq\("active", true\)[\s\S]{0,200}ascending: false/.test(fn));

  const sql = fs.readFileSync("chatbox/supabase_sierra_guidance.sql", "utf8");
  check("schema: RLS enabled + all three policies team-gated",
    /enable row level security/.test(sql) &&
    (sql.match(/is_allowed_reviewer\(\) or public\.team_pass_ok\(\)/g) || []).length >= 4);
  check("schema: NO delete policy (audit trail)", !/for delete/.test(sql));
  // THE THREE LENGTH LIMITS MUST ALL AGREE — the SQL file says so in a comment,
  // and this asserts it instead of trusting it. #1182 raised the cap 500 -> 1500
  // in the SQL, the edge function and the tab, but this check still asserted 500
  // and had been RED on main ever since. Pinning one number in one file is what
  // let them disagree in the first place: on 2026-08-12 the tab and the function
  // moved while the SQL constraint did not, turning a silent truncation into a
  // hard save failure for any rule over 500 chars. So compare the three sources
  // to each other rather than to a literal.
  const sqlCap = (sql.match(/char_length\(rule\) between 3 and (\d+)/) || [])[1];
  const fnSrc = fs.readFileSync(
    path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts"), "utf8");
  const fnCap = (fnSrc.match(/GUIDANCE_MAX_CHARS_PER_RULE\s*=\s*(\d+)/) || [])[1];
  const tabSrc = fs.readFileSync(path.join(__dirname, "..", "sierra_training.js"), "utf8");
  const tabCap = (tabSrc.match(/GUIDANCE_RULE_MAX\s*=\s*(\d+)/) || [])[1];
  check("schema: rule length cap agrees across SQL, edge function and tab",
        !!sqlCap && sqlCap === fnCap && sqlCap === tabCap);

  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_guidance.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
}
