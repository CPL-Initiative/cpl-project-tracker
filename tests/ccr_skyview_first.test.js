// The Common Course Reference tab opens on SkyView (unified_courses.js).
//
// Sam, 2026-08-25: "SkyView is not the initial view when I open CCR — we had
// agreed to flip the view so it opens first and there is a button on SkyView to
// go to the CCR List View."
//
// WHY THE EARLIER FLIP MISSED HIM. Session 192 made SkyView the landing view
// INSIDE the prototype page (prototype/ccr_atlas_v1.html's boot()), while the
// COBI tab kept opening on the table with a launcher in the corner. Two
// surfaces, one sentence, and only one of them was flipped. This guards the
// COBI half, which is the one a curator actually opens.
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * THE LANDING VIEW. Opening the tab shows the map, not the table.
//
//   * THE WAY BACK. A view you cannot leave is worse than the one you started
//     on. Both directions are real, focusable buttons carrying words.
//
//   * ⭐ THE 7 MB IS DEFERRED. Opening this tab used to pull the whole
//     CPL_UNIFIED_COURSES payload immediately. The map is an iframe that
//     fetches its own data, so the table's payload must NOT load until someone
//     asks for the table. A flip that quietly kept loading both would be a
//     regression wearing a feature's clothes.
//
//   * ⚠ THE RETURNING CURATOR. Coming back from a magic link is intent to
//     curate, and curation happens in the list. Landing that person on a map
//     answers a question they did not ask.
//
//   * THE LIST'S OWN ELEMENTS SURVIVE. The shell WRAPS what the table builder
//     already owns (#uc-toolbar, #uc-table-wrap, …) rather than re-authoring
//     it; losing an id would break the builder silently, one render later.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_first.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const src = fs.readFileSync("unified_courses.js", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");

// The CCR pane as index.html actually ships it — the ids the shell moves are
// the real ones, so a rename in the markup fails here instead of in a browser.
function paneHtml() {
  const i = indexHtml.indexOf('id="tab-unified-courses"');
  const pane = indexHtml.slice(i, indexHtml.indexOf('<!-- /main-container for Unified Courses tab -->', i));
  return "<div " + pane;
}

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${paneHtml()}</div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  const loaded = [];
  window.CPL_TABS = {
    onActivate: function (tab, fn) { window.__activate = fn; },
    loadScript: function (f, g, cb) { loaded.push(f); if (opts.dataArrives) { window[g] = { rows: [] }; cb && cb(); } },
    current: function () { return "unified-courses"; },
  };
  window.__loaded = loaded;
  window.eval(src);
  return window;
}
const q = (w, s) => w.document.querySelector(s);
const vbtns = (w) => [...w.document.querySelectorAll(".uc-vbtn")].map((b) => b.textContent);
// ⚠ NEVER DEREFERENCE A POSSIBLY-ABSENT ELEMENT INLINE. A missing node throws,
// the throw stops the file, and every check below it goes UNREPORTED while the
// exit code says only "something failed". That is the S190 `exit=0 was my
// trailing grep` shape one layer in, and it bit this session three times before
// these existed. A missing element is a FAILURE, reported and stepped over.
const disp = (w, sel) => { const e = q(w, sel); return e ? e.style.display : "\u2205 no element"; };
const attr = (w, sel, a) => { const e = q(w, sel); return e ? (e.getAttribute(a) || "") : ""; };

(function () {
  // ── (A) static ───────────────────────────────────────────────────────────
  check("(A) the tab exposes one door for the view flip", /window\.CPL_CCR_VIEW/.test(src));
  check("(A) activation no longer loads the table payload straight away",
    !/onActivate\("unified-courses",\s*function \(\) \{\s*CPL_TABS\.loadScript/.test(src),
    "activation still calls loadScript directly");
  check("(A) the shell is injected at runtime, not written into the markup",
    indexHtml.indexOf("uc-viewseg") === -1 && /uc-viewseg/.test(src),
    "found uc-viewseg in index.html — that would need a Rule 4 mirror");

  // ── (B) the landing view ─────────────────────────────────────────────────
  {
    const w = boot();
    check("(B) the tab registers an activation handler", typeof w.__activate === "function");
    w.__activate();
    check("(B) ⭐ the tab opens on SkyView", w.CPL_CCR_VIEW.current() === "map");
    check("(B) the map pane is showing", disp(w, "#uc-map-pane") === "", disp(w, "#uc-map-pane"));
    check("(B) the list pane is hidden", disp(w, "#uc-list-pane") === "none", disp(w, "#uc-list-pane"));
    check("(B) ⭐ the map is an iframe pointing at the SERVED SkyView page",
      !!q(w, "#uc-map-pane iframe") && q(w, "#uc-map-pane iframe").src.indexOf("prototype/skyview.html") >= 0,
      q(w, "#uc-map-pane iframe") ? q(w, "#uc-map-pane iframe").src : "no iframe");
    check("(B) the frame is named for a screen reader",
      /SkyView/.test(attr(w, "#uc-map-pane iframe", "title")), attr(w, "#uc-map-pane iframe", "title"));
    check("(B) ⭐ the table's payload has NOT been fetched", w.__loaded.length === 0,
      w.__loaded.join(","));

    // ── (C) the way back, both directions ──────────────────────────────────
    const labels = vbtns(w).join(" | ");
    check("(C) ⭐ both views are offered as words, not glyphs",
      /SkyView map/.test(labels) && /CCR list view/.test(labels), labels);
    check("(C) the buttons say which one is current",
      [...w.document.querySelectorAll(".uc-vbtn")].filter((b) => b.getAttribute("aria-pressed") === "true").length === 1);
    w.CPL_CCR_VIEW.set("list");
    check("(C) ⭐ switching shows the list",
      disp(w, "#uc-list-pane") === "" && disp(w, "#uc-map-pane") === "none",
      "list=" + disp(w, "#uc-list-pane") + " map=" + disp(w, "#uc-map-pane"));
    check("(C) ⭐ …and only THEN is the 7 MB payload requested",
      w.__loaded.indexOf("unified_courses_data.js") >= 0, w.__loaded.join(","));
    w.CPL_CCR_VIEW.set("map");
    check("(C) switching back shows the map again", disp(w, "#uc-map-pane") === "", disp(w, "#uc-map-pane"));
    check("(C) the payload is not requested twice", w.__loaded.length === 1, w.__loaded.join(","));
  }

  // ── (D) the returning curator ────────────────────────────────────────────
  {
    const w = boot();
    w.CPL_CCR_VIEW._setAuthReturn(true);
    w.CPL_CCR_VIEW.open();
    check("(D) ⭐ a curator returning from a magic link lands on the LIST",
      w.CPL_CCR_VIEW.current() === "list");
    w.CPL_CCR_VIEW.open();
    check("(D) …and the next ordinary open is back to the map (it is a one-shot, not a mode)",
      w.CPL_CCR_VIEW.current() === "map");
  }

  // ── (E) the list's own elements survive the wrap ─────────────────────────
  {
    const w = boot();
    w.__activate();
    ["uc-intro", "uc-toolbar", "uc-summary", "uc-table-wrap"].forEach(function (k) {
      const el = w.document.getElementById(k) || w.document.querySelector("." + k);
      check("(E) " + k + " survives inside the list pane",
        !!el && !!el.closest("#uc-list-pane"), el ? "outside the pane" : "gone");
    });
    check("(E) the corner launcher is hidden while the map is on screen",
      disp(w, ".uc-skyview") === "none", disp(w, ".uc-skyview"));
    w.CPL_CCR_VIEW.set("list");
    check("(E) …and offered again on the list, where it means something",
      disp(w, ".uc-skyview") === "", disp(w, ".uc-skyview"));
  }

  // ── (F) it does not double-build ─────────────────────────────────────────
  {
    const w = boot();
    w.__activate(); w.__activate(); w.__activate();
    check("(F) re-activating the tab does not stack shells",
      w.document.querySelectorAll(".uc-viewseg").length === 1);
    check("(F) …nor stack iframes", w.document.querySelectorAll("#uc-map-pane iframe").length === 1);
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
