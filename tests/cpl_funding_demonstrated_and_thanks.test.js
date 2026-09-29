// tests/cpl_funding_demonstrated_and_thanks.test.js
//
// Two of Sam's rulings on the 2026-09-29 open-asks sheet (sheet 3, cards 4 and 5).
//
// CARD 4, "demonstrated". Each Priority Outcomes card read "Current Total: $X
// of $Y Total Possible". Its $X is what the measures show, the minimum
// conditions aside (earnAgg()'s gate-agnostic `earned`), while the College
// Dashboard's Curr columns show what an institution qualifies for: $0 until it
// meets its minimum conditions. One word named two figures. Sam ruled that the
// cards say Demonstrated, the statute's verb (§78093.2(d)(2)); the Curr columns
// and the CSV's "Current total" keep the qualifying figure.
//
// CARD 5, "use". The thank-you an administrator reads after confirming
// participation promised "The Chancellor's Office will acknowledge it", and the
// form's note recorded the attester "for the Chancellor's Office to
// acknowledge". That step left on 2026-09-28 with Mark confirmed and the CO
// Confirm: a self-attestation stands on submit. Sam's words replace both.
//
// ⚠️ THE THANK-YOU IS REACHABLE ONLY ON THE LIVE PATH. Offline, submitOptIn()
// writes the opt-in row and the done flag together, and optinAffordanceHtml()
// returns nothing once a row exists, so a NO_REMOTE fixture never paints the
// thank-you. Live, the POST resolves, the thank-you renders, and it stays until
// the eligibility re-read lands. So Part 5 submits through the real form with a
// stubbed fetch: the POST succeeds and the re-read never returns, which is the
// moment the administrator reads the words.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_demonstrated_and_thanks.test.js`).
const { consumerSrc, check, finish, freshDom, boot, click } = require("./lib/cpl_funding_harness.js");

// Sam's words, verbatim (2026-09-29).
const SAM_THANKS = "Thank you. Your participation is confirmed, and your college counts as participating from today.";
const SAM_NOTE = "Your name and email are recorded for the Chancellor's Office and are not shown publicly.";

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const cardsOf = (doc) => Array.from(doc.querySelectorAll(".cplfund-prio .p"));
const linesOf = (doc) => Array.from(doc.querySelectorAll(".cplfund-prio .p .cplfund-earned-line"));
const LINE = /^Demonstrated: \$[\d,]+ of \$[\d,]+ Total Possible \(\d/;

// ── 4. the priority card's line reads Demonstrated ─────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const cards = cardsOf(doc);
  const lines = linesOf(doc);
  check("4a: every priority card carries its statewide line", lines.length > 0 && lines.length === cards.length);
  check("4b: the line reads Demonstrated: $X of $Y Total Possible (Sam, 2026-09-29)",
    lines.every((l) => LINE.test(flat(l))));
  check("4c: no card says Current Total, in its text or on its hover",
    cards.every((c) => !/Current Total/i.test(c.textContent)) &&
    lines.every((l) => !/Current Total/i.test(l.getAttribute("title") || "")));
  check("4d: the hover opens on Demonstrated and says the minimum conditions do not gate it",
    lines.every((l) => /^Demonstrated: /.test(l.getAttribute("title") || "") &&
      /whether or not each has met its minimum conditions/.test(l.getAttribute("title") || "")));

  // The ruling moved the cards' word only. The Curr columns and the CSV keep
  // Current for the qualifying figure, and the CSV carries both.
  const th = doc.querySelector('th[data-sort="current_total"]');
  check("4e: the College Dashboard's Curr Total Funds header keeps Current for the qualifying figure",
    !!th && /Current Total Funds/.test(th.textContent));
  const head = T._csv().split("\r\n")[1] || "";
  check("4f: the CSV keeps both figures: Current total (qualifying) and Demonstrated (the cards')",
    /(^|,)Current total /.test(head) && /(^|,)Demonstrated /.test(head));

  T._setScenario({ disbursement: "frontload" });
  T.render();
  const fl = linesOf(doc);
  check("4g: under front-load the line still reads Demonstrated, against the full-window Total Possible",
    fl.length > 0 && fl.every((l) => /^Demonstrated: \$[\d,]+ of \$[\d,]+ full-window Total Possible/.test(flat(l))));
  T._setScenario({});
}
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const lines = linesOf(doc);
  check("4h: the public page's cards read Demonstrated too, and never Current Total",
    lines.length > 0 && lines.every((l) => /^Demonstrated: /.test(flat(l))) &&
    cardsOf(doc).every((c) => !/Current Total/i.test(c.textContent)));
}

// ── 5. the note and the thank-you promise no acknowledgment ────────────────
async function part5() {
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();

  const chip = doc.querySelector("[data-optinjump]");
  const college = chip ? chip.getAttribute("data-optinjump") : "";
  if (chip) click(window, chip);
  const wrap = Array.from(doc.querySelectorAll("[data-optinwrap]"))
    .filter((w) => w.getAttribute("data-optinwrap") === college)[0];
  const note = wrap ? Array.from(wrap.querySelectorAll(".cplfund-optin-note")).pop() : null;
  check("5a: the form's note carries Sam's sentence", !!note && flat(note).indexOf(SAM_NOTE) !== -1);
  check("5b: the form's note promises no acknowledgment", !!note && !/acknowledg/i.test(flat(note)));
  if (!wrap) { check("5c-5e: the form opened for " + college, false); return; }

  // The live path: the POST succeeds; the eligibility re-read never returns.
  const calls = [];
  window.CPL_FUNDING_NO_REMOTE = false;
  window.fetch = function (url, opts) {
    const method = (opts && opts.method) || "GET";
    calls.push(method + " " + url);
    if (method === "POST" && /\/rest\/v1\/cpl_funding_participation$/.test(url)) {
      return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve([]); } });
    }
    return new Promise(function () {});
  };
  wrap.querySelector('[data-optinfield="name"]').value = "Jane Admin";
  wrap.querySelector('[data-optinfield="title"]').value = "VPAA";
  wrap.querySelector('[data-optinfield="email"]').value = "jane@college.edu";
  const submit = Array.from(doc.querySelectorAll("[data-optinsubmit]"))
    .filter((b) => b.getAttribute("data-optinsubmit") === college)[0];
  if (submit) click(window, submit);
  await new Promise((r) => setTimeout(r, 0));

  const done = doc.querySelector(".cplfund-optin-done");
  check("5c: the submit went out as the live POST",
    calls.some((c) => /^POST .*\/rest\/v1\/cpl_funding_participation$/.test(c)));
  check("5d: the thank-you reads Sam's words exactly", !!done && flat(done) === SAM_THANKS);
  check("5e: the thank-you promises no acknowledgment",
    !!done && !/acknowledg|in the meantime/i.test(flat(done)));

  // The source, for the branches no fixture paints: nothing in the opt-in
  // affordance promises the Chancellor's Office an acknowledgment step.
  const m = consumerSrc.match(/function optinAffordanceHtml\([\s\S]*?\n  \}\n/);
  const code = m ? m[0].replace(/^\s*\/\/.*$/gm, "") : "";
  check("5f: optinAffordanceHtml() holds no acknowledgment promise in any branch",
    !!code && !/acknowledg/i.test(code) && !/in the meantime/i.test(code));
}

part5().then(finish, function (e) { check("part 5 threw: " + (e && e.message), false); finish(); });
