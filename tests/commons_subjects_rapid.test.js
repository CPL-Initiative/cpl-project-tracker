// The lightning round on the Commons Subjects page (S737; Sam, 2026-11-26: "a lightning round way to rifle through
// these and clear the deck"): #commons/subjects/rapid, one code with no title at a time.
//
// WHAT THIS GUARDS:
//   (1) ⭐ the queue is exactly untitledNow's rows from every college, the most confident guess first;
//   (2) ⭐ Accept writes one save, the same kb_curation row the row's Accept writes, under the reviewer's email, with
//       local_title the edited field's text; then it moves on, and the saved code leaves the queue;
//   (3) ⭐ Skip and Back write nothing; Ctrl+ArrowRight skips;
//   (4) ⭐ Enter in the field accepts;
//   (5) a missing guess file still draws, each field filled from the recommender's top candidate;
//   (6) ⭐ #commons/subjects/rapid opens the view, and the stamp line links it;
//   (7) each code shows one example course, the guess file's first (Sam, 2026-11-26), with the code's course count;
//   (8) an empty queue says so and links back to Subjects;
//   (9) ⭐ a guess with a catalog page (source_url, source_says) shows "The catalog says:" as a link, and Accept saves
//       source_url only when the guess is accepted unedited;
//   (10) ⭐ on a phone (a coarse pointer; Sam, 2026-11-26: "optimize the lightning round view for the phone so I can
//       judge or change them on the fly"): the keyboard waits (the heading takes focus, not the title), the hint names
//       taps and swipes, a left swipe skips and a right swipe goes back writing nothing, the title field asks for Go,
//       the phone CSS pins the three controls to a thumb bar at 48px; and Undo takes back the save the round just made;
//   (11) ⭐ COBI's verdict (Sam, 2026-11-26: "Can you judge the lightning round first?"): a changed guess fills the field
//       with COBI's title and names the guess it replaced; a code judged not a subject code starts empty, so Accept
//       saves nothing; the page that settled the verdict links out.
// Run from repo root: `npm test` (or `node tests/commons_subjects_rapid.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const LIVE = JSON.parse(fs.readFileSync("kb/status/local_subject_titles.json", "utf8"));
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
FIX.common_codes = { BIOL: "Biology", ENGL: "English", MATH: "Mathematics", WELD: "Welding" };
FIX.title_case = LIVE.title_case;
const GUESSES = JSON.parse(fs.readFileSync("tests/fixtures/subject_title_guesses_fixture.json", "utf8"));
/* Recommendations under 80, so the codes stay untitled: alpha MATH 70, beta WELD 50; beta ENG has none. */
const RECS = { colleges: [
  { slug: "alpha", rows: [{ code: "MATH", title: { title: "Mathematics", confidence: 70, from: "other_colleges", why: "other colleges agree." } }] },
  { slug: "beta", rows: [{ code: "WELD", title: { title: "Welding", confidence: 50, from: "own_courses", why: "its courses name welding." } }] }] };
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/local_subject_recommendations.json": RECS,
  "kb/status/subject_title_guesses.json": GUESSES
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {}, calls = [];
  let sess = opt.sess || null;
  if (opt.coarse) w.matchMedia = (q) => ({ matches: /pointer:\s*coarse/.test(q), addListener() {}, removeListener() {} });
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer " + (sess ? sess.access_token : "ANON") }, extra || {}),
    viewAddress: () => {}
  };
  const all = Object.assign({}, FILES, opt.files || {});
  (opt.drop || []).forEach((k) => { delete all[k]; });
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (url.indexOf(REST) === 0) {
      const method = init.method || "GET";
      calls.push({ url, method, headers: init.headers || {}, body: init.body });
      if (method === "GET") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opt.saves || []))) });
      if (method === "POST") return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
      if (method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ course_id: "x" }]) });
    }
    const hit = all[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const writesOf = (x) => x.calls.filter((c) => c.method !== "GET");
const head = (x) => txt(x.d.getElementById("csb-rapid-h"));
function key(x, el, k, mods) {
  el.dispatchEvent(new x.w.KeyboardEvent("keydown", Object.assign({ key: k, bubbles: true, cancelable: true }, mods || {})));
}

(async function () {
  /* (6) the address opens the view */
  let x = load("#commons/subjects/rapid", { sess: ME });
  await x.M.boot(); await settle();
  check("(6) ⭐ #commons/subjects/rapid opens the lightning round", !!x.d.getElementById("csb-rapid") && /lightning round/i.test(txt(x.d.getElementById("csb-h")))
    && x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/rapid", x.w.CPL_COMMONS_SUBJECTS.address());

  /* (1) the queue: beta WELD 92, alpha MATH 60 (the guess outranks the recommender's 70), beta ENG with no guess */
  check("(1) ⭐ the queue holds the three untitled codes: 3 to go", /^3 to go\. 0 saved this visit\./.test(txt(x.d.getElementById("csb-rapid-left"))), txt(x.d.getElementById("csb-rapid-left")));
  check("(1) ⭐ the most confident guess comes first, with its title in the field", head(x) === "WELD at Beta College"
    && x.d.getElementById("csb-rapid-title").value === "Welding Technology", head(x));
  const bar = x.d.querySelector("#csb-rapid .cmn-cbar");
  check("(1) the guess carries its 0-100 bar and its why line", bar && bar.getAttribute("data-conf") === "92"
    && txt(x.d.getElementById("csb-rapid-why")) === "Two other colleges print this title for WELD.");
  /* (7) one example course */
  check("(7) the card shows one example course, the guess file's first, with the code's course count",
    txt(x.d.getElementById("csb-rapid-ex")) === "Example course: WELD 10 Intro to Welding (1 of 7 courses)" && !/Arc Welding/.test(txt(x.d.getElementById("csb-rapid"))),
    txt(x.d.getElementById("csb-rapid-ex")));
  const src = x.d.querySelector("#csb-rapid-src a");
  check("(9) a guess with a catalog page shows what the catalog says, a link that opens in a new tab",
    /^The catalog says: WELD: Welding Technology/.test(txt(x.d.getElementById("csb-rapid-src"))) && src && src.getAttribute("href") === "https://catalog.beta.example.edu/weld"
    && src.getAttribute("target") === "_blank" && /noopener/.test(src.getAttribute("rel") || ""), txt(x.d.getElementById("csb-rapid-src")));
  check("(6) the controls are underlined-word buttons and the keys show in one line",
    ["csb-rapid-accept", "csb-rapid-skip", "csb-rapid-back"].every((id) => { const b = x.d.getElementById(id); return b && b.tagName === "BUTTON" && b.classList.contains("csb-word"); })
    && /Enter in the title accepts it/.test(txt(x.d.getElementById("csb-rapid-keys"))) && !!x.d.querySelector('label[for="csb-rapid-title"]'));

  /* (3) Skip and Back write nothing */
  x.d.getElementById("csb-rapid-skip").click(); await settle();
  check("(3) ⭐ Skip moves to the next code and writes nothing", head(x) === "MATH at Alpha College" && writesOf(x).length === 0
    && x.d.getElementById("csb-rapid-title").value === "Math", head(x));
  key(x, x.d.getElementById("csb-rapid-title"), "ArrowRight", { ctrlKey: true }); await settle();
  check("(3) Ctrl+ArrowRight skips, and ENG with no guess or recommendation starts empty", head(x) === "ENG at Beta College"
    && x.d.getElementById("csb-rapid-title").value === "" && writesOf(x).length === 0);
  key(x, x.d.getElementById("csb-rapid-title"), "ArrowLeft", { metaKey: true }); await settle();
  x.d.getElementById("csb-rapid-back").click(); await settle();
  check("(3) Command+ArrowLeft and Back go back, writing nothing", head(x) === "WELD at Beta College" && writesOf(x).length === 0
    && x.d.getElementById("csb-rapid-back").disabled, head(x));

  /* (2) Accept saves the edited text */
  x.d.getElementById("csb-rapid-title").value = "Welding Arts";
  x.d.getElementById("csb-rapid-accept").click(); await settle();
  let posts = writesOf(x), body = posts[0] && JSON.parse(posts[0].body);
  check("(2) ⭐ Accept posts one save: the row's key, the field, local_title from the field, the reviewer's email",
    posts.length === 1 && posts[0].method === "POST" && posts[0].url === REST + "?on_conflict=course_id,field"
    && body.course_id === "SUBJ:beta|WELD|credit" && body.field === "subject_decision" && body.value === JSON.stringify({ local_title: "Welding Arts" })
    && body.reviewer_email === ME.email && posts[0].headers.Authorization === "Bearer " + ME.access_token, posts[0] && posts[0].body);
  check("(9) ⭐ an edited title saves no source_url, though its guess carried a catalog page", body && !/source_url/.test(body.value));
  check("(2) ⭐ then it moves on, and the saved code leaves the queue", head(x) === "MATH at Alpha College"
    && /^2 to go\. 1 saved this visit\./.test(txt(x.d.getElementById("csb-rapid-left"))) && x.d.activeElement === x.d.getElementById("csb-rapid-title"),
    txt(x.d.getElementById("csb-rapid-left")));

  /* (4) Enter in the field accepts */
  key(x, x.d.getElementById("csb-rapid-title"), "Enter"); await settle();
  posts = writesOf(x); body = posts[1] && JSON.parse(posts[1].body);
  check("(4) ⭐ Enter in the field accepts the guess", posts.length === 2 && body.course_id === "SUBJ:alpha|MATH|credit"
    && JSON.parse(body.value).local_title === "Math" && head(x) === "ENG at Beta College", posts[1] && posts[1].body);
  check("(9) ⭐ the guess accepted as written saves its catalog page as source_url beside local_title",
    body && body.value === JSON.stringify({ local_title: "Math", source_url: "https://catalog.alpha.example.edu/math" }), body && body.value);
  key(x, x.d.getElementById("csb-rapid-title"), "Enter"); await settle();
  check("(4) Enter on an empty field writes nothing and says so", writesOf(x).length === 2 && /Nothing to accept/.test(txt(x.d.getElementById("csb-rapid-msg"))));

  /* (5) a missing guess file */
  x = load("#commons/subjects/rapid", { sess: ME, drop: ["kb/status/subject_title_guesses.json"] });
  await x.M.boot(); await settle();
  check("(5) without the guess file the view still draws, the recommender's candidate first", head(x) === "MATH at Alpha College"
    && x.d.getElementById("csb-rapid-title").value === "Mathematics" && /^3 to go/.test(txt(x.d.getElementById("csb-rapid-left"))), head(x));
  check("(5) a code with no guess shows no example course, only its count", txt(x.d.getElementById("csb-rapid-ex")) === "4 courses; no example course is on file.",
    txt(x.d.getElementById("csb-rapid-ex")));

  /* the stamp line links the round */
  x = load("#commons/subjects", { sess: ME });
  await x.M.boot(); await settle();
  const link = x.d.querySelector('.csb-stamp a[data-csb-go="rapid"]');
  check("(6) the stamp line carries a Lightning round link beside the titles to check", link && txt(link) === "Lightning round"
    && link.previousElementSibling && link.previousElementSibling.getAttribute("data-csb-go") === "disagree");
  link.click(); await settle();
  check("(6) the link opens the round, its field focused", !!x.d.getElementById("csb-rapid") && x.d.activeElement === x.d.getElementById("csb-rapid-title"));

  /* (10) the phone */
  x = load("#commons/subjects/rapid", { sess: ME, coarse: true });
  await x.M.boot(); await settle();
  check("(10) ⭐ on a phone the heading takes focus, so the keyboard waits until the title is tapped",
    x.d.activeElement === x.d.getElementById("csb-rapid-h") && x.d.activeElement !== x.d.getElementById("csb-rapid-title"), x.d.activeElement && x.d.activeElement.id);
  check("(10) the phone hint names taps and swipes, and the field asks the keyboard for Go",
    /Swipe left to skip, right to go back/.test(txt(x.d.getElementById("csb-rapid-keys"))) && x.d.getElementById("csb-rapid-title").getAttribute("enterkeyhint") === "go");
  const css = Array.from(x.d.querySelectorAll("style")).map((n) => n.textContent).join("\n");
  check("(10) ⭐ the phone CSS pins the controls to a thumb bar with 48px targets and a 16px field",
    /@media \(max-width:640px\), \(pointer: coarse\)[^@]*\.csb-rapid-acts \{ position:fixed;[^}]*bottom:0/.test(css) && /\.csb-rapid-acts \.csb-word \{ min-height:48px/.test(css)
    && /\.csb-rapid \.csb-input \{ font-size:16px/.test(css));
  function swipe(el, dx) {
    const T = (X) => ({ clientX: X, clientY: 100 });
    const a = new x.w.Event("touchstart", { bubbles: true }); a.touches = [T(200)]; el.dispatchEvent(a);
    const b = new x.w.Event("touchend", { bubbles: true }); b.changedTouches = [T(200 + dx)]; el.dispatchEvent(b);
  }
  swipe(x.d.getElementById("csb-rapid-h"), -120); await settle();
  check("(10) ⭐ a left swipe skips, writing nothing", head(x) === "MATH at Alpha College" && writesOf(x).length === 0, head(x));
  swipe(x.d.getElementById("csb-rapid-h"), 120); await settle();
  check("(10) a right swipe goes back, writing nothing", head(x) === "WELD at Beta College" && writesOf(x).length === 0, head(x));
  swipe(x.d.getElementById("csb-rapid-h"), -30); await settle();
  check("(10) a short drag is not a swipe", head(x) === "WELD at Beta College");
  x.d.getElementById("csb-rapid-accept").click(); await settle();
  const undo = x.d.getElementById("csb-rapid-undo");
  check("(10) ⭐ after a save the progress line offers Undo", undo && undo.tagName === "BUTTON" && head(x) === "MATH at Alpha College", head(x));
  undo.click(); await settle();
  const del = writesOf(x).filter((c) => c.method === "DELETE");
  check("(10) ⭐ Undo deletes that one save, by its key and the reviewer, and the code is back in front",
    del.length === 1 && /course_id=eq\.SUBJ%3Abeta%7CWELD%7Ccredit/.test(del[0].url) && /reviewer_email=eq\./.test(del[0].url)
    && head(x) === "WELD at Beta College" && /^3 to go\. 0 saved this visit\./.test(txt(x.d.getElementById("csb-rapid-left"))) && !x.d.getElementById("csb-rapid-undo"),
    del[0] && del[0].url);

  /* (11) COBI's verdict */
  const JG = JSON.parse(JSON.stringify(GUESSES));
  JG.rows.forEach((r) => {
    if (r.code === "WELD") r.judged = { verdict: "change", title: "Welding Technology and Fabrication", sure: 95, why: "the catalog heading reads so", url: "https://catalog.beta.example.edu/weld-heading" };
    if (r.code === "MATH") r.judged = { verdict: "not_a_subject", title: "MATH", sure: 90, why: "a course-number suffix", url: null };
  });
  x = load("#commons/subjects/rapid", { sess: ME, files: { "kb/status/subject_title_guesses.json": JG } });
  await x.M.boot(); await settle();
  check("(11) ⭐ a changed guess fills the field with COBI's title and names the guess it replaced",
    head(x) === "WELD at Beta College" && x.d.getElementById("csb-rapid-title").value === "Welding Technology and Fabrication"
    && /COBI changed the guess, which read Welding Technology\./.test(txt(x.d.getElementById("csb-rapid-verdict"))), txt(x.d.getElementById("csb-rapid-verdict")));
  check("(11) the page that settled the verdict links out", (x.d.querySelector("#csb-rapid-src a") || {}).href === "https://catalog.beta.example.edu/weld-heading");
  x.d.getElementById("csb-rapid-skip").click(); await settle();
  check("(11) ⭐ a code judged not a subject code starts empty and says so", head(x) === "MATH at Alpha College"
    && x.d.getElementById("csb-rapid-title").value === "" && /not a subject code/.test(txt(x.d.getElementById("csb-rapid-verdict"))));
  x.d.getElementById("csb-rapid-accept").click(); await settle();
  check("(11) ⭐ so Accept on it saves nothing", writesOf(x).length === 0 && /Nothing to accept/.test(txt(x.d.getElementById("csb-rapid-msg"))));

  /* (8) an empty queue */
  const AT = "2026-11-26T00:00:00Z";
  const ALLSAVED = ["alpha|MATH|credit", "beta|WELD|credit", "beta|ENG|whole"].map((k) => ({ course_id: "SUBJ:" + k, value: JSON.stringify({ local_title: "X" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" }));
  x = load("#commons/subjects/rapid", { sess: ME, saves: ALLSAVED });
  await x.M.boot(); await settle();
  const empty = x.d.getElementById("csb-rapid-empty");
  check("(8) an empty queue says no codes are left and links back to Subjects", empty && /^No codes are left without a title\./.test(txt(empty))
    && empty.querySelector('a[href="#commons/subjects"]'), txt(x.d.getElementById("csb-rapid")));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
