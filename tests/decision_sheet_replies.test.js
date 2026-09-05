// Reply controls on a decision sheet — kb/_decision_sheet_replies.py, as it
// sits on the committed 2026-09-05 memory sheet. Two failures Sam reported on
// 2026-09-05, an hour after the controls shipped, and both are guarded here
// against the REAL sheet rather than a fixture:
//
//   * ⭐ THE STORE'S ECHO IS FROZEN. The artifact store delivers snapshot
//     bodies frozen ("clone a body before editing it for a write"). The first
//     version adopted the echoed body as the page's state and assigned into
//     it; outside strict mode that assignment is silently ignored, so from an
//     item's FIRST SAVE on, every later click painted nothing and wrote the
//     unchanged document back. Sam: "I click Follow Up and it doesn't turn blue
//     but does say response was saved." The store showed it: memories with two
//     to six writes all carrying the first write's timestamp. This test hands
//     the page a store whose snapshots are Object.freeze'd, saves once, lets
//     the echo land, and then expects the next click to paint AND to write.
//
//   * A YES UNDER A CLAIM READS BOTH WAYS. "Keep the $1 million noncredit
//     funding…" sat under a retire batch with chips Yes · Keep · Later. Sam:
//     "unclear if I am saying Yes to Keep $1M NC funding… Or… Yes that it is
//     no longer true." Under a memory the first chip now NAMES the batch's
//     action — Retire under a retire batch, Verify under a verify batch — and
//     the line under each reply says what was saved, in words.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_replies.test.js`).
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SHEET = "docs/visuals/2026-09-05-memory-audit-verdicts.html";
const html = fs.readFileSync(SHEET, "utf8");

// A stand-in for the artifact store with the contract's one sharp edge: what a
// snapshot delivers is frozen, and the same object comes back until it changes.
const writes = [];            // every set() the page makes, in order
const held = {};              // id -> the frozen body the store holds
let listener = null;
function snapshot() {
  return { docs: Object.keys(held).map((id) => ({ id, exists: true, data: () => held[id] })) };
}
function echo() { if (listener) listener(snapshot()); }
function seed(id, body) { held[id] = Object.freeze(JSON.parse(JSON.stringify(body))); }
const db = {
  collection() {
    return {
      doc(id) {
        return {
          set(data) {
            writes.push({ id, data: JSON.parse(JSON.stringify(data)) });
            seed(id, data);
            return Promise.resolve();
          },
        };
      },
      onSnapshot(next) { listener = next; echo(); return () => {}; },
    };
  },
};

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(String(e && e.message || e)));
vc.on("error", (m) => errors.push(String(m)));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://sheet.test/verdicts",
  virtualConsole: vc,
  beforeParse(window) {
    window.claude = { use: (name) => Promise.resolve(name === "db" ? db : null) };
  },
});
const { window } = dom;
const { document } = window;
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 5));

(async () => {
  await tick(20);   // claude.use("db") resolves and the first (empty) snapshot lands

  const RETIRE = '3.nc-funding-targeted-plus-advisory-column';
  const BOARD = '3.bog-amendment-is-funding-authority';
  const VERIFY = '2.o3';
  const block = (item) => document.querySelector('.reply[data-item="' + item + '"]');
  const chips = (item) => Array.from(block(item).querySelectorAll('.reply-chip[data-v]'));
  const words = (item) => chips(item).map((b) => b.textContent.trim());
  const values = (item) => chips(item).map((b) => b.getAttribute("data-v"));
  const chip = (item, v) => chips(item).find((b) => b.getAttribute("data-v") === v);
  const fuBtn = (item) => block(item).querySelector(".reply-fu");
  const stateLine = (item) => block(item).querySelector(".reply-state").textContent.trim();

  // ── the words under a memory name the batch's action ───────────────────────
  check("sheet: the store answered (replies save to the sheet)",
    /save to this sheet/.test(document.getElementById("reply-where").textContent),
    "the stub db was not picked up; the rest of this file would test the browser-only path");
  check("retire batch: the first chip under a memory says Retire, not Yes",
    words(RETIRE)[0] === "Retire" && values(RETIRE)[0] === "retire",
    "got " + JSON.stringify(words(RETIRE)));
  check("retire batch: Keep and Later follow",
    JSON.stringify(words(RETIRE)) === JSON.stringify(["Retire", "Keep", "Later"]),
    "got " + JSON.stringify(words(RETIRE)));
  check("verify batch: the first chip under a memory says Verify",
    JSON.stringify(words(VERIFY)) === JSON.stringify(["Verify", "Hold out", "Rewrite", "Later"]),
    "got " + JSON.stringify(words(VERIFY)));
  check("item level keeps Yes (the ask sits right above it)",
    words("3")[0] === "Yes" && words("1")[0] === "Yes",
    "got " + JSON.stringify(words("3")) + " / " + JSON.stringify(words("1")));
  check("no chip anywhere is an empty label",
    Array.from(document.querySelectorAll(".reply-chip")).every((b) => b.textContent.trim().length > 0),
    "a chip without a word is a glyph");
  check("the how-to names Verify and Retire",
    /Verify<\/em> or <em>Retire/.test(document.querySelector(".howto").innerHTML),
    "the box that defines the words must define these");

  // ── save once, let the frozen echo land, then change it again ──────────────
  chip(RETIRE, "retire").click();
  await tick(10);
  check("click 1: Retire pressed", chip(RETIRE, "retire").getAttribute("aria-pressed") === "true");
  check("click 1: one write, v=retire", writes.length === 1 && writes[0].id === RETIRE && writes[0].data.v === "retire",
    JSON.stringify(writes));
  check("click 1: the state line names the saved word", stateLine(RETIRE) === "Saved to the sheet: Retire.",
    "got " + JSON.stringify(stateLine(RETIRE)));
  const t1 = writes[0].data.t;

  echo();           // the store echoes the write back, FROZEN
  await tick(10);
  check("echo: still pressed after the frozen echo", chip(RETIRE, "retire").getAttribute("aria-pressed") === "true");
  check("echo: the echo alone writes nothing", writes.length === 1, "writes now " + writes.length);

  await tick(5);    // a later millisecond, so `t` can move
  fuBtn(RETIRE).click();
  await tick(10);
  check("⭐ click 2 after the echo: Follow up is PRESSED",
    fuBtn(RETIRE).getAttribute("aria-pressed") === "true",
    "the click after an item's first save must paint — this is Sam's report");
  check("⭐ click 2: a second write carries fu=true and keeps v=retire",
    writes.length === 2 && writes[1].data.fu === true && writes[1].data.v === "retire",
    JSON.stringify(writes.map((w) => w.data)));
  check("⭐ click 2: the write is newer than the first",
    writes.length === 2 && String(writes[1].data.t) > String(t1),
    "an unchanged `t` is the signature of the frozen-object bug");
  check("click 2: the state line says both", stateLine(RETIRE) === "Saved to the sheet: Retire, follow up.",
    "got " + JSON.stringify(stateLine(RETIRE)));
  check("click 2: the bar counts one to follow up",
    /1 to follow up/.test(document.getElementById("reply-count").textContent),
    "got " + document.getElementById("reply-count").textContent);
  check("click 2: the reply line carries the item, the word and the flag",
    document.getElementById("reply-line").value.indexOf(RETIRE + " retire, follow up") >= 0,
    document.getElementById("reply-line").value.slice(0, 200));

  echo();           // and again after the second write
  await tick(10);
  chip(RETIRE, "keep").click();          // a changed verdict after two echoes
  await tick(10);
  check("click 3 after two echoes: the verdict changes to Keep",
    chip(RETIRE, "keep").getAttribute("aria-pressed") === "true" && chip(RETIRE, "retire").getAttribute("aria-pressed") === "false");
  check("click 3: written with fu still true",
    writes.length === 3 && writes[2].data.v === "keep" && writes[2].data.fu === true, JSON.stringify(writes.map((w) => w.data)));

  // ── a reply saved before the relabel (v="yes") is Sam's own case ───────────
  seed(BOARD, { item: BOARD, ref: "bog-amendment-is-funding-authority", title: "The Board amendment", v: "yes", note: "", fu: false, t: "2026-09-05T15:10:58.956Z" });
  echo();
  await tick(10);
  check("legacy yes: nothing throws and no chip claims it",
    chips(BOARD).every((b) => b.getAttribute("aria-pressed") === "false") && errors.length === 0,
    errors.join(" | "));
  check("legacy yes: the state line still names it", stateLine(BOARD) === "Saved to the sheet: yes.",
    "got " + JSON.stringify(stateLine(BOARD)));
  fuBtn(BOARD).click();
  await tick(10);
  check("⭐ legacy yes + Follow up: pressed and written with v kept",
    fuBtn(BOARD).getAttribute("aria-pressed") === "true" && writes.length === 4 && writes[3].id === BOARD && writes[3].data.fu === true && writes[3].data.v === "yes",
    JSON.stringify(writes.slice(3).map((w) => w.data)));

  // ── the page never holds the store's object ───────────────────────────────
  echo();
  await tick(10);
  const ls = JSON.parse(window.localStorage.getItem("sheet-replies:2026-09-05-memory-audit-verdicts") || "{}");
  check("browser copy mirrors the store after the echoes",
    ls[RETIRE] && ls[RETIRE].v === "keep" && ls[RETIRE].fu === true && ls[BOARD] && ls[BOARD].fu === true,
    JSON.stringify({ r: ls[RETIRE], b: ls[BOARD] }));
  check("no script error on the sheet", errors.length === 0, errors.join(" | "));

  let failed = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok   " : "  FAIL ") + name + (ok || !why ? "" : "\n         " + why));
    if (!ok) failed++;
  }
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
