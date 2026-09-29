/**
 * Route CRED·STD wiring in cpl-chat — static guards.
 *
 * There is no deno in the sandbox, so this cannot type-check. What it CAN do is
 * guard the failure modes that actually bit while writing the wiring, both of
 * which are silent-at-author-time and fatal-at-runtime:
 *
 *   1. AN ESCAPED CLOSING BACKTICK. The rule is a template literal; writing
 *      \` instead of ` at the end leaves the literal unterminated, which is a
 *      parse error that takes the WHOLE function down at boot — the same class
 *      of failure as the TDZ ReferenceError that killed cpl-chat before.
 *      Caught here by parity, exactly as it was caught by hand.
 *
 *   2. THE WRONG CLIENT VARIABLE. The handler's Supabase client is `sb`, not
 *      `supabase`. Passing the wrong name is a ReferenceError on every request,
 *      and nothing about the line looks wrong.
 *
 * Plus the contract assertions: the route must be able to say "no statewide
 * recommendation exists" and must be forbidden from substituting a neighbour.
 *
 * Run: node tests/sierra_credential_route.test.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

/* ── 1. Template literals are balanced ─────────────────────────────────────── */
const backticks = (src.match(/(?<!\\)`/g) || []).length;
check("template literals balanced (no escaped closing backtick)",
      backticks % 2 === 0,
      `found ${backticks} unescaped backticks — an odd count means an unterminated ` +
      `template literal, which is a parse error that kills the function at boot`);

/* ── 2. The lookups use the handler's real client variable ─────────────────── */
check("credential lookups receive the handler's client (`sb`, not `supabase`)",
      // routeText since v68: the retrieval text with a named PLACE stripped out
      // (tests/sierra_place_anchor.test.js). The pin here is the CLIENT.
      /fetchStatewideRecommendations\((?:searchText|routeText),\s*sb\)/.test(src) &&
      /fetchAnyCredentials\((?:searchText|routeText),\s*sb\)/.test(src),
      "the handler client is `sb`; passing `supabase` is a ReferenceError per request");

/* ── 3. Both RPCs are called, by their real names ──────────────────────────── */
check("calls search_statewide_recommendations",
      /rpc\("search_statewide_recommendations"/.test(src));
check("calls search_credentials_any as the fallback",
      /rpc\("search_credentials_any"/.test(src));

/* ── 4. Two-word probes exist ──────────────────────────────────────────────── */
// Credential names are overwhelmingly multi-word. Single tokens alone would miss
// "peace officer" and "real estate" — the pair probe is load-bearing, not polish.
check("probes adjacent word PAIRS, not just single tokens",
      /\$\{kws\[i\]\}\s\$\{kws\[i\s*\+\s*1\]\}/.test(src),
      "without pair probes, 'peace officer' and 'real estate' never match");

/* ── 5. Both lenses run, concurrently (S274) ───────────────────────────────── */
// Until 2026-09-18 the catalogue-wide lookup ran only when the statewide lens
// was empty, so ONE statewide hit — including a false friend such as Cisco's
// CCNA matching the "cna" inside its own acronym — hid every local credential
// and the Chaffey CNA-to-LVN precedent with them. The two lookups are
// independent and now run side by side; the guard that keeps the round-trip
// cheap is that they share one Promise.all, never a sequential await.
check("catalogue-wide lookup runs BESIDE the statewide lens, never gated on it (S274)",
      /Promise\.all\(\[\s*fetchStatewideRecommendations\(routeText, sb\),\s*fetchAnyCredentials\(routeText, sb\),\s*\]\)/.test(src)
      && !/stdRecs\s*&&\s*stdRecs\.length\s*>\s*0\s*\?\s*null/.test(src),
      "a statewide hit must not switch the local route off — that is how the CCNA false friend hid the CNA precedent");

/* ── 6. Rule is wired, and conditionally ───────────────────────────────────── */
check("CREDENTIAL_RULE is injected only when there is credential context",
      /body: CREDENTIAL_RULE, appliesWhen: "credential"/.test(src));
check("credentialContext reaches the prompt template",
      // programsContext was inserted ahead of it in S272 (the COCI program
      // catalog), so the adjacency moved; credentialContext still has to reach
      // the chain, which is what this check is for.
      /\$\{programsContext\}\$\{credentialContext\}/.test(src));

/* ── 7. The contract the route exists to honour ────────────────────────────── */
const rule = (src.match(/const CREDENTIAL_RULE = `[\s\S]*?`;/) || [""])[0];
check("rule states the curated adopter count beats a raw-title count",
      /undercounts/i.test(rule),
      "the whole point: matching raw titles found 20 colleges, the record knows 32");
check("rule requires quoting the statewide recommendation verbatim",
      /exactly as given/i.test(rule) && /[Nn]ever paraphrase/.test(rule));
check("rule forbids substituting a similar credential",
      /do NOT\s+substitute/i.test(rule) || /not a substitute/i.test(rule),
      "an empty statewide result must not be filled with a neighbour");
check("rule handles the genuinely-absent case without inventing",
      /Do NOT invent a credential/i.test(rule));
check("rule requires naming options when the ask is ambiguous",
      /ambiguous/i.test(rule) && /let the person choose/i.test(rule),
      "'peace officer' matches POST Basic Academy AND Correctional Officer Core Course");

/* ── 8. A lookup failure must not take the answer down ─────────────────────── */
check("credential lookup is wrapped so a failure degrades gracefully",
      /try\s*\{[\s\S]{0,400}fetchStatewideRecommendations[\s\S]{0,400}\}\s*catch/.test(src),
      "every other context section is still valid without this one");

/* ── report ────────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
}
console.log(`\nsierra_credential_route: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
