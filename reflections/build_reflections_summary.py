#!/usr/bin/env python3
"""Aggregate-only weekly summary of First Light reflections — SAFE to commit here.

Companion to build_reflections_digest.py. The DIGEST renders the full anonymous
reflection TEXT for the private vault (samueltlee/CPLBrain) and is gitignored in
this repo. This SUMMARY emits ONLY aggregates — counts, painting tallies, and
(above a volume floor) single-word themes — so it can live in this PUBLIC repo as
reflections/summary.json and feed a future dashboard widget (phase 2).

PRIVACY — read before changing (this file's OUTPUT is committed to a public repo):
  * NEVER emit reflection text. The output is counts + painting tallies +, only
    once there are enough reflections to anonymize within, a short list of single
    WORDS that recur across many reflections.
  * Themes are SUPPRESSED entirely below MIN_REFLECTIONS (10). Above it, a word
    surfaces only with >= MIN_THEME_SUPPORT (3) distinct-reflection support
    (document frequency — counted once per reflection), so no single musing can
    put a word on the board and a one-off identifier can never appear.
  * Reflection text is PII-scrubbed before tokenizing (emails, URLs, phone
    numbers, and digit runs removed); only lowercase alphabetic tokens >= 3 chars
    that are not stopwords are even considered.
  * Paintings come from First Light's curated public-domain manifest, not user
    input — tallying their titles is safe.
  * Output is deterministic (no wall-clock field, everything sorted), so the
    weekly workflow is a clean no-op commit when nothing changed.

Fail-soft like the digest: no service key, an HTTP error, or a blocked network
prints a notice and exits 0 (and never clobbers an existing summary.json), so the
weekly workflow stays green over a transient hiccup.

Stdlib only (urllib) so it runs in CI with no `pip install`.

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
MAX_REFLECTION = 2000  # mirrors first_light.js / the table CHECK

# Theme gates — deliberately conservative for a PUBLIC artifact.
MIN_REFLECTIONS = 10     # no themes at all below this many total reflections
MIN_THEME_SUPPORT = 3    # a word needs this many DISTINCT reflections to surface
MAX_THEMES = 25          # cap the emitted theme list

# Generic + stop words that would never be a meaningful "theme." Lowercase.
STOPWORDS = frozenset("""
a about above after again against all also am an and any are aren as at be
because been before being below between both but by can cannot could couldn day
did didn do does doesn doing don down during each few first for from further get
got had hadn has hasn have haven having he her here hers herself him himself his
how i if in into is isn it its itself just let lot many me more most much must
mustn my myself no nor not now of off on once only or other ought our ours
ourselves out over own really same shan she should shouldn so some such than that
the their theirs them themselves then there these they this those through to too
under until up upon us very was wasn we were weren what when where which while who
whom why will with won would wouldn you your yours yourself yourselves
""".split())

# PII scrubbers — applied to each reflection BEFORE tokenizing.
_EMAIL_RE = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_PHONE_RE = re.compile(r"\+?\d[\d\-\.\(\)\s]{6,}\d")
_DIGITS_RE = re.compile(r"\d+")
_TOKEN_RE = re.compile(r"[a-z]{3,}")


def service_key():
    for k in ("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
        v = os.environ.get(k)
        if v and v.strip():
            return v.strip()
    return None


def fetch_reflections(key):
    """Read the anonymous reflections via the REST API (service role bypasses the
    write-only RLS). Only the three non-identifying columns are selected."""
    url = (SUPABASE_URL.rstrip("/") + "/rest/v1/" + TABLE +
           "?select=day,painting,reflection&order=day.asc")
    req = urllib.request.Request(url, headers={
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def iso_week_label(day_str):
    y, w, _ = datetime.date.fromisoformat(day_str).isocalendar()
    return "%04d-W%02d" % (y, w)


def scrub(text):
    """Strip the obvious PII shapes from a reflection before tokenizing."""
    text = (text or "")[:MAX_REFLECTION].lower()
    text = _EMAIL_RE.sub(" ", text)
    text = _URL_RE.sub(" ", text)
    text = _PHONE_RE.sub(" ", text)
    text = _DIGITS_RE.sub(" ", text)
    return text


def theme_words(reflection):
    """Distinct, scrubbed, content-bearing tokens of one reflection (a SET, so a
    word repeated within a single musing still only counts once toward support)."""
    return {t for t in _TOKEN_RE.findall(scrub(reflection)) if t not in STOPWORDS}


def build_summary(rows):
    """Reduce the raw reflection rows to an aggregate-only summary dict. Emits NO
    reflection text — only counts, painting tallies, and gated single-word themes."""
    paintings = Counter()
    weeks = Counter()
    days = []
    total = 0
    with_text = 0
    doc_freq = Counter()  # word -> number of DISTINCT reflections containing it

    for r in rows:
        total += 1
        day = (r.get("day") or "").strip()
        painting = (r.get("painting") or "").strip()
        refl = (r.get("reflection") or "").strip()
        if painting:
            paintings[painting[:200]] += 1
        if day:
            days.append(day)
            try:
                weeks[iso_week_label(day)] += 1
            except ValueError:
                pass
        if refl:
            with_text += 1
            for w in theme_words(refl):
                doc_freq[w] += 1

    suppressed = total < MIN_REFLECTIONS
    themes = []
    if not suppressed:
        qualifying = [(w, n) for w, n in doc_freq.items() if n >= MIN_THEME_SUPPORT]
        qualifying.sort(key=lambda wn: (-wn[1], wn[0]))
        themes = [{"word": w, "reflections": n} for w, n in qualifying[:MAX_THEMES]]

    days_sorted = sorted(days)
    return {
        "schema": "cpl-reflections-summary/v1",
        "aggregate_only": True,
        "total_reflections": total,
        "reflections_with_text": with_text,
        "distinct_paintings": len(paintings),
        "date_range": {
            "first": days_sorted[0] if days_sorted else None,
            "last": days_sorted[-1] if days_sorted else None,
        },
        "by_painting": [
            {"painting": p, "count": c}
            for p, c in sorted(paintings.items(), key=lambda pc: (-pc[1], pc[0]))
        ],
        "by_week": [{"week": wk, "count": c} for wk, c in sorted(weeks.items())],
        "theme_min_reflections": MIN_REFLECTIONS,
        "theme_min_support": MIN_THEME_SUPPORT,
        "themes_suppressed": suppressed,
        "themes": themes,
    }


def main():
    ap = argparse.ArgumentParser(
        description="Build the aggregate-only First Light reflections summary.")
    ap.add_argument("--out", default="reflections/summary.json",
                    help="output JSON path (default reflections/summary.json — "
                         "aggregate-only, SAFE to commit to this public repo)")
    args = ap.parse_args()

    key = service_key()
    if not key:
        print("No SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY set — "
              "skipping reflections summary (graceful no-op).")
        return 0

    try:
        rows = fetch_reflections(key)
    except urllib.error.HTTPError as e:
        print("Supabase returned HTTP %s — skipping summary (existing file kept)."
              % e.code, file=sys.stderr)
        return 0
    except Exception as e:  # network blocked / transient — never hard-fail CI
        print("Could not fetch reflections (%s) — skipping summary "
              "(existing file kept)." % e, file=sys.stderr)
        return 0

    summary = build_summary(rows if isinstance(rows, list) else [])

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    theme_note = ("themes suppressed (< %d reflections)" % MIN_REFLECTIONS
                  if summary["themes_suppressed"]
                  else "%d theme(s)" % len(summary["themes"]))
    print("Wrote %s — %d reflection(s), %d painting(s), %s."
          % (args.out, summary["total_reflections"],
             summary["distinct_paintings"], theme_note))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
