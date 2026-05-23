/*
 * pipeline.js — Pipeline tab.
 *
 * Renders three Mermaid diagrams + a live-counts card under the "Pipeline" tab:
 *   1. Phase roadmap (static; from CLAUDE.md §11)
 *   2. M-ID lifecycle (counts injected from kb/row_audit/latest.json)
 *   3. Auditor cleanup-receipt invariants (counts injected, per-tag)
 *   4. Most-recent-re-mint workflow (Phase 1e static workflow diagram)
 *
 * Mermaid is lazy-loaded from CDN on first activation of the tab — keeps the
 * dashboard's initial load free of the ~3 MB library cost when nobody visits
 * this tab. To swap to a local copy later, vendor mermaid.min.js into the
 * repo and change MERMAID_SRC below (same convention as docx.min.js).
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

  var MERMAID_SRC = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";

  // ─── Phase roadmap (mirrors CLAUDE.md §11) ────────────────────────────────
  // status ∈ done | active | parked. Edit in lockstep with the roadmap table.
  var ROADMAP = [
    { id: "1a",     title: "Trust-Card auditor",                         status: "done",   when: "2026-05-23" },
    { id: "1b",     title: "Cluster aggregation + UCL chip + cron",      status: "done",   when: "2026-05-23" },
    { id: "1c",     title: "Audit rules (6 of 9)",                       status: "done",   when: "2026-05-23" },
    { id: "1d",     title: "Rename → Common Course Reference",           status: "done",   when: "2026-05-23" },
    { id: "1e",     title: "SUBJ4 canonicalization re-mint",             status: "done",   when: "2026-05-23" },
    { id: "1e-5d",  title: "M-ID → MID / C-ID → CID rename (cosmetic)",  status: "active", when: "queued" },
    { id: "2",      title: "Articulations by Unified Course",            status: "parked", when: "" },
    { id: "3",      title: "EACR interactive re-pivot",                  status: "parked", when: "" },
    { id: "4",      title: "SLO ingestion (unlocks MC scoring)",         status: "parked", when: "" },
    { id: "5",      title: "CTE classifier (CIDx lane)",                 status: "parked", when: "" },
    { id: "6",      title: "CIDx submission automation",                 status: "parked", when: "" },
    { id: "7",      title: "M-ID → CID substitution",                    status: "parked", when: "" },
  ];

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

  // Lazy-load Mermaid once; returns a Promise that resolves to the mermaid global.
  var mermaidPromise = null;
  function loadMermaid() {
    if (mermaidPromise) return mermaidPromise;
    mermaidPromise = new Promise(function (resolve, reject) {
      if (window.mermaid) { resolve(window.mermaid); return; }
      var s = document.createElement("script");
      s.src = MERMAID_SRC;
      s.onload = function () {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
        });
        resolve(window.mermaid);
      };
      s.onerror = function () { reject(new Error("Failed to load mermaid from " + MERMAID_SRC)); };
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
      var statusText = p.status === "done" ? ("✓ done · " + p.when) :
                       p.status === "active" ? ("→ " + p.when) :
                       "parked";
      card.appendChild(el("span", { class: "pl-phase-status" }, [statusText]));
      root.appendChild(card);
    });
  }

  // ─── Section 2: M-ID lifecycle (Mermaid + injected counts) ────────────────
  function buildLifecycleDiagram(counts) {
    // Counts derived from kb/row_audit/latest.json. We're intentionally
    // generous with the source notes: most stages don't have a single-tag
    // source today, so the diagram captures what we CAN measure now and
    // leaves the rest annotated as "—" until the data lands.
    var seedUntouched = counts.seed_untouched_discipline || 0;
    var verified      = counts._verified || 0; // not yet a direct audit signal
    var blank         = counts.blank_discipline || 0;
    var totalRows     = counts._total || 0;
    var officialIds   = counts._official || 0; // C-ID + CCN-ID anchors
    return [
      "flowchart LR",
      "  S0[\"Phase B seed<br/><b>" + fmt(seedUntouched) + "</b> never reviewed\"]",
      "  S1[\"Curator-Verified<br/>(in CCR tab)\"]",
      "  S2[\"MC-ready<br/>SLOs + content outline<br/><i>0 today — Phase 4</i>\"]",
      "  S3[\"Submitted to ASCCC<br/><i>0 — Phase 6</i>\"]",
      "  S4{\"Approved as<br/>C-ID / CIDx?\"}",
      "  S5[\"Re-keyed to official ID<br/><b>" + fmt(officialIds) + "</b> live anchors\"]",
      "  S6[\"Blank-discipline<br/>backlog<br/><b>" + fmt(blank) + "</b> rows\"]",
      "  S0 --> S1",
      "  S1 --> S2",
      "  S2 --> S3",
      "  S3 --> S4",
      "  S4 -- yes --> S5",
      "  S4 -- rejected --> S1",
      "  S0 -. needs discipline first .-> S6",
      "  S6 -. curator review .-> S1",
      "  classDef seed fill:#FEF3C7,stroke:#92400E,color:#0A2240",
      "  classDef verified fill:#DBEAFE,stroke:#1E40AF,color:#0A2240",
      "  classDef mcready fill:#E0E7FF,stroke:#3730A3,color:#0A2240",
      "  classDef submitted fill:#FCE7F3,stroke:#9D174D,color:#0A2240",
      "  classDef approved fill:#DCFCE7,stroke:#166534,color:#0A2240",
      "  classDef backlog fill:#FEE2E2,stroke:#991B1B,color:#0A2240",
      "  class S0 seed",
      "  class S1 verified",
      "  class S2 mcready",
      "  class S3 submitted",
      "  class S5 approved",
      "  class S6 backlog",
    ].join("\n");
  }

  // ─── Section 4: Phase 1e workflow (static) ────────────────────────────────
  function buildPhase1eDiagram() {
    return [
      "flowchart TD",
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
      "  K((\"Cleanup receipt<br/>subject_collision_signal<br/><b>7,203 → 0</b> ✓\"))",
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
      "  classDef receipt fill:#DCFCE7,stroke:#166534,stroke-width:2px,color:#0A2240",
      "  classDef commit fill:#FEF3C7,stroke:#92400E,color:#0A2240",
      "  class K receipt",
      "  class J commit",
    ].join("\n");
  }

  function renderMermaidInto(elNode, sourceText) {
    return loadMermaid().then(function (mermaid) {
      elNode.classList.remove("pl-loading");
      elNode.innerHTML = "";
      var diagId = "mmd-" + Math.random().toString(36).slice(2, 10);
      return mermaid.render(diagId, sourceText).then(function (out) {
        elNode.innerHTML = out.svg;
        if (out.bindFunctions) out.bindFunctions(elNode);
      });
    }).catch(function (err) {
      elNode.classList.remove("pl-loading");
      elNode.innerHTML = "<div style='color:#991b1b;padding:14px'>Couldn't render diagram: " + err.message + ".</div>";
    });
  }

  // ─── Section 3: auditor cleanup-receipt card ──────────────────────────────
  // The "cleanup-receipt invariants" are the rules that should be ZERO at the
  // end of a re-mint cycle. They get top billing. The other tag counts are
  // shown as supporting context.
  var CLEANUP_RECEIPT_RULES = [
    { tag: "subject_collision_signal", label: "Subject collision (Phase 1e)",      target: 0 },
    { tag: "mid_id_off_scheme",        label: "M-ID off-scheme",                    target: 0, tolerate_blank_discipline: true },
  ];
  var SUPPORTING_RULES = [
    { tag: "blank_discipline",                   label: "Blank discipline (curator backlog)" },
    { tag: "blank_description",                  label: "Blank description" },
    { tag: "seed_untouched_discipline",          label: "Seed-untouched discipline" },
    { tag: "top_discipline_disagreement",        label: "TOP code disagrees with discipline" },
    { tag: "discipline_title_mismatch",          label: "Title disagrees with discipline" },
    { tag: "description_discipline_disagreement",label: "Description disagrees with discipline" },
    { tag: "generic_title_concrete_discipline",  label: "Generic title vs concrete discipline" },
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
      root.innerHTML = "<div class='pl-stat'><div class='pl-stat-label'>kb/row_audit/latest.json</div><div class='pl-stat-value err'>missing</div><div class='pl-stat-delta'>commit + push the auditor output</div></div>";
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
      var stat = el("div", { class: "pl-stat " + (ok ? "ok" : "warn") });
      stat.appendChild(el("div", { class: "pl-stat-label" },
        [r.label, ok ? " " : ""]));
      if (ok) {
        var lbl = stat.lastChild;
        lbl.appendChild(el("span", { class: "pl-receipt-badge" }, ["receipt ✓"]));
      }
      stat.appendChild(el("div", { class: "pl-stat-value" }, [fmt(fixable)]));
      var delta = "target " + r.target;
      if (r.tag === "mid_id_off_scheme" && unfixable > 0) {
        delta = "+ " + unfixable + " unfixable (blank-discipline) ignored · target " + r.target;
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
      var when = audit._generated_at || "(no _generated_at field)";
      status.textContent = "Last auditor run: " + when + " · " + fmt(counts._total) + " M-ID/Cluster rows · " + fmt(counts._totalFlagged) + " with ≥1 flag";
    }
    return counts;
  }

  // ─── orchestrator ─────────────────────────────────────────────────────────
  var rendered = false;
  function activate() {
    if (rendered) return;
    rendered = true;
    renderRoadmap();
    fetchAudit().then(function (audit) {
      var counts = renderReceipt(audit) || {};
      // Lifecycle counts: pull from latest.json; add some derived totals.
      var lifecycleCounts = {
        seed_untouched_discipline: counts.seed_untouched_discipline || 0,
        blank_discipline: counts.blank_discipline || 0,
        _total: counts._total || 0,
        _official: 0, // TODO when we surface C-ID/CCN anchor count in latest.json
      };
      renderMermaidInto($("pl-lifecycle"), buildLifecycleDiagram(lifecycleCounts));
      renderMermaidInto($("pl-workflow"), buildPhase1eDiagram());
      var lstatus = $("pl-lifecycle-status");
      if (lstatus && audit) {
        lstatus.textContent = "Last auditor run: " + (audit._generated_at || "—");
      }
    });
  }

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
})();
