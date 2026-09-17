#!/usr/bin/env bash
# ── Sierra liveness probe — ONE question, run hourly ──────────────────────────
#
# WHY THIS EXISTS. The Anthropic credit balance behind cpl-chat ran dry twice in
# two days (2026-08-21 21:33 UTC and again 2026-08-22 ~21:30 UTC). Both times
# EVERY Sierra surface went dark at once — the public page, the COBI tab, the
# Fact Sheet drawer, map.rccd.edu, the college landing pages and the vendor
# iframe — and both times it was found HOURS later by a session that happened to
# run a post-deploy check. Nothing was watching. A student who hit the widget in
# either window reached nobody and filed nothing, which is why the outage cannot
# be trusted to report itself through feedback.
#
# WHY NOT JUST SCHEDULE cpl-chat-smoke.yml. That suite makes ~16 model calls per
# run; hourly, it is a standing bill AND it is itself a plausible contributor to
# the balance running down. This probe makes ONE call. It answers exactly one
# question — "is she answering at all?" — and deliberately asserts NOTHING about
# the content of the answer. Capability is the smoke suite's job; this is uptime.
#
# ⚠ THE PROBE MUST BE ABLE TO FAIL. A liveness check that reports UP whenever it
# cannot tell is worse than no check, because it converts an outage into a green
# tick. So every branch below that is not a positively-recognized answer is
# treated as DOWN, including a transport failure — from a student's browser an
# unreachable function and a broken one are the same event.
set -uo pipefail

URL="${CPL_CHAT_URL:-https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat}"
# The anon key is public by design (RLS-gated; the same key ships in cpl_chat.js).
ANON="${CPL_CHAT_ANON:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM}"

# Kept short and generic on purpose: no retrieval fan-out, no college named, and
# nothing that would go red because the data changed underneath it.
BODY='{"query":"What is Credit for Prior Learning?","session_id":"health-probe"}'

# The blast radius of a LIVENESS failure: the model call is behind every surface,
# so losing it loses all of them. A preflight failure is narrower and says so for
# itself, which is why this is a default rather than a constant.
DEFAULT_SCOPE="Every Sierra surface at once — the public page, the COBI tab, the Fact Sheet drawer, map.rccd.edu, the college landing pages and the vendor iframe."

emit() {  # status  reason  [who is affected]
  echo "STATUS: $1"
  echo "REASON: $2"
  echo "SCOPE: ${3:-$DEFAULT_SCOPE}"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "status=$1" >> "$GITHUB_OUTPUT"
    # One line, quotes stripped — these reach an issue body, not a shell.
    echo "reason=$(printf '%s' "$2" | tr -d '\r\n"' | cut -c1-400)" >> "$GITHUB_OUTPUT"
    echo "scope=$(printf '%s' "${3:-$DEFAULT_SCOPE}" | tr -d '\r\n"' | cut -c1-400)" >> "$GITHUB_OUTPUT"
  fi
}

# ── 1. THE PREFLIGHT CONTRACT — free, and the class curl cannot otherwise see ─
#
# ⚠ THIS SCRIPT IS NOT A BROWSER, AND THAT IS A BLIND SPOT. curl puts the POST
# straight on the wire. A browser first asks OPTIONS whether it may send the
# headers it holds, and when the answer omits one it sends NOTHING — the fetch
# rejects before the function is ever reached. So a deployed function whose
# Access-Control-Allow-Headers has fallen behind the deployed PAGE is down for
# every reader holding that header, while the POST below sails through: a green
# tick over a dark widget.
#
# ⭐ MEASURED, 2026-09-17. The page began sending x-team-pass on 2026-09-12
# (#1568, cpl-chat v66); the function was still deployed at v65, whose allow-list
# predates the header. Two preflights that morning were answered 204 and NO POST
# followed either one — the browser had refused, twice, thirteen minutes apart.
# Every COBI reader holding the team phrase had read Sierra as down for five days
# and this probe passed straight through all of it, because the failure lives in
# a request curl never makes. #1568's own comment predicted the header would be
# "dropped silently"; a browser drops the whole request instead.
#
# It makes no model call, so it runs FIRST and fails fast.
ORIGIN="${CPL_CHAT_ORIGIN:-https://cpl-initiative.github.io}"
# Every header a Sierra caller can attach. The public page and the Fact Sheet
# send the first three; cpl_chat.js (the COBI widget) adds x-team-pass for a
# phrase holder via credentialHeaders(). tests/sierra_cors_contract.test.js holds
# the source-side half of this contract — this half reads what is DEPLOYED, which
# is the half that was wrong.
WANT="content-type authorization apikey x-team-pass"

echo "Preflighting $URL as $ORIGIN"
pre="$(curl -sS -i --max-time 30 -X OPTIONS "$URL" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: $(printf '%s' "$WANT" | tr ' ' ',')" 2>&1)"
rc=$?

if [ "$rc" -ne 0 ]; then
  emit down "the CORS preflight is unreachable from the runner (curl exit $rc). $(printf '%s' "$pre" | head -c 200)"
  exit 1
fi

hdr() {  # header-name -> its value, lowercased, spaces stripped
  printf '%s' "$pre" | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d: -f2- | tr 'A-Z' 'a-z' | tr -d ' '
}
allow="$(hdr 'access-control-allow-headers')"
origin_ok="$(hdr 'access-control-allow-origin')"

missing=""
for h in $WANT; do
  case ",$allow," in
    *",$h,"*) ;;
    *) missing="$missing $h" ;;
  esac
done

if [ -z "$allow" ]; then
  emit down "the CORS preflight answered without an Access-Control-Allow-Headers header at all, so a browser will refuse to send ANY Sierra request. Raw: $(printf '%s' "$pre" | head -c 300)"
  exit 1
fi

if [ -n "$missing" ]; then
  emit down "CORS PREFLIGHT REJECTS A HEADER THE DEPLOYED PAGE SENDS —${missing}. A browser refuses the request outright rather than dropping the header, so the reader gets nothing and the function logs no POST. The deployed function is behind the deployed page. Remedy: dispatch .github/workflows/cpl-chat-deploy.yml to publish the current function. Allowed: $allow" \
    "Readers whose browser sends${missing} — for x-team-pass that is every COBI reader holding the team phrase, i.e. the MAP team. The public Sierra page, the Fact Sheet drawer and this probe's own POST are unaffected, which is why uptime reads green throughout."
  exit 1
fi

if [ -z "$origin_ok" ]; then
  emit down "the CORS preflight did not echo an Access-Control-Allow-Origin for $ORIGIN, so a browser on that origin is refused before any request is sent. Check ALLOWED_ORIGINS in the deployed function."
  exit 1
fi

echo "Preflight OK — allows: $allow"

# ── 2. LIVENESS — the one model call ─────────────────────────────────────────
echo "Probing $URL"
raw="$(curl -sS -N --max-time 90 -X POST "$URL" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "$BODY" 2>&1)"
rc=$?

if [ "$rc" -ne 0 ]; then
  emit down "cpl-chat is unreachable from the runner (curl exit $rc). $(printf '%s' "$raw" | head -c 200)"
  exit 1
fi

# An error is a single JSON object ({"error":...}); a real answer is an SSE stream.
case "$(printf '%s' "$raw" | head -c 1)" in
  "{")
    # Name the billing case explicitly — it is the one that has actually happened,
    # and it is the one whose remedy (top up the Anthropic account) is a person's
    # job rather than an engineering fix.
    if printf '%s' "$raw" | grep -qi "credit balance is too low"; then
      emit down "Anthropic CREDIT BALANCE EXHAUSTED — every model-backed Sierra surface is returning an error. Remedy: top up the Anthropic account (Plans & Billing). Raw: $(printf '%s' "$raw" | head -c 300)"
    else
      emit down "cpl-chat returned an error body: $(printf '%s' "$raw" | head -c 300)"
    fi
    exit 1 ;;
esac

# Pull the streamed text out of the SSE frames. An SSE-shaped response that
# carries no text is still a failed answer.
answer="$(printf '%s' "$raw" | python3 -c '
import sys, json
out = []
for blk in sys.stdin.read().split("\n\n"):
    ev = None; data = ""
    for line in blk.split("\n"):
        if line.startswith("event:"): ev = line[6:].strip()
        elif line.startswith("data:"): data += line[5:].strip()
    if ev == "text":
        try:
            d = json.loads(data)
            if isinstance(d, dict) and isinstance(d.get("text"), str): out.append(d["text"])
        except Exception:
            pass
sys.stdout.write("".join(out))
')"

if [ -z "${answer// /}" ]; then
  emit down "cpl-chat streamed no answer text (empty response). First 300 bytes: $(printf '%s' "$raw" | head -c 300)"
  exit 1
fi

echo "--------------------------------------------------------------------"
printf '%s\n' "$answer" | head -c 600
echo
echo "--------------------------------------------------------------------"
emit up "Sierra answered ($(printf '%s' "$answer" | wc -c) bytes)."
