// 🔑 Team Phrases admin TAB (Sam, 2026-08-12: "I lost track of where Manage
// team phrases is. It should be a tab that requires a magic link to view,
// though it should show up as a tab.") — jsdom test.
//
// Guards:
//  (a) the tab is REGISTERED like any other — nav button, pane and lazy boot in
//      BOTH HTMLs (Rule 4), and listed in a nav group so it is reachable;
//  (b) VISIBLE to everyone, CONTENTS gated on a magic-link reviewer session —
//      the team phrase must NOT open it, because someone who can read or rotate
//      the phrases makes rotation meaningless;
//  (c) ⚠ THE AMBIGUITY THIS TAB EXISTS TO GET RIGHT: team_access's RLS filters
//      a non-reviewer to ZERO ROWS and returns 200 + [], not 403. Rendering
//      that as "no phrases configured" tells a locked-out person the exact
//      opposite of the truth, so [] from a signed-in session must render as
//      NOT AUTHORISED — and a failed read must render as a failed read;
//  (d) a policy-filtered PATCH answers 200 with an EMPTY body, so a save must
//      prove it touched a row or a rotation that changed nothing reads as
//      success;
//  (e) saving syncs only the slot THAT phrase lives in, so the editor is not
//      locked out by their own rotation and unrelated slots are untouched;
//  (f) raci.js no longer carries a second copy of the editor.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("team_phrases.js", "utf8");
const ROWS = [
  { id: "ci", secret: "ci-secret" },
  { id: "fin", secret: "fin-secret" },
  { id: "gr", secret: "gr-secret" },
  { id: "raci", secret: "raci-secret" }
];

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="team-phrases-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.signedIn !== false) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "aaa.bbb.ccc", refresh_token: "r", email: "map@rccd.edu",
      exp: Date.now() + 3600_000
    }));
  }
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  if (opts.finPass) w.localStorage.setItem("cpl_fin_pass", opts.finPass);
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    const method = (init && init.method) || "GET";
    if (/team_access/.test(url) && method === "PATCH") {
      if (opts.writeEmpty) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      if (opts.writeFail) return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "x" }]) });
    }
    if (/team_access/.test(url)) {
      if (opts.readFail) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opts.rows || ROWS) });
    }
    if (/auth\/v1\/otp/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.eval(SRC);
  return w;
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 30));

(async function () {
  // ── (a) registered as a real tab, in both HTMLs ──
  {
    const a = fs.readFileSync("CPL_Dashboard.html", "utf8");
    const b = fs.readFileSync("index.html", "utf8");
    [["CPL_Dashboard.html", a], ["index.html", b]].forEach(function (pair) {
      const [name, s] = pair;
      check("Rule 4 — nav button in " + name, /data-tab="team-phrases"[^>]*>Team Phrases</.test(s));
      check("Rule 4 — pane in " + name, /id="tab-team-phrases"/.test(s));
      check("Rule 4 — mount point in " + name, /id="team-phrases-root"/.test(s));
      check("Rule 4 — lazy boot in " + name,
        /onActivate\('team-phrases'[\s\S]{0,200}loadScript\('team_phrases\.js', 'CPL_TEAM_PHRASES'/.test(s));
    });
    check("both HTMLs are byte-identical (Rule 4)", a === b);
    const nav = fs.readFileSync("nav_groups.js", "utf8");
    check("listed in a nav group, so it is actually reachable", /'team-phrases'/.test(nav));
  }

  // ── (b) visible to all, contents reviewer-gated ──
  {
    const w = makeWin({ signedIn: false, teamPass: "the-team-phrase" });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    const txt = root.textContent;
    check("signed out: renders a sign-in gate, not the phrases", /Sign in to view the phrases/.test(txt));
    check("signed out: offers the magic link", !!root.querySelector("[data-signin]"));
    check("HOLDING THE TEAM PHRASE DOES NOT OPEN IT — the whole point of rotation",
      !/raci-secret|ci-secret|gr-secret|fin-secret/.test(root.innerHTML));
    check("it never even attempts the read while signed out",
      !w.__fetches.some((f) => /team_access/.test(f.url)));
    check("it explains WHY a phrase is not enough", /must not be able to read or rotate/.test(txt));

    // the magic link goes out and returns to THIS tab
    root.querySelector("[data-email]").value = "map@rccd.edu";
    root.querySelector("[data-signin]").dispatchEvent(new w.Event("click"));
    await tick();
    check("sign-in posts an OTP", w.__fetches.some((f) => /auth\/v1\/otp/.test(f.url)));
    check("…and asks to be returned to this tab",
      w.sessionStorage.getItem("cpl_sb_return_tab") === "team-phrases");
    check("sign-in confirms without claiming success it cannot know",
      /Check your email/.test(root.textContent));
  }

  // ── (c) the ambiguity: [] means NOT AUTHORISED, not "none" ──
  {
    const w = makeWin({ rows: [] });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    const txt = root.textContent;
    check("an empty read renders as a CLOSED DOOR, never as an empty list",
      /not as a reviewer/i.test(txt) && /closed door/.test(txt));
    check("it does NOT say there are no phrases", !/no phrases/i.test(txt));
    check("it names who you are signed in as, so the fix is obvious",
      /map@rccd\.edu/.test(txt));
    check("state records unauthorized, distinct from empty", api._state.loadState === "unauthorized");
  }
  {
    const w = makeWin({ readFail: true });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    check("a FAILED read renders as a failed read", /Could not read the phrases/.test(root.textContent));
    check("…and says plainly that nothing changed", /nothing has been changed/.test(root.textContent));
    check("failed read is distinct from unauthorized", api._state.loadState === "error");
    check("it offers a retry rather than a dead end", !!root.querySelector("[data-reload]"));
  }

  // ── the happy path ──
  {
    const w = makeWin({});
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    check("a reviewer sees every phrase in the roster",
      api.PHRASES.every((d) => new RegExp('data-phrase="' + d.id + '"').test(root.innerHTML)));
    check("each says what it OPENS, not just its name", /Opens:/.test(root.textContent));
    check("each says WHO needs it", /Who needs it:/.test(root.textContent));
    check("secrets are masked until revealed",
      root.querySelector('[data-phrase="raci"]').type === "password");
    root.querySelector('[data-reveal="raci"]').dispatchEvent(new w.Event("click"));
    await tick(5);
    check("reveal unmasks just that one",
      root.querySelector('[data-phrase="raci"]').type === "text"
      && root.querySelector('[data-phrase="fin"]').type === "password");
    check("rotation is warned about before it bites, not after",
      /locked out until you tell them/.test(root.textContent));
  }

  // ── (d)+(e) saving ──
  {
    const w = makeWin({ teamPass: "old-shared", finPass: "old-fin" });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    const inp = root.querySelector('[data-phrase="raci"]');
    inp.value = "brand-new-shared";
    inp.dispatchEvent(new w.Event("input"));
    root.querySelector('[data-save="raci"]').dispatchEvent(new w.Event("click"));
    await tick(40);
    const patch = w.__fetches.filter((f) => (f.init.method === "PATCH"));
    check("save PATCHes only the row it edited", patch.length === 1 && /id=eq\.raci/.test(patch[0].url));
    check("save asks for the representation, so an empty write is detectable",
      /return=representation/.test(JSON.stringify(patch[0].init.headers)));
    check("save reports success", /Saved/.test(root.textContent));
    check("the editor's OWN copy of that phrase is updated — no self-lockout",
      w.localStorage.getItem("cpl_team_pass") === "brand-new-shared");
    check("an UNRELATED slot is left alone", w.localStorage.getItem("cpl_fin_pass") === "old-fin");
  }
  {
    // the silent-no-op class: 200 + [] from a policy-filtered UPDATE
    const w = makeWin({ writeEmpty: true, teamPass: "old-shared" });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    const inp = root.querySelector('[data-phrase="raci"]');
    inp.value = "attempted";
    inp.dispatchEvent(new w.Event("input"));
    root.querySelector('[data-save="raci"]').dispatchEvent(new w.Event("click"));
    await tick(40);
    check("a 200-but-zero-rows write is reported as a FAILURE, not success",
      /not saved/i.test(root.textContent) && !/✓ Saved/.test(root.textContent));
    check("…and the local copy is NOT updated on a write that changed nothing",
      w.localStorage.getItem("cpl_team_pass") === "old-shared");
  }
  {
    const w = makeWin({ writeFail: true });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    const inp = root.querySelector('[data-phrase="fin"]');
    inp.value = "x";
    inp.dispatchEvent(new w.Event("input"));
    root.querySelector('[data-save="fin"]').dispatchEvent(new w.Event("click"));
    await tick(40);
    check("a rejected save says so", /save failed \(403\)/.test(root.textContent));
  }

  // a roster entry with no row must not render as an editable blank
  {
    const w = makeWin({ rows: [{ id: "raci", secret: "s" }] });
    const api = w.CPL_TEAM_PHRASES;
    const root = w.document.getElementById("team-phrases-root");
    api.activate();
    await tick();
    check("a phrase with no row says it has never been set",
      /never been set/.test(root.textContent));
    check("…and offers no Save for it", !root.querySelector('[data-save="fin"]'));
  }

  // ── (f) one implementation, not two ──
  {
    const r = fs.readFileSync("raci.js", "utf8");
    check("raci.js no longer carries its own phrase editor",
      !/showModal\("Manage team phrases"/.test(r) && !/team_access\?id=eq\./.test(r));
    check("…its button navigates to the tab instead",
      /navigate\("team-phrases"\)/.test(r));
    check("the button is shown to phrase users too (discoverability was the bug)",
      !/if \(!state\.sess\.teamPass\) \{\s*\n\s*w\.appendChild\(el\("button"[^)]*Manage team phrase/.test(r));
    check("team_phrases.js is the only place that writes team_access",
      /team_access\?id=eq\./.test(SRC));
  }

  let failed = 0;
  results.forEach(function (x) {
    console.log((x[1] ? "PASS " : "FAIL ") + x[0]);
    if (!x[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error("FATAL", e); process.exit(1); });
