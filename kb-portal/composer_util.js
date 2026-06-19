// CPL Knowledge Base portal — "New doc" composer: pure helpers.
//
// A CLASSIC (non-module) script so it (a) is available to app.js — an ES module —
// via window.KBComposer, and (b) can be unit-tested in plain Node (it attaches to
// the global). NO DOM, NO network: just the string / Markdown / URL logic behind
// the "✍️ New doc" composer.
//
// The composer is a CONVENIENCE capture tool, not a write service: it produces a
// Markdown file + a GitHub "create new file" deep-link, and the author commits as
// THEMSELVES on GitHub (commit-direct or open-a-PR). No write token ever lives in
// this public-ish static app — that's the whole security posture (Tier 1).
(function (root) {
  "use strict";

  // "Faculty Coordinator Playbook!" -> "faculty-coordinator-playbook"
  function slugify(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFKD").replace(/[̀-ͯ]/g, "") // strip accents (combining marks)
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "untitled";
  }

  function todayISO(d) {
    d = d || new Date();
    var mo = String(d.getMonth() + 1).padStart(2, "0");
    var da = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mo + "-" + da;
  }

  // Strip a leading ```lang / trailing ``` fence the model sometimes wraps output in.
  function stripCodeFences(text) {
    var t = String(text == null ? "" : text).trim();
    var m = t.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```$/);
    return m ? m[1].trim() : t;
  }

  function hasFrontmatter(md) {
    return /^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/.test(String(md == null ? "" : md));
  }

  // KB-convention YAML frontmatter (matches the authored KB docs:
  // title / status / last_updated / license).
  function frontmatter(opts) {
    opts = opts || {};
    var title = String(opts.title || "Untitled").replace(/\s+/g, " ").trim();
    return [
      "---",
      "title: " + title,
      "status: " + (opts.status || "draft"),
      "last_updated: " + (opts.date || todayISO()),
      "license: CC BY 4.0",
      "---",
      ""
    ].join("\n");
  }

  // Assemble the final Markdown file. If the body already carries frontmatter
  // (e.g. Claude-polished output), it's used as-is; otherwise prepend frontmatter
  // + an H1 (unless the body already opens with one).
  function composeMarkdown(opts) {
    opts = opts || {};
    var body = stripCodeFences(opts.body || "").trim();
    if (hasFrontmatter(body)) return body.replace(/\s*$/, "") + "\n";
    var title = String(opts.title || "Untitled").trim();
    var h1 = /^#\s+/.test(body) ? "" : ("# " + title + "\n\n");
    return frontmatter({ title: title, date: opts.date, status: opts.status }) +
      "\n" + h1 + body.replace(/\s*$/, "") + "\n";
  }

  // section dir + slug -> "methodology/foo.md" (top-level "" -> "foo.md").
  function docPath(sectionDir, slug) {
    var s = String(slug || "untitled");
    if (!/\.md$/i.test(s)) s += ".md";
    sectionDir = String(sectionDir || "").replace(/\/+$/, "");
    return sectionDir ? sectionDir + "/" + s : s;
  }

  // GitHub "create new file" deep-link with the editor prefilled. The author lands
  // in GitHub's own editor (authenticated as themselves) and chooses commit-direct
  // or open-a-PR. `value` (file body) is omitted when it exceeds maxPrefill — very
  // long URLs get truncated by the browser/GitHub, so we fall back to a
  // filename-only link + Copy/Download. Returns { url, prefilled }.
  function githubNewFileUrl(opts) {
    opts = opts || {};
    var owner = opts.owner, repo = opts.repo, branch = opts.branch || "main";
    var path = opts.path || "untitled.md";
    var content = String(opts.content || "");
    var maxPrefill = opts.maxPrefill == null ? 6000 : opts.maxPrefill;
    var base = "https://github.com/" + owner + "/" + repo + "/new/" +
      encodeURIComponent(branch) + "?filename=" + encodeURIComponent(path);
    if (content.length <= maxPrefill) {
      return { url: base + "&value=" + encodeURIComponent(content), prefilled: true };
    }
    return { url: base, prefilled: false };
  }

  // The single user-message prompt sent to Claude (via the dashboard's shared
  // Cloudflare Worker proxy) to format a draft into a KB Markdown file.
  function polishPrompt(opts) {
    opts = opts || {};
    var date = opts.date || todayISO();
    return [
      "You are formatting a document for the PUBLIC CPL (Credit for Prior Learning)",
      "Knowledge Base — a curated, CC BY 4.0 repository for the California Community",
      "Colleges MAP initiative. Convert the author's draft into ONE clean, well-",
      "structured Markdown file.",
      "",
      "Requirements:",
      "- Begin with a YAML frontmatter block delimited by --- lines, EXACTLY these keys:",
      "    title: <a clear Title Case title>",
      "    status: draft",
      "    last_updated: " + date,
      "    license: CC BY 4.0",
      "- Then a single H1 ('# ') matching the title.",
      "- Then the body as clean Markdown: logical '##' section headings, tasteful",
      "  lists/tables, corrected typos and spacing. PRESERVE all of the author's facts,",
      "  numbers, and meaning.",
      "- Do NOT invent facts, figures, citations, quotations, or links the author did",
      "  not provide.",
      "- Output ONLY the raw Markdown file content. No code fences, no commentary",
      "  before or after.",
      "",
      "Target KB section: " + (opts.section || "(unspecified)"),
      "Proposed title: " + (opts.title || "(none given — propose one)"),
      "",
      "--- AUTHOR DRAFT BELOW ---",
      String(opts.body || "")
    ].join("\n");
  }

  root.KBComposer = {
    slugify: slugify,
    todayISO: todayISO,
    stripCodeFences: stripCodeFences,
    hasFrontmatter: hasFrontmatter,
    frontmatter: frontmatter,
    composeMarkdown: composeMarkdown,
    docPath: docPath,
    githubNewFileUrl: githubNewFileUrl,
    polishPrompt: polishPrompt
  };
})(typeof window !== "undefined" ? window : globalThis);
