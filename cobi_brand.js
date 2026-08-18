// COBI brand + masthead layout — the consolidated single-row header.
//
// STATIC asset (like first_light.js / kpi_reorder.js): it injects its own CSS
// and a little runtime DOM, so the daily regen of the dashboard can't disturb
// it and there is no Rule-4 <style> mirror to maintain — only the
// <script src="cobi_brand.js"> tag lives in both HTMLs (plus the static
// masthead structure the template carries).
//
// Layout (single-row "app bar"):  seal + COBI / tagline  |  "Where To?" search
// (mounted into #cobiQsSlot by quickstart.js)  |  subtle utility cluster
// (ℹ About popover · Manually Refresh COBI · Updated stamp).
//
// Brand touches:
//   * COBI wordmark in seal-navy with a gold "CPL" superscript.
//   * ALPHA chip on the wordmark + a one-line alpha-testing notice row,
//     both injected at runtime so the daily <h1> regen can't strand them.
//   * ℹ About popover holding the generator-injected Project Description /
//     Attachments / Cheat Sheet (anchored on the hidden #cobi-mamba) plus the
//     static "Today's painting" link (→ window.CPL_FIRST_LIGHT.open()).
//
// (The Kobe "Mamba" subtitle + 8→24 wink were retired 2026-06-22 — Sam.)
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
      // Left brand | flexible spacer | right search | right utility. The search
      // moved OFF-center to the right (Sam, 2026-07-14) so the site-switcher in
      // the brand cluster can't overlap it at intermediate widths.
      ".header{display:grid;grid-template-columns:auto 1fr auto auto;",
      "position:relative;z-index:150;",
      "align-items:center;column-gap:1.1rem;row-gap:.5rem;padding:.6rem 1.5rem;}",
      ".cobi-brand{grid-column:1;justify-self:start;display:flex;align-items:center;gap:.7rem;min-width:0;}",
      ".cobi-seal{flex:0 0 auto;width:60px;height:60px;object-fit:contain;display:block;}",
      ".cobi-brandtext{display:flex;flex-direction:column;line-height:1.12;min-width:0;}",
      ".header h1{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:800;",
      "letter-spacing:.08em;color:var(--seal-blue,#00356B);margin:0;white-space:nowrap;}",
      ".header h1 .cobi-num{font-size:.40em;vertical-align:super;margin-left:.16em;font-weight:800;",
      "letter-spacing:.05em;color:var(--mustard-text,#8B6800);}",
      ".cobi-alpha{display:inline-block;margin-left:.5rem;padding:.08rem .38rem;vertical-align:.18em;",
      "font-family:'Source Sans 3',Arial,sans-serif;font-size:.58rem;font-weight:800;letter-spacing:.10em;",
      "text-transform:uppercase;color:var(--seal-blue,#00356B);background:var(--mustard-fill,#E3B341);",
      "border-radius:3px;white-space:nowrap;}",
      ".cobi-alpha-note{grid-column:1 / -1;order:8;margin:0;padding:.35rem .1rem .1rem;",
      "border-top:1px solid var(--border,rgba(28,28,26,.14));text-align:center;",
      "font-family:'Source Sans 3',Arial,sans-serif;font-size:.88rem;font-style:italic;",
      "font-weight:600;line-height:1.4;color:var(--mustard-text,#8B6800);}",
      ".cobi-tagline{font-family:'Source Sans 3',Arial,sans-serif;font-size:.8rem;font-weight:600;",
      "letter-spacing:.02em;color:var(--text-muted,#5C5C55);margin:.1rem 0 0;white-space:nowrap;}",
      // ── center search slot (quickstart mounts here) ──
      ".cobi-qs-slot{grid-column:3;justify-self:end;width:min(360px,40vw);min-width:0;}",
      "#cobiQsSlot #qs-chat{margin:0;padding:0;background:none;border:none;box-shadow:none;position:static;}",
      "#cobiQsSlot .qs-label{display:inline-flex;align-items:center;gap:.3rem;margin:0;",
      "font-size:.85rem;font-weight:700;color:var(--text-strong,#1C1C1A);white-space:nowrap;}",
      "#cobiQsSlot .qs-row{display:flex;align-items:center;gap:.5rem;}",
      "#cobiQsSlot .qs-status{font-size:.72rem;margin:.15rem 0 0;min-height:0;}",
      // ── utility cluster (right) ──
      ".cobi-utility{grid-column:4;justify-self:end;display:flex;align-items:center;justify-content:flex-end;",
      "flex-wrap:wrap;gap:.1rem .55rem;}",
      ".cobi-util-link,.header #refreshBtn{font-family:'Source Sans 3',Arial,sans-serif!important;",
      "font-size:.74rem!important;font-weight:600!important;color:var(--text-faint,#87877F)!important;",
      "background:none!important;border:none!important;cursor:pointer;text-decoration:none!important;",
      "padding:.15rem .3rem!important;display:inline-flex!important;align-items:center;gap:.25rem;",
      "transition:color .15s;white-space:nowrap;letter-spacing:0!important;border-radius:0!important;}",
      ".cobi-util-link:hover,.header #refreshBtn:hover{color:var(--cobalt,#0047AB)!important;background:none!important;}",
      ".cobi-about{position:relative;order:1;}",
      ".header #refreshBtn{order:2;}",
      ".cobi-utility .last-updated{order:9;flex-basis:100%;text-align:right;font-size:.7rem!important;",
      "color:var(--text-faint,#87877F)!important;margin:.05rem 0 0!important;font-weight:400;}",
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
      "@media (max-width:1180px){.header{grid-template-columns:1fr auto;}",
      ".cobi-brand{grid-column:1;order:1;}.cobi-utility{grid-column:2;order:2;}",
      ".cobi-qs-slot{grid-column:1 / -1;order:5;justify-self:stretch;width:auto;",
      "border-top:1px solid var(--border,rgba(28,28,26,.14));padding-top:.5rem;}}"
    ].join("");
    document.head.appendChild(s);
  }

  // The gold "CPL" superscript, injected at runtime so the daily regen of the
  // <h1> (which resets it to a bare "COBI") can never strand it.
  function addSuperscript() {
    var h1 = document.querySelector(".header h1");
    if (!h1 || h1.querySelector(".cobi-num") || !/COBI/i.test(h1.textContent || "")) return;
    var sup = document.createElement("span");
    sup.className = "cobi-num";
    sup.textContent = "CPL";
    sup.setAttribute("aria-label", "Credit for Prior Learning");
    h1.appendChild(sup);
  }

  // Alpha-testing notice. COBI is not a finished product and its figures are
  // not yet trustworthy enough to quote, so the masthead says so on every tab:
  // an ALPHA chip on the wordmark (survives the daily <h1> regen, same reason
  // as the CPL superscript) plus one centered, italic line under the brand.
  var ALPHA_NOTE = "COBI is an experimental data suite in Alpha development " +
                   "phase. Features and figures may be incomplete or wrong \u2014 " +
                   "please don\u2019t cite or share them outside the team.";

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
    addSuperscript();
    addAlphaNotice();
    wireAbout();
    wirePainting();
  }

  window.COBI_BRAND = { init: init, addSuperscript: addSuperscript,
                        addAlphaNotice: addAlphaNotice };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
