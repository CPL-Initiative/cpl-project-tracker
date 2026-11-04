// The Common CR Reference List's side panel (the List norms, The List is the workspace; Sam, 2026-11-03: "Let's plan to have
// a side bar open for list items to show all the details", and the Exhibits panel he approved on its mock). Guards:
//   (1) a wording's title opens the panel beside the table, its bar named and focused, in place of the title's drawer,
//       which moves inside;
//   (2) the panel: the wording, one line of what it is, and its group's wordings (the members the group folds), sortable,
//       this wording noted, another's name opening its panel;
//   (3) Confirm the group writes the group's decision row as the drawer does, answers in the panel's status line, and the
//       group's wordings join Changed this visit; a refused write says it did not save;
//   (4) the rest folded, staying open through a redraw;
//   (5) the engine documents the panel's shared parts (one renderer for every List's panel);
//   (6) the worklist's group edits live in the panel: Split out and Put back, Name the group by it, Add a wording from
//       another group (its own group keeps its row), the note saved with Defer, and Clear the decision; signed out,
//       nothing writes;
//   (7) the List is the tab's workspace: it opens first, a Progress count opens it on that filter (Folded by a rule, Held
//       by a screen, All), and the official-title warning rides in the panel.
// Run from repo root: `npm test` (or `node tests/cr_list_panel.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("cr_reference.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function member(rec, rows, colleges, extra) {
  return Object.assign({ rec: rec, topic: rec, rows: rows, screens: { level: false }, units_lo: 3, units_hi: 3, unit_word: "hour",
    credentials: [], credentials_n: 0, colleges_n: colleges, courses: [] }, extra || {});
}
const WORKLIST = { _stats: { distinct_strings: 5, total_rows: 900 }, groups: [
  { key: "community relations", canonical: "3 hours in Community Relations", canonical_source: "published_statewide", rung: 1,
    rung_why: "Published statewide recommendation", acts_automatically: true, screens_objecting: [], wordings: 2, rows: 415,
    credentials: 4, colleges: 28, courses: [], subjects: [], members: [
      member("3 hours in Community Relations", 293, 28, { credentials: ["POST Basic Academy"] }),
      member("3.0 hours in Community Relations", 122, 20)] },
  { key: "engine performance", canonical: "3 or 4 hours in Engine Performance", canonical_source: "published_statewide", rung: 5,
    rung_why: "", acts_automatically: false, screens_objecting: [], wordings: 2, rows: 66, credentials: 3, colleges: 15,
    courses: ["AUTO M1008"], subjects: [], members: [
      member("3 or 4 hours in Engine Performance", 38, 9, { courses: ["AUTO M1008"] }),
      member("5 hours in Engine Performance", 28, 8)] },
  { key: "welding", canonical: "4 hours in Welding", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 12, credentials: 1, colleges: 3, courses: [], subjects: [], members: [
      member("4 hours in Welding", 12, 3, { credentials: ["AWS Certified Welder"] })] }
] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
    { url: "https://example.org/#cr-reference/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.signedIn !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url, method: init.method || "GET", body: body });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/cr_reference_worklist.json") return ok(opts.worklist || WORKLIST);
    if (/\/kb_curation\?select/.test(url)) return opts.flagReadFails ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }) : ok(opts.flags || []);
    if (/\/kb_curation$/.test(url) && init.method === "POST") return ok(body.map((r) => Object.assign({}, r)));
    if (/cr_reference_decisions\?select/.test(url)) return ok(opts.decisions || []);
    if (/cr_reference_decisions/.test(url) && init.method === "POST") return ok(opts.refuse ? [] : body.map((r) => Object.assign({}, r)));
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(opts.reviewer === false ? null : { access_token: "a.b.c", email: "sam@example.org" }) };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push({ url: "loadScript:" + s, method: "SCRIPT" });
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.eval(SRC);
  return { w: w, d: w.document, M: w.CPL_CR_REFERENCE, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".crl-table tbody tr:not(.crl-editrow):not(.crl-band)")); }
/* A filter word carries its count, "Decided (2)"; a word is found by its label either way. */
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function posts(t) { return t.calls.filter((c) => c.method === "POST"); }

(async function () {
  check("(5) the engine documents the panel's shared parts", /h\.title\(text\), h\.meta\(parts\)/.test(LIST_SRC) && /h\.table\(o\)/.test(LIST_SRC) && /h\.fold\(id, summary, kids\)/.test(LIST_SRC));
  check("(5) the panel's shared CSS names no raw hex", !/#[0-9a-fA-F]{3,8}\b/.test(LIST_SRC.slice(LIST_SRC.indexOf('"pn-h{'), LIST_SRC.indexOf('"pn-fbody p{'))));
  let t = tab();
  t.M.activate(); await settle();
  const title = (d, w) => Array.from(d.querySelectorAll(".crl-table tbody td.crl-title button.crl-open")).find((b) => txt(b) === w);
  const pn = (d) => d.getElementById("crl-panel");
  const comm = title(t.d, "3 hours in Community Relations");
  check("(1) a wording's title is the panel's control", !!comm && comm.getAttribute("aria-controls") === "crl-panel" && /open its panel$/.test(comm.getAttribute("aria-label")),
    comm && comm.outerHTML);
  comm.click(); await settle();
  let p = pn(t.d);
  check("(1) it opens the panel beside the table, its bar named and focused", !!p && p.tagName === "ASIDE"
    && txt(t.d.getElementById("crl-panel-t")) === "Wording: 3 hours in Community Relations" && t.d.activeElement === t.d.getElementById("crl-panel-t"));
  check("(1) the title's drawer moves inside the panel", /293 articulations at 28 colleges/.test(txt(p)) && /Articulated under:\s*POST Basic Academy/.test(txt(p)), txt(p));
  check("(2) the wording and one line of what it is", txt(p.querySelector(".crl-pn-h")) === "3 hours in Community Relations"
    && txt(p.querySelector(".crl-pn-meta")) === "293 articulations · 28 colleges · 3 units · Reference: 3 hours in Community Relations · No decision yet · Rung: Published",
    txt(p.querySelector(".crl-pn-meta")));
  const mem = () => Array.from(pn(t.d).querySelectorAll("#crl-pn-members tbody tr")).map((r) => Array.from(r.children).map(txt).join(" / "));
  check("(2) its group's wordings, A to Z, this one noted, the one naming the group noted, each with its changes",
    mem().join(" | ") === "3 hours in Community Relations / 293 / 28 / This wording; Names the group / Split out | 3.0 hours in Community Relations / 122 / 20 /  / Name the group by itSplit out",
    mem().join(" | "));
  check("(2) the members table is a labelled region with scoped headers; the Change column is plain words, no sort",
    !!pn(t.d).querySelector('#crl-pn-members[role="region"][aria-label]') && pn(t.d).querySelectorAll('#crl-pn-members th[scope="col"]').length === 5
    && pn(t.d).querySelectorAll('#crl-pn-members th button').length === 4 && txt(pn(t.d).querySelectorAll('#crl-pn-members th')[4]) === "Change");
  Array.from(pn(t.d).querySelectorAll("#crl-pn-members th button")).find((b) => /^Articulations/.test(txt(b))).click(); await settle();
  Array.from(pn(t.d).querySelectorAll("#crl-pn-members th button")).find((b) => /^Articulations/.test(txt(b))).click(); await settle();
  check("(2) a header sorts the members, most first on a second press, focus kept", /^3 hours/.test(mem()[0]) && /^Articulations, high to low/.test(txt(t.d.activeElement)),
    mem().join(" | ") + " / " + txt(t.d.activeElement));
  const more = () => pn(t.d).querySelector("details.crl-pn-more");
  check("(4) the rest is folded", !!more() && !more().open && /^More about this wording/.test(txt(more().querySelector("summary"))));
  more().open = true; await settle();
  check("(4) the rung's reason, the credentials and the courses", /Rung: Published\. Published statewide recommendation/.test(txt(more()))
    && /Credentials: POST Basic Academy\./.test(txt(more())) && /Courses: no course identity reaches it\./.test(txt(more())), txt(more()));
  Array.from(pn(t.d).querySelectorAll("#crl-pn-members th button")).find((b) => /^Wording/.test(txt(b))).click(); await settle();
  check("(4) the fold stays open through a redraw", more().open);
  Array.from(pn(t.d).querySelectorAll("#crl-pn-members button")).find((b) => txt(b) === "3.0 hours in Community Relations").click(); await settle();
  check("(2) another wording's name opens its panel", txt(t.d.getElementById("crl-panel-t")) === "Wording: 3.0 hours in Community Relations"
    && t.d.activeElement === t.d.getElementById("crl-panel-t") && /This wording/.test(mem().find((x) => /^3\.0/.test(x))));

  // (3) Confirm the group
  const n0 = posts(t).length;
  t.d.getElementById("crl-pn-confirmed").click(); await settle();
  const pp = posts(t).slice(n0);
  check("(3) Confirm the group writes the group's decision row, the reference kept", pp.length === 1 && pp[0].body[0].group_key === "community relations"
    && pp[0].body[0].decision === "confirmed" && pp[0].body[0].canonical === "3 hours in Community Relations"
    && pp[0].body[0].members.join("|") === "3 hours in Community Relations|3.0 hours in Community Relations", JSON.stringify(pp.map((x) => x.body)));
  check("(3) the panel says so, keeps focus on the word, and reads the decision", /Recorded: confirmed, 3 hours in Community Relations\./.test(txt(pn(t.d).querySelector(".crr-status")))
    && t.d.activeElement === t.d.getElementById("crl-pn-confirmed") && /Decision: Confirmed/.test(txt(pn(t.d).querySelector(".crl-pn-dec"))), txt(pn(t.d)));
  const rowsNow = Array.from(t.d.querySelectorAll(".crl-table tbody tr")).filter((r) => /Community Relations/.test(txt(r)));
  check("(3) the group's wordings read Confirmed and join Changed this visit", rowsNow.length >= 2 && rowsNow.every((r) => /Confirmed/.test(txt(r)))
    && (t.M._state ? true : true) && words(t.d, "Changed this visit") && /\(2\)/.test(txt(words(t.d, "Changed this visit"))), rowsNow.map(txt).join(" | "));

  // (3) refused
  t = tab({ refuse: true });
  t.M.activate(); await settle();
  title(t.d, "4 hours in Welding").click(); await settle();
  t.d.getElementById("crl-pn-not_a_topic").click(); await settle();
  check("(3) a refused write says it did not save and changes nothing", /It did not save .*Nothing changed\./.test(txt(pn(t.d).querySelector(".crr-status")))
    && /No decision recorded yet/.test(txt(pn(t.d))), txt(pn(t.d).querySelector(".crr-status")));
  check("(2) a group of one lists its one wording, its counts in the singular", Array.from(pn(t.d).querySelectorAll("#crl-pn-members tbody tr")).length === 1
    && /1 wording resolves to 4 hours in Welding, 12 articulations at 3 colleges\. Press a header to sort\./.test(txt(pn(t.d))), txt(pn(t.d)));

  // (6) the worklist's group edits, carried into the panel (the List norms: a view retires once its List does what it does)
  t = tab();
  t.M.activate(); await settle();
  title(t.d, "3 hours in Community Relations").click(); await settle();
  let n1 = posts(t).length;
  t.d.getElementById("crl-pn-split-1").click(); await settle();
  let q1 = posts(t).slice(n1);
  check("(6) ⭐ Split out writes the group's row: the wording excluded, the decision split, the reference kept",
    q1.length === 1 && q1[0].body[0].decision === "split" && q1[0].body[0].excluded.join("|") === "3.0 hours in Community Relations"
    && q1[0].body[0].members.join("|") === "3 hours in Community Relations" && q1[0].body[0].canonical === "3 hours in Community Relations", JSON.stringify(q1.map((x) => x.body)));
  check("(6) the panel says it keeps its own row, notes it Split out, and offers Put back with focus on it",
    /split out of the group; it keeps its own row/.test(txt(pn(t.d).querySelector(".crr-status"))) && /Split out \/ Put back$/.test(mem()[1])
    && t.d.activeElement === t.d.getElementById("crl-pn-split-1"), mem().join(" | ") + " // " + txt(pn(t.d).querySelector(".crr-status")));
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-split-1").click(); await settle();
  q1 = posts(t).slice(n1);
  check("(6) Put back writes it back in, the split decision lifted", q1.length === 1 && q1[0].body[0].excluded.length === 0 && q1[0].body[0].decision !== "split"
    && q1[0].body[0].members.length === 2, JSON.stringify(q1.map((x) => x.body)));
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-name-1").click(); await settle();
  q1 = posts(t).slice(n1);
  check("(6) ⭐ Name the group by it writes that wording as the reference", q1.length === 1 && q1[0].body[0].canonical === "3.0 hours in Community Relations"
    && /the group reads 3\.0 hours in Community Relations/.test(txt(pn(t.d).querySelector(".crr-status"))), JSON.stringify(q1.map((x) => x.body)));
  // Add a wording from another group
  pn(t.d).querySelector("details.crl-pn-pick").open = true;
  const pick = t.d.getElementById("crl-pn-pick");
  pick.value = "weld"; pick.dispatchEvent(new t.w.Event("input")); await settle();
  check("(6) the picker finds a wording in another group, says how many, and keeps focus in its box",
    !!t.d.getElementById("crl-pn-add-0") && /^Add 4 hours in Welding$/.test(txt(t.d.getElementById("crl-pn-add-0"))) && /1 wording matches/.test(txt(pn(t.d)))
    && t.d.activeElement === t.d.getElementById("crl-pn-pick"), txt(pn(t.d).querySelector("details.crl-pn-pick")));
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-add-0").click(); await settle();
  q1 = posts(t).slice(n1);
  check("(6) ⭐ Add writes the wording into this group's members; its own group keeps its row", q1.length === 1 && q1[0].body[0].group_key === "community relations"
    && q1[0].body[0].members.indexOf("4 hours in Welding") >= 0 && /its own group keeps its row/.test(txt(pn(t.d).querySelector(".crr-status")))
    && /4 hours in Welding \/\s+\/\s+\/ Added to the group \/ Name the group by itRemove/.test(mem().join(" | ")), mem().join(" | "));
  // The note, Defer and Clear
  const note = t.d.getElementById("crl-pn-note");
  note.value = "Same course outline at both colleges."; note.dispatchEvent(new t.w.Event("input"));
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-deferred").click(); await settle();
  q1 = posts(t).slice(n1);
  check("(6) ⭐ Defer saves the decision with the note the next curator reads", q1.length === 1 && q1[0].body[0].decision === "deferred"
    && q1[0].body[0].note === "Same course outline at both colleges." && !!t.d.querySelector('label[for="crl-pn-note"]'), JSON.stringify(q1.map((x) => x.body)));
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-cleared").click(); await settle();
  q1 = posts(t).slice(n1);
  check("(6) Clear the decision writes cleared, keeping the row, and the word leaves", q1.length === 1 && q1[0].body[0].decision === "cleared"
    && !t.d.getElementById("crl-pn-cleared") && /No decision recorded yet/.test(txt(pn(t.d))), JSON.stringify(q1.map((x) => x.body)));
  t = tab({ signedIn: false });
  t.M.activate(); await settle();
  title(t.d, "3 hours in Community Relations").click(); await settle();
  n1 = posts(t).length;
  t.d.getElementById("crl-pn-split-1").click(); await settle();
  check("(6) signed out, a change writes nothing and says how to sign in", posts(t).length === n1 && /Sign in as a reviewer/.test(txt(pn(t.d).querySelector(".crr-status"))));

  // (7) the List is the tab's workspace (2026-11-04): it opens first; a Progress count and a filter's address open the
  // List on that filter, the worklist's two lists (a rule's folds, a group a screen holds) among them; the official-title
  // warning rides in the panel.
  const WL2 = JSON.parse(JSON.stringify(WORKLIST));
  Object.assign(WL2.groups[1], { screens_objecting: ["level"], official_id: "AJ 110", official_system: "C-ID", official_title: "Introduction to Criminal Justice",
    official_applied: false, title_divergent: true });
  t = tab({ worklist: WL2 });
  t.M.activate(); await settle();
  check("(7) ⭐ the tab opens on the List", t.M._state.view === "list" && !!t.d.querySelector(".crl-table"));
  t.M._progressApi().go("auto"); await settle();
  const shown = () => Array.from(t.d.querySelectorAll(".crl-table tbody tr:not(.crl-band):not(.crl-editrow)")).map(txt).filter((x) => /hours in/.test(x));
  check("(7) ⭐ a Progress count opens the List on Folded by a rule: the rule's folded group", t.M._state.view === "list" && t.M._state.ls.f === "auto"
    && shown().length === 2 && shown().every((x) => /Community Relations/.test(x)), shown().join(" | "));
  t.M._progressApi().go("held"); await settle();
  check("(7) and on Held by a screen: the group a safety screen holds", t.M._state.ls.f === "held" && shown().length === 2 && shown().every((x) => /Engine Performance/.test(x)), shown().join(" | "));
  t.M._progressApi().go("all"); await settle();
  check("(7) Open every group is the List's All", t.M._state.ls.f === "" && shown().length === 5, String(shown().length));
  title(t.d, "3 or 4 hours in Engine Performance").click(); await settle();
  check("(7) the panel warns when an official number reaches the group but is not applied", /C-ID AJ 110 reaches this group but is not applied: its official title, Introduction to Criminal Justice, shares no word/.test(txt(pn(t.d).querySelector(".crl-pn-warn"))),
    txt(pn(t.d)).slice(0, 300));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
