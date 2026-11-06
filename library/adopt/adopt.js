/* The public Credential Catalog (library/adopt/): every credential's credit status, the colleges that award credit for
 * each, the way to ask a college to add or evaluate one, and an analysis for faculty. Sam, Open Asks Sheet 147
 * (2026-10-31), and his asks of 2026-11-06 on the mock (https://claude.ai/artifact/2r9apBWRRiaYS6CNqYy3Ds): the
 * full width, a clickable matrix, a working adult's order (fields first, the exams last), multi-select pickers with
 * College and District as one and the two region schemes as one, a List view, three figure tiles that open what they
 * count, Credit status in public words with Show folded into it, A for a college that could adopt, a resizable side
 * panel, and no bare "MAP" or "CPL" in public strings.
 *
 * Reads adopt_data.json (the settled credentials; kb/_build_adopt_page.py), then adopt_more.json (the other credit
 * statuses: Being reviewed, Not yet evaluated, Known to a college with no credit yet), and adopt_align.json when a
 * panel opens (kb/_build_adopt_align.py). Writes nothing and remembers no filter (Sam, 2026-10-21); the browser keeps
 * only the theme and the panel's width (layout). ?college=<name> opens on one college and the address follows a single
 * college pick, so a link can be sent. Could adopt is the course a college already teaches under the credential's
 * identity, never the TOP or C-ID overlap (Sam, 2026-09-24).
 *
 * window.CPL_ADOPT exposes the pure parts (scope, stdOf, match, rows, cols, csv, groupKey) for tests/public_adopt.test.js.
 */
(function () {
  "use strict";

  var DATA_URL = "./adopt_data.json", MORE_URL = "./adopt_more.json", ALIGN_URL = "./adopt_align.json";
  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";  // map_links.js MAP_PAGE
  var MAP_VIEW = "&View=Non-Military";
  var HANDOUT = "../cpl-opportunity/?college=";
  var FIND_COLLEGE = "https://map.rccd.edu/cpllandingpages/";
  var PORTAL = "https://creditforbeingyou.org/";
  // The statewide route (Sam, Open Asks Sheet 162, 2026-11-06): a public request to prioritize review of a credential,
  // never an evaluation promise. One INSERT-only function takes it; one aggregate returns the count beside each credential
  // (kb/migrations/2026-11-06_credential_priority_requests.sql). The public anon key reads nothing else.
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var ASK_URL = SUPABASE_URL + "/rest/v1/rpc/credential_priority_request";
  var COUNTS_URL = SUPABASE_URL + "/rest/v1/rpc/credential_priority_counts";
  var ASK = "Ask us to prioritize this credential";
  var PAGE = 72;       // cards or rows drawn at a time
  var CHIPS = 6;       // Request Quick Adopt chips before "and N more"
  var ROW_H = 44;      // the matrix row height, px (CSS .mx tbody tr)
  var OVERSCAN = 12;   // rows drawn past the viewport, each side
  var HERO_MS = 7000;
  var PANEL_MIN = 360, PANEL_MAX = 1200, PANEL_DEFAULT = 560;

  // Credit status, in the public's words. The Commons keeps the curation words: awarded = Awarded somewhere,
  // inmap = In MAP, no articulation yet, held = Held for title review, harvested = Harvested, no exhibit yet.
  var STD = { awarded: "Earns credit at a college", here: "Earns credit here", open: "Earns credit elsewhere, could be added here",
    inmap: "Known to a college, no credit yet", held: "Being reviewed", harvested: "Not yet evaluated" };
  var STD_ORDER = ["awarded", "inmap", "held", "harvested"];
  var STD_ORDER_SCOPED = ["here", "open", "inmap", "held", "harvested"];
  var EXAM_ISSUERS = { "College Board": 1, "International Baccalaureate Organization (IBO)": 1,
    "Defense Activity for Non-Traditional Education Support (DANTES)": 1 };
  var EXAM_KEY = "exams", EXAM_LABEL = "High school and college exams (AP, IB, CLEP, DSST)";
  var NONE_KEY = "none", NONE_LABEL = "No field assigned yet";

  var D = null, A = null, R = [];
  var f = { q: "", colleges: {}, regions: {}, areas: {}, sectors: {}, types: {}, standing: { awarded: true }, sort: "field" };
  var state = { view: "list", shown: PAGE, rows: [], cols: [], groups: [], flat: [], mxRows: [], sel: null, sc: null, other: {}, asks: {}, asksRead: false };
  var pickers = {};

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
  function keys(o) { return Object.keys(o || {}).filter(function (k) { return o[k]; }); }
  function any(o) { return keys(o).length > 0; }

  /* ── The pure parts ─────────────────────────────────────────────────────────────── */

  function isExam(c) { return EXAM_ISSUERS[c.i] === 1 || /^(AP|CLEP|IB|DSST) /.test(c.t || ""); }
  function groupKey(c) { return isExam(c) ? EXAM_KEY : (c.s || NONE_KEY); }
  function groupLabel(data, k) { return k === EXAM_KEY ? EXAM_LABEL : k === NONE_KEY ? NONE_LABEL : ((data.sectors || {})[k] || k); }

  // The colleges the college filters leave, as a set of indexes; null when no college filter is set.
  function scope(data, f) {
    if (!any(f.colleges) && !any(f.regions) && !any(f.areas)) return null;
    var out = {};
    data.colleges.forEach(function (c, i) {
      if (any(f.colleges) && !f.colleges[i]) return;
      if (any(f.regions) && !f.regions[c[3]]) return;
      if (any(f.areas) && !f.areas[c[4]]) return;
      out[i] = true;
    });
    return out;
  }

  // A row's credit status as the picked scope sees it: an awarded credential is "here" or "open" inside a scope.
  function stdOf(c, sc) {
    if (c.std !== "awarded" || !sc) return c.std;
    return c.a.some(function (a) { return sc[a[0]]; }) ? "here" : "open";
  }

  function match(c, f, sc, anyStanding) {
    if (!anyStanding && !f.standing[stdOf(c, sc)]) return false;
    if (f.q) {
      var hay = (c.t + " " + (c.i || "") + " " + (c.k || "") + " " + (c.c || []).map(function (x) { return x[1] || ""; }).join(" ")).toLowerCase();
      var words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var w = 0; w < words.length; w++) {
        var re = new RegExp("(^|[^a-z0-9])" + words[w].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        if (!re.test(hay)) return false;  // a word starts a word: "aws" finds AWS, never "chainsaws"
      }
    }
    if (any(f.sectors) && !f.sectors[groupKey(c)]) return false;
    if (any(f.types)) { if (!(c.y || []).some(function (y) { return f.types[y]; })) return false; }
    return true;
  }

  function cmpTitle(x, y) { return x.t.localeCompare(y.t, "en", { sensitivity: "base", numeric: true }); }
  function cmpMost(x, y) { return (y.a.length - x.a.length) || cmpTitle(x, y); }
  function sorter(f, sc) {
    var inner = (f.sort === "field-most" || f.sort === "most") ? cmpMost : cmpTitle;
    return function (x, y) {
      if (sc) {  // a college's own course first (it teaches a matching course)
        var cx = (x.c || []).some(function (c) { return sc[c[0]]; }) ? 1 : 0;
        var cy = (y.c || []).some(function (c) { return sc[c[0]]; }) ? 1 : 0;
        if (cx !== cy) return cy - cx;
      }
      return inner(x, y);
    };
  }
  function grouped(f) { return f.sort === "field" || f.sort === "field-most"; }

  // Field order: the largest fields first, the exams last, so a working adult meets their trade before the AP list.
  function fieldOrder(data, all) {
    var n = {};
    (data.credentials || []).forEach(function (c) { var k = groupKey(c); n[k] = (n[k] || 0) + 1; });
    (all || []).forEach(function (c) { var k = groupKey(c); if (!n[k]) n[k] = 0; });
    var ks = Object.keys(n).filter(function (k) { return k !== EXAM_KEY && k !== NONE_KEY; });
    ks.sort(function (a, b) { return (n[b] - n[a]) || groupLabel(data, a).localeCompare(groupLabel(data, b)); });
    if (n[NONE_KEY] != null) ks.push(NONE_KEY);
    if (n[EXAM_KEY] != null) ks.push(EXAM_KEY);
    return { keys: ks, n: n };
  }

  function rows(data, all, f) {
    var sc = scope(data, f);
    var list = all.filter(function (c) { return match(c, f, sc); });
    list.sort(sorter(f, sc));
    return list;
  }

  function cols(data, f) {
    var sc = scope(data, f), out = [];
    data.colleges.forEach(function (c, i) { if (!sc || sc[i]) out.push(i); });
    return out;
  }

  function csvCell(v) {
    v = String(v == null ? "" : v);
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function csvList(data, list) {
    var lines = [["Credential", "Issuer", "How credit is given", "Field", "Credit status", "Colleges awarding", "Median units",
      "Colleges and units", "Already teach a matching course", "Request Quick Adopt"].map(csvCell).join(",")];
    list.forEach(function (c) {
      lines.push([
        c.t, c.i || "", (c.y || []).map(function (i) { return data.types[i]; }).join("; "), groupLabel(data, groupKey(c)),
        STD[c.std] || "", c.a.length, c.p != null ? units(c.p) : "",
        c.a.map(function (a) { return data.colleges[a[0]][0] + " (" + units(a[1]) + ")"; }).join("; "),
        (c.c || []).map(function (x) { return data.colleges[x[0]][0] + (x[1] ? " (" + x[1] + ")" : ""); }).join("; "),
        (c.m || []).map(function (m) { return m[0] + " " + mapUrl(m[0]); }).join("; ")
      ].map(csvCell).join(","));
    });
    return lines.join("\r\n");
  }
  function csvMatrix(data, list, columns) {
    var lines = [["Credential"].concat(columns.map(function (i) { return data.colleges[i][0]; })).map(csvCell).join(",")];
    list.forEach(function (c) {
      if (!c.a.length && !(c.c || []).length) return;
      var art = {}, could = {};
      c.a.forEach(function (a) { art[a[0]] = a[1]; });
      (c.c || []).forEach(function (x) { could[x[0]] = true; });
      lines.push([c.t].concat(columns.map(function (i) {
        return art[i] != null ? units(art[i]) : could[i] ? "A" : "";
      })).map(csvCell).join(","));
    });
    return lines.join("\r\n");
  }

  /* ── State ──────────────────────────────────────────────────────────────────────── */

  function scopeName() {
    var cs = keys(f.colleges);
    if (cs.length === 1) return D.colleges[Number(cs[0])][0];
    if (cs.length > 1) return plural(cs.length, "college", "colleges");
    return keys(f.regions).concat(keys(f.areas).map(function (a) { return "ASCCC Area " + a; })).join(", ");
  }

  // A scope arriving opens the page on what that scope could add; a scope leaving returns to what earns credit.
  function syncStandingToScope() {
    var has = !!scope(D, f);
    if (has === !!state.hadScope) return;
    state.hadScope = has;
    if (has) { if (f.standing.awarded) { delete f.standing.awarded; f.standing.open = true; } }
    else if (f.standing.here || f.standing.open) { delete f.standing.here; delete f.standing.open; f.standing.awarded = true; }
  }

  function compute() {
    var sc = scope(D, f);
    var list = rows(D, R, f);
    state.sc = sc;
    state.cols = cols(D, f);
    state.other = {};
    if (f.q) R.forEach(function (c) { var k = stdOf(c, sc); if (!f.standing[k] && match(c, f, sc, true)) state.other[k] = (state.other[k] || 0) + 1; });
    if (grouped(f)) {
      var by = {};
      list.forEach(function (c) { var k = groupKey(c); (by[k] = by[k] || []).push(c); });
      var ks = state.order.keys.filter(function (k) { return by[k]; });
      Object.keys(by).forEach(function (k) { if (ks.indexOf(k) < 0) ks.splice(ks.length - (by[EXAM_KEY] ? 1 : 0), 0, k); });
      state.groups = ks.map(function (k) { return { key: k, label: groupLabel(D, k), items: by[k] }; });
      state.flat = [];
      state.groups.forEach(function (g) { state.flat.push({ head: g }); g.items.forEach(function (c) { state.flat.push({ c: c }); }); });
    } else {
      state.groups = [{ key: "all", label: "", items: list }];
      state.flat = list.map(function (c) { return { c: c }; });
    }
    state.rows = list;
    state.mxRows = state.flat.filter(function (r) { return r.head || (r.c.a.length || (r.c.c || []).length); });
  }

  /* ── Pickers: one control, several picks, headings where they help ──────────────── */

  function picker(id, label, groups, read, write, every) {
    var host = $(id), open = false, qs = "";
    function sum() {
      var picked = keys(read());
      if (!picked.length) return [every, ""];
      var names = [];
      groups.forEach(function (g) { g.items.forEach(function (it) { if (read()[it.key]) names.push(it.label); }); });
      return [names.join(", "), String(picked.length)];
    }
    function row(it, sub) {
      return '<label class="pp-row' + (sub ? " sub" : "") + (it.count === 0 ? " off" : "") + '"><input type="checkbox" data-key="' + esc(it.key) + '" '
        + (read()[it.key] ? "checked" : "") + '><span>' + esc(it.label) + "</span>" + (it.count != null ? '<span class="cnt">' + fmt(it.count) + "</span>" : "") + "</label>";
    }
    function draw() {
      var s = sum();
      host.innerHTML = '<span class="lab" id="' + id + '-lab">' + esc(label) + '</span>'
        + '<button type="button" class="pick-btn" aria-haspopup="true" aria-expanded="' + open + '" aria-labelledby="' + id + '-lab ' + id + '-sum">'
        + '<span class="sum" id="' + id + '-sum">' + esc(s[0]) + '</span>' + (s[1] ? '<span class="n">' + s[1] + '</span>' : "") + "</button>"
        + '<div class="pick-pop" ' + (open ? "" : "hidden") + '><div class="pp-top"><input type="search" placeholder="Type to narrow" aria-label="Narrow the '
        + esc(label) + ' list" value="' + esc(qs) + '"></div><div class="pp-list"></div><div class="pp-foot"><button type="button" class="word pp-clear">Clear</button>'
        + '<button type="button" class="word pp-done">Done</button></div></div>';
      var list = host.querySelector(".pp-list"), q = qs.toLowerCase(), html = "";
      groups.forEach(function (g) {
        var items = g.items.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) >= 0 || (g.head && g.head.toLowerCase().indexOf(q) >= 0); });
        if (!items.length) return;
        if (g.section) html += '<div class="pp-head">' + esc(g.section) + "</div>";
        if (g.head) {
          var all = items.every(function (it) { return read()[it.key]; });
          html += '<div class="pp-grp"><label class="pp-row"><input type="checkbox" data-grp="' + esc(g.headKey) + '" ' + (all ? "checked" : "")
            + '><span>' + esc(g.head) + '</span><span class="cnt">' + plural(items.length, "college", "colleges") + "</span></label>";
          items.forEach(function (it) { html += row(it, true); });
          html += "</div>";
        } else items.forEach(function (it) { html += row(it, false); });
      });
      list.innerHTML = html || '<p class="empty">Nothing matches.</p>';
      host.querySelector(".pick-btn").addEventListener("click", function () { open = !open; draw(); if (open) host.querySelector(".pp-top input").focus(); });
      host.querySelector(".pp-top input").addEventListener("input", function (e) {
        qs = e.target.value; var pos = e.target.selectionStart; draw();
        var inp = host.querySelector(".pp-top input"); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (x) { /* fine */ }
      });
      list.addEventListener("change", function (e) {
        var t = e.target, cur = read();
        if (t.hasAttribute("data-grp")) {
          var g = groups.filter(function (g) { return g.headKey === t.getAttribute("data-grp"); })[0];
          g.items.forEach(function (it) { cur[it.key] = t.checked; });
        } else cur[t.getAttribute("data-key")] = t.checked;
        write(cur); draw(); redraw(true);
      });
      host.querySelector(".pp-clear").addEventListener("click", function () { write({}); draw(); redraw(true); });
      host.querySelector(".pp-done").addEventListener("click", function () { open = false; draw(); host.querySelector(".pick-btn").focus(); });
    }
    document.addEventListener("click", function (e) {
      var path = e.composedPath ? e.composedPath() : [];
      if (open && path.indexOf(host) < 0 && !host.contains(e.target)) { open = false; draw(); }
    });
    host.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { open = false; draw(); host.querySelector(".pick-btn").focus(); } });
    draw();
    return { draw: draw };
  }

  function buildPickers() {
    // College: one alphabetical list; a district heads its colleges only where it has more than one.
    var byDist = {};
    D.colleges.forEach(function (c, i) { (byDist[c[2]] = byDist[c[2]] || []).push(i); });
    var entries = [];
    Object.keys(byDist).forEach(function (d) {
      var idx = byDist[d];
      if (idx.length > 1) {
        entries.push({ sortKey: d.replace(/ Community College District| Unified School District/i, ""), head: d, headKey: d,
          items: idx.map(function (i) { return { key: String(i), label: D.colleges[i][0] }; }).sort(function (a, b) { return a.label.localeCompare(b.label); }) });
      } else entries.push({ sortKey: D.colleges[idx[0]][0], head: null, items: [{ key: String(idx[0]), label: D.colleges[idx[0]][0] }] });
    });
    entries.sort(function (a, b) { return a.sortKey.localeCompare(b.sortKey); });
    pickers.college = picker("pk-college", "College", entries, function () { return f.colleges; }, function (v) { f.colleges = v; }, "Every college");
    // Region: the Strong Workforce regions and the ASCCC Areas under two headings.
    var regs = {}, areas = {};
    D.colleges.forEach(function (c) { regs[c[3]] = (regs[c[3]] || 0) + 1; areas[c[4]] = (areas[c[4]] || 0) + 1; });
    var sw = Object.keys(regs).filter(Boolean).sort(function (a, b) {
      var na = Number((a.match(/Region (\d+)/) || [])[1] || 99), nb = Number((b.match(/Region (\d+)/) || [])[1] || 99);
      return na - nb || a.localeCompare(b);
    });
    pickers.region = picker("pk-region", "Region", [
      { section: "Strong Workforce", head: null, items: sw.map(function (r) { return { key: "r:" + r, label: r, count: regs[r] }; }) },
      { section: "ASCCC", head: null, items: Object.keys(areas).filter(Boolean).sort().map(function (a) { return { key: "a:" + a, label: "Area " + a, count: areas[a] }; }) }
    ], function () {
      var o = {}; keys(f.regions).forEach(function (r) { o["r:" + r] = true; }); keys(f.areas).forEach(function (a) { o["a:" + a] = true; }); return o;
    }, function (v) {
      f.regions = {}; f.areas = {};
      keys(v).forEach(function (k) { if (k.slice(0, 2) === "r:") f.regions[k.slice(2)] = true; else f.areas[k.slice(2)] = true; });
    }, "Every region");
    pickers.sector = picker("pk-sector", "Field", [{ head: null, items: state.order.keys.map(function (k) { return { key: k, label: groupLabel(D, k), count: state.order.n[k] }; }) }],
      function () { return f.sectors; }, function (v) { f.sectors = v; }, "Every field");
    var tn = {}; D.credentials.forEach(function (c) { (c.y || []).forEach(function (y) { tn[y] = (tn[y] || 0) + 1; }); });
    pickers.type = picker("pk-type", "How credit is given", [{ head: null, items: D.types.map(function (t, i) { return { key: String(i), label: t, count: tn[i] || 0 }; }) }],
      function () { return f.types; }, function (v) { f.types = v; }, "Every way");
    buildStanding();
  }
  function buildStanding() {
    var sc = scope(D, f), n = {};
    R.forEach(function (c) { var k = stdOf(c, sc); n[k] = (n[k] || 0) + 1; });
    var order = sc ? STD_ORDER_SCOPED : STD_ORDER;
    pickers.standing = picker("pk-standing", "Credit status", [{ head: null, items: order.map(function (k) { return { key: k, label: STD[k], count: n[k] || 0 }; }) }],
      function () { return f.standing; }, function (v) { f.standing = v; }, "Every status");
  }
  function redrawPickers() { Object.keys(pickers).forEach(function (k) { pickers[k].draw(); }); }

  function drawSel() {
    var out = [];
    keys(f.colleges).forEach(function (i) { out.push(["College", D.colleges[Number(i)][1], function () { delete f.colleges[i]; }]); });
    keys(f.regions).forEach(function (r) { out.push(["Region", r, function () { delete f.regions[r]; }]); });
    keys(f.areas).forEach(function (a) { out.push(["ASCCC", "Area " + a, function () { delete f.areas[a]; }]); });
    keys(f.sectors).forEach(function (s) { out.push(["Field", groupLabel(D, s), function () { delete f.sectors[s]; }]); });
    keys(f.types).forEach(function (y) { out.push(["How credit is given", D.types[Number(y)], function () { delete f.types[y]; }]); });
    keys(f.standing).forEach(function (s) { out.push(["Credit status", STD[s], function () { delete f.standing[s]; }]); });
    var host = $("ad-sel");
    host.innerHTML = out.map(function (o, i) {
      return '<span class="ch"><b>' + esc(o[0]) + "</b> " + esc(o[1]) + '<button type="button" data-i="' + i + '" aria-label="Remove ' + esc(o[1]) + '">✕</button></span>';
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { out[Number(b.getAttribute("data-i"))][2](); redrawPickers(); redraw(true); });
    });
  }

  /* ── Cards ──────────────────────────────────────────────────────────────────────── */

  function quickAdopt(c, sc) {
    var ms = (c.m || []).slice();
    if (!ms.length) return "";
    var seen = {}, chips = [];
    ms.forEach(function (m) {  // one chip per building college; the scope's own colleges are never offered to themselves
      if (sc && m[1] >= 0 && sc[m[1]]) return;
      var who = m[1] >= 0 ? D.colleges[m[1]][1] : (m[2] || "MAP");
      if (seen[who]) return;
      seen[who] = true;
      chips.push('<a class="chip" href="' + esc(mapUrl(m[0])) + '" target="_blank" rel="noopener">' + esc(who)
        + '<span class="sr-only"> built exhibit ' + esc(m[0]) + ", Request Quick Adopt</span></a>");
    });
    if (!chips.length) return "";
    var more = chips.length - CHIPS;
    return '<div class="chips"><span class="lbl">Ask to add it (Request Quick Adopt) from</span>' + chips.slice(0, CHIPS).join("")
      + (more > 0 ? '<span class="more">and ' + plural(more, "more college", "more colleges") + "</span>" : "") + "</div>";
  }

  function evidence(c) {
    var e = [];
    if (c.k) e.push(c.k);
    if (c.st) e.push(c.st === "new" ? "new this year" : c.st);
    if (c.ct) e.push("Credential Engine CTID");
    if (c.sk) e.push(plural(c.sk, "issuer skill area", "issuer skill areas"));
    if ((c.src || []).indexOf("ca") >= 0) e.push("California license");
    if ((c.src || []).indexOf("iss") >= 0) e.push("read from the issuer");
    if (c.std === "held") e.push(c.n ? plural(c.n, "college has it on file", "colleges have it on file") : "on a college’s books");
    return e.join(" · ");
  }

  function reqWord(c) { return '<div class="chips"><button type="button" class="word" data-open="' + c._i + '" data-req="1">' + ASK + '</button>' + askedWord(c) + "</div>"; }
  // How many have asked us to prioritize a credential: the signal, shown wherever the credential is (Sam, Sheet 162).
  /* Ask us to prioritize goes only where no college has articulated the credential (Sam, 2026-11-06: "only the ones that
     have NOT been articulated by at least one college need the link"); an articulated one offers Request Quick Adopt. Being
     reviewed counts as articulated: a college awards credit for it under a title being confirmed. */
  function articulated(c) { return (c.a || []).length > 0 || c.std === "held"; }
  function asked(c) { return state.asks[String(c.t || "").toLowerCase()] || 0; }
  function askedWord(c) { var n = asked(c); return n ? ' <span class="askn">' + plural(n, "person has", "people have") + " asked</span>" : ""; }
  function askedCell(c) { var n = asked(c); return n ? '<span class="askn">' + n + " asked</span>" : ""; }

  function otherCard(c) {
    var says = c.std === "harvested" ? "No college has evaluated it for credit yet. You can ask for that below."
      : c.std === "inmap" ? "A college has it on file and has not set credit for it yet."
      : "A college awards credit for a credential by this name; the Credit for Prior Learning Initiative is confirming it is the same one.";
    return '<article class="cred"><h3><button type="button" data-open="' + c._i + '">' + esc(c.t) + "</button></h3>"
      + (c.i ? '<p class="meta">' + esc(c.i) + "</p>" : "") + '<div class="pills"><span class="pill ' + (c.std === "harvested" ? "harv" : "std") + '">' + esc(STD[c.std]) + "</span></div>"
      + '<p class="says">' + says + "</p>" + (evidence(c) ? '<p class="ev">' + esc(evidence(c)) + "</p>" : "") + (articulated(c) ? "" : reqWord(c)) + "</article>";
  }

  function card(c, sc) {
    if (c.std !== "awarded") return otherCard(c);
    var types = (c.y || []).map(function (i) { return D.types[i]; }).join(", ");
    var meta = [c.i, types].filter(Boolean).join(" · ");
    var n = c.a.length;
    var says = n ? plural(n, "college awards", "colleges award") + " credit for it" + (c.p != null ? ", " + units(c.p) + " units at the median college." : ".")
      : "No college awards credit for it yet.";
    var mine = sc ? (c.c || []).filter(function (x) { return sc[x[0]]; }) : [];
    var here = sc ? c.a.filter(function (a) { return sc[a[0]]; }) : [];
    var pills = "";
    if (here.length) pills += '<span class="pill here">Earns credit here: ' + esc(here.map(function (a) { return D.colleges[a[0]][1] + " (" + units(a[1]) + ")"; }).join(", ")) + "</span>";
    if (mine.length) pills += '<span class="pill could">Already teaches a matching course: ' + esc(mine.map(function (x) { return D.colleges[x[0]][1] + (x[1] ? ": " + x[1] : ""); }).join("; ")) + "</span>";
    return '<article class="cred"><h3><button type="button" data-open="' + c._i + '">' + esc(c.t) + "</button></h3>"
      + (meta ? '<p class="meta">' + esc(meta) + "</p>" : "") + '<p class="says">' + esc(says) + "</p>"
      + (pills ? '<div class="pills">' + pills + "</div>" : "") + (here.length ? "" : quickAdopt(c, sc)) + (n ? "" : reqWord(c)) + "</article>";
  }

  function drawList() {
    var sc = state.sc, budget = state.shown, html = "", total = 0, drawn = 0;
    state.groups.forEach(function (g) {
      total += g.items.length;
      if (budget <= 0) return;
      var slice = g.items.slice(0, budget); budget -= slice.length; drawn += slice.length;
      if (g.label) html += '<section class="grp"><h3 class="grp-h">' + esc(g.label) + '<span class="cnt">' + plural(g.items.length, "credential", "credentials") + "</span></h3>";
      html += '<div class="list">' + slice.map(function (c) { return card(c, sc); }).join("") + "</div>";
      if (g.label) html += "</section>";
    });
    if (drawn < total) html += '<p class="sentinel" id="ad-list-sentinel">Loading ' + fmt(Math.min(PAGE, total - drawn)) + " more of " + fmt(total - drawn) + "…</p>";
    $("ad-list").innerHTML = html;
    $("ad-empty").hidden = total > 0;
    var more = $("ad-more");
    more.hidden = lazy.ok || drawn >= total;
    more.textContent = "Show more (" + fmt(total - drawn) + " more)";
    lazy.watch("list");
  }

  /* ── The List ───────────────────────────────────────────────────────────────────── */

  // One line a credential (Sam, 2026-11-06): the credit status is its own column, the ask its own column on the right, and
  // a cell too long for its column ends in an ellipsis with the whole text in its title.
  var TBL_COLS = 8;
  function drawTable() {
    var budget = state.shown, html = "", total = 0, drawn = 0, sc = state.sc;
    state.groups.forEach(function (g) {
      total += g.items.length;
      if (budget <= 0) return;
      var slice = g.items.slice(0, budget); budget -= slice.length; drawn += slice.length;
      if (g.label) html += '<tr class="band"><th scope="rowgroup" colspan="' + TBL_COLS + '">' + esc(g.label) + '<span class="cnt">' + plural(g.items.length, "credential", "credentials") + "</span></th></tr>";
      html += slice.map(function (c) {
        var n = c.a.length, field = groupLabel(D, groupKey(c));
        var status = STD[stdOf(c, sc)] || "", ev = c.std !== "awarded" ? evidence(c) : "";
        var types = (c.y || []).map(function (i) { return D.types[i]; });
        var typeCells = (c.y || []).map(function (i) { return '<button type="button" class="word dd" data-type="' + i + '" title="Filter to this way of giving credit">' + esc(D.types[i]) + "</button>"; }).join(", ") || esc(c.k || "");
        var ask = (n ? "" : '<button type="button" class="word req-w" data-open="' + c._i + '" data-req="1" title="' + esc(ASK) + '">Ask</button> ') + askedCell(c);
        return '<tr><td title="' + esc(c.t) + '"><button type="button" class="word" data-open="' + c._i + '">' + esc(c.t) + "</button></td>"
          + '<td title="' + esc(c.i || "") + '">' + (c.i ? '<button type="button" class="word dd" data-q="' + esc(c.i) + '" title="Search this issuer">' + esc(c.i) + "</button>" : "") + "</td>"
          + '<td title="' + esc(field) + '"><button type="button" class="word dd" data-sector="' + esc(groupKey(c)) + '" title="Filter to this field">' + esc(field) + "</button></td>"
          + '<td title="' + esc(types.join(", ") || c.k || "") + '">' + typeCells + "</td>"
          + '<td class="st" title="' + esc([status, ev].filter(Boolean).join(" · ")) + '">' + esc(status) + "</td>"
          + '<td class="num">' + (n ? '<button type="button" class="word" data-open="' + c._i + '" data-sec="pn-awards" title="The colleges and their units">' + fmt(n) + "</button>" : "0") + "</td>"
          + '<td class="num">' + (n && c.p != null ? '<button type="button" class="word" data-open="' + c._i + '" data-sec="pn-awards">' + esc(units(c.p)) + "</button>" : "") + "</td>"
          + '<td class="ask">' + ask + "</td></tr>";
      }).join("");
    });
    if (drawn < total) html += '<tr class="sentinel" id="ad-tbl-sentinel"><td colspan="' + TBL_COLS + '">Loading ' + fmt(Math.min(PAGE, total - drawn)) + " more of " + fmt(total - drawn) + "…</td></tr>";
    $("ad-tbl-body").innerHTML = html;
    $("ad-tbl-empty").hidden = total > 0;
    var more = $("ad-more-t");
    more.hidden = lazy.ok || drawn >= total;
    more.textContent = "Show more (" + fmt(total - drawn) + " more)";
    lazy.watch("table");
  }

  // Lazy loading (Sam, 2026-11-06): the next batch draws as the reader nears the end, in place of Show more. The List
  // scrolls inside its own box, so its sentinel is watched against that box; the cards against the window. Where the
  // browser has no IntersectionObserver, Show more stays.
  var lazy = {
    ok: typeof window !== "undefined" && typeof window.IntersectionObserver === "function",
    obs: null,
    watch: function (view) {
      if (!lazy.ok) return;
      if (lazy.obs) { lazy.obs.disconnect(); lazy.obs = null; }
      var el = $(view === "table" ? "ad-tbl-sentinel" : "ad-list-sentinel");
      if (!el) return;
      lazy.obs = new window.IntersectionObserver(function (es) {
        if (!es.some(function (e) { return e.isIntersecting; })) return;
        lazy.obs.disconnect(); lazy.obs = null;
        state.shown += PAGE;
        if (state.view === "table") drawTable(); else if (state.view === "list") drawList();
      }, { root: view === "table" ? $("ad-tbl-wrap") : null, rootMargin: "0px 0px 400px 0px" });
      lazy.obs.observe(el);
    }
  };

  /* ── The College matrix: a window over the rows ─────────────────────────────────── */

  var mx = { first: -1, last: -1 };

  function cellOf(c, col) {
    for (var i = 0; i < c.a.length; i++) if (c.a[i][0] === col) return { kind: "art", a: c.a[i] };
    var cs = c.c || [];
    for (var j = 0; j < cs.length; j++) if (cs[j][0] === col) return { kind: "could", c: cs[j] };
    return null;
  }

  function buildMatrix() {
    var wrap = $("ad-mx-wrap"), cs = state.cols;
    var head = '<tr><th class="corner" scope="col">Credential</th>' + cs.map(function (i) {
      return '<th class="ch" scope="col"><button type="button" data-col="' + i + '" title="' + esc(D.colleges[i][0]) + ': pick this college">' + esc(D.colleges[i][1]) + "</button></th>";
    }).join("") + "</tr>";
    wrap.innerHTML = '<table class="mx" style="width:max(100%, calc(clamp(180px,22vw,320px) + ' + (cs.length * 34) + 'px))"><colgroup><col style="width:clamp(180px,22vw,320px)">'
      + cs.map(function () { return "<col>"; }).join("") + "</colgroup><thead>" + head + '</thead><tbody id="ad-mx-body"></tbody></table>';
    mx.first = mx.last = -1;
    drawWindow(true);
  }

  function drawWindow(force) {
    var wrap = $("ad-mx-wrap"), body = $("ad-mx-body");
    if (!body) return;
    var rws = state.mxRows, n = rws.length, cs = state.cols;
    var top = Math.max(0, wrap.scrollTop - 170);
    var first = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
    var last = Math.min(n, Math.ceil((top + (wrap.clientHeight || 600)) / ROW_H) + OVERSCAN);
    if (!force && first === mx.first && last === mx.last) return;
    mx.first = first; mx.last = last;
    var span = cs.length + 1, html = first > 0 ? '<tr class="spacer" style="height:' + (first * ROW_H) + 'px"><td colspan="' + span + '"></td></tr>' : "";
    for (var r = first; r < last; r++) {
      var row = rws[r];
      if (row.head) { html += '<tr class="grp-row"><th scope="row">' + esc(row.head.label) + '<span class="cnt">' + fmt(row.head.items.length) + '</span></th><td colspan="' + cs.length + '"></td></tr>'; continue; }
      var c = row.c;
      html += '<tr><th scope="row"><button type="button" data-open="' + c._i + '" title="' + esc(c.t) + '">' + esc(c.t) + "</button></th>";
      for (var k = 0; k < cs.length; k++) {
        var cell = cellOf(c, cs[k]);
        var sel = state.sel && state.sel[0] === c._i && state.sel[1] === cs[k] ? " sel" : "";
        if (!cell) { html += "<td" + (sel ? ' class="sel"' : "") + '><span class="sr-only">none</span></td>'; continue; }
        if (cell.kind === "art") {
          html += '<td class="art' + sel + '"><button type="button" data-open="' + c._i + '" data-at="' + cs[k] + '" aria-label="' + esc(D.colleges[cs[k]][0]) + ", " + esc(units(cell.a[1])) + ' units">' + esc(units(cell.a[1])) + "</button></td>";
        } else {
          html += '<td class="could' + sel + '"><button type="button" data-open="' + c._i + '" data-at="' + cs[k] + '" aria-label="' + esc(D.colleges[cs[k]][0]) + ' could adopt: it already teaches a matching course">A</button></td>';
        }
      }
      html += "</tr>";
    }
    if (last < n) html += '<tr class="spacer" style="height:' + ((n - last) * ROW_H) + 'px"><td colspan="' + span + '"></td></tr>';
    if (!n) html = '<tr><td colspan="' + span + '" class="empty">No credential matches these filters.</td></tr>';
    body.innerHTML = html;
  }

  /* ── The side panel ─────────────────────────────────────────────────────────────── */

  function requestBlock(c) {
    var picked = keys(f.colleges), pre = picked.length === 1 ? Number(picked[0]) : -1;
    var college = pre >= 0 ? D.colleges[pre][0] : "";
    var n = asked(c);
    return '<h3 id="pn-req">' + ASK + (n ? ' <span class="askn">' + plural(n, "person has", "people have") + " asked</span>" : "") + '</h3><div class="req">'
      + '<p class="rtsub">Hold this credential, or teach for it? Two ways to ask. The analysis below is there for the faculty who look at it.</p>'
      + '<p class="rt"><b>At your college.</b> ' + (college
        ? 'Reach the person at ' + esc(college) + ' who handles credit for prior learning through <a href="' + FIND_COLLEGE + '" target="_blank" rel="noopener">Find your college</a>, and name this credential.'
        : 'Pick your college above, or reach its credit for prior learning contact through <a href="' + FIND_COLLEGE + '" target="_blank" rel="noopener">Find your college</a>, and name this credential.')
      + ' A student can also add it to their record and request credit at <a href="' + PORTAL + '" target="_blank" rel="noopener">Credit for Being You</a>.</p>'
      + '<p class="rt"><b>Statewide.</b> Ask the Credit for Prior Learning Initiative and the Academic Senate (ASCCC) to prioritize this credential for review. Each request raises it in the order the Initiative works through with colleges. Whether a college evaluates it rests with that college&#x27;s faculty, and the Initiative sends no reply.</p>'
      + '<form id="pn-ask-form" class="ask-form" data-cred="' + esc(c.t) + '" data-issuer="' + esc(c.i || "") + '">'
      + '<label for="pn-ask-college">Your college <span class="opt">(optional)</span></label><input id="pn-ask-college" name="college" type="text" maxlength="120" autocomplete="organization" value="' + esc(college) + '">'
      + '<label for="pn-ask-email">Email <span class="opt">(optional; for the Initiative&#x27;s records, no reply is sent)</span></label><input id="pn-ask-email" name="email" type="email" maxlength="200" autocomplete="email">'
      + '<div class="ask-row"><button type="submit" class="word">Ask us to prioritize it</button></div>'
      + '</form><p class="lines" id="pn-ask-msg" aria-live="polite"></p>'
      + "</div>";
  }

  // The one public write: the credential, an optional college and email; the reply is the count so far.
  function sendAsk(form) {
    var msg = $("pn-ask-msg"), btn = form.querySelector("button[type=submit]");
    var cred = form.getAttribute("data-cred") || "", key = cred.toLowerCase();
    var email = (form.querySelector("[name=email]") || {}).value || "", college = (form.querySelector("[name=college]") || {}).value || "";
    if (!cred) return;
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Sending\u2026";
    return fetch(ASK_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
      body: JSON.stringify({ p_credential: cred, p_issuer: form.getAttribute("data-issuer") || null, p_college: college.trim() || null, p_email: email.trim() || null, p_note: null, p_source: "catalog" }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (n) {
        n = Number(n) || (state.asks[key] || 0) + 1;
        state.asks[key] = n;
        form.hidden = true;
        if (msg) msg.textContent = "Asked. " + plural(n, "person has", "people have") + " asked us to prioritize this credential so far.";
        var h = $("pn-req"); if (h) h.innerHTML = ASK + ' <span class="askn">' + plural(n, "person has", "people have") + " asked</span>";
        if (state.view === "table") drawTable();
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        if (msg) msg.textContent = "The request could not be sent. Try again in a moment, or ask through your college above.";
      });
  }
  function loadAsks() {
    return fetch(COUNTS_URL, { cache: "no-cache", headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) return;
        var asks = {};
        rows.forEach(function (x) { if (x && x.credential && x.n > 0) asks[String(x.credential).toLowerCase()] = Number(x.n); });
        state.asks = asks; state.asksRead = true;
        if (state.view === "table") drawTable(); else if (state.view === "list") drawList();
        drawReview();
      })
      .catch(function () { /* the page stands without the counts */ });
  }

  function bar(x) { return '<span class="conf" aria-hidden="true"><i style="width:' + Math.round(x * 100) + '%"></i></span>' + x.toFixed(2); }

  function analysisBlock(c) {
    var html = '<h3>Analysis for faculty</h3>';
    if (!A) return html + '<p class="lines" id="pn-align-wait">' + (state.alignFailed ? "The analysis is not available right now." : "Reading the analysis…") + "</p>";
    var a = A.align && A.align[c.t], cover = A.cover || {};
    if (!a) {
      return html + '<p class="lines">' + (c.sk ? "The issuer’s " + plural(c.sk, "skill area is", "skill areas are") + " harvested; the course outcomes of the colleges that could carry it are next."
        : "The issuer’s skills are not harvested for this credential yet; the nightly watch adds a batch each run. Course outcomes are harvested for " + plural(cover.colleges || 0, "college", "colleges") + ", " + plural(cover.courses || 0, "course", "courses") + ", so far.") + "</p>";
    }
    html += '<p class="lines">Skills the issuer publishes (' + esc(a.issuer_skills_kind || "skill areas") + (a.source ? ', <a href="' + esc(a.source) + '" target="_blank" rel="noopener">source</a>' : "") + ')</p><ul class="skl">'
      + a.skills.map(function (s) { return "<li>" + esc(s.domain) + (s.weight ? ' <span class="w">' + esc(String(s.weight)) + (/%/.test(String(s.weight)) ? "" : "%") + "</span>" : "") + "</li>"; }).join("") + "</ul>";
    if (!a.courses.length) {
      return html + '<p class="lines">Course outcomes are not harvested yet for the colleges that award it (the harvest covers ' + plural(cover.colleges || 0, "college", "colleges") + ", " + plural(cover.courses || 0, "course", "courses") + ").</p>";
    }
    var rws = [];
    a.courses.forEach(function (co) { co.slos.forEach(function (s) { if (s.score >= 0.2) rws.push({ co: co, s: s }); }); });
    rws.sort(function (x, y) { return y.s.score - x.s.score; });
    var shortOf = function (name) { var c = D.colleges.filter(function (x) { return x[0] === name; })[0]; return c ? c[1] : name; };
    html += '<p class="lines">Harvested course outcomes that align, strongest first</p><table class="al"><thead><tr><th scope="col">Course</th><th scope="col">Outcome</th><th scope="col">Skill area</th><th scope="col">Confidence</th></tr></thead><tbody>'
      + rws.slice(0, 10).map(function (r) {
        return "<tr><td>" + esc(shortOf(r.co.college)) + " " + esc(r.co.code) + '</td><td class="o">' + esc(r.s.text) + '</td><td class="o">' + esc(r.s.skill) + '</td><td class="sc">' + bar(r.s.score) + "</td></tr>";
      }).join("") + "</tbody></table>";
    var best = a.courses[0], ustr = "";
    c.a.forEach(function (x) { if (D.colleges[x[0]][0] === best.college) ustr = units(x[1]) + " units"; });
    html += '<div class="verdict"><b>Recommendation to adopt or adapt:</b> ' + esc(best.college) + "’s " + esc(best.code) + (best.title ? " (" + esc(best.title) + ")" : "") + " articulation pattern"
      + (ustr ? ", " + ustr : "") + ". Outcomes cover " + a.covered + " of " + a.of + " skill areas; confidence " + bar(a.confidence || 0)
      + '.<div class="lines">Illustrative: a word-overlap score on the harvested outcomes and the issuer’s skill areas. The Foundation and ASCCC skills-to-outcomes method replaces it, and faculty verify every alignment before it counts.</div></div>';
    return html;
  }

  function openPanel(ci, at, toReq, toSec) {
    var c = R[ci], sc = state.sc, p = $("ad-panel");
    state.sel = at != null ? [ci, at] : null;
    var types = (c.y || []).map(function (i) { return D.types[i]; }).join(", ");
    var html = "<h2>" + esc(c.t) + '</h2><p class="meta">' + esc([c.i, types || c.k, groupLabel(D, groupKey(c))].filter(Boolean).join(" · ")) + "</p>"
      + '<div class="pills"><span class="pill ' + (c.std === "harvested" ? "harv" : c.std === "awarded" ? "here" : "std") + '">' + esc(STD[stdOf(c, sc)]) + "</span></div>"
      + (c.std !== "awarded" && evidence(c) ? '<p class="ev">' + esc(evidence(c)) + "</p>" : "")
      + (c.u ? '<p class="lines"><a href="' + esc(c.u) + '" target="_blank" rel="noopener">The issuer’s page</a></p>' : "");
    if (at != null) {
      var cell = cellOf(c, at), who = D.colleges[at][0];
      if (cell && cell.kind === "art") html += '<div class="focus"><b>' + esc(who) + "</b> awards <b>" + esc(units(cell.a[1])) + " units</b> for it." + (cell.a[2] ? '<div class="lines">' + esc(cell.a[2]) + "</div>" : "") + "</div>";
      else if (cell) html += '<div class="focus could"><b>' + esc(who) + "</b> has not adopted it yet and already teaches a matching course" + (cell.c[1] ? ": <b>" + esc(cell.c[1]) + "</b>" : "") + ". " + quickAdoptFor(c, at) + "</div>";
    }
    var n = c.a.length;
    if (c.std === "awarded" || n) {
      html += '<h3 id="pn-awards">' + (n ? plural(n, "college awards", "colleges award") + " credit for it" + (c.p != null ? " (" + units(c.p) + " units at the median college)" : "") : "No college awards credit for it yet") + "</h3>";
      if (n) {
        var a = c.a.slice().sort(function (x, y) { return y[1] - x[1] || D.colleges[x[0]][0].localeCompare(D.colleges[y[0]][0]); });
        html += '<table><thead><tr><th scope="col">College</th><th scope="col" class="u">Units</th><th scope="col">Credit lines</th></tr></thead><tbody>'
          + a.map(function (r) { return '<tr><td><button type="button" class="word" data-pick="' + r[0] + '">' + esc(D.colleges[r[0]][1]) + '</button></td><td class="u">' + esc(units(r[1])) + '</td><td class="lines">' + esc(r[2] || "") + "</td></tr>"; }).join("") + "</tbody></table>";
      }
      if (c.w) html += '<p class="lines">' + esc(plural(c.w, "more college teaches", "more colleges teach")) + " a course under a broader identity, not named here.</p>";
    }
    var could = (c.c || []).filter(function (x) { return !sc || sc[x[0]]; });
    if (could.length) html += "<h3>Already teach a matching course and could adopt</h3><ul>" + could.map(function (x) { return "<li>" + esc(D.colleges[x[0]][1]) + (x[1] ? ": " + esc(x[1]) : "") + "</li>"; }).join("") + "</ul>";
    var qa = quickAdopt(c, sc);
    if (qa) html += "<h3>Ask a college to add it</h3>" + qa + '<p class="lines">Request Quick Adopt opens the Mapping Articulated Pathways (MAP) platform, where colleges record this credit; no sign-in is needed. It asks the college that set the credit to open an adoption.</p>';
    if (c.m && c.m.length) html += "<h3>The colleges’ records behind this credential (MAP exhibits)</h3><ul>" + c.m.map(function (m) {
      return '<li><a href="' + esc(mapUrl(m[0])) + '" target="_blank" rel="noopener">' + esc(m[0]) + "</a>" + (m[1] >= 0 ? " · " + esc(D.colleges[m[1]][1]) : m[2] ? " · " + esc(m[2]) : "") + "</li>";
    }).join("") + "</ul>";
    html += (articulated(c) ? "" : requestBlock(c)) + analysisBlock(c);
    $("pn-kicker").textContent = at != null ? "Credential at " + D.colleges[at][1] : "Credential";
    $("pn-body").innerHTML = html;
    p.classList.add("open"); p.setAttribute("aria-hidden", "false"); document.body.classList.add("panel-open");
    $("pn-close").focus();
    if (toReq) { var h = $("pn-req"); if (h) h.scrollIntoView(); }
    else if (toSec) { var h2 = $(toSec); if (h2) h2.scrollIntoView(); else p.scrollTop = 0; }
    else p.scrollTop = 0;
    if (state.view === "matrix") drawWindow(true);
    if (!A && !state.alignFailed) loadAlign(ci, at, toReq, toSec);
  }
  function quickAdoptFor(c, at) {
    var ms = (c.m || []).filter(function (m) { return m[1] !== at; });
    if (!ms.length) return "";
    var seen = {}, chips = [];
    ms.forEach(function (m) { var who = m[1] >= 0 ? D.colleges[m[1]][1] : (m[2] || "MAP"); if (seen[who]) return; seen[who] = true; chips.push('<a class="chip" href="' + esc(mapUrl(m[0])) + '" target="_blank" rel="noopener">' + esc(who) + "</a>"); });
    return '<div class="chips"><span class="lbl">Ask to add it (Request Quick Adopt) from</span>' + chips.slice(0, CHIPS).join("") + "</div>";
  }
  function closePanel() {
    var p = $("ad-panel");
    p.classList.remove("open"); p.setAttribute("aria-hidden", "true"); document.body.classList.remove("panel-open");
    state.sel = null;
    if (state.view === "matrix") drawWindow(true);
  }
  function loadAlign(ci, at, toReq, toSec) {
    state.alignLoading = true;
    fetch(ALIGN_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (a) { A = a; })
      .catch(function () { state.alignFailed = true; })
      .then(function () {
        state.alignLoading = false;
        var w = $("pn-align-wait");
        if (w && $("ad-panel").classList.contains("open")) openPanel(state.sel ? state.sel[0] : ci, state.sel ? state.sel[1] : null, false, "pn-awards");
      });
  }

  // The panel's width: drag its left edge or press the arrow keys on it; the browser keeps the width (layout, never a filter).
  function panelWidth() {
    var grip = $("pn-grip"), drag = null, cur = PANEL_DEFAULT;
    function max() { return Math.max(PANEL_MIN, Math.min(PANEL_MAX, Math.round(window.innerWidth * 0.9))); }
    function setW(w, keep) {
      w = Math.max(PANEL_MIN, Math.min(max(), Math.round(w)));
      document.documentElement.style.setProperty("--panel-w", "min(" + w + "px, 100vw)");
      grip.setAttribute("aria-valuenow", String(w)); grip.setAttribute("aria-valuemax", String(max()));
      if (keep) { try { localStorage.setItem("cpl_catalog_panel_w", String(w)); } catch (e) { /* private window */ } }
      return w;
    }
    try { cur = Number(localStorage.getItem("cpl_catalog_panel_w")) || PANEL_DEFAULT; } catch (e) { cur = PANEL_DEFAULT; }
    cur = setW(cur, false);
    grip.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, w: cur }; document.body.classList.add("panel-resizing");
      try { grip.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
      e.preventDefault();
    });
    grip.addEventListener("pointermove", function (e) { if (drag) cur = setW(drag.w + (drag.x - e.clientX), false); });
    function end() { if (!drag) return; drag = null; document.body.classList.remove("panel-resizing"); setW(cur, true); }
    grip.addEventListener("pointerup", end); grip.addEventListener("pointercancel", end);
    grip.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 96 : 24;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { cur = setW(cur + step, true); e.preventDefault(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") { cur = setW(cur - step, true); e.preventDefault(); }
      else if (e.key === "Home") { cur = setW(max(), true); e.preventDefault(); }
      else if (e.key === "End") { cur = setW(PANEL_MIN, true); e.preventDefault(); }
    });
    window.addEventListener("resize", function () { cur = setW(cur, false); });
  }

  /* ── Worth a faculty review: the search and the field apply; a college scope does not. ─── */
  var REGISTRY = "https://credentialengineregistry.org/resources/";

  function reviewMatch(r, f) {
    if (f.q) {
      var hay = (r.t + " " + (r.i || "") + " " + (r.f || "")).toLowerCase();
      var words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) return false;
    }
    return !any(f.sectors) || !!f.sectors[r.s || NONE_KEY];
  }
  function reviewRows(data, f) { return (data.review || []).filter(function (r) { return reviewMatch(r, f); }); }
  function reviewCard(r) {
    var tags = [];
    if (r.o) tags.push(["Occupations", r.o.join(", ") + (r.on ? ", and " + fmt(r.on) + " more" : "")]);
    if (r.n) tags.push(["Industry", r.n.join(", ") + (r.nn ? ", and " + fmt(r.nn) + " more" : "")]);
    if (r.f) tags.push(["Field", r.f]);
    if (r.l) tags.push(["Level", r.l]);
    var html = '<article class="cred"><h3>' + esc(r.t) + "</h3>";
    if (r.i) html += '<p class="meta">' + esc(r.i) + "</p>";
    if (tags.length) html += '<dl class="tags">' + tags.map(function (t) { return "<dt>" + esc(t[0]) + "</dt><dd>" + esc(t[1]) + "</dd>"; }).join("") + "</dl>";
    if (r.r) html += '<p class="says">A related credential from the same issuer already earns credit: ' + esc(r.r) + ".</p>";
    var links = [];
    if (r.u) links.push('<a class="chip" href="' + esc(r.u) + '" target="_blank" rel="noopener">The issuer’s page</a>');
    links.push('<a class="chip" href="' + esc(REGISTRY + r.k) + '" target="_blank" rel="noopener">Its Credential Engine Registry record</a>');
    return html + '<div class="chips">' + links.join("") + "</div>"
      + (r._k != null ? '<div class="chips"><button type="button" class="word" data-review="' + r._k + '">' + ASK + "</button>" + askedWord(r) + "</div>" : "") + "</article>";
  }
  /* A Worth a faculty review credential has no college articulating it, so its panel carries the request (Sam, 2026-11-06). */
  function openReview(k) {
    var r = (D.review || [])[k], p = $("ad-panel");
    if (!r) return;
    state.sel = null;
    var html = "<h2>" + esc(r.t) + '</h2><p class="meta">' + esc([r.i, r.f].filter(Boolean).join(" · ")) + "</p>"
      + '<div class="pills"><span class="pill harv">Worth a faculty review</span></div>'
      + '<p class="lines">No California community college has set credit for it yet. <a href="' + esc(REGISTRY + r.k) + '" target="_blank" rel="noopener">Its Credential Engine Registry record</a>'
      + (r.u ? ' · <a href="' + esc(r.u) + '" target="_blank" rel="noopener">The issuer&#x27;s page</a>' : "") + "</p>"
      + requestBlock({ t: r.t, i: r.i });
    $("pn-kicker").textContent = "Credential";
    $("pn-body").innerHTML = html;
    p.classList.add("open"); p.setAttribute("aria-hidden", "false"); document.body.classList.add("panel-open");
    $("pn-close").focus();
    var h = $("pn-req"); if (h) h.scrollIntoView();
  }
  function drawReview() {
    var sec = $("review");
    if (!sec) return;
    var all = D.review || [];
    sec.hidden = all.length === 0;
    if (!all.length) return;
    var list = reviewRows(D, f);
    (D.review || []).forEach(function (r, k) { r._k = k; });
    $("ad-review").innerHTML = list.map(reviewCard).join("");
    $("ad-review-empty").hidden = list.length > 0;
    $("ad-review-state").textContent = list.length === all.length ? plural(all.length, "credential", "credentials") : fmt(list.length) + " of " + plural(all.length, "credential", "credentials");
  }

  /* ── Drawing ────────────────────────────────────────────────────────────────────── */

  function redraw(reset) {
    f.q = ($("ad-q").value || "").trim();
    syncStandingToScope();
    var sk = JSON.stringify([f.colleges, f.regions, f.areas]);
    if (state.lastScopeKey !== sk) { state.lastScopeKey = sk; buildStanding(); }
    if (reset) state.shown = PAGE;
    compute();
    drawSel();
    var name = scopeName(), n = state.rows.length, ks = keys(f.standing);
    var what = name && ks.length === 1 && ks[0] === "open" ? " earning credit elsewhere that " + name + " could add"
      : name && ks.length === 1 && ks[0] === "here" ? " earning credit at " + name : "";
    $("ad-state").textContent = plural(n, "credential", "credentials") + what + (grouped(f) ? " in " + plural(state.groups.length, "field", "fields") : "");
    $("ad-note").textContent = name
      ? (f.standing.open && !f.standing.here ? "Each one earns credit at another college. Those whose course this college already teaches come first within a field." : "")
      : "Showing " + fmt(D.credentials.length) + " credentials a person or a rule has reviewed; more join as the review finishes.";
    var oth = Object.keys(state.other), o = $("ad-other");
    o.hidden = !oth.length;
    if (oth.length) {
      o.innerHTML = "Also matching with another credit status: " + oth.map(function (k) { return '<button type="button" class="word" data-std="' + k + '">' + fmt(state.other[k]) + " " + esc(STD[k].toLowerCase()) + "</button>"; }).join(", ") + ".";
      Array.prototype.forEach.call(o.querySelectorAll("[data-std]"), function (b) { b.addEventListener("click", function () { f.standing[b.getAttribute("data-std")] = true; redrawPickers(); redraw(true); }); });
    }
    var hiddenRows = state.flat.length - state.mxRows.length;
    $("ad-mx-note").textContent = hiddenRows > 0 ? "The matrix draws the credentials a college awards or already teaches; " + plural(hiddenRows, "credential with another credit status is", "credentials with other credit statuses are") + " in the Credentials and List views." : "";
    var picked = keys(f.colleges), h = $("ad-handout");
    h.hidden = picked.length !== 1;
    if (picked.length === 1) h.href = HANDOUT + encodeURIComponent(D.colleges[Number(picked[0])][0]);
    try {  // the address follows a single college pick, so a link can be sent; nothing is stored
      history.replaceState(null, "", picked.length === 1 ? "?college=" + encodeURIComponent(D.colleges[Number(picked[0])][0]) : location.pathname);
    } catch (e) { /* the page still works */ }
    if (state.view === "list") drawList(); else if (state.view === "table") drawTable(); else { state.sel = state.sel; buildMatrix(); }
    drawReview();
    tiles();
  }

  function setView(v) {
    state.view = v;
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === v)); });
    $("ad-list-view").hidden = v !== "list"; $("ad-table-view").hidden = v !== "table"; $("ad-matrix-view").hidden = v !== "matrix";
    redraw(false);
  }
  function setSort(s) {
    f.sort = s;
    Array.prototype.forEach.call(document.querySelectorAll("[data-sort]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-sort") === s)); });
    redraw(true);
  }
  function clearAll() {
    f.q = ""; $("ad-q").value = ""; f.colleges = {}; f.regions = {}; f.areas = {}; f.sectors = {}; f.types = {}; f.standing = { awarded: true }; state.hadScope = false;
    redrawPickers(); redraw(true);
  }
  function startWith(k) {
    f.sectors = {}; f.types = {}; f.q = ""; $("ad-q").value = "";
    var typeIdx = function (name) { return String(D.types.indexOf(name)); };
    if (k === "cert") f.types[typeIdx("Industry Certification")] = true;
    if (k === "safety") f.sectors["43"] = true;
    if (k === "military") f.types[typeIdx("Military")] = true;
    if (k === "job") f.types[typeIdx("Portfolio Review")] = true;
    if (k === "exam") f.sectors[EXAM_KEY] = true;
    redrawPickers(); redraw(true);
    $("results").scrollIntoView();
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
    var n = scopeName();
    return "credential-catalog" + (n ? "-" + n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "");
  }

  /* ── The hero photos: the Library page's cycle ───────────────────────────────────── */
  var hero = { i: 0, timer: null, paused: false };
  function slides() { var h = $("ad-hero"); return h ? h.querySelectorAll(".hero-slide") : []; }
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
  function paintPause() { var b = $("ad-hero-pause"); if (b) b.textContent = hero.paused ? "Play photos" : "Pause photos"; }
  function heroPlay() { heroStop(); hero.paused = false; hero.timer = window.setInterval(function () { heroShow(hero.i + 1); }, HERO_MS); paintPause(); }
  function heroPause() { heroStop(); hero.paused = true; paintPause(); }
  function heroInit() {
    var s = slides(), b = $("ad-hero-pause");
    var still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (s.length < 2 || still) { if (b) b.hidden = true; return; }
    prime(s[1]);
    if (b) { b.hidden = false; b.addEventListener("click", function () { if (hero.paused) heroPlay(); else heroPause(); }); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) heroStop(); else if (!hero.paused) heroPlay(); });
    heroPlay();
  }

  /* ── Wiring ─────────────────────────────────────────────────────────────────────── */

  // The three figures follow the filters (Sam, 2026-11-06): every filter but Credit status, since each tile is a status
  // and opens it. Without a college pick they count the state; with one, what earns credit at the colleges picked.
  function tileCounts() {
    var sc = state.sc, colsAw = {}, n = { awarded: 0, harvested: 0 };
    R.forEach(function (c) {
      if (!match(c, f, sc, true)) return;
      if (c.std === "harvested") { n.harvested++; return; }
      if (c.std !== "awarded") return;
      var mine = sc ? c.a.filter(function (a) { return sc[a[0]]; }) : c.a;
      if (sc && !mine.length) return;
      n.awarded++;
      mine.forEach(function (a) { colsAw[a[0]] = true; });
    });
    n.colleges = Object.keys(colsAw).length;
    return n;
  }
  function filtered() { return !!(f.q || any(f.colleges) || any(f.regions) || any(f.areas) || any(f.sectors) || any(f.types)); }
  function tiles() {
    if (!D) return;
    var n = tileCounts(), sc = state.sc;
    $("kpi-awarded").querySelector("b").textContent = fmt(n.awarded);
    $("kpi-awarded").querySelector("span").textContent = sc ? (n.awarded === 1 ? "credential earns" : "credentials earn") + " credit at the colleges picked" : (n.awarded === 1 ? "credential earns" : "credentials earn") + " credit at a college";
    $("kpi-colleges").querySelector("b").textContent = fmt(n.colleges);
    $("kpi-colleges").querySelector("span").textContent = (n.colleges === 1 ? "college awards" : "colleges award") + " that credit";
    $("kpi-harvested").querySelector("b").textContent = fmt(n.harvested);
    $("kpi-harvested").querySelector("span").textContent = (n.harvested === 1 ? "credential" : "credentials") + " not yet evaluated";
    $("kpi-harvested").hidden = !state.hasHarvested;
    $("kpi-scope").hidden = !filtered();
  }
  // A tile opens what it counts: the filters stay, the credit status becomes the tile's.
  function wireTiles() {
    function go(std, view) {
      if (std) { f.standing = {}; f.standing[std] = true; state.hadScope = !!state.sc; redrawPickers(); }
      setView(view); $("results").scrollIntoView();
    }
    $("kpi-awarded").addEventListener("click", function () { go(state.sc ? "here" : "awarded", "list"); });
    $("kpi-colleges").addEventListener("click", function () { go(state.sc ? "here" : "awarded", "matrix"); });
    $("kpi-harvested").addEventListener("click", function () { go("harvested", "table"); });
  }

  function wire() {
    var t = null;
    $("ad-q").addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { redraw(true); }, 160); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) { b.addEventListener("click", function () { setView(b.getAttribute("data-view")); }); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-sort]"), function (b) { b.addEventListener("click", function () { setSort(b.getAttribute("data-sort")); }); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-start]"), function (b) { b.addEventListener("click", function () { startWith(b.getAttribute("data-start")); }); });
    $("ad-clear").addEventListener("click", clearAll);
    $("ad-more").addEventListener("click", function () { state.shown += PAGE; drawList(); });
    $("ad-more-t").addEventListener("click", function () { state.shown += PAGE; drawTable(); });
    $("ad-csv").addEventListener("click", function () { download(slug() + ".csv", csvList(D, state.rows)); });
    $("ad-csv-mx").addEventListener("click", function () { download(slug() + "-matrix.csv", csvMatrix(D, state.rows, state.cols)); });
    $("pn-close").addEventListener("click", closePanel);
    document.addEventListener("submit", function (e) { var fm = e.target; if (fm && fm.id === "pn-ask-form") { e.preventDefault(); sendAsk(fm); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("ad-panel").classList.contains("open")) closePanel(); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      if (b.hasAttribute("data-open")) { var at = b.getAttribute("data-at"); openPanel(Number(b.getAttribute("data-open")), at == null ? null : Number(at), b.hasAttribute("data-req"), b.getAttribute("data-sec")); }
      else if (b.hasAttribute("data-review")) openReview(Number(b.getAttribute("data-review")));
      else if (b.hasAttribute("data-col")) { f.colleges = {}; f.colleges[b.getAttribute("data-col")] = true; redrawPickers(); redraw(true); }
      else if (b.hasAttribute("data-pick")) { f.colleges = {}; f.colleges[b.getAttribute("data-pick")] = true; redrawPickers(); redraw(true); }
      else if (b.hasAttribute("data-q")) { $("ad-q").value = b.getAttribute("data-q"); redraw(true); }
      else if (b.hasAttribute("data-sector")) { f.sectors = {}; f.sectors[b.getAttribute("data-sector")] = true; redrawPickers(); redraw(true); }
      else if (b.hasAttribute("data-type")) { f.types = {}; f.types[b.getAttribute("data-type")] = true; redrawPickers(); redraw(true); }
    });
    var wrap = $("ad-mx-wrap"), raf = 0;
    wrap.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; drawWindow(false); }); });
    window.addEventListener("resize", function () { if (state.view === "matrix") drawWindow(true); });
    wireTiles();
    panelWidth();
    heroInit();
  }

  function addMore(more) {
    (more.harvested || []).forEach(function (h) { h.std = h.ms === "inmap" ? "inmap" : "harvested"; h.a = []; h.c = []; h.m = []; h.y = []; R.push(h); });
    (more.held || []).forEach(function (h) { h.std = "held"; h.a = []; h.c = []; h.m = []; h.y = []; R.push(h); });
    R.forEach(function (c, i) { c._i = i; });
    state.order = fieldOrder(D, R);
    pickers.sector = null; delete pickers.sector;
    state.hasHarvested = R.some(function (c) { return c.std === "harvested"; });
    buildPickers();
    redraw(false);
  }

  function init(data) {
    D = data;
    R = D.credentials.slice();
    R.forEach(function (c, i) { c.std = "awarded"; c._i = i; });
    state.order = fieldOrder(D, R);
    buildPickers();
    var asked = null;
    try { asked = new URLSearchParams(location.search).get("college"); } catch (e) { asked = null; }
    if (asked) D.colleges.forEach(function (c, i) { if (c[0] === asked) f.colleges[i] = true; });
    if (D.written_at) $("ad-asof").textContent = "updated " + new Date(D.written_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    wire();
    redrawPickers();
    redraw(true);
    fetch(MORE_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(addMore)
      .catch(function () { /* the page stands on the settled credentials alone */ });
    loadAsks();
  }

  window.CPL_ADOPT = { scope: scope, stdOf: stdOf, match: match, rows: rows, cols: cols, csvList: csvList, csvMatrix: csvMatrix, mapUrl: mapUrl,
    groupKey: groupKey, fieldOrder: fieldOrder, reviewRows: reviewRows, reviewCard: reviewCard, STD: STD, ASK: ASK, asked: asked };

  if (typeof document === "undefined" || !document.getElementById("ad-list")) return;
  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function () { $("ad-state").textContent = "The credentials could not be read. Try again in a moment."; });
})();
