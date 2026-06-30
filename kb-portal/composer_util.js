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

  // ───────────────────────── attachments ─────────────────────────
  // The composer can attach files for Claude to read during Polish. Text-bearing
  // files (txt/md/csv/json, PDF text layer, Word, Excel) are extracted to text
  // IN THE BROWSER (app.js) and folded into the prompt — this sidesteps the
  // proxy's ~256 KB request cap that base64 PDFs would blow. Images go as Claude
  // vision blocks (downscaled in app.js to fit the cap). These helpers are the
  // pure routing/shaping logic; the actual extraction + downscaling live in app.js.
  var TEXT_EXT = ["txt", "md", "markdown", "csv", "tsv", "json", "log", "yml", "yaml", "text"];

  function extOf(name) {
    var m = String(name == null ? "" : name).toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  }

  // Route a file to an extraction strategy by MIME + extension.
  function fileKind(name, mime) {
    mime = String(mime == null ? "" : mime).toLowerCase();
    var ext = extOf(name);
    if (mime.indexOf("image/") === 0 || ["png", "jpg", "jpeg", "gif", "webp"].indexOf(ext) !== -1) return "image";
    if (mime === "application/pdf" || ext === "pdf") return "pdf";
    if (mime.indexOf("wordprocessingml") !== -1 || ext === "docx") return "docx";
    if (mime.indexOf("spreadsheetml") !== -1 || mime.indexOf("ms-excel") !== -1 || ext === "xlsx" || ext === "xls") return "xlsx";
    if (mime.indexOf("text/") === 0 || mime === "application/json" || TEXT_EXT.indexOf(ext) !== -1) return "text";
    return "unknown";
  }

  // The Claude-vision media type for an image file (one of the 4 supported; png default).
  function imageMediaType(name, mime) {
    mime = String(mime == null ? "" : mime).toLowerCase();
    if (["image/png", "image/jpeg", "image/gif", "image/webp"].indexOf(mime) !== -1) return mime;
    var byExt = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
    return byExt[extOf(name)] || "image/png";
  }

  // Truncate extracted text to a char cap, appending a marker when cut.
  function extractTextCap(text, maxChars) {
    text = String(text == null ? "" : text);
    maxChars = maxChars || 150000;
    if (text.length <= maxChars) return { text: text, truncated: false };
    return { text: text.slice(0, maxChars) + "\n\n…[truncated — attachment longer than " + maxChars + " chars]", truncated: true };
  }

  // Shape the Messages API user `content` for the polish call: ONE text block (the
  // prompt + each text-extracted attachment, delimited) followed by an image block
  // per image attachment. Returns a plain string when there are no attachments
  // (keeps the no-attachment request identical to before).
  function buildPolishContent(opts) {
    opts = opts || {};
    var atts = opts.attachments || [];
    if (!atts.length) return String(opts.prompt || "");
    var textParts = [String(opts.prompt || "")];
    var blocks = [];
    for (var i = 0; i < atts.length; i++) {
      var a = atts[i] || {};
      if (a.text) {
        textParts.push("\n\n===== Attached file: " + (a.name || "untitled") + " =====\n" + a.text);
      } else if (a.image) {
        blocks.push({ type: "image", source: { type: "base64", media_type: a.mediaType || "image/png", data: a.image } });
      }
    }
    return [{ type: "text", text: textParts.join("") }].concat(blocks);
  }

  // Shape the server-side team-phrase check — the team_pass_ok() RPC on the main
  // dashboard's Supabase project (the SAME gate raci.js / mission_control.js use).
  // The phrase rides ONLY in the x-team-pass header (never the URL/body, so it is
  // not logged); the server compares it against public.team_access inside Postgres
  // and returns a boolean. The actual fetch + portal-unlock lives in app.js; this
  // pure builder keeps the URL/header contract unit-testable.
  function teamPassRequest(url, anon, phrase) {
    return {
      url: String(url || "").replace(/\/+$/, "") + "/rest/v1/rpc/team_pass_ok",
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: "Bearer " + anon,
        "Content-Type": "application/json",
        "x-team-pass": String(phrase == null ? "" : phrase).trim()
      },
      body: "{}"
    };
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
    polishPrompt: polishPrompt,
    fileKind: fileKind,
    imageMediaType: imageMediaType,
    extractTextCap: extractTextCap,
    buildPolishContent: buildPolishContent,
    teamPassRequest: teamPassRequest
  };
})(typeof window !== "undefined" ? window : globalThis);
