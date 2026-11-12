// The shared queue check, for every Edge Function that dispatches a workflow in concurrency group daily-dashboard.
//
// COBIx on #3171: GitHub keeps one running and one pending run per concurrency group, and a run that queues cancels
// the one pending, whatever cancel-in-progress says. So a dispatch made while another group workflow's run waits
// would cancel that run (an apply, the Docket's processor, the daily build, a Library publish). Before dispatching, a
// function reads the repository's queued, pending and waiting runs, and the waiting jobs of an in-progress run whose
// group sits on a job, and dispatches nothing while any of them belongs to the group. A queue it cannot read is not
// dispatched into. It was owed for docket-process "with the group list as one shared constant" (S643): this file.
//
// Used by library-publish-now (library-publish.yml) and docket-process (docket-process.yml). Each imports it as
// "../_shared/group_queue.mjs"; the Supabase CLI bundles a relative import into the function it deploys
// (cpl-chat-deploy.yml runs from chatbox/, where supabase/functions/_shared/ sits beside the functions). A folder
// whose name starts with "_" is never deployed as a function of its own.
//
// Plain JavaScript with no imports, so Deno (the functions) and Node (tests/group_queue.test.js) both load it.
// It only reads. It never dispatches.

// The workflows in concurrency group daily-dashboard (read only). tests/library_publish_now.test.js and
// tests/group_queue.test.js hold it equal to the workflows that name the group.
export const GROUP = [
  "cer-decision-apply.yml", "cred-rename-apply.yml", "credential-family-apply.yml", "daily-dashboard.yml",
  "docket-process.yml", "esl-sheet-apply.yml", "library-publish.yml", "overmerge-apply.yml", "phase-1e-apply.yml",
  "projects-seed-apply.yml", "workplan-goals-seed-apply.yml",
];
// Those whose group sits on a job, so a run of theirs can be in progress while the grouped job waits.
export const JOB_LEVEL = ["cer-decision-apply.yml", "cred-rename-apply.yml", "daily-dashboard.yml"];
export const WAITING = ["queued", "pending", "waiting"];

// A run's workflow file: its path is ".github/workflows/<file>", sometimes with "@<ref>" after it.
export function fileOf(run) {
  return String((run && run.path) || "").replace(/@.*$/, "").split("/").pop() || "";
}

// Read the group's queue. `get(path)` is the caller's GitHub GET for a path under /repos/<repo> (it returns a fetch
// Response); `mine(run)` says whether a waiting run is the caller's own, which the caller reuses instead of
// dispatching. The answer is exactly one of:
//   { refused: true }            the key was refused (401 or 403) on the first read
//   { unread: true, status }     a read failed: dispatch nothing
//   { ours: run }                the caller's own run already waits: reuse it
//   { busy: run }                another group workflow's run waits: dispatching would cancel it
//   { clear: true }              nothing waits in the group: the caller may dispatch
export async function readGroupQueue(get, mine) {
  const waiting = [];
  for (const status of WAITING) {
    const r = await get("/actions/runs?per_page=100&status=" + status);
    if (r.status === 401 || r.status === 403) return { refused: true };
    if (!r.ok) return { unread: true, status: r.status };
    const j = await r.json();
    for (const run of (j.workflow_runs || [])) if (GROUP.includes(fileOf(run))) waiting.push(run);
  }
  const ours = waiting.find(mine);
  if (ours) return { ours };
  if (waiting.length) return { busy: waiting[0] };
  const prog = await get("/actions/runs?per_page=100&status=in_progress");
  if (!prog.ok) return { unread: true, status: prog.status };
  const running = (await prog.json()).workflow_runs || [];
  for (const run of running.filter((x) => JOB_LEVEL.includes(fileOf(x)))) {
    const jr = await get("/actions/runs/" + run.id + "/jobs?per_page=100");
    if (!jr.ok) return { unread: true, status: jr.status };
    const jobs = (await jr.json()).jobs || [];
    if (jobs.some((x) => WAITING.includes(String(x.status)))) return { busy: run };
  }
  return { clear: true };
}
