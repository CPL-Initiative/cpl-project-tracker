// Where a magic link brings you back to (cpl_session.js + its nine callers).
//
// Sam, 2026-08-25: "when log in to curate is done and magic link is clicked from
// email, it takes me to the CCR screen and should take me to the screen I was
// on."
//
// ⭐ THE SAME ROOT CAUSE AS cpl_session.js ITSELF, ONE KEY OVER. Nine modules
// stashed the tab in `sessionStorage.cpl_sb_return_tab`, and sessionStorage is
// PER BROWSER TAB. The magic link opens a NEW tab, so the note written where you
// clicked "sign in" was invisible where it is read, the reader fell back to its
// default, and every sign-in from anywhere landed on the Common Course
// Reference. cpl_session.js's own header cites cpl_sb_return_tab as the thing
// that "restores the right IN-APP tab" — while it could not, for exactly the
// reason that file exists.
//
// WHAT THIS GUARDS:
//   * The stash is readable from a DIFFERENT browser tab (a fresh sessionStorage
//     over the same localStorage) — that IS the bug, so it is the first check.
//   * It EXPIRES. A session should outlive a trip to an inbox; a "come back to
//     Memory" note should not still be lying around tomorrow hijacking an
//     unrelated sign-in.
//   * It is TAKEN, not read: one sign-in, one redirect.
//   * ⚠ EVERY caller routes through the keeper. Fixing one and leaving eight is
//     "a lesson in one file is not a lesson in the repo", which this project has
//     already paid for once.
//
// Run from repo root: `npm test` (or `node tests/cpl_session_return_tab.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const src = fs.readFileSync("cpl_session.js", "utf8");

// Two windows sharing ONE localStorage and holding SEPARATE sessionStorages —
// which is exactly what "the magic link opened a new browser tab" means. A
// single-window fixture cannot see this defect at all.
function twoTabs() {
  const shared = {};
  function mk() {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>",
      { runScripts: "outside-only", url: "https://example.org/" });
    const w = dom.window;
    const per = {};
    const store = (bag) => ({
      getItem: (k) => (k in bag ? bag[k] : null),
      setItem: (k, v) => { bag[k] = String(v); },
      removeItem: (k) => { delete bag[k]; },
    });
    Object.defineProperty(w, "localStorage", { value: store(shared), configurable: true });
    Object.defineProperty(w, "sessionStorage", { value: store(per), configurable: true });
    w.fetch = () => Promise.resolve({ ok: false, status: 400 });
    w.eval(src);
    return w;
  }
  return { a: mk(), b: mk() };
}

(function () {
  // ── (A) every caller routes through the keeper ───────────────────────────
  const callers = ["reviewer_signin.js", "projects_editor.js", "budget_editor.js",
    "canonical_subj4.js", "credential_reference.js", "team_phrases.js", "tmc_builder.js"];
  callers.forEach(function (f) {
    const s = fs.readFileSync(f, "utf8");
    check("(A) " + f + " stashes through the keeper", /CPL_SESSION\.stashReturnTab/.test(s));
  });
  const reader = fs.readFileSync("unified_courses.js", "utf8");
  check("(A) ⭐ the READER takes it through the keeper", /CPL_SESSION\.takeReturnTab/.test(reader));
  check("(A) the keeper exposes both halves",
    /stashReturnTab: stashReturnTab/.test(src) && /takeReturnTab: takeReturnTab/.test(src));
  // ⚠ A sessionStorage-only write left anywhere re-creates the bug on that path.
  callers.concat(["unified_courses.js"]).forEach(function (f) {
    // Every remaining sessionStorage write of this key must be the FALLBACK arm
    // — i.e. on a line that also says `else`. A bare one anywhere re-creates the
    // bug on that path, silently, for whoever signs in from that tab.
    const lines = fs.readFileSync(f, "utf8").split("\n")
      .filter((L) => /sessionStorage\.setItem\(\s*(?:["']cpl_sb_return_tab|RETURN_KEY)/.test(L));
    const bare = lines.filter((L) => !/\belse\b/.test(L));
    check("(A) " + f + " keeps no UNGUARDED sessionStorage-only stash",
      bare.length === 0, bare.join(" // "));
  });

  // ── (B) ⭐ the bug itself: another browser tab can read it ────────────────
  {
    const { a, b } = twoTabs();
    a.CPL_SESSION.stashReturnTab("memory");
    check("(B) ⭐ a DIFFERENT browser tab sees the stash",
      b.CPL_SESSION.takeReturnTab() === "memory");
  }
  {
    // The same-tab flow must keep working untouched.
    const { a } = twoTabs();
    a.CPL_SESSION.stashReturnTab("gr-priorities");
    check("(B) the same tab still sees it", a.CPL_SESSION.takeReturnTab() === "gr-priorities");
  }
  {
    const { a, b } = twoTabs();
    check("(B) with nothing stashed it returns null, so the caller keeps its default",
      a.CPL_SESSION.takeReturnTab() === null && b.CPL_SESSION.takeReturnTab() === null);
  }

  // ── (C) taken, not read ──────────────────────────────────────────────────
  {
    const { a, b } = twoTabs();
    a.CPL_SESSION.stashReturnTab("admin");
    check("(C) the first arrival gets it", b.CPL_SESSION.takeReturnTab() === "admin");
    // Scoped to the tab that CONSUMED it — that is where a second arrival would
    // happen. The originating tab's own copy is unreachable from here by
    // construction (separate sessionStorage) and is overwritten by its next
    // sign-in; it steers nothing, because nothing re-reads it without an
    // access_token in the URL.
    check("(C) ⭐ …and a second arrival in that tab is NOT redirected by it",
      b.CPL_SESSION.takeReturnTab() === null);
  }

  // ── (D) it expires ───────────────────────────────────────────────────────
  {
    const { a, b } = twoTabs();
    a.CPL_SESSION.stashReturnTab("memory");
    // Reach into the shared copy and age it past the window — the same shape as
    // a note left overnight, which must not steer tomorrow's sign-in.
    // ⚠ Read defensively. If the shared write ever stops happening this is null,
    // and dereferencing it THROWS — which stops the file and leaves every later
    // check unreported while the exit code says only "something failed". Five
    // times this session; never inline again.
    const rawStr = a.localStorage.getItem("cpl_sb_return_tab");
    check("(D) the stash reached the shared store at all", !!rawStr, String(rawStr));
    if (rawStr) {
      const raw = JSON.parse(rawStr);
      raw.at = Date.now() - (a.CPL_SESSION._returnTtlMs + 60000);
      a.localStorage.setItem("cpl_sb_return_tab", JSON.stringify(raw));
    }
    check("(D) ⭐ a stale stash is ignored", b.CPL_SESSION.takeReturnTab() === null);
    check("(D) the TTL is long enough for an inbox round trip",
      a.CPL_SESSION._returnTtlMs >= 10 * 60 * 1000 && a.CPL_SESSION._returnTtlMs <= 2 * 60 * 60 * 1000,
      String(a.CPL_SESSION._returnTtlMs));
  }

  // ── (E) an older plain-string stash is honored, not discarded ────────────
  {
    const { a, b } = twoTabs();
    a.localStorage.setItem("cpl_sb_return_tab", JSON.stringify("cip-crosswalk"));
    check("(E) a stash written before this shipped still answers 'where was I'",
      b.CPL_SESSION.takeReturnTab() === "cip-crosswalk");
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
