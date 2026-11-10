// tests/cpl_funding_nudge_log.test.js
//
// THE NUDGE LOGS ITSELF (the CSM Workspace lane's NEXT 3: "a mail merge writes one entry per college it reached, with
// a follow-up date").
//
// COBI sends nothing: the mail merge goes out from the reviewer's own mail program. So a download is no proof of a
// send, and the reviewer says so with one word, Log this Nudge. It writes one csm_log entry for each checked
// institution, kind email, with a follow-up a week out, through the funding tab's one bulk write.
//
// Guards the failure modes that matter:
//   1. The word is absent until a list has left COBI, and absent where the caller cannot write the log.
//   2. It files WHAT LEFT COBI, the institutions of the latest download or copy, one entry each, never what is
//      checked at the press (COBIx on the PR); no name or address rides in an entry.
//   3. It writes ONCE: a second press cannot file every college twice. A refused save leaves the word to press again.
//   4. The funding tab's write is one request for all rows, on the reviewer's credential, and reads the rows back
//      (a write RLS filters out answers 2xx having changed nothing).
//   5. The Nudge module itself still holds no write.
//
// Run from repo root: `npm test` (or `node --max-old-space-size=12288 tests/cpl_funding_nudge_log.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const NUDGE_SRC = fs.readFileSync(path.join(ROOT, "cpl_funding_nudge.js"), "utf8");
const FUND = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");
const WS = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");

const inst = [
  { key: "A College", name: "A College", missing: ["part"] },
  { key: "B College", name: "B College", missing: ["part", "nc"] },
  { key: "D College", name: "D College", missing: ["part"] },
];
const contacts = [
  { college: "A College", cpl_coordinator: "Ada Coord", cpl_coordinator_email: "ada@a.edu" },
  { college: "B College", vpaa: "Val VP", vpaa_email: "val@b.edu" },
  { college: "D College", ceo: "nobody", ceo_email: "not an address" },
];
const tick = () => new Promise((r) => setTimeout(r, 0));

function open(extra) {
  const { window } = freshDom();
  window.eval(NUDGE_SRC);
  window.CPL_FUNDING_NUDGE_SAVE = () => {};
  const N = window.CPL_FUNDING_NUDGE;
  return N.open(Object.assign({ institutions: inst, deadline: "2026-12-31", contacts: contacts, users: [] }, extra || {})).then(() => {
    const doc = window.document, dlg = doc.getElementById("cplfund-maildlg");
    const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
    const word = () => dlg.querySelector("[data-nudgelog]");
    const msg = () => dlg.querySelector("[data-nudgemsg]").textContent;
    const box = (k) => dlg.querySelector('input[data-nudgepick="' + k + '"]');
    return { window, N, dlg, click, fire, word, msg, box };
  });
}

(async function () {
  // ── 1 to 3. the window ──────────────────────────────────────────────────────────────────────────────────────
  {
    const calls = [];
    const d = await open({ log: (rows) => { calls.push(rows); return Promise.resolve(true); } });
    check("1a: before any list has left COBI there is no Log this Nudge", !d.word());
    d.click(d.dlg.querySelector("[data-nudgecsv]"));
    check("1b: after the download the word shows, a button reading Log this Nudge",
      !!d.word() && d.word().tagName === "BUTTON" && d.word().textContent === "Log this Nudge");
    // B is unchecked AFTER the download: B's addresses are in the file that left, so B is filed.
    d.box("B College").checked = false; d.fire(d.box("B College"), "change");
    d.click(d.word());
    await tick(); await tick();
    const rows = calls[0] || [];
    check("2a: it files the downloaded set, whatever is checked at the press",
      calls.length === 1 && rows.map((r) => r.college).join() === "A College,B College", JSON.stringify(rows.map((r) => r.college)));
    check("2b: the entry is an email with a follow-up a week out and says what was asked for",
      rows[0] && rows[0].kind === "email" && /^\d{4}-\d{2}-\d{2}$/.test(rows[0].follow_up_on) &&
      Math.round((new Date(rows[0].follow_up_on + "T12:00:00") - new Date(new Date().toDateString() + " 12:00:00")) / 864e5) === 7 &&
      rows[0].body === "Nudge sent by mail merge to 1 person, asking for a participation confirmation.");
    check("2c: no name or address rides in an entry", !/ada|@|Coord/i.test(JSON.stringify(rows)));
    check("3a: once logged the word is gone and the note says how many and when the follow-up falls",
      !d.word() && /^Logged for 2 institutions, each with a follow-up on [A-Z][a-z]+ \d{1,2}, \d{4}\.$/.test(d.msg()) &&
      d.msg().indexOf(new Date(rows[0].follow_up_on + "T12:00:00").getDate() + ", ") > 0, d.msg());
    d.click(d.dlg.querySelector("[data-nudgecsv]"));
    check("3b: a second download does not bring the word back, so one Nudge is filed once", !d.word() && calls.length === 1);
  }
  {
    const d = await open({});
    d.click(d.dlg.querySelector("[data-nudgecsv]"));
    check("1c: a caller that cannot write the log is offered no word", !d.word());
  }
  {
    let n = 0;
    const d = await open({ log: () => { n++; return Promise.resolve(false); } });
    d.click(d.dlg.querySelector("[data-nudgecsv]"));
    d.click(d.word());
    await tick(); await tick();
    check("3c: a refused save says so and leaves the word to press again",
      n === 1 && !!d.word() && d.word().disabled === false && /^The log did not save\./.test(d.msg()));
    const t = await open({ log: () => Promise.reject(new Error("offline")) });
    t.click(t.dlg.querySelector("[data-nudgecsv]"));
    t.click(t.word());
    await tick(); await tick();
    check("3d: a write that throws reads the same way", !!t.word() && /^The log did not save\./.test(t.msg()));
    // A second export replaces the first: the latest list that left is the one filed.
    const got = [];
    const e = await open({ log: (rows) => { got.push(rows); return Promise.resolve(true); } });
    e.click(e.dlg.querySelector("[data-nudgecsv]"));
    e.box("A College").checked = false; e.fire(e.box("A College"), "change");
    e.click(e.dlg.querySelector("[data-nudgecsv]"));
    e.box("A College").checked = true; e.fire(e.box("A College"), "change");
    e.click(e.word());
    await tick(); await tick();
    check("3e: after a second export the latest list is the one filed, and a box checked afterward is not",
      got.length === 1 && got[0].map((r) => r.college).join() === "B College", JSON.stringify(got));
  }
  check("2d: the entries builder words two missing items and a plural",
    (function () { const { window } = freshDom(); window.eval(NUDGE_SRC);
      const r = window.CPL_FUNDING_NUDGE.logEntries([{ inst: inst[1], recips: [{}, {}, {}] }], "2026-11-17")[0];
      return r.college === "B College" && r.follow_up_on === "2026-11-17" && r.body === "Nudge sent by mail merge to 3 people, asking for a participation confirmation and a noncredit attestation."; })());

  // ── 4. the funding tab's write ──────────────────────────────────────────────────────────────────────────────
  {
    const { window } = freshDom();
    boot(window);
    const T = window.CPL_FUNDING_TAB;
    let heard = 0;
    window.addEventListener("cpl-csm-log-changed", () => { heard++; });
    const ok = await T._nudgeLog([{ college: "A College", kind: "email", body: "x", follow_up_on: "2026-11-17", extra: "dropped" }]);
    const kept = T._nudgeLogged();
    check("4a: without a remote the rows are kept and the workspace is told",
      ok === true && kept.length === 1 && kept[0].activity === "funding" && kept[0].college === "A College" && !("extra" in kept[0]) && heard === 1);
    check("4b: an empty list writes nothing", (await T._nudgeLog([])) === false && T._nudgeLogged().length === 1);
  }
  const fn = (FUND.match(/function nudgeLog\(entries\) \{[\s\S]*?\n  \}/) || [""])[0];
  check("4c: one POST carries every row, and the answer is the rows that came back",
    (fn.match(/fetch\(/g) || []).length === 1 && /\/rest\/v1\/csm_log", \{ method: "POST"/.test(fn) &&
    /Prefer: "return=representation"/.test(fn) && /body: JSON\.stringify\(rows\)/.test(fn) &&
    /Array\.isArray\(back\) && back\.length === rows\.length/.test(fn));
  check("4d: it writes on the reviewer's credential and to the funding activity",
    /applyWriteAuth\(/.test(fn) && /activity: "funding"/.test(fn));
  check("4e: the Nudge is handed the write, and the workspace reads its log again when told",
    /headers: rh, log: nudgeLog \}/.test(FUND) && /addEventListener\("cpl-csm-log-changed", function \(\) \{ if \(LOG\.asked\) loadLog\(\); \}\)/.test(WS));

  // ── 5. the module holds no write ────────────────────────────────────────────────────────────────────────────
  check("5a: the Nudge module still holds no POST, PATCH or DELETE and no rpc",
    !/method:\s*"(POST|PATCH|DELETE)"/.test(NUDGE_SRC) && !/rpc\//.test(NUDGE_SRC));

  finish();
})();
