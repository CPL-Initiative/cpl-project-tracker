// funding-door — sign a funding CSM in without an Auth email (#2983).
//
// Sam, during the MAP CSM session (2026-11-09, 11:12-11:20 AM PT, relayed by COBIx on #2983): the built-in Auth
// mailer is capped at two emails an hour for the whole project, and it locked the team out that morning. He asked
// for a door where a person requests access with their work email and one of four approvers (Sam, Malone, Kristen,
// Natalie) says yes, with no phrase or secret in any email.
//
// The request and the approval are database functions (kb/migrations/2026-11-09_funding_door.sql). This function is
// the last step: the requester's browser, still open, sends its request id and the secret only it holds. When the
// request is approved (within 30 minutes) and not yet claimed, this marks it claimed, makes sure the Auth user
// exists, and mints that person's own session with admin generate_link + verify. generate_link sends no email, so
// the two-an-hour cap never applies, and the session is the person's own: every save stamps their address.
//
// What the session opens is decided in the database: is_funding_reviewer() (the funding and CSM surfaces only).
// is_allowed_reviewer() is unchanged, so nothing else opens.
//
// Auth: none from the caller beyond the request's secret (the caller is, by definition, not signed in). The secret is
// 32 random bytes the browser made; the table holds its SHA-256; a request is claimed once.
//
// Deploy: cpl-chat-deploy.yml with function=funding-door, from main (verify_jwt off: the secret check authenticates).

const ORIGINS = ["https://cpl-initiative.github.io", "http://localhost", "http://127.0.0.1"];
const CLAIM_WINDOW_MS = 30 * 60 * 1000;

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
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}
async function sha256Hex(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, why: "method" });
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return reply(origin, 503, { ok: false, why: "not_configured" });

  let id = "", secret = "";
  try { const b = await req.json(); id = String(b.id || ""); secret = String(b.secret || ""); } catch (_) { /* below */ }
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/.test(secret)) return reply(origin, 400, { ok: false, why: "bad_request" });
  const hash = await sha256Hex(secret);
  const svc = { apikey: service, Authorization: "Bearer " + service, "Content-Type": "application/json" };

  // Claim it once: only an approved, unclaimed request with this secret, approved within the window.
  const since = new Date(Date.now() - CLAIM_WINDOW_MS).toISOString();
  const q = url + "/rest/v1/funding_access_requests?id=eq." + id + "&secret_hash=eq." + hash +
    "&status=eq.approved&claimed_at=is.null&decided_at=gte." + encodeURIComponent(since);
  const claim = await fetch(q, { method: "PATCH", headers: { ...svc, Prefer: "return=representation" },
    body: JSON.stringify({ status: "claimed", claimed_at: new Date().toISOString() }) });
  const rows = claim.ok ? await claim.json() : [];
  if (!Array.isArray(rows) || rows.length !== 1) return reply(origin, 403, { ok: false, why: "not_approved" });
  const email = String(rows[0].email || "").toLowerCase();

  // The grant must still stand (an approver may have revoked it).
  const g = await fetch(url + "/rest/v1/funding_access?email=eq." + encodeURIComponent(email) +
    "&revoked_at=is.null&expires_at=gt." + encodeURIComponent(new Date().toISOString()) + "&select=email", { headers: svc });
  const grant = g.ok ? await g.json() : [];
  if (!Array.isArray(grant) || !grant.length) return reply(origin, 403, { ok: false, why: "not_granted" });

  // The Auth user: create it confirmed if it does not exist yet (no email is sent either way).
  await fetch(url + "/auth/v1/admin/users", { method: "POST", headers: svc,
    body: JSON.stringify({ email, email_confirm: true }) }).catch(() => null);

  const gl = await fetch(url + "/auth/v1/admin/generate_link", { method: "POST", headers: svc,
    body: JSON.stringify({ type: "magiclink", email }) });
  const link = gl.ok ? await gl.json() : null;
  const tokenHash = link && (link.hashed_token || (link.properties && link.properties.hashed_token));
  if (!tokenHash) return reply(origin, 502, { ok: false, why: "link_failed" });

  const v = await fetch(url + "/auth/v1/verify", { method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: tokenHash }) });
  const s = v.ok ? await v.json() : null;
  if (!s || !s.access_token) return reply(origin, 502, { ok: false, why: "verify_failed" });
  return reply(origin, 200, { ok: true, access_token: s.access_token, refresh_token: s.refresh_token || null,
    expires_in: s.expires_in || 3600, email });
});
