// library-revise-draft — revise a public Library visual from its card, with no session.
//
// Sam, 2026-11-05 (SkyBarnard, in session), on SkyMice's plan for "revising a visual from the
// Library card without a session": "Build it." A teammate types what to change on the card
// (Revise and remediate sets refresh_note, sources and regen) and presses Draft it now. The
// page sends the record's id here. This function:
//
//   1. reads the record with the caller's own credentials (the team phrase or a reviewer
//      sign-in), so cpl_library's policies decide what it may see;
//   2. reads the piece's public copy from GitHub Pages (library/<slug>/), the page the
//      revision starts from; a piece with no Pages copy is refused, a session revises it;
//   3. asks Claude for EDITS to that page (an exact passage and its replacement, each
//      occurring once), never a whole page, and applies them (apply_edits.mjs), so every
//      byte the notes did not ask about stays as it is;
//   4. stores the draft in cpl_library_drafts and sets regen.ready_at and regen.draft_id on
//      the record, both with the caller's credentials, so the history trigger files the
//      prior row (Rule 10 a2).
//
// It publishes nothing. The public copy changes only when a person presses Replace the
// public copy on the card (or asked for it at once), and the library-publish workflow then
// writes the draft to library/<slug>/index.html and moves the record (scripts/library_publish.py).
//
// The documents a teammate pasted travel to the Anthropic API for the one call; the tab's
// help already says never a student's record. A linked document is named to the model, not
// fetched.
//
// Auth: the team phrase (x-team-pass) or a reviewer sign-in (bearer), as alt-text-draft.
// Deployed with verify_jwt off; the check is here. Secrets used (project-wide):
// ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY. LIBRARY_REVISE_MODEL overrides the model.
// Governance: kb/governance_surface_map.json, function:library-revise-draft.

import { applyEdits, frameKept, parseAnswer } from "./apply_edits.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hvuwhnbuahrtptokpqfh.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const MODEL = Deno.env.get("LIBRARY_REVISE_MODEL") || "claude-opus-5-5";
const PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/";
const MAX_PAGE = 400_000;          // characters of the public page
const MAX_SOURCES = 60_000;        // characters of pasted documents, all together
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-team-pass",
};
const JSON_HEADERS = { ...CORS, "content-type": "application/json" };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

// The caller's one credential, passed on to the database the way the browser sends it.
function credential(req: Request): Record<string, string> | null {
  const pass = (req.headers.get("x-team-pass") || "").trim();
  if (pass && pass.length <= 200) return { Authorization: `Bearer ${ANON}`, "x-team-pass": pass };
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "");
  const bearer = m ? m[1] : "";
  if (bearer && bearer !== ANON && bearer.split(".").length === 3) return { Authorization: `Bearer ${bearer}` };
  return null;
}

async function rest(path: string, cred: Record<string, string>, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: ANON, "content-type": "application/json", Prefer: "return=representation", ...cred, ...(init.headers || {}) },
  });
}

async function allowed(cred: Record<string, string>): Promise<boolean> {
  const fn = cred["x-team-pass"] ? "team_pass_ok" : "is_allowed_reviewer";
  const r = await rest(`rpc/${fn}`, cred, { method: "POST", body: "{}" }).catch(() => null);
  return !!r && r.ok && (await r.json().catch(() => false)) === true;
}

const INSTRUCTIONS = `You revise one public page of the CPL Library, the California Community Colleges Chancellor's Office's collection of visuals about Credit for Prior Learning (CPL). You receive the page's full HTML as it is published, the changes a teammate asked for, and any documents they pasted.

Answer with JSON alone, no fence and no preface:
{"edits":[{"old":"<an exact passage of the page>","new":"<what replaces it>"}],"summary":"<two or three plain sentences: what you changed, and anything asked for that you did not change and why>"}

Rules for the edits:
- Each "old" is copied character for character from the page and occurs in it exactly once. Make it long enough to be unique, and no longer than it needs to be.
- Change only what the request asks for, and what that change makes necessary elsewhere on the page (a heading that names a changed figure, a total that follows from it).
- Keep the page's structure: the public header, the theme script, the Ask Sierra chip, the styles' tokens, every heading level, every alt text and aria label. Add no outside script.
- Never invent a figure, a date, a name or a link. A number comes from the request or a pasted document, stated there; if a change needs a figure you were not given, leave the passage as it stands and say so in the summary.
- Write as the Chancellor's Office writes: plain words, active voice, the student as the subject, American spelling. The program is the CPL Initiative; the platform is the MAP platform (Mapping Articulated Pathways). No emoji, no business words (leverage, utilize, robust).
- Never copy a person's email address, phone number or ID number from a pasted document onto the page.
- Keep the page accessible: text you add sits in the same elements and classes as the text around it, so its contrast and sizes follow.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const cred = ANON ? credential(req) : null;
  if (!cred || !(await allowed(cred))) return reply(401, { error: "The team phrase or a reviewer sign-in is needed to draft a revision." });

  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: "The request was not JSON." }); }
  const id = String(body?.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "Send the record's id." });
  const by = String(body?.by || "").trim().slice(0, 120);
  if (!by) return reply(400, { error: "Add your name, so the record says who asked for the draft." });

  const got = await rest(`cpl_library?id=eq.${id}&select=id,slug,title,url,version,refresh_note,sources,regen,public_listed`, cred);
  if (!got.ok) return reply(502, { error: "The record could not be read (" + got.status + ")." });
  const r = (await got.json())[0];
  if (!r) return reply(404, { error: "No such record." });
  const g = r.regen && typeof r.regen === "object" ? r.regen : null;
  if (!g || !g.requested_at) return reply(409, { error: "Ask for the revision first: Revise and remediate, with what to change." });
  if (g.ready_at) return reply(409, { error: "A draft is already on the card. Ask for more changes to start a new one." });
  const pasted = (Array.isArray(r.sources) ? r.sources : []).filter((x: any) => x && !x.url && x.text);
  const linked = (Array.isArray(r.sources) ? r.sources : []).filter((x: any) => x && x.url);
  if (!r.refresh_note && !pasted.length) return reply(409, { error: "Say what to change, or paste a document to work from, before drafting." });
  if (!SLUG.test(r.slug || "")) return reply(409, { error: "The record's slug is not a Pages address." });

  const pageUrl = PAGES + r.slug + "/";
  const pr = await fetch(pageUrl).catch(() => null);
  if (!pr || !pr.ok) return reply(409, { error: "This piece has no public copy on GitHub Pages to revise from, so a session revises it: Copy the request." });
  const page = await pr.text();
  if (page.length > MAX_PAGE) return reply(413, { error: "The page is too large to revise here; a session revises it." });

  let docs = "";
  for (const x of pasted) {
    const room = MAX_SOURCES - docs.length;
    if (room <= 0) break;
    docs += `\n--- ${String(x.title || "A pasted document").slice(0, 200)} ---\n` + String(x.text).slice(0, room) + "\n";
  }
  const ask = `The page (${pageUrl}):\n<page>\n${page}\n</page>\n\n` +
    `Changes asked for by ${g.requested_by || "the team"}:\n${r.refresh_note || "None typed: bring the page in line with the documents below."}\n` +
    (docs ? `\nDocuments pasted to work from:${docs}` : "") +
    (linked.length ? `\nDocuments linked on the card, not opened here: ${linked.map((x: any) => x.title || x.url).join("; ")}. Say in the summary if the change needs one of them.\n` : "") +
    "\nAnswer with the JSON.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "", "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 16000, system: INSTRUCTIONS, messages: [{ role: "user", content: ask }] }),
  }).catch(() => null);
  if (!res || !res.ok) {
    const t = res ? await res.text().catch(() => "") : "";
    console.error("library-revise-draft: model call failed", res?.status, t.slice(0, 300));
    return reply(502, { error: "The model did not answer" + (res ? " (" + res.status + ")" : "") + ". Try again in a minute." });
  }
  const out = await res.json();
  const text = (out?.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  const ans = parseAnswer(text);
  if (ans.error) return reply(502, { error: ans.error + " Try again." });
  const done = applyEdits(page, ans.edits);
  if (done.error) return reply(422, { error: done.error, summary: ans.summary });
  const lost = frameKept(page, done.html);
  if (lost.length) return reply(422, { error: "The draft was not stored: it dropped " + lost.join(", ") + ".", summary: ans.summary });

  const ins = await rest("cpl_library_drafts", cred, {
    method: "POST",
    body: JSON.stringify({
      library_id: r.id, slug: r.slug, html: done.html, based_on: pageUrl, made_by: by, model: MODEL,
      summary: ans.summary || null, edits: done.applied,
      request: { refresh_note: r.refresh_note || null, sources: pasted.map((x: any) => x.title || "pasted").concat(linked.map((x: any) => x.title || x.url)), regen: g },
    }),
  });
  if (!ins.ok) return reply(502, { error: "The draft could not be stored (" + ins.status + ")." });
  const draft = (await ins.json())[0];

  const regen = { ...g, ready_at: new Date().toISOString(), draft_id: draft.id, draft_url: null, drafted_by: by, drafted_with: "library-revise-draft" };
  const up = await rest(`cpl_library?id=eq.${id}`, cred, { method: "PATCH", body: JSON.stringify({ regen, updated_by: by }) });
  if (!up.ok) return reply(502, { error: "The draft is stored, but the card could not be updated (" + up.status + ")." });
  return reply(200, { draft_id: draft.id, summary: ans.summary, edits: done.applied, replaces_now: g.publish === "replace", model: MODEL, usage: out?.usage || null });
});
