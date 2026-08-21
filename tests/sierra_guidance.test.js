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
//  (d) SENT-CAP honesty — only the newest CAP ACTIVE rules are marked "sent"
//      (mirroring cpl-chat's GUIDANCE_MAX_RULES); older active rules are
//      marked "not sent"; inactive rows don't consume cap slots; and the two
//      KINDS are ranked SEPARATELY, so a display rule never evicts a directive;
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

    /* sent-cap: (cap + OVER) active rules + 1 inactive interleaved, newest first.
     * SIZED FROM api.GUIDANCE_SENT_CAP, NOT FROM A LITERAL. These two checks used
     * to build exactly 12 rows and assert "10 sent / 2 not-sent", which pinned the
     * cap in a THIRD place — so raising it 10 -> 20 on 2026-08-21 turned them red
     * for the entirely correct reason that all 12 fixture rows now fit. A fixture
     * that hardcodes the limit it is testing has to be edited every time the limit
     * moves, and the edit looks identical whether the new number is right or wrong.
     * Deriving the fixture from the cap keeps the check about the BEHAVIOUR (rules
     * past the cap are marked not-sent) at any cap value. */
    const CAP = api.GUIDANCE_SENT_CAP;
    const OVER = 2;
    const rows = [];
    for (let i = 0; i < CAP + OVER; i++) rows.push({ id: "a" + i, rule: "active rule " + i, active: true, created_at: iso(i) });
    rows.splice(3, 0, { id: "off", rule: "inactive rule", active: false, created_at: iso(2.5) });
    api._state.guidance = rows;
    api.render(root);
    const html = root.innerHTML;
    check("the newest CAP active rules are marked sent",
      (html.match(/Sierra is using this/g) || []).length === CAP);
    check("active rules beyond the cap marked not-sent",
      (html.match(/not reaching Sierra/g) || []).length === OVER);

    check("inactive rule doesn't consume a cap slot and renders struck",
      /inactive rule/.test(html) && root.querySelectorAll(".sit-rule-off").length === 1);

    /* ── kind: the two budgets are SEPARATE ──────────────────────────────
     * The failure this guards is specific and silent. Before the kind column,
     * every active row was ranked in ONE sequence, so adding a display rule
     * pushed the oldest DIRECTIVE past the cap — and eviction is oldest-first,
     * which in this table means the standing naming rule, not the reactive one.
     * Ranking per kind is what makes the edge function's two bounded reads and
     * the tab's meter describe the same mechanism. */
    const mixed = [];
    for (let i = 0; i < CAP; i++) mixed.push({ id: "d" + i, rule: "directive " + i, kind: "directive", active: true, created_at: iso(i + 10) });
    // Display rules are the NEWEST rows — under one shared ranking they would
    // take the first slots and evict CAP-many directives.
    for (let i = 0; i < 3; i++) mixed.push({ id: "p" + i, rule: "display " + i, kind: "display", active: true, created_at: iso(i) });
    mixed.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    api._state.guidance = mixed;
    api.render(root);
    const mixedHtml = root.innerHTML;
    check("display rules do not evict directives — every row still sent",
      (mixedHtml.match(/Sierra is using this/g) || []).length === CAP + 3
      && (mixedHtml.match(/not reaching Sierra/g) || []).length === 0);
    /* ⚠ COUNT THE ROW CHIP, NOT THE STRING. The first cut of this check matched
     * /Display rule</ and read 4 for 3 display rows: the composer's own
     * <option>Display rule</option> matches too. A check that also matches a
     * control that is ALWAYS present cannot go to zero, so it would have passed
     * against a build that labelled no row at all. Anchor on the chip's closing
     * </span>, and assert the zero case on a directives-only render — that is
     * what proves the count is reading rows and not the picker. */
    const chipCount = (h) => (h.match(/Display rule<\/span>/g) || []).length;
    check("a display row is labelled as one, in plain words",
      chipCount(mixedHtml) === 3);
    api._state.guidance = [{ id: "d0", rule: "directive only", kind: "directive", active: true, created_at: iso(1) }];
    api.render(root);
    check("no display chip renders when no row is a display rule",
      chipCount(root.innerHTML) === 0);

    /* A display rule past ITS OWN cap must still be marked not-sent — the cap is
     * separate, not absent. Without this, "separate budgets" could be satisfied
     * by simply not counting display rules at all, which would report a rule as
     * reaching Sierra when the edge function had already dropped it. */
    const manyDisplay = [];
    const DCAP = api.GUIDANCE_DISPLAY_CAP;
    for (let i = 0; i < DCAP + 2; i++) manyDisplay.push({ id: "p" + i, rule: "display " + i, kind: "display", active: true, created_at: iso(i) });
    api._state.guidance = manyDisplay;
    api.render(root);
    check("display rules past their OWN cap are marked not-sent",
      (root.innerHTML.match(/not reaching Sierra/g) || []).length === 2);

    // A row written before the column existed has no kind and is a directive.
    check("a kind-less legacy row reads as a directive",
      api._guidKind({ id: "x" }) === "directive" && api._guidKind({ kind: null }) === "directive"
      && api._capFor("directive") === CAP && api._capFor("display") === DCAP);

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
  check("cpl-chat defines fetchTeamGuidance with a row cap and both char caps",
    /fetchTeamGuidance/.test(fn) && /GUIDANCE_MAX_RULES = \d+/.test(fn)
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

  /* THE ROW CAP IS A PAIR TOO, AND UNTIL 2026-08-21 ONLY ONE SIDE WAS CHECKED.
   * The check above pins the rule-LENGTH cap by comparing three files to each
   * other. The row cap had no such check: this file asserted the literal
   * `GUIDANCE_MAX_RULES = 10` in the edge function and said nothing at all
   * about GUIDANCE_SENT_CAP in sierra_training.js. So the two could drift, and
   * the drift would be INVISIBLE in both directions:
   *   - function higher than tab  -> the tab under-reports what Sierra receives,
   *     marking rules "not sent" that are in fact steering production.
   *   - tab higher than function  -> the tab promises a rule is being sent when
   *     the function has already evicted it. Worse, because eviction is silent
   *     and drops the OLDEST rule (the standing naming rule).
   * Compare the two sources to EACH OTHER, never to a literal — the same
   * reasoning the length-cap check above is built on. */
  const fnRows = (fnSrc.match(/GUIDANCE_MAX_RULES\s*=\s*(\d+)/) || [])[1];
  const tabRows = (tabSrc.match(/GUIDANCE_SENT_CAP\s*=\s*(\d+)/) || [])[1];
  check("row cap agrees between the edge function and the Training tab",
        !!fnRows && !!tabRows && fnRows === tabRows);

  /* ⭐ AND THE ROW CAP MUST STAY ABOVE WHAT THE CHARACTER BUDGET CAN CARRY.
   * Two caps bound the guidance block. One is VISIBLE (the tab headlines the
   * character budget as a meter); one is INVISIBLE (the row cap silently evicts
   * the oldest active rule). Whichever is LOWER is the one that actually binds,
   * so the invisible one must never be the binding one — that is the whole
   * finding of methodology-a-capped-instruction-list-is-a-zero-sum-budget.md.
   * At the observed average rule length (~525 chars) the 9,000-char budget
   * carries ~17 rules, so the row cap has to clear that. Asserted as a floor
   * against the char budget rather than as a magic number, so raising the char
   * budget later cannot quietly re-make the row cap the binding one. */
  const totalChars = Number((fnSrc.match(/GUIDANCE_MAX_CHARS\s*=\s*(\d+)/) || [])[1]);
  const AVG_RULE_CHARS = 525;   // measured over the 9 active rows, 2026-08-21
  check("row cap clears what the char budget can carry, so the VISIBLE cap binds",
        !!totalChars && Number(fnRows) >= Math.ceil(totalChars / AVG_RULE_CHARS));

  /* ── kind: directive vs display ───────────────────────────────────────────
   * The schema of record must declare the column AND constrain it. Without the
   * check constraint a typo ("displays") is accepted by Postgres and then
   * silently belongs to NEITHER budget — the row would be stored, shown in the
   * tab, and never sent, with nothing anywhere reporting it. */
  check("schema declares kind with a constraint and a directive default",
    /kind text not null default 'directive'/.test(sql)
    && /check \(kind in \('directive', 'display'\)\)/.test(sql));

  /* Each kind is read under ITS OWN limit. One query over both kinds under a
   * combined limit is docs/kb-notes/methodology-bound-both-sides-of-a-union.md:
   * whichever kind is newest eats the window. Assert the shape that makes that
   * impossible — a per-kind filter carrying a per-kind limit. */
  check("cpl-chat reads each guidance kind under its own bounded limit",
    /fetchGuidanceKind\(sb, "directive", GUIDANCE_MAX_RULES\)/.test(fnSrc)
    && /fetchGuidanceKind\(sb, "display", GUIDANCE_MAX_DISPLAY\)/.test(fnSrc)
    && /\.eq\("kind", kind\)/.test(fnSrc));

  /* ⚠ THE DEPLOY-ORDER FALLBACK IS THE HIGHEST-STAKES LINE IN THIS FILE.
   * fetchTeamGuidance fails soft, so if the function is deployed against a
   * database without the kind column, EVERY team instruction stops reaching
   * Sierra and nothing reports it — the naming rule included. The kind-less
   * retry is what makes (migration, deploy) order-independent. */
  check("cpl-chat falls back to a kind-less read so deploy order cannot mute guidance",
    /directiveRows === null/.test(fnSrc)
    && /fetchTeamGuidance/.test(fnSrc)
    && fnSrc.indexOf("directiveRows = data") !== -1);

  /* The display cap is a PAIR as well — same reasoning as the row cap above. */
  const fnDisplay = (fnSrc.match(/GUIDANCE_MAX_DISPLAY\s*=\s*(\d+)/) || [])[1];
  const tabDisplay = (tabSrc.match(/GUIDANCE_DISPLAY_CAP\s*=\s*(\d+)/) || [])[1];
  check("display cap agrees between the edge function and the Training tab",
        !!fnDisplay && !!tabDisplay && fnDisplay === tabDisplay);

  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\nsierra_guidance.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
}
