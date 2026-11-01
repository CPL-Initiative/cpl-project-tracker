"""Guards the contacts harvest's table (S536; scheduled_sessions step 8, piece 2): one write path, closed to
every client role (Rule 10 b2), a reviewer-or-team-phrase read, and a delete nowhere."""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sql = open(os.path.join(HERE, "..", "kb", "migrations", "2026-11-01_college_contacts_harvest.sql")).read()
rb = open(os.path.join(HERE, "..", "kb", "migrations", "2026-11-01_college_contacts_harvest_rollback.sql")).read()
body = "\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))
checks = [
    ("the apply function is revoked from public, anon and authenticated",
     re.search(r"revoke all on function public\.college_contacts_harvest_apply\(jsonb\) from public, anon, authenticated", body)),
    ("only the service role executes it",
     re.search(r"grant execute on function public\.college_contacts_harvest_apply\(jsonb\) to service_role;", body)
     and not re.search(r"grant execute on function public\.college_contacts_harvest_apply\(jsonb\) to (anon|authenticated)", body)),
    ("the read is the roster's gate", "is_allowed_reviewer() or public.team_pass_ok()" in body),
    ("clients get select only", re.search(r"grant select on table public\.college_contacts_harvest to anon, authenticated;", body)
     and not re.search(r"grant (insert|update|delete)[^;]*to (anon|authenticated)", body)),
    ("nothing deletes a row", not re.search(r"\bdelete\s+from\b", body, re.I)),
    ("it never writes MAP's roster", "map_college_contacts" not in body),
    ("Sam's thirteen positions", body.count("'") and all(p in body for p in (
        "district_ceo", "college_ceo", "vice_chancellor", "assoc_vice_chancellor", "vpaa", "vpss", "vpbs", "assoc_vp",
        "dean_cte", "dean_instruction", "dean_ar", "vrc", "articulation_officer"))),
    ("the rollback drops the function and the table", "drop function if exists public.college_contacts_harvest_apply" in rb
     and "drop table if exists public.college_contacts_harvest" in rb),
]
bad = [n for n, ok in checks if not ok]
for n in bad:
    print("FAIL:", n)
print("%d/%d checks passed" % (len(checks) - len(bad), len(checks)))
sys.exit(1 if bad else 0)
