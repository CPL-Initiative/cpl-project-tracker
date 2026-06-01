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
  electrician: ["electrical", "ibew", "apprentice"],
  dental: ["dentist", "hygiene", "rdh"],
  aviation: ["faa", "flight", "aircraft", "airframe", "powerplant", "pilot"],
  cyber: ["cybersecurity", "comptia", "network", "ethical"],
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
]);

function extractTopicKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !TOPIC_STOP_WORDS.has(w));
}

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
    ctx += `\n### STATEWIDE COLLABORATIVE (CCC) EXHIBITS — available at multiple colleges\n`;
    ctx += `${statewideExhibits.length} statewide exhibit(s) found:\n`;
    for (const ex of statewideExhibits) {
      ctx += `  - ${ex.exhibit_title} [Statewide Collaborative]`;
      if (ex.discipline) ctx += ` [${ex.discipline}]`;
      ctx += ` — ${ex.rec_count} credit recommendation(s)`;
      ctx += ` (via ${ex.college})`;
      if (ex.landing_page_url) ctx += ` | Landing page: ${ex.landing_page_url}`;
      ctx += `\n`;
      if (ex.sample_credit_recs && ex.sample_credit_recs.length > 0) {
        ctx += `    Sample credits: ${ex.sample_credit_recs.slice(0, 3).join("; ")}`;
        if (ex.rec_count > 3) ctx += ` ... and ${ex.rec_count - 3} more`;
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
        if (ex.rec_count > 1) ctx += ` (${ex.rec_count} credit recs)`;
        ctx += `\n`;
        if (ex.sample_credit_recs && ex.sample_credit_recs.length > 0) {
          ctx += `    Credits: ${ex.sample_credit_recs.slice(0, 2).join("; ")}`;
          if (ex.rec_count > 2) ctx += ` ... +${ex.rec_count - 2} more`;
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

function buildCollegeContext(profile: any): string {
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

    const contacts = p.contacts || {};
    const coordinator = contacts.cpl_coordinator || contacts.primary_contact;
    const email = contacts.cpl_coordinator_email || contacts.primary_contact_email;
    if (coordinator && coordinator !== "" && coordinator !== "NA") {
      ctx += `\nCPL Contact: ${coordinator}`;
      if (email && email !== "" && email !== "NA") ctx += ` (${email})`;
      ctx += `\n`;
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

function buildSystemPrompt(
  sections: any[],
  liveMetrics: any,
  collegeContext: string,
  topicContext: string,
  searchMode: "college" | "topic" | "college_topic" | "general"
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

  let specialInstruction = "";
  switch (searchMode) {
    case "college_topic":
      specialInstruction = `\n\nThe visitor is asking about a SPECIFIC TOPIC at a SPECIFIC COLLEGE. This is a combined query. You have both the college profile and topic search results below. Present what you found:\n- If the college has matching exhibits for this topic, show those first with credit recommendation counts and details.\n- If the college does NOT have exhibits for this topic, say so clearly and helpfully — then show other colleges that DO offer CPL for this topic.\n- Highlight any Statewide Collaborative (CCC) exhibits, which are available across multiple colleges including potentially the one asked about.\n- Always share the CPL Landing Page URL so the visitor can explore exhibits and submit CPL requests.\n- Mention the total number of credit recommendations available (rec_count), not just the sample shown.`;
      break;

    case "college":
      specialInstruction = `\n\nThe visitor is asking about a specific college. Use the college profile data below to give a specific, data-backed answer. Mention their exhibits, credit recommendations, disciplines, and CPL contact person when relevant. Cite specific numbers naturally. If a CPL Landing Page URL is provided for the college, share it with the visitor and let them know they can visit that page to search for credit recommendations, view available exhibits, and submit CPL requests at their college.`;
      break;

    case "topic":
      specialInstruction = `\n\nThe visitor is asking about a specific topic, credential, or license — not a particular college. Topic search results below show which colleges have matching CPL exhibits. Present the results organized by college:\n- Lead with Statewide Collaborative (CCC) exhibits first — these are available at many colleges.\n- Then show local exhibits grouped by college, starting with those that have the most matches.\n- Mention the total number of credit recommendations available per exhibit (rec_count), not just the samples shown.\n- Always share the CPL Landing Page URL for each college so the visitor can explore further and submit CPL requests.\n- If many colleges match, highlight the top 4-5 most relevant and mention the total count.\n- Be specific about what credit is available.`;
      break;
  }

  return `You are the CPL Chatbox, a helpful assistant on map.rccd.edu that answers questions about Credit for Prior Learning (CPL), the MAP platform, and related California Community College initiatives.

Your knowledge comes from the sources below. Answer based on these sources. If the sources don't contain enough information to fully answer, say so honestly and suggest the visitor contact the MAP team at MAP@rccd.edu.

Be concise, friendly, and professional. Use plain language.

IMPORTANT: When citing any numbers or metrics (student counts, units, savings, college counts, etc.), ALWAYS use the "LIVE CPL Dashboard Metrics" section below. These live numbers are scraped directly from the CCCCO Dashboard and are the most current. If a vault source below mentions a different number for the same metric, the live dashboard number is correct and the vault source is outdated. This applies especially to military/veteran student counts, savings figures, and unit totals.

${context}${metricsContext}${collegeContext}${topicContext}${specialInstruction}`;
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
    const { query, session_id } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const trimmedQuery = query.trim().slice(0, 1000);
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Generate query embedding
    // @ts-ignore
    const session = new Supabase.ai.Session("gte-small");
    const queryEmbedding = await session.run(trimmedQuery, {
      mean_pool: true,
      normalize: true,
    });

    // 2. Vector search + college detection + live metrics + topic search (parallel)
    const [searchResult, collegeProfile, liveMetrics, topicResults] = await Promise.all([
      sb.rpc("match_document_sections", {
        query_embedding: Array.from(queryEmbedding),
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
      }),
      detectAndFetchCollegeProfile(trimmedQuery, sb),
      fetchLiveMetrics(),
      searchExhibitsByTopic(trimmedQuery, sb), // broad search first (no college filter)
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

    const singleProfile = collegeProfile && !Array.isArray(collegeProfile) ? collegeProfile :
                          (Array.isArray(collegeProfile) && collegeProfile.length === 1 ? collegeProfile[0] : null);

    if (singleProfile && topicResults && topicResults.length > 0) {
      // COMBINED MODE: both college and topic detected
      searchMode = "college_topic";
      collegeContext = buildCollegeContext(singleProfile);

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

    } else if (singleProfile || (Array.isArray(collegeProfile) && collegeProfile.length > 0)) {
      // COLLEGE-ONLY MODE
      searchMode = "college";
      collegeContext = buildCollegeContext(collegeProfile);

    } else if (topicResults && topicResults.length > 0) {
      // TOPIC-ONLY MODE
      searchMode = "topic";
      topicContext = buildTopicContext(topicResults, false);

    }
    // else: GENERAL MODE — just RAG + live metrics

    const systemPrompt = buildSystemPrompt(sections || [], liveMetrics, collegeContext, topicContext, searchMode);

    // 4. Call Claude Sonnet
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: trimmedQuery }],
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
