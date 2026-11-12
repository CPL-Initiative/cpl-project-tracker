// commons.js — the CPL Commons tab: every common reference on one page, the first view a card per reference.
//
// Sam, 2026-10-18 ~14:28Z: "It all needs to culminate in a 'Commons' dash that brings all the
// efforts together and places them in some order of priority and completion and known issues and
// settled procedures". Open Asks Sheet 95 card 1 (14:43Z): "Yes, and include Common Subjects in
// the mix." 2026-11-02 (S551): "the initial view is not so friendly--big boxes with obtuse item
// descriptions and taking up too much space with decision sheet descriptions that have already been
// closed ... 1 card for each major effort in the Commons with the most important items needing
// attention or recognition getting focus, metrics, and links." The mock he locked
// (https://claude.ai/artifact/TG8LPUBATV8WFfrmvPwKEG, version 10; S552: "Let's go with these designs
// for now ... let's go with CPL Commons for now") is the first view here: the decisions waiting on
// him first, then one card per common reference (its headline pair, Recently, Next, its words to
// open), in Malone's CPL/AI look (Open Asks Sheet 158 card 2, "malone": the one COBI tab in that
// look). The rows of 2026-10-18 (known issues, settled procedures, the Decision Sheet Library, the
// last run, with Sam's order and fold) stay as Details, one word away. Lane: docs/reference/lanes/commons.md.
//
// What it reads:
//   kb/status/commons.json      the machine side of every row, written daily by
//                               kb/_build_commons_status.py from the committed files: the
//                               complete pair and the test behind it, the known issues each
//                               naming its owner, the settled procedures, the machine stamp;
//                               since S552 also `building`, the three references with a count
//                               and no definition of complete yet (credentials, outcomes, skills).
//   kb/status/<project>.json    the session side, where a project keeps a run log (written at
//                               checkpoints, scripts/queue_status.py): the session stamp, the
//                               next step, the calls waiting on Sam. A project without one
//                               reads "no run log".
// A figure the builder could not read is null in the file and reads "Could not be read" here,
// never a zero (the S343 rule). A stamp past its cadence reads stale.
//
// The order and the fold of the Details rows are Sam's and stay in this browser (localStorage); the
// first view's filter lasts the visit (tabs never remember a filter, Sam 2026-10-21). Loaded by the
// tab's boot block after commons_progress.js (both HTMLs, Rule 4), whose date and number helpers
// this reuses. Tokens only, words for every control, no glyphs.
(function () {
  "use strict";

  var ROOT_ID = "commons-root";
  var STATUS_URL = "kb/status/commons.json";
  var ORDER_KEY = "cplCommons.order.v1";
  var FOLD_KEY = "cplCommons.fold.v1";
  var DECIDER = "Sam";
  var SESSION_STALE_HOURS = 7 * 24;   /* the run log is written at checkpoints; a week without one reads stale */
  var MACHINE_SLACK = 1.5;            /* a machine stamp older than 1.5 cadences reads stale */
  var TITLE = "CPL Commons";

  /* The cards' words (the locked mock): one per common reference, keyed by the status file's row key. The figures,
     the calls, Recently and Next come from the files; only the name, the one-line what and the opening words live here. */
  var CARDS = {
    requirements: { name: "Common Programs", what: "What each college program requires, read from its catalog.",
      links: [{ href: "#program-requirements/list", text: "CPL Pathways" }] },
    subjects: { name: "Common Subjects", what: "One shared subject code for each discipline, the key every common course sits under." },
    exhibit: { name: "Common Exhibits", what: "Every credential colleges grant credit for, under one name and issuer." },
    cr: { name: "Common Credit Recommendations", what: "One wording for each credit recommendation, so the same credit reads the same everywhere." },
    course: { name: "Common Courses", what: "Local courses grouped into shared common courses, worked on the Courses List or in SkyView." },
    credentials: { name: "Common Credentials", what: "Certifications and badges as their issuers publish them, with the skills each names, linked to exhibits." },
    outcomes: { name: "Common Outcomes", what: "Each course’s learning outcomes and objectives, read from its public outline." },
    skills: { name: "Common Skills", status: "Starting",
      what: "Skills and competencies tied to certifications and courses, validated by faculty as they articulate, and shown on each Career Passport." }
  };
  var ORDER = ["requirements", "subjects", "exhibit", "cr", "course", "credentials", "outcomes", "skills"];

  /* The one queue (Sam, 2026-11-04, S573: the routines carry the volume and "queue human decisions only when
     needed"). The status file's queue groups every known issue a person must see by its reason; everything else
     the routines carry. The words for each reason live here; the builder carries only the key. */
  var REASONS = {
    no_procedure: { title: "No procedure covers it yet", who: "A person decides it, then teaches the rule so the daily check handles the next one." },
    unsure: { title: "A procedure is unsure", who: "A person confirms it or fixes it; a note settles a difference for good." },
    reaches: { title: "It moves items another reference relies on", who: "The lead decides, and the move happens in one planned window." },
    keep_call: { title: "It is a keep, retire or rename call", who: "A curator decides, or the lead where a ruling stands." },
    unsorted: { title: "Not yet sorted", who: "An issue that names no reason. Give it one in the Commons builder." },
    stalled: { title: "A routine has stalled", who: "The team looks at why, then restarts the routine or gives its backlog a procedure." }
  };
  /* A stalled routine (the path mock's build, S624): the builder names a routine whose stamp is past its cadence
     (stopped) and a routine's backlog that counts as many items as it did a week before (not_shrinking). The box
     draws only when the file carries one, so a quiet week adds nothing to the page. */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function dayWords(v) {   /* the history's day key, YYYY-MM-DD, in the stamp's own short form */
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    return m && MONTHS[+m[2] - 1] ? MONTHS[+m[2] - 1] + " " + (+m[3]) : (v || "the earlier reading");
  }
  function stalledItem(i) {
    var name = (CARDS[i.ref] && CARDS[i.ref].name) || i.title || i.ref;
    var head = el("span", { cls: "cmn-queue-ref", text: name + ": " });
    if (i.kind === "stopped") {
      return el("li", { "data-stalled": "stopped" }, [head, openLink(i.open, i.what || "its routine"),
        " last ran " + (stampOf(i.since) || "at a time the file does not give") + "; it runs " + cadenceWords(i.every_hours) + "."]);
    }
    var moved = typeof i.was === "number" && i.n > i.was ? "up from " + fmt(i.was) + " on " : "the same count as on ";
    return el("li", { "data-stalled": "not_shrinking" }, [head, count(i.n, i.open), " " + (i.words || "") + ", " + moved + dayWords(i.since) + "."]);
  }

  function P() { return window.CPL_COMMONS_PROGRESS || null; }

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
  function toDate(v) {
    var p = P();
    if (p && p.toDate) return p.toDate(v);
    if (!v) return null;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function stampOf(v) {
    var p = P(), d = toDate(v);
    if (!d) return "";
    if (p && p.stampOf) return p.stampOf(v);
    return d.toISOString().slice(0, 16).replace("T", " ") + "Z";
  }
  function store(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : fallback; } catch (e) { return fallback; }
  }
  function keep(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  /* ── ages and states ── */
  function hoursSince(at, now) {
    var d = toDate(at);
    return d ? (now.getTime() - d.getTime()) / 36e5 : null;
  }
  function cadenceWords(h) {
    if (h == null) return "on dispatch";
    if (h === 24) return "daily";
    if (h === 168) return "weekly";
    return "every " + fmt(h) + " hours";
  }
  /* The machine stamp against its declared cadence: current, stale, or not read. */
  function machineState(m, now) {
    if (!m || !m.at) return { key: "unread", word: "Could not be read" };
    var age = hoursSince(m.at, now);
    if (age == null) return { key: "unread", word: "Could not be read" };
    if (m.every_hours == null) return { key: "neutral", word: "on dispatch" };
    return age <= m.every_hours * MACHINE_SLACK ? { key: "ok", word: "current" } : { key: "stale", word: "stale" };
  }
  /* The session stamp: a run log read against a weekly check, or the lack of one. */
  function sessionState(Q, err, now) {
    if (err) return { key: "unread", word: "Could not be read" };
    if (!Q) return { key: "neutral", word: "no run log" };
    var age = hoursSince(Q.written_at, now);
    if (age == null) return { key: "unread", word: "Could not be read" };
    return age <= SESSION_STALE_HOURS ? { key: "ok", word: "current" } : { key: "stale", word: "stale" };
  }
  function stateChip(s) { return el("span", { cls: "cmn-state cmn-state-" + s.key, text: s.word }); }

  /* ── the row ── */
  function openLink(href, text, cls) {
    if (!href) return el("span", { cls: cls, text: text });
    var a = el("a", { href: href, cls: cls, text: text });
    if (/^https:\/\//.test(href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    return a;
  }
  function count(n, href, cls) {
    return n == null ? el("span", { cls: "cmn-unread", text: "Could not be read" }) : openLink(href, fmt(n), cls);
  }
  function pairBlock(row) {
    var pairs = Array.isArray(row.pair) ? row.pair : [];
    var kids = pairs.map(function (p) {
      var line = el("p", { cls: "cmn-n" }, [count(p.n, p.open, "cmn-big")]);
      if (p.of != null) { line.appendChild(el("small", { text: " of " })); line.appendChild(document.createTextNode(fmt(p.of) + " ")); }
      else line.appendChild(document.createTextNode(" "));
      if (p.words) line.appendChild(el("small", { text: p.words }));
      if (p.n == null && row.error) line.appendChild(el("small", { cls: "cmn-why", text: " " + row.error }));
      return line;
    });
    var first = pairs[0];
    if (first && typeof first.n === "number" && typeof first.of === "number" && first.of > 0) {
      var pct = Math.max(0, Math.min(100, first.n / first.of * 100));
      var meter = el("div", { cls: "cmn-meter", role: "img", "aria-label": fmt(first.n) + " of " + fmt(first.of) + (first.words ? " " + first.words : "") });
      var bar = el("i"); bar.style.width = (Math.round(pct * 10) / 10) + "%"; meter.appendChild(bar);
      kids.push(meter);
    }
    if (Array.isArray(row.tests) && row.tests.length) {
      kids.push(el("p", { cls: "cmn-tests" }, row.tests.map(function (t) { return el("span", { cls: "cmn-test", text: t }); })));
    }
    return el("div", { cls: "cmn-pair" }, kids);
  }
  function cell(title, kids) { return el("div", { cls: "cmn-cell" }, [el("h4", { text: title })].concat(kids)); }
  function issuesCell(row) {
    var items = Array.isArray(row.issues) ? row.issues : [];
    if (!items.length) return cell("Known issues", [el("p", { cls: "cmn-quiet", text: row.error ? "Could not be read" : "None known" })]);
    return cell("Known issues", [el("ul", null, items.map(function (i) {
      var li = el("li", null, [count(i.n, i.open, "cmn-count"), " " + (i.words || "")]);
      if (i.owner) li.appendChild(el("span", { cls: "cmn-owner", text: " · " + i.owner }));
      return li;
    }))]);
  }
  function proceduresCell(row) {
    var items = Array.isArray(row.procedures) ? row.procedures : [];
    if (!items.length) return cell("Settled procedures", [el("p", { cls: "cmn-quiet", text: row.error ? "Could not be read" : "None yet" })]);
    return cell("Settled procedures", [el("ul", null, items.map(function (i) {
      return "n" in i ? el("li", null, [count(i.n, i.open, "cmn-count"), " " + (i.words || "")]) : el("li", { text: i.words || "" });
    }))]);
  }
  function answered(c) { return !!(c.answer && c.answer.words); }
  function openCalls(Q) { return (Q && Array.isArray(Q.calls) ? Q.calls : []).filter(function (c) { return !answered(c); }); }
  /* The calls in the project's run log, as its last checkpoint left them. */
  /* How many calls wait on Sam, in bold; a 0 in green (Sam, 2026-11-01: "bold the label that notes how many I have
     waiting on me and if it's 0, make the 0 green"). */
  function waitingCount(n) {
    if (n) return el("p", { cls: "cmn-waiting" }, [stateChip({ key: "open", word: n + " open" })]);
    return el("p", { cls: "cmn-waiting" }, [el("span", { cls: "cmn-state cmn-state-ok" }, [el("span", { cls: "cmn-zero", text: "0" }), " open"])]);
  }
  function sheetLink(c, node) {
    if (c.link && /^https:\/\//.test(c.link)) { node.appendChild(document.createTextNode(" ")); node.appendChild(openLink(c.link, c.link_text || "Open the decision sheet")); }
    else if (c.view && c.view.href && c.view.text) { node.appendChild(document.createTextNode(" ")); node.appendChild(openLink(c.view.href, c.view.text)); }
    return node;
  }
  function callsCell(Q, err) {
    var kids;
    if (err) kids = [el("p", null, [stateChip({ key: "unread", word: "Could not be read" }), el("span", { cls: "cmn-why", text: " " + err })])];
    else if (!Q) kids = [el("p", null, [stateChip({ key: "neutral", word: "no run log" })])];
    else {
      var calls = Array.isArray(Q.calls) ? Q.calls : [];
      var open = openCalls(Q), done = calls.filter(answered);
      kids = [waitingCount(open.length)];
      if (open.length) kids.push(el("ul", null, open.map(function (c) { return sheetLink(c, el("li", { text: c.title || "" })); })));
      /* Answered on its sheet: the call stays listed under Completed Decision Sheets (Sam, 2026-11-01), one line each,
         cut with an ellipsis; pressing the line opens his words and the sheet's link. */
      if (done.length) {
        kids.push(el("h5", { cls: "cmn-done-h", text: "Completed Decision Sheets" }));
        kids.push(el("ul", { cls: "cmn-done" }, done.map(function (c) {
          var why = "Answered by " + (c.answer.by || DECIDER) + (c.answer.at ? ", " + c.answer.at : "") + ": " + c.answer.words;
          return el("li", null, [el("details", null, [
            el("summary", { title: (c.title || "") + ". " + why }, [el("span", { cls: "cmn-done-line", text: (c.title || "") + " · " + why })]),
            sheetLink(c, el("p", { cls: "cmn-done-body" }))])]);
        })));
      }
    }
    // Sam, 2026-11-01: "Change the Decisions Waiting on Sam label to Decision Sheet Library and bold the label that notes
    // how many I have waiting on me." The cell lists the calls each decision sheet carried, answered or open.
    return cell("Decision Sheet Library", kids);
  }
  function runCell(row, Q, err, now) {
    var m = row.machine || {}, ms = machineState(m, now);
    var machine = el("p", { cls: "cmn-stamp" }, [
      el("span", null, ["Machine: ", m.what ? m.what + (m.at ? ", " + stampOf(m.at) : "") : (row.error ? row.error : "no stamp")]),
      el("span", { cls: "cmn-age" }, [cadenceWords(m.every_hours) + " · ", stateChip(ms)])
    ]);
    var ss = sessionState(Q, err, now), session;
    if (Q) {
      var who = (Q.session ? "S" + Q.session + " " : "") + (Q.moniker || "a session");
      session = el("p", { cls: "cmn-stamp" }, [
        el("span", null, ["Session: " + who + " wrote the run log, " + stampOf(Q.written_at)]),
        el("span", { cls: "cmn-age" }, ["each checkpoint · ", stateChip(ss)])
      ]);
    } else {
      session = el("p", { cls: "cmn-stamp" }, [el("span", null, ["Session: ", stateChip(ss)])]);
    }
    var kids = [machine, session];
    if (Q && Q.next_step && Q.next_step.title) kids.push(el("p", { cls: "cmn-next" }, [el("span", { cls: "cmn-owner", text: "Next: " }), Q.next_step.title]));
    return cell("Last run", kids);
  }
  function rowItem(row, S, now) {
    var key = row.key, Q = S && S[key] ? S[key].Q : null, err = S && S[key] ? S[key].error : null;
    var title = row.title || key;
    var acts = (Array.isArray(row.links) ? row.links : []).map(function (l) { return openLink(l.href, l.text); });
    acts.push(el("button", { cls: "cmn-word cmn-up", type: "button", "aria-label": "Move " + title + " up", text: "Move up" }));
    acts.push(el("button", { cls: "cmn-word cmn-down", type: "button", "aria-label": "Move " + title + " down", text: "Move down" }));
    acts.push(el("button", { cls: "cmn-word cmn-fold", type: "button", "aria-expanded": "true", "aria-controls": "cmn-detail-" + key,
      "aria-label": "Collapse " + title, text: "Collapse" }));
    var head = el("header", { cls: "cmn-head" }, [
      el("span", { cls: "cmn-pos", "aria-hidden": "true", text: "" }),
      el("h3", { text: title, tabindex: "-1" }),
      el("span", { cls: "cmn-acts" }, acts)
    ]);
    var detail = el("div", { cls: "cmn-detail", id: "cmn-detail-" + key }, [
      el("div", { cls: "cmn-cells" }, [issuesCell(row), proceduresCell(row), callsCell(Q, err), runCell(row, Q, err, now)])
    ]);
    var li = el("li", { cls: "cmn-ref", "data-key": key }, [head, pairBlock(row), detail]);
    return li;
  }

  /* ── the list: order and fold ── */
  function keys(list) { return Array.prototype.map.call(list.children, function (li) { return li.getAttribute("data-key"); }); }
  function renumber(list) {
    var items = list.children;
    Array.prototype.forEach.call(items, function (li, i) {
      li.querySelector(".cmn-pos").textContent = String(i + 1);
      li.querySelector(".cmn-up").disabled = i === 0;
      li.querySelector(".cmn-down").disabled = i === items.length - 1;
    });
  }
  function applyOrder(list, order, start) {
    var by = {};
    Array.prototype.forEach.call(list.children, function (li) { by[li.getAttribute("data-key")] = li; });
    order.filter(function (k) { return by[k]; }).forEach(function (k) { list.appendChild(by[k]); });
    start.forEach(function (k) { if (order.indexOf(k) < 0 && by[k]) list.appendChild(by[k]); });
    renumber(list);
  }
  function setFold(li, collapsed) {
    li.querySelector(".cmn-detail").hidden = collapsed;
    li.classList.toggle("cmn-collapsed", collapsed);
    var b = li.querySelector(".cmn-fold"), title = li.querySelector("h3").textContent;
    b.setAttribute("aria-expanded", collapsed ? "false" : "true");
    b.setAttribute("aria-label", (collapsed ? "Expand " : "Collapse ") + title);
    b.textContent = collapsed ? "Expand" : "Collapse";
  }
  function folded(list) {
    return Array.prototype.filter.call(list.children, function (li) { return li.classList.contains("cmn-collapsed"); })
      .map(function (li) { return li.getAttribute("data-key"); });
  }
  function syncFoldAll(list, btn) { btn.textContent = folded(list).length === list.children.length ? "Expand all" : "Collapse all"; }

  /* The Details: the rows of 2026-10-18, with Sam's order and fold, under the cards. */
  function renderRows(host, data, S, now) {
    var rows = data && Array.isArray(data.rows) ? data.rows : [];
    var start = rows.map(function (r) { return r.key; });
    var foldAll = el("button", { cls: "cmn-word", type: "button", id: "cmn-foldall", text: "Collapse all" });
    var reset = el("button", { cls: "cmn-word", type: "button", id: "cmn-reset", text: "Back to the starting order" });
    var bar = el("div", { cls: "cmn-bar", role: "group", "aria-label": "The controls for the list" }, [
      el("span", { cls: "cmn-note", text: data && data.written_at ? "Figures read " + stampOf(data.written_at) : "" }), foldAll, reset
    ]);
    var list = el("ol", { cls: "cmn-list", id: "cmn-refs", "aria-label": "The common references, in " + DECIDER + "'s order" },
      rows.map(function (r) { return rowItem(r, S, now); }));
    host.appendChild(bar);
    host.appendChild(list);

    applyOrder(list, store(ORDER_KEY, start), start);
    var fold = store(FOLD_KEY, []);
    Array.prototype.forEach.call(list.children, function (li) { setFold(li, fold.indexOf(li.getAttribute("data-key")) >= 0); });
    syncFoldAll(list, foldAll);

    list.addEventListener("click", function (e) {
      var b = e.target.closest("button.cmn-word");
      if (!b) return;
      var li = b.closest(".cmn-ref");
      if (b.classList.contains("cmn-fold")) {
        setFold(li, !li.classList.contains("cmn-collapsed"));
        keep(FOLD_KEY, folded(list));
        syncFoldAll(list, foldAll);
        b.focus();
        return;
      }
      if (b.classList.contains("cmn-up") && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
      else if (b.classList.contains("cmn-down") && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
      renumber(list);
      keep(ORDER_KEY, keys(list));
      b.focus();
    });
    foldAll.addEventListener("click", function () {
      var every = folded(list).length === list.children.length;
      Array.prototype.forEach.call(list.children, function (li) { setFold(li, !every); });
      keep(FOLD_KEY, folded(list));
      syncFoldAll(list, foldAll);
    });
    reset.addEventListener("click", function () { applyOrder(list, start, start); keep(ORDER_KEY, start); });
    return list;
  }

  /* ── the first view: a card per common reference ── */
  function firstSentence(t) {
    t = String(t || "").trim();
    var m = t.match(/^[^.]*\.(?=\s|$)/);
    return m ? m[0] : t;
  }
  function capFirst(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
  /* One card's facts, from the row (the machine side), its run log (the session side) and the words above. */
  function cardModel(row, S, building) {
    var spec = CARDS[row.key] || { name: row.title || row.key, what: "" };
    var Q = S && S[row.key] ? S[row.key].Q : null, err = S && S[row.key] ? S[row.key].error : null;
    var pair = (Array.isArray(row.pair) ? row.pair : [])[0] || {};
    var open = openCalls(Q);
    var unread = pair.n == null;
    var kind = open.length ? "needs" : (building ? "build" : "progress");
    var pct = typeof pair.n === "number" && typeof pair.of === "number" && pair.of > 0 ? Math.max(0, Math.min(100, pair.n / pair.of * 100)) : null;
    /* Complete (Sam's Commons rulings, 2026-11-08, #2921 item 3): every item of the headline pair is done and nothing
       waits on him. A reference's repair jobs stay in its issues; the word names the milestone, not the lane. */
    var complete = !unread && !open.length && !building && pct === 100;
    var status = unread ? "Could not be read" : open.length ? "Needs you" : building ? (spec.status || "Building") : complete ? "Complete" : "In progress";
    var recent = "";
    if (Q && Array.isArray(Q.changes) && Q.changes[0] && Q.changes[0].text) recent = firstSentence(Q.changes[0].text);
    else if (row.machine && row.machine.what && row.machine.at) recent = capFirst(row.machine.what) + ", " + stampOf(row.machine.at);
    var next = Q && Q.next_step && Q.next_step.title ? Q.next_step.title : "";
    var links = Array.isArray(spec.links) && spec.links.length ? spec.links : (Array.isArray(row.links) ? row.links : []);
    var home = links[0] ? links[0].href : row.tab;
    return { key: row.key, name: spec.name, what: spec.what, row: row, Q: Q, err: err, pair: pair, open: open, unread: unread,
      kind: kind, status: status, complete: complete, pct: pct, recent: recent, next: next, links: links, home: home };
  }
  /* Your decisions first, then by how far along, then the ones being built, in the mock's order inside a tie. */
  function sortCards(cards) {
    var rank = function (c) { return c.kind === "needs" ? 0 : c.kind === "progress" ? 1 : 2; };
    return cards.slice().sort(function (a, b) {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (a.kind === "needs" && a.open.length !== b.open.length) return b.open.length - a.open.length;
      if (a.kind !== "build" && (a.pct != null || b.pct != null)) {
        if (a.pct == null) return 1;
        if (b.pct == null) return -1;
        if (a.pct !== b.pct) return b.pct - a.pct;
      }
      return ORDER.indexOf(a.key) - ORDER.indexOf(b.key);
    });
  }
  function callNode(c) {
    var href = c.link && /^https:\/\//.test(c.link) ? c.link : (c.view && c.view.href ? c.view.href : null);
    return openLink(href, c.title || "", null);
  }
  function cardNode(c, onRecord) {
    var head = el("div", { cls: "cmn-card-head" }, [
      el("h3", { cls: "cmn-card-name" }, [openLink(c.home, c.name, null)]),
      el("span", { cls: "cmn-pill" + (c.kind === "needs" ? " cmn-pill-needs" : c.complete ? " cmn-pill-done" : ""), text: c.status })
    ]);
    var n = el("p", { cls: "cmn-card-n" });
    if (c.unread) {
      n.appendChild(el("span", { cls: "cmn-unread", text: "Could not be read" }));
      if (c.row.error) n.appendChild(el("span", { cls: "cmn-why", text: " " + c.row.error }));
    } else {
      n.appendChild(el("span", { cls: "cmn-card-big", text: fmt(c.pair.n) }));
      var words = (c.pair.of != null ? " of " + fmt(c.pair.of) : "") + (c.pair.words ? " " + c.pair.words : "");
      n.appendChild(document.createTextNode(words));
    }
    var figure = el("div", { cls: "cmn-card-figure" }, [n]);
    if (c.pct != null) {
      var meter = el("div", { cls: "cmn-meter cmn-card-meter", role: "img", "aria-label": Math.round(c.pct) + " percent" });
      var bar = el("i"); bar.style.width = (Math.round(c.pct * 10) / 10) + "%"; meter.appendChild(bar);
      figure.appendChild(meter);
    }
    // Confirmed by a person, the second pair: counted beside the first, never in its place (Sheet 160; S565).
    var also = (Array.isArray(c.row.pair) ? c.row.pair : [])[1];
    if (!c.unread && also && typeof also.n === "number")
      figure.appendChild(el("p", { cls: "cmn-card-also", text: fmt(also.n) + (also.words ? " " + also.words : "") }));
    var lines = el("div", { cls: "cmn-card-lines" });
    if (c.open.length) {
      var ask = el("p", { cls: "cmn-card-ask" }, [el("span", { cls: "cmn-card-label cmn-card-label-ask", text: "Your decision " }), callNode(c.open[0])]);
      if (c.open.length > 1) ask.appendChild(document.createTextNode(" and " + (c.open.length - 1) + " more"));
      lines.appendChild(ask);
    }
    if (c.recent) lines.appendChild(el("p", null, [el("span", { cls: "cmn-card-label", text: "Recently " }), c.recent]));
    if (c.next) lines.appendChild(el("p", null, [el("span", { cls: "cmn-card-label", text: "Next " }), c.next]));
    var acts = c.links.map(function (l) { return openLink(l.href, l.text, null); });
    var record = el("button", { cls: "cmn-word cmn-record", type: "button", "data-key": c.key, "aria-label": "Decision record for " + c.name, text: "Decision record" });
    record.addEventListener("click", function () { onRecord(c.key); });
    acts.push(record);
    return el("article", { cls: "cmn-card cmn-card-" + c.kind, "data-card": c.key, "data-kind": c.kind }, [
      head, el("p", { cls: "cmn-card-what", text: c.what }), figure, lines, el("div", { cls: "cmn-card-links" }, acts)
    ]);
  }
  function countWords(n) {
    var w = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    return n < w.length ? w[n] : String(n);
  }

  /* Mark done, on a to-do in the band: a note and the word, for a signed-in reviewer; signed out, where to sign in. */
  function todoControl(card, call, after) {
    var box = el("div", { cls: "cmn-todo" });
    if (!reviewer()) {
      box.appendChild(el("p", { cls: "cmn-todo-note", text: "A to-do: Mark done takes a reviewer sign-in, the emailed link; the team phrase does not carry it." }));
      return box;
    }
    var id = "cmn-todo-" + String(call.todo_id).replace(/[^a-z0-9-]/gi, "");
    var det = el("details", { cls: "cmn-todo-det" });
    det.appendChild(el("summary", { text: "Mark done" }));
    var note = el("textarea", { id: id + "-note", rows: "2", maxlength: "2000", cls: "cmn-todo-text" });
    var go = el("button", { cls: "cmn-word", type: "button", text: "Save, it is done" });
    var status = el("p", { cls: "cmn-todo-note", role: "status" });
    det.appendChild(el("label", { "for": id + "-note", cls: "cmn-todo-note" }, ["What you did, or what the queue should do next (optional). The next scheduled session reads it first."]));
    det.appendChild(note);
    det.appendChild(el("p", { cls: "cmn-todo-row" }, [go]));
    det.appendChild(status);
    go.addEventListener("click", function () {
      go.disabled = true;
      status.textContent = "Saving…";
      var Q = card.Q;
      postTodoDone(projectOf(card.key, Q), call, note.value).then(function (row) {
        var s = session();
        call.answer = { by: (row && row.by_email) || (s && s.email) || "", at: new Date().toISOString().slice(0, 10),
          words: "Marked done" + (note.value.trim() ? ": " + note.value.trim() : "."), todo: true };
        after();
      }, function (e) {
        go.disabled = false;
        status.textContent = e && (e.status === 401 || e.status === 403)
          ? "Not saved. Your account is not on the reviewer list, or the session expired; sign in again."
          : "Not saved: " + (e && e.message ? e.message : "the save failed") + ".";
      });
    });
    box.appendChild(det);
    return box;
  }
  function queueItem(i) {
    var name = (CARDS[i.ref] && CARDS[i.ref].name) || i.title || i.ref;
    return el("li", null, [el("span", { cls: "cmn-queue-ref", text: name + ": " }), count(i.n, i.open), " " + (i.words || "")]);
  }
  /* Each card's items in the order the work goes (Sam, 2026-11-04: "put the procedural things to act in a process order
     within their cards"): the subjects first, the key every M-ID is minted under, then the courses minted under them,
     the exhibits, their credit recommendations, and the programs those courses and credits count toward. Inside one
     reference the status file's order stands. */
  var PROCESS_ORDER = ["subjects", "course", "exhibit", "cr", "requirements"];
  function inProcessOrder(items) {
    function at(i) { var k = PROCESS_ORDER.indexOf(i.ref); return k < 0 ? PROCESS_ORDER.length : k; }
    return items.map(function (i, n) { return { i: i, n: n }; })
      .sort(function (a, b) { return at(a.i) - at(b.i) || a.n - b.n; }).map(function (x) { return x.i; });
  }
  function queueSection(q) {
    if (!q || !Array.isArray(q.reasons)) return null;
    var groups = q.reasons.slice();
    if (Array.isArray(q.unsorted) && q.unsorted.length) groups.push({ key: "unsorted", items: q.unsorted });
    var boxes = groups.map(function (g) {
      var w = REASONS[g.key] || { title: g.key, who: "" };
      var items = inProcessOrder(Array.isArray(g.items) ? g.items : []);
      return el("div", { cls: "cmn-reason", "data-reason": g.key }, [
        el("h4", { cls: "cmn-reason-h", text: w.title }),
        el("p", { cls: "cmn-reason-who", text: w.who }),
        items.length ? el("ol", { cls: "cmn-steps" }, items.map(queueItem)) : el("p", { cls: "cmn-quiet", text: "Nothing waits here." })
      ]);
    });
    var stalled = Array.isArray(q.stalled) ? q.stalled : [];
    if (stalled.length) {
      boxes.push(el("div", { cls: "cmn-reason", "data-reason": "stalled" }, [
        el("h4", { cls: "cmn-reason-h", text: REASONS.stalled.title }),
        el("p", { cls: "cmn-reason-who", text: REASONS.stalled.who }),
        el("ol", { cls: "cmn-steps" }, inProcessOrder(stalled).map(stalledItem))
      ]));
    }
    var carried = Array.isArray(q.carried) ? q.carried : [];
    /* Folded (#2921, the first view leads with one small batch): the pools stay one word away, never on the first screen. */
    var pooled = 0;
    groups.forEach(function (g) { (g.items || []).forEach(function (i) { if (typeof i.n === "number") pooled += i.n; }); });
    return el("section", { cls: "cmn-queue", "aria-labelledby": "cmn-queue-h" }, [
      el("h3", { id: "cmn-queue-h", cls: "cmn-band-h", text: "Waiting on a person" }),
      el("p", { cls: "cmn-sub", text: "A person sees an item only for one of four reasons, or when a routine stalls. The routines carry the rest. Each card lists its items in the order the work goes: subjects, then courses, exhibits, credit recommendations and programs." }),
      el("details", { cls: "cmn-fold" }, [
        el("summary", { cls: "cmn-fold-word", text: "Show the " + fmt(pooled) + " items in the pools" + (stalled.length ? ", " + fmt(stalled.length) + (stalled.length === 1 ? " stalled routine" : " stalled routines") : "") + (carried.length ? ", and what the routines carry" : "") }),
        el("div", { cls: "cmn-queue-grid" }, boxes),
        carried.length ? el("div", { cls: "cmn-carried" }, [el("h4", { cls: "cmn-reason-h", text: "The routines carry" }), el("ul", null, inProcessOrder(carried).map(queueItem))]) : null
      ].filter(Boolean))
    ]);
  }

  /* The confidence count (Sam, 2026-11-04, S573): what a person did with each procedure's work afterward. */
  var CONF_UNIT = { exhibit: "titles the procedures placed", subjects: "picks the nightly confirm settled", cr: "groups a rung 1 to 4 rule folded" };
  function procName(n) { n = String(n || "").replace(/-/g, " "); return n === "classifier" ? "the classifier" : n; }
  function confidenceSection(list) {
    if (!Array.isArray(list) || !list.length) return null;
    var fold = el("details", { cls: "cmn-fold", id: "cmn-conf-fold" }, [el("summary", { cls: "cmn-fold-word", text: "Show each procedure's count" })]);
    var kids = [
      el("h3", { id: "cmn-conf-h", cls: "cmn-band-h", text: "How far to trust the procedures" }),
      el("p", { cls: "cmn-sub", text: "A procedure earns trust by what a person does with its work afterward. A result a person keeps, or renames with its whole family, counts for it; a result a person moves elsewhere counts against it." })
    ];
    list.forEach(function (c) {
      var name = (CARDS[c.ref] && CARDS[c.ref].name) || c.ref;
      var head = el("h4", { cls: "cmn-reason-h", text: name + ": " + (CONF_UNIT[c.ref] || "results the procedures settled") });
      if (c.error || !c.total) { fold.appendChild(el("div", { cls: "cmn-conf-ref" }, [head, el("p", { cls: "cmn-unread", text: "Could not be read" })])); return; }
      var t = c.total;
      var wide = typeof t.widened === "number";   /* a count that separates a result a person widened (the CR rungs) */
      var line = t.looked
        ? "A person has looked at " + fmt(t.looked) + " of " + fmt(t.placed) + ": " + fmt(t.kept) + " kept, " + fmt(t.renamed) + " renamed with their family, " + fmt(t.moved) + " moved elsewhere."
          + (wide ? " " + fmt(t.widened) + " kept with wordings a person added, which the rule had left in another group." : "")
        : "No person has looked at any of the " + fmt(t.placed) + " yet.";
      var extra = [];
      if (t.by_procedure) extra.push(fmt(t.by_procedure) + " later revised by another procedure");
      if (t.left) extra.push(fmt(t.left) + " left the reference");
      var cols = ["Procedure", "Placed", "A person looked", "Kept"].concat(wide ? ["Kept, wordings added"] : [], ["Renamed with its family", "Moved elsewhere", "Not looked at yet"]);
      var table = el("table", { cls: "cmn-conf-table" }, [
        el("thead", null, [el("tr", null, cols.map(function (h) { return el("th", { scope: "col", text: h }); }))]),
        el("tbody", null, (c.procedures || []).map(function (p) {
          return el("tr", null, [el("th", { scope: "row", text: procName(p.name) })].concat(
            [p.placed, p.looked, p.kept].concat(wide ? [p.widened] : [], [p.renamed, p.moved, p.untouched]).map(function (n) { return el("td", { text: fmt(n || 0) }); })));
        }))
      ]);
      fold.appendChild(el("div", { cls: "cmn-conf-ref" }, [head, el("p", { cls: "cmn-conf-line", text: line + (extra.length ? " " + capFirst(extra.join("; ")) + "." : "") }),
        el("div", { cls: "cmn-conf-wrap", role: "region", tabindex: "0", "aria-label": name + ": each procedure's results" }, [table])]));
    });
    kids.push(fold);
    return el("section", { cls: "cmn-queue cmn-conf", id: "cmn-conf", "aria-labelledby": "cmn-conf-h" }, kids);
  }

  /* Your next batch (Sam's Commons rulings, 2026-11-08, #2921 items 1 and 2; COBIx's first-view mock): the page opens
     on one small batch a person can finish, with what the answers teach and when to stop. The batch is Another look
     in Exhibits, so Start opens that batch there (#exhibits/another-look/batch, the same six at most, then a stop) and
     nothing here duplicates its cards or its saves. */
  /* The ordered batches (COBIx on #2921, 2026-11-09, asks 1 to 3; #2963 step 1): Another look, then each decision a
     run log holds open, then the queue's jobs Sam carries (kb/_build_commons_status.py batches()). The first view
     shows the first one not done. Another look counts itself from the saves (the kb_curation keys its cards name,
     read the way exhibits.js reconcileSweep reads them), so deciding the last card closes it here without waiting
     for the night's build; a decision closes when its call is answered. When none is left the page says so. */
  var BATCH = { decided: {}, ruled: {}, pick: {}, note: {}, said: {}, busy: false, pin: null, data: null };
  function batchList(data) {
    if (data && Array.isArray(data.batches)) return data.batches.filter(function (b) { return b && !b.error && b.kind; });
    var nb = data && data.next_batch;
    if (nb && !nb.error && nb.n) return [nb];
    return null;
  }
  function batchKey(b) { return (b.kind || "") + "|" + (b.at || b.title || ""); }
  function batchDone(b, openTitles) {
    if (b.kind === "another-look") { var d = BATCH.decided[batchKey(b)]; return d != null && d >= b.n; }
    if (b.kind === "decision") return !openTitles[b.title];
    if (b.kind === "case") return !!BATCH.ruled[b.id];
    return false;
  }
  function batchHead(b) { return b.kind === "job" ? capFirst(fmt(b.n) + " " + (b.words || "")) : b.title; }
  function batchMeta(b) {
    if (b.kind === "another-look") {
      var d = BATCH.decided[batchKey(b)];
      return (d ? fmt(d) + " of " + fmt(b.n) + " decided. " : "") + fmt(b.n) + (b.n === 1 ? " card" : " cards")
        + " as of last night's sweep; Start counts again. " + (b.stop || "");
    }
    if (b.kind === "decision") return "One decision, on its sheet. " + (b.stop || "");
    return "In the " + (b.title || "reference") + ". Each ruling saves where you make it.";
  }
  function nextBatchSection(b, opts) {
    opts = opts || {};
    if (opts.unread) return el("section", { cls: "cmn-next", id: "cmn-next-sec", "aria-labelledby": "cmn-next-h" }, [
      el("div", { cls: "cmn-next-text" }, [
        el("p", { cls: "cmn-kicker", text: "Your next batch" }),
        el("h3", { id: "cmn-next-h", cls: "cmn-next-h", text: "Your next batch could not be read" }),
        el("p", { cls: "cmn-next-meta", text: "The Commons' status file carries no batch" + (opts.error ? " (" + opts.error + ")" : "") + ". The rest of the page reads as usual." })
      ])
    ]);
    var done = doneLine(opts.justDone);
    if (!b && !opts.empty) return null;
    var text = !b
      ? [el("p", { cls: "cmn-kicker", text: "Your next batch" }), done,
         el("h3", { id: "cmn-next-h", cls: "cmn-next-h", text: "Nothing waits on you in a batch" }),
         el("p", { cls: "cmn-next-meta", text: "Every batch is decided. The routines carry the rest, and the next build brings any new batch." })]
      : [el("p", { cls: "cmn-kicker", text: "Your next batch" }), done,
         el("h3", { id: "cmn-next-h", cls: "cmn-next-h", text: batchHead(b) }),
         b.teaches ? el("p", { cls: "cmn-next-teach", text: b.teaches }) : null,
         el("p", { cls: "cmn-next-meta", text: batchMeta(b) })];
    return el("section", { cls: "cmn-next", id: "cmn-next-sec", "aria-labelledby": "cmn-next-h", "data-kind": b ? b.kind : "none" }, [
      el("div", { cls: "cmn-next-text" }, text.filter(Boolean)),
      b && b.open ? openLink(b.open, "Start", "cmn-start") : null
    ].filter(Boolean));
  }
  /* The section for the list as it stands: the first batch not done, and a line for an Another look batch this
     visit's count closed. */
  function batchSection(data, openTitles) {
    BATCH.data = data;
    var list = batchList(data);
    if (list === null) {
      var err = data && ((data.next_batch && data.next_batch.error) || (data.batches && data.batches.error));
      return nextBatchSection(null, { unread: true, error: err || "" });
    }
    var next = null, justDone = null;
    /* An address naming a case (#commons/case/<id>) opens that case first, open or ruled. */
    var pinned = BATCH.pin ? list.filter(function (b) { return b.kind === "case" && b.id === BATCH.pin; })[0] : null;
    list.forEach(function (b) {
      if (next) return;
      if (batchDone(b, openTitles)) {
        if (b.kind === "another-look") justDone = { kind: "another-look", n: b.n };
        if (b.kind === "case" && BATCH.ruled[b.id] && BATCH.ruled[b.id].here) justDone = { kind: "case", b: b };
        return;
      }
      next = b;
    });
    if (pinned) next = pinned;
    if (next && next.kind === "case") {
      var c = caseOf(data, next.id);
      if (c) return caseSection(c, justDone);
    }
    return nextBatchSection(next, { justDone: justDone, empty: list.length > 0 || !!justDone });
  }
  function caseOf(data, id) {
    var d = data && Array.isArray(data.docket) ? data.docket : [];
    for (var i = 0; i < d.length; i++) if (d[i].id === id) return d[i];
    return null;
  }
  function choiceWords(c, v) {
    var ch = (c.choices || []).filter(function (x) { return x.value === v; })[0];
    return ch ? ch.words : v;
  }
  /* The line above the next batch: what the last one finished. */
  function doneLine(j) {
    if (!j) return null;
    var text = j.kind === "case"
      ? "Ruled: " + choiceWords(caseOf(BATCH.data, j.b.id) || {}, BATCH.ruled[j.b.id].choice) + ". The processor carries it out and files its receipt."
      : "Done: you decided " + fmt(j.n) + " of " + fmt(j.n) + (j.n === 1 ? " exhibit title" : " exhibit titles") + ". The nightly sweep learns from them tonight.";
    var line = el("p", { cls: "cmn-next-done", role: "status", text: text });
    return j.kind === "case" ? el("div", null, [line, processNow()]) : line;
  }
  /* "Process my rulings now" (#2963 step 3): the Docket's processor runs at 05:33 UTC; a reviewer who has ruled can run
     it at once. The page posts to the docket-process Edge Function with the reviewer's own session; the function checks
     the reviewer and dispatches docket-process.yml with a token the browser never holds. Signed out, there is no word. */
  var PROCESS = { said: "", busy: false };
  function processNow() {
    if (!reviewer()) return null;
    var b = el("button", { type: "button", cls: "cmn-word cmn-process", text: PROCESS.busy ? "Asking the processor…" : "Process my rulings now" });
    if (PROCESS.busy) b.setAttribute("disabled", "disabled");
    b.addEventListener("click", function () { runProcessor(); });
    return el("p", { cls: "cmn-process-row" }, [b, " ", el("span", { cls: "cmn-process-said", role: "status", "aria-live": "polite",
      text: PROCESS.said || "Otherwise the processor carries rulings out at 05:33 UTC." })]);
  }
  var FN_BASE = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/functions/v1";
  function runProcessor() {
    if (PROCESS.busy) return Promise.resolve();
    PROCESS.busy = true; PROCESS.said = ""; redrawBatch();
    var Sx = window.CPL_SESSION;
    var ready = Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
    return ready.then(function () {
      return fetch(FN_BASE + "/docket-process", { method: "POST", headers: sessionHeaders({ "Content-Type": "application/json" }), body: "{}" });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j || {} }; });
    }).then(function (x) {
      PROCESS.busy = false;
      PROCESS.said = x.status === 200 && x.j.ok
        ? (x.j.already ? "A run is already queued; it carries out every ruling saved before it starts." : "Queued. The processor runs within a few minutes, writes a receipt for each ruling and marks its case done.")
        : x.status === 401 ? "Not run: only a reviewer on the list can run the processor. Sign in again and try once more."
        : x.status === 503 ? "Not run: the processor's key is not set here. The 05:33 UTC run carries the rulings out."
        : "Not run: the processor answered " + x.status + ". The 05:33 UTC run carries the rulings out.";
      redrawBatch();
    }, function (e) {
      PROCESS.busy = false; PROCESS.said = "Not run: " + ((e && e.message) || "the network failed") + ". The 05:33 UTC run carries the rulings out."; redrawBatch();
    });
  }
  /* A Docket case, ruled in place (#2963 step 2): what it decides, the evidence and its links, the choices as words,
     a reason, and Save the ruling. The ruling saves to kb_curation (`_DOCKET::<id>`, field docket_ruling) under the
     reviewer's own name; signed out, the case reads and points at its sheet. Every case is shown to any signed-in
     reviewer, marked for its addressee, until the per-reviewer table of step 4. */
  function caseSection(c, justDone) {
    var R = BATCH.ruled[c.id], who = reviewer(), id = c.id;
    var kids = [el("p", { cls: "cmn-kicker", text: "Your next batch" + (c.addressee ? ", for " + capFirst(c.addressee) : "") }), doneLine(justDone),
      el("h3", { id: "cmn-next-h", cls: "cmn-next-h", text: c.decides }),
      (c.evidence || [])[0] ? el("p", { cls: "cmn-next-teach", text: c.evidence[0] }) : null];
    var more = (c.evidence || []).slice(1), links = c.links || [];
    if (more.length || links.length) {
      kids.push(el("details", { cls: "cmn-case-ev" }, [el("summary", { cls: "cmn-word", text: "The evidence" })]
        .concat(more.map(function (t) { return el("p", { text: t }); }))
        .concat(links.length ? [el("ul", { cls: "cmn-case-links" }, links.map(function (l) { return el("li", null, [openLink(l.href, l.text)]); }))] : [])));
    }
    kids.push(el("p", { cls: "cmn-next-meta", text: (c.size && c.size.n ? fmt(c.size.n) + " " + (c.size.unit || "items") + ". " : "")
      + "On no ruling: " + (c.no_reply || "nothing changes.") }));
    if (R) {
      kids.push(el("p", { cls: "cmn-case-ruled", role: "status", text: "Ruled: " + choiceWords(c, R.choice) + (R.at ? " on " + String(R.at).slice(0, 10) : "")
        + ". The processor carries it out and files its receipt." }), processNow());
      return el("section", { cls: "cmn-next cmn-case", id: "cmn-next-sec", "aria-labelledby": "cmn-next-h", "data-kind": "case", "data-case": id },
        [el("div", { cls: "cmn-next-text" }, kids.filter(Boolean))]);
    }
    if (!who) {
      kids.push(el("p", { cls: "cmn-next-meta" }, ["Sign in as a reviewer to rule here, or answer on ",
        c.sheet ? openLink(c.sheet, "its decision sheet") : "its decision sheet", "."]));
      return el("section", { cls: "cmn-next cmn-case", id: "cmn-next-sec", "aria-labelledby": "cmn-next-h", "data-kind": "case", "data-case": id },
        [el("div", { cls: "cmn-next-text" }, kids.filter(Boolean))]);
    }
    var pick = BATCH.pick[id];
    var group = el("div", { cls: "cmn-case-choices", role: "group", "aria-label": "Your ruling" }, (c.choices || []).map(function (ch) {
      var b = el("button", { type: "button", cls: "cmn-word cmn-case-choice", "aria-pressed": pick === ch.value ? "true" : "false",
        "data-value": ch.value, text: ch.words + (ch.recommended ? " (recommended)" : "") });
      b.addEventListener("click", function () { BATCH.pick[id] = ch.value; BATCH.said[id] = ""; redrawBatch(); });
      return b;
    }));
    var plan = pick && c.plan_words && c.plan_words[pick] ? el("p", { cls: "cmn-next-meta", text: c.plan_words[pick] }) : null;
    var note = el("textarea", { id: "cmn-case-note", cls: "cmn-case-note", rows: "2" });
    note.value = BATCH.note[id] || "";
    note.addEventListener("input", function () { BATCH.note[id] = note.value; });
    var save = el("button", { type: "button", cls: "cmn-word cmn-case-save", text: BATCH.busy ? "Saving…" : "Save the ruling" });
    if (!pick || BATCH.busy) save.setAttribute("disabled", "disabled");
    save.addEventListener("click", function () { saveRuling(c); });
    kids.push(group, plan, el("label", { "for": "cmn-case-note", cls: "cmn-case-lbl", text: "Your reason, if any" }), note,
      el("div", { cls: "cmn-case-acts" }, [save, c.sheet ? openLink(c.sheet, "Its decision sheet") : null].filter(Boolean)),
      el("p", { cls: "cmn-case-said", role: "status", "aria-live": "polite", text: BATCH.said[id] || "" }));
    return el("section", { cls: "cmn-next cmn-case", id: "cmn-next-sec", "aria-labelledby": "cmn-next-h", "data-kind": "case", "data-case": id },
      [el("div", { cls: "cmn-next-text" }, kids.filter(Boolean))]);
  }
  var lastOpenTitles = {};
  function redrawBatch() {
    var old = document.getElementById("cmn-next-sec"), fresh = batchSection(BATCH.data, lastOpenTitles);
    if (old && fresh) old.parentNode.replaceChild(fresh, old);
    else if (old) old.parentNode.removeChild(old);
  }
  var RULING_PREFIX = "_DOCKET::", RULING_FIELD = "docket_ruling";
  function saveRuling(c) {
    var choice = BATCH.pick[c.id];
    if (!choice || BATCH.busy) return Promise.resolve();
    BATCH.busy = true; BATCH.said[c.id] = "Saving…"; redrawBatch();
    var Sx = window.CPL_SESSION;
    var ready = Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
    return ready.then(function () {
      var s = reviewer();
      if (!s || !s.email) { var e = new Error("your sign-in has ended; sign in again, then save"); throw e; }
      var value = JSON.stringify({ "case": c.id, choice: choice, note: String(BATCH.note[c.id] || "").trim() });
      return fetch(REST + "/kb_curation?on_conflict=course_id,field", { method: "POST",
        headers: sessionHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ course_id: RULING_PREFIX + c.id, field: RULING_FIELD, value: value, reviewer_email: s.email }) });
    }).then(function (r) {
      BATCH.busy = false;
      if (!r.ok) { BATCH.said[c.id] = "Not saved: the server answered " + r.status + ". Only a reviewer on the list may rule."; redrawBatch(); return; }
      BATCH.ruled[c.id] = { choice: choice, at: new Date().toISOString(), here: true };
      if (BATCH.pin === c.id) BATCH.pin = null;
      redrawBatch();
    }, function (e) {
      BATCH.busy = false; BATCH.said[c.id] = "Not saved: " + ((e && e.message) || "the network failed") + "."; redrawBatch();
    });
  }
  /* The rulings already saved, read with no email asked for (anon reads every column but reviewer_email). */
  function readRulings() {
    var h = sessionHeaders({ "Range-Unit": "items", "Range": "0-999" });
    if (!h || !h.apikey) return Promise.resolve();
    return fetch(REST + "/kb_curation?select=course_id,value,reviewed_at&field=eq." + RULING_FIELD + "&course_id=like."
      + encodeURIComponent(RULING_PREFIX) + "*", { headers: h })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          var v; try { v = JSON.parse(row.value); } catch (e) { return; }
          var id = String(row.course_id || "").slice(RULING_PREFIX.length);
          if (v && v.choice && !(BATCH.ruled[id] && BATCH.ruled[id].here)) BATCH.ruled[id] = { choice: v.choice, at: row.reviewed_at };
        });
      }, function () { /* the cases stay open */ });
  }
  /* How many of an Another look batch's cards are decided: the saves written since the sweep was built (a keep, or
     a fold off the card's current title), and any this visit's Exhibits marked. Null when nothing can be read. */
  function countDecided(b) {
    var cards = Array.isArray(b.cards) ? b.cards : [];
    if (!cards.length) return Promise.resolve(null);
    var X = window.CPL_EXHIBITS, seen = X && X._state && X._state.sw && X._state.sw.done || {};
    var decided = {}, byKey = {};
    cards.forEach(function (c) {
      if (c.id && seen[c.id]) decided[c.id] = true;
      (c.keys || []).forEach(function (k) { byKey[k] = c; });
    });
    var keys = Object.keys(byKey), h = sessionHeaders({ "Range-Unit": "items", "Range": "0-999" });
    var count = function () { return Object.keys(decided).length; };
    if (!keys.length || !b.at || !h || !h.apikey) return Promise.resolve(Object.keys(seen).length ? count() : null);
    var quoted = keys.map(function (k) { return encodeURIComponent('"' + k.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'); });
    var url = REST + "/kb_curation?select=course_id,field,value,reviewed_at&field=in.(title_sweep_kept,unified_title_supersedes)"
      + "&reviewed_at=gt." + encodeURIComponent(b.at) + "&course_id=in.(" + quoted.join(",") + ")";
    return fetch(url, { headers: h }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          var c = byKey[row.course_id];
          if (c && (row.field === "title_sweep_kept" || (row.field === "unified_title_supersedes" && row.value === c.current))) decided[c.id] = true;
        });
        return count();
      }, function () { return Object.keys(seen).length ? count() : null; });
  }
  /* Count every Another look batch, then redraw the section in place. Runs after the page draws and on each visit. */
  var batchRefresh = null;
  function refreshBatches(data, openTitles) {
    var list = batchList(data) || [];
    lastOpenTitles = openTitles; BATCH.data = data;
    var counts = list.filter(function (b) { return b.kind === "another-look"; }).map(function (b) {
      return countDecided(b).then(function (n) { if (n != null) BATCH.decided[batchKey(b)] = n; });
    });
    if (list.some(function (b) { return b.kind === "case"; })) counts.push(readRulings());
    return Promise.all(counts).then(redrawBatch);
  }
  /* The learning line: what people did with the procedures' work, from the confidence count, with the table one
     word away. It reports what people saw, never that the unchecked results are right. */
  function learningLine(list) {
    var ex = Array.isArray(list) ? list.filter(function (c) { return c.ref === "exhibit" && c.total; })[0] : null;
    if (!ex) return null;
    var t = ex.total;
    var word = el("button", { cls: "cmn-word", type: "button", text: "How far to trust the procedures" });
    word.addEventListener("click", function () {
      var f = document.getElementById("cmn-conf-fold"), sec = document.getElementById("cmn-conf");
      if (f) f.open = true;
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: "start" });
    });
    return el("p", { cls: "cmn-learn" }, [
      "The procedures placed ", el("strong", { text: fmt(t.placed) }), " exhibit titles. A person checked ", el("strong", { text: fmt(t.looked) }),
      " and moved ", el("strong", { text: fmt(t.moved) }), " elsewhere. The rest are unchecked, not proven. ", word
    ]);
  }

  /* The first view's filter word (All, Needs you, Building): it lasts the visit and is never stored. An address
     names it (#commons/needs, #commons/build); the bare #commons is All. */
  var SHOWS = ["all", "needs", "build"];
  var show = "all";
  var redraw = null;
  /* The view a sign-in link returns to (cpl_session.js viewAddress); the address arrival() below opens. */
  if (window.CPL_SESSION && CPL_SESSION.viewAddress) CPL_SESSION.viewAddress("commons", function () {
    if (ASE.on) return window.CPL_COMMONS_ASE ? CPL_COMMONS_ASE.address() : "commons/ase";
    if (BATCH.pin) return "commons/case/" + BATCH.pin;
    return show === "all" ? "commons" : "commons/" + show;
  });
  /* Opens the filter word the address names; anything unknown leaves the view as it is. */
  /* An arrival is read on a visit: the first, one after another tab, or a new address. The header's unlock
     re-fires cpl-tab-activated for the open tab; that is no visit, so a view switched to since stays. */
  var away = true, seenHash = null;
  /* The first slice of the Commons plan (#3111, the v2 Agreed final): ASE, where a certification can count at every
     college. #commons/ase and #commons/ase/<title> open it; commons_ase.js draws it, read-only. */
  var ASE = { on: false, title: "" };
  function showAse(root) {
    function go() {
      if (!window.CPL_COMMONS_ASE) { notice(root, "The ASE slice (commons_ase.js) could not be loaded. Reload the tab to try again."); return null; }
      return CPL_COMMONS_ASE.boot(root, ASE.title, { noted: function (h) { seenHash = h; } });
    }
    if (window.CPL_COMMONS_ASE || !(window.CPL_TABS && CPL_TABS.loadScript)) return Promise.resolve(go());
    return new Promise(function (res) { CPL_TABS.loadScript("commons_ase.js", "CPL_COMMONS_ASE", function () { res(go()); }); });
  }
  window.addEventListener("cpl-tab-activated", function (e) { if (e && e.detail && e.detail.tab !== "commons") away = true; });
  function arrive() {
    var h = String(location.hash || ""), visit = away || h !== seenHash;
    away = false; seenHash = h;
    if (!visit) return false;
    var a = window.CPL_SESSION && CPL_SESSION.arrival ? CPL_SESSION.arrival("commons") : null;
    ASE.on = !!(a && a[0] === "ase");
    if (ASE.on) { ASE.title = a.slice(1).join("/"); return true; }
    if (a && a[0] === "case" && a[1]) { BATCH.pin = a.slice(1).join("/"); return true; }
    if (a && SHOWS.indexOf(a[0]) >= 0) { show = a[0]; return true; }
    return false;
  }
  /* The keeper announces a renewed or new sign-in (cpl_session.js): read again, so the done marks behind the reviewer
     sign-in reach the band without a reload (Sam, 2026-11-06: the lapsed-token fix "must not have worked for all
     surfaces"). Only once the tab has drawn. */
  var reboot = null;
  window.addEventListener("cpl-session-changed", function () {
    if ((!redraw && !ASE.on) || reboot || !document.getElementById(ROOT_ID)) return;
    reboot = Promise.resolve(boot()).then(function () { reboot = null; }, function () { reboot = null; });
  });
  /* boot() runs once; a later visit on an address that names a filter word redraws the cards on it. */
  window.addEventListener("cpl-tab-activated", function (e) {
    if (!(e && e.detail && e.detail.tab === "commons")) return;
    var wasAse = ASE.on, root = document.getElementById(ROOT_ID);
    var named = arrive();
    if (ASE.on) { if (named) showAse(root); return; }
    if (wasAse) { boot(); return; }
    if (named && redraw) redraw();
    /* each visit counts the batch again, so one finished in Exhibits reads done on the way back (#2963 step 1) */
    if (batchRefresh) batchRefresh();
  });

  function render(root, data, S, now) {
    now = now || new Date();
    root.removeAttribute("style");
    root.textContent = "";
    var rows = data && Array.isArray(data.rows) ? data.rows : [];
    var building = data && Array.isArray(data.building) ? data.building : [];
    var cards = sortCards(rows.map(function (r) { return cardModel(r, S, false); })
      .concat(building.map(function (r) { return cardModel(r, S, true); })));
    var page = el("div", { cls: "cmn-page" });
    var wrap = el("div", { cls: "cmn-wrap" });
    page.appendChild(wrap);

    /* the header */
    var detailsBtn = el("button", { cls: "cmn-word", type: "button", id: "cmn-details-word", "aria-expanded": "false", "aria-controls": "cmn-details", text: "Details" });
    wrap.appendChild(el("header", { cls: "cmn-top" }, [
      el("div", { cls: "cmn-top-row" }, [el("h2", { cls: "cmn-title", text: TITLE }), detailsBtn]),
      el("div", { cls: "cmn-rule", "aria-hidden": "true" }),
      el("p", { cls: "cmn-lede", text: countWords(cards.length).replace(/^./, function (ch) { return ch.toUpperCase(); }) + " common references the California Community Colleges keep together for credit for prior learning." }),
      el("p", { cls: "cmn-sub" }, ["Each college keeps its own catalog. The Commons gives every college one shared name to point to and shows how its own version lines up with it. ",
        el("span", { cls: "cmn-note", text: data && data.written_at ? "Figures read " + stampOf(data.written_at) + "." : "" })]),
      el("p", { cls: "cmn-sub", id: "cmn-ase-line" }, ["The first slice a student sees: ", el("a", { href: "#commons/ase", text: "where an ASE certification can count" }), ", at every college."])
    ]));

    /* the decisions waiting on Sam: the band below lists them, and a decision batch closes once its call is answered */
    var waiting = [], openTitles = {};
    cards.forEach(function (c) { c.open.forEach(function (call) { waiting.push({ card: c, call: call }); if (call.title) openTitles[call.title] = true; }); });

    /* the one small batch, then what people did with the procedures' work */
    lastOpenTitles = openTitles;
    var batch = batchSection(data, openTitles);
    if (batch) wrap.appendChild(batch);
    batchRefresh = function () { return refreshBatches(data, openTitles); };
    var learn = learningLine(data && data.confidence);
    if (learn) wrap.appendChild(learn);

    /* the decisions waiting on Sam, next */
    if (waiting.length) {
      wrap.appendChild(el("section", { cls: "cmn-band", "aria-labelledby": "cmn-band-h" }, [
        el("h3", { id: "cmn-band-h", cls: "cmn-band-h", text: waiting.length === 1 ? "One decision waits on you" : capFirst(countWords(waiting.length)) + " decisions wait on you" }),
        el("ul", { cls: "cmn-band-list" }, waiting.map(function (w) {
          var li = el("li", null, [w.card.name + ": ", callNode(w.call)]);
          if (w.call.todo_id) li.appendChild(todoControl(w.card, w.call, function () { render(root, data, S, now); }));
          return li;
        }))
      ]));
    }

    /* the one queue: what waits on a person, by reason, and what the routines carry */
    var queue = queueSection(data && data.queue);
    if (queue) wrap.appendChild(queue);
    var conf = confidenceSection(data && data.confidence);
    if (conf) wrap.appendChild(conf);

    /* the filter words: the visit's, never remembered (show lives at module scope, read from the address) */
    var grid = el("div", { cls: "cmn-grid", id: "cmn-cards" });
    var filterBtns = [["all", "All " + countWords(cards.length)], ["needs", "Needs you"], ["build", "Building"]].map(function (f) {
      var b = el("button", { cls: "cmn-word cmn-filter", type: "button", "data-show": f[0], "aria-pressed": f[0] === show ? "true" : "false", text: f[1] });
      return b;
    });
    var filterRow = el("div", { cls: "cmn-filter-row" }, [
      el("div", { cls: "cmn-filters", role: "group", "aria-label": "Show" }, [el("span", { cls: "cmn-filter-label", text: "Show" })].concat(filterBtns)),
      el("p", { cls: "cmn-sort-note", text: "Your decisions first, then by how far along" })
    ]);
    wrap.appendChild(filterRow);
    wrap.appendChild(grid);

    /* the details: the rows, one word away */
    var details = el("section", { cls: "cmn-details", id: "cmn-details", "aria-label": "Details: the rows, their known issues, settled procedures, Decision Sheet Library and last run" });
    details.hidden = true;
    var list = renderRows(details, data, S, now);
    function openDetails(key) {
      details.hidden = false;
      detailsBtn.setAttribute("aria-expanded", "true");
      detailsBtn.textContent = "Hide details";
      if (key) {
        var li = list.querySelector('.cmn-ref[data-key="' + key + '"]');
        if (li) {
          if (li.classList.contains("cmn-collapsed")) { setFold(li, false); keep(FOLD_KEY, folded(list)); }
          var h = li.querySelector("h3");
          if (h) { if (h.scrollIntoView) h.scrollIntoView({ block: "start" }); h.focus(); }
        }
      }
    }
    function closeDetails() {
      details.hidden = true;
      detailsBtn.setAttribute("aria-expanded", "false");
      detailsBtn.textContent = "Details";
    }
    detailsBtn.addEventListener("click", function () { if (details.hidden) openDetails(null); else closeDetails(); });

    function draw() {
      grid.textContent = "";
      cards.filter(function (c) { return show === "all" || c.kind === show; })
        .forEach(function (c) { grid.appendChild(cardNode(c, openDetails)); });
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-show") === show ? "true" : "false"); });
      if (!grid.children.length) grid.appendChild(el("p", { cls: "cmn-quiet cmn-empty", text: show === "needs" ? "Nothing waits on you." : "Nothing is being built." }));
    }
    filterBtns.forEach(function (b) { b.addEventListener("click", function () { show = b.getAttribute("data-show"); draw(); }); });
    redraw = draw;
    draw();

    /* the foot */
    var record = el("button", { cls: "cmn-word", type: "button", id: "cmn-record-word", text: "Read the decision record" });
    record.addEventListener("click", function () { openDetails(null); });
    wrap.appendChild(el("footer", { cls: "cmn-foot" }, [
      el("span", { text: "Every common reference is staging until faculty publish it." }),
      el("span", null, ["Settled decisions stay on file. ", record])
    ]));
    wrap.appendChild(details);
    root.appendChild(page);
    return list;
  }

  function notice(root, text) {
    root.removeAttribute("style");
    root.textContent = "";
    root.appendChild(el("div", { cls: "cmn-page" }, [el("div", { cls: "cmn-wrap" }, [el("h2", { cls: "cmn-title", text: TITLE }), el("p", { cls: "cmn-notice", text: text })])]));
  }

  /* ── reads ── */
  function readJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    });
  }
  function readStatus(url) {
    var p = P();
    return p && p.readStatus ? p.readStatus(url) : readJson(url).then(function (j) {
      if (!j || !j.written_at) throw new Error(url + " names no written_at");
      return j;
    });
  }
  /* ── a to-do closes here too (Sam, 2026-11-02: "There is one decision in the queue that doesn't give me a way to
        close it, just links to review."). A run-log call carrying `todo_id` is a to-do Sam marks done
        (program_requirements.js callDone, S527). The Commons read only the run logs, so a to-do he had marked done
        on Program Requirements still read as waiting here, and the band offered a link and nothing else. For a
        signed-in reviewer it now reads the marks (queue_todo_done, authenticated read) and a standing mark answers its
        call with his words; an open to-do offers Mark done in the band, through the same one RPC
        (rpc/queue_todo_done_add, chatbox/supabase_queue_todo_done.sql), which the scheduled session reads first. ── */
  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  function session() {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.get !== "function") return null;
    var s = Sx.get();
    return s && s.email && (typeof Sx.isFresh !== "function" || Sx.isFresh(s)) ? s : null;
  }
  /* A reviewer who can save: a fresh session, or one whose token lapsed and can renew (the save renews it first).
     The header reads Signed in through the hour a token lasts and after it; the card had read a lapsed token as signed
     out and offered only the sign-in line (Sam's recording, 2026-11-06). */
  function reviewer() {
    var Sx = window.CPL_SESSION;
    if (!Sx || typeof Sx.get !== "function") return null;
    var s = Sx.get();
    return s && s.email && ((typeof Sx.isFresh !== "function" || Sx.isFresh(s)) || s.refresh_token) ? s : null;
  }
  function sessionHeaders(extra) {
    var Sx = window.CPL_SESSION;
    return Sx && typeof Sx.authHeaders === "function" ? Sx.authHeaders(extra) : (extra || {});
  }
  function projectOf(key, Q) { return (Q && Q.project) || key; }
  /* The marks read behind a reviewer sign-in (queue_todo_done_reviewer_read). A lapsed token renews first: the card had
     read a lapsed token as signed out, so Sam's Monterey mark (saved on CPL Pathways, 19:29Z 2026-11-06) never reached
     the band and the call kept waiting. */
  function readTodoMarks() {
    if (!reviewer()) return Promise.resolve(null);
    var Sx = window.CPL_SESSION;
    var ready = Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
    return ready.then(function () {
      return fetch(REST + "/queue_todo_done?select=project,todo_id,note,reopen,by_email,at&order=id.desc", { headers: sessionHeaders() });
    }).then(function (r) { return r && r.ok ? r.json() : null; }, function () { return null; });
  }
  /* The newest mark on each to-do wins; a done one answers its call (by, at, words), a reopen leaves it open. */
  function applyTodoMarks(S, marks) {
    if (!Array.isArray(marks)) return;
    var latest = {};
    marks.forEach(function (m) { var k = m.project + "|" + m.todo_id; if (!(k in latest)) latest[k] = m; });
    Object.keys(S).forEach(function (key) {
      var Q = S[key] && S[key].Q;
      (Q && Array.isArray(Q.calls) ? Q.calls : []).forEach(function (c) {
        if (!c.todo_id || answered(c)) return;
        var m = latest[projectOf(key, Q) + "|" + c.todo_id];
        if (m && !m.reopen) c.answer = { by: m.by_email || "", at: String(m.at || "").slice(0, 10),
          words: "Marked done" + (m.note ? ": " + String(m.note).trim() : "."), todo: true };
      });
    });
  }
  function postTodoDone(project, c, note) {
    var Sx = window.CPL_SESSION;
    var ready = Sx && typeof Sx.ensureFresh === "function" ? Promise.resolve(Sx.ensureFresh()) : Promise.resolve(null);
    return ready.then(function () {
      return fetch(REST + "/rpc/queue_todo_done_add", { method: "POST", headers: sessionHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ p_project: project, p_todo_id: c.todo_id, p_note: note || null, p_reopen: false }) });
    }).then(function (r) {
      if (r.ok) return r.json().catch(function () { return {}; });
      var e = new Error("the save answered " + r.status); e.status = r.status; throw e;
    });
  }
  function load() {
    return readJson(STATUS_URL).then(function (data) {
      if (!data || !Array.isArray(data.rows) || !data.written_at) throw new Error(STATUS_URL + " is not the Commons' status file");
      var rows = data.rows.concat(Array.isArray(data.building) ? data.building : []);
      return Promise.all(rows.map(function (r) {
        if (!r.status_file) return { Q: null, error: null };
        return readStatus(r.status_file).then(function (Q) { return { Q: Q, error: null }; },
          function (e) { return { Q: null, error: e && e.message ? e.message : String(e) }; });
      })).then(function (st) {
        var S = {};
        rows.forEach(function (r, i) { S[r.key] = st[i]; });
        return readTodoMarks().then(function (marks) { applyTodoMarks(S, marks); return { data: data, S: S }; });
      });
    });
  }

  function boot() {
    ensureCss();
    var root = document.getElementById(ROOT_ID);
    if (!root) return null;
    if (!P()) {
      notice(root, "The Commons' shared module (commons_progress.js) could not be loaded. Reload the tab to try again.");
      return null;
    }
    root.textContent = "Reading the Commons…";
    arrive();
    if (ASE.on) return showAse(root);
    return load().then(function (r) {
      render(root, r.data, r.S, new Date());
      return Promise.resolve(batchRefresh && batchRefresh()).then(function () { return r; }, function () { return r; });
    }, function (e) {
      notice(root, "The Commons' figures could not be read (" + (e && e.message ? e.message : e) + "). Reload the tab to try again.");
      return null;
    });
  }

  /* ── the look: Malone's CPL/AI look, the one COBI tab in it (Sam, Open Asks Sheet 158 card 2, 2026-11-02).
        Every rule below uses a --cmn token; the tokens themselves are defined once in TOKENS, the light values
        Malone's and the dark ones mapped onto First Light's dark roles, so dark mode invents no color. ── */
  var CSS = [
    // The full width (Sam, 2026-11-01: "Make Catalog Commons use full width as well"): the tab drops COBI's 1400px
    // main column and its own 1080px cap, as the Lists do.
    "#tab-commons .main-container { max-width:none; padding-left:16px; padding-right:16px; }",
    ".cmn-page { font-family:var(--cmn-sans); color:var(--cmn-ink); background:linear-gradient(180deg, var(--cmn-surface) 0, var(--cmn-page) 26rem, var(--cmn-page-end) 100%); margin:0 -16px; padding:32px clamp(16px, 4vw, 48px) 48px; font-size:16px; line-height:1.55; }",
    ".cmn-wrap { display:grid; gap:24px; max-width:1240px; margin:0 auto; }",
    ".cmn-top { display:grid; gap:0; }",
    ".cmn-top-row { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:8px 24px; }",
    ".cmn-title { margin:0; font-family:var(--cmn-serif); font-weight:700; color:var(--cmn-title); font-size:clamp(2rem, 1.5rem + 1.8vw, 3rem); line-height:1; letter-spacing:-0.03em; }",
    ".cmn-rule { width:66px; height:4px; background:var(--cmn-gold); margin:16px 0 14px; }",
    ".cmn-lede { margin:0; color:var(--cmn-ink-2); font-size:1.1rem; }",
    ".cmn-sub { margin:6px 0 0; color:var(--cmn-muted); font-size:.95rem; max-width:var(--cpl-measure,none); }",
    ".cmn-sub .cmn-note { font-variant-numeric:tabular-nums; }",
    ".cmn-band { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-top:4px solid var(--cmn-gold); border-radius:12px; padding:18px 22px; display:grid; gap:10px; }",
    ".cmn-band-h { margin:0; font-family:var(--cmn-serif); font-size:1.2rem; color:var(--cmn-heading); }",
    ".cmn-band-list { margin:0; padding-left:20px; display:grid; gap:6px; }",
    ".cmn-todo { margin:4px 0 2px; }",
    ".cmn-todo-det > summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; min-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; }",
    ".cmn-todo-det > summary:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:3px; }",
    ".cmn-todo-det > summary::-webkit-details-marker { display:none; }",
    ".cmn-todo-note { margin:4px 0; color:var(--cmn-muted); font-size:.88rem; }",
    ".cmn-todo-text { display:block; width:100%; max-width:40rem; box-sizing:border-box; font:inherit; font-size:.92rem; padding:6px 8px; border:1px solid var(--cmn-line); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cmn-todo-row { margin:6px 0 0; }",
    ".cmn-filter-row { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:10px 20px; }",
    ".cmn-filters { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 18px; }",
    ".cmn-filter-label, .cmn-sort-note { color:var(--cmn-muted); font-size:.9rem; margin:0; }",
    "button.cmn-filter[aria-pressed=\"true\"] { color:var(--cmn-heading); font-weight:700; text-decoration-thickness:3px; }",
    ".cmn-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; }",
    ".cmn-queue { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:18px 22px; display:grid; gap:12px; }",
    ".cmn-queue-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }",
    ".cmn-reason { border:1px solid var(--cmn-line-soft); border-radius:10px; padding:12px 14px; display:grid; gap:6px; align-content:start; min-width:0; }",
    ".cmn-reason-h { margin:0; font-size:.98rem; font-weight:700; color:var(--cmn-heading); }",
    ".cmn-reason-who { margin:0; color:var(--cmn-muted); font-size:.88rem; }",
    ".cmn-reason ul, .cmn-reason ol, .cmn-carried ul { margin:0; padding-left:22px; display:grid; gap:4px; font-size:.92rem; font-variant-numeric:tabular-nums; }",
    ".cmn-reason a, .cmn-carried a { display:inline-block; min-height:24px; line-height:24px; font-weight:700; }",
    ".cmn-queue-ref { color:var(--cmn-ink-2); font-weight:600; }",
    ".cmn-carried { border-top:1px solid var(--cmn-line-soft); padding-top:10px; display:grid; gap:6px; }",
    ".cmn-conf-ref { display:grid; gap:6px; min-width:0; }",
    ".cmn-conf-line { margin:0; color:var(--cmn-ink-2); font-size:.93rem; font-variant-numeric:tabular-nums; }",
    ".cmn-conf-wrap { overflow-x:auto; border:1px solid var(--cmn-line-soft); border-radius:10px; }",
    ".cmn-conf-table { width:100%; border-collapse:collapse; font-size:.9rem; font-variant-numeric:tabular-nums; }",
    ".cmn-conf-table th, .cmn-conf-table td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--cmn-line-soft); color:var(--cmn-ink); }",
    ".cmn-conf-table thead th { font-size:.75rem; letter-spacing:.04em; text-transform:uppercase; color:var(--cmn-muted); font-weight:700; }",
    ".cmn-conf-table tbody th { font-weight:600; }",
    ".cmn-conf-wrap:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cmn-card { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:20px 22px; display:flex; flex-direction:column; gap:12px; min-width:0; }",
    ".cmn-card-needs { border-top:4px solid var(--cmn-gold); }",
    ".cmn-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }",
    ".cmn-card-name { margin:0; font-family:var(--cmn-serif); font-size:1.3rem; line-height:1.2; color:var(--cmn-heading); }",
    ".cmn-card-name a { color:inherit; display:inline-block; min-height:24px; }",
    // WCAG 2.2 target size: a link in a card's name or its words row is at least 24px tall (the a11y pass, S552).
    ".cmn-card-links a, .cmn-acts a, .cmn-band-list a, .cmn-card-ask a { display:inline-block; min-height:24px; line-height:24px; }",
    ".cmn-pill { display:inline-block; white-space:nowrap; padding:3px 10px; border-radius:999px; background:var(--cmn-pill-bg); color:var(--cmn-pill-fg); font-size:.78rem; font-weight:700; }",
    ".cmn-pill-needs { background:var(--cmn-ask-bg); color:var(--cmn-ask-fg); }",
    ".cmn-pill-done { background:var(--cmn-done-bg); color:var(--cmn-done-fg); }",
    ".cmn-next { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-left:4px solid var(--cmn-accent); border-radius:12px; padding:18px 22px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px 24px; }",
    ".cmn-next-text { flex:1 1 320px; display:grid; gap:4px; }",
    ".cmn-kicker { margin:0; font-size:.78rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".cmn-next-h { margin:0; font-family:var(--cmn-serif); font-size:clamp(1.3rem, 1.1rem + 1vw, 1.7rem); color:var(--cmn-heading); }",
    ".cmn-next-teach, .cmn-next-meta { margin:0; color:var(--cmn-ink-2); }",
    ".cmn-next-meta { color:var(--cmn-muted); font-size:.92rem; }",
    ".cmn-next-done { margin:0 0 4px; color:var(--cmn-ink); font-weight:600; }",
    ".cmn-case-ev > summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; min-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; }",
    ".cmn-case-ev > summary::-webkit-details-marker { display:none; }",
    ".cmn-case-ev p, .cmn-case-links { margin:6px 0 0; color:var(--cmn-ink-2); }",
    ".cmn-case-links a { display:inline-block; min-height:24px; line-height:24px; color:var(--cmn-link); }",
    ".cmn-case-choices { display:flex; flex-wrap:wrap; gap:6px 18px; margin-top:8px; }",
    ".cmn-case-choice[aria-pressed=\"true\"] { font-weight:700; color:var(--cmn-heading); text-decoration-thickness:2px; }",
    ".cmn-case-lbl { display:block; margin-top:8px; color:var(--cmn-ink-2); font-size:.92rem; }",
    ".cmn-case-note { width:100%; max-width:var(--cpl-measure,none); box-sizing:border-box; font:inherit; padding:6px 8px; border:1px solid var(--cmn-line); border-radius:8px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cmn-case-acts { display:flex; flex-wrap:wrap; gap:6px 18px; align-items:center; margin-top:6px; }",
    ".cmn-case-acts a { color:var(--cmn-link); min-height:24px; line-height:24px; display:inline-block; }",
    ".cmn-case-save[disabled] { color:var(--cmn-muted); cursor:not-allowed; }",
    ".cmn-case-said, .cmn-case-ruled { margin:4px 0 0; color:var(--cmn-ink); min-height:1em; }",
    ".cmn-process-row { margin:4px 0 0; color:var(--cmn-ink-2); font-size:.92rem; }",
    ".cmn-process[disabled] { color:var(--cmn-muted); cursor:not-allowed; }",
    ".cmn-start { color:var(--cmn-link); font-weight:700; font-size:1.1rem; text-decoration:underline; text-underline-offset:3px; display:inline-block; min-height:24px; line-height:24px; }",
    ".cmn-learn { margin:0; color:var(--cmn-ink-2); }",
    ".cmn-learn strong { color:var(--cmn-heading); }",
    ".cmn-fold > summary { list-style:none; }",
    ".cmn-fold > summary::-webkit-details-marker { display:none; }",
    ".cmn-fold > summary { cursor:pointer; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; line-height:24px; }",
    ".cmn-fold[open] > summary { margin-bottom:12px; }",
    ".cmn-card-what { margin:0; color:var(--cmn-muted); font-size:.92rem; line-height:1.45; }",
    ".cmn-card-also { margin:0; color:var(--cmn-ink-2); font-size:.92rem; font-variant-numeric:tabular-nums; }",
    ".cmn-card-figure { display:grid; gap:6px; }",
    ".cmn-card-n { margin:0; font-size:.95rem; color:var(--cmn-ink-2); font-variant-numeric:tabular-nums; }",
    ".cmn-card-big { font-family:var(--cmn-serif); font-size:1.9rem; font-weight:700; color:var(--cmn-title); letter-spacing:-0.02em; }",
    ".cmn-card-meter { height:8px; border-radius:999px; background:var(--cmn-track); max-width:none; }",
    ".cmn-card-meter i { border-radius:999px; background:var(--cmn-accent); }",
    ".cmn-card-lines { border-top:1px solid var(--cmn-line-soft); padding-top:12px; display:grid; gap:8px; font-size:.9rem; }",
    ".cmn-card-lines p { margin:0; overflow-wrap:anywhere; }",
    ".cmn-card-label { font-weight:700; color:var(--cmn-heading); }",
    ".cmn-card-label-ask { color:var(--cmn-ask-label); }",
    ".cmn-card-links { margin-top:auto; display:flex; flex-wrap:wrap; gap:6px 18px; font-size:.9rem; }",
    ".cmn-foot { border-top:1px solid var(--cmn-line); padding-top:16px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px 24px; color:var(--cmn-muted); font-size:.88rem; }",
    ".cmn-details { display:grid; gap:18px; border-top:1px solid var(--cmn-line); padding-top:24px; }",
    ".cmn-details[hidden] { display:none; }",
    ".cmn-empty { margin:0; }",
    ".cmn-waiting .cmn-state { font-weight:700; }",
    ".cmn-waiting .cmn-zero { color:var(--hunter); }",
    ".cmn-done-h { margin:10px 0 4px; font-size:.78rem; font-weight:700; color:var(--cmn-heading); }",
    /* Every list in a Details cell is a grid with one shrinking column, so a completed sheet's line cuts with its
       ellipsis instead of widening the cell past the Last run column and the card (Sam's recording, 2026-11-06). */
    ".cmn-done { list-style:none; padding:0; margin:0; grid-template-columns:minmax(0, 1fr); }",
    ".cmn-cell { grid-template-columns:minmax(0, 1fr); }",
    ".cmn-done li, .cmn-done details, .cmn-done summary { min-width:0; }",
    ".cmn-done li { margin:0 0 2px; }",
    ".cmn-done summary { list-style:none; cursor:pointer; min-height:24px; display:flex; align-items:center; }",
    ".cmn-done summary::-webkit-details-marker { display:none; }",
    ".cmn-done-line { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-width:0; flex:1 1 auto; }",
    ".cmn-done summary:hover .cmn-done-line { text-decoration:underline; text-underline-offset:2px; }",
    ".cmn-done summary:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; border-radius:2px; }",
    ".cmn-done details[open] .cmn-done-line { white-space:normal; }",
    ".cmn-done-body { margin:0 0 4px; }",
    ".cmn-bar { display:flex; gap:18px; flex-wrap:wrap; align-items:baseline; border-bottom:1px solid var(--cmn-line); padding-bottom:10px; }",
    ".cmn-bar .cmn-note { flex:1 1 240px; font-size:.9rem; color:var(--cmn-muted); font-variant-numeric:tabular-nums; }",
    ".cmn-notice { margin:0; color:var(--cmn-ink); }",
    "button.cmn-word { all:unset; cursor:pointer; min-height:24px; color:var(--cmn-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; font-family:inherit; }",
    "button.cmn-word:hover, .cmn-wrap a:hover { color:var(--cmn-heading); }",
    "button.cmn-word:focus-visible, .cmn-wrap a:focus-visible, .cmn-ref h3:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:3px; border-radius:2px; }",
    "button.cmn-word[disabled] { color:var(--cmn-muted); text-decoration:none; cursor:default; }",
    ".cmn-list { display:grid; gap:14px; list-style:none; margin:0; padding:0; }",
    ".cmn-ref { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:16px 18px; display:grid; gap:14px; min-width:0; }",
    ".cmn-head { display:flex; flex-wrap:wrap; gap:6px 16px; align-items:baseline; }",
    ".cmn-pos { font-variant-numeric:tabular-nums; color:var(--cmn-muted); font-weight:600; min-width:1.4em; }",
    ".cmn-head h3 { flex:1 1 240px; margin:0; font-family:var(--cmn-serif); font-size:1.25rem; color:var(--cmn-heading); }",
    ".cmn-acts { display:flex; gap:16px; flex-wrap:wrap; font-size:.92rem; }",
    ".cmn-wrap a { color:var(--cmn-link); text-underline-offset:3px; }",
    ".cmn-pair { display:grid; gap:6px; }",
    ".cmn-n { margin:0; font-size:clamp(1.3rem, 2.6vw, 1.7rem); font-family:var(--cmn-serif); color:var(--cmn-title); font-variant-numeric:tabular-nums; line-height:1.15; }",
    ".cmn-n small { font-size:.95rem; color:var(--cmn-muted); font-weight:400; font-family:var(--cmn-sans); }",
    ".cmn-n .cmn-big { font-weight:700; }",
    ".cmn-unread { color:var(--mustard-text); font-weight:600; }",
    ".cmn-why { color:var(--cmn-muted); font-size:.85rem; font-family:var(--cmn-sans); }",
    ".cmn-meter { height:6px; border-radius:3px; background:var(--cmn-track); overflow:hidden; max-width:520px; }",
    ".cmn-meter i { display:block; height:100%; background:var(--cmn-accent); }",
    ".cmn-tests { margin:0; display:flex; gap:6px; flex-wrap:wrap; }",
    ".cmn-test { display:inline-block; font-size:.8rem; padding:1px 8px; border-radius:10px; background:var(--cmn-pill-bg); color:var(--cmn-pill-fg); }",
    ".cmn-detail { display:grid; gap:14px; }",
    ".cmn-detail[hidden] { display:none; }",
    ".cmn-cells { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px 18px; border-top:1px solid var(--cmn-line-soft); padding-top:12px; }",
    ".cmn-cell { display:grid; gap:6px; min-width:0; align-content:start; }",
    ".cmn-cell h4 { margin:0; font-size:.8rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--cmn-muted); }",
    ".cmn-cell ul { margin:0; padding:0; list-style:none; display:grid; gap:5px; }",
    ".cmn-cell li, .cmn-cell p { margin:0; font-size:.93rem; overflow-wrap:anywhere; color:var(--cmn-ink); }",
    ".cmn-count { font-variant-numeric:tabular-nums; font-weight:600; }",
    ".cmn-owner, .cmn-quiet { color:var(--cmn-muted); }",
    ".cmn-stamp { display:grid; gap:4px; font-size:.9rem; }",
    ".cmn-age { color:var(--cmn-muted); }",
    ".cmn-next { font-size:.9rem; }",
    ".cmn-state { display:inline-block; font-size:.8rem; padding:1px 8px; border-radius:10px; background:var(--cmn-pill-bg); color:var(--cmn-pill-fg); }",
    ".cmn-state-ok { background:var(--cpl-green-soft); color:var(--success-text); }",
    ".cmn-state-stale, .cmn-state-open { background:var(--cmn-ask-bg); color:var(--cmn-ask-fg); }",
    ".cmn-state-unread { background:var(--surface-muted); color:var(--danger-text); }",
    "@media (prefers-reduced-motion: no-preference) { .cmn-ref h3 { scroll-margin-top:16px; } }",
    "@media (max-width: 1040px) { .cmn-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
    "@media (max-width: 900px) { .cmn-cells { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
    "@media (max-width: 620px) { .cmn-queue-grid { grid-template-columns:minmax(0, 1fr); } .cmn-queue { padding:16px; } }",
    "@media (max-width: 620px) { .cmn-grid { grid-template-columns:minmax(0, 1fr); } .cmn-page { margin:0; padding-left:16px; padding-right:16px; } }",
    "@media (max-width: 560px) { .cmn-cells { grid-template-columns:minmax(0, 1fr); } .cmn-ref { padding:14px; } .cmn-card { padding:16px; } }"
  ].join("\n");
  /* The tab's tokens: Malone's CPL/AI palette in the light theme (the public library page's values), and in the dark
     theme every role mapped onto a First Light dark token, so no color is invented there (Rule 4 holds: the dark
     roles live in both HTMLs' :root). */
  var TOKENS = [
    "#tab-commons { --cmn-page:#F5FAFF; --cmn-page-end:#EEF6FB; --cmn-surface:#FFFFFF; --cmn-ink:#17243B; --cmn-ink-2:#3E4C61; --cmn-muted:#58677D; --cmn-heading:#082B61; --cmn-title:#072C66; --cmn-link:#0D5BC6; --cmn-accent:#1671D9; --cmn-gold:#F4B300; --cmn-line:#D9E4EF; --cmn-line-soft:#E8EEF5; --cmn-track:#E3ECF5; --cmn-pill-bg:#EAF4FE; --cmn-pill-fg:#355A80; --cmn-ask-bg:#FFF4D6; --cmn-ask-fg:#5C4000; --cmn-ask-label:#5C4000; --cmn-done-bg:#E3F4EA; --cmn-done-fg:#1E5B37; --cmn-serif:Georgia,'Times New Roman',serif; --cmn-sans:Inter,ui-sans-serif,system-ui,sans-serif; }",
    ":root[data-theme=\"dark\"] #tab-commons { --cmn-page:var(--surface-muted); --cmn-page-end:var(--surface-muted); --cmn-surface:var(--surface); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--cobalt); --cmn-accent:var(--cobalt); --cmn-gold:var(--gold-accent); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-track:var(--surface-muted); --cmn-pill-bg:var(--surface-muted); --cmn-pill-fg:var(--text-body); --cmn-ask-bg:var(--mustard-fill); --cmn-ask-fg:var(--on-mustard); --cmn-ask-label:var(--mustard-text); --cmn-done-bg:var(--surface-muted); --cmn-done-fg:var(--text-strong); }",
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) #tab-commons { --cmn-page:var(--surface-muted); --cmn-page-end:var(--surface-muted); --cmn-surface:var(--surface); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--cobalt); --cmn-accent:var(--cobalt); --cmn-gold:var(--gold-accent); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-track:var(--surface-muted); --cmn-pill-bg:var(--surface-muted); --cmn-pill-fg:var(--text-body); --cmn-ask-bg:var(--mustard-fill); --cmn-ask-fg:var(--on-mustard); --cmn-ask-label:var(--mustard-text); --cmn-done-bg:var(--surface-muted); --cmn-done-fg:var(--text-strong); } }"
  ].join("\n");
  var FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  function ensureCss() {
    if (document.getElementById("cmn-css")) return;
    document.head.appendChild(el("style", { id: "cmn-tokens", text: TOKENS }));
    document.head.appendChild(el("style", { id: "cmn-css", text: CSS }));
    if (!document.getElementById("cmn-font")) document.head.appendChild(el("link", { id: "cmn-font", rel: "stylesheet", href: FONT_HREF }));
  }

  window.CPL_COMMONS = {
    boot: boot, render: render, load: load, ensureCss: ensureCss, cardModel: cardModel, sortCards: sortCards,
    machineState: machineState, sessionState: sessionState, cadenceWords: cadenceWords, fmt: fmt,
    queueSection: queueSection, REASONS: REASONS, confidenceSection: confidenceSection, nextBatchSection: nextBatchSection, batchSection: batchSection, caseSection: caseSection, saveRuling: saveRuling, runProcessor: runProcessor, PROCESS: PROCESS, batchList: batchList, countDecided: countDecided, BATCH: BATCH, learningLine: learningLine,
    ROOT_ID: ROOT_ID, STATUS_URL: STATUS_URL, ORDER_KEY: ORDER_KEY, FOLD_KEY: FOLD_KEY, CSS: CSS, TOKENS: TOKENS, CARDS: CARDS, TITLE: TITLE
  };
})();
