// tests/sierra_adopter_names.test.js
//
// Guards the defect Sam found on 2026-08-14, asking Sierra as a civic leader:
//
//   "Our teens earned an AWS D1.1 welding certificate with a practical test.
//    Where can they get college credit for it?"
//
// She named Victor Valley and Orange Coast and told him to go ASK whether they
// had adopted it. Bakersfield, Barstow, Orange Coast and Santa Ana have ALL
// articulated AWS D1.1 SMAW. Victor Valley has not — it merely teaches welding,
// i.e. it is on `potential_colleges`, the "could adopt this" band.
//
// THE CAUSE WAS NOT DISOBEDIENCE. Every credential RPC reduces the names to a
// count in SQL — `cardinality(c.adopter_colleges)::integer` — so the prompt
// carried "Colleges that have ADOPTED it: 4" and the four names existed nowhere
// in Sierra's context. A team-guidance rule telling her to list them (written
// 13:33, tested 14:49, still active) COULD NOT BE OBEYED. The data was curated,
// present and nightly-synced; the consumer never read it — the same shape as the
// statewide flag and the ccc_rec retrieval gate before it.
//
// These assertions run against the COMMITTED edge-function source, the same
// approach tests/sierra_guidance.test.js uses for its wire checks — the function
// itself only runs on Deno inside Supabase.
//
// Run from repo root: `npm test` (or `node tests/sierra_adopter_names.test.js`).

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log((cond ? "  ok   " : "  FAIL ") + name);
}

// ── The lookup exists and is keyed, not searched ────────────────────────────
check(
  "fetchCredentialAdopters exists",
  /async function fetchCredentialAdopters\s*\(/.test(src),
);
check(
  "it reads adopter_colleges from chatbox_credentials",
  /from\("chatbox_credentials"\)[\s\S]{0,200}adopter_colleges/.test(src),
);
// A second SEARCH would be a second matcher that can drift from the first —
// the failure §11 records for the recs batch. This must stay an exact-key `in`.
check(
  "it is an exact-key .in() lookup, never a search RPC",
  /fetchCredentialAdopters[\s\S]{0,900}\.in\("unified_title",\s*uniq\)/.test(src),
);
check(
  "it does NOT call a search_* RPC",
  !/fetchCredentialAdopters[\s\S]{0,900}rpc\("search_/.test(src),
);

// ── The names actually reach the prompt ─────────────────────────────────────
check(
  "renderAdopters exists",
  /function renderAdopters\s*\(/.test(src),
);
check(
  "the adopter line prints NAMES, not just a count",
  /Colleges that have ADOPTED it \(\$\{names\.length\}\)/.test(src),
);
check(
  "the bare-count line no longer stands alone in buildCredentialContext",
  !/out \+= `  Colleges that have ADOPTED it: \$\{r\.n_adopters\}\\n`/.test(src),
);
check(
  "buildCredentialContext accepts an adopters map",
  /function buildCredentialContext\([\s\S]{0,260}adopters\?:\s*Map<string,\s*string\[\]>/.test(src),
);
check(
  "the call site passes adopters through",
  /buildCredentialContext\(stdRecs,\s*anyCreds,\s*recs,\s*adopters\)/.test(src),
);
check(
  "adopters are fetched in the SAME batch as recs (one extra round-trip, not N)",
  /Promise\.all\(\[\s*[\s\S]{0,160}fetchCredentialRecs\(titles, sb\),[\s\S]{0,160}fetchCredentialAdopters\(titles, sb\),/.test(src),
);

// ── A capped list must never read as a census ───────────────────────────────
// The same rule the peer-articulation work earned: `peer_total` ships as a
// COLUMN so "showing 9 of 261" can never be mistaken for the whole set.
check(
  "a truncated adopter list discloses the total",
  /showing \$\{shown\.length\} of \$\{names\.length\}/.test(src),
);
check(
  "there is a cap constant rather than an inline number",
  /const ADOPTER_CAP\s*=\s*\d+/.test(src),
);

// ── Absence must not render as an answer ────────────────────────────────────
// The worse half of "absence is not zero" (absence-must-not-render-as-achievement).
// If the names lookup fails we still know the COUNT, so the prompt must say the
// names are missing — never let the model infer the adopters do not exist, and
// never let it invent which colleges they are.
check(
  "missing names are disclosed as unavailable, not as absent adopters",
  /names unavailable for this credential/.test(src),
);
check(
  "missing names explicitly forbid guessing",
  /do NOT guess which colleges they are/.test(src),
);
check(
  "the zero-adopter branch still reads as an opportunity, not a dead end",
  /Colleges that have ADOPTED it: NONE YET/.test(src),
);

// ── Adopters and potential colleges stay disjoint ───────────────────────────
// Victor Valley is the whole reason this test exists: presenting a college that
// TEACHES the subject as somewhere the credit is available sends a student to a
// counter where nobody is expecting them.
check(
  "the adopter line states these colleges have ALREADY articulated it",
  /ALREADY articulated this credential/.test(src),
);
check(
  "the adopter line disclaims ownership of the statewide standard",
  /NOT the owners of the standard/.test(src),
);
check(
  "the two bands are still documented as never-merged",
  /never merge them into one list/.test(src),
);

// ── Enrichment must never cost the credential sections ──────────────────────
check(
  "the adopter lookup fails soft (try/catch inside the fetcher)",
  /fetchCredentialAdopters[\s\S]{0,900}catch\s*\{/.test(src),
);

const failed = results.filter((r) => !r.ok).length;
console.log(
  "\nsierra_adopter_names.test.js: " +
    (results.length - failed) + "/" + results.length + " checks passed",
);
process.exit(failed ? 1 : 0);
