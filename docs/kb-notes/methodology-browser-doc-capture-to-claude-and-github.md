---
title: In-browser doc capture → Claude → tokenless GitHub write
created: 2026-06-19
updated: 2026-06-19
tags: [methodology, claude-proxy, github-deeplink, file-extraction, vision, kb-portal]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb_portal_lessons]]"
artifacts:
  - kb-portal/composer_util.js
  - kb-portal/app.js
  - cloudflare-worker-proxy.js
---

# In-browser doc capture → Claude → tokenless GitHub write

> A static, public-ish web app can let a user author a repo document — capture
> notes/files, have Claude format them, and commit — **without holding any write
> token and without a backend**, by extracting attachments in the browser,
> reusing an origin-gated Claude proxy, and committing via a GitHub
> *create-new-file* deep-link under the user's own identity.

## Context

The KB-portal composer (Session 63, PRs #466/#468) turns a draft + uploaded
files into a Knowledge-Base Markdown doc and commits it to the **public**
`cpl-knowledge-base`. The portal is a static bundle behind a thin "front door"
auth — not a place to put a GitHub write credential. See `[[docs/kb_portal_lessons]]`.

## The claim

Three moves compose into a no-backend, no-secret authoring pipeline:

### 1. Tokenless write via a GitHub create-new-file deep-link
`https://github.com/{owner}/{repo}/new/{branch}?filename={path}&value={content}`
opens GitHub's editor **prefilled**; the user commits as themselves (direct or
PR). The write happens under *their* GitHub identity — the app never holds a
token, so the write side is as safe as a public read. **Cap the prefill** (~6 KB):
`value` in a URL gets truncated by the browser/GitHub on long docs, so when the
content exceeds the cap, emit a filename-only link + Copy/Download and have the
user paste. (Tier-1 posture; a one-click commit needs a server-side token — Tier 2.)

### 2. Extract attachments to TEXT in the browser to dodge the proxy body cap
A shared LLM proxy typically caps the request body (ours: 262144 bytes). A base64
PDF/document block blows it. Instead, extract the **text layer** client-side and
send text: `file.text()` for text/MD/CSV/JSON, **pdf.js** for PDFs, **mammoth**
for `.docx`, **SheetJS** for `.xlsx` (sheet→CSV) — all lazy-imported from esm.sh
*only when a matching file is attached*. Text fits with room to spare; the
document-block path (and its cap problem) is avoided entirely. Scanned/image-only
PDFs (no text layer) and unsupported files degrade to a clear per-file error —
wrap each extraction so one bad file never breaks the composer.

### 3. Images → downscale client-side → Claude vision blocks
Send images as `{type:"image",source:{type:"base64",media_type,data}}`
(media_type ∈ png/jpeg/gif/webp). Re-encode to JPEG on a `<canvas>`, shrinking
edge + quality in a loop until the base64 fits a per-image budget (~110 KB), so a
screenshot fits under the proxy cap. Assemble the user message as ONE text block
(prompt + each extracted text, delimited) followed by the image blocks. Add a
**total-size guard**: if the assembled request still exceeds the cap, drop images
(largest first), then trim text — never silently exceed, and tell the user.

## How we got here

PRs #466 (composer + deep-link) and #468 (attachments). The proxy cap is
`cloudflare-worker-proxy.js`'s `body.length > 262144` guard. The image/PDF block
shapes were confirmed against the Claude Messages API reference. Pure assembly
(`fileKind` / `imageMediaType` / `extractTextCap` / `buildPolishContent`) lives in
`composer_util.js` and is unit-tested; the browser-only extraction/downscale live
in `app.js`.

## When this applies (and when it doesn't)

- Applies to **public** content authoring from a static/low-trust front end —
  the tokenless-write + browser-extraction combo is what makes it safe + backendless.
- The tokenless deep-link is for users who hold their **own** GitHub write access.
  For arbitrary end users, you need a server-side token (Tier 2) or a PR-from-fork
  flow.
- Browser text-extraction only recovers a PDF's **text layer** — scanned/image PDFs
  need the vision path (and then the proxy cap bites; raise it server-side or chunk).
- Don't route **private** material through a public-content proxy/repo.

## See also

- `[[docs/kb_portal_lessons]]` — the workstream
- `[[docs/kb-notes/playbook-embed-auth-gated-bundle-as-dashboard-tab]]` — the tab it lives in
- PRs `#466` (composer) · `#468` (attachments)

---

*Authoring check: durable, reusable (any static-app → repo authoring surface),
distilled (one pipeline), self-contained.*
