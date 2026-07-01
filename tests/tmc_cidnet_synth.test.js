// TMC Builder — synthesized c-id.net rows, title-inferred tcid[] provenance,
// and the join-ladder artifact contract.
//
// A c-id.net approval whose local course has NO row in our COCI extract used to
// vanish silently — the college's TMC slot showed a wrong blank (the Saddleback
// SOCI 110 case: c-id.net lists SOC 1/1H as approved, but the course left the
// COCI Active export mid-CCN-transition). The builder now lands EVERY approval
// through a join ladder (exact → zero-norm → squashed code → STRICT unique
// title → SYNTHESIZED row). Provenance is graded per C-ID:
//   synth rows  = 7 elements [subj, num, title, null, cid, xcid[], 1] — units
//                 unknown, badged "per c-id.net — verify";
//   tcid rows   = 8 elements [..., xcid[], 0, tcid[]] — the approval names a
//                 retired/renamed code, this course uniquely bears the identical
//                 title; matches render "≈ verify", NEVER "✓ C-ID aligned".
//
// Guards:
//   (1) setCollege exposes src === "cidnet" on a 7-element row and tcids on an
//       8-element row;
//   (2) autoMatch fills a slot from a synth row and from a tcid row;
//   (3) autoMatch PREFERS a hard carrier over a title carrier over a synth row
//       when several courses carry the same C-ID;
//   (4) statusFor: synth → aligned + verify nudge; tcid → "≈ … verify"
//       (tmatch class), normal → bare "✓ C-ID aligned";
//   (5) chips: chosen button + picker options badge synth ('per c-id.net') and
//       tcid ('≈ c-id.net title') courses; normal courses carry NO chip;
//   (6) units:null doesn't NaN the Total Units meter;
//   (7) save/resume round-trip: collectPayload serializes course_cids /
//       course_tcids / course_src so provenance survives (CO queue reads it);
//   (8) shipped-artifact contract: cidnet_join_lanes receipts, well-formed
//       7/8-element rows, NO comma-joined primary C-IDs, the Saddleback
//       SOCI 110 synth row present, and the adversarial-verify regression:
//       West Valley HIST 017BH must NOT carry HIST 130 (the A-half's C-ID).
//
// Run from repo root: `npm test` (or `node tests/tmc_cidnet_synth.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Part A — consumer logic (synthetic data)
// ─────────────────────────────────────────────────────────────────────────────
const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {} },
  templates: [{
    id: "test-synth", discipline: "Test Synth", degree: "AS-T", status: "draft", version: "draft", total_units: 12,
    sections: [{ name: "Required Core", select: "all", units: "12", slots: [
      { cid: "SOCI 110", title: "Introduction to Sociology", units: "3" }, // fills from the SYNTH row
      { cid: "PSY 110", title: "Introductory Psychology", units: "3" },    // fills from a normal COCI row
      { cid: "COMM 150", title: "Intercultural Communication", units: "3" }, // fills from a TCID row
      { cid: "ANTH 110", title: "Cultural Anthropology", units: "3" }      // 3 carriers → must pick the HARD one
    ]}]
  }]
};
const courses = [
  // SYNTH row: approval per c-id.net, course absent from the COCI extract
  ["SOC", "1", "Introduction to Sociology", null, "SOCI 110", [], 1],
  // normal COCI row
  ["PSYC", "C1000", "Introduction to Psychology", 3, "PSY 110"],
  // TCID row: title-inferred C-ID (approval named a retired code)
  ["COMM", "110", "Intercultural Communication", 3, null, [], 0, ["COMM 150"]],
  // preference triple: hard vs title-inferred vs synth carriers of ANTH 110
  ["ANTH", "102", "Cultural Anthropology", 3, null, [], 0, ["ANTH 110"]],   // title carrier
  ["ANTH", "2", "Cultural Anthropology (retired)", null, "ANTH 110", [], 1], // synth carrier
  ["ANTH", "101", "Cultural Anthropology", 3, "ANTH 110"],                   // HARD carrier — must win
  ["BIOL", "1", "General Biology", 4, null] // distractor
];
window.CPL_TMC_COLLEGE_COURSES = {
  _meta: {}, colleges: ["Test College"], courses: { "0": courses }
};
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: [] };
window.CPL_TMC_COLLEGE_ADTS = { _meta: { unmatched_colleges: {} }, extra_tmcs: [], by_college: {}, tmc_totals: {} };
window.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function listRows() { return document.querySelectorAll("#tab-tmc-builder .tmc-listrow"); }
function rowFor(re) { return Array.prototype.filter.call(listRows(), (r) => re.test(txt(r)))[0]; }
function pickerBtns() { return document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn"); }

(async function () {
  selectVal(document.getElementById("tmc-college-sel"), "Test College");
  await sleep(0);
  selectVal(document.getElementById("tmc-status-filter"), "all");
  await sleep(0);
  rowFor(/Test Synth/).click();
  await sleep(0);

  const btns = pickerBtns();
  check("4 slot pickers render", btns.length === 4);

  // (2) autoMatch fills from synth, normal, and tcid carriers
  check("synth row auto-matches its slot (SOC 1)", /SOC\s*1\b/.test(txt(btns[0])));
  check("normal row auto-matches its slot (PSYC C1000)", /PSYC\s*C1000/.test(txt(btns[1])));
  check("tcid row auto-matches its slot (COMM 110)", /COMM\s*110/.test(txt(btns[2])));

  // (3) preference: the HARD carrier (ANTH 101) beats the title carrier (ANTH 102)
  //     and the synth carrier (ANTH 2)
  check("hard carrier wins the multi-carrier slot (ANTH 101)", /ANTH\s*101/.test(txt(btns[3])));

  // (5) chips — synth + tcid chosen buttons carry the chip; normal/hard don't
  check("chosen synth course shows the 'per c-id.net' chip",
    !!btns[0].querySelector(".tmc-pc-net") && /per c-id\.net/.test(txt(btns[0].querySelector(".tmc-pc-net"))));
  check("chosen tcid course shows the '≈ c-id.net title' chip",
    !!btns[2].querySelector(".tmc-pc-net") && /≈ c-id\.net title/.test(txt(btns[2].querySelector(".tmc-pc-net"))));
  check("chosen normal course has NO chip", !btns[1].querySelector(".tmc-pc-net"));
  check("chosen hard-carrier course has NO chip", !btns[3].querySelector(".tmc-pc-net"));
  check("exactly 2 chips across the chosen buttons (no leaks)",
    document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn .tmc-pc-net").length === 2);

  // (6) units:null → '?', Total Units sums only the known units (3+3+3 = 9)
  check("synth units render as '?'", /\?\s*u/.test(txt(btns[0])));
  const meter = document.getElementById("tmc-meter");
  check("Total Units skips the unknown units (9, not NaN)", /Total Units:\s*9\b/.test(txt(meter)) && !/NaN/.test(txt(meter)));

  // (4) status tiers
  const statuses = Array.prototype.map.call(
    document.querySelectorAll("#tab-tmc-builder .tmc-status"), txt);
  check("synth slot status carries the c-id.net verify nudge",
    statuses.some((l) => /C-ID aligned/.test(l) && /per c-id\.net/.test(l) && /verify/.test(l)));
  check("tcid slot status is the '≈ … verify' tier (not '✓ aligned')",
    statuses.some((l) => /≈ C-ID per c-id\.net title match/.test(l) && /verify/.test(l)));
  check("normal slot status is a bare '✓ C-ID aligned'",
    statuses.some((l) => /✓ C-ID aligned$/.test(l)));

  // (5 cont.) picker options carry the right chips
  btns[0].click();
  await sleep(0);
  let opts = document.querySelectorAll("#tab-tmc-builder .tmc-pop .tmc-opt");
  const synthOpt = Array.prototype.filter.call(opts, (o) => /SOC\s*1\b/.test(txt(o)))[0];
  const normalOpt = Array.prototype.filter.call(opts, (o) => /BIOL\s*1\b/.test(txt(o)))[0];
  check("picker option for the synth course shows the chip", !!(synthOpt && synthOpt.querySelector(".tmc-pc-net")));
  check("picker option for a normal course has NO chip", !!(normalOpt && !normalOpt.querySelector(".tmc-pc-net")));

  // (7) save/resume round-trip: collectPayload carries the provenance keys.
  // collectPayload isn't exported — verify through the serialized shape the
  // Save path builds, by re-deriving it the same way from state via the DOM:
  // the source contract is pinned instead on the artifact + a source grep.
  const src = builderSrc;
  check("collectPayload serializes course_cids/course_tcids/course_src",
    /course_cids:\s*c\.cids/.test(src) && /course_tcids:\s*c\.tcids/.test(src) && /course_src:\s*c\.src/.test(src));
  check("maybeResume restores cids/tcids/src",
    /tcids:\s*a\.course_tcids\s*\|\|\s*\[\]/.test(src) && /src:\s*a\.course_src\s*\|\|\s*""/.test(src));

  // ── Part B: shipped-artifact contract ──
  runArtifactChecks();

  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();

function runArtifactChecks() {
  let raw;
  try { raw = fs.readFileSync("tmc_college_courses.js", "utf8"); }
  catch (e) { check("tmc_college_courses.js present", false); return; }
  const data = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const m = data._meta || {};

  // join-ladder receipts
  const lanes = m.cidnet_join_lanes || {};
  check("artifact _meta carries cidnet_join_lanes receipts",
    ["exact", "zero_norm", "squash", "title", "synth"].every((k) => typeof lanes[k] === "number"));
  check("squash + title lanes rescued approvals (>0 each)", lanes.squash > 0 && lanes.title > 0);
  check("_meta.synth_rows > 0", (m.synth_rows || 0) > 0);
  check("_meta.title_cid_rows > 0", (m.title_cid_rows || 0) > 0);

  // 7-element synth rows + 8-element tcid rows well-formed; no comma primaries
  let synthCount = 0, badSynth = 0, tcidCount = 0, badTcid = 0, commaPrimary = 0;
  Object.keys(data.courses).forEach((ci) => {
    data.courses[ci].forEach((r) => {
      if (r.length >= 5 && typeof r[4] === "string" && r[4].indexOf(",") !== -1) commaPrimary++;
      if (r.length === 7) {
        synthCount++;
        if (r[6] !== 1 || r[3] !== null || typeof r[4] !== "string" || !r[4].length || !Array.isArray(r[5])) badSynth++;
      }
      if (r.length === 8) {
        tcidCount++;
        if (r[6] !== 0 || !Array.isArray(r[7]) || !r[7].length || !r[7].every((x) => typeof x === "string" && x.length)) badTcid++;
      }
    });
  });
  check("synth-row count matches _meta.synth_rows", synthCount === m.synth_rows);
  check("tcid-row count matches _meta.title_cid_rows", tcidCount === m.title_cid_rows);
  check("every synth row is well-formed (flag 1, null units, string primary, xcid array)", badSynth === 0);
  check("every tcid row is well-formed (flag 0, non-empty string tcid[])", badTcid === 0);
  check("NO comma-joined primary C-IDs remain (split_cids)", commaPrimary === 0);

  // the motivating case: Saddleback SOCI 110 via synthesized SOC 1
  const si = data.colleges.indexOf("Saddleback College");
  const sadRows = si >= 0 ? data.courses[String(si)] : [];
  const sadSoci = sadRows.filter((r) => r.length === 7 && r[0] === "SOC" && String(r[1]) === "1" &&
    ([r[4]].concat(r[5] || []).indexOf("SOCI 110") !== -1));
  check("Saddleback SOCI 110 fills via the synthesized SOC 1 row (the motivating case)", sadSoci.length === 1);

  // adversarial-verify regression: the B-half honors course must NOT inherit
  // the A-half's C-ID via title stripping (West Valley HIST 017BH ↛ HIST 130)
  const wi = data.colleges.indexOf("West Valley College");
  const wvRows = wi >= 0 ? data.courses[String(wi)] : [];
  const bad017 = wvRows.filter((r) => r[0] === "HIST" && String(r[1]) === "017BH" &&
    ([r[4]].concat(r[5] || [], r[7] || []).indexOf("HIST 130") !== -1));
  check("West Valley HIST 017BH does NOT carry the A-half's HIST 130 (strict-title regression)", bad017.length === 0);
}
