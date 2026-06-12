// Guards the CCR Subject-dropdown optgroups (Session 51 spec, Sam-yes'd):
// the flat #uc-subj SUBJ4 list regroups into three <optgroup>s once the
// canonical seed (kb/discipline_canonical_subj4.json — same file the CSR
// reads) loads:
//   1. "Common subjects ✓"            — seed-known codes (canonical_subj4 +
//                                       variants_observed keys), observed only
//   2. "Official C-ID & CCN"          — codes on C-ID/CCN-ID rows not in (1)
//   3. "Local-derived (awaiting fold)" — everything else (the live progress
//                                       meter — near-empty post-fold)
// Option VALUES stay bare codes (passes()/state.subj untouched); the current
// selection survives the in-place rebuild; "All subjects" stays the first
// option OUTSIDE the groups; on fetch failure the flat list keeps working
// (fail-soft, no unhandled rejections).
//
// Run from repo root: `npm test` (or `node tests/ccr_subject_groups.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rejections = [];
process.on("unhandledRejection", (e) => rejections.push(e));

const mkRow = (id, title, idsys, subj, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: idsys,
  disc: "", credit: "Credit", units: 3.0, top: null, subj: subj,
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
}, extra || {});

// Observed SUBJ4s: KINE + ATHL (both seed-known via the Kinesiology umbrella),
// BIOL (an official C-ID anchor outside the seed), ZZZZ (off-scheme local).
const rows = [
  mkRow("KINE M1001", "Weight Training", "M-ID", ["KIN"]),
  mkRow("ATHL M1002", "Varsity Soccer", "M-ID", ["PE"]),
  mkRow("BIOL 110", "General Biology", "C-ID", ["BIOL"],
    { locked: true, flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false, reviewed: true } }),
  mkRow("ZZZZ M1003", "Mystery Course", "M-ID", ["ZZ"]),
];

// Seed doc shape per kb/discipline_canonical_subj4.json. CHEM is seed-known
// but has NO observed rows — it must NOT be listed.
const SEED = {
  disciplines: {
    "Kinesiology": { canonical_subj4: "KINE", variants_observed: { KINE: 5, ATHL: 2 } },
    "Chemistry": { canonical_subj4: "CHEM", variants_observed: {} },
  },
};

function boot(seedResponder) {
  const html = `<!DOCTYPE html><html><head></head><body>
  <div id="tab-unified-courses">
    <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
  </div>
  <script>
    window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Kinesiology"], topmap: {} })};
  </script>
  </body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.fetch = (url) => {
    if (String(url).indexOf("discipline_canonical_subj4.json") >= 0) return seedResponder(window);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  window.alert = () => {};
  let threw = false;
  try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
  return { window: window, threw: threw };
}

(async function main() {
  // ── happy path: seed resolves AFTER a selection was made ─────────────────
  // The seed fetch is gated on an explicit release so the pre-rebuild state
  // (flat list, selection made) is asserted deterministically — no timing race.
  let releaseSeed;
  const seedGate = new Promise((res) => { releaseSeed = res; });
  const b1 = boot(() => seedGate.then(() => ({ ok: true, status: 200, json: () => Promise.resolve(SEED) })));
  check("init does not throw", !b1.threw);
  await sleep(80);   // jsdom defers init to DOMContentLoaded
  const doc = b1.window.document;
  const selEl = doc.getElementById("uc-subj");
  check("flat subject list builds first (no optgroups before the seed)",
    !!selEl && selEl.querySelectorAll("optgroup").length === 0
    && Array.from(selEl.options).map((o) => o.value).join(",") === ",ATHL,BIOL,KINE,ZZZZ");

  // pick a subject BEFORE the seed lands — the rebuild must preserve it
  selEl.value = "KINE";
  selEl.dispatchEvent(new b1.window.Event("change"));
  await sleep(10);
  check("subject filter applies pre-rebuild (only the KINE row shows)",
    doc.querySelectorAll("table.uc-table tbody tr").length === 1
    && doc.body.textContent.indexOf("KINE M1001") >= 0);

  releaseSeed();
  await sleep(80);   // seed resolves; the in-place rebuild happens
  const groups = Array.from(selEl.querySelectorAll("optgroup"));
  check("three optgroups after the seed loads", groups.length === 3);
  check("optgroup labels match the spec",
    groups.length === 3
    && groups[0].getAttribute("label") === "Common subjects ✓"
    && groups[1].getAttribute("label") === "Official C-ID & CCN"
    && groups[2].getAttribute("label") === "Local-derived (awaiting fold)");
  const opts = (g) => Array.from(g.querySelectorAll("option")).map((o) => o.value).join(",");
  check("group 1 = seed-known observed codes (canonical + variants)",
    groups.length === 3 && opts(groups[0]) === "ATHL,KINE");
  check("group 2 = official C-ID/CCN codes outside the seed",
    groups.length === 3 && opts(groups[1]) === "BIOL");
  check("group 3 = local-derived leftovers (the progress meter)",
    groups.length === 3 && opts(groups[2]) === "ZZZZ");
  check("seed-known but UNOBSERVED codes are not listed (no CHEM)",
    Array.from(selEl.options).every((o) => o.value !== "CHEM"));
  check("option values are bare codes (match their labels)",
    groups.every((g) => Array.from(g.querySelectorAll("option")).every((o) => o.value === txt(o))));
  check("'All subjects' stays the first option OUTSIDE the groups",
    selEl.options[0].value === "" && selEl.options[0].parentNode === selEl);
  check("selection preserved across the rebuild", selEl.value === "KINE");
  check("filter still applied after the rebuild (KINE row only)",
    doc.querySelectorAll("table.uc-table tbody tr").length === 1
    && doc.body.textContent.indexOf("KINE M1001") >= 0);

  // ── fail-soft path: 404 keeps the flat list working ──────────────────────
  const b2 = boot(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }));
  check("404 path: init does not throw", !b2.threw);
  await sleep(120);   // DOMContentLoaded-deferred init + the 404 resolution
  const doc2 = b2.window.document, sel2 = doc2.getElementById("uc-subj");
  check("404 path: flat list stays (no optgroups)",
    !!sel2 && sel2.querySelectorAll("optgroup").length === 0
    && Array.from(sel2.options).some((o) => o.value === "ZZZZ"));
  sel2.value = "ATHL";
  sel2.dispatchEvent(new b2.window.Event("change"));
  await sleep(10);
  check("404 path: filtering still works (ATHL row only)",
    doc2.querySelectorAll("table.uc-table tbody tr").length === 1
    && doc2.body.textContent.indexOf("ATHL M1002") >= 0);
  check("no unhandled rejections on either path", rejections.length === 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})().catch((e) => {
  // The unhandledRejection listener above would otherwise swallow a crash in
  // main() and let the process exit 0 with no output — fail loud instead.
  console.error("main threw:", e && e.stack || e);
  process.exit(1);
});
