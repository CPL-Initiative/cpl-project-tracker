// cpl-chat — the caller's selected institution reaches the answer (v53, 2026-08-22).
//
// ⭐ THE REPORT. Sam, on a My College screenshot with LACCD selected as the
// district: "she configured her response based on RCCD."
//
// ⭐ THE HALF THIS FILE GUARDS. A live `sierra_guidance` directive says "When
// using Sierra from the My College COBI tab, confine your answers to the
// selected institution and try not direct users elsewhere." Nothing in this
// function had ever been told what the selected institution is, or even that the
// caller was that tab — the request carried query, session_id, history and
// audience, full stop. So a rule the team had written and switched on was, in
// mechanism, an instruction to GUESS, and the model guessed from whatever
// institution its context contained.
//
// ⚠ A STRONG DEFAULT, NEVER A FILTER. The same directive's own worked example is
// a reader asking "I took a noncredit computer class at Cabrillo and got a
// CompTIA certificate, what credit can I get?" — from some other college's page.
// A question that names an institution is asking about that one. So the scope
// sets the subject when the question does not, and yields when it does. A test
// that only pinned "answer for the selection" would happily bless a filter that
// broke that reader.
//
// ⚠ AND A DISTRICT ROSTER IS NOT AN AMBIGUOUS NAME MATCH. The ambiguity-narrowing
// block was written for the West-LA case (one token ilike-matches five colleges).
// A district's profiles are also an array — and collapsing THOSE to whichever
// member matched a topic word answers a nine-college question with one college
// and drops the roster header, which is #1277 ("Three LACCD colleges appear")
// returning through a different door.
//
// Run from repo root: `npm test` (or `node tests/sierra_host_scope.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");

const LACCD = "Los Angeles Community College District";

let M = null;
block("lift", function () {
  M = liftBlock(SRC, "function normalizeHostScope(", "function buildSystemPrompt(",
    ["normalizeHostScope", "hostScopeBlock"]);
  check("(0) the host-scope block lifts cleanly", !!(M && M.hostScopeBlock));
});

// ── (1) Validation — every existing caller keeps today's behavior ──────────
// The standalone sierra/ page, the Fact Sheet drawer, the production
// map.rccd.edu widget and the vendor embed all send no scope at all. If any
// malformed shape produced a block, this change would rewrite answers on four
// surfaces nobody asked it to touch.
block("(1)", function () {
  if (!M) return;
  const bad = [undefined, null, "", "LACCD", 42, [], {}, { kind: "college" },
               { kind: "district", label: "" }, { kind: "planet", label: "Earth" },
               { kind: "college", label: 5 }];
  check("(1) ⭐ every absent or malformed scope normalizes to null",
    bad.every((b) => M.normalizeHostScope(b) === null),
    "one of " + bad.length + " shapes produced a scope");
  check("(1) …and every one of them renders NO block",
    bad.every((b) => M.hostScopeBlock(M.normalizeHostScope(b)) === ""));
  const ok = M.normalizeHostScope({ kind: "district", label: LACCD });
  check("(1) a well-formed scope survives", !!ok && ok.label === LACCD && ok.kind === "district");
  check("(1) …and a label is bounded",
    M.normalizeHostScope({ kind: "college", label: "x".repeat(500) }).label.length === 200);
  check("(1) ⚠ …and is trimmed, so a trailing space cannot make two subjects of one",
    M.normalizeHostScope({ kind: "college", label: "  Cypress College  " }).label === "Cypress College",
    "map_college_contacts genuinely holds 'Cypress College ' with a trailing space (#1278)");
});

// ── (2) The block names the institution, and forbids substituting another ──
block("(2)", function () {
  if (!M) return;
  const out = M.hostScopeBlock({ kind: "district", label: LACCD });
  check("(2) ⭐ it names the selected institution", out.indexOf(LACCD) >= 0);
  check("(2) ⭐ …and says the reader is on the My College tab",
    /My College/.test(out),
    "the team guidance is written as 'when using Sierra from the My College tab' — "
    + "the model cannot apply a tab-scoped rule without knowing which tab it is on");
  check("(2) ⭐ …and forbids leading with a different one",
    /Do NOT answer for, or lead with, a different district/.test(out),
    "this sentence is the reported bug stated as a prohibition");
  check("(2) it is loud enough to survive a long context",
    /READ THIS BEFORE ANSWERING/.test(out));
});

// ── (3) …but it yields to a question that names somewhere else ────────────
block("(3)", function () {
  if (!M) return;
  const out = M.hostScopeBlock({ kind: "college", label: "Cabrillo College" });
  check("(3) ⭐ THE OVERRIDE IS STATED, not merely unenforced",
    /if the question itself names a different institution/.test(out),
    "the guidance's own worked example is a Cabrillo question asked from another "
    + "college's page — a scope that suppressed it would break the example it serves");
  check("(3) …and the fallback is a fallback in code too",
    /const detectedNothing = !collegeProfile/.test(SRC)
    && /if \(detectedNothing && hostScope/.test(SRC),
    "the host scope must only resolve a profile when the QUESTION resolved none");
  check("(3) ⚠ …resolved through the same path a typed question uses",
    /scopedProfile = await detectAndFetchCollegeProfile\(hostScope\.label, sb\)/.test(SRC),
    "a second matcher here is a second thing to keep in step with map_colleges");
  check("(3) a statewide scope resolves no institution at all",
    !/hostScope\.kind !== "statewide"[\s\S]{0,80}\|\|/.test(SRC)
    && /hostScope\.kind !== "statewide"/.test(SRC));
});

// ── (4) District-shaped scopes ────────────────────────────────────────────
block("(4)", function () {
  if (!M) return;
  const d = M.hostScopeBlock({ kind: "district", label: LACCD });
  const c = M.hostScopeBlock({ kind: "college", label: "Norco College" });
  check("(4) ⚠ a district is told not to name members from memory",
    /rather than\s+naming colleges from memory/.test(d),
    "the districts a model can recite unprompted are exactly the big ones a reader "
    + "is most likely to be sitting on — LACCD above all");
  check("(4) …and a college scope carries no membership sentence",
    !/naming colleges from memory/.test(c));
  const s = M.hostScopeBlock({ kind: "statewide", label: "All colleges" });
  check("(4) ⭐ a statewide scope says statewide and picks nobody",
    /Answer statewide/.test(s) && /Do NOT pick a college or district/.test(s));
  check("(4) …and never claims a single institution is selected",
    s.indexOf("is the SUBJECT") < 0);
});

// ── (5) The roster must survive the ambiguity narrowing ───────────────────
// Behavioral coverage of resolveDistrict itself lives in
// sierra_district_roster.test.js; what is asserted here is the guard that keeps
// its result intact through the block downstream of it.
block("(5)", function () {
  check("(5) ⭐ the narrowing EXCLUDES a district roster",
    /const isDistrictRoster = Array\.isArray\(scopedProfile\)/.test(SRC)
    && /if \(!isDistrictRoster && Array\.isArray\(scopedProfile\)/.test(SRC),
    "without this, a district question with any topic hit collapses to one college");
  check("(5) ⚠ …discriminated by the `_district` stamp, not by length",
    /!!scopedProfile\[0\]\?\._district/.test(SRC),
    "length cannot tell a 5-college name-match tie from a 5-college district");
  check("(5) the narrowing still exists for the case it was written for",
    /\.filter\(\(x: any\) => x\.n > 0\)/.test(SRC),
    "West-LA: one token ilike-matches five colleges and one has the topic hits");
});

// ── (6) The wiring ────────────────────────────────────────────────────────
block("(6)", function () {
  check("(6) the handler reads the field",
    /const \{ query, session_id, history, audience, ctx, scope \} = await req\.json\(\)/.test(SRC));
  check("(6) …normalizes it before use",
    /const hostScope = normalizeHostScope\(scope\)/.test(SRC));
  /* ⚠ REACHES the builder, not "is the last argument". My first draft anchored
   * on the closing paren — the exact defect this change had just tripped in
   * sierra_rules_overlay.test.js, which reported "the overlay is not passed into
   * the prompt builder" when only the argument count had moved. Writing it the
   * same way here would have handed the identical trap to whoever adds the next
   * parameter. sierra_credential_volume.test.js has the pattern. */
  check("(6) …and hands it to the prompt",
    /buildSystemPrompt\([^;]*\bhostScope\b[^;]*\)/.test(SRC));
  check("(6) the prompt actually interpolates the block",
    /\$\{hostScopeBlock\(hostScope\)\}/.test(SRC));
  check("(6) ⭐ and the CLIENT sends what the function reads — one field name",
    /scope: hostScope,/.test(CHAT) && /audience, scope: hostScope/.test(CHAT),
    "a producer and a consumer that disagree on the key is a silent no-op");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_host_scope.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
