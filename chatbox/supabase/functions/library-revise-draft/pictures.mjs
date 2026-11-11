// pictures.mjs — the pictures of a Library page, shared by the edge function and its Node test.
//
// Sam, 2026-11-11, on his visual made from a deck's PDF: "the visual didn't include any of the map screenshots from
// the pdf that the user will need to know how to navigate map", then "it would be even better if you ... just
// assemble the pics together with the text from the get go". The Library tab finds a PDF's pictures in the browser
// and stores each as a row of cpl_library_pictures; the model sees them and says only WHERE each goes, with a
// marker paragraph in plain text:
//
//     <p>[[picture 3: MAP Main Menu with Settings and Users boxed in red]]</p>
//
// The model never writes an image tag (the allowlist in new_page.mjs and the frozen sources in apply_edits.mjs stand
// as they are). This file turns each marker into ONE fixed figure, built here from the stored row: the number and
// the file type come from the row, the alt text is escaped, and the address is a file beside the page (img/<n>.webp).
// scripts/library_publish.py holds the same pattern (FIGURE) and writes those files when the page is published.
//
// Plain JavaScript with no imports, so Deno (the edge function) and Node (the test) both load it.

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const MAX_PICTURES = 12;
const EXT = { "image/webp": "webp", "image/png": "png" };

// The one figure a page may carry. Anything else with a src is refused by the checks that were already there.
export const FIGURE = /<figure class="shot"><a href="img\/(\d{1,2})\.(webp|png)" target="_blank" rel="noopener"><img src="img\/\1\.\2" alt="[^"<>]*" width="\d{1,5}" height="\d{1,5}" loading="lazy"><\/a><\/figure>/g;
export function figureHtml(p, alt) {
  const ext = EXT[p.mime];
  const n = parseInt(p.n, 10), w = parseInt(p.width, 10), h = parseInt(p.height, 10);
  if (!ext || !(n >= 1 && n <= 99) || !(w > 0 && w < 100000) || !(h > 0 && h < 100000)) return "";
  const words = String(alt || p.alt || "A screen from " + (p.source_title || "the document") + (p.page ? ", page " + p.page : "")).replace(/\s+/g, " ").trim().slice(0, 300);
  return '<figure class="shot"><a href="img/' + n + "." + ext + '" target="_blank" rel="noopener"><img src="img/' + n + "." + ext +
    '" alt="' + esc(words) + '" width="' + w + '" height="' + h + '" loading="lazy"></a></figure>';
}
export function stripFigures(html) { return String(html || "").replace(FIGURE, ""); }
export function figureNumbers(html) {
  const out = []; let m; const re = new RegExp(FIGURE.source, "g");
  while ((m = re.exec(String(html || "")))) out.push(parseInt(m[1], 10));
  return out;
}

// The figure's look, added once to the page's own first style block by this code, never by the model. No address in it.
export const PICTURE_CSS_MARK = "/* library pictures */";
export const PICTURE_CSS = PICTURE_CSS_MARK +
  "\n.shot{margin:14px 0 6px;padding:0}\n.shot a{display:block}\n" +
  ".shot img{display:block;max-width:100%;height:auto;border:1px solid var(--line, currentColor);border-radius:6px}\n";

const MARKER = /<p(?: class="[A-Za-z0-9 _-]*")?>\s*\[\[picture (\d{1,2}): ([^\[\]<>]{1,400})\]\]\s*<\/p>/g;
const LOOSE = /\[\[picture[^\]]*\]\]/g;

// -> { html, placed: [n], unknown: [n] }. A marker for a picture the record does not hold, or a second marker for
// one already placed (by this draft or an earlier one), is dropped; a marker that is not a paragraph of its own is
// dropped too, so no bracketed text is ever left on a page.
export function placePictures(html, pictures) {
  const byN = {};
  (Array.isArray(pictures) ? pictures : []).forEach((p) => { if (p && !p.left_out) byN[parseInt(p.n, 10)] = p; });
  const have = {}; figureNumbers(html).forEach((n) => { have[n] = true; });
  const placed = [], unknown = [];
  let out = String(html || "").replace(MARKER, (_m, num, alt) => {
    const n = parseInt(num, 10), p = byN[n];
    if (!p) { unknown.push(n); return ""; }
    if (have[n]) return "";
    const fig = figureHtml(p, alt);
    if (!fig) { unknown.push(n); return ""; }
    have[n] = true; placed.push(n);
    return fig;
  }).replace(LOOSE, "");
  if (placed.length && out.indexOf(PICTURE_CSS_MARK) < 0) {
    const at = out.search(/<\/style>/i);
    if (at >= 0) out = out.slice(0, at) + PICTURE_CSS + out.slice(at);
  }
  return { html: out, placed, unknown };
}

// What the model is told about pictures, appended to either set of instructions when the record holds any.
export const PICTURE_RULES = `
Pictures:
- The request ends with the pictures this piece holds, each named "Picture N" with the document and page it came from. They are screens and figures cropped from the documents.
- Place a picture by writing one paragraph that holds only its marker, in exactly this form: <p>[[picture N: alt text]]</p>. Write no image tag, figure tag or address of your own; the marker is replaced with the picture.
- Put each picture right under the step or steps it shows, inside the same section, and use each at most once. Leave out a picture that shows nothing the reader needs (a logo, a background, a duplicate). A picture already on the page as a figure stays where it is unless the request asks to move or remove it; to move it, delete its figure and write its marker in the new place.
- The alt text names the screen and the control the picture points to, in one sentence: "MAP Main Menu with Settings and Users boxed in red." Never copy a person's name, email address or ID number from a picture into the alt text or the page.
- A note the source document drew beside a picture (a callout with an arrow) becomes a short numbered note under that picture, in words.
- In the summary, name every picture that shows a person's name, email address or other personal detail, by its number, so the team can cover or crop it before publishing.`;
