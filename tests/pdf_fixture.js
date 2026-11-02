// A small PDF built for the remediation tests: the parts a PDF's accessibility rests on
// (the Info dictionary, the catalog's language, tags and title display, fonts, the
// structure elements of its pictures and headings), with a real cross-reference section so
// the writer's incremental update has something to point back at. With `objstm` set it is
// laid out the way Office writes one: the catalog compressed in an object stream, indexed
// by a cross-reference stream; otherwise a classic table. A bookmark carrying its own
// /Title sits before the Info dictionary either way.
const zlib = require("zlib");

function hexUtf16(s) {
  let h = "FEFF";
  for (const ch of s) h += ch.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase();
  return "<" + h + ">";
}
function makePdf(o) {
  o = o || {};
  const figures = o.figures || [], pages = o.pages || 1;
  const kids = [];
  for (let i = 0; i < pages; i++) kids.push((i ? 20 + i : 3) + " 0 R");
  const k = figures.map((_, i) => (10 + i) + " 0 R").concat(o.headings ? ["19 0 R"] : []);
  const catalog = "<</Type/Catalog/Pages 2 0 R" + (o.lang ? "/Lang(" + o.lang + ")" : "") +
    (o.tagged ? "/MarkInfo<</Marked true>>/StructTreeRoot 5 0 R" : "") +
    (o.showTitle ? "/ViewerPreferences<</DisplayDocTitle true>>" : "") + (o.xmp ? "/Metadata 7 0 R" : "") + "/Outlines 6 0 R>>";
  const font = o.fonts === false ? "" : "/Resources<</Font<</F1<</Type/Font/Subtype/TrueType/BaseFont/Calibri>>>>>>";
  const info = "<<" + (o.title == null ? "" : "/Title" + (o.titleHex ? hexUtf16(o.title) : "(" + o.title + ")")) +
    (o.creator ? "/Creator(" + o.creator + ")" : "") + (o.producer ? "/Producer(" + o.producer + ")" : "") + ">>";
  const objs = []; // [num, text or {head, stream}]
  if (!o.objstm) objs.push([1, catalog]);
  objs.push([2, "<</Type/Pages/Kids[" + kids.join(" ") + "]/Count " + pages + ">>"]);
  objs.push([3, "<</Type/Page/Parent 2 0 R" + font + ">>"]);
  for (let i = 1; i < pages; i++) objs.push([20 + i, "<</Type/Page/Parent 2 0 R" + font + ">>"]);
  objs.push([6, "<</Title(Chapter One)/Parent 8 0 R>>"]);
  if (o.spanLang) objs.push([8, "<</S/Span/Lang(" + o.spanLang + ")>>"]);
  if (o.xmp) {
    const xml = '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      "<dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">" + (o.title || "") + "</rdf:li></rdf:Alt></dc:title></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end=\"w\"?>";
    objs.push([7, { head: "<</Type/Metadata/Subtype/XML/Length " + Buffer.byteLength(xml) + ">>", stream: Buffer.from(xml) }]);
  }
  objs.push([4, info]);
  if (o.tagged) {
    objs.push([5, "<</Type/StructTreeRoot" + (k.length ? "/K[" + k.join(" ") + "]" : "") + ">>"]);
    figures.forEach((alt, i) => objs.push([10 + i, "<</Type/StructElem/S/Figure/P 5 0 R" + (alt ? "/Alt(" + (typeof alt === "string" ? alt : "A chart") + ")" : "") + ">>"]));
    if (o.headings) objs.push([19, "<</Type/StructElem/S/H1/P 5 0 R>>"]);
  }
  if (o.encrypt) objs.push([30, "<</Filter/Standard/V 1/R 2/O<00>/U<00>/P -1>>"]);
  let objstm = null;
  if (o.objstm) {
    const body = Buffer.from("1 0 " + catalog, "latin1"), z = zlib.deflateSync(body);
    objstm = { head: "<</Type/ObjStm/N 1/First 4/Filter/FlateDecode/Length " + z.length + ">>", stream: z };
    objs.push([9, objstm]);
  }
  const parts = [Buffer.from("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  let pos = parts[0].length;
  const offsets = {};
  const push = (b) => { parts.push(b); pos += b.length; };
  objs.forEach(([num, body]) => {
    offsets[num] = pos;
    if (typeof body === "string") push(Buffer.from(num + " 0 obj\n" + body + "\nendobj\n", "latin1"));
    else { push(Buffer.from(num + " 0 obj\r" + body.head + "stream\r\n", "latin1")); push(body.stream); push(Buffer.from("\r\nendstream\rendobj\r", "latin1")); }
  });
  const trailerBits = "/Root 1 0 R/Info 4 0 R" + (o.encrypt ? "/Encrypt 30 0 R/ID[<01><02>]" : "");
  const max = Math.max(...Object.keys(offsets).map(Number), o.objstm ? 1 : 0);
  if (o.objstm) {
    const xnum = max + 1, xoff = pos, rows = [];
    for (let n = 0; n <= xnum; n++) {
      if (n === 1) rows.push([2, 9, 0]);
      else if (n === xnum) rows.push([1, xoff, 0]);
      else if (offsets[n] != null) rows.push([1, offsets[n], 0]);
      else rows.push([0, 0, 0]);
    }
    const data = Buffer.alloc(rows.length * 7);
    rows.forEach((r, i) => { data[i * 7] = r[0]; data.writeUInt32BE(r[1], i * 7 + 1); data.writeUInt16BE(r[2], i * 7 + 5); });
    push(Buffer.from(xnum + " 0 obj\r<</Type/XRef/Size " + (xnum + 1) + "/W[1 4 2]" + trailerBits + "/Length " + data.length + ">>stream\r\n", "latin1"));
    push(data);
    push(Buffer.from("\r\nendstream\rendobj\rstartxref\r" + xoff + "\r%%EOF\r", "latin1"));
  } else {
    const xoff = pos;
    let table = "xref\n0 " + (max + 1) + "\n";
    for (let n = 0; n <= max; n++) table += offsets[n] != null ? String(offsets[n]).padStart(10, "0") + " 00000 n \n" : "0000000000 65535 f \n";
    push(Buffer.from(table + "trailer\n<</Size " + (max + 1) + trailerBits + ">>\nstartxref\n" + xoff + "\n%%EOF\n", "latin1"));
  }
  return Buffer.concat(parts);
}
module.exports = { makePdf };
