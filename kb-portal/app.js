// CPL Knowledge Base — team portal.
//
// A branded, sign-in-gated reader over the PUBLIC knowledge base. Auth is
// Supabase magic-link (email OTP). The allowlist is enforced server-side:
// open signups are DISABLED in the Supabase project and only the two team
// members are provisioned, so `shouldCreateUser: false` below means an
// un-provisioned address (e.g. map@rccd.edu) can never complete a sign-in.
//
// The content itself is fetched from the public repo's raw URLs, so this gate
// personalizes the reading experience — it does not make public content private.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { marked }       from "https://esm.sh/marked@12.0.2";
import DOMPurify        from "https://esm.sh/dompurify@3.1.6";
import {
  SUPABASE_URL, SUPABASE_ANON, RAW_BASE, TREE_API,
  SECTIONS, TOP_LEVEL_DOCS, FALLBACK_TREE,
  REPO_OWNER, REPO_NAME, WRITE_BRANCH, PROXY_URL, POLISH_MODEL,
  TEAM_SUPABASE_URL, TEAM_SUPABASE_ANON, TEAM_PASS_KEY,
} from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (id) => document.getElementById(id);
const show = (view) => {
  for (const v of ["boot", "login", "portal"]) $(v).style.display = (v === view ? "" : "none");
};

// ───────────────────────────── Auth ─────────────────────────────
// Two ways in: a per-person magic-link sign-in (Supabase, allowlisted), OR the
// shared CPL team phrase (validated server-side against the dashboard's
// team_pass_ok() RPC). The team phrase is the SAME one that unlocks editing on
// the COBI Team & RACI tab; since kb-portal is served same-origin, an unlock done
// there carries over here via shared localStorage (no re-entry needed).
let teamUnlocked = false;

async function init() {
  // Team-phrase carry-over: trust a stored phrase only after the server confirms
  // it (a rotated/garbage phrase is dropped so we never get stuck unlocked-broken).
  teamUnlocked = await maybeTeamUnlock();
  const { data: { session } } = await sb.auth.getSession();
  render(session);
  sb.auth.onAuthStateChange((_evt, s) => render(s));
}

// Validate a phrase SERVER-SIDE (the browser can't read the secret — it asks
// Postgres "is this right?"). Returns Promise<bool>. Uses the pure request
// builder so the URL/header contract stays unit-tested.
function verifyPhrase(phrase) {
  if (!phrase || !String(phrase).trim()) return Promise.resolve(false);
  const req = window.KBComposer.teamPassRequest(TEAM_SUPABASE_URL, TEAM_SUPABASE_ANON, phrase);
  return fetch(req.url, { method: req.method, headers: req.headers, body: req.body })
    .then((r) => (r.ok ? r.json() : false))
    .then((v) => v === true)
    .catch(() => false);
}

async function maybeTeamUnlock() {
  let phrase = "";
  try { phrase = localStorage.getItem(TEAM_PASS_KEY) || ""; } catch (e) {}
  if (!phrase) return false;
  const ok = await verifyPhrase(phrase);
  if (!ok) { try { localStorage.removeItem(TEAM_PASS_KEY); } catch (e) {} }
  return ok;
}

function render(session) {
  const signedIn = !!session?.user;
  if (signedIn || teamUnlocked) {
    $("session-box").style.display = "";
    $("session-email").textContent = signedIn ? (session.user.email ?? "") : "Team access";
    show("portal");
    ensureNav();
    routeFromHash();
  } else {
    $("session-box").style.display = "none";
    show("login");
  }
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  const msg = $("login-msg");
  $("btn-send").disabled = true;
  // Same neutral message whether or not the address is authorized — never reveal
  // which emails are on the allowlist.
  const neutral = "If that address is authorized, a sign-in link is on its way. " +
                  "Check your inbox (and spam) for a link from Supabase.";
  try {
    await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
    });
  } catch (err) {
    console.debug("signInWithOtp:", err?.message || err); // not surfaced to the user
  }
  msg.textContent = neutral;
  msg.style.display = "";
  $("btn-send").disabled = false;
});

// Team-phrase unlock — an alternative to the magic link. On success, store the
// phrase in the SHARED (same-origin) localStorage key so it also unlocks the
// COBI Team & RACI tab, then render the portal (no Supabase session needed).
const teamForm = $("team-form");
if (teamForm) {
  teamForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phrase = $("team-phrase").value.trim();
    const msg = $("team-msg");
    const btn = $("btn-team");
    if (!phrase) return;
    btn.disabled = true;
    msg.style.display = "none";
    const ok = await verifyPhrase(phrase);
    if (ok) {
      try { localStorage.setItem(TEAM_PASS_KEY, phrase); } catch (err) {}
      teamUnlocked = true;
      $("team-phrase").value = "";
      render(null);
    } else {
      msg.textContent = "That team phrase doesn't match. Check with the MAP team.";
      msg.className = "status-banner error";
      msg.style.display = "";
      btn.disabled = false;
    }
  });
}

$("btn-signout").addEventListener("click", async () => {
  // Clear BOTH gates: end the magic-link session and drop the shared team phrase
  // (mirrors raci.js signOut — "sign out" locks team access everywhere).
  teamUnlocked = false;
  try { localStorage.removeItem(TEAM_PASS_KEY); } catch (e) {}
  await sb.auth.signOut();
  render(null);
  location.hash = "";
});

// ───────────────────────────── Navigation ───────────────────────
let navBuilt = false;
let docPaths = [];

async function ensureNav() {
  if (navBuilt) return;
  navBuilt = true;
  docPaths = await fetchTree();
  buildNav(docPaths);
}

async function fetchTree() {
  try {
    const res = await fetch(TREE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`tree ${res.status}`);
    const j = await res.json();
    const dirs = SECTIONS.map((s) => s.dir);
    const paths = (j.tree || [])
      .filter((n) => n.type === "blob" && n.path.endsWith(".md"))
      .map((n) => n.path)
      .filter((p) => dirs.some((d) => p.startsWith(d + "/")) || TOP_LEVEL_DOCS.includes(p));
    return paths.length ? paths : FALLBACK_TREE.slice();
  } catch (err) {
    console.debug("tree fallback:", err?.message || err);
    return FALLBACK_TREE.slice();
  }
}

const prettyTitle = (path) => {
  const base = path.split("/").pop().replace(/\.md$/, "");
  if (base.toLowerCase() === "readme") {
    const parent = path.includes("/") ? path.split("/").slice(-2, -1)[0] : "Overview";
    return parent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return base.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

function buildNav(paths) {
  const nav = $("nav");
  nav.innerHTML = "";
  for (const section of SECTIONS) {
    const inSection = paths.filter((p) => p.startsWith(section.dir + "/")).sort();
    if (!inSection.length) continue;
    nav.appendChild(navGroup(section.label, inSection));
  }
  const tops = paths.filter((p) => TOP_LEVEL_DOCS.includes(p)).sort();
  if (tops.length) nav.appendChild(navGroup("Reference", tops));
}

function navGroup(label, paths) {
  const wrap = document.createElement("div");
  wrap.className = "nav-group";
  const h = document.createElement("div");
  h.className = "nav-group-label";
  h.textContent = label;
  wrap.appendChild(h);
  for (const p of paths) {
    const a = document.createElement("a");
    a.className = "nav-link";
    a.href = "#doc=" + encodeURIComponent(p);
    a.textContent = prettyTitle(p);
    a.dataset.path = p;
    wrap.appendChild(a);
  }
  return wrap;
}

$("nav-filter").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  for (const a of document.querySelectorAll(".nav-link")) {
    a.style.display = a.textContent.toLowerCase().includes(q) ? "" : "none";
  }
  for (const g of document.querySelectorAll(".nav-group")) {
    const any = [...g.querySelectorAll(".nav-link")].some((a) => a.style.display !== "none");
    g.style.display = any ? "" : "none";
  }
});

// ───────────────────────────── Doc routing + render ─────────────
window.addEventListener("hashchange", routeFromHash);

function routeFromHash() {
  const m = location.hash.match(/doc=([^&]+)/);
  if (!m) return; // keep the welcome panel
  const path = decodeURIComponent(m[1]);
  loadDoc(path);
}

async function loadDoc(path) {
  const docEl = $("doc");
  const metaEl = $("doc-meta");
  markActive(path);
  docEl.innerHTML = `<p class="muted">Loading ${prettyTitle(path)}…</p>`;
  metaEl.innerHTML = "";
  try {
    const res = await fetch(`${RAW_BASE}/${path}`);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    let md = await res.text();
    md = stripFrontmatter(md);
    const html = DOMPurify.sanitize(marked.parse(md));
    docEl.innerHTML = html;
    rewriteLinks(docEl, path);
    metaEl.innerHTML =
      `<a class="src-link" href="https://github.com/CPL-Initiative/cpl-knowledge-base/blob/main/${path}" ` +
      `target="_blank" rel="noopener">View source on GitHub ↗</a>`;
    docEl.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  } catch (err) {
    docEl.innerHTML = `<div class="status-banner error">Couldn't load <code>${path}</code> (${err.message}).</div>`;
  }
}

function stripFrontmatter(md) {
  if (md.startsWith("---")) {
    const end = md.indexOf("\n---", 3);
    if (end !== -1) {
      const nl = md.indexOf("\n", end + 1);
      return md.slice(nl === -1 ? md.length : nl + 1).replace(/^\s+/, "");
    }
  }
  return md;
}

// Keep cross-document .md links inside the portal; resolve them relative to the
// current doc. External links are left to open normally (in a new tab).
function rewriteLinks(root, currentPath) {
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (/^https?:|^mailto:|^#/.test(href)) {
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
      continue;
    }
    if (href.endsWith(".md")) {
      const resolved = resolvePath(currentPath, href.split("#")[0]);
      a.setAttribute("href", "#doc=" + encodeURIComponent(resolved));
    }
  }
}

function resolvePath(fromPath, rel) {
  const stack = fromPath.split("/").slice(0, -1);
  for (const part of rel.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function markActive(path) {
  for (const a of document.querySelectorAll(".nav-link")) {
    a.classList.toggle("active", a.dataset.path === path);
  }
}

// ───────────────────────────── New-doc composer ─────────────────────
// Sign-in-gated authoring panel: draft → (optional) Claude polish → GitHub
// "create new file" deep-link. No write token in the client — the author commits
// as themselves on GitHub. Pure string/Markdown/URL logic lives in
// window.KBComposer (composer_util.js) so it stays unit-testable.
const KBC = window.KBComposer;
let filenameTouched = false;

// ── attachments: extract text (or downscale images) in-browser, feed to Polish ──
// Extractor libs are dynamic-imported from esm.sh ONLY when a matching file is
// attached, so they never weigh on initial load. Each extraction is wrapped so one
// bad file degrades to an error chip rather than breaking the composer.
const ATT_LIB = {
  pdf:       "https://esm.sh/pdfjs-dist@4.7.76/build/pdf.min.mjs",
  pdfWorker: "https://esm.sh/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs",
  mammoth:   "https://esm.sh/mammoth@1.8.0",
  xlsx:      "https://esm.sh/xlsx@0.18.5",
};
let attachId = 0;
const attachments = [];

async function extractFileText(file, kind) {
  if (kind === "text") return (await file.text()).trim();
  if (kind === "pdf") {
    const pdfjs = await import(ATT_LIB.pdf);
    try { pdfjs.GlobalWorkerOptions.workerSrc = ATT_LIB.pdfWorker; } catch (e) {}
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent();
      out += tc.items.map((it) => it.str).join(" ") + "\n\n";
    }
    return out.trim();
  }
  if (kind === "docx") {
    const mod = await import(ATT_LIB.mammoth);
    const mammoth = mod.default || mod;
    const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return ((res && res.value) || "").trim();
  }
  if (kind === "xlsx") {
    const mod = await import(ATT_LIB.xlsx);
    const XLSX = mod.default || mod;
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return wb.SheetNames.map((n) => "## " + n + "\n" + XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n").trim();
  }
  return "";
}

// Downscale + re-encode an image as JPEG until its base64 fits the per-image budget
// (the proxy caps the whole request at ~256 KB). Returns null if it can't fit.
async function downscaleImage(file, targetB64Bytes) {
  targetB64Bytes = targetB64Bytes || 110000;
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = dataUrl;
  });
  let maxEdge = 1400, quality = 0.8;
  for (let attempt = 0; attempt < 7; attempt++) {
    const scale = Math.min(1, maxEdge / Math.max(img.width || 1, img.height || 1));
    const w = Math.max(1, Math.round((img.width || 1) * scale));
    const h = Math.max(1, Math.round((img.height || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    const b64 = (canvas.toDataURL("image/jpeg", quality).split(",")[1]) || "";
    if (b64.length <= targetB64Bytes) return { data: b64, mediaType: "image/jpeg" };
    if (quality > 0.5) quality -= 0.15; else maxEdge = Math.round(maxEdge * 0.8);
  }
  return null;
}

function renderAttachments() {
  const list = $("composer-attach-list");
  if (!list) return;
  list.innerHTML = "";
  const ICON = { image: "🖼", pdf: "📄", docx: "📝", xlsx: "📊", text: "📃", unknown: "❔" };
  for (const a of attachments) {
    const chip = document.createElement("span");
    chip.className = "composer-chip composer-chip-" + a.status;
    chip.appendChild(document.createTextNode(
      (ICON[a.kind] || "📎") + " " + a.name +
      (a.status === "extracting" ? " …" : a.note ? " (" + a.note + ")" : "")
    ));
    const x = document.createElement("button");
    x.type = "button"; x.className = "composer-chip-x"; x.textContent = "✕";
    x.setAttribute("aria-label", "Remove " + a.name);
    x.addEventListener("click", () => {
      const i = attachments.indexOf(a); if (i >= 0) attachments.splice(i, 1); renderAttachments();
    });
    chip.appendChild(x);
    list.appendChild(chip);
  }
}

async function addFiles(fileList) {
  for (const file of Array.from(fileList || [])) {
    const kind = KBC.fileKind(file.name, file.type);
    const rec = { id: ++attachId, name: file.name, kind, status: "extracting" };
    attachments.push(rec);
    renderAttachments();
    try {
      if (kind === "unknown") {
        rec.status = "error"; rec.note = "unsupported type";
      } else if (kind === "image") {
        const r = await downscaleImage(file);
        if (!r) { rec.status = "error"; rec.note = "image too large to fit"; }
        else { rec.image = r.data; rec.mediaType = r.mediaType; rec.status = "ready"; }
      } else {
        const raw = await extractFileText(file, kind);
        if (!raw) { rec.status = "error"; rec.note = kind === "pdf" ? "no text (scanned PDF?)" : "no text found"; }
        else { const c = KBC.extractTextCap(raw); rec.text = c.text; rec.status = "ready"; if (c.truncated) rec.note = "truncated to fit"; }
      }
    } catch (err) {
      rec.status = "error"; rec.note = String((err && err.message) || "extract failed").slice(0, 50);
    }
    renderAttachments();
  }
}

function composerStatus(msg, kind) {
  const el = $("composer-status");
  if (!el) return;
  if (!msg) { el.style.display = "none"; return; }
  el.className = "status-banner " + (kind || "info");
  el.textContent = msg;
  el.style.display = "";
}

function populateComposerSections() {
  const sel = $("composer-section");
  if (!sel || sel.options.length) return;
  for (const s of SECTIONS) {
    const o = document.createElement("option");
    o.value = s.dir; o.textContent = s.label;
    sel.appendChild(o);
  }
  const top = document.createElement("option");
  top.value = ""; top.textContent = "Top level (no folder)";
  sel.appendChild(top);
}

function syncFilename() {
  if (filenameTouched) return;
  const t = $("composer-doc-title").value.trim();
  $("composer-filename").value = t ? KBC.slugify(t) + ".md" : "";
}

function currentDocPath() {
  const raw = $("composer-filename").value.trim() || $("composer-doc-title").value.trim();
  return KBC.docPath($("composer-section").value, KBC.slugify(raw.replace(/\.md$/i, "")));
}

function currentMarkdown() {
  return KBC.composeMarkdown({
    title: $("composer-doc-title").value.trim() || "Untitled",
    body: $("composer-body").value,
  });
}

function openComposer() {
  populateComposerSections();
  composerStatus("");
  $("composer-overlay").style.display = "";
  $("composer-doc-title").focus();
}
function closeComposer() { $("composer-overlay").style.display = "none"; }

async function polishWithClaude() {
  const title = $("composer-doc-title").value.trim();
  const body = $("composer-body").value.trim();
  const ready = attachments.filter((a) => a.status === "ready");
  if (!body && !ready.length) { composerStatus("Add some content or an attachment first.", "error"); return; }
  if (attachments.some((a) => a.status === "extracting")) { composerStatus("Still reading an attachment — try again in a moment.", "info"); return; }
  if (!PROXY_URL) { composerStatus("Polish proxy not configured.", "error"); return; }
  const btn = $("composer-polish");
  btn.disabled = true;
  composerStatus("✨ Asking Claude to format your draft" + (ready.length ? " + " + ready.length + " attachment(s)" : "") + "…", "info");
  try {
    const prompt = KBC.polishPrompt({
      title, body,
      section: $("composer-section").selectedOptions[0]?.textContent || "",
    });
    let content = KBC.buildPolishContent({ prompt, attachments: ready });
    const reqBody = () => JSON.stringify({ model: POLISH_MODEL, max_tokens: 8000, messages: [{ role: "user", content }] });
    // The proxy caps the request at ~256 KB. If attachments push us over, drop
    // images first (biggest), then trim the text block — never silently exceed.
    const CAP = 240000;
    let droppedImgs = 0;
    if (Array.isArray(content)) {
      while (reqBody().length > CAP) {
        let imgIdx = -1;
        for (let i = content.length - 1; i >= 0; i--) { if (content[i].type === "image") { imgIdx = i; break; } }
        if (imgIdx !== -1) { content.splice(imgIdx, 1); droppedImgs++; continue; }
        if (content[0] && content[0].text && content[0].text.length > 6000) {
          content[0].text = content[0].text.slice(0, content[0].text.length - 20000) + "\n…[trimmed to fit the size limit]";
          continue;
        }
        break;
      }
      if (droppedImgs) composerStatus("⚠ Dropped " + droppedImgs + " image(s) to fit the size limit; formatting the rest…", "info");
    }
    const resp = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: reqBody(),
    });
    if (!resp.ok) throw new Error("proxy " + resp.status + ": " + (await resp.text()).slice(0, 160));
    const json = await resp.json();
    const text = json?.content?.[0]?.text;
    if (!text) throw new Error("unexpected response shape");
    $("composer-body").value = KBC.stripCodeFences(text);
    // If the author left the title blank, adopt the one Claude wrote into the frontmatter.
    if (!title) {
      const m = $("composer-body").value.match(/^title:\s*(.+)$/m);
      if (m) { $("composer-doc-title").value = m[1].trim(); syncFilename(); }
    }
    composerStatus("✓ Formatted from your draft" + (ready.length ? " + attachment(s)" : "") + ". Review it, then “Open in GitHub →” to commit.", "success");
  } catch (err) {
    composerStatus("Couldn't reach the formatter (" + (err.message || err) + "). You can still commit your draft as-is.", "error");
  } finally {
    btn.disabled = false;
  }
}

function copyMarkdown(silent) {
  const md = currentMarkdown();
  if (!navigator.clipboard) { composerStatus("Clipboard unavailable — use Download .md instead.", "error"); return; }
  navigator.clipboard.writeText(md).then(
    () => { if (!silent) composerStatus("Markdown copied to clipboard.", "success"); },
    () => composerStatus("Couldn't copy — select the text manually or use Download.", "error")
  );
}

function downloadMarkdown() {
  const path = currentDocPath();
  const blob = new Blob([currentMarkdown()], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = path.split("/").pop();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  composerStatus("Downloaded " + a.download + ".", "success");
}

function openInGitHub() {
  if (!$("composer-doc-title").value.trim() && !$("composer-body").value.trim()) {
    composerStatus("Add a title and some content first.", "error");
    return;
  }
  const path = currentDocPath();
  const { url, prefilled } = KBC.githubNewFileUrl({
    owner: REPO_OWNER, repo: REPO_NAME, branch: WRITE_BRANCH,
    path, content: currentMarkdown(),
  });
  window.open(url, "_blank", "noopener");
  if (prefilled) {
    composerStatus("Opened GitHub with " + path + " prefilled — commit there (directly or as a PR).", "success");
  } else {
    copyMarkdown(true);
    composerStatus("Draft is long, so GitHub opened with just the path (" + path + "). Your Markdown is copied — paste it into the editor.", "info");
  }
}

(function wireComposer() {
  const on = (id, evt, fn) => { const el = $(id); if (el) el.addEventListener(evt, fn); };
  on("btn-new-doc", "click", openComposer);
  on("composer-close", "click", closeComposer);
  on("composer-doc-title", "input", syncFilename);
  on("composer-filename", "input", () => { filenameTouched = true; });
  on("composer-polish", "click", polishWithClaude);
  on("composer-github", "click", openInGitHub);
  on("composer-copy", "click", () => copyMarkdown(false));
  on("composer-download", "click", downloadMarkdown);
  on("composer-files", "change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  const ov = $("composer-overlay");
  if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) closeComposer(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ov && ov.style.display !== "none") closeComposer();
  });
  // Hide the Polish button if no proxy is configured (Copy/Download/GitHub still work).
  if (!PROXY_URL) { const p = $("composer-polish"); if (p) p.style.display = "none"; }
})();

init();
