// DR-26 — the live-session banner in the COBI header (Sam, 2026-09-08).
//
// He asked for a banner saying he is working in a Claude Code cloud session,
// linking to it so a teammate can look in. Two facts from the Claude Code docs
// decided the shape, and both are what this suite guards:
//
//   * a cloud session is PRIVATE by default and sharing is a per-session
//     toggle, so the banner announces a session Sam has ALREADY shared
//     (option A of the two he was offered) and must never render a link on its
//     own initiative;
//   * a recipient sees the session's state when they OPEN the link and their
//     view does not update, so the wording says reload rather than watch.
//
// Every one of these is a FAIL-CLOSED case: the banner's failure mode is
// telling the whole organization to open a private session, so anything
// unexpected renders nothing at all.
//
// Run from repo root: `node tests/cobi_live_banner.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const SRC = fs.readFileSync(path.join(ROOT, "cobi_brand.js"), "utf8");
const results = [];
const check = (name, cond, why) => results.push([name, !!cond, why]);

function build() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div class="header"><h1>COBI</h1></div></body></html>',
    { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.org/index.html" });
  dom.window.eval(SRC);
  return dom;
}
const LINK = "https://claude.ai/code/session_01PmWfWVNTwivV5D4KYkmA9R";

(function () {
  // ── the shipped default: a row that is off renders nothing ────────────────
  let d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: false, session_url: LINK });
  check("an inactive row renders no banner", !d.window.document.getElementById("cobi-live"));

  // ── ⭐ active but with no link renders nothing, whatever the table said ────
  d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: null });
  check("⭐ active with no link renders no banner (never an empty promise)",
    !d.window.document.getElementById("cobi-live"));

  // ── an expired row renders nothing: a stale claim is worse than none ──────
  d = build();
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: LINK, expires_at: new Date(Date.now() - 60000).toISOString() });
  check("⭐ an expired row renders no banner", !d.window.document.getElementById("cobi-live"));

  d = build();
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: LINK, expires_at: new Date(Date.now() + 3600000).toISOString() });
  check("an unexpired row does render", !!d.window.document.getElementById("cobi-live"));

  /* ⚠️ AND AN EXPIRY THIS ENGINE CANNOT READ MUST HIDE IT TOO (Session 245).
   * The check was `getTime() <= Date.now()`, and NaN <= anything is FALSE — so
   * a malformed timestamp skipped the expiry test entirely and the banner would
   * announce a dead session forever. That is the opposite of the "fails closed
   * at every step" this block claims. PostgREST sends +00:00, which parses;
   * `+00` without the colon is Invalid Date in V8, and a server, a migration or
   * a hand-written row can produce it. Sam hit the ordinary version of this on
   * 2026-09-09 — a row four hours past its window, correctly hidden. */
  d = build();
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: LINK, expires_at: "2026-09-08T20:29:52.666224+00" });
  check("⭐ an UNPARSEABLE expiry hides the banner (fails closed, not open)",
    !d.window.document.getElementById("cobi-live"));

  // ── nothing at all renders nothing ────────────────────────────────────────
  d = build();
  d.window.COBI_BRAND.liveBannerRender(null);
  d.window.COBI_BRAND.liveBannerRender(undefined);
  check("no row at all renders no banner", !d.window.document.getElementById("cobi-live"));

  // ── the live case: what it says and where it sits ─────────────────────────
  d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: LINK });
  const bar = d.window.document.getElementById("cobi-live");
  check("an active, unexpired row renders the banner", !!bar);
  check("it sits ABOVE the header, not inside its grid",
    !!bar && bar.nextElementSibling && bar.nextElementSibling.className === "header",
    bar ? String(bar.nextElementSibling && bar.nextElementSibling.className) : "no bar");
  const a = bar && bar.querySelector("a");
  check("the link points at the session Sam shared", a && a.href === LINK, a ? a.href : "no link");
  check("it opens in a new tab without handing over the opener",
    a && a.target === "_blank" && /noopener/.test(a.rel));
  check("⭐ it does not promise live watching — it says reload",
    /reload/i.test(bar.textContent) && !/\bwatch(ing)?\b|\blive\b/i.test(bar.textContent),
    bar.textContent);
  check("every control is a word, per the glyph rule",
    /Hide/.test(bar.textContent) && !/[←-⇿☀-➿\uD83C-\uDBFF]/.test(bar.textContent),
    bar.textContent);
  check("it announces itself to a screen reader without stealing focus",
    bar.getAttribute("role") === "status");

  // ── dismissal is per link, so a NEW session is a new banner ───────────────
  bar.querySelector("button").click();
  check("Hide removes it", !d.window.document.getElementById("cobi-live"));
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: LINK });
  check("and it stays hidden for that same link", !d.window.document.getElementById("cobi-live"));
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: "https://claude.ai/code/session_01OTHERSESSION" });
  check("⭐ but a DIFFERENT session shows again — dismissing one never hides the next",
    !!d.window.document.getElementById("cobi-live"));

  // ── ⭐ THE TEAM GATE (Sam, 2026-09-08) ────────────────────────────────────
  // "limit the folks who can use the banner link to users on the MAP Team
  // Users (not MAP College Users)". The MAP team roster is `team_members`
  // (org='MAP'), the one on the TEAM & RACI tab — 42 people. It is NOT
  // map_college_users, which is College Users & Roles and a different 2,801.
  //
  // The real gate is RLS: `is_map_team()` on both read and write, verified as
  // anon against the live table at 0 rows. These check the client half.
  //
  // ⭐ NO SIGN-IN EACH VISIT (Sam: "they wouldn't need to be signed in to see
  // the header"). Two ways in: the reader's own magic-link token, or the shared
  // team phrase entered once and kept in the browser.
  //
  // ⚠️ The phrase is a SHARED SECRET, not an identity — wider than the 42-row
  // roster, narrower than the public. Which is why WRITING never accepts it.
  {
    const d2 = build();
    const w2 = d2.window;
    check("⭐ a plain visitor with neither credential does not read at all",
      w2.COBI_BRAND.liveAuthHeaders() === null);

    try { w2.localStorage.setItem("cpl_team_pass", "a-phrase"); } catch (e) {}
    const hp = w2.COBI_BRAND.liveAuthHeaders();
    check("⭐ the shared team phrase alone opens it — no sign-in needed",
      !!hp && hp["x-team-pass"] === "a-phrase", JSON.stringify(hp));
    check("...and the anon key rides as the bearer, since PostgREST 401s on an empty one",
      !!hp && hp.Authorization === "Bearer " + hp.apikey);
    try { w2.localStorage.removeItem("cpl_team_pass"); } catch (e) {}

    const jwt = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc";
    try { w2.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: jwt })); } catch (e) {}
    const hr = w2.COBI_BRAND.liveAuthHeaders();
    check("a signed-in reader sends their OWN bearer token — the email the policy matches",
      !!hr && hr.Authorization === "Bearer " + jwt, JSON.stringify(hr));

    try { w2.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "not-a-jwt" })); } catch (e) {}
    check("⭐ a malformed token is not sent as a bearer (PostgREST 401s on one)",
      w2.COBI_BRAND.liveAuthHeaders() === null);
  }

  /* ── ⭐ THE CURATOR-ONLY EXPIRY DIAGNOSTIC (Sam, 2026-09-10) ───────────────
   * "I still don't see the banner saying I'm active in a CC session with a
   * link in the header." Nothing was broken. His row was active, carried a
   * link, and had expired two days earlier — the block above hid it exactly as
   * designed, and hiding it IS right, because a stale link invites the team
   * into a dead session.
   *
   * ⭐ THE DEFECT WAS THAT AN EXPIRED ROW AND AN UNBUILT FEATURE LOOK THE SAME
   * TO THE ONE PERSON WHO CAN FIX EITHER. Every check above this point asks
   * whether the banner is absent, and absent was the correct answer each time,
   * so the whole suite was green while Sam spent a day believing the feature
   * did not exist. Failing closed and failing silently are separable, and only
   * the first one was ever the requirement.
   *
   * These guard the separation: the LINK still never renders for a dead
   * session (unchanged, and the checks above still say so), and the reader who
   * already passed the RLS gate gets told why. */
  {
    const HOUR = 3600000;
    const twoDaysAgo = new Date(Date.now() - 48 * HOUR).toISOString();

    let e = build();
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: twoDaysAgo });
    const note = e.window.document.getElementById("cobi-live-stale");
    check("⭐ an active row whose expiry passed says so, instead of nothing", !!note);
    check("⚠️ and it is NOT the banner — #cobi-live stays absent for a dead session",
      !e.window.document.getElementById("cobi-live"));
    check("it says how long ago, in words a person would use",
      !!note && /expired 2 days ago\./.test(note.textContent),
      note ? note.textContent : "no note");
    check("⭐ it carries NO link — the link is the thing that expired",
      !!note && !note.querySelector("a"));
    check("it names the row to fix, so the fix does not need a search",
      !!note && /expires_at/.test(note.textContent) && /cobi_live_session/.test(note.textContent),
      note ? note.textContent : "no note");
    check("it says who can see it, so a curator note is never mistaken for a public one",
      !!note && /Only the MAP team sees this line/.test(note.textContent),
      note ? note.textContent : "no note");
    check("it sits ABOVE the header, where the banner would have",
      !!note && note.nextElementSibling && note.nextElementSibling.className === "header");
    check("it announces itself to a screen reader without stealing focus",
      !!note && note.getAttribute("role") === "status");
    check("every control is a word here too, per the glyph rule",
      !!note && /Hide/.test(note.textContent) &&
      !/[←-⇿☀-➿\uD83C-\uDBFF]/.test(note.textContent),
      note ? note.textContent : "no note");

    /* ⚠️ AND IT NEVER PRINTS THE ENGINE'S FAILURE AT THE READER. `+00` without
     * the colon is Invalid Date in V8 (the case the block above was fixed for
     * in S245), and `Date.now() - NaN` is NaN — so the obvious version of this
     * diagnostic says "expired NaN days ago", which is worse than silence. */
    e = build();
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: "2026-09-08T20:29:52.666224+00" });
    const bad = e.window.document.getElementById("cobi-live-stale");
    check("⭐ an UNREADABLE expiry gets its own sentence, never \"NaN days ago\"",
      !!bad && !/NaN|Invalid/.test(bad.textContent) &&
      /not a readable date/.test(bad.textContent),
      bad ? bad.textContent : "no note");
    check("...and the banner is still hidden for it (fails closed, unchanged)",
      !e.window.document.getElementById("cobi-live"));
    check("...and it quotes the value that is wrong, so the row can be corrected",
      !!bad && /666224\+00/.test(bad.textContent), bad ? bad.textContent : "no note");

    // ── an inactive row still says nothing at all: no row, no diagnosis ──────
    e = build();
    e.window.COBI_BRAND.liveBannerRender(
      { active: false, session_url: LINK, expires_at: twoDaysAgo });
    check("an inactive row renders neither banner nor note",
      !e.window.document.getElementById("cobi-live") &&
      !e.window.document.getElementById("cobi-live-stale"));

    // ── dismissal: keyed on the expiry it reports ───────────────────────────
    e = build();
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: twoDaysAgo });
    const hideNote = (dom) => {
      const n = dom.window.document.getElementById("cobi-live-stale");
      if (n) n.querySelector("button").click();
      return !!n;
    };
    check("the note offers a Hide control at all", hideNote(e));
    check("Hide removes the note", !e.window.document.getElementById("cobi-live-stale"));
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: twoDaysAgo });
    check("and it stays hidden for that same expiry",
      !e.window.document.getElementById("cobi-live-stale"));
    e.window.COBI_BRAND.liveBannerRender({
      active: true, session_url: LINK,
      expires_at: new Date(Date.now() - 3 * HOUR).toISOString() });
    check("⭐ but a NEW expiry reports itself again — dismissing one never hides the next",
      !!e.window.document.getElementById("cobi-live-stale"));

    /* ⭐ THE ONE THAT WOULD HAVE RE-CREATED THE ORIGINAL FAILURE — and note
     * WHICH mistake it catches, because the obvious answer is wrong. Sharing
     * the storage KEY does not break this: the two paths compare it against
     * different values (an expiry, a url), so they never collide, and reverting
     * to one key leaves all 40 checks green. What breaks it is dismissing the
     * note ON THE SESSION URL — the natural-reading bug, since the note is
     * about that session. Then the sequence Sam is most likely to run — hide
     * the note, set a fresh expiry, reload — shows him nothing, a second time,
     * for a new reason. Keyed on the expiry, this stays green. */
    e = build();
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: twoDaysAgo });
    hideNote(e);
    e.window.COBI_BRAND.liveBannerRender(
      { active: true, session_url: LINK, expires_at: new Date(Date.now() + HOUR).toISOString() });
    check("⭐ hiding the note does NOT hide the live banner a fresh row then produces",
      !!e.window.document.getElementById("cobi-live"));
  }

  // ── the source-level half: the read is one row, and it carries credentials ─
  check("the banner reads cobi_live_session, one row, with the reader's credentials",
    /rest\/v1\/cobi_live_session"\s*\+\s*"\?id=eq\.1/.test(SRC) &&
    /fetch\(LIVE_URL, \{ headers: headers \}\)/.test(SRC));
  check("a failed read renders nothing rather than throwing",
    /\.catch\(function \(\) \{ \/\* no banner is the right answer to a failed read/.test(SRC));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
