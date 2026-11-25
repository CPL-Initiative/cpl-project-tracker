// Gather: courses whose words match, into one common course (S725, SkyPlover, 2026-11-25).
//
// Sam, 2026-11-24, at S724's checkpoint: "move all the mids with adapt in the title to one mid: Adaptive Physical
// Education and set the units to 0-3", then find every local course with adapt in its title, in another M-ID or none,
// "do a quick view to uncheck any that don't belong", and move them all into that one M-ID. On the mock's second
// version: "gather looks good as long as we can reuse this gather for other cases by changing variables (common and
// local subjects, keywords, etc." So Gather is one tool, never an adapt page: the words, the common subject, the local
// subject codes and the target are its variables, and each sits in the view's address, so a gather can be linked and
// rerun (#coci-lookup/gather?w=adapt&cs=...&ls=...&to=PEDS%20M1029). Mock (seven versions):
// https://claude.ai/artifact/PzL4Kf7oV49BGaYwF5gh1T.
//
// The words (the mock's syntax, Sam's v2 reaction):
//   space between words      every word must match (adapted swim)
//   a comma or the word or   either side may match (adapted, adaptive)
//   a minus before a word    leaves out a text that holds it (adapt -dance)
//   quotes                   keep words together as one phrase ("adapted physical")
//   a word matches the start of a word in the text: adapt finds adapted, adaptive and adaptation. Capitals do not
//   matter.
//
// The saves (DECIDED in S724, d-gather-merge-is-merge-into-rows): a merged common course is one kb_curation row,
// <M-ID> merge_into <target>, the row the Common Course Reference's merge writes and kb/_apply_curation.py already
// folds; a local course outside it is one row, CN:<control number> merge_into <target>, the row Assign and SkyView's
// re-home write. No re-mint and no alias map (Sam: "we're still in the building phase and don't need to keep an audit
// trail on mids yet"). Units follow the members and show the range they join (CLAUDE.md, Units never split an
// identity; Sam: "a range i expect them to show, not a limit"). Every save is insert-only: the rows that stand for a
// key are read first and left alone (a person's save is terminal), and the insert asks the service to ignore a
// duplicate that arrived in between. Take it back deletes exactly the rows this visit saved (course, field, value).
//
// The starting ticks are the first confidence signal Sam named (v-mid-decisions-automatic-and-fluid-sam-2026-11-24):
// a common course starts ticked when its common subject is the target's; a local course starts ticked when its common
// course sits in the target's common subject, or when its local subject code carries courses under that common
// subject elsewhere in the state. TOP never ticks a row (CLAUDE.md Rule 7, TOP is a last-in-line signal); it shows in
// the Check words beside the signal that did. Each unticked row says why.
//
// Not in this file yet, each its own write surface (Rule 10 a3): saved filters, the SLOs and objectives look-in, and
// the bars that add a description, outcomes or a link where none is on file.
//
// STATIC consumer asset, loaded by coci_lookup.js the first time the Gather view opens. All DOM via createElement and
// textContent (no innerHTML with data). CSS injected from here, on First Light tokens. Guard:
// tests/commons_gather.test.js.
(function () {
  "use strict";

  var CSS_ID = "cpl-commons-gather-css";
  var CSS = [
    ".cg { display:grid; gap:14px; color: var(--text-body); }",
    ".cg h2 { margin:0; font-size:1.05rem; color: var(--text-strong); }",
    ".cg h3 { margin:0; font-size:.95rem; color: var(--text-strong); }",
    ".cg p { margin:0; }",
    ".cg-muted { color: var(--text-muted); }",
    ".cg-small { font-size:.8rem; }",
    ".cg-card { background: var(--surface-opaque); border:1px solid var(--border); border-radius:6px; padding:10px 12px; display:grid; gap:8px; min-width:0; }",
    ".cg-ctrls { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:flex-start; }",
    ".cg-acts { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; }",
    ".cg-field { display:grid; gap:4px; font-weight:600; color: var(--text-strong); font-size:.85rem; min-width:0; }",
    ".cg-field.grow { flex:1 1 20rem; }",
    ".cg input[type=search], .cg input[type=text], .cg select { font:inherit; font-weight:400; font-size:.85rem; color: var(--text-body); background: var(--surface-opaque);" +
      " border:1px solid var(--border-strong); border-radius:4px; padding:4px 8px; min-height:30px; max-width:100%; box-sizing:border-box; }",
    ".cg-howto { display:grid; gap:2px; font-size:.8rem; flex:1 1 20rem; min-width:0; border:1px solid var(--border); border-radius:4px; padding:6px 10px; }",
    ".cg-howto b { color: var(--text-strong); }",
    ".cg-seg { display:flex; flex-wrap:wrap; gap:4px 14px; align-items:center; font-size:.85rem; }",
    ".cg-seg .lbl { font-weight:700; color: var(--text-strong); }",
    ".cg-segb { font:inherit; background:none; border:0; border-bottom:3px solid transparent; padding:2px 0; color: var(--cobalt); cursor:pointer; min-height:24px; }",
    ".cg-segb[aria-checked=true] { color: var(--text-strong); font-weight:700; border-bottom-color: var(--cobalt); }",
    // Controls are underlined words (Sam, 2026-10-09): no border, no fill, 24px tall.
    ".cg-w { font:inherit; font-size:.85rem; background:none; border:0; padding:0; color: var(--cobalt); text-decoration:underline; text-underline-offset:3px; min-height:24px; cursor:pointer; text-align:left; }",
    ".cg-w:disabled { color: var(--text-muted); cursor:default; }",
    ".cg-w.strong { font-weight:700; }",
    ".cg :focus-visible { outline:2px solid var(--cobalt); outline-offset:2px; }",
    ".cg-wrap { max-height:460px; overflow:auto; border:1px solid var(--border); border-radius:4px; }",
    ".cg-table { border-collapse:collapse; width:100%; table-layout:fixed; font-size:.82rem; font-variant-numeric:tabular-nums; }",
    ".cg-table th, .cg-table td { text-align:left; padding:4px 8px; border-bottom:1px solid var(--border); vertical-align:top; overflow-wrap:anywhere; }",
    ".cg-table th { position:sticky; top:0; z-index:1; background: var(--surface-subtle); color: var(--text-strong); }",
    ".cg-table tr.cg-f td { position:sticky; top:30px; z-index:1; background: var(--surface-opaque); }",
    ".cg-table tr.cg-f input { width:100%; min-height:24px; font-size:.75rem; padding:2px 6px; }",
    ".cg-table th .cg-grip { position:absolute; right:0; top:0; bottom:0; width:8px; cursor:col-resize; background:none; border:0; padding:0; }",
    ".cg-table th { position:sticky; }",
    // A row to check says why in words; its Check cell takes the muted mustard ink (no light tint token exists).
    ".cg-table tr.cg-check td:last-child { color: var(--mustard-text); }",
    ".cg-table tr.cg-on td:first-child { box-shadow: inset 3px 0 0 var(--cobalt); }",
    ".cg-table input[type=checkbox] { width:18px; height:18px; margin:3px 0; accent-color: var(--cobalt); }",
    ".cg-t { display:block; color: var(--text-strong); }",
    ".cg-d { display:block; font-size:.76rem; color: var(--text-muted); }",
    ".cg-outs { margin-top:4px; padding:4px 8px; border:1px solid var(--border); border-radius:4px; font-size:.78rem; }",
    ".cg-outs ul { margin:2px 0 4px; padding-left:1.1rem; }",
    ".cg-sum ul { margin:0; padding-left:1.2rem; display:grid; gap:4px; }",
    "@media (max-width:560px) { .cg-wrap { max-height:none; } .cg-table { table-layout:auto; } }",
    "@media (prefers-reduced-motion: reduce) { .cg * { transition:none !important; } }"
  ].join("\n");

  /* ── the words ─────────────────────────────────────────────────────────────── */
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  // A word matches the start of a word in the text; a phrase is its words in order with any space between.
  function startRe(w) { return new RegExp("(^|[^a-z0-9])" + w.split(/\s+/).map(esc).join("\\s+"), "i"); }
  /* parse(q) -> { test(text), groups, empty }. Groups split on a comma or a bare "or"; within one, every plain word and
     phrase must match and no minus word may. An empty query matches nothing (Gather never gathers the whole list). */
  function parse(q) {
    var groups = String(q || "").split(/,|\s+or\s+/i).map(function (g) {
      var inc = [], exc = [], re = /(-?)"([^"]+)"|(-?)([^\s"]+)/g, m;
      while ((m = re.exec(g))) {
        var neg = m[1] || m[3], w = String(m[2] || m[4] || "").trim().toLowerCase();
        if (!w || w === "-") continue;
        (neg ? exc : inc).push(startRe(w));
      }
      return { inc: inc, exc: exc };
    }).filter(function (g) { return g.inc.length; });
    return {
      groups: groups, empty: !groups.length,
      test: function (t) {
        t = String(t || "");
        return groups.some(function (g) {
          return g.inc.every(function (r) { return r.test(t); }) && !g.exc.some(function (r) { return r.test(t); });
        });
      }
    };
  }

  /* ── the address ───────────────────────────────────────────────────────────── */
  var LOOK = [["title", "Title"], ["desc", "Description"], ["both", "Title and description"]];
  function readAddress(hash) {
    var h = String(hash || "").replace(/^#/, ""), i = h.indexOf("?"), out = { w: "", look: "title", cs: "", ls: "", to: "" };
    if (i < 0) return out;
    h.slice(i + 1).split("&").forEach(function (kv) {
      var j = kv.indexOf("="), k = j < 0 ? kv : kv.slice(0, j), v = j < 0 ? "" : kv.slice(j + 1);
      try { v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { return; }
      if (k === "w") out.w = v; else if (k === "in" && LOOK.some(function (x) { return x[0] === v; })) out.look = v;
      else if (k === "cs") out.cs = v; else if (k === "ls") out.ls = v; else if (k === "to") out.to = v;
    });
    return out;
  }
  function address(tab, q) {
    var parts = [];
    if (q.w) parts.push("w=" + encodeURIComponent(q.w));
    if (q.look && q.look !== "title") parts.push("in=" + q.look);
    if (q.cs) parts.push("cs=" + encodeURIComponent(q.cs));
    if (q.ls) parts.push("ls=" + encodeURIComponent(q.ls));
    if (q.to) parts.push("to=" + encodeURIComponent(q.to));
    return tab + "/gather" + (parts.length ? "?" + parts.join("&") : "");
  }
  function lsCodes(s) { return String(s || "").toUpperCase().split(/[\s,]+/).filter(Boolean); }
  function code(id) { return String(id || "").split(" ")[0]; }
  function subjName(c) { return c ? code(c.id) + " " + (c.disc || "") : ""; }
  function units(c) {
    var lo = c.umin, hi = c.umax;
    if (lo != null && hi != null && lo !== hi) return lo + " to " + hi;
    return c.units != null ? String(c.units) : lo != null ? String(lo) : "";
  }
  function noControlNumber(ctrl) { var k = String(ctrl || "").trim().toUpperCase(); return !k || /^(NULL|N\/A|NA|NONE)$/.test(k); }
  function inList(vals) { return "in.(" + vals.map(function (v) { return encodeURIComponent('"' + String(v).replace(/"/g, "") + '"'); }).join(",") + ")"; }
  function chunks(a, n) { var out = []; for (var i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; }

  /* create(D): D.commons() the common courses [{id,title,disc,units,umin,umax,members}], D.locals() the Courses List's
     rows [{ctrl,college,subj,num,title,units,top,mid,mids,named}], D.fresh() a renewed session or null, D.rest and
     D.anon the service, D.tab the tab key, D.desc(subj, ctrl, cb), D.ccDesc(id, cb), D.outcomes(college, subj, num, cb),
     D.signIn(mount) the sign-in box, D.onAddress(addr) when the view's address changes. */
  function create(D) {
    var Q = readAddress(D.hash ? D.hash() : (typeof location !== "undefined" ? location.hash : ""));
    var S = { q: Q, ticks: {}, lticks: {}, sort: { m: [6, -1], l: [7, -1] }, /* Check, Z to A: the rows to look at first */ filt: { m: {}, l: {} }, wd: { m: {}, l: {} },
      showDesc: false, descs: { m: {}, l: {} }, descLoading: 0, open: {}, outs: {}, title: null, busy: false, said: "",
      saved: null, standing: null, decisions: null, decSig: "", node: null };

    function el(tag, a, kids) {
      var e = document.createElement(tag);
      Object.keys(a || {}).forEach(function (k) {
        var v = a[k];
        if (v == null || v === false) return;
        if (k === "text") e.textContent = v; else if (k === "cls") e.className = v; else e.setAttribute(k, v === true ? "" : v);
      });
      (kids || []).forEach(function (c) { if (c != null && c !== "") e.appendChild(typeof c === "object" ? c : document.createTextNode(String(c))); });
      return e;
    }
    function word(t, fn, a) { var b = el("button", Object.assign({ type: "button", cls: "cg-w" }, a || {}), [t]); b.addEventListener("click", fn); return b; }
    function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

    /* ── what the words find ── */
    function all() { return D.commons() || []; }
    function byId() { var m = {}; all().forEach(function (c) { m[c.id] = c; }); return m; }
    function target() { return byId()[S.q.to] || null; }
    function hay(kind, r) {
      var t = r.title || "", d = S.descs[kind][kind === "m" ? r.id : r.ctrl] || "";
      return S.q.look === "title" ? t : S.q.look === "desc" ? d : t + " " + d;
    }
    // Local subject codes that carry a course under a common course of each common subject: the second tick signal.
    var subjMemo = null;
    function subjectsOf(disc) {
      var L = D.locals() || [], C = byId();
      if (!subjMemo || subjMemo.L !== L) {
        var by = {};
        L.forEach(function (r) { var c = r.mid && C[r.mid]; if (c && c.disc) (by[c.disc] = by[c.disc] || {})[String(r.subj || "").toUpperCase()] = 1; });
        subjMemo = { L: L, by: by };
      }
      return subjMemo.by[disc] || {};
    }
    function matches() {
      var P = parse(S.q.w), T = target(), C = byId();
      var ms = P.empty ? [] : all().filter(function (c) { return c.id !== S.q.to && P.test(hay("m", c)) && (!S.q.cs || code(c.id) === S.q.cs || c.disc === S.q.cs); });
      if (T) ms.unshift(T);
      ms.forEach(function (c) { c._why = !T || c.id === T.id || c.disc === T.disc ? "" :
        "Common subject " + subjName(c) + ": its words may belong to another field."; });
      var ticked = {};
      ms.forEach(function (c) { if (mTick(c)) ticked[c.id] = 1; });
      var codes = lsCodes(S.q.ls), near = T ? subjectsOf(T.disc) : {};
      var ls = P.empty ? [] : (D.locals() || []).filter(function (r) {
        if (r.mid && (ticked[r.mid] || r.mid === S.q.to)) return false;   // its common course carries it in
        return P.test(hay("l", r)) && (!codes.length || codes.indexOf(String(r.subj || "").toUpperCase()) >= 0);
      });
      ls.forEach(function (r) {
        var c = r.mid && C[r.mid], s = String(r.subj || "").toUpperCase();
        if (noControlNumber(r.ctrl)) { r._why = "No control number in the state list: nothing to save it under."; r._lock = true; return; }
        if ((r.named || 1) > 1) { r._why = "Its control number names " + r.named + " courses in the state list, so a save could not say which."; r._lock = true; return; }
        r._lock = false;
        if (!T) { r._why = ""; return; }
        if (c && c.disc === T.disc) { r._why = ""; return; }
        if (!c && near[s]) { r._why = ""; return; }
        r._why = (c ? "Now under " + c.id + ", common subject " + subjName(c) : "Local subject " + r.subj + " carries no course under a " + code(T.id) + " common course") +
          (r.top ? " (TOP " + r.top + ")" : "") + ": its words may belong to another field.";
      });
      return { ms: ms, ls: ls, T: T };
    }
    function mTick(c) { if (c.id === S.q.to) return true; return S.ticks[c.id] != null ? S.ticks[c.id] : !c._why; }
    function lTick(r) { if (r._lock) return false; return S.lticks[r.ctrl] != null ? S.lticks[r.ctrl] : !r._why; }

    /* ── drawing ── */
    function setQ(k, v, keepFocus) {
      S.q[k] = v; S.said = ""; S.saved = null; S.standing = null;
      if (k === "to") { S.ticks = {}; S.lticks = {}; S.title = null; }
      if (D.onAddress) D.onAddress(address(D.tab || "coci-lookup", S.q));
      draw(keepFocus);
    }
    function keepFocusOf(id) {
      var n = document.getElementById(id);
      return n ? { id: id, at: n.selectionStart } : null;
    }
    function restoreFocus(f) {
      if (!f) return;
      var n = document.getElementById(f.id);
      if (!n) return;
      n.focus();
      try { if (f.at != null) n.setSelectionRange(f.at, f.at); } catch (e) {}
    }
    function textIn(id, label, val, k, ph, cls) {
      var inp = el("input", { type: "search", id: id, placeholder: ph || null, autocomplete: "off" });
      inp.value = val || "";
      inp.addEventListener("input", function () { var f = keepFocusOf(id); setQ(k, inp.value, f); });
      return el("label", { "for": id, cls: "cg-field" + (cls ? " " + cls : "") }, [el("span", { text: label }), inp]);
    }
    function table(id, cols, rows, sel, label) {
      var sort = S.sort[id], filt = S.filt[id], wd = S.wd[id];
      var vis = rows.filter(function (r) {
        return cols.every(function (c, i) { var w = String(filt[i] || "").trim().toLowerCase(); return !w || String(c[2](r) == null ? "" : c[2](r)).toLowerCase().indexOf(w) >= 0; });
      });
      var sc = cols[sort[0] - 1];
      if (sc) vis.sort(function (a, b) {
        var x = sc[2](a), y = sc[2](b);
        return (sc[4] ? (+x || 0) - (+y || 0) : String(x == null ? "" : x).localeCompare(String(y == null ? "" : y), undefined, { numeric: true })) * sort[1];
      });
      var on = vis.filter(function (r) { return sel(r).checked; }).length, can = vis.filter(function (r) { return !sel(r).locked; });
      var allBox = el("input", { type: "checkbox", "aria-label": "Tick every row shown" });
      allBox.checked = can.length > 0 && can.every(function (r) { return sel(r).checked; });
      allBox.indeterminate = !allBox.checked && can.some(function (r) { return sel(r).checked; });
      allBox.addEventListener("change", function () { can.forEach(function (r) { sel(r).set(allBox.checked); }); draw(); });
      var head = el("tr", null, [el("th", { scope: "col", style: "width:36px" }, [allBox])].concat(cols.map(function (c, i) {
        var at = sort[0] === i + 1, up = at && sort[1] > 0;
        var b = word(c[1] + (at ? (c[4] ? (up ? ", low to high" : ", high to low") : (up ? ", A to Z" : ", Z to A")) : ""), function () {
          if (sort[0] === i + 1) sort[1] = -sort[1]; else { sort[0] = i + 1; sort[1] = 1; }
          draw({ id: "cg-" + id + "-h" + i });
        }, { id: "cg-" + id + "-h" + i });
        var g = el("button", { type: "button", cls: "cg-grip", "aria-label": "Resize " + c[1] + " (arrow keys)" });
        g.addEventListener("keydown", function (e) {
          var th = g.parentNode, w = wd[i] || (th && th.getBoundingClientRect().width) || 120;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); wd[i] = Math.max(48, w + (e.key === "ArrowRight" ? 16 : -16)); draw(); }
        });
        g.addEventListener("pointerdown", function (e) {
          var th = g.parentNode, x0 = e.clientX, w0 = th.getBoundingClientRect().width, last = w0;
          if (g.setPointerCapture) g.setPointerCapture(e.pointerId);
          function mv(ev) { last = Math.max(48, w0 + ev.clientX - x0); th.style.width = last + "px"; }
          function up2() { g.removeEventListener("pointermove", mv); g.removeEventListener("pointerup", up2); wd[i] = Math.round(last); draw(); }
          g.addEventListener("pointermove", mv); g.addEventListener("pointerup", up2);
        });
        return el("th", { scope: "col", "aria-sort": at ? (up ? "ascending" : "descending") : "none", style: wd[i] ? "width:" + wd[i] + "px" : (c[5] ? "width:" + c[5] : null) }, [b, g]);
      })));
      var fr = el("tr", { cls: "cg-f" }, [el("td")].concat(cols.map(function (c, i) {
        var fid = "cg-" + id + "-f" + i, inp = el("input", { type: "search", id: fid, placeholder: "Filter", "aria-label": "Filter " + c[1] });
        inp.value = filt[i] || "";
        inp.addEventListener("input", function () { var f = keepFocusOf(fid); filt[i] = inp.value; draw(f); });
        return el("td", null, [inp]);
      })));
      var tb = el("tbody", null, vis.map(function (r) {
        var s = sel(r), cb = el("input", { type: "checkbox", "aria-label": "Tick " + s.name, disabled: s.locked ? true : null });
        cb.checked = s.checked;
        cb.addEventListener("change", function () { s.set(cb.checked); draw({ id: null }); });
        return el("tr", { cls: (s.checked ? "cg-on " : "") + (r._why ? "cg-check" : "") }, [el("td", null, [cb])].concat(cols.map(function (c) {
          var v = c[3] ? c[3](r) : c[2](r);
          return el("td", null, [v == null ? "" : v]);
        })));
      }));
      return el("div", null, [
        el("p", { cls: "cg-muted cg-small", role: "status", text: fmt(on) + " of " + fmt(vis.length) + " ticked" +
          (vis.length < rows.length ? " (" + fmt(rows.length) + " in all; the filters hide " + fmt(rows.length - vis.length) + ")" : "") + "." }),
        el("div", { cls: "cg-wrap", role: "region", tabindex: "0", "aria-label": label },
          [el("table", { cls: "cg-table" }, [el("thead", null, [head, fr]), tb])])]);
    }
    function titleCell(kind, r, name) {
      var key = kind === "m" ? r.id : r.ctrl, d = S.descs[kind][key], kids = [el("span", { cls: "cg-t", text: name })];
      if (S.showDesc) kids.push(el("span", { cls: "cg-d", text: d == null ? "Reading…" : d ? (d.length > 420 ? d.slice(0, 420) + "…" : d) : "No catalog description on file." }));
      if (kind === "l" && D.outcomes) {
        var ok = "o:" + key;
        kids.push(word(S.open[ok] ? "Hide SLOs and objectives" : "SLOs and objectives", function () {
          S.open[ok] = !S.open[ok];
          if (S.open[ok] && !S.outs[ok]) {
            S.outs[ok] = { loading: true };
            D.outcomes(r.college, r.subj, r.num, function (err, rows) { S.outs[ok] = { err: err, rows: rows || [] }; draw(); });
          }
          draw();
        }, { cls: "cg-w cg-small", "aria-expanded": S.open[ok] ? "true" : "false" }));
        if (S.open[ok]) {
          var o = S.outs[ok] || {}, box = el("div", { cls: "cg-outs" });
          if (o.loading) box.appendChild(el("p", { cls: "cg-muted", text: "Reading the outcomes…" }));
          else if (o.err) box.appendChild(el("p", { cls: "cg-muted", text: "The outcomes could not be read (" + (o.err.message || o.err) + ")." }));
          else if (!o.rows.length) box.appendChild(el("p", { cls: "cg-muted", text: "No SLOs or objectives on file for this course yet." }));
          else box.appendChild(el("ul", null, o.rows.map(function (x) {
            var items = Array.isArray(x.outcomes) ? x.outcomes : [];
            return el("li", null, [x.heading ? x.heading + ": " : "", items.map(function (y) { return typeof y === "string" ? y : (y && (y.text || y.outcome)) || ""; }).filter(Boolean).join("; ")]);
          })));
          kids.push(box);
        }
      }
      return el("span", null, kids);
    }
    function loadDescs(ms, ls) {
      var want = 0;
      function done() { if (--want === 0) { S.descLoading = 0; draw(); } }
      ms.forEach(function (c) { if (S.descs.m[c.id] == null && D.ccDesc) { want++; D.ccDesc(c.id, function (d) { S.descs.m[c.id] = d || ""; done(); }); } });
      ls.forEach(function (r) { if (S.descs.l[r.ctrl] == null && D.desc) { want++; D.desc(r.subj, r.ctrl, function (d) { S.descs.l[r.ctrl] = d || ""; done(); }); } });
      S.descLoading = want;
    }
    // Searching descriptions reads every one once: the whole state list's, not only the rows the title words found.
    function loadAllDescs() {
      if (S.allDescs) return;
      S.allDescs = "loading";
      var ms = all(), ls = D.locals() || [], want = 0;
      function done() { if (--want === 0) { S.allDescs = "done"; draw(); } }
      ms.forEach(function (c) { if (S.descs.m[c.id] == null && D.ccDesc) { want++; D.ccDesc(c.id, function (d) { S.descs.m[c.id] = d || ""; done(); }); } });
      ls.forEach(function (r) { if (S.descs.l[r.ctrl] == null && D.desc) { want++; D.desc(r.subj, r.ctrl, function (d) { S.descs.l[r.ctrl] = d || ""; done(); }); } });
      if (!want) S.allDescs = "done";
    }

    /* ── saved decisions the merge would end (Sam's v1 note: Gather lists them) ── */
    function readDecisions(ids) {
      var sig = ids.slice().sort().join("|");
      if (!ids.length) { S.decisions = []; S.decSig = sig; return; }
      if (sig === S.decSig) return;
      S.decSig = sig; S.decisions = null;
      var sess = D.session ? D.session() : null, token = sess && sess.access_token;
      var sel = "select=course_id,field,value,reviewed_at" + (token ? ",reviewer_email" : "");
      var hd = { apikey: D.anon, Authorization: "Bearer " + (token || D.anon) };
      var reads = chunks(ids, 80).map(function (part) {
        return Promise.all([
          fetch(D.rest + "/kb_curation?" + sel + "&field=in.(discipline,unified_title,cross_listed_disciplines)&course_id=" + inList(part), { headers: hd }),
          fetch(D.rest + "/kb_curation?" + sel + "&field=eq.mid_member_confirm&value=" + inList(part), { headers: hd })
        ]).then(function (rs) {
          return Promise.all(rs.map(function (res) { if (!res.ok) throw new Error("the service answered " + res.status); return res.json(); }));
        });
      });
      Promise.all(reads).then(function (parts) {
        if (S.decSig !== sig) return;
        var out = [];
        parts.forEach(function (p) { p.forEach(function (rows) { (rows || []).forEach(function (x) { out.push(x); }); }); });
        S.decisions = out; draw();
      }, function (e) { if (S.decSig !== sig) return; S.decisions = { failed: String(e && e.message || e) }; draw(); });
    }

    /* ── the save ── */
    function plan(found) {
      var T = found.T, rows = [];
      found.ms.forEach(function (c) { if (c.id !== T.id && mTick(c)) rows.push({ course_id: c.id, field: "merge_into", value: T.id, _what: c.id + " " + c.title }); });
      found.ls.forEach(function (r) { if (lTick(r)) rows.push({ course_id: "CN:" + r.ctrl, field: "merge_into", value: T.id, _what: r.subj + " " + r.num + " " + r.title + ", " + r.college }); });
      return rows;
    }
    function gather(found) {
      var T = found.T, rows = plan(found), title = S.title != null ? S.title.trim() : T.title;
      if (S.busy || (!rows.length && title === T.title)) return;
      S.busy = true; S.said = "Saving…"; draw();
      function end(words) { S.busy = false; S.said = words; draw(); }
      Promise.resolve(D.fresh()).then(function (sess) {
        if (!sess) { end("Your sign-in has ended. Sign in again, then gather."); return null; }
        var auth = { apikey: D.anon, Authorization: "Bearer " + sess.access_token };
        var keys = rows.map(function (r) { return r.course_id; });
        // The rows that stand for these keys are read first and left alone: a save never replaces one.
        return Promise.all(chunks(keys, 80).map(function (part) {
          return fetch(D.rest + "/kb_curation?select=course_id,value,reviewer_email&field=eq.merge_into&course_id=" + inList(part), { headers: auth })
            .then(function (res) { if (!res.ok) throw new Error("the service answered " + res.status); return res.json(); });
        })).then(function (parts) {
          var stands = {};
          parts.forEach(function (p) { (p || []).forEach(function (x) { stands[x.course_id] = x; }); });
          var go = rows.filter(function (r) { return !stands[r.course_id]; }), saved = [];
          var posts = chunks(go, 200).map(function (part) {
            return fetch(D.rest + "/kb_curation", { method: "POST",
              headers: Object.assign({ "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" }, auth),
              body: JSON.stringify(part.map(function (r) { return { course_id: r.course_id, field: r.field, value: r.value, reviewer_email: sess.email }; })) })
              .then(function (res) { if (!res.ok) throw new Error("the service answered " + res.status); return res.json(); })
              .then(function (back) { (back || []).forEach(function (x) { saved.push(x.course_id); }); });
          });
          if (title && title !== T.title) posts.push(fetch(D.rest + "/kb_curation", { method: "POST",
            headers: Object.assign({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, auth),
            body: JSON.stringify({ course_id: T.id, field: "unified_title", value: title, reviewer_email: sess.email }) })
            .then(function (res) { if (!res.ok) throw new Error("the title save answered " + res.status); S.renamed = title; }));
          return Promise.all(posts).then(function () {
            var lost = go.filter(function (r) { return saved.indexOf(r.course_id) < 0; }).length;
            S.saved = { to: T.id, keys: saved };
            S.standing = rows.filter(function (r) { return stands[r.course_id]; }).map(function (r) {
              var x = stands[r.course_id]; return r._what + ": already " + (x.value === T.id ? "saved into " + T.id : "into " + x.value) + (x.reviewer_email ? " (" + x.reviewer_email + ")" : "");
            });
            var m = saved.filter(function (k) { return k.indexOf("CN:") !== 0; }).length, l = saved.length - m;
            end("Saved " + fmt(m) + " merge" + (m === 1 ? "" : "s") + " and " + fmt(l) + " move" + (l === 1 ? "" : "s") + " into " + T.id +
              (S.renamed ? ", and its title " + S.renamed : "") + ", under your name. The next daily build folds them." +
              (S.standing.length ? " " + fmt(S.standing.length) + " row" + (S.standing.length === 1 ? "" : "s") + " already stood and " + (S.standing.length === 1 ? "was" : "were") + " left alone (listed below)." : "") +
              (lost ? " " + fmt(lost) + " arrived from another reviewer in between and stand." : ""));
          });
        });
      }).catch(function (e) { end("The save did not finish (" + String(e && e.message || e) + "). Whatever saved is listed under Take it back once the page reads again; nothing else changed."); });
    }
    function takeBack() {
      var sv = S.saved;
      if (S.busy || !sv || !sv.keys.length) return;
      S.busy = true; S.said = "Taking it back…"; draw();
      Promise.resolve(D.fresh()).then(function (sess) {
        if (!sess) { S.busy = false; S.said = "Your sign-in has ended. Sign in again, then take it back."; draw(); return null; }
        var gone = 0;
        return Promise.all(chunks(sv.keys, 80).map(function (part) {
          return fetch(D.rest + "/kb_curation?field=eq.merge_into&value=eq." + encodeURIComponent(sv.to) + "&course_id=" + inList(part),
            { method: "DELETE", headers: { apikey: D.anon, Authorization: "Bearer " + sess.access_token, Prefer: "return=representation" } })
            .then(function (res) { if (!res.ok) throw new Error("the service answered " + res.status); return res.json(); })
            .then(function (back) { gone += (back || []).length; });
        })).then(function () {
          S.busy = false; S.saved = null;
          S.said = "Taken back: " + fmt(gone) + " row" + (gone === 1 ? "" : "s") + " removed. Nothing else changed" + (S.renamed ? "; the title stays " + S.renamed + " until renamed" : "") + ".";
          draw();
        });
      }).catch(function (e) { S.busy = false; S.said = "It was not taken back (" + String(e && e.message || e) + "). The saves stand."; draw(); });
    }

    function draw(focus) {
      var node = S.node;
      if (!node) return;
      while (node.firstChild) node.removeChild(node.firstChild);
      if (S.q.look !== "title") loadAllDescs();
      var found = matches(), T = found.T, box = el("div", { cls: "cg" });
      box.appendChild(el("h2", { text: "Gather: courses whose words match, into one common course" }));
      box.appendChild(el("p", { cls: "cg-muted cg-small", text: "Name the words, pick the common course to keep, untick what does not belong, then gather. Every save is one row under your name, and Take it back removes what this visit saved." }));

      // The words and where they look.
      box.appendChild(el("div", { cls: "cg-ctrls" }, [textIn("cg-w", "Words to look for", S.q.w, "w", "adapt -dance", "grow"),
        el("div", { cls: "cg-howto" }, [
          el("p", null, [el("b", { text: "Space" }), " between words: a title must hold all of them (adapted swim)."]),
          el("p", null, [el("b", { text: "Comma or the word or" }), ": either side may match (adapted, adaptive)."]),
          el("p", null, [el("b", { text: "A minus" }), " before a word leaves out titles that hold it (adapt -dance)."]),
          el("p", null, [el("b", { text: "Quotes" }), " keep words together as one phrase (\"adapted physical\")."]),
          el("p", { cls: "cg-muted", text: "A word only needs to start a word in the text: adapt finds adapted, adaptive and adaptation. Capitals do not matter." })])]));
      var seg = el("div", { cls: "cg-seg", role: "radiogroup", "aria-label": "Where the words look" }, [el("span", { cls: "lbl", text: "Look in" })]);
      LOOK.forEach(function (o) {
        var b = el("button", { type: "button", role: "radio", cls: "cg-segb", "aria-checked": S.q.look === o[0] ? "true" : "false", text: o[1] });
        b.addEventListener("click", function () { setQ("look", o[0]); });
        seg.appendChild(b);
      });
      if (S.q.look !== "title" && S.allDescs !== "done") seg.appendChild(el("span", { cls: "cg-muted cg-small", role: "status", text: "Reading every catalog description once (about 80 MB); the rows fill in as it arrives." }));
      box.appendChild(seg);

      // The common subject, the local subject codes, the target.
      var discs = {};
      all().forEach(function (c) { if (c.disc) discs[code(c.id)] = c.disc; });
      var csSel = el("select", { id: "cg-cs" }, [el("option", { value: "", text: "Any common subject" })].concat(Object.keys(discs).sort().map(function (k) {
        return el("option", { value: k, text: k + " " + discs[k] }); })));
      csSel.value = S.q.cs;
      csSel.addEventListener("change", function () { setQ("cs", csSel.value); });
      var tIn = el("input", { type: "search", id: "cg-to", list: "cg-to-list", placeholder: "PEDS M1029", autocomplete: "off" });
      tIn.value = S.q.to;
      tIn.addEventListener("change", function () { setQ("to", tIn.value.trim().toUpperCase().replace(/\s+/g, " ")); });
      var dl = el("datalist", { id: "cg-to-list" }, found.ms.map(function (c) { return el("option", { value: c.id, text: c.title }); }));
      box.appendChild(el("div", { cls: "cg-ctrls" }, [
        el("label", { "for": "cg-cs", cls: "cg-field" }, [el("span", { text: "Common subject of the common courses" }), csSel]),
        textIn("cg-ls", "Local subjects of the local courses (codes, any of them)", S.q.ls, "ls", "PE, KIN, ADAPT"),
        el("label", { "for": "cg-to", cls: "cg-field" }, [el("span", { text: "The common course they gather into (its M-ID)" }), tIn, dl])]));

      if (parse(S.q.w).empty) {
        box.appendChild(el("p", { cls: "cg-muted", role: "status", text: "Type the words to look for. Gather lists nothing until they are named." }));
        node.appendChild(box); restoreFocus(focus); return;
      }
      box.appendChild(el("p", { cls: "cg-muted", role: "status", text: fmt(found.ms.length - (T ? 1 : 0)) + " common course" + (found.ms.length - (T ? 1 : 0) === 1 ? "" : "s") + " and " +
        fmt(found.ls.length) + " local course" + (found.ls.length === 1 ? "" : "s") + " outside them match." + (T ? "" : " Name the common course to keep, and the ticks follow it.") }));
      var dw = word(S.showDesc ? "Hide the descriptions" : "Show the descriptions", function () {
        S.showDesc = !S.showDesc; if (S.showDesc) loadDescs(found.ms, found.ls); draw({ id: "cg-desc" });
      }, { id: "cg-desc", "aria-pressed": S.showDesc ? "true" : "false" });
      box.appendChild(el("div", { cls: "cg-acts" }, [dw, S.showDesc && S.descLoading ? el("span", { cls: "cg-muted cg-small", role: "status", text: "Reading the descriptions…" }) : null]));

      // 1. The common course they gather into.
      if (T) {
        var tt = el("input", { type: "text", id: "cg-title" });
        tt.value = S.title != null ? S.title : T.title;
        tt.addEventListener("input", function () { S.title = tt.value; });
        box.appendChild(el("section", { cls: "cg-card", "aria-labelledby": "cg-h1" }, [el("h3", { id: "cg-h1", text: "1. The common course they gather into: " + T.id }),
          el("label", { "for": "cg-title", cls: "cg-field" }, [el("span", { text: "Its title" }), tt]),
          el("p", { cls: "cg-muted cg-small", text: "Common subject " + subjName(T) + ". Its units show the range the gathered courses carry (now " + (units(T) || "none on file") + ")." })]));
      } else if (S.q.to) {
        box.appendChild(el("p", { cls: "cg-muted", role: "alert", text: S.q.to + " is not a common course in today's list. Pick one from the list the field offers." }));
      }

      // 2. Common courses that merge into it.
      var mcols = [["id", "Common course", function (c) { return c.id; }, null, false, "8rem"],
        ["t", "Title", function (c) { return c.title; }, function (c) { return titleCell("m", c, c.title); }, false, "28%"],
        ["s", "Common subject", function (c) { return subjName(c); }],
        ["u", "Units", function (c) { return units(c); }, null, false, "5.5rem"],
        ["n", "Local courses", function (c) { return c.members; }, null, true, "6rem"],
        ["w", "Check", function (c) { return c.id === S.q.to ? "Kept: the others merge into it." : c._why; }]];
      box.appendChild(el("section", { cls: "cg-card", "aria-labelledby": "cg-h2" }, [el("h3", { id: "cg-h2", text: "2. Common courses that merge into it" }),
        el("p", { cls: "cg-muted cg-small", text: "Each ticked row saves one merge, and its local courses follow it. Rows in another common subject start unticked." }),
        table("m", mcols, found.ms, function (c) { return { name: c.id + " " + c.title, checked: mTick(c), locked: c.id === S.q.to, set: function (v) { S.ticks[c.id] = v; } }; },
          "Common courses whose words match")]));

      // 3. Local courses elsewhere, or under no common course.
      var C = byId();
      var lcols = [["s", "Local subject", function (r) { return r.subj; }, null, false, "6rem"],
        ["t", "Title", function (r) { return r.subj + " " + r.num + " " + r.title; }, function (r) { return titleCell("l", r, r.subj + " " + r.num + " " + r.title); }, false, "26%"],
        ["c", "College", function (r) { return r.college; }],
        ["u", "Units", function (r) { return r.units; }, null, true, "4.5rem"],
        ["p", "TOP", function (r) { return r.top; }, null, false, "6rem"],
        ["m", "Now under", function (r) { var c = r.mid && C[r.mid]; return r.mid ? r.mid + (c ? ", " + c.title + " (" + subjName(c) + ")" : "") : "no common course"; }],
        ["w", "Check", function (r) { return r._why; }]];
      box.appendChild(el("section", { cls: "cg-card", "aria-labelledby": "cg-h3" }, [el("h3", { id: "cg-h3", text: "3. Local courses elsewhere, or under no common course" }),
        el("p", { cls: "cg-muted cg-small", text: "Each ticked row moves into " + (T ? T.id : "the common course kept") + ". Untick any that use the words in another field; the Check column names the ones to look at first." }),
        table("l", lcols, found.ls, function (r) { return { name: r.subj + " " + r.num + " " + r.college, checked: lTick(r), locked: r._lock, set: function (v) { S.lticks[r.ctrl] = v; } }; },
          "Local courses whose words match, outside the merged common courses")]));

      // 4. What Gather will save.
      if (T) {
        var mm = found.ms.filter(function (c) { return c.id !== T.id && mTick(c); }), ll = found.ls.filter(lTick);
        var us = [];
        found.ms.forEach(function (c) { if (mTick(c)) [c.umin, c.umax, c.units].forEach(function (u) { if (u != null && u !== "") us.push(+u); }); });
        ll.forEach(function (r) { if (r.units != null && r.units !== "") us.push(+r.units); });
        us = us.filter(function (u) { return !isNaN(u); });
        var n = found.ms.filter(mTick).reduce(function (a, c) { return a + (+c.members || 0); }, 0) + ll.length;
        var lo = us.length ? Math.min.apply(null, us) : null, hi = us.length ? Math.max.apply(null, us) : null;
        readDecisions(mm.map(function (c) { return c.id; }));
        var decLine;
        if (S.decisions == null) decLine = el("li", { text: "Reading the saved decisions on the common courses that merge…" });
        else if (S.decisions.failed) decLine = el("li", { text: "The saved decisions could not be read (" + S.decisions.failed + "); look before you gather." });
        else if (!S.decisions.length) decLine = el("li", { text: "No saved decision sits on the common courses that merge." });
        else decLine = el("li", null, ["Saved decisions on the common courses that merge stop applying once they merge:",
          el("ul", null, S.decisions.map(function (x) {
            var f = x.field === "discipline" ? "common subject set to " + x.value : x.field === "unified_title" ? "title set to " + x.value
              : x.field === "mid_member_confirm" ? x.course_id.replace(/^CN:/, "local course ") + " confirmed in " + x.value : "also listed as " + x.value;
            return el("li", { text: (x.field === "mid_member_confirm" ? "" : x.course_id + ": ") + f + (x.reviewer_email ? ", " + x.reviewer_email : "") + (x.reviewed_at ? ", " + String(x.reviewed_at).slice(0, 10) : "") });
          }))]);
        var title = S.title != null ? S.title.trim() : T.title, signed = D.session ? D.session() : null;
        var acts = el("div", { cls: "cg-acts" });
        if (signed) {
          acts.appendChild(word("Gather into " + T.id, function () { gather(found); }, { cls: "cg-w strong", disabled: S.busy || (!mm.length && !ll.length && title === T.title) ? true : null }));
          if (S.saved && S.saved.keys.length) acts.appendChild(word("Take it back", takeBack, { disabled: S.busy ? true : null }));
        } else {
          var mount = el("div");
          var fold = el("details", null, [el("summary", { text: "Reviewers: sign in to gather" }), mount]);
          fold.addEventListener("toggle", function () { if (fold.open && !mount.childNodes.length && D.signIn) D.signIn(mount); });
          acts.appendChild(fold);
        }
        if (S.said) acts.appendChild(el("span", { cls: "cg-muted", role: "status", text: S.said }));
        var sum = [
          el("li", { text: fmt(mm.length) + " common course" + (mm.length === 1 ? " merges" : "s merge") + " into " + T.id + ", " + (title || T.title) + ": one merge save each." }),
          el("li", { text: fmt(ll.length) + " local course" + (ll.length === 1 ? " moves" : "s move") + " into it: one move save each." }),
          el("li", { text: T.id + " then holds about " + fmt(n) + " local courses" + (lo != null ? ", at " + (lo === hi ? lo : lo + " to " + hi) + " units" : "") + "." }),
          title && title !== T.title ? el("li", { text: "Its title becomes " + title + "." }) : null,
          decLine];
        var card = el("section", { cls: "cg-card cg-sum", "aria-labelledby": "cg-h4" }, [el("h3", { id: "cg-h4", text: "4. What Gather will save" }), el("ul", null, sum), acts]);
        if (S.standing && S.standing.length) card.appendChild(el("ul", { cls: "cg-small" }, S.standing.map(function (t) { return el("li", { text: t }); })));
        box.appendChild(card);
      }
      node.appendChild(box);
      restoreFocus(focus);
    }

    return {
      render: function (node) {
        if (!document.getElementById(CSS_ID)) { var st = document.createElement("style"); st.id = CSS_ID; st.textContent = CSS; document.head.appendChild(st); }
        S.node = node; draw();
      },
      address: function () { return address(D.tab || "coci-lookup", S.q); },
      redraw: function () { draw(); },
      _state: S
    };
  }

  window.CPL_COMMONS_GATHER = { parse: parse, readAddress: readAddress, address: address, create: create };
})();
