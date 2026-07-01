#!/usr/bin/env bash
# Sierra ADOPTION/OFFERINGS QA battery — the real Boys & Girls Club (BGCA) case.
#
# A richer companion to smoke_test.sh (which is the deploy GATE — liveness of the
# 4 modes). This one exercises the v20 COCI-offerings / adoption reasoning against
# the ACTUAL question a BGCA colleague asked (NCCER/OSHA/welding certs, LA Harbor /
# El Camino / Long Beach City service area) + variants, and PRINTS each full answer
# for human/AI review. It does NOT hard-assert wording (that's a judgment call we
# tune) — it fails only if a request errors or returns empty. Re-run after any
# Sierra tuning to eyeball the adoption cases.
#
# WHY A RUNNER: the agent sandbox is egress-blocked from *.supabase.co; this runs
# on a GitHub Actions runner (like smoke_test.sh). Anon key is public + RLS-gated.
set -uo pipefail

URL="${CPL_CHAT_URL:-https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat}"
ANON="${CPL_CHAT_ANON:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM}"

fail=0
PARSER="$(mktemp)"
cat > "$PARSER" <<'PY'
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
        except Exception: pass
sys.stdout.write("".join(out))
PY

ask() { # id  json-body
  local id="$1" body="$2"
  echo "########## Q${id} ##########"
  echo "REQUEST: $body"
  echo "---------- A${id} ----------"
  local raw ans
  raw="$(curl -sS -N --max-time 90 -X POST "$URL" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$body")" || { echo "::error::curl failed for Q${id}"; fail=1; echo; return; }
  case "$(printf '%s' "$raw" | head -c 1)" in
    "{") echo "ERROR RESPONSE: $raw"; fail=1; echo "########## END Q${id} ##########"; echo; return ;;
  esac
  ans="$(printf '%s' "$raw" | python3 "$PARSER")"
  echo "$ans"
  if [ -z "${ans// /}" ]; then echo "::error::empty answer for Q${id}"; fail=1; fi
  echo "########## END Q${id} ##########"; echo
  sleep 2
}

# The verbatim BGCA question (multi-cert, multi-college), single-turn (widget path).
ask 1 '{"query":"A Boys & Girls Club in San Pedro/Wilmington offers teens these certificates and has Harbor College, El Camino, and Long Beach City nearby: OSHA-10; NCCER Carpentry Hand Tools; NCCER Commercial Carpentry; NCCER Commercial Electrician; NCCER Commercial Plumbing; NCCER Welding Beads and Fillets; NCCER Groove Welds; and an LA City AWS D1.1 welding cert. Which colleges should we approach to give these students college credit, and how do we start?","session_id":"preflight"}'

# LA Harbor specifically — should note it doesn't teach the trades and route nearby.
ask 2 '{"query":"Does Los Angeles Harbor College give college credit for NCCER carpentry or construction certifications?","session_id":"preflight"}'

# Geography — nearby teaching colleges.
ask 3 '{"query":"Which community colleges near San Pedro or Wilmington teach construction or welding courses?","session_id":"preflight"}'

# OSHA-10 specifically.
ask 4 '{"query":"Where can high-school students get college credit for an OSHA-10 certification?","session_id":"preflight"}'

# Statewide NCCER welding.
ask 5 '{"query":"Is there a statewide CPL standard for NCCER welding certifications?","session_id":"preflight"}'

# AWS D1.1 welding cert.
ask 6 '{"query":"Our teens earned an AWS D1.1 welding certificate with a practical test. Where can they get college credit for it?","session_id":"preflight"}'

# Comparison — which nearby college to start with.
ask 7 '{"query":"For construction and welding CPL, should we start with El Camino College or Long Beach City College?","session_id":"preflight"}'

# NCCER electrician.
ask 8 '{"query":"Which colleges could give credit for an NCCER Commercial Electrician certification?","session_id":"preflight"}'

# Process / general — how a community org gets CPL for its kids.
ask 9 '{"query":"How does a Boys & Girls Club start the process of getting our teens Credit for Prior Learning at a local community college?","session_id":"preflight"}'

# Multi-turn: welding, then narrow to Long Beach — tests the offerings fold.
ask 10 '{"query":"How about near Long Beach?","session_id":"preflight","history":[{"role":"user","content":"Which colleges give credit for welding certifications?"},{"role":"assistant","content":"Several California community colleges teach welding and some already award CPL for welding credentials. Which region should I focus on?"}]}'

if [ "$fail" -ne 0 ]; then echo "PREFLIGHT had request errors"; exit 1; fi
echo "PREFLIGHT COMPLETE (review the answers above)"
