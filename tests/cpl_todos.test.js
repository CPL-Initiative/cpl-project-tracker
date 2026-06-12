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

  function finish() {
    let pass = 0;
    for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
    console.log("\n" + pass + "/" + results.length + " checks passed");
    process.exit(pass === results.length && results.length > 0 ? 0 : 1);
  }
}, 120);
