// library-publish-now — start the Library's publish run now, from the card.
//
// Sam, in session (2026-11-12): "would be nice to have a manual dispatch button in the library for things we need to
// push right away". A piece approved on its card (Publish it, or Replace the public copy) waits for
// .github/workflows/library-publish.yml, which runs every three hours at :41. The card's Publish now posts here, and
// this function dispatches that workflow on main.
//
// It READS NO TABLE AND WRITES NOTHING in the database. Its one action is the dispatch. It takes nothing from the
// caller: the workflow file and the ref are fixed below, and the request body is never read. The workflow publishes
// only drafts a person approved on their card (scripts/library_publish.py, due()), so a dispatch moves when an
// approved page goes up, never what goes up. Its concurrency group (daily-dashboard) runs it one at a time behind the
// daily build.
//
// Auth: a reviewer's session only (Authorization: Bearer <user JWT>, rpc/is_allowed_reviewer), the check
// docket-process uses. The team phrase does not reach it. Anything else gets 401 and no dispatch; the public anon key
// alone never starts one.
//
// The GitHub key: LIBRARY_DISPATCH_TOKEN if set, else WORKPLAN_DISPATCH_TOKEN (the fine-grained token limited to
// CPL-Initiative/cpl-project-tracker with Actions read and write that workplan-rebuild and docket-process already
// use). The browser never holds a GitHub token. Without either the function answers 503 "not_configured".
//
// Rate: a run already queued, pending or waiting publishes every draft approved before it starts, so no second
// dispatch is made (the answer says already). Beyond that, at most one dispatch every two minutes across callers:
// GitHub's own run list is the clock, so the function keeps no state of its own. A dispatched run younger than two
// minutes answers 429 "too_soon".
//
// The shared queue (COBIx on #3171): library-publish.yml runs in concurrency group daily-dashboard beside ten other
// workflows. GitHub keeps one running and one pending run per group, and a run that queues cancels the one pending,
// whatever cancel-in-progress says. So a dispatch while another workflow's run waits in that group would cancel it
// (an apply, the Docket's processor, the daily build). Before dispatching, the function reads the repository's
// queued, pending and waiting runs, and the waiting jobs of an in-progress run whose group is set on a job; if any
// belongs to a workflow in the group, it answers 409 "busy_behind" and dispatches nothing. The check and GROUP, the
// group's workflows, live in ../_shared/group_queue.mjs, which docket-process imports too (S643);
// tests/library_publish_now.test.js and tests/group_queue.test.js hold GROUP equal to the workflows that name the
// group. These are only read, never dispatched.
//
// Deploy: cpl-chat-deploy.yml with function=library-publish-now, from main (verify_jwt off; the caller check above
// authenticates).

import { fileOf, readGroupQueue } from "../_shared/group_queue.mjs";

const REPO = "CPL-Initiative/cpl-project-tracker";
// The one workflow this function may dispatch, and the one ref. tests/library_publish_now.test.js holds both.
const WORKFLOW = "library-publish.yml";
const REF = "main";
const HOLD_MS = 2 * 60 * 1000;
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
      "User-Agent": "cpl-library-publish-now",
      ...(init.headers || {}),
    },
  });
}

type GhRun = { id: number; path?: string; head_branch?: string; html_url?: string; created_at?: string };

function busyBehind(origin: string | null, run: GhRun, who: string): Response {
  return reply(origin, 409, { ok: false, reason: "busy_behind", workflow: fileOf(run), run_url: run.html_url || null, by: who });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, reason: "post_only" });

  const who = await callerIsReviewer(req);
  if (!who) return reply(origin, 401, { ok: false, reason: "not_allowed" });

  const token = Deno.env.get("LIBRARY_DISPATCH_TOKEN") || Deno.env.get("WORKPLAN_DISPATCH_TOKEN");
  if (!token) return reply(origin, 503, { ok: false, reason: "not_configured" });

  // Every run waiting in the group (../_shared/group_queue.mjs). A queue the function cannot read is not dispatched
  // into.
  const q = await readGroupQueue((path: string) => gh(path, token),
    (run: GhRun) => fileOf(run) === WORKFLOW && run.head_branch === REF);
  if (q.refused) return reply(origin, 503, { ok: false, reason: "token_refused" });
  if (q.unread) return reply(origin, 502, { ok: false, reason: "queue_unread", status: q.status });
  // A publish run already waiting publishes every draft approved before it starts.
  if (q.ours) return reply(origin, 200, { ok: true, queued: true, already: true, run_url: q.ours.html_url || null, by: who });
  // Another workflow's run waiting in the group would be cancelled by this one.
  if (q.busy) return busyBehind(origin, q.busy, who);

  // At most one dispatch every two minutes, whoever pressed.
  const last = await gh("/actions/workflows/" + WORKFLOW + "/runs?branch=" + REF + "&per_page=1&event=workflow_dispatch", token);
  if (last.ok) {
    const j = await last.json();
    const run = j.workflow_runs && j.workflow_runs[0];
    const age = run && run.created_at ? Date.now() - Date.parse(run.created_at) : Infinity;
    if (age < HOLD_MS) {
      return reply(origin, 429, { ok: false, reason: "too_soon", retry_after_s: Math.ceil((HOLD_MS - age) / 1000), run_url: run.html_url, by: who });
    }
  }

  const d = await gh("/actions/workflows/" + WORKFLOW + "/dispatches", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: REF }),
  });
  if (d.status === 204) return reply(origin, 200, { ok: true, queued: true, already: false, by: who });
  return reply(origin, 502, { ok: false, reason: "dispatch_failed", status: d.status });
});
