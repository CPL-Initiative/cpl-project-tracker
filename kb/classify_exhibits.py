"""
Phase 3 — full first-pass exhibit-title classification (cached, re-runnable).

Implements design-doc decision 1: send each distinct raw MAP exhibit title to
Claude with the exhibit-canonicalization skill rules as the system prompt, cache
the (unified_title, issuing_agency, training_agency, confidence) results into the
KB, and on future runs only classify titles not already cached. A periodic full
re-classification is a manual `--reclassify` run.

Usage
-----
  # No API key needed — dedupe, build chunks, estimate cost, write a sample request:
  python3 kb/classify_exhibits.py --dry-run

  # Classify a small sample first to validate quality against the curated anchor:
  ANTHROPIC_API_KEY=... python3 kb/classify_exhibits.py --limit 100

  # Full pass over every title not already in kb/unified_titles.json:
  ANTHROPIC_API_KEY=... python3 kb/classify_exhibits.py

Options
-------
  --dry-run            Build everything but make no API calls (no key required).
  --limit N            Only classify the first N unseen titles (validation runs).
  --chunk-size N       Titles per request (default 100; skill recommends 50-200).
  --model ID           Claude model (default claude-opus-4-7).
  --no-thinking        Disable adaptive thinking. Default is adaptive ("think
                       as needed" — Claude decides when/how much per title).
  --reclassify         Re-classify ALL titles, even cached ones, but NEVER
                       overwrite human-reviewed entries (reviewed_at != null).

Idempotency / safety
--------------------
- A title already in kb/unified_titles.json is skipped unless --reclassify.
- Human-reviewed entries (reviewed_at set) are never overwritten.
- The KB is checkpointed after every chunk, so a crash or rate-limit stop loses
  at most one chunk and a re-run resumes.

The system prompt (skill rules) is identical across every chunk and is marked
with cache_control, so all chunks after the first read it from cache (~0.1x).
"""
import argparse
import json
import os
import sys
import time
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SKILL_PATH = os.path.join(ROOT, ".claude", "skills", "exhibit-canonicalization", "SKILL.md")
SOURCE = os.path.join(ROOT, "CustomReport_latest.json")
UNIFIED = os.path.join(HERE, "unified_titles.json")
CREDS = os.path.join(HERE, "credentials.json")
TODAY = "2026-05-20"

SYSTEM_SUFFIX = """

---

# Batch task

You will receive a JSON array of exhibit rows, each with `raw_title`,
`cpl_types`, and `articulating_colleges_sample`. Apply the decision rules above
to EVERY row and return one classification record per input row, preserving
input order. Never skip a row; low confidence is the signal for review (Rule 9).
Output strictly via the provided schema."""

# Structured-output schema: a flat array of records matching the skill schema.
def _nullable_str():
    return {"anyOf": [{"type": "string"}, {"type": "null"}]}

OUTPUT_SCHEMA = {
    "type": "json_schema",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "required": ["classifications"],
        "properties": {
            "classifications": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "raw_title", "unified_title", "issuing_agency",
                        "training_agency", "confidence_title",
                        "confidence_issuer", "confidence_trainer", "_notes",
                    ],
                    "properties": {
                        "raw_title": {"type": "string"},
                        "unified_title": {"type": "string"},
                        "issuing_agency": _nullable_str(),
                        "training_agency": _nullable_str(),
                        "confidence_title": {"type": "number"},
                        "confidence_issuer": {"type": "number"},
                        "confidence_trainer": {"type": "number"},
                        "_notes": _nullable_str(),
                    },
                },
            }
        },
    },
}


def load_source_titles():
    """raw_title -> {cpl_types, colleges_sample, source_exhibit_ids}."""
    data = json.load(open(SOURCE))
    ex = data[0]
    ix = {c: i for i, c in enumerate(ex["columnName"])}
    cpl = defaultdict(set)
    colleges = defaultdict(set)
    eids = defaultdict(set)
    for r in ex["columnValue"]:
        t = r[ix["Exhibit Title"]]
        cpl[t].add(r[ix["CPL Type Description"]])
        colleges[t].add(r[ix["Articulation College"]])
        eids[t].add(r[ix["ExhibitID"]])
    out = {}
    for t in cpl:
        out[t] = {
            "cpl_types": sorted(cpl[t]),
            "articulating_colleges_sample": sorted(colleges[t])[:3],
            "source_exhibit_ids": sorted(eids[t]),
        }
    return out


def load_json(path, default):
    if os.path.exists(path):
        return json.load(open(path))
    return default


def save_json(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def build_system(model):
    skill = open(SKILL_PATH).read()
    return [{
        "type": "text",
        "text": skill + SYSTEM_SUFFIX,
        "cache_control": {"type": "ephemeral"},
    }]


def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def merge_results(records, source, unified, creds, classified_by):
    """Write classification records into the in-memory KB dicts. Never clobber
    human-reviewed entries."""
    added_titles = 0
    for rec in records:
        raw = rec["raw_title"]
        ut = rec["unified_title"]
        existing = unified.get(raw)
        if existing and existing.get("reviewed_at"):
            continue  # human-reviewed; leave alone
        unified[raw] = {
            "unified_title": ut,
            "confidence_title": rec["confidence_title"],
            "classified_at": TODAY,
            "classified_by": classified_by,
            "reviewed_at": existing.get("reviewed_at") if existing else None,
            "reviewed_by": existing.get("reviewed_by") if existing else None,
            "source_exhibit_ids": source.get(raw, {}).get("source_exhibit_ids", []),
            "_notes": rec.get("_notes"),
        }
        added_titles += 1
        # credentials.json — nested list keyed by unified_title, by issuing_agency
        issuer = rec.get("issuing_agency")
        recs = creds.setdefault(ut, [])
        match = next((r for r in recs if r.get("issuing_agency") == issuer), None)
        if match and match.get("reviewed_at"):
            continue
        cred_rec = {
            "issuing_agency": issuer,
            "training_agency": rec.get("training_agency"),
            "confidence_issuer": rec["confidence_issuer"],
            "confidence_trainer": rec["confidence_trainer"],
            "classified_at": TODAY,
            "classified_by": classified_by,
            "reviewed_at": None,
            "reviewed_by": None,
            "_notes": rec.get("_notes"),
        }
        if match:
            recs[recs.index(match)] = cred_rec
        else:
            recs.append(cred_rec)
    return added_titles


def sort_kb(unified, creds):
    return ({k: unified[k] for k in sorted(unified)},
            {k: creds[k] for k in sorted(creds)})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--chunk-size", type=int, default=100)
    ap.add_argument("--model", default="claude-opus-4-7")
    ap.add_argument("--no-thinking", action="store_true",
                    help="Disable adaptive thinking (default: adaptive, 'as needed').")
    ap.add_argument("--reclassify", action="store_true")
    args = ap.parse_args()

    source = load_source_titles()
    unified = load_json(UNIFIED, {})
    creds = load_json(CREDS, {})

    all_titles = sorted(source)
    if args.reclassify:
        todo = all_titles
    else:
        todo = [t for t in all_titles if t not in unified]
    if args.limit:
        todo = todo[:args.limit]

    classified_by = f"{args.model} (Phase 3 batch classify)"
    batches = list(chunks(todo, args.chunk_size))
    print(f"distinct titles: {len(all_titles)} | already cached: "
          f"{len(all_titles) - len([t for t in all_titles if t not in unified])} | "
          f"to classify this run: {len(todo)} | chunks: {len(batches)}")

    system = build_system(args.model)

    if args.dry_run:
        sample = [{"raw_title": t, **{k: source[t][k] for k in
                  ("cpl_types", "articulating_colleges_sample")}}
                  for t in (batches[0] if batches else [])]
        sys_chars = len(system[0]["text"])
        body_chars = len(json.dumps(sample, ensure_ascii=False))
        est_in = (sys_chars + body_chars) // 4
        est_out = len(sample) * 45
        save_json(os.path.join(HERE, "_classify_dryrun_sample.json"),
                  {"system_preview": system[0]["text"][:400] + "…",
                   "first_chunk_input": sample})
        print(f"DRY RUN — no API calls made.")
        print(f"  system prompt: ~{sys_chars // 4} tokens (cached after chunk 1)")
        print(f"  first chunk: {len(sample)} titles, ~{est_in} input + ~{est_out} output tokens")
        print(f"  wrote first-chunk request preview → kb/_classify_dryrun_sample.json")
        print(f"  to run for real: set ANTHROPIC_API_KEY and drop --dry-run")
        return

    if not todo:
        print("Nothing to classify. KB is up to date.")
        return

    try:
        import anthropic
        import httpx
    except ImportError:
        sys.exit("pip install anthropic  (or run with --dry-run)")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY not set (or run with --dry-run)")

    client = anthropic.Anthropic()
    thinking = {"type": "disabled"} if args.no_thinking else {"type": "adaptive"}

    total_added = 0
    for i, batch in enumerate(batches, 1):
        rows = [{"raw_title": t,
                 "cpl_types": source[t]["cpl_types"],
                 "articulating_colleges_sample": source[t]["articulating_colleges_sample"]}
                for t in batch]
        user = json.dumps(rows, ensure_ascii=False)
        # Retry on transient failures: network drops (httpx.HTTPError, e.g.
        # WinError 10054 on managed networks), connection errors, 429, and 5xx.
        # Auth / bad-request (4xx) are fatal — stop so we don't burn retries.
        msg = None
        for attempt in range(5):
            try:
                with client.messages.stream(
                    model=args.model,
                    max_tokens=32000,
                    thinking=thinking,
                    system=system,
                    output_config={"format": OUTPUT_SCHEMA},
                    messages=[{"role": "user", "content": user}],
                ) as stream:
                    msg = stream.get_final_message()
                break
            except anthropic.APIStatusError as e:
                if e.status_code < 500 and e.status_code != 429:
                    print(f"  chunk {i}/{len(batches)} FATAL ({e.status_code}); "
                          f"KB checkpointed, safe to fix & re-run. "
                          f"{getattr(e, 'message', e)}")
                    return
                err = e
            except (anthropic.APIConnectionError, httpx.HTTPError) as e:
                err = e
            wait = 2 ** (attempt + 1)
            print(f"    chunk {i} transient {type(err).__name__}; "
                  f"retry {attempt + 1}/4 in {wait}s…")
            time.sleep(wait)
        if msg is None:
            print(f"  chunk {i}/{len(batches)} failed after retries (network?); "
                  f"KB checkpointed — re-run to resume from here.")
            break

        text = next((b.text for b in msg.content if b.type == "text"), "")
        try:
            payload = json.loads(text)
            records = payload["classifications"]
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"  chunk {i}/{len(batches)} parse error: {e}; skipping chunk.")
            continue

        added = merge_results(records, source, unified, creds, classified_by)
        total_added += added
        unified, creds = sort_kb(unified, creds)
        save_json(UNIFIED, unified)
        save_json(CREDS, creds)
        cr = getattr(msg.usage, "cache_read_input_tokens", 0)
        print(f"  chunk {i}/{len(batches)}: +{added} titles "
              f"(in={msg.usage.input_tokens} cache_read={cr} out={msg.usage.output_tokens})")
        time.sleep(0.5)

    print(f"Done. Added {total_added} titles. "
          f"unified_titles.json now has {len(unified)} entries.")


if __name__ == "__main__":
    main()
