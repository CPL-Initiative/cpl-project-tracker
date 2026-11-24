/*
 * funding-model/simple_view.js — SIMPLE VIEW on the public funding page (Sam,
 * 2026-11-24, all his calls on the approved mockup).
 *
 * A switch in the center of the public header, Simple view Off/On, on by
 * default and never remembered across visits. While it is on, one line under
 * the header says how to get the details back, and the page HIDES what a
 * college does not need to act: the Base/Cap chips, the district grouping and
 * its header rows (the table renders flat), the Statewide row, the Columns
 * menu, the lane, below-threshold and No NC chips, the FTES figures and closing
 * notes of a details row, and the three sections on how the model computes
 * (allocation, earning, choices) with their Contents items. It never changes
 * the layout. It folds every top-level section but the institution table, and
 * turning it off restores each fold as it was. Every action stays.
 *
 * With the switch (in both views): five count cards under the title, in place
 * of the gold rule, each the number of institutions meeting one condition of
 * those it applies to. Hover or focus lists them; a press filters the table to
 * them through the table's own filter (CPL_FUNDING_TAB.setCondFilter). The
 * counts come from the funding module's condition logic (condCards), never
 * from this page. How to meet it after each unmet condition and the Ver. 2
 * label are the module's and the page's painter's, keyed to the same test.
 *
 * WHO SEES IT: a signed-in team member, or every reader once a curator turns
 * on "Simple view on the public page" in the funding tab's Internal view
 * (simpleViewLive, default off). CPL_FUNDING_TAB.simplePackageShown() is the
 * one test. Everyone else gets the page as it was.
 */
(function () {
  "use strict";
  var T = window.CPL_FUNDING_TAB;
  var doc = document;
  if (!T || typeof T.simplePackageShown !== "function" || typeof T.condCards !== "function") return;
  var $ = function (id) { return doc.getElementById(id); };
  var center = $("svCenter"), btn = $("simpleBtn"), onoff = $("simpleOnOff"), line = $("simpleLine"), cards = $("svCards");
  if (!center || !btn || !cards) return;

  var shown = false;     // the package is on screen
  var everShown = false; // Simple view starts on the first time it shows (the default)
  var on = false;        // Simple view is on
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // What Simple view hides (Sam, 2026-11-24, ruling 4). Hiding only: no rule here moves anything.
  var HIDE = [".cf-boundchip", ".cf-chipgrp", "tr.cplfund-grouphdr", "#cplFundGroup", "tr.cplfund-systemrow",
    ".cplfund-colmenu", ".cf-lanechip", ".cf-belowchip", ".cf-nonc", ".cf-ftes", ".cplfund-detail-foot",
    "tr.cplfund-srcrow", "tr.cplfund-subnote", "#allocation", "#earning", "#choices",
    '.toc li[data-sec="allocation"]', '.toc li[data-sec="earning"]', '.toc li[data-sec="choices"]'];
  var HIDDEN_SECTIONS = ["allocation", "earning", "choices"];

  function ensureCss() {
    if ($("sv-css")) return;
    var st = doc.createElement("style");
    st.id = "sv-css";
    st.textContent = [
      HIDE.map(function (h) { return "body.simple " + h; }).join(",\n") + "{display:none !important}",
      // The package replaces the gold rule under the title with the cards.
      "body.sv-pkg .title-accent{display:none}",
      // The switch: the header row's center, its own line on a phone.
      ".sv-center:not([hidden]){flex:1 1 auto; display:flex; justify-content:center}",
      "@media (max-width:760px){ .sv-center:not([hidden]){order:3; flex-basis:100%; justify-content:flex-start} }",
      "#simpleBtn{display:inline-flex; align-items:center; gap:12px; min-height:48px; padding:6px 18px 6px 10px;",
      "  border:2px solid var(--seal-blue); border-radius:999px; background:var(--surface-opaque); color:var(--seal-blue);",
      "  font:inherit; font-size:clamp(1.1rem,2.2vw,1.3rem); font-weight:700; cursor:pointer}",
      "#simpleBtn:focus-visible{outline:3px solid var(--focus-ring); outline-offset:2px}",
      "#simpleBtn .sv-track{position:relative; width:46px; height:26px; border-radius:999px; background:var(--surface-muted);",
      "  border:2px solid var(--seal-blue); flex:none; box-sizing:border-box}",
      "#simpleBtn .sv-knob{position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;",
      "  background:var(--seal-blue); transition:left .15s}",
      "#simpleBtn .sv-onoff{font-size:.8em; font-weight:600}",
      "#simpleBtn[aria-pressed=\"true\"]{background:var(--seal-blue); color:var(--surface-opaque)}",
      "#simpleBtn[aria-pressed=\"true\"] .sv-track{background:var(--surface-opaque); border-color:var(--surface-opaque)}",
      "#simpleBtn[aria-pressed=\"true\"] .sv-knob{left:22px}",
      "@media (prefers-reduced-motion: reduce){ #simpleBtn .sv-knob{transition:none} }",
      // The line under the header.
      ".sv-line:not([hidden]){display:block; margin:8px auto 0; text-align:center; font-size:.95rem; font-style:italic; color:var(--seal-blue)}",
      // The cards: 5, then 3, 2 and 1 across.
      ".sv-cards:not([hidden]){display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin:14px 0 12px}",
      "@media (max-width:1000px){ .sv-cards:not([hidden]){grid-template-columns:repeat(3,minmax(0,1fr))} }",
      "@media (max-width:760px){ .sv-cards:not([hidden]){grid-template-columns:repeat(2,minmax(0,1fr))} }",
      "@media (max-width:420px){ .sv-cards:not([hidden]){grid-template-columns:minmax(0,1fr)} }",
      ".sv-cardw{position:relative; min-width:0; display:grid}",
      ".sv-card{display:grid; grid-template-columns:1fr auto auto 1fr; align-items:baseline; column-gap:6px; row-gap:2px;",
      "  text-align:center; font:inherit; background:var(--surface-opaque); color:var(--text-body);",
      "  border:1px solid var(--border-strong); border-radius:10px; padding:12px 14px; cursor:pointer; min-width:0}",
      ".sv-card:hover{border-color:var(--seal-blue)}",
      ".sv-card:focus-visible{outline:3px solid var(--focus-ring); outline-offset:2px}",
      ".sv-card[aria-pressed=\"true\"]{border:2px solid var(--seal-blue); padding:11px 13px}",
      ".sv-card[data-card=\"all\"]{background:var(--tint-cobalt); border-color:var(--cobalt)}",
      ".sv-card[data-card=\"all\"][aria-pressed=\"true\"]{border-color:var(--seal-blue)}",
      ".sv-n{grid-column:2; font-family:var(--serif); font-size:clamp(1.5rem,1.2rem + 1vw,2rem); line-height:1.1;",
      "  color:var(--text-strong); font-variant-numeric:tabular-nums}",
      ".sv-of{grid-column:3; font-size:.85rem; color:var(--text-muted); font-variant-numeric:tabular-nums}",
      ".sv-k{grid-column:1 / -1; font-size:.92rem; color:var(--text-body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}",
      ".sv-star{margin-left:3px}",
      // The names behind a card, on hover and on keyboard focus; Escape puts it away.
      ".sv-tip{display:none; position:absolute; left:0; top:calc(100% + 6px); z-index:20; width:min(28rem,86vw);",
      "  max-height:16rem; overflow:auto; text-align:left; background:var(--surface-opaque); color:var(--text-body);",
      "  border:1px solid var(--border-strong); border-radius:8px; padding:10px 12px; font-size:.86rem; line-height:1.45;",
      "  box-shadow:0 6px 18px color-mix(in srgb, var(--text-strong) 14%, transparent)}",
      ".sv-cardw:nth-child(n+4) .sv-tip{left:auto; right:0}",
      ".sv-cardw:hover .sv-tip, .sv-card:focus-visible + .sv-tip{display:block}",
      ".sv-cardw.sv-tipoff .sv-tip{display:none}",
      "@media print{ .sv-center, .sv-line, .sv-tip{display:none !important} }"
    ].join("\n");
    doc.head.appendChild(st);
  }

  // ── the folds: every top-level section but the institution table ──────────
  function topFolds() {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll("main > section[data-fsec]"), function (sec) {
      var d = sec.querySelector("details.fold");
      if (d) out.push({ sec: sec, d: d });
    });
    return out;
  }
  function foldAll(v) {
    topFolds().forEach(function (f) {
      var keep = f.sec.id === "institutions";
      if (v) {
        f.d.setAttribute("data-sv-was-open", f.d.open ? "1" : "0");
        f.d.open = keep;
      } else if (f.d.hasAttribute("data-sv-was-open")) {
        f.d.open = f.d.getAttribute("data-sv-was-open") === "1";
        f.d.removeAttribute("data-sv-was-open");
      }
    });
    if (window.CPL_CONTENTS && typeof window.CPL_CONTENTS.sync === "function") window.CPL_CONTENTS.sync();
  }

  function setSimple(v) {
    v = !!v;
    if (v === on) return;
    on = v;
    btn.setAttribute("aria-pressed", String(on));
    if (onoff) onoff.textContent = on ? "On" : "Off";
    if (line) line.hidden = !on;
    doc.body.classList.toggle("simple", on);
    foldAll(on);
    if (typeof T.setSimpleView === "function") T.setSimpleView(on);
  }
  btn.addEventListener("click", function () { if (shown) setSimple(!on); });

  // ── the count cards ─────────────────────────────────────────────────────
  function cardEl(c) {
    var w = doc.createElement("div");
    w.className = "sv-cardw";
    var b = doc.createElement("button");
    b.type = "button";
    b.className = "sv-card";
    b.setAttribute("data-card", c.key);
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-describedby", "svTip-" + c.key);
    b.innerHTML = '<span class="sv-n"></span><span class="sv-of"></span><span class="sv-k"></span>';
    var tip = doc.createElement("span");
    tip.className = "sv-tip";
    tip.id = "svTip-" + c.key;
    tip.setAttribute("role", "tooltip");
    w.appendChild(b);
    w.appendChild(tip);
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      T.setCondFilter(T.condFilter() === f ? "" : f);
      var sec = $("institutions"), d = sec && sec.querySelector("details.fold");
      if (d && !d.open) d.open = true;
      if (sec && typeof sec.scrollIntoView === "function") sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    b.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Esc") w.classList.add("sv-tipoff"); });
    b.addEventListener("blur", function () { w.classList.remove("sv-tipoff"); });
    w.addEventListener("mouseleave", function () { w.classList.remove("sv-tipoff"); });
    return w;
  }
  function paintCards() {
    var list = T.condCards() || [];
    var keys = list.map(function (c) { return c.key; }).join(",");
    if (cards.getAttribute("data-keys") !== keys) {
      cards.textContent = "";
      list.forEach(function (c) { cards.appendChild(cardEl(c)); });
      cards.setAttribute("data-keys", keys);
    }
    var cur = T.condFilter();
    list.forEach(function (c) {
      var b = cards.querySelector('.sv-card[data-card="' + c.key + '"]');
      if (!b) return;
      b.setAttribute("data-filter", c.filter);
      b.setAttribute("data-phrase", c.phrase);
      b.setAttribute("aria-pressed", String(cur === c.filter));
      b.querySelector(".sv-n").textContent = c.n == null ? "TBA" : c.n.toLocaleString("en-US");
      b.querySelector(".sv-of").textContent = "of " + c.of.toLocaleString("en-US");
      var k = b.querySelector(".sv-k");
      k.textContent = c.label;
      if (c.star) {
        var s = doc.createElement("span");
        s.className = "cplfund-vstar sv-star";
        s.setAttribute("role", "img");
        s.setAttribute("aria-label", "Veteran Star");
        s.textContent = "★";
        k.appendChild(s);
      }
      var tip = $("svTip-" + c.key);
      if (tip) tip.textContent = c.n == null ? "Still loading." : (c.names.length ? c.names.join(", ") : "None yet.");
    });
  }

  // ── who sees it, after every paint ───────────────────────────────────────
  function sync() {
    var vis = false;
    try { vis = !!T.simplePackageShown(); } catch (e) { vis = false; }
    if (vis !== shown) {
      shown = vis;
      center.hidden = !vis;
      cards.hidden = !vis;
      doc.body.classList.toggle("sv-pkg", vis);
      if (vis) ensureCss();
      if (vis && !everShown) { everShown = true; setSimple(true); }
      else if (!vis) setSimple(false);
    }
    if (vis) paintCards();
  }
  window.CPL_SIMPLE_VIEW = {
    sync: sync,
    isOn: function () { return on; },
    shown: function () { return shown; },
    set: function (v) { if (shown) setSimple(v); },
    hides: function () { return HIDE.slice(); },
    hiddenSections: function () { return HIDDEN_SECTIONS.slice(); }
  };
  if (typeof T.onModelChange === "function") T.onModelChange(sync);
  sync();
})();
