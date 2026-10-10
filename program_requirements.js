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
 *                monitor the progress like the attached"): a headline pairing COCI's
 *                active programs with the checked ones (Sam, 2026-10-08, for the
 *                Chancellor; headlineBand below), five milestones with You are
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
 * Flags and a person's reading (Sam, Open Asks Sheet 51 card 1, "build", 2026-10-08, on
 * the mock-up prototype/roep_record_flags_mockup.html): each question the reading raised
 * sits on the block it concerns as a numbered flag that names who fixes it (the college
 * or the reading procedure), and each record ends with Confirm and Needs a fix for a
 * reviewer signed in with the magic link. That is this tab's one write:
 * rpc/program_record_verdict_add (chatbox/supabase_program_record_verdicts.sql), gated to
 * an allowed reviewer on the server, holding the fingerprint of the requirements the page
 * showed. A signed-in reviewer also reads the unchecked records, which the public read
 * never shows.
 *
 * A FAILED READ SAYS SO; it never renders as zero colleges or zero records.
 * Tests: tests/program_requirements.test.js
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
  /* Which catalog hosts let another site frame their pages, measured from COBI's origin by
     scripts/catalog_framing.py on a runner (the session container cannot reach college sites)
     and committed by a session. A host not in it is unknown: the side by side view frames it
     and keeps its own window one word away. */
  var FRAMING_URL = "kb/catalog_framing.json";
  /* The reading room (Sam, 2026-10-10): a record opened in a window of its own on the right
     half carries ?prh_split=<college>|<control number>; a verdict saved there pings the tab
     that opened it through this key, so its cards and counts catch up. */
  var RECORD_KEY = (function () {
    try { return new URLSearchParams(window.location.search).get("prh_split") || null; } catch (e) { return null; }
  })();
  var PING_KEY = "cplProgramRequirements.verdictPing.v1";
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

  /* The one write (Sheet 51 card 1). A reviewer's verdict on a record, held to the
     fingerprint of the requirements the page showed (requirements_fp, a computed field). */
  var VERDICT_RPC = "/rpc/program_record_verdict_add";
  var VERDICT_SELECT = "id,college,control_number,verdict,note,requirements_fp,checked_after,by_email,at";
  /* Gap kinds that stay notes for the reading procedure; every other gap is a flag. */
  var NOTE_KINDS = { "Reader's note": 1, "Fixed by a rerun": 1 };

  var state = { registry: null, records: null, error: null, loading: false, progress: null,
    view: "progress", q: "", show: "all", platform: "all", rq: "", rshow: "all", rcollege: "all", open: {}, secs: null,
    review: null, sessionWired: false, framing: null };

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
  /* A call that names records lists them on its card, each with Confirm and Needs a fix
     (Sam, 2026-10-09, on his phone at this card: "can we add a way to respond on the sheet
     that you could read?"). The answer is the verdict the Records view writes, through the
     same one RPC, so a session reads it from program_record_verdicts. Each record opens to
     its catalog page, its verdict box and a word that opens it on Program records. */
  function callRefs(c) {
    return (c && Array.isArray(c.records) ? c.records : []).filter(function (r) { return r && r.college && r.control_number; });
  }
  function findRecord(rows, ref) {
    return rows ? rows.filter(function (r) { return r.college === ref.college && r.control_number === ref.control_number; })[0] || null : null;
  }
  function recordFor(ref) {
    return findRecord(state.review && state.review.records, ref) || findRecord(state.records, ref);
  }
  /* Answered: a verdict on the record's current requirements, or checked. A record the
     reader cannot see counts as open. */
  function refAnswered(ref) { var p = recordFor(ref); return !!p && !stateLine(p).waiting; }
  function callAnswered(c) { var refs = callRefs(c); return refs.length > 0 && refs.every(refAnswered); }
  /* The check Sam asked for on a finished call (2026-10-10: "it would be nice to have a check
     mark on the block"): drawn in CSS, ghosted, beside the word that says it. */
  function doneMark() { return el("span", { cls: "prh-done-mark", "aria-hidden": "true" }); }
  /* After a verdict: the cards, the waiting count and the to-do word catch up in place. */
  function refreshCalls() {
    var root = document.getElementById(ROOT_ID), Q = state.progress && state.progress.queue;
    if (!root || !Q || !Array.isArray(Q.calls)) return;
    var who = Q.decider || "Sam";
    Array.prototype.forEach.call(root.querySelectorAll("[data-call]"), function (card) {
      var c = Q.calls[Number(card.getAttribute("data-call"))];
      if (!c) return;
      var done = callAnswered(c), label = card.querySelector(".prh-sec-label");
      card.classList.toggle("prh-pg-answered", done);
      card.classList.toggle("prh-pg-call", !done);
      if (label) { label.textContent = ""; if (done) label.appendChild(doneMark()); label.appendChild(document.createTextNode(done ? "Answered" : "Needs " + who + "'s call")); }
      Array.prototype.forEach.call(card.querySelectorAll(".prh-callrec[data-key]"), function (d) {
        var k = d.getAttribute("data-key").split("|");
        d.classList.toggle("prh-answered", refAnswered({ college: k[0], control_number: k.slice(1).join("|") }));
      });
    });
    var li = document.getElementById("prh-pg-waitcount");
    if (li) {
      var n = Q.calls.filter(function (c) { return !callAnswered(c); }).length;
      li.textContent = n ? n + " waiting on " + who : "Nothing waiting on " + who;
      li.className = n ? "prh-pg-waiting" : "prh-quiet";
    }
    refreshTodo();
  }
  function callRecords(c) {
    var refs = callRefs(c);
    if (!refs.length) return null;
    var Rv = state.review;
    var mine = Rv && Rv.records ? Rv.records : null;
    var items = refs.map(function (ref) {
      var p = findRecord(mine, ref);
      var name = ref.label || (p ? p.program_title + " " + award(p.award) : shortCollege(ref.college));
      var sl = p && p.requirements_fp ? stateLine(p) : null;
      var line = el("span", { cls: "prh-state" + (sl && sl.waiting ? " prh-state-waiting" : ""), text: sl ? sl.text : "" });
      var read = el("button", { cls: "prh-word", type: "button", text: "Open it on Program records" });
      read.addEventListener("click", function () {
        state.rq = ref.control_number; state.rshow = "all"; state.rcollege = ref.college;
        choose("records", true);
      });
      var body = [el("p", { cls: "prh-pg-links" }, [p && p.source_url ? link(p.source_url, "The catalog page") : null,
        p && p.source_url ? splitButton(p) : null, read])];
      if (p && p.requirements_fp) body.push(verdictBox(p, flagsFor(p).flags, line));
      var key = ref.college + "|" + ref.control_number;
      var sum = el("summary", {}, [el("span", { cls: "prh-callrec-t" }, [doneMark(), el("b", { text: ref.control_number }), " " + name]), line]);
      /* Opening a record starts the reading side by side (Sam, 2026-10-10: "The side by side view
         should be the default view when I click in to start confirming"). */
      if (p && p.source_url && p.requirements_fp) {
        sum.setAttribute("data-split", key);
        sum.addEventListener("click", function (e) { e.preventDefault(); openSplit(p, sum); });
      }
      return el("details", { cls: "prh-callrec" + (refAnswered(ref) ? " prh-answered" : ""), "data-key": key }, [
        sum, el("div", { cls: "prh-callrec-b" }, body)]);
    });
    var head = mine ? el("p", { cls: "prh-small prh-quiet", text: "Open a record to read it beside its catalog page and answer there." })
      : Rv && Rv.error ? el("p", { cls: "prh-small prh-caution", role: "status", text: "Your sign-in could not read the records (" + Rv.error + "). Reload the tab to answer here." })
      : signInBox();
    return el("div", { cls: "prh-callrecs" }, [head].concat(items));
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
        opts.label ? el("span", { cls: "prh-sec-label" }, [opts.mark ? doneMark() : null, opts.label]) : null,
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
    return Promise.all([core, loadProgress(), loadReview(), loadFraming()]).then(function () {
      state.loading = false;
      render();
      if (RECORD_KEY && !state.recordOpened) { state.recordOpened = true; openKey(RECORD_KEY); }
    });
  }

  /* ── a reviewer's session (cpl_session.js keeps it; the server decides who may write) ── */
  function session() {
    var S = window.CPL_SESSION;
    if (!S || typeof S.get !== "function") return null;
    var s = S.get();
    return s && s.email && S.isFresh(s) ? s : null;
  }
  function sessionHeaders(extra) {
    var S = window.CPL_SESSION;
    return S && typeof S.authHeaders === "function" ? S.authHeaders(extra) : headers();
  }
  function fresh() {
    var S = window.CPL_SESSION;
    return S && typeof S.ensureFresh === "function" ? Promise.resolve(S.ensureFresh()) : Promise.resolve(session());
  }
  /* Signed in: every record the reviewer may read (the unchecked ones too) with its
     fingerprint, and the verdict log. A failed read says so on the Records view and the
     cards fall back to the public read; it never blocks the tab. */
  function loadReview() {
    if (!session()) { state.review = null; return Promise.resolve(); }
    return fresh().then(function (s) {
      if (!s || !s.email) { state.review = null; return; }
      function get(url) {
        return fetch(url, { headers: sessionHeaders() }).then(function (r) {
          if (!r.ok) throw new Error(url.split("?")[0].split("/").pop() + " answered " + r.status);
          return r.json();
        });
      }
      return Promise.all([
        get(REST + "/program_requirement_records?select=" + RECORD_SELECT + ",requirements_fp&order=college,control_number"),
        get(REST + "/program_record_verdicts?select=" + VERDICT_SELECT + "&order=id.desc")
      ]).then(function (got) {
        state.review = { email: String(s.email).toLowerCase(), records: got[0] || [], verdicts: got[1] || [], error: null };
      }, function (e) {
        state.review = { email: String(s.email).toLowerCase(), records: null, verdicts: [], error: (e && e.message) || "the read failed" };
      });
    });
  }
  function wireSession() {
    if (state.sessionWired) return;
    state.sessionWired = true;
    window.addEventListener("cpl-session-changed", function () {
      loadReview().then(function () { if (document.getElementById(ROOT_ID)) render(); });
    });
    window.addEventListener("storage", function (e) {
      if (e.key !== PING_KEY || RECORD_KEY) return;
      loadReview().then(function () { if (document.getElementById(ROOT_ID)) render(); });
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

  /* The framing check's file (FRAMING_URL). A failed read leaves every host unknown, which
     still frames the page with its own window one word away; it never blocks the tab. */
  function loadFraming() {
    return fetch(FRAMING_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(FRAMING_URL + " answered " + r.status);
      return r.json();
    }).then(function (j) {
      state.framing = j && j.hosts && typeof j.hosts === "object" ? j.hosts : {};
    }, function () { state.framing = {}; });
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
    /* A record loaded with its college (Phase 2) carries the scorer's counts in its checks
       until a display build reaches it; the display build wins where there is one. */
    return {
      placed: cov.placed != null ? cov.placed : c.placed, listed: cov.listed != null ? cov.listed : c.listed,
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
      /* Sam's to-dos: an underlined word under the title; crimson while something waits on him */
      ".prh-todo { margin:0; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 12px; }",
      ".prh-todo-go { font:inherit; font-size:1rem; font-weight:700; color:var(--crimson); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-todo-go:hover { text-decoration-thickness:2px; }",
      ".prh-todo-go.prh-todo-clear { color:var(--cobalt); }",
      ".prh-todo-what { font-size:.875rem; color:var(--text-muted); }",
      ".prh-pg-call, .prh-pg-answered { scroll-margin-top:16px; }",
      /* the done mark: a check drawn in CSS, ghosted, always beside the word that says it */
      ".prh-done-mark { display:inline-block; width:5px; height:10px; margin:0 8px 2px 2px; border-right:2px solid var(--seal-blue-text); border-bottom:2px solid var(--seal-blue-text); transform:rotate(45deg); vertical-align:middle; }",
      ".prh-callrec:not(.prh-answered) .prh-done-mark { visibility:hidden; }",
      ".prh-pg-answered .prh-sec-label { color:var(--seal-blue-text); }",
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
      /* A class's display beats the hidden attribute, so Show the blocks needs this to hide them
         (Sam, 2026-10-09: "the Show Blocks doesn't seem to do anything"). */
      ".prh-body[hidden] { display:none; }",
      ".prh-rctl { display:flex; flex-wrap:wrap; align-items:center; gap:4px 14px; }",
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
      /* flags and a person's reading (Sheet 51 card 1; the mock-up's look on COBI's tokens). Crimson
         marks only a record waiting on a person; the flag's owner is a word, its tint a second signal */
      ".prh-state { font-size:.875rem; font-weight:700; color:var(--text-muted); }",
      ".prh-check-wide { grid-column:1 / -1; }",
      ".prh-state-waiting { color:var(--crimson); }",
      ".prh-flags { display:grid; gap:8px; }",
      ".prh-flag { border:1px solid var(--border-strong); border-radius:8px; padding:10px 12px; display:grid; gap:6px; min-width:0; margin-bottom:8px; }",
      ".prh-flag p { margin:0; max-width:var(--cpl-measure,none); }",
      ".prh-flag-college { background:var(--college-flag, var(--surface-subtle)); }",
      ".prh-flag-reading { background:var(--reading-flag, var(--surface-subtle)); }",
      ".prh-flag-top { display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; }",
      ".prh-flag-n, .prh-flag-kind { font-weight:700; color:var(--text-strong); }",
      ".prh-flag-owner { font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-mark { color:var(--text-strong); }",
      ".prh-verdict { border-top:1px solid var(--border-strong); padding:14px; display:grid; gap:10px; background:var(--surface-subtle); border-radius:0 0 8px 8px; }",
      ".prh-verdict h4 { margin:0; }",
      ".prh-verdict p { margin:0; font-size:.9rem; max-width:var(--cpl-measure,none); }",
      ".prh-fix { display:grid; gap:8px; }",
      ".prh-fix[hidden] { display:none; }",
      ".prh-said { font-size:.875rem; color:var(--text-muted); }",
      ".prh-btn { font:inherit; font-size:.9rem; font-weight:600; color:var(--text-body); background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:8px; padding:6px 14px; min-height:44px; cursor:pointer; }",
      ".prh-btn:hover { border-color:var(--cobalt); }",
      ".prh-btn.prh-primary { background:var(--text-strong); color:var(--paper); border-color:var(--text-strong); }",
      ".prh-btn[disabled] { cursor:wait; }",
      ".prh-review-note p { margin:0; }",
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
      ".prh-pg-hl { width:100%; box-sizing:border-box; margin-top:6px; background:var(--surface-opaque); border:1px solid var(--border); border-radius:12px; padding:20px 20px 16px; display:grid; gap:14px; }",
      ".prh-pg-pair { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:16px 28px; align-items:end; }",
      ".prh-pg-n { display:grid; gap:4px; min-width:0; }",
      ".prh-pg-n b { font-family:'Playfair Display', Georgia, serif; font-size:clamp(2.2rem, 6vw, 3.4rem); line-height:1; color:var(--text-strong); font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }",
      ".prh-pg-n.prh-pg-mine b { color:var(--cobalt); }",
      ".prh-pg-n b.prh-pg-unread { font-family:inherit; font-size:1.15rem; line-height:1.3; color:var(--mustard-text); }",
      ".prh-pg-n span { font-size:1rem; color:var(--text-body); }",
      ".prh-pg-n small { font-size:.875rem; color:var(--text-muted); }",
      ".prh-pg-bar { height:10px; border-radius:5px; background:var(--surface-muted); overflow:hidden; }",
      ".prh-pg-bar i { display:block; height:100%; min-width:4px; background:var(--cobalt); }",
      ".prh-pg-within { margin:0; display:flex; flex-wrap:wrap; gap:6px 22px; font-size:.9375rem; border-top:1px solid var(--border); padding-top:12px; }",
      ".prh-pg-within b { color:var(--text-strong); font-variant-numeric:tabular-nums; }",
      ".prh-pg-within .prh-quiet { color:var(--text-muted); }",
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
      ".prh-word { font:inherit; font-size:.9rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-word:hover { text-decoration-thickness:2px; }",
      ".prh-word:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      ".prh-callrecs { margin:.6rem 0 0; display:grid; gap:0; }",
      ".prh-callrec { border-top:1px solid var(--border); }",
      ".prh-callrec > summary { display:flex; flex-wrap:wrap; align-items:center; gap:.2rem .75rem; min-height:44px; padding:.35rem 0; cursor:pointer; }",
      ".prh-callrec-t { flex:1 1 12rem; min-width:0; }",
      ".prh-callrec-b { padding:0 0 .75rem; }",
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
      "@media (max-width: 560px) { .prh-pg-pair { grid-template-columns:minmax(0, 1fr); } .prh-pg-grid { grid-template-columns:minmax(0, 1fr); } .prh-pg-log li { grid-template-columns:minmax(0, 1fr); gap:0; } }",
      /* side by side: the catalog page beside the record, each scrolling on its own; stacked below 900px */
      "html.prh-split-open, html.prh-split-open body { overflow:hidden; }",
      ".prh-split { position:fixed; inset:0; z-index:10000; background:var(--paper); display:grid; grid-template-rows:auto minmax(0, 1fr); }",
      ".prh-split-bar { display:flex; flex-wrap:wrap; align-items:center; gap:4px 18px; padding:8px 16px; border-bottom:1px solid var(--border-strong); background:var(--surface-opaque); }",
      ".prh-split-bar h3 { flex:1 1 18rem; min-width:0; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; font-size:1rem; }",
      /* the dialog's title takes focus when it opens so a screen reader names it; it is not a control */
      ".prh .prh-split-bar h3[tabindex]:focus, .prh .prh-split-bar h3[tabindex]:focus-visible { outline:none; }",
      ".prh-split-panes { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); min-height:0; }",
      ".prh-split-cat { min-height:0; display:grid; border-right:1px solid var(--border-strong); background:var(--surface-opaque); }",
      ".prh-split-cat iframe { width:100%; height:100%; border:0; color-scheme:light; }",
      ".prh-split-refused { align-content:start; gap:10px; padding:20px; }",
      ".prh-split-refused p { margin:0; max-width:var(--cpl-measure,none); }",
      ".prh-split-rec { min-height:0; overflow:auto; padding:14px 16px; background:var(--paper); }",
      ".prh-split-rec .prh-rec { margin:0; }",
      ".prh-split-solo .prh-split-panes { grid-template-columns:minmax(0, 1fr); grid-template-rows:minmax(0, 1fr); }",
      "@media (max-width: 900px) { .prh-split-panes { grid-template-columns:minmax(0, 1fr); grid-template-rows:minmax(0, 1fr) minmax(0, 1fr); }" +
        " .prh-split-cat { border-right:0; border-bottom:1px solid var(--border-strong); } .prh-split-rec { padding:10px 12px; } }",
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

  /* ── flags (the mock-up's numbered questions) ──
     Each gap the display build carries, other than a reader's note, is a flag. It sits on
     the first block that prints a course its text names, and every row printing one of
     those courses carries its number; a flag naming no printed course sits on the whole
     record. The owner is the gap's: the college, or the reading procedure. */
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function flagsFor(p) {
    var blocks = (p.record && p.record.blocks) || [];
    var gaps = (p.display && p.display.gaps) || [];
    var codes = [];
    blocks.forEach(function (b) {
      (b.courses || []).forEach(function (c) {
        if (c.code && codes.indexOf(c.code) < 0) codes.push(c.code);
        (c.alternatives || []).forEach(function (a) { a = a && (a.code || a); if (a && codes.indexOf(a) < 0) codes.push(a); });
      });
    });
    var flags = [], notes = [], byCode = {};
    gaps.forEach(function (g) {
      if (NOTE_KINDS[g.kind]) { notes.push(g); return; }
      var named = codes.filter(function (c) {
        return new RegExp("(^|[^A-Za-z0-9])" + escRe(c) + "(?![A-Za-z0-9])").test(g.text || "");
      });
      var at = null;
      for (var i = 0; i < blocks.length && at == null; i++) {
        if ((blocks[i].courses || []).some(function (c) {
          var all = [c.code].concat((c.alternatives || []).map(function (a) { return a && (a.code || a); }));
          return all.some(function (x) { return named.indexOf(x) >= 0; });
        })) at = i;
      }
      flags.push({ kind: g.kind, owner: g.owner === "college" ? "college" : "procedure", text: g.text, codes: named, block: at });
    });
    /* Numbered in the order a reader meets them: the whole record first, then block by block. */
    flags.sort(function (a, b) { return (a.block == null ? -1 : a.block) - (b.block == null ? -1 : b.block); });
    flags.forEach(function (f, i) {
      f.n = i + 1;
      f.codes.forEach(function (c) { (byCode[c] = byCode[c] || []).push(f.n); });
    });
    return { flags: flags, notes: notes, byCode: byCode };
  }
  function flagSummary(flags) {
    var col = flags.filter(function (f) { return f.owner === "college"; }).length, pro = flags.length - col;
    if (!flags.length) return "None";
    if (!pro) return col + ", all for the college";
    if (!col) return pro + ", for the reading procedure";
    return flags.length + ": " + col + " for the college, " + pro + " for the reading procedure";
  }
  function flagBox(f) {
    var college = f.owner === "college";
    return el("div", { cls: "prh-flag " + (college ? "prh-flag-college" : "prh-flag-reading"), "data-flag": String(f.n) }, [
      el("div", { cls: "prh-flag-top" }, [
        el("span", { cls: "prh-flag-n", text: "Flag " + f.n }),
        el("span", { cls: "prh-flag-kind", text: f.kind || "A question" }),
        el("span", { cls: "prh-flag-owner", text: college ? "For the college" : "For the reading procedure" })]),
      el("p", { text: f.text }),
      college ? el("p", { cls: "prh-small prh-quiet", text: "The college's draft carries it, under Drafts for the college above." }) : null]);
  }
  function rowMark(c, byCode) {
    var ns = [];
    [c.code].concat((c.alternatives || []).map(function (a) { return a && (a.code || a); })).forEach(function (x) {
      (byCode[x] || []).forEach(function (n) { if (ns.indexOf(n) < 0) ns.push(n); });
    });
    ns.sort(function (a, b) { return a - b; });
    if (!c.catalog_addition && !ns.length) return null;
    var label = ns.length ? (ns.length === 1 ? "Flag " + ns[0] : "Flags " + ns.slice(0, -1).join(", ") + " and " + ns[ns.length - 1]) : null;
    return el("span", { cls: "prh-alts" }, [
      c.catalog_addition ? "Printed in the catalog; not on the state's list" + (label ? ". " : "") : null,
      label ? el("b", { cls: "prh-mark", text: label }) : null]);
  }

  /* ── a person's reading: the state line, the verdict box, the one write ── */
  /* The three machine checks, read from the record's checks as the server reads them
     (program_record_machine_pass): coverage, nothing invented, and the units equal the
     printed total or the catalog prints none. */
  function machineFails(p) {
    var c = p.checks || {}, out = [];
    if (c.coverage !== true) out.push("courses");
    if (c.invented !== true) out.push("off-list");
    if (c.arithmetic !== "equal" && c.arithmetic !== "unstated") out.push("units");
    return out;
  }
  function shortCollege(c) { return String(c || "").replace(/\s+College$/, ""); }
  function monthDay(ts) {
    var d = ts ? new Date(ts) : null;
    if (!d || isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }); }
    catch (e) { return day(ts); }
  }
  function latestVerdict(p) {
    var R = state.review;
    if (!R || !R.verdicts) return null;
    for (var i = 0; i < R.verdicts.length; i++) {
      var v = R.verdicts[i];
      if (v.college === p.college && v.control_number === p.control_number) return v;
    }
    return null;
  }
  function stateLine(p) {
    var me = state.review && state.review.email;
    var v = latestVerdict(p);
    if (v && (!p.requirements_fp || v.requirements_fp === p.requirements_fp)) {
      var who = String(v.by_email || "").toLowerCase() === me ? "you" : v.by_email;
      if (v.verdict === "needs_fix") return { text: "Needs a fix, noted by " + who + ", " + monthDay(v.at), waiting: false };
      return { text: "Confirmed by " + who + ", " + monthDay(v.at) + (v.checked_after ? "" : "; stays unchecked until its checks pass"), waiting: false };
    }
    if (p.checked) return { text: "Checked" + (p.checked_by ? " by " + p.checked_by : "") + (p.checked_at ? ", " + monthDay(p.checked_at) : ""), waiting: false };
    return { text: v ? "Waiting on your reading; the requirements changed after the last one" : "Waiting on your reading", waiting: true };
  }
  function verdictError(e) {
    var code = e && e.code, st = e && e.status;
    if (st === 401 || st === 403 || code === "42501")
      return "Not saved. Your account is not on the reviewer list, or the session expired; sign in again.";
    if (code === "40001") return "Not saved. The record changed since this page read it; reload the tab and read it again.";
    var m = String((e && e.message) || "the save failed").replace(/^program_record_verdict_add:\s*/, "");
    return "Not saved: " + m.charAt(0).toLowerCase() + m.slice(1) + (/[.;]$/.test(m) ? "" : ".");
  }
  function postVerdict(p, verdict, note) {
    return fresh().then(function () {
      return fetch(REST + VERDICT_RPC, {
        method: "POST",
        headers: sessionHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ p_college: p.college, p_control_number: p.control_number, p_verdict: verdict,
          p_note: note || null, p_requirements_fp: p.requirements_fp || null })
      });
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (!r.ok) {
          var err = new Error((j && j.message) || "the save answered " + r.status);
          err.status = r.status; err.code = j && j.code;
          throw err;
        }
        return j || {};
      });
    });
  }
  function verdictBox(p, flags, line) {
    var key = p.college + "|" + p.control_number;
    var id = "prh-v-" + String(key).replace(/[^A-Za-z0-9]+/g, "-");
    var fails = machineFails(p);
    var forCollege = flags.filter(function (f) { return f.owner === "college"; }).length;
    var lede = "Confirm says the record reads the catalog as printed. " + (fails.length
      ? "The " + fails.join(" and ") + (fails.length === 1 ? " check is" : " checks are") +
        " not met, so the record stays unchecked after you confirm, until its reading procedure takes the fix and a rerun passes. Needs a fix sends your note to that procedure instead."
      : "The record passes the three machine checks, so confirming marks it checked and Sierra may quote it." +
        (forCollege ? " The " + (forCollege === 1 ? "flag" : forCollege + " flags") + " for the college stay open with " +
          shortCollege(p.college) + "; they concern the catalog itself and do not hold the record back." : ""));
    var said = el("p", { cls: "prh-said", "aria-live": "polite" });
    var confirm = el("button", { cls: "prh-btn prh-primary", type: "button", text: "Confirm" });
    var fixBtn = el("button", { cls: "prh-btn", type: "button", "aria-expanded": "false", "aria-controls": id + "-fix", text: "Needs a fix" });
    var note = el("textarea", { id: id + "-note", rows: "3", maxlength: "2000", cls: "prh-draft-text",
      placeholder: "For example: read the elective lists from the catalog's addendum once it posts." });
    var save = el("button", { cls: "prh-btn prh-primary", type: "button", text: "Save the note" });
    var fix = el("div", { cls: "prh-fix", id: id + "-fix" }, [
      el("label", { "for": id + "-note", cls: "prh-small" }, [el("b", { text: "What should change." }),
        " The note goes to " + shortCollege(p.college) + "'s reading procedure; the next run carries it out."]),
      note, el("div", { cls: "prh-draft-actions" }, [save])]);
    fix.hidden = true;
    function busy(on) { confirm.disabled = on; fixBtn.disabled = on; save.disabled = on; }
    function done(res, verdict, text) {
      var v = { id: res.id, college: p.college, control_number: p.control_number, verdict: verdict,
        note: text || null, requirements_fp: res.requirements_fp || p.requirements_fp,
        checked_after: !!res.checked, by_email: res.by || (state.review && state.review.email), at: res.at || new Date().toISOString() };
      if (state.review) state.review.verdicts = [v].concat(state.review.verdicts || []);
      p.checked = !!res.checked;
      p.checked_by = res.checked ? v.by_email : null;
      p.checked_at = res.checked ? v.at : null;
      var sl = stateLine(p);
      line.textContent = sl.text;
      line.className = "prh-state" + (sl.waiting ? " prh-state-waiting" : "");
      refreshCalls();
      safeSet(PING_KEY, Date.now() + " " + p.college + "|" + p.control_number);
      if (split.on) split.changed = true;
    }
    confirm.addEventListener("click", function () {
      fix.hidden = true; fixBtn.setAttribute("aria-expanded", "false");
      busy(true); said.textContent = "Saving your reading…";
      postVerdict(p, "confirm", null).then(function (res) {
        done(res, "confirm", null);
        said.textContent = res.checked ? "Confirmed. The record is checked, and Sierra may quote it."
          : "Confirmed and logged. The record stays unchecked until its checks pass.";
      }, function (e) { said.textContent = verdictError(e); }).then(function () { busy(false); });
    });
    fixBtn.addEventListener("click", function () {
      fix.hidden = !fix.hidden;
      fixBtn.setAttribute("aria-expanded", fix.hidden ? "false" : "true");
      if (!fix.hidden) note.focus();
    });
    save.addEventListener("click", function () {
      var text = note.value.trim();
      if (!text) { said.textContent = "Write what should change, then save."; note.focus(); return; }
      busy(true); said.textContent = "Saving your note…";
      postVerdict(p, "needs_fix", text).then(function (res) {
        done(res, "needs_fix", text);
        fix.hidden = true; fixBtn.setAttribute("aria-expanded", "false"); note.value = "";
        said.textContent = res.filed === false ? "Saved your note in the verdict log. The record stays unchecked."
          : "Saved your note. It joins " + shortCollege(p.college) + "'s open questions on its reading procedure, and the record stays unchecked.";
      }, function (e) { said.textContent = verdictError(e); }).then(function () { busy(false); });
    });
    return el("div", { cls: "prh-verdict", "aria-label": "Your reading of " + p.program_title }, [
      el("h4", { text: "Your reading" }), el("p", { text: lede }),
      el("div", { cls: "prh-draft-actions" }, [confirm, fixBtn]), fix, said]);
  }
  function signInBox() {
    var mount = el("div", { cls: "prh-signin-mount" });
    var d = el("details", { cls: "prh-notes prh-signin" }, [
      el("summary", { text: "Reviewers: sign in to confirm a record or note a fix" }), mount]);
    d.addEventListener("toggle", function () {
      if (!d.open || mount.childNodes.length) return;
      var SI = window.CPL_REVIEWER_SIGNIN;
      if (SI && typeof SI.mountInto === "function") {
        SI.mountInto(mount, { title: "Sign in to read records",
          blurb: "A reviewer signed in with the magic link sees Confirm and Needs a fix at the foot of each record. Everyone else sees the flags and the drafts.",
          returnTab: "program-requirements" });
      } else {
        mount.appendChild(el("p", { cls: "prh-small", text: "The sign-in box did not load here; sign in from the Admin tab, then come back." }));
      }
    });
    return d;
  }

  function viewRecords() {
    var Rv = state.review;
    var P = Rv && Rv.records ? Rv.records : state.records, R = state.registry;
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "Each program read from its college's catalog: the required courses, the courses chosen from a list, and the electives. A record passes four checks: it places the courses the state's Program Course File lists, it adds no course the catalog does not print, its units add up to the catalog's total, and a person read it against the catalog. A misread changes the college's reading procedure, never the record." }));
    /* Who is reading: a lede beside the first one, so the view keeps only sections below it. */
    box.appendChild(el("div", { cls: "prh-lede prh-review-note" }, [
      Rv && Rv.error ? el("p", { cls: "prh-small prh-caution", role: "status",
        text: "Your sign-in could not read the records (" + Rv.error + "), so these are the checked records the public sees, without Confirm and Needs a fix. Reload the tab to try again." })
      : Rv ? el("p", { cls: "prh-small prh-quiet",
        text: "Signed in as " + Rv.email + ". Each record ends with Confirm and Needs a fix, and the records waiting on a person's reading show here too." })
      : signInBox()]));
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
    var reviewing = !!(Rv && Rv.records);
    var totals = {};
    P.forEach(function (p) { totals[p.college] = (totals[p.college] || 0) + 1; });
    /* Find a record (Sam, 2026-10-09, reading Cerritos's 274 on his phone: "Yes, do them"):
       a search by name or control number, what to show, and one college, in the first
       section (open until the reader closes it); the college sections follow it. */
    var q = el("input", { id: "prh-rq", type: "search", placeholder: "Name or control number", autocomplete: "off" });
    q.value = state.rq;
    var shows = [["all", "All records"]].concat(reviewing ? [["waiting", "Waiting on your reading"]] : [])
      .concat([["fail", "Fail a machine check"], ["pass", "Pass the machine checks"], ["checked", "Checked"]]);
    if (!shows.some(function (o) { return o[0] === state.rshow; })) state.rshow = "all";
    var showSel = el("select", { id: "prh-rshow" }, shows.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.rshow;
    var names = Object.keys(totals).sort();
    if (state.rcollege !== "all" && !totals[state.rcollege]) state.rcollege = "all";
    var colSel = el("select", { id: "prh-rcollege" }, [el("option", { value: "all", text: "All colleges" })]
      .concat(names.map(function (c) { return el("option", { value: c, text: shortCollege(c) + " (" + totals[c] + ")" }); })));
    colSel.value = state.rcollege;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    var drawn = [];
    function draw() {
      state.rq = q.value; state.rshow = showSel.value; state.rcollege = colSel.value;
      var rows = filterRecords(P, state.rq, state.rshow, state.rcollege, reviewing ? isWaiting : null);
      var narrowed = !!String(state.rq).trim() || state.rshow !== "all" || state.rcollege !== "all";
      var order = [], byCollege = {};
      rows.forEach(function (p) {
        if (!byCollege[p.college]) { byCollege[p.college] = []; order.push(p.college); }
        byCollege[p.college].push(p);
      });
      drawn.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      drawn = [];
      if (!rows.length) drawn.push(box.appendChild(el("div", { cls: "prh-empty", text: "No record matches. Clear the search or choose All records." })));
      order.forEach(function (c) {
        var list = byCollege[c];
        var reg = R.filter(function (r) { return r.college === c; })[0] || {};
        var nd = (drafts[c] || []).length;
        var n = list.length < totals[c] ? list.length + " of " + totals[c] : String(totals[c]);
        var meta = ((PLATFORM[reg.catalog_platform] || "") + " catalog, " + yr(list[0].catalog_year)).trim() + " · " +
          n + (totals[c] === 1 ? " program" : " programs") + (nd ? " · " + nd + (nd === 1 ? " draft" : " drafts") + " for the college" : "");
        var sec = section("records:" + c, c, meta, [drafts[c] && !narrowed ? draftsBox(c, drafts[c]) : null].concat(list.map(function (p) { return recordCard(p); })),
          { cls: "prh-college" });
        /* A narrowed list opens its colleges, so a match is never hidden in a closed section. */
        if (narrowed) sec.setAttribute("open", "");
        drawn.push(box.appendChild(sec));
      });
      count.textContent = "Showing " + rows.length + " of " + P.length;
    }
    [q, showSel, colSel].forEach(function (c) { c.addEventListener("input", draw); c.addEventListener("change", draw); });
    box.appendChild(section("records:find", "Find a record", "By name or control number, what waits, and the college", [
      el("div", { cls: "prh-controls prh-rfind", role: "search", "aria-label": "Find a program record" }, [
        el("label", { "for": "prh-rq" }, ["Find a program", q]),
        el("label", { "for": "prh-rshow" }, ["Show", showSel]),
        el("label", { "for": "prh-rcollege" }, ["College", colSel]),
        count])]));
    draw();
    return box;
  }
  function isWaiting(p) { var sl = stateLine(p); return !!(sl && sl.waiting); }
  /* The Records view's filter, pure so a test reads it: the search matches the program's
     name or its control number; show narrows to the records waiting on the reader (when one
     is signed in), those failing or passing the three machine checks, or the checked ones. */
  function filterRecords(P, q, show, college, waiting) {
    var t = String(q || "").trim().toLowerCase();
    return (P || []).filter(function (p) {
      if (college && college !== "all" && p.college !== college) return false;
      if (t && String(p.control_number || "").toLowerCase().indexOf(t) < 0 &&
          String(p.program_title || "").toLowerCase().indexOf(t) < 0) return false;
      if (show === "waiting") return waiting ? waiting(p) : true;
      if (show === "fail") return machineFails(p).length > 0;
      if (show === "pass") return machineFails(p).length === 0;
      if (show === "checked") return !!p.checked;
      return true;
    });
  }

  /* opts.split: the card drawn in the side by side view, its blocks open and no Side by side word. */
  function recordCard(p, opts) {
    opts = opts || {};
    var key = p.college + "|" + p.control_number;
    var unit = p.measure === "hours" ? "hours" : "units";
    var ck = recordChecks(p);
    var disp = p.display || {};
    var counts = disp.counts || {};
    var figure = disp.figure || {};
    var courses = disp.courses || {};
    function dd(label, value) { return el("div", { cls: "prh-check" }, [el("dt", { text: label }), el("dd", { text: value })]); }
    function wide(d) { d.className += " prh-check-wide"; return d; }
    var placed = ck.listed != null ? ck.placed + " of " + ck.listed + " placed" : "Not measured";
    var arith = ck.arithmetic === "equal" ? "Equal, " + span(p.total_min, p.total_max) + " " + unit
      : ck.arithmetic === "unstated" ? "Catalog prints no total" : (ck.arithmetic || "Not measured");
    var reader = ck.reviewer === "ok" ? "Matches the catalog" : ck.reviewer === "fix" ? "Fixed after review" : "Not read";
    var cpl = counts.here
      ? el("div", { cls: "prh-cpl" }, [el("b", { text: counts.here + (counts.here === 1 ? " course" : " courses") }),
          " of " + (counts.courses || "?") + " carry CPL at this college" +
          (figure.up_to != null ? "; up to " + fmt(figure.up_to) + " of " + span(p.total_min, p.total_max) + " " + unit + " through CPL" : "")])
      : el("div", { cls: "prh-cpl prh-quiet", text: "No course here carries CPL at this college yet" });
    var F = flagsFor(p);
    var reviewing = !!(state.review && state.review.records && p.requirements_fp);
    var sl = reviewing ? stateLine(p) : null;
    var line = sl ? el("span", { cls: "prh-state" + (sl.waiting ? " prh-state-waiting" : ""), text: sl.text }) : null;
    var bodyId = "prh-body-" + String(key).replace(/[^A-Za-z0-9]+/g, "-");
    var isOpen = !!opts.split || !!state.open[key];
    var btn = el("button", { cls: "prh-toggle", type: "button", "aria-expanded": isOpen ? "true" : "false",
      "aria-controls": bodyId, text: isOpen ? "Hide the blocks" : "Show the blocks" });
    var head = el("div", { cls: "prh-rhead" }, [
      el("div", { cls: "prh-rtitle" }, [el("strong", { text: p.program_title }),
        el("span", { cls: "prh-small prh-quiet", text: award(p.award) + " · " + p.control_number }), line,
        el("span", { cls: "prh-rctl" }, [btn, !opts.split && p.source_url ? splitButton(p) : null])]),
      el("dl", { cls: "prh-checks" }, [dd("Courses", placed),
        dd("Off the state list", ck.additions ? ck.additions + ", printed in the catalog" : "None"),
        dd("Units", arith), dd("Person's reading", reader),
        F.flags.length ? wide(dd("Flags", flagSummary(F.flags))) : null]),
      cpl]);
    var body = el("div", { cls: "prh-body", id: bodyId });
    body.hidden = !isOpen;
    var blocks = (p.record && p.record.blocks) || [];
    var groups = {};
    blocks.forEach(function (b) { if (b.option_group) groups[b.option_group] = (groups[b.option_group] || 0) + 1; });
    var whole = F.flags.filter(function (f) { return f.block == null; });
    if (whole.length) body.appendChild(el("div", { cls: "prh-flags" }, [
      el("h4", { text: "On the whole record" })].concat(whole.map(flagBox))));
    blocks.forEach(function (b, bi) {
      var h = el("h4", {}, [b.name || "Courses", el("span", { cls: "prh-rule", text: ruleText(b, p.measure, groups) })]);
      if (b.stated && b.stated.min != null) h.appendChild(el("span", { cls: "prh-quiet prh-small", text: "Catalog prints " + span(b.stated.min, b.stated.max) + " " + unit }));
      var atBlock = F.flags.filter(function (f) { return f.block === bi; });
      body.appendChild(el("div", {}, [h].concat(atBlock.map(flagBox)).concat([table([
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
          [info.title || "", rowMark(c, F.byCode)],
          span(c.units, c.units_max),
          n ? el("strong", { text: String(n) }) : el("span", { cls: "prh-quiet", text: "0" })
        ];
      }), p.program_title + ": " + (b.name || "courses"), true)])));
    });
    if (p.total_min != null) body.appendChild(el("p", { cls: "prh-small", style: "margin:0", text: "Program total: " + span(p.total_min, p.total_max) + " " + unit + "." }));
    body.appendChild(el("p", { cls: "prh-small prh-quiet", style: "margin:0" }, [
      "Read from ", p.source_url ? link(p.source_url, "the catalog page") : "the catalog",
      " (" + yr(p.catalog_year) + ")" + (p.checked_by ? "; read against the catalog by " + p.checked_by : "") + ".",
      disp.build ? " Display build " + disp.build + (disp.built ? ", " + disp.built : "") + "." : ""]));
    var gaps = F.notes;
    if (gaps.length) body.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "Notes for the reading procedure (" + gaps.length + ")" }),
      el("ul", {}, gaps.map(function (g) { return el("li", { text: (g.kind ? g.kind + ": " : "") + g.text }); }))]));
    var art = el("article", { cls: "prh-rec" + (isOpen ? " prh-open" : ""), "aria-label": p.program_title + ", " + p.college },
      [head, body, reviewing ? verdictBox(p, F.flags, line) : null]);
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
    /* Reads as the headline's pair (Sam, 2026-10-08): the checked records of COCI's active programs. */
    { id: "every", title: "Every program", needs: ["active"],
      fact: function (x) { return fmt(x.checked) + " of " + fmt(x.active); },
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

  /* ── the headline: every program in the state beside the ones the harvest holds ──
   * Sam, 2026-10-08, in chat: "add to our ROEP dashboard the total count of college active
   * program control numbers from COCI and the ones with complete harvested ROEP data... I
   * want to be able to show this to the Chancellor so she can get the BIG vision and
   * progress"; SkyView becomes the hub later. Yes to the mock-up (S347):
   * https://claude.ai/artifact/ME23x5taJpTKpx4RBwQ2Tr (prototype/roep_headline_mockup.html).
   * Complete means checked: the four checks passed. COCI holds one Active row per control
   * number (20,282 rows and numbers at 118 colleges, read 2026-10-08), so its exact count
   * is the first number. The band sits in the view's head, beside the run status, so
   * Collapse all leaves it on screen. Each checkpoint records the pair in the status file's
   * headline list (scripts/queue_status.py --headline), and the band names the first
   * recorded count once the checked count passes it. */
  function headlineFacts(x) {
    var P = x.P || [], cols = {};
    P.forEach(function (p) { cols[p.college] = 1; });
    var hist = x.Q && Array.isArray(x.Q.headline) ? x.Q.headline.filter(function (h) {
      return h && /^\d{4}-\d{2}-\d{2}$/.test(h.day || "") && typeof h.checked === "number";
    }) : [];
    var first = hist[0] || null;
    return {
      active: x.active, colleges: x.R.length,
      complete: P.length, completeColleges: Object.keys(cols).length,
      outcomes: P.filter(function (p) {
        var o = p.record && p.record.program && p.record.program.outcomes;
        return Array.isArray(o) && o.length > 0;
      }).length,
      maps: P.filter(function (p) { return !!(p.display && p.display.map && p.display.map.status === "read"); }).length,
      since: first && first.checked < P.length ? { day: dayOf(first.day), checked: first.checked } : null
    };
  }
  function headlineBand(x) {
    var h = headlineFacts(x), read = h.active != null;
    var all = read
      ? el("div", { cls: "prh-pg-n" }, [el("b", { text: fmt(h.active) }),
          el("span", { text: "active programs at " + h.colleges + " colleges" }),
          el("small", { text: "The state's program inventory (COCI), one control number each" })])
      : el("div", { cls: "prh-pg-n" }, [el("b", { cls: "prh-pg-unread", text: "Could not be read" }),
          el("span", { text: "active programs at " + h.colleges + " colleges" }),
          el("small", { text: missingText(["active"], x) })]);
    var mine = el("div", { cls: "prh-pg-n prh-pg-mine" }, [el("b", { text: fmt(h.complete) }),
      el("span", { text: "read from the college's catalog and checked" }),
      el("small", { text: "Requirements, choices and totals, at " + h.completeColleges + (h.completeColleges === 1 ? " college" : " colleges") })]);
    var kids = [el("div", { cls: "prh-pg-pair" }, [all, mine])];
    if (read && h.active > 0) {
      var pct = Math.max(0, Math.min(100, h.complete / h.active * 100));
      kids.push(el("div", { cls: "prh-pg-bar", role: "img", "aria-label": fmt(h.complete) + " of " + fmt(h.active) + " programs read and checked" }, [
        el("i", { style: "width:" + (Math.round(pct * 100) / 100) + "%" })]));
    }
    if (h.complete > 0 || h.since) {
      kids.push(el("p", { cls: "prh-pg-within" }, [
        h.complete > 0 ? el("span", {}, ["Of the " + fmt(h.complete) + ": ", el("b", { text: fmt(h.outcomes) }), " also carry their published outcomes"]) : null,
        h.complete > 0 ? el("span", {}, [el("b", { text: fmt(h.maps) }), " show the college's term-by-term map"]) : null,
        h.since ? el("span", { cls: "prh-quiet", text: "Up from " + fmt(h.since.checked) + " on " + h.since.day }) : null]));
    }
    return el("section", { cls: "prh-pg-hl", "aria-label": "Every program in the state, and how many the harvest holds" }, kids);
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
      var waiting = (Array.isArray(Q.calls) ? Q.calls : []).filter(function (c) { return !callAnswered(c); }).length;
      meta.appendChild(el("li", { id: "prh-pg-waitcount", cls: waiting ? "prh-pg-waiting" : "prh-quiet",
        text: waiting ? waiting + " waiting on " + x.decider : "Nothing waiting on " + x.decider }));
    } else {
      meta.appendChild(el("li", { cls: "prh-caution", text: missingText(["Q"], x) }));
    }
    box.appendChild(el("header", { cls: "prh-pg-head" }, [
      el("h3", { text: "Catalog ROEP harvest" }), el("span", { cls: "prh-pg-sub", text: "Progress" }), meta, headlineBand(x)]));
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
        var done = callAnswered(c);
        var card = section("progress:call:" + i, c.title || "", null, [
          c.text ? el("p", { text: c.text }) : null,
          c.if_no_reply && !done ? el("p", { cls: "prh-pg-foot", text: "No reply: " + c.if_no_reply }) : null,
          callRecords(c),
          callLinks(c)],
          { cls: "prh-pg-box " + (done ? "prh-pg-answered" : "prh-pg-call"), h: "h4", mark: done,
            label: done ? "Answered" : "Needs " + x.decider + "'s call" });
        card.setAttribute("data-call", String(i));
        side.appendChild(card);
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

  /* ── Sam's to-dos ──
   * Sam, 2026-10-09: "Put a button to my todo items on the front of Program Requirements so I
   * can go right to them." His to-dos are the calls on the Progress view's side column, which a
   * phone draws below the milestones and all eight parts. A word under the tab's title counts
   * them and goes there, opening every call. Each record a call names is one to-do until it is
   * answered (a verdict on its current requirements, or checked); a call that names no record is
   * one. Signed out, a record the public read cannot see counts as open. */
  function todoCount(Q) {
    var calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    var open = 0, first = -1;
    calls.forEach(function (c, i) {
      var refs = callRefs(c), n = 0;
      if (!refs.length) n = 1;
      refs.forEach(function (ref) { if (!refAnswered(ref)) n++; });
      if (n && first < 0) first = i;
      open += n;
    });
    return { calls: calls.length, open: open, first: first < 0 ? 0 : first };
  }
  function todoLabel(t, who) {
    return t.open ? who + "'s to-dos (" + t.open + ")" : who + "'s to-dos: all answered";
  }
  function todoLine() {
    var G = state.progress, Q = G && G.queue;
    if (!Q || !Array.isArray(Q.calls) || !Q.calls.length) return null;
    var who = Q.decider || "Sam", t = todoCount(Q);
    var go = el("button", { cls: "prh-todo-go" + (t.open ? "" : " prh-todo-clear"), id: "prh-todo-go", type: "button",
      text: todoLabel(t, who) });
    go.addEventListener("click", goToTodos);
    return el("p", { cls: "prh-todo" }, [go,
      el("span", { cls: "prh-todo-what", text: "The calls on the Progress view and the records they name" })]);
  }
  function refreshTodo() {
    var go = document.getElementById("prh-todo-go"), Q = state.progress && state.progress.queue;
    if (!go || !Q) return;
    var t = todoCount(Q);
    go.textContent = todoLabel(t, Q.decider || "Sam");
    go.className = "prh-todo-go" + (t.open ? "" : " prh-todo-clear");
  }
  function goToTodos() {
    var Q = state.progress && state.progress.queue;
    var calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    calls.forEach(function (c, i) { secSet("progress:call:" + i, true); });
    var to = todoCount(Q).first;
    choose("progress", false);
    var card = document.querySelector("#" + ROOT_ID + ' details[data-sec="progress:call:' + to + '"]');
    if (!card) return;
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (card.scrollIntoView) card.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
    var sum = card.querySelector("summary");
    if (sum) { try { sum.focus({ preventScroll: true }); } catch (e) { sum.focus(); } }
  }

  /* ── side by side ──
   * Sam, 2026-10-09 ~21:00Z, after reading Cerritos 02201 beside its catalog page in two windows:
   * "It would be nice if you could show a split view like this on the Prog Rev tab so I don't have
   * to do it manually." Side by side opens the record beside its catalog page: the page in a frame
   * on the left (on top below 900px), the record with its blocks and Your reading on the right,
   * each scrolling on its own. The frame is sandboxed without top navigation, so a catalog's
   * frame-busting script cannot take the tab.
   *
   * A college's site may refuse to be framed, and the browser does not tell this page;
   * kb/catalog_framing.json says which hosts refused when the runner asked (Cerritos's among
   * them). Such a page opens in a window of its own on the left half. Sam, 2026-10-10: "it closes
   * when I click on the program requirements side to scroll down and I have to click show each
   * time": COBI's window filled the screen, so a click on it covered the catalog. On a wide
   * screen the record therefore opens in a window of its own on the right half (the reading
   * room), and the two windows never overlap. A browser lets one click open one window, so the
   * first record takes two clicks (the record, then Show the catalog on the left); Next waiting
   * record then moves both windows on one click. A narrow screen keeps the record here and opens
   * the catalog in a tab. */
  var split = { on: false, node: null, opener: null, inert: [], key: null, changed: false };
  function hostOf(url) { var m = /^https?:\/\/([^\/?#:]+)/i.exec(String(url || "")); return m ? m[1].toLowerCase() : ""; }
  function framingOf(url) {
    var h = state.framing && state.framing[hostOf(url)];
    return h && typeof h.frames === "boolean" ? h.frames : null;
  }
  function screenBox() {
    var sc = window.screen || {};
    var w = sc.availWidth || window.innerWidth || 1280, h = sc.availHeight || window.innerHeight || 800;
    return { left: sc.availLeft || 0, top: sc.availTop || 0, half: Math.max(480, Math.floor(w / 2)), w: w, h: h };
  }
  function wideScreen() { return (window.innerWidth || 0) >= 900 && screenBox().w >= 1000; }
  /* The catalog in its named window on the left half: a second call moves the same window to
     the next page. Its opener is cut, so the college's page cannot reach this one. */
  function openCatalogWindow(url) {
    var b = screenBox();
    var w = window.open(url, "prh-catalog", "popup,left=" + b.left + ",top=" + b.top + ",width=" + b.half + ",height=" + b.h);
    if (!w) return null;
    try { w.opener = null; } catch (e) { /* already the college's page */ }
    try { w.focus(); } catch (e) { /* the browser decides */ }
    return w;
  }
  /* The record in COBI's own page, in a named window on the right half. A window already
     reading takes the next record in place; a new one loads the tab and opens it there. */
  function openRecordWindow(p) {
    var b = screenBox(), key = p.college + "|" + p.control_number;
    var w = window.open("", "prh-record", "popup,left=" + (b.left + b.half) + ",top=" + b.top + ",width=" + (b.w - b.half) + ",height=" + b.h);
    if (!w) return false;
    var M = null;
    try { M = w.CPL_PROGRAM_REQUIREMENTS; } catch (e) { M = null; }
    if (M && typeof M.openKey === "function" && M.openKey(key)) { try { w.focus(); } catch (e) { /* */ } return true; }
    var u = window.location.pathname + "?prh_split=" + encodeURIComponent(key) + "#program-requirements";
    try { w.location.href = u; } catch (e) { return false; }
    return true;
  }
  function openKey(key) {
    var k = String(key || "").split("|");
    var p = recordFor({ college: k[0], control_number: k.slice(1).join("|") });
    if (!p) return false;
    openSplit(p, null);
    return true;
  }
  function splitButton(p) {
    var b = el("button", { cls: "prh-word", type: "button", text: "Side by side",
      "data-split": p.college + "|" + p.control_number,
      "aria-label": "Read " + p.program_title + " side by side with its catalog page" });
    b.addEventListener("click", function () { openSplit(p, b); });
    return b;
  }
  /* The next record on the same call still waiting on a reading, after this one. */
  function nextWaiting(p) {
    var Q = state.progress && state.progress.queue, calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    for (var i = 0; i < calls.length; i++) {
      var refs = callRefs(calls[i]);
      var at = -1;
      refs.forEach(function (r, j) { if (r.college === p.college && r.control_number === p.control_number) at = j; });
      if (at < 0) continue;
      for (var n = 1; n < refs.length; n++) {
        var ref = refs[(at + n) % refs.length], q = recordFor(ref);
        if (q && q.source_url && q.requirements_fp && stateLine(q).waiting) return q;
      }
      return null;
    }
    return null;
  }
  function onCall(p) {
    var Q = state.progress && state.progress.queue;
    return !!(Q && Array.isArray(Q.calls) && Q.calls.some(function (c) {
      return callRefs(c).some(function (r) { return r.college === p.college && r.control_number === p.control_number; });
    }));
  }
  function openSplit(p, opener) {
    var frames = framingOf(p.source_url);
    if (frames === false && !RECORD_KEY && wideScreen() && openRecordWindow(p)) return;
    var carry = split.changed, back = split.on ? split.opener : null;
    closeSplit(true);
    var name = p.program_title + " " + award(p.award);
    /* In the reading room the catalog always has its window, so the record takes the whole one. */
    var solo = !!RECORD_KEY;
    var said = el("span", { cls: "prh-small prh-quiet", "aria-live": "polite" });
    var own = el("button", { cls: "prh-word", type: "button",
      text: solo ? "Show the catalog on the left" : "Open the catalog in its own window" });
    own.addEventListener("click", function () { openCatalogWindow(p.source_url); });
    var next = null;
    if (onCall(p)) {
      next = el("button", { cls: "prh-word", type: "button", text: "Next waiting record" });
      next.addEventListener("click", function () {
        var q = nextWaiting(p);
        if (!q) { said.textContent = "Every record on this call has your reading."; return; }
        if (solo || framingOf(q.source_url) === false) openCatalogWindow(q.source_url);
        openSplit(q, split.opener);
      });
    }
    var close = el("button", { cls: "prh-word", type: "button", text: "Close", "aria-label": "Close side by side" });
    close.addEventListener("click", function () { closeSplit(); });
    var cat = null;
    if (solo) {
      cat = null;
    } else if (frames === false) {
      var again = el("button", { cls: "prh-word", type: "button", text: "Open it again" });
      again.addEventListener("click", function () { openCatalogWindow(p.source_url); });
      cat = el("div", { cls: "prh-split-cat prh-split-refused" }, [
        el("p", { text: shortCollege(p.college) + "'s catalog site does not let another site show its pages, so the catalog page opened in a window of its own." }),
        el("p", {}, [again])]);
      openCatalogWindow(p.source_url);
    } else {
      cat = el("div", { cls: "prh-split-cat" }, [el("iframe", { src: p.source_url, title: "The catalog page for " + name,
        referrerpolicy: "no-referrer",
        sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms" })]);
    }
    var bar = el("div", { cls: "prh-split-bar" }, [
      el("h3", { id: "prh-split-t", tabindex: "-1" }, [name, el("span", { cls: "prh-small prh-quiet", text: shortCollege(p.college) + " · " + p.control_number })]),
      frames === false && !solo ? null : own, next, close, said]);
    var node = el("div", { cls: "prh prh-split" + (solo ? " prh-split-solo" : ""), role: "dialog", "aria-modal": "true", "aria-labelledby": "prh-split-t" }, [
      bar, el("div", { cls: "prh-split-panes" }, [cat,
        el("div", { cls: "prh-split-rec", tabindex: "0", role: "region", "aria-label": "The record for " + name }, [recordCard(p, { split: true })])])]);
    node.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeSplit(); }
    });
    split.inert = Array.prototype.filter.call(document.body.children, function (n) {
      return n !== node && !n.hasAttribute("inert") && n.tagName !== "SCRIPT";
    });
    split.inert.forEach(function (n) { n.setAttribute("inert", ""); });
    document.documentElement.classList.add("prh-split-open");
    document.body.appendChild(node);
    split.on = true; split.node = node; split.opener = opener || back || null; split.changed = carry;
    split.key = p.college + "|" + p.control_number;
    document.getElementById("prh-split-t").focus();
  }
  /* quiet: a new split replaces this one, so focus stays where the new one puts it. A verdict
     saved here redraws the tab, so the card behind shows it too. In the reading room, Close
     closes the window. */
  function closeSplit(quiet) {
    if (!split.on) return;
    var key = split.key, opener = split.opener, changed = split.changed;
    if (split.node && split.node.parentNode) split.node.parentNode.removeChild(split.node);
    split.inert.forEach(function (n) { n.removeAttribute("inert"); });
    document.documentElement.classList.remove("prh-split-open");
    split.on = false; split.node = null; split.opener = null; split.inert = []; split.key = null; split.changed = false;
    if (quiet) return;
    if (RECORD_KEY) { try { window.close(); } catch (e) { /* a window the reader opened by hand stays */ } }
    if (changed && document.getElementById(ROOT_ID)) {
      render();
      opener = null;
      Array.prototype.forEach.call(document.querySelectorAll("#" + ROOT_ID + " [data-split]"), function (b) {
        if (!opener && b.getAttribute("data-split") === key) opener = b;
      });
    }
    if (opener && opener.isConnected !== false && opener.focus) opener.focus();
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
      state.error || !state.registry ? null : todoLine(),
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
    wireSession();
    render();
    if (!state.registry && !state.loading) load();
  }

  window.CPL_PROGRAM_REQUIREMENTS = {
    activate: activate,
    _state: state, _load: load, _render: render, mountSierra: mountSierra, SIERRA_SURFACE: SIERRA_SURFACE,
    catalogStatus: catalogStatus, filterRegistry: filterRegistry, filterRecords: filterRecords, recordChecks: recordChecks,
    ruleText: ruleText, procedureCounts: procedureCounts, award: award, span: span,
    collegeDrafts: collegeDrafts, draftText: draftText, flagsFor: flagsFor, flagSummary: flagSummary,
    machineFails: machineFails, verdictError: verdictError, VERDICT_RPC: VERDICT_RPC,
    todoCount: todoCount, goToTodos: goToTodos, openSplit: openSplit, closeSplit: closeSplit, framingOf: framingOf, FRAMING_URL: FRAMING_URL,
    openKey: openKey, nextWaiting: nextWaiting, callAnswered: callAnswered, RECORD_KEY: RECORD_KEY,
    MILESTONES: MILESTONES, PARTS: PARTS, progressContext: progressContext, headlineFacts: headlineFacts, nextRun: nextRun, nextWeekly: nextWeekly
  };
})();
