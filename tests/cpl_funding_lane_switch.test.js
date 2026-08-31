// tests/cpl_funding_lane_switch.test.js
//
// THE LANE SWITCH IS RETIRED (Sam adopted the one-pool model, 2026-08-31 —
// R1: no lane switch; R2: no NC priority card set / strategies editor;
// R6: no paired NC rows; R7: no Award range section).
//
// This file used to guard the CR / NC toggle above the priority cards and the
// noncredit card set behind it — one switch moving all three cards, credit
// strategies suppressed on NC cards, the NC strategy editor writing to its own
// store, the two-row Award range. One pool ended the mechanism those checks
// policed: there is ONE card set whose statewide figures carry both shares
// together (Total Possible), one row per institution with a CR and an NC award
// cell on its face, and the bounds live in the window card's fold. The
// successor coverage of the adopted model is tests/cpl_funding_one_pool.test.js;
// the noncredit EARNING semantics the lane carried (F1 / N2 b — $0 until the
// feeds report, never an advance) survive re-aimed in
// tests/cpl_funding_nc_lane.test.js. The retirement-guard pattern here is
// tests/cpl_funding_rural.test.js: each retired surface is pinned as ABSENT,
// because re-introducing any one of them would silently fork the model into
// two lanes again.
//
// What survives UNRETIRED in this file: the auth-bar guards (sections 2–5
// below). They were never lane mechanics — they lived here because this file
// carried them — and the failure they pin (Sam losing the same three priority
// relabels twice to a private save that looked published) is lane-agnostic.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_lane_switch.test.js`).
const { check, freshDom, boot, click, commit, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const cards = (doc) => Array.from(doc.querySelectorAll(".cplfund-prio .p"));
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

// ── 1. the retirement guard (R1 / R2 / R6 / R7, 2026-08-31) ─────────────────
{
  const dom = freshDom();
  const win = dom.window;
  const doc = boot(win);
  const T = win.CPL_FUNDING_TAB;

  // R1 — the switch itself, and any control that could re-scope a lane.
  check("R1: no lane switch renders (#cplFundLane is gone)", !doc.getElementById("cplFundLane"));
  check("R1: no lane button survives anywhere (no data-val='nc' / 'cr' control)",
    !doc.querySelector('button[data-val="nc"], button[data-val="cr"]'));
  check("R1: the view state carries no lane (state.viewLane is gone)",
    !("viewLane" in T._state));

  // R2 — ONE card set, and it is the EDITABLE one. The retired NC set was a
  // read-only clone with one editor of its own; neither half may come back.
  check("R2: exactly three priority cards render — one set, not one per lane",
    cards(doc).length === 3);
  check("R2: the one set keeps its editors (title, share, factor, metric, description)",
    cards(doc).every((c) => c.querySelectorAll("[data-edit]").length >= 5 &&
      !!c.querySelector('[data-edit="prio-title"]')));
  check("R2: no NC-lane strategy editor survives (data-edit='nc-strategy' / data-ncstratadd)",
    !doc.querySelector('[data-edit="nc-strategy"], [data-ncstratadd], [data-ncstratdel]'));
  check("R2: no lane chip is painted on a card or a row (.cf-lanechip is gone)",
    !doc.querySelector(".cf-lanechip"));

  // R6 — one row per institution; the paired-NC-row machinery is gone.
  check("R6: no paired noncredit rows and no NC SYSTEM row render",
    !doc.querySelector("tr.cplfund-ncrow") && !doc.querySelector("tr.cplfund-ncsysrow"));
  check("R6: exactly ONE SYSTEM row, carrying the CR/NC award pair on its face",
    doc.querySelectorAll(".cplfund-systemrow").length === 1 &&
    doc.querySelectorAll(".cplfund-systemrow .cf-award").length === 2);

  // R7 — the Award range section with its two separately-solved lane rows.
  check("R7: no Award range rows render (.cplfund-awardrow is gone)",
    !doc.querySelector(".cplfund-awardrow, .cplfund-awardrow-h"));

  // The mechanism is gone from the SOURCE, not just unreachable — dead lane
  // plumbing is a trap for the next reader (the rural retirement's rule).
  // These are raw-source greps on "function <name>": the helpers are still
  // NAMED in the retirement comment at ncPrioCap, which is the point of
  // grepping for the definition rather than the word.
  ["laneIsNc", "laneReadOnly", "lanePerYear", "lanePriorities", "lanePrioCap",
   "laneEarnAgg", "ncEarnAgg"
  ].forEach((fn) => {
    check("source: " + fn + "() is gone", consumerSrc.indexOf("function " + fn) === -1);
  });
  check("source: no cplFundLane id survives anywhere in the module",
    consumerSrc.indexOf("cplFundLane") === -1);
  check("source: the NC card's empty-strategies placeholder is gone with the card set",
    consumerSrc.indexOf("None written for the noncredit lane") === -1);

  // ── 1b. `undelivered` still conflates two things, and the order still
  //         matters (the regression the lane cards shipped and fixed) ────────
  // srcDelivered() asks the LOADED artifact whether a key is present, so when
  // the artifact has not loaded at all it answers false for EVERY source —
  // credit included. The lane cards are gone, but the branch ordering they
  // forced (artifact-missing BEFORE undelivered, mirroring earnFraction) now
  // serves the ONE card set's actuals line: this harness boots WITHOUT the
  // performance artifact, which is precisely the state that exposed the bug.
  check("with no artifact, the fixture really has none (the state that exposed it)",
    !win.CPL_FUNDING_PERF);
  check("with no artifact, every CREDIT card says the refresh is pending",
    cards(doc).every((c) => /next daily data refresh/i.test(flat(c))));
  check("with no artifact, NO card claims its measure is uncarried",
    cards(doc).every((c) => !/not carry this measure/i.test(flat(c))));
  // (The noncredit half of the same conflation — undelivered → $0, never an
  // advance — is pinned against _ncPrios and the NC award cell in
  // tests/cpl_funding_nc_lane.test.js B3/B4/B14.)

  // ── 1c. a shared bound is COUNTED, not attributed to one institution ──────
  // The old Award range counted ties on both bounds so the box never named one
  // of five colleges as though the ceiling were a fact about that college.
  // The bounds now live in the window card's fold (R7's successor); the
  // counting rule must survive the move.
  const eff = T._effective();
  const fold = Array.from(doc.querySelectorAll("details.cplfund-pool-projects"))
    .find((d) => /Show the institutions with Base and Cap funding/.test(flat(d.querySelector("summary"))));
  check("the bounds fold renders under the window card (R7's successor)", !!fold);
  check("the fixture shares both bounds (guards the counting checks, not the code)",
    eff.pool.at_floor > 1 && eff.pool.at_cap > 1);
  const foldText = flat(fold);
  check("the Range line COUNTS the institutions at the base, and names the bound",
    new RegExp(eff.pool.at_floor + " institutions at the " +
      money(eff.pool.floor_window).replace(/[$]/g, "\\$") + " base award").test(foldText));
  check("the Range line COUNTS the institutions at the cap, and names the bound",
    new RegExp(eff.pool.at_cap + " institutions at the " +
      money(eff.pool.cap_window).replace(/[$]/g, "\\$") + " cap").test(foldText));
  check("the at-cap institutions are NAMED in their own bullet (a count is not a roster)",
    (function () {
      const seg = (foldText.split("At the cap:")[1] || "").split("At the base:")[0];
      return seg.split("·").length === eff.pool.at_cap;
    })());
}

// ── 2. a private save and a published save must not feel the same ───────────
// Sam relabelled the three priorities on the live tab, 2026-08-28, and the
// change never reached Supabase. The routing was never at fault — every
// consumer reads the model through _prios()/_ncPrios(), so a rename propagates
// on its own. The change never ENTERED the routing.
//
// activeOverride() returns the per-browser SCENARIO layer whenever unlocked()
// is false, persistActive() writes it to localStorage inside a swallowed
// try/catch, and the scenario layer wins the render — so the tab shows the edit
// back and it looks published.
//
// ⚠️ THE ACKNOWLEDGMENT WAS GATED ON unlocked(). A signed-in curator got
// "saving… / ✓ saved" beside the field they had just typed in; a locked one got
// nothing but a static banner that was already on screen before they started
// and does not change when they type. The per-edit event existed exactly where
// it was not needed and was missing where it was.
{
  const dom2 = freshDom();
  const w2 = dom2.window;
  const d2 = boot(w2);
  const T2 = w2.CPL_FUNDING_TAB;
  const bar = () => (d2.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  // The fixture boots LOCKED (no reviewer session).
  check("the fixture is locked, which is the state that loses work",
    /Exploring|Viewing the shared model/.test(bar()));

  // An edit in locked mode: it persists (to localStorage) and must SAY so.
  T2._state.viewSlot = "1";
  const sh2 = T2._getShared();
  sh2.yearPriorities = sh2.yearPriorities || {};
  sh2.yearPriorities["1"] = sh2.yearPriorities["1"] || {};
  const titleInput = d2.querySelector('.cplfund-prio [data-edit="prio-title"]');
  check("a priority title is editable on the one card set", !!titleInput);
  if (titleInput) {
    commit(w2, titleInput, "RENAMED BY A LOCKED CURATOR");
    const after = bar();
    check("a locked edit is acknowledged at all (it used to be silent)",
      /saved/i.test(after));
    check("...and names the DESTINATION, not just the fact of saving",
      /this browser/i.test(after));
    check("...and tells the curator how to publish it",
      /sign in/i.test(after));
    // ⚠️ A bare "✓ saved" is true and is the exact misreading this prevents.
    check("a locked save never reads as a plain published save",
      !/^\s*✓ saved\s*$/.test(after) && !/save for everyone/i.test(after));
  }
}

// ── 3. the client's gate must mirror the RLS policy ─────────────────────────
// Sam relabelled the priorities while the masthead read "● Signed in", and
// nothing reached Supabase.
//
// ⚠️ TWO CREDENTIALS, ONE WORD. COBI's masthead reports the REVIEWER magic-link
// session; this tab gated shared editing on `tp().session()`, which is non-null
// ONLY when a team PHRASE sits in localStorage. All three funding tables carry
//     with check (is_allowed_reviewer() OR team_pass_ok())
// so the DATABASE would have accepted his write. The client never attempted it:
// activeOverride() handed him the per-browser scenario layer, the edit went to
// localStorage, and the scenario layer won the render — so the tab showed the
// change back and it looked published.
//
// A gate that is STRICTER than its policy fails silently and in the direction
// of lost work; the guard is that the two agree.
{
  const dom3 = freshDom();
  const w3 = dom3.window;
  const d3 = boot(w3);
  const T3 = w3.CPL_FUNDING_TAB;
  const bar3 = () => (d3.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  check("with neither credential the tab is locked", /Viewing the shared model|Exploring/.test(bar3()));

  // A reviewer session, no team phrase — the exact state in Sam's screenshot.
  w3.CPL_SESSION = {
    get: () => ({ access_token: "header.payload.sig", refresh_token: "r" }),
    isFresh: () => true,
    authHeaders: (extra) => Object.assign({ apikey: "anon", Authorization: "Bearer header.payload.sig" }, extra || {}),
  };
  T3.render();
  check("a fresh REVIEWER session unlocks shared editing (it used not to)",
    !!d3.querySelector(".cplfund-authbar .mode.shared"));
  check("...and the banner names the credential actually doing it",
    /Signed in/i.test(bar3()) && !/Team editing on/i.test(bar3()));

  // ⚠️ An EXPIRED reviewer session must NOT unlock: claiming unlocked() there
  // trades a silent private save for a loud 401. Neither is wanted.
  w3.CPL_SESSION.isFresh = () => false;
  T3.render();
  check("a STALE reviewer session does not unlock",
    !d3.querySelector(".cplfund-authbar .mode.shared"));

  // ⚠️ THE TEAM PHRASE MUST NO LONGER UNLOCK THIS TAB (Sam, 2026-08-28:
  // "clean up the auth so it requires the magic link auth and not the team
  // phrase"). The RLS policies were narrowed to is_allowed_reviewer() alone,
  // so a client that still offered phrase editing would hand someone a write
  // the database now refuses — the SAME mirroring bug as #1370, pointing the
  // other way. This assertion previously pinned the opposite behavior; it is
  // kept, inverted, because a silent re-widening is the failure worth catching.
  w3.CPL_SESSION = null;
  w3.CPL_TEAM_PHRASE = {
    session: () => ({ teamPass: "p", email: "(team)" }),
    decorateHeaders: (h) => { h["x-team-pass"] = "p"; return h; },
  };
  T3.render();
  check("a team phrase ALONE no longer unlocks — curating needs a reviewer",
    !d3.querySelector(".cplfund-authbar .mode.shared"));
  check("...and the tab does not advertise team editing any more",
    !/Team editing on/i.test(bar3()));

  // And the banner names the PERSON, not a shared placeholder: a per-person
  // credential whose writes stamp "(team)" throws away what it bought.
  w3.CPL_TEAM_PHRASE = null;
  w3.CPL_SESSION = {
    get: () => ({ access_token: "header.payload.sig", email: "sam@example.edu" }),
    isFresh: () => true,
    authHeaders: (extra) => Object.assign({ apikey: "anon", Authorization: "Bearer header.payload.sig" }, extra || {}),
  };
  T3.render();
  check("the banner names the signed-in curator",
    /sam@example\.edu/.test(bar3()));
}

// ── 4. work that exists only in this browser must say so, and be publishable ─
// Sam lost the same three priority relabels TWICE. The gate fix (#1370) let a
// reviewer write; it did not deal with what happens to edits made BEFORE they
// signed in. Those live in SCENARIO, and SCENARIO WINS THE RENDER — so the tab
// paints them back and they are indistinguishable from published work.
//
// ⚠️ THE PROMOTION EXISTED AND ONLY ONE PATH REACHED IT. The team-phrase unlock
// row promotes the local what-if into shared on unlock. A magic-link reviewer
// never passes through that row: unlocked() flips true, the row disappears, and
// the overlay is stranded on top of shared for ever.
{
  const dom4 = freshDom();
  const w4 = dom4.window;
  const d4 = boot(w4);
  const T4 = w4.CPL_FUNDING_TAB;
  const bar4 = () => (d4.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  // Edit while LOCKED — the edit lands in the per-browser scenario layer.
  T4._setScenario({ yearPriorities: { "1": { "0": { title: "LOCAL ONLY TITLE" } } } });
  T4.render();
  check("a locked browser reports its edits as local", /this browser only/i.test(bar4()));

  // Now sign in by magic link, exactly as Sam did.
  w4.CPL_SESSION = {
    get: () => ({ access_token: "h.p.s", refresh_token: "r" }),
    isFresh: () => true,
    authHeaders: (extra) => Object.assign({ apikey: "anon" }, extra || {}),
  };
  T4.render();
  check("signing in unlocks shared editing", !!d4.querySelector(".cplfund-authbar .mode.shared"));
  // ⭐ THE ASSERTION THAT WOULD HAVE CAUGHT THIS: being unlocked is not enough.
  check("...and the stranded local overlay is called out, not left silent",
    /nobody else can see/i.test(bar4()));
  check("...with a control to publish it", !!d4.querySelector("#cplFundPromote"));

  // Publishing merges the overlay into shared.
  const btn4 = d4.querySelector("#cplFundPromote");
  if (btn4) {
    click(w4, btn4);
    check("publishing moves the local edit into the shared scenario",
      JSON.stringify(T4._getShared()).indexOf("LOCAL ONLY TITLE") !== -1);
    check("...and the warning clears once nothing is browser-only",
      !/nobody else can see/i.test(bar4()));
  }
}

// ── 5. an expired sign-in says so ───────────────────────────────────────────
// Sam, 2026-08-28: "I should get a notice if my token has expired." A Supabase
// token lives ~1h; without this a session that died mid-edit reads as ordinary
// exploring, and the curator cannot tell "I am browsing" from "I was working and
// silently stopped being able to save".
{
  const dom5 = freshDom();
  const w5 = dom5.window;
  const d5 = boot(w5);
  const T5 = w5.CPL_FUNDING_TAB;
  const bar5 = () => (d5.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  w5.CPL_SESSION = {
    get: () => ({ access_token: "h.p.s", refresh_token: "r" }),
    isFresh: () => false,          // present, but dead
    authHeaders: (e) => Object.assign({}, e || {}),
  };
  T5.render();
  check("an EXPIRED session does not unlock shared editing",
    !d5.querySelector(".cplfund-authbar .mode.shared"));
  check("...and says the sign-in expired, not merely that you are exploring",
    /expired/i.test(bar5()));
  check("...and names the remedy", /sign in again/i.test(bar5()));

  // No session at all must NOT claim an expiry.
  w5.CPL_SESSION = null;
  T5.render();
  check("never-signed-in is not reported as an expiry", !/expired/i.test(bar5()));
}

finish();
