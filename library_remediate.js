// library_remediate.js — accessibility remediation of a deck (.pptx), a Word
// document (.docx) or an Excel workbook (.xlsx), in the browser, for the Library's Create or Remediate a Document.
//
// Sam, 2026-10-28: "PPT accessibility remediation is top of mind as we spend a bunch of
// money paying a service to remediate our decks before we can publish them to the field
// after a webinar or training ... We have to do this for written reports as well."
//
// A .pptx and a .docx are zip files of XML (OOXML). This reads one with JSZip (the local
// copy, jszip.min.js, loaded on demand like docx.min.js), fixes what needs no judgment,
// lists what needs a person, writes their answers back, and hands back the file. Nothing
// leaves the browser. It covers what Microsoft's Accessibility Checker covers for these
// files, less contrast and reading order, which it names for a person to check.
//
// Fixed for you:   the document title (from the first slide's title or the first
//                  heading), the language (English, United States), table header rows,
//                  and a picture repeated on most slides (a logo) marked decorative.
// Needs you:       alt text for each picture and chart (a draft from the slide's or
//                  section's own words, to read before keeping), a title for each slide
//                  whose title placeholder is empty, a document with no headings,
//                  reading order on a crowded slide, and a deck's text that falls below
//                  AA contrast against the fill behind it, and a Word document's text
//                  against its shading, highlight, table cell, text box or page color, in
//                  the body, the headers and the footers (the nearest
//                  passing color of the same hue offered as the fix either way).
//
// A workbook (lane NEXT, S514): its title, and a header row on each table, a name for
// each sheet that says what it holds (renamed in every formula, defined name and chart
// that points at it), alt text on each picture and chart, merged cells, and data laid
// out with no table, listed for a person; and (S515) each cell's font color against its
// fill, with the nearest passing color offered as the fix.
//
// A PDF is read, never written: its tags, title and language come from the program that
// exported it, so the report names that program and the steps that fix it at its source.
//
// Works in Node too (tests/library_remediate.test.js): pass JSZip, DOMParser and
// XMLSerializer in `env`; in the browser they default to the window's.
(function (root) {
  "use strict";

  var NS = {
    p: "http://schemas.openxmlformats.org/presentationml/2006/main",
    a: "http://schemas.openxmlformats.org/drawingml/2006/main",
    r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    c: "http://schemas.openxmlformats.org/drawingml/2006/chart",
    w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    dc: "http://purl.org/dc/elements/1.1/",
    cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    rel: "http://schemas.openxmlformats.org/package/2006/relationships",
    adec: "http://schemas.microsoft.com/office/drawing/2017/decorative",
    wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
    mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
    s: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    xdr: "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"
  };
  var DECORATIVE_URI = "{C183D7F6-B498-43B3-948B-1728B52AA6E4}";
  var LANG = "en-US";
  var CROWDED = 10; // top-level items on a slide past which reading order is worth a look
  // The titles a generator writes when nobody names the file: as good as none.
  var STOCK_TITLE = /^(powerpoint presentation|pptxgenjs presentation|presentation\s*\d*|document\s*\d*|microsoft (word|powerpoint) - .*|untitled.*)$/i;

  function envOf(env) {
    env = env || {};
    return {
      JSZip: env.JSZip || root.JSZip,
      DOMParser: env.DOMParser || root.DOMParser,
      XMLSerializer: env.XMLSerializer || root.XMLSerializer,
      inflate: env.inflate || null
    };
  }
  function els(node, ns, name) { return Array.prototype.slice.call(node.getElementsByTagNameNS(ns, name)); }
  function first(node, ns, name) { return node.getElementsByTagNameNS(ns, name)[0] || null; }
  function child(node, ns, name) {
    for (var c = node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && c.namespaceURI === ns && c.localName === name) return c;
    return null;
  }
  // A shape's or paragraph's words, its lines (paragraphs) joined by a space.
  function textOf(node, ns) {
    var paras = node.localName === "p" && node.namespaceURI === ns ? [node] : els(node, ns, "p");
    if (!paras.length) paras = [node];
    var words = function (n) {
      var out = "";
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        if (c.namespaceURI === ns && c.localName === "t") out += c.textContent;
        else if (c.namespaceURI === ns && (c.localName === "br" || c.localName === "tab" || c.localName === "cr")) out += " ";
        else out += words(c);
      }
      return out;
    };
    return paras.map(words).join(" ").replace(/\s+/g, " ").trim();
  }
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function titleFromName(name) {
    return String(name || "").replace(/\.[a-z0-9]{1,5}$/i, "").replace(/^\d{8}[_-]?/, "").replace(/[_-]+/g, " ").trim();
  }
  // "Slides 1 to 4, 6 and 9", "Slide 3".
  function slideList(ns) {
    var runs = [], i = 0;
    while (i < ns.length) { var j = i; while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++; runs.push(j > i + 1 ? ns[i] + " to " + ns[j] : j === i + 1 ? ns[i] + ", " + ns[j] : String(ns[i])); i = j + 1; }
    var txt = runs.length > 1 ? runs.slice(0, -1).join(", ") + " and " + runs[runs.length - 1] : runs[0];
    return (ns.length === 1 ? "Slide " : "Slides ") + txt;
  }
  function slideNum(path) { var m = /(\d+)\.xml$/.exec(path); return m ? +m[1] : 0; }

  // ── the package's parts ─────────────────────────────────────────────────────
  function Doc(env, zip) { this.env = env; this.zip = zip; this.parts = {}; this.dirty = {}; }
  Doc.prototype.read = function (path) {
    var self = this;
    if (self.parts[path]) return Promise.resolve(self.parts[path]);
    var f = self.zip.file(path);
    if (!f) return Promise.resolve(null);
    return f.async("string").then(function (xml) {
      var d = new self.env.DOMParser().parseFromString(xml, "application/xml");
      self.parts[path] = d;
      return d;
    });
  };
  Doc.prototype.touch = function (path) { this.dirty[path] = true; };
  Doc.prototype.flush = function () {
    var self = this, ser = new self.env.XMLSerializer();
    Object.keys(self.dirty).forEach(function (path) {
      var xml = ser.serializeToString(self.parts[path]);
      if (!/^<\?xml/.test(xml)) xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xml;
      self.zip.file(path, xml);
    });
    self.dirty = {};
  };
  // A part's relationships: id -> target path, resolved against the part's folder.
  Doc.prototype.rels = function (path) {
    var dir = path.replace(/[^/]*$/, ""), relPath = dir + "_rels/" + path.slice(dir.length) + ".rels";
    return this.read(relPath).then(function (d) {
      var out = {};
      if (!d) return out;
      els(d, NS.rel, "Relationship").forEach(function (r) {
        // A target starting with a slash is from the package's root (openpyxl writes them so).
        var t = r.getAttribute("Target") || "", parts = (t.charAt(0) === "/" ? t : dir + t).split("/"), stack = [];
        parts.forEach(function (p) { if (p === "..") stack.pop(); else if (p && p !== ".") stack.push(p); });
        out[r.getAttribute("Id")] = r.getAttribute("TargetMode") === "External" ? t : stack.join("/");
      });
      return out;
    });
  };

  // The document title lives in docProps/core.xml as dc:title.
  function fixTitle(doc, title, report) {
    return doc.read("docProps/core.xml").then(function (core) {
      if (!core) { report.needs.push({ type: "info", id: "core", text: "The file has no document properties, so its title cannot be set here. Set it in File, Info, Title." }); return; }
      var t = first(core, NS.dc, "title"), had = t ? t.textContent.trim() : "";
      if (had && !STOCK_TITLE.test(had)) return;
      if (!t) {
        t = core.createElementNS(NS.dc, "dc:title");
        core.documentElement.appendChild(t);
      }
      t.textContent = title;
      doc.touch("docProps/core.xml");
      report.fixed.push("Document title set: " + title + (had ? " (it read " + had + ")" : ""));
    });
  }

  // Decorative, as Office writes it: an extension on the shape's cNvPr / docPr.
  function isDecorative(cNvPr) {
    return els(cNvPr, NS.adec, "decorative").some(function (d) { return d.getAttribute("val") === "1"; });
  }
  function markDecorative(cNvPr) {
    var owner = cNvPr.ownerDocument;
    cNvPr.setAttribute("descr", "");
    if (isDecorative(cNvPr)) return;
    var lst = child(cNvPr, NS.a, "extLst");
    if (!lst) { lst = owner.createElementNS(NS.a, "a:extLst"); cNvPr.appendChild(lst); }
    var ext = owner.createElementNS(NS.a, "a:ext");
    ext.setAttribute("uri", DECORATIVE_URI);
    var dec = owner.createElementNS(NS.adec, "adec:decorative");
    dec.setAttribute("val", "1");
    ext.appendChild(dec); lst.appendChild(ext);
  }

  // A chart's alt text drafted from its own data: its kind, what it shows, and its
  // values from largest to smallest (the first six), read from the chart part.
  var CHART_KIND = { barChart: "Bar chart", bar3DChart: "Bar chart", lineChart: "Line chart", line3DChart: "Line chart", pieChart: "Pie chart",
    pie3DChart: "Pie chart", doughnutChart: "Doughnut chart", areaChart: "Area chart", scatterChart: "Scatter chart", radarChart: "Radar chart" };
  function chartDraft(doc, path, words) {
    return doc.read(path).then(function (d) {
      if (!d) return "";
      var kind = "", plot = first(d, NS.c, "plotArea");
      if (!plot) return "";
      for (var c = plot.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && CHART_KIND[c.localName]) { kind = CHART_KIND[c.localName]; break; }
      var titleEl = first(d, NS.c, "title"), title = titleEl ? textOf(titleEl, NS.a) : "";
      var sers = els(plot, NS.c, "ser");
      if (!sers.length) return "";
      var pts = function (el) {
        if (!el) return [];
        return els(el, NS.c, "pt").map(function (pt) { var v = first(pt, NS.c, "v"); return { i: +pt.getAttribute("idx"), v: v ? v.textContent : "" }; });
      };
      // Categories from the first series; each series adds its values (a stacked or
      // clustered chart), and the rows sort by their total.
      var byIdx = {}, names = [];
      pts(child(sers[0], NS.c, "cat")).forEach(function (x) { byIdx[x.i] = { name: x.v, vals: [] }; });
      sers.forEach(function (ser, si) {
        var tx = child(ser, NS.c, "tx"), nm = tx ? (first(tx, NS.c, "v") || { textContent: "" }).textContent || textOf(tx, NS.a) : "";
        names.push(nm || "Series " + (si + 1));
        pts(child(ser, NS.c, "val")).forEach(function (x) { if (byIdx[x.i] && x.v !== "" && !isNaN(+x.v)) byIdx[x.i].vals[si] = +x.v; });
      });
      var rows = Object.keys(byIdx).map(function (k) { return byIdx[k]; }).filter(function (r) { return r.name && r.vals.length; });
      if (!rows.length) return "";
      rows.forEach(function (r) { r.total = r.vals.reduce(function (a, b) { return a + (b || 0); }, 0); });
      rows.sort(function (a, b) { return b.total - a.total; });
      var fmt = function (n) { return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("en-US") : String(Math.round(n * 100) / 100); };
      var multi = sers.length > 1;
      var cap = multi ? 4 : 6;
      var shown = rows.slice(0, cap).map(function (r) {
        return r.name + " " + fmt(r.total) + (multi ? " (" + r.vals.map(function (v, si) { return fmt(v || 0) + " " + names[si]; }).join(", ") + ")" : "");
      });
      var about = title || words || "";
      return clip((kind || "Chart") + (about ? ": " + about : "") + (multi ? ", each bar split into " + names.join(" and ") : "") + ". " +
        shown.join("; ") + (rows.length > cap ? "; and " + (rows.length - cap) + " more" : "") + ".", 600);
    });
  }

  // ── contrast ────────────────────────────────────────────────────────────────
  // WCAG 2's contrast ratio: 4.5:1 for text, 3:1 for large text (18pt, or 14pt bold).
  function rgbOf(hex) { var n = parseInt(hex, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hexOf(rgb) { return rgb.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }).join("").toUpperCase(); }
  function luminance(hex) {
    var c = rgbOf(hex).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function toHsl(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function fromHsl(hsl) {
    var h = hsl[0], s = hsl[1], l = Math.max(0, Math.min(1, hsl[2]));
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    var f = function (t) { t = (t + 1) % 1; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  // The nearest color of the same hue that meets the ratio: darker on a light ground,
  // lighter on a dark one.
  function passingColor(fg, bg, need) {
    var hsl = toHsl(rgbOf(fg)), dark = luminance(bg) > 0.18, l = hsl[2];
    for (var i = 0; i <= 100; i++) {
      var hex = hexOf(fromHsl([hsl[0], hsl[1], l]));
      if (ratio(hex, bg) >= need + 0.1) return hex;
      l += dark ? -0.01 : 0.01;
    }
    return dark ? "000000" : "FFFFFF";
  }
  var PRESET = { black: "000000", white: "FFFFFF", red: "FF0000", green: "008000", blue: "0000FF", yellow: "FFFF00", gray: "808080" };
  // A DrawingML color element (srgbClr, schemeClr, sysClr, prstClr) to a hex, with its
  // lumMod, lumOff, tint and shade applied; null when it cannot be told (phClr with no
  // placeholder color, or a see-through color).
  function colorOf(el, ctx, ph) {
    if (!el) return null;
    var hex = null, ln = el.localName;
    if (ln === "srgbClr") hex = (el.getAttribute("val") || "").toUpperCase();
    else if (ln === "sysClr") hex = (el.getAttribute("lastClr") || (el.getAttribute("val") === "window" ? "FFFFFF" : "000000")).toUpperCase();
    else if (ln === "prstClr") hex = PRESET[el.getAttribute("val")] || null;
    else if (ln === "schemeClr") {
      var v = el.getAttribute("val");
      if (v === "phClr") hex = ph || null;
      else { v = ctx.map[v] || v; hex = ctx.scheme[v] || null; }
    }
    if (!hex || !/^[0-9A-F]{6}$/.test(hex)) return null;
    var hsl = null, rgb = rgbOf(hex);
    for (var m = el.firstChild; m; m = m.nextSibling) {
      if (m.nodeType !== 1) continue;
      var k = (+m.getAttribute("val") || 0) / 100000;
      if (m.localName === "alpha" && k < 0.9) return null;
      if (m.localName === "lumMod" || m.localName === "lumOff") { hsl = hsl || toHsl(rgb); hsl[2] = m.localName === "lumMod" ? hsl[2] * k : hsl[2] + k; rgb = fromHsl(hsl); }
      else if (m.localName === "tint") { hsl = null; rgb = rgb.map(function (c) { return c + (255 - c) * (1 - k); }); }
      else if (m.localName === "shade") { hsl = null; rgb = rgb.map(function (c) { return c * k; }); }
    }
    return hexOf(rgb);
  }
  function colorChild(node) {
    for (var c = node && node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && /^(srgbClr|schemeClr|sysClr|prstClr)$/.test(c.localName)) return c;
    return null;
  }
  // A fill: { hex } for a solid one, { none: true } for none, { complex: true } for a
  // gradient, picture or pattern, or null when the node names no fill.
  function fillOf(node, ctx, ph) {
    for (var c = node && node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1 || c.namespaceURI !== NS.a) continue;
      if (c.localName === "solidFill") { var h = colorOf(colorChild(c), ctx, ph); return h ? { hex: h } : { complex: true }; }
      if (c.localName === "noFill") return { none: true };
      if (/^(gradFill|blipFill|pattFill|grpFill)$/.test(c.localName)) return { complex: true };
    }
    return null;
  }
  // A fill named by a style reference (bgRef, fillRef) into the theme's format scheme.
  function refFill(ref, list, base, ctx) {
    var idx = +(ref && ref.getAttribute("idx")) || 0;
    if (!ref || !idx || !list) return null;
    var styles = [];
    for (var c = list.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) styles.push(c);
    var st = styles[idx - base];
    if (!st) return null;
    var ph = colorOf(colorChild(ref), ctx);
    if (st.localName === "solidFill") { var h = colorOf(colorChild(st), ctx, ph); return h ? { hex: h } : { complex: true }; }
    if (st.localName === "noFill") return { none: true };
    return { complex: true };
  }
  // A slide's, layout's or master's own background, or null when it names none.
  function bgOf(part, ctx) {
    var bg = part && first(part, NS.p, "bg");
    if (!bg) return null;
    var pr = child(bg, NS.p, "bgPr");
    if (pr) return fillOf(pr, ctx) || { complex: true };
    return refFill(child(bg, NS.p, "bgRef"), ctx.bgStyles, 1001, ctx) || { complex: true };
  }
  // The text settings a level carries in a list style (lstStyle, or a master's txStyles).
  function levelPr(list, lvl) {
    if (!list) return null;
    var l = child(list, NS.a, "lvl" + lvl + "pPr");
    return l ? child(l, NS.a, "defRPr") : null;
  }
  function placeholderKey(sp) {
    var ph = first(sp, NS.p, "ph");
    if (!ph) return null;
    var type = ph.getAttribute("type") || "body";
    return { type: type === "ctrTitle" ? "title" : type === "subTitle" ? "body" : type, raw: type, idx: ph.getAttribute("idx") };
  }
  function findPlaceholder(part, key) {
    if (!part || !key) return null;
    var hits = els(part, NS.p, "sp").filter(function (sp) {
      var k = placeholderKey(sp);
      return k && (key.idx && k.idx === key.idx || k.raw === key.raw || k.type === key.type);
    });
    return hits[0] || null;
  }

  // The theme, color map and background behind a slide, read through its layout and master.
  function slideContext(doc, s, cache) {
    var layoutPath = Object.keys(s.rels).map(function (k) { return s.rels[k]; }).filter(function (t) { return /slideLayouts\/[^/]+\.xml$/.test(t); })[0];
    if (!layoutPath) return Promise.resolve(null);
    if (cache[layoutPath]) return cache[layoutPath].then(function (base) { return base && withSlide(base, s); });
    cache[layoutPath] = Promise.all([doc.read(layoutPath), doc.rels(layoutPath)]).then(function (lg) {
      var masterPath = Object.keys(lg[1]).map(function (k) { return lg[1][k]; }).filter(function (t) { return /slideMasters\/[^/]+\.xml$/.test(t); })[0];
      if (!lg[0] || !masterPath) return null;
      return Promise.all([doc.read(masterPath), doc.rels(masterPath)]).then(function (mg) {
        var themePath = Object.keys(mg[1]).map(function (k) { return mg[1][k]; }).filter(function (t) { return /theme\/[^/]+\.xml$/.test(t); })[0];
        return doc.read(themePath || "").then(function (theme) {
          if (!mg[0] || !theme) return null;
          var scheme = {}, cs = first(theme, NS.a, "clrScheme");
          for (var c = cs ? cs.firstChild : null; c; c = c.nextSibling) {
            if (c.nodeType !== 1) continue;
            var h = colorOf(colorChild(c), { map: {}, scheme: {} });
            if (h) scheme[c.localName] = h;
          }
          var map = {}, cm = first(mg[0], NS.p, "clrMap");
          if (cm) for (var i = 0; i < cm.attributes.length; i++) map[cm.attributes[i].localName] = cm.attributes[i].value;
          var ctx = { scheme: scheme, map: map, bgStyles: first(theme, NS.a, "bgFillStyleLst"), fillStyles: first(theme, NS.a, "fillStyleLst"),
            layout: lg[0], master: mg[0], txStyles: first(mg[0], NS.p, "txStyles") };
          ctx.layoutBg = bgOf(lg[0], ctx);
          ctx.masterBg = bgOf(mg[0], ctx) || { hex: scheme[map.bg1 || "lt1"] || "FFFFFF" };
          return ctx;
        });
      });
    });
    return cache[layoutPath].then(function (base) { return base && withSlide(base, s); });
  }
  function withSlide(base, s) {
    var ctx = Object.create(base), ovr = first(s.xml, NS.a, "overrideClrMapping");
    if (ovr) { ctx.map = {}; for (var i = 0; i < ovr.attributes.length; i++) ctx.map[ovr.attributes[i].localName] = ovr.attributes[i].value; }
    ctx.bg = bgOf(s.xml, ctx) || base.layoutBg || base.masterBg;
    return ctx;
  }

  // Every text run on a slide's top-level and grouped shapes, with the color it paints
  // and the fill behind it. A run on a gradient, a picture or a pattern goes in `unsure`.
  // A shape's box in EMUs, from its own xfrm or, for a placeholder, its layout's or master's.
  function boxOf(el, ctx) {
    var x = first(el, NS.a, "xfrm") || first(el, NS.p, "xfrm");
    if (!x && el.localName === "sp") {
      var key = placeholderKey(el);
      [findPlaceholder(ctx.layout, key), findPlaceholder(ctx.master, key)].some(function (p) { x = p && first(p, NS.a, "xfrm"); return !!x; });
    }
    var off = x && child(x, NS.a, "off"), ext = x && child(x, NS.a, "ext");
    if (!off || !ext) return null;
    var b = { x: +off.getAttribute("x") || 0, y: +off.getAttribute("y") || 0, w: +ext.getAttribute("cx") || 0, h: +ext.getAttribute("cy") || 0 };
    return b.w && b.h ? b : null;
  }
  function ownFill(sp, ctx) {
    var fill = fillOf(child(sp, NS.p, "spPr"), ctx), style = child(sp, NS.p, "style");
    if (!fill && style) fill = refFill(child(style, NS.a, "fillRef"), ctx.fillStyles, 1, ctx);
    return fill;
  }
  // The fill a text shape's words sit on: its own, else the topmost shape drawn before it
  // that covers its middle (a text box laid over a colored rectangle is the common case),
  // else the slide's background. A picture, chart or table beneath it cannot be measured.
  function groundOf(sp, drawn, ctx) {
    var own = ownFill(sp, ctx);
    if (own && !own.none) return own;
    var box = boxOf(sp, ctx);
    if (!box) return ctx.bg;
    var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    for (var i = drawn.indexOf(sp) - 1; i >= 0; i--) {
      var el = drawn[i], b = boxOf(el, ctx);
      if (!b || cx < b.x || cx > b.x + b.w || cy < b.y || cy > b.y + b.h) continue;
      if (el.localName !== "sp") return { complex: true };
      var f = ownFill(el, ctx);
      if (f && !f.none) return f;
    }
    return ctx.bg;
  }
  function slideRuns(s, ctx) {
    var out = [], unsure = false;
    // The layout's and master's own shapes (never their placeholders) draw beneath the
    // slide's, unless the slide or layout turns them off (showMasterSp="0").
    var shapes = function (part) {
      return els(part, "*", "*").filter(function (el) { return el.namespaceURI === NS.p && /^(sp|pic|graphicFrame)$/.test(el.localName) && !first(el, NS.p, "ph"); });
    };
    var off = function (part) { return part && part.documentElement.getAttribute("showMasterSp") === "0"; };
    var under = off(s.xml) ? [] : (off(ctx.layout) ? [] : shapes(ctx.master)).concat(shapes(ctx.layout));
    var drawn = under.concat(els(s.xml, "*", "*").filter(function (el) { return el.namespaceURI === NS.p && /^(sp|pic|graphicFrame)$/.test(el.localName); }));
    els(s.xml, NS.p, "sp").forEach(function (sp) {
      var body = child(sp, NS.p, "txBody");
      if (!body) return;
      var style = child(sp, NS.p, "style");
      var fill = groundOf(sp, drawn, ctx);
      var key = placeholderKey(sp);
      var lists = [child(body, NS.a, "lstStyle")];
      var fontRef = style ? colorOf(colorChild(child(style, NS.a, "fontRef")), ctx) : null;
      if (key) {
        var lp = findPlaceholder(ctx.layout, key), mp = findPlaceholder(ctx.master, key);
        [lp, mp].forEach(function (p) { var tb = p && child(p, NS.p, "txBody"); lists.push(tb ? child(tb, NS.a, "lstStyle") : null); });
        lists.push(ctx.txStyles ? child(ctx.txStyles, NS.p, key.type === "title" ? "titleStyle" : "bodyStyle") : null);
      } else lists.push(ctx.txStyles ? child(ctx.txStyles, NS.p, "otherStyle") : null);
      var shapeId = (first(sp, NS.p, "cNvPr") || { getAttribute: function () { return ""; } }).getAttribute("id");
      els(body, NS.a, "r").forEach(function (r, ri) {
        var t = textOf(r, NS.a);
        if (!t) return;
        var p = r.parentNode, ppr = child(p, NS.a, "pPr"), lvl = (+(ppr && ppr.getAttribute("lvl")) || 0) + 1;
        var chain = [child(r, NS.a, "rPr")].concat(lists.map(function (l) { return levelPr(l, lvl); }));
        var color = null, sz = 0, b = null;
        chain.forEach(function (pr) {
          if (!pr) return;
          if (!color) { var f = fillOf(pr, ctx); if (f && f.hex) color = f.hex; else if (f) color = "?"; }
          if (!sz && pr.getAttribute("sz")) sz = +pr.getAttribute("sz");
          if (b === null && pr.getAttribute("b")) b = pr.getAttribute("b") === "1" || pr.getAttribute("b") === "true";
        });
        var rPr = chain[0];
        if (!color && rPr && first(rPr, NS.a, "hlinkClick")) color = ctx.scheme[ctx.map.hlink || "hlink"] || null;
        if (!color) color = fontRef || ctx.scheme[ctx.map.tx1 || "dk1"] || "000000";
        if (color === "?" || !fill || fill.complex || !fill.hex) { unsure = true; return; }
        out.push({ fg: color, bg: fill.hex, size: (sz || 1800) / 100, bold: !!b, text: t, shapeId: shapeId, run: ri });
      });
    });
    return { runs: out, unsure: unsure };
  }

  // Lists each slide's text that falls below AA, one item per color pair, with the
  // nearest passing color offered as the fix.
  function contrastPptx(doc, slides, report) {
    var cache = {}, unsure = [];
    return slides.reduce(function (pr, s) {
      return pr.then(function () {
        return slideContext(doc, s, cache).then(function (ctx) {
          if (!ctx) return;
          var got = slideRuns(s, ctx), pairs = {};
          if (got.unsure) unsure.push(s.n);
          got.runs.forEach(function (r) {
            var large = r.size >= 18 || (r.bold && r.size >= 14), need = large ? 3 : 4.5, have = ratio(r.fg, r.bg);
            if (have >= need) return;
            var k = r.fg + "/" + r.bg + "/" + need;
            var it = pairs[k] = pairs[k] || { fg: r.fg, bg: r.bg, need: need, ratio: have, large: large, sample: "", runs: [] };
            if (!it.sample) it.sample = clip(r.text, 60);
            it.runs.push({ shapeId: r.shapeId, run: r.run });
          });
          Object.keys(pairs).forEach(function (k, i) {
            var it = pairs[k], fix = passingColor(it.fg, it.bg, it.need);
            report.needs.push({ type: "contrast", id: "c" + s.n + "-" + (i + 1), slide: s.n, path: s.path, fg: it.fg, bg: it.bg, need: it.need,
              ratio: Math.round(it.ratio * 100) / 100, fix: fix, fixRatio: Math.round(ratio(fix, it.bg) * 100) / 100, runs: it.runs,
              text: "Slide " + s.n + ": " + (it.runs.length === 1 ? "text" : it.runs.length + " runs of text") + " in #" + it.fg + " on #" + it.bg +
                " reads " + (Math.floor(it.ratio * 10) / 10) + ":1; " + (it.large ? "large " : "") + "text needs " + it.need + ":1 (“" + it.sample + "”)" });
          });
        });
      });
    }, Promise.resolve()).then(function () {
      if (unsure.length) report.needs.push({ type: "info", id: "cu", slides: unsure,
        text: "Contrast on " + slideList(unsure).toLowerCase() + ": some text sits on a gradient, a picture or a pattern, which this page cannot measure. Check it by eye, or with the Accessibility Checker." });
    });
  }
  // Writes a contrast item's fix onto each of its runs as the run's own color.
  function applyContrast(d, n) {
    var count = 0;
    n.runs.forEach(function (loc) {
      var sp = els(d, NS.p, "sp").filter(function (x) { var c = first(x, NS.p, "cNvPr"); return c && c.getAttribute("id") === loc.shapeId; })[0];
      var body = sp && child(sp, NS.p, "txBody"), r = body && els(body, NS.a, "r")[loc.run];
      if (!r) return;
      var rPr = child(r, NS.a, "rPr");
      if (!rPr) { rPr = d.createElementNS(NS.a, "a:rPr"); rPr.setAttribute("lang", LANG); r.insertBefore(rPr, r.firstChild); }
      for (var c = rPr.firstChild; c; ) {
        var nx = c.nextSibling;
        if (c.nodeType === 1 && /^(noFill|solidFill|gradFill|blipFill|pattFill|grpFill)$/.test(c.localName)) rPr.removeChild(c);
        c = nx;
      }
      var sf = d.createElementNS(NS.a, "a:solidFill"), clr = d.createElementNS(NS.a, "a:srgbClr");
      clr.setAttribute("val", n.fix); sf.appendChild(clr);
      // A fill comes after the outline (ln) and before everything else in a run's settings.
      var at = rPr.firstChild;
      while (at && (at.nodeType !== 1 || at.localName === "ln")) at = at.nextSibling;
      rPr.insertBefore(sf, at);
      count++;
    });
    return count;
  }

  // ── a Word document's contrast ──────────────────────────────────────────────
  // A run's color comes from its own w:color, else its character style, its paragraph's
  // style (each through basedOn), else the document's defaults; "auto" is black or white,
  // whichever reads, so it never fails. What it sits on: the run's shading or highlight,
  // the paragraph's shading, the table cell's, the text box's fill, else the page color,
  // else white. The body, every header and every footer are read; a text box's second copy
  // in mc:Fallback (the old VML drawing Word keeps beside it) is skipped, never counted twice.
  var HIGHLIGHT = { yellow: "FFFF00", green: "00FF00", cyan: "00FFFF", magenta: "FF00FF", blue: "0000FF", red: "FF0000",
    darkBlue: "000080", darkCyan: "008080", darkGreen: "008000", darkMagenta: "800080", darkRed: "800000",
    darkYellow: "808000", darkGray: "808080", lightGray: "C0C0C0", black: "000000", white: "FFFFFF" };
  var WORD_THEME = { text1: "dk1", dark1: "dk1", background1: "lt1", light1: "lt1", text2: "dk2", dark2: "dk2", background2: "lt2", light2: "lt2",
    hyperlink: "hlink", followedHyperlink: "folHlink" };
  function wAttr(el, name) { return el ? el.getAttributeNS(NS.w, name) || el.getAttribute("w:" + name) || "" : ""; }
  function wordScheme(theme) {
    var scheme = {}, cs = theme && first(theme, NS.a, "clrScheme");
    for (var c = cs && cs.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      var h = colorOf(colorChild(c), { map: {}, scheme: {} });
      if (h) scheme[c.localName] = h;
    }
    return scheme;
  }
  // w:color to a hex, "auto", or null when it names none. Word writes the resolved hex in
  // val beside a themeColor, so val wins when it is one.
  function wordColor(el, scheme) {
    if (!el) return null;
    var v = wAttr(el, "val").toUpperCase();
    if (/^[0-9A-F]{6}$/.test(v)) return v;
    var t = wAttr(el, "themeColor"), hex = t && scheme[WORD_THEME[t] || t];
    if (!hex) return v === "AUTO" ? "auto" : null;
    var rgb = rgbOf(hex), tint = wAttr(el, "themeTint"), shade = wAttr(el, "themeShade");
    if (tint) rgb = rgb.map(function (c) { return c + (255 - c) * (1 - parseInt(tint, 16) / 255); });
    if (shade) rgb = rgb.map(function (c) { return c * parseInt(shade, 16) / 255; });
    return hexOf(rgb);
  }
  // w:shd to { hex }, { complex } for a pattern, or null when it fills nothing.
  function wordShade(el, scheme) {
    if (!el) return null;
    var val = wAttr(el, "val"), fill = wAttr(el, "fill").toUpperCase();
    if (val === "solid") { var c = wAttr(el, "color").toUpperCase(); return /^[0-9A-F]{6}$/.test(c) ? { hex: c } : { complex: true }; }
    if (val && val !== "clear" && val !== "nil") return { complex: true };
    if (val === "nil") return null;
    if (/^[0-9A-F]{6}$/.test(fill)) return { hex: fill };
    var t = wAttr(el, "themeFill");
    if (t && scheme[WORD_THEME[t] || t]) return { hex: scheme[WORD_THEME[t] || t] };
    return null;
  }
  function wordStyles(styles) {
    var byId = {};
    if (styles) els(styles, NS.w, "style").forEach(function (s) { byId[wAttr(s, "styleId")] = s; });
    var chain = function (id) {
      var out = [], seen = {};
      while (id && byId[id] && !seen[id]) { seen[id] = true; out.push(byId[id]); id = wAttr(child(byId[id], NS.w, "basedOn"), "val"); }
      return out;
    };
    var defs = styles && first(styles, NS.w, "rPrDefault");
    var defP = styles ? els(styles, NS.w, "style").filter(function (s) { return wAttr(s, "type") === "paragraph" && /^(1|true)$/.test(wAttr(s, "default")); })[0] : null;
    return { chain: chain, defaults: defs ? child(defs, NS.w, "rPr") : null, defaultPara: defP ? wAttr(defP, "styleId") : "" };
  }
  var WORD_MAP = { tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" };
  function within(node, ns, name) {
    for (var q = node; q; q = q.parentNode) if (q.namespaceURI === ns && q.localName === name) return q;
    return null;
  }
  // A text box's fill: { hex }, { complex } (a gradient, a picture, a theme style's fill, or
  // a VML box), or null when it has none and the page shows through.
  function boxFill(box, scheme) {
    var txbx = box.parentNode;
    if (!txbx || txbx.namespaceURI !== NS.wps) return { complex: true };
    var wsp = txbx.parentNode, spPr = wsp && child(wsp, NS.wps, "spPr");
    var f = spPr && fillOf(spPr, { map: WORD_MAP, scheme: scheme });
    if (f) return f.none ? null : f;
    var style = wsp && child(wsp, NS.wps, "style"), ref = style && first(style, NS.a, "fillRef");
    return ref && +ref.getAttribute("idx") ? { complex: true } : null;
  }
  var PART_WHERE = { header: " in a header", footer: " in a footer" };
  function onOff(el) { if (!el) return null; var v = wAttr(el, "val"); return !(v === "0" || v === "false" || v === "off"); }
  function contrastDocx(doc, d, styles, report) {
    var extra = Object.keys(doc.zip.files).filter(function (p) { return /^word\/(header|footer)\d*\.xml$/.test(p); }).sort();
    return Promise.all([doc.read("word/theme/theme1.xml"), doc.read("word/settings.xml")].concat(extra.map(function (p) { return doc.read(p); }))).then(function (got) {
      var scheme = wordScheme(got[0]), st = wordStyles(styles), pairs = {}, order = [], unsure = 0;
      var bgEl = first(d, NS.w, "background"), page = (bgEl && /^[0-9A-F]{6}$/i.test(wAttr(bgEl, "color"))) ? wAttr(bgEl, "color").toUpperCase() : "FFFFFF";
      var display = got[1] && first(got[1], NS.w, "displayBackgroundShape");
      if (!display) page = "FFFFFF"; // Word paints the page color only when the setting says to
      var parts = [{ path: "word/document.xml", xml: d, where: "" }];
      extra.forEach(function (p, i) { if (got[i + 2]) parts.push({ path: p, xml: got[i + 2], where: PART_WHERE[/header/.test(p) ? "header" : "footer"] }); });
      parts.forEach(function (part) {
      els(part.xml, NS.w, "r").forEach(function (r, ri) {
        // Only this run's own words: a run holding a text box holds the box's runs too.
        var text = els(r, NS.w, "t").filter(function (t) { return within(t, NS.w, "r") === r; }).map(function (t) { return t.textContent; }).join("");
        if (!text.trim()) return;
        if (within(r, NS.mc, "Fallback")) return;
        var p = within(r.parentNode, NS.w, "p"), box = within(p, NS.w, "txbxContent");
        var pPr = p && child(p, NS.w, "pPr"), rPr = child(r, NS.w, "rPr");
        var styleIds = st.chain(wAttr(rPr && child(rPr, NS.w, "rStyle"), "val")).concat(st.chain(wAttr(pPr && child(pPr, NS.w, "pStyle"), "val") || st.defaultPara));
        var prs = [rPr].concat(styleIds.map(function (s) { return child(s, NS.w, "rPr"); }), [st.defaults]);
        var fg = null, size = null, bold = null, back = null;
        prs.forEach(function (pr) {
          if (!pr) return;
          if (fg == null) fg = wordColor(child(pr, NS.w, "color"), scheme);
          if (size == null) { var sz = wAttr(child(pr, NS.w, "sz"), "val"); if (sz) size = +sz / 2; }
          if (bold == null) bold = onOff(child(pr, NS.w, "b"));
        });
        // What the run sits on: its highlight, its shading, then the paragraph's (own, then style), the cell's, the box's.
        var hl = rPr && child(rPr, NS.w, "highlight"), hv = wAttr(hl, "val");
        if (hv && HIGHLIGHT[hv]) back = { hex: HIGHLIGHT[hv] };
        if (!back) back = wordShade(rPr && child(rPr, NS.w, "shd"), scheme);
        if (!back) back = wordShade(pPr && child(pPr, NS.w, "shd"), scheme);
        if (!back) styleIds.some(function (s) { var sp = child(s, NS.w, "pPr"); back = wordShade(sp && child(sp, NS.w, "shd"), scheme); return !!back; });
        if (!back) for (var tc = p; tc && tc !== box; tc = tc.parentNode) if (tc.namespaceURI === NS.w && tc.localName === "tc") {
          var tcPr = child(tc, NS.w, "tcPr"); back = wordShade(tcPr && child(tcPr, NS.w, "shd"), scheme);
          // A table style may shade its header row or bands: not measured from here.
          if (!back) { var tbl = tc.parentNode && tc.parentNode.parentNode, tp = tbl && child(tbl, NS.w, "tblPr");
            if (st.chain(wAttr(tp && child(tp, NS.w, "tblStyle"), "val")).some(function (x) { return els(x, NS.w, "shd").some(function (h) { return !!wordShade(h, scheme); }); })) back = { complex: true }; }
          break;
        }
        if (!back && box) back = boxFill(box, scheme);
        if (back && back.complex) { unsure++; return; }
        if (!fg || fg === "auto") return;
        var bg = back ? back.hex : page;
        size = size || 10;
        var large = size >= 18 || (bold && size >= 14), need = large ? 3 : 4.5, have = ratio(fg, bg);
        if (have >= need) return;
        var k = part.path + "/" + fg + "/" + bg + "/" + need;
        if (!pairs[k]) { pairs[k] = { path: part.path, where: part.where, fg: fg, bg: bg, need: need, ratio: have, large: large, sample: "", runs: [] }; order.push(k); }
        var it = pairs[k];
        if (!it.sample) it.sample = clip(text, 60);
        it.runs.push({ run: ri });
      });
      });
      order.forEach(function (k, i) {
        var it = pairs[k], fix = passingColor(it.fg, it.bg, it.need);
        report.needs.push({ type: "contrast", id: "c" + (i + 1), path: it.path, fg: it.fg, bg: it.bg, need: it.need,
          ratio: Math.round(it.ratio * 100) / 100, fix: fix, fixRatio: Math.round(ratio(fix, it.bg) * 100) / 100, runs: it.runs,
          text: (it.runs.length === 1 ? "Text" : it.runs.length + " runs of text") + it.where + " in #" + it.fg + " on #" + it.bg +
            " reads " + (Math.floor(it.ratio * 10) / 10) + ":1; " + (it.large ? "large " : "") + "text needs " + it.need + ":1 (“" + it.sample + "”)" });
      });
      if (unsure) report.needs.push({ type: "info", id: "cu",
        text: "Contrast on " + unsure + (unsure === 1 ? " run" : " runs") + " of text on a gradient, a picture or patterned shading, in a text box Word draws the old way or fills from its theme, or in a table whose style shades it, which this page cannot measure. Check it by eye, or with the Accessibility Checker." });
    });
  }
  // The run settings that come after w:color, in the schema's order.
  var AFTER_COLOR = /^(spacing|w|kern|position|sz|szCs|highlight|u|effect|bdr|shd|fitText|vertAlign|rtl|cs|em|lang|eastAsianLayout|specVanish|oMath)$/;
  function applyContrastDocx(d, n) {
    var runs = els(d, NS.w, "r"), count = 0;
    n.runs.forEach(function (loc) {
      var r = runs[loc.run];
      if (!r) return;
      var rPr = child(r, NS.w, "rPr");
      if (!rPr) { rPr = d.createElementNS(NS.w, "w:rPr"); r.insertBefore(rPr, r.firstChild); }
      var old = child(rPr, NS.w, "color");
      if (old) rPr.removeChild(old);
      var clr = d.createElementNS(NS.w, "w:color");
      clr.setAttributeNS(NS.w, "w:val", n.fix);
      var at = rPr.firstChild;
      while (at && !(at.nodeType === 1 && AFTER_COLOR.test(at.localName))) at = at.nextSibling;
      rPr.insertBefore(clr, at);
      count++;
    });
    return count;
  }

  // ── a deck ──────────────────────────────────────────────────────────────────
  function inspectPptx(doc, name, report) {
    var paths = Object.keys(doc.zip.files).filter(function (p) { return /^ppt\/slides\/slide\d+\.xml$/.test(p); })
      .sort(function (x, y) { return slideNum(x) - slideNum(y); });
    report.extent = paths.length + (paths.length === 1 ? " slide" : " slides");
    var slides = [];
    return paths.reduce(function (pr, path, i) {
      return pr.then(function () {
        return Promise.all([doc.read(path), doc.rels(path)]).then(function (got) {
          slides.push({ n: i + 1, path: path, xml: got[0], rels: got[1] });
        });
      });
    }, Promise.resolve()).then(function () {
      var langFixed = 0, headers = 0;
      // Which picture files appear on most slides: a logo or a background mark.
      var seen = {};
      slides.forEach(function (s) {
        var here = {};
        els(s.xml, NS.p, "pic").forEach(function (pic) {
          var blip = first(pic, NS.a, "blip"), id = blip && blip.getAttributeNS(NS.r, "embed");
          if (id && s.rels[id]) here[s.rels[id]] = true;
        });
        Object.keys(here).forEach(function (t) { seen[t] = (seen[t] || 0) + 1; });
      });
      var repeated = {};
      Object.keys(seen).forEach(function (t) { if (seen[t] >= Math.max(3, Math.ceil(slides.length * 0.8))) repeated[t] = true; });
      var markedRepeat = 0, noPlaceholder = [], crowded = [];

      slides.forEach(function (s) {
        var titleSp = null;
        els(s.xml, NS.p, "sp").forEach(function (sp) {
          var ph = first(sp, NS.p, "ph"), type = ph && ph.getAttribute("type");
          if (!titleSp && (type === "title" || type === "ctrTitle")) titleSp = sp;
        });
        s.title = titleSp ? textOf(titleSp, NS.a) : "";
        // A slide with no title still has words: its first text box's, for the drafts.
        s.words = s.title;
        if (!s.words) els(s.xml, NS.p, "sp").some(function (sp) { s.words = textOf(sp, NS.a); return !!s.words; });
        if (!s.title) {
          if (titleSp) report.needs.push({ type: "title", id: "t" + s.n, slide: s.n, path: s.path, text: "Slide " + s.n + " has an empty title" });
          else noPlaceholder.push(s.n);
        }
        // Language on every run that names none.
        ["rPr", "endParaRPr", "defRPr"].forEach(function (tag) {
          els(s.xml, NS.a, tag).forEach(function (n) { if (!n.getAttribute("lang")) { n.setAttribute("lang", LANG); langFixed++; s.dirty = true; } });
        });
        // Table header rows.
        els(s.xml, NS.a, "tbl").forEach(function (tbl) {
          var pr = child(tbl, NS.a, "tblPr");
          if (!pr) { pr = s.xml.createElementNS(NS.a, "a:tblPr"); tbl.insertBefore(pr, tbl.firstChild); }
          if (pr.getAttribute("firstRow") !== "1") { pr.setAttribute("firstRow", "1"); headers++; s.dirty = true; }
        });
        // Pictures and charts.
        var tree = first(s.xml, NS.p, "spTree"), shapes = 0;
        for (var c = tree ? tree.firstChild : null; c; c = c.nextSibling) if (c.nodeType === 1 && /^(sp|pic|graphicFrame|grpSp|cxnSp)$/.test(c.localName)) shapes++;
        if (shapes >= CROWDED) crowded.push(s.n);
        var k = 0;
        els(s.xml, NS.p, "pic").concat(els(s.xml, NS.p, "graphicFrame").filter(function (g) { return !!first(g, NS.c, "chart"); }))
          .forEach(function (shape) {
            var cNvPr = first(shape, NS.p, "cNvPr");
            if (!cNvPr || isDecorative(cNvPr) || (cNvPr.getAttribute("descr") || "").trim()) return;
            var isChart = shape.localName === "graphicFrame";
            var blip = first(shape, NS.a, "blip"), target = blip && s.rels[blip.getAttributeNS(NS.r, "embed")];
            if (target && repeated[target]) { markDecorative(cNvPr); markedRepeat++; s.dirty = true; return; }
            k++;
            var chartEl = isChart ? first(shape, NS.c, "chart") : null;
            var chartPart = chartEl ? s.rels[chartEl.getAttributeNS(NS.r, "id")] : null;
            report.needs.push({ type: "alt", id: "a" + s.n + "-" + k, slide: s.n, path: s.path, shapeId: cNvPr.getAttribute("id"),
              media: target || null, chart: isChart, chartPart: chartPart || null, words: s.words || "",
              label: "Slide " + s.n + ", " + (isChart ? "chart" : "picture") + (cNvPr.getAttribute("name") ? " (" + cNvPr.getAttribute("name") + ")" : ""),
              draft: s.words ? clip((isChart ? "Chart: " : "") + s.words, 150) : "" });
          });
        if (s.dirty) doc.touch(s.path);
      });
      if (noPlaceholder.length) report.needs.push({ type: "info", id: "tp", slides: noPlaceholder,
        text: slideList(noPlaceholder) + (noPlaceholder.length === 1 ? " has" : " have") + " no title a screen reader can find. In PowerPoint, give " + (noPlaceholder.length === 1 ? "it" : "each") + " a layout with a title (Home, Layout), or put the title in the slide's title box and move it off the slide if it must not show." });
      if (crowded.length) report.needs.push({ type: "order", id: "ro", slides: crowded,
        text: "Reading order on " + slideList(crowded).toLowerCase() + ": each holds " + CROWDED + " or more items. In PowerPoint, check that a screen reader meets them in the order the slide means (Home, Arrange, Selection Pane, which lists them bottom to top)." });
      if (langFixed) report.fixed.push("Language set to English (United States) on " + langFixed + " text runs");
      if (headers) report.fixed.push("Header rows marked on " + headers + (headers === 1 ? " table" : " tables"));
      if (markedRepeat) report.fixed.push("A picture repeated on most slides (a logo) marked decorative, " + markedRepeat + " times");
      report.slides = slides.map(function (s) { return { n: s.n, title: s.title }; });
      var t1 = slides[0] && slides[0].title;
      return contrastPptx(doc, slides, report).then(function () { return draftCharts(doc, report); })
        .then(function () { return fixTitle(doc, t1 || titleFromName(name), report); });
    });
  }

  // ── a Word document ─────────────────────────────────────────────────────────
  function inspectDocx(doc, name, report) {
    var path = "word/document.xml";
    return Promise.all([doc.read(path), doc.rels(path), doc.read("word/styles.xml")]).then(function (got) {
      var d = got[0], rels = got[1], styles = got[2];
      if (!d) throw new Error("This file has no word/document.xml, so it is not a Word document.");
      var paras = els(d, NS.w, "p");
      report.extent = paras.length + " paragraphs";
      var styleOf = function (p) { var ps = first(p, NS.w, "pStyle"); return ps ? ps.getAttributeNS(NS.w, "val") || ps.getAttribute("w:val") || "" : ""; };
      var headingText = "", firstHeading = "", hasHeading = false;
      var nearest = [];
      paras.forEach(function (p) {
        var st = styleOf(p);
        if (/^(Title|Heading\d)$/i.test(st)) {
          hasHeading = hasHeading || /^Heading/i.test(st);
          headingText = textOf(p, NS.w);
          if (!firstHeading && headingText) firstHeading = headingText;
        }
        nearest.push(headingText);
      });
      if (!hasHeading) report.needs.push({ type: "info", id: "h", text: "The document uses no headings. Apply Heading 1 and Heading 2 to its section titles in Word (Home, Styles), so a screen reader can move by section." });
      // Language, once, on the document's defaults.
      if (styles) {
        var defs = first(styles, NS.w, "docDefaults");
        if (!defs) { defs = styles.createElementNS(NS.w, "w:docDefaults"); styles.documentElement.insertBefore(defs, styles.documentElement.firstChild); }
        var rd = child(defs, NS.w, "rPrDefault");
        if (!rd) { rd = styles.createElementNS(NS.w, "w:rPrDefault"); defs.insertBefore(rd, defs.firstChild); }
        var rpr = child(rd, NS.w, "rPr");
        if (!rpr) { rpr = styles.createElementNS(NS.w, "w:rPr"); rd.appendChild(rpr); }
        var lang = child(rpr, NS.w, "lang");
        if (!lang || !lang.getAttributeNS(NS.w, "val")) {
          if (!lang) { lang = styles.createElementNS(NS.w, "w:lang"); rpr.appendChild(lang); }
          lang.setAttributeNS(NS.w, "w:val", LANG);
          doc.touch("word/styles.xml");
          report.fixed.push("Language set to English (United States)");
        }
      }
      // Table header rows: the first row repeats as a header.
      var headers = 0;
      els(d, NS.w, "tbl").forEach(function (tbl) {
        var tr = child(tbl, NS.w, "tr");
        if (!tr) return;
        var trPr = child(tr, NS.w, "trPr");
        if (!trPr) { trPr = d.createElementNS(NS.w, "w:trPr"); tr.insertBefore(trPr, tr.firstChild); }
        if (!child(trPr, NS.w, "tblHeader")) { trPr.appendChild(d.createElementNS(NS.w, "w:tblHeader")); headers++; }
      });
      if (headers) { doc.touch(path); report.fixed.push("Header rows marked on " + headers + (headers === 1 ? " table" : " tables")); }
      // Pictures and charts: wp:docPr carries the alt text.
      var k = 0;
      els(d, NS.wp, "docPr").forEach(function (pr) {
        if (isDecorative(pr) || (pr.getAttribute("descr") || "").trim()) return;
        var drawing = pr.parentNode, blip = first(drawing, NS.a, "blip");
        var target = blip ? rels[blip.getAttributeNS(NS.r, "embed")] : null;
        var chartEl = first(drawing, NS.c, "chart"), isChart = !!chartEl;
        var p = pr; while (p && !(p.namespaceURI === NS.w && p.localName === "p")) p = p.parentNode;
        var near = p ? nearest[paras.indexOf(p)] : "";
        k++;
        report.needs.push({ type: "alt", id: "a" + k, path: path, shapeId: pr.getAttribute("id"), media: target, chart: isChart,
          chartPart: chartEl ? rels[chartEl.getAttributeNS(NS.r, "id")] || null : null, words: near || "",
          label: (isChart ? "Chart" : "Picture") + " " + k + (near ? ", under " + clip(near, 60) : ""),
          draft: near ? clip((isChart ? "Chart: " : "") + near, 150) : "" });
      });
      return contrastDocx(doc, d, styles, report).then(function () { return draftCharts(doc, report); })
        .then(function () { return fixTitle(doc, firstHeading || titleFromName(name), report); });
    });
  }

  // ── an Excel workbook (lane NEXT, S514) ─────────────────────────────────────────
  // What Excel's own Accessibility Checker asks of a workbook: a name for each sheet,
  // a header row on each table, alt text on each picture and chart, and no merged cells.
  // A table's header row is listed, never switched on here: turning it on makes the
  // table's first row of data its headers. A sheet's new name reaches every formula,
  // defined name and chart that points at it (renameSheets).
  var DEFAULT_SHEET = /^(sheet|feuil|hoja|tabelle|blad|foglio|planilha)\s*\d+$/i;
  function cellText(c, shared) {
    var t = c.getAttribute("t"), v = child(c, NS.s, "v");
    if (t === "inlineStr") { var is = child(c, NS.s, "is"); return is ? textOf(is, NS.s) : ""; }
    if (!v) return "";
    if (t === "s") return shared[+v.textContent] || "";
    return v.textContent;
  }
  function sheetList(names) {
    return names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
  }
  function inspectXlsx(doc, name, report) {
    var wbPath = "xl/workbook.xml";
    return Promise.all([doc.read(wbPath), doc.rels(wbPath), doc.read("xl/sharedStrings.xml")]).then(function (got) {
      var wb = got[0], wbRels = got[1], ss = got[2];
      if (!wb) throw new Error("This file has no xl/workbook.xml, so it is not an Excel workbook.");
      var shared = ss ? els(ss, NS.s, "si").map(function (si) { return textOf(si, NS.s); }) : [];
      var sheets = els(wb, NS.s, "sheet").map(function (el, i) {
        return { n: i + 1, name: el.getAttribute("name") || "", hidden: /hidden/.test(el.getAttribute("state") || ""),
          path: wbRels[el.getAttributeNS(NS.r, "id") || el.getAttribute("r:id")] };
      }).filter(function (sh) { return sh.path && !sh.hidden; });
      report.extent = sheets.length + (sheets.length === 1 ? " sheet" : " sheets");
      var noHeader = [], merged = [], loose = [], k = 0;
      return sheets.reduce(function (pr, sh) {
        return pr.then(function () {
          return Promise.all([doc.read(sh.path), doc.rels(sh.path)]).then(function (g) {
            var x = g[0], rels = g[1];
            if (!x) return;
            // The first words on the sheet (often its title), and how much is laid out
            // as rows of two or more cells: data a table should hold.
            var words = "", rows = 0;
            els(x, NS.s, "row").forEach(function (row) {
              var filled = els(row, NS.s, "c").map(function (c) { return cellText(c, shared); }).filter(function (t) { return String(t).trim(); });
              if (!words && filled.length) words = String(filled[0]).trim();
              if (filled.length >= 2) rows++;
            });
            sh.words = words;
            if (DEFAULT_SHEET.test(sh.name.trim()) || !sh.name.trim())
              report.needs.push({ type: "sheet", id: "s" + sh.n, path: wbPath, sheetName: sh.name,
                text: "Sheet " + sh.n + " is named " + sh.name, ask: "type a name that says what it holds",
                draft: words && !/^\d/.test(words) ? clip(words.replace(/[\[\]:*?\/\\]/g, " ").replace(/\s+/g, " ").replace(/^'+|'+$/g, "").trim(), 31).replace(/…$/, "").trim() : "" });
            var mc = els(x, NS.s, "mergeCell").length;
            if (mc) merged.push(sh.name + " (" + mc + ")");
            var tableIds = els(x, NS.s, "tablePart").map(function (t) { return rels[t.getAttributeNS(NS.r, "id") || t.getAttribute("r:id")]; }).filter(Boolean);
            if (!tableIds.length && rows >= 3) loose.push(sh.name);
            var drawing = els(x, NS.s, "drawing").map(function (dr) { return rels[dr.getAttributeNS(NS.r, "id") || dr.getAttribute("r:id")]; })[0];
            return Promise.all(tableIds.map(function (tp) {
              return doc.read(tp).then(function (t) {
                if (!t) return;
                var tsi = first(t, NS.s, "tableStyleInfo"), tsn = tsi && tsi.getAttribute("name");
                if (tsn && tsn !== "None") (sh.tables = sh.tables || []).push(rangeOf(t.documentElement.getAttribute("ref")));
                if (t.documentElement.getAttribute("headerRowCount") !== "0") return;
                noHeader.push((t.documentElement.getAttribute("displayName") || t.documentElement.getAttribute("name") || "A table") + " on " + sh.name);
              });
            })).then(function () {
              if (!drawing) return;
              return Promise.all([doc.read(drawing), doc.rels(drawing)]).then(function (dg) {
                var dx = dg[0], drels = dg[1];
                if (!dx) return;
                var about = DEFAULT_SHEET.test(sh.name) ? words : sh.name;
                els(dx, NS.xdr, "pic").concat(els(dx, NS.xdr, "graphicFrame").filter(function (gf) { return !!first(gf, NS.c, "chart"); }))
                  .forEach(function (shape) {
                    var cNvPr = first(shape, NS.xdr, "cNvPr");
                    if (!cNvPr || isDecorative(cNvPr) || (cNvPr.getAttribute("descr") || "").trim()) return;
                    var isChart = shape.localName === "graphicFrame";
                    var blip = first(shape, NS.a, "blip"), target = blip ? drels[blip.getAttributeNS(NS.r, "embed")] : null;
                    var chartEl = isChart ? first(shape, NS.c, "chart") : null;
                    k++;
                    report.needs.push({ type: "alt", id: "a" + k, path: drawing, shapeId: cNvPr.getAttribute("id"), media: target || null, chart: isChart,
                      chartPart: chartEl ? drels[chartEl.getAttributeNS(NS.r, "id")] || null : null, words: about || "",
                      label: sh.name + ", " + (isChart ? "chart" : "picture") + (cNvPr.getAttribute("name") ? " (" + cNvPr.getAttribute("name") + ")" : ""),
                      draft: about ? clip((isChart ? "Chart: " : "") + about, 150) : "" });
                  });
              });
            });
          });
        });
      }, Promise.resolve()).then(function () {
        if (noHeader.length) report.needs.push({ type: "info", id: "th", text: sheetList(noHeader) + (noHeader.length === 1 ? " has" : " have") +
          " no header row. In Excel, click in the table and tick Header Row (Table Design), then type a heading over each column; a screen reader announces them with each cell." });
        if (loose.length) report.needs.push({ type: "info", id: "tl", text: "The data on " + sheetList(loose) + " is not in a table, so a screen reader cannot name each cell's column. In Excel, select the data, choose Insert, Table, and tick My table has headers." });
        if (merged.length) report.needs.push({ type: "info", id: "mc", text: "Merged cells on " + sheetList(merged) + ": a screen reader can lose its place in them. Unmerge them (Home, Merge and Center); for a title across columns, use Center Across Selection (Format Cells, Alignment)." });
        report.sheets = sheets.map(function (sh) { return { n: sh.n, name: sh.name }; });
        return contrastXlsx(doc, sheets, ss, report).then(function () { return draftCharts(doc, report); }).then(function () { return fixTitle(doc, titleFromName(name), report); });
      });
    });
  }
  // ── a workbook's contrast ───────────────────────────────────────────────────
  // A cell's words take its font's color (xl/styles.xml: cellXfs -> fonts) and sit on its
  // fill (cellXfs -> fills: a solid pattern's fgColor), else on white. A color is an ARGB
  // rgb, a theme index (Excel counts lt1 before dk1, unlike the theme's own order) with a
  // tint, an index into the old 64-color palette (the workbook's own indexedColors when it
  // has one), or auto, which never fails. A cell in a styled table, or a fill that is a
  // pattern or a gradient, is counted for a person; so is a sheet's conditional formatting.
  // A shared string's own run colors are measured too; a fix writes a new font and cell
  // format beside the old, so the other cells sharing that format keep theirs.
  var XL_THEME = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  var XL_INDEXED = ("000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF " +
    "800000 008000 000080 808000 800080 008080 C0C0C0 808080 9999FF 993366 FFFFCC CCFFFF 660066 FF8080 0066CC CCCCFF " +
    "000080 FF00FF FFFF00 00FFFF 800080 800000 008080 0000FF 00CCFF CCFFFF CCFFCC FFFF99 99CCFF FF99CC CC99FF FFCC99 " +
    "3366FF 33CCCC 99CC00 FFCC00 FF9900 FF6600 666699 969696 003366 339966 003300 333300 993300 993366 333399 333333").split(" ");
  function xlColor(el, scheme, palette) {
    if (!el) return null;
    if (el.getAttribute("auto") === "1" || el.getAttribute("auto") === "true") return "auto";
    var hex = null, rgb = (el.getAttribute("rgb") || "").toUpperCase(), th = el.getAttribute("theme"), ix = el.getAttribute("indexed");
    if (/^[0-9A-F]{8}$/.test(rgb)) hex = rgb.slice(2);
    else if (/^[0-9A-F]{6}$/.test(rgb)) hex = rgb;
    else if (th != null && th !== "") hex = scheme[XL_THEME[+th]] || null;
    else if (ix != null && ix !== "") { if (+ix >= 64) return "auto"; hex = palette[+ix] || null; }
    if (!hex) return null;
    var tint = +el.getAttribute("tint") || 0;
    if (tint) { var hsl = toHsl(rgbOf(hex)); hsl[2] = tint < 0 ? hsl[2] * (1 + tint) : hsl[2] + (1 - hsl[2]) * tint; hex = hexOf(fromHsl(hsl)); }
    return hex;
  }
  function colRow(ref) {
    var m = /^\$?([A-Z]+)\$?(\d+)$/.exec(String(ref || "").toUpperCase());
    if (!m) return null;
    var c = 0; for (var i = 0; i < m[1].length; i++) c = c * 26 + m[1].charCodeAt(i) - 64;
    return [c, +m[2]];
  }
  function rangeOf(ref) {
    var ends = String(ref || "").split(":"), a = colRow(ends[0]), b = colRow(ends[1] || ends[0]);
    return a && b ? [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])] : null;
  }
  function inRange(cr, rg) { return !!(cr && rg && cr[0] >= rg[0] && cr[0] <= rg[2] && cr[1] >= rg[1] && cr[1] <= rg[3]); }
  function contrastXlsx(doc, sheets, ss, report) {
    return Promise.all([doc.read("xl/styles.xml"), doc.rels("xl/workbook.xml")]).then(function (got) {
      var st = got[0], themePath = Object.keys(got[1]).map(function (k) { return got[1][k]; }).filter(function (p) { return /theme\d*\.xml$/.test(p); })[0] || "xl/theme/theme1.xml";
      return doc.read(themePath).then(function (theme) {
        if (!st) return;
        var scheme = wordScheme(theme), palette = XL_INDEXED.slice();
        var ic = first(st, NS.s, "indexedColors");
        if (ic) els(ic, NS.s, "rgbColor").forEach(function (c, i) { var v = (c.getAttribute("rgb") || "").toUpperCase(); if (/^[0-9A-F]{8}$/.test(v)) palette[i] = v.slice(2); });
        var fontsEl = first(st, NS.s, "fonts"), fillsEl = first(st, NS.s, "fills"), xfsEl = first(st, NS.s, "cellXfs");
        var fontOf = function (f) {
          if (!f) return { fg: null, size: 11, bold: false };
          var b = child(f, NS.s, "b"), sz = child(f, NS.s, "sz");
          return { fg: xlColor(child(f, NS.s, "color"), scheme, palette), size: sz ? +sz.getAttribute("val") || 11 : 11,
            bold: !!b && !/^(0|false)$/.test(b.getAttribute("val") || "") };
        };
        var fonts = fontsEl ? els(fontsEl, NS.s, "font").filter(function (f) { return f.parentNode === fontsEl; }).map(fontOf) : [];
        var fills = fillsEl ? els(fillsEl, NS.s, "fill").map(function (f) {
          var pf = child(f, NS.s, "patternFill");
          if (child(f, NS.s, "gradientFill")) return { complex: true };
          var pt = pf && pf.getAttribute("patternType");
          if (!pf || !pt || pt === "none") return null;
          if (pt !== "solid") return { complex: true };
          var h = xlColor(child(pf, NS.s, "fgColor"), scheme, palette);
          return h && h !== "auto" ? { hex: h } : { complex: true };
        }) : [];
        var xfs = xfsEl ? els(xfsEl, NS.s, "xf").map(function (x) { return { font: +x.getAttribute("fontId") || 0, fill: +x.getAttribute("fillId") || 0 }; }) : [];
        var sis = ss ? els(ss, NS.s, "si") : [], pairs = {}, order = [], unsure = 0, byHand = {}, cf = [];
        sheets.forEach(function (sh) {
          var x = doc.parts[sh.path];
          if (!x) return;
          if (els(x, NS.s, "conditionalFormatting").length) cf.push(sh.name);
          els(x, NS.s, "c").forEach(function (c, ci) {
            var t = c.getAttribute("t"), v = child(c, NS.s, "v"), is = child(c, NS.s, "is");
            var si = t === "s" && v ? sis[+v.textContent] : t === "inlineStr" ? is : null;
            var text = si ? textOf(si, NS.s) : v ? v.textContent : "";
            if (!String(text).trim()) return;
            var xi = +c.getAttribute("s") || 0, xf = xfs[xi] || { font: 0, fill: 0 }, font = fonts[xf.font] || fontOf(null), back = fills[xf.fill] || null;
            var cr = colRow(c.getAttribute("r"));
            if (!back && (sh.tables || []).some(function (rg) { return inRange(cr, rg); })) back = { complex: true };
            if (back && back.complex) { unsure++; return; }
            var bg = back ? back.hex : "FFFFFF";
            var test = function (fg, size, bold) {
              if (!fg || fg === "auto") return null;
              var large = size >= 18 || (bold && size >= 14), need = large ? 3 : 4.5, have = ratio(fg, bg);
              return have >= need ? null : { fg: fg, need: need, have: have, large: large };
            };
            // A shared string's own runs: each run's color, else the cell's.
            var runs = si ? els(si, NS.s, "r") : [];
            if (runs.length) runs.forEach(function (r) {
              var rp = child(r, NS.s, "rPr");
              if (!rp || !child(rp, NS.s, "color")) return;
              var rf = fontOf(rp), sz = child(rp, NS.s, "sz") ? rf.size : font.size, bad = test(rf.fg, sz, child(rp, NS.s, "b") ? rf.bold : font.bold);
              if (bad) (byHand[sh.name] = byHand[sh.name] || []).push(c.getAttribute("r") || "");
            });
            var bad = test(font.fg, font.size, font.bold);
            if (!bad) return;
            var k = bad.fg + "/" + bg + "/" + bad.need;
            if (!pairs[k]) { pairs[k] = { fg: bad.fg, bg: bg, need: bad.need, ratio: bad.have, large: bad.large, sample: "", where: [], cells: [] }; order.push(k); }
            var it = pairs[k];
            if (!it.sample) it.sample = clip(text, 60);
            if (it.where.indexOf(sh.name) < 0) it.where.push(sh.name);
            it.cells.push({ sheet: sh.path, cell: ci, xf: xi });
          });
        });
        order.forEach(function (k, i) {
          var it = pairs[k], fix = passingColor(it.fg, it.bg, it.need), n = it.cells.length;
          report.needs.push({ type: "contrast", id: "c" + (i + 1), path: "xl/styles.xml", fg: it.fg, bg: it.bg, need: it.need,
            ratio: Math.round(it.ratio * 100) / 100, fix: fix, fixRatio: Math.round(ratio(fix, it.bg) * 100) / 100, cells: it.cells,
            text: (n === 1 ? "A cell" : n + " cells") + " on " + sheetList(it.where) + " in #" + it.fg + " on #" + it.bg +
              " reads " + (Math.floor(it.ratio * 10) / 10) + ":1; " + (it.large ? "large " : "") + "text needs " + it.need + ":1 (“" + it.sample + "”)" +
              // Text the color of its fill is often hidden on purpose; a screen reader reads it anyway.
              (it.ratio < 1.1 ? ". These words cannot be seen, and a screen reader still reads them. If they are hidden on purpose, untick the fix and move them to a hidden column." : "") });
        });
        var hand = Object.keys(byHand);
        if (hand.length) report.needs.push({ type: "info", id: "cr", text: "Words colored within a cell fall below AA contrast on " +
          sheetList(hand.map(function (h) { return h + " (" + byHand[h].slice(0, 5).join(", ") + (byHand[h].length > 5 ? " and " + (byHand[h].length - 5) + " more" : "") + ")"; })) +
          ". Select those words in the cell and choose a darker font color." });
        if (unsure) report.needs.push({ type: "info", id: "cu", text: "Contrast on " + unsure + (unsure === 1 ? " cell" : " cells") +
          " in a styled table or on a patterned or gradient fill, which this page cannot measure. Check it by eye, or with the Accessibility Checker." });
        if (cf.length) report.needs.push({ type: "info", id: "cf", text: "Conditional formatting on " + sheetList(cf) +
          " can change a cell's colors as its value changes. Check each rule's colors (Home, Conditional Formatting, Manage Rules)." });
      });
    });
  }
  // Writes a contrast item's fix: for each cell format it covers, a copy of the format's
  // font in the new color and a copy of the format using it, then points its cells there.
  function applyContrastXlsx(doc, st, n) {
    var fontsEl = first(st, NS.s, "fonts"), xfsEl = first(st, NS.s, "cellXfs");
    if (!fontsEl || !xfsEl) return 0;
    var fontEls = els(fontsEl, NS.s, "font").filter(function (f) { return f.parentNode === fontsEl; }), xfEls = els(xfsEl, NS.s, "xf");
    var made = {}, count = 0, cache = {};
    n.cells.forEach(function (loc) {
      var x = doc.parts[loc.sheet];
      if (!x) return;
      var cells = cache[loc.sheet] = cache[loc.sheet] || els(x, NS.s, "c"), c = cells[loc.cell];
      if (!c) return;
      if (made[loc.xf] == null) {
        var xf = xfEls[loc.xf], base = xf ? fontEls[+xf.getAttribute("fontId") || 0] : fontEls[0];
        var font = base ? base.cloneNode(true) : st.createElementNS(NS.s, "font");
        var old = child(font, NS.s, "color");
        if (old) font.removeChild(old);
        var clr = st.createElementNS(NS.s, "color");
        clr.setAttribute("rgb", "FF" + n.fix);
        var at = font.firstChild;
        while (at && !(at.nodeType === 1 && /^(name|family|charset|scheme)$/.test(at.localName))) at = at.nextSibling;
        font.insertBefore(clr, at);
        fontsEl.appendChild(font);
        var fid = els(fontsEl, NS.s, "font").filter(function (f) { return f.parentNode === fontsEl; }).length - 1;
        fontsEl.setAttribute("count", String(fid + 1));
        var nx = xf ? xf.cloneNode(true) : st.createElementNS(NS.s, "xf");
        nx.setAttribute("fontId", String(fid)); nx.setAttribute("applyFont", "1");
        xfsEl.appendChild(nx);
        made[loc.xf] = els(xfsEl, NS.s, "xf").length - 1;
        xfsEl.setAttribute("count", String(made[loc.xf] + 1));
      }
      c.setAttribute("s", String(made[loc.xf]));
      doc.touch(loc.sheet); count++;
    });
    return count;
  }
  // A sheet's new name in every place that points at it: formulas, data validation and
  // conditional formatting on each sheet, the workbook's defined names, each chart's
  // series, a pivot cache's source, and the list of parts in docProps/app.xml. A quoted
  // name is always valid in a formula, so each new reference is quoted. Text in a
  // formula's string literals and a reference into another workbook ([1]Sheet1!) stay.
  function sheetKey(n) { return String(n).toLowerCase(); }
  function renameRefs(f, map) {
    return f.replace(/("(?:[^"]|"")*")|(\[[^\]]*\])?('(?:[^']|'')+'|[A-Za-z_À-￿][\w.À-￿]*)!/g, function (m, str, ext, nm) {
      if (str || ext) return m;
      var bare = nm.charAt(0) === "'" ? nm.slice(1, -1).replace(/''/g, "'") : nm;
      var to = map[sheetKey(bare)];
      return to == null ? m : "'" + to.replace(/'/g, "''") + "'!";
    });
  }
  function renameSheets(doc, map) {
    var paths = Object.keys(doc.zip.files).filter(function (p) {
      return /^xl\/(workbook\.xml|worksheets\/[^/]+\.xml|charts\/[^/]+\.xml|pivotCache\/[^/]+\.xml)$/.test(p) || p === "docProps/app.xml";
    });
    return Promise.all(paths.map(function (path) {
      return doc.read(path).then(function (d) {
        if (!d) return;
        var changed = false;
        var refs = path === "docProps/app.xml" ? [] : els(d, NS.s, "definedName").concat(els(d, NS.s, "f"), els(d, NS.s, "formula"),
          els(d, NS.s, "formula1"), els(d, NS.s, "formula2"), els(d, NS.c, "f"), els(d, "http://schemas.microsoft.com/office/excel/2006/main", "f"));
        refs.forEach(function (el) {
          var t = el.textContent, nt = renameRefs(t, map);
          if (nt !== t) { el.textContent = nt; changed = true; }
        });
        els(d, NS.s, "worksheetSource").forEach(function (src) {
          var to = map[sheetKey(src.getAttribute("sheet") || "")];
          if (to != null) { src.setAttribute("sheet", to); changed = true; }
        });
        if (path === "docProps/app.xml") els(d, NS.vt, "lpstr").forEach(function (el) {
          var to = map[sheetKey(el.textContent)];
          if (to != null) { el.textContent = to; changed = true; }
        });
        if (changed) doc.touch(path);
      });
    }));
  }

  function draftCharts(doc, report) {
    return Promise.all(report.needs.filter(function (n) { return n.type === "alt" && n.chartPart; }).map(function (n) {
      return chartDraft(doc, n.chartPart, n.words).then(function (t) { if (t) { n.draft = t; n.fromData = true; } });
    }));
  }

  // Reads the file, fixes what needs no judgment, and returns the report with a session
  // that finish() writes the answers into.
  // ── A PDF is fixed at its source (lane NEXT, S513) ──────────────────────────────
  // A PDF's tags, title and language are written when its program exports it, so the
  // lasting fix is in the deck or document it came from: remediate that, then export
  // again. This reads the PDF's own record of who made it and what it carries, names
  // the source and the steps, and changes nothing. Office and most exporters keep the
  // catalog and metadata in compressed object streams, so those are inflated first.
  function latin1(u8) {
    var out = "", CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) out += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return out;
  }
  function inflateWith(env) {
    if (env.inflate) return env.inflate;
    if (typeof root.DecompressionStream !== "function" && typeof DecompressionStream !== "function") return null;
    var DS = root.DecompressionStream || DecompressionStream;
    // Tolerant: a stream's bytes often carry an end-of-line past the zlib data, which a
    // strict reader throws on after it has handed back everything that matters.
    return function (u8) {
      var parts = [], ds = new DS("deflate"), w = ds.writable.getWriter(), r = ds.readable.getReader();
      w.write(u8).catch(function () {}); w.close().catch(function () {});
      function pump() {
        return r.read().then(function (x) { if (x.done) return; parts.push(x.value); return pump(); });
      }
      return pump().catch(function () {}).then(function () {
        var n = 0, k = 0; parts.forEach(function (p) { n += p.length; });
        var all = new Uint8Array(n); parts.forEach(function (p) { all.set(p, k); k += p.length; });
        return all;
      });
    };
  }
  // The streams worth opening: object streams (the catalog and Info live there in Office's
  // PDFs) and the XMP metadata. Page content is left shut.
  function pdfText(u8, env) {
    var s = latin1(u8), inflate = inflateWith(env), jobs = [], re = /stream\r?\n/g, m;
    while ((m = re.exec(s))) {
      var head = s.lastIndexOf("obj", m.index), dict = head < 0 ? "" : s.slice(head, m.index);
      if (!/\/Type\s*\/ObjStm|\/Subtype\s*\/XML/.test(dict) || !/\/FlateDecode/.test(dict)) continue;
      var end = s.indexOf("endstream", m.index + m[0].length);
      if (end < 0 || !inflate) continue;
      jobs.push(inflate(u8.subarray(m.index + m[0].length, end)).then(latin1, function () { return ""; }));
      re.lastIndex = end;
    }
    return Promise.all(jobs).then(function (more) { return [s].concat(more).join("\n"); });
  }
  function utf16be(b) { var o = ""; for (var i = 0; i + 1 < b.length; i += 2) o += String.fromCharCode((b.charCodeAt(i) << 8) | b.charCodeAt(i + 1)); return o; }
  function utf8(b) { try { return decodeURIComponent(escape(b)); } catch (e) { return b; } }
  // A PDF string, literal `(…)` or hex `<…>`, read the way the PDF stores it.
  function pdfString(t, key) {
    var m = new RegExp("/" + key + "\\s*(\\(|<(?!<))").exec(t);
    if (!m) return null;
    var i = m.index + m[0].length, raw = "";
    if (m[1] === "<") {
      var hex = t.slice(i, t.indexOf(">", i)).replace(/[^0-9a-f]/gi, "");
      for (var h = 0; h + 1 < hex.length; h += 2) raw += String.fromCharCode(parseInt(hex.substr(h, 2), 16));
    } else {
      for (var depth = 1; i < t.length; i++) {
        var c = t[i];
        if (c === "\\") {
          var nx = t[++i], oct = /[0-7]/.test(nx) ? /^[0-7]{1,3}/.exec(t.slice(i))[0] : "";
          if (oct) { raw += String.fromCharCode(parseInt(oct, 8)); i += oct.length - 1; }
          else if (nx === "\r" || nx === "\n") { if (nx === "\r" && t[i + 1] === "\n") i++; }
          else raw += { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[nx] || nx;
        } else if (c === "(") { depth++; raw += c; }
        else if (c === ")") { if (--depth === 0) break; raw += c; }
        else raw += c;
      }
    }
    if (raw.charCodeAt(0) === 0xFE && raw.charCodeAt(1) === 0xFF) raw = utf16be(raw.slice(2));
    return raw.replace(/\u0000/g, "").trim();
  }
  // The dictionary `<< … >>` that encloses position i, balanced, or "" when there is none.
  function dictAround(t, i) {
    var depth = 0, a = -1, k;
    for (k = i; k > 0; k--) {
      if (t[k] === ">" && t[k - 1] === ">") { depth++; k--; }
      else if (t[k] === "<" && t[k - 1] === "<") { if (depth === 0) { a = k - 1; break; } depth--; k--; }
    }
    if (a < 0) return "";
    for (depth = 0, k = a; k < t.length - 1; k++) {
      if (t[k] === "<" && t[k + 1] === "<") { depth++; k++; }
      else if (t[k] === ">" && t[k + 1] === ">") { if (--depth === 0) return t.slice(a, k + 2); k++; }
    }
    return t.slice(a);
  }
  // The document's own Info and Catalog: a bookmark has a /Title and a span a /Lang, so the
  // first match in the file is often the wrong one (a TMC read as French that way).
  function infoDict(t) {
    var ref = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(t), m;
    if (ref && (m = new RegExp("(^|\\s)" + ref[1] + "\\s+" + ref[2] + "\\s+obj\\b").exec(t))) {
      var d = t.indexOf("<<", m.index);
      if (d >= 0) return dictAround(t, d + 2);
    }
    m = /\/(Producer|Creator)\s*[(<]/.exec(t);
    return m ? dictAround(t, m.index) : "";
  }
  function catalogDict(t) {
    var m = /\/Type\s*\/Catalog\b/.exec(t);
    return m ? dictAround(t, m.index) : "";
  }
  function xmpField(t, tag) {
    var m = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">").exec(t);
    if (!m) return null;
    var v = m[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    return v ? utf8(v) : null;
  }
  // Which program made it, so the fix can go where it lasts. Read from the PDF's Creator
  // and Producer: the program that wrote the source, then the one that wrote the PDF.
  var PDF_SOURCES = [
    [/powerpoint|impress/i, "deck", "pptx"],
    [/google slides/i, "deck", "pptx", "google"],
    [/google docs/i, "document", "docx", "google"],
    [/\bword\b|writer\b/i, "document", "docx"],
    [/excel|calc\b/i, "spreadsheet", "xlsx"],
    [/indesign|illustrator|quarkxpress|publisher|canva/i, "layout", ""],
    [/chrom|skia|safari|webkit|mozilla|firefox|edge|wkhtmltopdf|headless/i, "web", ""],
    [/scan|epson|canon|xerox|ricoh|konica|sharp|kyocera|lexmark|brother|hp digital|paperport|abbyy|naps2/i, "scan", ""]
  ];
  function pdfSource(creator, producer, hasText) {
    var both = [creator, producer].filter(Boolean).join(" · ");
    if (!hasText) return { kind: "scan", ext: "", app: both || "a scanner or a picture" };
    for (var i = 0; i < PDF_SOURCES.length; i++) {
      var hit = [creator, producer].filter(function (x) { return x && PDF_SOURCES[i][0].test(x); })[0];
      if (hit) return { kind: PDF_SOURCES[i][1], ext: PDF_SOURCES[i][2], google: !!PDF_SOURCES[i][3], app: hit };
    }
    return { kind: "", ext: "", app: both };
  }
  var PDF_STEPS = {
    deck: "Open the deck it came from, or drop the .pptx here and remediate it first. Then in PowerPoint choose File, Export, Create PDF/XPS; under Options, tick Document structure tags for accessibility.",
    document: "Open the document it came from, or drop the .docx here and remediate it first. Then in Word choose File, Save As, PDF; under Options, tick Document structure tags for accessibility and Create bookmarks using Headings.",
    spreadsheet: "Fix the workbook it came from: a header row on each table, a name for each sheet, alt text on each chart. Then in Excel choose File, Save As, PDF, with Document structure tags for accessibility ticked under Options.",
    layout: "The fix belongs in the layout file it came from. Ask whoever laid it out to set its alt text, reading order and language there and to export a tagged PDF.",
    web: "It is a web page printed to PDF. Fix the page itself, then print it again from Chrome or Edge, which tag what they print.",
    scan: "It holds pictures of the words and no text, so a screen reader finds nothing. Find the file it was printed from and fix that; failing that, it needs text recognition (Scan and OCR in Acrobat) and a person to check the result.",
    "": "Find the file it was made from, fix that, and export a tagged PDF again."
  };
  function inspectPdf(buf, name, env) {
    var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (latin1(u8.subarray(0, 1024)).indexOf("%PDF-") < 0) return Promise.reject(new Error("This file does not read as a PDF. Save it again as a PDF and drop it again."));
    return pdfText(u8, env).then(function (t) {
      var info = infoDict(t), cat = catalogDict(t);
      var creator = pdfString(info, "Creator") || xmpField(t, "xmp:CreatorTool");
      var producer = pdfString(info, "Producer") || xmpField(t, "pdf:Producer");
      var title = pdfString(info, "Title") || xmpField(t, "dc:title");
      if (title && STOCK_TITLE.test(title)) title = "";
      var lang = pdfString(cat, "Lang");
      var tagged = /\/StructTreeRoot\s+\d+\s+\d+\s+R/.test(cat) && /\/Marked\s*true/.test(t);
      var shown = /\/DisplayDocTitle\s*true/.test(t);
      var hasText = /\/Font\b/.test(t) && /\/(Type0|TrueType|Type1|Type3)\b/.test(t);
      var pages = (t.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
      var src = pdfSource(creator, producer, hasText);
      var checks = [
        { ok: tagged, text: tagged ? "Tagged: a screen reader can follow its headings, lists and tables." : "Not tagged: a screen reader reads it as one run of words, with no headings, lists or tables." },
        { ok: /^en\b/i.test(lang), text: !lang ? "No language is set, so a screen reader guesses the voice."
          : /^en\b/i.test(lang) ? "Its language is set (" + lang + ")." : "Its language is set to " + lang + ", not English: check it matches the words, or a screen reader reads them in the wrong voice." },
        { ok: !!title, text: title ? "Its title is " + title + (shown ? "." : ", though a reader shows the file's name in its place.") : "It has no title, so a reader shows the file's name." },
        { ok: hasText, text: hasText ? "It holds text." : "It holds no text: each page is a picture." }
      ];
      var report = {
        name: name, ext: "pdf", fixed: [], needs: [],
        extent: (pages ? pages + (pages === 1 ? " page" : " pages") : "A PDF") + (src.app ? ", made with " + src.app : ""),
        pdf: { creator: creator || "", producer: producer || "", title: title || "", lang: lang || "", tagged: tagged, titleShown: shown,
          hasText: hasText, pages: pages, source: src, checks: checks, steps: PDF_STEPS[src.kind] || PDF_STEPS[""] }
      };
      if (src.google) report.pdf.steps = "It came from Google " + (src.kind === "deck" ? "Slides" : "Docs") + ". Choose File, Download, Microsoft " + (src.kind === "deck" ? "PowerPoint (.pptx)" : "Word (.docx)") + ", drop that file here and remediate it, then save the PDF from " + (src.kind === "deck" ? "PowerPoint" : "Word") + " with Document structure tags for accessibility ticked under Options.";
      return { report: report, doc: null };
    });
  }

  function inspect(buf, name, env) {
    env = envOf(env);
    var ext = (/\.([a-z0-9]+)$/i.exec(name || "") || [])[1];
    ext = ext ? ext.toLowerCase() : "";
    if (ext === "pdf") return inspectPdf(buf, name, env);
    if (ext !== "pptx" && ext !== "docx" && ext !== "xlsx") return Promise.reject(new Error("Remediation reads a .pptx deck, a .docx document, an .xlsx workbook or a PDF. Save the file in one of those and drop it again."));
    if (!env.JSZip) return Promise.reject(new Error("The zip reader did not load. Reload the page and try again."));
    return env.JSZip.loadAsync(buf).then(function (zip) {
      var doc = new Doc(env, zip);
      var report = { name: name, ext: ext, fixed: [], needs: [], extent: "" };
      return ({ pptx: inspectPptx, docx: inspectDocx, xlsx: inspectXlsx })[ext](doc, name, report).then(function () {
        return { report: report, doc: doc };
      });
    });
  }

  // answers: { [needId]: { text, decorative } }. Writes them, then returns the file.
  // type: "blob" in the browser, "nodebuffer" in Node.
  function finish(session, answers, type) {
    var doc = session.doc, report = session.report, done = { alt: 0, decorative: 0, titles: 0, colors: 0, sheets: 0 };
    var renames = {};
    answers = answers || {};
    var byPath = {};
    report.needs.forEach(function (n) { if (n.path) (byPath[n.path] = byPath[n.path] || []).push(n); });
    return Promise.all(Object.keys(byPath).map(function (path) {
      return doc.read(path).then(function (d) {
        byPath[path].forEach(function (n) {
          var ans = answers[n.id];
          if (!ans) return;
          if (n.type === "alt") {
            var tag = report.ext === "pptx" ? els(d, NS.p, "cNvPr") : report.ext === "xlsx" ? els(d, NS.xdr, "cNvPr") : els(d, NS.wp, "docPr");
            var pr = tag.filter(function (x) { return x.getAttribute("id") === n.shapeId; })[0];
            if (!pr) return;
            if (ans.decorative) { markDecorative(pr); done.decorative++; }
            else if ((ans.text || "").trim()) { pr.setAttribute("descr", ans.text.trim()); done.alt++; }
            else return;
            doc.touch(path);
          } else if (n.type === "title" && (ans.text || "").trim()) {
            var sp = els(d, NS.p, "sp").filter(function (s) {
              var ph = first(s, NS.p, "ph"), t = ph && ph.getAttribute("type");
              return t === "title" || t === "ctrTitle";
            })[0];
            if (!sp) return;
            var body = first(sp, NS.p, "txBody");
            if (!body) return;
            var para = child(body, NS.a, "p");
            if (!para) { para = d.createElementNS(NS.a, "a:p"); body.appendChild(para); }
            var run = d.createElementNS(NS.a, "a:r"), rPr = d.createElementNS(NS.a, "a:rPr"), t = d.createElementNS(NS.a, "a:t");
            rPr.setAttribute("lang", LANG); t.textContent = ans.text.trim();
            run.appendChild(rPr); run.appendChild(t);
            var end = child(para, NS.a, "endParaRPr");
            para.insertBefore(run, end);
            doc.touch(path); done.titles++;
          } else if (n.type === "sheet" && (ans.text || "").trim()) {
            // Excel's rules for a sheet name: 31 characters at most, none of [ ] : * ? / \,
            // no apostrophe at either end, not History, and no two alike.
            var nm = ans.text.replace(/[\[\]:*?\/\\]/g, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "").slice(0, 31).trim();
            var all = els(d, NS.s, "sheet");
            var el = all.filter(function (x) { return x.getAttribute("name") === n.sheetName; })[0];
            var taken = all.some(function (x) { return x !== el && sheetKey(x.getAttribute("name")) === sheetKey(nm); }) ||
              Object.keys(renames).some(function (o) { return sheetKey(renames[o]) === sheetKey(nm); });
            if (!el || !nm || nm === n.sheetName || /^history$/i.test(nm) || taken) return;
            el.setAttribute("name", nm);
            renames[sheetKey(n.sheetName)] = nm;
            doc.touch(path); done.sheets++;
          } else if (n.type === "contrast" && ans.fix) {
            var k = report.ext === "pptx" ? applyContrast(d, n) : report.ext === "xlsx" ? applyContrastXlsx(doc, d, n) : applyContrastDocx(d, n);
            if (k) { doc.touch(path); done.colors += k; }
          }
        });
      });
    })).then(function () {
      return Object.keys(renames).length ? renameSheets(doc, renames) : null;
    }).then(function () {
      doc.flush();
      return doc.zip.generateAsync({ type: type || "blob", compression: "DEFLATE",
        mimeType: report.ext === "pptx" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          : report.ext === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    }).then(function (file) { return { file: file, done: done }; });
  }

  // The remediated file's name: the original's, with _Remediated before the extension,
  // keeping its date code (CLAUDE.md: a re-version keeps the date code).
  function outName(name) { return String(name || "file").replace(/(\.[a-z0-9]+)$/i, "_Remediated$1"); }

  var api = { inspect: inspect, finish: finish, outName: outName, _pdfSource: pdfSource, _titleFromName: titleFromName, _renameRefs: renameRefs, _ratio: ratio, _passingColor: passingColor };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CPL_REMEDIATE = api;
})(typeof window !== "undefined" ? window : this);
