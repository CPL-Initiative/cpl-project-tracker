// The high-water mark — the last item with any input, and what it licenses.
//
// Sam, 2026-09-22: "On these decision sheets, you can assume that the last item
// showing some sort of input is an indicator that everything prior to it is good
// to go as is." He said it after the CCR title-rung sitting, where the store
// held 8 reply documents and he had actually ruled on 26 — he only touched the
// items he disagreed with and left the rest carrying their proposal.
//
// Two things this guards:
//
//   * ⭐ THE MARK REACHES THE SESSION. Under opt-out an untouched item is
//     `by: "default"` whether it was read and agreed with or never seen. The
//     mark is the only thing that separates them, so the paste line has to say
//     where it fell — the paste line being the path used precisely when the
//     send is refused.
//
//   * ⭐ COMPLETE DESTROYS THE MARK UNLESS IT IS READ FIRST. The Complete
//     handler stores a reply for every as-proposed item. After that loop every
//     card carries input, so a mark computed afterwards always reads as the last
//     card on the sheet — it would report a sheet read to the end no matter
//     where the reader actually stopped.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_high_water.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "highwater-"));
function build(py) {
  const f = path.join(TMP, "s" + Math.random().toString(36).slice(2) + ".py");
  fs.writeFileSync(f, "import sys\nsys.path.insert(0, 'kb')\n" +
    "import _decision_sheet_replies as m\n" + py);
  return execFileSync("python3", [f], { stdio: "pipe" }).toString();
}

const items = [];
for (let i = 1; i <= 4; i++) {
  items.push("{'title': 'Course " + i + "', 'ref': 'SOCI M10" + i + "'," +
    " 'facts': 'Filed under Sociology.', 'rec': 'Leave it under Sociology.'}");
}
const html = build(
  "out = m.build_sheet('Mark sheet', [" + items.join(", ") + "], sheet_id='mark')\n" +
  "sys.stdout.write(out)\n");

// The artifact store stub: frozen snapshot bodies, same contract as the
// decision_sheet_replies suite uses against the committed sheet.
const writes = [];
const held = {};
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
        return { set(data) { writes.push({ id, data: JSON.parse(JSON.stringify(data)) }); seed(id, data); return Promise.resolve(); } };
      },
      onSnapshot(next) { listener = next; echo(); return () => {}; },
    };
  },
};

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(String(e && e.message)));

const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole: vc, pretendToBeVisual: true,
  url: "https://sheet.test/mark",
  beforeParse(w) { w.claude = { use: (name) => Promise.resolve(name === "db" ? db : null) }; } });
const document = dom.window.document;
const pasteLine = () => document.getElementById("reply-line").value;

(async () => {
  await tick(30);

  /* ── 1. an untouched sheet has no mark ──────────────────────────────────── */
  check("an untouched sheet claims nothing is reviewed",
    !/reviewed through/.test(pasteLine()), pasteLine().slice(0, 160));

  /* ── 2. input on item 2 of 4 marks 1–2 read and 3–4 unreached ───────────── */
  seed("2", { item: "2", v: "move", note: "to Photography", fu: false, by: "sam",
              t: "2026-09-22T17:00:00.000Z" });
  echo();
  await tick(20);
  check("⭐ the paste line names the mark",
    /reviewed through 2\b/.test(pasteLine()), pasteLine().slice(0, 300));
  check("⭐ the paste line says the rest was not reached",
    /the items after it were not reached/.test(pasteLine()), pasteLine().slice(0, 300));
  check("items above the mark still report as proposals, not verdicts",
    /3 .*\(as proposed\)/.test(pasteLine()) && /4 .*\(as proposed\)/.test(pasteLine()),
    pasteLine().slice(0, 300));

  /* ── 3. "some sort of input" is wider than a chip ───────────────────────── */
  // A note alone, with no verdict, still marks how far the reader got.
  seed("3", { item: "3", v: "", note: "not sure about this one", fu: false, t: "2026-09-22T17:05:00.000Z" });
  echo();
  await tick(20);
  check("⭐ a note with no verdict still moves the mark",
    /reviewed through 3\b/.test(pasteLine()), pasteLine().slice(0, 300));

  /* ── 4. the mark is read BEFORE Complete commits the proposals ──────────── */
  document.getElementById("submit-btn").click();
  await tick(40);
  const done = writes.filter((w) => w.id === "done").pop();
  check("Complete records a done row", !!done, JSON.stringify(writes.map((w) => w.id)));
  check("⭐ the done row carries the mark from BEFORE the commit",
    done && done.data.through === "3",
    done ? "through = " + JSON.stringify(done.data.through) + " (4 means it was read after the commit)" : "no done row");
  check("Complete still commits every untouched item as proposed",
    writes.filter((w) => w.data && w.data.by === "default").length === 2,
    JSON.stringify(writes.filter((w) => w.data && w.data.by === "default").map((w) => w.id)));
  check("nothing threw", errors.length === 0, errors.join(" | "));

  /* ── 5. a mark on the last card reads as the whole sheet ────────────────── */
  const dom2 = new JSDOM(html, { runScripts: "dangerously", virtualConsole: new VirtualConsole(),
    pretendToBeVisual: true, url: "https://sheet.test/mark2",
    beforeParse(w) {
      const h2 = { "4": Object.freeze({ item: "4", v: "move", note: "", fu: false, t: "2026-09-22T17:00:00.000Z" }) };
      const db2 = { collection() { return {
        doc() { return { set() { return Promise.resolve(); } }; },
        onSnapshot(next) { next({ docs: Object.keys(h2).map((id) => ({ id, exists: true, data: () => h2[id] })) }); return () => {}; } }; } };
      w.claude = { use: (name) => Promise.resolve(name === "db" ? db2 : null) };
    } });
  await tick(30);
  const line2 = dom2.window.document.getElementById("reply-line").value;
  check("a mark on the last card reads as the whole sheet",
    /reviewed through 4 \(the whole sheet\)\./.test(line2), line2.slice(0, 300));

  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log(`${ok ? "  ok" : "FAIL"}  ${name}${ok ? "" : "  — " + why}`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
