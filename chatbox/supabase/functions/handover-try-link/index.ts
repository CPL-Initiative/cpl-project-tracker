// handover-try-link — ask the reader to look at a hand-over now, from the Commons (Sam, 2026-11-20).
//
// Sam, in session on the locked Commons order mock ("yes, build it!"; cpl_memory r-hand-over-in-place-sam-2026-11-20):
// "item or link and a try the link button". A reviewer who hands over a link (or asks for an API address to be
// tested) gets the reader's answer within minutes instead of at the nightly run. This function dispatches
// .github/workflows/commons-handover-pickup.yml on main with the row's id.
//
// It READS NO TABLE AND WRITES NOTHING in the database, and it FETCHES NO ADDRESS itself: the address a person gave
// is never requested from here. Its one action is the dispatch. The reader that visits the address is the runner's
// (kb/_handover_pickup.py): it names itself (CPLInitiativeCatalogCensus), reads robots.txt first, stops at a bot
// check and answers on the row through commons_handover_mark(), which takes the service role alone.
//
// Auth: a reviewer's session only (Authorization: Bearer <user JWT>, rpc/is_allowed_reviewer), the same check
// commons_handover_add() makes. The team phrase does not reach it. Anything else gets 401 and no dispatch; the
// public anon key alone never queues one.
//
// The GitHub key: HANDOVER_DISPATCH_TOKEN if set, else WORKPLAN_DISPATCH_TOKEN (the fine-grained token limited to
// CPL-Initiative/cpl-project-tracker with Actions read and write that workplan-rebuild and docket-process already
// use). The browser never holds a GitHub token. Without either the function answers 503 "not_configured" and the
// page says the link waits for the nightly run.
//
// Rate: the pickup reads every waiting hand-over, the named one first. A run already queued or pending will read
// this row when it starts, so no second dispatch is made; one in progress gets one more behind it (it may have read
// the waiting rows before this one was saved). The workflow has a concurrency group of its own and pushes nothing,
// so it never queues behind the daily build.
//
// Deploy: cpl-chat-deploy.yml with function=handover-try-link, from main (verify_jwt off; the caller check above
// authenticates).

const REPO = "CPL-Initiative/cpl-project-tracker";
const WORKFLOW = "commons-handover-pickup.yml";
const REF = "main";
const ORIGINS = ["https://cpl-initiative.github.io", "http://localhost", "http://127.0.0.1"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  // A refusal names its reason in the function's log: the edge log keeps the status alone, and on 2026-11-20 three
  // 503s could not be told apart (no token set, or a token GitHub refused). The reason holds no address and no name.
  const b = body as { ok?: boolean; reason?: string; status?: number };
  if (b && b.ok === false) console.error("handover-try-link refused: " + (b.reason || "unknown") + (b.status ? " (" + b.status + ")" : ""));
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
  if (!bearer || bearer === anon) return null;
  try {
    const r = await fetch(url + "/rest/v1/rpc/is_allowed_reviewer", {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json", Authorization: "Bearer " + bearer },
      body: "{}",
    });
    return r.ok && (await r.json()) === true ? "reviewer" : null;
  } catch (_e) {
    return null;
  }
}

async function gh(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  return await fetch("https://api.github.com/repos/" + REPO + path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cpl-handover-try-link",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, reason: "post_only" });

  const who = await callerIsReviewer(req);
  if (!who) return reply(origin, 401, { ok: false, reason: "not_allowed" });

  // The row's id and nothing else: an address is never taken from the request.
  let id = "";
  try {
    const body = await req.json();
    id = typeof body?.id === "string" ? body.id : "";
  } catch (_e) {
    id = "";
  }
  if (!UUID.test(id)) return reply(origin, 400, { ok: false, reason: "id_required" });

  const token = Deno.env.get("HANDOVER_DISPATCH_TOKEN") || Deno.env.get("WORKPLAN_DISPATCH_TOKEN");
  if (!token) return reply(origin, 503, { ok: false, reason: "not_configured" });

  // A pickup already waiting reads every waiting hand-over when it starts, this one included.
  for (const status of ["queued", "pending", "waiting"]) {
    const r = await gh("/actions/workflows/" + WORKFLOW + "/runs?branch=" + REF + "&per_page=1&status=" + status, token);
    if (r.ok) {
      const j = await r.json();
      if ((j.total_count || 0) > 0) return reply(origin, 200, { ok: true, queued: true, already: true, by: who });
    } else if (r.status === 401 || r.status === 403) {
      return reply(origin, 503, { ok: false, reason: "token_refused", status: r.status });
    }
  }

  const d = await gh("/actions/workflows/" + WORKFLOW + "/dispatches", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: REF, inputs: { id } }),
  });
  if (d.status === 204) return reply(origin, 200, { ok: true, queued: true, already: false, by: who });
  return reply(origin, 502, { ok: false, reason: "dispatch_failed", status: d.status });
});
