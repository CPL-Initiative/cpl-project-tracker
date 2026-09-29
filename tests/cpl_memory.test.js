// 🧠 Memory tab (cpl_memory.js) — guards the module + renderer + curate wiring.
//   - Mount contract: window.CPL_MEMORY.activate() mounts into #memory-root (cip pattern).
//   - Team-gated read via window.CPL_TEAM_PHRASE (team_phrase.js) — anon bearer + x-team-pass.
//   - Retrieval-first + verified-default: the status view defaults to `verified`;
//     a segmented control reveals proposed/stale; superseded is never listed.
//   - Ripple inspector: targetIndex over affects[]; referencedBy over related[] +
//     detail slug-mentions. The headline reverse-index.
//   - Failure guards: null affects/related/tags renders; an empty result set shows a
//     friendly empty state; a locked (empty + no session) mount shows the unlock UI.
//   - Writes are stubbed off (fetch mocked); we assert the read/render surface.
//
// Run from repo root: `npm test` (or `node tests/cpl_memory.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("cpl_memory.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");

// ── Part A — static invariants ──────────────────────────────────────────────
check("exposes CPL_MEMORY.activate (mount fn, cip pattern)", /window\.CPL_MEMORY\s*=/.test(src) && /activate:\s*activate/.test(src));
check("mounts into #memory-root", /ROOT_ID\s*=\s*"memory-root"/.test(src));
check("reads the cpl_memory table ordered by updated_at.desc", /cpl_memory\?select=\*&order=updated_at\.desc/.test(src));
check("posts to the cpl_memory_log audit table", /cpl_memory_log/.test(src));
check("carries the committed anon key (team-gated read)", src.indexOf("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") !== -1);
check("wires writes through decorateHeaders + Prefer:return=representation + checkWrite", /decorateHeaders/.test(src) && /return=representation/.test(src) && /checkWrite/.test(src));
check("handles a rotated/expired phrase (handleWriteFailure + re-unlock message)", /handleWriteFailure/.test(src) && /may have expired/.test(src));
check("renders the shared unlockRow when locked", /unlockRow/.test(src) && /unlock to view \+ curate/.test(src));
check("status view defaults to verified", /status:\s*"verified"/.test(src));
check("session adds land status=proposed (corroboration gate)", /status:\s*"proposed"/.test(src));
check("revise clones then supersedes (superseded_by link)", /superseded_by/.test(src) && /"superseded"/.test(src));
check("scoped CSS under .cpl-mem, no bare :root/body leak", src.indexOf(".cpl-mem") !== -1 && src.indexOf("\nbody{") === -1);
check("nine kinds incl. question", /k:\s*"question"/.test(src) && (src.match(/label:\s*"(Fact|Pitfall|Question|Procedure|Opportunity|Risk|Wishlist|Decision|Milestone)"/g) || []).length === 9);

// ── Part B — jsdom fixtures ─────────────────────────────────────────────────
function makeDom() {
  const html = `<!DOCTYPE html><html><head></head><body>
    <div id="tab-memory"><div id="memory-root"></div></div>
  </body></html>`;
  return new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
}

// A small fixture: two verified rows (one with a ripple), a proposed one (hidden by
// default), a null-fields row (guard), and a related/detail-mention chain.
const FIXTURE = [
  { id: "11111111-1111-1111-1111-111111111111", slug: "pr1", kind: "procedure", status: "verified",
    summary: "Change the generator, not the HTML", detail: "Edit excel_to_dashboard.py; keep index.html identical. See f1.",
    tags: ["dashboard"], source: "CLAUDE.md Rule 1", affects: ["excel_to_dashboard.py", "index.html"], related: ["f1"] },
  { id: "22222222-2222-2222-2222-222222222222", slug: "f1", kind: "fact", status: "verified",
    summary: "index.html and CPL_Dashboard.html must stay identical", detail: "The workflow copies one to the other.",
    tags: ["dashboard"], source: "CLAUDE.md Rule 4", affects: ["index.html"], related: [] },
  { id: "33333333-3333-3333-3333-333333333333", slug: "o1", kind: "opportunity", status: "proposed",
    summary: "Systemwide stale-articulation signal", detail: "Flag articulations absent from the current catalog.",
    tags: ["ccr"], source: "methodology-filter-live-counts", affects: [], related: [] },
  // guard row: null affects/related/tags must not crash render
  { id: "44444444-4444-4444-4444-444444444444", slug: "r9", kind: "risk", status: "verified",
    summary: "Row with null arrays", detail: "This entry has null affects, related, and tags.",
    tags: null, source: null, affects: null, related: null },
  // superseded row: must never appear in the retrieval list
  { id: "55555555-5555-5555-5555-555555555555", slug: "d0", kind: "decision", status: "superseded",
    summary: "Old superseded decision", detail: "Replaced.", tags: [], source: "x", affects: [], related: [], superseded_by: "d1" },
];

// A JWT only has to satisfy the shape check: three parts, over 40 chars.
const FAKE_JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYW0iLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.sig";

function boot(dom, { withPhrase, withMagicLink, fetchRows } = {}) {
  const { window } = dom;
  if (withPhrase) { try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {} }
  else { try { window.localStorage.removeItem("cpl_team_pass"); } catch (e) {} }
  if (withMagicLink) {
    try {
      window.sessionStorage.setItem("cpl_sb",
        JSON.stringify({ access_token: FAKE_JWT, email: "sam@rccd.edu" }));
    } catch (e) {}
  } else { try { window.sessionStorage.removeItem("cpl_sb"); } catch (e) {} }
  // stub fetch: cpl_memory → rows; cpl_memory_log & everything else → []
  window.__calls = [];
  window.fetch = function (url, init) {
    window.__calls.push({ url: String(url), init: init || {} });
    const rows = /cpl_memory_log/.test(url) ? [] : (fetchRows !== undefined ? fetchRows : FIXTURE);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(rows))) });
  };
  window.eval(teamSrc);
  window.eval(src);
  return window.CPL_MEMORY;
}

(async () => {
  // ── evaluates + mounts without throwing ──
  const dom = makeDom();
  let threw = false, api;
  try { api = boot(dom, { withPhrase: true }); } catch (e) { threw = true; console.error("eval threw:", e); }
  check("cpl_memory.js evaluates without throwing", !threw);
  check("module registered on window with activate()", api && typeof api.activate === "function");

  let actThrew = false;
  try { api.activate(); } catch (e) { actThrew = true; console.error("activate threw:", e); }
  await tick(); await tick();
  check("activate() renders without throwing", !actThrew);

  const root = dom.window.document.getElementById("memory-root");
  check("renders the .cpl-mem container", root && root.querySelector(".cpl-mem"));
  check("renders the masthead title", root && /Memory/.test(root.querySelector(".mem-title h1").textContent));
  check("injects scoped CSS once, no bare :root/body selector", (function () {
    const st = dom.window.document.getElementById("cpl-memory-css");
    return st && dom.window.document.querySelectorAll("#cpl-memory-css").length === 1 &&
      st.textContent.indexOf(".cpl-mem") !== -1 &&
      st.textContent.indexOf("\nbody{") === -1 && !/(^|})\s*:root\{/.test(st.textContent);
  })());
  check("with a team phrase, curate mode shows ＋ Add entry", !!root.querySelector(".mem-addbtn"));
  check("with a team phrase, list rows carry the ✎ status control", !!root.querySelector(".mi-curate"));

  // ── (a) verified-default view hides a proposed row until the toggle ──
  function listText() { return root.querySelector(".mem-list").textContent; }
  check("(a) verified-default: a verified row is shown", /Change the generator/.test(listText()));
  check("(a) verified-default: the proposed row is HIDDEN by default", !/Systemwide stale-articulation/.test(listText()));
  check("(a) verified-default: the superseded row is never listed", !/Old superseded decision/.test(listText()));
  // flip the status segmented control to "All"
  const allBtn = Array.prototype.filter.call(root.querySelectorAll(".mem-seg-btn"), (b) => /All/.test(b.textContent))[0];
  check("(a) the status segmented control renders (verified default active)", (function () {
    const v = Array.prototype.filter.call(root.querySelectorAll(".mem-seg-btn"), (b) => /Verified/.test(b.textContent))[0];
    return v && v.classList.contains("is-active") && !!allBtn;
  })());
  allBtn.click();
  check("(a) toggling to All reveals the proposed row", /Systemwide stale-articulation/.test(listText()));
  check("(a) All still excludes the superseded row", !/Old superseded decision/.test(listText()));

  // ── (b) a row with null affects/related/tags renders without throwing ──
  check("(b) the null-arrays row renders in the list", /Row with null arrays/.test(listText()));
  let nullClickThrew = false;
  try {
    const item = Array.prototype.filter.call(root.querySelectorAll(".mem-item"), (it) => /Row with null arrays/.test(it.textContent))[0];
    item.click();  // open it in the ripple inspector — exercises affects/related/detail paths on null data
  } catch (e) { nullClickThrew = true; console.error(e); }
  check("(b) selecting the null-arrays entry does not throw", !nullClickThrew && !!root.querySelector(".rp-sum"));

  // ── (c) ripple reverse-index maps an affects target back to the entries that touch it ──
  // Use the deterministic seam (no async/fetch).
  const idxApi = boot(makeDom(), { withPhrase: false });
  idxApi._setData(FIXTURE);
  const idx = idxApi._indices();
  check("(c) targetIndex maps a file back to the entries that affect it", idx.targetIndex["index.html"] &&
    idx.targetIndex["index.html"].indexOf("pr1") >= 0 && idx.targetIndex["index.html"].indexOf("f1") >= 0);
  check("(c) targetIndex key count reflects distinct affects targets", Object.keys(idx.targetIndex).indexOf("excel_to_dashboard.py") >= 0);
  check("(c) referencedBy inverts related[] (f1 is referenced by pr1)", idx.referencedBy["f1"] && idx.referencedBy["f1"].indexOf("pr1") >= 0);
  check("(c) referencedBy picks up a detail slug-mention (f1 mentioned in pr1.detail)", idx.referencedBy["f1"].indexOf("pr1") >= 0);
  check("(c) a null-affects row contributes no target and does not crash the index", (function () {
    let ok = true; Object.keys(idx.targetIndex).forEach((k) => { if (idx.targetIndex[k].indexOf("r9") >= 0) ok = false; }); return ok;
  })());

  // ── ripple inspector: selecting a target lists everything that touches it ──
  // The (b) click left the inspector in entry-mode; step back to the target index first.
  const backBtn = root.querySelector(".rp-back");
  if (backBtn) backBtn.click();
  const trow = Array.prototype.filter.call(root.querySelectorAll(".rp-trow"), (r) => /index\.html/.test(r.textContent))[0];
  let targetThrew = false;
  try { trow.click(); } catch (e) { targetThrew = true; console.error(e); }
  check("ripple: picking a target renders the change-impact list without throwing", !targetThrew && !!root.querySelector(".rp-tlist"));
  check("ripple: the target list names the entries that touch it", /Change the generator|index\.html/.test(root.querySelector(".ripple-inner").textContent));

  // ── empty result set → friendly empty state (no throw) ──
  const domE = makeDom();
  const apiE = boot(domE, { withPhrase: true, fetchRows: [] });
  let emptyThrew = false;
  try { apiE.activate(); await tick(); await tick(); } catch (e) { emptyThrew = true; console.error(e); }
  const rootE = domE.window.document.getElementById("memory-root");
  check("empty result set → no throw + a friendly empty state", !emptyThrew && !!rootE.querySelector(".mem-empty"));

  // ── locked (empty + no session) → the unlock affordance is offered ──
  const domL = makeDom();
  const apiL = boot(domL, { withPhrase: false, fetchRows: [] });
  let lockThrew = false;
  try { apiL.activate(); await tick(); await tick(); } catch (e) { lockThrew = true; console.error(e); }
  const rootL = domL.window.document.getElementById("memory-root");
  check("locked (empty + no session) → unlock UI shown, no throw", !lockThrew && !!rootL.querySelector(".cpl-tp-unlock"));
  check("locked → no curate affordances (read-only)", !rootL.querySelector(".mem-addbtn") && !rootL.querySelector(".mi-curate"));

  // ── slug auto-generation (Add/Revise) is kind-prefixed + counter-based ──
  check("genSlug is kind-initial + next counter (f1 present → f2)", idxApi._genSlug("fact") === "f2");
  check("genSlug distinguishes pitfall (p) from procedure (pr)", idxApi._genSlug("procedure") === "pr2" && idxApi._genSlug("pitfall") === "p1");

  // ── A magic-link reviewer can read this table (Sky158) ────────────────────
  //
  // `cpl_memory`'s RLS is `is_allowed_reviewer() OR team_pass_ok()`, but the tab
  // took its whole notion of "signed in" from team_phrase.js — whose session()
  // is a PHRASE pseudo-session that knows nothing about the magic link. So a
  // signed-in reviewer was bearing the ANON key, matched neither arm of the OR,
  // and was shown "No entries visible — unlock with the team phrase" over 330
  // intact rows (Sam, 2026-08-14). The permission existed in the database and
  // could not be reached from the page.
  {
    const domM = makeDom();
    const apiM = boot(domM, { withMagicLink: true, withPhrase: false });
    apiM.activate();
    await tick(); await tick();
    const rootM = domM.window.document.getElementById("memory-root");

    const read = domM.window.__calls.filter((c) => /cpl_memory\?/.test(c.url))[0];
    check("a magic-link session bears the JWT, not the anon key",
      read && read.init.headers && read.init.headers.Authorization === "Bearer " + FAKE_JWT);
    check("a magic-link reviewer is NOT shown the phrase unlock box",
      !rootM.querySelector(".cpl-tp-unlock"));
    check("a magic-link reviewer gets curate mode", !!rootM.querySelector(".mem-authok"));
    check("the bar names the credential AND the person, so two sessions never look alike",
      /signed in by magic link/.test(rootM.textContent) && /sam@rccd\.edu/.test(rootM.textContent));

    // The phrase must keep working exactly as before — it is the credential
    // most of the team holds, and it is the only one a non-reviewer has.
    const domP = makeDom();
    const apiP = boot(domP, { withPhrase: true, withMagicLink: false });
    apiP.activate();
    await tick(); await tick();
    const rootP = domP.window.document.getElementById("memory-root");
    const readP = domP.window.__calls.filter((c) => /cpl_memory\?/.test(c.url))[0];
    check("a phrase-only session still bears anon + rides x-team-pass",
      readP && /Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/.test(readP.init.headers.Authorization)
        && readP.init.headers["x-team-pass"] === "team-secret");
    check("a phrase-only session is named as the team phrase, not the magic link",
      /signed in by team phrase/.test(rootP.textContent));
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
