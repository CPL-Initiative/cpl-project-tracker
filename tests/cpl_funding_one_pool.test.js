// CPL Implementation Funding — THE ONE-POOL MODEL (adopted by Sam 2026-08-31).
//
// The port's anchor suite. The locked mock (docs/visuals/2026-08-31-if-tab-
// simplified.html, artifact "CPL Implementation Funding") is the design of
// record; its allocation figures of record are asserted here against the LIVE
// model: one pool of $25,240,308 over 118 institutions (115 colleges + NOCE /
// SD Cont. Ed / Calbright as ordinary rows; Mt. SAC Noncredit rides the
// Mt. San Antonio row), base $150,000 / cap $400,000 on the COMBINED award,
// 51 institutions at the base and 7 at the cap, the trio holding $482,669 by
// origination and $1,300,738 of noncredit shares riding college awards —
// $1,783,407 of noncredit funding on the pool's face.
//
// Earning is NOT asserted against the mock's earned figure ($7,900,711): the
// mock scored post-clamp awards while the tab's targets ride the pre-bounds
// entitlement (the floor raises funding, not the bar) — the mock's own method
// note says the live tab "can read higher". What IS asserted is the earning
// POLICY: credit shares earn (advances included), noncredit shares read $0
// with NO advance until their feeds report (F1), the trio earns nothing until
// origination posts (N2 b) — and the CUTOVER: the day the feed carries the
// nc_* keys and the origination block, the same wiring pays real dollars with
// no consumer edit.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_one_pool.test.js`).
const {
  check,
  freshDom,
  boot,
  D,
  finish,
} = require("./lib/cpl_funding_harness.js");

const POOL = 25240308;

// ── Part A — the allocation: one solve, the mock's figures of record ───────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  const eff = T._effective();

  check("A1: the effective dials are the adopted ones — base $150,000 / cap $400,000",
    eff.pool.floor_window === 150000 && eff.pool.cap_window === 400000);
  check("A2: one pool — net to institutions is the amendment's $25,240,308 to the penny",
    Math.abs(eff.pool.net_college - POOL) < 0.5);
  check("A3: the roster is 118 institutions (115 colleges + the noncredit-only three)",
    eff.pool.institutions === 118);
  check("A4: the trio are rows by their shorts; Mt. SAC Noncredit is NOT a row (rides Mt. San Antonio)",
    ["NOCE", "SD Cont. Ed", "Calbright"].every(function (k) { return m.W[k] > 0; }) &&
    !("Mt. SAC NC" in m.W));
  const sumW = Object.keys(m.W).reduce(function (s, k) { return s + m.W[k]; }, 0);
  check("A5: the pool lands fully allocated — Σ awards = the pool (conservation)",
    Math.abs(sumW - POOL) < 1);
  check("A6: 51 institutions at the base and 7 at the cap (the mock's figures of record)",
    eff.pool.at_floor === 51 && eff.pool.at_cap === 7);
  check("A7: every award respects the window",
    Object.keys(m.W).every(function (k) { return m.W[k] >= 150000 - 0.5 && m.W[k] <= 400000 + 0.5; }));
  check("A8: the noncredit decomposition matches the figures of record — trio $482,669 held by " +
        "origination, $1,300,738 riding college awards",
    Math.abs(eff.pool.nc_only_held_by_origination - 482669) < 50 &&
    Math.abs(eff.pool.nc_college_shares - 1300738) < 50);
  check("A9: $1,783,407 of the pool is noncredit funding on its face (the SYSTEM NC figure)",
    Math.abs((eff.pool.nc_only_held_by_origination + eff.pool.nc_college_shares) - 1783407) < 100);
  // The decomposition is per-award arithmetic, not a second solve: CR + NC = W.
  const mtSac = T._alloc("Mt San Antonio");
  check("A10: an award's CR and NC shares sum to its one combined award (Mt. San Antonio, at the cap)",
    Math.abs((mtSac.cr_award + mtSac.nc_award) - mtSac.total) < 1 &&
    Math.abs(mtSac.total - 400000) < 1 && mtSac.capped === true);
  // Mt. San Antonio's NC share rides ITS OWN FTES split (10,829.3 of 37,633.7).
  check("A11: the decomposition is by FTES share (Mt. San Antonio ≈ 28.8% noncredit)",
    Math.abs(mtSac.nc_award / mtSac.total - 10829.3 / (26804.4 + 10829.3)) < 0.001);
  check("A12: a no-noncredit college's award has no NC share (Taft) — the checkable-claim row",
    (function () { const a = T._alloc("Taft"); return a && a.nc_award === 0 && a.floored; })());

  // ── Part B — the earning policy on today's feed ──────────────────────────
  const ea = (function () {
    // earnAgg is internal; read the policy through the public per-college API.
    const trio = ["NOCE", "SD Cont. Ed", "Calbright"].map(function (k) { return T._alloc(k); });
    return { trio: trio };
  })();
  check("B1: the trio earn $0 today — no advances on origination (N2 b)",
    ea.trio.every(function (a) { return a.earned_total === 0 && a.earned_advance === 0; }));
  check("B2: a college's noncredit share earns $0 today (F1 — listed, $0 until the feeds report)",
    (function () { const a = T._alloc("Mt San Antonio"); return (a.earned_nc || 0) === 0; })());
  check("B3: credit shares DO earn on today's feed (the credit machinery is intact)",
    (function () { const a = T._alloc("Bakersfield"); return a.earned_total > 0; })());
  check("B4: the trio's noncredit priorities resolve 'undelivered' — never 'gap' (which would advance)",
    (function () {
      const ps = T._ncPrios("NOCE", "1");
      return ps && ps.length === 3 && ps.every(function (p) {
        return p.status === "undelivered" && p.earned === 0 && p.cap > 0;
      });
    })());
  check("B5: the retired 'NC:<short>' key form still resolves (consumer compatibility)",
    (function () { const ps = T._ncPrios("NC:Calbright", "1"); return ps && ps.length === 3; })());
  check("B6: _ncAward is the decomposition share, not a second pool's figure",
    Math.abs(T._ncAward("Mt San Antonio") - mtSac.nc_award) < 0.5 &&
    Math.abs(T._ncAward("NOCE") - T._alloc("NOCE").total) < 0.5);
}

// ── Part C — the cutover: feeds deliver, the same wiring pays ──────────────
// Sam's own mechanism ("since all will be null for now, we can calculate off
// that until the real data hits"): the day funding/_build_funding_performance
// emits nc_* keys and the origination block, money moves with NO consumer
// edit. Simulated here with a synthetic artifact.
{
  const { window } = freshDom();
  // A synthetic perf artifact: statewide carries the nc_* keys (srcDelivered's
  // question), Cypress posts noncredit-origin transcribed units, and NOCE's
  // scoped origination cut appears under origination.in_scope.
  window.CPL_FUNDING_PERF = {
    as_of: "2026-12-01",
    statewide: { pe: 100, p2: 10, p3: 50, pp: 5, pe_u: 1000, p3_u: 500, pp_u: 25,
      pa: 40, pa_u: 400, ppa: 20, ppa_u: 200,
      nc_pe: 30, nc_pe_u: 300, nc_pa: 20, nc_pa_u: 200, nc_pt: 10, nc_pt_u: 3000 },
    colleges: {
      Cypress: { pe: 20, pe_u: 200, p3: 10, p3_u: 100, ppa: 5, ppa_u: 50,
        nc_pe: 8, nc_pe_u: 240, nc_pa: 6, nc_pa_u: 180, nc_pt: 5, nc_pt_u: 900 }
    },
    origination: {
      in_scope: {
        NOCE: { nc_pe: 8, nc_pe_u: 240, nc_pa: 6, nc_pa_u: 180, nc_pt: 5, nc_pt_u: 900 }
      }
    },
    feeders: { NOCE: { pe: 8 } }
  };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("C1: with the nc_* keys delivered, a college's noncredit share EARNS on them",
    (function () { const a = T._alloc("Cypress"); return (a.earned_nc || 0) > 0; })());
  check("C2: NOCE earns by its SCOPED origination cut once the feed carries it — no consumer edit",
    (function () {
      const ps = T._ncPrios("NOCE", "1");
      return ps.some(function (p) { return p.status === "earned" && p.earned > 0; });
    })());
  check("C3: SD Cont. Ed (no origination posted) reads a measured $0 — 'none', not an advance",
    (function () {
      const ps = T._ncPrios("SD Cont. Ed", "1");
      return ps.every(function (p) { return p.earned === 0; }) &&
        ps.every(function (p) { return p.status === "none" || p.status === "suppressed"; });
    })());
  check("C4: N1 a — NOCE's eligibility swaps the veteran-JST gate for exhibits-in-MAP, met via F1",
    (function () {
      T._setElig({ coordOk: true, coord: {}, optinRow: {} });
      // The baked extra_reqs is [] — the vet-JST requirement lives in the LIVE
      // shared config, so mirror it here (the N1 a swap only exists where the
      // requirement it replaces does).
      T._setShared({ extraReqs: ["Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP"] });
      T._setSubview("model");   // re-render with eligibility loaded
      const doc = window.document;
      const row = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row"))
        .find(function (r) { return /NOCE/.test(r.textContent); });
      if (!row) return false;
      const elig = row.querySelector("td[title*='exhibits in MAP']");
      // The F1 feed carries NOCE pe=8 → the exhibits sector reads "yes".
      return !!elig && /exhibits in MAP.*: yes/.test(elig.getAttribute("title"));
    })());
}

// ── Part D — the rendered tab (the locked mock's surfaces) ─────────────────
{
  const { window } = freshDom();
  boot(window);
  const doc = window.document;
  const T = window.CPL_FUNDING_TAB;
  const text = doc.getElementById("cplFundingMount").textContent;

  check("D1: the Summary renders at the top with Sam's verbatim first bullet (reaction round 2, " +
        "2026-08-31) — the origination-wait bullet is deleted, and 'on its face' is banned",
    (function () {
      const sum = doc.querySelector(".cplfund-summary");
      if (!sum) return false;
      const t = sum.textContent;
      return /Allocation balances:/.test(t) &&
        /is allocated based on FTES size/.test(t) &&
        /ready for distribution based on measurable outcomes/.test(t) &&
        !/waits on the origination feed/.test(t) &&
        !/on its face/.test(t);
    })());
  check("D2: no lane switch anywhere (R1)", !doc.querySelector("#cplFundLane"));
  check("D3: no paired noncredit rows and no NC SYSTEM row — one row per institution (R6)",
    !doc.querySelector(".cplfund-ncrow") && !doc.querySelector(".cplfund-ncsysrow"));
  check("D4: exactly ONE SYSTEM row, carrying the CR/NC award pair",
    doc.querySelectorAll(".cplfund-systemrow").length === 1 &&
    doc.querySelectorAll(".cplfund-systemrow .cf-award").length === 2);
  check("D5: the eligibility column is ON by default (Sam's R10 veto)",
    !!doc.querySelector('.cplfund-table th[data-sort="elig"]') &&
    !(JSON.parse(window.localStorage.getItem("cplfund_cols_v1") || "{}").college || {}).elig);
  check("D6: CR award and NC award columns head the table",
    !!doc.querySelector('th[data-sort="cr_award"]') && !!doc.querySelector('th[data-sort="nc_award"]'));
  check("D7: the institution list is alphabetical by default (Alameda before Bakersfield, " +
        "and the trio interleaved — Calbright between Cabrillo and Canada)",
    (function () {
      const names = Array.from(doc.querySelectorAll(".cplfund-row td:nth-child(2) .cplfund-instname"))
        .map(function (e) { return e.textContent; });
      const iCal = names.indexOf("Calbright");
      return names.length === 118 && iCal > 0 &&
        names[iCal - 1].localeCompare("Calbright") < 0 &&
        names[iCal + 1].localeCompare("Calbright") > 0;
    })());
  check("D8: chips are ghosted WORDS — 'at base' / 'at cap' / 'NC only' (no ⬆/⬇ glyphs)",
    /at base/.test(text) && /at cap/.test(text) && /NC only/.test(text) &&
    !/[⬆⬇]/.test(doc.getElementById("cplFundTable").textContent));
  check("D9: section titles carry Sam's renames (2026-08-31)",
    /Funding Breakdown/.test(text) && /Eligibility Requirements/.test(text) &&
    /Three Priority Outcome-Based Allocations/.test(text) &&
    /Funding Outcomes Required by/.test(text));
  check("D10: the goals title links to the statute (california.public.law)",
    !!doc.querySelector('a[href*="california.public.law/codes/education_code_section_78093.2"]'));
  check("D11: the hero card is 'Total credit and noncredit potential awards'; no carve-out CARD " +
        "renders (the hero's own note explains the line's absence — that mention is the mock's)",
    /Total credit and noncredit potential awards/.test(text) &&
    !doc.querySelector(".cplfund-card.feeder") &&
    !/NONCREDIT SUPPORT \(carve-out\)/.test(text));
  check("D12: the bounds fold carries Sam's wording",
    /Show the institutions with Base and Cap funding/.test(text));
  check("D13: the earning-rules fold states the restriction and origination — with NO mention of " +
        "advances and NO reference to an unshipped feed (Sam, 2026-09-01)",
    /earning rules for noncredit/i.test(text) &&
    /earn by origination/i.test(text) &&
    !/No advances/i.test(text) &&
    !/until (the|their|its|those) [^.]{0,50}(feeds?|measures) report/i.test(text) &&
    !/feed lands/i.test(text) && !/awaits origination/i.test(text) &&
    !/listed from day one/i.test(text) &&
    // the payment-advance concept is banned everywhere on the rendered tab;
    // the statute's "Advancing career attainment" and "advance the …
    // priority outcomes" (to further) are the allowed senses
    !/\badvances?\b(?! (the|each|Vision))/i.test(text.replace(/Advancing career attainment[^.]*\./g, "")));
  check("D14: the priority cards read Current Total / Total Possible (Sam's labels)",
    /Current Total/.test(text) && /Total Possible/.test(text));
  check("D15: a trio row expands to the origination note (not a priority table)",
    (function () {
      T._setSubview("model");
      const st = window.CPL_FUNDING_TAB;
      // open Calbright's row through the public state path: click its caret
      const row = Array.from(doc.querySelectorAll(".cplfund-row"))
        .find(function (r) { return /Calbright/.test(r.textContent); });
      if (!row) return false;
      row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
      const det = doc.querySelector(".cplfund-detail .cplfund-ncorigin");
      return !!det && /Earns by origination/.test(det.textContent) &&
        /stand-in/.test(det.textContent);   // N3 a on the Calbright expand
    })());
  check("D16: a college row expands to the 7-column detail table (CR/NC funding · Target · " +
        "Actual · Current Total · Total Possible)",
    (function () {
      const row = Array.from(doc.querySelectorAll(".cplfund-row"))
        .find(function (r) { return /Bakersfield/.test(r.textContent); });
      if (!row) return false;
      row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
      const tbl = doc.querySelector(".cplfund-dtl-table");
      if (!tbl) return false;
      const heads = Array.from(tbl.querySelectorAll("th")).map(function (h) { return h.textContent; });
      return heads.join("|").indexOf("CR funding") >= 0 && heads.join("|").indexOf("NC funding") >= 0 &&
        heads.join("|").indexOf("Total Possible") >= 0;
    })());
  check("D17: the memo's allocation table is one-pool shaped (credit/noncredit shares, no carve-out)",
    (function () {
      const h = T._buildMemo("memo");
      return /Total credit and noncredit potential awards/.test(h) &&
        /Noncredit share/.test(h) && !/carve-out/i.test(h) && /NOCE|North Orange/.test(h);
    })());
  check("D18: the CSV is one line per institution with the CR/NC share columns",
    (function () {
      const csv = T._csv();
      const lines = csv.split("\r\n");
      const head = lines[1] || "";
      return /Credit share/.test(head) && /Noncredit share/.test(head) && /Max award/.test(head) &&
        lines.filter(function (l) { return /NOCE|Calbright|SD Cont\. Ed/.test(l); }).length >= 3 &&
        lines.length >= 120;   // meta + header + 118 institutions + SYSTEM
    })());

  // ── reaction round 2 (Sam, 2026-08-31) — the mock is the spec ────────────
  check("D19: the titleline reads 'Version as of <date>' — the 'Model version … sourced from' " +
        "form is retired",
    (function () {
      const src = doc.querySelector(".cplfund-src");
      return !!src && /^Version as of \d{4}-\d{2}-\d{2}$/.test(src.textContent.trim()) &&
        !/Model version/.test(src.textContent);
    })());
  check("D20: the actions row carries the four WORD controls — expand/collapse all, Draft memo, " +
        "Save as PDF, and the Internal · Public view preview",
    (function () {
      const row = doc.querySelector(".cplfund-actions");
      if (!row) return false;
      return !!doc.getElementById("cplFundXall") &&
        !!doc.getElementById("cplFundDraftMemo") &&
        !!doc.getElementById("cplFundPdfTop") &&
        doc.querySelectorAll('.cplfund-actions [data-viewmode]').length === 2;
    })());
  check("D21: expand/collapse all really moves every section fold and flips its own label",
    (function () {
      const btn = doc.getElementById("cplFundXall");
      const secs = function () { return Array.from(doc.querySelectorAll("details.cplfund-sec")); };
      if (!btn || !secs().length) return false;
      btn.dispatchEvent(new window.Event("click", { bubbles: true }));
      const allClosed = secs().every(function (s) { return !s.open; });
      const label1 = btn.textContent;
      btn.dispatchEvent(new window.Event("click", { bubbles: true }));
      const allOpen = secs().every(function (s) { return s.open; });
      return allClosed && /Expand all/.test(label1) && allOpen && /Collapse all/.test(btn.textContent);
    })());
  check("D22: goal (D)'s quote is the statute VERBATIM — 'opportunities' restored " +
        "(ec_78093_2_initiative.txt is the source of record)",
    /Supporting credit for prior learning opportunities through the chancellor’s office’s pilot projects/
      .test(text));
  check("D23: CR FTES · NC FTES · Elig · CR award are centered columns (th.c + td.c); " +
        "NC award, the last column, stays right-aligned",
    (function () {
      const th = function (k) { return doc.querySelector('th[data-sort="' + k + '"]'); };
      const centered = ["cr_ftes", "nc_ftes", "elig", "cr_award"].every(function (k) {
        return th(k) && th(k).className.split(/\s+/).indexOf("c") !== -1;
      });
      const ncRight = th("nc_award") && th("nc_award").className.split(/\s+/).indexOf("c") === -1;
      const sysC = doc.querySelectorAll(".cplfund-systemrow td.c").length >= 3;
      return centered && ncRight && sysC;
    })());
  check("D24: no rendered 'on its face' anywhere on the tab (Sam's ban, 2026-08-31)",
    !/on its face/.test(doc.getElementById("cplFundingMount").textContent));
  check("D25: the View preview flips the tab to the PUBLIC rendering and back — dial editors " +
        "and Draft memo drop out, the toggle itself survives to flip back",
    (function () {
      const pubBtn = doc.querySelector('.cplfund-actions [data-viewmode="public"]');
      if (!pubBtn) return false;
      pubBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
      const inPreview = !doc.querySelector("#cplFundingMount [data-edit]") &&
        !doc.getElementById("cplFundDraftMemo") &&
        !!doc.querySelector('.cplfund-actions [data-viewmode="public"][aria-pressed="true"]');
      const intBtn = doc.querySelector('.cplfund-actions [data-viewmode="internal"]');
      if (!intBtn) return false;
      intBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
      const restored = !!doc.querySelector("#cplFundingMount [data-edit]") &&
        !!doc.getElementById("cplFundDraftMemo");
      return inPreview && restored;
    })());
  check("D27: on a priority card the METRIC sits on the surface just below the share line, " +
        "and the strategies are a closed fold (reaction round 3, 2026-08-31)",
    (function () {
      const card = doc.querySelector(".cplfund-prio .p");
      if (!card) return false;
      const kids = Array.from(card.children);
      const iMetric = kids.findIndex(function (k) { return /(^| )metric( |$)/.test(k.className); });
      // the share line is the first .nums <p>; the metric must directly follow it
      const iShare = kids.findIndex(function (k) { return /(^| )nums( |$)/.test(k.className); });
      const strat = card.querySelector("details.cplfund-strat");
      return iShare >= 0 && iMetric === iShare + 1 &&
        !!strat && !strat.open &&
        !!strat.querySelector("summary.cplfund-strat-h");
    })());
  check("D26: Draft memo opens the Report sub-view carrying the one-pool allocation",
    (function () {
      const btn = doc.getElementById("cplFundDraftMemo");
      if (!btn) return false;
      btn.dispatchEvent(new window.Event("click", { bubbles: true }));
      const inReport = !!doc.getElementById("cplFundMemoRegen") &&
        /Total credit and noncredit potential awards/.test(doc.getElementById("cplFundingMount").textContent);
      T._setSubview("model");   // leave the window on the model view
      return inReport;
    })());
}

finish();
