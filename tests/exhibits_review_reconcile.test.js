// A decided Review card stays decided (#3223, Sam 2026-11-13: "I changed those las positas exhibits in the exhibit
// commons and think we have a loop going where the reanalysis does know I just relied on them and then brings them
// back endlessly"). kb/exhibits_review.json is built nightly; a title saved on Review since then is on kb_curation
// under _UNCLASSIFIED::<raw MAP title> as unified_title_assignment. On load, and on each return to the tab, the tab
// reads those saves, Range-paged; a card whose raw title carries one leaves the queue; a clear (no row, or an empty
// value) leaves it open; a conflict card leaves only for a save later than the file. No card shows until the read
// answers. When COBI cannot be read the cards stand, the view says so in words, and no control that saves a title
// is on (a save could replace one it cannot see).
// Fixtures only: never the committed kb/exhibits_review.json.
// Run from repo root: `npm test` (or `node tests/exhibits_review_reconcile.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const src = fs.readFileSync("exhibits.js", "utf8");

const BUILT = "2026-11-13T19:52:29Z";
const ODD = 'Industry Training Evidence for KIN 6, "Personal" (Trainer) \\ 1';
function heldOf(raw, step, extra) {
  return Object.assign({ raw: raw, step: step, why: "a reason", colleges: [], title: "T " + raw, issuer: "", from: "the classifier",
    ids: ["MAPCX-" + raw], art: [], could: [], basis: "", same: false, trainers: [], exists: false }, extra || {});
}
function reviewOf(held, tiles) {
  return { schema: 1, written_at: BUILT, sources: {}, steps: {}, colleges: [], held: held,
    tiles: tiles || { names: { n: 100, of: 200, waiting: 100 }, aligned: { n: 2, of: held.length } } };
}
const REVIEW = reviewOf([heldOf("Industry Training Evidence for EMS 10", "Proposed", { course: "EMS 10" }), heldOf(ODD, "Proposed"),
  heldOf("Cleared Title", "Proposed", { course: "CT 1" }), heldOf("Open Title", "Wording check"),
  heldOf("Saved Conflict", "Conflict with the reference"), heldOf("Re-picked Conflict", "Conflict with the reference")]);

// The ids a kb_curation read asks for, decoded from PostgREST's quoted in-list.
function idsOf(url) {
  const m = /course_id=in\.\((.*?)\)(&|$)/.exec(url);
  if (!m) return [];
  const list = decodeURIComponent(m[1]), out = [], re = /"((?:[^"\\]|\\.)*)"/g;
  let x;
  while ((x = re.exec(list))) out.push(x[1].replace(/\\(.)/g, "$1"));
  return out;
}

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const reads = [], posts = [], studentReads = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const method = init.method || "GET";
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    const no = (n) => Promise.resolve({ ok: false, status: n, json: () => Promise.resolve({}) });
    if (url === "kb/exhibits_review.json") return ok(opts.review || REVIEW);
    if (url === "kb/exhibits_sweep.json") return no(404);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) { studentReads.push(JSON.parse(init.body)); return ok([]); }
    if (/kb_curation/.test(url) && method !== "GET") { posts.push({ url: url, body: init.body }); return ok(null); }
    if (/\/rest\/v1\/kb_curation\?select=course_id,field,value,reviewed_at&field=eq\.unified_title_assignment&course_id=in\./.test(url)) {
      reads.push({ url: url, range: (init.headers || {}).Range });
      if (opts.hang && reads.length <= opts.hang) return new Promise(() => {});
      let answer;
      if (opts.fail) answer = () => no(503);
      else if (opts.pages) answer = () => ok(opts.pages((init.headers || {}).Range));
      else {
        const saved = opts.saved || {};
        answer = () => ok(idsOf(url).filter((id) => id in saved).map((id) => {
          const v = saved[id];
          return { course_id: id, field: "unified_title_assignment", value: typeof v === "string" ? v : v.value,
            reviewed_at: typeof v === "string" ? "2026-11-13T20:21:00+00:00" : v.at };
        }));
      }
      if (opts.delay) return new Promise((r) => setTimeout(r, opts.delay)).then(answer);
      return answer();
    }
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return no(404);
  };
  const sess = { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), viewAddress: function () {},
    authHeaders: (extra) => Object.assign(opts.noKey ? {} : { apikey: "anon-key", Authorization: "Bearer anon-key" }, extra || {}) };
  w.cplCollegeShort = (n) => n;
  // The statewide list's script answers at once: a render path of its own, before the saved-titles read answers.
  w.CPL_TABS = { loadScript: function (s, name, cb) { setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  if (opts.timeout) w.CPL_EXHIBITS._reviewTimeout(opts.timeout);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, reads: reads, posts: posts, studentReads: studentReads };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
const shownRaws = (t) => t.M._shown().map((h) => h.raw);
const rootOf = (t) => t.d.getElementById("exhibits-root");
const button = (t, re) => Array.from(rootOf(t).querySelectorAll("button")).find((b) => re.test(txt(b)));
const P = "_UNCLASSIFIED::";

(async function () {
  try {
    // A reload after Sam saved titles: they leave the queue, the rest stand.
    const saved = {};
    saved[P + "Industry Training Evidence for EMS 10"] = "Paramedic Theory 1";
    saved[P + ODD] = "Personal Trainer";
    saved[P + "Cleared Title"] = "";
    saved[P + "Saved Conflict"] = { value: "Juvenile Law", at: "2026-10-30T09:00:00+00:00" };
    saved[P + "Re-picked Conflict"] = { value: "Juvenile Justice", at: "2026-11-13T20:30:00+00:00" };
    let t = load({ saved: saved });
    await t.M.boot(); await settle();
    let raws = shownRaws(t);
    check("a title saved since the build does not come back on a reload", raws.indexOf("Industry Training Evidence for EMS 10") < 0);
    check("and the card carries the saved title, never the stale proposal", t.M._state.data.held[0].saved === "Paramedic Theory 1");
    check("a title with a comma, quotes, parentheses and a backslash is matched by its exact raw title", raws.indexOf(ODD) < 0);
    check("a cleared assignment (an empty value) leaves the card open", raws.indexOf("Cleared Title") >= 0);
    check("a title with no save stays open", raws.indexOf("Open Title") >= 0);
    check("a conflict card whose saved title predates the file stays (its saved title is the point)", raws.indexOf("Saved Conflict") >= 0);
    check("a conflict card re-picked after the file was built leaves the queue", raws.indexOf("Re-picked Conflict") < 0);
    check("no unread notice when COBI answered", !t.d.querySelector(".exh-unread"));
    check("the read asks for the assignment field and its time, by the stable raw-title key", t.reads.length === 1
      && idsOf(t.reads[0].url).length === 6 && idsOf(t.reads[0].url).indexOf(P + ODD) >= 0);
    check("the read is Range-paged from the first row (Rule 10 b)", t.reads[0] && t.reads[0].range === "0-999");
    const tileText = txt(rootOf(t).querySelector(".exh-dash"));
    check("the Names tile counts the two settled titles as named, and two fewer wait",
      /Names102 of 200/.test(tileText) && /98 wait for a title/.test(tileText));
    check("the Aligned course tile leaves the settled cards out", /Aligned course1 of 3/.test(tileText));
    const notFolded = Array.from(rootOf(t).querySelectorAll(".exh-steps button")).find((b) => /Saved, not folded/.test(txt(b)));
    check("Saved, not folded counts the two titles saved since the build", notFolded && /^2Saved, not folded$/.test(txt(notFolded)));
    check("Students waiting leaves the settled cards' exhibits out", (function () {
      const last = t.studentReads[t.studentReads.length - 1];
      if (!last) return false;
      const star = last.p_ids.filter((id, k) => last.p_keys[k] === "*");
      return star.indexOf("MAPCX-Industry Training Evidence for EMS 10") < 0 && star.indexOf("MAPCX-Open Title") >= 0;
    })());

    // A return to the tab reads the saves again: a title saved elsewhere meanwhile leaves the queue.
    saved[P + "Open Title"] = "Saved In Another Tab";
    t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } }));
    await settle();
    check("returning to the tab reads the saves again", t.reads.length === 2 && shownRaws(t).indexOf("Open Title") < 0);
    check("and a title settled on the return leaves Students waiting too", (function () {
      const last = t.studentReads[t.studentReads.length - 1];
      return t.studentReads.length >= 2 && last.p_ids.filter((id, k) => last.p_keys[k] === "*").indexOf("MAPCX-Open Title") < 0;
    })());

    // Cleared in another browser tab (COBIx on #3260): the next read reopens a card an earlier read settled, with no
    // reload, and puts its exhibits back in Students waiting. The read fires when this browser tab comes back into view.
    const visible = (w, on) => { Object.defineProperty(w.document, "hidden", { value: !on, configurable: true });
      w.document.dispatchEvent(new w.Event("visibilitychange")); };
    const fileSaved = t.M._state.data.held.filter((h) => h.raw === "Open Title")[0];
    delete saved[P + "Open Title"];
    let readsBefore = t.reads.length;
    visible(t.w, true); await settle();
    check("a browser tab coming back into view reads the saves again", t.reads.length === readsBefore + 1);
    check("a title cleared in another tab reopens its card without a reload", shownRaws(t).indexOf("Open Title") >= 0
      && !t.M._state.reviewSettled["Open Title"]);
    check("and the reopened card drops the saved title the earlier read gave it", fileSaved && fileSaved.saved === undefined);
    check("and its exhibits count in Students waiting again", (function () {
      const last = t.studentReads[t.studentReads.length - 1];
      return last.p_ids.filter((id, k) => last.p_keys[k] === "*").indexOf("MAPCX-Open Title") >= 0;
    })());
    check("a title still saved stays settled on that read", shownRaws(t).indexOf("Industry Training Evidence for EMS 10") < 0);
    // On another COBI tab, coming back into view reads nothing.
    t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
    readsBefore = t.reads.length;
    visible(t.w, true); await settle();
    check("on another COBI tab a return to the browser tab reads nothing", t.reads.length === readsBefore);

    // The reviewer stays on their card across a reread (second reader on #3285): loadStudents starts the queue at the
    // top, so without this the view jumped to card 1 with Teach open and card 3's draft under it.
    const live = {};
    t = load({ saved: live });
    await t.M.boot(); await settle();
    const S = t.M._state;
    S.cur = 2; S.teach = true; S.teachDraft = "my words for this card";
    const mine = t.M._shown()[2].raw, other = t.M._shown()[0].raw;
    live[P + other] = "Saved Elsewhere";
    visible(t.w, true); await settle();
    check("a title settled elsewhere keeps the reviewer on the card they were on",
      shownRaws(t).indexOf(other) < 0 && t.M._shown()[S.cur] && t.M._shown()[S.cur].raw === mine);
    check("and their Teach draft stays open with what they typed", S.teach === true && S.teachDraft === "my words for this card");
    live[P + mine] = "Saved Elsewhere Too";
    visible(t.w, true); await settle();
    check("when their own card is settled elsewhere it leaves the queue and its draft goes with it",
      shownRaws(t).indexOf(mine) < 0 && S.teach === false && S.teachDraft === "");

    // A card decided on this page stays decided when a later read finds its title cleared: Back reopens it, not a read.
    t = load({ saved: {} });
    await t.M.boot(); await settle();
    const first = t.M._shown()[0].raw;
    const changeHere = button(t, /^Change to Proposed Title$/);
    if (changeHere) changeHere.click();
    await settle();
    check("a card decided on this page leaves the queue", changeHere && shownRaws(t).indexOf(first) < 0);
    t.reads.length = 0;
    t.M._state.reviewSettled[first] = true;  // as a read that found this page's save would leave it
    visible(t.w, true); await settle();
    check("a read that finds no row for a card decided on this page leaves it decided",
      t.reads.length === 1 && shownRaws(t).indexOf(first) < 0);

    // A clear deletes the row. On an ordinary card that reopens it; a conflict card exists only because of a saved
    // title, so a cleared one is decided and never comes back.
    t = load({ saved: {} });
    await t.M.boot(); await settle();
    raws = shownRaws(t);
    check("with no save on COBI every ordinary card the file holds is open", ["Industry Training Evidence for EMS 10", ODD,
      "Cleared Title", "Open Title"].every((r) => raws.indexOf(r) >= 0));
    check("a conflict card cleared in an earlier visit does not come back on a reload",
      raws.indexOf("Saved Conflict") < 0 && raws.indexOf("Re-picked Conflict") < 0);
    const emptied = {};
    emptied[P + "Saved Conflict"] = { value: "", at: "2026-10-30T09:00:00+00:00" };
    t = load({ saved: emptied });
    await t.M.boot(); await settle();
    check("an emptied conflict row is a clear too", shownRaws(t).indexOf("Saved Conflict") < 0);

    // A read that never answers fails after the time limit, and a return to the tab reads again.
    t = load({ saved: saved, hang: 1, timeout: 40 });
    const hung = t.M.boot();
    await wait(10);
    check("while the read hangs the queue waits", /Reading the saved titles/.test(txt(rootOf(t))));
    await hung; await wait(20); t.M.render(); await settle();
    check("a read with no answer in time fails, says so, and leaves the cards",
      !t.M._state.reviewReading && /could not be read from COBI \(no answer in 0 seconds\)/.test(txt(t.d.querySelector(".exh-unread")))
      && shownRaws(t).length === 6);
    t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } }));
    await settle();
    check("a return to the tab starts a fresh read, which settles the saved titles", t.reads.length === 2
      && !t.d.querySelector(".exh-unread") && shownRaws(t).indexOf("Industry Training Evidence for EMS 10") < 0);

    // A raw title the browser cannot encode fails the read, never the view.
    t = load({ review: reviewOf([heldOf("Bad \ud800 title", "Proposed", { ids: ["MAPCX-BAD-1"] }), heldOf("Fine Title", "Proposed")]) });
    await t.M.boot(); await settle();
    check("a title the browser cannot encode puts the read in the failed state and the view still draws its cards",
      !t.M._state.error && !t.M._state.reviewReading && /could not be read from COBI \(URI malformed\)/.test(txt(t.d.querySelector(".exh-unread")))
      && shownRaws(t).length === 2);

    // A full page asks for the next.
    t = load({ pages: (range) => range === "0-999"
      ? Array.from({ length: 1000 }, (_, i) => ({ course_id: P + "Filler " + i, field: "unified_title_assignment", value: "x" }))
      : [{ course_id: P + "Open Title", field: "unified_title_assignment", value: "Saved On Page Two" }] });
    await t.M.boot(); await settle();
    check("a full page of 1,000 rows reads the next page", t.reads.map((r) => r.range).join("|") === "0-999|1000-1999");
    check("and a save on the second page still leaves the queue", shownRaws(t).indexOf("Open Title") < 0);

    // Many titles go in chunks, so no request outgrows a URL.
    const many = reviewOf(Array.from({ length: 95 }, (_, i) => heldOf("Many " + i, "Proposed")));
    t = load({ review: many, saved: { "_UNCLASSIFIED::Many 90": "Saved" } });
    await t.M.boot(); await settle();
    check("95 titles are read in three requests of at most 40", t.reads.length === 3
      && t.reads.every((r) => idsOf(r.url).length <= 40) && t.reads.reduce((n, r) => n + idsOf(r.url).length, 0) === 95);
    check("and a save in the last chunk is honored", shownRaws(t).indexOf("Many 90") < 0 && shownRaws(t).length === 94);

    // No card while the read is out, though the statewide script renders first.
    t = load({ saved: saved, delay: 60 });
    const booting = t.M.boot();
    await wait(20);
    const early = txt(rootOf(t));
    check("while the saved titles are read the queue says so and shows no card",
      /Reading the saved titles/.test(early) && early.indexOf("Industry Training Evidence for EMS 10") < 0);
    check("and offers no Accept all and no card action", !button(t, /^Accept all proposed titles/) && !button(t, /^Change to Proposed Title$/));
    await booting; await settle();
    check("the decided card never reaches the screen once the read answers",
      txt(rootOf(t)).indexOf("Industry Training Evidence for EMS 10") < 0 && !/Reading the saved titles/.test(txt(rootOf(t))));

    // COBI cannot be read: the cards stand, the view says so, and nothing can save over a title it cannot see.
    t = load({ fail: true });
    await t.M.boot(); await settle();
    const note = t.d.querySelector(".exh-unread");
    check("a failed read leaves the file's cards", shownRaws(t).length === 6);
    check("the Review view says the saves could not be read, that a decided card may show again, and that saving is off",
      note && note.getAttribute("role") === "status"
      && /could not be read from COBI \(HTTP 503\), so a card decided since then may show again here\. Saving a title is off/.test(txt(note)));
    check("the notice promises nothing about the saves", note && !/saves are kept/i.test(txt(note)));
    check("the notice is words, with no glyph", note && !/[←-➿\u{1F300}-\u{1FAFF}]/u.test(txt(note)));
    check("no Accept all while the saves are unread", !button(t, /^Accept all proposed titles/));
    const change = button(t, /^Change to Proposed Title$/), keep = button(t, /^Keep Current Title$/);
    check("Change to Proposed Title and Keep Current Title are off, with the reason in words",
      change && change.disabled && keep && keep.disabled && /Saving a title is off/.test(txt(t.d.getElementById("exh-save-off"))));
    t.M._state.bulkAsk = true; t.M.render(); await settle();
    const saveAll = button(t, /^Save all/);
    if (saveAll) saveAll.click();
    if (change) { change.disabled = false; change.click(); }
    await settle();
    check("no save reaches kb_curation from a card or the bulk path", t.posts.length === 0);

    // No key on the page: never silently current.
    t = load({ noKey: true });
    await t.M.boot(); await settle();
    check("with no COBI key the view says the saves could not be read",
      /could not be read from COBI \(COBI could not be reached from this page\)/.test(txt(t.d.querySelector(".exh-unread"))));

    // The Queue's Blocked on Sky line names it too.
    t = load({ fail: true, hash: "#exhibits/queue" });
    await t.M.boot(); await settle();
    check("the Queue names the unread saves in its blocked line",
      /titles saved since the review file was built could not be read from COBI \(HTTP 503\)/.test(txt(t.d.querySelector(".exh-qb"))));
  } catch (e) {
    check("the run finished without an error: " + (e && e.stack), false);
  }

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "  ok  " : "  FAIL ") + x[0]));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();
