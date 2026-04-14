/**
 * Cloudflare Worker — Claude API Proxy + CPL Dashboard Scraper
 * =============================================================
 * Two endpoints:
 *
 * POST /           — Forwards requests to Anthropic Messages API (for Custom Reports)
 * GET  /scrape     — Fetches the CPL Dashboard, parses KPI metrics, returns JSON
 *
 * SETUP:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → your cpl-proxy worker
 *   2. Paste this code and deploy
 *   3. Environment variables needed:
 *      - ANTHROPIC_API_KEY (encrypted) — for the Claude API proxy
 *      - SCRAPE_SECRET (encrypted) — a shared secret to protect the scrape endpoint
 *   4. Worker URL: https://cpl-proxy.slee-548.workers.dev
 *
 * SCRAPE ENDPOINT:
 *   GET /scrape?secret=YOUR_SECRET
 *   Returns JSON with scraped_at timestamp and 5 KPI metrics with breakdowns.
 *   The scheduled task calls this instead of using Chrome automation.
 */

const ALLOWED_ORIGINS = [
  'https://cpl-initiative.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

const CPL_DASHBOARD_URL = 'https://cpldashboardcccco.azurewebsites.net/insights/dashboard';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    'Access-Control-Max-Age': '86400',
  };
}

// ── KPI Scraper ──────────────────────────────────────────────────
// The CPL Dashboard is server-rendered HTML. Each KPI card follows
// a consistent pattern we can parse with regex. This avoids any
// Chrome/browser dependency.

function parseKpiCards(html) {
  const metrics = [];

  // KPI card titles we're looking for, in order
  const kpiDefs = [
    { title: 'STUDENTS SERVED', hasAvg: false },
    { title: 'ELIGIBLE UNITS',  hasAvg: true  },
    { title: 'TRANSCRIBED UNITS', hasAvg: true },
    { title: 'SAVINGS',         hasAvg: false },
    { title: '20-YEAR IMPACT',  hasAvg: false },
  ];

  for (const kpi of kpiDefs) {
    const titleIdx = html.indexOf(kpi.title);
    if (titleIdx === -1) continue;

    // Extract a chunk of HTML after the title to parse values from
    const chunk = html.substring(titleIdx, titleIdx + 3000);

    // Main value — typically the first large number/currency after the title
    // Look for patterns like: >44,212<  or >199k<  or >$281M<  or >$1.13B<
    const valueMatch = chunk.match(/>(\$?[\d,]+(?:\.\d+)?[kKmMbB]?)<\/(?:span|div|h|p)/);
    const mainValue = valueMatch ? valueMatch[1] : '';

    // Average value (for units cards) — pattern like "4.5 avg"
    let avg = '';
    if (kpi.hasAvg) {
      const avgMatch = chunk.match(/([\d.]+)\s*avg/i);
      if (avgMatch) avg = avgMatch[1] + ' avg';
    }

    // Breakdown rows — Military, Workforce/Other, Apprentice
    // Pattern: "Military" ... value, "Workforce/Other" ... value, "Apprentice" ... value
    const breakdowns = [];
    const bdLabels = ['Military', 'Workforce/Other', 'Apprentice'];
    for (const label of bdLabels) {
      // Find the label, then grab the next value-like thing after it
      const labelIdx = chunk.indexOf(label);
      if (labelIdx === -1) continue;
      const afterLabel = chunk.substring(labelIdx + label.length, labelIdx + label.length + 200);
      const bdVal = afterLabel.match(/>(\$?[\d,]+(?:\.\d+)?[kKmMbB]?)<\//);
      breakdowns.push({
        label,
        value: bdVal ? bdVal[1] : '',
      });
    }

    metrics.push({
      title: kpi.title,
      value: mainValue,
      ...(avg ? { avg } : {}),
      breakdowns,
    });
  }

  return metrics;
}

async function handleScrape(url, secret, env) {
  // Verify the shared secret
  const expectedSecret = env.SCRAPE_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Invalid or missing secret' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const resp = await fetch(CPL_DASHBOARD_URL, {
      headers: {
        'User-Agent': 'CPL-Dashboard-Scraper/1.0',
        'Accept': 'text/html',
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({
        error: `Dashboard returned ${resp.status}`,
        status: resp.status,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await resp.text();
    const metrics = parseKpiCards(html);

    if (metrics.length === 0) {
      return new Response(JSON.stringify({
        error: 'No KPI metrics found — dashboard HTML structure may have changed',
        html_length: html.length,
        html_preview: html.substring(0, 500),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = {
      scraped_at: new Date().toISOString(),
      source_url: CPL_DASHBOARD_URL,
      metrics,
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

// ── Main handler ─────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // ── Scrape endpoint ──
    if (url.pathname === '/scrape' && request.method === 'GET') {
      const secret = url.searchParams.get('secret') || '';
      return handleScrape(url, secret, env);
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

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on proxy' }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.text();

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
