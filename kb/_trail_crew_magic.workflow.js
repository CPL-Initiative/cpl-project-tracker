// TRAIL CREW 🥾 — the MAGIC half (S110). A Claude-session Workflow script:
// one canon-guided adjudicator per findings batch (from kb/_trail_crew.py),
// then an adversarial skeptic on EVERY merge proposal (wrong merges lose real
// distinctions — refuted proposals fall back to the judgment queue).
//
// This file is the provenance copy. To fire: a Claude session invokes the
// Workflow tool with this script, args = {batches:[{path,rule,n}...], held:[...]}
// where each batch file holds {rule, findings:[...]} from the method scanner,
// and `held` lists titles whose merge confirmations the curator has parked.
// The output feeds kb/_trail_crew_assemble.py -> staged_fixes.json (fire-able,
// never auto-applied).
//
export const meta = {
  name: 'trail-crew-magic',
  description: 'Trail Crew — adjudicate CER canon findings (magic half): per-batch AI review + adversarial verify of merge proposals',
  phases: [
    { title: 'Adjudicate', detail: 'one reviewer per findings batch, canon-guided' },
    { title: 'Verify', detail: 'adversarial skeptics on every merge proposal' },
  ],
}

const SCRATCH = '/tmp/claude-0/-home-user/af5b1925-a080-5e72-a76c-4946094043af/scratchpad'

const CANON = `THE CER CANON (Sam's doctrine — the Common Exhibit Reference is a hand-built
canonical credential vocabulary that will later PROMPT users entering exhibits in the MAP
platform, so consistency IS the product):
 C1. Level indicators in canonical titles are NUMERIC (1, 2, 3, 4), never roman
     (I, II, III, IV) and never spelled out — EXCEPT alphanumeric compounds (1A, 2B)
     which stay as-is, and non-level romans that are part of the subject itself
     ("IV Therapy" = intravenous; "Type II"; "Class I" equipment designations) which
     keep their roman/official form.
 C2. The same credential differing ONLY in level notation is ONE credential
     ("Firefighter I" vs "Firefighter 1" -> merge, numeric form survives).
     Different level VALUES are DIFFERENT credentials (Firefighter 1 vs 2 — keep both).
 C3. A bare title coexisting with leveled siblings is suspect — a level may have been
     wrongly stripped. Usually the fix is judgment, not mechanical.
 C4. One canonical string per issuing agency: LONG FORM with the short form in parens,
     e.g. "American Welding Society (AWS)". Never two spellings of the same agency.
 C5. Canonical titles carry no course-code tokens, no doubled spaces, no stray trailing
     separators, and are not ALL-CAPS. BUT: numbers that are part of the credential's
     own name ("OSHA 30-Hour", "OSHA 10", "EPA 608") are NOT course codes — keep them.
Note: certification names with OFFICIAL roman styling (e.g. State Fire Training
"Fire Instructor II") still convert to numeric per C1 — Sam's canon wins over the
issuer's typography; note the official styling in your reason.`

const V_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['confirm', 'reject', 'modify'] },
          action: { type: 'string', enum: ['rename', 'merge', 'keep', 'fix', 'investigate'] },
          proposed: { type: ['string', 'null'] },
          reason: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['id', 'verdict', 'action', 'proposed', 'reason', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdicts'],
  additionalProperties: false,
}

const REFUTE_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['refuted', 'reason'],
  additionalProperties: false,
}

const RULE_GUIDE = {
  roman_level: `For each finding: the title carries roman-numeral token(s). CONFIRM with
action=rename and proposed=the numeric conversion (usually the scanner's suggestion) unless
the roman is NOT a level (C1 exceptions — "IV Therapy", "Type II", "Class III", a roman that
is part of an organization or exam name). In those cases verdict=reject with action=keep and
proposed=null. If the suggestion is right in spirit but wrong in detail, verdict=modify with
your corrected proposed title.`,
  level_notation_twins: `Findings arrive in GROUPS (same "group" value) of titles identical
after level normalization. Per C2 decide per finding: if two keys are the SAME credential in
different notations, the ROMAN-notation row gets verdict=confirm action=merge
proposed=<the surviving numeric-notation title>; the surviving numeric row gets
verdict=confirm action=keep proposed=null. If the grouped titles are actually DIFFERENT
credentials (different level values or genuinely different content), verdict=reject
action=keep. Consider issuers in the evidence.`,
  norm_dup_titles: `Groups of DISTINCT credential keys whose display titles normalize
identically. These often include already-pending renames — the context lists titles with
HELD merge confirmations Sam has deliberately parked; for any finding whose title is in that
held list, verdict=reject action=keep with reason "held by curator". Otherwise judge: same
credential -> action=merge into one key (say which survives in proposed); genuinely distinct
-> action=rename with a differentiating proposed title, or action=investigate.`,
  bare_vs_leveled: `A bare title coexists with leveled siblings. Judge per C3: is the bare
row a distinct umbrella/survey credential (keep) or a wrongly-stripped level (rename with the
level restored — only if the evidence makes the level obvious)? Default to
action=investigate with a crisp question for the curator when unsure.`,
  issuer_variant_cluster: `Each finding's evidence lists issuer-string variants of (probably)
one agency with row counts. Per C4 pick THE canonical string: long form + short form in
parens. verdict=confirm action=fix proposed=<the canonical issuer string>. If the variants
are actually DIFFERENT agencies (read carefully — e.g. a payroll association that renamed
itself), verdict=reject action=keep and explain.`,
  issuer_family_mixed: `A level family spans multiple issuers. Judge: same program family
that should share one issuer (action=fix, proposed=<the right issuer>) or genuinely
different credentials that happen to share a base title (action=keep)? Fire-service
families often legitimately involve CAL FIRE vs State Fire Training vs IFSAC — be careful,
prefer action=investigate with a specific question when the answer isn't clear.`,
  style_nits: `Mechanical C5 nits. For each: verdict=confirm action=fix with proposed=<the
cleaned title> for real nits (doubled spaces, trailing separators, ALL-CAPS conversions to
title case, genuine embedded course codes). verdict=reject action=keep for FALSE positives:
"OSHA 30"/"OSHA 10"/"EPA 608"-style tokens that are the credential's own name, em-dash
separators that are intentional formatting, and the "CARP 707/710/713" rows (known-ambiguous,
deliberately code-titled until the curator resolves them).`,
}

const manifest = (typeof args === 'string') ? JSON.parse(args) : args
const held = JSON.stringify(manifest.held)

const results = await pipeline(
  manifest.batches,
  (b, _, i) =>
    agent(
      'You are a Trail Crew adjudicator for the CPL project\u2019s Common Exhibit Reference ' +
        '(CER). Read the findings batch file at ' + b.path + ' (use the Read tool; it has ' +
        '{rule, findings:[{id, rule, key, title, issuer, evidence, suggestion, group, ' +
        'initiated}]}).\n\n' + CANON + '\n\nRULE GUIDANCE for this batch (' + b.rule + '):\n' +
        RULE_GUIDE[b.rule] + '\n\nContext — titles with merge confirmations the curator has ' +
        'DELIBERATELY parked (never propose acting on these): ' + held + '\n\n' +
        'Return one verdict per finding id (exactly the ids in the file, no extras). Reasons ' +
        'stay under 25 words. confidence in [0,1]. Be decisive on mechanical cases, ' +
        'conservative on judgment cases.',
      { label: 'adj:' + b.rule + ':' + i, phase: 'Adjudicate', schema: V_SCHEMA }
    ),
  (adj, b, i) => {
    if (!adj || !adj.verdicts) return { batch: b, adj: adj, verify: [] }
    const merges = adj.verdicts.filter(
      (v) => v.action === 'merge' && v.verdict !== 'reject'
    )
    if (!merges.length) return { batch: b, adj: adj, verify: [] }
    return parallel(
      merges.map((m) => () =>
        agent(
          'Adversarial check for a proposed CREDENTIAL MERGE in a California community-college ' +
            'credit-for-prior-learning credential registry. The claim: the credential entry with ' +
            'finding id ' + m.id + ' in the batch file ' + b.path + ' (Read it for full context) ' +
            'should merge into "' + (m.proposed || '') + '". Adjudicator\u2019s reason: ' +
            m.reason + '\n\nTry to REFUTE: are these actually DIFFERENT credentials (different ' +
            'level values, different issuers/content, an official distinction)? A merge collapses ' +
            'college-entered exhibit variants under one canonical credential \u2014 wrong merges ' +
            'lose real distinctions. Default refuted=true if uncertain.',
          { label: 'verify:' + m.id, phase: 'Verify', schema: REFUTE_SCHEMA }
        ).then((r) => ({ id: m.id, refuted: r ? r.refuted : true, reason: r ? r.reason : 'verifier died' }))
      )
    ).then((vs) => ({ batch: b, adj: adj, verify: vs.filter(Boolean) }))
  }
)

const out = results.filter(Boolean).map((r) => ({
  rule: r.batch.rule,
  path: r.batch.path,
  verdicts: (r.adj && r.adj.verdicts) || [],
  verify: r.verify || [],
}))
log('adjudicated ' + out.reduce((n, r) => n + r.verdicts.length, 0) + ' findings; ' +
    out.reduce((n, r) => n + r.verify.length, 0) + ' merge proposals adversarially checked')
return out