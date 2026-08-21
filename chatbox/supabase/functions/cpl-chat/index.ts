import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const ALLOWED_ORIGINS = [
  "https://map.rccd.edu",
  "https://cpl-initiative.github.io",
  "http://localhost",
  "http://localhost:3000",
  "http://localhost:8000",
  "null",  // file:// origins for local testing — REMOVE before production
];

const MATCH_THRESHOLD = 0.5;
const MATCH_COUNT = 5;
const MAX_TOKENS = 2048;
const RATE_LIMIT_PER_MIN = 20;

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MIN) return false;
  entry.count++;
  return true;
}

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  };
}

// ── College name detection ─────────────────────────────────────
const COLLEGE_ALIASES: Record<string, string> = {
  "ccsf": "City College of San Francisco",
  "mt sac": "Mt. San Antonio College",
  "mt. sac": "Mt. San Antonio College",
  "rcc": "Riverside City College",
  "lacc": "Los Angeles City College",
  "elac": "East Los Angeles College",
  "lattc": "Los Angeles Trade-Technical College",
  "lavc": "Los Angeles Valley College",
  "lahc": "Los Angeles Harbor College",
  "lamc": "Los Angeles Mission College",
  "lapc": "Los Angeles Pierce College",
  "lasw": "Los Angeles Southwest College",
  "wlac": "West Los Angeles College",
  "west la": "West Los Angeles College",
  "west los angeles": "West Los Angeles College",
  "sbvc": "San Bernardino Valley College",
  "crafton": "Crafton Hills College",
  "mvc": "Moreno Valley College",
  "moreno valley": "Moreno Valley College",
  "norco": "Norco College",
  "sdcc": "San Diego City College",
  "sdmc": "San Diego Mesa College",
  "sdmr": "San Diego Miramar College",
  "miramar": "San Diego Miramar College",
  "palomar": "Palomar College",
  "miracosta": "MiraCosta College",
  "grossmont": "Grossmont College",
  "cuyamaca": "Cuyamaca College",
  "swc": "Southwestern College",
  "imperial valley": "Imperial Valley College",
  "chaffey": "Chaffey College",
  "citrus": "Citrus College",
  "pasadena city": "Pasadena City College",
  "pcc": "Pasadena City College",
  "glendale": "Glendale Community College",
  "long beach": "Long Beach City College",
  "lbcc": "Long Beach City College",
  "el camino": "El Camino College",
  "compton": "Compton College",
  "cerritos": "Cerritos College",
  "rio hondo": "Rio Hondo College",
  "mt san jacinto": "Mt. San Jacinto College",
  "msjc": "Mt. San Jacinto College",
  "coc": "College of the Canyons",
  "college of the canyons": "College of the Canyons",
  "avc": "Antelope Valley College",
  "antelope valley": "Antelope Valley College",
  "victor valley": "Victor Valley College",
  "barstow": "Barstow Community College",
  "cerro coso": "Cerro Coso Community College",
  "bakersfield": "Bakersfield College",
  "porterville": "Porterville College",
  "taft": "Taft College",
  "fresno city": "Fresno City College",
  "reedley": "Reedley College",
  "clovis": "Clovis Community College",
  "modesto": "Modesto Junior College",
  "mjc": "Modesto Junior College",
  "merced": "Merced College",
  "cabrillo": "Cabrillo College",
  "hartnell": "Hartnell College",
  "monterey peninsula": "Monterey Peninsula College",
  "mpc": "Monterey Peninsula College",
  "gavilan": "Gavilan College",
  "de anza": "De Anza College",
  "foothill": "Foothill College",
  "west valley": "West Valley College",
  "mission": "Mission College",
  "san jose city": "San Jose City College",
  "evergreen valley": "Evergreen Valley College",
  "ohlone": "Ohlone College",
  "chabot": "Chabot College",
  "las positas": "Las Positas College",
  "diablo valley": "Diablo Valley College",
  "dvc": "Diablo Valley College",
  "contra costa": "Contra Costa College",
  "los medanos": "Los Medanos College",
  "solano": "Solano Community College",
  "napa valley": "Napa Valley College",
  "santa rosa": "Santa Rosa Junior College",
  "srjc": "Santa Rosa Junior College",
  "college of marin": "College of Marin",
  "skyline": "Skyline College",
  "canada": "Cañada College",
  "cañada": "Cañada College",
  "san mateo": "College of San Mateo",
  "city college sf": "City College of San Francisco",
  "sacramento city": "Sacramento City College",
  "cosumnes river": "Cosumnes River College",
  "american river": "American River College",
  "arc": "American River College",
  "sierra college": "Sierra College",
  "butte": "Butte College",
  "shasta": "Shasta College",
  "college of the redwoods": "College of the Redwoods",
  "allan hancock": "Allan Hancock College",
  "santa barbara": "Santa Barbara City College",
  "sbcc": "Santa Barbara City College",
  "ventura": "Ventura College",
  "oxnard": "Oxnard College",
  "moorpark": "Moorpark College",
  "cuesta": "Cuesta College",
  "san luis obispo": "Cuesta College",
  "coastline": "Coastline Community College",
  "golden west": "Golden West College",
  "orange coast": "Orange Coast College",
  "occ": "Orange Coast College",
  "irvine valley": "Irvine Valley College",
  "ivc": "Irvine Valley College",
  "saddleback": "Saddleback College",
  "santiago canyon": "Santiago Canyon College",
  "santa ana": "Santa Ana College",
  "fullerton": "Fullerton College",
  "cypress": "Cypress College",
  "riverside city": "Riverside City College",
  "riverside": "Riverside City College",
  "palo verde": "Palo Verde College",
  "madera": "Madera College",
  "columbia": "Columbia College",
  "college of the desert": "College of the Desert",
  "cod": "College of the Desert",
  "lassen": "Lassen College",
  "pierce": "Los Angeles Pierce College",
  "santa monica": "Santa Monica College",
  "smc": "Santa Monica College",
};

/* How many name-match candidates may travel together.
 *
 * 12, because the largest real multi-college district in California is LACCD's
 * NINE and this must not truncate it. Used in BOTH places a candidate list is
 * bounded — the per-word query and the tie list — so the two can no longer
 * disagree. They did: the query was raised 3 -> 12 and the tie list kept 3,
 * which is the whole of the 2026-08-21 "Three LACCD colleges" defect.
 *
 * ⚠ Raising this is NOT what makes the answer honest — the `_match` stamp is.
 * A bigger cap on an undisclosed list just moves the false claim from three to
 * nine. See the tie block below. */
const CANDIDATE_MAX = 12;

async function detectAndFetchCollegeProfile(
  query: string,
  sb: any
): Promise<any | null> {
  const q = query.toLowerCase();

  // 1. Check alias map first
  for (const [alias, fullName] of Object.entries(COLLEGE_ALIASES)) {
    if (q.includes(alias)) {
      const { data } = await sb
        .from("chatbox_college_profiles")
        .select("*")
        .eq("college", fullName)
        .single();
      if (data) return data;
    }
  }

  // 2. Try fuzzy match against database — ilike search.
  // Punctuation is stripped first: the ilike pattern is `%word%`, so a trailing
  // mark made the whole lookup miss ("Tell me about Cerritos." searched
  // `%cerritos.%` and found nothing).
  const words = q.split(/\s+/)
    .map((w: string) => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter((w: string) => w.length >= 4 && ![
    "what", "does", "have", "about", "their", "they", "credit",
    "college", "community", "many", "much", "with", "from",
    "that", "this", "there", "here", "where", "when", "which",
    "could", "would", "should", "will", "been", "being",
    "your", "some", "more", "most", "other", "than", "then",
    "fire", "firefighter", "real", "estate", "nurse", "nursing",
    "emt", "paramedic", "welding", "cosmetology", "police",
    "officer", "post", "apprentice", "military", "veteran",
  ].includes(w));

  // WHY THIS IS POOLED AND SCORED, NOT FIRST-MATCH-WINS (2026-08-07, smoke mode 7):
  // "Does Los Angeles Harbor College give credit for NCCER carpentry?" used to
  // resolve to the WRONG SHAPE — an ambiguous 3-college array — because the loop
  // hit "angeles" (9 colleges) FIRST and returned on it, never reaching "harbor",
  // which matches exactly ONE college. Worse, `.limit(3)` with no ORDER BY is
  // non-deterministic: two identical calls returned {East LA, LA City, LA Harbor}
  // and {LA Mission, LA Southwest, West LA}. So the question found its home
  // college only when LA Harbor happened to fall inside an arbitrary window.
  // With no home college resolved, askedGeo is null and NOTHING downstream can
  // rank by proximity — which is how a college ~50 miles away came to outrank
  // five adjacent ones. Fix the detection and the geography follows.
  //
  // Now: ask for every candidate word at once (ordered => deterministic), pool
  // the candidates, and score each college by how many of the query's words its
  // name contains. A strict winner wins outright; a lone single-word match is the
  // fallback; a genuine tie still returns an ARRAY so the caller's topic-hit
  // disambiguation (the West-LA real-estate path) keeps working.
  const matchSets = await Promise.all(words.map(async (word: string) => {
    const { data } = await sb
      .from("chatbox_college_profiles")
      .select("college")   // names only — the full row is fetched once, for the winner
      .ilike("college", `%${word}%`)
      .order("college")    // determinism: an arbitrary LIMIT window is what hid LA Harbor
      .limit(CANDIDATE_MAX); // "angeles" alone matches 9; a limit of 3 truncated the answer
    return (data || []).map((r: any) => r.college);
  }));

  const pool = [...new Set(matchSets.flat())];
  if (pool.length === 0) return null;

  const fetchProfiles = async (names: string[]) => {
    const { data } = await sb.from("chatbox_college_profiles").select("*").in("college", names);
    return data || [];
  };
  const one = async (name: string) => (await fetchProfiles([name]))[0] || null;

  const score = (name: string) =>
    words.filter((w: string) => name.toLowerCase().includes(w)).length;
  const scored = pool.map((c) => ({ college: c, n: score(c) })).sort((a, b) => b.n - a.n);

  // A strict multi-word winner ("los ANGELES HARBOR college" = angeles + harbor)
  // beats every single-word match. This is the whole point of the rewrite.
  if (scored[0].n >= 2 && (scored.length === 1 || scored[1].n < scored[0].n)) {
    const hit = await one(scored[0].college);
    if (hit) return hit;
  }

  // Otherwise the previous contract: the first query word that resolves to
  // exactly one college wins.
  for (const names of matchSets) {
    if (names.length === 1) {
      const hit = await one(names[0]);
      if (hit) return hit;
    }
  }

  /* Still ambiguous — hand the caller the tied candidates (an ARRAY), as before.
   *
   * ⭐ THIS IS A CANDIDATE LIST, NOT A ROSTER, AND IT USED TO BE READ AS ONE.
   * Sam, 2026-08-21, asked "What should Los Angeles Community College District
   * do to help its colleges award more CPL?" and Sierra opened with **"Three
   * LACCD colleges appear in the MAP platform data"** — naming three and
   * closing, in the same answer, with "across all nine LACCD colleges". All
   * NINE are in map_colleges AND all nine are in chatbox_college_profiles;
   * nothing was missing. The three were this line's `.slice(0, 3)`.
   *
   * ⚠ AND THE LESSON WAS ALREADY LEARNED 34 LINES ABOVE. The per-word query
   * carries the comment `"angeles" alone matches 9; a limit of 3 truncated the
   * answer` — someone hit this exact bug, on these exact nine colleges, raised
   * that limit to 12, and left the identical 3-cap here. Fixing one truncation
   * and leaving its twin is why LA Harbor came back and the other six did not.
   *
   * TWO changes, and the second matters more than the first:
   *   · the cap rises to CANDIDATE_MAX (12, matching the query limit above), so
   *     the largest real multi-college district fits; and
   *   · every returned row is STAMPED `_match`, so buildCollegeContext can say
   *     what this list IS. Raising the cap alone would only have moved the
   *     false claim from three to nine — still a name match presented as MAP's
   *     contents, and still wrong, because Sierra has no district dimension at
   *     ALL (verified 2026-08-21: zero columns named district in the whole
   *     public schema, zero occurrences of "district" in this file).
   *
   * The repo already had the rule and it was not applied here — from the
   * alignment work: "peer_total ships as a COLUMN ('showing 9 of 261') — a
   * capped list must never read as a census."
   *
   * ⚠ The stamp goes on EACH ROW, not on the array. withLiveContacts() does
   * `profile.map(attach)` and buildCollegeContext() does `profiles.map(...)`,
   * and a property hung on the array itself is dropped by the first of those.
   * `attach` spreads the row, so a per-row field survives both. */
  const tiedAll = scored.filter((s) => s.n === scored[0].n).map((s) => s.college);
  const tied = tiedAll.slice(0, CANDIDATE_MAX);
  const rows = await fetchProfiles(tied);
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) {
    const stamp = { shown: rows.length, total: tiedAll.length, words: words.slice(0, 8) };
    return rows.map((r: any) => ({ ...r, _match: stamp }));
  }

  return null;
}

// ── Topic synonym expansion ───────────────────────────────────
// Maps career/credential keywords to related search terms including discipline names.
// This bridges the gap between what users ask ("firefighter CPL") and how exhibits
// are titled in the MAP system ("FIT Academy", "Paramedic License", etc.)
const TOPIC_SYNONYMS: Record<string, string[]> = {
  firefighter: ["fire", "firefight", "emt", "paramedic", "emergency", "protective", "fit", "nfpa", "sft", "wildland"],
  firefighting: ["fire", "firefight", "emt", "paramedic", "emergency", "protective", "fit", "nfpa", "sft"],
  fire: ["firefight", "protective", "fit", "nfpa", "sft", "wildland"],
  emt: ["emergency", "paramedic", "medical", "technician"],
  paramedic: ["emergency", "medical", "emt"],
  police: ["post", "officer", "enforcement", "protective", "corrections", "criminal"],
  officer: ["post", "police", "enforcement", "protective"],
  corrections: ["criminal", "justice", "protective", "post"],
  security: ["homeland", "hls", "protective", "transportation"],
  homeland: ["security", "hls", "protective"],
  welding: ["weld", "welder", "fabrication", "smaw", "fcaw"],
  nursing: ["nurse", "lpn", "cna", "health", "clinical"],
  nurse: ["nursing", "lpn", "cna", "health", "clinical"],
  automotive: ["auto", "ase", "mechanic", "vehicle", "engine"],
  mechanic: ["automotive", "ase", "engine", "vehicle"],
  apprentice: ["apprenticeship", "journeyperson", "ibew"],
  electrician: ["electrical", "ibew", "apprentice", "wiring"],
  dental: ["dentist", "hygiene", "rdh"],
  aviation: ["faa", "flight", "aircraft", "airframe", "powerplant", "pilot"],
  cyber: ["cybersecurity", "comptia", "network", "ethical"],
  // Construction trades — the NCCER family (Boys & Girls Club case). Kept tight;
  // generic words ("building", "trades") over-matched fire/other departments, and
  // relevance ranking (top_title weighted) surfaces the real discipline anyway.
  construction: ["carpentry", "carpenter", "nccer"],
  carpentry: ["construction", "carpenter", "woodworking", "nccer"],
  carpenter: ["carpentry", "construction", "nccer"],
  plumbing: ["construction", "pipefitting", "plumber"],
  plumber: ["plumbing", "pipefitting"],
  nccer: ["construction", "carpentry", "welding", "electrician", "plumbing"],
  hvac: ["refrigeration", "environmental", "heating"],
  osha: ["occupational"],
  // CPR / First-Aid family (Session 93 — the CPR retrieval miss, 2026-07-01):
  // exhibit titles drift across "CPR", "First Aid", "AED", "BLS", "Lifesaving",
  // "Resuscitation" — bridge them so any one term finds the whole family.
  cpr: ["aed", "bls", "aid", "lifesaving", "resuscitation", "heartsaver"],
  aed: ["cpr", "aid", "lifesaving"],
  bls: ["cpr", "aed", "resuscitation"],
  lifesaving: ["cpr", "aed", "aid"],
  resuscitation: ["cpr", "bls", "aed"],
  // Reached via the bigram pass ("first aid" → "firstaid"). Deliberately NOT a
  // bare `aid` key: "financial aid" is a far commoner phrase in this domain and
  // must never expand into the CPR family.
  firstaid: ["cpr", "aed", "bls", "lifesaving", "heartsaver"],
  // The expanded name. NOTE the asymmetry that makes this necessary: exhibit
  // titles overwhelmingly say "CPR", so someone asking for "cardiopulmonary
  // resuscitation" — the correct full term — matched almost nothing. Reached
  // directly, or via the bigram pass for "cardio pulmonary", or via the fuzzy
  // pass for misspellings ("cardiopulminary").
  cardiopulmonary: ["cpr", "aed", "bls", "resuscitation", "lifesaving"],
  defibrillation: ["aed", "cpr", "bls"],
  defibrillator: ["aed", "cpr", "bls"],
};

// ── Topic keyword extraction ──────────────────────────────────
const TOPIC_STOP_WORDS = new Set([
  "what", "where", "which", "when", "how", "does", "have", "about",
  "their", "they", "credit", "college", "community", "many", "much",
  "with", "from", "that", "this", "there", "here", "could", "would",
  "should", "will", "been", "being", "your", "some", "more", "most",
  "other", "than", "then", "prior", "learning", "can", "get", "for",
  "the", "and", "are", "was", "were", "has", "had", "not", "but",
  "all", "any", "who", "its", "you", "into", "also", "just", "very",
  "offer", "offers", "give", "gives", "provide", "provides",
  "opportunities", "opportunity", "available", "tell",
  // Meta/continuation words that poisoned retrieval (Session 93, the CPR miss):
  // they matched exhibits lexically ("check" → "Truck-Check") and — worse — a
  // turn like "Do any of these already exist in MAP?" read as a NEW topic
  // ("already exist map") instead of folding the conversation's real subject.
  // With these stopped, that turn has no topic words of its own → the v18
  // refinement fold kicks in and carries the prior topic into retrieval.
  "think", "check", "checking", "checked", "again", "already",
  "exist", "exists", "existing", "colleges", "map",
  // Domain META-words: they describe the ASK ("give CPL for a CPR cert"), not
  // the TOPIC. Left in, they retrieve on themselves — "cert" alone matched 445
  // of 2,397 exhibits (18.6%) and buried the 12 real CPR rows under the
  // 200-row cap, which is half of why "which colleges give CPL for CPR"
  // answered with 2 colleges instead of 5 (2026-08-06). The v2 RPC's
  // document-frequency filter is the safety net for meta-words nobody
  // anticipated; this list is the cheap first pass for the ones we know.
  "cert", "certs", "certificate", "certification", "certifications",
  "cpl", "ccc", "cccs", "articulation", "articulated",
]);

function extractTopicKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !TOPIC_STOP_WORDS.has(w));
}

// Words that mark a follow-up as NARROWING (a place/region/proximity filter, or a
// "show me all" continuation) rather than introducing a NEW topic. Used only to
// decide whether to fold the prior conversation's topic into the retrieval text —
// a turn whose only keywords are these has no topic of its own, so the real
// subject (e.g. "real estate license", asked turns ago) must be folded in.
const REFINE_NOISE = new Set([
  // place / region / proximity
  "north", "south", "east", "west", "northern", "southern", "eastern", "western",
  "california", "socal", "norcal", "bay", "area", "areas", "region", "regional",
  "county", "local", "locally", "near", "nearby", "around", "home", "here", "there",
  "live", "living", "city", "town", "inland", "empire", "coast", "coastal", "valley",
  // list / continuation meta
  "show", "see", "list", "option", "options", "all", "more", "them", "both",
  "everything", "please", "thanks", "thank", "want", "like", "would", "could",
  "tell", "give", "one", "ones",
]);

/**
 * Candidate lookup keys for a token, singular first-cousin included.
 *
 * TOPIC_SYNONYMS is keyed on singular forms ("firefighter", "nurse"), but
 * people ask in the plural — "what CPL is available for firefighters?" — and
 * the lookup was exact-match, so the ENTIRE synonym bridge was lost on the
 * commoner phrasing (2026-08-06: "firefighter" expanded to 11 terms,
 * "firefighters" to 1; "nurse" to 6, "nurses" to 1). Postgres' stemmer papers
 * over part of this at match time, but the cross-vocabulary bridge — the whole
 * point of the table, e.g. firefighter→nfpa/sft/wildland — never fired.
 */
function synonymKeys(kw: string): string[] {
  const keys = [kw];
  if (kw.endsWith("ies") && kw.length > 4) keys.push(kw.slice(0, -3) + "y");
  if (kw.endsWith("es") && kw.length > 3) keys.push(kw.slice(0, -2));
  if (kw.endsWith("s") && kw.length > 3) keys.push(kw.slice(0, -1));
  return keys;
}

/** Padded character trigrams, the pg_trgm way (so behaviour matches the DB). */
function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

/** Jaccard overlap of trigram sets — 1.0 identical, ~0 unrelated. */
function trigramSimilarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  const union = A.size + B.size - shared;
  return union === 0 ? 0 : shared / union;
}

/**
 * Closest synonym KEY to a token, for misspellings (Sam, 2026-08-06:
 * "cardiopulminary resuscitation ... like my misspellings :)").
 *
 * Deliberately fuzzy-matches the KEY, not the corpus. Fuzzy-matching titles
 * would not help here at all: the exhibits say "CPR", so no amount of string
 * distance connects them to "cardiopulminary". Correcting the token to
 * `cardiopulmonary` first, then expanding through the table, is what bridges it.
 *
 * Guards: >=6 chars (short tokens are mostly acronyms, where one character of
 * distance is a DIFFERENT credential — CNA/CAN, EMT/EMR), and a 0.55 floor,
 * which admits "cardiopulminary"→cardiopulmonary while rejecting near-miss
 * pairs like "welding"/"welder" that are already distinct keys.
 */
const FUZZY_MIN_LEN = 6;
const FUZZY_FLOOR = 0.55;
function nearestSynonymKey(token: string): string | null {
  if (token.length < FUZZY_MIN_LEN) return null;
  if (TOPIC_SYNONYMS[token]) return token;
  let best: string | null = null;
  let bestScore = FUZZY_FLOOR;
  for (const key of Object.keys(TOPIC_SYNONYMS)) {
    if (key.length < FUZZY_MIN_LEN) continue;
    const score = trigramSimilarity(token, key);
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

/** Expand topic keywords with synonyms to catch related exhibits */
function expandWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set(keywords);

  const addFamily = (key: string): boolean => {
    const syns = TOPIC_SYNONYMS[key];
    if (!syns) return false;
    expanded.add(key);
    for (const s of syns) expanded.add(s);
    return true;
  };

  // BIGRAMS FIRST (2026-08-06, Sam's phrasings). extractTopicKeywords splits on
  // whitespace and strips punctuation, so the two-word and hyphenated spellings
  // of a one-word credential family lost the bridge: "fire fighter" and
  // "fire-fighter" resolved only through the loose "fire" key (missing
  // emt/paramedic/emergency), and "life saving" / "first aid" expanded to
  // nothing at all — the latter being the exact family behind the CPR question
  // that started this. Joining adjacent tokens recovers them.
  for (let i = 0; i < keywords.length - 1; i++) {
    const joined = keywords[i] + keywords[i + 1];
    for (const key of synonymKeys(joined)) {
      if (addFamily(key)) break;
    }
  }

  for (const kw of keywords) {
    // First key that resolves wins — we want "firefighters" to pick up the
    // "firefighter" family, not to also drag in whatever "firefighte" might
    // one day match. Stop at the first hit.
    let hit = false;
    for (const key of synonymKeys(kw)) {
      if (addFamily(key)) { hit = true; break; }
    }
    // FUZZY LAST RESORT: only for tokens no exact/singular form could resolve,
    // so a correctly-spelled query never pays for it and can never be dragged
    // sideways into a neighbouring family by string distance.
    if (!hit) {
      const near = nearestSynonymKey(kw);
      if (near) addFamily(near);
    }
  }

  // Same courtesy for two-word spellings of a misspelt term
  // ("cardio pulminary" → cardiopulmonary).
  for (let i = 0; i < keywords.length - 1; i++) {
    const joined = keywords[i] + keywords[i + 1];
    if (TOPIC_SYNONYMS[joined]) continue;
    const near = nearestSynonymKey(joined);
    if (near) addFamily(near);
  }
  return [...expanded];
}

// ── Topic-based exhibit search ─────────────────────────────────
async function searchExhibitsByTopic(
  query: string,
  sb: any,
  collegeFilter: string | null = null
): Promise<any[] | null> {
  const rawKeywords = extractTopicKeywords(query);
  if (rawKeywords.length === 0) return null;

  // Expand keywords with synonyms (firefighter → fire, emt, paramedic, protective, etc.)
  const keywords = expandWithSynonyms(rawKeywords);

  // Strategy 1 (v28a, 2026-08-06): hand the RAW TERMS to search_exhibits_by_topic_v2
  // and let the database sanitise them next to the corpus it measures against.
  //
  // We used to build the tsquery here — `keywords.map(k => k + ":*").join(" | ")`
  // — and that string was the bug. Parsed with the 'english' config, the Snowball
  // stemmer reads the "-ed" in "aed" as a past-tense suffix and strips it, so
  // `aed:*` became `'a':*`: a prefix match on the letter "a". OR'd against every
  // other term, that one token matched most of the corpus, and the genuine CPR
  // rows were pushed out by the 200-row cap. "Which colleges give CPL for a CPR
  // cert?" answered with 2 colleges when the corpus held 5.
  //
  // v2 routes short/acronym terms to an UNSTEMMED 'simple' vector, drops terms
  // whose document frequency exceeds 15% of the corpus, and normalises "/" so
  // "First Aid/CPR/AED" stops tokenising as one file-path token. v1 is left in
  // place untouched as the fallback below — rollback is deleting this block.
  const { data: v2Results, error: v2Error } = await sb
    .rpc("search_exhibits_by_topic_v2", {
      search_terms: keywords,
      college_filter: collegeFilter,
      result_limit: 200,
    });

  if (!v2Error && v2Results && v2Results.length > 0) {
    return v2Results;
  }

  // Strategy 1b: v1 fallback — only reached if v2 is missing (not yet migrated)
  // or errored. Carries the original stemmer defect, so it is a safety net for
  // availability, not a co-equal path.
  const tsQuery = keywords.map((k) => `${k}:*`).join(" | ");

  const { data: ftsResults, error: ftsError } = await sb
    .rpc("search_exhibits_by_topic", {
      search_query: tsQuery,
      college_filter: collegeFilter,
      result_limit: 200,
    });

  if (!ftsError && ftsResults && ftsResults.length > 0) {
    return ftsResults;
  }

  // Strategy 2: Fallback to ILIKE on individual keywords (searches both exhibit_title AND discipline)
  const titleClauses = keywords.slice(0, 3).map((k) => `exhibit_title.ilike.%${k}%`);
  const disciplineClauses = keywords.slice(0, 3).map((k) => `discipline.ilike.%${k}%`);
  const ilikeClauses = [...titleClauses, ...disciplineClauses];

  let ilikeQuery = sb
    .from("chatbox_exhibits")
    .select(`
      college,
      exhibit_title,
      exhibit_id,
      cpl_type,
      collaborative_type,
      rec_count,
      sample_courses,
      sample_credit_recs,
      discipline
    `)
    .or(ilikeClauses.join(","))
    .limit(200);

  if (collegeFilter) {
    ilikeQuery = ilikeQuery.eq("college", collegeFilter);
  }

  const { data: ilikeResults } = await ilikeQuery;

  if (ilikeResults && ilikeResults.length > 0) {
    // Join landing page URLs manually
    const colleges = [...new Set(ilikeResults.map((r: any) => r.college))];
    const { data: profiles } = await sb
      .from("chatbox_college_profiles")
      .select("college, landing_page_url")
      .in("college", colleges);

    const urlMap = new Map(
      (profiles || []).map((p: any) => [p.college, p.landing_page_url])
    );

    return ilikeResults.map((r: any) => ({
      ...r,
      landing_page_url: urlMap.get(r.college) || null,
      discipline: r.discipline || null,
    }));
  }

  return null;
}

// ── College OFFERINGS search (the COURSE CATALOG — what colleges TEACH) ─────────
// Distinct from searchExhibitsByTopic (the earned-EXHIBIT set). This answers
// "does college X teach discipline Y?" and "which colleges teach it?" — the basis
// for an adoption recommendation when a college teaches a discipline but hasn't
// articulated the credential yet (e.g. NCCER carpentry). Reads coci_college_offerings
// via search_college_offerings (rollup by college x TOP program, + region/county).
async function searchCollegeOfferings(query: string, sb: any): Promise<any[] | null> {
  const rawKeywords = extractTopicKeywords(query);
  if (rawKeywords.length === 0) return null;
  const keywords = expandWithSynonyms(rawKeywords);
  const tsQuery = keywords.map((k) => `${k}:*`).join(" | ");
  const { data, error } = await sb.rpc("search_college_offerings", {
    search_query: tsQuery,
    college_filter: null,
    result_limit: 150, // generous — a noisy multi-keyword query must not truncate a
                       // relevant college out (the Q1 El-Camino false-negative)
  });
  if (error || !data || data.length === 0) return null;
  return data;
}

// Fetch region/county for EVERY college in one read (~120 rows) so BOTH lists —
// the earned-exhibit list and the course-catalog list — can rank by proximity.
// This replaces a single-row lookup that only the offerings path could use:
// search_exhibits_by_topic returns no geography at all, so without this map the
// exhibit list has nothing to sort on except volume. Cheap enough to fetch on
// every question, and it doubles as the fallback when an offerings row's own
// region/county is null.
async function fetchCollegeGeoMap(sb: any): Promise<Map<string, any>> {
  const { data } = await sb.from("college_geo").select("college, region, county");
  const m = new Map<string, any>();
  for (const r of data || []) {
    m.set(r.college, { region: r.region || null, county: r.county || null });
  }
  return m;
}

// ── Credit disposition (v36) — what colleges have ACTED on ─────────────────────
// Until now Sierra could say what credit EXISTS and never what a college has
// DONE with it. These are the published, suppression-applied aggregates
// (`adr-student-detail-aggregate-disclosure-control`): k=10 applied at WRITE
// time, thin cells carrying `suppressed=true` with their measures nulled. The
// reviewer-only student grain (`map_student_credit`) is never read here.
//
// ⚠️ This function runs on the SERVICE ROLE key, so RLS does not constrain it —
// the gate on these tables (`is_allowed_reviewer() OR team_pass_ok()`) stops the
// widget's anon key reading PostgREST directly, and does nothing about this code
// path. Per-college disclosure through Sierra is therefore a deliberate decision
// (Sam, 2026-08-09), not a side effect of RLS.
//
// Totals are rolled up HERE from the same four objects `college_goal2.js` reads,
// rather than hardcoded in prompt text, so Sierra and the 🎓 Course Credit tab
// cannot drift apart. Note this means the sums are POST-suppression and land
// slightly under the pre-suppression figures quoted in the project docs, because
// suppressed cells carry NULL measures — the tab has the same property, and the
// published number is the sourceable one. `sierra_credit_disposition.test.js`
// asserts no headline figure is ever pasted in here, so do not write one into
// this comment either.
// One adopting college: the NAME (the answer) and its CPL landing page (the
// route to acting on it). url is null when the college has no page on file —
// never a guess, and never a reason to omit the college.
//
// DECLARED HERE, ABOVE THE LIFTED REGION, deliberately. tests/lib/lift_ts.js
// evaluates index.ts lines ~716-1589 as plain JS after stripping type
// ANNOTATIONS; it does not strip type DECLARATIONS, so a `type X = ...` inside
// that span is a SyntaxError that reads as "Unexpected identifier" rather than
// as anything about the signature that changed. lift_ts's own guidance is to
// fix the block boundaries rather than widen its regexes — and `interface
// CreditStatus` below is the existing instance of that convention.
type AdopterRef = { name: string; url: string | null };

interface CreditStatus {
  asOf: string | null;
  collegesWithData: number;
  statewide: {
    students: number; dormant: number; ready: number;
    applied: number; transcribed: number; transcribedPct: number | null;
  };
  goal2: { dest: string; students: number; rows: number }[];
  college: {
    name: string; suppressed: boolean; students: number | null;
    dormant: number | null; ready: number | null;
    applied: number | null; transcribed: number | null;
    goal2: { dest: string; students: number | null; rows: number | null; suppressed: boolean }[];
  } | null;
  collegeAsked: string | null;
  collegeHasNoRow: boolean;
}

// Split fetch from shape: the four tables do not depend on which college was
// detected, so they ride in the main Promise.all (no extra round-trip), and the
// per-college pick happens afterwards once detection has resolved. It also
// leaves `shapeCreditStatus` a pure function — testable without a database,
// which is where the roll-up and suppression logic actually live.
async function fetchCreditData(sb: any): Promise<any | null> {
  try {
    const [summaryRes, collegesRes, goal2Res, loadRes] = await Promise.all([
      sb.from("map_college_credit_summary").select(
        "college_id,students,suppressed,dormant_credits,articulated_waiting,applied_credits,transcribed_credits"),
      sb.from("map_colleges").select("college_id,college_name,entity_kind"),
      sb.from("map_college_goal2").select("college_id,dest,students,rows_n,suppressed"),
      sb.from("map_data_loads").select("loaded_at").order("loaded_at", { ascending: false }).limit(1),
    ]);
    if (!summaryRes.data || summaryRes.data.length === 0) return null;
    return {
      summary: summaryRes.data,
      colleges: collegesRes.data || [],
      goal2: goal2Res.data || [],
      load: loadRes.data || [],
    };
  } catch (e) {
    console.error("fetchCreditData failed:", e);
    return null;  // a failed read is NOT "no credit anywhere" — the context is omitted
  }
}

// Returns a CreditStatus (see the interface above); typed `any` at the
// boundary so tests/lib/lift_ts.js can lift this block into Node.
function shapeCreditStatus(
  raw: any | null,
  collegeName: string | null
): any {
  if (!raw) return null;
  {
    const summary: any[] = raw.summary || [];
    const collegeRows: any[] = raw.colleges || [];
    const goal2Rows: any[] = raw.goal2 || [];
    const loadRows: any[] = raw.load || [];
    if (summary.length === 0) return null;

    // `map_colleges` carries 8 MAP test fixtures ("CabTest College", "NORCO
    // College - Syllabus Manager", …). None has credit data, but leaving them in
    // the lookup lets Sierra discuss a test fixture as if it were an institution.
    const nameById = new Map<number, string>();
    const idByName = new Map<string, number>();
    for (const c of collegeRows) {
      if (c.is_test === true || c.entity_kind === "test") continue;
      nameById.set(c.college_id, c.college_name);
      idByName.set(String(c.college_name).trim().toLowerCase(), c.college_id);
    }

    // Statewide roll-up. Suppressed cells carry NULL measures; skipping them is
    // what makes the published total lower than the true one, by design.
    const st = { students: 0, dormant: 0, ready: 0, applied: 0, transcribed: 0, transcribedPct: null };
    for (const r of summary) {
      st.students += Number(r.students) || 0;
      st.dormant += Number(r.dormant_credits) || 0;
      st.ready += Number(r.articulated_waiting) || 0;
      st.applied += Number(r.applied_credits) || 0;
      st.transcribed += Number(r.transcribed_credits) || 0;
    }
    st.transcribedPct = st.applied > 0 ? Math.round((st.transcribed / st.applied) * 1000) / 10 : null;

    const g2map = new Map<string, { dest: string; students: number; rows: number }>();
    for (const g of goal2Rows) {
      const e = g2map.get(g.dest) || { dest: g.dest, students: 0, rows: 0 };
      e.students += Number(g.students) || 0;
      e.rows += Number(g.rows_n) || 0;
      g2map.set(g.dest, e);
    }

    // The named college, if one was detected AND it resolves. A college with no
    // row is a KNOWN gap (111 of 128 entities have credit data) and is reported
    // as such — never silently omitted, which would read as "zero".
    let college: any = null;
    let collegeHasNoRow = false;
    if (collegeName) {
      const cid = idByName.get(collegeName.trim().toLowerCase());
      const row = cid != null ? summary.find((r: any) => r.college_id === cid) : null;
      if (row) {
        college = {
          name: nameById.get(row.college_id) || collegeName,
          suppressed: !!row.suppressed,
          students: row.students ?? null,
          dormant: row.dormant_credits != null ? Number(row.dormant_credits) : null,
          ready: row.articulated_waiting != null ? Number(row.articulated_waiting) : null,
          applied: row.applied_credits != null ? Number(row.applied_credits) : null,
          transcribed: row.transcribed_credits != null ? Number(row.transcribed_credits) : null,
          goal2: goal2Rows
            .filter((g: any) => g.college_id === cid)
            .map((g: any) => ({
              dest: g.dest,
              students: g.students ?? null,
              rows: g.rows_n ?? null,
              suppressed: !!g.suppressed,
            })),
        };
      } else {
        collegeHasNoRow = true;
      }
    }

    return {
      asOf: loadRows[0]?.loaded_at ? String(loadRows[0].loaded_at).slice(0, 10) : null,
      collegesWithData: summary.length,
      statewide: st,
      goal2: Array.from(g2map.values()).sort((a, b) => b.rows - a.rows),
      college,
      collegeAsked: collegeName,
      collegeHasNoRow,
    };
  }
}

function fmtN(n: any): string {
  if (n == null) return "not published";
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Route CRED-STD — the ASCCC statewide credit recommendation for a credential.
 *
 * Sierra's only credential source used to be chatbox_exhibits: the RAW freehand
 * titles colleges typed into MAP. Asked "what colleges articulate POST?" it
 * matched the literal string and found 20 colleges; the curated canonical record
 * folds 16 variants — including "Peace Officer Standardized Training Academy",
 * which contains no "POST" — and knows 32 adopters. chatbox_credentials is that
 * record, and search_statewide_recommendations() is its CRED-STD lens.
 *
 * TWO-WORD PAIRS ARE ESSENTIAL, not a nicety. Credential names are overwhelmingly
 * multi-word ("peace officer", "real estate", "medical assistant") and the single
 * tokens are useless on their own — "peace" and "officer" separately match
 * nothing a person meant. We probe pairs FIRST for that reason.
 */
async function fetchStatewideRecommendations(query: string, sb: any): Promise<any[] | null> {
  const kws = extractTopicKeywords(query);
  if (kws.length === 0) return null;

  // Adjacent pairs first (longest, most specific), then singles. Capped so a
  // rambling question cannot fan out into a dozen round-trips.
  const probes: string[] = [];
  for (let i = 0; i < kws.length - 1 && probes.length < 4; i++) probes.push(`${kws[i]} ${kws[i + 1]}`);
  for (const k of kws.slice(0, 4)) if (!probes.includes(k)) probes.push(k);

  const byTitle = new Map<string, any>();
  for (const asked of probes.slice(0, 8)) {
    const { data, error } = await sb.rpc("search_statewide_recommendations", {
      asked, result_limit: 4,
    });
    if (error || !data) continue;
    for (const r of data) {
      const prev = byTitle.get(r.unified_title);
      // Keep the STRONGEST evidence across probes: a pair matching at tier 3
      // beats a single token matching at tier 4 for the same credential.
      if (!prev || r.match_tier < prev.match_tier) byTitle.set(r.unified_title, { ...r, asked });
    }
  }
  if (byTitle.size === 0) return null;
  return [...byTitle.values()]
    .sort((a, b) => a.match_tier - b.match_tier || b.n_adopters - a.n_adopters)
    .slice(0, 5);
}

/**
 * The honest fallback. Zero statewide hits is a RESULT, not a failure: it means
 * ASCCC has not adopted a statewide recommendation for that credential. Saying
 * whether the credential exists LOCALLY is what turns "I don't know" into
 * something useful — and it is what stops the model reaching for a neighbouring
 * credential to avoid an empty answer.
 */
async function fetchAnyCredentials(query: string, sb: any): Promise<any[] | null> {
  const kws = extractTopicKeywords(query);
  if (kws.length === 0) return null;
  // WIDENED to 4/4/8 to match the statewide route (2026-08-13). At 3/3/6 this —
  // the ONLY route that reaches LOCAL credentials — had the narrowest probe
  // budget of the three, and dropped content tokens past the third keyword.
  // Measured on Sam's question, "I have a journey worker license as Iron and
  // Steel worker": keywords are [journey, worker, license, iron, steel, worker],
  // so the probes were [journey worker, worker license, license iron, journey,
  // worker, license] and "iron" was NEVER asked — while search_credentials_any
  // ('iron') returns 25 rows. The subject of the sentence fell off the end.
  const probes: string[] = [];
  for (let i = 0; i < kws.length - 1 && probes.length < 4; i++) probes.push(`${kws[i]} ${kws[i + 1]}`);
  for (const k of kws.slice(0, 4)) if (!probes.includes(k)) probes.push(k);

  const byTitle = new Map<string, any>();
  for (const asked of probes.slice(0, 8)) {
    const { data, error } = await sb.rpc("search_credentials_any", { asked, result_limit: 3 });
    if (error || !data) continue;
    for (const r of data) {
      const prev = byTitle.get(r.unified_title);
      if (!prev || r.match_tier < prev.match_tier) byTitle.set(r.unified_title, r);
    }
  }
  if (byTitle.size === 0) return null;
  return [...byTitle.values()]
    .sort((a, b) => a.match_tier - b.match_tier || b.n_adopters - a.n_adopters)
    .slice(0, 4);
}

/**
 * Route COLLEGE-CRED — "what CPL can I get HERE?", answered from the CURATED
 * credential names rather than the raw titles colleges typed into MAP.
 *
 * THE FALSE ABSENCE THIS EXISTS TO END. Sam asked twice, once AFTER v42:
 * "I have a journey worker license as Iron and Steel worker. What CPL can I get
 * here?" — and was told there was nothing. Cerritos has THIRTEEN ironworker
 * credentials. The raw corpus calls them "FIW Orientation" and "IW- Mixed Base",
 * which contain no substring of "iron", so the college-scoped topic route
 * returned 0 and there was no other college-scoped route to fall back to.
 *
 * The curated layer knew the whole time: ten are named "Ironworker
 * Apprenticeship — …" and three more carry the issuer "Field Ironworkers
 * Local 416". A topic search over RAW titles and a topic search over CURATED
 * names are different questions, and the raw one must never be the only one
 * asked of a named college.
 */
async function fetchCollegeCredentials(
  query: string,
  college: string | null,
  sb: any,
): Promise<any[] | null> {
  if (!college) return null;
  const kws = extractTopicKeywords(query);
  if (kws.length === 0) return null;
  const probes: string[] = [];
  for (let i = 0; i < kws.length - 1 && probes.length < 4; i++) probes.push(`${kws[i]} ${kws[i + 1]}`);
  for (const k of kws.slice(0, 4)) if (!probes.includes(k)) probes.push(k);

  const byTitle = new Map<string, any>();
  for (const asked of probes.slice(0, 8)) {
    const { data, error } = await sb.rpc("search_college_credentials", {
      asked, college, result_limit: 8,
    });
    if (error || !data) continue;
    for (const r of data) {
      const prev = byTitle.get(r.unified_title);
      if (!prev || r.match_tier < prev.match_tier) byTitle.set(r.unified_title, r);
    }
  }
  if (byTitle.size === 0) return null;
  return [...byTitle.values()]
    .sort((a, b) => a.match_tier - b.match_tier ||
      a.unified_title.localeCompare(b.unified_title))
    .slice(0, 10);
}

// `recs` (v45) is the batched credit-recommendation map. OPTIONAL, and the
// credential names must render without it — see the caller, where this section is
// appended outside the enrichment try/catch on purpose.
//
// WHY THE LINES WERE ADDED (Sam, 2026-08-13, sierra_feedback 7e76cdeb).
// He asked the ironworker question a THIRD time, after v44 had already ended the
// false zero, and rated it DOWN with a different complaint than before:
// "You should have provided a list of courses I could get credit for and the
// industry certificates or licenses needed". He was right — this section listed
// credential NAMES and nothing else, so a student was told Cerritos awards CPL
// for "Ironworker Apprenticeship — General Rigging" and never learned that it is
// worth IWAP 40.09, 2 hours. The recommendations were already in
// chatbox_credential_recs; every one of the ironworker credentials carries a
// line. This route simply never asked for them, while the statewide, volume and
// adoption routes all did.
function buildCollegeCredentialContext(
  rows: any[] | null, college: string, recs?: Map<string, any> | null,
): string {
  if (!rows || rows.length === 0) return "";
  let out = `\n\n--- ${college.toUpperCase()} ALREADY AWARDS CPL FOR THESE (curated credential names) ---\n`;
  out += `These are ${college}'s OWN articulated credentials matching the question, read from the `
      + `curated catalogue rather than the freehand titles the college typed into MAP. State them `
      + `as established fact — this college awards credit for these today.\n`;
  out += `ANSWER WITH BOTH HALVES: name the CREDENTIAL (the certificate, licence or apprenticeship `
      + `stage the person needs to hold) AND the COURSES it converts into, with units, exactly as `
      + `listed beneath it. A visitor who is told only that "the college awards CPL for this" still `
      + `does not know what they would get. Where a credential below has no course lines, say the `
      + `college awards credit for it and that the specific course award is set at review — never `
      + `invent a course, and never drop the credential for lacking one.\n`;
  for (const r of rows) {
    out += `- ${r.unified_title}`;
    if (r.issuer) out += ` (issued by ${r.issuer})`;
    if (r.statewide) out += ` [statewide standard]`;
    out += `\n`;
    // Tier 5+ means the TITLE did not match — the issuer or the search text did.
    // Saying so keeps the model from claiming the college named it this way.
    if (r.match_tier >= 5) {
      out += `    (matched through the awarding body, not the credential's own title)\n`;
    }
    // Same renderer as every other credential route — deliberately not a local
    // variant, so the statewide/local distinction, the C-ID handling and the
    // repeated-C-ID note cannot drift between routes.
    if (recs) out += renderRecLines(recs.get(r.unified_title), "    ");
  }
  out += `⚠ The raw exhibit titles for these may be ABBREVIATED beyond recognition — Cerritos's `
      + `ironworker exhibits are literally recorded as "FIW Orientation" and "IW- Mixed Base". So a `
      + `topic search that finds nothing is NOT evidence the college lacks that CPL, and you must `
      + `never say a college has none of something when this section lists it.\n`;
  return out;
}

/**
 * Route CRED-VOLUME — how many students actually hold credit for a credential.
 *
 * This is the route that was missing when Sierra was asked "how many students
 * statewide are eligible for credit for a CompTIA cert, and for which certs?"
 * It answered that no statewide recommendation had been adopted (MAP holds TEN
 * for CompTIA) and then listed certs from general world knowledge. The listed
 * certs happened to be right, which is the most dangerous kind of wrong.
 *
 * Retrieval was never the problem — the credential lookup returns CompTIA
 * correctly. The gap was the one Sierra named honestly: no student numbers.
 *
 * Reuses the CRED-STD probe shape (pairs first, then singles) because credential
 * names are overwhelmingly multi-word.
 */
async function fetchCredentialVolume(query: string, sb: any): Promise<any[] | null> {
  const kws = extractTopicKeywords(query);
  if (kws.length === 0) return null;
  const probes: string[] = [];
  for (let i = 0; i < kws.length - 1 && probes.length < 4; i++) probes.push(`${kws[i]} ${kws[i + 1]}`);
  for (const k of kws.slice(0, 4)) if (!probes.includes(k)) probes.push(k);

  const byTitle = new Map<string, any>();
  for (const asked of probes.slice(0, 8)) {
    const { data, error } = await sb.rpc("search_credential_volume", { asked, result_limit: 6 });
    if (error || !data) continue;
    for (const r of data) {
      const prev = byTitle.get(r.unified_title);
      if (!prev || r.match_tier < prev.match_tier) byTitle.set(r.unified_title, r);
    }
  }
  if (byTitle.size === 0) return null;
  // Rank by students because the question is "how many" — but keep rows with no
  // student data, since "21 colleges adopted it and none has student data yet"
  // is a real answer to "which certs?".
  return [...byTitle.values()]
    .sort((a, b) => a.match_tier - b.match_tier ||
      (b.students ?? -1) - (a.students ?? -1) || b.colleges_adopted - a.colleges_adopted)
    .slice(0, 8);
}

/** Route COLLEGE-ADOPT — "what could MY college pick up that peers already run?" */
async function fetchAdoptionOpportunities(college: string | null, sb: any): Promise<any[] | null> {
  if (!college) return null;
  const { data, error } = await sb.rpc("college_adoption_opportunities", {
    college, result_limit: 8,
  });
  if (error || !data || data.length === 0) return null;
  return data;
}

/**
 * THE FULL CREDIT-RECOMMENDATION SET — chatbox_credential_recs, 2,205 rows.
 *
 * Until this existed, every credential route printed `ccc_rec`: ONE string,
 * the modal credit recommendation across a credential's articulation rows. For
 * POST Basic Academy that is "3 hours in Criminal Investigation", so Sierra
 * named ONE course when the statewide set is TEN lines. The Fact Sheet has
 * carried all ten publicly the whole time — a publish gap, never a build gap.
 *
 * Batched deliberately: the titles come from whatever route already matched, so
 * there is exactly one round-trip no matter how many routes fired, and no
 * second matcher that could drift from the first and attach recommendations to
 * a credential Sierra did not name.
 */
async function fetchCredentialRecs(titles: string[], sb: any): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  const uniq = [...new Set(titles.filter(Boolean))];
  if (uniq.length === 0) return out;
  const { data, error } = await sb.rpc("credential_recs_for_titles", { titles: uniq });
  if (error || !data) return out;
  for (const r of data) out.set(r.unified_title, r);
  return out;
}

// How many adopter names to print before summarising. A capped list must never
// read as a census, so past this we print the count alongside (see ADOPTER_CAP
// handling in buildCredentialContext).
const ADOPTER_CAP = 12;

/**
 * The adopter NAMES — the half Sierra never had (v47).
 *
 * THE FAILURE THIS ENDS. Sam, 2026-08-14, as a civic leader: "Our teens earned
 * an AWS D1.1 welding certificate with a practical test. Where can they get
 * college credit for it?" Sierra named Victor Valley and Orange Coast and told
 * him to go ASK whether they had adopted it. Bakersfield, Barstow, Orange Coast
 * and Santa Ana have all articulated AWS D1.1 SMAW — she never listed them, and
 * Victor Valley is not an adopter at all: it merely teaches welding.
 *
 * She was not disobeying. Every credential RPC reduces the array to a count —
 * `cardinality(c.adopter_colleges)::integer` — so the prompt said "Colleges that
 * have ADOPTED it: 4" and the four names did not exist anywhere in her context.
 * A team-guidance rule telling her to list them (written 13:33, tested 14:49)
 * could not be obeyed. **The data was curated, present and nightly-synced; the
 * consumer simply never read it** — the same shape as the statewide flag and
 * the `ccc_rec` retrieval gate before it.
 *
 * Keyed on titles ALREADY matched, so this is a lookup and not a second matcher
 * that can drift from the first — the reason it is a batched exact-key select
 * rather than another search RPC. Fails soft: no names is the status quo ante,
 * which is degraded but never wrong.
 */
async function fetchCredentialAdopters(titles: string[], sb: any): Promise<Map<string, AdopterRef[]>> {
  const out = new Map<string, AdopterRef[]>();
  const uniq = [...new Set(titles.filter(Boolean))];
  if (uniq.length === 0) return out;
  try {
    const { data, error } = await sb
      .from("chatbox_credentials")
      .select("unified_title, adopter_colleges")
      .in("unified_title", uniq);
    if (error || !data) return out;

    // NAMES FIRST, with url deliberately null. The landing pages below are
    // enrichment ON TOP of a complete answer — populating the map here means a
    // failure of the URL lookup degrades links, and can never DROP an adopter.
    // Same discipline as the credit-rec lines in #1165: a credential with no
    // line is still NAMED, because dropping it re-creates the false zero.
    const names = new Set<string>();
    for (const r of data) {
      if (Array.isArray(r.adopter_colleges) && r.adopter_colleges.length > 0) {
        out.set(r.unified_title, r.adopter_colleges.map((n: string) => ({ name: n, url: null })));
        for (const n of r.adopter_colleges) names.add(n);
      }
    }

    // Landing pages, batched over the union of adopters — one round trip for the
    // whole answer, not one per credential. Exact-key: measured 2026-08-14, all
    // 86 distinct adopter names match chatbox_college_profiles.college exactly
    // (both derive from the same MAP pipeline), and all 86 carry a URL. A name
    // that ever drifts simply resolves to null, which renders as "no landing
    // page on file" — the fail-safe the STATEWIDE_RULE already mandates
    // ("name the college without a link rather than guessing one").
    if (names.size > 0) {
      try {
        const { data: profs } = await sb
          .from("chatbox_college_profiles")
          .select("college, landing_page_url")
          .in("college", [...names]);
        const urls = new Map<string, string | null>(
          (profs || []).map((p: any) => [p.college, p.landing_page_url || null]),
        );
        for (const refs of out.values()) {
          for (const ref of refs) ref.url = urls.get(ref.name) || null;
        }
      } catch { /* names survive without their links — see above */ }
    }
  } catch { /* enrichment only — see doc comment */ }
  return out;
}

/**
 * Route ALIGN — "which of MY courses should I articulate against this, and how
 * did other colleges do it?"
 *
 * Sam, 2026-08-13: "I would want her to recommend the most aligned Cerritos
 * welding courses to be articulated so the faculty don't have to guess, and
 * have a link or access to the other college articulations for this same
 * welding certificate."
 *
 * One RPC returns BOTH signals, discriminated by row_kind, because they answer
 * different questions and neither is sufficient alone. Only fires when a
 * credential AND a college are both in play — "which of my courses" is
 * meaningless without a subject.
 */
async function fetchAlignment(
  credential: string | null,
  college: string | null,
  sb: any,
): Promise<any[] | null> {
  if (!credential || !college) return null;
  const { data, error } = await sb.rpc("credential_alignment_for_college", {
    credential, college, per_rec: 3,
  });
  if (error || !data || data.length === 0) return null;
  return data;
}

/**
 * THE PROPOSAL AND THE EVIDENCE, NEVER MERGED.
 *
 * `peer` rows are FACT — a college really did articulate that course against
 * that recommendation. `candidate` rows are a PROPOSAL computed from title
 * similarity, and title similarity is systematically blind to the broader-course
 * pattern (Santa Ana articulated `WELD 240 Structural Welding SMAW` against an
 * FCAW recommendation). Printing them in one list would let the model present a
 * guess with the authority of a precedent.
 *
 * `attribution: group_wide` means the source repeated ONE college list across
 * every course in the articulation, so we know which colleges articulated and
 * which courses were used but not which used which. Those are phrased as a
 * group, never as an attribution — sending a welding instructor to a peer that
 * never taught that course is the same failure as inventing an articulation.
 */
function buildAlignmentContext(rows: any[] | null, credential: string, college: string): string {
  if (!rows || rows.length === 0) return "";
  // No non-null assertions here: the test harness lifts this function out of the
  // .ts and strips type annotations, and `!` is indistinguishable from the JS
  // operator to a regex stripper. Reading the entry into a local is clearer
  // anyway.
  const byRec = new Map<string, { peers: any[]; cands: any[]; recCourse: string }>();
  for (const r of rows) {
    const k = r.credit_rec || "";
    let g = byRec.get(k);
    if (!g) {
      g = { peers: [], cands: [], recCourse: r.rec_course || k };
      byRec.set(k, g);
    }
    (r.row_kind === "peer" ? g.peers : g.cands).push(r);
  }

  let out = `\n\n--- ARTICULATING ${credential.toUpperCase()} AT ${college.toUpperCase()} ---\n`;
  out += `For each credit recommendation: ${college}'s own closest-matching courses, and how `
      + `other colleges articulated the SAME recommendation.\n`;

  for (const [rec, g] of byRec) {
    out += `\nRECOMMENDATION: ${rec}\n`;

    if (g.cands.length > 0) {
      // THE LADDER, and each rung is a different STRENGTH of evidence — say
      // which one a row came from. A C-ID match means the statewide course
      // identity already establishes the equivalence; a title match is strong
      // but lexical; "closest available" is a judgement call and must read as
      // one. Sam, 2026-08-13: C-ID first, then titles, then most aligned as a
      // last resort, qualified as our best judgement from the data we hold.
      const kind = g.cands[0]?.match_kind || "aligned";
      if (kind === "c_id") {
        out += `  ${college} ALREADY TEACHES A COURSE CARRYING THIS RECOMMENDATION'S C-ID `
            + `— the strongest match there is, because C-ID is the statewide course-identity `
            + `standard and the equivalence is therefore already established:\n`;
      } else if (kind === "title") {
        out += `  ${college}'s matching course by TITLE (no C-ID on either side to confirm it, `
            + `so faculty confirm the content):\n`;
      } else {
        out += `  No C-ID or title match at ${college}. CLOSEST AVAILABLE by wording — `
            + `these are a best judgement from the data we hold, not a determination, `
            + `and faculty should expect to reject some:\n`;
      }
      for (const c of g.cands) {
        out += `    - ${c.subject} ${c.course_number} — ${c.course_title}`;
        if (c.units != null) out += ` (${c.units} units)`;
        if (c.match_kind === "c_id" && c.course_cid) out += ` [C-ID ${c.course_cid}]`;
        out += `\n`;
        if (c.cid_title_divergent) {
          out += `      ⚠ The C-ID agrees but the NAMES do not. Say so plainly and let faculty `
              + `judge it — do NOT quietly drop the row and do NOT assert the courses are `
              + `equivalent. In this credential's data one C-ID is known to appear on two `
              + `different recommendation lines, which is an open question MAP has not settled.\n`;
        }
      }
    } else {
      // Sam, 2026-08-13: "when there is no match it would be helpful to show the
      // closest match you could find... unless if obviously wrong."
      //
      // The closest TRUE thing is the peer list below, not a nearest-by-wording
      // course. A recommendation reaches this branch only when NO course at this
      // college shares even one subject word with it — the scorer already returns
      // the best content match whenever one exists — so anything named here would
      // be a spelling coincidence. Measured: proposing one gave "Introduction to
      // Automotive Electrical" for POST's "Introduction to Policing".
      out += `  No ${college} course shares subject-matter wording with this recommendation. `
          + `Say that plainly and do NOT reach for the nearest-sounding course — a wrong `
          + `suggestion here costs more than an honest gap. Point instead at the peer courses `
          + `below as the concrete thing to look for: this college may well teach the same `
          + `content under a different name, and the peers show what that content is called `
          + `elsewhere.\n`;
    }

    if (g.peers.length > 0) {
      const exact = g.peers.filter((p) => p.attribution !== "group_wide");
      const group = g.peers.filter((p) => p.attribution === "group_wide");
      if (exact.length > 0) {
        // NEVER let a capped list read as a complete one. The RPC bounds peers
        // per recommendation (POST x Cerritos returned 3,807 peer rows before it
        // did, burying the candidates), and `peer_total` is what it actually
        // holds. Stating "9 of 261" is the difference between a sample and a
        // census — the silent-cap failure this repo keeps rediscovering.
        const shown = exact.length + group.length;
        const total = g.peers[0] && g.peers[0].peer_total;
        out += `  Colleges that ALREADY articulate this recommendation, and the course each used`;
        if (total && total > shown) {
          out += ` — showing ${shown} of ${total} articulated course entries, so say "for example" `
              + `or "among others" and never present this as the full list`;
        }
        out += `:\n`;
        for (const p of exact) {
          out += `    - ${p.college_name}: ${p.subject} ${p.course_number} — ${p.course_title}\n`;
        }
      }
      if (group.length > 0) {
        const cols = [...new Set(group.map((p) => p.college_name))];
        const courses = [...new Set(group.map((p) => `${p.subject} ${p.course_number} — ${p.course_title}`))];
        out += `  Also articulated by ${cols.join(", ")} using courses such as `
            + `${courses.join("; ")} — our source does not record which college used which, `
            + `so name them as a group and do NOT pair a college to a course here.\n`;
      }
    } else {
      out += `  No college has articulated this recommendation yet — this college would be first.\n`;
    }
  }
  return out;
}

/**
 * Render one credential's recommendation lines.
 *
 * LEAD WITH THE LIST, NEVER A COUNT. POST carries AJ 110 on two different lines
 * ("Intro to Administration of Justice" and "Physical Training and Health
 * Education"), so it has 10 lines, 9 of them carrying a C-ID, but only 8
 * DISTINCT C-IDs. Any single number is therefore contestable and a bare count
 * invites the model to state the one that happens to be wrong. Sam's ruling on
 * the repeat: "AJ 110 may be C-ID and it is Elective" — it is FLAGGED, never
 * auto-resolved, because resolving it is a curriculum judgement and not ours.
 *
 * Two row shapes, one per rec_kind:
 *   statewide_authoritative — {cid, title, units, credit}, from the Fact Sheet
 *                             builder, so Sierra cannot drift from the public
 *                             document.
 *   local_modal             — {cid, credit, colleges, example_course}, the most
 *                             common local awards with the college count behind
 *                             each, which is what makes them weighable.
 */
function renderRecLines(rec: any, indent = "  "): string {
  if (!rec || !Array.isArray(rec.recs) || rec.recs.length === 0) return "";
  const statewide = rec.rec_kind === "statewide_authoritative";
  let out = "";

  if (statewide) {
    out += `${indent}STATEWIDE CREDIT RECOMMENDATIONS — the full set, ${rec.n_recs} line(s). `
        + `LIST THESE; do not summarise them as a number:\n`;
  } else {
    out += `${indent}CREDIT RECOMMENDATIONS AT ADOPTING COLLEGES — no statewide set exists for this `
        + `credential, so these are the most common LOCAL awards (${rec.n_recs} line(s)), with the `
        + `number of colleges behind each:\n`;
  }

  for (const line of rec.recs) {
    const label = line.title || line.credit || "(unnamed)";
    out += `${indent}  • `;
    out += line.cid ? `C-ID ${line.cid} — ` : (statewide ? `(no C-ID, elective) — ` : "");
    out += label;
    if (line.units) out += ` — ${line.units} unit(s)`;
    if (line.title && line.credit && line.credit !== line.title) out += ` [${line.credit}]`;
    if (line.colleges) out += ` — ${line.colleges} college(s) award this`;
    if (line.example_course) out += ` (e.g. ${line.example_course})`;
    out += `\n`;
  }

  if (statewide && Array.isArray(rec.cid_repeats) && rec.cid_repeats.length > 0) {
    out += `${indent}NOTE — ${rec.cid_repeats.join(", ")} appears on more than one line above. `
        + `That is why the counts differ: ${rec.n_recs} recommendation lines, ${rec.n_cid_lines} `
        + `carrying a C-ID, ${rec.n_cid_recs} DISTINCT C-IDs. Report the lines exactly as listed and `
        + `mention the repeat if you give a count at all. Do NOT silently merge the lines or pick one `
        + `count as the true one — whether that repeat is an error is a curriculum question MAP has `
        + `not settled.\n`;
  }
  return out;
}

/**
 * THE FLOOR TRAVELS WITH THE NUMBER. Only ~4% of student rows can be named at
 * all (the exhibit corpus covers 59 of MAP's 123 colleges), so every count here
 * is a floor. Emitting `students` without `colleges_adopted` would let the model
 * state a floor as a system total — the same failure as reading "not in this
 * dataset" as zero. So the two are printed on the same line, always.
 */
function buildVolumeContext(
  vol: any[] | null,
  adopt: any[] | null,
  college: string | null,
  recs?: Map<string, any>,
): string {
  if ((!vol || vol.length === 0) && (!adopt || adopt.length === 0)) return "";
  let out = `\n\n--- STUDENT VOLUME BY CREDENTIAL (measured from MAP student records) ---\n`;

  if (vol && vol.length > 0) {
    for (const r of vol) {
      out += `- ${r.unified_title}`;
      if (r.statewide) out += ` [statewide recommendation]`;
      out += `\n`;
      if (r.students != null) {
        out += `  Students with this credit: AT LEAST ${r.students}, across ${r.colleges_with_student_data} college(s)\n`;
        if (r.potential_units != null) {
          out += `  Units: ${r.potential_units} recommended`;
          if (r.applied_units != null) out += `, ${r.applied_units} already applied to a record`;
          out += `\n`;
        }
        if (r.rows_needs_action) out += `  Recommendations still at "Needs Action": ${r.rows_needs_action}\n`;
      } else if (r.students_suppressed) {
        out += `  Students with this credit: FEWER THAN 10 — report it exactly that way, never an exact number and never an estimate.\n`;
      } else {
        out += `  No student records carry this credential yet.\n`;
      }
      out += `  Colleges that have ADOPTED it: ${r.colleges_adopted}`
          + ` (we can see student data at ${r.colleges_with_student_data} of them)\n`;
    }
    out += `\nHOW TO STATE THESE: the student counts are FLOORS, not totals. We can name a credential `
        + `for only about 4% of student records, because the exhibit corpus covers 59 of MAP's 123 `
        + `colleges. Always give the count WITH its coverage — "at least N students across X colleges; `
        + `Y colleges have adopted it, so the real figure is higher." A college we cannot see is a `
        + `BLIND SPOT, never a zero.\n`;
  }

  if (adopt && adopt.length > 0) {
    const who = college ? college.toUpperCase() : "THIS COLLEGE";
    // TWO BANDS, TWO DIFFERENT CLAIMS — never merge them into one list. Saying
    // "N peers already articulate it" about a credential with zero adopters
    // fabricates a route, which is the failure the catalogue loader guards
    // against by keeping adopter_colleges and potential_colleges disjoint.
    const peerBand = adopt.filter((r) => r.band !== "ready_to_adopt");
    const readyBand = adopt.filter((r) => r.band === "ready_to_adopt");

    if (peerBand.length > 0) {
      out += `\nWHAT ${who} COULD ADOPT — already running at peer colleges `
          + `(peers teach the course and have articulated it; this college has not):\n`;
      for (const r of peerBand) {
        out += `- ${r.unified_title}`;
        if (r.statewide) out += ` [statewide standard — adoptable as-is]`;
        out += ` — ${r.peers_already_adopted} peer college(s) already articulate it\n`;
        const lines = renderRecLines(recs?.get(r.unified_title), "    ");
        if (lines) out += lines;
        else if (r.ccc_rec) out += `    Statewide recommendation: ${r.ccc_rec}\n`;
      }
    }

    if (readyBand.length > 0) {
      out += `\nREADY TO ADOPT — statewide standards NO college has taken up yet:\n`;
      for (const r of readyBand) {
        out += `- ${r.unified_title}`;
        if (r.issuer) out += ` (issued by ${r.issuer})`;
        out += `\n`;
        const lines = renderRecLines(recs?.get(r.unified_title), "    ");
        if (lines) out += lines;
      }
      out += `These are NOT a lesser tier and their zero adopter count is NOT a quality signal. `
          + `MAP creates statewide exhibits ahead of demand so the credit is ready when a student `
          + `arrives, which means ${who} would be the FIRST to offer them — the credit is already `
          + `defined, so adopting is a local curriculum decision rather than a negotiation. `
          + `Present them as concrete openings, and never imply they were passed over.\n`;
    }

    out += `These are concrete, checkable opportunities — name them specifically rather than `
        + `describing the category.\n`;
  }
  return out;
}

/**
 * Render the adopter names for one credential, or the bare count if we have no
 * names. NAMES FIRST, because "4 colleges have adopted it" is unusable to a
 * person deciding where to send their kid, while four names with landing pages
 * is the answer. Capped at ADOPTER_CAP and the total always shipped alongside,
 * so a truncated list can never read as the whole set.
 */
// `Array<AdopterRef>` rather than `AdopterRef[]` ON PURPOSE — do not "tidy" it.
// This function sits inside the region tests/lib/lift_ts.js evaluates as plain
// JS, and its stripper removes `: Array<...>` (Array is in its generic list)
// but NOT a bare `: SomeCustomType[]`. Widening that stripper to accept any
// identifier is unsafe — it would also eat the `:` in ordinary object literals
// like `{ college: name }` — which is exactly why it allowlists instead.
function renderAdopters(n: number, refs?: Array<AdopterRef>, indent = "  ", local = false): string {
  if (!refs || refs.length === 0) {
    // No names available — say the count, and say plainly that the names are
    // missing rather than letting the model infer they do not exist.
    return `${indent}Colleges that have ADOPTED it: ${n}`
         + ` (names unavailable for this credential — do NOT guess which colleges they are)\n`;
  }
  const shown = refs.slice(0, ADOPTER_CAP);
  const suffix = refs.length > shown.length
    ? ` — showing ${shown.length} of ${refs.length}`
    : ``;
  // ONE PER LINE, name and URL paired. STATEWIDE_RULE asks for a
  // "college | credit | CPL landing page" table; a comma-joined name list gives
  // the model no URL to put in the third column, so it correctly left the cell
  // empty rather than guessing. The pairing has to be unambiguous per row.
  let out = `${indent}Colleges that have ADOPTED it (${refs.length})${suffix}:\n`;
  for (const a of shown) {
    out += `${indent}  - ${a.name}`
        + (a.url
            ? ` — CPL landing page: ${a.url}\n`
            : ` — no CPL landing page on file; name this college WITHOUT a link\n`);
  }
  out += `${indent}^ These colleges have ALREADY articulated this credential. Name them when asked `
       + `where credit can be obtained, even if you do not know where the person is — let them `
       + `decide what is near, and link each college's CPL landing page where one is given above.\n`;
  // The anti-ownership guard is a STATEWIDE claim and must not be pasted onto a
  // local articulation, which genuinely does belong to the college that built it.
  out += local
    ? `${indent}  This is a LOCAL articulation: the credit exists at these colleges specifically. `
      + `Do NOT describe it as a statewide standard other colleges can adopt as-is.\n`
    : `${indent}  They are NOT the owners of the standard; they are the colleges `
      + `that have taken it up so far.\n`;
  return out;
}

function buildCredentialContext(
  statewide: any[] | null,
  any_: any[] | null,
  recs?: Map<string, any>,
  adopters?: Map<string, AdopterRef[]>,
): string {
  if ((!statewide || statewide.length === 0) && (!any_ || any_.length === 0)) return "";
  let out = `\n\n--- CANONICAL CREDENTIAL RECORD (curated names, not the freehand titles colleges typed) ---\n`;

  if (statewide && statewide.length > 0) {
    out += `STATEWIDE credit recommendations (ASCCC Pathways to Credit) matching this question:\n`;
    for (const r of statewide) {
      out += `- ${r.unified_title}`;
      if (r.issuer) out += ` (issued by ${r.issuer})`;
      out += `\n`;
      const full = recs?.get(r.unified_title);
      const lines = renderRecLines(full);
      if (lines) {
        out += lines;
      } else if (r.ccc_rec) {
        // Fallback only. ccc_rec is the modal single line across a credential's
        // articulations — a summary of the record, not the record.
        out += `  Statewide recommendation: ${r.ccc_rec}\n`;
      }
      // ZERO ADOPTERS IS A SHELF ITEM, NOT AN ABSENCE. These credentials were
      // unreachable until 2026-08-13: ccc_rec is derived from adoptions, so a
      // never-adopted exhibit had none, and the CRED-STD gate required one.
      if (r.n_adopters === 0) {
        out += `  Colleges that have ADOPTED it: NONE YET. MAP publishes statewide exhibits `
            + `BEFORE any college takes them up, deliberately, so the credit is ready when a `
            + `student arrives. Present this as an open opportunity — a standard any college can `
            + `adopt as-is — NEVER as the credential being unavailable, unsupported or a dead end.\n`;
      } else {
        out += renderAdopters(r.n_adopters, adopters?.get(r.unified_title));
      }
      if (r.matched_via && r.matched_via !== r.unified_title) {
        out += `  (matched on the college-entered variant "${r.matched_via}")\n`;
      }
    }
    out += `A statewide recommendation is a system-wide standard. Any college can adopt it; `
        + `the adopter count is how many already have, NOT a limit on where it is available.\n`;
  } else {
    out += `NO STATEWIDE RECOMMENDATION matches this question. Say that plainly — do NOT `
        + `substitute a different credential that happens to look similar.\n`;
  }

  if (any_ && any_.length > 0) {
    const locals = any_.filter((r) => !r.statewide);
    if (locals.length > 0) {
      out += `\nIn the credential catalogue but NOT adopted statewide (local articulations only):\n`;
      for (const r of locals) {
        out += `- ${r.unified_title} — ${r.n_adopters} college(s) articulate it locally\n`;
        // The LOCAL branch printed a bare count and no names at all — so a
        // question like "where can my teen get credit for AWS D1.1?" silently
        // dropped Lemoore and Riverside while naming the statewide four. For a
        // local credential the adopters ARE where the credit exists, so the
        // names matter at least as much here. Same batch, already fetched.
        if (r.n_adopters > 0) {
          out += renderAdopters(r.n_adopters, adopters?.get(r.unified_title), "    ", true);
        }
        out += renderRecLines(recs?.get(r.unified_title), "    ");
      }
    }
  }
  return out;
}

function buildCreditContext(cs: any): string {
  if (!cs) return "";
  const s = cs.statewide;
  let out = `\n\n--- CPL CREDIT DISPOSITION (what colleges have ACTED on${cs.asOf ? `, as of ${cs.asOf}` : ""}) ---\n`;
  out += `Statewide, across ${cs.collegesWithData} colleges with credit data:\n`;
  out += `- Credit recommended but not yet acted on ("Needs Action"): ${fmtN(s.dormant)} units\n`;
  out += `- Of that, ALREADY ARTICULATED and simply waiting on a decision: ${fmtN(s.ready)} units\n`;
  out += `- Applied to a student record: ${fmtN(s.applied)} units; of those, transcribed: ${fmtN(s.transcribed)} units`;
  out += s.transcribedPct != null ? ` (${s.transcribedPct}%)\n` : `\n`;
  out += `- CPL students represented: ${fmtN(s.students)}\n`;
  if (cs.goal2.length > 0) {
    const tot = cs.goal2.reduce((a, g) => a + g.rows, 0);
    out += `Where awarded credit LANDS (Sprint goal 2): `
      + cs.goal2.map((g) => `${g.dest} ${tot > 0 ? Math.round((g.rows / tot) * 1000) / 10 : 0}%`).join(" · ") + `\n`;
  }

  if (cs.college) {
    const c = cs.college;
    out += `\nAt ${c.name} specifically:\n`;
    if (c.suppressed) {
      out += `- Fewer than 10 CPL students — the breakdown is withheld to protect their privacy. Confirm that CPL activity exists there, give no figures, and do not estimate.\n`;
    } else {
      out += `- CPL students: ${fmtN(c.students)}\n`;
      out += `- Credit recommended, not yet acted on: ${fmtN(c.dormant)} units\n`;
      out += `- Of that, ALREADY ARTICULATED and waiting on a decision: ${fmtN(c.ready)} units\n`;
      out += `- Applied: ${fmtN(c.applied)} units; transcribed: ${fmtN(c.transcribed)} units\n`;
      const g2 = c.goal2.filter((g) => !g.suppressed && g.rows != null);
      if (g2.length > 0) {
        out += `- Awarded credit lands as: ${g2.map((g) => `${g.dest} (${fmtN(g.rows)} awards)`).join(" · ")}\n`;
      }
    }
  } else if (cs.collegeHasNoRow && cs.collegeAsked) {
    out += `\nNOTE: there is no credit-disposition data for ${cs.collegeAsked} in this dataset `
      + `(it covers ${cs.collegesWithData} institutions). Say so plainly rather than implying zero — `
      + `"zero credit awarded" and "not in this dataset" are completely different statements.\n`;
  }
  return out;
}

// Proximity band for ranking: same county (2) > same region (1) > elsewhere (0).
// Returns 0 for every college when no home college is known, which leaves the
// pre-existing volume ordering untouched.
function proximityBand(geo: any | null, askedGeo: any | null): number {
  if (!askedGeo || !geo) return 0;
  if (askedGeo.county && geo.county && geo.county === askedGeo.county) return 2;
  if (askedGeo.region && geo.region && geo.region === askedGeo.region) return 1;
  return 0;
}

// "Riverside County, Inland Empire" — the label that lets the model actually say
// "nearby" instead of guessing from a college name.
function geoLabel(geo: any | null): string {
  if (!geo || (!geo.county && !geo.region)) return "";
  return ` (${[geo.county && geo.county + " County", geo.region].filter(Boolean).join(", ")})`;
}

// ── Build offerings context (what colleges TEACH — the adoption basis) ──────────
function buildOfferingsContext(
  offerings: any[],
  askedCollege: string | null,
  askedGeo: any | null,
  coreKeywords: string[] = [],
  geoMap: Map<string, any> | null = null,
): string {
  if (!offerings || offerings.length === 0) return "";

  // A row is a CORE-discipline match when a query keyword appears in its TOP-program
  // title (the clean discipline label), vs a tangential titles-blob-only match — so
  // "Construction Crafts Technology" counts, "Architecture" (which merely mentions
  // construction in course text) does not. Used to decide whether a college really
  // teaches the discipline vs just has a related program.
  const isCore = (o: any) => {
    const t = (o.top_title || "").toLowerCase();
    return coreKeywords.some((k) => k.length >= 4 && t.includes(k));
  };

  // Group by college; sum course counts across matching TOP programs.
  const byCollege = new Map<string, { rows: any[]; courses: number; core: boolean; region: string | null; county: string | null }>();
  for (const o of offerings) {
    const fb = geoMap?.get(o.college) || null;
    const g = byCollege.get(o.college) || {
      rows: [], courses: 0, core: false,
      region: o.region || fb?.region || null,
      county: o.county || fb?.county || null,
    };
    g.rows.push(o);
    g.courses += o.course_count || 0;
    if (isCore(o)) g.core = true;
    byCollege.set(o.college, g);
  }

  // Rank: colleges that teach the CORE discipline first, then proximity to the
  // asked college (same county > same region), then how much they teach.
  //
  // The bands are spread far enough apart to be strictly lexicographic
  // (core > county > region > volume). They used to be 200/100/40 against a
  // volume term of `min(courses, 39)` — so a college in another region with 39+
  // courses scored 239 and a same-region college with none scored 240. One point
  // apart is not an ordering, it is a coin flip, and volume won it often enough
  // to matter. Volume is now only ever a tie-breaker WITHIN a proximity band.
  const rank = (g: any) => {
    const p = (g.core ? 1000 : 0) + proximityBand(g, askedGeo) * 100;
    return p + Math.min(g.courses, 39);
  };

  const askedRaw = askedCollege ? byCollege.get(askedCollege) : null;
  // Only treat the asked college as "teaches this" when it has a CORE match.
  const asked = askedRaw && askedRaw.core ? askedRaw : null;
  const others = [...byCollege.entries()]
    .filter(([c]) => c !== askedCollege)
    .sort((a, b) => rank(b[1]) - rank(a[1]));

  const fmtCollege = (college: string, g: any) => {
    let s = `\n## ${college}${geoLabel(g)}`;
    s += ` — teaches ${g.courses} course(s) in this area:\n`;
    for (const o of g.rows.slice(0, 4)) {
      s += `  - ${o.top_title || o.top_code} (${o.course_count} course(s)`;
      if (o.cid_count > 0) s += `, ${o.cid_count} with a C-ID`;
      s += `)`;
      const samples = (o.sample_courses || []).slice(0, 3)
        .map((c: any) => `${c.code} ${c.title}`.trim()).filter(Boolean);
      if (samples.length) s += `: ${samples.join("; ")}`;
      s += `\n`;
    }
    return s;
  };

  let ctx = "\n\n--- Course Catalog: WHICH COLLEGES TEACH THIS (COCI offerings — what a college teaches, NOT whether it has a CPL articulation yet) ---\n";
  ctx += `${byCollege.size} college(s) shown below currently teach course(s) in this area (TOP matches — NOT an exhaustive list; more colleges may teach it).\n`;

  if (askedCollege) {
    if (asked) {
      ctx += `\n### ${askedCollege} DOES teach this discipline — strong candidate to ADOPT a CPL articulation:`;
      ctx += fmtCollege(askedCollege, asked);
    } else if (askedRaw) {
      ctx += `\n### ${askedCollege} teaches only RELATED programs (not the core discipline) — mention these lightly, then point to the nearest colleges that teach the core discipline (below):`;
      ctx += fmtCollege(askedCollege, askedRaw);
    } else {
      ctx += `\n### ${askedCollege} does NOT appear to teach courses in this area in the current COCI catalog — point to the nearest colleges that do (below).\n`;
    }
  }

  if (others.length) {
    ctx += `\n### ${askedCollege ? "Other colleges" : "Colleges"} that teach this (nearest first when a home college is known):\n`;
    for (const [college, g] of others.slice(0, 10)) ctx += fmtCollege(college, g);
    if (others.length > 10) ctx += `\n  ... and ${others.length - 10} more college(s) teach in this area.\n`;
  }
  return ctx;
}

// ── Build topic context (organized by college) ─────────────────
function buildTopicContext(
  results: any[],
  isCollegeSpecific: boolean = false,
  geoMap: Map<string, any> | null = null,
  askedGeo: any | null = null,
): string {
  if (!results || results.length === 0) return "";

  // Separate statewide (CCC) exhibits from local ones
  const statewideExhibits = results.filter((r) => r.collaborative_type === "CCC");
  const localExhibits = results.filter((r) => r.collaborative_type !== "CCC");

  // Group local results by college
  const byCollege = new Map<string, any[]>();
  for (const r of localExhibits) {
    const list = byCollege.get(r.college) || [];
    list.push(r);
    byCollege.set(r.college, list);
  }

  // Group statewide by college too (for display)
  const statewideByCollege = new Map<string, any[]>();
  for (const r of statewideExhibits) {
    const list = statewideByCollege.get(r.college) || [];
    list.push(r);
    statewideByCollege.set(r.college, list);
  }

  const totalExhibits = results.length;
  const totalColleges = new Set(results.map((r) => r.college)).size;
  const totalRecs = results.reduce((sum, r) => sum + (r.rec_count || 0), 0);

  let ctx = "\n\n--- Topic Search Results: Matching CPL Exhibits ---\n";
  ctx += `Found ${totalExhibits} matching exhibit(s) across ${totalColleges} college(s) with ${totalRecs} total credit recommendation(s).\n`;

  if (statewideExhibits.length > 0) {
    // Statewide (CCC) standards are NOT housed at any one college — the same
    // standard appears in the data under every college that has it, so dedupe by
    // title and do NOT attribute it to one college / one landing page (see the
    // STATEWIDE rule in the system prompt).
    const seenStatewide = new Set<string>();
    ctx += `\n### STATEWIDE COLLABORATIVE (CCC) STANDARDS — system-wide, adopted/adapted by local colleges (not housed at one college)\n`;
    for (const ex of statewideExhibits) {
      const titleKey = (ex.exhibit_title || "").toLowerCase().trim();
      if (seenStatewide.has(titleKey)) continue;
      seenStatewide.add(titleKey);
      ctx += `  - ${ex.exhibit_title} [Statewide Collaborative]`;
      if (ex.discipline) ctx += ` [${ex.discipline}]`;
      ctx += `\n`;
      if (ex.sample_credit_recs && ex.sample_credit_recs.length > 0) {
        ctx += `    Eligible courses (title — units/credit): ${ex.sample_credit_recs.slice(0, 12).join("; ")}`;
        if (ex.rec_count > ex.sample_credit_recs.length) ctx += ` ... and more`;
        ctx += `\n`;
      }
    }
  }

  if (byCollege.size > 0) {
    // Sort colleges NEAREST FIRST when a home college is known (same county, then
    // same region), and only then by how many exhibits they hold.
    //
    // This list used to be ordered by volume alone, because search_exhibits_by_topic
    // returns no geography — so an LA Harbor question led with Norco (Riverside,
    // ~50 mi) ahead of five colleges in LA Harbor's own county, and a Sacramento
    // question was offered peers in Orange and Riverside counties. The exhibits are
    // the PROOF ("a peer college already did this"), so a peer 400 miles away is a
    // materially worse answer than a neighbour with fewer exhibits. With no home
    // college in the question, askedGeo is null, every band is 0, and the ordering
    // stays exactly as it was — most exhibits first.
    const geoOf = (c: string) => (geoMap ? geoMap.get(c) || null : null);
    const sortedColleges = [...byCollege.entries()].sort((a, b) =>
      (proximityBand(geoOf(b[0]), askedGeo) - proximityBand(geoOf(a[0]), askedGeo)) ||
      (b[1].length - a[1].length));

    ctx += `\n### LOCAL EXHIBITS by college${askedGeo ? " (nearest first)" : ""}\n`;

    for (const [college, exhibits] of sortedColleges) {
      const url = exhibits[0]?.landing_page_url;
      const collegeRecTotal = exhibits.reduce((sum: number, e: any) => sum + (e.rec_count || 0), 0);
      ctx += `\n## ${college}${geoLabel(geoOf(college))} — ${exhibits.length} exhibit(s), ${collegeRecTotal} credit recommendation(s)`;
      if (url) ctx += ` | CPL Landing Page: ${url}`;
      ctx += `\n`;

      // Show up to 8 exhibits per college
      for (const ex of exhibits.slice(0, 8)) {
        ctx += `  - ${ex.exhibit_title}`;
        if (ex.discipline) ctx += ` [${ex.discipline}]`;
        ctx += `\n`;
        if (ex.sample_credit_recs && ex.sample_credit_recs.length > 0) {
          ctx += `    Eligible courses (title — units/credit): ${ex.sample_credit_recs.slice(0, 8).join("; ")}`;
          if (ex.rec_count > ex.sample_credit_recs.length) ctx += ` ... and more`;
          ctx += `\n`;
        }
      }
      if (exhibits.length > 8) {
        ctx += `  ... and ${exhibits.length - 8} more exhibit(s) at this college\n`;
      }
    }
  }

  return ctx;
}

// ── Live CPL contacts (v45, 2026-08-13) ────────────────────────
// WHY THIS READS map_college_contacts AND NOT THE PROFILE ROW.
// chatbox_college_profiles.contacts is a ONE-OFF SNAPSHOT taken 2026-06-25, and
// nothing refreshes it — map/sync_map_users.py WRITES map_college_contacts and
// only READS the profiles table (for dashboard URLs). There is no builder for
// that JSONB anywhere in the repo. Measured the day this landed, over the 122
// colleges present in both: Sierra printed a DIFFERENT email than MAP holds for
// 41, and was SILENT for 13 more where MAP had someone. Only 50 agreed.
// Sam reported it as "Wrong contact information for RCC" — RCC was one of the
// 41 (she named Rene Felix; MAP holds Jeanine Gardner as primary contact and
// Lisa Martin as CPL coordinator, whose slot the snapshot has blank).
// Reading live ends the staleness class rather than re-freezing a new snapshot.
//
// Leadership roles (VPAA / VPSS / CEO / senate president / certifying official)
// are deliberately ABSENT from the cascade. The MAP Users workstream classified
// the colleges that have only those as "leadership-only", i.e. NOT routable for
// a student's CPL request — sending a CPL question to a college president is
// worse than saying we do not know who to ask. 115 of 122 route without them.
const CONTACT_CASCADE: Array<[string, string, string]> = [
  ["cpl_coordinator",      "cpl_coordinator_email",      "CPL Coordinator"],
  ["primary_contact",      "primary_contact_email",      "CPL Contact"],
  ["",                     "cpl_assistant_email",        "CPL Office"],
  ["cpl_counselor",        "cpl_counselor_email",        "CPL Counselor"],
  ["articulation_officer", "articulation_officer_email", "Articulation Officer"],
  ["lead_initiator",       "lead_initiator_email",       "CPL Lead"],
  ["faculty_lead",         "faculty_lead_email",         "Faculty Lead"],
];

const CONTACT_COLUMNS = [
  "college",
  ...CONTACT_CASCADE.flatMap(([n, e]) => (n ? [n, e] : [e])),
].join(",");

// 22 of the 115 routable colleges carry MULTIPLE people in one field, separated
// by semicolons, commas or embedded newlines. Cypress College's coordinator slot
// is the worst of them and shows why the address is validated rather than merely
// split: "jgarcia@cypresscollege.edu, jrangel@cypresscollege,\njgrande@..." —
// the middle address has no TLD. Sending a student to an address that cannot
// receive mail is a false route, the same class of harm as the false zero.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

function firstEmail(raw: any): string {
  for (const part of String(raw ?? "").split(/[;,\n]/)) {
    const v = part.trim();
    if (v && v.toUpperCase() !== "NA" && EMAIL_RE.test(v)) return v;
  }
  return "";
}

function firstName(raw: any): string {
  const v = String(raw ?? "").split(/[;,\n]/)[0].trim();
  return v && v.toUpperCase() !== "NA" ? v : "";
}

// A tier must yield the name and the email OF THE SAME PERSON. The pre-v45 code
// picked them with two independent `||` fallbacks, so a tier holding a name but
// no email silently paired that name with a different person's address. Zero
// colleges hit that today — it is a latent hazard, closed here rather than left
// waiting for the data to drift into it.
// Returns `{ name, email, role }` or null. Annotated `any` rather than with the
// object literal because tests/lib/lift_ts.js strips only primitive and generic
// annotations, and its own note says to fix the block, not widen the regexes.
function resolveLiveContact(row: any): any {
  if (!row) return null;
  for (const [nameCol, emailCol, role] of CONTACT_CASCADE) {
    const email = firstEmail(row[emailCol]);
    if (!email) continue;
    return { name: nameCol ? firstName(row[nameCol]) : "", email, role };
  }
  return null;
}

// Both sides of the join are normalised. MAP's college names are hand-typed and
// two REAL colleges carry a trailing space — "Cypress College " and "San Jose
// City College " — so an exact-match lookup drops them silently and they fall
// back to the stale snapshot, which is precisely the bug this function exists to
// end. The table is ~123 rows, so it is fetched whole and keyed in memory.
async function fetchLiveContacts(sb: any): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  try {
    const { data } = await sb.from("map_college_contacts").select(CONTACT_COLUMNS);
    for (const row of data || []) {
      const c = resolveLiveContact(row);
      if (c) out.set(String(row.college ?? "").trim().toLowerCase(), c);
    }
  } catch (_e) {
    // Fail SAFE — on any error the caller keeps the profile's own snapshot, so
    // this can never be worse than the pre-v45 behaviour it replaces.
  }
  return out;
}

// Overlays the live contact onto whatever shape the caller resolved (single
// profile or array). Skipped entirely when contacts are suppressed, so the
// external/vendor embeds pay nothing for a line they never print.
async function withLiveContacts(profile: any, sb: any, includeContacts: boolean): Promise<any> {
  if (!profile || !includeContacts) return profile;
  const live = await fetchLiveContacts(sb);
  if (live.size === 0) return profile;
  const attach = (p: any) => {
    const c = p && live.get(String(p.college ?? "").trim().toLowerCase());
    return c ? { ...p, live_contact: c } : p;
  };
  return Array.isArray(profile) ? profile.map(attach) : attach(profile);
}

// includeContacts (v27): false suppresses the CPL-contact name/email line —
// the external/vendor embeds (ctx:"external"). Default true = every existing
// caller unchanged (fail-open).
function buildCollegeContext(profile: any, includeContacts: boolean = true): string {
  if (!profile) return "";
  const profiles = Array.isArray(profile) ? profile : [profile];

  /* ⭐ A CANDIDATE LIST MUST SAY THAT IT IS ONE.
   *
   * Sam, 2026-08-21: asked what LACCD should do, Sierra answered "Three LACCD
   * colleges appear in the MAP platform data" and listed three — while closing
   * the same answer with "across all nine LACCD colleges". Nothing was missing
   * from the data: all nine are in map_colleges and all nine are in
   * chatbox_college_profiles. The three were a `.slice(0, 3)` on the tie list,
   * and this function then rendered them as three equal "--- College Profile"
   * blocks with no statement of what the set WAS. Three profile blocks and a
   * roster of three are indistinguishable once they reach the model.
   *
   * ⚠ THIS PARAGRAPH, NOT THE RAISED CAP, IS THE FIX. A larger cap without it
   * would have produced "Nine colleges appear in the MAP platform data" — still
   * a name match presented as MAP's contents, still false, and harder to spot
   * because nine happens to be right for LACCD and would be wrong for every
   * district whose colleges are not all named after it.
   *
   * The rule is the repo's own, from the alignment work, unapplied here until
   * now: a capped list must never read as a census, and the total ships
   * alongside the shown count. */
  let head = "";
  if (profiles.length > 1) {
    const m = (profiles[0] && profiles[0]._match) || null;
    const n = profiles.length;
    head = `\n\n⚠ THE ${n} COLLEGE PROFILES BELOW ARE NAME-MATCH CANDIDATES, NOT A ROSTER.\n`
         + `They are colleges whose NAME contains a word from the question`
         + (m && m.words && m.words.length ? ` (matched on: ${m.words.join(", ")})` : "")
         + `, drawn from the 100+ colleges in MAP.`
         + (m && m.total > m.shown ? ` ${m.shown} of ${m.total} matches are shown.` : "")
         + `\n`
         + `This is NOT the set of colleges in any district, system, region or group, `
         + `and NOT the set of colleges "in MAP" or "in the MAP data".\n`
         + `Do NOT write "${n} colleges appear in the MAP platform data", and do not write `
         + `any sentence presenting this set as complete or as a district's membership.\n`
         + `⚠ THIS ASSISTANT CANNOT ENUMERATE A DISTRICT. District membership is not stored `
         + `in anything it can read. If the question named a district, system or group, say so `
         + `plainly and briefly, then use these profiles as EXAMPLES — describing them as `
         + `colleges whose names matched, never as "the colleges in" that group. Do not guess `
         + `the group's membership from general knowledge and do not imply the counts below `
         + `cover it.\n`;
  }

  return head + "\n\n" + profiles.map((p: any) => {
    let ctx = `--- College Profile: ${p.college} ---\n`;
    ctx += `Exhibits: ${p.total_exhibits} | Credit recommendations: ${p.total_credit_recs} | Disciplines: ${p.discipline_count}\n`;

    if (p.cpl_types && Object.keys(p.cpl_types).length > 0) {
      ctx += `CPL types: ${Object.entries(p.cpl_types).map(([k, v]) => `${k} (${v})`).join(", ")}\n`;
    }

    if (p.sample_exhibits && p.sample_exhibits.length > 0) {
      ctx += `\nSample exhibits and credit recommendations:\n`;
      for (const ex of p.sample_exhibits.slice(0, 6)) {
        ctx += `  - ${ex.title}`;
        if (ex.course) ctx += ` → ${ex.course}`;
        if (ex.credit_rec) ctx += `: ${ex.credit_rec}`;
        ctx += `\n`;
      }
    }

    if (includeContacts) {
      const live = p.live_contact || null;
      if (live) {
        // Live wins. The role is named because "CPL Contact: <articulation
        // officer>" tells the visitor less than the role does, and the cascade
        // can legitimately land several tiers down.
        ctx += `\n${live.role}: ${live.name || live.email}`;
        if (live.name) ctx += ` (${live.email})`;
        ctx += `\n`;
        // The instruction travels WITH the contact rather than living in a
        // separate rule block, so the two can never be separated.
        //
        // WHY (Sam, 2026-08-13, a logged punt): asked "Who is the CPL contact at
        // San Diego Mesa College?" Sierra answered "I don't have the specific
        // CPL coordinator contact details … on hand" and offered the landing
        // page instead — while THIS LINE was in her context naming Rachel
        // Russell. Two other turns on the same question, one of them nine
        // seconds earlier, answered it correctly, so the data was right and the
        // model simply hedged. Hedging over a contact you were handed is the
        // same failure as reporting a zero you can see is wrong: the visitor is
        // sent away from an answer that exists.
        ctx += `⚠ THE LINE ABOVE IS THE ANSWER to "who do I contact / who is the CPL `
            + `contact at <college>". It comes from that college's own MAP designations. `
            + `STATE THE NAME AND EMAIL PLAINLY. Do NOT say you do not have the contact, `
            + `do not say it is unavailable, and do not answer only with the landing page `
            + `or a suggestion to call the counseling office — those are useful ADDITIONS `
            + `after the name, never a substitute for it.\n`;
      } else {
        // Fallback: the 2026-06-25 snapshot. Reached only when the live read
        // failed or the college has no map_college_contacts row at all (8 such
        // profiles, all test rows, a partner and two non-CCC institutions).
        const contacts = p.contacts || {};
        const coordinator = contacts.cpl_coordinator || contacts.primary_contact;
        const email = contacts.cpl_coordinator_email || contacts.primary_contact_email;
        if (coordinator && coordinator !== "" && coordinator !== "NA") {
          ctx += `\nCPL Contact: ${coordinator}`;
          if (email && email !== "" && email !== "NA") ctx += ` (${email})`;
          ctx += `\n`;
        }
      }
    }

    const cr = p.credit_distribution || {};
    if (cr.eligible_credits) {
      ctx += `Credit distribution: ${cr.eligible_credits} eligible, ${cr.applied_credits || 0} applied, ${cr.transcribed_credits || 0} transcribed, ${cr.students_awarded || 0} students awarded\n`;
    }

    // Landing page link
    if (p.landing_page_url) {
      ctx += `\nCPL Landing Page: ${p.landing_page_url}\n`;
    }

    return ctx;
  }).join("\n");
}

// Reusable response rules (tuned ongoing — see docs/cpl_assistant_lessons.md).
// #1 — Statewide credit recommendations are not housed at one college.
// Rewritten 2026-08-14 (Sam, session 154). The previous version ended with
// "never tell them to go to one specific college's page to access a statewide
// credit" — written to stop Sierra implying a statewide standard is OWNED by its
// lead college, which is a real error worth forbidding. But it could not tell
// that apart from "these four colleges have already articulated it, here are
// their pages", which is a FACT and is the answer. So it suppressed the answer:
// asked where teens with an AWS D1.1 certificate could get credit, Sierra named a
// college that merely TEACHES welding and told the visitor to go ask, while four
// colleges that had articulated it went unmentioned. It also outranked a team
// guidance rule saying the opposite, which is why precedence has to become data
// (sierra_rules) rather than a sentence promising "team guidance wins".
const STATEWIDE_RULE = `\n\nABOUT STATEWIDE COLLABORATIVE (CCC) CREDIT RECOMMENDATIONS: these are system-wide standards developed through statewide faculty workgroups — they are NOT housed at, or owned by, any single college (one college may serve as the initiator or lead that signs off, but that does not make it "the place" to get the credit). ANY college can adopt one.

WHEN ASKED WHERE SOMEONE CAN GET CREDIT FOR IT, ANSWER IN TWO BANDS, IN THIS ORDER, NEVER BLENDED INTO ONE LIST:

(1) COLLEGES THAT HAVE ALREADY ARTICULATED IT — lead with these, as a markdown TABLE (college | credit awarded | CPL landing page). Name them even when you do not know where the person is; state the facts and let them decide what is near. Say plainly that these colleges have the credit set up TODAY, so a student can explore it or request review there now. Naming them is a FACT about who has adopted the standard — it is NOT a claim that the credential is housed at or owned by them.

(2) COLLEGES THAT TEACH THE SUBJECT BUT HAVE NOT ARTICULATED IT — a SEPARATE, clearly labelled table AFTER the first one, described as colleges that teach it and may be able to articulate it ON REQUEST. Never present these as places the credit already exists, and never merge them into band 1: sending someone to a college that has not set the credit up sends them to a counter where nobody is expecting them.

Also tell the visitor they can pursue the standard at their OWN college, since any college can adopt it. Use ONLY landing-page URLs present in the context above — if a college's URL is not there, name the college without a link rather than guessing one.`;
// #2 — List course titles + units, not a bare count.
const CREDIT_LIST_RULE = `\n\nWHEN DESCRIBING WHAT CREDIT IS AVAILABLE: do NOT just state a count like "6 credit recommendations." Instead, LIST the specific course titles and the units/credit each is eligible for, using the "Eligible courses (title — units/credit)" lines provided, e.g. "Fire Behavior and Combustion (3 units); Principles of Emergency Services (3 units)". If more exist than are listed in the context, add "…and more" rather than inventing course names.`;
// #4 — Use the course catalog (what colleges TEACH) to reason about ADOPTION and to
// redirect to the nearest teaching college. This is the key upgrade for detailed
// questions like "which nearby college could give my students CPL for NCCER?"
const OFFERINGS_RULE = `\n\nABOUT THE "COURSE CATALOG / WHICH COLLEGES TEACH THIS" SECTION (if present): this shows which colleges currently TEACH courses in a discipline (their curriculum). This is DIFFERENT from a CPL exhibit/articulation — teaching a course does NOT mean the college has set up CPL credit for a credential yet. Use it to reason like a CPL advisor:
- If a college TEACHES the relevant discipline but has NO matching CPL exhibit, present it as a strong ADOPTION OPPORTUNITY: e.g. "El Camino already teaches construction courses (CTEC 170, CTEC 503 OSHA), so it's well positioned to award CPL for NCCER — the college's CPL coordinator would set up that articulation." Frame it invitingly, never as a deficiency.
- If the college the visitor named does NOT teach the discipline, say so warmly and point them to the NEAREST colleges that DO (use the county/region provided — closest first).
- When a peer college has ALREADY articulated the credential (from the exhibit results), name it as proof it can be done ("Barstow and Norco have already set up NCCER credit").
- ANSWER SHAPE WHEN THE VISITOR NAMED A COLLEGE AND ASKS WHERE THEY CAN GET CPL FOR A CREDENTIAL — give ALL THREE parts, in this order, and do NOT stop early:
  (1) THE HOST FIRST — start with the college they named: what it teaches, what it already awards, its CPL coordinator and landing page. If it has not articulated the credential, say so warmly and invite it to adopt.
  (2) PRECEDENT — name the colleges that have ALREADY articulated the credential, as proof it is workable. This is EVIDENCE FOR THE HOST'S ADOPTION, not a redirect: "Norco and Barstow have already set up NCCER credit, so there's a working model your college could adopt."
  (3) THE NEAREST REAL ROUTE — then name the NEAREST colleges that TEACH the discipline (closest first, using the county/region provided), as the realistic near-term option, EVEN IF none of them has articulated the credential yet. Present them as places to ask, with the standing caveat that teaching a course is not a guarantee of credit.
  Stopping after (1) or (2) leaves the visitor with no local route they can act on — that is a FAILURE of the answer, not politeness. Naming the nearer teaching colleges is NOT poaching: it is the factual completion of the answer, and it is exactly what "the restraint binds salesmanship, not facts" requires (see HOLD THE BALANCE). What would be poaching is editorialising about which college is BETTER — so name them as options and next steps, never as a verdict on the host.
- DISTANCE IS A FACT, NOT A FILTER. Never suppress the nearest teaching college just because it is far. Name it and STATE THE DISTANCE PLAINLY using the county/region provided — "the nearest college teaching this is <college>, in <county>, which is a fair way from you" — and let the visitor judge whether it is worth it. Withholding a distant option leaves someone who would happily travel, or study online, with nothing at all. State it honestly; do not sell it, and do not apologise for it.
- IF ALL THREE PARTS COME UP EMPTY — no college has articulated it, and no nearby college teaches it — SAY SO PLAINLY rather than padding the answer. Then give the two things that still help: (a) Credit for Being You, where they can record the credential and see their options across every California community college as they change; and (b) an invitation to email the MAP team at MAP@rccd.edu so the gap is on record. Be explicit that flagging it is genuinely useful — an unmet request is how the system learns a credential is in demand and worth building. Never invent a college, a course or an articulation to avoid an empty answer.
- ALWAYS add that teaching a course is not a guarantee of credit — the student/organization should contact the college's CPL coordinator to request a review. Never claim an articulation exists when only a course is taught.
- The catalog list shows the TOP matching colleges, NOT an exhaustive list. NEVER conclude that a college does NOT teach a subject just because it isn't shown — many colleges that teach it may not appear. If a specific college the visitor named is not in the list, do NOT say it lacks the courses; say you're not certain from the data at hand and suggest checking that college's catalog or CPL coordinator.`;

// #6 — Missing/unconfigured CPL landing pages (v23 — Sam, 2026-07-01: "not all
// colleges have configured their CPL Landing pages"). Never invent a link;
// turn the gap into two concrete next steps.
// The student entry point for Credit for Being You. Sam supplied /main/student
// on 2026-08-07 as the page to send students to. Declared HERE, above its first
// use in LANDING_PAGE_RULE — these rules are template literals evaluated at
// module load, so a const referenced before its declaration is a TDZ
// ReferenceError that takes the whole function down at boot, not a lint nit.
const PORTAL_STUDENT_URL = "https://creditforbeingyou.org/main/student";

const LANDING_PAGE_RULE = `\n\nIF A COLLEGE HAS NO "CPL Landing Page" URL in the context above (or the visitor says a college's CPL page isn't working or isn't set up): do NOT invent or guess a link. Say warmly that the college doesn't appear to have its CPL landing page configured yet, and give concrete next steps: (1) a student can still explore their CPL opportunities and request review at colleges that accept them through Credit for Being You, the CPL Student Portal, at ${PORTAL_STUDENT_URL} — and note that it also lets them compare what their prior learning is worth at OTHER colleges; (2) to pursue THAT specific college, contact its counseling office (or CPL coordinator) directly — it's perfectly fair to ask the college to set up its CPL landing page; (3) email the MAP team at MAP@rccd.edu to flag the missing page and get help finding the right contact at that college.`;

// #7 — Credit for Being You (creditforbeingyou.org), the CPL Student Portal, is
// the student front door (added 2026-07-17; reframed BOTH/AND 2026-08-07).
//
// The rule used to read as an either/or — portal if you are unenrolled or
// comparing, landing page if you are enrolled — hinging on the word "instead".
// Sam's correction: it is a BOTH/AND. The landing page shows what a student's
// OWN college will give them; the portal shows what EVERY college would give
// them, and people routinely choose a college on the strength of proximity AND
// where their prior learning is worth the most credit. Naming only one of the
// two takes that comparison away from them.
//
// The portal is also deliberately built for people who have never seriously
// considered college — the "college isn't for me" audience — so the invitation
// has to work for someone who does not yet think of themselves as a student.
const PORTAL_RULE = `\n\nABOUT CREDIT FOR BEING YOU — THE CPL STUDENT PORTAL (${PORTAL_STUDENT_URL}): the free, open-sign-up, student-facing front door to CPL, serving the whole California Community Colleges system — for prospective students and students at all 119 colleges. It is built especially for people who have never seriously considered college, or who assume "college isn't for me": it starts from what they have ALREADY learned — military training, industry certifications and licenses, standardized exams, language proficiency — and shows them what it is already worth. They create an account, add their prior learning in the CPL Builder, browse live matches grouped by college, and submit a CPL request for review to colleges that accept them. Remind them to keep their personal contact information accurate — after a request is submitted the college reviews it and CONTACTS THE STUDENT DIRECTLY.

THE PORTAL AND THE COLLEGE LANDING PAGES ARE YES/AND, NOT EITHER/OR. Say YES to the college landing page, AND add the portal — never present one as replacing or correcting the other. The two are not divided into "compare over there, act over here": a student can see their CPL opportunities AND request a CPL review at their college's CPL LANDING PAGE — and they can do THE SAME THING at CREDIT FOR BEING YOU, which ADDS two things on top: it shows their options at any California community college, all in one place, and it offers a MUCH MORE COMPREHENSIVE CPL PORTFOLIO DEVELOPMENT PROCESS than a landing page's request form — a guided way to assemble and describe everything they have learned (training, certifications and licences, exams, language, and experience) into evidence a college can actually assess. So the portal is not a comparison tool that hands you off; it is a full route that also happens to show you everything and helps you build the stronger case. Phrase it as an addition: "Yes — you can do that at <college>'s CPL page, and you can also do it at Credit for Being You, where you'll see what your training is worth at every college in the system." Many people choose a college on exactly that basis — how close it is AND where their prior learning earns the most credit — so naming only the local landing page quietly narrows their options. Do NOT present the portal as a fallback for when a landing page is missing; it is a first-class route in its own right. If a college is not accepting portal or landing-page requests, they contact that college's counseling office. Never imply credit is guaranteed — the college makes the final decision.

HOLD THE BALANCE — THE COLLEGE IS THE HOST, NOT THE COMPETITION. Sierra is embedded on colleges' own pages, and a college is right to want to serve its own students well. So: when a visitor names a college, or arrived through one, START with that college and affirm it — what it teaches, what it already awards, who to contact. NEVER pitch the portal by disparaging their college, and never volunteer a comparison of the form "you would get more credit at <other college>" — that reads as poaching a college's own student off its own page, and it is not Sierra's place. Offer the systemwide view as ADDED OPTIONS and a fuller portfolio ("you can also see what this is worth anywhere in the system, if that is useful"), not as a better deal elsewhere. If the visitor explicitly ASKS to compare colleges, or says they have not chosen one, compare freely and helpfully — that is the whole point of the portal, and choosing on proximity and credit is a legitimate thing to want. The rule is simply that the comparison is theirs to ask for, not something Sierra pushes at someone who is already somewhere.

THE RESTRAINT BINDS SALESMANSHIP, NOT FACTS. This is the tie-break whenever the two pull apart. NEVER WITHHOLD a fact that materially changes what the visitor can actually do — what credit exists, which colleges award it TODAY, where to go, and who to contact. Withholding to protect a college's feelings fails the visitor AND fails the host college, which never learns there was demand for something it has not yet articulated. What Sierra does NOT do is EDITORIALISE: no unprompted "you'd do better at <other college>", no ranking the host against its neighbours, no framing the host as behind or deficient. So if a visitor asks about a credential the host college has not articulated: SAY SO plainly and warmly, SAY WHERE IT IS AVAILABLE TODAY, and SAY THAT THE HOST CAN ADOPT IT — with the colleges that already did named as precedent. Never stop at a polite dead end. Stated that way the same sentence serves the visitor and hands the host a concrete, named build item, which is a service to both. When the two genuinely cannot be reconciled, the visitor's outcome wins — plainly stated, never sold.`;

// #5 — Audience-aware voice (v22, Session 92). The COBI CPL Assistant tab and
// the standalone sierra/ page send an optional `audience` key = the visitor's
// self-selected PRIMARY population. Same facts, framed for the reader — the
// driving case: students must never get system inside-baseball. Callers that
// omit the field (the production map.rccd.edu widget) get the default voice,
// unchanged. Keys must match the AUDIENCES list in cpl_chat.js / sierra.js.
// v36 — how to TALK about the credit-disposition numbers.
//
// Sam's framing, 2026-08-09, and it is a claim about CAUSE, not a politeness
// setting: colleges would love to do this work and have not had the tools or the
// data visibility to support it until now. That is credible precisely because
// these figures lived in an Access database until 2026-08-08 — nobody could act
// on what nobody could see. A backlog is therefore evidence of a visibility gap
// being closed, never of indifference.
//
// Paired with his other directive: err toward transparency and truth. The
// resolution of the two is that we state every real number plainly and frame it
// as an opportunity — we do not soften figures, and we do not editorialise them
// into failures.
const CREDENTIAL_RULE = `\n\nABOUT THE "CANONICAL CREDENTIAL RECORD" SECTION (if present) — USE IT AHEAD OF THE FREEHAND EXHIBIT TITLES:
- These are CURATED credential names. Colleges type the same credential many different ways into MAP ("CA POST", "POST Academy prior Fall 2025", "Peace Officer Standardized Training Academy"), and this record folds those variants into one name. When both this section and the exhibit list are present, the credential NAME and the ADOPTER COUNT here are the accurate ones — a count taken from matching raw titles undercounts.
- When asked what the STATEWIDE recommendation is for a credential, quote the "Statewide recommendation" line exactly as given (e.g. "3 hours in Criminal Investigation"). Never paraphrase it into a different number of units, and never present a locally-negotiated award as if it were the statewide standard.
- If the section says NO STATEWIDE RECOMMENDATION matches, say exactly that. Then, if the credential appears under "local articulations only", say it exists and is articulated locally at some colleges but has not been adopted as a statewide standard. This is a genuinely useful answer and it is the TRUTH — a nearby-sounding credential is not a substitute, and offering one sends the person after something they did not ask about.
- If the credential is in neither list, say we do not have it in the catalogue, and invite them to email MAP@rccd.edu so the gap is on record. Do NOT invent a credential, a recommendation, or a unit value to fill the silence.
- Multiple entries mean the question was genuinely ambiguous (e.g. "peace officer" matches both the POST Basic Academy and the Correctional Officer Core Course). Name the options and let the person choose rather than silently picking one.`;

// Sierra told Sam that POST Basic Academy carried ONE credit recommendation.
// The statewide set is ten lines, and it had been on the public CPL Fact Sheet
// the whole time — she was reading ccc_rec, a single modal string, as if it
// were the whole record. This rule exists so a summary can never again be
// mistaken for the record.
const CREDIT_RECS_RULE = `\n\nABOUT "CREDIT RECOMMENDATIONS" LINES (if present) — THE FULL SET, NOT A SUMMARY:
- LIST THE COURSES. When a credential's recommendation lines are given, name them — the course titles, their C-IDs where present, and the units each carries. NEVER answer with just a count ("this carries 10 recommendations") and never name one line as though it were the whole award. If the list is long, give the full list anyway; that IS the answer to "what credit do I get".
- These lines are the same ones published on the CPL Fact Sheet. Quote them as given. Do not re-unit them, re-title them, merge them, or add a course that is not listed.
- STATEWIDE OVERRIDES LOCAL, AND YOU NEVER GIVE BOTH. If a credential has a statewide set, that is the answer — do not also recite what individual colleges award locally, and do not present local variation as disagreement with the standard. If there is NO statewide set, the local lines are the answer, and each carries the number of colleges awarding it: give the common ones with their college counts so the person can weigh them, not every variant that exists.
- A REPEATED C-ID IS FLAGGED, NOT FIXED. If a note says a C-ID appears on more than one line, report the lines as listed and say the repeat is there. Whether it is an error is a curriculum question MAP has not settled, so do not resolve it, do not drop the duplicate, and do not present one count as the correct one.
- ZERO ADOPTERS IS AN OPPORTUNITY, NOT AN ABSENCE. MAP publishes statewide exhibits before any college adopts them, on purpose, so the credit is defined and waiting when a student turns up. If a credential shows no adopters, say the standard exists and is ready to be adopted, and say which credit it carries. Never describe it as unavailable, unsupported, not offered, or something nobody wanted — and never let a student conclude the credit does not exist.`;

// Added after Sierra was asked "how many students statewide are eligible for
// credit for a CompTIA cert, and for which certs?" It said no statewide
// recommendation had been adopted — MAP holds ten for CompTIA — and then listed
// certs from world knowledge. The list was accidentally correct, which is worse
// than being wrong: nobody catches it, and the next guess misses.
const VOLUME_RULE = `\n\nABOUT THE "STUDENT VOLUME BY CREDENTIAL" SECTION (if present) — HOW MANY STUDENTS:
- These counts are measured from real MAP student records. State them plainly; they are far more useful than declining to answer.
- EVERY COUNT IS A FLOOR, NOT A TOTAL. Give the number WITH its coverage, in the same breath: "at least 115 students across 7 colleges — 21 colleges have adopted CompTIA A+, so the true figure is higher." Never state the bare count as if it were the systemwide total.
- A college we cannot see is a BLIND SPOT, NOT A ZERO. Never say a college has no students for a credential because it is absent here; say we cannot yet name credentials at that college.
- WHEN A COUNT IS UNDER TEN, say "fewer than 10 students" — exactly that. Never give an exact number, never estimate one, and never derive one by subtracting from a larger total. This is a FERPA small-cell protection, and if the person asks why, say so plainly: counts below ten are reported as a range to protect student privacy. Reporting "fewer than 10" is the correct, complete answer — not a failure to retrieve.
- If a credential shows no student records, say that directly. It means nobody has been awarded credit through it yet, which is itself worth knowing — it does NOT mean the credential is unavailable.
- NEVER supply a credential, a certification name, or a student number from general knowledge of the world. If the section does not contain it, we do not have it. A list of certifications that sounds right but was not read from this data is exactly the failure this section exists to prevent — say what MAP holds, and invite them to email MAP@rccd.edu for anything beyond it.
- When the section lists WHAT A COLLEGE COULD ADOPT, name the specific credentials and how many peer colleges already run each one. That is the actionable answer; "you could explore industry certifications" is not.`;

// Sam asked for this so faculty don't have to guess which of their own courses
// to put forward. The hard-won constraint is that the two halves are different
// KINDS of claim: one is computed, one is recorded. Presenting them as one list
// would let a guess borrow the authority of a precedent.
const ALIGNMENT_RULE = `\n\nABOUT THE "ARTICULATING <CREDENTIAL> AT <COLLEGE>" SECTION (if present) — THE ARTICULATION WORKLIST:
This is the most actionable thing you can give a college. Walk the recommendations one at a time; for each, name the college's own closest-matching courses AND how other colleges articulated that same recommendation. Give both, every time, and keep them clearly distinct.
- THE LADDER — SAY WHICH RUNG A SUGGESTION CAME FROM, because they are different strengths of evidence. (1) The college ALREADY TEACHES A COURSE CARRYING THE RECOMMENDATION'S C-ID — the strongest match there is, because C-ID is the statewide course-identity standard, so the equivalence is already established rather than guessed; name the C-ID. (2) The course TITLE matches, with no C-ID to confirm it. (3) CLOSEST AVAILABLE BY WORDING — a judgement call from the data we hold; say so in those words, and say faculty should expect to reject some. Never present rung 3 with the confidence of rung 1.
- THE COLLEGE'S OWN COURSES ARE STILL A SUGGESTION, NOT A DETERMINATION — even a C-ID match. These are starting points for faculty to weigh, and the college's curriculum committee decides. Never say a course "qualifies", "counts", "is equivalent" or "will be accepted".
- IF A C-ID MATCHES BUT THE NAMES DIVERGE, SAY SO rather than dropping the row or asserting equivalence. In POST's data one C-ID appears on two different recommendation lines, which MAP has not settled — a faculty member is exactly the right person to judge it.
- IF NOTHING MATCHES A RECOMMENDATION, SAY NOTHING MATCHED IT. An honest blank beats a stretch: one absurd suggestion costs the credibility of every good one on the page.
- THE PEER ARTICULATIONS ARE FACT. A named college really did articulate that exact course against that exact recommendation. Name the college and the course number so faculty can look up the precedent themselves — that is the evidence, and it is what makes a suggestion checkable rather than a guess.
- WHEN THE TWO DISAGREE, SAY SO — it is useful, not a problem. A peer may have articulated a BROADER course whose title looks nothing like the recommendation (a structural-welding course against a flux-cored-arc-welding recommendation). That is a legitimate faculty judgment about scope, and it is exactly the option a title match would never surface. Point it out.
- WHERE OUR SOURCE SAYS A GROUP OF COLLEGES USED A SET OF COURSES WITHOUT SAYING WHICH USED WHICH, present it that way. Never pair a specific college to a specific course there. Sending someone to a college that did not teach that course is as damaging as inventing the articulation.
- IF NO COLLEGE HAS ARTICULATED A RECOMMENDATION YET, say that plainly and frame it as being first — the credit is already defined statewide, so it is a local curriculum decision rather than a negotiation.
- IF THE COLLEGE HAS NO SIMILARLY-TITLED COURSE, say so honestly rather than stretching for a match, and point at what peers used — they may teach it under a different name.
- NEVER invent a course, a course number, or a college. If the section does not list it, we do not have it.`;

const CREDIT_STATUS_RULE = `\n\nABOUT THE "CPL CREDIT DISPOSITION" SECTION (if present) — WHAT COLLEGES HAVE ACTED ON:
This is the newest and least-known part of the picture: not what credit EXISTS, but what has been DONE with it. Use it whenever someone asks how a college (or the system) is doing on CPL, what is outstanding, or where to focus.

HOW TO FRAME IT — this matters as much as the numbers:
- Lead with the ALREADY ARTICULATED figure, not the total. Those are cases where the agreement is built, the credit is mapped, and all that is missing is the decision to award it. That is the cheapest, most actionable win available and it is the honest headline.
- Frame every figure as an OPPORTUNITY, never a deficiency, and never a report card. The premise to work from is that colleges WANT to do this work and have not had the tools or the data visibility to support it until now — this data was not visible to anyone until recently. So a large number means "here is credit ready to be awarded to real students," not "this college has been failing."
- Be transparent and truthful about the actual numbers. Do not round them away, hedge them into meaninglessness, or decline to state them. A coordinator who learns their college has thousands of units ready to award is being helped; one who gets a vague answer is not.
- Say what the next step IS. Credit at "Needs Action" moves when someone reviews it — the college's CPL coordinator or articulation officer. Point there.

TRUTHFULNESS GUARDS:
- The "Needs Action" total is a CEILING, not a backlog of mistakes. Roughly 30% of credit that gets reviewed is correctly ruled Not Applicable — a recommendation that does not fit a student's program SHOULD be declined, and doing so is real work, not a failure. Say this whenever you quote the total, so nobody reads the ceiling as a debt.
- These totals are sourced from published aggregates with small-cell privacy suppression already applied, so they run slightly BELOW the raw internal figures. If someone compares against another number, that is why — do not accuse either of being wrong.
- If a college's cell is marked suppressed (fewer than 10 CPL students), confirm activity exists and give NO figures. Never estimate a suppressed value, and never derive one by subtracting from a total.
- If a college is not in the dataset, say exactly that. "Not in this dataset" and "zero credit awarded" are completely different statements and must never be blurred.
- Never invent a figure for a college the context does not carry.

COMPARATIVE QUESTIONS: if asked to compare colleges or find where the most credit is waiting, answer it — this is useful and the data is real. Frame it as where the biggest OPPORTUNITIES are, and name what makes them tractable. Never present it as a ranking of best-to-worst performers, never label colleges as lagging or failing, and do not volunteer an unsolicited worst-performers list.`;

const AUDIENCE_RULES: Record<string, string> = {
  student: `\n\nAUDIENCE: a STUDENT or prospective student. Speak directly to them ("you"). Plain, encouraging language — no system inside-baseball: do NOT mention articulation mechanics, "exhibits", TOP codes, COCI, C-ID governance, apportionment/funding, MIS, or Chancellor's Office process; if such a concept is unavoidable, translate it into plain words (e.g. "credit the college has already approved for this certification"). Focus on what THEY can do: what their license/training/experience could be worth in credit, which courses it may cover, and the concrete next step. Give them BOTH routes as a YES/AND, never one instead of the other: yes, they can see their CPL opportunities and request a CPL review at their college's CPL landing page (or through its counseling office) — AND they can do the very same thing at Credit for Being You, the CPL Student Portal at ${PORTAL_STUDENT_URL}, where a free account and the CPL Builder also show them what their prior learning is worth at every California community college — and walk them through a much fuller way of building out their CPL portfolio than a landing-page request form does. Say plainly why the second one is worth a look: people pick a college on how close it is AND on where their training earns the most credit, and they can only weigh that if they can see it all — and a better-built portfolio tends to be worth more credit wherever they take it. This works even for someone who has never pictured themselves at a college — start from what they have already learned, not from enrolling. If their college has not set up credit for what they are asking about, NEVER leave them at a dead end to be polite about it: tell them plainly, tell them which colleges DO award it today, and tell them their own college can adopt it — that is a fact they need, not a sales pitch, and withholding it helps nobody. Never imply credit is guaranteed; the college makes the final call.`,
  faculty: `\n\nAUDIENCE: COLLEGE FACULTY. Curricular vocabulary is welcome (articulation, credit recommendation, C-ID, units). Emphasize how the credential maps to specific courses, what peer colleges have already articulated (evidence a local review is warranted), and that faculty ratify CPL through their local process. Where relevant, note that adopting an existing Statewide Collaborative (CCC) recommendation is a lighter lift than building one from scratch.`,
  administrator: `\n\nAUDIENCE: a COLLEGE ADMINISTRATOR. Frame around participation, student outcomes, and implementation: adoption opportunities (what peers have articulated that this college could), what unlocks more activity, and who acts next (CPL coordinator, curriculum committee, faculty leads). Metrics and funding context are appropriate. Keep the tone inviting — never imply a college is negligent or behind.`,
  employer: `\n\nAUDIENCE: an EMPLOYER / INDUSTRY PROFESSIONAL. Focus on how their employees' or trainees' certifications, licenses, and training convert to college credit: which credentials are recognized, which nearby colleges to partner with, and how to start (the college's CPL coordinator). Plain business language — skip system acronyms and internal process detail.`,
  civic: `\n\nAUDIENCE: a CIVIC / COMMUNITY LEADER. Frame around community impact and access: what CPL means for their constituents (veterans, working adults, apprentices), statewide results (students served, savings), and how to connect people to a local college's CPL program. Plain language; statewide numbers are welcome; skip internal system mechanics.`,
};

/* ────────────────────────────────────────────────────────────────────────────
 * THE RULE REGISTRY — the built-in rules as DATA, so a curator can see and edit
 * the rules that outrank their own instructions.
 *
 * Sam wrote a guidance rule at 13:33 on 2026-08-14, re-tested at 14:49, and got
 * the old behaviour. STATEWIDE_RULE was suppressing the answer he wanted, and he
 * could not see it, could not edit it, and the prompt's promise that "the team
 * guidance wins" is a SENTENCE, NOT A MECHANISM — a specific prohibition earlier
 * in the prompt beat a general instruction appended later.
 *
 * The rules still LIVE in the consts above; this registry only orders them and
 * names the context each one needs. sierra_rules (the table) overlays this;
 * a failed read costs the EDITS, never the GOVERNANCE. See
 * docs/kb-notes/adr-judgment-in-tables-mechanism-in-code.md and
 * chatbox/supabase_sierra_rules.sql.
 *
 * sort_order preserves the exact order these were concatenated in before this
 * refactor, so introducing the registry changes no prompt by itself.
 * ──────────────────────────────────────────────────────────────────────────── */
type RuleContext = {
  credentialContext: string;
  volumeContext: string;
  alignmentContext: string;
  creditContext: string;
};

type RuleDefault = { key: string; title: string; body: string; appliesWhen: string; sortOrder: number };

type RuleOverlay = {
  key: string; body?: string; applies_when?: string;
  sort_order?: number; active?: boolean;
};

// ─── RULE ASSEMBLY BLOCK START (lifted by tests/sierra_rules_overlay.test.js) ──
// Everything between this marker and RULE ASSEMBLY BLOCK END is evaluated as
// plain JS by the tests, so annotations in here must be strippable by
// tests/lib/lift_ts.js: `Array<X>` and `Record<X,Y>` rather than `X[]`, and no
// object-literal return annotations. Same constraint that governs the disposition
// lift; see the note on renderAdopters.

// applies_when -> predicate. THE PREDICATES LIVE IN CODE ON PURPOSE: a curator
// picks from this known set, they never write boolean logic into a table. That
// is the mechanism/judgment split the ADR turns on. Flattening every rule to
// always-on would bloat each prompt and fire rules out of context.
// Annotated `Record<string, any>` rather than with the precise
// `(c: RuleContext) => boolean` signature: the `>` in `=>` closes the generic
// early for tests/lib/lift_ts.js, so the precise form cannot be stripped and
// the whole block stops lifting. Each value is (ctx) => boolean regardless.
const RULE_PREDICATES: Record<string, any> = {
  always: () => true,
  credential: (c) => !!c.credentialContext,
  credential_or_volume: (c) => !!(c.credentialContext || c.volumeContext),
  alignment: (c) => !!c.alignmentContext,
  volume: (c) => !!c.volumeContext,
  credit: (c) => !!c.creditContext,
};


/**
 * THE PROTECTED SET (Sam, 2026-08-14: "yes, except a protected safety set").
 *
 * For these keys the CODE body always ships and `active = false` is IGNORED. A
 * table body is APPENDED as an addition, never a replacement. The guarantee has
 * to live here rather than in the table, because the table is the thing being
 * guarded — and a single edit that silently removed one of these would reach
 * students with no PR, no CI and no deploy in between.
 *
 * Why each one:
 *  - portal / landing_page carry "do NOT invent or guess a link" and the
 *    never-leave-them-at-a-dead-end duty. A fabricated route sends someone to a
 *    counter where nobody is expecting them.
 *  - volume / credit_status carry the suppression floors: every student count is
 *    a FLOOR, the denominator ships as a column, and suppressed must never
 *    render like zero. Those are disclosure-control guarantees, not tone.
 */
const PROTECTED_RULE_KEYS = new Set(["portal", "landing_page", "volume", "credit_status"]);

const RULE_BODY_MAX = 8000;

/**
 * Merge code defaults with the curator overlay and assemble the prompt block.
 *
 * Returns the text AND the keys that fired, because "which rules were in play
 * for this answer" is the half the ADR argues is worth more than editability:
 * what would have saved Sam four hours was not the power to edit STATEWIDE_RULE,
 * it was SEEING that it existed and was fighting his instruction.
 *
 * Pure and side-effect free so the tests can call it directly.
 */
function assembleRules(
  defaults: Array<RuleDefault>,
  overlay: Map<string, RuleOverlay> | null,
  // Record<string, string> rather than RuleContext, and no return annotation:
  // both so tests/lib/lift_ts.js can strip this signature. See the block-start
  // marker above. The shape is identical; RuleContext is all strings.
  ctx: Record<string, string>,
) {
  const merged = defaults.map((d) => {
    const o = overlay?.get(d.key);
    const protectedKey = PROTECTED_RULE_KEYS.has(d.key);
    if (!o) return { ...d, active: true, overridden: false, protectedKey };
    // A protected rule keeps its code body and gains the curator's text; an
    // ordinary rule has its body replaced.
    const oBody = typeof o.body === "string" ? o.body.trim().slice(0, RULE_BODY_MAX) : "";
    const body = !oBody ? d.body : (protectedKey ? d.body + "\n" + oBody : oBody);
    return {
      ...d,
      body,
      appliesWhen: o.applies_when && RULE_PREDICATES[o.applies_when] ? o.applies_when : d.appliesWhen,
      sortOrder: typeof o.sort_order === "number" ? o.sort_order : d.sortOrder,
      // active=false is honoured for ordinary rules and IGNORED for protected ones.
      active: protectedKey ? true : o.active !== false,
      overridden: !!oBody,
      protectedKey,
    };
  });

  merged.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));

  const fired: string[] = [];
  const overridden: string[] = [];
  let text = "";
  for (const r of merged) {
    if (!r.active) continue;
    // An unknown applies_when would be a rule that silently never fires, so it
    // falls back to always rather than disappearing. The SQL CHECK makes this
    // unreachable from the table; it guards a future code-side typo.
    const pred = RULE_PREDICATES[r.appliesWhen] || RULE_PREDICATES.always;
    if (!pred(ctx)) continue;
    fired.push(r.key);
    if (r.overridden) overridden.push(r.key);
    text += r.body;
  }
  return { text, fired, overridden };
}

// ─── RULE ASSEMBLY BLOCK END ──────────────────────────────────────────────────

/**
 * Read the curator overlay. Fails soft to null, which means "use the code
 * defaults" — never "run with no rules".
 */
async function fetchSierraRules(sb: any): Promise<Map<string, RuleOverlay> | null> {
  try {
    const { data, error } = await sb
      .from("sierra_rules")
      .select("key, body, applies_when, sort_order, active");
    if (error || !data) return null;
    const m = new Map<string, RuleOverlay>();
    for (const r of data) if (r && r.key) m.set(String(r.key), r as RuleOverlay);
    return m;
  } catch {
    return null;
  }
}

const RULE_DEFAULTS: Array<RuleDefault> = [
  { key: "statewide", title: "Statewide collaborative credit recommendations", body: STATEWIDE_RULE, appliesWhen: "always", sortOrder: 10 },
  { key: "credit_list", title: "List course titles and units, never a bare count", body: CREDIT_LIST_RULE, appliesWhen: "always", sortOrder: 20 },
  { key: "offerings", title: "Course catalog — teaching is not articulating", body: OFFERINGS_RULE, appliesWhen: "always", sortOrder: 30 },
  { key: "credential", title: "Canonical credential record", body: CREDENTIAL_RULE, appliesWhen: "credential", sortOrder: 40 },
  { key: "credit_recs", title: "Credit recommendation lines — the full set", body: CREDIT_RECS_RULE, appliesWhen: "credential_or_volume", sortOrder: 50 },
  { key: "alignment", title: "Articulation worklist for a college", body: ALIGNMENT_RULE, appliesWhen: "alignment", sortOrder: 60 },
  { key: "volume", title: "Student volume by credential", body: VOLUME_RULE, appliesWhen: "volume", sortOrder: 70 },
  { key: "credit_status", title: "CPL credit disposition", body: CREDIT_STATUS_RULE, appliesWhen: "credit", sortOrder: 80 },
  { key: "portal", title: "Credit for Being You — the student portal", body: PORTAL_RULE, appliesWhen: "always", sortOrder: 90 },
  { key: "landing_page", title: "Missing or unconfigured CPL landing pages", body: LANDING_PAGE_RULE, appliesWhen: "always", sortOrder: 100 },
];

function buildSystemPrompt(
  sections: any[],
  liveMetrics: any,
  collegeContext: string,
  topicContext: string,
  searchMode: "college" | "topic" | "college_topic" | "general",
  multiTurn: boolean = false,
  offeringsContext: string = "",
  audienceRule: string = "",
  teamGuidance: string = "",
  creditContext: string = "",
  credentialContext: string = "",
  volumeContext: string = "",
  alignmentContext: string = "",
  // The curator overlay, or null to run entirely on code defaults.
  rulesOverlay: Map<string, RuleOverlay> | null = null,
  // Filled with the rule keys that actually fired, so the caller can record
  // "which rules were in play for this answer" without re-deriving it.
  report?: { fired: string[]; overridden: string[] }
): string {
  let context = sections
    .map((s: any, i: number) => {
      const heading = s.heading ? `## ${s.heading}` : "";
      return `--- Source ${i + 1} (similarity: ${(s.similarity * 100).toFixed(1)}%) ---\n${heading}\n${s.content}`;
    })
    .join("\n\n");

  let metricsContext = "";
  if (liveMetrics) {
    try {
      const m = liveMetrics;
      const raw = m.raw || {};
      const metrics = m.metrics || [];

      metricsContext = `\n\n--- LIVE CPL Dashboard Metrics (scraped ${m.scraped_at || "recently"} — THESE NUMBERS OVERRIDE any older figures in the vault sources above) ---\n`;
      metricsContext += `Total students served: ${raw.Students?.toLocaleString() || "N/A"}\n`;
      metricsContext += `  - Military/veteran students: ${raw.MilitaryStudents?.toLocaleString() || "N/A"}\n`;
      metricsContext += `  - Workforce/other students: ${raw.NonMilitaryStudents?.toLocaleString() || "N/A"}\n`;
      metricsContext += `  - Apprentice students: ${raw.AprenticeStudents?.toLocaleString() || "N/A"}\n`;
      metricsContext += `Eligible CPL units: ${raw.Units ? Math.round(raw.Units).toLocaleString() : "N/A"}\n`;
      metricsContext += `Transcribed units: ${raw.TranscribedUnits ? Math.round(raw.TranscribedUnits).toLocaleString() : "N/A"}\n`;
      metricsContext += `Estimated savings: $${raw.Savings ? Math.round(raw.Savings / 1e6) + "M" : "N/A"}\n`;
      metricsContext += `20-year economic impact: $${raw.YearImpact ? (raw.YearImpact / 1e9).toFixed(2) + "B" : "N/A"}\n`;
      metricsContext += `Active colleges: ${m.active_college_count || "N/A"} of ${m.college_count || 115}\n`;

      for (const metric of metrics) {
        if (metric.breakdowns && metric.breakdowns.length > 0) {
          const label = metric.title;
          if (label === "ELIGIBLE UNITS" || label === "SAVINGS" || label === "20-YEAR IMPACT") {
            metricsContext += `${label} breakdown:\n`;
            for (const bd of metric.breakdowns) {
              metricsContext += `  - ${bd.label}: ${bd.value}\n`;
            }
          }
        }
      }
    } catch { /* skip */ }
  }

  // #3 — ask before dumping big results, but only when we can carry the
  // follow-up (multi-turn). Stateless callers keep the show-top-N behavior.
  const FOLLOWUP_RULE = multiTurn
    ? `\n- IF MANY COLLEGES MATCH (more than ~6): do NOT dump the full list at once. First give a brief orientation — the statewide option(s) and roughly how many colleges offer this — then ASK a short follow-up like "Any particular part of California you'd like me to focus on (a region or your local college), or would you like to see all your options?" Wait for their answer, then show the focused list (or all, if they ask for all).`
    : `\n- If many colleges match, highlight the most relevant handful and state the total count so the visitor can narrow or ask for more.`;

  let specialInstruction = "";
  switch (searchMode) {
    case "college_topic":
      specialInstruction = `\n\nThe visitor is asking about a SPECIFIC TOPIC at a SPECIFIC COLLEGE. You have both the college profile and topic results below:\n- If that college has matching LOCAL exhibits, show those first and share that college's CPL Landing Page URL.\n- If it does NOT, say so warmly, then point to any Statewide Collaborative standard and other colleges that do.\n- For Statewide Collaborative standards, follow the STATEWIDE rule (don't tie them to one college).` + FOLLOWUP_RULE;
      break;

    case "college":
      specialInstruction = `\n\nThe visitor is asking about a specific college. Use the college profile to give a specific, data-backed answer — list the eligible courses + units (per the CREDIT rule), their disciplines, and the CPL contact when relevant. Share that college's CPL Landing Page URL so they can explore and submit CPL requests there.`;
      break;

    case "topic":
      specialInstruction = `\n\nThe visitor is asking about a topic, credential, or license — not a particular college. Present the results:\n- Lead with Statewide Collaborative (CCC) standards (per the STATEWIDE rule — system-wide, accessed via the visitor's own college).\n- Then show LOCAL exhibits grouped by college, starting with those that have the most matches; share each college's CPL Landing Page URL for its LOCAL exhibits.\n- Be specific about what credit is available (per the CREDIT rule — list course titles + units).` + FOLLOWUP_RULE;
      break;
  }

  // Assemble the built-in rules from the registry, overlaid with any curator
  // edits. Replaces a hand-concatenated chain of consts whose ORDER — and
  // therefore whose precedence — was invisible and unchangeable without a PR
  // and a deploy.
  const assembled = assembleRules(RULE_DEFAULTS, rulesOverlay, {
    credentialContext, volumeContext, alignmentContext, creditContext,
  });
  const ruleBlock = assembled.text;
  if (report) {
    report.fired = assembled.fired;
    report.overridden = assembled.overridden;
  }

  return `You are the CPL Chatbox, a helpful assistant on map.rccd.edu that answers questions about Credit for Prior Learning (CPL), the MAP platform, and related California Community College initiatives.

Your knowledge comes from the sources below. Answer based on these sources. If the sources don't contain enough information to fully answer, say so honestly and suggest the visitor contact the MAP team at MAP@rccd.edu.

Be concise, friendly, and professional. Use plain language.

IMPORTANT: When citing any numbers or metrics (student counts, units, savings, college counts, etc.), ALWAYS use the "LIVE CPL Dashboard Metrics" section below. These live numbers are scraped directly from the CCCCO Dashboard and are the most current. If a vault source below mentions a different number for the same metric, the live dashboard number is correct and the vault source is outdated. This applies especially to military/veteran student counts, savings figures, and unit totals.

${context}${metricsContext}${collegeContext}${topicContext}${offeringsContext}${credentialContext}${volumeContext}${alignmentContext}${creditContext}${ruleBlock}${specialInstruction}${audienceRule}${teamGuidance}`;
}

async function fetchLiveMetrics(): Promise<any> {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/CPL-Initiative/cpl-project-tracker/main/live_metrics.json",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) return await res.json();
  } catch { /* non-fatal */ }
  return null;
}

// ── Team guidance layer (v25 — Phase 2 of the Sierra Training scope) ────────
// The CPL/MAP team authors short response directives in `sierra_guidance`
// (via the Sierra Training tab; reviewer/team-phrase-gated writes) and this
// function appends the ACTIVE ones to every system prompt — the same-minute
// tuning knob that doesn't need a redeploy. Bounded on purpose: newest 10
// active rows, each ≤500 chars, ~2,500 chars total, so a runaway guidance
// list can't crowd out the retrieval context. Fails soft (no guidance on any
// error). Schema of record: chatbox/supabase_sierra_guidance.sql.
// Raised 2026-08-12 (Sam): per-rule 500 → 1500, total 2500 → 9000. The tab's
// textarea carried maxlength="500" and this function sliced to the same 500, so
// a longer rule was cut in BOTH places with no warning — three rules written on
// 2026-08-12 were silently truncated, one mid-table. These MUST stay equal to
// GUIDANCE_RULE_MAX / GUIDANCE_TOTAL_MAX in sierra_training.js; raising one
// side alone just moves the silent truncation to the other side.
const GUIDANCE_MAX_RULES = 10;
const GUIDANCE_MAX_CHARS = 9000;
const GUIDANCE_MAX_CHARS_PER_RULE = 1500;
async function fetchTeamGuidance(sb: any): Promise<string> {
  try {
    const { data, error } = await sb
      .from("sierra_guidance")
      .select("rule")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(GUIDANCE_MAX_RULES);
    if (error || !data || data.length === 0) return "";
    let out = "";
    for (const r of data) {
      const rule = String(r.rule || "").trim().slice(0, GUIDANCE_MAX_CHARS_PER_RULE);
      if (!rule) continue;
      if (out.length + rule.length > GUIDANCE_MAX_CHARS) break;
      out += `\n- ${rule}`;
    }
    if (!out) return "";
    return `\n\nTEAM GUIDANCE (directives added by the CPL/MAP team — follow them; if one conflicts with the general instructions above, the team guidance wins):${out}`;
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
      status: 429,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const { query, session_id, history, audience, ctx } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const trimmedQuery = query.trim().slice(0, 1000);

    // Optional audience (primary population) — validated against the known
    // keys; anything else (or absent, e.g. the production widget) → null.
    const audienceKey: string | null =
      typeof audience === "string" && AUDIENCE_RULES[audience] ? audience : null;

    // Optional context variant (v27 — the external/vendor contacts gate).
    // FAIL-OPEN by design: ONLY the exact string "external" changes anything.
    // Absent or unknown values — i.e. every existing caller: the COBI tab, the
    // standalone sierra/ page, the Fact Sheet drawer, the production
    // map.rccd.edu widget — keep today's behavior, contacts included. An
    // external embed (the vendor platform; sierra/?ctx=external for iframes)
    // sends ctx:"external" to suppress college staff contact names/emails from
    // the college context (contacts are reviewer-gated elsewhere on the
    // platform — the embed shouldn't broadcast them). Smoke mode 14 guards
    // BOTH directions.
    const externalCtx = ctx === "external";

    // Optional conversation history (multi-turn). Backward-compatible: callers
    // that omit it (e.g. the production widget) stay single-turn. Sanitize to
    // {role:"user"|"assistant", content:string}; keep the last 6 turns.
    const convoRaw = (Array.isArray(history) ? history : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant")
        && typeof m.content === "string" && m.content.trim().length > 0)
      .slice(-6)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    // Anthropic requires the messages array to start with a user turn and
    // alternate — drop any leading assistant turn from the trimmed window.
    const firstUser = convoRaw.findIndex((m: any) => m.role === "user");
    const convo = firstUser < 0 ? [] : convoRaw.slice(firstUser);
    // multiTurn = the CLIENT opted into a back-and-forth by sending a `history`
    // field (even an empty []). This gates the "ask a focusing follow-up before
    // dumping a big list" behavior — which is most useful on the FIRST broad
    // question, when convo is still empty. The production widget omits `history`
    // entirely → single-turn → never asks (unchanged behavior).
    const multiTurn = Array.isArray(history);

    // Retrieval text: a follow-up that only NARROWS by place/region or says
    // "show all" ("Southern California", "How about West LA? I live near there.")
    // carries no NEW topic of its own — and the real subject ("real estate
    // license") may be SEVERAL turns back, not just the last one. So when the
    // current turn has no topic keywords of its own (after dropping place/region
    // and continuation noise), fold the WHOLE recent conversation's user turns
    // into the retrieval text so topic/college search still finds that subject.
    // A genuine topic switch (>=2 of its own topic words, e.g. "what about
    // nursing?") searches the new topic instead, unaffected.
    const priorUserText = convo
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content)
      .join("  ");
    const ownTopic = extractTopicKeywords(trimmedQuery).filter((w) => !REFINE_NOISE.has(w));
    const isRefinement = priorUserText.length > 0 && ownTopic.length < 2;
    // Current query FIRST so it's never lost to the 1000-char cap.
    const searchText = (isRefinement ? `${trimmedQuery}  ${priorUserText}` : trimmedQuery).slice(0, 1000);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Generate query embedding (over the retrieval text)
    // @ts-ignore
    const session = new Supabase.ai.Session("gte-small");
    const queryEmbedding = await session.run(searchText, {
      mean_pool: true,
      normalize: true,
    });

    // 2. Vector search + college detection + live metrics + topic search +
    //    course-catalog offerings + team guidance (parallel)
    const [searchResult, collegeProfile, liveMetrics, topicResults, offeringsResults, teamGuidance, geoMap, creditData] = await Promise.all([
      sb.rpc("match_document_sections", {
        query_embedding: Array.from(queryEmbedding),
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
      }),
      detectAndFetchCollegeProfile(searchText, sb),
      fetchLiveMetrics(),
      searchExhibitsByTopic(searchText, sb), // earned-exhibit set (no college filter)
      searchCollegeOfferings(searchText, sb), // course catalog: who TEACHES this
      fetchTeamGuidance(sb),                  // sierra_guidance active rows (v25)
      fetchCollegeGeoMap(sb),                 // region/county for every college (v30)
      fetchCreditData(sb),                    // published credit-disposition aggregates (v36)
    ]);

    const sections = searchResult.data;
    if (searchResult.error) {
      console.error("Search error:", searchResult.error);
      return new Response(JSON.stringify({ error: "Search failed", details: searchResult.error.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 3. Determine search mode and build context
    let searchMode: "college" | "topic" | "college_topic" | "general" = "general";
    let collegeContext = "";
    let topicContext = "";

    // If college detection was AMBIGUOUS (a token like "west" ilike-matched
    // several colleges → an array) but the topic search DID find exhibits, narrow
    // to the matched college that actually has topic hits. Otherwise we'd fall
    // into college-only mode and silently DISCARD the topic results — the West-LA
    // real-estate bug (5 "west" colleges → array → topic dropped → "no real
    // estate" even though West LA has the exhibit).
    let resolvedProfile: any = collegeProfile;
    if (Array.isArray(collegeProfile) && collegeProfile.length > 1 && topicResults && topicResults.length > 0) {
      const ranked = collegeProfile
        .map((p: any) => ({ p, n: topicResults.filter((r: any) => r.college === p.college).length }))
        .filter((x: any) => x.n > 0)
        .sort((a: any, b: any) => b.n - a.n);
      if (ranked.length > 0) resolvedProfile = ranked[0].p;
    }

    const singleProfile = resolvedProfile && !Array.isArray(resolvedProfile) ? resolvedProfile :
                          (Array.isArray(resolvedProfile) && resolvedProfile.length === 1 ? resolvedProfile[0] : null);

    // The home college's own region/county — the anchor BOTH lists rank against.
    // Null whenever the question names no college, which leaves every list in its
    // previous volume-first order.
    const askedGeo = singleProfile ? geoMap.get(singleProfile.college) || null : null;

    if (singleProfile && topicResults && topicResults.length > 0) {
      // COMBINED MODE: both college and topic detected
      searchMode = "college_topic";
      collegeContext = buildCollegeContext(
        await withLiveContacts(singleProfile, sb, !externalCtx), !externalCtx);

      // Filter topic results: show college-specific matches first, then others
      const collegeName = singleProfile.college;
      const atCollege = topicResults.filter((r: any) => r.college === collegeName);
      const atOtherColleges = topicResults.filter((r: any) => r.college !== collegeName);

      if (atCollege.length > 0) {
        topicContext = buildTopicContext(atCollege, true);
        // Also mention other colleges if they have results
        if (atOtherColleges.length > 0) {
          const otherCollegeCount = new Set(atOtherColleges.map((r: any) => r.college)).size;
          topicContext += `\n(${atOtherColleges.length} additional matching exhibits found at ${otherCollegeCount} other college(s) — mention these as alternatives if helpful.)\n`;
        }
      } else {
        // College has no matching exhibits for this topic — show all results,
        // ordered nearest-first so the peer we hold up as proof is a plausible
        // neighbour rather than whichever college happens to hold the most rows.
        topicContext = buildTopicContext(topicResults, false, geoMap, askedGeo);
        topicContext = `\n\nNote: ${collegeName} does not currently have CPL exhibits matching this topic in our database.\n` + topicContext;
      }

    } else if (singleProfile || (Array.isArray(resolvedProfile) && resolvedProfile.length > 0)) {
      // COLLEGE-ONLY MODE
      searchMode = "college";
      collegeContext = buildCollegeContext(
        await withLiveContacts(resolvedProfile, sb, !externalCtx), !externalCtx);

    } else if (topicResults && topicResults.length > 0) {
      // TOPIC-ONLY MODE
      searchMode = "topic";
      topicContext = buildTopicContext(topicResults, false);

    }
    // else: GENERAL MODE — just RAG + live metrics

    // Course-catalog offerings context — WHAT colleges teach (the adoption basis).
    // Available in every mode; ranked against the same askedGeo anchor as the
    // exhibit list above, with geoMap filling in any row the RPC left ungeocoded.
    let offeringsContext = "";
    if (offeringsResults && offeringsResults.length > 0) {
      const askedCollege = singleProfile?.college || null;
      const coreKeywords = expandWithSynonyms(extractTopicKeywords(searchText));
      offeringsContext = buildOfferingsContext(offeringsResults, askedCollege, askedGeo, coreKeywords, geoMap);
    }

    // Credit disposition — shaped once detection has resolved, so "at MY college"
    // questions get the named row. With no college detected it still carries the
    // statewide roll-up, which is what a "how is CPL going?" question needs.
    const creditContext = buildCreditContext(
      shapeCreditStatus(creditData, singleProfile?.college || null));

    // Route CRED-STD — the canonical credential record. Looked up on every
    // question because a credential can be named in any of them, and the two
    // RPCs are cheap indexed reads over 1,987 rows. The statewide lens runs
    // first; the catalogue-wide lens only when it comes back empty, so the
    // "no statewide recommendation, but it exists locally" answer is available
    // without a second round-trip on the common path.
    // Routes CRED-VOLUME + COLLEGE-ADOPT read pre-computed rollups, never the
    // 537,908-row student grain — aggregating that live measured >60s against a
    // 1.7-5.0s budget. Adoption only fires once a college is known, since "what
    // could I adopt?" is meaningless without a subject.
    //
    // The credential group and the volume group are independent, so they now run
    // CONCURRENTLY (they used to be sequential). That buys back more than the
    // one round-trip the recommendation lookup below adds. Each group swallows
    // its own failure: one dead route must never take the whole answer down.
    let credentialContext = "";
    let volumeContext = "";
    let alignmentContext = "";
    let stdRecs: any = null, anyCreds: any = null, vol: any = null, adopt: any = null;
    let collegeCreds: any = null;

    await Promise.all([
      (async () => {
        try {
          stdRecs = await fetchStatewideRecommendations(searchText, sb);
          anyCreds = stdRecs && stdRecs.length > 0
            ? null
            : await fetchAnyCredentials(searchText, sb);
        } catch (e) {
          console.error("credential lookup failed:", e);
        }
      })(),
      // Route COLLEGE-CRED, in its own lane. Runs UNCONDITIONALLY when a college
      // is known — deliberately NOT gated on the topic route coming back empty,
      // because the raw corpus returning rows does not mean it returned the
      // RIGHT rows, and the curated names are the more trustworthy of the two.
      (async () => {
        try {
          collegeCreds = await fetchCollegeCredentials(
            searchText, singleProfile?.college || null, sb);
        } catch (e) {
          console.error("college credential lookup failed:", e);
        }
      })(),
      (async () => {
        try {
          const both = await Promise.all([
            fetchCredentialVolume(searchText, sb),
            fetchAdoptionOpportunities(singleProfile?.college || null, sb),
          ]);
          vol = both[0];
          adopt = both[1];
        } catch (e) {
          console.error("credential volume lookup failed:", e);
        }
      })(),
    ]);

    // ONE batched lookup of the full credit-recommendation set for every
    // credential the routes above matched — the fix for Sierra naming one of
    // POST's ten courses. Batched after the fact rather than joined into each
    // RPC so there is a single round-trip however many routes fired.
    // Declared OUTSIDE the try so the college-credential section below can render
    // its course lines from the same single lookup. Stays null if the enrichment
    // throws, which degrades that section to names-only rather than losing it.
    let recsMap: Map<string, any> | null = null;
    try {
      const titles = [
        ...(stdRecs || []), ...(anyCreds || []), ...(vol || []), ...(adopt || []),
        // COLLEGE-CRED joins the SAME batch (v45). Its titles come from the same
        // curated table, so they resolve identically — and batching keeps the
        // one-round-trip guarantee this block was built around.
        ...(collegeCreds || []),
      ].map((r: any) => r?.unified_title).filter(Boolean);
      // Adopter NAMES ride the same batch (v47). Two round-trips, not one per
      // credential, and both keyed on titles already matched — see
      // fetchCredentialAdopters for why this is a lookup, not a second matcher.
      const [recs, adopters] = await Promise.all([
        fetchCredentialRecs(titles, sb),
        fetchCredentialAdopters(titles, sb),
      ]);
      recsMap = recs;
      credentialContext = buildCredentialContext(stdRecs, anyCreds, recs, adopters);
      volumeContext = buildVolumeContext(vol, adopt, singleProfile?.college || null, recs);

      // Route ALIGN. Runs on the STRONGEST-matched credential only: the answer
      // is a per-recommendation worklist, and running it for every loosely
      // matched credential would bury the one the person asked about.
      const college = singleProfile?.college || null;
      const topTitle = (stdRecs && stdRecs[0]?.unified_title)
        || (anyCreds && anyCreds[0]?.unified_title) || null;
      if (college && topTitle) {
        const align = await fetchAlignment(topTitle, college, sb);
        alignmentContext = buildAlignmentContext(align, topTitle, college);
      }
    } catch (e) {
      // The lines are an enrichment. Losing them must cost the DETAIL, never the
      // credential sections themselves — so rebuild without them rather than
      // leaving Sierra with no credential context at all.
      console.error("credential recs lookup failed:", e);
      credentialContext = buildCredentialContext(stdRecs, anyCreds);
      volumeContext = buildVolumeContext(vol, adopt, singleProfile?.college || null);
    }

    // Appended OUTSIDE the try/catch above, deliberately: both branches rebuild
    // credentialContext from scratch, so appending inside either one would drop
    // this section on the path that fails. Telling a student a college has no
    // ironworker CPL when it has thirteen is a worse failure than losing
    // recommendation detail, so it must survive the enrichment breaking.
    if (collegeCreds && singleProfile && singleProfile.college) {
      credentialContext += buildCollegeCredentialContext(
        collegeCreds, singleProfile.college, recsMap);
    }

    // The curator overlay for the built-in rules. Rides the same turn; null
    // (a failed or empty read) means every rule comes from its code default,
    // which is the governed state — never the ungoverned one.
    const rulesOverlay = await fetchSierraRules(sb);
    const ruleReport = { fired: [] as string[], overridden: [] as string[] };

    const systemPrompt = buildSystemPrompt(
      sections || [], liveMetrics, collegeContext, topicContext, searchMode,
      multiTurn, offeringsContext, audienceKey ? AUDIENCE_RULES[audienceKey] : "",
      teamGuidance || "", creditContext, credentialContext, volumeContext, alignmentContext,
      rulesOverlay, ruleReport);

    // 4. Call Claude Sonnet
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages: [...convo, { role: "user", content: trimmedQuery }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error(`Anthropic error ${anthropicRes.status}: ${errBody}`);
      return new Response(JSON.stringify({ error: "AI response failed", status: anthropicRes.status, details: errBody }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 5. Stream response
    const encoder = new TextEncoder();
    let fullResponse = "";
    let responseTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const sourcesData = (sections || []).map((s: any) => ({
          id: s.id,
          heading: s.heading,
          similarity: s.similarity,
        }));
        controller.enqueue(
          encoder.encode(`event: sources\ndata: ${JSON.stringify(sourcesData)}\n\n`)
        );

        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const event = JSON.parse(data);
                  if (event.type === "content_block_delta" && event.delta?.text) {
                    fullResponse += event.delta.text;
                    controller.enqueue(
                      encoder.encode(`event: text\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                    );
                  }
                  if (event.type === "message_delta" && event.usage) {
                    responseTokens = event.usage.output_tokens || 0;
                  }
                } catch { /* skip */ }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();

        try {
          await sb.from("chat_interactions").insert({
            session_id: session_id || null,
            question: trimmedQuery,
            response: fullResponse,
            source_sections: sourcesData,
            top_similarity: sections?.[0]?.similarity || null,
            response_tokens: responseTokens,
            topic_match: searchMode === "topic" || searchMode === "college_topic",
            audience: audienceKey,
            // Which rules were actually in play for THIS answer, and which of
            // them a curator had overridden. Recorded per turn because the
            // question that matters is asked about a turn that misbehaved, and
            // reasoning back from the current code cannot answer it — the code
            // may have changed, and the overlay certainly may have.
            rules_fired: ruleReport.fired,
            rules_overridden: ruleReport.overridden,
          });
        } catch (logErr) {
          console.error("Failed to log interaction:", logErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
