// commons_progress.js — the Commons' shared Progress view.
//
// Sam, 2026-10-18 ~14:28Z, in chat: "each of our 'common' projects should have the same approach
// and tracking and feedback system. Would be nice to get used to the screen appearance and as we
// make changes to one, keep the other related dashes aligned... It all needs to culminate in a
// 'Commons' dash that brings all the efforts together". Open Asks Sheet 95 card 1 (14:43Z, his
// own call): "Yes, and include Common Subjects in the mix." Step 1 of that build (S419): the
// Progress view the Program Requirements tab drew since S343 (#1900) lifted out of
// program_requirements.js into this one module, with nothing changing on screen, so the Exhibit,
// Course, CR and Subjects references can each draw theirs from it next. Lane:
// docs/reference/lanes/commons.md.
//
// What a project brings, and what it gets:
//   - a SPEC: its words (title, lede, the parts' heading), its MILESTONES, PARTS and WHOLE
//     definitions, its HEADLINE pair, and the names of the reads it makes (`sources`);
//   - a CONTEXT x it builds from its own live reads, with x.Q the project's status file
//     (kb/status/<project>.json, written at every checkpoint; readStatus() reads it);
//   - a HOST h lending the tab's own section(), goControl() and call-card helpers, so the view's
//     sections open, close and remember like its neighbors' and a count opens the tab's own list.
//   render(spec, x, G, h) then draws the one shape Sam asked to get used to: the run status, the
//   headline pair with its bar, the whole measure, the milestone line with You are here, the parts
//   grid, and the side column (next step, the calls waiting on the decider, what changed).
//
// The definitions stay the project's. Nothing here knows what a catalog, an exhibit or a
// discipline is; a milestone is {id, title, fact(x), when(x), left(x) -> [[count, one, many,
// target]]}, a part is {id, title, status(x), what(x), foot(x), meter(x), open(x), answer(x),
// needs}, and WHOLE is a list of {id, title, note, halves?, open}. A read a definition needs is
// named in `needs`; when the context holds null for it the view says the read failed instead of
// drawing a zero (the S343 rule).
//
// The class names keep their prh-pg- prefix (the Program Requirements harvest named them): a
// rename changes nothing a reader sees and would loosen the 417 checks that guard this lift
// (tests/program_requirements.test.js), the way SkyView keeps its ccr_atlas_* paths.
//
// Loaded by the Program Requirements tab's boot block before program_requirements.js (both HTMLs,
// Rule 4); a second host loads it the same way. Tokens only (var(--token)), words for every
// control, no glyphs (CLAUDE.md, presentation rules).
(function () {
  "use strict";

  var PT = "America/Los_Angeles";
  var REPO = "https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/";
  /* The shared vocabulary of a part's state; `call` takes the decider's name after it. */
  var STATUS = { done: "Done", pilot: "Done for the pilot", live: "Live", going: "In progress", next: "Next",
    not: "Not started", call: "Waiting on " };
  /* The host's classes the view leans on: its section pattern (a <details> whose summary carries
     the heading), its quiet and caution text, its lede. Defaults are the Program Requirements
     tab's; another host passes its own in h.classes, and the CSS is injected once per set. */
  var CLASSES = { sec: "prh-sec", secBody: "prh-sec-b", secTitle: "prh-sec-t", secLabel: "prh-sec-label",
    quiet: "prh-quiet", caution: "prh-caution", lede: "prh-lede" };

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
  function link(href, text) { return el("a", { href: href, target: "_blank", rel: "noopener", text: text }); }
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
  function joinAnd(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function latest(vals) { return vals.filter(Boolean).sort().pop() || null; }
  /* The next firing of a weekly run at a weekday (0 = Sunday) and a UTC time, after now
     (Program Requirements' census: Sundays 10:29 UTC, program-source-census.yml). */
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
  function pctOf(v) { var p = v * 100; return p > 0 && p < 1 ? "under 1%" : Math.round(p) + "%"; }

  /* ── the status file ──
   * kb/status/<project>.json: what no browser read can know, written at every checkpoint
   * (scripts/queue_status.py owns the clock and validates it). written_at is the one field every
   * reader needs, so a file without it is a failed read, never an empty run. */
  function readStatus(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " answered " + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || typeof j !== "object" || !j.written_at) throw new Error(url + " names no written_at");
      return j;
    });
  }
  /* The first recorded complete count the pair has grown past (the file's headline history):
     {day, complete}, or null while the count stands where it was first recorded. */
  function since(Q, complete) {
    var hist = Q && Array.isArray(Q.headline) ? Q.headline.filter(function (h) {
      return h && /^\d{4}-\d{2}-\d{2}$/.test(h.day || "") && typeof h.complete === "number";
    }) : [];
    var first = hist[0] || null;
    return first && complete != null && first.complete < complete ? { day: dayOf(first.day), complete: first.complete } : null;
  }
  /* The calls in the status file no one has answered yet, by the host's own reading. */
  function openCalls(Q, callAnswered) {
    return (Q && Array.isArray(Q.calls) ? Q.calls : []).filter(function (c) { return !callAnswered(c); }).length;
  }

  /* ── the definitions, applied ── */
  /* Where the work stands: every milestone before the first one with anything left is done;
     that one is You are here, the one after it is next. A left item whose count is null (its
     read failed) keeps the milestone open. */
  function steps(milestones, x) {
    var hereAt = -1;
    var out = milestones.map(function (m, i) {
      var missing = (m.needs || []).filter(function (k) { return x[k] == null; });
      var left = m.left(x).filter(function (l) { return l[0] == null || l[0] > 0; });
      if (hereAt < 0 && left.length) hereAt = i;
      return { m: m, missing: missing, left: left };
    });
    out.forEach(function (s, i) {
      s.state = hereAt < 0 || i < hereAt ? "done" : i === hereAt ? "here" : i === hereAt + 1 ? "next" : "later";
    });
    return { steps: out, here: hereAt < 0 ? null : milestones[hereAt].id,
      next: hereAt < 0 || hereAt + 1 >= milestones.length ? null : milestones[hereAt + 1].id };
  }
  function missingText(keys, x, sources) {
    return keys.map(function (k) { return sources[k] + " could not be read (" + (x.errors[k] || "not read yet") + ")."; }).join(" ");
  }
  /* Each part, as the view shows it: [status key, status words, what, foot, meter]. A note in
     the status file (notes.<id>) replaces a part's foot. */
  function partView(p, x, sources) {
    var missing = (p.needs || []).filter(function (k) { return x[k] == null; });
    if (missing.length) return { key: "unread", word: "Could not be read", what: missingText(missing, x, sources), foot: "", meter: null };
    var key = p.status(x);
    var note = x.Q && x.Q.notes && typeof x.Q.notes[p.id] === "string" ? x.Q.notes[p.id] : null;
    return { key: key, word: key === "call" ? STATUS.call + (x.decider || "Sam") : STATUS[key], what: p.what(x),
      foot: note != null ? note : p.foot(x), meter: p.meter ? p.meter(x) : null };
  }
  /* The whole measure from the status file's block: each part a [have, of] pair (a part with
     halves averages them), the parts counting equally. null until a checkpoint stamps it, or
     when the block is malformed, so the band never draws a number it cannot stand behind. */
  function pairOk(v) { return Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number" && v[1] > 0; }
  function share(v) { return Math.max(0, Math.min(1, v[0] / v[1])); }
  function wholeFacts(defs, H) {
    H = H && typeof H === "object" ? H : null;
    var parts = H && H.parts && typeof H.parts === "object" ? H.parts : null;
    if (!parts) return null;
    var out = [];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i], v = parts[d.id], f = { def: d };
      if (d.halves) {
        if (!v || typeof v !== "object") return null;
        f.halves = d.halves.map(function (h) { return { words: h[1], pair: v[h[0]] }; });
        if (!f.halves.every(function (h) { return pairOk(h.pair); })) return null;
        f.share = f.halves.reduce(function (a, h) { return a + share(h.pair); }, 0) / f.halves.length;
      } else {
        if (!pairOk(v)) return null;
        f.pair = v;
        f.share = share(v);
      }
      out.push(f);
    }
    return { day: H.day, parts: out, share: out.reduce(function (a, f) { return a + f.share; }, 0) / out.length };
  }

  /* ── the bands ── */
  /* The headline pair (Sam, 2026-10-08, for the Chancellor: "the BIG vision and progress"): every
     item in the universe beside the ones complete, a bar between them, and under it the counts
     that lead to their lists. D = spec.headline: {label, needs, all, mine, barLabel, within},
     all/mine = {n(x), words, small, open(x)}; a words or small may be a function of x. The
     "Up from" fact reads the status file's headline history. */
  function headlineBand(spec, x, h) {
    var D = spec.headline, S = spec.sources || {}, C = classes(h);
    var missing = (D.needs || []).filter(function (k) { return x[k] == null; });
    var read = !missing.length;
    function words(v) { return typeof v === "function" ? v(x) : v; }
    function number(d, mine) {
      var kids = read
        ? [el("b", { text: fmt(d.n(x)) }), el("span", { text: words(d.words) }), el("small", { text: words(d.small) })]
        : [el("b", { cls: "prh-pg-unread", text: "Could not be read" }), el("span", { text: words(d.words) }),
          el("small", { text: missingText(missing, x, S) })];
      var open = read && d.open ? d.open(x) : null;
      if (open) kids.push(h.goControl(open[0], open[1], "prh-pg-hlgo"));
      return el("div", { cls: "prh-pg-n" + (mine ? " prh-pg-mine" : "") }, kids);
    }
    var kids = [el("div", { cls: "prh-pg-pair" }, [number(D.all, false), number(D.mine, true)])];
    var all = read ? D.all.n(x) : null, mine = read ? D.mine.n(x) : null;
    if (read && all > 0) {
      var pct = Math.max(0, Math.min(100, mine / all * 100));
      kids.push(el("div", { cls: "prh-pg-bar", role: "img", "aria-label": words(D.barLabel) }, [
        el("i", { style: "width:" + (Math.round(pct * 100) / 100) + "%" })]));
    }
    var within = D.within ? D.within(x) : null;
    if (within) {
      var line = within.filter(Boolean).map(function (w) {
        if (w.go) return h.goControl(w.go[0], w.go[1], "prh-pg-hlgo");
        return el("span", {}, [el("b", { text: fmt(w.n) }), w.words]);
      });
      var up = since(x.Q, mine);
      if (up) line.push(el("span", { cls: C.quiet, text: "Up from " + fmt(up.complete) + " complete on " + up.day }));
      kids.push(el("p", { cls: "prh-pg-within" }, line));
    }
    return el("section", { cls: "prh-pg-hl", "aria-label": D.label }, kids);
  }
  /* The whole measure (Sam, 2026-10-13: "an overall measure ... how far we are through the whole
     harvest process"). W = spec.whole: {parts, key, label, of, partsLabel, notCounted, foot}; the
     block is the status file's W.key. A project with no whole measure draws no band. */
  function wholeBand(spec, x, h) {
    var W = spec.whole, S = spec.sources || {};
    if (!W) return null;
    var w = wholeFacts(W.parts, x.Q && x.Q[W.key]);
    var kids = [];
    if (!w) {
      kids.push(el("p", { text: x.Q ? W.notCounted : missingText(["Q"], x, S) }));
      return el("section", { cls: "prh-pg-whole", "aria-label": W.label }, kids);
    }
    kids.push(el("div", { cls: "prh-pg-whole-n" }, [el("b", { text: "About " + pctOf(w.share) }), " ",
      el("span", { text: W.of + ", counted " + (w.day ? dayOf(w.day) : "at the last checkpoint") })]));
    kids.push(el("div", { cls: "prh-pg-bar", role: "img", "aria-label": "About " + pctOf(w.share) + " " + W.of }, [
      el("i", { style: "width:" + (Math.round(w.share * 10000) / 100) + "%" })]));
    var ul = el("ul", { "aria-label": W.partsLabel });
    w.parts.forEach(function (f) {
      var nums = f.halves
        ? f.halves.map(function (p) { return fmt(p.pair[0]) + " of " + fmt(p.pair[1]) + " " + p.words; }).join("; ")
        : fmt(f.pair[0]) + " of " + fmt(f.pair[1]);
      ul.appendChild(el("li", {}, [
        el("span", {}, [el("b", { text: f.def.title + " " + pctOf(f.share) })]),
        el("div", { cls: "prh-pg-bar", role: "img", "aria-label": f.def.title + ", " + pctOf(f.share) }, [
          el("i", { style: "width:" + (Math.round(f.share * 10000) / 100) + "%" })]),
        el("small", { text: nums + ". " + f.def.note + "." }),
        f.def.open ? h.goControl(f.def.open[0], f.def.open[1], "prh-pg-hlgo") : null]));
    });
    kids.push(ul);
    if (W.foot) kids.push(el("p", { text: W.foot }));
    return el("section", { cls: "prh-pg-whole", "aria-label": W.label }, kids);
  }
  /* Where the decider answers what waits on a part: the part's own answer(x), then each open
     call the status file places on it (its sheet link, or its card on the side column). */
  function partAnswers(p, x, unread, h) {
    var out = [];
    var a = !unread && p.answer ? p.answer(x) : null;
    if (a) out.push(h.goControl(a[0], a[1], "prh-pg-answer"));
    var calls = x.Q && Array.isArray(x.Q.calls) ? x.Q.calls : [];
    calls.forEach(function (c, i) {
      if (c.part !== p.id || h.callAnswered(c)) return;
      var words = "Answer: " + (c.title || "the call");
      if (c.link && /^https:\/\//.test(c.link)) out.push(el("a", { cls: "prh-word prh-pg-answer", href: c.link, target: "_blank", rel: "noopener", text: words }));
      else {
        var b = el("button", { cls: "prh-word prh-pg-answer", type: "button", text: words });
        b.addEventListener("click", function () { h.goToCall(i); });
        out.push(b);
      }
    });
    return out;
  }

  /* ── the view ── */
  function classes(h) {
    var out = {};
    for (var k in CLASSES) out[k] = (h && h.classes && h.classes[k]) || CLASSES[k];
    return out;
  }
  /* render(spec, x, G, h): the view as one node. x is the project's context (x.Q the status
     file, x.errors the failed reads, x.now, x.decider, and x.steps from steps() when the
     project computed them); G.readAt is when the reads were made. */
  function render(spec, x, G, h) {
    ensureCss(h);
    var now = x.now || new Date(), C = classes(h), S = spec.sources || {};
    var Q = x.Q, who = x.decider || "Sam";
    var box = el("div", { cls: "prh-pg" });

    /* header: what was read when, and the queue's run */
    var meta = el("ul", { cls: "prh-pg-meta", "aria-label": "Run status" });
    meta.appendChild(el("li", {}, ["Read ", el("b", { text: stampOf((G && G.readAt) || now) })]));
    if (Q) {
      var ran = (Q.session ? "S" + Q.session + " " : "") + (Q.moniker || "");
      meta.appendChild(el("li", {}, ["Last run ",
        Q.handoff ? link(REPO + Q.handoff, ran.trim()) : el("b", { text: ran.trim() }),
        (Q.run ? " (" + Q.run + ")" : "") + ", " + stampOf(Q.written_at)]));
      var nr = nextRun(Q, now);
      meta.appendChild(el("li", {}, ["Next " + ((Q.next_run && Q.next_run.name) || "queue") + " run ",
        el("b", { text: nr ? stampOf(nr) : "not on record" })]));
      var waiting = openCalls(Q, h.callAnswered);
      meta.appendChild(el("li", { id: "prh-pg-waitcount", cls: waiting ? "prh-pg-waiting" : C.quiet,
        text: waiting ? waiting + (waiting === 1 ? " call" : " calls") + " waiting on " + who : "Nothing waiting on " + who }));
    } else {
      meta.appendChild(el("li", { cls: C.caution, text: missingText(["Q"], x, S) }));
    }
    box.appendChild(el("header", { cls: "prh-pg-head" }, [
      el("h3", { text: spec.title }), el("span", { cls: "prh-pg-sub", text: spec.sub || "Progress" }), meta,
      headlineBand(spec, x, h), wholeBand(spec, x, h)]));
    if (spec.lede) box.appendChild(el("p", { cls: C.lede + " prh-pg-lede", text: spec.lede }));

    /* the milestone line */
    var st = x.steps || steps(spec.milestones, x).steps;
    var road = el("ol", { cls: "prh-pg-steps" });
    st.forEach(function (s, i) {
      var m = s.m, into = st[i + 1] ? " prh-pg-into-" + st[i + 1].state : "";
      var stateText = s.state === "done" ? "Done" + (m.when && m.when(x) ? " · " + m.when(x) : "")
        : s.state === "here" ? "In progress" : s.state === "next" ? "Next milestone" : "Later";
      road.appendChild(el("li", { cls: "prh-pg-step prh-pg-" + s.state + into, "aria-current": s.state === "here" ? "step" : null }, [
        s.state === "here" ? el("span", { cls: "prh-pg-youare", text: "You are here" }) : null,
        el("span", { cls: "prh-pg-node", "aria-hidden": "true" }),
        el("h4", { text: m.title }),
        el("span", { cls: "prh-pg-state", text: stateText }),
        el("span", { cls: "prh-pg-fact", text: s.missing.length ? "Could not be read" : m.fact(x) })]));
    });
    var here = st.filter(function (s) { return s.state === "here"; })[0];
    var roadKids = [road];
    if (here) {
      roadKids.push(el("p", { cls: "prh-pg-left" }, [
        el("span", { cls: "prh-pg-big", text: String(here.left.length) }),
        el("span", { cls: "prh-pg-label", text: "left before the next milestone" })].concat(here.left.map(function (l) {
          if (l[0] == null) return el("span", { cls: "prh-pg-chip", text: l[2].charAt(0).toUpperCase() + l[2].slice(1) + " (could not be read)" });
          var words = fmt(l[0]) + " " + (l[0] === 1 ? l[1] : l[2]);
          return l[3] ? h.goControl(words, l[3], "prh-pg-chipgo") : el("span", { cls: "prh-pg-chip", text: words });
        }))));
    } else {
      roadKids.push(el("p", { cls: "prh-pg-left" }, [el("span", { cls: "prh-pg-label", text: "Every milestone is done" })]));
    }
    box.appendChild(h.section("progress:milestones", "Milestones", here ? "You are here: " + here.m.title : "Every milestone is done",
      roadKids, { cls: "prh-pg-road", h: "h4" }));

    /* the parts, beside what needs a person */
    var views = spec.parts.map(function (p) { return { p: p, v: partView(p, x, S) }; });
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
      var opens = v.key !== "unread" && o.p.open ? o.p.open(x) : null;
      var answers = partAnswers(o.p, x, v.key === "unread", h);
      if (opens || answers.length) {
        kids.push(el("p", { cls: "prh-pg-links prh-pg-go" }, [opens ? h.goControl(opens[0], opens[1], "prh-pg-open") : null].concat(answers)));
      }
      grid.appendChild(el("li", { cls: "prh-pg-part prh-pg-" + v.key + (opens ? " prh-pg-opens" : "") }, kids));
    });
    var parts = h.section("progress:parts", spec.partsTitle || "Parts", doneN + " of " + spec.parts.length + " done", [grid],
      { cls: "prh-pg-parts", h: "h4" });

    var side = el("aside", { cls: "prh-pg-side", "aria-label": "What happens next" });
    if (!Q) {
      var unread = h.section("progress:next", "Next step", null, [
        el("p", { text: missingText(["Q"], x, S) + " The next step, the calls and what changed come from it; the milestones and parts are read live." })],
        { cls: "prh-pg-box", h: "h4" });
      unread.setAttribute("role", "status");
      side.appendChild(unread);
    } else {
      if (Q.next_step && Q.next_step.title) side.appendChild(h.section("progress:next", Q.next_step.title, null,
        [Q.next_step.text ? el("p", { text: Q.next_step.text }) : null], { cls: "prh-pg-box", h: "h4", label: "Next step" }));
      (Array.isArray(Q.calls) ? Q.calls : []).forEach(function (c, i) {
        var done = h.callAnswered(c);
        var card = h.section("progress:call:" + i, c.title || "", null, [
          c.text ? el("p", { text: c.text }) : null,
          c.if_no_reply && !done ? el("p", { cls: "prh-pg-foot", text: "No reply: " + c.if_no_reply }) : null,
          h.callRecords(c),
          h.callLinks(c)],
          { cls: "prh-pg-box " + (done ? "prh-pg-answered" : "prh-pg-call"), h: "h4", mark: done,
            label: done ? "Answered" : "Needs " + who + "'s call" });
        card.setAttribute("data-call", String(i));
        side.appendChild(card);
      });
      var ch = Array.isArray(Q.changes) ? Q.changes : [];
      if (ch.length) side.appendChild(h.section("progress:changes", "Changed recently", ch.length + (ch.length === 1 ? " change" : " changes"), [
        el("ol", { cls: "prh-pg-log" }, ch.map(function (c) {
          var d = toDate(c.at);
          return el("li", {}, [el("span", { text: c.text || "" }),
            d ? el("time", { datetime: d.toISOString(), text: timeOf(c.at, now) }) : el("span")]);
        }))], { cls: "prh-pg-box", h: "h4" }));
    }
    box.appendChild(el("div", { cls: "prh-pg-main" }, [parts, side]));
    return box;
  }

  /* ── CSS (tokens only; the mock-up's layout on COBI's tokens; cobalt marks where the work is,
     crimson only what waits on a person). Injected once per host class set, so both HTMLs carry
     it without a Rule-4 mirror; the %name% marks are the host's classes (CLASSES). ── */
  var CSS = [
      ".prh-pg-call, .prh-pg-answered { scroll-margin-top:16px; }",
      ".prh-pg-answered .%secLabel% { color:var(--seal-blue-text); }",
      /* the Progress view: the mock-up's layout on COBI's tokens; cobalt marks where the harvest is,
         crimson only what waits on a person */
      ".prh-pg { display:grid; gap:20px; }",
      ".prh-pg-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 16px; }",
      ".prh-pg-head h3 { margin:0; font-size:clamp(1.35rem, 3vw, 1.8rem); color:var(--text-strong); }",
      ".prh-pg .%secTitle% { font-size:1rem; }",
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
      ".prh-pg-within .%quiet% { color:var(--text-muted); }",
      ".prh-pg-label { font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); margin:0; }",
      ".prh-pg-whole { width:100%; box-sizing:border-box; background:var(--surface-opaque); border:1px solid var(--border); border-radius:12px; padding:18px 20px 14px; display:grid; gap:12px; }",
      ".prh-pg-whole-n { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 12px; }",
      ".prh-pg-whole-n b { font-family:'Playfair Display', Georgia, serif; font-size:clamp(1.9rem, 5vw, 2.6rem); line-height:1; color:var(--cobalt); font-variant-numeric:tabular-nums; }",
      ".prh-pg-whole-n span { color:var(--text-body); }",
      ".prh-pg-whole ul { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px 24px; }",
      ".prh-pg-whole li { display:grid; gap:4px; min-width:0; font-size:.9375rem; }",
      ".prh-pg-whole li b { color:var(--text-strong); font-variant-numeric:tabular-nums; }",
      ".prh-pg-whole li small, .prh-pg-whole p { font-size:.875rem; color:var(--text-muted); margin:0; }",
      ".prh-pg .%sec% { margin:0; }",
      ".prh-pg-road > .%secBody% { padding:30px 16px 16px; }",
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
      ".prh-pg-part { position:relative; background:var(--surface-subtle); border:1px solid var(--border); border-radius:10px; padding:14px; display:grid; grid-template-rows:auto auto 1fr auto; gap:8px; min-width:0; }",
      /* The card is the tap target for its list (S381): the open word's ::after covers the card,
         and an answer link rides above it. */
      ".prh-pg-go { margin:0; }",
      ".prh-pg-opens .prh-pg-open::after { content:''; position:absolute; inset:0; border-radius:10px; }",
      ".prh-pg-part.prh-pg-opens:hover { border-color:var(--cobalt); }",
      ".prh-pg-opens .prh-pg-open:focus-visible::after { outline:2px solid var(--cobalt); outline-offset:-2px; }",
      ".prh-pg-answer { position:relative; z-index:1; }",
      ".prh-pg-hlgo { justify-self:start; }",
      ".prh-pg-part h4 { margin:0; font-size:1rem; color:var(--text-strong); }",
      ".prh-pg-status { font-size:.75rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-muted); }",
      ".prh-pg-part.prh-pg-going { border-color:var(--cobalt); }",
      ".prh-pg-part.prh-pg-going .prh-pg-status { color:var(--cobalt); }",
      ".prh-pg-call { border-color:var(--crimson); background:color-mix(in srgb, var(--crimson) 7%, var(--surface-opaque)); }",
      ".prh-pg-links { display:flex; flex-wrap:wrap; gap:.4rem 1rem; margin:.5rem 0 0; }",
      ".prh-pg-part.prh-pg-call .prh-pg-status, .prh-pg-box.prh-pg-call .%secLabel% { color:var(--crimson); }",
      ".prh-pg-part.prh-pg-unread .prh-pg-status { color:var(--mustard-text); }",
      ".prh-pg-what { margin:0; font-size:.9rem; font-variant-numeric:tabular-nums; }",
      ".prh-pg-foot { margin:0; font-size:.8125rem; color:var(--text-muted); }",
      ".prh-pg-meter { height:6px; border-radius:3px; background:var(--border); overflow:hidden; }",
      ".prh-pg-meter i { display:block; height:100%; background:var(--cobalt); }",
      ".prh-pg-side { display:grid; gap:14px; min-width:0; }",
      ".prh-pg-box > .%secBody% { display:grid; gap:8px; }",
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
        " .prh-pg-node { top:0; left:0; } .prh-pg-youare { position:static; order:-1; } .prh-pg-road > .%secBody% { padding-top:8px; } }",
      "@media (max-width: 560px) { .prh-pg-pair { grid-template-columns:minmax(0, 1fr); } .prh-pg-grid { grid-template-columns:minmax(0, 1fr); } .prh-pg-log li { grid-template-columns:minmax(0, 1fr); gap:0; } }",
  ].join("\n");
  function ensureCss(h) {
    var C = classes(h), id = "cpg-css-" + C.sec;
    if (document.getElementById(id)) return;
    document.head.appendChild(el("style", { id: id, text: CSS.replace(/%(\w+)%/g, function (m, k) { return C[k] || m; }) }));
  }

  window.CPL_COMMONS_PROGRESS = {
    render: render, ensureCss: ensureCss, readStatus: readStatus,
    steps: steps, partView: partView, missingText: missingText, wholeFacts: wholeFacts, since: since, openCalls: openCalls,
    headlineBand: headlineBand, wholeBand: wholeBand,
    toDate: toDate, ptDay: ptDay, ptTime: ptTime, dayOf: dayOf, stampOf: stampOf, timeOf: timeOf,
    joinAnd: joinAnd, latest: latest, nextWeekly: nextWeekly, nextRun: nextRun, pctOf: pctOf, fmt: fmt, el: el, link: link,
    STATUS: STATUS, CLASSES: CLASSES, CSS: CSS
  };
})();
