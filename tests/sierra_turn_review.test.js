// Marking one of "the questions Sierra struggled with" as handled.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-13, looking at a punt row in the Sierra Training tab:
//
//   "Try it on Sierra now works on trainer but How can I click this resolved?"
//
// He could not. The feedback pane has "Mark this:" buttons backed by
// sierra_feedback.status. The gap pane reads chat_interactions — an append-only
// log of every turn, with NO status column anywhere in it. So there was nowhere
// to record that a question had been dealt with, and the list could never
// shrink: a question he had already written an instruction for stayed on it
// forever, indistinguishable from one nobody had touched.
//
// This is the mirror of the lesson already recorded as
// status-lane-must-link-to-remedy-lane. There, the status lane did not reach the
// remedy. Here there was no status lane at all.
//
// The review state lives in its own gated table (sierra_turn_review), and
// ABSENCE OF A ROW IS "still outstanding" — which is why the default filter
// hides handled rows and why "put it back" is a DELETE rather than a third
// status value.
//
// Run from repo root: `npm test` (or `node tests/sierra_turn_review.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, msg) { results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");

function makeWin() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () {
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

const w = makeWin();
const M = w.CPL_SIERRA_TRAINING_TAB;
check("the tab module loads", !!(M && M._gapRow && M._gapRows));

// A real punt: the San Diego Mesa contact question Sam screenshotted. Sierra had
// the contact in her context and hedged anyway — two other turns on the same
// question answered it correctly, one of them nine seconds earlier.
const MESA = {
  id: "03e78434-6002-456a-9cd9-b0c6d482f880",
  created_at: "2026-08-13T16:51:42.657Z",
  question: "Who is the CPL contact at San Diego Mesa College?",
  response: "Great question! Based on the information available to me, I don't have the "
    + "specific CPL coordinator contact details for **San Diego Mesa College** on hand.",
  top_similarity: 0.879, topic_match: true, audience: null,
};
const OTHER = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  created_at: "2026-08-13T15:00:00.000Z",
  question: "Does Cerritos take NCCER?",
  response: "I'm not able to find that.",
  top_similarity: 0.12, topic_match: false, audience: "student",
};

M._state.turns = [MESA, OTHER];
M._state.turnReviews = {};
M._state.gKind = "all"; M._state.gAudience = ""; M._state.gDays = "";

// ── 1. There is now a control at all ────────────────────────────────────────
{
  M._state.gOpen = { [MESA.id]: true };
  const html = M._gapRow(MESA);
  check("an opened gap row offers a way to mark it",
        /data-turnrev="resolved"/.test(html),
        "this is the affordance Sam could not find");
  check("it offers a 'nothing to do here' option too",
        /data-turnrev="wont_fix"/.test(html),
        "not every logged punt deserves an instruction");
  check("the control carries the turn id", new RegExp('data-turnid="' + MESA.id + '"').test(html));
  check("it says plainly that marking does NOT change Sierra",
        /does not change how Sierra answers/i.test(html),
        "the whole reason the old queue reported itself complete");
}

// ── 2. Absence of a review row means STILL OUTSTANDING ──────────────────────
// Not a third status value: "never looked at" and "looked at, then reopened"
// must not be distinguishable, or reopening quietly becomes its own state.
{
  M._state.gRev = "open";
  M._state.turnReviews = {};
  check("with no reviews, every gap row is outstanding", M._gapRows().length === 2);

  M._state.turnReviews = { [MESA.id]: { turn_id: MESA.id, status: "resolved", updated_by: "sam@rccd.edu" } };
  const rows = M._gapRows();
  check("a handled row leaves the still-to-do list", rows.length === 1 && rows[0].id === OTHER.id,
        "without this the pane never shrinks and fixed questions read as open gaps");
}

// ── 3. The other filter positions ───────────────────────────────────────────
{
  M._state.gRev = "";
  check("'Everything' shows handled rows too", M._gapRows().length === 2);

  M._state.gRev = "resolved";
  const only = M._gapRows();
  check("filtering to Handled shows only handled rows",
        only.length === 1 && only[0].id === MESA.id);

  M._state.gRev = "wont_fix";
  check("filtering to Leave it shows none here", M._gapRows().length === 0);

  M._state.gRev = "open";
}

// ── 4. A handled row shows its state and a way back ─────────────────────────
{
  M._state.turnReviews = {
    [MESA.id]: { turn_id: MESA.id, status: "resolved", updated_by: "sam@rccd.edu" },
  };
  M._state.gOpen = { [MESA.id]: true };
  const html = M._gapRow(MESA);
  check("a handled row offers 'still to do' to undo it", /data-turnrev=""/.test(html),
        "a one-way mark is a trap when it was a misclick");
  check("a handled row names who marked it", /sam@rccd\.edu/.test(html),
        "a curator's judgment is attributed, not laundered");
  check("the already-set button is disabled", /data-turnrev="resolved"[^>]*disabled/.test(html)
        || /disabled[^>]*data-turnrev="resolved"/.test(html));
  M._state.turnReviews = {};
}

// ── 5. Wiring, asserted on the source ───────────────────────────────────────
{
  check("review state loads alongside the turns",
        /Promise\.all\(\[loadFeedback\(\), loadTurns\(\), loadGuidance\(\), loadTurnReviews\(\)\]\)/.test(SRC));
  check("a failed review read degrades to {} rather than null",
        /state\.turnReviews = res\[3\] \|\| \{\}/.test(SRC),
        "null would throw on lookup; {} just shows everything, which is honest");
  check("'still to do' is a DELETE, not a stored third status",
        /method: "DELETE"[\s\S]{0,120}sierra_turn_review|sierra_turn_review[\s\S]{0,160}method: "DELETE"/.test(SRC));
  check("an RLS-filtered write is treated as a failure",
        /if \(!Array\.isArray\(rows\) \|\| rows\.length === 0\) throw new Error\("not saved"\)/.test(SRC),
        "PostgREST returns 200 + empty body when a policy filters the write");
  check("the gap pane defaults to still-to-do", /gRev: "open"/.test(SRC));
  check("the filter control exists in the toolbar", /data-g="gRev"/.test(SRC));
}

// ── 6. The click handler is wired and does not toggle the row ───────────────
{
  check("a [data-turnrev] click handler exists", /\[data-turnrev\]/.test(SRC));
  check("it stops propagation so marking does not also collapse the row",
        /\[data-turnrev\][\s\S]{0,220}e\.stopPropagation\(\)/.test(SRC),
        "the buttons sit inside the row body, under a header that toggles");
}

// ── 7. The CI smoke test is excluded, like the feedback pane ────────────────
// MEASURED 2026-08-13 over the newest 500 conversations: 78 gap rows, 65 of them
// the CI smoke test — 83%. Sam was looking at a list of "questions Sierra
// struggled with" that was five parts robot to one part person, and was about to
// bulk-mark 72 rows of it as handled.
//
// It also explains the duplicate pairs he spotted: the smoke suite asks each
// question twice, so 43% of punts had a SUCCESSFUL answer to the same question
// within 45 seconds. Never two verdicts on one question — two different probes.
{
  const CI = {
    id: "cccccccc-0000-0000-0000-000000000001",
    session_id: "smoke-ci",
    created_at: "2026-08-13T16:51:42.657Z",
    question: "Who is the CPL contact at San Diego Mesa College?",
    response: "Based on the information available to me, I don't have the specific "
      + "CPL coordinator contact details for San Diego Mesa College on hand.",
    top_similarity: 0.879, topic_match: true, audience: null,
  };
  M._state.turns = [MESA, OTHER, CI];
  M._state.turnReviews = {};
  M._state.gRev = "open"; M._state.gSmoke = false;

  const ids = M._gapRows().map((t) => t.id);
  check("a smoke-ci turn is excluded from the gap list by default",
        !ids.includes(CI.id),
        "83% of the list was robot traffic before this");
  check("real turns are unaffected by the exclusion",
        ids.includes(MESA.id) && ids.includes(OTHER.id));

  M._state.gSmoke = true;
  check("the toggle brings the CI rows back", M._gapRows().map((t) => t.id).includes(CI.id),
        "excluding must be visible and reversible, not a silent filter");
  M._state.gSmoke = false;

  check("the CI marker is matched on session_id, not the response text",
        /session_id[\s\S]{0,80}\/\^smoke\/i/.test(SRC),
        "keying on wording would drop real punts that happen to look like the suite's");
  check("loadTurns actually fetches session_id",
        /chat_interactions\?select=id,session_id,/.test(SRC),
        "the column has to be selected or every turn reads as real");
  M._state.turns = [MESA, OTHER];
}

// ── 8. Bulk marking, and what it refuses to touch ───────────────────────────
{
  check("the gap pane offers a bulk control", /data-gbulk-apply/.test(SRC));
  check("bulk skips CI rows even when the toggle is showing them",
        /!isTurnSmoke\(t\) && !\(rv && rv\.status === target\)/.test(SRC),
        "marking robot traffic handled records a human decision nobody made");
  check("bulk confirms before writing", /confirm\(/.test(SRC));
  check("bulk says it does not change Sierra",
        /does not change how Sierra answers/.test(SRC));
  check("an RLS-filtered bulk write is treated as a failure",
        /if \(!Array\.isArray\(out\) \|\| out\.length === 0\) throw new Error\("not saved"\)/.test(SRC));
}

// ── 9. Themes describe PEOPLE, not the smoke suite ──────────────────────────
{
  check("the theme strip is computed from the CI-filtered set",
        /gapKinds\(t\)\.length > 0 && \(state\.gSmoke \|\| !isTurnSmoke\(t\)\)/.test(SRC),
        'otherwise the chips read "san x35 / diego x22 / mesa x24" — the robot\'s vocabulary');
}

// ── Report ──────────────────────────────────────────────────────────────────
let failed = 0;
for (const [ok, name] of results) {
  console.log(`  ${ok ? "ok  " : "FAIL"}   ${name}`);
  if (!ok) failed++;
}
console.log(`\nsierra_turn_review: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
