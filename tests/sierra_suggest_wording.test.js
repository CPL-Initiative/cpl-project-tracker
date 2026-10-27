// Suggest wording (S491; Sam, Open Asks Sheet 132, 2026-10-26: card 1 "build", card 2 "move").
//
// The Sierra Training tab sends a draft instruction to cpl-chat as the
// `guidance-wording` drafting caller and shows the rewrite beside the curator's
// words. The same change moved the naming rule out of sierra_guidance (where the
// 9,000-character budget could push it out) into Sierra's built-in instructions.
//
// What this guards:
//  (a) cpl-chat knows the caller: KNOWN_SURFACES, DRAFTING_SURFACES and a query cap,
//      and the longest envelope the tab builds fits under that cap (a cut envelope
//      is a silent content swap: the model rewrites the start of the instruction);
//  (b) the naming rule is in the STABLE prompt, so no team instruction can push it out;
//  (c) the request names the surface, sends no history and no audience, and carries
//      the draft whole;
//  (d) the panel shows the two columns with struck and underlined words, a line per
//      change, and nothing saves: "Use the suggestion" fills the box, "Keep mine"
//      leaves it as typed;
//  (e) a failed call leaves the curator's words untouched and says so;
//  (f) parseSuggestion takes the JSON out of a preamble or a code fence and refuses
//      an answer with no rewrite;
//  (g) XSS: a change line from the model renders escaped.
//
// Run from repo root: `npm test` (or `node tests/sierra_suggest_wording.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const CHAT = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const TAB = fs.readFileSync("sierra_training.js", "utf8");
const CHECK = fs.readFileSync("sierra_wording_check.js", "utf8");

// ── (a) the caller ──
let M = null;
try {
  M = liftBlock(CHAT, "const KNOWN_SURFACES", "function buildSystemPrompt(",
    ["KNOWN_SURFACES", "DRAFTING_SURFACES", "SURFACE_QUERY_CAPS", "QUERY_CAP_DRAFTING", "NAMING_RULE"]);
} catch (e) { M = null; }
check("(a) the surface block lifts", !!M);
check("(a) guidance-wording is a known surface and a drafting surface",
  M && M.KNOWN_SURFACES.has("guidance-wording") && M.DRAFTING_SURFACES.has("guidance-wording"));
check("(a) and it has its own query cap", M && M.SURFACE_QUERY_CAPS["guidance-wording"] === M.QUERY_CAP_DRAFTING);

// ── (b) the naming rule, built in ──
const stable = (CHAT.split("const stable = `")[1] || "").split("`;")[0];
check("(b) the naming rule is in the stable prompt", /\$\{NAMING_RULE\}/.test(stable));
check("(b) and says what cb226a48 said",
  M && /CPL Initiative/.test(M.NAMING_RULE) && /never "MAP Initiative"/.test(M.NAMING_RULE)
  && /NEVER expand MAP as "Military Articulation Platform"/.test(M.NAMING_RULE)
  && /Mapping Articulated Pathways \(MAP\) platform/.test(M.NAMING_RULE));

// ── the tab, with a scripted cpl-chat ──
function sse(text) {
  const enc = new TextEncoder();
  const chunks = [enc.encode("event: text\ndata: " + JSON.stringify({ text: text }) + "\n\n"), enc.encode("event: done\ndata: {}\n\n")];
  let i = 0;
  return { getReader: () => ({ read: () => Promise.resolve(i < chunks.length ? { done: false, value: chunks[i++] } : { done: true }) }) };
}
function makeWin(answer) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.alert = function () {};
  w.TextDecoder = TextDecoder;
  w.__calls = [];
  w.fetch = function (url, init) {
    if (/functions\/v1\/cpl-chat/.test(String(url))) {
      w.__calls.push({ url: String(url), body: JSON.parse(init.body) });
      if (answer === "fail") return Promise.resolve({ ok: false, status: 503 });
      return Promise.resolve({ ok: true, body: sse(answer) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  for (const code of [CHECK, TAB]) {
    const el = w.document.createElement("script"); el.textContent = code; w.document.body.appendChild(el);
  }
  const api = w.CPL_SIERRA_TRAINING_TAB;
  api._state.feedback = []; api._state.turns = [];
  api._state.guidance = [{ id: "r1", rule: "When someone asks about welding, answer with a table.", active: true,
    kind: "directive", created_at: "2026-10-20T10:00:00Z" }];
  return w;
}
const DRAFT = "When someone asks something like “What can I get for serve safe?\" list the crediforbeingyou.org link.";
const GOOD = "Here is the rewrite:\n```json\n" + JSON.stringify({
  suggested: "When someone asks what a ServSafe certificate can count toward, link creditforbeingyou.org.",
  changes: ["The link reads creditforbeingyou.org.", "<img src=x onerror=alert(1)> escaped"],
  clash: "" }) + "\n```";

async function run() {
  // (c) + (d)
  {
    const w = makeWin(GOOD);
    const api = w.CPL_SIERRA_TRAINING_TAB, root = w.document.getElementById("sierra-training-root");
    api._state.draftRule = DRAFT;
    api.render(root);
    const btn = root.querySelector('[data-guid-suggest="draft"]');
    check("(d) the composer offers Suggest wording", !!btn && /Suggest wording/.test(btn.textContent));
    await api._suggestFor("draft", root);
    const call = w.__calls[0] || { body: {} };
    check("(c) the request names the guidance-wording surface", call.body.surface === "guidance-wording");
    check("(c) …with no history and no audience", !("history" in call.body) && !("audience" in call.body));
    check("(c) …and carries the draft whole inside the envelope", call.body.query.indexOf(DRAFT) > 0
      && /Return one JSON object/.test(call.body.query));
    const panel = root.querySelector('[data-guid-suggest-panel="draft"]');
    check("(d) the panel shows both columns, struck and underlined",
      !!panel && /Your words/.test(panel.textContent) && panel.querySelector("del") && panel.querySelector("ins"));
    check("(d) a line per change", panel.querySelectorAll("ol li").length === 2);
    check("(g) a change line from the model renders escaped", !panel.querySelector("img") && /onerror/.test(panel.textContent));
    check("(d) nothing saved: no write left the tab", !w.__calls.some((c) => /sierra_guidance/.test(c.url)));
    root.querySelector('[data-guid-suggest-use="draft"]').click();
    check("(d) Use the suggestion fills the box", root.querySelector(".sit-guid-input").value.indexOf("ServSafe") >= 0
      && api._state.draftRule.indexOf("ServSafe") >= 0);
  }
  {
    const w = makeWin(GOOD);
    const api = w.CPL_SIERRA_TRAINING_TAB, root = w.document.getElementById("sierra-training-root");
    api._state.draftRule = DRAFT;
    api.render(root);
    await api._suggestFor("draft", root);
    root.querySelector('[data-guid-suggest-keep="draft"]').click();
    check("(d) Keep mine leaves the words as typed and closes the panel",
      root.querySelector(".sit-guid-input").value === DRAFT && !root.querySelector(".sit-guid-suggest"));
  }
  // (e)
  {
    const w = makeWin("fail");
    const api = w.CPL_SIERRA_TRAINING_TAB, root = w.document.getElementById("sierra-training-root");
    api._state.draftRule = DRAFT;
    api.render(root);
    await api._suggestFor("draft", root);
    const panel = root.querySelector('[data-guid-suggest-panel="draft"]');
    check("(e) a failed call says so and leaves the words untouched",
      /did not answer/.test(panel.textContent) && /unchanged/.test(panel.textContent) && api._state.draftRule === DRAFT);
  }
  // (a) the longest envelope fits the cap
  {
    const w = makeWin(GOOD);
    const env = w.CPL_SIERRA_TRAINING_TAB._suggestEnvelope("x".repeat(1500), 1500);
    check("(a) ⭐ the longest envelope fits guidance-wording's cap", M && env.length <= M.QUERY_CAP_DRAFTING);
    // (f)
    const P = w.CPL_SIERRA_TRAINING_TAB._parseSuggestion;
    check("(f) JSON out of a preamble and a fence", P(GOOD) && /ServSafe/.test(P(GOOD).suggested));
    check("(f) an answer with no rewrite is refused", P('{"changes": ["x"]}') === null && P("no json here") === null);
  }
}

run().then(() => {
  let fail = 0;
  for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (!ok) fail++; }
  console.log(`\n${results.length - fail}/${results.length} checks passed`);
  process.exit(fail ? 1 : 0);
}, (e) => { console.error(e); process.exit(1); });
