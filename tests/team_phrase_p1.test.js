// Team-phrase expansion Phase 1 (Session 97 follow-up, Sam: "Go phase 1") —
// jsdom test.
//
// Guards:
//  (a) team_phrase.js: validate-BEFORE-store (a wrong phrase is never
//      persisted — the #598 lesson), strict `=== true` on the RPC body, the
//      shared localStorage key `cpl_team_pass`, header decoration, and the
//      stale-phrase drop on 401/403;
//  (b) workplan_goals.js + budget_editor.js: a phrase session lights the edit
//      affordances AND writes carry `Bearer <ANON>` + `x-team-pass` (never
//      "Bearer undefined" — PostgREST would 401 before RLS runs);
//  (c) tmc_builder.js (source-pinned): the x-team-pass header is injected in
//      authHeaders (curator notes ONLY — never the base sbHeaders used by the
//      review RPC + anon paths); the approve/return UI stays gated on
//      state.email (magic link), while notes gate on canNote();
//  (d) assoc_editor.js: fullSession fallback + decorated headers;
//  (e) the DELETE policies were NOT widened (schema-of-record pins) and
//      team_phrase.js is script-loaded in BOTH HTMLs (Rule 4).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const tpSrc = fs.readFileSync("team_phrase.js", "utf8");

function makeWin(html, opts) {
  opts = opts || {};
  const dom = new JSDOM(html || "<!doctype html><html><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    if (/rpc\/team_pass_ok/.test(url)) {
      const sent = (init && init.headers && init.headers["x-team-pass"]) || "";
      const ok = sent === (opts.phrase || "correct-horse");
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(ok) });
    }
    const status = opts.writeStatus || 200;
    return Promise.resolve({
      ok: status < 400, status: status,
      json: () => Promise.resolve([]), text: () => Promise.resolve(""),
    });
  };
  function inject(src) {
    const el = w.document.createElement("script");
    el.textContent = src;
    w.document.body.appendChild(el);
  }
  inject(tpSrc);
  (opts.also || []).forEach(f => inject(fs.readFileSync(f, "utf8")));
  return w;
}

(async function () {
  // ── (a) team_phrase.js core ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    check("helper exports on window", !!TP && typeof TP.unlock === "function");
    const bad = await TP.unlock("wrong-phrase");
    check("wrong phrase rejected", bad === false);
    check("wrong phrase NOT stored", w.localStorage.getItem("cpl_team_pass") === null);
    const good = await TP.unlock("  correct-horse  ");
    check("right phrase accepted (trimmed)", good === true);
    check("phrase stored under the shared key", w.localStorage.getItem("cpl_team_pass") === "correct-horse");
    check("session() yields the raci-shaped pseudo-session",
      TP.session().teamPass === "correct-horse" && TP.session().email === "(team)");
    const h = TP.decorateHeaders({ apikey: "k" }, TP.session());
    check("decorateHeaders attaches x-team-pass", h["x-team-pass"] === "correct-horse");
    check("handleWriteFailure(403) drops the phrase",
      TP.handleWriteFailure(TP.session(), 403) === true
      && w.localStorage.getItem("cpl_team_pass") === null);
    check("handleWriteFailure ignores non-auth statuses",
      TP.handleWriteFailure({ teamPass: "x" }, 500) === false);
    // the verify POST carried the anon bearer + the candidate phrase
    const rpc = w.__fetches.find(f => /team_pass_ok/.test(f.url));
    check("verify POST sends anon bearer + candidate header",
      /^Bearer ey/.test(rpc.init.headers.Authorization) && !!rpc.init.headers["x-team-pass"]);
  }

  // ── (b) workplan_goals.js under a phrase session ──
  {
    const html = `<!doctype html><html><body><div id="tab-workplan-goals">
      <table><tr><td data-editable="1" data-activity-id="1.1" data-row-type="GOAL" data-year="y2026" data-val="5">5</td></tr></table>
    </div></body></html>`;
    const w = makeWin(html, { also: ["workplan_goals.js"] });
    await w.CPL_TEAM_PHRASE.unlock("correct-horse");
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    // re-init paint via hashchange (init ran before unlock in some orders)
    w.dispatchEvent(new w.Event("hashchange"));
    const cell = w.document.querySelector('[data-editable="1"]');
    check("wpg: phrase session lights editability", cell.classList.contains("wpg-editable"));
    check("wpg: auth widget shows the phrase state",
      w.document.querySelector(".wpg-auth-widget").textContent.indexOf("team phrase") >= 0);
  }

  // ── (b) source pins for the write headers (both editors) ──
  {
    const wpg = fs.readFileSync("workplan_goals.js", "utf8");
    const bud = fs.readFileSync("budget_editor.js", "utf8");
    for (const [name, src] of [["workplan_goals", wpg], ["budget_editor", bud]]) {
      check(name + ": bearer falls back to ANON (never undefined)",
        src.indexOf('(sess && sess.access_token) || SUPABASE_ANON') >= 0);
      check(name + ": headers decorated with x-team-pass",
        /decorateHeaders\(h, sess\)/.test(src));
      check(name + ": no raw Bearer sess.access_token write blocks remain",
        src.indexOf('"Bearer " + sess.access_token') === -1);
      check(name + ": stale-phrase drop wired", src.indexOf("maybeDropStalePhrase") >= 0);
      check(name + ": session resolution includes the phrase fallback",
        src.indexOf("fullSession()") >= 0);
      check(name + ": signOut clears the phrase too",
        /signOut[\s\S]{0,200}?CPL_TEAM_PHRASE\.clear\(\)/.test(src));
    }
  }

  // ── (b) budget_editor functional: phrase write carries the header ──
  {
    const html = `<!doctype html><html><body><div id="tab-budget"><div id="budget-funding">
      <table><tr><td class="budget-cell" data-bid="7" data-col="y1" data-val="100" data-editable="1">$100</td></tr></table>
    </div></div></body></html>`;
    const w = makeWin(html, { also: ["budget_editor.js"] });
    await w.CPL_TEAM_PHRASE.unlock("correct-horse");
    // drive saveField via the module? saveField is private — source pin covers
    // headers; here we assert the widget offers the unlock row when locked.
    w.localStorage.removeItem("cpl_team_pass");
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    const widget = w.document.querySelector(".budget-auth-widget");
    check("budget: signed-out widget offers the team-phrase unlock",
      !!widget && !!widget.querySelector(".cpl-tp-unlock"));
  }

  // ── (c) tmc_builder source pins ──
  {
    const t = fs.readFileSync("tmc_builder.js", "utf8");
    check("tmc: x-team-pass injected in authHeaders only",
      /function authHeaders[\s\S]{0,400}x-team-pass/.test(t));
    check("tmc: base sbHeaders NOT phrase-decorated",
      !/function sbHeaders[\s\S]{0,300}x-team-pass/.test(t));
    check("tmc: note affordance gates on canNote()",
      t.indexOf("if (canNote()) {") >= 0);
    check("tmc: review action still requires the magic-link token",
      /reviewAction[\s\S]{0,400}state\.session && state\.session\.access_token/.test(t));
    check("tmc: approve/return UI still gated on state.email (not canNote)",
      /if \(state\.email\) \{\s*\n\s*var act = el\("div", "tmc-req-act"\)/.test(t));
    check("tmc: phrase note stamps reviewer_email '(team)'",
      t.indexOf('reviewer_email: state.email || "(team)"') >= 0);
    check("tmc: stale phrase dropped on 401/403 note save",
      /40[13][\s\S]{0,200}?CPL_TEAM_PHRASE\.clear\(\)/.test(t) || /r\.status === 401 \|\| r\.status === 403[\s\S]{0,300}?clear\(\)/.test(t));
  }

  // ── (d) assoc_editor pins ──
  {
    const a = fs.readFileSync("assoc_editor.js", "utf8");
    check("assoc: fullSession fallback present", a.indexOf("function fullSession()") >= 0);
    check("assoc: headers decorated", /decorateHeaders\(h, sess\)/.test(a));
    check("assoc: isSignedIn uses fullSession", a.indexOf("return !!fullSession();") >= 0);
  }

  // ── (e) schema + template pins ──
  {
    const bsql = fs.readFileSync("kb/supabase_budget_rls_tighten.sql", "utf8");
    const psql = fs.readFileSync("kb/supabase_projects_rls_tighten.sql", "utf8");
    const tsql = fs.readFileSync("tmc/supabase_tmc_curator.sql", "utf8");
    check("schema: budget widening recorded", /team_phrase_widen_p1/.test(bsql) && /budget_funding_update[\s\S]{0,200}team_pass_ok/.test(bsql));
    check("schema: DELETEs not widened in the budget record",
      !/budget_funding_delete[\s\S]{0,200}team_pass_ok/.test(bsql.split('team_phrase_widen_p1')[1] || ""));
    check("schema: workplan widening recorded", /wpg_update[\s\S]{0,200}team_pass_ok/.test(psql));
    check("schema: curator-notes policies recreated for anon+authenticated",
      /tmc_curator_notes_write[\s\S]{0,200}anon, authenticated/.test(tsql));
    const h1 = fs.readFileSync("CPL_Dashboard.html", "utf8");
    const h2 = fs.readFileSync("index.html", "utf8");
    check("Rule 4: HTMLs identical", h1 === h2);
    check("team_phrase.js script-loaded before its consumers",
      h1.indexOf('src="team_phrase.js"') > 0
      && h1.indexOf('src="team_phrase.js"') < h1.indexOf('src="assoc_editor.js"'));
  }

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error("FATAL", e); process.exit(1); });
