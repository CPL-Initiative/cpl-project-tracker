// commons_list.js — the Catalog Commons' List view, one engine for every common reference.
//
// Sam, 2026-11-01, after the Exhibits List (S540-S542): "This new list view is so helpful that I want one now for each
// of our Catalog Commons groups." And the Commons' standing ask (2026-10-18): "as we make changes to one, keep the
// other related dashes aligned." So the List lives here once, and each tab hands it a spec: its rows, its columns, its
// filters, its drawers and the kb_curation writes behind its edits. A change to the List is a change to every List.
//
// What the engine draws (the Exhibits List's shape, S540-S542): a finder and filter words; every row in small type,
// sortable on any column (Shift and press adds a level), a filter box under each header, resizable columns (drag, or
// the arrow keys on a header's edge), Wrap text, a select box and an optional flag per row, a drawer under a row when a
// cell is pressed, Edit (one row) and Edit every row (boxes in place, saved on leaving), Find and replace (a preview
// with a check per row, Save, Undo for the visit), Download as a spreadsheet, and, when the spec names an order file,
// the AI sort with groups a reviewer keeps and titles moved between them.
//
// The spec (every hook optional unless marked):
//   state()            REQUIRED. The view's state object, kept by the tab (so a new visit can drop it).
//   rows()             REQUIRED. Every row, unfiltered.
//   cols()             REQUIRED. [{ h, w (percent), n (numeric), v(r), suffix, edit (kind for Edit every row) }];
//                      the first column is the title. Columns are found by name, never by position (S541).
//   key(r)             The row's key (default r.ut). title(r): the title shown (default the first column's value).
//   render()           REQUIRED. The tab's own repaint.
//   prefix, frPrefix   Class and id prefixes (default "cl-", "cl-fr-"). cls: the tab's base classes
//                      { w, muted, small, note, search, on, vh, empty }; left out, the engine styles its own.
//   noun               { many: "credentials", region, keyHeader, file, placeholder, findLabel }.
//   head(wrap, api)    Draws above the finder; return false to stop (still loading, or an error).
//   filters            [[id, label]]; filterPass(r, L) says whether a row stays; onFilter(id, api) may return a promise.
//   hay(r)             The words the finder searches.
//   afterBar(wrap, api), beforeTable(wrap, api): blocks the tab adds under the finder and above the table.
//   titleSubs(r, L, aiOn): nodes under a row's title (a pending rename, a suggestion).
//   drawer(r, name, h) fills a cell's drawer; h = { line, list, box, word, el, filterBy, colIndex, L, LIMIT }.
//   flag               { get(r), set(r, on) }: the flag column, left out when absent.
//   edit               { fields: [{ id, label, key, ph }], draft(r), save(r) }: the Edit word and row.
//   cellSave(r, kind, inp, label): Edit every row's save for a column with an edit kind.
//   fr                 { cols: [[kind, label]], defaultCol, rowHeader, wholeLabel(kind), change(r, kind, F, api),
//                        save(sess, r, kind, value, sites) -> Promise<bool>, savedTail(kind, n) }: Find and replace.
//   session()          Resolves to the signed-in reviewer, or null.
//   groups             { url, none, item, saved(r), save(keys, value) -> Promise, facts(members), extra: { test(r),
//                        words(n) }, sortLine(L) }: the AI sort and kept groups.
//
// jsdom guard: tests/exhibits_list*.test.js (the Exhibits List on this engine) and tests/cr_list.test.js.
(function () {
  "use strict";
  var LIST_LIMIT = 400, LIST_MIN_W = 48, LIST_STEP = 24, FR_BATCH = 6;

  function create(S) {
    var P = S.prefix || "cl-", FP = S.frPrefix || "cl-fr-", OWN_BASE = !S.cls;
    var CL = Object.assign({ w: "cl-w", muted: "cl-muted", small: "cl-small", note: "cl-note", search: "cl-search",
      on: "cl-on", vh: "cl-vh", empty: "cl-empty" }, S.cls || {});
    var N = Object.assign({ many: "rows", region: "Every row, A to Z", keyHeader: "Key", file: "list",
      placeholder: "Find", findLabel: "Find in the list" }, S.noun || {});
    var G = S.groups || null, NO_GROUP = (G && G.none) || "_NO_GROUP";
    var NBOX = S.flag ? 2 : 1, HAS_EDIT = !!S.edit;

    function el(tag, attrs, kids) {
      var e = document.createElement(tag);
      if (attrs) for (var k in attrs) {
        if (attrs[k] == null || attrs[k] === false) continue;
        if (k === "text") e.textContent = attrs[k];
        else if (k === "cls") e.className = attrs[k];
        else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
      }
      (kids || []).forEach(function (c) {
        if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
      return e;
    }
    function word(text, onClick, attrs) {
      var b = el("button", Object.assign({ type: "button", cls: CL.w }, attrs || {}), [text]);
      b.addEventListener("click", onClick);
      return b;
    }
    function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
    function stamp(v) {
      var m = /^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)/.exec(v || "");
      return m ? m[1] + " " + m[2] + "Z" : (v || "");
    }
    function render() { S.render(); }
    function K(r) { return S.key ? S.key(r) : r.ut; }
    function listCols() { return S.cols(); }
    function listTitle(r) { return S.title ? S.title(r) : String(listCols()[0].v(r) == null ? "" : listCols()[0].v(r)); }
    function span() { return listCols().length + NBOX + (HAS_EDIT ? 1 : 0); }
    function session() { return S.session ? S.session() : Promise.resolve(null); }

    var DEFAULTS = { q: "", f: "", limit: LIST_LIMIT, edit: null, draft: null, changed: [], note: "", busy: false,
      sort: [{ col: 0, dir: 1 }], cf: {}, wrap: false, widths: null, sel: {}, open: null, flagBusy: {}, move: null,
      gEdit: null, gBusy: false };
    function listState() {
      var L = S.state();
      for (var k in DEFAULTS) if (L[k] === undefined) L[k] = JSON.parse(JSON.stringify(DEFAULTS[k]));
      return L;
    }
    function listColIndex(h) {
      var C = listCols();
      for (var i = 0; i < C.length; i++) if (C[i].h === h) return i;
      return 0;
    }
    /* Case and accents aside, so "canada" finds Cañada College. */
    function listFold(s) {
      s = String(s == null ? "" : s);
      if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return s.toLowerCase();
    }
    function listRows() {
      var L = listState(), q = L.q.trim().toLowerCase();
      // Custom sort (Sam, 2026-11-01: "first by title then by issuer or vice versa ... like Excel Custom sort"): the
      // levels apply in order; a press on a header sorts by it alone, Shift and a press adds it as the next level.
      var C0 = listCols(), levels = L.sort.length ? L.sort : [{ col: 0, dir: 1 }];
      function cmp(a, b, lv) {
        var sc = C0[lv.col] || C0[0], x = sc.v(a), y = sc.v(b);
        if (sc.n) {
          if ((x == null || y == null) && x !== y) return x == null ? 1 : -1;
          return lv.dir * ((+x || 0) - (+y || 0));
        }
        x = String(x || ""); y = String(y || "");
        if ((!x || !y) && x !== y) return x ? -1 : 1;   // blanks last, either way
        return lv.dir * x.toLowerCase().localeCompare(y.toLowerCase());
      }
      var gi = G && L.ai && L.aiData && L.aiData.order ? (L.gi = listGroupIndex()) : null;
      var rows = (S.rows() || []).slice().sort(function (a, b) {
        if (gi) {
          var ga = gi.by[K(a)], gb = gi.by[K(b)];
          return ga.sort.localeCompare(gb.sort) || (ga.key < gb.key ? -1 : ga.key > gb.key ? 1 : 0) || ga.pos - gb.pos
            || listTitle(a).toLowerCase().localeCompare(listTitle(b).toLowerCase());
        }
        for (var i = 0; i < levels.length; i++) { var c = cmp(a, b, levels[i]); if (c) return c; }
        return listTitle(a).toLowerCase().localeCompare(listTitle(b).toLowerCase());
      });
      return rows.filter(function (r) {
        if (S.filterPass && !S.filterPass(r, L)) return false;
        var cols = listCols();
        for (var k in L.cf) {
          var want = String(L.cf[k] || "").trim().toLowerCase();
          if (want && String(cols[+k].v(r)).toLowerCase().indexOf(want) === -1) return false;
        }
        if (!q) return true;
        var hay = S.hay ? S.hay(r) : cols.map(function (c) { return c.v(r); }).join(" ");
        return listFold(hay).indexOf(listFold(q)) !== -1;
      });
    }

    /* Find and replace (Sam, 2026-11-01: "use find and replace to fix things on the fly"). The columns a reviewer can
       edit; a preview lists every change with its own check before anything saves, and the visit keeps the values it
       replaced, so Undo this replace writes them back. */
    function frState() {
      var L = listState();
      return L.fr || (L.fr = { open: false, col: (S.fr && S.fr.defaultCol) || (S.fr && S.fr.cols[0][0]) || "", find: "", rep: "",
        mcase: false, whole: false, within: "shown", preview: null, busy: false, done: 0, last: null, note: "" });
    }
    function frEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    /* One value through the rule: whole cell or every occurrence, with or without case. */
    function frSwap(v, F) {
      v = String(v == null ? "" : v);
      if (!F.find) return v;
      if (F.whole) return (F.mcase ? v === F.find : v.toLowerCase() === F.find.toLowerCase()) ? F.rep : v;
      return v.replace(new RegExp(frEscape(F.find), F.mcase ? "g" : "gi"), function () { return F.rep; });
    }
    function frClean(s) { return String(s).replace(/\s+/g, " ").trim(); }
    function frLabel(col) { var c = S.fr.cols.filter(function (x) { return x[0] === col; })[0]; return c ? c[1] : col; }
    /* Each row the rule would change, with what it holds now and after. A value the spec refuses empty is left out. */
    function frPreview() {
      var F = frState(), L = listState();
      var pool = F.within === "selected" ? S.rows().filter(function (r) { return L.sel[K(r)]; }) : listRows();
      var out = [], empty = 0;
      pool.forEach(function (r) {
        var ch = S.fr.change(r, F.col, F, api);
        if (!ch || ch.after === ch.before) return;
        if (ch.refuseEmpty && !ch.after) { empty++; return; }
        out.push({ k: K(r), before: ch.before, after: ch.after, sites: ch.sites || null, prevSites: ch.prevSites || null, keep: true });
      });
      F.preview = out; F.emptied = empty; F.note = "";
    }
    function frRow(k) { return S.rows().filter(function (r) { return K(r) === k; })[0]; }
    /* Save a list of { k, value, sites } in small batches; resolves to the ones that saved and the ones that did not. */
    function frRun(col, items) {
      var F = frState(), saved = [], failed = [], i = 0;
      F.busy = true; F.done = 0; render();
      return session().then(function (sess) {
        if (!sess) throw new Error("signin");
        function next() {
          var batch = items.slice(i, i + FR_BATCH);
          i += FR_BATCH;
          if (!batch.length) return Promise.resolve();
          return Promise.all(batch.map(function (it) {
            var r = frRow(it.k);
            if (!r) { failed.push(it); return null; }
            return S.fr.save(sess, r, col, it.value, it.sites).then(function (ok) {
              if (ok) saved.push(it); else failed.push(it);
            }, function () { failed.push(it); });
          })).then(function () { F.done = saved.length + failed.length; listFrProgress(); return next(); });
        }
        return next();
      }).then(function () { F.busy = false; return { saved: saved, failed: failed }; },
        function (e) { F.busy = false; throw e; });
    }
    function listFrProgress() {
      var n = document.getElementById(FP + "progress"), F = frState();
      if (n) n.textContent = "Saving " + fmt(F.done) + " of " + fmt(F.total || 0) + "…";
    }
    function frSave() {
      var F = frState(), col = F.col, kept = (F.preview || []).filter(function (p) { return p.keep; });
      if (!kept.length) { F.note = "No row is checked, so nothing saved."; render(); return Promise.resolve(); }
      F.total = kept.length;
      var label = frLabel(col), one = S.fr.one || "row", many = S.fr.many || "rows";
      return frRun(col, kept.map(function (p) { return { k: p.k, value: p.after, sites: p.sites }; })).then(function (res) {
        var back = {};
        kept.forEach(function (p) { back[p.k] = p; });
        F.last = { col: col, label: label, items: res.saved.map(function (it) {
          var p = back[it.k];
          return { k: it.k, value: p.before, sites: p.prevSites ? p.prevSites.map(function (x) { return x.college ? { site: x.site, college: x.college } : { site: x.site }; }) : null };
        }) };
        F.preview = null;
        F.note = "Replaced in " + fmt(res.saved.length) + " " + (res.saved.length === 1 ? one : many) + " (" + label + ")."
          + (res.failed.length ? " " + fmt(res.failed.length) + " did not reach the reference and are unchanged: "
            + res.failed.slice(0, 5).map(function (x) { return x.k; }).join("; ") + (res.failed.length > 5 ? "…" : "") + "." : "")
          + (S.fr.savedTail ? S.fr.savedTail(col, res.saved.length) : "");
        render();
      }).catch(function (e) {
        F.note = e && e.message === "signin" ? "Sign in as a reviewer to save." : "The replace did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed.";
        render();
      });
    }
    function frUndo() {
      var F = frState(), last = F.last;
      if (!last || !last.items.length) return Promise.resolve();
      F.total = last.items.length;
      return frRun(last.col, last.items).then(function (res) {
        F.last = res.failed.length ? { col: last.col, label: last.label, items: res.failed } : null;
        F.note = "Put back " + fmt(res.saved.length) + " " + last.label.toLowerCase() + (res.saved.length === 1 ? " value" : " values") + "."
          + (res.failed.length ? " " + fmt(res.failed.length) + " did not save; Undo again to retry them." : "");
        render();
      }).catch(function (e) {
        F.note = e && e.message === "signin" ? "Sign in as a reviewer to undo." : "The undo did not reach the reference (" + (e && e.message || "no answer") + ").";
        render();
      });
    }
    function frPanel() {
      var F = frState(), L = listState(), nSel = Object.keys(L.sel).length;
      if (F.within === "selected" && !nSel) F.within = "shown";
      function field(id, label, key) {
        var i = el("input", { id: id, type: "text", cls: P + "in", autocomplete: "off" });
        i.value = F[key];
        i.addEventListener("input", function () { F[key] = i.value; if (F.preview) { F.preview = null; redrawFr(id); } });
        return el("label", { cls: P + "f", "for": id }, [el("span", { text: label }), i]);
      }
      function tick(id, label, key) {
        var i = el("input", { id: id, type: "checkbox" });
        i.checked = !!F[key];
        i.addEventListener("change", function () { F[key] = i.checked; F.preview = null; redrawFr(id); });
        return el("label", { cls: FP + "tick", "for": id }, [i, " " + label]);
      }
      var sel = el("select", { id: FP + "col", cls: P + "in" }, S.fr.cols.map(function (c) {
        var o = el("option", { value: c[0], text: c[1] }); if (c[0] === F.col) o.selected = true; return o; }));
      sel.addEventListener("change", function () { F.col = sel.value; F.preview = null; redrawFr(FP + "col"); });
      var within = el("select", { id: FP + "within", cls: P + "in" }, [
        el("option", { value: "shown", text: "The " + fmt(listRows().length) + " rows the list shows" })].concat(nSel
        ? [el("option", { value: "selected", text: "The " + fmt(nSel) + " selected rows" })] : []));
      within.value = F.within;
      within.addEventListener("change", function () { F.within = within.value; F.preview = null; redrawFr(FP + "within"); });
      var form = el("div", { cls: FP + "form" }, [
        el("label", { cls: P + "f", "for": FP + "col" }, [el("span", { text: "Column" }), sel]),
        field(FP + "find", "Find", "find"), field(FP + "rep", "Replace with", "rep"),
        el("label", { cls: P + "f", "for": FP + "within" }, [el("span", { text: "Within" }), within]),
        el("div", { cls: FP + "ticks" }, [tick(FP + "case", "Match case", "mcase"), tick(FP + "whole", S.fr.wholeLabel ? S.fr.wholeLabel(F.col) : "Whole cell", "whole")]),
        el("div", { cls: P + "acts" }, [
          word("Preview the changes", function () {
            if (!F.find) { F.note = "Type what to find first."; redrawFr(FP + "find"); return; }
            frPreview(); redrawFr(FP + "prev"); }, { id: FP + "prev" }),
          word("Close", function () { F.open = false; F.preview = null; render(); })])]);
      var box = el("section", { cls: FP.replace(/-$/, ""), id: FP.replace(/-$/, ""), "aria-labelledby": FP + "h" }, [
        el("h3", { id: FP + "h", cls: FP + "h", text: "Find and replace" }),
        el("p", { cls: CL.muted + " " + CL.small, text: "Pick a column, type what to find and what to put instead, and preview. Every row it would change "
          + "is listed with its own check; Save writes only the checked rows, the same fields Edit saves. Undo this replace puts the old values back for this visit." }),
        form]);
      if (F.busy) box.appendChild(el("p", { cls: CL.note, role: "status", id: FP + "progress", text: "Saving " + fmt(F.done) + " of " + fmt(F.total || 0) + "…" }));
      if (F.note) box.appendChild(el("p", { cls: CL.note, role: "status", text: F.note }));
      if (F.last && F.last.items.length && !F.busy) box.appendChild(el("div", { cls: P + "acts" }, [
        word("Undo this replace (" + fmt(F.last.items.length) + ")", frUndo)]));
      if (F.preview) box.appendChild(frPreviewTable());
      return box;
    }
    function frPreviewTable() {
      var F = frState(), PV = F.preview, label = frLabel(F.col);
      var kept = PV.filter(function (p) { return p.keep; }).length;
      var wrap = el("div", null, [el("p", { cls: CL.muted + " " + CL.small, id: FP + "count", text: PV.length
        ? fmt(PV.length) + " row" + (PV.length === 1 ? "" : "s") + " would change; " + fmt(kept) + " checked. Uncheck any to leave alone."
          + (F.emptied ? " " + fmt(F.emptied) + " left out: the title would be empty." : "")
        : "No row in " + (F.within === "selected" ? "the selection" : "the list as shown") + " matches." + (F.emptied ? " " + fmt(F.emptied) + " would leave an empty title and are left out." : "") })]);
      if (!PV.length) return wrap;
      var all = el("input", { type: "checkbox", id: FP + "all", "aria-label": "Keep every row" });
      all.checked = kept === PV.length;
      all.addEventListener("change", function () { PV.forEach(function (p) { p.keep = all.checked; }); redrawFr(FP + "all"); });
      var body = el("tbody");
      PV.forEach(function (p, i) {
        var b = el("input", { type: "checkbox", id: FP + "k" + i, "aria-label": "Change " + p.k });
        b.checked = p.keep;
        b.addEventListener("change", function () {
          p.keep = b.checked;
          var n = document.getElementById(FP + "count"), k = PV.filter(function (x) { return x.keep; }).length;
          if (n) n.textContent = fmt(PV.length) + " row" + (PV.length === 1 ? "" : "s") + " would change; " + fmt(k) + " checked. Uncheck any to leave alone.";
          var s = document.getElementById(FP + "save"); if (s) s.textContent = "Save the " + fmt(k) + " checked";
        });
        body.appendChild(el("tr", null, [el("td", { cls: P + "box" }, [b]), el("td", { text: p.k }),
          el("td", null, [el("del", { text: p.before || "(blank)" })]), el("td", null, [el("ins", { text: p.after || "(blank)" })])]));
      });
      var table = el("table", { cls: P + "table " + FP + "table" }, [
        el("colgroup", null, [el("col", { style: "width:32px" }), el("col", { style: "width:34%" }), el("col", { style: "width:31%" }), el("col", { style: "width:31%" })]),
        el("thead", null, [el("tr", null, [el("th", { scope: "col", cls: P + "box" }, [all]), el("th", { scope: "col", text: S.fr.rowHeader || "Row" }),
          el("th", { scope: "col", text: label + " now" }), el("th", { scope: "col", text: label + " after" })])]), body]);
      wrap.appendChild(el("div", { cls: P + "wrap " + FP + "wrap", role: "region", "aria-label": "The changes find and replace would make", tabindex: "0" }, [table]));
      wrap.appendChild(el("div", { cls: P + "acts" }, [
        word(F.busy ? "Saving…" : "Save the " + fmt(kept) + " checked", function () { if (!F.busy) frSave(); }, { id: FP + "save" }),
        word("Discard the preview", function () { F.preview = null; redrawFr(FP + "prev"); })]));
      return wrap;
    }
    /* Repaint the panel alone and give focus back to the control that asked. */
    function redrawFr(focusId) {
      var host = document.getElementById(FP + "host");
      if (!host) { render(); return; }
      while (host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(frPanel());
      var n = focusId && document.getElementById(focusId);
      if (n) { n.focus(); if (n.type === "text") { try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } }
    }

    function listEditRow(r) {
      var L = listState(), d = L.draft;
      function box(f) {
        var i = el("input", { id: f.id, type: "text", cls: P + "in", placeholder: f.ph || "" });
        i.value = d[f.key];
        i.addEventListener("input", function () { d[f.key] = i.value; });
        return el("label", { cls: P + "f", "for": f.id }, [el("span", { text: f.label }), i]);
      }
      var td = el("td", { colspan: String(span()) }, [
        el("div", { cls: P + "edit" }, S.edit.fields.map(box).concat([
          el("div", { cls: P + "acts" }, [
            word(L.busy ? "Saving…" : "Save", function () { S.edit.save(r); }),
            word("Cancel", function () { L.edit = null; L.draft = null; render(); })])]))]);
      return el("tr", { cls: P + "editrow" }, [td]);
    }
    function renderList(wrap) {
      var L = listState();
      ensureListCss();
      if (S.head && S.head(wrap, api) === false) return;
      var bar = el("div", { cls: P + "bar" });
      var q = el("input", { cls: CL.search + " " + P + "q", id: P + "find", type: "search", autocomplete: "off",
        placeholder: N.placeholder, "aria-label": N.findLabel });
      q.value = L.q;
      q.addEventListener("input", function () { L.q = q.value; L.limit = LIST_LIMIT; redrawList(); });
      bar.appendChild(q);
      if (S.filters && S.filters.length) {
        var fl = el("div", { cls: P + "filters", role: "group", "aria-label": "Show" });
        S.filters.forEach(function (f) {
          if (f[0] === L.f) fl.appendChild(el("span", { cls: CL.on, "aria-current": "true", text: f[1] }));
          else fl.appendChild(word(f[1], function () {
            L.f = f[0]; L.limit = LIST_LIMIT;
            var p = S.onFilter ? S.onFilter(f[0], api) : null;
            if (p && p.then) p.then(render, render); else render();
          }));
        });
        bar.appendChild(fl);
      }
      wrap.appendChild(bar);
      if (S.afterBar) S.afterBar(wrap, api);
      if (L.note) wrap.appendChild(el("p", { cls: CL.note, role: "status", text: L.note }));
      if (S.beforeTable) S.beforeTable(wrap, api);
      if (S.fr) wrap.appendChild(el("div", { id: FP + "host" }, frState().open ? [frPanel()] : []));
      wrap.appendChild(el("div", { id: P + "host" }, [listTable()]));
      listSyncGrips();
    }
    function redrawList() {
      var host = document.getElementById(P + "host");
      if (!host) { render(); return; }
      while (host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(listTable());
      listSyncGrips();
    }
    function hasCellEdit() { return listCols().some(function (c) { return !!c.edit; }); }
    function listTable() {
      var L = listState(), rows = listRows(), shown = rows.slice(0, L.limit);
      var C = listCols(), nb = NBOX, boxW = 32 * nb;
      var editW = 100 - 3 * nb - C.reduce(function (a, c) { return a + c.w; }, 0);
      var lead = [el("col", { style: "width:32px" })].concat(S.flag ? [el("col", { style: "width:32px" })] : []);
      var cols = el("colgroup", null, lead.concat(C.map(function (c, i) {
        return el("col", { style: "width:" + (L.widths ? L.widths[i] + "px" : c.w + "%") }); }))
        .concat(HAS_EDIT ? [el("col", { style: "width:" + (L.widths ? L.widths[C.length] + "px" : editW + "%") })] : []));
      var allBox = el("input", { type: "checkbox", id: P + "selall", "aria-label": "Select every row shown" });
      allBox.checked = shown.length > 0 && shown.every(function (r) { return L.sel[K(r)]; });
      allBox.addEventListener("change", function () {
        shown.forEach(function (r) { if (allBox.checked) L.sel[K(r)] = true; else delete L.sel[K(r)]; });
        redrawList(); var b = document.getElementById(P + "selall"); if (b) b.focus();
      });
      var headRow = el("tr", null, [el("th", { scope: "col", cls: P + "box" }, [allBox])]
        .concat(S.flag ? [el("th", { scope: "col", cls: P + "box", text: "Flag" })] : []).concat(C.map(function (c, i) {
        var lvIdx = -1; L.sort.forEach(function (x, k) { if (x.col === i) lvIdx = k; });
        var on = lvIdx > -1, up = on && L.sort[lvIdx].dir > 0;
        var b = el("button", { type: "button", cls: P + "sort", title: "Press to sort by this column; Shift and press to sort within the sort already set" },
          [c.h + (!on ? "" : (L.sort.length > 1 ? " (" + (lvIdx + 1) + ")" : "") + (c.n ? (up ? ", low to high" : ", high to low") : (up ? ", A to Z" : ", Z to A")))]);
        b.addEventListener("click", function (e) {
          L.ai = false;
          if (e.shiftKey) {
            if (on) L.sort[lvIdx].dir = -L.sort[lvIdx].dir; else L.sort.push({ col: i, dir: 1 });
          } else L.sort = [{ col: i, dir: on && L.sort.length === 1 ? -L.sort[0].dir : 1 }];
          redrawList();
          var nb2 = document.querySelectorAll("." + P + "sort")[i]; if (nb2) nb2.focus();
        });
        return el("th", { scope: "col", "aria-sort": lvIdx === 0 ? (up ? "ascending" : "descending") : "none" }, [b, listGrip(i, c.h)]);
      })).concat(HAS_EDIT ? [el("th", { scope: "col" }, [el("span", { cls: CL.vh, text: "Edit" })])] : []));
      var filterRow = el("tr", { cls: P + "cf" }, [el("td")].concat(S.flag ? [el("td")] : []).concat(C.map(function (c, i) {
        var inp = el("input", { type: "search", cls: P + "in " + P + "cfin", id: P + "cf-" + i, autocomplete: "off",
          "aria-label": "Filter " + c.h, placeholder: "Filter" });
        inp.value = L.cf[i] || "";
        inp.addEventListener("input", function () {
          L.cf[i] = inp.value; L.limit = LIST_LIMIT; redrawList();
          var n = document.getElementById(P + "cf-" + i); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} }
        });
        return el("td", null, [inp]);
      })).concat(HAS_EDIT ? [el("td")] : []));
      var thead = el("thead", null, [headRow, filterRow]);
      var body = el("tbody");
      var aiOn = !!(G && L.ai && L.aiData), gi = aiOn ? (L.gi || listGroupIndex()) : null, sgByGroup = {};
      var lastKey = null, lastLone = false, lastNew = false;
      if (gi && G.extra) S.rows().forEach(function (x) {
        if (G.extra.test(x)) { var k = gi.by[K(x)].key; sgByGroup[k] = (sgByGroup[k] || 0) + 1; }
      });
      shown.forEach(function (r) {
        var rk = K(r);
        // Every run of rows gets its band (Sam, 2026-11-01, on 832 Arrest: three titles that stood alone read as members,
        // because only groups of two or more had one).
        if (gi) {
          var gb = gi.by[rk], GR = gi.groups[gb.key], isNew = gb.key.indexOf("new:") === 0;
          if (GR.isGroup) { if (gb.key !== lastKey) body.appendChild(listGroupBand(GR, sgByGroup[gb.key] || 0)); }
          else if (isNew) { if (!lastNew) body.appendChild(listPlainBand("Added since the AI sort was built")); }
          else if (!lastLone) body.appendChild(listPlainBand("Not in a group"));
          lastKey = gb.key; lastLone = !GR.isGroup && !isNew; lastNew = isNew;
        }
        var titleTd = el("td", { cls: P + "title", title: listTitle(r) }, [listTitle(r)]);
        (S.titleSubs ? S.titleSubs(r, L, aiOn) : []).forEach(function (n) { if (n) titleTd.appendChild(n); });
        var editBtn = HAS_EDIT ? word("Edit", function () {
          L.edit = rk;
          L.draft = S.edit.draft(r);
          L.note = ""; redrawList();
          var t = document.getElementById(S.edit.fields[0].id); if (t) t.focus();
        }, { "aria-label": "Edit " + listTitle(r) }) : null;
        var selBox = el("input", { type: "checkbox", "aria-label": "Select " + listTitle(r) });
        selBox.checked = !!L.sel[rk];
        selBox.addEventListener("change", function () {
          if (selBox.checked) L.sel[rk] = true; else delete L.sel[rk];
          if (gi) { var y = listScrollTop(); redrawList(); listScrollTop(y); var b = document.querySelector('[aria-label="Select ' + listTitle(r).replace(/"/g, '\\"') + '"]'); if (b) b.focus(); }
          else listCountSel();
        });
        var flagged = S.flag ? S.flag.get(r) : "";
        var flagBox = null;
        if (S.flag) {
          flagBox = el("input", { type: "checkbox", "aria-label": "Flag " + listTitle(r), title: flagged ? "Flagged " + stamp(flagged) : null });
          flagBox.checked = !!flagged;
          flagBox.disabled = !!L.flagBusy[rk];
          flagBox.addEventListener("change", function () { S.flag.set(r, flagBox.checked); });
        }
        var open = L.open && L.open.ut === rk ? L.open.col : -1;
        titleTd.insertBefore(L.editAll && C[0].edit ? listCellInput(r, C[0].edit, listTitle(r), C[0].h) : listOpener(r, 0, listTitle(r), open === 0), titleTd.firstChild);
        titleTd.removeChild(titleTd.childNodes[1]);
        body.appendChild(el("tr", { cls: (L.sel[rk] ? P + "sel" : "") + (flagged ? " " + P + "flagged" : "") || null },
          [el("td", { cls: P + "box" }, [selBox])].concat(S.flag ? [el("td", { cls: P + "box" }, [flagBox])] : []).concat([titleTd]).concat(C.slice(1).map(function (c, k) {
          var v = c.v(r), t = c.n ? (v == null ? "" : fmt(v) + (c.suffix || "")) : v;
          var td = el("td", { cls: c.n ? P + "n" : null, title: t ? String(t) : null });
          var kind = L.editAll && c.edit;
          td.appendChild(kind ? listCellInput(r, kind, t == null ? "" : String(t), c.h) : listOpener(r, k + 1, t == null ? "" : String(t), open === k + 1));
          return td;
        }), HAS_EDIT ? [el("td", null, [editBtn])] : [])));
        if (open > -1) body.appendChild(listDrawer(r, open));
        if (HAS_EDIT && L.edit === rk && L.draft) body.appendChild(listEditRow(r));
      });
      var region = el("div", { cls: P + "wrap", role: "region", "aria-label": N.region, tabindex: "0" }, [
        el("table", { cls: P + "table" + (L.wrap ? "" : " " + P + "nowrap"),
          style: L.widths ? "width:" + (L.widths.reduce(function (a, w) { return a + w; }, 0) + boxW) + "px" : null }, [cols, thead, body])]);
      var dl = word("Download these " + fmt(rows.length) + " as a spreadsheet", function () { listDownload(rows); });
      // Wrap text (Sam, 2026-11-01: "a toggle to wrap or unwrap all fields and set it to default unwrapped ... that tight
      // scrollable, scannable view I need"). Unwrapped, each cell keeps one line and shows the rest on hover.
      var wrapBtn = word("Wrap text", function () { L.wrap = !L.wrap; redrawList(); var b = document.getElementById(P + "wrap"); if (b) b.focus(); },
        { id: P + "wrap", "aria-pressed": L.wrap ? "true" : "false" });
      var out = el("div", null, [el("div", { cls: P + "count" }, [el("span", { cls: CL.muted + " " + CL.small, text: fmt(rows.length) + " " + N.many +
        (rows.length > shown.length ? ", the first " + fmt(shown.length) + " shown" : "") }),
        el("span", { cls: CL.muted + " " + CL.small, id: P + "selcount", text: listSelWords() }),
        el("span", { cls: CL.note + " " + CL.small, id: P + "cellnote", role: "status", text: L.cellNote || "", hidden: L.cellNote ? null : "" }),
        el("span", { cls: CL.muted + " " + CL.small, id: P + "sortline", text: aiOn && G.sortLine
          ? G.sortLine(L)
          : "Sorted by " + L.sort.map(function (x) {
          var c = listCols()[x.col]; return c.h + (c.n ? (x.dir > 0 ? ", low to high" : ", high to low") : (x.dir > 0 ? ", A to Z" : ", Z to A")); }).join(", then ")
          + ". Shift and press a header to add a level." }),
        G ? word("AI sort", listAiToggle, { id: P + "ai", "aria-pressed": aiOn ? "true" : "false" }) : null,
        aiOn || L.sort.length > 1 || L.sort[0].col !== 0 || L.sort[0].dir !== 1 ? word("Clear the sort", function () { L.ai = false; L.sort = [{ col: 0, dir: 1 }]; redrawList(); }) : null,
        hasCellEdit() ? word("Edit every row", function () { L.editAll = !L.editAll; redrawList(); var b = document.getElementById(P + "editall"); if (b) b.focus(); },
          { id: P + "editall", "aria-pressed": L.editAll ? "true" : "false" }) : null,
        word("Clear the selection", function () { L.sel = {}; redrawList(); }), wrapBtn,
        !S.fr || frState().open ? null : word("Find and replace", function () {
          frState().open = true; render(); var n = document.getElementById(FP + "find"); if (n) n.focus(); }, { id: FP + "open" }), dl]), region]);
      var selKeys = Object.keys(L.sel);
      if (gi && selKeys.length) out.appendChild(listMovePanel(selKeys));
      if (rows.length > shown.length) out.appendChild(word("Show " + fmt(Math.min(LIST_LIMIT, rows.length - shown.length)) + " more",
        function () { L.limit += LIST_LIMIT; redrawList(); }));
      return out;
    }
    /* AI sort: read the day's order once, then sort by it until a header is pressed. */
    function listAiToggle() {
      var L = listState();
      function focusIt() { var b = document.getElementById(P + "ai"); if (b) b.focus(); }
      if (L.ai) { L.ai = false; redrawList(); focusIt(); return Promise.resolve(); }
      return listAiLoad().then(function () {
        L.ai = true; L.limit = LIST_LIMIT; redrawList(); focusIt();
      }).catch(function () { L.cellNote = "The AI sort's order could not be read; the list keeps its sort."; redrawList(); focusIt(); });
    }
    function listAiLoad() {
      var L = listState();
      if (L.aiData) return Promise.resolve(L.aiData);
      return fetch(G.url, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !d.order) throw new Error("no order");
        L.aiData = d; return d;
      });
    }
    /* Every row's group under the AI sort. A saved group wins: a kept group by its name, Out of every group alone;
       otherwise the night's grouping. A group is two or more titles, or any group a reviewer kept, even of one. Groups and
       titles alone run A to Z by name; inside a group, the night's order (subject words, then level). Two groups that share
       a name are one group, so a rename to another group's name joins them. */
    function listGroupIndex() {
      var d = listState().aiData, by = {}, groups = {};
      S.rows().forEach(function (r) {
        var rk = K(r), pos = d.order[rk], saved = String(G.saved(r) || "").trim(), key, name;
        if (saved && saved !== NO_GROUP) { key = "g:" + saved.toLowerCase(); name = saved; }
        else if (saved === NO_GROUP || !pos) { key = (pos || saved ? "1:" : "new:") + rk; name = listTitle(r); }
        else {
          var g = d.groups[pos[0]] || { name: listTitle(r), n: 1 };
          key = g.n > 1 ? "g:" + g.name.toLowerCase() : "1:" + rk; name = g.name;
        }
        var GR = groups[key] || (groups[key] = { key: key, name: name, n: 0, kept: 0, members: [] });
        GR.n++; GR.members.push(r);
        if (saved && saved !== NO_GROUP) GR.kept++;
        by[rk] = { key: key, pos: pos ? pos[1] : 1e9, sort: key.indexOf("new:") === 0 ? "\uffff" : name.toLowerCase() };
      });
      Object.keys(groups).forEach(function (k) { var GR = groups[k]; GR.isGroup = k.indexOf("g:") === 0 && (GR.n > 1 || GR.kept > 0); });
      return { by: by, groups: groups };
    }
    function listPlainBand(name) {
      return el("tr", { cls: P + "band " + P + "band-plain" }, [el("th", { scope: "rowgroup", colspan: String(span()) }, [el("span", { text: name })])]);
    }
    /* A group's band: its name, what it holds across its titles, and Keep or Rename. The facts count every title in the
       group, filtered out or not. */
    function listGroupBand(GR, sg) {
      var L = listState(), all = GR.kept === GR.n;
      var facts = fmt(GR.n) + " in this group" + (G.facts ? ", " + G.facts(GR.members) : "")
        + (sg && G.extra ? ", " + G.extra.words(sg) : "")
        + (all ? "; kept" : GR.kept ? "; " + fmt(GR.kept) + " kept" : "");
      var th = el("th", { scope: "rowgroup", colspan: String(span()), "data-gkey": GR.key });
      if (L.gEdit === GR.key) {
        var inp = el("input", { type: "text", id: P + "gname", cls: P + "in", autocomplete: "off", "aria-label": "Name for the group " + GR.name });
        inp.value = GR.name;
        var go = function () { listKeepGroup(GR, inp.value); };
        var stop = function () { L.gEdit = null; redrawList(); listFocusBand(GR.key); };
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); else if (e.key === "Escape") stop(); });
        th.appendChild(el("span", { cls: P + "gedit" }, [inp, word(L.gBusy ? "Saving…" : "Keep under this name", go), word("Cancel", stop)]));
        th.appendChild(el("span", { cls: CL.muted, text: facts }));
      } else {
        th.appendChild(el("span", { text: GR.name }));
        th.appendChild(el("span", { cls: CL.muted, text: facts }));
        th.appendChild(el("span", { cls: P + "gacts" }, [
          word(all ? "Rename" : "Keep this group", function () {
            L.gEdit = GR.key; redrawList();
            var n = document.getElementById(P + "gname"); if (n) { n.focus(); try { n.select(); } catch (e) {} }
          }, { "aria-label": (all ? "Rename the group " : "Keep the group ") + GR.name }),
          GR.kept ? word("Release", function () { listReleaseGroup(GR); }, { "aria-label": "Hand the group " + GR.name + " back to the AI sort" }) : null]));
      }
      return el("tr", { cls: P + "band" }, [th]);
    }
    function listFocusBand(key) {
      var th = Array.from(document.querySelectorAll("." + P + "band th[data-gkey]")).filter(function (x) { return x.getAttribute("data-gkey") === key; })[0];
      var b = th && th.querySelector("button");
      if (b) b.focus(); else { var r = document.querySelector("." + P + "wrap"); if (r) r.focus(); }
    }
    function listScrollTop(y) {
      var w = document.querySelector("." + P + "wrap");
      if (!w) return 0;
      if (y != null) w.scrollTop = y;
      return w.scrollTop;
    }
    /* Move the selected titles (Sam, 2026-11-01: "a way to do it easily from this view"): tick the rows, name a group, or
       take them out of every group, or hand them back to the night's sort. It sits under the table, where a phone reaches. */
    function listMovePanel(keys) {
      var L = listState(), gi = L.gi || listGroupIndex(), item = G.item || "title";
      var names = Object.keys(gi.groups).map(function (k) { return gi.groups[k]; }).filter(function (GR) { return GR.isGroup; })
        .map(function (GR) { return GR.name; }).sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
      var what = keys.length === 1 ? "the selected " + item : "the " + fmt(keys.length) + " selected " + item + "s";
      var inp = el("input", { type: "text", id: P + "moveto", cls: P + "in", autocomplete: "off", list: P + "gnames",
        placeholder: "A group's name, or a new one" });
      inp.value = L.moveTo || "";
      inp.addEventListener("input", function () { L.moveTo = inp.value; });
      var go = function () {
        var v = inp.value.trim();
        if (!v || v === NO_GROUP) { L.cellNote = "Name the group to move " + what + " into."; redrawList(); var n = document.getElementById(P + "moveto"); if (n) n.focus(); return; }
        listMoveTo(keys, v);
      };
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      var saved = keys.some(function (k) { var r = rowOf(k); return r && G.saved(r); });
      return el("div", { cls: P + "move", role: "group", "aria-label": "Move " + what }, [
        el("label", { cls: P + "f", "for": P + "moveto" }, [el("span", { text: "Move " + what + " to a group" }), inp]),
        el("datalist", { id: P + "gnames" }, names.map(function (n) { return el("option", { value: n }); })),
        el("div", { cls: P + "acts" }, [
          word(L.gBusy ? "Saving…" : "Move", go, { id: P + "movego" }),
          word("Out of every group", function () { listMoveTo(keys, NO_GROUP); }),
          saved ? word("Back to the AI sort", function () { listMoveTo(keys, ""); }) : null,
          word("Clear the selection", function () { L.sel = {}; redrawList(); })])]);
    }
    function rowOf(k) { return (S.rows() || []).filter(function (x) { return K(x) === k; })[0]; }
    function listTitleOf(k) { var r = rowOf(k); return r ? listTitle(r) : k; }
    function listMoveTo(keys, value) {
      var L = listState(), n = keys.length, item = G.item || "title", label = n === 1 ? "“" + listTitleOf(keys[0]) + "”" : fmt(n) + " " + item + "s";
      var note = value === NO_GROUP ? "Took " + label + " out of every group." : value === "" ? "Handed " + label + " back to the AI sort."
        : "Moved " + label + " to " + value + ".";
      return listSaveGroups(keys, value, note).then(function (ok) {
        if (!ok) return;
        L.sel = {}; L.moveTo = "";
        redrawList();
        if (value && value !== NO_GROUP) listFocusBand("g:" + value.toLowerCase()); else listFocusBand("");
      });
    }
    /* Keep this group: every title in it saves the group's name, the one in the box. Rename is the same write. */
    function listKeepGroup(GR, name) {
      var L = listState();
      name = String(name || "").trim();
      if (!name || name === NO_GROUP) { L.cellNote = "A group needs a name."; redrawList(); return Promise.resolve(); }
      var keys = GR.members.map(K);
      return listSaveGroups(keys, name, (GR.kept === GR.n && name !== GR.name ? "Renamed " + GR.name + " to " : "Kept " + fmt(keys.length) + " in ") + name + ".")
        .then(function (ok) { if (!ok) return; L.gEdit = null; redrawList(); listFocusBand("g:" + name.toLowerCase()); });
    }
    function listReleaseGroup(GR) {
      var keys = GR.members.filter(function (m) { var v = G.saved(m); return v && v !== NO_GROUP; }).map(K);
      return listSaveGroups(keys, "", "Handed " + GR.name + " back to the AI sort.").then(function (ok) { if (ok) { redrawList(); listFocusBand(""); } });
    }
    /* One request for the lot; the spec changes its overlay only once the store says yes. */
    function listSaveGroups(keys, value, note) {
      var L = listState();
      if (!keys.length) return Promise.resolve(false);
      L.gBusy = true;
      return Promise.resolve().then(function () { return G.save(keys, value); }).then(function () {
        L.gBusy = false; L.cellNote = note;
        return true;
      }).catch(function (e) {
        L.gBusy = false;
        L.cellNote = e && e.message === "signin" ? "Sign in as a reviewer to move titles or keep a group."
          : "The group did not save (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
        redrawList();
        return false;
      });
    }
    /* Edit every row (Sam, 2026-11-01: "a global Edit button that would allow me to make edits directly on any row
       without clicking the rows individual edit button"). A column with an edit kind becomes boxes; leaving a box saves
       it, Enter saves, Escape puts the value back. */
    function listCellInput(r, kind, value, label) {
      var inp = el("input", { type: "text", cls: P + "in " + P + "cellin", autocomplete: "off",
        "aria-label": label + " of " + listTitle(r), "data-kind": kind });
      inp.value = value; inp.setAttribute("data-was", value);
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
        else if (e.key === "Escape") { inp.value = inp.getAttribute("data-was"); }
      });
      inp.addEventListener("change", function () { S.cellSave(r, kind, inp, label); });
      return inp;
    }
    function listCellNote(text) {
      var L = listState(), n = document.getElementById(P + "cellnote");
      L.cellNote = text;
      if (n) { n.textContent = text; n.hidden = !text; }
    }
    function listSelWords() {
      var n = Object.keys(listState().sel).length;
      return n ? fmt(n) + " selected" : "";
    }
    function listCountSel() { var n = document.getElementById(P + "selcount"); if (n) n.textContent = listSelWords(); }
    /* A cell opens its drill-down in a drawer under the row (Sam, 2026-11-01: "how many of these fields can you make
       drill downs for on click?"; "build the open in detail as you propose"). A second press closes it. */
    function listOpener(r, col, text, isOpen) {
      var L = listState();
      var b = el("button", { type: "button", cls: P + "open", "aria-expanded": isOpen ? "true" : "false",
        "aria-label": listCols()[col].h + ": " + (text || "none") + ", details" }, [text || "—"]);
      b.addEventListener("click", function () {
        L.open = isOpen ? null : { ut: K(r), col: col }; L.edit = null; redrawList();
        var again = document.querySelector("." + P + 'open[aria-expanded="true"]'); if (again) again.focus();
      });
      return b;
    }
    function listFilterBy(col, value) {
      var L = listState();
      L.cf = {}; L.cf[col] = value; L.open = null; L.limit = LIST_LIMIT; render();
    }
    function listDrawer(r, col) {
      var L = listState(), C = listCols(), box = el("div", { cls: P + "drawer" });
      box.appendChild(el("p", { cls: P + "dh" }, [C[col].h + ", " + listTitle(r)]));
      function line(text, cls) { box.appendChild(el("p", { cls: P + "dl" + (cls ? " " + P + cls : ""), text: text })); }
      function list(items) { box.appendChild(el("ul", { cls: P + "dul" }, items.map(function (x) { return el("li", null, typeof x === "string" ? [x] : x); }))); }
      // Each drawer answers its column by name: the Confidence column, added after the drawers, had shifted every one
      // after it by a place (S541).
      if (S.drawer) S.drawer(r, C[col].h, { line: line, list: list, box: box, word: word, el: el, filterBy: listFilterBy,
        colIndex: listColIndex, L: L, LIMIT: LIST_LIMIT, fmt: fmt, stamp: stamp });
      box.appendChild(word("Close", function () { L.open = null; redrawList(); }));
      return el("tr", { cls: P + "editrow" }, [el("td", { colspan: String(span()) }, [box])]);
    }
    /* Resizable columns (Sam, 2026-11-01: "make the columns resizable"). Each header's right edge is a separator: drag
       it, or focus it and use the arrow keys (Home narrows to the least). The first resize fixes every column at its
       drawn width in pixels, so the table may grow wider and scroll inside its own box. Widths last the visit; a column
       width is not a filter (CLAUDE.md, tabs never remember a filter). */
    function listFixWidths() {
      var L = listState();
      if (L.widths) return L.widths;
      var cols = Array.prototype.slice.call(document.querySelectorAll("." + P + "table col"), NBOX);
      L.widths = cols.map(function (c) {
        var w = c.getBoundingClientRect ? Math.round(c.getBoundingClientRect().width) : 0;
        return w > 0 ? w : 120;
      });
      return L.widths;
    }
    function listSetWidth(i, w) {
      var L = listState(), W = listFixWidths();
      W[i] = Math.max(LIST_MIN_W, Math.round(w));
      var col = document.querySelectorAll("." + P + "table col")[i + NBOX];
      if (col) col.style.width = W[i] + "px";
      var t = document.querySelector("." + P + "table");
      if (t) t.style.width = (W.reduce(function (a, x) { return a + x; }, 0) + 32 * NBOX) + "px";
      var g = document.getElementById(P + "grip-" + i);
      if (g) g.setAttribute("aria-valuenow", String(W[i]));
      return L;
    }
    // Each separator reports its column's drawn width once the table is on the page.
    function listSyncGrips() {
      var cols = Array.prototype.slice.call(document.querySelectorAll("." + P + "table col"), NBOX);
      Array.prototype.forEach.call(document.querySelectorAll("." + P + "grip"), function (g, i) {
        var w = cols[i] && cols[i].getBoundingClientRect ? Math.round(cols[i].getBoundingClientRect().width) : 0;
        if (w > 0) g.setAttribute("aria-valuenow", String(w));
      });
    }
    function listGrip(i, label) {
      var L = listState();
      var g = el("span", { cls: P + "grip", id: P + "grip-" + i, role: "separator", tabindex: "0", "aria-orientation": "vertical",
        "aria-label": "Resize " + label, "aria-valuemin": String(LIST_MIN_W), "aria-valuemax": "1200",
        "aria-valuenow": L.widths ? String(L.widths[i]) : "120" });
      g.addEventListener("keydown", function (e) {
        var W = listFixWidths();
        if (e.key === "ArrowRight") listSetWidth(i, W[i] + LIST_STEP);
        else if (e.key === "ArrowLeft") listSetWidth(i, W[i] - LIST_STEP);
        else if (e.key === "Home") listSetWidth(i, LIST_MIN_W);
        else return;
        e.preventDefault();
      });
      /* A drag by mouse, pen or finger (Sam on his phone, 2026-11-01: "trying to resize the first column but not having
         luck"). The grip captures the pointer, so a finger that leaves the strip keeps resizing, and touch-action:none
         keeps the phone from taking the drag as a scroll. */
      g.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        var startX = e.clientX, startW = listFixWidths()[i];
        try { g.setPointerCapture(e.pointerId); } catch (err) {}
        function move(ev) { if (ev.pointerId === e.pointerId) listSetWidth(i, startW + (ev.clientX - startX)); }
        function up(ev) {
          if (ev && ev.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
          g.removeEventListener("pointermove", move); document.removeEventListener("pointermove", move);
          ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.removeEventListener(t, up); document.removeEventListener(t, up); });
        }
        g.addEventListener("pointermove", move); document.addEventListener("pointermove", move);
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { g.addEventListener(t, up); document.addEventListener(t, up); });
      });
      g.addEventListener("click", function (e) { e.stopPropagation(); });
      return g;
    }
    /* The rows as they are filtered and sorted, as a CSV Excel opens (a byte-order mark keeps é and – intact). */
    function listCsv(rows) {
      var C = listCols();
      var q = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var lines = [[N.keyHeader].concat(C.map(function (c) { return c.h; })).map(q).join(",")];
      rows.forEach(function (r) { lines.push([K(r)].concat(C.map(function (c) { return c.v(r); })).map(q).join(",")); });
      return "\ufeff" + lines.join("\r\n") + "\r\n";
    }
    function listDownload(rows) {
      var csv = listCsv(rows), L = listState();
      try {
        var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        var a = el("a", { href: url, download: N.file + "-" + new Date().toISOString().slice(0, 10) + ".csv" });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        L.note = "Downloaded " + fmt(rows.length) + " rows. Edits made in the spreadsheet do not come back here yet; make them in the list.";
      } catch (e) { L.note = "This browser could not make the file (" + (e && e.message || "no answer") + ")."; }
      render();
    }
    function ensureListCss() {
      if (document.getElementById(P + "css")) return;
      var p = "." + P, f = "." + FP, w = "." + CL.w, m = "." + CL.muted;
      var rules = [
        p + "bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:8px 0}",
        p + "q{flex:1 1 280px;max-width:520px}",
        p + "filters{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.8125rem}",
        p + "re{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin:4px 0 8px}",
        p + "re{flex-direction:column;align-items:stretch;max-width:760px}",
        p + "relabel{font-size:.8125rem;color:var(--text-strong);font-weight:600}",
        p + "ta{width:100%;box-sizing:border-box;resize:vertical;min-height:3.5em}",
        p + "in{font:inherit;font-size:.8125rem;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface-opaque);color:var(--text-body)}",
        "#" + P + "host{min-width:0;max-width:100%}",
        p + "wrap{width:100%;max-width:100%;box-sizing:border-box;overflow-x:auto;max-height:75vh;overflow-y:auto;border:1px solid var(--border);border-radius:6px}",
        p + "table{width:100%;min-width:1100px;table-layout:fixed;border-collapse:collapse;font-size:.75rem;line-height:1.3}",
        p + "table th{position:sticky;top:0;background:var(--surface-opaque);color:var(--text-strong);text-align:left;font-weight:600;padding:3px 6px;border-bottom:1px solid var(--border)}",
        p + "table td{padding:2px 6px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--text-body);overflow-wrap:anywhere}",
        p + "title{color:var(--text-strong)}",
        p + "box{text-align:center;padding-left:2px;padding-right:2px}",
        p + "box input{width:24px;height:24px;margin:0;accent-color:var(--accent-link)}",
        p + "open{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;text-align:inherit;cursor:pointer;min-height:24px;width:100%;overflow:hidden;text-overflow:ellipsis;display:block}",
        p + "nowrap " + p + "open{white-space:nowrap}",
        p + "open:hover," + p + "open:focus-visible{text-decoration:underline;text-decoration-color:var(--accent-link);text-underline-offset:2px}",
        p + "open[aria-expanded='true']{font-weight:600}",
        p + "sel td{background:var(--surface-opaque)}",
        p + "flagged td:nth-child(3){box-shadow:inset 3px 0 0 var(--accent-link)}",
        p + "drawer{display:flex;flex-direction:column;gap:4px;padding:6px 4px;max-width:960px;white-space:normal}",
        p + "dh{margin:0;font-weight:600;color:var(--text-strong)}",
        p + "dl{margin:0}",
        p + "dul{margin:0;padding-left:18px}",
        p + "warn{color:var(--text-strong);font-weight:600}",
        p + "table th{position:sticky}",
        p + "grip{position:absolute;top:0;right:0;width:24px;height:100%;min-height:24px;cursor:col-resize;z-index:3;touch-action:none}",
        p + "grip::after{content:'';position:absolute;top:20%;bottom:20%;right:0;width:1px;background:var(--border)}",
        p + "grip:hover::after," + p + "grip:focus-visible::after{width:3px;background:var(--accent-link)}",
        // On a touch screen the handle shows at rest, a finger's width to find (Sam on his phone, 2026-11-01).
        "@media (pointer:coarse){" + p + "grip{width:32px}" + p + "grip::after{width:3px;top:25%;bottom:25%;background:var(--text-muted)}}",
        p + "grip:focus-visible{outline:2px solid var(--focus-ring);outline-offset:-2px}",
        p + "nowrap td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
        p + "nowrap " + p + "sub{display:inline;margin-left:6px}",
        p + "nowrap " + p + "editrow td," + p + "nowrap " + p + "cf td{white-space:normal;overflow:visible}",
        p + "count " + w + "[aria-pressed='true']{font-weight:600}",
        p + "sub{display:block;color:var(--text-muted);font-size:.6875rem}",
        p + "n{text-align:right;font-variant-numeric:tabular-nums}",
        p + "table " + w + "{font-size:.75rem;min-height:24px;min-width:24px;padding:0 2px}",
        p + "editrow td{background:var(--surface-opaque)}",
        p + "edit{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:flex-end;padding:4px 0}",
        p + "f{display:flex;flex-direction:column;gap:2px;flex:1 1 200px;font-size:.6875rem;color:var(--text-muted)}",
        p + "acts{display:flex;gap:12px}",
        f.replace(/-$/, "") + "{border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin:4px 0 8px;min-width:0;max-width:100%;box-sizing:border-box}",
        "#" + FP + "host{min-width:0;max-width:100%}",
        p + "table tr" + p + "band th{position:static;text-align:left;font-weight:600;color:var(--text-strong);background:var(--surface-opaque);padding:8px 6px 2px;border-top:1px solid var(--border);border-bottom:0;white-space:normal}",
        p + "band " + m + "{font-weight:400;margin-left:8px}",
        p + "table tr" + p + "band-plain th{color:var(--text-muted);font-weight:400}",
        p + "band " + p + "gacts{display:inline-flex;gap:12px;margin-left:12px;font-weight:400}",
        p + "band " + p + "gedit{display:inline-flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-weight:400}",
        p + "move{position:sticky;bottom:0;z-index:3;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:flex-end;margin:6px 0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--surface-opaque)}",
        p + "nowrap " + p + "sg{display:block;white-space:normal}",
        p + "cellin{width:100%;box-sizing:border-box;font-size:.75rem;padding:1px 4px;min-height:24px}",
        p + "nowrap td " + p + "cellin{white-space:normal}",
        p + "table" + f + "table{min-width:0}",
        f + "h{font-size:14px;margin:0 0 2px}",
        f + "form{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:flex-end;margin:6px 0}",
        f + "ticks{display:flex;gap:12px;align-items:center;min-height:24px}",
        f + "tick{display:inline-flex;gap:4px;align-items:center;font-size:12px;min-height:24px}",
        f + "wrap{max-height:50vh;margin:4px 0}",
        f + "table del{color:var(--text-muted);text-decoration:line-through}",
        f + "table ins{text-decoration:none;font-weight:600}",
        p + "count{display:flex;flex-wrap:wrap;gap:4px 16px;align-items:baseline;margin:2px 0 4px}",
        p + "sort{background:none;border:0;padding:0;font:inherit;font-weight:600;color:var(--text-strong);text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px;min-height:24px}",
        p + "cf td{background:var(--surface-opaque);padding:5px 4px 4px;border-bottom:1px solid var(--border)}",
        p + "cfin{width:100%;min-width:24px;box-sizing:border-box;font-size:.6875rem;min-height:24px}",
        "." + CL.vh + "{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
        // A phone keeps the fixed layout, so the column widths a drag sets apply; automatic layout sized the Title
        // column to its longest title, past the screen's edge, and ignored the grip (Sam on his phone, 2026-11-01).
        "@media (max-width:560px){" + p + "table{min-width:900px}}"
      ];
      // A tab with no base classes of its own gets the Exhibits tab's: underlined words, muted and small text, the
      // finder's box, the current filter underlined.
      if (OWN_BASE) rules = rules.concat([
        "button" + w + "{all:unset;cursor:pointer;min-height:24px;color:var(--cobalt);text-decoration:underline;text-underline-offset:3px}",
        "button" + w + ":focus-visible{outline:2px solid var(--seal-blue);outline-offset:2px}",
        m + "{color:var(--text-muted)}",
        "." + CL.small + "{font-size:.88rem}",
        "." + CL.empty + "{color:var(--text-muted);margin:0}",
        "." + CL.search + "{min-width:0;padding:8px 12px;border:1px solid var(--border-strong);border-radius:6px;background:var(--surface);color:var(--text-body);font:inherit}",
        "." + CL.search + ":focus-visible{outline:2px solid var(--seal-blue);outline-offset:1px}",
        "." + CL.on + "{color:var(--text-strong);font-weight:600;text-decoration:underline;text-decoration-thickness:3px;text-decoration-color:var(--seal-blue-text);text-underline-offset:3px}"
      ]);
      document.head.appendChild(el("style", { id: P + "css", text: rules.join("\n") }));
    }

    var api = {
      render: renderList, redraw: redrawList, state: listState, rows: listRows, csv: listCsv, fold: listFold, cellNote: listCellNote,
      aiLoad: function () { return G ? listAiLoad() : Promise.resolve(null); }, filterBy: listFilterBy, colIndex: listColIndex,
      frSwap: frSwap, frClean: frClean, word: word, el: el, fmt: fmt, stamp: stamp, LIMIT: LIST_LIMIT, NO_GROUP: NO_GROUP
    };
    return api;
  }

  window.CPL_COMMONS_LIST = { create: create, LIMIT: LIST_LIMIT };
})();
