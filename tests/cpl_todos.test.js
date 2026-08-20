// Test for the 📋 To-Do button (cpl_todos.js) — the per-tab daily checklist.
//
// Guards the failure modes:
//   - the button + badge render from kb/cpl_todos.json (and the badge counts
//     only the CURRENT tab's unchecked items, "all"-tab items included)
//   - the panel splits items into the For-Sam / For-Fable sections and lists
//     the current tab's items BEFORE other tabs' items
//   - other-tab items carry a navigation chip; current-tab items don't
//   - checking an item persists to localStorage (keyed by the feed's _as_of),
//     survives a panel re-open, and decrements the badge
//   - STALE feed dates are pruned from localStorage (a new feed = a fresh
//     checklist — yesterday's check-offs must not bleed in)
//   - a missing/empty feed renders NO button (fail-soft on preview deploys)
//   - THE SHIPPED FEED ITSELF parses and matches the renderer's contract, and
//     no tracked text file carries an unresolved merge conflict (added
//     2026-08-20 — kb/cpl_todos.json sat on main with raw `<<<<<<<` markers in
//     it, committed by a PR where two parallel sessions had both rewritten the
//     feed, so the 📋 button had nothing valid to read on any tab; and the feed
//     writes `for`, which this module was reading as `who`, so every real item
//     grouped under a single "For Undefined" heading)
//
// Run from repo root: `npm test` (or `node tests/cpl_todos.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("cpl_todos.js", "utf8");
const vm = require("vm");

const FEED = {
  _as_of: "2026-06-12",
  _session: 47,
  _status: "test status line",
  items: [
    { id: "a-dash", who: "sam", tab: "dashboard", text: "Dashboard chore" },
    { id: "b-ccr", who: "sam", tab: "unified-courses", text: "CCR queue chore" },
    { id: "c-all", who: "fable", tab: "all", text: "Everywhere chore" },
    { id: "d-csr", who: "fable", tab: "canonical-subj4", text: "CSR engineering chore" },
  ],
};

// The shape the REAL feed uses (`for: "Sam"`), as opposed to FEED above which
// uses the early `who: "sam"` spelling. Both must group correctly.
const FEED_FOR = {
  _as_of: "2026-06-12",
  _status: "real-shape status line",
  items: [
    { id: "r-sam", for: "Sam", tab: "dashboard", text: "Curation chore" },
    { id: "r-fable", for: "Fable", tab: "dashboard", text: "Engineering chore" },
  ],
};

function boot(feedBody, preSeedLs) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <nav><button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="unified-courses">Common Course Reference</button>
    <button class="cpl-tab" data-tab="canonical-subj4">Common Subjects</button></nav>
  </body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" });
  dom.window.fetch = () => Promise.resolve({
    ok: feedBody !== null,
    json: () => Promise.resolve(feedBody),
  });
  if (preSeedLs) dom.window.localStorage.setItem("cplTodos.v1", JSON.stringify(preSeedLs));
  vm.runInContext(src, dom.getInternalVMContext(), { filename: "cpl_todos.js" });
  return dom;
}

const results = [];
const check = (name, cond) => results.push([name, !!cond]);

// Pre-seed a STALE feed date + a stale check-off for an id that exists today
// — pruning must drop it so it can't bleed into the fresh checklist.
const dom = boot(FEED, { "2026-06-11": { "a-dash": 1 } });
const { window } = dom;
const doc = window.document;
// A second panel in the shape the REAL feed uses; asserted in the same tick.
const dom2 = boot(FEED_FOR);

setTimeout(() => {
  try {
    const btn = doc.getElementById("cpl-todo-btn");
    check("To-Do button renders", !!btn);
    const badge = doc.getElementById("cpl-todo-badge");
    // current tab = dashboard (no hash): a-dash + c-all(all) = 2
    check("badge counts current-tab unchecked items (2: dashboard + all)", badge && badge.textContent === "2");

    btn.click();
    const panel = doc.getElementById("cpl-todo-panel");
    check("panel opens", panel.classList.contains("show"));
    const text = panel.textContent;
    check("For-Sam section renders", text.indexOf("For Sam") >= 0);
    check("For-Fable section renders", text.indexOf("For Fable") >= 0);
    check("status line renders", text.indexOf("test status line") >= 0);
    check("as-of + session render", text.indexOf("2026-06-12") >= 0 && text.indexOf("Session 47") >= 0);

    // Ordering: within For Sam, the dashboard item precedes the CCR item.
    check("current-tab item listed before other-tab item",
      text.indexOf("Dashboard chore") < text.indexOf("CCR queue chore"));

    // Chips: only the other-tab item gets one, labelled from the nav.
    const rows = [...panel.querySelectorAll(".cpl-todo-item")];
    const rowOf = (t) => rows.find((r) => r.textContent.indexOf(t) >= 0);
    check("other-tab item carries a nav chip with the nav's label",
      !!rowOf("CCR queue chore").querySelector(".cpl-todo-chip") &&
      rowOf("CCR queue chore").textContent.indexOf("Common Course Reference") >= 0);
    check("current-tab item has NO chip", !rowOf("Dashboard chore").querySelector(".cpl-todo-chip"));
    check("'all' item has NO chip", !rowOf("Everywhere chore").querySelector(".cpl-todo-chip"));

    // Stale-feed pruning: the 2026-06-11 record must be gone, so a-dash
    // renders UNchecked despite yesterday's check-off.
    const aCb = rowOf("Dashboard chore").querySelector("input");
    check("stale feed date pruned (item starts unchecked)", aCb.checked === false);
    const ls = JSON.parse(window.localStorage.getItem("cplTodos.v1") || "{}");
    check("stale localStorage key removed", !ls["2026-06-11"]);

    // Check-off: persists under today's date + badge decrements.
    aCb.checked = true;
    aCb.dispatchEvent(new window.Event("change"));
    const ls2 = JSON.parse(window.localStorage.getItem("cplTodos.v1") || "{}");
    check("check-off persisted under the feed date", ls2["2026-06-12"] && ls2["2026-06-12"]["a-dash"] === 1);
    check("badge decrements on check-off", badge.textContent === "1");

    // Survives a close + re-open.
    btn.click(); // close
    btn.click(); // re-open (re-renders from storage)
    const panel2 = doc.getElementById("cpl-todo-panel");
    const aRow2 = [...panel2.querySelectorAll(".cpl-todo-item")].find((r) => r.textContent.indexOf("Dashboard chore") >= 0);
    check("check-off survives re-open", aRow2.querySelector("input").checked === true && aRow2.classList.contains("done"));

    // Chip navigation: clicking the CCR chip routes the hash.
    const chip = [...panel2.querySelectorAll(".cpl-todo-chip")].find((c) => c.textContent.indexOf("Common Course Reference") >= 0);
    chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("chip click navigates the hash", window.location.hash === "#unified-courses");

    // hashchange re-badges for the new tab: unified-courses = b-ccr + c-all
    // (c-all unchecked, b-ccr unchecked) = 2.
    setTimeout(() => {
      try {
        check("badge re-counts for the new tab after hashchange", badge.textContent === "2");

        // Fail-soft: an empty feed renders no button.
        const dom2 = boot({ _as_of: "2026-06-12", items: [] }, null);
        setTimeout(() => {
          check("empty feed renders NO button", !dom2.window.document.getElementById("cpl-todo-btn"));
          finish();
        }, 60);
      } catch (e) {
        check("no exception in hashchange assertions: " + e.message, false);
        finish();
      }
    }, 60);
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
    finish();
  }

  // The real feed's `for` spelling groups into the same two labelled sections.
  {
    const p2 = dom2.window.document;
    const b2 = p2.getElementById("cpl-todo-btn");
    check("real-shape feed (`for`) renders the button", !!b2);
    b2.click();
    const t2 = p2.getElementById("cpl-todo-panel").textContent;
    check("real-shape feed groups under For Sam", t2.indexOf("For Sam") >= 0);
    check("real-shape feed groups under For Fable", t2.indexOf("For Fable") >= 0);
    check("real-shape feed never renders a For-Undefined section",
      t2.indexOf("Undefined") === -1);
    check("real-shape feed lists both items",
      t2.indexOf("Curation chore") >= 0 && t2.indexOf("Engineering chore") >= 0);
  }

  // ── The shipped feed + the repo's text surface ─────────────────────────────
  // These are static (no jsdom) but they live here because this is the file a
  // reader opens when the To-Do button misbehaves.
  const path = require("path");
  const ROOT = path.join(__dirname, "..");
  let feedRaw = "", feed = null, feedErr = "";
  try { feedRaw = fs.readFileSync(path.join(ROOT, "kb/cpl_todos.json"), "utf8"); } catch (e) { feedErr = String(e); }
  try { feed = JSON.parse(feedRaw); } catch (e) { feedErr = String(e); }
  check("kb/cpl_todos.json parses as JSON" + (feedErr ? " — " + feedErr : ""), !!feed);
  check("shipped feed carries _as_of + _status", !!(feed && feed._as_of && feed._status));
  check("shipped feed has a non-empty items array",
    !!(feed && Array.isArray(feed.items) && feed.items.length));
  const items = (feed && feed.items) || [];
  check("every item has id + tab + text",
    items.length > 0 && items.every((it) => it && it.id && it.tab && it.text));
  check("every item is addressed to Sam or Fable (the field is `for`)",
    items.length > 0 && items.every((it) => it && (it.for === "Sam" || it.for === "Fable")));
  check("item ids are unique", new Set(items.map((it) => it.id)).size === items.length);

  // A conflict committed into a served file breaks the page, silently for
  // anything the browser parses at runtime. Anchored at column 0 — a doc that
  // needs to SHOW a marker should indent it by one space.
  const SKIP_DIRS = new Set(["node_modules", ".git", "archive", "exports", "reports", "presentations"]);
  const SCAN_EXT = new Set([".js", ".json", ".html", ".css", ".md", ".py", ".yml", ".yaml", ".sql"]);
  const MAX_SCAN = 2 * 1024 * 1024;
  const conflicted = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full); continue; }
      if (!SCAN_EXT.has(path.extname(e.name))) continue;
      if (fs.statSync(full).size > MAX_SCAN) continue;
      if (/^(<{7}|={7}$|>{7})/m.test(fs.readFileSync(full, "utf8"))) {
        conflicted.push(path.relative(ROOT, full));
      }
    }
  })(ROOT);
  check("no tracked text file carries an unresolved merge conflict" +
    (conflicted.length ? " — " + conflicted.join(", ") : ""), conflicted.length === 0);

  finish();

  function finish() {
    let pass = 0;
    for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
    console.log("\n" + pass + "/" + results.length + " checks passed");
    process.exit(pass === results.length && results.length > 0 ? 0 : 1);
  }
}, 120);
