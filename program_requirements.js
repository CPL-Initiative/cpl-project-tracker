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
 * Five views, each read LIVE from tables anon may SELECT (no snapshot to go stale):
 *   Progress     the harvest as a workflow (Sam, 2026-10-07: "a workflow dashboard to
 *                monitor the progress like the attached"): five milestones with You are
 *                here, the eight parts, and, from kb/queue_status.json (the last
 *                checkpoint's word), the next step, the calls waiting on Sam and what
 *                changed. Definitions in MILESTONES and PARTS below.
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
 * Sierra docks at the top of the tab (Sam, open-asks sheet 38 card 5, 2026-10-05:
 * go; then "Sierra at the top", as on My College): a collapsible "Sierra AI"
 * section under the title, open until the reader closes it (the choice is
 * remembered), mounts the one CPL Assistant widget with CPL_CHAT.mountInto(host,
 * "program-requirements"), the pattern My College uses. The thread follows the
 * reader between the panes. cpl-chat reads an unknown surface as unscoped, so her
 * guidance stays unscoped until a deploy names this surface. Without the chat
 * module the section keeps the link to the CPL Assistant tab.
 *
 * Drafts for the college (Sam, open-asks sheet 32 card 2, 2026-10-04, as proposed): a
 * gap the college owns, where the catalog and the state's Program Course File list
 * different courses or MAP names a second course on an articulation, collects under
 * the college as a draft. The MAP team decides when to send; nothing goes to a
 * college on its own, and the tab only composes the text for a person to copy.
 *
 * A FAILED READ SAYS SO; it never renders as zero colleges or zero records.
 * Read-only: this tab writes nothing. Tests: tests/program_requirements.test.js
 */
(function () {
  "use strict";

  var ROOT_ID = "program-requirements-root";
  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  /* v2 (S343): Progress became the first view, so every reader lands on it once. */
  var VIEW_KEY = "cplProgramRequirements.view.v2";
  var SIERRA_KEY = "cplProgramRequirements.sierra.v1";
  /* Which sections are open (Sam, 2026-10-07: "make sure every section is collapsible and
     the tab has a collapse/expand all button"). One map for every view, keyed
     "<view>:<section>"; "*" holds the last Expand all or Collapse all, so the choice
     carries to the views not on screen. */
  var SECTIONS_KEY = "cplProgramRequirements.sections.v1";
  var SIERRA_SURFACE = "program-requirements";
  var CURRENT_YEAR = "2026-2027";

  var REGISTRY_SELECT = "college,catalog_url,catalog_year,catalog_platform,catalog_format," +
    "sequence_source,sequence_url,sequence_host,sequence_access,sequence_note,access_status," +
    "corrected_by,census_checked_at,census_run_id,procedure,procedure_by,procedure_at";
  var RECORD_SELECT = "college,control_number,program_title,award,catalog_year,source_url," +
    "measure,total_min,total_max,record,checks,checked,checked_by,checked_at,display";
  /* Written by every checkpoint (.claude/commands/checkpoint.md, scripts/queue_status.py):
     what no browser read can know. anon reads checked records only and has no grant on
     program_source_registry_history, so the unchecked records and the day's changes come
     from here, never from a widened policy. */
  var QUEUE_URL = "kb/queue_status.json";
  var PT = "America/Los_Angeles";

  var PLATFORM = { courseleaf: "CourseLeaf", curriqunet: "curriQunet", elumen: "eLumen", pdf: "PDF",
    custom_html: "College site", smartcatalog: "SmartCatalog", acalog: "Acalog", coursedog: "Coursedog" };
  var FORMAT = { html_per_program: "A page per program", single_pdf: "One PDF",
    pdf_by_section: "PDF by section", unknown: "Not yet known" };
  var SEQ = { ppm: "Program Mapper", program_map_page: "Program map page", none_found: "None found", unknown: "Not read" };
  var SEQ_LINKED = { ppm: 1, program_map_page: 1 };
  /* The column's check allows open, refused, unreached and not_read; "open" is a host the
     reader reached and read (Irvine Valley's and Santa Monica's map pages, S326). */
  var SEQ_ACCESS = { refused: "Refused the reader", not_read: "Not read yet", open: "Read", unreached: "Unreached", gone: "Gone" };
  var HOST_ACCESS = { open: "Open", refused: "Refused", unreached: "Unreached", gone: "Gone" };
  var VIEWS = [
    { id: "progress", label: "Progress" },
    { id: "catalogs", label: "Catalogs" },
    { id: "records", label: "Program records" },
    { id: "sequences", label: "Sequences" },
    { id: "procedures", label: "Procedures" }
  ];

  var state = { registry: null, records: null, error: null, loading: false, progress: null,
    view: "progress", q: "", show: "all", platform: "all", open: {}, secs: null };

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
  /* A call's links (Sam, 2026-10-08, on this view: "want to check the 2 items pending for me but don't see how
     to view them and respond", then "If you can embed the links on the tab, it would be fantastic"). `link` is
     where he answers (the decision sheet, named by `link_text`, e.g. "Answer on Open Asks Sheet 50, cards 1 and
     2"); `view` is where he sees the item, another COBI tab by its bare hash ("#cpl-pathways"), which opens in
     place, or an https page, which opens in a new tab. */
  function callLinks(c) {
    var out = [];
    if (c.link && /^https:\/\//.test(c.link)) out.push(link(c.link, c.link_text || "Open the decision sheet"));
    var v = c.view;
    if (v && v.href && v.text) {
      if (/^#[A-Za-z0-9_.~-]+$/.test(v.href)) out.push(el("a", { href: v.href, text: v.text }));
      else if (/^https:\/\//.test(v.href)) out.push(link(v.href, v.text));
    }
    return out.length ? el("p", { cls: "prh-pg-links" }, out) : null;
  }
  function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private window */ } }

  /* ── sections: every one collapsible, each remembered ── */
  function secs() {
    if (!state.secs) {
      try { state.secs = JSON.parse(safeGet(SECTIONS_KEY) || "{}") || {}; } catch (e) { state.secs = {}; }
    }
    return state.secs;
  }
  function secOpen(key) {
    var m = secs();
    return m[key] != null ? !!m[key] : m["*"] != null ? !!m["*"] : true;
  }
  function secSet(key, open) {
    secs()[key] = !!open;
    safeSet(SECTIONS_KEY, JSON.stringify(state.secs));
  }
  /* A section: a <details> whose summary carries its heading and, shut, the line that
     says what is inside, so a closed tab still reads. */
  function section(key, title, meta, kids, opts) {
    opts = opts || {};
    var d = el("details", { cls: "prh-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key }, [
      el("summary", { cls: "prh-sec-sum" }, [
        opts.label ? el("span", { cls: "prh-sec-label", text: opts.label }) : null,
        el(opts.h || "h3", { cls: "prh-sec-t", text: title }),
        meta ? el("span", { cls: "prh-sec-meta", text: meta }) : null]),
      el("div", { cls: "prh-sec-b" }, kids)]);
    if (secOpen(key)) d.setAttribute("open", "");
    d.addEventListener("toggle", function () { secSet(key, d.open); });
    return d;
  }
  /* Expand all and Collapse all act on every section, Sierra included (My College's
     literal reading: a control that silently exempts one section reads as broken). */
  function setAllSections(open, root) {
    state.secs = { "*": !!open };
    safeSet(SECTIONS_KEY, JSON.stringify(state.secs));
    safeSet(SIERRA_KEY, open ? "1" : "0");
    Array.prototype.forEach.call((root || document).querySelectorAll("details.prh-sec, details#prh-sierra"), function (d) {
      if (open) d.setAttribute("open", ""); else d.removeAttribute("open");
    });
  }

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
    var core = Promise.all([
      getJson(REST + "/program_source_registry?select=" + REGISTRY_SELECT + "&order=college"),
      getJson(REST + "/program_requirement_records?select=" + RECORD_SELECT + "&order=college,control_number")
    ]).then(function (got) {
      state.registry = got[0] || [];
      state.records = got[1] || [];
    }).catch(function (e) {
      state.error = (e && e.message) || "the read failed";
    });
    return Promise.all([core, loadProgress()]).then(function () {
      state.loading = false;
      render();
    });
  }
  /* The Progress view's own reads. Each fails on its own and says so in the part it
     feeds; none of them fails the tab, and none resolves to a zero. */
  function loadProgress() {
    var G = { addenda: null, active: null, queue: null, errors: {}, readAt: new Date() };
    function miss(k) { return function (e) { G.errors[k] = (e && e.message) || "the read failed"; }; }
    var countHeaders = headers();
    countHeaders.Prefer = "count=exact";
    return Promise.all([
      getJson(REST + "/program_source_addenda?select=college,status").then(function (r) { G.addenda = r || []; }, miss("A")),
      fetch(REST + "/coci_college_programs?select=control_number&status=eq.Active&limit=1", { headers: countHeaders })
        .then(function (r) {
          if (!r.ok) throw new Error("coci_college_programs answered " + r.status);
          var m = /\/(\d+)\s*$/.exec((r.headers && r.headers.get && r.headers.get("content-range")) || "");
          if (!m) throw new Error("coci_college_programs gave no count");
          G.active = Number(m[1]);
        }).catch(miss("active")),
      fetch(QUEUE_URL, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error(QUEUE_URL + " answered " + r.status);
          return r.json();
        }).then(function (j) {
          if (!j || typeof j !== "object" || !j.written_at) throw new Error(QUEUE_URL + " names no written_at");
          G.queue = j;
        }).catch(miss("Q"))
    ]).then(function () { state.progress = G; });
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
  /* A published map: the census found one (sequence_source), or a session's read recorded
     its host (sequence_host, which the census never writes). S345: Mt. San Antonio's
     Guided Pathways sequences sit on pages the census does not score, so its row reads
     none_found and still holds an open map. */
  function hasMap(r) { return r.sequence_source === "ppm" || r.sequence_source === "program_map_page" || !!r.sequence_host; }
  function filterRegistry(rows, q, show, plat, drafts) {
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
      if (show === "drafts") return !!(drafts && drafts[r.college] && drafts[r.college].length);
      return true;
    });
  }
  /* The gaps a college owns, gathered from its program records' display facts. */
  function collegeDrafts(records) {
    var out = {};
    (records || []).forEach(function (p) {
      ((p.display && p.display.gaps) || []).forEach(function (g) {
        if (g.owner !== "college") return;
        (out[p.college] = out[p.college] || []).push({ program: p.program_title, award: award(p.award),
          control_number: p.control_number, catalog_year: p.catalog_year, kind: g.kind, text: g.text });
      });
    });
    return out;
  }
  /* The draft a person copies. House voice: no bullets, the ask last and small. The MAP
     team edits it before anyone sends it. */
  function draftText(college, items) {
    items = items || [];
    var years = [], programs = [], by = {};
    items.forEach(function (i) {
      var y = yr(i.catalog_year);
      if (y && years.indexOf(y) < 0) years.push(y);
      var k = i.program + "|" + i.control_number;
      if (!by[k]) { by[k] = []; programs.push(i); }
      by[k].push(i.text);
    });
    var n = items.length;
    var out = ["The MAP team read " + college + "'s " + (years.length ? years.join(" and ") + " " : "") +
      "catalog for the CPL Initiative and compared each program's requirements with the state's Program Course File and with MAP. " +
      "The reading found " + (n === 1 ? "one item" : n + " items") + " for your review.", ""];
    programs.forEach(function (i) {
      out.push(i.program + " (" + (i.award ? i.award + ", " : "") + "control number " + i.control_number + ")");
      by[i.program + "|" + i.control_number].forEach(function (t) { out.push(t); });
      out.push("");
    });
    out.push("Your curriculum office and articulation officer keep these records, and the catalog may already be the current source for each. " +
      "Would you tell us which record is current, so that CPL Pathways shows your programs as you publish them?");
    return out.join("\n");
  }
  function draftsBox(college, items) {
    var id = "prh-draft-" + String(college).replace(/[^A-Za-z0-9]+/g, "-");
    var text = el("textarea", { id: id, cls: "prh-draft-text", readonly: "readonly", rows: "8" });
    text.value = draftText(college, items);
    var said = el("span", { cls: "prh-small prh-quiet", "aria-live": "polite" });
    var copy = el("button", { cls: "prh-toggle", type: "button", text: "Copy the draft" });
    copy.addEventListener("click", function () {
      function done() { said.textContent = "Copied. Paste it into a message to the college."; }
      text.focus(); text.select();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text.value).then(done, function () { said.textContent = "Selected. Copy it with your keyboard."; });
          return;
        }
        if (document.execCommand && document.execCommand("copy")) { done(); return; }
      } catch (e) { /* fall through */ }
      said.textContent = "Selected. Copy it with your keyboard.";
    });
    return el("details", { cls: "prh-notes prh-drafts" }, [
      el("summary", { text: "Drafts for the college (" + items.length + ")" }),
      el("p", { cls: "prh-small" , text: "Places where the college's own records disagree: the catalog and the state's Program Course File, or MAP. The MAP team decides when to send; nothing goes to a college on its own." }),
      el("ul", {}, items.map(function (i) { return el("li", { text: i.program + " (" + i.control_number + "): " + i.text }); })),
      el("label", { "for": id, cls: "prh-small", text: "The draft, to edit before sending" }),
      text,
      el("div", { cls: "prh-draft-actions" }, [copy, said])]);
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
      ".prh-ask { display:inline-flex; align-items:center; font-weight:700; color:var(--seal-blue-text); text-decoration:none; border:1px solid var(--border-strong); border-radius:8px; padding:6px 12px; min-height:40px; background:var(--surface-opaque); }",
      ".prh-ask:hover { border-color:var(--seal-blue-text); }",
      ".prh-sierra { margin:16px 0 20px; border:1px solid var(--border-strong); border-radius:11px; background:var(--surface); padding:4px 16px; }",
      ".prh-sierra > summary { cursor:pointer; min-height:44px; display:flex; align-items:center; font-weight:700; color:var(--text-strong); font-size:1.05rem; position:relative; padding-left:22px; list-style:none; }",
      ".prh-sierra > summary::-webkit-details-marker { display:none; }",
      ".prh-sierra > summary::before { content:\"\"; position:absolute; left:1px; top:50%; width:7px; height:7px; margin-top:-6px; border-right:2px solid var(--text-muted); border-bottom:2px solid var(--text-muted); transform:rotate(-45deg); transition:transform .12s ease; }",
      ".prh-sierra[open] > summary::before { transform:rotate(45deg); }",
      ".prh-sierra > summary:focus-visible { outline:2px solid var(--focus-ring, var(--cobalt)); outline-offset:2px; }",
      ".prh-sierra[open] > summary { border-bottom:1px solid var(--border); margin-bottom:10px; }",
      ".prh-sierra-lede { margin:0 0 10px; font-size:.875rem; color:var(--text-muted); max-width:var(--cpl-measure,none); }",
      ".prh-sierra-mount { padding-bottom:12px; }",
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
      ".prh-drafts { border:1px solid var(--border); border-radius:8px; background:var(--surface-subtle); padding:8px 14px; margin-bottom:10px; display:grid; gap:8px; }",
      ".prh-drafts[open] { padding-bottom:14px; }",
      ".prh-drafts p, .prh-drafts ul { margin:0; }",
      ".prh-draft-text { width:100%; box-sizing:border-box; font:inherit; font-size:.875rem; line-height:1.5; color:var(--text-body); background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:6px; padding:8px 10px; resize:vertical; }",
      ".prh-draft-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; }",
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
      /* sections: a <details> per section, its summary the heading plus a line that reads shut;
         the marker is drawn in CSS (a word-free disclosure, no glyph) */
      ".prh-allctl { display:flex; flex-wrap:wrap; gap:6px; }",
      ".prh-all { font:inherit; font-size:.875rem; font-weight:600; color:var(--text-body); background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:8px; padding:6px 12px; min-height:40px; cursor:pointer; }",
      ".prh-all:hover { border-color:var(--cobalt); }",
      ".prh-sec { border:1px solid var(--border); border-radius:10px; background:var(--surface-opaque); margin-bottom:12px; min-width:0; }",
      ".prh-sec-sum { list-style:none; cursor:pointer; position:relative; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 12px; padding:11px 14px 11px 36px; min-height:44px; box-sizing:border-box; border-radius:10px; }",
      ".prh-sec-sum::-webkit-details-marker { display:none; }",
      ".prh-sec-sum::before { content:\"\"; position:absolute; left:15px; top:19px; width:7px; height:7px; border-right:2px solid var(--text-muted); border-bottom:2px solid var(--text-muted); transform:rotate(-45deg); transition:transform .12s ease; }",
      ".prh-sec[open] > .prh-sec-sum::before { transform:rotate(45deg); top:16px; }",
      ".prh-sec-sum:hover .prh-sec-t { color:var(--cobalt); }",
      ".prh-sec-sum:focus-visible { outline:2px solid var(--focus-ring, var(--cobalt)); outline-offset:-2px; }",
      ".prh-sec-t { margin:0; font-size:1.05rem; color:var(--text-strong); }",
      ".prh-sec-meta { font-size:.875rem; color:var(--text-muted); font-variant-numeric:tabular-nums; }",
      ".prh-sec-label { flex:1 0 100%; font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-sec-b { padding:2px 14px 14px; min-width:0; }",
      ".prh-sec-b > .prh-facts { margin-block:4px 0; }",
      ".prh-sec-b > .prh-card { border:0; padding:4px 0 0; margin:0; background:none; }",
      /* the Progress view: the mock-up's layout on COBI's tokens; cobalt marks where the harvest is,
         crimson only what waits on a person */
      ".prh-pg { display:grid; gap:20px; }",
      ".prh-pg-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 16px; }",
      ".prh-pg-head h3 { margin:0; font-size:clamp(1.35rem, 3vw, 1.8rem); color:var(--text-strong); }",
      ".prh-pg .prh-sec-t { font-size:1rem; }",
      ".prh-pg-sub { color:var(--text-muted); font-size:1rem; }",
      ".prh-pg-meta { display:flex; flex-wrap:wrap; gap:6px 18px; margin:0; padding:0; list-style:none; width:100%; font-size:.9375rem; }",
      ".prh-pg-meta b { color:var(--text-strong); font-variant-numeric:tabular-nums; }",
      ".prh-pg-meta a { color:var(--cobalt); font-weight:700; }",
      ".prh-pg-waiting { color:var(--crimson); font-weight:700; }",
      ".prh-pg-lede { margin:0; }",
      ".prh-pg-label { font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); margin:0; }",
      ".prh-pg .prh-sec { margin:0; }",
      ".prh-pg-road > .prh-sec-b { padding:30px 16px 16px; }",
      ".prh-pg-steps { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); }",
      ".prh-pg-step { position:relative; display:grid; justify-items:center; align-content:start; text-align:center; gap:4px; padding:34px 4px 0; min-width:0; }",
      ".prh-pg-step::before { content:\"\"; position:absolute; top:15px; left:-50%; width:100%; border-top:3px solid var(--text-strong); }",
      ".prh-pg-step:first-child::before { display:none; }",
      ".prh-pg-step.prh-pg-next::before, .prh-pg-step.prh-pg-later::before { border-top:3px dashed var(--border-strong); }",
      ".prh-pg-step.prh-pg-here::before { border-top-color:var(--cobalt); }",
      ".prh-pg-node { position:absolute; top:4px; width:24px; height:24px; border-radius:50%; box-sizing:border-box; background:var(--surface-opaque); border:3px solid var(--border-strong); }",
      ".prh-pg-done .prh-pg-node { background:var(--text-strong); border-color:var(--text-strong); }",
      ".prh-pg-here .prh-pg-node { border-color:var(--cobalt); box-shadow:0 0 0 6px color-mix(in srgb, var(--cobalt) 14%, transparent); background:radial-gradient(circle, var(--cobalt) 0 5px, var(--surface-opaque) 6px); }",
      ".prh-pg-step h4 { margin:0; font-size:1rem; color:var(--text-strong); }",
      ".prh-pg-state { font-size:.875rem; color:var(--text-muted); }",
      ".prh-pg-here .prh-pg-state { color:var(--cobalt); font-weight:700; }",
      ".prh-pg-fact { font-size:.875rem; color:var(--text-body); font-variant-numeric:tabular-nums; }",
      ".prh-pg-youare { position:absolute; top:-22px; font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--cobalt); white-space:nowrap; }",
      ".prh-pg-left { margin:18px 0 0; padding-top:14px; border-top:1px solid var(--border); display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 12px; }",
      ".prh-pg-big { font-size:1.6rem; font-weight:700; color:var(--text-strong); line-height:1; font-variant-numeric:tabular-nums; }",
      ".prh-pg-chip { font-size:.875rem; padding:3px 10px; border-radius:999px; border:1px solid var(--border-strong); background:var(--surface-subtle); color:var(--text-body); }",
      ".prh-pg-main { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:20px; align-items:start; }",
      ".prh-pg-parts { min-width:0; }",
      ".prh-pg-grid { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; }",
      ".prh-pg-part { background:var(--surface-subtle); border:1px solid var(--border); border-radius:10px; padding:14px; display:grid; grid-template-rows:auto auto 1fr auto; gap:8px; min-width:0; }",
      ".prh-pg-part h4 { margin:0; font-size:1rem; color:var(--text-strong); }",
      ".prh-pg-status { font-size:.75rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-pg-part.prh-pg-going { border-color:var(--cobalt); }",
      ".prh-pg-part.prh-pg-going .prh-pg-status { color:var(--cobalt); }",
      ".prh-pg-call { border-color:var(--crimson); background:color-mix(in srgb, var(--crimson) 7%, var(--surface-opaque)); }",
      ".prh-pg-links { display:flex; flex-wrap:wrap; gap:.4rem 1rem; margin:.5rem 0 0; }",
      ".prh-pg-part.prh-pg-call .prh-pg-status, .prh-pg-box.prh-pg-call .prh-sec-label { color:var(--crimson); }",
      ".prh-pg-part.prh-pg-unread .prh-pg-status { color:var(--mustard-text); }",
      ".prh-pg-what { margin:0; font-size:.9rem; font-variant-numeric:tabular-nums; }",
      ".prh-pg-foot { margin:0; font-size:.8125rem; color:var(--text-muted); }",
      ".prh-pg-meter { height:6px; border-radius:3px; background:var(--border); overflow:hidden; }",
      ".prh-pg-meter i { display:block; height:100%; background:var(--cobalt); }",
      ".prh-pg-side { display:grid; gap:14px; min-width:0; }",
      ".prh-pg-box > .prh-sec-b { display:grid; gap:8px; }",
      ".prh-pg-box p { margin:0; font-size:.9rem; }",
      ".prh-pg-box a { color:var(--cobalt); font-weight:600; }",
      ".prh-pg-log { list-style:none; margin:0; padding:0; display:grid; gap:8px; }",
      ".prh-pg-log li { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:10px; font-size:.875rem; }",
      ".prh-pg-log time { color:var(--text-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }",
      "@media (max-width: 1180px) { .prh-pg-main { grid-template-columns:minmax(0, 1fr); } .prh-pg-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
      "@media (max-width: 760px) { .prh-pg-steps { grid-template-columns:minmax(0, 1fr); gap:18px; }" +
        " .prh-pg-step { justify-items:start; text-align:left; padding:0 0 0 40px; gap:2px; }" +
        /* vertical: each step draws the line down from its own node to the next one,
           styled by where it leads, so the line runs node to node whatever the text's height */
        " .prh-pg-step::before { display:none; }" +
        " .prh-pg-step:not(:last-child)::after { content:\"\"; position:absolute; left:11px; top:24px; bottom:-18px; border-left:3px solid var(--text-strong); }" +
        " .prh-pg-step.prh-pg-into-here::after { border-left-color:var(--cobalt); }" +
        " .prh-pg-step.prh-pg-into-next::after, .prh-pg-step.prh-pg-into-later::after { border-left:3px dashed var(--border-strong); }" +
        " .prh-pg-node { top:0; left:0; } .prh-pg-youare { position:static; order:-1; } .prh-pg-road > .prh-sec-b { padding-top:8px; } }",
      "@media (max-width: 560px) { .prh-pg-grid { grid-template-columns:minmax(0, 1fr); } .prh-pg-log li { grid-template-columns:minmax(0, 1fr); gap:0; } }",
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
    var drafts = collegeDrafts(state.records);
    var box = el("div");
    var withUrl = R.filter(function (r) { return r.catalog_url; }).length;
    var current = R.filter(function (r) { return r.catalog_year === CURRENT_YEAR; }).length;
    var maps = R.filter(hasMap).length;
    var person = R.filter(needsPerson).length;
    box.appendChild(el("p", { cls: "prh-lede", text: "The census reads every college's homepage each week, finds its current catalog, and records the address, the year the catalog names for itself, the platform it runs on, and any published term-by-term program map. A person's correction always stands over the census." }));
    box.appendChild(section("catalogs:glance", "At a glance", withUrl + " of " + R.length + " colleges with a catalog address", [
      el("div", { cls: "prh-facts" }, [
        fact(withUrl + " of " + R.length, "colleges with a catalog address"),
        fact(current, "name the " + yr(CURRENT_YEAR) + " year"),
        fact(maps, "publish a program map"),
        fact(person, "need a person: no address, or the last read was refused")
      ])]));
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
      ["procedure", "Has a reading procedure"], ["drafts", "Has drafts for the college"]
    ].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.show;
    var q = el("input", { id: "prh-q", type: "search", placeholder: "College name", autocomplete: "off" });
    q.value = state.q;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    var host = el("div");
    function draw() {
      state.q = q.value; state.show = showSel.value; state.platform = platSel.value;
      var rows = filterRegistry(R, state.q, state.show, state.platform, drafts);
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
        var nd = (drafts[r.college] || []).length;
        return [
          nd ? [r.college, el("span", { cls: "prh-alts", text: nd + (nd === 1 ? " draft" : " drafts") + " for the college, under Program records" })] : r.college,
          r.catalog_url ? link(r.catalog_url, (PLATFORM[r.catalog_platform] || "Catalog") + " catalog")
            : el("span", { cls: "prh-quiet", text: "No address yet" }),
          year,
          r.catalog_format ? (FORMAT[r.catalog_format] || r.catalog_format) : "",
          r.sequence_url && SEQ_LINKED[r.sequence_source] ? link(r.sequence_url, SEQ[r.sequence_source])
            : r.sequence_host ? el("span", { text: "Found by a read on " + r.sequence_host })
            : el("span", { cls: "prh-quiet", text: SEQ[r.sequence_source] || "" }),
          [el("span", { cls: st.c, text: st.t }),
            st.why ? el("span", { cls: "prh-alts", text: st.why }) : null,
            r.corrected_by ? el("span", { cls: "prh-alts", text: "Corrected by " + r.corrected_by }) : null]
        ];
      }), "Catalog registry, one row per college", true));
      count.textContent = "Showing " + rows.length + " of " + R.length;
    }
    [q, showSel, platSel].forEach(function (c) { c.addEventListener("input", draw); c.addEventListener("change", draw); });
    box.appendChild(section("catalogs:registry", "Every college", R.length + " colleges, one row each", [
      el("div", { cls: "prh-controls" }, [
        el("label", { "for": "prh-q" }, ["Find a college", q]),
        el("label", { "for": "prh-show" }, ["Show", showSel]),
        el("label", { "for": "prh-platform" }, ["Platform", platSel]),
        count
      ]), host]));
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
    box.appendChild(section("records:glance", "At a glance", passing + " of " + P.length + " records pass all four checks", [
      el("div", { cls: "prh-facts" }, [
        fact(P.length + " at " + Object.keys(colleges).length, "programs read, at that many colleges"),
        fact(passing + " of " + P.length, "records pass all four checks"),
        fact(equal, "totals agree with the catalog's"),
        fact(withCpl + " of " + P.length, "programs hold a course with CPL at the college")
      ])]));
    var drafts = collegeDrafts(P);
    var order = [], byCollege = {};
    P.forEach(function (p) {
      if (!byCollege[p.college]) { byCollege[p.college] = []; order.push(p.college); }
      byCollege[p.college].push(p);
    });
    order.forEach(function (c) {
      var list = byCollege[c];
      var reg = R.filter(function (r) { return r.college === c; })[0] || {};
      var nd = (drafts[c] || []).length;
      var meta = ((PLATFORM[reg.catalog_platform] || "") + " catalog, " + yr(list[0].catalog_year)).trim() + " · " +
        list.length + (list.length === 1 ? " program" : " programs") + (nd ? " · " + nd + (nd === 1 ? " draft" : " drafts") + " for the college" : "");
      box.appendChild(section("records:" + c, c, meta, [drafts[c] ? draftsBox(c, drafts[c]) : null].concat(list.map(recordCard)),
        { cls: "prh-college" }));
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
    var gaps = (disp.gaps || []).filter(function (g) { return g.owner !== "college"; });
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
    var read = rows.filter(function (r) { return r.sequence_access === "open"; }).length;
    box.appendChild(section("sequences:glance", "At a glance", read + " of " + rows.length + " maps read", [
      el("div", { cls: "prh-facts" }, [
        fact(rows.length, "colleges point to a program map"),
        fact(refused, "map hosts refused the reader"),
        fact(read, "maps read")
      ])]));
    if (!rows.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No college points to a program map yet." }));
      return box;
    }
    box.appendChild(section("sequences:colleges", "Colleges with a program map", rows.length + " colleges", [table([
      { label: "College", w: "24%" }, { label: "Source", w: "16%" }, { label: "Reader", w: "18%" }, { label: "Address and note", w: "42%" }
    ], rows.map(function (r) {
      var addr = r.sequence_url || ("https://" + r.sequence_host + "/");
      return [
        r.college,
        SEQ[r.sequence_source] || r.sequence_source || "",
        el("span", { cls: r.sequence_access === "refused" ? "prh-caution" : null, text: SEQ_ACCESS[r.sequence_access] || "Not asked" }),
        [link(addr, addr.replace(/^https?:\/\//, "")), r.sequence_note ? el("span", { cls: "prh-alts", text: r.sequence_note }) : null]
      ];
    }), "Colleges with a published program map", true)]));
    return box;
  }

  function viewProcedures() {
    var R = state.registry;
    var withP = R.filter(function (r) { return r.procedure; });
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "Each college's reading procedure: the hosts its agent reads and what each answered, every read it has run, what those reads settled, the questions still open, the college's nuances, and any request held for a person. A misread is fixed here, in the procedure, and the next read follows it." }));
    box.appendChild(section("procedures:glance", "At a glance", withP.length + " of " + R.length + " colleges have a reading procedure", [
      el("div", { cls: "prh-facts" }, [
        fact(withP.length + " of " + R.length, "colleges have a reading procedure"),
        fact(withP.reduce(function (s, r) { return s + procedureCounts(r.procedure).open; }, 0), "questions still open"),
        fact(withP.reduce(function (s, r) { return s + procedureCounts(r.procedure).held; }, 0), "requests to a college held")
      ])]));
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
    var card = el("div", { cls: "prh-card" });
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
    return section("procedures:" + r.college, r.college,
      "Version " + (p.v || "?") + " · written " + day(r.procedure_at) + (r.procedure_by ? " by " + r.procedure_by : ""), [card]);
  }

  /* ── the Progress view ──
   * Sam, 2026-10-07: "I want to pivot over to the Catalog ROEP work and the new COBI tab
   * needed to monitor the work... a workflow dashboard to monitor the progress like the
   * attached", run by his CPL Queue routine. "Yes start mock"; then, on the mock-up
   * (S343): "The mockup looks good to go". Mock-up:
   * https://claude.ai/artifact/6Pco7R1NVB5S45evjjfJsr (prototype/roep_progress_mockup.html).
   *
   * MILESTONES and PARTS are definitions. A session changes a milestone's words, what it
   * measures, or what is left before it HERE, and never touches the renderer below them.
   * Every function reads the context x that progressContext() builds from the live reads
   * and the status file:
   *   x.R  the registry, every college       x.P  the records anon may read (checked only)
   *   x.A  the addenda                       x.active  COCI's active programs
   *   x.Q  kb/queue_status.json, the last checkpoint's word
   * x.A, x.active and x.Q are null when their read failed; a definition that needs one
   * names it in `needs`, and the view then says the read failed instead of drawing a zero.
   * A milestone is done when nothing is left before it; the first one not done is You are
   * here. A left item whose count is null (its read failed) keeps the milestone open.
   */
  var PILOT_PROGRAMS = 20;
  var MILESTONES = [
    { id: "catalogs", title: "Find every catalog",
      fact: function (x) { return x.withUrl + " of " + x.R.length + " colleges"; },
      when: function (x) { return x.censusDay ? x.censusDay + " census" : ""; },
      left: function (x) { return [[x.R.length - x.withUrl, "college needs a catalog address", "colleges need a catalog address"]]; } },
    { id: "pilot", title: "Read the pilot",
      fact: function (x) { return x.checked + " programs checked"; },
      when: function (x) { return x.checkedDay; },
      left: function (x) { return [[PILOT_PROGRAMS - x.checked, "pilot program to check", "pilot programs to check"]]; } },
    /* Sam, Open Asks Sheet 50 card 5 (2026-10-08, as proposed): a published map counts toward this
       milestone when it is read, or when the college's procedure records its host refused or unreached
       and names the other routes tried (procedure.workarounds). The refused count stays on the part. */
    { id: "maps", title: "Read program maps",
      fact: function (x) { return x.mapsSettled + " of " + x.mapsPublished + " published maps settled"; },
      left: function (x) {
        return [[x.mapsPublished - x.mapsSettled, "published map to read or settle", "published maps to read or settle"],
          [x.unchecked, "new record to check", "new records to check"],
          [x.addendaUnread, "catalog addendum to read", "catalog addenda to read"]];
      } },
    { id: "procedures", title: "A procedure per college",
      fact: function (x) { return x.procedures + " of " + x.R.length + " written"; },
      left: function (x) { return [[x.R.length - x.procedures, "college without a reading procedure", "colleges without a reading procedure"]]; } },
    { id: "every", title: "Every program", needs: ["active"],
      fact: function (x) { return fmt(x.active) + " active programs"; },
      left: function (x) { return [[x.active == null ? null : x.active - x.readTotal, "active program to read", "active programs to read"]]; } }
  ];
  /* status(x) answers one of the STATUS keys; meter(x) answers [have, of, verb]; a note in
     the status file (notes.<id>) replaces a part's foot. */
  var PARTS = [
    { id: "census", title: "Catalog census",
      status: function (x) { return x.withUrl >= x.R.length ? "done" : "going"; },
      what: function (x) { return x.withUrl + " colleges have a catalog address; " + x.currentYear + " name " + CURRENT_YEAR + "."; },
      foot: function (x) { return "Weekly; next apply " + x.nextCensus; } },
    { id: "reading", title: "Catalog reading",
      status: function (x) { return x.checked >= PILOT_PROGRAMS ? "pilot" : x.readTotal ? "going" : "not"; },
      what: function (x) {
        return (x.unchecked == null ? x.checked + " checked programs" : x.readTotal + " programs") +
          " read at " + x.recordColleges + " colleges.";
      },
      foot: function (x) { return x.newest; } },
    { id: "checks", title: "The four checks", needs: ["Q"],
      status: function (x) { return x.unchecked ? "call" : "done"; },
      what: function (x) { return x.checked + " of " + x.readTotal + " programs checked."; },
      meter: function (x) { return [x.checked, x.readTotal, "checked"]; },
      foot: function (x) {
        return x.unchecked ? x.unchecked + (x.unchecked === 1 ? " waits on " : " wait on ") + x.decider + "'s reading"
          : "Every record read is checked";
      } },
    { id: "maps", title: "Program maps",
      status: function (x) { return x.mapsRead >= x.mapsPublished ? "done" : x.mapsRead ? "going" : "not"; },
      what: function (x) { return x.mapsRead + " of the " + x.mapsPublished + " published maps read."; },
      meter: function (x) { return [x.mapsRead, x.mapsPublished, "read"]; },
      foot: function (x) {
        return (x.mapsReadAt.length ? "Read: " + joinAnd(x.mapsReadAt) + ". " : "") + x.mapsRefused + " refused the reader.";
      } },
    { id: "procedures", title: "Reading procedures",
      status: function (x) {
        return x.procedures >= x.R.length ? "done" : x.here === "procedures" ? "going" : x.next === "procedures" ? "next"
          : x.procedures ? "going" : "not";
      },
      what: function (x) { return x.procedures + " of " + x.R.length + " colleges have one."; },
      meter: function (x) { return [x.procedures, x.R.length, "written"]; },
      foot: function (x) { return x.procedureList; } },
    { id: "addenda", title: "Catalog addenda", needs: ["A"],
      status: function (x) { return !x.addendaUnread ? "done" : x.addendaRead ? "going" : "not"; },
      what: function (x) {
        return x.addendaTotal + " found at " + x.addendaColleges + " colleges; " + (x.addendaRead ? x.addendaRead + " read" : "none read") + ".";
      },
      foot: function (x) { return "Next census apply " + x.nextCensus; } },
    { id: "figures", title: "CPL figures",
      status: function (x) { return x.builds.length === 1 ? "done" : x.builds.length ? "going" : "not"; },
      what: function (x) {
        return x.builds.length === 1 ? "Build " + x.builds[0] + " on every checked program (" + x.checked + ")."
          : x.builds.length ? x.builds.length + " builds across the checked programs." : "No checked program carries a display build.";
      },
      foot: function (x) { return x.builtDay ? "Built " + x.builtDay : ""; } },
    { id: "sierra", title: "Sierra and CPL Pathways",
      status: function () { return "live"; },
      what: function () { return "Sierra quotes a checked program's requirements; CPL Pathways draws every record, each marked."; },
      foot: function () { return ""; } }
  ];
  var STATUS = { done: "Done", pilot: "Done for the pilot", live: "Live", going: "In progress", next: "Next",
    not: "Not started", call: "Waiting on " };
  var SOURCE = { A: "The addenda table", active: "COCI's count of active programs", Q: "The queue's status file (" + QUEUE_URL + ")" };

  function toDate(v) {
    if (!v) return null;
    var d = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(v + "T12:00:00Z") : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function ptDay(d) { return d.toLocaleDateString("en-US", { timeZone: PT, month: "short", day: "numeric" }); }
  function ptTime(d) { return d.toLocaleTimeString("en-US", { timeZone: PT, hour: "numeric", minute: "2-digit" }) + " PT"; }
  function dayOf(v) { var d = toDate(v); return d ? ptDay(d) : ""; }
  function stampOf(v) { var d = toDate(v); return d ? ptDay(d) + ", " + ptTime(d) : ""; }
  function timeOf(v, now) { var d = toDate(v); return !d ? "" : ptDay(d) === ptDay(now) ? ptTime(d) : ptDay(d) + ", " + ptTime(d); }
  function short(c) { return String(c || "").replace(/\s+College$/, ""); }
  function joinAnd(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function latest(vals) { return vals.filter(Boolean).sort().pop() || null; }
  /* The census applies on main every Sunday at 10:29 UTC (program-source-census.yml). */
  function nextWeekly(now, dow, h, m) {
    var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m));
    d.setUTCDate(d.getUTCDate() + (dow - d.getUTCDay() + 7) % 7);
    if (d <= now) d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }
  /* The routine's next firing, as the checkpoint read it, rolled forward past now. */
  function nextRun(q, now) {
    var r = q && q.next_run, at = r && toDate(r.at);
    if (!at) return null;
    var step = (Number(r.every_hours) || 0) * 3600000;
    while (step && at <= now) at = new Date(at.getTime() + step);
    return at > now ? at : null;
  }

  function progressContext(now) {
    var R = state.registry || [], P = state.records || [], G = state.progress || { errors: {} };
    var Q = G.queue || null, A = G.addenda || null;
    var P1 = P.filter(function (p) { return p.checked; });
    var unl = Q && Array.isArray(Q.unchecked) ? Q.unchecked : null;
    var published = R.filter(hasMap);
    var mapsRead = published.filter(function (r) { return r.sequence_access === "open"; });
    var mapsSettled = published.filter(function (r) {
      if (r.sequence_access === "open") return true;
      var p = r.procedure;
      return (r.sequence_access === "refused" || r.sequence_access === "unreached") && !!p &&
        Array.isArray(p.workarounds) && p.workarounds.length > 0;
    });
    var procs = R.filter(function (r) { return r.procedure; });
    var liveA = A ? A.filter(function (a) { return ["listed", "read", "applied"].indexOf(a.status) >= 0; }) : null;
    var colleges = {};
    P1.forEach(function (p) { colleges[p.college] = 1; });
    (unl || []).forEach(function (u) { colleges[u.college] = 1; });
    var builds = [];
    P1.forEach(function (p) { var b = p.display && p.display.build; if (b && builds.indexOf(b) < 0) builds.push(b); });
    var newCols = [];
    (unl || []).forEach(function (u) { var c = short(u.college); if (c && newCols.indexOf(c) < 0) newCols.push(c); });
    var procList = procs.map(function (r) { return short(r.college) + (r.procedure.v != null ? " v" + r.procedure.v : ""); });
    var x = {
      R: R, P: P1, A: A, Q: Q, active: G.active == null ? null : G.active, errors: G.errors || {}, now: now,
      decider: (Q && Q.decider) || "Sam",
      withUrl: R.filter(function (r) { return r.catalog_url; }).length,
      currentYear: R.filter(function (r) { return r.catalog_year === CURRENT_YEAR; }).length,
      censusDay: dayOf(latest(R.map(function (r) { return r.census_checked_at; }))),
      nextCensus: ptDay(nextWeekly(now, 0, 10, 29)),
      checked: P1.length, unchecked: unl ? unl.length : null, readTotal: P1.length + (unl ? unl.length : 0),
      checkedDay: dayOf(latest(P1.map(function (p) { return p.checked_at; }))),
      recordColleges: Object.keys(colleges).length,
      newest: newCols.length ? joinAnd(newCols) + " added " + dayOf(latest(unl.map(function (u) { return u.loaded; }))) : "",
      mapsPublished: published.length, mapsRead: mapsRead.length, mapsSettled: mapsSettled.length,
      mapsReadAt: mapsRead.map(function (r) { return short(r.college); }),
      mapsRefused: published.filter(function (r) { return r.sequence_access === "refused"; }).length,
      procedures: procs.length,
      procedureList: procList.length > 4 ? procList.slice(0, 3).join(", ") + " and " + (procList.length - 3) + " more" : procList.join(", "),
      addendaTotal: liveA ? liveA.length : null,
      addendaColleges: liveA ? Object.keys(liveA.reduce(function (o, a) { o[a.college] = 1; return o; }, {})).length : null,
      addendaRead: liveA ? liveA.filter(function (a) { return a.status !== "listed"; }).length : null,
      addendaUnread: liveA ? liveA.filter(function (a) { return a.status === "listed"; }).length : null,
      builds: builds, builtDay: dayOf(latest(P1.map(function (p) { return p.display && p.display.built; })))
    };
    /* Where the harvest stands: every milestone before the first one with anything left is
       done; that one is You are here, the one after it is next. */
    var hereAt = -1;
    x.steps = MILESTONES.map(function (m, i) {
      var missing = (m.needs || []).filter(function (k) { return x[k] == null; });
      var left = m.left(x).filter(function (l) { return l[0] == null || l[0] > 0; });
      if (hereAt < 0 && left.length) hereAt = i;
      return { m: m, missing: missing, left: left };
    });
    x.steps.forEach(function (s, i) {
      s.state = hereAt < 0 || i < hereAt ? "done" : i === hereAt ? "here" : i === hereAt + 1 ? "next" : "later";
    });
    x.here = hereAt < 0 ? null : MILESTONES[hereAt].id;
    x.next = hereAt < 0 || hereAt + 1 >= MILESTONES.length ? null : MILESTONES[hereAt + 1].id;
    return x;
  }
  function missingText(keys, x) {
    return keys.map(function (k) { return SOURCE[k] + " could not be read (" + (x.errors[k] || "not read yet") + ")."; }).join(" ");
  }
  /* Each part, as the view shows it: [status key, status words, what, foot, meter]. */
  function partView(p, x) {
    var missing = (p.needs || []).filter(function (k) { return x[k] == null; });
    if (missing.length) return { key: "unread", word: "Could not be read", what: missingText(missing, x), foot: "", meter: null };
    var key = p.status(x);
    var note = x.Q && x.Q.notes && typeof x.Q.notes[p.id] === "string" ? x.Q.notes[p.id] : null;
    return { key: key, word: key === "call" ? STATUS.call + x.decider : STATUS[key], what: p.what(x),
      foot: note != null ? note : p.foot(x), meter: p.meter ? p.meter(x) : null };
  }

  function viewProgress() {
    var now = new Date();
    var x = progressContext(now);
    var Q = x.Q, G = state.progress || {};
    var box = el("div", { cls: "prh-pg" });

    /* header: what was read when, and the queue's run */
    var meta = el("ul", { cls: "prh-pg-meta", "aria-label": "Run status" });
    meta.appendChild(el("li", {}, ["Read ", el("b", { text: stampOf(G.readAt || now) })]));
    if (Q) {
      var who = (Q.session ? "S" + Q.session + " " : "") + (Q.moniker || "");
      var ran = el("li", {}, ["Last run ",
        Q.handoff ? link("https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/" + Q.handoff, who.trim())
          : el("b", { text: who.trim() }),
        (Q.run ? " (" + Q.run + ")" : "") + ", " + stampOf(Q.written_at)]);
      meta.appendChild(ran);
      var nr = nextRun(Q, now);
      meta.appendChild(el("li", {}, ["Next " + ((Q.next_run && Q.next_run.name) || "queue") + " run ",
        el("b", { text: nr ? stampOf(nr) : "not on record" })]));
      var calls = Array.isArray(Q.calls) ? Q.calls : [];
      meta.appendChild(el("li", { cls: calls.length ? "prh-pg-waiting" : "prh-quiet",
        text: calls.length ? calls.length + " waiting on " + x.decider : "Nothing waiting on " + x.decider }));
    } else {
      meta.appendChild(el("li", { cls: "prh-caution", text: missingText(["Q"], x) }));
    }
    box.appendChild(el("header", { cls: "prh-pg-head" }, [
      el("h3", { text: "Catalog ROEP harvest" }), el("span", { cls: "prh-pg-sub", text: "Progress" }), meta]));
    box.appendChild(el("p", { cls: "prh-lede prh-pg-lede", text: "Where the harvest stands. The milestones and parts are read live from the harvest's tables on each visit; the next step, the calls and what changed come from the last session's checkpoint." }));

    /* the milestone line */
    var steps = el("ol", { cls: "prh-pg-steps" });
    x.steps.forEach(function (s, i) {
      var m = s.m, into = x.steps[i + 1] ? " prh-pg-into-" + x.steps[i + 1].state : "";
      var stateText = s.state === "done" ? "Done" + (m.when && m.when(x) ? " · " + m.when(x) : "")
        : s.state === "here" ? "In progress" : s.state === "next" ? "Next milestone" : "Later";
      steps.appendChild(el("li", { cls: "prh-pg-step prh-pg-" + s.state + into, "aria-current": s.state === "here" ? "step" : null }, [
        s.state === "here" ? el("span", { cls: "prh-pg-youare", text: "You are here" }) : null,
        el("span", { cls: "prh-pg-node", "aria-hidden": "true" }),
        el("h4", { text: m.title }),
        el("span", { cls: "prh-pg-state", text: stateText }),
        el("span", { cls: "prh-pg-fact", text: s.missing.length ? "Could not be read" : m.fact(x) })]));
    });
    var here = x.steps.filter(function (s) { return s.state === "here"; })[0];
    var roadKids = [steps];
    if (here) {
      roadKids.push(el("p", { cls: "prh-pg-left" }, [
        el("span", { cls: "prh-pg-big", text: String(here.left.length) }),
        el("span", { cls: "prh-pg-label", text: "left before the next milestone" })].concat(here.left.map(function (l) {
          return el("span", { cls: "prh-pg-chip", text: l[0] == null ? l[2].charAt(0).toUpperCase() + l[2].slice(1) + " (could not be read)"
            : fmt(l[0]) + " " + (l[0] === 1 ? l[1] : l[2]) });
        }))));
    } else {
      roadKids.push(el("p", { cls: "prh-pg-left" }, [el("span", { cls: "prh-pg-label", text: "Every milestone is done" })]));
    }
    box.appendChild(section("progress:milestones", "Milestones", here ? "You are here: " + here.m.title : "Every milestone is done",
      roadKids, { cls: "prh-pg-road", h: "h4" }));

    /* the parts, beside what needs a person */
    var views = PARTS.map(function (p) { return { p: p, v: partView(p, x) }; });
    var doneN = views.filter(function (o) { return ["done", "pilot", "live"].indexOf(o.v.key) >= 0; }).length;
    var grid = el("ul", { cls: "prh-pg-grid" });
    views.forEach(function (o) {
      var v = o.v, kids = [el("h4", { text: o.p.title }), el("span", { cls: "prh-pg-status", text: v.word }),
        el("p", { cls: "prh-pg-what", text: v.what })];
      if (v.meter && v.meter[1] > 0) {
        var pct = Math.max(0, Math.min(100, v.meter[0] / v.meter[1] * 100));
        kids.push(el("div", { cls: "prh-pg-meter", role: "img", "aria-label": v.meter[0] + " of " + v.meter[1] + " " + v.meter[2] }, [
          el("i", { style: "width:" + (Math.round(pct * 10) / 10) + "%" })]));
      }
      kids.push(el("p", { cls: "prh-pg-foot", text: v.foot || "" }));
      grid.appendChild(el("li", { cls: "prh-pg-part prh-pg-" + v.key }, kids));
    });
    var parts = section("progress:parts", "Parts of the harvest", doneN + " of " + PARTS.length + " done", [grid],
      { cls: "prh-pg-parts", h: "h4" });

    var side = el("aside", { cls: "prh-pg-side", "aria-label": "What happens next" });
    if (!Q) {
      var unread = section("progress:next", "Next step", null, [
        el("p", { text: missingText(["Q"], x) + " The next step, the calls and what changed come from it; the milestones and parts are read live." })],
        { cls: "prh-pg-box", h: "h4" });
      unread.setAttribute("role", "status");
      side.appendChild(unread);
    } else {
      if (Q.next_step && Q.next_step.title) side.appendChild(section("progress:next", Q.next_step.title, null,
        [Q.next_step.text ? el("p", { text: Q.next_step.text }) : null], { cls: "prh-pg-box", h: "h4", label: "Next step" }));
      (Array.isArray(Q.calls) ? Q.calls : []).forEach(function (c, i) {
        side.appendChild(section("progress:call:" + i, c.title || "", null, [
          c.text ? el("p", { text: c.text }) : null,
          c.if_no_reply ? el("p", { cls: "prh-pg-foot", text: "No reply: " + c.if_no_reply }) : null,
          callLinks(c)],
          { cls: "prh-pg-box prh-pg-call", h: "h4", label: "Needs " + x.decider + "'s call" }));
      });
      var ch = Array.isArray(Q.changes) ? Q.changes : [];
      if (ch.length) side.appendChild(section("progress:changes", "Changed recently", ch.length + (ch.length === 1 ? " change" : " changes"), [
        el("ol", { cls: "prh-pg-log" }, ch.map(function (c) {
          var d = toDate(c.at);
          return el("li", {}, [el("span", { text: c.text || "" }),
            d ? el("time", { datetime: d.toISOString(), text: timeOf(c.at, now) }) : el("span")]);
        }))], { cls: "prh-pg-box", h: "h4" }));
    }
    box.appendChild(el("div", { cls: "prh-pg-main" }, [parts, side]));
    return box;
  }

  /* ── frame ── */
  function counts() {
    var R = state.registry || [], P = state.records || [];
    return { progress: null, catalogs: R.length, records: P.length,
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
    var meta = el("p", { cls: "prh-meta" });
    var titlerow = el("div", { cls: "prh-titlerow" }, [
      el("h2", {}, ["Program Requirements", el("span", { cls: "prh-draft", text: "Beta draft" })])]);
    wrap.appendChild(el("header", { cls: "prh-mast" }, [
      titlerow,
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
    var allctl = el("div", { cls: "prh-allctl", role: "group", "aria-label": "Every section on this tab" }, [
      el("button", { type: "button", cls: "prh-all", "data-all": "open", text: "Expand all" }),
      el("button", { type: "button", cls: "prh-all", "data-all": "close", text: "Collapse all" })]);
    Array.prototype.forEach.call(allctl.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { setAllSections(b.getAttribute("data-all") === "open", root); });
    });
    titlerow.appendChild(allctl);
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
        [v.label, n[v.id] == null ? null : el("span", { cls: "prh-n", text: String(n[v.id]) })]);
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
    panel.appendChild(state.view === "progress" ? viewProgress()
      : state.view === "records" ? viewRecords()
      : state.view === "sequences" ? viewSequences()
      : state.view === "procedures" ? viewProcedures() : viewCatalogs());
    var sierra = el("details", { cls: "prh-sierra", id: "prh-sierra" }, [
      el("summary", { text: "Sierra AI" }),
      el("p", { cls: "prh-sierra-lede", text: "Ask Sierra about a program's requirements, its record, or how a college's catalog is read." }),
      el("div", { cls: "prh-sierra-mount", id: "prh-sierra-mount" }, [
        el("a", { cls: "prh-ask", href: "#chatbot", text: "Open the CPL Assistant" })])]);
    if (safeGet(SIERRA_KEY) !== "0") sierra.setAttribute("open", "");
    sierra.addEventListener("toggle", function () { safeSet(SIERRA_KEY, sierra.open ? "1" : "0"); });
    wrap.appendChild(sierra);
    wrap.appendChild(sw);
    wrap.appendChild(panel);
    wrap.appendChild(el("footer", { cls: "prh-foot" }, [
      el("p", {}, [el("strong", { text: "Beta draft. " }),
        "Every figure here comes from public catalogs, the state's Program Course File and the public MAP platform. The registry, the records and the procedures change as the census and the reads run again."]),
      el("p", { text: "Sources: program_source_registry (the weekly census, a person's corrections, each college's reading procedure) and program_requirement_records (each program's record and its display facts)." })
    ]));
    root.appendChild(wrap);
    mountSierra(root);
  }

  /* The one CPL Assistant widget, mounted into this tab's section. Returns false
   * (and the section keeps its link) when the chat module has not loaded. */
  function mountSierra(root) {
    var C = window.CPL_CHAT, host = root && root.querySelector("#prh-sierra-mount");
    if (!host || !C || typeof C.mountInto !== "function") return false;
    try { C.mountInto(host, SIERRA_SURFACE); return true; } catch (e) { return false; }
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
    _state: state, _load: load, _render: render, mountSierra: mountSierra, SIERRA_SURFACE: SIERRA_SURFACE,
    catalogStatus: catalogStatus, filterRegistry: filterRegistry, recordChecks: recordChecks,
    ruleText: ruleText, procedureCounts: procedureCounts, award: award, span: span,
    collegeDrafts: collegeDrafts, draftText: draftText,
    MILESTONES: MILESTONES, PARTS: PARTS, progressContext: progressContext, nextRun: nextRun, nextWeekly: nextWeekly
  };
})();
