// College Data Collection's data dictionary and data-sharing card (#3310 item 4): commons_data_sharing.js, read by
// commons_data.js through window.CPL_CDC_EXT, from kb/status/cdc_sharing.json (built by kb/_build_cdc_sharing.py from
// the hand-kept kb/cdc_data_dictionary.json).
//
// WHAT THIS GUARDS (each a way the page could mislead an outside reader about what is public):
//   (1) ⭐ the built file and doc are current with the hand-kept file (the builder's --check);
//   (2) ⭐ every field a college's page shows (its panel's dataset headings, sections and labeled lines, the list's
//       columns) is defined in kb/cdc_data_dictionary.json: a new card or line fails here until it is defined;
//   (3) ⭐ every field the file defines is shown by some college's page: a stale definition fails here;
//   (4) ⭐ the decided classes: staff role contacts and MAP's approval stage held, not published, and left out of any
//       outside share; MAP student counts aggregate under the student-detail ADR; exactly four classes;
//   (5) the card on a college's panel: each class with its fields, what is held and not shown, the join keys, the
//       agreements' status, and a word that opens the full view;
//   (6) ⭐ the full view has its own address (#commons/data/sharing), opens from it, reports it, and sits in the views'
//       menu; the statewide card sits on the list's page and opens the same view;
//   (7) agreements: status only, from the allowed statuses; a placeholder reads "not recorded";
//   (8) a missing file leaves the page whole and says so on the card;
//   (9) static: tokens only, no storage, no write, words for controls.
//
// Run from repo root: `npm test` (or `node tests/commons_data_sharing.test.js`).
const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("commons_data.js", "utf8");
const EXT = fs.readFileSync("commons_data_sharing.js", "utf8");
const HAND = JSON.parse(fs.readFileSync("kb/cdc_data_dictionary.json", "utf8"));
const BUILT = JSON.parse(fs.readFileSync("kb/status/cdc_sharing.json", "utf8"));
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));

// (1) the builder's own check: the hand-kept file is sound and both outputs are current.
let built = "";
try { built = execFileSync("python3", ["kb/_build_cdc_sharing.py", "--check"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
catch (e) { built = "FAILED: " + (e.stderr || e.message); }
check("(1) ⭐ kb/status/cdc_sharing.json and docs/reference/cdc_data_dictionary.md are current with kb/cdc_data_dictionary.json (" + built.trim().slice(0, 160) + ")", /\(current\)/.test(built));

/* The real committed file, with three colleges changed so every path the panel draws is drawn: one without the gap
   census's live read (the committed-captures labels), one scouted, and one whose records fail every machine check. */
function fixture() {
  const d = JSON.parse(JSON.stringify(REAL));
  const H = d.colleges.filter((c) => c.harvested);
  const a = H[0], b = H[1] || H[0], c = H[2] || H[0];
  delete a.census_programs; delete a.census_passing; delete a.census_gap; delete a.census_causes; delete a.census_basis;
  b.scout = { recommendation: "ready", challenge: "none", platform: "courseleaf", catalog_year: "2026-2027", checked_at: "2026-11-01T00:00:00Z", wave: "scout-test", catalog_url: "https://example.org/" };
  c.failed_checks = { coverage: 1, invented: 1, arithmetic: 1, repeated: 1, outcomes: 1 };
  return d;
}

function dom(hash, files) {
  const d = new JSDOM('<!doctype html><html><head></head><body><div id="root">Loading</div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = d.window, calls = [];
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  w.scrollTo = function () {};
  w.eval(EXT);
  w.eval(SRC);
  return { w, doc: w.document, root: w.document.getElementById("root"), calls };
}
function flush(w) { return new Promise((r) => w.setTimeout(r, 0)).then(() => new Promise((r) => w.setTimeout(r, 0))); }

const LABEL = {};
HAND.elements.forEach((e) => e.labels.forEach((l) => { LABEL[l] = e.id; }));
const CONTAINERS = new Set(HAND.containers || []);

(async function () {
  const FX = fixture();
  const files = { "kb/status/commons_data.json": FX, "kb/status/cdc_sharing.json": BUILT };

  // (2) and (3): every college's panel, and the list's columns.
  const T = dom("", files);
  const D = T.w.CPL_COMMONS_DATA;
  await D.boot(T.root, "");
  await flush(T.w);
  const shown = new Map();   // label -> where
  function seen(label, where) { if (label && !shown.has(label)) shown.set(label, where); }
  D.COLUMNS.forEach((c) => seen(c.label, "the college list's columns"));
  const M = D.model(FX);
  let panels = 0, cards = 0;
  for (const c of M.colleges) {
    D.render(T.root, M, "college/" + D.slugOf(c), new Date());
    const p = T.root.querySelector("#cdd-panel");
    if (!p || p.hidden) continue;
    panels++;
    if (p.querySelector('[data-cdc-ext="sharing"]')) cards++;
    const outside = (n) => !n.closest("[data-cdc-ext]");
    p.querySelectorAll(".cdd-pds > h4").forEach((n) => outside(n) && seen(txt(n), c.name + "'s panel, a dataset"));
    p.querySelectorAll("section.cdd-psec > h3").forEach((n) => outside(n) && seen(txt(n), c.name + "'s panel, a section"));
    p.querySelectorAll("dt").forEach((n) => outside(n) && seen(txt(n), c.name + "'s panel, a labeled line"));
  }
  check("(2) the panel drew for every college in the committed file (" + panels + " of " + M.colleges.length + ")", panels === M.colleges.length && panels > 0);
  const undefinedLabels = [...shown.keys()].filter((l) => !(l in LABEL) && !CONTAINERS.has(l));
  check("(2) ⭐ every field a college's page shows is defined in kb/cdc_data_dictionary.json" +
    (undefinedLabels.length ? "; add these labels to an element: " + undefinedLabels.map((l) => JSON.stringify(l) + " (" + shown.get(l) + ")").join(", ") : ""), !undefinedLabels.length);
  const unshown = Object.keys(LABEL).filter((l) => !shown.has(l));
  check("(3) ⭐ every label kb/cdc_data_dictionary.json defines is shown on some college's page" +
    (unshown.length ? "; not shown: " + unshown.map((l) => JSON.stringify(l) + " (" + LABEL[l] + ")").join(", ") : ""), !unshown.length);
  const unusedContainers = [...CONTAINERS].filter((l) => !shown.has(l));
  check("(3) every container heading the file names is a section the panel draws" + (unusedContainers.length ? "; not drawn: " + unusedContainers.join(", ") : ""), !unusedContainers.length);

  // (4) the decided classes.
  check("(4) ⭐ exactly four classes, in order: public, aggregate, agreement, held", JSON.stringify(Object.keys(HAND.classes)) === JSON.stringify(["public", "aggregate", "agreement", "held"]));
  check("(4) the aggregate class names the student-detail disclosure ADR as its rule, and its floor of 10",
    /adr-student-detail-aggregate-disclosure-control\.md/.test(HAND.classes.aggregate.definition) && /fewer than 10/.test(HAND.classes.aggregate.definition));
  const H = Object.fromEntries(HAND.held_not_shown.map((h) => [h.id, h]));
  check("(4) ⭐ staff role contacts (map/sync_map_users.py) are held, not published, and left out of any outside share",
    H.staff_role_contacts && H.staff_role_contacts.class === "held" && /map\/sync_map_users\.py/.test(H.staff_role_contacts.where) && /^Left out/.test(H.staff_role_contacts.outside_share));
  check("(4) ⭐ MAP's articulation Status (the approval stage) is held, not published",
    H.map_articulation_status && H.map_articulation_status.class === "held" && /approval/.test(H.map_articulation_status.name));
  check("(4) ⭐ MAP student counts are aggregate, under the ADR's floor", H.map_student_counts && H.map_student_counts.class === "aggregate" && /10/.test(H.map_student_counts.outside_share));
  check("(4) a COMIS element is filled only from the repo's own files: SP02 and SP04 stay empty and say so",
    HAND.join_keys.filter((j) => /SP0[24]/.test(j.comis_note || "")).every((j) => j.comis_element === "") &&
    HAND.join_keys.filter((j) => /SP0[24]/.test(j.comis_note || "")).length === 2);

  // (5) the card on a college's panel.
  check("(5) the data-sharing card sits on every college's panel (" + cards + ")", cards === panels);
  const first = M.colleges.filter((c) => c.harvested)[0];
  D.render(T.root, M, "college/" + D.slugOf(first), new Date());
  const card = T.root.querySelector('#cdd-panel [data-cdc-ext="sharing"]');
  check("(5) the card's heading is Data elements and sharing", txt(card && card.querySelector("h3")) === "Data elements and sharing");
  const sum = ["public", "aggregate", "agreement", "held"].reduce((n, k) => {
    const g = card && card.querySelector('.cdc-sw-class[data-class="' + k + '"] h4');
    const m = /\((\d+)\)$/.exec(txt(g));
    return n + (m ? Number(m[1]) : 0);
  }, 0);
  check("(5) the card's four class counts add up to every field the file defines (" + sum + " of " + BUILT.elements.length + ")", sum === BUILT.elements.length);
  check("(5) the card names what is held and not shown, staff contacts among them, and says they are left out of any outside share",
    /Staff role contacts/.test(txt(card && card.querySelector('[data-class="not-shown"]'))) && /left out of any outside share/.test(txt(card)));
  check("(5) the card lists the join keys its fields use", card && card.querySelectorAll(".cdc-sw-joins li").length >= 3 && /Program control number: joins/.test(txt(card)));
  check("(5) the card states the agreements by status only", /^Agreements: .*Status only/.test(txt(card && card.querySelector("[data-agreements]"))));
  const open = card && card.querySelector('button.cmn-word[data-view="sharing"]');
  check("(5) a word on the card opens the full view", !!open);
  if (open) open.click();
  await flush(T.w);
  check("(6) ⭐ the card's word opens #commons/data/sharing, and the view reports its address", D.address() === "commons/data/sharing" && !!T.root.querySelector("#cdc-sw-view"));

  // (6) the full view opens from its own address.
  const V = dom("#commons/data/sharing", files);
  await V.w.CPL_COMMONS_DATA.boot(V.root, "sharing");
  await flush(V.w);
  check("(6) ⭐ #commons/data/sharing opens the view from its arrival, and the view names itself in its report",
    V.w.CPL_COMMONS_DATA.address() === "commons/data/sharing" && txt(V.root.querySelector("#cdd-h")) === "Data elements and sharing");
  check("(6) every field the file defines is a row of the view's table", V.root.querySelectorAll("#cdc-sw-fields-table tbody tr").length === BUILT.elements.length);
  check("(6) the held, join-key and agreements tables carry every row", V.root.querySelectorAll("#cdc-sw-held-table tbody tr").length === BUILT.held_not_shown.length &&
    V.root.querySelectorAll("#cdc-sw-joins-table tbody tr").length === BUILT.join_keys.length && V.root.querySelectorAll("#cdc-sw-agreements-table tbody tr").length === BUILT.agreements.length);
  check("(6) every header cell has its scope; each table sits in a labeled region", [...V.root.querySelectorAll(".cdc-sw-table th")].every((th) => th.getAttribute("scope")) &&
    [...V.root.querySelectorAll(".cdc-sw-table")].every((t) => t.parentNode.getAttribute("role") === "region" && t.parentNode.getAttribute("aria-label")));
  check("(6) every table is laid out fixed by its column group, so it fits without sideways scroll at desktop width",
    [...V.root.querySelectorAll(".cdc-sw-table")].every((t) => t.querySelector("colgroup") && t.querySelectorAll("col").length === t.querySelectorAll("thead th").length));
  const nav = V.root.querySelector('nav.cdd-views a[data-goto="sharing"]');
  check("(6) the views' menu carries Data elements and sharing at its address", nav && nav.getAttribute("href") === "#commons/data/sharing" && txt(nav) === "Data elements and sharing");
  check("(6) the view's lede says what it holds", /who may see it/.test(txt(V.root.querySelector(".cmn-lede"))));

  // (6) the statewide card on the list's page.
  D.render(T.root, M, "", new Date());
  const st = T.root.querySelector("#cdc-sw-state");
  check("(6) the statewide card sits on the list's page with every class's count", st && ["public", "aggregate", "agreement", "held"].every((k) => st.querySelector('li[data-class="' + k + '"]')) &&
    new RegExp(BUILT.elements.length + " fields").test(txt(st)));
  const sw = st && st.querySelector('button[data-view="sharing"]');
  if (sw) sw.click();
  await flush(T.w);
  check("(6) the statewide card's word opens the full view", D.address() === "commons/data/sharing");

  // (7) agreements.
  check("(7) agreements carry a status from the allowed list and no agreement text", HAND.agreements.every((a) => BUILT.agreement_status.indexOf(a.status) >= 0 && !("text" in a) && !("body" in a)));
  check("(7) a status the repo does not record reads not recorded", HAND.agreements.some((a) => a.status === "not recorded"));
  check("(7) agreements name parties by role or organization, never an email", HAND.agreements.every((a) => !/@/.test(a.parties + a.note)));

  // (8) a missing file.
  const X = dom("#commons/data", { "kb/status/commons_data.json": FX });
  X.w.CPL_CDC_SHARING._reset();
  await X.w.CPL_COMMONS_DATA.boot(X.root, "");
  await flush(X.w);
  check("(8) without kb/status/cdc_sharing.json the list still draws and the statewide card says the dictionary could not be read",
    X.root.querySelectorAll("#cdd-colleges tbody tr").length > 0 && /could not be read/.test(txt(X.root.querySelector("#cdc-sw-state"))));

  // (9) static.
  check("(9) the module's CSS uses tokens only, never a raw hex", !/#[0-9a-fA-F]{3,6}\b/.test(T.w.CPL_CDC_SHARING.CSS));
  check("(9) the module stores nothing and writes nothing", !/localStorage|sessionStorage|method:\s*["'](POST|PATCH|PUT|DELETE)/.test(EXT) && T.calls.every((c) => c[1] === "GET"));
  check("(9) no glyph stands in for a word", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(EXT));
  check("(9) people appear by role only: no email in the dictionary file", !/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/.test(JSON.stringify(HAND)));

  const fails = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - fails.length) + "/" + results.length + " checks passed");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
