// commons.js — the Commons tab: every common reference's dash on one page.
//
// Sam, 2026-10-18 ~14:28Z: "It all needs to culminate in a 'Commons' dash that brings all the
// efforts together and places them in some order of priority and completion and known issues and
// settled procedures". Open Asks Sheet 95 card 1 (14:43Z): "Yes, and include Common Subjects in
// the mix." 19:08Z, on the mock-up: "Commons looks good. Just make sure I can collapse each and we
// have a collapse all button." 20:03Z: "Keep the count and meter when collapsed." 20:10Z: "Build
// it as a tab now. I can live without the words on the cards — pretty self explanatory and I am
// the main user." So: the mock-up's row without its prose. Lane: docs/reference/lanes/commons.md.
//
// What it reads:
//   kb/status/commons.json      the machine side of every row, written daily by
//                               kb/_build_commons_status.py from the committed files: the
//                               complete pair and the test behind it, the known issues each
//                               naming its owner, the settled procedures, the machine stamp.
//   kb/status/<project>.json    the session side, where a project keeps a run log (written at
//                               checkpoints, scripts/queue_status.py): the session stamp, the
//                               next step, the calls waiting on Sam. A project without one
//                               reads "no run log".
// A figure the builder could not read is null in the file and reads "Could not be read" here,
// never a zero (the S343 rule). A stamp past its cadence reads stale.
//
// The order and the fold are Sam's and stay in this browser (localStorage); the build keeps
// nothing else. Loaded by the tab's boot block after commons_progress.js (both HTMLs, Rule 4),
// whose date and number helpers this reuses. Tokens only, words for every control, no glyphs.
(function () {
  "use strict";

  var ROOT_ID = "commons-root";
  var STATUS_URL = "kb/status/commons.json";
  var ORDER_KEY = "cplCommons.order.v1";
  var FOLD_KEY = "cplCommons.fold.v1";
  var DECIDER = "Sam";
  var SESSION_STALE_HOURS = 7 * 24;   /* the run log is written at checkpoints; a week without one reads stale */
  var MACHINE_SLACK = 1.5;            /* a machine stamp older than 1.5 cadences reads stale */

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
  /* The calls in the project's run log, as its last checkpoint left them. */
  function callsCell(Q, err) {
    var kids;
    if (err) kids = [el("p", null, [stateChip({ key: "unread", word: "Could not be read" }), el("span", { cls: "cmn-why", text: " " + err })])];
    else if (!Q) kids = [el("p", null, [stateChip({ key: "neutral", word: "no run log" })])];
    else {
      var calls = Array.isArray(Q.calls) ? Q.calls : [];
      if (!calls.length) kids = [el("p", null, [stateChip({ key: "ok", word: "None open" })])];
      else {
        var ul = el("ul", null, calls.map(function (c) {
          var li = el("li", { text: c.title || "" });
          if (c.link && /^https:\/\//.test(c.link)) { li.appendChild(document.createTextNode(" ")); li.appendChild(openLink(c.link, c.link_text || "Open the decision sheet")); }
          else if (c.view && c.view.href && c.view.text) { li.appendChild(document.createTextNode(" ")); li.appendChild(openLink(c.view.href, c.view.text)); }
          return li;
        }));
        kids = [el("p", null, [stateChip({ key: "open", word: calls.length + " open" })]), ul];
      }
    }
    return cell("Calls waiting on " + DECIDER, kids);
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
      el("h3", { text: title }),
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

  function render(root, data, S, now) {
    now = now || new Date();
    root.removeAttribute("style");
    root.textContent = "";
    var rows = data && Array.isArray(data.rows) ? data.rows : [];
    var start = rows.map(function (r) { return r.key; });
    var foldAll = el("button", { cls: "cmn-word", type: "button", id: "cmn-foldall", text: "Collapse all" });
    var reset = el("button", { cls: "cmn-word", type: "button", id: "cmn-reset", text: "Back to the starting order" });
    var bar = el("div", { cls: "cmn-bar", role: "group", "aria-label": "The controls for the list" }, [
      el("span", { cls: "cmn-note", text: data && data.written_at ? "Figures read " + stampOf(data.written_at) : "" }), foldAll, reset
    ]);
    var list = el("ol", { cls: "cmn-list", id: "cmn-refs", "aria-label": "The common references, in " + DECIDER + "'s order" },
      rows.map(function (r) { return rowItem(r, S, now); }));
    root.appendChild(el("div", { cls: "cmn-wrap" }, [el("h2", { cls: "cmn-title", text: "The Commons" }), bar, list]));

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

  function notice(root, text) {
    root.removeAttribute("style");
    root.textContent = "";
    root.appendChild(el("div", { cls: "cmn-wrap" }, [el("h2", { cls: "cmn-title", text: "The Commons" }), el("p", { cls: "cmn-notice", text: text })]));
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
  function load() {
    return readJson(STATUS_URL).then(function (data) {
      if (!data || !Array.isArray(data.rows) || !data.written_at) throw new Error(STATUS_URL + " is not the Commons' status file");
      var rows = data.rows;
      return Promise.all(rows.map(function (r) {
        if (!r.status_file) return { Q: null, error: null };
        return readStatus(r.status_file).then(function (Q) { return { Q: Q, error: null }; },
          function (e) { return { Q: null, error: e && e.message ? e.message : String(e) }; });
      })).then(function (st) {
        var S = {};
        rows.forEach(function (r, i) { S[r.key] = st[i]; });
        return { data: data, S: S };
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

  /* ── the look: First Light tokens only ── */
  var CSS = [
    ".cmn-wrap { display:grid; gap:18px; max-width:1080px; }",
    ".cmn-title { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--text-strong); }",
    ".cmn-bar { display:flex; gap:18px; flex-wrap:wrap; align-items:baseline; border-bottom:1px solid var(--border); padding-bottom:10px; }",
    ".cmn-bar .cmn-note { flex:1 1 240px; font-size:.9rem; color:var(--text-muted); font-variant-numeric:tabular-nums; }",
    ".cmn-notice { margin:0; color:var(--text-body); }",
    "button.cmn-word { all:unset; cursor:pointer; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; }",
    "button.cmn-word:focus-visible, .cmn-wrap a:focus-visible { outline:2px solid var(--seal-blue); outline-offset:3px; border-radius:2px; }",
    "button.cmn-word[disabled] { color:var(--text-muted); text-decoration:none; cursor:default; }",
    ".cmn-list { display:grid; gap:14px; list-style:none; margin:0; padding:0; }",
    ".cmn-ref { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:16px 18px; display:grid; gap:14px; min-width:0; }",
    ".cmn-head { display:flex; flex-wrap:wrap; gap:6px 16px; align-items:baseline; }",
    ".cmn-pos { font-variant-numeric:tabular-nums; color:var(--text-muted); font-weight:600; min-width:1.4em; }",
    ".cmn-head h3 { flex:1 1 240px; margin:0; font-family:var(--f-display, Georgia, serif); font-size:1.25rem; color:var(--text-strong); }",
    ".cmn-acts { display:flex; gap:16px; flex-wrap:wrap; font-size:.92rem; }",
    ".cmn-wrap a { color:var(--cobalt); text-underline-offset:3px; }",
    ".cmn-pair { display:grid; gap:6px; }",
    ".cmn-n { margin:0; font-size:clamp(1.3rem, 2.6vw, 1.7rem); font-family:var(--f-display, Georgia, serif); color:var(--text-strong); font-variant-numeric:tabular-nums; line-height:1.15; }",
    ".cmn-n small { font-family:inherit; font-size:.95rem; color:var(--text-muted); font-weight:400; font-family:var(--f-body, inherit); }",
    ".cmn-n .cmn-big { font-weight:600; }",
    ".cmn-unread { color:var(--mustard-text); font-weight:600; }",
    ".cmn-why { color:var(--text-muted); font-size:.85rem; font-family:var(--f-body, inherit); }",
    ".cmn-meter { height:6px; border-radius:3px; background:var(--border); overflow:hidden; max-width:520px; }",
    ".cmn-meter i { display:block; height:100%; background:var(--cobalt); }",
    ".cmn-tests { margin:0; display:flex; gap:6px; flex-wrap:wrap; }",
    ".cmn-test { display:inline-block; font-size:.8rem; padding:1px 8px; border-radius:10px; background:var(--surface-muted); color:var(--text-body); }",
    ".cmn-detail { display:grid; gap:14px; }",
    ".cmn-detail[hidden] { display:none; }",
    ".cmn-cells { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px 18px; border-top:1px solid var(--border); padding-top:12px; }",
    ".cmn-cell { display:grid; gap:6px; min-width:0; align-content:start; }",
    ".cmn-cell h4 { margin:0; font-size:.8rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
    ".cmn-cell ul { margin:0; padding:0; list-style:none; display:grid; gap:5px; }",
    ".cmn-cell li, .cmn-cell p { margin:0; font-size:.93rem; overflow-wrap:anywhere; color:var(--text-body); }",
    ".cmn-count { font-variant-numeric:tabular-nums; font-weight:600; }",
    ".cmn-owner, .cmn-quiet { color:var(--text-muted); }",
    ".cmn-stamp { display:grid; gap:4px; font-size:.9rem; }",
    ".cmn-age { color:var(--text-muted); }",
    ".cmn-next { font-size:.9rem; }",
    ".cmn-state { display:inline-block; font-size:.8rem; padding:1px 8px; border-radius:10px; background:var(--surface-muted); color:var(--text-body); }",
    ".cmn-state-ok { background:var(--cpl-green-soft); color:var(--success-text); }",
    ".cmn-state-stale, .cmn-state-open { background:var(--cpl-warn-bg); color:var(--mustard-text); }",
    ".cmn-state-unread { background:var(--surface-muted); color:var(--danger-text); }",
    "@media (max-width: 900px) { .cmn-cells { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
    "@media (max-width: 560px) { .cmn-cells { grid-template-columns:minmax(0, 1fr); } .cmn-ref { padding:14px; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cmn-css")) return;
    document.head.appendChild(el("style", { id: "cmn-css", text: CSS }));
  }

  window.CPL_COMMONS = {
    boot: boot, render: render, load: load, ensureCss: ensureCss,
    machineState: machineState, sessionState: sessionState, cadenceWords: cadenceWords, fmt: fmt,
    ROOT_ID: ROOT_ID, STATUS_URL: STATUS_URL, ORDER_KEY: ORDER_KEY, FOLD_KEY: FOLD_KEY, CSS: CSS
  };
})();
