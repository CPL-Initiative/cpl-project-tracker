// The Commons' "confirmed by a person" count and the Subjects List's "Confirmed by a person" filter count the same MQ
// disciplines (#3555). The nightly click-through of Nov 26 and 27, 2026 found the Commons at 137 and the List at 138:
// the Commons builder (kb/_build_commons_status.py, row_subjects) counted a discipline confirmed only when its source
// was curator_override, while the List (isConfirmed in canonical_subj4.js) counts any four-letter code with a review
// stamp. Sam's FLTR pick for Flight Attendant Training of 2026-11-23 sits on an S717 assigned entry (source
// `assigned`, reviewed by him), so the List counted it and the Commons did not. Guards:
//   (1) on one seed with each kind of entry, the builder's person pair, the List's filter word and the List's rows agree,
//       and so do the builder's confirmed and settled counts with the List's Confirmed filter;
//   (2) an assigned entry stamped by a machine cohort counts confirmed, never by a person;
//   (3) the committed seed and kb/status/commons.json agree with the List the same way (CI rebuilds the status file
//       from the tree and runs every test that reads it).
// Run from repo root: `npm test` (or `node tests/csr_person_count_agrees.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const H = require("./csr_list_harness.js");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, top_category_2digit: "09", canonical_source: "csr", authority_flag: "proposed", authority_chips: [],
    cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
const SEED = { _counts: {}, _seeded_at: "2026-09-30", _synced_at: "2026-11-27T13:25:33Z", disciplines: {
  "Cabinet Making": entry("CNSC"),                                                                 // a person's pick
  "Graphic Arts": entry("GRAF", { reviewed_by: "csr-confirm-authority@bot" }),                    // the nightly procedure
  "Flight Attendant Training": entry("FLTR", { source: "assigned", reviewed_at: "2026-11-23T19:55:10+00:00",
    reviewed_by: "Sam (in session, S717)", data_modal: null, total_mids: 0 }),                     // assigned, then Sam's pick
  "Welding": entry("WELD", { source: "assigned", reviewed_at: "2026-11-23T19:00:00+00:00", reviewed_by: "csr-s717@bot" }), // assigned
  "Mathematics": entry("MATH", { source: "data_modal", reviewed_at: null, reviewed_by: null }) } };  // unconfirmed

/* The builder's subjects row, run on a seed in a scratch root. */
function built(seed) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "csr-person-"));
  fs.mkdirSync(path.join(root, "kb"));
  fs.writeFileSync(path.join(root, "kb", "discipline_canonical_subj4.json"), JSON.stringify(seed));
  const py = "import sys, json; sys.path.insert(0, 'kb'); import _build_commons_status as B; print(json.dumps(B.row_subjects(sys.argv[1])))";
  const r = spawnSync("python3", ["-c", py, root], { encoding: "utf8" });
  fs.rmSync(root, { recursive: true, force: true });
  if (r.status !== 0) throw new Error("the builder failed: " + (r.stderr || "").slice(-400));
  return JSON.parse(r.stdout);
}
const filterWord = (t, re) => Array.from(t.d.querySelectorAll(".csl-filters button, .csl-filters span")).map(H.txt).find((x) => re.test(x)) || "";
const countOf = (s) => { const m = /\((\d[\d,]*)\)$/.exec(s); return m ? Number(m[1].replace(/,/g, "")) : null; };

(async function () {
  // ── (1) and (2) the fixture ──
  const row = built(SEED);
  const t = H.boot({ seed: SEED, hash: "#canonical-subj4/list/person" });
  await H.settle(); await H.settle();
  const person = row.pair[1];
  const word = filterWord(t, /^Confirmed by a person/);
  check("(1) ⭐ the builder's person count equals the List's Confirmed by a person filter", person.n === countOf(word) && person.n === 2,
    "builder " + person.n + ", List " + word);
  check("(1) and the List's rows on that filter are the same disciplines", t.titles().sort().join("|") === "Cabinet Making|Flight Attendant Training", t.titles().join("|"));
  check("(1) the person pair still opens that filter", person.open === "#canonical-subj4/list/person", person.open);
  const conf = filterWord(t, /^Confirmed \(/);
  check("(1) the builder's confirmed count equals the List's Confirmed filter", row.facts.confirmed === countOf(conf) && row.facts.confirmed === 4,
    "builder " + row.facts.confirmed + ", List " + conf);
  check("(1) settled counts the same confirmed disciplines (no collision here)", row.facts.settled === 4 && row.pair[0].n === 4, JSON.stringify(row.pair[0]));
  check("(2) ⭐ an assigned code a machine stamped counts confirmed by a procedure, never by a person",
    row.facts.cohort === 2 && countOf(filterWord(t, /^Confirmed by a procedure/)) === 2, "cohort " + row.facts.cohort + ", List " + filterWord(t, /^Confirmed by a procedure/));

  // ── (3) the committed files ──
  const seed = JSON.parse(fs.readFileSync("kb/discipline_canonical_subj4.json", "utf8"));
  const CM = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
  const subj = CM.rows.find((r) => r.key === "subjects");
  const c = H.boot({ seed: seed, hash: "#canonical-subj4/list/person" });
  await H.settle(); await H.settle();
  const cw = filterWord(c, /^Confirmed by a person/);
  check("(3) ⭐ the committed Commons file's person count equals the List's filter on the committed seed",
    !!subj && subj.pair[1].n === countOf(cw), "Commons " + (subj && subj.pair[1].n) + ", List " + cw);
  H.report(results);
})().catch((e) => { console.error(e); process.exit(1); });
