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

  // 2. Try fuzzy match against database — ilike search
  const words = q.split(/\s+/).filter((w: string) => w.length >= 4 && ![
    "what", "does", "have", "about", "their", "they", "credit",
    "college", "community", "many", "much", "with", "from",
    "that", "this", "there", "here", "where", "when", "which",
    "could", "would", "should", "will", "been", "being",
    "your", "some", "more", "most", "other", "than", "then",
    "fire", "firefighter", "real", "estate", "nurse", "nursing",
    "emt", "paramedic", "welding", "cosmetology", "police",
    "officer", "post", "apprentice", "military", "veteran",
  ].includes(w));

  for (const word of words) {
    const { data } = await sb
      .from("chatbox_college_profiles")
      .select("*")
      .ilike("college", `%${word}%`)
      .limit(3);
    if (data && data.length === 1) return data[0];
    if (data && data.length > 1) {
      for (const d of data) {
        const name = d.college.toLowerCase();
        if (words.filter((w: string) => name.includes(w)).length >= 2) return d;
      }
      return data;
    }
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

/** Expand topic keywords with synonyms to catch related exhibits */
function expandWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set(keywords);
  for (const kw of keywords) {
    const syns = TOPIC_SYNONYMS[kw];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
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

  // Strategy 1: Full-text search using PostgreSQL ts_query
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

// Fetch a college's region/county so we can rank "nearby colleges that teach X".
async function fetchCollegeGeo(college: string, sb: any): Promise<any | null> {
  if (!college) return null;
  const { data } = await sb.from("college_geo").select("region, county").eq("college", college).single();
  return data || null;
}

// ── Build offerings context (what colleges TEACH — the adoption basis) ──────────
function buildOfferingsContext(
  offerings: any[],
  askedCollege: string | null,
  askedGeo: any | null,
  coreKeywords: string[] = [],
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
    const g = byCollege.get(o.college) || { rows: [], courses: 0, core: false, region: o.region || null, county: o.county || null };
    g.rows.push(o);
    g.courses += o.course_count || 0;
    if (isCore(o)) g.core = true;
    byCollege.set(o.college, g);
  }

  // Rank: colleges that teach the CORE discipline first, then proximity to the
  // asked college (same county > same region), then how much they teach.
  const rank = (g: any) => {
    let p = g.core ? 200 : 0;
    if (askedGeo?.county && g.county === askedGeo.county) p += 100;
    if (askedGeo?.region && g.region === askedGeo.region) p += 40;
    return p + Math.min(g.courses, 39);
  };

  const askedRaw = askedCollege ? byCollege.get(askedCollege) : null;
  // Only treat the asked college as "teaches this" when it has a CORE match.
  const asked = askedRaw && askedRaw.core ? askedRaw : null;
  const others = [...byCollege.entries()]
    .filter(([c]) => c !== askedCollege)
    .sort((a, b) => rank(b[1]) - rank(a[1]));

  const fmtCollege = (college: string, g: any) => {
    let s = `\n## ${college}`;
    if (g.county || g.region) s += ` (${[g.county && g.county + " County", g.region].filter(Boolean).join(", ")})`;
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
function buildTopicContext(results: any[], isCollegeSpecific: boolean = false): string {
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
    ctx += `\n### LOCAL EXHIBITS by college\n`;
    // Sort colleges by number of exhibits (most first)
    const sortedColleges = [...byCollege.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [college, exhibits] of sortedColleges) {
      const url = exhibits[0]?.landing_page_url;
      const collegeRecTotal = exhibits.reduce((sum: number, e: any) => sum + (e.rec_count || 0), 0);
      ctx += `\n## ${college} — ${exhibits.length} exhibit(s), ${collegeRecTotal} credit recommendation(s)`;
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

// includeContacts (v27): false suppresses the CPL-contact name/email line —
// the external/vendor embeds (ctx:"external"). Default true = every existing
// caller unchanged (fail-open).
function buildCollegeContext(profile: any, includeContacts: boolean = true): string {
  if (!profile) return "";
  const profiles = Array.isArray(profile) ? profile : [profile];

  return "\n\n" + profiles.map((p: any) => {
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
      const contacts = p.contacts || {};
      const coordinator = contacts.cpl_coordinator || contacts.primary_contact;
      const email = contacts.cpl_coordinator_email || contacts.primary_contact_email;
      if (coordinator && coordinator !== "" && coordinator !== "NA") {
        ctx += `\nCPL Contact: ${coordinator}`;
        if (email && email !== "" && email !== "NA") ctx += ` (${email})`;
        ctx += `\n`;
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
const STATEWIDE_RULE = `\n\nABOUT STATEWIDE COLLABORATIVE (CCC) CREDIT RECOMMENDATIONS: these are system-wide standards developed through statewide faculty workgroups — they are NOT housed at, or owned by, any single college (one college may serve as the initiator or lead that signs off, but that does not make it "the place" to get the credit). Local colleges ADOPT or ADAPT them, and a student earns/accesses them through THEIR OWN college's CPL landing page. So when presenting a statewide standard: describe it as available system-wide, and point the visitor to their own (or a chosen) college's CPL landing page to pursue it — never tell them to go to one specific college's page to "access" a statewide credit.`;
// #2 — List course titles + units, not a bare count.
const CREDIT_LIST_RULE = `\n\nWHEN DESCRIBING WHAT CREDIT IS AVAILABLE: do NOT just state a count like "6 credit recommendations." Instead, LIST the specific course titles and the units/credit each is eligible for, using the "Eligible courses (title — units/credit)" lines provided, e.g. "Fire Behavior and Combustion (3 units); Principles of Emergency Services (3 units)". If more exist than are listed in the context, add "…and more" rather than inventing course names.`;
// #4 — Use the course catalog (what colleges TEACH) to reason about ADOPTION and to
// redirect to the nearest teaching college. This is the key upgrade for detailed
// questions like "which nearby college could give my students CPL for NCCER?"
const OFFERINGS_RULE = `\n\nABOUT THE "COURSE CATALOG / WHICH COLLEGES TEACH THIS" SECTION (if present): this shows which colleges currently TEACH courses in a discipline (their curriculum). This is DIFFERENT from a CPL exhibit/articulation — teaching a course does NOT mean the college has set up CPL credit for a credential yet. Use it to reason like a CPL advisor:
- If a college TEACHES the relevant discipline but has NO matching CPL exhibit, present it as a strong ADOPTION OPPORTUNITY: e.g. "El Camino already teaches construction courses (CTEC 170, CTEC 503 OSHA), so it's well positioned to award CPL for NCCER — the college's CPL coordinator would set up that articulation." Frame it invitingly, never as a deficiency.
- If the college the visitor named does NOT teach the discipline, say so warmly and point them to the NEAREST colleges that DO (use the county/region provided — closest first).
- When a peer college has ALREADY articulated the credential (from the exhibit results), name it as proof it can be done ("Barstow and Norco have already set up NCCER credit").
- ALWAYS add that teaching a course is not a guarantee of credit — the student/organization should contact the college's CPL coordinator to request a review. Never claim an articulation exists when only a course is taught.
- The catalog list shows the TOP matching colleges, NOT an exhaustive list. NEVER conclude that a college does NOT teach a subject just because it isn't shown — many colleges that teach it may not appear. If a specific college the visitor named is not in the list, do NOT say it lacks the courses; say you're not certain from the data at hand and suggest checking that college's catalog or CPL coordinator.`;

// #6 — Missing/unconfigured CPL landing pages (v23 — Sam, 2026-07-01: "not all
// colleges have configured their CPL Landing pages"). Never invent a link;
// turn the gap into two concrete next steps.
const LANDING_PAGE_RULE = `\n\nIF A COLLEGE HAS NO "CPL Landing Page" URL in the context above (or the visitor says a college's CPL page isn't working or isn't set up): do NOT invent or guess a link. Say warmly that the college doesn't appear to have its CPL landing page configured yet, and give two concrete steps: (1) contact that college's CPL coordinator or counseling/admissions office directly — it's perfectly fair to ask the college to set up its CPL landing page; (2) email the MAP team at MAP@rccd.edu to flag the missing page and get help finding the right contact at that college.`;

// #5 — Audience-aware voice (v22, Session 92). The COBI CPL Assistant tab and
// the standalone sierra/ page send an optional `audience` key = the visitor's
// self-selected PRIMARY population. Same facts, framed for the reader — the
// driving case: students must never get system inside-baseball. Callers that
// omit the field (the production map.rccd.edu widget) get the default voice,
// unchanged. Keys must match the AUDIENCES list in cpl_chat.js / sierra.js.
const AUDIENCE_RULES: Record<string, string> = {
  student: `\n\nAUDIENCE: a STUDENT or prospective student. Speak directly to them ("you"). Plain, encouraging language — no system inside-baseball: do NOT mention articulation mechanics, "exhibits", TOP codes, COCI, C-ID governance, apportionment/funding, MIS, or Chancellor's Office process; if such a concept is unavoidable, translate it into plain words (e.g. "credit the college has already approved for this certification"). Focus on what THEY can do: what their license/training/experience could be worth in credit, which courses it may cover, and the concrete next step — their college's CPL landing page or CPL coordinator. Never imply credit is guaranteed; the college makes the final call.`,
  faculty: `\n\nAUDIENCE: COLLEGE FACULTY. Curricular vocabulary is welcome (articulation, credit recommendation, C-ID, units). Emphasize how the credential maps to specific courses, what peer colleges have already articulated (evidence a local review is warranted), and that faculty ratify CPL through their local process. Where relevant, note that adopting an existing Statewide Collaborative (CCC) recommendation is a lighter lift than building one from scratch.`,
  administrator: `\n\nAUDIENCE: a COLLEGE ADMINISTRATOR. Frame around participation, student outcomes, and implementation: adoption opportunities (what peers have articulated that this college could), what unlocks more activity, and who acts next (CPL coordinator, curriculum committee, faculty leads). Metrics and funding context are appropriate. Keep the tone inviting — never imply a college is negligent or behind.`,
  employer: `\n\nAUDIENCE: an EMPLOYER / INDUSTRY PROFESSIONAL. Focus on how their employees' or trainees' certifications, licenses, and training convert to college credit: which credentials are recognized, which nearby colleges to partner with, and how to start (the college's CPL coordinator). Plain business language — skip system acronyms and internal process detail.`,
  civic: `\n\nAUDIENCE: a CIVIC / COMMUNITY LEADER. Frame around community impact and access: what CPL means for their constituents (veterans, working adults, apprentices), statewide results (students served, savings), and how to connect people to a local college's CPL program. Plain language; statewide numbers are welcome; skip internal system mechanics.`,
};

function buildSystemPrompt(
  sections: any[],
  liveMetrics: any,
  collegeContext: string,
  topicContext: string,
  searchMode: "college" | "topic" | "college_topic" | "general",
  multiTurn: boolean = false,
  offeringsContext: string = "",
  audienceRule: string = "",
  teamGuidance: string = ""
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

  return `You are the CPL Chatbox, a helpful assistant on map.rccd.edu that answers questions about Credit for Prior Learning (CPL), the MAP platform, and related California Community College initiatives.

Your knowledge comes from the sources below. Answer based on these sources. If the sources don't contain enough information to fully answer, say so honestly and suggest the visitor contact the MAP team at MAP@rccd.edu.

Be concise, friendly, and professional. Use plain language.

IMPORTANT: When citing any numbers or metrics (student counts, units, savings, college counts, etc.), ALWAYS use the "LIVE CPL Dashboard Metrics" section below. These live numbers are scraped directly from the CCCCO Dashboard and are the most current. If a vault source below mentions a different number for the same metric, the live dashboard number is correct and the vault source is outdated. This applies especially to military/veteran student counts, savings figures, and unit totals.

${context}${metricsContext}${collegeContext}${topicContext}${offeringsContext}${STATEWIDE_RULE}${CREDIT_LIST_RULE}${OFFERINGS_RULE}${LANDING_PAGE_RULE}${specialInstruction}${audienceRule}${teamGuidance}`;
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
const GUIDANCE_MAX_RULES = 10;
const GUIDANCE_MAX_CHARS = 2500;
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
      const rule = String(r.rule || "").trim().slice(0, 500);
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
    const [searchResult, collegeProfile, liveMetrics, topicResults, offeringsResults, teamGuidance] = await Promise.all([
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

    if (singleProfile && topicResults && topicResults.length > 0) {
      // COMBINED MODE: both college and topic detected
      searchMode = "college_topic";
      collegeContext = buildCollegeContext(singleProfile, !externalCtx);

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
        // College has no matching exhibits for this topic — show all results
        topicContext = buildTopicContext(topicResults, false);
        topicContext = `\n\nNote: ${collegeName} does not currently have CPL exhibits matching this topic in our database.\n` + topicContext;
      }

    } else if (singleProfile || (Array.isArray(resolvedProfile) && resolvedProfile.length > 0)) {
      // COLLEGE-ONLY MODE
      searchMode = "college";
      collegeContext = buildCollegeContext(resolvedProfile, !externalCtx);

    } else if (topicResults && topicResults.length > 0) {
      // TOPIC-ONLY MODE
      searchMode = "topic";
      topicContext = buildTopicContext(topicResults, false);

    }
    // else: GENERAL MODE — just RAG + live metrics

    // Course-catalog offerings context — WHAT colleges teach (the adoption basis).
    // Available in every mode. When a single college is in focus, fetch its
    // region/county so we can rank "nearest colleges that teach this".
    let offeringsContext = "";
    if (offeringsResults && offeringsResults.length > 0) {
      const askedCollege = singleProfile?.college || null;
      const askedGeo = askedCollege ? await fetchCollegeGeo(askedCollege, sb) : null;
      const coreKeywords = expandWithSynonyms(extractTopicKeywords(searchText));
      offeringsContext = buildOfferingsContext(offeringsResults, askedCollege, askedGeo, coreKeywords);
    }

    const systemPrompt = buildSystemPrompt(
      sections || [], liveMetrics, collegeContext, topicContext, searchMode,
      multiTurn, offeringsContext, audienceKey ? AUDIENCE_RULES[audienceKey] : "",
      teamGuidance || "");

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
