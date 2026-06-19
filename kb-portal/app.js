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

init();
