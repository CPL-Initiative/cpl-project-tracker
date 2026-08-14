// tests/sierra_rules_overlay.test.js
//
// sierra_rules — the built-in prompt rules as data (Priority 1 of
// docs/kb-notes/adr-judgment-in-tables-mechanism-in-code.md).
//
// WHAT FORCED IT. Sam wrote a Sierra instruction at 13:33 on 2026-08-14 telling
// her to name the colleges that had already articulated a credential. He
// re-tested at 14:49 and got the old behaviour. STATEWIDE_RULE — a hard-coded
// const — was suppressing the answer he wanted, and he could not see it, could
// not edit it, and the prompt's promise that "the team guidance wins" is a
// SENTENCE, NOT A MECHANISM: a specific prohibition earlier in the prompt beat a
// general instruction appended later.
//
// This lifts the real assembleRules() out of the edge function and RUNS it,
// rather than asserting on the source text — a re-implementation drifts and
// stops guarding anything (tests/lib/lift_ts.js says so in its own header).
//
// Run from repo root: `npm test` (or `node tests/sierra_rules_overlay.test.js`).

const fs = require("fs");
const path = require("path");
const { liftBlock } = require("./lib/lift_ts");

const SRC_PATH = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC_PATH, "utf8");

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log((cond ? "  ok   " : "  FAIL ") + name);
}

let assembleRules, RULE_PREDICATES, PROTECTED_RULE_KEYS, liftError = null;
try {
  ({ assembleRules, RULE_PREDICATES, PROTECTED_RULE_KEYS } = liftBlock(
    src,
    // Markers INCLUDE the `//` on purpose: liftBlock slices from the marker
    // index, so starting mid-comment would drop the `//` and the block would
    // begin with bare prose — "Invalid or unexpected token", pointing nowhere
    // near the real cause.
    "// ─── RULE ASSEMBLY BLOCK START",
    "// ─── RULE ASSEMBLY BLOCK END",
    ["assembleRules", "RULE_PREDICATES", "PROTECTED_RULE_KEYS"],
  ));
} catch (e) { liftError = e; }
check("the assembly block lifts and evaluates" + (liftError ? ` — ${liftError.message}` : ""), !liftError);
if (liftError) { console.log("\nsierra_rules_overlay.test.js: 0/1 checks passed"); process.exit(1); }

// Fixtures mirroring the real registry's shape, small enough to reason about.
// `portal` is in the PROTECTED set; `statewide` and `credential` are not.
const DEFAULTS = [
  { key: "statewide",   title: "Statewide",  body: "[SW-DEFAULT]",   appliesWhen: "always",     sortOrder: 10 },
  { key: "credential",  title: "Credential", body: "[CRED-DEFAULT]", appliesWhen: "credential", sortOrder: 40 },
  { key: "portal",      title: "Portal",     body: "[PORTAL-DEFAULT]", appliesWhen: "always",   sortOrder: 90 },
];
const EMPTY = { credentialContext: "", volumeContext: "", alignmentContext: "", creditContext: "" };
const WITH_CRED = { ...EMPTY, credentialContext: "x" };

// ── The overlay must OVERLAY, never replace the governing set ────────────────
// The rule the ADR calls load-bearing: a failed read costs the EDITS, never the
// GOVERNANCE. Sierra ungoverned is far worse than Sierra un-tuned.
{
  const r = assembleRules(DEFAULTS, null, EMPTY);
  check("a null overlay (failed read) still ships every code default",
        r.text.includes("[SW-DEFAULT]") && r.text.includes("[PORTAL-DEFAULT]"));
  check("a null overlay reports nothing as overridden", r.overridden.length === 0);
}
{
  const r = assembleRules(DEFAULTS, new Map(), EMPTY);
  check("an EMPTY overlay behaves identically to no overlay",
        r.text === assembleRules(DEFAULTS, null, EMPTY).text);
}

// ── applies_when is modelled, not flattened ──────────────────────────────────
// Flattening every rule to always-on would bloat the prompt and fire rules out
// of context — the handoff calls this out explicitly.
{
  const off = assembleRules(DEFAULTS, null, EMPTY);
  const on = assembleRules(DEFAULTS, null, WITH_CRED);
  check("a conditional rule stays OUT when its context is absent",
        !off.text.includes("[CRED-DEFAULT]") && !off.fired.includes("credential"));
  check("a conditional rule fires when its context is present",
        on.text.includes("[CRED-DEFAULT]") && on.fired.includes("credential"));
  check("the always-on rules fire in both cases",
        off.fired.includes("statewide") && on.fired.includes("statewide"));
}
check("every applies_when the SQL CHECK allows has a predicate in code",
      ["always", "credential", "credential_or_volume", "alignment", "volume", "credit"]
        .every((k) => typeof RULE_PREDICATES[k] === "function"));

// ── sort_order is the point: precedence becomes DATA ─────────────────────────
{
  const r = assembleRules(DEFAULTS, null, EMPTY);
  check("default order follows sortOrder (statewide before portal)",
        r.text.indexOf("[SW-DEFAULT]") < r.text.indexOf("[PORTAL-DEFAULT]"));
  const flipped = new Map([["statewide", { key: "statewide", sort_order: 999 }]]);
  const f = assembleRules(DEFAULTS, flipped, EMPTY);
  check("a curator can REORDER a rule without a deploy",
        f.text.indexOf("[SW-DEFAULT]") > f.text.indexOf("[PORTAL-DEFAULT]"));
  check("reordering does not drop or duplicate anything",
        f.fired.length === r.fired.length &&
        (f.text.match(/\[SW-DEFAULT\]/g) || []).length === 1);
}

// ── Editing the text — the thing that would have saved Sam four hours ────────
{
  const o = new Map([["statewide", { key: "statewide", body: "[SW-CURATED]" }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("a curator body REPLACES the code body on an ordinary rule",
        r.text.includes("[SW-CURATED]") && !r.text.includes("[SW-DEFAULT]"));
  check("the overridden rule is reported as overridden", r.overridden.includes("statewide"));
  check("rules left alone are NOT reported as overridden", !r.overridden.includes("portal"));
}
{
  // A blank/whitespace body is not an edit — it must not blank out a rule.
  const o = new Map([["statewide", { key: "statewide", body: "   " }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("a blank curator body falls back to the code default rather than emptying the rule",
        r.text.includes("[SW-DEFAULT]") && !r.overridden.includes("statewide"));
}

// ── active=false, and the PROTECTED set that ignores it ──────────────────────
// Sam, 2026-08-14: "yes, except a protected safety set."
{
  const o = new Map([["statewide", { key: "statewide", active: false }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("an ordinary rule CAN be switched off",
        !r.text.includes("[SW-DEFAULT]") && !r.fired.includes("statewide"));
}
{
  const o = new Map([["portal", { key: "portal", active: false }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("a PROTECTED rule cannot be switched off",
        r.text.includes("[PORTAL-DEFAULT]") && r.fired.includes("portal"));
}
{
  // The stronger half: a protected rule's code text must SURVIVE an override,
  // because gutting the body would remove the guard just as effectively as
  // disabling it. The curator's words are an ADDITION.
  const o = new Map([["portal", { key: "portal", body: "[PORTAL-EXTRA]" }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("a PROTECTED rule keeps its code body when a curator edits it",
        r.text.includes("[PORTAL-DEFAULT]"));
  check("a PROTECTED rule still gains the curator's addition",
        r.text.includes("[PORTAL-EXTRA]"));
  check("the code body comes FIRST on a protected rule",
        r.text.indexOf("[PORTAL-DEFAULT]") < r.text.indexOf("[PORTAL-EXTRA]"));
}
check("the protected set covers the fabrication and disclosure guards",
      ["portal", "landing_page", "volume", "credit_status"]
        .every((k) => PROTECTED_RULE_KEYS.has(k)));

// ── Garbage in the overlay must not silently unGOVERN a rule ────────────────
{
  const o = new Map([["statewide", { key: "statewide", applies_when: "whenever" }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("an unknown applies_when falls back to the DEFAULT rather than never firing",
        r.fired.includes("statewide"));
}
{
  const o = new Map([["not_a_real_rule", { key: "not_a_real_rule", body: "[GHOST]" }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("an overlay row with no matching code default is ignored, not injected",
        !r.text.includes("[GHOST]") && !r.fired.includes("not_a_real_rule"));
}
{
  const o = new Map([["statewide", { key: "statewide", body: "X".repeat(20000) }]]);
  const r = assembleRules(DEFAULTS, o, EMPTY);
  check("an oversized curator body is capped rather than blowing the prompt budget",
        (r.text.match(/X/g) || []).length <= 8000);
}

// ── "Which rules were in play" — the visibility half ─────────────────────────
{
  const r = assembleRules(DEFAULTS, null, WITH_CRED);
  check("fired lists the keys actually included, in assembly order",
        JSON.stringify(r.fired) === JSON.stringify(["statewide", "credential", "portal"]));
}
check("the turn log records which rules fired",
      /rules_fired: ruleReport\.fired/.test(src) &&
      /rules_overridden: ruleReport\.overridden/.test(src));
check("the overlay is read per turn and passed into the prompt builder",
      /await fetchSierraRules\(sb\)/.test(src) && /rulesOverlay, ruleReport\)/.test(src));
check("fetchSierraRules fails soft to null (code defaults), never to empty rules",
      /async function fetchSierraRules[\s\S]*?catch \{\s*return null;/.test(src));

// ── The refactor must not have changed the shipped prompt by itself ──────────
// sort_order was chosen to reproduce the previous hand-concatenated order.
check("the registry preserves the pre-refactor rule order",
      /statewide[\s\S]{0,400}credit_list[\s\S]{0,400}offerings[\s\S]{0,400}credential[\s\S]{0,400}credit_recs[\s\S]{0,400}alignment[\s\S]{0,400}volume[\s\S]{0,400}credit_status[\s\S]{0,400}portal[\s\S]{0,400}landing_page/
        .test(src.slice(src.indexOf("const RULE_DEFAULTS"))));
check("the old hand-concatenated rule chain is gone from the prompt template",
      !/\$\{STATEWIDE_RULE\}\$\{CREDIT_LIST_RULE\}/.test(src));

// ── THE REFACTOR MUST NOT HAVE CHANGED THE SHIPPED PROMPT ───────────────────
// The strongest assertion available here, and worth the extra lift: build the
// OLD hand-concatenated chain from the real rule consts and compare it byte for
// byte with what assembleRules() produces from the real registry, across every
// combination of the four contexts. sort_order was chosen to reproduce the old
// order exactly, so introducing the registry should be a no-op for a public bot
// on day one — "it looks right" is not good enough for a surface students read.
try {
  const s = src.indexOf("const STATEWIDE_RULE");
  const e = src.indexOf("function buildSystemPrompt(");
  const { stripTypes } = require("./lib/lift_ts");
  let block = stripTypes(src.slice(s, e))
    // stripTypes removes type ANNOTATIONS, not DECLARATIONS or `as` casts —
    // this wider slice contains both, unlike the marked assembly block.
    .replace(/^type\s+\w+\s*=\s*\{[\s\S]*?\};\s*$/gm, "")
    .replace(/^type\s+\w+\s*=\s*[^;]+;\s*$/gm, "")
    .replace(/ as \w+/g, "");
  block += "; return {STATEWIDE_RULE,CREDIT_LIST_RULE,OFFERINGS_RULE,CREDENTIAL_RULE," +
           "CREDIT_RECS_RULE,ALIGNMENT_RULE,VOLUME_RULE,CREDIT_STATUS_RULE,PORTAL_RULE," +
           "LANDING_PAGE_RULE,RULE_DEFAULTS,assembleRules};";
  // eslint-disable-next-line no-new-func
  const M = new Function(block)();

  const combos = [];
  for (const cred of ["", "c"]) for (const vol of ["", "v"])
    for (const ali of ["", "a"]) for (const cre of ["", "k"])
      combos.push({ credentialContext: cred, volumeContext: vol, alignmentContext: ali, creditContext: cre });

  let mismatches = 0;
  for (const c of combos) {
    const OLD = M.STATEWIDE_RULE + M.CREDIT_LIST_RULE + M.OFFERINGS_RULE
      + (c.credentialContext ? M.CREDENTIAL_RULE : "")
      + ((c.credentialContext || c.volumeContext) ? M.CREDIT_RECS_RULE : "")
      + (c.alignmentContext ? M.ALIGNMENT_RULE : "")
      + (c.volumeContext ? M.VOLUME_RULE : "")
      + (c.creditContext ? M.CREDIT_STATUS_RULE : "")
      + M.PORTAL_RULE + M.LANDING_PAGE_RULE;
    if (M.assembleRules(M.RULE_DEFAULTS, null, c).text !== OLD) mismatches++;
  }
  check(`the assembled prompt is byte-identical to the old chain (all ${combos.length} context combinations)`,
        mismatches === 0);
} catch (err) {
  check("the prompt-equivalence harness runs — " + err.message, false);
}

const failed = results.filter((r) => !r.ok).length;
console.log(
  "\nsierra_rules_overlay.test.js: " +
    (results.length - failed) + "/" + results.length + " checks passed",
);
process.exit(failed ? 1 : 0);
