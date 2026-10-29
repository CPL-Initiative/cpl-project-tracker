// A small PDF built for the remediation tests: the parts a PDF's accessibility rests on
// (the Info dictionary, the catalog's language, tags and title display, fonts), laid out
// the way Office writes them when `objstm` is set: the catalog compressed in an object
// stream, a bookmark carrying its own /Title before the Info dictionary.
const zlib = require("zlib");

function hexUtf16(s) {
  let h = "FEFF";
  for (const ch of s) h += ch.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase();
  return "<" + h + ">";
}
function makePdf(o) {
  o = o || {};
  const catalog = "<</Type/Catalog/Pages 2 0 R" + (o.lang ? "/Lang(" + o.lang + ")" : "") +
    (o.tagged ? "/MarkInfo<</Marked true>>/StructTreeRoot 5 0 R" : "") +
    (o.showTitle ? "/ViewerPreferences<</DisplayDocTitle true>>" : "") + "/Outlines 6 0 R>>";
  const font = o.fonts === false ? "" : "/Resources<</Font<</F1<</Type/Font/Subtype/TrueType/BaseFont/Calibri>>>>>>";
  const info = "<<" + (o.title == null ? "" : "/Title" + (o.titleHex ? hexUtf16(o.title) : "(" + o.title + ")")) +
    (o.creator ? "/Creator(" + o.creator + ")" : "") + (o.producer ? "/Producer(" + o.producer + ")" : "") + ">>";
  const parts = ["%PDF-1.7\n%\xE2\xE3\xCF\xD3\n"];
  if (o.objstm) {
    const body = Buffer.from("1 0 " + catalog, "latin1");
    const z = zlib.deflateSync(body);
    parts.push(Buffer.from("9 0 obj\r<</Type/ObjStm/N 1/First 4/Filter/FlateDecode/Length " + z.length + ">>stream\r\n", "latin1"), z, Buffer.from("\r\nendstream\rendobj\r", "latin1"));
  } else {
    parts.push("1 0 obj\n" + catalog + "\nendobj\n");
  }
  parts.push("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");
  parts.push("3 0 obj\n<</Type/Page/Parent 2 0 R" + font + ">>\nendobj\n");
  parts.push("6 0 obj\n<</Title(Chapter One)/Parent 7 0 R>>\nendobj\n");
  if (o.spanLang) parts.push("8 0 obj\n<</S/Span/Lang(" + o.spanLang + ")>>\nendobj\n");
  parts.push("4 0 obj\n" + info + "\nendobj\n");
  if (o.tagged) parts.push("5 0 obj\n<</Type/StructTreeRoot>>\nendobj\n");
  parts.push("trailer\n<</Root 1 0 R/Info 4 0 R>>\n%%EOF\n");
  return Buffer.concat(parts.map(function (p) { return Buffer.isBuffer(p) ? p : Buffer.from(p, "latin1"); }));
}
module.exports = { makePdf };
