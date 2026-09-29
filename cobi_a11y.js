/*
 * COBI — the accessibility baseline that belongs to the whole app.
 *
 * WHERE THIS CAME FROM. `npm run a11y` (scripts/a11y.js + a11y.config.js) walks
 * every one of COBI's 38 hash routes in Chromium and measures what jsdom cannot
 * see. Its first run, 2026-09-04, found defects that were not any tab's: they
 * were in the chrome every tab paints, so each one was 38 findings wearing one
 * hat. This file is where that kind of fix goes.
 *
 * WHY A JS FILE AND NOT THE <style> BLOCKS. Two reasons, and the second is the
 * load-bearing one:
 *   1. Rule 4 — CPL_Dashboard.html and index.html must stay byte-identical, so
 *      every CSS edit there is two edits. A script is one file, listed twice.
 *   2. ORDER. A runtime-injected sheet lands after every static one, so it wins
 *      on cascade order without an `!important` arms race and without having to
 *      sit downstream of a generator that rewrites whole sections (Rule 1).
 *
 * WHAT IS *NOT* HERE. A defect that belongs to one tab is fixed in that tab.
 * This file is only for what is true of every view — otherwise it becomes the
 * override pile that hides where the real rule lives.
 *
 * STATIC — NOT a daily-cron artifact. <script>-loaded in BOTH HTMLs (Rule 4).
 */
(function () {
  'use strict';

  var CSS = [
    /* ── prefers-reduced-motion (WCAG 2.3.3; First Light names it explicitly) ──
     * COBI declared five animations and honoured the preference in none of
     * them: two KPI progress bars grow on every render, and the Where-To jump
     * flashes the card it lands on and pulses the tab it came from. A vestibular
     * reader who has asked their OS to stop moving things got all five.
     *
     * ⚠️ It sweeps `*` on purpose rather than naming those five. A named list
     * is a list that goes stale the first time someone adds a sixth animation,
     * and nobody adding one thinks about this file. The near-zero duration
     * (rather than `none`) keeps transitionend/animationend firing, so handlers
     * that wait for one still run — a hard stop silently breaks them. */
    '@media (prefers-reduced-motion: reduce){',
    '  *,*::before,*::after{',
    '    animation-duration:0.001ms !important;',
    '    animation-iteration-count:1 !important;',
    '    transition-duration:0.001ms !important;',
    '    scroll-behavior:auto !important;',
    '  }',
    '}'
  ].join('\n');

  function inject() {
    if (document.getElementById('cobi-a11y-baseline')) return;
    var st = document.createElement('style');
    st.id = 'cobi-a11y-baseline';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
