// tests/cpl_funding_door_readonly.test.js
//
// A DOOR SIGN-IN DOES THE REVIEW WORK AND READS THE MODEL (S622, 2026-11-09).
//
// The funding door (issue 2983) signs in a teammate who is not on the reviewer list. The database gives that
// sign-in the review work (is_funding_reviewer(): confirmations, attestations, notes, nudges) and refuses it the
// model (cpl_funding_config, cpl_funding_reports, the credit report: is_allowed_reviewer()). The funding tab drew
// every sign-in as a model editor, so a door sign-in read "Changes save for everyone" over fields whose every save
// was refused.
//
// Guards the failure modes that matter:
//   1. NOTHING CHANGES FOR A REVIEWER, or while the database has not answered: the model stays open.
//   2. A DOOR SIGN-IN HAS NO MODEL CONTROL: no edit field, no scenario picker, no Add requirement, no Reporting box.
//   3. IT KEEPS EVERY REVIEW CONTROL: Accept, Deny, Nudge, the CO Monitor's note; the workspace still reads it as a
//      reviewer (names and emails ride the snapshot).
//   4. IT READS THE PUBLISHED MODEL: a what-if left in this browser is set aside, so the minimum conditions an
//      acceptance email quotes are the published ones.
//   5. THE SCREEN SAYS SO, and never tells a signed-in person to sign in.
//
// Run from repo root: `npm test` (or `node --max-old-space-size=12288 tests/cpl_funding_door_readonly.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");
const COLLEGE = "Mt San Antonio", OTHER = "Pasadena";

function make(mode) {
  const { window } = freshDom();
  if (mode !== "out") {
    window.CPL_SESSION = { get: () => ({ access_token: "header.payload.sig", email: "pat@rccd.edu" }), isFresh: () => true,
      authHeaders: () => ({ apikey: "anon", Authorization: "Bearer header.payload.sig" }) };
  }
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true },
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
                [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    optinReview: [{ college: COLLEGE, name: "Dana Lee", title: "Other", email: "dana@mtsac.edu", status: "self_attested",
      requested_at: "2026-11-02T04:00:00Z" }] });
  if (mode === "door") T._setOnReviewerList(false);
  if (mode === "listed") T._setOnReviewerList(true);
  T.render();
  return { window, doc, T, mount: doc.getElementById("cplFundingMount") };
}
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const MODEL = ["data-edit", "data-textedit", "data-secrename", "data-reqhide", "data-pooladd", "data-poolhide", "data-priodel",
  "data-stratadd", "data-measedit", "data-cardrename", "data-priogoal", "data-repopen", "data-srcopen", "data-memoedit"];
const MODEL_IDS = ["cplFundScenSel", "cplFundProjSel", "cplFundScenNew", "cplFundProjAdd", "cplFundReqAdd", "cplFundMirror", "cplFundDocStatus"];
const has = (x, list) => list.filter((a) => x.mount.querySelector("[" + a + "]"));
const hasId = (x, ids) => ids.filter((id) => x.mount.querySelector("#" + id));
function openDetail(x, name) {
  const row = Array.from(x.doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((r) => r.textContent.indexOf(name) !== -1);
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new x.window.Event("click", { bubbles: true }));
  return x.doc.querySelector("tr.cplfund-detail");
}

// ── 1. a reviewer, and a sign-in the database has not answered about: the model is open, as before ────────────
{
  const un = make("unasked"), li = make("listed");
  check("1a: with no answer yet, a sign-in is drawn as before: the model is open", un.T._modelClosed() === false &&
    has(un, ["data-edit"]).length === 1 && /Changes save for everyone/.test(flat(un.mount.querySelector(".cplfund-authbar"))));
  check("1b: on the reviewer list, the model is open and its controls draw", li.T._modelClosed() === false &&
    has(li, MODEL).length >= 8 && hasId(li, MODEL_IDS).length >= 4);
  check("1c: a reviewer keeps the review controls too", !!li.mount.querySelector("[data-optinaccept]") && !!li.mount.querySelector("#cplFundNudge"));
}

// ── 2 and 3. a door sign-in: no model control, every review control ───────────────────────────────────────────
{
  const d = make("door");
  check("2a: the database's no closes the model while the sign-in stays a reviewing one", d.T._modelClosed() === true && d.T._reviewing() === true);
  check("2b: no model control is left on the page (" + has(d, MODEL).concat(hasId(d, MODEL_IDS)).join(", ") + ")",
    has(d, MODEL).length === 0 && hasId(d, MODEL_IDS).length === 0);
  check("2c: no edit field of any kind: the model's values read as text",
    !d.mount.querySelector("input[data-edit], textarea[data-edit], select[data-edit]"));
  check("3a: Accept and Deny on the waiting request, and Nudge, stay",
    !!d.mount.querySelector("[data-optinaccept]") && !!d.mount.querySelector("[data-optindeny]") && !!d.mount.querySelector("#cplFundNudge"));
  check("3b: Copy requirements and the brief only read, and stay", !!d.mount.querySelector("#cplFundReqCopy") && !!d.mount.querySelector("#cplFundReqBrief"));
  const snap = d.T.csm.snapshot();
  const mt = snap.rows.find((r) => r.key === COLLEGE);
  check("3c: the CSM Workspace still reads a reviewer: who sent the request rides the snapshot",
    snap.reviewer === true && !!mt && !!mt.req && !!mt.req.part && mt.req.part.name === "Dana Lee");
  const bar = flat(d.mount.querySelector(".cplfund-authbar"));
  check("5a: the bar says what this sign-in is for", /Signed in as pat@rccd\.edu for the funding review\./.test(bar) &&
    /The model shows as published/.test(bar) && !/Changes save for everyone/.test(bar));
  const text = flat(d.mount);
  check("5b: a signed-in person is never told to sign in, and nothing reads as a what-if",
    !/sign in to (save|publish)/i.test(text) && !/what-if/i.test(text) && !/Curator only/.test(text) && !/explored on this browser/.test(text));
  const det = openDetail(d, "Pasadena");
  check("3d: a college's detail keeps the CO Monitor's note for writing", !!det && !!det.querySelector("textarea[data-note]"));
  check("2d: the detail carries no Reporting box and no credit-report link (the database refuses both)",
    !!det && !det.querySelector("[data-repopen]") && !det.querySelector("[data-srcopen]"));
  const li = make("listed"), ldet = openDetail(li, "Pasadena");
  check("2e: a reviewer's detail does carry the Reporting box, so 2d compares like with like", !!ldet && !!ldet.querySelector("[data-repopen]"));
}

// ── 4. the published model, with this browser's what-if set aside ─────────────────────────────────────────────
{
  const d = make("unasked");
  const shared = d.T.csm.snapshot().deadline;
  d.T._setScenario({ participationDeadline: "2027-03-03" });      // a what-if this browser holds
  check("4a: fixture: a what-if in this browser changes what an open model shows", d.T.csm.snapshot().deadline === "2027-03-03" && shared !== "2027-03-03");
  d.T._setOnReviewerList(false);
  check("4b: for a door sign-in the what-if is set aside: the published value shows", d.T.csm.snapshot().deadline === shared);
  check("4c: the what-if is kept, not deleted: it returns when the model opens again",
    (d.T._setOnReviewerList(true), d.T.csm.snapshot().deadline === "2027-03-03"));
}

// ── source: the answer shapes the screen, the review sites take any sign-in ───────────────────────────────────
check("6a: the question goes to the database's own function, with the session's credential",
  /rest\/v1\/rpc\/is_allowed_reviewer"/.test(SRC) && /function askReviewerList\(\)[\s\S]{0,400}applyWriteAuth\(/.test(SRC));
check("6b: no answer leaves the model as it was (a failed ask never closes it)",
  /\.catch\(function \(\) \{ LIST\.asking = ""; \}\);/.test(SRC) && /return LIST\.ok === false;/.test(SRC));
check("6c: the review work reads reviewing(), never the model's gate",
  /function csmSnapshot\(\) \{\s*var reviewer = reviewing\(\) && !publicMode\(\);/.test(SRC) &&
  /function coReviewLaneHtml\(\) \{\s*if \(!reviewing\(\) \|\| publicMode\(\)\) return "";/.test(SRC) &&
  /function nudgeShown\(\) \{ return reviewing\(\)/.test(SRC) &&
  !/setDeclined/.test(SRC));
check("6d: the three field builders render the value alone for a closed model",
  (SRC.match(/if \(publicMode\(\) \|\| opts\.ro \|\| modelClosed\(\)\) return esc\(value\);/g) || []).length === 3);

finish();
