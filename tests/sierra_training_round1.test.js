// Sierra Training, round 1 — the redesign Sam approved on 2026-09-28
// ("Sierra looks good"), from the mockup at
// https://claude.ai/artifact/Agmbu7UNGRcdEf48Sx5PTi. jsdom guard suite.
//
// Each block guards a way the port can go wrong while the tab still renders —
// a regression here reads as a design choice, so nothing else reports it:
//
//  (1) THE NUMBERS ARE VIEWS. "Still to do" and "Thumbs-down" set the WHOLE
//      feedback filter, dropdowns included. The two defaults disagree on
//      purpose (the list opens on "still to do", the thumbs-down number counts
//      every status), so a card that set only Rating would list fewer rows than
//      its own number. A lit card pressed again shows everything. The two
//      gap cards only move the reader and never light up; "Instructions in
//      use" lists the switched-on rows.
//  (2) "Showing N of M: … · Show all" says what the list holds — N is the rows
//      on screen, M what the list can hold — in plain words, never a stored
//      value like "punt" or "cobi-tab". Changes reach a screen reader through
//      one polite region that lives OUTSIDE the re-rendered markup.
//  (3) NO REMOVED GLYPH RENDERS (👍 👎 📬 ⛏️ 🛡️ 📝 ➕ ⧉ ✓ ✏️ 💾 🚧), with the kept
//      ⚠ and ▸ as the positive control that a real render was scanned.
//  (4) THE STATUS IS ONE SEGMENTED CONTROL whose aria-pressed follows the
//      stored state, named "Mark this", and not disabled when pressed.
//  (5) "TRY IT IN: MY COLLEGE". The hand-off key stays a plain string; a second
//      key names the destination. Without it cpl_chat.js picked the pane by
//      suppression and typed the question into the HIDDEN CPL Assistant input,
//      burning the key. My College builds its box lazily inside a collapsible
//      section, so the question must land from mountInto(), open the section,
//      and survive the re-renders that follow. "Try it in: Sierra" asks Sierra
//      AI over this tab since S398 (CPL_CHAT.open, sent at once), and a
//      question waiting under the key without a destination goes to her own box.
//      (5d) BOTH WORDS, ALWAYS (Sam's ruling, 2026-09-29, sheet 3 card 12, kept
//      the word Sierra; S398 gave it a place of its own on every site): the
//      Sierra button opens her over this tab and sends, focus comes back to it,
//      and My College still delivers into My College's own box, never hers.
//  (6) FIRST LIGHT TOKENS ONLY: every var(--x) the tab's stylesheet uses is
//      defined in index.html's LIGHT :root or is one of the tab's own
//      `--sit-*` locals — the undefined --brick/--danger-text/--mustard/
//      --brand(-soft) painted their raw fallbacks in light. No raw colors.
//  (7) render() SHEDS THE PLACEHOLDER'S INLINE CENTERING and dashed frame
//      (the fixture is the style index.html actually ships).
//  (8) Item headers are buttons: Enter/Space, aria-expanded, aria-controls only
//      at a body that exists, focus back on the header after the re-render. The
//      instructions' headers hold controls and are NOT buttons. A long answer
//      box is focusable and named exactly while it overflows.
//
// ⚠ Budget: ~44 MB per booted jsdom window (docs/kb-notes/methodology-a-test-
// file-is-a-memory-budget.md). This file boots ten.
//
// Run from repo root: `npm test` (or `node tests/sierra_training_round1.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
async function block(label, fn) {
  try { await fn(); } catch (e) { check(label + " — driver threw: " + (e && e.stack || e), false); }
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));

const SRC = fs.readFileSync("sierra_training.js", "utf8");
const DEFAULTS = fs.readFileSync("sierra_rule_defaults.js", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");

// The loading placeholder exactly as the shipped HTML carries it.
const PANE_STYLE = (INDEX.match(/<div id="sierra-training-root" style="([^"]*)"/) || [])[1] || "";

const Q_KEY = "cplSierraTestQ.v1";
const DEST_KEY = "cplSierraTestDest.v1";
const NOW = Date.now();
const iso = (h) => new Date(NOW - h * 3600e3).toISOString();

// Six real rows and one CI row. The counts are chosen to DIFFER:
// still to do (not addressed) = f1 f2 f5 = 3 · thumbs-down (any status) = f1 f2 f3 f4 = 4
// · everything = 6. A card that set only one field lands on a third number.
const FEEDBACK = [
  { turn_id: "f1", rating: "down", status: "new", question: "what about comptia", response: "an answer", note: "not helpful", audience: "student", page: "sierra", created_at: iso(1) },
  { turn_id: "f2", rating: "down", status: "triaged", question: "welding", response: "an answer", audience: null, page: "cobi-tab", created_at: iso(2) },
  { turn_id: "f3", rating: "down", status: "addressed", question: "cpr", response: "an answer", audience: "student", page: "sierra", created_at: iso(3) },
  { turn_id: "f4", rating: "down", status: "addressed", question: "nursing", response: "an answer", audience: "faculty", page: "sierra", created_at: iso(4) },
  { turn_id: "f5", rating: "up", status: "new", question: "cna to lvn", response: "an answer", audience: "student", page: "sierra", created_at: iso(5) },
  { turn_id: "f6", rating: "up", status: "addressed", question: "ap exams", response: "an answer", audience: "student", page: "cobi-tab", created_at: iso(6) },
  { turn_id: "ci1", rating: "down", status: "ci", question: "smoke", response: "x", audience: "student", page: "smoke", created_at: iso(1) },
];
// Gaps: t1 open · t2 handled · t3 left as is; t4 is no gap; t5 is the CI suite.
const TURNS = [
  { id: 1, session_id: "s1", question: "who is the contact at mesa", response: "An answer.", top_similarity: 0.2, created_at: iso(1), audience: "student" },
  { id: 2, session_id: "s2", question: "does cerritos take nccer", response: "I don't have that.", top_similarity: 0.9, created_at: iso(2), audience: null },
  { id: 3, session_id: "s3", question: "firefighter credit", response: "An answer.", top_similarity: null, created_at: iso(3), audience: "student" },
  { id: 4, session_id: "s4", question: "a clean one", response: "Here you go.", top_similarity: 0.95, created_at: iso(4), audience: "student" },
  { id: 5, session_id: "smoke-ci", question: "robot", response: "I don't have that.", top_similarity: 0.1, created_at: iso(1), audience: "student" },
];
const REVIEWS = { 2: { turn_id: 2, status: "resolved", updated_by: "sam@rccd.edu" }, 3: { turn_id: 3, status: "wont_fix", updated_by: "sam@rccd.edu" } };
const GUIDANCE = [
  { id: "g1", rule: "Name the college.", kind: "directive", active: true, created_by: "(team)", created_at: iso(10) },
  { id: "g2", rule: "Tables: College | Credit.", kind: "display", active: true, created_by: "(team)", created_at: iso(20) },
  { id: "g3", rule: "An old rule.", kind: "directive", active: false, created_by: "(team)", created_at: iso(30) },
];

function sierraWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>'
    + '<div class="main-container"><div id="sierra-training-root" style="' + PANE_STYLE + '">Loading</div></div>'
    + "</body></html>", { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (!opts.signedOut) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.alert = function () {};
  w.confirm = function () { return true; };
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } });
  };
  [DEFAULTS, SRC].forEach(function (src) {
    const el = w.document.createElement("script");
    el.textContent = src;
    w.document.body.appendChild(el);
  });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  if (!opts.signedOut) {
    api._state.feedback = JSON.parse(JSON.stringify(FEEDBACK));
    api._state.turns = JSON.parse(JSON.stringify(TURNS));
    api._state.turnReviews = JSON.parse(JSON.stringify(REVIEWS));
    api._state.guidance = JSON.parse(JSON.stringify(GUIDANCE));
  }
  return { w: w, api: api, root: w.document.getElementById("sierra-training-root") };
}
const qs = (root, sel) => root.querySelector(sel);
function showingNums(root, id) {
  const p = qs(root, "#" + id);
  const t = p ? p.textContent : "";
  const m = /Showing (\d+) of (\d+)/.exec(t) || /Showing all (\d+)/.exec(t);
  if (!m) return { text: t, n: null, total: null };
  return { text: t, n: +m[1], total: +(m[2] || m[1]) };
}
function rowsIn(root, listId) { return root.querySelectorAll("#" + listId + " > .sit-row").length; }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

(async function main() {
  // ── (1)+(2) the number cards are views, and the line says what the list holds ──
  await block("(1)", async function () {
    const { w, api, root } = sierraWin();
    api.render(root);
    const card = (k) => qs(root, '[data-stat="' + k + '"]');
    const num = (k) => +card(k).querySelector(".n").textContent;

    check("(1) the five numbers are real buttons",
      root.querySelectorAll('.sit-stat > button[type="button"][data-stat]').length === 5);
    check("(1) the counts are the ones this fixture was built to separate (3 / 4)",
      num("todo") === 3 && num("down") === 4, "todo=" + num("todo") + " down=" + num("down"));
    check("(1) the default view IS \"still to do\", so that card starts lit",
      card("todo").getAttribute("aria-pressed") === "true" && card("down").getAttribute("aria-pressed") === "false");
    check("(1) the filtering cards name the list they control",
      card("todo").getAttribute("aria-controls") === "sit-fb-list" && !!qs(root, "#sit-fb-list"));
    let s = showingNums(root, "sit-fb-showing");
    check("(2) ⭐ the line counts what the list shows (still to do)",
      s.n === rowsIn(root, "sit-fb-list") && s.n === num("todo") && s.total === 6,
      JSON.stringify(s) + " rows=" + rowsIn(root, "sit-fb-list"));
    check("(2) the old \"N of M\" count is gone", !qs(root, ".sit-count"));

    // Thumbs-down: the whole filter, not one field of it.
    click(w, card("down"));
    check("(1) ⭐ pressing Thumbs-down lists EXACTLY what its number counts",
      rowsIn(root, "sit-fb-list") === num("down"),
      rowsIn(root, "sit-fb-list") + " rows for a card reading " + num("down")
      + " — a card that sets Rating alone keeps the still-to-do filter and shows fewer");
    check("(1) ⭐ …and sets the dropdowns to match (Rating: thumbs-down, Status: Everything)",
      qs(root, '[data-f="fRating"]').value === "down" && qs(root, '[data-f="fStatus"]').value === "");
    check("(1) the pressed card lights and the other goes out",
      card("down").getAttribute("aria-pressed") === "true" && card("todo").getAttribute("aria-pressed") === "false");
    check("(1) focus stays on the card the reader pressed", w.document.activeElement === card("down"));
    s = showingNums(root, "sit-fb-showing");
    check("(2) ⭐ the line follows: Showing 4 of 6: thumbs-down",
      s.n === 4 && s.total === 6 && /: thumbs-down/.test(s.text) && !!qs(root, '#sit-fb-showing [data-show-all="fb"]'),
      JSON.stringify(s.text));
    const live = w.document.getElementById("sit-live");
    check("(2) the change is announced through one polite region beside the root",
      !!live && live.getAttribute("aria-live") === "polite" && !root.contains(live)
      && /Showing 4 of 6: thumbs-down/.test(live.textContent), live && JSON.stringify(live.textContent));

    // Pressing a lit card again shows everything.
    click(w, card("down"));
    s = showingNums(root, "sit-fb-showing");
    check("(1) ⭐ a lit card pressed again shows everything",
      rowsIn(root, "sit-fb-list") === 6 && /Showing all 6/.test(s.text)
      && qs(root, '[data-f="fRating"]').value === "" && qs(root, '[data-f="fStatus"]').value === "",
      JSON.stringify(s.text));
    check("(1) …and neither card is lit on the everything view",
      card("down").getAttribute("aria-pressed") === "false" && card("todo").getAttribute("aria-pressed") === "false");

    click(w, card("todo"));
    check("(1) Still to do lists exactly its number and sets Status to match",
      rowsIn(root, "sit-fb-list") === num("todo") && qs(root, '[data-f="fStatus"]').value === "open"
      && card("todo").getAttribute("aria-pressed") === "true");

    // A dropdown that lands on a card's view lights that card; any other filter
    // shows the words, never the stored value.
    const sel = qs(root, '[data-f="fStatus"]');
    sel.value = "";
    sel.dispatchEvent(new w.Event("change", { bubbles: true }));
    const aud = qs(root, '[data-f="fAudience"]');
    aud.value = "(not set)";
    aud.dispatchEvent(new w.Event("change", { bubbles: true }));
    const page = qs(root, '[data-f="fPage"]');
    page.value = "cobi-tab";
    page.dispatchEvent(new w.Event("change", { bubbles: true }));
    s = showingNums(root, "sit-fb-showing");
    check("(2) ⭐ the line never echoes a stored value (\"(not set)\", \"cobi-tab\")",
      !/\(not set\)|cobi-tab/.test(s.text) && /no role given/.test(s.text) && /inside COBI/.test(s.text),
      JSON.stringify(s.text));
    check("(2) …and still counts the list", s.n === rowsIn(root, "sit-fb-list") && s.n === 1, JSON.stringify(s));
    click(w, qs(root, '[data-show-all="fb"]'));
    check("(2) Show all clears every filter and puts focus on the line",
      rowsIn(root, "sit-fb-list") === 6 && w.document.activeElement === qs(root, "#sit-fb-showing"));

    // The rating filter reads as words; the stored values stay down/up.
    const opts = Array.from(root.querySelectorAll('[data-f="fRating"] option'));
    check("(2) the rating filter reads Any rating · Thumbs-down · Thumbs-up over values '' · down · up",
      opts.map((o) => o.textContent).join("|") === "Any rating|Thumbs-down|Thumbs-up"
      && opts.map((o) => o.value).join("|") === "|down|up");

    // The two cards that only move the reader.
    const gk = qs(root, '[data-g="gKind"]');
    gk.value = "punt";
    gk.dispatchEvent(new w.Event("change", { bubbles: true }));
    s = showingNums(root, "sit-gap-showing");
    check("(2) the gap line says \"she said she didn’t know\", never \"punt\"",
      !/\bpunt\b/i.test(s.text) && /she said she didn’t know/.test(s.text), JSON.stringify(s.text));
    click(w, card("gaps"));
    check("(1) ⭐ \"Questions she struggled with\" lists every gap it counts (handled ones too)",
      rowsIn(root, "sit-gap-list") === num("gaps") && num("gaps") === 3,
      rowsIn(root, "sit-gap-list") + " rows vs " + num("gaps"));
    check("(1) …by widening the filters the list defaults to",
      qs(root, '[data-g="gRev"]').value === "" && qs(root, '[data-g="gKind"]').value === "all");
    check("(1) …and moves focus to that section's heading",
      w.document.activeElement === qs(root, "#sit-h-gaps"));
    check("(1) the gap cards never light up (no aria-pressed at all)",
      !card("gaps").hasAttribute("aria-pressed") && !card("convos").hasAttribute("aria-pressed"));
    const rev = qs(root, '[data-g="gRev"]');
    rev.value = "resolved";
    rev.dispatchEvent(new w.Event("change", { bubbles: true }));
    click(w, card("convos"));
    check("(1) \"Conversations checked\" does the same",
      rowsIn(root, "sit-gap-list") === 3 && w.document.activeElement === qs(root, "#sit-h-gaps"));

    // Instructions in use.
    click(w, card("inuse"));
    check("(1) ⭐ \"Instructions in use\" lists only the switched-on instructions",
      rowsIn(root, "sit-guid-list") === num("inuse") && num("inuse") === 2
      && card("inuse").getAttribute("aria-pressed") === "true" && !qs(root, "#sit-guid-list .sit-rule-off"));
    s = showingNums(root, "sit-guid-showing");
    check("(2) …and its line reads Showing 2 of 3: in use", s.n === 2 && s.total === 3 && /in use/.test(s.text));
    click(w, card("inuse"));
    check("(1) …and pressed again lists them all", rowsIn(root, "sit-guid-list") === 3
      && card("inuse").getAttribute("aria-pressed") === "false" && qs(root, "#sit-guid-showing").textContent === "");
  });

  // ── (3) no removed glyph renders; (4) the segmented control ──
  await block("(3)+(4)", async function () {
    const { w, api, root } = sierraWin();
    api._state.fStatus = "";
    FEEDBACK.forEach((f) => { api._state.open[f.turn_id] = true; });
    TURNS.forEach((t) => { api._state.gOpen[t.id] = true; });
    api._state.gRev = "";
    api._state.editId = "g3";
    api._state.editRule = "An old rule.";
    api._state.rulesState = "ok";
    api._state.rules = [{ key: "statewide", body: "[team wording]", active: true, applies_when: "always", sort_order: 10, updated_by: "sam@x" }];
    api._state.rulesOpen = { statewide: true, portal: true, credit_list: true };
    api._state.ruleEditKey = "credit_list";
    // A copy that succeeds, so its flash is part of what is scanned.
    Object.defineProperty(w.navigator, "clipboard", { value: { writeText: () => Promise.resolve() }, configurable: true });
    api.render(root);
    click(w, qs(root, '[data-qact="copy"]'));
    await tick(10);
    const REMOVED = ["👍", "👎", "📬", "⛏", "🛡", "📝", "➕", "⧉", "✓", "✏", "💾", "🚧"];
    const html = root.innerHTML;
    const found = REMOVED.filter((g) => html.indexOf(g) >= 0);
    check("(3) ⭐ no removed glyph renders anywhere in the tab, hover text included",
      found.length === 0, "found: " + found.join(" "));
    check("(3) the copy button says Copied in a word", qs(root, '[data-qact="copy"]').textContent === "Copied");
    check("(3) positive control: the kept ⚠ and ▸ are on screen, so a full render was scanned",
      html.indexOf("⚠") >= 0 && html.indexOf("▸") >= 0 && /Write an instruction about this/.test(html)
      && /Change this rule|Add to this rule/.test(html) && !!qs(root, ".sit-guid-edit-input"));
    check("(3) the words that replaced them are there",
      /Thumbs-down/.test(html) && /Thumbs-up/.test(html) && />Note</.test(html) && />Protected</.test(html)
      && />Edited</.test(html) && />Add instruction</.test(html) && />Copy question</.test(html) && />Save</.test(html));

    // (4) The status control for f1 (stored "new").
    const seg = (id) => Array.from(root.querySelectorAll('[data-status][data-turn="' + id + '"]'));
    const pressed = (id) => seg(id).filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.getAttribute("data-status"));
    check("(4) ⭐ aria-pressed follows the stored status (new → Not reviewed)",
      pressed("f1").join() === "new" && seg("f1").length === 3, JSON.stringify(pressed("f1")));
    check("(4) the pressed part is not disabled (it was a disabled 2.99:1 button)",
      seg("f1").every((b) => !b.disabled));
    const group = seg("f1")[0].closest('[role="group"]');
    const lab = group && qs(root, '[id="' + group.getAttribute("aria-labelledby") + '"]');
    check("(4) one control: a role=group named \"Mark this\"", !!lab && lab.textContent === "Mark this");
    check("(4) the stored values are unchanged", seg("f1").map((b) => b.getAttribute("data-status")).join() === "new,triaged,addressed");
    const before = w.__fetches.length;
    click(w, seg("f1").filter((b) => b.getAttribute("data-status") === "new")[0]);
    check("(4) pressing the part already pressed writes nothing", w.__fetches.length === before);
    click(w, seg("f1").filter((b) => b.getAttribute("data-status") === "triaged")[0]);
    await tick(20);
    const rpc = w.__fetches.filter((f) => /rpc\/sierra_feedback_set_status/.test(f.url)).pop();
    check("(4) the same RPC writes the new state", !!rpc && /"p_turn_id":"f1"/.test(rpc.init.body) && /"p_status":"triaged"/.test(rpc.init.body));
    check("(4) ⭐ …and aria-pressed follows it", pressed("f1").join() === "triaged", JSON.stringify(pressed("f1")));
    const chip = qs(root, '[data-open="f1"] .sit-chip-triaged');
    check("(4) the row's status chip says so in words", !!chip && chip.textContent === "Looking into it");
  });

  // ── (5a) the producer: "Try it in" asks Sierra AI here, or names My College ──
  await block("(5a)", async function () {
    const { w, api, root } = sierraWin();
    api._state.open = { f1: true };
    api.render(root);
    const group = qs(root, '[data-open="f1"] + .sit-row-body .sit-try[role="group"]');
    const buttons = group ? Array.from(group.querySelectorAll('[data-qact="test"]')) : [];
    check("(5) \"Try it in:\" is a named group of two buttons, Sierra and My College",
      !!group && qs(root, '[id="' + group.getAttribute("aria-labelledby") + '"]').textContent === "Try it in:"
      && buttons.map((b) => b.textContent).join() === "Sierra,My College");
    check("(5) …on every site: the group keeps its two-column phone layout, and no one-button variant is drawn",
      !!group && !group.classList.contains("sit-try-one") && !/sit-try-one/.test(SRC));
    click(w, buttons[1]);
    check("(5) ⭐ My College writes the question AND names the destination",
      w.sessionStorage.getItem(Q_KEY) === "what about comptia" && w.sessionStorage.getItem(DEST_KEY) === "college-briefing");
    check("(5) …and goes to My College", w.location.hash === "#college-briefing");
    // The live page has the chat module: Sierra opens over this tab and asks.
    const opened = [];
    w.CPL_CHAT = { open: function (o) { opened.push(o); return true; } };
    w.sessionStorage.removeItem(Q_KEY);
    w.sessionStorage.removeItem(DEST_KEY);
    w.location.hash = "#sierra-training";
    click(w, buttons[0]);
    check("(5) ⭐ Sierra asks Sierra AI over this tab: the question, sent at once",
      opened.length === 1 && opened[0].question === "what about comptia" && opened[0].send === true
      && opened[0].from === buttons[0]);
    check("(5) …and the trainer stays here, with no hand-off key written",
      w.location.hash === "#sierra-training" && w.sessionStorage.getItem(Q_KEY) === null
      && w.sessionStorage.getItem(DEST_KEY) === null);
    // Without a chat module that can open, the default waits under the key.
    w.CPL_CHAT = undefined;
    w.sessionStorage.setItem(DEST_KEY, "college-briefing");   // stale, from a hop that never landed
    api._testInSierra("one argument");
    check("(5) one-argument _testInSierra keeps the default and clears a stale destination",
      w.sessionStorage.getItem(Q_KEY) === "one argument" && w.sessionStorage.getItem(DEST_KEY) === null
      && w.location.hash === "#chatbot");
    check("(5) the producer and consumer agree on the key", api.TEST_DEST_KEY === DEST_KEY
      && /var TEST_DEST_KEY = 'cplSierraTestDest\.v1'/.test(CHAT));
    api._state.gOpen = { 1: true };
    api.render(root);
    check("(5) the questions she struggled with offer both too",
      root.querySelectorAll('[data-qsrc="gap:1"][data-qact="test"]').length === 2);
  });

  // ── (5b) the consumer: My College, lazily mounted and collapsed ──
  // Sierra AI's own box is built first, so there IS another input a My College
  // hand-off could land in by mistake (the hidden CPL Assistant input, before S398).
  await block("(5b)", async function () {
    const PANE = '<div id="college-briefing-root" style="border: 1px dashed var(--border-strong); '
      + 'border-radius: 8px; background: var(--surface-subtle); color: var(--text-muted); '
      + 'padding: 28px; text-align: center;">Loading College Briefing&hellip;</div>';
    const dom = new JSDOM('<!doctype html><html><head></head><body>'
      + '<div class="cpl-tab-pane" id="tab-college-briefing">' + PANE + "</div>"
      + "</body></html>", { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.localStorage.setItem("cpl_team_pass", "phrase");
    w.localStorage.setItem("cplSierraAudience.v1", "student");
    w.sessionStorage.setItem("cplSierraAudienceOk.v1", "student");
    w.fetch = function () { return new Promise(function () {}); };
    w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
    // Exactly what Sierra Training's My College button leaves behind.
    w.sessionStorage.setItem(Q_KEY, "What CPL does Cabrillo offer for welders?");
    w.sessionStorage.setItem(DEST_KEY, "college-briefing");
    [TEAM, CHAT].forEach(function (src) {
      const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
    });
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    w.CPL_CHAT.open();
    w.CPL_CHAT._collapseDock();
    const cobiInput = () => w.document.querySelector("#cplchat-cobi .cplchat-input");
    const mcInput = () => w.document.querySelector("#tab-college-briefing .cplchat-input");
    check("(5) Sierra AI's own box is built (so there IS another input to wrongly fill)", !!cobiInput());
    check("(5) building it leaves a My College hand-off alone",
      cobiInput().value === "" && w.sessionStorage.getItem(Q_KEY) !== null);
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
    check("(5) ⭐ activating My College before its box exists does NOT type into Sierra AI's box",
      cobiInput().value === "", "the defect: a box picked by what exists, not by destination");
    check("(5) ⭐ …and does not burn the key", w.sessionStorage.getItem(Q_KEY) === "What CPL does Cabrillo offer for welders?"
      && w.sessionStorage.getItem(DEST_KEY) === "college-briefing");

    // My College loads late, as it does on a first visit, with Sierra collapsed.
    const s = w.document.createElement("script"); s.textContent = BRIEFING; w.document.body.appendChild(s);
    const M = w.CPL_COLLEGE_BRIEFING;
    M._state.data = { colleges: ["Cabrillo College"], summaryByName: {}, raw: {},
      briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 1", year: "1" } };
    M._state.scope = "college";
    M._state.college = "Cabrillo College";
    M._state.open.sierra = false;
    const root = w.document.getElementById("college-briefing-root");
    M.render(root);
    const sec = () => root.querySelector('details[data-sec="sierra"]');
    check("(5) ⭐ the question lands in My College's own input once its box is built",
      !!mcInput() && mcInput().value === "What CPL does Cabrillo offer for welders?",
      mcInput() ? JSON.stringify(mcInput().value) : "no My College input");
    check("(5) both keys are cleared once delivered",
      w.sessionStorage.getItem(Q_KEY) === null && w.sessionStorage.getItem(DEST_KEY) === null);
    check("(5) ⭐ the collapsed Sierra section is opened around it", !!sec() && sec().open === true);
    check("(5) …and My College records that, so its next render keeps it open", M._state.open.sierra === true);
    check("(5) Sierra AI's own box stayed empty throughout", cobiInput().value === "");
    check("(5) the reader lands in the box, ready to press Enter", w.document.activeElement === mcInput());
    M.render(root);   // a roster or the funding model arriving, or the router's hashchange
    check("(5) ⭐ …and a re-render the reader did not ask for leaves them there",
      w.document.activeElement === mcInput(), "focus went to " + (w.document.activeElement || {}).tagName);
    check("(5) ⭐ a later re-render keeps the section open AND the question in the box",
      sec().open === true && mcInput().value === "What CPL does Cabrillo offer for welders?",
      "re-render rebuilt the box: open=" + sec().open + " value=" + JSON.stringify(mcInput().value));
  });

  // ── (5c) the default hand-off goes to Sierra AI's own box ──
  await block("(5c)", async function () {
    const dom = new JSDOM('<!doctype html><html><head></head><body>'
      + '<div class="cpl-tab-pane" id="tab-dashboard"></div>'
      + '<div class="cpl-tab-pane" id="tab-college-briefing"><div class="cplchat-mount"></div></div>'
      + "</body></html>", { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.fetch = function () { return new Promise(function () {}); };
    w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
    w.eval(CHAT);
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    w.sessionStorage.setItem(Q_KEY, "default question");
    w.CPL_CHAT.mountInto(w.document.querySelector("#tab-college-briefing .cplchat-mount"), "my-college");
    const mc = w.document.querySelector("#tab-college-briefing .cplchat-input");
    check("(5) a mount never consumes the DEFAULT hand-off",
      !!mc && mc.value === "" && w.sessionStorage.getItem(Q_KEY) === "default question");
    w.history.replaceState(null, "", "/#chatbot");
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
    await tick(5);
    const cb = w.document.querySelector("#cplchat-cobi .cplchat-input, .cplchat-full .cplchat-input");
    check("(5) ⭐ the default lands in Sierra AI's own input on the #chatbot link",
      !!cb && cb.value === "default question" && w.sessionStorage.getItem(Q_KEY) === null && mc.value === "");
  });

  // ── (5d) both words, always ──
  // Sam's ruling, 2026-09-29 (sheet 3, card 12): keep the word Sierra. Where a
  // site hid the CPL Assistant tab the group used to drop to My College alone.
  // Since S398 the Sierra button opens Sierra AI over this tab on every site,
  // so the group draws both words, always — even where a leftover menu entry
  // still marks the old tab hidden. The fixture carries the real chat module.
  await block("(5d)", async function () {
    const dom = new JSDOM('<!doctype html><html><head></head><body>'
      + '<nav class="cpl-tabs"><button class="cpl-tab" data-tab="chatbot" data-org-hidden="1" style="display:none"></button></nav>'
      + '<div class="cpl-tab-pane" id="tab-college-briefing"><div id="college-briefing-root">Loading</div></div>'
      + '<div class="cpl-tab-pane" id="tab-sierra-training"><div class="main-container">'
      + '<div id="sierra-training-root" style="' + PANE_STYLE + '">Loading</div></div></div>'
      + "</body></html>", { url: "https://example.org/#sierra-training", runScripts: "dangerously" });
    const w = dom.window;
    w.localStorage.setItem("cpl_team_pass", "phrase");
    w.localStorage.setItem("cplSierraAudience.v1", "student");
    w.sessionStorage.setItem("cplSierraAudienceOk.v1", "student");
    w.alert = function () {};
    w.confirm = function () { return true; };
    const posts = [];
    w.fetch = function (url, init) {
      if (/\/functions\/v1\/cpl-chat$/.test(String(url))) posts.push(JSON.parse(init.body));
      return new Promise(function () {});
    };
    w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
    [TEAM, CHAT].forEach(function (src) {
      const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
    });
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    [DEFAULTS, SRC].forEach(function (src) {
      const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
    });
    const api = w.CPL_SIERRA_TRAINING_TAB;
    api._state.feedback = JSON.parse(JSON.stringify(FEEDBACK));
    api._state.turns = JSON.parse(JSON.stringify(TURNS));
    api._state.turnReviews = JSON.parse(JSON.stringify(REVIEWS));
    api._state.guidance = JSON.parse(JSON.stringify(GUIDANCE));
    api._state.open = { f1: true };
    api._state.gOpen = { 1: true };
    const root = w.document.getElementById("sierra-training-root");
    api.render(root);
    const cobiInput = () => w.document.querySelector("#cplchat-cobi .cplchat-input, .cplchat-full .cplchat-input");
    const mcInput = () => w.document.querySelector("#tab-college-briefing .cplchat-input");
    const tryIn = () => qs(root, '[data-open="f1"] + .sit-row-body .sit-try[role="group"]');
    const offered = () => (tryIn() ? Array.from(tryIn().querySelectorAll('[data-qact="test"]')) : []);

    let group = tryIn(), buttons = offered();
    const label = group && qs(root, '[id="' + group.getAttribute("aria-labelledby") + '"]');
    check("(5d) ⭐ the group offers BOTH words, Sierra first, even where a leftover menu entry hides the old tab",
      buttons.map((b) => b.textContent).join() === "Sierra,My College"
      && buttons[0].getAttribute("data-host") === "sierra" && buttons[1].getAttribute("data-host") === "college-briefing",
      JSON.stringify(buttons.map((b) => b.textContent)));
    check("(5d) the control reads \"Try it in: Sierra My College\": a named group around two real buttons",
      !!label && label.textContent === "Try it in:" && group.getAttribute("role") === "group"
      && buttons.every((b) => b.tagName === "BUTTON" && b.getAttribute("type") === "button"));
    check("(5d) every button keeps the tab's one focus ring (it sits inside .sit)",
      buttons.length === 2 && buttons.every((b) => !!b.closest(".sit")));
    const gapTest = root.querySelectorAll('[data-qsrc="gap:1"][data-qact="test"]');
    check("(5d) the questions she struggled with offer the same two buttons",
      gapTest.length === 2 && gapTest[0].getAttribute("data-host") === "sierra", gapTest.length + " buttons");
    const css = (w.document.getElementById("sierra-training-css") || {}).textContent || "";
    const phone = css.slice(Math.max(0, css.indexOf("@media (max-width: 560px)")));
    // Since the S422 UI pass the two are underlined words in one wrapping row (Controls rule, 2026-10-09).
    check("(5d) on a phone the two words share the row, and the one-button rule is gone",
      css.indexOf("@media (max-width: 560px)") >= 0
      && phone.indexOf(".sit-try { display:flex; flex-wrap:wrap; gap:4px 18px; }") >= 0
      && phone.indexOf(".sit-try-one") === -1);

    // Sierra: she opens over this tab and asks, through the real chat module.
    click(w, buttons[0]);
    check("(5d) ⭐ Sierra opens Sierra AI over this tab and SENDS the question",
      w.CPL_CHAT._dockExpanded() && posts.length === 1 && posts[0].query === "what about comptia",
      JSON.stringify(posts));
    check("(5d) …from her own box: no college, her own surface, the trainer still on this tab",
      posts.length === 1 && posts[0].scope === null && posts[0].surface === "cobi-assistant"
      && w.location.hash === "#sierra-training" && w.sessionStorage.getItem(Q_KEY) === null);
    w.CPL_CHAT._collapseDock();
    check("(5d) ⭐ Back to the tab gives focus back to the Sierra button that opened her",
      !w.CPL_CHAT._dockExpanded() && w.document.activeElement === offered()[0]);

    // My College: the question AND the destination, then the tab.
    buttons = offered();
    click(w, buttons[1]);
    check("(5d) ⭐ My College hands off: the question AND the My College destination, then goes there",
      w.sessionStorage.getItem(Q_KEY) === "what about comptia" && w.sessionStorage.getItem(DEST_KEY) === "college-briefing"
      && w.location.hash === "#college-briefing",
      "q=" + JSON.stringify(w.sessionStorage.getItem(Q_KEY)) + " dest=" + JSON.stringify(w.sessionStorage.getItem(DEST_KEY))
      + " hash=" + w.location.hash);
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
    check("(5d) ⭐ activating My College before its box exists leaves Sierra AI's box alone",
      cobiInput().value === "" && w.sessionStorage.getItem(Q_KEY) === "what about comptia",
      "Sierra AI's input=" + JSON.stringify(cobiInput().value));
    const s = w.document.createElement("script"); s.textContent = BRIEFING; w.document.body.appendChild(s);
    const M = w.CPL_COLLEGE_BRIEFING;
    M._state.data = { colleges: ["Cabrillo College"], summaryByName: {}, raw: {},
      briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 1", year: "1" } };
    M._state.scope = "college";
    M._state.college = "Cabrillo College";
    M.render(w.document.getElementById("college-briefing-root"));
    check("(5d) ⭐ …and the question lands in My College's own box once it is built",
      !!mcInput() && mcInput().value === "what about comptia" && cobiInput().value === ""
      && w.sessionStorage.getItem(Q_KEY) === null && w.sessionStorage.getItem(DEST_KEY) === null,
      "My College=" + JSON.stringify(mcInput() && mcInput().value) + " Sierra AI=" + JSON.stringify(cobiInput().value));
  });

  // ── (6) First Light tokens only ──
  await block("(6)", async function () {
    const { w, api, root } = sierraWin();
    api.render(root);
    const css = (w.document.getElementById("sierra-training-css") || {}).textContent || "";
    const start = INDEX.search(/:root\s*\{/);
    let depth = 0, end = -1;
    for (let i = INDEX.indexOf("{", start); i < INDEX.length; i++) {
      if (INDEX[i] === "{") depth++;
      else if (INDEX[i] === "}" && --depth === 0) { end = i; break; }
    }
    const lightRoot = INDEX.slice(start, end);
    const defined = new Set((lightRoot.match(/--[\w-]+(?=\s*:)/g) || []));
    const locals = new Set((css.match(/--sit-[\w-]+(?=\s*:)/g) || []));
    const used = Array.from(new Set((css.match(/var\(\s*--[\w-]+/g) || []).map((v) => v.replace(/^var\(\s*/, ""))));
    const undefinedTokens = used.filter((t) => !defined.has(t) && !locals.has(t));
    check("(6) positive control: the light :root parsed and the sheet uses tokens",
      defined.size > 30 && used.length > 15 && used.indexOf("--cobalt") >= 0 && used.indexOf("--sit-pick") >= 0,
      "defined=" + defined.size + " used=" + used.length);
    check("(6) ⭐ every var() the tab's CSS uses is defined in index.html's LIGHT :root, or is a local --sit-*",
      undefinedTokens.length === 0, "undefined in light: " + undefinedTokens.join(", "));
    check("(6) the four locals are each derived from :root tokens",
      ["--sit-edge", "--sit-pick", "--sit-hover", "--sit-gap"].every((l) => locals.has(l))
      && /--sit-pick: color-mix\(in srgb, var\(--cobalt\) 10%, var\(--surface-opaque\)\)/.test(css));
    // (?![\w-]), not \b: a hyphen is a word boundary, so \b would read the
    // defined --mustard-fill as the undefined --mustard.
    check("(6) the undefined light tokens are gone (--brick --danger-text --mustard --brand --brand-soft)",
      !/var\(--(brick|danger-text|mustard|brand|brand-soft)(?![\w-])/.test(css));
    check("(6) ⭐ no raw color: no hex and no rgb()/rgba() literal in the sheet",
      !/#[0-9a-fA-F]{3,8}\b/.test(css) && !/rgba?\(/.test(css));
    check("(6) the selected ink is the TEXT grade of seal blue (the fill never flips in dark)",
      /aria-pressed=\\?"true\\?"\] \{[^}]*color: var\(--seal-blue-text\)/.test(css) && !/color: var\(--seal-blue\);/.test(css));
  });

  // ── (7) the placeholder's inline centering is shed ──
  await block("(7)", async function () {
    check("(7) the fixture is the placeholder index.html ships (centered, dashed)",
      /text-align:\s*center/.test(PANE_STYLE) && /dashed/.test(PANE_STYLE));
    const out = sierraWin({ signedOut: true });
    out.api.activate();
    const st = out.root.getAttribute("style") || "";
    check("(7) ⭐ render() leaves no inline centering or dashed frame on the root (signed out)",
      out.root.style.textAlign === "" && !/text-align|dashed|padding/.test(st), JSON.stringify(st));
    const inn = sierraWin();
    inn.api.render(inn.root);
    const st2 = inn.root.getAttribute("style") || "";
    check("(7) …nor on a signed-in render", inn.root.style.textAlign === "" && !/text-align|dashed/.test(st2), JSON.stringify(st2));
  });

  // ── (8) headers are buttons; long answers scroll from the keyboard ──
  await block("(8)", async function () {
    const { w, api, root } = sierraWin();
    api._state.fStatus = "";
    api._state.rulesState = "ok"; api._state.rules = [];
    api.render(root);
    let head = qs(root, '[data-open="f1"]');
    check("(8) an item header is a focusable button that says it is closed",
      head.getAttribute("role") === "button" && head.getAttribute("tabindex") === "0"
      && head.getAttribute("aria-expanded") === "false" && !head.hasAttribute("aria-controls"),
      "aria-controls must not point at a body that is not rendered");
    head.focus();
    head.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    head = qs(root, '[data-open="f1"]');
    const bodyId = head.getAttribute("aria-controls");
    check("(8) ⭐ Enter opens it: aria-expanded, and aria-controls names a body that exists",
      head.getAttribute("aria-expanded") === "true" && !!bodyId && !!qs(root, '[id="' + bodyId + '"]'));
    check("(8) ⭐ focus comes back to the rebuilt header", w.document.activeElement === head);
    head.dispatchEvent(new w.KeyboardEvent("keydown", { key: " ", bubbles: true }));
    check("(8) Space closes it again", qs(root, '[data-open="f1"]').getAttribute("aria-expanded") === "false");
    const gh = qs(root, "[data-gopen]"), rh = qs(root, '[data-ruleopen="statewide"]');
    gh.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    rh.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    check("(8) the gap and built-in rule headers open from the keyboard too",
      qs(root, "[data-gopen]").getAttribute("aria-expanded") === "true"
      && qs(root, '[data-ruleopen="statewide"]').getAttribute("aria-expanded") === "true"
      && root.querySelectorAll(".sit-rule").length === 12);
    check("(8) the instructions' headers hold controls, so they are NOT buttons",
      root.querySelectorAll("#sit-guid-list .sit-row-head[role]").length === 0
      && root.querySelectorAll("#sit-guid-list .sit-row-head").length === 3);

    // Scroll boxes: focusable and named exactly while they overflow.
    api._state.open = { f1: true };
    api.render(root);
    const ans = qs(root, '[id="sit-body-f1"] .sit-answer');
    Object.defineProperty(ans, "scrollHeight", { value: 900, configurable: true });
    Object.defineProperty(ans, "clientHeight", { value: 420, configurable: true });
    api._syncScrollers(root);
    check("(8) ⭐ an overflowing answer box is a focusable, named region",
      ans.getAttribute("tabindex") === "0" && ans.getAttribute("role") === "region"
      && ans.getAttribute("aria-label") === "Sierra’s answer");
    Object.defineProperty(ans, "scrollHeight", { value: 120, configurable: true });
    Object.defineProperty(ans, "clientHeight", { value: 120, configurable: true });
    api._syncScrollers(root);
    check("(8) …and a box that does not scroll is not a dead tab stop",
      !ans.hasAttribute("tabindex") && !ans.hasAttribute("role"));

    // The empty gap list, in the words Sam approved.
    api._state.turns = [TURNS[3]];
    api.render(root);
    check("(8) an empty gap list reads \"No struggled questions in the conversations checked.\"",
      /No struggled questions in the conversations checked\./.test(root.textContent));
  });

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "  ok   " : "  FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n         " + r[2]));
  });
  console.log("\nsierra_training_round1.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  if (failed) process.exit(1);
})();
