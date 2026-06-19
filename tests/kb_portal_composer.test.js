// CPL Knowledge Base portal — "New doc" composer pure-helper guards.
//
// kb-portal/composer_util.js is a classic script that attaches window.KBComposer
// (globalThis.KBComposer in Node). These guard the Tier-1 composer's failure modes:
//   - slugify produces safe, repo-friendly file slugs,
//   - composeMarkdown emits the KB frontmatter convention + an H1, and is
//     IDEMPOTENT when the body already has frontmatter (the Claude-polished path —
//     must never double-stamp frontmatter),
//   - docPath joins section + slug (and the top-level "" case),
//   - githubNewFileUrl targets owner/repo/branch + encodes filename/value, and
//     DROPS value past the prefill cap (the long-doc fallback — guards the subtle
//     URL-truncation failure mode that would silently lose the body),
//   - stripCodeFences unwraps a ```-fenced model reply,
//   - polishPrompt pins the frontmatter contract + the "don't invent facts" guard.
//
// Run from repo root: `npm test` (or `node tests/kb_portal_composer.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const src = fs.readFileSync("kb-portal/composer_util.js", "utf8");
(0, eval)(src); // indirect eval → runs in global scope → attaches globalThis.KBComposer
const K = globalThis.KBComposer;

check("KBComposer is exposed", K && typeof K.composeMarkdown === "function");

// ── slugify ──
check("slugify lowercases + dashes", K.slugify("Faculty Coordinator Playbook") === "faculty-coordinator-playbook");
check("slugify strips punctuation + accents", K.slugify("  Réré: A/B Test!! ") === "rere-a-b-test");
check("slugify empty/punct-only -> untitled", K.slugify("") === "untitled" && K.slugify("***") === "untitled");

// ── composeMarkdown (raw path) ──
const md = K.composeMarkdown({ title: "Veteran Intake", body: "Some notes here.", date: "2026-06-19" });
check("composeMarkdown opens with frontmatter", md.startsWith("---\n"));
check("composeMarkdown carries the KB frontmatter keys",
  /title: Veteran Intake/.test(md) && /status: draft/.test(md) &&
  /last_updated: 2026-06-19/.test(md) && /license: CC BY 4\.0/.test(md));
check("composeMarkdown adds an H1 from the title", /\n# Veteran Intake\n/.test(md));
check("composeMarkdown keeps the body", md.includes("Some notes here."));
check("composeMarkdown ends with one trailing newline", md.endsWith("\n") && !md.endsWith("\n\n"));

// ── composeMarkdown (polished path: body already has frontmatter) ──
const polished = "---\ntitle: X\nstatus: draft\nlast_updated: 2026-06-19\nlicense: CC BY 4.0\n---\n\n# X\n\nBody.";
const md2 = K.composeMarkdown({ title: "ignored", body: polished });
check("composeMarkdown is idempotent when body already has frontmatter", md2.trim() === polished.trim());
check("composeMarkdown does NOT double the frontmatter", (md2.match(/^---$/gm) || []).length === 2);

// ── stripCodeFences / fenced polished reply ──
const fenced = "```markdown\n---\ntitle: Y\n---\n\n# Y\n\nHi.\n```";
check("stripCodeFences unwraps a fenced reply", !K.stripCodeFences(fenced).startsWith("```"));
check("composeMarkdown handles a fenced polished reply",
  K.composeMarkdown({ title: "z", body: fenced }).startsWith("---\ntitle: Y"));

// ── docPath ──
check("docPath joins section + slug", K.docPath("methodology", "foo") === "methodology/foo.md");
check("docPath keeps an existing .md", K.docPath("research", "bar.md") === "research/bar.md");
check("docPath top-level (no folder)", K.docPath("", "glossary-notes") === "glossary-notes.md");

// ── githubNewFileUrl ──
const small = K.githubNewFileUrl({
  owner: "CPL-Initiative", repo: "cpl-knowledge-base", branch: "main",
  path: "methodology/foo.md", content: "# hi",
});
check("githubNewFileUrl targets the create-new-file route on the right repo+branch",
  small.url.startsWith("https://github.com/CPL-Initiative/cpl-knowledge-base/new/main?filename="));
check("githubNewFileUrl encodes the filename (slash -> %2F)", small.url.includes("filename=methodology%2Ffoo.md"));
check("githubNewFileUrl prefills value when small", small.prefilled === true && /[?&]value=/.test(small.url));
const big = K.githubNewFileUrl({ owner: "o", repo: "r", path: "x.md", content: "x".repeat(7000), maxPrefill: 6000 });
check("githubNewFileUrl DROPS value past the prefill cap (long-doc fallback)",
  big.prefilled === false && !/[?&]value=/.test(big.url));

// ── polishPrompt ──
const pp = K.polishPrompt({ title: "T", section: "Methodology", body: "draft text", date: "2026-06-19" });
check("polishPrompt pins the frontmatter contract", /last_updated: 2026-06-19/.test(pp) && /license: CC BY 4\.0/.test(pp));
check("polishPrompt carries the don't-invent-facts guard", /do NOT invent/i.test(pp));
check("polishPrompt includes the author draft + section", pp.includes("draft text") && pp.includes("Methodology"));

// ── attachments: fileKind routing ──
check("fileKind: image by mime", K.fileKind("shot", "image/png") === "image");
check("fileKind: image by ext", K.fileKind("photo.JPG", "") === "image");
check("fileKind: pdf", K.fileKind("memo.pdf", "application/pdf") === "pdf");
check("fileKind: docx", K.fileKind("brief.docx", "") === "docx");
check("fileKind: xlsx", K.fileKind("data.xlsx", "") === "xlsx" && K.fileKind("old.xls", "") === "xlsx");
check("fileKind: text (md/csv/json/mime)",
  K.fileKind("notes.md", "") === "text" && K.fileKind("t.csv", "") === "text" &&
  K.fileKind("x.json", "application/json") === "text" && K.fileKind("r", "text/plain") === "text");
check("fileKind: unknown", K.fileKind("a.zip", "application/zip") === "unknown");

// ── imageMediaType ──
check("imageMediaType: jpg -> image/jpeg", K.imageMediaType("p.jpg", "") === "image/jpeg");
check("imageMediaType: png default for odd ext", K.imageMediaType("p.bmp", "") === "image/png");
check("imageMediaType: passthrough supported mime", K.imageMediaType("x", "image/webp") === "image/webp");

// ── extractTextCap ──
check("extractTextCap: under cap untouched", K.extractTextCap("hello", 100).text === "hello" && K.extractTextCap("hello", 100).truncated === false);
const capped = K.extractTextCap("x".repeat(50), 10);
check("extractTextCap: over cap truncated + marked", capped.truncated === true && capped.text.startsWith("xxxxxxxxxx") && /truncated/.test(capped.text));

// ── buildPolishContent ──
check("buildPolishContent: no attachments -> plain string", K.buildPolishContent({ prompt: "P", attachments: [] }) === "P");
const cText = K.buildPolishContent({ prompt: "PROMPT", attachments: [{ name: "n.md", text: "BODY" }] });
check("buildPolishContent: text attachment folds into one text block",
  Array.isArray(cText) && cText.length === 1 && cText[0].type === "text" &&
  cText[0].text.indexOf("PROMPT") === 0 && /Attached file: n\.md/.test(cText[0].text) && cText[0].text.indexOf("BODY") !== -1);
const cImg = K.buildPolishContent({ prompt: "P", attachments: [{ name: "i.png", image: "AAAA", mediaType: "image/jpeg" }] });
check("buildPolishContent: image -> base64 image block with media_type",
  Array.isArray(cImg) && cImg.length === 2 && cImg[1].type === "image" &&
  cImg[1].source.type === "base64" && cImg[1].source.media_type === "image/jpeg" && cImg[1].source.data === "AAAA");
const cMix = K.buildPolishContent({ prompt: "P", attachments: [{ name: "a.md", text: "T" }, { name: "b.png", image: "ZZ", mediaType: "image/png" }] });
check("buildPolishContent: mixed -> text block then image block", cMix.length === 2 && cMix[0].type === "text" && /T/.test(cMix[0].text) && cMix[1].type === "image");

// ── portal shell: back-to-tracker link ──
// The portal runs inside the dashboard's iframe; the back link MUST target _top so
// it navigates the whole tab, not the iframe (which would nest the dashboard inside
// itself). Guard that subtle invariant + the right href.
const idxHtml = fs.readFileSync("kb-portal/index.html", "utf8");
const backTag = (idxHtml.match(/<a[^>]*id="back-to-tracker"[^>]*>/) || [])[0] || "";
check("portal has a back-to-tracker link", !!backTag);
check('back-to-tracker uses target="_top" (escapes the iframe)', /target="_top"/.test(backTag));
check("back-to-tracker points at the project tracker",
  /href="https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/"/.test(backTag));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
