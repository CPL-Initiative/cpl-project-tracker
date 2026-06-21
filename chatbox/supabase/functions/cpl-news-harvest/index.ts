// cpl-news-harvest — CPL News aggregation Edge Function.
//
// Runs on a schedule (the .github/workflows/cpl-news.yml cron curls it with the
// project's service-role key as the bearer) — NOT part of the daily dashboard
// cron. It:
//   1) HARVESTS candidate items from a pluggable list of FREE adapters
//      (Google News RSS, GDELT 2.0, CalMatters RSS, CCCCO press releases,
//      Bluesky public search) + a manual "suggest a story" queue
//      (public.cpl_news_requests) — the path by which closed social platforms
//      (LinkedIn / X / Facebook / Instagram) enter, since their APIs are
//      closed/paywalled in 2026 (a human pastes a URL → we read its OpenGraph
//      preview, no scraping).
//   2) DEDUPES against existing rows (by url + normalized title_key).
//   3) ANALYZES new candidates with Claude (claude-sonnet-4-6, unversioned
//      alias per the retired-model 502 lesson): is it genuinely CPL-relevant
//      (incl. adjacent systems — Career Passport, CA Master Plan for Education,
//      workforce/upskilling, CA budget items touching CPL)? scope (CA-first),
//      topics, related system, a neutral 1-2 sentence summary (LINK OUT — we
//      never republish article bodies), relevance score.
//   4) UPSERTS accepted items into public.cpl_news (insert-once on url).
//
// Source-of-record is the LIVE function; this file is the in-repo capture
// (mirror of the cpl-chat convention). Re-deploy with the Supabase MCP
// deploy_edge_function (project hvuwhnbuahrtptokpqfh, slug cpl-news-harvest).
//
// Auth: the caller MUST present the project service-role key as the bearer
// (the cron has it as the SUPABASE_SERVICE_KEY Actions secret). Anon callers
// are rejected — the public never invokes this; they only INSERT into
// cpl_news_requests (anon RLS) and the next run picks it up.
//
// Secrets used (all already set project-wide; cpl-chat uses the same):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-sonnet-4-6"; // unversioned alias — never a dated snapshot

const RELEVANCE_MIN = 0.4;
const MAX_NEW_CANDIDATES = 80; // bound Claude cost/time per run
const ANALYZE_BATCH = 12;
const FETCH_TIMEOUT_MS = 12000;
const UA =
  "Mozilla/5.0 (compatible; COBI-CPL-News/1.0; +https://cpl-initiative.github.io/cpl-project-tracker/)";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Source adapters ─────────────────────────────────────────────────────────
// CA-first, then national, then adjacent systems + CA budget. Google News RSS
// is the workhorse (free, no key); GDELT adds breadth; the rest are targeted.
const GOOGLE_NEWS_QUERIES: { q: string; scope: string }[] = [
  // --- California CPL (primary) ---
  { q: '"credit for prior learning" California community colleges', scope: "ca" },
  { q: '"prior learning assessment" California community college', scope: "ca" },
  { q: '"credit for prior learning" California apportionment OR funding', scope: "ca" },
  { q: 'California community colleges veterans "military credit" OR "JST"', scope: "ca" },
  { q: '"AB 123" California "prior learning" OR "credit"', scope: "ca" },
  // --- Adjacent CA systems ---
  { q: '"Career Passport" California', scope: "ca" },
  { q: 'California "Master Plan" higher education workforce', scope: "ca" },
  { q: 'California community college "earn and learn" OR upskilling workforce', scope: "ca" },
  // --- California budget items touching CPL/workforce ---
  { q: 'California budget community colleges "prior learning" OR workforce', scope: "ca" },
  // --- National CPL (secondary) ---
  { q: '"credit for prior learning" college (CAEL OR ACE OR workforce)', scope: "national" },
  { q: '"prior learning assessment" college credit workforce', scope: "national" },
];

const GDELT_QUERIES: { q: string; scope: string }[] = [
  { q: '"credit for prior learning" community college', scope: "national" },
  { q: '"prior learning assessment" college credit', scope: "national" },
];

const CALMATTERS_FEEDS = [
  "https://calmatters.org/category/education/feed/",
  "https://calmatters.org/education/higher-education/feed/",
];

const CCCCO_PRESS = "https://www.cccco.edu/About-Us/News-and-Media/Press-Releases";

const BLUESKY_QUERIES = [
  "credit for prior learning community college",
  "prior learning assessment college credit",
];

// ── Types ───────────────────────────────────────────────────────────────────
interface Candidate {
  url: string;
  title: string;
  snippet?: string;
  published_at?: string | null;
  source: string; // adapter name
  source_type: string; // news | official | social | budget | manual
  publisher?: string;
  image_url?: string | null;
  scope_hint?: string; // ca | national (Claude can override)
  request_id?: number; // for manual queue items
}

// ── Small utils ─────────────────────────────────────────────────────────────
function titleKey(t: string): string {
  return (t || "")
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 12)
    .join(" ");
}

function decodeEntities(s: string): string {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, ...(init?.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

// ── RSS (Google News, CalMatters) ────────────────────────────────────────────
function parseRss(
  xml: string,
  source: string,
  source_type: string,
  scope: string,
  cap: number,
): Candidate[] {
  const out: Candidate[] = [];
  const items = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of items) {
    const block = raw;
    const title = tag(block, "title");
    let link = tag(block, "link");
    if (!link) {
      const m = block.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = m[1];
    }
    if (!title || !link) continue;
    const pub = tag(block, "pubDate");
    let publisher = "";
    const srcm = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    if (srcm) publisher = decodeEntities(srcm[1]);
    out.push({
      url: link.trim(),
      title,
      snippet: tag(block, "description").slice(0, 600),
      published_at: pub ? new Date(pub).toISOString() : null,
      source,
      source_type,
      publisher,
      scope_hint: scope,
    });
    if (out.length >= cap) break;
  }
  return out;
}

async function harvestGoogleNews(): Promise<Candidate[]> {
  const all: Candidate[] = [];
  for (const { q, scope } of GOOGLE_NEWS_QUERIES) {
    try {
      const u =
        "https://news.google.com/rss/search?q=" +
        encodeURIComponent(q + " when:30d") +
        "&hl=en-US&gl=US&ceid=US:en";
      const r = await timedFetch(u);
      if (!r.ok) continue;
      const xml = await r.text();
      all.push(...parseRss(xml, "Google News", scope === "ca" ? "news" : "news", scope, 8));
    } catch (_e) { /* one query failing must not kill the run */ }
  }
  return all;
}

async function harvestCalMatters(): Promise<Candidate[]> {
  const all: Candidate[] = [];
  for (const u of CALMATTERS_FEEDS) {
    try {
      const r = await timedFetch(u);
      if (!r.ok) continue;
      const xml = await r.text();
      const items = parseRss(xml, "CalMatters", "news", "ca", 12);
      for (const it of items) it.publisher = "CalMatters";
      all.push(...items);
    } catch (_e) { /* skip */ }
  }
  return all;
}

async function harvestGdelt(): Promise<Candidate[]> {
  const all: Candidate[] = [];
  for (const { q, scope } of GDELT_QUERIES) {
    try {
      const u =
        "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
        encodeURIComponent(q) +
        "&mode=ArtList&maxrecords=20&format=json&timespan=45d&sort=DateDesc";
      const r = await timedFetch(u);
      if (!r.ok) continue;
      const j = await r.json().catch(() => null);
      if (!j || !Array.isArray(j.articles)) continue;
      for (const a of j.articles) {
        if (!a.url || !a.title) continue;
        let iso: string | null = null;
        if (a.seendate && /^\d{8}T\d{6}Z$/.test(a.seendate)) {
          const s = a.seendate;
          iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
        }
        all.push({
          url: a.url,
          title: decodeEntities(a.title),
          snippet: "",
          published_at: iso,
          source: "GDELT",
          source_type: "news",
          publisher: a.domain || "",
          image_url: a.socialimage || null,
          scope_hint: scope,
        });
      }
    } catch (_e) { /* skip */ }
  }
  return all;
}

async function harvestCccco(): Promise<Candidate[]> {
  try {
    const r = await timedFetch(CCCCO_PRESS);
    if (!r.ok) return [];
    const html = await r.text();
    const out: Candidate[] = [];
    const seen = new Set<string>();
    const re = /<a[^>]+href="([^"]*Press-Releases\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      let href = m[1];
      const title = decodeEntities(m[2]);
      if (!title || title.length < 12) continue;
      if (href.startsWith("/")) href = "https://www.cccco.edu" + href;
      if (seen.has(href)) continue;
      seen.add(href);
      out.push({
        url: href,
        title,
        snippet: "",
        published_at: null,
        source: "CCCCO",
        source_type: "official",
        publisher: "CA Community Colleges Chancellor's Office",
        scope_hint: "ca",
      });
      if (out.length >= 20) break;
    }
    return out;
  } catch (_e) {
    return [];
  }
}

async function harvestBluesky(): Promise<Candidate[]> {
  const all: Candidate[] = [];
  for (const q of BLUESKY_QUERIES) {
    try {
      const u =
        "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=" +
        encodeURIComponent(q) +
        "&limit=15&sort=latest";
      const r = await timedFetch(u);
      if (!r.ok) continue;
      const j = await r.json().catch(() => null);
      if (!j || !Array.isArray(j.posts)) continue;
      for (const p of j.posts) {
        const handle = p?.author?.handle;
        const rkey = (p?.uri || "").split("/").pop();
        if (!handle || !rkey) continue;
        const text = (p?.record?.text || "").trim();
        if (!text) continue;
        all.push({
          url: `https://bsky.app/profile/${handle}/post/${rkey}`,
          title: text.slice(0, 140),
          snippet: text.slice(0, 600),
          published_at: p?.record?.createdAt || p?.indexedAt || null,
          source: "Bluesky",
          source_type: "social",
          publisher: "@" + handle,
          scope_hint: "national",
        });
      }
    } catch (_e) { /* skip */ }
  }
  return all;
}

// Manual "suggest a story" queue → OpenGraph preview (covers closed socials).
async function harvestRequests(): Promise<Candidate[]> {
  try {
    const r = await timedFetch(
      `${SUPABASE_URL}/rest/v1/cpl_news_requests?status=eq.pending&select=id,url,note,source_hint&order=created_at.asc&limit=25`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!r.ok) return [];
    const rows = await r.json().catch(() => []);
    const out: Candidate[] = [];
    for (const row of rows) {
      const c: Candidate = {
        url: row.url,
        title: row.url,
        snippet: row.note || "",
        published_at: null,
        source: "manual",
        source_type: (row.source_hint || "manual").toLowerCase(),
        publisher: row.source_hint || "",
        request_id: row.id,
      };
      // Best-effort OpenGraph fetch (closed socials still expose og: tags for
      // link previews; a login wall just leaves us with the note + URL).
      try {
        const pr = await timedFetch(row.url);
        if (pr.ok) {
          const html = await pr.text();
          const og = (p: string) => {
            const m = html.match(
              new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']+)["']`, "i"),
            );
            return m ? decodeEntities(m[1]) : "";
          };
          const ogt = og("title");
          const ogd = og("description");
          const ogi = og("image");
          if (ogt) c.title = ogt;
          if (ogd) c.snippet = (c.snippet ? c.snippet + " — " : "") + ogd;
          if (ogi) c.image_url = ogi;
        }
      } catch (_e) { /* keep the URL + note */ }
      out.push(c);
    }
    return out;
  } catch (_e) {
    return [];
  }
}

// ── Dedup against existing rows ──────────────────────────────────────────────
async function existing(field: "url" | "title_key", values: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  const uniq = [...new Set(values.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 100) {
    const chunk = uniq.slice(i, i + 100);
    const inList = "(" + chunk.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",") + ")";
    try {
      const r = await timedFetch(
        `${SUPABASE_URL}/rest/v1/cpl_news?select=${field}&${field}=in.${encodeURIComponent(inList)}`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
      );
      if (r.ok) {
        const rows = await r.json();
        for (const row of rows) if (row[field]) found.add(String(row[field]));
      }
    } catch (_e) { /* skip */ }
  }
  return found;
}

// ── Claude analysis ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  `You triage news for a California Community Colleges "Credit for Prior Learning" (CPL) news feed shown on an internal Chancellor's Office dashboard.\n` +
  `CPL = awarding college credit for verified prior learning (work/military/industry-cert/training). ON TOPIC also includes closely related California education-and-workforce policy: Prior Learning Assessment, military/veterans credit (JST), the Career Passport, the California Master Plan for Education, dual enrollment ONLY when tied to credit-for-experience, upskilling/earn-and-learn workforce programs, AB 123 and similar CPL legislation, and California budget/apportionment items that fund or affect CPL or community-college workforce credit.\n` +
  `OFF TOPIC: generic college sports, admissions, unrelated K-12, generic tuition stories with no CPL/workforce-credit angle, marketing spam.\n` +
  `For EACH item return: cpl_related (bool), scope ("ca" if about California or a CA institution/policy, else "national", else "other"), related_system (one of: "CPL","Career Passport","CA Master Plan","Workforce/Upskilling","Budget","Military/Veterans","Other"), topics (1-4 short tags), relevance (0..1 how clearly on-topic), summary (ONE neutral sentence, max ~30 words, describing the item — do NOT copy article text verbatim).\n` +
  `Be strict: when unsure it's about credit-for-prior-learning or the adjacent CA systems above, set cpl_related=false and relevance below 0.4.\n` +
  `Return ONLY a JSON array, one object per input item, each including its "i" index. No prose, no code fence.`;

async function analyzeBatch(batch: Candidate[]): Promise<Map<number, any>> {
  const items = batch.map((c, i) => ({
    i,
    title: c.title,
    snippet: (c.snippet || "").slice(0, 400),
    source: c.source,
    publisher: c.publisher || "",
    scope_hint: c.scope_hint || "",
  }));
  const body = {
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: "Items:\n" + JSON.stringify(items) }],
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const out = new Map<number, any>();
  if (!r.ok) return out;
  const j = await r.json().catch(() => null);
  let text = j?.content?.[0]?.text || "";
  text = text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) return out;
  try {
    const arr = JSON.parse(text.slice(start, end + 1));
    for (const o of arr) if (typeof o.i === "number") out.set(o.i, o);
  } catch (_e) { /* batch unparseable → skip */ }
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  let dryRun = false;
  try {
    const b = await req.json();
    dryRun = !!b?.dry_run;
  } catch (_e) { /* no body */ }

  const report: Record<string, unknown> = { started_at: new Date().toISOString() };

  // 1) Harvest (each adapter isolated; failures degrade gracefully).
  const settled = await Promise.allSettled([
    harvestGoogleNews(),
    harvestCalMatters(),
    harvestGdelt(),
    harvestCccco(),
    harvestBluesky(),
    harvestRequests(),
  ]);
  let candidates: Candidate[] = [];
  const bySource: Record<string, number> = {};
  for (const s of settled) {
    if (s.status === "fulfilled") {
      for (const c of s.value) {
        candidates.push(c);
        bySource[c.source] = (bySource[c.source] || 0) + 1;
      }
    }
  }
  report.harvested = candidates.length;
  report.harvested_by_source = bySource;

  // 2) Dedup: within-batch (url + title_key), then against existing rows.
  const seenUrl = new Set<string>();
  const seenKey = new Set<string>();
  const deduped: Candidate[] = [];
  for (const c of candidates) {
    if (!c.url || !c.title) continue;
    const k = titleKey(c.title);
    if (seenUrl.has(c.url) || (k && seenKey.has(k))) continue;
    seenUrl.add(c.url);
    if (k) seenKey.add(k);
    deduped.push(c);
  }
  const exUrls = await existing("url", deduped.map((c) => c.url));
  const exKeys = await existing("title_key", deduped.map((c) => titleKey(c.title)));
  let fresh = deduped.filter(
    (c) => !exUrls.has(c.url) && !exKeys.has(titleKey(c.title)),
  );
  report.fresh = fresh.length;

  // Manual-request items always survive the cap; news is bounded.
  const manual = fresh.filter((c) => c.source === "manual");
  const rest = fresh.filter((c) => c.source !== "manual").slice(0, MAX_NEW_CANDIDATES);
  fresh = [...manual, ...rest];

  if (dryRun) {
    report.dry_run = true;
    report.would_analyze = fresh.length;
    report.sample = fresh.slice(0, 10).map((c) => ({ t: c.title, s: c.source, u: c.url }));
    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  // 3) Analyze in batches.
  const rows: any[] = [];
  const processedRequests: { id: number; status: string }[] = [];
  let analyzed = 0;
  for (let i = 0; i < fresh.length; i += ANALYZE_BATCH) {
    const batch = fresh.slice(i, i + ANALYZE_BATCH);
    let verdicts: Map<number, any>;
    try {
      verdicts = await analyzeBatch(batch);
    } catch (_e) {
      verdicts = new Map();
    }
    analyzed += batch.length;
    batch.forEach((c, j) => {
      const v = verdicts.get(j);
      const accepted = v && v.cpl_related && Number(v.relevance) >= RELEVANCE_MIN;
      if (c.request_id) {
        processedRequests.push({ id: c.request_id, status: accepted ? "done" : "rejected" });
      }
      if (!accepted) return;
      rows.push({
        url: c.url,
        title: c.title.slice(0, 500),
        title_key: titleKey(c.title),
        source: c.source,
        source_type: c.source === "manual" ? c.source_type : c.source_type,
        publisher: (c.publisher || "").slice(0, 200),
        published_at: c.published_at,
        summary: String(v.summary || "").slice(0, 600),
        scope: ["ca", "national", "other"].includes(v.scope) ? v.scope : (c.scope_hint || "other"),
        topics: Array.isArray(v.topics) ? v.topics.slice(0, 4) : [],
        related_system: v.related_system || "CPL",
        relevance: Math.max(0, Math.min(1, Number(v.relevance) || 0)),
        cpl_related: true,
        image_url: c.image_url || null,
        raw_snippet: (c.snippet || "").slice(0, 600),
        model: MODEL,
        analyzed_at: new Date().toISOString(),
      });
    });
  }
  report.analyzed = analyzed;
  report.accepted = rows.length;

  // 4) Insert (insert-once on url; duplicates ignored).
  let inserted = 0;
  if (rows.length) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cpl_news?on_conflict=url`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "content-type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify(rows),
    });
    if (r.ok) {
      const ins = await r.json().catch(() => []);
      inserted = Array.isArray(ins) ? ins.length : 0;
    } else {
      report.insert_error = await r.text().catch(() => "?");
    }
  }
  report.inserted = inserted;

  // 5) Mark manual requests processed.
  for (const pr of processedRequests) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/cpl_news_requests?id=eq.${pr.id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "content-type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: pr.status, processed_at: new Date().toISOString() }),
      });
    } catch (_e) { /* best effort */ }
  }
  report.requests_processed = processedRequests.length;
  report.finished_at = new Date().toISOString();

  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...CORS, "content-type": "application/json" },
  });
});
