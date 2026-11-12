/*
 * COBI — the First Light tab (window.CPL_FIRST_LIGHT_TAB), #first-light.
 *
 * Sam, 2026-11-12 (#3153, relayed by COBIx): "add a cobi tab so I can edit it", "this is where we should
 * list our photos we cycle on our cobi views as well", and "make it so I can add more photos from our my cpl
 * story series or other collections". Phase A, this file: the sets, to see. Three views, each with an address:
 *
 *   #first-light/paintings  the daily paintings, read from the window's own manifest (window.CPL_FIRST_LIGHT,
 *                           first_light.js). Today's painting and the next seven days come from the window's
 *                           paintingForDay and localDayNumber, called here, never restated.
 *   #first-light/photos     the photos that cycle at the top of the CPL Library, the Credential Catalog and
 *                           CPL Pathways' statewide view: library/photos/hero_photos.json, the one list. The
 *                           three views still hold their own copies until phase B points them here;
 *                           tests/first_light_tab.test.js fails if a copy differs from the file.
 *   #first-light/sierra     Sierra shows no images for now (Sam, 2026-11-12); the works in
 *                           sierra/art/manifest.json are the set that would play if they return.
 *
 * Editing (add, drop, reorder, Apply opens a pull request) is phase B. Nothing here writes anywhere.
 *
 * GATE. A personal sign-in (CPL_SESSION, fresh). Everything this tab shows is a public file in the repo, so the
 * gate is about who the tab is for, not about protecting data: signed out, the pane offers the shared sign-in
 * box and draws no set. The menu hides the item from signed-out visitors through the cobi_nav row
 * (audience magic_link; the receipt cobi_nav_first_light_magic_link_2026-11-12_s642.sql), the same rung.
 *
 * THE DOOR. This file loads with the page (it is small) so it can add one underlined word-link, "Edit the
 * rotation", to the painting-of-the-day window for a signed-in reviewer, opening #first-light/paintings.
 * first_light.js is left untouched; the hidden almanac review stays as it is.
 *
 * A filter lasts the visit (CLAUDE.md: tabs never remember a filter). CSS injected here, tokens only.
 * Tests: tests/first_light_tab.test.js.
 */
(function () {
  "use strict";

  var TAB = "first-light";
  var VIEWS = [
    { id: "paintings", label: "Daily paintings" },
    { id: "photos", label: "View photos" },
    { id: "sierra", label: "Sierra" }
  ];
  var HERO_URL = "library/photos/hero_photos.json";
  var HERO_DIR = "library/photos/";
  var SIERRA_URL = "sierra/art/manifest.json";
  var SIERRA_DIR = "sierra/art/";
  var EDIT_LINE = "Editing arrives next: add, drop and reorder here, and Apply opens a pull request.";

  var state = {
    view: "paintings",
    q: "",
    hero: null, heroErr: null, heroLoading: null,
    sierra: null, sierraErr: null, sierraLoading: null
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── who is looking ─────────────────────────────────────────────────── */
  function signedIn() {
    var S = window.CPL_SESSION;
    if (!S || typeof S.get !== "function") return false;
    try { return !!S.get() && (typeof S.isFresh !== "function" || S.isFresh()); } catch (e) { return false; }
  }

  /* ── the window's rotation, read through its own functions ──────────── */
  function fl() {
    var F = window.CPL_FIRST_LIGHT;
    return F && F.paintings && typeof F.paintingForDay === "function" && typeof F.localDayNumber === "function" ? F : null;
  }
  // The window's day number for a date, by its own function: localDayNumber reads new Date(), so the offset
  // from today is added to it rather than the arithmetic copied here.
  function schedule(days) {
    var F = fl();
    if (!F) return [];
    var base = F.localDayNumber(), now = new Date(), out = [];
    for (var k = 0; k <= days; k++) {
      out.push({
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + k),
        painting: F.paintingForDay(base + k)
      });
    }
    return out;
  }
  function dayLabel(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
  // The window's own image, asked for at card size (Wikimedia's FilePath takes ?width=).
  function thumb(src) {
    var s = String(src || "");
    return /[?&]width=\d+/.test(s) ? s.replace(/([?&]width=)\d+/, "$1480") : s;
  }

  /* ── the two files ──────────────────────────────────────────────────── */
  function noFetch() { return typeof window.fetch !== "function" ? Promise.reject(new Error("this page cannot read files")) : null; }
  function json(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
  function loadHero() {
    if (state.heroLoading) return state.heroLoading;
    state.heroLoading = (noFetch() || window.fetch(HERO_URL, { cache: "no-cache" }).then(json)).then(function (d) {
      state.hero = d && Array.isArray(d.photos) ? d : null;
      if (!state.hero) state.heroErr = "the file holds no photos";
    }, function (e) { state.heroErr = (e && e.message) || "the read failed"; });
    return state.heroLoading;
  }
  function loadSierra() {
    if (state.sierraLoading) return state.sierraLoading;
    state.sierraLoading = (noFetch() || window.fetch(SIERRA_URL, { cache: "no-cache" }).then(json)).then(function (d) {
      state.sierra = d && Array.isArray(d.paintings) ? d : null;
      if (!state.sierra) state.sierraErr = "the file holds no paintings";
    }, function (e) { state.sierraErr = (e && e.message) || "the read failed"; });
    return state.sierraLoading;
  }

  /* ── look ───────────────────────────────────────────────────────────── */
  function ensureCss() {
    if (document.getElementById("flt-css")) return;
    var st = document.createElement("style");
    st.id = "flt-css";
    st.textContent = [
      "#first-light-root{color:var(--text-body);}",
      ".flt-h{font-size:1.25rem;margin:0 0 6px;color:var(--text-strong);}",
      ".flt-views{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 14px;padding:0;list-style:none;}",
      ".flt-views a,.flt-door{display:inline-flex;align-items:center;min-height:24px;color:var(--accent-link);" +
        "text-decoration:underline;text-underline-offset:3px;font-size:.92rem;}",
      ".flt-views a[aria-current=page]{color:var(--text-strong);font-weight:600;text-decoration-thickness:2px;}",
      ".flt-views a:focus-visible,.flt-door:focus-visible,.flt-filter input:focus-visible{outline:2px solid var(--accent-link);outline-offset:2px;}",
      ".flt-p{margin:0 0 8px;max-width:var(--cpl-measure,none);color:var(--text-body);font-size:.95rem;line-height:1.5;}",
      ".flt-note{margin:0 0 16px;max-width:var(--cpl-measure,none);color:var(--text-muted);font-size:.88rem;}",
      ".flt-h3{font-size:1rem;margin:18px 0 8px;color:var(--text-strong);}",
      ".flt-today{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:16px;align-items:start;" +
        "border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--surface-opaque);margin:0 0 6px;}",
      ".flt-today img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:var(--surface-subtle);border-radius:6px;display:block;}",
      ".flt-today .flt-t{font-size:1.05rem;font-weight:600;color:var(--text-strong);margin:2px 0;}",
      ".flt-count{font-size:.88rem;color:var(--text-muted);margin:6px 0 0;}",
      ".flt-next{margin:0;padding:0 0 0 1.2em;font-size:.9rem;}",
      ".flt-next li{margin:3px 0;overflow-wrap:anywhere;}",
      ".flt-filter{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:14px 0 10px;}",
      ".flt-filter label{font-size:.88rem;color:var(--text-body);}",
      ".flt-filter input{flex:1 1 220px;max-width:360px;min-height:32px;box-sizing:border-box;padding:4px 8px;font:inherit;font-size:.9rem;" +
        "border:1px solid var(--border-strong);border-radius:6px;background:var(--surface-opaque);color:var(--text-body);}",
      ".flt-shown{font-size:.85rem;color:var(--text-muted);}",
      ".flt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin:0;padding:0;list-style:none;}",
      ".flt-card{min-width:0;border:1px solid var(--border);border-radius:10px;background:var(--surface-opaque);overflow:hidden;display:flex;flex-direction:column;}",
      ".flt-card img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:var(--surface-subtle);display:block;}",
      ".flt-card .flt-body{padding:10px 12px 12px;min-width:0;}",
      ".flt-card h3{font-size:.95rem;margin:0 0 3px;color:var(--text-strong);overflow-wrap:anywhere;}",
      ".flt-meta{font-size:.84rem;color:var(--text-body);margin:0 0 4px;overflow-wrap:anywhere;}",
      ".flt-alt{font-size:.82rem;color:var(--text-muted);margin:4px 0 0;overflow-wrap:anywhere;}",
      ".flt-pos{font-size:.78rem;color:var(--text-muted);margin:0 0 3px;}",
      ".flt-err{border-left:3px solid var(--border-strong);padding:8px 12px;background:var(--surface-subtle);font-size:.9rem;max-width:var(--cpl-measure,none);}",
      ".flt-gate{max-width:var(--cpl-measure,none);}",
      ".flt-noimg{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;" +
        "background:var(--surface-subtle);color:var(--text-muted);font-size:.82rem;text-align:center;}",
      ".cplfl-actions .flt-door{font-size:.85rem;}",
      "@media (max-width:560px){.flt-today{grid-template-columns:minmax(0,1fr);}.flt-grid{grid-template-columns:minmax(0,1fr);}}",
      "@media (prefers-reduced-motion:reduce){#first-light-root *{transition:none!important;animation:none!important;}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ── address ────────────────────────────────────────────────────────── */
  function viewFor(parts) {
    var v = parts && parts[0];
    for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i].id === v) return v;
    return "paintings";
  }
  if (window.CPL_SESSION && window.CPL_SESSION.viewAddress) {
    window.CPL_SESSION.viewAddress(TAB, function () { return TAB + "/" + state.view; });
  }
  /* A visit (the first, one after another tab, or a new address) reads the address and clears the filter:
     a filter lasts the visit only. */
  var away = true, seenHash = null;
  function arrive() {
    var h = String(location.hash || ""), visit = away || h !== seenHash;
    away = false; seenHash = h;
    if (!visit) return;
    var a = window.CPL_SESSION && window.CPL_SESSION.arrival ? window.CPL_SESSION.arrival(TAB) : null;
    state.view = viewFor(a);
    state.q = "";
  }

  /* ── views ──────────────────────────────────────────────────────────── */
  function viewsNav() {
    return '<nav aria-label="First Light views"><ul class="flt-views">' + VIEWS.map(function (v) {
      return '<li><a href="#' + TAB + "/" + v.id + '"' + (v.id === state.view ? ' aria-current="page"' : "") + ">" +
        esc(v.label) + "</a></li>";
    }).join("") + "</ul></nav>";
  }
  function edit() { return '<p class="flt-note">' + esc(EDIT_LINE) + "</p>"; }

  function matches(p, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return String(p.title || "").toLowerCase().indexOf(q) !== -1 || String(p.artist || "").toLowerCase().indexOf(q) !== -1;
  }
  function paintingCard(p, i, n, isToday) {
    return '<li class="flt-card" data-painting="' + i + '">' +
      '<img src="' + esc(thumb(p.img)) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
      '<div class="flt-body"><p class="flt-pos">Number ' + (i + 1) + " of " + n + (isToday ? ", today" : "") + "</p>" +
      "<h3>" + esc(p.title) + "</h3>" +
      '<p class="flt-meta">' + esc(p.artist) + ", " + esc(p.year) + "</p>" +
      '<p class="flt-alt">Description: ' + esc(p.alt) + "</p></div></li>";
  }
  function gridOf(list, all, today) {
    var n = all.length;
    return list.map(function (p) { var i = all.indexOf(p); return paintingCard(p, i, n, p === today); }).join("");
  }
  function paintingsView() {
    var F = fl();
    var h = '<p class="flt-p">One painting greets everyone who opens COBI each day, the same painting for everyone on the same day. ' +
      "The rotation runs through the list below in order, one a day, and starts again after the last.</p>" + edit();
    if (!F) return h + '<p class="flt-err">The painting window did not load on this page, so its rotation cannot be listed.</p>';
    var all = F.paintings, n = all.length, sch = schedule(7), today = sch[0].painting;
    h += '<section aria-labelledby="flt-today-h"><h3 class="flt-h3" id="flt-today-h">Today, ' + esc(dayLabel(sch[0].date)) + "</h3>" +
      '<div class="flt-today"><img src="' + esc(thumb(today.img)) + '" alt="' + esc(today.alt) + '" decoding="async">' +
      '<div><p class="flt-t" data-today>' + esc(today.title) + "</p>" +
      '<p class="flt-meta">' + esc(today.artist) + ", " + esc(today.year) + "</p>" +
      '<p class="flt-alt">Description: ' + esc(today.alt) + "</p>" +
      '<p class="flt-count" data-count>' + n + " paintings in the rotation.</p></div></div></section>";
    h += '<section aria-labelledby="flt-next-h"><h3 class="flt-h3" id="flt-next-h">The next seven days</h3><ol class="flt-next" data-next>' +
      sch.slice(1).map(function (s) {
        return "<li>" + esc(dayLabel(s.date)) + ": " + esc(s.painting.title) + ", " + esc(s.painting.artist) + "</li>";
      }).join("") + "</ol></section>";
    var shown = all.filter(function (p) { return matches(p, state.q.trim()); });
    h += '<section aria-labelledby="flt-all-h"><h3 class="flt-h3" id="flt-all-h">Every painting in the rotation</h3>' +
      '<div class="flt-filter"><label for="flt-q">Filter by artist or title</label>' +
      '<input id="flt-q" type="search" autocomplete="off" value="' + esc(state.q) + '">' +
      '<span class="flt-shown" id="flt-shown" role="status">' + shownText(shown.length, n) + "</span></div>" +
      '<ul class="flt-grid" id="flt-grid" data-grid="paintings">' + gridOf(shown, all, today) + "</ul></section>";
    return h;
  }
  function shownText(k, n) { return k === n ? "Showing all " + n + "." : "Showing " + k + " of " + n + "."; }

  function photosView() {
    var h = "";
    var d = state.hero;
    if (!d) {
      return '<p class="flt-p">The photos that cycle at the top of the CPL Library, the Credential Catalog and CPL Pathways’ statewide view.</p>' +
        edit() + (state.heroErr ? '<p class="flt-err">The photo list could not be read (' + esc(state.heroErr) + ").</p>"
          : '<p class="flt-note" role="status">Reading the photo list…</p>');
    }
    var names = {};
    (d.views || []).forEach(function (v) { names[v.id] = v.name; });
    var secs = Math.round((d.pace_ms || 0) / 1000);
    h += '<p class="flt-p">' + d.photos.length + " photos cycle at the top of " + esc(listWords((d.views || []).map(function (v) { return v.name; }))) +
      ", in this order, a new photo every " + secs + " seconds. On those pages the photos are decoration and carry no description; " +
      "the descriptions here are for this list.</p>" + edit();
    h += '<ul class="flt-grid" data-grid="photos">' + d.photos.map(function (p, i) {
      return '<li class="flt-card" data-photo="' + esc(p.file) + '">' +
        '<img src="' + esc(HERO_DIR + p.file) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async" width="' + esc(p.width) + '" height="' + esc(p.height) + '">' +
        '<div class="flt-body"><p class="flt-pos">Photo ' + (i + 1) + " of " + d.photos.length + "</p>" +
        "<h3>" + esc(p.file) + "</h3>" +
        '<p class="flt-meta">Plays on: ' + esc(listWords((p.plays || []).map(function (id) { return names[id] || id; }))) + "</p>" +
        '<p class="flt-meta">From: ' + esc(p.source) + "</p>" +
        '<p class="flt-alt">Description: ' + esc(p.alt) + "</p></div></li>";
    }).join("") + "</ul>";
    return h;
  }
  function listWords(a) {
    if (a.length < 2) return a.join("");
    return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }

  function sierraView() {
    var h = '<p class="flt-p">Sierra shows no images for now (Sam, 2026-11-12). Her page has shown none since 2026-10-24, when it took the ' +
      "Library’s look: a white page with starter questions where the paintings were, and the CPL Initiative logo in the footer.</p>" +
      '<p class="flt-p">The works below are the set that would play if paintings return. Their images sit in the repo beside the list ' +
      "(sierra/art/), so the public page would load nothing from another site.</p>" + edit();
    var d = state.sierra;
    if (!d) {
      return h + (state.sierraErr ? '<p class="flt-err">Sierra’s list could not be read (' + esc(state.sierraErr) + ").</p>"
        : '<p class="flt-note" role="status">Reading Sierra’s list…</p>');
    }
    h += '<ul class="flt-grid" data-grid="sierra">' + d.paintings.map(function (p, i) {
      return '<li class="flt-card" data-sierra="' + esc(p.slug) + '">' +
        '<img src="' + esc(SIERRA_DIR + p.slug + "-800.webp") + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
        '<div class="flt-body"><p class="flt-pos">Number ' + (i + 1) + " of " + d.paintings.length + "</p>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="flt-meta">' + esc(p.artist) + ", " + esc(p.year) + "</p>" +
        '<p class="flt-meta">' + esc(p.collection) + "</p>" +
        '<p class="flt-alt">Description: ' + esc(p.alt) + "</p></div></li>";
    }).join("") + "</ul>";
    return h;
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  function root() { return document.getElementById("first-light-root"); }
  function render() {
    var el = root();
    if (!el) return;
    ensureCss();
    el.removeAttribute("style");
    var h = '<h2 class="flt-h">First Light</h2>';
    if (!signedIn()) {
      el.innerHTML = h + '<div class="flt-gate"><p class="flt-p">This tab lists the daily paintings and the photos that cycle on COBI’s views. ' +
        "It opens with a personal sign-in.</p><div class=\"flt-signin\"></div></div>";
      try {
        var host = el.querySelector(".flt-signin");
        if (host && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
          window.CPL_REVIEWER_SIGNIN.mountInto(host, { title: "Sign in", returnTab: TAB });
        }
      } catch (e) { /* the sentence above still stands on its own */ }
      return;
    }
    h += viewsNav();
    if (state.view === "photos") h += photosView();
    else if (state.view === "sierra") h += sierraView();
    else h += paintingsView();
    el.innerHTML = h;
    wireFilter(el);
    wireImageFallback(el);
    if (state.view === "photos" && !state.hero && !state.heroErr) loadHero().then(maybeRender);
    if (state.view === "sierra" && !state.sierra && !state.sierraErr) loadSierra().then(maybeRender);
  }
  function maybeRender() { if (isActive()) render(); }
  function wireFilter(el) {
    var q = el.querySelector("#flt-q");
    if (!q) return;
    q.addEventListener("input", function () {
      state.q = q.value;
      var F = fl();
      if (!F) return;
      var all = F.paintings, today = F.paintingForDay(F.localDayNumber());
      var shown = all.filter(function (p) { return matches(p, state.q.trim()); });
      var grid = el.querySelector("#flt-grid"), note = el.querySelector("#flt-shown");
      if (grid) grid.innerHTML = gridOf(shown, all, today);
      if (note) note.textContent = shownText(shown.length, all.length);
    });
  }
  /* An image that cannot load (the paintings come from Wikimedia Commons, which a network can block) gives way to
     a plain panel; the card's description already says what the picture shows. */
  function wireImageFallback(el) {
    if (el.getAttribute("data-flt-img") === "1") return;
    el.setAttribute("data-flt-img", "1");
    el.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || img.tagName !== "IMG" || !img.parentNode) return;
      var d = document.createElement("div");
      d.className = "flt-noimg";
      d.textContent = "The image did not load on this network.";
      img.parentNode.replaceChild(d, img);
    }, true);
  }
  function isActive() {
    try { return window.CPL_TABS && typeof window.CPL_TABS.current === "function" ? window.CPL_TABS.current() === TAB : !!(root() && root().offsetParent !== null); }
    catch (e) { return false; }
  }
  function activate() { arrive(); render(); }

  window.addEventListener("cpl-tab-activated", function (e) {
    var t = e && e.detail && e.detail.tab;
    if (t === TAB) activate(); else away = true;
  });
  function onSession() { syncDoor(); if (isActive()) render(); }
  window.addEventListener("cpl-session-changed", onSession);
  window.addEventListener("cpl-auth-change", onSession);

  /* ── the door in the painting-of-the-day window ─────────────────────── */
  function syncDoor() {
    var actions = document.querySelector(".cplfl-overlay .cplfl-actions");
    if (!actions) return;
    var door = document.getElementById("flt-door");
    if (!door) {
      ensureCss();
      door = document.createElement("a");
      door.id = "flt-door";
      door.className = "flt-door";
      door.href = "#" + TAB + "/paintings";
      door.textContent = "Edit the rotation";
      door.addEventListener("click", function () {
        try { if (window.CPL_FIRST_LIGHT && window.CPL_FIRST_LIGHT.close) window.CPL_FIRST_LIGHT.close(); } catch (e) { /* the link still goes */ }
      });
      var msg = actions.querySelector(".cplfl-reflect-msg");
      actions.insertBefore(door, msg || null);
    }
    door.hidden = !signedIn();
  }
  function watchWindow() {
    syncDoor();
    if (typeof window.MutationObserver !== "function" || !document.body) return;
    // The window builds its dialog the first time it opens, and toggles .open each time after.
    var seen = null;
    new window.MutationObserver(function () {
      var ov = document.querySelector(".cplfl-overlay");
      if (ov && ov !== seen) {
        seen = ov;
        new window.MutationObserver(syncDoor).observe(ov, { attributes: true, attributeFilter: ["class"] });
      }
      syncDoor();
    }).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchWindow);
  else watchWindow();

  window.CPL_FIRST_LIGHT_TAB = {
    activate: activate,
    render: render,
    syncDoor: syncDoor,
    schedule: schedule,
    _state: state,
    HERO_URL: HERO_URL,
    SIERRA_URL: SIERRA_URL
  };
})();
