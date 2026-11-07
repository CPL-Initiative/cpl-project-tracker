/* The CPL-AI recommendations, inside COBI's Exhibits tab (#exhibits/cpl-ai).
 *
 * Sam, 2026-11-06 (SkyLantern): "connect CPL-AI in the Exhibits tab and make sure we can host all the data, which for
 * now will not have any further updates. Malone is working on how to integrate the process in MAP, but we can focus
 * on making the data available and useful."
 *
 * Reads the hosted snapshot kb/_build_cpl_ai_hosted.py writes: kb/cpl_ai/hosted/index.json (115 certifications, the
 * credit and caveat word for word, the three evidence tiers) and, when a certification opens, its gzipped shard
 * (every course pair in all three tiers with the full report: scores, the domain-by-domain alignment with quoted
 * evidence, the course outline's outcomes and skills, the sources). The view lists the certifications, opens one to
 * its pairs (one line each, filtered by evidence, college and search, drawn a batch at a time as the reader nears the
 * end), and opens a pair to its report, with a link to the same report on the CPL-AI page. Each certification names its
 * common exhibit (kb/cpl_ai/exhibit_join.json, Sam 2026-11-06: "join the 115 to common exhibits"), and for an exhibit MAP
 * awards, who awards it and which colleges hold a Strong evidence course and do not award it yet (the Credential
 * Catalog's library/adopt/adopt_data.json, read when such a certification opens). It writes nothing and
 * remembers no filter (Sam, 2026-10-21); #exhibits/cpl-ai/<code> opens one certification.
 *
 * exhibits.js mounts it: CPL_EXHIBITS_CPLAI.mount(host, { onChange }) on every render of the view.
 */
(function () {
  "use strict";

  var INDEX_URL = "kb/cpl_ai/hosted/index.json";
  var JOIN_URL = "kb/cpl_ai/exhibit_join.json";          /* kb/_build_cpl_ai_join.py: the 115 joined to common exhibits */
  var ADOPT_URL = "library/adopt/adopt_data.json";      /* the Credential Catalog's daily file: who awards each exhibit */
  var KIND = { exact: "Common exhibit", named_under: "Named under another exhibit", related: "Related exhibit" };
  var HAS = [["", "Every certification"], ["exact", "With a common exhibit"], ["named_under", "Named under another exhibit"], ["related", "Related exhibit only"], ["none", "No exhibit yet"]];
  var SHARD_DIR = "kb/cpl_ai/hosted/shards/";
  var BATCH = 100;
  var TIER_ORDER = ["1", "2", "3"];

  var S = { index: null, error: null, loading: null, shards: {}, shardErr: {}, code: null, pair: null,
    q: "", college: "", tiers: { "1": true, "2": true, "3": true }, sort: "title", shown: BATCH, onChange: null,
    join: null, has: "", adopt: null, adoptErr: null, adoptLoading: null };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "cls") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function pct(x) { return x == null ? "" : Math.round(Number(x) * 100) + "%"; }
  function word(text, fn, attrs) {
    var b = el("button", Object.assign({ type: "button", cls: "exh-w" }, attrs || {}), [text]);
    b.addEventListener("click", fn);
    return b;
  }
  function changed() { if (typeof S.onChange === "function") S.onChange(); }

  /* A shard is gzipped in the repo; Pages may or may not unpack it on the way. Unpack only what is still gzip. */
  function decode(buf) {
    var b = new Uint8Array(buf);
    if (b.length > 1 && b[0] === 0x1f && b[1] === 0x8b) {
      if (typeof DecompressionStream !== "function" || typeof Response !== "function" || typeof Blob !== "function") {
        return Promise.reject(new Error("this browser cannot unpack the data"));
      }
      return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).text().then(JSON.parse);
    }
    return Promise.resolve(JSON.parse(new TextDecoder("utf-8").decode(b)));
  }

  function load() {
    if (S.index) return Promise.resolve(S.index);
    if (S.loading) return S.loading;
    var join = fetch(JOIN_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { S.join = j; }, function () { S.join = null; });   /* the view stands without the join */
    S.loading = fetch(INDEX_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { return join.then(function () { S.index = d; S.error = null; return d; }); })
      .catch(function (e) { S.error = e && e.message || String(e); })
      .then(function (d) { S.loading = null; changed(); return d; });
    return S.loading;
  }
  function line(code) { return S.index ? S.index.credentials.filter(function (c) { return c.code === code; })[0] || null : null; }
  function loadShard(code) {
    var ln = line(code);
    if (!ln || S.shards[code] || S.shardErr[code] === "loading") return Promise.resolve(S.shards[code] || null);
    S.shardErr[code] = "loading";
    return fetch(SHARD_DIR + ln.file, { cache: "force-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(decode)
      .then(function (d) { S.shards[code] = d; delete S.shardErr[code]; })
      .catch(function (e) { S.shardErr[code] = e && e.message || String(e); })
      .then(function () { changed(); return S.shards[code] || null; });
  }

  function joinOf(code) { return S.join && S.join.joins ? S.join.joins[code] || null : null; }
  function loadAdopt() {
    if (S.adopt || S.adoptLoading) return S.adoptLoading || Promise.resolve(S.adopt);
    S.adoptLoading = fetch(ADOPT_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { S.adopt = d; }, function (e) { S.adoptErr = e && e.message || String(e); })
      .then(function () { S.adoptLoading = null; changed(); });
    return S.adoptLoading;
  }
  /* The MAP colleges that award a joined certification's exhibit(s), as MAP's college names; null until the file is read. */
  function awarding(code) {
    var j = joinOf(code);
    if (!j || j.kind === "related" || !S.adopt) return null;
    var names = {}, want = {};
    j.exhibits.forEach(function (e) { want[e] = true; });
    (S.adopt.credentials || []).forEach(function (c) {
      if (want[c.t]) (c.a || []).forEach(function (a) { var col = S.adopt.colleges[a[0]]; if (col) names[col[0]] = true; });
    });
    return names;
  }
  /* A CPL-AI college as MAP names it (the join file's crosswalk), or null. */
  function mapCollege(name) { return S.join && S.join.colleges ? S.join.colleges[name] || null : null; }

  /* open(code) a certification; open(null) the list; open(null, null, q) the list searched to q (the Exhibits List's row
     names an exhibit with several certifications this way; the list's search reads the exhibit names). */
  function open(code, pairId, q) {
    S.code = code || null; S.pair = pairId || null; S.shown = BATCH;
    if (!code) { S.q = q || ""; S.college = ""; S.tiers = { "1": true, "2": true, "3": true }; S.has = ""; }
    if (code) { loadShard(code); var j = joinOf(code); if (j && j.kind !== "related") loadAdopt(); }
    changed();
  }
  function address() { return "exhibits/cpl-ai" + (S.code ? "/" + encodeURIComponent(S.code) : ""); }

  /* ── pure parts (tests) ── */
  function credRows(index, f, join) {
    var q = (f.q || "").toLowerCase(), ci = f.college ? index.colleges.indexOf(f.college) : -1;
    var J = join && join.joins || {};
    var out = index.credentials.map(function (c) {
      var t = c.by_tier;
      if (ci >= 0) { var b = (c.by_college || {})[ci]; if (!b) return null; t = { "1": b[0], "2": b[1], "3": b[2] }; }
      return { c: c, t: t, n: t["1"] + t["2"] + t["3"] };
    }).filter(function (r) {
      if (!r) return false;
      r.j = J[r.c.code] || null;
      if (f.has && (f.has === "none" ? r.j : !r.j || r.j.kind !== f.has)) return false;
      var hay = r.c.title + " " + (r.c.disciplines || []).join(" ") + " " + (r.j ? r.j.exhibits.join(" ") : "");
      return !q || hay.toLowerCase().indexOf(q) >= 0;
    });
    out.sort(f.sort === "most" ? function (a, b) { return (b.t["1"] - a.t["1"]) || (b.n - a.n) || a.c.title.localeCompare(b.c.title); }
      : function (a, b) { return a.c.title.localeCompare(b.c.title, "en", { sensitivity: "base", numeric: true }); });
    return out;
  }
  function pairRows(shard, f) {
    var q = (f.q || "").toLowerCase();
    return shard.pairs.filter(function (p) {
      var co = shard.courses[p.course] || {};
      if (!f.tiers[String(p.tier)]) return false;
      if (f.college && co.college !== f.college) return false;
      if (q && (co.college + " " + co.code + " " + co.title + " " + co.discipline).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function pairCsv(index, shard, rows, aw) {
    var head = ["Certification", "College", "Course", "Course title", "Discipline", "Units", "Evidence", "Relevance", "Alignment ratio", "Similarity", "Domains matched", "Domains", "Awards it in MAP", "CPL-AI report"];
    var lines = [head.map(csvCell).join(",")];
    rows.forEach(function (p) {
      var co = shard.courses[p.course] || {};
      lines.push([shard.credential.title, co.college, co.code, co.title, co.discipline, co.units && co.units.display || "", index.tiers[String(p.tier)],
        p.relevance, p.ratio, p.cosine, p.matched_n, p.domains_n, aw ? (aw[mapCollege(co.college)] ? "Yes" : "No") : "", reportUrl(index, p.id)].map(csvCell).join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }
  function reportUrl(index, id) { return (index.page || "https://map.rccd.edu/CPL-AI/") + "?report=" + encodeURIComponent(id) + "#recommendations"; }
  function download(name, text) {
    var a = el("a", { href: URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  /* ── drawing ── */
  function about(index) {
    return el("div", { cls: "cai-about" }, [
      el("p", {}, ["Every course and certification pair the CPL-AI recommendations rate, in all three evidence tiers, with each pair's full report. ",
        "Read from ", el("a", { href: index.page, target: "_blank", rel: "noopener", text: "the CPL-AI page" }),
        " on " + new Date(index.fetched_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        + " and hosted here as it stood; the source publishes no further updates for now."]),
      el("p", { cls: "exh-small exh-muted", text: index.credit }),
      el("p", { cls: "exh-small exh-muted", text: index.caveat })]);
  }
  function tierWords(index) {
    return el("div", { cls: "exh-views cai-tiers", role: "group", "aria-label": "Evidence" }, [el("span", { cls: "exh-muted", text: "Evidence" })].concat(TIER_ORDER.map(function (k) {
      return word(index.tiers[k], function () { S.tiers[k] = !S.tiers[k]; S.shown = BATCH; changed(); }, { "aria-pressed": String(!!S.tiers[k]) });
    })));
  }
  function collegePick(index, id) {
    var sel = el("select", { id: id, cls: "cai-select" }, [el("option", { value: "", text: "Every college" })].concat(index.colleges.map(function (c) {
      return el("option", { value: c, text: c });
    })));
    sel.value = S.college;
    sel.addEventListener("change", function () { S.college = sel.value; S.shown = BATCH; changed(); });
    return el("label", { cls: "cai-field", "for": id }, [el("span", { text: "College" }), sel]);
  }
  function search(id, label, placeholder) {
    var inp = el("input", { id: id, type: "search", cls: "cai-input", value: S.q, placeholder: placeholder, autocomplete: "off" });
    var t = null;
    inp.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { S.q = inp.value.trim(); S.shown = BATCH; changed(); var again = document.getElementById(id); if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); } }, 200);
    });
    return el("label", { cls: "cai-field", "for": id }, [el("span", { text: label }), inp]);
  }

  function drawList(host, index) {
    var c = index.counts;
    host.appendChild(el("p", { cls: "exh-state", text: fmt(c.pairs) + " pairs: " + fmt(c.certifications) + " certifications, " + fmt(c.colleges) + " colleges, "
      + fmt(c.courses) + " courses; " + TIER_ORDER.map(function (k) { return fmt(c.by_tier[k]) + " " + index.tiers[k].toLowerCase(); }).join(", ") + "." }));
    host.appendChild(el("div", { cls: "cai-bar" }, [search("cai-q", "Search", "Certification or discipline"), collegePick(index, "cai-college")]));
    if (S.join) {
      var jc = S.join.counts || {};
      host.appendChild(el("div", { cls: "exh-views", role: "group", "aria-label": "Joined to a common exhibit" }, [el("span", { cls: "exh-muted", text: "Exhibit" })].concat(HAS.map(function (h) {
        var n = h[0] ? jc[h[0]] : null;
        return word(h[1] + (n != null ? " (" + fmt(n) + ")" : ""), function () { S.has = h[0]; changed(); }, { "aria-pressed": String(S.has === h[0]) });
      }))));
    }
    var rows = credRows(index, S, S.join);
    host.appendChild(el("div", { cls: "cai-bar" }, [
      el("div", { cls: "exh-views", role: "group", "aria-label": "Sort" }, [el("span", { cls: "exh-muted", text: "Sort" }),
        word("A to Z", function () { S.sort = "title"; changed(); }, { "aria-pressed": String(S.sort !== "most") }),
        word("Most strong evidence first", function () { S.sort = "most"; changed(); }, { "aria-pressed": String(S.sort === "most") })]),
      el("span", { cls: "exh-muted exh-small", text: fmt(rows.length) + (rows.length === 1 ? " certification" : " certifications") + (S.college ? " paired at " + S.college : "") })]));
    var tb = el("tbody");
    rows.forEach(function (r) {
      tb.appendChild(el("tr", {}, [
        el("th", { scope: "row", title: r.c.title }, [word(r.c.title, function () { open(r.c.code); })]),
        el("td", { cls: "exh-num", text: fmt(r.t["1"]) }), el("td", { cls: "exh-num", text: fmt(r.t["2"]) }), el("td", { cls: "exh-num", text: fmt(r.t["3"]) }),
        el("td", { cls: "exh-num", text: S.college ? "" : fmt(r.c.colleges) }), el("td", { cls: "exh-num", text: S.college ? "" : fmt(r.c.courses) }),
        el("td", { cls: "cai-clip", title: r.j ? KIND[r.j.kind] + ": " + r.j.exhibits.join("; ") + ". " + r.j.reason : "No common exhibit yet" },
          r.j ? [r.j.exhibits[0], r.j.kind !== "exact" ? el("span", { cls: "exh-muted", text: " (" + (r.j.kind === "related" ? "related" : "named under") + ")" }) : null] : [el("span", { cls: "exh-muted", text: "None yet" })]),
        el("td", { cls: "cai-clip", title: (r.c.disciplines || []).join(", "), text: (r.c.disciplines || []).join(", ") })]));
    });
    var table = el("table", { cls: "exh-pq cai-one" }, [
      el("colgroup", {}, ["27%", "8%", "10%", "8%", "7%", "7%", "21%", "12%"].map(function (w) { return el("col", { style: "width:" + w }); })),
      el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: "Certification" }), el("th", { scope: "col", cls: "exh-num", text: index.tiers["1"] }),
        el("th", { scope: "col", cls: "exh-num", text: index.tiers["2"] }), el("th", { scope: "col", cls: "exh-num", text: index.tiers["3"] }),
        el("th", { scope: "col", cls: "exh-num", text: "Colleges" }), el("th", { scope: "col", cls: "exh-num", text: "Courses" }), el("th", { scope: "col", text: "Common exhibit" }), el("th", { scope: "col", text: "Disciplines" })])]), tb]);
    host.appendChild(rows.length ? el("div", { cls: "exh-tblwrap cai-box", role: "region", "aria-label": "CPL-AI certifications", tabindex: "0" }, [table])
      : el("p", { cls: "exh-empty", text: "No certification matches." }));
  }

  function drawCert(host, index) {
    var ln = line(S.code);
    host.appendChild(el("p", {}, [word("All certifications", function () { open(null); })]));
    if (!ln) { host.appendChild(el("p", { cls: "exh-empty", text: "No CPL-AI certification has the code " + S.code + "." })); return; }
    host.appendChild(el("h3", { cls: "exh-q", id: "cai-cert-h", text: ln.title }));
    var sh = S.shards[S.code];
    if (!sh) {
      var e = S.shardErr[S.code];
      host.appendChild(el("p", { cls: "exh-empty", text: e && e !== "loading" ? "The certification's data could not be read (" + e + ")." : "Reading " + fmt(ln.pairs) + " pairs…" }));
      return;
    }
    if (sh.credential.description) host.appendChild(el("p", { cls: "cai-prose", text: sh.credential.description }));
    if ((sh.credential.competencies || []).length) host.appendChild(el("details", { cls: "cai-more" }, [el("summary", { text: "Competencies the certification names (" + sh.credential.competencies.length + ")" }),
      el("ul", {}, sh.credential.competencies.map(function (t) { return el("li", { text: t }); }))]));
    host.appendChild(exhibitBlock(index, sh));
    if (S.pair) drawReport(host, index, sh);
    host.appendChild(tierWords(index));
    host.appendChild(el("div", { cls: "cai-bar" }, [search("cai-q2", "Search", "College, course or discipline"), collegePick(index, "cai-college2")]));
    var rows = pairRows(sh, S), shown = rows.slice(0, S.shown), aw = awarding(S.code);
    host.appendChild(el("div", { cls: "cai-bar" }, [el("span", { cls: "exh-state", text: fmt(rows.length) + " of " + fmt(sh.pairs.length) + " pairs" }),
      word("Download these pairs (CSV)", function () { download("cpl-ai-" + S.code + ".csv", pairCsv(index, sh, rows, aw)); })]));
    if (!rows.length) { host.appendChild(el("p", { cls: "exh-empty", text: "No pair matches these filters." })); return; }
    var tb = el("tbody");
    shown.forEach(function (p) {
      var co = sh.courses[p.course] || {};
      var on = S.pair === p.id;
      tb.appendChild(el("tr", on ? { cls: "cai-on" } : {}, [
        el("td", { cls: "cai-clip", title: co.college, text: co.college }),
        el("th", { scope: "row", cls: "cai-clip", title: co.code + " " + co.title }, [word(co.code + " " + co.title, function () { S.pair = p.id; changed(); var h = document.getElementById("cai-rep-h"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); } }, on ? { "aria-current": "true" } : {})]),
        el("td", { cls: "cai-clip", title: co.discipline, text: co.discipline }),
        el("td", { cls: "cai-clip", text: index.tiers[String(p.tier)] }),
        el("td", { cls: "exh-num", text: p.matched_n + " of " + p.domains_n }),
        el("td", { cls: "exh-num", text: pct(p.ratio) }),
        el("td", { cls: "exh-num", text: co.units && co.units.display || "" }),
        el("td", { text: aw ? (aw[mapCollege(co.college)] ? "Yes" : "") : "" })]));
    });
    if (shown.length < rows.length) tb.appendChild(el("tr", { cls: "cai-sentinel", id: "cai-sentinel" }, [el("td", { colspan: "8" }, [
      word("Show more (" + fmt(rows.length - shown.length) + " more)", function () { S.shown += BATCH; changed(); })])]));
    var wrap = el("div", { cls: "exh-tblwrap cai-box", id: "cai-pairs-wrap", role: "region", "aria-label": "Pairs for " + ln.title, tabindex: "0" }, [el("table", { cls: "exh-pq cai-one" }, [
      el("colgroup", {}, ["19%", "30%", "16%", "12%", "7%", "6%", "4%", "6%"].map(function (w) { return el("col", { style: "width:" + w }); })),
      el("thead", {}, [el("tr", {}, ["College", "Course", "Discipline", "Evidence", "Domains matched", "Alignment", "Units", "Awards it"].map(function (t, i) {
        return el("th", { scope: "col", cls: i >= 4 && i < 7 ? "exh-num" : null, text: t });
      }))]), tb])]);
    host.appendChild(wrap);
    watch(wrap);
  }

  /* The next batch draws as the reader nears the end of the box; Show more stays where IntersectionObserver is absent. */
  var obs = null;
  function watch(wrap) {
    if (obs) { obs.disconnect(); obs = null; }
    var s = document.getElementById("cai-sentinel");
    if (!s || typeof window.IntersectionObserver !== "function") return;
    obs = new window.IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      obs.disconnect(); obs = null;
      var top = wrap.scrollTop;
      S.shown += BATCH; changed();
      var again = document.getElementById("cai-pairs-wrap"); if (again) again.scrollTop = top;
    }, { root: wrap, rootMargin: "0px 0px 300px 0px" });
    obs.observe(s);
  }

  /* The certification's common exhibit, and what MAP shows for it: who awards it, and which colleges hold a Strong
     evidence course and do not award it yet (the adoption leads). */
  function exhibitBlock(index, sh) {
    var j = joinOf(S.code), box = el("div", { cls: "cai-exh" });
    if (!j) {
      box.appendChild(el("p", {}, [el("b", { text: "No common exhibit yet. " }), "No MAP exhibit holds this certification; a college that awards it would build the first."]));
      return box;
    }
    box.appendChild(el("p", {}, [el("b", { text: KIND[j.kind] + ": " }), j.exhibits.join("; ") + ". ", el("span", { cls: "exh-muted", text: j.reason })]));
    if (j.kind === "named_under") box.appendChild(el("p", { cls: "exh-small exh-muted", text: "Flagged for a title fix in the reference: the exhibit's own title names something broader or different." }));
    if (j.kind === "related") return box;
    var aw = awarding(S.code);
    if (!aw) { box.appendChild(el("p", { cls: "exh-small exh-muted", text: S.adoptErr ? "Who awards it in MAP could not be read (" + S.adoptErr + ")." : "Reading who awards it in MAP…" })); return box; }
    var awN = Object.keys(aw).length, strong = {}, lead = {};
    sh.pairs.forEach(function (p) {
      if (p.tier !== 1) return;
      var co = sh.courses[p.course] || {}, m = mapCollege(co.college);
      strong[co.college] = true;
      if (!m || !aw[m]) (lead[co.college] = lead[co.college] || []).push(co.code);
    });
    var leads = Object.keys(lead).sort();
    box.appendChild(el("p", {}, [awN ? "Awarded at " + fmt(awN) + (awN === 1 ? " college" : " colleges") + " in MAP. " : "No college awards it in MAP yet, or the exhibit's credit is still being reviewed. ",
      fmt(Object.keys(strong).length) + (Object.keys(strong).length === 1 ? " college holds" : " colleges hold") + " a Strong evidence course; " + fmt(leads.length) + " of them " + (leads.length === 1 ? "does" : "do") + " not award it yet."]));
    if (leads.length) box.appendChild(el("details", { cls: "cai-more" }, [el("summary", { text: "The " + fmt(leads.length) + (leads.length === 1 ? " college" : " colleges") + " with a Strong evidence course that do not award it yet" }),
      el("ul", { cls: "cai-leads" }, leads.map(function (c) { return el("li", { text: c + ": " + lead[c].join(", ") }); }))]));
    return box;
  }

  function drawReport(host, index, sh) {
    var p = sh.pairs.filter(function (x) { return x.id === S.pair; })[0];
    if (!p) return;
    var co = sh.courses[p.course] || {};
    var sec = el("section", { cls: "cai-report", "aria-labelledby": "cai-rep-h" });
    sec.appendChild(el("div", { cls: "cai-bar" }, [el("h4", { id: "cai-rep-h", cls: "exh-q", text: co.college + ", " + co.code + " " + co.title }),
      word("Close the report", function () { S.pair = null; changed(); })]));
    var dl = el("dl", { cls: "cai-dl" });
    [["Evidence", index.tiers[String(p.tier)]], ["Alignment ratio", pct(p.ratio)], ["Similarity", p.cosine != null ? String(p.cosine) : ""],
      ["Relevance", p.relevance ? p.relevance.charAt(0) + p.relevance.slice(1).toLowerCase() : ""], ["Domains matched", p.matched_n + " of " + p.domains_n],
      ["Units", co.units && co.units.display || ""], ["Discipline", co.discipline]].forEach(function (r) {
      if (r[1]) { dl.appendChild(el("dt", { text: r[0] })); dl.appendChild(el("dd", { text: r[1] })); }
    });
    sec.appendChild(dl);
    if (!p.report) { sec.appendChild(el("p", { cls: "exh-muted", text: "The CPL-AI page served no full report for this pair; the catalog's scores above are what it holds." })); }
    if (p.snapshot.length) sec.appendChild(el("ul", { cls: "cai-snap" }, p.snapshot.map(function (t) { return el("li", { text: t }); })));
    if (p.disclaimer) sec.appendChild(el("p", { cls: "exh-small exh-muted", text: p.disclaimer }));
    if (p.domains.length) {
      var tb = el("tbody");
      p.domains.forEach(function (d) {
        tb.appendChild(el("tr", {}, [el("th", { scope: "row", text: d.name }),
          el("td", { text: d.courseCovered ? "Covered" : "Not covered" }), el("td", { text: d.credentialCovered ? "Covered" : "Not covered" }),
          el("td", {}, [el("ul", { cls: "cai-ev" }, (d.courseEvidence || []).map(function (t) { return el("li", { text: t }); }))]),
          el("td", {}, [el("ul", { cls: "cai-ev" }, (d.credentialEvidence || []).map(function (t) { return el("li", { text: t }); }))])]));
      });
      sec.appendChild(el("div", { cls: "exh-tblwrap", role: "region", "aria-label": "Domain alignment", tabindex: "0" }, [el("table", { cls: "exh-pq cai-dom" }, [
        el("colgroup", {}, ["20%", "9%", "11%", "30%", "30%"].map(function (w) { return el("col", { style: "width:" + w }); })),
        el("thead", {}, [el("tr", {}, ["Domain", "Course", "Certification", "Course evidence", "Certification evidence"].map(function (t) { return el("th", { scope: "col", text: t }); }))]), tb])]));
    }
    if (p.scope_note) sec.appendChild(el("p", { cls: "exh-small exh-muted", text: "Note: " + p.scope_note }));
    if (co.description) sec.appendChild(el("details", { cls: "cai-more" }, [el("summary", { text: "The course outline: description, outcomes and skills" }),
      el("p", { cls: "cai-prose", text: co.description }),
      (co.outcomes || []).length ? el("h5", { text: "Outcomes" }) : null, (co.outcomes || []).length ? el("ul", {}, co.outcomes.map(function (t) { return el("li", { text: t }); })) : null,
      (co.skills || []).length ? el("h5", { text: "Skills" }) : null, (co.skills || []).length ? el("ul", {}, co.skills.map(function (t) { return el("li", { text: t }); })) : null]));
    if (p.sources.length) sec.appendChild(el("details", { cls: "cai-more" }, [el("summary", { text: "Sources" }),
      el("ol", {}, p.sources.map(function (s) { return el("li", { text: sh.sources[s[1]] || "" }); }))]));
    sec.appendChild(el("p", {}, [el("a", { href: reportUrl(index, p.id), target: "_blank", rel: "noopener", text: "This report on the CPL-AI page" })]));
    host.appendChild(sec);
  }

  function mount(host, opts) {
    S.onChange = opts && opts.onChange || S.onChange;
    ensureCss();
    while (host.firstChild) host.removeChild(host.firstChild);
    var index = S.index;
    if (!index) {
      host.appendChild(el("p", { cls: "exh-empty", text: S.error ? "The CPL-AI data could not be read (" + S.error + ")." : "Reading the CPL-AI data…" }));
      if (!S.error) load();
      return;
    }
    host.appendChild(about(index));
    if (S.code) drawCert(host, index); else drawList(host, index);
  }

  var CSS = [
    ".cai-about { display:grid; gap:6px; }",
    ".cai-about p { margin:0; max-width:var(--cpl-measure,none); }",
    ".cai-bar { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:8px 18px; }",
    ".cai-field { display:grid; gap:3px; font-size:.86rem; color:var(--text-muted); min-width:min(100%, 240px); }",
    ".cai-input, .cai-select { font:inherit; font-size:.95rem; color:var(--text-body); background:var(--surface); border:1px solid var(--border-strong); border-radius:6px; padding:5px 8px; min-height:30px; }",
    ".cai-box { max-height:max(360px, 64vh); overflow:auto; }",
    ".cai-one { min-width:860px; }",
    ".cai-one th, .cai-one td { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:middle; }",
    ".cai-one thead th { position:sticky; top:0; background:var(--surface); z-index:1; white-space:normal; }",
    ".cai-one button.exh-w { display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:bottom; }",
    ".cai-one tr.cai-on td, .cai-one tr.cai-on th { background:var(--surface-subtle); }",
    ".cai-one tr.cai-sentinel td { text-align:center; padding:10px; }",
    ".cai-report { display:grid; gap:10px; padding:12px 14px; border:1px solid var(--border-strong); border-radius:10px; background:var(--surface); }",
    ".cai-dl { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:6px 18px; margin:0; }",
    ".cai-dl dt { color:var(--text-muted); font-size:.82rem; } .cai-dl dd { margin:0; color:var(--text-strong); font-weight:600; }",
    ".cai-dom { min-width:760px; } .cai-dom th[scope=row] { color:var(--text-strong); }",
    ".cai-ev, .cai-snap { margin:0; padding-left:1.1em; } .cai-ev li { margin-bottom:4px; }",
    ".cai-more summary { cursor:pointer; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; min-height:24px; }",
    ".cai-exh { display:grid; gap:4px; padding:8px 12px; border-left:4px solid var(--seal-blue-text); background:var(--surface-subtle); border-radius:0 8px 8px 0; }",
    ".cai-exh p { margin:0; } .cai-leads { columns:2 260px; margin:4px 0 0; padding-left:1.1em; }",
    ".cai-prose { margin:0; max-width:var(--cpl-measure,none); color:var(--text-body); }",
    "button.exh-w[aria-pressed=true] { color:var(--text-strong); font-weight:600; text-decoration-thickness:3px; text-decoration-color:var(--seal-blue-text); }",
    "@media (max-width:560px) { .cai-bar { flex-direction:column; align-items:stretch; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cai-css")) return;
    document.head.appendChild(el("style", { id: "cai-css", text: CSS }));
  }

  window.CPL_EXHIBITS_CPLAI = { mount: mount, load: load, loadShard: loadShard, open: open, address: address, _state: S,
    _decode: decode, _credRows: credRows, _pairRows: pairRows, _pairCsv: pairCsv, _reportUrl: reportUrl, _awarding: awarding };
})();
