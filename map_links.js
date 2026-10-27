/* map_links.js — the MAP link beside a credential a college could adopt.
 *
 * Sam, 2026-10-26: "the same MAP link on every public surface that suggests an
 * adoption"; Open Asks Sheet 134 card 2 ("build", 2026-10-27): CPL Pathways,
 * My College and CER, which name a credential by its common title and hold no
 * exhibit ID. EACR and the CPL Opportunity visual hold the IDs and draw their
 * own chips (statewide_interactive.js, college_cpl_workbook.js).
 *
 * One line under a could-adopt claim: one chip per college that built a
 * verified exhibit of the credential (MAP's owner field; Sheet 134 card 1,
 * "builder"), opening MAP's CPL Opportunities page searched for that exhibit's
 * ID (?Exhibit=, Malone, 2026-10-26), where Request Quick Adopt sits. At most
 * MAX chips, then "and N more colleges".
 *
 * The index is kb/reference/map_cpl_opportunities_verified.json, written by
 * kb/_verify_map_exhibit_links.py: `by_title` (common title -> IDs MAP lists)
 * and `found` (ID -> its builder). Read once, only when a line is on screen;
 * no file, no title, or no listed ID leaves the line empty.
 *
 * A caller renders a placeholder (placeholder() for an HTML string, node() for
 * an element) and the module fills every placeholder on the page once the
 * index is read. It WRITES NOTHING.
 */
(function () {
  "use strict";

  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";
  var MAX = 6;
  var index = null, loading = null, pending = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function short(college) {
    var f = window.cplCollegeShort;
    return (typeof f === "function" && f(college)) || college;
  }

  // position:relative keeps the chip's screen-reader text inside the chip; without
  // it the hidden span anchors to the page and, inside a scrolling table, widens it.
  function ensureCss() {
    if (document.getElementById("cpl-maplinks-css")) return;
    var st = document.createElement("style");
    st.id = "cpl-maplinks-css";
    st.textContent =
      ".cpl-maplinks:empty{display:none;}" +
      ".cpl-maplinks{display:block;font-size:0.8rem;color:var(--text-body);margin:0.35rem 0;line-height:1.7;}" +
      ".cpl-mapchip{position:relative;display:inline-flex;align-items:center;min-height:24px;padding:0 0.5rem;" +
        "margin:0 0.3rem 0.15rem 0;border-radius:10px;font-size:0.78rem;font-weight:600;color:var(--cobalt);" +
        "background:var(--surface-subtle);border:1px solid var(--border);text-decoration:underline;}" +
      ".cpl-mapchip:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px;}" +
      ".cpl-mapmore{color:var(--text-muted);}" +
      ".cpl-ml-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;" +
        "clip:rect(0 0 0 0);white-space:nowrap;border:0;}";
    document.head.appendChild(st);
  }

  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    if (typeof fetch !== "function") return Promise.resolve(null);
    loading = fetch((api.base || "") + "kb/reference/map_cpl_opportunities_verified.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { index = j && j.found && j.by_title ? j : null; return index; })
      .catch(function () { return null; });
    return loading;
  }

  function chip(id) {
    var rec = index.found[String(id).toUpperCase()] || {};
    var college = rec.college || "";
    return '<a class="cpl-mapchip" href="' + esc(MAP_PAGE + "?Exhibit=" + encodeURIComponent(id)) +
      '" target="_blank" rel="noopener">' + esc(college ? short(college) : "View in MAP") +
      '<span class="cpl-ml-sr"> (' + (college ? "built by " + esc(college) + "; " : "") +
      "opens MAP searched for " + esc(id) + ")</span></a>";
  }

  // The line for one common title: one chip per building college, its first ID.
  function lineHtml(title) {
    if (!index) return "";
    var ids = index.by_title[title] || [], seen = {}, firsts = [];
    ids.forEach(function (id) {
      var rec = index.found[String(id).toUpperCase()];
      if (!rec) return;
      var who = rec.college || id;
      if (seen[who]) return;
      seen[who] = 1;
      firsts.push(id);
    });
    if (!firsts.length) return "";
    var more = firsts.length - MAX;
    return "Request Quick Adopt in MAP, from the exhibit each college built: " +
      firsts.slice(0, MAX).map(chip).join("") +
      (more > 0 ? '<span class="cpl-mapmore">and ' + more + " more college" + (more === 1 ? "" : "s") + "</span>" : "");
  }

  function fill(el) {
    el.setAttribute("data-ml-done", "1");
    el.innerHTML = lineHtml(el.getAttribute("data-ml-title") || "");
  }
  function fillAll() {
    var list = document.querySelectorAll(".cpl-maplinks[data-ml-title]:not([data-ml-done])");
    for (var i = 0; i < list.length; i++) fill(list[i]);
  }
  // Fill after the caller has put its placeholder on the page.
  function schedule() {
    ensureCss();
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      load().then(function () { if (index) fillAll(); });
    }, 0);
  }

  function placeholder(title) {
    if (!title) return "";
    schedule();
    return '<span class="cpl-maplinks" data-ml-title="' + esc(title) + '"></span>';
  }
  function node(title) {
    var s = document.createElement("span");
    s.className = "cpl-maplinks";
    if (title) { s.setAttribute("data-ml-title", title); schedule(); }
    return s;
  }

  var api = {
    base: "",
    placeholder: placeholder,
    node: node,
    lineHtml: function (title) { return lineHtml(title); },
    load: load,
    fillAll: fillAll,
    MAP_PAGE: MAP_PAGE,
    MAX: MAX
  };
  window.CPL_MAP_LINKS = api;
})();
