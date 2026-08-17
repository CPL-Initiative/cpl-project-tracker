// Sierra, on all three surfaces, reads the same. Sky167, 2026-08-17.
//
// #1231 applied Sam's no-glyphs rule (cpl_memory cobi-no-cheesy-glyphs-design-rule)
// to the My College tab. It could only reach cpl_chat.js, so the other two
// surfaces that mount Sierra kept their emoji: the standalone public page
// (sierra/) and the Fact Sheet drawer (fact-sheet/factsheet_sierra.js). Sam:
// "I think it's a good idea to keep all instances of Sierra aligned."
//
// ⭐ THE POINT OF THIS FILE IS THE CROSS-FILE ASSERTION, not the glyph scan.
// Three files hand-maintain the same assistant, and nothing has ever compared
// them — so they drift silently and the drift is only ever found by a person
// looking at two screens. The audience labels are the sharpest case: the pick is
// persisted under ONE same-origin key (cplSierraAudience.v1) and travels to the
// SAME Edge Function, so a visitor can choose "Faculty" on the Fact Sheet and
// meet a differently-worded list on the standalone page — one assistant
// introducing itself two ways to the same person. Comparing the arrays makes
// "aligned" mechanical instead of remembered.
//
// ⚠ A GLYPH SCAN ALONE IS NOT ENOUGH — a strip that left the labels BLANK would
// pass it. Every glyph check here is paired with a check that the word survived
// and that sibling states stay DISTINCT from each other.
//
// Run from repo root: `npm test` (or `node tests/sierra_surfaces_aligned.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const PAGE = fs.readFileSync("sierra/sierra.js", "utf8");
const PAGE_HTML = fs.readFileSync("sierra/index.html", "utf8");
const PAGE_CSS = fs.readFileSync("sierra/sierra.css", "utf8");
const DRAWER = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");

/* Emoji + the dingbat marks that were used as status prefixes (✓ ⚠ ↗). The
 * range is deliberately NOT "all non-ASCII": this repo's prose is full of
 * em-dashes, curly quotes and accented college names, and Sam's rule explicitly
 * carves out muted CO-blue affordances like the disclosure caret. `●` (the
 * typing indicator) is likewise not a decorative glyph — it is an animated
 * loading state with no text equivalent, and cpl_chat.js keeps its own. */
const GLYPH = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u2713\u2714\u2717\u2718\u26A0\uFE0F]/u;

/* ── What counts as "visible" ───────────────────────────────────────────────
 * Scanning whole LINES is wrong twice over: it trips on prose in the files'
 * block-comment headers, and on trailing `// … → …` notes beside real code. So
 * this walks the source tracking quote state and returns only STRING LITERALS —
 * which is the actual property anyway ("what can a visitor read?"), and it means
 * a comment explaining why a glyph was removed can safely name the glyph. The
 * fix's own comments in cpl_chat.js and sierra.js do exactly that. */
function stringLiterals(src) {
  const out = [];
  let i = 0, n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2); i = i < 0 ? n : i + 2; continue; }
    if (c === "<" && src.startsWith("<!--", i)) { i = src.indexOf("-->", i); i = i < 0 ? n : i + 3; continue; }
    /* A REGEX LITERAL IS NOT A STRING, and skipping it is not optional: these
     * files contain regexes holding backticks (the markdown-lite `code` rule),
     * and treating one as a template-literal opener desyncs the walker for the
     * rest of the file — which silently turns real code into "strings" and, far
     * worse, could swallow a genuine glyph. `/` starts a regex only where a
     * VALUE may begin; after an identifier, number or `)` it is division. */
    if (c === "/" && /[(,=:[!&|?{};+\-*%^~<>]\s*$/.test(src.slice(Math.max(0, i - 40), i))) {
      i++;
      let inClass = false;
      while (i < n) {
        if (src[i] === "\\") { i += 2; continue; }
        if (src[i] === "[") inClass = true;
        else if (src[i] === "]") inClass = false;
        else if (src[i] === "/" && !inClass) { i++; break; }
        else if (src[i] === "\n") break;                  // not a regex after all
        i++;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      const q = c; let buf = ""; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === "\\") { buf += src[i + 1] || ""; i += 2; continue; }
        if (src[i] === "\n" && q !== "`") break;          // unterminated — bail
        buf += src[i++];
      }
      i++; out.push(buf); continue;
    }
    i++;
  }
  return out;
}
/* HTML is not JS: its visible text lives between tags, not in quotes. Strip
 * comments and tags and read what is left, plus the attribute values (title=,
 * aria-label=) that a user can hear or hover. */
function htmlVisible(src) {
  const noComments = src.replace(/<!--[\s\S]*?-->/g, "");
  return [noComments.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ")]
    .concat(stringLiterals(noComments));
}

/* ⭐ ONE DELIBERATE CARVE-OUT, NAMED SO IT IS NOT MISTAKEN FOR AN OVERSIGHT.
 * `✕` is the Fact Sheet drawer's close control. Sam's rule is against CHEESY
 * glyphs — "if we use them they should be muted, simple" — and a close mark is
 * the same class of standard, muted affordance as the disclosure caret his rule
 * explicitly permits and #1231 kept. It also carries aria-label="Close Sierra",
 * so it is not the only cue. A future session sweeping for glyphs should leave
 * it; if Sam decides otherwise, delete this line and the test states the rule. */
const ALLOWED = new Set(["\u2715"]);

function glyphsIn(strings) {
  return strings.filter(function (t) {
    return GLYPH.test(String(t).split("").filter(function (ch) { return !ALLOWED.has(ch); }).join(""));
  });
}

/* Pull the AUDIENCES label list out of a source file by reading its literal.
 * Parsed rather than imported because these are three standalone browser files
 * with no module boundary between them. */
function audienceLabels(src, what) {
  const m = src.match(/var AUDIENCES = \[([\s\S]*?)\];/);
  if (!m) throw new Error("no AUDIENCES array found in " + what);
  const out = [];
  const re = /\{\s*k:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'\s*\}/g;
  let hit;
  while ((hit = re.exec(m[1]))) out.push([hit[1], hit[2]]);
  return out;
}

// ── 1. ⭐ THE ALIGNMENT ITSELF — the two audience pickers must be identical ────
block("audience alignment", function () {
  const a = audienceLabels(CHAT, "cpl_chat.js");
  const b = audienceLabels(PAGE, "sierra/sierra.js");
  check("cpl_chat.js declares 5 audiences", a.length === 5);
  check("sierra/sierra.js declares 5 audiences", b.length === 5);
  check("⭐ the two audience lists are identical, keys and labels, in order",
    JSON.stringify(a) === JSON.stringify(b));
  // Pinned so a "strip the glyphs" pass that also blanked a label cannot pass.
  check("labels kept their WORDS", b.every(function (p) { return /[A-Za-z]{3}/.test(p[1]); }));
  check("labels are distinct from one another",
    new Set(b.map(function (p) { return p[1]; })).size === 5);
  check("the shared persistence key still matches",
    /cplSierraAudience\.v1/.test(CHAT) && /cplSierraAudience\.v1/.test(PAGE));
});

// ── 2. No glyphs in what a visitor sees, on any Sierra surface ────────────────
block("glyph scan", function () {
  [["cpl_chat.js", stringLiterals(CHAT)], ["sierra/sierra.js", stringLiterals(PAGE)],
   ["sierra/index.html", htmlVisible(PAGE_HTML)],
   ["fact-sheet/factsheet_sierra.js", stringLiterals(DRAWER)]].forEach(function (pair) {
    const hits = glyphsIn(pair[1]);
    check(pair[0] + ": no glyphs in visible strings"
      + (hits.length ? " — found: " + String(hits[0]).trim().slice(0, 70) : ""), hits.length === 0);
  });
});

// ── 3. The words that replaced the glyphs are actually there ──────────────────
// Asserted per surface, because the failure mode is a partial sweep: one file
// updated, the neighbouring one missed, which is the exact state #1231 left.
block("replacement words", function () {
  [["sierra/sierra.js", PAGE], ["cpl_chat.js", CHAT]].forEach(function (pair) {
    const s = pair[1];
    check(pair[0] + ": Copy pill says Copy", /'Copy'/.test(s));
    check(pair[0] + ": copy confirms with a word", /'Copied'/.test(s));
    check(pair[0] + ": copy failure tells you what to press", /Press Ctrl\+C/.test(s));
    check(pair[0] + ": rating buttons are Helpful / Not helpful",
      /'Helpful'/.test(s) && /'Not helpful'/.test(s));
    // Distinctness matters more than presence: collapsing the two ratings into
    // one label would read as glyph-free and be wrong.
    check(pair[0] + ": the two ratings are not the same string",
      s.indexOf("'Not helpful'") !== s.indexOf("'Helpful'"));
    // The aria-label is the full sentence and must NOT have been collapsed into
    // the visible word — a screen reader gets the sentence, the eye gets the pill.
    check(pair[0] + ": the full-sentence aria labels survive",
      /This answer was helpful/.test(s) && /This answer was not helpful/.test(s));
  });
  check("Fact Sheet drawer: Beta notice kept its text",
    /Beta\. Please don/.test(DRAWER) && !/\u{1F9EA}/u.test(DRAWER));
  check("Fact Sheet drawer: launcher still says Ask Sierra",
    /'Ask ' \+ NAME/.test(DRAWER));
  check("standalone page: Beta notice kept its text", /class="s-beta">Beta —/.test(PAGE_HTML));
});

// ── 4. The ↗ became a cue, not nothing ────────────────────────────────────────
// Dropping the arrow outright would remove the only warning a keyboard or
// screen-reader user gets before a new tab takes focus. Clipped, not hidden:
// display:none and visibility:hidden both remove an element from the
// accessibility tree, which would delete the warning rather than relocate it.
block("new-tab cue", function () {
  check("the back link no longer renders an arrow", PAGE_HTML.indexOf("map.rccd.edu \u2197") === -1);
  check("⭐ the 'opens in a new tab' cue replaced it",
    /map\.rccd\.edu<span class="s-sr">\(opens in a new tab\)<\/span>/.test(PAGE_HTML));
  check(".s-sr is defined", /\.s-sr\s*\{/.test(PAGE_CSS));
  const rule = (PAGE_CSS.match(/\.s-sr\s*\{[^}]*\}/) || [""])[0];
  check(".s-sr clips rather than removing from the a11y tree",
    /clip-path:\s*inset\(50%\)/.test(rule) && !/display:\s*none/.test(rule)
      && !/visibility:\s*hidden/.test(rule));
});

// ── 5. A word needs the font a glyph did not ──────────────────────────────────
// A <button> inherits neither font-family nor color. With thumbs that was
// invisible; with words the rating pills would render in the UA's default button
// font beside a Copy pill that explicitly opts in. Guarded on BOTH surfaces
// because the two pills sit in the same row on each.
block("pill typography", function () {
  const rule = (PAGE_CSS.match(/\.s-fb-btn\s*\{[^}]*\}/) || [""])[0];
  check("sierra.css: rating pill inherits the page font", /font-family:\s*inherit/.test(rule));
  check("sierra.css: rating pill inherits the text colour", /color:\s*inherit/.test(rule));
  check("sierra.css: 'Not helpful' will not wrap inside its pill", /white-space:\s*nowrap/.test(rule));
  const chatRule = (CHAT.match(/\.cplchat-fb-btn \{[^}]*\}/) || [""])[0];
  check("cpl_chat.js: rating pill inherits the page font", /font-family:inherit/.test(chatRule));
  check("cpl_chat.js: rating pill inherits the text colour", /color:inherit/.test(chatRule));
  check("cpl_chat.js: 'Not helpful' will not wrap inside its pill", /white-space:nowrap/.test(chatRule));
});

// ── 6. RENDERED, not just source — the standalone page's real DOM ─────────────
// The scans above read text. This one boots the page and looks at what a visitor
// actually gets, which is the only claim that matters.
block("rendered page", function () {
  const dom = new JSDOM(PAGE_HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" });
  const w = dom.window;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.fetch = function () { return new Promise(function () {}); };
  // eval, not an appended <script>: jsdom's "outside-only" does not execute
  // scripts found in the DOM, so appending one leaves the page unbooted — and
  // an unbooted page renders ZERO chips, which makes a "no chip carries a
  // glyph" check pass over an empty list. Same boot as sierra_page.test.js.
  w.eval(PAGE);
  // jsdom defers DOMContentLoaded, so wire() would never run and the page would
  // render ZERO chips — which is how "no chip carries a glyph" passes over an
  // empty list. Dispatched deterministically, as sierra_page.test.js does.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));

  const chips = w.document.querySelectorAll("#s-audience .s-aud-chip");
  check("the 5 audience chips render", chips.length === 5);
  const texts = Array.prototype.map.call(chips, function (c) { return c.textContent.trim(); });
  // ⚠ Both of these are `.some()`/`.every()` over `texts`, which are vacuously
  // true on an empty list — so each REQUIRES the five chips as part of its own
  // condition. An unbooted page must fail them, not sail through them.
  check("⭐ no rendered chip carries a glyph",
    texts.length === 5 && !texts.some(function (t) { return GLYPH.test(t); }));
  check("every rendered chip still has a readable label",
    texts.length === 5 && texts.every(function (t) { return /[A-Za-z]{3}/.test(t); }));
  // Compared against the module's OWN live array, not the regex parse above —
  // so this check still means something if the parse ever goes wrong.
  const live = (w.CPL_SIERRA_PAGE || {}).AUDIENCES || [];
  check("the rendered chips match the module's live AUDIENCES",
    live.length === 5 && JSON.stringify(texts) === JSON.stringify(live.map(function (a) { return a.label; })));
  check("the live array matches what cpl_chat.js declares",
    JSON.stringify(live.map(function (a) { return [a.k, a.label]; }))
      === JSON.stringify(audienceLabels(CHAT, "cpl_chat.js")));
  // Scripts are removed from the clone first: an inline <script>'s source is
  // part of body.textContent, so scanning it verbatim would read this file's own
  // explanatory comments as visitor-facing text.
  const clone = w.document.body.cloneNode(true);
  Array.prototype.forEach.call(clone.querySelectorAll("script,style"), function (n) { n.remove(); });
  check("the whole rendered body is glyph-free", !GLYPH.test(clone.textContent));
  // The cue is invisible but present — assert it is in the DOM, since a
  // textContent scan would happily pass if the arrow had simply been deleted.
  check("the new-tab cue is in the rendered DOM",
    (w.document.querySelector(".s-back .s-sr") || {}).textContent === "(opens in a new tab)");
  w.close();
});

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; console.log("  ok   " + r[0]); }
  else console.log("  FAIL " + r[0]);
});
console.log("\nsierra_surfaces_aligned: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
