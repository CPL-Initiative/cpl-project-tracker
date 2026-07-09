// Regression tests for the Session-103 worklist additions (2026-07-07):
//
//   A. Triage-view TOGGLE — Sam: "The saved triage still show up on the list;
//      shouldn't we have a toggle that allows me to see all or just the ones
//      needing to be triaged?" Default view hides rows with a saved
//      assignment; "All (N)" restores them.
//   B. ⚡ STAGED pre-seed prefill — Sam: "For pre-seeded items, leave them
//      ready to save but not yet saved." kb/unclassified_preseed.json rows
//      PREFILL the title/issuer inputs (badge + note tooltip) but write
//      NOTHING to Supabase until the curator clicks Save (or the bulk
//      "Save all pre-filled shown" button, which reads the visible inputs —
//      what-you-see-is-what-saves).
//
// Failure modes guarded: prefill leaking into rows that already have a live
// assignment (a curator pick must always win), auto-saving staged values
// without a click, and the toggle hiding still-open rows.
//
// Run from repo root: `npm test` (or `node tests/cer_worklist_preseed.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const fixtureRows = [
  { ut: "Alpha Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
];
const auditStub = {
  _generated_at: "2026-07-07T00:00:00+00:00",
  title_cards: [
    { raw_title: "Raw Assigned", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Preseeded", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Plain", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Preseeded Assigned", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  ],
  stats: {},
};
const preseedStub = {
  staged: {
    "Raw Preseeded": { title: "Water Distribution Operator I",
      issuer: "California Community Colleges", via: "cx", confidence: 0.75,
      note: "Rule 5c fixture" },
    // pre-seed for a row that ALREADY has a live assignment — must NOT prefill
    "Raw Preseeded Assigned": { title: "Wrong Prefill",
      issuer: "Wrong Issuer", via: "cx", confidence: 0.75, note: "" },
  },
};
const overlayRows = [
  { course_id: "_UNCLASSIFIED::Raw Assigned", field: "unified_title_assignment",
    value: "Alpha Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-07T14:00:00+00:00" },
  { course_id: "_UNCLASSIFIED::Raw Preseeded Assigned", field: "unified_title_assignment",
    value: "Curator Pick", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-07T14:00:00+00:00" },
];
const overlayAllRows = auditStub.title_cards.map((c) => ({
  course_id: "_UNCLASSIFIED::" + c.raw_title, field: "unified_title_assignment",
  value: "Some Family", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-07T14:00:00+00:00",
}));

function makeDom(opts) {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: fixtureRows };
  if (opts.signedIn !== false) {
    window.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcEByY2NkLmVkdSJ9.b2xk",
      refresh_token: "rt-1", email: "map@rccd.edu", exp: Date.now() + 3600e3,
    }));
  }
  window.confirm = function () { opts.confirms = (opts.confirms || 0) + 1; return opts.confirmAnswer !== false; };
  const log = { writes: [] };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(auditStub);
    if (url.indexOf("unclassified_preseed.json") >= 0)
      return opts.noPreseed ? respond(null, 404) : respond(preseedStub);
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (url.indexOf("kb_curation") >= 0 && method === "GET")
      return respond(opts.overlayAll ? overlayAllRows : overlayRows);
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, body: o.body && JSON.parse(o.body) });
      return respond([], 201);
    }
    return respond([]);
  };
  try { window.eval(src); } catch (e) { check("eval threw: " + e.message, false); }
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(opts) {
  const ctx = makeDom(opts || {});
  await sleep(80);
  Array.from(ctx.window.document.querySelectorAll(".cr-lane")).find((b) => /Unclassified/.test(b.textContent)).click();
  await sleep(80);
  return ctx;
}

async function scenarioToggle() {
  const { window } = await open({});
  const doc = window.document;
  const rows = () => Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .map((r) => txt(r.querySelector(".cr-wl-rawt")));
  check("toggle: default view = NEEDS-TRIAGE only (assigned rows hidden)",
    rows().join("|") === "Raw Plain|Raw Preseeded");
  const btns = Array.from(doc.querySelectorAll(".cr-wl-toggle-btn"));
  check("toggle: chips carry live counts", txt(btns[0]) === "Needs triage (2)" && txt(btns[1]) === "All (4)");
  check("toggle: needs-triage chip active by default", btns[0].className.indexOf("cr-wl-toggle-on") >= 0);
  btns[1].click();
  await sleep(30);
  check("toggle: 'All' restores every row (assigned included)",
    Array.from(doc.querySelectorAll(".cr-wl-table tbody tr")).length === 4);
  const doneRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Assigned");
  check("toggle: assigned row keeps its ✓ Saved state in All view",
    doneRow && doneRow.className.indexOf("cr-wl-done") >= 0);
  Array.from(doc.querySelectorAll(".cr-wl-toggle-btn"))[0].click();
  await sleep(30);
  check("toggle: switching back re-hides assigned rows",
    Array.from(doc.querySelectorAll(".cr-wl-table tbody tr")).length === 2);
  check("toggle: role=group + aria-label actually land in the DOM",
    doc.querySelector(".cr-wl-toggle").getAttribute("role") === "group"
    && doc.querySelector(".cr-wl-toggle").getAttribute("aria-label") === "Triage view");
  // an in-place per-row save must refresh the chip counts (no full re-render)
  const plain = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Plain");
  const pin = plain.querySelector(".cr-wl-title-input");
  pin.value = "Alpha Credential";
  pin.dispatchEvent(new window.Event("input", { bubbles: true }));
  plain.querySelector(".cr-wl-save").click();
  await sleep(120);
  const chips2 = Array.from(doc.querySelectorAll(".cr-wl-toggle-btn"));
  check("toggle: chip counts refresh after an in-place save",
    txt(chips2[0]) === "Needs triage (1)" && txt(chips2[1]) === "All (4)");
}

async function scenarioAllTriaged() {
  const { window } = await open({ overlayAll: true });
  const doc = window.document;
  check("all-triaged: needs-triage view shows the awaiting-fold note, not a bare table",
    /Nothing needs triage/.test(txt(doc.querySelector(".cr-worklist")))
    && !doc.querySelector(".cr-wl-table"));
  doc.querySelectorAll(".cr-wl-toggle-btn")[1].click();
  await sleep(30);
  check("all-triaged: the All view still lists every saved row",
    doc.querySelectorAll(".cr-wl-table tbody tr").length === 4);
}

async function scenarioPrefill() {
  const { window, log } = await open({});
  const doc = window.document;
  const psRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Preseeded");
  check("prefill: title input pre-filled from the staged plan",
    psRow.querySelector(".cr-wl-title-input").value === "Water Distribution Operator I");
  check("prefill: issuer input pre-filled",
    psRow.querySelector(".cr-wl-iss-input").value === "California Community Colleges");
  check("prefill: ⚡ badge rendered with the lane",
    /pre-seed/.test(txt(psRow.querySelector(".cr-wl-preseed-badge"))));
  check("prefill: badge tooltip carries the note",
    /Rule 5c fixture/.test(psRow.querySelector(".cr-wl-preseed-badge").getAttribute("title")));
  check("prefill: NOTHING auto-saved (ready to save, not saved)", log.writes.length === 0);
  check("prefill: row still counts as OPEN (not ✓ Saved)",
    psRow.className.indexOf("cr-wl-done") < 0);
  const plainRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Plain");
  check("prefill: non-preseeded row stays blank",
    plainRow.querySelector(".cr-wl-title-input").value === "");
  // the row with a LIVE assignment must show the curator's pick, not the preseed
  doc.querySelectorAll(".cr-wl-toggle-btn")[1].click();
  await sleep(30);
  const assignedPs = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Preseeded Assigned");
  check("prefill: live assignment ALWAYS wins over a stale preseed",
    assignedPs.querySelector(".cr-wl-title-input").value === "Curator Pick");
  check("prefill: assigned row carries no ⚡ badge",
    !assignedPs.querySelector(".cr-wl-preseed-badge"));
}

async function scenarioBulkSave() {
  // Session 105 contract: "Save all filled shown" saves EVERY shown,
  // still-unassigned row with a filled title — pre-seeded AND hand-typed
  // (the 2026-07-08 fire-cert fix: hand-completed rows were silently
  // skipped by the old pre-seeded-only bulk).
  const opts = {};
  const { window, log } = await open(opts);
  const doc = window.document;
  const bar = doc.querySelector(".cr-wl-preseed-bar");
  check("bulk: pre-seed bar announces the pre-filled count", /1 row/.test(txt(bar)) && /pre-filled/.test(txt(bar)));
  const btn = doc.querySelector(".cr-wl-saveall");
  check("bulk: save-all button visible when signed in", !!btn && /filled shown/.test(txt(btn)));
  // hand-edit the prefill first — bulk must save the EDITED value
  const psRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Preseeded");
  const inp = psRow.querySelector(".cr-wl-title-input");
  inp.value = "Water Distribution Operator I (edited)";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  // type into ANOTHER (non-preseeded) row — bulk must save it too now
  const plainRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Plain");
  const plainInp = plainRow.querySelector(".cr-wl-title-input");
  plainInp.value = "Hand-typed Credential";
  plainInp.dispatchEvent(new window.Event("input", { bubbles: true }));
  btn.click();
  await sleep(200);
  check("bulk: confirm dialog shown before saving", opts.confirms === 1);
  const bodies = log.writes.map((w) => w.body);
  const psTitle = bodies.find((b) => b && b.field === "unified_title_assignment"
    && b.course_id === "_UNCLASSIFIED::Raw Preseeded");
  const psIss = bodies.find((b) => b && b.field === "issuing_agency_assignment"
    && b.course_id === "_UNCLASSIFIED::Raw Preseeded");
  const plainTitle = bodies.find((b) => b && b.field === "unified_title_assignment"
    && b.course_id === "_UNCLASSIFIED::Raw Plain");
  check("bulk: writes target the ROW'S raw title (course_id), never null",
    !!psTitle && !!psIss);
  check("bulk: saves what the input SHOWS (hand-edit wins)",
    psTitle && psTitle.value === "Water Distribution Operator I (edited)");
  check("bulk: issuer saved alongside",
    psIss && psIss.value === "California Community Colleges");
  check("bulk: hand-typed row saved too (the fire-cert fix)",
    plainTitle && plainTitle.value === "Hand-typed Credential");
  check("bulk: exactly the two filled rows' fields written (2 rows × 2 fields)",
    log.writes.length === 4);
  check("bulk: reviewer stamped from the session",
    psTitle.reviewer_email === "map@rccd.edu");
  check("bulk: hand-typed row flipped to ✓ Saved in place",
    plainRow.className.indexOf("cr-wl-done") >= 0);
  check("bulk: saved row flipped to ✓ Saved in place",
    psRow.className.indexOf("cr-wl-done") >= 0
    && txt(psRow.querySelector(".cr-wl-save")) === "✓ Saved"
    && !!psRow.querySelector(".cr-wl-clear"));
}

async function scenarioDraftSurvivesRerender() {
  // Typed-but-unsaved input must survive a full re-render (the view toggle
  // wiped hand-completed rows on 2026-07-07 — state.wlDraft now keeps them).
  const { window } = await open({});
  const doc = window.document;
  const plainRow = () => Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Plain");
  const inp = plainRow().querySelector(".cr-wl-title-input");
  inp.value = "Draft In Progress";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  // toggle All → Needs triage = two full re-renders
  const chips = () => doc.querySelectorAll(".cr-wl-toggle-btn");
  chips()[1].click();
  await sleep(40);
  chips()[0].click();
  await sleep(40);
  check("draft: typed title survives view-toggle re-renders",
    plainRow().querySelector(".cr-wl-title-input").value === "Draft In Progress");
}

async function scenarioBulkDeclined() {
  const opts = { confirmAnswer: false };
  const { window, log } = await open(opts);
  const doc = window.document;
  doc.querySelector(".cr-wl-saveall").click();
  await sleep(80);
  check("bulk-declined: cancelling the confirm writes nothing", log.writes.length === 0);
}

async function scenarioSignedOut() {
  const { window, log } = await open({ signedIn: false });
  const doc = window.document;
  check("signed-out: no bulk save button", !doc.querySelector(".cr-wl-saveall"));
  const psRow = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
    .find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Preseeded");
  check("signed-out: prefill still visible for review",
    psRow.querySelector(".cr-wl-title-input").value === "Water Distribution Operator I");
  check("signed-out: inputs disabled", psRow.querySelector(".cr-wl-title-input").disabled);
  check("signed-out: nothing written", log.writes.length === 0);
}

async function scenarioNoPreseedFile() {
  const { window } = await open({ noPreseed: true });
  const doc = window.document;
  check("no-file: worklist renders without the preseed file (soft-fail)",
    doc.querySelectorAll(".cr-wl-table tbody tr").length === 2);
  // Session 105: the bar is now the SAVE-ALL bar — it renders whenever open
  // rows are shown to a signed-in curator (hand-typed rows are bulk-savable
  // even with no pre-seed plan), just without any ⚡ pre-filled announcement.
  const noBar = doc.querySelector(".cr-wl-preseed-bar");
  check("no-file: save-all bar renders WITHOUT a ⚡ pre-filled count",
    !!noBar && txt(noBar).indexOf("⚡") < 0 && !!noBar.querySelector(".cr-wl-saveall"));
}

(async () => {
  await scenarioToggle();
  await scenarioAllTriaged();
  await scenarioPrefill();
  await scenarioBulkSave();
  await scenarioDraftSurvivesRerender();
  await scenarioBulkDeclined();
  await scenarioSignedOut();
  await scenarioNoPreseedFile();
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
