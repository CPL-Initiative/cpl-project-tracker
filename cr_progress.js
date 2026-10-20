// cr_progress.js — the Common CR Reference's Progress view (S437, 2026-10-20).
//
// The Commons' step 3 for the CR row (lane docs/reference/lanes/commons.md): Sam, 2026-10-18,
// "each of our 'common' projects should have the same approach and tracking and feedback system.
// Would be nice to get used to the screen appearance and as we make changes to one, keep the other
// related dashes aligned". The shape is the shared module's (commons_progress.js): the run status,
// the headline pair, the milestone line with You are here, a card per part and the side column
// from the run log (kb/status/cr.json). exhibit_progress.js (S436) is the template; this file is
// the same contract on a fourth reference.
//
// Complete, here: a wording colleges wrote resolves to a settled reference when a rung 1 to 4 rule
// places it (the rules act without a curator) or a curator's decision names it (confirmed, or set
// aside as not a topic). Built on that recommendation; Open Asks Sheet 108 card 5 carries it.
//
// One definition, two readers: every figure comes from the CR row of kb/status/commons.json, which
// kb/_build_commons_status.py writes daily from the worklist and the committed decision receipts,
// so the Commons row and this view cannot disagree. The tab lends what only it knows through api:
// its filter switch, so a count opens the list it counted, and the decisions table it read live,
// so the view can say when the table holds a sitting no receipt has landed yet.
//
// Loaded lazily by cr_reference.js when the Progress view opens, after commons_progress.js.
// Tokens only (var(--token)), words for every control, no glyphs (CLAUDE.md, presentation rules).
(function () {
  "use strict";

  var STATUS_URL = "kb/status/cr.json";
  var COMMONS_URL = "kb/status/commons.json";
  var SECS_KEY = "cplCrr.secs.v1";
  var P = "#tab-cr-reference";

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
  function fmtN(n) { return n == null || n === "" ? "" : Number(n).toLocaleString("en-US"); }
  function plural(n, one, many) { return fmtN(n) + " " + (Number(n) === 1 ? one : many); }

  /* ── the reads this view makes ── */
  var cache = { status: null, commons: null };
  function readSoft(url, test) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    }).then(function (j) {
      if (!test(j)) throw new Error(url + " has no " + test.name);
      return { data: j, error: null };
    }).catch(function (e) { return { data: null, error: String(e && e.message || e) }; });
  }
  function written_at(j) { return !!(j && j.written_at); }
  function cr_row(j) { return !!(j && Array.isArray(j.rows) && j.rows.some(function (r) { return r && r.key === "cr" && r.facts; })); }
  function load() {
    return Promise.all([
      cache.status ? Promise.resolve(cache.status) : readSoft(STATUS_URL, written_at),
      cache.commons ? Promise.resolve(cache.commons) : readSoft(COMMONS_URL, cr_row)
    ]).then(function (parts) {
      if (parts[0].data) cache.status = parts[0];
      if (parts[1].data) cache.commons = parts[1];
      return { status: parts[0], commons: parts[1] };
    });
  }

  /* ── where a count leads: a filter of the tab's worklist ── */
  var TO = {
    todo: { filter: "todo" }, auto: { filter: "auto" }, held: { filter: "held" }, done: { filter: "done" },
    open: { filter: "open" }, names: { filter: "names" }, all: { filter: "all" }
  };

  /* ── the milestones: where the reference stands, in order ──
     The corpus is head-heavy (the top 50 wordings carry about half the articulations), so after
     the rules the line walks down the head. Every milestone before the first with anything left is
     done; that one is You are here. */
  function band(n) {
    return { id: "head" + n, title: n === 50 ? "The head settled" : "The top " + n + " settled", needs: ["facts"],
      fact: function (x) {
        var h = x.head[String(n)];
        return fmtN(h.settled) + " of the " + fmtN(h.of) + " wordings with the most articulations";
      },
      /* steps() asks every milestone what is left, read or not: an unread band keeps it open. */
      left: function (x) {
        var h = x.head && x.head[String(n)];
        return [[h ? h.of - h.settled : null, "wording to decide", "wordings to decide", TO.open]];
      } };
  }
  var MILESTONES = [
    { id: "rules", title: "The rules applied", needs: ["facts"],
      fact: function (x) { return fmtN(x.ruleWordings) + " wordings placed in " + fmtN(x.ruleGroups) + " groups"; },
      left: function (x) { return [[x.heldByScreen, "group held by a safety screen", "groups held by a safety screen", TO.held]]; } },
    band(50), band(100), band(250),
    { id: "every", title: "Every wording settled", needs: ["facts"],
      fact: function (x) { return fmtN(x.settled) + " of " + fmtN(x.wordings) + " settled"; },
      left: function (x) {
        return [[x.unsettled, "wording to decide", "wordings to decide", TO.open],
          [x.namesToCheck, "official name to check", "official names to check", TO.names]];
      } }
  ];

  /* ── the parts: one card per piece of the reference's work ──
     status(x) answers a STATUS key of the shared module; meter(x) answers [have, of, verb]. */
  var PARTS = [
    { id: "wordings", title: "The wordings", needs: ["facts"],
      status: function (x) { return x.unsettled ? "going" : "done"; },
      what: function (x) {
        return "Colleges wrote " + fmtN(x.wordings) + " wordings across " + fmtN(x.rows) + " articulations; they form " +
          fmtN(x.groups) + " groups, and " + fmtN(x.settled) + " wordings resolve to a settled reference.";
      },
      meter: function (x) { return [x.settled, x.wordings, "settled"]; },
      foot: function () { return "A wording is settled when a rung 1 to 4 rule places it or a curator decides it."; },
      open: function () { return ["Open every group", TO.all]; } },
    { id: "rules", title: "The rules", needs: ["facts"],
      status: function () { return "live"; },
      what: function (x) {
        return "Rungs 1 to 4 place " + fmtN(x.ruleWordings) + " wordings in " + fmtN(x.ruleGroups) +
          " groups: a published statewide line, a C-ID its subject agrees with, one course identity, or the same words. " +
          plural(x.foldGroups, "group folds", "groups fold") + " more than one wording.";
      },
      foot: function () { return "Rung 5 suggests a match and never merges. A rule's group still opens for a curator to split a wording out."; },
      open: function (x) { return ["Open the " + fmtN(x.foldGroups) + " folded", TO.auto]; } },
    { id: "look", title: "Rule groups to look at", needs: ["facts"],
      status: function (x) { return x.awaitingLook ? "going" : "done"; },
      what: function (x) {
        return plural(x.awaitingLook, "group", "groups") + " of the " + fmtN(x.foldGroups) + " a rule folded carry no curator's decision yet.";
      },
      meter: function (x) { return [x.foldGroups - x.awaitingLook, x.foldGroups, "looked at"]; },
      foot: function () { return "They count as settled. A look confirms the group, splits a wording out, or adds one."; },
      open: function (x) { return x.awaitingLook ? ["Open the " + fmtN(x.awaitingLook) + " in Needs a decision", TO.todo] : null; } },
    { id: "decisions", title: "Curator decisions", needs: ["facts"],
      status: function () { return "live"; },
      what: function (x) {
        var s = plural(x.decided, "group carries", "groups carry") + " a decision in the committed receipts: " +
          plural(x.verdicts, "verdict", "verdicts") + " from a sitting, naming " + fmtN(x.curatorWordings) + " wordings, " +
          fmtN(x.curatorOnly) + " of them beyond what a rule placed (" + fmtN(x.curatorOnlyRows) + " articulations).";
        if (x.liveDecided != null) s += " The decisions table holds " + plural(x.liveDecided, "row", "rows") + " today.";
        return s;
      },
      foot: function (x) {
        if (x.liveDecided != null && x.liveDecided !== x.decided) {
          return "The table and the receipts differ: a sitting since the last receipt has not landed its receipt, so the figures here count the receipts.";
        }
        return "Each decision records who made it; Clear decision undoes one and keeps the row.";
      },
      open: function (x) { return x.decided ? ["Open the decided", TO.done] : null; } },
    { id: "across", title: "Across groups", needs: ["facts"],
      status: function (x) { return x.unsettled ? "going" : "done"; },
      what: function (x) {
        var top = x.head["50"];
        return plural(x.unsettled, "wording sits", "wordings sit") + " alone at rung 5 with no rule and no decision, " +
          fmtN(x.unsettledRows) + " articulations; " + fmtN(top.of - top.settled) + " of them are in the top 50.";
      },
      meter: function (x) { return [x.settledRows, x.rows, "articulations settled"]; },
      foot: function () { return "The question is whether one group belongs with another. Add a wording pulls one in; Not a topic sets a placeholder aside."; },
      open: function (x) { return x.unsettled ? ["Open the " + fmtN(x.unsettled) + " to decide", TO.open] : null; } },
    { id: "names", title: "Official names", needs: ["facts"],
      status: function (x) { return x.namesToCheck ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.namedOfficial) + " groups take an official title and number. " + plural(x.namesToCheck, "group is", "groups are") +
          " reached by an official number whose title shares no word with what colleges wrote.";
      },
      foot: function () { return "A proposed name is never applied on its own: a curator confirms it or rejects it."; },
      open: function (x) { return x.namesToCheck ? ["Open the " + fmtN(x.namesToCheck) + " to check", TO.names] : null; } },
    { id: "screens", title: "Safety screens", needs: ["facts"],
      status: function (x) { return x.heldByScreen ? "going" : "done"; },
      what: function (x) {
        return plural(x.heldByScreen, "group is", "groups are") + " held: a screen holds a merge when the wordings disagree on level, honors, lab, sport or gender.";
      },
      foot: function () { return "Units never hold a merge (Sam, 2026-09-27)."; },
      open: function (x) { return x.heldByScreen ? ["Open the " + fmtN(x.heldByScreen) + " held", TO.held] : null; } },
    { id: "units", title: "Names and units", needs: ["facts"],
      status: function () { return "live"; },
      what: function (x) {
        return fmtN(x.unitsDiffer) + " groups join wordings that award different units; " + fmtN(x.namedByRange) +
          " are named by topic and the range they join, " + fmtN(x.namedNoncredit) + " as noncredit.";
      },
      foot: function () { return "0 hours reads as noncredit, and a range names the group."; },
      open: function () { return ["Open every group", TO.all]; } }
  ];
  var SOURCE = {
    facts: "The Commons figures (" + COMMONS_URL + ")", Q: "The reference's run log (" + STATUS_URL + ")"
  };
  /* The headline pair: every wording colleges wrote beside the ones that resolve to a settled
     reference, the Commons row's own pair (tests rule-settled and curator-decided). */
  var HEADLINE = {
    label: "Every wording colleges wrote, and how many resolve to a settled reference",
    needs: ["facts"],
    all: { n: function (x) { return x.wordings; }, words: "wordings colleges wrote",
      small: function (x) { return "across " + fmtN(x.rows) + " articulations, in " + fmtN(x.groups) + " groups"; } },
    mine: { n: function (x) { return x.settled; }, words: "resolve to a settled reference",
      small: "Placed by a rung 1 to 4 rule, or decided by a curator",
      open: function () { return ["Open every group", TO.all]; } },
    barLabel: function (x) { return fmtN(x.settled) + " of " + fmtN(x.wordings) + " wordings settled"; },
    within: function (x) {
      return [{ n: x.ruleWordings, words: " by a rule" }, { n: x.curatorOnly, words: " more by a curator" },
        { n: x.settledRows, words: " of " + fmtN(x.rows) + " articulations" },
        x.unsettled ? { go: [plural(x.unsettled, "wording", "wordings") + " to decide", TO.open] } : null];
    }
  };
  var SPEC = {
    title: "Common CR Reference", sub: "Progress",
    lede: "Where the reference stands. The figures come from the daily build and the committed decision receipts; the next step, the calls and what changed come from the last session's checkpoint. A count opens the list it counted.",
    milestones: MILESTONES, parts: PARTS, partsTitle: "The parts", headline: HEADLINE, sources: SOURCE
  };

  /* ── the context x, from the reads and the tab's live state ── */
  function context(reads, api, now) {
    var errors = {};
    var Q = reads.status && reads.status.data || null;
    if (!Q) errors.Q = reads.status && reads.status.error || "not read yet";
    var row = null;
    if (reads.commons && reads.commons.data) row = reads.commons.data.rows.filter(function (r) { return r.key === "cr"; })[0];
    else errors.facts = reads.commons && reads.commons.error || "not read yet";
    var f = row && row.facts || null;
    /* A Commons file from before S437 carries no wording figures: a failed read, never a zero. */
    if (f && (f.wordings == null || !f.head)) { errors.facts = "the CR row carries no wording figures yet"; f = null; }
    var x = {
      Q: Q, errors: errors, now: now, decider: (Q && Q.decider) || "Sam", facts: f,
      wordings: f && f.wordings, settled: f && f.settled, rows: f && f.rows, groups: f && f.groups,
      settledRows: f && f.settled_rows, ruleWordings: f && f.rule_wordings, ruleGroups: f && f.rule_groups,
      foldGroups: f && f.by_rule, curatorWordings: f && f.curator_wordings, curatorOnly: f && f.curator_only,
      curatorOnlyRows: f && f.curator_only_rows, unsettled: f && f.unsettled, unsettledRows: f && f.unsettled_rows,
      head: f && f.head, awaitingLook: f && f.awaiting_look, namesToCheck: f && f.names_to_check,
      heldByScreen: f && f.held_by_screen, namedByRange: f && f.named_by_range, namedNoncredit: f && f.named_noncredit,
      unitsDiffer: f && f.units_differ, namedOfficial: f && f.named_official,
      decided: f && f.decided, verdicts: f && f.verdicts,
      liveDecided: api && api.liveDecided != null ? api.liveDecided : null
    };
    var CP = window.CPL_COMMONS_PROGRESS;
    if (CP) { var st = CP.steps(MILESTONES, x); x.steps = st.steps; x.here = st.here; x.next = st.next; }
    return x;
  }

  /* ── the host the shared module borrows: sections, count controls, call cards ── */
  var secs = null;
  function secMap() {
    if (!secs) { try { secs = JSON.parse(localStorage.getItem(SECS_KEY) || "{}") || {}; } catch (e) { secs = {}; } }
    return secs;
  }
  function secSet(key, open) {
    secMap()[key] = !!open;
    try { localStorage.setItem(SECS_KEY, JSON.stringify(secs)); } catch (e) { /* private window */ }
  }
  function host(api) {
    function section(key, title, meta, kids, opts) {
      opts = opts || {};
      var sum = el("summary", { cls: "cq-sec-sum" }, [
        opts.label ? el("span", { cls: "cq-sec-label", text: opts.label }) : null,
        el(opts.h || "h3", { cls: "cq-sec-t", text: title }),
        meta ? el("span", { cls: "cq-sec-meta", text: meta }) : null]);
      var d = el("details", { cls: "cq-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key },
        [sum, el("div", { cls: "cq-sec-b" }, (kids || []).filter(function (k) { return k != null; }))]);
      var m = secMap();
      if (m[key] == null ? true : m[key]) d.setAttribute("open", "");
      d.addEventListener("toggle", function () { secSet(key, d.open); });
      return d;
    }
    function goControl(words, to, cls) {
      var b = el("button", { cls: "cq-word " + (cls || ""), type: "button", text: words });
      b.addEventListener("click", function () { if (to && to.filter && api && api.go) api.go(to.filter); });
      return b;
    }
    function callLinks(c) {
      if (!(c.link && /^https:\/\//.test(c.link))) return null;
      return el("p", null, [el("a", { cls: "cq-word", href: c.link, target: "_blank", rel: "noopener", text: c.link_text || "Open the decision sheet" })]);
    }
    function goToCall(i) {
      var card = document.querySelector(P + ' .cq-progress details[data-sec="progress:call:' + i + '"]');
      if (card) { card.setAttribute("open", ""); if (card.scrollIntoView) card.scrollIntoView({ block: "start" }); }
    }
    /* A call is answered on its sheet; the checkpoint that records the answer removes it from the
       run log, so an open call here is open (the Subjects and Exhibit hosts' reading). */
    return {
      classes: { sec: "cq-sec", secBody: "cq-sec-b", secTitle: "cq-sec-t", secLabel: "cq-sec-label", quiet: "cq-quiet", caution: "cq-caution", lede: "cq-lede" },
      section: section, goControl: goControl, callAnswered: function () { return false; }, callRecords: function () { return null; },
      callLinks: callLinks, goToCall: goToCall
    };
  }

  function ensureCss() {
    if (document.getElementById("cq-progress-css")) return;
    document.head.appendChild(el("style", { id: "cq-progress-css", text: [
      P + " .cq-progress { display:block; padding:12px 4px; min-width:0; }",
      P + " .cq-sec { border:1px solid var(--border); border-radius:10px; background:var(--surface-opaque); }",
      P + " .cq-sec-sum { cursor:pointer; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 12px; padding:12px 16px; min-height:24px; }",
      P + " .cq-sec-sum:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; border-radius:8px; }",
      P + " .cq-sec-t { margin:0; color:var(--text-strong); }",
      P + " .cq-sec-label { width:100%; font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); }",
      P + " .cq-sec-meta { font-size:.875rem; color:var(--text-muted); }",
      P + " .cq-sec-b { padding:0 16px 16px; }",
      P + " .cq-quiet { color:var(--text-muted); }",
      P + " .cq-caution { color:var(--mustard-text); }",
      P + " .cq-lede { margin:0; color:var(--text-body); max-width:var(--cpl-measure,none); }",
      // Controls are underlined words (Sam, 2026-10-09): no border, no fill, 24px tall.
      P + " .cq-word { font:inherit; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      P + " .cq-word:hover { text-decoration-thickness:2px; }",
      P + " .cq-word:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; border-radius:2px; }",
      "@media (max-width: 760px) { " + P + " .cq-progress .prh-pg-steps { grid-template-columns:minmax(0, 1fr); } }"
    ].join("\n") }));
  }

  /* mount(node, api): draw the view into node. api lends the tab's filter switch and its live
     read of the decisions table: {go(filter), liveDecided}. */
  function mount(node, api) {
    var CP = window.CPL_COMMONS_PROGRESS;
    while (node.firstChild) node.removeChild(node.firstChild);
    if (!CP) {
      node.appendChild(el("p", { cls: "cq-caution", role: "alert",
        text: "The Progress view's shared module (commons_progress.js) could not be loaded. The worklist reads as usual; reload the tab to try again." }));
      return Promise.resolve();
    }
    ensureCss();
    var box = el("section", { cls: "cq-progress", id: "cq-progress", "aria-label": "Common CR Reference, Progress" });
    box.appendChild(el("p", { cls: "cq-quiet", role: "status", text: "Reading the figures." }));
    node.appendChild(box);
    return load().then(function (reads) {
      var x = context(reads, api || {}, new Date());
      while (box.firstChild) box.removeChild(box.firstChild);
      box.appendChild(CP.render(SPEC, x, { readAt: new Date(), errors: x.errors }, host(api || {})));
    });
  }

  window.CPL_CR_PROGRESS = { MILESTONES: MILESTONES, PARTS: PARTS, HEADLINE: HEADLINE, SPEC: SPEC, TO: TO,
    context: context, mount: mount, _reset: function () { cache = { status: null, commons: null }; secs = null; } };
})();
