// public_library.js — the public CPL Library page (library/index.html).
//
// Reads the listed pieces live through cpl_library_public() (anon, public fields
// only; kb/supabase_cpl_library_public.sql). A failed read says so and paints no
// list rather than a partial one. Test: tests/public_library.test.js
(function () {
  "use strict";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var RPC = SUPABASE_URL + "/rest/v1/rpc/cpl_library_public";
  var KIND = { deck: "Slides", film: "Film", document: "Document", spreadsheet: "Spreadsheet" };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var state = { rows: null, error: null, q: "", kind: "all" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : "";
  }
  function matches(r) {
    if (state.kind !== "all" && r.kind !== state.kind) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [r.title, r.occasion, r.summary, (r.topics || []).join(" ")].join(" ").toLowerCase().indexOf(q) !== -1;
  }
  function renderKinds() {
    var host = document.getElementById("lib-kinds");
    if (!host) return;
    var present = {};
    (state.rows || []).forEach(function (r) { present[r.kind] = true; });
    var kinds = ["all"].concat(["deck", "film", "document", "spreadsheet"].filter(function (k) { return present[k]; }));
    host.innerHTML = kinds.length > 2 ? kinds.map(function (k) {
      return '<button type="button" class="word" data-kind="' + k + '" aria-pressed="' + (state.kind === k) + '">' + (k === "all" ? "All" : KIND[k]) + "</button>";
    }).join("") : "";
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
      return '<article class="piece"><div class="meta">' + esc(KIND[r.kind] || r.kind) + (r.made_on ? " · " + esc(fmtDate(r.made_on)) : "") + "</div>" +
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
      renderKinds(); render();
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
    return load();
  }
  window.CPL_PUBLIC_LIBRARY = { init: init, load: load, render: render, _state: state, _matches: matches };
  if (typeof document !== "undefined" && document.readyState !== "loading") init();
  else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
})();
