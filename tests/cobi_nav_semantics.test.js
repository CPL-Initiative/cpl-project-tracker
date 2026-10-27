// COBI's side menu is NAVIGATION, not a tablist (S494).
//
// axe-core 4.10.2 (critical, aria-required-children), on every COBI route: the menu
// declared role="tablist", and a tablist may own only tabs. It holds tab buttons,
// the group heads (Workplan, Funding, ...), the section links under the open tab
// (.cpl-sidebar-toc) and the external launchers, so a screen reader announced a
// tab set that was not one. The panes said role="tabpanel" and named themselves by
// their own id. The menu changes pages by hash (#tab/section), which is what
// navigation is: a <nav> with a label, plain buttons, and aria-current="page" on
// the open one. The look keys on .active, so nothing painted changes.
//
// The pin that rots: a new tab copied from an old line brings role="tab" back.
//
// Run: node tests/cobi_nav_semantics.test.js
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const cpl = fs.readFileSync(path.join(ROOT, "CPL_Dashboard.html"), "utf8");
const tabsSrc = fs.readFileSync(path.join(ROOT, "tabs.js"), "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

check("Rule 4: CPL_Dashboard.html === index.html", idx === cpl);

const doc = new JSDOM(idx).window.document;
const nav = doc.querySelector("nav.cpl-tabs");
check("the side menu is a labelled <nav>", nav && nav.getAttribute("aria-label"));
check("⭐ the side menu declares no tablist role", nav && !nav.hasAttribute("role"),
  nav && nav.getAttribute("role"));
const tabRole = doc.querySelectorAll('nav.cpl-tabs [role="tab"]');
check("⭐ no menu button declares role=\"tab\" (a new tab copied from an old line)",
  tabRole.length === 0, [...tabRole].map((b) => b.getAttribute("data-tab")).join(", "));
const selected = doc.querySelectorAll("nav.cpl-tabs .cpl-tab[aria-selected]");
check("no menu button carries aria-selected (allowed only on a tab)", selected.length === 0,
  [...selected].map((b) => b.getAttribute("data-tab")).join(", "));
const current = doc.querySelectorAll('nav.cpl-tabs .cpl-tab[aria-current="page"]');
const active = doc.querySelectorAll("nav.cpl-tabs .cpl-tab.active");
check("exactly the active button is the current page as shipped",
  current.length === 1 && active.length === 1 && current[0] === active[0]);
const selfNamed = [...doc.querySelectorAll(".cpl-tab-pane")].filter((p) =>
  p.getAttribute("role") === "tabpanel" || (p.id && p.getAttribute("aria-labelledby") === p.id));
check("no pane is a tabpanel or names itself by its own id", selfNamed.length === 0,
  selfNamed.map((p) => p.id).join(", "));

// tabs.js keeps aria-current on the open tab as the hash moves.
check("tabs.js sets aria-current on the open tab and clears it elsewhere",
  /setAttribute\('aria-current', 'page'\)/.test(tabsSrc) && /removeAttribute\('aria-current'\)/.test(tabsSrc) &&
  !/aria-selected/.test(tabsSrc));

let fail = 0;
for (const [ok, name] of results) { console.log(`${ok ? "  ok " : "  FAIL"} ${name}`); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} checks passed`);
process.exit(fail ? 1 : 0);
