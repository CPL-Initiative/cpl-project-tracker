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
} from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (id) => document.getElementById(id);
const show = (view) => {
  for (const v of ["boot", "login", "portal"]) $(v).style.display = (v === view ? "" : "none");
};

// ───────────────────────────── Auth ─────────────────────────────
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  render(session);
  sb.auth.onAuthStateChange((_evt, s) => render(s));
}

function render(session) {
  if (session?.user) {
    $("session-box").style.display = "";
    $("session-email").textContent = session.user.email ?? "";
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

$("btn-signout").addEventListener("click", async () => {
  await sb.auth.signOut();
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
  if (!body) { composerStatus("Add some content first.", "error"); return; }
  if (!PROXY_URL) { composerStatus("Polish proxy not configured.", "error"); return; }
  const btn = $("composer-polish");
  btn.disabled = true;
  composerStatus("✨ Asking Claude to format your draft…", "info");
  try {
    const prompt = KBC.polishPrompt({
      title, body,
      section: $("composer-section").selectedOptions[0]?.textContent || "",
    });
    const resp = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: POLISH_MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
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
    composerStatus("✓ Formatted. Review it, then “Open in GitHub →” to commit.", "success");
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
  const ov = $("composer-overlay");
  if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) closeComposer(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ov && ov.style.display !== "none") closeComposer();
  });
  // Hide the Polish button if no proxy is configured (Copy/Download/GitHub still work).
  if (!PROXY_URL) { const p = $("composer-polish"); if (p) p.style.display = "none"; }
})();

init();
