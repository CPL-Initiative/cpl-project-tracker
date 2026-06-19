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

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
