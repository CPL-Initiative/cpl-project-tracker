// COBI — the masthead identity chip (cobi_identity.js) and the rail badge it feeds.
//
// Sam, 2026-08-25: "Seems to me that both the team unlock and the magic link
// login should show on the COBI header level with something like, 'Hi CPL team,
// you're unlocked and may curate.' or 'Hi Sam, you're logged in and may curate.'"
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * BOTH CREDENTIALS, ALWAYS. tabs.js's rail badge read only the magic-link
//     session, so a team-phrase holder curating happily was told "not signed in"
//     on every tab. Reading one of two credentials and reporting it as the whole
//     truth is a capped list rendering as a census.
//
//   * ONE SENTENCE, TWO SURFACES. The masthead chip and the rail badge share
//     read() and greeting(). Two surfaces deriving the same fact separately is
//     the defect being replaced, not the fix.
//
//   * NO CAPABILITY CLAIM. Access is per TABLE. A phrase can edit cpl_memory and
//     cannot delete from it; a reviewer reaches map_student_credit and a phrase
//     never does. A masthead "you may curate" would be wrong on many screens —
//     display is not security. The chip says who and how, never what it buys.
//
//   * NO INVENTED NAME. allowed_reviewers is (email, added_at) — COBI stores no
//     display name for anyone. "Hi Sam" may only be said when the credential
//     itself carries a name; otherwise the address is named, because it is true.
//
//   * FRESHNESS IS MEASURED. A JWT's SHAPE cannot tell a live token from an
//     hour-dead one. The chip reads through cpl_session.js, which knows `exp`,
//     and an UNKNOWN expiry must say so rather than read as "no expiry".
//
//   * EVERY STATE CARRIES ITS CONTROL. "use a curator tab to sign in" named no
//     tab, and the tab it meant is reviewer-only so the phrase could never have
//     opened it. Same shape as the Memory banner telling a signed-in curator to
//     "re-unlock" with no unlock row on the page (#1330).
//
//   * DELEGATION, NOT COPIES. The sign-in box is CPL_REVIEWER_SIGNIN's; the
//     phrase box is CPL_TEAM_PHRASE_HEADER's (and site-scoped, which is easy to
//     get subtly wrong twice). The chip opens them; it does not reimplement them.
//
// Run from repo root: `npm test` (or `node tests/cobi_identity.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const src = fs.readFileSync("cobi_identity.js", "utf8");
const tabsSrc = fs.readFileSync("tabs.js", "utf8");
const tphSrc = fs.readFileSync("team_phrase_header.js", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");
const dashHtml = fs.readFileSync("CPL_Dashboard.html", "utf8");

const JWT_PLAIN = "a".repeat(24) + "." + "b".repeat(24) + "." + "c".repeat(24);
function jwtWith(claims) {
  const b64 = Buffer.from(JSON.stringify(claims)).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return "a".repeat(24) + "." + b64 + "." + "c".repeat(24);
}

// The masthead shape the chip mounts into, plus the rail footer it feeds.
function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div class="header"><div class="cobi-brand"><h1>COBI</h1></div>
      <div class="cobi-utility"><span class="cobi-about">About</span></div></div>
    <aside class="cpl-sidebar"><div class="cpl-sidebar-footer"><div id="cpl-rail-auth"></div></div></aside>
    </body></html>`, { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  if (opts.phrase) { try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {} }
  // A minimal CPL_SESSION stand-in: the chip must read through the keeper, so
  // the keeper is what the test controls.
  if (opts.reviewer) {
    const s = { access_token: opts.jwt || JWT_PLAIN, email: opts.email || "slee@cccco.edu" };
    if (opts.expiresInMs !== undefined) s.exp = Date.now() + opts.expiresInMs;
    window.CPL_SESSION = {
      get: () => s,
      isFresh: () => opts.fresh !== false,
      expiresInMs: () => (opts.expiresInMs === undefined ? null : opts.expiresInMs),
      signOut: () => { window.__signedOut = true; },
    };
    try { window.sessionStorage.setItem("cpl_sb", JSON.stringify(s)); } catch (e) {}
  }
  window.eval(fs.readFileSync("team_phrase.js", "utf8"));
  if (opts.signinStub !== false) {
    window.CPL_REVIEWER_SIGNIN = {
      mountInto: (host) => { const b = window.document.createElement("button"); b.textContent = "Email me a link"; host.appendChild(b); },
      signOut: () => { window.__signedOut = true; },
    };
  }
  if (opts.lockStub !== false) {
    window.CPL_TEAM_PHRASE_HEADER = { open: () => { window.__lockOpened = true; } };
  }
  window.eval(src);
  window.eval(tabsSrc);
  // jsdom leaves readyState at "loading" through the constructor, so each
  // module's own auto-init defers to a DOMContentLoaded that this synchronous
  // test never reaches. Mount both explicitly.
  window.COBI_IDENTITY.init();
  if (window.CPL_TABS && window.CPL_TABS.renderRailAuth) window.CPL_TABS.renderRailAuth();
  return window;
}
function chipLabel(win) {
  const b = win.document.querySelector(".cobi-utility .cobi-ident-btn");
  return b ? b.textContent : null;
}
function openPane(win) {
  const b = win.document.querySelector(".cobi-utility .cobi-ident-btn");
  if (!b) { check("(!) the chip button exists to open", false, "not rendered"); return null; }
  b.click();
  return win.document.querySelector(".cobi-ident-pane");
}
function railText(win) {
  const el = win.document.getElementById("cpl-rail-auth");
  return el ? el.textContent : "";
}

(function () {
  // ── (A) static — wiring and Rule 4 ───────────────────────────────────────
  check("(A) the module exposes read + greeting as the shared seam",
    /read: read/.test(src) && /greeting: greeting/.test(src));
  check("(A) ⭐ tabs.js's rail badge speaks through COBI_IDENTITY",
    /COBI_IDENTITY/.test(tabsSrc) && /ID\.greeting/.test(tabsSrc));
  check("(A) the rail still exists as a rendered surface", /renderRailAuth/.test(tabsSrc));
  check("(A) ⭐ tabs.js listens for the keeper's own event name",
    /addEventListener\('cpl-session-changed'/.test(tabsSrc));
  check("(A) …and for a team-phrase unlock", /addEventListener\('cpl-team-pass-unlocked'/.test(tabsSrc));
  check("(A) the masthead lock exposes a real open(), not a test seam",
    /^\s*function open\(\) \{ openPane = true; render\(\); \}/m.test(tphSrc) && /open: open,/.test(tphSrc));
  check("(A) the script tag is in index.html", /<script src="cobi_identity\.js"><\/script>/.test(indexHtml));
  check("(A) ⭐ Rule 4 — and in CPL_Dashboard.html", /<script src="cobi_identity\.js"><\/script>/.test(dashHtml));
  check("(A) it loads after the modules it delegates to",
    indexHtml.indexOf("cobi_identity.js") > indexHtml.indexOf("reviewer_signin.js") &&
    indexHtml.indexOf("cobi_identity.js") > indexHtml.indexOf("team_phrase_header.js") &&
    indexHtml.indexOf("cobi_identity.js") > indexHtml.indexOf("cpl_session.js"));
  check("(A) new CSS uses tokens, never a bare hex without one",
    !/#[0-9a-fA-F]{6}/.test(src.replace(/var\(--[a-z-]+,\s*#[0-9a-fA-F]{3,6}\)/g, "")),
    "a raw hex outside a var() fallback");
  // The capability rule and the no-door rule are asserted on RENDERED text in
  // (H) below. Grepping the source would fail on this module's own comments,
  // which quote both wordings in order to explain why they are wrong — and a
  // guard that trips on its own rationale teaches nothing.

  // ── (B) the four states ──────────────────────────────────────────────────
  const NAMED = jwtWith({ user_metadata: { full_name: "Sam Lee" } });
  {
    const w = boot({ reviewer: true, phrase: true, jwt: NAMED });
    const g = w.COBI_IDENTITY.greeting();
    check("(B) ⭐ both credentials → ONE sentence naming both",
      g.tone === "both" && /Hi Sam Lee/.test(g.text) && /the team phrase is unlocked/.test(g.text), g.text);
  }
  {
    const w = boot({ reviewer: true, phrase: true });   // no name in the credential
    const g = w.COBI_IDENTITY.greeting();
    check("(B) both, nameless → still names both credentials",
      g.tone === "both" && /Signed in as/.test(g.text) && /the team phrase is unlocked/.test(g.text), g.text);
  }
  {
    const w = boot({ reviewer: true, jwt: NAMED });
    const g = w.COBI_IDENTITY.greeting();
    check("(B) reviewer only → greets the person",
      g.tone === "reviewer" && /Hi Sam Lee — signed in as yourself/.test(g.text), g.text);
  }
  {
    const w = boot({ phrase: true });
    const g = w.COBI_IDENTITY.greeting();
    check("(B) ⭐ phrase only → 'Hi CPL team' (a shared secret has no person behind it)",
      g.tone === "phrase" && /Hi CPL team/.test(g.text), g.text);
    check("(B) ⭐ …and the rail agrees, where it used to say 'not signed in'",
      /Hi CPL team/.test(railText(w)) && !/not signed in/i.test(railText(w)), railText(w));
  }
  {
    const w = boot({});
    const g = w.COBI_IDENTITY.greeting();
    check("(B) neither → says so plainly", g.tone === "none" && /Not unlocked/.test(g.text), g.text);
    check("(B) the rail says where to go, and it is a place that exists",
      /top right/.test(railText(w)), railText(w));
  }

  // ── (C) no invented name ─────────────────────────────────────────────────
  {
    const w = boot({ reviewer: true, email: "slee@cccco.edu" });
    const g = w.COBI_IDENTITY.greeting();
    check("(C) ⭐ with no name in the credential, the ADDRESS is named — never a guess from it",
      /Signed in as slee@cccco\.edu/.test(g.text) && !/Sam/.test(g.text), g.text);
    check("(C) ⭐ …and the GREETING form is not used at all without a name",
      !/^Hi /.test(g.text) && !/^Hi /.test(g.short), g.text + " / " + g.short);
  }
  {
    const w = boot({ reviewer: true, email: "slee@cccco.edu", jwt: jwtWith({ user_metadata: { full_name: "Sam Lee" } }) });
    const g = w.COBI_IDENTITY.greeting();
    check("(C) ⭐ when the credential DOES carry a name, it is used",
      /Hi Sam Lee/.test(g.text), g.text);
    check("(C) a malformed token yields no name rather than throwing",
      w.COBI_IDENTITY._nameFrom({ access_token: JWT_PLAIN }) === null);
  }

  // ── (D) freshness is measured, and unknown says unknown ──────────────────
  {
    const w = boot({ reviewer: true, expiresInMs: 42 * 60 * 1000 });
    const line = w.COBI_IDENTITY._expiryLine(w.COBI_IDENTITY.read().reviewer);
    check("(D) a known expiry is reported in plain minutes", /42 minutes left/.test(line), line);
  }
  {
    const w = boot({ reviewer: true });   // no exp at all
    const line = w.COBI_IDENTITY._expiryLine(w.COBI_IDENTITY.read().reviewer);
    check("(D) ⭐ an UNKNOWN expiry says it is unknown, never 'no expiry'",
      /can’t tell when it expires/.test(line), line);
  }
  {
    const w = boot({ reviewer: true, expiresInMs: -5 * 60 * 1000 });
    const line = w.COBI_IDENTITY._expiryLine(w.COBI_IDENTITY.read().reviewer);
    check("(D) an expired session says expired", /Expired/.test(line), line);
  }

  // ── (E) every state carries its control ──────────────────────────────────
  {
    const w = boot({});
    const pane = openPane(w);
    check("(E) the pane opens from the chip", !!pane && /open/.test(pane.className));
    check("(E) ⭐ signed out → the SHARED sign-in box is mounted right here",
      !!pane && /Email me a link/.test(pane.textContent), pane ? pane.textContent.slice(0, 120) : "");
    const unlock = pane && [...pane.querySelectorAll("button")].find((b) => /Unlock with a team phrase/.test(b.textContent));
    check("(E) ⭐ …and an unlock control is offered too", !!unlock);
    if (unlock) { unlock.click(); check("(E) ⭐ unlock DELEGATES to the one site-scoped lock", w.__lockOpened === true); }
  }
  {
    const w = boot({ reviewer: true });
    const pane = openPane(w);
    const out = pane && [...pane.querySelectorAll("button")].find((b) => /Sign out/.test(b.textContent));
    check("(E) signed in → Sign out is offered", !!out);
    if (out) { out.click(); check("(E) …and it delegates to the shared sign-out", w.__signedOut === true); }
  }
  {
    // The delegation targets are absent — the pane must degrade, not throw.
    const w = boot({ signinStub: false, lockStub: false });
    const pane = openPane(w);
    check("(E) with the shared modules absent, the pane still renders and says where to go",
      !!pane && /About menu/.test(pane.textContent) && /🔒/.test(pane.textContent),
      pane ? pane.textContent.slice(0, 200) : "no pane");
  }

  // ── (F) the honesty line ─────────────────────────────────────────────────
  {
    const w = boot({ reviewer: true, phrase: true });
    const pane = openPane(w);
    check("(F) ⭐ the pane says capability is decided per tab, not here",
      !!pane && /differs by tab/.test(pane.textContent), pane ? pane.textContent.slice(-200) : "");
    check("(F) ⭐ …and that signing in is not the same as being a reviewer",
      !!pane && /doesn’t make you a reviewer/.test(pane.textContent));
    check("(F) the pane names the address it is signed in as",
      !!pane && /slee@cccco\.edu/.test(pane.textContent));
  }

  // ── (G) the two surfaces cannot disagree ─────────────────────────────────
  {
    const w = boot({ reviewer: true, phrase: true });
    const g = w.COBI_IDENTITY.greeting();
    check("(G) ⭐ the rail renders the SAME sentence the chip does",
      railText(w).indexOf(g.text) >= 0, railText(w));
    check("(G) the chip's short form is in its label", (chipLabel(w) || "").indexOf(g.short) >= 0, chipLabel(w));
  }

  // ── (H) the rendered page, in every state, makes no capability claim and
  //         strands nobody ────────────────────────────────────────────────
  [{}, { reviewer: true }, { phrase: true }, { reviewer: true, phrase: true }].forEach(function (opt, i) {
    const w = boot(opt);
    const pane = openPane(w);
    const seen = (chipLabel(w) || "") + " " + (pane ? pane.textContent : "") + " " + railText(w);
    check("(H) ⭐ state " + i + " never tells the reader they \"may curate\"",
      !/may curate/i.test(seen), seen.slice(0, 160));
    check("(H) ⭐ state " + i + " never sends them to \"a curator tab\"",
      !/curator tab/i.test(seen), seen.slice(0, 160));
    check("(H) state " + i + " offers at least one control",
      !!pane && pane.querySelectorAll("button").length > 0);
  });

  // ── (I) the REAL masthead ────────────────────────────────────────────────
  // A fixture agreeing with itself proves nothing about the page this ships on.
  // The selectors are mounted against index.html's own markup, so a masthead
  // restructure fails here rather than silently dropping the chip in a browser
  // no session can open (the sandbox is egress-blocked from the published site).
  {
    const dom = new JSDOM(indexHtml, { runScripts: "outside-only", url: "https://example.org/" });
    const w = dom.window;
    check("(I) index.html still has the utility strip the chip mounts into",
      !!w.document.querySelector(".header .cobi-utility"));
    check("(I) …and the rail footer the badge writes into",
      !!w.document.getElementById("cpl-rail-auth"));
    w.eval(fs.readFileSync("team_phrase.js", "utf8"));
    w.eval(src);
    w.COBI_IDENTITY.init();
    const chip = w.document.querySelector(".header .cobi-utility .cobi-ident-btn");
    check("(I) ⭐ the chip mounts into the REAL masthead", !!chip, "not mounted");
    check("(I) …first in the strip, before About",
      w.document.querySelector(".header .cobi-utility").firstElementChild.className === "cobi-ident");
    check("(I) it renders a state even with no credential at all",
      !!chip && /Not unlocked/.test(chip.textContent), chip ? chip.textContent : "");
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
