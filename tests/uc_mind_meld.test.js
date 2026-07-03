// 🧠 Mind-meld doctrine capture — the CCR Convergence calibration loop
// (2026-07-03). The Suggested-merges worklist renders a Mind-meld panel per
// group: contextual doctrine question(s) matched from the group's features,
// voice/text capture, and a save to Supabase merge_doctrine_notes.
//
// Guards the failure modes:
//   1. feature triggers misfire (a plain group surfacing the ESL-ladder
//      question — or a ladder NOT surfacing it — poisons the mind-meld);
//   2. question matching drifts from the committed kb/doctrine_questions.json
//      (the test reads the REAL file so trigger names can't silently diverge);
//   3. saving signed-out must explain, never throw or silently drop;
//   4. the saved payload shape must match kb/supabase_merge_doctrine.sql;
//   5. no SpeechRecognition (jsdom, Firefox) must degrade to typing.
//
// Run from repo root: `npm test` (or `node tests/uc_mind_meld.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");
const questionsFile = JSON.parse(fs.readFileSync("kb/doctrine_questions.json", "utf8"));

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({
    rows: [{ kind: "Course", id: "ESOL M9019", title: "Reading Skills for ESL Students 1",
      id_system: "M-ID", disc: "English as a Second Language", credit: "Noncredit",
      units: 0, top: "4930.86", subj: ["ESL"], members: 2, adopted: [], potential: [],
      conf: 0.7, flags: {}, locked: false }],
    colleges: ["A"], mq_disciplines: ["English as a Second Language"], topmap: {},
  })};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;

// Capture doctrine-note POSTs; serve the REAL committed question bank.
const posts = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (String(url).indexOf("doctrine_questions.json") >= 0) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(questionsFile) });
  }
  if (method === "POST" && String(url).indexOf("merge_doctrine_notes") >= 0) {
    posts.push({ url: String(url), body: JSON.parse(opts.body), headers: opts.headers });
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve([]), text: () => Promise.resolve("") });
};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("unified_courses.js evaluates", !threw);

const mm = window.CPL_UC_MINDMELD;
check("test hook exposed", !!mm && typeof mm.features === "function"
  && typeof mm.match === "function" && typeof mm.panel === "function");

(async () => {
  // ── 1. feature triggers ──────────────────────────────────────────────
  const ladder = {
    same_college: false,
    members: [
      { id: "ESOL M9019", t: "Reading Skills for ESL Students 1", u: 0, d: "English as a Second Language" },
      { id: "ESOL M9040", t: "Reading Skills for ESL Students 2", u: 0, d: "English as a Second Language" },
      { id: "ESOL M9050", t: "Reading Skills for ESL Students 3", u: 0, d: "English as a Second Language" },
    ],
  };
  const fLadder = mm.features(ladder, ladder.members, "anchored");
  check("ladder → level_ladder", fLadder.indexOf("level_ladder") >= 0);
  check("ladder → esl_language", fLadder.indexOf("esl_language") >= 0);
  check("ladder → skill_strands (reading strand ×3)", fLadder.indexOf("skill_strands") >= 0);
  check("every group → always", fLadder.indexOf("always") >= 0);

  const plain = { members: [
    { id: "WELD M1046", t: "Gas Tungsten Arc Welding", u: 3, d: "Welding" },
    { id: "WELD M10AB", t: "GTAW Welding", u: 3, d: "Welding" },
  ] };
  const fPlain = mm.features(plain, plain.members, "anchored");
  check("plain pair → NO level_ladder", fPlain.indexOf("level_ladder") < 0);
  check("plain pair → NO credit_noncredit_mix", fPlain.indexOf("credit_noncredit_mix") < 0);

  const bandMix = { members: [
    { id: "ESLN M9001", t: "ESL Conversation", u: 0, d: "English as a Second Language" },
    { id: "ESLN M1001", t: "ESL Conversation", u: 3, d: "English as a Second Language" },
  ] };
  check("M9/M1 ids → credit_noncredit_mix",
    mm.features(bandMix, bandMix.members, "anchored").indexOf("credit_noncredit_mix") >= 0);

  const sameCollege = { same_college: true, members: plain.members };
  check("same_college flag → same_college",
    mm.features(sameCollege, sameCollege.members, "singleton").indexOf("same_college") >= 0);

  const xdisc = { members: [
    { id: "MUSI M1001", t: "Keyboard Skills", u: 2, d: "Music" },
    { id: "OTEC M1001", t: "Keyboarding", u: 2, d: "Office Technologies" },
  ] };
  check("two disciplines → cross_discipline",
    mm.features(xdisc, xdisc.members, "title").indexOf("cross_discipline") >= 0);

  const generic = { members: [
    { id: "AUTO M10MR", t: "Special Topics in Automotive Technology", u: 1, d: "Automotive Technology" },
    { id: "AUTO M10MS", t: "Automotive Fundamentals", u: 3, d: "Automotive Technology" },
  ] };
  check("special topics → generic_title",
    mm.features(generic, generic.members, "title").indexOf("generic_title") >= 0);

  const honors = { members: [
    { id: "BIOL M1001", t: "General Biology", u: 4, d: "Biology" },
    { id: "BIOL M1002", t: "General Biology Honors", u: 4, d: "Biology" },
  ] };
  check("asymmetric Honors → honors_variant",
    mm.features(honors, honors.members, "anchored").indexOf("honors_variant") >= 0);

  // ── 2. question matching against the REAL committed bank ────────────
  const qs = questionsFile.questions;
  const mLadder = mm.match(fLadder, qs).map((q) => q.id);
  check("ladder matches Q-LADDER", mLadder.indexOf("Q-LADDER") >= 0);
  check("ladder matches Q-FREE (always)", mLadder.indexOf("Q-FREE") >= 0);
  check("ladder does NOT match Q-SAMECOLL", mLadder.indexOf("Q-SAMECOLL") < 0);
  const mPlain = mm.match(fPlain, qs).map((q) => q.id);
  check("plain pair matches ONLY Q-FREE", mPlain.length === 1 && mPlain[0] === "Q-FREE");

  // ── 3. the panel — signed out ────────────────────────────────────────
  const doc = window.document;
  const p1 = mm.panel({ g: ladder, mems: ladder.members, lane: "anchored",
    sig: "ESOL M9019|ESOL M9040|ESOL M9050",
    getSession: () => Promise.resolve(null) });
  doc.body.appendChild(p1);
  await sleep(20);   // let loadDoctrineQuestions resolve
  check("panel auto-opens on a specific trigger", p1.open === true);
  check("panel shows the ladder question",
    p1.textContent.indexOf("level ladder") >= 0 || p1.textContent.indexOf("Q-LADDER") >= 0);
  check("no SpeechRecognition → typing fallback note",
    p1.textContent.indexOf("voice unavailable") >= 0);
  const ta1 = p1.querySelector("textarea");
  const save1 = Array.from(p1.querySelectorAll("button"))
    .filter((b) => b.textContent.indexOf("Save") >= 0)[0];
  const status1 = p1.querySelector(".uc-mm-status");
  check("panel has textarea + save + status", !!ta1 && !!save1 && !!status1);
  save1.click();   // empty → local validation
  check("empty save → nothing posted, hint shown",
    posts.length === 0 && status1.textContent.indexOf("Nothing to save") >= 0);
  ta1.value = "Package these into Beginning ESL.";
  save1.click();
  await sleep(20);
  check("signed-out save → sign-in hint, nothing posted",
    posts.length === 0 && status1.textContent.indexOf("Sign in") >= 0);

  // ── 4. the panel — signed in, payload shape ──────────────────────────
  const p2 = mm.panel({ g: ladder, mems: ladder.members, lane: "anchored",
    sig: "ESOL M9019|ESOL M9040|ESOL M9050",
    getSession: () => Promise.resolve({ access_token: "tok", email: "map@rccd.edu" }) });
  doc.body.appendChild(p2);
  await sleep(20);
  const ta2 = p2.querySelector("textarea");
  const save2 = Array.from(p2.querySelectorAll("button"))
    .filter((b) => b.textContent.indexOf("Save") >= 0)[0];
  const stance2 = p2.querySelector("select");
  stance2.value = "package";
  ta2.value = "Fold reading levels 1-6 into Beginning/Intermediate/Advanced ESL.";
  save2.click();
  await sleep(20);
  check("signed-in save POSTs one note", posts.length === 1);
  const body = posts[0] && posts[0].body;
  check("payload: transcript + stance + page", body
    && body.transcript.indexOf("Fold reading") === 0
    && body.stance === "package" && body.page === "ccr-worklist");
  check("payload: group_sig + lane + created_by", body
    && body.group_sig === "ESOL M9019|ESOL M9040|ESOL M9050"
    && body.lane === "anchored" && body.created_by === "map@rccd.edu");
  check("payload: question defaults to first match (Q-LADDER)", body && body.question_id === "Q-LADDER");
  check("payload: members snapshot is compact [{id,t,u,d}]", body
    && Array.isArray(body.members) && body.members.length === 3
    && body.members[0].id === "ESOL M9019" && !("s" in body.members[0]));
  check("save clears textarea + confirms", ta2.value === ""
    && p2.querySelector(".uc-mm-status").textContent.indexOf("Saved") >= 0);

  // ── 5. worklist integration (source-level) ───────────────────────────
  check("renderGroup mounts the panel",
    src.indexOf("box.appendChild(buildMindMeldPanel({") >= 0);
  check("panel wired with groupSig + ensureFresh",
    /buildMindMeldPanel\(\{\s*\n?\s*g: g, mems: mems, sig: groupSig\(g\)/.test(src)
    && src.indexOf("lane: g._kind || \"anchored\", getSession: ensureFresh") >= 0);

  // ── report ────────────────────────────────────────────────────────────
  let fail = 0;
  results.forEach(([name, ok]) => { if (!ok) fail++; console.log((ok ? "  ✓ " : "  ✗ ") + name); });
  console.log(fail ? `${fail} FAILED of ${results.length}` : `all ${results.length} checks passed`);
  process.exit(fail ? 1 : 0);
})();
