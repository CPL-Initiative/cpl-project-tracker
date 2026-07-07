// Regression tests for the CER token-refresh-before-write fix (2026-07-07).
//
// Failure mode guarded: credential_reference.js's getSession() deliberately
// keeps an EXPIRED session alive whenever a refresh_token exists, but the tab
// never renewed the access token before kb_curation writes — so ~1h after a
// magic-link sign-in every triage Save / Curate write 401'd silently into a
// dead "retry" state while the UI still showed signed-in ("the tab stopped
// working", Sam's 2026-07-07 triage session). Same class as the raci.js
// Session-77 ensureFresh fix — docs/kb-notes/methodology-refresh-token-before-write.md.
//
// Asserts:
//   1. an expired session triggers ONE refresh-token exchange (single-flight,
//      even though the worklist Save fires title+issuer writes in parallel)
//      and the writes carry the RENEWED access token;
//   2. a failed refresh drops the session (sessionStorage cleared, auth widget
//      flips off signed-in) instead of pretending to be authed;
//   3. a 401 on a write drops the session the same way;
//   4. worklist UX: the triage button counts OPEN items and flips to
//      "awaiting fold" when everything is assigned; an empty audit queue
//      renders the queue-clear state.
//
// Run from repo root: `npm test` (or `node tests/cer_token_refresh.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// Two-row baked fixture keeps init fast; the worklist comes from the audit stub.
const fixtureRows = [
  { ut: "Alpha Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
  { ut: "Beta Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
];
const auditStub = {
  _generated_at: "2026-07-07T00:00:00+00:00",
  title_cards: [
    { raw_title: "Raw One", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Two", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  ],
  stats: {},
};

function makeDom(opts) {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: fixtureRows };
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcEByY2NkLmVkdSJ9.b2xk",
    refresh_token: "rt-1", email: "map@rccd.edu",
    exp: Date.now() + (opts.expired ? -1000 : 3600e3),
  }));
  const log = { refreshCalls: 0, writes: [] };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("/auth/v1/token") >= 0) {
      log.refreshCalls++;
      if (opts.refreshFails) return respond({ error: "invalid_grant" }, 400);
      return respond({ access_token: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcEByY2NkLmVkdSJ9.bmV3",
        refresh_token: "rt-2", expires_in: "3600" });
    }
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(opts.emptyAudit
      ? { title_cards: [], stats: {} } : auditStub);
    if (url.indexOf("kb_curation") >= 0 && method === "GET")
      return respond(opts.overlayRows || []);
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, auth: (o.headers || {}).Authorization });
      return respond([], opts.writeStatus || 201);
    }
    return respond([]);
  };
  try { window.eval(src); } catch (e) { check("eval threw: " + e.message, false); }
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scenario1() {
  // Expired session + parallel title/issuer saves → 1 refresh, new token on writes.
  const { window, log } = makeDom({ expired: true });
  await sleep(80);
  const doc = window.document;
  doc.querySelector(".cr-triage-btn").click();
  await sleep(80);
  const tr = doc.querySelector(".cr-wl-table tbody tr");
  check("s1: worklist rendered with rows", !!tr);
  const inp = tr.querySelector(".cr-wl-title-input");
  inp.value = "Alpha Credential";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  tr.querySelector(".cr-wl-save").click();
  await sleep(120);
  check("s1: exactly ONE refresh-token exchange (single-flight)", log.refreshCalls === 1);
  check("s1: both writes fired", log.writes.length === 2);
  check("s1: writes carry the RENEWED token", log.writes.every((w) => /\.bmV3$/.test(w.auth || "")));
  check("s1: row shows ✓ Saved", txt(tr.querySelector(".cr-wl-save")) === "✓ Saved");
  const stored = JSON.parse(window.sessionStorage.getItem("cpl_sb"));
  check("s1: renewed session persisted (rotated refresh token)", stored && stored.refresh_token === "rt-2");
}

async function scenario2() {
  // Expired session + refresh fails → session dropped, no phantom signed-in.
  const { window, log } = makeDom({ expired: true, refreshFails: true });
  await sleep(80);
  const doc = window.document;
  doc.querySelector(".cr-triage-btn").click();
  await sleep(80);
  const tr = doc.querySelector(".cr-wl-table tbody tr");
  const inp = tr.querySelector(".cr-wl-title-input");
  inp.value = "X"; inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  tr.querySelector(".cr-wl-save").click();
  await sleep(120);
  check("s2: no kb_curation write attempted with a dead session", log.writes.length === 0);
  check("s2: session dropped from storage", window.sessionStorage.getItem("cpl_sb") === null);
  check("s2: auth widget no longer shows signed-in", !doc.querySelector("#cr-auth .cr-auth-on"));
  check("s2: save button offers retry", txt(tr.querySelector(".cr-wl-save")) === "retry");
}

async function scenario3() {
  // Fresh token but the write 401s (revoked elsewhere) → session dropped.
  const { window, log } = makeDom({ expired: false, writeStatus: 401 });
  await sleep(80);
  const doc = window.document;
  doc.querySelector(".cr-triage-btn").click();
  await sleep(80);
  const tr = doc.querySelector(".cr-wl-table tbody tr");
  const inp = tr.querySelector(".cr-wl-title-input");
  inp.value = "X"; inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  tr.querySelector(".cr-wl-save").click();
  await sleep(120);
  check("s3: write attempted", log.writes.length > 0);
  check("s3: 401 dropped the session", window.sessionStorage.getItem("cpl_sb") === null);
  check("s3: auth widget flipped off signed-in", !doc.querySelector("#cr-auth .cr-auth-on"));
}

async function scenario4() {
  // Worklist counts: 1 of 2 assigned via overlay → button shows 1 open;
  // assign the other → "awaiting fold"; empty audit → queue-clear message.
  const overlayRows = [
    { course_id: "_UNCLASSIFIED::Raw One", field: "unified_title_assignment",
      value: "Alpha Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-07T14:00:00+00:00" },
  ];
  const { window } = makeDom({ expired: false, overlayRows });
  await sleep(80);
  const doc = window.document;
  doc.querySelector(".cr-triage-btn").click();
  await sleep(80);
  check("s4: button counts OPEN items only", txt(doc.querySelector(".cr-triage-btn")) === "⚠ Triage unclassified (1)");
  check("s4: awaiting-fold note rendered", /fold into the credential layer/.test(txt(doc.querySelector(".cr-worklist"))));
  const rows = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"));
  const openRow = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Two");
  const inp = openRow.querySelector(".cr-wl-title-input");
  inp.value = "Beta Credential"; inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  openRow.querySelector(".cr-wl-save").click();
  await sleep(120);
  check("s4: all-assigned flips the button to awaiting-fold",
    txt(doc.querySelector(".cr-triage-btn")) === "✓ Triage unclassified (2 awaiting fold)");

  const empty = makeDom({ expired: false, emptyAudit: true });
  await sleep(80);
  empty.window.document.querySelector(".cr-triage-btn").click();
  await sleep(80);
  check("s4: empty queue renders the queue-clear state",
    /Queue clear/.test(txt(empty.window.document.querySelector(".cr-worklist"))));
  check("s4: empty queue button reads (0)",
    txt(empty.window.document.querySelector(".cr-triage-btn")) === "✓ Triage unclassified (0)");
}

(async () => {
  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4();
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
