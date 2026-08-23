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

emit() {  # status  reason
  echo "STATUS: $1"
  echo "REASON: $2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "status=$1" >> "$GITHUB_OUTPUT"
    # One line, quotes stripped — this reaches an issue body, not a shell.
    echo "reason=$(printf '%s' "$2" | tr -d '\r\n"' | cut -c1-400)" >> "$GITHUB_OUTPUT"
  fi
}

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
