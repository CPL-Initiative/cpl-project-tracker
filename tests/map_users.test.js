// MAP Users tab (map_users.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the nav button / pane / lazy-boot are
//      present in BOTH HTMLs (the tab is lazy-loaded, so there's no static
//      <script src> tag — the loadScript boot is the wiring to check);
//  (b) the public aggregate renders a per-college table with role-mix chips +
//      the headline stat boxes;
//  (c) XSS — a college / role string is HTML-ESCAPED in the table and the roster
//      (the data is synced from MAP — treat as untrusted);
//  (d) authHeaders: logged-out → anon Bearer (never an empty/garbled Bearer) +
//      no x-team-pass; a team phrase → the x-team-pass header; a reviewer token
//      → that token as Bearer;
//  (e) rosterHtml: no rows → a sign-in gate message (not a throw); rows → names
//      + emails, escaped.
//
// Run from repo root: `npm test` (or `node tests/map_users.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="map-users"[^>]*>MAP Users</.test(p[1]));
  check("pane #map-users-root in " + p[0], /id="map-users-root"/.test(p[1]));
  check("lazy boot loadScript in " + p[0], /loadScript\('map_users\.js', 'CPL_MAP_USERS_TAB'/.test(p[1]));
});

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("map_users.js", "utf8");

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  // session/team-pass fixtures
  if (opts.reviewerToken) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: opts.reviewerToken, email: "rev@x.edu" }));
  }
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  // fetch mock
  w.fetch = function (url, init) {
    w.__lastFetch = { url: url, init: init || {} };
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve(opts.fetchData || []); },
    });
  };
  // Execute map_users.js as a real script so it gets a proper `window`.
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

// roleChips: sorted by count desc, escaped
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  const chips = api._roleChips({ "Faculty": 3, "Ambassador": 10, "<b>x": 1 });
  check("roleChips: highest count first", chips.indexOf("Ambassador 10") < chips.indexOf("Faculty 3"));
  check("roleChips: escapes role text", chips.indexOf("&lt;b&gt;x") >= 0 && chips.indexOf("<b>x") < 0);
})();

// authHeaders: logged-out → anon Bearer, no team-pass, never empty Bearer
(function () {
  const w = makeWin();
  const h = w.CPL_MAP_USERS_TAB._authHeaders();
  check("authHeaders logged-out: Bearer is the anon key (not empty)",
    /^Bearer .{40,}/.test(h.Authorization));
  check("authHeaders logged-out: no x-team-pass", !("x-team-pass" in h));
})();

// authHeaders: team phrase → x-team-pass header present
(function () {
  const w = makeWin({ teamPass: "open-sesame" });
  const h = w.CPL_MAP_USERS_TAB._authHeaders();
  check("authHeaders team-phrase: x-team-pass sent", h["x-team-pass"] === "open-sesame");
})();

// authHeaders: reviewer token → that token used as Bearer
(function () {
  const tok = "aaaa." + "b".repeat(60) + ".cccc";
  const w = makeWin({ reviewerToken: tok });
  const h = w.CPL_MAP_USERS_TAB._authHeaders();
  check("authHeaders reviewer: uses the access token as Bearer", h.Authorization === "Bearer " + tok);
})();

// rosterHtml: empty → gate (no throw); rows → escaped names/emails
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  const empty = api._rosterHtml([]);
  check("rosterHtml empty: shows a gate message, no table", /Team &amp; RACI|no users/i.test(empty) && empty.indexOf("<table") < 0);
  const filled = api._rosterHtml([{ first_name: "Ada", last_name: "<x>", email: "a@b.edu", role_name: "Faculty", username: "ada" }]);
  check("rosterHtml rows: renders a table with the email", filled.indexOf("a@b.edu") >= 0 && filled.indexOf("<table") >= 0);
  check("rosterHtml rows: escapes the name", filled.indexOf("&lt;x&gt;") >= 0 && filled.indexOf("Ada <x>") < 0);
})();

// Session 88 — UserStatus / Disciplines / Last-updated in the roster.
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  check("statusBadge Active → green badge", /mapu-st-active/.test(api._statusBadge("Active")));
  check("statusBadge Inactive → muted badge", /mapu-st-inactive/.test(api._statusBadge("Inactive")));
  check("statusBadge empty → em dash", api._statusBadge("") === "—");
  check("discCell empty → em dash", api._discCell("") === "—");
  check("discCell ≤2 → inline list", /Math, English/.test(api._discCell("Math, English")));
  const many = api._discCell("A, B, C, D");
  check("discCell >2 → 'N disciplines' chip", /4 disciplines/.test(many));
  check("discCell keeps the full list in the title", many.indexOf('title="A, B, C, D"') >= 0);
  check("discCell escapes the title (XSS)", api._discCell("<x>").indexOf("&lt;x&gt;") >= 0);
  const roster = api._rosterHtml([{ first_name: "Ada", last_name: "L", email: "a@b.edu",
    role_name: "Faculty", username: "ada", user_status: "Active",
    disciplines: "Math, English, History", last_updated_on: "2026-06-15" }]);
  check("rosterHtml header has Status/Disciplines/Last updated",
    /Status<\/th>/.test(roster) && /Disciplines<\/th>/.test(roster) && /Last updated<\/th>/.test(roster));
  check("rosterHtml row shows the Active badge", /mapu-st-active/.test(roster));
  check("rosterHtml row shows the last-updated date", roster.indexOf("2026-06-15") >= 0);
  check("rosterHtml row collapses 3 disciplines to a chip", /3 disciplines/.test(roster));
})();

// Session 88 — the public summary shows '(N active)' from active_count.
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  api._state.summary = [
    { college: "Foothill", user_count: 12, active_count: 9, role_mix: { Faculty: 12 }, last_synced: "2026-06-30T18:55:30Z" },
    { college: "De Anza", user_count: 3, active_count: 0, role_mix: { Ambassador: 3 }, last_synced: "2026-06-30T18:55:30Z" },
  ];
  api._state.loading = false; api._state.error = null;
  const root = w.document.getElementById("map-users-root");
  api.render(root);
  const html = root.innerHTML;
  check("render: shows '(9 active)' when active_count>0", html.indexOf("(9 active)") >= 0);
  check("render: omits '(0 active)' (pre-sync / all-inactive)", html.indexOf("(0 active)") < 0);
})();

// render: stat boxes + table + XSS-escape of a college name
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  api._state.summary = [
    { college: 'Foothill <script>', user_count: 12, role_mix: { Faculty: 12 }, last_synced: "2026-06-30T18:55:30Z" },
    { college: "De Anza", user_count: 3, role_mix: { Ambassador: 3 }, last_synced: "2026-06-30T18:55:30Z" },
  ];
  api._state.loading = false; api._state.error = null;
  const root = w.document.getElementById("map-users-root");
  api.render(root);
  const html = root.innerHTML;
  check("render: headline shows total users (15)", html.indexOf(">15<") >= 0 || html.indexOf("15</div>") >= 0);
  check("render: a table row per college", (html.match(/mapu-rosterbtn/g) || []).length === 2);
  check("render: XSS — college name escaped, no live <script> element",
    root.getElementsByTagName("script").length === 0 && html.indexOf("Foothill &lt;script&gt;") >= 0);
  // filter narrows to one
  api._state.q = "anza";
  api.render(root);
  check("render: filter narrows to 1 college", (root.innerHTML.match(/mapu-rosterbtn/g) || []).length === 1);
})();

// filteredSorted: default = most users first
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  api._state.summary = [{ college: "A", user_count: 1 }, { college: "B", user_count: 9 }];
  api._state.q = ""; api._state.sort = "users";
  const r = api._filteredSorted();
  check("filteredSorted: most users first", r[0].college === "B");
  api._state.sort = "college";
  check("filteredSorted: A–Z sort", api._filteredSorted()[0].college === "A");
})();

// nudge: roster filter (incl. CEO) + recipients + mailto building from PICKS
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  const c = {
    primary_contact: "Pat Lee", primary_contact_email: "pat@x.edu",
    vpaa: "Sam VP", vpaa_email: "vpaa@x.edu",
    vpss: "Jo VP", vpss_email: "not-an-email", // dropped (no @)
    ceo: "Dr. Prez", ceo_email: "ceo@x.edu",
  };
  // CEO is one of the nudge roles
  check("nudge roles include CEO", api._nudgeRoles.some(function (r) { return r.key === "ceo"; }));
  const roster = api._nudgeRoster(c);
  check("nudge roster: keeps only valid emails (drops the no-@ VPSS)",
    roster.length === 3 && !roster.some(function (x) { return x.email === "not-an-email"; }));
  check("nudge roster: includes the CEO row with name + email",
    roster.some(function (x) { return x.key === "ceo" && x.name === "Dr. Prez" && x.email === "ceo@x.edu"; }));
  check("nudge roster: each entry carries a human label",
    roster.every(function (x) { return typeof x.label === "string" && x.label.length > 0; }));
  const recips = api._nudgeRecipients(c);
  check("nudge recipients: keeps only valid emails", recips.length === 3 && recips.indexOf("pat@x.edu") >= 0 && recips.indexOf("not-an-email") < 0);
  // buildNudgeMailto now takes the PICKS the user chose (a subset of the roster)
  const mailto = api._buildNudgeMailto("Foothill College", roster);
  check("nudge mailto: starts with mailto:", mailto.indexOf("mailto:") === 0);
  check("nudge mailto: addresses the valid emails", decodeURIComponent(mailto).indexOf("pat@x.edu") >= 0 && decodeURIComponent(mailto).indexOf("ceo@x.edu") >= 0);
  check("nudge mailto: subject names the college", decodeURIComponent(mailto).indexOf("Foothill College") >= 0);
  // unchecking is just a shorter picks array
  const onlyCeo = roster.filter(function (x) { return x.key === "ceo"; });
  const mailto2 = decodeURIComponent(api._buildNudgeMailto("X", onlyCeo));
  check("nudge mailto: unchecked recipients are excluded",
    mailto2.indexOf("ceo@x.edu") >= 0 && mailto2.indexOf("pat@x.edu") < 0);
  check("nudge mailto: no picks → still a valid mailto (blank To)",
    api._buildNudgeMailto("X", null).indexOf("mailto:") === 0 && api._buildNudgeMailto("X", []).indexOf("mailto:") === 0);
  // the MAP dashboard deep-link (3rd arg) lands in the email body when present
  const mailtoUrl = decodeURIComponent(api._buildNudgeMailto("X", roster, "https://map.example/college/abc"));
  check("nudge mailto: includes the MAP dashboard URL when supplied", mailtoUrl.indexOf("https://map.example/college/abc") >= 0);
  // "No URL at all" was the original assertion, but the body now always carries
  // the CPL Initiative help link (Session 120 boilerplate). What must still be
  // absent is the per-college DEEP LINK when we don't have one.
  check("nudge mailto: omits the college deep-link line when not supplied",
    !/Open your MAP CPL Dashboard/.test(decodeURIComponent(api._buildNudgeMailto("X", roster))));
  // the college's user roster (4th arg) lands in the body, sorted by role then last name
  const userRoster = [
    { first_name: "Zoe", last_name: "Young", role_name: "Faculty Reviewer", email: "zoe@x.edu" },
    { first_name: "Al", last_name: "Adams", role_name: "Ambassador", email: "al@x.edu" },
  ];
  const withRoster = decodeURIComponent(api._buildNudgeMailto("X", roster, "", userRoster));
  check("nudge mailto: roster block lists the college's users", withRoster.indexOf("Zoe Young") >= 0 && withRoster.indexOf("Al Adams") >= 0);
  check("nudge mailto: roster header carries the count (2)", /current MAP CPL users \(2\)/.test(withRoster));
  check("nudge mailto: roster sorted by role (Ambassador before Faculty)", withRoster.indexOf("Al Adams") < withRoster.indexOf("Zoe Young"));
  check("nudge mailto: roster omitted when not supplied / empty",
    decodeURIComponent(api._buildNudgeMailto("X", roster)).indexOf("current MAP CPL users") < 0 &&
    decodeURIComponent(api._buildNudgeMailto("X", roster, "", [])).indexOf("current MAP CPL users") < 0);
})();

// rosterEmailBlock: name/role/email line per user; empty → ""
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_USERS_TAB;
  check("rosterEmailBlock empty → empty string", api._rosterEmailBlock([]) === "" && api._rosterEmailBlock(null) === "");
  const block = api._rosterEmailBlock([{ first_name: "Ada", last_name: "Lovelace", role_name: "Faculty", email: "ada@x.edu" }]);
  check("rosterEmailBlock: one line per user with name/role/email",
    block.indexOf("Ada Lovelace") >= 0 && block.indexOf("Faculty") >= 0 && block.indexOf("ada@x.edu") >= 0);
})();

// nudge picker: showNudgePicker renders all recipients CHECKED with a confirm action
(function () {
  const w = makeWin({ teamPass: "p" });
  const api = w.CPL_MAP_USERS_TAB;
  const roster = [
    { key: "primary_contact", label: "Primary Contact", name: "Pat", email: "pat@x.edu" },
    { key: "ceo", label: "CEO / President", name: "Prez", email: "ceo@x.edu" },
  ];
  const userRoster = [
    { first_name: "Ada", last_name: "Lovelace", role_name: "Faculty", email: "ada@x.edu" },
    { first_name: "Bo", last_name: "Bell", role_name: "Ambassador", email: "bo@x.edu" },
  ];
  api._showNudgePicker("Foothill College", roster, "https://map.example/foothill", userRoster);
  const ov = w.document.getElementById("mapu-picker");
  check("nudge picker: a dialog overlay is mounted", !!ov);
  const boxes = ov.querySelectorAll("[data-pick]");
  check("nudge picker: a checkbox per recipient", boxes.length === 2);
  check("nudge picker: all recipients start checked", Array.prototype.every.call(boxes, function (b) { return b.checked; }));
  check("nudge picker: has an open-draft + cancel action", !!ov.querySelector("[data-pick-go]") && !!ov.querySelector("[data-pick-cancel]"));
  check("nudge picker: recipient name/email shown + escaped", ov.innerHTML.indexOf("pat@x.edu") >= 0);
  check("nudge picker: shows the MAP dashboard link when on file",
    ov.innerHTML.indexOf("https://map.example/foothill") >= 0 && /MAP CPL Dashboard/.test(ov.innerHTML));
  // user-roster checklist: a Check-All master + a checkbox per user, all checked
  const allBox = ov.querySelector("[data-roster-all]");
  const userBoxes = ov.querySelectorAll("[data-roster-user]");
  check("nudge picker: Check-All master present + checked", !!allBox && allBox.checked);
  check("nudge picker: a checkbox per roster user, all checked", userBoxes.length === 2 && Array.prototype.every.call(userBoxes, function (b) { return b.checked; }));
  check("nudge picker: roster header shows the user count (2)", /Include our user roster \(2\)/.test(ov.innerHTML));
  check("nudge picker: roster lists each user", ov.innerHTML.indexOf("Ada Lovelace") >= 0 && ov.innerHTML.indexOf("Bo Bell") >= 0);
  // Check-All unchecks every user
  allBox.checked = false; allBox.dispatchEvent(new w.Event("change"));
  check("nudge picker: Check-All off → all roster users unchecked", Array.prototype.every.call(userBoxes, function (b) { return !b.checked; }));
  // unchecking one user flips the master off
  allBox.checked = true; allBox.dispatchEvent(new w.Event("change"));
  userBoxes[0].checked = false; userBoxes[0].dispatchEvent(new w.Event("change"));
  check("nudge picker: unchecking a user un-checks the master", !allBox.checked);
  // cancel removes it
  ov.querySelector("[data-pick-cancel]").click();
  check("nudge picker: cancel closes the dialog", !w.document.getElementById("mapu-picker"));
})();

// render: a college that was nudged shows a "last nudged" line (signed-in)
(function () {
  const w = makeWin({ teamPass: "p" });
  const api = w.CPL_MAP_USERS_TAB;
  api._state.summary = [{ college: "A", user_count: 1, role_mix: { Faculty: 1 } }];
  api._state.nudges = { A: { last_nudged_at: "2026-06-30T12:00:00Z", last_nudged_by: "rev@x.edu" } };
  const root = w.document.getElementById("map-users-root");
  api.render(root);
  check("render: last-nudged line shown for a nudged college",
    /last nudged 2026-06-30/.test(root.innerHTML) && root.innerHTML.indexOf("rev@x.edu") >= 0);
})();

// render: the 📣 nudge button shows ONLY when signed in
(function () {
  const logged = makeWin({ teamPass: "p" });
  logged.CPL_MAP_USERS_TAB._state.summary = [{ college: "A", user_count: 1, role_mix: { Faculty: 1 } }];
  const r1 = logged.document.getElementById("map-users-root");
  logged.CPL_MAP_USERS_TAB.render(r1);
  check("render: nudge button present when signed in", /data-nudge="A"/.test(r1.innerHTML));

  const out = makeWin();
  out.CPL_MAP_USERS_TAB._state.summary = [{ college: "A", user_count: 1, role_mix: { Faculty: 1 } }];
  const r2 = out.document.getElementById("map-users-root");
  out.CPL_MAP_USERS_TAB.render(r2);
  check("render: no nudge button when logged out", !/data-nudge=/.test(r2.innerHTML));
})();

// ── Session 120: the student-contact worklist ──
// The failure this guards: proposing a contact the college did NOT designate.
// Local governance means the cascade may only ever surface the college's own
// people; anything else has to be an ASK. A regression here is not cosmetic —
// it would put words in a college's mouth in an email we send on their behalf.
(function () {
  const GAPS = [
    // proposable, from the college's own CPL Coordinator designation
    { college: "Alpha College", college_kind: "college", has_student_contact: false,
      proposed_source: "CPL Coordinator", proposed_name: "Pat Vega",
      proposed_email: "pat@alpha.edu", needs_ask: false, ask_reason: null,
      landing_page_url: "https://map.example/alpha", active_users: 4 },
    // CPL Assistant rung — MAP has no name column for it, so name is null
    { college: "Beta College", college_kind: "college", has_student_contact: false,
      proposed_source: "CPL Assistant", proposed_name: null,
      proposed_email: "asst@beta.edu", needs_ask: false, ask_reason: null,
      landing_page_url: null, active_users: 2 },
    // leadership-only → must be ASKED, never defaulted to the VP
    { college: "Gamma College", college_kind: "college", has_student_contact: false,
      proposed_source: null, proposed_name: null, proposed_email: null,
      needs_ask: true, ask_reason: "leadership only",
      landing_page_url: "https://map.example/gamma", active_users: 3 },
    // already fine — must NOT appear on the worklist
    { college: "Delta College", college_kind: "college", has_student_contact: true,
      proposed_source: null, proposed_email: null, needs_ask: false },
    // sandbox entry — must NOT appear on a list a human is going to work
    { college: "Testing College", college_kind: "test", has_student_contact: false,
      proposed_source: "CPL Coordinator", proposed_name: "Nobody",
      proposed_email: "x@test.edu", needs_ask: false },
  ];
  const w = makeWin({ teamPass: "p" });
  const T = w.CPL_MAP_USERS_TAB;
  T._state.gaps = GAPS;

  const rows = T._gapRows();
  check("gaps: only colleges MISSING a contact are listed",
    rows.every((g) => g.has_student_contact === false));
  check("gaps: colleges that already have a contact are excluded",
    !rows.some((g) => g.college === "Delta College"));
  check("gaps: sandbox/test entries excluded from the worklist",
    !rows.some((g) => g.college_kind === "test"));
  check("gaps: the three real gap colleges are listed", rows.length === 3);

  const html = T._gapsHtml();
  check("gaps html: proposal shows the person AND why they were picked",
    /Pat Vega/.test(html) && /CPL Coordinator/.test(html));
  check("gaps html: CPL Assistant rung renders without a name",
    /asst@beta\.edu/.test(html));
  check("gaps html: leadership-only college is in the ASK section, not proposed",
    /Must be asked/.test(html) && /leadership only/.test(html));
  // The leadership-only college must carry NO proposed address anywhere — the
  // prose does mention vice presidents (explaining why we won't default to one),
  // so assert on the absence of a routable proposal, not on the word.
  check("gaps html: the leadership-only college gets no proposed address",
    /Gamma College/.test(html) && !/@gamma\.edu/.test(html));
  check("gaps html: says the proposal comes from the college's own designation",
    /already designated in MAP/.test(html));
  check("gaps html: states MAP has no write API (nothing here edits MAP)",
    /no write API/i.test(html));

  // The email is the artifact that actually reaches a college — check its claims.
  const gap = GAPS[0];
  const mail = decodeURIComponent(
    T._buildContactMailto(gap, [{ label: "VPAA", name: "Dana Kim", email: "vpaa@alpha.edu" }],
      "https://map.example/alpha"));
  check("contact email: names the proposed person + their MAP role",
    /Pat Vega/.test(mail) && /CPL Coordinator/.test(mail));
  check("contact email: says we are NOT choosing someone new",
    /not choosing someone new/i.test(mail));
  check("contact email: says the choice is the college's",
    /your call|entirely your/i.test(mail));
  check("contact email: explains the student-facing consequence",
    /does not reach anyone/i.test(mail));
  check("contact email: carries the MAP team help contact",
    /MAP@rccd\.edu/.test(mail));
  check("contact email: semicolon-delimited recipients (Outlook rejects commas)",
    !/^mailto:[^?]*,/.test(T._buildContactMailto(gap,
      [{ label: "A", name: "", email: "a@x.edu" }, { label: "B", name: "", email: "b@x.edu" }], "")));

  // The ask variant must not invent a person.
  const askMail = decodeURIComponent(T._buildContactMailto(GAPS[2], [], "https://map.example/gamma"));
  check("ask email: asks for a name instead of proposing one",
    /Please reply with the name/.test(askMail) && !/WHAT WE PROPOSE/.test(askMail));

  // Fallbacks must never masquerade as a MAP designation, and must always show
  // WHERE they came from — a curator's name, or the page. Displaying the address
  // without its provenance is the failure mode worth a test.
  const FB = T._FALLBACK_CONTACTS;
  const keys = Object.keys(FB);
  check("fallbacks: every entry declares a provenance",
    keys.every((k) => FB[k].via === "curator" || FB[k].via === "web"));
  check("fallbacks: every web-sourced entry carries a source URL",
    keys.filter((k) => FB[k].via === "web").every((k) => /^https:\/\//.test(FB[k].source)));
  check("fallbacks: every curator entry records who supplied it",
    keys.filter((k) => FB[k].via === "curator").every((k) => !!FB[k].by));
  check("fallbacks: every listed contact has a real address",
    keys.every((k) => (FB[k].contacts || []).every((c) => /.+@.+\..+/.test(c.email))));
  check("fallbacks: no mental-health/wellness inbox used as a CPL contact",
    keys.every((k) => (FB[k].contacts || []).every(
      (c) => !/bewell|be-well|wellness|mentalhealth/i.test(c.email))));
  // SOURCING RULE — Jessica (MAP team), 2026-08-05. This supersedes the stricter
  // "department inboxes only" rule I set for myself: she is the domain expert and
  // the distinction she drew is sharper. A named INDIVIDUAL is fine when they are
  // *the* designated contact on the counseling page; what's forbidden is picking
  // one name off a list of all counselors (those stay blank), and an inbox for a
  // different department is fine when the counseling page directs you there.
  //
  // The enforceable proxy: anything that isn't an obvious department inbox must
  // carry a `note` saying why it's there. That's what stops a future contributor
  // quietly pasting in a counselor's address.
  check("fallbacks: a non-department address is justified in a note",
    keys.filter((k) => FB[k].via === "web").every((k) =>
      (FB[k].contacts || []).every((c) => {
        const local = c.email.split("@")[0].toLowerCase();
        // "couns" not "counsel" — real inboxes abbreviate (SWCCounsCenter@swccd.edu)
        const isDeptInbox = /couns|advis|success|student|welcome|preguntas|admissions|records/.test(local);
        return isDeptInbox || !!FB[k].note;
      })));
  check("fallbacks: colleges that publish only a counselor LIST are left blank",
    (FB["Coalinga College"].contacts || []).length === 0
      && (FB["Laney College"].contacts || []).length === 0);
  check("fallbacks: a college may carry more than one contact",
    (FB["Gavilan College"].contacts || []).length === 2);

  const curCell = T._fallbackCell("Gavilan College");
  check("fallback cell: curator-supplied shows who gave it", /from Jessica/.test(curCell));
  check("fallback cell: a curator who cited a source shows BOTH",
    /from Jessica/.test(curCell) && /their source/.test(curCell)
      && /counseling_team\.php/.test(curCell));
  check("fallback cell: curator-supplied says it is NOT a MAP designation",
    /not a MAP designation/.test(curCell));
  check("fallback cell: renders both Gavilan contacts",
    /jterry@gavilan\.edu/.test(curCell) && /dstuckey@gavilan\.edu/.test(curCell));
  const webCell = T._fallbackCell("Hartnell College");
  check("fallback cell: web-sourced links its source and says to verify",
    /from their website/.test(webCell) && /verify before use/.test(webCell));
  check("fallback cell: unknown college is honest about not being looked up",
    /not looked up/.test(T._fallbackCell("Nowhere College")));

  const csv = T._gapsCsv();
  check("gaps csv: header + one line per real gap college", csv.split("\n").length === 4);
  check("gaps csv: quotes are escaped", /^"College"/.test(csv));
})();

// The contact DIRECTORY lens (Jessica's ask). Built as a live lens rather than a
// handed-over spreadsheet, because an export is a photograph that starts aging
// the moment it's sent. Guards the properties a person working from it depends on:
// a blank must mean "MAP holds nothing", never "we silently dropped it", and the
// export must carry the provenance of the web-sourced column.
(function () {
  const w = makeWin({ teamPass: "p" });
  const T = w.CPL_MAP_USERS_TAB;
  T._state.gaps = [
    { college: "Zeta College", college_kind: "college", has_student_contact: true,
      primary_contact: "Ada Reyes", primary_contact_email: "ada@zeta.edu",
      cpl_assistant_email: "cplasst@zeta.edu" },
    { college: "Alpha College", college_kind: "college", has_student_contact: false,
      primary_contact: null, primary_contact_email: null, cpl_assistant_email: null },
    { college: "Hartnell College", college_kind: "college", has_student_contact: false,
      primary_contact: null, primary_contact_email: null, cpl_assistant_email: null },
    { college: "Testing College", college_kind: "test", has_student_contact: false,
      primary_contact: "X", primary_contact_email: "x@t.edu", cpl_assistant_email: null },
  ];

  const rows = T._contactRows();
  check("directory: sandbox entries excluded", !rows.some((r) => r.college_kind === "test"));
  check("directory: sorted A–Z so a human can find a college",
    rows[0].college === "Alpha College" && rows[rows.length - 1].college === "Zeta College");
  check("directory: includes colleges that already HAVE contacts (it's a directory, not a gap list)",
    rows.some((r) => r.college === "Zeta College"));

  const html = T._contactsHtml();
  check("directory: renders all five columns", /Primary contact<\/th>/.test(html)
    && /Primary contact email<\/th>/.test(html) && /CPL Assistant email<\/th>/.test(html)
    && /Counseling email/.test(html));
  check("directory: a populated college shows its values",
    /Ada Reyes/.test(html) && /cplasst@zeta\.edu/.test(html));
  check("directory: says plainly that blank means MAP has nothing on file",
    /Blank means MAP has nothing on file/.test(html));
  check("directory: web-sourced counseling email carries its source link",
    /Counseling@Hartnell\.edu/.test(html) && /hartnell\.edu/.test(html));
  check("directory: offers the export", /data-dir-csv/.test(html));

  const csv = T._contactsCsv();
  const lines = csv.split("\r\n");
  check("csv: one header + one row per real college", lines.length === 4);
  check("csv: starts with a BOM so Excel reads accented college names correctly",
    csv.charCodeAt(0) === 0xfeff);
  check("csv: header names Jessica's columns in order",
    /"College","Primary contact name","Primary contact email","CPL Assistant email","CPL contact title","CPL contact name","CPL contact email","CPL webpage URL"/.test(csv)
      && /"Counseling email"/.test(csv));
  check("csv: carries the counseling source URL, so a reader can verify it",
    /hartnell\.edu\/support\/counseling/.test(csv));
  check("csv: labels whether a counseling email came from the team or a website",
    /college website/.test(csv));
  check("csv: an empty MAP field exports as empty, never as a placeholder",
    /"Alpha College","","",""/.test(csv));
})();

// Disciplines are PIPE-delimited in MAP, not comma-delimited (Session 120). The
// old comma-only split turned a 150-code value into one enormous table cell.
(function () {
  const w = makeWin({ teamPass: "p" });
  const d = w.CPL_MAP_USERS_TAB._discCell("MATH | ENGL | BIOL | CHEM");
  check("discCell: splits MAP's pipe-delimited disciplines", /4 disciplines/.test(d));
  check("discCell: full list kept in the title attribute", /MATH, ENGL, BIOL, CHEM/.test(d));
  check("discCell: still handles comma-delimited values",
    /3 disciplines/.test(w.CPL_MAP_USERS_TAB._discCell("A,B,C")));
  check("discCell: empty → em dash", w.CPL_MAP_USERS_TAB._discCell("") === "—");
})();

// The lens is reviewer-only — its data source is gated, so a logged-out visitor
// must not even be offered it.
(function () {
  const out = makeWin();
  out.CPL_MAP_USERS_TAB._state.summary = [{ college: "A", user_count: 1, role_mix: { Faculty: 1 } }];
  const r = out.document.getElementById("map-users-root");
  out.CPL_MAP_USERS_TAB.render(r);
  check("lens: hidden when logged out", !/data-lens=/.test(r.innerHTML));

  const inn = makeWin({ teamPass: "p" });
  inn.CPL_MAP_USERS_TAB._state.summary = [{ college: "A", user_count: 1, role_mix: { Faculty: 1 } }];
  const r2 = inn.document.getElementById("map-users-root");
  inn.CPL_MAP_USERS_TAB.render(r2);
  check("lens: offered when signed in", /data-lens="gaps"/.test(r2.innerHTML));
})();

// The CPL-page column must never cite one of OUR OWN MAP landing pages as the
// college's published CPL page. A web search for "<college> credit for prior
// learning" surfaces them near the top, so this is a live hazard, not theory.
(function () {
  const w = makeWin({ teamPass: "p" });
  const P = w.CPL_MAP_USERS_TAB._CPL_PAGES;
  const urls = Object.keys(P).map((k) => P[k].url).filter(Boolean);
  check("cpl page: never cites our own MAP landing pages as a college's CPL page",
    urls.every((u) => !/cpldashboardcccco\.azurewebsites\.net|cpl-landing-pages/.test(u)));
  check("cpl page: every entry records what kind of page was found",
    Object.keys(P).every((k) => P[k].kind === null || ["site", "catalog", "military"].indexOf(P[k].kind) >= 0));
  check("cpl page: an entry with no page found says so, rather than rendering blank",
    /no CPL page found/.test(w.CPL_MAP_USERS_TAB._cplPageCell("Allan Hancock College")));
  check("cpl page: a page whose contact could not be read says 'page, no contact'",
    /page, no contact/.test(w.CPL_MAP_USERS_TAB._cplPageCell("Chaffey College")));
  check("cpl page: an unchecked college is honest about being unchecked",
    /not looked up/.test(w.CPL_MAP_USERS_TAB._cplPageCell("Nowhere College")));
})();

// The ASCCC CPL Liaison column. Distinct from the CPL-page contact: the Senate
// asks each college to name a liaison, so where one exists it is a statewide
// designation rather than whatever is printed on a college webpage.
(function () {
  const w = makeWin({ teamPass: "p" });
  const T = w.CPL_MAP_USERS_TAB;
  const L = T._CPL_LIAISONS;
  check("liaison: every entry cites its ASCCC source",
    Object.keys(L).every((k) => /^https:\/\/(www\.)?asccc\.org/.test(L[k].source)));
  check("liaison: every person has a name", 
    Object.keys(L).every((k) => (L[k].people || []).every((p) => !!p.name)));
  check("liaison: a college can carry more than one",
    (L["Chaffey College"].people || []).length === 2);
  const cell = T._cplLiaisonCell("Chaffey College");
  check("liaison cell: shows both people and the ASCCC link",
    /Stephen Lux/.test(cell) && /Jin Liu/.test(cell) && /ASCCC/.test(cell));
  // asccc.org 403s automated fetches, so an empty cell means "not surfaced by a
  // search", NOT "this college has no liaison". Saying "none" would misrepresent
  // the Academic Senate.
  check("liaison cell: an unknown college says 'none surfaced', not 'none'",
    /none surfaced/.test(T._cplLiaisonCell("Nowhere College")));
})();

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
