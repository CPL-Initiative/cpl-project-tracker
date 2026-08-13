// Sierra guidance — EDIT IN PLACE + the test-in-Sierra loop (Session 148,
// SkyPeak, 2026-08-13) — jsdom test.
//
// Sam: "I need to edit the last entry I made on the training tab but there is
// no way to get back into it once saved. Also, I'd like to be able to test it
// from there in Sierra and keep editing if needed until I get an improved
// response."
//
// Before this, a saved instruction offered only Switch off / Switch on. Fixing
// a typo meant switching the old rule off and retyping the whole thing as a new
// row — which ALSO moves it to the top of the newest-N window that decides
// whether Sierra is sent it at all, silently pushing some other rule out.
//
// What this guards, and each one is a way the loop can break silently:
//  (a) every saved row offers an Edit control, and it opens the editor IN PLACE
//      of that row (not a second copy of it);
//  (b) SAVE PATCHes rule + note + updated_by to id=eq.<id> with the team auth
//      headers and Prefer: return=representation;
//  (c) a PATCH that RLS filtered out (200 + EMPTY body) is treated as a FAILURE
//      and the editor stays open with the text intact — the team_access lesson:
//      an "ok" write must prove it touched a row, or a curator watches their
//      edit vanish while the UI says it saved;
//  (d) "Save & ask Sierra" saves FIRST and only hops on a confirmed write —
//      hopping on an unsaved edit tests the OLD wording and reads as "the
//      instruction did nothing";
//  (e) the open editor SURVIVES the round trip to #chatbot via sessionStorage,
//      because testing means leaving the tab and the whole point is to come
//      back and keep editing;
//  (f) editing does not reorder the list (the sent-cap position is load-bearing);
//  (g) XSS — an edited rule renders escaped.
//
// Run from repo root: `npm test` (or `node tests/sierra_guidance_edit.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("sierra_training.js", "utf8");

// `patch` controls what the PATCH endpoint returns, so the RLS-filtered case
// (200 + []) can be exercised as well as the happy path.
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="sierra-training-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.__fetches = [];
  w.alert = function () {};
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    if (/sierra_guidance/.test(url) && init && init.method === "PATCH") {
      const rows = opts.patchEmpty ? [] : [Object.assign({ id: "r1", active: true }, JSON.parse(init.body))];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(rows) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

function seed(api) {
  api._state.feedback = []; api._state.turns = [];
  api._state.guidance = [
    { id: "r1", rule: "Original wording.", note: "why", active: true,
      created_by: "sam@x", created_at: "2026-08-12T10:00:00Z" },
    { id: "r2", rule: "Second rule.", note: null, active: true,
      created_by: "sam@x", created_at: "2026-08-11T10:00:00Z" },
  ];
}

// ── (a) the affordance exists and opens in place ──
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  seed(api);
  api.render(root);
  check("every saved instruction offers an Edit control",
    root.querySelectorAll("[data-guid-edit]").length === 2);

  api._openEdit("r1", root);
  check("editor opens for the chosen row", root.querySelector(".sit-guid-edit-input"));
  check("editor is prefilled with the saved wording",
    root.querySelector(".sit-guid-edit-input").value === "Original wording.");
  check("editor prefills the note too",
    root.querySelector(".sit-guid-edit-note").value === "why");
  check("editor REPLACES the row rather than duplicating it",
    root.querySelectorAll("[data-guid-edit]").length === 1 &&
    !/Original wording\./.test(root.querySelector(".sit-row.sit-guid-editing").outerHTML.replace(/<textarea[\s\S]*?<\/textarea>/, "")));
  check("editor carries a test-question box and both save buttons",
    root.querySelector(".sit-guid-edit-testq") &&
    root.querySelector("[data-guid-save]") && root.querySelector("[data-guid-savetest]"));
  check("editor states whether the rule is actually reaching Sierra",
    /is <b>on<\/b>|switched off/.test(root.innerHTML));
  check("cancel closes without keeping a draft",
    (api._cancelEdit(root), api._state.editId === null && !root.querySelector(".sit-guid-edit-input")));
})();

// ── (b) save writes the right request ──
(async function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  seed(api);
  api._openEdit("r1", root);
  await api._saveGuidance("r1", "Edited wording.", "new note", root);

  const patch = w.__fetches.filter((f) => f.init.method === "PATCH")[0];
  check("save PATCHes the single row by id", patch && /sierra_guidance\?id=eq\.r1/.test(patch.url));
  const body = patch && JSON.parse(patch.init.body);
  check("save body carries the new rule, note and author",
    body && body.rule === "Edited wording." && body.note === "new note" && body.updated_by === "(team)");
  check("save sends team auth + asks for the row back",
    patch && patch.init.headers["x-team-pass"] === "phrase" &&
    patch.init.headers["Prefer"] === "return=representation");
  check("the in-memory row is updated from the SERVER's copy",
    api._state.guidance[0].rule === "Edited wording.");
  check("a successful save closes the editor", api._state.editId === null);

  // (f) position is load-bearing: only the newest N active rules are sent.
  check("editing does not reorder the list",
    api._state.guidance[0].id === "r1" && api._state.guidance[1].id === "r2");
})();

// ── (c) an RLS-filtered PATCH is a FAILURE, not a save ──
(async function () {
  const w = makeWin({ patchEmpty: true });
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  seed(api);
  api._openEdit("r1", root);
  await api._saveGuidance("r1", "Edited but filtered.", "n", root);

  check("200 + empty body does NOT count as saved (row unchanged)",
    api._state.guidance[0].rule === "Original wording.");
  check("a filtered write leaves the editor OPEN so the text is not lost",
    api._state.editId === "r1");
  check("the editor still holds the typed text after a failed save",
    api._state.editRule === "Edited but filtered." ||
    (root.querySelector(".sit-guid-edit-input") || {}).value === "Edited but filtered.");
})();

// ── (d) + (e) save-then-test, and surviving the hop ──
(async function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  seed(api);
  api._openEdit("r1", root);
  api._state.editRule = "Name the college's ironworker exhibits explicitly.";
  api._state.editTestQ = "What CPL does Cerritos College offer for ironworkers?";

  let hopped = null;
  await api._saveGuidance("r1", api._state.editRule, "", root, function () {
    api._saveEditDraft();
    hopped = api._state.editTestQ;
  });

  check("save-and-test writes BEFORE handing off",
    w.__fetches.filter((f) => f.init.method === "PATCH").length === 1 && hopped);
  check("the saved wording is what will be tested",
    api._state.guidance[0].rule === "Name the college's ironworker exhibits explicitly.");

  api._testInSierra(hopped);
  check("the question is handed to the assistant via sessionStorage",
    w.sessionStorage.getItem(api.TEST_Q_KEY) === "What CPL does Cerritos College offer for ironworkers?");
  check("the handoff navigates to the assistant", w.location.hash === "#chatbot");

  // The hop tears the tab down on a reload. The editor must come back.
  const stored = JSON.parse(w.sessionStorage.getItem(api.EDIT_KEY) || "null");
  check("the open editor is persisted for the return trip",
    stored && stored.id === "r1" && /ironworker exhibits/.test(stored.rule));
  check("the test question is persisted too, so it is not retyped each round",
    stored && /Cerritos College/.test(stored.testQ));

  api._state.editId = null; api._state.editRule = ""; api._state.editTestQ = "";
  api._restoreEditDraft();
  check("coming back reopens the SAME editor where it was left",
    api._state.editId === "r1" && /ironworker exhibits/.test(api._state.editRule) &&
    /Cerritos College/.test(api._state.editTestQ));
})();

// ── (g) XSS ──
(function () {
  const w = makeWin();
  const api = w.CPL_SIERRA_TRAINING_TAB;
  const root = w.document.getElementById("sierra-training-root");
  seed(api);
  api._state.guidance[0].rule = '<img src=x onerror="alert(1)">';
  api.render(root);
  check("an edited rule renders escaped in the row",
    !root.querySelector("img") && /&lt;img/.test(root.innerHTML));
  api._openEdit("r1", root);
  check("and escaped inside the editor textarea", !root.querySelector("img"));
})();

// ── report ──
setTimeout(function () {
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]);
  });
  console.log("\nsierra_guidance_edit.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  if (failed) process.exit(1);
}, 250);
