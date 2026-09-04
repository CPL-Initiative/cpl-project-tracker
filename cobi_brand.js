// COBI brand + masthead layout — the consolidated single-row header.
//
// STATIC asset (like first_light.js / kpi_reorder.js): it injects its own CSS
// and a little runtime DOM, so the daily regen of the dashboard can't disturb
// it and there is no Rule-4 <style> mirror to maintain — only the
// <script src="cobi_brand.js"> tag lives in both HTMLs (plus the static
// masthead structure the template carries).
//
// Layout (single-row "app bar"):  seal + COBI  |  "Where To?" search (mounted
// into #cobiQsSlot by quickstart.js)  |  utility cluster (Hi … identity chip ·
// ℹ About popover · Updated stamp).
//
// Brand touches:
//   * COBI wordmark in seal-navy, bare.
//   * ALPHA chip on the wordmark + a one-line alpha-testing notice row,
//     both injected at runtime so the daily <h1> regen can't strand them.
//   * ℹ About popover holding the generator-injected Project Description /
//     Attachments / Cheat Sheet (anchored on the hidden #cobi-mamba), the
//     static "Today's painting" link (→ window.CPL_FIRST_LIGHT.open()), and
//     the relocated "Manually Refresh COBI" button.
//
// ⚠️ THE MASTHEAD IS A GRID THAT MUST BE ABLE TO SHRINK (Sam, 2026-09-04:
// "the header is all a mess when I zoom in or out, it gets messed up and
// ugly"). Zoom changes the CSS-pixel width, so a track that cannot shrink
// below its content does not wrap — it OVERFLOWS, and the neighbouring
// cluster is painted straight through it. That is what put the site
// switcher and the 🔒 control on top of the "Where To?" box. Two rules keep
// it honest, and neither is cosmetic:
//   * every flexible track is minmax(0,1fr), never a bare 1fr — a bare `1fr`
//     is minmax(AUTO,1fr), so it silently refuses to go below its content;
//   * every nowrap cluster carries min-width:0 so it may shrink and, at the
//     bottom, ellipsize.
// The clutter was the other half: the tagline, the CPL superscript and the
// org tag left with this change, and Refresh moved into About, so the row
// now carries four things instead of eight.
//
// (The Kobe "Mamba" subtitle + 8→24 wink were retired 2026-06-22 — Sam.
// The gold "CPL" superscript and the per-site org tag went 2026-09-04 —
// Sam: "delete the CPL superscript and all the other org tags for the logo".)
(function () {
  "use strict";

  function ensureCss() {
    if (document.getElementById("cobi-brand-css")) return;
    var s = document.createElement("style");
    s.id = "cobi-brand-css";
    s.textContent = [
      // ── single-row grid: brand | centered search | utility ──
      // position:relative + z-index lifts the header's stacking context above
      // the page content. The .header has backdrop-filter (own stacking
      // context) painted BEFORE the later KPI cards, so the absolutely-
      // positioned About popover (z-index:300, trapped inside that context)
      // rendered BEHIND the cards. 150 clears all page content but stays under
      // the mobile rail/hamburger (z 199-201) so they still cover the header.
      // Brand | search (absorbs the slack) | utility. THREE tracks, not four:
      // the old `auto 1fr auto auto` gave the search AND the utility a track
      // that could not shrink, with a spacer between them that could not
      // shrink either (a bare 1fr is minmax(auto,1fr)). Under zoom the row
      // overflowed and the clusters painted over each other. Now the middle
      // track is the elastic one and it is allowed to reach zero.
      ".header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;",
      "position:relative;z-index:150;",
      "align-items:center;column-gap:1.1rem;row-gap:.5rem;padding:.6rem 1.5rem;}",
      ".cobi-brand{grid-column:1;justify-self:start;display:flex;align-items:center;gap:.7rem;min-width:0;}",
      ".cobi-seal{flex:0 0 auto;width:60px;height:60px;object-fit:contain;display:block;}",
      ".cobi-brandtext{display:flex;flex-direction:column;line-height:1.12;min-width:0;}",
      ".header h1{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:800;",
      "letter-spacing:.08em;color:var(--seal-blue,#00356B);margin:0;white-space:nowrap;}",
      ".cobi-alpha{display:inline-block;margin-left:.5rem;padding:.08rem .38rem;vertical-align:.18em;",
      "font-family:'Source Sans 3',Arial,sans-serif;font-size:.58rem;font-weight:800;letter-spacing:.10em;",
      "text-transform:uppercase;color:var(--seal-blue,#00356B);background:var(--mustard-fill,#E3B341);",
      "border-radius:3px;white-space:nowrap;}",
      // LOW-KEY, deliberately (Sam, 2026-09-04: "remove the formatting around
      // the text and shrink the font and make it unbold so it's just a low-key
      // part of the header"). This reverses his 2026-08-18 call for a bordered,
      // italic, gold line a step LARGER than the rest — that treatment made a
      // standing condition shout on every tab, and a page where everything
      // shouts has no way left to shout.
      //
      // ⚠️ --text-muted, NOT --text-faint. The token table calls faint
      // "decorative only — never essential text", and an accuracy caution the
      // reader is expected to act on is essential text however quiet it looks.
      ".cobi-alpha-note{grid-column:1 / -1;order:8;margin:0;padding:.15rem .1rem .1rem;",
      "text-align:center;",
      "font-family:'Source Sans 3',Arial,sans-serif;font-size:.74rem;",
      "font-weight:400;line-height:1.45;color:var(--text-muted,#5C5C55);}",
      // ── center search slot (quickstart mounts here) ──
      // grid-column 2 = the elastic track. width:100% with a max, NOT a fixed
      // width: the track may shrink to nothing, and the slot has to follow it
      // down rather than overflow into the utility cluster.
      ".cobi-qs-slot{grid-column:2;justify-self:end;width:100%;max-width:360px;min-width:0;}",
      "#cobiQsSlot #qs-chat{margin:0;padding:0;background:none;border:none;box-shadow:none;position:static;}",
      "#cobiQsSlot .qs-label{display:inline-flex;align-items:center;gap:.3rem;margin:0;flex:0 1 auto;",
      "font-size:.85rem;font-weight:700;color:var(--text-strong,#1C1C1A);white-space:nowrap;",
      "overflow:hidden;text-overflow:ellipsis;}",
      "#cobiQsSlot .qs-row{display:flex;align-items:center;gap:.5rem;min-width:0;}",
      "#cobiQsSlot .qs-status{font-size:.72rem;margin:.15rem 0 0;min-height:0;}",
      // ── utility cluster (right) ──
      ".cobi-utility{grid-column:3;justify-self:end;display:flex;align-items:center;justify-content:flex-end;",
      "flex-wrap:wrap;gap:.1rem .55rem;min-width:0;}",
      // ⚠️ --text-muted, NOT --text-faint. Measured on the rendered page, faint
      // gave these 3.53:1 against the 4.5:1 small-text floor — a genuine AA
      // failure on a CONTROL LABEL, and the token table already says faint is
      // "decorative only — never essential text". min-height 24px meets WCAG
      // 2.2 SC 2.5.8 (target size); these were 19px tall.
      ".cobi-util-link,.header #refreshBtn{font-family:'Source Sans 3',Arial,sans-serif!important;",
      "font-size:.74rem!important;font-weight:600!important;color:var(--text-muted,#5C5C55)!important;",
      "background:none!important;border:none!important;cursor:pointer;text-decoration:none!important;",
      "padding:.25rem .3rem!important;min-height:24px;box-sizing:border-box;",
      "display:inline-flex!important;align-items:center;gap:.25rem;",
      "transition:color .15s;white-space:nowrap;letter-spacing:0!important;border-radius:0!important;}",
      ".cobi-util-link:hover,.header #refreshBtn:hover{color:var(--cobalt,#0047AB)!important;background:none!important;}",
      ".cobi-about{position:relative;order:1;}",
      // Refresh lives INSIDE the About panel now (Sam, 2026-09-04). It keeps
      // .cobi-util-link for the shared hover/focus treatment, so give it the
      // panel's own block-link geometry rather than the strip's inline one.
      ".cobi-about-panel #refreshBtn{order:0;display:flex!important;width:100%;",
      "font-size:.82rem!important;font-weight:600!important;color:var(--cobalt,#0047AB)!important;",
      "padding:.3rem 0!important;}",
      ".cobi-about-panel #refreshBtn:hover{text-decoration:underline;}",
      // The stamp says how fresh the figures are — that is data a reader acts
      // on, so it takes the muted TEXT token too (was 3.53:1 on faint).
      ".cobi-utility .last-updated{order:9;flex-basis:100%;text-align:right;font-size:.7rem!important;",
      "color:var(--text-muted,#5C5C55)!important;margin:.05rem 0 0!important;font-weight:400;}",
      // ── About popover ──
      ".cobi-about-panel{position:absolute;right:0;top:calc(100% + .4rem);z-index:300;width:320px;",
      "background:var(--surface-opaque,#fff);border:1px solid var(--border-strong,rgba(28,28,26,.30));",
      "border-radius:8px;box-shadow:0 10px 30px rgba(20,20,30,.16);padding:.85rem .95rem;display:none;text-align:left;}",
      ".cobi-about-panel.open{display:block;}",
      ".cobi-about-panel h4{font-family:'Source Sans 3',sans-serif;font-size:.72rem;letter-spacing:.06em;",
      "text-transform:uppercase;color:var(--text-muted,#5C5C55);margin:0 0 .4rem;}",
      ".cobi-about-links{display:flex;flex-direction:column;border-top:1px solid var(--border,rgba(28,28,26,.14));",
      "margin-top:.5rem;padding-top:.3rem;}",
      ".cobi-about-link{display:flex;align-items:center;gap:.4rem;font-size:.82rem;font-weight:600;",
      "color:var(--cobalt,#0047AB);background:none;border:none;text-align:left;cursor:pointer;",
      "padding:.3rem 0;font-family:'Source Sans 3',sans-serif;}",
      ".cobi-about-link:hover{text-decoration:underline;}",
      // neutralize the generator's dark-band inline styles inside the light panel
      ".cobi-about-panel .project-description{max-width:none!important;margin:0 0 .2rem!important;}",
      ".cobi-about-panel .project-description>summary{color:var(--cobalt,#0047AB)!important;font-size:.82rem!important;}",
      ".cobi-about-panel .project-description>div{color:var(--text-body,#3A3A36)!important;",
      "border-left-color:var(--border-strong,rgba(28,28,26,.30))!important;margin-top:.3rem!important;}",
      ".cobi-about-panel .attach-btn{display:flex!important;align-items:center;gap:.4rem;font-size:.82rem!important;",
      "font-weight:600!important;color:var(--cobalt,#0047AB)!important;background:none!important;border:none!important;",
      "padding:.3rem 0!important;text-decoration:none!important;}",
      ".cobi-about-panel .attach-btn:hover{text-decoration:underline!important;background:none!important;}",
      ".cobi-about-panel>div[style]{margin-top:.1rem!important;}",
      // ── responsive: search drops to its own row under ~1000px ──
      // Below ~1000px the search takes its own full-width row. minmax(0,…) on
      // both tracks again — the brand and the utility cluster must be able to
      // shrink past their content rather than push the row wide.
      "@media (max-width:1000px){.header{grid-template-columns:minmax(0,1fr) minmax(0,auto);",
      "padding:.6rem 1rem;}",
      // justify-self:stretch, NOT the wide layout's `start`: a non-stretch
      // justification sizes the item to its own content, which is how the brand
      // cluster came to be wider than the track it sits in.
      ".cobi-brand{grid-column:1;order:1;justify-self:stretch;}",
      ".cobi-utility{grid-column:2;order:2;justify-self:stretch;justify-content:flex-end;}",
      ".cobi-qs-slot{grid-column:1 / -1;order:5;justify-self:stretch;width:auto;max-width:none;",
      "border-top:1px solid var(--border,rgba(28,28,26,.14));padding-top:.5rem;}}",
      // Single column below ~560px (presentation rule: mobile-friendly, always).
      "@media (max-width:560px){.header{grid-template-columns:minmax(0,1fr);}",
      ".cobi-brand{grid-column:1;justify-self:stretch;}",
      ".cobi-utility{grid-column:1;justify-self:stretch;justify-content:flex-start;}",
      ".cobi-seal{width:44px;height:44px;}.header h1{font-size:1.35rem;}}"
    ].join("");
    document.head.appendChild(s);
  }

  // The gold "CPL" superscript and the per-site org tag were REMOVED 2026-09-04
  // (Sam: "delete the CPL superscript and all the other org tags for the logo").
  // Both wrote a .cobi-num span into the <h1>; this sweeps any that survives a
  // cached copy of cobi_orgs.js, so a stale asset cannot put the tag back.
  function dropWordmarkTags() {
    var h1 = document.querySelector(".header h1");
    if (!h1) return;
    var tags = h1.querySelectorAll(".cobi-num");
    Array.prototype.forEach.call(tags, function (t) { t.parentNode.removeChild(t); });
  }

  // Alpha-testing notice. COBI is not a finished product and its figures are
  // not yet trustworthy enough to quote, so the masthead says so on every tab:
  // an ALPHA chip on the wordmark (survives the daily <h1> regen, same reason
  // as the CPL superscript) plus one centered, italic line under the brand.
  // ⚠️ NOT "don't cite or share them outside the team" — that was the wording
  // until 2026-09-04, and Sam corrected it as FALSE: COBI's figures are shared
  // outward by design, through Sierra and the CPL Fact Sheet among others. A
  // banner forbidding what the product does daily teaches readers to ignore the
  // banner. The true caution is about VERIFYING an alpha figure, not withholding
  // it — "always doublecheck and revise outputs as needed" (his words).
  //
  // The second sentence is his other ask: say what COBI answers FROM, and that
  // the knowledge base is governed rather than open — no personal information
  // enters it, and it reaches no outside data source.
  var ALPHA_NOTE = "Alpha: figures may be incomplete or wrong \u2014 always " +
                   "double-check and revise outputs as needed. COBI answers from " +
                   "our own curated knowledge base: no personal information in, " +
                   "no outside data sources.";

  function addAlphaNotice() {
    var h1 = document.querySelector(".header h1");
    if (h1 && !h1.querySelector(".cobi-alpha")) {
      var chip = document.createElement("span");
      chip.className = "cobi-alpha";
      chip.textContent = "Alpha";
      chip.title = ALPHA_NOTE;
      h1.appendChild(chip);
    }
    var header = document.querySelector(".header");
    if (!header || header.querySelector(".cobi-alpha-note")) return;
    var note = document.createElement("p");
    note.className = "cobi-alpha-note";
    note.setAttribute("role", "note");
    note.textContent = ALPHA_NOTE;
    header.appendChild(note);
  }

  // ℹ About popover open/close (click toggle, click-outside + ESC to close).
  function wireAbout() {
    var btn = document.getElementById("cobiAboutBtn");
    var panel = document.getElementById("cobiAboutPanel");
    if (!btn || !panel || btn.dataset.wired) return;
    btn.dataset.wired = "1";
    function close() { panel.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  // "Manually Refresh COBI" belongs in the About menu, not the masthead strip
  // (Sam, 2026-09-04). MOVED at runtime rather than re-homed in the markup,
  // because the generator re-injects this button after .last-updated on every
  // daily run (excel_to_dashboard.py) — an HTML edit would be undone by the
  // next cron, while a move survives it and needs no Rule-4 mirror. If this
  // script never runs the button simply stays where the generator put it,
  // which is the honest fallback.
  function relocateRefresh() {
    var btn = document.getElementById("refreshBtn");
    var links = document.querySelector("#cobiAboutPanel .cobi-about-links");
    if (!btn || !links || btn.closest("#cobiAboutPanel")) return;
    links.insertBefore(btn, links.firstChild);
  }

  // The static "Today's painting" link in About opens First Light's modal.
  function wirePainting() {
    var link = document.getElementById("cobiPaintingLink");
    if (!link || link.dataset.wired) return;
    link.dataset.wired = "1";
    link.addEventListener("click", function () {
      if (window.CPL_FIRST_LIGHT && typeof window.CPL_FIRST_LIGHT.open === "function") {
        window.CPL_FIRST_LIGHT.open();
      }
    });
  }

  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    ensureCss();
    dropWordmarkTags();
    addAlphaNotice();
    relocateRefresh();
    wireAbout();
    wirePainting();
  }

  window.COBI_BRAND = { init: init, dropWordmarkTags: dropWordmarkTags,
                        addAlphaNotice: addAlphaNotice,
                        relocateRefresh: relocateRefresh };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
