// Gather (S725): courses whose words match, into one common course.
//
// Sam, 2026-11-24: "move all the mids with adapt in the title to one mid: Adaptive Physical Education", then the local
// courses with adapt in theirs, after "a quick view to uncheck any that don't belong"; and "we can reuse this gather
// for other cases by changing variables (common and local subjects, keywords, etc." Mock:
// https://claude.ai/artifact/PzL4Kf7oV49BGaYwF5gh1T.
//
// WHAT THIS GUARDS:
//   (1) ⭐ the words: space = all, comma or "or" = either, minus = leave out, quotes = a phrase, a word matches the
//       start of a word (adapt finds Adapted, never Readapt... only at a word's start), capitals ignored, an empty
//       query matches nothing;
//   (2) the address carries the words, look-in, common subject, local subjects and target, and reads back the same;
//   (3) ⭐ the starting ticks: a common course in the target's common subject is ticked, one in another is not and says
//       why; a local course whose local subject carries courses under the target's common subject is ticked; TOP alone
//       never ticks one; a local course already inside a ticked common course is not listed (it follows);
//   (4) the local subject filter keeps only the codes named;
//   (5) ⭐ the save: signed in, Gather reads the standing merge_into rows for every key first, inserts only the rest
//       (insert-only, ignore-duplicates), one row per merged common course (<M-ID> merge_into <target>) and per moved
//       local course (CN:<control> merge_into <target>), under the reviewer's email, and leaves a standing row alone;
//   (6) ⭐ Take it back deletes exactly those rows (field, value and the keys saved);
//   (7) signed out, there is no Gather control, only the sign-in fold;
//   (8) the summary names the units range the gathered courses join, and the saved decisions on merged courses;
//   (9) the view is wired into Courses and Programs: #coci-lookup/gather opens it.
// Run from repo root: `node tests/commons_gather.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("commons_gather.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COMMONS = [
  { id: "PEDS M1029", title: "Adaptive Physical Education", disc: "Physical Education Disabled Students", units: 1, umin: 0, umax: 1.5, members: 13 },
  { id: "PEDS M1026", title: "Adapted Weight Training", disc: "Physical Education Disabled Students", units: 1, umin: 0, umax: 1, members: 8 },
  { id: "KINE M1267", title: "Adapted: Beginning Stretching", disc: "Physical Education Disabled Students", units: null, umin: 0.5, umax: 3, members: 2 },
  { id: "ENGL M1032", title: "Film Adaptations", disc: "English", units: 3, members: 2 },
  { id: "DANC M1018", title: "Introduction to Adapted Dance", disc: "Dance", units: 1, members: 2 },
  { id: "KINE M1344", title: "Yoga, Beginning", disc: "Kinesiology", units: 1, members: 30 }
];
const LOCALS = [
  // under a ticked common course: follows, never listed
  { ctrl: "CCC1", college: "Cabrillo College", subj: "ADAPT", num: "90", title: "Adapted Weight Training", units: 1, top: "0835.00", mid: "PEDS M1026", mids: ["PEDS M1026"] },
  // loose, its local subject ADAPT carries a PEDS course elsewhere: ticked
  { ctrl: "CCC2", college: "Cabrillo College", subj: "ADAPT", num: "94", title: "Adaptive Tennis", units: 0.5, top: "0835.00", mid: "", mids: [] },
  // loose, TOP 0835 alone, local subject PEX carries none: unticked
  { ctrl: "CCC3", college: "Cerritos College", subj: "PEX", num: "107", title: "Adapted Team Sports", units: 2, top: "0835.80", mid: "", mids: [] },
  // under another common subject: unticked
  { ctrl: "CCC4", college: "Butte College", subj: "DSPS", num: "210", title: "Adaptive Computer Lab", units: 0.5, top: "0702.10", mid: "KINE M1344", mids: ["KINE M1344"] },
  // no word match
  { ctrl: "CCC5", college: "Butte College", subj: "KIN", num: "1", title: "Readaptation Theory", units: 3, top: "", mid: "", mids: [] }
];

function boot(sess, hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="m"></div></body></html>', { url: "https://example.org/" + (hash || ""), runScripts: "outside-only" });
  const w = dom.window, calls = [];
  w.fetch = function (url, opt) {
    opt = opt || {}; calls.push({ url: String(url), method: opt.method || "GET", body: opt.body ? JSON.parse(opt.body) : null, headers: opt.headers || {} });
    const u = decodeURIComponent(String(url));
    let out = [];
    if ((opt.method || "GET") === "GET" && /field=eq\.merge_into/.test(u)) out = [{ course_id: "CN:CCC2", value: "PEDS M1030", reviewer_email: "curator@example.org" }];
    else if ((opt.method || "GET") === "GET" && /field=in\.\(discipline/.test(u)) out = [{ course_id: "KINE M1267", field: "discipline", value: "Physical Education Disabled Students", reviewed_at: "2026-11-24T00:00:00Z", reviewer_email: "sam@example.org" }];
    else if (opt.method === "POST") out = (JSON.parse(opt.body).length ? JSON.parse(opt.body) : [JSON.parse(opt.body)]).map((x) => ({ course_id: x.course_id }));
    else if (opt.method === "DELETE") out = [{}, {}, {}];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(out) });
  };
  w.eval(SRC);
  const addrs = [];
  const api = w.CPL_COMMONS_GATHER.create({ tab: "coci-lookup", rest: "https://db/rest/v1", anon: "anon", hash: () => w.location.hash,
    commons: () => COMMONS.map((c) => Object.assign({}, c)).filter(Boolean), locals: () => LOCALS,
    session: () => sess, fresh: () => Promise.resolve(sess), signIn: (m) => { m.textContent = "SIGN-IN BOX"; },
    onAddress: (a) => addrs.push(a) });
  // commons() hands back fresh objects each call; Gather keys everything by id, so its ticks hold across draws.
  api.render(w.document.getElementById("m"));
  return { w, api, calls, addrs, doc: w.document };
}
function rowsOf(doc, label) {
  const reg = Array.from(doc.querySelectorAll(".cg-wrap")).filter((r) => r.getAttribute("aria-label").indexOf(label) === 0)[0];
  return reg ? Array.from(reg.querySelectorAll("tbody tr")).map((tr) => ({ tr, box: tr.querySelector("input[type=checkbox]"), text: txt(tr) })) : [];
}
function find(rows, s) { return rows.filter((r) => r.text.indexOf(s) >= 0)[0]; }
function setInput(doc, id, v) { const n = doc.getElementById(id); n.value = v; n.dispatchEvent(new doc.defaultView.Event("input")); }

(async () => {
  // (1) the words
  {
    const { w } = boot(null);
    const P = (q) => w.CPL_COMMONS_GATHER.parse(q);
    check("(1) adapt finds Adapted and Adaptive", P("adapt").test("Adapted Swimming") && P("adapt").test("Adaptive Yoga"), "a word matches the start of a word");
    check("(1) adapt matches only at a word's start", !P("adapt").test("Readaptation Theory"), "Readaptation must not match adapt");
    check("(1) space means every word", P("adapted swim").test("Adapted Swimming") && !P("adapted swim").test("Adapted Yoga"), "space = all");
    check("(1) comma and or mean either", P("yoga, swim").test("Adapted Swimming") && P("yoga or swim").test("Adapted Yoga") && !P("yoga, swim").test("Tennis"), "comma/or = either");
    check("(1) minus leaves out", !P("adapt -dance").test("Introduction to Adapted Dance") && P("adapt -dance").test("Adapted Yoga"), "minus = exclude");
    check("(1) quotes keep a phrase", P('"adapted physical"').test("Adapted  Physical Education") && !P('"adapted physical"').test("Physical Education, Adapted"), "phrase in order");
    check("(1) capitals ignored", P("ADAPT").test("adapted yoga"), "case-insensitive");
    check("(1) an empty query matches nothing", P("").empty && !P("  ").test("anything") && !P("-dance").test("Adapted"), "never gather the whole list");
  }
  // (2) the address
  {
    const { w } = boot(null);
    const G = w.CPL_COMMONS_GATHER, q = { w: 'adapt -dance, "adaptive swim"', look: "both", cs: "PEDS", ls: "PE, ADAPT", to: "PEDS M1029", f: "" };
    const a = G.address("coci-lookup", q), back = G.readAddress("#" + a);
    check("(2) the address round-trips", JSON.stringify(back) === JSON.stringify(q), a + " -> " + JSON.stringify(back));
    check("(2) a bare gather address reads as empty", G.readAddress("#coci-lookup/gather").w === "" && G.readAddress("#coci-lookup/gather").look === "title", "defaults");
  }
  // (3), (4), (8) ticks, filters, summary
  {
    const { doc, addrs, calls } = boot({ email: "rev@example.org", access_token: "tok" }, "#coci-lookup/gather?w=adapt&to=PEDS%20M1029");
    await sleep(5);
    const ms = rowsOf(doc, "Common courses"), ls = rowsOf(doc, "Local courses");
    check("(3) the target is listed, ticked and locked", find(ms, "PEDS M1029") && find(ms, "PEDS M1029").box.checked && find(ms, "PEDS M1029").box.disabled, "target row");
    check("(3) a common course in the target's common subject starts ticked", find(ms, "PEDS M1026").box.checked && find(ms, "KINE M1267").box.checked, "same disc ticked");
    check("(3) one in another common subject starts unticked and says why", !find(ms, "ENGL M1032").box.checked && /another field/.test(find(ms, "ENGL M1032").text), find(ms, "ENGL M1032") && find(ms, "ENGL M1032").text);
    check("(3) a word outside the match is not listed", !find(ms, "KINE M1344"), "Yoga, Beginning has no adapt");
    check("(3) a local course inside a ticked common course is not listed", !find(ls, "CCC1") && !find(ls, "ADAPT 90"), "it follows its common course");
    check("(3) a local course whose local subject carries the target's common subject starts ticked", find(ls, "ADAPT 94").box.checked, find(ls, "ADAPT 94") && find(ls, "ADAPT 94").text);
    check("(3) TOP alone never ticks a local course", !find(ls, "PEX 107").box.checked && /TOP 0835/.test(find(ls, "PEX 107").text), find(ls, "PEX 107") && find(ls, "PEX 107").text);
    check("(3) a course in another common subject's common course starts unticked", !find(ls, "DSPS 210").box.checked && /Now under KINE M1344/.test(find(ls, "DSPS 210").text), "other disc");
    check("(3) Readaptation is not listed", !find(ls, "Readaptation"), "start-of-word rule in the view");
    const sum = txt(doc.querySelector(".cg-sum"));
    check("(8) the summary counts the merges and moves", /2 common courses merge into PEDS M1029/.test(sum) && /1 local course moves into it/.test(sum), sum);
    check("(8) the summary shows the units range joined", /0 to 3 units/.test(sum), sum);
    check("(8) the saved decisions on merged common courses are listed", /KINE M1267: common subject set to Physical Education Disabled Students, sam@example.org, 2026-11-24/.test(sum), sum);
    // (4) the local subject filter
    setInput(doc, "cg-ls", "PEX");
    const ls2 = rowsOf(doc, "Local courses");
    check("(4) local subject codes keep only those named", ls2.length === 1 && find(ls2, "PEX 107"), ls2.map((r) => r.text).join(" | "));
    check("(2) the view writes its address as the variables change", addrs[addrs.length - 1] === "coci-lookup/gather?w=adapt&ls=PEX&to=PEDS%20M1029", addrs[addrs.length - 1]);
    setInput(doc, "cg-ls", "");
    // untick one, tick another
    find(rowsOf(doc, "Local courses"), "PEX 107").box.click();
    find(rowsOf(doc, "Common courses"), "KINE M1267").box.click();
    // (5) the save
    calls.length = 0;
    const g = Array.from(doc.querySelectorAll("button")).filter((b) => txt(b) === "Gather into PEDS M1029")[0];
    check("(5) signed in, Gather into the target is offered", !!g, "the control");
    g.click();
    await sleep(20);
    const reads = calls.filter((c) => c.method === "GET" && /field=eq\.merge_into/.test(decodeURIComponent(c.url)));
    const posts = calls.filter((c) => c.method === "POST");
    const readKeys = reads.map((c) => decodeURIComponent(c.url)).join(" ");
    check("(5) the standing rows are read first, for every key", reads.length === 1 && /PEDS M1026/.test(readKeys) && /CN:CCC2/.test(readKeys) && /CN:CCC3/.test(readKeys) && !/KINE M1267/.test(readKeys),
      readKeys);
    const body = posts.length ? posts[0].body : [];
    check("(5) one insert-only post, ignoring duplicates", posts.length === 1 && /resolution=ignore-duplicates/.test(posts[0].headers.Prefer), JSON.stringify(posts.map((p) => p.headers)));
    check("(5) a merged common course is <M-ID> merge_into <target> under the reviewer", body.some((r) => r.course_id === "PEDS M1026" && r.field === "merge_into" && r.value === "PEDS M1029" && r.reviewer_email === "rev@example.org"), JSON.stringify(body));
    check("(5) a moved local course is CN:<control> merge_into <target>", body.some((r) => r.course_id === "CN:CCC3" && r.value === "PEDS M1029"), JSON.stringify(body));
    check("(5) a standing row is left alone", !body.some((r) => r.course_id === "CN:CCC2") && /CN:CCC2|ADAPT 94/.test(txt(doc.querySelector(".cg-sum"))) && /already into PEDS M1030/.test(txt(doc.querySelector(".cg-sum"))), txt(doc.querySelector(".cg-sum")));
    check("(5) an unticked row saves nothing", !body.some((r) => r.course_id === "KINE M1267" || r.course_id === "PEDS M1029"), JSON.stringify(body));
    check("(5) the result is said", /Saved 1 merge and 1 move into PEDS M1029/.test(txt(doc.querySelector(".cg-sum"))), txt(doc.querySelector(".cg-sum")));
    // (6) take it back
    calls.length = 0;
    const tb = Array.from(doc.querySelectorAll("button")).filter((b) => txt(b) === "Take it back")[0];
    check("(6) Take it back is offered after a save", !!tb, "the control");
    tb.click();
    await sleep(20);
    const del = calls.filter((c) => c.method === "DELETE"), du = del.length ? decodeURIComponent(del[0].url) : "";
    check("(6) one delete naming the field, the value and only the keys saved", del.length === 1 && /field=eq\.merge_into/.test(du) && /value=eq\.PEDS M1029/.test(du) && /PEDS M1026/.test(du) && /CN:CCC3/.test(du) && !/CN:CCC2/.test(du), du);
  }
  // (7) signed out
  {
    const { doc } = boot(null, "#coci-lookup/gather?w=adapt&to=PEDS%20M1029");
    await sleep(5);
    const g = Array.from(doc.querySelectorAll("button")).filter((b) => /^Gather into/.test(txt(b)));
    check("(7) signed out, no Gather control", !g.length, "no write control");
    check("(7) signed out, the sign-in fold", /Reviewers: sign in to gather/.test(txt(doc.querySelector(".cg-sum"))), "fold");
  }
  // (9) wired into the tab
  {
    const T = fs.readFileSync("coci_lookup.js", "utf8"), A = fs.readFileSync(".github/pages_allowlist.txt", "utf8");
    check("(9) Courses and Programs offers the Gather view", /\["gather", "Gather"\]/.test(T) && /renderGatherView\(\)/.test(T), "view chip");
    check("(9) #coci-lookup/gather opens it", T.indexOf("/^gather(\\?|$)/.test(parts[1]") >= 0, "route");
    check("(9) the Pages allowlist publishes commons_gather.js", /^publish commons_gather\.js$/m.test(A), "allowlist");
  }

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  <- " + why)); });
  console.log(fail ? fail + " failed" : "all " + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
