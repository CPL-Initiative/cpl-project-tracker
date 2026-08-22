// My College — the assistant's thread must not outlive the subject it was
// formed under (Sam, 2026-08-22).
//
// ⭐ THE REPORT. Sam had LACCD selected as the district on the My College tab
// and Sierra "configured her response based on RCCD" — Riverside City College,
// Moreno Valley and Norco, with Norco's exhibits and MVC's figures, under a
// heading that read "Los Angeles Community College District".
//
// ⭐ THE CAUSE WAS TWO REASONABLE DECISIONS MEETING. `convo` is module-level in
// cpl_chat.js ON PURPOSE, so a thread follows the reader between the CPL
// Assistant tab and the My College box. And college_briefing.js's finish() does
// `root.innerHTML = h` on every scope change, which destroys the mount node, so
// mountInto() rebuilds and the visible log starts EMPTY. Together: after
// switching RCCD -> LACCD the reader sees a clean conversation and the next
// question still ships eight turns about RCCD.
//
// ⚠ AND IT IS NOT ONLY THE MODEL'S MESSAGES. cpl-chat folds prior user turns
// into the RETRIEVAL text when the new question has fewer than two topic words
// of its own, and that folded string is what detectAndFetchCollegeProfile() and
// searchExhibitsByTopic() are handed — so a short follow-up RE-DETECTS the old
// college out of history ("riverside" is in the alias map) and rebuilds the
// whole answer on it. The stale thread does not tint the answer; it sources it.
//
// ⚠ WHY THIS NEEDS A TEST AND NOT A CODE COMMENT. Every symptom is invisible.
// The transcript looks right, the heading looks right, the payload is the only
// place the defect exists — so the assertions here are on what would be SENT
// (`_thread()`), never on what is displayed. A check that reads the log would
// have passed against the broken build.
//
// THE INVARIANT: what we SEND is never more than what is SHOWN.
//
// ⚠ Budget: ~44 MB per booted jsdom window, never reclaimed until the process
// ends (docs/kb-notes/methodology-a-test-file-is-a-memory-budget.md). This file
// boots three.
//
// Run from repo root: `npm test` (or `node tests/my_college_scope_thread.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — setup did not throw", false, String(e && e.message)); }
}
async function ablock(label, fn) {
  try { await fn(); } catch (e) { check(label + " — setup did not throw", false, String(e && e.message)); }
}

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");

const LACCD = "Los Angeles Community College District";
const RCCD = "Riverside Community College District";

/* One completed turn, streamed the way the function streams it. Nothing shorter
 * works: ask() pushes onto `convo` only after the SSE loop finishes, and the
 * no-stream fallback returns BEFORE that push — so a fetch stub without a
 * getReader() would leave the thread empty and make every check below
 * unfailable. The fixture has to reach the line under test. */
function sseFetch(w, sent) {
  return function (url, opts) {
    try { sent.push(JSON.parse(opts.body)); } catch (e) { sent.push(null); }
    const body = 'event: text\ndata: {"text":"ok"}\n\nevent: done\ndata: {}\n\n';
    const bytes = new w.TextEncoder().encode(body);
    let served = false;
    return Promise.resolve({
      ok: true,
      body: {
        getReader: function () {
          return {
            read: function () {
              if (served) return Promise.resolve({ done: true });
              served = true;
              return Promise.resolve({ done: false, value: bytes });
            },
            /* ⚠ releaseLock() IS NOT OPTIONAL. The stream loop calls it in a
             * `finally`, so a reader without it throws AFTER the deltas have
             * been rendered and BEFORE `convo.push` — the turn appears on
             * screen and never reaches the thread. That is precisely the state
             * this file exists to detect, so a fixture that produces it by
             * accident makes every assertion below vacuously true. */
            releaseLock: function () {},
          };
        },
      },
    });
  };
}

function loadTab() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.localStorage.setItem("cplSierraAudience.v1", "administrator");
  w.sessionStorage.setItem("cplSierraAudienceOk.v1", "administrator");
  const sent = [];
  w.fetch = sseFetch(w, sent);
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  [TEAM, CHAT, BRIEFING].forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  M._state.data = {
    colleges: ["Riverside City College", "Norco College", "Moreno Valley College",
               "Los Angeles City College", "East Los Angeles College"],
    summaryByName: {}, raw: {},
    briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 1", year: "1" },
  };
  const root = w.document.getElementById("college-briefing-root");
  return { w: w, M: M, root: root, sent: sent, C: w.CPL_CHAT };
}

/* ⚠ ask() RETURNS true, NOT A PROMISE — it fills the box and calls submit(),
 * whose SSE loop runs on its own. `await C.ask(...)` therefore awaits a boolean
 * and continues immediately, which is how the first draft of this file measured
 * an empty thread and reported four of its own checks as unfailable. Poll the
 * seam instead of guessing a tick count. */
async function askAndSettle(ctx, q) {
  const before = ctx.C._thread().length;
  ctx.C.ask(q);
  for (let i = 0; i < 200; i++) {
    if (ctx.C._thread().length > before) return true;
    await new Promise((r) => setTimeout(r, 2));
  }
  return false;
}

// Put the tab on a district and render it, the way clicking a district button does.
function selectDistrict(ctx, name) {
  ctx.M._state.scope = "district";
  ctx.M._state.college = null;
  ctx.M._state.district = name;
  ctx.M.render(ctx.root);
}

// ── (1) A thread does not survive a change of subject ──────────────────────
(async function () {
  await ablock("(1)", async function () {
    const ctx = loadTab();
    selectDistrict(ctx, RCCD);
    /* ⚠ THE QUESTION MUST NAME THE COLLEGE, or the payload check below cannot
     * fail. A fail-first probe caught this: with a question that only said "this
     * district", dropping the thread changed nothing detectable in the body, so
     * "Riverside reaches the function nowhere" passed against the BROKEN build.
     * The stale turns are dangerous precisely because they carry a college NAME
     * into detectAndFetchCollegeProfile — the fixture has to carry one too. */
    const landed = await askAndSettle(ctx,
      "What should Riverside City College do about welding?");

    check("(1) the fixture actually completes a turn",
      landed && ctx.C._thread().length === 2,
      "thread=" + ctx.C._thread().length + " — without this every check below is unfailable");
    check("(1) …and the first request carried the district it was asked under",
      !!(ctx.sent[0] && ctx.sent[0].scope && ctx.sent[0].scope.label === RCCD),
      JSON.stringify(ctx.sent[0] && ctx.sent[0].scope));

    // The switch Sam made.
    selectDistrict(ctx, LACCD);
    check("(1) ⭐ THE RCCD THREAD IS DROPPED WHEN THE SUBJECT BECOMES LACCD",
      ctx.C._thread().length === 0,
      "still carrying " + ctx.C._thread().length + " turns about the previous district");

    await askAndSettle(ctx, "What are our biggest opportunities?");
    const req = ctx.sent[ctx.sent.length - 1];
    check("(1) ⭐ …so the next request ships NO history from it",
      !!req && Array.isArray(req.history) && req.history.length === 0,
      "history=" + JSON.stringify(req && req.history));
    const blob = JSON.stringify(req || {});
    check("(1) ⚠ …and the word Riverside reaches the function nowhere in the payload",
      blob.indexOf("Riverside") < 0 && blob.indexOf("riverside") < 0,
      "this is the check that would have caught the reported bug");
    check("(1) …while the new district IS named",
      !!(req && req.scope && req.scope.label === LACCD));
  });

  // ── (2) …but an unchanged subject keeps it ───────────────────────────────
  // The other half of the rule, and the one a careless fix breaks: the host
  // re-renders for reasons that are NOT a change of subject (picking a role,
  // opening a drawer), and each one calls setScope. Dropping the thread on
  // every call deletes a conversation mid-read.
  await ablock("(2)", async function () {
    const ctx = loadTab();
    selectDistrict(ctx, LACCD);
    await askAndSettle(ctx, "How is the district doing?");
    check("(2) a turn is on the thread", ctx.C._thread().length === 2);

    ctx.M.render(ctx.root);                       // same scope, fresh render
    check("(2) ⭐ a re-render with the SAME district keeps the conversation",
      ctx.C._thread().length === 2,
      "dropped on a plain re-render — this deletes a reader's thread mid-read");

    selectDistrict(ctx, LACCD);                   // explicitly re-selecting the same one
    check("(2) …and so does re-selecting the same district",
      ctx.C._thread().length === 2);
  });

  // ── (3) The generic pane clears the ANCHOR, not the thread ───────────────
  // Two different events. The CPL Assistant tab is nobody's college page, so it
  // must not keep asking the function to answer for My College's selection; but
  // mount() is idempotent and does not rebuild, so the transcript is still on
  // screen there and the thread may follow it. Clearing both would delete a
  // visible conversation; clearing neither is the leak.
  await ablock("(3)", async function () {
    const ctx = loadTab();
    selectDistrict(ctx, LACCD);
    await askAndSettle(ctx, "How is the district doing?");

    ctx.C.setScope(null, null);
    check("(3) ⭐ moving to a pane with no selection clears the anchor",
      ctx.C._scope() === null);
    check("(3) ⚠ …and does NOT delete the visible conversation",
      ctx.C._thread().length === 2,
      "the transcript is still on screen on that pane, so the thread must match it");

    ctx.C.setScope("district", LACCD);
    check("(3) ⭐ coming BACK to the same district still keeps it",
      ctx.C._thread().length === 2,
      "a tab round trip is not a change of subject — this is why the last NAMED "
      + "subject is tracked rather than the previous anchor");

    ctx.C.setScope("college", "Riverside City College");
    check("(3) …but a genuinely different subject still drops it",
      ctx.C._thread().length === 0);

    /* ⚠ A TRAILING SPACE MUST NOT MAKE TWO SUBJECTS OF ONE COLLEGE.
     * map_college_contacts genuinely holds "Cypress College " with one (#1278),
     * so this is a live shape, not a hypothetical. Untrimmed, a re-render that
     * changed nothing would read as a change of subject and delete the thread. */
    ctx.C.setScope("college", "Cypress College");
    await askAndSettle(ctx, "How is it going?");
    const held = ctx.C._thread().length;
    ctx.C.setScope("college", "  Cypress College  ");
    check("(3) ⚠ …and a whitespace variant is the SAME subject",
      ctx.C._thread().length === held && held > 0,
      "held=" + held + " now=" + ctx.C._thread().length);
  });

  // ── (3b) Clearing the transcript must not clear the WIDGET ───────────────
  // The suggested-questions row lives INSIDE the log, so `logEl.innerHTML = ''`
  // deletes the widget's own chrome and leaves chipsEl detached — the reader
  // gets an assistant with no starters at all. The first draft did that;
  // my_college_sierra_box.test.js caught it (EXACTLY ONE cluster -> found 0).
  // Pinned here too, beside the code that does the clearing.
  //
  // ⚠ TESTED BEFORE THE FIRST QUESTION, NOT AFTER. submit() removes the starter
  // chips itself once a conversation begins, so a fixture that asks first
  // measures an empty row either way and can never fail. This is the same trap
  // Sky175 named on Sierra's log: its keyboard reachability was INVERSELY
  // correlated with its content.
  await ablock("(3b)", async function () {
    const ctx = loadTab();
    selectDistrict(ctx, LACCD);
    const log = ctx.root.querySelector("#cplchat-log");
    check("(3b) precondition: a fresh mount has the suggestions row IN the log",
      !!(log && log.querySelector("#cplchat-suggest")),
      "if this row moved out of the log, the clear below is no longer risky and "
      + "these checks stop meaning anything");

    ctx.C.setScope("district", RCCD);        // a real change of subject
    check("(3b) ⭐ the suggested-questions row SURVIVES the clear",
      !!log.querySelector("#cplchat-suggest"),
      "clearing the whole log detaches chipsEl and the assistant loses its starters");
    check("(3b) …with its questions still in it",
      log.querySelectorAll("#cplchat-suggest button").length >= 2);

    // …and the other half: a real transcript DOES leave.
    await askAndSettle(ctx, "How is the district doing?");
    check("(3b) precondition: the turn is in the log",
      log.querySelectorAll(".cplchat-msg").length >= 2,
      "found " + log.querySelectorAll(".cplchat-msg").length);
    ctx.C.setScope("district", LACCD);
    check("(3b) ⭐ …and the conversation leaves the log with the thread",
      log.querySelectorAll(".cplchat-msg").length === 0
      && ctx.C._thread().length === 0);
    check("(3b) ⚠ …feedback bars go with it, not orphaned under a new subject",
      log.querySelectorAll(".cplchat-fb").length === 0);
  });

  // ── (4) The wiring, asserted on source ───────────────────────────────────
  // Behavior checks above prove the mechanism works when it is called. These
  // prove it is called on every path — which a behavioral check cannot, because
  // the failing path is the one where the mount did not happen.
  block("(4)", function () {
    check("(4) college_briefing hands the scope over",
      /C\.setScope\(/.test(BRIEFING));
    check("(4) ⭐ …UNCONDITIONALLY, not chained onto the mount's `||`",
      /var mounted = mountAssistant\(root\);\s*\n\s*setAssistantScope\(\);/.test(BRIEFING),
      "chained, a failed mount would silently keep the previous subject's thread alive");
    check("(4) …and before the questions, so nothing can be asked under a stale subject",
      BRIEFING.indexOf("setAssistantScope();") < BRIEFING.indexOf("!setAssistantQuestions()"));
    check("(4) ⚠ the FULL district name is handed over, not the display abbreviation",
      /C\.setScope\(scopeReady\(\) \? state\.scope : null, scopeLabel\(\)\)/.test(BRIEFING),
      "the picker renders 'Los Angeles CCD'; the roster's key is the full name, and "
      + "the function resolves a district by that stem — a short form is a second matcher");
    check("(4) the request body carries it",
      /scope: hostScope,/.test(CHAT));
    check("(4) ⚠ the dedicated pane clears the anchor",
      /hostScope = null;/.test(CHAT));
    check("(4) ⭐ `_thread` reports what would be SENT, not what is displayed",
      /_thread: function \(\) \{ return convo\.slice\(\); \}/.test(CHAT),
      "every symptom of this bug is invisible on screen; asserting on the log proves nothing");
  });

  const failed = results.filter((r) => !r[1]);
  results.forEach(([name, ok, why]) =>
    console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
  console.log("\nmy_college_scope_thread.test.js: "
    + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
})();
