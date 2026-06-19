// COBI brand layer — the masthead personality for "COBI: Chancellor's Office
// Business Intelligence." A Kobe homage (Mamba Mentality), kept tasteful.
//
// STATIC asset (like first_light.js / kpi_reorder.js): it injects its own CSS
// and a little runtime DOM, so the daily regen of the dashboard can't disturb
// it and there is no Rule-4 <style> mirror to maintain — only the
// <script src="cobi_brand.js"> tag lives in both HTMLs (plus the static
// fallback masthead text the generator/template already carry).
//
// Three touches:
//   1. A rotating "Mamba" subtitle, a fresh one chosen at random each load.
//   2. An 8 → 24 jersey wink on the COBI wordmark (Kobe's two retired numbers).
//   3. Mamba Day (August 24): the masthead goes purple-and-gold for the day.
(function () {
  "use strict";

  // The rotating subtitle slot — randomized per page load. Keep it warm and
  // a little cheeky; this is the wink, not the brand.
  var MAMBA = [
    "Mamba Mentality", "Mamba Time", "Mambadata", "Black Mambanator",
    "Bean Counting", "Job's Not Finished", "Mamba Mode: ON", "Dashboard Assassin",
    "Mambametrics", "Every Unit Counts", "Data Don't Lie", "Mambacademics",
    "Built Different", "8 → 24", "Vino", "Count the Credit", "Mamba Out"
  ];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function isMambaDay(d) { return d.getMonth() === 7 && d.getDate() === 24; } // Aug 24

  function ensureCss() {
    if (document.getElementById("cobi-brand-css")) return;
    var s = document.createElement("style");
    s.id = "cobi-brand-css";
    s.textContent =
      ".header h1{font-size:1.6rem;letter-spacing:.08em;font-weight:800}" +
      ".cobi-tagline{font-size:.8rem;letter-spacing:.04em;color:var(--text-muted,#5C5C55);margin:.1rem 0 0;font-weight:600}" +
      "#cobi-mamba{font-style:italic}" +
      ".header h1 .cobi-num{font-size:.46em;vertical-align:super;margin-left:.16em;font-weight:700;" +
      "color:var(--mustard-text,#8B6800);cursor:default;transition:color .15s}" +
      ".header h1 .cobi-num:hover{color:var(--accent-link,#0047AB)}" +
      // Mamba Day — purple & gold
      ".cobi-mamba-day .header h1 .cobi-num{color:#FDB927}" +
      ".cobi-mamba-day #cobi-mamba{color:var(--violet,#6D28D9);font-weight:700;font-style:normal}" +
      ".cobi-mamba-day .cobi-tagline{color:var(--violet,#6D28D9)}";
    document.head.appendChild(s);
  }

  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    ensureCss();
    var mambaDay = isMambaDay(new Date());

    // 1. rotating subtitle (static fallback "Mamba Mentality" stays if no JS)
    var sub = document.getElementById("cobi-mamba");
    if (sub) sub.textContent = mambaDay ? "Mamba Mentality · Happy Mamba Day 🐍" : pick(MAMBA);

    // 2. the 8 -> 24 jersey wink, injected at runtime so the daily regen of the
    //    <h1> can never strand it
    var h1 = document.querySelector(".header h1");
    if (h1 && !h1.querySelector(".cobi-num") && /COBI/i.test(h1.textContent || "")) {
      var num = document.createElement("span");
      num.className = "cobi-num";
      num.textContent = "8";
      num.setAttribute("aria-hidden", "true");
      num.title = "8 → 24";
      num.addEventListener("mouseenter", function () { num.textContent = "24"; });
      num.addEventListener("mouseleave", function () { num.textContent = "8"; });
      h1.appendChild(num);
    }

    // 3. Mamba Day theme for the whole masthead
    if (mambaDay && document.body) document.body.classList.add("cobi-mamba-day");
  }

  window.COBI_BRAND = { init: init, mambaPhrases: MAMBA, isMambaDay: isMambaDay, pick: pick };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
