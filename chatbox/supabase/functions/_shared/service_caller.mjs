// The service-key caller check, for an Edge Function that only the project service key may call.
//
// The check reads RLS-protected allowed_reviewers through PostgREST with the caller's key (the cpl-news-harvest
// capability probe): only a key that bypasses RLS gets a row back, so either key format works and the public anon
// key never spends a paid call. Used by program-requirements-extract.
//
// It tells two answers apart (Sam, Open Asks Sheet 190 card 6, 2026-11-13: "deploy"; COBIx on #3202, comment
// 6850015321). A lookup that answers "this caller is not allowed" refuses with 401. A lookup that gives no answer at
// all (the database unreachable, the probe timing out, PostgREST answering 5xx, a reply that is not the row list)
// answers 503 and names the cause. Until this, every failure answered 401: on 2026-11-13 the database refused
// connections from about 09:29Z to about 11:15Z, and Glendale's paid read (run 43384599013) had all 135 of its
// extraction calls answer 401, filed 121 error stubs over good records, and read as an expired key for an hour.
//
// Only one answer lets the work proceed: a 2xx whose body is a list holding at least one row. Every other path
// returns ok false, so a 503 never lets a caller through.
//
// The siblings' 503s carry {ok: false, reason} and no Retry-After (library-publish-now, docket-process,
// workplan-rebuild, funding-door), so this one does the same, with error beside reason for the extraction runner.
//
// Plain JavaScript with no imports, so Deno (the function) and Node (tests/service_caller_check.test.js) both load
// it. It only reads.

export const PROBE_TIMEOUT_MS = 12000;

// A bearer that could never be sent as a header value is a refusal, before any lookup: without this, a key with a
// space or a newline in it would make fetch throw, and the throw would read as an outage.
const HEADER_SAFE = /^[\x21-\x7e]+$/;

function timedOut(e) {
  const name = (e && e.name) || "";
  return name === "TimeoutError" || name === "AbortError";
}

function refused(why) {
  return { ok: false, status: 401, body: { error: "unauthorized", reason: why } };
}

function unavailable(reason, detail) {
  return {
    ok: false,
    status: 503,
    body: {
      ok: false,
      error: "the caller check could not reach the database, so no call was made; try again once it answers",
      reason,
      detail: String(detail || "").slice(0, 200),
    },
  };
}

// {ok: true} for the service key; {ok: false, status: 401 | 503, body} otherwise.
export async function checkServiceCaller(supabaseUrl, bearer, fetcher = fetch, timeoutMs = PROBE_TIMEOUT_MS) {
  if (!bearer) return refused("no_bearer");
  if (!HEADER_SAFE.test(bearer)) return refused("bearer_malformed");
  let r;
  try {
    r = await fetcher(`${supabaseUrl}/rest/v1/allowed_reviewers?select=email&limit=1`, {
      headers: { apikey: bearer, Authorization: `Bearer ${bearer}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (timedOut(e)) return unavailable("upstream_timeout", `no answer in ${timeoutMs} ms`);
    // The thrown text names the probe's URL, and this answer goes to a caller not yet checked: the log keeps it,
    // the body says only what happened (S648 review).
    console.error("service caller check: the probe threw:", (e && e.message) || String(e));
    return unavailable("upstream_unreachable", "the probe could not connect");
  }
  // A definite refusal: the gateway or PostgREST rejected the key.
  if (r.status === 401 || r.status === 403) return refused("key_refused");
  if (r.status >= 500) return unavailable("upstream_http_" + r.status, `PostgREST answered HTTP ${r.status}`);
  if (r.status < 200 || r.status >= 300) {
    // 429, a 404 for a missing table, any other status: no answer about the caller.
    return unavailable("upstream_http_" + r.status, `PostgREST answered HTTP ${r.status}`);
  }
  let rows;
  try {
    rows = await r.json();
  } catch (e) {
    // The probe's signal also covers the body: a reply cut off by the timeout is a timeout, not a malformed reply.
    if (timedOut(e)) return unavailable("upstream_timeout", `the reply did not finish in ${timeoutMs} ms`);
    return unavailable("upstream_malformed", "the reply was not JSON");
  }
  if (!Array.isArray(rows)) return unavailable("upstream_malformed", "the reply was not a list of rows");
  // RLS hides every row from a key that is not the service key: an empty list is a refusal.
  if (rows.length < 1) return refused("not_service_key");
  return { ok: true };
}
