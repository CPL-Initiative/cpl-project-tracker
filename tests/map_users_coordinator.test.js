// MAP Users tab: the CPL Coordinator and NC CPL Lead columns (Sam, 2026-10-24).
//
// Sam: "add the CPL Coordinator to the MAP Users tab (noting that the role is
// pulled from the landing pages rather than MAP Users) and add a placeholder for
// the NC CPL Lead that we will be able to count when the option is added to the
// Landing Pages."
//
// Guards:
//  (a) the coordinator comes from map_coordinator_summary() (the landing pages,
//      the same booleans the funding model's first minimum condition reads),
//      never from the MAP user role mix;
//  (b) each college reads Listed / Not listed / No landing page, in words, and the
//      stat box counts the table's colleges;
//  (c) the NC CPL Lead reads TBA in every cell and the total until the RPC carries
//      `has_nc_cpl_lead`, and counts the day it does;
//  (d) before the RPC answers, both columns read TBA (the counts never wait on it);
//  (e) a college spelled differently on the landing-page row still matches.
//
// Run from repo root: `npm test` (or `node tests/map_users_coordinator.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("map_users.js", "utf8");

function makeWin(coordRows) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.__urls = [];
  w.fetch = function (url) {
    w.__urls.push(String(url));
    const body = /map_coordinator_summary/.test(url) ? coordRows : [];
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(body); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}
const SUMMARY = [
  { college: "Alpha College", user_count: 12, active_count: 10, role_mix: { Ambassador: 3, Faculty: 9 } },
  { college: "Beta College", user_count: 5, active_count: 5, role_mix: { Ambassador: 5 } },
  { college: "Gamma College", user_count: 2, active_count: 1, role_mix: { Counselor: 2 } },
];
// Beta's landing-page row is spelled with a trailing space and other case: (e).
const COORD = [
  { college: "Alpha College", has_coordinator: true, has_primary_contact: true, has_landing_page: true },
  { college: "beta college ", has_coordinator: false, has_primary_contact: true, has_landing_page: true },
];
function rowsOf(w) {
  return Array.from(w.document.querySelectorAll(".mapu-table tbody tr")).map(function (tr) {
    return Array.from(tr.querySelectorAll("td")).map(function (td) { return td.textContent.trim(); });
  });
}
function statOf(w, label) {
  const box = Array.from(w.document.querySelectorAll(".mapu-stat .box")).find(function (b) {
    return b.querySelector(".l").textContent === label;
  });
  return box ? box.querySelector(".n").textContent : null;
}

(async function () {
  // (d) before the RPC answers
  {
    const w = makeWin(COORD);
    const api = w.CPL_MAP_USERS_TAB;
    api._state.summary = SUMMARY;
    const root = w.document.getElementById("map-users-root");
    api.render(root);
    const heads = Array.from(w.document.querySelectorAll(".mapu-table th")).map(function (th) { return th.textContent; });
    check("(a) the table carries CPL Coordinator and NC CPL Lead columns, every header scoped",
      heads.indexOf("CPL Coordinator") > 0 && heads.indexOf("NC CPL Lead") > 0 &&
      Array.from(w.document.querySelectorAll(".mapu-table th")).every(function (th) { return th.getAttribute("scope") === "col"; }));
    const r = rowsOf(w);
    check("(d) before the landing pages answer, both columns read TBA and the counts still render",
      r.length === 3 && r.every(function (c) { return c[3] === "TBA" && c[4] === "TBA"; }) &&
      statOf(w, "CPL Coordinators on landing pages") === "TBA" && statOf(w, "MAP users") === "19");
    check("(a) the intro says the two come from the landing pages, not MAP user roles",
      /come from each college’s CPL landing page, not from these MAP user roles/.test(root.textContent));
  }
  // (a)(b)(c)(e) after the RPC answers, no NC CPL Lead option yet
  {
    const w = makeWin(COORD);
    const api = w.CPL_MAP_USERS_TAB;
    api._state.summary = SUMMARY;
    await api._loadCoordinators();
    const root = w.document.getElementById("map-users-root");
    api.render(root);
    check("(a) the coordinator is read from map_coordinator_summary()", w.__urls.some(function (u) { return /\/rpc\/map_coordinator_summary$/.test(u); }));
    const r = rowsOf(w);
    const by = {};
    r.forEach(function (c) { by[c[0]] = c; });
    check("(b) Alpha reads Listed, Beta Not listed (matched across spelling, (e)), Gamma No landing page",
      by["Alpha College"][3] === "Listed" && by["Beta College"][3] === "Not listed" && by["Gamma College"][3] === "No landing page");
    check("(b) the stat box counts the table's colleges with a coordinator listed",
      statOf(w, "CPL Coordinators on landing pages") === "1 of 3");
    check("(c) with no NC CPL Lead option on the landing pages, every cell and the total read TBA",
      r.every(function (c) { return c[4] === "TBA"; }) && statOf(w, "NC CPL Leads on landing pages") === "TBA");
    check("(a) the role mix stays MAP's own roles (no CPL Coordinator chip is invented)",
      !/CPL Coordinator \d/.test(Array.from(w.document.querySelectorAll(".mapu-roles")).map(function (d) { return d.textContent; }).join(" ")));
  }
  // (c) the day the landing pages carry the NC CPL Lead
  {
    const rows = COORD.map(function (r, i) { return Object.assign({}, r, { has_nc_cpl_lead: i === 1 }); });
    const w = makeWin(rows);
    const api = w.CPL_MAP_USERS_TAB;
    api._state.summary = SUMMARY;
    await api._loadCoordinators();
    api.render(w.document.getElementById("map-users-root"));
    const by = {};
    rowsOf(w).forEach(function (c) { by[c[0]] = c; });
    check("(c) once the RPC carries has_nc_cpl_lead, the column and the total count it",
      by["Beta College"][4] === "Listed" && by["Alpha College"][4] === "Not listed" &&
      statOf(w, "NC CPL Leads on landing pages") === "1 of 3");
  }

  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
