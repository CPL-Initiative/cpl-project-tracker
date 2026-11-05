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
    html = html.replace(o, () => n);
  });
  if (problems.length) return { error: "The draft was not stored: " + problems.join("; ") + ".", problems };
  if (html === page) return { error: "The edits change nothing.", problems };
  return { html, applied: edits.length };
}

// What a public page must still carry after the edits: the edits may change its words and
// its look, never strip the frame library_page.py built around it.
export function frameKept(before, after) {
  const marks = ["<!doctype html", "</html>", "<title>", 'name="viewport"'];
  const lost = marks.filter((m) => before.toLowerCase().includes(m.toLowerCase()) && !after.toLowerCase().includes(m.toLowerCase()));
  if (/<script[^>]*src=["']https?:/i.test(after) && !/<script[^>]*src=["']https?:/i.test(before)) lost.push("no new outside script");
  return lost;
}
