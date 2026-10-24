// public_library.js — the public CPL Library page (library/index.html).
//
// Reads the listed pieces live through cpl_library_public() (anon, public fields
// only; kb/supabase_cpl_library_public.sql). A failed read says so and paints no
// list rather than a partial one. Each card says who the piece is made for (Sam,
// Open Asks Sheet 120 card 4, 2026-10-23), and For, beside the search, lists the
// names present, grouped by kind when there is more than one kind.
//
// Sam, 2026-10-24: Sort opens on Most recent; a card shows one line of its occasion
// and two of its summary, ending in an ellipsis (the whole text stays in the page for
// search and for screen readers); and the photo in the hero cycles through every
// .hero-slide the page lists, with Pause photos beside it. One photo, or a reader who
// asks for reduced motion, and nothing moves. Nothing is remembered between visits.
// Test: tests/public_library.test.js
(function () {
  "use strict";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var RPC = SUPABASE_URL + "/rest/v1/rpc/cpl_library_public";
  var KIND = { visual: "Visual", deck: "Slides", film: "Film", document: "Document", spreadsheet: "Spreadsheet" };
  var OPEN = { visual: "Open the visual", deck: "Open the slides", film: "Watch the film", document: "Open the document", spreadsheet: "Open the spreadsheet" };
  var FOR_KIND = { college: "College", district: "District", agency: "Agency", vendor: "Vendor", co: "Chancellor's Office", other: "Other" };
  var FOR_PLURAL = { college: "Colleges", district: "Districts", agency: "Agencies", vendor: "Vendors", co: "Chancellor's Office", other: "Other" };
  var FOR_ORDER = ["college", "district", "agency", "vendor", "co", "other"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var HERO_MS = 7000;
  var state = { rows: null, error: null, q: "", forName: "all", sort: "recent" };
  var hero = { i: 0, timer: null, paused: false, live: false };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : "";
  }
  function forWord(r) { return r.for_kind === "other" ? (r.for_category || "Other") : (FOR_KIND[r.for_kind] || ""); }
  function matches(r) {
    if (state.forName !== "all" && r.for_name !== state.forName) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [r.title, r.occasion, r.summary, (r.topics || []).join(" "), r.for_name, forWord(r), KIND[r.kind]].join(" ").toLowerCase().indexOf(q) !== -1;
  }
  // Most recent first by the date a piece was made; a piece with no date goes last.
  // Ties, and Title A–Z, read the title.
  function byTitle(a, b) { return String(a.title || "").localeCompare(String(b.title || ""), "en", { sensitivity: "base" }); }
  function sorted(list) {
    var by = state.sort;
    return list.slice().sort(function (a, b) {
      if (by === "title") return byTitle(a, b);
      var da = a.made_on || "", db = b.made_on || "";
      if (da !== db) {
        if (!da) return 1;
        if (!db) return -1;
        return (by === "oldest" ? da < db : da > db) ? -1 : 1;
      }
      return byTitle(a, b);
    });
  }
  // For: the names present, grouped by kind when the pieces are made for more than one
  // kind. It does not paint when no listed piece names who it is for.
  function renderFor() {
    var names = document.getElementById("lib-ent"), wrap = document.getElementById("lib-for-wrap");
    if (!names) return;
    var groups = {}, seen = {};
    (state.rows || []).forEach(function (r) {
      if (!r.for_kind || !r.for_name || seen[r.for_name]) return;
      seen[r.for_name] = true;
      (groups[r.for_kind] = groups[r.for_kind] || []).push(r.for_name);
    });
    var kinds = FOR_ORDER.filter(function (k) { return groups[k]; });
    function opt(n) { return '<option value="' + esc(n) + '"' + (state.forName === n ? " selected" : "") + ">" + esc(n) + "</option>"; }
    var body = kinds.length > 1
      ? kinds.map(function (k) { return '<optgroup label="' + esc(FOR_PLURAL[k]) + '">' + groups[k].sort().map(opt).join("") + "</optgroup>"; }).join("")
      : kinds.length ? groups[kinds[0]].sort().map(opt).join("") : "";
    names.innerHTML = '<option value="all"' + (state.forName === "all" ? " selected" : "") + ">Everyone</option>" + body;
    if (wrap) wrap.hidden = !kinds.length;
  }
  function render() {
    var grid = document.getElementById("lib-grid"), st = document.getElementById("lib-state");
    if (!grid || !st) return;
    if (state.error) { st.textContent = state.error; grid.innerHTML = ""; return; }
    if (!state.rows) { st.textContent = "Loading the library…"; grid.innerHTML = ""; return; }
    var list = sorted(state.rows.filter(matches));
    st.textContent = !state.rows.length ? "The library has no pieces listed yet."
      : list.length === state.rows.length ? state.rows.length + (state.rows.length === 1 ? " piece" : " pieces")
      : list.length + " of " + state.rows.length + " pieces match";
    grid.innerHTML = list.map(function (r) {
      var safe = /^https:\/\//.test(r.url || "");
      var madeFor = r.for_kind ? (r.for_name ? "For " + r.for_name : "Made for " + forWord(r)) : "";
      var title = esc(r.title);
      return '<article class="piece"><div class="meta">' + esc(KIND[r.kind] || r.kind) + (r.made_on ? " · " + esc(fmtDate(r.made_on)) : "") + "</div>" +
        "<h2>" + (safe ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + title + '<span class="sr-only"> (opens in a new tab)</span></a>' : title) + "</h2>" +
        (madeFor ? '<div class="for">' + esc(madeFor) + "</div>" : "") +
        (r.occasion ? '<p class="occ">' + esc(r.occasion) + "</p>" : "") +
        (r.summary ? '<p class="sum">' + esc(r.summary) + "</p>" : "") +
        (safe ? '<span class="go" aria-hidden="true">' + esc(OPEN[r.kind] || "Open") + "</span>" : "") +
        "</article>";
    }).join("");
  }
  function paint() { renderFor(); render(); }

  // ── The hero photos ──────────────────────────────────────────────────────
  function slides() { var h = document.getElementById("lib-hero"); return h ? h.querySelectorAll(".hero-slide") : []; }
  function prime(img) { if (img && !img.getAttribute("src") && img.getAttribute("data-src")) img.setAttribute("src", img.getAttribute("data-src")); }
  function heroShow(n) {
    var s = slides();
    if (s.length < 2) return;
    var next = ((n % s.length) + s.length) % s.length;
    prime(s[next]); prime(s[(next + 1) % s.length]);
    Array.prototype.forEach.call(s, function (el, k) { el.classList.toggle("is-on", k === next); });
    hero.i = next;
  }
  function heroStop() { if (hero.timer) window.clearInterval(hero.timer); hero.timer = null; }
  function paintPause() { var b = document.getElementById("lib-hero-pause"); if (b) b.textContent = hero.paused ? "Play photos" : "Pause photos"; }
  function heroPlay() { heroStop(); hero.paused = false; hero.timer = window.setInterval(function () { heroShow(hero.i + 1); }, HERO_MS); paintPause(); }
  function heroPause() { heroStop(); hero.paused = true; paintPause(); }
  function heroInit() {
    var s = slides(), b = document.getElementById("lib-hero-pause");
    var still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (s.length < 2 || still) { if (b) b.hidden = true; return; }
    hero.live = true;
    prime(s[1]);
    if (b) {
      b.hidden = false;
      b.addEventListener("click", function () { if (hero.paused) heroPlay(); else heroPause(); });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) heroStop(); else if (!hero.paused) heroPlay();
    });
    heroPlay();
  }

  function load() {
    return window.fetch(RPC, {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON }
    }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }).then(function (rows) {
      state.rows = Array.isArray(rows) ? rows : []; state.error = null;
      paint();
    }).catch(function (e) {
      state.rows = null;
      state.error = "The library could not be loaded just now (" + (e && e.message ? e.message : "network") + "). Please try again shortly.";
      render();
    });
  }
  function init() {
    var q = document.getElementById("lib-q");
    if (q) q.addEventListener("input", function () { state.q = q.value; render(); });
    var ent = document.getElementById("lib-ent");
    if (ent) ent.addEventListener("change", function () { state.forName = ent.value; render(); });
    var sort = document.getElementById("lib-sort");
    if (sort) { sort.value = state.sort; sort.addEventListener("change", function () { state.sort = sort.value; render(); }); }
    heroInit();
    return load();
  }
  window.CPL_PUBLIC_LIBRARY = { init: init, load: load, render: render, paint: paint, _state: state, _matches: matches, _sorted: sorted,
    _hero: { show: heroShow, play: heroPlay, pause: heroPause, state: hero } };
  if (typeof document !== "undefined" && document.readyState !== "loading") init();
  else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
})();
