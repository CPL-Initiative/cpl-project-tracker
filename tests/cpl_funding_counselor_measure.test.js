// tests/cpl_funding_counselor_measure.test.js
//
// THE COUNSELOR STEP AS A MEASURE — Sam's P2 correction, 2026-09-15.
//
// WHAT WAS ACTUALLY WRONG. Sam's live Priority 2 reads:
//
//   "Applied CPL units (FTES) for students  with Counselor checked and
//    originating from either CPL Portal, College CPL Landing Page, or batch
//    upload"
//
// The text names the counselor step first. The PIN was `ppa_u` — applied units
// among portal-origin students — which never reads the counselor field at all.
// So the priority carrying the LARGEST share (34%) promised a condition its
// measure did not apply, and the measure it did apply carries 666.5 units
// statewide against the counselor cut's 24,804 (measured 2026-09-15 on the
// published artifact). Nothing on screen said so, because both sides were
// "measurable" and the tab compared the prose rung to the pin's rung using a
// metricMilestone() that had no `accepted` branch to compare WITH.
//
// TWO FAILURE MODES, and this suite exists for both:
//
//   1. PROSE RESOLUTION. Without a counselor entry in MEASURES, the live P2
//      text resolves on its PORTAL clause to `pp_u` — portal-origin TRANSCRIBED
//      units, 25.0 statewide across 3 colleges. A metric leading with the
//      counselor step reaching the transcribed-portal measure is not a near
//      miss; it is a different rung and a different cohort.
//
//   2. THE FALSE MISMATCH. metricMilestone() read "applied" off that same text
//      while a `pac_u` pin returns "accepted", so the diagnostic flagged a
//      milestone mismatch against the CORRECT configuration. A diagnostic that
//      fires on the right answer trains its reader to ignore it — and this repo
//      has exactly one instrument for "the metric and the measure disagree".
//
// ⚠️ THE TWO READERS MUST AGREE. measurability() picks the MEASURE and
// metricMilestone() picks the rung the check compares against. They now share
// one predicate, `saysCounselorAccepted`, and section 4 asserts they cannot
// drift apart — the alias-chain lesson (one `resolve`, imported, never copied)
// applied to the one seam where a copy would be silent.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_counselor_measure.test.js`).
const fs = require("fs");
const { check, freshDom, boot, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── the real predicates, rebuilt out of the consumer (never a copy) ──────────
const has = (m, s) => String(m || "").toLowerCase().indexOf(s) !== -1;
const rebuild = (name) => {
  const m = consumerSrc.match(new RegExp("function " + name + "\\(m\\) \\{[\\s\\S]*?\\n  \\}"));
  if (!m) throw new Error("cannot find function " + name + " in cpl_funding.js");
  return eval("(" + m[0].replace(new RegExp("^function " + name), "function") + ")");
};
const wantsUnits = rebuild("wantsUnits");
const saysCounselorAccepted = rebuild("saysCounselorAccepted");
const metricMilestone = rebuild("metricMilestone");
const MEASURES = (function () {
  const start = consumerSrc.indexOf("var MEASURES = [");
  const end = consumerSrc.indexOf("];", start) + 2;
  return eval("(" + consumerSrc.slice(start + "var MEASURES = ".length, end - 1) + ")");
})();
const proseMeasure = (metric) => MEASURES.find((x) => x.test(String(metric || "").toLowerCase())) || {};

// Sam's live P2, verbatim from cpl_funding_config on 2026-09-15 — including the
// double space after "students", because the string a curator actually typed is
// the string the matcher has to survive.
const LIVE_P2 = "Applied CPL units (FTES) for students  with Counselor checked and " +
  "originating from either CPL Portal, College CPL Landing Page, or batch upload";

// ── 1. the live text lands on the counselor measure, not the portal one ──────
check("1a: Sam's live P2 resolves to pac_u",
  proseMeasure(LIVE_P2).src === "pac_u");
check("1b: and specifically NOT to pp_u — the portal clause no longer wins over the counselor step",
  proseMeasure(LIVE_P2).src !== "pp_u");
check("1c: nor to pa_u — an undifferentiated applied count is the rung the counselor step refines",
  proseMeasure(LIVE_P2).src !== "pa_u");
// ⚠️ ORDER IS THE RULE. Assert it structurally, so moving the entry down the
// array fails here rather than silently changing which clause wins.
const idxOf = (src) => MEASURES.findIndex((x) => x.src === src);
check("1d: the counselor entry sits ahead of BOTH the portal and applied unit entries",
  idxOf("pac_u") >= 0 && idxOf("pac_u") < idxOf("pp_u") && idxOf("pac_u") < idxOf("pa_u"));

// ── 2. the wordings a curator actually writes ────────────────────────────────
const WORDINGS = [
  "Applied CPL Units (FTES) on counselor-accepted Student CPL Plans",
  "Counselor-accepted CPL Units (FTES)",
  "Applied CPL units measured in FTES with Counselor checked",
  "CPL Units (FTES) on an accepted CPL Plan",
];
check("2a: every counselor wording resolves to pac_u",
  WORDINGS.every((w) => proseMeasure(w).src === "pac_u"));
// ⚠️ THE GAP BRANCH PAYS A FULL CAP. Before this entry existed, a counselor
// metric with no pin fell through every rule to {} — a data gap — which
// earnFraction() treats as "nobody can measure this yet" and advances the whole
// priority. Measured on the live config: Norco's entire $51,699 P1 share, with
// nothing behind it. That is the failure this line guards.
check("2b: and NONE of them falls through to the full-advance data-gap branch",
  WORDINGS.every((w) => !!proseMeasure(w).src));
check("2c: the headcount twin resolves to pac rather than a gap",
  proseMeasure("Headcount with Counselor checked").src === "pac");

// ── 3. metrics that must NOT be captured ─────────────────────────────────────
// The entry sits first, so an over-broad predicate would swallow the whole tab.
check("3a: the plain applied metric is untouched",
  proseMeasure("Applied CPL Units measured in FTES").src === "pa_u");
check("3b: the plain eligible metric is untouched",
  proseMeasure("Eligible CPL Units measured in FTES").src === "pe_u");
check("3c: the plain transcribed metric is untouched",
  proseMeasure("Transcribed CPL Units measured in FTES").src === "p3_u");
check("3d: the portal metric without a counselor clause still lands on the portal measure",
  proseMeasure("Transcribed CPL Units (FTES) from the CPL Student Portal").src === "pp_u");
// The noncredit lane is the reason the pin exists at all — it must not regress.
check("3e: the NC landing-page metrics still collapse onto pp_u (they are PINNED, not prose-resolved)",
  proseMeasure("Applied CPL Units as FTES for students originating from the Noncredit Landing Page")
    .src === "pp_u");

// ── 4. the two readers agree, by construction ────────────────────────────────
check("4a: metricMilestone reads the counselor step as the accepted rung",
  metricMilestone(LIVE_P2) === "accepted");
check("4b: accepted is decided BEFORE applied — the live text names both",
  has(LIVE_P2.toLowerCase(), "applied") && metricMilestone(LIVE_P2) === "accepted");
// ⚠️ THE INVARIANT, not a sample: for every counselor wording, the rung the
// diagnostic compares against must equal the rung the measure returns. If these
// two ever disagree the tab reports a mismatch against a correct config.
check("4c: for every counselor wording, prose-milestone === the measure's own milestone",
  WORDINGS.concat([LIVE_P2]).every((w) =>
    metricMilestone(w) === "accepted" && proseMeasure(w).src === "pac_u"));
check("4d: one predicate serves both readers — saysCounselorAccepted agrees with both",
  WORDINGS.concat([LIVE_P2]).every((w) => saysCounselorAccepted(w.toLowerCase())) &&
  !saysCounselorAccepted("applied cpl units measured in ftes"));
check("4e: a non-counselor metric keeps its own rung",
  metricMilestone("Transcribed CPL Units measured in FTES") === "transcribed" &&
  metricMilestone("Applied CPL Units measured in FTES") === "applied");

// ── 5. end to end: the diagnostic names the live gap, and clears on the pin ──
// This is the behavior Sam sees. With P2 still pinned to ppa_u the tab now says
// the metric asks for ACCEPTED and the pin returns applied — which is the true
// statement of the defect, and the instruction for fixing it. With pac_u it is
// silent.
function renderWith(pin) {
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = {
    "0": { metric: "Applied CPL Units (FTES) included", share: 0.33, factor: 0.5, title: "Outreach" },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5, title: "Completion" },
    "2": { metric: LIVE_P2, share: 0.34, factor: 0.5, title: "Awards", metric_src: pin }
  };
  T._setShared({ yearPriorities: { "1": P, "2": P }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  const diag = doc.querySelector(".cplfund-metricdiag");
  // Each line carries its words in the text and the MAP feed key in its hover
  // (plain language, Sam 2026-09-23), so the key is read from the title.
  const lis = diag ? Array.from(diag.querySelectorAll("li")).map((li) => li.textContent + " || " + (li.getAttribute("title") || "")) : [];
  return { T, lis, mm: lis.filter((t) => /The wording names .+ CPL, but the measure counts/.test(t)) };
}
{
  const before = renderWith("ppa_u");
  check("5a: pinned to ppa_u, the diagnostic flags the metric/measure disagreement",
    before.mm.length > 0);
  check("5b: and it names the two rungs in Sam's own terms — accepted asked, applied returned",
    before.mm.some((t) => /counselor-accepted CPL/.test(t) && /measure counts applied CPL/.test(t) &&
      /MAP feed key: ppa_u/.test(t)));
}
{
  const after = renderWith("pac_u");
  check("5c: pinned to pac_u, the milestone mismatch is gone",
    after.mm.length === 0);
  // The pin must actually move funding, or the fix is cosmetic. pac_u carries
  // 24,804 units against ppa_u's 666.5, so a college with counselor-accepted
  // credit reads a materially different Current Total.
  const a = after.T._alloc("Norco College");
  check("5d: and the counselor measure is MEASURED, never an advance",
    a && a.earned_advance === 0 && a.earned_measured > 0);
}

// ── 6. an unpinned counselor metric never advances ───────────────────────────
// The section-2 assertion at the resolver level, carried through to dollars:
// this is the path that paid a full cap before the entry existed.
{
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = {
    "0": { metric: "Counselor-accepted CPL Units (FTES)", share: 0.33, factor: 0.5 },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "2": { metric: "Applied CPL Units measured in FTES", share: 0.34, factor: 0.5 }
  };
  T._setShared({ yearPriorities: { "1": P, "2": P }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  const a = T._alloc("Norco College");
  check("6a: an UNPINNED counselor metric pays no advance — it resolves and is measured",
    a && a.earned_advance === 0);
}

// ── 7. transcribed CPL with the Counselor step (Sam, 2026-09-23) ────────────
// His Scenario 3 sheet, item 1, verbatim: "We have the transcribed CPL in the
// dataset as well as the counselor step boolean indicator, so combining them
// should work." Priority 2's wording named this cut while its pin, p3_u,
// counted every transcribed unit, and the rung check could not see the gap:
// both measures report the transcribed rung.
const S3_P2 = "Transcribed CPL units (FTES) for students with Counselor step checked";
check("7a: Scenario 3's P2 wording resolves to ptc_u, the transcribed cut",
  proseMeasure(S3_P2).src === "ptc_u");
check("7b: the Counselor step without the transcript still resolves to the applied cut",
  proseMeasure("Counselor-accepted CPL Units (FTES)").src === "pac_u" &&
  proseMeasure(LIVE_P2).src === "pac_u");
check("7c: metricMilestone reads the wording as the transcribed rung, the rung ptc_u reports",
  metricMilestone(S3_P2) === "transcribed");
check("7d: the headcount twin resolves to ptc",
  proseMeasure("Headcount with transcribed CPL and Counselor checked").src === "ptc");
check("7e: the transcribed-and-Counselor entry sits ahead of the applied-and-Counselor one",
  idxOf("ptc_u") >= 0 && idxOf("ptc_u") < idxOf("pac_u"));

function renderS3(pin, deliver) {
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  if (deliver) {
    // The feed as the builder emits it once this change runs: half of each
    // college's transcribed units carry the Counselor step.
    const PF = window.CPL_FUNDING_PERF;
    PF.statewide.ptc_u = (PF.statewide.p3_u || 0) / 2;
    Object.keys(PF.colleges).forEach(function (k) {
      const r = PF.colleges[k];
      if (r && r.p3_u != null) r.ptc_u = r.p3_u / 2;
    });
  }
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = {
    "0": { metric: "Applied CPL Units (FTES) included", share: 0.33, factor: 0.5, title: "Access" },
    "1": { metric: S3_P2, share: 0.34, factor: 0.5, title: "Completion", metric_src: pin },
    "2": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5, title: "Other" }
  };
  T._setShared({ yearPriorities: { "1": P, "2": P }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  const diag = doc.querySelector(".cplfund-metricdiag");
  const lis = diag ? Array.from(diag.querySelectorAll("li")).map((li) => li.textContent + " || " + (li.getAttribute("title") || "")) : [];
  return { T, lis, p2: lis.filter((t) => /Completion/.test(t)) };
}
{
  const r = renderS3("p3_u", false);
  check("7f: pinned to p3_u, the wiring names the Counselor step the measure ignores",
    r.p2.some((t) => /The wording names the Counselor step, and the measure counts transcribed CPL for every student/.test(t) &&
      /MAP feed key: p3_u/.test(t)), JSON.stringify(r.p2));
}
{
  const r = renderS3("ptc_u", false);
  check("7g: pinned to ptc_u, no Counselor or rung disagreement is reported",
    r.p2.length > 0 && !r.p2.some((t) => /The wording names|The measure counts only/.test(t)), JSON.stringify(r.p2));
  check("7h: before the builder's next run the measure reads awaiting measurement",
    r.p2.some((t) => /Awaiting measurement/.test(t)), JSON.stringify(r.p2));
  const a = r.T._alloc("Norco College");
  check("7i: and counts $0 meanwhile, never an advance",
    a && a.earned_advance === 0);
  // The noncredit slice pairs by rung, so it keeps nc_pt_u exactly as p3_u did.
  const nc = r.T._ncPrios("Norco College", "1") || [];
  check("7j: the noncredit slice of the Counselor-step priority pairs with nc_pt_u",
    nc.some((q) => q.src === 1 && q.metric_src === "nc_pt_u"), JSON.stringify(nc.map((q) => [q.src, q.metric_src])));
}
{
  const undelivered = renderS3("ptc_u", false).T._alloc("Norco College");
  const delivered = renderS3("ptc_u", true);
  const a = delivered.T._alloc("Norco College");
  check("7k: once the feed carries ptc_u, Priority 2 is measured and counts toward the Current Total",
    a && undelivered && a.earned_advance === 0 && a.earned_measured > undelivered.earned_measured,
    JSON.stringify({ before: undelivered && undelivered.earned_measured, after: a && a.earned_measured }));
  check("7l: and the wiring reads it as measured from its picker wording",
    delivered.p2.some((t) => /Measured from Transcribed CPL with the Counselor step checked/.test(t)), JSON.stringify(delivered.p2));
}

finish();
