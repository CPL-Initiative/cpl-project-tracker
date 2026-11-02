// tests/csm_workspace.test.js
//
// THE CSM WORKSPACE — Sam, 2026-11-02: "a CSM workspace for handling the comms (notes, follow ups, acceptances,
// etc.) for the colleges ... a tab linked from the internal view formatted like CPL Commons with priority cards at
// top and action center below". S555 built it over the funding tab's own state.
//
// Guards the failure modes that matter:
//   1. ONE READ: the workspace's stages and conditions come from CPL_FUNDING_TAB.csm.snapshot(), the same
//      eligReqList / baselineGate the funding tab draws, never a second computation.
//   2. NO PII TO A READER WHO IS NOT SIGNED IN: names and emails ride `req` for a reviewer alone.
//   3. THE REVIEW GATE (Sam's ask 15): Accept stays shut until the reviewer has seen the review and ticked every
//      Check this; a requirement that fails keeps Accept shut and leaves Deny open.
//   4. A DECISION IS THE FUNDING TAB'S DECISION: Accept runs the review lane's acceptOptIn (the same write, the
//      same email window), so the two surfaces cannot drift.
//   5. THE TOP FOLDS (Sam's ask 18) and a pick lasts the visit.
//   6. Rule 4: the tab's button, pane and boot sit in both HTMLs, and the funding tab's internal view links to it.
//
// Run from repo root: `npm test` (or `node tests/csm_workspace.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const IDX = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const CPL = fs.readFileSync(path.join(ROOT, "CPL_Dashboard.html"), "utf8");
const FUND = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");

const COLLEGE = "Mt San Antonio";
const OTHER = "Pasadena";
function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.signedIn) window.CPL_SESSION = session();
  // A browser's observer that has not yet seen the review's foot: jsdom has none, and the module's fallback opens
  // the gate at once, which is the right behavior where no observer exists but would hide the gate from this test.
  window.IntersectionObserver = function () { this.observe = function () {}; this.disconnect = function () {}; };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig(Object.assign({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true },
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
                [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    optinReview: [{ college: COLLEGE, name: "Dana Lee", title: "Other", email: "dana@mtsac.edu", status: "self_attested",
      requested_at: "2026-11-02T04:00:00Z" }] }, opts.elig || {}));
  T.render();
  // the workspace's pane, as both HTMLs carry it
  const pane = doc.createElement("div");
  pane.id = "tab-csm-workspace";
  pane.innerHTML = '<div id="csm-workspace-root"></div>';
  doc.body.appendChild(pane);
  window.eval(SRC);
  window.CPL_CSM_WORKSPACE.boot();
  return { window, doc, T, W: window.CPL_CSM_WORKSPACE, root: doc.getElementById("csm-workspace-root") };
}
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const clickEl = (window, el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

// ── 1. one read ──────────────────────────────────────────────────────────────
{
  const { T, W, root } = setup({ signedIn: true });
  const snap = T.csm.snapshot();
  const mt = snap.rows.find((r) => r.key === COLLEGE), pc = snap.rows.find((r) => r.key === OTHER);
  check("1a: the snapshot carries every roster institution once",
    snap.rows.length > 100 && new Set(snap.rows.map((r) => r.key)).size === snap.rows.length);
  check("1b: a waiting confirmation reads waiting; a confirmed one reads confirmed",
    !!mt && mt.part.waiting && !mt.part.confirmed && !!pc && pc.part.confirmed && !pc.part.waiting);
  check("1c: each condition is the funding tab's own (its gate and words)",
    JSON.stringify(pc.gate) === JSON.stringify(T._gate(OTHER)) && pc.conds.length > 0 && pc.conds.every((c) => typeof c.words === "string" && c.words));
  check("1d: the workspace's stage follows: waiting on the team, then held or qualifying",
    W._stageOf(mt) === "waiting" && ["held", "qual"].indexOf(W._stageOf(pc)) >= 0);
  check("1e: the source reads the funding tab's snapshot and acts through it, with no table of its own",
    /CPL_FUNDING_TAB\.csm/.test(SRC) && !/rest\/v1|fetch\(/.test(SRC));
  check("1f: the queue opens on All open items and picks the first, the college waiting on the team",
    flat(root.querySelector(".showing")).indexOf("all open items") >= 0 &&
    !!root.querySelector('.row[data-sel="' + COLLEGE + '"][aria-current="true"]'));
}

// ── 2. no PII without a reviewer ─────────────────────────────────────────────
{
  const { T, root } = setup({ signedIn: false });
  const snap = T.csm.snapshot();
  check("2a: a reader who is not signed in gets no names, emails or notes",
    !snap.reviewer && snap.rows.every((r) => r.req === null && r.note === ""));
  check("2b: the page says so, offers no decision, and prints no address",
    /Sign in as a MAP team reviewer/.test(flat(root)) && !root.querySelector('[data-act="accept"]') && !/dana@mtsac\.edu/.test(root.innerHTML));
  check("2c: an action asked without a reviewer is refused", T.csm.act("accept", "part", COLLEGE) === false);
}

// ── 3. the review gate ───────────────────────────────────────────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  const accept = () => root.querySelector('[data-verdict="part"] [data-act="accept"]');
  const deny = () => root.querySelector('[data-verdict="part"] [data-act="deny"]');
  check("3a: a reviewer reads who sent it, with the title the form gave",
    /Dana Lee \(Other senior administrator\), dana@mtsac\.edu/.test(flat(root)));
  const items = W._reviewItems(T.csm.snapshot().rows.find((r) => r.key === COLLEGE), "part").items;
  check("3b: the review names the domain (the form's), the title Other as Check this, and no decline as Meets",
    items[0].s === "form" && /mtsac\.edu/.test(items[0].d) && items[1].s === "check" && items[3].s === "meets");
  check("3c: Accept and Deny stay shut until the reviewer has seen the review", !!accept() && accept().disabled && deny().disabled);
  W._state.seen[COLLEGE + "|part"] = true;
  W.paint();
  check("3d: seen, Deny opens and Accept waits on the checks", !deny().disabled && accept().disabled &&
    /checks? left before Accept/.test(flat(root.querySelector('[data-gate="part"]'))));
  Array.from(root.querySelectorAll('[data-verdict="part"]')[0].closest(".review").querySelectorAll("input[data-check]")).forEach((b) => {
    b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  check("3e: every Check this ticked, Accept opens", !accept().disabled && /Every requirement is checked/.test(flat(root.querySelector('[data-gate="part"]'))));
  // a decline on file fails a requirement: Accept shuts whatever is ticked
  const notes = {}; notes[COLLEGE] = { college: COLLEGE, note: null, declined_at: "2026-11-01T18:00:00Z", declined_by: "co@cccco.edu" };
  T._setNotes(notes);
  W.paint();
  check("3f: a requirement that fails keeps Accept shut and Deny open", accept().disabled && !deny().disabled &&
    /not met/.test(flat(root.querySelector('[data-gate="part"]'))));
}

// ── 4. a decision is the funding tab's ───────────────────────────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  window.CPL_FUNDING_NO_REMOTE = true;
  W._state.seen[COLLEGE + "|part"] = true;
  W.paint();
  Array.from(root.querySelectorAll('.review input[data-check]')).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  const mt = T.csm.snapshot().rows.find((r) => r.key === COLLEGE);
  check("4a: Accept confirms the request through the review lane (the row reads confirmed)", mt.part.confirmed && !mt.part.waiting);
  check("4b: the acceptance email opens in the funding tab's window", !!window.document.getElementById("cplfund-maildlg"));
  check("4c: the record's status line says what happened", /Accepted/.test(flat(root.querySelector(".status"))));
}

// ── 5. the fold, the views, the visit ────────────────────────────────────────
{
  const { window, W, root } = setup({ signedIn: true });
  const fold = () => root.querySelector('[data-act="fold"]');
  check("5a: the top shows at first, its word Hide the summary", fold().getAttribute("aria-expanded") === "true" && !root.querySelector("#cw-fold").hidden);
  clickEl(window, fold());
  check("5b: one word folds Today and the priority cards, and the word turns", root.querySelector("#cw-fold").hidden &&
    fold().getAttribute("aria-expanded") === "false" && fold().textContent === "Show the summary");
  clickEl(window, root.querySelector('[data-stage="notyet"]'));
  check("5c: a board column's word opens its view, Nudge offered on Not yet confirmed",
    W._state.view === "notyet" && !!root.querySelector('[data-act="nudge"]'));
  window.dispatchEvent(new window.CustomEvent("cpl-tab-activated", { detail: { tab: "csm-workspace" } }));
  check("5d: a new visit starts on All open items with nothing typed", W._state.view === "open" && W._state.q === "");
}

// ── 6. Rule 4 and the link from the internal view ────────────────────────────
{
  const tags = (s) => [/<button class="cpl-tab" data-tab="csm-workspace">CSM Workspace<\/button>/.test(s),
    /<div class="cpl-tab-pane" id="tab-csm-workspace" data-tab="csm-workspace">/.test(s),
    /onActivate\('csm-workspace'/.test(s) && /loadScript\('csm_workspace\.js', 'CPL_CSM_WORKSPACE'/.test(s)];
  check("6a: the button, the pane and the boot sit in both HTMLs", tags(IDX).every(Boolean) && tags(CPL).every(Boolean));
  check("6b: the funding tab's toolbar links the workspace beside Nudge, for a signed-in reviewer",
    /<a class="cplfund-csmlink" href="#csm-workspace">CSM Workspace<\/a>/.test(FUND) && /function nudgeBtnHtml\(\) \{\s*return nudgeShown\(\)/.test(FUND));
  const { doc } = setup({ signedIn: true });
  check("6c: rendered, the link shows in the internal view", !!doc.querySelector('#cplFundingMount a.cplfund-csmlink[href="#csm-workspace"]'));
  check("6d: new CSS keys every color to a --cw token, and the dark theme maps each onto a First Light token",
    !/#[0-9A-Fa-f]{3,6}\b/.test(SRC.replace(/var LIGHT = [\s\S]*?;\n/, "")) &&
    /:root\[data-theme="dark"\] #tab-csm-workspace/.test(SRC) && /prefers-color-scheme: dark/.test(SRC));
}

finish();
