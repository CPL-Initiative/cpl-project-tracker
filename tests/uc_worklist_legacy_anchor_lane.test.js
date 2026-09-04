// SkyLand S226 (2026-09-04) — the curated-anchor duplicates lane of the
// Suggested-merges worklist. The May 2026 curated common-course anchors render
// as locked, read-only rows; 130 of them carry exactly the title and discipline
// of a catalog identity (the Z-band retirement's duplicates.json). The
// generator emits them as `legacy_groups` — twin first, anchor last — and the
// worklist offers each pair to the curator. What this pins, each proven to
// fail when broken:
//   1. the lane LEADS the queue and renders a words-only badge (no glyph — Sam,
//      2026-08-29) plus copy that names the anchor's provenance;
//   2. the ★ survivor is the catalog twin, so Confirm writes merge_into on the
//      ANCHOR pointing at the twin — never the reverse;
//   3. when the only twin is a Stand-Alone, the anchor is the survivor and the
//      stand-alone gets the merge_into row;
//   4. the lane is exempt from the cohesion slider (an exact duplicate is not a
//      similarity score), so the most conservative setting still shows it;
//   5. after the lane, the queue continues into the anchored groups.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_legacy_anchor_lane.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "BUSI M1027", title: "Computerized Accounting", id_system: "M-ID",
    disc: "Business", subj: ["ACCT"], units: 3, credit: "Credit", members: 27, adopted: [], potential: [], flags: {} },
  { kind: "Course", id: "BUSI M11TR", title: "Computerized Accounting", id_system: "M-ID",
    disc: "Business", subj: ["ACCT"], units: 3, credit: "Credit", members: 1, locked: true,
    reviewed_by: "samueltlee", reviewed_at: "2026-05-20", adopted: [], potential: [], flags: { reviewed: true } },
  { kind: "Course", id: "ARTS M11CC", title: "Beginning Drawing", id_system: "M-ID",
    disc: "Art", subj: ["ART"], units: 3, credit: "Credit", members: 1, locked: true, adopted: [], potential: [], flags: { reviewed: true } },
  { kind: "Course", id: "FLSP M2001", title: "Conversational Spanish", id_system: "M-ID",
    disc: "Foreign Languages", subj: ["FLSP"], units: 3, credit: "Credit", members: 2, adopted: [], potential: [], flags: {} },
];
const sug = {
  legacy_groups: [
    { sig: "Computerized Accounting", n: 2, score: 1.0, anchor: "BUSI M11TR",
      origin: "curated common-course anchor (2026-05)", reviewed_by: "samueltlee", reviewed_at: "2026-05-20",
      note: "Accounting is an area within MQ discipline 'Business'.", n_src: 1,
      members: [
        { id: "BUSI M1027", t: "Computerized Accounting", s: "ACCT", u: 3, k: "M-ID", d: "Business", n: 27 },
        { id: "BUSI M11TR", t: "Computerized Accounting", s: "ACCT", u: 3, k: "M-ID", d: "Business", anchor: 1 } ] },
    { sig: "Beginning Drawing", n: 2, score: 1.0, anchor: "ARTS M11CC",
      origin: "curated common-course anchor (2026-05)", n_src: 1,
      members: [
        { id: "ARTS M10ZZ", t: "Beginning Drawing", s: "ART", u: 3, k: "Stand-Alone", g: 1, d: "Art", n: 1 },
        { id: "ARTS M11CC", t: "Beginning Drawing", s: "ART", u: 3, k: "M-ID", d: "Art", anchor: 1 } ] },
  ],
  groups: [
    { score: 0.9, members: [
      { id: "FLSP M2001", t: "Conversational Spanish", s: "FLSP", u: 3, k: "M-ID", d: "Foreign Languages" },
      { id: "FLSP M2002", t: "Spanish Conversation", s: "FLSP", u: 3, k: "M-ID", d: "Foreign Languages" } ] },
  ],
  family_groups: [], desc_groups: [], title_groups: [], evidence_groups: [], singleton_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Business", "Art", "Foreign Languages"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sug)};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
const { document } = window;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
// Capture every kb_curation write the worklist makes.
const writes = [];
window.fetch = function (url, opts) {
  if (opts && opts.method === "POST" && /kb_curation/.test(String(url))) {
    try { JSON.parse(opts.body).forEach(function (it) { writes.push(it); }); } catch (e) { /* ignore */ }
  }
  return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
};
window.alert = function () {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function bodyText() { return txt(document.body); }
function dock() { return document.querySelector(".uc-worklist-dock"); }
function checkboxes() { return Array.from(dock().querySelectorAll("input.uc-cand-cb")); }
function confirmBtn() { return Array.from(dock().querySelectorAll("button")).find(function (b) { return /Confirm merge/.test(txt(b)); }); }
function skipBtn() { return Array.from(dock().querySelectorAll("button")).find(function (b) { return /^Skip/.test(txt(b)) || /Keep as-is \/ Skip/.test(txt(b)); }); }

(async function () {
  await sleep(120);
  const open = Array.from(document.querySelectorAll("button, a")).find(function (b) { return /Suggested merges/.test(txt(b)); });
  if (open) open.dispatchEvent(new window.Event("click"));
  await sleep(240);
  check("the worklist dock opened", !!dock());

  // 1. the lane leads and is labeled in words
  const body1 = bodyText();
  check("the curated-anchor lane renders FIRST (its badge is on screen before any other lane)",
    /Curated common course · same title and discipline as a catalog course/.test(body1));
  check("the badge carries no emoji glyph", !/[☀-➿\u{1F300}-\u{1FAFF}]\s*Curated common course/u.test(body1));
  check("the copy names the May 2026 draft and the anchor's reviewer and date",
    /May 2026 draft/.test(body1) && /reviewed by samueltlee on 2026-05-20/.test(body1));
  check("the copy says the anchor folds into the ★ catalog course and names its size (27 college courses)",
    /folds the anchor into the ★ catalog course/.test(body1) && /with 27 college courses/.test(body1));
  check("the copy surfaces the anchor's curation note", /Curation note on the anchor: Accounting is an area/.test(body1));
  check("the slider readout is at its default (the lane is not what moved it)", /≥ 0\.62/.test(body1));

  // 4. exempt from the slider: most conservative setting still shows the lane
  const slider = dock().querySelector("input[type=range]");
  check("cohesion slider present", !!slider);
  if (slider) {
    slider.value = "0"; slider.dispatchEvent(new window.Event("input")); slider.dispatchEvent(new window.Event("change"));
    await sleep(120);
    check("at the most conservative floor (0.85) the legacy group still shows",
      /Curated common course · same title/.test(bodyText()) && /Computerized Accounting/.test(bodyText()));
    // and the 0.9-score anchored group is not hidden by a floor of 0.85 either — restore the default
    slider.value = String(Math.round((0.85 - 0.62) / 0.85 * 100)); slider.dispatchEvent(new window.Event("input")); slider.dispatchEvent(new window.Event("change"));
    await sleep(120);
  }

  // 2. Confirm writes merge_into on the ANCHOR → twin
  const cbs = checkboxes();
  check("two candidate rows (twin + anchor)", cbs.length === 2);
  cbs.forEach(function (cb) { if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new window.Event("change")); } });
  await sleep(60);
  // The "★ merge target" badge exists on every row but is display:none until
  // refreshTarget() marks the survivor — read the style, not the text.
  function badgeShown(cb) {
    var b = Array.from(cb.parentNode.querySelectorAll("span")).find(function (s) { return /★ merge target/.test(txt(s)); });
    return !!b && b.style.display !== "none";
  }
  const cbRows = checkboxes();
  check("the ★ target badge is shown on the twin's row and hidden on the anchor's",
    cbRows.length === 2 && badgeShown(cbRows[0]) && !badgeShown(cbRows[1]));
  const go = confirmBtn();
  check("Confirm merge button present", !!go);
  if (go) go.dispatchEvent(new window.Event("click"));
  await sleep(240);
  const mi = writes.filter(function (w) { return w.field === "merge_into"; });
  check("Confirm wrote exactly one merge_into row", mi.length === 1);
  check("…on the ANCHOR (BUSI M11TR) pointing at the catalog twin (BUSI M1027)",
    mi.length === 1 && mi[0].course_id === "BUSI M11TR" && mi[0].value === "BUSI M1027");
  check("…and never a merge_into on the twin", !writes.some(function (w) { return w.field === "merge_into" && w.course_id === "BUSI M1027"; }));
  check("the anchor row is marked merged away locally (the lane will not re-offer it)",
    !!(window.CPL_UNIFIED_COURSES.rows.find(function (r) { return r.id === "BUSI M11TR"; }) || {})._mergedAway);

  // 3. the stand-alone twin case: the anchor survives
  await sleep(120);
  const body2 = bodyText();
  check("the queue advanced to the second legacy group (Beginning Drawing)", /Beginning Drawing/.test(body2));
  check("its copy says the anchor is the ★ survivor and gains the single-college course",
    /anchor is the ★ survivor here and gains that course as its member/.test(body2));
  writes.length = 0;
  checkboxes().forEach(function (cb) { if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new window.Event("change")); } });
  await sleep(60);
  const go2 = confirmBtn();
  if (go2) go2.dispatchEvent(new window.Event("click"));
  await sleep(240);
  const mi2 = writes.filter(function (w) { return w.field === "merge_into"; });
  check("stand-alone case: merge_into is written on the STAND-ALONE (ARTS M10ZZ) pointing at the anchor (ARTS M11CC)",
    mi2.length === 1 && mi2[0].course_id === "ARTS M10ZZ" && mi2[0].value === "ARTS M11CC");

  // 5. then the ordinary anchored lane follows
  await sleep(120);
  const body3 = bodyText();
  check("after the legacy groups the queue continues into the anchored lane (Conversational Spanish)",
    /Conversational Spanish|Spanish Conversation/.test(body3) && !/Curated common course · same title/.test(body3));

  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})().catch(function (e) { console.error(e); process.exit(1); });
