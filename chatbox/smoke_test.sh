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
# PostgREST base for the direct-table assertions (modes 12 and 15d).
REST_BASE="${URL%/functions/v1/cpl-chat}/rest/v1"

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
  if [ -z "${ans// /}" ]; then echo "::error::empty answer for $label"; fail=1; fi
  echo
  sleep 1   # stay well under the 20 req/min/IP rate limit
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
run "7 offerings adoption (LA Harbor NCCER carpentry)" \
  '{"query":"Does Los Angeles Harbor College give credit for NCCER carpentry or construction certifications?","session_id":"smoke-ci"}'
answer_must_match -i "Harbor" "7 home college detected (LA Harbor named)"
answer_must_match -i "Norco|Barstow" "7 adoption precedent (college that articulated it)"
answer_must_match -i "El Camino|Long Beach|Trade.?Tech|Rio Hondo|Compton|Cerritos" "7 nearby construction college"
answer_must_match -i "construction|carpentry|trades|OSHA" "7 on-topic"

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
# San Diego Mesa College, whose profile carries a populated cpl_coordinator
# ("Monica Romero" + an sdccd.edu email); its landing URL is /SDMESA so the
# negative grep can't false-fail on the URL. Both directions asserted.
run "14a contacts default (San Diego Mesa — contact included)" \
  '{"query":"Who is the CPL contact at San Diego Mesa College?","session_id":"smoke-ci"}'
answer_must_match -i "romero|mdromero" "14a default surfaces the CPL contact"

run "14b contacts gated (ctx external — contact suppressed)" \
  '{"query":"Who is the CPL contact at San Diego Mesa College?","session_id":"smoke-ci","ctx":"external"}'
answer_must_not_match -i "romero|mdromero" "14b external ctx never names the contact"

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
# Framing guard: never a report card.
answer_must_not_match -i "failing|failure to|worst|poorly|negligent|shameful" \
  "15a does not frame the backlog as failure"

run "15b credit disposition per-college (San Diego Mesa)" \
  '{"query":"How is San Diego Mesa College doing on awarding CPL credit?","session_id":"smoke-ci"}'
answer_must_match -i "mesa" "15b names the college asked about"
answer_must_match "[0-9],[0-9]{3}" "15b states an actual per-college figure"
# The lead is the already-articulated block — everything built, nobody acted.
answer_must_match -i "articulat" "15b surfaces the already-articulated opportunity"
answer_must_not_match -i "failing|worst|poorly|negligent" "15b frames it as opportunity"

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
# Both word orders are matched, since "awarded 0 credits" and "0 credits awarded"
# are equally wrong. Statements about EXHIBITS or ARTICULATIONS being zero are
# deliberately NOT matched — those come from a different dataset and are true.
run "15c absent college is not zero (Calbright)" \
  '{"query":"How many CPL credits has Calbright College awarded?","session_id":"smoke-ci"}'
answer_must_not_match -i "(awarded|applied|transcribed)[^.]{0,40}\b(0|zero|none|no)\b" \
  "15c does not report an absent college as zero (verb first)"
answer_must_not_match -i "\b(0|zero|no)\b[^.]{0,40}(credits?|units?)[^.]{0,20}(awarded|applied|transcribed)" \
  "15c does not report an absent college as zero (noun first)"

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
code=$(curl -sS -o /tmp/fb_out.txt -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID\",\"p_rating\":\"up\",\"p_session_id\":\"smoke-ci\",\"p_page\":\"smoke\",\"p_audience\":\"student\",\"p_question\":\"q\",\"p_response\":\"a\"}")
case "$code" in
  200|201|204) echo "  [assert ok] anon rating upsert via RPC ($code)" ;;
  *) echo "::error::sierra_feedback_upsert returned $code: $(cat /tmp/fb_out.txt)"; fail=1 ;;
esac
code=$(curl -sS -o /tmp/fb_out2.txt -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID\",\"p_rating\":\"down\",\"p_session_id\":\"smoke-ci\",\"p_page\":\"smoke\",\"p_audience\":\"student\",\"p_question\":\"q\",\"p_response\":\"a\",\"p_note\":\"smoke note\"}")
case "$code" in
  200|201|204) echo "  [assert ok] anon note upsert on same turn_id ($code)" ;;
  *) echo "::error::sierra_feedback_upsert note call returned $code: $(cat /tmp/fb_out2.txt)"; fail=1 ;;
esac
# a bad rating must be REJECTED by the RPC's validation
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$REST_BASE/rpc/sierra_feedback_upsert" \
  -H 'Content-Type: application/json' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d "{\"p_turn_id\":\"$TID-bad\",\"p_rating\":\"meh\"}")
case "$code" in
  2*) echo "::error::invalid rating was accepted ($code)"; fail=1 ;;
  *) echo "  [assert ok] invalid rating rejected ($code)" ;;
esac
# anon SELECT must come back EMPTY (reviewer/team-phrase gate) — not an error.
sel=$(curl -sS "$REST_BASE/sierra_feedback?turn_id=eq.$TID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
if [ "$sel" = "[]" ]; then
  echo "  [assert ok] anon select returns [] (write-only for the public)"
else
  echo "::error::anon select unexpectedly returned: $sel"; fail=1
fi
echo

if [ "$fail" -ne 0 ]; then
  echo "SMOKE TEST FAILED"
  exit 1
fi
echo "ALL MODES OK"
