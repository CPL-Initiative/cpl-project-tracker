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
 *                active programs with the complete ones, whose record passes the
 *                machine checks (Sam, 2026-10-08, for the Chancellor; S415 for
 *                complete; HEADLINE below), five milestones with You are
 *                here, the eight parts, and, from kb/status/program-requirements.json
 *                (the last checkpoint's word), the next step, the calls waiting on Sam
 *                and what changed. Definitions in MILESTONES and PARTS below; the view
 *                itself is drawn by commons_progress.js, the Commons' shared module (S419).
 *   Catalogs     program_source_registry, one row per college: where its catalog is,
 *                the year it names, the platform, its published program map.
 *   Records      program_requirement_records: each program read from its catalog, the
 *                machine checks it passed, and the CPL its courses carry (display, built by
 *                kb/_build_roep_display.py under one build stamp).
 *   Sequences    the registry's program map columns: who publishes a term-by-term map
 *                and what the reader got when it asked.
 *   Procedures   program_source_registry.procedure: the reading procedure a college's
 *                agent runs by (hosts, steps, answers, open questions, nuances, held
 *                requests). Sam's sheet 34 card 2: one per college, kept with its
 *                history; a misread changes the procedure, never the record.
 *
 * No Sierra on this tab (Sam, 2026-10-14: "Let's take the Sierra window off the
 * program requirements (PR) tab as I don't think it will be useful for now"). The
 * docked "Sierra AI" section it carried from 2026-10-05 is gone, and
 * the tab never mounts the assistant; Sierra AI opens over any tab through
 * CPL_CHAT.open() (S398). Guard: tests/program_requirements.test.js (4b).
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
 * showed. Since Sam's Open Asks Sheet 67 (2026-10-12, "Every record, from the table") the public
 * reads every record too, and a record no person has checked says Not yet confirmed.
 *
 * Records by college (Sam, 2026-10-13: "we don't have to load all the colleges and programs at
 * once if we add a multi-select college/district drop down filter", then: "Provided the links
 * that jump to items that need attention could still work without the filter being used"). The
 * tab reads a light index of every record (INDEX_SELECT) and each record's full row only for the
 * colleges the reader picks, or by key where a link names a record. See "reads" below.
 *
 * A FAILED READ SAYS SO; it never renders as zero colleges or zero records.
 * Tests: tests/program_requirements.test.js
 */
(function () {
  "use strict";

  var ROOT_ID = "program-requirements-root";
  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  /* The tab opens on Progress every time (Sam, 2026-10-14: "Show the Progress view as initial
     view first"); a view chosen in the tab holds until the page reloads. */
  /* Which sections are open (Sam, 2026-10-07: "make sure every section is collapsible and
     the tab has a collapse/expand all button"). One map for every view, keyed
     "<view>:<section>"; "*" holds the last Expand all or Collapse all, so the choice
     carries to the views not on screen. */
  var SECTIONS_KEY = "cplProgramRequirements.sections.v1";
  var CURRENT_YEAR = "2026-2027";

  /* college_id joins map_colleges for the Records view's districts. */
  var REGISTRY_SELECT = "college,college_id,catalog_url,catalog_year,catalog_platform,catalog_format," +
    "sequence_source,sequence_url,sequence_host,sequence_access,sequence_note,access_status," +
    "corrected_by,census_checked_at,census_run_id,procedure,procedure_by,procedure_at";
  /* A record's full row: read per college the reader picks, or by key where a link names it. */
  var RECORD_SELECT = "college,control_number,program_title,award,catalog_year,source_url," +
    "measure,total_min,total_max,record,checks,checked,checked_by,checked_at,display";
  /* ── the light index (2026-10-13) ──
     Every record, with only what the views that span colleges count: its name for the search,
     its state for the waiting and checked signals, and the paths of its checks that recordChecks()
     and machineFails() read (the Records view's glance and its Show filter). Sized on the live
     table's 2,840 records (row_to_json, 2026-10-13): 0.57 MB, 0.72 MB signed in with each
     record's requirements_fp, against 34 MB for every full row; one college's full rows run
     up to 4.0 MB. fromIndex() rebuilds the shapes the rest of the file reads.
     Its display paths and the fingerprint are stored columns since S405 (2026-10-17, Sam: "Prog Req
     tab in COBI loads very slow"): read as paths into display and the requirements_fp function,
     every Range page's OFFSET evaluated each skipped row, and the last public page of 11,969 took
     9.4 s against anon's 3 s; from the columns it takes 22 ms, fingerprint included
     (chatbox/supabase_program_requirement_records_index_columns_2026_10_17_s405.sql). */
  var INDEX_SELECT = "college,control_number,program_title,checked," +
    "cov:checks->coverage,inv:checks->invented,ar:checks->>arithmetic,rv:checks->reviewer->>verdict," +
    "dar:idx_display_arithmetic,drv:idx_display_reviewer,here:idx_display_here";
  /* The fingerprint the verdicts compare, stored as a column (idx_fp, program_record_fp(record)). */
  var FP_SELECT = "requirements_fp:idx_fp";
  /* What only a checked record shows, read for the checked records alone (31 rows, 10 KB): who
     checked it and when, its display build, its program map, and whether its catalog prints
     outcomes (the first one, or null). The Progress view's parts and headline count these. */
  var CHECKED_SELECT = "college,control_number,checked_by,checked_at,build:display->>build,built:display->>built," +
    "map:display->map->>status,out1:record->program->outcomes->0";
  /* The gaps behind Drafts for the college, read for every record only when the Catalogs view's
     drafts are asked for (about 5.6 MB); a college whose records are open counts its own. */
  var DRAFT_SELECT = "college,control_number,award,catalog_year,gaps:display->gaps";
  var PICK_KEY = "cplProgramRequirements.pick.v1";
  var FILTERS_KEY = "cplProgramRequirements.filters.v1";
  /* A filter that lists at most this many colleges reads their records at once; a wider one
     reads each college when its section opens, so a region never pulls 20 MB unasked. */
  var EAGER_COLLEGES = 4;
  /* This project's status file, one of kb/status/<project>.json (S419, the Commons' step 1; it was
     kb/queue_status.json from S343). Written by every checkpoint (.claude/commands/checkpoint.md
     step 12, scripts/queue_status.py): what no browser read can know. anon reads every record
     (Sam, Open Asks Sheet 67) but has no grant on program_source_registry_history, so the day's
     changes, the next step and the calls come from here; commons_progress.js reads it. */
  var QUEUE_URL = "kb/status/program-requirements.json";
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

  /* records: the index, one row per record; a row stays _light until its full row merges into it
     (the same object, so a card, a call and the counts all see one record). pick: the colleges
     the Records view lists (for the visit); rscope "all" lists every college, as a count the reader
     followed counted them. failed: a college whose read failed, kept until the reader asks again. */
  var state = { registry: null, records: null, error: null, loading: false, progress: null,
    view: "progress", q: "", show: "all", pshow: "all", platform: "all", rq: "", rshow: "all", pick: null, linkPicks: [], rscope: "pick", open: {}, secs: null,
    review: null, sessionWired: false, framing: null, notice: null, districts: null, regions: null, districtError: null,
    filt: null, cip: null, cipError: null, cipLoading: null,
    failed: {}, draftsRead: null, draftsError: null };

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
  /* ── a to-do Sam marks done ──
   * Sam, 2026-10-30, in S527: "Add a to do list on Catalog common that shows on Sam's To do. Give me
   * instructions on what you need to turn the process for the college back on. When I complete a to do
   * on the commons, it should alert the cpl queue schedule task." A call carrying `todo_id` is such a
   * to-do: its card offers Mark done, with a note, to a signed-in reviewer, and the one write
   * (rpc/queue_todo_done_add, chatbox/supabase_queue_todo_done.sql) is what the scheduled session reads
   * at its start (docs/reference/scheduled_sessions.md). The newest row for a to-do wins; Reopen adds one. */
  var TODO_PROJECT = "program-requirements";
  var TODO_RPC = "/rpc/queue_todo_done_add";
  function getTodoMarks() {
    return fetch(REST + "/queue_todo_done?select=todo_id,note,reopen,by_email,at&project=eq." + TODO_PROJECT + "&order=id.desc",
      { headers: sessionHeaders() }).then(function (r) {
        if (!r.ok) throw new Error("queue_todo_done answered " + r.status);
        return r.json();
      });
  }
  /* The latest mark on a to-do, when it says done; null when open, reopened or unread. */
  function todoMark(c) {
    var id = c && c.todo_id, marks = state.review && state.review.todos;
    if (!id || !Array.isArray(marks)) return null;
    for (var i = 0; i < marks.length; i++) if (marks[i].todo_id === id) return marks[i].reopen ? null : marks[i];
    return null;
  }
  function postTodoMark(c, note, reopen) {
    return fresh().then(function () {
      return fetch(REST + TODO_RPC, {
        method: "POST",
        headers: sessionHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ p_project: TODO_PROJECT, p_todo_id: c.todo_id, p_note: note || null, p_reopen: !!reopen })
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
  function todoError(e) {
    var st = e && e.status, code = e && e.code;
    if (st === 401 || st === 403 || code === "42501")
      return "Not saved. Your account is not on the reviewer list, or the session expired; sign in again.";
    var m = String((e && e.message) || "the save failed").replace(/^queue_todo_done_add:\s*/, "");
    return "Not saved: " + m.charAt(0).toLowerCase() + m.slice(1) + (/[.;]$/.test(m) ? "" : ".");
  }
  /* The card's line: who marked it done and what they wrote, with Reopen; else the note box and Mark done;
     signed out, where to sign in. Redrawn in place after a save. */
  function callDone(c) {
    if (!c || !c.todo_id) return null;
    var box = el("div", { cls: "prh-todo-mark", "data-todo": c.todo_id });
    drawTodoMark(box, c);
    return box;
  }
  function drawTodoMark(box, c) {
    box.textContent = "";
    var m = todoMark(c), id = "prh-todo-" + c.todo_id;
    var status = el("p", { cls: "prh-small", role: "status", id: id + "-status" });
    if (m) {
      var who = String(m.by_email || "").toLowerCase() === (state.review && state.review.email) ? "you" : m.by_email;
      box.appendChild(el("p", { cls: "prh-pg-foot" }, [doneMark(), "Marked done by " + who + ", " + monthDay(m.at) +
        (m.note ? ": " + m.note : "") + ". The next scheduled session takes it first."]));
      var re = el("button", { cls: "prh-word", type: "button", text: "Reopen" });
      re.addEventListener("click", function () { saveTodo(box, c, null, true, re, status); });
      box.appendChild(el("p", null, [re]));
      box.appendChild(status);
      return;
    }
    if (!(state.review && state.review.email)) {
      box.appendChild(el("p", { cls: "prh-small", text: "Sign in as a reviewer to mark this done." }));
      return;
    }
    var note = el("textarea", { id: id + "-note", rows: "3", maxlength: "2000", cls: "prh-draft-text" });
    var go = el("button", { cls: "prh-word", type: "button", text: "Mark done" });
    go.addEventListener("click", function () { saveTodo(box, c, note.value, false, go, status); });
    box.appendChild(el("label", { "for": id + "-note", cls: "prh-small" }, [el("b", { text: "What you did." }),
      " Optional: a contact, a file's link, or what changed. The queue reads it."]));
    box.appendChild(note);
    box.appendChild(el("p", null, [go]));
    box.appendChild(status);
  }
  function saveTodo(box, c, note, reopen, btn, status) {
    btn.disabled = true;
    status.textContent = "Saving…";
    return postTodoMark(c, note, reopen).then(function (row) {
      if (state.review) {
        if (!Array.isArray(state.review.todos)) state.review.todos = [];
        state.review.todos.unshift({ todo_id: c.todo_id, note: row.note === undefined ? (note || null) : row.note,
          reopen: !!reopen, by_email: row.by_email || state.review.email, at: row.at || new Date().toISOString() });
      }
      drawTodoMark(box, c);
      refreshCalls();
    }, function (e) {
      btn.disabled = false;
      status.textContent = todoError(e);
    });
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
  function callAnswered(c) {
    if (c && c.answer && c.answer.words) return true;   /* answered on its sheet (commons_progress.js answeredBy) */
    if (todoMark(c)) return true;                       /* marked done on its card (queue_todo_done) */
    var refs = callRefs(c); return refs.length > 0 && refs.every(refAnswered);
  }
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
      li.textContent = n ? n + (n === 1 ? " call" : " calls") + " waiting on " + who : "Nothing waiting on " + who;
      li.className = n ? "prh-pg-waiting" : "prh-quiet";
    }
    refreshTodo();
  }
  /* A record a call names, as its line on the card. Its state reads from the index; Confirm and
     Needs a fix need the full record, which load() reads by key before the first screen. A call
     the page learns of later reads its records here, and each line redraws once its record lands. */
  function callRecordItem(ref, mine) {
    var p = findRecord(mine, ref);
    if (p && p._gone) p = null;
    var name = ref.label || (p ? (p.program_title + " " + award(p.award)).trim() : shortCollege(ref.college));
    var sl = p && p.requirements_fp ? stateLine(p) : null;
    var line = el("span", { cls: "prh-state" + (sl && sl.waiting ? " prh-state-waiting" : ""), text: sl ? sl.text : "" });
    var read = el("button", { cls: "prh-word", type: "button", text: "Open it on Program records" });
    read.addEventListener("click", function () {
      /* The record's college joins the picked colleges and loads; the search finds the record. */
      state.rq = ref.control_number; state.rshow = "all";
      linkPick([ref.college]); state.rscope = "pick";
      choose("records", true);
    });
    var key = ref.college + "|" + ref.control_number;
    var light = !!(p && p._light);
    var body = [el("p", { cls: "prh-pg-links" }, [p && p.source_url ? link(p.source_url, "The catalog page") : null,
      p && p.source_url ? splitButton(p) : null, read])];
    if (light) body.push(el("p", { cls: "prh-small prh-quiet", text: state.failed[ref.college]
      ? "The record could not be read (" + state.failed[ref.college] + "). Reload the tab to answer here."
      : "Reading the record…" }));
    else if (p && p.requirements_fp) body.push(verdictBox(p, flagsFor(p), line));
    var sum = el("summary", {}, [el("span", { cls: "prh-callrec-t" }, [doneMark(), el("b", { text: ref.control_number }), " " + name]), line]);
    /* Opening a record starts the reading side by side (Sam, 2026-10-10: "The side by side view
       should be the default view when I click in to start confirming"). */
    if (p && p.requirements_fp && (light || p.source_url)) {
      sum.setAttribute("data-split", key);
      sum.addEventListener("click", function (e) { e.preventDefault(); openRecord(p, sum); });
    }
    var item = el("details", { cls: "prh-callrec" + (refAnswered(ref) ? " prh-answered" : ""), "data-key": key }, [
      sum, el("div", { cls: "prh-callrec-b" }, body)]);
    if (light && !state.failed[ref.college]) {
      ensureRows([p]).then(function () {
        if (!item.parentNode) return;
        var had = document.activeElement === sum;
        var next = callRecordItem(ref, state.review && state.review.records);
        item.parentNode.replaceChild(next, item);
        if (had) next.querySelector("summary").focus();
      });
    }
    return item;
  }
  function callRecords(c) {
    var refs = callRefs(c);
    if (!refs.length) return null;
    var Rv = state.review;
    var mine = Rv && Rv.records ? Rv.records : null;
    var items = refs.map(function (ref) { return callRecordItem(ref, mine); });
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
  /* kids as a function: the section's contents are built the first time it is open, so a
     closed college's records cost nothing until the reader opens it. opts.open opens it now. */
  function section(key, title, meta, kids, opts) {
    opts = opts || {};
    var lazy = typeof kids === "function";
    var b = el("div", { cls: "prh-sec-b" }, lazy ? null : kids);
    var d = el("details", { cls: "prh-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key }, [
      el("summary", { cls: "prh-sec-sum" }, [
        opts.label ? el("span", { cls: "prh-sec-label" }, [opts.mark ? doneMark() : null, opts.label]) : null,
        el(opts.h || "h3", { cls: "prh-sec-t", text: title }),
        meta ? el("span", { cls: "prh-sec-meta", text: meta }) : null,
        opts.flag ? el("span", { cls: "prh-sec-flag " + (opts.flag.c || ""), text: opts.flag.t }) : null]),
      b]);
    if (!opts.shut && (opts.open || secOpen(key))) d.setAttribute("open", "");
    if (lazy) {
      var built = false;
      var fill = function () {
        if (built || !d.hasAttribute("open")) return;
        built = true;
        kids().forEach(function (k) { if (k != null) b.appendChild(k); });
      };
      fill();
      d.addEventListener("toggle", fill);
    }
    d.addEventListener("toggle", function () { secSet(key, d.open); });
    return d;
  }
  /* Expand all and Collapse all act on every section (My College's literal reading: a control
     that silently exempts one section reads as broken). */
  function setAllSections(open, root) {
    state.secs = { "*": !!open };
    safeSet(SECTIONS_KEY, JSON.stringify(state.secs));
    Array.prototype.forEach.call((root || document).querySelectorAll("details.prh-sec"), function (d) {
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
  /* ── every row, in pages (2026-10-13) ──
     PostgREST answers at most 1,000 rows a request (db-max-rows), so the one-shot record
     read stopped at the 1,000th of 2,840 records (Content-Range 0-999/*) and the colleges
     after it never reached the tab. It also carried 11 MB of JSON in one statement, and as
     anon (statement_timeout 3s) it answered 500 ("canceling statement due to statement
     timeout"). Each page is RECORD_PAGE rows (or the size a caller names) over the URL's own stable
     order; the first asks for the exact count, so the rest go RECORD_PARALLEL at a time. Without a count it
     reads on until a short page. A failed page fails the whole read, naming the table:
     a short list must never pass for the whole one.
     docs/kb-notes/methodology-paginate-postgrest-reads.md */
  var RECORD_PAGE = 250, RECORD_PARALLEL = 2, RECORD_RETRY_MS = 600;
  /* The light index reads only small columns, so it takes PostgREST's whole 1,000-row page, four
     at a time: 12 requests for 11,969 records where 250-row pages took 48 (S405). */
  var INDEX_PAGE = 1000, INDEX_PARALLEL = 4;
  function getAllRows(url, hdrs, size, parallel) {
    var name = url.split("?")[0].split("/").pop();
    var PAGE = size || RECORD_PAGE, PAR = parallel || RECORD_PARALLEL;
    function page(i) {
      var h = {};
      Object.keys(hdrs || {}).forEach(function (k) { h[k] = hdrs[k]; });
      h["Range-Unit"] = "items";
      h.Range = (i * PAGE) + "-" + ((i + 1) * PAGE - 1);
      if (i === 0) h.Prefer = "count=exact";
      /* A statement cancelled at the role's time limit answers 500; it passes once the
         other reads finish, so a page gets one more try before the read fails. */
      var once = function () { return fetch(url, { headers: h }); };
      return once().then(function (r) {
        if (r.ok || [500, 502, 503, 504].indexOf(r.status) < 0) return r;
        return new Promise(function (res) { setTimeout(res, RECORD_RETRY_MS); }).then(once);
      }).then(function (r) {
        if (!r.ok) throw new Error(name + " answered " + r.status);
        var range = r.headers && typeof r.headers.get === "function" ? r.headers.get("Content-Range") : null;
        var m = /\/(\d+)\s*$/.exec(range || "");
        return r.json().then(function (rows) { return { rows: rows || [], total: m ? +m[1] : null }; });
      });
    }
    return page(0).then(function (first) {
      if (first.rows.length < PAGE) return first.rows;
      if (first.total == null) {
        var out = first.rows.slice();
        var more = function (i) {
          return page(i).then(function (p) {
            out = out.concat(p.rows);
            return p.rows.length < PAGE ? out : more(i + 1);
          });
        };
        return more(1);
      }
      var pages = Math.ceil(first.total / PAGE), got = [first.rows], next = 1;
      var worker = function () {
        if (next >= pages) return Promise.resolve();
        var i = next++;
        return page(i).then(function (p) { got[i] = p.rows; return worker(); });
      };
      var workers = [];
      for (var k = 0; k < Math.min(PAR, pages - 1); k++) workers.push(worker());
      return Promise.all(workers).then(function () {
        return got.reduce(function (all, rows) { return all.concat(rows || []); }, []);
      });
    });
  }
  /* ── the index, and full rows on demand (2026-10-13) ──
     One read of every record's light row (INDEX_SELECT, CHECKED_SELECT) feeds every view that
     spans colleges: the Progress view's counts and headline, the Records view's glance and its
     picker, Sam's to-dos and the waiting signals. A record's full row (RECORD_SELECT) is read for
     the colleges the reader picks (college=in.(...)), or by key where a link, a call or the next
     waiting record names it; it merges into the index row, so each record stays one object.
     A failed read names its table and leaves the rows light; nothing passes a short list off as
     the whole one. */
  var KEY_CHUNK = 200;
  function msg(e) { return (e && e.message) || "the read failed"; }
  function noop() {}
  function keyOf(p) { return p.college + "|" + p.control_number; }
  function keyRef(key) { var k = String(key || "").split("|"); return { college: k[0], control_number: k.slice(1).join("|") }; }
  function isLight(p) { return !!(p && p._light); }
  /* The rows the page reads from: the reviewer's (with fingerprints) when signed in, else the public's. */
  function rows() { return (state.review && state.review.records) || state.records || []; }
  function rowsOf(c) { return rows().filter(function (p) { return p.college === c; }); }
  function setRows(arr) {
    state.records = arr;
    if (state.review && state.review.records) state.review.records = arr;
  }
  function reviewing() { return !!(state.review && state.review.records); }
  /* A PostgREST in.() list: each value quoted, so the period in "Mt. San Antonio College" or a
     comma in a name reads as text. */
  function inList(vals) {
    return "(" + vals.map(function (v) { return '"' + String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }).join(",") + ")";
  }
  function fromIndex(r) {
    var p = { college: r.college, control_number: r.control_number, program_title: r.program_title, checked: !!r.checked,
      checked_by: null, checked_at: null,
      checks: { coverage: r.cov, invented: r.inv, arithmetic: r.ar, reviewer: r.rv == null ? null : { verdict: r.rv } },
      display: { checks: { arithmetic: r.dar, reviewer: r.drv }, counts: { here: r.here } }, _light: true };
    if (r.requirements_fp !== undefined) p.requirements_fp = r.requirements_fp;
    return p;
  }
  function readIndex(hdrs, withFp) {
    var base = REST + "/program_requirement_records?select=";
    return Promise.all([
      getAllRows(base + INDEX_SELECT + (withFp ? "," + FP_SELECT : "") + "&order=college,control_number", hdrs,
        INDEX_PAGE, INDEX_PARALLEL),
      getAllRows(base + CHECKED_SELECT + "&checked=is.true&order=college,control_number", hdrs)
    ]).then(function (got) {
      var at = {};
      var out = (got[0] || []).map(function (r) { var p = fromIndex(r); at[keyOf(p)] = p; return p; });
      (got[1] || []).forEach(function (c) {
        var p = at[keyOf(c)];
        if (!p) return;
        p.checked_by = c.checked_by; p.checked_at = c.checked_at;
        p.display.build = c.build; p.display.built = c.built; p.display.map = { status: c.map };
        p.record = { program: { outcomes: c.out1 == null ? [] : [c.out1] } };
      });
      return out;
    });
  }
  function replaceRow(row, n) {
    Object.keys(row).forEach(function (k) { delete row[k]; });
    for (var k in n) row[k] = n[k];
  }
  /* A fresh index over the rows the page holds: a full row keeps its record and takes the
     index's state, unless its requirements changed, when it goes light and reads again. */
  function absorbIndex(fresh) {
    var old = {};
    (state.records || []).forEach(function (p) { old[keyOf(p)] = p; });
    var out = fresh.map(function (n) {
      var row = old[keyOf(n)];
      if (!row || row === n) return n;
      if (row._light || (n.requirements_fp && row.requirements_fp && n.requirements_fp !== row.requirements_fp)) {
        replaceRow(row, n);
        return row;
      }
      row.checked = n.checked; row.checked_by = n.checked_by; row.checked_at = n.checked_at;
      if (n.requirements_fp !== undefined) row.requirements_fp = n.requirements_fp;
      return row;
    });
    state.failed = {};
    state.draftsRead = null;
    setRows(out);
    return out;
  }
  /* Full rows into the index rows they belong to. scope names what the read covered (whole
     colleges, or keys), so a row it should have returned and did not is gone from the table. */
  function absorb(got, scope) {
    var P = rows(), at = {}, seen = {}, added = [];
    P.forEach(function (p) { at[keyOf(p)] = p; });
    (got || []).forEach(function (f) {
      var k = keyOf(f), row = at[k];
      seen[k] = 1;
      if (!row) { added.push(f); return; }
      var fp = row.requirements_fp;
      replaceRow(row, f);
      if (f.requirements_fp === undefined && fp !== undefined) row.requirements_fp = fp;
    });
    var gone = P.filter(function (p) {
      return p._light && !seen[keyOf(p)] &&
        (scope.colleges ? scope.colleges.indexOf(p.college) >= 0 : scope.keys.indexOf(keyOf(p)) >= 0);
    });
    if (!gone.length && !added.length) return;
    gone.forEach(function (p) { p._gone = true; });
    var out = P.filter(function (p) { return !p._gone; });
    added.forEach(function (f) {
      var at2 = -1;
      out.forEach(function (p, i) { if (p.college === f.college) at2 = i; });
      if (at2 < 0) out.push(f); else out.splice(at2 + 1, 0, f);
    });
    setRows(out);
  }
  function readerHeaders() {
    if (!reviewing()) return Promise.resolve(headers());
    return fresh().then(function () { return sessionHeaders(); });
  }
  function fullSelect() { return RECORD_SELECT + (reviewing() ? "," + FP_SELECT : ""); }
  function readColleges(cols) {
    return readerHeaders().then(function (h) {
      return getAllRows(REST + "/program_requirement_records?select=" + fullSelect() +
        "&college=in." + encodeURIComponent(inList(cols)) + "&order=college,control_number", h);
    });
  }
  /* Records by key: their colleges and their control numbers, one request; a row the pair of
     lists returns beyond the keys asked for is a full row too, and merges like the rest. */
  function readKeys(list) {
    var cols = [], cns = [];
    list.forEach(function (p) {
      if (cols.indexOf(p.college) < 0) cols.push(p.college);
      if (cns.indexOf(p.control_number) < 0) cns.push(p.control_number);
    });
    return readerHeaders().then(function (h) {
      return getAllRows(REST + "/program_requirement_records?select=" + fullSelect() +
        "&college=in." + encodeURIComponent(inList(cols)) + "&control_number=in." + encodeURIComponent(inList(cns)) +
        "&order=college,control_number", h);
    });
  }
  /* Every read in flight, so a test (and nothing else) can wait for the page to settle. */
  var inflight = [], pending = {};
  function track(p) {
    inflight.push(p);
    var drop = function () { var i = inflight.indexOf(p); if (i >= 0) inflight.splice(i, 1); };
    p.then(drop, drop);
    return p;
  }
  function idle(n) {
    n = n || 0;
    var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
    if (!inflight.length || n > 50) return tick();
    return Promise.all(inflight.map(function (p) { return p.then(noop, noop); })).then(tick).then(function () { return idle(n + 1); });
  }
  /* The full rows for these index rows. opts.college reads each one's whole college (a pick);
     otherwise a college asking for more than a page reads whole, and the rest read by key.
     A college whose last read failed waits for opts.retry (a reader's own ask). Resolves either
     way: a row still light afterwards did not arrive, and state.failed says why. */
  function ensureRows(list, opts) {
    opts = opts || {};
    var waits = [], byCol = {}, cols = [];
    (list || []).forEach(function (p) {
      if (!p || !p._light || p._gone) return;
      var k = keyOf(p);
      if (pending[k]) { if (waits.indexOf(pending[k]) < 0) waits.push(pending[k]); return; }
      if (state.failed[p.college] && !opts.retry) return;
      if (!byCol[p.college]) { byCol[p.college] = []; cols.push(p.college); }
      byCol[p.college].push(p);
    });
    var whole = [], keys = [];
    cols.forEach(function (c) {
      if (opts.college || byCol[c].length > RECORD_PAGE) whole.push(c);
      else keys = keys.concat(byCol[c]);
    });
    function run(read, members, colleges, scope) {
      var done = track(read.then(function (got) {
        absorb(got, scope);
        colleges.forEach(function (c) { delete state.failed[c]; });
      }, function (e) {
        colleges.forEach(function (c) { state.failed[c] = msg(e); });
      }).then(function () {
        members.forEach(function (p) { var k = keyOf(p); if (pending[k] === done) delete pending[k]; });
      }));
      members.forEach(function (p) { pending[keyOf(p)] = done; });
      waits.push(done);
    }
    if (whole.length) {
      run(readColleges(whole), rows().filter(function (p) { return p._light && whole.indexOf(p.college) >= 0; }),
        whole, { colleges: whole });
    }
    for (var i = 0; i < keys.length; i += KEY_CHUNK) {
      var chunk = keys.slice(i, i + KEY_CHUNK), cc = [];
      chunk.forEach(function (p) { if (cc.indexOf(p.college) < 0) cc.push(p.college); });
      run(readKeys(chunk), chunk, cc, { keys: chunk.map(keyOf) });
    }
    return Promise.all(waits).then(noop);
  }

  function load() {
    if (state.loading) return Promise.resolve();
    state.loading = true;
    state.error = null;
    /* Signed in, the reviewer's index (every record, with its fingerprint, under the 8 s limit)
       is the page's index too; the public one runs only when nobody is signed in, or the
       reviewer read failed (#2089: one read per visit, never two set against each other). */
    var signedIn = !!session();
    var core = Promise.all([
      getJson(REST + "/program_source_registry?select=" + REGISTRY_SELECT + "&order=college"),
      signedIn ? Promise.resolve(null) : readIndex(headers(), false)
    ]).then(function (got) {
      state.registry = got[0] || [];
      if (!signedIn) absorbIndex(got[1] || []);
    }).catch(function (e) {
      state.error = msg(e);
    });
    return Promise.all([core, loadProgress(), loadReview(), loadFraming(), loadDistricts()]).then(function () {
      if (!signedIn || state.error || reviewing()) return;
      return readIndex(headers(), false).then(absorbIndex, function (e) { state.error = msg(e); });
    }).then(function () {
      /* What the first screen names, read by key before it draws: the reading room's record and,
         for a reviewer, the records the calls name (their Confirm and Needs a fix need them). */
      if (state.error) return;
      var want = firstRefs().map(recordFor).filter(isLight);
      return want.length ? ensureRows(want, { retry: true }) : null;
    }).then(function () {
      state.loading = false;
      render();
      if (RECORD_KEY && !state.recordOpened) { state.recordOpened = true; openKey(RECORD_KEY); }
      /* A record that did not open shows the tab, with whatever it could read. */
      if (!split.on) roomShown();
    });
  }
  function firstRefs() {
    var refs = RECORD_KEY ? [keyRef(RECORD_KEY)] : [];
    var Q = state.progress && state.progress.queue;
    if (reviewing() && Q && Array.isArray(Q.calls)) Q.calls.forEach(function (c) { refs = refs.concat(callRefs(c)); });
    return refs;
  }
  /* Each college's district and Strong Workforce region, for the Records view's filters:
     map_colleges, joined through program_source_registry.college_id. A failed read leaves those
     two filters out and says so; the colleges are still listed by name. */
  function loadDistricts() {
    return getJson(REST + "/map_colleges?select=college_id,district,swp_region").then(function (r) {
      var m = {}, g = {};
      (r || []).forEach(function (x) {
        if (!x || x.college_id == null) return;
        if (x.district) m[x.college_id] = x.district;
        if (x.swp_region) g[x.college_id] = x.swp_region;
      });
      state.districts = m; state.regions = g; state.districtError = null;
    }, function (e) { state.districts = null; state.regions = null; state.districtError = msg(e); });
  }
  function collegeIdOf(c) {
    var reg = (state.registry || []).filter(function (r) { return r.college === c; })[0];
    return reg && reg.college_id != null ? reg.college_id : null;
  }
  function districtOf(c) {
    var id = collegeIdOf(c);
    return id != null && state.districts ? state.districts[id] || null : null;
  }
  function regionOf(c) {
    var id = collegeIdOf(c);
    return id != null && state.regions ? state.regions[id] || null : null;
  }

  /* ── each program's CIP sector (Sam, 2026-10-14) ──
     A sector is the CIP code's two-digit family ("CIP sectors", Sam's word on EACR). A record's
     CIP is its program's in COCI (coci_college_programs, by control number; every record has
     one, 3,306 of 3,478 with a code, 2026-10-14). Read once, the first time the Records view
     opens; a failed read says so and leaves the filter out. The family titles are the CIP
     tab's (cip_crosswalk_data.js `fams`); tests/program_requirements.test.js holds them equal. */
  var CIP_FAMS = {
    "01": "Agricultural/Animal/Plant/Veterinary Science and Related Fields",
    "03": "Natural Resources and Conservation", "04": "Architecture and Related Services",
    "05": "Area, Ethnic, Cultural, Gender, and Group Studies",
    "09": "Communication, Journalism, and Related Programs",
    "10": "Communications Technologies/Technicians and Support Services",
    "11": "Computer and Information Sciences and Support Services",
    "12": "Culinary, Entertainment, and Personal Services", "13": "Education", "14": "Engineering",
    "15": "Engineering/Engineering-Related Technologies/Technicians",
    "16": "Foreign Languages, Literatures, and Linguistics", "19": "Family and Consumer Sciences/Human Sciences",
    "21": "Reserved (Canadian CIP)", "22": "Legal Professions and Studies",
    "23": "English Language and Literature/Letters",
    "24": "Liberal Arts and Sciences, General Studies and Humanities", "25": "Library Science",
    "26": "Biological and Biomedical Sciences", "27": "Mathematics and Statistics",
    "28": "Military Science, Leadership and Operational Art", "29": "Military Technologies and Applied Sciences",
    "30": "Multi/Interdisciplinary Studies", "31": "Parks, Recreation, Leisure, Fitness, and Kinesiology",
    "32": "Basic Skills and Developmental/Remedial Education", "33": "Citizenship Activities",
    "34": "Health-Related Knowledge and Skills", "35": "Interpersonal and Social Skills",
    "36": "Leisure and Recreational Activities", "37": "Personal Awareness and Self-Improvement",
    "38": "Philosophy and Religious Studies", "39": "Theology and Religious Vocations", "40": "Physical Sciences",
    "41": "Science Technologies/Technicians", "42": "Psychology",
    "43": "Homeland Security, Law Enforcement, Firefighting and Related Protective Services",
    "44": "Public Administration and Social Service Professions", "45": "Social Sciences",
    "46": "Construction Trades", "47": "Mechanic and Repair Technologies/Technicians", "48": "Precision Production",
    "49": "Transportation and Materials Moving", "50": "Visual and Performing Arts",
    "51": "Health Professions and Related Programs",
    "52": "Business, Management, Marketing, and Related Support Services",
    "53": "High School/Secondary Diplomas and Certificates", "54": "History", "55": "Reserved (Canadian CIP)",
    "60": "Health Professions Residency/Fellowship Programs", "61": "Medical Residency/Fellowship Programs"
  };
  var NO_CIP = "No CIP assigned yet";
  var CIP_BATCH = 150;
  function sectorOf(p) {
    var c = state.cip && state.cip[p.control_number];
    var m = /^(\d{2})/.exec(String(c || ""));
    return m ? m[1] : "";
  }
  function sectorLabel(k) { return k ? k + " · " + (CIP_FAMS[k] || "CIP family " + k) : NO_CIP; }
  function loadCips() {
    if (state.cip || state.cipLoading || !state.records) return state.cipLoading || Promise.resolve();
    var ctrls = state.records.map(function (p) { return p.control_number; }).filter(Boolean)
      .filter(function (c, i, a) { return a.indexOf(c) === i; });
    var batches = [];
    for (var i = 0; i < ctrls.length; i += CIP_BATCH) batches.push(ctrls.slice(i, i + CIP_BATCH));
    var got = {};
    var one = function (b) {
      return getJson(REST + "/coci_college_programs?select=control_number,cip_code&control_number=in.(" +
        b.map(function (c) { return encodeURIComponent('"' + String(c).replace(/"/g, "") + '"'); }).join(",") + ")").then(function (rows) {
        (rows || []).forEach(function (r) { if (r && r.control_number && r.cip_code) got[r.control_number] = String(r.cip_code); });
      });
    };
    var next = 0;
    var worker = function () {
      if (next >= batches.length) return Promise.resolve();
      var b = batches[next++];
      return one(b).then(worker);
    };
    state.cipError = null;
    state.cipLoading = Promise.all([worker(), worker()]).then(function () {
      state.cip = got;
    }, function (e) { state.cip = null; state.cipError = msg(e); }).then(function () {
      state.cipLoading = null;
      /* The Records view on screen adds its CIP Sector filter in place, keeping its status line. */
      if (typeof state.onCip === "function") state.onCip();
    });
    return state.cipLoading;
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
  function getVerdicts() {
    return fetch(REST + "/program_record_verdicts?select=" + VERDICT_SELECT + "&order=id.desc", { headers: sessionHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error("program_record_verdicts answered " + r.status);
        return r.json();
      });
  }
  /* Signed in: the index with each record's fingerprint (the unchecked records too), and the
     verdict log. A failed read says so on the Records view and the page falls back to the
     public index; it never blocks the tab. */
  function loadReview() {
    if (!session()) { state.review = null; return Promise.resolve(); }
    return fresh().then(function (s) {
      if (!s || !s.email) { state.review = null; return; }
      var email = String(s.email).toLowerCase();
      return Promise.all([readIndex(sessionHeaders(), true), getVerdicts(), getTodoMarks().catch(function () { return []; })]).then(function (got) {
        state.review = { email: email, records: [], verdicts: got[1] || [], todos: got[2] || [], error: null };
        absorbIndex(got[0] || []);
      }, function (e) {
        state.review = { email: email, records: null, verdicts: [], todos: [], error: msg(e) };
      });
    });
  }
  /* A sign-in or sign-out: the index again under the new reader, the rows the page holds kept. */
  function reread() {
    return loadReview().then(function () {
      if (reviewing()) return;
      return readIndex(headers(), false).then(absorbIndex, noop);
    });
  }
  /* A verdict saved in the reading room pings this tab with its record ("<ms> college|number"):
     the verdict log again, and that one record. */
  function pingRead(value) {
    if (!reviewing()) return reread();
    var m = /^\S+\s+(.+\|.+)$/.exec(String(value || ""));
    var p = m ? recordFor(keyRef(m[1])) : null;
    return fresh().then(function () {
      return Promise.all([
        getVerdicts().then(function (v) { if (state.review) state.review.verdicts = v || []; }, noop),
        p ? readKeys([p]).then(function (got) { absorb(got, { keys: [keyOf(p)] }); }, noop) : null
      ]);
    });
  }
  function wireSession() {
    if (state.sessionWired) return;
    state.sessionWired = true;
    window.addEventListener("cpl-session-changed", function () {
      track(reread()).then(function () { if (document.getElementById(ROOT_ID)) render(); });
    });
    window.addEventListener("storage", function (e) {
      if (e.key !== PING_KEY || RECORD_KEY) return;
      track(pingRead(e.newValue)).then(function () { if (document.getElementById(ROOT_ID)) render(); });
    });
  }
  /* The Progress view's own reads. Each fails on its own and says so in the part it
     feeds; none of them fails the tab, and none resolves to a zero.
     COCI's active programs are read by key (S415), not counted: the headline's second number
     is the active programs whose record passes the machine checks (Sam, 2026-10-08: "the ones
     with complete harvested ROEP data"), and 1,331 of the 15,946 records read on 2026-10-18 are
     on programs COCI does not list as active, so a count of records is not a count of them. */
  var ACTIVE_SELECT = "college,control_number";
  function loadProgress() {
    var G = { addenda: null, active: null, activeKeys: null, build: null, queue: null, errors: {}, readAt: new Date() };
    function miss(k) { return function (e) { G.errors[k] = (e && e.message) || "the read failed"; }; }
    var buildCount = sessionHeaders();
    buildCount.Prefer = "count=exact";
    return Promise.all([
      getJson(REST + "/program_source_addenda?select=college,status").then(function (r) { G.addenda = r || []; }, miss("A")),
      getAllRows(REST + "/coci_college_programs?select=" + ACTIVE_SELECT + "&status=eq.Active&order=college,control_number",
        headers(), INDEX_PAGE, INDEX_PARALLEL).then(function (got) {
          var keys = {};
          (got || []).forEach(function (r) { keys[r.college + "|" + r.control_number] = 1; });
          G.activeKeys = keys; G.active = (got || []).length;
        }).catch(miss("active")),
      /* The display build: the newest record's, and how many records carry none yet. Both
         read stored columns or one row's display, never a path over every row (S405), and go out
         under the reader's own sign-in, as every record read does. */
      Promise.all([
        fetch(REST + "/program_requirement_records?select=build:display->>build,built:display->>built" +
          "&display=not.is.null&order=loaded_at.desc&limit=1", { headers: sessionHeaders() })
          .then(function (r) {
            if (!r.ok) throw new Error("program_requirement_records answered " + r.status);
            return r.json();
          }),
        fetch(REST + "/program_requirement_records?select=control_number&display=is.null&limit=1", { headers: buildCount })
          .then(function (r) {
            if (!r.ok) throw new Error("program_requirement_records answered " + r.status);
            var m = /\/(\d+)\s*$/.exec((r.headers && r.headers.get && r.headers.get("content-range")) || "");
            if (!m) throw new Error("program_requirement_records gave no count");
            return Number(m[1]);
          })
      ]).then(function (got) {
        var b = (got[0] || [])[0] || {};
        G.build = { build: b.build || null, built: b.built || null, unbuilt: got[1] };
      }).catch(miss("B")),
      CP.readStatus(QUEUE_URL).then(function (j) { G.queue = j; }).catch(miss("Q"))
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
    if (r.access_status === "not_found") return { t: "Address answers not found", c: "prh-caution", why: "the host answers the reader 404" };
    return { t: "Read", c: "prh-quiet", why: "" };
  }
  /* A catalog the reader cannot reach, and whether a person filed a copy (Sam, 2026-10-21: "put a
     surface flag on the collapsed row of the colleges we can't access and a way to sort for
     them"). The hand-filed step (kb/hand_filed_catalogs/) marks the host it reads in the
     procedure's note; a copy filed for a host the census now answers still counts as filed. */
  var BLOCKED_WHY = { blocked: "a challenge page", robots_disallow: "robots.txt", not_found: "the address answers not found" };
  function catalogAccess(r) {
    var refused = !!(r.access_status && r.access_status !== "ok");
    var hosts = (r.procedure && r.procedure.hosts) || [];
    var filed = hosts.some(function (h) { return /hand-filed/i.test(h.note || ""); });
    if (!refused && !filed) return null;
    var why = BLOCKED_WHY[r.access_status] || r.access_status;
    if (!refused) return { t: "Read from a hand-filed copy", c: "prh-quiet", refused: false, filed: true };
    return filed
      ? { t: "Catalog blocked (" + why + "), read from a hand-filed copy", c: "prh-quiet", refused: true, filed: true }
      : { t: "Catalog blocked (" + why + "), needs a hand-filed copy", c: "prh-caution", refused: true, filed: false };
  }
  function needsPerson(r) { return !r.catalog_url || (r.access_status && r.access_status !== "ok"); }
  /* A published map: the census found one (sequence_source), or a session's read recorded
     its host (sequence_host, which the census never writes). S345: Mt. San Antonio's
     Guided Pathways sequences sit on pages the census does not score, so its row reads
     none_found and still holds an open map. */
  function hasMap(r) { return r.sequence_source === "ppm" || r.sequence_source === "program_map_page" || !!r.sequence_host; }
  /* The live addenda each college lists, from the Progress view's read (listed, read or applied). */
  var LIVE_ADDENDA = ["listed", "read", "applied"];
  function addendaByCollege() {
    var A = state.progress && state.progress.addenda, out = {};
    (A || []).forEach(function (a) { if (LIVE_ADDENDA.indexOf(a.status) >= 0) out[a.college] = (out[a.college] || 0) + 1; });
    return out;
  }
  /* adds: {college: live addenda}, from the Progress view's addenda read; the three filters
     after "drafts" are what the Progress view's counts open (S381). */
  function filterRegistry(rows, q, show, plat, drafts, adds) {
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
      if (show === "noaddress") return !r.catalog_url;
      if (show === "noprocedure") return !r.procedure;
      if (show === "addenda") return !!(adds && adds[r.college]);
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
  /* Which colleges' drafts the page can count: every record of the college is a full row, or
     carries its gaps from the drafts read. A college counted from part of its records would
     show a short count as the whole one. */
  function draftsKnown() {
    var cols = {}, known = {};
    rows().forEach(function (p) {
      cols[p.college] = 1;
      if (known[p.college] === false) return;
      known[p.college] = !p._light || !!p.gapsRead;
    });
    var of = Object.keys(cols).length, k = Object.keys(known).filter(function (c) { return known[c]; }).length;
    return { all: k === of, known: k, of: of, colleges: known };
  }
  function knownDrafts() {
    var d = collegeDrafts(rows()), dk = draftsKnown(), out = {};
    Object.keys(d).forEach(function (c) { if (dk.colleges[c]) out[c] = d[c]; });
    return out;
  }
  /* Every record's gaps, for the Catalogs view's drafts (DRAFT_SELECT), read once on request. */
  function readDrafts() {
    if (state.draftsRead) return state.draftsRead;
    state.draftsError = null;
    var run = readerHeaders().then(function (h) {
      return getAllRows(REST + "/program_requirement_records?select=" + DRAFT_SELECT + "&order=college,control_number", h);
    }).then(function (got) {
      var at = {};
      rows().forEach(function (p) { at[keyOf(p)] = p; });
      (got || []).forEach(function (g) {
        var p = at[keyOf(g)];
        if (!p || !p._light) return;
        p.award = g.award; p.catalog_year = g.catalog_year; p.display.gaps = g.gaps || []; p.gapsRead = true;
      });
      /* A row the read did not return has left the table since the index: it holds no draft. */
      rows().forEach(function (p) { if (p._light && !p.gapsRead) { p.display.gaps = []; p.gapsRead = true; } });
    }, function (e) { state.draftsError = msg(e); state.draftsRead = null; });
    state.draftsRead = track(run);
    return state.draftsRead;
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
    /* Courses the catalog recommends count toward nothing (Sam's rule 4, 2026-10-11) */
    if (b.rule === "recommended") return "Recommended, not required";
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
      /* the done mark: a check drawn in CSS, ghosted, always beside the word that says it */
      ".prh-done-mark { display:inline-block; width:5px; height:10px; margin:0 8px 2px 2px; border-right:2px solid var(--seal-blue-text); border-bottom:2px solid var(--seal-blue-text); transform:rotate(45deg); vertical-align:middle; }",
      ".prh-callrec:not(.prh-answered) .prh-done-mark { visibility:hidden; }",
      ".prh h2 { margin:0; color:var(--text-strong); font-size:clamp(1.4rem, 2.6vw, 1.9rem); line-height:1.2; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }",
      ".prh h3 { margin:0; color:var(--text-strong); font-size:1.05rem; }",
      ".prh h4 { margin:0 0 6px; color:var(--text-strong); font-size:.95rem; display:flex; flex-wrap:wrap; gap:4px 12px; align-items:baseline; }",
      ".prh-draft { font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; background:var(--mustard-fill); color:var(--on-mustard, var(--text-strong)); border-radius:10px; padding:3px 10px; }",
      ".prh-meta { margin:0; font-size:.875rem; color:var(--text-muted); max-width:var(--cpl-measure,none); }",
      /* controls are underlined words (Sam, 2026-10-09); the view in use reads heavier and darker */
      ".prh-switch { display:flex; flex-wrap:wrap; gap:6px 18px; padding-block:14px; }",
      ".prh-switch button { font:inherit; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-switch button:hover { text-decoration-thickness:2px; }",
      ".prh-switch button[aria-selected=\"true\"] { color:var(--text-strong); font-weight:700; text-decoration-thickness:2px; }",
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
      /* A college lists hundreds of records: the browser lays out only the cards near the screen. */
      ".prh-college .prh-rec { content-visibility:auto; contain-intrinsic-size:auto 240px; }",
      ".prh-card { padding:16px; display:grid; gap:12px; margin-bottom:18px; }",
      ".prh-rhead { padding:12px 14px; display:grid; gap:8px 18px; grid-template-columns:minmax(0,1.4fr) minmax(0,2.2fr) minmax(0,1fr); align-items:start; }",
      ".prh-rec.prh-open .prh-rhead { border-bottom:1px solid var(--border); }",
      ".prh-rtitle { min-width:0; display:grid; gap:2px; justify-items:start; }",
      ".prh-rtitle strong { color:var(--text-strong); }",
      ".prh-toggle { font:inherit; font-size:.875rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; margin-top:4px; }",
      ".prh-toggle:hover { text-decoration-thickness:2px; }",
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
      ".prh-draft-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px 18px; }",
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
      ".prh-college-line summary { cursor:pointer; min-height:24px; }",
      ".prh-college-line ul { margin:6px 0 0; padding-left:1.2em; max-width:var(--cpl-measure,none); }",
      ".prh-college-line p { margin:6px 0 0; }",
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
      /* COCI's word on a mismatched course, and a unit difference kept as printed: quiet chips the college reads */
      ".prh-coci { display:inline-block; margin:2px 0 0; padding:0 6px; border:1px solid var(--border-strong); border-radius:4px; font-size:.75rem; font-weight:600; line-height:1.5; color:var(--text-muted); overflow-wrap:anywhere; }",
      ".prh-alts .prh-coci { display:table; }",
      ".prh-coci.prh-differ { color:var(--red-alert); border-color:var(--red-alert); }",
      ".prh-differ-line { color:var(--red-alert); font-weight:600; }",
      /* the verdict's actions are underlined words; the lead comes first, never filled (Sam, 2026-10-09) */
      ".prh-btn { font:inherit; font-size:.9rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-btn:hover { text-decoration-thickness:2px; }",
      ".prh-btn[disabled] { cursor:wait; }",
      ".prh-review-note p { margin:0; }",
      /* the Records view's college picker (2026-10-13): a district's colleges under it, each a
         checkbox with its counts; one column on a phone */
      ".prh-filterbar { display:grid; gap:6px; margin:0 0 16px; }",
      ".prh-filters { display:flex; flex-wrap:wrap; align-items:center; gap:4px 20px; }",
      ".prh-dd { position:relative; }",
      ".prh-dd-pop { position:absolute; z-index:20; top:100%; left:0; margin-top:4px; width:min(26rem, 90vw); max-height:min(60vh, 26rem); overflow:auto; box-sizing:border-box; padding:10px 12px; display:grid; gap:8px; background:var(--surface-opaque); color:var(--text-body); border:1px solid var(--border-strong); border-radius:10px; }",
      ".prh-dd-pop[hidden] { display:none; }",
      ".prh-dd-find { font:inherit; font-size:.875rem; min-height:32px; padding:4px 8px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); color:var(--text-body); }",
      ".prh-dd-find:focus-visible { outline:2px solid var(--cobalt); outline-offset:1px; }",
      ".prh-dd-list { list-style:none; margin:0; padding:0; display:grid; gap:2px; }",
      ".prh-dd-list li[hidden] { display:none; }",
      ".prh-dd-list label { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; min-height:24px; cursor:pointer; font-size:.9375rem; color:var(--text-body); }",
      ".prh-dd-list input[type=\"checkbox\"] { width:24px; height:24px; margin:0; flex:none; accent-color:var(--cobalt); cursor:pointer; }",
      ".prh-dd-list input[type=\"checkbox\"]:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      ".prh-dd-acts:empty { display:none; }",
      "@media (max-width: 560px) { .prh-dd { position:static; } .prh-dd-pop { left:0; right:0; width:auto; } .prh-filterbar { position:relative; } }",
      ".prh-pick-c { min-width:0; overflow-wrap:anywhere; }",
      ".prh-pick-n { flex:1 0 100%; padding-left:26px; font-size:.8125rem; font-weight:400; color:var(--text-muted); font-variant-numeric:tabular-nums; }",
      ".prh-rscope { margin:8px 0 0; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 16px; }",
      ".prh-rscope[hidden], .prh-word[hidden] { display:none; }",
      ".prh-draft-note { margin:0 0 10px; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 12px; }",
      ".prh-draft-note:empty { display:none; }",
      "@media (max-width: 860px) { .prh-rhead { grid-template-columns:minmax(0,1fr); } .prh-checks { grid-template-columns:repeat(2, minmax(0,1fr)); } }",
      "@media (max-width: 560px) { .prh-count { margin-left:0; width:100%; }" +
        " .prh table.prh-stack thead { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }" +
        " .prh table.prh-stack, .prh table.prh-stack tbody, .prh table.prh-stack tr { display:block; width:100%; }" +
        " .prh table.prh-stack tr { border-top:1px solid var(--border); padding-block:6px; }" +
        " .prh table.prh-stack tbody th, .prh table.prh-stack tbody td { display:grid; grid-template-columns:7.5rem minmax(0,1fr); gap:8px; border:0; padding:4px 12px; }" +
        " .prh table.prh-stack tbody td::before, .prh table.prh-stack tbody th::before { content:attr(data-label); font-weight:600; color:var(--text-muted); font-size:.8125rem; } }",
      /* sections: a <details> per section, its summary the heading plus a line that reads shut;
         the marker is drawn in CSS (a word-free disclosure, no glyph) */
      ".prh-allctl { display:flex; flex-wrap:wrap; gap:6px 18px; }",
      ".prh-all { font:inherit; font-size:.875rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-all:hover { text-decoration-thickness:2px; }",
      ".prh-sec { border:1px solid var(--border); border-radius:10px; background:var(--surface-opaque); margin-bottom:12px; min-width:0; }",
      ".prh-sec-sum { list-style:none; cursor:pointer; position:relative; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 12px; padding:11px 14px 11px 36px; min-height:44px; box-sizing:border-box; border-radius:10px; }",
      ".prh-sec-sum::-webkit-details-marker { display:none; }",
      ".prh-sec-sum::before { content:\"\"; position:absolute; left:15px; top:19px; width:7px; height:7px; border-right:2px solid var(--text-muted); border-bottom:2px solid var(--text-muted); transform:rotate(-45deg); transition:transform .12s ease; }",
      ".prh-sec[open] > .prh-sec-sum::before { transform:rotate(45deg); top:16px; }",
      ".prh-sec-sum:hover .prh-sec-t { color:var(--cobalt); }",
      ".prh-sec-sum:focus-visible { outline:2px solid var(--focus-ring, var(--cobalt)); outline-offset:-2px; }",
      ".prh-sec-t { margin:0; font-size:1.05rem; color:var(--text-strong); }",
      ".prh-sec-meta { font-size:.875rem; color:var(--text-muted); font-variant-numeric:tabular-nums; }",
      ".prh-sec-flag { font-size:.875rem; flex-basis:100%; }",
      ".prh-sec-label { flex:1 0 100%; font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-sec-b { padding:2px 14px 14px; min-width:0; }",
      ".prh-sec-b > .prh-facts { margin-block:4px 0; }",
      ".prh-sec-b > .prh-card { border:0; padding:4px 0 0; margin:0; background:none; }",
      /* the Progress view's own CSS (prh-pg-*) is injected by commons_progress.js, the Commons' shared module (S419) */
      ".prh-word { font:inherit; font-size:.9rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      ".prh-word:hover { text-decoration-thickness:2px; }",
      ".prh-word:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
      ".prh-callrecs { margin:.6rem 0 0; display:grid; gap:0; }",
      ".prh-callrec { border-top:1px solid var(--border); }",
      ".prh-callrec > summary { display:flex; flex-wrap:wrap; align-items:center; gap:.2rem .75rem; min-height:44px; padding:.35rem 0; cursor:pointer; }",
      ".prh-callrec-t { flex:1 1 12rem; min-width:0; }",
      ".prh-callrec-b { padding:0 0 .75rem; }",
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
      /* a course's numbers, its CPL count and the exhibits view (Sam, 2026-10-10) */
      ".prh-ids { display:flex; flex-wrap:wrap; gap:0 8px; margin-top:2px; }",
      ".prh-id { font:inherit; font-size:.75rem; font-weight:600; color:var(--text-muted); background:none; border:0; padding:2px 0; min-height:24px; cursor:help; text-decoration:underline dotted; text-underline-offset:3px; white-space:nowrap; }",
      ".prh-id:hover, .prh-id:focus-visible { color:var(--seal-blue-text); }",
      ".prh-tip { position:fixed; z-index:10002; max-width:280px; box-sizing:border-box; padding:6px 10px; border-radius:6px; background:var(--text-strong); color:var(--paper); font-size:.8125rem; line-height:1.35; pointer-events:none; }",
      ".prh-tip[hidden] { display:none; }",
      ".prh-cplbtn { font:inherit; font-weight:700; color:var(--cobalt); background:none; border:0; padding:2px 4px; min-height:24px; min-width:24px; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }",
      ".prh-cplbtn.prh-cplbtn-zero { font-weight:400; color:var(--text-muted); }",
      ".prh-cplbtn:hover { text-decoration-thickness:2px; }",
      ".prh-exback { position:fixed; inset:0; z-index:10001; background:color-mix(in srgb, var(--text-strong) 40%, transparent); display:grid; place-items:center; padding:16px; }",
      ".prh-exdialog { width:min(640px, 100%); max-height:min(80vh, 720px); overflow:auto; box-sizing:border-box; background:var(--surface-opaque); color:var(--text-body); border:1px solid var(--border-strong); border-radius:12px; padding:14px 16px 18px; display:grid; gap:10px; }",
      ".prh-exhead { display:flex; align-items:baseline; gap:8px 16px; }",
      ".prh-exhead h3 { flex:1 1 auto; min-width:0; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; font-size:1rem; }",
      ".prh .prh-exhead h3[tabindex]:focus, .prh .prh-exhead h3[tabindex]:focus-visible { outline:none; }",
      ".prh-exbody h4 { margin:6px 0 4px; }",
      ".prh-exlist { list-style:none; margin:0; padding:0; display:grid; gap:8px; }",
      ".prh-exlist li { display:grid; gap:2px; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--surface-subtle); }",
      ".prh-outslot:not(:empty) { margin-left:8px; }",
      ".prh-outbtn { font-size:.8rem; font-weight:500; }",
      ".prh-outlist { margin:0; padding-left:1.4em; display:grid; gap:6px; }",
      ".prh-extype { justify-self:start; font-size:.75rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
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
    var drafts = knownDrafts(), adds = addendaByCollege();
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
      ["procedure", "Has a reading procedure"], ["drafts", "Has drafts for the college"],
      ["noaddress", "No catalog address"], ["noprocedure", "No reading procedure yet"], ["addenda", "Lists a catalog addendum"]
    ].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.show;
    var q = el("input", { id: "prh-q", type: "search", placeholder: "College name", autocomplete: "off" });
    q.value = state.q;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    var host = el("div");
    /* Drafts for the college need each record's gaps (Sam's sheet 32 card 2), which the index
       does not carry: a college whose records this page holds counts its own, and the rest are
       read for every record when the reader asks, or chooses the drafts filter. */
    var draftNote = el("p", { cls: "prh-small prh-quiet prh-draft-note", role: "status", "aria-live": "polite" });
    function countDrafts() {
      readDrafts().then(function () { drafts = knownDrafts(); if (host.isConnected !== false) draw(); });
    }
    function noteDrafts() {
      var dk = draftsKnown();
      draftNote.textContent = "";
      if (dk.all) return;
      if (state.draftsError) {
        draftNote.appendChild(document.createTextNode("The drafts could not be counted (" + state.draftsError + "). "));
      } else if (state.draftsRead) {
        draftNote.appendChild(document.createTextNode("Reading every record's gaps to count the drafts for each college…"));
        return;
      } else {
        draftNote.appendChild(document.createTextNode("This page counts drafts for the college at the " + dk.known + " of " + dk.of +
          " colleges whose records it holds. "));
      }
      var go = el("button", { cls: "prh-word", type: "button", text: state.draftsError ? "Read again" : "Count them at every college" });
      go.addEventListener("click", function () { state.draftsError = null; countDrafts(); noteDrafts(); draw(); });
      draftNote.appendChild(go);
    }
    function draw() {
      state.q = q.value; state.show = showSel.value; state.platform = platSel.value;
      noteDrafts();
      if (state.show === "drafts" && !draftsKnown().all) {
        /* The filter waits for every college's count; a partial list never stands for the whole. */
        host.textContent = "";
        count.textContent = "";
        if (state.draftsError) {
          host.appendChild(el("div", { cls: "prh-empty", text: "The drafts could not be counted (" + state.draftsError + "). Read again above." }));
          return;
        }
        host.appendChild(el("div", { cls: "prh-empty", text: "Reading every record's gaps to count the drafts for each college…" }));
        if (!state.draftsRead) { countDrafts(); noteDrafts(); }
        return;
      }
      var rows = filterRegistry(R, state.q, state.show, state.platform, drafts, adds);
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
      ]), draftNote, host]));
    draw();
    return box;
  }

  /* ── flags (the mock-up's numbered questions) ──
     Each gap the display build carries, other than a reader's note, is a flag. It sits on
     the first block that prints a course its text names, and every row printing one of
     those courses carries its number; a flag naming no printed course sits on the whole
     record. The owner is the gap's: the college, or the reading procedure.
     Numbered boxes are the reading procedure's alone (Sam, Open Asks Sheet 77 card 3, "Build
     it", 2026-10-13 22:25Z). A gap the college owns (the catalog and the state file differ,
     MAP names a second course) is the college's to correct, outside the reviewer's confirm:
     the record shows them on one line that opens to the list (collegeLine), and each
     college's full list is on My College and the MAP team's queue. */
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
    var flags = [], notes = [], college = [], byCode = {};
    gaps.forEach(function (g) {
      if (NOTE_KINDS[g.kind]) { notes.push(g); return; }
      if (g.owner === "college") { college.push({ kind: g.kind, owner: "college", text: g.text }); return; }
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
      flags.push({ kind: g.kind, owner: "procedure", text: g.text, codes: named, block: at });
    });
    /* Numbered in the order a reader meets them: the whole record first, then block by block. */
    flags.sort(function (a, b) { return (a.block == null ? -1 : a.block) - (b.block == null ? -1 : b.block); });
    flags.forEach(function (f, i) {
      f.n = i + 1;
      f.codes.forEach(function (c) { (byCode[c] = byCode[c] || []).push(f.n); });
    });
    return { flags: flags, college: college, notes: notes, byCode: byCode };
  }
  function flagSummary(flags) {
    if (!flags.length) return "None";
    return flags.length + ", for the reading procedure";
  }
  function flagBox(f) {
    return el("div", { cls: "prh-flag prh-flag-reading", "data-flag": String(f.n) }, [
      el("div", { cls: "prh-flag-top" }, [
        el("span", { cls: "prh-flag-n", text: "Flag " + f.n }),
        el("span", { cls: "prh-flag-kind", text: f.kind || "A question" }),
        el("span", { cls: "prh-flag-owner", text: "For the reading procedure" })]),
      el("p", { text: f.text })]);
  }
  /* The college's items as one line: how many, of which kinds; it opens to the list. */
  var COLLEGE_KIND_WORDS = {
    "Catalog and state file differ": ["place the catalog and the state file differ", "places the catalog and the state file differ"],
    "MAP names a second course": ["second course MAP names", "second courses MAP names"]
  };
  function collegeCount(items) {
    var by = {}, order = [];
    items.forEach(function (i) { if (!by[i.kind]) { by[i.kind] = 0; order.push(i.kind); } by[i.kind]++; });
    return order.map(function (k) {
      var w = COLLEGE_KIND_WORDS[k] || [k, k];
      return by[k] + " " + (by[k] === 1 ? w[0] : w[1]);
    }).join("; ");
  }
  /* A mismatch in the summary row: the words carry it, the alert color makes it stand out. */
  function mismatch(text) { return el("span", { cls: "prh-coci prh-differ", text: text }); }
  function collegeLine(p, items) {
    var kinds = {};
    items.forEach(function (i) { kinds[i.kind] = 1; });
    var several = Object.keys(kinds).length > 1;
    return el("details", { cls: "prh-college-line" }, [
      el("summary", { cls: "prh-differ-line", text: collegeCount(items) }),
      el("p", { cls: "prh-small prh-quiet", text: "For " + shortCollege(p.college) + " to correct; they do not hold the record back. " +
        "The college's full list is on My College and in the MAP team's queue." }),
      el("ul", {}, items.map(function (i) { return el("li", { text: (several && i.kind ? i.kind + ": " : "") + i.text }); }))]);
  }
  /* ── a course's numbers and its CPL (Sam, 2026-10-10) ──
   * "If there is a CID, CCN, MID, show those numbers on the blocks as well with a hover over for
   * their titles (since space is limited). For the CPL column the number should be the count of
   * exhibits articulated to the course with a click drill down to pop up an exhibits view." The
   * display build carries both (kb/_build_roep_display.py: `ids`, and `here.exhibits` with its
   * count); a record built before them shows its one identity and the older count. */
  var ID_WORD = { "CCN": "CCN", "C-ID": "C-ID", "M-ID": "M-ID", "CCR": "M-ID" };
  function courseIds(info) {
    if (info.ids && info.ids.length) return info.ids;
    var i = info.identity;
    return i && i.id ? [{ kind: ID_WORD[i.kind] || i.kind, id: i.id, title: i.title }] : [];
  }
  function idChips(info) {
    var ids = courseIds(info);
    if (!ids.length) return null;
    return el("span", { cls: "prh-ids" }, ids.map(function (i) {
      var word = ID_WORD[i.kind] || i.kind;
      var b = el("button", { cls: "prh-id", type: "button", "data-tip": i.title || "No title on record",
        "aria-label": word + " " + i.id + ": " + (i.title || "no title on record") }, [word + " " + i.id]);
      wireTip(b);
      return b;
    }));
  }
  function exhibitCount(info) {
    var h = info.here || {};
    return h.exhibits_n != null ? h.exhibits_n : (h.recs || 0) + (h.credentials_n || 0);
  }
  function hasLeads(info) { return !!((info.adopt && info.adopt.credentials_n) || (info.consider && info.consider.length)); }
  function cplButton(p, code, info, n) {
    var b = el("button", { cls: "prh-cplbtn" + (n ? "" : " prh-cplbtn-zero"), type: "button",
      "aria-label": n + (n === 1 ? " exhibit" : " exhibits") + " articulated to " + code + " at " + shortCollege(p.college) +
        (hasLeads(info) ? ", with leads from other colleges" : "") + "; show them" }, [String(n)]);
    b.addEventListener("click", function () { openExhibits(p, code, info, b); });
    return b;
  }

  /* One tooltip for every number: shown on hover and on focus (a tap focuses the button on a
     phone), placed beside the button in the page, so a scrolling table never clips it. */
  var tipNode = null;
  function showTip(b) {
    if (!tipNode) {
      tipNode = el("div", { cls: "prh prh-tip", role: "tooltip", id: "prh-tip" });
      document.body.appendChild(tipNode);
    }
    tipNode.textContent = b.getAttribute("data-tip") || "";
    tipNode.hidden = false;
    b.setAttribute("aria-describedby", "prh-tip");
    var r = b.getBoundingClientRect ? b.getBoundingClientRect() : { left: 0, bottom: 0, top: 0 };
    var x = Math.max(8, Math.min(r.left, (window.innerWidth || 800) - 288));
    var below = r.bottom + 6, above = r.top - 6;
    tipNode.style.left = x + "px";
    tipNode.style.top = (below + 60 > (window.innerHeight || 600) && above > 60 ? above - (tipNode.offsetHeight || 40) : below) + "px";
  }
  function hideTip(b) {
    if (tipNode) tipNode.hidden = true;
    if (b) b.removeAttribute("aria-describedby");
  }
  function wireTip(b) {
    b.addEventListener("mouseenter", function () { showTip(b); });
    b.addEventListener("focus", function () { showTip(b); });
    b.addEventListener("mouseleave", function () { if (document.activeElement !== b) hideTip(b); });
    b.addEventListener("blur", function () { hideTip(b); });
    b.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); hideTip(b); } });
  }

  /* The exhibits view: what is articulated to the course at this college, then the leads (a peer
     articulated it to a course of the same identity; a statewide recommendation names its C-ID),
     the three kinds the display build defines. A dialog over whatever is open, the split view
     included; Escape or Close returns to the number that opened it. */
  var exDialog = null;
  function openExhibits(p, code, info, opener) {
    closeExhibits();
    hideTip();
    var h = info.here || {}, n = exhibitCount(info);
    var list = el("ul", { cls: "prh-exlist" });
    (h.exhibits || []).forEach(function (x) {
      var recs = x.recs && x.recs.length ? x.recs.join("; ")
        : x.recs_n ? x.recs_n + (x.recs_n === 1 ? " credit recommendation in MAP" : " credit recommendations in MAP") : "";
      list.appendChild(el("li", {}, [
        el("b", { text: x.credential || x.title || "An exhibit" }),
        x.type ? el("span", { cls: "prh-extype", text: x.type }) : null,
        x.title && x.credential && x.title !== x.credential ? el("span", { cls: "prh-alts", text: "MAP exhibit: " + x.title + (x.exhibit ? " (" + x.exhibit + ")" : "") })
          : x.exhibit ? el("span", { cls: "prh-alts", text: "MAP exhibit " + x.exhibit }) : null,
        recs ? el("span", { cls: "prh-alts", text: recs }) : null]));
    });
    if (h.untitled_n) list.appendChild(el("li", { cls: "prh-quiet", text: h.untitled_n + (h.untitled_n === 1 ? " more exhibit in MAP carries no title." : " more exhibits in MAP carry no title.") }));
    var kids = [el("h4", { text: "Articulated at " + shortCollege(p.college) + " (" + n + ")" }),
      n ? list : el("p", { cls: "prh-quiet", text: "No exhibit is articulated to this course at " + shortCollege(p.college) + " yet." })];
    var ad = info.adopt;
    if (ad && ad.credentials && ad.credentials.length) {
      kids.push(el("h4", { text: "Could adopt (" + ad.credentials_n + ")" }));
      kids.push(el("ul", { cls: "prh-exlist" }, ad.credentials.map(function (a) {
        return el("li", {}, [el("b", { text: a.credential }),
          el("span", { cls: "prh-alts", text: "Articulated to a course of the same identity at " + (a.colleges || []).map(shortCollege).join(", ") }),
          mapLine(a.credential)]);
      })));
      if (ad.credentials_n > ad.credentials.length) kids.push(el("p", { cls: "prh-small prh-quiet", text: "And " + (ad.credentials_n - ad.credentials.length) + " more." }));
    }
    if (info.consider && info.consider.length) {
      kids.push(el("h4", { text: "For consideration (" + info.consider.length + ")" }));
      kids.push(el("ul", { cls: "prh-exlist" }, info.consider.map(function (c) {
        return el("li", {}, [el("b", { text: c.credential }),
          el("span", { cls: "prh-alts", text: (c.credit ? c.credit + "; " : "") + "a statewide recommendation names C-ID " + c.cid })]);
      })));
    }
    openDialog(p, code, info, kids, "the exhibits", opener);
  }
  /* The one dialog both views open: a course's heading, its numbers, and the body it is given. */
  function openDialog(p, code, info, kids, what, opener) {
    var close = el("button", { cls: "prh-word", type: "button", text: "Close", "aria-label": "Close " + what + " for " + code });
    var node = el("div", { cls: "prh prh-exback" }, [
      el("div", { cls: "prh-exdialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "prh-ex-t" }, [
        el("div", { cls: "prh-exhead" }, [
          el("h3", { id: "prh-ex-t", tabindex: "-1" }, [code + (info.title ? " " + info.title : ""),
            el("span", { cls: "prh-small prh-quiet", text: shortCollege(p.college) })]),
          close]),
        idChips(info),
        el("div", { cls: "prh-exbody" }, kids)])]);
    close.addEventListener("click", function () { closeExhibits(); });
    node.addEventListener("click", function (e) { if (e.target === node) closeExhibits(); });
    node.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeExhibits(); } });
    var inert = Array.prototype.filter.call(document.body.children, function (x) {
      return x !== node && x !== tipNode && !x.hasAttribute("inert") && x.tagName !== "SCRIPT";
    });
    inert.forEach(function (x) { x.setAttribute("inert", ""); });
    document.body.appendChild(node);
    exDialog = { node: node, opener: opener, inert: inert };
    document.getElementById("prh-ex-t").focus();
  }
  function closeExhibits() {
    if (!exDialog) return;
    var d = exDialog;
    exDialog = null;
    hideTip();
    if (d.node.parentNode) d.node.parentNode.removeChild(d.node);
    d.inert.forEach(function (x) { x.removeAttribute("inert"); });
    if (d.opener && d.opener.focus) d.opener.focus();
  }

  /* ── a course's learning outcomes (Sam, 2026-10-14) ──
   * "Where can I view the SLOs we've pulled so far? Seems like there should be a link to them on
   * each course listing." course_outcomes holds each course's SLOs as its outline or catalog
   * prints them (public read; the newest read_run is current). A college's codes are read once,
   * as an index, when one of its records opens; a course's outcomes when its link is clicked.
   * The two sides print a code with or without its space or hyphen (PSYCH35, PSYCH 35, BUS-47),
   * so they meet on codeKey. A failed read says so in the record; it never passes for no outcomes. */
  var OUTCOME_SELECT = "course_code,course_title,heading,lead,outcomes,maps_to,shape,fingerprint," +
    "source_url,source_kind,source_system,read_run,loaded_at";
  var OUTCOME_SOURCE = { course_outline: "the course outline of record", catalog: "the catalog's course page" };
  function codeKey(code) { return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  var outcomeIndex = {};
  function outcomeCodes(college) {
    if (!outcomeIndex[college]) {
      outcomeIndex[college] = getAllRows(REST + "/course_outcomes?select=course_code&college=eq." +
        encodeURIComponent(college) + "&order=id", headers()).then(function (rows) {
        var m = {};
        rows.forEach(function (r) {
          var k = codeKey(r.course_code);
          if (!m[k]) m[k] = [];
          if (m[k].indexOf(r.course_code) < 0) m[k].push(r.course_code);
        });
        return m;
      }, function (err) { delete outcomeIndex[college]; throw err; });
    }
    return outcomeIndex[college];
  }
  /* The link on each course row of a record that has outcomes, and a quiet line if the read fails. */
  function fillOutcomeLinks(body, p, courses) {
    outcomeCodes(p.college).then(function (index) {
      Array.prototype.forEach.call(body.querySelectorAll(".prh-outslot"), function (slot) {
        var codes = index[slot.getAttribute("data-key")];
        if (!codes || slot.firstChild) return;
        var code = slot.getAttribute("data-code"), info = courses[code] || {};
        var b = el("button", { cls: "prh-word prh-outbtn", type: "button", text: "Outcomes",
          "aria-label": "Learning outcomes of " + code + " at " + shortCollege(p.college) + "; show them" });
        b.addEventListener("click", function () { openOutcomes(p, code, info, codes, b); });
        slot.appendChild(b);
      });
    }, function (err) {
      body.appendChild(el("p", { cls: "prh-small prh-quiet", style: "margin:0",
        text: "The courses' learning outcomes could not be read (" + (err && err.message || "no answer") + ")." }));
    });
  }
  function currentOutcomes(rows) {
    var top = rows.reduce(function (m, r) { return Math.max(m, Number(r.read_run) || 0); }, 0), seen = {};
    return rows.filter(function (r) {
      if ((Number(r.read_run) || 0) !== top || seen[r.fingerprint]) return false;
      seen[r.fingerprint] = true;
      return true;
    });
  }
  function outcomesBlock(o) {
    var maps = o.maps_to || [];
    var list = o.shape === "paragraph" && o.outcomes.length === 1 ? el("p", { text: o.outcomes[0] })
      : el("ol", { cls: "prh-outlist" }, o.outcomes.map(function (t, i) {
        var m = maps[i] && maps[i].length ? maps[i] : null;
        return el("li", {}, [t, m ? el("span", { cls: "prh-alts", text: "Maps to: " + m.join("; ") }) : null]);
      }));
    return [el("h4", { text: (o.heading || "Learning outcomes") + " (" + o.outcomes.length + ")" }),
      o.lead ? el("p", { cls: "prh-small", text: o.lead }) : null,
      list,
      el("p", { cls: "prh-small prh-quiet" }, ["As printed in ",
        link(o.source_url, OUTCOME_SOURCE[o.source_kind] || "the college's page"),
        (o.source_system ? " (" + o.source_system + ")" : "") + ", read " + day(o.loaded_at) + "."])];
  }
  function openOutcomes(p, code, info, codes, opener) {
    closeExhibits();
    hideTip();
    var body = el("div", {}, [el("p", { cls: "prh-quiet", text: "Reading the outcomes…" })]);
    openDialog(p, code, info, [body], "the learning outcomes", opener);
    var url = REST + "/course_outcomes?select=" + OUTCOME_SELECT + "&college=eq." + encodeURIComponent(p.college) +
      "&course_code=in.(" + codes.map(function (c) { return encodeURIComponent('"' + c.replace(/"/g, "") + '"'); }).join(",") + ")" +
      "&order=read_run.desc,id.desc";
    getJson(url).then(function (rows) {
      var cur = currentOutcomes(rows || []);
      body.textContent = "";
      if (!cur.length) { body.appendChild(el("p", { cls: "prh-quiet", text: "No outcomes are on file for " + code + " yet." })); return; }
      cur.forEach(function (o) { outcomesBlock(o).forEach(function (n) { if (n) body.appendChild(n); }); });
    }, function (err) {
      body.textContent = "";
      body.appendChild(el("p", { text: "The outcomes could not be read (" + (err && err.message || "no answer") + ")." }));
    });
  }

  /* What COCI says of a course the catalog prints off the program's list (Sam, 2026-10-11:
     "list them with a chip noting the Coci status so the college can follow up if needed.
     Make this a rule for all such courses."): its status on the program, the control number
     the program points at, and the current version's. The display build carries it. */
  /* f.listed: the program lists the course through an older version, and the college still
     offers the current one (Sam, 2026-10-11: "it shouldn't matter that they have older
     inactive versions"). The chip stays so the college can update the pointer in COCI. */
  function cociText(f) {
    if (f.listed) return "In COCI: the program lists an older version (" + f.program_ccn + ", " + (f.status || "no status") +
      "); current version " + f.current_ccn;
    return "In COCI: " + (f.status || "no status") + " on this program (" + f.program_ccn + ")" +
      (f.current_ccn ? "; current version " + f.current_ccn : "");
  }
  function rowMark(c, byCode, courses) {
    var ns = [], codes = [c.code].concat((c.alternatives || []).map(function (a) { return a && (a.code || a); }));
    codes.forEach(function (x) {
      (byCode[x] || []).forEach(function (n) { if (ns.indexOf(n) < 0) ns.push(n); });
    });
    ns.sort(function (a, b) { return a - b; });
    var chips = codes.map(function (x) {
      var f = courses && courses[x] && courses[x].coci;
      return f ? el("span", { cls: "prh-coci", text: (codes.length > 1 ? x + " " : "") + cociText(f) }) : null;
    }).filter(Boolean);
    var own = courses && courses[c.code] && courses[c.code].coci;
    var addition = c.catalog_addition && !(own && own.listed);
    if (!addition && !ns.length && !chips.length) return null;
    var label = ns.length ? (ns.length === 1 ? "Flag " + ns[0] : "Flags " + ns.slice(0, -1).join(", ") + " and " + ns[ns.length - 1]) : null;
    return el("span", { cls: "prh-alts" }, [
      addition ? (chips.length ? "Printed in the catalog; off the program's list as read" : "Printed in the catalog; not on the state's list") + (label ? ". " : "") : null,
      label ? el("b", { cls: "prh-mark", text: label }) : null].concat(chips));
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
  /* The MAP line beside a credential this college could adopt (Sam, 2026-10-30: "I want to
   * integrate the Request Adopt buttons wherever possible"). map_links.js draws a chip per
   * college that built the exhibit, opening MAP where Request Quick Adopt sits; no module, no line. */
  function mapLine(title) {
    var M = window.CPL_MAP_LINKS;
    return M && typeof M.node === "function" && title ? M.node(title) : null;
  }
  function monthDay(ts) {
    var d = ts ? new Date(ts) : null;
    if (!d || isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }); }
    catch (e) { return day(ts); }
  }
  /* The log is newest first, so a record's first entry is its latest. The picker asks it of every
     record in the index, so the lookup is a map, rebuilt when the log changes. */
  var verdictAt = { arr: null, n: -1, map: null };
  function latestVerdict(p) {
    var R = state.review;
    if (!R || !R.verdicts) return null;
    if (verdictAt.arr !== R.verdicts || verdictAt.n !== R.verdicts.length) {
      var m = {};
      R.verdicts.forEach(function (v) { var k = v.college + "|" + v.control_number; if (!m[k]) m[k] = v; });
      verdictAt = { arr: R.verdicts, n: R.verdicts.length, map: m };
    }
    return verdictAt.map[p.college + "|" + p.control_number] || null;
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
  /* onSaved: the box sits in side by side, which moves to the next record once a verdict saves. */
  function verdictBox(p, F, line, onSaved) {
    var key = p.college + "|" + p.control_number;
    var id = "prh-v-" + String(key).replace(/[^A-Za-z0-9]+/g, "-");
    var fails = machineFails(p);
    var forCollege = ((F && F.college) || []).length;
    var lede = "Confirm says the record reads the catalog as printed. " + (fails.length
      ? "The " + fails.join(" and ") + (fails.length === 1 ? " check is" : " checks are") +
        " not met, so the record stays unchecked after you confirm, until its reading procedure takes the fix and a rerun passes. Needs a fix sends your note to that procedure instead."
      : "The record passes the three machine checks, so Sierra quotes it already; confirming records that you read it and marks it checked." +
        (forCollege ? " The " + (forCollege === 1 ? "item" : forCollege + " items") + " for the college stay open with " +
          shortCollege(p.college) + "; they concern the catalog itself and do not hold the record back." : ""));
    var said = el("p", { cls: "prh-said", "aria-live": "polite" });
    var confirm = el("button", { cls: "prh-btn", type: "button", text: "Confirm" });
    var fixBtn = el("button", { cls: "prh-btn", type: "button", "aria-expanded": "false", "aria-controls": id + "-fix", text: "Needs a fix" });
    var note = el("textarea", { id: id + "-note", rows: "3", maxlength: "2000", cls: "prh-draft-text",
      placeholder: "For example: read the elective lists from the catalog's addendum once it posts." });
    var save = el("button", { cls: "prh-btn", type: "button", text: "Save the note" });
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
        if (onSaved) { onSaved("Confirmed " + p.program_title + (res.checked ? "; it is checked." : "; it stays unchecked until its checks pass.")); return; }
        said.textContent = res.checked ? "Confirmed. The record is checked; Sierra quotes it."
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
        if (onSaved) { onSaved("Saved your note on " + p.program_title + "."); return; }
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

  /* ── the colleges the Records view lists (Sam, 2026-10-13) ──
     A college's full records load when it is picked, and stay held, so picking it again reads
     nothing. Picks last for the visit and are never remembered (Sam, 2026-10-21: "It would be best
     if tabs didn't remember the previously filtered objects"); a pick an earlier build stored is
     cleared once. */
  function picks() {
    if (!state.pick) {
      state.pick = [];
      try { window.localStorage.removeItem(PICK_KEY); window.localStorage.removeItem(FILTERS_KEY); } catch (e) { /* private window */ }
    }
    return state.pick;
  }
  /* Picks are never stored (picks() above). */
  function savePick() { /* the visit's picks live in state only */ }
  /* A college a link added (CPL Pathways' college line, a call's "Open it on Program records")
     lists until the reader opens the Records tab by its own button or sets the College filter
     (Sam, 2026-10-21: a later look at Program records showed only Bakersfield, opened from
     CPL Pathways' line). */
  function linkPick(cols) {
    var own = picks();
    state.linkPicks = state.linkPicks || [];
    (cols || []).forEach(function (c) { if (c && own.indexOf(c) < 0 && state.linkPicks.indexOf(c) < 0) state.linkPicks.push(c); });
    addPick(cols);
  }
  /* The Records tab opened by its own button lists the reader's own picks again. */
  function dropLinkPicks() {
    var linked = state.linkPicks || [];
    if (!linked.length) return;
    state.pick = picks().filter(function (c) { return linked.indexOf(c) < 0; });
    state.linkPicks = [];
  }
  /* The Records view's other filters (Sam, 2026-10-14): district, SWP region and CIP sector, for
     the visit like the picks. An empty string is a real choice ("No district on record", "No CIP
     assigned yet"). */
  function filt() {
    if (!state.filt) state.filt = { district: [], region: [], sector: [] };
    return state.filt;
  }
  function saveFilt() { /* the visit's filters live in state only */ }
  /* A click outside a filter's list closes it (wired once, for every render). */
  var ddWired = false;
  function wireDropdowns() {
    if (ddWired) return;
    ddWired = true;
    document.addEventListener("click", function (e) {
      Array.prototype.forEach.call(document.querySelectorAll(".prh-dd"), function (d) {
        if (d.contains(e.target)) return;
        var pop = d.querySelector(".prh-dd-pop"), b = d.querySelector(".prh-dd-btn");
        if (pop && !pop.hidden) { pop.hidden = true; if (b) b.setAttribute("aria-expanded", "false"); }
      });
    });
  }
  /* A college passes when it is in every college-side filter that has a pick. */
  function collegeFiltersOn() { var F = filt(); return !!(picks().length || F.district.length || F.region.length); }
  function collegeInFilters(c) {
    var F = filt(), pk = picks();
    if (pk.length && pk.indexOf(c) < 0) return false;
    if (F.district.length && F.district.indexOf(districtOf(c) || "") < 0) return false;
    if (F.region.length && F.region.indexOf(regionOf(c) || "") < 0) return false;
    return true;
  }
  function addPick(cols) {
    var P = picks().slice();
    (cols || []).forEach(function (c) { if (c && P.indexOf(c) < 0) P.push(c); });
    state.pick = P.sort();
    savePick();
  }
  function readingText(c, n) { return "Reading " + c + "'s " + fmt(n) + (n === 1 ? " record…" : " records…"); }

  function viewRecords() {
    var Rv = state.review;
    var P = rows(), R = state.registry;
    var box = el("div");
    box.appendChild(el("p", { cls: "prh-lede", text: "Each program read from its college's catalog: the required courses, the courses chosen from a list, and the electives. A record passes three machine checks: it places the courses the state's Program Course File lists, it adds no course the catalog does not print, and its units add up to the catalog's total. A person may also confirm it against the catalog. A misread changes the college's reading procedure, never the record." }));
    /* Who is reading: a lede beside the first one, so the view keeps only sections below it. */
    box.appendChild(el("div", { cls: "prh-lede prh-review-note" }, [
      Rv && Rv.error ? el("p", { cls: "prh-small prh-caution", role: "status",
        text: "Your sign-in could not read the records (" + Rv.error + "), so these are the records the public sees, without Confirm and Needs a fix. Reload the tab to try again." })
      : Rv ? el("p", { cls: "prh-small prh-quiet",
        text: "Signed in as " + Rv.email + ". Each record ends with Confirm and Needs a fix." })
      : signInBox()]));
    if (!P.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No program record has been loaded yet." }));
      return box;
    }
    /* The glance counts every record, from the index. Passing is the three machine checks
       (S415): a person's confirm is optional since Sam's 2026-10-17 ruling, so a count that
       needed one read 32 while thousands passed. */
    var checks = P.map(recordChecks);
    var passing = P.filter(function (p) { return machineFails(p).length === 0; }).length;
    var equal = checks.filter(function (c) { return c.arithmetic === "equal"; }).length;
    var withCpl = P.filter(function (p) { return p.display && p.display.counts && p.display.counts.here > 0; }).length;
    var colleges = {};
    P.forEach(function (p) { colleges[p.college] = 1; });
    box.appendChild(section("records:glance", "At a glance", fmt(passing) + " of " + fmt(P.length) + " records pass the machine checks", [
      el("div", { cls: "prh-facts" }, [
        fact(fmt(P.length) + " at " + Object.keys(colleges).length, "programs read, at that many colleges"),
        fact(fmt(passing) + " of " + fmt(P.length), "records pass the machine checks"),
        fact(fmt(equal), "totals agree with the catalog's"),
        fact(fmt(withCpl) + " of " + fmt(P.length), "programs hold a course with CPL at the college")
      ])]));
    var reviewing = !!(Rv && Rv.records);
    var totals = {}, waits = {};
    P.forEach(function (p) {
      totals[p.college] = (totals[p.college] || 0) + 1;
      if (isWaiting(p)) waits[p.college] = (waits[p.college] || 0) + 1;
    });
    var names = Object.keys(totals).sort();
    var kept = picks().filter(function (c) { return totals[c]; });
    if (kept.length !== picks().length) { state.pick = kept; savePick(); }

    /* ── The filters (Sam, 2026-10-14: "change that to a simple drop down multi-select filter
       and add filters for CIP Sectors and SWP Regions"). Four dropdowns, each a list of
       checkboxes: District, College, SWP Region and CIP Sector. A record shows when it passes
       every filter that has a pick; a filter with none passes everything. Each college names
       its records and how many wait on a reading, from the index. ── */
    var F = filt();
    wireDropdowns();
    var say = el("p", { cls: "prh-small prh-quiet prh-pick-say", role: "status", "aria-live": "polite" });
    var clear = el("button", { cls: "prh-word", type: "button", text: "Clear the filters" });
    var dds = [];
    function chosen(key) { return key === "college" ? picks() : F[key]; }
    function anyFilter() { return collegeFiltersOn() || F.sector.length > 0; }
    function scopeColleges() { return names.filter(collegeInFilters); }
    function syncFilters() {
      dds.forEach(function (d) { d.sync(); });
      clear.hidden = !anyFilter();
    }
    /* ask: the reader picked it just now, so a college whose last read failed reads again. */
    function loadPicked(cols, ask) {
      var need = cols.filter(function (c) { return totals[c] && rowsOf(c).some(isLight) && (ask || !state.failed[c]); });
      if (!need.length) return;
      var n = need.reduce(function (s, c) { return s + totals[c]; }, 0);
      say.textContent = need.length === 1 ? readingText(need[0], totals[need[0]])
        : "Reading " + fmt(n) + " records at " + need.length + " colleges…";
      var lights = rows().filter(function (p) { return p._light && need.indexOf(p.college) >= 0; });
      ensureRows(lights, { college: true, retry: !!ask }).then(function () {
        var bad = need.filter(function (c) { return state.failed[c]; });
        say.textContent = bad.length
          ? bad.map(function (c) { return c + "'s records could not be read (" + state.failed[c] + ")."; }).join(" ")
          : need.length === 1 ? need[0] + "'s " + fmt(totals[need[0]]) + (totals[need[0]] === 1 ? " record is" : " records are") + " open below."
          : fmt(n) + " records at " + need.length + " colleges are open below.";
      });
    }
    function setFilter(key, next) {
      next = next.filter(function (v, i) { return next.indexOf(v) === i; }).sort();
      if (key === "college") { state.linkPicks = []; state.pick = next; savePick(); }
      else { F[key] = next; saveFilt(); }
      state.rscope = "pick";
      syncFilters();
      var sc = scopeColleges();
      if (collegeFiltersOn() && sc.length <= EAGER_COLLEGES) loadPicked(sc, true);
      else if (collegeFiltersOn()) say.textContent = sc.length + " colleges match; each reads its records when you open it.";
      else say.textContent = "";
      draw();
    }
    clear.addEventListener("click", function () {
      state.linkPicks = []; state.pick = []; savePick();
      F.district = []; F.region = []; F.sector = []; saveFilt();
      syncFilters();
      say.textContent = "No filter is set.";
      draw();
      /* The word hides once nothing is set; focus goes to the first dropdown. */
      var firstBtn = bar.querySelector(".prh-dd-btn");
      if (firstBtn) firstBtn.focus();
    });
    /* One dropdown: a word that opens a list of checkboxes, a search when the list is long,
       and a word to clear it. Escape closes it and returns to the word. */
    function dropdown(key, label, opts, attr) {
      var id = "prh-dd-" + key;
      var btn = el("button", { cls: "prh-word prh-dd-btn", type: "button", "aria-expanded": "false", "aria-controls": id });
      var list = el("ul", { cls: "prh-dd-list" });
      var inputs = [];
      opts.forEach(function (o) {
        var a = { type: "checkbox", value: o.value };
        a[attr] = o.value;
        var ci = el("input", a);
        inputs.push(ci);
        ci.addEventListener("change", function () {
          var cur = chosen(key).filter(function (v) { return v !== o.value; });
          setFilter(key, ci.checked ? cur.concat([o.value]) : cur);
        });
        list.appendChild(el("li", {}, [el("label", {}, [ci, el("span", { cls: "prh-pick-c", text: o.text }),
          o.meta ? el("span", { cls: "prh-pick-n", text: o.meta }) : null])]));
      });
      var find = opts.length > 8 ? el("input", { type: "search", cls: "prh-dd-find", autocomplete: "off",
        placeholder: "Find a " + label.toLowerCase(), "aria-label": "Find a " + label.toLowerCase() }) : null;
      if (find) find.addEventListener("input", function () {
        var t = find.value.trim().toLowerCase();
        Array.prototype.forEach.call(list.children, function (li) { li.hidden = !!t && li.textContent.toLowerCase().indexOf(t) < 0; });
      });
      var none = el("button", { cls: "prh-word", type: "button", text: "Clear " + label });
      var pop = el("div", { cls: "prh-dd-pop", id: id, role: "group", "aria-label": label },
        [find, opts.length ? list : el("p", { cls: "prh-small prh-quiet", text: "Nothing to choose yet." }), el("div", { cls: "prh-dd-acts" }, [none])]);
      pop.hidden = true;
      function close() { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
      function open() {
        dds.forEach(function (d) { d.close(); });
        pop.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        var f = find || inputs[0];
        if (f) f.focus();
      }
      btn.addEventListener("click", function () { if (pop.hidden) open(); else close(); });
      none.addEventListener("click", function () { setFilter(key, []); close(); btn.focus(); });
      pop.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); btn.focus(); }
      });
      var d = { wrap: el("div", { cls: "prh-dd", "data-filter": key }, [btn, pop]), close: close, sync: function () {
        var cur = chosen(key);
        inputs.forEach(function (i) { i.checked = cur.indexOf(i.value) >= 0; });
        btn.textContent = label + (cur.length ? " (" + cur.length + ")" : "");
        btn.setAttribute("aria-label", label + ": " + (cur.length ? cur.length + " chosen" : "all") + "; show the list");
        none.hidden = !cur.length;
      } };
      dds.push(d);
      return d;
    }
    function countMeta(cs) {
      var n = cs.reduce(function (t, c) { return t + totals[c]; }, 0);
      return cs.length + (cs.length === 1 ? " college, " : " colleges, ") + fmt(n) + (n === 1 ? " record" : " records");
    }
    function grouped(of, none) {
      var g = {};
      names.forEach(function (c) { var k = of(c) || ""; (g[k] = g[k] || []).push(c); });
      return Object.keys(g).sort(function (a, b) { return a === b ? 0 : !a ? 1 : !b ? -1 : a < b ? -1 : 1; })
        .map(function (k) { return { value: k, text: k || none, meta: countMeta(g[k]) }; });
    }
    var bar = el("div", { cls: "prh-filters", role: "group", "aria-label": "Filter the records" });
    if (state.districts) bar.appendChild(dropdown("district", "District", grouped(districtOf, "No district on record"), "data-district").wrap);
    bar.appendChild(dropdown("college", "College", names.map(function (c) {
      var w = waits[c] || 0;
      return { value: c, text: c, meta: fmt(totals[c]) + (totals[c] === 1 ? " record, " : " records, ") +
        (w ? fmt(w) : "none") + (w === 1 ? " waits" : " wait") + (reviewing ? " on your reading" : " on a reading") };
    }), "data-college").wrap);
    if (state.regions) bar.appendChild(dropdown("region", "SWP Region", grouped(regionOf, "No region on record"), "data-region").wrap);
    function sectorDropdown() {
      var sc = {};
      P.forEach(function (p) { var k = sectorOf(p); sc[k] = (sc[k] || 0) + 1; });
      /* Every family, as on EACR (Sam, 2026-09-24): a sector with nothing says so. */
      var fams = Object.keys(CIP_FAMS).concat(Object.keys(sc).filter(function (k) { return k && !CIP_FAMS[k]; })).sort();
      if (sc[""]) fams.push("");
      return dropdown("sector", "CIP Sector", fams.map(function (k) {
        return { value: k, text: sectorLabel(k), meta: fmt(sc[k] || 0) + (sc[k] === 1 ? " record" : " records") };
      }), "data-sector").wrap;
    }
    var sectorSlot = state.cip ? sectorDropdown() : el("span", { cls: "prh-dd-slot", hidden: "" });
    bar.appendChild(sectorSlot);
    bar.appendChild(clear);
    var notesLine = el("p", { cls: "prh-small" });
    function writeNotes() {
      var notes = [];
      if (state.districtError) notes.push("The district and region lists could not be read (" + state.districtError + "), so those two filters are left out.");
      if (state.cipError) notes.push("The programs' CIP codes could not be read (" + state.cipError + "), so the CIP Sector filter is left out.");
      else if (!state.cip) notes.push("Reading each program's CIP code for the CIP Sector filter…");
      notesLine.textContent = notes.join(" ");
      notesLine.className = "prh-small" + (state.districtError || state.cipError ? " prh-caution" : " prh-quiet");
      notesLine.hidden = !notes.length;
    }
    writeNotes();
    box.appendChild(el("div", { cls: "prh-filterbar" }, [bar,
      el("p", { cls: "prh-small prh-quiet", text: "A record shows when it passes every filter you set. A college's records load when a filter reaches it and stay until the page reloads." }),
      notesLine, say]));
    syncFilters();
    state.onCip = function () {
      if (!bar.parentNode || !document.body.contains(bar)) return;
      if (state.cip && sectorSlot.classList.contains("prh-dd-slot")) {
        var dd = sectorDropdown();
        bar.replaceChild(dd, sectorSlot);
        sectorSlot = dd;
        syncFilters();
      }
      writeNotes();
      if (F.sector.length) draw();
    };

    /* ── Find a record (Sam, 2026-10-09, reading Cerritos's 274 on his phone: "Yes, do them"):
       a search by name or control number, and what to show, over the colleges listed. ── */
    var q = el("input", { id: "prh-rq", type: "search", placeholder: "Name or control number", autocomplete: "off" });
    q.value = state.rq;
    var shows = [["all", "All records"]].concat(reviewing ? [["waiting", "Waiting on your reading"]] : [])
      .concat([["fail", "Fail a machine check"], ["conflict", "Disagree with the state's course list"], ["pass", "Pass the machine checks"],
        ["complete", "Complete: an active program, passing"], ["checked", "Confirmed by a person"]]);
    if (!shows.some(function (o) { return o[0] === state.rshow; })) state.rshow = "all";
    var showSel = el("select", { id: "prh-rshow" }, shows.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.rshow;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    /* A count on the Progress view lists every college, as it counted them (rscope "all"). */
    var only = el("button", { cls: "prh-word", type: "button", text: "List only what the filters choose" });
    only.addEventListener("click", function () { state.rscope = "pick"; draw(); });
    var first = el("button", { cls: "prh-word", type: "button", text: "Read the first waiting record side by side" });
    var shown = [];
    first.addEventListener("click", function () {
      var r = shown.filter(readable)[0];
      if (r) openRecord(r, first);
    });
    var scopeText = el("span");
    var scopeLine = el("p", { cls: "prh-small prh-rscope" }, [scopeText, only, first]);
    var drawn = [];
    /* A college's records, built the first time its section is open. Rows still light load
       first: the whole college, or, in a narrowed list, the matches by key. */
    function collegeBody(c, list, narrowed) {
      var holder = el("div", { cls: "prh-college-b" });
      function fill() {
        holder.textContent = "";
        var d = !narrowed ? knownDrafts()[c] : null;
        if (d && d.length) holder.appendChild(draftsBox(c, d));
        list.forEach(function (p) { if (!p._light && !p._gone) holder.appendChild(recordCard(p)); });
      }
      function failedLine() {
        var again = el("button", { cls: "prh-word", type: "button", text: "Read again" });
        again.addEventListener("click", function () { start(true); });
        return el("p", { cls: "prh-small prh-caution", role: "status" }, [c + "'s records could not be read (" + state.failed[c] + "). ", again]);
      }
      function start(ask) {
        var need = (narrowed ? list : rowsOf(c)).filter(isLight);
        if (!need.length) { fill(); return; }
        holder.textContent = "";
        if (state.failed[c] && !ask) { holder.appendChild(failedLine()); return; }
        var n = list.filter(isLight).length;
        holder.appendChild(el("p", { cls: "prh-small prh-quiet", text: narrowed && n < totals[c]
          ? "Reading " + fmt(n) + " of " + c + "'s records…" : readingText(c, totals[c]) }));
        ensureRows(need, { college: !narrowed, retry: !!ask }).then(function () {
          if (state.failed[c] && list.some(isLight)) { holder.textContent = ""; holder.appendChild(failedLine()); return; }
          fill();
        });
      }
      start(false);
      return [holder];
    }
    function draw() {
      state.rq = q.value; state.rshow = showSel.value;
      var all = state.rscope === "all", side = collegeFiltersOn(), sectorOn = F.sector.length > 0;
      /* A sector or a search narrows the list, so its colleges open and read their matches by key. */
      var narrowed = !!String(state.rq).trim() || state.rshow !== "all" || (!all && sectorOn);
      var inScope = all || !side ? P : P.filter(function (p) { return collegeInFilters(p.college); });
      var sectorWait = !all && sectorOn && !state.cip;
      if (!all && sectorOn && state.cip) inScope = inScope.filter(function (p) { return F.sector.indexOf(sectorOf(p)) >= 0; });
      shown = filterRecords(inScope, state.rq, state.rshow, null, reviewing ? isWaiting : null);
      drawn.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      drawn = [];
      scopeText.textContent = all ? "Every college is listed, because the count you followed spans them all. " : "";
      only.hidden = !all;
      first.hidden = !(reviewing && state.rshow === "waiting" && shown.some(readable));
      scopeLine.hidden = only.hidden && first.hidden;
      if (!all && !side && !sectorOn) {
        count.textContent = "";
        drawn.push(box.appendChild(el("div", { cls: "prh-empty", text: "Choose a district, college, SWP region or CIP sector above to read its records." })));
        return;
      }
      if (sectorWait) {
        count.textContent = "";
        drawn.push(box.appendChild(el("div", { cls: "prh-empty", role: "status", text: state.cipError
          ? "The programs' CIP codes could not be read (" + state.cipError + "), so no record can be matched to a sector."
          : "Reading each program's CIP code before the sector filter applies…" })));
        return;
      }
      var order = [], byCollege = {};
      shown.forEach(function (p) {
        if (!byCollege[p.college]) { byCollege[p.college] = []; order.push(p.college); }
        byCollege[p.college].push(p);
      });
      if (!shown.length) drawn.push(box.appendChild(el("div", { cls: "prh-empty", text: "No record matches. Clear a filter or the search, or choose All records." })));
      /* Every college at once: a list a page long opens and reads its records by key; a longer
         one keeps each college shut until the reader opens it, so nothing loads unasked. */
      var few = shown.length <= RECORD_PAGE;
      var drafts = knownDrafts();
      order.forEach(function (c) {
        var list = byCollege[c];
        var reg = R.filter(function (r) { return r.college === c; })[0] || {};
        var nd = (drafts[c] || []).length;
        var cy = (list.filter(function (p) { return p.catalog_year; })[0] || reg).catalog_year;
        var n = list.length < totals[c] ? list.length + " of " + totals[c] : String(totals[c]);
        var meta = ((PLATFORM[reg.catalog_platform] || "") + " catalog" + (cy ? ", " + yr(cy) : "")).trim() + " · " +
          n + (totals[c] === 1 ? " program" : " programs") + (nd ? " · " + nd + (nd === 1 ? " draft" : " drafts") + " for the college" : "");
        /* A narrowed list opens its colleges, so a match is never hidden in a closed section. */
        var sec = section("records:" + c, c, meta, function () { return collegeBody(c, list, narrowed); },
          { cls: "prh-college", open: all ? few : narrowed, shut: all && !few });
        drawn.push(box.appendChild(sec));
      });
      count.textContent = "Showing " + shown.length + " of " + inScope.length;
    }
    /* One event each: a select fires both input and change, and each draw rebuilds the list. */
    q.addEventListener("input", draw);
    showSel.addEventListener("change", draw);
    box.appendChild(section("records:find", "Find a record", "By name or control number, and what waits", [
      el("div", { cls: "prh-controls prh-rfind", role: "search", "aria-label": "Find a program record" }, [
        el("label", { "for": "prh-rq" }, ["Find a program", q]),
        el("label", { "for": "prh-rshow" }, ["Show", showSel]),
        count]), scopeLine]));
    /* A pick loads; one whose read failed waits for the reader to ask. */
    if (state.rscope !== "all" && collegeFiltersOn()) {
      var sc0 = scopeColleges();
      if (sc0.length <= EAGER_COLLEGES) loadPicked(sc0, false);
    }
    loadCips();
    draw();
    return box;
  }
  function isWaiting(p) { var sl = stateLine(p); return !!(sl && sl.waiting); }
  /* An active program in COCI (S415), from the Progress view's read of COCI's active keys: null
     when that read failed, so no list passes off an unread state as "not active". */
  function activeIn(p) {
    var k = state.progress && state.progress.activeKeys;
    return k ? !!k[keyOf(p)] : null;
  }
  /* The Records view's filter, pure so a test reads it: the search matches the program's
     name or its control number; show narrows to the records waiting on the reader (when one
     is signed in), those failing or passing the three machine checks, the complete ones (an
     active program in COCI, passing), or the ones a person confirmed. */
  /* college: "all" (or none), one college's name, or a list of them (the Records view's picks). */
  function filterRecords(P, q, show, college, waiting) {
    var t = String(q || "").trim().toLowerCase();
    return (P || []).filter(function (p) {
      if (Array.isArray(college)) { if (college.indexOf(p.college) < 0) return false; }
      else if (college && college !== "all" && p.college !== college) return false;
      if (t && String(p.control_number || "").toLowerCase().indexOf(t) < 0 &&
          String(p.program_title || "").toLowerCase().indexOf(t) < 0) return false;
      if (show === "waiting") return waiting ? waiting(p) : true;
      if (show === "fail") return machineFails(p).length > 0;
      if (show === "pass") return machineFails(p).length === 0;
      /* Where the catalog and the state's Program Course File disagree: a listed course the record
         misses, or a course it adds that the list lacks (CPL Pathways' college line, 2026-10-21). */
      if (show === "conflict") return machineFails(p).some(function (f) { return f === "courses" || f === "off-list"; });
      if (show === "complete") return machineFails(p).length === 0 && activeIn(p) === true;
      if (show === "checked") return !!p.checked;
      return true;
    });
  }

  /* A noncredit program's hours as estimated equivalent units, from the display build (the lecture rate,
     16-18 hours a unit in half units, Title 5 section 55002.5). Sam, 2026-10-11: for estimating only. */
  function equivRow(p, disp) {
    var e = p.measure === "hours" ? (disp || {}).equivalent_units : null;
    if (!e || !e.total || e.total.min == null) return null;
    return el("div", { cls: "prh-check" }, [el("dt", { text: "Estimated equivalent units" }),
      el("dd", { text: "About " + span(e.total.min, e.total.max) + " at the lecture rate, " + (e.hours_per_unit || []).join("–") +
        " hours a unit (Title 5 section 55002.5); for estimating only, not awarded units" })]);
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
    function dd(label, value) {
      return el("div", { cls: "prh-check" }, [el("dt", { text: label }), typeof value === "string" ? el("dd", { text: value }) : el("dd", {}, [value])]);
    }
    function wide(d) { d.className += " prh-check-wide"; return d; }
    var placed = ck.listed != null ? ck.placed + " of " + ck.listed + " placed" : "Not measured";
    /* A unit difference is kept as printed and chipped (Sam, 2026-10-11: "Preserve the unit
       difference and highlight with a chip"), and every mismatch stands out in the summary row
       (Sam, 2026-10-14: "Highlight the mismatches in units in the summary row"). A record checked
       against the degree total names that total (record shape 5). */
    var differ = (disp.checks || {}).units_differ;
    var degTotal = ((figure.degree || {}).total) || {};
    var arith = ck.arithmetic === "equal"
        ? (p.total_min == null && degTotal.min != null ? "Equal, " + span(degTotal.min, degTotal.max) + " " + unit + " for the degree"
          : "Equal, " + span(p.total_min, p.total_max) + " " + unit)
      : differ ? mismatch(differ.against === "degree"
          ? "Units differ: the blocks and general education add to " + span(differ.blocks[0], differ.blocks[1]) +
            "; the catalog prints " + span(differ.printed[0], differ.printed[1]) + " " + unit + " for the degree"
          : "Units differ: the blocks add to " + span(differ.blocks[0], differ.blocks[1]) +
            "; the catalog prints " + span(differ.printed[0], differ.printed[1]) + " " + unit)
      : ck.arithmetic === "unequal" ? mismatch("Units differ from the printed total")
      : ck.arithmetic === "incomplete" ? mismatch("Units cannot be added up: the record lacks a figure")
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
    /* The public reads every record (Sam, Open Asks Sheet 67), and one no person has checked
       says so in Sam's words (Sheet 65: "marked not yet confirmed"). */
    var line = sl ? el("span", { cls: "prh-state" + (sl.waiting ? " prh-state-waiting" : ""), text: sl.text })
      : !p.checked ? el("span", { cls: "prh-state prh-state-open", text: "Not yet confirmed" }) : null;
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
        dd("Units", arith), equivRow(p, disp), dd("Person's reading", reader),
        F.flags.length ? wide(dd("Flags", flagSummary(F.flags))) : null,
        F.college.length ? wide(dd("For the college", collegeLine(p, F.college))) : null]),
      cpl]);
    var body = el("div", { cls: "prh-body", id: bodyId });
    body.hidden = !isOpen;
    /* The blocks are built the first time they show (Sam, 2026-10-11: "the program blocks
       are slow to load on click--times out my browser once and I have to tell it to wait").
       A signed-in reader holds every record, and building all their course tables up front,
       hidden, came to 294,000 elements and 3.7 s per draw for 1,210 records. */
    var filled = false;
    function fill() {
      if (filled) return;
      filled = true;
      fillBody(body, p, F, courses, unit, disp);
    }
    if (isOpen) fill();
    var art = el("article", { cls: "prh-rec" + (isOpen ? " prh-open" : ""), "aria-label": p.program_title + ", " + p.college },
      [head, body, reviewing ? verdictBox(p, F, line, opts.split ? function (saved) { advanceFrom(p, saved); } : null) : null]);
    btn.addEventListener("click", function () {
      var open = body.hidden;
      if (open) fill();
      body.hidden = !open;
      state.open[key] = open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Hide the blocks" : "Show the blocks";
      art.classList.toggle("prh-open", open);
    });
    return art;
  }
  /* A record's blocks, its total, its careers and its source line, drawn into its body. */
  function fillBody(body, p, F, courses, unit, disp) {
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
        var n = exhibitCount(info);
        var alts = (c.alternatives || []).map(function (a) { return a.code || a; });
        return [
          [c.code, alts.length ? el("span", { cls: "prh-alts", text: "or " + alts.join(", ") }) : null, idChips(info)],
          [info.title || "", rowMark(c, F.byCode, courses),
            el("span", { cls: "prh-outslot", "data-key": codeKey(c.code), "data-code": c.code })],
          c.units != null || info.units_from_state_file == null ? span(c.units, c.units_max) : fmt(info.units_from_state_file) + " (COCI)",
          n || hasLeads(info) ? cplButton(p, c.code, info, n) : el("span", { cls: "prh-quiet", text: "0" })
        ];
      }), p.program_title + ": " + (b.name || "courses"), true)])));
    });
    if (p.total_min != null) body.appendChild(el("p", { cls: "prh-small", style: "margin:0", text: "Program total: " + span(p.total_min, p.total_max) + " " + unit + "." }));
    /* The careers the catalog names (Sam's rule 5, 2026-10-11) */
    var careers = (p.record && p.record.program && p.record.program.careers) || [];
    if (careers.length) body.appendChild(el("p", { cls: "prh-small", style: "margin:0" }, [
      el("b", { text: "Careers the catalog names: " }), careers.join("; ") + "."]));
    body.appendChild(el("p", { cls: "prh-small prh-quiet", style: "margin:0" }, [
      "Read from ", p.source_url ? link(p.source_url, "the catalog page") : "the catalog",
      " (" + yr(p.catalog_year) + ")" + (p.checked_by ? "; read against the catalog by " + p.checked_by : "") + ".",
      disp.build ? " Display build " + disp.build + (disp.built ? ", " + disp.built : "") + "." : ""]));
    fillOutcomeLinks(body, p, courses);
    var gaps = F.notes;
    if (gaps.length) body.appendChild(el("details", { cls: "prh-notes" }, [
      el("summary", { text: "Notes for the reading procedure (" + gaps.length + ")" }),
      el("ul", {}, gaps.map(function (g) { return el("li", { text: (g.kind ? g.kind + ": " : "") + g.text }); }))]));
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
        fact(withP.reduce(function (s, r) { return s + procedureCounts(r.procedure).held; }, 0), "requests to a college held"),
        fact(R.filter(function (r) { var a = catalogAccess(r); return a && a.refused; }).length, "catalogs block the reader"),
        fact(R.filter(function (r) { var a = catalogAccess(r); return a && a.filed; }).length, "read from a hand-filed copy")
      ])]));
    if (!withP.length) {
      box.appendChild(el("div", { cls: "prh-empty", text: "No college has a reading procedure yet." }));
      return box;
    }
    var showSel = el("select", { id: "prh-pshow" }, [
      ["all", "All colleges"], ["access", "Catalog blocked or hand-filed"], ["needscopy", "Blocked, no hand-filed copy"]
    ].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    showSel.value = state.pshow;
    var count = el("span", { cls: "prh-count", "aria-live": "polite" });
    var shown = [];
    /* The cards sit in the view itself, each a section of its own, so a redraw swaps them in place. */
    function draw() {
      state.pshow = showSel.value;
      var rows = filterProcedures(withP, state.pshow);
      shown.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      count.textContent = rows.length + (rows.length === 1 ? " college" : " colleges");
      shown = rows.length ? rows.map(procedureCard) : [el("div", { cls: "prh-empty", text: "No college matches." })];
      shown.forEach(function (n) { box.appendChild(n); });
    }
    showSel.addEventListener("change", draw);
    box.appendChild(el("div", { cls: "prh-filterbar" }, [el("div", { cls: "prh-filters", role: "group", "aria-label": "Filter the procedures" },
      [el("label", {}, ["Show ", showSel]), count])]));
    draw();
    return box;
  }
  /* The Procedures view's Show: every college, or those whose catalog blocks the reader or was read
     from a hand-filed copy (the blocked ones still needing a copy first), or only those. */
  function filterProcedures(rows, show) {
    if (show === "access") return rows.filter(function (r) { return catalogAccess(r); })
      .sort(function (a, b) { return (catalogAccess(a).filed ? 1 : 0) - (catalogAccess(b).filed ? 1 : 0); });
    if (show === "needscopy") return rows.filter(function (r) { var a = catalogAccess(r); return a && a.refused && !a.filed; });
    return rows;
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
      "Version " + (p.v || "?") + " · written " + day(r.procedure_at) + (r.procedure_by ? " by " + r.procedure_by : ""), [card],
      { flag: catalogAccess(r) });
  }

  /* ── the Progress view ──
   * Sam, 2026-10-07: "I want to pivot over to the Catalog ROEP work and the new COBI tab
   * needed to monitor the work... a workflow dashboard to monitor the progress like the
   * attached", run by his CPL Queue routine. "Yes start mock"; then, on the mock-up
   * (S343): "The mockup looks good to go". Mock-up:
   * https://claude.ai/artifact/6Pco7R1NVB5S45evjjfJsr (prototype/roep_progress_mockup.html).
   *
   * MILESTONES and PARTS are definitions. A session changes a milestone's words, what it
   * measures, or what is left before it HERE, and never touches the renderer, which is
   * commons_progress.js's since S419 (the Commons' shared Progress module; its lane,
   * docs/reference/lanes/commons.md, names what it draws for every common reference).
   * Every function reads the context x that progressContext() builds from the live reads
   * and the status file:
   *   x.R  the registry, every college       x.P  the records anon may read (checked only)
   *   x.A  the addenda                       x.active  COCI's active programs
   *   x.Q  kb/status/program-requirements.json, the last checkpoint's word
   * x.A, x.active and x.Q are null when their read failed; a definition that needs one
   * names it in `needs`, and the view then says the read failed instead of drawing a zero.
   *
   * Each count opens what it totals (Sam, 2026-10-13, on his phone: "make the prog reqs
   * status cards open the items they total on click"). A target (TO below) names a view and
   * its filters; goTo() opens it. A milestone's left item carries its target fourth; a part's
   * open(x) answers [words, target], and its answer(x) the place Sam answers what waits on
   * him ("if there are open questions I can address for any, add a link on those card to
   * where I can answer those"). A call in the status file naming a part's id in `part` puts
   * its answer link on that card too.
   * A milestone is done when nothing is left before it; the first one not done is You are
   * here. A left item whose count is null (its read failed) keeps the milestone open.
   */
  var PILOT_PROGRAMS = 20;
  var TO = {
    noAddress: { view: "catalogs", show: "noaddress", sec: "catalogs:registry" },
    colleges: { view: "catalogs", sec: "catalogs:registry" },
    noProcedure: { view: "catalogs", show: "noprocedure", sec: "catalogs:registry" },
    addenda: { view: "catalogs", show: "addenda", sec: "catalogs:registry" },
    records: { view: "records", sec: "records:find" },
    checked: { view: "records", rshow: "checked", sec: "records:find" },
    fail: { view: "records", rshow: "fail", sec: "records:find" },
    conflict: { view: "records", rshow: "conflict", sec: "records:find" },
    complete: { view: "records", rshow: "complete", sec: "records:find" },
    waiting: { view: "records", rshow: "waiting", sec: "records:find" },
    maps: { view: "sequences", sec: "sequences:colleges" },
    procedures: { view: "procedures" },
    pathways: { href: "#cpl-pathways" }
  };
  var MILESTONES = [
    { id: "catalogs", title: "Find every catalog",
      fact: function (x) { return x.withUrl + " of " + x.R.length + " colleges"; },
      when: function (x) { return x.censusDay ? x.censusDay + " census" : ""; },
      left: function (x) { return [[x.R.length - x.withUrl, "college needs a catalog address", "colleges need a catalog address", TO.noAddress]]; } },
    { id: "pilot", title: "Read the pilot",
      fact: function (x) { return x.checked + " programs confirmed by a person"; },
      when: function (x) { return x.checkedDay; },
      left: function (x) { return [[PILOT_PROGRAMS - x.checked, "pilot program to check", "pilot programs to check", TO.waiting]]; } },
    /* Sam, Open Asks Sheet 50 card 5 (2026-10-08, as proposed): a published map counts toward this
       milestone when it is read, or when the college's procedure records its host refused or unreached
       and names the other routes tried (procedure.workarounds). The refused count stays on the part. */
    { id: "maps", title: "Read program maps",
      fact: function (x) { return x.mapsSettled + " of " + x.mapsPublished + " published maps settled"; },
      left: function (x) {
        return [[x.mapsPublished - x.mapsSettled, "published map to read or settle", "published maps to read or settle", TO.maps],
          [x.addendaUnread, "catalog addendum to read", "catalog addenda to read", TO.addenda]];
      } },
    { id: "procedures", title: "A procedure per college",
      fact: function (x) { return x.procedures + " of " + x.R.length + " written"; },
      left: function (x) { return [[x.R.length - x.procedures, "college without a reading procedure", "colleges without a reading procedure", TO.noProcedure]]; } },
    /* Reads as the headline's pair (Sam, 2026-10-08): COCI's active programs and the complete
       ones. Left: the active programs no read has reached, and every record failing a machine
       check, whose fix is its college's reading procedure. */
    { id: "every", title: "Every program", needs: ["active"],
      fact: function (x) { return fmt(x.complete) + " of " + fmt(x.active) + " complete"; },
      left: function (x) {
        return [[x.activeUnread, "active program not read yet", "active programs not read yet"],
          [x.failing, "record failing a machine check", "records failing a machine check", TO.fail]];
      } }
  ];
  /* status(x) answers one of the STATUS keys; meter(x) answers [have, of, verb]; a note in
     the status file (notes.<id>) replaces a part's foot. */
  var PARTS = [
    { id: "census", title: "Catalog census",
      status: function (x) { return x.withUrl >= x.R.length ? "done" : "going"; },
      what: function (x) { return x.withUrl + " colleges have a catalog address; " + x.currentYear + " name " + CURRENT_YEAR + "."; },
      foot: function (x) { return "Weekly; next apply " + x.nextCensus; },
      open: function (x) { return ["Open the " + x.R.length + " colleges", TO.colleges]; } },
    { id: "reading", title: "Catalog reading",
      status: function (x) { return !x.read ? "not" : x.activeUnread === 0 ? "done" : "going"; },
      what: function (x) { return fmt(x.read) + " programs read at " + x.readColleges + (x.readColleges === 1 ? " college." : " colleges."); },
      foot: function (x) {
        return x.notActive ? fmt(x.notActive) + (x.notActive === 1 ? " is a program" : " are programs") + " COCI does not list as active." : "";
      },
      open: function (x) { return x.read ? ["Open the " + fmt(x.read) + " records", TO.records] : null; } },
    /* The machine checks (S415), as the server reads them (program_record_machine_pass): every
       course the state's file lists is placed, nothing the catalog does not print is added, and
       the units add up to the printed total (or the catalog prints none). A person's confirm
       became optional with Sam's 2026-10-17 ruling ("I am trusting your procedures"); the 32 a
       person confirmed are the pilot's, so this card no longer waits on anyone. */
    { id: "checks", title: "The machine checks",
      status: function (x) { return !x.read ? "not" : x.failing ? "going" : "done"; },
      what: function (x) { return fmt(x.passing) + " of " + fmt(x.read) + " records pass: every listed course placed, none added, the units add up."; },
      meter: function (x) { return [x.passing, x.read, "pass"]; },
      foot: function (x) {
        if (!x.failing) return x.read ? "Every record read passes." : "";
        var by = [[x.failUnits, "units"], [x.failCourses, "listed courses"], [x.failAdded, "an added course"]]
          .filter(function (f) { return f[0]; }).map(function (f) { return fmt(f[0]) + " on " + f[1]; });
        return fmt(x.failing) + (x.failing === 1 ? " fails: " : " fail: ") + joinAnd(by) +
          (by.length > 1 ? "; a record can fail more than one" : "") + ". The fix goes to the college's reading procedure.";
      },
      open: function (x) {
        return x.failing ? ["Open the " + fmt(x.failing) + " failing", TO.fail] : x.read ? ["Open the " + fmt(x.read) + " records", TO.records] : null;
      } },
    { id: "maps", title: "Program maps",
      status: function (x) { return x.mapsRead >= x.mapsPublished ? "done" : x.mapsRead ? "going" : "not"; },
      what: function (x) { return x.mapsRead + " of the " + x.mapsPublished + " published maps read."; },
      meter: function (x) { return [x.mapsRead, x.mapsPublished, "read"]; },
      foot: function (x) {
        return (x.mapsReadAt.length ? "Read: " + joinAnd(x.mapsReadAt) + ". " : "") + x.mapsRefused + " refused the reader.";
      },
      open: function (x) { return x.mapsPublished ? ["Open the colleges with a map", TO.maps] : null; } },
    { id: "procedures", title: "Reading procedures",
      status: function (x) {
        return x.procedures >= x.R.length ? "done" : x.here === "procedures" ? "going" : x.next === "procedures" ? "next"
          : x.procedures ? "going" : "not";
      },
      what: function (x) { return x.procedures + " of " + x.R.length + " colleges have one."; },
      meter: function (x) { return [x.procedures, x.R.length, "written"]; },
      foot: function (x) { return x.procedureList; },
      open: function (x) { return x.procedures ? ["Open the " + x.procedures + " procedures", TO.procedures] : null; } },
    { id: "addenda", title: "Catalog addenda", needs: ["A"],
      status: function (x) { return !x.addendaUnread ? "done" : x.addendaRead ? "going" : "not"; },
      what: function (x) {
        return x.addendaTotal + " found at " + x.addendaColleges + " colleges; " + (x.addendaRead ? x.addendaRead + " read" : "none read") + ".";
      },
      foot: function (x) { return "Next census apply " + x.nextCensus; },
      open: function (x) {
        return x.addendaColleges ? ["Open the " + x.addendaColleges + (x.addendaColleges === 1 ? " college" : " colleges") + " listing one", TO.addenda] : null;
      } },
    /* The display build (kb/_build_roep_display.py) writes each record's CPL figures. Read live:
       the newest record's build, and how many records carry none yet (S415; it counted the
       checked records only, so 15,914 records sat outside the card). */
    { id: "figures", title: "CPL figures", needs: ["B"],
      status: function (x) { return !x.build ? "not" : x.unbuilt ? "going" : "done"; },
      what: function (x) {
        if (!x.build) return "No record carries a display build yet.";
        return x.unbuilt ? fmt(x.read - x.unbuilt) + " records carry a display build, the newest " + x.build + "; " +
          fmt(x.unbuilt) + (x.unbuilt === 1 ? " waits" : " wait") + " for the next build."
          : "Every record carries a display build; the newest is " + x.build + ".";
      },
      foot: function (x) { return x.builtDay ? "Built " + x.builtDay : ""; },
      open: function (x) { return x.read ? ["Open the " + fmt(x.read) + " records", TO.records] : null; } },
    /* Sierra quotes a complete record: an active program whose record passes the three machine
       checks (Sam, Open Asks Sheet 95 card 2, 2026-10-18; cpl-chat's fetchCheckedRequirements
       reads the checks column). A person's confirm no longer gates her. */
    { id: "sierra", title: "Sierra and CPL Pathways", needs: ["active"],
      status: function () { return "live"; },
      what: function (x) { return "Sierra quotes the " + fmt(x.complete) + " complete records (an active program whose record passes the machine checks); CPL Pathways draws every record, each marked."; },
      foot: function () { return ""; },
      open: function () { return ["Open CPL Pathways", TO.pathways]; } }
  ];
  var SOURCE = { A: "The addenda table", active: "COCI's list of active programs", B: "The display build read",
    Q: "The queue's status file (" + QUEUE_URL + ")" };
  /* The view itself is drawn by commons_progress.js, the Commons' shared Progress module (S419;
     Sam, Open Asks Sheet 95 card 1, 2026-10-18: "Yes, and include Common Subjects in the mix").
     The definitions above and the context below stay this project's; the renderer, the status
     file read, the milestone arithmetic, the time words and the Progress CSS are shared with
     every common reference's Progress view. The boot block loads the module first; should it
     fail to load, the Progress view says so and the other views read as usual. */
  var CP = window.CPL_COMMONS_PROGRESS || missingProgressModule();
  function missingProgressModule() {
    var blank = function () { return ""; }, none = function () { return null; };
    return { toDate: none, ptDay: blank, dayOf: blank, joinAnd: function (a) { return a.join(", "); }, latest: none,
      nextWeekly: function (now) { return now; }, nextRun: none, since: none, wholeFacts: none,
      steps: function (ms) { return { steps: ms.map(function (m) { return { m: m, missing: [], left: [], state: "later" }; }), here: null, next: null }; },
      readStatus: function (url) { return Promise.reject(new Error("commons_progress.js did not load, so " + url + " was not read")); },
      render: function () {
        return el("div", { cls: "prh-empty", role: "alert",
          text: "The Progress view's shared module (commons_progress.js) could not be loaded. The other views read as usual; reload the tab to try again." });
      } };
  }
  var ptDay = CP.ptDay, dayOf = CP.dayOf, joinAnd = CP.joinAnd, latest = CP.latest, nextWeekly = CP.nextWeekly, nextRun = CP.nextRun;
  function short(c) { return String(c || "").replace(/\s+College$/, ""); }

  function progressContext(now) {
    var R = state.registry || [], P = rows(), G = state.progress || { errors: {} };
    var Q = G.queue || null, A = G.addenda || null, K = G.activeKeys || null, B = G.build || null;
    var P1 = P.filter(function (p) { return p.checked; });
    var published = R.filter(hasMap);
    var mapsRead = published.filter(function (r) { return r.sequence_access === "open"; });
    var mapsSettled = published.filter(function (r) {
      if (r.sequence_access === "open") return true;
      var p = r.procedure;
      return (r.sequence_access === "refused" || r.sequence_access === "unreached") && !!p &&
        Array.isArray(p.workarounds) && p.workarounds.length > 0;
    });
    var procs = R.filter(function (r) { return r.procedure; });
    var liveA = A ? A.filter(function (a) { return LIVE_ADDENDA.indexOf(a.status) >= 0; }) : null;
    /* Every record in the index, counted once: read, passing or failing (and on which check),
       and, where COCI's active list was read, complete (an active program, passing). */
    var colleges = {}, doneCols = {}, n = { pass: 0, fail: 0, units: 0, courses: 0, added: 0, onActive: 0, complete: 0 };
    P.forEach(function (p) {
      colleges[p.college] = 1;
      var f = machineFails(p), act = !!(K && K[keyOf(p)]);
      if (f.length) {
        n.fail++;
        if (f.indexOf("units") >= 0) n.units++;
        if (f.indexOf("courses") >= 0) n.courses++;
        if (f.indexOf("off-list") >= 0) n.added++;
      } else n.pass++;
      if (act) { n.onActive++; if (!f.length) { n.complete++; doneCols[p.college] = 1; } }
    });
    var procList = procs.map(function (r) { return short(r.college) + (r.procedure.v != null ? " v" + r.procedure.v : ""); });
    var x = {
      R: R, P: P1, A: A, B: B, Q: Q, active: G.active == null ? null : G.active, errors: G.errors || {}, now: now,
      decider: (Q && Q.decider) || "Sam",
      withUrl: R.filter(function (r) { return r.catalog_url; }).length,
      currentYear: R.filter(function (r) { return r.catalog_year === CURRENT_YEAR; }).length,
      censusDay: dayOf(latest(R.map(function (r) { return r.census_checked_at; }))),
      nextCensus: ptDay(nextWeekly(now, 0, 10, 29)),
      checked: P1.length,
      checkedDay: dayOf(latest(P1.map(function (p) { return p.checked_at; }))),
      read: P.length, readColleges: Object.keys(colleges).length,
      passing: n.pass, failing: n.fail, failUnits: n.units, failCourses: n.courses, failAdded: n.added,
      complete: K ? n.complete : null, completeColleges: K ? Object.keys(doneCols).length : null,
      activeUnread: K && G.active != null ? G.active - n.onActive : null, notActive: K ? P.length - n.onActive : null,
      mapsPublished: published.length, mapsRead: mapsRead.length, mapsSettled: mapsSettled.length,
      mapsReadAt: mapsRead.map(function (r) { return short(r.college); }),
      mapsRefused: published.filter(function (r) { return r.sequence_access === "refused"; }).length,
      procedures: procs.length,
      procedureList: procList.length > 4 ? procList.slice(0, 3).join(", ") + " and " + (procList.length - 3) + " more" : procList.join(", "),
      addendaTotal: liveA ? liveA.length : null,
      addendaColleges: liveA ? Object.keys(liveA.reduce(function (o, a) { o[a.college] = 1; return o; }, {})).length : null,
      addendaRead: liveA ? liveA.filter(function (a) { return a.status !== "listed"; }).length : null,
      addendaUnread: liveA ? liveA.filter(function (a) { return a.status === "listed"; }).length : null,
      build: B ? B.build : null, unbuilt: B ? B.unbuilt : null, builtDay: B ? dayOf(B.built) : ""
    };
    /* Where the harvest stands (the shared module's arithmetic): every milestone before the
       first one with anything left is done; that one is You are here, the one after it is next. */
    var st = CP.steps(MILESTONES, x);
    x.steps = st.steps; x.here = st.here; x.next = st.next;
    return x;
  }

  /* ── the headline: every program in the state beside the ones the harvest holds ──
   * Sam, 2026-10-08, in chat: "add to our ROEP dashboard the total count of college active
   * program control numbers from COCI and the ones with complete harvested ROEP data... I
   * want to be able to show this to the Chancellor so she can get the BIG vision and
   * progress"; SkyView becomes the hub later. Yes to the mock-up (S347):
   * https://claude.ai/artifact/ME23x5taJpTKpx4RBwQ2Tr (prototype/roep_headline_mockup.html).
   * Complete means an active program whose record passes the three machine checks (S415). It
   * meant a person had checked the record until Sam's 2026-10-17 ruling ("No need to ask me for
   * approval on all these items as I am trusting your procedures"); after that the person-checked
   * count stood at 32 while 15,946 records were read, and the band read as if the harvest had
   * stalled. COCI holds one Active row per control number (20,282 at 118 colleges), read by key so
   * a record counts only when its program is active. The band sits in the view's head, beside the
   * run status, so Collapse all leaves it on screen. Each checkpoint records the pair in the status
   * file's headline list (scripts/queue_status.py --headline), and the band names the first
   * recorded complete count once today's passes it. Under it, each number leads to its list:
   * the records read, the ones failing a check, and the active programs no read has reached. */
  function headlineFacts(x) {
    return {
      active: x.active, colleges: x.R.length,
      complete: x.complete, completeColleges: x.completeColleges,
      read: x.read, readColleges: x.readColleges, failing: x.failing, unread: x.activeUnread,
      since: CP.since(x.Q, x.complete)
    };
  }
  /* The band's definition, drawn by the shared module: the universe, the complete ones, the bar's
     words, and the counts under it that lead to their lists. */
  var HEADLINE = {
    label: "Every active program in the state, and how many the harvest holds complete",
    needs: ["active"],
    all: { n: function (x) { return x.active; },
      words: function (x) { return "active programs at " + x.R.length + " colleges"; },
      small: "The state's program inventory (COCI), one control number each" },
    mine: { n: function (x) { return x.complete; },
      words: "active programs harvested complete",
      small: function (x) {
        return "Read from the college's catalog and passing the machine checks: every listed course placed, none added, the units add up. At " +
          x.completeColleges + (x.completeColleges === 1 ? " college." : " colleges.");
      },
      open: function (x) { return x.complete > 0 ? ["Open the " + fmt(x.complete) + " complete", TO.complete] : null; } },
    barLabel: function (x) { return fmt(x.complete) + " of " + fmt(x.active) + " active programs complete"; },
    within: function (x) {
      if (!(x.read > 0)) return null;
      return [{ n: x.read, words: " records read at " + x.readColleges + (x.readColleges === 1 ? " college" : " colleges") },
        x.failing > 0 ? { go: [fmt(x.failing) + (x.failing === 1 ? " fails" : " fail") + " a machine check", TO.fail] } : null,
        x.activeUnread != null ? { n: x.activeUnread, words: " active " + (x.activeUnread === 1 ? "program" : "programs") + " not read yet" } : null];
    }
  };

  /* ── the whole harvest, one measure ──
   * Sam, 2026-10-13, in chat: "Can you add an overall measure on our prog reqs dash to
   * estimate how far we are through the whole harvest process? Wouldn't need to worry about
   * the confirm step on the programs as later I will change that step to an optional college
   * confirm once the procedures look stable and dependable. I'm thinking of the whole ask:
   * harvesting all links for catalogs and CMSs and PPM maps, all programs and courses with
   * ROEP data (or gaps), all COCI/program discrepancies, all SLOs and PLOs, all available
   * career data per program." (cpl_memory sam-whole-harvest-measure-and-optional-college-
   * confirm-2026-10-13.)
   * WHOLE is a definition, as PARTS is: the five parts count equally, a part with halves
   * averages them, and the confirm step (the four checks' human read) is left out. The counts
   * come from the status file's harvest block, which each checkpoint stamps with one query
   * (scripts/queue_status.py --harvest; the SQL is in .claude/commands/checkpoint.md step 12),
   * because anon reads checked records only. Programs and courses are COCI's active ones. */
  var WHOLE = [
    { id: "links", title: "Links", note: "Each college's catalog, course outline system and program map, found or settled",
      halves: [["catalog", "catalogs"], ["cms", "outline systems"], ["ppm", "program maps"]], open: ["Open the colleges", TO.colleges] },
    { id: "roep", title: "Program data", note: "Active programs with their requirements read, or a gap the read filed", open: ["Open the records", TO.records] },
    { id: "coci", title: "COCI comparison", note: "Active programs whose catalog list was compared with COCI's", open: ["Open the records", TO.records] },
    { id: "outcomes", title: "SLOs and PLOs", note: "Course SLOs read, of the courses on active programs; programs read for their PLOs",
      halves: [["slo", "course SLOs"], ["plo", "program PLOs"]], open: ["Open the records", TO.records] },
    { id: "careers", title: "Career data", note: "Active programs read for the careers their catalog names", open: ["Open the records", TO.records] }
  ];
  function wholeFacts(x) { return CP.wholeFacts(WHOLE, x.Q && x.Q.harvest); }

  /* The view, drawn by the shared module from this project's definitions and context; the host
     lends its sections, its count controls and its call cards, so a count opens this tab's own
     list and a call's records answer here. Its words are the harvest's. */
  var PROGRESS = {
    title: "CPL Pathways", sub: "Progress",
    lede: "Where the harvest stands. The milestones and parts are read live from the harvest's tables on each visit; the next step, the calls and what changed come from the last session's checkpoint.",
    milestones: MILESTONES, parts: PARTS, partsTitle: "Parts of the harvest", headline: HEADLINE, sources: SOURCE,
    whole: { parts: WHOLE, key: "harvest", label: "The whole harvest", of: "of the whole harvest", partsLabel: "The five parts",
      notCounted: "The whole harvest: not counted yet; the next checkpoint stamps the counts.",
      foot: "The five parts count equally. The confirm step is left out: it becomes an optional college confirm once the reading procedures prove stable." }
  };
  var HOST = { section: section, goControl: goControl, callAnswered: callAnswered, callRecords: callRecords, callLinks: callLinks, callDone: callDone, goToCall: goToCall };
  function viewProgress() { return CP.render(PROGRESS, progressContext(new Date()), state.progress || {}, HOST); }

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
      if (c && c.answer && c.answer.words) return;   /* answered on its sheet */
      if (todoMark(c)) return;                       /* marked done on its card */
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
    goToCall(todoCount(Q).first);
  }
  function stillMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function bringUp(node, focusNode) {
    if (!node) return;
    if (node.scrollIntoView) node.scrollIntoView({ block: "start", behavior: stillMotion() ? "auto" : "smooth" });
    var f = focusNode || node;
    try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }
  /* One call's card on the Progress view, open, scrolled to and focused. */
  function goToCall(i) {
    secSet("progress:call:" + i, true);
    choose("progress", false);
    var card = document.querySelector("#" + ROOT_ID + ' details[data-sec="progress:call:' + i + '"]');
    if (card) bringUp(card, card.querySelector("summary"));
  }
  /* What a count totals (TO above): the view, with only the target's filters set, so the list
     shows exactly what the card counted; its list's section opened; the panel brought up. */
  function goTo(to) {
    if (!to || !to.view) return;
    state.q = to.q || ""; state.show = to.show || "all"; state.platform = "all";
    state.rq = to.rq || ""; state.rshow = to.rshow || "all";
    /* A count spans every college, so its list does too, whatever the reader picked; a target
       that names a college adds it to the picks. Either way the records load as they show. */
    if (to.view === "records") {
      if (to.rcollege) { linkPick([to.rcollege]); state.rscope = "pick"; }
      else state.rscope = "all";
    }
    if (to.sec) secSet(to.sec, true);
    choose(to.view, false);
    bringUp(document.getElementById("prh-panel"));
  }
  /* A count's control: a word that opens its list, or a link where the target is a tab. */
  function goControl(words, to, cls) {
    if (to && to.href) return el("a", { cls: "prh-word " + (cls || ""), href: to.href, text: words });
    var b = el("button", { cls: "prh-word " + (cls || ""), type: "button", text: words });
    b.addEventListener("click", function () { goTo(to); });
    return b;
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
  var split = { on: false, node: null, opener: null, inert: [], key: null, changed: false, said: null };
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
     the next page. Its opener is cut, so the college's page cannot reach this one. stay: the
     reading room opened it by itself, so the record keeps the focus. */
  var catalogWin = null;
  function openCatalogWindow(url, stay) {
    var b = screenBox();
    var w = window.open(url, "prh-catalog", "popup,left=" + b.left + ",top=" + b.top + ",width=" + b.half + ",height=" + b.h);
    if (!w) return null;
    catalogWin = w;
    try { w.opener = null; } catch (e) { /* already the college's page */ }
    if (stay) { try { window.focus(); } catch (e) { /* the browser decides */ } }
    else { try { w.focus(); } catch (e) { /* the browser decides */ } }
    return w;
  }
  function closeCatalogWindow() {
    var w = catalogWin;
    catalogWin = null;
    try { if (w && !w.closed) w.close(); } catch (e) { /* a window the reader opened by hand stays */ }
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
  /* A record by its key (the reading room's link, or another window asking): it opens whatever
     the picker holds, reading its full row first when the page holds only its index row. */
  function openKey(key) {
    var p = recordFor(keyRef(key));
    if (!p) return false;
    openRecord(p, null);
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
        if (readable(q)) return q;
      }
      return null;
    }
    return null;
  }
  /* A record the reader can read side by side: waiting, with its fingerprint and its catalog
     page. A light row has not brought its page yet; every record names one (2026-10-13), and
     goNext() passes over one that arrives without. */
  function readable(q) { return !!(q && !q._gone && (q._light || q.source_url) && q.requirements_fp && stateLine(q).waiting); }
  /* The colleges the Records view lists: those every college-side filter passes, or every
     college (null) when it lists them all or no such filter is set, so a record opened by a
     link still has a next one. */
  function listedColleges() {
    if (state.rscope === "all" || !collegeFiltersOn()) return null;
    var seen = {};
    return rows().map(function (p) { return p.college; }).filter(function (c) {
      if (seen[c]) return false;
      seen[c] = 1;
      return collegeInFilters(c);
    });
  }
  /* The next record waiting on the reader (Sam, 2026-10-11: "bring me to the next item to
     confirm"). A record on a call: the next waiting one on that call, then on the calls after
     it. Any other record: the next waiting one in the list the Records view shows, in its order
     (college, then control number) and under its search and filters. */
  function nextToRead(p) {
    function same(r) { return !!r && r.college === p.college && r.control_number === p.control_number; }
    var Q = state.progress && state.progress.queue, calls = Q && Array.isArray(Q.calls) ? Q.calls : [];
    var at = -1;
    calls.forEach(function (c, i) { if (at < 0 && callRefs(c).some(same)) at = i; });
    if (at >= 0) {
      var q = nextWaiting(p);
      if (q) return q;
      for (var n = 1; n < calls.length; n++) {
        var refs = callRefs(calls[(at + n) % calls.length]);
        for (var j = 0; j < refs.length; j++) { var r = recordFor(refs[j]); if (!same(r) && readable(r)) return r; }
      }
      return null;
    }
    var P = filterRecords((state.review && state.review.records) || [], state.rq, state.rshow, listedColleges(), isWaiting);
    var i0 = -1;
    P.forEach(function (r, i) { if (i0 < 0 && same(r)) i0 = i; });
    for (var k = 1; k <= P.length; k++) {
      var r2 = P[(i0 + k) % P.length];
      if (!same(r2) && readable(r2)) return r2;
    }
    return null;
  }
  /* After Confirm or Save the note in side by side (Sam, 2026-10-11: "When I choose Confirm or
     Save Note close the screens and bring me to the next item to confirm"): the next record
     opens in place, its catalog with it, and says what was saved. With nothing left, the
     screens close, the catalog's window too, and the tab says so. */
  function advanceFrom(p, saved) {
    goNext(p, saved, function () {
      state.notice = saved + " Nothing else waits on your reading.";
      closeCatalogWindow();
      if (RECORD_KEY) {
        try {
          var M = window.opener && window.opener.CPL_PROGRAM_REQUIREMENTS;
          if (M && typeof M.notice === "function") M.notice(state.notice);
        } catch (e) { /* the opener moved on */ }
      }
      closeSplit();
    });
  }
  /* The next record to read, opened side by side in place of p, whatever the picker holds: a
     light one loads by key first (openSplit reads it ahead, so this is usually instant). none()
     runs when nothing else waits. A read that fails says so in the bar and stays on p. */
  function goNext(p, saved, none) {
    var from = keyOf(p), hops = 0;
    function still() { return split.on && split.key === from; }
    function say(t) { if (split.said && still()) split.said.textContent = t; }
    (function step(q) {
      if (!q || ++hops > 50) { none(); return; }
      if (q._light) {
        say(((saved ? saved + " " : "") + "Reading the next record…").trim());
        ensureRows([q], { retry: true }).then(function () {
          if (!still()) return;
          if (q._gone) { step(nextToRead(p)); return; }
          if (q._light) { say(((saved ? saved + " " : "") + couldNotRead(q)).trim()); return; }
          /* Its full row is the table's word now: read since, it passes to the one after. */
          if (!readable(q)) { step(nextToRead(q)); return; }
          step(q);
        });
        return;
      }
      if (q.source_url) { openSplit(q, split.opener, saved); return; }
      step(nextToRead(q));
    })(nextToRead(p));
  }
  function couldNotRead(p) {
    var why = state.failed[p.college];
    return shortCollege(p.college) + "'s record " + p.control_number + " could not be read" + (why ? " (" + why + ")." : ".");
  }
  /* A record opened side by side from anywhere: a light one loads by key first. */
  function openRecord(p, opener, saved) {
    if (!p) return;
    if (!p._light) { if (p.source_url) openSplit(p, opener, saved); return; }
    ensureRows([p], { retry: true }).then(function () {
      if (!p._light && p.source_url) { openSplit(p, opener, saved); return; }
      notice(p._gone ? "Record " + p.control_number + " has left the table since this page read it." : couldNotRead(p));
      roomShown();
    });
  }
  function notice(text) {
    state.notice = text || null;
    if (document.getElementById(ROOT_ID)) render();
  }
  /* The reading room hides the page until its record is up, so COBI's home tab never shows
     first (Sam, 2026-10-11). The guard is the prh-room class the head script sets. */
  function roomShown() { document.documentElement.classList.remove("prh-room"); }
  function openSplit(p, opener, saved) {
    var frames = framingOf(p.source_url);
    if (frames === false && !RECORD_KEY && wideScreen() && openRecordWindow(p)) {
      if (split.on) closeSplit();
      return;
    }
    var carry = split.changed, back = split.on ? split.opener : null;
    closeSplit(true);
    state.notice = null;
    var name = p.program_title + " " + award(p.award);
    /* In the reading room the catalog always has its window, so the record takes the whole one.
       It opens that window by itself (Sam, 2026-10-11: "Have the split screen open automatically
       when I click in to review"). A browser that holds back a window no click asked for keeps
       the word that opens it. */
    var solo = !!RECORD_KEY;
    var held = solo && !openCatalogWindow(p.source_url, true);
    var said = el("span", { cls: "prh-small prh-quiet", "aria-live": "polite",
      text: [saved || "", held ? "Your browser held back the catalog's window: Show the catalog on the left opens it, and allowing pop-ups for this site opens it by itself." : ""].join(" ").trim() });
    var own = el("button", { cls: "prh-word", type: "button",
      text: solo ? "Show the catalog on the left" : "Open the catalog in its own window" });
    own.addEventListener("click", function () { openCatalogWindow(p.source_url); });
    var next = null;
    if (state.review && state.review.records) {
      next = el("button", { cls: "prh-word", type: "button", text: "Next waiting record" });
      next.addEventListener("click", function () {
        goNext(p, null, function () { said.textContent = "Nothing else waits on your reading."; });
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
    roomShown();
    split.on = true; split.node = node; split.opener = opener || back || null; split.changed = carry;
    split.key = p.college + "|" + p.control_number; split.said = said;
    document.getElementById("prh-split-t").focus();
    /* The next record, read ahead by key, so Next and a saved verdict move at once (and the
       catalog's window moves inside the click that asked). */
    if (next) { var ahead = nextToRead(p); if (ahead && ahead._light) ensureRows([ahead]); }
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
    split.on = false; split.node = null; split.opener = null; split.inert = []; split.key = null; split.changed = false; split.said = null;
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
    var R = state.registry || [], P = rows();
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
      state.notice ? el("p", { cls: "prh-said", role: "status", text: state.notice }) : null,
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
        [v.label, n[v.id] == null ? null : el("span", { cls: "prh-n", text: fmt(n[v.id]) })]);
      /* The Records tab itself lists the reader's picks; only a count's word lists every college. */
      b.addEventListener("click", function () { if (v.id === "records") { state.rscope = "pick"; dropLinkPicks(); } choose(v.id, true); });
      b.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight") j = (i + 1) % VIEWS.length;
        else if (k === "ArrowLeft") j = (i - 1 + VIEWS.length) % VIEWS.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = VIEWS.length - 1;
        if (j == null) return;
        e.preventDefault();
        if (VIEWS[j].id === "records") { state.rscope = "pick"; dropLinkPicks(); }
        choose(VIEWS[j].id, true);
      });
      sw.appendChild(b);
    });
    panel.setAttribute("aria-labelledby", "prh-tab-" + state.view);
    panel.appendChild(state.view === "progress" ? viewProgress()
      : state.view === "records" ? viewRecords()
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
    state.notice = null;
    render();
    if (focus) {
      var b = document.getElementById("prh-tab-" + id);
      if (b) b.focus();
    }
  }

  function activate() {
    wireSession();
    render();
    if (!state.registry && !state.loading) load();
    /* A list another tab asked for before this module had loaded (CPL Pathways' college line). */
    var pend = window.CPL_PROGRAM_REQUIREMENTS_GOTO;
    if (pend) { window.CPL_PROGRAM_REQUIREMENTS_GOTO = null; goTo(pend); }
  }

  window.CPL_PROGRAM_REQUIREMENTS = {
    activate: activate,
    _state: state, _load: load, _render: render, _idle: idle,
    INDEX_SELECT: INDEX_SELECT, CHECKED_SELECT: CHECKED_SELECT, DRAFT_SELECT: DRAFT_SELECT, PICK_KEY: PICK_KEY, FILTERS_KEY: FILTERS_KEY, CIP_FAMS: CIP_FAMS, sectorOf: sectorOf,
    catalogStatus: catalogStatus, catalogAccess: catalogAccess, filterProcedures: filterProcedures, filterRegistry: filterRegistry, filterRecords: filterRecords, recordChecks: recordChecks,
    ruleText: ruleText, procedureCounts: procedureCounts, award: award, span: span,
    collegeDrafts: collegeDrafts, draftText: draftText, flagsFor: flagsFor, flagSummary: flagSummary, collegeLine: collegeLine, collegeCount: collegeCount,
    machineFails: machineFails, verdictError: verdictError, VERDICT_RPC: VERDICT_RPC,
    todoCount: todoCount, goToTodos: goToTodos, openSplit: openSplit, closeSplit: closeSplit, framingOf: framingOf, FRAMING_URL: FRAMING_URL,
    openKey: openKey, nextWaiting: nextWaiting, nextToRead: nextToRead, notice: notice, callAnswered: callAnswered, RECORD_KEY: RECORD_KEY,
    exhibitCount: exhibitCount, openExhibits: openExhibits, closeExhibits: closeExhibits,
    MILESTONES: MILESTONES, PARTS: PARTS, WHOLE: WHOLE, wholeFacts: wholeFacts, TO: TO, goTo: goTo, goToCall: goToCall, progressContext: progressContext, headlineFacts: headlineFacts, nextRun: nextRun, nextWeekly: nextWeekly
  };
})();
