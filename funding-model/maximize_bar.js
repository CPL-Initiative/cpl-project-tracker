/*
 * funding-model/maximize_bar.js — HOW TO MAXIMIZE FUNDING, a panel beside the institution table on the public funding
 * page (Sam, 2026-11-25). The team heard that newcomers to CPL "wanted to know what is moving and could move their
 * Funds Qualified so far"; Sam approved the mock ("sidebar looks great!") with the link on the priority's own line,
 * named "How to maximize funding", and a Get Help in Office Hours link to MAP's Get Involved page.
 *
 * A credit priority row in an institution's detail carries the link (cpl_funding.js maximizeBtnHtml, .cf-maxbtn,
 * data-max-key). The panel reads that row's figures from the model (CPL_FUNDING_TAB.maximizeInfo) and shows:
 *   Where you stand     a 0–100 bar (one bar, its number beside it: Sam, 2026-11-24), qualified of max, remaining.
 *   What the model counts  the priority's measure in the scenario's words, the institution's units, and roughly how
 *                       many more units reach the max where the units-to-FTES ratio is known.
 *   Next steps          the priority's recommended strategies. A strategy about the CPL landing page moves to
 *                       Already in place when the institution's landing page is on file; the rest stay as steps.
 *   Links               Get Help in Office Hours (MAP's Get Involved page) and Priority N Strategies (the Priority
 *                       Outcomes & Strategies section, #outcomes); minimum conditions links #requirements.
 *
 * The house sidebar rules (Sam, 2026-11-22 and 11-23): it opens beside the view, never over it (the page gives up its
 * width; below 900px it covers), resizes from its inner edge (drag, or the arrow keys on the grip) and stops where
 * 360px of the view is left, and its top row (the title and Close) stays put while its body scrolls. Inside COBI's
 * frame it sits in the visible part of the frame, as funding-model/college_bar.js does. Escape closes it and focus
 * returns to the link. Nothing is remembered across visits.
 */
(function () {
  "use strict";
  var doc = document;
  var MIN_W = 320, VIEW_LEFT = 360, NARROW = 900;
  var OFFICE_HOURS = "https://map.rccd.edu/get-involved/";
  // Sierra's mark, Mt Whitney's east-face ridge (sierra/whitney-mark.svg), as a blue ridgeline on the white panel
  // (Sam, 2026-11-25: "use the sierra logo with white background and blue ridgeline"). The white snow patch of her
  // navy version has nothing to show against white, so the line stands alone. A static string, never input.
  var SIERRA_RIDGE = '<svg viewBox="0 0 120 34" aria-hidden="true" focusable="false"><path d="M2 30 L12 25 21 17 29 9 ' +
    '35 4 40 1 43 6 46 4 49 9 52 7 55 11 59 15 63 19 66 22 70 18 73 20 76 15 79 13 82 16 85 20 90 24 97 27 105 29 118 30" ' +
    'fill="none" stroke="var(--heading, #082B61)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  var panel = null, body = null, title = null, opener = null, w = 460, curKey = null, curInfo = null;

  function outer() {
    try {
      var fe = window.frameElement;
      if (fe && window.parent && window.parent !== window && window.parent.document) return { fe: fe, win: window.parent };
    } catch (e) { /* another origin */ }
    return null;
  }
  function view() {
    var o = outer(), sy = window.scrollY || window.pageYOffset || 0;
    if (!o) return { framed: false, top: sy, height: window.innerHeight || 900 };
    var r = o.fe.getBoundingClientRect(), pvh = o.win.innerHeight || 900;
    var visTop = Math.max(0, -r.top), visBottom = Math.min(r.height, pvh - r.top);
    return { framed: true, top: sy + visTop, height: Math.max(200, visBottom - visTop) };
  }
  function vw() { return doc.documentElement.clientWidth || window.innerWidth || 1280; }
  function narrow() { return vw() < NARROW; }
  function clampW(v) { return Math.max(MIN_W, Math.min(Math.max(MIN_W, vw() - VIEW_LEFT), Math.round(v))); }

  function ensureCss() {
    if (doc.getElementById("mbar-css")) return;
    var st = doc.createElement("style");
    st.id = "mbar-css";
    st.textContent = [
      ".mbar{position:fixed; top:0; right:0; bottom:0; z-index:61; display:flex; background:var(--surface-opaque);",
      "  border-left:1px solid var(--border-strong); box-shadow:-6px 0 18px color-mix(in srgb, var(--text-strong) 12%, transparent)}",
      ".mbar[hidden]{display:none}",
      ".mbar-grip{flex:none; width:12px; padding:0; border:0; border-right:1px solid var(--border); background:var(--tint-cobalt);",
      "  cursor:col-resize; display:flex; align-items:center; justify-content:center; touch-action:none}",
      ".mbar-grip::before{content:''; height:44px; border-left:2px dotted var(--text-muted)}",
      ".mbar-in{flex:1; min-width:0; display:flex; flex-direction:column}",
      ".mbar-top{flex:none; display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid var(--border)}",
      ".mbar-title{flex:1; min-width:0; margin:0; font-family:var(--serif); font-size:1.1rem; color:var(--heading, var(--text-strong))}",
      ".mbar-close{font:inherit; color:var(--cobalt); background:none; border:0; padding:0 2px; min-height:24px;",
      "  text-decoration:underline; text-underline-offset:3px; cursor:pointer}",
      ".mbar-body{flex:1; min-height:0; overflow:auto; padding:16px 20px 28px; font-size:.97rem; line-height:1.5; color:var(--text-body)}",
      ".mbar-body h3{margin:18px 0 6px; font-size:1rem; color:var(--heading, var(--text-strong))}",
      ".mbar-body h3:first-child{margin-top:0}",
      ".mbar-body p{margin:6px 0 0}",
      ".mbar-body ol, .mbar-body ul{margin:4px 0 0; padding-left:22px}",
      ".mbar-body li{margin:0 0 8px}",
      ".mbar-done{color:var(--text-muted)}",
      ".mbar-bar{display:flex; align-items:center; gap:10px}",
      ".mbar-track{flex:1; height:10px; border-radius:5px; background:var(--tint-cobalt); border:1px solid var(--border-strong); overflow:hidden}",
      ".mbar-fill{height:100%; background:var(--cobalt)}",
      ".mbar-pct{font-weight:700; font-variant-numeric:tabular-nums}",
      ".mbar-note{color:var(--text-muted)}",
      ".mbar-links{display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px; margin-top:22px}",
      ".mbar-sierra{display:inline-flex; align-items:center; gap:6px; font:inherit; color:var(--cobalt); background:none; border:0;",
      "  padding:0 2px; min-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer}",
      ".mbar-sierra svg{flex:none; width:40px; height:12px; overflow:visible}",
      ".mbar-grip:focus-visible, .mbar-close:focus-visible, .mbar-links a:focus-visible, .mbar-sierra:focus-visible{outline:3px solid var(--focus-ring); outline-offset:-2px}",
      "body.mbar-on{padding-right:var(--mbar-w, 0px)}",
      "body.mbar-drag, body.mbar-drag *{cursor:col-resize !important; user-select:none}",
      "body.mbar-drag iframe{pointer-events:none}",
      "@media (max-width:899px){ body.mbar-on{padding-right:0} .mbar{left:0; width:auto !important} .mbar-grip{display:none} }",
      "@media print{ .mbar{display:none !important} body.mbar-on{padding-right:0} }"
    ].join("\n");
    doc.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(v) { return "$" + Math.round(v || 0).toLocaleString("en-US"); }
  function num1(v) { return (Math.round((v || 0) * 10) / 10).toLocaleString("en-US"); }

  // The panel's words, from the row's figures alone.
  function html(m) {
    var pct = m.maxFunds > 0 ? Math.max(0, Math.min(100, Math.round(100 * m.actualFunds / m.maxFunds))) : 0;
    var out = [];
    out.push("<h3>Where you stand</h3>");
    if (m.maxFunds > 0) {
      out.push('<div class="mbar-bar"><div class="mbar-track" role="img" aria-label="' + pct + ' percent of the max">' +
        '<div class="mbar-fill" style="width:' + pct + '%"></div></div><span class="mbar-pct">' + pct + "%</span></div>");
      out.push("<p>" + esc(money(m.actualFunds) + " qualified of a " + money(m.maxFunds) + " max. " +
        money(Math.max(0, m.maxFunds - m.actualFunds)) + " remaining." +
        (m.withNc ? " Both include the noncredit share." : "")) + "</p>");
    } else {
      out.push("<p>This priority carries no funding for " + esc(m.college) + " in the published scenario.</p>");
    }
    if (m.gated) out.push('<p class="mbar-note">The figures show in gray until ' + esc(m.college) + " meets its " +
      (doc.getElementById("requirements") ? '<a href="#requirements" class="mbar-req">minimum conditions</a>' : "minimum conditions") +
      "; meeting them comes first.</p>");
    out.push("<h3>What the model counts</h3>");
    var counts = m.counts || m.measure;
    if (counts) out.push("<p>" + esc(counts) + (m.measure && m.measure !== counts ? " (MAP measure: " + esc(m.measure) + ")" : "") + ".</p>");
    if (m.none) out.push("<p>No units of this measure are in MAP for " + esc(m.college) + " yet, so it qualifies for none of this priority's funding.</p>");
    else if (m.units) out.push("<p>" + esc(m.units) + "</p>");
    if (m.actCount != null && m.maxCount > 0) {
      var gap = Math.max(0, m.maxCount - m.actCount), line;
      if (gap <= 0) line = "The max is reached: this priority counts up to 100%.";
      else if (m.inFtes) {
        line = num1(m.actCount) + " of the " + num1(m.maxCount) + " Max FTES.";
        if (m.unitsPerFtes) line += " About " + Math.ceil(gap * m.unitsPerFtes).toLocaleString("en-US") +
          " more units in MAP reach the max.";
      } else {
        line = Math.round(m.actCount).toLocaleString("en-US") + " of the " + Math.round(m.maxCount).toLocaleString("en-US") +
          " students the max counts. About " + Math.ceil(gap).toLocaleString("en-US") + " more reach it.";
      }
      out.push('<p class="mbar-note">' + esc(line) + "</p>");
    }
    var next = [], done = [];
    (m.strategies || []).forEach(function (s) {
      if (m.landingPage && /landing page/i.test(s) && /configure/i.test(s)) done.push(s); else next.push(s);
    });
    if (next.length) {
      out.push("<h3>Next steps for " + esc(m.college) + "</h3><ol>" +
        next.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>");
    }
    if (done.length) {
      out.push("<h3>Already in place</h3><ul class=\"mbar-done\">" +
        done.map(function (s) { return "<li>" + esc(s) + " (on file in MAP)</li>"; }).join("") + "</ul>");
    }
    // The priority's strategies on the page (Sam, 2026-11-25: "change the label to 'Priority 1 Strategies'").
    var stratLabel = (String(m.prioLabel || "").replace(/\s*\(.*$/, "") || "Priority") + " Strategies";
    // Ask Sierra, with her mark (Sam, 2026-11-25: "add the sierra logo to the ask sierra link"), where the page carries
    // her side bar (../sierra/sidebar.js). She answers from the knowledge base, not the funding figures, so the
    // question is about the priority's work, not the college's numbers.
    var sierra = window.CPL_SIERRA_BAR && typeof window.CPL_SIERRA_BAR.ask === "function";
    out.push('<div class="mbar-links"><a href="' + OFFICE_HOURS + '" target="_blank" rel="noopener">Get Help in Office Hours</a>' +
      (doc.getElementById("outcomes") ? '<a href="#outcomes" class="mbar-strat">' + esc(stratLabel) + "</a>" : "") +
      (sierra ? '<button type="button" class="mbar-sierra">' + SIERRA_RIDGE +
        "Ask Sierra about this priority</button>" : "") + "</div>");
    return out.join("");
  }

  function build() {
    ensureCss();
    panel = doc.createElement("aside");
    panel.className = "mbar";
    panel.id = "maximizeBar";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "mbarTitle");
    panel.innerHTML =
      '<button type="button" class="mbar-grip" role="separator" aria-orientation="vertical" aria-valuemin="' + MIN_W +
        '" aria-label="Resize the panel. Left and Right make it wider or narrower."></button>' +
      '<div class="mbar-in"><div class="mbar-top"><h2 class="mbar-title" id="mbarTitle" tabindex="-1"></h2>' +
      '<button type="button" class="mbar-close">Close</button></div><div class="mbar-body"></div></div>';
    doc.body.appendChild(panel);
    body = panel.querySelector(".mbar-body");
    title = panel.querySelector(".mbar-title");
    panel.querySelector(".mbar-close").addEventListener("click", close);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Esc") close(); });
    body.addEventListener("click", function (e) {
      var sb = e.target && e.target.closest ? e.target.closest(".mbar-sierra") : null;
      if (sb && curInfo) {
        var q = "What can " + curInfo.college + " do to raise its CPL outcomes for " +
          String(curInfo.label || "").replace(/^Priority \d+ \(CR\):?\s*/, "") + "?";
        close();
        window.CPL_SIERRA_BAR.ask(q, sb);
        return;
      }
      var a = e.target && e.target.closest ? e.target.closest(".mbar-strat, .mbar-req") : null;
      if (!a) return;
      var sec = doc.getElementById(a.classList.contains("mbar-strat") ? "outcomes" : "requirements");
      var d = sec && sec.querySelector("details.fold");
      if (d && !d.open) d.open = true;
    });
    var grip = panel.querySelector(".mbar-grip");
    grip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); setW(w + 40); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setW(w - 40); }
    });
    grip.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var x0 = e.clientX, w0 = w;
      doc.body.classList.add("mbar-drag");
      function mv(ev) { setW(w0 + (x0 - ev.clientX)); }
      function up() {
        doc.body.classList.remove("mbar-drag");
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      }
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
    window.addEventListener("resize", function () { if (isOpen()) setW(w); });
    var o = outer();
    if (o) {
      o.win.addEventListener("scroll", place, true);
      o.win.addEventListener("resize", function () { if (isOpen()) setW(w); });
    }
  }

  // The landing-page bar along the bottom (college_bar.js) keeps its own room: the panel stops above it.
  function barRoom() {
    var B = window.CPL_COLLEGE_BAR;
    return (B && typeof B.isOpen === "function" && B.isOpen() && typeof B.height === "function") ? (B.height() || 0) : 0;
  }
  function place() {
    if (!panel || panel.hidden) return;
    var v = view(), room = barRoom();
    if (v.framed) {
      panel.style.position = "absolute";
      panel.style.top = Math.round(v.top) + "px";
      panel.style.bottom = "auto";
      panel.style.height = Math.max(200, v.height - room) + "px";
    } else {
      panel.style.position = "";
      panel.style.top = "";
      panel.style.height = "";
      panel.style.bottom = room ? room + "px" : "";
    }
  }
  function setW(v) {
    w = clampW(v);
    if (!panel) return;
    panel.style.width = w + "px";
    doc.body.style.setProperty("--mbar-w", (narrow() ? 0 : w) + "px");
    var g = panel.querySelector(".mbar-grip");
    if (g) g.setAttribute("aria-valuenow", String(w));
    place();
  }
  function isOpen() { return !!panel && !panel.hidden; }

  function open(key, from) {
    var T = window.CPL_FUNDING_TAB;
    var m = T && typeof T.maximizeInfo === "function" ? T.maximizeInfo(key) : null;
    if (!m) return false;
    if (!panel) build();
    opener = from || null;
    curKey = key;
    curInfo = m;
    title.textContent = m.college + " · " + m.label;
    body.innerHTML = html(m);
    body.scrollTop = 0;
    panel.hidden = false;
    doc.body.classList.add("mbar-on");
    setW(w);
    try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
    return true;
  }
  function close() {
    if (!isOpen()) return;
    panel.hidden = true;
    curKey = null;
    doc.body.classList.remove("mbar-on");
    var back = opener;
    opener = null;
    if (back && !doc.body.contains(back)) {
      // The table redrew: the same priority's link in the open detail, found by its label.
      var lab = back.getAttribute("data-max-label");
      back = null;
      Array.prototype.some.call(doc.querySelectorAll(".cf-maxbtn[data-max-label]"), function (b) {
        if (b.getAttribute("data-max-label") === lab && b.offsetParent !== null) { back = b; return true; }
        return false;
      });
    }
    if (back && typeof back.focus === "function") back.focus();
  }

  // One listener for every row's link. The row's own click (open or close the detail) does not fire for it.
  doc.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".cf-maxbtn[data-max-key]") : null;
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    open(b.getAttribute("data-max-key"), b);
  }, true);

  window.CPL_MAXIMIZE_BAR = {
    open: open, close: close, isOpen: isOpen,
    width: function () { return w; }, setWidth: setW,
    key: function () { return curKey; }
  };
})();
