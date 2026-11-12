#!/usr/bin/env python3
"""Write the credential family tags into kb_curation from a live read: dry run, prepare and commit, or undo.

  python3 kb/_family_tag_apply.py                   # dry run: read live, report what it would write and the set's hash
  python3 kb/_family_tag_apply.py --prepare HASH    # read live again; while the set is still HASH, write the pending receipt
  python3 kb/_family_tag_apply.py --commit HASH     # read live again; insert the pending receipt's rows, read back, settle it
  python3 kb/_family_tag_apply.py --rollback        # remove the rows this cohort's receipts planned, guarded

Sam, 2026-11-11 (cpl_memory `sam-bundle-family-is-a-field-2026-11-11`, "A, C as recommended"): each ASE bundle stays its
own canonical title and gains `credential_family = ASE Certificate Bundles`; his 31 saved fold rows are read as family
tags, never as folds. kb/_family_tag_plan.py decides which titles convert and which are held; this script carries the
write. .github/workflows/credential-family-apply.yml runs it with the service key, because the repo's Supabase guard
denies a session's kb_curation INSERT; the workflow pushes the pending receipt to main between --prepare and --commit,
so no live row can exist without a receipt on main. Governance: workflow:credential-family-apply.yml maps to DR-07.

Rule 10, enforced here rather than by recall:
  - a fresh read at dispatch, in the dry run, the prepare and the commit: every `_CREDENTIAL_REVIEW::` row of the fold
    fields and the family field, paged by Range in (course_id, field) order, so a fold Sam saved or removed since the
    dry run changes what the commit sees;
  - the gate is the SET, never a count: the dry run prints a short hash of the sorted (title, family) pairs it would
    write plus those already written; --prepare and --commit refuse on any other set, or when any title is a conflict
    (a pending merge confirm names it as its target, or its family row holds another value), and --commit refuses when
    the rows it would insert differ from the pending receipt's;
  - insert-only under CREDENTIAL_FAMILY_COHORT, ignoring duplicates on (course_id, field), so a row a person writes
    between the read and the write wins; Sam's fold rows are never edited or deleted;
  - the undo never depends on the INSERT's echo (a POST the client retries after it committed echoes nothing): the
    pending receipt names the planned rows before the insert; after it, a live read-back files each row as ours (this
    cohort, the written value) or a person's, and compares the set again with the conflicts re-checked;
  - --rollback reads every receipt, pending ones included, and deletes each planned row only while it still carries
    this cohort, the family field and the value written; a row a person has changed since is reported as taken since
    and left alone; its rolled_back receipt is written even when it stops part-way.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import glob
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _cer_decision_apply as cda  # noqa: E402  (its PostgREST retry, insert, delete, receipts and stamp)
import _family_tag_plan as ftp  # noqa: E402

TABLE = "kb_curation"
assert TABLE == cda.TABLE
RECEIPT_DIR = os.path.join(HERE, "receipts", "credential_family_2026-11-11_s638")
PAGE = 1000
RANGE = "__range__"  # a params key _send turns into the Range header (never sent as a query parameter)
HASH_RE = re.compile(r"^[0-9a-f]{12}$")


class Rest(cda.Rest):
    """The applier's PostgREST client (its retry, insert and guarded delete) plus a Range-paged read of the rows the
    family plan reads. _send is the parent's with the Range header added; _open is the one network call."""

    def __init__(self, url, key, sleep=cda.time.sleep):
        super().__init__(url, key, sleep)
        self.base = url.rstrip("/") + "/rest/v1/" + TABLE

    def _send(self, method, params, body=None, prefer=None):
        params = dict(params)
        rng = params.pop(RANGE, None)
        headers = {"apikey": self.key, "Authorization": "Bearer " + self.key, "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        if rng:
            headers["Range-Unit"] = "items"
            headers["Range"] = "%d-%d" % rng
        return self._open(method, params, headers, body)

    def _open(self, method, params, headers, body):
        qs = urllib.parse.urlencode(params, safe='(),."*', quote_via=urllib.parse.quote)
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        return json.loads(raw) if raw else []

    def family_rows(self, page=PAGE):
        """Every _CREDENTIAL_REVIEW:: row of READ_FIELDS, ordered by the table's unique key so pages never shift; stops
        on an empty page, never a short one (the server may cap a page below PAGE)."""
        out, start = [], 0
        while True:
            got = self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                     "course_id": "like." + ftp.PREFIX + "*",
                                     "field": "in.(%s)" % ",".join(ftp.READ_FIELDS),
                                     "order": "course_id.asc,field.asc",
                                     RANGE: (start, start + page - 1)}) or []
            out.extend(got)
            if not got:
                return [r for r in out if (r.get("course_id") or "").startswith(ftp.PREFIX)]
            start += len(got)


def tag_set(tags, written):
    """The sorted (title, family) pairs a read gives: the ones to write plus the ones already written."""
    return sorted([[t["course_id"][len(ftp.PREFIX):], t["value"]] for t in tags]
                  + [[w["title"], w["family"]] for w in written])


def set_hash(pairs):
    return hashlib.sha256(json.dumps(pairs, ensure_ascii=False).encode("utf-8")).hexdigest()[:12]


CREDENTIALS = os.path.join(HERE, "credentials.json")


def current_titles(path=CREDENTIALS):
    """The credential titles on the checked-out main, or None when the file is absent (then no title reads as gone).
    After a rename, Sam's fold rows stay on the old title; the plan lists that title as gone instead of tagging it."""
    try:
        with open(path, encoding="utf-8") as f:
            return set(json.load(f))
    except (OSError, ValueError):
        return None


def read(rest):
    rows = rest.family_rows()
    p = ftp.plan(rows, ftp.families(), current_titles())
    tags, written, conflicts = ftp.tag_rows(p, rows)
    pairs = tag_set(tags, written)
    return {"rows": rows, "plan": p, "tags": tags, "written": written, "conflicts": conflicts,
            "pairs": pairs, "hash": set_hash(pairs)}


def summary(r):
    return "%d to write, %d already written, %d held for Sam, %d conflicts; set %s (%d tags)" % (
        len(r["tags"]), len(r["written"]), len(r["plan"]["held"]), len(r["conflicts"]), r["hash"], len(r["pairs"]))


def report(r, out):
    for t in r["tags"]:
        out("  write     %s = %r" % (t["course_id"], t["value"]))
    for w in r["written"]:
        out("  written   %s%s (by %s)" % (ftp.PREFIX, w["title"], w["by"]))
    for h in r["plan"]["held"]:
        out("  held      %s%s -- %s" % (ftp.PREFIX, h["title"], h["why"]))
    for c in r["conflicts"]:
        out("  CONFLICT  %s%s -- %s" % (ftp.PREFIX, c["title"], c["why"]))


def planned(tags):
    return [dict(t, reviewer_email=ftp.CREDENTIAL_FAMILY_COHORT) for t in tags]


def keyed(rows):
    return sorted((r["course_id"], r["field"], r["value"], r["reviewer_email"]) for r in rows)


def gate(r, expect, out):
    """None when the live read may be written; else the refusal line (already printed)."""
    if r["conflicts"]:
        line = "REFUSED: %s; nothing written" % summary(r)
    elif expect is None or not HASH_RE.match(expect) or r["hash"] != expect:
        line = ("REFUSED: the live set is %s, the dry run showed %s; read the dry run again. %s"
                % (r["hash"], expect, summary(r)))
    else:
        return None
    out(line)
    return line


def pending_receipt(receipt_dir, expect):
    """(name, body) of the newest receipt still pending for this set, or (None, None)."""
    for path in sorted(glob.glob(os.path.join(receipt_dir, "applied_*.json")), reverse=True):
        with open(path, encoding="utf-8") as fh:
            rec = json.load(fh)
        if rec.get("result") == "pending" and rec.get("expect") == expect:
            return os.path.basename(path), rec
    return None, None


def prepare(rest, out, expect, receipt_dir):
    r = read(rest)
    report(r, out)
    if gate(r, expect, out):
        return 1
    if not r["tags"]:
        out("nothing to write: every tag is already written (%s)" % summary(r))
        return 0
    os.makedirs(receipt_dir, exist_ok=True)
    ts = cda.stamp()
    name = "applied_%s.json" % ts
    receipt = {"table": cda.TABLE, "mode": "commit", "at": ts, "ruling": ftp.SOURCE,
               "cohort": ftp.CREDENTIAL_FAMILY_COHORT, "expect": expect, "expected_set": r["pairs"],
               "rows_read": len(r["rows"]), "rows": planned(r["tags"]), "already_written": r["written"],
               "held": [{k: h[k] for k in ("title", "why")} for h in r["plan"]["held"]],
               "fold_rows_read": [x for it in r["plan"]["convert"] for x in it["rows"]], "result": "pending"}
    cda.write_receipt(receipt_dir, name, receipt)
    out("pending: %d rows planned; receipt %s (%s)" % (len(receipt["rows"]), name, summary(r)))
    return 0


def settle(rest, receipt, expect, error):
    """File each planned row by a live read-back (ours: this cohort with the written value; else a person's or
    missing) and compare the set again. Never raises: a failed read-back leaves the receipt pending-shaped, and
    rollback works from its planned rows."""
    try:
        r = read(rest)
    except Exception as e:  # noqa: BLE001
        receipt["read_back_error"] = "%s: %s" % (type(e).__name__, e)
        receipt["result"] = ("insert raised (%s) and the read-back failed; roll back from rows" % error if error
                             else "inserted, but the read-back failed; roll back from rows")
        return False
    live = {(x["course_id"], x["field"]): x for x in r["rows"]}
    ours, theirs, missing = [], [], []
    for row in receipt["rows"]:
        now = live.get((row["course_id"], row["field"]))
        if now and now.get("reviewer_email") == ftp.CREDENTIAL_FAMILY_COHORT and now.get("value") == row["value"]:
            ours.append(row)
        elif now:
            theirs.append(dict(row, now_by=now.get("reviewer_email"), now_value=now.get("value")))
        else:
            missing.append(row)
    receipt["inserted"], receipt["skipped_as_duplicate"], receipt["missing"] = ours, theirs, missing
    receipt["read_back"] = {"to_write": len(r["tags"]), "written": len(r["written"]), "set": r["hash"],
                            "conflicts": r["conflicts"]}
    ok = error is None and not r["tags"] and not r["conflicts"] and not missing and r["hash"] == expect
    if error:
        receipt["result"] = "insert raised (%s); read back %d ours, %d a person's, %d missing" % (
            error, len(ours), len(theirs), len(missing))
    else:
        receipt["result"] = "written" if ok else "written, but the read-back differs"
    return ok


def commit(rest, out, expect, receipt_dir):
    name, receipt = pending_receipt(receipt_dir, expect)
    r = read(rest)
    report(r, out)
    if gate(r, expect, out):
        if receipt is not None:
            receipt["result"] = "refused at commit: the live set changed since the pending receipt; nothing inserted"
            cda.write_receipt(receipt_dir, name, receipt)
        return 1
    if receipt is None:
        if not r["tags"]:
            out("nothing to write: every tag is already written (%s)" % summary(r))
            return 0
        out("REFUSED: no pending receipt for set %s; run --prepare and push its receipt first" % expect)
        return 1
    if keyed(planned(r["tags"])) != keyed(receipt["rows"]):
        receipt["result"] = "refused at commit: the rows to insert differ from the pending receipt's; nothing inserted"
        cda.write_receipt(receipt_dir, name, receipt)
        out("REFUSED: the rows to insert differ from %s; nothing written" % name)
        return 1
    error, ok, echo = None, False, None
    try:
        echo = rest.insert(receipt["rows"]) or []
    except BaseException as e:  # a cancel included: the receipt is settled below before it propagates
        error = "%s: %s" % (type(e).__name__, e)
        raise
    finally:
        receipt["insert_echo"] = None if echo is None else len(echo)
        ok = settle(rest, receipt, expect, error)
        cda.write_receipt(receipt_dir, name, receipt)
        out("%s: %d ours, %d a person's, %d missing (the INSERT echoed %s); read back set %s; receipt %s"
            % (receipt["result"], len(receipt.get("inserted") or []), len(receipt.get("skipped_as_duplicate") or []),
               len(receipt.get("missing") or []), receipt["insert_echo"],
               (receipt.get("read_back") or {}).get("set"), name))
    return 0 if ok else 1


def rollback(rest, out, receipt_dir):
    plan, theirs_at_commit = {}, set()
    for path in sorted(glob.glob(os.path.join(receipt_dir, "applied_*.json"))):
        with open(path, encoding="utf-8") as fh:
            rec = json.load(fh)
        if rec.get("cohort") != ftp.CREDENTIAL_FAMILY_COHORT:
            raise SystemExit("%s names another cohort: %r" % (os.path.basename(path), rec.get("cohort")))
        for r in (rec.get("rows") or []) + (rec.get("inserted") or []):
            if r.get("reviewer_email") != ftp.CREDENTIAL_FAMILY_COHORT or r.get("field") != ftp.FAMILY_FIELD:
                raise SystemExit("a receipt names a row this cohort did not plan: %r" % r)
            plan[(r["course_id"], r["field"], r["value"])] = {k: r[k] for k in ("course_id", "field", "value")}
        for r in rec.get("skipped_as_duplicate") or []:
            theirs_at_commit.add((r["course_id"], r["field"], r["value"]))
    if not plan:
        out("nothing to roll back: no receipt plans a row")
        return 0
    todo = [plan[k] for k in sorted(plan)]
    removed, gone, taken, theirs = [], [], [], []
    ts, error = cda.stamp(), None
    try:
        live = {(x["course_id"], x["field"]): x for x in rest.family_rows()}
        for r in todo:
            now = live.get((r["course_id"], r["field"]))
            ours = (now is not None and now.get("reviewer_email") == ftp.CREDENTIAL_FAMILY_COHORT
                    and now.get("value") == r["value"])
            if now is None:
                gone.append(r)
            elif not ours:
                (theirs if (r["course_id"], r["field"], r["value"]) in theirs_at_commit else taken).append(
                    dict(r, now_by=now.get("reviewer_email"), now_value=now.get("value")))
            elif rest.delete(r, ftp.CREDENTIAL_FAMILY_COHORT):
                removed.append(r)
            else:
                taken.append(dict(r, now_by=None, now_value="changed between the rollback's read and its delete"))
    except BaseException as e:
        error = "%s: %s" % (type(e).__name__, e)
        raise
    finally:
        done = {(x["course_id"], x["field"], x["value"]) for x in removed + gone + taken + theirs}
        cda.write_receipt(receipt_dir, "rolled_back_%s.json" % ts,
                          {"table": cda.TABLE, "mode": "rollback", "at": ts, "cohort": ftp.CREDENTIAL_FAMILY_COHORT,
                           "removed": removed, "already_gone": gone, "taken_since": taken,
                           "a_persons_at_commit": theirs, "aborted": error,
                           "not_reached": [r for r in todo
                                           if (r["course_id"], r["field"], r["value"]) not in done]})
        out("rollback%s: %d removed, %d already gone, %d taken since (left as a person holds them), "
            "%d a person's at commit" % (" STOPPED (%s)" % error if error else "", len(removed), len(gone),
                                         len(taken), len(theirs)))
    return 0


def run(mode, rest, out=print, expect=None, receipt_dir=RECEIPT_DIR):
    if mode == "rollback":
        return rollback(rest, out, receipt_dir)
    if mode == "prepare":
        return prepare(rest, out, expect, receipt_dir)
    if mode == "commit":
        return commit(rest, out, expect, receipt_dir)
    if mode != "dry-run":
        raise SystemExit("mode must be dry-run, prepare, commit or rollback")
    r = read(rest)
    report(r, out)
    out("dry run: %s; nothing written (commit with expect=%s)" % (summary(r), r["hash"]))
    return 1 if r["conflicts"] else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--prepare", metavar="HASH", help="the set hash the dry run printed")
    g.add_argument("--commit", metavar="HASH", help="the set hash the dry run printed")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY is not set (the workflow holds it)")
    rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    mode = ("prepare" if a.prepare else "commit" if a.commit else "rollback" if a.rollback else "dry-run")
    return run(mode, rest, expect=a.prepare or a.commit)


if __name__ == "__main__":
    sys.exit(main())
