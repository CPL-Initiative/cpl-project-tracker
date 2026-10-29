// slide-script-draft — a draft of one slide's speaker script, for the Library's remediation.
//
// Sam, 2026-10-29: "can you add a prompt once someone uploads a ppt for revision or
// remediation ... to ask if they have notes that they want to preserve and the option for
// you to add a script below or replacing their notes?" The Library tab's Remediate
// (library_remediate.js) reads a deck in the browser; when the person chooses a script
// below their notes or in their place, the page sends each slide's words here, one slide
// at a time: the deck's title, the slide's number, its title, its words top to bottom, its
// pictures' alt text, and the notes it already holds. This asks Claude for the script and
// returns it. The person reads each one before the page writes it into the notes.
//
// It READS NO TABLE AND WRITES NOTHING, and keeps nothing: the words go to the Anthropic
// API for the one call and are not logged here. The page tells the person never to use it
// on a deck that shows a student's record; the instructions below also forbid copying any
// person's email or ID number.
//
// Auth: the team phrase (x-team-pass, checked by team_pass_ok()) or a reviewer sign-in
// (a bearer checked by is_allowed_reviewer()), as alt-text-draft checks it, so the public
// anon key never spends the model budget. Deployed with verify_jwt off; the check is here.
//
// Source of record is the LIVE function; this file is the in-repo capture.
// Version 1 (S518, 2026-10-29). Secrets used (already set project-wide): ANTHROPIC_API_KEY,
// SUPABASE_URL, SUPABASE_ANON_KEY. SCRIPT_MODEL, else ALT_TEXT_MODEL, overrides the model.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hvuwhnbuahrtptokpqfh.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const MODEL = Deno.env.get("SCRIPT_MODEL") || Deno.env.get("ALT_TEXT_MODEL") || "claude-sonnet-5";
const MAX_WORDS = 4000;   // characters of the slide's words
const MAX_NOTES = 4000;   // characters of the notes it already holds

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-team-pass",
};
const JSON_HEADERS = { ...CORS, "content-type": "application/json" };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

// Who is asking: the team phrase or a reviewer sign-in, asked of the database the way a
// browser would ask it (the anon key plus the one credential header).
async function allowed(req: Request): Promise<boolean> {
  if (!ANON) return false;
  const rpc = (fn: string, headers: Record<string, string>) =>
    fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: ANON, "content-type": "application/json", ...headers },
      body: "{}",
    }).then((r) => (r.ok ? r.json() : false)).catch(() => false);
  const pass = (req.headers.get("x-team-pass") || "").trim();
  if (pass && pass.length <= 200 && (await rpc("team_pass_ok", { Authorization: `Bearer ${ANON}`, "x-team-pass": pass })) === true) return true;
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "");
  const bearer = m ? m[1] : "";
  if (bearer && bearer !== ANON && bearer.split(".").length === 3) {
    if ((await rpc("is_allowed_reviewer", { Authorization: `Bearer ${bearer}` })) === true) return true;
  }
  return false;
}

// The CO's house voice for deck narration (CLAUDE.md, Naming & terminology; Sam,
// 2026-09-01 to 09-16), in the words a speaker says aloud.
const INSTRUCTIONS = `You write the speaker's script for one slide of a California Community Colleges Chancellor's Office deck about Credit for Prior Learning (CPL). The presenter reads it aloud from the slide's notes.

Write what the presenter says while this slide shows, in plain spoken sentences: about 60 to 150 words, one or two short paragraphs, no headings, bullets, symbols or stage directions.
- Say what the slide shows and why it matters to the audience, in the order the slide sets it out. Keep the student as the subject where the slide is about students.
- Use only the facts, figures and names on the slide, in its pictures' descriptions, or in the notes given. Never add a number, date, name or claim that is not there.
- Use active voice and name who acts. Vary sentence length, and let a short sentence land after a long one.
- State things positively. Do not use the "it is this, not that" frame.
- Use plain words. Never use leverage, utilize, robust, deep dive, synergy, operationalize or impactful, and no metaphors, asides or adjective phrases that point at the speaker.
- Say "funding", never "money"; a college "qualifies for" funding and never "earns" it.
- Use American spelling and the program's names as written: the CPL Initiative, the MAP platform (Mapping Articulated Pathways). Never "MAP Initiative".
- Never copy an email address, phone number or ID number, and never name a student.
- When the slide is a title or closing slide, keep the script to two or three sentences.
Answer with the script alone, no quotation marks and no preface.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  if (!(await allowed(req))) return reply(401, { error: "The team phrase or a reviewer sign-in is needed to draft a script." });

  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: "The request was not JSON." }); }
  const words = String(body?.words || "").slice(0, MAX_WORDS);
  const title = String(body?.title || "").slice(0, 300);
  if (!words.trim() && !title.trim()) return reply(400, { error: "Send the slide's title or words." });
  const deck = String(body?.deck || "").slice(0, 300);
  const n = Number(body?.slide) || 0, of = Number(body?.of) || 0;
  const pictures = (Array.isArray(body?.pictures) ? body.pictures : []).map((p: unknown) => String(p || "").slice(0, 400)).filter(Boolean).slice(0, 12);
  const notes = String(body?.notes || "").slice(0, MAX_NOTES);
  const mode = body?.mode === "replace" ? "replace" : "below";

  const lines = [
    deck ? `The deck: ${deck}` : "",
    n ? `Slide ${n}${of ? " of " + of : ""}.` : "",
    title ? `The slide's title: ${title}` : "",
    words ? `The slide's words, top to bottom:\n${words}` : "",
    pictures.length ? `Its pictures, as their alt text describes them:\n${pictures.map((p: string) => "- " + p).join("\n")}` : "",
    notes.trim()
      ? (mode === "below"
        ? `The presenter's own notes, which stay above your script:\n${notes}\nAdd what the notes leave out; do not repeat them.`
        : `The notes your script replaces, which may hold points worth keeping:\n${notes}`)
      : "",
    "Write the script.",
  ].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 700, system: INSTRUCTIONS, messages: [{ role: "user", content: lines }] }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("slide-script-draft: model call failed", res.status, t.slice(0, 300));
    return reply(502, { error: "The model did not answer (" + res.status + "). Try again in a minute." });
  }
  const out = await res.json();
  const text = (out?.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return reply(502, { error: "The model returned no text. Try again." });
  return reply(200, { script: text.replace(/^["“]|["”]$/g, ""), model: MODEL, usage: out?.usage || null });
});
