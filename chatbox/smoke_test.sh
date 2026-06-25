#!/usr/bin/env bash
# Smoke-test the LIVE shared cpl-chat Edge Function across its 4 search modes
# (general / college / topic / college_topic) + a multi-turn follow-up, per the
# CLAUDE.md §7c "smoke-test all 4 modes after a deploy" invariant.
#
# WHY A RUNNER: the agent sandbox is egress-blocked from *.supabase.co (org
# network policy → 403 at the proxy), so this runs on a GitHub Actions runner
# (runner-as-proxy, the same pattern as the landing-page sync). The anon key is
# public (RLS-gated; the same key shipped in cpl_chat.js / unified_courses.js).
#
# It prints each mode's request + streamed answer and fails (exit 1) if any mode
# returns an error body or an empty answer. Re-run after every cpl-chat redeploy
# while we hone the response logic.
set -uo pipefail

URL="${CPL_CHAT_URL:-https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat}"
ANON="${CPL_CHAT_ANON:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM}"

fail=0

extract() { # parse SSE on stdin -> concatenated assistant text
  python3 - <<'PY'
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
PY
}

run() { # label  json-body
  local label="$1" body="$2"
  echo "===================================================================="
  echo "MODE: $label"
  echo "REQUEST: $body"
  echo "--------------------------------------------------------------------"
  local raw
  raw="$(curl -sS -N --max-time 90 -X POST "$URL" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$body")" || { echo "::error::curl failed for $label"; fail=1; echo; return; }
  # Error responses are a single JSON object ({"error":...}); answers are SSE.
  case "$(printf '%s' "$raw" | head -c 1)" in
    "{") echo "ERROR RESPONSE: $raw"; fail=1; echo; return ;;
  esac
  local ans
  ans="$(printf '%s' "$raw" | extract)"
  echo "$ans"
  if [ -z "${ans// /}" ]; then echo "::error::empty answer for $label"; fail=1; fi
  echo
  sleep 1   # stay well under the 20 req/min/IP rate limit
}

run "1 general" \
  '{"query":"What is Credit for Prior Learning?","session_id":"smoke-ci"}'

run "2 college (Riverside City College)" \
  '{"query":"Tell me about CPL at Riverside City College","session_id":"smoke-ci"}'

# topic + history:[] → multi-turn mode → should give a brief orientation and ASK
# a focusing follow-up rather than dumping every college (tweak #3), and list
# eligible course titles + units, not a bare count (tweak #2).
run "3 topic (EMT, multi-turn)" \
  '{"query":"Which colleges give credit for an EMT or paramedic license?","session_id":"smoke-ci","history":[]}'

# Saddleback + firefighter → exercises the STATEWIDE rule (tweak #1): statewide
# collaborative standards must NOT be pinned to one college's landing page.
run "4 college_topic (Saddleback firefighter)" \
  '{"query":"Does Saddleback College offer firefighter CPL?","session_id":"smoke-ci"}'

# Multi-turn refinement: a short region answer to a prior broad EMT question.
# The function folds the prior turn into retrieval, so it should now show a
# SoCal-focused list (tweak #3 follow-through).
run "5 multi-turn follow-up (\"Southern California\")" \
  '{"query":"Southern California","session_id":"smoke-ci","history":[{"role":"user","content":"Which colleges give credit for an EMT license?"},{"role":"assistant","content":"Many California community colleges offer EMT credit, and there is a statewide standard too. Any particular part of California you would like me to focus on, or would you like to see all your options?"}]}'

if [ "$fail" -ne 0 ]; then
  echo "SMOKE TEST FAILED"
  exit 1
fi
echo "ALL MODES OK"
