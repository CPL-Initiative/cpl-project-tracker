/* program_requirements.js — the Program Requirements tab (window.CPL_PROGRAM_REQUIREMENTS)
 * ======================================================================================
 * Sam, 2026-10-04 ~17:20Z: "we use the new tab based on mockup to manage the ongoing
 * process to harvest program ROE and Pathway data and CPL Pathways to show it
 * graphically to the colleges and public... My goal is to not need to curate or
 * manually adjust and instead to adjust college-based procedures to arrive at accurate
 * catalog ROEP dataset". He approved the mock-up (v3, 2026-10-04: "mock up looks good",
 * https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f) and marked the tab and its contents
 * Beta draft: everything here is public record.
 *
 * Four views, each read LIVE from tables anon may SELECT (no snapshot to go stale):
 *   Catalogs     program_source_registry, one row per college: where its catalog is,
 *                the year it names, the platform, its published program map.
 *   Records      program_requirement_records: each program read from its catalog, the
 *                four checks it passed, and the CPL its courses carry (display, built by
 *                kb/_build_roep_display.py under one build stamp).
 *   Sequences    the registry's program map columns: who publishes a term-by-term map
 *                and what the reader got when it asked.
 *   Procedures   program_source_registry.procedure: the reading procedure a college's
 *                agent runs by (hosts, steps, answers, open questions, nuances, held
 *                requests). Sam's sheet 34 card 2: one per college, kept with its
 *                history; a misread changes the procedure, never the record.
 *
 * Sierra is one link (the mock-up's v3 design): it opens the CPL Assistant tab.
 *
 * A FAILED READ SAYS SO; it never renders as zero colleges or zero records.
 * Read-only: this tab writes nothing. Tests: tests/program_requirements.test.js
 */
(function () {
  "use strict";

  var ROOT_ID = "program-requirements-root";
  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var VIEW_KEY = "cplProgramRequirements.view.v1";
  var CURRENT_YEAR = "2026-2027";

  var REGISTRY_SELECT = "college,catalog_url,catalog_year,catalog_platform,catalog_format," +
    "sequence_source,sequence_url,sequence_host,sequence_access,sequence_note,access_status," +
    "corrected_by,census_checked_at,census_run_id,procedure,procedure_by,procedure_at";
  var RECORD_SELECT = "college,control_number,program_title,award,catalog_year,source_url," +
    "measure,total_min,total_max,record,checks,checked,checked_by,display";

  var PLATFORM = { courseleaf: "CourseLeaf", curriqunet: "curriQunet", elumen: "eLumen", pdf: "PDF",
    custom_html: "College site", smartcatalog: "SmartCatalog", acalog: "Acalog", coursedog: "Coursedog" };
  var FORMAT = { html_per_program: "A page per program", single_pdf: "One PDF",
    pdf_by_section: "PDF by section", unknown: "Not yet known" };
  var SEQ = { ppm: "Program Mapper", program_map_page: "Program map page", none_found: "None found", unknown: "Not read" };
  var SEQ_ACCESS = { refused: "Refused the reader", not_read: "Not read yet", ok: "Read", gone: "Gone" };
  var HOST_ACCESS = { open: "Open", refused: "Refused", unreached: "Unreached", gone: "Gone" };
  var VIEWS = [
    { id: "catalogs", label: "Catalogs" },
    { id: "records", label: "Program records" },
    { id: "sequences", label: "Sequences" },
    { id: "procedures", label: "Procedures" }
  ];

  var state = { registry: null, records: null, error: null, loading: false,
    view: "catalogs", q: "", show: "all", platform: "all", open: {} };

  /* ── small helpers ── */
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function fmt(n) { return n == null || n === "" ? "" : (Math.round(Number(n) * 10) / 10).toLocaleString("en-US"); }
  function span(a, b) { return a == null ? "" : (b == null || Number(a) === Number(b) ? fmt(a) : fmt(a) + "–" + fmt(b)); }
  /* The state file names an award with its unit range ("Certificate of Achievement requiring
     16S/24Q to fewer than 30S/45Q units"); a reader needs the award's own name. */
  function award(a) { return String(a || "").replace(/\s+requiring\b.*$/i, "").trim(); }
  function yr(y) { return y ? String(y).slice(0, 5) + String(y).slice(7) : ""; }
  function day(ts) { return ts ? String(ts).slice(0, 10) : ""; }
  function link(href, text) { return el("a", { href: href, target: "_blank", rel: "noopener", text: text }); }
  function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private window */ } }

  /* ── reads ── */
  function headers() { return { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON }; }
  function getJson(url) {
    return fetch(url, { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error(url.split("?")[0].split("/").pop() + " answered " + r.status);
      return r.json();
    });
  }
  function load() {
    if (state.loading) return Promise.resolve();
    state.loading = true;
    state.error = null;
    return Promise.all([
      getJson(REST + "/program_source_registry?select=" + REGISTRY_SELECT + "&order=college"),
      getJson(REST + "/program_requirement_records?select=" + RECORD_SELECT + "&order=college,control_number")
    ]).then(function (got) {
      state.registry = got[0] || [];
      state.records = got[1] || [];
    }).catch(function (e) {
      state.error = (e && e.message) || "the read failed";
    }).then(function () {
      state.loading = false;
      render();
    });
  }

  /* ── pure derivations (exported for the tests) ── */
  function catalogStatus(r) {
    if (!r.catalog_url) return { t: "Address needed", c: "prh-caution",
      why: r.access_status === "blocked" ? "the site shows a challenge page" : "the census found no catalog" };
    if (r.access_status === "blocked") return { t: "Last read refused", c: "prh-caution", why: "the address is kept from an earlier read" };
    if (r.access_status === "robots_disallow") return { t: "Robots.txt bars reading", c: "prh-caution", why: "the address is recorded and never loaded" };
    return { t: "Read", c: "prh-quiet", why: "" };
  }
  function needsPerson(r) { return !r.catalog_url || (r.access_status && r.access_status !== "ok"); }
  function hasMap(r) { return r.sequence_source === "ppm" || r.sequence_source === "program_map_page"; }
  function filterRegistry(rows, q, show, plat) {
    q = (q || "").trim().toLowerCase();
    return rows.filter(function (r) {
      if (q && String(r.college || "").toLowerCase().indexOf(q) < 0) return false;
      if (plat && plat !== "all" && r.catalog_platform !== plat) return false;
      if (show === "person") return needsPerson(r);
      if (show === "last") return !!r.catalog_year && r.catalog_year !== CURRENT_YEAR;
      if (show === "noyear") return !!r.catalog_url && !r.catalog_year;
      if (show === "pdf") return r.catalog_platform === "pdf";
      if (show === "seq") return hasMap(r);
      if (show === "procedure") return !!r.procedure;
      return true;
    });
  }
  /* A record passes when all four checks hold: every course the state file lists is placed
     (or its absence explained), nothing the catalog does not print is added, the units add
     up to the printed total (or the catalog prints none), and a person read it. */
  function recordChecks(rec) {
    var d = (rec.display && rec.display.checks) || {};
    var c = rec.checks || {};
    var cov = d.coverage || {};
    var reviewer = d.reviewer || (c.reviewer && c.reviewer.verdict) || null;
    var arith = d.arithmetic || c.arithmetic || null;
    return {
      placed: cov.placed, listed: cov.listed,
      additions: d.additions || 0,
      arithmetic: arith,
      reviewer: reviewer,
      passes: c.coverage === true && c.invented === true &&
        (arith === "equal" || arith === "unstated") && (reviewer === "ok" || reviewer === "fix")
    };
  }
  function ruleText(b, measure, groups) {
    var unit = measure === "hours" ? "hours" : "units";
    if (b.rule === "choose_units") return "Choose " + fmt(b.minimum) + " " + unit;
    if (b.rule === "choose_courses") return "Choose " + fmt(b.minimum) + (Number(b.minimum) === 1 ? " course" : " courses");
    if (b.option_group) return "Take one of " + (groups[b.option_group] || 2) + " options";
    return "All required";
  }
  function procedureCounts(p) {
    p = p || {};
    return { hosts: (p.hosts || []).length, steps: (p.steps || []).length, answers: (p.answers || []).length,
      open: (p.open || []).length, nuances: (p.nuances || []).length,
      held: (p.requests || []).filter(function (q) { return /^held/i.test(q.status || ""); }).length };
  }

  /* ── CSS (tokens only; injected once, so both HTMLs carry it without a Rule-4 mirror) ── */
  function ensureCss() {
    if (document.getElementById("prh-css")) return;
    var css = [
      ".prh { color: var(--text-body); }",
      ".prh-mast { display:grid; gap:6px; padding-bottom:14px; border-bottom:1px solid var(--border); }",
      ".prh-titlerow { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px 16px; }",
      ".prh h2 { margin:0; color:var(--text-strong); font-size:clamp(1.4rem, 2.6vw, 1.9rem); line-height:1.2; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }",
      ".prh h3 { margin:0; color:var(--text-strong); font-size:1.05rem; }",
      ".prh h4 { margin:0 0 6px; color:var(--text-strong); font-size:.95rem; display:flex; flex-wrap:wrap; gap:4px 12px; align-items:baseline; }",
      ".prh-draft { font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; background:var(--mustard-fill); color:var(--on-mustard, var(--text-strong)); border-radius:10px; padding:3px 10px; }",
      ".prh-meta { margin:0; font-size:.875rem; color:var(--text-muted); max-width:var(--cpl-measure,none); }",
      ".prh-tools { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }",
      ".prh-ask { display:inline-flex; align-items:center; font-weight:700; color:var(--seal-blue-text); text-decoration:none; border:1px solid var(--border-strong); border-radius:8px; padding:6px 12px; min-height:40px; background:var(--surface-opaque); }",
      ".prh-ask:hover { border-color:var(--seal-blue-text); }",
      ".prh-switch { display:flex; flex-wrap:wrap; gap:6px; padding-block:14px; }",
      ".prh-switch button { font:inherit; font-weight:600; color:var(--text-body); background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:8px; padding:8px 14px; min-height:44px; cursor:pointer; }",
      ".prh-switch button[aria-selected=\"true\"] { background:var(--text-strong); color:var(--paper); border-color:var(--text-strong); }",
      ".prh-switch .prh-n { font-weight:400; margin-left:6px; font-variant-numeric:tabular-nums; }",
      ".prh a:focus-visible, .prh button:focus-visible, .prh select:focus-visible, .prh input:focus-visible, .prh summary:focus-visible, .prh [tabindex]:focus-visible { outline:3px solid var(--focus-ring, var(--cobalt)); outline-offset:2px; }",
      ".prh-lede { margin:0 0 14px; max-width:var(--cpl-measure,none); }",
      ".prh-facts { display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:12px; margin-block:4px 18px; }",
      ".prh-fact { background:var(--surface-opaque); border:1px solid var(--border); border-radius:8px; padding:12px 14px; min-width:0; }",
      ".prh-fact b { display:block; font-size:1.5rem; color:var(--text-strong); font-variant-numeric:tabular-nums; line-height:1.2; }",
      ".prh-fact span { font-size:.875rem; color:var(--text-muted); }",
      ".prh-controls { display:flex; flex-wrap:wrap; gap:10px 14px; align-items:end; margin-bottom:12px; }",
      ".prh-controls label { display:grid; gap:4px; font-size:.8125rem; font-weight:600; color:var(--text-muted); }",
      ".prh-controls input, .prh-controls select { font:inherit; color:var(--text-body); background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:6px; padding:8px 10px; min-height:44px; min-width:0; }",
      ".prh-controls input { width:min(320px, 100%); }",
      ".prh-count { font-size:.875rem; color:var(--text-muted); margin-left:auto; font-variant-numeric:tabular-nums; }",
      ".prh-tablewrap { overflow-x:auto; background:var(--surface-opaque); border:1px solid var(--border); border-radius:8px; }",
      ".prh table { width:100%; border-collapse:collapse; table-layout:fixed; }",
      /* Header on the muted surface with strong text: both are theme tokens, so the pair holds AA in light and dark. */
      ".prh thead th { position:sticky; top:0; background:var(--surface-muted); color:var(--text-strong); text-align:left; font-size:.8125rem; font-weight:700; padding:10px 12px; }",
      ".prh tbody th, .prh tbody td { padding:9px 12px; border-top:1px solid var(--border); vertical-align:top; text-align:left; overflow-wrap:anywhere; }",
      ".prh tbody th { font-weight:600; color:var(--text-strong); }",
      ".prh tbody tr:nth-child(even) { background:var(--surface-subtle); }",
      ".prh .prh-num { text-align:right; font-variant-numeric:tabular-nums; }",
      ".prh-quiet { color:var(--text-muted); }",
      ".prh-caution { color:var(--mustard-text); font-weight:600; }",
      ".prh-small { font-size:.8125rem; }",
      ".prh-alts { display:block; font-size:.8125rem; color:var(--text-muted); }",
      ".prh-college { margin-block:22px 8px; display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 14px; }",
      ".prh-rec, .prh-card { background:var(--surface-opaque); border:1px solid var(--border); border-radius:8px; margin-bottom:8px; }",
      ".prh-card { padding:16px; display:grid; gap:12px; margin-bottom:18px; }",
      ".prh-rhead { padding:12px 14px; display:grid; gap:8px 18px; grid-template-columns:minmax(0,1.4fr) minmax(0,2.2fr) minmax(0,1fr); align-items:start; }",
      ".prh-rec.prh-open .prh-rhead { border-bottom:1px solid var(--border); }",
      ".prh-rtitle { min-width:0; display:grid; gap:2px; justify-items:start; }",
      ".prh-rtitle strong { color:var(--text-strong); }",
      ".prh-toggle { font:inherit; font-size:.875rem; font-weight:600; color:var(--cobalt); background:none; border:1px solid var(--border-strong); border-radius:6px; padding:4px 10px; min-height:32px; cursor:pointer; margin-top:4px; }",
      ".prh-checks { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:6px 12px; min-width:0; margin:0; }",
      ".prh-check { min-width:0; font-size:.875rem; }",
      ".prh-check dt { font-size:.75rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-check dd { margin:0; }",
      ".prh-cpl { font-size:.875rem; min-width:0; }",
      ".prh-cpl b { color:var(--text-strong); font-variant-numeric:tabular-nums; }",
      ".prh-body { padding:14px; display:grid; gap:16px; }",
      ".prh-rule { font-size:.8125rem; font-weight:600; color:var(--seal-blue-text); background:var(--surface-muted); border-radius:10px; padding:2px 8px; }",
      ".prh-notes summary { cursor:pointer; font-weight:600; color:var(--cobalt); min-height:32px; }",
      ".prh-notes ul, .prh-card ul { margin:6px 0 0; padding-left:20px; }",
      ".prh-dl { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px 16px; margin:0; }",
      ".prh-dl dt { font-size:.75rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-dl dd { margin:0; font-variant-numeric:tabular-nums; }",
      ".prh-empty { border:1px dashed var(--border-strong); border-radius:8px; background:var(--surface-subtle); color:var(--text-muted); padding:24px; text-align:center; }",
      ".prh-foot { margin-top:28px; padding-top:14px; border-top:1px solid var(--border); font-size:.875rem; color:var(--text-muted); display:grid; gap:6px; }",
      ".prh-foot p { margin:0; max-width:var(--cpl-measure,none); }",
      "@media (max-width: 860px) { .prh-rhead { grid-template-columns:minmax(0,1fr); } .prh-checks { grid-template-columns:repeat(2, minmax(0,1fr)); } }",
      "@media (max-width: 560px) { .prh-count { margin-left:0; width:100%; }" +
        " .prh table.prh-stack thead { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }" +
        " .prh table.prh-stack, .prh table.prh-stack tbody, .prh table.prh-stack tr { display:block; width:100%; }" +
        " .prh table.prh-stack tr { border-top:1px solid var(--border); padding-block:6px; }" +
        " .prh table.prh-stack tbody th, .prh table.prh-stack tbody td { display:grid; grid-template-columns:7.5rem minmax(0,1fr); gap:8px; border:0; padding:4px 12px; }" +
        " .prh table.prh-stack tbody td::before, .prh table.prh-stack tbody th::before { content:attr(data-label); font-weight:600; color:var(--text-muted); font-size:.8125rem; } }",
      "@media (prefers-reduced-motion: reduce) { .prh * { transition:none !important; animation:none !important; } }"
    ].join("\n");
    document.head.appendChild(el("style", { id: "prh-css", text: css }));
  }

  /* ── table builder ── */
  function table(cols, rows, label, stack) {
    var t = el("table", { cls: stack ? "prh-stack" : null }, [
      el("colgroup", {}, cols.map(function (c) { return el("col", { style: "width:" + c.w }); })),
      el("thead", {}, [el("tr", {}, cols.map(function (c) {
        return el("th", { scope: "col", cls: c.num ? "prh-num" : null, text: c.label });
      }))])
    ]);
    var tb = el("tbody");
    rows.forEach(function (cells) {
      tb.appendChild(el("tr", {}, cells.map(function (v, i) {
        var c = cols[i];
        var kids = Array.isArray(v) ? v : [v];
        return el(i === 0 ? "th" : "td", { scope: i === 0 ? "row" : null, "data-label": c.label,
          cls: c.num ? "prh-num" : null }, kids);
      })));
    });
    t.appendChild(tb);
    return el("div", { cls: "prh-tablewrap", role: "region", "aria-label": label, tabindex: "0" }, [t]);
  }
  function fact(big, small) { return el("div", { cls: "prh-fact" }, [el("b", { text: String(big) }), el("span", { text: small })]); }

  /* ── views ── */
  function viewCatalogs() {
    var R = state.registry;
    var box = el("div");
    var withUrl = R.filter(function (r) { return r.catalog_url; }).length;
    var current = R.filter(function (r) { return r.catalog_year === CURRENT_YEAR; }).length;
    var maps = R.filter(hasMap).length;
    var person = R.filter(needsPerson).length;
    box.appendChild(el("p", { cls: "prh-lede", text: "The census reads every college's homepage each week, finds its current catalog, and records the address, the year the catalog names for itself, the platform it runs on, and any published term-by-term program map. A person's correction always stands over the census." }));
    box.appendChild(el("div", { cls: "prh-facts" }, [
      fact(withUrl + " of " + R.length, "colleges with a catalog address"),
      fact(current, "name the " + yr(CURRENT_YEAR) + " year"),
      fact(maps, "publish a program map"),
      fact(person, "need a person: no address, or the last read was refused")
    ]));
    var plats = {};
    R.forEach(function (r) { if (r.catalog_platform) plats[r.catalog_platform] = (plats[r.catalog_platform] || 0) + 1; });
    var platSel = el("select", { id: "prh-platform" }, [el("option", { value: "all", text: "All platforms" })]
      .concat(Object.keys(plats).sort(function (a, b) { return plats[b] - plats[a]; }).map(function (p) {
        return el("option", { value: p, text: (PLATFORM[p] || p) + " (" + plats[p] + ")" });
      })));
    platSel.value = state.platform;
    var showSel = el("select", { id: "prh-show" }, [
      ["all", "All colleges"], ["person", "Needs a person"], ["last", "Last year's catalog"],
      ["noyear", "No year named"], ["pdf", "PDF catalogs"], ["seq", "Has a program map"],
      ["procedure", "Has a reading procedure"]
    ].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.show;
    var q = el("input", { id: "prh-q", type: "search", placeholder: "College name", autocomplete: "off" });
    q.value = state.q;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    var host = el("div");
    function draw() {
      state.q = q.value; state.show = showSel.value; state.platform = platSel.value;
      var rows = filterRegistry(R, state.q, state.show, state.platform);
      host.textContent = "";
      host.appendChild(table([
        { label: "College", w: "23%" }, { label: "Catalog", w: "20%" }, { label: "Year", w: "11%" },
        { label: "Format", w: "14%" }, { label: "Program map", w: "16%" }, { label: "Status", w: "16%" }
      ], rows.map(function (r) {
        var st = catalogStatus(r);
        var year = r.catalog_year
          ? (r.catalog_year === CURRENT_YEAR ? yr(r.catalog_year)
            : el("span", {}, [yr(r.catalog_year) + " ", el("span", { cls: "prh-caution prh-small", text: "last year's" })]))
          : el("span", { cls: "prh-quiet", text: r.catalog_url ? "Not named" : "" });
        return [
          r.college,
          r.catalog_url ? link(r.catalog_url, (PLATFORM[r.catalog_platform] || "Catalog") + " catalog")
            : el("span", { cls: "prh-quiet", text: "No address yet" }),
          year,
          r.catalog_format ? (FORMAT[r.catalog_format] || r.catalog_format) : "",
          r.sequence_url && hasMap(r) ? link(r.sequence_url, SEQ[r.sequence_source])
            : el("span", { cls: "prh-quiet", text: SEQ[r.sequence_source] || "" }),
          [el("span", { cls: st.c, text: st.t }),
            st.why ? el("span", { cls: "prh-alts", text: st.why }) : null,
            r.corrected_by ? el("span", { cls: "prh-alts", text: "Corrected by " + r.corrected_by }) : null]
        ];
      }), "Catalog registry, one row per college", true));
      count.textContent = "Showing " + rows.length + " of " + R.length;
    }
    [q, showSel, platSel].forEach(function (c) { c.addEventListener("input", draw); c.addEventListener("change", draw); });
    box.appendChild(el("div", { cls: "prh-controls" }, [
      el("label", { "for": "prh-q" }, ["Find a college", q]),
      el("label", { "for": "prh-show" }, ["Show", showSel]),
      el("label", { "for": "prh-platform" }, ["Platform", platSel]),
      count
    ]));
    box.appendChild(host);
    draw();
    return box;
  }

  function viewRecords() {
    var P = state.records, R = state.registry;
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "Each program read from its college's catalog: the required courses, the courses chosen from a list, and the electives. A record passes four checks: it places the courses the state's Program Course File lists, it adds no course the catalog does not print, its units add up to the catalog's total, and a person read it against the catalog. A misread changes the college's reading procedure, never the record." }));
    if (!P.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No program record has been loaded yet." }));
      return box;
    }
    var checks = P.map(recordChecks);
    var passing = checks.filter(function (c) { return c.passes; }).length;
    var equal = checks.filter(function (c) { return c.arithmetic === "equal"; }).length;
    var withCpl = P.filter(function (p) { return p.display && p.display.counts && p.display.counts.here > 0; }).length;
    var colleges = {};
    P.forEach(function (p) { colleges[p.college] = 1; });
    box.appendChild(el("div", { cls: "prh-facts" }, [
      fact(P.length + " at " + Object.keys(colleges).length, "programs read, at that many colleges"),
      fact(passing + " of " + P.length, "records pass all four checks"),
      fact(equal, "totals agree with the catalog's"),
      fact(withCpl + " of " + P.length, "programs hold a course with CPL at the college")
    ]));
    var last = null;
    P.forEach(function (p) {
      if (p.college !== last) {
        last = p.college;
        var reg = R.filter(function (r) { return r.college === p.college; })[0] || {};
        box.appendChild(el("div", { cls: "prh-college" }, [el("h3", { text: p.college }),
          el("span", { cls: "prh-quiet prh-small", text: ((PLATFORM[reg.catalog_platform] || "") + " catalog, " + yr(p.catalog_year)).trim() })]));
      }
      box.appendChild(recordCard(p));
    });
    return box;
  }

  function recordCard(p) {
    var key = p.college + "|" + p.control_number;
    var unit = p.measure === "hours" ? "hours" : "units";
    var ck = recordChecks(p);
    var disp = p.display || {};
    var counts = disp.counts || {};
    var figure = disp.figure || {};
    var courses = disp.courses || {};
    function dd(label, value) { return el("div", { cls: "prh-check" }, [el("dt", { text: label }), el("dd", { text: value })]); }
    var placed = ck.listed != null ? ck.placed + " of " + ck.listed + " placed" : "Not measured";
    var arith = ck.arithmetic === "equal" ? "Equal, " + span(p.total_min, p.total_max) + " " + unit
      : ck.arithmetic === "unstated" ? "Catalog prints no total" : (ck.arithmetic || "Not measured");
    var reader = ck.reviewer === "ok" ? "Matches the catalog" : ck.reviewer === "fix" ? "Fixed after review" : "Not read";
    var cpl = counts.here
      ? el("div", { cls: "prh-cpl" }, [el("b", { text: counts.here + (counts.here === 1 ? " course" : " courses") }),
          " of " + (counts.courses || "?") + " carry CPL at this college" +
          (figure.up_to != null ? "; up to " + fmt(figure.up_to) + " of " + span(p.total_min, p.total_max) + " " + unit + " through CPL" : "")])
      : el("div", { cls: "prh-cpl prh-quiet", text: "No course here carries CPL at this college yet" });
    var bodyId = "prh-body-" + String(key).replace(/[^A-Za-z0-9]+/g, "-");
    var isOpen = !!state.open[key];
    var btn = el("button", { cls: "prh-toggle", type: "button", "aria-expanded": isOpen ? "true" : "false",
      "aria-controls": bodyId, text: isOpen ? "Hide the blocks" : "Show the blocks" });
    var head = el("div", { cls: "prh-rhead" }, [
      el("div", { cls: "prh-rtitle" }, [el("strong", { text: p.program_title }),
        el("span", { cls: "prh-small prh-quiet", text: award(p.award) + " · " + p.control_number }), btn]),
      el("dl", { cls: "prh-checks" }, [dd("Courses", placed),
        dd("Off the state list", ck.additions ? ck.additions + ", printed in the catalog" : "None"),
        dd("Units", arith), dd("Person's reading", reader)]),
      cpl]);
    var body = el("div", { cls: "prh-body", id: bodyId });
    body.hidden = !isOpen;
    var blocks = (p.record && p.record.blocks) || [];
    var groups = {};
    blocks.forEach(function (b) { if (b.option_group) groups[b.option_group] = (groups[b.option_group] || 0) + 1; });
    blocks.forEach(function (b) {
      var h = el("h4", {}, [b.name || "Courses", el("span", { cls: "prh-rule", text: ruleText(b, p.measure, groups) })]);
      if (b.stated && b.stated.min != null) h.appendChild(el("span", { cls: "prh-quiet prh-small", text: "Catalog prints " + span(b.stated.min, b.stated.max) + " " + unit }));
      body.appendChild(el("div", {}, [h, table([
        { label: "Course", w: "17%" }, { label: "Title", w: "53%" },
        { label: unit.charAt(0).toUpperCase() + unit.slice(1), w: "12%", num: true },
        { label: "CPL here", w: "18%", num: true }
      ], (b.courses || []).map(function (c) {
        var info = courses[c.code] || {};
        var here = info.here || {};
        var n = (here.recs || 0) + (here.credentials_n || 0);
        var alts = (c.alternatives || []).map(function (a) { return a.code || a; });
        return [
          [c.code, alts.length ? el("span", { cls: "prh-alts", text: "or " + alts.join(", ") }) : null],
          [info.title || "", c.catalog_addition ? el("span", { cls: "prh-alts", text: "Printed in the catalog; not on the state's list" }) : null],
          span(c.units, c.units_max),
          n ? el("strong", { text: String(n) }) : el("span", { cls: "prh-quiet", text: "0" })
        ];
      }), p.program_title + ": " + (b.name || "courses"), true)]));
    });
    if (p.total_min != null) body.appendChild(el("p", { cls: "prh-small", style: "margin:0", text: "Program total: " + span(p.total_min, p.total_max) + " " + unit + "." }));
    body.appendChild(el("p", { cls: "prh-small prh-quiet", style: "margin:0" }, [
      "Read from ", p.source_url ? link(p.source_url, "the catalog page") : "the catalog",
      " (" + yr(p.catalog_year) + ")" + (p.checked_by ? "; read against the catalog by " + p.checked_by : "") + ".",
      disp.build ? " Display build " + disp.build + (disp.built ? ", " + disp.built : "") + "." : ""]));
    var gaps = disp.gaps || [];
    if (gaps.length) body.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "Notes for the reading procedure (" + gaps.length + ")" }),
      el("ul", {}, gaps.map(function (g) { return el("li", { text: (g.kind ? g.kind + ": " : "") + g.text }); }))]));
    var art = el("article", { cls: "prh-rec" + (isOpen ? " prh-open" : ""), "aria-label": p.program_title + ", " + p.college }, [head, body]);
    btn.addEventListener("click", function () {
      var open = body.hidden;
      body.hidden = !open;
      state.open[key] = open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Hide the blocks" : "Show the blocks";
      art.classList.toggle("prh-open", open);
    });
    return art;
  }

  function viewSequences() {
    var R = state.registry;
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "A sequence is the order a college recommends for a program's courses, term by term. Many colleges publish one in a Program Pathways Mapper or on a program map page. The reader asks each host once, keeps its answer, and never works around a refusal." }));
    var rows = R.filter(function (r) { return r.sequence_url || r.sequence_host; });
    var refused = rows.filter(function (r) { return r.sequence_access === "refused"; }).length;
    var read = rows.filter(function (r) { return r.sequence_access === "ok"; }).length;
    box.appendChild(el("div", { cls: "prh-facts" }, [
      fact(rows.length, "colleges point to a program map"),
      fact(refused, "map hosts refused the reader"),
      fact(read, "maps read")
    ]));
    if (!rows.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No college points to a program map yet." }));
      return box;
    }
    box.appendChild(table([
      { label: "College", w: "24%" }, { label: "Source", w: "16%" }, { label: "Reader", w: "18%" }, { label: "Address and note", w: "42%" }
    ], rows.map(function (r) {
      var addr = r.sequence_url || ("https://" + r.sequence_host + "/");
      return [
        r.college,
        SEQ[r.sequence_source] || r.sequence_source || "",
        el("span", { cls: r.sequence_access === "refused" ? "prh-caution" : null, text: SEQ_ACCESS[r.sequence_access] || "Not asked" }),
        [link(addr, addr.replace(/^https?:\/\//, "")), r.sequence_note ? el("span", { cls: "prh-alts", text: r.sequence_note }) : null]
      ];
    }), "Colleges with a published program map", true));
    return box;
  }

  function viewProcedures() {
    var R = state.registry;
    var withP = R.filter(function (r) { return r.procedure; });
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "Each college's reading procedure: the hosts its agent reads and what each answered, every read it has run, what those reads settled, the questions still open, the college's nuances, and any request held for a person. A misread is fixed here, in the procedure, and the next read follows it." }));
    box.appendChild(el("div", { cls: "prh-facts" }, [
      fact(withP.length + " of " + R.length, "colleges have a reading procedure"),
      fact(withP.reduce(function (s, r) { return s + procedureCounts(r.procedure).open; }, 0), "questions still open"),
      fact(withP.reduce(function (s, r) { return s + procedureCounts(r.procedure).held; }, 0), "requests to a college held")
    ]));
    if (!withP.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No college has a reading procedure yet." }));
      return box;
    }
    withP.forEach(function (r) { box.appendChild(procedureCard(r)); });
    return box;
  }

  function procedureCard(r) {
    var p = r.procedure || {};
    var n = procedureCounts(p);
    var card = el("article", { cls: "prh-card", "aria-label": "Reading procedure, " + r.college });
    card.appendChild(el("div", { cls: "prh-titlerow" }, [el("h3", { text: r.college }),
      el("span", { cls: "prh-small prh-quiet", text: "Version " + (p.v || "?") + " · written " + day(r.procedure_at) + (r.procedure_by ? " by " + r.procedure_by : "") })]));
    card.appendChild(el("dl", { cls: "prh-dl" }, [
      ["Hosts", n.hosts], ["Reads", n.steps], ["Answers", n.answers], ["Open", n.open], ["Nuances", n.nuances], ["Held requests", n.held]
    ].map(function (x) { return el("div", {}, [el("dt", { text: x[0] }), el("dd", { text: String(x[1]) })]); })));
    if (p.reader) card.appendChild(el("p", { cls: "prh-small prh-quiet", style: "margin:0", text: "Reader: " + p.reader }));
    if (n.open) card.appendChild(el("div", {}, [el("h4", { text: "Still open" }), table([
      { label: "Question", w: "40%" }, { label: "Next", w: "60%" }
    ], (p.open || []).map(function (o) { return [o.question || "", o.next || ""]; }), r.college + ": open questions", true)]));
    if (n.answers) card.appendChild(el("div", {}, [el("h4", { text: "What the reads settled" }), table([
      { label: "Question", w: "28%" }, { label: "Status", w: "14%" }, { label: "Answer", w: "58%" }
    ], (p.answers || []).map(function (a) {
      return [a.question || "", el("span", { cls: a.status === "answered" ? null : "prh-caution", text: a.status || "" }), a.answer || ""];
    }), r.college + ": answers", true)]));
    if (n.hosts) card.appendChild(el("div", {}, [el("h4", { text: "Hosts" }), table([
      { label: "Host", w: "26%" }, { label: "Access", w: "12%" }, { label: "Note", w: "62%" }
    ], (p.hosts || []).map(function (h) {
      return [h.host || "", el("span", { cls: h.access === "open" ? null : "prh-caution", text: HOST_ACCESS[h.access] || h.access || "" }), h.note || ""];
    }), r.college + ": hosts", true)]));
    if (n.steps) card.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "Every read (" + n.steps + ")" }),
      table([{ label: "Date", w: "12%" }, { label: "Run", w: "14%" }, { label: "Loads", w: "10%", num: true }, { label: "What it found", w: "64%" }],
        (p.steps || []).map(function (s) {
          return [s.date || "", s.run ? link("https://github.com/CPL-Initiative/cpl-project-tracker/actions/runs/" + s.run, s.run) : "",
            s.loads != null ? (s.reached != null ? s.reached + " of " + s.loads : String(s.loads)) : "", s.found || ""];
        }), r.college + ": every read", true)]));
    if (n.nuances) card.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "The college's nuances (" + n.nuances + ")" }),
      el("ul", {}, (p.nuances || []).map(function (x) { return el("li", { text: x }); }))]));
    var extra = (p.requests || []).map(function (q) { return "Request to " + (q.to || "the college") + ": " + (q.question || "") + " (" + (q.status || "") + ")"; })
      .concat((p.workarounds || []).map(function (w) { return "Workaround for " + (w.for || "") + ": " + (w.tried || "") + " (" + (w.result || "") + ")"; }));
    if (extra.length) card.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "Requests and workarounds (" + extra.length + ")" }),
      el("ul", {}, extra.map(function (x) { return el("li", { text: x }); }))]));
    return card;
  }

  /* ── frame ── */
  function counts() {
    var R = state.registry || [], P = state.records || [];
    return { catalogs: R.length, records: P.length,
      sequences: R.filter(function (r) { return r.sequence_url || r.sequence_host; }).length,
      procedures: R.filter(function (r) { return r.procedure; }).length };
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    ensureCss();
    root.removeAttribute("style");
    root.textContent = "";
    var wrap = el("div", { cls: "prh" });
    var ask = el("a", { cls: "prh-ask", href: "#chatbot",
      title: "Ask Sierra about program requirements; she reads the catalogs, the program records and the rules the harvest runs by",
      text: "Ask Sierra" });
    var meta = el("p", { cls: "prh-meta" });
    wrap.appendChild(el("header", { cls: "prh-mast" }, [
      el("div", { cls: "prh-titlerow" }, [
        el("h2", {}, ["Program Requirements", el("span", { cls: "prh-draft", text: "Beta draft" })]),
        el("div", { cls: "prh-tools" }, [ask])]),
      el("p", { cls: "prh-meta", text: "How each program's courses count toward its award, read from the college's own catalog, and the reading procedure each college's agent runs by. With these records, CPL Pathways shows which courses a learner can clear through CPL and how many units that saves." }),
      meta]));
    if (state.error) {
      wrap.appendChild(el("div", { cls: "prh-empty", role: "alert" }, [
        "The harvest's tables could not be read (" + state.error + "). Nothing here is a count of zero. ",
        el("button", { cls: "prh-toggle", type: "button", text: "Read again" })]));
      wrap.querySelector(".prh-empty button").addEventListener("click", function () { load(); });
      root.appendChild(wrap);
      return;
    }
    if (!state.registry || !state.records) {
      wrap.appendChild(el("div", { cls: "prh-empty", text: "Reading the harvest's tables…" }));
      root.appendChild(wrap);
      return;
    }
    var latest = state.registry.map(function (r) { return day(r.census_checked_at); }).filter(Boolean).sort().pop();
    meta.textContent = (latest ? "Catalogs last read by the census " + latest + ". " : "") +
      "Read live from the harvest's tables each time this tab opens.";
    var n = counts();
    var sw = el("div", { cls: "prh-switch", role: "tablist", "aria-label": "Program requirements views" });
    var panel = el("section", { cls: "prh-panel", role: "tabpanel", id: "prh-panel", tabindex: "0" });
    VIEWS.forEach(function (v, i) {
      var sel = state.view === v.id;
      var b = el("button", { role: "tab", id: "prh-tab-" + v.id, "aria-controls": "prh-panel",
        "aria-selected": sel ? "true" : "false", tabindex: sel ? "0" : "-1", type: "button" },
        [v.label, el("span", { cls: "prh-n", text: String(n[v.id]) })]);
      b.addEventListener("click", function () { choose(v.id, true); });
      b.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight") j = (i + 1) % VIEWS.length;
        else if (k === "ArrowLeft") j = (i - 1 + VIEWS.length) % VIEWS.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = VIEWS.length - 1;
        if (j == null) return;
        e.preventDefault();
        choose(VIEWS[j].id, true);
      });
      sw.appendChild(b);
    });
    panel.setAttribute("aria-labelledby", "prh-tab-" + state.view);
    panel.appendChild(state.view === "records" ? viewRecords()
      : state.view === "sequences" ? viewSequences()
      : state.view === "procedures" ? viewProcedures() : viewCatalogs());
    wrap.appendChild(sw);
    wrap.appendChild(panel);
    wrap.appendChild(el("footer", { cls: "prh-foot" }, [
      el("p", {}, [el("strong", { text: "Beta draft. " }),
        "Every figure here comes from public catalogs, the state's Program Course File and the public MAP platform. The registry, the records and the procedures change as the census and the reads run again."]),
      el("p", { text: "Sources: program_source_registry (the weekly census, a person's corrections, each college's reading procedure) and program_requirement_records (each program's record and its display facts)." })
    ]));
    root.appendChild(wrap);
  }

  function choose(id, focus) {
    state.view = id;
    safeSet(VIEW_KEY, id);
    render();
    if (focus) {
      var b = document.getElementById("prh-tab-" + id);
      if (b) b.focus();
    }
  }

  function activate() {
    var saved = safeGet(VIEW_KEY);
    if (saved && VIEWS.some(function (v) { return v.id === saved; })) state.view = saved;
    render();
    if (!state.registry && !state.loading) load();
  }

  window.CPL_PROGRAM_REQUIREMENTS = {
    activate: activate,
    _state: state, _load: load, _render: render,
    catalogStatus: catalogStatus, filterRegistry: filterRegistry, recordChecks: recordChecks,
    ruleText: ruleText, procedureCounts: procedureCounts, award: award, span: span
  };
})();
