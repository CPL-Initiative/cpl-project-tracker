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

// What the model's <main> may not carry: an outside script, any script at all, an inline handler, a frame or a form
// (the page is read-only), or a heading 1 beyond the hero's one.
export function mainProblems(main) {
  const m = String(main || ""), out = [];
  if (!/^<main\b[^>]*\bid="main"/i.test(m) || !/<\/main>\s*$/i.test(m)) out.push('it is not one <main id="main"> element');
  if (/<script\b/i.test(m)) out.push("a script");
  if (/\son[a-z]+\s*=/i.test(m)) out.push("an inline event handler");
  if (/<(iframe|object|embed|form)\b/i.test(m)) out.push("a frame, an embed or a form");
  if (/javascript:/i.test(m)) out.push("a javascript: link");
  const h1 = (m.match(/<h1\b/gi) || []).length;
  if (h1 !== 1) out.push(h1 + " level-one headings, not one");
  if (m.length > MAX_MAIN) out.push("more than " + MAX_MAIN.toLocaleString("en-US") + " characters");
  return out;
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
