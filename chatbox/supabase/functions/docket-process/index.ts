// docket-process — run the Docket's processor now, from the Commons (#2963 step 3).
//
// Sam's go in session (2026-11-09, "yes, start step 3"), on the order Sky set out on #2963: a reviewer who has
// ruled on a Commons case can carry the rulings out at once with "Process my rulings now" instead of waiting for
// the nightly run. This function dispatches .github/workflows/docket-process.yml on main with mode=apply.
//
// It READS NO TABLE AND WRITES NOTHING in the database. Its one action is the dispatch. What the workflow runs is
// bounded by kb/_docket_process.py: only an allowed script, only with --apply beside --expect, only from the
// reviewed kb/docket/cases.json. The workflow's concurrency group runs one at a time behind the daily build.
//
// Auth: a reviewer's session only (Authorization: Bearer <user JWT>, rpc/is_allowed_reviewer), the same check
// every kb_curation write passes. The team phrase does not reach it: a phrase holder cannot rule. Anything else
// gets 401 and no dispatch; the public anon key alone never queues one.
//
// The GitHub key: DOCKET_DISPATCH_TOKEN if set, else WORKPLAN_DISPATCH_TOKEN (the fine-grained token limited to
// CPL-Initiative/cpl-project-tracker with Actions read and write that workplan-rebuild already uses). The browser
// never holds a GitHub token. Without either the function answers 503 "not_configured".
//
// Rate: a run already queued or pending will read every ruling saved before it starts, so no second dispatch is
// made; one in progress gets one more behind it (it may have read the rulings before the latest).
//
// The shared queue (COBIx on #3171, owed here in S643): docket-process.yml runs in concurrency group daily-dashboard
// beside ten other workflows. GitHub keeps one running and one pending run per group, and a run that queues cancels
// the one pending, whatever cancel-in-progress says. So a dispatch while another workflow's run waits in that group
// would cancel it (an apply, a Library publish, the daily build). Before dispatching, the function reads the group's
// queue through ../_shared/group_queue.mjs, the one check and the one list of the group's workflows that
// library-publish-now imports too: another workflow's run waiting answers 409 "busy_behind" and dispatches nothing,
// and a queue it cannot read answers 502 "queue_unread" and dispatches nothing. The 05:33 UTC run still carries the
// rulings out.
//
// Deploy: cpl-chat-deploy.yml with function=docket-process, from main (verify_jwt off; the caller check above
// authenticates).

import { fileOf, readGroupQueue } from "../_shared/group_queue.mjs";

const REPO = "CPL-Initiative/cpl-project-tracker";
const WORKFLOW = "docket-process.yml";
const REF = "main";
const ORIGINS = ["https://cpl-initiative.github.io", "http://localhost", "http://127.0.0.1"];

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ORIGINS.some((o) => origin === o || origin.startsWith(o + ":"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Vary": "Origin",
  };
}

function reply(origin: string | null, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

// Ask PostgREST, as the caller, whether the caller is a reviewer on the list.
async function callerIsReviewer(req: Request): Promise<string | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "");
  async function rpc(name: string, headers: Record<string, string>): Promise<boolean> {
    try {
      const r = await fetch(url + "/rest/v1/rpc/" + name, {
        method: "POST",
        headers: { apikey: anon!, "Content-Type": "application/json", ...headers },
        body: "{}",
      });
      return r.ok && (await r.json()) === true;
    } catch (_e) {
      return false;
    }
  }
  if (bearer && bearer !== anon && await rpc("is_allowed_reviewer", { Authorization: "Bearer " + bearer })) {
    return "reviewer";
  }
  return null;
}

async function gh(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  return await fetch("https://api.github.com/repos/" + REPO + path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cpl-docket-process",
      ...(init.headers || {}),
    },
  });
}

type GhRun = { id: number; path?: string; head_branch?: string; html_url?: string };

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, reason: "post_only" });

  const who = await callerIsReviewer(req);
  if (!who) return reply(origin, 401, { ok: false, reason: "not_allowed" });

  const token = Deno.env.get("DOCKET_DISPATCH_TOKEN") || Deno.env.get("WORKPLAN_DISPATCH_TOKEN");
  if (!token) return reply(origin, 503, { ok: false, reason: "not_configured" });

  // Every run waiting in the group (../_shared/group_queue.mjs). A queue the function cannot read is not dispatched
  // into.
  const q = await readGroupQueue((path: string) => gh(path, token),
    (run: GhRun) => fileOf(run) === WORKFLOW && run.head_branch === REF);
  if (q.refused) return reply(origin, 503, { ok: false, reason: "token_refused" });
  if (q.unread) return reply(origin, 502, { ok: false, reason: "queue_unread", status: q.status });
  // A run already waiting reads every ruling saved before it starts.
  if (q.ours) return reply(origin, 200, { ok: true, queued: true, already: true, run_url: q.ours.html_url || null, by: who });
  // Another workflow's run waiting in the group would be cancelled by this one.
  if (q.busy) {
    return reply(origin, 409, { ok: false, reason: "busy_behind", workflow: fileOf(q.busy), run_url: q.busy.html_url || null, by: who });
  }

  const d = await gh("/actions/workflows/" + WORKFLOW + "/dispatches", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", inputs: { mode: "apply" } }),
  });
  if (d.status === 204) return reply(origin, 200, { ok: true, queued: true, already: false, by: who });
  return reply(origin, 502, { ok: false, reason: "dispatch_failed", status: d.status });
});
