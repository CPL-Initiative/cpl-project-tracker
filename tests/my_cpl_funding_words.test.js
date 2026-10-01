// My CPL Funding — the words Sam ruled on (2026-10-01).
//
// ⭐ WHY. Sam reviewed the block's language on a mockup (artifact
// C5crxcr1KY7t1JgX3HTXMx, sheet 2026-10-01-my-cpl-funding-language) and wrote
// several sentences himself. This pins them verbatim, the three minimum
// conditions each with the institution's own state, and the two standing rules
// that came with them:
//   * "I don't want to refer to the 'funding model' ... as it's finalized, it's
//     no longer a model but now a procedure" (card 14): no rendered "model".
//   * the 84 statewide CER credentials are not the statewide recommendations
//     (card 4: "I believe there are more than 84"), so no line quotes 84 as a
//     count of recommendations.
// It also guards the bug the mockup found: Do this next read `pr.strategies`
// while buildBriefing() carries `pr.items`, so the implementation step never
// rendered on a real page.
//
// Run from repo root: `npm test` (or `node tests/my_cpl_funding_words.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function load() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div><div id="panel"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  const tp = w.document.createElement("script");
  tp.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(tp);
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

// Coastline as the live model read it on 2026-10-01: at the base, a coordinator
// and the confirmation still owed, the Veteran Star met, $70,694.54 held.
function cond(over) {
  return Object.assign({
    pending: false, blocked: true, deadline: "2026-11-01", deadlinePassed: false, vetPct: "75%",
    demonstrated: 70694.54, demonstratedWords: "$71,000",
    items: [
      { kind: "coord", met: false, pending: false, missing: "coord" },
      { kind: "part", met: false, pending: false, missing: "" },
      { kind: "vetstar", met: true, pending: false, missing: "" }
    ]
  }, over || {});
}
function fundingF(over) {
  return Object.assign({
    key: "Coastline", onRoster: true, grant: { amount: 50000, declined: false },
    floor: 150000, cap: 400000,
    alloc: { total: 150000, floored: true, capped: false, gate_blocked: true },
    prios: [
      { title: "Access", metric: "Applied CPL units (FTES) in MAP", metric_src: "pa_u", unit: "FTES", cap: 70695, target: 20 },
      { title: "Completion", metric: "Transcribed CPL units (FTES) for students with the Counselor step checked in MAP",
        metric_src: "ptc_u", unit: "FTES", cap: 70695, target: 20 }
    ],
    ess: {
      o1: { state: "met", why: "JSTs in MAP cover at least 75% of the enrolled veterans the college reports to the Chancellor's Office, which meets the Veteran Star." },
      o2: { state: "not", why: "Adopting or adapting any statewide CPL recommendation in MAP for local course, GE area, or elective credit meets this outcome." },
      o3: { state: "met", why: "The college has identified 980 students in MAP as eligible for CPL." }
    },
    nc: 8611, cond: cond()
  }, over || {});
}
// A briefing in buildBriefing()'s own shape: strategies arrive as `items`.
const BRIEF = { programs: [{ id: "cpl-implementation", label: "CPL Implementation", priorities: [
  { index: 0, share: 0.5, title: "Access", items: [{ text: "Configure your College CPL Landing Page." }, { text: "Second" }] },
  { index: 2, share: 0.5, title: "Completion", items: [{ text: "Review your CPL Administrative Procedure" }] }
] }] };

const w = load();
const M = w.CPL_COLLEGE_BRIEFING;
function textOf(html) { return new w.DOMParser().parseFromString("<div>" + html + "</div>", "text/html").body.textContent.replace(/\s+/g, " "); }
function block(f, ctx) {
  return M._fundingBlockHtml(Object.assign({ funding: "ready", college: "Coastline", f: f, detail: null,
    b: BRIEF, implProg: null, stratsInline: false, standalone: true }, ctx || {}));
}

const html = block(fundingF());
const t = textOf(html);

// ── (1) Sam's own sentences, verbatim ────────────────────────────────────────
check("(1) card 2: the seed grant's opening",
  t.includes("Based on the guidance provided in memo ESS 25-82, the college received this funding through " +
    "apportionment with a commitment to achieve the three priority outcomes measured by CPL data in the MAP platform."));
check("(1) card 6: the implementation funding's opening",
  t.includes("Potential (max) funding available for the two-year period 2026-28 is allocated based on priority " +
    "outcomes measured in full-time equivalent students (FTES) in MAP. Achievement of the following priority " +
    "outcomes determines funding."));
check("(1) card 7: the base line, with the base read from the model",
  t.includes("The college qualifies for $150,000 base funding to implement the CPL policies and procedures needed " +
    "to achieve the priority outcomes."));
check("(1) card 8: the minimum conditions, in his words",
  t.includes("CPL funding requires the following three minimum conditions:") &&
  t.includes("1. A CPL Coordinator (primary CPL contact) is named in MAP") &&
  t.includes("2. College confirmation is recorded") &&
  t.includes("3. At least 75% of enrolled veteran JSTs on file in MAP") &&
  t.includes("Current outcomes demonstrate $71,000 funding, which the college qualifies for once the minimum " +
    "conditions are met. The potential (max) funding remains available within the two-year window."));
check("(1) card 9: the noncredit portion",
  t.includes("Noncredit portion of the max funding is $8,611, which is based on CPL FTES that originate from the " +
    "college or district's noncredit program."));
check("(1) card 12: how progress qualifies",
  t.includes("Progress toward each priority goal is measured in FTES and funded up to the cap."));
check("(1) card 14: the closing note starts with CPL funding",
  t.includes("CPL funding follows the same procedure for every institution under All institutions."));
check("(1) card 15: the PDF's line, dated the style guide's way",
  /CPL potential and current outcomes-based funding as of ' \+ esc\(apDate\(asOf\)\)/.test(fs.readFileSync("college_briefing.js", "utf8")));

// ── (2) each condition carries this institution's own state ─────────────────
const doc = new w.DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
const conds = Array.from(doc.querySelectorAll(".cb-conds li")).map((li) => li.textContent.replace(/\s+/g, " ").trim());
check("(2) three conditions, in the pie's order", conds.length === 3 && /^Not yet\s*1\./.test(conds[0]) &&
  /^Not yet\s*2\./.test(conds[1]) && /^Met\s*3\./.test(conds[2]), JSON.stringify(conds));
const met = block(fundingF({ alloc: { total: 150000, floored: true, gate_blocked: false },
  cond: cond({ blocked: false, demonstratedWords: "$12,000",
    items: [{ kind: "coord", met: true }, { kind: "part", met: true }, { kind: "vetstar", met: true }] }) }));
const mt = textOf(met);
check("(2) all three met: the college qualifies now, with no 'once' clause",
  mt.includes("Current outcomes demonstrate $12,000 funding, which the college qualifies for. The potential (max)"));
const pend = textOf(block(fundingF({ cond: cond({ pending: true, items: [{ kind: "coord", pending: true },
  { kind: "part", met: false }, { kind: "vetstar", pending: true }] }) })));
check("(2) conditions still loading: says so, and claims no figure",
  pend.includes("The minimum conditions are still loading.") && !pend.includes("Current outcomes demonstrate"));
const nc3 = textOf(block(fundingF({ cond: cond({ items: [{ kind: "coord", met: true }, { kind: "part", met: true },
  { kind: "exhibits", met: false }] }) })));
check("(2) a noncredit institution's third condition is its certificates",
  nc3.includes("3. Noncredit certificates posted as exhibits in MAP"));

// ── (3) Do this next: the conditions lead (card 13) ─────────────────────────
const nexts = Array.from(doc.querySelectorAll(".cb-next li")).map((li) => li.textContent.replace(/\s+/g, " ").trim());
check("(3) the implementation step names what is owed, with the date and the control",
  nexts[0] === "For the implementation funding: name the college's CPL Coordinator (primary CPL contact) in MAP, " +
    "and confirm the college's participation by Nov. 1, 2026, with the Confirm button on its row under All institutions.",
  nexts[0]);
check("(3) the seed step adopts or adapts any statewide recommendation (card 4)",
  nexts[1] === "For the seed funding: adopt or adapt any statewide CPL recommendation in MAP for local course, GE area, " +
    "or elective credit.", nexts[1]);
const owedPrimary = textOf(block(fundingF({ cond: cond({ items: [{ kind: "coord", met: false, missing: "primary" },
  { kind: "part", met: true }, { kind: "vetstar", met: false }] }) })));
check("(3) the step names the part of the first condition that is missing, and the JSTs",
  owedPrimary.includes("name the college's primary CPL contact in MAP, and upload JSTs to MAP for at least 75% of enrolled veterans."));
const mc = textOf(block(fundingF(), { standalone: false }));
check("(3) on My College the confirmation points to the Implementation Funding tab",
  mc.includes("confirm the college's participation by Nov. 1, 2026 on the Implementation Funding tab.") &&
  mc.includes("CPL funding follows the same procedure for every institution. The Implementation Funding tab shows"));
// ⭐ The bug the mockup found: with nothing owed, the step comes from the
// strategies in buildBriefing()'s own shape (`items`), which read empty before.
check("(3) ⭐ nothing owed: the first step under the highest-share priority, from `items`",
  mt.includes("For the implementation funding, under Access: Configure your College CPL Landing Page."));
check("(3) …and topStrategy reads the briefing shape directly",
  M._topStrategy(BRIEF) && M._topStrategy(BRIEF).text === "Configure your College CPL Landing Page.");
// The briefing builder's real output, not a fixture, must yield a step too.
const real = M._buildBriefing({ config: { projects: { "cpl-implementation": { label: "CPL Implementation", published: "S",
  scenarios: { S: { yearPriorities: { "1": { "0": { title: "Access", share: 1, strategies: ["Do the access thing"] } } } } } } } },
  college: null }, { scenario: "S", year: "1" });
check("(3) …on buildBriefing()'s real output as well",
  !!M._topStrategy(real) && M._topStrategy(real).text === "Do the access thing", JSON.stringify(M._topStrategy(real)));

// ── (4) the standing rules ───────────────────────────────────────────────────
const all = [t, mt, pend, nc3, mc, owedPrimary].join(" ");
check("(4) card 14: no rendered 'model' anywhere in the block", !/\bmodel\b/i.test(all),
  (all.match(/.{40}\bmodel\b.{20}/i) || [""])[0]);
check("(4) card 4: no line quotes 84 as a count of recommendations", !/\b84 statewide (credit )?recommendations\b/i.test(all));
const frac = M._essProgress(fundingF(), { adopted: [{ statewide: true }, { statewide: false }], potential: [{ statewide: true }] },
  { n_statewide_credentials: 84 }, "Access");
w.CPL_FUNDING_ESS = { n_statewide_credentials: 84 };   // the sidecar the block reads the count from
const fracHtml = block(fundingF(), { detail: { adopted: [{ statewide: true }], potential: [{ statewide: true }, { statewide: true }],
  rollup: [], goal2: [], waiting: [] } });
check("(4) …the My College fraction counts credentials and says so",
  frac[1].frac.of === 84 && textOf(fracHtml).includes("The college has adopted 1 of the 84 credentials with statewide " +
    "CPL recommendations in MAP, and 2 more are available to adopt."));
check("(4) 'apportionment' appears once, in the seed grant's sentence only (Sam's own word, card 2)",
  (all.match(/apportion/gi) || []).length === 6 && (t.match(/apportion/gi) || []).length === 1 &&
  !/apportion/i.test(t.replace(/Based on the guidance[^.]*\./, "")));
const banned = [/\bpools?\b/i, /\bmoney\b/i, /\bdraws?\b/i, /\bunspent\b/i, /\b(un)?earn(s|ed|ing|ings|able)?\b/i,
  /\badvances?\b/i, /\bno data yet\b/i];
check("(4) the funding vocabulary holds", banned.every((re) => !re.test(all)),
  banned.filter((re) => re.test(all)).map(String).join(" "));
check("(4) no bold inside the block's prose", !doc.querySelector(".cb-lab b, .cb-note b, .cb-next b, .cb-d b"));
check("(4) no 'it is this, not that' and no metaphors from the old lines",
  !/not a compliance|not a missed payment|cheap half|no cliff|ground still to cover|in front of somebody/i.test(all));
check("(4) the tag names the max award, never 'allocation cap'", /max award/.test(t) && !/allocation cap/.test(t));
check("(4) the steps name who suggests them",
  /Eight steps the CPL Initiative suggests/.test(textOf(M._stratHtml(new Array(8).fill({ text: "x" }), null))) &&
  /One step the CPL Initiative suggests/.test(textOf(M._stratHtml([{ text: "x" }], null))) &&
  /12 steps the CPL Initiative suggests/.test(textOf(M._stratHtml(new Array(12).fill({ text: "x" }), null))));
check("(4) the declined grant reads as a plain statement",
  textOf(block(fundingF({ grant: { amount: 50000, declined: true } }))).includes("The college declined this grant pending further review."));

// ── (5) dates in the CO style guide's form ───────────────────────────────────
check("(5) apDate", M._apDate("2026-11-01") === "Nov. 1, 2026" && M._apDate("2028-06-30") === "June 30, 2028" &&
  M._apDate("2026-09-30") === "Sept. 30, 2026" && M._apDate("2027-03-15") === "March 15, 2027");

// ── (6) the funding module's side ────────────────────────────────────────────
const fsrc = fs.readFileSync("cpl_funding.js", "utf8");
check("(6) card 1: the My CPL Funding view's introduction is Sam's sentence",
  /var ONE_VIEW_INTRO = "My CPL Funding is a summary view of CPL funding and expected outcomes\.";/.test(fsrc) &&
  /oneView \? '<div class="cplfund-prose dk cplfund-college-intro" data-textblock="college_intro_one"><p>' \+\s*ONE_VIEW_INTRO/.test(fsrc));
check("(6) the module exports each institution's conditions and the measure key",
  /_conditions: function \(name\)/.test(fsrc) && /metric_src: p\.metric_src \|\| null/.test(fsrc));
check("(6) the seed status lines name no feed while they load",
  /var ESS_LOADING = "Status loading\.";/.test(fsrc) && !/feed not loaded yet|rollup not loaded yet/.test(fsrc));

let failed = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  PASS  " : "  FAIL  ") + name + (ok || !why ? "" : "\n          " + why));
  if (!ok) failed++;
}
console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
