// commons_page.js — the opened page of a common reference, one renderer for every reference.
//
// Sam locked the CPL Commons mock on 2026-11-02 (S552: "Let's go with these designs for now"), and with it the
// opened page, the Exhibits artboard (CPLBrain/04-projects/cpl-initiative/catalog-commons-mock/Exhibits.dc.html).
// The design critic's "keep" on that draft names the pattern for every reference: a progress line, *Needs
// attention* with an action each, and three question groups whose every count sits over one denominator. The
// Commons' standing ask (Sam, 2026-10-18): "as we make changes to one, keep the other related dashes aligned." So the
// page lives here once, as the List lives in commons_list.js, and each reference's tab hands it a spec. Exhibits
// first (S556); the CR Reference, Subjects and CPL Pathways follow. Lane: docs/reference/lanes/commons.md.
//
// The spec (every field optional unless marked):
//   label          REQUIRED. The reference's full name, for the region's name ("Common Exhibit Reference").
//   lede           One line of what the reference is.
//   read           When the figures were read ("Figures read Nov 2, 6:12 AM PT").
//   status         A word for where it stands ("In progress"); shown beside the lede, never a color alone.
//   links          [{ words, go(), href }]: the reference's own words (List, Add a rule, How it is kept, Decision record).
//   progress       { n, of, words, bar, recently, calls, error }: the headline, its one denominator, the line under it.
//   attention      { items: [{ n, words, action: { words, go(), href } }], next, empty }: what needs a person, an
//                  action each; next is the team's next step, in words.
//   groups         [{ q, rows: [{ label, n, go(), href, aria }] }]: the three questions (What is it called? What
//                  credit does it carry? Who could adopt it?), each row a count over `of`.
//   of             The one denominator every group row is counted over; ofWords names it ("credentials in the
//                  reference"). foot: a closing line ("The reference is staging: not yet faculty-published.").
//   prefix         The class prefix (default "cpg-").
// A count the reads could not supply is null and the page says "Could not be read", or "Reading" while it loads
// (spec.reading true), never a zero (the S343 rule). render(spec) returns the page's node; ensureCss() injects its
// styles once. Tokens only (var(--token)), First Light; words for every control, no glyphs (CLAUDE.md).
(function () {
  "use strict";

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
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function pct(n, of) { return of > 0 ? Math.max(0, Math.min(100, 100 * n / of)) : 0; }
  function known(n) { return n != null && n !== "" && !isNaN(Number(n)); }

  var CSS_ID = "cpl-commons-page-css";
  function css(p) {
    var s = "." + p;
    return [
      s + "page { display:grid; gap:18px; min-width:0; }",
      s + "top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:8px 28px; }",
      s + "lede { margin:0; color:var(--text-body); max-width:var(--cpl-measure,none); }",
      s + "status { display:inline-block; margin-right:10px; padding:1px 10px; border:1px solid var(--border-strong); border-radius:999px; font-size:.78rem; font-weight:600; color:var(--text-strong); }",
      s + "read { color:var(--text-muted); }",
      s + "links { display:flex; flex-wrap:wrap; gap:6px 20px; font-size:.95rem; }",
      s + "card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:clamp(14px, 3vw, 22px) clamp(14px, 3vw, 24px); display:grid; gap:10px; align-content:start; min-width:0; }",
      s + "h { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:1.15rem; font-weight:600; }",
      s + "big { font-family:var(--f-display, Georgia, serif); font-size:clamp(1.8rem, 4vw, 2.4rem); font-weight:700; color:var(--seal-blue-text); letter-spacing:-.02em; font-variant-numeric:tabular-nums; }",
      s + "line { margin:0; color:var(--text-body); font-size:1.02rem; }",
      s + "quiet { margin:0; color:var(--text-muted); font-size:.92rem; }",
      s + "bar { height:10px; max-width:720px; background:var(--border); border-radius:999px; overflow:hidden; }",
      s + "bar i { display:block; height:100%; background:var(--cobalt); border-radius:999px; }",
      s + "bar-s { height:6px; max-width:none; }",
      s + "item { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:6px 16px; border-top:1px solid var(--border); padding-top:10px; }",
      s + "item p { margin:0; min-width:0; }",
      s + "item b { color:var(--text-strong); font-variant-numeric:tabular-nums; }",
      s + "groups { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; min-width:0; }",
      "@media (max-width: 980px) { " + s + "groups { grid-template-columns:minmax(0, 1fr); } }",
      s + "row { display:grid; gap:4px; }",
      s + "rowtop { display:flex; justify-content:space-between; gap:12px; font-size:.92rem; }",
      s + "rowtop span:last-child { font-weight:700; color:var(--text-strong); white-space:nowrap; font-variant-numeric:tabular-nums; }",
      s + "warn { color:var(--mustard-text); font-weight:600; }",
      s + "page a { color:var(--cobalt); text-underline-offset:3px; }",
      // Controls are underlined words (Sam, 2026-10-09): no border, no fill, 24px tall.
      "button." + p + "w { all:unset; cursor:pointer; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
      "button." + p + "w:hover { text-decoration-thickness:2px; }",
      "button." + p + "w:focus-visible, " + s + "page a:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; border-radius:2px; }"
    ].join("\n");
  }
  function ensureCss(prefix) {
    var p = prefix || "cpg-", id = CSS_ID + (p === "cpg-" ? "" : "-" + p);
    if (document.getElementById(id)) return;
    document.head.appendChild(el("style", { id: id, text: css(p) }));
  }

  function render(spec) {
    var p = spec.prefix || "cpg-";
    ensureCss(p);
    var waiting = spec.reading ? "Reading" : "Could not be read";
    /* A control: a word that acts (go), or a link (href); plain words when it has neither. */
    function act(a, extraLabel) {
      if (!a) return null;
      if (typeof a.go === "function") {
        var b = el("button", { type: "button", cls: p + "w", text: a.words, "aria-label": extraLabel || a.aria || null });
        b.addEventListener("click", function () { a.go(); });
        return b;
      }
      if (a.href) {
        var ext = /^https:\/\//.test(a.href);
        return el("a", { href: a.href, text: a.words, target: ext ? "_blank" : null, rel: ext ? "noopener" : null,
          "aria-label": extraLabel || a.aria || null });
      }
      return el("span", { text: a.words });
    }
    function bar(n, of, small, label) {
      var w = pct(n, of);
      return el("div", { cls: p + "bar" + (small ? " " + p + "bar-s" : ""), role: "img",
        "aria-label": label || (Math.round(w) + " percent") }, [el("i", { style: "width:" + w.toFixed(1) + "%" })]);
    }

    var page = el("div", { cls: p + "page" });

    /* The line under the tab's views: where it stands, what it is, when it was read, its own words. */
    var top = el("div", { cls: p + "top" });
    var lede = el("p", { cls: p + "lede" }, [
      spec.status ? el("span", { cls: p + "status", text: spec.status }) : null,
      spec.lede || "", spec.read ? el("span", { cls: p + "read", text: (spec.lede ? " " : "") + spec.read }) : null]);
    top.appendChild(lede);
    if (spec.links && spec.links.length) {
      top.appendChild(el("nav", { cls: p + "links", "aria-label": spec.label + ": its views and records" },
        spec.links.map(function (l) { return act(l); })));
    }
    page.appendChild(top);

    /* Progress: the headline over its one denominator, the bar, and what changed. */
    var g = spec.progress || {};
    var prog = el("section", { cls: p + "card", "aria-label": "Progress" });
    if (known(g.n) && known(g.of)) {
      prog.appendChild(el("p", { cls: p + "line" }, [el("span", { cls: p + "big", text: fmt(g.n) }),
        " of " + fmt(g.of) + " " + (g.words || "")]));
      prog.appendChild(bar(g.n, g.of, false, g.bar || (Math.round(pct(g.n, g.of)) + " percent " + (g.short || "done"))));
    } else {
      prog.appendChild(el("p", { cls: p + "line" }, [el("span", { cls: p + "warn", text: waiting }),
        g.error ? " (" + g.error + ")" : null]));
    }
    var under = [g.recently, g.calls].filter(Boolean).join(" ");
    if (under) prog.appendChild(el("p", { cls: p + "quiet", text: under }));
    page.appendChild(prog);

    /* Needs attention: a count, what it is, and the one action that settles it. */
    var a = spec.attention || {};
    var hid = p + "att-h";
    var att = el("section", { cls: p + "card", id: p + "attention", "aria-labelledby": hid },
      [el("h3", { cls: p + "h", id: hid, text: "Needs attention" })]);
    var items = (a.items || []).filter(function (i) { return i && (i.n == null || Number(i.n) > 0); });
    items.forEach(function (i) {
      var lead = known(i.n) ? el("b", { text: fmt(i.n) }) : el("span", { cls: p + "warn", text: waiting });
      att.appendChild(el("div", { cls: p + "item" }, [el("p", null, [lead, " " + (i.words || "")]),
        known(i.n) ? act(i.action, i.action && i.action.words + ": " + fmt(i.n) + " " + (i.words || "")) : null]));
    });
    if (!items.length) att.appendChild(el("div", { cls: p + "item" }, [el("p", { text: a.empty || "Nothing waits on a person." })]));
    if (a.next) att.appendChild(el("div", { cls: p + "item" }, [el("p", null, [el("b", { text: "Next for the team:" }), " " + a.next])]));
    page.appendChild(att);

    /* The three questions, every count over the one denominator. */
    if (spec.groups && spec.groups.length) {
      var grid = el("div", { cls: p + "groups" });
      spec.groups.forEach(function (gr, gi) {
        var gid = p + "q-" + gi;
        var sec = el("section", { cls: p + "card", "aria-labelledby": gid }, [el("h3", { cls: p + "h", id: gid, text: gr.q })]);
        (gr.rows || []).forEach(function (r) {
          var ok = known(r.n) && known(spec.of);
          var name = act({ words: r.label, go: r.go, href: r.href },
            ok ? r.label + ": " + fmt(r.n) + " of " + fmt(spec.of) + (r.aria ? ". " + r.aria : "") : null);
          sec.appendChild(el("div", { cls: p + "row" }, [
            el("div", { cls: p + "rowtop" }, [name, el("span", { cls: ok ? null : p + "warn",
              text: ok ? fmt(r.n) + " of " + fmt(spec.of) : waiting })]),
            ok ? bar(r.n, spec.of, true) : null]));
        });
        grid.appendChild(sec);
      });
      page.appendChild(grid);
      var foot = [known(spec.of) ? "Each count is of the " + fmt(spec.of) + " " + (spec.ofWords || "") + "." : "", spec.foot || ""]
        .filter(Boolean).join(" ");
      if (foot) page.appendChild(el("p", { cls: p + "quiet", text: foot }));
    }
    return page;
  }

  window.CPL_COMMONS_PAGE = { render: render, ensureCss: ensureCss };
})();
