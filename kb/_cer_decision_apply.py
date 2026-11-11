#!/usr/bin/env python3
"""Write a curator's ruled CER decisions into kb_curation: dry run, apply, or undo.

  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02             # dry run: read, check, report
  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02 --commit    # write; receipt applied_<ts>.json
  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02 --rollback  # remove rows this cohort wrote

Sam's verdict, 2026-10-02 (open-asks sheet 19, card 1, "Write them for me"): twice a sheet came
back "Done" on a Credential Reference (CER) entry and nothing reached kb_curation, because the CER
was never opened. He had already ruled the substance (sheet 14). So a session writes the rows the
CER would have written, from a committed plan that names the ruling, and then runs
cred-rename-apply.yml, which reads them like any curator's.

Why a workflow carries it. The repo's Supabase guard denies a session's kb_curation INSERT, and
Sam ruled on 2026-09-27 that sessions run the writes rather than handing him SQL. So
.github/workflows/cer-decision-apply.yml runs this with the service key, as esl-sheet-apply.yml and
funding-config-edit-apply.yml carry theirs. Governance: workflow:cer-decision-apply.yml maps to
DR-07 (unified credential titles), kb/governance_surface_map.json.

Rule 10, enforced here rather than by recall:
  - only `_CREDENTIAL_REVIEW::` rows (title and agency fields) and `_UNCLASSIFIED::` rows (the
    issuer assignment, and a title assignment only in the revise shape: a guarded replace beside
    unified_title_supersedes naming the title it replaces), only under a `<lane>-s<N>@bot` cohort;
  - a fresh read at write time of every (course_id, field) the plan touches. A row already there
    with another value is a curator's newer word: it is HELD, and nothing is written;
  - a pending unified_title_merge_confirm that names a plan row's source title as its target
    holds that row (a rename whose key is a pending merge target fights the curator);
  - the INSERT ignores duplicates on (course_id, field), so a row a curator adds between the read
    and the write wins;
  - the receipt is written BEFORE the INSERT; --rollback deletes only rows still carrying this
    cohort's reviewer_email and the value it wrote. Once cred-rename-apply has consumed an
    override, the rename's own alias map is the record (kb/cred_rename_out/<date>/).
  - a REPLACE is a guarded UPDATE, and only where the plan says so (Rule 10a): a row carrying
    `replaces: {value, reviewer_email}` names the live row it supersedes, and the ruling that lets
    it. It changes only while that row still holds exactly that value from that reviewer; anything
    else holds the plan. The receipt keeps the before-value, reviewer and date, and --rollback
    puts them back on rows that still carry this cohort and the value it wrote (Rule 10a2).
  - a RETIRE is a guarded DELETE, and only where the plan says so: `retires` names each live row by
    (course_id, field, value, reviewer_email), the ruling lets it go, and it goes only while it still
    holds exactly that value from that reviewer. The receipt keeps the whole row before the DELETE, and
    --rollback inserts it back (ignoring duplicates, so a row a curator wrote since wins; Rule 10a2).
    SkyBeacon, 2026-11-06, for Sam's "1 yes": retire his spent 2026-10-27 overrides on Spanish 1 and 2.
  - a retire or a `replaces` may also name the row's `reviewed_at`: then it holds unless the live row carries
    that very instant (a person who saved the same value again has saved it again), and a retire deletes only
    that save. A retire's `because` lands in the receipt beside the row it removed (S638, 2026-11-11).
  - an assignment for a local title no person placed: `over_machine_draft` names the unreviewed machine draft it
    displaces, and it holds unless every kb/unified_titles.json spelling still carries exactly that draft with no
    reviewer. Insert-only; the fold's supersede lane re-points the title (S638, 2026-11-11).

S333 (Sam, open-asks sheet 39 card 2, "name"): the agency fields and the replace path, so OSHA's
one name as issuer can land on rows a curator wrote earlier. kb/_apply_credential_review.py and
kb/_fold_unclassified.py only ever ADD an issuer to kb/credentials.json, so a changed issuer also
needs the file itself edited in the same pull request; the rows keep the sync from adding the old
name back.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import datetime
import glob
import http.client
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TABLE = "kb_curation"
PREFIX = "_CREDENTIAL_REVIEW::"
UNCLASSIFIED = "_UNCLASSIFIED::"
FIELDS_BY_PREFIX = {
    PREFIX: {"unified_title_override", "unified_title_merge_confirm",
             "issuing_agency_override", "training_agency_override"},
    UNCLASSIFIED: {"issuing_agency_assignment", "unified_title_assignment", "unified_title_supersedes"},
}
TITLE_FIELDS = {"unified_title_override", "unified_title_merge_confirm"}
# Fields a plan may retire but never write: the CER's "reviewed" tick on a title, which goes with the title when its
# last exhibit leaves (S638, 2026-11-11).
RETIRE_ONLY = {PREFIX: {"reviewed_marker"}}
COHORT_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*-s\d+@bot$")
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}


class Rest:
    """The PostgREST calls this script makes, against kb_curation only."""

    def __init__(self, url, key, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/" + TABLE
        self.key = key
        self.sleep = sleep

    def _call(self, method, params, body=None, prefer=None):
        for attempt in range(ATTEMPTS):
            try:
                return self._send(method, params, body, prefer)
            except urllib.error.HTTPError as e:
                if e.code not in TRANSIENT_HTTP or attempt == ATTEMPTS - 1:
                    raise
            except (urllib.error.URLError, http.client.HTTPException, ConnectionError,
                    socket.timeout, TimeoutError):
                if attempt == ATTEMPTS - 1:
                    raise
            self.sleep(2 ** attempt)

    def _send(self, method, params, body=None, prefer=None):
        qs = urllib.parse.urlencode(params, safe='(),."*', quote_via=urllib.parse.quote)
        headers = {"apikey": self.key, "Authorization": "Bearer " + self.key,
                   "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        return json.loads(raw) if raw else []

    def rows_for(self, course_id):
        return self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at,"
                                            "validated_at,validated_by",
                                  "course_id": "eq." + course_id})

    def merge_confirms(self):
        return self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                  "course_id": "like." + PREFIX + "*",
                                  "field": "eq.unified_title_merge_confirm"})

    def insert(self, rows):
        return self._call("POST", {"on_conflict": "course_id,field"}, rows,
                          prefer="resolution=ignore-duplicates,return=representation")

    def replace(self, course_id, field, old_value, old_email, body):
        """Guarded UPDATE: changes the row only while it still holds old_value from old_email."""
        return self._call("PATCH", {"course_id": "eq." + course_id, "field": "eq." + field,
                                    "value": "eq." + old_value, "reviewer_email": "eq." + old_email},
                          body, prefer="return=representation")

    def delete(self, row, cohort):
        params = {"course_id": "eq." + row["course_id"], "field": "eq." + row["field"],
                  "value": "eq." + row["value"], "reviewer_email": "eq." + cohort}
        if row.get("reviewed_at"):  # a retire that names its row's save time deletes only that save
            params["reviewed_at"] = "eq." + row["reviewed_at"]
        return self._call("DELETE", params, prefer="return=representation")


def load_plan(plan_dir):
    with open(os.path.join(plan_dir, "plan.json"), encoding="utf-8") as fh:
        plan = json.load(fh)
    rows = plan.get("rows") or []
    retires = plan.get("retires") or []
    if not plan.get("ruling") or not plan.get("cohort") or not (rows or retires):
        raise SystemExit("plan.json needs ruling, cohort and at least one row or retire")
    if not COHORT_RE.match(plan["cohort"]):
        raise SystemExit("cohort must be <lane>-s<N>@bot, got %r" % plan["cohort"])
    seen = set()
    for r in rows:
        cid, field, value = r.get("course_id"), r.get("field"), r.get("value")
        pre = next((x for x in FIELDS_BY_PREFIX if isinstance(cid, str) and cid.startswith(x)
                    and len(cid) > len(x)), None)
        if pre is None:
            raise SystemExit("every course_id is a %s key: %r" % (" or ".join(FIELDS_BY_PREFIX), cid))
        if field not in FIELDS_BY_PREFIX[pre]:
            raise SystemExit("a %s field must be one of %s: %r" % (pre, sorted(FIELDS_BY_PREFIX[pre]), field))
        rp = r.get("replaces")
        if rp is not None and not (isinstance(rp, dict) and isinstance(rp.get("value"), str)
                                   and rp["value"].strip() and isinstance(rp.get("reviewer_email"), str)
                                   and rp["reviewer_email"].strip() and rp["value"] != value):
            raise SystemExit("replaces names the live row's value and reviewer_email, and differs "
                             "from the new value: %r" % r)
        if rp is not None and rp.get("reviewed_at") is not None and _instant(rp["reviewed_at"]) is None:
            raise SystemExit("replaces' reviewed_at is an ISO timestamp: %r" % r)
        if not (isinstance(value, str) and value.strip()):
            raise SystemExit("every row carries a non-empty value: %r" % r)
        if (cid, field) in seen:
            raise SystemExit("a (course_id, field) appears twice: %r" % ((cid, field),))
        seen.add((cid, field))
        if field == "unified_title_assignment" and r.get("over_machine_draft") is not None:
            # A local title no person ever placed (S638, SkyTamarind, 2026-11-11): its kb/unified_titles.json entry is an
            # unreviewed machine draft, so there is no person's row to replace and the fold's supersede lane re-points it
            # on a plain assignment. The row names the draft it displaces, and check() holds it unless every spelling
            # still carries exactly that draft, unreviewed. Insert-only, so --rollback removes it by the cohort.
            md = r["over_machine_draft"]
            if rp is not None or not (isinstance(md, str) and md.strip()) or md == value:
                raise SystemExit("an assignment over a machine draft names the draft it displaces, differs from it, "
                                 "and replaces no row: %r" % cid)
            if any(x.get("course_id") == cid and x.get("field") == "unified_title_supersedes" for x in rows):
                raise SystemExit("an assignment over a machine draft supersedes no person's title: %r" % cid)
        elif field == "unified_title_assignment":
            # The revise shape only (SkyLantern, 2026-11-06; Sam: "make the seven title fixes in the CER"): moving a local
            # title a person placed is the Exhibits tab's Change to Proposed Title, a guarded replace of the live
            # assignment beside unified_title_supersedes naming the title it replaces, which the fold's revise lane
            # re-points. A bare assignment (unclassified triage) stays the tab's to write.
            sup = [x for x in rows if x.get("course_id") == cid and x.get("field") == "unified_title_supersedes"]
            if not rp or not sup or sup[0].get("value") != rp["value"]:
                raise SystemExit("a title assignment is a replace beside unified_title_supersedes naming the title it "
                                 "replaces: %r" % cid)
        if field == "unified_title_supersedes":
            asg = [x for x in rows if x.get("course_id") == cid and x.get("field") == "unified_title_assignment"]
            if not asg:
                raise SystemExit("unified_title_supersedes rides with the title assignment it explains: %r" % cid)
        if field == "unified_title_merge_confirm":
            override = [x for x in rows if x["course_id"] == cid and x["field"] == "unified_title_override"]
            if not override or override[0]["value"] != value:
                raise SystemExit("a merge confirm must name the same target as its title override: %r" % cid)
    for r in retires:
        cid, field = r.get("course_id"), r.get("field")
        pre = next((x for x in FIELDS_BY_PREFIX if isinstance(cid, str) and cid.startswith(x)
                    and len(cid) > len(x)), None)
        if pre is None or field not in FIELDS_BY_PREFIX[pre] | RETIRE_ONLY.get(pre, set()):
            raise SystemExit("a retire names a %s key and one of its fields: %r" % (" or ".join(FIELDS_BY_PREFIX), r))
        if not all(isinstance(r.get(k), str) and r[k].strip() for k in ("value", "reviewer_email")):
            raise SystemExit("a retire names the live row's value and reviewer_email: %r" % r)
        if r["reviewer_email"] == plan["cohort"]:
            raise SystemExit("a retire removes a curator's row; this cohort's own rows go by --rollback: %r" % r)
        if r.get("reviewed_at") is not None and _instant(r["reviewed_at"]) is None:
            raise SystemExit("a retire's reviewed_at is an ISO timestamp: %r" % r)
        if (cid, field) in seen:
            raise SystemExit("a (course_id, field) appears twice, or is both written and retired: %r" % ((cid, field),))
        seen.add((cid, field))
    return plan


UT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "unified_titles.json")
CURATOR = "curator (CER unclassified-triage)"


def _instant(ts):
    """An ISO timestamp as an aware datetime, or None. PostgREST writes "+00:00", a SQL read "+00", a plan "Z"."""
    if not isinstance(ts, str) or not ts.strip():
        return None
    s = ts.strip().replace(" ", "T")
    s = s[:-1] + "+00:00" if s.endswith("Z") else s
    s = re.sub(r"([+-]\d{2})$", r"\1:00", s)
    # every fraction to six digits, so Python 3.11's fromisoformat (the workflow's) reads "…29.9207" as a SQL read does
    s = re.sub(r"\.(\d{1,6})\d*(?=[+-]\d{2}:\d{2}$|$)", lambda m: "." + m.group(1).ljust(6, "0"), s)
    try:
        d = datetime.datetime.fromisoformat(s)
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=datetime.timezone.utc)


def _same_stamp(guard, live):
    """No guard asks nothing; a guard holds only while the live row carries that very instant."""
    return guard is None or (_instant(guard) is not None and _instant(guard) == _instant(live))


def machine_draft_state(raw, draft, ut=None):
    """None while every kb/unified_titles.json spelling of a local title is an unreviewed machine draft holding
    exactly `draft` (the fold's supersede lane then re-points it on a plain assignment); else why it is held."""
    if ut is None:
        with open(UT_PATH, encoding="utf-8") as fh:
            ut = json.load(fh)
    spell = [k for k in ut if k.strip() == raw.strip()]
    if not spell:
        return "no kb/unified_titles.json entry holds %r" % raw
    for k in spell:
        e = ut[k]
        if (e.get("reviewed_by") or "") or e.get("classified_by") == CURATOR:
            return "%r is a person's classification (%s), not a machine draft" % (k, e.get("reviewed_by") or CURATOR)
        if (e.get("unified_title") or "") != draft:
            return "%r holds %r, not the draft %r the plan names" % (k, e.get("unified_title"), draft)
    return None


def check(plan, rest, ut=None):
    """Each plan row's state against a fresh read: write, written, or held (with why)."""
    live = {}
    retires = plan.get("retires") or []
    for cid in sorted({r["course_id"] for r in (plan.get("rows") or []) + retires}):
        for x in rest.rows_for(cid) or []:
            live[(x["course_id"], x["field"])] = x
    confirms = rest.merge_confirms() or []
    out = []
    for r in plan.get("rows") or []:
        now = live.get((r["course_id"], r["field"]))
        rp = r.get("replaces")
        source = r["course_id"][len(PREFIX):]
        fights = [c for c in confirms if c.get("value") == source and c.get("course_id") != r["course_id"]] \
            if r["field"] in TITLE_FIELDS else []
        md = r.get("over_machine_draft")
        md_why = machine_draft_state(r["course_id"][len(UNCLASSIFIED):], md, ut) \
            if md is not None and now is None else None
        if rp and now is not None and now.get("value") == rp["value"] \
                and now.get("reviewer_email") == rp["reviewer_email"] \
                and not _same_stamp(rp.get("reviewed_at"), now.get("reviewed_at")):
            state, why = "held", "the row it replaces was saved again (%s, not %s)" % (now.get("reviewed_at"),
                                                                                       rp["reviewed_at"])
        elif rp and now is not None and now.get("value") == rp["value"] \
                and now.get("reviewer_email") == rp["reviewer_email"]:
            state, why = "replace", "replaces %r (by %s), as the ruling says" % (rp["value"], rp["reviewer_email"])
        elif md_why:
            state, why = "held", md_why
        elif rp and now is None:
            state, why = "held", "the row it replaces (%r by %s) is gone" % (rp["value"], rp["reviewer_email"])
        elif now is None:
            state, why = ("held", "a pending merge confirm on %s names this source" % fights[0]["course_id"]) \
                if fights else ("write", "")
        elif now.get("value") == r["value"]:
            state, why = "written", "already holds this value (by %s)" % now.get("reviewer_email")
        else:
            state, why = "held", "holds %r (by %s); a curator's word wins" % (now.get("value"),
                                                                            now.get("reviewer_email"))
        out.append({"course_id": r["course_id"], "field": r["field"], "value": r["value"],
                    "state": state, "why": why,
                    "live": None if now is None else {k: now.get(k) for k in ("value", "reviewer_email",
                                                                              "reviewed_at")}})
    for r in retires:
        now = live.get((r["course_id"], r["field"]))
        if now is None:
            state, why = "retired", "already gone"
        elif now.get("value") == r["value"] and now.get("reviewer_email") == r["reviewer_email"] \
                and not _same_stamp(r.get("reviewed_at"), now.get("reviewed_at")):
            state, why = "held", "saved again since the ruling (%s, not %s)" % (now.get("reviewed_at"), r["reviewed_at"])
        elif now.get("value") == r["value"] and now.get("reviewer_email") == r["reviewer_email"]:
            state, why = "retire", "retires %r (by %s), as the ruling says" % (r["value"], r["reviewer_email"])
        else:
            state, why = "held", "holds %r (by %s), not the row the ruling names" % (now.get("value"),
                                                                                  now.get("reviewer_email"))
        out.append({"course_id": r["course_id"], "field": r["field"], "value": r["value"], "retire": True,
                    "state": state, "why": why, "because": r.get("because"), "guard_at": r.get("reviewed_at"),
                    "live": None if now is None else {k: now.get(k) for k in (
                        "value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")}})
    return out


def settled(states):
    """Every written row holds its value and every retired row is gone."""
    return all(s["state"] == ("retired" if s.get("retire") else "written") for s in states)


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")


def write_receipt(plan_dir, name, body):
    with open(os.path.join(plan_dir, name), "w", encoding="utf-8") as fh:
        json.dump(body, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def run(plan_dir, mode, rest, out=print):
    plan = load_plan(plan_dir)
    if mode == "rollback":
        receipts = sorted(glob.glob(os.path.join(plan_dir, "applied_*.json")))
        written, replaced, retired = [], [], []
        for p in receipts:
            with open(p, encoding="utf-8") as fh:
                rec = json.load(fh)
            written.extend(rec.get("inserted") or [])
            replaced.extend(rec.get("replaced") or [])
            retired.extend(rec.get("retired") or [])
        if not written and not replaced and not retired:
            out("nothing to roll back: no receipt records an insert or a replace")
            return 0
        ts = stamp()
        removed, gone, restored, moved = [], [], [], []
        for r in written:
            got = rest.delete(r, plan["cohort"])
            (removed if got else gone).append({k: r[k] for k in ("course_id", "field", "value")})
        for r in replaced:
            b = r["before"]
            got = rest.replace(r["course_id"], r["field"], r["value"], plan["cohort"],
                               {"value": b["value"], "reviewer_email": b["reviewer_email"],
                                "reviewed_at": b.get("reviewed_at")})
            (restored if got else moved).append({k: r[k] for k in ("course_id", "field", "value")})
        reinstated, taken = [], []
        for r in retired:
            b = r["before"]
            row = {"course_id": r["course_id"], "field": r["field"], "value": b["value"],
                   "reviewer_email": b["reviewer_email"]}
            row.update({k: b[k] for k in ("reviewed_at", "validated_at", "validated_by") if b.get(k) is not None})
            got = rest.insert([row])
            (reinstated if got else taken).append({k: row[k] for k in ("course_id", "field", "value")})
        write_receipt(plan_dir, "rolled_back_%s.json" % ts,
                      {"table": TABLE, "mode": "rollback", "at": ts, "cohort": plan["cohort"],
                       "removed": removed, "already_gone": gone,
                       "restored": restored, "changed_since": moved,
                       "reinstated": reinstated, "taken_since": taken})
        out("rollback: %d removed, %d already gone (consumed by the rename, or changed by a curator); "
            "%d restored to the curator's value, %d changed since; %d retired rows reinstated, %d taken since"
            % (len(removed), len(gone), len(restored), len(moved), len(reinstated), len(taken)))
        return 0

    states = check(plan, rest)
    for s in states:
        out("  %-8s %s | %s = %r%s" % (s["state"], s["course_id"], s["field"], s["value"],
                                        (" -- " + s["why"]) if s["why"] else ""))
    held = [s for s in states if s["state"] == "held"]
    todo = [s for s in states if s["state"] == "write"]
    swaps = [s for s in states if s["state"] == "replace"]
    drops = [s for s in states if s["state"] == "retire"]
    if mode == "dry-run":
        out("dry run: %d to write, %d to replace, %d to retire, %d already written, %d already retired, %d held; "
            "nothing written"
            % (len(todo), len(swaps), len(drops), sum(s["state"] == "written" for s in states),
               sum(s["state"] == "retired" for s in states), len(held)))
        return 1 if held else 0

    if mode != "commit":
        raise SystemExit("mode must be dry-run, commit or rollback")
    if held:
        out("REFUSED: %d row(s) held; nothing written" % len(held))
        return 1
    if not todo and not swaps and not drops:
        out("nothing to write: every row already holds its value")
        return 0
    ts = stamp()
    name = "applied_%s.json" % ts
    rows = [{"course_id": s["course_id"], "field": s["field"], "value": s["value"],
             "reviewer_email": plan["cohort"]} for s in todo]
    planned_swaps = [{"course_id": s["course_id"], "field": s["field"], "value": s["value"],
                      "reviewer_email": plan["cohort"], "before": s["live"]} for s in swaps]
    planned_drops = [{"course_id": s["course_id"], "field": s["field"], "value": s["value"], "before": s["live"],
                      "because": s.get("because"), "guard_at": s.get("guard_at")} for s in drops]
    receipt = {"table": TABLE, "mode": "commit", "at": ts, "ruling": plan["ruling"],
               "cohort": plan["cohort"], "read": states, "rows": rows, "replaces": planned_swaps,
               "retires": planned_drops, "result": "pending"}
    write_receipt(plan_dir, name, receipt)
    got = (rest.insert(rows) or []) if rows else []
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in rows if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in rows if (r["course_id"], r["field"]) not in keys]
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    receipt["replaced"], receipt["replace_missed"] = [], []
    for sw in planned_swaps:
        b = sw["before"]
        got = rest.replace(sw["course_id"], sw["field"], b["value"], b["reviewer_email"],
                           {"value": sw["value"], "reviewer_email": plan["cohort"], "reviewed_at": now_iso})
        (receipt["replaced"] if got else receipt["replace_missed"]).append(sw)
    receipt["retired"], receipt["retire_missed"] = [], []
    for dr in planned_drops:
        b = dr["before"]
        target = {"course_id": dr["course_id"], "field": dr["field"], "value": b["value"]}
        if dr.get("guard_at"):
            target["reviewed_at"] = b.get("reviewed_at")  # the live row's own spelling of the instant the guard matched
        got = rest.delete(target, b["reviewer_email"])
        (receipt["retired"] if got else receipt["retire_missed"]).append(dr)
        write_receipt(plan_dir, name, receipt)
    after = check(plan, rest)
    ok = settled(after)
    receipt["read_back"] = after
    receipt["result"] = "written" if ok else "written, but the read-back differs"
    write_receipt(plan_dir, name, receipt)
    out("%s: %d inserted, %d skipped as duplicate, %d replaced, %d replace missed, %d retired, %d retire missed; "
        "receipt %s"
        % (receipt["result"], len(receipt["inserted"]), len(receipt["skipped_as_duplicate"]),
           len(receipt["replaced"]), len(receipt["replace_missed"]), len(receipt["retired"]),
           len(receipt["retire_missed"]), name))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("plan_dir")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--commit", action="store_true")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY is not set (the workflow holds it)")
    rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    mode = "commit" if a.commit else "rollback" if a.rollback else "dry-run"
    return run(a.plan_dir, mode, rest)


if __name__ == "__main__":
    sys.exit(main())
