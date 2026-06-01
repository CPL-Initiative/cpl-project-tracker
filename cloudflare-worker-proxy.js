/**
 * Cloudflare Worker — Claude API Proxy + CPL Dashboard Scraper + Pipeline Trigger
 * ================================================================================
 * Three endpoints:
 *
 * POST /           — Forwards requests to Anthropic Messages API (for Custom Reports)
 * GET  /scrape     — Calls the CPL Dashboard API directly, returns formatted KPI JSON
 * POST /trigger    — Triggers the GitHub Actions daily-dashboard workflow via workflow_dispatch
 *
 * SETUP:
 *   1. Deploy to Cloudflare Workers
 *   2. Environment variables:
 *      - ANTHROPIC_API_KEY (encrypted) — for Claude API proxy
 *      - SCRAPE_SECRET (encrypted) — shared secret for the scrape endpoint
 *      - GITHUB_TOKEN (encrypted) — GitHub Personal Access Token with repo/actions scope
 *   3. Worker URL: https://cpl-proxy.slee-548.workers.dev
 *
 * SCRAPE ENDPOINT:
 *   GET /scrape?secret=YOUR_SECRET
 *   Calls the CPL Dashboard's /api/potential-savings endpoint (clean JSON),
 *   extracts the "ALL COLLEGES" aggregate row, and returns formatted metrics
 *   matching the live_metrics.json schema.
 */

const ALLOWED_ORIGINS = [
  'https://cpl-initiative.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

// The CPL Dashboard exposes a Next.js API route that returns college-level
// KPI data as JSON. The "ALL COLLEGES" row (Sorder=1) contains the system-wide
// aggregates used by our dashboard's KPI cards.
const CPL_API_URL = 'https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0';

// SEC-2: exact-match the allowlist. The old `startsWith` let
// `https://cpl-initiative.github.io.evil.com` and `http://localhost.evil.com`
// through. The production origin is matched exactly; localhost/127.0.0.1 dev is
// matched by hostname so any dev port works but `localhost.evil.com` cannot.
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;   // exact match (prod + bare localhost)
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch (e) {
    return false;
  }
}

function corsHeaders(origin) {
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://cpl-initiative.github.io',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    'Access-Control-Max-Age': '86400',
  };
}

// ── Number formatting helpers ────────────────────────────────────
// Match the display format used by the CPL Dashboard UI

function fmtInt(n) {
  // 44212 → "44,212"
  return Math.round(n).toLocaleString('en-US');
}

function fmtUnits(n) {
  // 198904.55 → "199k"   |   97209.95 → "97k"   |   6377.6 → "6k"
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return Math.round(n).toLocaleString('en-US');
}

function fmtDollars(n) {
  // 281220634.75 → "$281M"   |   1132689225.6 → "$1.13B"
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
  return '$' + Math.round(n);
}

// ── Scrape handler ───────────────────────────────────────────────

async function handleScrape(url, env) {
  // Verify shared secret
  const secret = url.searchParams.get('secret') || '';
  const expectedSecret = env.SCRAPE_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Invalid or missing secret' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const resp = await fetch(CPL_API_URL, {
      headers: {
        'User-Agent': 'CPL-Dashboard-Scraper/2.0',
        'Accept': 'application/json',
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({
        error: `CPL API returned ${resp.status}`,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();

    // Find the "ALL COLLEGES" aggregate row (Sorder === 1)
    const all = data.find(row => row.Sorder === 1 && row.College === 'ALL COLLEGES');
    if (!all) {
      return new Response(JSON.stringify({
        error: 'ALL COLLEGES row not found in API response',
        row_count: data.length,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build metrics in the same format as live_metrics.json
    const metrics = [
      {
        title: 'STUDENTS SERVED',
        value: fmtInt(all.Students),
        breakdowns: [
          { label: 'Military', value: fmtInt(all.MilitaryStudents) },
          { label: 'Workforce/Other', value: fmtInt(all.NonMilitaryStudents) },
          { label: 'Apprentice', value: fmtInt(all.AprenticeStudents) },
        ],
      },
      {
        title: 'ELIGIBLE UNITS',
        value: fmtUnits(all.Units),
        avg: all.AverageUnits.toFixed(1) + ' avg',
        breakdowns: [
          { label: 'Military', value: fmtUnits(all.MilitaryCredits) },
          { label: 'Workforce/Other', value: fmtUnits(all.NonMilitaryCredits) },
          { label: 'Apprentice', value: fmtUnits(all.ApprenticeshipCredits) },
        ],
      },
      {
        title: 'TRANSCRIBED UNITS',
        value: fmtUnits(all.TranscribedUnits),
        avg: all.TranscribedAverage.toFixed(1) + ' avg',
        breakdowns: [
          { label: 'Military', value: fmtUnits(all.TranscribedMilitaryUnits) },
          { label: 'Workforce/Other', value: fmtUnits(all.TranscribedNonMilitaryUnits) },
          { label: 'Apprentice', value: fmtUnits(all.TranscribedApprenticeshipUnits) },
        ],
      },
      {
        title: 'SAVINGS',
        value: fmtDollars(all.Savings),
        breakdowns: [
          { label: 'Military', value: fmtDollars(all.Savings * (all.MilitaryCredits / (all.Units || 1))) },
          { label: 'Workforce/Other', value: fmtDollars(all.Savings * (all.NonMilitaryCredits / (all.Units || 1))) },
          { label: 'Apprentice', value: fmtDollars(all.Savings * (all.ApprenticeshipCredits / (all.Units || 1))) },
        ],
      },
      {
        title: '20-YEAR IMPACT',
        value: fmtDollars(all.YearImpact),
        breakdowns: [
          { label: 'Military', value: fmtDollars(all.YearImpact * (all.MilitaryCredits / (all.Units || 1))) },
          { label: 'Workforce/Other', value: fmtDollars(all.YearImpact * (all.NonMilitaryCredits / (all.Units || 1))) },
          { label: 'Apprentice', value: fmtDollars(all.YearImpact * (all.ApprenticeshipCredits / (all.Units || 1))) },
        ],
      },
    ];

    // ── Active Colleges KPI & 3-tier categorization ─────────────
    // Individual colleges have Sorder === 2
    const colleges = data.filter(r => r.Sorder === 2);

    // Tier system: "Leading" if college meets at least 3 of 5 criteria,
    // "Inactive" if Students < 10 AND Units === 0, otherwise "Advancing".
    //
    // The 5 criteria balance volume AND effectiveness so small colleges
    // with strong implementation can reach Leading:
    //   1. Student Volume:              Students >= 500
    //   2. Articulation Depth:          Eligible Units >= 3,000
    //   3. Avg Eligible Units/Student:  AverageUnits >= 5
    //   4. Transcription Rate:          TranscribedUnits/Units >= 25%
    //   5. Avg Transcribed Units/Stud:  TranscribedAverage >= 3
    //
    // Inactive: Students < 10 AND Units === 0

    function classifyCollege(c) {
      if (c.Students < 10 && c.Units === 0) return 'inactive';

      let score = 0;
      if (c.Students >= 500) score++;
      if (c.Units >= 3000) score++;
      if (c.AverageUnits >= 5) score++;
      if (c.Units > 0 && (c.TranscribedUnits / c.Units) >= 0.25) score++;
      if (c.TranscribedAverage >= 3) score++;

      return score >= 3 ? 'leading' : 'advancing';
    }

    const tiers = { leading: [], advancing: [], inactive: [] };
    const tierDetails = { leading: [], advancing: [], inactive: [] };

    for (const c of colleges) {
      const tier = classifyCollege(c);
      tiers[tier].push(c.College);

      // Include per-college detail for all tiers (including inactive)
      const transRate = c.Units > 0 ? (c.TranscribedUnits / c.Units * 100) : 0;
      tierDetails[tier].push({
        college: c.College,
        students: c.Students,
        units: c.Units,
        avgUnits: c.AverageUnits,
        transcriptionRate: Math.round(transRate * 10) / 10,
        avgTranscribed: c.TranscribedAverage,
        criteriaMetCount: (c.Students >= 500 ? 1 : 0)
          + (c.Units >= 3000 ? 1 : 0)
          + (c.AverageUnits >= 5 ? 1 : 0)
          + (c.Units > 0 && (c.TranscribedUnits / c.Units) >= 0.25 ? 1 : 0)
          + (c.TranscribedAverage >= 3 ? 1 : 0),
        // Sub-population student counts
        militaryStudents: c.MilitaryStudents || 0,
        nonMilitaryStudents: c.NonMilitaryStudents || 0,
        apprenticeStudents: c.AprenticeStudents || 0,  // note: API typo preserved
        // Financial metrics
        savings: c.Savings || 0,
        yearImpact: c.YearImpact || 0,
        // Transcribed units (absolute)
        transcribedUnits: c.TranscribedUnits || 0,
      });
    }

    // Sort tier details by criteria met (desc), then by students (desc)
    for (const key of ['leading', 'advancing', 'inactive']) {
      tierDetails[key].sort((a, b) => b.criteriaMetCount - a.criteriaMetCount || b.students - a.students);
    }

    const activeCount = tiers.leading.length + tiers.advancing.length;

    // Add Active Colleges as the 6th KPI metric
    metrics.push({
      title: 'ACTIVE COLLEGES',
      value: fmtInt(activeCount),
      breakdowns: [
        { label: 'Leading Colleges', value: fmtInt(tiers.leading.length), note: 'meeting at least 3 of 5 criteria' },
        { label: 'Advancing Colleges', value: fmtInt(tiers.advancing.length), note: 'active, building capacity' },
        { label: 'Inactive Colleges', value: fmtInt(tiers.inactive.length), note: '<10 students and 0 units' },
      ],
      footnote: [
        '1. Student Volume ≥ 500',
        '2. Eligible Units ≥ 3,000',
        '3. Avg Eligible Units/Student ≥ 5',
        '4. Transcription Rate ≥ 25%',
        '5. Avg Transcribed Units/Student ≥ 3',
      ],
    });

    // Also include the raw ALL COLLEGES data for reference
    const result = {
      scraped_at: new Date().toISOString(),
      source_url: 'https://cpldashboardcccco.azurewebsites.net/insights/dashboard',
      api_url: CPL_API_URL,
      college_count: colleges.length,
      active_college_count: activeCount,
      star_college_count: all.StarCollegeCount,
      tiers: {
        criteria: [
          'Students >= 500',
          'Eligible Units >= 3,000',
          'Avg Eligible Units/Student >= 5',
          'Transcription Rate >= 25%',
          'Avg Transcribed Units/Student >= 3',
        ],
        leading: { count: tiers.leading.length, colleges: tierDetails.leading },
        advancing: { count: tiers.advancing.length, colleges: tierDetails.advancing },
        inactive: { count: tiers.inactive.length, colleges: tierDetails.inactive },
      },
      metrics,
      raw: {
        Students: all.Students,
        Units: all.Units,
        TranscribedUnits: all.TranscribedUnits,
        Savings: all.Savings,
        YearImpact: all.YearImpact,
        MilitaryStudents: all.MilitaryStudents,
        NonMilitaryStudents: all.NonMilitaryStudents,
        AprenticeStudents: all.AprenticeStudents,
        AverageUnits: all.AverageUnits,
        TranscribedAverage: all.TranscribedAverage,
      },
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Scrape failed: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Trigger handler ──────────────────────────────────────────────
// Dispatches the GitHub Actions workflow so the dashboard button
// can kick off a full pipeline run with one click.

async function handleTrigger(request, env, origin) {
  // SEC-3: the shared secret is shipped to every public visitor in the dashboard
  // refresh button, so it gates nothing on its own. Add an origin check
  // (defense-in-depth) + keep the secret; the REAL backstop is a Cloudflare
  // rate-limit rule on /trigger. (The pipeline job is idempotent, so a spurious
  // trigger is low-impact, but rate-limit it anyway.)
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
      status: 403,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
  // Verify shared secret (same SCRAPE_SECRET)
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const secret = body.secret || '';
  if (env.SCRAPE_SECRET && secret !== env.SCRAPE_SECRET) {
    return new Response(JSON.stringify({ error: 'Invalid or missing secret' }), {
      status: 403,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const pat = env.GITHUB_TOKEN;
  if (!pat) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not configured on proxy' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  try {
    const resp = await fetch(
      'https://api.github.com/repos/cpl-initiative/cpl-project-tracker/actions/workflows/daily-dashboard.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'CPL-Dashboard-Trigger/1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (resp.status === 204) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Pipeline triggered successfully. Dashboard will update in 3-5 minutes.',
      }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    } else {
      const errText = await resp.text();
      return new Response(JSON.stringify({
        error: `GitHub API returned ${resp.status}`,
        details: errText,
      }), {
        status: resp.status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: `Trigger failed: ${err.message}` }), {
      status: 502,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
}

// ── Main handler ─────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // ── Scrape endpoint ──
    if (url.pathname === '/scrape' && request.method === 'GET') {
      return handleScrape(url, env);
    }

    // ── Trigger endpoint ──
    if (url.pathname === '/trigger' && request.method === 'POST') {
      return handleTrigger(request, env, origin);
    }

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Claude API proxy (POST only) ──
    if (request.method !== 'POST') {
      return new Response('Method not allowed. Use POST for Claude API or GET /scrape for metrics.', {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    // SEC-1: don't be an open relay to Anthropic on our key. Gate by the origin
    // allowlist (blocks browser-based abuse from other sites). NOTE: a non-browser
    // client can forge the Origin header, so a Cloudflare rate-limit rule on this
    // route is the REAL backstop — configure it in the Cloudflare dashboard
    // (Security -> WAF -> Rate limiting) for `/`, `/scrape`, and `/trigger`.
    if (!isAllowedOrigin(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
        status: 403,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on proxy' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.text();

      // SEC-1: reject oversized payloads (legit report prompts are a few KB).
      if (body.length > 262144) {
        return new Response(JSON.stringify({ error: 'Request body too large' }), {
          status: 413,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  },
};
