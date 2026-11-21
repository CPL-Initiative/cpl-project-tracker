// Assign from the panel: a reviewer joins a course that needs an M-ID to a common course (S694).
//
// Sam, 2026-11-20, working the Needs an M-ID pile: "also need links to sidebar to take action on assigning to a mid".
// The save is one kb_curation row, CN:<control number> merge_into <common course>, the row SkyView's re-home writes;
// the daily build lists the course under that common course and leaves the common course's own row as it stands
// (#3618, tests/assign_from_panel_build_test.py).
//
// WHAT THIS GUARDS (each a way the control could write the wrong thing, or write when it must not):
//   (1) signed out, the panel offers no Assign and no Take it back, only the sign-in fold;
//   (2) ⭐ signed in, each of the closest that today's identity file holds carries "Assign to <id>", and one press
//       writes exactly one row: CN:<control number>, merge_into, that id, under the reviewer's own email, as an upsert
//       with their token;
//   (3) a closest course that is not in today's identity file carries no Assign and says why;
//   (4) ⭐ a control number that names two courses in the state list cannot be assigned, and says why;
//   (5) after the save the panel and the pile both say the course is assigned, the Assign words are gone (nobody
//       assigns it twice), and the row sorts after the courses still waiting;
//   (6) ⭐ Take it back deletes that one row (course_id and field both named) and the Assign words return;
//   (7) a typed id is checked against today's identity file before anything is saved, and an unknown one saves nothing;
//   (8) a failed save changes nothing and says so;
//   (9) an assignment saved earlier is read live (a page at a time, with a Range header), so it shows on a fresh visit,
//       and who made it shows to a signed-in reviewer alone;
//  (10) a course that already lists under its M-ID and carries an assignment says so in its panel, with Take it back;
//  (11) nothing is kept in the browser.
// The fixture is its own; it never reads the live pile.
// Run from repo root: `npm test` (or `node tests/coci_list_assign.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid (the extract's)]
const LOOKUP = {
  _built_at: "2026-11-20",
  colleges: ["Citrus College", "Hartnell College", "Woodland Community College"],
  rows: [
    [1, "CCC3", "APP", "126", "4th Year Commercial Electrical Apprenticeship I", 4, "C", "0952.20: Electrical", "", "", ""],
    [2, "CCC4", "LEARN", "502", "Academic Assistance and Tutoring", 0, "N", "4930.09: Supervised Tutoring", "", "", ""],
    [0, "CCC5", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [0, "CCC6", "KIN", "009B", "Intermediate Badminton", 1, "C", "0835.00: Physical Education", "", "", ""],
    [0, "CCC6", "KIN", "056", "Beginning Weight Training", 2, "C", "0835.10: Physical Fitness", "", "", ""],
    [1, "CCC7", "AUTO", "60", "Suspension and Steering", 4, "C", "0948.00: Automotive Technology", "", "", ""]
  ]
};
// Today's identity file holds ELEC M1300, WELD M1109 (with CCC5) and AUTO M1036; ELEC M1301 is not in it.
const MEMBERS = { generated_at: "2026-11-20 06:20", colleges: ["Citrus College", "Hartnell College", "Woodland Community College"],
  members: { "WELD M1109": [{ c: 0, cn: "CCC5" }], "ELEC M1300": [{ c: 2, cn: "CCC90" }], "AUTO M1036": [{ c: 2, cn: "CCC91" }] } };
const CLOSEST = { identity_file: "2026-11-20 06:20", links: { "ELEC M1300": 3, "AUTO M1036": 9 }, measure: { levels: [
  { key: "strong", label: "Strong match", bands: [5, 6], n: 2438, right: 2266, share: 0.929 },
  { key: "possible", label: "Possible match", bands: [3, 4], n: 1872, right: 805, share: 0.43 },
  { key: "none", label: "No strong match", bands: [0, 1, 2], n: 1687, right: 297, share: 0.176 }] },
  rows: { CCC3: [0.924, 6, [["ELEC M1300", 0.91, 4, 6, 0.42], ["ELEC M1301", 0.6, 0, 3, null]]],
    CCC4: [0.124, 1, [["ELEC M1300", 0.41, 0, 6, null]]],
    CCC6: [0.924, 6, [["ELEC M1300", 0.9, 1, 6, null]]],
    CCC7: [0.924, 6, [["AUTO M1036", 0.92, 5, 7, 0.5]]] } };
const SESS = { email: "reviewer@example.org", access_token: "tok-1" };

function tab(hash, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (hash || "#coci-lookup"), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  let stored = (opts.assigned || []).slice();  // kb_curation's CN: merge_into rows, as the service holds them
  let sess = opts.sess || null;
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(opts.lookup || LOOKUP));
  w.CPL_SESSION = { get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess) };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (/coci_closest_mid\.json/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(CLOSEST))) });
    if (/\/rest\/v1\/kb_curation/.test(url)) {
      const method = init.method || "GET", headers = init.headers || {};
      calls.push({ method, url, headers, body: init.body ? JSON.parse(init.body) : null });
      const one = /course_id=eq\.([^&]+)/.exec(url), keyOf = one ? decodeURIComponent(one[1]) : null;
      if (method === "POST") {
        if (opts.failSave) return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
        if (opts.beforePost) { opts.beforePost(stored); opts.beforePost = null; }  // another reviewer's row lands first
        const kept = [];
        JSON.parse(init.body).forEach((x) => {
          const there = stored.some((s) => s.course_id === x.course_id);
          if (there && /ignore-duplicates/.test(headers.Prefer || "")) return;      // ON CONFLICT DO NOTHING
          const row = { course_id: x.course_id, value: x.value, reviewed_at: "2026-11-20T23:00:00Z", reviewer_email: x.reviewer_email };
          stored = stored.filter((s) => s.course_id !== x.course_id).concat([row]); kept.push(row);
        });
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(kept) });
      }
      if (method === "DELETE") {
        const v = /value=eq\.([^&]+)/.exec(url), value = v ? decodeURIComponent(v[1]) : null;
        const gone = stored.filter((s) => s.course_id === keyOf && (value == null || s.value === value));
        stored = stored.filter((s) => gone.indexOf(s) < 0);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(gone) });
      }
      if (/field=eq\.merge_into/.test(url)) {
        const withWho = /reviewer_email/.test(url.split("select=")[1].split("&")[0]);
        const shape = (s) => withWho ? s : { course_id: s.course_id, value: s.value, reviewed_at: s.reviewed_at };
        if (keyOf) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(stored.filter((s) => s.course_id === keyOf).map(shape)) });
        if (opts.failRead && opts.failRead()) return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ message: "JWT expired" }) });
        const m = /^(\d+)-(\d+)$/.exec(headers.Range || "0-999"), all = stored.slice().sort((a, b) => a.course_id < b.course_id ? -1 : 1);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(all.slice(+m[1], +m[2] + 1).map(shape)) });
      }
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, calls, stored: () => stored, put: (row) => { stored = stored.concat([row]); },
    signOut: () => { sess = null; w.dispatchEvent(new w.Event("cpl-session-changed")); } };
}
const P = "ccl-";
function dataRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function cellOf(tr, d, name) { return tr.children[heads(d).findIndex((h) => h.indexOf(name) === 0) + 1]; }
function rowByTitle(d, title) { return dataRows(d).find((tr) => txt(cellOf(tr, d, "Title")) === title); }
function panel(d) { return d.getElementById(P + "panel"); }
async function openPanel(d, title) { cellOf(rowByTitle(d, title), d, "Title").querySelector("button").click(); await sleep(25); return panel(d); }
// The panel as it stands after a redraw: still open, or opened again (a second press on an open panel's title closes it).
async function panelNow(d, title) { const p = panel(d); return p && txt(p) ? p : openPanel(d, title); }
function wordBtn(root, re) { return Array.from(root.querySelectorAll("button")).find((b) => re.test(txt(b))); }
const APPR = "4th Year Commercial Electrical Apprenticeship I";

(async () => {
  // ── (1) signed out ──
  let t = tab("#coci-lookup/list/nomid"); await sleep(70);
  let pn = await openPanel(t.d, APPR);
  check("(1) signed out, the panel offers no Assign and no Take it back",
    !pn.querySelector("[data-assign]") && !wordBtn(pn, /^Assign to/) && !wordBtn(pn, /^Take it back/) && !pn.querySelector("#ccl-assign-id"), txt(pn).slice(0, 300));
  check("(1) it offers the sign-in fold instead", /Reviewers: sign in to assign this course to a common course/.test(txt(pn)));
  check("(1) no write was sent", !t.calls.some((c) => c.method !== "GET"));

  // ── (2) (3) signed in: the words, and the one row ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  const assignBtns = Array.from(pn.querySelectorAll("[data-assign]"));
  check("(2) ⭐ signed in, the closest course today's identity file holds carries Assign, as a button with a name that says what it does",
    assignBtns.length === 1 && assignBtns[0].tagName === "BUTTON" && txt(assignBtns[0]) === "Assign to ELEC M1300"
      && assignBtns[0].getAttribute("aria-label") === "Assign APP 126 at Hartnell College to ELEC M1300", assignBtns.map(txt).join(" | "));
  check("(3) a closest course that is not in today's identity file carries no Assign and says why",
    /It is not in today's identity file, so it cannot be assigned here\./.test(txt(pn.querySelector("[data-rec='ELEC M1301']"))) && !pn.querySelector("[data-assign='ELEC M1301']"));
  assignBtns[0].click(); await sleep(40);
  const posts = t.calls.filter((c) => c.method === "POST");
  check("(2) ⭐ one press writes exactly one row: CN:<control number>, merge_into, that id, under the reviewer's email",
    posts.length === 1 && JSON.stringify(posts[0].body) === JSON.stringify([{ course_id: "CN:CCC3", field: "merge_into", value: "ELEC M1300", reviewer_email: "reviewer@example.org" }]),
    JSON.stringify(posts.map((p) => p.body)));
  check("(2) ⭐ the write is an insert that never replaces a row (resolution=ignore-duplicates), sent with the reviewer's token",
    posts[0] && posts[0].headers.Authorization === "Bearer tok-1" && /resolution=ignore-duplicates/.test(posts[0].headers.Prefer || "") && !/merge-duplicates/.test(posts[0].headers.Prefer || "")
      && /\/rest\/v1\/kb_curation$/.test(posts[0].url));

  // ── (5) after the save ──
  pn = panel(t.d);
  check("(5) the panel says the course is assigned, by whom, and when it lists",
    /Assigned to ELEC M1300 by reviewer@example\.org on \d{4}-\d\d-\d\d\. It lists under ELEC M1300 after the next daily build\./.test(txt(pn)), txt(pn).slice(0, 500));
  check("(5) the Assign words are gone and Take it back is offered", !pn.querySelector("[data-assign]") && !pn.querySelector("#ccl-assign-id") && !!wordBtn(pn, /^Take it back$/));
  check("(5) the pile's row says so too", txt(cellOf(rowByTitle(t.d, APPR), t.d, "Closest M-ID")) === "Assigned to ELEC M1300, lists after the next build",
    txt(cellOf(rowByTitle(t.d, APPR), t.d, "Closest M-ID")));
  const order = dataRows(t.d).map((tr) => txt(cellOf(tr, t.d, "Title")));
  check("(5) an assigned course sorts after the courses still waiting on a match", order.indexOf(APPR) > order.indexOf("Suspension and Steering"), order.join(" | "));

  // ── (6) take it back ──
  wordBtn(pn, /^Take it back$/).click(); await sleep(40);
  const dels = t.calls.filter((c) => c.method === "DELETE");
  check("(6) ⭐ Take it back deletes that one row, naming the course, the field and the value it showed",
    dels.length === 1 && /course_id=eq\.CN%3ACCC3&field=eq\.merge_into&value=eq\.ELEC%20M1300$/.test(dels[0].url) && dels[0].headers.Authorization === "Bearer tok-1", dels.map((x) => x.url).join(" | "));
  pn = panel(t.d);
  check("(6) the panel says it was taken back and offers Assign again",
    /Taken back: the assignment to ELEC M1300 is removed\./.test(txt(pn)) && !!pn.querySelector("[data-assign='ELEC M1300']") && t.stored().length === 0, txt(pn).slice(0, 400));

  // ── (7) a typed id ──
  const inp = pn.querySelector("#ccl-assign-id");
  check("(7) the typed field carries a label", !!inp && !!pn.querySelector("label[for='ccl-assign-id']") && !!inp.getAttribute("aria-label"));
  inp.value = "ELEC M9999"; wordBtn(pn, /^Assign to that one$/).click(); await sleep(30);
  check("(7) an id today's identity file does not hold saves nothing and says so",
    t.calls.filter((c) => c.method === "POST").length === 1 && /No common course ELEC M9999 is in today's identity file\. Nothing was saved\./.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 300));
  pn = panel(t.d);
  pn.querySelector("#ccl-assign-id").value = "  auto m1036 "; wordBtn(pn, /^Assign to that one$/).click(); await sleep(40);
  const p2 = t.calls.filter((c) => c.method === "POST");
  check("(7) a typed id that today's identity file holds is saved as the file spells it",
    p2.length === 2 && p2[1].body[0].course_id === "CN:CCC3" && p2[1].body[0].value === "AUTO M1036", JSON.stringify(p2.map((p) => p.body)));

  // ── (4) a control number that names two courses ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS }); await sleep(70);
  pn = await openPanel(t.d, "Intermediate Badminton");
  check("(4) ⭐ a control number that names two courses cannot be assigned, and the panel says why",
    !pn.querySelector("[data-assign]") && !pn.querySelector("#ccl-assign-id") && /This control number names 2 courses in the state's course list, so a save could not say which one\./.test(txt(pn)),
    txt(pn).slice(0, 500));

  // ── (8) a failed save ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS, failSave: true }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  pn.querySelector("[data-assign='ELEC M1300']").click(); await sleep(40);
  pn = panel(t.d);
  check("(8) a failed save changes nothing and says so",
    /The save did not land \(the service answered 403\)\. Nothing changed\./.test(txt(pn)) && !!pn.querySelector("[data-assign='ELEC M1300']") && !/Assigned to/.test(txt(pn)), txt(pn).slice(0, 400));

  // ── (9) an assignment saved earlier, read live ──
  const EARLIER = [{ course_id: "CN:CCC7", value: "AUTO M1036", reviewed_at: "2026-11-19T18:00:00Z", reviewer_email: "other@example.org" }];
  t = tab("#coci-lookup/list/nomid", { sess: SESS, assigned: EARLIER }); await sleep(70);
  const reads = t.calls.filter((c) => c.method === "GET" && /course_id=like/.test(c.url));
  check("(9) the assignments are read live, by a Range a page at a time, CN: rows alone",
    reads.length >= 1 && reads[0].headers.Range === "0-999" && reads[0].headers["Range-Unit"] === "items" && /course_id=like\.CN%3A%25/.test(reads[0].url), JSON.stringify(reads.map((r) => [r.url, r.headers.Range])));
  check("(9) a fresh visit shows the earlier assignment in the pile", txt(cellOf(rowByTitle(t.d, "Suspension and Steering"), t.d, "Closest M-ID")) === "Assigned to AUTO M1036, lists after the next build");
  pn = await openPanel(t.d, "Suspension and Steering");
  check("(9) signed in, the panel names who assigned it; no Assign is offered on it", /Assigned to AUTO M1036 by other@example\.org on 2026-11-19\./.test(txt(pn)) && !pn.querySelector("[data-assign]"), txt(pn).slice(0, 400));
  t = tab("#coci-lookup/list/nomid", { assigned: EARLIER }); await sleep(70);
  pn = await openPanel(t.d, "Suspension and Steering");
  check("(9) signed out, the read asks for no email, and the panel says a reviewer assigned it, with no Take it back",
    !t.calls.some((c) => /reviewer_email/.test(c.url)) && /Assigned to AUTO M1036 by a reviewer on 2026-11-19\./.test(txt(pn)) && !wordBtn(pn, /^Take it back$/), txt(pn).slice(0, 400));

  // ── (10) a course that already lists under its M-ID and carries an assignment ──
  t = tab("#coci-lookup/courses", { sess: SESS, assigned: [{ course_id: "CN:CCC5", value: "WELD M1109", reviewed_at: "2026-11-18T18:00:00Z", reviewer_email: "other@example.org" }] }); await sleep(70);
  pn = await openPanel(t.d, "Welding I");
  check("(10) its panel says a reviewer assigned it and offers Take it back",
    /Its common course: WELD M1109/.test(txt(pn)) && /Assigned to WELD M1109 by other@example\.org on 2026-11-18\./.test(txt(pn)) && !!wordBtn(pn, /^Take it back$/)
      && !/lists under WELD M1109 after the next daily build/.test(txt(pn)), txt(pn).slice(0, 500));

  // ── (12) a read that fails leaves the assignments unknown ──
  let failing = true;
  t = tab("#coci-lookup/list/nomid", { sess: SESS, assigned: [{ course_id: "CN:CCC3", value: "AUTO M1036", reviewed_at: "2026-11-19T18:00:00Z", reviewer_email: "other@example.org" }], failRead: () => failing }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  check("(12) ⭐ when the read of assigned courses fails, the panel offers no Assign and says it cannot tell",
    !pn.querySelector("[data-assign]") && !pn.querySelector("#ccl-assign-id") && /The list of assigned courses did not load \(the service answered 401\), so this panel cannot tell whether a reviewer already assigned this course, and it offers no Assign\./.test(txt(pn)),
    txt(pn).slice(0, 600));
  check("(12) the failed read is not retried in a loop", t.calls.filter((c) => /course_id=like/.test(c.url)).length <= 2, String(t.calls.filter((c) => /course_id=like/.test(c.url)).length));
  failing = false; wordBtn(pn, /^Read it again$/).click(); await sleep(60);
  pn = await panelNow(t.d, APPR);
  check("(12) Read it again reads it, and the other reviewer's assignment shows", /Assigned to AUTO M1036 by other@example\.org on 2026-11-19\./.test(txt(pn)) && !pn.querySelector("[data-assign]"), txt(pn).slice(0, 400));
  check("(12) no write was sent while the read was unknown", !t.calls.some((c) => c.method === "POST"));

  // ── (13) a row another reviewer saved after this page read the list ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  t.put({ course_id: "CN:CCC3", value: "AUTO M1036", reviewed_at: "2026-11-20T22:00:00Z", reviewer_email: "other@example.org" });
  pn.querySelector("[data-assign='ELEC M1300']").click(); await sleep(50);
  pn = panel(t.d);
  check("(13) ⭐ the save reads that one key first and writes nothing over another reviewer's row",
    !t.calls.some((c) => c.method === "POST") && t.stored().length === 1 && t.stored()[0].value === "AUTO M1036"
      && /Nothing was saved: other@example\.org already assigned this course to AUTO M1036\. Take it back first to change it\./.test(txt(pn)), txt(pn).slice(0, 500));
  check("(13) the panel now shows that assignment and offers no Assign", /Assigned to AUTO M1036 by other@example\.org/.test(txt(pn)) && !pn.querySelector("[data-assign]"));

  // ── (14) the same, when the other row lands between the check and the insert ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS, beforePost: (stored) => { stored.push({ course_id: "CN:CCC3", value: "AUTO M1036", reviewed_at: "2026-11-20T22:00:01Z", reviewer_email: "other@example.org" }); } }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  pn.querySelector("[data-assign='ELEC M1300']").click(); await sleep(60);
  pn = panel(t.d);
  check("(14) ⭐ an insert that meets a row saved a moment earlier replaces nothing and says whose row stands",
    t.calls.filter((c) => c.method === "POST").length === 1 && t.stored().length === 1 && t.stored()[0].value === "AUTO M1036" && t.stored()[0].reviewer_email === "other@example.org"
      && /Nothing was saved: other@example\.org already assigned this course to AUTO M1036\./.test(txt(pn)), txt(pn).slice(0, 500) + " | " + JSON.stringify(t.stored()));

  // ── (15) Take it back, when the row was re-pointed since ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS, assigned: [{ course_id: "CN:CCC3", value: "ELEC M1300", reviewed_at: "2026-11-19T18:00:00Z", reviewer_email: "reviewer@example.org" }] }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  t.stored()[0].value = "AUTO M1036"; t.stored()[0].reviewer_email = "other@example.org";
  wordBtn(pn, /^Take it back$/).click(); await sleep(70);
  pn = await panelNow(t.d, APPR);
  check("(15) ⭐ Take it back removes nothing when another reviewer re-pointed the row, and the panel reads it again",
    t.stored().length === 1 && t.stored()[0].value === "AUTO M1036" && /Assigned to AUTO M1036 by other@example\.org/.test(txt(pn)), txt(pn).slice(0, 500) + " | " + JSON.stringify(t.stored()));

  // ── (16) a double press ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS }); await sleep(70);
  pn = await openPanel(t.d, APPR);
  const twice = pn.querySelector("[data-assign='ELEC M1300']"); twice.click(); twice.click(); await sleep(60);
  check("(16) a double press sends one insert", t.calls.filter((c) => c.method === "POST").length === 1, String(t.calls.filter((c) => c.method === "POST").length));

  // ── (17) more assignments than one page holds ──
  const MANY = []; for (let i = 0; i < 1200; i++) MANY.push({ course_id: "CN:AAA" + String(i).padStart(5, "0"), value: "ELEC M1300", reviewed_at: "2026-11-19T18:00:00Z", reviewer_email: "other@example.org" });
  MANY.push({ course_id: "CN:CCC7", value: "AUTO M1036", reviewed_at: "2026-11-19T18:00:00Z", reviewer_email: "other@example.org" });
  t = tab("#coci-lookup/list/nomid", { sess: SESS, assigned: MANY }); await sleep(90);
  const ranges = t.calls.filter((c) => /course_id=like/.test(c.url)).map((c) => c.headers.Range);
  check("(17) the read pages past a thousand rows and finds the one on the second page",
    ranges.join(",") === "0-999,1000-1999" && txt(cellOf(rowByTitle(t.d, "Suspension and Steering"), t.d, "Closest M-ID")) === "Assigned to AUTO M1036, lists after the next build", ranges.join(","));

  // ── (18) a course the state list gives no control number ──
  t = tab("#coci-lookup/list/nomid", { sess: SESS, lookup: { _built_at: "2026-11-20", colleges: ["Citrus College"], rows: [
    [0, "NULL", "ART", "1", "Drawing Studio", 3, "C", "1002.00: Art", "", "", ""], [0, "NULL", "ART", "2", "Painting Studio", 3, "C", "1002.00: Art", "", "", ""]] } }); await sleep(70);
  pn = await openPanel(t.d, "Drawing Studio");
  check("(18) a course with no control number says so, never that its number names other courses",
    /The state's course list gives this course no control number/.test(txt(pn)) && !/names 2 courses/.test(txt(pn)) && !pn.querySelector("[data-assign]"), txt(pn).slice(0, 400));

  // ── (11) nothing kept in the browser ──
  check("(11) the control keeps nothing in the browser", !/localStorage|sessionStorage/.test(SRC.slice(SRC.indexOf("var ASSIGN = "), SRC.indexOf("function assignedLine"))));

  let pass = 0;
  results.forEach(([name, ok, why]) => { if (ok) pass++; console.log((ok ? "  ✓ " : "  ✗ ") + name + (ok || !why ? "" : "\n      " + why)); });
  console.log("\ncoci_list_assign: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})();
