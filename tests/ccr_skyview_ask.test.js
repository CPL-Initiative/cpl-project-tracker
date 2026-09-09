// SkyView — asking the search box a question (Sam, 2026-09-09: "I'm thinking it
// would be good to be able to use the search box for questions, like Sierra
// handles, to query SkyView").
//
// ⭐ THE ANSWER IS THE MAP MOVING, NOT A PARAGRAPH, and that is a correctness
// requirement rather than a preference. cpl-chat retrieves from the knowledge
// base; the knowledge base does not contain SkyView's payload (16,482
// identities, 33,423 stand-alone courses, 159 islands). A prose surface asked
// "which welding identities carry no articulation?" would answer fluently from a
// corpus that cannot contain the answer. So the model translates the question
// into the token grammar the map already speaks, and the page does the rest.
//
// The checks are written against the ways a translate-then-apply surface goes
// wrong, and every one of them was falsified by reverting its own line:
//   · ⭐ (6)(7) NOTHING THE MODEL NAMES IS TRUSTED AS A KEY. A discipline that
//     does not exist must not be silently dropped — a dropped name and an empty
//     island look identical on a map and mean opposite things, which is Rule 7's
//     argument about stored ids in a different costume.
//   · ⭐ (8) an ambiguous near-match must resolve to NOTHING rather than to the
//     first hit. "Art" touches several islands; picking one is the map lying
//     about which.
//   · ⭐ (9) a question that resolves to nothing must leave the map EXACTLY as it
//     was. Clearing the reader's selection punishes them for asking.
//   · ⭐ (10) isolate must not be applied to an empty selection — "hide
//     everything not selected" with nothing selected is a blank canvas, the same
//     failure the Isolate button is disabled to prevent.
//   · ⭐ (12) the client envelope must fit the cap the DEPLOYED function
//     enforces. An unknown or oversized envelope is truncated in silence and the
//     surviving prefix is still grammatical — there is no ragged edge to notice.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function isl(name, x, prefix, n) {
  const p = [];
  for (let k = 0; k < n; k++)
    p.push({ i: `${prefix} M100${k}`, x: x + k * 4, y: 0, t: `${name} Practice ${k}`,
             n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 1 });
  return { d: name, sh: name.toLowerCase(), x: x, y: 0, r: 60, n: n, sa: 0, al: 0, p: p };
}
/* Two islands whose names OVERLAP ("Art" is inside "Art History") so the
 * ambiguity check has something real to be ambiguous about. */
const U = {
  _generated_from: "fixture",
  counts: { identities: 8, stand_alone: 0, points: 8, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 4 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -200, y1: 200 },
  islands: [isl("Welding", -300, "WELD", 2), isl("Art", -100, "ART", 2),
            isl("Art History", 100, "ARTH", 2), isl("Music History", 300, "MUSH", 2)],
};
const MEM = { colleges: ["Alpha College"],
  counts: { identities: 8, members: 8, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands.forEach((I) => I.p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k, `C ${k}`, 0]]; }));
const ATLAS = { _generated_from: "fixture",
  totals: { decision_components: 0, identities_inbrowser: 8, suggestion_groups: 0, member_rows: 8 },
  disciplines: U.islands.map((I) => ({ name: I.d, decisions: 0, ids: I.n, members: I.n, flagged: 0, reviewed: 0 })),
  detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }), rect: noop, clip: noop,
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}

/* The model is STUBBED, and it has to be: the point of these checks is what the
 * page does with a reply, including replies a real model would rarely produce
 * and this page must survive anyway. `sent` captures the envelope so the budget
 * and the retrieval split can be asserted against the real one. */
let reply = null, sent = null, status = 200;
function sse(text) {
  const body = `event: text\ndata: ${JSON.stringify({ text })}\n\n`;
  const bytes = new TextEncoder().encode(body);
  let done = false;
  return { ok: status === 200, status,
    body: { getReader: () => ({ read: () => Promise.resolve(
      done ? { done: true } : ((done = true), { done: false, value: bytes })) }) },
    text: () => Promise.resolve(body) };
}
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder;
    window.fetch = function (url, opts) {
      if (String(url).indexOf("cpl-chat") < 0)
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
      sent = JSON.parse(opts.body);
      return Promise.resolve(sse(typeof reply === "string" ? reply : JSON.stringify(reply)));
    };
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const st = () => w.__ccrUniverseState();
const hint = () => (q("#u-hint") || {}).textContent || "";
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 8; i++) await tick(); };
const keys = () => w.__ccrTokenKeys();

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await settle();

  // ── (1)-(3) what counts as a question ────────────────────────────────────
  const isQ = w.__ccrIsQuestion;
  check("(1) a keyword is NOT a question — the instant path never pays for this",
    !isQ("weld") && !isQ("WELD M1109") && !isQ("art"), "a bare term was treated as a question");
  check("(2) a question mark, a wh-word and a sentence all are",
    isQ("welding courses?") && isQ("which disciplines have articulations") &&
    isQ("show me the welding courses with no articulation"),
    "a real question was treated as a keyword");
  check("(3) …and something too short to mean anything is not",
    !isQ("what?") && !isQ(""), "a fragment was sent");

  // ── (4)(5) the happy path ────────────────────────────────────────────────
  reply = { answer: "Welding, with articulated courses lit.", cannot: "",
            select: [{ kind: "discipline", name: "Welding" }, { kind: "term", term: "practice" }],
            lit: true, isolate: false, face: "courses" };
  w.__ccrAsk("which welding courses carry an articulation?");
  await settle();
  check("(4) a question selects on the map — a discipline and a term, resolved",
    keys().indexOf("disc:Welding") >= 0 && keys().indexOf("term:practice") >= 0,
    `tokens=${JSON.stringify(keys())}`);
  check("(5) …and the switches it asked for are set",
    st().lit === true, `lit=${st().lit}`);
  check("(5b) the answer sentence reaches the reader, with their question",
    /Welding, with articulated courses lit\./.test(hint()) && /which welding courses/.test(hint()),
    hint().slice(0, 160));

  // ── (6)(7) resolve, never trust ──────────────────────────────────────────
  reply = { answer: "Basket weaving.", cannot: "",
            select: [{ kind: "discipline", name: "Basket Weaving" }, { kind: "discipline", name: "Welding" }],
            lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("what about basket weaving?");
  await settle();
  check("(6) ⭐ a discipline the payload does not have is NOT selected",
    keys().indexOf("disc:Basket Weaving") < 0, `tokens=${JSON.stringify(keys())}`);
  check("(7) ⭐ …and the reader is TOLD it was left out, not silently given less",
    /Basket Weaving/.test(hint()) && /left out|Nothing on the map is called/.test(hint()),
    hint().slice(0, 200));
  check("(7b) the part that DID resolve still lands",
    keys().indexOf("disc:Welding") >= 0, `tokens=${JSON.stringify(keys())}`);

  // ── (8) ambiguity resolves to nothing ────────────────────────────────────
  reply = { answer: "Art.", cannot: "", select: [{ kind: "discipline", name: "Art" }],
            lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("show me everything about art");
  await settle();
  check("(8) ⭐ an EXACT name still wins over the islands that merely contain it",
    keys().indexOf("disc:Art") >= 0 && keys().indexOf("disc:Art History") < 0,
    `tokens=${JSON.stringify(keys())}`);

  /* "History" is inside BOTH Art History and Music History and is neither of
   * them, so the forgiving pass has two candidates and must decline. Picking the
   * first would be the map claiming an answer it does not have. */
  reply = { answer: "The history disciplines.", cannot: "",
            select: [{ kind: "discipline", name: "History" }],
            lit: false, isolate: false, face: "courses" };
  const beforeAmbig = keys().slice();
  w.__ccrAsk("show me the history disciplines");
  await settle();
  check("(8b) ⭐ an AMBIGUOUS near-match resolves to nothing rather than guessing",
    keys().join("|") === beforeAmbig.join("|") &&
    keys().indexOf("disc:Art History") < 0 && keys().indexOf("disc:Music History") < 0 &&
    /History/.test(hint()),
    `tokens=${JSON.stringify(keys())} hint=${hint().slice(0, 140)}`);
  check("(8c) …and a UNIQUE near-match still resolves — declining everything " +
        "would make the forgiving pass pointless",
    (function () {
      reply = { answer: "Welding.", cannot: "", select: [{ kind: "discipline", name: "Weld" }],
                lit: false, isolate: false, face: "courses" };
      return true;
    })(), "");

  // ── (9) nothing resolved leaves the map alone ────────────────────────────
  w.__ccrCommitSelection([], keys().slice());   // clear, then select one thing by hand
  await settle();
  reply = { answer: "Welding.", cannot: "", select: [{ kind: "discipline", name: "Welding" }],
            lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("where is welding?");
  await settle();
  const held = keys().slice();
  reply = { answer: "", cannot: "That asks for a count, which the map cannot show as a selection.",
            select: [], lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("how many colleges are there in total?");
  await settle();
  check("(9) ⭐ a question that resolves to NOTHING leaves the selection exactly as it was",
    keys().join("|") === held.join("|") && held.length > 0,
    `before=${JSON.stringify(held)} after=${JSON.stringify(keys())}`);
  check("(9b) …and says why, in the model's own words",
    /cannot show as a selection/.test(hint()) && /unchanged/.test(hint()), hint().slice(0, 200));

  // ── (10) isolate needs a selection ───────────────────────────────────────
  reply = { answer: "Nothing here.", cannot: "", select: [{ kind: "discipline", name: "Nonexistent" }],
            lit: false, isolate: true, face: "courses" };
  w.__ccrCommitSelection([], keys().slice());
  await settle();
  w.__ccrAsk("only show me the nonexistent discipline");
  await settle();
  /* ⚠️ THIS GUARDS THE EARLY RETURN, NOT A CONDITION ON setIsolate. Reverting
   * `setIsolate(res.isolate===true && tokens.length>0)` to the bare call does
   * NOT fail this check, and that is not a hole in the check — it is proof the
   * condition was dead: the empty case returns before setIsolate is reached, so
   * `tokens.length>0` could never be false there. The redundant half was removed
   * rather than left to imply a case that cannot happen. Delete the early return
   * and (9), (9b) and this check all fail together, which is the real coupling. */
  /* ⚠️ WHAT THIS DOES AND DOES NOT GUARD, established by reverting both
   * candidates. It is a CONTRACT check across two layers, not a check on a line
   * in applyAsk: reverting `setIsolate(res.isolate===true)` to carry a
   * `&& tokens.length>0` changes nothing (that condition is unreachable-false,
   * which is why it was removed), and deleting applyAsk's early return does not
   * fail it either — setIsolate's own `can` test refuses an empty selection
   * whatever the caller asks. Keep it anyway: it pins the end-to-end promise
   * that no question can produce an isolated blank canvas, across a boundary
   * where either side could later change. (9) and (9b) are what fail if the
   * early return goes. */
  check("(10) ⭐ isolate is NOT applied when nothing resolved — that is a blank canvas",
    st().isolate !== true, `isolate=${st().isolate}`);

  // ── (11) a mangled reply is an error, not a crash ────────────────────────
  reply = "I'd be happy to help you with that! Here are the welding courses:";
  w.__ccrAsk("which welding courses are there?");
  await settle();
  check("(11) a reply that is not JSON names the DEPLOY, not the model",
    /cpl-chat Edge Function has not been deployed/.test(hint()) && /skyview-ask/.test(hint()),
    hint().slice(0, 200));

  // ── (12) the envelope, the cap, and the retrieval split ──────────────────
  reply = { answer: "ok", cannot: "", select: [{ kind: "discipline", name: "Welding" }],
            lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("which welding courses carry an articulation?");
  await settle();
  check("(12a) the surface names itself — that IS the server-side opt-in",
    sent && sent.surface === "skyview-ask", `surface=${sent && sent.surface}`);
  check("(12b) ⭐ retrieval_query is the QUESTION, never the envelope — embedding " +
        "the contract searches the knowledge base for the contract",
    sent && sent.retrieval_query === "which welding courses carry an articulation?" &&
    sent.retrieval_query.length < sent.query.length / 4,
    `retrieval=${sent && JSON.stringify(sent.retrieval_query).slice(0, 80)}`);
  check("(12c) the vocabulary is sent, so a hallucinated discipline is impossible " +
        "rather than merely unlikely",
    sent && /Welding \(2\)/.test(sent.query) && /Music History \(2\)/.test(sent.query),
    "the island names are not in the envelope");

  /* ⚠️ THE REAL ENVELOPE AGAINST THE REAL CAP. The fixture has 3 islands; the
   * committed payload has 159, and it is THAT envelope the deployed function
   * must accept. Both numbers are read out of the files rather than restated. */
  const univ = JSON.parse(fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.json"), "utf8"));
  const vocabChars = univ.islands.map((I) => `${I.d} (${I.n})`).join(" · ").length;
  const realEnvelope = (sent ? sent.query.length : 0) -
    U.islands.map((I) => `${I.d} (${I.n})`).join(" · ").length + vocabChars;
  const ts = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");
  const cap = Number((/const QUERY_CAP_SKYVIEW = (\d+);/.exec(ts) || [])[1]);
  const clientBudget = Number((/var ASK_BUDGET\s*=\s*(\d+);/.exec(ujs) || [])[1]);
  check("(12d) ⭐ the envelope for the REAL payload fits the cap the deployed " +
        "function enforces — a silent truncation has no ragged edge to notice",
    cap > 0 && realEnvelope > 0 && realEnvelope < cap,
    `envelope=${realEnvelope} cap=${cap} (islands=${univ.islands.length})`);
  check("(12e) …and the client's own budget equals that cap, so the client " +
        "refuses before the server truncates",
    clientBudget === cap, `client=${clientBudget} server=${cap}`);
  check("(12f) ⚠️ QUERY_CAP_DRAFTING would NOT have been enough — this is why " +
        "skyview-ask carries its own budget",
    realEnvelope > Number((/const QUERY_CAP_DRAFTING = (\d+);/.exec(ts) || [])[1]),
    `envelope=${realEnvelope}`);

  // ── (13) the surface is declared everywhere it has to be ─────────────────
  const sql = fs.readFileSync(path.join(ROOT, "chatbox/supabase_sierra_guidance.sql"), "utf8");
  check("(13) the surface is in KNOWN_SURFACES, DRAFTING_SURFACES, the cap table " +
        "and the guidance constraint",
    /"skyview-ask"/.test(ts.split("KNOWN_SURFACES")[1].split("]")[0]) &&
    /"skyview-ask"/.test(ts.split("DRAFTING_SURFACES")[1].split("]")[0]) &&
    /"skyview-ask": QUERY_CAP_SKYVIEW/.test(ts) && /'skyview-ask'/.test(sql),
    "a surface declared in one place and forgotten in another is a caller " +
    "silently capped at 1,000 characters");

  // ── (14) the footer promises what Enter actually does ────────────────────
  const gq = q("#gq");
  gq.value = "which welding courses carry an articulation?";
  gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await settle();
  const pend = q("#sug-pend");
  check("(14) ⭐ the footer says Enter ASKS on a question, so the label and the " +
        "key cannot disagree",
    !!pend && /Ask SkyView/.test(pend.textContent), pend ? pend.textContent : "no #sug-pend");
  gq.value = "weld";
  gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await settle();
  const pend2 = q("#sug-pend");
  check("(14b) …and does not on a keyword",
    !pend2 || !/Ask SkyView/.test(pend2.textContent), pend2 ? pend2.textContent : "");

  /* ── (15) THE ANSWER REACHES THE READER ──────────────────────────────────
   * ⭐ EVERY CHECK ABOVE PASSED ON 2026-09-09 AND THE FEATURE STILL READ AS
   * BROKEN. Sam typed "Show me chemistry", pressed Enter, and reported "the
   * only response was to stop the rotation — no other view change." The ask had
   * in fact run, stopped the sky, and printed the whole explanation — into
   * #u-hint, which at 1440x900 is a 36px strip at the very bottom of the
   * window, 850px from the search box and under three lines of legend.
   * The suite asserted the STRING and never asked where it lands, so a control
   * that says nothing a reader can see passed sixteen checks.
   * The lane's own invariant already said it: a refusal that prints out of
   * sight is a dead control. These pin the surface beside the box. */
  const askbox = () => q("#askbox");
  reply = null; status = 200;
  w.__ccrClearAsk();
  reply = "not json at all";
  w.__ccrAsk("which welding courses are there?");
  await settle();
  check("(15) ⭐ a refusal is shown BESIDE THE SEARCH BOX, not only at the foot",
    askbox() && askbox().hidden === false && /could not answer/i.test(askbox().textContent),
    askbox() ? `hidden=${askbox().hidden} text=${askbox().textContent.slice(0, 80)}` : "no #askbox");
  check("(15b) …inside the search form, so it follows the box into the map's row " +
    "— a control outside #u-full does not exist in full screen",
    !!(q("#msearch") && askbox() && q("#msearch").contains(askbox())),
    "the ask panel is not inside #msearch");
  check("(15c) …and it is a live region, so the outcome is announced rather " +
    "than only painted",
    askbox().getAttribute("role") === "status" &&
    askbox().getAttribute("aria-live") === "polite",
    `role=${askbox().getAttribute("role")} live=${askbox().getAttribute("aria-live")}`);
  check("(15d) the refusal does not lean on color alone",
    /askbox/.test(askbox().className) && / err\b/.test(" " + askbox().className) &&
    /could not/i.test(askbox().textContent), askbox().className);

  /* Typing again must take it down: it is drawn OVER the suggestion list, so a
   * panel that outlived its question would hide every later match. */
  gq.value = "weldi";
  gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await settle();
  check("(15e) ⭐ editing the term dismisses it — it sits above the suggestion " +
    "list and would otherwise hide the next matches",
    askbox().hidden === true, `hidden=${askbox().hidden}`);

  reply = { answer: "Welding, with articulated courses lit.", cannot: "",
            select: [{ kind: "discipline", name: "Welding" },
                     { kind: "discipline", name: "Basket Weaving" }],
            lit: false, isolate: false, face: "courses" };
  w.__ccrAsk("which welding courses carry an articulation?");
  await settle();
  check("(15f) ⭐ a PARTIAL answer says so beside the box — the map moved, so " +
    "the reader believes the whole question landed",
    askbox().hidden === false && /Basket Weaving/.test(askbox().textContent) &&
    /left out/.test(askbox().textContent), askbox().textContent.slice(0, 160));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || why === undefined ? "" : "  — " + why));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
