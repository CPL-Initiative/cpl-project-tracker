// cpl_writer.js — the one writer module every drafting surface shares (Sam, Open Asks
// Sheet 118 ruling 5, 2026-10-23: "one writer module"). These checks guard what the
// module can get wrong:
//   - each rule is present once, as a named part, with the words the rulings use
//     (the naming rule, the house voice, American spelling, the banned business words,
//     the funding vocabulary);
//   - the model is one unversioned alias, named once in the source;
//   - system() puts the consumer's role first, the shared rules next, the consumer's own
//     paragraphs last, and omit leaves a part out;
//   - draft() posts to the page's proxy with the one model, the system prompt and the
//     effort, resolves the text and the model, and rejects with a sentence a tab can show
//     (no proxy, the proxy's error, the model declining, no text);
//   - both HTMLs load it once, before report_generator.js (Rule 4), and comms.js is a
//     consumer that names no model of its own;
//   - plain words, American spelling, no DOM, no storage.
//
// Run from repo root: `npm test` (or `node tests/cpl_writer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      pending.push(r.catch(function (e) { check(label + " — driver threw: " + (e && e.message), false); }));
    }
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("cpl_writer.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    calls.push({ url: String(url), init: init || {} });
    return opts.fetch ? opts.fetch(String(url), init || {}) : Promise.reject(new Error("no route"));
  };
  if (opts.proxy) w.CPL_REPORT_PROXY_URL = opts.proxy;
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return { w, calls, W: w.CPL_WRITER };
}
function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return typeof body === "string" ? Promise.reject(new Error("not json")) : Promise.resolve(body); } });
}

// ── (1) The parts, each once, in the rulings' words ─────────────────────────
block("(1)", function () {
  const { W } = load();
  check("(1) the module exports its parts and its two calls", W && ["MODEL", "NAMING_RULE", "HOUSE_VOICE", "SPELLING", "BUSINESS_WORDS", "FUNDING_WORDS", "AUDIENCES"].every(function (k) { return typeof W[k] === "string" || Array.isArray(W[k]); }) && typeof W.system === "function" && typeof W.draft === "function");
  check("(1) the naming rule: the CPL Initiative, the MAP platform's long form, never the MAP Initiative, the 2017 name history-only",
    /"CPL Initiative" of the California Community Colleges Chancellor's Office/.test(W.NAMING_RULE) && /Mapping Articulated Pathways \(MAP\) platform/.test(W.NAMING_RULE) &&
    /never call it the "MAP Initiative"/.test(W.NAMING_RULE) && /Never expand MAP as "Military Articulation Platform"/.test(W.NAMING_RULE) && /2017/.test(W.NAMING_RULE));
  check("(1) the house voice carries Sam's moves", /house voice/.test(W.HOUSE_VOICE) && /active voice, and name the actor/.test(W.HOUSE_VOICE) &&
    /positively, as a declaration/.test(W.HOUSE_VOICE) && /Concede the reader's position/.test(W.HOUSE_VOICE) && /preserve the reader's authority/.test(W.HOUSE_VOICE) &&
    /student as the subject/.test(W.HOUSE_VOICE) && /named instrument/.test(W.HOUSE_VOICE) && /Put the ask last, and make it small/.test(W.HOUSE_VOICE) &&
    /adjective phrases, metaphors, asides/.test(W.HOUSE_VOICE) && /No bold, bullets, glyphs or emoji/.test(W.HOUSE_VOICE));
  check("(1) American spelling is named with its word list", /American spelling/.test(W.SPELLING) && /color, behavior, normalize, organization, analyze, center, judgment, program/.test(W.SPELLING));
  check("(1) the banned business register, all seven words", ["leverage", "utilize", "robust", "deep dive", "synergy", "operationalize", "impactful"].every(function (x) { return W.BUSINESS_WORDS.indexOf(x) >= 0; }) && /Never use/.test(W.BUSINESS_WORDS));
  check("(1) the funding vocabulary: funding never money, allocates and expends, qualifies for, counts toward, never earns, draws, unspent or an advance",
    /say funding, never money/.test(W.FUNDING_WORDS) && /max award/.test(W.FUNDING_WORDS) && /allocates funding and a college expends it/.test(W.FUNDING_WORDS) &&
    /qualifies for its award/.test(W.FUNDING_WORDS) && /counts toward it/.test(W.FUNDING_WORDS) && /Never say a college earns, draws or has unspent funding/.test(W.FUNDING_WORDS) &&
    /never suggest an advance/.test(W.FUNDING_WORDS) && /TBA/.test(W.FUNDING_WORDS));
  check("(1) each rule's text appears once in the source", ["The program is the", "house voice:", "Never use leverage", "say funding, never money"].every(function (x) { return SRC.split(x).length === 2; }));
});

// ── (2) The one model ────────────────────────────────────────────────────────
block("(2)", function () {
  const { W } = load();
  const pins = SRC.match(/claude-[a-z0-9-]+/g) || [];
  check("(2) the model is named once in the source", pins.length === 1, pins.join());
  check("(2) the model is an unversioned alias, never a dated pin", /^claude-[a-z]+-\d+(-\d+)?$/.test(W.MODEL) && !/\d{8}/.test(W.MODEL), W.MODEL);
  check("(2) the export carries it", W.MODEL === pins[0]);
});

// ── (3) The audiences ────────────────────────────────────────────────────────
block("(3)", function () {
  const { W } = load();
  const ids = W.AUDIENCES.map(function (a) { return a.id; });
  check("(3) eleven audiences, each with an id, a label and one line of guidance", W.AUDIENCES.length === 11 && W.AUDIENCES.every(function (a) { return a.id && a.label && typeof a.guide === "string" && a.guide.length > 20 && a.guide.indexOf("\n") < 0; }));
  check("(3) the CEOs first and Other last, as the selector lists them", ids[0] === "ceos" && ids[ids.length - 1] === "other" && ids.indexOf("co") >= 0 && ids.indexOf("map_team") >= 0 && ids.indexOf("public") >= 0);
  check("(3) the ids are unique", new Set(ids).size === ids.length);
  const rids = W.REPORT_AUDIENCES.map(function (a) { return a.id; });
  check("(3) the Custom Report's six audiences, legislators first and general last, each with a distinct report title and a guide",
    rids.length === 6 && rids[0] === "legislators" && rids[5] === "general" && new Set(rids).size === 6
    && new Set(W.REPORT_AUDIENCES.map(function (a) { return a.title; })).size === 6 && W.REPORT_AUDIENCES.every(function (a) { return a.label && a.title && typeof a.guide === "string" && a.guide.length > 40; }));
  check("(3) audienceLabel and audienceGuide read by id; an unknown id falls back to Other", W.audienceLabel("ceos") === "College CEOs" && /superintendent\/president/.test(W.audienceGuide("ceos")) && W.audienceGuide("nobody") === W.audienceGuide("other") && W.audienceLabel("nobody") === "nobody");
});

// ── (4) system() composes in order ───────────────────────────────────────────
block("(4)", function () {
  const { W } = load();
  const s = W.system({ role: "ROLE LINE.", extra: ["FACTS PARA.", "FORMAT PARA."] });
  const at = function (x) { return s.indexOf(x); };
  check("(4) the role first, then the voice, then one Words paragraph, then the consumer's own paragraphs in order",
    at("ROLE LINE.") === 0 && at("ROLE LINE.") < at(W.HOUSE_VOICE) && at(W.HOUSE_VOICE) < at("Words: ") && at("Words: ") < at(W.NAMING_RULE) && at(W.NAMING_RULE) < at("FACTS PARA.") && at("FACTS PARA.") < at("FORMAT PARA."));
  check("(4) the Words paragraph holds spelling, naming, business words and funding words", /Words: American spelling/.test(s) && s.indexOf(W.SPELLING) < s.indexOf(W.NAMING_RULE) && s.indexOf(W.NAMING_RULE) < s.indexOf(W.BUSINESS_WORDS) && s.indexOf(W.BUSINESS_WORDS) < s.indexOf(W.FUNDING_WORDS));
  check("(4) paragraphs are separated by a blank line", s.split("\n\n").length === 5);
  const noFunding = W.system({ role: "R", omit: ["FUNDING_WORDS"] });
  check("(4) omit leaves a part out and keeps the rest", noFunding.indexOf(W.FUNDING_WORDS) < 0 && noFunding.indexOf(W.NAMING_RULE) >= 0 && noFunding.indexOf(W.HOUSE_VOICE) >= 0);
  check("(4) with no role and no extra, the shared rules alone", W.system().split("\n\n").length === 2 && W.system().indexOf(W.HOUSE_VOICE) === 0);
  check("(4) an empty extra paragraph is skipped", W.system({ role: "R", extra: ["", null, "X"] }).split("\n\n").length === 4);
});

// ── (5) draft() through the proxy ────────────────────────────────────────────
block("(5) no proxy", function () {
  const { W, calls } = load();
  return W.draft("hello").then(function () { check("(5) without a proxy the call rejects", false); }, function (e) {
    check("(5) without a proxy the call rejects with the sentence the tab shows, and fetches nothing", e.message === W.NO_PROXY && /drafting proxy is not configured/.test(e.message) && calls.length === 0);
  });
});
block("(5) a draft", function () {
  const posts = [];
  const { W, calls } = load({ proxy: "https://proxy.example/", fetch: function (url, init) {
    posts.push(JSON.parse(init.body));
    return response(200, { model: "claude-served-9", stop_reason: "end_turn", content: [{ type: "thinking", thinking: "x" }, { type: "text", text: "Subject: A\n\nBody." }, { type: "text", text: "More." }] });
  } });
  const sys = W.system({ role: "R" });
  return W.draft("the prompt", { system: sys, maxTokens: 4000, effort: "high" }).then(function (r) {
    const p = posts[0] || {}, c = calls[0] || { init: {} };
    check("(5) the request goes to the page's proxy as a POST with the API's headers", c.url === "https://proxy.example/" && c.init.method === "POST" && c.init.headers["Content-Type"] === "application/json" && c.init.headers["anthropic-version"] === "2023-06-01");
    check("(5) the body carries the one model, the max tokens, the effort, the system prompt and the one user message", p.model === W.MODEL && p.max_tokens === 4000 && p.output_config && p.output_config.effort === "high" && p.system === sys && p.messages.length === 1 && p.messages[0].role === "user" && p.messages[0].content === "the prompt");
    check("(5) the text blocks join and the served model comes back", r.text === "Subject: A\n\nBody.\nMore." && r.model === "claude-served-9" && r.stopReason === "end_turn" && r.raw.content.length === 3);
  });
});
block("(5) defaults", function () {
  const posts = [];
  const { W } = load({ proxy: "https://proxy.example/", fetch: function (url, init) { posts.push(JSON.parse(init.body)); return response(200, { content: [{ type: "text", text: "ok" }] }); } });
  return W.draft("p").then(function (r) {
    const p = posts[0] || {};
    check("(5) with no options: the model, 4096 tokens, no system, no effort; the model falls back to the request's", p.model === W.MODEL && p.max_tokens === 4096 && !("system" in p) && !("output_config" in p) && r.model === W.MODEL && r.stopReason === null);
  });
});
block("(5) the proxy's error", function () {
  const { W } = load({ proxy: "https://proxy.example/", fetch: function () { return response(529, { error: { message: "overloaded" } }); } });
  return W.draft("p").then(function () { check("(5) a failed status rejects", false); }, function (e) {
    check("(5) a failed status rejects with the proxy's own message", e.message === "overloaded");
  });
});
block("(5) a status without JSON", function () {
  const { W } = load({ proxy: "https://proxy.example/", fetch: function () { return response(502, "<html>bad gateway</html>"); } });
  return W.draft("p").then(function () { check("(5) a bodyless failure rejects", false); }, function (e) {
    check("(5) a failure with no readable body names the status", /502/.test(e.message));
  });
});
block("(5) a refusal", function () {
  const { W } = load({ proxy: "https://proxy.example/", fetch: function () { return response(200, { stop_reason: "refusal", content: [] }); } });
  return W.draft("p").then(function () { check("(5) a refusal rejects", false); }, function (e) {
    check("(5) a refusal says the model declined", /declined/.test(e.message));
  });
});
block("(5) no text", function () {
  const { W } = load({ proxy: "https://proxy.example/", fetch: function () { return response(200, { stop_reason: "end_turn", content: [{ type: "tool_use" }] }); } });
  return W.draft("p").then(function () { check("(5) no text rejects", false); }, function (e) {
    check("(5) an answer with no text says so", /no text/.test(e.message));
  });
});
block("(5) overrides", function () {
  const posts = [];
  const { W, calls } = load({ proxy: "https://proxy.example/", fetch: function (url, init) { posts.push(JSON.parse(init.body)); return response(200, { content: [{ type: "text", text: "ok" }] }); } });
  return W.draft(null, { url: "https://other.example/", model: "claude-other-1", messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }], temperature: 0 }).then(function () {
    const p = posts[0] || {};
    check("(5) a consumer may override the url, the model, the messages and the temperature", calls[0].url === "https://other.example/" && p.model === "claude-other-1" && p.messages.length === 3 && p.temperature === 0);
  });
});

// ── (6) Both HTMLs load it once, before the report generator; comms.js consumes it ──
block("(6)", function () {
  check("(6) both HTMLs are byte-identical", DASH === INDEX, "Rule 4");
  const tag = '<script src="cpl_writer.js"></script>';
  check("(6) each HTML loads the writer once", DASH.split(tag).length === 2 && INDEX.split(tag).length === 2);
  check("(6) the writer loads before report_generator.js, so every consumer finds it", DASH.indexOf(tag) >= 0 && DASH.indexOf(tag) < DASH.indexOf('<script src="report_generator.js"></script>'));
  // Each port adds its surface here (the communications lane's Next).
  ["comms.js", "activity_summaries.js", "report_generator.js", "annual_report.js"].forEach(function (f) {
    const src = fs.readFileSync(f, "utf8");
    check("(6) " + f + " is a consumer: it reads CPL_WRITER, composes its system prompt with W.system, drafts through W.draft and names no model",
      /window\.CPL_WRITER/.test(src) && /W\.draft\(/.test(src) && /W\.system\(/.test(src) && !/claude-[a-z0-9-]+/.test(src) && !/CPL_REPORT_PROXY_URL/.test(src) && !/anthropic-version/.test(src));
  });
  check("(6) the module touches no DOM and no storage", !/document\./.test(SRC) && !/localStorage|sessionStorage/.test(SRC));
});

// ── (7) Words ────────────────────────────────────────────────────────────────
block("(7)", function () {
  check("(7) plain words, no emoji or marks", !/[\u{1F300}-\u{1FAFF}✅✔✓❌⚠🔒★☆]/u.test(SRC));
  check("(7) American spelling in the source", !/\b(colour|behaviour|organisation|catalogue|centre|licence|whilst|amongst|normalise|analyse)\b/i.test(SRC));
  check("(7) the module names itself the one writer and its ruling", /Sheet 118 ruling 5/.test(SRC) && /one writer module/.test(SRC));
});

Promise.all(pending).then(function () {
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n      " + String(r[2]).slice(0, 400)));
  });
  console.log(failed ? failed + " failed of " + results.length : "all " + results.length + " passed");
  process.exit(failed ? 1 : 0);
});
