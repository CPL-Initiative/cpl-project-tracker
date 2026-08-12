// Sierra Training — plain language, hover-overs, and the character limit that
// was eating people's work (Sam, 2026-08-12) — jsdom test.
//
// Sam: "the Sierra Training tab uses a bunch of jargon I don't understand; can
// you switch to using plain language and add hover overs on chips and filter to
// explain what they do and how to respond?" — plus: "When I click Triage,
// there's no prompt for me to add any adjustments--not sure what it or
// Addresses is doing", and "I don't need all your smoke tests in the training
// (CI)--though I don't know what CI stands for."
//
// Guards:
//  (a) THE LIMIT PAIR. sierra_training.js's textarea cap and cpl-chat's
//      per-rule slice must stay EQUAL. They were both 500, silently truncating
//      three rules written that day (one mid-table). Raising one side alone
//      just moves the silent truncation to the other side, which is why this is
//      asserted as a PAIR and not as two independent numbers.
//  (b) the limit is VISIBLE — maxlength alone reads as a broken keyboard, so a
//      live counter renders and warns as it fills;
//  (c) the total budget is shown, because exceeding it silently drops the
//      OLDEST rules — and the oldest is the naming rule;
//  (d) triage buttons say what they do, carry hover-overs, and are labelled as
//      bookkeeping — with the action that actually changes Sierra beside them;
//  (e) "Write an instruction about this" seeds the composer from the question
//      and writes NOTHING on its own;
//  (f) no jargon leaks into the rendered UI (CI / triage / punt / KB
//      similarity / gap miner / active·sent);
//  (g) every filter and chip carries a title.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");
const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

function makeWin() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };
  w.eval(SRC);
  return w;
}

// ── (a) the limit pair — the whole point ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const uiMax = api.GUIDANCE_RULE_MAX;
  const fnPer = /GUIDANCE_MAX_CHARS_PER_RULE = (\d+)/.exec(FN);
  const fnTot = /GUIDANCE_MAX_CHARS = (\d+)/.exec(FN);
  check("UI per-rule limit is no longer the 500 that truncated Sam's rules", uiMax > 500);
  check("cpl-chat declares an explicit per-rule cap", !!fnPer);
  check("THE PAIR: UI per-rule cap === cpl-chat per-rule slice",
    !!fnPer && Number(fnPer[1]) === uiMax);
  check("THE PAIR: UI total budget === cpl-chat total budget",
    !!fnTot && Number(fnTot[1]) === api.GUIDANCE_TOTAL_MAX);
  check("cpl-chat slices by the named constant, not a bare literal",
    /slice\(0, GUIDANCE_MAX_CHARS_PER_RULE\)/.test(FN) && !/trim\(\)\.slice\(0, 500\)/.test(FN));
  check("the textarea actually carries the raised maxlength",
    new RegExp('maxlength="\' \\+ GUIDANCE_RULE_MAX').test(SRC));
}

// ── (b)+(c) the limit is visible, and so is the budget ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.loading = false;
  api._state.feedback = [];
  api._state.turns = [];
  api._state.guidance = [];
  api.render(root);
  const html = root.innerHTML;
  check("a live character counter renders", /data-guid-count/.test(html) && /characters/.test(html));
  check("the counter starts at 0 of the raised limit",
    new RegExp("0 / " + api.GUIDANCE_RULE_MAX.toLocaleString() + " characters").test(html));
  check("the total budget is shown", /Space used/.test(html));

  // typing updates the counter in place (a full re-render would move the caret)
  const ta = root.querySelector(".sit-guid-input");
  ta.value = "x".repeat(42);
  ta.dispatchEvent(new w.Event("input", { bubbles: true }));
  check("typing updates the counter without a re-render",
    /42 \/ /.test(root.querySelector("[data-guid-count]").textContent));
  check("the caret is not disturbed (textarea survives the update)",
    root.querySelector(".sit-guid-input") === ta);

  // near the ceiling it warns rather than silently stopping
  ta.value = "y".repeat(api.GUIDANCE_RULE_MAX);
  ta.dispatchEvent(new w.Event("input", { bubbles: true }));
  const c = root.querySelector("[data-guid-count]");
  check("at the limit the counter warns explicitly", /warn/.test(c.className) && /not be saved/.test(c.textContent));
}

// budget warns as it fills
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.loading = false;
  api._state.feedback = []; api._state.turns = [];
  api._state.guidance = Array.from({ length: 8 }, (_, i) => ({
    id: "g" + i, rule: "z".repeat(1000), active: true, created_at: new Date().toISOString()
  }));
  api.render(root);
  check("a nearly-full guidance budget is flagged, not left to fail silently",
    /sit-guid-budget warn/.test(root.innerHTML) && /getting full/.test(root.innerHTML));
}

// ── (d) triage says what it does ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  check("statuses read as plain English", api._statusLabel("new") === "Not reviewed"
    && api._statusLabel("triaged") === "Looking into it"
    && api._statusLabel("addressed") === "Done");
  check("every status explains what to DO, not just what it means",
    Object.keys(api._STATUS_HELP).every((k) => /mark|use|add|drop/i.test(api._STATUS_HELP[k])));

  api._state.open = { t1: true };
  api._state.turns = [];
  const row = api._feedbackRow({ turn_id: "t1", question: "does CPR count?", rating: "down", status: "new" });
  check("the triage row is labelled as bookkeeping, not as an action on Sierra",
    /Mark this:/.test(row) && !/Triage:/.test(row));
  check("the label says outright it does not change Sierra",
    /does not change how Sierra answers/.test(row));
  check("each status button carries its hover-over",
    /data-status="addressed"[^>]*title="[^"]+/.test(row));
  check("the stored values are UNCHANGED — only the labels moved",
    /data-status="new"/.test(row) && /data-status="triaged"/.test(row) && /data-status="addressed"/.test(row));
}

// ── (e) the missing half of triage ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.loading = false;
  api._state.feedback = [{ turn_id: "t1", question: "does CPR count?", rating: "down", status: "new" }];
  api._state.turns = []; api._state.guidance = [];
  api._state.open = { t1: true };
  api.render(root);
  check("an open feedback row offers to write an instruction",
    /data-qact="rule"/.test(root.innerHTML) && /Write an instruction about this/.test(root.innerHTML));

  const before = w.__fetchCount;
  api._startRuleFrom("does CPR count?", root);
  check("it seeds the composer with the question", /does CPR count\?/.test(api._state.draftRule));
  check("the seed is a prompt to continue, not a finished rule",
    /^When someone asks something like/.test(api._state.draftRule));
  check("it seeds the team note with where it came from", /thumbs-down/i.test(api._state.draftNote));
  check("it WRITES NOTHING — only a human knows the right answer",
    api._state.guidance.length === 0 && before === w.__fetchCount);

  // it must not clobber something already being typed
  api._state.draftRule = "half-written rule";
  api._startRuleFrom("another question", root);
  check("it never overwrites a draft in progress", api._state.draftRule === "half-written rule");
}

// ── (f) no jargon in the rendered UI ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.loading = false;
  api._state.feedback = [
    { turn_id: "t1", question: "q", rating: "down", status: "new", page: "chatbot" },
    { turn_id: "t2", question: "q2", rating: "down", status: "ci", page: "smoke" }
  ];
  api._state.turns = [];
  api._state.guidance = [{ id: "g1", rule: "a rule", active: true, created_at: new Date().toISOString() }];
  api._state.open = {};
  api.render(root);
  // Assert on rendered TEXT, not markup. Hover-overs are allowed to name the
  // jargon in order to explain it, and stored values (value="punt") are what the
  // RPC writes — neither is something the reader ever sees. Only the visible
  // labels have to be plain.
  const visible = root.textContent;
  const jargon = [
    [/\bCI rows\b/, "CI rows"],
    [/\bTriage:/, "Triage:"],
    [/\bpunt\b/i, "punt"],
    [/KB similarity/, "KB similarity"],
    [/Gap miner/, "Gap miner"],
    [/active · sent/, "active · sent"],
    [/\bDeactivate\b/, "Deactivate"],
  ];
  jargon.forEach(function (j) {
    check("no jargon in visible UI: " + j[1], !j[0].test(visible));
  });
  check("the automated test rows are described in plain words",
    /automated test messages/.test(visible));
  check("…and their count is still disclosed, not silently dropped",
    /include 1 automated test messages/.test(visible));
  check("the stored value is untouched — only the label changed",
    /value="punt"/.test(root.innerHTML));
}

// ── (g) hover-overs are actually attached ──
{
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  api._state.loading = false;
  api._state.feedback = [{ turn_id: "t1", question: "q", rating: "down", status: "new" }];
  api._state.turns = [{ id: "x1", question: "gap q", response: "I could not find", top_similarity: 0.1,
    created_at: new Date().toISOString() }];
  api._state.guidance = [{ id: "g1", rule: "a rule", active: true, created_at: new Date().toISOString() }];
  api.render(root);
  const selects = Array.from(root.querySelectorAll(".sit-toolbar select"));
  check("every filter dropdown has a hover-over", selects.length > 0
    && selects.every((s) => (s.getAttribute("title") || "").length > 20));
  const checks = Array.from(root.querySelectorAll(".sit-check"));
  check("every filter checkbox has a hover-over", checks.length > 0
    && checks.every((l) => (l.getAttribute("title") || "").length > 20));
  const boxes = Array.from(root.querySelectorAll(".sit-stat .box"));
  check("every headline number explains what it counts", boxes.length > 0
    && boxes.every((b) => (b.getAttribute("title") || "").length > 20));
  const chips = Array.from(root.querySelectorAll(".sit-chip"));
  check("status/gap chips carry hover-overs", chips.length > 0
    && chips.filter((c) => (c.getAttribute("title") || "").length > 20).length >= 1);
  check("hover-overs are discoverable (cursor:help on titled controls)",
    /\[title\][^"]*cursor:help/.test(SRC));
  check("hover-overs say how to respond, not just what it is",
    /Start with thumbs-down/.test(api._HELP.rating) && /need no action/.test(api._HELP.smoke));
}

// ── report ──
let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
