// tests/sierra_adopter_landing_pages.test.js
//
// Sam, 2026-08-14, after #1183 went live:
//
//   "Just re-ran the AWS D1.1 question in Sierra and the response was great!
//    Now looking for the landing page links to be added."
//
// THE SAME SHAPE AS THE BUG BEFORE IT, ONE LAYER ALONG. #1178 gave Sierra the
// adopter NAMES; #1183 then told her, in Sam's own wording, to answer as a
// markdown table of `college | credit awarded | CPL landing page`. But
// renderAdopters() emitted a comma-joined list of names and NO URLs, while the
// same rule closes with "use ONLY landing-page URLs present in the context
// above — if a college's URL is not there, name the college without a link
// rather than guessing one."
//
// So Sierra was obeying exactly: she had no URL for any adopter, and she
// correctly declined to invent one. A rule that "isn't followed" is worth
// checking for unfollowability BEFORE treating it as model compliance — that is
// the standing lesson from the run before this one, and it applied twice.
//
// The data was there the whole time: chatbox_college_profiles carries
// landing_page_url for 123 of 130 colleges, and all 86 distinct adopter names
// join to it exactly (measured 2026-08-14). Curated, present, never read —
// the fourth instance of that shape.
//
// Assertions run against the COMMITTED edge-function source, like
// tests/sierra_adopter_names.test.js — the function itself only runs on Deno.
//
// Run from repo root: `npm test` (or `node tests/sierra_adopter_landing_pages.test.js`).

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");

// The body of fetchCredentialAdopters, so ordering assertions below are scoped
// to that function rather than to the whole 2,600-line file.
const fetchBody = (src.match(
  /async function fetchCredentialAdopters[\s\S]*?\n\}/,
) || [""])[0];

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log((cond ? "  ok   " : "  FAIL ") + name);
}

// ── The URL actually gets fetched ───────────────────────────────────────────
check(
  "an AdopterRef type pairs a name with its landing page",
  /type AdopterRef\s*=\s*\{\s*name:\s*string;\s*url:\s*string\s*\|\s*null\s*\}/.test(src),
);
check(
  "fetchCredentialAdopters returns AdopterRef[], not bare strings",
  /async function fetchCredentialAdopters\([\s\S]{0,160}Promise<Map<string,\s*AdopterRef\[\]>>/.test(src),
);
check(
  "it reads landing_page_url from chatbox_college_profiles",
  /from\("chatbox_college_profiles"\)[\s\S]{0,160}landing_page_url/.test(fetchBody),
);
check(
  "the landing-page lookup is batched over the union of adopters, not per credential",
  /\.in\("college",\s*\[\.\.\.names\]\)/.test(fetchBody),
);

// ── ENRICHMENT MUST NEVER COST THE ANSWER ───────────────────────────────────
// The load-bearing guarantee. #1165 earned it on the credit-rec lines: the map
// is built OUTSIDE the enrichment try, so a credential with no line is still
// NAMED — dropping it re-creates the false zero. Here the equivalent is that a
// failed landing-page read must cost the LINKS, never the COLLEGES. A student
// told "no college has this" is far worse off than one told a college's name
// with no hyperlink.
const namesSetIdx = fetchBody.indexOf("out.set(r.unified_title");
const profilesIdx = fetchBody.indexOf("chatbox_college_profiles");
check(
  "adopter names are populated BEFORE the landing-page lookup runs",
  namesSetIdx > -1 && profilesIdx > -1 && namesSetIdx < profilesIdx,
);
check(
  "names are seeded with url:null so a URL failure cannot drop an adopter",
  /out\.set\(r\.unified_title,\s*r\.adopter_colleges\.map\([\s\S]{0,80}url:\s*null/.test(fetchBody),
);
check(
  "the landing-page lookup has its OWN nested try/catch",
  /if \(names\.size > 0\)\s*\{\s*try\s*\{[\s\S]{0,700}catch\s*\{/.test(fetchBody),
);

// ── The URL reaches the prompt, paired unambiguously ────────────────────────
// A comma-joined name list gives the model nothing to put in the table's third
// column. One row per college, name and URL on the same line.
check(
  "renderAdopters prints one adopter per line",
  /for \(const a of shown\)\s*\{\s*out \+=/.test(src),
);
check(
  "each line carries that college's CPL landing page",
  /CPL landing page: \$\{a\.url\}/.test(src),
);
check(
  "the guidance tells the model to link the landing pages",
  /link each college's CPL landing page where one is given above/.test(src),
);

// ── A MISSING URL IS NAMED, NEVER GUESSED ───────────────────────────────────
// 7 of 130 colleges have no landing page on file. The college must still be
// named — omitting it would re-create the false zero the whole workstream
// exists to kill — and the model must be told plainly not to invent a link.
check(
  "a college with no landing page is still named",
  /no CPL landing page on file/.test(src),
);
check(
  "a college with no landing page is explicitly rendered WITHOUT a link",
  /name this college WITHOUT a link/.test(src),
);

// ── The LOCAL branch stopped dropping its colleges ──────────────────────────
// "Where can my teen get credit for AWS D1.1?" surfaces two statewide records
// (4 adopters each) AND three local ones — Lemoore and Riverside x2 — which
// rendered as a bare count with no names at all. For a LOCAL credential the
// adopters are precisely where the credit exists.
check(
  "the local-credential branch renders adopters instead of a bare count",
  /locals[\s\S]{0,700}renderAdopters\(r\.n_adopters,\s*adopters\?\.get\(r\.unified_title\),\s*"    ",\s*true\)/.test(src),
);
check(
  "renderAdopters takes a `local` flag",
  /function renderAdopters\([\s\S]{0,140}local\s*=\s*false\)/.test(src),
);

// ── The two framings must not be pasted onto each other ─────────────────────
// "They are NOT the owners of the standard" is a claim about a STATEWIDE
// standard. A local articulation genuinely does belong to the college that
// built it, so reusing that sentence there would be false.
check(
  "the statewide framing keeps the anti-ownership guard",
  /NOT the owners of the standard/.test(src),
);
check(
  "the local framing says the credit exists at those colleges specifically",
  /This is a LOCAL articulation: the credit exists at these colleges specifically/.test(src),
);
check(
  "the local framing forbids dressing a local articulation as statewide",
  /Do NOT describe it as a statewide standard other colleges can adopt as-is/.test(src),
);
check(
  "the two framings are branched on the flag, not concatenated",
  /out \+= local\s*\?/.test(src),
);

// ── The cap still holds on the new per-line rendering ───────────────────────
check(
  "the per-line list is still sliced to ADOPTER_CAP",
  /const shown = refs\.slice\(0, ADOPTER_CAP\)/.test(src),
);
check(
  "a truncated list still discloses the true total",
  /showing \$\{shown\.length\} of \$\{refs\.length\}/.test(src),
);

const failed = results.filter((r) => !r.ok).length;
console.log(
  "\nsierra_adopter_landing_pages.test.js: " +
    (results.length - failed) + "/" + results.length + " checks passed",
);
process.exit(failed ? 1 : 0);
