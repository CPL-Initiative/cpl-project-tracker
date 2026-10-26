/* Check wording: reads a draft instruction for Sierra against the rules an
 * instruction must meet, by rule, before any model runs (Sam, 2026-10-26: "If
 * there is a way for you to analyze an instruction I add to see if it can be
 * worded better for Sierra, let's do that.").
 *
 * Pure functions, no DOM: sierra_training.js renders what check() returns, and
 * the jsdom test runs it on the switched-on instructions as they stood when it
 * was written. Each finding is one plain sentence saying what was found and
 * what to do, with a level: "fix" (Sierra will say or miss something because
 * of it) or "look" (worth a second read; often fine).
 *
 * ⚠ THE SPACE CHECK MIRRORS THE FUNCTION, NOT THE TAB'S METER. cpl-chat's
 * guidanceBlock() adds the newest instruction first and BREAKS at the first one
 * that does not fit 9,000 characters, so a new instruction never fails: the
 * oldest ones silently stop reaching Sierra, and the oldest switched-on one is
 * the naming rule (cb226a48). The meter says the space is nearly full; only this
 * says WHICH instruction would go. Keep RULE_MAX / TOTAL_MAX / SENT_CAP equal to
 * GUIDANCE_MAX_CHARS_PER_RULE / GUIDANCE_MAX_CHARS / GUIDANCE_MAX_RULES in
 * chatbox/supabase/functions/cpl-chat/index.ts (tests/sierra_wording_check.test.js
 * reads them from both files). */
(function (root) {
  var RULE_MAX = 1500, TOTAL_MAX = 9000, SENT_CAP = 20;
  // The limit before 2026-08-12. Three instructions written that day were cut
  // at it with no warning; one of them is still switched on.
  var OLD_RULE_MAX = 500;

  // Pages a reader can open. Sam's rule of 2026-10-26 (sierra_guidance ee287020):
  // link only public pages. A college's own site (.edu) counts.
  var PUBLIC_SITES = [
    "creditforbeingyou.org", "cpl-initiative.github.io", "map.rccd.edu",
    "cpldashboardcccco.azurewebsites.net", "cccco.edu", "www.cccco.edu",
  ];

  // Internal tools and COBI tabs (the same 2026-10-26 rule). "COCI" alone is
  // Sam's earlier ruling: say "catalog data" (sierra-retrieval-corpus lane).
  var INTERNAL_NAMES = [
    ["COCI Lookup", "an internal tool"], ["Catalog Commons", "an internal tool"],
    ["Common Course Reference", "an internal reference"], ["Common Exhibit Reference", "an internal reference"],
    ["common exhibit reference", "an internal reference"], ["CER", "an internal reference"],
    ["CCR", "an internal reference"], ["EACR", "an internal tool"], ["SkyView", "an internal tool"],
    ["COBI", "the team's internal site"], ["COCI", "the state's course system; Sam's word for it is “catalog data”"],
  ];

  var STOP = {};
  ("a an and are as at be but by can do does for from has have he her his how i if in is it its me my no not of on " +
    "or our she so than that the their them then there these they this to us was we were what when where which who " +
    "will with would you your someone asks something like").split(" ").forEach(function (w) { STOP[w] = 1; });

  function words(s) {
    return String(s || "").toLowerCase().replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  }

  function firstWords(s, n) {
    var t = String(s || "").replace(/\s+/g, " ").trim();
    return t.length > (n || 60) ? t.slice(0, n || 60).replace(/\s+\S*$/, "") + "…" : t;
  }

  function fmt(n) { return Number(n).toLocaleString("en-US"); }

  // Levenshtein, small strings only (domain names).
  function distance(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[m][n];
  }

  function sentences(text) {
    return String(text || "").split(/(?<=[.!?])\s+|\n+/).filter(function (s) { return s.trim(); });
  }

  /* ── links ── */
  function checkLinks(text, out) {
    var re = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+(?:org|edu|com|gov|io|net))\b/gi, m, seen = {};
    while ((m = re.exec(text))) {
      var host = m[1].toLowerCase();
      if (seen[host]) continue;
      seen[host] = 1;
      if (PUBLIC_SITES.indexOf(host) >= 0) continue;
      var near = PUBLIC_SITES.filter(function (p) { var d = distance(host, p); return d > 0 && d <= 2; })[0];
      if (near) {
        out.push({ level: "fix", kind: "Link", text: "“" + host + "” looks like a misspelling of " + near
          + ". Sierra repeats a link as written, so a reader who follows this one reaches no page." });
      } else if (!/\.edu$/.test(host)) {
        out.push({ level: "look", kind: "Link", text: "Sierra may send readers to " + host
          + ". Check that the public can open it." });
      }
    }
  }

  /* ── quotation marks ── */
  function checkQuotes(text, out) {
    var open = (text.match(/“/g) || []).length, close = (text.match(/”/g) || []).length;
    var straight = (text.match(/"/g) || []).length;
    var unbalanced = open - close;
    if (unbalanced > 0 && straight % 2 === 1) {
      out.push({ level: "look", kind: "Quote", text: "A quotation opens with a curly mark and closes with a straight one. "
        + "It reads as intended; retyping the closing mark keeps the example tidy." });
    } else if (unbalanced !== 0 || straight % 2 === 1) {
      out.push({ level: "fix", kind: "Quote", text: "A quotation mark opens and never closes, so Sierra may read the "
        + "rest of the instruction as part of the example question. Close the quotation where the question ends." });
    }
  }

  /* ── cut off ── */
  function checkEnding(text, out) {
    var t = String(text || "").trim();
    if (!t) return;
    var ends = /[.!?:)”"\]]$/.test(t) || /https?:\/\/\S+$/.test(t);
    if (ends) return;
    if (t.length === OLD_RULE_MAX) {
      out.push({ level: "fix", kind: "Cut off", text: "It stops mid-sentence at exactly " + OLD_RULE_MAX
        + " characters, the limit before August 12, 2026, so the end was likely cut when it was saved. Finish the last sentence." });
    } else {
      out.push({ level: "look", kind: "Cut off", text: "It ends without a period. Check that the last sentence is complete." });
    }
  }

  /* ── internal names, outside a sentence that forbids them ── */
  function checkNames(text, out, surface) {
    var found = [], why = "", tabOnly = false;
    sentences(text).forEach(function (s) {
      if (/\bnever\b|\bdo not name\b|\bdon't name\b/i.test(s)) return;
      INTERNAL_NAMES.forEach(function (pair) {
        var re = new RegExp("(^|[^A-Za-z])" + pair[0].replace(/ /g, "\\s+") + "(?![A-Za-z])");
        if (!re.test(s)) return;
        var low = pair[0].toLowerCase();
        if (found.some(function (f) { return f.toLowerCase() === low; })) return;
        found.push(pair[0]);
        if (!why) why = pair[1];
        if (/\b(from|in|on) the My College\b/i.test(s)) tabOnly = true;
      });
    });
    if (!found.length) return;
    var named = found.length === 1 ? found[0] : found.slice(0, -1).join(", ") + " and " + found[found.length - 1];
    var fix = tabOnly && surface
      ? " Applies already limits this instruction to " + placeWord(surface) + ", so the words naming the tab can go."
      : tabOnly
        ? " If it names the tab only to say where the instruction applies, set Applies to that place and drop the name."
        : " Describe what it holds instead.";
    out.push({ level: "look", kind: "Internal name", text: "It names " + named + (found.length === 1 ? ", " + why : "")
      + ". Sierra may repeat " + (found.length === 1 ? "the name" : "the names") + " to a reader who cannot open "
      + (found.length === 1 ? "it" : "them") + "." + fix });
  }

  /* ── asks Sierra to open a website ── */
  function checkWebsite(text, out) {
    if (/\b(scan|browse|visit|crawl|go to|look up|search)\b[^\n]{0,40}?\b(website|web site|web page|webpage)\b/i.test(text)) {
      out.push({ level: "fix", kind: "Website", text: "It asks Sierra to open a website. She cannot open pages while "
        + "she answers; she reads what the team loads for her. Give her the link to share, or the facts themselves." });
    }
  }

  /* ── said already by another switched-on instruction ── */
  function checkOverlap(text, others, out) {
    var mine = words(text);
    if (mine.length < 6) return;
    others.forEach(function (o) {
      var theirs = words(o.rule), best = "";
      var have = {};
      // Five words, three of them more than glue: a four-word run is usually a
      // name ("the CPL Fact Sheet", "credit for prior learning"), not a rule.
      for (var i = 0; i + 5 <= theirs.length; i++) have[theirs.slice(i, i + 5).join(" ")] = 1;
      for (var a = 0; a + 5 <= mine.length; a++) {
        if (!have[mine.slice(a, a + 5).join(" ")]) continue;
        // grow the run while it keeps matching
        for (var b = a + 5; b <= mine.length; b++) {
          var run = mine.slice(a, b).join(" ");
          if (b - a > 5 && (" " + theirs.join(" ") + " ").indexOf(" " + run + " ") < 0) break;
          var content = mine.slice(a, b).filter(function (w) { return !STOP[w]; }).length;
          if (content >= 3 && run.length > best.length) best = run;
        }
      }
      if (best) {
        out.push({ level: "look", kind: "Said already", text: "The instruction that begins \u201c" + firstWords(o.rule)
          + "\u201d also says \u201c" + best + "\u201d. Sierra receives both, so if the two say the same thing, this one "
          + "can leave it out and keep the space.", ref: o.id });
      }
    });
  }

  /* ── space: what the function would send, per place ── */
  function sendSet(rows, surface) {
    var out = 0, sent = [], dropped = [];
    var list = rows.filter(function (r) { return !r.surface || r.surface === surface; }).slice(0, SENT_CAP);
    var stopped = false;
    list.forEach(function (r) {
      var rule = String(r.rule || "").trim().slice(0, RULE_MAX);
      if (!rule) return;
      if (stopped || out + rule.length > TOTAL_MAX) { stopped = true; dropped.push(r); return; }
      out += rule.length + 3;
      sent.push(r);
    });
    return { used: out, sent: sent, dropped: dropped };
  }

  var PLACE_WORD = {
    "": "everywhere Sierra appears", "my-college": "My College", "public": "the public page",
    "cobi-assistant": "Sierra AI in COBI", "fact-sheet": "the Fact Sheet",
  };
  function placeWord(s) { return PLACE_WORD[s || ""] || s; }

  function space(draft, ctx) {
    // newest first, as the function reads them; the draft replaces its own row
    // when editing, and is the newest when new.
    var rows = (ctx.active || []).slice();
    var mine = { id: ctx.editingId || "draft", rule: draft, surface: ctx.surface || null };
    var at = -1;
    rows.forEach(function (r, i) { if (ctx.editingId && r.id === ctx.editingId) at = i; });
    if (at >= 0) rows[at] = mine; else rows.unshift(mine);
    var places = {};
    rows.forEach(function (r) { if (r.surface) places[r.surface] = 1; });
    var keys = mine.surface ? [mine.surface] : [""].concat(Object.keys(places));
    return keys.map(function (k) {
      var s = sendSet(rows, k || "__none__");
      return { place: k, used: s.used, left: TOTAL_MAX - s.used, dropped: s.dropped.filter(function (r) { return r.id !== mine.id; }),
        draftDropped: s.dropped.some(function (r) { return r.id === mine.id; }) };
    });
  }

  function checkSpace(draft, ctx, out) {
    var res = space(draft, ctx);
    var worst = res.slice().sort(function (a, b) { return b.dropped.length - a.dropped.length || b.used - a.used; })[0];
    if (!worst) return res;
    if (worst.dropped.length) {
      var oldest = worst.dropped[worst.dropped.length - 1];
      out.push({ level: "fix", kind: "Space", text: "Saved this way, " + (worst.dropped.length === 1 ? "one instruction" : worst.dropped.length + " instructions")
        + " would stop reaching Sierra on " + placeWord(worst.place) + ", because she receives the newest first and "
        + fmt(TOTAL_MAX) + " characters in all. The oldest to go: “" + firstWords(oldest.rule) + "”"
        + (oldest.d ? " (" + oldest.d + ")" : "") + ". Shorten this one, or switch off one you no longer need." });
    } else {
      out.push({ level: worst.left < 400 ? "look" : "ok", kind: "Space", text: "Sierra would receive " + fmt(worst.used) + " of "
        + fmt(TOTAL_MAX) + " characters of instructions on " + placeWord(worst.place) + ", leaving " + fmt(worst.left) + "." });
    }
    return res;
  }

  function check(draft, ctx) {
    ctx = ctx || {};
    var text = String(draft || "");
    var out = [];
    if (!text.trim()) return { findings: out, space: [] };
    var others = (ctx.active || []).filter(function (r) { return r.id !== ctx.editingId; });
    checkLinks(text, out);
    checkQuotes(text, out);
    checkEnding(text, out);
    checkWebsite(text, out);
    checkNames(text, out, ctx.surface);
    checkOverlap(text, others, out);
    // A display rule has its own budget (GUIDANCE_MAX_DISPLAY, billed after the
    // directives), so the directive count says nothing about it.
    var sp = ctx.space === false ? [] : checkSpace(text, ctx, out);
    var rank = { fix: 0, look: 1, ok: 2 };
    out.sort(function (a, b) { return rank[a.level] - rank[b.level]; });
    return { findings: out, space: sp };
  }

  var api = { check: check, space: space, RULE_MAX: RULE_MAX, TOTAL_MAX: TOTAL_MAX, SENT_CAP: SENT_CAP,
    PUBLIC_SITES: PUBLIC_SITES, _distance: distance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SierraWordingCheck = api;
})(typeof window !== "undefined" ? window : this);
