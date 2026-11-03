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
  // The page loads the college short names globally (both HTMLs); the contacts match a MAP name through them.
  window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
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
  const reads = (SRC.match(/fetch\(R\.url \+ "([a-z_/]+)/g) || []).map((m) => m.replace(/^fetch\(R\.url \+ "/, "")).sort();
  check("1e: the source acts through the funding tab's snapshot; it writes only its own log and reads the three contact sources",
    /CPL_FUNDING_TAB\.csm/.test(SRC) && !/rest\/v1/.test(SRC) &&
    JSON.stringify(reads) === JSON.stringify(["csm_log", "csm_log", "map_college_contacts", "map_college_users", "rpc/map_landing_contacts_roster"]) &&
    (SRC.match(/method: "POST"/g) || []).length === 1 && /rpc\/map_landing_contacts_roster", \{ method: "POST"/.test(SRC));
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
  check("5a: the top shows at first, its word Hide the priorities", fold().getAttribute("aria-expanded") === "true" && !root.querySelector("#cw-fold").hidden);
  clickEl(window, fold());
  check("5b: one word folds the priority cards, and the word turns", root.querySelector("#cw-fold").hidden &&
    fold().getAttribute("aria-expanded") === "false" && fold().textContent === "Show the priorities");
  // Sam, 2026-11-03: folded, Today stays in the header and each count filters the action center as its card does.
  const today = root.querySelector("header .today");
  check("5b2: folded, Today stays in the header outside the fold", !!today && !root.querySelector("#cw-fold .today"));
  check("5b3: Today's counts are words for the cards' views", ["review", "held", "qual", "notyet"].every((v) => !!today.querySelector('button[data-view="' + v + '"]')));
  clickEl(window, today.querySelector('[data-view="held"]'));
  check("5b4: a Today count filters the action center and shows pressed", W._state.view === "held" &&
    root.querySelector('header .today [data-view="held"]').getAttribute("aria-pressed") === "true" && root.querySelector("#cw-fold").hidden);
  check("5b5: the intro under the title is gone", !root.querySelector(".lede"));
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

// ── 7. the communications log (csm_log) ──────────────────────────────────────
{
  const MIG = fs.readFileSync(path.join(ROOT, "kb", "migrations", "2026-11-02_csm_log.sql"), "utf8");
  const GOV = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "governance_surface_map.json"), "utf8"));
  check("7a: the table reads and writes for a signed-in reviewer alone, and the trigger stamps who wrote and who closed",
    (MIG.match(/using \(public\.is_allowed_reviewer\(\)\)|with check \(public\.is_allowed_reviewer\(\)\)/g) || []).length === 5 &&
    /new\.by_email := who;/.test(MIG) && /new\.done_by := who;/.test(MIG) && /new\.by_email := old\.by_email;/.test(MIG) &&
    /revoke all on function public\.csm_log_stamp\(\) from public, anon, authenticated;/.test(MIG));
  check("7b: rows belong to an activity, never the funding module, and a rollback sits beside it",
    /activity\s+text not null default 'funding'/.test(MIG) && fs.existsSync(path.join(ROOT, "kb", "migrations", "2026-11-02_csm_log_rollback.sql")));
  check("7c: the new write surface is mapped before it ships (Rule 10 a3)", GOV.mapped["table:csm_log"] === "DR-09");

  const { window, doc, W, root } = setup({ signedIn: true });
  const pick = (k) => clickEl(window, root.querySelector('.row[data-sel="' + k + '"], .chip[data-sel="' + k + '"]'));
  pick(OTHER);
  const form = () => root.querySelector("form[data-logform]");
  const fld = (n) => form().elements.namedItem(n);
  check("7d: a reviewer's record carries History with the Log form, its words saying no student detail",
    !!form() && /no student detail/.test(fld("body").getAttribute("placeholder")) && /Nothing logged/.test(flat(root)));
  fld("kind").value = "call";
  fld("body").value = "Called the VPAA's office about the coordinator record";
  fld("body").dispatchEvent(new window.Event("input", { bubbles: true }));
  fld("due").value = "2026-11-01";
  form().dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  const log = W._log();
  check("7e: Save writes one row for the college and activity, stamped by the reviewer", log.length === 1 &&
    log[0].college === OTHER && log[0].kind === "call" && log[0].activity === "funding" && log[0].by_email === "co@cccco.edu");
  check("7f: the entry shows in History, with its follow-up and a word to close it",
    /Called the VPAA's office/.test(flat(root)) && !!root.querySelector("[data-logdone]") && /Follow up Nov 1/.test(flat(root)));
  const snapRow = W._snapshot().rows.find((r) => r.key === OTHER);
  check("7g: a follow-up due puts the college in the open queue, its age reading Follow-up due, its next step the note",
    !!root.querySelector('.queue .row[data-sel="' + OTHER + '"]') && /Follow-up due Nov 1/.test(flat(root.querySelector('.queue .row[data-sel="' + OTHER + '"]'))) &&
    /^Follow up: Called the VPAA's office/.test(W._nextStep(snapRow)));
  clickEl(window, root.querySelector("[data-logdone]"));
  check("7h: Mark the follow-up done closes it, stamped, and the college leaves Follow-ups open",
    !!W._log()[0].done_at && W._log()[0].done_by === "co@cccco.edu" && !W._dueOf(snapRow));
  window.confirm = () => true;
  clickEl(window, root.querySelector("[data-logdel]"));
  check("7i: Delete removes the entry", W._log().length === 0);

  // a decision writes its own entry
  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|part"] = true; W.paint();
  Array.from(root.querySelectorAll(".review input[data-check]")).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  check("7j: Accept logs itself: the email opened to copy, never sent", W._log().some((x) => x.college === COLLEGE && x.kind === "email" &&
    /Accepted the participation confirmation; the acceptance email opened to copy\./.test(x.body)));

  const anon = setup({ signedIn: false });
  check("7k: a reader who is not signed in sees no History and no form", !anon.root.querySelector("form[data-logform]") && !/History/.test(flat(anon.root)));
}

// ── 8. the contacts on file, the popups, the email (asks 4, 7, 8, 11, 12, 13) ─────────────────────────────────
{
  const { window, doc, W, root } = setup({ signedIn: true });
  W._setContacts({
    dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu", vpaa: "Val Price", vpaa_email: "val@pasadena.edu",
      ceo: "", ceo_email: "", landing_page_url: "https://cpldashboardcccco.azurewebsites.net/PCC" },
      { college: "Some Other College", cpl_coordinator: "X", cpl_coordinator_email: "x@other.edu" }],
    landing: [{ college: "Pasadena City College", contact_title: "CPL Counselor", contact_name: "Dee Lu", contact_email: "dee@pasadena.edu",
      map_users: [{ role: "Ambassador" }] }],
    users: [{ college: "Pasadena City College", first_name: "Dee", last_name: "Lu", email: "dee@pasadena.edu", role_name: "Ambassador" },
      { college: "Pasadena City College", first_name: "Ivy", last_name: "Init", email: "ivy@pasadena.edu", role_name: "Initiator" }] });
  const c = W._contactsOf(OTHER);
  check("8a: a college's three sources match by name (Pasadena to Pasadena City College), another college's rows stay out",
    c.dir.length === 1 && c.land.length === 1 && c.users.length === 2 && !c.people.some((p) => /other\.edu/.test(p.email)));
  const mm = W._mismatches(OTHER);
  check("8b: the mismatches say what disagrees: the coordinator missing from the landing page, the primary contact not a MAP user",
    mm.some((x) => /CPL Coordinator in MAP's directory \(Rivera, Ana\) is not on the landing page/.test(x)) &&
    mm.some((x) => /primary CPL contact \(Bo Chen\) is not an active MAP user/.test(x)));
  W._state.sel = OTHER; W.paint();
  clickEl(window, root.querySelector('[data-pop="contacts"]'));
  const dlg = () => doc.querySelector("#cw-dlg-host dialog");
  check("8c: Contacts on file opens a popup with the directory's fields, the landing page's people and MAP users by role",
    !!dlg() && /Pasadena contacts/.test(flat(dlg().querySelector("h3"))) && /CPL Coordinator\s*Rivera, Ana, ana@pasadena\.edu/.test(flat(dlg())) &&
    /CEO\s*Not on file/.test(flat(dlg())) && /CPL Counselor: Dee Lu/.test(flat(dlg())) && /Initiator 1/.test(flat(dlg())));
  clickEl(window, dlg().querySelector('[data-pop="people"]'));
  check("8d: Names, titles and emails lists every row with its source, in a table with header cells",
    /names, titles and emails/.test(flat(dlg().querySelector("h3"))) && dlg().querySelectorAll("tbody tr").length === 6 &&
    dlg().querySelectorAll('th[scope="col"]').length === 4);
  const src = dlg().querySelector("[data-psrc]"); src.value = "MAP users"; src.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8e: the source filter narrows the table", dlg().querySelectorAll("tbody tr").length === 2);
  clickEl(window, dlg().querySelector("[data-close]"));
  check("8f: Close removes the popup", !doc.getElementById("cw-dlg-host"));

  const conf = W._mail(OTHER);
  check("8g0: a confirmed college's email opens on the follow-up, To its CPL Coordinator", conf.tpl === "follow" && conf.to === "ana@pasadena.edu");
  W._state.mail = {};
  W._snapshot().rows.find((r) => r.key === OTHER).part.confirmed = false;
  const m = W._mail(OTHER);
  check("8g: a college not yet confirmed gets the nudge: To the CPL Coordinator (Sam's order), Cc the VPAA",
    m.tpl === "nudge" && m.to === "ana@pasadena.edu" && m.cc === "val@pasadena.edu" && /Dear Ana Rivera,/.test(m.body) && /participation confirmation for Pasadena/.test(m.subject));
  W.paint();
  const pick = root.querySelector('input[data-ccpick="ivy@pasadena.edu"]');
  check("8h: Add people to Cc lists the people on file with an address, grouped by source", !!pick &&
    root.querySelectorAll(".ccpick fieldset").length === 3);
  pick.checked = true; pick.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8i: a tick adds the person to More Cc, and the line says how many", W._mail(OTHER).more.join() === "ivy@pasadena.edu" &&
    root.querySelector("#cw-more").value === "ivy@pasadena.edu" && /1 added/.test(flat(root.querySelector(".ccpick summary"))));
  const subj = root.querySelector("#cw-subj"); subj.value = "A new subject"; subj.dispatchEvent(new window.Event("input", { bubbles: true }));
  const to = root.querySelector("#cw-to"); to.value = "bo@pasadena.edu"; to.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("8j: To and Subject take what the reviewer types", W._mail(OTHER).subject === "A new subject" && W._mail(OTHER).to === "bo@pasadena.edu");
  const find = root.querySelector("#cw-ccfind"); find.value = "initiator"; find.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("8k: the picker's finder narrows the list", Array.from(root.querySelectorAll(".ccopt")).filter((o) => !o.hidden).length === 1);
  let href = null; window.CPL_FUNDING_OPEN_MAIL = (h) => { href = h; };
  clickEl(window, root.querySelector('[data-mailact="draft"]'));
  check("8l: Open a draft opens To, Cc (seeded and added) and Subject, and the log notes it with a follow-up a week out",
    /^mailto:bo%40pasadena\.edu\?subject=A%20new%20subject&cc=val%40pasadena\.edu%2Civy%40pasadena\.edu/.test(href || "") &&
    W._log().some((x) => x.college === OTHER && /^Draft opened: A new subject, to bo@pasadena\.edu with 2 on Cc\.$/.test(x.body) && !!x.follow_up_on));
  const tpl = root.querySelector("#cw-tpl"); tpl.value = "blank"; tpl.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8m: a new template reseeds the words and keeps the people added to Cc", W._mail(OTHER).tpl === "blank" && W._mail(OTHER).more.join() === "ivy@pasadena.edu");

  const anon = setup({ signedIn: false });
  check("8n: signed out, no contacts word, no email box, and no contact read", !anon.root.querySelector('[data-pop]') && !anon.root.querySelector("#cw-to"));
}

finish();
