// CPL Implementation Funding — Sam's 2026-09-30 asks (SkyRivet, S306):
//
//   1. "Should we add a button to the Internal view that triggers a refresh of
//      everything wired when curated edits are made to the page? … Would be
//      nice if the refresh threw up a splash screen listing all the surfaces
//      it updated." Refresh everything re-reads the saved model here and in
//      every other open window (a BroadcastChannel), then a dialog lists what
//      it reached, what is built when opened, and what is not live.
//   2. The subscribers hear the model only after its caches clear.
//   3. "Add hover over details for P1,P2 labels … drill-down numbers showing
//      how the calcs were made." Each hover names the model's ingredients and
//      lands on the figure the cell prints; the arithmetic in it is checked
//      here, never pinned.
//   4. "Freeze top row of college table and add vertical scroll."
//   5. "Add a link to the drill-down numbers that can show details on the
//      source of the units … a basic military vs. non-military split … a list
//      of the source exhibits and CRs." Reviewer-only, never public.
//   6. My CPL Funding as a second view beside the institution table on a
//      public rendering.
//
// ⛔ Nothing here pins a figure the daily cron regenerates: expectations are
// read from cpl_funding_performance.js and from the model at run time.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_refresh_sources.test.js`).
const fs = require("fs");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish, freshDom, boot, click, openDrill } = H;

const perfSrc = fs.readFileSync("cpl_funding_performance.js", "utf8");
const shortSrc = fs.readFileSync("college_short_names.js", "utf8");
const briefSrc = fs.readFileSync("college_briefing.js", "utf8");
const src = H.consumerSrc;

const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));

// Scenario 2's shape as Sam left it on 2026-09-30: P1 Access on pa_u, P2
// Completion on ptc_u, 50/50, factor 0.5, the reported cards as reports.
function scen(deadline, floor) {
  return {
    pool: { admin_cost: 800000, floor_window: floor || 150000, scaling_projects_tech: 8959692 },
    years: ["2026-27", "2027-28"], mirrorYears: true, prioRemoved: [1, 3], disbursement: "frontload",
    priorityOrder: [0, 2, 1], reportedCards: ["C", "D"], reportedAsReports: true,
    participationDeadline: deadline || "2026-11-01",
    yearPriorities: { "1": {
      "0": { goals: ["A"], share: 0.5, title: "Access", factor: 0.5, metric_src: "pa_u",
             metric: "Applied CPL Units (FTES) originating from either CPL Portal, College CPL Landing Page, or batch upload" },
      "1": { share: 0.33, title: "Completion with Transcription", factor: 0.5, metric_src: "p3_u", metric: "Transcribed CPL Units measured in FTES" },
      "2": { goals: ["B"], share: 0.5, title: "Completion", factor: 0.5, metric_src: "ptc_u",
             metric: "Transcribed CPL units (FTES) for students with Counselor step checked" },
      "3": { goals: ["C"], share: 0, factor: 0.5 } } }
  };
}
function cfg(deadline, floor) {
  return { projects: { "cpl-implementation": { label: "CPL", area: "cpl", published: "Scenario 2",
    scenarios: { "Scenario 2": scen(deadline, floor) } } } };
}
function reviewer() {
  return { get: () => ({ access_token: "header.payload.sig", email: "co@cccco.edu" }), isFresh: () => true, onChange: () => {},
    authHeaders: () => ({ Authorization: "Bearer header.payload.sig" }) };
}
// cpl_funding.js's own formatters, restated for reading the hovers back.
const int = (v) => Math.round(v).toLocaleString("en-US");
const trim1 = (v) => (Math.round(v * 10) % 10 ? v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : int(v));
const num = (s) => Number(String(s).replace(/[$,]/g, ""));

// ── a booted window: the S2 config, the real MAP measures ────────────────────
function win(opts) {
  opts = opts || {};
  const dom = freshDom();
  const w = dom.window;
  if (opts.remote) { w.CPL_FUNDING_NO_REMOTE = false; w.fetch = opts.fetch; }
  if (opts.bc) w.BroadcastChannel = opts.bc;
  w.eval(shortSrc);
  w.eval(perfSrc);
  const doc = boot(w);
  const T = w.CPL_FUNDING_TAB;
  if (!opts.remote) { T._setConfig(opts.config || cfg()); }
  if (opts.reviewer) w.CPL_SESSION = reviewer();
  T.render();
  return { w, doc, T };
}

// The first base college (not quarter) with applied units in the artifact,
// and the first quarter-calendar one. Read, never typed.
const PERF = (function () { const s = { window: {} }; new Function("window", perfSrc)(s.window); return s.window.CPL_FUNDING_PERF; })();
const SEM = H.D.colleges.find((c) => !c.quarter && PERF.colleges[c.college] && PERF.colleges[c.college].pa_u > 0);
const QTR = H.D.colleges.find((c) => c.quarter && PERF.colleges[c.college] && PERF.colleges[c.college].pa_u > 0);

(async function main() {
  // ══ 2. subscribers hear the model after its caches clear ══════════════════
  {
    const body = src.slice(src.indexOf("  function render() {"), src.indexOf("  function render() {") + 900);
    check("2a: render() clears the allocation cache before it notifies subscribers",
      body.indexOf("_allocCache = null") >= 0 && body.indexOf("_allocCache = null") < body.indexOf("notifyModel();"));
    const { T } = win();
    const floored = Object.keys(T._model().floored).find((k) => T._model().floored[k]);
    let seen = null;
    T.onModelChange(() => { seen = floored ? T._alloc(floored).total : null; });
    T._setConfig(cfg(null, 175000));
    T.render();
    check("2b: a subscriber reading _alloc() in its handler gets the model it was told about",
      floored && seen != null && Math.abs(seen - T._alloc(floored).total) < 0.5 && Math.abs(seen - 175000) < 0.5);
  }

  // ══ 3, 4, 1, 6 on one reviewer window ═════════════════════════════════════
  {
    const { w, doc, T } = win({ reviewer: true });
    // ── 3. the hovers ──
    const d = openDrill(w, doc, "c:" + SEM.college);
    const p1 = d.cells[0], p2 = d.cells[1];
    check("3a: the P1 label hover names the goal, what it counts, its share and its price",
      /^Priority 1: Access\n/.test(p1.college.tip) && /Goal \(A\): Increasing access/.test(p1.college.tip) &&
      /Counts: Applied CPL Units \(FTES\) originating/.test(p1.college.tip) && /MAP measure: Applied CPL, every route/.test(p1.college.tip) &&
      /Share: 50% of each institution's credit funding\./.test(p1.college.tip) &&
      /Price: \$[\d,]+\.\d\d per FTES \(funding factor 0\.5 × the \$[\d,]+\.\d\d SCFF credit rate\)\./.test(p1.college.tip));
    check("3b: the P2 label hover names goal (B)", /^Priority 2: Completion\n/.test(p2.college.tip) && /Goal \(B\)/.test(p2.college.tip));
    // Max: the share line quotes the cell's own figure, and the target line's
    // arithmetic reproduces the Max FTES the cell prints.
    const mx = /Max Funds (\$[\d,]+): this institution's credit funding, (\$[\d,]+), × this priority's 50% share\./.exec(p1.cr_award.tip);
    check("3c: the Max hover's funding line quotes the cell's figure", mx && mx[1] === p1.cr_award.fig);
    check("3d: the Max hover's funding line is true (credit funding × 50%)", mx && Math.abs(num(mx[2]) * 0.5 - num(mx[1])) <= 1);
    const mf = /Max FTES ([\d,.]+): this priority's proportional funding before the base and cap, (\$[\d,]+), ÷ (\$[\d,.]+) per FTES/.exec(p1.cr_award.tip);
    check("3e: the Max FTES line reproduces the cell's Max FTES",
      mf && p1.cr_award.line === mf[1] + " FTES" && Math.abs(num(mf[2]) / num(mf[3]) - num(mf[1])) < 0.06);
    // Curr: units ÷ the calendar's divisor = the Actual FTES line.
    const raw = PERF.colleges[SEM.college].pa_u;
    const cu = /Actual FTES ([\d,.]+): ([\d,.]+) units in MAP \(Applied CPL, every route\) ÷ 30 units per FTES \(525 contact hours ÷ 17\.5 per semester unit\)\./.exec(p1.cr_current.tip);
    check("3f: the Curr hover converts the artifact's own applied units at 30 per FTES",
      cu && cu[2] === trim1(raw) && Math.abs(raw / 30 - num(cu[1])) < 0.051 && p1.cr_current.line === cu[1] + " FTES");
    check("3g: the remaining funding still leads the hover; the conversion follows it",
      /^\$[\d,]+ still to qualify for/.test(p1.cr_current.tip) && p1.cr_current.tip.indexOf(cu[0]) > 0);
    check("3h: the Curr hover lands on the cell's own figure",
      new RegExp("of " + p1.cr_award.fig.replace(/\$/g, "\\$") + ": " + p1.cr_current.fig.replace(/\$/g, "\\$") + "\\.").test(p1.cr_current.tip));
    const dq = openDrill(w, doc, "c:" + QTR.college);
    check("3i: a quarter college divides by 44.99, the divisor that reproduces its figure",
      /÷ 44\.99 units per FTES \(525 contact hours ÷ 11\.67 per quarter unit\)\./.test(dq.cells[0].cr_current.tip));
    const sw = openDrill(w, doc, "sys");
    check("3j: the Statewide drill-in keeps its sums unexplained per college (no college chain on its hover)",
      sw.cells.length && !/units in MAP/.test(sw.cells[0].cr_current.tip) && /Goal \(A\)/.test(sw.cells[0].college.tip));

    // ── 4. the frozen header ──
    const wrap = doc.querySelector("#cplFundTable .cplfund-tablewrap");
    check("4a: the college table's wrap carries the height cap class", wrap && wrap.classList.contains("cplfund-colwrap"));
    const css = (doc.getElementById("cplFundingCss") || doc.querySelector("style")) ? Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n") : "";
    check("4b: the cap makes the wrap scroll both ways, and print releases it",
      /\.cplfund-tablewrap\.cplfund-colwrap \{ max-height: 75vh; overflow: auto; \}/.test(css) &&
      /@media print \{ \.cplfund-tablewrap\.cplfund-colwrap \{ max-height: none; overflow: visible; \} \}/.test(css));
    check("4c: the $50K grants table keeps its own wrap (no cap)", !/cplfund-colwrap"><table class="cplfund-table cplfund-grants/.test(src) &&
      /'<div class="cplfund-tablewrap"><table class="cplfund-table cplfund-grants">'/.test(src));
    check("4d: the explainer's print releases the cap too",
      /#cplFundingMount \.cplfund-tablewrap\{overflow:visible !important; max-height:none !important; border:0\}/.test(fs.readFileSync("funding-model/index.html", "utf8")));

    // ── 1. Refresh everything (offline window) ──
    T.onModelChange(function () {}, () => ({ surface: "Test surface", detail: "redrawn for a test" }));
    const btn = doc.getElementById("cplFundRefresh");
    check("1a: the Internal view carries Refresh everything, a word", btn && btn.textContent === "Refresh everything");
    click(w, btn);
    await tick(20);
    let dlg = doc.querySelector("#cplFundSplash .cplfund-splash");
    const t = dlg ? dlg.textContent : "";
    check("1b: the splash is a modal dialog with a heading", dlg && dlg.getAttribute("role") === "dialog" &&
      dlg.getAttribute("aria-modal") === "true" && doc.getElementById("cplFundSplashH").textContent === "Refreshed");
    check("1c: it lists the tab and every subscriber that names itself",
      /Implementation Funding, Internal view/.test(t) && /Test surface — redrawn for a test/.test(t));
    check("1d: it names what is built when opened and what is not live",
      /Draft memo and report/.test(t) && /Download as Excel and Save as PDF/.test(t) &&
      /Not live: figures typed in/.test(t) && /CPL Funding in Motion videos/.test(t) && /frozen explainer snapshot/.test(t));
    check("1e: an offline window says so rather than claiming a re-read", /offline/.test(t) && !/Read the saved model/.test(t));
    check("1f: no channel in this browser is said plainly", /cannot reach its other windows/.test(t));
    check("1g: the Close button holds the focus", doc.activeElement && doc.activeElement.id === "cplFundSplashClose");
    click(w, doc.getElementById("cplFundSplashClose"));
    check("1h: Close removes the dialog and returns the focus to Refresh",
      !doc.getElementById("cplFundSplash") && doc.activeElement && doc.activeElement.id === "cplFundRefresh");
    click(w, doc.getElementById("cplFundRefresh"));
    await tick(20);
    const bd = doc.getElementById("cplFundSplash");
    bd.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("1i: Escape closes it", !doc.getElementById("cplFundSplash"));

    // ── 5 (signed out / public), 6: the public view ──
    check("5a: a signed-in reviewer gets the Unit sources word on P1's Curr credit cell only",
      !!openDrill(w, doc, "c:" + SEM.college).cells[0].cr_current.td.querySelector("[data-srcopen]") &&
      !openDrill(w, doc, "c:" + SEM.college).cells[0].nc_current.td.querySelector("[data-srcopen]"));
    click(w, doc.querySelector('[data-viewmode="public"]'));
    check("1j: the Public view carries no Refresh", !doc.getElementById("cplFundRefresh"));
    const pd = openDrill(w, doc, "c:" + SEM.college);
    check("5b: the Public view carries no Unit sources link", !doc.querySelector("[data-srcopen]"));
    check("3k: a public hover stops at the units (no exact qualifying product)",
      /units in MAP/.test(pd.cells[1].cr_current.tip) && !/so it qualifies for/.test(pd.cells[1].cr_current.tip));
    // 6. My CPL Funding beside the table
    w.eval(briefSrc);
    const seg = doc.getElementById("cplFundCollegeView");
    check("6a: the public rendering offers All institutions and My CPL Funding",
      seg && Array.from(seg.querySelectorAll("button")).map((b) => b.textContent).join("|") === "All institutions|My CPL Funding");
    click(w, seg.querySelector('[data-val="one"]'));
    const pick = doc.getElementById("cplFundOnePick");
    // Every institution, then (Sam, 2026-09-30) each district of two or more in
    // its own group: tests/cpl_funding_public_view_asks.test.js guards the districts.
    check("6b: My CPL Funding swaps the table for an institution or district picker", pick && !doc.getElementById("cplFundTable") &&
      pick.querySelectorAll('optgroup[label="Institutions"] option').length === H.D.colleges.length &&
      pick.querySelector('option[value=""]') !== null);
    pick.value = SEM.college;
    pick.dispatchEvent(new w.Event("change"));
    await tick(10);
    const panel = doc.getElementById("cplFundOnePanel");
    const money = "$" + int(T._alloc(SEM.college).total);
    check("6c: the panel is My College's block for that institution, read from the model",
      panel && /2026–2028 College Implementation Funding/.test(panel.textContent) && panel.textContent.indexOf(money) >= 0 &&
      /Priority outcomes/.test(panel.textContent));
    check("6d: it points at the table beside it, never at a tab the reader cannot see",
      /under All institutions\./.test(panel.textContent) && !/Implementation Funding tab shows/.test(panel.textContent));
    click(w, doc.querySelector('[data-viewmode="internal"]'));
    check("6e: the Internal view keeps the table alone", !doc.getElementById("cplFundCollegeView") && !!doc.getElementById("cplFundTable"));
  }

  // ══ 1 (continued): two windows, a shared channel, a served config ═════════
  {
    const bus = [];
    class FakeBC {
      constructor(name) { this.name = name; this.onmessage = null; bus.push(this); }
      postMessage(m) {
        const data = JSON.parse(JSON.stringify(m));
        bus.filter((x) => x !== this && x.name === this.name).forEach((x) => setTimeout(() => x.onmessage && x.onmessage({ data }), 0));
      }
      close() {}
    }
    let served = { config: cfg("2026-11-01"), updated_at: "2026-09-30T13:41:55.713837+00:00" };
    const fetchStub = (url) => Promise.resolve({ ok: true, status: 200,
      json: () => Promise.resolve(/cpl_funding_config/.test(url) ? [served] : []) });
    const A = win({ remote: true, fetch: fetchStub, bc: FakeBC });
    const B = win({ remote: true, fetch: fetchStub, bc: FakeBC });
    await tick(20);
    B.T.onModelChange(function () {}, () => ({ surface: "My College: My CPL Funding", detail: "redrawn for Window B" }));
    served = { config: cfg("2026-12-15"), updated_at: "2026-09-30T15:00:00+00:00" };
    click(A.w, A.doc.getElementById("cplFundRefresh"));
    // A jsdom redraw of the whole tab takes a second or more; wait for the
    // other window's answer rather than a fixed time.
    for (let i = 0; i < 100 && !(A.T._splash().replies.length && A.T._splash().waited); i++) await tick(100);
    const at = A.doc.querySelector("#cplFundSplash .cplfund-splash").textContent;
    check("1k: Refresh re-reads the saved model and says when it was saved", /Read the saved model, last saved 2026-09-30 15:00 UTC\./.test(at));
    check("1l: this window now holds the served model", A.T._scenario().config.projects["cpl-implementation"].scenarios["Scenario 2"].participationDeadline === "2026-12-15");
    check("1m: another open window re-read it too, and answered with what it redrew",
      /COBI — redrawn: .*My College: My CPL Funding \(redrawn for Window B\)/.test(at) &&
      B.T._scenario().config.projects["cpl-implementation"].scenarios["Scenario 2"].participationDeadline === "2026-12-15");
    // A save elsewhere reaches an open window without a press.
    served = { config: cfg("2027-01-05"), updated_at: "2026-09-30T16:00:00+00:00" };
    bus[0].postMessage({ type: "saved", from: "elsewhere" });
    await tick(30);
    check("1n: a save posted on the channel makes every other window re-read",
      B.T._scenario().config.projects["cpl-implementation"].scenarios["Scenario 2"].participationDeadline === "2027-01-05");
    check("1o: a save announces itself on the channel", /postChannel\(\{ type: "saved", from: WINDOW_ID \}\)/.test(src));
  }

  // ══ 5. Unit sources, from the credit report ═══════════════════════════════
  {
    const K = SEM.college;
    const ex = (i) => "MAPSAS-X" + i + "-1-001";
    const rows = [];
    for (let i = 0; i < 12; i++) rows.push({ source_code: "MAP", exhibit_id: ex(i), credit_rec: "3 hours in Course " + i,
      course_type: "Course credit (1)", sum_applied_credits: 100 - i, sum_transcribed_credits: i });
    rows.push({ source_code: "ACE", exhibit_id: "AR-1715-0001", credit_rec: "3 hours in Electronics", course_type: "Course credit (1)",
      sum_applied_credits: 30, sum_transcribed_credits: 0 });
    rows.push({ source_code: "", exhibit_id: "", credit_rec: "Lifelong Learning and Self Development",
      course_type: "Credit for Basic Military Service-Area", cpl_status_plan: "Needs Action", sum_applied_credits: 60, sum_transcribed_credits: 0 });
    rows.forEach((r) => { if (!r.cpl_status_plan) r.cpl_status_plan = "Applied to CPL Plan"; });
    const applied = rows.reduce((t, r) => t + r.sum_applied_credits, 0);
    const seen = [];
    const fetchStub = (url, o) => {
      seen.push({ url: String(url), range: o && o.headers && o.headers.Range, auth: o && o.headers && o.headers.Authorization });
      let data = [];
      if (/map_colleges\?/.test(url)) data = [{ college_id: 7, college_name: K, is_test: false, entity_kind: "college" }];
      else if (/map_college_cr_unit\?/.test(url)) data = rows;
      else if (/map_ace_exhibit_titles\?/.test(url)) data = [{ exhibit_id: ex(0), title: "AP Title Zero" }, { exhibit_id: "AR-1715-0001", title: "Electronic Instrument Repair" }];
      else if (/cpl_funding_config/.test(url)) data = [{ config: cfg(), updated_at: "2026-09-30T13:41:55+00:00" }];
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
    };
    const { w, doc, T } = win({ remote: true, fetch: fetchStub, reviewer: true });
    await tick(20);
    const agg = T._srcAggregate(rows, "sum_applied_credits");
    check("5c: the split is ACE or a military course type, and it adds up", agg.total === applied && agg.mil === 90 && agg.nonmil === applied - 90);
    check("5c2: and the units split by CPL plan status", agg.byStatus["Needs Action"] === 60 && agg.byStatus["Applied to CPL Plan"] === applied - 60);
    check("5d: the lists run by units, exhibits and recommendations apart",
      agg.exhibits.length === 14 && agg.exhibits[0].id === ex(0) && agg.crs.length === 14 && agg.crs[0].units === 100);
    let dd = openDrill(w, doc, "c:" + K);
    click(w, dd.cells[0].cr_current.td.querySelector("[data-srcopen]"));
    await tick(30);
    dd = openDrill(w, doc, "c:" + K);
    const srow = doc.querySelector("#cplFundTable tr.cplfund-srcrow");
    const st = srow ? srow.textContent.replace(/\s+/g, " ") : "";
    check("5e: the panel opens under the priority row", srow && srow.previousElementSibling.classList.contains("cplfund-subrow"));
    check("5f: it gives the military and non-military split in units and shares",
      /Military \(ACE or basic military service credit\): 90 units, [\d.]+%/.test(st) && new RegExp("Non-military: " + int(applied - 90) + " units").test(st));
    check("5g: it lists the source exhibits with their titles", /MAPSAS-X0-1-001 AP Title Zero/.test(st) && /Source exhibits \(14\)/.test(st));
    check("5h: it lists the credit recommendations", /3 hours in Course 0/.test(st) && /Credit recommendations \(14\)/.test(st));
    check("5i: ten rows a list until Show all", srow.querySelectorAll("table")[0].querySelectorAll(":scope > tbody > tr").length === 10 &&
      !!srow.querySelector("[data-srcall]"));
    click(w, srow.querySelector("[data-srcall]"));
    const srow2 = doc.querySelector("#cplFundTable tr.cplfund-srcrow");
    check("5j: Show all lists every exhibit", srow2.querySelectorAll("table")[0].querySelectorAll(":scope > tbody > tr").length === 14 &&
      /Basic military service credit \(no exhibit\)/.test(srow2.textContent));
    check("5k2: it names the plan-status split, and says units outside the plan are articulated, not applied",
      new RegExp("By CPL plan status: Applied to CPL Plan " + int(applied - 60) + " units, [\\d.]+% · Needs Action 60 units").test(st) &&
      /the 60 units outside Applied to CPL Plan are articulated and not yet applied to a student's plan/.test(st));
    check("5k: it compares the report's total with the funding measure's",
      new RegExp("lists " + int(applied) + " applied units for this institution; the funding measure counts " + trim1(PERF.colleges[K].pa_u).replace(/\./g, "\\.")).test(st));
    const q = seen.find((x) => /map_college_cr_unit\?/.test(x.url));
    check("5l: the read is range-paginated and carries the reviewer's credential",
      q && q.range === "0-999" && q.auth === "Bearer header.payload.sig" && /college_id=eq\.7/.test(q.url));
    // P2 measures transcribed units with the Counselor step: the caveat says the report cannot filter it.
    click(w, dd.cells[1].cr_current.td.querySelector("[data-srcopen]"));
    await tick(10);
    const rows2 = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-srcrow")).map((r) => r.textContent).join(" ");
    check("5m: the transcribed panel says the report does not carry the Counselor step",
      /transcribed units come from/.test(rows2) && /does not carry the Counselor step/.test(rows2));
    w.CPL_SESSION = null;
    T.render();
    check("5n: signed out, no Unit sources link and no panel", !doc.querySelector("[data-srcopen]") && !doc.querySelector("tr.cplfund-srcrow"));
    check("5o: public mode sweeps the attribute as a curate affordance", /"data-srcopen", "data-srcall"/.test(src));
  }
  finish();
})().catch((e) => { console.error(e); process.exit(1); });
