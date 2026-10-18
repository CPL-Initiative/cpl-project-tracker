// cer-classify — the Common Exhibit Reference's classifier call.
//
// Sam, 2026-10-18 ~02:55Z: "I want to be able to add more procedures to have
// you classify and complete common exhibit titles and elements as we go."
// Lane: docs/reference/lanes/cer-procedures.md.
//
// The nightly procedures run (kb/_cer_procedures.py) settles what the rule
// procedures in kb/cer_procedures.json settle, and posts every other waiting
// MAP exhibit title here in small batches with the standing rules: the
// exhibit-canonicalization skill, every procedure in force and the house
// families. This function asks Claude for one classification record per
// title (unified title, issuing agency, training agency, confidences, the
// procedures it rests on) and returns them with the call's token usage.
//
// Sam's call 6 on sheet 23 (2026-10-03): model calls go through a Supabase Edge
// Function that holds the Anthropic key, so no model key goes into GitHub.
//
// It READS NO TABLE AND WRITES NOTHING. The run turns the records into
// pre-fills in kb/unclassified_preseed.json; a curator saves them in the tab.
// The rules travel with each request so they have one home, the repository;
// the output is held to the classification schema below.
//
// Auth: the caller presents the project service key as its bearer; the
// cpl-news-harvest capability probe (can it read RLS-protected
// allowed_reviewers?) decides, so the public anon key never spends the model
// budget.
//
// Source of record is the LIVE function; this file is the in-repo capture.
// Version 1 (S412, 2026-10-18), deployed with verify_jwt off as
// program-requirements-extract is.
//
// Secrets used (already set project-wide): ANTHROPIC_API_KEY, SUPABASE_URL.

import Anthropic from "npm:@anthropic-ai/sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hvuwhnbuahrtptokpqfh.supabase.co";
const MODEL = "claude-opus-5-5";
const EFFORT = "medium";        // short titles against long rules; the run asks again when unsure
const MAX_RULES = 250000;       // characters of standing rules accepted per call
const MAX_ROWS = 30;            // titles per call

const JSON_HEADERS = { "content-type": "application/json" };

const NUM = { type: "number" };
const STR_OR_NULL = { anyOf: [{ type: "string" }, { type: "null" }] };

const RECORD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["classifications"],
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "raw_title", "unified_title", "issuing_agency", "training_agency",
          "confidence_title", "confidence_issuer", "confidence_trainer", "procedures", "_notes",
        ],
        properties: {
          raw_title: { type: "string" },
          unified_title: { type: "string" },
          issuing_agency: STR_OR_NULL,
          training_agency: STR_OR_NULL,
          confidence_title: NUM,
          confidence_issuer: NUM,
          confidence_trainer: NUM,
          procedures: { type: "array", items: { type: "string" } },
          _notes: STR_OR_NULL,
        },
      },
    },
  },
};

const TASK = `# Batch task

You will receive a JSON array of MAP exhibit rows, each with raw_title, cpl_types, articulating_colleges_sample and hints. A hint is a proposal an earlier procedure made for the row; held_for says why the run did not trust it. Use a hint when it is right, mend it when it is close, and set it aside when it is wrong.

Apply the decision rules and the procedures in force to EVERY row and return one classification record per input row, in input order, with raw_title copied exactly. Never skip a row; low confidence is the signal for review (Rule 9). Write _notes whenever any confidence is below 0.85. In procedures, name the ids of the procedures, or the skill rules (as "Rule 5c"), that your answer rests on.`;

// ── Caller check (the cpl-news-harvest pattern) ─────────────────────────────
async function isServiceCred(bearer: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/allowed_reviewers?select=email&limit=1`, {
      headers: { apikey: bearer, Authorization: `Bearer ${bearer}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return false;
    const rows = await r.json().catch(() => []);
    return Array.isArray(rows) && rows.length >= 1;
  } catch (_e) {
    return false;
  }
}

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer || !(await isServiceCred(bearer))) return reply(401, { error: "unauthorized" });
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return reply(500, { error: "ANTHROPIC_API_KEY not set" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (_e) {
    return reply(400, { error: "body must be JSON" });
  }
  const rules = typeof body.rules === "string" ? body.rules : "";
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rules.trim() || !rows.length) return reply(400, { error: "rules and rows are both required" });
  if (rules.length > MAX_RULES) {
    return reply(413, { error: `rules are ${rules.length} characters; the limit is ${MAX_RULES}` });
  }
  if (rows.length > MAX_ROWS) return reply(413, { error: `${rows.length} rows; the limit is ${MAX_ROWS}` });

  const client = new Anthropic();
  const t0 = Date.now();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT, format: { type: "json_schema", schema: RECORD_SCHEMA } },
      system: [
        { type: "text", text: TASK },
        { type: "text", text: rules, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: JSON.stringify(rows) }],
    } as any);
    const out = {
      model: response.model,
      stop_reason: response.stop_reason,
      usage: response.usage,
      ms: Date.now() - t0,
      records: null as unknown,
      error: null as string | null,
    };
    if (response.stop_reason === "refusal") {
      out.error = `refused (${response.stop_details?.category ?? "no category"})`;
      return reply(200, out);
    }
    if (response.stop_reason === "max_tokens") {
      out.error = "the records ran past max_tokens";
      return reply(200, out);
    }
    const textBlock = response.content.find((b: { type: string }) => b.type === "text") as
      | { text: string }
      | undefined;
    try {
      out.records = textBlock ? JSON.parse(textBlock.text).classifications : null;
      if (!out.records) out.error = "no text block in the response";
    } catch (_e) {
      out.error = "the response was not JSON";
    }
    return reply(200, out);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return reply(429, { error: "rate limited" });
    if (err instanceof Anthropic.APIError) {
      return reply(502, { error: `Anthropic API ${err.status}: ${err.message}`.slice(0, 500) });
    }
    return reply(500, { error: String(err).slice(0, 500) });
  }
});
