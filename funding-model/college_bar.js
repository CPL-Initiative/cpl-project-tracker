/*
 * funding-model/college_bar.js — THE COLLEGE'S CPL LANDING PAGE IN A BOTTOM BAR on the public funding page (Sam,
 * 2026-11-25, on the mock the team reviewed: "maybe it would be better to have it be a bottom bar that could span the
 * width and be as tall as it needs to be", then "that's much better!"; and "make sure the whole lp, including the
 * course cards will show").
 *
 * A college's name in the institution table (cpl_funding.js nameButtonHtml: .cf-lpname, data-lp-url, data-lp-name)
 * opens that college's own CPL landing page from MAP, live in a frame, in a bar along the bottom of the window at its
 * full width. Its top row also carries How to Configure the College Landing Page (the training video the Contents
 * links) and Configure Landing Page in MAP (MAP's sign-in, where a college edits its page). The bar's top edge resizes it (drag, or Up and Down on the grip) from 160px to the whole window; the
 * page gives up the bar's height at its foot so nothing under it is out of reach. Its top row stays put: the college,
 * the two links (each a new tab), and Close. Escape closes it from inside the bar, and focus returns to the name.
 *
 * WHY A FRAME CAN HOLD IT: MAP's landing pages send no X-Frame-Options and no frame-ancestors (checked 2026-11-25 on
 * cpldashboardcccco.azurewebsites.net/norcocollege, which rendered whole in a frame, course cards included). The
 * page is MAP's, so the frame scrolls inside the bar; its height is not readable across origins, which is why the
 * bar is resizable to the whole window rather than sized to its content.
 *
 * Never remembered across visits (Sam, 2026-10-21: tabs forget), the height included.
 */
(function () {
  "use strict";
  var doc = document;
  var MIN_H = 160;
  // Configure Landing Page in MAP (Sam, 2026-11-25: "lead to the MAP login button on the MAP Dashboard at
  // https://cpldashboardcccco.azurewebsites.net/insights/dashboard"): the address that button opens, MAP's sign-in.
  var MAP_SIGN_IN = "https://mappingarticulatedpathways.azurewebsites.net/modules/security/Login.aspx";
  // How to Configure the College Landing Page (same day: "leads to the video linked in the dash toc"): read from the
  // Contents link at open time, so an edit to that link (edit_page.js, curateLinks) carries here.
  var HOWTO_FALLBACK = "../prototype/landing_page_video/";
  function howtoUrl() {
    var a = document.getElementById("training-link");
    return (a && a.getAttribute("href")) || HOWTO_FALLBACK;
  }
  var bar = null, frame = null, title = null, openLink = null, opener = null, h = 0;

  function clampH(v) { return Math.max(MIN_H, Math.min(window.innerHeight || 900, Math.round(v))); }
  function defaultH() { return clampH((window.innerHeight || 900) * 0.62); }

  function ensureCss() {
    if (doc.getElementById("cbar-css")) return;
    var st = doc.createElement("style");
    st.id = "cbar-css";
    st.textContent = [
      ".cbar{position:fixed; left:0; right:0; bottom:0; z-index:60; display:flex; flex-direction:column;",
      "  background:var(--surface-opaque); border-top:1px solid var(--border-strong);",
      "  box-shadow:0 -6px 18px color-mix(in srgb, var(--text-strong) 14%, transparent)}",
      ".cbar[hidden]{display:none}",
      ".cbar-grip{flex:none; display:flex; align-items:center; justify-content:center; width:100%; height:14px; padding:0;",
      "  border:0; border-bottom:1px solid var(--border); background:var(--tint-cobalt); cursor:row-resize; touch-action:none}",
      ".cbar-grip::before{content:''; width:48px; border-top:2px dotted var(--text-muted)}",
      ".cbar-grip:focus-visible, .cbar-close:focus-visible, .cbar-open:focus-visible{outline:3px solid var(--focus-ring); outline-offset:-3px}",
      ".cbar-top{flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:6px 20px; padding:8px clamp(12px,3vw,24px);",
      "  border-bottom:1px solid var(--border); background:var(--surface-opaque)}",
      ".cbar-title{flex:1 1 auto; min-width:0; margin:0; font-family:var(--serif); font-size:1.15rem; color:var(--heading, var(--text-strong))}",
      ".cbar-open, .cbar-close{font:inherit; font-size:.95rem; color:var(--cobalt); background:none; border:0; padding:0 2px;",
      "  min-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer}",
      ".cbar-open:hover, .cbar-close:hover{text-decoration-thickness:2px}",
      ".cbar-frame{flex:1 1 auto; min-height:0; width:100%; border:0; background:var(--surface-opaque)}",
      "body.cbar-on{padding-bottom:var(--cbar-h, 0px)}",
      "body.cbar-drag, body.cbar-drag *{cursor:row-resize !important; user-select:none}",
      "body.cbar-drag .cbar-frame{pointer-events:none}",
      "@media print{ .cbar{display:none !important} body.cbar-on{padding-bottom:0} }"
    ].join("\n");
    doc.head.appendChild(st);
  }

  function setH(v) {
    h = clampH(v);
    if (!bar) return;
    bar.style.height = h + "px";
    doc.body.style.setProperty("--cbar-h", h + "px");
    var g = bar.querySelector(".cbar-grip");
    if (g) g.setAttribute("aria-valuenow", String(h));
  }

  function build() {
    ensureCss();
    bar = doc.createElement("section");
    bar.className = "cbar";
    bar.id = "collegeBar";
    bar.hidden = true;
    bar.setAttribute("aria-labelledby", "cbarTitle");
    bar.innerHTML =
      '<button type="button" class="cbar-grip" role="separator" aria-orientation="horizontal" aria-valuemin="' + MIN_H +
        '" aria-label="Resize the bar. Up and Down make it taller or shorter."></button>' +
      '<div class="cbar-top"><h2 class="cbar-title" id="cbarTitle" tabindex="-1"></h2>' +
      '<a class="cbar-open cbar-howto" target="_blank" rel="noopener">How to Configure the College Landing Page</a>' +
      '<a class="cbar-open cbar-map" target="_blank" rel="noopener" href="' + MAP_SIGN_IN + '">Configure Landing Page in MAP</a>' +
      '<button type="button" class="cbar-close">Close</button></div>' +
      '<iframe class="cbar-frame" referrerpolicy="no-referrer"></iframe>';
    doc.body.appendChild(bar);
    frame = bar.querySelector(".cbar-frame");
    title = bar.querySelector(".cbar-title");
    openLink = bar.querySelector(".cbar-howto");
    bar.querySelector(".cbar-close").addEventListener("click", close);
    bar.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Esc") close(); });
    var grip = bar.querySelector(".cbar-grip");
    grip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { e.preventDefault(); setH(h + 60); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setH(h - 60); }
      else if (e.key === "Home") { e.preventDefault(); setH(window.innerHeight || 900); }
      else if (e.key === "End") { e.preventDefault(); setH(MIN_H); }
    });
    grip.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var y0 = e.clientY, h0 = h;
      doc.body.classList.add("cbar-drag");
      function mv(ev) { setH(h0 + (y0 - ev.clientY)); }
      function up() {
        doc.body.classList.remove("cbar-drag");
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      }
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
    window.addEventListener("resize", function () { if (bar && !bar.hidden) setH(h); });
  }

  // MAP's field is typed by hand: only an https address reaches the frame (cpl_funding.js httpsUrl checks it too).
  function safeUrl(u) { u = String(u || "").trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ""; }

  function open(url, name, from) {
    url = safeUrl(url);
    if (!url) return false;
    if (!bar) build();
    opener = from || null;
    title.textContent = (name || "College") + ": CPL landing page";
    openLink.href = howtoUrl();
    frame.title = (name || "College") + " CPL landing page, from MAP";
    if (frame.getAttribute("src") !== url) frame.setAttribute("src", url);
    var first = bar.hidden;
    bar.hidden = false;
    doc.body.classList.add("cbar-on");
    setH(first && !h ? defaultH() : (h || defaultH()));
    try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
    // Keep the clicked row in sight above the bar.
    if (from && typeof from.getBoundingClientRect === "function") {
      var r = from.getBoundingClientRect(), room = (window.innerHeight || 900) - h;
      if (r.bottom > room - 8 && typeof window.scrollBy === "function") window.scrollBy(0, r.bottom - room + 48);
    }
    return true;
  }

  function close() {
    if (!bar || bar.hidden) return;
    bar.hidden = true;
    doc.body.classList.remove("cbar-on");
    frame.setAttribute("src", "about:blank");
    var back = opener;
    opener = null;
    // The table may have redrawn: find the same college's name again.
    if (back && !doc.body.contains(back)) {
      var nm = back.getAttribute("data-lp-name");
      back = nm ? doc.querySelector('.cf-lpname[data-lp-name="' + (window.CSS && CSS.escape ? CSS.escape(nm) : nm) + '"]') : null;
    }
    if (back && typeof back.focus === "function") back.focus();
  }

  // One listener for every name, whatever the table redraws.
  doc.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".cf-lpname[data-lp-url]") : null;
    if (!b) return;
    if (open(b.getAttribute("data-lp-url"), b.getAttribute("data-lp-name"), b)) e.preventDefault();
  });

  window.CPL_COLLEGE_BAR = {
    open: open,
    close: close,
    isOpen: function () { return !!bar && !bar.hidden; },
    height: function () { return h; },
    setHeight: setH
  };
})();
