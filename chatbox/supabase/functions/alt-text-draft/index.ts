// alt-text-draft — a draft of alt text for one picture, for the Library's remediation.
//
// Sam, 2026-10-29, on the remediation report: "We do a lot of MAP screenshots and
// hoping you can decipher them and at least take a shot at alt text". The Library tab's
// Remediate (library_remediate.js) reads a deck or document in the browser; a person
// presses Draft from the picture on one item, and the page sends that one picture here,
// shrunk to at most 1568 pixels on its long side, with the slide's or section's words.
// This asks Claude for alt text and returns it. The person reads it before keeping it.
//
// Version 2 (S517, 2026-10-29), on Sam's "can you view the image in it's slide context
// and auto draft more contextualized alt text. Rather than describing the generic QR
// code, could you look for the slide context for where it likely goes...or just read the
// url from it": the page now sends the slide's title, the words nearest the picture and
// where they sit, the picture's own name, whether it is a video's poster frame, the rest
// of the slide's words, and a QR code's address, which the page reads itself.
//
// It READS NO TABLE AND WRITES NOTHING, and keeps nothing: the picture goes to the
// Anthropic API for the one call and is not logged here. A picture never carries a
// student's record; the instructions below also forbid copying any person's name,
// email or ID number seen in a screenshot.
//
// Auth: the team phrase (x-team-pass, checked by team_pass_ok()) or a reviewer sign-in
// (a bearer checked by is_allowed_reviewer()), so the public anon key never spends the
// model budget. Deployed with verify_jwt off, as cer-classify is; the check is here.
//
// Source of record is the LIVE function; this file is the in-repo capture.
// Version 2 (S517, 2026-10-29; v1 S509). Secrets used (already set project-wide):
// ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY. ALT_TEXT_MODEL overrides the model.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hvuwhnbuahrtptokpqfh.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const MODEL = Deno.env.get("ALT_TEXT_MODEL") || "claude-sonnet-5";
const MAX_B64 = 6_000_000;        // about 4.5 MB of picture; the page shrinks it first
const MAX_CONTEXT = 2500;         // characters of the slide's or section's words
const TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

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

const INSTRUCTIONS = `You write alt text for pictures in the California Community Colleges Chancellor's Office's decks and reports about Credit for Prior Learning (CPL). Many are screenshots of the MAP platform (Mapping Articulated Pathways), its CPL Dashboard, COBI, or Sierra.

Write what a person who cannot see the picture needs in order to follow the slide or section, in one to three plain sentences, at most 300 characters.
The words around it come from its slide: the label nearest the picture usually names what it is, and the slide's title names its topic. Use them to say what the picture is for on this slide.
- Say what kind of picture it is only when that matters (a screenshot of a named page, a chart, a photo, a QR code), and never begin with "Image of" or "Picture of".
- For a screenshot, name the page or view, then the point it makes: the headings, figures or labels that carry it. Read small text only as far as it serves that point; do not list every menu item.
- For a chart, give its kind, what it measures, and the largest and smallest values or the trend.
- For a QR code, say where it leads, never what its pattern looks like: "QR code to" the label beside it, then the address it reads when that is given, without "https://". With no address, name where the label says it goes.
- For a video's poster frame, begin "Video:" and say what the video is, from its name in the file or the slide's title.
- For a photo of people, describe the scene and what they are doing; never guess anyone's identity. A person the slide's own words name (a speaker in its title, a caption beside the photo) may be named as the slide names them.
- Never copy a person's name, email address, phone number or ID number from the picture itself. Say "a student's record" or "a staff member" instead.
- Use American spelling and the program's names as written: the CPL Initiative, the MAP platform.
- If the picture carries no meaning (a border, a background texture, a divider), answer only DECORATIVE.
Answer with the alt text alone, no quotation marks and no preface.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  if (!(await allowed(req))) return reply(401, { error: "The team phrase or a reviewer sign-in is needed to draft alt text." });

  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: "The request was not JSON." }); }
  const image = typeof body?.image === "string" ? body.image : "";
  const type = TYPES.includes(body?.media_type) ? body.media_type : "";
  if (!image || !type) return reply(400, { error: "Send image (base64) and media_type (png, jpeg, gif or webp)." });
  if (image.length > MAX_B64) return reply(413, { error: "The picture is too large. The page shrinks it first; reload and try again." });
  const context = String(body?.context || "").slice(0, MAX_CONTEXT);
  const where = String(body?.where || "").slice(0, 120);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: INSTRUCTIONS,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: type, data: image } },
          { type: "text", text: (where ? `Where it sits: ${where}.\n` : "") + (context ? `The words around it:\n${context}\n\n` : "") + "Write the alt text." },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("alt-text-draft: model call failed", res.status, t.slice(0, 300));
    return reply(502, { error: "The model did not answer (" + res.status + "). Try again in a minute." });
  }
  const out = await res.json();
  const text = (out?.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ").replace(/\s+/g, " ").trim();
  if (!text) return reply(502, { error: "The model returned no text. Try again." });
  const decorative = /^DECORATIVE\.?$/i.test(text);
  return reply(200, { alt: decorative ? "" : text.replace(/^["“]|["”]$/g, ""), decorative, model: MODEL, usage: out?.usage || null });
});
