/* ===========================================================================
   a11y.config.js — WHAT this project ships, for `npm run a11y`
   ---------------------------------------------------------------------------
   The engine (scripts/a11y.js) is project-agnostic and knows nothing about
   COBI. THIS file is the only part another project rewrites: copy the script,
   write your own targets, keep the one command. That split is the whole point
   of the file existing — Sam, 2026-09-04: "use the simplest approach that sets
   us up for continued long term use on all projects."

   Adding a view costs a config entry — or, where an app routes its own views,
   NOTHING. `discover` reads the routes out of the running page, so COBI's next
   tab is measured the day it ships and no one has to remember this file.
   ⚠️ That is deliberate, and it is the reason the sweep can be trusted as a
   sweep: a hand-maintained list of 37 tabs is a list that silently stops being
   37, and the tab it stops at is the new one nobody has audited.

   Per target:
     file            path under `root`, served over http (see the engine header)
     title           what the run prints
     routes          [{hash, name}] — explicit views inside one document
     discover        {selector, attr} — read more routes from the loaded page
     widths          override the default sweep (a 38-route target does not
                     need nine widths to find a broken breakpoint)
     mayHideBelow    selectors ALLOWED to vanish at narrow widths. Everything
                     else a breakpoint hides is REPORTED — that is how "the
                     whole side panel disappears on a phone" stops looking
                     like a design choice.
     targetSizeExempt  a documented WCAG 2.2 SC 2.5.8 exception. Never a skip:
                     the `equivalent` route must exist and clear 24px itself,
                     so deleting it turns the exemption back into a failure.
     seed / keyboard   functions; run in Playwright, not in the page.
   =========================================================================== */
module.exports = {
  /* Served over http from the repo root — same-origin is load-bearing, not
     tidiness; the engine header says why. */
  root: ".",

  /* The default sweep. 560/561 straddle the single-column breakpoint the
     presentation rules name, so a rule that fires one pixel late shows up. */
  widths: [320, 360, 390, 430, 560, 561, 768, 1024, 1440],

  /* Sheets this project links from another origin. CORS makes them unreadable
     to the reduced-motion check, which FAILS on an unreadable sheet rather than
     quietly seeing less of the page — so the ones that will never be readable
     are named here, with why, instead of being silently tolerated. Anything not
     on this list still fails. */
  crossOriginSheets: [
    { match: "fonts.googleapis.com", why: "web font faces only — declares no animation" },
  ],

  targets: {

  sierra: {
    file: "sierra/index.html",
    title: "Sierra (public CPL assistant)",
    mayHideBelow: [],
    /* The log is made focusable by sierra.js only while it overflows. Proving
       that means growing it and asking, not reading the markup. */
    keyboard: async (page) => {
      const out = [];
      out.push(await page.evaluate(() => {
        const log = document.getElementById("s-log");
        return {
          name: "a filled conversation log is focusable",
          ok: log.scrollHeight > log.clientHeight + 1 && log.getAttribute("tabindex") === "0",
          detail: "overflows=" + (log.scrollHeight > log.clientHeight + 1) +
                  ", tabindex=" + log.getAttribute("tabindex"),
        };
      }));
      /* ⚠️ REGRESSION GUARD, NOT PROOF OF THE FIX — and the reason is worth
         knowing before you trust any Chromium a11y harness.

         Chromium 127+ ships "keyboard-focusable scrollers": a div that ACTUALLY
         OVERFLOWS is focusable with no tabindex at all (measured here on 141 —
         an overflowing div focuses, an identical non-overflowing one does not).
         So this check passes against the pre-fix page, and so did an earlier
         `document.activeElement === log` version. THE MEASURING BROWSER HIDES
         THE DEFECT. Not every engine does this, and Chromium's implicit
         focusability gives the region no role and no accessible name either, so
         the explicit tabindex is still the correct fix — it is just not
         something Chrome can be asked to demonstrate.

         The fix proof is the check above (tabindex is present exactly while the
         log overflows) and the per-viewport scroller check, which read the
         markup. This one guards against the scrolling itself breaking. */
      await page.evaluate(() => {
        const log = document.getElementById("s-log");
        log.scrollTop = 0;
        log.focus();
      });
      await page.keyboard.press("End");
      await page.waitForTimeout(200);
      out.push(await page.evaluate(() => {
        const log = document.getElementById("s-log");
        return {
          name: "a keypress scrolls the log [regression guard — Chromium auto-focuses scrollers]",
          ok: log.scrollTop > 0,
          detail: "scrollTop after End = " + Math.round(log.scrollTop) +
                  "px of " + Math.round(log.scrollHeight - log.clientHeight) + "px",
        };
      }));
      out.push(await page.evaluate(() => {
        const aud = document.getElementById("s-audience");
        return {
          name: "the audience picker is a group, not a false radiogroup",
          ok: aud.getAttribute("role") === "group",
          detail: 'role="' + aud.getAttribute("role") + '"',
        };
      }));
      return out;
    },
    // The chat log grows from empty, so an unseeded page hides most of what we
    // came to measure. Seed ENOUGH turns to make .s-log actually overflow — a
    // scroll container that does not scroll cannot be tested for whether it is
    // keyboard reachable, and one seeded message never overflowed.
    seed: async (page) => {
      await page.evaluate(() => {
        const log = document.getElementById("s-log");
        if (!log) return;
        const table = '<table><thead><tr><th>Credential</th><th>Course</th>' +
          '<th>Units</th><th>College</th><th>C-ID</th></tr></thead><tbody>' +
          '<tr><td>FIW Orientation</td><td>WELD 100 Introduction to Welding Technology</td>' +
          '<td>3.0</td><td>Cerritos College</td><td>&mdash;</td></tr>' +
          '<tr><td>Post Tensioning 3</td><td>WELD 244 D1.1 Code Clinic</td>' +
          '<td>2.0</td><td>Santa Ana College</td><td>&mdash;</td></tr></tbody></table>';
        for (let i = 0; i < 6; i++) {
          const you = document.createElement("div");
          you.className = "s-msg s-user";
          you.innerHTML = '<div class="s-bubble"><p>Seeded question ' + (i + 1) +
            ': I have a journey worker license as an Iron and Steel worker. ' +
            'What CPL can I get here?</p></div>';
          log.appendChild(you);
          const her = document.createElement("div");
          her.className = "s-msg";
          her.innerHTML = '<div class="s-avatar" aria-hidden="true"></div>' +
            '<div class="s-bubble"><p>Seeded answer ' + (i + 1) + ' for layout ' +
            'measurement, long enough to wrap on a narrow viewport and push the ' +
            'log past its own height.</p>' + (i === 0 ? table : "") + '</div>';
          log.appendChild(her);
        }
        // sierra.js REMOVES the starter chips after the first question
        // (`suggestEl.remove()`), so the steady state of this page is a log with
        // no focusable child. Measuring the pristine page hides that: the chips
        // made the log look keyboard-reachable at exactly the moment it had
        // nothing to scroll, and the reachability vanished the moment it did.
        const sug = document.getElementById("s-suggest");
        if (sug) sug.remove();
        log.scrollTop = log.scrollHeight;
      });
    },
  },
  "veteran-map": {
    file: "veteran-sprint-map/ca_cpl_map_selfcontained.html",
    title: "Veteran Sprint map (colleges x installations)",
    mayHideBelow: [],
    /* WCAG 2.2 SC 2.5.8 has an "Essential" and an "Equivalent" exception, and
       the map pins are both. A pin's position and size ENCODE geography: at a
       390px viewport the whole state is ~390px wide, so growing 159 markers to
       24px would make the Los Angeles basin one solid blob and MISSTATE where
       the colleges are. And every one of them is reachable another way.

       The exemption is not a skip. `equivalent` must exist and must itself pass
       the 24px floor, so if anyone ever deletes the directory lists — the thing
       that makes the pins optional — this stops being exempt and the run fails.
       Measured: 115 college rows + 44 installation rows at 362x28 on a phone. */
    targetSizeExempt: [{
      selector: "#g-colleges .mk, #g-bases .mk",
      reason: "geographic pin — size and position are essential (SC 2.5.8 Essential)",
      /* `revealBy` is part of the claim, not a convenience: the equivalent
         route is behind a tab, so saying so is what makes the exemption
         checkable. A first cut asserted the lists directly, measured them
         while their panel was display:none, and reported the exemption broken
         — the honest failure, and the fix is to state the path. */
      equivalent: [
        { sel: "#list-col li", revealBy: '.tab[data-tab="colleges"]', what: "college directory" },
        { sel: "#list-base li", revealBy: '.tab[data-tab="bases"]', what: "installation directory" },
      ],
    }],
    /* Shape is not behaviour. tabindex on a <g> proves it can be focused; only
       pressing Enter proves it DOES anything. Every marker and every directory
       row was mouse-only before this run, so these are the checks that say the
       fix landed rather than that the attributes did. */
    keyboard: async (page) => {
      const out = [];
      out.push(await page.evaluate(() => {
        const mk = document.querySelector("#g-colleges .mk");
        if (!mk) return { name: "a college pin is focusable", ok: false, detail: "no marker found" };
        mk.focus();
        return {
          name: "a college pin is focusable and named",
          ok: document.activeElement === mk && !!mk.getAttribute("aria-label"),
          detail: "label=" + (mk.getAttribute("aria-label") || "(none)").slice(0, 46),
        };
      }));
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
      out.push(await page.evaluate(() => {
        const h = document.querySelector("#detail h2");
        return {
          name: "Enter on a pin renders that college's detail",
          ok: !!h && h.textContent.trim().length > 0,
          detail: h ? h.textContent.trim().slice(0, 40) : "detail pane still empty",
        };
      }));
      out.push(await page.evaluate(() => {
        const t = document.querySelector('.tab[data-tab="colleges"]');
        if (t) t.click();
        const li = document.querySelector("#list-col li");
        if (!li) return { name: "a directory row is operable", ok: false, detail: "no rows" };
        li.focus();
        const focused = document.activeElement === li;
        li.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        const h = document.querySelector("#detail h2");
        return {
          name: "a directory row is focusable and Enter selects it",
          ok: focused && !!h && h.textContent.trim().length > 0,
          detail: "focusable=" + focused + ", detail=" + (h ? h.textContent.trim().slice(0, 30) : "empty"),
        };
      }));
      return out;
    },
  },

  /* ── COBI, the monolith ──────────────────────────────────────────────────
     37 tab panes behind hash routes in one document, and the reason this whole
     file exists. Sam, 2026-09-04: "I can't seem to get claude.md or memory to
     reliably enforce this when we are building day to day and I often forget to
     remind you." A rule states a standard; only a measurement detects a
     violation — so the standard gets an instrument, and the instrument covers
     EVERY view rather than the one somebody remembered to name.

     The routes are read from the nav at runtime (tabs.js derives its own
     VALID_TABS the same way, from the same buttons), so this entry never goes
     stale. Two widths, not nine: a 38-route target at nine widths is a
     ten-minute run nobody starts, and a breakpoint that breaks breaks on a
     phone. The nine-width sweep stays available per target for the pages where
     one pixel matters. */
  cobi: {
    file: "index.html",
    title: "COBI — every tab in the monolith",
    /* No explicit routes: `dashboard` is a nav button like every other tab, so
       discovery already returns it. Listing it here as `hash: ""` produced a
       SECOND route with the same name — see the dedupe note in the engine. */
    discover: { selector: "nav.cpl-tabs .cpl-tab[data-tab]", attr: "data-tab" },
    widths: [390, 1440],
    mayHideBelow: [
      /* The rail collapses to a drawer below the sidebar breakpoint and the
         drawer button opens it — a duplicate affordance, not a lost one. */
      ".cpl-sidebar", ".cpl-sidebar *",
      /* Tab panes are display:none by definition: 36 of the 37 are hidden at
         every moment, and the router is what hides them, not a breakpoint. */
      ".cpl-tab-pane", ".cpl-tab-pane *",
    ],
  },

  /* ── SkyView ─────────────────────────────────────────────────────────────
     The built artifact, not its prototype/ccr_atlas_v1.html source: what ships
     is what gets measured. It opens full-window from the CCR side menu, so it
     is a first-class view even though it lives under prototype/. */
  skyview: {
    file: "prototype/skyview.html",
    title: "SkyView — the Common Course Reference as a map",
    /* The hash names the view (ccr_universe.js __ccrRoute): the map alone,
       the map with its panes, and the workspace's three toggles. */
    routes: [
      { hash: "skyview", name: "skyview" },
      { hash: "comprehensive", name: "comprehensive" },
      { hash: "disciplines", name: "disciplines" },
      { hash: "subjects", name: "subjects" },
      { hash: "esl", name: "esl" },
      { hash: "how", name: "how" },
      /* The course outline of record (Sam's ruling, 2026-09-06). A real id, not
         a placeholder: the layers render from the member roster and the
         description shards, so a route naming nothing measures an error page. */
      { hash: "outline/WELD M1109", name: "outline" },
      /* One discipline's work surface — the view double-click used to strand
         the reader in, now routable. */
      { hash: "work/Welding", name: "work" },
    ],
    widths: [390, 768, 1440],
    mayHideBelow: [
      // The detail panel opens hidden by design (Sam, 2026-09-04: "I want all
      // the real estate for the universe view") and the legend is foldable.
      ".u-inspector", ".u-inspector *", ".u-foot", ".u-foot *",
    ],
  },

  /* ── CPL Fact Sheet ──────────────────────────────────────────────────────
     fact-sheet/check_mobile_layout.js asserts ITS statewide grid; this asks
     only what every page must answer. Both, because the first instrument in
     this repo to be pointed at one page found four defects nine jsdom suites
     had missed, and neither instrument subsumes the other. */
  "fact-sheet": {
    file: "fact-sheet/index.html",
    title: "CPL Fact Sheet (public)",
    mayHideBelow: [],
  },
  },
};
