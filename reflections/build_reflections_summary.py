#!/usr/bin/env python3
"""Privacy-safe PUBLIC summary of First Light reflections, for the dashboard.

Companion to build_reflections_digest.py. The *digest* renders verbatim
reflections and is for the PRIVATE vault only (samueltlee/CPLBrain). THIS script
renders an AGGREGATE-ONLY summary that is safe to publish on the public
dashboard: it never emits a verbatim reflection, an id, an IP, or a precise time.

Why the output is safe to publish UNATTENDED (no human curation needed):
  * Aggregate only — counts, per-painting tallies, a coarse positivity tally,
    and (optionally) single-word themes. No sentences or phrases, ever.
  * Minimum-sample gate — themes/positivity are emitted ONLY once there are at
    least MIN_PUBLIC_N reflections, so small samples can't be reverse-engineered.
    Below the gate (e.g. today, with a handful of rows) only bare counts ship.
  * k-anonymity on themes — a word appears ONLY if it shows up in at least
    MIN_TERM_SUPPORT *distinct* reflections, so unique/identifying tokens
    (a name, an email, a one-off specific) never surface.
  * PII scrub before counting — emails, URLs, @handles, and any token containing
    a digit are dropped; everything is lowercased and reduced to plain letters.
  * Painting names are already public (they're the public-domain art shown on the
    dashboard), so per-painting counts leak nothing about who wrote what.

Set PUBLISH_THEMES = False for a bulletproof "numbers only" mode (counts +
painting tallies, zero text-derived output, ever).

Stdlib only (urllib) so it runs in CI with no `pip install`. Fails soft:
no key / HTTP error / blocked network / empty table -> prints a notice, writes
nothing new, exits 0. So the workflow never goes red over a transient hiccup.

  SUPABASE_SERVICE_KEY=...  python3 reflections/build_reflections_summary.py \
      --out reflections/summary.json
"""
import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
TABLE = "cpl_reflections"

# --- safety knobs (tune these; they are the whole safety model) -------------
PUBLISH_THEMES   = True   # False -> numbers only, never any text-derived output
MIN_PUBLIC_N     = 10     # below this many reflections, publish counts only
MIN_TERM_SUPPORT = 3      # a theme word must appear in >= this many DISTINCT reflections
MAX_THEMES       = 15     # cap the theme list
MAX_PAINTINGS    = 8      # cap the per-painting list
# ---------------------------------------------------------------------------

POSITIVE = {
    "hope", "hopeful", "grateful", "thankful", "joy", "joyful", "love", "loved",
    "beautiful", "peace", "peaceful", "calm", "inspired", "inspiring", "light",
    "bright", "kind", "kindness", "proud", "excited", "wonderful", "happy",
    "encouraged", "optimistic", "brave", "strong", "resilient", "gentle", "warm",
}
DIFFICULT = {
    "sad", "tired", "exhausted", "anxious", "worried", "afraid", "fear", "stress",
    "stressed", "hard", "difficult", "struggle", "struggling", "alone", "lonely",
    "frustrated", "overwhelmed", "hopeless", "dark", "loss", "grief",
}
STOPWORDS = set((
    "a an the and or but if then else of to in on at by for with from as is are "
    "was were be been being it its this that these those i me my we our us you "
    "your he she they them his her their not no yes do does did so just very "
    "really more most about into over under out up down off than too can will "
    "would should could may might have has had get got make made one all any "
    "some what when where who how why which today day painting reflection first "
    "light"
).split())

TOKEN_RE = re.compile(r"[a-z]+")
EMAIL_RE = re.compile(r"\S+@\S+")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
HANDLE_RE = re.compile(r"[@#]\w+")


def service_key():
    for k in ("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
        v = os.environ.get(k)
        if v and v.strip():
            return v.strip()
    return None


def fetch_reflections(key):
    """Read anonymous reflections via REST (service role bypasses write-only RLS).
    Only the three non-identifying columns are selected; nothing is logged."""
    url = (SUPABASE_URL.rstrip("/") + "/rest/v1/" + TABLE +
           "?select=day,painting,reflection&order=day.asc")
    req = urllib.request.Request(url, headers={
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def scrub_tokens(text):
    t = (text or "").lower()
    t = EMAIL_RE.sub(" ", t)
    t = URL_RE.sub(" ", t)
    t = HANDLE_RE.sub(" ", t)
    return [w for w in TOKEN_RE.findall(t) if len(w) >= 3 and w not in STOPWORDS]


def themes(rows):
    """Words appearing across >= MIN_TERM_SUPPORT *distinct* reflections."""
    doc_freq = Counter()
    for r in rows:
        for w in set(scrub_tokens(r.get("reflection"))):
            doc_freq[w] += 1
    kept = [(w, n) for w, n in doc_freq.items() if n >= MIN_TERM_SUPPORT]
    kept.sort(key=lambda x: (-x[1], x[0]))
    return [{"term": w, "reflections": n} for w, n in kept[:MAX_THEMES]]


def positivity(rows):
    pos = sum(1 for r in rows if set(scrub_tokens(r.get("reflection"))) & POSITIVE)
    dif = sum(1 for r in rows if set(scrub_tokens(r.get("reflection"))) & DIFFICULT)
    return {"reflections_with_uplifting_words": pos,
            "reflections_with_difficult_words": dif}


def top_paintings(rows):
    c = Counter((r.get("painting") or "").strip() or "today’s painting" for r in rows)
    return [{"painting": p, "count": n} for p, n in c.most_common(MAX_PAINTINGS)]


def main():
    ap = argparse.ArgumentParser(description="Build the public-safe reflections summary.")
    ap.add_argument("--out", default="reflections/summary.json",
                    help="output JSON path (default reflections/summary.json)")
    args = ap.parse_args()

    key = service_key()
    if not key:
        print("No SUPABASE_SERVICE_KEY set — skipping summary (graceful no-op).")
        return 0
    try:
        rows = fetch_reflections(key)
    except urllib.error.HTTPError as e:
        print("Supabase returned HTTP %s — skipping summary." % e.code, file=sys.stderr)
        return 0
    except Exception as e:  # network blocked / transient — never hard-fail a workflow
        print("Could not fetch reflections (%s) — skipping summary." % e, file=sys.stderr)
        return 0

    rows = [r for r in rows if (r.get("reflection") or "").strip()]
    n = len(rows)
    days = sorted({(r.get("day") or "").strip() for r in rows if (r.get("day") or "").strip()})
    can_theme = PUBLISH_THEMES and n >= MIN_PUBLIC_N

    summary = {
        "generated": datetime.date.today().isoformat(),  # calendar day only
        "total_reflections": n,
        "active_days": len(days),
        "first_day": days[0] if days else None,
        "latest_day": days[-1] if days else None,
        "top_paintings": top_paintings(rows),
        "min_sample_for_themes": MIN_PUBLIC_N,
        "themes_suppressed": not can_theme,
        "themes": themes(rows) if can_theme else [],
        "positivity": positivity(rows) if can_theme else None,
        "note": ("Aggregate, anonymous summary of First Light reflections. "
                 "No individual reflection text is ever published."),
    }

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print("Wrote %s — %d reflection(s), %d theme(s)%s."
          % (args.out, n, len(summary["themes"]),
             " [themes suppressed: below min sample]" if summary["themes_suppressed"] else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
