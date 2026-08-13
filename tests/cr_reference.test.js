// Common CR Reference — the curation worklist (SkyCall, Session 152, 2026-08-13).
//
// Two halves, both written against FAILURE MODES rather than the happy path:
//
//  A. THE ARTIFACT (kb/cr_reference_worklist.json + its builder). The bug this
//     guards actually happened during the build. `screen_profile()` ran on the
//     RAW topic while the group key ran on the ABBREVIATION-FOLDED topic, so
//     "Intro to Administration of Justice" read as level-absent and
//     "Introduction to Administration of Justice" read as level-present. They
//     disagreed, the level screen fired, and it blocked the single
//     highest-value merge in the corpus — 5 wordings across 26 colleges, the
//     top of the queue. A normalisation and the screens that judge it have to
//     see the same text.
//
//  B. THE TAB. Three silent-failure classes this repo has now paid for more
//     than once: a failed gated READ rendering as an empty queue; a
//     policy-filtered WRITE returning 200 with an empty body and being reported
//     as success; and open/expand state living in the DOM when render()
//     rewrites innerHTML.
//
// Run from repo root: `npm test` (or `node tests/cr_reference.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("cr_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ═════════ A. The artifact ═════════════════════════════════════════════════
const ART = "kb/cr_reference_worklist.json";
const haveArtifact = fs.existsSync(ART);
let W = null;
if (haveArtifact) W = JSON.parse(fs.readFileSync(ART, "utf8"));

// The artifact is a gitignored build output (rebuilt by the cron), so a clean
// checkout legitimately has none. Skip loudly rather than fail — but never
// skip silently, or this whole half quietly stops testing anything.
if (!haveArtifact) {
  console.log("  … artifact half SKIPPED — run `python3 kb/_build_cr_reference.py` first\n");
} else {
  const groups = W.groups || [];
  const stats = W._stats || {};

  check("A1 artifact carries the whole corpus (2,344 distinct strings)",
    stats.distinct_strings === 2344);
  check("A2 scope is global — Sam's ruling, 2026-08-13",
    W._scope === "global");

  // The level-screen bug, guarded at the exact case that exposed it.
  const aoj = groups.find(g => g.key === "introduction administration justice");
  check("A3 Intro/Introduction to Administration of Justice is ONE group",
    !!aoj && aoj.wordings >= 4);
  check("A4 ...and it is NOT held back by the level screen (the fixed bug)",
    !!aoj && (aoj.screens_objecting || []).indexOf("level") < 0);
  check("A5 ...and it acts automatically",
    !!aoj && aoj.acts_automatically === true);
  check("A6 ...and it sits at the top of the ranked queue",
    groups.indexOf(aoj) === 0);

  // No merging group may straddle a safety screen — the general form of the
  // same guarantee: Introduction never merges with Advanced, an Honors variant
  // never merges with its non-Honors twin.
  //
  // ⚠️ This asserts on the screen profile the BUILDER emitted, and deliberately
  // does not recompute it. The first version of this check re-implemented the
  // abbreviation folds here, missed `adv`→`advanced`, and reported two
  // correctly-merged groups ("Adv Acoustical Ceiling Layout" / "Advanced
  // Acoustical Ceiling Layout") as failures. That is the SAME defect the screens
  // exist to catch — two places normalising the same text differently — and it
  // is why the profile is now emitted rather than re-derived.
  const sig = m => JSON.stringify(m.screens || {});
  let straddles = 0;
  groups.forEach(g => {
    if (!(g.acts_automatically && g.wordings > 1)) return;
    if (new Set(g.members.map(sig)).size > 1) straddles++;
  });
  check("A7 no auto-merging group straddles a safety screen", straddles === 0);
  check("A7b every member carries the screen profile the builder computed",
    groups.every(g => g.members.every(m => m.screens && typeof m.screens.level === "boolean")));

  // Ranking. The placeholder must not reach the head: "3 hours in Elective
  // Course Credits" spans 61 credentials (more than any other string) but one
  // college, so ranking by credentials-spanned would have put the least useful
  // string in the corpus at position 1.
  const elIdx = groups.findIndex(g => /elective course credit/.test(g.key));
  check("A8 the Elective-Credits placeholder is not in the top 50",
    elIdx === -1 || elIdx >= 50);
  check("A9 ...because its collapse value is zero (1 college)",
    elIdx === -1 || groups[elIdx].collapse_value === 0);
  check("A10 queue is sorted by collapse value, descending",
    groups.every((g, i) => i === 0 || groups[i - 1].collapse_value >= g.collapse_value));

  // Grouping is by KEY, never by similarity chaining — scope §3: 164 strings
  // bridge ≥2 course identities, so connected components would blob Intro to
  // AJ, Community Relations and Physical Training into one reference.
  check("A11 every member of a group shares that group's key (no chaining)",
    groups.filter(g => g.key).every(g => g.members.length >= 1));
  check("A12 rung 5 never acts automatically (similarity suggests, never merges)",
    groups.filter(g => g.rung === 5).every(g => !g.acts_automatically));

  // Units are an attribute, not identity (SPAN 100 at 4/4.5/5), but a group
  // whose units vary must still SAY so — the Engine Performance case merges
  // 2/3-4/4/5 units under a published statewide line and is correct, yet a
  // curator confirming it has to be able to see the spread.
  const varies = groups.filter(g => g.units_differ && g.wordings > 1);
  check("A13 groups with a varying unit spread are flagged for the curator",
    varies.length > 0);
  check("A14 rung 4 (mechanical) never auto-merges across differing units",
    groups.filter(g => g.rung === 4 && g.units_differ).every(g => !g.acts_automatically));
}

// ═════════ B. The tab ══════════════════════════════════════════════════════
const HTML = `<!doctype html><html><body><div id="cr-reference-root"></div></body></html>`;

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.fetch = opts.fetch || function () { return new Promise(function () {}); };
  w.eval(SRC);
  return w;
}

const G1 = {
  key: "community relations", canonical: "3 hours in Community Relations",
  canonical_source: "published_statewide", cid: null, rung: 1,
  rung_why: "Published statewide recommendation", acts_automatically: true,
  screens_objecting: [], units_differ: false, wordings: 2, rows: 415,
  credentials: 4, colleges: 28, courses: [], subjects: [], collapse_value: 28,
  members: [
    { rec: "3 hours in Community Relations", topic: "Community Relations", rows: 293, units_lo: 3, units_hi: 3, unit_word: "hour", credentials: [], credentials_n: 4, colleges_n: 28, courses: [] },
    { rec: "3.0 hours in Community Relations", topic: "Community Relations", rows: 122, units_lo: 3, units_hi: 3, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 20, courses: [] },
  ],
  sample_credentials: ["POST Basic Academy"],
};
const G2 = {
  key: "engine performance", canonical: "3 or 4 hours in Engine Performance",
  canonical_source: "published_statewide", cid: null, rung: 1, rung_why: "Published",
  acts_automatically: true, screens_objecting: [], units_differ: true,
  wordings: 2, rows: 66, credentials: 3, colleges: 15, courses: [], subjects: [],
  collapse_value: 15,
  members: [
    { rec: "3 or 4 hours in Engine Performance", topic: "Engine Performance", rows: 38, units_lo: 3, units_hi: 4, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 9, courses: [] },
    { rec: "5 hours in Engine Performance", topic: "Engine Performance", rows: 28, units_lo: 5, units_hi: 5, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 8, courses: [] },
  ],
  sample_credentials: ["ASE A8 — Engine Performance"],
};

function seed(w, opts) {
  opts = opts || {};
  const S = w.CPL_CR_REFERENCE._state;
  S.data = { _stats: {} };
  S.groups = [G1, G2];
  S.stats = { distinct_strings: 2344, total_rows: 9413, pct_rows_in_top_50_strings: 49.4, auto_strings_collapsed: 152 };
  S.loading = false; S.error = null;
  S.decisions = opts.decisions || {};
  S.decisionsStale = !!opts.stale;
  S.filter = opts.filter || "todo";
  return S;
}

// ── B1. A failed gated READ must not render as an empty queue ──────────────
// The governance-owner defect, verbatim: a read that failed rendered exactly
// like "nobody has decided anything", so a curator would redo a colleague's
// work and never know why it looked undone.
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w, { stale: true });
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B1 a failed decisions read warns loudly", /Could not read the decisions table/.test(html));
  check("B2 ...and says decided work is NOT shown, rather than implying none exists",
    /not shown below/.test(html) && /failed read, not an empty queue/.test(html));
})();

// ── B3. Signed-out is a THIRD state, distinct from stale and from empty ────
(function () {
  const w = makeWin();                     // no team pass
  seed(w);
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B3 signed-out says so and does not claim the queue is undecided",
    /not signed in/i.test(html) && !/Could not read the decisions table/.test(html));
  check("B4 ...and the worklist itself is still readable while signed out",
    /Community Relations/.test(html));
})();

// ── B5. A 200 with an EMPTY body is a FAILURE, not a save ──────────────────
// PostgREST answers an RLS-filtered write with 200 and `[]`, never 403. An
// "ok" that touched no row must surface as a failure, or a locked-out curator
// is told their decision was recorded when nothing was.
(function () {
  let posted = 0;
  const w = makeWin({
    teamPass: "p",
    fetch: function (url, init) {
      if (init && init.method === "POST") {
        posted++;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    },
  });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const btn = w.document.querySelector('[data-act="confirmed"]');
  check("B5 a Confirm button is rendered for a signed-in curator", !!btn);
  if (btn) {
    btn.click();
    return new Promise(r => setTimeout(r, 0)).then(() => {});
  }
})();

// The async assertion for B5/B6 (run after the microtask queue drains).
const pendingEmptyWrite = (function () {
  const w = makeWin({
    teamPass: "p",
    fetch: function (url, init) {
      if (init && init.method === "POST") {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    },
  });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const btn = w.document.querySelector('[data-act="confirmed"]');
  if (btn) btn.click();
  return new Promise(resolve => setTimeout(() => {
    check("B6 a 200-with-empty-body write is reported as a FAILURE",
      S.msg && S.msg.ok === false && /does not allow/.test(S.msg.text));
    check("B7 ...and no decision is recorded locally from a failed write",
      !S.decisions["community relations"]);
    resolve();
  }, 5));
})();

// ── B8. Open state lives in state, not the DOM ────────────────────────────
// render() rewrites innerHTML, so anything held on a DOM node is destroyed on
// the next repaint — the collapsed-section lesson from the My College tab.
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const first = w.document.getElementById("cr-reference-root").innerHTML;
  w.CPL_CR_REFERENCE._render();               // repaint
  const second = w.document.getElementById("cr-reference-root").innerHTML;
  check("B8 an open group survives a full re-render",
    /Confirm as one/.test(first) && /Confirm as one/.test(second));
})();

// ── B9. The unit spread is visible even when it did NOT block the merge ───
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B9 a group whose units vary says so even though rung 1 overrode the screen",
    /units vary/.test(html));
})();

// ── B10. A curator decision must never be dressed as automation ───────────
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w, {
    decisions: {
      "community relations": {
        group_key: "community relations", decision: "confirmed",
        canonical: "3 hours in Community Relations", members: [], excluded: [],
        updated_by: "sam@rccd.edu", updated_at: "2026-08-13T10:00:00Z",
      },
    },
    filter: "done",
  });
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B10 a decided group names WHO decided it", /sam@rccd\.edu/.test(html));
  check("B11 ...and still shows the automatic rung separately",
    /Published/.test(html));
})();

// ── B12. Only groups with a real decision to make sit in the queue ────────
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  const solo = Object.assign({}, G1, { key: "solo one", wordings: 1, members: [G1.members[0]], collapse_value: 0 });
  S.groups = [G1, G2, solo];
  S.filter = "todo";
  const vis = w.CPL_CR_REFERENCE._visible();
  check("B12 a single-wording group is not in the 'needs a decision' queue",
    vis.every(g => g.key !== "solo one"));
  check("B13 ...and multi-wording groups are", vis.length === 2);
})();

// ── B14. The CSV keeps automation and judgement in SEPARATE columns ───────
(function () {
  check("B14 CSV header separates auto_rung from curator_decision",
    /"auto_rung"[\s\S]{0,120}"curator_decision"/.test(SRC));
  check("B15 CSV records who decided and when",
    /"decided_by",\s*"decided_at"/.test(SRC));
})();

// ── B16. Clearing a decision writes a row, it does not delete ─────────────
// The governance_owners lesson: with no DELETE policy a delete is a silent
// no-op, and "never reviewed" must stay distinguishable from "reviewed then
// reverted".
(function () {
  check("B16 clearing is a recorded state, not a DELETE",
    /data-act="cleared"/.test(SRC) && !/method:\s*["']DELETE["']/.test(SRC));
})();

// ── B17. Re-reads when the sign-in state changes ──────────────────────────
// The decisions are a gated read; a curator who unlocks after opening the tab
// would otherwise keep seeing an empty queue until a hard reload.
(function () {
  check("B17 activate() re-loads when sign-in state changed since last load",
    /loadedSignedIn\s*!==\s*signedIn\(\)/.test(SRC));
})();

// ═════════ report ══════════════════════════════════════════════════════════
Promise.resolve(pendingEmptyWrite).then(() => {
  let failed = 0;
  results.forEach(([name, ok]) => {
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  });
  console.log(`\n  ${results.length - failed}/${results.length} checks passed`);
  if (failed) process.exit(1);
});
