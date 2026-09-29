// tests/sierra_send_note.test.js
//
// Sam, 2026-08-14, on the "Send note" composer under a Sierra answer:
//
//   "it turns gray but nothing else — not sure if it registers."
//
// It DID register — his note reached sierra_feedback, turn_id 6e995f3d, 449
// chars. But nothing on screen said so, and the handoff read that as a pure
// feedback problem ("clear or close the composer on success"). It was not:
// the code ALREADY called `noteWrap.hidden = true`, and the call was INERT.
//
// FOUR DEFECTS, one root cause and three consequences:
//
//   1. ROOT. `.cplchat-fb-note { display:flex }` (and `.s-fb-note` in
//      sierra.css) is an AUTHOR rule, which beats the UA stylesheet's
//      `[hidden] { display:none }`. So `hidden` did nothing on that element.
//   2. The composer therefore never closed on success, leaving the typed text
//      sitting there looking unsent.
//   3. It was also on screen from the START (the constructor sets
//      hidden = true), instead of appearing once a rating is given — so a
//      visitor could type a note, press Send, and hit the `!rating` early
//      return, which does NOTHING AT ALL. Silently.
//   4. The confirmation was written into `hint`, which lives at the far end of
//      the rating row next to Copy — and it was UNCONDITIONAL. `upsert()` was
//      never awaited, fetch does not reject on HTTP errors, and
//      sierra_feedback_upsert RAISES on an invalid rating. So a note that never
//      saved still displayed "✓ Note sent — thank you!".
//
// (4) is the one that matters most and is why "allow a note without a rating"
// would have been the WRONG fix: the RPC rejects a null rating, sendFeedback
// swallowed the error, and the visitor would have been thanked for a note that
// was thrown away.
//
// Run from repo root: `npm test` (or `node tests/sierra_send_note.test.js`).

const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log((cond ? "  ok   " : "  FAIL ") + name);
}

const chatJs = fs.readFileSync(path.join(__dirname, "..", "cpl_chat.js"), "utf8");
const sierraJs = fs.readFileSync(path.join(__dirname, "..", "sierra", "sierra.js"), "utf8");
const sierraCss = fs.readFileSync(path.join(__dirname, "..", "sierra", "sierra.css"), "utf8");

// ── 1. THE ROOT: [hidden] must beat the display rule ────────────────────────
// Asserted BEHAVIOURALLY, not just textually — a CSS rule you can read is not
// a CSS rule the browser applies. jsdom resolves the cascade, so this fails
// against the pre-fix stylesheet for the real reason.
const { JSDOM } = require("jsdom");

function hiddenWins(css, className) {
  const dom = new JSDOM(
    `<style>${css}</style><div class="${className}" hidden id="t"></div>`,
  );
  const el = dom.window.document.getElementById("t");
  return dom.window.getComputedStyle(el).display === "none";
}

// The dashboard widget injects its CSS from JS; pull the two rules out of the
// array literal so the test reads what actually ships.
const chatNoteCss = (chatJs.match(/'\.cplchat-fb-note \{[^']*'/g) || [])
  .concat(chatJs.match(/'\.cplchat-fb-note\[hidden\] \{[^']*'/g) || [])
  .join("\n").replace(/'/g, "");

check(
  "cpl_chat.js: [hidden] actually computes to display:none on the composer",
  hiddenWins(chatNoteCss, "cplchat-fb-note"),
);
check(
  "sierra.css: [hidden] actually computes to display:none on the composer",
  hiddenWins(sierraCss, "s-fb-note"),
);
// Guard the general lesson, so a future `display` rule on a hidden-toggled
// element does not silently reintroduce this.
check(
  "cpl_chat.js ships an explicit [hidden] companion rule",
  /\.cplchat-fb-note\[hidden\] \{ display:none; \}/.test(chatJs),
);
check(
  "sierra.css ships an explicit [hidden] companion rule",
  /\.s-fb-note\[hidden\] \{ display: none; \}/.test(sierraCss),
);

// ── 2 & 4. Success is CONFIRMED, not assumed ────────────────────────────────
for (const [label, src] of [["cpl_chat.js", chatJs], ["sierra.js", sierraJs]]) {
  check(
    `${label}: sendFeedback resolves on res.ok rather than swallowing everything`,
    /return !!\(res && res\.ok\);/.test(src),
  );
  check(
    `${label}: a thrown/rejected send resolves FALSE, never undefined`,
    /function \(\) \{ return false; \}/.test(src) &&
      /Promise\.resolve\(false\)/.test(src),
  );
  check(
    `${label}: the note click AWAITS the result before confirming`,
    /upsert\(n\)\.then\(function \(ok\) \{/.test(src),
  );
  check(
    `${label}: success clears the typed text`,
    /ok\)\s*\{[\s\S]{0,200}noteIn\.value = '';/.test(src),
  );
  check(
    `${label}: success closes the composer's input and button`,
    /noteIn\.hidden = true;[\s\S]{0,60}noteBtn\.hidden = true;/.test(src),
  );
  // THE ONE THAT MATTERS. A failed write must not read as a sent note.
  check(
    `${label}: failure KEEPS the typed text and says it did not send`,
    /Not sent — your note is still here, try again\./.test(src) &&
      !/else \{[\s\S]{0,200}noteIn\.value = '';/.test(src),
  );
  // Index-based rather than a fixed character window: a window silently stops
  // covering the branch the moment a comment is added, which is the same rot
  // this PR repairs in two other suites. This also asserts something stronger —
  // the re-enable must happen ONLY on failure. Re-enabling on success would
  // invite a duplicate send of a note already saved.
  const okIdx = src.indexOf("if (ok) {");
  const reEnable = (src.match(/noteBtn\.disabled = false;/g) || []).length;
  const reEnableIdx = src.indexOf("noteBtn.disabled = false;");
  const failMsgIdx = src.indexOf("Not sent — your note is still here");
  check(
    `${label}: failure re-enables the button, and ONLY failure does`,
    reEnable === 1 && okIdx > -1 && reEnableIdx > okIdx && reEnableIdx < failMsgIdx,
  );
  check(
    `${label}: the confirmation renders at the button, not in the rating row`,
    /noteDone/.test(src) && !/hint\.textContent = '✓ Note sent/.test(src),
  );
}

// ── 3. The rating dependency is now VISIBLE, not a silent early return ──────
// The composer stays hidden until a rating exists. That is what makes the
// `!rating` guard unreachable in normal use instead of eating a click.
check(
  "cpl_chat.js: the composer still starts hidden (revealed on rating)",
  /var noteWrap = el\('div', \{ className: 'cplchat-fb-note' \}[\s\S]{0,120}noteWrap\.hidden = true;/.test(chatJs),
);
check(
  "cpl_chat.js: a rating reveals the composer",
  /noteWrap\.hidden = false;/.test(chatJs),
);
check(
  "sierra.js: the composer still starts hidden (revealed on rating)",
  /noteWrap\.hidden = true;/.test(sierraJs) && /noteWrap\.hidden = false;/.test(sierraJs),
);

const failed = results.filter((r) => !r.ok).length;
console.log(
  "\nsierra_send_note.test.js: " +
    (results.length - failed) + "/" + results.length + " checks passed",
);
process.exit(failed ? 1 : 0);
