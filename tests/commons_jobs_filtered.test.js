// A count opens the job it counts, filtered, and the queue reads in the order the work goes (Sam, 2026-11-04: "When I
// clicked on the 17 subjects, I expected to see the common subjects view open with those 17 queued up, but it just
// opened the view unfiltered", then "the links on all surfaces should open to the filtered view of the job needed",
// and "if you can somehow put the procedural things to act in a process order within their cards"). Guards:
//   (1) each queue card lists its items numbered, subjects first, then courses, exhibits, credit recommendations and
//       programs, keeping the status file's order inside one reference;
//   (2) the Subjects scan findings count opens #canonical-subj4/list/scan, in the Commons file and on the tab's own
//       Progress page;
//   (3) that filter holds the MQ disciplines with a finding to confirm or note (never an unconfirmed-only finding), says
//       which finding sits on a file, and each panel names its findings;
//   (5) TOP and discipline disagreements wait on no person (Sam, 2026-11-04: "those are input unchecked by colleges. CIP
//       from the COCI programs records should be more dependable"); their count stays a fact;
//   (4) the deploy serves kb/csr_out/latest.json (the Subjects Progress page read "Could not be read" while the build
//       pruned it) and fails if it goes missing.
// Run from repo root: `npm test` (or `node tests/commons_jobs_filtered.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const H = require("./csr_list_harness.js");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const txt = H.txt;

// ── (1) the queue in process order ──
const SRC = fs.readFileSync("commons.js", "utf8");
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="commons-root"></div></body></html>', { url: "https://example.org/", runScripts: "dangerously" });
const s = dom.window.document.createElement("script"); s.textContent = SRC; dom.window.document.body.appendChild(s);
const root = dom.window.document.getElementById("commons-root");
const item = (ref, n, words) => ({ ref: ref, n: n, words: words, open: "#x/" + n });
dom.window.CPL_COMMONS.render(root, { schema: 1, rows: [], queue: { reasons: [
  { key: "no_procedure", items: [item("course", 1, "a"), item("cr", 2, "b"), item("course", 3, "c"), item("subjects", 4, "d")] },
  { key: "unsure", items: [item("exhibit", 5, "e"), item("course", 6, "f"), item("cr", 7, "g"), item("subjects", 8, "h"), item("requirements", 9, "i")] },
  { key: "reaches", items: [] }, { key: "keep_call", items: [] }], carried: [item("requirements", 10, "j"), item("course", 11, "k")] } });
const order = (key) => Array.from(root.querySelectorAll('.cmn-reason[data-reason="' + key + '"] li a, .cmn-reason[data-reason="' + key + '"] li button')).map(txt);
check("(1) ⭐ a card's items run subjects, courses, exhibits, credit recommendations, programs", order("unsure").join(",") === "8,6,5,7,9", order("unsure").join(","));
check("(1) inside one reference the status file's order stands", order("no_procedure").join(",") === "4,1,3,2", order("no_procedure").join(","));
check("(1) the items are numbered steps", root.querySelectorAll('.cmn-reason[data-reason="unsure"] ol.cmn-steps > li').length === 5);
check("(1) the queue says the order it follows", /in the order the work goes: subjects, then courses, exhibits, credit recommendations and programs/.test(txt(root.querySelector(".cmn-queue"))));
const carried = Array.from(root.querySelectorAll(".cmn-carried li a, .cmn-carried li button")).map(txt);
check("(1) the routines' list follows the same order", carried.join(",") === "11,10", carried.join(","));

// ── (2) the links ──
const CM = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
const subj = CM.rows.find((r) => r.key === "subjects");
const scanIssue = (subj.issues || []).find((i) => /scan findings to confirm or note/.test(i.words));
check("(2) ⭐ the Commons file's scan findings count opens the Subjects List on its filter", !!scanIssue && scanIssue.open === "#canonical-subj4/list/scan", scanIssue && scanIssue.open);
const queued = [].concat.apply([], CM.queue.reasons.map((g) => g.items)).find((i) => i.ref === "subjects" && /scan findings/.test(i.words));
check("(2) and so does its queue item", !!queued && queued.open === "#canonical-subj4/list/scan");
const BUILD = fs.readFileSync("kb/_build_commons_status.py", "utf8");
const allQueued = [].concat.apply([], CM.queue.reasons.map((g) => g.items)).concat(CM.queue.carried || []);
const course = CM.rows.find((r) => r.key === "course");
check("(5) ⭐ no TOP disagreement waits on a person, in the queue or the Courses row's issues", !allQueued.some((i) => /TOP/.test(i.words))
  && !(course.issues || []).some((i) => /TOP/.test(i.words)) && !/"words": "TOP and discipline disagreements"/.test(BUILD));
check("(5) its count stays a fact for the Progress page", course.facts && course.facts.tags && course.facts.tags.top_discipline_disagreement != null);
check("(2) the builder writes that address", /"open": tab \+ "\/list\/scan"/.test(BUILD));
const CS = fs.readFileSync("canonical_subj4.js", "utf8");
check("(2) the tab's own Progress item opens the List on it", /scan: \{ view: "list", filter: "scan" \}/.test(CS) && /words: "Open them in the List", go: go\(TO\.scan\)/.test(CS));

// ── (3) the filter ──
function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, top_category_2digit: "09", canonical_source: "csr", authority_flag: "proposed", authority_chips: [],
    cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
const SEED = { _counts: {}, _seeded_at: "2026-09-30", _synced_at: "2026-10-19T13:25:33Z", disciplines: {
  "Cabinet Making": entry("CNSC"), "Graphic Arts": entry("GRAF"), "Mathematics": entry("MATH"), "Welding": entry("WELD") } };
const SCAN = { _scanned_at: "2026-11-04T06:00:00Z", _mid_codes: { stray_codes: 0, stray_ids: 0, strays: [] }, findings: [
  { id: "CSR1", rule: "cs5_modal_diverge", item: "Cabinet Making", evidence: "modal WOOD (share 0.67) but canonical CNSC, no _notes", suggestion: "confirm choice + record a note", needs_judgment: true },
  { id: "CSR2", rule: "cs6_weak_mnemonic", item: "Cabinet Making", evidence: "canonical CNSC not derivable from name", suggestion: "", needs_judgment: true },
  { id: "CSR3", rule: "cs6_weak_mnemonic", item: "Graphic Arts", evidence: "canonical GRAF not derivable from name", suggestion: "", needs_judgment: true },
  { id: "CSR4", rule: "cs7_unreviewed", item: "Mathematics", evidence: "unconfirmed", needs_judgment: true },
  { id: "CSR5", rule: "cs9_anchor_dead_format", item: "common_courses.json", evidence: "3 anchor entries in the dead format", needs_judgment: true },
  { id: "CSR6", rule: "cs6_weak_mnemonic", item: "Welding", evidence: "fine", needs_judgment: false }] };

(async function () {
  const t = H.boot({ seed: SEED, scan: SCAN, hash: "#canonical-subj4/list/scan" });
  await H.settle(); await H.settle();
  check("(3) ⭐ #canonical-subj4/list/scan lists the MQ disciplines with a finding to confirm or note", t.titles().join("|") === "Cabinet Making|Graphic Arts", t.titles().join("|"));
  const note = Array.from(t.d.querySelectorAll("#cs-list p")).map(txt).find((x) => /scan findings to confirm or note:/.test(x)) || "";
  check("(3) the List says how many findings, on how many disciplines, and the one on a file", /4 scan findings to confirm or note: 3 findings on 2 MQ disciplines/.test(note)
    && /an anchor key in the dead format in common_courses\.json, on a file rather than an MQ discipline/.test(note), note);
  const p = await t.panel("Cabinet Making");
  const pt = txt(p);
  check("(3) ⭐ the panel names each finding and what the scan suggests", /Scan findings to confirm or note/.test(pt) && /a modal choice without a note: modal WOOD/.test(pt)
    && /The scan suggests: confirm choice \+ record a note/.test(pt) && /a weak mnemonic: canonical CNSC/.test(pt), pt.slice(0, 400));
  const fl = Array.from(t.d.querySelectorAll(".csl-filters button, .csl-filters span")).map(txt).find((x) => /^A scan finding/.test(x)) || "";
  check("(3) the filter word carries its count", fl === "A scan finding to confirm or note (2)", fl);
  // (3b) a row saved this visit leaves the list needing a look (Sam, 2026-11-04: "after I edit and save subj, will the
  //      list needing a look shorten?"); its panel says the scan reads it again after the sync.
  t.M()._state.ls.changed.push("Cabinet Making"); t.M().applyView("list"); await H.settle();
  const fl2 = Array.from(t.d.querySelectorAll(".csl-filters button, .csl-filters span")).map(txt).find((x) => /^A scan finding/.test(x)) || "";
  const note2 = Array.from(t.d.querySelectorAll("#cs-list p")).map(txt).find((x) => /scan findings to confirm or note:/.test(x)) || "";
  check("(3b) ⭐ a row saved this visit leaves the filter, and the count follows", t.titles().join("|") === "Graphic Arts" && fl2 === "A scan finding to confirm or note (1)", t.titles().join("|") + " / " + fl2);
  check("(3b) the List names what left and where it goes next", /1 finding on 1 MQ discipline below/.test(note2)
    && /1 MQ discipline answered since the last scan left the list \(Cabinet Making\), and the sync carries it into the reference file/.test(note2), note2);
  t.M()._state.ls.f = ""; t.M().applyView("list"); await H.settle();
  const p2 = await t.panel("Cabinet Making");
  check("(3b) its panel reads answered since the scan", !!p2 && /Scan findings, answered since the scan/.test(txt(p2)) && /has left the list needing a look/.test(txt(p2)), p2 && txt(p2).slice(0, 300));
  // (3c) a save from an earlier visit counts too (Sam, 2026-11-05: "I edited these but they are staying on the list"):
  //      the overlay's save time after the scan's run takes the row off, with no changed set.
  const OVER = [{ course_id: "_CANON_SUBJ4::Graphic Arts", field: "canonical_subj4_notes", value: "kept GRAF: the colleges' code", reviewer_email: "slee@cccco.edu", reviewed_at: "2026-11-04T21:27:22Z" },
    { course_id: "_CANON_SUBJ4::Cabinet Making", field: "canonical_subj4_notes", value: "an old note", reviewer_email: "slee@cccco.edu", reviewed_at: "2026-11-03T21:00:00Z" }];
  const v = H.boot({ seed: SEED, scan: SCAN, overlay: OVER, hash: "#canonical-subj4/list/scan" });
  await H.settle(); await H.settle();
  check("(3c) ⭐ a note saved after the scan ran takes its row off in a new visit; a note saved before it does not", v.titles().join("|") === "Cabinet Making", v.titles().join("|"));
  const u = H.boot({ seed: SEED, scan: null, hash: "#canonical-subj4/list/scan" });
  await H.settle(); await H.settle();
  check("(3) a scan that could not be read says so, never an empty list as a zero", /could not be read/.test(txt(u.d.getElementById("cs-list"))));

  // ── (4) the deploy ──
  const PG = fs.readFileSync(".github/workflows/pages.yml", "utf8");
  check("(4) ⭐ the prune spares the daily scan", /if \[ "\$d" = "_site\/kb\/csr_out" \]; then find "\$d" -mindepth 1 -maxdepth 1 ! -name latest\.json/.test(PG)
    && !/rm -rf _site\/kb\/\*_out /.test(PG));
  check("(4) the deploy fails if it goes missing", /"_site\/kb\/csr_out\/latest\.json"/.test(PG));
  H.report(results);
})().catch((e) => { console.error(e); process.exit(1); });
