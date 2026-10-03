// Sierra's timing log (S319, 2026-10-03): where a turn's time goes, filed on
// chat_interactions.timings.
//
// Sam, 2026-10-03: "add the timing log after the deploy and let's see how best
// to use Jev as we continue to expand Sierra's knowledgebase and capability."
// The question it answers, before any change is made to cut a wait: is the time
// in a slow read, in a long prompt, or in the model's own writing?
//
// Lifts the real helpers out of index.ts (tests/lib/lift_ts.js) and checks the
// failure modes that would make the log lie or cost the answer: a read losing
// its route time limit, a phase reported as NaN or negative, the first word
// re-marked on every frame, a thrown read going unrecorded, an unbounded read
// list, and the insert's error dropped on the floor.
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SQL = fs.readFileSync("chatbox/supabase_sierra_feedback.sql", "utf8");

let T = null;
block("lift", () => {
  T = liftBlock(FN, "// Route time limit — pure helpers", "// End of the timing log helpers",
    ["newTimings", "markTiming", "readLabel", "recordRead", "timedFetch", "timingsRow",
     "TIMING_READS_KEPT", "fetchWithRouteLimit"]);
});

block("1. marks: the first one wins, relative to the start, never negative", () => {
  const t = T.newTimings(1000);
  T.markTiming(t, "first_text", 1500);
  T.markTiming(t, "first_text", 1900);
  check("the first word is marked once", t.marks.first_text === 500, JSON.stringify(t.marks));
  T.markTiming(t, "early", 900);
  check("a clock step backward reads 0, never negative", t.marks.early === 0, JSON.stringify(t.marks));
});

block("2. reads: labeled by PostgREST path, bounded", () => {
  const t = T.newTimings(0);
  T.recordRead(t, "https://x.supabase.co/rest/v1/rpc/college_program_courses", 333.4, true);
  T.recordRead(t, "https://x.supabase.co/rest/v1/college_geo?select=*&limit=200", 41, false);
  check("an RPC reads as rpc/<name>", t.reads[0].p === "rpc/college_program_courses", JSON.stringify(t.reads));
  check("a table read drops its query string", t.reads[1].p === "college_geo", JSON.stringify(t.reads));
  check("durations are whole ms", t.reads[0].ms === 333);
  for (let i = 0; i < 100; i++) T.recordRead(t, "https://x/rest/v1/rpc/r" + i, 1, true);
  check("the list stops at TIMING_READS_KEPT", t.reads.length === T.TIMING_READS_KEPT && T.TIMING_READS_KEPT === 40,
    String(t.reads.length));
});

// 3. timedFetch records the read and passes the result or the error through.
// AbortSignal.timeout's timer does not hold Node open; this does, until finish().
const keepAlive = setTimeout(() => { check("3. the async checks finished within 10 s", false); finish(); }, 10000);
(async () => {
  try {
    let clock = 0; const now = () => clock;
    const t = T.newTimings(0);
    const ok = await T.timedFetch("https://x/rest/v1/rpc/search_college_programs", {},
      t, () => { clock += 412; return Promise.resolve({ ok: true, status: 200 }); }, now);
    check("3. the response is returned unchanged", ok && ok.status === 200);
    check("3. a good read is recorded with its duration",
      t.reads[0] && t.reads[0].p === "rpc/search_college_programs" && t.reads[0].ms === 412 && t.reads[0].ok === true,
      JSON.stringify(t.reads));
    let thrown = null;
    try {
      await T.timedFetch({ url: "https://x/rest/v1/rpc/slow" }, {}, t,
        () => { clock += 5000; return Promise.reject(new Error("cut")); }, now);
    } catch (e) { thrown = e; }
    check("3. a thrown read rethrows the same error", thrown && thrown.message === "cut");
    check("3. a thrown read is recorded as not ok", t.reads[1] && t.reads[1].ok === false && t.reads[1].ms === 5000,
      JSON.stringify(t.reads));
    // ⭐ The route time limit still cuts a read that goes through the timer.
    const t2 = T.newTimings(0);
    let cut = null;
    try {
      await T.timedFetch("https://x/rest/v1/rpc/never", { method: "POST" }, t2,
        (i, init) => T.fetchWithRouteLimit(i, init, 20, (_i, init2) => new Promise((_res, rej) => {
          init2.signal.addEventListener("abort", () => rej(new Error("aborted")));
        })), Date.now);
    } catch (e) { cut = e; }
    check("3. ⭐ a read through the timer is still cut by the route limit", cut && t2.reads[0] && t2.reads[0].ok === false,
      JSON.stringify(t2.reads));
  } catch (e) { check("3. driver threw: " + e.message, false); }
  finish();
})();

block("4. the row: phases from the marks, null where a mark is missing", () => {
  const t = T.newTimings(0);
  t.marks = { embedded: 120, retrieved: 1500, model_sent: 2100, first_text: 3300 };
  t.reads = [{ p: "rpc/a", ms: 300, ok: true }, { p: "rpc/b", ms: 1350, ok: true }];
  const r = T.timingsRow(t, 9300, { context_chars: 1234 });
  check("total runs request to last word", r.total_ms === 9300, JSON.stringify(r));
  check("embed, retrieval, prep, model wait, writing", r.embed_ms === 120 && r.retrieval_ms === 1380
    && r.prep_ms === 600 && r.model_wait_ms === 1200 && r.writing_ms === 6000, JSON.stringify(r));
  check("the slowest read is named", r.slowest_read && r.slowest_read.p === "rpc/b");
  check("extra fields ride along", r.context_chars === 1234 && r.v === 1);
  const blank = T.timingsRow(T.newTimings(0), 800, {});
  check("an answer with no first word reads null, never NaN",
    blank.first_text_ms === null && blank.model_wait_ms === null && blank.writing_ms === null
    && blank.retrieval_ms === null && blank.slowest_read === null && blank.total_ms === 800, JSON.stringify(blank));
  check("the row is JSON-clean", !/NaN|undefined/.test(JSON.stringify(r) + JSON.stringify(blank)));
});

block("5. wired into the handler", () => {
  check("⭐ the client's fetch is timed AND route-limited",
    /fetch: \(input: any, init\?: any\) => timedFetch\(input, init, timings, routeLimitedFetch, Date\.now\)/.test(FN));
  check("one timings object per request, before the body is read",
    /const timings = newTimings\(Date\.now\(\)\);\s*try \{\s*const \{ query, session_id/.test(FN));
  for (const m of ["embedded", "retrieved", "model_sent", "first_text"]) {
    check(`the ${m} mark is set`, new RegExp(`markTiming\\(timings, "${m}", Date\\.now\\(\\)\\)`).test(FN));
  }
  check("the first word is marked inside the text-delta branch",
    /event\.type === "content_block_delta" && event\.delta\?\.text\) \{\s*markTiming\(timings, "first_text"/.test(FN));
  check("the model is marked sent just before its request",
    /markTiming\(timings, "model_sent", Date\.now\(\)\);\s*const anthropicRes = await fetch/.test(FN));
  check("the row is filed on the turn", /timings: timingRow,/.test(FN));
  check("one timing line goes to the function log", /cpl-chat timing: total=/.test(FN));
  check("⭐ the insert's returned error is read, not only a thrown one",
    /if \(logged && logged\.error\) console\.error\("Failed to log interaction:"/.test(FN));
  check("a drafting call still files no row", /const logged = drafting \? null : await sb\.from\("chat_interactions"\)\.insert\(/.test(FN));
});

block("6. the schema carries the column, nullable and additive", () => {
  check("timings jsonb is added if not exists",
    /alter table public\.chat_interactions add column if not exists timings jsonb;/.test(SQL));
  check("the schema note says apply before deploy", /APPLY THIS BEFORE DEPLOYING THE FUNCTION THAT WRITES IT/.test(SQL));
});

let done = false;
function finish() {
  if (done) return; done = true;
  clearTimeout(keepAlive);
  const failed = results.filter((r) => !r[1]);
  for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + String(why).slice(0, 400)}`);
  console.log(`\nsierra_timing_log.test.js: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}
