// commons_handover.js — hand it over in place: a course or a college opens beside the page, and a signed-in reviewer
// hands over what they hold.
//
// Sam, 2026-11-20, on the locked Commons order mock ("yes, build it!"; cpl_memory r-hand-over-in-place-sam-2026-11-20):
// "item or link and a try the link button", "need to be able to do this for all our commons datasets", and "add an api
// procedure box to each of these drag and drop side bars. that way when we establish one, we can plug it in there."
// The mock: https://claude.ai/artifact/68ERWyrwiApcF3QM1KuYM2 (source in the vault,
// CPLBrain/04-projects/cpl-initiative/commons-order-mock/).
//
// WHAT IT DRAWS
//   box(subject, opts)   The hand-over box, one component for every Commons dataset: a drop box (or choose a file),
//                        a link with Try the link, the data itself (pasted, for a course), and an API procedure box
//                        (for a college or a statewide dataset). subject = { subject_kind: "course" | "college" |
//                        "dataset", dataset, college, course_code, course_title, control_number, mid_card }.
//   panel                The side panel on the CPL Commons front page: one of the still-taught courses whose outline
//                        needs a person, with Previous and Next, at #commons/course/<control number>. It is a
//                        non-modal dialog: the page beside it stays live, and Close leaves the page where it was.
//   collegePane(M, c, H) College Data Collection's own panel for a college, opened at the place to act
//                        (#collect/.../college/<slug>/handover; d-college-opens-cdc-panel-2026-11-20: one panel, no
//                        duplicate).
//
// WHERE IT WRITES (kb/migrations/2026-11-20_commons_handover.sql; governance DR-35)
//   A file goes to the private bucket commons-handover; every hand-over is one row in commons_handover, added through
//   rpc/commons_handover_add, which stamps the reviewer's name from the sign-in. A course outline can name faculty, so
//   no API role reads a file back, and the table is a reviewer read. What everyone sees is
//   rpc/commons_handover_summary: counts by college, course, kind and status, with no person, file name, address or
//   text in it.
//
// THE SIGN-IN RULE. A reviewer's own sign-in, never the team phrase: the file is filed under a person's name.
//
// TRY THE LINK. The page saves the link, then asks the handover-try-link function to start the reader's pickup
// (commons-handover-pickup.yml) for that one row. The reader visits the address from the runner under its own name
// (CPLInitiativeCatalogCensus), stops at a bot check, and answers on the row; the page reads the answer back. Where
// the function is not reachable, the link waits for the nightly pickup and the page says so.
//
// Guard: tests/commons_handover.test.js (the page), tests/commons_handover_sql_proof.py (the database).
(function () {
  "use strict";
  if (window.CPL_HANDOVER) return;

  var BASE = window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var REST = BASE + "/rest/v1", STORE = BASE + "/storage/v1/object/commons-handover", TRY_FN = BASE + "/functions/v1/handover-try-link";
  var LIMIT = 52428800;   /* the bucket's 50 MB an object */
  var TYPES = { pdf: "application/pdf", html: "text/html", htm: "text/html", txt: "text/plain", csv: "text/csv", zip: "application/zip",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  var TAKES = "a PDF, a saved web page, a text file, a CSV, a spreadsheet, a Word file or a zip";
  var SEND = "Send the PDF to COBIx in your Grok Bot chat.";
  var POLL = { every: 15000, tries: 16 };   /* four minutes: a runner starts in about one */

  /* The words each dataset's box uses. Every Commons dataset has an entry, so the same box serves each of them. */
  var DATASETS = {
    course_outlines: {
      name: "course outlines",
      drop: { course: "Drop the course outline here", college: "Drop this college's outline files here", dataset: "Drop course outline files here" },
      hint: "A PDF or a saved web page.",
      link: { course: "Or paste a link: to this outline, or to a site that holds the college's outlines", college: "Or paste a link to the site that holds this college's outlines", dataset: "Or paste a link to a site that holds course outlines" },
      accept: "application/pdf,text/html,.pdf,.html,.htm,.zip,.doc,.docx,.txt", api: "Course outline"
    },
    catalog: {
      name: "the catalog", drop: { college: "Drop this college's catalog here", dataset: "Drop a catalog here" }, hint: "A PDF or a saved web page.",
      link: { college: "Or paste a link to this college's catalog", dataset: "Or paste a link to a catalog" }, accept: "application/pdf,text/html,.pdf,.html,.htm,.zip", api: "Catalog"
    },
    programs: {
      name: "catalog programs", drop: { college: "Drop this college's program pages here", dataset: "Drop program pages here" }, hint: "A PDF or a saved web page.",
      link: { college: "Or paste a link to this college's program pages", dataset: "Or paste a link to program pages" }, accept: "application/pdf,text/html,.pdf,.html,.htm,.zip", api: "Catalog programs"
    },
    term_reports: {
      name: "term reports", drop: { dataset: "Drop a term report here" }, hint: "A course file for one term, as a spreadsheet or CSV.",
      link: { dataset: "Or paste a link to the file, or to the page that offers it" }, accept: ".csv,.xlsx,.xls,.zip,text/csv", api: "Term report"
    },
    exhibits: {
      name: "exhibits", drop: { dataset: "Drop an exhibit file here" }, hint: "A PDF, a spreadsheet or a saved web page.",
      link: { dataset: "Or paste a link to the exhibit" }, accept: ".pdf,.csv,.xlsx,.xls,.html,.htm,.zip", api: "Exhibits"
    },
    credit_recommendations: {
      name: "credit recommendations", drop: { dataset: "Drop a credit recommendation file here" }, hint: "A PDF, a spreadsheet or a saved web page.",
      link: { dataset: "Or paste a link to the credit recommendation" }, accept: ".pdf,.csv,.xlsx,.xls,.html,.htm,.zip", api: "Credit recommendations"
    },
    credentials: {
      name: "credentials", drop: { dataset: "Drop a credential file here" }, hint: "A PDF, a spreadsheet or a saved web page.",
      link: { dataset: "Or paste a link to the credential" }, accept: ".pdf,.csv,.xlsx,.xls,.html,.htm,.zip", api: "Credentials"
    }
  };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k]; else if (k === "cls") e.className = attrs[k]; else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isHttp(u) { return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(String(u || "").trim()); }
  function lines(v) { return String(v || "").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); }
  var SEQ = 0;
  function nid(word) { SEQ += 1; return "cho-" + SEQ + "-" + word; }
  function uuid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* an older engine */ }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (ch) {
      var r = Math.random() * 16 | 0; return (ch === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  /* The stored name: letters, digits, dot, dash and underscore, as the table's own check asks. */
  function safeName(name) {
    var s = String(name || "file").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    if (s.length > 120) { var m = /\.[A-Za-z0-9]{1,8}$/.exec(s); s = s.slice(0, 110) + (m ? m[0] : ""); }
    return s || "file";
  }
  function typeOf(file) {
    var m = /\.([A-Za-z0-9]+)$/.exec(String(file && file.name || "")), ext = m ? m[1].toLowerCase() : "";
    if (own(TYPES, ext)) return TYPES[ext];
    var t = String(file && file.type || "").toLowerCase();
    return Object.keys(TYPES).some(function (k) { return TYPES[k] === t; }) ? t : "";
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ── the sign-in ── */
  function reviewer() {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.get !== "function") return null;
    var s = Sx.get();
    return s && s.email && ((typeof Sx.isFresh !== "function" || Sx.isFresh(s)) || s.refresh_token) ? s : null;
  }
  function headers(extra) {
    var Sx = window.CPL_SESSION;
    return Sx && typeof Sx.authHeaders === "function" ? Sx.authHeaders(extra) : (extra || {});
  }
  function fresh() {
    var Sx = window.CPL_SESSION;
    return Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
  }
  function fail(r, what) {
    return r.json().then(function (j) { return j && (j.message || j.error || j.reason) || ""; }, function () { return ""; }).then(function (m) {
      var e = new Error(String(m).replace(/^commons_handover_add:\s*/, "") || (what + " answered " + r.status)); e.status = r.status; throw e;
    });
  }

  /* ── the writes and reads ── */
  function payloadOf(subject, more) {
    var p = { dataset: subject.dataset, subject_kind: subject.subject_kind };
    ["college", "course_code", "course_title", "control_number", "mid_card"].forEach(function (k) { if (subject[k]) p[k] = String(subject[k]); });
    for (var k in more) p[k] = more[k];
    return p;
  }
  function add(subject, more) {
    return fresh().then(function () {
      return fetch(REST + "/rpc/commons_handover_add", { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify({ p: payloadOf(subject, more) }) });
    }).then(function (r) { return r.ok ? r.json() : fail(r, "The save"); });
  }
  function upload(file) {
    var path = today() + "/" + uuid() + "/" + safeName(file.name), type = typeOf(file);
    return fresh().then(function () {
      return fetch(STORE + "/" + path, { method: "POST", headers: headers({ "Content-Type": type, "x-upsert": "false" }), body: file });
    }).then(function (r) { return r.ok ? { path: path, type: type } : fail(r, "The private store"); });
  }
  /* Ask the reader to look at one row now. Resolves to { queued } and never rejects: a link that cannot be tried now
     waits for the nightly pickup. */
  function tryNow(id) {
    return fresh().then(function () {
      return fetch(TRY_FN, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify({ id: id }) });
    }).then(function (r) { return r.ok ? r.json().then(function (j) { return { queued: !!(j && j.queued) }; }, function () { return { queued: false }; }) : { queued: false }; },
      function () { return { queued: false }; });
  }
  function rowOf(id) {
    return fetch(REST + "/commons_handover?id=eq." + encodeURIComponent(id) + "&select=id,kind,status,status_note,found", { headers: headers() })
      .then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) { return rows && rows[0] || null; }, function () { return null; });
  }
  /* Everyone's read: counts only. Kept for the visit and read again after a hand-over. */
  var SUMMARY = { rows: null, at: 0, pending: null };
  function summary(force) {
    if (SUMMARY.pending) return SUMMARY.pending;
    if (SUMMARY.rows && !force) return Promise.resolve(SUMMARY.rows);
    SUMMARY.pending = fetch(REST + "/rpc/commons_handover_summary", { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: "{}" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { SUMMARY.pending = null; if (Array.isArray(rows)) { SUMMARY.rows = rows; SUMMARY.at = Date.now(); } return SUMMARY.rows; },
        function () { SUMMARY.pending = null; return SUMMARY.rows; });
    return SUMMARY.pending;
  }
  function rowsFor(rows, subject, dataset) {
    return (rows || []).filter(function (r) {
      if (dataset && r.dataset !== dataset) return false;
      if (subject.subject_kind === "dataset") return r.subject_kind === "dataset" && r.dataset === subject.dataset;
      if ((r.college || "") !== (subject.college || "")) return false;
      if (subject.subject_kind === "course") return r.subject_kind === "course" && (r.course_code || "") === (subject.course_code || "");
      return true;   /* a college's line counts its own hand-overs and its courses' */
    });
  }
  var NOUN = { file: ["file", "files"], link: ["link", "links"], paste: ["pasted entry", "pasted entries"], api: ["API procedure", "API procedures"] };
  var SAID = {
    waiting: { file: "to be opened by our reader", link: "to be tried by our reader", paste: "to be filed", api: "saved" },
    reads: { file: "read by our reader", link: "read by our reader", paste: "read", api: "answered our reader" },
    bot_check: { file: "stopped at a bot check", link: "answered with a bot check", paste: "stopped", api: "answered with a bot check" },
    could_not_read: { file: "our reader could not read", link: "our reader could not read", paste: "could not be read", api: "did not answer our reader" },
    filed: { file: "filed", link: "filed as a source", paste: "filed", api: "in use" },
    set_aside: { file: "set aside", link: "set aside", paste: "set aside", api: "set aside" }
  };
  /* What has been handed over for a subject, in words: "1 file to be opened by our reader; 1 link read by our reader". */
  function standing(rows, subject, dataset) {
    var by = {}, order = [];
    rowsFor(rows, subject, dataset).forEach(function (r) {
      var k = r.kind + "|" + r.status;
      if (!own(by, k)) { by[k] = 0; order.push(k); }
      by[k] += Number(r.n || 0);
    });
    return order.map(function (k) {
      var kind = k.split("|")[0], status = k.split("|")[1], n = by[k], noun = NOUN[kind] || ["hand-over", "hand-overs"];
      return fmt(n) + " " + (n === 1 ? noun[0] : noun[1]) + " " + ((SAID[status] || {})[kind] || status.replace(/_/g, " "));
    });
  }

  /* ── what the reader answered, in words ── */
  function answerWords(row, subject) {
    var f = row.found || {}, note = row.status_note ? " " + row.status_note : "";
    if (row.status === "reads") {
      if (row.kind === "api") return "The address answered our reader" + (f.http_status ? " with status " + f.http_status : "") + (f.content_type ? ", as " + f.content_type : "") + ".";
      var n = Number(f.outcomes || 0), o = Number(f.objectives || 0), where = f.pdf ? "in the PDF" : "on the page";
      var got = n || o ? " It found " + fmt(n) + (n === 1 ? " outcome" : " outcomes") + " and " + fmt(o) + (o === 1 ? " objective" : " objectives") + " " + where + "."
        : f.pdf && f.chars == null ? " The address is a PDF, which the next collection run reads."
        : " It found no outcomes or objectives " + (f.pdf ? "in that PDF" : "on that page") + " itself.";
      return "Our reader read this address with no challenge." + got + " The address is on file as an outline source for " + (subject.college || "this dataset") + ", for the next collection run.";
    }
    if (row.status === "bot_check") return "The site answered our reader with a bot check, so the reader stopped. The address stays on file. A file dropped here is the way through.";
    if (row.status === "could_not_read") return "Our reader could not read this address." + note;
    if (row.status === "filed") return "Filed." + note;
    if (row.status === "set_aside") return "Set aside." + note;
    return "";
  }

  /* ── the box ── */
  function box(subject, opts) {
    opts = opts || {};
    var D = DATASETS[subject.dataset] || DATASETS.course_outlines, kind = subject.subject_kind;
    var root = el("div", { cls: "cho-box", "data-handover": subject.dataset, "data-subject": kind });
    var msg = el("p", { cls: "cho-msg", role: "status", "aria-live": "polite", hidden: true });
    function say(text, tone) {
      msg.textContent = text || "";
      msg.className = "cho-msg" + (tone ? " cho-" + tone : "");
      if (text) msg.removeAttribute("hidden"); else msg.setAttribute("hidden", "");
    }
    function done(what) { summary(true).then(function () { if (typeof opts.onChange === "function") opts.onChange(what); }); }
    function busy(on) { root.classList.toggle("cho-busy", !!on); root.setAttribute("aria-busy", on ? "true" : "false"); }

    if (!reviewer()) {
      root.appendChild(el("p", { cls: "cho-signin", text: "Sign in as a reviewer to hand over a file, a link or the data. Your name goes on what you hand over." }));
      var host = el("div", { cls: "cho-signin-mount" });
      root.appendChild(host);
      if (window.CPL_REVIEWER_SIGNIN && typeof CPL_REVIEWER_SIGNIN.mountInto === "function")
        CPL_REVIEWER_SIGNIN.mountInto(host, { title: "Reviewer sign-in", blurb: "A personal one-time link, emailed to an address on the reviewer list.", returnTab: "commons" });
      if (subject.dataset === "course_outlines") root.appendChild(el("p", { cls: "cho-other" }, ["The other route stays open: ", el("strong", { text: SEND })]));
      return root;
    }

    /* The drop box. */
    var fid = nid("file");
    var input = el("input", { type: "file", id: fid, cls: "cho-vh", accept: D.accept });
    var drop = el("div", { cls: "cho-drop", "data-drop": "" }, [
      el("strong", { text: (D.drop[kind] || D.drop.dataset) }),
      el("span", { text: D.hint + " It goes to a private store under your name, and our reader opens it at its next run." }),
      input, el("label", { cls: "cho-word", "for": fid, text: "Or choose a file" })
    ]);
    function took(file) {
      if (!file) return;
      var type = typeOf(file);
      if (!type) { say("The store takes " + TAKES + ". " + file.name + " is none of those.", "bad"); return; }
      if (file.size > LIMIT) { say(file.name + " is larger than 50 MB. Give a link to it instead, with Try the link.", "bad"); return; }
      busy(true); say("Sending " + file.name + ".");
      upload(file).then(function (u) {
        return add(subject, { kind: "file", file_path: u.path, file_name: file.name, file_type: u.type, file_bytes: String(file.size) });
      }).then(function () {
        busy(false); input.value = "";
        say("Sent: " + file.name + ". It is in the private store under your name. Our reader opens it at its next run and says here what it found.", "good");
        done("file");
      }, function (e) { busy(false); say("The file was not sent: " + (e && e.message ? e.message : e) + ".", "bad"); });
    }
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("cho-over"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("cho-over"); }); });
    drop.addEventListener("drop", function (e) { took(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
    input.addEventListener("change", function () { took(input.files && input.files[0]); });
    root.appendChild(drop);

    /* The link, and Try the link. */
    var lid = nid("link");
    var link = el("input", { type: "url", id: lid, placeholder: "https://", autocomplete: "off" });
    var linkForm = el("form", { cls: "cho-form", novalidate: true }, [
      el("label", { "for": lid, text: (D.link[kind] || D.link.dataset) }), link,
      el("p", { cls: "cho-words" }, [el("button", { type: "submit", cls: "cmn-word", text: "Try the link" })])
    ]);
    /* The reader's answer, read back while the box is on the page. */
    function watch(id, waitWords) {
      var n = 0;
      function again() {
        if (!root.isConnected) return;
        rowOf(id).then(function (row) {
          if (row && row.status !== "waiting") { say(answerWords(row, subject), row.status === "reads" ? "good" : "bad"); done("answer"); return; }
          n += 1;
          if (n >= POLL.tries) { say(waitWords + " The answer has not come back yet. It shows here on your next visit."); return; }
          setTimeout(again, opts.pollMs != null ? opts.pollMs : POLL.every);
        });
      }
      setTimeout(again, opts.pollMs != null ? opts.pollMs : POLL.every);
    }
    linkForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = link.value.trim();
      if (!isHttp(v)) { say("Paste a full web address that starts with https://", "bad"); link.focus(); return; }
      busy(true); say("Saving the link.");
      add(subject, { kind: "link", link_url: v }).then(function (res) {
        done("link");
        return tryNow(res.id).then(function (t) {
          busy(false); link.value = "";
          if (!t.queued) { say("Saved under your name. Our reader tries this address at its nightly run and says here what it found."); return; }
          var w = "Our reader is visiting this address now, under its own name. If the site answers with a bot check, the reader stops and says so.";
          say(w + " Its answer shows here in a few minutes.");
          watch(res.id, w);
        });
      }, function (e) { busy(false); say("The link was not saved: " + (e && e.message ? e.message : e) + ".", "bad"); });
    });
    root.appendChild(linkForm);
    root.appendChild(msg);

    /* The data itself, for a course. */
    if (kind === "course") {
      var ids = { desc: nid("desc"), hours: nid("hours"), slos: nid("slos"), obj: nid("obj"), src: nid("src") };
      var desc = el("textarea", { id: ids.desc, rows: "3" }), hours = el("input", { type: "text", id: ids.hours, autocomplete: "off" }),
        slos = el("textarea", { id: ids.slos, rows: "4" }), obj = el("textarea", { id: ids.obj, rows: "4" }),
        src = el("input", { type: "url", id: ids.src, placeholder: "https://", autocomplete: "off" });
      var pasteForm = el("form", { cls: "cho-form", novalidate: true }, [
        el("label", { "for": ids.desc, text: "Catalog description" }), desc,
        el("label", { "for": ids.hours, text: "Units or hours" }), hours,
        el("label", { "for": ids.slos, text: "Student learning outcomes, one per line" }), slos,
        el("label", { "for": ids.obj, text: "Objectives, one per line" }), obj,
        el("label", { "for": ids.src, text: "Where you found it (web address)" }), src,
        el("p", { cls: "cho-words" }, [el("button", { type: "submit", cls: "cmn-word", text: opts.afterSave ? "Save and go to the next" : "Save" })])
      ]);
      pasteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var p = {}, s = lines(slos.value), o = lines(obj.value);
        if (desc.value.trim()) p.description = desc.value.trim();
        if (hours.value.trim()) p.hours = hours.value.trim();
        if (s.length) p.slos = s;
        if (o.length) p.objectives = o;
        if (!Object.keys(p).length) { say("Paste a description, hours or outcomes first.", "bad"); return; }
        if (src.value.trim()) { if (!isHttp(src.value)) { say("Give the place you found it as a full web address, or leave it empty.", "bad"); src.focus(); return; } p.source_url = src.value.trim(); }
        busy(true); say("Saving.");
        add(subject, { kind: "paste", pasted: p }).then(function () {
          busy(false);
          [desc, hours, slos, obj, src].forEach(function (x) { x.value = ""; });
          var saved = "Saved " + (subject.course_code || "the course") + " under your name. A person's entry wins over a later machine read.";
          say(saved, "good"); done("paste");
          if (typeof opts.afterSave === "function") opts.afterSave(saved);
        }, function (er) { busy(false); say("The data was not saved: " + (er && er.message ? er.message : er) + ".", "bad"); });
      });
      root.appendChild(el("details", { cls: "cho-paste" }, [el("summary", { text: "Or paste the data itself" }), pasteForm]));
    }

    /* API procedures: a box for each kind this subject takes, ready for the day an API exists. */
    var apis = opts.apis || [];
    if (apis.length) {
      /* The heading takes the level its place on the page calls for (opts.apiHeading), so no level is skipped. */
      var wrap = el("div", { cls: "cho-apis" }, [el(/^h[2-6]$/.test(opts.apiHeading || "") ? opts.apiHeading : "h4", { cls: "cho-apis-h", text: "API procedures" }),
        el("p", { cls: "cho-muted", text: "When " + (kind === "college" ? "a college or its vendor" : "the source") + " offers an API, plug it in here. A key, when one is needed, is kept in the secure store and never typed here." })]);
      apis.forEach(function (which) {
        var W = DATASETS[which.dataset] || D, label = W.api, aid = nid("api-url"), hid = nid("api-how");
        var url = el("input", { type: "url", id: aid, placeholder: "https://", autocomplete: "off" }), how = el("textarea", { id: hid, rows: "3" });
        var sum = el("summary", { text: label + " API: " + (which.saved ? "procedure saved" : "none yet") });
        var sub = { subject_kind: subject.subject_kind, dataset: which.dataset, college: subject.college };
        function send(test) {
          var v = url.value.trim();
          if (!isHttp(v)) { say("Give the API address first, starting with https://", "bad"); url.focus(); return; }
          var api = { which: which.which, address: v };
          if (how.value.trim()) api.procedure = how.value.trim();
          if (test) api.test = true;
          busy(true); say(test ? "Saving the address to test." : "Saving the procedure.");
          add(sub, { kind: "api", api: api }).then(function (res) {
            done("api");
            if (!test) {
              busy(false); sum.textContent = label + " API: procedure saved";
              say("The " + label.toLowerCase() + " API procedure is saved under your name" + (subject.college ? " for " + subject.college : "") + ". A session wires it into the nightly run, which then asks the API first.", "good");
              return null;
            }
            return tryNow(res.id).then(function (t) {
              busy(false);
              if (!t.queued) { say("Saved. Our reader calls this address once at its nightly run and says here what came back."); return; }
              var w = "Our reader is calling this address once, under its own name.";
              say(w + " What came back shows here in a few minutes.");
              watch(res.id, w);
            });
          }, function (e) { busy(false); say("The API procedure was not saved: " + (e && e.message ? e.message : e) + ".", "bad"); });
        }
        var test = el("button", { type: "button", cls: "cmn-word", text: "Test the API" }), save = el("button", { type: "button", cls: "cmn-word", text: "Save the procedure" });
        test.addEventListener("click", function () { send(true); });
        save.addEventListener("click", function () { send(false); });
        wrap.appendChild(el("details", { cls: "cho-api", "data-api": which.which }, [sum, el("div", { cls: "cho-form" }, [
          el("label", { "for": aid, text: "API address" }), url,
          el("label", { "for": hid, text: "The procedure: what to ask for and what comes back" }), how,
          el("p", { cls: "cho-words" }, [test, save])])]));
      });
      root.appendChild(wrap);
    }
    if (subject.dataset === "course_outlines") root.appendChild(el("p", { cls: "cho-other" }, ["The other route stays open: ", el("strong", { text: SEND })]));
    return root;
  }

  /* A "have" line: a name and what stands there. */
  function haveList(pairs) {
    return el("ul", { cls: "cho-have" }, pairs.filter(Boolean).map(function (x) {
      return el("li", null, [el("span", { cls: "cho-k", text: x[0] }), el("span", { cls: "cho-v", text: x[1] })]);
    }));
  }
  function handedLine(rows, subject, dataset) {
    var s = standing(rows, subject, dataset);
    return s.length ? ["Handed over", s.join("; ") + "."] : ["Handed over", "Nothing yet."];
  }

  /* ── the course panel on the CPL Commons front page ── */
  var P = { el: null, host: null, list: [], at: -1, from: null, onAddress: null, carry: "" };
  function courseKey(c) { return String(c.control_number || (c.college_slug + "-" + String(c.course).toLowerCase().replace(/[^a-z0-9]+/g, "-"))); }
  function courseHref(c) { return "#commons/course/" + encodeURIComponent(courseKey(c)); }
  /* The still-taught courses whose outline needs a person, from the hunt (commons_data.json blocked_hunt), in the
     page's own order: hunted colleges not yet filed, each with its courses. */
  function coursesOf(hunt) {
    if (!hunt || !Array.isArray(hunt.colleges)) return [];
    var card = {};
    (hunt.courses || []).forEach(function (x) { if (x.control_number) card[x.control_number] = x.mid_card_at_filing || ""; });
    var out = [];
    hunt.colleges.filter(function (c) { return c.hunted && !c.filed; }).forEach(function (c) {
      (c.still_taught || []).forEach(function (x) {
        out.push({ course: x.course, title: x.title || "", control_number: x.control_number || "", mid_card: card[x.control_number] || "",
          college: c.college, college_slug: c.slug, catalog_url: c.catalog_url || "", reason: c.reason || "" });
      });
    });
    return out;
  }
  function collegeHref(name) {
    return "#collect/outlines-blocked/college/" + String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "/handover";
  }
  function panelSet(list, opts) {
    opts = opts || {};
    P.list = list || []; P.host = opts.host || document.getElementById("tab-commons") || document.body; P.onAddress = opts.onAddress || null;
  }
  function panelShell() {
    if (P.el && P.el.isConnected) return P.el;
    ensureCss();
    P.el = el("aside", { cls: "cho-panel", id: "cho-panel", role: "dialog", "aria-labelledby": "cho-panel-h", hidden: true });
    P.host.appendChild(P.el);
    return P.el;
  }
  function onKey(e) { if (e.key === "Escape" && P.at >= 0) { e.preventDefault(); panelClose(); } }
  function panelDraw() {
    var box_ = panelShell(), c = P.list[P.at];
    box_.textContent = "";
    if (!c) { box_.setAttribute("hidden", ""); return; }
    box_.removeAttribute("hidden");
    var subject = { subject_kind: "course", dataset: "course_outlines", college: c.college, course_code: c.course, course_title: c.title, control_number: c.control_number, mid_card: c.mid_card };
    var close = el("button", { type: "button", cls: "cmn-word", id: "cho-panel-close", text: "Close" });
    close.addEventListener("click", panelClose);
    var prev = el("button", { type: "button", cls: "cmn-word", id: "cho-prev", text: "Previous" }), next = el("button", { type: "button", cls: "cmn-word", id: "cho-next", text: "Next" });
    prev.addEventListener("click", function () { panelStep(-1); });
    next.addEventListener("click", function () { panelStep(1); });
    var have = el("div", { id: "cho-have-wrap" });
    function drawHave(rows) {
      have.textContent = "";
      have.appendChild(haveList([
        ["Description and hours", "Our reader fills them from the college's catalog. Nothing is needed from you."],
        ["Outcomes", "Missing. The course's outline holds its SLOs and objectives, and our reader cannot reach it" + (c.reason ? " (" + c.reason + ")." : ".")],
        handedLine(rows, subject)
      ]));
    }
    drawHave(SUMMARY.rows);
    summary().then(function (rows) { if (P.list[P.at] === c) drawHave(rows); });
    var carry = P.carry; P.carry = "";
    var inner = el("div", { cls: "cho-panel-in" }, [
      el("div", { cls: "cho-panel-top" }, [el("p", { cls: "cho-eyebrow", text: "Course outline needed" }), close]),
      el("p", { cls: "cho-words cho-pos" }, [el("span", { id: "cho-pos", text: "Course " + (P.at + 1) + " of " + P.list.length }), prev, next]),
      el("h3", { id: "cho-panel-h", tabindex: "-1", text: c.course + (c.title ? ", " + c.title : "") }),
      el("p", { cls: "cho-muted", text: c.college + "." + (c.mid_card ? " M-ID card " + c.mid_card + "." : "") }),
      have,
      carry ? el("p", { cls: "cho-msg cho-good", role: "status", "data-carried": "", text: carry }) : null,
      box(subject, {
        afterSave: function (saved) { panelStep(1, saved); },
        onChange: function () { drawHave(SUMMARY.rows); if (typeof P.onChange === "function") P.onChange(); }
      }),
      c.catalog_url ? el("p", { cls: "cho-words" }, [el("a", { href: c.catalog_url, target: "_blank", rel: "noopener", text: "Open this college's catalog in a new tab" })]) : null,
      el("p", { cls: "cho-muted" }, ["API procedures for the catalog and for course outlines live on the college's panel: ",
        el("a", { href: collegeHref(c.college), "data-college-panel": c.college_slug, text: "open " + c.college }), "."]),
      el("p", { cls: "cho-muted" }, [(c.mid_card ? "M-ID card " + c.mid_card : "This course's M-ID card") + " keeps its other controls in ", el("a", { href: "#coci-lookup/courses", text: "Courses" }), "."])
    ]);
    box_.appendChild(inner);
  }
  function panelOpen(key, from) {
    var i = -1;
    P.list.forEach(function (c, n) { if (courseKey(c) === String(key)) i = n; });
    if (i < 0) return false;
    if (from) P.from = from;
    P.at = i;
    panelDraw();
    P.host.classList.add("cho-open");
    document.removeEventListener("keydown", onKey, true);
    document.addEventListener("keydown", onKey, true);
    if (P.onAddress) P.onAddress(courseKey(P.list[i]));
    var h = P.el.querySelector("#cho-panel-h");
    if (h && h.focus) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    return true;
  }
  /* Closing leaves the page where it was: no jump and no change of view. */
  function panelClose() {
    if (P.at < 0) return;
    var c = P.list[P.at];
    P.at = -1;
    panelDraw();
    if (P.host) P.host.classList.remove("cho-open");
    document.removeEventListener("keydown", onKey, true);
    if (P.onAddress) P.onAddress("");
    var back = P.from && P.from.isConnected ? P.from : (P.host && c ? P.host.querySelector('a[data-course="' + courseKey(c) + '"]') : null);
    P.from = null;
    if (back && back.focus) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }
  function panelStep(d, carry) {
    if (P.at < 0 || !P.list.length) return;
    var n = (P.at + d + P.list.length) % P.list.length;
    P.carry = carry || "";
    panelOpen(courseKey(P.list[n]));
  }
  /* A redraw of the page under an open panel (a renewed sign-in) draws the panel again on the same course. */
  window.addEventListener("cpl-session-changed", function () { if (P.at >= 0 && P.el && P.el.isConnected) panelDraw(); });

  /* ── College Data Collection's pane for a college ── */
  function collegePane(M, c, H) {
    ensureCss();
    var subject = { subject_kind: "college", dataset: "course_outlines", college: c.name };
    var ds = H && typeof H.datasets === "function" ? H.datasets(M, c) : [], pr = ds.filter(function (d) { return d.key === "pr"; })[0], slo = ds.filter(function (d) { return d.key === "slo"; })[0];
    var have = el("div", { id: "cho-have-wrap" });
    function apiSaved(rows, dataset) { return rowsFor(rows, subject, dataset).some(function (r) { return r.kind === "api"; }); }
    function drawHave(rows) {
      have.textContent = "";
      have.appendChild(haveList([
        pr ? ["Catalog programs", pr.note ? pr.note + "." : (pr.state || "Not collected yet") + "."] : null,
        slo ? ["Course outlines", (slo.state || "No outline read yet") + (slo.note ? ". " + slo.note : "") + "."] : ["Course outlines", "No outline read yet."],
        handedLine(rows, subject)
      ]));
    }
    drawHave(SUMMARY.rows);
    var theBox = box(subject, {
      apiHeading: "h3",   /* under the panel's h2 */
      apis: [{ which: "catalog", dataset: "catalog", saved: apiSaved(SUMMARY.rows, "catalog") }, { which: "course_outline", dataset: "course_outlines", saved: apiSaved(SUMMARY.rows, "course_outlines") }],
      onChange: function () { drawHave(SUMMARY.rows); }
    });
    /* The counts arrive after the pane draws: the lines follow, and an API box whose procedure is saved says so. */
    if (!SUMMARY.rows) summary().then(function (rows) {
      if (!rows) return;
      drawHave(rows);
      [["catalog", "catalog", "Catalog"], ["course_outline", "course_outlines", "Course outline"]].forEach(function (x) {
        var sum = theBox.querySelector('details[data-api="' + x[0] + '"] > summary');
        if (sum && apiSaved(rows, x[1])) sum.textContent = x[2] + " API: procedure saved";
      });
    });
    return {
      title: "Hand over course outlines",
      basis: "College Data Collection's own panel for the college, opened at the place to act. Give the place it keeps its course outlines, or drop the files.",
      kids: [el("div", { cls: "cho-pane", "data-handover-college": c.name }, [have, theBox])]
    };
  }

  var CSS = [
    ".cho-box { display:grid; gap:10px; min-width:0; }",
    ".cho-box.cho-busy { opacity:.7; }",
    ".cho-drop { border:2px dashed var(--cmn-accent); border-radius:12px; padding:16px 14px; display:grid; gap:6px; justify-items:center; text-align:center; background:var(--cmn-page); color:var(--cmn-ink); }",
    ".cho-drop strong { font-family:var(--cmn-serif); font-size:1.05rem; color:var(--cmn-heading); }",
    ".cho-drop span { font-size:.86rem; color:var(--cmn-ink-2); }",
    ".cho-drop.cho-over { background:var(--cmn-pill-bg); border-style:solid; }",
    ".cho-vh { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }",
    ".cho-word { display:inline-block; min-height:24px; line-height:24px; cursor:pointer; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; }",
    ".cho-word:hover { color:var(--cmn-heading); }",
    ".cho-vh:focus-visible + .cho-word { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cho-form { display:grid; gap:6px; min-width:0; }",
    ".cho-form label { font-weight:600; font-size:.9rem; color:var(--cmn-heading); }",
    ".cho-form input[type=url], .cho-form input[type=text], .cho-form textarea { width:100%; box-sizing:border-box; min-height:36px; padding:6px 8px; font:inherit; font-size:.92rem; color:var(--cmn-ink); background:var(--cmn-surface); border:1px solid var(--cmn-muted); border-radius:6px; }",
    ".cho-form input:focus-visible, .cho-form textarea:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:1px; }",
    ".cho-words { margin:0; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 18px; }",
    ".cho-msg { margin:0; padding:8px 10px; border-left:4px solid var(--cmn-accent); background:var(--cmn-page); color:var(--cmn-ink); font-size:.92rem; overflow-wrap:anywhere; }",
    ".cho-msg.cho-bad { border-left-color:var(--red-alert); }",
    ".cho-muted, .cho-other, .cho-signin { margin:0; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cho-other strong { color:var(--cmn-heading); }",
    ".cho-paste > summary, .cho-api > summary, .cho-term > summary { cursor:pointer; min-height:24px; line-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; }",
    ".cho-paste > summary:focus-visible, .cho-api > summary:focus-visible, .cho-term > summary:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cho-paste[open] > summary, .cho-api[open] > summary, .cho-term[open] > summary { margin-bottom:8px; }",
    ".cho-apis { display:grid; gap:6px; border-top:1px solid var(--cmn-line-soft); padding-top:10px; }",
    ".cho-apis-h { margin:0; font-family:inherit; font-size:.98rem; font-weight:700; color:var(--cmn-heading); }",
    ".cho-have { list-style:none; margin:0; padding:0; display:grid; gap:6px; }",
    ".cho-have li { display:grid; gap:1px; min-width:0; overflow-wrap:anywhere; }",
    ".cho-k { font-weight:600; font-size:.86rem; color:var(--cmn-heading); }",
    ".cho-v { font-size:.92rem; color:var(--cmn-ink-2); }",
    ".cho-pane { display:grid; gap:12px; }",
    ".cho-panel { position:fixed; top:0; right:0; bottom:0; z-index:1000; display:flex; width:min(476px, calc(100vw - 24px)); background:var(--cmn-dialog, var(--cmn-surface)); border-left:1px solid var(--cmn-line); box-shadow:-12px 0 32px color-mix(in srgb, var(--cmn-heading) 16%, transparent); color:var(--cmn-ink); }",
    ".cho-panel[hidden] { display:none; }",
    ".cho-panel-in { flex:1 1 auto; min-width:0; overflow-y:auto; display:grid; gap:12px; align-content:start; padding:calc(18px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 24px 18px; }",
    ".cho-panel-top { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
    ".cho-eyebrow { margin:0; font-size:.82rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".cho-panel h3 { margin:0; font-family:var(--cmn-serif); font-size:clamp(1.15rem, 1rem + .6vw, 1.4rem); color:var(--cmn-title); overflow-wrap:anywhere; }",
    ".cho-panel h3:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    ".cho-panel a { color:var(--cmn-link); text-underline-offset:3px; display:inline-block; min-height:24px; line-height:24px; }",
    ".cho-panel a:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cho-pos { font-size:.9rem; color:var(--cmn-ink-2); }",
    ".cho-standing { color:var(--cmn-muted); font-size:.86rem; }",
    /* Beside the panel the page keeps its list in view on a wide screen; on a narrow one the panel covers it. */
    "@media (min-width: 1100px) { #tab-commons.cho-open .cmf-page { padding-right:500px; } }",
    "@media (prefers-reduced-motion: no-preference) { .cho-drop { transition:background-color .12s ease; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cho-css")) return;
    document.head.appendChild(el("style", { id: "cho-css", text: CSS }));
  }

  window.CPL_HANDOVER = {
    box: function (subject, opts) { ensureCss(); return box(subject, opts); },
    summary: summary, standing: standing, rowsFor: rowsFor, answerWords: answerWords, coursesOf: coursesOf, courseKey: courseKey, courseHref: courseHref,
    collegeHref: collegeHref, collegePane: collegePane, safeName: safeName, typeOf: typeOf, ensureCss: ensureCss,
    panel: { set: panelSet, open: panelOpen, close: panelClose, step: panelStep, isOpen: function () { return P.at >= 0; }, current: function () { return P.list[P.at] || null; },
      onChange: function (fn) { P.onChange = fn; } },
    DATASETS: DATASETS, SEND: SEND, POLL: POLL, _state: { summary: SUMMARY, panel: P }
  };
})();
