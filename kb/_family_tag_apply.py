#!/usr/bin/env python3
"""Write the credential family tags into kb_curation from a live read: dry run, commit, or undo.

  python3 kb/_family_tag_apply.py                 # dry run: read live, report what it would write
  python3 kb/_family_tag_apply.py --commit 24     # read live again, write if the set is still the 24 the dry run showed
  python3 kb/_family_tag_apply.py --rollback      # remove the rows this cohort wrote, from its receipts

Sam, 2026-11-11 (cpl_memory `sam-bundle-family-is-a-field-2026-11-11`, "A, C as recommended"): each ASE bundle stays its
own canonical title and gains `credential_family = ASE Certificate Bundles`; his 31 saved fold rows are read as family
tags, never as folds. kb/_family_tag_plan.py decides which titles convert and which are held; this script carries the
write. .github/workflows/credential-family-apply.yml runs it with the service key, because the repo's Supabase guard
denies a session's kb_curation INSERT. Governance: workflow:credential-family-apply.yml maps to DR-07.

Rule 10, enforced here rather than by recall:
  - a fresh read at dispatch, in both the dry run and the commit: every `_CREDENTIAL_REVIEW::` row of the fold fields
    and the family field, paged, so a fold Sam saved or removed since the dry run changes what the commit sees;
  - the commit names the count the dry run showed (`--commit N`, to write plus already written) and refuses when the
    live set no longer gives N, or when any title is a conflict (a pending merge confirm names it as its target, or its
    family row holds another value);
  - insert-only under CREDENTIAL_FAMILY_COHORT, ignoring duplicates on (course_id, field), so a row a person writes
    between the read and the write wins; Sam's fold rows are never edited or deleted;
  - the receipt (applied_<ts>.json in RECEIPT_DIR) is written BEFORE the insert and holds the fold rows read;
  - --rollback deletes only rows that still carry this cohort, the family field and the value it wrote.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _cer_decision_apply as cda  # noqa: E402  (its PostgREST client, receipts and stamp; never its plan checks)
import _family_tag_plan as ftp  # noqa: E402

RECEIPT_DIR = os.path.join(HERE, "receipts", "credential_family_2026-11-11_s638")
PAGE = 1000


class Rest(cda.Rest):
    """The applier's PostgREST client plus one paged read of the rows the family plan reads."""

    def family_rows(self, page=PAGE):
        out, offset = [], 0
        while True:
            got = self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                     "course_id": "like." + ftp.PREFIX + "*",
                                     "field": "in.(%s)" % ",".join(ftp.READ_FIELDS),
                                     "order": "course_id.asc,field.asc",
                                     "limit": str(page), "offset": str(offset)}) or []
            out.extend(got)
            if not got:
                return [r for r in out if (r.get("course_id") or "").startswith(ftp.PREFIX)]
            offset += len(got)


def read(rest):
    rows = rest.family_rows()
    p = ftp.plan(rows, ftp.families())
    tags, written, conflicts = ftp.tag_rows(p, rows)
    return rows, p, tags, written, conflicts


def report(p, tags, written, conflicts, out):
    for t in tags:
        out("  write     %s = %r" % (t["course_id"], t["value"]))
    for w in written:
        out("  written   %s%s (by %s)" % (ftp.PREFIX, w["title"], w["by"]))
    for h in p["held"]:
        out("  held      %s%s -- %s" % (ftp.PREFIX, h["title"], h["why"]))
    for c in conflicts:
        out("  CONFLICT  %s%s -- %s" % (ftp.PREFIX, c["title"], c["why"]))


def rollback(rest, out, receipt_dir):
    written = []
    for path in sorted(glob.glob(os.path.join(receipt_dir, "applied_*.json"))):
        with open(path, encoding="utf-8") as fh:
            written.extend(json.load(fh).get("inserted") or [])
    if not written:
        out("nothing to roll back: no receipt records an insert")
        return 0
    removed, gone = [], []
    for r in written:
        if r.get("reviewer_email") != ftp.CREDENTIAL_FAMILY_COHORT or r.get("field") != ftp.FAMILY_FIELD:
            raise SystemExit("a receipt names a row this cohort did not write: %r" % r)
        got = rest.delete(r, ftp.CREDENTIAL_FAMILY_COHORT)
        (removed if got else gone).append({k: r[k] for k in ("course_id", "field", "value")})
    ts = cda.stamp()
    cda.write_receipt(receipt_dir, "rolled_back_%s.json" % ts,
                      {"table": cda.TABLE, "mode": "rollback", "at": ts, "cohort": ftp.CREDENTIAL_FAMILY_COHORT,
                       "removed": removed, "already_gone": gone})
    out("rollback: %d removed, %d already gone" % (len(removed), len(gone)))
    return 0


def run(mode, rest, out=print, expect=None, receipt_dir=RECEIPT_DIR):
    if mode == "rollback":
        return rollback(rest, out, receipt_dir)
    rows, p, tags, written, conflicts = read(rest)
    report(p, tags, written, conflicts, out)
    line = "%d to write, %d already written, %d held for Sam, %d conflicts" % (
        len(tags), len(written), len(p["held"]), len(conflicts))
    if mode == "dry-run":
        out("dry run: %s; nothing written (commit with --commit %d)" % (line, len(tags) + len(written)))
        return 1 if conflicts else 0
    if mode != "commit":
        raise SystemExit("mode must be dry-run, commit or rollback")
    if conflicts:
        out("REFUSED: %s; nothing written" % line)
        return 1
    if expect is None or len(tags) + len(written) != expect:
        out("REFUSED: the live read gives %d tags, the dry run showed %s; read the dry run again. %s"
            % (len(tags) + len(written), expect, line))
        return 1
    if not tags:
        out("nothing to write: every tag is already written (%s)" % line)
        return 0
    os.makedirs(receipt_dir, exist_ok=True)
    ts = cda.stamp()
    name = "applied_%s.json" % ts
    body = [dict(t, reviewer_email=ftp.CREDENTIAL_FAMILY_COHORT) for t in tags]
    receipt = {"table": cda.TABLE, "mode": "commit", "at": ts, "ruling": ftp.SOURCE,
               "cohort": ftp.CREDENTIAL_FAMILY_COHORT, "rows_read": len(rows), "rows": body,
               "already_written": written, "held": [{k: h[k] for k in ("title", "why")} for h in p["held"]],
               "fold_rows_read": [r for it in p["convert"] for r in it["rows"]], "result": "pending"}
    cda.write_receipt(receipt_dir, name, receipt)
    got = rest.insert(body) or []
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in body if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in body if (r["course_id"], r["field"]) not in keys]
    _, _, after, after_written, after_conflicts = read(rest)
    ok = not after and not after_conflicts and len(after_written) == expect
    receipt["read_back"] = {"to_write": len(after), "written": len(after_written), "conflicts": after_conflicts}
    receipt["result"] = "written" if ok else "written, but the read-back differs"
    cda.write_receipt(receipt_dir, name, receipt)
    out("%s: %d inserted, %d skipped as duplicate; read back %d written; receipt %s"
        % (receipt["result"], len(receipt["inserted"]), len(receipt["skipped_as_duplicate"]),
           len(after_written), name))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--commit", type=int, metavar="N", help="the tag count the dry run showed")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY is not set (the workflow holds it)")
    rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    mode = "commit" if a.commit is not None else "rollback" if a.rollback else "dry-run"
    return run(mode, rest, expect=a.commit)


if __name__ == "__main__":
    sys.exit(main())
