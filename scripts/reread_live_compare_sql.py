"""Write the read-only live compare a reread batch takes before its posts (S684's shape; S685).

Usage: python3 -I scripts/reread_live_compare_sql.py <git ref> <slug,slug,...> <out .sql>

Reads every kb/program_requirements_college/<slug>/records/*.json at <git ref> (normally origin/main, fetched
right before the posts) straight from git, so no checkout or copy is needed, and writes one SELECT that returns
one JSON value: each live row's run at those colleges compared with the run of the record the ref files, for
kb/_program_reread_keep_better.py's --checked and live_runs. The migrate receipt keeps 4,000 characters of a
response, so the read returns counts and only the differences. Run scripts/sql_read_only_check.py on the file
before it goes anywhere. It writes nothing; pushing the file with kb/migrations/.apply pointing at it runs it.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def git(*args, data=None):
    return subprocess.run(["git", "-C", ROOT] + list(args), input=data, capture_output=True, check=True).stdout


def q(s):
    return "'" + s.replace("'", "''") + "'"


def records(ref, slug):
    path = "kb/program_requirements_college/%s/records/" % slug
    names = [n for n in git("ls-tree", "-r", "--name-only", ref, "--", path).decode().split("\n")
             if n.endswith(".json")]
    if not names:
        raise SystemExit("no records for %s at %s" % (slug, ref))
    out = git("cat-file", "--batch", data="".join("%s:%s\n" % (ref, n) for n in names).encode())
    recs, i = [], 0
    for _ in names:
        nl = out.index(b"\n", i)
        size = int(out[i:nl].split()[2])
        recs.append(json.loads(out[nl + 1:nl + 1 + size]))
        i = nl + 1 + size + 1
    return recs


def main(ref, slugs, out):
    sha = git("rev-parse", "--short", ref).decode().strip()
    rows, colleges = [], []
    for slug in [s for s in slugs.split(",") if s]:
        college = None
        for r in records(ref, slug):
            cn, run = r["control_number"], r.get("extracted_run")
            if not re.fullmatch(r"\d{5}", cn):
                raise SystemExit("bad control number %r at %s" % (cn, slug))
            if run is not None and not re.fullmatch(r"\d+", str(run)):
                raise SystemExit("bad run %r at %s %s" % (run, slug, cn))
            if college is None:
                college = r["college"]
            elif r["college"] != college:
                raise SystemExit("two colleges in %s" % slug)
            rows.append("  (%s, %s, %s)" % (q(college), q(cn), q(str(run)) if run is not None else "null"))
        colleges.append(college)
    header = """-- The reread batch's live read: each live row's run at %d colleges, compared with the run of the record %s
-- files (%s; %d committed records), for kb/_program_reread_keep_better.py's --checked and live_runs (written by
-- scripts/reread_live_compare_sql.py; S684's shape). Read-only: one SELECT, one JSON value; it writes nothing.
-- The migrate receipt keeps 4,000 characters of a response, so the read returns counts and only the differences.
-- Short keys on purpose: jsonb orders keys by length.
--   at: the read's time. chk: every checked row, by college, at every college. sum: per college, live rows, filed
--   records, rows whose live run equals the filed run, live rows with no run, and the sizes of the two lists below.
--   diff: [college, control number, live run, filed run] where both exist and differ.
--   extra: [college, control number, live run] for a live row the ref files no record for.
""" % (len(colleges), ref, sha, len(rows))
    body = """with f(college, cn, run) as (values
%s
),
l as (select college, control_number as cn, extracted_run::text as run
        from public.program_requirement_records
       where college in (%s)),
j as (select coalesce(l.college, f.college) as college, coalesce(l.cn, f.cn) as cn,
             l.run as live_run, f.run as filed_run, (l.cn is not null) as is_live, (f.cn is not null) as is_filed
        from l full outer join f on l.college = f.college and l.cn = f.cn)
select jsonb_build_object(
  'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'chk', coalesce((select jsonb_object_agg(college, cns) from (
            select college, jsonb_agg(control_number order by control_number) as cns
              from public.program_requirement_records where checked = true group by college) c), '{}'::jsonb),
  'sum', (select jsonb_object_agg(college, x) from (
            select college, jsonb_build_array(
                     count(*) filter (where is_live), count(*) filter (where is_filed),
                     count(*) filter (where is_live and is_filed and live_run = filed_run),
                     count(*) filter (where is_live and live_run is null),
                     count(*) filter (where is_live and is_filed and live_run is distinct from filed_run),
                     count(*) filter (where is_live and not is_filed)) as x
              from j group by college) t),
  'diff', coalesce((select jsonb_agg(jsonb_build_array(college, cn, live_run, filed_run) order by college, cn)
                      from j where is_live and is_filed and live_run is distinct from filed_run), '[]'::jsonb),
  'extra', coalesce((select jsonb_agg(jsonb_build_array(college, cn, live_run) order by college, cn)
                       from j where is_live and not is_filed), '[]'::jsonb)
) as live_compare;
""" % (",\n".join(rows), ", ".join(q(c) for c in sorted(colleges)))
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(header + body)
    print("wrote %s: %d records at %d colleges from %s (%s)" % (out, len(rows), len(colleges), ref, sha))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:4])
