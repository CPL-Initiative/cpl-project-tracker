#!/usr/bin/env python3
"""
Seed the team-member registry from the PUBLIC CPL Fact Sheet team list.

The Fact Sheet (`fact-sheet/index.html`) is the maintained, already-public
source of MAP team contacts, so this script derives `public.team_members` from
it rather than duplicating emails in a committed JSON (the generated
`raci/team_members_seed.json` is gitignored).

Usage:
    python3 raci/_seed_team_members.py            # write the (gitignored) seed JSON + print SQL
    python3 raci/_seed_team_members.py --print-sql

The actual Supabase load was applied once via the Supabase MCP with a
NOT EXISTS guard (so reviewer edits are never clobbered); re-run + re-apply the
printed INSERT when the Fact Sheet team list changes.
"""
import argparse
import html as H
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FACTSHEET = os.path.join(ROOT, "fact-sheet", "index.html")
OUT = os.path.join(HERE, "team_members_seed.json")


def parse_members():
    doc = open(FACTSHEET, encoding="utf-8").read()
    members = []
    # Per-person blocks so a teammate with NO email can't borrow the next
    # person's address; the email must sit in that person's own `.pe` div.
    for block in re.split(r'class="person"', doc)[1:]:
        pn = re.search(r'class="pn">([^<]+)<', block)
        pr = re.search(r'class="pr">([^<]+)<', block)
        em = re.search(r'class="pe"[^>]*>.*?mailto:([^"]+)"', block, re.S)
        if not pn:
            continue
        members.append({
            "name": H.unescape(pn.group(1).strip()),
            "role": H.unescape(pr.group(1).strip()) if pr else "",
            "email": em.group(1).strip() if em else "",
            "org": "MAP", "active": True,
        })
    return members


def to_sql(members):
    def q(s):
        return "'" + (s or "").replace("'", "''") + "'"
    vals = ",\n".join(
        f"({q(m['name'])},{q(m['email'])},{q(m['role'])},{q(m.get('org','MAP'))},{i})"
        for i, m in enumerate(members))
    return ("insert into public.team_members (name,email,role,org,sort_order)\n"
            "select * from (values\n" + vals + "\n) as v(name,email,role,org,sort_order)\n"
            "where not exists (select 1 from public.team_members);")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--print-sql", action="store_true")
    args = ap.parse_args()
    members = parse_members()
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"_about": "Generated from the public fact-sheet/index.html team list "
                   "(gitignored — emails live only in the already-public Fact Sheet + Supabase).",
                   "members": members}, fh, indent=2, ensure_ascii=False)
    print(f"Parsed {len(members)} members ({sum(1 for m in members if m['email'])} with email) "
          f"→ {os.path.relpath(OUT, ROOT)} (gitignored)")
    if args.print_sql:
        print("\n" + to_sql(members))


if __name__ == "__main__":
    main()
