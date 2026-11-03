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
      links: [{ href: "#program-requirements", text: "CPL Pathways" }] },
    subjects: { name: "Common Subjects", what: "One shared subject code for each discipline, the key every common course sits under." },
    exhibit: { name: "Common Exhibits", what: "Every credential colleges grant credit for, under one name and issuer." },
    cr: { name: "Common Credit Recommendations", what: "One wording for each credit recommendation, so the same credit reads the same everywhere." },
    course: { name: "Common Courses", what: "Local courses grouped into shared common courses, mapped in SkyView." },
    credentials: { name: "Common Credentials", what: "Certifications and badges as their issuers publish them, with the skills each names, linked to exhibits." },
    outcomes: { name: "Common Outcomes", what: "Each course’s learning outcomes and objectives, read from its public outline." },
    skills: { name: "Common Skills", status: "Starting",
      what: "Skills and competencies tied to certifications and courses, validated by faculty as they articulate, and shown on each Career Passport." }
  };
  var ORDER = ["requirements", "subjects", "exhibit", "cr", "course", "credentials", "outcomes", "skills"];

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
    var status = unread ? "Could not be read" : open.length ? "Needs you" : building ? (spec.status || "Building") : "In progress";
    var pct = typeof pair.n === "number" && typeof pair.of === "number" && pair.of > 0 ? Math.max(0, Math.min(100, pair.n / pair.of * 100)) : null;
    var recent = "";
    if (Q && Array.isArray(Q.changes) && Q.changes[0] && Q.changes[0].text) recent = firstSentence(Q.changes[0].text);
    else if (row.machine && row.machine.what && row.machine.at) recent = capFirst(row.machine.what) + ", " + stampOf(row.machine.at);
    var next = Q && Q.next_step && Q.next_step.title ? Q.next_step.title : "";
    var links = Array.isArray(spec.links) && spec.links.length ? spec.links : (Array.isArray(row.links) ? row.links : []);
    var home = links[0] ? links[0].href : row.tab;
    return { key: row.key, name: spec.name, what: spec.what, row: row, Q: Q, err: err, pair: pair, open: open, unread: unread,
      kind: kind, status: status, pct: pct, recent: recent, next: next, links: links, home: home };
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
      el("span", { cls: "cmn-pill" + (c.kind === "needs" ? " cmn-pill-needs" : ""), text: c.status })
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
    // A second figure counted beside the first, never in its place (the Course card's Confirmed by a person, Sheet 160).
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
    if (!session()) {
      box.appendChild(el("p", { cls: "cmn-todo-note", text: "A to-do: sign in as a reviewer to mark it done here." }));
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
        el("span", { cls: "cmn-note", text: data && data.written_at ? "Figures read " + stampOf(data.written_at) + "." : "" })])
    ]));

    /* the decisions waiting on Sam, first */
    var waiting = [];
    cards.forEach(function (c) { c.open.forEach(function (call) { waiting.push({ card: c, call: call }); }); });
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

    /* the filter words: the visit's, never remembered */
    var show = "all";
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
  function sessionHeaders(extra) {
    var Sx = window.CPL_SESSION;
    return Sx && typeof Sx.authHeaders === "function" ? Sx.authHeaders(extra) : (extra || {});
  }
  function projectOf(key, Q) { return (Q && Q.project) || key; }
  function readTodoMarks() {
    if (!session()) return Promise.resolve(null);
    return fetch(REST + "/queue_todo_done?select=project,todo_id,note,reopen,by_email,at&order=id.desc", { headers: sessionHeaders() })
      .then(function (r) { return r.ok ? r.json() : null; }, function () { return null; });
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
    return load().then(function (r) { render(root, r.data, r.S, new Date()); return r; }, function (e) {
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
    ".cmn-card { background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; padding:20px 22px; display:flex; flex-direction:column; gap:12px; min-width:0; }",
    ".cmn-card-needs { border-top:4px solid var(--cmn-gold); }",
    ".cmn-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }",
    ".cmn-card-name { margin:0; font-family:var(--cmn-serif); font-size:1.3rem; line-height:1.2; color:var(--cmn-heading); }",
    ".cmn-card-name a { color:inherit; display:inline-block; min-height:24px; }",
    // WCAG 2.2 target size: a link in a card's name or its words row is at least 24px tall (the a11y pass, S552).
    ".cmn-card-links a, .cmn-acts a, .cmn-band-list a, .cmn-card-ask a { display:inline-block; min-height:24px; line-height:24px; }",
    ".cmn-pill { display:inline-block; white-space:nowrap; padding:3px 10px; border-radius:999px; background:var(--cmn-pill-bg); color:var(--cmn-pill-fg); font-size:.78rem; font-weight:700; }",
    ".cmn-pill-needs { background:var(--cmn-ask-bg); color:var(--cmn-ask-fg); }",
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
    ".cmn-done { list-style:none; padding:0; margin:0; }",
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
    "@media (max-width: 620px) { .cmn-grid { grid-template-columns:minmax(0, 1fr); } .cmn-page { margin:0; padding-left:16px; padding-right:16px; } }",
    "@media (max-width: 560px) { .cmn-cells { grid-template-columns:minmax(0, 1fr); } .cmn-ref { padding:14px; } .cmn-card { padding:16px; } }"
  ].join("\n");
  /* The tab's tokens: Malone's CPL/AI palette in the light theme (the public library page's values), and in the dark
     theme every role mapped onto a First Light dark token, so no color is invented there (Rule 4 holds: the dark
     roles live in both HTMLs' :root). */
  var TOKENS = [
    "#tab-commons { --cmn-page:#F5FAFF; --cmn-page-end:#EEF6FB; --cmn-surface:#FFFFFF; --cmn-ink:#17243B; --cmn-ink-2:#3E4C61; --cmn-muted:#58677D; --cmn-heading:#082B61; --cmn-title:#072C66; --cmn-link:#0D5BC6; --cmn-accent:#1671D9; --cmn-gold:#F4B300; --cmn-line:#D9E4EF; --cmn-line-soft:#E8EEF5; --cmn-track:#E3ECF5; --cmn-pill-bg:#EAF4FE; --cmn-pill-fg:#355A80; --cmn-ask-bg:#FFF4D6; --cmn-ask-fg:#5C4000; --cmn-ask-label:#5C4000; --cmn-serif:Georgia,'Times New Roman',serif; --cmn-sans:Inter,ui-sans-serif,system-ui,sans-serif; }",
    ":root[data-theme=\"dark\"] #tab-commons { --cmn-page:var(--surface-muted); --cmn-page-end:var(--surface-muted); --cmn-surface:var(--surface); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--cobalt); --cmn-accent:var(--cobalt); --cmn-gold:var(--gold-accent); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-track:var(--surface-muted); --cmn-pill-bg:var(--surface-muted); --cmn-pill-fg:var(--text-body); --cmn-ask-bg:var(--mustard-fill); --cmn-ask-fg:var(--on-mustard); --cmn-ask-label:var(--mustard-text); }",
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) #tab-commons { --cmn-page:var(--surface-muted); --cmn-page-end:var(--surface-muted); --cmn-surface:var(--surface); --cmn-ink:var(--text-body); --cmn-ink-2:var(--text-body); --cmn-muted:var(--text-muted); --cmn-heading:var(--text-strong); --cmn-title:var(--text-strong); --cmn-link:var(--cobalt); --cmn-accent:var(--cobalt); --cmn-gold:var(--gold-accent); --cmn-line:var(--border); --cmn-line-soft:var(--border); --cmn-track:var(--surface-muted); --cmn-pill-bg:var(--surface-muted); --cmn-pill-fg:var(--text-body); --cmn-ask-bg:var(--mustard-fill); --cmn-ask-fg:var(--on-mustard); --cmn-ask-label:var(--mustard-text); } }"
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
    ROOT_ID: ROOT_ID, STATUS_URL: STATUS_URL, ORDER_KEY: ORDER_KEY, FOLD_KEY: FOLD_KEY, CSS: CSS, TOKENS: TOKENS, CARDS: CARDS, TITLE: TITLE
  };
})();
