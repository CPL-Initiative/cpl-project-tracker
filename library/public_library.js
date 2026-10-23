// public_library.js — the public CPL Library page (library/index.html).
//
// Reads the listed pieces live through cpl_library_public() (anon, public fields
// only; kb/supabase_cpl_library_public.sql). A failed read says so and paints no
// list rather than a partial one. Who a piece is made for (Sam, Open Asks Sheet 120
// card 4, 2026-10-23) shows on each card and filters the page: a Made for chip
// appears only for a type with a listed piece, and For lists the names present.
// Test: tests/public_library.test.js
(function () {
  "use strict";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var RPC = SUPABASE_URL + "/rest/v1/rpc/cpl_library_public";
  var KIND = { visual: "Visual", deck: "Slides", film: "Film", document: "Document", spreadsheet: "Spreadsheet" };
  var KIND_ORDER = ["visual", "document", "deck", "film", "spreadsheet"];
  var FOR_KIND = { college: "College", district: "District", agency: "Agency", vendor: "Vendor", co: "Chancellor's Office", other: "Other" };
  var FOR_PLURAL = { college: "Colleges", district: "Districts", agency: "Agencies", vendor: "Vendors", co: "Chancellor's Office", other: "Other" };
  var FOR_ORDER = ["college", "district", "agency", "vendor", "co", "other"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var state = { rows: null, error: null, q: "", kind: "all", madeFor: "all", forName: "all" };

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
    if (state.kind !== "all" && r.kind !== state.kind) return false;
    if (state.madeFor !== "all" && r.for_kind !== state.madeFor) return false;
    if (state.forName !== "all" && r.for_name !== state.forName) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [r.title, r.occasion, r.summary, (r.topics || []).join(" "), r.for_name, forWord(r)].join(" ").toLowerCase().indexOf(q) !== -1;
  }
  function renderKinds() {
    var host = document.getElementById("lib-kinds");
    if (!host) return;
    var present = {};
    (state.rows || []).forEach(function (r) { present[r.kind] = true; });
    var kinds = ["all"].concat(KIND_ORDER.filter(function (k) { return present[k]; }));
    host.innerHTML = kinds.length > 2 ? kinds.map(function (k) {
      return '<button type="button" class="word" data-kind="' + k + '" aria-pressed="' + (state.kind === k) + '">' + (k === "all" ? "All" : KIND[k]) + "</button>";
    }).join("") : "";
  }
  // Who the pieces are made for: a chip per type with a listed piece, and a For list
  // of the names present. Neither paints when no listed piece says who it is for.
  function renderFor() {
    var chips = document.getElementById("lib-for"), names = document.getElementById("lib-ent"), wrap = document.getElementById("lib-for-wrap");
    if (!chips || !names) return;
    var present = {}, seen = {}, list = [];
    (state.rows || []).forEach(function (r) {
      if (r.for_kind) present[r.for_kind] = true;
      if (r.for_name && !seen[r.for_name]) { seen[r.for_name] = true; list.push(r.for_name); }
    });
    var kinds = FOR_ORDER.filter(function (k) { return present[k]; });
    chips.innerHTML = kinds.length ? ["all"].concat(kinds).map(function (k) {
      return '<button type="button" class="word" data-madefor="' + k + '" aria-pressed="' + (state.madeFor === k) + '">' + esc(k === "all" ? "All" : FOR_PLURAL[k]) + "</button>";
    }).join("") : "";
    list.sort();
    names.innerHTML = '<option value="all"' + (state.forName === "all" ? " selected" : "") + ">Everyone</option>" + list.map(function (n) {
      return '<option value="' + esc(n) + '"' + (state.forName === n ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("");
    if (wrap) wrap.hidden = !kinds.length;
  }
  function render() {
    var grid = document.getElementById("lib-grid"), st = document.getElementById("lib-state");
    if (!grid || !st) return;
    if (state.error) { st.textContent = state.error; grid.innerHTML = ""; return; }
    if (!state.rows) { st.textContent = "Loading the library…"; grid.innerHTML = ""; return; }
    var list = state.rows.filter(matches);
    st.textContent = !state.rows.length ? "The library has no pieces listed yet."
      : list.length === state.rows.length ? state.rows.length + (state.rows.length === 1 ? " piece" : " pieces")
      : list.length + " of " + state.rows.length + " pieces match";
    grid.innerHTML = list.map(function (r) {
      var safe = /^https:\/\//.test(r.url || "");
      var madeFor = r.for_kind ? (r.for_name ? "For " + r.for_name : "Made for " + forWord(r)) : "";
      return '<article class="piece"><div class="meta">' + esc(KIND[r.kind] || r.kind) + (r.made_on ? " · " + esc(fmtDate(r.made_on)) : "") +
        (madeFor ? " · <b>" + esc(madeFor) + "</b>" : "") + "</div>" +
        "<h2>" + esc(r.title) + "</h2>" +
        (r.occasion ? '<div class="meta">' + esc(r.occasion) + "</div>" : "") +
        "<p>" + esc(r.summary) + "</p>" +
        (safe ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">Open ' + esc(r.title) + "</a>" : "") +
        "</article>";
    }).join("");
  }
  function load() {
    return window.fetch(RPC, {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON }
    }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }).then(function (rows) {
      state.rows = Array.isArray(rows) ? rows : []; state.error = null;
      renderKinds(); renderFor(); render();
    }).catch(function (e) {
      state.rows = null;
      state.error = "The library could not be loaded just now (" + (e && e.message ? e.message : "network") + "). Please try again shortly.";
      render();
    });
  }
  function init() {
    var q = document.getElementById("lib-q");
    if (q) q.addEventListener("input", function () { state.q = q.value; render(); });
    var kinds = document.getElementById("lib-kinds");
    if (kinds) kinds.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-kind]") : null;
      if (!b) return;
      state.kind = b.getAttribute("data-kind"); renderKinds(); render();
    });
    var madeFor = document.getElementById("lib-for");
    if (madeFor) madeFor.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-madefor]") : null;
      if (!b) return;
      state.madeFor = b.getAttribute("data-madefor"); renderFor(); render();
    });
    var ent = document.getElementById("lib-ent");
    if (ent) ent.addEventListener("change", function () { state.forName = ent.value; render(); });
    return load();
  }
  window.CPL_PUBLIC_LIBRARY = { init: init, load: load, render: render, _state: state, _matches: matches };
  if (typeof document !== "undefined" && document.readyState !== "loading") init();
  else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
})();
