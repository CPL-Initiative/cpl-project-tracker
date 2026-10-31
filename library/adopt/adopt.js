/* The public adoption page (library/adopt/): settled credentials, the colleges that award credit for
 * each, and Request Quick Adopt in MAP. Sam, Open Asks Sheet 147 (2026-10-31), cards 1, 3 and 4.
 *
 * Reads adopt_data.json (kb/_build_adopt_page.py). Writes nothing and remembers no filter (Sam,
 * 2026-10-21); ?college=<name> opens on one college, and the address follows the College pick so a
 * link can be sent. Could adopt is the course a college already teaches under the credential's
 * identity, never the TOP or C-ID overlap (Sam, 2026-09-24).
 *
 * window.CPL_ADOPT exposes the pure parts (scope, match, rows, csv) for tests/public_adopt.test.js.
 */
(function () {
  "use strict";

  var DATA_URL = "./adopt_data.json";
  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";  // map_links.js MAP_PAGE
  var MAP_VIEW = "&View=Non-Military";
  var HANDOUT = "../cpl-opportunity/?college=";
  var PAGE = 40;       // cards drawn at a time
  var CHIPS = 6;       // Request Quick Adopt chips before "and N more"
  var ROW_H = 44;      // the matrix row height, px (CSS .mx tbody tr)
  var OVERSCAN = 12;   // rows drawn past the viewport, each side

  var D = null;
  var state = { view: "list", shown: PAGE, rows: [], cols: [] };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function units(u) { u = Number(u || 0); return (Math.round(u * 10) / 10).toString(); }
  function plural(n, one, many) { return fmt(n) + " " + (n === 1 ? one : many); }
  function mapUrl(id) { return MAP_PAGE + "?Exhibit=" + encodeURIComponent(id) + MAP_VIEW; }

  /* ── The pure parts ─────────────────────────────────────────────────────────────── */

  // The colleges the college filters leave, as a set of indexes; null when no college filter is set.
  function scope(data, f) {
    if (!f.college && !f.region && !f.area && !f.district) return null;
    var out = {};
    data.colleges.forEach(function (c, i) {
      if (f.college && c[0] !== f.college) return;
      if (f.district && c[2] !== f.district) return;
      if (f.region && c[3] !== f.region) return;
      if (f.area && c[4] !== f.area) return;
      out[i] = true;
    });
    return out;
  }

  function inScope(sc, i) { return !sc || sc[i] === true; }

  // Show: "open" = articulated somewhere, by no college in the scope (what the scope can adopt);
  // "here" = articulated by a college in the scope; "all" = every settled credential.
  function match(cred, f, sc) {
    if (f.q) {
      var hay = (cred.t + " " + (cred.i || "")).toLowerCase();
      var words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) return false;
    }
    if (f.sector && cred.s !== f.sector) return false;
    if (f.type !== "" && f.type != null && (cred.y || []).indexOf(Number(f.type)) < 0) return false;
    if (!sc) return true;
    var here = cred.a.some(function (a) { return sc[a[0]]; });
    if (f.show === "here") return here;
    if (f.show === "open") return !here && cred.a.length > 0;
    return true;
  }

  function rows(data, f) {
    var sc = scope(data, f);
    var out = data.credentials.filter(function (c) { return match(c, f, sc); });
    out.sort(function (x, y) {
      // A college's own course first (it teaches a matching course), then the most colleges.
      if (sc) {
        var cx = (x.c || []).some(function (c) { return sc[c[0]]; }) ? 1 : 0;
        var cy = (y.c || []).some(function (c) { return sc[c[0]]; }) ? 1 : 0;
        if (cx !== cy) return cy - cx;
      }
      return (y.a.length - x.a.length) || x.t.localeCompare(y.t);
    });
    return out;
  }

  function cols(data, f) {
    var sc = scope(data, f);
    var out = [];
    data.colleges.forEach(function (c, i) { if (inScope(sc, i)) out.push(i); });
    return out;
  }

  function csvCell(v) {
    v = String(v == null ? "" : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function csvList(data, list) {
    var head = ["Credential", "Issuer", "CPL types", "Field (CIP sector)", "Colleges that award credit",
      "Median units", "Awarded at", "Already teach a matching course", "MAP exhibits (Request Quick Adopt)"];
    var lines = [head.map(csvCell).join(",")];
    list.forEach(function (c) {
      lines.push([
        c.t, c.i || "", (c.y || []).map(function (i) { return data.types[i]; }).join("; "),
        c.s ? c.s + " " + (data.sectors[c.s] || "") : "", c.a.length, c.p == null ? "" : units(c.p),
        c.a.map(function (a) { return data.colleges[a[0]][0] + " (" + units(a[1]) + ")"; }).join("; "),
        (c.c || []).map(function (x) { return data.colleges[x[0]][0] + (x[1] ? " (" + x[1] + ")" : ""); }).join("; "),
        (c.m || []).map(function (m) { return m[0] + " " + mapUrl(m[0]); }).join("; ")
      ].map(csvCell).join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }

  function csvMatrix(data, list, columns) {
    var lines = [["Credential"].concat(columns.map(function (i) { return data.colleges[i][0]; })).map(csvCell).join(",")];
    list.forEach(function (c) {
      var art = {}, could = {};
      c.a.forEach(function (a) { art[a[0]] = a[1]; });
      (c.c || []).forEach(function (x) { could[x[0]] = true; });
      lines.push([c.t].concat(columns.map(function (i) {
        return i in art ? units(art[i]) : (could[i] ? "C" : "");
      })).map(csvCell).join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }

  /* ── Reading the filters ────────────────────────────────────────────────────────── */

  function filters() {
    return {
      q: ($("ad-q").value || "").trim(),
      college: $("ad-college").value, show: $("ad-show").value,
      sector: $("ad-sector").value, type: $("ad-type").value,
      region: $("ad-region").value, area: $("ad-area").value, district: $("ad-district").value
    };
  }

  function scopeName(f) {
    if (f.college) return f.college;
    var parts = [];
    if (f.district) parts.push(f.district);
    if (f.region) parts.push(f.region);
    if (f.area) parts.push("ASCCC Area " + f.area);
    return parts.join(", ");
  }

  function fillSelect(sel, values, label) {
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v[0]; o.textContent = label ? label(v) : v[1];
      sel.appendChild(o);
    });
  }

  function uniq(arr) { return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }).sort(); }

  function setShowOptions(f) {
    var sel = $("ad-show"), keep = sel.value, name = scopeName(f);
    var opts = name
      ? [["open", "Not adopted yet"], ["here", "Adopted here"], ["all", "Every credential"]]
      : [["all", "Every credential"]];
    sel.innerHTML = "";
    fillSelect(sel, opts);
    // A scope newly picked opens on what it has not adopted, the page's question.
    var fresh = name && !state.scopeName;
    sel.value = !fresh && opts.some(function (o) { return o[0] === keep; }) ? keep : opts[0][0];
    state.scopeName = name;
    sel.disabled = !name;
  }

  /* ── The Credentials view ───────────────────────────────────────────────────────── */

  function quickAdopt(c, sc) {
    var ms = (c.m || []).slice();
    if (!ms.length) return "";
    // One chip per building college; the scope's own colleges are never offered to themselves.
    var seen = {}, chips = [];
    ms.forEach(function (m) {
      if (sc && m[1] >= 0 && sc[m[1]]) return;
      var who = m[1] >= 0 ? D.colleges[m[1]][1] : (m[2] || "MAP");
      if (seen[who]) return;
      seen[who] = true;
      chips.push('<a class="chip" href="' + esc(mapUrl(m[0])) + '" target="_blank" rel="noopener">' + esc(who)
        + '<span class="sr-only"> built exhibit ' + esc(m[0]) + ', Request Quick Adopt in MAP</span></a>');
    });
    if (!chips.length) return "";
    var more = chips.length - CHIPS;
    return '<div class="chips"><span class="lbl">Request Quick Adopt from</span>' + chips.slice(0, CHIPS).join("")
      + (more > 0 ? '<span class="more">and ' + plural(more, "more college", "more colleges") + "</span>" : "") + "</div>";
  }

  function card(c, sc, f) {
    var types = (c.y || []).map(function (i) { return D.types[i]; }).join(", ");
    var meta = [c.i, types, c.s ? D.sectors[c.s] : ""].filter(Boolean).join(" · ");
    var n = c.a.length;
    var says = n
      ? plural(n, "college awards", "colleges award") + " credit for it" + (c.p != null ? ", " + units(c.p) + " units at the median college." : ".")
      : "No college awards credit for it yet.";
    var mine = sc ? (c.c || []).filter(function (x) { return sc[x[0]]; }) : [];
    var here = sc ? c.a.filter(function (a) { return sc[a[0]]; }) : [];
    var html = '<article class="cred"><h3>' + esc(c.t) + "</h3>";
    if (meta) html += '<p class="meta">' + esc(meta) + "</p>";
    if (f.college && here.length) html += '<span class="here">Adopted here: ' + esc(units(here[0][1])) + " units</span>";
    if (mine.length) {
      html += '<span class="here">' + (f.college ? "Already teaches " + esc(mine[0][1] || "a matching course")
        : plural(mine.length, "college here teaches", "colleges here teach") + " a matching course") + "</span>";
    }
    html += '<p class="says">' + esc(says) + "</p>" + quickAdopt(c, sc);
    if (n) {
      html += "<details><summary>See the colleges and their credit</summary><table><colgroup><col class=\"c1\"><col class=\"c2\"><col></colgroup>"
        + '<thead><tr><th scope="col">College</th><th scope="col">Units</th><th scope="col">Courses and credit</th></tr></thead><tbody>';
      c.a.forEach(function (a) {
        html += '<tr><th scope="row">' + esc(D.colleges[a[0]][1]) + "</th><td>" + esc(units(a[1])) + "</td><td>" + esc(a[2]) + "</td></tr>";
      });
      html += "</tbody></table>";
      var could = (c.c || []).filter(function (x) { return !sc || sc[x[0]]; });
      if (could.length && !f.college) {
        html += '<p class="meta">Already teach a matching course: ' + esc(could.map(function (x) { return D.colleges[x[0]][1]; }).join(", ")) + "</p>";
      }
      if (c.w) html += '<p class="meta">' + esc(plural(c.w, "more college teaches", "more colleges teach")) + " a course under a broader identity, not named here.</p>";
      html += "</details>";
    }
    return html + "</article>";
  }

  function drawList(f) {
    var sc = scope(D, f), list = state.rows;
    $("ad-list").innerHTML = list.slice(0, state.shown).map(function (c) { return card(c, sc, f); }).join("");
    $("ad-empty").hidden = list.length > 0;
    var left = list.length - state.shown;
    $("ad-more").hidden = left <= 0;
    if (left > 0) $("ad-more").textContent = "Show " + Math.min(PAGE, left) + " more of " + fmt(left);
  }

  /* ── The College matrix: a window over the rows ─────────────────────────────────── */

  var mx = { first: -1, last: -1, focus: null };

  function cellOf(c, col) {
    for (var i = 0; i < c.a.length; i++) if (c.a[i][0] === col) return { kind: "art", a: c.a[i] };
    var cs = c.c || [];
    for (var j = 0; j < cs.length; j++) if (cs[j][0] === col) return { kind: "could", c: cs[j] };
    return null;
  }

  function buildMatrix() {
    var wrap = $("ad-mx-wrap");
    var cs = state.cols;
    var colw = '<col style="width:clamp(180px,24vw,300px)">' + cs.map(function () { return '<col style="width:34px">'; }).join("");
    var head = '<tr><th class="corner" scope="col">Credential</th>' + cs.map(function (i) {
      return '<th class="ch" scope="col" title="' + esc(D.colleges[i][0]) + '">' + esc(D.colleges[i][1]) + "</th>";
    }).join("") + "</tr>";
    wrap.innerHTML = '<table class="mx" style="width:calc(clamp(180px,24vw,300px) + ' + (cs.length * 34) + 'px)"><colgroup>' + colw
      + "</colgroup><thead>" + head + '</thead><tbody id="ad-mx-body"></tbody></table><div class="tip" id="ad-tip" role="tooltip" hidden></div>';
    mx.first = mx.last = -1;
    drawWindow(true);
  }

  function drawWindow(force) {
    var wrap = $("ad-mx-wrap"), body = $("ad-mx-body");
    if (!body) return;
    var n = state.rows.length, cs = state.cols;
    var top = Math.max(0, wrap.scrollTop - 150);
    var first = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
    var last = Math.min(n, Math.ceil((top + (wrap.clientHeight || 600)) / ROW_H) + OVERSCAN);
    if (!force && first === mx.first && last === mx.last) return;
    mx.first = first; mx.last = last;
    var span = cs.length + 1;
    var html = first > 0 ? '<tr class="spacer" style="height:' + (first * ROW_H) + 'px"><td colspan="' + span + '"></td></tr>' : "";
    for (var r = first; r < last; r++) {
      var c = state.rows[r];
      html += '<tr data-r="' + r + '"><th scope="row" title="' + esc(c.t) + '"><span>' + esc(c.t) + "</span></th>";
      for (var k = 0; k < cs.length; k++) {
        var cell = cellOf(c, cs[k]);
        var tab = mx.focus && mx.focus[0] === r && mx.focus[1] === k ? "0" : "-1";
        if (!cell) { html += '<td data-k="' + k + '" tabindex="' + tab + '"><span class="sr-only">none</span></td>'; continue; }
        if (cell.kind === "art") html += '<td class="art" data-k="' + k + '" tabindex="' + tab + '">' + esc(units(cell.a[1])) + "</td>";
        else html += '<td class="could" data-k="' + k + '" tabindex="' + tab + '">C<span class="sr-only"> already teaches a matching course</span></td>';
      }
      html += "</tr>";
    }
    if (last < n) html += '<tr class="spacer" style="height:' + ((n - last) * ROW_H) + 'px"><td colspan="' + span + '"></td></tr>';
    if (!n) html = '<tr><td colspan="' + span + '" class="empty">No credential matches these filters.</td></tr>';
    body.innerHTML = html;
    if (!mx.focus && n) {
      var firstCell = body.querySelector("tr[data-r] td");
      if (firstCell) firstCell.setAttribute("tabindex", "0");
    }
  }

  function tipFor(td) {
    var tr = td.parentNode, r = Number(tr.getAttribute("data-r")), k = Number(td.getAttribute("data-k"));
    var c = state.rows[r], col = state.cols[k];
    if (!c || col == null) return "";
    var cell = cellOf(c, col), who = D.colleges[col][0];
    if (!cell) return "<b>" + esc(who) + "</b><br>" + esc(c.t) + ": not adopted yet.";
    if (cell.kind === "art") return "<b>" + esc(who) + "</b><br>" + esc(c.t) + ": " + esc(units(cell.a[1])) + " units<br>" + esc(cell.a[2]);
    return "<b>" + esc(who) + "</b><br>" + esc(c.t) + ": not adopted yet. Already teaches " + esc(cell.c[1] || "a matching course") + ".";
  }

  function showTip(td) {
    var tip = $("ad-tip"), wrap = $("ad-mx-wrap");
    if (!tip || !td || td.tagName !== "TD" || !td.parentNode.hasAttribute("data-r")) return;
    tip.innerHTML = tipFor(td);
    tip.hidden = false;
    var w = wrap.getBoundingClientRect(), b = td.getBoundingClientRect();
    var left = b.left - w.left + wrap.scrollLeft + b.width + 6;
    if (left + 300 > wrap.scrollLeft + wrap.clientWidth) left = Math.max(wrap.scrollLeft, b.left - w.left + wrap.scrollLeft - 310);
    tip.style.left = left + "px";
    tip.style.top = (b.top - w.top + wrap.scrollTop) + "px";
    if (!td.id) td.id = "ad-cell-" + td.parentNode.getAttribute("data-r") + "-" + td.getAttribute("data-k");
    td.setAttribute("aria-describedby", "ad-tip");
  }
  function hideTip() { var t = $("ad-tip"); if (t) t.hidden = true; }

  function focusCell(r, k) {
    var n = state.rows.length, m = state.cols.length;
    if (!n || !m) return;
    r = Math.max(0, Math.min(n - 1, r)); k = Math.max(0, Math.min(m - 1, k));
    mx.focus = [r, k];
    var wrap = $("ad-mx-wrap");
    var rowTop = r * ROW_H;
    if (rowTop < wrap.scrollTop + 150 - ROW_H || rowTop > wrap.scrollTop + wrap.clientHeight - ROW_H * 2) {
      wrap.scrollTop = Math.max(0, rowTop - wrap.clientHeight / 2);
    }
    drawWindow(true);
    var td = document.querySelector('#ad-mx-body tr[data-r="' + r + '"] td[data-k="' + k + '"]');
    if (td) { td.focus(); showTip(td); }
  }

  /* ── Drawing ────────────────────────────────────────────────────────────────────── */

  function draw(resetPaging) {
    var f = filters();
    setShowOptions(f);
    f = filters();
    if (resetPaging) state.shown = PAGE;
    state.rows = rows(D, f);
    state.cols = cols(D, f);
    var name = scopeName(f);
    var n = state.rows.length;
    var what = f.show === "open" ? " not yet adopted at " + name : f.show === "here" ? " adopted at " + name : "";
    $("ad-state").textContent = plural(n, "credential", "credentials") + what;
    $("ad-note").textContent = name
      ? (f.show === "open" ? "Each one is awarded at another college. Those whose course the college already teaches come first." : "")
      : "Showing " + fmt(D.credentials.length) + " credentials a person or a rule has reviewed; more join as the review finishes.";
    var h = $("ad-handout");
    h.hidden = !f.college;
    if (f.college) h.href = HANDOUT + encodeURIComponent(f.college);
    try {
      var url = f.college ? "?college=" + encodeURIComponent(f.college) : location.pathname;
      history.replaceState(null, "", url);
    } catch (e) { /* the page still works */ }
    if (state.view === "list") drawList(f);
    else { mx.focus = null; buildMatrix(); }
  }

  function setView(v) {
    state.view = v;
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === v));
    });
    $("ad-list-view").hidden = v !== "list";
    $("ad-matrix-view").hidden = v !== "matrix";
    draw(false);
  }

  function download(name, text) {
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function slug() {
    var f = filters(), n = scopeName(f);
    return "credentials-to-adopt" + (n ? "-" + n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "");
  }

  function wire() {
    var t = null;
    $("ad-q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { draw(true); }, 160); });
    ["ad-college", "ad-show", "ad-sector", "ad-type", "ad-region", "ad-area", "ad-district"].forEach(function (id) {
      $(id).addEventListener("change", function () { draw(true); });
    });
    $("ad-clear").addEventListener("click", function () {
      ["ad-q", "ad-college", "ad-sector", "ad-type", "ad-region", "ad-area", "ad-district"].forEach(function (id) { $(id).value = ""; });
      draw(true);
    });
    $("ad-more").addEventListener("click", function () { state.shown += PAGE; drawList(filters()); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
    });
    $("ad-csv").addEventListener("click", function () { download(slug() + ".csv", csvList(D, state.rows)); });
    $("ad-csv-mx").addEventListener("click", function () { download(slug() + "-matrix.csv", csvMatrix(D, state.rows, state.cols)); });
    var wrap = $("ad-mx-wrap"), raf = 0;
    wrap.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; drawWindow(false); });
    });
    wrap.addEventListener("mouseover", function (e) { var td = e.target.closest && e.target.closest("td"); if (td) showTip(td); });
    wrap.addEventListener("mouseleave", hideTip);
    wrap.addEventListener("focusin", function (e) {
      var td = e.target.closest && e.target.closest("td[data-k]");
      if (td) { mx.focus = [Number(td.parentNode.getAttribute("data-r")), Number(td.getAttribute("data-k"))]; showTip(td); }
    });
    wrap.addEventListener("keydown", function (e) {
      var keys = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], PageUp: [-10, 0], PageDown: [10, 0] };
      if (e.key === "Escape") { hideTip(); wrap.focus(); e.stopPropagation(); return; }
      var d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      var at = mx.focus || [0, 0];
      focusCell(mx.focus ? at[0] + d[0] : 0, mx.focus ? at[1] + d[1] : 0);
    });
  }

  function init(data) {
    D = data;
    fillSelect($("ad-college"), D.colleges.map(function (c) { return [c[0], c[0]]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); }));
    fillSelect($("ad-sector"), Object.keys(D.sectors).map(function (k) { return [k, k + " " + D.sectors[k]]; }));
    fillSelect($("ad-type"), D.types.map(function (t, i) { return [String(i), t]; }));
    fillSelect($("ad-region"), uniq(D.colleges.map(function (c) { return c[3]; })).map(function (v) { return [v, v]; }));
    fillSelect($("ad-area"), uniq(D.colleges.map(function (c) { return c[4]; })).map(function (v) { return [v, "Area " + v]; }));
    fillSelect($("ad-district"), uniq(D.colleges.map(function (c) { return c[2]; })).map(function (v) { return [v, v]; }));
    var asked = null;
    try { asked = new URLSearchParams(location.search).get("college"); } catch (e) { asked = null; }
    if (asked && D.colleges.some(function (c) { return c[0] === asked; })) $("ad-college").value = asked;
    if (D.written_at) {
      $("ad-asof").textContent = "updated " + new Date(D.written_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    wire();
    draw(true);
  }

  window.CPL_ADOPT = { scope: scope, match: match, rows: rows, cols: cols, csvList: csvList, csvMatrix: csvMatrix, mapUrl: mapUrl };

  if (typeof document === "undefined" || !document.getElementById("ad-list")) return;
  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function () { $("ad-state").textContent = "The credentials could not be read. Try again in a moment."; });
})();
