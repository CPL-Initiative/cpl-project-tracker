// commons_data_sharing.js — College Data Collection's data dictionary and data-sharing card (#3310 item 4).
//
// Sam will show College Data Collection to the Chancellor's Office research and data staff when he asks for API
// access to their datasets, and WestEd and Credential Engine asked what access to Commons data would take. So the
// page says what is public, what is not, and where the two join. Everything here comes from one hand-kept file,
// kb/cdc_data_dictionary.json, through kb/_build_cdc_sharing.py into kb/status/cdc_sharing.json, which this module
// reads (it WRITES NOTHING):
//   - a card on each college's side panel: the panel's fields by class, what is held and not shown, the join keys and
//     the agreements' status;
//   - a statewide card on the college list's page;
//   - the full view at #commons/data/sharing (its own address, through commons_data.js's views).
// tests/commons_data_sharing.test.js fails when the page shows a field the file does not define, or the file defines
// one no view shows.
//
// commons_data.js loads this module and calls it through window.CPL_CDC_EXT (one entry per module beside it): views,
// ledes, ready (its own file), view, panel and statewide. Tokens only (the tab's --cmn roles), words for every
// control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/cdc_sharing.json";
  var VIEW_KEY = "sharing";
  var TITLE = "Data elements and sharing";
  var ORDER = ["public", "aggregate", "agreement", "held", "restricted"];
  var ST = { data: null, error: "" };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function classWord(D, k) { return ((D.classes || {})[k] || {}).word || k; }
  /* The class word inside a sentence: its first letter lowered, so "Aggregate, not PII" keeps its PII. */
  function classLower(D, k) { var w = classWord(D, k); return w.charAt(0).toLowerCase() + w.slice(1); }
  function classDef(D, k) { return ((D.classes || {})[k] || {}).definition || ""; }
  /* The join keys whose other side is not public: the ones where a public record meets one that is not. */
  function notPublicKeys(D) { return (D.join_keys || []).filter(function (j) { return j.other_class !== "public"; }); }
  function byClass(rows, k) { return (rows || []).filter(function (r) { return r.class === k; }); }
  function keyOf(D, id) { return (D.join_keys || []).filter(function (j) { return j.id === id; })[0] || null; }
  function unread(node) {
    node.appendChild(el("p", { cls: "cdd-of", text: "The data dictionary could not be read" + (ST.error ? " (" + ST.error + ")" : "") + ". Reload the tab to try again." }));
    return node;
  }
  /* The agreements in one line: how many at each status, in the builder's order, skipping a status none holds. */
  function agreementLine(D) {
    var n = (D.counts || {}).agreements || {};
    var parts = (D.agreement_status || []).filter(function (s) { return n[s]; }).map(function (s) { return n[s] + " " + s; });
    return parts.length ? "Agreements: " + parts.join(", ") + ". Status only, never an agreement's text." : "Agreements: none recorded.";
  }
  function viewWord(host, text, from) {
    var b = el("button", { type: "button", cls: "cmn-word cdc-sw-open", "data-view": VIEW_KEY, "data-from": from, text: text });
    b.addEventListener("click", function () { if (host && host.go) host.go(VIEW_KEY); });
    return b;
  }

  /* ── the card on a college's side panel ── */
  function panel(M, c, host) {
    var sec = el("section", { cls: "cdd-psec cdc-sw", "data-cdc-ext": "sharing", "aria-labelledby": "cdc-sw-h" },
      [el("h3", { id: "cdc-sw-h", text: TITLE })]);
    var D = ST.data;
    if (!D) return [unread(sec)];
    sec.appendChild(el("p", { cls: "cdd-of", text: "Each field on this panel for " + c.name + ", by who may see it. The same definitions hold for every college." }));
    ORDER.forEach(function (k) {
      var rows = byClass(D.elements, k);
      if (!rows.length) return;
      sec.appendChild(el("div", { cls: "cdc-sw-class", "data-class": k }, [
        el("h4", { text: classWord(D, k) + " (" + rows.length + ")" }),
        el("p", { cls: "cdc-sw-names", text: rows.map(function (r) { return r.name; }).join(", ") + "." })]));
    });
    /* What COBI or MAP holds that this page does not show, one group per class: public rows, then each other class
       under its own heading, so a public contact never sits under Held and a restricted roster never under Public. */
    var notShown = D.held_not_shown || [];
    function names(rows) { return rows.map(function (h) { return h.name + " (" + classLower(D, h.class) + ")"; }).join(", ") + "."; }
    function roleList(rows) {
      var r = [];
      rows.forEach(function (h) { (h.roles || []).forEach(function (x) { if (r.indexOf(x) < 0) r.push(x); }); });
      return r;
    }
    function joinWords(w) { return w.length < 2 ? w.join("") : w.slice(0, -1).join(", ") + " and " + w[w.length - 1]; }
    ORDER.forEach(function (k) {
      var rows = byClass(notShown, k);
      if (!rows.length) return;
      var roles = roleList(rows), note = null;
      if (k === "public" && roles.length) note = el("p", { cls: "cdd-of", text: "The " + joinWords(roles) + " contacts are public: every college landing page routes a student to them." });
      if (k === "restricted") note = el("p", { cls: "cdd-of", "data-held-roles": String(roles.length), text: "The public site never serves these: signed-in reviewers or the service role read them where they live, and they never go in an outside share." +
        (roles.length ? " Among them are the contacts for " + plural(roles.length, "other staff role", "other staff roles") + " (" + joinWords(roles) + ")." : "") });
      sec.appendChild(el("div", { cls: "cdc-sw-class", "data-class": k + "-not-shown" }, [
        el("h4", { text: classWord(D, k) + " and not shown on this page (" + rows.length + ")" }),
        el("p", { cls: "cdc-sw-names", text: names(rows) }), note]));
    });
    var joins = (D.elements || []).filter(function (e) { return e.join_key; });
    var open = notPublicKeys(D).map(function (j) { return j.id; });
    var used = [];
    joins.forEach(function (e) { if (used.indexOf(e.join_key) < 0 && open.indexOf(e.join_key) >= 0) used.push(e.join_key); });
    if (used.length) sec.appendChild(el("div", { cls: "cdc-sw-class", "data-class": "joins" }, [
      el("h4", { text: "Where these fields meet data that is not public" }),
      el("ul", { cls: "cdc-sw-joins" }, used.map(function (id) {
        var j = keyOf(D, id);
        return j ? el("li", { "data-join": id, text: j.name + ": joins " + j.public_side.charAt(0).toLowerCase() + j.public_side.slice(1) + " to " +
          j.other_side.charAt(0).toLowerCase() + j.other_side.slice(1) + " (" + classLower(D, j.other_class) + ")." }) : null;
      }))]));
    sec.appendChild(el("p", { cls: "cdd-of", "data-agreements": "true", text: agreementLine(D) }));
    sec.appendChild(el("p", { cls: "cdd-of" }, [viewWord(host, "Every field's definition, source and class, and the agreements", "panel")]));
    return [sec];
  }

  /* ── the statewide card on the college list's page ── */
  function statewide(M, host) {
    var sec = el("section", { cls: "cdd-notes cdc-sw-state", id: "cdc-sw-state", "data-cdc-ext": "sharing", "aria-labelledby": "cdc-sw-state-h" },
      [el("h3", { id: "cdc-sw-state-h", cls: "cdd-h3", text: TITLE })]);
    var D = ST.data;
    if (!D) return unread(sec);
    var n = (D.counts || {}).elements || {};
    sec.appendChild(el("p", { cls: "cdc-sw-lede", text: "What is public, what is not, and where the two join, for every college's page. " +
      plural((D.elements || []).length, "field", "fields") + ": " + ORDER.map(function (k) { return (n[k] || 0) + " " + classLower(D, k); }).join("; ") + "." }));
    sec.appendChild(el("ul", null, ORDER.map(function (k) {
      return el("li", { "data-class": k }, [el("strong", { text: classWord(D, k) + ". " }), classDef(D, k)]);
    })));
    var keys = notPublicKeys(D);
    sec.appendChild(el("p", { cls: "cdd-of", text: plural(keys.length, "key joins", "keys join") + " a public record to one that is not: " +
      keys.map(function (j) { return j.name; }).join(", ") + ". " + agreementLine(D) }));
    sec.appendChild(el("p", { cls: "cdd-of" }, [viewWord(host, "The full data dictionary and the agreements", "statewide")]));
    return sec;
  }

  /* ── the full view, #commons/data/sharing ── */
  function table(id, caption, cols, heads, rows) {
    return el("div", { cls: "cdd-wrap", role: "region", "aria-label": caption, tabindex: "0" }, [el("table", { cls: "cdd-table cdc-sw-table", id: id }, [
      el("caption", { cls: "cdd-sr", text: caption }),
      el("colgroup", null, cols.map(function (c) { return el("col", { cls: c }); })),
      el("thead", null, [el("tr", null, heads.map(function (h) { return el("th", { scope: "col", text: h }); }))]),
      el("tbody", null, rows)])]);
  }
  function td(label, text) { return el("td", { "data-label": label, text: text }); }
  function view(key, M, host) {
    if (key !== VIEW_KEY) return null;
    var sec = el("section", { cls: "cdd-view cdc-sw-view", id: "cdc-sw-view", "data-cdc-ext": "sharing", "aria-labelledby": "cdd-h" });
    var D = ST.data;
    if (!D) return unread(sec);
    var n = (D.counts || {}).elements || {};
    sec.appendChild(el("p", { cls: "cdd-src", text: "Built by " + D.builder + " from " + D.source + " alone; the same definitions draw the card on each college's panel and the doc " + D.doc + ". A COMIS element is filled only where the repo's own reference files record it." }));

    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-sw-classes", text: "The five classes" }));
    sec.appendChild(el("ul", { cls: "cdc-sw-deflist" }, ORDER.map(function (k) {
      return el("li", { "data-class": k }, [el("strong", { text: classWord(D, k) + " (" + plural(n[k] || 0, "field", "fields") + "). " }), classDef(D, k)]);
    })));

    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-sw-fields", text: "The fields each college's page shows" }));
    sec.appendChild(table("cdc-sw-fields-table", "Each field a college's page shows: its definition, source system, COMIS element, class and join key",
      ["cdc-c-name", "cdc-c-def", "cdc-c-sys", "cdc-c-comis", "cdc-c-class", "cdc-c-key"],
      ["Field", "Definition", "System", "COMIS element", "Class", "Join key"],
      (D.elements || []).map(function (e) {
        return el("tr", { "data-element": e.id, "data-class": e.class }, [
          el("th", { scope: "row", "data-label": "Field" }, [e.name, el("span", { cls: "cdd-of", text: "Shown as " + (e.labels || []).join("; ") })]),
          td("Definition", e.definition), td("System", e.system_name), td("COMIS element", e.comis_element || "None recorded"),
          td("Class", classWord(D, e.class)), td("Join key", e.join_key_name || "None")]);
      })));

    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-sw-held", text: "Held and not shown" }));
    sec.appendChild(el("p", { cls: "cdd-of", text: "What COBI or MAP holds that no page shows, and whether an outside share would include it." }));
    sec.appendChild(table("cdc-sw-held-table", "What is held and not shown: its definition, class, where it is held and whether an outside share includes it",
      ["cdc-c-name", "cdc-c-def", "cdc-c-class", "cdc-c-where", "cdc-c-share"],
      ["Item", "Definition", "Class", "Where it is held", "Outside share"],
      (D.held_not_shown || []).map(function (h) {
        return el("tr", { "data-held": h.id, "data-class": h.class }, [el("th", { scope: "row", "data-label": "Item", text: h.name }),
          td("Definition", h.definition), td("Class", classWord(D, h.class)), td("Where it is held", h.where), td("Outside share", h.outside_share)]);
      })));

    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-sw-joins", text: "The join keys" }));
    sec.appendChild(el("p", { cls: "cdd-of", text: "Each key that joins a public record to another record, and the other record's class." }));
    sec.appendChild(table("cdc-sw-joins-table", "Each key that joins a public record to another record, and the other record's class",
      ["cdc-c-name", "cdc-c-def", "cdc-c-side", "cdc-c-side", "cdc-c-comis"],
      ["Join key", "Definition", "Public side", "Other side", "COMIS element"],
      (D.join_keys || []).map(function (j) {
        return el("tr", { "data-join": j.id }, [el("th", { scope: "row", "data-label": "Join key", text: j.name }), td("Definition", j.definition),
          td("Public side", j.public_side), td("Other side", j.other_side + " (" + classLower(D, j.other_class) + ")"),
          el("td", { "data-label": "COMIS element" }, [j.comis_element || "None recorded", j.comis_note ? el("span", { cls: "cdd-of", text: j.comis_note }) : null])]);
      })));

    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-sw-agreements", text: "Agreements" }));
    sec.appendChild(el("p", { cls: "cdd-of", text: agreementLine(D) + " A status the repo does not record reads not recorded." }));
    sec.appendChild(table("cdc-sw-agreements-table", "Each agreement: its parties, its status, what it covers",
      ["cdc-c-name", "cdc-c-parties", "cdc-c-status", "cdc-c-covers", "cdc-c-note"],
      ["Agreement", "Parties", "Status", "Covers", "Note"],
      (D.agreements || []).map(function (a) {
        return el("tr", { "data-agreement": a.id, "data-status": a.status }, [el("th", { scope: "row", "data-label": "Agreement", text: a.name }),
          td("Parties", a.parties), td("Status", a.status.charAt(0).toUpperCase() + a.status.slice(1)), td("Covers", a.covers), td("Note", a.note || "")]);
      })));
    return sec;
  }

  function ready(fetcher) {
    var f = fetcher || window.fetch;
    if (ST.data) return Promise.resolve(ST.data);
    if (typeof f !== "function") { ST.error = "no fetch"; return Promise.resolve(null); }
    return Promise.resolve().then(function () { return f(FILE, { cache: "no-store" }); }).then(function (r) {
      if (!r || !r.ok) throw new Error(FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (d) { ST.data = d && Array.isArray(d.elements) ? d : null; ST.error = ST.data ? "" : "an empty file"; return ST.data; },
      function (e) { ST.data = null; ST.error = e && e.message ? e.message : String(e); return null; });
  }

  var CSS = [
    ".cdc-sw h4 { margin:6px 0 0; font-size:.92rem; color:var(--cmn-heading); }",
    ".cdc-sw .cdc-sw-names { margin:2px 0 0; color:var(--cmn-ink-2); font-size:.9rem; overflow-wrap:anywhere; }",
    ".cdc-sw ul.cdc-sw-joins { margin:4px 0 0; padding-left:20px; display:grid; gap:4px; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cdc-sw-state .cdc-sw-lede { margin:0; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cdc-sw-view { display:grid; gap:12px; }",
    ".cdc-sw-view ul.cdc-sw-deflist { margin:0; padding-left:20px; display:grid; gap:6px; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cdc-sw-view .cdd-h3 { margin:12px 0 0; }",
    ".cdc-sw-table tbody th { font-weight:700; }",
    ".cdc-c-name { width:17%; } .cdc-c-def { width:31%; } .cdc-c-sys { width:17%; } .cdc-c-comis { width:13%; } .cdc-c-class { width:11%; } .cdc-c-key { width:11%; }",
    ".cdc-c-where { width:22%; } .cdc-c-share { width:19%; } .cdc-c-side { width:19%; } .cdc-c-parties { width:20%; } .cdc-c-status { width:11%; }",
    ".cdc-c-covers { width:26%; } .cdc-c-note { width:26%; }",
    ".cdc-sw-open { font-size:inherit; }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cdc-sw-css")) return;
    document.head.appendChild(el("style", { id: "cdc-sw-css", text: CSS }));
  }

  var EXT = {
    id: "sharing",
    views: { sharing: TITLE },
    ledes: { sharing: "Every field a college's page shows: what it is, where it comes from, who may see it, and the key where a public record joins one that is not public; with what is held and not shown, and the agreements' status." },
    ready: function (f) { ensureCss(); return ready(f); },
    view: function (key, M, host) { ensureCss(); return view(key, M, host); },
    panel: function (M, c, host) { ensureCss(); return panel(M, c, host); },
    statewide: function (M, host) { ensureCss(); return statewide(M, host); }
  };
  window.CPL_CDC_EXT = Array.isArray(window.CPL_CDC_EXT) ? window.CPL_CDC_EXT : [];
  if (!window.CPL_CDC_EXT.some(function (x) { return x && x.id === EXT.id; })) window.CPL_CDC_EXT.push(EXT);
  window.CPL_CDC_SHARING = { FILE: FILE, VIEW: VIEW_KEY, TITLE: TITLE, ext: EXT, CSS: CSS, _state: ST, _reset: function () { ST.data = null; ST.error = ""; } };
})();
