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
// A chart in any of the three (S517): each series' bars, slices or line against the plot
// area, automatic colors measured as Office draws them, and its titles, legend, axis and
// data labels against what they sit on, with the nearest passing color as the fix.
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
          (doc.slideCtx = doc.slideCtx || {})[s.path] = ctx;
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
            var isChart = shape.localName === "graphicFrame";
            if (isChart && cNvPr) (doc.charts = doc.charts || []).push({ part: s.rels[first(shape, NS.c, "chart").getAttributeNS(NS.r, "id")], host: s.path,
              label: "Slide " + s.n + ", chart" + (cNvPr.getAttribute("name") ? " (" + cNvPr.getAttribute("name") + ")" : "") });
            if (!cNvPr || isDecorative(cNvPr) || (cNvPr.getAttribute("descr") || "").trim()) return;
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
        .then(function () { return contrastCharts(doc, report, function (ch) { var c = doc.slideCtx && doc.slideCtx[ch.host]; return c || null; }); })
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
      var k = 0, kc = 0;
      els(d, NS.wp, "docPr").forEach(function (pr) {
        var ce = first(pr.parentNode, NS.c, "chart");
        if (ce) (doc.charts = doc.charts || []).push({ part: rels[ce.getAttributeNS(NS.r, "id")], label: "Chart " + (++kc) });
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
      var theme = Object.keys(rels).map(function (r) { return rels[r]; }).filter(function (t) { return /theme\/[^/]+\.xml$/.test(t); })[0] || "word/theme/theme1.xml";
      var hostCtx = themeCtx(doc, theme);
      return contrastDocx(doc, d, styles, report).then(function () { return draftCharts(doc, report); })
        .then(function () { return contrastCharts(doc, report, function () { return hostCtx; }); })
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
                    var ce = first(shape, NS.c, "chart");
                    if (ce && cNvPr) (doc.charts = doc.charts || []).push({ part: drels[ce.getAttributeNS(NS.r, "id")],
                      label: sh.name + ", chart" + (cNvPr.getAttribute("name") ? " (" + cNvPr.getAttribute("name") + ")" : "") });
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
        var theme = Object.keys(wbRels).map(function (r) { return wbRels[r]; }).filter(function (t) { return /theme\d*\.xml$/.test(t); })[0] || "xl/theme/theme1.xml";
        return contrastXlsx(doc, sheets, ss, report).then(function () { return draftCharts(doc, report); })
          .then(function () { var hc = themeCtx(doc, theme); return contrastCharts(doc, report, function () { return hc; }); })
          .then(function () { return fixTitle(doc, titleFromName(name), report); });
      });
    });
  }
  // ── a workbook's contrast ───────────────────────────────────────────────────
  // A cell's words take its font's color (xl/styles.xml: cellXfs -> fonts) and sit on its
  // fill (cellXfs -> fills: a solid pattern's fgColor), else on white. A color is an ARGB
  // rgb, a theme index (Excel counts lt1 before dk1, unlike the theme's own order) with a
  // tint, an index into the old 64-color palette (the workbook's own indexedColors when it
  // has one), or auto, which never fails. A cell in a styled table, or a fill that is a
  // pattern or a gradient, is counted for a person. A shared string's own run colors are
  // measured too; a fix writes a new font and cell format beside the old, so the other
  // cells sharing that format keep theirs.
  // A conditional-formatting rule paints its differential format (xl/styles.xml: dxfs) over
  // each cell in its range when the rule holds: its font color, else the cell's, on its
  // fill, else the cell's. A dxf's solid fill is its bgColor (fgColor when it has none).
  // Each dxf is one item; its fix is a copy of the dxf in a color that passes on every fill
  // its failing rules meet, and only those rules point at the copy. A color scale, data bar
  // or icon set, and an Excel 2010 rule (x14, in the sheet's extLst), are listed for a person.
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
        var dxfsEl = first(st, NS.s, "dxfs");
        var dxfs = dxfsEl ? els(dxfsEl, NS.s, "dxf").map(function (d) {
          var f = child(d, NS.s, "font"), fl = child(d, NS.s, "fill"), pf = fl && child(fl, NS.s, "patternFill"), b = f && child(f, NS.s, "b"), fill = null;
          if (fl && child(fl, NS.s, "gradientFill")) fill = { complex: true };
          else if (pf) {
            var pt = pf.getAttribute("patternType");
            if (pt && pt !== "solid" && pt !== "none") fill = { complex: true };
            else if (pt !== "none") {
              var h = xlColor(child(pf, NS.s, "bgColor") || child(pf, NS.s, "fgColor"), scheme, palette);
              fill = h && h !== "auto" ? { hex: h } : h === "auto" ? { complex: true } : null;
            }
          }
          return { fg: f ? xlColor(child(f, NS.s, "color"), scheme, palette) : null, bold: b ? !/^(0|false)$/.test(b.getAttribute("val") || "") : null, fill: fill };
        }) : [];
        var sis = ss ? els(ss, NS.s, "si") : [], pairs = {}, order = [], unsure = 0, byHand = {}, cf = [];
        var cfs = {}, cfOrder = [], cfUnsure = 0;
        sheets.forEach(function (sh) {
          var x = doc.parts[sh.path];
          if (!x) return;
          // Each rule with a dxf, the ranges it covers, and (once the cells are read) every
          // fill it meets: a range with no written cell meets the sheet's default, on white.
          var rules = [], byHandCf = false;
          els(x, NS.s, "cfRule").forEach(function (r, ri) {
            var d = r.getAttribute("dxfId"), cfEl = r.parentNode;
            if (d == null || d === "" || !dxfs[+d]) { byHandCf = true; return; }
            var rgs = String((cfEl && cfEl.getAttribute("sqref")) || "").split(/\s+/).map(rangeOf).filter(Boolean);
            if (rgs.length) rules.push({ ri: ri, dxf: +d, rgs: rgs, met: 0, sqref: cfEl.getAttribute("sqref") });
          });
          if (byHandCf || els(x, "*", "conditionalFormatting").some(function (e) { return e.namespaceURI !== NS.s; })) cf.push(sh.name);
          var meet = function (rule, fg, bg, size, bold) {
            var dx = dxfs[rule.dxf], f = dx.fg || fg, b = dx.bold != null ? dx.bold : bold, back = dx.fill || (bg ? { hex: bg } : { complex: true });
            rule.met++;
            if (back.complex) { cfUnsure++; return; }
            if (!f || f === "auto") return;
            var large = size >= 18 || (b && size >= 14), need = large ? 3 : 4.5, have = ratio(f, back.hex);
            var it = cfs[rule.dxf] = cfs[rule.dxf] || { dxf: rule.dxf, own: dx.fg, met: [], bad: [], rules: [], where: [] };
            if (cfOrder.indexOf(rule.dxf) < 0) cfOrder.push(rule.dxf);
            it.met.push({ bg: back.hex, need: need, rule: sh.path + "#" + rule.ri });
            if (have >= need) return;
            it.bad.push({ fg: f, bg: back.hex, need: need, have: have, large: large });
            if (!it.rules.some(function (q) { return q.sheet === sh.path && q.rule === rule.ri; })) it.rules.push({ sheet: sh.path, rule: rule.ri });
            var at = sh.name + " " + rule.sqref.replace(/\$/g, "").replace(/\s+/g, ", ");
            if (it.where.indexOf(at) < 0) it.where.push(at);
          };
          els(x, NS.s, "c").forEach(function (c, ci) {
            var t = c.getAttribute("t"), v = child(c, NS.s, "v"), is = child(c, NS.s, "is");
            var si = t === "s" && v ? sis[+v.textContent] : t === "inlineStr" ? is : null;
            var text = si ? textOf(si, NS.s) : v ? v.textContent : "";
            if (!String(text).trim()) return;
            var xi = +c.getAttribute("s") || 0, xf = xfs[xi] || { font: 0, fill: 0 }, font = fonts[xf.font] || fontOf(null), back = fills[xf.fill] || null;
            var cr = colRow(c.getAttribute("r"));
            if (!back && (sh.tables || []).some(function (rg) { return inRange(cr, rg); })) back = { complex: true };
            rules.forEach(function (rule) {
              if (rule.rgs.some(function (rg) { return inRange(cr, rg); })) meet(rule, font.fg, back ? (back.complex ? null : back.hex) : "FFFFFF", font.size, font.bold);
            });
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
          rules.forEach(function (rule) { if (!rule.met) { var f0 = fonts[(xfs[0] || { font: 0 }).font] || fontOf(null); meet(rule, f0.fg, "FFFFFF", f0.size, f0.bold); } });
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
        cfOrder.forEach(function (d, i) {
          var it = cfs[d];
          if (!it.bad.length) return;
          var worst = it.bad.slice().sort(function (a, b) { return a.have / a.need - b.have / b.need; })[0];
          var need = Math.max.apply(null, it.bad.map(function (b) { return b.need; }));
          // The fix must pass on every fill the failing rules meet, the passing cells' included.
          var mine = it.met.filter(function (m) { return it.rules.some(function (q) { return m.rule === q.sheet + "#" + q.rule; }); });
          var fix = passingColor(it.own || worst.fg, worst.bg, need);
          var ok = mine.every(function (m) { return ratio(fix, m.bg) >= m.need; });
          var n = it.rules.length, says = (n === 1 ? "A conditional-formatting rule" : n + " conditional-formatting rules") + " on " + sheetList(it.where) + ", when " + (n === 1 ? "it holds" : "they hold") +
            ", show" + (n === 1 ? "s" : "") + " words in #" + worst.fg + " on #" + worst.bg + ", which reads " + (Math.floor(worst.have * 10) / 10) + ":1; " + (worst.large ? "large " : "") + "text needs " + worst.need + ":1";
          if (!ok) { report.needs.push({ type: "info", id: "cfc" + (i + 1), text: says + ". No one color passes on every fill it meets, so change the rule's colors (Home, Conditional Formatting, Manage Rules)." }); return; }
          report.needs.push({ type: "contrast", id: "cfc" + (i + 1), path: "xl/styles.xml", fg: worst.fg, bg: worst.bg, need: need,
            ratio: Math.round(worst.have * 100) / 100, fix: fix, fixRatio: Math.round(ratio(fix, worst.bg) * 100) / 100, dxf: it.dxf, rules: it.rules, text: says });
        });
        var hand = Object.keys(byHand);
        if (hand.length) report.needs.push({ type: "info", id: "cr", text: "Words colored within a cell fall below AA contrast on " +
          sheetList(hand.map(function (h) { return h + " (" + byHand[h].slice(0, 5).join(", ") + (byHand[h].length > 5 ? " and " + (byHand[h].length - 5) + " more" : "") + ")"; })) +
          ". Select those words in the cell and choose a darker font color." });
        if (unsure) report.needs.push({ type: "info", id: "cu", text: "Contrast on " + unsure + (unsure === 1 ? " cell" : " cells") +
          " in a styled table or on a patterned or gradient fill, which this page cannot measure. Check it by eye, or with the Accessibility Checker." });
        if (cfUnsure) report.needs.push({ type: "info", id: "cfu", text: "Conditional formatting on " + cfUnsure + (cfUnsure === 1 ? " cell" : " cells") +
          " paints on a styled table, a pattern or a gradient, which this page cannot measure. Check those rules' colors by eye." });
        if (cf.length) report.needs.push({ type: "info", id: "cf", text: "Conditional formatting on " + sheetList(cf) +
          " uses a color scale, data bar, icon set or a rule this page cannot read. Check each rule's colors (Home, Conditional Formatting, Manage Rules)." });
      });
    });
  }
  // Writes a contrast item's fix: for each cell format it covers, a copy of the format's
  // font in the new color and a copy of the format using it, then points its cells there.
  function applyContrastXlsx(doc, st, n) {
    if (n.dxf != null) return applyContrastDxf(doc, st, n);
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
  // A conditional format's fix: a copy of its dxf whose font carries the new color (a dxf's
  // font comes first among its children), and the failing rules pointed at the copy.
  function applyContrastDxf(doc, st, n) {
    var dxfsEl = first(st, NS.s, "dxfs"), old = dxfsEl && els(dxfsEl, NS.s, "dxf")[n.dxf];
    if (!old) return 0;
    var nd = old.cloneNode(true), font = child(nd, NS.s, "font");
    if (!font) { font = st.createElementNS(NS.s, "font"); nd.insertBefore(font, nd.firstChild); }
    var was = child(font, NS.s, "color");
    if (was) font.removeChild(was);
    var clr = st.createElementNS(NS.s, "color");
    clr.setAttribute("rgb", "FF" + n.fix);
    var at = font.firstChild;
    while (at && !(at.nodeType === 1 && /^(name|family|charset|scheme)$/.test(at.localName))) at = at.nextSibling;
    font.insertBefore(clr, at);
    dxfsEl.appendChild(nd);
    var id = els(dxfsEl, NS.s, "dxf").length - 1, count = 0;
    dxfsEl.setAttribute("count", String(id + 1));
    n.rules.forEach(function (q) {
      var x = doc.parts[q.sheet], r = x && els(x, NS.s, "cfRule")[q.rule];
      if (!r) return;
      r.setAttribute("dxfId", String(id));
      doc.touch(q.sheet); count++;
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

  // ── a chart's contrast (lane NEXT, S517) ────────────────────────────────────
  // WCAG 1.4.11: a series' bars, slices or line need 3:1 against the plot area they sit
  // on; 1.4.3: chart text with a color of its own (or the chart's) needs 4.5:1, 3:1 when
  // large, against what it sits on. A series with no color of its own is measured as
  // Office draws it, the theme's accents in turn (only the first six), and the fix writes
  // the passing color into the series. A series whose values show as data labels is left
  // alone: the labels carry what its color does. The plot area's fill, else the chart's,
  // else the slide's background (a deck) or white (a document or workbook) is what the
  // series sit on; a data label inside a bar or slice sits on that bar or slice. A gradient
  // or picture under a chart goes to a person, and so does slice-against-slice contrast.
  var CHART_MAP = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
  var LINE_CHART = /^(lineChart|line3DChart|radarChart|scatterChart)$/;
  var INSIDE = /^(ctr|inEnd|inBase|bestFit)$/;
  // Where an element sits in its part, as element-child positions, so a fresh read of the
  // same part finds it again; locate() reads them back.
  function locOf(el) {
    var path = [];
    for (; el && el.nodeType === 1; el = el.parentNode) {
      var i = 0;
      for (var s = el.previousSibling; s; s = s.previousSibling) if (s.nodeType === 1) i++;
      path.unshift(i);
    }
    return path;
  }
  function locate(d, path) {
    var node = d;
    for (var k = 0; node && k < path.length; k++) {
      var i = -1, c = node.firstChild;
      for (; c; c = c.nextSibling) if (c.nodeType === 1 && ++i === path[k]) break;
      node = c;
    }
    return node || null;
  }
  function attrOn(node, ns, name) { var el = node && child(node, ns, name); return !!el && /^(1|true)$/.test(el.getAttribute("val") || "1"); }
  function hexGround(f, fallback) { return !f || f.none ? fallback : f.hex ? f.hex : null; }
  function themeCtx(doc, path) {
    return doc.read(path).then(function (theme) { return { scheme: wordScheme(theme), map: CHART_MAP, bg: { hex: "FFFFFF" } }; });
  }
  function contrastCharts(doc, report, hostCtx) {
    var unsure = [], seen = {};
    return (doc.charts || []).reduce(function (pr, ch, ci) {
      return pr.then(function () {
        if (!ch.part || seen[ch.part]) return;
        seen[ch.part] = true;
        return Promise.all([doc.read(ch.part), hostCtx(ch)]).then(function (got) {
          var d = got[0], host = got[1];
          if (!d || !host) return;
          var ctx = Object.create(host), ovr = first(d, NS.c, "clrMapOvr");
          if (ovr) { ctx.map = {}; for (var i = 0; i < ovr.attributes.length; i++) if (!/^xmlns/.test(ovr.attributes[i].name)) ctx.map[ovr.attributes[i].localName] = ovr.attributes[i].value; }
          var root = d.documentElement, plot = first(d, NS.c, "plotArea");
          if (!plot) return;
          var chartBg = hexGround(fillOf(child(root, NS.c, "spPr"), ctx), hexGround(host.bg, null));
          var plotBg = chartBg && hexGround(fillOf(child(plot, NS.c, "spPr"), ctx), chartBg);
          if (!chartBg || !plotBg) { unsure.push(ch.label); return; }
          var accent = function (j) { return j < 6 ? colorOf((function () { var e = d.createElementNS(NS.a, "a:schemeClr"); e.setAttribute("val", "accent" + (j + 1)); return e; })(), ctx) : null; };
          var items = [], texts = {}, serNo = 0;
          // A text source: the element whose color the words take, the grounds they sit on.
          var addText = function (el, fg, size, bold, grounds, what) {
            var key = locOf(el).join("."), t = texts[key] = texts[key] || { el: el, fg: fg, size: size, bold: bold, grounds: {}, what: what };
            grounds.forEach(function (g) { if (g) t.grounds[g] = true; });
            return { fg: fg, need: size >= 18 || (bold && size >= 14) ? 3 : 4.5 };
          };
          var rPrColor = function (rPr) { var sf = rPr && child(rPr, NS.a, "solidFill"); return sf ? colorOf(colorChild(sf), ctx) : null; };
          var spaceDef = (function () { var tx = child(root, NS.c, "txPr"); return tx ? first(tx, NS.a, "defRPr") : null; })();
          // The words of a title, a legend, an axis or a set of labels: its runs' own colors,
          // else its own default, else the chart's. Returns each color and the ratio it needs.
          var textOf2 = function (owner, grounds, what) {
            var out = [];
            if (!owner) return out;
            var own = child(owner, NS.c, "txPr"), def = own ? first(own, NS.a, "defRPr") : null;
            var rich = first(owner, NS.c, "rich");
            if (rich && !def) def = first(rich, NS.a, "defRPr");
            var src = rPrColor(def) ? def : rPrColor(spaceDef) ? spaceDef : null;
            var sizeOf = function (r) { var s = r && +r.getAttribute("sz"); return s ? s / 100 : 0; };
            var boldOf = function (r) { return !!r && /^(1|true)$/.test(r.getAttribute("b") || ""); };
            var base = sizeOf(def) || sizeOf(spaceDef) || 10, bb = boldOf(def) || boldOf(spaceDef);
            var runs = rich ? els(rich, NS.a, "r") : [], plain = !runs.length;
            runs.forEach(function (r) {
              var rp = child(r, NS.a, "rPr");
              if (rPrColor(rp)) out.push(addText(rp, rPrColor(rp), sizeOf(rp) || base, boldOf(rp) || bb, grounds, what));
              else plain = true;
            });
            if (plain && src) out.push(addText(src, rPrColor(src), base, bb, grounds, what));
            return out;
          };
          var kindName = "";
          for (var kc = plot.firstChild; kc; kc = kc.nextSibling) {
            if (kc.nodeType !== 1 || !CHART_KIND[kc.localName]) continue;
            var kind = kc, line = LINE_CHART.test(kind.localName), sers = els(kind, NS.c, "ser");
            kindName = kindName || kind.localName;
            var pie = /^(pie|pie3D|doughnut)Chart$/.test(kind.localName);
            var vary = sers.length === 1 && (attrOn(kind, NS.c, "varyColors") || (pie && !child(kind, NS.c, "varyColors")));
            var stacked = /stacked/i.test((child(kind, NS.c, "grouping") || { getAttribute: function () { return ""; } }).getAttribute("val") || "");
            var kindLbls = child(kind, NS.c, "dLbls");
            sers.forEach(function (ser) {
              var si = serNo++, sp = child(ser, NS.c, "spPr");
              var tx = child(ser, NS.c, "tx"), nm = tx ? (first(tx, NS.c, "v") || { textContent: "" }).textContent : "";
              nm = nm || "Series " + (si + 1);
              var lbls = child(ser, NS.c, "dLbls") || kindLbls;
              var labeled = !!lbls && !attrOn(lbls, NS.c, "delete") && (attrOn(lbls, NS.c, "showVal") || attrOn(lbls, NS.c, "showPercent"));
              var own = line ? (function () { var ln = sp && child(sp, NS.a, "ln"); return ln ? fillOf(ln, ctx) : null; })() : fillOf(sp, ctx);
              // Office picks a series' own color by its c:idx, the theme's accents in turn.
              var sidx = child(ser, NS.c, "idx"), serFill = own ? (own.hex || null) : accent(sidx ? +sidx.getAttribute("val") || 0 : si);
              var cats = {}, catEl = child(ser, NS.c, "cat") || child(ser, NS.c, "xVal");
              if (catEl) els(catEl, NS.c, "pt").forEach(function (pt) { var v = first(pt, NS.c, "v"); cats[pt.getAttribute("idx")] = v ? v.textContent : ""; });
              var dpts = {};
              els(ser, NS.c, "dPt").forEach(function (p) { var ix = child(p, NS.c, "idx"); if (ix) dpts[ix.getAttribute("val")] = p; });
              // The fills the series paints: its own (one), or one per point.
              var fills = [];
              var nPts = els(child(ser, NS.c, "val") || child(ser, NS.c, "yVal") || ser, NS.c, "pt").length;
              if (vary && !line) {
                for (var j = 0; j < nPts; j++) {
                  var p = dpts[String(j)], pf = p ? fillOf(child(p, NS.c, "spPr"), ctx) : null;
                  var hex = pf ? pf.hex || null : accent(j);
                  fills.push({ hex: hex, pt: j, el: p || null, auto: !pf });
                }
              } else {
                fills.push({ hex: serFill, el: ser, auto: !own });
                Object.keys(dpts).forEach(function (ix) {
                  var p = dpts[ix], pf = fillOf(line ? (child(child(p, NS.c, "spPr") || p, NS.a, "ln")) : child(p, NS.c, "spPr"), ctx);
                  if (pf && pf.hex) fills.push({ hex: pf.hex, pt: +ix, el: p });
                });
              }
              var ptName = function (j) { return cats[String(j)] || String(j + 1); };
              // Slices side by side (the last beside the first) that read alike: a person's
              // call, often a white border between them rather than a new color.
              if (vary && pie && fills.length > 2) {
                var alike = [];
                fills.forEach(function (f, j) {
                  var g = fills[(j + 1) % fills.length];
                  if (f.hex && g.hex && ratio(f.hex, g.hex) < 3) alike.push(ptName(f.pt) + " and " + ptName(g.pt));
                });
                if (alike.length) report.needs.push({ type: "info", id: "ks" + (ci + 1) + "-" + (si + 1), text: ch.label + ": side by side, the slices " + alike.join("; ") +
                  " read less than 3:1 against each other. In the chart's Format pane, give the slices a white border (Format Data Series, Border, Solid line) or colors further apart." });
              }
              // The data labels, and those that sit inside the bars or slices, whose words a
              // series' new color must keep readable.
              var onFill = [];
              if (lbls && !attrOn(lbls, NS.c, "delete")) {
                var pos = child(lbls, NS.c, "dLblPos"), at = pos ? pos.getAttribute("val") : pie ? "bestFit" : stacked ? "ctr" : "outEnd";
                var lf = fillOf(child(lbls, NS.c, "spPr"), ctx), inside = !(lf && lf.hex) && !line && INSIDE.test(at);
                var said = textOf2(lbls, lf && lf.hex ? [lf.hex] : inside ? fills.map(function (f) { return f.hex; }) : [plotBg],
                  "the data labels" + (child(ser, NS.c, "dLbls") ? " of the series " + nm : ""));
                if (inside) onFill = said;
              }
              fills.forEach(function (f) {
                if (!f.hex || ratio(f.hex, plotBg) >= 3) return;
                var what = f.pt != null ? (pie ? "the slice " : "the point ") + ptName(f.pt) + (vary ? "" : " of the series " + nm) : "the series " + nm;
                // Its values show as labels, so the color is not all a reader has: advisory.
                items.push({ op: f.el ? "fill" : "newpt", loc: locOf(f.el || ser), pt: f.pt, line: line && f.el === ser, fg: f.hex, bg: plotBg, need: 3, what: what, keep: onFill,
                  advisory: labeled, rule: "a chart's " + (pie ? "slices" : line ? "lines" : "bars") + " need 3:1 against the plot area" +
                    (labeled ? " (its values show as labels, so this one is yours to weigh)" : "") });
              });
            });
          }
          if (!kindName) return;
          textOf2(child(child(root, NS.c, "chart"), NS.c, "title"), [chartBg], "the chart's title");
          var legend = first(d, NS.c, "legend");
          if (legend) { var lgf = fillOf(child(legend, NS.c, "spPr"), ctx); textOf2(legend, [lgf && lgf.hex ? lgf.hex : chartBg], "the legend"); }
          for (var ax = plot.firstChild; ax; ax = ax.nextSibling) {
            if (ax.nodeType !== 1 || !/Ax$/.test(ax.localName) || attrOn(ax, NS.c, "delete")) continue;
            textOf2(ax, [chartBg], "the " + (ax.localName === "valAx" ? "value" : "category") + " axis labels");
            textOf2(child(ax, NS.c, "title"), [chartBg], "the " + (ax.localName === "valAx" ? "value" : "category") + " axis title");
          }
          Object.keys(texts).forEach(function (key) {
            var t = texts[key], need = t.size >= 18 || (t.bold && t.size >= 14) ? 3 : 4.5;
            var bad = Object.keys(t.grounds).filter(function (g) { return ratio(t.fg, g) < need; });
            if (!bad.length) return;
            items.push({ op: "text", loc: locOf(t.el), fg: t.fg, grounds: bad, need: need, what: t.what, rule: (need === 3 ? "large " : "") + "text needs " + need + ":1" });
          });
          items.forEach(function (it, i) {
            var grounds = it.grounds || [it.bg];
            var worst = grounds.slice().sort(function (a, b) { return ratio(it.fg, a) - ratio(it.fg, b); })[0];
            var fix = it.keep && it.keep.length ? passingWith(it.fg, worst, it.need, it.keep) : passingColor(it.fg, worst, it.need);
            var have = ratio(it.fg, worst), base = ch.label + ": " + it.what + " in #" + it.fg + " on #" + worst + (/labels( of the series .*)?$/.test(it.what) ? " read " : " reads ") +
              (Math.floor(have * 10) / 10) + ":1; " + it.rule;
            if (!fix || !grounds.every(function (g) { return ratio(fix, g) >= it.need; })) {
              report.needs.push({ type: "info", id: "k" + (ci + 1) + "-" + (i + 1), text: base + (it.keep && it.keep.length ?
                ". No one color passes on the plot area and keeps the labels on it readable; change it in the chart's Format pane, or give the " + (/slice/.test(it.rule) ? "slices" : "bars") + " a dark outline." :
                ". No one color passes on every fill it meets; change it in the chart's Format pane.") });
              return;
            }
            report.needs.push({ type: "contrast", id: "k" + (ci + 1) + "-" + (i + 1), inChart: true, path: ch.part, op: it.op, loc: it.loc, pt: it.pt, line: !!it.line, advisory: !!it.advisory,
              fg: it.fg, bg: worst, need: it.need, ratio: Math.round(have * 100) / 100, fix: fix, fixRatio: Math.round(ratio(fix, worst) * 100) / 100, text: base });
          });
        });
      });
    }, Promise.resolve()).then(function () {
      if (unsure.length) report.needs.push({ type: "info", id: "ku", text: "Contrast in " + (unsure.length === 1 ? "one chart" : unsure.length + " charts") + " (" + unsure.join("; ") +
        "): the chart sits on a gradient, a picture or a pattern, which this page cannot measure. Check its bars, lines and words by eye, or with the Accessibility Checker." });
    });
  }
  // passingColor, with words that sit on the color (a bar's labels) kept at their own ratio;
  // null when no lightness of the hue does both.
  function passingWith(fg, bg, need, keep) {
    var hsl = toHsl(rgbOf(fg)), dark = luminance(bg) > 0.18, l = hsl[2];
    for (var i = 0; i <= 100; i++) {
      var hex = hexOf(fromHsl([hsl[0], hsl[1], l]));
      if (ratio(hex, bg) >= need + 0.1 && keep.every(function (k) { return ratio(hex, k.fg) >= k.need; })) return hex;
      l += dark ? -0.01 : 0.01;
    }
    return null;
  }
  // Puts a solid fill first among a shape's or run's settings' fills, replacing any other.
  var FILLS = /^(noFill|solidFill|gradFill|blipFill|pattFill|grpFill)$/;
  function solidInto(d, el, hex, before) {
    for (var c = el.firstChild; c; ) { var nx = c.nextSibling; if (c.nodeType === 1 && FILLS.test(c.localName)) el.removeChild(c); c = nx; }
    var sf = d.createElementNS(NS.a, "a:solidFill"), clr = d.createElementNS(NS.a, "a:srgbClr");
    clr.setAttribute("val", hex); sf.appendChild(clr);
    var at = el.firstChild;
    while (at && (at.nodeType !== 1 || !before.test(at.localName))) at = at.nextSibling;
    el.insertBefore(sf, at);
  }
  function insertChild(d, parent, el, before) {
    var at = parent.firstChild;
    while (at && (at.nodeType !== 1 || !before.test(at.localName))) at = at.nextSibling;
    parent.insertBefore(el, at);
    return el;
  }
  // Writes a chart item's fix: a series' or point's fill (or its line), else the color of
  // the words. A point Office colored by itself gets a data point of its own to hold it.
  function applyContrastChart(d, n) {
    var el = n._el || locate(d, n.loc);
    if (!el) return 0;
    if (n.op === "text") { solidInto(d, el, n.fix, /^(?!ln$)/); return 1; }
    if (n.op === "newpt") {
      var pt = d.createElementNS(NS.c, "c:dPt"), ix = d.createElementNS(NS.c, "c:idx");
      ix.setAttribute("val", String(n.pt)); pt.appendChild(ix);
      el = insertChild(d, el, pt, /^(dLbls|trendline|errBars|cat|val|xVal|yVal|smooth|shape|bubbleSize|bubble3D|extLst)$/);
    }
    var sp = child(el, NS.c, "spPr");
    if (!sp) sp = insertChild(d, el, d.createElementNS(NS.c, "c:spPr"), el.localName === "dPt" ? /^(pictureOptions|extLst)$/ : /^(?!(idx|order|tx)$)/);
    if (n.line) {
      var ln = child(sp, NS.a, "ln") || insertChild(d, sp, d.createElementNS(NS.a, "a:ln"), /^(effectLst|effectDag|scene3d|sp3d|extLst)$/);
      solidInto(d, ln, n.fix, /./);
    } else solidInto(d, sp, n.fix, /^(ln|effectLst|effectDag|scene3d|sp3d|extLst)$/);
    return 1;
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
        // A chart item finds its element before any fix shifts the part's children.
        byPath[path].forEach(function (n) { if (n.inChart && n.loc) n._el = locate(d, n.loc); });
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
            var k = n.inChart ? applyContrastChart(d, n) : report.ext === "pptx" ? applyContrast(d, n) : report.ext === "xlsx" ? applyContrastXlsx(doc, d, n) : applyContrastDocx(d, n);
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
