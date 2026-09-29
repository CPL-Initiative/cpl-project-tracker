// cpl_theme.js — THE one theme control for COBI.
//
// STATIC asset (like first_light.js / cobi_brand.js): it owns the theme state,
// injects its own CSS and mounts its own control, so the daily regen cannot
// disturb it and there is no Rule-4 <style> mirror to maintain — only the
// <script src="cpl_theme.js"> tag lives in both HTMLs.
//
// ⚠️ IT IS LOADED IN <head>, BEFORE THE BODY, ON PURPOSE. The attribute has to
// be on <html> before the first paint or a dark reader gets a full-page white
// flash on every navigation. Everything above `mount()` therefore runs at parse
// time and touches only documentElement; the control itself waits for the DOM.
//
// ── WHY ONE CONTROL, AND WHY THIS SHAPE (Sam, 2026-09-08) ───────────────────
// "make sure we have a dark mode selector in the COBI header ... ensure that it
// sets all tabs and windows using that one control."
//
// Before this file there were FOUR independent answers to "is it dark", which is
// exactly the mess the ask names:
//   * cpl_memory.js  — its own 🌙/☀️ button, writing data-theme, remembering
//                      NOTHING (a reload lost the choice, and it disagreed with
//                      every other tab while it lasted);
//   * map_cleanup_views.js, map_data_quality.js — correct already: the
//                      media-query + :root[data-theme] triple below;
//   * our_process.js — @media (prefers-color-scheme:dark) ALONE, so it followed
//                      the OS and could not be told otherwise. An OS-dark reader
//                      got four dark tabs inside a light COBI.
// The control is now here and only here; those files became its clients.
//
// ── THE CONTRACT every consumer keys on ─────────────────────────────────────
// It is the one this repo already used in three tabs, not a new invention:
//
//   <html>            no data-theme → follow the OS (prefers-color-scheme)
//   <html data-theme="light">       → light, whatever the OS says
//   <html data-theme="dark">        → dark,  whatever the OS says
//
// So a themed component writes THREE rules, in this order:
//   @media (prefers-color-scheme:dark){ .x{ …dark… } }
//   :root[data-theme="light"] .x{ …light… }
//   :root[data-theme="dark"]  .x{ …dark… }
// Order and specificity both matter: the explicit selectors are (0,2,1) against
// the media query's (0,1,0) and come later, so an explicit choice always beats
// the OS. Dropping either explicit rule reintroduces our_process.js's bug.
//
// ⚠️ THREE STATES, NOT TWO, and System is the default. Two states would have
// forced a choice on every reader on their first visit, and forcing light on an
// OS-dark reader is a REGRESSION against the four tabs that already honored the
// OS. The repo honors prefers-reduced-transparency and prefers-contrast "for
// real" (the head CSS says so); prefers-color-scheme is the same promise.
//
// ── ALL WINDOWS ─────────────────────────────────────────────────────────────
// The `storage` event fires in every OTHER same-origin document when a value
// changes — that is what makes a second COBI window, or SkyView open beside it,
// follow the one control without polling. It deliberately does NOT fire in the
// window that wrote the value, so apply() is called directly there too.
(function () {
  "use strict";

  var KEY = "cpl_theme";              // "system" | "light" | "dark"
  var EVENT = "cpl:themechange";      // for consumers that PAINT rather than style
  // ⚠️ An ARRAY, not an object map. `VALID[v]` on an object literal inherits
  // from Object.prototype, so a stored value of "constructor" (or "toString")
  // passes validation and lands as data-theme="constructor". indexOf has no
  // prototype chain to fall through.
  var VALID = ["system", "light", "dark"];
  function valid(v) { return VALID.indexOf(v) !== -1; }

  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme:dark)")
                             : { matches: false };

  function read() {
    var v;
    try { v = localStorage.getItem(KEY); } catch (e) { v = null; }
    return valid(v) ? v : "system";
  }

  // The EFFECTIVE theme — what the reader actually sees. "system" resolves
  // through the media query, which is also why a consumer must never read the
  // attribute alone and assume light when it is absent.
  function effective(choice) {
    var c = choice || read();
    return c === "system" ? (mq.matches ? "dark" : "light") : c;
  }

  // Applies the CHOICE to <html>. System removes the attribute rather than
  // writing the resolved value: the absent state is what the media queries in
  // every themed component are keyed to, and writing "light" there would pin a
  // reader whose OS flips at sunset.
  function apply(choice) {
    var c = valid(choice) ? choice : read();
    if (c === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", c);
    // Native chrome — form controls, scrollbars, the canvas behind the page —
    // is painted by the UA, not by our tokens, and follows this and nothing
    // else. Without it a dark COBI keeps white scrollbars and white <select>
    // popups. Explicit on both branches so an explicit light choice on a
    // dark OS gets light chrome too.
    root.style.colorScheme = effective(c);
    return c;
  }

  function set(choice) {
    var c = apply(choice);
    try { localStorage.setItem(KEY, c); } catch (e) { /* private mode: session-only */ }
    broadcast(c);
    return c;
  }

  function broadcast(c) {
    var detail = { choice: c, theme: effective(c) };
    try { window.dispatchEvent(new CustomEvent(EVENT, { detail: detail })); }
    catch (e) {
      // CustomEvent constructor is absent on very old engines; the styling half
      // of the theme still works there, only repaint-on-change is lost.
      try {
        var ev = document.createEvent("CustomEvent");
        ev.initCustomEvent(EVENT, false, false, detail);
        window.dispatchEvent(ev);
      } catch (e2) { /* nothing further to do */ }
    }
  }

  // ⚠️ BEFORE FIRST PAINT. Not in init(), not on DOMContentLoaded.
  apply(read());

  /* ── the control ─────────────────────────────────────────────────────────
   * A native <select>. Sam asked for a "selector" and this is literally one:
   * it is keyboard-operable, screen-reader-labelled and 24px-tall for free,
   * where a hand-rolled menu is three bugs waiting. It also states its current
   * value without being opened, which a cycling button cannot.
   *
   * PLAIN WORDS, NOT GLYPHS (presentation rules): the options are System,
   * Light and Dark with a visible "Theme" label beside them — no ☀/🌙, which
   * is what cpl_memory.js's retired toggle wore.
   */
  function ensureCss() {
    if (document.getElementById("cpl-theme-css")) return;
    var s = document.createElement("style");
    s.id = "cpl-theme-css";
    s.textContent = [
      // Sits in the utility cluster, before About (order:0). Matches
      // .cobi-util-link's type scale exactly so the strip reads as one set —
      // the "clean and uniform" header rule from Session 34.
      ".cobi-theme{order:0;position:relative;display:inline-flex;align-items:center;gap:.3rem;min-width:0;}",
      ".cobi-theme > span{font-family:'Source Sans 3',Arial,sans-serif;font-size:.74rem;",
      "font-weight:600;color:var(--text-muted,#5C5C55);white-space:nowrap;}",
      // min-height 24px is WCAG 2.2 SC 2.5.8 (target size) — the same floor the
      // utility links carry. A bare <select> renders ~19px and would have been
      // one more sub-24 fault on all 38 tabs, which is precisely the shared-chrome
      // failure S243 spent a run on.
      ".cobi-theme select{font-family:'Source Sans 3',Arial,sans-serif;font-size:.74rem;",
      "font-weight:600;color:var(--text-muted,#5C5C55);background:transparent;",
      // ⚠️ BORDERLESS AT REST, to match .cobi-util-link beside it. The strip
      // went low-key on 2026-09-04 (Sam: "remove the formatting around the
      // text ... so it's just a low-key part of the header"), and a bordered
      // control next to borderless ones is the inconsistency, not the fix.
      // The border is kept in the box model as transparent so nothing shifts
      // when it appears on hover; the drawn caret carries the affordance at
      // rest, and :focus-visible still paints the global focus ring.
      "border:1px solid transparent;border-radius:4px;",
      "padding:.15rem 1.05rem .15rem .3rem;min-height:24px;box-sizing:border-box;cursor:pointer;",
      "-webkit-appearance:none;-moz-appearance:none;appearance:none;",
      "transition:color .15s,border-color .15s;}",
      // The disclosure caret is DRAWN — a bordered triangle on the label, not a
      // ▾ typed into the button's text. Two reasons, both rules: a typed caret
      // is a glyph in the accessible name and gets read out, and a background
      // SVG has to hard-code its stroke, which then stays dark-gray on the night
      // ground. currentColor inherits the label's color, so it is correct in
      // both themes with no second rule. It hangs off the LABEL because a
      // <select> does not render pseudo-elements.
      ".cobi-theme::after{content:\"\";position:absolute;right:.36rem;top:50%;",
      "width:0;height:0;border-left:3.5px solid transparent;border-right:3.5px solid transparent;",
      "border-top:4px solid currentColor;color:var(--text-muted,#5C5C55);",
      "transform:translateY(-2px);pointer-events:none;}",
      ".cobi-theme:hover::after{color:var(--cobalt,#0047AB);}",
      ".cobi-theme select:hover{color:var(--cobalt,#0047AB);border-color:var(--border,rgba(28,28,26,.14));}",
      // The options themselves are painted by the UA from color-scheme; giving
      // them an explicit pair keeps Firefox's popup readable in dark too.
      ".cobi-theme option{background:var(--surface-opaque,#fff);color:var(--text-body,#3A3A36);}",
      // Below the single-column breakpoint the label word is the first thing
      // worth dropping: the select still names itself to a screen reader
      // through aria-label, so nothing is lost but ink.
      "@media (max-width:560px){.cobi-theme > span{display:none;}}"
    ].join("");
    document.head.appendChild(s);
  }

  function mount() {
    ensureCss();
    var host = document.querySelector(".cobi-utility");
    if (!host || host.querySelector(".cobi-theme")) return;

    var wrap = document.createElement("label");
    wrap.className = "cobi-theme";

    var word = document.createElement("span");
    word.textContent = "Theme";
    wrap.appendChild(word);

    var sel = document.createElement("select");
    sel.id = "cobiTheme";
    // The <label> names it for a mouse user; aria-label carries the name for a
    // screen reader at narrow widths, where the word above is display:none and
    // a label with no rendered text names nothing.
    sel.setAttribute("aria-label", "Theme");
    sel.title = "Light, dark, or follow this device — applies to every COBI tab and window";
    [["system", "System"], ["light", "Light"], ["dark", "Dark"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      sel.appendChild(opt);
    });
    sel.value = read();
    sel.addEventListener("change", function () { set(sel.value); });
    wrap.appendChild(sel);
    host.appendChild(wrap);
  }

  // Another window changed it. `storage` gives us the new value directly; a
  // null newValue means the key was cleared, which reads as System.
  window.addEventListener("storage", function (e) {
    if (!e || e.key !== KEY) return;
    var c = valid(e.newValue) ? e.newValue : "system";
    apply(c);
    var sel = document.getElementById("cobiTheme");
    if (sel) sel.value = c;
    broadcast(c);
  });

  // The OS flipped (sunset, or a manual switch) while we are following it. Only
  // the effective theme moved, not the choice — so the select does not change,
  // but color-scheme and any canvas consumer must.
  var onSys = function () {
    if (read() !== "system") return;
    apply("system");
    broadcast("system");
  };
  if (mq.addEventListener) mq.addEventListener("change", onSys);
  else if (mq.addListener) mq.addListener(onSys);

  window.CPL_THEME = {
    get: read,
    effective: function () { return effective(read()); },
    set: set,
    apply: apply,
    mount: mount,
    KEY: KEY,
    EVENT: EVENT
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
