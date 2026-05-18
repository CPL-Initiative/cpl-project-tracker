# Prompt template — Exhibit Canonicalization

Use this template when invoking the classification on a batch of raw titles
(50–200 per call). The SKILL.md content carries the decision rules; this file
carries the literal wrapper to send to the model.

---

You are classifying CPL exhibit titles from California Community Colleges'
MAP system. Apply the rules in
`.claude/skills/exhibit-canonicalization/SKILL.md` to each raw title.

For each input row, return one JSON object with this exact schema:

```json
{
  "raw_title": "<exact input string>",
  "unified_title": "<canonical credential name>",
  "issuing_agency": "<canonical agency name or null>",
  "training_agency": "<canonical agency name or null>",
  "confidence_title": 0.00,
  "confidence_issuer": 0.00,
  "confidence_trainer": 0.00,
  "_notes": "<one short sentence; required when any confidence < 0.85>"
}
```

Output all records as a single JSON array, in the same order as the input.
No prose before or after the array.

## Input batch

```json
[
  {
    "raw_title": "...",
    "cpl_types": ["..."],
    "articulating_colleges_sample": ["...", "..."]
  },
  ...
]
```

## Reminders

- Use `cpl_types` to recognize CPL-mechanism phrasing that should be stripped
  (e.g., if `"Credit By Exam"` is listed, "Credit by Exam" in the title is
  noise, not signal).
- Use `articulating_colleges_sample` to disambiguate generic buckets — if the
  raw title says "Credit By Exam at Saddleback" but the colleges are mixed,
  treat it as a generic administrative bucket per Rule 5.
- Never refuse a row. Low confidence + a `_notes` explanation is the right
  output for hard cases.
- Keep `unified_title` short and recognizable. No course codes, no CPL
  mechanism, no version qualifiers, no Cal-GETC suffixes.
