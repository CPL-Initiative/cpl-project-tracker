/* cip_crosswalk.js — "CIP Code Taxonomy" reference tab (window.CPL_CIP_CROSSWALK)
 *
 * The CO is transitioning course/program coding from TOP to CIP effective fall
 * 2026 (ESS 26-06). This tab is the faculty-facing REFERENCE MANUAL — the
 * successor to the CCC TOP Code Manual, an "easy button" that replaces the
 * multi-tab spreadsheet ESS was going to email to the field.
 *
 *  • Browse / search the full federal CIP-2020 list + a plain-English finder;
 *    each code shows its certified CTE category, definition, examples, family,
 *    and a course-level C-ID/CCN floor.
 *  • INLINE at each code: "Check a course against this CIP." Faculty pick their
 *    college once (remembered), then — while looking at a CIP — choose one of
 *    their local courses (pulled from COCI, best-fit-first) and get a grounded
 *    CONFIDENCE READ on the pairing plus the course's closest CIP codes. Phase 0:
 *    an IDF-weighted vocabulary match of the COCI catalog description against each
 *    CIP's official definition — it can never invent a code. A REVIEW AID, not a
 *    determination; the CIP definition is the final word and the college enters
 *    the code in COCI. Paste-a-description is offered for courses not yet in COCI.
 *
 * Per-college courses are lazy-fetched from cip_fitcheck/<slug>.json (built by
 * kb/_build_cip_fitcheck.py); the college manifest from cip_fitcheck_colleges.json.
 * COE hosts the actual TOP↔CIP crosswalk (linked out). STATIC — NOT regenerated
 * by excel_to_dashboard.py. Data: window.CIP_CROSSWALK (cip_crosswalk_data.js).
 * Scoped CSS under .cipx (own light/dark tokens, no :root). DOM via createElement
 * (never innerHTML with data). Tests: tests/cip_crosswalk.test.js
 */
(function () {
  "use strict";

  var ROOT_ID = "cip-crosswalk-root";
  var CSS_ID = "cip-crosswalk-css";
  var THEME_KEY = "cipx_theme";
  var COLLEGE_KEY = "cipx_college";
  var PAGE = 200;

  var COE_CROSSWALK = "https://datastudio.google.com/u/0/reporting/62925aaa-3c91-48ab-941b-2473c0e17cb7/page/iCRlF";
  var NCES = "https://nces.ed.gov/ipeds/cipcode/browse.aspx?y=56";
  var ESS_MEMO = "https://www.cccco.edu/-/media/CCCCO-Website/docs/memo/ess-26-06-top-to-cip-transition-implementation-guidance-a11y.pdf";

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") n[k] = attrs[k];
        else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  // ── state ──────────────────────────────────────────────────────────────────
  var D = null, ROWS = [], BYCODE = {}, FAMS = {}, IDF = {}, IDF_N = 1;
  var GOFORWARD = { "CTE": 1, "Both": 1, "Non-CTE": 1, "Noncredit": 1 };
  var st = { q: "", cat: "all", fam: "", xfer: false, showRetired: false, limit: PAGE, open: {}, college: null };
  var FIT_COLLEGES = null, FIT_CACHE = {}, FIT_LOADING = {};
  var wrapEl, inputRef, pillsRef, famRef, cbRef, xferRef, listHost, countHost, suggestHost, collegeSelEl;

  function ingest(data) {
    D = data;
    FAMS = (D && D.fams) || {};
    ROWS = ((D && D.rows) || []).slice();
    ROWS.sort(function (a, b) {
      var x = (a.t || "").toLowerCase(), y = (b.t || "").toLowerCase();
      return x < y ? -1 : x > y ? 1 : (a.code < b.code ? -1 : 1);
    });
    BYCODE = {};
    ROWS.forEach(function (r) { BYCODE[r.code] = r; });
    buildEngine();
    try { st.college = localStorage.getItem(COLLEGE_KEY) || null; } catch (e) { st.college = null; }
  }

  // ── theme ────────────────────────────────────────────────────────────────────
  function savedTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function storeTheme(t) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
  function isDark() { return !!(wrapEl && wrapEl.classList.contains("cipx-theme-dark")); }
  function applyTheme(t) { if (wrapEl) { if (t === "dark") wrapEl.classList.add("cipx-theme-dark"); else wrapEl.classList.remove("cipx-theme-dark"); } }

  // ── browse filtering ─────────────────────────────────────────────────────────
  function passes(r) {
    if (!st.showRetired && !GOFORWARD[r.cat]) return false;
    if (st.cat !== "all" && r.cat !== st.cat) return false;
    if (st.fam && r.fam !== st.fam) return false;
    if (st.xfer && !r.x) return false;
    if (st.q) {
      var toks = st.q.split(/\s+/);
      var hay = (r.code + " " + (r.t || "") + " " + (r.def || "") + " " + (r.ex || "")).toLowerCase();
      for (var i = 0; i < toks.length; i++) if (toks[i] && hay.indexOf(toks[i]) < 0) return false;
    }
    return true;
  }
  function filtered() { return ROWS.filter(passes); }

  function catTip(c) {
    return ({ "CTE": "Career Technical Education", "Both": "Both CTE and non-CTE", "Non-CTE": "Not Career Technical Education",
      "Noncredit": "Noncredit CIP", "Retired": "Moved or deleted in the 2020 CIP edition", "Reserved": "Reserved placeholder code" })[c] || c;
  }
  function catClass(c) { return "cipx-cat cipx-cat-" + String(c || "").replace(/[^A-Za-z]/g, ""); }
  function activeFilterLabels() {
    var out = [];
    if (st.cat !== "all") out.push(st.cat);
    if (st.xfer) out.push("C-ID/CCN");
    if (st.fam) out.push((FAMS[st.fam] || st.fam) + " family");
    if (st.showRetired) out.push("incl. retired/reserved");
    return out;
  }
  function resetAll() {
    st.q = ""; st.cat = "all"; st.fam = ""; st.xfer = false; st.showRetired = false; st.limit = PAGE; st.open = {};
    if (inputRef) inputRef.value = "";
    if (famRef) famRef.value = "";
    if (cbRef) cbRef.checked = false;
    if (xferRef) xferRef.setAttribute("aria-pressed", "false");
    if (pillsRef) Array.prototype.forEach.call(pillsRef.querySelectorAll(".cipx-pill"), function (x, i) { x.setAttribute("aria-pressed", i === 0 ? "true" : "false"); });
    if (suggestHost) clear(suggestHost);
    render();
  }
  function hl(s) {
    s = s || "";
    if (!st.q) return [s];
    var toks = st.q.split(/\s+/).filter(Boolean).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!toks.length) return [s];
    var re = new RegExp("(" + toks.join("|") + ")", "ig"), out = [], last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      out.push(el("mark", {}, [m[0]]));
      last = m.index + m[0].length;
      if (re.lastIndex === m.index) re.lastIndex++;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }

  // ── text engine: tokenize + stem + IDF + per-CIP token sets ──────────────────
  var STOP = { i: 1, a: 1, an: 1, the: 1, to: 1, "for": 1, of: 1, "in": 1, on: 1, at: 1, and: 1, or: 1, as: 1, by: 1, be: 1, is: 1, are: 1,
    "this": 1, that: 1, "with": 1, from: 1, will: 1, which: 1, such: 1, may: 1, not: 1, it: 1, its: 1, their: 1, they: 1, "do": 1, how: 1,
    students: 1, student: 1, course: 1, courses: 1, study: 1, studies: 1, introduction: 1, introductory: 1, including: 1, include: 1,
    includes: 1, included: 1, also: 1, using: 1, use: 1, used: 1, various: 1, topics: 1, program: 1, programs: 1, focuses: 1, focus: 1,
    emphasis: 1, prepares: 1, prepare: 1, prepared: 1, preparation: 1, application: 1, applications: 1, knowledge: 1, skill: 1, skills: 1,
    "new": 1, cip: 1, code: 1, codes: 1, want: 1, need: 1, would: 1, like: 1, offer: 1, offering: 1, help: 1, find: 1, about: 1, me: 1, my: 1, we: 1, our: 1 };
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function stem(w) {
    if (w.length < 5) return w;
    var s = w.replace(/(ings?|edly|ed|ations?|tions?|ers?|ors?|ies|es|s)$/, "");
    return s.length >= 4 ? s : w;
  }
  function fitTokens(q) {
    var seen = {}, out = [];
    (q || "").toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) {
      if (w && w.length > 2 && !STOP[w]) { var s = stem(w); if (!seen[s]) { seen[s] = 1; out.push(s); } }
    });
    return out;
  }
  function setOf(arr) { var o = {}; arr.forEach(function (x) { o[x] = 1; }); return o; }
  function buildEngine() {
    var dfmap = {}, N = 0;
    ROWS.forEach(function (r) {
      if (!GOFORWARD[r.cat]) { r._tt = r._te = r._td = null; return; }
      N++;
      r._tt = setOf(fitTokens(r.t || ""));
      r._te = setOf(fitTokens(r.ex || ""));
      r._td = setOf(fitTokens(r.def || ""));
      var seen = {};
      Object.keys(r._tt).forEach(function (t) { seen[t] = 1; });
      Object.keys(r._te).forEach(function (t) { seen[t] = 1; });
      Object.keys(r._td).forEach(function (t) { seen[t] = 1; });
      Object.keys(seen).forEach(function (t) { dfmap[t] = (dfmap[t] || 0) + 1; });
    });
    IDF = {}; IDF_N = N || 1;
    Object.keys(dfmap).forEach(function (t) { IDF[t] = Math.log(1 + IDF_N / (1 + dfmap[t])); });
  }
  function idf(t) { return IDF[t] != null ? IDF[t] : Math.log(1 + IDF_N); }

  // weight of one query token against one CIP row (title > examples > definition)
  function tokWeight(s, r) { return r._tt && r._tt[s] ? 3.0 : (r._te && r._te[s] ? 1.5 : (r._td && r._td[s] ? 1.0 : 0)); }
  function scoreTokensVs(toks, r) {
    var score = 0, matched = [];
    for (var i = 0; i < toks.length; i++) { var f = tokWeight(toks[i], r); if (f) { score += f * idf(toks[i]); matched.push(toks[i]); } }
    return { score: score, matched: matched };
  }
  // rank every active CIP for a query; margin = gap between top and the pack
  function scoreAgainst(query) {
    var qt = fitTokens(query);
    if (!qt.length) return { ranked: [], max: 0, margin: 0, toks: 0 };
    var out = [];
    for (var i = 0; i < ROWS.length; i++) {
      var r = ROWS[i]; if (!GOFORWARD[r.cat]) continue;
      var sc = scoreTokensVs(qt, r);
      if (sc.matched.length) out.push({ r: r, score: sc.score, matched: sc.matched });
    }
    out.sort(function (a, b) { return b.score - a.score || (a.r.t < b.r.t ? -1 : 1); });
    var max = out.length ? out[0].score : 0, top2 = out.length > 1 ? out[1].score : 0;
    out.forEach(function (o) { o.rel = max ? Math.round(o.score / max * 100) : 0; });
    return { ranked: out, max: max, margin: max ? 1 - top2 / max : 0, toks: qt.length };
  }
  function courseToks(c) { if (!c[3]) c[3] = fitTokens((c[0] || "") + " " + (c[1] || "")); return c[3]; }

  // ═══════════════════════════════════════════════════════════════════════════
  // Browse: reference list + finder
  // ═══════════════════════════════════════════════════════════════════════════
  function renderFinder(q) {
    if (!suggestHost) return;
    clear(suggestHost);
    if (!/[a-z]/i.test(q || "")) return;
    var hits = scoreAgainst(q).ranked.slice(0, 6);
    if (!hits.length) return;
    suggestHost.appendChild(el("div", { class: "cipx-sug-lead" }, ["Closest matches for “" + q.trim() + "” — open each to confirm against its definition:"]));
    hits.forEach(function (h) {
      var r = h.r, caret = el("span", { class: "cipx-caret" }, ["▸"]);
      var crow = el("div", { class: "cipx-sug-crow", role: "button", tabindex: "0" }, [
        caret, el("span", { class: "cipx-code" }, [r.code]),
        el("span", { class: "cipx-sug-ct" }, [r.t]),
        r.cat ? el("span", { class: catClass(r.cat), title: catTip(r.cat) }, [r.cat]) : null,
      ]);
      var card = el("div", { class: "cipx-sug-card" }, [crow]);
      if (h.matched.length) card.appendChild(el("div", { class: "cipx-sug-why" }, ["matched: " + h.matched.slice(0, 6).join(", ")]));
      var open = false, det = null;
      function tog() { open = !open; caret.textContent = open ? "▾" : "▸"; if (open) { det = detail(r, true); card.appendChild(det); } else if (det) { card.removeChild(det); det = null; } }
      crow.onclick = tog;
      crow.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); tog(); } };
      suggestHost.appendChild(card);
    });
  }

  function render() {
    var rows = filtered();
    clear(countHost);
    countHost.appendChild(el("span", { class: "cipx-cnum" }, [rows.length.toLocaleString() + " CIP code" + (rows.length === 1 ? "" : "s") + (rows.length > st.limit ? "  ·  showing " + st.limit.toLocaleString() : "")]));
    var af = activeFilterLabels();
    if (af.length) countHost.appendChild(el("span", { class: "cipx-cfilters" }, [" · " + af.join(" · ")]));
    if (af.length || st.q) {
      var clr = el("button", { class: "cipx-clearbtn", type: "button" }, ["✕ Clear " + (af.length && st.q ? "search + filters" : (st.q ? "search" : "filters"))]);
      clr.onclick = resetAll;
      countHost.appendChild(clr);
    }
    countHost.appendChild(el("button", { class: "cipx-csv", type: "button", title: "Download the current filtered list as CSV", onclick: function () { exportCsv(rows); } }, ["⬇ CSV"]));

    clear(listHost);
    if (!rows.length) { listHost.appendChild(el("div", { class: "cipx-empty" }, ["No CIP codes match — try a different word or clear the filters."])); return; }
    rows.slice(0, st.limit).forEach(function (r) {
      var isOpen = !!st.open[r.code];
      var badges = el("div", { class: "cipx-tags" }, []);
      if (r.act === "New") badges.appendChild(el("span", { class: "cipx-new", title: "New in the 2020 CIP edition" }, ["NEW"]));
      if (r.cat) badges.appendChild(el("span", { class: catClass(r.cat), title: catTip(r.cat) }, [r.cat]));
      var row = el("div", { class: "cipx-row", role: "button", tabindex: "0" }, [
        el("span", { class: "cipx-caret" }, [isOpen ? "▾" : "▸"]),
        el("span", { class: "cipx-code" }, [r.code]),
        el("span", { class: "cipx-ttl" }, hl(r.t)),
        badges,
      ]);
      var item = el("div", { class: "cipx-item" + (isOpen ? " cipx-open" : "") }, [row]);
      row.onclick = function () { toggle(r.code); };
      row.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(r.code); } };
      if (isOpen) item.appendChild(detail(r, true));
      listHost.appendChild(item);
    });
    if (rows.length > st.limit) {
      listHost.appendChild(el("div", { class: "cipx-more" }, [el("button", { class: "cipx-morebtn", type: "button", onclick: function () { st.limit += PAGE; render(); } }, ["Show " + Math.min(PAGE, rows.length - st.limit).toLocaleString() + " more"])]));
    }
  }

  function detail(r, withFit) {
    var box = el("div", { class: "cipx-detail" }, []);
    box.appendChild(el("p", { class: "cipx-def" }, [r.def || "No published definition for this code."]));
    if (r.ex) box.appendChild(el("p", { class: "cipx-ex" }, [el("b", {}, ["Examples: "]), r.ex]));
    var meta = el("div", { class: "cipx-dmeta" }, []);
    if (r.fam) meta.appendChild(el("span", {}, [el("b", {}, ["CIP family " + r.fam + " · "]), FAMS[r.fam] || ""]));
    if (r.x) meta.appendChild(el("span", { class: "cipx-xnote", title: "At least one TOP that maps to this CIP has courses carrying a C-ID (transfer-model articulation) or CCN (AB 1111 common course number). A course-level floor — not full CSU/UC transferability." }, ["🎓 C-ID/CCN coursework exists"]));
    box.appendChild(meta);
    box.appendChild(el("a", { class: "cipx-ncesbtn", target: "_blank", rel: "noopener", href: NCES }, ["Look up " + r.code + " in the NCES CIP-2020 list ↗"]));
    if (withFit) box.appendChild(fitBlock(r));
    return box;
  }
  function toggle(code) { if (st.open[code]) delete st.open[code]; else st.open[code] = true; render(); }

  function exportCsv(rows) {
    var out = ["CIP Code,Title,Category,Family,Family Title,2020 CIP Action,C-ID/CCN,Definition"];
    rows.forEach(function (r) {
      function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
      out.push([q(r.code), q(r.t), q(r.cat), q(r.fam), q(FAMS[r.fam] || ""), q(r.act), q(r.x ? "Yes" : "No"), q(r.def)].join(","));
    });
    var blob = new Blob([out.join("\n")], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cip_code_taxonomy.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Inline "Check a course against this CIP"
  // ═══════════════════════════════════════════════════════════════════════════
  function collegeBySlug(slug) { if (!FIT_COLLEGES) return null; for (var i = 0; i < FIT_COLLEGES.length; i++) if (FIT_COLLEGES[i].slug === slug) return FIT_COLLEGES[i]; return null; }

  function fetchColleges() {
    if (FIT_COLLEGES || typeof fetch !== "function") return;
    fetch("cip_fitcheck_colleges.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (m && m.length) { FIT_COLLEGES = m; if (collegeSelEl) populateCollegeSel(); }
    }).catch(function () {});
  }
  function loadCollege(slug) {
    slug = String(slug || "").replace(/[^a-z0-9_]/g, "");
    if (!slug) return Promise.resolve(null);
    if (FIT_CACHE[slug]) return Promise.resolve(FIT_CACHE[slug]);
    if (FIT_LOADING[slug]) return FIT_LOADING[slug];
    if (typeof fetch !== "function") return Promise.resolve(null);
    var p = fetch("cip_fitcheck/" + slug + ".json").then(function (res) { if (!res.ok) throw new Error("load " + res.status); return res.json(); })
      .then(function (arr) { FIT_CACHE[slug] = arr; return arr; });
    FIT_LOADING[slug] = p;
    return p;
  }

  function collegeBar() {
    var bar = el("div", { class: "cipx-collegebar" }, [el("span", { class: "cipx-college-l" }, ["🏫 Your college"])]);
    var sel = el("select", { class: "cipx-college-sel", "aria-label": "Your college" }, [el("option", { value: "" }, [FIT_COLLEGES ? "Choose your college…" : "Loading colleges…"])]);
    collegeSelEl = sel;
    sel.onchange = function () {
      st.college = sel.value || null;
      try { if (st.college) localStorage.setItem(COLLEGE_KEY, st.college); else localStorage.removeItem(COLLEGE_KEY); } catch (e) {}
      if (st.college) loadCollege(st.college);
      render(); // rebuild open rows with the new college
    };
    bar.appendChild(sel);
    bar.appendChild(el("span", { class: "cipx-college-hint" }, ["— set once to check a local course against any code"]));
    if (FIT_COLLEGES) populateCollegeSel();
    return bar;
  }
  function populateCollegeSel() {
    if (!collegeSelEl || !FIT_COLLEGES) return;
    clear(collegeSelEl);
    collegeSelEl.appendChild(el("option", { value: "" }, ["Choose your college…"]));
    FIT_COLLEGES.forEach(function (c) { collegeSelEl.appendChild(el("option", { value: c.slug }, [c.name])); });
    if (st.college) collegeSelEl.value = st.college;
  }

  function fitBlock(r) {
    var wrap = el("div", { class: "cipx-fit" }, [el("div", { class: "cipx-fit-h" }, ["🎯 Check one of your courses against this code"])]);
    if (!st.college) {
      wrap.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Pick your college at the top of the tab, then choose a course here to see how well it fits ", el("b", {}, [r.code]), "."]));
      return wrap;
    }
    var col = collegeBySlug(st.college);
    var body = el("div", { class: "cipx-fit-body" }, [el("div", { class: "cipx-fit-loading" }, ["Loading " + (col ? col.name : "college") + " courses…"])]);
    wrap.appendChild(body);
    loadCollege(st.college).then(function (courses) {
      clear(body);
      if (!courses || !courses.length) { body.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Couldn't load courses for this college right now — try again shortly, or paste a description below."])); addPaste(wrap, r); return; }
      body.appendChild(coursePicker(r, col, courses));
      addPaste(wrap, r);
    }).catch(function () { clear(body); body.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Couldn't load courses for this college right now — try again shortly, or paste a description below."])); addPaste(wrap, r); });
    return wrap;
  }

  function coursePicker(r, col, courses) {
    var box = el("div", {}, []);
    // score every course against THIS cip; best-fit-first for the top group
    var scored = courses.map(function (c, i) { return { i: i, c: c, s: scoreTokensVs(courseToks(c), r).score }; });
    var best = scored.slice().filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    var sel = el("select", { class: "cipx-fit-sel", "aria-label": "Choose one of your courses" }, [el("option", { value: "" }, ["Choose one of your courses…"])]);
    if (best.length) {
      var og1 = el("optgroup", { label: "★ Best matches for " + r.code }, []);
      best.forEach(function (x) { og1.appendChild(el("option", { value: String(x.i) }, [x.c[0]])); });
      sel.appendChild(og1);
    }
    var og2 = el("optgroup", { label: "All " + (col ? col.name : "") + " courses (A–Z)" }, []);
    courses.forEach(function (c, i) { og2.appendChild(el("option", { value: String(i) }, [c[0]])); });
    sel.appendChild(og2);
    box.appendChild(sel);
    var result = el("div", { class: "cipx-fit-result", "aria-live": "polite" }, []);
    box.appendChild(result);
    sel.onchange = function () {
      var v = sel.value;
      if (v === "") { clear(result); return; }
      var c = courses[parseInt(v, 10)];
      if (c) renderFit(result, r, c[0], c[1]);
    };
    return box;
  }

  function addPaste(wrap, r) {
    var link = el("button", { class: "cipx-fit-pastelink", type: "button" }, ["Course not in COCI yet? Paste a description instead"]);
    var holder = el("div", {}, []);
    var shown = false;
    link.onclick = function () {
      if (shown) return; shown = true;
      var ta = el("textarea", { class: "cipx-fitta", rows: "4", "aria-label": "Paste a course description", placeholder: "Paste the course catalog description here…" });
      var go = el("button", { class: "cipx-fitgo", type: "button" }, ["Check the fit"]);
      var res = el("div", { class: "cipx-fit-result", "aria-live": "polite" }, []);
      go.onclick = function () { renderFit(res, r, "Pasted course", ta.value || ""); };
      holder.appendChild(el("div", { class: "cipx-fit-paste" }, [ta, el("div", { class: "cipx-fitactions" }, [go]), res]));
      link.style.display = "none";
    };
    wrap.appendChild(link);
    wrap.appendChild(holder);
  }

  function tierOf(rel) {
    if (rel >= 85) return { key: "ok", label: "Strong fit" };
    if (rel >= 50) return { key: "warn", label: "Plausible — compare" };
    return { key: "bad", label: "Weak — reconsider" };
  }
  function meter(rel, key) {
    return el("div", { class: "cipx-meterwrap", role: "img", "aria-label": rel + "% vocabulary match" }, [
      el("div", { class: "cipx-meter" }, [el("div", { class: "cipx-meter-fill cipx-fill-" + (key || "accent"), style: "width:" + Math.max(3, rel) + "%" }, [])]),
      el("span", { class: "cipx-meterpct" }, [rel + "%"]),
    ]);
  }

  // The confidence read for one course against the CIP row it's expanded under.
  function renderFit(host, r, courseLabel, courseDesc) {
    clear(host);
    var res = scoreAgainst((courseLabel || "") + " " + (courseDesc || ""));
    if (res.toks < 4 || !res.ranked.length) {
      host.appendChild(el("div", { class: "cipx-fitmsg" }, ["Not enough distinctive detail in that course to read confidently — a fuller catalog description works best."]));
      return;
    }
    var idxIn = -1;
    for (var i = 0; i < res.ranked.length; i++) if (res.ranked[i].r.code === r.code) { idxIn = i; break; }
    var entry = idxIn >= 0 ? res.ranked[idxIn] : null;
    var rel = entry ? entry.rel : 0, tier = tierOf(rel), top = res.ranked[0];
    var isClear = res.margin >= 0.28;
    var verdict;
    if (rel >= 85 && !isClear) verdict = "“" + courseLabel + "” lines up well with " + r.code + " — though several codes fit about equally, so compare their definitions.";
    else if (rel >= 85) verdict = "“" + courseLabel + "” " + (idxIn === 0 ? "is the closest match to " : "lines up strongly with ") + r.code + ".";
    else if (rel >= 50) verdict = "“" + courseLabel + "” partly fits " + r.code + ", but " + top.r.code + " " + top.r.t + " matched it more closely — compare the two.";
    else if (entry) verdict = "“" + courseLabel + "” shares little vocabulary with " + r.code + ". " + top.r.code + " " + top.r.t + " fits it much better.";
    else verdict = "“" + courseLabel + "” doesn't share meaningful vocabulary with " + r.code + "'s definition. Its closest match is " + top.r.code + " " + top.r.t + ".";

    host.appendChild(el("div", { class: "cipx-verdict cipx-v-" + tier.key }, [
      el("div", { class: "cipx-vstripe" }, []),
      el("div", { class: "cipx-vbody" }, [
        el("div", { class: "cipx-vhead" }, [el("span", { class: "cipx-vpill cipx-vpill-" + tier.key }, [tier.label]), el("span", { class: "cipx-vfor" }, ["against ", el("span", { class: "cipx-code" }, [r.code])])]),
        el("p", { class: "cipx-vtext" }, [verdict]),
        el("div", { class: "cipx-vmeterrow" }, [el("span", { class: "cipx-vmeterlbl", title: "How much of the course description's distinctive vocabulary lines up with this CIP's official definition, relative to the best-matching code. A lexical triage signal — not a determination." }, ["Vocabulary match"]), meter(rel, tier.key)]),
        entry && entry.matched.length ? el("div", { class: "cipx-vmatched" }, ["Matched: " + entry.matched.slice(0, 8).join(", ")]) : null,
      ]),
    ]));

    host.appendChild(el("div", { class: "cipx-cand-h" }, [idxIn === 0 ? "This is the closest CIP for this course. Other near matches:" : "Codes that fit this course more closely — worth comparing:"]));
    var listWrap = el("div", { class: "cipx-cand-list" }, []);
    res.ranked.slice(0, 5).forEach(function (h) {
      var cr = h.r, isFocus = cr.code === r.code;
      var caret = el("span", { class: "cipx-caret" }, ["▸"]);
      var crow = el("div", { class: "cipx-cand-row", role: "button", tabindex: "0" }, [
        caret, el("span", { class: "cipx-code" }, [cr.code]),
        el("span", { class: "cipx-cand-ct" }, [cr.t, cr.cat ? el("span", { class: catClass(cr.cat), title: catTip(cr.cat) }, [cr.cat]) : null, isFocus ? el("span", { class: "cipx-yourpick" }, ["this code"]) : null]),
        el("span", { class: "cipx-cand-rel" }, [meter(h.rel, isFocus ? tier.key : "accent")]),
      ]);
      var card = el("div", { class: "cipx-cand-card" + (isFocus ? " cipx-cand-mine" : "") }, [crow]);
      if (h.matched.length) card.appendChild(el("div", { class: "cipx-sug-why" }, ["matched: " + h.matched.slice(0, 7).join(", ")]));
      var open = false, det = null;
      function tg() { open = !open; caret.textContent = open ? "▾" : "▸"; if (open) { det = detail(cr, false); card.appendChild(det); } else if (det) { card.removeChild(det); det = null; } }
      crow.onclick = tg;
      crow.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); tg(); } };
      listWrap.appendChild(card);
    });
    host.appendChild(listWrap);
    host.appendChild(el("div", { class: "cipx-fitfoot" }, ["A review aid, not a determination — it compares the course's wording to each CIP's official definition (lexical). The CIP definition is the final word; your college enters the code in COCI."]));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Shell
  // ═══════════════════════════════════════════════════════════════════════════
  function header() {
    var head = el("div", { class: "cipx-head" }, [
      el("div", { class: "cipx-eyebrow" }, ["California Community Colleges · Chancellor's Office"]),
      el("h2", { class: "cipx-h2" }, ["CIP Code Taxonomy"]),
      el("p", { class: "cipx-sub" }, ["The successor to the CCC TOP Code Manual. Course & program coding is moving from ", el("b", {}, ["TOP"]), " to ", el("b", {}, ["CIP"]), " for fall 2026 — browse the full federal CIP-2020 list, and check how well one of your local courses fits any code. (You'll enter your chosen code in COCI.)"]),
      el("div", { class: "cipx-hlinks" }, [
        el("a", { href: COE_CROSSWALK, target: "_blank", rel: "noopener" }, ["TOP ↔ CIP crosswalk (COE) ↗"]),
        el("a", { href: NCES, target: "_blank", rel: "noopener" }, ["NCES CIP-2020 taxonomy ↗"]),
        el("a", { href: ESS_MEMO, target: "_blank", rel: "noopener" }, ["ESS 26-06 transition guidance ↗"]),
      ]),
    ]);
    var themeBtn = el("button", { class: "cipx-themetog", type: "button", "aria-label": "Toggle light or dark theme for this tab" }, []);
    function paint() { themeBtn.textContent = isDark() ? "☀ Light" : "🌙 Dark"; }
    themeBtn.onclick = function () { var next = isDark() ? "light" : "dark"; applyTheme(next); storeTheme(next); paint(); };
    paint();
    head.appendChild(themeBtn);
    return head;
  }

  function buildPanel() {
    var panel = el("div", { class: "cipx-panel" }, [
      el("div", { class: "cipx-panel-h" }, ["Find your CIP code"]),
      el("div", { class: "cipx-panel-sub" }, ["Search by code, title, or keyword — or describe your program in plain English and we'll surface the closest matches."]),
    ]);
    var input = el("input", { class: "cipx-search", id: "cipx-q", type: "search", autocomplete: "off", "aria-label": "Search CIP codes or describe your program", placeholder: "e.g. nursing · 51.3801 · medical assisting · wildland firefighting · HVAC technician" });
    inputRef = input;
    var _t;
    input.oninput = function () { var v = input.value; clearTimeout(_t); _t = setTimeout(function () { st.q = v.toLowerCase().trim(); st.limit = PAGE; render(); renderFinder(v); }, 140); };
    panel.appendChild(input);
    var controls = el("div", { class: "cipx-controls" }, []);
    var pills = el("div", { class: "cipx-pills" }, []); pillsRef = pills;
    [["all", "All"], ["CTE", "CTE"], ["Non-CTE", "Non-CTE"], ["Both", "Both"], ["Noncredit", "Noncredit"]].forEach(function (p) {
      var b = el("button", { class: "cipx-pill", type: "button", "aria-pressed": st.cat === p[0] ? "true" : "false" }, [p[1]]);
      b.onclick = function () { st.cat = p[0]; st.limit = PAGE; Array.prototype.forEach.call(pills.querySelectorAll(".cipx-pill"), function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); render(); };
      pills.appendChild(b);
    });
    controls.appendChild(pills);
    controls.appendChild(el("span", { class: "cipx-chipsep" }, []));
    var xferChip = el("button", { class: "cipx-pill cipx-pill-xfer", type: "button", "aria-pressed": st.xfer ? "true" : "false", title: "CIP codes whose courses carry a C-ID (transfer-model articulation) or CCN (common course number). A course-level floor — not a guarantee of full transferability." }, ["🎓 C-ID/CCN"]);
    xferRef = xferChip;
    xferChip.onclick = function () { st.xfer = !st.xfer; xferChip.setAttribute("aria-pressed", st.xfer ? "true" : "false"); st.limit = PAGE; render(); };
    controls.appendChild(xferChip);
    var fam = el("select", { class: "cipx-fsel", "aria-label": "CIP family" }, [el("option", { value: "" }, ["All CIP families"])]);
    famRef = fam;
    Object.keys(FAMS).sort().forEach(function (f) { fam.appendChild(el("option", { value: f }, [f + " · " + FAMS[f]])); });
    fam.onchange = function () { st.fam = fam.value; st.limit = PAGE; render(); };
    controls.appendChild(fam);
    var tog = el("label", { class: "cipx-retiredtog", title: "Retired = moved/deleted in 2020. Reserved = placeholder codes." }, []);
    var cb = el("input", { type: "checkbox" }); cbRef = cb;
    cb.onchange = function () { st.showRetired = cb.checked; st.limit = PAGE; render(); };
    tog.appendChild(cb); tog.appendChild(document.createTextNode("Include retired / reserved"));
    controls.appendChild(tog);
    panel.appendChild(controls);
    countHost = el("div", { class: "cipx-count" }, []);
    panel.appendChild(countHost);
    return panel;
  }

  function footer() {
    var active = ROWS.filter(function (r) { return GOFORWARD[r.cat]; }).length;
    return el("div", { class: "cipx-foot" }, ["CIP-2020 data from the Chancellor's Office CIP Searchable Workbook (2026-07-15 cut); local course descriptions from COCI. " + active.toLocaleString() + " active CIP codes; retired and reserved codes are hidden unless you tick the box. The CTE / non-CTE / both / noncredit label reflects the Chancellor's Office certified CIP CTE designations."]);
  }

  function rebuildShell() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    clear(root);
    root.removeAttribute("style");
    wrapEl = el("div", { class: "cipx" }, []);
    applyTheme(savedTheme() === "dark" ? "dark" : "light");
    wrapEl.appendChild(header());
    wrapEl.appendChild(buildPanel());
    wrapEl.appendChild(collegeBar());
    suggestHost = el("div", { class: "cipx-suggest" }, []);
    wrapEl.appendChild(suggestHost);
    listHost = el("div", { class: "cipx-list" }, []);
    wrapEl.appendChild(listHost);
    wrapEl.appendChild(footer());
    root.appendChild(wrapEl);
    render();
    fetchColleges();
    if (st.college) loadCollege(st.college);
  }

  // ── CSS ────────────────────────────────────────────────────────────────────
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var css = [
      ".cipx{" +
        "--cipx-page:transparent;--cipx-surface:#ffffff;--cipx-surface-2:#eef3f9;--cipx-surface-sub:#f2f6fb;" +
        "--cipx-text:#16283d;--cipx-text-soft:#3c526b;--cipx-muted:#6a7f96;--cipx-border:#dbe4ee;--cipx-border-strong:#c3d1e0;" +
        "--cipx-accent:#00356b;--cipx-accent-soft:#e7eef6;--cipx-link:#0b5fa8;--cipx-focus:#1f7ae0;--cipx-mark:#ffe89c;--cipx-mark-fg:inherit;" +
        "--cipx-cte-bg:#e7ede7;--cipx-cte-fg:#4c6350;--cipx-both-bg:#e9eaf1;--cipx-both-fg:#565d78;" +
        "--cipx-non-bg:#eceef1;--cipx-non-fg:#59636f;--cipx-nc-bg:#e6edee;--cipx-nc-fg:#4f6a71;" +
        "--cipx-ret-bg:#ececec;--cipx-ret-fg:#767b81;--cipx-new-bg:#efe9dd;--cipx-new-fg:#7a6a49;" +
        "--cipx-ok-bg:#e7ede7;--cipx-ok-fg:#3f5a45;--cipx-ok-stripe:#6f9079;--cipx-warn-bg:#f4ecd8;--cipx-warn-fg:#6f5d33;--cipx-warn-stripe:#c6a24a;--cipx-bad-bg:#efe1dd;--cipx-bad-fg:#7c5147;--cipx-bad-stripe:#b7796b;" +
        "max-width:1200px;margin:0 auto;padding:6px 22px 26px;background:var(--cipx-page);border-radius:14px;font-size:.95rem;color:var(--cipx-text);line-height:1.5;}",
      ".cipx.cipx-theme-dark{" +
        "--cipx-page:#0e1a2b;--cipx-surface:#16263b;--cipx-surface-2:#1b3150;--cipx-surface-sub:#132338;" +
        "--cipx-text:#e7eef6;--cipx-text-soft:#b8c7d8;--cipx-muted:#8397ab;--cipx-border:#274058;--cipx-border-strong:#33506e;" +
        "--cipx-accent:#7db3ec;--cipx-accent-soft:#1b3652;--cipx-link:#8fc0f2;--cipx-focus:#7db3ec;--cipx-mark:#5a4a1a;--cipx-mark-fg:#ffe89c;" +
        "--cipx-cte-bg:#233a2c;--cipx-cte-fg:#a4bda9;--cipx-both-bg:#272c45;--cipx-both-fg:#aeb4d2;--cipx-non-bg:#28323f;--cipx-non-fg:#9aa7b6;--cipx-nc-bg:#1f3841;--cipx-nc-fg:#93b6bf;--cipx-ret-bg:#2a2f36;--cipx-ret-fg:#929aa3;--cipx-new-bg:#34301f;--cipx-new-fg:#c6b78e;" +
        "--cipx-ok-bg:#233a2c;--cipx-ok-fg:#a4bda9;--cipx-ok-stripe:#5f8f74;--cipx-warn-bg:#38321f;--cipx-warn-fg:#d8c48c;--cipx-warn-stripe:#b0913f;--cipx-bad-bg:#3a2723;--cipx-bad-fg:#d9a89c;--cipx-bad-stripe:#a86a5c;}",
      ".cipx-head{position:relative;padding:2px 0 6px;}",
      ".cipx-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--cipx-accent);}",
      ".cipx-h2{margin:.28em 0 .1em;font-size:1.6rem;line-height:1.15;color:var(--cipx-text);}",
      ".cipx-sub{margin:.2em 0 0;color:var(--cipx-text-soft);max-width:72rem;font-size:.98rem;}",
      ".cipx-hlinks{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 2px;font-size:.82rem;}",
      ".cipx-hlinks a{color:var(--cipx-link);text-decoration:none;font-weight:600;}.cipx-hlinks a:hover{text-decoration:underline;}",
      ".cipx-themetog{position:absolute;top:0;right:0;font-family:inherit;font-size:.76rem;font-weight:600;color:var(--cipx-text-soft);background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:7px;padding:6px 13px;cursor:pointer;line-height:1;}",
      ".cipx-themetog:hover{border-color:var(--cipx-accent);color:var(--cipx-accent);}.cipx-themetog:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:2px;}",
      ".cipx-panel{background:var(--cipx-surface-2);border:1px solid var(--cipx-border);border-radius:14px;padding:16px 18px;margin:14px 0 12px;}",
      ".cipx-panel-h{font-weight:700;color:var(--cipx-text);font-size:1.04rem;}.cipx-panel-sub{color:var(--cipx-text-soft);font-size:.88rem;margin:3px 0 12px;}",
      ".cipx-search{width:100%;box-sizing:border-box;padding:12px 14px;font-size:1.03rem;color:var(--cipx-text);background:var(--cipx-surface);border:1.5px solid var(--cipx-border-strong);border-radius:10px;font-family:inherit;}",
      ".cipx-search:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;border-color:var(--cipx-focus);}",
      ".cipx-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;}",
      ".cipx-pills{display:flex;gap:6px;flex-wrap:wrap;}",
      ".cipx-pill{font-size:.82rem;font-weight:600;padding:6px 13px;border-radius:7px;cursor:pointer;border:1px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text-soft);font-family:inherit;}",
      ".cipx-pill:hover{border-color:var(--cipx-accent);}.cipx-pill[aria-pressed=\"true\"]{background:var(--cipx-accent);border-color:var(--cipx-accent);color:#fff;}",
      ".cipx.cipx-theme-dark .cipx-pill[aria-pressed=\"true\"]{color:#0e1a2b;}.cipx-pill-xfer[aria-pressed=\"true\"]{background:var(--cipx-both-fg);border-color:var(--cipx-both-fg);color:#fff;}",
      ".cipx-chipsep{width:1px;align-self:stretch;min-height:22px;background:var(--cipx-border-strong);margin:0 2px;}",
      ".cipx-fsel{font-family:inherit;font-size:.84rem;padding:6px 10px;border-radius:7px;border:1px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);cursor:pointer;max-width:230px;}",
      ".cipx-retiredtog{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;color:var(--cipx-muted);cursor:pointer;margin-left:auto;}",
      ".cipx-count{font-size:.82rem;color:var(--cipx-muted);font-weight:600;margin:13px 0 0;display:flex;align-items:baseline;flex-wrap:wrap;gap:2px;}",
      ".cipx-cfilters{color:var(--cipx-accent);font-weight:650;}.cipx-clearbtn{margin-left:10px;font-size:.78rem;font-weight:600;color:var(--cipx-link);background:none;border:0;cursor:pointer;padding:0;font-family:inherit;}.cipx-clearbtn:hover{text-decoration:underline;}",
      ".cipx-csv{margin-left:auto;font-size:.76rem;font-weight:700;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:7px;padding:3px 9px;cursor:pointer;}",
      // college bar
      ".cipx-collegebar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:10px;padding:9px 14px;margin:0 0 12px;}",
      ".cipx-college-l{font-weight:700;font-size:.86rem;color:var(--cipx-text);}",
      ".cipx-college-sel{font-family:inherit;font-size:.9rem;padding:7px 10px;border-radius:8px;border:1.5px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);cursor:pointer;max-width:340px;flex:1;min-width:180px;}",
      ".cipx-college-sel:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      ".cipx-college-hint{font-size:.78rem;color:var(--cipx-muted);}",
      // suggestions
      ".cipx-suggest{margin:0 0 6px;}",
      ".cipx-sug-lead{font-size:.82rem;color:var(--cipx-text-soft);font-weight:600;margin:6px 2px 6px;}",
      ".cipx-sug-card{background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:10px;margin:7px 0;}",
      ".cipx-sug-crow{display:grid;grid-template-columns:16px 92px 1fr auto;gap:12px;align-items:center;padding:11px 14px;cursor:pointer;}",
      ".cipx-sug-crow:hover{background:var(--cipx-surface-sub);}.cipx-sug-ct{font-weight:600;color:var(--cipx-text);min-width:0;}",
      ".cipx-sug-why{font-size:.74rem;color:var(--cipx-muted);padding:0 14px 10px 122px;}",
      // list
      ".cipx-list{display:flex;flex-direction:column;}",
      ".cipx-item{border-bottom:1px solid var(--cipx-border);}",
      ".cipx-row{display:grid;grid-template-columns:16px 92px 1fr auto;gap:14px;align-items:center;padding:12px 10px;cursor:pointer;}",
      ".cipx-row:hover{background:var(--cipx-surface-sub);}.cipx-item.cipx-open .cipx-row{background:var(--cipx-surface-sub);}",
      ".cipx-caret{color:var(--cipx-muted);font-size:.8rem;width:14px;text-align:center;}",
      ".cipx-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:600;font-size:.9rem;color:var(--cipx-accent);}",
      ".cipx-ttl{font-weight:550;color:var(--cipx-text);min-width:0;}",
      ".cipx-tags{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}",
      ".cipx-cat{font-size:.66rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:3px 9px;border-radius:7px;white-space:nowrap;}",
      ".cipx-cat-CTE{background:var(--cipx-cte-bg);color:var(--cipx-cte-fg);}.cipx-cat-Both{background:var(--cipx-both-bg);color:var(--cipx-both-fg);}.cipx-cat-NonCTE{background:var(--cipx-non-bg);color:var(--cipx-non-fg);}.cipx-cat-Noncredit{background:var(--cipx-nc-bg);color:var(--cipx-nc-fg);}.cipx-cat-Retired,.cipx-cat-Reserved{background:var(--cipx-ret-bg);color:var(--cipx-ret-fg);}",
      ".cipx-new{background:var(--cipx-new-bg);color:var(--cipx-new-fg);font-size:.6rem;font-weight:800;padding:3px 7px;border-radius:7px;letter-spacing:.04em;}",
      ".cipx-detail{padding:4px 10px 20px 122px;}",
      ".cipx-def{margin:2px 0 0;color:var(--cipx-text-soft);line-height:1.6;max-width:80ch;}",
      ".cipx-ex{margin-top:8px;font-size:.85rem;color:var(--cipx-muted);}.cipx-ex b{color:var(--cipx-text-soft);}",
      ".cipx-dmeta{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-size:.82rem;color:var(--cipx-muted);align-items:baseline;}.cipx-dmeta b{color:var(--cipx-text-soft);font-weight:650;}",
      ".cipx-xnote{cursor:help;color:var(--cipx-both-fg);font-weight:600;}",
      ".cipx-ncesbtn{display:inline-block;margin-top:12px;font-size:.82rem;font-weight:600;color:var(--cipx-link);text-decoration:none;border:1px solid var(--cipx-border-strong);border-radius:8px;padding:6px 12px;}.cipx-ncesbtn:hover{border-color:var(--cipx-link);}",
      ".cipx-more{text-align:center;margin:20px 0;}",
      ".cipx-morebtn{font-size:.86rem;font-weight:650;color:var(--cipx-accent);background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:9px;padding:9px 20px;cursor:pointer;font-family:inherit;}",
      ".cipx-empty{text-align:center;padding:48px 12px;color:var(--cipx-muted);}",
      ".cipx mark{background:var(--cipx-mark);color:var(--cipx-mark-fg);border-radius:2px;padding:0 1px;}",
      // inline fit
      ".cipx-fit{margin-top:16px;border-top:1px dashed var(--cipx-border-strong);padding-top:12px;}",
      ".cipx-fit-h{font-weight:700;font-size:.92rem;color:var(--cipx-text);margin-bottom:8px;}",
      ".cipx-fit-nudge{font-size:.85rem;color:var(--cipx-muted);line-height:1.5;}",
      ".cipx-fit-loading{font-size:.85rem;color:var(--cipx-muted);font-style:italic;}",
      ".cipx-fit-sel{width:100%;max-width:560px;box-sizing:border-box;font-family:inherit;font-size:1rem;padding:10px 12px;border-radius:9px;border:1.5px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);cursor:pointer;}",
      ".cipx-fit-sel:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      ".cipx-fit-result{margin-top:10px;}",
      ".cipx-fit-pastelink{display:inline-block;margin-top:12px;font-size:.8rem;font-weight:600;color:var(--cipx-link);background:none;border:0;padding:0;cursor:pointer;font-family:inherit;text-decoration:underline;}",
      ".cipx-fit-paste{margin-top:10px;}",
      ".cipx-fitta{width:100%;max-width:560px;box-sizing:border-box;padding:10px 12px;font-size:1rem;color:var(--cipx-text);background:var(--cipx-surface);border:1.5px solid var(--cipx-border-strong);border-radius:9px;font-family:inherit;resize:vertical;min-height:84px;}",
      ".cipx-fitta:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      ".cipx-fitactions{margin-top:9px;}",
      ".cipx-fitgo{font-size:.86rem;font-weight:700;color:#fff;background:var(--cipx-accent);border:0;border-radius:9px;padding:9px 18px;cursor:pointer;font-family:inherit;}",
      ".cipx.cipx-theme-dark .cipx-fitgo{color:#0e1a2b;}.cipx-fitgo:hover{filter:brightness(1.06);}",
      ".cipx-fitmsg{padding:12px 2px;color:var(--cipx-text-soft);font-size:.88rem;}",
      // verdict
      ".cipx-verdict{display:flex;background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:12px;overflow:hidden;margin:6px 0 12px;}",
      ".cipx-vstripe{width:6px;flex:0 0 6px;}",
      ".cipx-v-ok .cipx-vstripe{background:var(--cipx-ok-stripe);}.cipx-v-warn .cipx-vstripe{background:var(--cipx-warn-stripe);}.cipx-v-bad .cipx-vstripe{background:var(--cipx-bad-stripe);}",
      ".cipx-vbody{padding:13px 15px;flex:1;min-width:0;}",
      ".cipx-vhead{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;}",
      ".cipx-vpill{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:4px 10px;border-radius:7px;white-space:nowrap;}",
      ".cipx-vpill-ok{background:var(--cipx-ok-bg);color:var(--cipx-ok-fg);}.cipx-vpill-warn{background:var(--cipx-warn-bg);color:var(--cipx-warn-fg);}.cipx-vpill-bad{background:var(--cipx-bad-bg);color:var(--cipx-bad-fg);}",
      ".cipx-vfor{font-size:.86rem;color:var(--cipx-text-soft);}",
      ".cipx-vtext{margin:8px 0 0;color:var(--cipx-text);line-height:1.55;max-width:74ch;}",
      ".cipx-vmeterrow{display:flex;align-items:center;gap:10px;margin-top:10px;}",
      ".cipx-vmeterlbl{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--cipx-muted);cursor:help;white-space:nowrap;}",
      ".cipx-meterwrap{display:flex;align-items:center;gap:8px;min-width:150px;flex:1;max-width:300px;}",
      ".cipx-meter{flex:1;height:8px;background:var(--cipx-surface-sub);border-radius:5px;overflow:hidden;}",
      ".cipx-meter-fill{height:100%;border-radius:5px;}",
      ".cipx-fill-ok{background:var(--cipx-ok-stripe);}.cipx-fill-warn{background:var(--cipx-warn-stripe);}.cipx-fill-bad{background:var(--cipx-bad-stripe);}.cipx-fill-accent{background:var(--cipx-accent);}",
      ".cipx-meterpct{font-size:.76rem;font-weight:700;color:var(--cipx-text-soft);font-variant-numeric:tabular-nums;min-width:30px;text-align:right;}",
      ".cipx-vmatched{font-size:.76rem;color:var(--cipx-muted);margin-top:8px;}",
      // candidates
      ".cipx-cand-h{font-size:.86rem;font-weight:700;color:var(--cipx-text);margin:14px 2px 6px;}",
      ".cipx-cand-list{display:flex;flex-direction:column;gap:7px;}",
      ".cipx-cand-card{background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:10px;}",
      ".cipx-cand-mine{border-color:var(--cipx-accent);box-shadow:0 0 0 1px var(--cipx-accent);}",
      ".cipx-cand-row{display:grid;grid-template-columns:16px 92px 1fr 190px;gap:12px;align-items:center;padding:11px 14px;cursor:pointer;}",
      ".cipx-cand-row:hover{background:var(--cipx-surface-sub);}",
      ".cipx-cand-ct{font-weight:600;color:var(--cipx-text);min-width:0;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;}",
      ".cipx-yourpick{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;background:var(--cipx-accent-soft);color:var(--cipx-accent);padding:2px 7px;border-radius:6px;}",
      ".cipx-cand-card .cipx-detail{padding:0 14px 16px 122px;}",
      ".cipx-fitfoot{font-size:.76rem;color:var(--cipx-muted);margin:12px 2px 2px;font-style:italic;line-height:1.55;max-width:80ch;}",
      ".cipx-foot{margin-top:26px;font-size:.76rem;color:var(--cipx-muted);border-top:1px solid var(--cipx-border);padding-top:14px;line-height:1.6;}",
      // mobile
      "@media (max-width:640px){" +
        ".cipx{padding:6px 13px 24px;font-size:.92rem;}.cipx-head{padding-top:36px;}" +
        ".cipx-themetog{padding:5px 10px;font-size:.7rem;border-radius:6px;}.cipx-h2{font-size:1.32rem;}.cipx-sub{font-size:.92rem;}" +
        ".cipx-hlinks{gap:10px 14px;font-size:.79rem;margin-top:10px;}" +
        ".cipx-panel{padding:13px 12px;border-radius:12px;}.cipx-panel-h{font-size:1rem;}.cipx-panel-sub{font-size:.85rem;}" +
        ".cipx-search,.cipx-fitta,.cipx-fit-sel,.cipx-college-sel{font-size:16px;}" +
        ".cipx-controls{gap:7px;}.cipx-pills{gap:5px;}.cipx-pill{padding:5px 10px;font-size:.78rem;}.cipx-chipsep{display:none;}" +
        ".cipx-cat{padding:2px 7px;font-size:.62rem;}.cipx-fsel{max-width:100%;flex:1 1 100%;}.cipx-retiredtog{margin-left:0;flex:1 1 100%;}" +
        ".cipx-count{margin-top:11px;}.cipx-csv{margin-left:0;}" +
        ".cipx-collegebar{padding:10px 12px;}.cipx-college-sel{max-width:100%;flex:1 1 100%;}.cipx-college-hint{flex:1 1 100%;}" +
        ".cipx-row,.cipx-sug-crow{grid-template-columns:13px 56px 1fr auto;gap:9px;}" +
        ".cipx-detail,.cipx-sug-why,.cipx-cand-card .cipx-detail{padding-left:14px;}" +
        ".cipx-fit-sel,.cipx-fitta{max-width:100%;}" +
        ".cipx-cand-row{grid-template-columns:13px 56px 1fr;gap:9px;}.cipx-cand-rel{grid-column:2/-1;margin-top:2px;}.cipx-meterwrap{max-width:none;min-width:0;}" +
        ".cipx-vbody{padding:12px 13px;}.cipx-vpill{font-size:.68rem;padding:3px 8px;}.cipx-vtext{font-size:.92rem;}.cipx-vmeterrow{flex-wrap:wrap;gap:6px;}.cipx-vmeterlbl{white-space:normal;}" +
      "}",
    ].join("");
    var stEl = el("style", { id: CSS_ID });
    stEl.textContent = css;
    document.head.appendChild(stEl);
  }

  // ── lifecycle ────────────────────────────────────────────────────────────────
  var _rendered = false;
  function activate() {
    ensureCss();
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (_rendered) return;
    var data = window.CIP_CROSSWALK;
    if (!data || !data.rows) {
      clear(root); root.removeAttribute("style");
      root.appendChild(el("div", { class: "cipx-empty" }, ["CIP taxonomy data unavailable — cip_crosswalk_data.js failed to load. Rebuild: python3 kb/_build_cip_crosswalk.py"]));
      return;
    }
    _rendered = true;
    ingest(data);
    rebuildShell();
  }

  window.CPL_CIP_CROSSWALK = {
    activate: activate,
    _setData: function (d) { ingest(d); },
    _setColleges: function (m) { FIT_COLLEGES = m; },
    _setCourses: function (slug, arr) { FIT_CACHE[slug] = arr; },
    _passes: passes, _filtered: filtered, _score: scoreAgainst, _courseScore: scoreTokensVs, _courseToks: courseToks,
  };
})();
