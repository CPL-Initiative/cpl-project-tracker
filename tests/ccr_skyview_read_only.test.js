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
ok("it names the way up: sign in", /Sign in to position courses and save merges/.test(band), band.slice(0, 220));

/* ⚠️ THIS ASSERTION IS INVERTED FROM WHAT IT SAID BEFORE 2026-09-19, and the
 * reason belongs here rather than only in a commit message. The markup used to
 * carry an <a> to ../index.html#unified-courses/list, and this suite REQUIRED
 * it — "the link points at the CCR tab in COBI" — because the band's job was
 * then to answer "how do I log in to curate".
 *
 * Sam's 2026-09-19 ruling makes the stand-alone page a PUBLIC read-only
 * surface: "My goal is to allow public read only SkyView access but prevent
 * any actions to be taken that would edit or access views where edits could be
 * done." The Views menu already withheld its COBI link below the STAGE rung —
 * but this one is in the static markup, so it painted for every reader in the
 * gap before renderCurationLine() ran, underneath a sentence saying they were
 * read only. A gate the first frame walks around is not a gate.
 *
 * So the requirement flipped: the markup the page SHIPS offers no door. The
 * signed-in branches build their own controls at runtime. */
ok("the shipped markup hands nobody a COBI link",
  !/href="\.\.\/index\.html/.test(band), band);
ok("…and no link at all, so nothing else creeps back in", !/<a\s/.test(band), band);
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
  /rung>=2/.test(roFn) && /signed in/.test(roFn));

/* ── EACH RUNG NAMES ITS OWN CREDENTIAL (Sam, 2026-09-19) ─────────────────
 * "I just want to make sure that I can see on SkyView if I am signed on with
 * either magic link or team phrase AND if not, I want to see clearly that I am
 * in Read Only mode."
 *
 * ⚠️ THE OLD FAILURE WAS A SHARED OPENING, NOT A MISSING ONE. Rung 1 read
 * "<strong>Read only.</strong> Moves stage in this browser alone." — the same
 * two words rung 0 leads with — so a curator who had just entered the team
 * phrase got the signed-out sentence and no way to tell the phrase had taken.
 * Asserting that each branch merely SAYS something would have passed then, so
 * these assert the three leads are DISTINCT. */
const leads = [...roFn.matchAll(/<strong>([^<]{3,80})<\/strong>/g)].map((m) => m[1]);
ok("the band has a lead phrase for each of the three rungs", leads.length >= 3, leads.join(" | "));
ok("…and no two rungs open on the same words",
  new Set(leads.map((l) => l.slice(0, 12))).size === leads.length, leads.join(" | "));
ok("rung 1 names the team phrase", /<strong>Team phrase/.test(roFn));
ok("rung 2 names the magic link", /<strong>Magic link/.test(roFn));
ok("rung 0 still reads exactly as Sam saw it on screen",
  /<strong>Read only\.<\/strong> Moves stage in this browser alone\./.test(roFn));

/* The other half of the same ask: "I'm not sure if I'm also signed in on COBI
 * main page." It is ONE credential — cpl_sb and cpl_team_pass are localStorage
 * keys and SkyView and COBI are the same origin — so the two rungs that HOLD a
 * credential say so, at the moment that answer is the useful one. Rung 0 stays
 * as he read it and leaves COBI to the Views menu's single note. */
const withCred = roFn.slice(roFn.indexOf("if(rung>=2)"), roFn.indexOf("} else {"));
ok("both credentialled rungs answer the COBI question",
  (withCred.match(/here and in COBI/g) || []).length === 2,
  (withCred.match(/here and in COBI/g) || []).length + " of 2");
ok("the sign-in host lives inside #u-full, so full screen still paints it",
  sv.indexOf('id="u-signin"') > sv.indexOf('id="u-full"') &&
  sv.indexOf('id="u-signin"') < sv.indexOf('id="u-stage"'));

/* ── the two ways OUT of the page need a rung (Sam, 2026-09-18) ──────────── */
/* "Team code or magic should be able to navigate to all links." Both COBI
 * links render only when NOT framed — that is, only on the stand-alone page,
 * which is precisely the page shared outside the team. */
const menuFn = univ.slice(univ.indexOf("function viewsMenuInto("), univ.indexOf("window.__ccrViewsMenu"));
ok("the COBI links sit inside the canStage() branch", /\}\s*else if\(canStage\(\)\)\{/.test(menuFn));
/* The wording widened on 2026-09-19 when the four curation views joined COBI
 * behind the rung: ONE note now covers both, so the menu never lists what it
 * is withholding. The requirement is unchanged — name the remedy, describe
 * nothing behind the door. */
ok("…and a reader without a rung is told the door exists, not left guessing",
  /u-views-note/.test(menuFn) && /Sign in to open the curation views and COBI/.test(menuFn));
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

/* ══ THE READ-ONLY PAGE MAY NOT REACH A VIEW THAT EDITS (Sam, 2026-09-19) ══
 * "I am able in current mode to go to the links on the side menu and those
 * should be grayed out in read mode. My goal is to allow public read only
 * SkyView access but prevent any actions to be taken that would edit or access
 * views where edits could be done." Asked whether to gray or to hide, he chose
 * hide.
 *
 * WHICH VIEWS, AND WHY — measured, not assumed:
 *   comprehensive  embeds the forest, whose "Open this one" calls __ccrDecision
 *   disciplines    its table carries a Decisions button into the same surface
 *   subjects  esl  share ONE workspace shell with ONE mode bar, so a reader let
 *                  into ESL is one click from the Disciplines table
 *   skyview  how   carry no edit and stay open — this is the page Sam shares
 */
const VIEWS_SRC = univ.slice(univ.indexOf("var VIEWS=["), univ.indexOf("function eslAvailable()"));
const viewKeys = [...VIEWS_SRC.matchAll(/\{key:"([a-z]+)",(\s*rung:(\d))?/g)]
  .map((m) => ({ key: m[1], rung: m[3] ? +m[3] : 0 }));
ok("all six views are still in the menu", viewKeys.length === 6, viewKeys.map((v) => v.key).join(","));
for (const k of ["comprehensive", "disciplines", "subjects", "esl"])
  ok(`${k} needs a rung to appear`, viewKeys.some((v) => v.key === k && v.rung === 1),
    JSON.stringify(viewKeys));
for (const k of ["skyview", "how"])
  ok(`${k} stays open to everyone`, viewKeys.some((v) => v.key === k && v.rung === 0),
    JSON.stringify(viewKeys));

const menuFn2 = univ.slice(univ.indexOf("function viewsMenuInto("), univ.indexOf("window.__ccrViewsMenu"));
ok("the menu drops a view the reader has no rung for",
  /\(!v\.rung \|\| curationRung\(\) *>= *v\.rung\)/.test(menuFn2));
ok("…and one note still names the remedy without naming what is behind the door",
  /Sign in to open the curation views and COBI/.test(menuFn2));

/* ⚠️ THE MENU IS NOT THE ONLY DOOR, AND THAT IS THE WHOLE POINT OF THIS BLOCK.
 * #disciplines and #work/<discipline> are ordinary URLs — a shared link, a
 * bookmark, a typed hash or Back reaches them without the menu ever opening.
 * Removing the item while the route stayed open would have been decoration,
 * and would have LOOKED right in a screenshot. */
const routeFn = univ.slice(univ.indexOf("var GATED_ROUTES="), univ.indexOf("/* Compare the SUBJECT too"));
ok("the route funnel has a gated list", /var GATED_ROUTES=\{/.test(routeFn));
ok("…and asks the same ladder the menu asks", /if\(GATED_ROUTES\[k\] *&& *!canStage\(\)\)/.test(routeFn));
ok("…and lands a refused reader on the map rather than a wall",
  /GATED_ROUTES\[k\][\s\S]{0,200}?__ccrUniverse\(\{solo:true\}\)/.test(routeFn));
ok("…saying why, because a link that silently goes elsewhere reads as broken",
  /GATED_ROUTES\[k\][\s\S]{0,400}?setHint\(/.test(routeFn));

/* The two lists have to AGREE. A view given a rung in the menu but left out of
 * GATED_ROUTES is precisely the hole this section exists to close, and it is
 * invisible on screen — the item is gone from the menu and the URL still works. */
const gated = (routeFn.slice(0, routeFn.indexOf("};")).match(/([a-z]+):1/g) || [])
  .map((x) => x.replace(":1", ""));
for (const v of viewKeys.filter((v) => v.rung > 0))
  ok(`the hash for ${v.key} is gated too, not just its menu item`, gated.includes(v.key), gated.join(","));
ok("#work/<discipline> is gated — it IS the decision surface", gated.includes("work"));
/* Reading matter, deliberately left open: Sam's line is about edits, and the
 * outline's reviewer panel carries the rung instead (asserted below). */
ok("#outline/<id> stays open, and stays a deliberate exception", !gated.includes("outline"));

/* Losing the credential has to take the VIEW too, not just the chrome around
 * it: a curator on the Disciplines table who signs out in another tab kept the
 * table on screen beside a menu that had just stopped offering it. */
const rac = univ.slice(univ.indexOf("function refreshAuthChrome()"),
                       univ.indexOf("if(typeof window===\"undefined\""));
ok("losing the rung re-routes a reader off a gated view",
  /GATED_ROUTES\[curView\] *&& *!canStage\(\)/.test(rac), rac);
ok("…through the same funnel, so the rung is read once", /__ccrRoute\(\)/.test(rac));

/* ── the outline stays readable; its edit panel does not ─────────────────── */
ok("the reviewer panel is built only for a reader who may",
  /if\(canStage\(\)\) h\+=olLayer\("review"/.test(univ));
ok("the per-skill Remove asks the rung at its one funnel",
  /function dropBtn\(x\)\{[\s\S]{0,160}?if\(!canStage\(\)\) return "";/.test(univ));
ok("Add a skill asks it too", /\(canStage\(\)\s*\?\s*'<p class="row"[^']*ol-sk-add/.test(univ));

/* ══ THE SECOND STAGING PATH — A DIFFERENT FILE, AND IT HAD NO GATE ════════
 * ⚠️ THE SUITE ABOVE ASSERTS "nothing outside curationRung() decides
 * authorization" AND IT PASSED THROUGHOUT, because it only ever read
 * ccr_universe.js. ccr_atlas_graph.js's __ccrDecision is a full drag-to-move
 * curation surface with its own moves[] and a review-status selector, and the
 * ladder had never seen it. Two ordinary doors reached it from a read-only
 * page: the comprehensive view's forest, and #work/<discipline>.
 *
 * The lesson is the one worth keeping: a single-decider guard is only as wide
 * as the files it reads. */
const graph = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_graph.js"), "utf8");
ok("the ladder is exported for the other file to ask",
  /window\.__ccrRung *= *\{ *rung: *curationRung, *canStage: *canStage, *canExecute: *canExecute *\}/.test(univ));
const dec = graph.slice(graph.indexOf("window.__ccrDecision = function"), graph.indexOf("var DATA = JSON.parse"));
ok("__ccrDecision asks the exported ladder", /window\.__ccrRung/.test(dec), dec.slice(0, 200));
ok("…and refuses below the STAGE rung", /!L *\|\| *!L\.canStage\(\)/.test(dec), dec);
ok("…failing CLOSED when the ladder is absent, never open", /if\(!L *\|\|/.test(dec), dec);
ok("…and sending the reader to the map they may have", /__ccrUniverse\(\{solo:true\}\)/.test(dec));
/* Same rule as ccr_universe.js: a second file reading the raw keys is a second
 * decider, and the beginning of the drift the one-function rule exists to stop. */
const graphCode = graph.replace(/\/\*[\s\S]*?\*\//g, " ");
for (const key of ["cpl_team_pass", "cpl_sb"])
  ok(`ccr_atlas_graph.js never touches the raw ${key} key`, !graphCode.includes(key));

/* And the built page carries both halves — the export and the asker — because
 * the gate is only real in the artifact that actually ships. */
ok("the built page carries the exported ladder", /window\.__ccrRung *=/.test(sv));
ok("…and the gated decision surface", /!L *\|\| *!L\.canStage\(\)/.test(sv));

/* `N/M checks passed` is the shape tests/run.js parses into tests/check_floor.json.
 * The old `${n} checks passed` read as no count at all, so this file sat outside
 * the floor for its whole life — its checks could have quietly stopped running
 * and nothing would have said so. Every check here is asserted, so N and M are
 * the same number: reaching this line means none of them failed. */
console.log(`ccr_skyview_read_only: ${n}/${n} checks passed`);
