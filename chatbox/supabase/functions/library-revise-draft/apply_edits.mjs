// apply_edits.mjs — the one pure step of library-revise-draft, shared with its Node test.
//
// The model answers with edits, never a whole page: each edit names an exact passage of
// the current page (`old`) and what replaces it (`new`). Every `old` must occur exactly
// once, or the draft is refused and nothing is stored, so a revision changes only what
// the notes asked for and every other byte of the public page stays as it is.
//
// Plain JavaScript with no imports, so Deno (the edge function) and Node (the test) both
// load it.

const MAX_EDITS = 60;
const MAX_EDIT_CHARS = 20000;

// Pull the JSON object out of the model's text: it is told to answer with JSON alone, but
// a stray fence or a sentence before it should not lose the answer.
export function parseAnswer(text) {
  const s = String(text || "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return { error: "The model did not answer with JSON." };
  let o;
  try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return { error: "The model's JSON did not parse." }; }
  if (!o || !Array.isArray(o.edits)) return { error: "The model's answer has no edits list." };
  return { edits: o.edits, summary: typeof o.summary === "string" ? o.summary.slice(0, 1500) : "" };
}

function count(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n += 1; i += needle.length; }
  return n;
}

// -> { html, applied } or { error, problems }. Edits apply in order, each to the page as the
// edits before it left it; all or none.
export function applyEdits(page, edits) {
  const problems = [];
  if (!Array.isArray(edits) || !edits.length) return { error: "The model proposed no change.", problems };
  if (edits.length > MAX_EDITS) return { error: "The model proposed " + edits.length + " edits; at most " + MAX_EDITS + ".", problems };
  let html = String(page);
  edits.forEach((e, i) => {
    const o = e && typeof e.old === "string" ? e.old : "";
    const n = e && typeof e.new === "string" ? e.new : null;
    if (!o) { problems.push("edit " + (i + 1) + " names no passage"); return; }
    if (n === null) { problems.push("edit " + (i + 1) + " has no replacement"); return; }
    if (o.length > MAX_EDIT_CHARS || n.length > MAX_EDIT_CHARS) { problems.push("edit " + (i + 1) + " is too long"); return; }
    const c = count(html, o);
    if (c !== 1) { problems.push("edit " + (i + 1) + "'s passage occurs " + c + " times, not once"); return; }
    const risky = addedRisks(o, n);
    if (risky.length) { problems.push("edit " + (i + 1) + " adds " + risky.join(" and ")); return; }
    html = html.replace(o, () => n);
  });
  if (problems.length) return { error: "The draft was not stored: " + problems.join("; ") + ".", problems };
  if (html === page) return { error: "The edits change nothing.", problems };
  // Edits apply one after another, so two of them could build a tag between them: the whole page is counted too.
  const whole = addedRisks(page, html);
  if (whole.length) return { error: "The draft was not stored: the edits together add " + whole.join(" and ") + ".", problems: whole };
  return { html, applied: edits.length };
}

// What an edit may not add (COBIx on #3077, 2026-11-10): the revision path stores the model's new text as it comes,
// and a published page shares the tracker's origin, so an edit steered by a pasted document could add script. The page
// already carries its own theme line, Ask Sierra and styles, so the test is a count: an edit whose new text carries more
// of any risky construct than the passage it replaces is refused. library_publish.py runs the same count on the whole
// page against the public copy before it writes a revision.
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", colon: ":", tab: "\t", newline: "\n", sol: "/" };
function decode(v) {
  return String(v).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);?/gi, (m, e) => {
    if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isFinite(n) ? String.fromCodePoint(n) : ""; }
    return Object.prototype.hasOwnProperty.call(NAMED, e.toLowerCase()) ? NAMED[e.toLowerCase()] : m;
  }).replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
}
export const RISKS = {
  "a script": /<script\b/gi,
  "an event handler": /[\s\/"']on[a-z]+\s*=/gi,
  "a frame, object, embed, form, meta, base, link, style, svg or math element": /<(iframe|frame|object|embed|form|meta|base|link|style|svg|math|template)\b/gi,
  "a srcdoc or style attribute": /[\s\/"'](srcdoc|style)\s*=/gi,
  "a CSS url( or @import": /url\s*\(|@import\b/gi,
};
export function riskCounts(html) {
  const s = String(html || ""), out = {};
  Object.keys(RISKS).forEach((k) => { out[k] = (s.match(RISKS[k]) || []).length; });
  // A link or source whose scheme is not http(s), mailto, tel or a fragment, read after decoding entities.
  out["a javascript:, data: or vbscript: address"] = (s.match(/(href|src|action|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi) || [])
    .filter((a) => /^(javascript|data|vbscript):/i.test(decode(a.replace(/^[^=]*=\s*/, "").replace(/^["']|["']$/g, "")))).length;
  return out;
}
// The page's executable parts are frozen (COBIx's third note on #3077): a count let an edit rewrite the code inside an
// existing script, or repoint sidebar.js at another host. Every script block, every risky element's opening tag, every
// on…= handler and every src, srcdoc, action, formaction or xlink:href attribute is pulled out of the page, and the
// edited page may hold only pieces the page already had, string for string (a sub-multiset). Styles may change (a
// layout edit is ordinary and CSS runs no code), but no edit may add a url( or an @import, which reach another host.
const PIECES = [
  /<script\b[\s\S]*?(?:<\/script\s*>|$)/gi,
  /<(?:iframe|frame|object|embed|form|meta|base|link|svg|math|template)\b[^>]*>/gi,
  /[\s\/"']on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
  /[\s\/"'](?:src|srcdoc|action|formaction|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
];
export function frozenPieces(html) {
  const s = String(html || ""), out = [];
  PIECES.forEach((re) => { (s.match(re) || []).forEach((m) => out.push(m.replace(/^[\s\/"']/, ""))); });
  return out;
}
export function newPieces(before, after) {
  const have = {};
  frozenPieces(before).forEach((p) => { have[p] = (have[p] || 0) + 1; });
  return frozenPieces(after).filter((p) => { if (have[p]) { have[p] -= 1; return false; } return true; });
}
export function addedRisks(before, after) {
  const b = riskCounts(before), a = riskCounts(after);
  const out = Object.keys(a).filter((k) => a[k] > (b[k] || 0));
  if (newPieces(before, after).length && !out.length) out.push("a change to a script, handler or source the page already had (a session makes that change: Copy the request)");
  return out;
}

// What a public page must still carry after the edits: the edits may change its words and
// its look, never strip the frame library_page.py built around it.
export function frameKept(before, after) {
  const marks = ["<!doctype html", "</html>", "<title>", 'name="viewport"'];
  const lost = marks.filter((m) => before.toLowerCase().includes(m.toLowerCase()) && !after.toLowerCase().includes(m.toLowerCase()));
  if (/<script[^>]*src=["']https?:/i.test(after) && !/<script[^>]*src=["']https?:/i.test(before)) lost.push("no new outside script");
  return lost;
}
