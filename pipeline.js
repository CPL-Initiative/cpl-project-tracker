/*
 * pipeline.js — Pipeline tab.
 *
 * Renders four sections under the "Pipeline" tab:
 *   1. Phase roadmap (static; from CLAUDE.md §11)
 *   2. M-ID lifecycle (Mermaid; counts injected from kb/row_audit/latest.json)
 *   3. Auditor cleanup-receipt invariants (counts injected, per-tag)
 *   4. The re-mint workflow (Phase 1e, static Mermaid diagram)
 *
 * Mermaid is lazy-loaded from CDN on first activation of the tab — keeps the
 * dashboard's initial load free of the ~3 MB library cost when nobody visits
 * this tab. To swap to a local copy later, vendor mermaid.min.js into the
 * repo and change MERMAID_SRC below (same convention as docx.min.js).
 * ⚠️ The version is EXACT: a floating "@10" let the CDN change what painted.
 *
 * First Light (UI pass S415, 2026-10-18): the tab's CSS lives here, injected
 * once (ensureCss), so it covers both HTMLs without a Rule-4 mirror, and it
 * uses var(--token) only. Mermaid paints SVG attributes, which cannot resolve
 * var(), so mermaidTheme() reads the live token values at render time and the
 * diagrams render again on cpl:themechange (cpl_theme.js) — before this, dark
 * COBI kept a light diagram with white label boxes.
 *
 * Source of truth for counts:
 *   kb/row_audit/latest.json — committed by the auditor whenever it's re-run
 *   (manual: `python3 kb/_row_audit.py`; CI: Phase 1e apply workflow).
 *   The simplified daily-dashboard.yml does not re-run the auditor, so this
 *   tab shows the counts AS OF the last auditor commit. The "last updated"
 *   stamp tells the viewer how fresh the data is.
 */
(function () {
  "use strict";

  var MERMAID_SRC = "https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist/mermaid.min.js";

  // ─── Phase roadmap (mirrors CLAUDE.md §11) ────────────────────────────────
  // status ∈ done | active | queued | parked. Edit in lockstep with the
  // roadmap table. The card shows the status as a word; no glyph.
  var ROADMAP = [
    { id: "1a",     title: "Trust-Card auditor",                         status: "done",   when: "2026-05-23" },
    { id: "1b",     title: "Cluster aggregation + UCL chip + cron",      status: "done",   when: "2026-05-23" },
    { id: "1c",     title: "Audit rules (9 of 10)",                      status: "active", when: "" },
    { id: "1d",     title: "Rename → Common Course Reference",           status: "done",   when: "2026-05-23" },
    { id: "1e",     title: "SUBJ4 canonicalization re-mint",             status: "done",   when: "2026-05-23" },
    { id: "CID-rt", title: "c-id.net articulation router (statewide)",   status: "done",   when: "2026-06-11" },
    { id: "lex-hx", title: "Homonym-safe discipline lexicon",            status: "done",   when: "2026-06-11" },
    { id: "desc",   title: "Description-evidence worklist lane",         status: "done",   when: "2026-06-11" },
    { id: "1e-5d",  title: "M-ID → MID / C-ID → CID rename (cosmetic)",  status: "queued", when: "" },
    { id: "2",      title: "Articulations by Unified Course",            status: "parked", when: "" },
    { id: "3",      title: "EACR interactive re-pivot",                  status: "parked", when: "" },
    { id: "4",      title: "SLO ingestion (unlocks MC scoring)",         status: "parked", when: "" },
    { id: "5",      title: "CTE classifier (CIDx lane)",                 status: "parked", when: "" },
    { id: "6",      title: "CIDx submission automation",                 status: "parked", when: "" },
    { id: "7",      title: "MID → CID substitution",                     status: "parked", when: "" },
  ];
  var STATUS_WORD = { done: "Done", active: "In progress", queued: "Queued", parked: "Parked" };

  // ─── First Light CSS — tokens only (Rule 4 needs no mirror for JS) ────────
  var CSS = [
    "#tab-pipeline h2 { margin-bottom:4px; }",
    "#tab-pipeline .pl-sub { font-weight:400; color:var(--text-muted); font-size:1rem; }",
    "#tab-pipeline .pl-intro { color:var(--text-muted); margin:0 0 18px; max-width:var(--cpl-measure,none); }",
    "#tab-pipeline .pl-section { margin:24px 0 32px; }",
    "#tab-pipeline .pl-section h3 { margin-bottom:4px; color:var(--text-strong); font-size:1.1rem; }",
    "#tab-pipeline .pl-section-sub { color:var(--text-muted); font-size:.88rem; margin:0 0 12px; max-width:var(--cpl-measure,none); }",
    "#tab-pipeline .pl-card { background:var(--surface-opaque); border:1px solid var(--border); border-radius:10px; padding:18px 20px; }",
    "#tab-pipeline .pl-mermaid { overflow:auto; }",
    "#tab-pipeline .pl-mermaid:focus-visible { outline:2px solid var(--focus-ring); outline-offset:2px; }",
    "#tab-pipeline .pl-mermaid svg { display:block; margin:0 auto; max-width:100%; height:auto; }",
    "#tab-pipeline .pl-status { color:var(--text-muted); font-size:.78rem; margin-top:6px; }",
    "#tab-pipeline .pl-receipt { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(260px,100%), 1fr)); gap:12px; margin-top:10px; }",
    "#tab-pipeline .pl-stat { background:var(--surface-opaque); border:1px solid var(--border); border-radius:8px; padding:14px 16px; }",
    "#tab-pipeline .pl-stat-label { font-size:.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px; }",
    "#tab-pipeline .pl-stat-value { font-size:1.6rem; font-weight:700; color:var(--text-strong); margin-top:4px; font-variant-numeric:tabular-nums; }",
    "#tab-pipeline .pl-stat-delta { font-size:.78rem; color:var(--text-muted); margin-top:2px; }",
    // Above its target is the one state here a reader acts on: the receipt
    // invariant has to fall to zero. Muted crimson, and the word says it too.
    "#tab-pipeline .pl-stat.above .pl-stat-value { color:var(--red-alert); }",
    "#tab-pipeline .pl-roadmap { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(140px,100%), 1fr)); gap:10px; margin-top:10px; }",
    "#tab-pipeline .pl-phase { background:var(--surface-opaque); border:1px solid var(--border); border-left:4px solid var(--border-strong); border-radius:8px; padding:10px 12px; font-size:.82rem; }",
    "#tab-pipeline .pl-phase-id { font-weight:700; color:var(--text-strong); }",
    "#tab-pipeline .pl-phase-title { color:var(--text-body); margin:4px 0; }",
    "#tab-pipeline .pl-phase-status { font-size:.75rem; color:var(--text-muted); }",
    "#tab-pipeline .pl-phase.active { border-left-color:var(--mustard-text); }",
    "#tab-pipeline .pl-phase.active .pl-phase-status { color:var(--text-strong); font-weight:600; }",
    "#tab-pipeline .pl-phase.parked .pl-phase-title { color:var(--text-muted); }",
    "#tab-pipeline .pl-loading { color:var(--text-muted); font-style:italic; padding:20px; text-align:center; }",
    "#tab-pipeline .pl-footer { margin-top:24px; color:var(--text-muted); font-size:.78rem; text-align:center; }",
    "#tab-pipeline .pl-footer a { display:inline-block; min-height:24px; line-height:24px; color:var(--accent-link); text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
    "#tab-pipeline .pl-footer a:hover { text-decoration-thickness:2px; }",
  ].join("\n");

  function ensureCss() {
    if (document.getElementById("pl-css")) return;
    var s = document.createElement("style");
    s.id = "pl-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  ensureCss();

  // ─── helpers ──────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function fmt(n) {
    if (typeof n !== "number") return String(n);
    return n.toLocaleString();
  }
  // "2026-10-18T11:15:51+00:00" → "2026-10-18, 11:15 UTC"; anything else as is.
  function fmtWhen(iso) {
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z|\+00:00)$/.exec(iso || "");
    return m ? m[1] + ", " + m[2] + " UTC" : (iso || "unknown");
  }
  function token(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function effectiveTheme() {
    return window.CPL_THEME && window.CPL_THEME.effective ? window.CPL_THEME.effective() : "light";
  }

  // Mermaid's theme drawn from the live tokens. Only the keys whose token
  // resolves are passed, so Mermaid's own default fills any gap rather than
  // a hand-picked hex.
  function mermaidTheme() {
    var pairs = {
      background: "--surface-opaque",
      mainBkg: "--surface-subtle",
      primaryColor: "--surface-subtle",
      secondaryColor: "--surface-subtle",
      tertiaryColor: "--surface-opaque",
      primaryTextColor: "--text-strong",
      nodeTextColor: "--text-strong",
      textColor: "--text-body",
      primaryBorderColor: "--text-faint",
      nodeBorder: "--text-faint",
      lineColor: "--text-muted",
      edgeLabelBackground: "--surface-opaque",
    };
    var vars = { darkMode: effectiveTheme() === "dark", fontSize: "15px" };
    Object.keys(pairs).forEach(function (k) {
      var v = token(pairs[k]);
      if (v) vars[k] = v;
    });
    var pane = $("tab-pipeline");
    var family = pane ? getComputedStyle(pane).fontFamily : "";
    if (family) vars.fontFamily = family;
    return vars;
  }
  // The diagrams' one emphasis: the node a stage ends on, drawn heavier.
  function endpointClassDef() {
    var ink = token("--text-strong");
    return "  classDef endpoint stroke-width:2px" + (ink ? ",stroke:" + ink : "");
  }

  // Lazy-load Mermaid once; returns a Promise that resolves to the mermaid global.
  var mermaidPromise = null;
  function loadMermaid() {
    if (mermaidPromise) return mermaidPromise;
    mermaidPromise = new Promise(function (resolve, reject) {
      if (window.mermaid) { resolve(window.mermaid); return; }
      var s = document.createElement("script");
      s.src = MERMAID_SRC;
      s.onload = function () { resolve(window.mermaid); };
      s.onerror = function () { reject(new Error("the diagram library did not load")); };
      document.head.appendChild(s);
    });
    return mermaidPromise;
  }

  // ─── audit data fetch ─────────────────────────────────────────────────────
  function fetchAudit() {
    return fetch("kb/row_audit/latest.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // ─── Section 1: roadmap ───────────────────────────────────────────────────
  function renderRoadmap() {
    var root = $("pl-roadmap");
    if (!root) return;
    root.classList.remove("pl-loading");
    root.innerHTML = "";
    ROADMAP.forEach(function (p) {
      var card = el("div", { class: "pl-phase " + p.status });
      card.appendChild(el("div", { class: "pl-phase-id" }, ["Phase " + p.id]));
      card.appendChild(el("div", { class: "pl-phase-title" }, [p.title]));
      var word = STATUS_WORD[p.status] || p.status;
      card.appendChild(el("div", { class: "pl-phase-status" }, [p.when ? word + " " + p.when : word]));
      root.appendChild(card);
    });
  }

  // ─── Section 2: M-ID lifecycle (Mermaid + injected counts) ────────────────
  function buildLifecycleDiagram(counts) {
    // Counts derived from kb/row_audit/latest.json. Most stages don't have a
    // single-tag source today, so the diagram captures what we CAN measure now.
    // Top to bottom: left to right shrank the labels to a few pixels on a
    // phone and to about 9px on a desktop.
    var seedUntouched = counts.seed_untouched_discipline || 0;
    var blank         = counts.blank_discipline || 0;
    var officialIds   = counts._official || 0; // C-ID + CCN-ID anchors
    return [
      "flowchart TD",
      "  accTitle: M-ID lifecycle",
      "  accDescr: A Phase B seed is reviewed by a curator, becomes MC-ready, and is submitted to ASCCC. An approved course is re-keyed to its official ID; a rejected one returns to curator review. A seed with no discipline waits in the blank-discipline backlog first.",
      "  S0[\"Phase B seed<br/><b>" + fmt(seedUntouched) + "</b> never reviewed\"]",
      "  S6[\"Blank-discipline backlog<br/><b>" + fmt(blank) + "</b> rows\"]",
      "  S1[\"Curator-Verified<br/>(in CCR tab)\"]",
      "  S2[\"MC-ready<br/>SLOs + content outline<br/><i>0 today, Phase 4</i>\"]",
      "  S3[\"Submitted to ASCCC<br/><i>0, Phase 6</i>\"]",
      "  S4{\"Approved as<br/>CID / CIDx?\"}",
      "  S5[\"Re-keyed to official ID<br/><b>" + fmt(officialIds) + "</b> live anchors\"]",
      "  S0 --> S1",
      "  S0 -. needs discipline first .-> S6",
      "  S6 -. curator review .-> S1",
      "  S1 --> S2",
      "  S2 --> S3",
      "  S3 --> S4",
      "  S4 -- yes --> S5",
      "  S4 -- rejected --> S1",
      endpointClassDef(),
      "  class S5 endpoint",
    ].join("\n");
  }

  // ─── Section 4: Phase 1e workflow (static) ────────────────────────────────
  function buildPhase1eDiagram() {
    return [
      "flowchart TD",
      "  accTitle: How the Phase 1e re-mint landed",
      "  accDescr: Curators set canonical SUBJ4 codes, which a sync writes to a file. A dry run with five validation gates reports, and when ready the apply workflow changes six kb files and the live curation rows in one commit. The cleanup receipt read subject collisions falling from 7,203 to 0.",
      "  A[\"Canonical SUBJ4 curator tab<br/>(per-discipline 4-letter codes)\"]",
      "  B[(\"Supabase kb_curation<br/>_CANON_SUBJ4 namespace\")]",
      "  C[\"phase-1e-sync.yml<br/>manual dispatch\"]",
      "  D[\"kb/discipline_canonical_subj4.json\"]",
      "  E{\"Dry-run<br/>5 validation gates\"}",
      "  F[\"kb/subj4_dryrun/<br/>alias_map · collisions · blocked\"]",
      "  G[\"phase-1e-apply.yml<br/>manual dispatch · concurrency: daily-dashboard\"]",
      "  H[\"_subj4_apply.py<br/>mutates 6 kb files\"]",
      "  I[\"_subj4_apply_supabase.py<br/>renames live kb_curation rows\"]",
      "  J[\"Apply commit on main<br/><b>5406055</b>\"]",
      "  K((\"Cleanup receipt<br/>subject_collision_signal<br/><b>7,203 to 0</b>\"))",
      "  A -- writes --> B",
      "  B -- pulls --> C",
      "  C -- syncs --> D",
      "  D --> E",
      "  E -- READY --> G",
      "  E -. report .-> F",
      "  G --> H",
      "  G --> I",
      "  H --> J",
      "  I --> J",
      "  J --> K",
      endpointClassDef(),
      "  class K endpoint",
    ].join("\n");
  }

  function renderMermaidInto(elNode, sourceText) {
    if (!elNode) return Promise.resolve();
    return loadMermaid().then(function (mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: mermaidTheme(),
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
      });
      var diagId = "mmd-" + Math.random().toString(36).slice(2, 10);
      return mermaid.render(diagId, sourceText).then(function (out) {
        elNode.classList.remove("pl-loading");
        elNode.innerHTML = out.svg;
        if (out.bindFunctions) out.bindFunctions(elNode);
      });
    }).catch(function (err) {
      elNode.classList.remove("pl-loading");
      elNode.textContent = "The diagram did not render: " + err.message + ". Reload the tab to try again.";
    });
  }

  // ─── Section 3: auditor cleanup-receipt card ──────────────────────────────
  // The "cleanup-receipt invariants" are the rules that should be ZERO at the
  // end of a re-mint cycle. They get top billing. The other tag counts are
  // shown as supporting context.
  var CLEANUP_RECEIPT_RULES = [
    { tag: "subject_collision_signal", label: "Subject collision (Phase 1e re-mint target)", target: 0 },
    { tag: "mid_id_off_scheme",        label: "MID off-scheme",                     target: 0, tolerate_blank_discipline: true },
  ];
  // Labels match the Unified Courses tab's triage filter (unified_courses.js,
  // TRIAGE_PRED), so a count read here names the filter that lists its rows.
  // Every tag that filter names is here; tests/pipeline_ui.test.js holds the two
  // lists together.
  var SUPPORTING_RULES = [
    { tag: "blank_discipline",                    label: "Blank discipline (curator backlog)" },
    { tag: "blank_description",                   label: "Blank description" },
    { tag: "seed_untouched_discipline",           label: "Seed untouched (never reviewed)" },
    { tag: "top_discipline_disagreement",         label: "TOP mismatch" },
    { tag: "discipline_title_mismatch",           label: "Title mismatch (likely misassigned)" },
    { tag: "description_discipline_disagreement", label: "Description mismatch" },
    { tag: "generic_title_concrete_discipline",   label: "Generic title (can't justify discipline)" },
    { tag: "subject_discipline_outlier",          label: "Subject-code outlier (likely mis-mint)" },
    { tag: "unit_anomaly",                        label: "Unit anomaly (high member-unit variance)" },
    { tag: "member_top_divergence",               label: "Cross-discipline over-merge (member TOP)" },
    { tag: "merge_into_orphan",                   label: "Orphan merge target (dangling pointer)" },
  ];

  function countTags(rows) {
    var counts = {};
    var totalFlagged = 0;
    (rows || []).forEach(function (r) {
      (r.tags || []).forEach(function (t) {
        counts[t] = (counts[t] || 0) + 1;
      });
      if ((r.tags || []).length) totalFlagged++;
    });
    counts._total = (rows || []).length;
    counts._totalFlagged = totalFlagged;
    return counts;
  }

  // Special accounting: count mid_id_off_scheme rows that also have
  // blank_discipline as "unfixable residue" (canonicalization can't pick a
  // SUBJ4 without a discipline). That residue doesn't break the cleanup-
  // receipt invariant; the "fixable" subset is what matters.
  function countOffSchemeFixable(rows) {
    var fixable = 0, unfixable = 0;
    (rows || []).forEach(function (r) {
      var tags = r.tags || [];
      if (tags.indexOf("mid_id_off_scheme") < 0) return;
      if (tags.indexOf("blank_discipline") >= 0) unfixable++;
      else fixable++;
    });
    return { fixable: fixable, unfixable: unfixable };
  }

  function renderReceipt(audit) {
    var root = $("pl-receipt");
    var status = $("pl-receipt-status");
    if (!root) return;
    root.classList.remove("pl-loading");
    root.innerHTML = "";
    if (!audit) {
      var miss = el("div", { class: "pl-stat" });
      miss.appendChild(el("div", { class: "pl-stat-label" }, ["kb/row_audit/latest.json"]));
      miss.appendChild(el("div", { class: "pl-stat-value" }, ["Missing"]));
      miss.appendChild(el("div", { class: "pl-stat-delta" }, ["Commit and push the auditor output."]));
      root.appendChild(miss);
      return audit;
    }
    var counts = countTags(audit.rows || []);
    var offScheme = countOffSchemeFixable(audit.rows || []);

    // Cleanup-receipt cards (top billing)
    CLEANUP_RECEIPT_RULES.forEach(function (r) {
      var n = counts[r.tag] || 0;
      var fixable = r.tag === "mid_id_off_scheme" ? offScheme.fixable : n;
      var unfixable = r.tag === "mid_id_off_scheme" ? offScheme.unfixable : 0;
      var ok = (fixable === r.target);
      var stat = el("div", { class: "pl-stat " + (ok ? "at" : "above") });
      stat.appendChild(el("div", { class: "pl-stat-label" }, [r.label]));
      stat.appendChild(el("div", { class: "pl-stat-value" }, [fmt(fixable)]));
      var delta = (ok ? "At target " : "Above target ") + r.target;
      if (r.tag === "mid_id_off_scheme" && unfixable > 0) {
        delta += "; " + fmt(unfixable) + " more with a blank discipline " + (unfixable === 1 ? "is" : "are") + " not counted";
      }
      stat.appendChild(el("div", { class: "pl-stat-delta" }, [delta]));
      root.appendChild(stat);
    });

    // Supporting tags
    SUPPORTING_RULES.forEach(function (r) {
      var n = counts[r.tag] || 0;
      if (n === 0) return; // hide zero-count supporting rules to reduce noise
      var stat = el("div", { class: "pl-stat" });
      stat.appendChild(el("div", { class: "pl-stat-label" }, [r.label]));
      stat.appendChild(el("div", { class: "pl-stat-value" }, [fmt(n)]));
      stat.appendChild(el("div", { class: "pl-stat-delta" }, ["rows flagged"]));
      root.appendChild(stat);
    });

    // Footer with timestamp + total
    if (status) {
      status.textContent = "Last auditor run: " + fmtWhen(audit._generated_at) + " · " + fmt(counts._total) +
        " MID and cluster rows · " + fmt(counts._totalFlagged) + " with at least one flag";
    }
    return counts;
  }

  // ─── orchestrator ─────────────────────────────────────────────────────────
  var rendered = false;
  var lifecycleCounts = null;
  function renderDiagrams() {
    renderMermaidInto($("pl-lifecycle"), buildLifecycleDiagram(lifecycleCounts || {}));
    renderMermaidInto($("pl-workflow"), buildPhase1eDiagram());
  }
  function activate() {
    if (rendered) return;
    rendered = true;
    renderRoadmap();
    fetchAudit().then(function (audit) {
      var counts = renderReceipt(audit) || {};
      // Lifecycle counts: pull from latest.json; add some derived totals.
      lifecycleCounts = {
        seed_untouched_discipline: counts.seed_untouched_discipline || 0,
        blank_discipline: counts.blank_discipline || 0,
        _total: counts._total || 0,
        _official: 0, // TODO when we surface C-ID/CCN anchor count in latest.json
      };
      renderDiagrams();
      var lstatus = $("pl-lifecycle-status");
      if (lstatus && audit) {
        lstatus.textContent = "Last auditor run: " + fmtWhen(audit._generated_at);
      }
    });
  }

  // Mermaid bakes colors into the SVG, so a theme switch repaints the diagrams.
  window.addEventListener("cpl:themechange", function () {
    if (rendered && lifecycleCounts) renderDiagrams();
  });

  // Render when the tab is activated (hash navigation), or immediately if the
  // page loads with #pipeline already set.
  function maybeActivate() {
    if ((location.hash || "").replace(/^#/, "") === "pipeline") activate();
  }
  window.addEventListener("hashchange", maybeActivate);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeActivate);
  } else {
    maybeActivate();
  }
  // Also activate on tab-button click (some users click the button rather than
  // navigating by hash).
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.cpl-tab[data-tab="pipeline"]').forEach(function (b) {
      b.addEventListener("click", activate);
    });
  });

  window.CPL_PIPELINE = {
    activate: activate,
    SUPPORTING_RULES: SUPPORTING_RULES,
    MERMAID_SRC: MERMAID_SRC,
    mermaidTheme: mermaidTheme,
    buildLifecycleDiagram: buildLifecycleDiagram,
    buildPhase1eDiagram: buildPhase1eDiagram,
  };
})();
