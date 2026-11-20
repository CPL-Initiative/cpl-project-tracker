// commons_data_integrations.js — College Data Collection's statewide integration view (#3310 item 5).
//
// One view the Chancellor's Office research and data staff, MAP and Chancellor's Office institutional research can
// all read: each integration CDC uses or would use, where it stands (live, in progress, proposed, not started), what
// it would replace, its owner by role and the agreement it needs, which opens the agreements on Data elements and
// sharing (#collect/sharing). People appear by role only; an agreement shows its status, never its text.
//
// It reads kb/status/cdc_integrations.json, built by kb/_build_cdc_sharing.py from the hand-kept registry
// kb/cdc_integrations.json (it WRITES NOTHING), and draws #collect/integrations through commons_data.js's module
// hook (window.CPL_CDC_EXT). Each college's rows (SIS and curriculum system APIs) are exposed as
// window.CPL_CDC_INTEGRATIONS.forCollege(slug), for the Data sources card's integration line to read; every college
// reads "none known" until a row in the registry says otherwise. Tokens only, words for every control, no glyphs.
(function () {
  "use strict";

  var FILE = "kb/status/cdc_integrations.json";
  var VIEW_KEY = "integrations";
  var TITLE = "Integrations";
  var ORDER = ["live", "in progress", "proposed", "not started"];
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
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function rank(x) { var i = ORDER.indexOf(x.status); return (i < 0 ? 9 : i) * 2 + (x.scope === "per_college" ? 1 : 0); }

  /* A college's rows: the registry's own rows for that college where it holds any, else the default ("none known"). */
  function forCollege(slug) {
    var D = ST.data;
    if (!D) return [];
    var per = D.per_college || {}, own = (per.colleges || {})[slug];
    var rows = Array.isArray(own) && own.length ? own : (per.default || []);
    var by = {};
    (D.integrations || []).forEach(function (x) { by[x.id] = x; });
    return rows.map(function (r) {
      var x = by[r.integration] || {};
      return { integration: r.integration, name: x.name || r.integration, state: r.state, note: r.note || "", statewide_status: x.status || "", owner_role: x.owner_role || "" };
    });
  }

  function view(key, M, host) {
    if (key !== VIEW_KEY) return null;
    var sec = el("section", { cls: "cdd-view cdc-in-view", id: "cdc-in-view", "data-cdc-ext": "integrations", "aria-labelledby": "cdd-h" });
    var D = ST.data;
    if (!D) {
      sec.appendChild(el("p", { cls: "cdd-of", text: "The integrations registry could not be read" + (ST.error ? " (" + ST.error + ")" : "") + ". Reload the tab to try again." }));
      return sec;
    }
    var L = (D.integrations || []).slice().sort(function (a, b) { return rank(a) - rank(b); });
    var n = D.counts || {};
    sec.appendChild(el("p", { cls: "cdd-stamp", id: "cdc-in-sum" }, [el("strong", { text: ORDER.map(function (s) { return (n[s] || 0) + " " + s; }).join(", ") + ". " }),
      "Built by " + D.builder + " from " + D.source + ". A status moves only with a record in the repo, named under each integration. Owners are named by role."]));
    sec.appendChild(el("ul", { cls: "cdc-in-defs" }, ORDER.map(function (s) {
      return el("li", { "data-status": s }, [el("strong", { text: cap(s) + ". " }), (D.statuses || {})[s] || ""]);
    })));
    function agreementCell(x) {
      if (!x.agreement_name) return el("td", { "data-label": "Agreement", text: "None needed for public data" });
      var b = el("button", { type: "button", cls: "cmn-word cdc-in-agree", "data-agreement": x.agreement, "data-view": "sharing", text: x.agreement_name });
      b.addEventListener("click", function () { if (host && host.go) host.go("sharing"); });
      return el("td", { "data-label": "Agreement" }, [b, el("span", { cls: "cdd-of", text: cap(x.agreement_status) })]);
    }
    var body = el("tbody", null, L.map(function (x) {
      return el("tr", { "data-integration": x.id, "data-status": x.status, "data-scope": x.scope }, [
        el("th", { scope: "row", "data-label": "Integration" }, [x.name,
          el("span", { cls: "cdd-of", text: (x.scope === "per_college" ? "Per college. " : "Statewide. ") + (x.cadence ? x.cadence + ". " : "") + (x.note || "") }),
          el("span", { cls: "cdd-of cdc-in-ev", text: x.evidence && x.evidence.length ? "In the repo: " + x.evidence.join(", ") : "No record in the repo yet." })]),
        el("td", { "data-label": "Status", text: cap(x.status) }),
        el("td", { "data-label": "Would replace", text: x.replaces }),
        el("td", { "data-label": "Owner", text: x.owner_role }),
        agreementCell(x)]);
    }));
    var table = el("table", { cls: "cdd-table cdc-in-table", id: "cdc-in-table" }, [
      el("caption", { cls: "cdd-sr", text: "Each integration: its status, what it would replace, its owner by role and the agreement it needs" }),
      el("colgroup", null, ["cdc-i-name", "cdc-i-status", "cdc-i-repl", "cdc-i-owner", "cdc-i-agree"].map(function (c) { return el("col", { cls: c }); })),
      el("thead", null, [el("tr", null, ["Integration", "Status", "Would replace", "Owner", "Agreement"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), body]);
    sec.appendChild(el("div", { cls: "cdd-wrap", role: "region", "aria-label": "Integrations", tabindex: "0" }, [table]));
    var def = (D.per_college || {}).default || [];
    var named = Object.keys((D.per_college || {}).colleges || {}).length;
    sec.appendChild(el("h3", { cls: "cdd-h3", id: "cdc-in-per", text: "Each college's SIS and curriculum system" }));
    sec.appendChild(el("p", { cls: "cdd-of", id: "cdc-in-per-line", text: (named ? named + (named === 1 ? " college has" : " colleges have") + " its own rows in the registry; every other college reads: "
      : "No college has its own rows in the registry yet, so every college reads: ") +
      def.map(function (r) { var x = (D.integrations || []).filter(function (i) { return i.id === r.integration; })[0]; return (x ? x.name : r.integration) + ", " + r.state; }).join("; ") + "." }));
    return sec;
  }

  function ready(fetcher) {
    var f = fetcher || window.fetch;
    if (ST.data) return Promise.resolve(ST.data);
    if (typeof f !== "function") { ST.error = "no fetch"; return Promise.resolve(null); }
    return Promise.resolve().then(function () { return f(FILE, { cache: "no-store" }); }).then(function (r) {
      if (!r || !r.ok) throw new Error(FILE + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (d) { ST.data = d && Array.isArray(d.integrations) ? d : null; ST.error = ST.data ? "" : "an empty file"; return ST.data; },
      function (e) { ST.data = null; ST.error = e && e.message ? e.message : String(e); return null; });
  }

  var CSS = [
    ".cdc-in-view { display:grid; gap:12px; }",
    ".cdc-in-view ul.cdc-in-defs { margin:0; padding-left:20px; display:grid; gap:4px; color:var(--cmn-ink-2); max-width:var(--cpl-measure,none); }",
    ".cdc-in-view .cdd-h3 { margin:12px 0 0; }",
    ".cdc-in-table tbody th { font-weight:700; }",
    ".cdc-in-table .cdc-in-ev { overflow-wrap:anywhere; }",
    ".cdc-in-agree { font-size:inherit; text-align:left; }",
    ".cdc-i-name { width:34%; } .cdc-i-status { width:11%; } .cdc-i-repl { width:23%; } .cdc-i-owner { width:15%; } .cdc-i-agree { width:17%; }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("cdc-in-css")) return;
    document.head.appendChild(el("style", { id: "cdc-in-css", text: CSS }));
  }

  var EXT = {
    id: "integrations",
    views: { integrations: TITLE },
    ledes: { integrations: "Each integration College Data Collection uses or would use: where it stands, what it would replace, who owns it by role, and the agreement it needs." },
    ready: function (f) { ensureCss(); return ready(f); },
    view: function (key, M, host) { ensureCss(); return view(key, M, host); }
  };
  window.CPL_CDC_EXT = Array.isArray(window.CPL_CDC_EXT) ? window.CPL_CDC_EXT : [];
  if (!window.CPL_CDC_EXT.some(function (x) { return x && x.id === EXT.id; })) window.CPL_CDC_EXT.push(EXT);
  window.CPL_CDC_INTEGRATIONS = { FILE: FILE, VIEW: VIEW_KEY, TITLE: TITLE, ext: EXT, CSS: CSS, forCollege: forCollege, _state: ST,
    _reset: function () { ST.data = null; ST.error = ""; } };
})();
