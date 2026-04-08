/**
 * Cloudflare Worker — Claude API Proxy
 * =====================================
 * Forwards POST requests from your GitHub Pages dashboard to the
 * Anthropic Messages API, adding the required headers and handling CORS.
 *
 * SETUP:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this code and deploy
 *   3. Add an environment variable  ANTHROPIC_API_KEY  with your key
 *      (Settings → Variables → Add Variable → Encrypt)
 *   4. Copy the worker URL (e.g. https://cpl-proxy.<you>.workers.dev)
 *   5. In the dashboard Excel, set cell I2 (or wherever you configure the
 *      proxy URL) OR set  window.CPL_REPORT_PROXY_URL  in your HTML
 *      to that worker URL.
 *
 * The worker only accepts POST from allowed origins and forwards to
 * https://api.anthropic.com/v1/messages.
 */

const ALLOWED_ORIGINS = [
  'https://cpl-initiative.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
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
