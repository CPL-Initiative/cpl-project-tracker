// Check wording (S491, 2026-10-26) — sierra_wording_check.js and its place in
// the Sierra Training tab.
//
// Sam, 2026-10-26 ~15:40Z: "If there is a way for you to analyze an instruction
// I add to see if it can be worded better for Sierra, let's do that." The check
// is the half that needs no model. Run on the 18 switched-on instructions it
// found four faults that changed what Sierra said (a link that led nowhere, an
// example quotation that never closed, an instruction cut at the old 500-character
// limit, a website Sierra was told to scan), and that the set stood at 8,653 of
// 9,000 characters on My College, where one long instruction drops the naming rule.
//
// What this guards:
//  (a) the three budget numbers equal cpl-chat's and the tab's, so the space the
//      check reports is the space Sierra has;
//  (b) the space check matches cpl-chat's OWN guidanceBlock(), lifted from
//      index.ts: newest first, and a BREAK (not a skip) at the first that does not
//      fit, so the oldest go silently;
//  (c) each of the four live faults is found, and the corrected wording passes;
//  (d) a name inside a sentence that forbids it is not a finding (row ee287020
//      lists the tools Sierra must never name);
//  (e) a public link and a college's .edu pass; a near-miss of a public link fails;
//  (f) the tab shows the check under the new-instruction box and in the editor,
//      updates as the curator types, never blocks Save, and skips the space
//      count for a display rule (its budget is separate);
//  (g) XSS: a finding quoting the draft renders escaped.
//
// Run from repo root: `npm test` (or `node tests/sierra_wording_check.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const C = require("../sierra_wording_check.js");
const CHAT = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const TAB = fs.readFileSync("sierra_training.js", "utf8");
const SRC = fs.readFileSync("sierra_wording_check.js", "utf8");

function num(src, re) { const m = src.match(re); return m ? Number(m[1]) : NaN; }

// ── (a) the numbers ──
check("(a) RULE_MAX equals cpl-chat's GUIDANCE_MAX_CHARS_PER_RULE",
  C.RULE_MAX === num(CHAT, /const GUIDANCE_MAX_CHARS_PER_RULE = (\d+);/));
check("(a) TOTAL_MAX equals cpl-chat's GUIDANCE_MAX_CHARS",
  C.TOTAL_MAX === num(CHAT, /const GUIDANCE_MAX_CHARS = (\d+);/));
check("(a) SENT_CAP equals cpl-chat's GUIDANCE_MAX_RULES",
  C.SENT_CAP === num(CHAT, /const GUIDANCE_MAX_RULES = (\d+);/));
check("(a) and the tab's own GUIDANCE_RULE_MAX / GUIDANCE_TOTAL_MAX / GUIDANCE_SENT_CAP",
  C.RULE_MAX === num(TAB, /var GUIDANCE_RULE_MAX = (\d+);/)
  && C.TOTAL_MAX === num(TAB, /var GUIDANCE_TOTAL_MAX = (\d+);/)
  && C.SENT_CAP === num(TAB, /var GUIDANCE_SENT_CAP = (\d+);/));

// ── (b) the space check against cpl-chat's own guidanceBlock() ──
let G = null;
try {
  const start = CHAT.indexOf("function guidanceBlock(");
  const end = CHAT.indexOf("async function fetchTeamGuidance");
  const lifted = "const GUIDANCE_MAX_CHARS_PER_RULE = " + C.RULE_MAX + ";\n" + CHAT.slice(start, end);
  G = liftBlock(lifted, "const GUIDANCE_MAX_CHARS_PER_RULE", "\u0000END", ["guidanceBlock"]);
} catch (e) {
  try {
    const start = CHAT.indexOf("function guidanceBlock(");
    const end = CHAT.indexOf("async function fetchTeamGuidance");
    const body = "const GUIDANCE_MAX_CHARS_PER_RULE = " + C.RULE_MAX + ";\n" + CHAT.slice(start, end) + "\n//END";
    G = liftBlock(body, "const GUIDANCE_MAX_CHARS_PER_RULE", "//END", ["guidanceBlock"]);
  } catch (e2) { G = null; }
}
check("(b) guidanceBlock lifts out of cpl-chat", G && typeof G.guidanceBlock === "function");

// A set shaped like the live one: newest first, the naming rule oldest.
function rule(id, n, extra) {
  const t = (id + " ").padEnd(n - 1, "x") + ".";
  return Object.assign({ id: id, rule: t, surface: null, d: "2026-10-0" + (id.length % 9) }, extra || {});
}
const SET = [];
for (let i = 0; i < 15; i++) SET.push(rule("r" + i, 520));
SET.push(rule("naming", 274));
// 15 × 523 + 277 = 8,122 used; 878 left.
if (G) {
  const sent = G.guidanceBlock(SET, C.TOTAL_MAX);
  const mine = C.space("", { active: SET, editingId: "none" })[0];
  check("(b) the check counts what the function sends (no draft)", mine.used === sent.length && mine.dropped.length === 0);
  const long = "y".repeat(1000) + ".";
  const withDraft = [{ id: "draft", rule: long }].concat(SET);
  const sentD = G.guidanceBlock(withDraft, C.TOTAL_MAX);
  const r = C.check(long, { active: SET });
  const sp = r.space[0];
  check("(b) with a 1,001-character draft the function drops the naming rule",
    sentD.indexOf("naming ") < 0 && sentD.length === sp.used);
  check("(b) and the check says so, naming the oldest to go",
    r.findings.some(f => f.kind === "Space" && f.level === "fix" && /naming/.test(f.text)));
  // A BREAK, not a skip: one long rule in the middle stops everything after it,
  // even rules short enough to fit.
  // 15 × 523 = 7,845; the 1,400 misfits; the naming rule (277) alone would fit.
  const mid = SET.slice(0, 15).concat([rule("big", 1400)], SET.slice(15));
  const sentM = G.guidanceBlock(mid, C.TOTAL_MAX);
  const spM = C.space("", { active: mid, editingId: "none" })[0];
  check("(b) a break, not a skip: what follows the first misfit is dropped too",
    spM.used === sentM.length && spM.dropped.map(x => x.id).join() === "big,naming"
    && sentM.indexOf("naming ") < 0);
}

// ── (c) the four live faults, and their corrections ──
const LIVE = [
  { id: "858c6c87", kind: "Link",
    before: "Answer with a simple table, and next to the one most aligned with serve safe, list the crediforbeingyou.org link with a note.",
    after: "Answer with a simple table, and next to the one most aligned with ServSafe, list the creditforbeingyou.org link with a note." },
  { id: "98258907", kind: "Quote",
    before: "When someone asks something like “How much credit can someone receive for 10 years as an administrative assistant? Don't lead with the negative.",
    after: "When someone asks something like “How much credit can someone receive for 10 years as an administrative assistant?” Don't lead with the negative." },
  { id: "f57638f9", kind: "Cut off",
    before: ("When referring to Transcribing CPL, note that we are not asking colleges to primarily transcribe in their local SIS. "
      + "If infers that the student has discussed their CPL opportunities with a counselor and agrees to accept the planned CPL"),
    after: null },
  { id: "6b5ae5d9", kind: "Website",
    before: "When someone asks something like \"What is the agenda for the 2026 CPL Summit?\", scan the map.rccd.edu website to information and provide links.",
    after: "When someone asks something like \"What is the agenda for the 2026 CPL Summit?\", give the link to https://map.rccd.edu for the agenda and current information." },
];
// the cut-off case at exactly the old limit
const CUT = LIVE[2].before.padEnd(500, " and that it is appropriate").slice(0, 500).replace(/\s+$/, "x");
LIVE[2].before = CUT.length === 500 ? CUT : LIVE[2].before;
LIVE[2].after = LIVE[2].before + ".";
LIVE.forEach(function (L) {
  const b = C.check(L.before, { active: SET }).findings;
  check("(c) " + L.id + ": the check finds the " + L.kind + " fault", b.some(f => f.kind === L.kind && f.level === "fix"));
  const a = C.check(L.after, { active: SET }).findings;
  check("(c) " + L.id + ": the corrected wording has nothing to fix", !a.some(f => f.level === "fix"));
});
check("(c) the cut-off fault at exactly 500 characters names the old limit",
  LIVE[2].before.length === 500
  && C.check(LIVE[2].before, { active: SET }).findings.some(f => f.kind === "Cut off" && /500/.test(f.text)));
check("(c) a curly opening closed by a straight mark is a look, not a fix",
  C.check("When someone asks something like “What can I get?\" answer with a table.", { active: SET })
    .findings.some(f => f.kind === "Quote" && f.level === "look"));

// ── (d) names inside a sentence that forbids them ──
const NEVER = "Never name an internal tool, COBI tab or staff page (COCI Lookup, the Catalog Commons) and never send a reader to one.";
check("(d) a 'never' sentence naming the tools is not a finding",
  !C.check(NEVER, { active: SET }).findings.some(f => f.kind === "Internal name"));
check("(d) the same names in an ordinary sentence are",
  C.check("Check the COCI Lookup and the Catalog Commons for the courses.", { active: SET })
    .findings.some(f => f.kind === "Internal name" && /COCI Lookup/.test(f.text) && /Catalog Commons/.test(f.text)));
check("(d) a My College instruction already scoped there is told its opening words can go",
  C.check("When using Sierra from the My College COBI tab, confine your answers to the selected college.",
    { active: SET, surface: "my-college" }).findings.some(f => /Applies already limits/.test(f.text)));

// ── (e) links ──
check("(e) the public pages and a college .edu pass",
  !C.check("Link creditforbeingyou.org, https://cpl-initiative.github.io/cpl-project-tracker/ and www.chabotcollege.edu.", { active: SET })
    .findings.some(f => f.kind === "Link"));
check("(e) an unknown site is a look", C.check("Send them to example.com for more.", { active: SET })
  .findings.some(f => f.kind === "Link" && f.level === "look"));

// ── (f)/(g) the tab ──
function makeWin() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.alert = function () {};
  w.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };
  for (const code of [SRC, TAB]) {
    const el = w.document.createElement("script");
    el.textContent = code;
    w.document.body.appendChild(el);
  }
  return w;
}
function seed(api) {
  api._state.feedback = []; api._state.turns = [];
  api._state.guidance = [
    { id: "r1", rule: "When someone asks about welding, answer with a simple table showing the colleges and units.", active: true,
      kind: "directive", created_at: "2026-10-20T10:00:00Z" },
    { id: "r2", rule: "Naming: the program is the CPL Initiative.", active: true, kind: "directive", created_at: "2026-07-03T10:00:00Z" },
  ];
}
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  check("(f) the module is on the page beside the tab", !!w.SierraWordingCheck);
  seed(api);
  api._state.draftRule = "Send them to the crediforbeingyou.org page.";
  api.render(root);
  const box = root.querySelector('[data-guid-check="draft"]');
  check("(f) the check sits under the new-instruction box", !!box && /crediforbeingyou\.org/.test(box.textContent)
    && /Link · Fix/.test(box.textContent) && /Before you save/.test(box.textContent));
  const add = root.querySelector("[data-guid-add]");
  check("(f) it never blocks Save: Add instruction stays enabled", !!add && !add.disabled);
  // typing re-checks without re-rendering the textarea
  const ta = root.querySelector(".sit-guid-input");
  ta.value = "Send them to creditforbeingyou.org.";
  ta.dispatchEvent(new w.Event("input"));
  api._refreshWordingChecks(root);
  check("(f) typing re-checks in place: the corrected link clears the fault, and the box is the same element",
    !/Link/.test(root.querySelector('[data-guid-check="draft"]').textContent)
    && root.querySelector(".sit-guid-input") === ta);
  // display rule: no space count
  api._state.draftKind = "display";
  api._state.draftRule = "Columns: College, Units.";
  api._refreshWordingChecks(root);
  check("(f) a display rule gets no space count (its budget is separate)",
    !/Space/.test(root.querySelector('[data-guid-check="draft"]').textContent));
  // editor
  api._state.draftKind = "directive"; api._state.draftRule = "";
  api._openEdit("r1", root);
  api._state.editRule = "Scan the map.rccd.edu website for it.";
  api.render(root);
  const ed = root.querySelector('[data-guid-check="edit"]');
  check("(f) the editor carries the check too", !!ed && /Website · Fix/.test(ed.textContent));
  check("(f) the edited row is not counted as overlapping itself",
    !/also says/.test(api._wordingCheckInner(api._state.guidance[0].rule, "r1", null, "directive")));
  // (g) escaping
  const out = api._wordingCheckInner('<img src=x onerror="alert(1)">.example.com', null, null, "directive");
  check("(g) a finding quoting the draft renders escaped", !/<img/.test(out) && /&lt;img|example\.com/.test(out));
})();

let fail = 0;
for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} checks passed`);
process.exit(fail ? 1 : 0);
