// The text Sierra reads from a Library page, and the most she reads whole (Sam, 2026-11-05:
// "build fixes 1-3"; fix 1 keeps a card's draft inside her budget). Mirrors cpl-chat's
// libraryPageText (chatbox/supabase/functions/cpl-chat/index.ts) without its cap, so a draft's
// length is measured, not cut; tests/library_revise_draft.test.js holds the two to the same
// answer on a real page. A page longer than SIERRA_MAX loses its middle in her reading.
export const SIERRA_MAX = 34000;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", middot: "·", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };

export function readingText(html) {
  const body = String(html || "")
    .replace(/<!-- cpl-public-header:start[\s\S]*?<!-- cpl-public-header:end -->/g, " ")
    .replace(/<header\b[^>]*\bclass="cplh"[\s\S]*?<\/header>/gi, " ")
    .replace(/<(head|script|style|svg|nav|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|td|th)>/gi, "$& \n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
  return body.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}
