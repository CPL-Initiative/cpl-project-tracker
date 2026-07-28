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
  var st = { q: "", cat: "all", fam: "", fam4: "", fam6: "", xfer: false, showRetired: false, limit: PAGE, open: {}, college: null, mode: "review", scope: "courses", progCollege: null, progQ: "", progFlagOnly: false };
  var SCOPE_KEY = "cipx_scope";
  var PROGRAMS = null, PROGRAMS_LOADING = false;   // window.CPL_COCI_PROGRAMS (lazy — Programs scope only)
  var FIT_COLLEGES = null, FIT_CACHE = {}, FIT_LOADING = {};
  // Precomputed engine-baseline status counts (per college + per subject + system-wide) — how the tool
  // classifies each course (Ready/Review/Suggested/Manual), NOT human progress. Built by
  // kb/build_cip_status_counts.js; fetched once so the tab can show progress boxes without a live classify.
  var STATUS_COUNTS = null, STATUS_LOADING = null;
  var CONSENSUS = null, CONSENSUS_COLLEGES = null, CONSENSUS_SUBJECTS = null, CONSENSUS_LOADING = null;
  // confident-consensus thresholds (see consensusPick): >= MIN_N colleges AND >= MAJORITY of them.
  var CONSENSUS_MIN_N = 3, CONSENSUS_MAJORITY = 0.5;
  var wrapEl, inputRef, pillsRef, famRef, fam4Ref, fam6Ref, cbRef, xferRef, listHost, countHost, suggestHost, collegeSelEl, collegeBarEl, _cipxStickyBound;

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
    st.progCollege = null;
    // Default mode = Review (Sam, 2026-07-18: the primary workflow). A returning user's explicit
    // choice (they clicked a tab, which writes MODE_KEY) is honored; anything else lands on Review.
    try { var _m = localStorage.getItem(MODE_KEY); st.mode = (_m === "browse" || _m === "recommend") ? _m : "review"; } catch (e) { st.mode = "review"; }
    try { var _s = localStorage.getItem(SCOPE_KEY); st.scope = (_s === "programs") ? "programs" : "courses"; } catch (e) { st.scope = "courses"; }
    if (st.scope === "programs" && st.mode === "recommend") st.mode = "review";   // no course-first easy button for programs
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
    if (st.fam4 && r.code.slice(0, 5) !== st.fam4) return false;
    if (st.fam6 && r.code !== st.fam6) return false;
    if (st.xfer && !r.x) return false;
    if (st.q) {
      var toks = st.q.split(/\s+/);
      var hay = (r.code + " " + (r.t || "") + " " + (r.def || "") + " " + (r.ex || "")).toLowerCase();
      for (var i = 0; i < toks.length; i++) if (toks[i] && hay.indexOf(toks[i]) < 0) return false;
    }
    return true;
  }
  function filtered() { return ROWS.filter(passes); }

  // ── CIP-code hierarchy filters (2 / 4 / 6-digit) ──────────────────────────────
  // Structural navigation over the CIP tree, independent of category/xfer/search.
  // Each list carries a "Select All" (empty-value) option at the top. The lists
  // cascade: picking a sector narrows the sub-series; a sub-series narrows the code.
  function cipOpt(v, label) { return el("option", { value: v }, [label]); }
  function cipVisibleRow(r) { return st.showRetired || GOFORWARD[r.cat]; }   // match the browse universe
  function fillCip2() {
    if (!famRef) return;
    clear(famRef);
    famRef.appendChild(cipOpt("", "All sectors (2-digit)"));
    Object.keys(FAMS).sort().forEach(function (f) { famRef.appendChild(cipOpt(f, f + " · " + FAMS[f])); });
    famRef.value = st.fam;
  }
  function fillCip4() {
    if (!fam4Ref) return;
    clear(fam4Ref);
    fam4Ref.appendChild(cipOpt("", "All sub-series (4-digit)"));
    var seen = {};
    ROWS.forEach(function (r) {
      if (!cipVisibleRow(r)) return;
      if (st.fam && r.fam !== st.fam) return;
      var k = r.code.slice(0, 5);
      seen[k] = (seen[k] || 0) + 1;
    });
    Object.keys(seen).sort().forEach(function (k) {
      fam4Ref.appendChild(cipOpt(k, k + " · " + seen[k] + (seen[k] === 1 ? " code" : " codes")));
    });
    fam4Ref.value = st.fam4;
  }
  function fillCip6() {
    if (!fam6Ref) return;
    clear(fam6Ref);
    fam6Ref.appendChild(cipOpt("", "All codes (6-digit)"));
    ROWS.filter(function (r) {
      if (!cipVisibleRow(r)) return false;
      if (st.fam && r.fam !== st.fam) return false;
      if (st.fam4 && r.code.slice(0, 5) !== st.fam4) return false;
      return true;
    }).slice().sort(function (a, b) { return a.code < b.code ? -1 : (a.code > b.code ? 1 : 0); })
      .forEach(function (r) { fam6Ref.appendChild(cipOpt(r.code, r.code + " · " + (r.t || ""))); });
    fam6Ref.value = st.fam6;
  }
  function fillCipSelects() { fillCip2(); fillCip4(); fillCip6(); }

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
    if (st.fam4) out.push("CIP " + st.fam4 + "×");
    if (st.fam6) out.push("CIP " + st.fam6);
    if (st.showRetired) out.push("incl. retired/reserved");
    return out;
  }
  function resetAll() {
    st.q = ""; st.cat = "all"; st.fam = ""; st.fam4 = ""; st.fam6 = ""; st.xfer = false; st.showRetired = false; st.limit = PAGE; st.open = {};
    if (inputRef) inputRef.value = "";
    fillCipSelects();
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
  // The "crosswalk universe" = every CIP that appears in SOME TOP's official crosswalk (CIP_TOPS is the
  // inverse of topcip). We never present a CIP outside it — no free-ranging the full 2,325-code taxonomy
  // (Sam, 2026-07-28: "limit the choices to the TOP↔CIP crosswalk … we don't want colleges going free
  // range"). But TOP codes are unreliable (§7), so a description-fit code that isn't in THIS course's TOP
  // set yet IS in the crosswalk under ANOTHER TOP is a legitimate "more-appropriate TOP" alternative —
  // offered, labeled with the TOP it belongs to, and framed as "your course's TOP may need updating."
  function inXwalk(code) { return !!CIP_TOPS[code]; }
  function altTopsFor(code) {
    var tops = CIP_TOPS[code]; if (!tops) return [];
    return Object.keys(tops).sort().map(function (t) { return { top: t, title: (TOPCIP[t] || {}).t || "" }; });
  }
  // description-ranked codes that live in the crosswalk under some TOP (never free-range), tagged with
  // their source TOP(s) — the fallback when a course's own TOP has no / only-generic crosswalk CIPs.
  function xwalkAlts(ranked, cap) {
    return nonBoiler(ranked || []).filter(function (o) { return inXwalk(o.r.code); })
      .map(function (o) { o.altTops = altTopsFor(o.r.code); return o; }).slice(0, cap || 6);
  }

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
  // Title-match + de-inflated confidence (Sam, 2026-07-19). A CIP whose TITLE matches the COURSE TITLE is
  // a strong signal it's the right code — stronger than description-word volume (which let "Climate
  // Science" out-vote the identically-titled "Environmental Science"). TITLE_BOOST folds the IDF-weighted
  // course-title↔CIP-title overlap into the ranking score; the displayed confidence is ABSOLUTE (title-fit
  // + description-coverage), never forced to 100% just by topping the per-course ranking.
  var TITLE_BOOST = 6;              // weight of course-title↔CIP-title overlap in the ranking score
  var CONF_TITLE_W = 0.80, CONF_COV_W = 0.60;   // confidence = TITLE_W·titleSim + COV_W·coverage, bounded [0,1] (Sam: read a bit higher)
  var BEYOND_CONF_MIN = 45;         // an outside-crosswalk code is "worth a look" only at this absolute confidence
  var _titleStop = null;            // generic academic-qualifier title tokens, stripped from the course-title match
  var SUG_STRONG = 70;              // a suggestion at/above this confidence is a strong pick — not overridden by the dept-default
  var OWN_FIT_MIN = 40;            // a course's own description/title fit must be at least this plausible to veto (Sam, 2026-07-20)…
  var OWN_VETO_MARGIN = 30;        // …and beat the peer-consensus pick's own fit by this much → it VETOES the peer override (the peer pick is a near-zero fit)
  // Discipline-fit lift (Sam, 2026-07-20). The DISPLAYED confidence of a crosswalk candidate also reflects
  // how cleanly the course's discipline maps to that CIP — measured as the TOP-title ↔ CIP-title overlap.
  // A specialized course in a discipline that maps 1:1 to its CIP (Carpentry TOP 0952.10 → 46.0201
  // Carpentry/Carpenter) is confidently in-field even when its own wording (Rigging, Welding II, CNC)
  // barely overlaps the generic CIP definition — so it should not read a misleading 8%. §7-clean: the
  // TOP↔CIP crosswalk is the ONE place TOP is authoritative (repo doctrine), and this reads that
  // pairing's OWN quality; it lifts only the DISPLAY (`dconf`), never a gate (Ready/Review, the veto,
  // the outside-crosswalk mis-code flag, the baseline counts all keep the raw description-fit `conf`).
  var DISC_W = 0.60;               // weight of the discipline-fit lift on the displayed confidence
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
  // Memoize the tokenized course text in slot [4] — slot [3] now carries the credit/CDCP flag from the
  // fitcheck data (see courseCreditFlag), so the token cache must NOT collide with it.
  function courseToks(c) { if (!c[4]) c[4] = fitTokens(courseText(c)); return c[4]; }

  // ═══════════════════════════════════════════════════════════════════════════
  // Browse: reference list + finder
  // ═══════════════════════════════════════════════════════════════════════════
  function renderFinder(q) {
    if (!suggestHost) return;
    clear(suggestHost);
    if (!/[a-z]/i.test(q || "")) return;
    // Only the plain-English DESCRIBE case (a multi-word phrase) gets the "Closest matches" helper — a
    // single keyword is a browse/filter the code list below already handles, so surfacing the top-6 here
    // too duplicated those rows and broke the "N CIP codes" count (CfC F6: "13 codes" rendered 19 rows).
    if ((q || "").trim().split(/\s+/).length < 2) return;
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
  // Baseline status counts (Phase A) — deterministic engine classification, precomputed. Lazy-fetched once;
  // on arrival, re-populate the college dropdown (adds each college's review count) + repaint the overview.
  function loadStatusCounts() {
    if (STATUS_COUNTS || STATUS_LOADING || typeof fetch !== "function") return STATUS_LOADING;
    STATUS_LOADING = fetch("cip_status_counts.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.colleges) { STATUS_COUNTS = d; if (collegeSelEl && FIT_COLLEGES) populateCollegeSel(); if (st.mode === "review") { renderSysBaseline(revSysHost); repaintReviewOverview(); } }
      return STATUS_COUNTS;
    }).catch(function () { return null; });
    return STATUS_LOADING;
  }
  function collegeStatus(slug) { return (STATUS_COUNTS && STATUS_COUNTS.colleges && STATUS_COUNTS.colleges[slug]) || null; }

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
    var bar = el("div", { class: "cipx-collegebar" }, [el("span", { class: "cipx-college-l" }, [el("span", {}, ["Your college"])])]);   // glyph dropped (Sam, 2026-07-19)
    collegeBarEl = bar;   // measured so the sticky tiles bar can pin flush beneath it (syncStickyOffsets)
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
    var keep = collegeSelEl.value || st.college;   // keep the pick across re-populate + rebuildShell
    clear(collegeSelEl);
    collegeSelEl.appendChild(el("option", { value: "" }, ["Choose your college…"]));
    FIT_COLLEGES.forEach(function (c) {
      // in review mode, append the baseline "N to review" once counts are loaded (Sam: dropdown counts)
      var s = (st.mode === "review") ? collegeStatus(c.slug) : null;
      var suffix = s ? "  ·  " + s.review.toLocaleString() + " to review" : "";
      collegeSelEl.appendChild(el("option", { value: c.slug }, [c.name + suffix]));
    });
    if (keep) collegeSelEl.value = keep;
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
  // Tiers on the de-inflated absolute confidence (Sam, 2026-07-19): a full title match (the obvious pick)
  // reads 80% and should show Strong; capped at 95, so ≥75 = Strong, ≥45 = Plausible, else Weak.
  function tierOf(rel) {
    if (rel >= 75) return { key: "ok", label: "Strong fit" };
    if (rel >= 45) return { key: "warn", label: "Plausible — compare" };
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
    // Title-match signal (Sam): IDF-weighted overlap of the COURSE's own title tokens with a CIP's TITLE.
    // Drop generic academic qualifiers (Introduction/Concepts/Research Methods/…) + geographic words so a
    // verbose title ("Research Methods in Evolutionary Ecology") matches on its SUBSTANTIVE terms
    // ("Evolutionary Ecology") the same way a terse sibling ("Evolutionary Ecology") does.
    if (!_titleStop) _titleStop = setOf(fitTokens("introduction introductory concepts principles fundamentals survey topics seminar independent study studies research methods method advanced beginning intermediate applied laboratory lab practicum workshop special selected contemporary issues perspectives overview honors california general course"));
    var ctAll = fitTokens(courseTitle(label));
    var ctToks = ctAll.filter(function (t) { return !_titleStop[t]; });
    if (!ctToks.length) ctToks = ctAll;   // fall back if the qualifier strip left nothing
    var ctTotal = 0; for (var ti = 0; ti < ctToks.length; ti++) ctTotal += idf(ctToks[ti]);
    if (ctTotal <= 0) ctTotal = 1;
    function titleHit(r) { var h = 0; for (var i = 0; i < ctToks.length; i++) if (r._tt && r._tt[ctToks[i]]) h += idf(ctToks[i]); return h; }
    function boosted(o) { return (o.score || 0) + TITLE_BOOST * titleHit(o.r); }
    // Absolute, de-inflated confidence: high only when the CIP TITLE matches the course title OR the
    // description covers the course's distinctive vocabulary — never forced to 100% by relative ranking.
    // capped below 100 (Sam: nothing should read a false-certain 100%); a full title match alone = 80%.
    function confOf(o) { return Math.round(100 * Math.min(0.95, CONF_TITLE_W * (titleHit(o.r) / ctTotal) + CONF_COV_W * (o.coverage || 0))); }
    var tc = TOPCIP[top] || null, inSet = {};
    // Discipline-fit: how cleanly this course's TOP (its discipline) maps to a candidate CIP's field,
    // as the IDF-weighted overlap of the TOP's title with the CIP's TITLE. Constant across the TOP, so
    // it lifts EVERY course in a clean-mapping discipline uniformly (the Carpentry case). Display-only.
    var topTtToks = tc ? fitTokens(tc.t || "").filter(function (t) { return !_titleStop[t]; }) : [];
    if (tc && !topTtToks.length) topTtToks = fitTokens(tc.t || "");   // fall back if the strip left nothing
    var topTtTotal = 0; for (var tt = 0; tt < topTtToks.length; tt++) topTtTotal += idf(topTtToks[tt]);
    if (topTtTotal <= 0) topTtTotal = 1;
    // A TOP that maps to a SINGLE credit CIP is the crosswalk's own unambiguous "this IS the field's code"
    // (Sam, 2026-07-20: BUSL 10 → the sole 22.0000 Legal Studies for TOP 1401.00 "Law"). Credit it as a
    // full discipline-fit even when the titles don't lexically overlap ("Law" vs "Legal") — the approved
    // TOP→CIP crosswalk is the one place TOP is authoritative (§7), so a 1:1 mapping is the strongest
    // possible field signal. Display-only (dconf); the ⚑ outside-crosswalk flag still surfaces alternates.
    var creditCrossCodes = tc ? tc.c.filter(function (ct) { var rr = BYCODE[ct[0]]; return rr && !BOILER[ct[0]] && rr.cat !== "Noncredit"; }).map(function (ct) { return ct[0]; }) : [];
    var soleCreditCode = creditCrossCodes.length === 1 ? creditCrossCodes[0] : null;
    function fieldSim(r) {
      if (soleCreditCode && r.code === soleCreditCode) return 1;   // the sole credit crosswalk CIP = the direct field code
      var h = 0; for (var i = 0; i < topTtToks.length; i++) if (r._tt && r._tt[topTtToks[i]]) h += idf(topTtToks[i]); return h / topTtTotal;
    }
    // The DISPLAYED confidence: the raw description/title fit lifted toward certainty by the discipline
    // fit. raw + DISC_W·fieldSim·(1−raw) — a big lift when the course's own wording is thin but its
    // discipline maps cleanly, a small lift when raw is already high. Gates keep raw `conf`.
    function dconfOf(o) { var raw = (o.conf || 0) / 100; return Math.round(100 * Math.min(0.95, raw + DISC_W * fieldSim(o.r) * (1 - raw))); }
    var cands = [], boiler = [];
    if (tc) {
      tc.c.forEach(function (ct) {
        var r = BYCODE[ct[0]]; if (!r) return;
        inSet[ct[0]] = 1;
        var e = byCode[ct[0]];
        var rec = { r: r, prov: ct[1], rel: e ? e.rel : 0, score: e ? e.score : 0, coverage: e ? e.coverage : 0, matched: e ? e.matched : [] };
        rec.boosted = boosted(rec); rec.conf = confOf(rec); rec.dconf = dconfOf(rec);
        (BOILER[ct[0]] ? boiler : cands).push(rec);
      });
      // Credit-first (a Noncredit CIP must not out-rank a credit one), then TITLE-BOOSTED description-fit,
      // so the code whose TITLE matches the course leads its TOP (Sam: "Environmental Science" → 03.0104).
      cands.sort(function (a, b) {
        var an = a.r.cat === "Noncredit" ? 1 : 0, bn = b.r.cat === "Noncredit" ? 1 : 0;
        return an - bn || b.boosted - a.boosted || (a.r.t < b.r.t ? -1 : 1);
      });
    }
    // Recommendation (Ready) gate stays RELATIVE — a clear crosswalk winner with a decent match — so the
    // Ready/Review split doesn't swing just because the DISPLAY confidence was de-inflated. The title boost
    // only re-orders which crosswalk code is the winner (03.0104 over Climate Science); a course where the
    // boosted winner isn't the plain-score winner is genuinely ambiguous → left "review".
    var recommended = null;
    if (cands.length && cands[0].score > 0) {
      var bestCandScore = 0, bestCandRel = 0;
      cands.forEach(function (x) { if (x.score > bestCandScore) bestCandScore = x.score; if (x.rel > bestCandRel) bestCandRel = x.rel; });
      var relConf = bestCandScore > 0 ? Math.round(cands[0].score / bestCandScore * 100 * Math.min(1, bestCandRel / 65)) : 0;
      var byB = cands.slice().sort(function (a, b) { return b.boosted - a.boosted; });
      var margin = byB.length > 1 ? 1 - byB[1].boosted / byB[0].boosted : 1;
      if (cands[0].boosted === byB[0].boosted && margin >= 0.25 && relConf >= 85) recommended = cands[0].r.code;
    }
    // Description/title matches OUTSIDE the crosswalk — "worth a look" hints (Sam: crosswalk stays primary).
    // Ranked by the same boosted score, gated on the ABSOLUTE confidence AND on beating the best crosswalk
    // code (an outside code is only "worth a look" if it fits BETTER than the official options — this also
    // kills the generic-title flood: for "Independent Study: Biology" every "X Biology" code ties 26.0101,
    // so none surfaces). Boiler codes never surface (boiler expander).
    var bestCandConf = 0; cands.forEach(function (x) { if (x.conf > bestCandConf) bestCandConf = x.conf; });
    // Only codes that ARE in the crosswalk under some OTHER TOP (inXwalk) — a truly free-range code
    // (in no TOP's crosswalk) is never surfaced. Each carries its source TOP(s) for the "more-appropriate
    // TOP" label. This makes "outside THIS course's TOP crosswalk" a crosswalk-constrained alternative.
    var beyond = res.ranked.filter(function (o) { return !inSet[o.r.code] && !BOILER[o.r.code] && inXwalk(o.r.code); })
      .map(function (o) { o.boosted = boosted(o); o.conf = confOf(o); o.altTops = altTopsFor(o.r.code); return o; })
      .filter(function (o) { return o.conf >= BEYOND_CONF_MIN && o.conf > bestCandConf; })
      .sort(function (a, b) { return b.boosted - a.boosted; }).slice(0, 3);
    // Work-experience courses stay in their discipline — don't nudge them elsewhere.
    if (isWorkExperience(label)) beyond = [];
    return { label: label, top: top, topTitle: tc ? tc.t : "", hasCross: !!tc, cands: cands,
      boiler: boiler, recommended: recommended, beyond: beyond, res: res, thin: res.toks < 4 || !res.ranked.length };
  }

  // One candidate card: code, title, category, an honest tier + vocab-match meter,
  // the matched terms (the trust lever), provenance, and an expand to its definition.
  function recCandCard(rec, isRec, flat) {
    // crosswalk candidates carry `dconf` (description-fit lifted by discipline-fit) then `conf`;
    // beyond/other entries only rel
    var pct = rec.dconf != null ? rec.dconf : (rec.conf != null ? rec.conf : rec.rel);
    var tier = tierOf(pct), r = rec.r, prov = provLabel(rec.prov);
    var caret = el("span", { class: "cipx-caret" }, ["▸"]);
    var main = el("span", { class: "cipx-rec-main" }, [
      el("span", { class: "cipx-rec-ttl" }, [r.t]),
      r.cat ? el("span", { class: catClass(r.cat), title: catTip(r.cat) }, [r.cat]) : null,
      isRec ? el("span", { class: "cipx-recbadge" }, ["✓ Recommended"]) : null,
      prov ? el("span", { class: "cipx-provlbl", title: provTip(rec.prov) }, [prov]) : null,
      (rec.altTops && rec.altTops.length) ? el("span", { class: "cipx-alttop", title: "In the official crosswalk under TOP " + rec.altTops[0].top + (rec.altTops[0].title ? " · " + rec.altTops[0].title : "") + (rec.altTops.length > 1 ? " (+" + (rec.altTops.length - 1) + " more)" : "") + " — your course's TOP may need updating." }, ["↔ TOP " + rec.altTops[0].top]) : null,
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
      var norm = rec.prov !== undefined ? rec : { r: rec.r, prov: "", rel: rec.rel, score: rec.score, matched: rec.matched, conf: rec.conf, dconf: rec.dconf, altTops: rec.altTops };
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
      caret, el("span", {}, ["↔ " + m.beyond.length + " crosswalk code" + (m.beyond.length === 1 ? "" : "s") + " under a more-appropriate TOP"]),
    ]);
    var body = el("div", { class: "cipx-beyond-body" }, []);
    var note = el("div", { class: "cipx-beyond-note" }, ["These CIP codes fit this course's wording better than the options above — and they ARE in the official crosswalk, just under a different TOP than the one on this course (TOP " + (m.top || "—") + (m.topTitle ? " · " + m.topTitle : "") + "). TOP codes are often out of date, so this course's TOP may need updating. Each is labeled with the TOP it belongs to; confirm against its definition before entering it in COCI."]);
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
      var altsNo = xwalkAlts(m.res.ranked, 6);
      host.appendChild(el("div", { class: "cipx-rec-note" }, ["The official crosswalk has no CIP mapping for TOP ", el("span", { class: "cipx-code" }, [m.top || "—"]), " — the course's TOP may be out of date. Here are crosswalk CIP codes (from other TOPs) whose definitions best match this course, each labeled with the TOP it belongs to. Verify the course's TOP, then confirm against the definition:"]));
      if (altsNo.length) host.appendChild(recCardStack(altsNo, null, false));
      else host.appendChild(el("div", { class: "cipx-fitmsg" }, ["No crosswalk CIP matches this course's description closely enough to suggest — check the course's TOP with your curriculum team."]));
      host.appendChild(recFoot());
      return;
    }

    if (!m.cands.length) {
      // the crosswalk lists only generic noncredit codes for this TOP — offer crosswalk CIPs from
      // OTHER (more-appropriate) TOPs, never free-range codes.
      var altsGen = xwalkAlts(m.res.ranked, 6);
      host.appendChild(el("div", { class: "cipx-rec-note" }, ["The official crosswalk lists only generic noncredit codes for TOP ", el("span", { class: "cipx-code" }, [m.top]), " — nothing course-specific. Here are crosswalk CIP codes from other TOPs whose definitions best match this course (each labeled with its TOP); the course's TOP may need updating:"]));
      if (altsGen.length) host.appendChild(recCardStack(altsGen, null, false));
      else host.appendChild(el("div", { class: "cipx-fitmsg" }, ["No course-specific crosswalk CIP matches closely — verify the course's TOP, or use a generic code below."]));
      if (m.boiler.length) host.appendChild(boilerExpander(m.boiler));
      host.appendChild(recFoot());
      return;
    }

    if (m.recommended) {
      var topC = m.cands[0];
      host.appendChild(el("div", { class: "cipx-rec-lead cipx-rec-lead-ok" }, [
        el("b", {}, [topC.r.code + " " + topC.r.t]), " looks like the strongest fit — the official crosswalk lists it for TOP " + m.top + ", and the course description points to it too. Confirm it against the definition, then enter it in COCI.",
      ]));
    } else if (m.cands[0] && (m.cands[0].conf || 0) >= 75) {
      // A strong top candidate that just isn't a runaway winner (close margin / relative gate) — don't
      // call it "no front-runner" while its card reads STRONG FIT (CfC F7). Name it, note it's close.
      var topS = m.cands[0];
      host.appendChild(el("div", { class: "cipx-rec-lead" }, [
        el("b", {}, [topS.r.code + " " + topS.r.t]), " fits this course's description best of the codes the crosswalk maps from TOP " + m.top + " — though it's a close call with the next few. Confirm it against the definition, or compare the options below.",
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
  var revListHost, revSummaryHost, revTilesHost, revDeptSel, revProgHost, revOpen = {}, revRailEl, revOverviewHost, revSysHost;
  // per-row inline-UI state for the multi-CIP flow (add-picker → prompt → apply-to-subject). Like
  // revOpen, it survives the list re-render so an in-progress add/apply stays put. Reset per department.
  var revInline = {};

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
  // ── CIP-count rule by course credit type (COCI, Raul, 2026-07-28) ──────────────
  // A CREDIT course takes exactly 1 CIP; a NONCREDIT course takes 1 UNLESS it is CDCP
  // (Career Development & College Preparation — the enhanced-funding "Special Populations"
  // categories), which may take up to 2. CDCP is a COURSE-level property (from the course's
  // own CreditType, NOT its program's CDCP tag): the fitcheck tuple's 4th element carries it —
  // "C" credit · "D" noncredit-CDCP · "N" noncredit-non-CDCP · absent = unknown (cap 1, safe).
  function courseCreditFlag(r) { return (r && r.c && r.c[3]) || ""; }
  function courseIsCdcp(r) { return courseCreditFlag(r) === "D"; }
  function courseCipCap(r) { return courseIsCdcp(r) ? 2 : 1; }
  function creditLabel(f) { return f === "D" ? "Noncredit · CDCP" : f === "N" ? "Noncredit" : f === "C" ? "Credit course" : ""; }
  function capReason(r) {
    var f = courseCreditFlag(r);
    if (f === "D") return "Noncredit CDCP course — up to 2 CIP codes.";
    if (f === "N") return "Noncredit course (not CDCP) — one CIP code.";
    if (f === "C") return "Credit course — one CIP code.";
    return "One CIP code (credit type not on file).";
  }
  function canAddCip(r, dec) { return revCips(dec || revDecisions(), r.label).length < courseCipCap(r); }
  // ── CTE / Non-CTE use choice for a "Both"-category CIP (Jenni, 2026-07-28) ──────
  // When an assigned CIP is certified BOTH CTE and non-CTE, the college must record which use
  // applies for this course. Stored parallel to the assignment, keyed "<label>|<code>".
  function needsCteChoice(code) { var rr = BYCODE[code]; return !!(rr && rr.cat === "Both"); }
  function revCteStore() {
    if (!st.college) return {};
    try { return JSON.parse(localStorage.getItem("cipx_revcte_" + st.college) || "{}") || {}; } catch (e) { return {}; }
  }
  function revCteChoice(label, code) { return revCteStore()[label + "|" + code] || ""; }   // "cte" | "noncte" | ""
  function revSetCteChoice(label, code, choice) {
    if (!st.college) return;
    var s = revCteStore(), k = label + "|" + code;
    if (choice) s[k] = choice; else delete s[k];
    try { localStorage.setItem("cipx_revcte_" + st.college, JSON.stringify(s)); } catch (e) {}
  }
  // VALIDATED is separate from having a code ASSIGNED (Sam, 2026-07-18): a course validated (✓) is one the
  // faculty individually OK'd (accept a box, OK the anchor in the + flow, or Validate-all). A course that
  // only received a bulk-APPLIED code from a sibling has the code but stays in Review (?) so it can still
  // be tuned individually. `cipx_rev_*` holds the assigned codes; `cipx_revok_*` holds the validated set.
  function revValidatedSet() {
    if (!st.college) return {};
    try { return JSON.parse(localStorage.getItem("cipx_revok_" + st.college) || "{}") || {}; } catch (e) { return {}; }
  }
  function revIsValidated(label) { return !!revValidatedSet()[label]; }
  function revSetValidated(label, on) {
    if (!st.college) return;
    var s = revValidatedSet();
    if (on) s[label] = 1; else delete s[label];
    try { localStorage.setItem("cipx_revok_" + st.college, JSON.stringify(s)); } catch (e) {}
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
    // Strongest own description/title fit the engine surfaced (crosswalk candidates + outside "worth a
    // look" matches), by absolute confidence — the lever for the strong-own-fit veto below.
    var confBy = {};
    (m.cands || []).forEach(function (o) { confBy[o.r.code] = o.conf || 0; });
    (m.beyond || []).forEach(function (o) { if ((o.conf || 0) > (confBy[o.r.code] || 0)) confBy[o.r.code] = o.conf || 0; });
    var ownBest = null;
    (m.cands || []).concat(m.beyond || []).forEach(function (o) { if (!ownBest || (o.conf || 0) > (ownBest.conf || 0)) ownBest = o; });
    var ownFitVeto = false, peerAlt = null;
    if (cp) {
      var consAgrees = crosswalk && cp.code === crosswalk.code;
      if (cp.cons.scoped || consAgrees) {
        // This consensus WOULD override the course's own discipline. Strong-own-fit veto (Sam, 2026-07-20,
        // from the CfC live-test F1–F5): don't let it steamroll a plausible own description/title fit
        // (≥ OWN_FIT_MIN) that points to a DIFFERENT code and clearly beats the peer pick's own fit
        // (by ≥ OWN_VETO_MARGIN — the peer pick is a near-zero fit). CCSF "Intermediate Voice" → own-fit
        // Voice & Opera must not be overridden to peers' Musical Theatre; ART "Drawing" not to Fine/Studio
        // Arts. Margin-gated, so solid peer corrections (NURS→51.3801, ESL→16.1701 — where peers AND
        // description agree) are untouched. Keep Review + keep cp so the expand still notes how peers code
        // it — the peer consensus is demoted to a note, not deciding.
        var peerConf = confBy[cp.best.r.code] || 0;
        if (!consAgrees && ownBest && (ownBest.conf || 0) >= OWN_FIT_MIN && ownBest.r.code !== cp.best.r.code
            && ((ownBest.conf || 0) - peerConf) >= OWN_VETO_MARGIN) {
          sug = ownBest.r; sugKind = "description"; status = "review"; suggestChange = false;
          ownFitVeto = true; peerAlt = cp.best.r;
        } else {
          sug = cp.best.r; sugKind = "consensus";
          suggestChange = !!(crosswalk && sug && crosswalk.code !== sug.code);
          status = suggestChange ? "suggest" : "clear";
        }
      } else {
        cp = null;   // cross-discipline pool that disagrees → discard, keep the course's discipline
      }
    }
    // F3/F5 (Sam, 2026-07-19): make the "stronger match outside the crosswalk" signal trustworthy. Per §7
    // two-signals-agree, a description-only match is credible ONLY when a SECOND field signal — the course's
    // own crosswalk field OR the peer consensus — shares its broad (2-digit) CIP family. Applied Engineering
    // (14/15) for a Color-Theory course (field 50 + peer consensus 50) is contradicted by both → dropped;
    // Ceramic Arts 50.0711 for a Ceramics course (field 50) is kept.
    var famOf = function (code) { return String(code || "").slice(0, 2); };
    var fieldFams = {};
    (m.cands || []).forEach(function (o) { fieldFams[famOf(o.r.code)] = 1; });
    if (crosswalk) fieldFams[famOf(crosswalk.code)] = 1;
    var consCip = (cp && cp.best) ? cp.best.r : null;
    if (!consCip) { var cf = consensusFor(label, subj); if (cf) { var bc = bestCipForTop(cf.modal.top, m); if (bc) consCip = bc.r; } }
    if (consCip) fieldFams[famOf(consCip.code)] = 1;
    var beyondOk = (m.beyond || []).filter(function (o) { return fieldFams[famOf(o.r.code)]; });
    // The official crosswalk stays PRIMARY (Sam, 2026-07-19): a strong outside-crosswalk match is a
    // "worth a look" hint shown below (beyondOk), NEVER auto-promoted to the headline box — even when it
    // out-scores the crosswalk pick lexically (BIOL 10's Ecology must not displace 26.0101 Biology). The
    // headline is always the crosswalk/consensus suggestion; the faculty pick the outside code if it fits.
    // sugConf spans crosswalk candidates AND outside "worth a look" matches, so a description-headline
    // (the veto case) keeps its real confidence and effectiveSug won't dept-default-swap it away.
    return { c: c, label: label, subj: subj, top: ownTop, topTitle: m.topTitle,
      sug: sug, sugKind: sugKind, sugConf: (sug ? confBy[sug.code] : 0) || 0, status: status, suggestChange: suggestChange, crosswalk: crosswalk,
      ownFitVeto: ownFitVeto, peerAlt: peerAlt,
      nCand: m.cands.length, disagree: beyondOk.length > 0, beyondOk: beyondOk, cons: cp, m: m };
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

  // Forward-looking destination tile (Sam, 2026-07-20): the eventual COCI sync. Non-functional
  // preview — dashed, muted, count 0, an "In Development" badge — so the tiles read as the full
  // pipeline (All → Review → Ready → COCI Sync'd). It's the destination, not yet a live count.
  function cociSyncTile() {
    return el("div", { class: "cipx-rev-tile cipx-rev-tile-future", title: "Coming soon — once your college settles its codes, sync the confirmed decisions straight to COCI. Not yet live." }, [
      el("span", { class: "cipx-rev-tilen" }, ["0"]),
      el("span", { class: "cipx-rev-tilel" }, ["COCI Sync'd"]),
      el("span", { class: "cipx-rev-tilesoon" }, ["In Development"]),
    ]);
  }

  // Sticky stack (Sam, 2026-07-20): the college bar pins at top:0; the tiles bar pins flush
  // beneath it. The tiles bar's `top` = the college bar's measured height, published as a CSS var
  // on wrapEl so a curriculum specialist can switch subjects — and a CO reviewer switch colleges —
  // without scrolling back up. jsdom has no layout (height 0) → the guard leaves the CSS fallback.
  function syncStickyOffsets() {
    if (!wrapEl || !collegeBarEl) return;
    var h = Math.round(collegeBarEl.getBoundingClientRect().height || 0);
    if (h > 0) wrapEl.style.setProperty("--cipx-cbh", h + "px");
  }
  function bindStickyResize() {
    if (_cipxStickyBound) return; _cipxStickyBound = true;
    window.addEventListener("resize", function () { syncStickyOffsets(); }, { passive: true });
  }

  // Statewide baseline (Sam #2) — the "size of the prize", once the precomputed counts arrive.
  function renderSysBaseline(host) {
    if (!host) return;
    clear(host);
    var sw = STATUS_COUNTS && STATUS_COUNTS.systemwide;
    if (!sw) return;
    host.appendChild(el("div", { class: "cipx-rev-sysbaseline" }, [
      el("b", {}, [sw.n.toLocaleString()]), " courses across " + sw.colleges + " colleges · ",
      el("b", {}, [sw.review.toLocaleString()]), " flagged for review · " + sw.ready.toLocaleString() + " a confident match.",
      el("span", { class: "cipx-rev-sysnote" }, [" Statewide baseline — the tool's classifications (how much work exists), not confirmations."]),
    ]));
  }
  // College-overview status boxes (Sam #1) — shown when a college is picked but no department yet.
  function repaintReviewOverview() {
    if (!revOverviewHost) return;
    clear(revOverviewHost);
    if (!st.college || rev.dept) return;
    var s = collegeStatus(st.college), col = collegeBySlug(st.college);
    if (!s) { revOverviewHost.appendChild(el("div", { class: "cipx-fit-nudge" }, ["Pick a subject above to start — its courses load instantly."])); return; }
    revOverviewHost.appendChild(el("div", { class: "cipx-rev-ovlead" }, [(col ? col.name : "This college") + " — where its CIP coding stands (tool baseline):"]));
    var tiles = el("div", { class: "cipx-rev-tiles cipx-rev-ovtiles" }, []);
    [["All", s.n, ""], ["⇄ Suggested", s.suggest, "suggest"], ["? Review", s.review, "warn"], ["✓ Ready", s.ready, "ok"], ["◻ Manual", s.manual, "muted"]].forEach(function (t) {
      if ((t[0] === "⇄ Suggested" || t[0] === "◻ Manual") && !t[1]) return;   // hide Suggested/Manual when 0 (Sam)
      tiles.appendChild(el("div", { class: "cipx-rev-tile cipx-rev-tile-static" + (t[2] ? " cipx-rev-tile-" + t[2] : "") },
        [el("span", { class: "cipx-rev-tilen" }, [t[1].toLocaleString()]), el("span", { class: "cipx-rev-tilel" }, [t[0]])]));
    });
    tiles.appendChild(cociSyncTile());   // the destination tile (In Development)
    revOverviewHost.appendChild(tiles);
    revOverviewHost.appendChild(el("div", { class: "cipx-rev-ovnote" }, ["Pick a subject above to start reviewing. These are the tool's classifications — your validated progress fills in as you confirm."]));
  }

  // ── Programs review (Sam, 2026-07-28) ─────────────────────────────────────────
  // Colleges have already assigned a CIP to each program in COCI (coci_programs_data.js row[4]), coded
  // under the FIRST-GEN crosswalk. The current TOP→CIP crosswalk is authoritative, so a program whose
  // assigned CIP isn't in it (for the program's TOP) is flagged "needs revision" — the interim signal
  // until Sam supplies the old crosswalk, when we can flag the exact old→new differences.
  function loadPrograms() {
    if (PROGRAMS || PROGRAMS_LOADING) return;
    if (typeof window !== "undefined" && window.CPL_COCI_PROGRAMS) { PROGRAMS = window.CPL_COCI_PROGRAMS; return; }
    PROGRAMS_LOADING = true;
    var done = function () { PROGRAMS = (typeof window !== "undefined" && window.CPL_COCI_PROGRAMS) || null; PROGRAMS_LOADING = false; if (st.scope === "programs" && st.mode === "review") rebuildShell(); };
    if (typeof window !== "undefined" && window.CPL_TABS && window.CPL_TABS.loadScript) window.CPL_TABS.loadScript("coci_programs_data.js", "CPL_COCI_PROGRAMS", done);
    else PROGRAMS_LOADING = false;
  }
  function prettyCollege(name) { return String(name || "").toLowerCase().replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }); }
  function progNeedsRevision(top, cip) {
    var tc = TOPCIP[top];
    if (!tc || !tc.c || !tc.c.length || !cip) return false;   // no crosswalk for this TOP → can't judge
    for (var i = 0; i < tc.c.length; i++) if (tc.c[i][0] === cip) return false;
    return true;
  }
  function progKey() { return st.progCollege != null ? ("cipx_prog_" + st.progCollege) : null; }
  function progStore() { var k = progKey(); if (!k) return {}; try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function progEntry(ctrl) { return progStore()[ctrl] || {}; }
  function progSetField(ctrl, field, val) { var d = progStore(), e = d[ctrl] || {}; if (val) e[field] = val; else delete e[field]; if (Object.keys(e).length) d[ctrl] = e; else delete d[ctrl]; var k = progKey(); if (k) try { localStorage.setItem(k, JSON.stringify(d)); } catch (ex) {} }
  function progCip(ctrl, assigned) { return progEntry(ctrl).cip || assigned || ""; }   // a curator revision overrides the COCI-assigned CIP
  function progCollegeRows() { return (PROGRAMS && st.progCollege != null) ? PROGRAMS.rows.filter(function (r) { return r[0] === st.progCollege; }) : []; }

  function programsView() {
    var host = el("div", { class: "cipx-prog" }, []);
    host.appendChild(el("div", { class: "cipx-prog-intro" }, [
      "Review the CIP code your college assigned each ", el("b", {}, ["program"]), " in COCI. These were coded under the first-generation crosswalk; the current ",
      el("b", {}, ["TOP → CIP"]), " crosswalk is authoritative, so a program whose CIP isn't in it is flagged ",
      el("span", { class: "cipx-prog-flagword" }, ["needs revision"]), ". Choices stay in your browser — nothing reaches COCI until your college enters it there.",
    ]));
    if (!PROGRAMS) { loadPrograms(); host.appendChild(el("div", { class: "cipx-fitmsg" }, ["Loading your programs…"])); return host; }
    if (!PROGRAMS._counts) { var cc = {}; PROGRAMS.rows.forEach(function (r) { cc[r[0]] = (cc[r[0]] || 0) + 1; }); PROGRAMS._counts = cc; }
    var bar = el("div", { class: "cipx-collegebar" }, [el("span", { class: "cipx-college-l" }, [el("span", {}, ["Your college"])])]);
    var sel = el("select", { class: "cipx-college-sel", "aria-label": "Your college" }, [el("option", { value: "" }, ["Choose your college…"])]);
    PROGRAMS.colleges.forEach(function (name, i) { sel.appendChild(el("option", { value: String(i) }, [prettyCollege(name) + "  ·  " + (PROGRAMS._counts[i] || 0) + " programs"])); });
    if (st.progCollege != null) sel.value = String(st.progCollege);
    sel.onchange = function () { st.progCollege = sel.value === "" ? null : parseInt(sel.value, 10); rebuildShell(); };
    bar.appendChild(sel);
    host.appendChild(bar);
    if (st.progCollege == null) { host.appendChild(el("div", { class: "cipx-prog-nudge" }, ["Pick your college to review its programs' CIP codes."])); return host; }

    var rows = progCollegeRows();
    var summary = el("div", { class: "cipx-prog-summary" }, []);
    var tools = el("div", { class: "cipx-prog-tools" }, []);
    var q = el("input", { class: "cipx-search cipx-prog-search", type: "search", "aria-label": "Search programs", placeholder: "Search programs by title, CIP, or TOP…" });
    q.value = st.progQ || "";
    var _t; q.oninput = function () { var v = q.value; clearTimeout(_t); _t = setTimeout(function () { st.progQ = v.toLowerCase().trim(); repaintProgList(); }, 130); };
    tools.appendChild(q);
    var flagTog = el("label", { class: "cipx-prog-flagtog", title: "Show only programs whose assigned CIP isn't in the current crosswalk" }, []);
    var fcb = el("input", { type: "checkbox" }); fcb.checked = !!st.progFlagOnly;
    fcb.onchange = function () { st.progFlagOnly = fcb.checked; repaintProgList(); };
    var flagTogTxt = document.createTextNode(" Needs revision only");
    flagTog.appendChild(fcb); flagTog.appendChild(flagTogTxt);
    tools.appendChild(flagTog);
    host.appendChild(tools);
    host.appendChild(summary);
    var listHostP = el("div", { class: "cipx-prog-list" }, []);
    host.appendChild(listHostP);
    function repaintProgList() {
      var flagged = rows.filter(function (r) { return progNeedsRevision(r[3], progCip(r[1], r[4])); });
      var noCip = rows.filter(function (r) { return !progCip(r[1], r[4]); });
      clear(summary);
      summary.appendChild(document.createTextNode(rows.length.toLocaleString() + " programs · "));
      summary.appendChild(el("b", { class: flagged.length ? "cipx-prog-flagword" : "" }, [flagged.length.toLocaleString() + " need revision"]));
      summary.appendChild(document.createTextNode(" · " + noCip.length.toLocaleString() + " with no CIP yet."));
      flagTogTxt.textContent = " Needs revision only (" + flagged.length + ")";
      clear(listHostP);
      var shown = rows.filter(function (r) {
        if (st.progFlagOnly && !progNeedsRevision(r[3], progCip(r[1], r[4]))) return false;
        if (st.progQ) { var hay = (r[2] + " " + (progCip(r[1], r[4]) || "") + " " + r[3] + " " + (PROGRAMS.awards[r[5]] || "")).toLowerCase(); if (hay.indexOf(st.progQ) < 0) return false; }
        return true;
      });
      shown.sort(function (a, b) {
        var fa = progNeedsRevision(a[3], progCip(a[1], a[4])) ? 0 : 1, fb = progNeedsRevision(b[3], progCip(b[1], b[4])) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return (a[2] || "").toLowerCase() < (b[2] || "").toLowerCase() ? -1 : 1;
      });
      listHostP.appendChild(el("div", { class: "cipx-prog-showing" }, ["Showing " + shown.length.toLocaleString() + (shown.length === 1 ? " program" : " programs") + (st.progFlagOnly ? " needing revision" : "") + " — the ones needing a look are first."]));
      shown.slice(0, 400).forEach(function (r) { listHostP.appendChild(programRow(r, repaintProgList)); });
      if (shown.length > 400) listHostP.appendChild(el("div", { class: "cipx-fitmsg" }, ["Showing the first 400 — refine your search to see the rest."]));
    }
    repaintProgList();
    return host;
  }

  function programRow(r, repaint) {
    var ctrl = r[1], title = r[2], top = r[3], assigned = r[4], award = PROGRAMS.awards[r[5]] || "", cte = r[9] === 1;
    var chosen = progCip(ctrl, assigned);
    var needsRev = progNeedsRevision(top, chosen);
    var cipRow = BYCODE[chosen];
    var row = el("div", { class: "cipx-prog-item" + (needsRev ? " cipx-prog-item-flag" : "") }, []);
    var l1 = el("div", { class: "cipx-prog-l1" }, [el("span", { class: "cipx-prog-title" }, [title])]);
    if (award) l1.appendChild(el("span", { class: "cipx-prog-award", title: award }, [award.length > 40 ? award.slice(0, 38).trim() + "…" : award]));
    if (cte) l1.appendChild(el("span", { class: catClass("CTE"), title: "CTE program (GOAL: Career Technical Education)" }, ["CTE"]));
    row.appendChild(l1);
    var l2 = el("div", { class: "cipx-prog-l2" }, [
      el("span", { class: "cipx-prog-top" }, ["TOP ", el("b", {}, [top || "—"])]),
      el("span", { class: "cipx-prog-arrow", "aria-hidden": "true" }, ["→"]),
    ]);
    l2.appendChild(el("span", { class: "cipx-prog-cip" + (needsRev ? " cipx-prog-cip-flag" : "") }, [
      chosen ? el("span", { class: "cipx-code" }, [chosen]) : el("span", { class: "cipx-prog-nocip" }, ["— no CIP —"]),
      cipRow ? el("span", { class: "cipx-prog-cipt" }, [cipRow.t]) : null,
      (cipRow && cipRow.cat) ? el("span", { class: catClass(cipRow.cat), title: catTip(cipRow.cat) }, [cipRow.cat]) : null,
    ]));
    row.appendChild(l2);
    if (needsRev) {
      var tc = TOPCIP[top];
      var flag = el("div", { class: "cipx-prog-rev" }, [
        el("span", { class: "cipx-prog-revflag" }, ["⚑ needs revision"]),
        el("span", {}, [" — the assigned CIP isn't in the current crosswalk for TOP " + top + (tc && tc.t ? " · " + tc.t : "") + ". Choose the current-crosswalk CIP:"]),
      ]);
      var psel = el("select", { class: "cipx-fsel cipx-prog-revsel", "aria-label": "Revise the CIP for " + title }, [el("option", { value: "" }, ["Keep " + (chosen || "—") + " (assigned)"])]);
      (tc && tc.c || []).forEach(function (ct) { var rr = BYCODE[ct[0]]; psel.appendChild(el("option", { value: ct[0] }, [ct[0] + (rr ? " · " + rr.t : "")])); });
      if (progEntry(ctrl).cip) psel.value = progEntry(ctrl).cip;
      psel.onchange = function () { progSetField(ctrl, "cip", psel.value); if (repaint) repaint(); };
      flag.appendChild(psel);
      row.appendChild(flag);
    }
    if (cipRow && cipRow.cat === "Both") {
      var cur = progEntry(ctrl).cte || "";
      var cteWrap = el("div", { class: "cipx-prog-cte" + (cur ? "" : " cipx-rev-cte-unset") }, [el("span", { class: "cipx-rev-ctelbl" }, ["This CIP is Both — use as:"])]);
      [["cte", "CTE"], ["noncte", "Non-CTE"]].forEach(function (o) {
        var b = el("button", { class: "cipx-rev-ctebtn" + (cur === o[0] ? " cipx-rev-ctebtn-on" : ""), type: "button", "aria-pressed": cur === o[0] ? "true" : "false" }, [o[1]]);
        b.onclick = function () { progSetField(ctrl, "cte", cur === o[0] ? "" : o[0]); if (repaint) repaint(); };
        cteWrap.appendChild(b);
      });
      row.appendChild(cteWrap);
    }
    return row;
  }

  function reviewView() {
    loadStatusCounts();
    var v = el("div", { class: "cipx-rev" }, []);
    v.appendChild(el("div", { class: "cipx-rev-banner" }, ["Each suggestion comes from the course's catalog description, the state TOP→CIP crosswalk, and how peer colleges code the same course. It's a ", el("b", {}, ["starting point you confirm"]), " — your college enters the final code in COCI. Nothing here is saved outside your browser."]));
    revSysHost = el("div", { class: "cipx-rev-syshost" }, []); v.appendChild(revSysHost); renderSysBaseline(revSysHost);
    if (!st.college) {
      v.appendChild(el("div", { class: "cipx-fit-nudge" }, ["First, pick your college at the top of the tab — then choose a subject to review."]));
      return v;
    }
    var col = collegeBySlug(st.college);
    // The Department picker lives UP in the college bar, right beside the college
    // dropdown (Sam: "move Dept selector up next to College") — one control row.
    revDeptSel = el("select", { class: "cipx-rev-deptsel", "aria-label": "Subject to review" }, [el("option", { value: "" }, ["Loading " + (col ? col.name : "college") + " courses…"])]);
    revDeptSel.onchange = function () { rev.dept = revDeptSel.value || null; rev.filter = "all"; loadDept(); };
    if (collegeSelEl && collegeSelEl.parentNode) {
      collegeSelEl.parentNode.appendChild(el("span", { class: "cipx-rev-deptinline" }, [el("span", { class: "cipx-rev-deptl" }, ["Subject"]), revDeptSel]));
    }
    revOverviewHost = el("div", { class: "cipx-rev-overviewhost" }, []);
    v.appendChild(revOverviewHost);
    revProgHost = el("div", { class: "cipx-rev-prog", "aria-live": "polite" }, []);
    v.appendChild(revProgHost);
    // The tiles ride in their OWN host (sibling of the list, child of the tall review view) so the
    // sticky bar stays pinned through the whole list — a sticky element only sticks while its PARENT
    // is on screen, and the short summary host would unstick it immediately.
    revTilesHost = el("div", { class: "cipx-rev-tileshost" }, []);
    v.appendChild(revTilesHost);
    revSummaryHost = el("div", { class: "cipx-rev-summary" }, []);
    v.appendChild(revSummaryHost);
    revListHost = el("div", { class: "cipx-rev-list" }, []);
    v.appendChild(revListHost);
    repaintReviewOverview();
    // populate departments once courses are loaded
    loadCollege(st.college).then(function (courses) {
      rev.courses = courses || [];
      clear(revDeptSel);
      if (!rev.courses.length) { revDeptSel.appendChild(el("option", { value: "" }, ["No courses for this college"])); return; }
      revDeptSel.appendChild(el("option", { value: "" }, ["Choose a subject…"]));
      var depts = departments(rev.courses);
      var cs = collegeStatus(st.college);
      depts.forEach(function (d) {
        var ds = cs && cs.subjects && cs.subjects[d.subj];   // baseline "N review" per subject (Sam #3)
        var tail = ds && ds.review ? " · " + ds.review.toLocaleString() + " review" : "";
        revDeptSel.appendChild(el("option", { value: d.subj }, [d.subj + " · " + d.n + " course" + (d.n === 1 ? "" : "s") + tail]));
      });
      revDeptSel.appendChild(el("option", { value: "__all__" }, ["★ All subjects (" + rev.courses.length.toLocaleString() + " courses — slower)"]));
      if (rev.dept) { revDeptSel.value = rev.dept; loadDept(); }
    }).catch(function () { clear(revDeptSel); revDeptSel.appendChild(el("option", { value: "" }, ["Couldn't load courses — try again"])); });
    return v;
  }

  function deptCourses() {
    if (rev.dept === "__all__") return rev.courses || [];
    return (rev.courses || []).filter(function (c) { return parseSubject(c[0]) === rev.dept; });
  }

  function loadDept() {
    repaintReviewOverview();   // hide the college-overview once a department is chosen; show it when cleared
    if (!rev.dept) { clear(revSummaryHost); clear(revListHost); clear(revProgHost); return; }
    revOpen = {}; revInline = {};   // fresh expansion + inline-UI state per department
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
      if (revIsValidated(r.label)) counts.confirmed++;   // ✓ = individually validated (not merely code-assigned)
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
    clear(revSummaryHost); clear(revTilesHost);
    var tilesRow = el("div", { class: "cipx-rev-tilesrow" }, []);
    var tiles = el("div", { class: "cipx-rev-tiles" }, []);
    [["all", "All", rows.length, ""], ["suggest", "⇄ Suggested", counts.suggest, "suggest"], ["review", "? Review", counts.review, "warn"], ["clear", "✓ Ready", counts.clear, "ok"], ["manual", "◻ Manual", counts.manual, "muted"]].forEach(function (t) {
      if ((t[0] === "suggest" && !counts.suggest) || (t[0] === "manual" && !counts.manual)) return;   // hide Suggested/Manual when 0 (Sam)
      var on = rev.filter === t[0];
      var tile = el("button", { class: "cipx-rev-tile" + (on ? " on" : "") + (t[3] ? " cipx-rev-tile-" + t[3] : ""), type: "button", "aria-pressed": on ? "true" : "false" },
        [el("span", { class: "cipx-rev-tilen" }, [t[2].toLocaleString()]), el("span", { class: "cipx-rev-tilel" }, [t[1]])]);
      tile.onclick = function () { rev.filter = t[0]; renderReview(rows); };
      tiles.appendChild(tile);
    });
    tiles.appendChild(cociSyncTile());   // the destination tile (In Development)
    tilesRow.appendChild(tiles);
    var shown = rows.filter(function (r) { return rev.filter === "all" || r.status === rev.filter; });
    var actions = el("div", { class: "cipx-rev-actions" }, []);
    // Expand/Collapse-all rides in the STICKY tiles row (Sam, 2026-07-20 — mobile) so it's reachable
    // while scrolling; only CSV stays in the top-right rail (which scrolls away on phones).
    var anyClosed = shown.some(function (r) { return !revOpen[r.label]; });
    var xall = el("button", { class: "cipx-rev-expand", type: "button" }, [anyClosed ? "⤢ Expand all" : "⤡ Collapse all"]);
    xall.onclick = function () { shown.forEach(function (r) { revOpen[r.label] = anyClosed; }); renderReview(rows); };
    actions.appendChild(xall);
    var deptTail = rev.dept !== "__all__" ? " in " + rev.dept : "";
    var unconfirmedClear = rows.filter(function (r) { return r.status === "clear" && r.sug && !revIsValidated(r.label); });
    if (unconfirmedClear.length) {
      var bulk = el("button", { class: "cipx-rev-bulk", type: "button", title: "Confirms " + unconfirmedClear.length + " ready course" + (unconfirmedClear.length === 1 ? "" : "s") + " here in your browser. It's never final — every code stays editable or clearable, and nothing reaches COCI until your college enters it there." }, ["✓ Confirm all " + unconfirmedClear.length + (rev.dept !== "__all__" ? " " + rev.dept : "") + " match" + (unconfirmedClear.length === 1 ? "" : "es")]);
      bulk.onclick = function () { unconfirmedClear.forEach(function (r) { if (!revCips(revDecisions(), r.label).length) revSetCips(r.label, [r.sug.code]); revSetValidated(r.label, true); }); renderReview(rows); };
      actions.appendChild(bulk);
    }
    var unconfirmedSuggest = rows.filter(function (r) { return r.status === "suggest" && r.sug && !revIsValidated(r.label); });
    if (unconfirmedSuggest.length) {
      var bulkS = el("button", { class: "cipx-rev-bulk cipx-rev-bulk-suggest", type: "button", title: "Accept the peer-suggested code for every course where peers point somewhere other than your current TOP. Review them first — they're expanded below." }, ["Accept all " + unconfirmedSuggest.length + " suggested change" + (unconfirmedSuggest.length === 1 ? "" : "s")]);
      bulkS.onclick = function () { unconfirmedSuggest.forEach(function (r) { revSetCips(r.label, [r.sug.code]); revSetValidated(r.label, true); }); renderReview(rows); };
      actions.appendChild(bulkS);
    }
    tilesRow.appendChild(actions);   // always (Expand is always present)
    revTilesHost.appendChild(tilesRow);   // sticky bar (college + subject pin above it); progress copy scrolls away below
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
    // CSV lives in the top-right rail (Expand moved into the sticky tiles row above).
    if (revRailEl) {
      clear(revRailEl);
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
    if (shown.length > 300) revListHost.appendChild(el("div", { class: "cipx-rev-more" }, ["Showing 300 of " + shown.length.toLocaleString() + " — narrow by subject or filter."]));
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
      // CTE / Non-CTE use choice for a "Both"-category CIP (Jenni, 2026-07-28): a certified-Both CIP must
      // record which use applies for this course. Only shown on an assigned box (opts.cteLabel set).
      if (opts.cteLabel && row.cat === "Both") {
        var cur = revCteChoice(opts.cteLabel, row.code);
        var cteWrap = el("span", { class: "cipx-rev-cte" + (cur ? "" : " cipx-rev-cte-unset"), title: "This CIP is certified BOTH CTE and non-CTE — choose which use applies to this course" }, []);
        if (!cur) cteWrap.appendChild(el("span", { class: "cipx-rev-ctelbl" }, ["CTE?"]));
        [["cte", "CTE"], ["noncte", "Non-CTE"]].forEach(function (o) {
          var b = el("button", { class: "cipx-rev-ctebtn" + (cur === o[0] ? " cipx-rev-ctebtn-on" : ""), type: "button", "aria-pressed": cur === o[0] ? "true" : "false", title: "Use this CIP as " + o[1] + " for this course" }, [o[1]]);
          b.onclick = function (e) { e.stopPropagation(); revSetCteChoice(opts.cteLabel, row.code, cur === o[0] ? "" : o[0]); if (opts.onCteChange) opts.onCteChange(); };
          cteWrap.appendChild(b);
        });
        chip.appendChild(cteWrap);
      }
    } else {
      chip.appendChild(el("span", { class: "cipx-rev-none" }, ["— pick a code —"]));
    }
    var panel = null;
    function closeP() {
      if (panel && panel._away) { document.removeEventListener("mousedown", panel._away, true); document.removeEventListener("focusin", panel._away, true); }
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel); panel = null; chip.classList.remove("cipx-rev-chip-open");
    }
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
      // Close on click-away / focus leaving the chip so the open search box doesn't hog the screen
      // when it's not being used (Sam, 2026-07-20). A pointer-down or a focus landing OUTSIDE the chip
      // dismisses it; interactions INSIDE (typing, picking) keep it open.
      var away = function (e) { if (panel && !chip.contains(e.target)) closeP(); };
      panel._away = away;
      document.addEventListener("mousedown", away, true);
      document.addEventListener("focusin", away, true);
      var inp = panel.querySelector("input"); if (inp && inp.focus) { try { inp.focus(); } catch (e) {} }
    }
    if (opts.onChange) {
      var chg = el("span", { class: "cipx-rev-chipchg", role: "button", tabindex: "0", "aria-label": "Change CIP code", title: "Change to any CIP code" }, ["▾"]);
      chg.onclick = function (e) { e.stopPropagation(); openP(); };
      chg.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); openP(); } };
      chip.appendChild(chg);
    }
    if (opts.onRemove) {
      var rm = el("span", { class: "cipx-rev-chiprm", role: "button", tabindex: "0", "aria-label": "Remove this CIP code", title: "Remove this CIP" }, ["×"]);
      rm.onclick = function (e) { e.stopPropagation(); opts.onRemove(); };
      rm.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); opts.onRemove(); } };
      chip.appendChild(rm);
    }
    chip.onclick = function (e) {
      e.stopPropagation();   // a click on the chip never toggles the row's expand
      // …but a click that landed on the ▾ change, the × remove, or the OPEN change-panel (all children
      // of the chip) must NOT count as "use this code" — they have their own actions. This is the fix
      // for Sam's recurring "clicking the dropdown OKs the CIP": the panel is a child of the chip, so a
      // click in its search field bubbled here and fired onAccept. (Belt + suspenders with their own
      // stopPropagation, in case a target resolves to the chip.)
      if (e.target && e.target.closest && e.target.closest(".cipx-rev-chipchg, .cipx-rev-chiprm, .cipx-rev-chgpanel")) return;
      if (opts.onAccept) opts.onAccept();
    };
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
    // A weak, uncorroborated pick defaults to the department's dominant code (#843) — but NOT a confident
    // title-match pick (Sam, 2026-07-19): "Environmental Science" → 03.0104 must not be swapped to the BIOL
    // dept-dominant 26.0101 just because few BIOL courses use 03.0104. Nor a DELIBERATE, direct pick (Sam,
    // 2026-07-20): (a) the SOLE credit crosswalk CIP for the TOP — the approved crosswalk's unambiguous
    // field code (BUSL 10 → 22.0000 Legal Studies must not become the dept's 22.0302, which isn't even in
    // its crosswalk); (b) a strong-own-fit DESCRIPTION headline (the veto / F5 case) whose code IS the point
    // of the row. Only weak grab-bag guesses (Ironworker "Rigging" → Robotics) fall through to the default.
    var creditCands = (r.m && r.m.cands || []).filter(function (o) { return o.r.cat !== "Noncredit"; });
    var soleCross = creditCands.length === 1 && r.sugKind === "crosswalk" && code === creditCands[0].r.code;
    var directPick = soleCross || r.sugKind === "description";
    if (!directPick && code && r.status === "review" && (r.sugConf || 0) < SUG_STRONG && ctx && ctx.deptTop) {
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
      // Strong-own-fit veto (CfC F1–F5): the course's own description strongly matches one code while
      // most peers file it under a weaker-fitting one — say BOTH honestly; the peer code is a note, not the pick.
      if (r.ownFitVeto && r.sug) {
        var pa = r.peerAlt;
        return ["Your description best matches ", el("b", {}, [r.sug.code]), (r.sug.t ? " · " + r.sug.t : ""),
          " (" + (r.sugConf || 0) + "%). Most " + r.subj + " peers file this course under ",
          el("b", {}, [pa ? pa.code : "another code"]), (pa && pa.t ? " · " + pa.t : ""),
          " — a weaker fit here. Confirm the description match, or switch to the peer code."];
      }
      // A credible strong description match outside the course's TOP crosswalk was surfaced as the headline
      // (F5) — say so honestly: the TOP may be mis-coded; confirm only if it fits.
      if (r.sugKind === "description" && r.sug) {
        return ["This course's description strongly matches ", el("b", {}, [r.sug.code]), (r.sug.t ? " · " + r.sug.t : ""), ", which its TOP’s crosswalk doesn’t list — the TOP may be mis-coded. Confirm if it truly fits the course, or change."];
      }
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
      // Don't claim "no code" while the box shows one (CfC F10): a thin description can still ride its
      // TOP's crosswalk code as a starting point — say so — but with no crosswalk there's nothing to show.
      if (r.sug) {
        return ["Too little description to score a match — but this course's TOP crosswalk points to ", el("b", {}, [r.sug.code]), (r.sug.t ? " · " + r.sug.t : ""), ". Confirm if it fits, or open to search all codes."];
      }
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

  // ── multi-CIP: add codes inline, then apply them to sibling courses (Sam, 2026-07-18) ──────────
  // A course can carry more than one CIP. The "+" beside the box adds another inline (no row-expand);
  // additional codes stack under the first. The course's "anchor" (its original/primary CIP) is
  // cips[0] once confirmed, else its shown suggestion — adding a code confirms that anchor first, so
  // the primary is never dropped. After adding, the row offers to apply the extra code(s) to the OTHER
  // courses in the subject that share the same anchor (the coherent set — Sam's scoping).
  function revAnchor(r, dec, ctx) {
    var cips = revCips(dec, r.label);
    return cips.length ? cips[0] : effectiveSug(r, ctx).code;
  }
  function coursePrimary(o, dec, ctx) {   // a sibling's primary CIP: its confirmed first, else its suggestion
    var oc = revCips(dec, o.label);
    return oc.length ? oc[0] : effectiveSug(o, ctx).code;
  }
  function revAddCip(r, dec, ctx, code) {
    var cips = revCips(dec, r.label);
    if (!cips.length) { var anchor = effectiveSug(r, ctx).code; cips = anchor ? [anchor] : []; }   // keep primary as the anchor
    if (code && cips.indexOf(code) < 0) {
      if (cips.length >= courseCipCap(r)) return false;   // enforce the credit=1 / noncredit-CDCP=2 cap
      cips.push(code);
    }
    revSetCips(r.label, cips);
    revSetValidated(r.label, true);   // adding a code yourself is an individual confirmation
    return true;
  }
  function renderAddPicker(r, dec, ctx, host, allRows) {
    var cips = revCips(dec, r.label), anchor = effectiveSug(r, ctx).code;
    // Point 1 (Sam): if the original CIP hasn't been OK'd yet, ask them to confirm it right here (no need
    // to exit) — it becomes the anchor, still changeable later without affecting anything they add.
    if (!cips.length && anchor) {
      var wrap = el("div", { class: "cipx-rev-addpick" }, [
        el("div", { class: "cipx-rev-addhint" }, ["First, confirm this course's code — it stays the anchor (you can change it later without affecting anything you add):"]),
      ]);
      var boxrow = el("div", { class: "cipx-rev-anchorrow" }, [
        cipBox(anchor, { id: "cipx-anch-" + r.label.replace(/\W/g, "").slice(0, 16),
          onChange: function (code) { revSetCips(r.label, [code]); revSetValidated(r.label, true); renderReview(allRows); } }),
      ]);
      var ok = el("button", { class: "cipx-rev-anchorok", type: "button" }, ["OK — confirm " + anchor]);
      ok.onclick = function (e) { e.stopPropagation(); revSetCips(r.label, [anchor]); revSetValidated(r.label, true); renderReview(allRows); };
      boxrow.appendChild(ok);
      wrap.appendChild(boxrow);
      host.appendChild(wrap);
      return;
    }
    var w = el("div", { class: "cipx-rev-addpick" }, [el("div", { class: "cipx-rev-addhint" }, ["Add another CIP code — a course can carry more than one:"])]);
    w.appendChild(comboCore({
      id: "cipx-addcip-" + r.label.replace(/\W/g, "").slice(0, 20),
      label: "Add a CIP code", placeholder: "Type a code or keyword (e.g. welding)…",
      groupsFor: allCodeGroupsFor,
      onPick: function (picked) { revAddCip(r, dec, ctx, picked[2]); revInline[r.label] = "prompt"; renderReview(allRows); },
    }));
    host.appendChild(w);
  }
  function renderAddPrompt(r, dec, ctx, host, allRows) {
    var atCap = !canAddCip(r, dec);
    var pr = el("div", { class: "cipx-rev-addprompt" }, [
      el("span", { class: "cipx-rev-addpaw", "aria-hidden": "true" }, ["🐾"]),
      el("span", {}, [atCap ? "Added. This course is now at its CIP limit (" + capReason(r).toLowerCase().replace(/\.$/, "") + ") — apply it to your other courses when you're ready." : "Added. Add more if you need them — when you're ready, I can apply these to your other courses."]),
    ]);
    if (!atCap) {   // only offer another when the credit-type rule allows it
      var more = el("button", { class: "cipx-rev-morebtn", type: "button" }, ["+ Add another"]);
      more.onclick = function (e) { e.stopPropagation(); revInline[r.label] = "picker"; renderReview(allRows); };
      pr.appendChild(more);
    }
    var apply = el("button", { class: "cipx-rev-applybtn", type: "button" }, ["Apply to other courses"]);
    apply.onclick = function (e) { e.stopPropagation(); revInline[r.label] = "apply"; renderReview(allRows); };
    var done = el("button", { class: "cipx-rev-donebtn", type: "button" }, ["Done"]);
    done.onclick = function (e) { e.stopPropagation(); revInline[r.label] = null; renderReview(allRows); };
    pr.appendChild(apply); pr.appendChild(done);
    host.appendChild(pr);
  }
  function renderApplyPanel(r, dec, ctx, host, allRows) {
    var anchor = revAnchor(r, dec, ctx);
    var extras = revCips(dec, r.label).filter(function (c) { return c !== anchor; });   // codes to propagate
    if (!extras.length) { revInline[r.label] = null; renderReview(allRows); return; }
    // candidates = OTHER courses in this subject whose PRIMARY CIP == this course's anchor (Sam's scoping)
    var cands = allRows.filter(function (o) { return o.label !== r.label && o.subj === r.subj && coursePrimary(o, dec, ctx) === anchor; });
    var panel = el("div", { class: "cipx-rev-apply" }, []);
    panel.appendChild(el("div", { class: "cipx-rev-applyh" }, ["Apply to other " + r.subj + " courses"]));
    panel.appendChild(el("div", { class: "cipx-rev-applylead" }, ["Add " + (extras.length > 1 ? "these codes" : "this code") + " to other " + r.subj + " courses that share this course's primary CIP ", el("b", {}, [anchor]), ". Uncheck any that shouldn't get " + (extras.length > 1 ? "them" : "it") + "."]));
    panel.appendChild(el("div", { class: "cipx-rev-applychips" }, extras.map(function (c) { return el("span", { class: "cipx-rev-applychip" }, [c + "  " + ((BYCODE[c] || {}).t || "")]); })));
    var checks = [], listBox = el("div", { class: "cipx-rev-applylist" }, []);
    cands.forEach(function (o) {
      var cb = el("input", { type: "checkbox" }); cb.checked = true;
      var oExtras = revCips(dec, o.label).filter(function (c) { return c !== anchor; });
      var mDash = o.label.indexOf(" — ");
      listBox.appendChild(el("label", { class: "cipx-rev-applycc" }, [cb,
        el("span", { class: "cipx-rev-applynm" }, [el("b", {}, [mDash >= 0 ? o.label.slice(0, mDash) : o.label]), mDash >= 0 ? " " + o.label.slice(mDash + 3) : ""]),
        oExtras.length ? el("span", { class: "cipx-rev-applyhave", title: "already has: " + oExtras.join(", ") }, ["has " + oExtras.length + " extra"]) : null,
      ]));
      checks.push([cb, o]);
    });
    if (!cands.length) listBox.appendChild(el("div", { class: "cipx-rev-applyempty" }, ["No other " + r.subj + " courses share " + anchor + " yet."]));
    var selAll = el("button", { class: "cipx-rev-applylink", type: "button" }, ["Select all"]);
    selAll.onclick = function (e) { e.stopPropagation(); checks.forEach(function (p) { p[0].checked = true; }); };
    var selNone = el("button", { class: "cipx-rev-applylink", type: "button" }, ["Clear"]);
    selNone.onclick = function (e) { e.stopPropagation(); checks.forEach(function (p) { p[0].checked = false; }); };
    panel.appendChild(el("div", { class: "cipx-rev-applytools" }, [
      el("span", { class: "cipx-rev-applycount" }, [cands.length + " " + r.subj + " course" + (cands.length === 1 ? "" : "s") + " share " + anchor]),
      el("span", {}, [selAll, document.createTextNode("  ·  "), selNone]),
    ]));
    panel.appendChild(listBox);
    var applyBtn = el("button", { class: "cipx-rev-applygo", type: "button" }, ["Apply to selected"]);
    applyBtn.onclick = function (e) {
      e.stopPropagation();
      checks.forEach(function (p) {
        if (!p[0].checked) return;
        var oc = revCips(dec, p[1].label);
        if (!oc.length) oc = [anchor];   // confirm the target's shared primary so it isn't dropped
        var cap = courseCipCap(p[1]);    // respect each sibling's own credit-type cap (a credit sibling stays at 1)
        extras.forEach(function (c) { if (oc.indexOf(c) < 0 && oc.length < cap) oc.push(c); });
        revSetCips(p[1].label, oc);
      });
      revInline[r.label] = null; renderReview(allRows);
    };
    var cancel = el("button", { class: "cipx-rev-applycancel", type: "button" }, ["Cancel"]);
    cancel.onclick = function (e) { e.stopPropagation(); revInline[r.label] = null; renderReview(allRows); };
    panel.appendChild(el("div", { class: "cipx-rev-applyfoot" }, [applyBtn, cancel,
      el("span", { class: "cipx-rev-applynote" }, ["Nothing is final — everything stays editable, and nothing reaches COCI until each college enters it there."])]));
    host.appendChild(panel);
  }

  function reviewRow(r, dec, allRows, ctx) {
    var cips = revCips(dec, r.label);
    var hasCips = cips.length > 0;                 // has code(s) assigned (individually OR bulk-applied)
    var confirmed = revIsValidated(r.label);       // ✓ only when the faculty individually validated it
    var applied = hasCips && !confirmed;           // codes assigned via a sibling's bulk-apply, not yet validated
    var eff = effectiveSug(r, ctx);   // may swap a weak review pick for the department's dominant code
    var showCode = hasCips ? cips[0] : eff.code;
    var stat = REV_STATUS[r.status];
    var twoBox = r.suggestChange && !hasCips;      // the two-box choice only until a code is assigned
    var caret = el("span", { class: "cipx-caret" }, ["▸"]);
    function onChange(code) { revToggleCip(r.label, code); revSetValidated(r.label, true); renderReview(allRows); }
    function accept(code) { return function () { revSetCips(r.label, [code]); revSetValidated(r.label, true); renderReview(allRows); }; }
    function validateRow() { revSetValidated(r.label, true); renderReview(allRows); }   // OK an applied row as-is
    var chgId = "cipx-chg-" + r.label.replace(/\W/g, "").slice(0, 20);

    // The transition grid: [ current-code label ] → [ CIP box ]. Two aligned rows when peers
    // suggest a different code (Sam's point 1); the CIP-box column is shared so the boxes line up.
    var grid = el("div", { class: "cipx-rev-tocip" + (twoBox ? " cipx-rev-2box" : "") + (!twoBox && cips.length > 1 ? " cipx-rev-tocip-stack" : "") }, []);
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
      // A vertical CIP STACK (Sam, 2026-07-18): the primary box + a "+" to add another inline, then any
      // additional confirmed CIPs stacked directly under it (each removable). One CIP = one clean line.
      var stack = el("div", { class: "cipx-rev-cipstack" }, []);
      // Box-click (Sam, 2026-07-19): a high-confidence ✓ Ready row confirms in ONE click (fast path);
      // a ? Review or ◻ Manual row OPENS instead — a weak/unreviewed default must never be validated by
      // a stray click meant to expand the row (the box is the big central target). Applied rows keep their
      // deliberate click-to-confirm (that code was placed by a sibling bulk-apply, not a bare default).
      var readyConfirm = r.status === "clear";
      var primline = el("div", { class: "cipx-rev-primline" }, [
        cipBox(showCode, { on: confirmed, id: chgId,
          cteLabel: (cips.length ? r.label : null), onCteChange: function () { renderReview(allRows); },
          onAccept: confirmed ? null : (applied ? validateRow : (showCode ? (readyConfirm ? accept(showCode) : openRow) : null)),
          title: applied ? "Codes applied from a sibling — click to confirm this course · ▾ to change"
            : (confirmed ? null : (readyConfirm ? "Click to confirm this ready match · ▾ to change to any code"
            : "Open to review the options before confirming · ▾ to change to any code")),
          onChange: onChange }),
      ]);
      // Credit-type CIP-count rule (Raul, 2026-07-28): a credit course takes 1 CIP; noncredit takes 1
      // unless it's CDCP (up to 2). Show the course's credit-type label, and an ACTIVE "+" only when a
      // 2nd CIP is allowed (CDCP, under cap); otherwise a muted, non-interactive "+" carrying the reason.
      var cflag = courseCreditFlag(r);
      if (cflag) primline.appendChild(el("span", { class: "cipx-rev-credit" + (cflag === "D" ? " cipx-rev-credit-cdcp" : ""), title: capReason(r) }, [creditLabel(cflag)]));
      if (courseIsCdcp(r) && canAddCip(r, dec)) {
        var addBtn = el("button", { class: "cipx-rev-addcip", type: "button", title: "Add a 2nd CIP — CDCP noncredit courses may carry up to 2", "aria-label": "Add another CIP to " + r.label }, ["+"]);
        addBtn.onclick = function (e) { e.stopPropagation(); revInline[r.label] = (revInline[r.label] === "picker") ? null : "picker"; renderReview(allRows); };
        primline.appendChild(addBtn);
      } else {
        primline.appendChild(el("span", { class: "cipx-rev-addcip cipx-rev-addcip-off", title: capReason(r), "aria-label": capReason(r) }, ["+"]));
      }
      stack.appendChild(primline);
      cips.slice(1).forEach(function (code) {
        stack.appendChild(el("div", { class: "cipx-rev-extraline" }, [
          cipBox(code, { cls: "cipx-rev-chip-extra", id: chgId + "x" + code.replace(/\W/g, ""), onChange: onChange,
            cteLabel: r.label, onCteChange: function () { renderReview(allRows); },
            onRemove: function () { revToggleCip(r.label, code); renderReview(allRows); } }),
        ]));
      });
      gline(fromTopEl(r), stack, "cipx-rev-l-stack");
    }
    // Quiet by default (Sam, 2026-07-18 — "ship it"): a Ready row is a clean one-liner. The peer-
    // corroboration metric that used to sit on a second line ("✓ N of M colleges agree") now lives
    // on the ✓'s tooltip + a faint peer-corroborated dot, and in the expanded card — not repeated on
    // every row. The two-box Suggested row keeps its full display (the rare row that earns the space).
    var tocip = el("span", { class: "cipx-rev-tocipwrap" }, [grid]);
    // the inline multi-CIP flow host (add-picker → prompt → apply-to-subject), below the box stack.
    if (!twoBox && revInline[r.label]) {
      var ihost = el("div", { class: "cipx-rev-inline" }, []);
      if (revInline[r.label] === "picker") renderAddPicker(r, dec, ctx, ihost, allRows);
      else if (revInline[r.label] === "prompt") renderAddPrompt(r, dec, ctx, ihost, allRows);
      else if (revInline[r.label] === "apply") renderApplyPanel(r, dec, ctx, ihost, allRows);
      tocip.appendChild(ihost);
    }
    var peerCorr = !confirmed && !twoBox && !!r.cons;   // Ready + peer-corroborated → a quiet dot + hover detail

    function statusTip() {
      if (confirmed) return "You confirmed this code";
      if (applied) return cips.length + " code" + (cips.length === 1 ? "" : "s") + " applied here from a sibling course — click the box to confirm this course, or open to adjust.";
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
      el("span", { class: "cipx-rev-stat cipx-rev-stat-" + stat.cls + (peerCorr ? " cipx-rev-stat-peer" : ""), title: statusTip(), "aria-label": (confirmed ? "Confirmed" : stat.label) + " status" + (peerCorr ? ", peer-corroborated" : "") },
        [confirmed ? "✓" : stat.g, peerCorr ? el("span", { class: "cipx-rev-statdot", "aria-hidden": "true" }, ["·"]) : null]),
    ]);
    var card = el("div", { class: "cipx-rev-item" + (confirmed ? " cipx-rev-conf" : "") + (applied ? " cipx-rev-item-applied" : "") + (twoBox ? " cipx-rev-item-suggest" : "") }, [head]);
    // inline "why this is a ?" reason (review/manual only — Ready rows stay clean one-liners). Sits
    // between the head and the (lazy) expand body so the reason is visible without opening the row.
    var whyKids = confirmed ? null : (applied
      ? ["This course received ", el("b", {}, [cips.length.toLocaleString()]), " CIP code" + (cips.length === 1 ? "" : "s") + " applied from a sibling course — review and confirm it (click the box), or leave it for a later pass."]
      : reviewWhy(r, ctx || {}, eff));
    if (whyKids) card.appendChild(el("div", { class: "cipx-rev-whyline cipx-rev-whyline-" + (applied ? "applied" : r.status) }, whyKids));
    var body = null;
    function paint() {
      var open = !!revOpen[r.label];
      caret.textContent = open ? "▾" : "▸"; head.setAttribute("aria-expanded", open ? "true" : "false");
      card.classList.toggle("cipx-rev-item-open", open);   // package treatment: spine + framed top + tint bind row to detail (Sam)
      if (open && !body) { body = reviewExpand(r, dec, allRows, ctx); card.appendChild(body); }
      else if (!open && body) { card.removeChild(body); body = null; }
    }
    function tog() { revOpen[r.label] = !revOpen[r.label]; paint(); }
    function openRow() { if (!revOpen[r.label]) { revOpen[r.label] = true; paint(); } }
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
    var isMaj = modal.n * 2 > cons.n;   // a TRUE majority — else it's a plurality/tie ("most common", not "most use")
    els.push(el("div", { class: "cipx-rev-peerbody" }, [
      scoped
        ? ("Among the " + cons.n + " " + subj + " department" + (cons.n === 1 ? "" : "s") + " teaching “" + cons.key + ",” " + (isMaj ? "most use TOP " : "the most common is TOP "))
        : ("Across California, " + cons.n + " college" + (cons.n === 1 ? "" : "s") + " teach “" + cons.key + ".” " + (isMaj ? "Most use TOP " : "The most common is TOP ")),
      el("span", { class: "cipx-code" }, [modal.top]), modal.topTitle ? " · " + modal.topTitle : "", " ",
      el("span", { class: "cipx-rev-peermetric", title: differHover(cons) }, ["(" + modal.n + " use, " + cons.differ + " differ" + (isMaj ? "" : " — no majority") + ")"]),
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
      var isMaj = modal.n * 2 > cons.n;   // "peer consensus" only on a TRUE majority; a plurality/tie is "most common"
      wrap.appendChild(candRow(best.r, (best.rel || 0),
        el("span", { class: "cipx-rev-peertag", title: "Where peer colleges' TOP codes point via the crosswalk" }, [(isMaj ? "peer consensus · " : "most common · ") + modal.n + " of " + cons.n]),
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

  function reviewExpand(r, dec, allRows, ctx) {
    var box = el("div", { class: "cipx-rev-detail" }, []);
    var cips = revCips(dec, r.label);
    // The code the BOX shows (may be a dept-default) — the Confirm button must commit THIS, not the raw
    // crosswalk sug, so the box and the button never disagree (Sam, 2026-07-20: BUSL 10 showed 22.0302 but
    // "Confirm 22.0000"). effectiveSug is display-only and idempotent, so recomputing it here is safe.
    var effCode = (effectiveSug(r, ctx || {}).code) || (r.sug && r.sug.code) || null;
    // selecting/deselecting a code in the expand is individual work → validate (or unvalidate when cleared).
    // Credit-type cap: a 1-CIP course (credit / noncredit non-CDCP / unknown) REPLACES its single code when
    // a new one is selected; a CDCP course (cap 2) accumulates until full, then a further add is blocked.
    function toggle(code) {
      var cur = revCips(revDecisions(), r.label);
      if (cur.indexOf(code) < 0 && cur.length >= courseCipCap(r)) {
        if (courseCipCap(r) === 1) { revSetCips(r.label, [code]); revSetValidated(r.label, true); renderReview(allRows); }
        return;   // CDCP already at 2 → block the extra
      }
      revToggleCip(r.label, code); revSetValidated(r.label, revCips(revDecisions(), r.label).length > 0); renderReview(allRows);
    }
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

    // 2) the course's own TOP crosswalk candidates (or, when that TOP has no course-specific CIP,
    //    crosswalk CIPs from other TOPs — never free-range codes).
    var opts = r.m.cands.length ? r.m.cands : xwalkAlts(r.m.res.ranked, 6);
    var fromCrosswalk = r.m.cands.length > 0;
    box.appendChild(el("div", { class: "cipx-rev-siglabel" }, [fromCrosswalk ? "From this course’s TOP crosswalk" + (r.top ? " (" + r.top + ")" : "") : "Crosswalk CIP codes under other TOPs (this TOP has none)"]));
    if (!opts.length) box.appendChild(el("div", { class: "cipx-fitmsg" }, [r.m.thin ? "Too little catalog description to suggest a crosswalk code — verify the course's TOP." : "No crosswalk CIP matches — verify the course's TOP with your curriculum team."]));
    opts.slice(0, 6).forEach(function (o) {
      var altT = o.altTops && o.altTops[0];
      var extraTag = (fromCrosswalk && r.top)
        ? el("span", { class: "cipx-rev-candtop", title: "The official crosswalk maps this CIP from the course's TOP " + r.top }, ["← TOP ", r.top])
        : (altT ? el("span", { class: "cipx-rev-candtop", title: "In the crosswalk under TOP " + altT.top + (altT.title ? " · " + altT.title : "") + " — the course's TOP may need updating." }, ["↔ TOP ", altT.top]) : null);
      box.appendChild(candRow(o.r, (o.dconf != null ? o.dconf : (o.conf != null ? o.conf : (o.rel || 0))), extraTag, null, o.matched));
    });

    // 3) stronger matches in the crosswalk under a MORE-APPROPRIATE TOP (the mis-code nudge) — every one
    // is a real crosswalk code (inXwalk), filtered to field-credible candidates (F3/F5: sharing the course
    // field's or peer consensus's CIP family). No free-range codes are ever surfaced here.
    var bo = r.beyondOk || r.m.beyond;
    if (bo.length) {
      box.appendChild(el("div", { class: "cipx-rev-flag" }, ["⚑ Stronger match" + (bo.length > 1 ? "es" : "") + " in the crosswalk under a more-appropriate TOP. This course is coded ", el("b", {}, ["TOP " + r.top + (r.topTitle ? " · " + r.topTitle : "")]), " — its TOP may be mis-coded. These ARE official crosswalk codes, just under a different TOP; verify the course's TOP, then pick one only if it truly fits:"]));
      bo.slice(0, 3).forEach(function (o) {
        var altT = o.altTops && o.altTops[0];
        box.appendChild(candRow(o.r, (o.conf != null ? o.conf : (o.rel || 0)), el("span", { class: "cipx-rev-outtag", title: altT ? "In the crosswalk under TOP " + altT.top + (altT.title ? " · " + altT.title : "") : "" }, [altT ? "↔ TOP " + altT.top : "other TOP"]), "cipx-rev-cand-out", o.matched));
      });
    }

    // actions: utility links (add / clear) on the LEFT; the decision buttons (Keep + Confirm) on the RIGHT
    // — aligned with the per-candidate "Select" column so the primary action sits where the eye already is
    // (Sam, 2026-07-20: "it should be on the right side with all the other confirms"). Confirm is rightmost.
    var acts = el("div", { class: "cipx-rev-detactions" }, []);
    var utils = el("div", { class: "cipx-rev-actutils" }, []);
    var decide = el("div", { class: "cipx-rev-actdecide" }, []);
    var validated = revIsValidated(r.label);
    // "+ Add another code…" opens a full-width search combo BELOW the action row (not inline in the flex row)
    var srch = el("button", { class: "cipx-rev-searchall", type: "button" }, ["+ Add another code…"]);
    var searchWrap = el("div", { class: "cipx-rev-searchwrap" }, []);
    srch.onclick = function () {
      if (searchWrap.firstChild) { clear(searchWrap); return; }
      searchWrap.appendChild(comboCore({
        id: "cipx-revsearch-" + r.label.replace(/\W/g, "").slice(0, 20),
        label: "Search all CIP codes", placeholder: "Type a code or keyword…",
        groupsFor: allCodeGroupsFor,
        onPick: function (picked) { toggle(picked[2]); clear(searchWrap); },
      }));
    };
    if (canAddCip(r, dec)) utils.appendChild(srch);   // "+ Add another" only when the credit-type rule allows another CIP
    if (cips.length) { var clr = el("button", { class: "cipx-rev-clear", type: "button" }, [cips.length > 1 ? "Clear all" : "Clear"]); clr.onclick = function () { revSetCips(r.label, []); revSetValidated(r.label, false); renderReview(allRows); }; utils.appendChild(clr); }
    if ((!cips.length && r.sug) || (cips.length && !validated)) {
      // A Suggested (⇄) row nudges OFF the course's own TOP crosswalk toward the peer pick, so the lone
      // "Confirm <peer>" left no obvious way to keep the crosswalk code if the curator decides it's right
      // (Sam, 2026-07-20 — "I'm not sure how to keep 13.1210"). Offer a matched "Keep <crosswalk>" beside
      // it: peer pick stays the filled primary (the tool's suggestion), Keep is the secondary outline.
      // Any OTHER code is still Select-able in the list above. Keep sits LEFT of Confirm (Confirm rightmost).
      if (!cips.length && r.suggestChange && r.crosswalk && r.sug && r.crosswalk.code !== r.sug.code) {
        var keep = el("button", { class: "cipx-rev-keep", type: "button", title: "Keep your TOP’s crosswalk code (" + r.crosswalk.code + " · " + r.crosswalk.t + ") instead of the peers’ suggestion" }, ["Keep " + r.crosswalk.code]);
        keep.onclick = function () { revSetCips(r.label, [r.crosswalk.code]); revSetValidated(r.label, true); renderReview(allRows); };
        decide.appendChild(keep);
      }
      // Confirm commits what the BOX shows (effCode), never a different code (Fix C).
      var confCode = cips.length ? null : effCode;
      var conf = el("button", { class: "cipx-rev-confirm", type: "button" }, [cips.length ? "✓ Confirm this course" : "✓ Confirm " + confCode]);
      conf.onclick = function () { if (!cips.length) { toggle(confCode); } else { revSetValidated(r.label, true); renderReview(allRows); } };
      decide.appendChild(conf);
    }
    acts.appendChild(utils);
    acts.appendChild(decide);
    box.appendChild(acts);
    box.appendChild(searchWrap);
    return box;
  }

  function exportReviewCsv(rows, dec, ctx) {
    var out = ["Course,Subject,Current TOP,TOP Title,CIP Code,CIP Title,CIP Category,Status,Source"];
    function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
    rows.forEach(function (r) {
      var picked = revCips(dec, r.label);                       // 0+ assigned CIPs (validated OR bulk-applied)
      var eff = effectiveSug(r, ctx);                           // the shown code (may be a program-default)
      var codes = picked.length ? picked : (eff.code ? [eff.code] : []);
      var source = picked.length
        ? (revIsValidated(r.label) ? "faculty-confirmed" : "applied (not yet validated)")
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
  // Top-level scope toggle (Sam, 2026-07-28): Courses vs Programs is the FIRST decision — a curator is
  // coding one or the other. It sits ABOVE the mode tabs; everything below adapts to the pick.
  function scopeBar() {
    var bar = el("div", { class: "cipx-scopebar", role: "tablist", "aria-label": "Code your courses or your programs" }, []);
    bar.appendChild(el("span", { class: "cipx-scopebar-l", "aria-hidden": "true" }, ["Code my:"]));
    [["courses", "Courses"], ["programs", "Programs"]].forEach(function (s) {
      var on = st.scope === s[0];
      var b = el("button", { class: "cipx-scopetab" + (on ? " on" : ""), type: "button", role: "tab", "aria-selected": on ? "true" : "false" }, [s[1]]);
      b.onclick = function () {
        if (st.scope === s[0]) return;
        st.scope = s[0];
        try { localStorage.setItem(SCOPE_KEY, s[0]); } catch (e) {}
        if (st.scope === "programs" && st.mode === "recommend") st.mode = "review";   // no course-first easy button for programs
        rebuildShell();
      };
      bar.appendChild(b);
    });
    return bar;
  }
  function modeBar() {
    var bar = el("div", { class: "cipx-modebar", role: "tablist", "aria-label": "What do you want to do" }, []);
    // Review leads — it's the primary workflow now (Sam, 2026-07-18: "make Review the first tab + default").
    // Programs scope drops the course-first "Find my course's code" and relabels Review.
    var tabs = (st.scope === "programs")
      ? [["review", "Review my programs"], ["browse", "Browse codes"]]
      : [["review", "Review my catalog"], ["browse", "Browse codes"], ["recommend", "Find my course’s code"]];
    tabs.forEach(function (m) {
      var on = st.mode === m[0];
      var b = el("button", { class: "cipx-modetab" + (on ? " on" : ""), type: "button", role: "tab", "aria-selected": on ? "true" : "false" }, [el("span", {}, [m[1]])]);   // tab glyphs dropped (Sam, 2026-07-20) — labels only
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
      el("div", { class: "cipx-eyebrow" }, ["California Community Colleges · Chancellor's Office · Academic Affairs"]),
      el("h2", { class: "cipx-h2" }, ["California Community College Searchable CIP Code Taxonomy", el("span", { class: "cipx-beta" }, ["Beta"])]),
      el("p", { class: "cipx-sub" }, ["A simplified process supporting the Fall 2026 ", el("b", {}, ["TOP → CIP"]), " transition. Start from one of your courses, get a CIP code suggested from its current TOP and description, and confirm the fit — soon, sync your settled codes straight to COCI."]),
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

    // CIP-code filters (2 / 4 / 6-digit) — leftmost + most prominent of all the filters.
    // Each list has a "Select All" (all-codes) option at the top; they cascade.
    var cipGroup = el("div", { class: "cipx-cipfilters", role: "group", "aria-label": "Filter by CIP code" }, []);
    cipGroup.appendChild(el("span", { class: "cipx-cipfilters-lbl", "aria-hidden": "true" }, ["CIP code"]));
    var sel2 = el("select", { class: "cipx-fsel cipx-fsel-cip", "aria-label": "Filter by CIP sector (2-digit)" }, []);
    var sel4 = el("select", { class: "cipx-fsel cipx-fsel-cip", "aria-label": "Filter by CIP sub-series (4-digit)" }, []);
    var sel6 = el("select", { class: "cipx-fsel cipx-fsel-cip cipx-fsel-cip6", "aria-label": "Filter by CIP code (6-digit)" }, []);
    famRef = sel2; fam4Ref = sel4; fam6Ref = sel6;
    fillCipSelects();
    sel2.onchange = function () { st.fam = sel2.value; st.fam4 = ""; st.fam6 = ""; fillCip4(); fillCip6(); st.limit = PAGE; render(); };
    sel4.onchange = function () { st.fam4 = sel4.value; st.fam6 = ""; fillCip6(); st.limit = PAGE; render(); };
    sel6.onchange = function () { st.fam6 = sel6.value; st.limit = PAGE; render(); };
    cipGroup.appendChild(sel2); cipGroup.appendChild(sel4); cipGroup.appendChild(sel6);
    controls.appendChild(cipGroup);
    controls.appendChild(el("span", { class: "cipx-chipsep" }, []));

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
    var tog = el("label", { class: "cipx-retiredtog", title: "Retired = moved/deleted in 2020. Reserved = placeholder codes." }, []);
    var cb = el("input", { type: "checkbox" }); cbRef = cb;
    cb.onchange = function () { st.showRetired = cb.checked; fillCip4(); fillCip6(); st.limit = PAGE; render(); };
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
    wrapEl.appendChild(scopeBar());
    wrapEl.appendChild(modeBar());
    wrapEl.appendChild(collegeBar());
    var programsReview = (st.scope === "programs" && st.mode === "review");
    if (programsReview) {
      wrapEl.appendChild(programsView());
    } else if (st.mode === "recommend") {
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
    if (programsReview) loadPrograms();
    if (st.mode === "review" && st.scope === "courses" || st.mode === "recommend") loadConsensus();
    if (st.college && st.scope === "courses") loadCollege(st.college);
    bindStickyResize();
    (window.requestAnimationFrame || setTimeout)(syncStickyOffsets, 0);   // publish the college-bar height for the sticky tiles offset
  }

  // ── CSS ────────────────────────────────────────────────────────────────────
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var css = [
      ".cipx{" +
        "--cipx-page:transparent;--cipx-surface:#ffffff;--cipx-surface-2:#eef3f9;--cipx-surface-sub:#f2f6fb;" +
        "--cipx-text:#16283d;--cipx-text-soft:#3c526b;--cipx-muted:#566a80;--cipx-border:#dbe4ee;--cipx-border-strong:#c3d1e0;--cipx-recbadge-bg:#3f6b4e;--cipx-row-sep:#ffffff;--cipx-rev-field:#e7edf4;" +
        "--cipx-accent:#00356b;--cipx-accent-soft:#e7eef6;--cipx-link:#0b5fa8;--cipx-focus:#1f7ae0;--cipx-mark:#ffe89c;--cipx-mark-fg:inherit;" +
        "--cipx-cte-bg:#d7ead9;--cipx-cte-fg:#1e5533;--cipx-cte-stripe:#5c9a72;--cipx-both-bg:#e9eaf1;--cipx-both-fg:#565d78;" +
        "--cipx-non-bg:#eceef1;--cipx-non-fg:#59636f;--cipx-nc-bg:#e6edee;--cipx-nc-fg:#4f6a71;" +
        "--cipx-ret-bg:#ececec;--cipx-ret-fg:#5f646b;--cipx-new-bg:#efe9dd;--cipx-new-fg:#6b5c3d;" +
        "--cipx-ok-bg:#e7ede7;--cipx-ok-fg:#3f5a45;--cipx-ok-stripe:#6f9079;--cipx-warn-bg:#f4ecd8;--cipx-warn-fg:#6f5d33;--cipx-warn-stripe:#c6a24a;--cipx-bad-bg:#efe1dd;--cipx-bad-fg:#7c5147;--cipx-bad-stripe:#b7796b;" +
        "max-width:1200px;margin:0 auto;padding:6px 22px 26px;background:var(--cipx-page);border-radius:14px;font-size:.95rem;color:var(--cipx-text);line-height:1.5;}",
      ".cipx.cipx-theme-dark{" +
        "--cipx-page:#0e1a2b;--cipx-surface:#16263b;--cipx-surface-2:#1b3150;--cipx-surface-sub:#132338;" +
        "--cipx-text:#e7eef6;--cipx-text-soft:#b8c7d8;--cipx-muted:#8397ab;--cipx-border:#274058;--cipx-border-strong:#33506e;--cipx-row-sep:#33506e;--cipx-rev-field:#101f33;" +
        "--cipx-accent:#7db3ec;--cipx-accent-soft:#1b3652;--cipx-link:#8fc0f2;--cipx-focus:#7db3ec;--cipx-mark:#5a4a1a;--cipx-mark-fg:#ffe89c;" +
        "--cipx-cte-bg:#294c35;--cipx-cte-fg:#c6e3ce;--cipx-cte-stripe:#4f9269;--cipx-both-bg:#272c45;--cipx-both-fg:#aeb4d2;--cipx-non-bg:#28323f;--cipx-non-fg:#9aa7b6;--cipx-nc-bg:#1f3841;--cipx-nc-fg:#93b6bf;--cipx-ret-bg:#2a2f36;--cipx-ret-fg:#929aa3;--cipx-new-bg:#34301f;--cipx-new-fg:#c6b78e;" +
        "--cipx-ok-bg:#233a2c;--cipx-ok-fg:#a4bda9;--cipx-ok-stripe:#5f8f74;--cipx-warn-bg:#38321f;--cipx-warn-fg:#d8c48c;--cipx-warn-stripe:#b0913f;--cipx-bad-bg:#3a2723;--cipx-bad-fg:#d9a89c;--cipx-bad-stripe:#a86a5c;--cipx-recbadge-bg:#7cc79b;}",
      ".cipx-head{position:relative;padding:2px 7.6rem 6px 0;}",
      ".cipx-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--cipx-accent);}",
      ".cipx-h2{margin:.28em 0 .1em;font-size:1.6rem;line-height:1.15;color:var(--cipx-text);}",
      ".cipx-beta{font-size:.5em;font-weight:800;letter-spacing:.05em;text-transform:uppercase;vertical-align:middle;color:var(--cipx-accent);background:var(--cipx-accent-soft);border:1px solid var(--cipx-border);border-radius:7px;padding:2px 8px;margin-left:11px;position:relative;top:-4px;}",
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
      ".cipx-cipfilters{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:5px 10px;border:1.5px solid var(--cipx-accent);border-radius:9px;background:var(--cipx-accent-soft);}",
      ".cipx-cipfilters-lbl{font-size:.7rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cipx-accent);}",
      ".cipx-fsel-cip{max-width:210px;}.cipx-fsel-cip6{max-width:260px;}",
      ".cipx-fsel:focus-visible,.cipx-pill:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:2px;}",
      ".cipx-retiredtog{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;color:var(--cipx-muted);cursor:pointer;margin-left:auto;}",
      ".cipx-count{font-size:.82rem;color:var(--cipx-muted);font-weight:600;margin:13px 0 0;display:flex;align-items:baseline;flex-wrap:wrap;gap:2px;}",
      ".cipx-cfilters{color:var(--cipx-accent);font-weight:650;}.cipx-clearbtn{margin-left:10px;font-size:.78rem;font-weight:600;color:var(--cipx-link);background:none;border:0;cursor:pointer;padding:0;font-family:inherit;}.cipx-clearbtn:hover{text-decoration:underline;}",
      ".cipx-csv{margin-left:auto;font-size:.76rem;font-weight:700;color:var(--cipx-link);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:7px;padding:3px 9px;cursor:pointer;}",
      // college bar
      // College + Subject pin to the top on scroll (Sam, 2026-07-20) — switch subjects/colleges without scrolling up.
      ".cipx-collegebar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:9px 14px;margin:0 0 12px;position:sticky;top:0;z-index:26;box-shadow:0 2px 8px rgba(9,19,32,.06);}",
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
      ".cipx-row{display:grid;grid-template-columns:16px 92px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 10px;cursor:pointer;}",
      ".cipx-row:hover{background:var(--cipx-surface-sub);}.cipx-item.cipx-open .cipx-row{background:var(--cipx-surface-sub);}",
      ".cipx-caret{color:var(--cipx-muted);font-size:.8rem;width:14px;text-align:center;}",
      ".cipx-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:600;font-size:.9rem;color:var(--cipx-accent);}",
      ".cipx-ttl{font-weight:550;color:var(--cipx-text);min-width:0;overflow-wrap:anywhere;}",
      ".cipx-tags{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}",
      ".cipx-cat{font-size:.66rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:3px 9px;border-radius:7px;white-space:nowrap;}",
      ".cipx-cat-CTE{background:var(--cipx-cte-bg);color:var(--cipx-cte-fg);font-weight:800;border:1px solid var(--cipx-cte-stripe);}.cipx-cat-Both{background:var(--cipx-both-bg);color:var(--cipx-both-fg);}.cipx-cat-NonCTE{background:var(--cipx-non-bg);color:var(--cipx-non-fg);}.cipx-cat-Noncredit{background:var(--cipx-nc-bg);color:var(--cipx-nc-fg);}.cipx-cat-Retired,.cipx-cat-Reserved{background:var(--cipx-ret-bg);color:var(--cipx-ret-fg);}",
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
      ".cipx-scopebar{display:inline-flex;gap:8px;align-items:center;margin:14px 0 2px;}",
      ".cipx-scopebar-l{font-size:.74rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cipx-accent);}",
      ".cipx-scopetab{font-family:inherit;font-size:.92rem;font-weight:700;color:var(--cipx-text-soft);background:var(--cipx-surface);border:1.5px solid var(--cipx-border-strong);border-radius:9px;padding:7px 18px;cursor:pointer;}",
      ".cipx-scopetab:hover{border-color:var(--cipx-accent);color:var(--cipx-accent);}",
      ".cipx-scopetab.on{color:#fff;background:var(--cipx-accent);border-color:var(--cipx-accent);}",
      ".cipx-scopetab:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:2px;}",
      // Programs review
      ".cipx-prog{margin-top:6px;}",
      ".cipx-prog-intro{color:var(--cipx-text-soft);font-size:.95rem;line-height:1.5;background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:12px;padding:13px 16px;margin:4px 0 12px;}",
      ".cipx-prog-flagword{color:var(--cipx-bad-fg);font-weight:700;}",
      ".cipx-prog-nudge{color:var(--cipx-muted);font-size:.95rem;padding:16px 4px;}",
      ".cipx-prog-tools{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:10px 0 6px;}",
      ".cipx-prog-search{max-width:420px;flex:1 1 260px;}",
      ".cipx-prog-flagtog{display:inline-flex;gap:7px;align-items:center;font-size:.86rem;color:var(--cipx-text-soft);cursor:pointer;white-space:nowrap;}",
      ".cipx-prog-summary{font-size:.9rem;color:var(--cipx-text-soft);margin:2px 0 8px;}",
      ".cipx-prog-showing{font-size:.82rem;color:var(--cipx-muted);margin:4px 2px 8px;}",
      ".cipx-prog-list{display:flex;flex-direction:column;}",
      ".cipx-prog-item{border:1px solid var(--cipx-border);border-radius:11px;padding:11px 14px;margin-bottom:8px;background:var(--cipx-surface);}",
      ".cipx-prog-item-flag{border-color:var(--cipx-bad-stripe);border-left:4px solid var(--cipx-bad-stripe);background:var(--cipx-bad-bg);}",
      ".cipx-prog-l1{display:flex;gap:9px;align-items:baseline;flex-wrap:wrap;min-width:0;}",
      ".cipx-prog-title{font-weight:650;color:var(--cipx-text);min-width:0;overflow-wrap:anywhere;flex:1 1 60%;}",
      ".cipx-prog-award{font-size:.72rem;font-weight:700;color:var(--cipx-muted);background:var(--cipx-surface-sub);border:1px solid var(--cipx-border);border-radius:6px;padding:2px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px;flex:0 1 auto;min-width:0;}",
      ".cipx-prog-l2{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:.9rem;}",
      ".cipx-prog-top{color:var(--cipx-text-soft);}.cipx-prog-arrow{color:var(--cipx-muted);}",
      ".cipx-prog-cip{display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;}",
      ".cipx-prog-cipt{color:var(--cipx-text-soft);min-width:0;overflow-wrap:anywhere;}",
      ".cipx-prog-nocip{color:var(--cipx-bad-fg);font-weight:600;font-style:italic;}",
      ".cipx-prog-rev{margin-top:8px;font-size:.86rem;color:var(--cipx-text-soft);line-height:1.5;display:flex;gap:7px;align-items:center;flex-wrap:wrap;}",
      ".cipx-prog-revflag{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--cipx-bad-fg);background:var(--cipx-bad-bg);border:1px solid var(--cipx-bad-stripe);border-radius:6px;padding:2px 8px;white-space:nowrap;}",
      ".cipx-prog-revsel{max-width:100%;}",
      ".cipx-prog-cte{margin-top:8px;display:inline-flex;gap:5px;align-items:center;}",
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
      ".cipx-alttop{font-size:.66rem;font-weight:700;color:var(--cipx-warn-fg);background:var(--cipx-warn-bg);border:1px solid var(--cipx-warn-stripe);padding:2px 7px;border-radius:6px;white-space:nowrap;cursor:help;}",
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
      ".cipx-rev-deptsel{font-family:inherit;font-size:.92rem;padding:8px 11px;border-radius:8px;border:1.5px solid var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-text);cursor:pointer;max-width:none;flex:1 1 auto;min-width:240px;}",
      ".cipx-rev-deptsel:focus{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      ".cipx-rev-prog{font-size:.82rem;color:var(--cipx-muted);font-style:italic;min-height:0;margin:0 2px;}",
      // The tiles bar pins flush beneath the sticky college bar (top = its measured height). Its own
      // host (sibling of the list) so it stays stuck through the whole list; progress copy scrolls away.
      ".cipx-rev-tileshost{position:sticky;top:var(--cipx-cbh,56px);z-index:24;background:var(--cipx-surface-2);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:8px 12px;margin:2px 0 10px;box-shadow:0 3px 10px rgba(9,19,32,.07);}",
      ".cipx-rev-tileshost:empty{display:none;}",
      ".cipx-rev-tilesrow{display:flex;align-items:center;gap:9px 14px;flex-wrap:wrap;margin:0;}",
      ".cipx-rev-tiles{display:flex;gap:8px;flex-wrap:wrap;margin:0;}",
      // tile contents centered (Sam, 2026-07-20)
      ".cipx-rev-tile{display:flex;flex-direction:column;gap:1px;align-items:center;justify-content:center;text-align:center;font-family:inherit;background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:7px 16px;cursor:pointer;min-width:82px;}",
      ".cipx-rev-tile:hover{border-color:var(--cipx-accent);}.cipx-rev-tile[aria-pressed=\"true\"]{border-color:var(--cipx-accent);box-shadow:0 0 0 1px var(--cipx-accent);}",
      ".cipx-rev-tilen{font-size:1.15rem;font-weight:800;color:var(--cipx-text);font-variant-numeric:tabular-nums;}",
      ".cipx-rev-tilel{font-size:.72rem;font-weight:600;color:var(--cipx-muted);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}",
      // forward-looking destination tile: the eventual COCI sync (non-functional preview)
      ".cipx-rev-tile-future{border-style:dashed;background:var(--cipx-surface-sub);cursor:default;}",
      ".cipx-rev-tile-future:hover{border-color:var(--cipx-border-strong);}",
      ".cipx-rev-tile-future .cipx-rev-tilen{color:var(--cipx-muted);}",
      ".cipx-rev-tilesoon{font-size:.55rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cipx-accent);background:var(--cipx-accent-soft);border-radius:6px;padding:1px 6px;margin-top:3px;white-space:nowrap;}",
      // Review = amber/warn (visible), not muted — Sam: the old muted count was invisible.
      ".cipx-rev-tile-warn .cipx-rev-tilen{color:var(--cipx-warn-fg);}.cipx-rev-tile-ok .cipx-rev-tilen{color:var(--cipx-ok-fg);}.cipx-rev-tile-suggest .cipx-rev-tilen{color:var(--cipx-accent);}",
      ".cipx-rev-progline{font-size:.8rem;color:var(--cipx-muted);font-weight:600;margin:2px 2px 8px;}",
      ".cipx-rev-peercount{color:var(--cipx-ok-fg);cursor:help;}",
      // Phase-A baseline: statewide summary + the college-overview status boxes (before a department is picked)
      ".cipx-rev-syshost:empty{display:none;}",
      ".cipx-rev-sysbaseline{font-size:.84rem;color:var(--cipx-text-soft);background:var(--cipx-surface);border:1px solid var(--cipx-border);border-radius:10px;padding:9px 13px;margin:0 0 12px;line-height:1.5;}",
      ".cipx-rev-sysbaseline b{color:var(--cipx-text);font-variant-numeric:tabular-nums;}",
      ".cipx-rev-sysnote{color:var(--cipx-muted);}",
      ".cipx-rev-overviewhost:empty{display:none;}",
      ".cipx-rev-ovlead{font-size:.9rem;font-weight:700;color:var(--cipx-text);margin:6px 2px 8px;}",
      ".cipx-rev-ovtiles{margin:0 0 8px;}",
      ".cipx-rev-tile-static{cursor:default;}.cipx-rev-tile-static:hover{border-color:var(--cipx-border-strong);}",
      ".cipx-rev-ovnote{font-size:.8rem;color:var(--cipx-muted);line-height:1.5;margin:2px 2px 4px;max-width:60rem;}",
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
      // a subtle field behind the rows so the WHITE gutter lines pop (Sam) — reproducing the prototype
      ".cipx-rev-list{display:flex;flex-direction:column;background:var(--cipx-rev-field);border:1px solid var(--cipx-border);border-radius:10px;}",
      // distinctive white gutter between rows so each brown note brackets with the course ABOVE it (Sam, 2026-07-20)
      ".cipx-rev-item{border-bottom:2px solid var(--cipx-row-sep);}.cipx-rev-conf{background:var(--cipx-ok-bg);}",
      ".cipx-rev-item:last-child{border-bottom:0;}",
      // an expanded course reads as ONE package: accent spine ties row → detail, framed top + tint wall it off
      ".cipx-rev-item-open{background:var(--cipx-surface-sub);border-top:1.5px solid var(--cipx-border-strong);box-shadow:inset 3px 0 0 var(--cipx-accent);}",
      ".cipx-rev-item-open.cipx-rev-conf{background:var(--cipx-ok-bg);}",
      ".cipx-rev-item-open .cipx-rev-row:hover{background:var(--cipx-surface-sub);}",
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
      // bigger hit-target so aiming for ▾ (change) doesn't land on the box body (= confirm) — CfC F8.
      // Full chip height (align-self:stretch) + roomy padding, NO negative margins (those let the ▾
      // overflow the chip and a click could resolve to the body → accept — Sam's ▾-OKs-the-CIP bug).
      ".cipx-rev-chipchg{align-self:stretch;display:inline-flex;align-items:center;font-size:.72rem;color:var(--cipx-muted);cursor:pointer;padding:0 8px;border-radius:5px;line-height:1;}",
      ".cipx-rev-chipchg:hover{color:var(--cipx-accent);background:var(--cipx-accent-soft);}",
      ".cipx-rev-chiprm{align-self:center;font-size:.95rem;color:var(--cipx-muted);cursor:pointer;padding:0 4px;border-radius:5px;line-height:1;}",
      ".cipx-rev-chiprm:hover{color:var(--cipx-bad-stripe);background:var(--cipx-bad-bg);}",
      ".cipx-rev-chiprm:focus-visible,.cipx-rev-addcip:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:2px;}",
      // multi-CIP stack: the primary box + a "+" (add) beside it, additional confirmed CIPs stacked under.
      ".cipx-rev-tocip-stack{align-items:start;}",
      ".cipx-rev-cipstack{display:flex;flex-direction:column;gap:5px;min-width:0;}",
      ".cipx-rev-primline{display:flex;align-items:center;gap:6px;min-width:0;}",
      ".cipx-rev-primline .cipx-rev-chip{flex:1 1 auto;width:auto;min-width:0;}",
      ".cipx-rev-extraline{display:flex;min-width:0;}",
      ".cipx-rev-extraline .cipx-rev-chip{flex:1 1 auto;width:100%;min-width:0;border-color:var(--cipx-accent);background:var(--cipx-accent-soft);}",
      ".cipx-rev-extraline .cipx-rev-chip .cipx-code{color:var(--cipx-accent);}",
      ".cipx-rev-addcip{flex:none;width:28px;height:28px;border-radius:8px;border:1px dashed var(--cipx-border-strong);background:var(--cipx-surface);color:var(--cipx-accent);font-size:1.15rem;line-height:1;cursor:pointer;display:grid;place-items:center;font-family:inherit;}",
      ".cipx-rev-addcip:hover{border-style:solid;border-color:var(--cipx-accent);background:var(--cipx-accent-soft);}",
      ".cipx-rev-addcip-off{opacity:.35;border-style:dotted;color:var(--cipx-muted);cursor:default;pointer-events:none;}",
      ".cipx-rev-credit{align-self:center;font-size:.64rem;font-weight:700;color:var(--cipx-muted);background:var(--cipx-surface-sub);border:1px solid var(--cipx-border);border-radius:6px;padding:2px 7px;white-space:nowrap;cursor:help;}",
      ".cipx-rev-credit-cdcp{color:var(--cipx-cte-fg);background:var(--cipx-cte-bg);border-color:var(--cipx-cte-stripe);}",
      ".cipx-rev-cte{display:inline-flex;gap:3px;align-items:center;margin-left:5px;}",
      ".cipx-rev-cte-unset{background:var(--cipx-warn-bg);border:1px solid var(--cipx-warn-stripe);border-radius:8px;padding:1px 4px;}",
      ".cipx-rev-ctelbl{font-size:.6rem;font-weight:800;color:var(--cipx-warn-fg);text-transform:uppercase;letter-spacing:.03em;}",
      ".cipx-rev-ctebtn{font-family:inherit;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:var(--cipx-text-soft);background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:6px;padding:2px 7px;cursor:pointer;}",
      ".cipx-rev-ctebtn-on{color:#fff;background:var(--cipx-accent);border-color:var(--cipx-accent);}",
      ".cipx-rev-ctebtn:focus-visible{outline:2px solid var(--cipx-focus);outline-offset:1px;}",
      // inline flow host (picker / prompt / apply panel) under the box stack
      ".cipx-rev-inline{margin-top:7px;}",
      ".cipx-rev-addpick{background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:10px;padding:9px 10px;box-shadow:0 8px 22px rgba(0,0,0,.14);}",
      ".cipx-rev-addhint{font-size:.72rem;font-weight:600;color:var(--cipx-muted);margin-bottom:6px;line-height:1.4;}",
      ".cipx-rev-anchorrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}",
      ".cipx-rev-anchorrow .cipx-rev-chip{flex:1 1 auto;min-width:0;}",
      ".cipx-rev-anchorok{font-family:inherit;font-size:.8rem;font-weight:700;color:#fff;background:var(--cipx-ok-stripe);border:0;border-radius:8px;padding:7px 13px;cursor:pointer;white-space:nowrap;}.cipx.cipx-theme-dark .cipx-rev-anchorok{color:#0e1a2b;}",
      // an applied-not-yet-validated row: a subtle accent rail so it reads as 'has codes, still needs a look'
      ".cipx-rev-item-applied{border-left:3px solid var(--cipx-accent-soft);}",
      ".cipx-rev-whyline-applied{color:var(--cipx-accent);}",
      ".cipx-rev-addprompt{display:flex;align-items:center;gap:9px;flex-wrap:wrap;background:var(--cipx-accent-soft);border:1px solid var(--cipx-border);border-left:3px solid var(--cipx-accent);border-radius:10px;padding:9px 12px;font-size:.83rem;color:var(--cipx-text-soft);}",
      ".cipx-rev-addpaw{font-size:1rem;}",
      ".cipx-rev-morebtn,.cipx-rev-donebtn{font-family:inherit;font-size:.78rem;font-weight:600;color:var(--cipx-link);background:none;border:0;padding:4px 2px;cursor:pointer;text-decoration:underline;}",
      ".cipx-rev-applybtn{font-family:inherit;font-size:.78rem;font-weight:700;color:#fff;background:var(--cipx-accent);border:0;border-radius:8px;padding:7px 13px;cursor:pointer;margin-left:auto;}.cipx.cipx-theme-dark .cipx-rev-applybtn{color:#0e1a2b;}",
      ".cipx-rev-apply{background:var(--cipx-surface);border:1px solid var(--cipx-accent);border-radius:12px;padding:13px 15px;box-shadow:0 10px 26px rgba(0,0,0,.16);}",
      ".cipx-rev-applyh{font-weight:700;font-size:.95rem;color:var(--cipx-text);}",
      ".cipx-rev-applylead{font-size:.82rem;color:var(--cipx-text-soft);margin:3px 0 6px;line-height:1.5;}",
      ".cipx-rev-applychips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px;}",
      ".cipx-rev-applychip{font-size:.72rem;font-weight:700;font-variant-numeric:tabular-nums;background:var(--cipx-accent-soft);color:var(--cipx-accent);border:1px solid var(--cipx-accent);border-radius:20px;padding:3px 10px;}",
      ".cipx-rev-applytools{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 6px;font-size:.78rem;color:var(--cipx-muted);}",
      ".cipx-rev-applylink{font-family:inherit;font-size:.78rem;font-weight:600;color:var(--cipx-link);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;}",
      ".cipx-rev-applylist{display:flex;flex-direction:column;gap:1px;max-height:250px;overflow:auto;border:1px solid var(--cipx-border);border-radius:9px;padding:5px;}",
      ".cipx-rev-applycc{display:flex;align-items:center;gap:11px;padding:7px 8px;border-radius:7px;cursor:pointer;}",
      ".cipx-rev-applycc:hover{background:var(--cipx-surface-sub);}",
      ".cipx-rev-applycc input{width:16px;height:16px;accent-color:var(--cipx-accent);cursor:pointer;flex:none;}",
      ".cipx-rev-applynm{font-size:.88rem;color:var(--cipx-text);min-width:0;}.cipx-rev-applynm b{font-weight:700;}",
      ".cipx-rev-applyhave{margin-left:auto;font-size:.68rem;font-weight:700;color:var(--cipx-muted);white-space:nowrap;}",
      ".cipx-rev-applyempty{padding:9px;font-size:.82rem;color:var(--cipx-muted);}",
      ".cipx-rev-applyfoot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;}",
      ".cipx-rev-applygo{font-family:inherit;font-size:.82rem;font-weight:700;color:#fff;background:var(--cipx-accent);border:0;border-radius:8px;padding:8px 15px;cursor:pointer;}.cipx.cipx-theme-dark .cipx-rev-applygo{color:#0e1a2b;}",
      ".cipx-rev-applycancel{font-family:inherit;font-size:.82rem;font-weight:600;color:var(--cipx-text-soft);background:var(--cipx-surface);border:1px solid var(--cipx-border-strong);border-radius:8px;padding:8px 14px;cursor:pointer;}.cipx-rev-applycancel:hover{border-color:var(--cipx-accent);color:var(--cipx-accent);}",
      ".cipx-rev-applynote{font-size:.74rem;color:var(--cipx-muted);margin-left:auto;max-width:32rem;line-height:1.4;}",
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
      ".cipx-rev-detactions{display:flex;gap:12px 16px;flex-wrap:wrap;align-items:center;margin-top:12px;}",
      ".cipx-rev-actutils{display:flex;gap:16px;align-items:center;flex-wrap:wrap;}",
      ".cipx-rev-actdecide{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-left:auto;}",
      ".cipx-rev-searchwrap:not(:empty){margin-top:10px;}",
      ".cipx-rev-confirm{font-family:inherit;font-size:.82rem;font-weight:700;color:#fff;background:var(--cipx-accent);border:0;border-radius:8px;padding:8px 15px;cursor:pointer;}.cipx.cipx-theme-dark .cipx-rev-confirm{color:#0e1a2b;}",
      ".cipx-rev-keep{font-family:inherit;font-size:.82rem;font-weight:600;color:var(--cipx-text);background:var(--cipx-surface);border:1.5px solid var(--cipx-border-strong);border-radius:8px;padding:6.5px 14px;cursor:pointer;}",
      ".cipx-rev-keep:hover{border-color:var(--cipx-accent);color:var(--cipx-accent);}",
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
        ".cipx-cipfilters{flex:1 1 100%;gap:5px;min-width:0;}.cipx-fsel-cip,.cipx-fsel-cip6{max-width:100%;flex:1 1 100%;min-width:0;width:100%;}.cipx-cipfilters-lbl{flex:1 1 100%;}" +
        ".cipx-count{margin-top:11px;}.cipx-csv{margin-left:0;}" +
        ".cipx-collegebar{padding:10px 12px;}.cipx-college-sel{max-width:100%;flex:1 1 100%;}.cipx-college-hint{flex:1 1 100%;}" +
        ".cipx-sug-crow{grid-template-columns:13px 56px 1fr auto;gap:9px;}" +
        // browse row on phone: title gets the full remaining width (wraps), badges drop to their own line
        ".cipx-row{grid-template-columns:13px 56px minmax(0,1fr);gap:6px 9px;}.cipx-row .cipx-tags{grid-column:2/-1;justify-content:flex-start;}" +
        ".cipx-detail,.cipx-sug-why,.cipx-cand-card .cipx-detail{padding-left:14px;}" +
        ".cipx-cbwrap,.cipx-fitta{max-width:100%;}" +
        ".cipx-cand-row{grid-template-columns:13px 56px 1fr;gap:9px;}.cipx-cand-rel{grid-column:2/-1;margin-top:2px;}.cipx-meterwrap{max-width:none;min-width:0;}" +
        ".cipx-vbody{padding:12px 13px;}.cipx-vpill{font-size:.68rem;padding:3px 8px;}.cipx-vtext{font-size:.92rem;}.cipx-vmeterrow{flex-wrap:wrap;gap:6px;}.cipx-vmeterlbl{white-space:normal;}" +
        ".cipx-modebar{width:100%;}.cipx-modetab{flex:1;padding:8px 6px;font-size:.8rem;text-align:center;}" +
        ".cipx-scopebar{flex-wrap:wrap;}.cipx-scopetab{flex:1 1 40%;text-align:center;}.cipx-prog-search{flex:1 1 100%;max-width:100%;}.cipx-prog-revsel{flex:1 1 100%;max-width:100%;width:100%;min-width:0;}.cipx-prog-cip{min-width:0;}.cipx-prog-cipt{overflow:hidden;text-overflow:ellipsis;}" +
        ".cipx-rec-row{grid-template-columns:13px 58px 1fr;gap:8px;}.cipx-rec-meta{grid-column:2/-1;flex-direction:row;align-items:center;min-width:0;margin-top:4px;}.cipx-rec-row-flat{grid-template-columns:13px 58px 1fr;}" +
        ".cipx-rec-card .cipx-detail{padding-left:14px;}" +
        ".cipx-rev-deptinline{flex:1 1 100%;}.cipx-rev-deptsel{max-width:100%;flex:1 1 auto;}" +
        // phone: all count tiles share ONE row (equal widths, no wrap) + drop the COCI "In Development"
        // badge so it's the same 2-line height as the others (Sam, 2026-07-20 — save real estate).
        ".cipx-rev-tiles{gap:5px;flex:1 1 100%;flex-wrap:nowrap;}.cipx-rev-tile{flex:1 1 0;min-width:0;padding:6px 4px;}" +
        ".cipx-rev-tilen{font-size:1rem;}.cipx-rev-tilel{font-size:.6rem;letter-spacing:0;}.cipx-rev-tilesoon{display:none;}" +
        // Expand + Confirm share ONE row (Sam, 2026-07-20): a nowrap flex — Expand keeps its natural
        // width, the bulk button(s) flex to fill (shortened label helps it fit).
        ".cipx-rev-actions{flex:1 1 100%;flex-wrap:nowrap;gap:6px;margin:4px 0 0;}.cipx-rev-actions .cipx-rev-expand{flex:0 0 auto;}.cipx-rev-bulk{flex:1 1 auto;min-width:0;font-size:.74rem;padding:8px 8px;}" +
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
    try { localStorage.removeItem("cipx_college"); } catch (e) {}   // F6: drop a stale key from an older build (college is intentionally ephemeral)
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
    _setScope: function (s) { st.scope = (s === "programs") ? "programs" : "courses"; },
    _setPrograms: function (p) { PROGRAMS = p; },
    _setProgCollege: function (i) { st.progCollege = i; },
    _progNeedsRevision: progNeedsRevision,
    _passes: passes, _filtered: filtered, _score: scoreAgainst, _courseScore: scoreTokensVs, _courseToks: courseToks,
    _recommend: computeRecommend, _bestMatches: bestMatchCourses,
    _parseSubject: parseSubject, _reviewRows: function (courses) { return (courses || []).map(reviewRowOf); },
    _reviewRowOf: reviewRowOf,
    _setConsensus: function (d) { if (d && d.titles) { CONSENSUS = d.titles; CONSENSUS_COLLEGES = d.colleges || []; CONSENSUS_SUBJECTS = d.subjects || []; } },
    _setStatusCounts: function (d) { STATUS_COUNTS = d; },
    _consensus: consensusFor, _consensusPick: consensusPick, _consensusKey: consensusKey, _subjMatch: subjMatch,
    _bestCipForTop: bestCipForTop, _college: function () { return st.college; },
    _effectiveSug: effectiveSug,
  };
})();
