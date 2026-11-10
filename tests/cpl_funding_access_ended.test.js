// tests/cpl_funding_access_ended.test.js
//
// A SIGN-IN WHOSE FUNDING ACCESS HAS ENDED SAYS SO ON THE FUNDING TAB (S624, 2026-11-10; the
// reviewer-session-lifetime lane's NEXT: "the funding tab's own review controls still draw for such a sign-in;
// give them the same note").
//
// A door grant lasts 30 days and can be revoked; the browser's sign-in outlives it. The CSM Workspace has said so
// since #3007. The funding tab went on drawing Accept, Deny, Nudge and the CO Monitor's note over saves the
// database refused.
//
// Guards the failure modes that matter:
//   1. NOTHING CHANGES while the access stands, while the database has not answered, or when the ask fails.
//   2. A REVIEWER ON THE LIST IS NEVER ASKED AND NEVER CLOSED: is_funding_reviewer() is true for them by definition.
//   3. ENDED: the bar says so to the address signed in, no review control and no model control is left, and
//      Ask an approver sends the door's own request for that address.
//   4. THE DOOR'S LATER WORDS reach the note, and the button stays.
//   5. ACCESS BACK: the note leaves and the review controls return.
//
// Run from repo root: `npm test` (or `node --max-old-space-size=12288 tests/cpl_funding_access_ended.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");
const COLLEGE = "Mt San Antonio", OTHER = "Pasadena";

function make() {
  const { window } = freshDom();
  window.CPL_SESSION = { get: () => ({ access_token: "header.payload.sig", email: "pat@rccd.edu" }), isFresh: () => true,
    authHeaders: () => ({ apikey: "anon", Authorization: "Bearer header.payload.sig" }) };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true },
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
                [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    optinReview: [{ college: COLLEGE, name: "Dana Lee", title: "Other", email: "dana@mtsac.edu", status: "self_attested",
      requested_at: "2026-11-02T04:00:00Z" }] });
  T.render();
  return { window, doc, T, mount: doc.getElementById("cplFundingMount") };
}
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const tick = () => new Promise((r) => setTimeout(r, 0));
const REVIEW = ["data-optinaccept", "data-optindeny", "data-note", "data-notesave", "data-optinmail"];
const MODEL = ["data-edit", "data-textedit", "data-secrename", "data-reqhide", "data-repopen"];
const left = (x, list) => list.filter((a) => x.mount.querySelector("[" + a + "]"));
const note = (x) => x.mount.querySelector('.cplfund-authbar[data-fundaccess="ended"]');
function openDetail(x, name) {
  const row = Array.from(x.doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((r) => r.textContent.indexOf(name) !== -1);
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new x.window.Event("click", { bubbles: true }));
  return x.doc.querySelector("tr.cplfund-detail");
}

(async function () {
// ── 1. the access stands, or nobody has answered ─────────────────────────────────────────────────────────────
{
  const d = make();
  d.T._setOnReviewerList(false);                        // a door sign-in; the access question is unanswered
  check("1a: a door sign-in with no answer about its access draws as before: review controls, no note",
    d.T._reviewEnded() === false && !note(d) && !!d.mount.querySelector("[data-optinaccept]") && !!d.mount.querySelector("#cplFundNudge"));
  d.T._setFundingAccess(true);
  check("1b: with the access standing, the same", d.T._reviewEnded() === false && !note(d) && !!d.mount.querySelector("[data-optinaccept]"));
}

// ── 2. a reviewer on the list is never closed ────────────────────────────────────────────────────────────────
{
  const li = make();
  li.T._setOnReviewerList(true);
  const sent = [];
  li.window.CPL_FUNDING_NO_REMOTE = false;
  li.window.fetch = (url) => { sent.push(String(url)); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(false) }); };
  li.T._askFundingAccess(true); li.T.render();
  await tick();
  check("2a: a sign-in on the reviewer list is never asked about a grant", !sent.some((u) => /rpc\/is_funding_reviewer/.test(u)), sent.join(" "));
  li.T._setFundingAccess(false);
  check("2b: ⭐ and a stray no cannot close it: the model and the review stay open",
    li.T._reviewEnded() === false && !note(li) && !!li.mount.querySelector("[data-optinaccept]") && left(li, ["data-edit"]).length === 1);
}

// ── 3 to 5. the database says the access ended ───────────────────────────────────────────────────────────────
{
  const d = make();
  let grant = false, fails = false, asked = [];
  const sent = [];
  d.window.CPL_FUNDING_NO_REMOTE = false;
  d.window.fetch = (url, init) => {
    url = String(url); sent.push(url);
    const ans = (v, ok) => Promise.resolve({ ok: ok !== false, status: ok === false ? 500 : 200, json: () => Promise.resolve(v) });
    if (/rpc\/is_funding_reviewer/.test(url)) return fails ? ans({}, false) : ans(grant);
    return ans([]);
  };
  d.window.CPL_REVIEWER_SIGNIN = { _askAccess: (email) => { asked.push(email); return Promise.resolve({ ok: true }); } };

  fails = true;
  d.T._setOnReviewerList(false);                        // the list's no asks about the grant at once
  await tick(); await tick(); await tick();
  check("3a: the list's no asks the database whether the grant stands, with the session's credential",
    sent.some((u) => /rest\/v1\/rpc\/is_funding_reviewer$/.test(u)));
  check("3b: an ask that fails leaves the review as it was", d.T._reviewEnded() === false && !note(d) && !!d.mount.querySelector("[data-optinaccept]"));

  fails = false; d.T._askFundingAccess(true);
  await tick(); await tick(); await tick();
  const bar = flat(note(d));
  check("3c: ⭐ the database's no draws the note, to the address signed in",
    d.T._reviewEnded() === true && /Your funding access has ended\./.test(bar) && /pat@rccd\.edu is signed in/.test(bar) && /lasts 30 days/.test(bar), bar);
  check("3d: ⭐ no review control is left (" + left(d, REVIEW).join(", ") + "), and Nudge is gone",
    left(d, REVIEW).length === 0 && !d.mount.querySelector("#cplFundNudge"));
  check("3e: no model control either, and the bar never says changes save", left(d, MODEL).length === 0 &&
    !/Changes save for everyone/.test(flat(d.mount)) && !/for the funding review\./.test(bar));
  const det = openDetail(d, "Pasadena");
  check("3f: a college's detail carries no CO Monitor's note to write in", !!det && !det.querySelector("textarea[data-note]"));
  check("3g: what only reads stays: Copy requirements and the brief", !!d.mount.querySelector("#cplFundReqCopy") && !!d.mount.querySelector("#cplFundReqBrief"));

  const ask = () => d.mount.querySelector("#cplFundAccessAsk");
  check("3h: Ask an approver is a button, as a word", !!ask() && ask().tagName === "BUTTON" && flat(ask()) === "Ask an approver" && !ask().disabled);
  ask().dispatchEvent(new d.window.MouseEvent("click", { bubbles: true }));
  await tick(); await tick();
  check("3i: it sends the door's own request for the address signed in, once", asked.join() === "pat@rccd.edu");
  check("3j: and says it asked, in a status line",
    /^Asked\. An approver will see it in the CSM Workspace\./.test(flat(d.mount.querySelector('#cplFundAccessMsg[role="status"]'))));

  d.window.dispatchEvent(new d.window.CustomEvent("cpl-funding-door-said", { detail: { msg: "An approver declined the request.", kind: "err" } }));
  await tick();
  check("4a: ⭐ the door's later words reach the note, and Ask an approver stays to ask again",
    flat(d.mount.querySelector("#cplFundAccessMsg")) === "An approver declined the request." && !!ask() && !ask().disabled);

  grant = true; d.T._askFundingAccess(true);
  await tick(); await tick(); await tick();
  check("5a: ⭐ once an approver opens it again, the note leaves and the review controls return",
    d.T._reviewEnded() === false && !note(d) && !!d.mount.querySelector("[data-optinaccept]") && !!d.mount.querySelector("#cplFundNudge"));
  check("5b: and the bar reads as a door sign-in's again", /for the funding review\./.test(flat(d.mount.querySelector(".cplfund-authbar"))));
  d.window.dispatchEvent(new d.window.CustomEvent("cpl-funding-door-said", { detail: { msg: "That approval has lapsed. Ask again.", kind: "err" } }));
  await tick();
  check("5c: the door's words draw nothing while the access stands", !note(d) && !d.mount.querySelector("#cplFundAccessMsg"));
}

// ── source ───────────────────────────────────────────────────────────────────────────────────────────────────
check("6a: only a closed model is asked, and a failed ask closes nothing",
  /function askFundingAccess\(force\) \{[\s\S]{0,160}!modelClosed\(\)/.test(SRC) &&
  /\.catch\(function \(\) \{ ACCESS\.asking = ""; \}\);/.test(SRC) &&
  /return !!e && modelClosed\(\) && ACCESS\.email === e && ACCESS\.ok === false;/.test(SRC));
check("6b: a new sign-in asks again, so an approval claimed by this tab clears the note",
  /addEventListener\("cpl-session-changed", function \(\) \{ askReviewerList\(\); askFundingAccess\(true\);/.test(SRC));
check("6c: both sweeps take the ended branch before the door's", (SRC.match(/else if \(reviewEnded\(\)\) stripEndedAffordances\(/g) || []).length === 2);

finish();
})();
