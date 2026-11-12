// The shared queue check (COBIx on #3171; owed for docket-process "with the group list as one shared constant", S643).
//
// Several workflows share the GitHub Actions concurrency group daily-dashboard. GitHub keeps one pending run per group,
// so a newly queued run cancels the one already waiting, whatever cancel-in-progress says. library-publish-now (#3171)
// and docket-process each read the queue before they dispatch, through one module:
// chatbox/supabase/functions/_shared/group_queue.mjs.
//
// Guards the failure modes:
//   A. The one list: GROUP equals the workflows that name concurrency group daily-dashboard, JOB_LEVEL those that name
//      it on a job, and both functions import them from the shared module and keep no copy of their own.
//   B. The check itself, run against a fake GitHub: another group workflow's waiting run (queued, pending, waiting, or a
//      waiting job of an in-progress job-level run) is busy; the caller's own waiting run is reused; any failed read is
//      unread; a refused key is refused; an empty queue, or runs outside the group, is clear.
//   C. docket-process: 409 busy_behind and 502 queue_unread dispatch nothing, its own waiting run is reused as before,
//      the happy path dispatches docket-process.yml on main in apply mode, and the queue is read before the dispatch.
//   D. The deploy: cpl-chat-deploy.yml runs from chatbox/ (where supabase/functions/_shared/ sits beside the
//      functions, so the CLI bundles the relative import) and lists both functions; the shared folder is not a function.
//
// Run: node tests/group_queue.test.js
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SHARED_PATH = "chatbox/supabase/functions/_shared/group_queue.mjs";
const SHARED = fs.readFileSync(SHARED_PATH, "utf8");
const FNS = {
  "library-publish-now": fs.readFileSync("chatbox/supabase/functions/library-publish-now/index.ts", "utf8"),
  "docket-process": fs.readFileSync("chatbox/supabase/functions/docket-process/index.ts", "utf8"),
};

// A fake GitHub: `runs` maps a status to the runs listed under it, `jobs` maps a run id to its jobs, and `fail` maps a
// path prefix to the status it answers.
function fakeGet(o) {
  o = o || {};
  const calls = [];
  const get = function (p) {
    calls.push(p);
    for (const k of Object.keys(o.fail || {})) {
      if (p.indexOf(k) === 0) return Promise.resolve({ ok: false, status: o.fail[k], json: () => Promise.resolve({}) });
    }
    let body = {};
    const m = /^\/actions\/runs\?per_page=100&status=(\w+)$/.exec(p);
    if (m) body = { workflow_runs: (o.runs || {})[m[1]] || [] };
    const jm = /^\/actions\/runs\/(\d+)\/jobs\?per_page=100$/.exec(p);
    if (jm) body = { jobs: (o.jobs || {})[jm[1]] || [] };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  };
  return { get: get, calls: calls };
}
const run = (id, file, branch) => ({ id: id, path: ".github/workflows/" + file, head_branch: branch || "main", html_url: "https://github.com/x/runs/" + id });
const docketMine = (r) => r.path && /docket-process\.yml$/.test(r.path) && r.head_branch === "main";

(async function () {
  const Q = await import(path.resolve(SHARED_PATH));

  // ── A. The one list ──
  {
    const wfDir = ".github/workflows";
    const inGroup = [], jobLevel = [];
    fs.readdirSync(wfDir).filter((f) => /\.ya?ml$/.test(f)).sort().forEach(function (f) {
      const t = fs.readFileSync(wfDir + "/" + f, "utf8"), mm = /^( *)group: daily-dashboard\s*$/m.exec(t);
      if (mm) { inGroup.push(f); if (mm[1].length > 2) jobLevel.push(f); }
    });
    check("A ⭐ GROUP (the shared constant) holds exactly the workflows in concurrency group daily-dashboard",
      Q.GROUP.slice().sort().join(",") === inGroup.join(",") && inGroup.length > 1, Q.GROUP.join(",") + " vs " + inGroup.join(","));
    check("A JOB_LEVEL holds exactly those whose group sits on a job, each one in GROUP",
      Q.JOB_LEVEL.slice().sort().join(",") === jobLevel.join(",") && Q.JOB_LEVEL.every((f) => Q.GROUP.includes(f)), Q.JOB_LEVEL.join(","));
    check("A both dispatched workflows are in the group (the check applies to both)",
      Q.GROUP.includes("docket-process.yml") && Q.GROUP.includes("library-publish.yml"));
    const dk = fs.readFileSync(wfDir + "/docket-process.yml", "utf8");
    check("A ⭐ docket-process.yml names the group at the workflow level, so a run of it waits in the shared queue",
      /^concurrency:\n {2}group: daily-dashboard\n {2}cancel-in-progress: false$/m.test(dk));
    Object.keys(FNS).forEach(function (name) {
      const FN = FNS[name];
      check("A ⭐ " + name + " imports the check and the list from the one shared module",
        /^import \{ fileOf, readGroupQueue \} from "\.\.\/_shared\/group_queue\.mjs";$/m.test(FN), name);
      check("A " + name + " keeps no copy of the list, the statuses or the queue reads",
        !/const (GROUP|JOB_LEVEL|WAITING) = \[/.test(FN) && !/function fileOf\(/.test(FN) && !/status=in_progress/.test(FN)
        && !/"queued", "pending", "waiting"/.test(FN) && !/\.yml", "/.test(FN), name);
    });
    check("A the shared module is plain JavaScript with no imports (Deno and Node both load it) and dispatches nothing",
      !/^\s*import\s/m.test(SHARED) && !/\/dispatches/.test(SHARED) && !/method:\s*"POST"/.test(SHARED) && !/fetch\(/.test(SHARED));
  }

  // ── B. The check, against a fake GitHub ──
  {
    for (const status of ["queued", "pending", "waiting"]) {
      const g = fakeGet({ runs: { [status]: [run(11, "cer-decision-apply.yml")] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B ⭐ another group workflow's " + status + " run is busy", q.busy && q.busy.id === 11 && !q.clear && !q.ours, JSON.stringify(q));
    }
    {
      const g = fakeGet({ runs: { pending: [run(21, "docket-process.yml")] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B ⭐ the caller's own waiting run is reused, not called busy", q.ours && q.ours.id === 21 && !q.busy, JSON.stringify(q));
    }
    {
      const g = fakeGet({ runs: { queued: [run(31, "library-publish.yml")], pending: [run(32, "docket-process.yml")] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B the caller's own waiting run wins over another waiting beside it (it already holds the pending slot)", q.ours && q.ours.id === 32, JSON.stringify(q));
    }
    {
      const g = fakeGet({ runs: { pending: [run(41, "docket-process.yml", "claude/x")] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B the caller's workflow waiting on another branch is not its own: busy", q.busy && q.busy.id === 41 && !q.ours, JSON.stringify(q));
    }
    {
      const g = fakeGet({ runs: { queued: [run(51, "js-tests.yml")], in_progress: [run(52, "daily-dashboard.yml")] }, jobs: { 52: [{ status: "in_progress" }] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B ⭐ happy path: runs outside the group and a running build with no waiting job are clear", q.clear === true && !q.busy && !q.ours, JSON.stringify(q));
      check("B it reads queued, pending, waiting, in progress, then the running job-level run's jobs, and nothing else",
        g.calls.join(" ") === "/actions/runs?per_page=100&status=queued /actions/runs?per_page=100&status=pending /actions/runs?per_page=100&status=waiting /actions/runs?per_page=100&status=in_progress /actions/runs/52/jobs?per_page=100", g.calls.join(" "));
    }
    {
      const g = fakeGet({ runs: { in_progress: [run(61, "daily-dashboard.yml")] }, jobs: { 61: [{ status: "completed" }, { status: "waiting" }] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B ⭐ a job-level run in progress whose grouped job waits is busy", q.busy && q.busy.id === 61, JSON.stringify(q));
    }
    {
      const g = fakeGet({ runs: { in_progress: [run(71, "library-publish.yml")] } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B a workflow-level run in progress is not waiting (a dispatch queues behind it): clear, and its jobs are not read",
        q.clear === true && !g.calls.some((c) => /\/jobs/.test(c)), JSON.stringify(q));
    }
    {
      const g = fakeGet({ fail: { "/actions/runs?per_page=100&status=queued": 401 } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B a refused key is refused", q.refused === true && !q.clear, JSON.stringify(q));
    }
    for (const where of ["/actions/runs?per_page=100&status=pending", "/actions/runs?per_page=100&status=in_progress", "/actions/runs/81/jobs"]) {
      const g = fakeGet({ runs: { in_progress: [run(81, "cred-rename-apply.yml")] }, fail: { [where]: 500 } });
      const q = await Q.readGroupQueue(g.get, docketMine);
      check("B ⭐ a failed read (" + where.replace(/\?.*/, "") + (/status=/.test(where) ? " " + where.split("status=")[1] : "") + ") is unread, never clear",
        q.unread === true && q.status === 500 && !q.clear, JSON.stringify(q));
    }
    check("B fileOf reads a run's workflow file, with or without @ref", Q.fileOf({ path: ".github/workflows/docket-process.yml@refs/heads/main" }) === "docket-process.yml"
      && Q.fileOf({}) === "" && Q.fileOf(null) === "");
  }

  // ── C. docket-process answers ──
  {
    const FN = FNS["docket-process"];
    const serve = FN.slice(FN.indexOf("Deno.serve("));
    const at = (s) => serve.indexOf(s);
    check("C ⭐ the queue is read after the reviewer check and the key, and before the one dispatch",
      0 < at("await callerIsReviewer(req)") && at("await callerIsReviewer(req)") < at("DISPATCH_TOKEN") && at("DISPATCH_TOKEN") < at("await readGroupQueue(")
      && at("await readGroupQueue(") < at("/dispatches") && (FN.match(/\/dispatches"/g) || []).length === 1);
    check("C ⭐ its own run is the one the predicate names: docket-process.yml on main",
      /readGroupQueue\(\(path: string\) => gh\(path, token\),\s*\(run: GhRun\) => fileOf\(run\) === WORKFLOW && run\.head_branch === REF\)/.test(serve)
      && /const WORKFLOW = "docket-process\.yml";/.test(FN) && /const REF = "main";/.test(FN));
    // Every answer before the dispatch returns, so none of them reaches it.
    const before = serve.slice(at("await readGroupQueue("), at("/dispatches"));
    check("C ⭐ another waiting run answers 409 busy_behind, naming the workflow, and returns before the dispatch",
      /if \(q\.busy\) \{\s*return reply\(origin, 409, \{ ok: false, reason: "busy_behind", workflow: fileOf\(q\.busy\), run_url: q\.busy\.html_url \|\| null, by: who \}\);\s*\}/.test(before));
    check("C ⭐ an unread queue answers 502 queue_unread and returns before the dispatch; a refused key 503",
      /if \(q\.unread\) return reply\(origin, 502, \{ ok: false, reason: "queue_unread", status: q\.status \}\);/.test(before)
      && /if \(q\.refused\) return reply\(origin, 503, \{ ok: false, reason: "token_refused" \}\);/.test(before));
    check("C its own waiting run is reused as before (200, already, its link)",
      /if \(q\.ours\) return reply\(origin, 200, \{ ok: true, queued: true, already: true, run_url: q\.ours\.html_url \|\| null, by: who \}\);/.test(before));
    check("C ⭐ happy path unchanged: the dispatch names docket-process.yml on main in apply mode, and a 204 answers queued",
      /gh\("\/actions\/workflows\/" \+ WORKFLOW \+ "\/dispatches"/.test(serve) && /body: JSON\.stringify\(\{ ref: "main", inputs: \{ mode: "apply" \} \}\)/.test(serve)
      && /if \(d\.status === 204\) return reply\(origin, 200, \{ ok: true, queued: true, already: false, by: who \}\);/.test(serve));
    check("C the old per-workflow read that dispatched past a failed read is gone", !/runs\?branch=main&per_page=1&status=/.test(FN) && !/\} else if \(r\.status === 401/.test(FN));
    check("C it still takes nothing from the caller", !/req\.(json|text|formData|body)\b/.test(FN) && !/searchParams/.test(FN));
    // The answers mirror library-publish-now's, so COBI reads one vocabulary.
    const LIB = FNS["library-publish-now"];
    check("C library-publish-now answers the same way (409 busy_behind, 502 queue_unread, 503 token_refused)",
      /reply\(origin, 409, \{ ok: false, reason: "busy_behind"/.test(LIB) && /if \(q\.unread\) return reply\(origin, 502, \{ ok: false, reason: "queue_unread"/.test(LIB)
      && /if \(q\.refused\) return reply\(origin, 503, \{ ok: false, reason: "token_refused" \}\)/.test(LIB));
  }

  // ── D. The deploy ──
  {
    const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");
    check("D ⭐ the deploy runs from chatbox/, where supabase/functions/_shared/ sits beside both functions",
      /working-directory: chatbox\n[\s\S]*?supabase functions deploy "\$FN"/.test(DEPLOY) && fs.existsSync("chatbox/supabase/functions/_shared/group_queue.mjs"));
    check("D both functions are on the deploy list, and the shared folder is not a function",
      /options:[\s\S]*- docket-process/.test(DEPLOY) && /options:[\s\S]*- library-publish-now/.test(DEPLOY) && !/- _shared/.test(DEPLOY)
      && !fs.existsSync("chatbox/supabase/functions/_shared/index.ts"));
    check("D the deploy records the shared module's bytes beside the function's", /_shared/.test(DEPLOY) && /sha256sum/.test(DEPLOY));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\ngroup_queue.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
