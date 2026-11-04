// MAP Users: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's three lenses (All colleges, No student contact, Contact directory) open from
// #map-users/<all|gaps|contacts>, and the tab reports the lens on screen.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #map-users/gaps opens the student-contact worklist for a signed-in reader, reads it, and reports it;
//   (2) switching to All colleges reports the bare tab, though the address still says gaps;
//   (3) a later visit by an address opens its lens (the shell fires onActivate once; the module listens itself);
//   (4) a bare #map-users opens All colleges; an unknown word leaves it; a signed-out reader keeps the roster,
//       since both worklist lenses are built from gated contact rows.
//
// Run from repo root: `npm test` (or `node tests/map_users_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("map_users.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

const SUMMARY = [{ college: "Alpha College", user_count: 3, last_synced: "2026-11-01", roles: {} }];
const GAPS = [{ college: "Alpha College", college_kind: "college", primary_contact_email: null, has_student_contact: false }];

async function bootAt(hash, signedIn) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='map-users-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  if (signedIn !== false) local.cpl_team_pass = "team-secret";
  w.__fetched = [];
  w.fetch = (url) => {
    const u = String(url); w.__fetched.push(u);
    const body = /map_users_summary/.test(u) ? SUMMARY : /map_contact_gaps/.test(u) ? GAPS : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.eval(SRC);
  w.CPL_MAP_USERS_TAB.activate();
  await tick();
  const doc = w.document;
  const stash = () => { w.CPL_SESSION.stashReturnTab("map-users"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const lit = () => { const b = doc.querySelector(".mapu-lensbtn.on"); return b ? b.getAttribute("data-lens") : null; };
  const lens = (k) => doc.querySelector('[data-lens="' + k + '"]');
  return { w, doc, stash, lit, lens };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  {
    const a = await bootAt("#map-users/gaps");
    check("(1) ⭐ #map-users/gaps opens the No student contact lens", a.lit() === "gaps" && !!a.doc.querySelector("[data-gap-csv]"), a.lit());
    check("(1) it read the worklist", a.w.__fetched.some((u) => /map_contact_gaps/.test(u)));
    check("(1) and reports it", a.stash() === "map-users/gaps", a.stash());
    click(a.w, a.lens("all"));
    await tick();
    check("(2) All colleges reports the bare tab (the address still says gaps)",
      a.lit() === "all" && a.stash() === "map-users" && a.w.location.hash === "#map-users/gaps", a.stash() + " " + a.w.location.hash);
    click(a.w, a.lens("contacts"));
    await tick();
    check("(2) the Contact directory reports map-users/contacts", a.lit() === "contacts" && a.stash() === "map-users/contacts", a.stash());
    // (3) a later visit
    a.w.location.hash = "#map-users/gaps";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "map-users" } }));
    await tick();
    check("(3) a later visit by an address opens its lens", a.lit() === "gaps" && a.stash() === "map-users/gaps", a.lit());
    a.w.location.hash = "#map-users";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "map-users" } }));
    await tick();
    check("(3) a later visit on the bare tab leaves the lens the reader chose", a.lit() === "gaps", a.lit());
  }
  {
    const b = await bootAt("#map-users/contacts");
    check("(1) #map-users/contacts opens the Contact directory", b.lit() === "contacts" && !!b.doc.querySelector("[data-dir-csv]"), b.lit());
    check("(1) and reports it", b.stash() === "map-users/contacts", b.stash());
  }
  {
    const c = await bootAt("#map-users");
    check("(4) a bare #map-users opens All colleges", c.lit() === "all" && c.stash() === "map-users" &&
      !c.w.__fetched.some((u) => /map_contact_gaps/.test(u)), c.lit());
    const d = await bootAt("#map-users/elsewhere");
    check("(4) an unknown word leaves All colleges", d.lit() === "all" && d.stash() === "map-users", d.lit());
    const e = await bootAt("#map-users/gaps", false);
    check("(4) a signed-out reader keeps the roster", !e.doc.querySelector(".mapu-lensbtn") && e.stash() === "map-users" &&
      !e.w.__fetched.some((u) => /map_contact_gaps/.test(u)), e.stash());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
