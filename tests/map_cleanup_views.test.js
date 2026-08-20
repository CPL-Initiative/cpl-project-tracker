// 🧹 CSM clean-up views — map_cleanup_views.js.
//   Two READ-ONLY views on the MAP Data Quality tab. Sam, 2026-08-20: "my goal
//   is to guide CSM team to make changes in MAP rather than house and maintain
//   data layers in COBI." Every check below guards a way that intent gets
//   quietly violated, or a way a reader is told something false.
//
// Run from repo root: `npm test` (or `node tests/map_cleanup_views.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("map_cleanup_views.js", "utf8");

const WORK = [
  { college_id: 1, college_name: "Big College", priority: 1, class: "recommendations that cannot yield credit",
    subclass: "ace-no-credit", effort_shape: "one rule", owner: "college CPL staff", rows: 900, students: 700,
    action: "Rule these Not Applicable.", contact_name: "A Person", contact_email: "a@x.edu" },
  { college_id: 1, college_name: "Big College", priority: 5, class: "Credit by Exam opportunities",
    subclass: "cx-course-named", effort_shape: "one rule", owner: "college CPL staff (student-facing)",
    rows: 40, students: 38, action: "Present these to the student as CREDIT BY EXAM options.",
    contact_name: "A Person", contact_email: "a@x.edu" },
  { college_id: 2, college_name: "Small College", priority: 1, class: "recommendations that cannot yield credit",
    subclass: "ace-no-credit", effort_shape: "one rule", owner: "college CPL staff", rows: 10, students: 9,
    action: "Rule these Not Applicable.", contact_name: null, contact_email: null },
];
const GUIDE = [
  { exhibit_id: "MOS-31B-002", exhibit_title: "Military Police", rows_n: 156, colleges_n: 64, tier: 1,
    tier_note: "corroborated and specific", strong_courses: 1, blanket_courses: 1,
    map_action: "IN MAP: take the corroborated course to the college as a candidate. If it fits, attach it as the local course and set the CPL type to Credit by Exam.",
    peer_courses: [{ course: "ADJ-1 Intro", colleges: 3, spans_exhibits: 1, blanket: false },
                   { course: "MAG-51 Elements of Supervision", colleges: 3, spans_exhibits: 33, blanket: true }] },
  { exhibit_id: "MOS-99Z-999", exhibit_title: null, rows_n: 4, colleges_n: 4, tier: 3,
    tier_note: "no college has named a course", strong_courses: 0, blanket_courses: 0, peer_courses: [],
    map_action: "IN MAP: no course is suggested here on purpose. Take the exhibit title to the college. Do NOT bulk-rule Not Applicable." },
];

function makeDom() {
  return new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-map-data-quality"><div id="mcw-root"></div><div id="mdq-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
}

async function run() {
  const dom = makeDom();
  const w = dom.window;
  // A team-phrase stub that is UNLOCKED, plus a fetch stub serving the fixtures.
  w.CPL_TEAM_PHRASE = {
    session: () => ({ teamPass: "x", site: null, email: "(team)" }),
    decorateHeaders: (h) => { h["x-team-pass"] = "x"; },
    unlockRow: () => w.document.createElement("div"),
  };
  const calls = [];
  w.fetch = (url) => {
    calls.push(url);
    const body = String(url).indexOf("map_cleanup_worklist") !== -1 ? WORK : GUIDE;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  };
  w.eval(src);
  w.CPL_CLEANUP_VIEWS.mount();
  await tick(); await tick(); await tick();

  const root = w.document.getElementById("mcw-root");
  const text = root.textContent;

  // ── 1. The framing must be ON SCREEN. A reader who does not know COBI is
  // read-only will reasonably expect it to remember what they did.
  check("says read-only and points at MAP", /Read-only\. Make the change in MAP\./.test(text));

  // ── 2. NO WRITE PATH. This is the constraint, so it is asserted against the
  // SOURCE, not the DOM: a button added later would pass a DOM check until
  // someone clicked it.
  check("source issues no POST/PATCH/DELETE", !/method\s*:\s*["'](POST|PATCH|PUT|DELETE)["']/i.test(src));
  // Matches the PostgREST write header VALUE, not the word "Prefer" — the first
  // cut of this check used /Prefer/i and tripped on `prefers-color-scheme` in
  // the injected CSS. A guard that fires on its own file's styling gets deleted
  // by the next person rather than tightened.
  check("source sends no PostgREST write header", !/return=(minimal|representation)/i.test(src));
  check("no editable controls rendered",
    root.querySelectorAll("textarea").length === 0 &&
    root.querySelectorAll('input:not([type="search"])').length === 0);

  // ── 3. Every item tells the reader what to do IN MAP.
  const actions = root.querySelectorAll(".mcw-action");
  check("every item carries a 'Do in MAP' line", actions.length === WORK.length &&
    Array.prototype.every.call(actions, (a) => /Do in MAP:/.test(a.textContent)));

  // ── 4. A college with no contact must SAY SO rather than render blank —
  // blank reads as "nothing needed here".
  check("missing contact is stated, not blank", /no CPL contact on file/.test(text));

  // ── 5. The copy output is what a CSM person takes to the college.
  const copyText = w.CPL_CLEANUP_VIEWS._collegeText("Big College", WORK.slice(0, 2));
  check("copy names the college", /^MAP clean-up — Big College/.test(copyText));
  check("copy carries the MAP action", /Do in MAP: Rule these Not Applicable\./.test(copyText));
  check("copy says where the record lives", /Make the change in MAP/.test(copyText));
  const noContact = w.CPL_CLEANUP_VIEWS._collegeText("Small College", [WORK[2]]);
  check("copy flags a missing contact instead of omitting it",
    /none on file/.test(noContact));

  // ── 6. A blanket mapping must never render like corroboration. This is the
  // 11-of-14 MAG-51 lesson, made structural.
  const blanket = root.querySelector(".mcw-blanket .mcw-ctag");
  check("blanket course is labelled with its span", blanket && /33 exhibits/.test(blanket.textContent));
  const strong = root.querySelector(".mcw-course:not(.mcw-blanket) .mcw-ctag");
  check("a corroborated course shows its college count", strong && /3 colleges/.test(strong.textContent));

  // ── 7. A missing title must not hide the exhibit.
  check("an exhibit with no title still renders, and says so",
    /— title not loaded —/.test(text) && /MOS-99Z-999/.test(text));

  // ── 8. The guidance section is REFERENCE, not another queue.
  check("guidance is labelled reference, not a queue", /reference, not a queue/.test(text));

  // ── 8b. Sam's condition on tier 2, 2026-08-20: "tier 2s earn their place as
  // long as there is guidance for the CSM team on correcting or noting in MAP
  // any changes recommended." A tier label says how much to TRUST a row; it
  // never says what to DO with it, and this list exists to send someone to MAP.
  const actRows = root.querySelectorAll("tr.mcw-actrow");
  check("every guidance row carries a Do-in-MAP action", actRows.length === GUIDE.length);
  check("the action names what to record in MAP",
    /attach it as the local course/.test(text) && /Credit by Exam/.test(text));
  check("the action forbids bulk-closing — ACE deferred, it did not refuse",
    /Do NOT bulk-rule Not Applicable/.test(text));

  // The copy output must carry the action too — the person acting on it is at
  // the college, not looking at this screen.
  const gtext = w.CPL_CLEANUP_VIEWS._guideText(GUIDE);
  check("copy carries the exhibit title and id", /Military Police\s+\[MOS-31B-002\]/.test(gtext));
  check("copy carries the MAP action", /attach it as the local course/.test(gtext));
  check("copy spells out WHY a blanket mapping is weak",
    /BLANKET MAPPING — this course is used against 33 different exhibits/.test(gtext));
  check("copy points at MAP as the place to change it", /Make the change in MAP/.test(gtext));

  // ── 9. LOCKED must not render as EMPTY. An RLS-filtered read returns
  // 200 + [], so "no rows" and "no access" are the same response.
  const dom2 = makeDom(); const w2 = dom2.window;
  let unlockShown = false;
  w2.CPL_TEAM_PHRASE = {
    session: () => null,
    decorateHeaders: () => {},
    unlockRow: () => { unlockShown = true; const d = w2.document.createElement("div"); d.textContent = "unlock"; return d; },
  };
  let fetched = false;
  w2.fetch = () => { fetched = true; return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }); };
  w2.eval(src);
  w2.CPL_CLEANUP_VIEWS.mount();
  await tick(); await tick();
  const t2 = w2.document.getElementById("mcw-root").textContent;
  check("locked shows the unlock row", unlockShown);
  check("locked does NOT claim there is no work", !/is empty|No items match/.test(t2));
  check("locked does not fetch at all", !fetched);

  const bad = results.filter(([, ok]) => !ok);
  if (bad.length) {
    console.log(`FAIL — ${bad.length} of ${results.length}:`);
    bad.forEach(([n]) => console.log("  ✗ " + n));
    process.exit(1);
  }
  console.log(`OK — ${results.length} checks: read-only posture, MAP-facing actions per tier, blanket labelling, locked-vs-empty.`);
}
run().catch((e) => { console.log("FAIL — threw: " + e.stack); process.exit(1); });
