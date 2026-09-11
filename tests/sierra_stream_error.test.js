// 🤖 Sierra must never hand back a blank answer and call it success.
//
// FOUND 2026-09-11, from a red smoke run nobody could read. Five of 22 smoke
// modes came back empty. The Supabase edge log showed HTTP 200 for every one of
// them, a `cpl-chat cache:` line for every one of them, and not a single line
// saying anything was wrong. The answers were simply absent.
//
// THE CAUSE WAS A MISSING BRANCH. An upstream failure mid-stream does not arrive
// as a bad status — the response is already 200 and `message_start` has already
// been logged when it lands. It arrives as a stream EVENT, `{"type":"error",…}`,
// and the loop handled exactly three types: content_block_delta, message_delta,
// message_start. An "error" matched none of them, fell through every `if` into
// nothing, and the stream then closed with a normal `event: done`. The caller
// received a well-formed, empty, successful SSE stream.
//
// WHAT THIS GUARDS:
//
//   * THE ERROR BRANCH EXISTS AND SAYS SOMETHING. A silent catch is how this hid
//     for as long as it did; the branch has to log, not just set a flag.
//
//   * AN EMPTY ANSWER IS REPORTED AT ALL. Zero text frames is a failed answer
//     even when nothing errored, and it must not close as an ordinary success.
//
//   * THE CLIENT IS TOLD. A surface cannot distinguish "no answer" from "an
//     answer that is the empty string" unless the stream says which.
//
// ⚠️ THIS IS A LOGGING AND SIGNALLING GUARD, NOT A CURE. It does not stop an
// upstream error; it stops one from being invisible. The smoke suite is what
// notices the answer is gone — this is what tells you why.
//
// Run from repo root: `npm test` (or `node tests/sierra_stream_error.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");

block("(1) the upstream error event is handled", () => {
  check("(1) ⭐ the stream loop has a branch for event.type === \"error\"",
    /event\.type\s*===\s*"error"/.test(SRC),
    "without it an upstream error falls through every branch and the stream "
    + "closes normally with no text — a blank answer and a clean log");
  check("(1) ⭐ …and that branch LOGS, rather than only setting a flag",
    /event\.type\s*===\s*"error"[\s\S]{0,400}?console\.error/.test(SRC),
    "a flag nobody prints is the same invisibility in a new place");
  check("(1) …and it keeps the error type for the empty-answer line",
    /streamError\s*=\s*event\.error\?\.type/.test(SRC));
});

block("(2) an empty answer is never a silent success", () => {
  // The accumulator is the only thing that knows whether any text was produced.
  check("(2) the response text is accumulated so emptiness is detectable",
    /fullResponse\s*\+=\s*event\.delta\.text/.test(SRC));
  check("(2) ⭐ zero text frames is logged as an EMPTY ANSWER",
    /if\s*\(!fullResponse\)[\s\S]{0,300}?console\.error[\s\S]{0,120}?EMPTY ANSWER/.test(SRC),
    "200 + a cache line + `event: done` is indistinguishable from a good answer "
    + "unless this line exists");
  check("(2) …and the log distinguishes an upstream error from a bare blank",
    /NO upstream error/.test(SRC),
    "'empty after overloaded_error' and 'empty for no reason at all' are "
    + "different bugs and must not print the same");
  // ⚠️ An upstream error and a model that simply produced no text are ALSO two
  // different bugs, and stop_reason is the only thing that tells them apart.
  // message_delta is the only event that carries it, so it has to be captured
  // there or it is gone by the time the empty answer is noticed.
  check("(2) ⭐ …and it records the model's own stop_reason",
    /stopReason\s*=\s*event\.delta\.stop_reason/.test(SRC)
    && /stop_reason=\$\{stopReason/.test(SRC),
    "without it, 'the upstream failed' and 'the model returned nothing' are "
    + "indistinguishable in the log that exists to tell them apart");
});

block("(2b) the model that answered is named on every request", () => {
  // Sam's ruling, decision sheet item 3 (2026-09-11): "Have Sierra name her
  // model in the log." ⚠️ From event.message.model — what the API says it
  // SERVED — not the MODEL constant, which is only what we asked for. A secret
  // with a typo in it, an override, or a fallback all differ from the request.
  check("(2b) ⭐ the cache line names the model",
    /cpl-chat cache: model=\$\{/.test(SRC),
    "without it the only ways to learn which model answers are to read a secret "
    + "or infer it from cache behaviour across a deploy — both tried, both wrong");
  check("(2b) ⭐ …and it is the SERVED model, not the requested one",
    /model=\$\{event\.message\.model/.test(SRC),
    "MODEL is what we asked for; event.message.model is what answered, and the "
    + "gap between them is exactly the failure this is meant to catch");
  // ⚠️ The line is parsed: session_186's log query prefix-matches "cpl-chat
  // cache:" and the cost work reads read=/write=/uncached_input=. Inserting a
  // field is safe; renaming one is not.
  check("(2b) …and the parsed field names survive the insertion",
    /cpl-chat cache: model=[\s\S]{0,80}?read=\$\{cacheRead\} write=\$\{cacheWrite\}/.test(SRC)
    && /uncached_input=\$\{u\.input_tokens/.test(SRC));
});

block("(3) the client is told, and old clients still work", () => {
  check("(3) ⭐ an error frame is emitted to the caller on an empty answer",
    /event:\s*error\\ndata:/.test(SRC),
    "a surface cannot tell 'no answer' from 'the empty string' without it");
  check("(3) the frame carries a reason, defaulting when none is known",
    /empty_answer/.test(SRC));
  // ⚠️ Emitting a NEW event name is only safe because SSE dispatches by name:
  // a client listening for text/sources/done ignores an `error` frame exactly
  // as it did before this existed. The `done` frame must therefore still be
  // sent — an old client waits for it and would otherwise hang.
  check("(3) ⭐ `done` is still sent after the error frame, so old clients end",
    /event:\s*error\\ndata:[\s\S]{0,400}?event:\s*done\\ndata:/.test(SRC),
    "a client that only knows text/sources/done hangs forever if `done` stops "
    + "arriving on the failure path");
});

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
