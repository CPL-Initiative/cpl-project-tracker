/* SkyView tells each reader what they may do, where they are standing.
 *
 * ⚠️ THE FILE KEEPS ITS NAME AND HAS OUTGROWN IT. It began as "the page is
 * read only and says so" and now guards the LADDER that replaced that claim
 * (Sam, 2026-09-18) — VIEW for anyone with the link, STAGE on the team phrase,
 * EXECUTE on a magic-link reviewer session. The rename was skipped on purpose:
 * three handoffs and a lessons doc cite this path, and the section that
 * changed says so in place, which is more findable than a new filename and a
 * dangling set of references.
 *
 * Sam, 2026-09-18: "I want to share COBI SkyView with some folks but I want to
 * make sure it is read only view. I don't see anywhere on the surface how to
 * log in to curate, so that needs to be looked at." Then, specifying the
 * rungs: "To position courses to merge needs at least team code auth to do"
 * and "magic link can do any of the three."
 *
 * ⚠️ THE FAILURE MODE IS NOT A MISSING SENTENCE — THE PAGE HAD THREE OF THEM.
 * `main>footer` carries "Nothing here writes to Supabase"; #prov carries the
 * same claim in a title attribute; the third copy is a code comment. All three
 * live in chrome that `body.u-solo` — SkyView alone, the view that OPENS — hides
 * or never paints, so the default view offered drag handles, a Move chip and a
 * "What this would write" panel with no account of what a drop does. A guard
 * that only asserts the words exist would have passed the whole time.
 *
 * So this suite asserts WHERE the statement is (inside #u-full, clear of every
 * selector solo hides and clear of the legend, which folds away), that it names
 * the place curation is actually saved, and — the part that makes the claim true
 * rather than merely printed — that the page still has no write path.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.dirname(__dirname);
const sv = fs.readFileSync(path.join(ROOT, "prototype/skyview.html"), "utf8");
let n = 0;
const ok = (name, cond, detail) => { assert.ok(cond, name + (detail ? " — " + detail : "")); n++; };

/* ── the statement exists, and says both halves ─────────────────────────── */
ok("the read-only band is in the page", /id="u-ro-line"/.test(sv));
const band = sv.slice(sv.indexOf('<p class="u-ro-line"'), sv.indexOf('</p>', sv.indexOf('<p class="u-ro-line"')));
ok("it leads with the two words that answer the question", /<strong>Read only\.<\/strong>/.test(band), band.slice(0, 120));
ok("it says where a move goes: this browser alone", /stage in this browser alone/.test(band), band.slice(0, 200));
ok("it names who saves and where", /Signed-in curators save in/.test(band) && /Common Course Reference tab/.test(band));

/* The link has to reach the surface that really writes. unified_courses.js POSTs
 * kb_curation under a magic-link reviewer session; a link anywhere else answers
 * "how do I log in to curate" with a place that cannot save. */
ok("the link points at the CCR tab in COBI", /href="\.\.\/index\.html#unified-courses\/list"/.test(band), band);
ok("…and escapes the frame safely when SkyView is embedded",
  /target="_blank"/.test(band) && /rel="noopener"/.test(band));
const uc = fs.readFileSync(path.join(ROOT, "unified_courses.js"), "utf8");
ok("the surface it points at is the one that actually writes kb_curation",
  /kb_curation/.test(uc) && /method:\s*"POST"/.test(uc));

/* ── and it is where a reader can SEE it ────────────────────────────────── */
/* Everything body.u-solo hides, and the legend, which the reader can fold. */
const soloHides = (sv.match(/body\.u-solo\s+[^{,]+/g) || []).map((x) => x.replace(/^body\.u-solo\s+/, "").trim());
ok("the selectors solo hides are the known ones", soloHides.length > 0, soloHides.join(" | "));
for (const sel of [".mast", ".crumbrow", "#u-below", "main>footer"])
  ok(`solo still hides ${sel} (so the band may not live there)`, soloHides.includes(sel));
const footer = sv.slice(sv.indexOf("<footer>"), sv.indexOf("</footer>"));
ok("the band is NOT inside the page footer", footer.length > 0 && !/u-ro-line/.test(footer));
ok("the band is NOT inside #u-below", sv.indexOf('id="u-ro-line"') < sv.indexOf('id="u-below"'));
/* #u-foot holds the legend and folds away on the reader's say-so, so a statement
 * placed there disappears from a page that is being shared. */
ok("the band sits above the map, not in the folding legend strip",
  sv.indexOf('id="u-ro-line"') < sv.indexOf('class="u-stage" id="u-stage"'));
ok("no rule hides the band", !/u-ro-line[^{]*\{[^}]*display:\s*none/.test(sv));

/* ⚠️ The canvas height is JS-owned by fitCanvas(); CSS cannot take it (see the
 * invariants). A band added above the canvas without being subtracted there
 * leaves the canvas that many pixels too tall and pushes the legend off the foot
 * of a phone — a layout fault no jsdom suite can see, which is why it is read
 * out of the source here. */
ok("fitCanvas subtracts the band's height from the canvas",
  /u-ro-line/.test(sv.slice(sv.indexOf("function fitCanvas"), sv.indexOf("function sizeCanvas"))));
ok("the chrome ResizeObserver watches the band",
  /\["u-top","u-foot","u-face-line","u-ro-line"\]/.test(sv));

/* ── the claim is true FOR THE READER IT IS SHOWN TO ─────────────────────── */
/* ⚠️ THIS SECTION CHANGED DELIBERATELY ON 2026-09-18, and the reason belongs
 * here rather than only in a commit message.
 *
 * It used to assert the page had NO write path at all: exactly one non-GET
 * request (the Ask) and no `rest/v1` anywhere. Sam then asked for merge
 * execution on this surface ("I want to have SkyView be a complete surface for
 * curation to work from"), so the page writes now, and those two assertions
 * had to go. They were written to resist a casual change, so they were not
 * routed around — they were replaced with a harder guard.
 *
 * What replaces them is the LADDER, which is the thing that now has to stay
 * true (Sam, 2026-09-18):
 *
 *   VIEW     anyone with the link          — the map, search, details, Ask
 *   STAGE    the team phrase               — positioning a course for a merge
 *   EXECUTE  a magic-link reviewer session — writing kb_curation
 *
 * The band's sentence is the load-bearing one: Sam shared this page on "Moves
 * stage in this browser alone", and it stays true for everyone below EXECUTE.
 * A change that lets a rung-0 reader write, or that leaves the band claiming
 * read-only to someone who can save, is the failure this suite exists for. */

/* Exactly two non-GET requests, each one named. A third arriving unannounced is
 * what this count is for. */
const posts = sv.match(/method:\s*"(POST|PUT|PATCH|DELETE)"/g) || [];
ok("exactly two non-GET requests in the whole page", posts.length === 2, posts.join(", "));
const askAt = sv.indexOf('fetch(ASK_URL+"/functions/v1/cpl-chat"');
ok("the first is the Ask calling cpl-chat, a drafting surface that inserts nothing",
  askAt > 0 && Math.abs(sv.indexOf('method:"POST"') - askAt) < 400);
const restPaths = [...new Set((sv.match(/\/rest\/v1\/[a-z_]+/g) || []))];
ok("the second is the only PostgREST path, and it is kb_curation",
  restPaths.length === 1 && restPaths[0] === "/rest/v1/kb_curation", restPaths.join(", "));
ok("…writing the same field unified_courses.js writes, not a second shape",
  /field:"merge_into"/.test(sv) && /field:\s*"merge_into"/.test(uc));

/* ── every gate reads ONE function ───────────────────────────────────────── */
/* The rungs moved twice in the conversation that specified them and will move
 * again. A second place that reads the storage keys is a second place to get
 * the ladder wrong, so the page is allowed exactly one. */
ok("the ladder is one function", /function curationRung\(\)/.test(sv));
ok("canStage and canExecute both derive from it",
  /function canStage\(\)\{\s*return curationRung\(\) *>= *1/.test(sv) &&
  /function canExecute\(\)\{\s*return curationRung\(\) *>= *2/.test(sv));
const univ = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const rungBody = univ.slice(univ.indexOf("function curationRung()"), univ.indexOf("function canStage()"));

/* The RAW storage keys never appear here: `cpl_sb` and `cpl_team_pass` belong
 * to cpl_session.js and team_phrase.js, and a page that reads them directly is
 * a page that will still be reading them after those modules change how they
 * are stored. cpl_session.js exists precisely because thirteen modules checked
 * a token's SHAPE instead of asking it. */
/* Block comments stripped first: this is a claim about what the CODE reads,
 * and a comment that NAMES the key it is careful not to read is documentation.
 * (The same distinction kb/_docs_audit.py's prose_only() draws the other way
 * round.) Block comments only — a naive `//` strip would eat the `https://` in
 * every URL on the page. */
const univCode = univ.replace(/\/\*[\s\S]*?\*\//g, " ");
for (const key of ["cpl_team_pass", "cpl_sb"])
  ok(`the universe JS never touches the raw ${key} key`, !univCode.includes(key),
    "reads it directly instead of going through the module's API");

/* No OTHER gate. Reading the signed-in email to display it, and calling
 * ensureFresh() before a write, are not gates — they are uses. What must not
 * exist is a second place that DECIDES authorization, so the check is on `if`
 * conditions rather than on mentions. */
const rungStart = univ.indexOf("function curationRung()"), rungEnd = univ.indexOf("function canStage()");
const strayGates = [];
for (const m of univ.matchAll(/if\s*\([^)]{0,120}?(CPL_SESSION|CPL_TEAM_PHRASE)/g)) {
  if (m.index < rungStart || m.index > rungEnd) strayGates.push(univ.slice(m.index, m.index + 60));
}
/* openSigninSheet() asks whether to draw the phrase box — a question about the
 * form's shape, not about permission — so it is the one allowed exception. */
const allowed = strayGates.filter((g) => !/CPL_TEAM_PHRASE *&& *!window\.CPL_TEAM_PHRASE\.get\(\)/.test(g)
  && !/window\.CPL_REVIEWER_SIGNIN/.test(g));
ok("nothing outside curationRung() decides authorization", allowed.length === 0, allowed.join(" | "));

/* ── the gates are actually on the paths ─────────────────────────────────── */
/* applyMove is where every staging route meets — a canvas drop, the panel's
 * Drag… then click, Move here, Accept — which is why the carry is released
 * there and why the gate belongs there too. */
const applyMove = univ.slice(univ.indexOf("function applyMove("), univ.indexOf("function drawWrites("));
ok("staging is gated on canStage() at the one place every route meets",
  /if\(!canStage\(\)\)/.test(applyMove));
ok("…and it refuses OUT LOUD, because a silent drop was the original bug",
  /if\(!canStage\(\)\)[\s\S]{0,400}?setHint\(/.test(applyMove));
ok("the write is gated on canExecute()",
  /function saveStagedMerges\(\)\{[\s\S]{0,300}?if\(!canExecute\(\)\)/.test(univ));
ok("the write takes a FRESH session, never the cached one",
  /saveStagedMerges[\s\S]{0,900}?CPL_SESSION\.ensureFresh\(\)/.test(univ));

/* ── the band still tells the truth to the people it is shown to ─────────── */
const roFn = univ.slice(univ.indexOf("function renderCurationLine()"), univ.indexOf("function openSigninSheet()"));
ok("the signed-out branch still says moves stage in this browser alone",
  /rung===1|else\s*\{/.test(roFn) && (roFn.match(/stage in this browser alone/g) || []).length === 2,
  (roFn.match(/stage in this browser alone/g) || []).length + " occurrences");
ok("only the signed-in branch mentions saving",
  /rung>=2/.test(roFn) && /Signed in/.test(roFn));
ok("the sign-in host lives inside #u-full, so full screen still paints it",
  sv.indexOf('id="u-signin"') > sv.indexOf('id="u-full"') &&
  sv.indexOf('id="u-signin"') < sv.indexOf('id="u-stage"'));

/* ── the two ways OUT of the page need a rung (Sam, 2026-09-18) ──────────── */
/* "Team code or magic should be able to navigate to all links." Both COBI
 * links render only when NOT framed — that is, only on the stand-alone page,
 * which is precisely the page shared outside the team. */
const menuFn = univ.slice(univ.indexOf("function viewsMenuInto("), univ.indexOf("window.__ccrViewsMenu"));
ok("the COBI links sit inside the canStage() branch", /\}\s*else if\(canStage\(\)\)\{/.test(menuFn));
ok("…and a reader without a rung is told the door exists, not left guessing",
  /u-views-note/.test(menuFn) && /Sign in to open COBI/.test(menuFn));
const noRung = menuFn.slice(menuFn.indexOf("} else {", menuFn.indexOf("else if(canStage())")));
ok("the no-rung branch offers neither link",
  !/href="\.\.\/index\.html/.test(noRung), noRung.slice(0, 200));

/* ── the chrome follows the credential ───────────────────────────────────── */
/* A magic link lands in ANOTHER browser tab and is shared through localStorage;
 * listening for one of the three announcements is how a control comes to sit
 * stale beside a credential that has changed. */
for (const ev of ["cpl-session-changed", "cpl-auth-change", "cpl-team-pass-unlocked"])
  ok(`refreshAuthChrome listens for ${ev}`, new RegExp(ev).test(univ));
ok("…and for cross-tab storage writes", /addEventListener\("storage"/.test(univ));

/* `N/M checks passed` is the shape tests/run.js parses into tests/check_floor.json.
 * The old `${n} checks passed` read as no count at all, so this file sat outside
 * the floor for its whole life — its checks could have quietly stopped running
 * and nothing would have said so. Every check here is asserted, so N and M are
 * the same number: reaching this line means none of them failed. */
console.log(`ccr_skyview_read_only: ${n}/${n} checks passed`);
