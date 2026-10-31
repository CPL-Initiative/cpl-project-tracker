// tests/cpl_funding_nudge.test.js
//
// NUDGE — Sam, 2026-10-31: "add a Nudge button at the top of the college rows
// internal funding tab that allows me to send nudge emails to all the colleges who
// have not yet requested participation or attested to the NC lead". Recipients in
// his order: "the CPL Coordinator or if there is none, the Ambassador or if there
// is none, initiator, then VPAA, then whomever we have on file", then the CEO.
//
// Guards: the cascade picks the first step holding an address and names it; the
// list is the funding roster's (a sent or waiting request counts as sent); the
// button shows only to a signed-in reviewer on the internal tab; the directory
// addresses stay out of cpl_funding.js (the public page's PII guard), and the
// module sends nothing.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nudge.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, consumerSrc, finish } = H;

const NUDGE_SRC = fs.readFileSync(path.join(__dirname, "..", "cpl_funding_nudge.js"), "utf8");

// ── 1. the module alone ───────────────────────────────────────────────────
(function () {
  const { window } = freshDom();
  window.eval(NUDGE_SRC);
  const N = window.CPL_FUNDING_NUDGE;
  check("1a: the module loads and exposes open, pick, recipients and csv",
    !!N && typeof N.open === "function" && typeof N.pick === "function" && typeof N.recipients === "function");
  check("1b: the primary contact's steps are Sam's order, the CEO last",
    N.STEPS.map((s) => s.col).join(",") === "cpl_coordinator,primary_contact,lead_initiator,vpaa,ceo");
  check("1c: the roles are Sam's list, Primary contact checked by default, deans and directors waiting on the harvest",
    N.ROLES.map((r) => r.id).join(",") === "primary,ceo,vp,amb,init,dean" &&
      N.ROLES.filter((r) => r.on).map((r) => r.id).join() === "primary" &&
      N.ROLES.find((r) => r.id === "dean").disabled === true);
  const inst = [
    { key: "A College", name: "A College", missing: ["part"] },
    { key: "B College", name: "B College", missing: ["part", "nc"] },
    { key: "Calbright", name: "Calbright College", aliases: ["Calbright"], missing: ["nc"] },
    { key: "D College", name: "D College", missing: ["part"] },
    { key: "E College", name: "E College", missing: ["part"], declined: "October 30, 2026" }
  ];
  const contacts = [
    { college: "A College", cpl_coordinator: "Ada Coord", cpl_coordinator_email: "ada@a.edu", primary_contact: "Pat", primary_contact_email: "pat@a.edu",
      ceo: "Cy Ceo", ceo_email: "cy@a.edu", vpaa: "Vee", vpaa_email: "vee@a.edu", vpss: "Ess", vpss_email: "ess@a.edu" },
    { college: "B College", cpl_coordinator: "", cpl_coordinator_email: "", primary_contact: "", primary_contact_email: " ",
      lead_initiator: "", lead_initiator_email: null, vpaa: "Val VP", vpaa_email: "val@b.edu", ceo: "Cee", ceo_email: "cee@b.edu" },
    { college: "Calbright College Credit", primary_contact_email: "" },
    { college: "Calbright College Non-Credit", primary_contact: "Nora\nNell", primary_contact_email: "nora@calbright.edu, nell@calbright.edu" },
    { college: "D College", cpl_coordinator_email: "not an address" },
    { college: "E College", cpl_coordinator: "Eve", cpl_coordinator_email: "eve@e.edu" }
  ];
  const users = [
    { college: "A College", first_name: "Amy", last_name: "Amb", email: "amy@a.edu", role_name: "Ambassador" },
    { college: "A College", first_name: "Ada", last_name: "Coord", email: "ADA@a.edu", role_name: "Ambassador" },
    { college: "A College", first_name: "Ivan", last_name: "Init", email: "ivan@a.edu", role_name: "Initiator" }
  ];
  const p = N.pick(inst, contacts);
  const by = (k) => p.find((r) => r.key === k);
  check("1d: a CPL Coordinator on file is the primary contact, named by its step",
    by("A College").to.join() === "ada@a.edu" && by("A College").step === "CPL Coordinator" && by("A College").person === "Ada Coord");
  check("1e: blank steps fall through to the VPAA before the CEO",
    by("B College").to.join() === "val@b.edu" && by("B College").step === "VPAA");
  check("1f: Calbright's two directory rows both count; two people on one line both receive it",
    by("Calbright").to.join() === "nora@calbright.edu,nell@calbright.edu" && by("Calbright").person === "Nora and Nell");
  check("1g: text that is no address leaves the institution with no one on file", by("D College").to.length === 0);
  const data = { contactsBy: N.indexByName(contacts), usersBy: N.indexByName(users) };
  const all = N.recipients(inst[0], { primary: true, ceo: true, vp: true, amb: true, init: true, dean: true }, data);
  check("1h: every checked role adds its people: primary, CEO, both VPs, Ambassadors, Initiators",
    all.map((r) => r.email.toLowerCase()).sort().join() === "ada@a.edu,amy@a.edu,cy@a.edu,ess@a.edu,ivan@a.edu,vee@a.edu");
  const ada = all.find((r) => r.email.toLowerCase() === "ada@a.edu");
  check("1i: a person in two roles is written to once, both roles named", !!ada && ada.role === "CPL Coordinator; Ambassador");
  check("1j: deans and directors add no one until the harvest",
    N.recipients(inst[0], { dean: true }, data).length === 0);
  const m = N.fill(N.EMAIL_DEFAULT, { person: "Val VP", name: "B College", missing: ["part", "nc"] }, "2026-11-01");
  check("1k: the email fills the name, institution, both missing items and the deadline in words",
    m.subject === "CPL Implementation Funding: a participation confirmation and a noncredit attestation for B College" &&
      /^Dear Val VP,/.test(m.text) && /November 1, 2026/.test(m.text) && !/\{\w+\}/.test(m.text));
  check("1l: the module reads the directory and MAP's users and writes nothing: no POST, PATCH or DELETE, no send",
    /map_college_contacts\?select=college,cpl_coordinator,cpl_coordinator_email,/.test(N.CONTACTS_URL) && /vpss_email/.test(N.CONTACTS_URL) &&
      /map_college_users\?select=.*user_status=eq\.Active&role_name=in\.\(Ambassador,Initiator\)/.test(N.USERS_URL) &&
      !/method:\s*"(POST|PATCH|DELETE)"/.test(NUDGE_SRC) && !/rpc\//.test(NUDGE_SRC) && /h\.Range = /.test(NUDGE_SRC));

  // The window: roles, boxes, Select all and Clear all, the declined override, the outputs.
  let saved = null;
  window.CPL_FUNDING_NUDGE_SAVE = (name, text) => { saved = { name, text }; };
  return N.open({ institutions: inst, deadline: "2026-11-01", contacts: contacts, users: users }).then(() => {
    const doc = window.document;
    const dlg = doc.getElementById("cplfund-maildlg");
    const box = (k) => dlg.querySelector('input[data-nudgepick="' + k + '"]');
    const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
    const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("1m: the window is a labeled modal dialog with focus on its heading",
      !!dlg && dlg.getAttribute("role") === "dialog" && dlg.getAttribute("aria-modal") === "true" &&
        doc.activeElement && doc.activeElement.id === "cplfund-maildlg-h");
    const roleBoxes = dlg.querySelectorAll("input[data-nudgerole]");
    check("1n: the role list shows six roles, Primary contact checked, deans and directors disabled",
      roleBoxes.length === 6 && dlg.querySelector('input[data-nudgerole="primary"]').checked &&
        dlg.querySelector('input[data-nudgerole="dean"]').disabled && !dlg.querySelector('input[data-nudgerole="ceo"]').checked);
    check("1o: every institution has a labeled box; those with someone on file start checked",
      box("A College").checked && box("B College").checked && box("Calbright").checked &&
        box("A College").getAttribute("aria-label") === "Nudge A College");
    check("1p: no one on file: the box is disabled and the row says so in words",
      box("D College").disabled && /No one on file/.test(box("D College").closest("tr").textContent));
    const eRow = box("E College").closest("tr");
    check("1q: a declined institution is grayed, starts unchecked, and its box overrides",
      !box("E College").checked && !box("E College").disabled && eRow.classList.contains("cplfund-nudge-off") &&
        /Declined participation, October 30, 2026\. Check the box to nudge anyway\./.test(eRow.textContent));
    click(dlg.querySelector("[data-nudgenone]"));
    check("1r: Clear all unchecks every box", !dlg.querySelectorAll("input[data-nudgepick]:checked").length &&
      /^0 of 5 checked, 0 recipients$/.test(dlg.querySelector("[data-nudgecount]").textContent));
    click(dlg.querySelector("[data-nudgeall]"));
    check("1s: Select all checks every institution with someone on file and leaves the declined one unchecked",
      box("A College").checked && box("B College").checked && box("Calbright").checked && !box("E College").checked &&
        /^3 of 5 checked, 4 recipients$/.test(dlg.querySelector("[data-nudgecount]").textContent));
    box("B College").checked = false; fire(box("B College"), "change");
    box("E College").checked = true; fire(box("E College"), "change");
    const ceo = dlg.querySelector('input[data-nudgerole="ceo"]');
    ceo.checked = true; fire(ceo, "change");
    check("1t: checking a role redraws the recipients and keeps every box as it was",
      /Cy Ceo \(cy@a\.edu\), CEO/.test(box("A College").closest("tr").textContent) &&
        !box("B College").checked && box("E College").checked);
    click(dlg.querySelector("[data-nudgecsv]"));
    const lines = saved ? saved.text.trim().split("\r\n") : [];
    check("1u: Download for mail merge saves a dated file of the checked institutions alone, one row a recipient",
      !!saved && /^\d{8}_CPL_Funding_Nudge\.csv$/.test(saved.name) &&
        lines[0] === "Email,Name,Institution,Missing,Role,Subject,Body" &&
        /^ada@a\.edu,Ada Coord,A College,/.test(lines[1]) && /^cy@a\.edu,Cy Ceo,A College,a participation confirmation,CEO,/.test(lines[2]) &&
        /eve@e\.edu,Eve,E College/.test(saved.text) && !/B College/.test(saved.text) && !/D College/.test(saved.text));
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("1v: Escape closes it", !doc.getElementById("cplfund-maildlg"));
  });
})().then(() => {
  // ── 2. inside the tab ───────────────────────────────────────────────────
  const session = {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
  const a = freshDom();
  const docA = boot(a.window);
  a.window.CPL_FUNDING_TAB.render();
  check("2a: no Nudge for a reader who is not signed in", !docA.getElementById("cplFundNudge"));

  const b = freshDom();
  b.window.CPL_SESSION = session;
  const docB = boot(b.window);
  const T = b.window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();
  const btn = docB.getElementById("cplFundNudge");
  check("2b: a signed-in reviewer sees Nudge, a word, in the table's toolbar",
    !!btn && btn.textContent === "Nudge" && !!btn.closest(".cplfund-toolbar"));
  const all = T._nudgeInstitutions();
  const first = all[0];
  check("2c: with nothing sent, every roster institution is listed as missing its participation confirmation",
    all.length > 100 && all.every((r) => r.missing.indexOf("part") >= 0) && !all.some((r) => /Cal State LA|Launch Apprenticeship/.test(r.name)));
  const opt = {}; opt[first.key] = { status: "self_attested" };
  T._setElig({ coordOk: true, coord: {}, optinRow: opt });
  check("2d: a waiting request counts as sent", !T._nudgeInstitutions().some((r) => r.key === first.key && r.missing.indexOf("part") >= 0));

  // Declined participation (Sam, 2026-10-31): a reviewer's mark on the notes row, a word on the
  // college row, and the date Nudge shows.
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  const notes = {}; notes[first.key] = { college: first.key, note: null, declined_at: "2026-10-30T18:00:00Z", declined_by: "co@cccco.edu" };
  T._setNotes(notes);
  T.render();
  const rowB = Array.from(docB.querySelectorAll("tr[data-id]")).find((tr) => tr.getAttribute("data-id") === "c:" + first.key);
  check("2g: a declined college's row carries the word Declined for a reviewer",
    !!rowB && !!rowB.querySelector(".cf-declined") && rowB.querySelector(".cf-declined").textContent === "Declined");
  check("2h: Nudge receives the declined date in words",
    (T._nudgeInstitutions().find((r) => r.key === first.key) || {}).declined === "October 30, 2026");
  rowB.querySelector(".cplfund-caret").dispatchEvent(new b.window.MouseEvent("click", { bubbles: true }));
  const clr = docB.querySelector('[data-declineclear="' + first.key + '"]');
  check("2i: the drill-in says who noted it and offers Clear",
    !!clr && /Declined participation, October 30, 2026, noted by co@cccco\.edu\./.test(clr.parentNode.textContent));
  clr.dispatchEvent(new b.window.MouseEvent("click", { bubbles: true }));
  check("2j: Clear removes the mark; the drill-in then offers Mark as declined participation",
    !(T._nudgeInstitutions().find((r) => r.key === first.key) || {}).declined &&
      !!docB.querySelector('[data-declineset="' + first.key + '"]'));
  docB.querySelector('[data-declineset="' + first.key + '"]').dispatchEvent(new b.window.MouseEvent("click", { bubbles: true }));
  check("2k: Mark as declined participation sets it again, dated today",
    !!(T._nudgeInstitutions().find((r) => r.key === first.key) || {}).declined);

  const c = freshDom();
  c.window.CPL_SESSION = session;
  c.window.CPL_FUNDING_PUBLIC = true;
  const docC = boot(c.window);
  c.window.CPL_FUNDING_TAB.render();
  check("2e: never on the public page, signed in or not", !docC.getElementById("cplFundNudge"));
  c.window.CPL_FUNDING_TAB._setNotes(notes);
  c.window.CPL_FUNDING_TAB.render();
  check("2l: the public page shows no declined word and no decline control",
    !docC.querySelector(".cf-declined") && !docC.querySelector("[data-declineset], [data-declineclear]"));

  check("2f: the PII guard holds: cpl_funding.js names no directory address column",
    !/(coordinator|primary_contact|initiator|vpaa|ceo)_email/.test(consumerSrc) && /cpl_funding_nudge\.js/.test(consumerSrc));
  finish();
});
