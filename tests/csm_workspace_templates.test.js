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
  const { window, doc, W, root } = setup(true);
  W._state.view = "all"; W._state.sel = COLLEGE; W.paint();

  // ── 1. the shipped wording ──
  const lead = W._seedMail(COLLEGE, "lead"), both = W._seedMail(COLLEGE, "both"), nudge = W._seedMail(COLLEGE, "nudge");
  check("1a: the lead ask reads as shipped: the subject names the college, the message names the role and the attestation, no brace is left",
    lead.subject === "CPL Implementation Funding: the Noncredit CPL Lead role in MAP for Pasadena" && /^Dear Ana Rivera,\n\n/.test(lead.body) &&
    /under that exact title\. A Noncredit CPL Lead attestation on the CPL Implementation Funding page is accepted as well\./.test(lead.body) &&
    /If it is already on its way, or if someone else at Pasadena should receive this note/.test(lead.body) && !/[{}]/.test(lead.body + lead.subject), lead.body);
  check("1b: both asks read as shipped: two steps, the deadline sentence where one is set, and no doubled space or space before a line break",
    both.subject === "CPL Implementation Funding: two steps for Pasadena" && /Two steps remain\.\n\nFirst, our records/.test(both.body) &&
    /\n\nSecond, for the noncredit share: MAP does not yet show/.test(both.body) && /If either is already on its way/.test(both.body) &&
    !/ {2}| \n/.test(both.body) && !/[{}]/.test(both.body), both.body);
  check("1c: the nudge and the follow-up come from the same templates", /participation confirmation for Pasadena/.test(nudge.subject) &&
    /a follow-up for Pasadena/.test(W._seedMail(COLLEGE, "follow").subject));
  // COBIx on PR 3068: "reads exactly as before" is checked word for word, against the old seedMail's own output for all
  // four emails, with and without a deadline, a close title and a CO Monitor's note (one with indents and doubled spaces).
  {
    const SHIPPED = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/csm_templates_shipped.json"), "utf8")).cases;
    const snap = W._snapshot(), row = snap.rows.find((r) => r.key === COLLEGE), keep = { dl: snap.deadline, nc: row.nc, note: row.note };
    const dl0 = snap.deadline || "2026-12-31", miss = [];
    for (const dl of [dl0, null]) for (const near of [false, true]) for (const note of ["", "Line one\n    indented  two   spaces."]) {
      snap.deadline = dl; row.nc = Object.assign({}, row.nc || {}, { leadNear: near }); row.note = note;
      for (const t of ["lead", "both", "nudge", "follow"]) {
        const k = [t, !!dl, near, !!note].join("|"), m = W._seedMail(COLLEGE, t);
        if (SHIPPED[k] !== m.subject + "\n---\n" + m.body) miss.push(k);
      }
    }
    snap.deadline = keep.dl; row.nc = keep.nc; row.note = keep.note;
    check("1d: with nothing saved, all 32 cases read word for word as the dashboard wrote them before the templates", Object.keys(SHIPPED).length === 32 && miss.length === 0);
    if (miss.length) console.log("1d differs: " + miss.join(", "));
  }

  // ── 5a. the pane, for a reviewer ──
  const word = () => root.querySelector("header [data-tplopen]"), pn = () => root.querySelector("#cw-tpls");
  check("5a: a reviewer gets Email templates in the header, closed at first", !!word() && flat(word()) === "Email templates" &&
    word().getAttribute("aria-expanded") === "false" && !pn());
  clickEl(window, word());
  const pick = () => root.querySelector("#cw-tpls-id"), subj = () => root.querySelector("#cw-tpls-subj"), body = () => root.querySelector("#cw-tpls-body");
  check("5b: opened, the pane offers the four emails the dashboard writes, the lead ask first, with the shipped wording and the words that fill in",
    !!pn() && Array.prototype.map.call(pick().options, (o) => o.value).join() === "lead,both,nudge,follow" && pick().value === "lead" &&
    subj().value === "CPL Implementation Funding: the Noncredit CPL Lead role in MAP for {college}" && /\{close_title\}/.test(body().value) &&
    /The wording the dashboard ships with\./.test(flat(pn())) && /\{deadline\}/.test(flat(pn())) && !!pn().querySelector('label[for="cw-tpls-body"]'));
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
  check("2c: the other templates are untouched", W._seedMail(COLLEGE, "both").body === both.body);
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
  pick().value = "both"; pick().dispatchEvent(new window.Event("change", { bubbles: true }));
  check("4f: choosing another template shows its wording", subj().value === "CPL Implementation Funding: two steps for {college}");

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
