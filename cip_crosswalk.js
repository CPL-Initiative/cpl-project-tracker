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
  var MODE_KEY = "cipx_mode";
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
  // Hairline monochrome glyph — stroke:currentColor so it takes the surrounding
  // text color (muted when idle, accent when active). Elegant, not cliparty emoji.
  function svgIcon(d) {
    var NS = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "cipx-tabico"); s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", "15"); s.setAttribute("height", "15"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.appendChild(p);
    return s;
  }

  // ── state ──────────────────────────────────────────────────────────────────
  var D = null, ROWS = [], BYCODE = {}, FAMS = {}, IDF = {}, IDF_N = 1, POSTINGS = {};
  var TOPCIP = {}, BOILER = {}, CIP_TOPS = {};
  var GOFORWARD = { "CTE": 1, "Both": 1, "Non-CTE": 1, "Noncredit": 1 };
  var st = { q: "", cat: "all", fam: "", xfer: false, showRetired: false, limit: PAGE, open: {}, college: null, mode: "review" };
  var FIT_COLLEGES = null, FIT_CACHE = {}, FIT_LOADING = {};
  var CONSENSUS = null, CONSENSUS_COLLEGES = null, CONSENSUS_SUBJECTS = null, CONSENSUS_LOADING = null;
  // confident-consensus thresholds (see consensusPick): >= MIN_N colleges AND >= MAJORITY of them.
  var CONSENSUS_MIN_N = 3, CONSENSUS_MAJORITY = 0.5;
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
    TOPCIP = (D && D.topcip) || {};
    BOILER = {}; ((D && D.boiler) || []).forEach(function (c) { BOILER[c] = 1; });
    // inverse crosswalk: CIP code -> {TOP: 1} — which TOPs map to each CIP. Lets the
    // inline "best matches" anchor on the crosswalk (a course belongs to a CIP's
    // best matches if its current TOP maps there) instead of guessing lexically.
    CIP_TOPS = {};
    Object.keys(TOPCIP).forEach(function (top) {
      (TOPCIP[top].c || []).forEach(function (ct) { (CIP_TOPS[ct[0]] || (CIP_TOPS[ct[0]] = {}))[top] = 1; });
    });
    buildEngine();
    // College is EPHEMERAL — never restored across page loads (Sam, 2026-07-17: "should clear
    // on close"). It lives only in memory (st.college) for the current session; a fresh open /
    // hard refresh starts with no college picked. (Per-college review decisions still persist
    // under cipx_rev_<college> — that's the user's work product, not the selection.)
    st.college = null;
    // Default mode = Review (Sam, 2026-07-18: the primary workflow). A returning user's explicit
    // choice (they clicked a tab, which writes MODE_KEY) is honored; anything else lands on Review.
    try { var _m = localStorage.getItem(MODE_KEY); st.mode = (_m === "browse" || _m === "recommend") ? _m : "review"; } catch (e) { st.mode = "review"; }
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
    POSTINGS = {};   // term -> [rows containing it] — an inverted index so scoring a
                     // query touches only the CIPs that share a token, not all 2,182
                     // (whole-catalog review runs the scorer ~1,500× — see reviewCatalog).
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
      Object.keys(seen).forEach(function (t) { dfmap[t] = (dfmap[t] || 0) + 1; (POSTINGS[t] || (POSTINGS[t] = [])).push(r); });
    });
    IDF = {}; IDF_N = N || 1;
    Object.keys(dfmap).forEach(function (t) { IDF[t] = Math.log(1 + IDF_N / (1 + dfmap[t])); });
  }
  function idf(t) { return IDF[t] != null ? IDF[t] : Math.log(1 + IDF_N); }
  // The 2 boiler codes self-rank at rel 100 on ~275 TOPs; they must never appear in
  // ANY ranked display (they live behind the boiler expander). Filter every fallback
  // "closest by description" list through this.
  function nonBoiler(list) { return list.filter(function (o) { return !BOILER[o.r.code]; }); }

  // weight of one query token against one CIP row (title > examples > definition)
  function tokWeight(s, r) { return r._tt && r._tt[s] ? 3.0 : (r._te && r._te[s] ? 1.5 : (r._td && r._td[s] ? 1.0 : 0)); }
  function scoreTokensVs(toks, r) {
    var score = 0, matched = [];
    for (var i = 0; i < toks.length; i++) { var f = tokWeight(toks[i], r); if (f) { score += f * idf(toks[i]); matched.push(toks[i]); } }
    return { score: score, matched: matched };
  }
  // rank every active CIP for a query; margin = gap between top and the pack.
  // A COVERAGE factor dampens codes that match none of the course's DISTINCTIVE
  // vocabulary: a street-maintenance course mentions "cost accounting" once, which
  // lexically hits the Accounting CIP — but Accounting matches none of the course's
  // identity terms (asphalt, pavement, drainage, concrete), so we down-weight it.
  var COV_K = 8;        // how many of the query's most distinctive terms define "identity"
  var COV_FLOOR = 0.25; // a code matching 0 distinctive terms keeps only this fraction of its score
  function scoreAgainst(query) {
    var qt = fitTokens(query);
    if (!qt.length) return { ranked: [], max: 0, margin: 0, toks: 0 };
    // the query's distinctive terms = its highest-IDF tokens that exist in ≥1 CIP
    var distinct = qt.filter(function (s) { return IDF[s] != null; })
      .map(function (s) { return { s: s, w: IDF[s] }; })
      .sort(function (a, b) { return b.w - a.w; }).slice(0, COV_K);
    var distinctTotal = distinct.reduce(function (a, x) { return a + x.w; }, 0) || 1;
    var out = [], seenR = {};
    // Only score CIPs that share at least one query token (via the inverted index).
    // A CIP with no shared token scores 0 and was filtered out anyway, so this is a
    // pure speedup — identical output, but touches ~hundreds of rows, not all 2,182.
    for (var qi = 0; qi < qt.length; qi++) {
      var post = POSTINGS[qt[qi]]; if (!post) continue;
      for (var pi = 0; pi < post.length; pi++) {
        var r = post[pi];
        if (seenR[r.code]) continue; seenR[r.code] = 1;   // POSTINGS holds only go-forward rows
        var sc = scoreTokensVs(qt, r);
        if (!sc.matched.length) continue;
        var covHit = 0;
        for (var j = 0; j < distinct.length; j++) if (tokWeight(distinct[j].s, r) > 0) covHit += distinct[j].w;
        var coverage = covHit / distinctTotal;
        out.push({ r: r, base: sc.score, coverage: coverage, score: sc.score * (COV_FLOOR + (1 - COV_FLOOR) * coverage), matched: sc.matched });
      }
    }
    out.sort(function (a, b) { return b.score - a.score || (a.r.t < b.r.t ? -1 : 1); });
    var max = out.length ? out[0].score : 0, top2 = out.length > 1 ? out[1].score : 0;
    out.forEach(function (o) { o.rel = max ? Math.round(o.score / max * 100) : 0; });
    return { ranked: out, max: max, margin: max ? 1 - top2 / max : 0, toks: qt.length };
  }
  // A course label is "<SUBJ> <NUM> — <Title>" (e.g. "BUS 103 — Advertising").
  // The subject code + number are ADMINISTRATIVE, not course vocabulary, and they
  // pollute the lexical match — "BUS" was scoring against "Truck and Bus Driver",
  // "NC"/"ES"/"CHLD" and bare numbers add noise. Score only the human title + the
  // catalog description. (The full label is still shown in the UI.)
  function courseTitle(label) { var l = label || "", i = l.indexOf(" — "); return i >= 0 ? l.slice(i + 3) : l; }
  function courseText(c) { return courseTitle(c[0]) + " " + (c[1] || ""); }
  function courseToks(c) { if (!c[3]) c[3] = fitTokens(courseText(c)); return c[3]; }

  // ═══════════════════════════════════════════════════════════════════════════
  // Browse: reference list + finder
  // ═══════════════════════════════════════════════════════════════════════════
  function renderFinder(q) {
    if (!suggestHost) return;
    clear(suggestHost);
    if (!/[a-z]/i.test(q || "")) return;
    var hits = nonBoiler(scoreAgainst(q).ranked).slice(0, 6);
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
    // Preserve scroll: clearing the (tall) list collapses page height, so the
    // browser clamps scroll to the top; we restore it after the rebuild so
    // expanding a row far down the list doesn't zip the viewport to the top.
    var scroller = document.scrollingElement || document.documentElement;
    var _sy = scroller.scrollTop;
    var _restore = function () { scroller.scrollTop = _sy; };
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
    if (!rows.length) { listHost.appendChild(el("div", { class: "cipx-empty" }, ["No CIP codes match — try a different word or clear the filters."])); _restore(); return; }
    rows.slice(0, st.limit).forEach(function (r) {
      var isOpen = !!st.open[r.code];
      var badges = el("div", { class: "cipx-tags" }, []);
      if (r.act === "New") badges.appendChild(el("span", { class: "cipx-new", title: "New in the 2020 CIP edition" }, ["NEW"]));
      if (r.cat) badges.appendChild(el("span", { class: catClass(r.cat), title: catTip(r.cat) }, [r.cat]));
      var row = el("div", { class: "cipx-row", role: "button", tabindex: "0", "aria-expanded": isOpen ? "true" : "false" }, [
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
    _restore();
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

  // ── Cross-college TOP consensus (the corroborating "how do peers code this course?"
  // signal). Lazy-fetched once; see kb/_build_course_top_consensus.py. ──
  function loadConsensus() {
    if (CONSENSUS || CONSENSUS_LOADING || typeof fetch !== "function") return CONSENSUS_LOADING;
    CONSENSUS_LOADING = fetch("course_top_consensus.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.titles) { CONSENSUS = d.titles; CONSENSUS_COLLEGES = d.colleges || []; CONSENSUS_SUBJECTS = d.subjects || []; }
      return CONSENSUS;
    }).catch(function () { return null; });
    return CONSENSUS_LOADING;
  }
  // normalize a course label's title for consensus lookup — MUST match the generator's
  // norm_title (drop the "SUBJ NUM — " prefix, lowercase, non-alphanumerics → spaces).
  function consensusKey(label) {
    var l = label || "", i = l.indexOf(" — ");
    var t = i >= 0 ? l.slice(i + 3) : l;
    return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  // Subject-code matching across colleges (BIO ≈ BIOL ≈ BIOSC ≈ "Biology (BIOL)"). Normalize
  // to alpha-upper, then prefix-containment (min 3 chars). Not perfect — a 3-letter code that
  // prefixes a longer unrelated one can collide (ENG↔ENGR) — but far better than pooling every
  // department, and a real collision would show up as a TOP disagreement anyway.
  function normSubj(s) { return String(s == null ? "" : s).toUpperCase().replace(/[^A-Z]/g, ""); }
  function subjMatch(aRaw, bRaw) {
    var a = normSubj(aRaw), b = normSubj(bRaw); if (!a || !b) return false;
    if (a === b) return true;
    if (a.length >= 3 && b.indexOf(a) === 0) return true;
    if (b.length >= 3 && a.indexOf(b) === 0) return true;
    return false;
  }
  // Peer-coding consensus for one course label. When the course's own SUBJECT is known and
  // enough same-subject peers exist, the consensus is SCOPED to that discipline — "how do
  // peers teaching this title AS A BIOLOGY COURSE code it?" — rather than pooling every
  // department that reuses the title (Sam's BIO 35 Health Science catch: it's a Health course
  // at most colleges but a Biology course at a few; the Health majority must not override a
  // Biology college's coding). Falls back to the full-title consensus when too few same-subject
  // peers exist. Returns the modal TOP + strength metric + per-TOP breakdown; null if unknown.
  function consensusFor(label, querySubj) {
    if (!CONSENSUS) return null;
    var key = consensusKey(label); if (!key) return null;
    var e = CONSENSUS[key]; if (!e || !e.t || !e.t.length) return null;
    var names = CONSENSUS_COLLEGES || [], subs = CONSENSUS_SUBJECTS || [];
    var qn = querySubj ? normSubj(querySubj) : "";
    // build each TOP group with BOTH the full college list and the same-subject subset
    var groups = e.t.map(function (row) {
      var cidxs = row[1] || [], sidxs = row[2] || [];   // parallel; sidxs absent in legacy data
      var colleges = [], scoped = [];
      for (var i = 0; i < cidxs.length; i++) {
        var nm = names[cidxs[i]] || ("#" + cidxs[i]);
        colleges.push(nm);
        var si = i < sidxs.length ? sidxs[i] : -1;
        if (qn && si >= 0 && subjMatch(qn, subs[si])) scoped.push(nm);
      }
      return { top: row[0], topTitle: (TOPCIP[row[0]] || {}).t || "", colleges: colleges, scopedColleges: scoped };
    });
    var scopedTotal = groups.reduce(function (a, g) { return a + g.scopedColleges.length; }, 0);
    var useScoped = !!qn && scopedTotal >= CONSENSUS_MIN_N;
    var mapped = groups.map(function (g) {
      var cols = useScoped ? g.scopedColleges : g.colleges;
      return { top: g.top, topTitle: g.topTitle, n: cols.length, colleges: cols };
    }).filter(function (g) { return g.n > 0; });
    if (!mapped.length) return null;
    mapped.sort(function (a, b) { return b.n - a.n || (a.top < b.top ? -1 : 1); });
    var totalN = useScoped ? scopedTotal : e.n;
    var modal = mapped[0];
    return { key: key, n: totalN, modal: modal, groups: mapped, differ: totalN - modal.n,
      others: mapped.slice(1), scoped: useScoped, subj: querySubj || "" };
  }
  // Among a TOP's crosswalk CIPs, the one that best fits THIS course's description
  // (peer TOP + description-fit = two signals agree). CREDIT-FIRST: the CO crosswalk attaches the
  // whole noncredit CIP family (ESL / basic-skills / exam-prep 32.* codes, provenance "n") to
  // nearly every TOP, so a credit course can spuriously match one on an incidental word ("Gender
  // and Communication" → 32.0203 Exam Prep on "examine"). A Noncredit-category CIP must never
  // out-rank a credit one — same gate computeRecommend already applies, so the consensus pick
  // agrees with the crosswalk pick. Falls back to noncredit only when the TOP has no credit CIP.
  function bestCipForTop(top, m) {
    var e = TOPCIP[top]; if (!e || !e.c || !e.c.length) return null;
    var byCode = {}; (m && m.res && m.res.ranked || []).forEach(function (o) { byCode[o.r.code] = o; });
    var best = null;
    e.c.forEach(function (ct) {
      if (BOILER[ct[0]]) return;
      var r = BYCODE[ct[0]]; if (!r) return;
      var o = byCode[ct[0]] || {};
      var cand = { r: r, rel: o.rel || 0, score: o.score || 0, nc: r.cat === "Noncredit" ? 1 : 0 };
      // credit-first, then description-fit (by score, matching computeRecommend's cands ordering)
      if (!best || cand.nc < best.nc || (cand.nc === best.nc && cand.score > best.score)) best = cand;
    });
    return best;
  }
  // A CONFIDENT peer consensus for whole-catalog PRE-FILL: a clear majority of the colleges
  // teaching this title agree on a field (>= CONSENSUS_MIN_N colleges AND >= CONSENSUS_MAJORITY
  // of them), and that field's TOP maps to a crosswalk CIP. Statewide agreement is the
  // strongest, most-corroborated signal — the two-signals-agree gate applied via the CROWD,
  // stronger than any one college's TOP (§7). So it drives the review sheet's default
  // suggestion + a Ready status: the "pre-fill the whole catalog" easy button (Sam's "kit and
  // kaboodle"). For an OUTLIER course (its own TOP differs from the peers') this pre-fills the
  // peer field's CIP, quietly correcting a mis-coded TOP. A weak/split consensus does NOT
  // pre-fill — it's left to display-only (reviewRecommendation). null = no confident consensus.
  // subj (the course's own subject code) scopes the consensus to same-discipline peers.
  function consensusPick(m, label, ownTop, subj) {
    // Work-experience courses live WITHIN their discipline (every department runs one), but the
    // TITLE "Work Experience Education" is shared across ALL disciplines, so a cross-title peer
    // consensus just finds the modal GENERIC work-experience TOP (4932 → 13.0407 Community College
    // Administration) and would wrongly push an Architecture work-experience course out of
    // Architecture. Never let peer consensus override the discipline here (Sam, 2026-07-18) — the
    // course keeps its own TOP's crosswalk CIP. (Subject-scoping alone doesn't save it: too few
    // same-subject peers share the generic title, so it falls back to the cross-discipline pool.)
    if (isWorkExperience(label)) return null;
    var cons = consensusFor(label, subj); if (!cons) return null;
    var modal = cons.modal;
    if (modal.n < CONSENSUS_MIN_N || modal.n < cons.n * CONSENSUS_MAJORITY) return null;
    var best = bestCipForTop(modal.top, m); if (!best) return null;
    return { cons: cons, modal: modal, best: best, code: best.r.code, outlier: !!(ownTop && modal.top !== ownTop) };
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

  // hairline institution glyph (roof + pillars + base) — matches the tab glyphs
  var COLLEGE_ICON = "M12 4.2L4.5 8.8H19.5L12 4.2M6 9.2V17.4M9.6 9.2V17.4M14.4 9.2V17.4M18 9.2V17.4M4 18.4H20";
  function collegeBar() {
    var bar = el("div", { class: "cipx-collegebar" }, [el("span", { class: "cipx-college-l" }, [svgIcon(COLLEGE_ICON), el("span", {}, ["Your college"])])]);
    var sel = el("select", { class: "cipx-college-sel", "aria-label": "Your college" }, [el("option", { value: "" }, [FIT_COLLEGES ? "Choose your college…" : "Loading colleges…"])]);
    collegeSelEl = sel;
    sel.onchange = function () {
      st.college = sel.value || null;   // in-memory only — intentionally NOT persisted (see activate())
      rev.byDept = {}; rev.courses = null; rev.dept = null;   // the review cache is college-scoped
      if (st.college) loadCollege(st.college);
      // browse: rebuild open rows with the new college. recommend/review are entirely
      // college-scoped views, so they rebuild fully. render() is browse-only (it needs
      // countHost/listHost), so never call it in those modes.
      if (st.mode === "browse") render(); else rebuildShell();
    };
    bar.appendChild(sel);
    // In review mode the Department picker sits here beside the college (reviewView
    // appends it), so the "check one course" hint would be out of place — hold it.
    if (st.mode !== "review") bar.appendChild(el("span", { class: "cipx-college-hint" }, ["— set once to check a local course against any code"]));
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

  // A custom combobox (not a native <select>) so the list opens BELOW the input
  // instead of the browser popping it upward over the row, AND so faculty can
  // TYPE to search all courses (a native 1,800-option select forces scrolling).
  // Shared by the inline per-CIP check and the course-first "Find my course's
  // code" mode. cfg.groupsFor(filter) -> {groups:[[label|null,[course]], …], hint,
  // empty}; cfg.onPick(course) fires on selection. Returns the .cipx-cbwrap box.
  function comboCore(cfg) {
    var box = el("div", { class: "cipx-cbwrap" }, []);
    var input = el("input", { class: "cipx-fit-cb", type: "text", role: "combobox", autocomplete: "off",
      "aria-expanded": "false", "aria-autocomplete": "list", "aria-controls": cfg.id, "aria-label": cfg.label,
      placeholder: cfg.placeholder });
    var panel = el("div", { class: "cipx-fit-panel", id: cfg.id, role: "listbox" }, []);
    panel.style.display = "none";
    var opts = [], active = -1, isOpen = false, onDoc = null, picked = false;
    function pick(c) { picked = true; input.value = c[0]; closePanel(); cfg.onPick(c); }
    function setActive(i) {
      if (active >= 0 && opts[active]) { opts[active].classList.remove("on"); opts[active].removeAttribute("aria-selected"); }
      active = i;
      if (active >= 0 && opts[active]) { opts[active].classList.add("on"); opts[active].setAttribute("aria-selected", "true"); input.setAttribute("aria-activedescendant", opts[active].id); opts[active].scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
    }
    function build(filter) {
      clear(panel); opts = []; setActive(-1);
      var g = cfg.groupsFor((filter || "").toLowerCase().trim());
      (g.groups || []).forEach(function (grp) {
        if (!grp || !grp[1].length) return;
        if (grp[0]) panel.appendChild(el("div", { class: "cipx-cb-group" }, [grp[0]]));
        grp[1].forEach(function (c) {
          var o = el("div", { class: "cipx-cb-opt", role: "option", id: cfg.id + "-o" + opts.length }, [c[0]]);
          o._c = c;
          o.onmousedown = function (e) { e.preventDefault(); pick(c); };
          opts.push(o); panel.appendChild(o);
        });
      });
      if (!opts.length) panel.appendChild(el("div", { class: "cipx-cb-none" }, [g.empty || "No courses to show."]));
      else if (g.hint) panel.appendChild(el("div", { class: "cipx-cb-hint" }, [g.hint]));
    }
    function openPanel() { if (isOpen) return; isOpen = true; input.setAttribute("aria-expanded", "true"); panel.style.display = "block"; build(picked ? "" : input.value); onDoc = function (ev) { if (!document.contains(box)) { closePanel(); return; } if (!box.contains(ev.target)) closePanel(); }; document.addEventListener("mousedown", onDoc, true); }
    function closePanel() { if (!isOpen) return; isOpen = false; input.setAttribute("aria-expanded", "false"); panel.style.display = "none"; setActive(-1); if (onDoc) { document.removeEventListener("mousedown", onDoc, true); onDoc = null; } }
    input.onfocus = openPanel;
    input.onclick = openPanel;
    input.oninput = function () { picked = false; if (!isOpen) openPanel(); build(input.value); };
    input.onkeydown = function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (!isOpen) openPanel(); setActive(Math.min(active + 1, opts.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
      else if (e.key === "Enter") { if (isOpen && active >= 0 && opts[active]) { e.preventDefault(); pick(opts[active]._c); } }
      else if (e.key === "Escape") { closePanel(); }
    };
    box.appendChild(input); box.appendChild(panel);
    return box;
  }

  // The inline "★ Best matches for <CIP>" head start. ANCHOR on the crosswalk: the
  // college's courses whose CURRENT TOP maps to this CIP (two-signals-agree) AND that
  // share some description vocabulary — the >0 guard drops catch-all "Cooperative
  // Education / Independent Study" courses whose broad interdisciplinary TOP maps to
  // dozens of CIPs but share nothing (they were topping "Accounting & Finance").
  // Anchoring kills the lexical false-matches a plain keyword sort produced (a
  // childcare course topping "Aesthetician", history topping "American Literature",
  // "BUS 103" matching "Truck and Bus Driver"). Returns anchored + lexical SEPARATELY
  // so the picker can be honest: when nothing maps, the fallback is labelled a
  // description guess, not presented as a real match.
  function bestMatchCourses(r, courses) {
    var scored = courses.map(function (c) { return { c: c, s: scoreTokensVs(courseToks(c), r).score }; });
    var tops = CIP_TOPS[r.code] || null;
    var anchored = tops ? scored.filter(function (x) { return x.c[2] && tops[x.c[2]] && x.s > 0; }).sort(function (a, b) { return b.s - a.s; }) : [];
    var seen = {}; anchored.forEach(function (x) { seen[x.c[0]] = 1; });
    var lexical = scored.filter(function (x) { return x.s > 0 && !seen[x.c[0]]; }).sort(function (a, b) { return b.s - a.s; });
    return { anchored: anchored.slice(0, 8).map(function (x) { return x.c; }), lexical: lexical.slice(0, 8).map(function (x) { return x.c; }) };
  }

  function coursePicker(r, col, courses) {
    var bm = bestMatchCourses(r, courses);
    var result = el("div", { class: "cipx-fit-result", "aria-live": "polite" }, []);
    var box = comboCore({
      id: "cipx-cbp-" + r.code.replace(/\W/g, ""),
      label: "Choose one of your courses (type to search)",
      placeholder: "Choose one of your courses — type to search…",
      groupsFor: function (filter) {
        if (filter) return { groups: [[null, courses.filter(function (c) { return c[0].toLowerCase().indexOf(filter) >= 0; }).slice(0, 40)]], empty: "No course matches “" + filter + "”." };
        // Crosswalk-anchored matches are real "best matches". When NONE of the
        // college's courses map to this code (it doesn't teach the field), don't
        // dress up generic word-overlap as a match — say so and just present the
        // whole list in A–Z order for the faculty to pick from if they wish
        // (Sam's call: "start the list with that notice, then the whole list").
        var groups = [];
        if (bm.anchored.length) {
          groups.push(["★ Best matches for " + r.code, bm.anchored]);
          groups.push(["All " + (col ? col.name : "") + " courses (A–Z)", courses.slice(0, 40)]);
        } else {
          groups.push(["None of your courses map to " + r.code + " — pick from the full list if you like", courses.slice(0, 40)]);
        }
        return { groups: groups, hint: courses.length > 40 ? "Type to search all " + courses.length.toLocaleString() + " courses." : null };
      },
      onPick: function (c) { renderFit(result, r, c[0], c[1]); }
    });
    box.appendChild(result);
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

  // Tier from the relative match. The scoreAgainst() COVERAGE factor already
  // shapes the score — a code matching only incidental/general wording (like
  // Accounting for a street-maintenance course that mentions "cost accounting")
  // is dampened down into the Plausible band rather than reading Strong. rel%
  // then picks the label, so a course with genuine secondary callouts to a field
  // still earns an honest "Plausible — compare" (Sam's calibration).
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
    var res = scoreAgainst(courseTitle(courseLabel) + " " + (courseDesc || ""));
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
    else if (rel >= 50) verdict = "“" + courseLabel + "” partly fits " + r.code + " (mostly on secondary wording), but " + top.r.code + " " + top.r.t + " matches its core subject more closely — compare the two.";
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
    nonBoiler(res.ranked).slice(0, 5).forEach(function (h) {
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
  // "Find my course's code" — the TOP→CIP easy button (course-first)
  //
  // Every COCI course carries a current TOP code; the CO's official TOP→CIP
  // crosswalk lists candidate CIPs per TOP. We rank those candidates by the same
  // grounded description-fit engine — the TWO-SIGNALS-AGREE gate from the repo's
  // TOP doctrine: the crosswalk PROPOSES, description-fit RANKS, faculty CONFIRMS.
  // TOP corroborates, never decides. A strong description match the crosswalk
  // missed is surfaced separately ("outside the crosswalk") rather than mixed in.
  // ═══════════════════════════════════════════════════════════════════════════
  function provLabel(t) { return ({ o: "official crosswalk", f: "field-submitted", n: "noncredit" })[t] || ""; }
  function provTip(t) {
    return ({ o: "Mapped by the Chancellor's Office (CCCCO / COCI / COE) — an authoritative crosswalk pairing.",
      f: "Submitted by a college in the field — a softer signal the CO hasn't ratified.",
      n: "A noncredit crosswalk pairing." })[t] || "";
  }

  // Work-experience / cooperative-education courses are, by design, offered WITHIN a
  // discipline (colleges run "Accounting Work Experience" so the units count toward
  // THEIR degree/cert). Their generic "supervised employment / on-the-job hours"
  // wording lexically matches unrelated Cooperative-Education CIPs — but that's noise:
  // the course belongs to its own discipline's crosswalk CIP. The fact that it's "work
  // experience" must not push the tool to suggest it fits better elsewhere (Sam,
  // 2026-07-17), so we suppress the "outside the crosswalk" nudge for them.
  function isWorkExperience(label) {
    return /\bwork experience\b|\bwork[- ]based learning\b|\bcooperative (work )?education\b|\bcooperative work experience\b|\boccupational work experience\b/i.test(label || "");
  }

  // Assemble the recommendation model for one course [label, desc, top].
  function computeRecommend(c) {
    var label = c[0] || "", desc = c[1] || "", top = c[2] || "";
    var res = scoreAgainst(courseText(c));
    var byCode = {}; res.ranked.forEach(function (o) { byCode[o.r.code] = o; });
    var tc = TOPCIP[top] || null, inSet = {};
    var cands = [], boiler = [];
    if (tc) {
      tc.c.forEach(function (ct) {
        var r = BYCODE[ct[0]]; if (!r) return;
        inSet[ct[0]] = 1;
        var e = byCode[ct[0]];
        var rec = { r: r, prov: ct[1], rel: e ? e.rel : 0, score: e ? e.score : 0, matched: e ? e.matched : [] };
        (BOILER[ct[0]] ? boiler : cands).push(rec);
      });
      // Credit-first: a Noncredit-category CIP must not out-rank a credit one. A
      // credit course spuriously matching a noncredit boilerplate code (e.g.
      // "Differential Equations" → "High School Equivalent Exam Prep" on the word
      // "equivalent", or a Poli-Sci course → "Community Involvement") was winning the
      // green ✓ over the official credit code, which sat discarded in the same list.
      // Within a class, description-fit still decides (Painting over generic Art).
      cands.sort(function (a, b) {
        var an = a.r.cat === "Noncredit" ? 1 : 0, bn = b.r.cat === "Noncredit" ? 1 : 0;
        return an - bn || b.score - a.score || (a.r.t < b.r.t ? -1 : 1);
      });
      // Confidence is CROSSWALK-RELATIVE: how clearly the description picks each
      // candidate among the crosswalk's options for THIS TOP — normalized to the
      // best-scoring option, not the global max. ("Accounting for Managers" shouldn't
      // read 77% for Accounting just because "Managerial Economics" — which isn't even
      // a valid option for this TOP — scores higher globally.) A quality factor (bestRel
      // / 65) dampens the whole TOP when even its best option is a weak absolute match,
      // so an all-weak TOP still reads honestly low rather than falsely 100%.
      var bestScore = 0, bestRel = 0;
      cands.forEach(function (c) { if (c.score > bestScore) bestScore = c.score; if (c.rel > bestRel) bestRel = c.rel; });
      var qf = Math.min(1, bestRel / 65);
      cands.forEach(function (c) { c.conf = bestScore > 0 ? Math.min(100, Math.round(c.score / bestScore * 100 * qf)) : 0; });
    }
    // recommendation gate: the top (credit-first) candidate is also the best-SCORING
    // one AND clearly ahead of the pack AND a confident (crosswalk-relative) match.
    var recommended = null;
    if (cands.length && cands[0].score > 0) {
      var byScore = cands.slice().sort(function (a, b) { return b.score - a.score; });
      var cwMargin = byScore.length > 1 ? 1 - byScore[1].score / byScore[0].score : 1;
      if (cands[0].score === byScore[0].score && cwMargin >= 0.25 && cands[0].conf >= 85) recommended = cands[0].r.code;
    }
    // strong (rel≥85) description matches the crosswalk doesn't list for this TOP.
    // Exclude the boiler codes — they self-rank at rel 100 on ~275 TOPs and must
    // never surface in a ranked list (they belong behind the boiler expander).
    var beyond = res.ranked.filter(function (o) { return !inSet[o.r.code] && !BOILER[o.r.code] && o.rel >= 85; }).slice(0, 5);
    // Work-experience courses stay in their discipline — don't nudge them elsewhere.
    if (isWorkExperience(label)) beyond = [];
    return { label: label, top: top, topTitle: tc ? tc.t : "", hasCross: !!tc, cands: cands,
      boiler: boiler, recommended: recommended, beyond: beyond, res: res, thin: res.toks < 4 || !res.ranked.length };
  }

  // One candidate card: code, title, category, an honest tier + vocab-match meter,
  // the matched terms (the trust lever), provenance, and an expand to its definition.
  function recCandCard(rec, isRec, flat) {
    // crosswalk candidates carry `conf` (crosswalk-relative); beyond/other entries only rel
    var pct = rec.conf != null ? rec.conf : rec.rel;
    var tier = tierOf(pct), r = rec.r, prov = provLabel(rec.prov);
    var caret = el("span", { class: "cipx-caret" }, ["▸"]);
    var main = el("span", { class: "cipx-rec-main" }, [
      el("span", { class: "cipx-rec-ttl" }, [r.t]),
      r.cat ? el("span", { class: catClass(r.cat), title: catTip(r.cat) }, [r.cat]) : null,
      isRec ? el("span", { class: "cipx-recbadge" }, ["✓ Recommended"]) : null,
      prov ? el("span", { class: "cipx-provlbl", title: provTip(rec.prov) }, [prov]) : null,
    ]);
    var meta = flat ? null : el("span", { class: "cipx-rec-meta" }, [
      el("span", { class: "cipx-tierlbl cipx-tier-" + tier.key }, [tier.label]),
      meter(pct, tier.key),
    ]);
    var row = el("div", { class: "cipx-rec-row" + (flat ? " cipx-rec-row-flat" : ""), role: "button", tabindex: "0", "aria-expanded": "false" }, [
      caret, el("span", { class: "cipx-code" }, [r.code]), main, meta,
    ]);
    var card = el("div", { class: "cipx-rec-card" + (isRec ? " cipx-rec-card-rec" : "") }, [row]);
    if (!flat) card.appendChild(el("div", { class: "cipx-sug-why" }, [rec.matched && rec.matched.length ? "matched: " + rec.matched.slice(0, 6).join(", ") : "no distinctive wording in common with this course"]));
    var open = false, det = null;
    function tg() { open = !open; caret.textContent = open ? "▾" : "▸"; row.setAttribute("aria-expanded", open ? "true" : "false"); if (open) { det = detail(r, false); card.appendChild(det); } else if (det) { card.removeChild(det); det = null; } }
    row.onclick = tg;
    row.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); tg(); } };
    return card;
  }
  function recCardStack(items, recommendedCode, flat) {
    var wrap = el("div", { class: "cipx-rec-list" }, []);
    items.forEach(function (rec) {
      // accept either a candidate rec {r,prov,rel,…} or a ranked entry {r,rel,matched}
      var norm = rec.prov !== undefined ? rec : { r: rec.r, prov: "", rel: rec.rel, score: rec.score, matched: rec.matched };
      wrap.appendChild(recCandCard(norm, norm.r.code === recommendedCode, flat));
    });
    return wrap;
  }

  function boilerExpander(list) {
    var wrap = el("div", { class: "cipx-boiler" }, []);
    var btn = el("button", { class: "cipx-boiler-btn", type: "button", "aria-expanded": "false" },
      ["+ " + list.length + " generic noncredit code" + (list.length === 1 ? "" : "s") + " (Career Exploration, Workforce Development)"]);
    var body = el("div", { class: "cipx-boiler-body" }, []); body.style.display = "none";
    var built = false;
    btn.onclick = function () {
      var open = body.style.display !== "none";
      if (!built) { built = true; list.forEach(function (rec) { body.appendChild(recCandCard(rec, false, false)); }); }
      body.style.display = open ? "none" : "block";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    };
    wrap.appendChild(btn);
    wrap.appendChild(el("div", { class: "cipx-boiler-note" }, ["These map from nearly every TOP code, so they seldom describe a specific course — shown only for completeness."]));
    wrap.appendChild(body);
    return wrap;
  }

  function beyondSection(m) {
    var wrap = el("div", { class: "cipx-beyond" }, []);
    var auto = !m.recommended;   // no clear crosswalk winner → open the drawer
    var caret = el("span", { class: "cipx-caret" }, [auto ? "▾" : "▸"]);
    var btn = el("button", { class: "cipx-beyond-btn", type: "button", "aria-expanded": auto ? "true" : "false" }, [
      caret, el("span", {}, ["⚠ " + m.beyond.length + " strong match" + (m.beyond.length === 1 ? "" : "es") + " outside the crosswalk"]),
    ]);
    var body = el("div", { class: "cipx-beyond-body" }, []);
    var note = el("div", { class: "cipx-beyond-note" }, ["These CIP codes fit this course's wording well but aren't in the official crosswalk for TOP " + (m.top || "—") + (m.topTitle ? " · " + m.topTitle : "") + ". The course's TOP code may be out of date, or the crosswalk may not cover it yet — worth checking against their definitions."]);
    var built = false;
    function build() { if (built) return; built = true; body.appendChild(note); body.appendChild(recCardStack(m.beyond, null, false)); }
    body.style.display = auto ? "block" : "none";
    if (auto) build();
    btn.onclick = function () {
      var open = body.style.display !== "none";
      if (!open) build();
      body.style.display = open ? "none" : "block";
      caret.textContent = open ? "▸" : "▾";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    };
    wrap.appendChild(btn); wrap.appendChild(body);
    return wrap;
  }

  function recFoot() {
    return el("div", { class: "cipx-fitfoot" }, ["A starting point, not a determination. The crosswalk suggests which CIP codes go with your course's TOP; the ranking reflects how the course's wording lines up with each code's official definition (lexical). The definition is the final word — your college enters the code in COCI."]);
  }

  function renderRecommend(host, c) {
    clear(host);
    var m = computeRecommend(c);
    host.appendChild(el("div", { class: "cipx-rec-course" }, [
      el("div", { class: "cipx-rec-clabel" }, [m.label]),
      el("div", { class: "cipx-rec-ctop" }, m.top
        ? ["Current TOP ", el("span", { class: "cipx-code" }, [m.top]), m.topTitle ? " · " + m.topTitle : ""]
        : ["No TOP code is recorded for this course."]),
    ]));

    // the corroborating "how do peers code this course?" signal (extended from review mode).
    // Shown even for thin descriptions — it's the one signal that doesn't need the catalog text.
    var pc = recommendConsensusBlock(m, c[0], c[2] || "", m.topTitle);
    if (pc) host.appendChild(pc);

    if (m.thin) {
      host.appendChild(el("div", { class: "cipx-fitmsg" }, ["This course's description is too short to rank confidently — it doesn't carry enough distinctive wording. ", m.hasCross ? "Here are the crosswalk's CIP codes for this TOP; open each to check it against its definition." : "Try one with a fuller catalog description."]));
      if (m.hasCross && m.cands.length) host.appendChild(recCardStack(m.cands, null, true));
      host.appendChild(recFoot());
      return;
    }

    if (!m.hasCross) {
      host.appendChild(el("div", { class: "cipx-rec-note" }, ["The official crosswalk has no CIP mapping for TOP ", el("span", { class: "cipx-code" }, [m.top || "—"]), " yet. Here are the CIP codes whose definitions best match this course — check each against its definition:"]));
      host.appendChild(recCardStack(nonBoiler(m.res.ranked).slice(0, 6), null, false));
      host.appendChild(recFoot());
      return;
    }

    if (!m.cands.length) {
      // the crosswalk lists only generic noncredit codes for this TOP — fall back
      // to the best description matches (like the no-crosswalk case).
      host.appendChild(el("div", { class: "cipx-rec-note" }, ["The official crosswalk lists only generic noncredit codes for TOP ", el("span", { class: "cipx-code" }, [m.top]), " — nothing course-specific. The CIP codes whose definitions best match this course are below; check each against its definition:"]));
      host.appendChild(recCardStack(nonBoiler(m.res.ranked).slice(0, 6), null, false));
      if (m.boiler.length) host.appendChild(boilerExpander(m.boiler));
      host.appendChild(recFoot());
      return;
    }

    if (m.recommended) {
      var topC = m.cands[0];
      host.appendChild(el("div", { class: "cipx-rec-lead cipx-rec-lead-ok" }, [
        el("b", {}, [topC.r.code + " " + topC.r.t]), " looks like the strongest fit — the official crosswalk lists it for TOP " + m.top + ", and the course description points to it too. Confirm it against the definition, then enter it in COCI.",
      ]));
    } else {
      host.appendChild(el("div", { class: "cipx-rec-lead" }, ["Here are the CIP codes the official crosswalk maps from TOP ", el("span", { class: "cipx-code" }, [m.top]), ", ranked by how well each fits this course. No single clear front-runner — compare the top few against their definitions."]));
    }
    host.appendChild(recCardStack(m.cands, m.recommended, false));
    if (m.boiler.length) host.appendChild(boilerExpander(m.boiler));
    if (m.beyond.length) host.appendChild(beyondSection(m));
    host.appendChild(recFoot());
  }

  function recommendView() {
    var v = el("div", { class: "cipx-rec" }, []);
    var panel = el("div", { class: "cipx-panel" }, [
      el("div", { class: "cipx-panel-h" }, ["Find the CIP code for one of your courses"]),
      el("div", { class: "cipx-panel-sub" }, ["Pick one of your courses — we read its catalog description, look up its current TOP code, and rank the CIP codes the official crosswalk maps from that TOP by how well each fits. A starting point you confirm; your college enters the code in COCI."]),
    ]);
    if (!st.college) {
      panel.appendChild(el("div", { class: "cipx-fit-nudge" }, ["First, pick your college at the top of the tab — then choose a course here."]));
      v.appendChild(panel);
      return v;
    }
    var col = collegeBySlug(st.college);
    var comboHost = el("div", { class: "cipx-rec-combohost" }, [el("div", { class: "cipx-fit-loading" }, ["Loading " + (col ? col.name : "college") + " courses…"])]);
    var resultHost = el("div", { class: "cipx-rec-host", "aria-live": "polite" }, []);
    panel.appendChild(comboHost);
    v.appendChild(panel);
    v.appendChild(resultHost);
    loadCollege(st.college).then(function (courses) {
      clear(comboHost);
      if (!courses || !courses.length) { comboHost.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Couldn't load courses for this college right now — try again shortly."])); return; }
      comboHost.appendChild(comboCore({
        id: "cipx-reccb",
        label: "Choose one of your courses (type to search)",
        placeholder: "Choose one of your courses — type to search…",
        groupsFor: function (filter) {
          var list = filter ? courses.filter(function (c) { return c[0].toLowerCase().indexOf(filter) >= 0; }) : courses;
          return { groups: [[filter ? null : "All " + (col ? col.name : "") + " courses (A–Z)", list.slice(0, 40)]],
            hint: list.length > 40 ? "Showing 40 of " + list.length.toLocaleString() + " — type to narrow." : null,
            empty: "No course matches “" + filter + "”." };
        },
        onPick: function (c) { renderRecommend(resultHost, c); },
      }));
    }).catch(function () { clear(comboHost); comboHost.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Couldn't load courses for this college right now — try again shortly."])); });
    return v;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // "Review my catalog" — the whole-catalog triage sheet (Phase 2)
  //
  // A faculty member has 800–1,500 courses. Doing them one at a time is a slog, so
  // this shows a whole DEPARTMENT at once: each course → its suggested CIP (the
  // easy-button engine, run per course) → a triage status (✓ ready / ⚠ review /
  // ◻ manual). Pre-filled clear ones need a glance; faculty focus on the ⚠ minority,
  // can override a suggestion, bulk-confirm the clear ones, and export CSV. Decisions
  // persist in localStorage (no backend). Work is DEPARTMENT-scoped (nobody owns 1,500
  // courses — they own ACCT), which also keeps each compute to ~1–2s, not a 40s freeze.
  // Framing everywhere: a SUGGESTION you confirm; COCI is the record.
  // ═══════════════════════════════════════════════════════════════════════════
  var rev = { dept: null, filter: "all", q: "", byDept: {}, courses: null };
  var revListHost, revSummaryHost, revDeptSel, revProgHost, revOpen = {}, revRailEl;

  function parseSubject(label) {
    var l = label || "", i = l.indexOf(" — ");
    if (i < 0) return "—";
    var parts = l.slice(0, i).trim().split(/\s+/), subj = [];
    for (var k = 0; k < parts.length; k++) { if (/\d/.test(parts[k])) break; subj.push(parts[k]); }
    return subj.join(" ") || "—";
  }
  function revDecisions() {
    if (!st.college) return {};
    try { return JSON.parse(localStorage.getItem("cipx_rev_" + st.college) || "{}") || {}; } catch (e) { return {}; }
  }
  // A course's chosen CIPs — an ARRAY (a course may carry more than one CIP; the field
  // decides — interdisciplinary courses warrant it). Legacy single-string values migrate.
  function revCips(dec, label) {
    var v = (dec || {})[label];
    return !v ? [] : (Array.isArray(v) ? v.slice() : [v]);
  }
  function revSetCips(label, arr) {
    if (!st.college) return;
    var d = revDecisions();
    if (arr && arr.length) d[label] = arr; else delete d[label];
    try { localStorage.setItem("cipx_rev_" + st.college, JSON.stringify(d)); } catch (e) {}
  }
  function revToggleCip(label, cip) {
    var d = revDecisions(), arr = revCips(d, label), i = arr.indexOf(cip);
    if (i >= 0) arr.splice(i, 1); else arr.push(cip);
    revSetCips(label, arr);
  }

  // classify one course into the triage buckets using the easy-button engine.
  // A CONFIDENT statewide peer consensus is the strongest signal, so it wins: it drives the
  // default suggestion + a Ready status (the whole-catalog pre-fill). Absent that we fall back
  // to the course's own TOP crosswalk. sugKind records the provenance (consensus | crosswalk).
  function reviewRowOf(c) {
    var m = computeRecommend(c), label = c[0] || "", ownTop = c[2] || "", subj = parseSubject(label);
    var cp = consensusPick(m, label, ownTop, subj);
    // the naive "what your current TOP maps to" CIP — the from-own-TOP crosswalk winner. This is
    // the box the college would land on with no help; when peers point elsewhere we show BOTH.
    var crosswalk = m.recommended ? BYCODE[m.recommended]
      : (m.cands && m.cands.length ? m.cands[0].r
      : (m.res.ranked && m.res.ranked.length ? m.res.ranked[0].r : null));
    // BASELINE = the course's OWN discipline (its TOP crosswalk). We start here and only let a
    // TRUSTWORTHY peer consensus refine it.
    var sug, status, sugKind = null, suggestChange = false;
    if (m.thin) { status = "manual"; sug = crosswalk; }
    else if (m.recommended) { status = "clear"; sug = BYCODE[m.recommended]; sugKind = "crosswalk"; }
    else if (m.hasCross && m.cands.length) { status = "review"; sug = m.cands[0].r; sugKind = "crosswalk"; }
    else { status = "manual"; sug = crosswalk; }
    // A peer consensus may OVERRIDE the course's own discipline ONLY when it is SUBJECT-SCOPED
    // (drawn from same-discipline peers). A cross-discipline title pool (consensusFor's full-title
    // fallback, when too few same-subject peers exist) may only CORROBORATE — never override.
    // Sam's CARPT 224 "Materials of Construction": 8/15 colleges file it under Architecture, but
    // this is a Carpentry course (subject CARPT + TOP 0952.10 both agree) — the generic title
    // pooled across construction disciplines must not push it out of Carpentry (→ keep 46.0201).
    if (cp) {
      var consAgrees = crosswalk && cp.code === crosswalk.code;
      if (cp.cons.scoped || consAgrees) {
        sug = cp.best.r; sugKind = "consensus";
        suggestChange = !!(crosswalk && sug && crosswalk.code !== sug.code);
        status = suggestChange ? "suggest" : "clear";
      } else {
        cp = null;   // cross-discipline pool that disagrees → discard, keep the course's discipline
      }
    }
    return { c: c, label: label, subj: subj, top: ownTop, topTitle: m.topTitle,
      sug: sug, sugKind: sugKind, status: status, suggestChange: suggestChange, crosswalk: crosswalk,
      nCand: m.cands.length, disagree: m.beyond.length > 0, cons: cp, m: m };
  }

  function departments(courses) {
    var byd = {};
    courses.forEach(function (c) { var s = parseSubject(c[0]); (byd[s] || (byd[s] = [])).push(c); });
    return Object.keys(byd).sort().map(function (s) { return { subj: s, n: byd[s].length, courses: byd[s] }; });
  }

  // compute a department's rows (chunked so a big department doesn't freeze the UI)
  function computeDept(dept, onProgress, done) {
    if (rev.byDept[dept.subj]) { done(rev.byDept[dept.subj]); return; }
    var rows = [], i = 0, list = dept.courses;
    function chunk() {
      var end = Math.min(i + 40, list.length);
      for (; i < end; i++) rows.push(reviewRowOf(list[i]));
      if (onProgress) onProgress(i, list.length);
      if (i < list.length) (window.requestAnimationFrame || setTimeout)(chunk, 0);
      else { rev.byDept[dept.subj] = rows; done(rows); }
    }
    chunk();
  }

  // Status glyphs kept calm + direct (Sam: the old ⚠⚑ read as alarming/busy).
  //  • "review"  = the crosswalk has candidates but none confidently wins → a visible amber "?"
  //    that reads "your call" at a glance (Sam, 2026-07-18: the old muted "·" was invisible — "should
  //    be a question mark for needing review"). Paired with an inline reason on the row (why it's a ?).
  //  • "suggest" = a peer field points at a DIFFERENT code than your TOP's crosswalk winner → a "⇄"
  //    (consider switching), kept DISTINCT from the review "?"; the two-box row shows the actual codes.
  var REV_STATUS = {
    clear: { g: "✓", label: "Ready", cls: "ok" },
    suggest: { g: "⇄", label: "Suggested", cls: "suggest" },
    review: { g: "?", label: "Review", cls: "warn" },
    manual: { g: "◻", label: "Manual", cls: "muted" },
  };

  function reviewView() {
    var v = el("div", { class: "cipx-rev" }, []);
    v.appendChild(el("div", { class: "cipx-rev-banner" }, ["Each suggestion comes from the course's catalog description, the state TOP→CIP crosswalk, and how peer colleges code the same course. It's a ", el("b", {}, ["starting point you confirm"]), " — your college enters the final code in COCI. Nothing here is saved outside your browser."]));
    if (!st.college) {
      v.appendChild(el("div", { class: "cipx-fit-nudge" }, ["First, pick your college at the top of the tab — then choose a department to review."]));
      return v;
    }
    var col = collegeBySlug(st.college);
    // The Department picker lives UP in the college bar, right beside the college
    // dropdown (Sam: "move Dept selector up next to College") — one control row.
    revDeptSel = el("select", { class: "cipx-rev-deptsel", "aria-label": "Department to review" }, [el("option", { value: "" }, ["Loading " + (col ? col.name : "college") + " courses…"])]);
    revDeptSel.onchange = function () { rev.dept = revDeptSel.value || null; rev.filter = "all"; loadDept(); };
    if (collegeSelEl && collegeSelEl.parentNode) {
      collegeSelEl.parentNode.appendChild(el("span", { class: "cipx-rev-deptinline" }, [el("span", { class: "cipx-rev-deptl" }, ["Department"]), revDeptSel]));
    }
    revProgHost = el("div", { class: "cipx-rev-prog", "aria-live": "polite" }, []);
    v.appendChild(revProgHost);
    revSummaryHost = el("div", { class: "cipx-rev-summary" }, []);
    v.appendChild(revSummaryHost);
    revListHost = el("div", { class: "cipx-rev-list" }, []);
    v.appendChild(revListHost);
    // populate departments once courses are loaded
    loadCollege(st.college).then(function (courses) {
      rev.courses = courses || [];
      clear(revDeptSel);
      if (!rev.courses.length) { revDeptSel.appendChild(el("option", { value: "" }, ["No courses for this college"])); return; }
      revDeptSel.appendChild(el("option", { value: "" }, ["Choose a department…"]));
      var depts = departments(rev.courses);
      depts.forEach(function (d) { revDeptSel.appendChild(el("option", { value: d.subj }, [d.subj + " · " + d.n + " course" + (d.n === 1 ? "" : "s")])); });
      revDeptSel.appendChild(el("option", { value: "__all__" }, ["★ All departments (" + rev.courses.length.toLocaleString() + " courses — slower)"]));
      if (rev.dept) { revDeptSel.value = rev.dept; loadDept(); }
    }).catch(function () { clear(revDeptSel); revDeptSel.appendChild(el("option", { value: "" }, ["Couldn't load courses — try again"])); });
    return v;
  }

  function deptCourses() {
    if (rev.dept === "__all__") return rev.courses || [];
    return (rev.courses || []).filter(function (c) { return parseSubject(c[0]) === rev.dept; });
  }

  function loadDept() {
    if (!rev.dept) { clear(revSummaryHost); clear(revListHost); clear(revProgHost); return; }
    revOpen = {};   // fresh expansion state per department
    var dept = { subj: rev.dept, courses: deptCourses() };
    clear(revListHost); clear(revSummaryHost);
    revProgHost.textContent = "Analyzing " + dept.courses.length.toLocaleString() + " courses…";
    // Wait for the cross-college consensus before classifying — the triage status + pre-fill
    // depend on it, and computeDept caches its rows, so a pre-consensus compute would cache a
    // consensus-blind result. (loadConsensus resolves instantly once loaded / in jsdom.)
    Promise.resolve(loadConsensus()).then(function () {
      if (rev.dept !== dept.subj) return;   // department changed while consensus loaded
      computeDept(dept, function (done, total) { revProgHost.textContent = "Analyzing… " + done + " / " + total; },
        function (rows) { revProgHost.textContent = ""; seedRevOpen(rows); renderReview(rows); });
    });
  }

  // Seed default expansion: rows where peers suggest a DIFFERENT code open by default so the
  // college sees the recommendation without a click (Sam's point 6). Called once per department.
  function seedRevOpen(rows) { rows.forEach(function (r) { if (r.suggestChange) revOpen[r.label] = true; }); }

  function renderReview(rows) {
    var dec = revDecisions();
    var counts = { clear: 0, suggest: 0, review: 0, manual: 0, confirmed: 0, peer: 0 };
    // tally of how many courses land on each suggested code — powers the Review row's "why" line
    // ("same code as N other AB courses"), which makes the Ready/Review split legible (Sam's point 2:
    // on Autobody, 37 Ready + 8 Review all showed 47.0603 with no visible reason). Keyed by SUBJECT +
    // code so the "★ All departments" view (rows span many subjects) counts + labels only same-subject
    // siblings — a cross-subject course sharing the code must not inflate "N other AB courses".
    var codeCount = {};
    rows.forEach(function (r) {
      counts[r.status]++;
      if (revCips(dec, r.label).length) counts.confirmed++;
      if (r.sugKind === "consensus") counts.peer++;
      if (r.sug) { var k = r.subj + "|" + r.sug.code; codeCount[k] = (codeCount[k] || 0) + 1; }
    });
    // Program-coherence default (Sam, 2026-07-18): the CIP a "bunch" of a department's courses share
    // (per subject). A "no clear winner" row whose own crosswalk pick is a weak, uncorroborated guess
    // (e.g. Ironworker "Rigging" → 15.0405 Robotics, from a broad TOP's grab-bag crosswalk) defaults to
    // this dominant code instead — the code most of its IWAP siblings land on — STILL flagged Review.
    var deptTop = {};
    Object.keys(codeCount).forEach(function (k) {
      var i = k.indexOf("|"), subj = k.slice(0, i), n = codeCount[k];
      if (n >= REV_DOMINANT_MIN && (!deptTop[subj] || n > deptTop[subj].n)) deptTop[subj] = { code: k.slice(i + 1), n: n };
    });
    var ctx = { codeCount: codeCount, deptTop: deptTop };
    // summary tiles double as filters — calm glyphs, Suggested surfaced right after All. The bulk
    // Confirm/Accept buttons ride on the SAME row as the tiles (Sam: "stack Confirm all + Accept all
    // on the same row as the number boxes — simple, simple, simple").
    clear(revSummaryHost);
    var tilesRow = el("div", { class: "cipx-rev-tilesrow" }, []);
    var tiles = el("div", { class: "cipx-rev-tiles" }, []);
    [["all", "All", rows.length, ""], ["suggest", "⇄ Suggested", counts.suggest, "suggest"], ["review", "? Review", counts.review, "warn"], ["clear", "✓ Ready", counts.clear, "ok"], ["manual", "◻ Manual", counts.manual, "muted"]].forEach(function (t) {
      if (t[0] === "suggest" && !counts.suggest) return;   // hide the Suggested tile when there are none
      var on = rev.filter === t[0];
      var tile = el("button", { class: "cipx-rev-tile" + (on ? " on" : "") + (t[3] ? " cipx-rev-tile-" + t[3] : ""), type: "button", "aria-pressed": on ? "true" : "false" },
        [el("span", { class: "cipx-rev-tilen" }, [t[2].toLocaleString()]), el("span", { class: "cipx-rev-tilel" }, [t[1]])]);
      tile.onclick = function () { rev.filter = t[0]; renderReview(rows); };
      tiles.appendChild(tile);
    });
    tilesRow.appendChild(tiles);
    var actions = el("div", { class: "cipx-rev-actions" }, []);
    var deptTail = rev.dept !== "__all__" ? " in " + rev.dept : "";
    var unconfirmedClear = rows.filter(function (r) { return r.status === "clear" && r.sug && !revCips(dec, r.label).length; });
    if (unconfirmedClear.length) {
      var bulk = el("button", { class: "cipx-rev-bulk", type: "button", title: "Fills in " + unconfirmedClear.length + " starting-point code" + (unconfirmedClear.length === 1 ? "" : "s") + " here in your browser. It's never final — every code stays editable or clearable, and nothing reaches COCI until your college enters it there." }, ["✓ Confirm all " + unconfirmedClear.length + " ready match" + (unconfirmedClear.length === 1 ? "" : "es") + deptTail]);
      bulk.onclick = function () { unconfirmedClear.forEach(function (r) { revSetCips(r.label, [r.sug.code]); }); renderReview(rows); };
      actions.appendChild(bulk);
    }
    var unconfirmedSuggest = rows.filter(function (r) { return r.status === "suggest" && r.sug && !revCips(dec, r.label).length; });
    if (unconfirmedSuggest.length) {
      var bulkS = el("button", { class: "cipx-rev-bulk cipx-rev-bulk-suggest", type: "button", title: "Accept the peer-suggested code for every course where peers point somewhere other than your current TOP. Review them first — they're expanded below." }, ["Accept all " + unconfirmedSuggest.length + " suggested change" + (unconfirmedSuggest.length === 1 ? "" : "s")]);
      bulkS.onclick = function () { unconfirmedSuggest.forEach(function (r) { revSetCips(r.label, [r.sug.code]); }); renderReview(rows); };
      actions.appendChild(bulkS);
    }
    if (actions.firstChild) tilesRow.appendChild(actions);
    revSummaryHost.appendChild(tilesRow);
    var progline = el("div", { class: "cipx-rev-progline" }, [counts.confirmed.toLocaleString() + " of " + rows.length.toLocaleString() + " confirmed",
      counts.peer ? el("span", { class: "cipx-rev-peercount", title: "Suggestions corroborated by a clear majority of peer colleges teaching the same course in the same discipline — the strongest signal." }, ["  ·  " + counts.peer.toLocaleString() + " peer-corroborated"]) : null]);
    revSummaryHost.appendChild(progline);
    // Reassurance under the bulk buttons (Sam's point 4 — "Confirm all N" reads as scary/irreversible;
    // it isn't). Shown exactly when a bulk-confirm/accept button is present.
    if (unconfirmedClear.length || unconfirmedSuggest.length) {
      revSummaryHost.appendChild(el("div", { class: "cipx-rev-reassure" }, [
        "Confirming just fills in your starting point here in the browser — it's never final, every code stays editable, and nothing reaches COCI until your college enters it there.",
      ]));
    }
    var shown = rows.filter(function (r) { return rev.filter === "all" || r.status === rev.filter; });
    // Expand-all + CSV live in the top-right rail (under Theme), not a full-width row of their own.
    if (revRailEl) {
      clear(revRailEl);
      var anyClosed = shown.some(function (r) { return !revOpen[r.label]; });
      var xall = el("button", { class: "cipx-rev-expand", type: "button" }, [anyClosed ? "⤢ Expand all" : "⤡ Collapse all"]);
      xall.onclick = function () { shown.forEach(function (r) { revOpen[r.label] = anyClosed; }); renderReview(rows); };
      revRailEl.appendChild(xall);
      var csv = el("button", { class: "cipx-rev-csv", type: "button", title: "Download this list as CSV" }, ["⬇ CSV"]);
      csv.onclick = function () { exportReviewCsv(rows, dec, ctx); };
      revRailEl.appendChild(csv);
    }

    // the rows — Suggested first (peers propose a change), then Review, Manual, Ready
    clear(revListHost);
    shown.sort(function (a, b) {
      var order = { suggest: 0, review: 1, manual: 2, clear: 3 };
      if (rev.filter === "all" && order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      if (a.status === "review" && b.status === "review" && a.nCand !== b.nCand) return a.nCand - b.nCand;
      return a.label < b.label ? -1 : 1;
    });
    if (!shown.length) { revListHost.appendChild(el("div", { class: "cipx-empty" }, ["No courses in this view."])); return; }
    // count↔list legibility (Sam's point 2c: "8 Review among 45 shown" confused him). Say exactly what's
    // on screen vs the whole department, and — when a tile filter is active — a one-click way back to All.
    var deptWord = rev.dept === "__all__" ? "course" : rev.dept + " course";
    var showEl;
    if (rev.filter === "all") {
      showEl = el("div", { class: "cipx-rev-showing" }, ["Showing all " + shown.length.toLocaleString() + " " + deptWord + (shown.length === 1 ? "" : "s") + " — the ones needing a look are first."]);
    } else {
      showEl = el("div", { class: "cipx-rev-showing" }, ["Showing the " + shown.length.toLocaleString() + " " + REV_STATUS[rev.filter].label + " " + deptWord + (shown.length === 1 ? "" : "s") + " of " + rows.length.toLocaleString() + " total."]);
      var back = el("button", { class: "cipx-rev-showall", type: "button" }, ["Show all " + rows.length.toLocaleString()]);
      back.onclick = function () { rev.filter = "all"; renderReview(rows); };
      showEl.appendChild(back);
    }
    revListHost.appendChild(showEl);
    shown.slice(0, 300).forEach(function (r) { revListHost.appendChild(reviewRow(r, dec, rows, ctx)); });
    if (shown.length > 300) revListHost.appendChild(el("div", { class: "cipx-rev-more" }, ["Showing 300 of " + shown.length.toLocaleString() + " — narrow by department or filter."]));
  }

  // groupsFor over ALL forward CIP codes — shared by the chip "change" dropdown and the
  // expand panel's "+ Add another code" search (one definition, two call sites).
  function allCodeGroupsFor(f) {
    if (!f) return { groups: [], empty: "Type to search all codes." };
    var hits = ROWS.filter(function (x) { return GOFORWARD[x.cat] && (x.code.indexOf(f) === 0 || (x.t || "").toLowerCase().indexOf(f) >= 0); }).slice(0, 30)
      .map(function (x) { return [x.code + " — " + x.t, "", x.code]; });
    return { groups: [[null, hits]], empty: "No code matches “" + f + "”." };
  }

  // An actionable CIP box: click the body to USE this code (opts.onAccept), click the ▾ to
  // CHANGE to any code — even one not suggested (opts.onChange, Sam's point 5). Absorbs its own
  // clicks so it never toggles the row's expand.
  function cipBox(code, opts) {
    opts = opts || {};
    var row = code ? BYCODE[code] : null;
    var chip = el("span", {
      class: "cipx-rev-chip" + (opts.cls ? " " + opts.cls : "") + (opts.on ? " cipx-rev-chip-on" : ""),
      role: "button", tabindex: "0",
      title: opts.title || (opts.on ? "Confirmed — click ▾ to change" : (opts.onAccept ? "Click to use this code · ▾ to change to any code" : "Click ▾ to choose a code")),
    }, []);
    if (row) {
      chip.appendChild(el("span", { class: "cipx-code" }, [row.code]));
      chip.appendChild(el("span", { class: "cipx-rev-chipt" }, [row.t]));
      if (opts.more) chip.appendChild(el("span", { class: "cipx-rev-chipmore", title: opts.moreTip }, ["+" + opts.more]));
    } else {
      chip.appendChild(el("span", { class: "cipx-rev-none" }, ["— pick a code —"]));
    }
    var panel = null;
    function closeP() { if (panel && panel.parentNode) panel.parentNode.removeChild(panel); panel = null; chip.classList.remove("cipx-rev-chip-open"); }
    function openP() {
      if (panel) { closeP(); return; }
      chip.classList.add("cipx-rev-chip-open");
      panel = el("div", { class: "cipx-rev-chgpanel" }, [
        el("div", { class: "cipx-rev-chghint" }, ["Change to any CIP code:"]),
        comboCore({ id: opts.id || ("cipx-chg-" + (code || "x")), label: "Change CIP code", placeholder: "Type a code or keyword…",
          groupsFor: allCodeGroupsFor,
          onPick: function (picked) { closeP(); if (opts.onChange) opts.onChange(picked[2]); } }),
      ]);
      chip.appendChild(panel);
    }
    var chg = el("span", { class: "cipx-rev-chipchg", role: "button", tabindex: "0", "aria-label": "Change CIP code", title: "Change to any CIP code" }, ["▾"]);
    chg.onclick = function (e) { e.stopPropagation(); openP(); };
    chg.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); openP(); } };
    chip.appendChild(chg);
    chip.onclick = function (e) { e.stopPropagation(); if (opts.onAccept) opts.onAccept(); };
    chip.onkeydown = function (e) {
      if (e.key === "Escape") { closeP(); return; }
      if ((e.key === "Enter" || e.key === " ") && opts.onAccept) { e.stopPropagation(); e.preventDefault(); opts.onAccept(); }
    };
    return chip;
  }

  // The current TOP, labeled, as the left side of the "your code → " transition.
  function fromTopEl(r) {
    // Just "TOP NNNN.NN" inline (uniform width, tabular) so the CIP boxes line up in a clean column
    // (Sam, 2026-07-18). The TOP title varies in length + was already truncated to near-uselessness
    // inline — it lives in the hover tooltip now.
    return r.top
      ? el("span", { class: "cipx-rev-fromtop", title: "Current TOP " + r.top + (r.topTitle ? " · " + r.topTitle : "") }, ["TOP ", el("span", { class: "cipx-code" }, [r.top])])
      : el("span", { class: "cipx-rev-fromtop cipx-rev-fromtop-none", title: "This course has no TOP code" }, ["no TOP"]);
  }
  // "a bunch" of a department's courses share a code (Sam, 2026-07-18) — the threshold at which a
  // dominant code becomes the program-coherence default for that department's no-clear-winner rows.
  var REV_DOMINANT_MIN = 3;

  // The CIP a Review row should DISPLAY. A weak, uncorroborated own-crosswalk pick (its own code is
  // shared by fewer than "a bunch" of sibling courses) is replaced by the DEPARTMENT'S dominant code —
  // "the welding CIP a bunch of the other IWAP courses use" (Sam) — still flagged Review, human-confirmed.
  // Program coherence, display-only; it never changes the row's status. deptTop[subj] = {code, n}.
  function effectiveSug(r, ctx) {
    var code = r.sug ? r.sug.code : null, defaulted = null;
    if (code && r.status === "review" && ctx && ctx.deptTop) {
      var own = ctx.codeCount[r.subj + "|" + code] || 0, dt = ctx.deptTop[r.subj];
      if (dt && own < REV_DOMINANT_MIN && dt.code !== code) { defaulted = dt; code = dt.code; }
    }
    return { code: code, defaulted: defaulted };
  }

  // The inline reason a row is "?" Review (or ◻ Manual) — Sam's point 2: make the Ready/Review split
  // legible so identical-looking rows (all AB → 47.0603) don't read as arbitrary. Ready rows stay clean
  // one-liners; only the attention rows earn a reason line. `eff` = effectiveSug(r, ctx) (already computed).
  function reviewWhy(r, ctx, eff) {
    if (r.status === "review") {
      // Program-coherence default: this course had no clear winner of its own, so we defaulted the box to
      // the code a bunch of its department siblings use — honest about both facts, still needs a look.
      if (eff && eff.defaulted) {
        var dt = eff.defaulted, dr = BYCODE[dt.code];
        return ["No clear match from this course's own description or TOP — defaulted to ", el("b", {}, [dt.code]), (dr ? " " + dr.t : ""), ", the code " + dt.n.toLocaleString() + " of your " + r.subj + " courses use. Still needs review — confirm or change."];
      }
      // other SAME-SUBJECT courses landing on the same code (they share this course's TOP → same
      // crosswalk CIP). An honest DISPLAY of that fact — no "likely right" verdict, since same-TOP
      // siblings are a correlated, TOP-derived signal, not independent corroboration (§7 caveat).
      var peers = (r.sug ? ((ctx && ctx.codeCount[r.subj + "|" + r.sug.code]) || 0) : 0) - 1;
      if (r.sug && peers >= 2) {
        return ["Same code as ", el("b", {}, [peers.toLocaleString()]), " other " + r.subj + " course" + (peers === 1 ? "" : "s") + " here — they all map here from this TOP. Marked for review because the description alone doesn't confirm it; open to confirm or change."];
      }
      return ["No single clear winner from this course's description — open to pick from the crosswalk options or search."];
    }
    if (r.status === "manual") {
      return ["Too little catalog description to suggest a code — open to search all codes."];
    }
    return null;
  }
  // "N of M [BIO] colleges" — the peer-agreement tag, subject-scoped label when applicable.
  function peerTag(r) {
    var c = r.cons; return c.modal.n + " of " + c.cons.n + (c.cons.scoped ? " " + r.subj + " colleges" : " colleges");
  }
  function peerTagTip(r) {
    var c = r.cons;
    return "Among peer colleges teaching “" + c.cons.key + "”" + (c.cons.scoped ? " as a " + r.subj + " course" : "") + ", most use TOP " + c.modal.top + (c.modal.topTitle ? " · " + c.modal.topTitle : "") + ", which the crosswalk maps here.\n\n" + differHover(c.cons);
  }

  function reviewRow(r, dec, allRows, ctx) {
    var cips = revCips(dec, r.label);
    var confirmed = cips.length > 0;
    var eff = effectiveSug(r, ctx);   // may swap a weak review pick for the department's dominant code
    var showCode = cips.length ? cips[0] : eff.code;
    var stat = REV_STATUS[r.status];
    var twoBox = r.suggestChange && !confirmed;
    var caret = el("span", { class: "cipx-caret" }, ["▸"]);
    function onChange(code) { revToggleCip(r.label, code); renderReview(allRows); }
    function accept(code) { return function () { revSetCips(r.label, [code]); renderReview(allRows); }; }
    var chgId = "cipx-chg-" + r.label.replace(/\W/g, "").slice(0, 20);

    // The transition grid: [ current-code label ] → [ CIP box ]. Two aligned rows when peers
    // suggest a different code (Sam's point 1); the CIP-box column is shared so the boxes line up.
    var grid = el("div", { class: "cipx-rev-tocip" + (twoBox ? " cipx-rev-2box" : "") }, []);
    function gline(labelEl, boxEl, cls) {
      grid.appendChild(el("span", { class: "cipx-rev-glabel" + (cls ? " " + cls : "") }, [labelEl]));
      grid.appendChild(el("span", { class: "cipx-rev-arrow" + (cls ? " " + cls : ""), "aria-hidden": "true" }, ["→"]));
      grid.appendChild(el("span", { class: "cipx-rev-gbox" + (cls ? " " + cls : "") }, [boxEl]));
    }
    if (twoBox) {
      // line 1 (muted): your current TOP → what it maps to via the crosswalk
      gline(fromTopEl(r),
        cipBox(r.crosswalk.code, { cls: "cipx-rev-chip-was", id: chgId + "a", onAccept: accept(r.crosswalk.code), onChange: onChange, title: "Use your TOP’s crosswalk code · ▾ to change" }),
        "cipx-rev-l-was");
      // line 2 (highlighted): what peers in this discipline point to
      var recLabel = el("span", { class: "cipx-rev-reclabel", title: peerTagTip(r) }, [el("span", { class: "cipx-rev-recmark", "aria-hidden": "true" }, ["✓"]), "peers ", el("span", { class: "cipx-rev-rectag" }, [peerTag(r)])]);
      gline(recLabel,
        cipBox(r.sug.code, { cls: "cipx-rev-chip-rec", id: chgId + "b", onAccept: accept(r.sug.code), onChange: onChange, title: "Use the peer-suggested code · ▾ to change" }),
        "cipx-rev-l-rec");
    } else {
      gline(fromTopEl(r),
        cipBox(showCode, { on: confirmed, more: cips.length > 1 ? cips.length - 1 : 0, moreTip: cips.join(", "),
          id: chgId, onAccept: confirmed ? null : (showCode ? accept(showCode) : null), onChange: onChange }));
    }
    // Quiet by default (Sam, 2026-07-18 — "ship it"): a Ready row is a clean one-liner. The peer-
    // corroboration metric that used to sit on a second line ("✓ N of M colleges agree") now lives
    // on the ✓'s tooltip + a faint peer-corroborated dot, and in the expanded card — not repeated on
    // every row. The two-box Suggested row keeps its full display (the rare row that earns the space).
    var tocip = el("span", { class: "cipx-rev-tocipwrap" }, [grid]);
    var peerCorr = !confirmed && !twoBox && !!r.cons;   // Ready + peer-corroborated → a quiet dot + hover detail

    function statusTip() {
      if (confirmed) return "You confirmed this code";
      if (r.status === "suggest") return "Peers teaching this course" + (r.cons && r.cons.cons.scoped ? " in " + r.subj : "") + " mostly use a different code than your current TOP’s — shown in the row. Worth a look.";
      if (r.status === "clear") return r.cons
        ? (peerTag(r) + " teaching this course code it the same way — your crosswalk agrees.\n\n" + differHover(r.cons.cons))
        : "Ready — your TOP’s crosswalk points here.";
      if (r.status === "review") return "Review — no single clear match; open to choose.";
      return "Manual — too little to suggest a code; open to search.";
    }
    // course number + title with the em-dash dropped for a plain gap (Sam: "ditch the em dash …
    // just use maybe 2 spaces"). The full label (with the dash) stays as the hover tooltip + key.
    var mDash = r.label.indexOf(" — ");
    var cnameKids = mDash >= 0
      ? [el("span", { class: "cipx-rev-cnum" }, [r.label.slice(0, mDash)]), " ", el("span", { class: "cipx-rev-ctitle" }, [r.label.slice(mDash + 3)])]
      : [el("span", { class: "cipx-rev-cnum" }, [r.label])];
    var head = el("div", { class: "cipx-rev-row", role: "button", tabindex: "0", "aria-expanded": "false" }, [
      caret,
      el("span", { class: "cipx-rev-course" }, [el("span", { class: "cipx-rev-cname", title: r.label }, cnameKids)]),
      tocip,
      el("span", { class: "cipx-rev-stat cipx-rev-stat-" + stat.cls + (peerCorr ? " cipx-rev-stat-peer" : ""), title: statusTip(), "aria-label": (confirmed ? "Confirmed" : stat.label) + " status" },
        [confirmed ? "✓" : stat.g, peerCorr ? el("span", { class: "cipx-rev-statdot", "aria-hidden": "true" }, ["·"]) : null]),
    ]);
    var card = el("div", { class: "cipx-rev-item" + (confirmed ? " cipx-rev-conf" : "") + (twoBox ? " cipx-rev-item-suggest" : "") }, [head]);
    // inline "why this is a ?" reason (review/manual only — Ready rows stay clean one-liners). Sits
    // between the head and the (lazy) expand body so the reason is visible without opening the row.
    var whyKids = confirmed ? null : reviewWhy(r, ctx || {}, eff);
    if (whyKids) card.appendChild(el("div", { class: "cipx-rev-whyline cipx-rev-whyline-" + r.status }, whyKids));
    var body = null;
    function paint() {
      var open = !!revOpen[r.label];
      caret.textContent = open ? "▾" : "▸"; head.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && !body) { body = reviewExpand(r, dec, allRows); card.appendChild(body); }
      else if (!open && body) { card.removeChild(body); body = null; }
    }
    function tog() { revOpen[r.label] = !revOpen[r.label]; paint(); }
    head.onclick = tog;
    head.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } };
    paint();   // multi-select toggles re-render the list; revOpen restores this row's expansion
    return card;
  }

  // tooltip for the "K differ" metric — which OTHER TOPs the minority colleges use, and who
  function differHover(cons) {
    if (cons.differ <= 0) return "Every college teaching this course codes it the same way.";
    var parts = cons.others.filter(function (g) { return g.n > 0; }).map(function (g) {
      var cols = g.colleges.slice(0, 10).join(", ") + (g.colleges.length > 10 ? ", +" + (g.colleges.length - 10) + " more" : "");
      return "TOP " + g.top + (g.topTitle ? " · " + g.topTitle : "") + " — " + cols;
    });
    return "Colleges coding it differently:\n" + parts.join("\n");
  }

  // The shared "how do peers code this course?" summary — the corroborating consensus signal,
  // with Sam's honest "(M use, K differ)" strength metric (hover K to see who/which TOPs) and
  // the modal peer field's CIP named inline. Returned as an element LIST + the computed
  // {cons, modal, best} so BOTH the review expand and the recommend view render the same block
  // (each then appends its own candidate affordance). ownTop = the course's own current TOP.
  function consensusSummaryEls(m, label, ownTop, topTitle, subj) {
    if (isWorkExperience(label)) return null;   // cross-title consensus is discipline-blind noise here (see consensusPick)
    var cons = consensusFor(label, subj); if (!cons) return null;
    var modal = cons.modal, best = bestCipForTop(modal.top, m);
    // Only surface "how peers code this" when it's SUBJECT-SCOPED (same-discipline peers), or when
    // the full-title pool merely AGREES with the course's own crosswalk. A cross-discipline pool
    // that disagrees is misleading here (CARPT 224 → "15 colleges, mostly Architecture") — hide it.
    if (!cons.scoped) {
      var cw = m.recommended || (m.cands && m.cands.length ? m.cands[0].r.code : null);
      if (!(best && cw && best.r.code === cw)) return null;
    }
    var own = null; cons.groups.forEach(function (g) { if (g.top === ownTop) own = g; });
    var scoped = cons.scoped && subj;   // consensus was narrowed to this course's discipline
    var els = [];
    els.push(el("div", { class: "cipx-rev-peerlead" }, [svgIcon(COLLEGE_ICON), el("span", {}, [scoped ? "Field consensus — how " + subj + " peers code this course" : "Field consensus — how peers code this course"])]));
    els.push(el("div", { class: "cipx-rev-peerbody" }, [
      scoped
        ? ("Among the " + cons.n + " " + subj + " department" + (cons.n === 1 ? "" : "s") + " teaching “" + cons.key + ",” most use TOP ")
        : ("Across California, " + cons.n + " college" + (cons.n === 1 ? "" : "s") + " teach “" + cons.key + ".” Most use TOP "),
      el("span", { class: "cipx-code" }, [modal.top]), modal.topTitle ? " · " + modal.topTitle : "", " ",
      el("span", { class: "cipx-rev-peermetric", title: differHover(cons) }, ["(" + modal.n + " use, " + cons.differ + " differ)"]),
      best ? el("span", {}, [" → CIP ", el("span", { class: "cipx-code" }, [best.r.code]), " · " + best.r.t + " (via the crosswalk)."]) : " (no crosswalk CIP for that TOP).",
    ]));
    if (scoped) els.push(el("div", { class: "cipx-rev-peerscope" }, ["Scoped to " + subj + " peers only — colleges that teach this title in another department (a different discipline) aren’t counted, so their coding can’t override yours."]));
    if (ownTop && modal.top !== ownTop) {
      els.push(el("div", { class: "cipx-rev-peernote" }, ["This course uses TOP ", el("span", { class: "cipx-code" }, [ownTop]), topTitle ? " · " + topTitle : "", own ? " — " + own.n + " of " + cons.n + (own.n === 1 ? " (the outlier)" : (scoped ? " " + subj + " peers" : " here")) + "." : "."]));
    }
    return { cons: cons, modal: modal, best: best, els: els };
  }
  // Review-expand consensus block: the shared summary + the consensus CIP offered as a
  // SELECTABLE candidate ONLY when it's NEW — i.e. not already in this course's own TOP
  // crosswalk (listed below). For a well-coded course the consensus just confirms the
  // crosswalk pick; for an outlier it adds the code.
  function peerConsensusBlock(r, candRow) {
    var sum = consensusSummaryEls(r.m, r.label, r.top, r.topTitle, r.subj); if (!sum) return null;
    var wrap = el("div", { class: "cipx-rev-peer" }, sum.els);
    var best = sum.best, modal = sum.modal, cons = sum.cons;
    var inCrosswalk = best ? r.m.cands.some(function (c) { return c.r.code === best.r.code; }) : false;
    if (best && modal.n >= 3 && !inCrosswalk) {
      wrap.appendChild(candRow(best.r, (best.rel || 0),
        el("span", { class: "cipx-rev-peertag", title: "Where peer colleges' TOP codes point via the crosswalk" }, ["peer consensus · " + modal.n + " of " + cons.n]),
        "cipx-rev-cand-peer"));
    }
    return wrap;
  }
  // Recommend-view consensus block: the shared summary + (when the consensus is CONFIDENT)
  // the peer field's CIP as a flat, expandable card. Advisory — recommend mode doesn't
  // persist a choice, so no selectable affordance (that lives in Review my catalog).
  function recommendConsensusBlock(m, label, ownTop, topTitle) {
    var subj = parseSubject(label);
    var sum = consensusSummaryEls(m, label, ownTop, topTitle, subj); if (!sum) return null;
    var wrap = el("div", { class: "cipx-rev-peer" }, sum.els);
    if (consensusPick(m, label, ownTop, subj)) wrap.appendChild(recCardStack([{ r: sum.best.r, prov: "", rel: 0, matched: [] }], null, true));
    return wrap;
  }

  function reviewExpand(r, dec, allRows) {
    var box = el("div", { class: "cipx-rev-detail" }, []);
    var cips = revCips(dec, r.label);
    function toggle(code) { revToggleCip(r.label, code); renderReview(allRows); }   // revOpen keeps this row expanded
    // one multi-select candidate row — an explicit Select button (Sam: clearer than a checkbox);
    // the whole row is still clickable. "✓ Selected" toggles back off. A course may carry >1 CIP.
    function candRow(cr, rel, extraTag, cls, matched) {
      var picked = cips.indexOf(cr.code) >= 0;
      var btn = el("span", { class: "cipx-rev-selbtn" + (picked ? " on" : ""), role: "button", tabindex: "-1", "aria-hidden": "true" }, [picked ? "✓ Selected" : "Select"]);
      var row = el("div", { class: "cipx-rev-cand" + (cls ? " " + cls : "") + (picked ? " on" : ""), role: "button", tabindex: "0", "aria-pressed": picked ? "true" : "false" }, [
        el("span", { class: "cipx-code" }, [cr.code]),
        el("span", { class: "cipx-rev-candt" }, [cr.t, cr.cat ? el("span", { class: catClass(cr.cat), title: catTip(cr.cat) }, [cr.cat]) : null, extraTag || null]),
        el("span", { class: "cipx-rev-candrel" }, [meter(rel || 0, tierOf(rel || 0).key)]),
        btn,
      ]);
      row.onclick = function () { toggle(cr.code); };
      row.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(cr.code); } };
      if (matched && matched.length) row.appendChild(el("div", { class: "cipx-rev-why" }, ["matched: " + matched.slice(0, 6).join(", ")]));
      return row;
    }
    box.appendChild(el("div", { class: "cipx-rev-pickhint" }, ["Check one or more CIP codes — most courses take one; interdisciplinary courses may warrant more. Signals below are ordered strongest first."]));

    // Work-experience courses: explain why there's no peer consensus (it would be discipline-blind)
    if (isWorkExperience(r.label)) {
      box.appendChild(el("div", { class: "cipx-rev-wenote" }, [svgIcon(COLLEGE_ICON), el("span", {}, ["Work-experience courses belong to their own discipline — every department runs one, so how other colleges code “work experience” across all fields doesn’t apply. Use this course’s own discipline code below."])]));
    }
    // 1) FIELD CONSENSUS FIRST — the strongest, most-corroborated signal (Sam's ordering)
    var peer = peerConsensusBlock(r, candRow); if (peer) box.appendChild(peer);

    // 2) the course's own TOP crosswalk candidates (or closest-by-description fallback)
    var opts = r.m.cands.length ? r.m.cands : nonBoiler(r.m.res.ranked).slice(0, 6);
    var fromCrosswalk = r.m.cands.length > 0;
    box.appendChild(el("div", { class: "cipx-rev-siglabel" }, [fromCrosswalk ? "From this course’s TOP crosswalk" + (r.top ? " (" + r.top + ")" : "") : "Closest CIP codes by description"]));
    if (!opts.length) box.appendChild(el("div", { class: "cipx-fitmsg" }, [r.m.thin ? "Too little catalog description to suggest a code — search all codes below." : "No crosswalk match — search all codes below."]));
    opts.slice(0, 6).forEach(function (o) {
      var extraTag = (fromCrosswalk && r.top) ? el("span", { class: "cipx-rev-candtop", title: "The official crosswalk maps this CIP from the course's TOP " + r.top }, ["← TOP ", r.top]) : null;
      box.appendChild(candRow(o.r, (o.conf != null ? o.conf : (o.rel || 0)), extraTag, null, o.matched));
    });

    // 3) stronger description matches OUTSIDE the crosswalk (the lexical signal, weakest)
    if (r.disagree && r.m.beyond.length) {
      box.appendChild(el("div", { class: "cipx-rev-flag" }, ["⚑ Stronger description match" + (r.m.beyond.length > 1 ? "es" : "") + " outside the crosswalk. This course is coded ", el("b", {}, ["TOP " + r.top + (r.topTitle ? " · " + r.topTitle : "")]), " — its TOP may be mis-coded, which would make the crosswalk recommendation misleading. Assign one only if it truly fits the course:"]));
      r.m.beyond.slice(0, 3).forEach(function (o) {
        box.appendChild(candRow(o.r, (o.rel || 0), el("span", { class: "cipx-rev-outtag" }, ["outside crosswalk"]), "cipx-rev-cand-out", o.matched));
      });
    }

    // actions: confirm-the-suggestion (when nothing checked yet) + search-all + clear-all
    var acts = el("div", { class: "cipx-rev-detactions" }, []);
    if (!cips.length && r.sug) {
      var conf = el("button", { class: "cipx-rev-confirm", type: "button" }, ["✓ Confirm " + r.sug.code]);
      conf.onclick = function () { toggle(r.sug.code); };
      acts.appendChild(conf);
    }
    var srch = el("button", { class: "cipx-rev-searchall", type: "button" }, ["+ Add another code…"]);
    var searchWrap = el("div", {}, []);
    srch.onclick = function () {
      if (searchWrap.firstChild) { clear(searchWrap); return; }
      searchWrap.appendChild(comboCore({
        id: "cipx-revsearch-" + r.label.replace(/\W/g, "").slice(0, 20),
        label: "Search all CIP codes", placeholder: "Type a code or keyword…",
        groupsFor: allCodeGroupsFor,
        onPick: function (picked) { toggle(picked[2]); clear(searchWrap); },
      }));
    };
    acts.appendChild(srch);
    acts.appendChild(searchWrap);
    if (cips.length) { var clr = el("button", { class: "cipx-rev-clear", type: "button" }, [cips.length > 1 ? "Clear all" : "Clear"]); clr.onclick = function () { revSetCips(r.label, []); renderReview(allRows); }; acts.appendChild(clr); }
    box.appendChild(acts);
    return box;
  }

  function exportReviewCsv(rows, dec, ctx) {
    var out = ["Course,Subject,Current TOP,TOP Title,CIP Code,CIP Title,CIP Category,Status,Source"];
    function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
    rows.forEach(function (r) {
      var picked = revCips(dec, r.label);                       // 0+ faculty-chosen CIPs
      var eff = effectiveSug(r, ctx);                           // the shown code (may be a program-default)
      var codes = picked.length ? picked : (eff.code ? [eff.code] : []);
      var source = picked.length ? "faculty-confirmed"
        : (eff.defaulted ? ("program-default (" + eff.defaulted.n + " " + r.subj + " courses)")
        : (codes.length ? ("auto-suggested (" + (r.sugKind === "consensus" ? "peer consensus" : "crosswalk") + ")") : "none"));
      var titles = codes.map(function (c) { return (BYCODE[c] || {}).t || ""; });
      var cats = codes.map(function (c) { return (BYCODE[c] || {}).cat || ""; });
      out.push([q(r.label), q(r.subj), q(r.top), q(r.topTitle), q(codes.join("; ")), q(titles.join("; ")), q(cats.join("; ")), q(REV_STATUS[r.status].label), q(source)].join(","));
    });
    var blob = new Blob([out.join("\n")], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cip_review_" + (st.college || "college") + (rev.dept && rev.dept !== "__all__" ? "_" + rev.dept.replace(/\W/g, "") : "") + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Shell
  // ═══════════════════════════════════════════════════════════════════════════
  // Hairline tab glyphs (24-viewBox paths): an open book (browse the list), a
  // magnifier (find one course), a clipboard-with-check (review + confirm a catalog).
  var MODE_ICON = {
    browse: "M12 6.6C10 5.4 7.9 5 5.5 5V16.6C7.9 16.6 10 17 12 18.2M12 6.6C14 5.4 16.1 5 18.5 5V16.6C16.1 16.6 14 17 12 18.2M12 6.6V18.2",
    recommend: "M15.5 10.5a5 5 0 1 1-10 0a5 5 0 1 1 10 0M18.8 18.8l-4.2-4.2",
    review: "M8.5 5H6.8A1.8 1.8 0 0 0 5 6.8V18.2A1.8 1.8 0 0 0 6.8 20H17.2A1.8 1.8 0 0 0 19 18.2V6.8A1.8 1.8 0 0 0 17.2 5H15.5M9 5.4A1 1 0 0 1 10 4.5H14A1 1 0 0 1 15 5.4V6.7H9V5.4M9 12.6L11 14.6L15 10.6",
  };
  function modeBar() {
    var bar = el("div", { class: "cipx-modebar", role: "tablist", "aria-label": "What do you want to do" }, []);
    // Review leads — it's the primary workflow now (Sam, 2026-07-18: "make Review the first tab + default").
    [["review", "Review my catalog"], ["browse", "Browse codes"], ["recommend", "Find my course’s code"]].forEach(function (m) {
      var on = st.mode === m[0];
      var b = el("button", { class: "cipx-modetab" + (on ? " on" : ""), type: "button", role: "tab", "aria-selected": on ? "true" : "false" }, [svgIcon(MODE_ICON[m[0]]), el("span", {}, [m[1]])]);
      b.onclick = function () {
        if (st.mode === m[0]) return;
        st.mode = m[0];
        try { localStorage.setItem(MODE_KEY, m[0]); } catch (e) {}
        rebuildShell();
      };
      bar.appendChild(b);
    });
    return bar;
  }

  function header() {
    var head = el("div", { class: "cipx-head" }, [
      el("div", { class: "cipx-eyebrow" }, ["California Community Colleges · Chancellor's Office"]),
      el("h2", { class: "cipx-h2" }, ["CIP Code Taxonomy"]),
      el("p", { class: "cipx-sub" }, ["The successor to the CCC TOP Code Manual. Course & program coding is moving from ", el("b", {}, ["TOP"]), " to ", el("b", {}, ["CIP"]), " for fall 2026 — browse the full federal CIP-2020 list, or start from one of your courses and let the tool suggest a code from its current TOP. (You confirm and enter it in COCI.)"]),
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
    // Top-right utility rail: Coco (the emotional-support pup) watches over the tab, then the Theme
    // toggle, then the review-only chips (Expand / CSV) that renderReview drops in below — all one
    // width for harmony (Sam, 2026-07-18). Reclaims the old full-width utils row.
    revRailEl = el("div", { class: "cipx-toprail-rev" }, []);
    head.appendChild(el("div", { class: "cipx-toprail" }, [cocoMascot(), themeBtn, revRailEl]));
    return head;
  }
  // Coco — a muted, outlined line-art pup along for the ride. Emotional support only; no opinions on CIP codes.
  function cocoMascot() {
    var NS = "http://www.w3.org/2000/svg";
    function n(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    var svg = n("svg", { viewBox: "0 0 48 42", width: "32", height: "28", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false", class: "cipx-coco-svg" });
    [{ tag: "path", d: "M16 14C9 9 6 23 12 28" },            // left floppy ear
     { tag: "path", d: "M32 14C39 9 42 23 36 28" },           // right floppy ear
     { tag: "path", d: "M16 14C16 7 32 7 32 14C35 18 34 30 24 33C14 30 13 18 16 14Z" }, // head
     { tag: "path", d: "M24 25V28" },                          // muzzle bridge
     { tag: "path", d: "M20 30C22 32 26 32 28 30" }            // smile
    ].forEach(function (s) { svg.appendChild(n("path", { d: s.d })); });
    [[19.5, 20], [28.5, 20]].forEach(function (e) { svg.appendChild(n("circle", { cx: e[0], cy: e[1], r: "1.5", fill: "currentColor", stroke: "none" })); });   // eyes
    svg.appendChild(n("circle", { cx: "24", cy: "24.5", r: "1.9", fill: "currentColor", stroke: "none" }));   // nose
    return el("div", { class: "cipx-coco", title: "Coco — your emotional-support pup, along for the ride 🐾" }, [svg, el("span", { class: "cipx-coco-name" }, ["Coco"])]);
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
    wrapEl.appendChild(modeBar());
    wrapEl.appendChild(collegeBar());
    if (st.mode === "recommend") {
      wrapEl.appendChild(recommendView());
    } else if (st.mode === "review") {
      wrapEl.appendChild(reviewView());
    } else {
      wrapEl.appendChild(buildPanel());
      suggestHost = el("div", { class: "cipx-suggest" }, []);
      wrapEl.appendChild(suggestHost);
      listHost = el("div", { class: "cipx-list" }, []);
      wrapEl.appendChild(listHost);
      render();
    }
    wrapEl.appendChild(footer());
    root.appendChild(wrapEl);
    fetchColleges();
    if (st.mode === "review" || st.mode === "recommend") loadConsensus();
    if (st.college) loadCollege(st.college);
  }

  // ── CSS ────────────────────────────────────────────────────────────────────
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var css = [
      ".cipx{" +
        "--cipx-page:transparent;--cipx-surface:#ffffff;--cipx-surface-2:#eef3f9;--cipx-surface-sub:#f2f6fb;" +
        "--cipx-text:#16283d;--cipx-text-soft:#3c526b;--cipx-muted:#566a80;--cipx-border:#dbe4ee;--cipx-border-strong:#c3d1e0;--cipx-recbadge-bg:#3f6b4e;" +
        "--cipx-accent:#00356b;--cipx-accent-soft:#e7eef6;--cipx-link:#0b5fa8;--cipx-focus:#1f7ae0;--cipx-mark:#ffe89c;--cipx-mark-fg:inherit;" +
        "--cipx-cte-bg:#e7ede7;--cipx-cte-fg:#4c6350;--cipx-both-bg:#e9eaf1;--cipx-both-fg:#565d78;" +
        "--cipx-non-bg:#eceef1;--cipx-non-fg:#59636f;--cipx-nc-bg:#e6edee;--cipx-nc-fg:#4f6a71;" +
        "--cipx-ret-bg:#ececec;--cipx-ret-fg:#5f646b;--cipx-new-bg:#efe9dd;--cipx-new-fg:#6b5c3d;" +
        "--cipx-ok-bg:#e7ede7;--cipx-ok-fg:#3f5a45;--cipx-ok-stripe:#6f9079;--cipx-warn-bg:#f4ecd8;--cipx-warn-fg:#6f5d33;--cipx-warn-stripe:#c6a24a;--cipx-bad-bg:#efe1dd;--cipx-bad-fg:#7c5147;--cipx-bad-stripe:#b7796b;" +
        "max-width:1200px;margin:0 auto;padding:6px 22px 26px;background:var(--cipx-page);border-radius:14px;font-size:.95rem;color:var(--cipx-text);line-height:1.5;}",
      ".cipx.cipx-theme-dark{" +
        "--cipx-page:#0e1a2b;--cipx-surface:#16263b;--cipx-surface-2:#1b3150;--cipx-surface-sub:#132338;" +
        "--cipx-text:#e7eef6;--cipx-text-soft:#b8c7d8;--cipx-muted:#8397ab;--cipx-border:#274058;--cipx-border-strong:#33506e;" +
        "--cipx-accent:#7db3ec;--cipx-accent-soft:#1b3652;--cipx-link:#8fc0f2;--cipx-focus:#7db3ec;--cipx-mark:#5a4a1a;--cipx-mark-fg:#ffe89c;" +
        "--cipx-cte-bg:#233a2c;--cipx-cte-fg:#a4bda9;--cipx-both-bg:#272c45;--cipx-both-fg:#aeb4d2;--cipx-non-bg:#28323f;--cipx-non-fg:#9aa7b6;--cipx-nc-bg:#1f3841;--cipx-nc-fg:#93b6bf;--cipx-ret-bg:#2a2f36;--cipx-ret-fg:#929aa3;--cipx-new-bg:#34301f;--cipx-new-fg:#c6b78e;" +
        "--cipx-ok-bg:#233a2c;--cipx-ok-fg:#a4bda9;--cipx-ok-stripe:#5f8f74;--cipx-warn-bg:#38321f;--cipx-warn-fg:#d8c48c;--cipx-warn-stripe:#b0913f;--cipx-bad-bg:#3a2723;--cipx-bad-fg:#d9a89c;--cipx-bad-stripe:#a86a5c;--cipx-recbadge-bg:#7cc79b;}",
      ".cipx-head{position:relative;padding:2px 7.6rem 6px 0;}",
      ".cipx-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--cipx-accent);}",
      ".cipx-h2{margin:.28em 0 .1em;font-size:1.6rem;line-height:1.15;color:var(--cipx-text);}",
      ".cipx-sub{margin:.2em 0 0;color:var(--cipx-text-soft);max-width:72rem;font-size:.98rem;}",
      ".cipx-hlinks{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 2px;font-size:.82rem;}",
      ".cipx-hlinks a{color:var(--cipx-link);text-decoration:none;font-weight:600;}.cipx-hlinks a:hover{text-decoration:underline;}",
      // Top-right utility rail: Coco + Theme + (review) Expand/CSV, one width for harmony.
      ".cipx-toprail{position:absolute;top:2px;right:0;display:flex;flex-direction:column;align-items:stretch;gap:6px;width:6.9rem;z-index:4;}",
      ".cipx-toprail-rev{display:flex;flex-direction:column;gap:6px;}",
      ".cipx-toprail .cipx-themetog,.cipx-toprail .cipx-rev-expand,.cipx-toprail .cipx-rev-csv{width:100%;box-sizing:border-box;margin:0;font-family:inherit;font-size:.74rem;font-weight:600;line-height:1;text-align:center;padding:7px 8px;border-radius:7px;cursor:pointer;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);color:var(--cipx-text-soft);}",
      ".cipx-toprail .cipx-themetog:hover,.cipx-toprail .cipx-rev-expand:hover,.cipx-toprail .cipx-rev-csv:hover{border-color:var(--cipx-accent);color:var(--cipx-accent);}",
      ".cipx-coco{display:flex;flex-direction:column;align-items:center;gap:0;color:var(--cipx-muted);opacity:.85;margin-bottom:1px;-webkit-user-select:none;user-select:none;}",
      ".cipx-coco-svg{display:block;}",
      ".cipx-coco-name{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--cipx-muted);}",
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
      ".cipx-college-l{font-weight:700;font-size:.86rem;color:var(--cipx-text);display:inline-flex;align-items:center;gap:6px;}",
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
      // custom course combobox — opens BELOW, searchable
      ".cipx-cbwrap{position:relative;max-width:560px;}",
      ".cipx-fit-cb{width:100%;box-sizing:border-box;font-family:inherit;font-size:1rem;padding:10px 12px;border-radius:9px;border:1.5px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);}",
      ".cipx-fit-cb:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;border-color:var(--cipx-focus);}",
      ".cipx-fit-panel{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;max-height:340px;overflow-y:auto;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;box-shadow:0 12px 34px rgba(16,42,67,.20);}",
      ".cipx-cb-group{position:sticky;top:0;background:var(--cipx-surface-2);font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cipx-muted);padding:7px 12px;border-bottom:1px solid var(--cipx-border);}",
      ".cipx-cb-opt{padding:9px 12px;cursor:pointer;font-size:.92rem;color:var(--cipx-text);border-bottom:1px solid var(--cipx-border);}",
      ".cipx-cb-opt:last-child{border-bottom:0;}",
      ".cipx-cb-opt:hover,.cipx-cb-opt.on{background:var(--cipx-surface-sub);}",
      ".cipx-cb-hint,.cipx-cb-none{padding:9px 12px;font-size:.78rem;color:var(--cipx-muted);font-style:italic;}",
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
      // recommend mode — mode toggle + course-first result
      ".cipx-modebar{display:inline-flex;gap:4px;background:var(--cipx-surface-2);border:1px solid var(--cipx-border);border-radius:10px;padding:4px;margin:14px 0 12px;}",
      ".cipx-modetab{font-family:inherit;font-size:.86rem;font-weight:650;color:var(--cipx-text-soft);background:transparent;border:0;border-radius:7px;padding:8px 15px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}",
      ".cipx-tabico{flex:none;opacity:.9;}",
      ".cipx-modetab:hover{color:var(--cipx-accent);}",
      ".cipx-modetab.on{background:var(--cipx-surface);color:var(--cipx-accent);box-shadow:0 1px 3px rgba(16,42,67,.12);}",
      ".cipx-modetab:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:2px;}",
      ".cipx-rec-course{background:var(--cipx-accent-soft);border:1px solid var(--cipx-border);border-radius:12px;padding:13px 16px;margin:2px 0 14px;}",
      ".cipx-rec-clabel{font-weight:700;font-size:1.02rem;color:var(--cipx-text);}",
      ".cipx-rec-ctop{font-size:.84rem;color:var(--cipx-text-soft);margin-top:3px;}",
      ".cipx-rec-lead{font-size:.9rem;color:var(--cipx-text-soft);line-height:1.55;margin:4px 2px 12px;max-width:82ch;}",
      ".cipx-rec-lead-ok{color:var(--cipx-text);}.cipx-rec-lead-ok b{color:var(--cipx-accent);}",
      ".cipx-rec-note{font-size:.88rem;color:var(--cipx-text-soft);line-height:1.55;margin:4px 2px 12px;max-width:82ch;}",
      ".cipx-rec-list{display:flex;flex-direction:column;gap:8px;}",
      ".cipx-rec-card{background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:11px;}",
      ".cipx-rec-card-rec{border-color:var(--cipx-ok-stripe);box-shadow:0 0 0 1px var(--cipx-ok-stripe);background:var(--cipx-ok-bg);}",
      ".cipx-rec-row{display:grid;grid-template-columns:16px 84px 1fr auto;gap:12px;align-items:center;padding:12px 15px;cursor:pointer;}",
      ".cipx-rec-row:hover{background:var(--cipx-surface-sub);border-radius:11px;}",
      ".cipx-rec-card-rec .cipx-rec-row:hover{background:transparent;}",
      ".cipx-rec-main{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;min-width:0;}",
      ".cipx-rec-ttl{font-weight:600;color:var(--cipx-text);}",
      ".cipx-recbadge{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;background:var(--cipx-recbadge-bg);color:#fff;padding:3px 8px;border-radius:6px;white-space:nowrap;}",
      ".cipx.cipx-theme-dark .cipx-recbadge{color:#0e1a2b;}",
      ".cipx-provlbl{font-size:.72rem;color:var(--cipx-muted);cursor:help;white-space:nowrap;}",
      ".cipx-rec-meta{display:flex;flex-direction:column;align-items:flex-end;gap:5px;min-width:158px;}",
      ".cipx-tierlbl{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;}",
      ".cipx-tier-ok{color:var(--cipx-ok-fg);}.cipx-tier-warn{color:var(--cipx-warn-fg);}.cipx-tier-bad{color:var(--cipx-bad-fg);}",
      ".cipx-rec-row-flat{grid-template-columns:16px 84px 1fr;}",
      ".cipx-rec-card .cipx-detail{padding:0 15px 16px 116px;}",
      ".cipx-boiler,.cipx-beyond{margin-top:12px;}",
      ".cipx-boiler-btn,.cipx-beyond-btn{font-family:inherit;font-size:.82rem;font-weight:650;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:9px;padding:9px 14px;cursor:pointer;display:flex;gap:8px;align-items:center;width:100%;text-align:left;box-sizing:border-box;}",
      ".cipx-boiler-btn:hover,.cipx-beyond-btn:hover{border-color:var(--cipx-accent);}",
      ".cipx-beyond-btn{color:var(--cipx-warn-fg);border-color:var(--cipx-warn-stripe);}",
      ".cipx-boiler-note,.cipx-beyond-note{font-size:.76rem;color:var(--cipx-muted);line-height:1.5;margin:8px 2px;max-width:82ch;}",
      ".cipx-boiler-body,.cipx-beyond-body{margin-top:8px;display:flex;flex-direction:column;gap:8px;}",
      // review-my-catalog mode
      ".cipx-rev-banner{background:var(--cipx-surface-2);border:1px solid var(--cipx-border);border-radius:10px;padding:10px 14px;font-size:.84rem;color:var(--cipx-text-soft);line-height:1.5;margin:2px 0 14px;}.cipx-rev-banner b{color:var(--cipx-text);}",
      ".cipx-rev-deptinline{display:flex;gap:8px;align-items:center;flex:1 1 auto;min-width:220px;}",
      ".cipx-rev-deptl{font-size:.84rem;font-weight:700;color:var(--cipx-text-soft);white-space:nowrap;}",
      ".cipx-rev-deptsel{font-family:inherit;font-size:.92rem;padding:8px 11px;border-radius:8px;border:1.5px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);cursor:pointer;max-width:420px;flex:1;min-width:200px;}",
      ".cipx-rev-deptsel:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      ".cipx-rev-prog{font-size:.82rem;color:var(--cipx-muted);font-style:italic;min-height:0;margin:0 2px;}",
      ".cipx-rev-tilesrow{display:flex;align-items:center;gap:9px 14px;flex-wrap:wrap;margin:4px 0 7px;}",
      ".cipx-rev-tiles{display:flex;gap:8px;flex-wrap:wrap;margin:0;}",
      ".cipx-rev-tile{display:flex;flex-direction:column;gap:1px;align-items:flex-start;font-family:inherit;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:8px 14px;cursor:pointer;min-width:78px;}",
      ".cipx-rev-tile:hover{border-color:var(--cipx-accent);}.cipx-rev-tile[aria-pressed=\"true\"]{border-color:var(--cipx-accent);box-shadow:0 0 0 1px var(--cipx-accent);}",
      ".cipx-rev-tilen{font-size:1.15rem;font-weight:800;color:var(--cipx-text);font-variant-numeric:tabular-nums;}",
      ".cipx-rev-tilel{font-size:.72rem;font-weight:600;color:var(--cipx-muted);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}",
      // Review = amber/warn (visible), not muted — Sam: the old muted count was invisible.
      ".cipx-rev-tile-warn .cipx-rev-tilen{color:var(--cipx-warn-fg);}.cipx-rev-tile-ok .cipx-rev-tilen{color:var(--cipx-ok-fg);}.cipx-rev-tile-suggest .cipx-rev-tilen{color:var(--cipx-accent);}",
      ".cipx-rev-progline{font-size:.8rem;color:var(--cipx-muted);font-weight:600;margin:2px 2px 8px;}",
      ".cipx-rev-peercount{color:var(--cipx-ok-fg);cursor:help;}",
      // reassurance under the bulk-confirm buttons (Sam's point 4): the "Confirm all" button is not irreversible.
      ".cipx-rev-reassure{font-size:.78rem;color:var(--cipx-muted);line-height:1.45;margin:0 2px 10px;max-width:62rem;}",
      // count↔list context line above the rows (Sam's point 2c)
      ".cipx-rev-showing{font-size:.8rem;color:var(--cipx-muted);font-weight:600;padding:9px 10px 7px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;}",
      ".cipx-rev-showall{font-family:inherit;font-size:.78rem;font-weight:700;color:var(--cipx-link);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;}",
      // inline reason on Review/Manual rows (Sam's point 2): why an identical-looking row needs a look.
      ".cipx-rev-whyline{font-size:.75rem;line-height:1.4;color:var(--cipx-muted);padding:0 10px 10px 38px;margin-top:-3px;}",
      ".cipx-rev-whyline-review{color:var(--cipx-warn-fg);}.cipx-rev-whyline b{font-weight:800;}",
      ".cipx-rev-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 0 auto;}",
      ".cipx-rev-bulk{font-family:inherit;font-size:.82rem;font-weight:700;color:#fff;background:var(--cipx-ok-stripe);border:0;border-radius:8px;padding:8px 14px;cursor:pointer;}.cipx.cipx-theme-dark .cipx-rev-bulk{color:#0e1a2b;}.cipx-rev-bulk:hover{filter:brightness(1.06);}",
      // accept-all-suggested is emphasized but distinct from the green ready-confirm (it changes codes)
      ".cipx-rev-bulk-suggest{background:var(--cipx-accent);}",
      ".cipx-rev-utils{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 12px;}",
      ".cipx-rev-expand{font-family:inherit;font-size:.78rem;font-weight:700;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:8px;padding:7px 12px;cursor:pointer;}.cipx-rev-expand:hover{border-color:var(--cipx-accent);}",
      ".cipx-rev-csv{font-family:inherit;font-size:.78rem;font-weight:700;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:8px;padding:7px 12px;cursor:pointer;margin-left:auto;}",
      ".cipx-rev-list{display:flex;flex-direction:column;}",
      ".cipx-rev-item{border-bottom:1px solid var(--cipx-border);}.cipx-rev-conf{background:var(--cipx-ok-bg);}",
      ".cipx-rev-row{display:grid;grid-template-columns:16px minmax(150px,0.8fr) minmax(330px,1.2fr) 74px;gap:12px;align-items:center;padding:11px 10px;cursor:pointer;}",
      ".cipx-rev-row:hover{background:var(--cipx-surface-sub);}",
      ".cipx-rev-course{display:flex;flex-direction:column;gap:2px;min-width:0;}",
      ".cipx-rev-cname{font-weight:600;color:var(--cipx-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cipx-rev-cnum{font-weight:700;}.cipx-rev-ctitle{margin-left:.62em;font-weight:600;color:var(--cipx-text-soft);}",
      ".cipx-rev-ctopline{font-size:.72rem;color:var(--cipx-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      // the current-TOP → CIP transition beside the CIP box ("where they are → where they're going")
      // the current-code → CIP transition. A shared 3-column grid ([label] → [CIP box]) so that,
      // when peers suggest a different code, the two CIP boxes line up vertically (Sam's point 1).
      ".cipx-rev-tocipwrap{display:flex;flex-direction:column;gap:3px;min-width:0;}",
      // box column = 1fr so every CIP box is the SAME width, filling to the cell's right edge (Sam:
      // "all same width, max width possible, keep row height to 1"). Label column is uniform ("TOP
      // NNNN.NN"), so the boxes — and the codes at their left — line up in a clean column.
      ".cipx-rev-tocip{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:4px 8px;align-items:center;min-width:0;}",
      ".cipx-rev-glabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cipx-rev-gbox{min-width:0;}",
      ".cipx-rev-l-was{opacity:.82;}",
      ".cipx-rev-reclabel{display:inline-flex;align-items:center;gap:4px;font-size:.72rem;font-weight:700;color:var(--cipx-accent);white-space:nowrap;cursor:help;}",
      ".cipx-rev-recmark{font-weight:800;}",
      ".cipx-rev-rectag{font-weight:800;color:inherit;font-variant-numeric:tabular-nums;}",
      ".cipx-rev-fromtop{font-size:.72rem;color:var(--cipx-muted);white-space:nowrap;max-width:100%;font-variant-numeric:tabular-nums;display:inline-block;min-width:5.4rem;}",
      ".cipx-rev-fromtop .cipx-code{color:var(--cipx-text-soft);}",
      ".cipx-rev-fromtt{display:inline-block;max-width:13ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;color:var(--cipx-muted);}",
      ".cipx-rev-fromtop-none{font-style:italic;}",
      ".cipx-rev-arrow{color:var(--cipx-muted);}",
      ".cipx-rev-candtop{font-size:.62rem;font-weight:700;color:var(--cipx-muted);background:var(--cipx-surface-sub);padding:2px 6px;border-radius:6px;white-space:nowrap;}",
      ".cipx-rev-cand-out{border-color:var(--cipx-warn-stripe);}.cipx-rev-cand-out .cipx-code{color:var(--cipx-warn-fg);}",
      ".cipx-rev-outtag{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--cipx-warn-fg);background:var(--cipx-warn-bg);padding:2px 6px;border-radius:6px;}",
      ".cipx-rev-chip{position:relative;display:inline-flex;gap:7px;align-items:baseline;border:1px dashed var(--cipx-border-strong);border-radius:8px;padding:4px 9px;min-width:0;max-width:100%;cursor:pointer;}",
      // fill the (uniform 1fr) box cell so every box is the same width; title flexes + ellipsizes so
      // the row stays one line, and the ▾ anchors at the right edge like a select's caret.
      ".cipx-rev-gbox .cipx-rev-chip{display:flex;width:100%;}",
      ".cipx-rev-gbox .cipx-rev-chipt{flex:1 1 auto;min-width:0;}",
      ".cipx-rev-chip:hover{border-color:var(--cipx-accent);}",
      ".cipx-rev-chip .cipx-code{font-size:1.05rem;font-weight:700;color:var(--cipx-text);}",
      ".cipx-rev-chip-on{border-style:solid;border-color:var(--cipx-ok-stripe);background:var(--cipx-ok-bg);}",
      ".cipx-rev-chip-sug{border-color:var(--cipx-accent);}",
      // "was" = what the current TOP maps to (muted, secondary); "rec" = the peer-suggested code (emphasized)
      ".cipx-rev-chip-was{border-style:solid;border-color:var(--cipx-border);background:var(--cipx-surface-sub);}",
      ".cipx-rev-chip-was .cipx-code{color:var(--cipx-text-soft);font-weight:600;}",
      ".cipx-rev-chip-rec{border-style:solid;border-color:var(--cipx-accent);background:var(--cipx-accent-soft);box-shadow:0 0 0 1px var(--cipx-accent);}",
      ".cipx-rev-chip-open{box-shadow:0 0 0 2px var(--cipx-accent);}",
      ".cipx-rev-chipt{font-size:.8rem;color:var(--cipx-text-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cipx-rev-none{font-size:.8rem;color:var(--cipx-muted);font-style:italic;}",
      ".cipx-rev-chipchg{align-self:center;font-size:.66rem;color:var(--cipx-muted);cursor:pointer;padding:1px 3px;border-radius:5px;line-height:1;}",
      ".cipx-rev-chipchg:hover{color:var(--cipx-accent);background:var(--cipx-accent-soft);}",
      ".cipx-rev-chgpanel{position:absolute;top:100%;left:0;z-index:40;margin-top:5px;min-width:270px;max-width:360px;text-align:left;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:9px 10px;box-shadow:0 10px 26px rgba(0,0,0,.20);cursor:default;white-space:normal;}",
      ".cipx-rev-chghint{font-size:.72rem;font-weight:600;color:var(--cipx-muted);margin-bottom:6px;}",
      ".cipx-rev-stat{font-size:.9rem;font-weight:800;text-align:right;white-space:nowrap;}",
      // a faint accent dot beside the ✓ on Ready rows that peers corroborate — "hover for the count"
      ".cipx-rev-stat-peer{cursor:help;}.cipx-rev-statdot{color:var(--cipx-accent);font-weight:900;margin-left:2px;}",
      ".cipx-rev-stat-ok{color:var(--cipx-ok-fg);}.cipx-rev-stat-warn{color:var(--cipx-warn-fg);}.cipx-rev-stat-muted{color:var(--cipx-muted);}",
      // "suggest" status = a calm, direct question mark (Sam's point 3 — not the old busy ⚠⚑)
      ".cipx-rev-stat-suggest{color:var(--cipx-accent);}",
      ".cipx-rev-item-suggest{border-left:3px solid var(--cipx-accent);}",
      ".cipx-rev-detail{padding:2px 12px 16px 28px;}",
      ".cipx-rev-top{font-size:.82rem;color:var(--cipx-muted);margin:0 0 10px;}",
      ".cipx-rev-cand{display:grid;grid-template-columns:88px 1fr 132px auto;gap:10px;align-items:center;padding:9px 11px;border:1px solid var(--cipx-border);border-radius:9px;margin:6px 0;cursor:pointer;}",
      ".cipx-rev-cand:hover{background:var(--cipx-surface-sub);}.cipx-rev-cand.on{border-color:var(--cipx-accent);box-shadow:0 0 0 1px var(--cipx-accent);}",
      ".cipx-rev-candrel{min-width:0;}.cipx-rev-cand .cipx-meterwrap{min-width:0;max-width:none;}",
      // Select button (Sam's point 4 — clearer than a checkbox); flips to a filled "✓ Selected"
      ".cipx-rev-selbtn{font-size:.74rem;font-weight:700;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:7px;padding:5px 13px;white-space:nowrap;text-align:center;}",
      ".cipx-rev-cand:hover .cipx-rev-selbtn{border-color:var(--cipx-accent);color:var(--cipx-accent);}",
      ".cipx-rev-selbtn.on{background:var(--cipx-accent);border-color:var(--cipx-accent);color:#fff;}.cipx.cipx-theme-dark .cipx-rev-selbtn.on{color:#0e1a2b;}",
      ".cipx-rev-pickhint{font-size:.76rem;color:var(--cipx-muted);line-height:1.5;margin:2px 2px 9px;}",
      ".cipx-rev-siglabel{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cipx-text-soft);margin:12px 2px 4px;}",
      ".cipx-rev-chipmore{font-size:.62rem;font-weight:800;color:var(--cipx-accent);background:var(--cipx-accent-soft);padding:1px 5px;border-radius:5px;cursor:help;}",
      ".cipx-rev-candt{font-weight:600;color:var(--cipx-text);min-width:0;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;}",
      ".cipx-rev-why{grid-column:2/-1;font-size:.72rem;color:var(--cipx-muted);}",
      ".cipx-rev-flag{font-size:.78rem;color:var(--cipx-warn-fg);background:var(--cipx-warn-bg);border-radius:8px;padding:8px 11px;margin:8px 0;line-height:1.5;}",
      ".cipx-rev-peer{margin:10px 0 2px;padding:11px 13px;background:var(--cipx-accent-soft);border:1px solid var(--cipx-border);border-radius:10px;}",
      ".cipx-rev-peerlead{display:flex;align-items:center;gap:7px;font-weight:700;font-size:.82rem;color:var(--cipx-accent);margin-bottom:5px;}",
      ".cipx-rev-peerbody{font-size:.82rem;color:var(--cipx-text-soft);line-height:1.55;}",
      ".cipx-rev-peermetric{font-weight:700;color:var(--cipx-text);cursor:help;border-bottom:1px dotted var(--cipx-border-strong);white-space:nowrap;}",
      ".cipx-rev-peernote{font-size:.78rem;color:var(--cipx-muted);margin-top:5px;}",
      ".cipx-rev-peerscope{font-size:.74rem;color:var(--cipx-muted);font-style:italic;margin-top:5px;padding-left:9px;border-left:2px solid var(--cipx-border);}",
      ".cipx-rev-wenote{display:flex;align-items:flex-start;gap:7px;font-size:.8rem;color:var(--cipx-text-soft);line-height:1.5;background:var(--cipx-surface-sub);border:1px solid var(--cipx-border);border-radius:9px;padding:9px 12px;margin:2px 0 8px;}",
      ".cipx-rev-wenote svg{flex:none;margin-top:2px;color:var(--cipx-muted);}",
      ".cipx-rev-cand-peer{border-color:var(--cipx-accent);margin-top:8px;background:var(--cipx-surface);}",
      ".cipx-rev-peertag{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--cipx-accent);background:var(--cipx-accent-soft);padding:2px 6px;border-radius:6px;white-space:nowrap;}",
      ".cipx-rev-detactions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px;}",
      ".cipx-rev-confirm{font-family:inherit;font-size:.82rem;font-weight:700;color:#fff;background:var(--cipx-accent);border:0;border-radius:8px;padding:8px 15px;cursor:pointer;}.cipx.cipx-theme-dark .cipx-rev-confirm{color:#0e1a2b;}",
      ".cipx-rev-searchall,.cipx-rev-clear{font-family:inherit;font-size:.8rem;font-weight:600;color:var(--cipx-link);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;}",
      ".cipx-rev-more{text-align:center;padding:14px;font-size:.82rem;color:var(--cipx-muted);}",
      ".cipx-foot{margin-top:26px;font-size:.76rem;color:var(--cipx-muted);border-top:1px solid var(--cipx-border);padding-top:14px;line-height:1.6;}",
      // mobile
      "@media (max-width:640px){" +
        ".cipx{padding:6px 13px 24px;font-size:.92rem;}.cipx-head{padding:30px 0 6px;}" +
        // on phones the rail rides horizontally across the top instead of a fixed corner column
        ".cipx-toprail{position:static;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-end;width:auto;gap:6px;margin:0 0 8px;}.cipx-toprail-rev{flex-direction:row;gap:6px;}.cipx-coco{flex-direction:row;gap:4px;margin:0 auto 0 0;}.cipx-toprail .cipx-themetog,.cipx-toprail .cipx-rev-expand,.cipx-toprail .cipx-rev-csv{width:auto;font-size:.72rem;padding:5px 10px;}" +
        ".cipx-h2{font-size:1.32rem;}.cipx-sub{font-size:.92rem;}" +
        ".cipx-hlinks{gap:10px 14px;font-size:.79rem;margin-top:10px;}" +
        ".cipx-panel{padding:13px 12px;border-radius:12px;}.cipx-panel-h{font-size:1rem;}.cipx-panel-sub{font-size:.85rem;}" +
        ".cipx-search,.cipx-fitta,.cipx-fit-cb,.cipx-college-sel{font-size:16px;}" +
        ".cipx-controls{gap:7px;}.cipx-pills{gap:5px;}.cipx-pill{padding:5px 10px;font-size:.78rem;}.cipx-chipsep{display:none;}" +
        ".cipx-cat{padding:2px 7px;font-size:.62rem;}.cipx-fsel{max-width:100%;flex:1 1 100%;}.cipx-retiredtog{margin-left:0;flex:1 1 100%;}" +
        ".cipx-count{margin-top:11px;}.cipx-csv{margin-left:0;}" +
        ".cipx-collegebar{padding:10px 12px;}.cipx-college-sel{max-width:100%;flex:1 1 100%;}.cipx-college-hint{flex:1 1 100%;}" +
        ".cipx-row,.cipx-sug-crow{grid-template-columns:13px 56px 1fr auto;gap:9px;}" +
        ".cipx-detail,.cipx-sug-why,.cipx-cand-card .cipx-detail{padding-left:14px;}" +
        ".cipx-cbwrap,.cipx-fitta{max-width:100%;}" +
        ".cipx-cand-row{grid-template-columns:13px 56px 1fr;gap:9px;}.cipx-cand-rel{grid-column:2/-1;margin-top:2px;}.cipx-meterwrap{max-width:none;min-width:0;}" +
        ".cipx-vbody{padding:12px 13px;}.cipx-vpill{font-size:.68rem;padding:3px 8px;}.cipx-vtext{font-size:.92rem;}.cipx-vmeterrow{flex-wrap:wrap;gap:6px;}.cipx-vmeterlbl{white-space:normal;}" +
        ".cipx-modebar{width:100%;}.cipx-modetab{flex:1;padding:8px 6px;font-size:.8rem;text-align:center;}" +
        ".cipx-rec-row{grid-template-columns:13px 58px 1fr;gap:8px;}.cipx-rec-meta{grid-column:2/-1;flex-direction:row;align-items:center;min-width:0;margin-top:4px;}.cipx-rec-row-flat{grid-template-columns:13px 58px 1fr;}" +
        ".cipx-rec-card .cipx-detail{padding-left:14px;}" +
        ".cipx-rev-deptinline{flex:1 1 100%;}.cipx-rev-deptsel{max-width:100%;flex:1 1 auto;}.cipx-rev-tiles{gap:6px;}.cipx-rev-tile{padding:6px 10px;min-width:60px;}" +
        ".cipx-rev-row{grid-template-columns:14px 1fr auto;gap:6px 8px;}.cipx-rev-stat{grid-column:3;grid-row:1;}.cipx-rev-tocipwrap{grid-column:1/-1;grid-row:2;margin-top:4px;}.cipx-rev-tocip{grid-template-columns:auto auto minmax(0,1fr);}" +
        ".cipx-rev-cand{grid-template-columns:64px 1fr auto;}.cipx-rev-candrel{grid-column:1/-1;margin-top:3px;}.cipx-rev-csv{margin-left:0;}.cipx-rev-detail{padding-left:12px;}.cipx-rev-chgpanel{min-width:220px;max-width:80vw;}" +
        ".cipx-rev-whyline{padding-left:22px;}" +
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
    _setMode: function (mode) { st.mode = (mode === "browse" || mode === "recommend") ? mode : "review"; },
    _passes: passes, _filtered: filtered, _score: scoreAgainst, _courseScore: scoreTokensVs, _courseToks: courseToks,
    _recommend: computeRecommend, _bestMatches: bestMatchCourses,
    _parseSubject: parseSubject, _reviewRows: function (courses) { return (courses || []).map(reviewRowOf); },
    _reviewRowOf: reviewRowOf,
    _setConsensus: function (d) { if (d && d.titles) { CONSENSUS = d.titles; CONSENSUS_COLLEGES = d.colleges || []; CONSENSUS_SUBJECTS = d.subjects || []; } },
    _consensus: consensusFor, _consensusPick: consensusPick, _consensusKey: consensusKey, _subjMatch: subjMatch,
    _bestCipForTop: bestCipForTop, _college: function () { return st.college; },
  };
})();
