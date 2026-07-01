// TMC Builder — the confidence engine (Session 92 follow-on).
//
// The CO curriculum office manually five-checks every ADT submission (course
// number · title · units · C-ID · description) against the TMC template. The
// engine grades every major slot into a verdict tier (auto / verify / evidence
// / review / open), gates submission on the structural rules ("can't submit
// misaligned"), captures contact HOURS as a placeholder (COCI master report
// with hours requested — pending) + flexible-slot EVIDENCE, and gives the CO
// queue a triage ranking (readiness mix stored in alignments._readiness).
//
// Guards:
//   (1) tiers: hard C-ID → auto; synth c-id.net → verify; tcid → verify;
//       flexible+no evidence → review, flexible+evidence → evidence;
//       title-heuristic → review; empty → open;
//   (2) the meter shows the readiness mix + the submit-gate state;
//   (3) submit gates: unmet select-N / <18 major units BLOCK doSubmitReview
//       (no confirm dialog fires, an error message renders);
//   (4) hours + evidence inputs render, persist to state, and land in the
//       collectPayload alignments (course_hours / evidence / verdict /
//       _readiness) — pinned via the save fetch body;
//   (5) the CO queue renders status chips + readiness cells, ranks
//       submitted-before-reviewed, and (signed-in) exposes Approve / Return
//       which PATCH status + review receipt columns;
//   (6) legacy rows (no verdict/_readiness) degrade gracefully (filled/total
//       fallback; status-derived tier in the panel).
//
// Run from repo root: `npm test` (or `node tests/tmc_confidence.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    id: "test-conf", discipline: "Test Confidence", degree: "AS-T", status: "draft", version: "draft", total_units: 21,
    flexibility: "flexible",
    sections: [
      { name: "Required Core", select: "all", units: "12", slots: [
        { cid: "AAA 100", title: "Alpha Course", units: "3" },          // hard C-ID → auto
        { cid: "BBB 100", title: "Beta Course", units: "3" },           // synth carrier → verify
        { cid: "CCC 100", title: "Gamma Course", units: "3" },          // tcid carrier → verify
        { cid: "DDD 100", title: "Delta Course", units: "3" }           // stays EMPTY → open + gate
      ]},
      { name: "List A", select: 1, units: "3", slots: [
        { cid: null, noncid: true, flexible: true, title: "Any CSU transferable course", units: "3" } // evidence tier
      ]}
    ]
  }]
};
const courses = [
  ["ALP", "1", "Alpha Course", 3, "AAA 100"],                       // hard
  ["BET", "1", "Beta Course", null, "BBB 100", [], 1],              // synth
  ["GAM", "1", "Gamma Course", 3, null, [], 0, ["CCC 100"]],        // tcid
  ["FLX", "9", "Something Transferable", 3, null]                   // flexible pick
];
window.CPL_TMC_COLLEGE_COURSES = { _meta: {}, colleges: ["Test College"], courses: { "0": courses } };
window.CPL_TMC_GE_PATTERNS = { _meta: {}, patterns: [] };
window.CPL_TMC_COLLEGE_ADTS = { _meta: { unmatched_colleges: {} }, extra_tmcs: [], by_college: {
  "Test College": { "test-conf": { b: "in_progress", s: "In Progress", c: "12345", a: "", u: 60, t: "Test Confidence AS-T" } }
}, tmc_totals: {} };

// fetch stub: capture Supabase writes, serve the queue + row loads
const fetches = [];
const queueRows = [
  { college: "Legacy College", tmc_id: "test-conf", tmc_discipline: "Test Confidence", degree_type: "AS-T",
    filled_slots: 3, total_slots: 5, updated_at: "2026-06-30T00:00:00Z", status: "submitted",
    review_note: null, reviewed_by: null, reviewed_at: null, readiness: null },
  { college: "Done College", tmc_id: "test-conf", tmc_discipline: "Test Confidence", degree_type: "AS-T",
    filled_slots: 5, total_slots: 5, updated_at: "2026-07-01T00:00:00Z", status: "approved",
    review_note: "ok", reviewed_by: "map@rccd.edu", reviewed_at: "2026-07-01T00:00:00Z",
    readiness: { auto: 5, verify: 0, evidence: 0, review: 0, open: 0 } },
  // stored-XSS regression: _readiness is ANON-writable jsonb — a string value
  // must render as a coerced 0, never as markup
  { college: "Evil College", tmc_id: "test-conf", tmc_discipline: "Test Confidence", degree_type: "AS-T",
    filled_slots: 1, total_slots: 5, updated_at: "2026-06-29T00:00:00Z", status: "submitted",
    review_note: null, reviewed_by: null, reviewed_at: null,
    readiness: { auto: "<img src=x onerror=window.__xss=1>", verify: 0, evidence: 0, review: 0, open: 0 } }
];
const legacyRowFull = {
  college: "Legacy College", tmc_id: "test-conf", alignments: {
    "0:0": { cid: "AAA 100", slot_title: "Alpha Course", slot_units: "3", subj: "ALP", num: "1",
             title: "Alpha Course", units: 3, course_cid: "AAA 100", status: "ok" } // LEGACY: no verdict
  }, notes: "", contact_name: "", contact_email: "", review_note: null, reviewed_by: null, reviewed_at: null
};
window.fetch = function (url, opts) {
  fetches.push({ url: String(url), opts: opts || {} });
  const u = String(url);
  if (u.indexOf("status=in.") !== -1)
    return Promise.resolve({ ok: true, json: () => Promise.resolve(queueRows) });
  if (u.indexOf("college=eq.Legacy") !== -1 && (!opts || !opts.method))
    return Promise.resolve({ ok: true, json: () => Promise.resolve([legacyRowFull]) });
  return Promise.resolve({ ok: true, json: () => Promise.resolve([]), text: () => Promise.resolve("") });
};

// signed in from the start (boot is one-shot, so the session must pre-exist):
// base64url payload — the stored token is validated as a well-formed JWT
const fakeJwt = "xx." + Buffer.from(JSON.stringify({ email: "map@rccd.edu", exp: 9999999999 })).toString("base64url") + ".yy";
window.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: fakeJwt, email: "map@rccd.edu", exp: Date.now() + 3600000 }));

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);
window.CPL_TMC_BUILDER.boot();

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function rowFor(re) {
  return Array.prototype.filter.call(document.querySelectorAll("#tab-tmc-builder .tmc-listrow"),
    (r) => re.test(txt(r)))[0];
}

(async function () {
  selectVal(document.getElementById("tmc-college-sel"), "Test College");
  await sleep(0);
  selectVal(document.getElementById("tmc-status-filter"), "all");
  await sleep(0);
  rowFor(/Test Confidence/).click();
  await sleep(0);

  // (1) verdict chips per tier
  const chips = Array.prototype.map.call(document.querySelectorAll("#tab-tmc-builder .tmc-vd"), txt);
  check("hard C-ID slot renders ✓ auto", chips.some((c) => /✓ auto/.test(c)));
  check("synth + tcid slots render ≈ verify (2)", chips.filter((c) => /≈ verify/.test(c)).length === 2);

  // flexible slot: pick the FLX course manually
  const api = window.CPL_TMC_BUILDER;
  check("builder exposes boot (sanity)", typeof api.boot === "function");
  // pick via the picker UI: open the flexible slot's picker (5th slot btn)
  const btns = document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn");
  check("5 slot pickers render", btns.length === 5);
  btns[4].click();
  await sleep(0);
  const opt = Array.prototype.filter.call(
    document.querySelectorAll("#tab-tmc-builder .tmc-pop .tmc-opt"), (o) => /FLX\s*9/.test(txt(o)))[0];
  check("flexible slot's picker lists the local course", !!opt);
  opt.click();
  await sleep(0);

  // flexible w/o evidence → ⚠ review; add evidence → 📎 evidence
  let flexChips = Array.prototype.map.call(document.querySelectorAll("#tab-tmc-builder .tmc-vd"), txt);
  check("flexible slot without evidence renders ⚠ review", flexChips.some((c) => /⚠ review/.test(c)));
  const evIn = document.querySelector("#tab-tmc-builder .tmc-ev-in");
  check("flexible slot renders the evidence input", !!evIn);
  evIn.value = "https://assist.org/agreement/123";
  evIn.dispatchEvent(new window.Event("change"));
  await sleep(0);
  flexChips = Array.prototype.map.call(document.querySelectorAll("#tab-tmc-builder .tmc-vd"), txt);
  check("flexible slot WITH evidence renders 📎 evidence", flexChips.some((c) => /📎 evidence/.test(c)));

  // hours placeholder input persists to state
  const hrsIn = document.querySelector("#tab-tmc-builder .tmc-hrs-in");
  check("hours placeholder input renders", !!hrsIn);
  hrsIn.value = "54";
  hrsIn.dispatchEvent(new window.Event("input"));
  check("hours hint says pending COCI data", /pending COCI data/.test(txt(document.querySelector("#tab-tmc-builder .tmc-hrs-hint"))));

  // (2) meter: readiness mix + gate state (DDD 100 empty → gate unmet)
  const meter = txt(document.getElementById("tmc-meter"));
  check("meter shows the readiness mix", /Readiness:/.test(meter) && /auto/.test(meter) && /verify/.test(meter));
  check("meter flags unmet submit gates", /submit gate/.test(meter) && /⛔/.test(meter));

  // (3) submit blocked while a Required-Core slot is empty — no confirm fires
  let confirmed = 0;
  window.confirm = function () { confirmed++; return false; };
  const submitBtn = Array.prototype.filter.call(
    document.querySelectorAll("#tab-tmc-builder .tmc-actions button"), (b) => /Submit for CO review/.test(txt(b)))[0];
  submitBtn.click();
  await sleep(0);
  check("submit is gate-blocked (no confirm dialog)", confirmed === 0);
  check("gate message names the unmet section", /Required Core/.test(txt(document.getElementById("tmc-msg"))));

  // (4) fill the last core slot indirectly? DDD 100 has no carrier — instead
  // verify the payload shape via Save draft (gates don't block drafts)
  const saveBtn = Array.prototype.filter.call(
    document.querySelectorAll("#tab-tmc-builder .tmc-actions button"), (b) => /Save draft/.test(txt(b)))[0];
  const before = fetches.length;
  saveBtn.click();
  await sleep(5);
  const saveCall = fetches.slice(before).filter((f) => f.opts && f.opts.method === "POST" && /tmc_submissions/.test(f.url))[0];
  check("Save draft POSTs to tmc_submissions", !!saveCall);
  const payload = saveCall ? JSON.parse(saveCall.opts.body) : {};
  const al = payload.alignments || {};
  check("payload carries _readiness", al._readiness && typeof al._readiness.auto === "number");
  check("payload slot carries verdict", al["0:0"] && al["0:0"].verdict === "auto");
  check("payload slot carries course_hours", al["0:0"] && al["0:0"].course_hours === "54");
  const flexKey = Object.keys(al).filter((k) => al[k] && al[k].evidence)[0];
  check("payload flexible slot carries the evidence", !!flexKey && /assist\.org/.test(al[flexKey].evidence));

  // (4b) units capture for an unknown-units (synth) course feeds the total
  const unIn = document.querySelector("#tab-tmc-builder .tmc-un-in");
  check("units input renders on the unknown-units synth course", !!unIn);
  unIn.value = "3";
  unIn.dispatchEvent(new window.Event("input"));
  unIn.dispatchEvent(new window.Event("change"));
  await sleep(0);
  check("entered units count toward Total Units (12)", /Total Units:\s*12\b/.test(txt(document.getElementById("tmc-meter"))));

  // (5) the CO queue
  selectVal(document.getElementById("tmc-status-filter"), "requested");
  await sleep(5);
  const reqRows = document.querySelectorAll("#tab-tmc-builder .tmc-req-row");
  check("queue renders all 3 rows", reqRows.length === 3);
  check("submitted rows rank before approved", /Done College/.test(txt(reqRows[2])));
  const legacyRow = Array.prototype.filter.call(reqRows, (r) => /Legacy College/.test(txt(r)))[0];
  const doneRow = Array.prototype.filter.call(reqRows, (r) => /Done College/.test(txt(r)))[0];
  const evilRow = Array.prototype.filter.call(reqRows, (r) => /Evil College/.test(txt(r)))[0];
  check("status chips render", /needs review/.test(txt(legacyRow)) && /approved/.test(txt(doneRow)));
  check("legacy readiness cell falls back to filled/total", /3\/5 filled/.test(txt(legacyRow)));
  check("readiness cell renders the mix for new rows", /5✓/.test(txt(doneRow)));
  // stored-XSS regression: the string readiness value coerces to 0 — no markup
  check("malicious _readiness renders as coerced 0 (no XSS)",
    /0✓/.test(txt(evilRow)) && !document.querySelector("#tab-tmc-builder img") && !window.__xss);

  // expand the legacy row → panel + legacy tier derivation
  legacyRow.click();
  await sleep(10);
  const panel = document.querySelector("#tab-tmc-builder .tmc-req-detail:not([style*='none']) .tmc-req-panel");
  check("review panel renders the per-slot table", /Alpha Course/.test(txt(panel)) && /ALP\s*1/.test(txt(panel)));
  check("legacy ok-status slot derives ✓ auto (not ⚠ review)", /✓ auto/.test(txt(panel)));
  // the signed-out branch of the SAME conditional renders the sign-in hint
  // instead of the buttons (boot is one-shot, so pin the gate at source level)
  check("signed-out branch gates the buttons on state.email",
    /if \(state\.email\) \{[\s\S]{0,900}?Approve/.test(builderSrc) &&
    /Sign in as a curator \(above\) to approve/.test(builderSrc));

  // (5 cont.) signed-in review actions PATCH the receipt columns
  const approveBtn = Array.prototype.filter.call(panel.querySelectorAll("button"), (b) => /Approve/.test(txt(b)))[0];
  check("signed-in: Approve button renders", !!approveBtn);
  if (approveBtn) {
    const b4 = fetches.length;
    approveBtn.click();
    await sleep(5);
    // SERVER-gated: the review rides the tmc_review_submission RPC with the
    // reviewer's JWT as the Authorization bearer — never a bare-anon PATCH
    const rpc = fetches.slice(b4).filter((f) => f.opts && f.opts.method === "POST" && /rpc\/tmc_review_submission/.test(f.url))[0];
    check("Approve POSTs the server-gated review RPC", !!rpc);
    check("the RPC call carries the reviewer's Authorization bearer",
      !!rpc && /^Bearer /.test((rpc.opts.headers || {}).Authorization || ""));
    const pb = rpc ? JSON.parse(rpc.opts.body) : {};
    check("RPC body carries p_status=approved for the right row",
      pb.p_status === "approved" && pb.p_college === "Legacy College" && pb.p_tmc_id === "test-conf");
    const noPatch = !fetches.slice(b4).some((f) => f.opts && f.opts.method === "PATCH" && /tmc_submissions/.test(f.url));
    check("no direct anon PATCH of the review columns", noPatch);
  } else {
    check("Approve POSTs the server-gated review RPC", false);
    check("the RPC call carries the reviewer's Authorization bearer", false);
    check("RPC body carries p_status=approved for the right row", false);
    check("no direct anon PATCH of the review columns", false);
  }

  // (6) the backlog proxy computes on expand
  const backlog = document.querySelector("#tab-tmc-builder .tmc-backlog");
  check("backlog proxy <details> renders", !!backlog);
  if (backlog) {
    backlog.open = true;
    backlog.dispatchEvent(new window.Event("toggle"));
    await sleep(60);
    check("backlog ranks the in-progress pair with computed coverage",
      /Test College/.test(txt(backlog)) && /slots C-ID-coverable/.test(txt(backlog)));
  } else {
    check("backlog ranks the in-progress pair with computed coverage", false);
  }

  let failed = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed."));
  process.exit(failed ? 1 : 0);
})();
