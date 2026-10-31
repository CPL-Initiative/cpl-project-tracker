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
  check("1a: the module loads and exposes open, pick and csv", !!N && typeof N.open === "function" && typeof N.pick === "function");
  check("1b: the steps are Sam's order, the CEO last",
    N.STEPS.map((s) => s.col).join(",") === "cpl_coordinator,primary_contact,lead_initiator,vpaa,ceo");
  const inst = [
    { key: "A College", name: "A College", missing: ["part"] },
    { key: "B College", name: "B College", missing: ["part", "nc"] },
    { key: "Calbright", name: "Calbright College", aliases: ["Calbright"], missing: ["nc"] },
    { key: "D College", name: "D College", missing: ["part"] }
  ];
  const contacts = [
    { college: "A College", cpl_coordinator: "Ada Coord", cpl_coordinator_email: "ada@a.edu", primary_contact: "Pat", primary_contact_email: "pat@a.edu" },
    { college: "B College", cpl_coordinator: "", cpl_coordinator_email: "", primary_contact: "", primary_contact_email: " ",
      lead_initiator: "", lead_initiator_email: null, vpaa: "Val VP", vpaa_email: "val@b.edu", ceo: "Cee", ceo_email: "cee@b.edu" },
    { college: "Calbright College Credit", primary_contact_email: "" },
    { college: "Calbright College Non-Credit", primary_contact: "Nora\nNell", primary_contact_email: "nora@calbright.edu, nell@calbright.edu" },
    { college: "D College", cpl_coordinator_email: "not an address" }
  ];
  const p = N.pick(inst, contacts);
  const by = (k) => p.find((r) => r.key === k);
  check("1c: a CPL Coordinator on file is the recipient, named by its step",
    by("A College").to.join() === "ada@a.edu" && by("A College").step === "CPL Coordinator" && by("A College").person === "Ada Coord");
  check("1d: blank steps fall through to the VPAA before the CEO",
    by("B College").to.join() === "val@b.edu" && by("B College").step === "VPAA");
  check("1e: Calbright's two directory rows both count; two people on one line both receive it",
    by("Calbright").to.join() === "nora@calbright.edu,nell@calbright.edu" && by("Calbright").step === "MAP primary CPL contact" &&
      by("Calbright").person === "Nora and Nell");
  check("1f: text that is no address leaves the institution with no one on file", by("D College").to.length === 0 && !by("D College").step);
  const m = N.fill(N.EMAIL_DEFAULT, by("B College"), "2026-11-01");
  check("1g: the email fills the name, institution, both missing items and the deadline in words",
    m.subject === "CPL Implementation Funding: a participation confirmation and a noncredit attestation for B College" &&
      /^Dear Val VP,/.test(m.text) && /November 1, 2026/.test(m.text) && !/\{\w+\}/.test(m.text));
  const csv = N.csv(p, N.EMAIL_DEFAULT, "2026-11-01").trim().split("\r\n");
  check("1h: the mail-merge file has a header and one row a recipient, and leaves out the institution with no one",
    csv[0] === "Email,Name,Institution,Missing,Chosen by,Subject,Body" && csv.length === 4 &&
      !/D College/.test(csv.join("\n")) && /^ada@a\.edu,Ada Coord,A College,/.test(csv[1]));
  check("1i: the module reads the directory and writes nothing: no POST, PATCH or DELETE, no send",
    /map_college_contacts\?select=college,cpl_coordinator,cpl_coordinator_email,/.test(N.CONTACTS_URL) &&
      !/method:\s*"(POST|PATCH|DELETE)"/.test(NUDGE_SRC) && !/rpc\//.test(NUDGE_SRC));

  // The window: preview, then the two outputs.
  let saved = null;
  window.CPL_FUNDING_NUDGE_SAVE = (name, text) => { saved = { name, text }; };
  return N.open({ institutions: inst, deadline: "2026-11-01", contacts: contacts }).then(() => {
    const doc = window.document;
    const dlg = doc.getElementById("cplfund-maildlg");
    check("1j: the window is a labeled modal dialog with focus on its heading",
      !!dlg && dlg.getAttribute("role") === "dialog" && dlg.getAttribute("aria-modal") === "true" &&
        doc.activeElement && doc.activeElement.id === "cplfund-maildlg-h");
    const rows = dlg ? dlg.querySelectorAll(".cplfund-nudge-table tbody tr") : [];
    check("1k: the preview lists every institution, those with no one on file last and said in words",
      rows.length === 4 && /No one on file/.test(rows[3].textContent) && rows[3].querySelector("th[scope=row]"));
    check("1l: the summary counts what is missing and who chose the recipients",
      /4 institutions have not yet sent/.test(dlg.textContent) && /3 have a recipient on file/.test(dlg.textContent) &&
        /1 have no one on file/.test(dlg.textContent));
    const csvBtn = dlg.querySelector("[data-nudgecsv]");
    csvBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("1m: Download for mail merge saves a dated file", !!saved && /^\d{8}_CPL_Funding_Nudge\.csv$/.test(saved.name));
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("1n: Escape closes it", !doc.getElementById("cplfund-maildlg"));
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

  const c = freshDom();
  c.window.CPL_SESSION = session;
  c.window.CPL_FUNDING_PUBLIC = true;
  const docC = boot(c.window);
  c.window.CPL_FUNDING_TAB.render();
  check("2e: never on the public page, signed in or not", !docC.getElementById("cplFundNudge"));

  check("2f: the PII guard holds: cpl_funding.js names no directory address column",
    !/(coordinator|primary_contact|initiator|vpaa|ceo)_email/.test(consumerSrc) && /cpl_funding_nudge\.js/.test(consumerSrc));
  finish();
});
