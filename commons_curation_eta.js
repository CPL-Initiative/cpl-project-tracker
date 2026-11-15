// commons_curation_eta.js — the Commons Curation ETA at the top of the CPL Commons tab (S661, #3360).
//
// Sam, in session, 2026-11-15: "Design another ETA widget to estimate completion date on the CPL Commons curation
// work. This one doesn't so much depend on collecting data but on honing the procedures used to auto-canonicalize
// and/or speed the human curation/canonicalization process. Add the new widget to the top of cpl commons."
//
// The model, stated on the page:
//   Each common reference (exhibit titles, course cards, credit-recommendation wordings, subjects) has work still to
//   settle: its universe less what is settled. Its pace is the net fall of that remaining work over the last 7 days
//   (Soonest) or the 7 days before (Latest), from the daily series kb/status/commons_history.json "pairs" records
//   (kb/_build_commons_status.py, backfilled from the committed status file from Oct 18, 2026). The pace splits into
//   what people confirmed and the rest (procedures, less new work arriving). A reference whose remaining work does not
//   fall is not dated: it waits on a procedure or a person.
//   The levers are the two ways Sam named. Procedures: each block of the queue that waits because no procedure
//   settles it (kb/status/commons.json queue, reason no_procedure) becomes a chip; turned on, a new procedure settles
//   a stated share of that block on a stated start day. People: faster review batches and a second curator multiply
//   what people confirm each day. The Curation ETA is the latest of the references' dates.
// Every moved date is a projection, not a commitment, and says so. Picks last the visit; nothing is stored.
// It reads kb/status/commons.json and kb/status/commons_history.json and WRITES NOTHING. Tokens only (the Commons
// --cmn roles); controls that move the date are small chips (Sam, S661), the rest are words; no glyphs.
// Guard: tests/commons_curation_eta.test.js.
(function () {
  "use strict";

  var FILES = { status: "kb/status/commons.json", history: "kb/status/commons_history.json" };
  var REFS = [
    { key: "exhibit", name: "Exhibit titles", unit: "titles" },
    { key: "course", name: "Course cards", unit: "cards" },
    { key: "cr", name: "Credit-recommendation wordings", unit: "wordings" },
    { key: "subjects", name: "Common subjects", unit: "disciplines" }];
  var PACE_CAP = 8;
  var STARTS = [["now", "Now"], [14, "In 2 weeks"], [30, "In a month"], [60, "In 2 months"], [90, "In 3 months"], [180, "In 6 months"]];
  var PEOPLE = [
    { id: "batches", word: "Batches twice a day", factor: 1.5, tip: "Review batches are small and teach the nightly sweep. Offering one in the morning and one in the afternoon, instead of one a day, is assumed to raise what people confirm by half. This is a projection, not a commitment." },
    { id: "curator", word: "A second curator", factor: 2, tip: "A second curator working the same queues is assumed to double what people confirm each day. This is a projection, not a commitment." }];
  /* The procedure each no-procedure block waits on, in words (the block's own words come from the queue). */
  var PROC_WORDS = { "course|#coci-lookup/list/seedless": "Seed the disciplines", "course|#coci-lookup/list/units": "A unit-range rule",
    "cr|#cr-reference/open": "A rule for the open wordings" };

  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function dnum(s) { var p = String(s).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function dstr(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
  function longDate(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k]; else if (k === "cls") e.className = attrs[k]; else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  /* ── the model ── */
  function series(history) {
    var P = (history && history.pairs) || {}, out = {};
    Object.keys(P).forEach(function (d) { var x = P[d] || {}; Object.keys(x).forEach(function (k) { (out[k] = out[k] || {})[d] = x[k]; }); });
    return out;
  }
  /* The closest day at or before n (within a week) that the series holds. */
  function back(byDay, n) { for (var k = n; k >= n - 7; k--) if (byDay[dstr(k)]) return k; return null; }
  function blocks(status) {
    var out = [];
    (((status || {}).queue || {}).reasons || []).forEach(function (g) {
      if (g.key !== "no_procedure") return;
      (g.items || []).forEach(function (i) {
        if (typeof i.n !== "number" || !i.n) return;
        var id = i.ref + "|" + (i.open || "");
        out.push({ id: id, ref: i.ref, n: i.n, words: i.words || "", owner: i.owner || "", open: i.open || "", word: PROC_WORDS[id] || "A procedure for " + (i.words || "this block") });
      });
    });
    return out;
  }
  function base(status, history) {
    var S = series(history), rows = (status && status.rows) || [], asOf = null;
    Object.keys(S).forEach(function (k) { Object.keys(S[k]).forEach(function (d) { var n = dnum(d); if (asOf == null || n > asOf) asOf = n; }); });
    if (asOf == null) return null;
    var refs = REFS.map(function (R) {
      var row = rows.filter(function (r) { return r.key === R.key; })[0], p = row && row.pair || [], byDay = S[R.key] || {};
      var n = p[0] && p[0].n, of = p[0] && p[0].of, person = p[1] && p[1].n;
      if (typeof n !== "number" || typeof of !== "number") return null;
      var at = function (k) { var x = byDay[dstr(k)]; return x ? { n: x[0], of: x[1], person: x[2] } : null; };
      var d0 = back(byDay, asOf), d7 = d0 == null ? null : back(byDay, d0 - 7), d14 = d7 == null ? null : back(byDay, d7 - 7);
      function rem(k) { var x = at(k); return x && typeof x.n === "number" && typeof x.of === "number" ? x.of - x.n : null; }
      function win(a, b) {
        if (a == null || b == null || a === b || rem(a) == null || rem(b) == null) return null;
        var A = at(a), Bv = at(b), days = a - b;
        var net = (rem(b) - rem(a)) / days;   // the fall of remaining work a day
        var confirmed = A.person != null && Bv.person != null ? Math.max(0, A.person - Bv.person) / days : 0;
        /* People's share counts only the confirmations that lowered the remaining work (COBIx on #3375): where the
           universe grows as fast as people stamp, their confirmations move nothing, and a people chip must not date it. */
        var ppl = Math.max(0, Math.min(confirmed, net));
        /* How many days in the window the remaining work fell: a pace from one day's step says so (COBIx on #3375). */
        var fell = 0;
        for (var k = b + 1; k <= a; k++) { var r0 = rem(k - 1), r1 = rem(k); if (r0 != null && r1 != null && r1 < r0) fell++; }
        return { net: net, people: ppl, confirmed: confirmed, other: net - ppl, days: days, fell: fell, from: b, to: a };
      }
      return { key: R.key, name: R.name, unit: R.unit, n: n, of: of, person: person, remaining: Math.max(0, of - n),
        pace: { soonest: win(d0, d7), latest: win(d7, d14) } };
    }).filter(Boolean);
    return { asOf: asOf, written: (status && status.written_at) || "", refs: refs, blocks: blocks(status) };
  }
  function fresh() {
    return { mode: "soonest", on: {}, share: {}, start: {}, people: {}, open: null, assumptions: false };
  }
  /* One reference's finish: procedures settle their share of a block on their start day; people's pace takes the
     chips' factors from now. Returns { day, moved, why }. */
  function finish(B, R, S) {
    if (R.remaining <= 0) return { day: B.asOf, moved: false, done: true };
    var w = R.pace[S.mode], f = 1;
    PEOPLE.forEach(function (p) { if (S.people[p.id]) f *= p.factor; });
    f = Math.min(f, PACE_CAP);
    var daily0 = w ? w.net : 0, daily = w ? w.other + w.people * f : 0;
    var drops = B.blocks.filter(function (b) { return b.ref === R.key && S.on[b.id]; }).map(function (b) {
      var st = S.start[b.id] == null ? 30 : S.start[b.id];
      return { at: st === "now" ? B.asOf : B.asOf + st, n: Math.round(b.n * (S.share[b.id] == null ? 0.7 : S.share[b.id])) };
    }).sort(function (a, b) { return a.at - b.at; });
    function run(d, ds) {
      var rem = R.remaining, t = B.asOf;
      for (var i = 0; i <= ds.length; i++) {
        var next = i < ds.length ? ds[i].at : Infinity, span = next - t;
        if (d > 0 && rem / d <= span) return t + Math.ceil(rem / d);
        if (i === ds.length) return null;
        rem -= d * span;   // work that grows before a procedure's start carries forward (COBIx on #3375)
        t = next; rem = Math.max(0, rem - ds[i].n);
        if (rem <= 0) return t;
      }
      return null;
    }
    var was = run(daily0, []), day = run(daily, drops);
    return { day: day, moved: day !== was, why: day == null ? (daily <= 0 ? "Its remaining work does not fall at this pace: new work arrives as fast as it settles, or nothing settles it yet." : "") : "" };
  }
  function curationDate(B, S) {
    var parts = B.refs.map(function (R) { return { R: R, f: finish(B, R, S) }; });
    var open = parts.filter(function (p) { return !p.f.done; });
    var undated = open.filter(function (p) { return p.f.day == null; });
    var day = undated.length || !open.length ? null : Math.max.apply(null, open.map(function (p) { return p.f.day; }));
    return { parts: parts, day: day, undated: undated, done: !open.length, moved: parts.some(function (p) { return p.f.moved; }) };
  }

  /* ── drawing ── */
  var tipN = 0;
  function withTip(node, text) {
    var id = "cur-tip-" + (++tipN);
    node.setAttribute("aria-describedby", id);
    if (!/^(BUTTON|A|INPUT|SELECT)$/.test(node.tagName)) node.setAttribute("tabindex", "0");
    return el("span", { cls: "cur-tipwrap" }, [node, el("span", { cls: "cur-tip", id: id, role: "tooltip", text: text })]);
  }
  function pill(word, pressed, onClick, key) {
    var b = el("button", { type: "button", cls: "cur-pill", "aria-pressed": pressed == null ? null : (pressed ? "true" : "false"), "data-cur": key }, [el("span", { cls: "cur-face", text: word })]);
    b.addEventListener("click", onClick);
    return b;
  }
  function word(text, onClick, key, expanded) {
    var b = el("button", { type: "button", cls: "cmn-word cur-word", "data-cur": key, "aria-expanded": expanded == null ? null : (expanded ? "true" : "false"), text: text });
    b.addEventListener("click", onClick);
    return b;
  }
  function paceWords(w) {
    if (!w) return "no week the series can date";
    var conf = Math.round(w.confirmed * w.days);
    if (w.net <= 0) return "no net fall (" + fmt(Math.round(w.net * w.days)) + " in " + w.days + " days" + (conf ? "; " + fmt(conf) + " confirmed by a person moved none of it" : "") + ")";
    return fmt(Math.round(w.net * w.days)) + " fewer in " + w.days + " days, " + fmt(Math.round(w.people * w.days)) + " of them by people" +
      (w.fell <= 2 ? "; it fell on " + (w.fell === 1 ? "one day" : "two days") + " of " + w.days + ", so the pace rests on one step" : "");
  }

  function draw(root, B, S) {
    function redraw(fk) { root.textContent = ""; draw(root, B, S); if (fk) { var f = root.querySelector('[data-cur="' + fk + '"]'); if (f && f.focus) f.focus(); } }
    var C = curationDate(B, S);
    var box = el("section", { cls: "cur", "aria-labelledby": "cur-h", "data-cur-band": "" });
    box.appendChild(el("h3", { id: "cur-h", cls: "cur-head", text: "Commons Curation ETA" }));
    box.appendChild(el("p", { cls: "cur-subh", text: "To settle the common references: honing the procedures that canonicalize, and the pace of curation by people" }));
    var label = C.done ? "Complete" : C.day == null ? "Not dated yet" : longDate(C.day);
    var big = el("span", { cls: "cur-date", "data-cur-date": "", text: label });
    var tip = C.day == null && !C.done
      ? "The Curation ETA is the latest of the references' dates. " + C.undated.map(function (p) { return p.R.name; }).join(", ") + (C.undated.length === 1 ? " has" : " have") + " no date at this pace: their remaining work does not fall, because new work arrives as fast as it settles or nothing settles it yet. Turn on a procedure or a people chip to see what would date them. This is a projection, not a promise."
      : "The Curation ETA is the latest of the references' dates, at the " + S.mode + " pace with the chips that are on. This is a projection, not a promise.";
    var mode = pill(S.mode === "soonest" ? "Soonest" : "Latest", true, function () { S.mode = S.mode === "soonest" ? "latest" : "soonest"; redraw("mode"); }, "mode");
    mode.setAttribute("aria-label", S.mode === "soonest" ? "Soonest: the last 7 days' pace. Click for the 7 days before." : "Latest: the 7 days before. Click for the last 7 days' pace.");
    box.appendChild(el("div", { cls: "cur-daterow" }, [withTip(big, tip), withTip(mode, "Soonest uses the last 7 days of the daily series; Latest the 7 days before them.")]));
    if (C.moved) box.appendChild(el("p", { cls: "cur-note", "data-cur-projected": "", text: "Projected. This is a projection, not a commitment." }));

    var chips = el("div", { cls: "cur-chips" });
    var pg = el("div", { cls: "cur-group", role: "group", "aria-label": "Procedures" }, [withTip(el("span", { cls: "cur-plabel", text: "Procedures" }), "Honing the procedures that canonicalize: each chip is a block of work that waits today because no procedure settles it. Turned on, a new procedure settles a share of the block on its start day.")]);
    B.blocks.forEach(function (b) {
      var share = S.share[b.id] == null ? 0.7 : S.share[b.id], st = S.start[b.id] == null ? 30 : S.start[b.id];
      pg.appendChild(withTip(pill(b.word, !!S.on[b.id], function () {
        if (S.on[b.id]) { S.on[b.id] = false; if (S.open === b.id) S.open = null; } else { S.on[b.id] = true; S.open = b.id; }
        S.assumptions = false; redraw(b.id);
      }, b.id), fmt(b.n) + " " + b.words + " (" + b.owner + "). Assumes a new procedure settles about " + Math.round(share * 100) + "% of them, starting " + (st === "now" ? "now" : "in " + st + " days") + ". This is a projection, not a commitment."));
    });
    chips.appendChild(pg);
    var hg = el("div", { cls: "cur-group", role: "group", "aria-label": "People" }, [withTip(el("span", { cls: "cur-plabel", text: "People" }), "Speeding curation by people: each chip multiplies what people confirm each day, from now.")]);
    PEOPLE.forEach(function (p) { hg.appendChild(withTip(pill(p.word, !!S.people[p.id], function () { S.people[p.id] = !S.people[p.id]; redraw(p.id); }, p.id), p.tip)); });
    chips.appendChild(hg);
    chips.appendChild(word("Assumptions", function () { S.open = null; S.assumptions = !S.assumptions; redraw("assumptions"); }, "assumptions", S.assumptions));
    box.appendChild(chips);

    if (S.open) {
      var b = B.blocks.filter(function (x) { return x.id === S.open; })[0];
      if (b) {
        var pop = el("div", { cls: "cur-pop", role: "group", "aria-label": b.word + " assumptions", "data-cur-pop": b.id }, [el("p", { cls: "cur-poph", text: b.word }),
          el("p", { cls: "cur-note", text: fmt(b.n) + " " + b.words + ". Owner today: " + b.owner + "." })]);
        var share = S.share[b.id] == null ? 0.7 : S.share[b.id];
        var r = el("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(share), "aria-label": "Share the procedure settles", "data-cur-share": b.id });
        r.addEventListener("change", function () { S.share[b.id] = Number(r.value); redraw(b.id); });
        pop.appendChild(el("label", { cls: "cur-field" }, [el("span", { text: "Share it settles: " + Math.round(share * 100) + "%" }), r]));
        var sel = el("select", { "aria-label": "Start", "data-cur-start": b.id });
        var cur = S.start[b.id] == null ? 30 : S.start[b.id];
        STARTS.forEach(function (o) { sel.appendChild(el("option", { value: String(o[0]), selected: String(o[0]) === String(cur) ? true : null, text: o[1] })); });
        sel.addEventListener("change", function () { S.start[b.id] = sel.value === "now" ? "now" : Number(sel.value); redraw(b.id); });
        pop.appendChild(el("label", { cls: "cur-field" }, [el("span", { text: "Start" }), sel]));
        pop.appendChild(el("p", { cls: "cur-note", text: "Projection, not a commitment. The rest of the block stays with people." }));
        box.appendChild(pop);
      }
    }
    if (S.assumptions) {
      box.appendChild(el("div", { cls: "cur-pop cur-assume", "data-cur-assumptions": "" }, [
        el("p", { cls: "cur-note", text: "Each reference's remaining work is its universe less what is settled. Its pace is the net fall of that work a day over the window, from the daily series of the Commons status; new work arriving (new titles, new cards) counts against it. People's share of the pace is what they confirmed that lowered the remaining work; a confirmation that moved none of it does not count. Work that grows before a procedure's start carries forward. A procedure chip settles its share of its block on its start day; a people chip multiplies people's share from now, up to 8 times. A reference is dated only when its remaining work falls. These are projections, not commitments." })]));
    }

    var tb = el("tbody");
    C.parts.forEach(function (p) {
      var R = p.R, w = R.pace[S.mode];
      tb.appendChild(el("tr", { "data-ref": R.key }, [el("th", { scope: "row", text: R.name }),
        el("td", { text: fmt(R.n) + " of " + fmt(R.of) + " settled" + (R.person != null ? "; " + fmt(R.person) + " by a person" : "") }),
        el("td", { text: R.remaining ? paceWords(w) : "Complete" }),
        el("td", { text: p.f.done ? "Complete" : p.f.day == null ? "Not dated: waits on a procedure or a person" : longDate(p.f.day) + (p.f.moved ? " (projected)" : "") })]));
    });
    box.appendChild(el("div", { cls: "cur-scroll", role: "region", "aria-label": "The references", tabindex: "0" }, [el("table", { cls: "cur-table" }, [
      el("colgroup", null, [el("col", { style: "width:24%" }), el("col", { style: "width:28%" }), el("col", { style: "width:28%" }), el("col", { style: "width:20%" })]),
      el("thead", null, [el("tr", null, ["Reference", "Settled", "Pace (" + (S.mode === "soonest" ? "last 7 days" : "the 7 days before") + ")", "Finish"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), tb])]));
    box.appendChild(el("p", { cls: "cur-note" }, ["From the Commons status of " + (B.written ? B.written.slice(0, 10) : "a day the file does not give") + " and its daily series. Program requirements are dated on the ",
      el("a", { href: "#commons/data", text: "College Collections ETA" }), ". Every moved date is a projection, not a commitment."]));
    root.appendChild(box);
  }

  var CSS_ID = "cur-css";
  var CSS = [
    ".cur { display:grid; gap:8px; justify-items:center; text-align:center; padding:12px 16px; margin:12px 0; background:var(--cmn-surface); border:1px solid var(--cmn-line); border-radius:12px; }",
    ".cur-head { margin:0; font-size:1rem; color:var(--cmn-heading); }",
    ".cur-subh { margin:-6px 0 0; font-size:.78rem; color:var(--cmn-muted); }",
    ".cur-daterow { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:center; }",
    ".cur-date { font-family:var(--cmn-serif); font-size:clamp(1.5rem, 4vw, 2.2rem); color:var(--cmn-title); cursor:help; }",
    ".cur-chips { display:flex; flex-wrap:wrap; gap:4px 12px; align-items:center; justify-content:center; width:100%; }",
    ".cur-group { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }",
    ".cur-plabel { font-size:.7rem; color:var(--cmn-muted); cursor:help; }",
    /* Small, quiet chips inside a 24px target (Sam, S661), as on the College Collections ETA. */
    ".cur-pill { font:inherit; padding:0; min-height:24px; border:0; background:none; display:inline-flex; align-items:center; cursor:pointer; }",
    ".cur-face { display:inline-flex; align-items:center; padding:0 6px; line-height:16px; border:1px solid var(--cmn-line); border-radius:999px; color:var(--cmn-ink-2); font-size:.7rem; }",
    ".cur-pill:hover .cur-face { border-color:var(--cmn-accent); }",
    ".cur-pill[aria-pressed=\"true\"] .cur-face { border-color:var(--cmn-accent); background:var(--cmn-pill-bg); color:var(--cmn-heading); font-weight:600; }",
    ".cur-pill:focus-visible, .cur [tabindex]:focus-visible { outline:2px solid var(--cmn-accent); outline-offset:2px; }",
    ".cur .cur-word { font-size:.74rem; }",
    ".cur-tipwrap { position:relative; display:inline-flex; }",
    ".cur-tip { display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:4px; z-index:6; width:min(300px, 80vw); padding:8px; background:var(--cmn-dialog); color:var(--cmn-ink-2); border:1px solid var(--cmn-line); border-radius:8px; font-size:.78rem; line-height:1.35; text-align:left; font-weight:400; }",
    ".cur-tipwrap:hover > .cur-tip, .cur-tipwrap:focus-within > .cur-tip { display:block; }",
    ".cur-note { margin:0; font-size:.8rem; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cur-pop { display:grid; gap:6px; width:min(380px, 100%); padding:10px; text-align:left; background:var(--cmn-dialog); border:1px solid var(--cmn-line); border-radius:8px; }",
    ".cur-assume { width:100%; }",
    ".cur-poph { margin:0; font-weight:600; color:var(--cmn-heading); font-size:.86rem; }",
    ".cur-field { display:grid; gap:4px; font-size:.82rem; color:var(--cmn-ink-2); }",
    ".cur select { font:inherit; font-size:.84rem; min-height:24px; border:1px solid var(--cmn-line); border-radius:6px; background:var(--cmn-surface); color:var(--cmn-ink); }",
    ".cur-scroll { overflow-x:auto; max-width:100%; width:100%; }",
    ".cur-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.8rem; text-align:left; color:var(--cmn-ink); }",
    ".cur-table th, .cur-table td { padding:4px 8px 4px 0; border-bottom:1px solid var(--cmn-line-soft); vertical-align:top; overflow-wrap:anywhere; }",
    ".cur-table thead th { color:var(--cmn-heading); font-weight:600; }",
    ".cur-table tbody th { font-weight:500; }",
    "@media (max-width:560px) { .cur { padding:10px; } }"
  ].join("\n");
  function ensureCss() { if (document.getElementById(CSS_ID)) return; var s = document.createElement("style"); s.id = CSS_ID; s.textContent = CSS; (document.head || document.body).appendChild(s); }

  var ST = { history: null };
  /* The band for the top of the CPL Commons tab: status is the file the tab already read; the history is read here. */
  function band(status, fetchFn) {
    ensureCss();
    var root = el("div", { cls: "cur-root", "data-cur-root": "" });
    function paint() {
      var B = base(status, ST.history);
      if (!B) { root.appendChild(el("p", { cls: "cur-note", text: "The Commons Curation ETA reads TBA: the daily series of the Commons status could not be read." })); return; }
      draw(root, B, fresh());
    }
    if (ST.history) { paint(); return root; }
    var f = fetchFn || window.fetch;
    if (typeof f !== "function") { paint(); return root; }
    Promise.resolve(f(FILES.history, { cache: "no-store" })).then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (j) { ST.history = j; root.textContent = ""; paint(); }, function () { root.textContent = ""; paint(); });
    return root;
  }
  window.CPL_COMMONS_CURATION_ETA = { FILES: FILES, CSS: CSS, base: base, finish: finish, curationDate: curationDate, fresh: fresh, band: band, ST: ST };
})();
