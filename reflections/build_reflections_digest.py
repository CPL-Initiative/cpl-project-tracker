#!/usr/bin/env python3
"""Weekly "musings" digest of First Light reflections, for the Obsidian vault.

First Light (the daily painting greeting on the public dashboard, first_light.js)
invites an ANONYMOUS one-line reflection. Those land in Supabase
public.cpl_reflections — anon INSERT only, NO public SELECT (the
chat_interactions pattern, CLAUDE.md §8). The service role can read them; this
script does, and renders a gentle per-week "mashup of the week's musings" as
Obsidian-friendly markdown so the cpl-knowledge-base vault can index them.

PRIVACY — read before changing:
  * Reflections are anonymous BY DESIGN. first_light.js posts only
    {painting, reflection}; nothing identifying is collected, and users are told
    the words are kept anonymous and gathered only "to look for uplifting
    themes." This digest preserves that contract: it emits the painting, the
    reflection text, and the calendar day — never an id, IP, or precise time.
  * It is meant for the PRIVATE cpl-knowledge-base vault (Obsidian), NOT this
    PUBLIC repo. The default --out (reflections_out/) is gitignored here, so no
    reflection text is ever committed to cpl-project-tracker. Point --out at a
    cpl-knowledge-base clone, or run the weekly workflow documented in
    reflections/README.md from inside that repo.

Stdlib only (urllib) so it runs in CI with no `pip install`.

  SUPABASE_SERVICE_KEY=...  python3 reflections/build_reflections_digest.py \
      --out reflections_out
"""
import argparse
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
TABLE = "cpl_reflections"
MAX_REFLECTION = 2000  # mirrors first_light.js / the table CHECK

MONTHS = ["", "January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
            "Saturday", "Sunday"]


def service_key():
    for k in ("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
        v = os.environ.get(k)
        if v and v.strip():
            return v.strip()
    return None


def fetch_reflections(key):
    """Read the anonymous reflections via the REST API (service role bypasses
    the write-only RLS). Only the three non-identifying columns are selected."""
    url = (SUPABASE_URL.rstrip("/") + "/rest/v1/" + TABLE +
           "?select=day,painting,reflection&order=day.asc")
    req = urllib.request.Request(url, headers={
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def iso_week(day_str):
    y, w, _ = datetime.date.fromisoformat(day_str).isocalendar()
    return (y, w)


def week_bounds(y, w):
    mon = datetime.date.fromisocalendar(y, w, 1)
    return mon, mon + datetime.timedelta(days=6)


def human_range(mon, sun):
    if mon.month == sun.month and mon.year == sun.year:
        return "%s %d–%d, %d" % (MONTHS[mon.month], mon.day, sun.day, sun.year)
    if mon.year == sun.year:
        return "%s %d – %s %d, %d" % (MONTHS[mon.month], mon.day,
                                      MONTHS[sun.month], sun.day, sun.year)
    return "%s %d, %d – %s %d, %d" % (MONTHS[mon.month], mon.day, mon.year,
                                      MONTHS[sun.month], sun.day, sun.year)


def blockquote(text):
    """Render user text as a markdown blockquote, line-prefixed so multi-line
    musings stay inside the quote and stray markdown can't escape the block."""
    text = (text or "").strip()[:MAX_REFLECTION]
    lines = text.splitlines() or [""]
    return "\n".join("> " + ln.rstrip() for ln in lines)


def render_week(y, w, items):
    mon, sun = week_bounds(y, w)
    hr = human_range(mon, sun)
    out = [
        "---",
        "title: First Light musings — week of %s" % hr,
        "date: %s" % sun.isoformat(),
        "tags: [first-light, reflections, musings, cpl]",
        "obsidian-folder: cpl-knowledge-base/musings",
        "---",
        "",
        "# 🌅 First Light musings — week of %s" % hr,
        "",
        "*%d anonymous reflection%s shared from the daily painting this week. "
        "Kept anonymous; gathered only to look for uplifting themes and "
        "opportunities for our colleagues and communities.*"
        % (len(items), "" if len(items) == 1 else "s"),
        "",
    ]
    by_day = {}
    for it in items:
        by_day.setdefault(it.get("day"), []).append(it)
    for day in sorted(d for d in by_day if d):
        dt = datetime.date.fromisoformat(day)
        wd = WEEKDAYS[dt.weekday()]
        for it in by_day[day]:
            painting = (it.get("painting") or "").strip() or "today’s painting"
            out.append("## %s, %s %d — *%s*" % (wd, MONTHS[dt.month], dt.day, painting))
            out.append("")
            out.append(blockquote(it.get("reflection")))
            out.append("")
    return "\n".join(out).rstrip() + "\n"


def render_index(weeks):
    """A rolling landing page linking each week's digest (newest first)."""
    out = [
        "---",
        "title: First Light musings — index",
        "tags: [first-light, reflections, musings, cpl, index]",
        "obsidian-folder: cpl-knowledge-base/musings",
        "---",
        "",
        "# 🌅 First Light musings",
        "",
        "Weekly mashups of the anonymous reflections shared from the dashboard’s "
        "daily painting. Newest first.",
        "",
    ]
    for (y, w), n in weeks:
        mon, sun = week_bounds(y, w)
        out.append("- [[%04d-W%02d]] — week of %s (%d reflection%s)"
                   % (y, w, human_range(mon, sun), n, "" if n == 1 else "s"))
    out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Build the First Light reflections digest.")
    ap.add_argument("--out", default="reflections_out",
                    help="output directory (default reflections_out/ — gitignored here; "
                         "point at a cpl-knowledge-base clone for the vault)")
    ap.add_argument("--weeks", type=int, default=0,
                    help="only emit the most recent N ISO weeks (0 = all)")
    args = ap.parse_args()

    key = service_key()
    if not key:
        print("No SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY set — "
              "skipping reflections digest (this is a graceful no-op).")
        return 0

    try:
        rows = fetch_reflections(key)
    except urllib.error.HTTPError as e:
        print("Supabase returned HTTP %s — skipping digest." % e.code, file=sys.stderr)
        return 0
    except Exception as e:  # network blocked / transient — never hard-fail a workflow
        print("Could not fetch reflections (%s) — skipping digest." % e, file=sys.stderr)
        return 0

    by_week = {}
    for r in rows:
        day = (r.get("day") or "").strip()
        if not day or not (r.get("reflection") or "").strip():
            continue
        try:
            yw = iso_week(day)
        except ValueError:
            continue
        by_week.setdefault(yw, []).append(r)

    if not by_week:
        print("No reflections yet — nothing to write.")
        return 0

    order = sorted(by_week, reverse=True)
    if args.weeks and args.weeks > 0:
        order = order[:args.weeks]

    os.makedirs(args.out, exist_ok=True)
    written = []
    for yw in order:
        y, w = yw
        path = os.path.join(args.out, "%04d-W%02d.md" % (y, w))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(render_week(y, w, by_week[yw]))
        written.append((yw, len(by_week[yw])))

    with open(os.path.join(args.out, "index.md"), "w", encoding="utf-8") as fh:
        fh.write(render_index(written))

    total = sum(n for _, n in written)
    print("Wrote %d weekly digest(s) (%d reflections) to %s/"
          % (len(written), total, args.out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
