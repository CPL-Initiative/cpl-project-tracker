#!/usr/bin/env python3
"""
Build per-lead CPL update nudges.

Reads the committed project snapshot + the lead→email directory, groups each
lead's items, flags the ones overdue for a progress update, and emits a
ready-to-send nudge per lead (subject + body) plus a single Markdown preview.

This is CHANNEL-AGNOSTIC: it produces the content. Sending is a separate step
— for the "today" path, paste/forward the per-lead drafts from `nudges_preview.md`
(or feed the JSON to a Teams Power Automate webhook / Microsoft Graph sendMail
once a channel secret is provisioned). Nothing here sends on its own.

Usage:
    python3 nudges/build_nudges.py            # writes nudges/nudges_preview.md + nudges/nudges.json
    python3 nudges/build_nudges.py --dry-run  # also prints each draft to stdout
    python3 nudges/build_nudges.py --stale-days 30

The snapshot is the source of truth for *current* item state. Once the
append-only update_log lands (P1), point `_last_update_date()` at it for true
per-item recency; today it reads each project's single `update_date`.
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROJECTS = os.path.join(ROOT, "kb", "projects_snapshot.json")
DIRECTORY = os.path.join(HERE, "team_directory.json")
EMAILS_LOCAL = os.path.join(HERE, "emails.local.json")  # gitignored — see .gitignore
PREVIEW = os.path.join(HERE, "nudges_preview.md")
PAYLOAD = os.path.join(HERE, "nudges.json")

# Default: treat anything not updated in this many days as "due for an update".
# The items have not been touched since creation, so at any sane value every
# item is currently due — that is the point of the first nudge.
DEFAULT_STALE_DAYS = 14


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


FACTSHEET = os.path.join(ROOT, "fact-sheet", "index.html")


def _emails_from_factsheet():
    """Name → email parsed from the PUBLIC committed Fact Sheet team list
    (`fact-sheet/index.html`), the maintained single source of truth for MAP
    team contacts. These emails are already public there, so reading them adds
    no new PII to git. Returns {normalized name: email}."""
    import re
    out = {}
    if not os.path.exists(FACTSHEET):
        return out
    html = open(FACTSHEET, encoding="utf-8").read()
    # Split into per-person blocks so a person with NO email can't borrow the
    # next person's address. Within each block, the email must sit in that
    # person's own `.pe` div (people without a `.pe` are skipped).
    for block in re.split(r'class="person"', html)[1:]:
        pn = re.search(r'class="pn">([^<]+)<', block)
        em = re.search(r'class="pe"[^>]*>.*?mailto:([^"]+)"', block, re.S)
        if pn and em and "@" in em.group(1):
            out[_norm(pn.group(1).strip())] = em.group(1).strip()
    return out


def _load_emails():
    """Name → email map. Precedence: env `CPL_NUDGE_EMAILS` (JSON, runner path) >
    gitignored `nudges/emails.local.json` (manual path, for people not on the
    Fact Sheet) > the public Fact Sheet team list. Emails never get committed
    via this repo's directory file — only the already-public Fact Sheet carries
    them in git."""
    merged = _emails_from_factsheet()
    if os.path.exists(EMAILS_LOCAL):
        merged.update({_norm(k): v for k, v in _load(EMAILS_LOCAL).items()})
    env = os.environ.get("CPL_NUDGE_EMAILS")
    if env:
        try:
            merged.update({_norm(k): v for k, v in json.loads(env).items()})
        except (ValueError, TypeError):
            print("  warning: CPL_NUDGE_EMAILS is not valid JSON — ignoring", file=sys.stderr)
    return merged


def _resolve_email(name, emails):
    """Exact normalized match, else a substring match either direction
    (so directory 'Gloria' resolves the Fact Sheet's 'Calvin Klein Gloria')."""
    n = _norm(name)
    if n in emails:
        return emails[n]
    for k, v in emails.items():
        if n and (n in k or k in n):
            return v
    return ""


def _norm(s):
    return (s or "").strip().lower()


def _parse_date(s):
    s = (s or "").strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(s[: len(fmt) + 2], fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _last_update_date(project):
    return _parse_date(project.get("update_date"))


def build(stale_days=DEFAULT_STALE_DAYS, today=None):
    today = today or datetime.now(timezone.utc).date()
    projects = _load(PROJECTS)
    projects = projects if isinstance(projects, list) else projects.get("rows", projects)
    directory = _load(DIRECTORY)
    emails = _load_emails()
    link = directory.get("update_link", "")
    leads = [l for l in directory.get("leads", []) if l.get("name")]

    nudges = []
    unmatched_leads, no_email = [], []
    for lead in leads:
        name = lead["name"]
        email = _resolve_email(name, emails).strip()
        # Match this directory lead against the free-text project `lead` field.
        items = [p for p in projects if _norm(name) in _norm(p.get("lead"))]
        if not items:
            unmatched_leads.append(name)
            continue
        if not email:
            no_email.append(name)
        rows = []
        for p in sorted(items, key=lambda x: str(x.get("id"))):
            d = _last_update_date(p)
            if d is None:
                age, stale = None, True
            else:
                age = (today - d).days
                stale = age >= stale_days
            rows.append({
                "id": p.get("id"), "name": p.get("name", ""),
                "activity": p.get("workplan_activity", ""),
                "status": p.get("status", ""), "pct": p.get("percent_complete"),
                "last_update": p.get("update_date") or "never",
                "age_days": age, "stale": stale,
            })
        due = [r for r in rows if r["stale"]]
        nudges.append({
            "name": name, "email": email, "role": lead.get("role", ""),
            "items": rows, "due_count": len(due), "total_count": len(rows),
            "subject": _subject(name, len(due)),
            "body": _body(name, rows, due, link),
            "link": link,
        })
    return {
        "_as_of": str(today), "stale_days": stale_days,
        "update_link": link, "nudges": nudges,
        "unmatched_leads": unmatched_leads, "leads_missing_email": no_email,
    }


def _subject(name, due):
    return f"CPL update needed — {due} of your items are due for a progress note"


def _body(name, rows, due, link):
    first = name.split()[0] if name else "there"
    lines = [
        f"Hi {first},",
        "",
        "Quick nudge to keep the CPL Initiative dashboard (COBI) — and our reports —"
        " current. The items you lead are due for a short progress update:",
        "",
    ]
    for r in due:
        pct = f"{r['pct']}%" if r["pct"] not in (None, "") else "—"
        lines.append(f"  • {r['id']}  {r['name']}  ({r['activity'].split(':')[0]}) — "
                     f"status: {r['status'] or '—'}, {pct}, last updated: {r['last_update']}")
    lines += [
        "",
        f"Add your updates here (sign in with this email): {link}",
        "Click “Update” on each of your cards and jot what's moved, what's next,"
        " and any blockers — a sentence or two is perfect.",
        "",
        "Thanks for keeping it fresh — it flows straight into the annual report.",
        "",
        "— The MAP / COBI team",
    ]
    return "\n".join(lines)


def to_markdown(out):
    md = [f"# CPL update nudges — preview (as of {out['_as_of']})", ""]
    md.append(f"Stale threshold: {out['stale_days']} days · update link: {out['update_link']}")
    if out["leads_missing_email"]:
        md.append(f"\n> ⚠ **Missing emails** (fill in `nudges/team_directory.json`): "
                  + ", ".join(out["leads_missing_email"]))
    if out["unmatched_leads"]:
        md.append(f"\n> ℹ Directory names with no matching project: "
                  + ", ".join(out["unmatched_leads"]))
    md.append("")
    for n in out["nudges"]:
        to = n["email"] or "‹email needed›"
        md += [f"## {n['name']}  ·  {to}",
               f"*{n['due_count']} of {n['total_count']} items due*", "",
               f"**Subject:** {n['subject']}", "",
               "```", n["body"], "```", ""]
    return "\n".join(md)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stale-days", type=int, default=DEFAULT_STALE_DAYS)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    out = build(stale_days=args.stale_days)
    with open(PAYLOAD, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
    with open(PREVIEW, "w", encoding="utf-8") as fh:
        fh.write(to_markdown(out))
    print(f"Wrote {PREVIEW} and {PAYLOAD}")
    print(f"  {len(out['nudges'])} leads · "
          f"{sum(n['due_count'] for n in out['nudges'])} items due · "
          f"missing emails: {out['leads_missing_email'] or 'none'}")
    if args.dry_run:
        for n in out["nudges"]:
            print("\n" + "=" * 70)
            print(f"TO: {n['email'] or '‹email needed›'}\nSUBJECT: {n['subject']}\n")
            print(n["body"])


if __name__ == "__main__":
    main()
