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
  check("nudge mailto: omits the URL line when not supplied",
    decodeURIComponent(api._buildNudgeMailto("X", roster)).indexOf("http") < 0);
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

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
