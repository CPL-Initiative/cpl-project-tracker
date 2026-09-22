// A picker shows the official choices, and saves into the same record as the chip.
//
// Sam, 2026-09-22, after ruling 26 items: "add a Subject and Discipline picker
// to each item so I can at least see what the official choices are." Three of
// his first eight replies had put in a NOTE what a picker captures as a value
// ("to Photography", "should be Theater", "Ethnic Studies"), and two asked
// outright whether a code was a subject or a discipline (ATHL, Diesel). A note
// is prose the session has to interpret; a picker value is data.
//
// Two things this guards:
//   * ONE SHARED DATALIST, NOT A SELECT PER CARD. The official lists run to 320
//     subject codes and 248 MQ disciplines. Fifty cards each carrying their own
//     copy is ~28,000 option elements; one datalist per list is 568 total.
//   * A PICKER VALUE COUNTS AS A REPLY. Without that, choosing a discipline and
//     touching nothing else reads as an untouched item under opt-out, and gets
//     handed over as the proposal — the exact collapse the two-states rule exists
//     to prevent.
//
// Run from repo root: `npm test` (or `node tests/decision_sheet_pickers.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pickers-"));

function build(py) {
  const f = path.join(TMP, "s" + Math.random().toString(36).slice(2) + ".py");
  fs.writeFileSync(f, "import sys\nsys.path.insert(0, 'kb')\n" +
    "import _decision_sheet_replies as m\n" + py);
  return execFileSync("python3", [f], { stdio: "pipe" }).toString();
}

const ITEM =
  "{'title': 'Race and Ethnic Relations', 'ref': 'SOCI M1038'," +
  " 'facts': 'Filed under Sociology.', 'why': 'Flagged on vocabulary.'," +
  " 'rec': 'Leave it under Sociology.', 'rows': 4, 'pickers': [" +
  "  {'name': 'subject', 'label': 'Subject code', 'list': 'dl-subjects'," +
  "   'value': 'SOCI', 'placeholder': 'one of 320 canonical codes'}," +
  "  {'name': 'discipline', 'label': 'MQ discipline', 'list': 'dl-disciplines'," +
  "   'value': 'Sociology', 'placeholder': \"one of the CO's 248 disciplines\"}]}";

const html = build(
  `subs = ['ARTS', 'SOCI', 'MUSI']\n` +
  `disc = ['Art', 'Ethnic Studies', 'Sociology', 'Theater Arts']\n` +
  `out = m.build_sheet('Picker sheet', [${ITEM}, dict(${ITEM}, title='Second')],\n` +
  `                    sheet_id='pick', lists={'dl-subjects': subs, 'dl-disciplines': disc})\n` +
  `sys.stdout.write(out)\n`);

const vc = new VirtualConsole();
const doc = new JSDOM(html, { virtualConsole: vc }).window.document;

/* ── 1. one datalist per list, shared by every card ───────────────────────── */
const lists = Array.from(doc.querySelectorAll("datalist"));
check("the option lists are declared once, not per card",
  lists.length === 2, `${lists.length} datalists for 2 lists across 2 cards`);

check("every option is present exactly once",
  doc.querySelectorAll("datalist option").length === 7,
  String(doc.querySelectorAll("datalist option").length));

const inputs = Array.from(doc.querySelectorAll("input[data-pick]"));
check("each card carries its own pair of picker inputs",
  inputs.length === 4, String(inputs.length));

check("every picker points at a datalist that exists",
  inputs.every((i) => doc.getElementById(i.getAttribute("list"))),
  inputs.map((i) => i.getAttribute("list")).join(","));

/* ── 2. the picker arrives showing where the course sits NOW ──────────────── */
const first = inputs.slice(0, 2);
check("the pickers arrive filled with the current subject and discipline",
  first[0].value === "SOCI" && first[1].value === "Sociology",
  first.map((i) => i.value).join(" / "));

check("each picker is labelled, so the two lists are told apart",
  first.every((i) => {
    const lbl = i.closest("label");
    return lbl && /Subject code|MQ discipline/.test(lbl.textContent);
  }), "a bare box does not say which vocabulary it draws on");

/* ── 3. a picker value is a REPLY, not decoration ─────────────────────────── */
// ⚠️ Under opt-out an item with no stored reply is handed over carrying the
// proposal. If `empty()` ignored picker fields, choosing a discipline and
// nothing else would be indistinguishable from never having looked.
const js = html.slice(html.indexOf("function empty("));
check("⭐ a picker value alone stops an item reading as untouched",
  /r\.subject \|\| r\.discipline/.test(js.slice(0, 400)),
  "empty() must count picker fields or the reply is silently discarded");

check("a picker writes into the same record as the chip",
  /patch\[key\] = v; set\(item, patch\)/.test(html),
  "a second store is a store the session has to be told to read");

/* ── 4. an off-list value is kept and marked, never rejected ──────────────── */
// Sam asked to SEE the official choices, not to be confined to them: a name he
// reaches for that the list lacks is itself a finding about the list.
check("a value off the official list is still saved, and flagged",
  /setAttribute\("data-off"/.test(html) && /function onList\(/.test(html),
  "rejecting an unlisted name would hide the gap it reveals");

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
for (const [name, ok, why] of results) {
  console.log(`${ok ? "  ok" : "FAIL"}  ${name}${ok ? "" : "  — " + why}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
