// cpl_writer.js — the one writer module for every COBI surface that drafts prose or
// calls Claude. Sam, Open Asks Sheet 118 ruling 5 (2026-10-23): one writer module, the
// naming rule, the house voice, the funding vocabulary, American spelling, the audience
// definitions, the model constant and the proxy call, consumed by every surface one PR
// at a time, the Letters, Memos & Reports tab first.
//
// Twelve surfaces each carried their own copy of the naming rule, their own voice
// paragraph and their own model pin (four different values on 2026-10-23). This module
// holds each rule ONCE, as a named part a consumer reads, and the one call to the
// drafting proxy. A consumer composes its system prompt from these parts with system()
// and sends its prompt with draft(); it keeps only what is its own (its role line, its
// facts rule, its return format, its merge fields).
//
// The parts, each with the ruling it carries:
//   NAMING_RULE     the program is the CPL Initiative; MAP is the platform (Sam, 2026-07-03)
//   HOUSE_VOICE     the Chancellor's Office house voice (Sam, 2026-09-01 to 2026-09-16)
//   SPELLING        American spelling (Sam, 2026-08-21)
//   BUSINESS_WORDS  the banned business register (Sam, 2026-09-01)
//   FUNDING_WORDS   the funding vocabulary (Sam, 2026-08-31 to 2026-09-28;
//                   docs/reference/funding_vocabulary.md)
//   AUDIENCES       who a piece is written for, with one line of guidance each
//   MODEL           the one model, an unversioned alias: a dated pin is a latent outage on
//                   its retirement date (docs/kb-notes/playbook-edge-function-502-retired-model.md)
//
// Consumers, one PR each (the communications lane's Next): comms.js first, then
// activity_summaries.js and report_generator.js, then the rest of the twelve, retiring
// each surface's own copy and model pin as it ports.
//
// STATIC script in both HTMLs (Rule 4), loaded before report_generator.js so every
// consumer, static or lazy, finds window.CPL_WRITER. No DOM, no CSS, no storage. Loaded
// in plain node (a test requiring a consumer for its pure helpers) it attaches to
// globalThis instead, so a consumer looks for it on whichever of the two exists.
// Test: tests/cpl_writer.test.js.
(function () {
  "use strict";

  var root = (typeof window !== "undefined") ? window : globalThis;

  var MODEL = "claude-opus-5-5";

  // Sam, 2026-07-03. The generated Legislative Report had twice expanded MAP by its
  // 2017-era name; the rule is now appended to every prompt from this one place.
  var NAMING_RULE =
    "The program is the \"CPL Initiative\" of the California Community Colleges Chancellor's Office; never call it " +
    "the \"MAP Initiative\". The platform is the \"MAP platform\", long form \"Mapping Articulated Pathways (MAP) " +
    "platform\". Never expand MAP as \"Military Articulation Platform\": that was the platform's original name at " +
    "its 2017 launch, and it appears only when recounting that history. A historical title or a quotation stays " +
    "as written.";

  // Sam, 2026-09-01 (his VC of Academic Affairs' letter to CSU as the standard), 2026-09-08
  // (mannerly language), 2026-09-09 (active voice, name the actor), 2026-09-16 (state it
  // positively). docs/kb-notes/reference-cccco-house-voice.md carries the moves and exemplars.
  var HOUSE_VOICE =
    "Voice, the Chancellor's Office house voice: plain language, active voice, and name the actor (the model " +
    "measures, the Chancellor's Office allocates; never a passive that hides who acts). State each point " +
    "positively, as a declaration: declare the thing rather than what it is not. Concede the reader's position at " +
    "full strength before you argue, and preserve the reader's authority by saying what is theirs to decide. Keep " +
    "the student as the subject of the problem. Anchor each claim to a named instrument, a memo number, a statute or " +
    "a dashboard, rather than asserting it. Vary sentence length and let a short declarative land after a long " +
    "qualified one. Put the ask last, and make it small. Cut adjective phrases, metaphors, asides and any sentence " +
    "whose job is to show the writing; the sentence points at the reader, never at the writer. Prefer the " +
    "regulation's own words over an invented gloss. No bold, bullets, glyphs or emoji in the body of an email, a " +
    "letter or a memo; a report may use plain headings.";

  // Sam, 2026-08-21: "As a Yank, I prefer American, of course."
  var SPELLING =
    "American spelling, always: color, behavior, normalize, organization, analyze, center, judgment, program, " +
    "catalog, license, gray, enroll, while, among, and the -ize family.";

  // Sam, 2026-09-01: no business register.
  var BUSINESS_WORDS =
    "Never use leverage, utilize, robust, deep dive, synergy, operationalize or impactful; reach for invite, " +
    "partnership, shared aim, complement, warrant, examine together, practical first step.";

  // Sam, 2026-08-31 to 2026-09-28: CCC norms, never business norms.
  var FUNDING_WORDS =
    "Funding words: say funding, never money or pool; the per-institution figure is the max award. The " +
    "Chancellor's Office allocates funding and a college expends it. A college qualifies for its award and a " +
    "measure counts toward it; the result is demonstrated and the rest is remaining. Say restricted, redirect " +
    "and brought up to the minimum. Never say a college earns, draws or has unspent funding, never say double " +
    "count or on its face, and never suggest an advance. An unmeasured metric shows TBA.";

  // Who a piece is written for, in the order a selector lists them, with what the model
  // is told about each reader in one line.
  var AUDIENCES = [
    { id: "ceos", label: "College CEOs",
      guide: "a college president or superintendent/president reading between meetings: one screen, the college's own figures where they help, the ask in the last paragraph and small" },
    { id: "cios", label: "Chief instructional officers",
      guide: "a chief instructional officer: curriculum, faculty governance and the catalog are theirs; name what the Chancellor's Office asks and what stays the college's call" },
    { id: "cssos", label: "Chief student services officers",
      guide: "a chief student services officer: the student's path through admissions, records and counseling; name the office that acts" },
    { id: "cpl_leads", label: "CPL leads and coordinators",
      guide: "the people who do the CPL work at a college: practical, specific, the next step named with the person who can help" },
    { id: "vrc", label: "Veterans Resource Centers",
      guide: "Veterans Resource Center staff: the service member is the subject; the steps in MAP, the help on offer, no jargon" },
    { id: "faculty", label: "Faculty and academic senates",
      guide: "faculty and academic senate members: academic judgment stays theirs; credit recommendations, rigor and transfer" },
    { id: "co", label: "Chancellor's Office",
      guide: "Chancellor's Office colleagues and the Vice Chancellor: the memo register, every claim anchored to a memo, statute or dashboard" },
    { id: "map_team", label: "MAP team",
      guide: "the MAP team: short and plain, first names, what changed and who does what next" },
    { id: "colleges", label: "Colleges, general",
      guide: "college staff in general: plain words, acronyms explained on first use" },
    { id: "public", label: "Public",
      guide: "the public: plain words, no acronyms without their expansion, nothing a reader must already know" },
    { id: "other", label: "Other",
      guide: "a general reader: plain words, acronyms explained on first use" }
  ];
  var BY_ID = {};
  AUDIENCES.forEach(function (a) { BY_ID[a.id] = a; });
  function audience(id) { return BY_ID[id] || BY_ID.other; }
  function audienceLabel(id) { return BY_ID[id] ? BY_ID[id].label : String(id || ""); }
  function audienceGuide(id) { return audience(id).guide; }

  // system(opts) composes a consumer's system prompt: opts.role first (what this surface
  // drafts and who reads the draft), then the shared rules (the voice, then one Words
  // paragraph: spelling, naming, business words, funding words), then opts.extra, the
  // consumer's own paragraphs in order (its facts rule, its return format). opts.omit
  // names parts to leave out, for a surface that never names funding, say:
  // system({ role: ..., omit: ["FUNDING_WORDS"] }).
  function system(opts) {
    opts = opts || {};
    var omit = {};
    (opts.omit || []).forEach(function (k) { omit[k] = true; });
    var parts = [];
    if (opts.role) parts.push(String(opts.role));
    if (!omit.HOUSE_VOICE) parts.push(HOUSE_VOICE);
    var words = [];
    if (!omit.SPELLING) words.push(SPELLING);
    if (!omit.NAMING_RULE) words.push(NAMING_RULE);
    if (!omit.BUSINESS_WORDS) words.push(BUSINESS_WORDS);
    if (!omit.FUNDING_WORDS) words.push(FUNDING_WORDS);
    if (words.length) parts.push("Words: " + words.join(" "));
    (opts.extra || []).forEach(function (p) { if (p) parts.push(String(p)); });
    return parts.join("\n\n");
  }

  // The drafting proxy (cloudflare-worker-proxy.js) forwards the request body as it is.
  var NO_PROXY = "The drafting proxy is not configured on this page.";
  function proxyUrl() {
    return root.CPL_REPORT_PROXY_URL || "";
  }

  // draft(prompt, opts) sends one request through the proxy and resolves
  // { text, model, stopReason, raw }. opts: system (a string from system()), maxTokens
  // (default 4096), effort ("low" | "medium" | "high"; sent as output_config), model (an
  // override; the default is MODEL), messages (a full array in place of the one user
  // prompt), temperature, signal (an AbortSignal), url (an override of the page's proxy).
  // It rejects with a sentence a tab can show: no proxy on the page, the proxy's own
  // error message or status, the model declining, or an answer with no text.
  function draft(prompt, opts) {
    opts = opts || {};
    var url = opts.url || proxyUrl();
    if (!url) return Promise.reject(new Error(NO_PROXY));
    var body = {
      model: opts.model || MODEL,
      max_tokens: opts.maxTokens || 4096,
      messages: opts.messages || [{ role: "user", content: String(prompt == null ? "" : prompt) }]
    };
    if (opts.system) body.system = String(opts.system);
    if (opts.effort) body.output_config = { effort: opts.effort };
    if (opts.temperature != null) body.temperature = opts.temperature;
    var init = {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body)
    };
    if (opts.signal) init.signal = opts.signal;
    return root.fetch(url, init).then(function (res) {
      return res.json().then(function (j) {
        if (!res.ok) throw new Error((j && j.error && j.error.message) || ("the proxy answered " + res.status));
        return j;
      }, function () {
        throw new Error("the proxy answered " + res.status + " without a readable body");
      });
    }).then(function (j) {
      var text = ((j && j.content) || [])
        .filter(function (b) { return b && b.type === "text"; })
        .map(function (b) { return b.text; })
        .join("\n").trim();
      if (!text) throw new Error(j && j.stop_reason === "refusal" ? "the model declined this request" : "the model returned no text");
      return { text: text, model: (j && j.model) || body.model, stopReason: (j && j.stop_reason) || null, raw: j };
    });
  }

  root.CPL_WRITER = {
    MODEL: MODEL,
    NAMING_RULE: NAMING_RULE,
    HOUSE_VOICE: HOUSE_VOICE,
    SPELLING: SPELLING,
    BUSINESS_WORDS: BUSINESS_WORDS,
    FUNDING_WORDS: FUNDING_WORDS,
    AUDIENCES: AUDIENCES,
    audience: audience,
    audienceLabel: audienceLabel,
    audienceGuide: audienceGuide,
    system: system,
    draft: draft,
    proxyUrl: proxyUrl,
    NO_PROXY: NO_PROXY
  };
})();
