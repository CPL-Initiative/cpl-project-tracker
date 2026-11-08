/* The CPL Commons look on every Commons view (Sam, 2026-11-04, S573: "Use the new UI format rather than first light on
 * this and all commons views", then S574: "let's go with the new formatting on all commons surfaces--the background on
 * the subjects view is still first light").
 *
 * The CPL Commons tab carries Malone's palette in commons.js (TOKENS, scoped to #tab-commons). This file gives the five
 * references' own tabs the same palette, and in light mode maps First Light's roles onto it inside those tabs, so every
 * component keyed on a token (--surface, --text-strong, --cobalt, --border...) takes the Commons look with no rule of
 * its own changed. Each tab paints an opaque page, which covers First Light's painting. Dark mode keeps First Light's
 * dark roles, as the Commons tab does: its --cmn values ARE those roles, so remapping there would be a cycle.
 *
 * The palette is a copy of commons.js's; tests/commons_look.test.js fails if the two drift. Lane:
 * docs/reference/lanes/commons.md. */
(function () {
  "use strict";
  if (window.CPL_COMMONS_LOOK) return;
  // Every Commons view but the Commons tab itself: Subjects, Exhibits, Credit Recommendations, Programs and Courses; and
  // the Library, on its Commons List (Sam, 2026-11-05: "Add a list view option to the Library just like our CPL Commons
  // list views ... Also use the new commons format").
  var TABS = ["#tab-canonical-subj4", "#tab-exhibits", "#tab-cr-reference", "#tab-program-requirements", "#tab-coci-lookup", "#tab-library",
    // CPL Pathways (Sam, 2026-11-06: CPL Pathways takes the new look; his call 2, its new format).
    "#tab-cpl-pathways"];
  var SEL = TABS.join(", ");
  var LIGHT = "--cmn-page:#F5FAFF; --cmn-page-end:#EEF6FB; --cmn-surface:#FFFFFF; --cmn-ink:#17243B; --cmn-ink-2:#3E4C61; --cmn-muted:#58677D; --cmn-heading:#082B61; --cmn-title:#072C66; --cmn-link:#0D5BC6; --cmn-accent:#1671D9; --cmn-gold:#F4B300; --cmn-line:#D9E4EF; --cmn-line-soft:#E8EEF5; --cmn-track:#E3ECF5; --cmn-pill-bg:#EAF4FE; --cmn-pill-fg:#355A80; --cmn-ask-bg:#FFF4D6; --cmn-ask-fg:#5C4000; --cmn-ask-label:#5C4000; --cmn-done-bg:#E3F4EA; --cmn-done-fg:#1E5B37; --cmn-serif:Georgia,'Times New Roman',serif; --cmn-sans:Inter,ui-sans-serif,system-ui,sans-serif;";
  var DARK = "--cmn-page:var(--surface-muted); --cmn-page-end:var(--surface-muted); --cmn-surface:var(--surface); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--cobalt); --cmn-accent:var(--cobalt); --cmn-gold:var(--gold-accent); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-track:var(--surface-muted); --cmn-pill-bg:var(--surface-muted); --cmn-pill-fg:var(--text-body); --cmn-ask-bg:var(--mustard-fill); --cmn-ask-fg:var(--on-mustard); --cmn-ask-label:var(--mustard-text); --cmn-done-bg:var(--surface-muted); --cmn-done-fg:var(--text-strong);";
  // First Light's roles, as the Commons palette names them (light mode only).
  var REMAP = "--paper:var(--cmn-page); --surface:var(--cmn-surface); --surface-opaque:var(--cmn-surface); --surface-1:var(--cmn-surface); " +
    "--surface-2:var(--cmn-page); --surface-subtle:var(--cmn-page); --surface-muted:var(--cmn-page-end); --text-strong:var(--cmn-heading); " +
    "--text-body:var(--cmn-ink); --text-muted:var(--cmn-muted); --border:var(--cmn-line); --cobalt:var(--cmn-link); --accent-link:var(--cmn-link); " +
    "--focus-ring:var(--cmn-accent);";
  var CSS = [
    SEL + " { " + LIGHT + " }",
    ":root[data-theme=\"dark\"] " + TABS.join(", :root[data-theme=\"dark\"] ") + " { " + DARK + " }",
    "@media (prefers-color-scheme: dark) { " + TABS.map(function (t) { return ":root:not([data-theme=\"light\"]) " + t; }).join(", ") + " { " + DARK + " } }",
    ":root[data-theme=\"light\"] " + TABS.join(", :root[data-theme=\"light\"] ") + " { " + REMAP + " }",
    "@media not (prefers-color-scheme: dark) { " + TABS.map(function (t) { return ":root:not([data-theme=\"dark\"]) " + t; }).join(", ") + " { " + REMAP + " } }",
    // The page: opaque, the Commons tab's gradient, its sans face and ink. It covers First Light's painting.
    SEL + " { background:linear-gradient(180deg, var(--cmn-surface) 0, var(--cmn-page) 26rem, var(--cmn-page-end) 100%); color:var(--cmn-ink); font-family:var(--cmn-sans); }",
    // COBI sets h1 to h3 in Playfair by element; the Commons sets its headings in its serif, in its heading ink.
    TABS.map(function (t) { return t + " :is(h1, h2, h3)"; }).join(", ") + " { font-family:var(--cmn-serif); color:var(--cmn-heading); }",
    TABS.map(function (t) { return t + " .glass"; }).join(", ") + " { background:var(--cmn-surface); -webkit-backdrop-filter:none; backdrop-filter:none; border-color:var(--cmn-line); }"
  ].join("\n");
  var FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  function install() {
    if (document.getElementById("cmn-look")) return;
    var s = document.createElement("style");
    s.id = "cmn-look";
    s.textContent = CSS;
    document.head.appendChild(s);
    if (!document.getElementById("cmn-font")) {
      var l = document.createElement("link");
      l.id = "cmn-font"; l.rel = "stylesheet"; l.href = FONT_HREF;
      document.head.appendChild(l);
    }
  }
  install();
  window.CPL_COMMONS_LOOK = { TABS: TABS, CSS: CSS, LIGHT: LIGHT, DARK: DARK, REMAP: REMAP, install: install };
})();
