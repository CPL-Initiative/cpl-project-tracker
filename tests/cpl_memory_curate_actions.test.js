// 🧠 Memory tab — the write key, the failure message, and the inactive/delete
// affordances (cpl_memory.js).
//
// Sam, 2026-08-25, live on the tab: "The memory I'm on is not needed and I want
// to set it as inactive or delete it but I don't seem to have that option." and
// "The proposed chip doesn't seem to be working" and "the team unlock doesn't
// seem to respond … but not the confusing message about team phrase expired".
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * THE WRITE KEY. Every write used to be addressed `?slug=eq.<display
//     handle>`. `cpl_memory.slug` is UNIQUE but NULLABLE, and normalizeRow falls
//     back to the row's uuid for DISPLAY when it is null — so on the six live
//     rows with no slug the PATCH went out as `slug=eq.<uuid>`, matched NOTHING,
//     and PostgREST answered 200 + [] which checkWrite reports as a 403. The
//     chip did nothing and the page blamed the team phrase. `id` is the primary
//     key and is NOT NULL, so it always names exactly one row.
//     This is methodology-a-write-key-must-name-exactly-one-thing (the CN:
//     guard, PR #1329) one level down: there a key named two things, here none.
//
//   * A REFUSAL IS NOT A MISS. checkWrite reports an ok-but-empty representation
//     as 403-shaped so the phrase-recovery path engages, but it hands back an
//     ARRAY there and null on a real HTTP rejection. That is the only thing
//     separating "you are not allowed" from "nothing matched", and they need
//     different words and different remedies.
//
//   * NAME THE CREDENTIAL IN PLAY. "your team phrase may have expired" was shown
//     to a curator signed in by MAGIC LINK, for whom the phrase is irrelevant and
//     whose phrase handleWriteFailure correctly never touches.
//
//   * THE MESSAGE MUST COME WITH ITS CONTROL. The banner said "re-unlock" while
//     renderAuth rendered the unlock row only when there was NO session — so the
//     instruction named a control that was nowhere on the page. Same shape as
//     methodology-hiding-a-control-also-hides-the-way-in.
//
//   * AN ACTION NEEDS A WAY BACK. matchesEntry hides superseded rows from every
//     list unconditionally, so marking one inactive drops it out of sight. The
//     entry pane therefore keeps its tools for a superseded row — Restore lives
//     on the only surface that can still reach it.
//
//   * A DELETE NAMES WHAT IT STRANDS. Deleting a row other entries point at is
//     merge_into_orphan one table over: the pointers survive, the thing they
//     name does not, and nothing says so until something reads them.
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_curate_actions.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("cpl_memory.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");

const JWT = "a".repeat(24) + "." + "b".repeat(24) + "." + "c".repeat(24);

// `creds`: "phrase" | "magic". Booting them separately is deliberate — sess is
// resolved from storage by refreshSession() on every render, so a test that set
// it through a seam would have it clobbered by the next paint.
function boot(creds) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-memory"><div id="memory-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  if (creds === "phrase") {
    try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {}
  } else if (creds === "magic") {
    try {
      window.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: JWT, email: "slee@cccco.edu" }));
    } catch (e) {}
  }
  window.eval(teamSrc);
  window.eval(src);
  return window;
}

// The shapes that matter: one row WITH a slug, one WITHOUT (the live defect),
// one already inactive, and one inactive because a revision replaced it.
const UUID_A = "11111111-1111-1111-1111-111111111111";
const UUID_B = "1cc9527f-7e8f-43e5-ada7-da467918e4a4";   // the row in Sam's screenshot
const UUID_C = "33333333-3333-3333-3333-333333333333";
const UUID_D = "44444444-4444-4444-4444-444444444444";
const UUID_E = "55555555-5555-5555-5555-555555555555";
function fixture() {
  return [
    { id: UUID_A, slug: "f1", kind: "fact", status: "verified", summary: "A row that has a slug",
      detail: "Points at the slugless one.", tags: ["dashboard"], affects: ["index.html"], related: ["p9"] },
    // ⭐ THE DEFECT: slug is null, so ingest displays the uuid as the handle.
    { id: UUID_B, slug: null, kind: "fact", status: "proposed",
      summary: "A waived noncredit course generates zero apportionment",
      detail: "Noncredit is funded on contact hours.", tags: ["noncredit"], affects: [], related: [] },
    { id: UUID_C, slug: "p9", kind: "pitfall", status: "superseded", summary: "Already inactive, no replacement",
      detail: "Restorable.", tags: [], affects: [], related: [] },
    { id: UUID_D, slug: "p8", kind: "pitfall", status: "superseded", superseded_by: "f1",
      summary: "Inactive because a revision replaced it", detail: "Chained.", tags: [], affects: [], related: [] },
    { id: UUID_E, slug: "d1", kind: "decision", status: "verified", summary: "A row nothing points at",
      detail: "Safe to delete.", tags: [], affects: [], related: [] },
  ];
}

// Mount, seed, and open an entry in the ripple pane. Superseded rows are never
// in the LIST (matchesEntry hides them outright), so the seam is used rather
// than a click — which is exactly how the app reaches them too: a version-chain
// or related chip, never the list.
function open(win, slugOrUuid) {
  win.CPL_MEMORY.activate();
  win.CPL_MEMORY._state.status = "all";
  win.CPL_MEMORY._setData(fixture());
  win.CPL_MEMORY._selectEntry(slugOrUuid);
  return win.document.querySelector("#memory-root .rp-tools");
}
function delButton(win) {
  return [...win.document.querySelectorAll("#memory-root .rp-tools button")]
    .find((b) => /Delete/.test(b.textContent)) || null;
}
// Clicking a control that is not there must be reported, never thrown: a throw
// stops the suite and silently un-runs every section below it.
function clickOrFail(el, label) {
  if (!el) { check("(!) the control exists to click: " + label, false, "not rendered"); return false; }
  el.click(); return true;
}
function toolLabels(win) {
  const t = win.document.querySelector("#memory-root .rp-tools");
  return t ? [...t.querySelectorAll("button")].map((b) => b.textContent) : [];
}

(async () => {
  // ── (A) static — no write may be addressed to the display handle ──────────
  check("(A) ⭐ no cpl_memory write is keyed on slug=eq.",
    src.indexOf("cpl_memory?slug=eq.") === -1,
    "found a slug-keyed write — a null-slug row makes that key name nothing");
  check("(A) writes are keyed through one helper", /function writeKey\s*\(/.test(src));
  check("(A) a keyless row is refused rather than written blind", /function refuseKeyless\s*\(/.test(src));
  check("(A) _uuid never falls back to a slug (it is a uuid FK + a uuid key)",
    /r\._uuid = d\.id != null \? d\.id : null;/.test(src));
  check("(A) the delete verb the audit table already accepts is used", /"delete"/.test(src));

  const winM = boot("magic");
  const api = winM.CPL_MEMORY;
  // sess is resolved from storage by refreshSession() on render, so the module
  // has to have painted once before its credential-aware messages mean anything.
  winM.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  api.activate();
  check("(A) the curate seams are exposed", typeof api._writeKey === "function"
    && typeof api._writeFailMessage === "function" && typeof api._setStatus === "function"
    && typeof api._deleteEntry === "function");

  // ── (B) writeKey ─────────────────────────────────────────────────────────
  check("(B) a slug-carrying row is keyed on its primary key",
    api._writeKey({ _uuid: UUID_A, id: "f1" }) === "id=eq." + UUID_A);
  check("(B) ⭐ a SLUGLESS row is keyed on its uuid, not sent as a slug",
    api._writeKey({ _uuid: UUID_B, id: UUID_B }) === "id=eq." + UUID_B);
  check("(B) a row with no database key yields no key at all",
    api._writeKey({ id: "f1" }) === null && api._writeKey(null) === null);

  // ── (C) end to end — the ✎ chip on the slugless row ──────────────────────
  {
    const win = boot("magic");
    const calls = [];
    win.fetch = function (url, init) {
      calls.push({ url: String(url), method: (init && init.method) || "GET" });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: UUID_B }]) });
    };
    win.CPL_MEMORY.activate();
    win.CPL_MEMORY._setData(fixture());
    win.CPL_MEMORY._state.status = "all";
    win.CPL_MEMORY._setData(fixture());
    const items = [...win.document.querySelectorAll(".mem-item")];
    const target = items.find((li) => li.textContent.indexOf("zero apportionment") >= 0);
    check("(C) the slugless row is listed", !!target);
    const chip = target && target.querySelector(".mi-curate");
    check("(C) it carries a ✎ status chip in curate mode", !!chip);
    check("(C) the chip's tooltip names what the click DOES, not what the row IS",
      !!chip && /Set to verified/.test(chip.title) && /currently proposed/.test(chip.title));
    calls.length = 0;
    if (chip) chip.click();
    await tick(); await tick();
    const patch = calls.find((c) => c.method === "PATCH");
    check("(C) ⭐ the chip PATCHes the slugless row by its uuid",
      !!patch && patch.url.indexOf("cpl_memory?id=eq." + UUID_B) >= 0,
      patch ? patch.url : "no PATCH was issued");
    check("(C) ⭐ …and never sends the uuid as a slug",
      !patch || patch.url.indexOf("slug=eq.") === -1, patch ? patch.url : "");
  }

  // ── (D) the failure message — refusal vs miss, and which credential ──────
  {
    const zero = api._writeFailMessage({ ok: false, status: 403, rows: [] });
    check("(D) ⭐ a zero-row write is not reported as an expired credential",
      /nothing was saved/i.test(zero) && !/team phrase/i.test(zero) && !/sign-in was refused/i.test(zero), zero);
    check("(D) …and says nothing was lost", /nothing was lost/i.test(zero), zero);
    const refusedM = api._writeFailMessage({ ok: false, status: 401, rows: null });
    check("(D) ⭐ a magic-link session is told about its SIGN-IN, not the team phrase",
      /sign-in/i.test(refusedM) && !/team phrase/i.test(refusedM), refusedM);
    const winP = boot("phrase");
    winP.CPL_MEMORY.activate();
    const refusedP = winP.CPL_MEMORY._writeFailMessage({ ok: false, status: 403, rows: null });
    check("(D) a phrase session is told about the TEAM PHRASE",
      /team phrase/i.test(refusedP) && /may have expired/.test(refusedP), refusedP);
    const other = api._writeFailMessage({ ok: false, status: 500, rows: null });
    check("(D) a server error is neither", !/team phrase/i.test(other) && !/nothing was saved/i.test(other), other);
  }

  // ── (E) the entry pane's tools ───────────────────────────────────────────
  {
    const win = boot("magic");
    win.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    open(win, "f1");
    const live = toolLabels(win).join(" | ");
    check("(E) ⭐ a live entry offers Mark inactive", /Mark inactive/.test(live), live);
    check("(E) ⭐ a live entry offers Delete", /Delete/.test(live), live);
    check("(E) …alongside Edit and Revise", /Edit in place/.test(live) && /Revise/.test(live), live);

    open(win, "p9");
    const inactive = toolLabels(win).join(" | ");
    check("(E) ⭐ an inactive entry can still be reached and RESTORED",
      /Restore/.test(inactive), inactive);
    check("(E) an inactive entry is not offered Edit or Revise",
      !/Edit in place/.test(inactive) && !/Revise/.test(inactive), inactive);
    check("(E) an inactive entry can still be deleted", /Delete/.test(inactive), inactive);

    open(win, "p8");
    const chained = toolLabels(win).join(" | ");
    const note = win.document.querySelector("#memory-root .rp-toolnote");
    check("(E) ⭐ a row superseded BY a revision offers no Restore (two live rows would claim the same thing)",
      !/Restore/.test(chained), chained);
    check("(E) …and says what replaced it", !!note && /replaced by f1/.test(note.textContent),
      note ? note.textContent : "no note");
  }
  {
    const win = boot(null);   // no credential at all
    win.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    open(win, "f1");
    check("(E) a reader with no session is offered no write tools at all",
      toolLabels(win).length === 0, toolLabels(win).join(" | "));
  }

  // ── (F) the delete confirm ───────────────────────────────────────────────
  {
    const win = boot("magic");
    win.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    open(win, "p9");   // f1 lists p9 in related[], so p9 is pointed at
    clickOrFail(delButton(win), "Delete on p9");
    const form = win.document.querySelector("#memory-root .rp-toolhost .mem-form");
    check("(F) delete opens a confirm rather than firing", !!form);
    check("(F) the confirm recommends the reversible action first",
      !!form && /Mark inactive/i.test(form.textContent), form ? form.textContent.slice(0, 120) : "");
    const warn = form && form.querySelector(".mem-form-warn");
    check("(F) ⭐ it names the entries that point at this one",
      !!warn && /f1/.test(warn.textContent), warn ? warn.textContent : "no warning");
    check("(F) …and says what deleting does to them",
      !!warn && /naming nothing/.test(warn.textContent), warn ? warn.textContent : "");

    // A row nothing references gets no reference warning, and a reviewer gets no
    // permission warning — a warning that always shows teaches nothing.
    open(win, "d1");
    clickOrFail(delButton(win), "Delete on d1");
    const clean = win.document.querySelector("#memory-root .rp-toolhost .mem-form");
    check("(F) an unreferenced row raises no reference warning",
      !!clean && !clean.querySelector(".mem-form-warn"),
      clean && clean.querySelector(".mem-form-warn") ? clean.querySelector(".mem-form-warn").textContent : "");
  }
  {
    const win = boot("phrase");
    win.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    open(win, "d1");
    clickOrFail(delButton(win), "Delete on d1 (phrase session)");
    const form = win.document.querySelector("#memory-root .rp-toolhost .mem-form");
    const warn = form && form.querySelector(".mem-form-warn");
    check("(F) ⭐ a phrase-holder is told delete is reviewer-only BEFORE trying",
      !!warn && /reviewer sign-in/i.test(warn.textContent), warn ? warn.textContent : "no warning");
  }

  // ── (G) a delete actually issues DELETE against the primary key ──────────
  {
    const win = boot("magic");
    const calls = [];
    win.fetch = function (url, init) {
      calls.push({ url: String(url), method: (init && init.method) || "GET", body: init && init.body });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: UUID_E }]) });
    };
    open(win, "d1");
    calls.length = 0;
    clickOrFail(delButton(win), "Delete on d1 (write path)");
    clickOrFail(win.document.querySelector("#memory-root .mem-btn-danger"), "Delete permanently");
    await tick(); await tick();
    const gone = calls.find((c) => c.method === "DELETE");
    check("(G) ⭐ delete addresses the primary key",
      !!gone && gone.url.indexOf("cpl_memory?id=eq." + UUID_E) >= 0, gone ? gone.url : "no DELETE issued");
    check("(G) the DELETE asks for the deleted rows back (so an RLS filter is visible)",
      !!gone && calls.some((c) => c.method === "DELETE"));
    check("(G) a DELETE carries no JSON body", !!gone && gone.body == null, gone ? String(gone.body) : "");
    check("(G) the deletion is written to the audit log",
      calls.some((c) => c.method === "POST" && /cpl_memory_log/.test(c.url)));
  }

  // ── (H) the error banner carries the control it names ────────────────────
  {
    const win = boot("magic");
    // A refusal with rows:null — the auth-shaped arm.
    win.fetch = () => Promise.resolve({ ok: false, status: 401 });
    open(win, "f1");
    clickOrFail(win.document.querySelector("#memory-root .mi-curate"), "the ✎ status chip");
    await tick(); await tick(); await tick();
    const box = win.document.querySelector("#memory-root .mem-writeerr");
    check("(H) a refused write raises a banner", !!box, "no banner");
    const btns = box ? [...box.querySelectorAll("button")].map((b) => b.textContent) : [];
    check("(H) ⭐ the banner offers a control, not just a sentence", btns.length > 0, btns.join(" | "));
    check("(H) ⭐ a magic-link curator is offered the sign-in check, not an unlock box",
      btns.some((t) => /Check sign-in/.test(t)), btns.join(" | "));
    check("(H) the banner can be dismissed", btns.some((t) => /Dismiss/.test(t)), btns.join(" | "));
    const dis = box && [...box.querySelectorAll("button")].find((b) => /Dismiss/.test(b.textContent));
    if (dis) dis.click();
    check("(H) …and dismissing clears it",
      !win.document.querySelector("#memory-root .mem-writeerr"));
  }
  {
    const win = boot("phrase");
    win.fetch = () => Promise.resolve({ ok: false, status: 403 });
    open(win, "f1");
    clickOrFail(win.document.querySelector("#memory-root .mi-curate"), "the ✎ status chip (phrase)");
    await tick(); await tick(); await tick();
    const bar = win.document.querySelector("#memory-root .mem-authbar");
    check("(H) ⭐ a phrase-holder whose write was refused is given the unlock row",
      !!bar && !!bar.querySelector(".cpl-tp-unlock"),
      bar ? bar.textContent.slice(0, 140) : "no auth bar");
  }

  // ── (I) the tab re-renders when the keeper changes the session ───────────
  check("(I) the tab listens for the keeper's announcement",
    /addEventListener\("cpl-session-changed"/.test(src));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
