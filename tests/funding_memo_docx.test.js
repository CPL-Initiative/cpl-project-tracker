// tests/funding_memo_docx.test.js
//
// The memo's Word export (Sam, 2026-10-22): "When I download using the Word
// doc link, the format does not hold up--line breaks don't work on many of the
// paragraphs and the style shifts to a different Word style that's not right."
//
// The export reads the document as the browser holds it after inline edits:
// Chrome writes a new line as a <div>, Shift+Enter as a <br>, and a field's
// label as a <span> beside its text. The old walk split a label from its text
// into two paragraphs, dropped every <br> outside a <p>, and left Word's own
// heading styles in place. Guards: a typed line stays its own paragraph, a <br>
// stays a break, a label stays on its line, and the file carries the memo's
// styles (font, navy headings, masthead, numbered lists, table header).
//
// The CO's memo format (Sam, 2026-11-03: "output a memo matching the formatting
// of the attached ESS memo", ESLEI 24-12, filed in CPLBrain's
// 04-projects/cpl-initiative/resources/memo-format/): the logo at the left with
// MEMORANDUM, the date and the memo's number at the right; TO, FROM and RE
// labels in gray beside their text after a tab, one addressee a line; a gray
// rule; Source Sans Pro 11 pt gray body, navy 12 pt headings with no rule;
// bullets half an inch in; the office's address in the first page's footer;
// the RE line and the date atop later pages; "Memorandum | Page N of M".
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "funding-model", "memo", "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/memo/" });
const w = dom.window, doc = w.document;
w.CPL_FUNDING_NO_REMOTE = true;
w.scrollTo = function () {};
["cpl_funding_data.js", "college_short_names.js", "cpl_funding.js"].forEach(function (f) {
  w.eval(fs.readFileSync(path.join(ROOT, f), "utf8"));
});
w.docx = require(path.join(ROOT, "docx.min.js"));
const T = w.CPL_FUNDING_TAB;

// One entry out of a .docx (a zip), read with node's own inflate.
function unzipEntry(buf, name) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  let p = buf.readUInt32LE(eocd + 16);
  const n = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42), fname = buf.toString("utf8", p + 46, p + 46 + nlen);
    if (fname === name) {
      const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const raw = buf.subarray(start, start + csize);
      return (method === 8 ? zlib.inflateRawSync(raw) : raw).toString("utf8");
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}
// The visible text of each <w:p>, with a break written as "\n".
function paragraphs(xml) {
  return (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(function (p) {
    return (p.match(/<w:t[ >][^<]*<\/w:t>|<w:br\/>/g) || []).map(function (t) {
      return t === "<w:br/>" ? "\n" : t.replace(/<[^>]+>/g, "");
    }).join("").replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"');
  });
}

(async function () {
  const memo = doc.createElement("div");
  memo.id = "cplFundMemo";
  memo.innerHTML = T._buildMemo("memo") +
    // What Chrome leaves after typing into the document:
    "<div>A line typed after the cc, its own paragraph.</div>" +
    "<div>First half<br>second half after Shift+Enter.</div>" +
    "<div><br></div>" +
    "<p>Pasted <span style=\"font-weight: bold;\">bold words</span> and <em>italic words</em> " +
    "with a <a href=\"https://map.rccd.edu/\">link</a>.</p>" +
    "<ol><li>First step</li><li>Second step</li></ol>";
  doc.body.appendChild(memo);

  const logo = fs.readFileSync(path.join(ROOT, "ccc_memo_logo.jpg"));
  const buf = Buffer.from(await w.docx.Packer.toBuffer(T._memoDocxDocument(memo, logo)));
  if (process.env.MEMO_DOCX_OUT) fs.writeFileSync(process.env.MEMO_DOCX_OUT, buf);
  const body = unzipEntry(buf, "word/document.xml");
  const styles = unzipEntry(buf, "word/styles.xml");
  check("the export builds a Word file", !!body && !!styles);
  const paras = paragraphs(body || "");

  check("a field's label stays on the line with its text, a tab between, one addressee a line",
    paras.some(function (t) { return /^TO:Chief Executive Officers\nChief Instructional Officers\n/.test(t); }) &&
    !paras.includes("TO:") && /TO:<\/w:t><\/w:r><w:r><w:tab\/><\/w:r>/.test(body));
  check("the head: MEMORANDUM, the date, then the memo's number on its own line",
    paras.includes("MEMORANDUM") && paras.some(function (t) { return /^ESS __-__ \| Via Email$/.test(t); }) &&
    paras.indexOf("MEMORANDUM") < paras.findIndex(function (t) { return /^ESS __-__/.test(t); }));
  check("the head's table has no borders and the logo is in it", /<w:tbl>[\s\S]*?<w:drawing>[\s\S]*?MEMORANDUM/.test(body) &&
    /<w:tblBorders>[\s\S]*?<w:top w:val="none"/.test(body));
  check("a line typed as a <div> is its own paragraph", paras.includes("A line typed after the cc, its own paragraph."));
  check("a Shift+Enter break inside a <div> survives", paras.includes("First half\nsecond half after Shift+Enter."));
  check("an empty typed line stays a blank line", paras.includes(""));
  check("inline formatting stays inside one paragraph",
    paras.includes("Pasted bold words and italic words with a link."));
  check("bold and italic carry over", /<w:b\/>[\s\S]*?bold words/.test(body) && /<w:i\/>[\s\S]*?italic words/.test(body));
  check("a link stays a link", /<w:hyperlink /.test(body));
  check("a numbered list is numbered, not bulleted",
    /<w:numId w:val="\d+"\/>[\s\S]*?First step/.test(body) && /memo-ol|w:numFmt w:val="decimal"/.test(unzipEntry(buf, "word/numbering.xml") || ""));
  check("no paragraph starts or ends in stray spaces",
    paras.every(function (t) { return t === t.trim() || /\n/.test(t); }));

  check("the memo's font is the CO's, Source Sans Pro 11 pt in its gray",
    /<w:docDefaults>[\s\S]*?<w:color w:val="555759"\/>[\s\S]*?<w:sz w:val="22"\/>[\s\S]*?w:ascii="Source Sans Pro"/.test(styles));
  check("a heading is navy 12 pt with no rule under it",
    /w:styleId="Heading2"[\s\S]*?<w:sz w:val="24"\/>[\s\S]*?<\/w:style>/.test(styles) &&
    !/w:styleId="Heading2"(?:(?!<\/w:style>)[\s\S])*<w:pBdr>/.test(styles));
  check("a label is bold in the body's gray, not navy",
    !/<w:color w:val="002F6D"\/>(?:(?!<\/w:r>)[\s\S])*<w:t[^>]*>(TO|FROM|RE):<\/w:t>/.test(body));
  const numbering = unzipEntry(buf, "word/numbering.xml") || "";
  check("bullets sit half an inch in, their text three quarters",
    /w:numFmt w:val="bullet"[\s\S]*?<w:ind w:left="1080" w:hanging="360"\/>/.test(numbering));
  const footers = [1, 2, 3].map(function (n) { return unzipEntry(buf, "word/footer" + n + ".xml") || ""; }).join("");
  const headers = [1, 2, 3].map(function (n) { return unzipEntry(buf, "word/header" + n + ".xml") || ""; }).join("");
  check("the first page differs from the rest", /<w:titlePg\/>/.test(body));
  check("the first page's footer carries the office's address",
    /Chancellor&apos;s Office, Academic Affairs[\s\S]*?1102 Q Street, Sacramento, CA 95811 \| 916\.445\.8752 \| www\.cccco\.edu/.test(footers));
  check("later pages carry Memorandum | Page N of M", /Memorandum \| Page [\s\S]*?PAGE[\s\S]*? of [\s\S]*?NUMPAGES/.test(footers));
  check("later pages carry the RE line and the date at their head", /Implementation Funding/.test(headers) && /\d{4}/.test(headers));
  check("a letter page with 1-inch margins",
    /<w:pgSz w:w="12240" w:h="15840"/.test(body) && /<w:pgMar [^>]*w:left="1440"[^>]*w:right="1440"|<w:pgMar [^>]*w:right="1440"[^>]*w:left="1440"/.test(body));
  check("headings carry the memo's navy, not Word's theme",
    /w:styleId="Heading1"[\s\S]*?<w:color w:val="002F6D"\/>/.test(styles) &&
    /w:styleId="Heading2"[\s\S]*?<w:color w:val="002F6D"\/>/.test(styles));
  check("the fields and cc have their own styles, and the memo carries no centered masthead",
    /w:pStyle w:val="MemoField"/.test(body) && /w:pStyle w:val="MemoCc"/.test(body) && !/w:pStyle w:val="MemoMasthead"/.test(body));
  check("the allocation table's header row is navy", /<w:shd [^>]*w:fill="002F6D"/.test(body) && /<w:tblHeader\/>/.test(body));
  check("paragraphs are spaced the way the memo is", /<w:spacing [^>]*w:after="160"/.test(styles));
  // What a screen reader and Word's accessibility checker read (2026-10-26): the
  // document's language, a title in its properties, real heading styles, a header
  // row Word repeats, and no picture without its text.
  const core = unzipEntry(buf, "docProps/core.xml") || "";
  check("the document's language is set (en-US, in the defaults every run inherits)",
    /<w:rPrDefault>[\s\S]*?<w:lang w:val="en-US"\/>[\s\S]*?<\/w:rPrDefault>/.test(styles));
  check("the file carries a title in its core properties", /<dc:title>[^<]*\S[^<]*<\/dc:title>/.test(core));
  check("headings use Word's Heading 1 and Heading 2 styles",
    /<w:pStyle w:val="Heading1"\/>[\s\S]*?MEMORANDUM/.test(body) && /<w:pStyle w:val="Heading2"\/>/.test(body));
  check("the logo is in the file with its alternative text",
    (body.match(/<wp:docPr [^>]*>/g) || []).length >= 1 &&
    (body.match(/<wp:docPr [^>]*>/g) || []).every(function (p) { return /descr="[^"]+"/.test(p); }));
  // The screen and the printed PDF: the same layout, and the page furniture.
  check("the document's head carries the logo with its alternative text",
    /<img class="memo-logo" src="[^"]*ccc_memo_logo\.jpg" alt="California Community Colleges">/.test(T._buildMemo("memo")));
  const pcss = T._memoPageCss(memo);
  check("a printed memo numbers its pages and puts the address in the first page's footer",
    /counter\(pages\)/.test(pcss) && /@page:first\{[\s\S]*?@bottom-left\{content:"Chancellor's Office, Academic Affairs\\A 1102 Q Street/.test(pcss));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch(function (e) { console.error(e); process.exit(1); });
