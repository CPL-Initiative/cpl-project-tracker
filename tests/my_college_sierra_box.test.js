// My College — the Sierra box after Sam's 2026-08-21 pass (jsdom).
//
// Four asks, and three of them regress SILENTLY — the page keeps rendering, it
// just goes back to being confusing:
//
//  (1) ONE CLUSTER OF QUESTIONS, BELOW THE ROLE CHIPS. There were two, with the
//      role picker between them: the tab's own college-specific list ABOVE the
//      widget, and the widget's generic starters BELOW its "I'm a…" chips.
//      Clicking one of the upper set with no role chosen called needAudience(),
//      whose message reads "tap who you are above" — and the chips were BELOW
//      it. The sentence was literally wrong and the reader had two lists to
//      reconcile. Sam: "select a pre-seeded question and are not prompted for
//      their role — confusing."
//
//  (2) THE GENERIC STARTERS NAME ANOTHER COLLEGE. "Does Riverside City College
//      offer firefighter CPL?" is a fine starter on the CPL Assistant tab and
//      is nonsense on Cabrillo's own page. A host that knows whose page this is
//      REPLACES the list — it does not add a second one.
//
//  (3) THE PANE'S LOADING PLACEHOLDER IS AN INLINE `text-align:center`, and
//      inline beats every selector. It was the reason prose rendered as a
//      ragged centred column inside a left-aligned, full-width tab — the
//      "narrow paragraphs together with full width content" Sam reported. A
//      centred paragraph looks like a design choice, so nothing reports it.
//
//  (4) THE STRUCK SENTENCE STAYS STRUCK. "Ask Sierra anything about CPL at this
//      college…" sat three lines above a box whose own first line is "Ask her
//      anything about credit for prior learning." That duplicate has now grown
//      back twice (#1231 removed the first copy); assert its absence, paired
//      with a positive control so deleting the header would not pass.
//
// ⚠ Budget: ~44 MB per BOOTED jsdom window over a ~40 MB floor, and a window is
// never reclaimed until the process ends (docs/kb-notes/methodology-a-test-file-
// is-a-memory-budget.md). This file boots four. Past ~15, start another suite.
//
// Run from repo root: `npm test` (or `node tests/my_college_sierra_box.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — setup did not throw", false, String(e && e.message)); }
}

const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");

/* The pane as the two mirrored HTMLs actually ship it — dashed border, tinted
 * background, 28px padding and `text-align:center`, all INLINE. Rendering into
 * a bare <div> would make check (3) unfailable, which is the trap Sky175 named:
 * a fixture that cannot express the defect proves nothing about the fix. */
const PANE = '<div id="college-briefing-root" style="border: 1px dashed var(--border-strong); '
  + 'border-radius: 8px; background: var(--surface-subtle); color: var(--text-muted); '
  + 'padding: 28px; text-align: center;">Loading College Briefing&hellip;</div>';

function loadTab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + PANE + "</body></html>",
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");            // team-gated tab
  w.localStorage.setItem("cplSierraAudience.v1", "student");
  // Confirmed for this browser-tab session unless a fixture asks otherwise —
  // see (6). localStorage alone now means "remembered from an earlier visit".
  if (!opts.remembered) w.sessionStorage.setItem("cplSierraAudienceOk.v1", "student");
  w.fetch = function () { return new Promise(function () {}); }; // never resolves
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  [TEAM, CHAT, BRIEFING].forEach(function (src) {
    const s = w.document.createElement("script");
    s.textContent = src;
    w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  M._state.data = {
    colleges: ["Cabrillo College"], summaryByName: {}, raw: {},
    briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 1", year: "1" }
  };
  M._state.scope = opts.scope || "college";
  if ((opts.scope || "college") === "college") M._state.college = "Cabrillo College";
  if (opts.district) M._state.district = opts.district;
  M.render(w.document.getElementById("college-briefing-root"));
  return { w: w, M: M, root: w.document.getElementById("college-briefing-root") };
}

// ── (1) One cluster, and the role comes first ──────────────────────────────
block("(1)", function () {
  const { root } = loadTab();
  const aud = root.querySelector(".cplchat-audience");
  const rows = root.querySelectorAll(".cplchat-suggest");
  check("(1) the role chips render inside the box", !!aud);
  check("(1) ⭐ there is EXACTLY ONE cluster of suggested questions",
    rows.length === 1, "found " + rows.length);
  check("(1) …and the tab prints no second one of its own",
    !root.querySelector(".cb-asks") && !root.querySelector("button.cb-ask"));

  // The order IS the fix: needAudience() says "tap who you are above", so the
  // chips have to be above. DOCUMENT_POSITION_FOLLOWING === 4.
  const ordered = !!(aud && rows.length === 1
    && (aud.compareDocumentPosition(rows[0]) & 4));
  check("(1) ⭐ the questions come AFTER the role chips, so the role is read first",
    ordered, "needAudience() points 'above'; a cluster above the chips makes it wrong");

  // Paired with a positive control: a strip that rendered no questions at all
  // would satisfy every check above.
  const chips = rows.length === 1 ? rows[0].querySelectorAll("button") : [];
  check("(1) …and there are actually questions in it", chips.length >= 2);
  check("(1) the cluster still carries its heading",
    !!(rows.length === 1 && rows[0].querySelector(".cplchat-suggest-lab")));
});

// ── (2) A college's page asks about that college ───────────────────────────
block("(2)", function () {
  const { root } = loadTab();
  const txt = (root.querySelector(".cplchat-suggest") || {}).textContent || "";
  check("(2) ⭐ the questions name THIS college", /Cabrillo College/.test(txt), JSON.stringify(txt));
  check("(2) ⚠ …and never another one",
    !/Riverside City College/.test(txt),
    "the generic starter is right on the CPL Assistant tab and nonsense here");

  /* ⭐ A GROUP SCOPE GETS GROUP QUESTIONS — NOT THE PUBLIC STARTERS.
   * #1274 passed null here, which returns the widget to its generic list, one
   * of which names Riverside City College. Sam, 2026-08-21, on a screenshot of
   * the LACCD page: "The pre-seeded questions are not adjusted to the selected
   * org… I know this may be due to our joint use of Sierra public use and
   * Sierra My College use." Right about the cause; the fix is that a host which
   * knows whose page this is owns the questions in EVERY scope. */
  const st = loadTab({ scope: "statewide" });
  const stxt = (st.root.querySelector(".cplchat-suggest") || {}).textContent || "";
  check("(2) ⭐ a statewide view never falls through to the public starters",
    !/Riverside City College/.test(stxt), JSON.stringify(stxt));
  check("(2) …nor keeps the last college's questions",
    !/Cabrillo College/.test(stxt), JSON.stringify(stxt));
  check("(2) …and asks something statewide-shaped instead",
    /statewide/i.test(stxt) && stxt.length > 40, JSON.stringify(stxt));

  const D = "Los Angeles Community College District";
  const dis = loadTab({ scope: "district", district: D });
  const dtxt = (dis.root.querySelector(".cplchat-suggest") || {}).textContent || "";
  check("(2) ⭐ a district view names THAT district", dtxt.indexOf(D) >= 0, JSON.stringify(dtxt));
  check("(2) ⚠ …and still names no college at all",
    !/Riverside City College/.test(dtxt) && !/Cabrillo College/.test(dtxt), JSON.stringify(dtxt));

  /* ⚠ SIERRA HAS NO DISTRICT DIMENSION — verified 2026-08-21: zero columns in
   * the public schema are named district, and districtIndex() builds the
   * grouping client-side from the funding roster. So the district may be named
   * only in an ADVISORY question, where a name cannot become a false figure.
   * A "which of my colleges has the most units waiting?" chip would ask her
   * something this page can answer and she cannot. */
  const M2 = dis.M;
  const dq = M2._groupQuestions("district", D);
  check("(2) ⚠ no district question asks for a FIGURE she cannot retrieve",
    dq.every(function (q) {
      return q.indexOf(D) < 0 || !/(how many|how much|most|units|students|waiting|rank)/i.test(q);
    }), JSON.stringify(dq));
  check("(2) ⚠ …and no member college is singled out (rollup sorts alphabetically for the same reason)",
    dq.every(function (q) { return !/College\b/.test(q.replace(D, "")); }), JSON.stringify(dq));

  // Positive control: a group list that came back empty would pass every
  // "does not contain" check above.
  check("(2) the group list is not simply empty",
    dq.length >= 3 && dis.root.querySelectorAll(".cplchat-suggest button").length >= 3);
});

/* ── (6) The remembered role is confirmed HERE, on the tab Sam was looking at ─
 * The unit-level guards live in tests/cpl_chat_audience.test.js (block e). This
 * one is the integration: the gate has to be live where the pre-seeded
 * questions are, because clicking one of those is what Sam did. */
block("(6)", function () {
  const { root } = loadTab({ remembered: true });
  const row = root.querySelector(".cplchat-audience");
  check("(6) ⭐ a role carried in from another Sierra surface renders PROVISIONAL",
    !!row && !!row.querySelector(".cplchat-aud-chip.remembered") &&
    !row.querySelector(".cplchat-aud-chip.on"));
  check("(6) …and says so in words, not just an outline",
    /previous visit/i.test((row.querySelector(".cplchat-aud-note") || {}).textContent || ""));

  // Clicking a PRE-SEEDED QUESTION is the exact path Sam described.
  const q = root.querySelector(".cplchat-suggest button");
  check("(6) precondition: there is a pre-seeded question to click", !!q);
  q.click();
  const status = root.querySelector(".cplchat-status");
  check("(6) ⭐ clicking it prompts for the role instead of answering",
    /Student \/ future student/.test(status.textContent) &&
    /cplchat-confirm/.test(status.className), JSON.stringify(status.textContent));
  check("(6) ⚠ the question is held in the box, not lost",
    /Cabrillo College/.test(root.querySelector(".cplchat-input").value || ""));

  // And a CONFIRMED role is not interrogated — the gate must not nag.
  const ok = loadTab();
  const okRow = ok.root.querySelector(".cplchat-audience");
  check("(6) a confirmed role renders as confirmed, with no note",
    !!okRow.querySelector(".cplchat-aud-chip.on") && !okRow.querySelector(".cplchat-aud-note"));
});

// ── (3) The pane's inline centring is shed ─────────────────────────────────
block("(3)", function () {
  const { root } = loadTab();
  check("(3) ⭐ the inline text-align:center is cleared before anything renders",
    !root.style.textAlign, JSON.stringify(root.style.textAlign));
  check("(3) …along with the rest of the loading placeholder",
    !root.style.border && !root.style.padding && !root.style.background);
  // It is a real style attribute on a real pane, or (3) proves nothing.
  const fresh = new JSDOM("<!doctype html><html><body>" + PANE + "</body></html>");
  check("(3) precondition: the shipped pane really does centre its contents",
    fresh.window.document.getElementById("college-briefing-root").style.textAlign === "center");
});

// ── (4) The struck sentence stays struck ───────────────────────────────────
block("(4)", function () {
  const { root } = loadTab();
  const txt = root.textContent || "";
  check("(4) ⭐ the header no longer describes the assistant below it",
    !/Ask Sierra anything about CPL/.test(txt) && !root.querySelector(".cb-welcome-p"));
  check("(4) …and the assistant still introduces herself, once",
    /Ask her anything about credit for prior learning/.test(txt));
  check("(4) the caution survived the yellow box being deleted",
    /development phase/.test(txt) && /questions are logged/.test(txt) && !/Beta — in development/.test(txt));
  check("(4) positive control: the header still names the college and its controls",
    /Welcome, Cabrillo College/.test(txt) && !!root.querySelector("#cb-report"));
});

// ── (5) Two panes, one widget: source-level traps ──────────────────────────
// Both are invisible in a one-pane fixture, and both have bitten this file
// before (see the `inputEl` note in cpl_chat.js). Asserted against the source
// because reproducing them needs the whole dashboard mounted twice.
block("(5)", function () {
  /* ⚠ SCAN THE CODE, NOT THE COMMENTS. The first cut of this check failed
   * against the FIXED file, because the comment above the fix quotes the call
   * it replaced. A source scan that reads prose is a check that can go red for
   * documenting itself — and, in the other direction, green because a comment
   * happens to contain the string it wants. Strip line comments first. */
  const CODE = CHAT.split("\n").filter(function (l) { return !/^\s*(\/\/|\*|\/\*)/.test(l); }).join("\n");
  check("(5) ⚠ the starter chips are removed by REFERENCE, not by a document id lookup",
    !/getElementById\('cplchat-suggest'\)/.test(CODE) && /chipsEl\.remove\(\)/.test(CODE),
    "two panes can hold a row at once; the id lookup clears whichever is earlier in the document");
  check("(5) ⚠ the dedicated CPL Assistant pane clears any host-supplied list",
    /hostSuggestions = null;[\s\S]{0,80}build\(host\);/.test(CODE),
    "a college's questions must not follow the reader onto a pane that never named it");
  check("(5) the widget still ships generic starters for that pane",
    /Does Riverside City College offer firefighter CPL\?/.test(CHAT));
});

// ── report ──
let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\nmy_college_sierra_box.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
