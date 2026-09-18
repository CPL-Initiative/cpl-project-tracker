/* SkyView says it is read only, where the reader is standing.
 *
 * Sam, 2026-09-18: "I want to share COBI SkyView with some folks but I want to
 * make sure it is read only view. I don't see anywhere on the surface how to
 * log in to curate, so that needs to be looked at."
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

/* ── the claim is true: the page has no write path ──────────────────────── */
/* This is the part worth guarding hardest. A statement of read-only that a later
 * change quietly falsifies is worse than no statement, because Sam shared the
 * page on the strength of it. Rule 10 (a3) routes a new write surface through
 * Governance and the privacy ADRs first — so a write landing here should fail a
 * test, not merely surprise a reviewer. */
const posts = sv.match(/method:\s*"(POST|PUT|PATCH|DELETE)"/g) || [];
ok("exactly one non-GET request in the whole page", posts.length === 1, posts.join(", "));
const askAt = sv.indexOf('fetch(ASK_URL+"/functions/v1/cpl-chat"');
ok("…and it is the Ask calling cpl-chat, a drafting surface that inserts nothing",
  askAt > 0 && Math.abs(sv.indexOf('method:"POST"') - askAt) < 400);
ok("the page never reaches PostgREST at all", !/rest\/v1/.test(sv));

console.log(`ccr_skyview_read_only: ${n} checks passed`);
