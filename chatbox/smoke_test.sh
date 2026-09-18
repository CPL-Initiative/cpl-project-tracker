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

# ⚠ CPL_CHAT_URL MAY POINT AT A NON-PRODUCTION SLUG. The A/B harness
# (.github/workflows/cpl-chat-preview-ab.yml) runs this whole file twice, once
# against cpl-chat and once against cpl-chat-preview, so the answers can be
# compared before a production deploy.
URL="${CPL_CHAT_URL:-https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat}"
ANON="${CPL_CHAT_ANON:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM}"
# PostgREST base for the direct-table assertions (modes 12 and 15d).
#
# ⚠ THE SUFFIX STRIP IS EXACT, SO A PREVIEW SLUG SILENTLY BREAKS IT. `${URL%…}`
# removes `/functions/v1/cpl-chat` only when the URL ENDS with it. Point this at
# `…/functions/v1/cpl-chat-preview` and nothing is stripped, so REST_BASE becomes
# `…/functions/v1/cpl-chat-preview/rest/v1` — every direct-table assertion then
# fails against a URL that was never a PostgREST endpoint. In an A/B run that
# reads as "the preview regressed modes 12 and 15d", which is a manufactured
# difference: those two modes do not touch the edge function at all.
# So derive it from the PROJECT, and let a caller override it outright.
REST_BASE="${CPL_REST_BASE:-${URL%%/functions/*}/rest/v1}"

fail=0

# Write the SSE parser to a file ONCE. (Don't inline it as `python3 - <<'PY'`
# inside a function that also receives piped data — the heredoc becomes python's
# stdin and the piped SSE never reaches sys.stdin.read(), so every answer parses
# as empty. That bug made an earlier run report all 5 modes "empty".)
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
        except Exception:
            pass
sys.stdout.write("".join(out))
PY

extract() { python3 "$PARSER"; }   # reads the SSE from its (piped) stdin

LAST_ANSWER=""   # captured text of the most recent run(), for assertions

run() { # label  json-body
  local label="$1" body="$2"
  LAST_ANSWER=""
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
  LAST_ANSWER="$ans"
  echo "$ans"
  # ⚠ AN EMPTY ANSWER USED TO PRINT NO REASON, and the reason was in the stream
  # the whole time. cpl-chat emits `event: error` when the upstream stream fails
  # mid-answer (2026-09-11); the parser above only collects `event: text`, so
  # without this the run reports "empty" and the five downstream assertions each
  # report a regex that never had any text to match. Print the frame.
  if [ -z "${ans// /}" ]; then
    local why
    why="$(printf '%s' "$raw" | grep -A1 '^event: error' | grep '^data:' | head -1 | cut -c1-200)"
    echo "::error::empty answer for $label${why:+ — stream carried $why}"
    fail=1
  fi
  # EVERY MODE: the first sentence is the answer (Sam, 2026-09-18, reading v69's
  # Orange County answer: it opened "Great question to be asking before you
  # enroll" against sierra_guidance cafb92af). A remark about the question in
  # the first 160 characters fails the mode, whatever else the answer got right.
  if printf '%s' "$ans" | head -c 160 | grep -E -i -q '^[[:space:]]*(#+[[:space:]]*)?(\*\*)?(great|good|excellent|fantastic|wonderful|smart|fair|important|interesting|thoughtful|that.?s an? (great|good|fair|excellent)) (question|ask|thing to)'; then
    echo "::error::$label: answer should NOT match /opens with a remark about the question/ (sierra_guidance cafb92af — the first sentence is the answer)"; fail=1
  fi
  echo
  sleep 1   # stay well under the 20 req/min/IP rate limit
}
# The same match, on the HEAD of the answer only: the direct answer must come
# FIRST (Sam, 2026-09-18: "give the most direct answer to the direct question").
answer_head_must_match() { # [-i] chars regex label
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local chars="$1" re="$2" label="$3"
  if printf '%s' "$LAST_ANSWER" | head -c "$chars" | grep -E $flag -q -- "$re"; then
    echo "  [assert ok] $label matches /$re/ within the first $chars characters"
  else
    echo "::error::$label: expected answer to match /$re/ within the first $chars characters (the direct answer must lead)"; fail=1
  fi
}

# The NOT-match on the HEAD only: what must not come FIRST. 7c's first course
# has to be in the program the visitor is entering, and v70 opened twice on
# production with a CNA course — Golden West NURS G060N, then Santa Ana VHLTH
# 101 — the program that trains the credential the visitor already holds.
answer_head_must_not_match() { # [-i] chars regex label
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local chars="$1" re="$2" label="$3"
  if printf '%s' "$LAST_ANSWER" | head -c "$chars" | grep -E $flag -q -- "$re"; then
    echo "::error::$label: answer should NOT match /$re/ within the first $chars characters (regression)"; fail=1
  else
    echo "  [assert ok] $label does not match /$re/ within the first $chars characters"
  fi
}

# Content assertions on the LAST run()'s answer. Optional leading -i = ignore case.
answer_must_match() {     # [-i] regex label
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local re="$1" label="$2"
  if printf '%s' "$LAST_ANSWER" | grep -E $flag -q -- "$re"; then
    echo "  [assert ok] $label matches /$re/"
  else
    echo "::error::$label: expected answer to match /$re/"; fail=1
  fi
}
answer_must_not_match() { # [-i] regex label
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local re="$1" label="$2"
  if printf '%s' "$LAST_ANSWER" | grep -E $flag -q -- "$re"; then
    echo "::error::$label: answer should NOT match /$re/ (regression)"; fail=1
  else
    echo "  [assert ok] $label does not match /$re/"
  fi
}
# The same NOT-match, but a NEGATED phrase does not count. A framing guard asks
# "does the answer call this a failure / report an absent college as zero"; a
# correct answer often says the opposite in the guard's own words — 15a read
# "that's real work and a correct outcome, not a failure to act" and 15c read
# "I can't say they've awarded zero" (both red on 2026-09-11, run 34621090976,
# against a right answer). So the negated clause comes out FIRST and the regex
# runs on what is left. Two shapes only, on purpose: a negation word ahead of
# the phrase INSIDE THE SAME CLAUSE ("not a failure to", "isn't failing",
# "rather than poorly" — and, since 2026-09-12, "not a backlog it's failing to
# work through": the gap is bounded at 40 characters and cannot cross a comma,
# semicolon, colon, dash or period), and a "can't say / cannot claim / not
# report …" clause to the end of its CLAUSE — not its sentence, so "I cannot say
# more, but X awarded 0" still fails on X, and so does "not a problem, but
# colleges are failing to act". A bare "awarded zero" or "is failing" still
# fails. Privacy guards (14b) stay on the strict form — naming a contact inside
# a negation is still naming it.
#
# ⚠ THE FOURTH INSTANCE (2026-09-17, run 35279516157, S273): 15a went red on
#   "So don't read 1.2M as \"1.2M units of credit colleges are failing to award.\""
# — a NEGATED READING VERB followed by a quotation. Shape 1 could not reach it
# (47 characters from "don't" to "failing", against the 40-character bound) and
# shape 2 knew only the saying verbs. Shape 2 now also runs a "don't read /
# treat / interpret / see / take / count / mistake / describe …" clause to its
# clause end, which is the same rule as "can't say": what the answer tells the
# reader NOT to conclude is not the answer's claim. The bounds still hold — a
# colon, comma or dash ends the excuse, so "Don't read this as a compliment:
# colleges are failing to act" still fails on the second clause. And a period
# followed by a DIGIT is a decimal point, not a clause end — the recorded answer
# said "1.2M", and the first cut of this fix stopped stripping at the "1".
#
# ⚠ THE FIFTH (run 35281579500, the smoke on the PR carrying the fourth): 15c
#   went red on "That's different from saying they've 'awarded zero' — it means
#   the data simply isn't present". A CONTRAST PHRASE ("different from", "as
#   opposed to", "far from") plus a gerund does the negating, with no "not" in
#   sight. Those phrases join shape 2's negation words and the verbs carry their
#   -ing forms. Still bounded: "different from Mesa, which has awarded zero"
#   names no saying verb and still fails.
# tests/smoke_negation_stripper.test.js runs these two expressions through real
# sed against the recorded answers that went red (runs 34621090976, 34639257647,
# 35279516157 and 35281579500) and against controls that must stay red.
answer_must_not_match_unnegated() { # [-i] regex label
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local re="$1" label="$2" stripped
  stripped="$(printf '%s' "$LAST_ANSWER" | sed -E \
    -e "s/\\b(not|never|no|nor|isn.?t|aren.?t|wasn.?t|weren.?t|rather than|instead of) ([^.,;:—–]|\\.[0-9]){0,40}($re)//Ig" \
    -e "s/\\b(can.?t|cannot|can not|don.?t|do not|won.?t|not|never|different from|as opposed to|far from) (say|saying|claim|claiming|report|reporting|confirm|confirming|state|stating|tell you|telling you|read|reading|treat|treating|interpret|interpreting|see|seeing|take|taking|count|counting|mistake|mistaking|describe|describing)\\b([^.,;:—–]|\\.[0-9])*//Ig")"
  if printf '%s' "$stripped" | grep -E $flag -q -- "$re"; then
    echo "::error::$label: answer should NOT match /$re/ outside a negation (regression)"; fail=1
  else
    echo "  [assert ok] $label does not match /$re/ outside a negation"
  fi
}

# NAME AT LEAST N OF A SET — a THRESHOLD, not a named member. Mode 16a used to
# require the LACCD answer to say "pierce" AND "valley" specifically, and it went
# red twice on 2026-09-09 (runs 153/154) on DIFFERENT subsets while both answers
# were correct: asked what a district should DO, Sierra names the members her
# advice bears on, and which of the nine that is is EMPHASIS, not capability.
# This file's own header already warns what a prose grep costs, and mode 7 paid
# it for four handoffs before 7r moved the property to retrieval.
#
# ⚠ The floor is what makes it a guard: naming NONE of the nine is the real
# regression (the roster did not reach her and she fell back to the caveat), and
# that still fails loudly. Pass patterns, not a single alternation, so the
# failure message can say WHICH ones were missing.
answer_must_name_at_least() { # [-i] count label pattern...
  local flag=""; if [ "$1" = "-i" ]; then flag="-i"; shift; fi
  local need="$1" label="$2"; shift 2
  local total=$# hits=0 found="" missed="" p
  for p in "$@"; do
    if printf '%s' "$LAST_ANSWER" | grep -E $flag -q -- "$p"; then
      hits=$((hits+1)); found="$found /$p/"
    else
      missed="$missed /$p/"
    fi
  done
  if [ "$hits" -ge "$need" ]; then
    echo "  [assert ok] $label — named $hits of $total (needed $need):$found"
  else
    echo "::error::$label: expected answer to match at least $need of $total name patterns — named only $hits. Not named:$missed"; fail=1
  fi
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

# REGRESSION GUARD (v18): a verbose place-only refinement ("How about West LA? I
# live near there.") whose topic ("real estate") was set TWO turns earlier must
# still surface West LA's local "CA Real Estate Salesperson" exhibit — not fall
# back to its dental/health profile and wrongly say it has no real estate.
# answer_must / answer_must_not assert on the captured text of the LAST run.
run "6 deep multi-turn fold (West LA real estate)" \
  '{"query":"How about West LA? I live near there.","session_id":"smoke-ci","history":[{"role":"user","content":"Which colleges give credit for a real estate license?"},{"role":"assistant","content":"There are statewide options plus several local college exhibits. Which part of California are you in, or do you have a specific college in mind?"},{"role":"user","content":"Southern CA in the LA area"},{"role":"assistant","content":"Here are the LA-area colleges with real estate CPL exhibits, including Los Angeles Pierce College."}]}'
answer_must_match -i "real estate" "6 West LA"
# The exact wrong-conclusion phrasings from the pre-v18 bug (targeted to avoid
# false-positives on a correct, nuanced answer):
answer_must_not_match -i "focused on dental|don.?t see a real estate|no real estate( license)? exhibit|does not (currently )?have( any)? real estate" "6 West LA"

# OFFERINGS / adoption reasoning (v20 — the COCI course catalog). A college that
# hasn't ARTICULATED a credential but whose neighbors TEACH the discipline: LA
# Harbor doesn't teach the construction trades; El Camino / LA Trade-Tech / Rio
# Hondo / Cerritos / Compton (LA County) do. The bot should route to a nearby
# teaching college rather than dead-end at "no exhibit". (Boys & Girls Club case.)
# SINGLE-turn (no history) = the production-widget path AND it bypasses the
# multi-turn "ask a focusing follow-up first" gate, so the routing is named
# directly rather than offered ("want me to show nearby colleges?").
#
# NOTE ON WHAT THIS MODE CAN AND CANNOT PROVE (2026-08-07). These assertions run
# against MODEL PROSE, so they carry inherent flake — they can go red on a
# rephrasing and green on genuinely broken retrieval. The deterministic guard for
# the ranking underneath is tests/sierra_geo_ranking.test.js, which asserts the
# ORDERED COLLEGE SET both context builders emit (methodology-assert-what-
# retrieval-returns). Treat a red here as "look at the ordering", not as proof.
#
# The root cause found on 2026-08-07 was NOT the ranking but the DETECTION: the
# home college never resolved (the word "angeles" matched 9 colleges and returned
# before "harbor", which matches 1), so askedGeo was null and nothing could rank
# by proximity. Hence the added assertion that LA Harbor is named at all — if
# detection regresses, that is the line that goes red first.
# SAM'S DECISION, 2026-08-07 (Session 126) — this mode asserts a THREE-PART answer,
# because the two candidate behaviours were BOTH defensible and he picked both, in
# order. #1027's anti-poaching rule had made Sierra stop after part 2:
#   (1) the HOST — LA Harbor, named and affirmed, invited to adopt;
#   (2) PRECEDENT — the colleges that have ACTUALLY articulated NCCER (Norco,
#       Barstow), cited as proof the adoption is workable;
#   (3) the NEAREST REAL ROUTE — LA-basin colleges that TEACH construction
#       (El Camino / Trade-Tech / Rio Hondo / …), even though NO LA-county college
#       has a construction exhibit at all.
# Part 3 is the one that regressed and the one that matters most to a seeker: it is
# the only part that gives them somewhere local to go this month. Do NOT green this
# by deleting an assertion — the three parts ARE the product decision.
#
# ⚠ PART 3 MOVED, IT WAS NOT DROPPED (2026-08-23). Its prose grep had been red
# since Session 125 — four handoffs record it failing while Sierra answered well
# — so it is now asserted at RETRIEVAL in mode 7r below, and the wording is left
# to mode 8. The product decision is unchanged; only the instrument is.
run "7 offerings adoption (LA Harbor NCCER carpentry)" \
  '{"query":"Does Los Angeles Harbor College give credit for NCCER carpentry or construction certifications?","session_id":"smoke-ci"}'
answer_must_match -i "Harbor" "7 home college detected (LA Harbor named)"
answer_must_match -i "Norco|Barstow" "7 adoption precedent (college that articulated it)"
answer_must_match -i "construction|carpentry|trades|OSHA" "7 on-topic"

# ── 7r. PART 3, ASSERTED IN DATA RATHER THAN IN PROSE (2026-08-23) ────────────
# What used to sit here was
#
#     answer_must_match -i "El Camino|Long Beach|Trade.?Tech|Rio Hondo|Compton|Cerritos"
#
# and it is the assertion this file's own header warns about: it went red on
# 2026-08-22 (run 113) while Sierra was working correctly. She answered with
# Norco / Bakersfield / Barstow / Santa Ana — colleges that have ARTICULATED
# NCCER — instead of leading with LA-basin colleges that merely TEACH the trades.
# That is a choice of EMPHASIS between two true things, not a capability loss,
# and a CI job that goes red on emphasis gets muted.
#
# Deleting it was not an option either: part 3 is Sam's 2026-08-07 product
# decision and the only part that gives a seeker somewhere local to go. So the
# property is now asserted where it is deterministic — at RETRIEVAL. The question
# this answers is the honest one: did the nearby teaching colleges reach Sierra
# at all? What she then chooses to foreground is left to mode 8, which asks "who
# teaches construction" directly and greps the prose for it.
#
# ⚠ THE TSQUERY BELOW IS A TRANSCRIPTION, and transcriptions drift. It is what
# extractTopicKeywords() + expandWithSynonyms() actually produce for mode 7's
# query — the raw tokens [los, angeles, harbor, nccer, carpentry, construction]
# plus the nccer/carpentry/construction synonym families. Measured 2026-08-23:
# 150 rows / 78 colleges, of which FIVE of the six LA-basin colleges come back
# (Cerritos, Compton, El Camino, Long Beach City, Rio Hondo; Trade-Tech does not).
# tests/sierra_offerings_retrieval.test.js re-derives the term set from
# index.ts and fails if this literal stops matching it.
#
# ⚠ AND NOTE THE 150: that is the function's own result_limit and the query fills
# it exactly, so truncation is live here. The ORDERING underneath is guarded by
# tests/sierra_geo_ranking.test.js, not by this.
OFFERINGS_TSQ='los:* | angeles:* | harbor:* | nccer:* | carpentry:* | construction:* | welding:* | electrician:* | plumbing:* | carpenter:* | woodworking:*'
offerings_call() { # tsquery
  curl -sS --max-time 45 -X POST "$REST_BASE/rpc/search_college_offerings" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$(printf '{"search_query":%s,"college_filter":null,"result_limit":150}' \
          "$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")"
}
echo "===================================================================="
echo "MODE: 7r offerings retrieval reaches the LA-basin construction teachers"
# NEGATIVE CONTROL FIRST. Everything below is "did these names come back?", which
# a broken call answers with an empty body just as convincingly as a real miss.
# A term that matches nothing must come back empty — if THIS returns colleges,
# the RPC is matching indiscriminately and the positive assertion proves nothing.
neg="$(offerings_call 'zzqqxxwwvv:*')"
case "$neg" in
  "[]") echo "  [assert ok] negative control: a nonsense term returns no colleges" ;;
  *) echo "::error::7r negative control FAILED — a nonsense term returned $(printf '%s' "$neg" | head -c 160). The assertions below cannot be trusted."; fail=1 ;;
esac
rows="$(offerings_call "$OFFERINGS_TSQ")"
case "$rows" in
  "[{"*) echo "  [assert ok] positive control: the offerings RPC returned rows" ;;
  *) echo "::error::7r positive control FAILED — search_college_offerings returned $(printf '%s' "$rows" | head -c 200)"; fail=1 ;;
esac
# Count DISTINCT LA-basin teaching colleges in the result. Deliberately a
# THRESHOLD, not a named college: mode 14 learned the hard way that an assertion
# pinned to a value which can leave the data stops being a guard the moment it
# does, and a college can leave the course catalog on any refresh. Three of six
# still fails loudly if detection or truncation regresses (five come back today).
la_hits=$(printf '%s' "$rows" | python3 -c '
import json, sys
BASIN = ["El Camino College", "Long Beach City College", "Los Angeles Trade-Technical College",
         "Rio Hondo College", "Compton College", "Cerritos College"]
try:
    rows = json.loads(sys.stdin.read())
    names = {r.get("college") for r in rows} if isinstance(rows, list) else set()
except Exception:
    names = set()
print(len([c for c in BASIN if c in names]))
')
if [ "${la_hits:-0}" -ge 3 ]; then
  echo "  [assert ok] 7r ⭐ $la_hits of 6 LA-basin construction teachers reached Sierra's offerings context"
else
  echo "::error::7r ⭐ only ${la_hits:-0} of 6 LA-basin construction teachers reached the offerings context — part 3 has no data to stand on (check detection + the 150-row limit)"; fail=1
fi

# ── MODE 7p: the PROGRAM route (what a college AWARDS) ───────────────────────
# Sierra gained a third view of a college on 2026-09-17 — what it AWARDS, from
# coci_college_programs. 7r above covers what a college TEACHES; neither covers
# this, and the two answer different student questions.
#
# ⚠ WHY THE NOISE ASSERTION IS THE POINT. This route's failure mode is not an
# empty answer, it is a FLUENT WRONG ONE, and it has two shapes:
#
#   1. A single-token synonym. "practical" is 9 characters so it takes the
#      stemmed-prefix path, `practical:*` becomes `'practic':*`, and that
#      prefix-matched Architectural PRACTICE, Teaching PRACTICES and PRACTICUM in
#      Machine Shorthand — 30 of 36 added title rows were not nursing. The fix
#      was phrase terms (phraseto_tsquery keeps adjacency).
#   2. A phrase reaching a builder that cannot express one.
#      to_tsquery('english', 'lvn:* | practical nursing:*') is a hard 42601, so
#      an unguarded phrase makes search_college_offerings return NULL. Sierra
#      then answers fluently with no course-catalog section at all — a silent
#      degradation that neither the health probe nor a browser can see, because
#      nothing errors and nothing looks broken.
#
# So this mode asserts REACH and CLEANLINESS together. Either alone passes on a
# broken build.
#
# ⚠ The term list is a TRANSCRIPTION of what expandWithSynonyms produces for an
# LVN question, and transcriptions drift silently —
# tests/sierra_program_search.test.js block 10 re-derives it from index.ts and
# fails the moment they part. Same guard mode 7r's literal has.
PROGRAMS_TERMS='["lvn","practical nursing","vocational nursing"]'
programs_call() { # json array of terms
  curl -sS --max-time 45 -X POST "$REST_BASE/rpc/search_college_programs" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$(printf '{"search_terms":%s,"college_filter":null,"result_limit":600}' "$1")"
}
echo "===================================================================="
echo "MODE: 7p program retrieval answers the LVN question cleanly"
negp="$(programs_call '["zzq qqz"]')"
case "$negp" in
  "[]") echo "  [assert ok] negative control: a nonsense PHRASE returns no programs" ;;
  *) echo "::error::7p negative control FAILED — a nonsense phrase returned $(printf '%s' "$negp" | head -c 160). The assertions below cannot be trusted."; fail=1 ;;
esac
prows="$(programs_call "$PROGRAMS_TERMS")"
case "$prows" in
  "[{"*) echo "  [assert ok] positive control: the programs RPC returned rows" ;;
  *) echo "::error::7p positive control FAILED — search_college_programs returned $(printf '%s' "$prows" | head -c 200)"; fail=1 ;;
esac
pstat=$(printf '%s' "$prows" | python3 -c '
import json, re, sys
try:
    rows = json.loads(sys.stdin.read())
    rows = rows if isinstance(rows, list) else []
except Exception:
    rows = []
colleges = {r.get("college") for r in rows if r.get("college")}
NURSING = re.compile(r"practical|vocational|lvn|lpn|nurs", re.I)
noise = [r.get("program_title") for r in rows if not NURSING.search(r.get("program_title") or "")]
print(len(colleges), len(noise), (noise[0] or "")[:60].replace("|", "/") if noise else "-", sep="|")
')
pcolleges=$(printf '%s' "$pstat" | cut -d'|' -f1)
pnoise=$(printf '%s' "$pstat" | cut -d'|' -f2)
pfirst=$(printf '%s' "$pstat" | cut -d'|' -f3)
# A THRESHOLD, not a count: 56 colleges measured 2026-09-17, and a college can
# leave the program catalog on any COCI refresh. 40 still fails loudly if the
# phrase branch, the lvn family or the CIP load regresses (28 was the before).
if [ "${pcolleges:-0}" -ge 40 ]; then
  echo "  [assert ok] 7p ⭐ the LVN question reached $pcolleges colleges (56 measured; 28 before phrase terms)"
else
  echo "::error::7p ⭐ the LVN question reached only ${pcolleges:-0} colleges — expected 40+. Check the phrase branch (phraseto_tsquery), the lvn synonym family, and that cip_code is loaded."; fail=1
fi
if [ "${pnoise:-1}" -eq 0 ]; then
  echo "  [assert ok] 7p ⭐ every program returned is nursing-worded — adjacency held"
else
  echo "::error::7p ⭐ ${pnoise} non-nursing program(s) came back, e.g. '${pfirst}'. A phrase has degraded to loose token matching — `practical:*` stems to `'practic':*` and prefix-matches PRACTICE/PRACTICUM."; fail=1
fi
# ⚠ COST IS PART OF CORRECTNESS ON THIS ROUTE (2026-09-17, S273). The first
# preview A/B run of the edge function passed every mode while this RPC timed
# out on 3 of its questions: the function awaits every retrieval route in one
# Promise.all, so a slow route delays the whole answer, and a timed-out one
# (8 s through PostgREST) drops the Program Catalog section silently — the
# answer reads fluent and complete. The per-term DF scans were the cause
# (19.8 s for a 30-term expansion); the one-pass rewrite measures 1.2 s for
# these three terms. This call runs on the ANON key, whose statement timeout is
# 3 s, so 4 s here fails loudly before either timeout does.
psecs=$(curl -sS --max-time 45 -o /dev/null -w '%{time_total}' -X POST "$REST_BASE/rpc/search_college_programs" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "$(printf '{"search_terms":%s,"college_filter":null,"result_limit":600}' "$PROGRAMS_TERMS")" 2>/dev/null || echo 99)
if awk -v s="${psecs:-99}" 'BEGIN { exit !(s + 0 < 4.0) }'; then
  echo "  [assert ok] 7p ⭐ the LVN question answered in ${psecs}s (1.2 s measured; the anon key times out at 3 s)"
else
  echo "::error::7p ⭐ the LVN question took ${psecs}s — over 4 s, the route is back near a statement timeout. Sierra's whole answer waits on this RPC, and a timeout drops the Program Catalog section silently. Check that search_college_programs still computes its vectors ONCE per call (verify Part D)."; fail=1
fi

# ── MODE 7c: a PLACE anchors both catalog routes (2026-09-18, S273) ───────────
# Sam's test question on v67 — "I have a cna cert and I want to go to a college
# in orange county. What CNA courses at the colleges match LVN courses…" —
# resolved "orange" to Orange Coast College and NOCE, and listed LVN programs in
# Sacramento, Butte, Humboldt, Madera and Siskiyou counties: askedGeo came only
# from a resolved college, so a county in the question anchored nothing, and
# both catalog lists fell back to volume order. v68 anchors on the county
# INSIDE the RPCs (anchor_county / anchor_region, so result_limit can never cut
# the local colleges), gives `cna` a synonym family, and lets the offerings
# builder express a phrase (`nurse:* <-> assistant:*`).
#
# Three assertions, on RETRIEVAL rather than prose except the last:
#   · the programs RPC with anchor_county=Orange LEADS with Orange County rows,
#     contiguously — a mixed run means the anchor is a tiebreak, not a key;
#   · the offerings RPC with the phrase query reaches the Licensed Vocational
#     Nursing TOP (44 colleges measured; 0 before, because every phrase was
#     dropped) and leads with Orange County;
#   · the answer to the county question names Orange County and a college from
#     the anchored sets.
#
# ⚠ OC_TERMS and OC_OFFERINGS_TSQ are TRANSCRIPTIONS of what index.ts builds for
# OC_QUESTION once the place is stripped; tests/sierra_place_anchor.test.js
# re-derives both from index.ts and fails when they part. Same guard 7p and 7r
# carry.
OC_QUESTION='I have a CNA certificate and I want to go to a college in Orange County. What CNA courses match LVN courses so I can ask for credit?'
OC_TERMS='["cna","lvn","nurse assistant","certified nurse assistant","practical nursing","vocational nursing"]'
OC_OFFERINGS_TSQ='cna:* | lvn:* | (nurse:* <-> assistant:*) | (certified:* <-> nurse:* <-> assistant:*) | (practical:* <-> nursing:*) | (vocational:* <-> nursing:*)'
programs_call_anchored() { # json array of terms, county
  curl -sS --max-time 45 -X POST "$REST_BASE/rpc/search_college_programs" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$(printf '{"search_terms":%s,"college_filter":null,"result_limit":150,"anchor_county":"%s","anchor_region":null}' "$1" "$2")"
}
offerings_call_anchored() { # tsquery, county
  curl -sS --max-time 45 -X POST "$REST_BASE/rpc/search_college_offerings" \
    -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -d "$(printf '{"search_query":%s,"college_filter":null,"result_limit":150,"anchor_county":"%s","anchor_region":null}' \
          "$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" "$2")"
}
# Reads a JSON row array on stdin; prints "<first county>|<n in county>|<contiguous 1/0>|<n rows>|<n with the given top_title>"
anchor_stat() { # county top_title
  python3 -c '
import json, sys
county, top = sys.argv[1], sys.argv[2]
try:
    rows = json.loads(sys.stdin.read())
    rows = rows if isinstance(rows, list) else []
except Exception:
    rows = []
counties = [r.get("county") for r in rows]
n = counties.count(county)
last = max((i for i, c in enumerate(counties) if c == county), default=-1)
contiguous = 1 if n and all(c == county for c in counties[:last + 1]) else 0
tops = sum(1 for r in rows if r.get("top_title") == top)
print((counties[0] or "-") if counties else "-", n, contiguous, len(rows), tops, sep="|")
' "$1" "$2"
}
echo "===================================================================="
echo "MODE: 7c a place anchors both catalog routes (Orange County, CNA to LVN)"
pstat=$(programs_call_anchored "$OC_TERMS" "Orange" | anchor_stat "Orange" "-")
pfirst=$(printf '%s' "$pstat" | cut -d'|' -f1); pn=$(printf '%s' "$pstat" | cut -d'|' -f2)
pcontig=$(printf '%s' "$pstat" | cut -d'|' -f3); prows=$(printf '%s' "$pstat" | cut -d'|' -f4)
if [ "${prows:-0}" -gt 0 ]; then
  echo "  [assert ok] positive control: the anchored programs RPC returned $prows rows"
else
  echo "::error::7c positive control FAILED — search_college_programs returned no rows for $OC_TERMS with anchor_county Orange (is the anchored signature applied? verify Part E)"; fail=1
fi
# A THRESHOLD, not a count: 16 Orange County rows measured 2026-09-18 over five
# colleges (Saddleback, Golden West, Cypress, Santa Ana, Santiago Canyon).
if [ "$pfirst" = "Orange" ] && [ "${pn:-0}" -ge 5 ] && [ "${pcontig:-0}" -eq 1 ]; then
  echo "  [assert ok] 7c ⭐ the programs RPC leads with $pn contiguous Orange County rows (16 measured)"
else
  echo "::error::7c ⭐ the programs RPC did not lead with Orange County (first=$pfirst, orange rows=$pn, contiguous=$pcontig). The anchor must be the LEADING order key inside the RPC — a county question's own colleges were at positions 46-120 on v67."; fail=1
fi
ostat=$(offerings_call_anchored "$OC_OFFERINGS_TSQ" "Orange" | anchor_stat "Orange" "Licensed Vocational Nursing")
ofirst=$(printf '%s' "$ostat" | cut -d'|' -f1); on=$(printf '%s' "$ostat" | cut -d'|' -f2)
ocontig=$(printf '%s' "$ostat" | cut -d'|' -f3); orows=$(printf '%s' "$ostat" | cut -d'|' -f4); ovn=$(printf '%s' "$ostat" | cut -d'|' -f5)
if [ "${orows:-0}" -gt 0 ]; then
  echo "  [assert ok] positive control: the anchored offerings RPC returned $orows rows"
else
  echo "::error::7c positive control FAILED — search_college_offerings returned no rows for the phrase query (a phrase reaching a builder that cannot parse it returns NULL, and Sierra answers with no catalog section)"; fail=1
fi
if [ "$ofirst" = "Orange" ] && [ "${on:-0}" -ge 3 ] && [ "${ocontig:-0}" -eq 1 ]; then
  echo "  [assert ok] 7c ⭐ the offerings RPC leads with $on contiguous Orange County rows (6 measured)"
else
  echo "::error::7c ⭐ the offerings RPC did not lead with Orange County (first=$ofirst, orange rows=$on, contiguous=$ocontig)."; fail=1
fi
# 44 Licensed Vocational Nursing rows measured; 20 still fails loudly if the
# phrase form regresses to single tokens (then this TOP is reached only where a
# course title spells "LVN" — the RN bridges — and the count falls to 0).
if [ "${ovn:-0}" -ge 20 ]; then
  echo "  [assert ok] 7c ⭐ the phrase query reached $ovn Licensed Vocational Nursing rows (44 measured; 0 before phrases)"
else
  echo "::error::7c ⭐ the phrase query reached only ${ovn:-0} Licensed Vocational Nursing rows — the <-> phrase is being dropped or rebound (check tsQueryFromTerms and that the RPC still parses with to_tsquery)."; fail=1
fi
run "7c place anchor (Orange County, CNA to LVN)" \
  "$(printf '{"query":"%s","session_id":"smoke-ci","history":[]}' "$OC_QUESTION")"
answer_must_match -i "orange county" "7c names the place the visitor named"
# The anchored sets: the five Orange County colleges with a nursing-assistant or
# LVN-bridge program, and the nearest Vocational Nursing programs (Los Angeles
# and Inland Empire). Any one of them is a real, retrieved college; on v67 the
# answer named none of them and guessed at Santa Ana "based on typical OC
# nursing offerings".
answer_must_match -i "saddleback|golden west|cypress|santa ana|santiago canyon|long beach|rio hondo|citrus|chaffey|riverside city|mt\. san antonio|pasadena|antelope valley|west los angeles|los angeles mission|crafton hills|mt\. san jacinto" "7c names a college from the anchored sets"
# v69 (2026-09-18, S274). Sam's bar for this question is a COURSE-LEVEL answer —
# "compare CNA courses to LVN courses so the user could ask for credit" — at a
# college that has not granted it. So the answer must name a Vocational Nursing
# course from the PROSPECTIVE CREDIT block (the full course lists at the three
# nearest LVN programs; Orange County has none, so its neighbors: Los Angeles,
# Inland Empire, San Diego) and frame the match as a request for review. The
# alternation carries the entry-level course at every college the block can pick
# under the neighbor band (course_count order) plus the two Los Angeles programs
# the older assertion named, so a catalog refresh that reorders the picks is a
# loud red here rather than a silent miss. Reads for the SHAPE Sam asked for.
answer_must_match -i "NURS[ -]?(102|125)|VN[ -]?(8|10|103|215|220|61|061)\b|VOC[ -]?VN10[01]|NURVN[ -]?(403|414)|VNRS[ -]?150|Fundamentals of (Vocational )?Nursing|Vocational Nursing Foundations|Transition to Vocational Nursing|Vocational Nursing I\b" "7c ⭐ names a Vocational Nursing course from the prospective course lists (Sam's bar: a course-level answer)"
answer_head_must_match -i 400 "NURS[ -]?(102|125)|VN[ -]?(8|10|103|215|220|61|061)\b|VOC[ -]?VN10[01]|NURVN[ -]?(403|414)|VNRS[ -]?150|Fundamentals of (Vocational )?Nursing|Vocational Nursing Foundations|Transition to Vocational Nursing|Vocational Nursing I\b" "7c ⭐ leads with the course-level answer in the FIRST SENTENCE — the direct answer first, the limits and precedents after (Sam, 2026-09-18; 800 characters let v70's CNA opener through, VN 220 at 854)"
answer_head_must_not_match -i 300 "VHLTH[ -]?10[1-8]\b|VMED[ -]?(10|11|70|71)\b|NURS[ -]?G06[01]|CNA[ -]?42[2-7]|\bHS[ -]?5[01]\b|NHSN[ -]?5[01]\b|NRS[ -]?10[134]\b|NURAST[ -]?60|NURS[ -]?103\b" "7c ⭐ the first course named is in the target program — no CNA course code in the first 300 characters (v70 opened with Golden West NURS G060N, then Santa Ana VHLTH 101; the CNA program is BACKGROUND)"
answer_must_not_match -i "no orange county (community )?colleges? (currently )?(teach|teaches|offers?|runs?|has an? (lvn|vocational nursing)|have an? (lvn|vocational nursing))|none of the orange county colleges (currently )?(teach|offer|have|has|run)" "7c ⭐ never states a catalog absence as a fact about Orange County (Sam, 2026-09-18: flat wrong — say what the catalog shows and name the bridges)"
answer_must_match -i "chaffey|NURVN[ -]?414|acute care nursing assistant" "7c ⭐ cites the CNA-to-LVN precedent (Chaffey NURVN 414) rather than saying no college has done it"
answer_must_match -i "ask|request|review" "7c ⭐ frames the match as a request for review, never a determination"

# Broad "who teaches this" — the catalog should surface colleges that TEACH
# construction/carpentry (not only those with an existing exhibit).
run "8 offerings broad (who teaches construction)" \
  '{"query":"Which community colleges teach construction or carpentry courses that could lead to NCCER credit?","session_id":"smoke-ci","history":[]}'
answer_must_match -i "carpentry|construction" "8 on-topic offerings"

# v21 regression guard: the big multi-cert BGCA question names MULTIPLE colleges,
# so only ONE is detected (LBCC) — El Camino must still surface as a nearby teacher
# (it teaches Construction Crafts 25 / Welding 20 / Carpentry 4). Pre-v21 the noisy
# query truncated El Camino out of the 80-row offerings + the model wrongly said it
# "is not listed as teaching these trades." v21 raised the cap to 150 + forbids
# asserting absence from the top-N list. Assert El Camino is named + NOT dismissed.
run "9 offerings multi-cert (El Camino not truncated)" \
  '{"query":"A Boys & Girls Club near San Pedro offers NCCER carpentry, electrician, plumbing, welding and OSHA-10 to teens, with Harbor College, El Camino, and Long Beach City nearby. Which colleges should we approach for college credit?","session_id":"smoke-ci"}'
answer_must_match -i "El Camino" "9 El Camino surfaced"
answer_must_not_match -i "El Camino.{0,40}(not listed|does not teach|doesn.t teach|not.{0,10}teaching)" "9 El Camino not falsely dismissed"

# AUDIENCE-aware voice (v22): the pages send the visitor's self-selected primary
# population as `audience`. Assert the student mode runs + stays on-topic (a
# stochastic model can't be robustly asserted jargon-free — the tone rule is
# reviewed by eye in the log), and that an unknown key is ignored, not a 500.
run "10 audience student (EMT)" \
  '{"query":"I have an EMT certification. Can I get college credit for it?","session_id":"smoke-ci","history":[],"audience":"student"}'
answer_must_match -i "emt|emergency|credit" "10 on-topic"

run "11 audience unknown key (ignored, not an error)" \
  '{"query":"What is Credit for Prior Learning?","session_id":"smoke-ci","audience":"martian"}'

# CPR regression guard (Session 93 — the rec_count-ranking miss, 2026-07-01):
# every standalone CPR/First-Aid exhibit has rec_count=1, so the old
# `ORDER BY rec_count DESC` in search_exhibits_by_topic cut ALL of them whenever
# a noisy query matched more rows than the 200 limit (Sam's BGCA session surfaced
# only Cabrillo's rec_count=3 EMT+CPR bundle and nothing else). The RPC now ranks
# by ts_rank_cd over a title-weighted vector, so this question must surface the
# single-rec adopters (Modesto HE 100/101 + EMS 350, Las Positas, Cypress, CCSF).
# Single-turn (no history) = the production-widget path; lists matches directly.
run "13 topic CPR (single-rec exhibits must surface)" \
  '{"query":"I think First Aid and CPR or just the CPR Lifesaving certs are articulated by some colleges in MAP, can you check again?","session_id":"smoke-ci"}'
answer_must_match -i "Modesto|Las Positas|Cypress|San Francisco|Cabrillo" "13 CPR adopter college named"
answer_must_match -i "first aid|cpr" "13 on-topic"

# External contacts gate (v27 — the vendor-embed privacy variant). FAIL-OPEN:
# a default request keeps the CPL-contact line in the college context (COBI /
# the production widget unchanged); ctx:"external" suppresses it, so the model
# CANNOT name the coordinator (Sierra answers only from its sources). Anchor =
# San Diego Mesa College, which carries a populated cpl_coordinator; its landing
# URL is /SDMESA so the negative grep can't false-fail on the URL.
#
# ⚠ DO NOT NAME THE PERSON HERE. This pair hardcoded "Monica Romero" and went
# red on 2026-08-14 when Mesa's coordinator became Rachel Russell — the roster
# syncs DAILY, so Sierra was right and the TEST was stale. A CI job must not go
# red because a college hired someone.
#
# The worse half was silent: 14b asserted the answer did NOT contain "romero",
# and once Romero left the data that assertion COULD NO LONGER FAIL. The privacy
# guard would have passed while suppression was wide open. An assertion pinned to
# a value that can leave the data stops being a guard the moment it does.
#
# So both directions now anchor on the SHAPE — an sdccd.edu mailbox — and 14b
# reuses whatever 14a actually surfaced, which keeps the negative tied to the
# live contact and able to fail again.
run "14a contacts default (San Diego Mesa — contact included)" \
  '{"query":"Who is the CPL contact at San Diego Mesa College?","session_id":"smoke-ci"}'
answer_must_match -i "[a-z0-9._%+-]+@sdccd\.edu" "14a default surfaces the CPL contact"

# Capture whoever that turned out to be. If 14a failed there is nothing to carry
# forward, and an empty regex would match everything and turn 14b into a pass —
# the exact vacuum this rewrite exists to close — so fall back to the domain.
MESA_CONTACT="$(printf '%s' "$LAST_ANSWER" | grep -Eio '[a-z0-9._%+-]+@sdccd\.edu' | head -1)"
if [ -z "$MESA_CONTACT" ]; then
  echo "::warning::14a surfaced no sdccd.edu mailbox — 14b falls back to the domain"
  MESA_CONTACT="@sdccd.edu"
fi

run "14b contacts gated (ctx external — contact suppressed)" \
  '{"query":"Who is the CPL contact at San Diego Mesa College?","session_id":"smoke-ci","ctx":"external"}'
answer_must_not_match -i "$MESA_CONTACT" "14b external ctx never names the contact"
# Belt and braces: no Mesa mailbox of ANY kind may appear under an external ctx,
# so suppression cannot be judged clean merely because the coordinator changed.
answer_must_not_match -i "[a-z0-9._%+-]+@sdccd\.edu" "14b external ctx names no sdccd.edu mailbox at all"

# ── 15. Credit disposition (v36) — what colleges have ACTED on ───────────────
# Sierra could always say what credit EXISTS; these modes cover what has been
# DONE with it. Assertions are deliberately loose on wording (a stochastic model
# won't reproduce a phrase) and tight on the two things that are product
# decisions: the numbers appear, and they are framed as opportunity.
run "15a credit disposition statewide" \
  '{"query":"How much CPL credit has been recommended but not yet awarded across the system?","session_id":"smoke-ci"}'
# A real figure, not a hedge. Any 4+ digit comma-grouped number.
answer_must_match "[0-9],[0-9]{3}" "15a states an actual credit figure"
# The ceiling caveat must ride along with the total — otherwise the number reads
# as a debt, which is the single most likely way this feature misleads.
answer_must_match -i "not applicable|ceiling|correctly (ruled|declined|closed)|doesn.?t fit|not every" \
  "15a carries the Not-Applicable ceiling caveat"
# Framing guard: never a report card. Negation-aware — "not a failure to act"
# is the caveat doing its job, not a regression.
answer_must_not_match_unnegated -i "failing|failure to|worst|poorly|negligent|shameful" \
  "15a does not frame the backlog as failure"

run "15b credit disposition per-college (San Diego Mesa)" \
  '{"query":"How is San Diego Mesa College doing on awarding CPL credit?","session_id":"smoke-ci"}'
answer_must_match -i "mesa" "15b names the college asked about"
answer_must_match "[0-9],[0-9]{3}" "15b states an actual per-college figure"
# The lead is the already-articulated block — everything built, nobody acted.
answer_must_match -i "articulat" "15b surfaces the already-articulated opportunity"
# Same guard as 15a, so the same helper and the same vocabulary. It was left on
# the plain matcher when #1566 taught 15a and 15c to be negation-aware — the two
# modes that had gone red — and went red itself on 2026-09-17 against a correct
# answer reading "…not a backlog it's failing to clear", the SAME sentence shape
# as the 15a failure #1566 was written for. Fix the class, not the instances.
answer_must_not_match_unnegated -i "failing|failure to|worst|poorly|negligent|shameful" \
  "15b frames it as opportunity"

# A college genuinely absent from the credit-disposition dataset must NOT be
# rendered as zero. Calbright has no row in map_college_credit_summary.
#
# WHAT THIS MODE CAN AND CANNOT PROVE. It is a NEGATIVE assertion, so it passes
# both when Sierra behaves and when she simply never goes near the subject — on
# the 2026-08-09 run she answered from the EXHIBIT data instead ("0 credit
# recommendations and 0 exhibits", which is true: Calbright's profile really does
# carry total_exhibits 0 / total_credit_recs 0), so the check never fired. Do not
# read a green here as proof the absence/zero distinction held.
#
# The exercised guard for that property is the unit test — see
# tests/sierra_credit_disposition.test.js §4, which asserts the built context
# carries the explicit "not in this dataset" note and no zero.
#
# DELIBERATELY NARROW, and the reason is worth recording — a wider version was
# written and then reverted the same day (2026-08-09). Measured: of the 17
# institutions absent from map_college_credit_summary, exactly ONE has any
# exhibits at all (Rio Hondo, 2 exhibits / 0 credit recommendations). The
# disposition extract effectively covers every college with meaningful CPL
# activity, so for a college that IS absent, "zero" is approximately TRUE.
#
# That inverts the usual instinct: broadening this regex does not catch more
# fabrication, it catches more TRUE statements — the exact failure that made 15d
# print "STUDENT GRAIN LEAKED" for a statement timeout. A guard that fails on
# truth gets muted, and then it protects nothing.
#
# So this stays narrow: only the verb-first "awarded/applied/transcribed … 0"
# phrasing, which is the form that would be an outright invented figure.
# Statements about EXHIBITS or ARTICULATIONS being zero are NOT matched — they
# come from a different dataset and are true.
run "15c absent college is not zero (Calbright)" \
  '{"query":"How many CPL credits has Calbright College awarded?","session_id":"smoke-ci"}'
# Negation-aware — "I can't say they've awarded zero" is the right answer.
# The gap cannot cross a dash (2026-09-12): "…awarded, applied, or transcribed —
# it's not that the number is zero" went red on run 34639257647 because the
# match ran across the em-dash into the next clause, where the "not" lives.
answer_must_not_match_unnegated -i "(awarded|applied|transcribed)[^.—–-]{0,40}\b(0|zero|none)\b" \
  "15c does not report an absent college as zero"

# ── 15d. THE GATE (deterministic, and the reason this feature is safe) ────────
# The edge function reads these aggregates with the SERVICE ROLE key, so RLS does
# not constrain Sierra. It must still constrain everyone else: per-college
# disclosure is a deliberate decision routed through the function's own prompt
# rules (Sam, 2026-08-09), NOT an open table. If these ever return rows to the
# anon key, the published aggregates have become world-readable by accident and
# the student-grain table is the next thing to check.
echo "===================================================================="
echo "MODE: 15d aggregate tables stay gated to the anon key"
# The property under test is "anon receives NO ROWS". Three distinct responses
# satisfy or violate it, and the first version of this check conflated two of
# them — it asserted `= "[]"` and so reported a PostgREST *error* as a leak,
# printing "STUDENT GRAIN LEAKED" for a statement timeout (57014) on the first CI
# run. A false alarm in that direction is worse than no alarm at all.
#
# The timeout is itself expected on the big tables: RLS is evaluated per row, and
# map_college_cr_unit (204,714) / map_student_credit (220,588) exceed the
# statement budget before they can return the empty set. No rows come back either
# way, which is the thing that matters.
#   []                    → gated, empty set returned          → PASS
#   {"code":...,"message"} → error (timeout / 401 / 403); no rows → PASS (noted)
#   [{...}]               → actual rows reached anon            → FAIL
assert_anon_gets_no_rows() { # table  label
  local t="$1" label="$2" sel
  sel=$(curl -sS --max-time 30 "$REST_BASE/$t?select=college_id&limit=1" \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
  case "$sel" in
    "[]")
      echo "  [assert ok] anon select on $t returns [] ($label)" ;;
    "["*)
      echo "::error::$label — ROWS REACHED ANON from $t: $sel"; fail=1 ;;
    "{"*)
      # An error body. No rows were served; say which error so a 500 that starts
      # masking a real regression is visible rather than silently "passing".
      echo "  [assert ok] anon select on $t returned no rows ($label; PostgREST error: $(printf '%s' "$sel" | tr -d '\n' | cut -c1-120))" ;;
    *)
      echo "::error::$label — unrecognised response from $t: $sel"; fail=1 ;;
  esac
}
# POSITIVE CONTROL, first — an expired or malformed anon key makes every gate
# assertion below pass for the wrong reason. map_colleges is deliberately
# world-readable (USING(true)), so it MUST return a row. If this fails, the rest
# of this mode proves nothing and should not be read as a clean bill of health.
ctl=$(curl -sS --max-time 30 "$REST_BASE/map_colleges?select=college_id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
case "$ctl" in
  "[{"*) echo "  [assert ok] positive control: anon CAN read map_colleges (key is live)" ;;
  *) echo "::error::positive control FAILED — anon cannot read the public map_colleges ($ctl). The gate assertions below are vacuous."; fail=1 ;;
esac

for t in map_college_credit_summary map_college_goal2 map_college_cr_unit; do
  assert_anon_gets_no_rows "$t" "reviewer/team gated"
done
# The reviewer-only STUDENT GRAIN. Not a policy preference — per-student data,
# with no write policies at all.
assert_anon_gets_no_rows map_student_credit "student grain sealed"
echo

# sierra_feedback anon write path — the exact call the pages' 👍/👎 performs:
# the SECURITY DEFINER RPC sierra_feedback_upsert (a direct PostgREST upsert
# would 401 — ON CONFLICT needs SELECT visibility, which anon deliberately
# lacks; found the hard way on the first run of this mode). Second call on the
# same turn_id carries the note and updates the SAME row.
echo "===================================================================="
echo "MODE: 12 sierra_feedback anon upsert (RPC)"
TID="smoke-$(date +%s)-$RANDOM"
code=$(curl -sS --max-time 30 -o /tmp/fb_out.txt -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID\",\"p_rating\":\"up\",\"p_session_id\":\"smoke-ci\",\"p_page\":\"smoke\",\"p_audience\":\"student\",\"p_question\":\"q\",\"p_response\":\"a\"}")
case "$code" in
  200|201|204) echo "  [assert ok] anon rating upsert via RPC ($code)" ;;
  *) echo "::error::sierra_feedback_upsert returned $code: $(cat /tmp/fb_out.txt)"; fail=1 ;;
esac
code=$(curl -sS --max-time 30 -o /tmp/fb_out2.txt -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID\",\"p_rating\":\"down\",\"p_session_id\":\"smoke-ci\",\"p_page\":\"smoke\",\"p_audience\":\"student\",\"p_question\":\"q\",\"p_response\":\"a\",\"p_note\":\"smoke note\"}")
case "$code" in
  200|201|204) echo "  [assert ok] anon note upsert on same turn_id ($code)" ;;
  *) echo "::error::sierra_feedback_upsert note call returned $code: $(cat /tmp/fb_out2.txt)"; fail=1 ;;
esac
# a bad rating must be REJECTED by the RPC's validation
code=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID-bad\",\"p_rating\":\"meh\"}")
case "$code" in
  2*) echo "::error::invalid rating was accepted ($code)"; fail=1 ;;
  *) echo "  [assert ok] invalid rating rejected ($code)" ;;
esac
# anon SELECT must come back EMPTY (reviewer/team-phrase gate) — not an error.
sel=$(curl -sS --max-time 30 "$REST_BASE/sierra_feedback?turn_id=eq.$TID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
if [ "$sel" = "[]" ]; then
  echo "  [assert ok] anon select returns [] (write-only for the public)"
else
  echo "::error::anon select unexpectedly returned: $sel"; fail=1
fi
echo

# ── 16. DISTRICT ROSTER (added Session 179, after PR #1280) ──────────────────
# Sam, 2026-08-21, asking what LACCD should do: Sierra opened with a caveat that
# she could not enumerate the district — while listing all nine of its colleges.
# The caveat was obsolete: PR #1278 had landed `district` and `mis_district_code`
# on map_colleges hours after the comment claiming no district dimension existed.
#
# ⭐ THE CASE THAT MATTERS IS PERALTA, NOT LACCD — but not for the reason the
# first draft of this comment gave. It claimed "all nine LACCD colleges are named
# Los Angeles". That is true of the STRINGS MAP STORES, not of the colleges:
# Sam pointed out (2026-08-21) that Pierce College is in LACCD and does not carry
# "Los Angeles" in its name. MAP happens to store it as "Los Angeles Pierce
# College", which is the only reason the old name match reached it.
#
# So the name-match path was never resting on a property of the district. It was
# resting on an UPSTREAM STRING CONVENTION we do not control and MAP could change
# in any nightly load — which is a better argument for the roster than the one
# this comment first made, not a weaker one.
#
# ⚠ And the short forms are NOT in `variants`: Pierce carries ["LA PIERCE",
# "LA Pierce"] and no "Pierce College". Every internal table spells it the long
# way today (verified across 6 tables), so nothing is broken — but a table that
# ever arrives using the college's own name would join to nothing, silently.
#
# Measured across the roster, four districts have ZERO colleges named after them:
#
#     Los Rios · Peralta · State Center · Kern
#
# For those the name matcher returned NOTHING and the caveat was the only honest
# answer available. So 16b is the real regression guard: Laney and Merritt cannot
# reach an answer by any route except the district roster.
#
# ⚠ THESE ARE PROSE GREPS, and this file already knows what that costs — mode 7
# is documented as going red intermittently on correct answers for exactly this
# reason (and mode 7's worst offender has since been moved to a retrieval
# assertion, 7r). So the assertions are chosen to be as stable as prose allows: college
# NAMES that the context supplies verbatim, and one banned LABEL. Deliberately
# NOT asserted: any particular count, ordering, or phrasing of the caveat, all of
# which the model may legitimately word many ways.
# ── 16r. THE ROSTER ITSELF, ASSERTED IN DATA RATHER THAN IN PROSE (2026-09-11)
# Same move 7r made, for the same reason and after the same failure. 16a's three
# name greps went red on 2026-09-09 (runs 153/154) on two DIFFERENT subsets of
# the nine, both times against a correct answer — recorded in `cpl_memory` as
# `smoke-16a-prose-grep-fails-not-the-function-2026-09-09`, which says the
# assertion failed, not the function, and that this file's header predicted it.
#
# The question 16a exists to ask splits in two, and only one half is prose:
#   (a) does the district's ACTUAL membership reach Sierra?  — data, deterministic
#   (b) does she answer without the obsolete caveat?          — prose, a BAN
# (a) moves here. (b) stays below, where a ban does not care which colleges the
# model chose to name.
#
# ⚠ THIS IS THE FUNCTION'S OWN QUERY, TRANSCRIBED — `map_colleges` filtered to
# `district` non-null with test orgs dropped (index.ts ~line 420). Transcriptions
# drift: if the roster route is ever re-pointed at another table, this keeps
# passing while the answer stops having data. The guard against that is the
# entity_kind filter below going red, not this comment.
district_roster() { # district name
  curl -sS --max-time 30 -G "$REST_BASE/map_colleges" \
    --data-urlencode "select=college_name,entity_kind" \
    --data-urlencode "district=eq.$1" \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
}
echo "===================================================================="
echo "MODE: 16r the LACCD roster is reachable in map_colleges"
# NEGATIVE CONTROL FIRST, as in 7r: "did these names come back?" is answered by
# an empty body just as convincingly by a broken call as by a real miss.
neg="$(district_roster 'Zzqq Nonexistent Community College District')"
case "$neg" in
  "[]") echo "  [assert ok] negative control: an unknown district returns no colleges" ;;
  *) echo "::error::16r negative control FAILED — an unknown district returned $(printf '%s' "$neg" | head -c 160). The assertion below proves nothing."; fail=1 ;;
esac
roster="$(district_roster 'Los Angeles Community College District')"
case "$roster" in
  "[{"*) echo "  [assert ok] positive control: the district query returned rows" ;;
  *) echo "::error::16r positive control FAILED — map_colleges returned $(printf '%s' "$roster" | head -c 200)"; fail=1 ;;
esac
# A THRESHOLD over the nine, not the nine: a college can leave a district on any
# nightly load, and mode 14 learned that an assertion pinned to a value which can
# leave the data stops being a guard the moment it does. Seven of nine still
# fails loudly if the district column empties or the route is re-pointed.
roster_hits=$(printf '%s' "$roster" | python3 -c '
import json, sys
LACCD = ["East Los Angeles College", "Los Angeles City College", "Los Angeles Harbor College",
         "Los Angeles Mission College", "Los Angeles Pierce College", "Los Angeles Southwest College",
         "Los Angeles Trade Technical College", "Los Angeles Valley College", "West Los Angeles College"]
try:
    rows = json.loads(sys.stdin.read())
    # Test orgs are MAP sandbox rows and the function drops them; so must this.
    names = {r.get("college_name") for r in rows
             if isinstance(r, dict) and (r.get("entity_kind") or "college") == "college"}
except Exception:
    names = set()
print(len([c for c in LACCD if c in names]))
')
if [ "${roster_hits:-0}" -ge 7 ]; then
  echo "  [assert ok] 16r ⭐ $roster_hits of 9 LACCD colleges are in the roster Sierra reads"
else
  echo "::error::16r ⭐ only ${roster_hits:-0} of 9 LACCD colleges came back from map_colleges — the district route has no data to stand on (check the district column and entity_kind)"; fail=1
fi
echo

run "16a LACCD district question answers from the roster" \
  '{"query":"What should Los Angeles Community College District do to help its colleges award more CPL?","session_id":"smoke-ci"}'
# WAS: three greps requiring "pierce" AND "valley" AND one of harbor/southwest/trade.
# Asked what the DISTRICT should do, Sierra names the members her advice bears on
# — a different two or three each time, all correct. Naming none of them is the
# regression this keeps: it means the roster did not reach her.
answer_must_name_at_least -i 2 "16a ⭐ names member colleges of the district" \
  "east los angeles|\bELAC\b" "los angeles city college|\bLACC\b" "harbor" "mission" \
  "pierce" "southwest" "trade.?tech" "valley" "west los angeles|west la\b"
# The caveat is now WRONG for a district we can enumerate, and Sam reported it as
# the first thing he noticed. Hedging over a complete answer teaches the reader
# to discount every hedge — including the ones that are load-bearing.
answer_must_not_match -i "can.?t enumerate|cannot enumerate|not the (complete|full) (set|roster|list) of colleges in" \
  "16a ⭐ no 'cannot enumerate a district' caveat"
# The label fix: the figure counts students with a CPL record, not awards.
answer_must_not_match -i "students awarded" \
  "16a ⭐ does not use the 'Students Awarded' label"

run "16b a district whose colleges are NOT named after it (Peralta)" \
  '{"query":"How are the colleges in the Peralta Community College District doing on CPL?","session_id":"smoke-ci"}'
answer_must_match -i "laney" "16b ⭐ names Laney — unreachable by name match"
answer_must_match -i "merritt|alameda|berkeley city" "16b ⭐ names a second Peralta college"

if [ "$fail" -ne 0 ]; then
  echo "SMOKE TEST FAILED"
  exit 1
fi
echo "ALL MODES OK"
