// Site-scoped team phrases + the masthead unlock control (Sam, 2026-08-12:
// "so if they show up on two tabs, allow either…") — jsdom test.
//
// The design this pins:
//   A tab EXCLUSIVE to one site (cobi_orgs.js) answers to that site's own
//   phrase; every SHARED tab keeps team_pass_ok(), which matches any secret in
//   team_access — so "allow either" on shared tabs is free and nobody loses
//   access they already have. Each site phrase gets its OWN localStorage slot,
//   so holding Finance never costs you the shared phrase.
//
// Guards:
//  (a) team_phrase.js: keyFor/rpcFor route to the site slot + site RPC; a site
//      unlock is validated against THAT site's gate and stored ONLY in its own
//      slot (never the shared key); a wrong or unverifiable phrase is never
//      stored (the #598 lesson, per-site);
//  (b) the drop-recovery clears the slot the failing phrase CAME FROM — losing
//      the shared phrase because a Finance write was refused would log the user
//      out of every other tab for an unrelated failure;
//  (c) team_phrase_header.js: follows the Site dropdown, labels the scope it
//      will actually unlock, and re-dispatches cpl-tab-activated so an
//      already-rendered locked pane re-reads (the "re-open this tab" bounce);
//  (d) source pins: Rule 4 (both HTMLs), Contracts on the Finance scope with a
//      credential fingerprint that notices a PHRASE change (it tracked only the
//      reviewer JWT), the two tabs that had no cpl-tab-activated listener now
//      have one, and the ⚙ phrase admin is no longer hardcoded to id=raci.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const tpSrc = fs.readFileSync("team_phrase.js", "utf8");
const hdrSrc = fs.readFileSync("team_phrase_header.js", "utf8");

const PHRASES = { team_pass_ok: "shared-phrase", fin_pass_ok: "delta-fin", gr_pass_ok: "gr-phrase" };

function makeWin(opts) {
  opts = opts || {};
  const html = opts.html ||
    '<!doctype html><html><body><div class="header"><div class="cobi-brand"><h1>COBI</h1></div></div></body></html>';
  const dom = new JSDOM(html, {
    url: "https://cpl-initiative.github.io/cpl-project-tracker/",
    runScripts: "dangerously"
  });
  const w = dom.window;
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    const m = /rpc\/([a-z_]+)/.exec(String(url));
    if (m && PHRASES[m[1]] !== undefined) {
      if (opts.transient) return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve(null) });
      const sent = (init && init.headers && init.headers["x-team-pass"]) || "";
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(sent === PHRASES[m[1]]) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.eval(tpSrc);
  return w;
}

(async function () {
  // ── (a) routing + per-site storage ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    check("keyFor: shared scope → cpl_team_pass", TP.keyFor(null) === "cpl_team_pass");
    check("keyFor: fin → its own slot cpl_fin_pass", TP.keyFor("fin") === "cpl_fin_pass");
    check("keyFor: gr reuses the slot gr_priorities.js already shipped",
      TP.keyFor("gr") === "cpl_gr_pass");
    check("keyFor: unknown site falls back to the shared slot (never invents one)",
      TP.keyFor("nope") === "cpl_team_pass");
    check("rpcFor: fin → fin_pass_ok", TP.rpcFor("fin") === "fin_pass_ok");
    check("rpcFor: shared → team_pass_ok", TP.rpcFor(null) === "team_pass_ok");

    const ok = await TP.unlock(PHRASES.fin_pass_ok, "fin");
    check("site unlock: correct Finance phrase verifies", ok === true);
    check("site unlock: validated against fin_pass_ok, not team_pass_ok",
      w.__fetches.some((f) => /rpc\/fin_pass_ok/.test(f.url))
      && !w.__fetches.some((f) => /rpc\/team_pass_ok/.test(f.url)));
    check("site unlock: stored in the Finance slot",
      w.localStorage.getItem("cpl_fin_pass") === PHRASES.fin_pass_ok);
    check("site unlock: shared slot LEFT ALONE (holding Finance costs you nothing)",
      w.localStorage.getItem("cpl_team_pass") === null);
  }

  // ── validate-before-store, per site (the #598 lesson) ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    const bad = await TP.unlock("not-the-finance-phrase", "fin");
    check("site unlock: a wrong phrase resolves false", bad === false);
    check("site unlock: a wrong phrase is NEVER stored",
      w.localStorage.getItem("cpl_fin_pass") === null);
    // The shared phrase must not open a site gate just because it is valid
    // somewhere else — that is the whole point of the exclusive tabs.
    const cross = await TP.unlock(PHRASES.team_pass_ok, "fin");
    check("site unlock: the SHARED phrase does not satisfy the Finance gate", cross === false);
    check("site unlock: the rejected shared phrase is not stored in the Finance slot",
      w.localStorage.getItem("cpl_fin_pass") === null);
  }
  {
    const w = makeWin({ transient: true });
    const TP = w.CPL_TEAM_PHRASE;
    const r = await TP.unlock(PHRASES.fin_pass_ok, "fin");
    check("site unlock: a 5xx is TRANSIENT (null), never reported as a wrong phrase", r === null);
    check("site unlock: nothing stored on a transient failure",
      w.localStorage.getItem("cpl_fin_pass") === null);
  }

  // ── passFor / sessionFor fallback ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    w.localStorage.setItem("cpl_team_pass", PHRASES.team_pass_ok);
    check("passFor(fin): falls back to the shared phrase when Finance is not held",
      TP.passFor("fin") === PHRASES.team_pass_ok);
    w.localStorage.setItem("cpl_fin_pass", PHRASES.fin_pass_ok);
    check("passFor(fin): prefers the Finance phrase once held",
      TP.passFor("fin") === PHRASES.fin_pass_ok);
    const h = TP.decorateHeaders({}, null, "fin");
    check("decorateHeaders(site): sends the Finance phrase (PostgREST carries only one)",
      h["x-team-pass"] === PHRASES.fin_pass_ok);
    const hs = TP.decorateHeaders({}, null, null);
    check("decorateHeaders(shared): sends the shared phrase",
      hs["x-team-pass"] === PHRASES.team_pass_ok);
  }

  // ── (b) drop-recovery clears the RIGHT slot ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    w.localStorage.setItem("cpl_team_pass", PHRASES.team_pass_ok);
    w.localStorage.setItem("cpl_fin_pass", PHRASES.fin_pass_ok);
    const dropped = TP.handleWriteFailure({ teamPass: PHRASES.fin_pass_ok, site: "fin" }, 403);
    check("drop: a refused Finance write reports a drop", dropped === true);
    check("drop: clears the Finance slot", w.localStorage.getItem("cpl_fin_pass") === null);
    check("drop: LEAVES the shared phrase intact (unrelated failure must not log you out everywhere)",
      w.localStorage.getItem("cpl_team_pass") === PHRASES.team_pass_ok);
    const d2 = TP.handleWriteFailure({ teamPass: PHRASES.team_pass_ok }, 401);
    check("drop: a refused SHARED write clears the shared slot",
      d2 === true && w.localStorage.getItem("cpl_team_pass") === null);
    check("drop: a non-auth status is not a phrase problem",
      TP.handleWriteFailure({ teamPass: "x", site: "fin" }, 500) === false);
  }

  // ── unlock announces itself ──
  {
    const w = makeWin();
    const TP = w.CPL_TEAM_PHRASE;
    let heard = null;
    w.addEventListener("cpl-team-pass-unlocked", function (e) { heard = e.detail; });
    await TP.unlock(PHRASES.fin_pass_ok, "fin");
    check("unlock: broadcasts cpl-team-pass-unlocked with the site",
      heard && heard.site === "fin");
  }

  // ── (c) the masthead control ──
  {
    const w = makeWin();
    w.CPL_ORGS = { current: function () { return { id: "cpl", label: "CPL" }; } };
    w.CPL_TABS = { current: function () { return "governance"; } };
    w.eval(hdrSrc);
    // jsdom reports readyState 'loading' right after construction, so the
    // module's DOMContentLoaded hook has not fired yet — mount it directly.
    w.CPL_TEAM_PHRASE_HEADER.init();
    const H = w.CPL_TEAM_PHRASE_HEADER;
    check("header: control is injected into the masthead brand",
      !!w.document.querySelector(".header .cobi-brand .cobi-tph"));
    check("header: on the CPL site the scope is the shared phrase", H._scope() === null);
    check("header: labels it 'Team' on a shared site", H._scopeLabel(H._scope()) === "Team");
    check("header: shows LOCKED before any phrase is held",
      /🔒/.test(w.document.querySelector(".cobi-tph-btn").textContent));

    // Follow the Site dropdown.
    w.CPL_ORGS.current = function () { return { id: "fin", label: "FIN" }; };
    H.render();
    check("header: on the Finance site the scope becomes fin", H._scope() === "fin");
    check("header: labels the site phrase by name, not 'Team'",
      H._scopeLabel(H._scope()) === "Finance"
      && /Finance/.test(w.document.querySelector(".cobi-tph-btn").textContent));

    // GR is the site that already had its own phrase before this change.
    w.CPL_ORGS.current = function () { return { id: "gr", label: "GR" }; };
    H.render();
    check("header: GR keeps its own scope", H._scope() === "gr");
    // C&I / CIP have no gated tables of their own — they must NOT invent a scope.
    w.CPL_ORGS.current = function () { return { id: "ci", label: "C&I" }; };
    H.render();
    check("header: C&I has no site gate, so it offers the shared phrase", H._scope() === null);
    w.CPL_ORGS.current = function () { return { id: "cip", label: "CIP" }; };
    H.render();
    check("header: CIP likewise offers the shared phrase", H._scope() === null);
  }

  // unlock through the control, on the Finance site
  {
    const w = makeWin();
    w.CPL_ORGS = { current: function () { return { id: "fin", label: "FIN" }; } };
    w.CPL_TABS = { current: function () { return "contracts"; } };
    w.eval(hdrSrc);
    // jsdom reports readyState 'loading' right after construction, so the
    // module's DOMContentLoaded hook has not fired yet — mount it directly.
    w.CPL_TEAM_PHRASE_HEADER.init();
    const H = w.CPL_TEAM_PHRASE_HEADER;
    let refreshed = null;
    w.addEventListener("cpl-tab-activated", function (e) { refreshed = e.detail && e.detail.tab; });
    H._setOpen(true); H.render();
    const input = w.document.querySelector(".cobi-tph-in");
    const go = w.document.querySelector(".cobi-tph-go");
    check("header: open pane offers a password input (never a visible one)",
      input && input.type === "password");
    input.value = PHRASES.fin_pass_ok;
    go.dispatchEvent(new w.Event("click"));
    await new Promise((r) => setTimeout(r, 20));
    check("header: unlock validated against the SITE gate",
      w.__fetches.some((f) => /rpc\/fin_pass_ok/.test(f.url)));
    check("header: stored in the Finance slot",
      w.localStorage.getItem("cpl_fin_pass") === PHRASES.fin_pass_ok);
    check("header: flips to unlocked", H._held("fin") === true
      && /🔓/.test(w.document.querySelector(".cobi-tph-btn").textContent));
    check("header: re-dispatches cpl-tab-activated for the LIVE tab (no 're-open this tab')",
      refreshed === "contracts");
    check("header: pane closes after a successful unlock", H._isOpen() === false);
  }

  // a wrong phrase through the control reports, stores nothing, stays open
  {
    const w = makeWin();
    w.CPL_ORGS = { current: function () { return { id: "fin", label: "FIN" }; } };
    w.CPL_TABS = { current: function () { return "contracts"; } };
    w.eval(hdrSrc);
    // jsdom reports readyState 'loading' right after construction, so the
    // module's DOMContentLoaded hook has not fired yet — mount it directly.
    w.CPL_TEAM_PHRASE_HEADER.init();
    const H = w.CPL_TEAM_PHRASE_HEADER;
    H._setOpen(true); H.render();
    w.document.querySelector(".cobi-tph-in").value = "wrong";
    w.document.querySelector(".cobi-tph-go").dispatchEvent(new w.Event("click"));
    await new Promise((r) => setTimeout(r, 20));
    check("header: a wrong phrase stores nothing",
      w.localStorage.getItem("cpl_fin_pass") === null);
    check("header: a wrong phrase says so inline",
      /doesn't match/.test(w.document.querySelector(".cobi-tph-msg").textContent));

    // The pane is re-rendered from rAF, tab activation and the site switcher.
    // With state in the DOM, any of those arriving mid-typing swallowed both the
    // half-typed phrase and the error line — the control looked like it had
    // ignored the click entirely.
    H.render();
    check("header: a re-render KEEPS the inline message",
      /doesn't match/.test(w.document.querySelector(".cobi-tph-msg").textContent));
    w.document.querySelector(".cobi-tph-in").value = "half-typ";
    w.document.querySelector(".cobi-tph-in").dispatchEvent(new w.Event("input"));
    H.render();
    check("header: a re-render KEEPS what the user was typing",
      w.document.querySelector(".cobi-tph-in").value === "half-typ");
    check("header: the pane stays open across a re-render", H._isOpen() === true);
  }

  // ── (d) source pins ──
  {
    const a = fs.readFileSync("CPL_Dashboard.html", "utf8");
    const b = fs.readFileSync("index.html", "utf8");
    check("Rule 4: team_phrase_header.js is loaded in CPL_Dashboard.html",
      /<script src="team_phrase_header\.js"><\/script>/.test(a));
    check("Rule 4: …and in index.html", /<script src="team_phrase_header\.js"><\/script>/.test(b));
    check("header loads AFTER team_phrase.js (it consumes CPL_TEAM_PHRASE)",
      a.indexOf('src="team_phrase.js"') < a.indexOf('src="team_phrase_header.js"'));

    const c = fs.readFileSync("contracts.js", "utf8");
    check("contracts: scoped to the Finance site", /var SITE = "fin";/.test(c));
    check("contracts: prefers the Finance phrase, falls back to shared",
      /sessionFor\(SITE\)/.test(c));
    check("contracts: credential fingerprint notices a PHRASE change, not just a JWT",
      /nowCred[\s\S]{0,160}teamPass[\s\S]{0,120}state\.cred/.test(c));
    check("contracts: a locked pane carries its own unlock box",
      /function appendUnlock\(root\)[\s\S]{0,400}site: SITE/.test(c));
    check("contracts: the unlock box is suppressed once Finance is held",
      /hasFinPass\(\)\) return;/.test(c));
    check("contracts: listens for cpl-tab-activated",
      /cpl-tab-activated[\s\S]{0,120}=== "contracts"\) activate\(\)/.test(c));

    const n = fs.readFileSync("nc_learning_partners.js", "utf8");
    check("nc partners: now listens for cpl-tab-activated (it had no listener)",
      /cpl-tab-activated[\s\S]{0,140}=== "nc-learning-partners"\) activate\(\)/.test(n));

    const r = fs.readFileSync("raci.js", "utf8");
    check("phrase admin: no longer hardcoded to id=eq.raci",
      !/team_access\?id=eq\.raci/.test(r));
    // The editor is its own tab now (team_phrases.js) — these two properties
    // still matter, they just live there. Full coverage: tests/team_phrases.test.js
    const tpx = fs.readFileSync("team_phrases.js", "utf8");
    // Scoped to the ARRAY, not a character window. This read
    // `/PHRASES = \[[\s\S]{0,900}id: "fin"/` and went red on 2026-08-15 without
    // the property ever being violated: the raci→team rename (#1214) added a
    // ~600-char comment INSIDE the array, pushing `id: "fin"` to 1,458 chars
    // from the anchor. A fixed window measures how much PROSE sits above a
    // thing, which is not what this check is about.
    var phrasesArr = (function () {
      var i = tpx.indexOf("PHRASES = [");
      if (i === -1) return "";
      var end = tpx.indexOf("\n  ];", i);
      return end === -1 ? "" : tpx.slice(i, end);
    })();
    check("phrase admin: the PHRASES array is found at all (the anchor still exists)",
      phrasesArr.length > 0);
    check("phrase admin: every phrase is rotatable, including the site ones",
      ["team", "ci", "gr", "fin"].every(function (id) {
        return new RegExp('id: "' + id + '"').test(phrasesArr);
      }));
    check("phrase admin: syncs the slot the phrase actually lives in",
      /def\.slot && localStorage\.getItem\(def\.slot\)/.test(tpx));

    // The shared helper must not have lost its original contract.
    check("back-compat: unlock()/verify() still work unscoped",
      /function unlock\(phrase, site\)/.test(tpSrc) && /function verify\(phrase, site\)/.test(tpSrc));
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
