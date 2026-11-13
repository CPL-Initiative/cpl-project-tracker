// tests/csm_workspace_templates.test.js
//
// THE EMAIL TEMPLATES A REVIEWER CAN CHANGE. Sam, 2026-11-10, reading the two new emails (the Noncredit CPL Lead ask,
// and both asks in one): "can you add a place for me or any reviewer to make changes to the templates for these and
// later make additional changes if needed?" The Funding Follow-up Dashboard keeps the four emails it writes itself as
// templates with words in braces; a reviewer saves a new version in the Email templates pane (csm_templates,
// insert-only), and every reviewer's next email starts from the newest one.
//
// Guards the failure modes that matter:
//   1. THE SHIPPED WORDING IS UNCHANGED: with nothing saved, each email reads as it did before the templates.
//   2. A SAVED VERSION REACHES THE NEXT EMAIL, with its braces filled for the college.
//   3. A WORD THE DASHBOARD CANNOT FILL BLOCKS THE SAVE, so a college never receives "{colege}".
//   4. EVERY CHANGE IS REVERSIBLE: an earlier version loads back, a reset restores the shipped wording, nothing is
//      edited or deleted in the table, and typing survives a repaint.
//   5. ONLY A REVIEWER SEES THE PANE; the table is the reviewers' alone (RLS, no update or delete policy).
//
// Run from repo root: `npm test` (or `node tests/csm_workspace_templates.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const MIG = fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-10_csm_templates.sql"), "utf8");
const GOV = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/governance_surface_map.json"), "utf8"));
const COLLEGE = "Pasadena";

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const clickEl = (window, el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));

function setup(signedIn) {
  const { window } = freshDom();
  if (signedIn) window.CPL_SESSION = Object.assign(window.CPL_SESSION || {}, {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  });
  window.confirm = () => true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true }, optinRow: {}, optinReview: [] });
  T.render();
  const pane = doc.createElement("div");
  pane.id = "tab-csm-workspace";
  pane.innerHTML = '<div id="csm-workspace-root"></div>';
  doc.body.appendChild(pane);
  window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
  window.eval(SRC);
  const W = window.CPL_CSM_WORKSPACE;
  W.boot();
  if (signedIn) W._setContacts({ dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
    primary_contact: "Ana Rivera", primary_contact_email: "ana@pasadena.edu", vpaa: "Val Price", vpaa_email: "val@pasadena.edu" }], landing: [], users: [] });
  return { window, doc, T, W, root: doc.getElementById("csm-workspace-root") };
}

(async function () {
  const { window, doc, T, W, root } = setup(true);
  W._state.view = "all"; W._state.sel = COLLEGE; W.paint();

  // ── 1. the shipped wording ──
  const lead = W._seedMail(COLLEGE, "lead"), nudge = W._seedMail(COLLEGE, "nudge"), held = W._seedMail(COLLEGE, "held"), qual = W._seedMail(COLLEGE, "qualify");
  const clean = (m) => !/[{}]/.test(m.body + m.subject) && !/ {2}| \n|\n{3}/.test(m.body) && /^Dear Ana Rivera,\n\n/.test(m.body) && /\n\nThe CPL Initiative team$/.test(m.body);
  if (process.env.SHOW_MAIL) [nudge, lead, held, qual].forEach((m) => console.log("\n=====\n" + m.subject + "\n---\n" + m.body));
  check("1a: the Noncredit CPL Lead request reads as shipped: the subject names the college, the message names the role and the attestation, no brace is left",
    lead.subject === "CPL Implementation Funding: The Noncredit CPL Lead Role in MAP for Pasadena" &&
    /under that exact title\. A Noncredit CPL Lead attestation on the CPL Implementation Funding page is accepted as well\./.test(lead.body) &&
    /If it is already on its way, or if someone else at Pasadena should receive this note/.test(lead.body) && clean(lead), lead.body);
  // Malone, 2026-11-13: "the participation request email would communicate all the requirements, nc lead, jsts,
  // coordinator". Every condition the record shows is in the email, each with where the college stands.
  {
    const row = W._snapshot().rows.find((r) => r.key === COLLEGE);
    check("1b: ⭐ the participation request names every minimum condition on the college's record, each with its standing, and the deadline where one is set",
      nudge.subject === "CPL Implementation Funding: Participation Confirmation for Pasadena" && row.conds.length >= 2 &&
      row.conds.every((c) => nudge.body.indexOf((c.label || c.words) + ": " + (c.met ? "met" : c.pending ? "pending" : "not yet met")) >= 0) &&
      (!row.nc || /A Noncredit CPL Lead, for the noncredit share: /.test(nudge.body)) && clean(nudge), nudge.body);
    check("1c: the held follow-up lists the open conditions alone, and the qualifying email says the college qualifies",
      held.subject === "CPL Implementation Funding: Remaining Conditions for Pasadena" && /the following remains open:\n\n/.test(held.body) &&
      row.conds.filter((c) => c.met).every((c) => held.body.indexOf(c.label || c.words) < 0) && clean(held) &&
      qual.subject === "CPL Implementation Funding: Minimum Conditions Met for Pasadena" && /Every minimum condition is now met, and Pasadena qualifies for its award\./.test(qual.body) && clean(qual));
    // D2 and D5: an email at a step says what the team accepted, so the acceptance needs no email of its own.
    const keep = { part: row.part, nc: row.nc };
    row.part = Object.assign({}, row.part, { confirmed: true, waiting: false, confirmedAt: "2026-11-11T18:00:00Z" });
    row.nc = Object.assign({}, row.nc || {}, { standing: true, lead: false, waiting: false });
    const h2 = W._seedMail(COLLEGE, "held"), q2 = W._seedMail(COLLEGE, "qualify"), l2 = W._seedMail(COLLEGE, "lead");
    const said = "The CPL Initiative team has accepted the college's participation confirmation on November 11, 2026 and its Noncredit CPL Lead attestation.";
    check("1d: ⭐ each stage email after the first opens with what the team accepted, and says nothing of it when nothing is accepted",
      [h2, q2, l2].every((m) => m.body.indexOf(said) >= 0 && clean(m)) && !/has accepted/.test(lead.body + held.body + qual.body + nudge.body), h2.body);
    row.part = keep.part; row.nc = keep.nc;
    check("1e: the general follow-up keeps its wording", /a follow-up for Pasadena/.test(W._seedMail(COLLEGE, "follow").subject));
  }
  // A version saved before the stage emails shipped holds the wording they replace: it stays in the store as an
  // earlier version, and the shipped wording is in force. A later save wins as before (2a onward).
  {
    W._tpls.rows = [{ id: 1, template_id: "nudge", subject: "Old subject for {college}", body: "Old words.", reset: false, by_email: "m@x.edu", created_at: "2026-11-12T20:18:26Z" },
      { id: 2, template_id: "follow", subject: "Kept for {college}", body: "Kept words.", reset: false, by_email: "m@x.edu", created_at: "2026-11-12T20:16:00Z" }];
    W._tpls.loaded = true;
    check("1f: ⭐ a request wording saved before the stage emails is an earlier version, still held; a template whose shipped wording did not change keeps its saved version",
      W._seedMail(COLLEGE, "nudge").subject === nudge.subject && W._tplOf("nudge").row.id === 1 && W._seedMail(COLLEGE, "follow").subject === "Kept for Pasadena");
    W._tpls.rows = [];
  }

  // ── 5a. the pane, for a reviewer ──
  const word = () => root.querySelector("header [data-tplopen]"), pn = () => root.querySelector("#cw-tpls");
  check("5a: a reviewer gets Email templates in the header, closed at first", !!word() && flat(word()) === "Email templates" &&
    word().getAttribute("aria-expanded") === "false" && !pn());
  clickEl(window, word());
  const pick = () => root.querySelector("#cw-tpls-id"), subj = () => root.querySelector("#cw-tpls-subj"), body = () => root.querySelector("#cw-tpls-body");
  check("5b: opened, the pane offers every email the page writes (seven), the four stage emails first in order, with the shipped wording and the words that fill in",
    !!pn() && Array.prototype.map.call(pick().options, (o) => o.value).join() === "nudge,lead,held,qualify,accept,request_follow,follow" && pick().value === "nudge" &&
    subj().value === "CPL Implementation Funding: Participation Confirmation for {college}" && /\{conditions\}/.test(body().value) &&
    /The wording the dashboard ships with\./.test(flat(pn())) && /\{deadline\}/.test(flat(pn())) && !!pn().querySelector('label[for="cw-tpls-body"]'));
  // Asked in session, 2026-11-12: "make sure that every single Email template is contained in the Email Template
  // editor". The acceptance and the follow-up on a request are the funding tab's emails; they are edited here too, and
  // the funding tab writes from the saved wording.
  {
    const choose = (v) => { pick().value = v; pick().dispatchEvent(new window.Event("change", { bubbles: true })); };
    choose("accept");
    const fd = T.csm.templateDefaults();
    check("5b2: the acceptance opens with the funding tab's own wording and the words it fills in",
      /\{request\} accepted for \{college\}/.test(subj().value) && fd.accept.indexOf(subj().value) >= 0 && /\{date\}/.test(body().value) &&
      /\{request\} participation confirmation, or noncredit attestation/.test(flat(pn())) && !/\{deadline\}/.test(flat(pn().querySelector(".tplform"))) &&
      /Implementation Funding writes this email from the same saved wording/.test(flat(pn())));
    choose("request_follow");
    check("5b3: the follow-up on a request under review opens with its wording", /a follow-up on the \{request\} for \{college\}/.test(subj().value) && /\{note\}/.test(body().value));
    check("5b4: every wording the record's Template menu offers has a place here (Blank has none to keep)",
      ["accept", "accept_nc", "follow", "nudge", "lead", "held", "qualify"].every((id) => pick().querySelector('option[value="' + (id === "accept_nc" ? "accept" : id) + '"]')) &&
      (function () { const m = /var TEMPLATES = \[([\s\S]*?)\];/.exec(SRC); return !!m && (m[1].match(/\{ id: "[a-z_]+"/g) || []).join() ===
        '{ id: "nudge",{ id: "lead",{ id: "held",{ id: "qualify",{ id: "accept",{ id: "accept_nc",{ id: "follow",{ id: "blank"'; })());
    choose("lead");
  }
  check("5c: the preview shows the chosen college's email", /Preview for Pasadena/.test(flat(pn().querySelector("details.tplprev summary"))) &&
    /for Pasadena/.test(flat(pn().querySelector("details.tplprev"))));

  // ── 4a. typing survives a repaint ──
  body().value = "Dear {name},\n\nA shorter ask for {college}.\n\nThe CPL Initiative team";
  body().dispatchEvent(new window.Event("input", { bubbles: true }));
  W.paint();
  check("4a: a repaint keeps the words being typed, and says they are not saved", /A shorter ask/.test(body().value) && /unsaved changes/.test(flat(pn())));

  // ── 3. an unknown word blocks the save ──
  body().value = "Dear {name},\n\nA shorter ask for {colege}.\n\nThe CPL Initiative team";
  body().dispatchEvent(new window.Event("input", { bubbles: true }));
  pn().querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  check("3: a word the dashboard cannot fill blocks the save and is named", W._tpls.rows.length === 0 && /Not saved: \{colege\} is not a word/.test(flat(pn())));

  // ── 2. a saved version reaches the next email ──
  body().value = "Dear {name},\n\nA shorter ask for {college}. {close_title}\n\nThe CPL Initiative team";
  body().dispatchEvent(new window.Event("input", { bubbles: true }));
  pn().querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick(); await tick();
  const saved = W._tpls.rows[0];
  check("2a: Save adds one version for the lead ask, stamped with who saved it, and says it reaches every reviewer",
    W._tpls.rows.length === 1 && saved.template_id === "lead" && saved.reset === false && !!saved.by_email && /Saved\. Every reviewer's next/.test(flat(pn())));
  const next = W._seedMail(COLLEGE, "lead");
  check("2b: the next lead ask starts from it, the braces filled and the empty sentence leaving no stray space",
    next.body === "Dear Ana Rivera,\n\nA shorter ask for Pasadena.\n\nThe CPL Initiative team" && next.subject === lead.subject, JSON.stringify(next.body));
  check("2c: the other templates are untouched", W._seedMail(COLLEGE, "nudge").body === nudge.body);
  check("2d: the pane names who saved the version in force, and offers the shipped wording back", /Saved by /.test(flat(pn())) && !!pn().querySelector("[data-tplreset]"));

  // ── 2e. a teammate's save while this one types ──
  body().value = "Dear {name},\n\nMy edit for {college}.\n\nThe CPL Initiative team";
  body().dispatchEvent(new window.Event("input", { bubbles: true }));
  W._tpls.rows.unshift({ id: 99, activity: "funding", template_id: "lead", subject: "Theirs", body: "Dear {name},\n\nTheir edit.", reset: false,
    by_email: "kristen@rccd.edu", created_at: "2026-11-10T16:00:00Z" });
  pn().querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick(); await tick();
  check("2e: a save over a teammate's newer version is refused and names them, keeping both sets of words",
    W._tpls.rows.length === 2 && W._tpls.rows[0].id === 99 && /Not saved: kristen@rccd\.edu saved this template/.test(flat(pn())) && /My edit for/.test(body().value));
  pn().querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick(); await tick();
  check("2f: saved again knowingly, it goes through", W._tpls.rows.length === 3 && /My edit for \{college\}/.test(W._tpls.rows[0].body));
  W._tpls.rows.splice(0, 2);   // back to the one version 2a saved, for what follows

  // ── 4a1. the cursor ──
  body().focus(); body().setSelectionRange(5, 9);
  W.paint();
  check("4a1: a repaint keeps the cursor where it was in the message", doc.activeElement === body() && body().selectionStart === 5 && body().selectionEnd === 9);

  // ── 4b. earlier versions and the reset ──
  clickEl(window, pn().querySelector("[data-tplreset]"));
  await tick(); await tick();
  check("4b: Put back the shipped wording adds a reset version, and the next email reads as shipped",
    W._tpls.rows.length === 2 && W._tpls.rows[0].reset === true && W._seedMail(COLLEGE, "lead").body === lead.body && /shipped wording is back/.test(flat(pn())));
  const hist = () => pn().querySelector("details.tplhist");
  check("4c: Earlier versions lists both, newest first", !!hist() && /Earlier versions \(2\)/.test(flat(hist().querySelector("summary"))) &&
    hist().querySelectorAll("li").length === 2 && /put back the shipped wording/.test(flat(hist().querySelectorAll("li")[0])));
  clickEl(window, hist().querySelector("[data-tpluse]"));
  check("4d: Load this version puts it back in the box without saving it", /A shorter ask for \{college\}/.test(body().value) && W._tpls.rows.length === 2 &&
    /Save to use it again/.test(flat(pn())));
  clickEl(window, pn().querySelector("[data-tpldiscard]"));
  check("4e: Discard my changes returns the box to the wording in force", body().value === W._tplOf("lead").body);
  pick().value = "held"; pick().dispatchEvent(new window.Event("change", { bubbles: true }));
  check("4f: choosing another template shows its wording", subj().value === "CPL Implementation Funding: Remaining Conditions for {college}");

  // ── 5. the store ──
  check("5d: the table is the funding reviewers' alone, insert-only, stamped by a trigger, granted to the roles its policies name",
    /enable row level security/.test(MIG) && /for select\s+to anon, authenticated using \(public\.is_funding_reviewer\(\)\)/.test(MIG) &&
    /for insert\s+to anon, authenticated with check \(public\.is_funding_reviewer\(\)\)/.test(MIG) && !/for (update|delete)/.test(MIG) &&
    /grant select, insert on public\.csm_templates to anon, authenticated/.test(MIG) && /new\.by_email := nullif\(auth\.jwt\(\) ->> 'email', ''\)/.test(MIG) &&
    /revoke all on function public\.csm_templates_stamp\(\) from public, anon, authenticated/.test(MIG));
  check("5e: the first writer to the table is mapped to its decision right before it ships (Rule 10 a3)", GOV.mapped["table:csm_templates"] === "DR-09");
  check("5f: the rollback beside it drops the table", /drop table if exists public\.csm_templates/.test(
    fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-10_csm_templates_rollback.sql"), "utf8")));

  const anon = setup(false);
  anon.W.paint();
  check("5g: a reader who is not signed in gets no Email templates word and no pane", !anon.root.querySelector("[data-tplopen]") && !anon.root.querySelector("#cw-tpls"));

  finish();
})();
