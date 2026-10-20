// exhibit_progress.js — the Common Exhibit Reference's Progress view (S436, 2026-10-20).
//
// The Commons' step 3 for the Exhibit row (lane docs/reference/lanes/commons.md): Sam, 2026-10-18,
// "each of our 'common' projects should have the same approach and tracking and feedback system.
// Would be nice to get used to the screen appearance and as we make changes to one, keep the other
// related dashes aligned". The shape is the shared module's (commons_progress.js): the run status,
// the headline pair, the milestone line with You are here, a card per part and the side column
// from the run log (kb/status/exhibit.json). The Subjects view (canonical_subj4.js, S425) is the
// worked example; this file is the same contract on a second reference.
//
// One definition, two readers: the headline pair and the auditor's tallies come from the Exhibit
// row of kb/status/commons.json, which kb/_build_commons_status.py writes daily from the committed
// files, so the Commons row and this view cannot disagree. The rest is the tab's own live state,
// lent through api: last night's procedures report, the Unclassified, No issuer and Merge confirms
// queues, and the tab's lane switch, so a count opens the lane that lists what it counted.
//
// Loaded lazily by credential_reference.js when the Progress view opens, after commons_progress.js.
// Tokens only (var(--token)), words for every control, no glyphs (CLAUDE.md, presentation rules).
(function () {
  "use strict";

  var STATUS_URL = "kb/status/exhibit.json";
  var COMMONS_URL = "kb/status/commons.json";
  var SECS_KEY = "cplCer.secs.v1";
  var P = "#tab-credential-reference";

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
  function dayWords(v) {
    var CP = window.CPL_COMMONS_PROGRESS;
    return !v ? "" : CP ? CP.dayOf(v) : String(v).slice(0, 10);
  }

  /* ── the reads this view makes beyond the tab's own ── */
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
  function exhibit_row(j) { return !!(j && Array.isArray(j.rows) && j.rows.some(function (r) { return r && r.key === "exhibit" && r.facts; })); }
  function load() {
    return Promise.all([
      cache.status ? Promise.resolve(cache.status) : readSoft(STATUS_URL, written_at),
      cache.commons ? Promise.resolve(cache.commons) : readSoft(COMMONS_URL, exhibit_row)
    ]).then(function (parts) {
      if (parts[0].data) cache.status = parts[0];
      if (parts[1].data) cache.commons = parts[1];
      return { status: parts[0], commons: parts[1] };
    });
  }

  /* ── where a count leads: a lane of the tab ── */
  var TO = {
    held: { lane: "held" }, unc: { lane: "unc" }, noiss: { lane: "noiss" }, merge: { lane: "merge" },
    procs: { lane: "procs" }, all: { lane: "all" }
  };

  /* ── the milestones: where the reference stands, in order ──
     Every milestone before the first with anything left is done; that one is You are here. */
  var MILESTONES = [
    { id: "classified", title: "Every MAP title classified", needs: ["facts", "queues"],
      fact: function (x) { return fmtN(x.mapTitles - x.unclassified) + " of " + fmtN(x.mapTitles) + " carry an identity"; },
      left: function (x) { return [[x.unclassOpen, "title waiting for an identity", "titles waiting for an identity", TO.unc]]; } },
    { id: "held", title: "The held titles decided", needs: ["report"],
      fact: function (x) { return plural(x.held, "title", "titles") + " held last night"; },
      left: function (x) {
        return [[x.held, "title held for a person", "titles held for a person", TO.held],
          [x.foldHeld, "saved assignment the fold holds", "saved assignments the fold holds", TO.held]];
      } },
    { id: "issuers", title: "An issuer for every credential", needs: ["queues"],
      fact: function (x) { return fmtN(x.credentials - x.issuerN) + " of " + fmtN(x.credentials) + " settled"; },
      left: function (x) {
        return [[x.issuerN, "credential to triage for its issuer", "credentials to triage for their issuer", TO.noiss],
          [x.mergeN, "merge to confirm", "merges to confirm", TO.merge]];
      } },
    { id: "matches", title: "The reference matches MAP", needs: ["facts"],
      fact: function (x) { return plural(x.leftMap, "title has", "titles have") + " left MAP"; },
      left: function (x) { return [[x.leftMap, "title to retire or keep", "titles to retire or keep", TO.all]]; } },
    { id: "stamped", title: "Every title stamped", needs: ["facts"],
      fact: function (x) { return fmtN(x.stamped) + " of " + fmtN(x.titles) + " carry a review stamp"; },
      left: function (x) { return [[x.titles - x.stamped, "title without a review stamp", "titles without a review stamp", TO.all]]; } }
  ];

  /* ── the parts: one card per piece of the reference's work ──
     status(x) answers a STATUS key of the shared module; meter(x) answers [have, of, verb]. */
  var PARTS = [
    { id: "titles", title: "The titles from MAP", needs: ["facts"],
      status: function (x) { return x.unclassified ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.mapTitles) + " exhibit titles in MAP today; the reference holds " + fmtN(x.titles) + " under " +
          fmtN(x.credentials) + " credentials, and " + plural(x.unclassified, "title in MAP has", "titles in MAP have") + " no identity yet.";
      },
      meter: function (x) { return [x.mapTitles - x.unclassified, x.mapTitles, "carry an identity"]; },
      foot: function () { return "A title a college enters in MAP joins the waiting list on the next audit."; },
      open: function (x) { return x.unclassOpen == null ? null : ["Open the " + fmtN(x.unclassOpen) + " waiting", TO.unc]; } },
    { id: "procedures", title: "The nightly procedures", needs: ["report"],
      status: function () { return "live"; },
      what: function (x) {
        return plural(x.procsN, "procedure is", "procedures are") + " in force: " + fmtN(x.rules) + " applied by code, " + fmtN(x.guidance) +
          " read by the classifier, then the classifier answers the rest. The last run, " + dayWords(x.reportAt) + ", proposed for " + fmtN(x.proposed) + " of " + fmtN(x.waiting) + " waiting titles.";
      },
      foot: function () { return "A proposal no reason holds saves under its procedure, and a procedure's saves undo together. A new procedure is written in plain words for a session."; },
      open: function () { return ["Open the procedures", TO.procs]; } },
    { id: "held", title: "Held for a person", needs: ["report"],
      status: function (x) { return x.held || x.foldHeld ? "going" : "done"; },
      what: function (x) {
        return plural(x.held, "title", "titles") + " held last night" + (x.heldWhy ? " (" + x.heldWhy + ")" : "") + "; " +
          plural(x.foldHeld, "saved assignment", "saved assignments") + " the fold holds against a human-reviewed classification.";
      },
      foot: function () { return "Each held title opens in Unclassified with its proposal, for a curator to save or change."; },
      open: function (x) { return ["Open the " + fmtN(x.held + x.foldHeld) + " held", TO.held]; } },
    { id: "issuers", title: "Issuers", needs: ["queues"],
      status: function (x) { return x.issuerN ? "going" : "done"; },
      what: function (x) { return plural(x.issuerN, "credential needs", "credentials need") + " an issuer, or a staged title or trainer to confirm."; },
      meter: function (x) { return [x.credentials - x.issuerN, x.credentials, "settled"]; },
      foot: function () { return "The issuer is the body that certifies the credential; a local exhibit saves with no formal issuer."; },
      open: function (x) { return ["Open the " + fmtN(x.issuerN) + " in No issuer", TO.noiss]; } },
    { id: "merges", title: "Merges to confirm", needs: ["queues"],
      status: function (x) { return x.mergeN ? "going" : "done"; },
      what: function (x) { return plural(x.mergeN, "saved rename matches", "saved renames match") + " a credential already in the reference."; },
      foot: function () { return "A merge is never inferred: a curator confirms it or saves a different title."; },
      open: function (x) { return x.mergeN ? ["Open the " + fmtN(x.mergeN) + " to confirm", TO.merge] : null; } },
    { id: "stamps", title: "Review stamps", needs: ["facts"],
      status: function (x) { return x.stamped < x.titles ? "going" : "done"; },
      what: function (x) {
        return fmtN(x.stamped) + " of " + fmtN(x.titles) + " titles carry a review stamp, " + fmtN(x.person) + " a person's and " + fmtN(x.cohort) +
          " a procedure's or a session cohort's; " + fmtN(x.recordsStamped) + " of " + fmtN(x.records) + " credential records are stamped.";
      },
      meter: function (x) { return [x.stamped, x.titles, "stamped"]; },
      foot: function () { return "A stamp says a person or a procedure in force settled the title; the classifier's answer alone carries none."; },
      open: function () { return ["Open the reference", TO.all]; } },
    { id: "confidence", title: "The classifier's confidence", needs: ["facts"],
      status: function (x) { return x.below80 ? "going" : "done"; },
      what: function (x) {
        return plural(x.below80, "title sits", "titles sit") + " below 0.80 on the title, " + fmtN(x.below60) + " of them below 0.60.";
      },
      meter: function (x) { return [x.titles - x.below80, x.titles, "at 0.80 or above"]; },
      foot: function () { return "A low score is where a curator's look pays most; the auditor tags each one on the reference."; },
      open: function () { return ["Open the reference", TO.all]; } },
    { id: "left_map", title: "Titles that have left MAP", needs: ["facts"],
      status: function (x) { return x.leftMap ? "going" : "done"; },
      what: function (x) { return plural(x.leftMap, "title in the reference is", "titles in the reference are") + " no longer in MAP's current data."; },
      foot: function () { return "A curator retires one or keeps it; the auditor tags each on the reference."; },
      open: function () { return ["Open the reference", TO.all]; } }
  ];
  var SOURCE = {
    facts: "The Commons figures (" + COMMONS_URL + ")", Q: "The reference's run log (" + STATUS_URL + ")",
    report: "Last night's procedures report (kb/cer_procedures_out/latest.json)", queues: "The tab's worklists"
  };
  /* The headline pair: every title in the reference beside the ones carrying a review stamp,
     the Commons row's own pair (tests curator-stamped and procedure-settled). */
  var HEADLINE = {
    label: "Every exhibit title in the reference, and how many carry a review stamp",
    needs: ["facts"],
    all: { n: function (x) { return x.titles; }, words: "exhibit titles in the reference",
      small: function (x) { return fmtN(x.mapTitles) + " of them are in MAP's current data, under " + fmtN(x.credentials) + " credentials"; } },
    mine: { n: function (x) { return x.stamped; }, words: "carry a review stamp",
      small: "Settled by a person, or by a procedure in force under its cohort",
      open: function () { return ["Open the reference", TO.all]; } },
    barLabel: function (x) { return fmtN(x.stamped) + " of " + fmtN(x.titles) + " titles stamped"; },
    within: function (x) {
      return [{ n: x.person, words: " by a person" }, { n: x.cohort, words: " by a procedure or a cohort" },
        x.held ? { go: [plural(x.held, "title held", "titles held") + " for a person", TO.held] } : null];
    }
  };
  var SPEC = {
    title: "Common Exhibit Reference", sub: "Progress",
    lede: "Where the reference stands. The figures come from the daily build and last night's procedures run; the next step, the calls and what changed come from the last session's checkpoint. A count opens the lane that lists it.",
    milestones: MILESTONES, parts: PARTS, partsTitle: "The parts", headline: HEADLINE, sources: SOURCE
  };

  /* ── the context x, from the reads and the tab's live state ── */
  function context(reads, api, now) {
    var errors = {};
    var Q = reads.status && reads.status.data || null;
    if (!Q) errors.Q = reads.status && reads.status.error || "not read yet";
    var row = null;
    if (reads.commons && reads.commons.data) row = reads.commons.data.rows.filter(function (r) { return r.key === "exhibit"; })[0];
    else errors.facts = reads.commons && reads.commons.error || "not read yet";
    var f = row && row.facts || null;
    var rep = api.report || null;
    if (!rep) errors.report = api.reportError ? "the report did not load" : "not read yet";
    var queuesIn = api.unclassOpen != null && api.issuerN != null && api.mergeN != null;
    if (!queuesIn) errors.queues = "the worklists are still loading";
    var held = null, foldHeld = null, heldWhy = "", procs = rep ? rep.procedures || [] : [];
    if (rep) {
      var needs = rep.needs_you || [];
      var heldList = needs.filter(function (e) { return e.kind !== "conflict"; });
      held = heldList.length;
      foldHeld = needs.length - held;
      var why = {};
      heldList.forEach(function (e) {
        var k = String(e.why || "").replace(/ \(\d\.\d+\)$/, "").split(" (")[0];
        why[k] = (why[k] || 0) + 1;
      });
      heldWhy = Object.keys(why).sort(function (a, b) { return why[b] - why[a]; }).map(function (k) { return k + " " + fmtN(why[k]); }).join(", ");
    }
    var x = {
      Q: Q, errors: errors, now: now, decider: (Q && Q.decider) || "Sam",
      facts: f, report: rep, queues: queuesIn ? true : null,
      titles: f && f.titles, stamped: f && f.stamped, person: f && f.person, cohort: f && f.cohort,
      credentials: api.credentials != null ? api.credentials : f && f.credentials,
      records: f && f.records, recordsStamped: f && f.records_stamped,
      mapTitles: f && f.map_titles, unclassified: f && f.unclassified, leftMap: f && f.left_map,
      below80: f && f.below_80, below60: f && f.below_60,
      held: held, foldHeld: foldHeld, heldWhy: heldWhy,
      rules: procs.filter(function (p) { return p.kind === "rule"; }).length,
      guidance: procs.filter(function (p) { return p.kind === "guidance"; }).length,
      proposed: rep && rep.proposed, waiting: rep && rep.waiting, reportAt: rep && rep._generated_at,
      unclassOpen: api.unclassOpen, issuerN: api.issuerN, mergeN: api.mergeN
    };
    /* The report lists the classifier itself beside the procedures; the procedures in force are
       the rules and the guidance it reads (the Commons row's count). */
    x.procsN = x.rules + x.guidance;
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
      var sum = el("summary", { cls: "cx-sec-sum" }, [
        opts.label ? el("span", { cls: "cx-sec-label", text: opts.label }) : null,
        el(opts.h || "h3", { cls: "cx-sec-t", text: title }),
        meta ? el("span", { cls: "cx-sec-meta", text: meta }) : null]);
      var d = el("details", { cls: "cx-sec" + (opts.cls ? " " + opts.cls : ""), "data-sec": key },
        [sum, el("div", { cls: "cx-sec-b" }, (kids || []).filter(function (k) { return k != null; }))]);
      var m = secMap();
      if (m[key] == null ? true : m[key]) d.setAttribute("open", "");
      d.addEventListener("toggle", function () { secSet(key, d.open); });
      return d;
    }
    function goControl(words, to, cls) {
      var b = el("button", { cls: "cx-word " + (cls || ""), type: "button", text: words });
      b.addEventListener("click", function () { if (to && to.lane) api.go(to.lane); });
      return b;
    }
    function callLinks(c) {
      if (!(c.link && /^https:\/\//.test(c.link))) return null;
      return el("p", null, [el("a", { cls: "cx-word", href: c.link, target: "_blank", rel: "noopener", text: c.link_text || "Open the decision sheet" })]);
    }
    function goToCall(i) {
      var card = document.querySelector(P + ' .cx-progress details[data-sec="progress:call:' + i + '"]');
      if (card) { card.setAttribute("open", ""); if (card.scrollIntoView) card.scrollIntoView({ block: "start" }); }
    }
    /* A call is answered on its sheet; the checkpoint that records the answer removes it from the
       run log, so an open call here is open (the Subjects host's reading). */
    return {
      classes: { sec: "cx-sec", secBody: "cx-sec-b", secTitle: "cx-sec-t", secLabel: "cx-sec-label", quiet: "cx-quiet", caution: "cx-caution", lede: "cx-lede" },
      section: section, goControl: goControl, callAnswered: function () { return false; }, callRecords: function () { return null; },
      callLinks: callLinks, goToCall: goToCall
    };
  }

  function ensureCss() {
    if (document.getElementById("cx-progress-css")) return;
    document.head.appendChild(el("style", { id: "cx-progress-css", text: [
      P + " .cx-progress { display:block; padding:12px 4px; min-width:0; }",
      P + " .cx-sec { border:1px solid var(--border); border-radius:10px; background:var(--surface-opaque); }",
      P + " .cx-sec-sum { cursor:pointer; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 12px; padding:12px 16px; min-height:24px; }",
      P + " .cx-sec-sum:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; border-radius:8px; }",
      P + " .cx-sec-t { margin:0; color:var(--text-strong); }",
      P + " .cx-sec-label { width:100%; font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); }",
      P + " .cx-sec-meta { font-size:.875rem; color:var(--text-muted); }",
      P + " .cx-sec-b { padding:0 16px 16px; }",
      P + " .cx-quiet { color:var(--text-muted); }",
      P + " .cx-caution { color:var(--mustard-text); }",
      P + " .cx-lede { margin:0; color:var(--text-body); max-width:var(--cpl-measure,none); }",
      // Controls are underlined words (Sam, 2026-10-09): no border, no fill, 24px tall.
      P + " .cx-word { font:inherit; font-weight:600; color:var(--cobalt); background:none; border:0; padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
      P + " .cx-word:hover { text-decoration-thickness:2px; }",
      P + " .cx-word:focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; border-radius:2px; }",
      "@media (max-width: 760px) { " + P + " .cx-progress .prh-pg-steps { grid-template-columns:minmax(0, 1fr); } }"
    ].join("\n") }));
  }

  /* mount(node, api): draw the view into node. api lends the tab's state and its lane switch:
     {go(lane), report, reportError, unclassOpen, issuerN, mergeN, credentials}. */
  function mount(node, api) {
    var CP = window.CPL_COMMONS_PROGRESS;
    while (node.firstChild) node.removeChild(node.firstChild);
    if (!CP) {
      node.appendChild(el("p", { cls: "cx-caution", role: "alert",
        text: "The Progress view's shared module (commons_progress.js) could not be loaded. The other views read as usual; reload the tab to try again." }));
      return Promise.resolve();
    }
    ensureCss();
    var box = el("section", { cls: "cx-progress", id: "cx-progress", "aria-label": "Common Exhibit Reference, Progress" });
    box.appendChild(el("p", { cls: "cx-quiet", role: "status", text: "Reading the figures." }));
    node.appendChild(box);
    return load().then(function (reads) {
      var x = context(reads, api, new Date());
      while (box.firstChild) box.removeChild(box.firstChild);
      box.appendChild(CP.render(SPEC, x, { readAt: new Date(), errors: x.errors }, host(api)));
    });
  }

  window.CPL_EXHIBIT_PROGRESS = { MILESTONES: MILESTONES, PARTS: PARTS, HEADLINE: HEADLINE, SPEC: SPEC, TO: TO,
    context: context, mount: mount, _reset: function () { cache = { status: null, commons: null }; secs = null; } };
})();
