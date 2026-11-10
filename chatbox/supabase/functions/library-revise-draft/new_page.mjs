// new_page.mjs — the pure steps of library-revise-draft's new-piece mode, shared with its Node test.
//
// Sam, 2026-11-09: "I haven't been able to successfully create a doc from there yet--always need some sort of out
// side intervention"; 2026-11-10: "use the attached as a test to see if you can get it to work from within the
// library all the way to posting in the public library." A Requested piece has no page yet, so its first draft
// starts from a STARTER: a public Library page in the public library's look (its header, theme line, styles, foot
// and Ask Sierra chip). The model writes only what is new (the title, the description, the page's <main> and
// the foot's publication line); everything else is the starter's, byte for byte, so the frame cannot be lost.
//
// Plain JavaScript with no imports, so Deno (the edge function) and Node (the test) both load it.

export const STARTER_SLUG = "noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5";
const MAX_MAIN = 60000;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The model's answer: {"title","description","main","published","summary"}.
export function parseNewAnswer(text) {
  const s = String(text || "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return { error: "The model did not answer with JSON." };
  let o;
  try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return { error: "The model's JSON did not parse." }; }
  if (!o || typeof o.main !== "string" || !o.main.trim()) return { error: "The model's answer has no page." };
  return {
    title: String(o.title || "").trim().slice(0, 200), description: String(o.description || "").trim().slice(0, 400),
    main: o.main.trim(), published: String(o.published || "").trim().slice(0, 300),
    summary: typeof o.summary === "string" ? o.summary.slice(0, 1500) : "",
  };
}

// What the model's <main> may carry: an ALLOWLIST (COBIx on #3077, 2026-11-10: a denylist let <svg/onload>,
// <img/src=x/onerror>, an entity-encoded javascript: link, <meta refresh>, <base> and data: links through). The draft is
// built from pasted documents and Google files, so a prompt injection in one can steer the model; anything outside the
// list refuses the draft. The same list runs again in scripts/library_publish.py before a new piece is written.
export const ALLOWED_TAGS = ["main", "div", "section", "h1", "h2", "h3", "h4", "p", "ol", "ul", "li", "a", "strong", "em", "span", "br", "b", "i"];
const VOID = { br: true };
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", colon: ":", tab: "\t", newline: "\n", sol: "/", lpar: "(", rpar: ")", period: "." };
export function decodeEntities(v) {
  return String(v).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);?/gi, (m, e) => {
    if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isFinite(n) ? String.fromCodePoint(n) : ""; }
    return Object.prototype.hasOwnProperty.call(NAMED, e.toLowerCase()) ? NAMED[e.toLowerCase()] : m;
  });
}
function attrProblems(tag, attrs) {
  const out = [], re = /\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"<>]*)"/y;
  let at = 0, m;
  const s = String(attrs || "").replace(/\s*\/?\s*$/, "");
  while (at < s.length) {
    re.lastIndex = at; m = re.exec(s);
    if (!m) { out.push("<" + tag + "> with an attribute that is not name=\"value\""); return out; }
    at = re.lastIndex;
    const name = m[1].toLowerCase(), val = m[2];
    const plain = decodeEntities(val).replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
    if (name === "class" || name === "id") { if (!/^[A-Za-z0-9 _-]*$/.test(val)) out.push("a " + name + " outside letters, digits and dashes"); }
    else if (/^aria-[a-z]+$/.test(name)) { /* text only; quoted, no markup */ }
    else if (name === "href" && tag === "a") { if (!/^(https:\/\/|mailto:)/i.test(plain)) out.push("a link that is not https: or mailto:"); }
    else if (name === "target" && tag === "a") { if (val !== "_blank") out.push("a target other than _blank"); }
    else if (name === "rel" && tag === "a") { if (!/^[a-z ]+$/.test(val)) out.push("an odd rel"); }
    else out.push("the attribute " + name + " on <" + tag + ">");
  }
  return out;
}
export function mainProblems(main) {
  const m = String(main || ""), out = [];
  if (!/^<main\b[^>]*\bid="main"/i.test(m) || !/<\/main>\s*$/i.test(m)) out.push('it is not one <main id="main"> element');
  if (m.length > MAX_MAIN) out.push("more than " + MAX_MAIN.toLocaleString("en-US") + " characters");
  const stack = [];
  let i = 0;
  while (i < m.length) {
    const lt = m.indexOf("<", i);
    const text = m.slice(i, lt < 0 ? m.length : lt);
    if (text.indexOf(">") >= 0) { out.push("a stray >"); break; }
    if (lt < 0) break;
    const gt = m.indexOf(">", lt);
    if (gt < 0) { out.push("an unclosed tag"); break; }
    const tag = m.slice(lt, gt + 1);
    i = gt + 1;
    const t = /^<(\/?)([a-z][a-z0-9]*)((?:\s[^<>]*)?)>$/.exec(tag);
    if (!t) { out.push("markup that is not a plain tag (" + tag.slice(0, 40) + ")"); continue; }
    const name = t[2];
    if (ALLOWED_TAGS.indexOf(name) < 0) { out.push("the tag <" + name + ">"); continue; }
    if (t[1]) {
      if (t[3].trim()) out.push("a closing tag with attributes");
      if (stack.pop() !== name) out.push("tags that do not nest");
      continue;
    }
    attrProblems(name, t[3]).forEach((p) => out.push(p));
    if (!VOID[name] && !/\/\s*$/.test(t[3])) stack.push(name);
  }
  if (stack.length) out.push("tags left open");
  const h1 = (m.match(/<h1\b/gi) || []).length;
  if (h1 !== 1) out.push(h1 + " level-one headings, not one");
  return Array.from(new Set(out)).slice(0, 8);
}

// A Google Docs, Slides or Sheets link, as the address of its plain-text export (Sam, 2026-11-10: "google slides").
// Only a file shared as "Anyone with the link" answers; a private one answers with Google's sign-in page, which the
// function names to the model as not opened. Only docs.google.com is ever fetched, built from the file's id.
export function googleExport(url) {
  const u = String(url || "");
  const m = /^https:\/\/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([A-Za-z0-9_-]{20,})/.exec(u);
  if (!m) return null;
  const base = "https://docs.google.com/" + m[1] + "/d/" + m[2];
  if (m[1] === "document") return base + "/export?format=txt";
  if (m[1] === "presentation") return base + "/export/txt";
  const gid = /[#&?]gid=(\d+)/.exec(u);
  return base + "/export?format=csv" + (gid ? "&gid=" + gid[1] : "");
}

// The new page: the starter with its title, description, slug comment, body comment, <main> and publication line
// replaced. -> { html } or { error }.
export function buildNewPage(starter, slug, ans) {
  const s = String(starter || "");
  const i = s.search(/<main\b[^>]*\bid="main"/i), j = s.lastIndexOf("</main>");
  if (i < 0 || j < i) return { error: "The starter page has no <main id=\"main\">." };
  const bad = mainProblems(ans.main);
  if (bad.length) return { error: "The draft was not stored: the page carried " + bad.join(", ") + "." };
  if (!ans.title) return { error: "The draft was not stored: it has no title." };
  let html = s.slice(0, i) + ans.main + s.slice(j + "</main>".length);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => "<title>" + esc(ans.title) + "</title>");
  html = html.replace(/<meta name="description" content="[^"]*">/i, () => '<meta name="description" content="' + esc(ans.description || ans.title) + '">');
  html = html.split(STARTER_SLUG).join(slug);
  // The starter's own note at the top of its body names its brief and its source; a new piece has neither.
  html = html.replace(/(<body[^>]*>\s*)<!--[\s\S]*?-->\s*/i, (_m, b) => b +
    "<!-- " + esc(ans.title).replace(/--/g, "-") + ": drafted on its Library card by library-revise-draft (new-piece mode) from the starter page " +
    STARTER_SLUG + "'s frame. Revise it on its card. -->\n");
  if (ans.published) {
    html = html.replace(/(<footer class="foot"><div class="foot-in">\s*<p>)[\s\S]*?(<\/p>)/i, (_m, a, b) => a + esc(ans.published) + b);
  }
  return { html };
}
