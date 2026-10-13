// workplan-rebuild — queue the dashboard build after an Annual Goals save.
//
// Sam, Open Asks Sheet 75 card 2, "both" (2026-10-13 19:18Z): a sub-activity added,
// moved, tabled or restored shows at once, and the save queues the rebuild, so the
// Activities cards, their RACI rows, the charts, the Progress counts and the Annual
// Report follow within minutes instead of overnight. The page posts here after each
// such save; this function dispatches .github/workflows/daily-dashboard.yml on main.
//
// It READS NO TABLE AND WRITES NOTHING in the database. Its one action is the
// dispatch, which the daily build already allows by hand (governance CA-01, the
// build's cadence; the tab is DR-13). The build is idempotent and its concurrency
// group runs one at a time, so an extra run is safe.
//
// Auth: the caller is checked the way every Annual Goals write is, as the caller:
// a reviewer's session (Authorization: Bearer <user JWT>, rpc/is_allowed_reviewer)
// or the team phrase (x-team-pass header with the anon key, rpc/team_pass_ok).
// Anything else gets 401 and no dispatch. The public anon key alone never queues one.
//
// The GitHub key: WORKPLAN_DISPATCH_TOKEN, a fine-grained token limited to
// CPL-Initiative/cpl-project-tracker with Actions read and write, set by Sam as an
// Edge Function secret. Without it the function answers 503 "not_configured" and
// the page says the change shows after the nightly build, as before.
//
// Debounce: a build already queued or pending will draw this change, so no second
// dispatch is made; one in progress gets one more behind it (it may have started
// before the save).
//
// Deploy: cpl-chat-deploy.yml with function=workplan-rebuild, from main (verify_jwt
// off; the caller check above authenticates).

const REPO = "CPL-Initiative/cpl-project-tracker";
const WORKFLOW = "daily-dashboard.yml";
const ORIGINS = ["https://cpl-initiative.github.io", "http://localhost", "http://127.0.0.1"];

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ORIGINS.some((o) => origin === o || origin.startsWith(o + ":"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-team-pass",
    "Vary": "Origin",
  };
}

function reply(origin: string | null, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

// Ask PostgREST, as the caller, whether the caller may edit the workplan.
async function callerMayEdit(req: Request): Promise<string | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const auth = req.headers.get("authorization") || "";
  const phrase = req.headers.get("x-team-pass") || "";
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
  if (phrase && await rpc("team_pass_ok", { Authorization: "Bearer " + anon, "x-team-pass": phrase })) {
    return "team";
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
      "User-Agent": "cpl-workplan-rebuild",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, reason: "post_only" });

  const who = await callerMayEdit(req);
  if (!who) return reply(origin, 401, { ok: false, reason: "not_allowed" });

  const token = Deno.env.get("WORKPLAN_DISPATCH_TOKEN");
  if (!token) return reply(origin, 503, { ok: false, reason: "not_configured" });

  // A build already waiting draws this change too.
  for (const status of ["queued", "pending", "waiting"]) {
    const r = await gh("/actions/workflows/" + WORKFLOW + "/runs?branch=main&per_page=1&status=" + status, token);
    if (r.ok) {
      const j = await r.json();
      if ((j.total_count || 0) > 0) {
        const run = j.workflow_runs && j.workflow_runs[0];
        return reply(origin, 200, { ok: true, queued: true, already: true, run_url: run ? run.html_url : null, by: who });
      }
    } else if (r.status === 401 || r.status === 403) {
      return reply(origin, 503, { ok: false, reason: "token_refused" });
    }
  }

  const d = await gh("/actions/workflows/" + WORKFLOW + "/dispatches", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  });
  if (d.status === 204) return reply(origin, 200, { ok: true, queued: true, already: false, by: who });
  return reply(origin, 502, { ok: false, reason: "dispatch_failed", status: d.status });
});
