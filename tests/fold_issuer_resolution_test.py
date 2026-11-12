#!/usr/bin/env python3
"""fold_issuer_resolution_test.py — the enforced issuer resolution (#3116 redesign), end to end.

The fold never updates or deletes an issuer row a person wrote. It writes one issuer_resolution row per
folded target (kb/_cred_fold_resolution_write.py); every reader resolves through kb/fold_issuer.py
effective_issuer(); the nightly sync (kb/_apply_credential_review.py) enforces it on credentials.json.
This drives the whole workflow against an in-memory kb_curation: the nightly sync, the dry-run, the JSON
apply, the resolution write, the row moves, and the undo. What it pins, by the conductor's interleavings:

  i1  a person edits the issuer one second BEFORE decided_at: the fold wins, and their row is named
  i2  one second AFTER: the person wins, in the overlay and in credentials.json
  i3  the resolution insert fails: the writer exits non-zero, and the workflow commits nothing
  i4  the nightly runs between a failed apply and its retry: the retry converges on the clean result
  i5  a second fold onto the same target: the cohort row is replaced, guarded, with its before-value
  i6  apply, nightly, undo: no false drift, the files come back, the nightly then leaves them alone
  and the second review's still-open findings 0, 1, 4, 5, 6 and 7 (2 and 3 are in
  tests/cred_rename_fold_issuer_test.py).

Run from the repo root:  python3 tests/fold_issuer_resolution_test.py
"""
import contextlib
import copy
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import fold_issuer as fi  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402
import _cred_fold_resolution_write as resw  # noqa: E402
import _apply_credential_review as acr  # noqa: E402

results = []
ASE = "National Institute for Automotive Service Excellence (ASE)"
CCC = "California Community Colleges"
AWS = "American Welding Society (AWS)"
ARC = "American Red Cross"
SAM, MAP = "slee@cccco.edu", "map@rccd.edu"
F1, F2 = "2026-11-11T15:26:54Z", "2026-11-11T15:26:55Z"
JUL = "2026-07-09T00:07:08Z"
P = "_CREDENTIAL_REVIEW::"


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def rec(issuer, by=None, at=None):
    return {"issuing_agency": issuer, "training_agency": None, "confidence_issuer": 1.0,
            "reviewed_by": by, "reviewed_at": at}


def issuers(creds, t):
    return sorted({r["issuing_agency"] for r in creds.get(t) or []})


class DB:
    """kb_curation in memory, wired into the five modules' network calls."""

    def __init__(self):
        self.rows, self.fail_insert_for = {}, set()
        self.wire()

    def wire(self):
        sup.KEY = resw.KEY = acr.KEY = undo.KEY = "test"
        undo.rest = self.rest
        resw.delete_own = self.delete_own
        sup.fetch_credential_review_rows = self.fetch
        sup.delete_row, sup.patch_row = self.delete, self.patch
        resw.insert_ignore, resw.get_row, resw.replace_own = self.insert_ignore, self.get, self.replace_own
        acr.fetch_rows = lambda: [dict(r) for r in self.rows.values()]

    def add(self, title, field, value, by, at):
        self.rows[(P + title, field)] = {"course_id": P + title, "field": field, "value": value,
                                         "reviewer_email": by, "reviewed_at": at,
                                         "validated_at": None, "validated_by": None}

    def fetch(self):
        out = {}
        for r in self.rows.values():
            out.setdefault(r["course_id"], []).append(dict(r))
        return out

    def delete(self, cid, field):
        n = 1 if self.rows.pop((cid, field), None) else 0
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": n}

    def patch(self, old, new, field):
        if (new, field) in self.rows:
            return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch",
                    "status": "fail", "error": "HTTP Error 409: Conflict"}
        r = self.rows.pop((old, field), None)
        if r:
            self.rows[(new, field)] = dict(r, course_id=new)
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch",
                "status": "ok", "rows_affected": 1 if r else 0}

    def rest(self, method, path, body=None, prefer=""):
        """The undo's PostgREST calls on kb_curation, with eq./is.null filters."""
        from urllib.parse import parse_qsl
        self.rest_calls = getattr(self, "rest_calls", []) + [(method, path)]
        q = dict(parse_qsl(path.split("?", 1)[1])) if "?" in path else {}
        q.pop("select", None)

        def match(r):
            for k, v in q.items():
                want = None if v == "is.null" else v[3:]
                if r.get(k) != want:
                    return False
            return True
        hits = [k for k, r in self.rows.items() if match(r)]
        if method == "GET":
            return [dict(self.rows[k]) for k in hits]
        if method == "DELETE":
            return [self.rows.pop(k) for k in hits]
        if method == "PATCH":
            out = []
            for k in hits:
                r = dict(self.rows[k], **body)
                nk = (r["course_id"], r["field"])
                if nk != k and nk in self.rows:
                    raise RuntimeError("HTTP Error 409: Conflict")
                del self.rows[k]
                self.rows[nk] = r
                out.append(r)
            return out
        if (body["course_id"], body["field"]) in self.rows:
            return []
        self.rows[(body["course_id"], body["field"])] = dict(body)
        return [body]

    def delete_own(self, cid, field, value):
        r = self.rows.get((cid, field))
        if r and r.get("reviewer_email") == fi.COHORT and r.get("value") == value:
            return [self.rows.pop((cid, field))]
        return []

    def insert_ignore(self, row):
        if row["course_id"] in self.fail_insert_for:
            raise RuntimeError("HTTP Error 503: Service Unavailable")
        if (row["course_id"], row["field"]) in self.rows:
            return []
        self.rows[(row["course_id"], row["field"])] = dict({"validated_at": None, "validated_by": None}, **row)
        return [row]

    def get(self, cid, field):
        r = self.rows.get((cid, field))
        return dict(r) if r else None

    def replace_own(self, cid, field, old_value, new):
        r = self.rows.get((cid, field))
        if not r or r.get("reviewer_email") != fi.COHORT or r.get("value") != old_value:
            return []
        r.update(new)
        return [r]


class Env:
    """A scratch repo: the three kb files, the overlay, the receipts, wired into every module."""

    def __init__(self, creds, ut, db, arts=None, related=None):
        self.db = db
        self.dir = tempfile.mkdtemp(prefix="fold_res_")
        self.p = {n: os.path.join(self.dir, n) for n in
                  ("credentials.json", "unified_titles.json", "coci_articulations.json",
                   "credential_review_overlay.json", "exhibits_related.json")}
        self.out = os.path.join(self.dir, "cred_rename_out")
        self.dry = os.path.join(self.dir, "cred_rename_dryrun")
        self.write("credentials.json", creds)
        self.write("unified_titles.json", ut)
        self.write("coci_articulations.json", {"articulations": arts or []})
        self.write("exhibits_related.json", related or {"titles": []})
        self.wire()

    def wire(self):
        self.db.wire()
        for m in (dry, app, undo):
            m.CREDENTIALS, m.UNIFIED_TITLES, m.ARTICULATIONS = (self.p["credentials.json"],
                                                                self.p["unified_titles.json"],
                                                                self.p["coci_articulations.json"])
        dry.OVERLAY = app.OVERLAY = acr.OUT = self.p["credential_review_overlay.json"]
        dry.RELATED = app.RELATED = self.p["exhibits_related.json"]
        dry.FAMILIES = app.FAMILIES = sup.FAMILIES = os.path.join(self.dir, "credential_families.json")  # absent: no families
        dry.PLANS_DIR = app.PLANS_DIR = os.path.join(self.dir, "cred_rename_plans")  # absent: no ruled plans
        dry.OUT_DIR = app.DRYRUN_OUT = self.dry
        app.ALIAS_PATH = os.path.join(self.dry, "alias_map.json")
        app.OUT_ROOT = sup.OUT_ROOT = resw.OUT_ROOT = acr.CRED_OUT_ROOT = self.out
        acr.CR_PATH = self.p["credentials.json"]

    def write(self, name, obj):
        with open(self.p[name] if name in self.p else name, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)

    def read(self, name):
        with open(self.p[name], encoding="utf-8") as f:
            return json.load(f)

    def files(self):
        return {n: open(p, encoding="utf-8").read() for n, p in self.p.items() if os.path.exists(p)}

    def restore(self, snap):
        for n, txt in snap.items():
            open(self.p[n], "w", encoding="utf-8").write(txt)

    def nightly(self):
        self.wire()
        with contextlib.redirect_stdout(io.StringIO()):
            acr.main()

    def workflow(self, db):
        """cred-rename-apply.yml's steps in order. Returns the step that failed, or None (committed)."""
        self.db = db
        self.nightly()                                   # step 1: fresh sync
        with contextlib.redirect_stdout(io.StringIO()):
            dry.main()                                   # step 2
            try:
                app.main()                               # step 3
            except SystemExit as e:
                if e.code:
                    return "apply"
            try:
                resw.main()                              # step 3b: no continue-on-error
            except SystemExit as e:
                if e.code:
                    return "resolution"
            try:
                sup.main()                               # step 4 (continue-on-error)
            except SystemExit:
                pass
        return None

    def receipt(self):
        names = sorted(os.listdir(self.out), key=lambda n: (n[:10], int(n[11:]) if n[11:].isdigit() else 1))
        return os.path.join(self.out, names[-1])

    def close(self):
        shutil.rmtree(self.dir, ignore_errors=True)


def hvac_fixture():
    """Heating and Air Conditioning, as on 2026-11-11: the lead's July ASE override, Sam's issuer after the
    fold save; plus a cert-form fold and a plain fold."""
    creds = {"Automotive Air Conditioner": [rec(ASE, MAP, JUL)],
             "Heating and Air Conditioning": [rec(ASE)],
             "Brakes (ASE A5)": [rec(ASE)],
             "Brake Lab": [rec(CCC)],
             "Welding Cert": [rec(AWS)],
             "Weld Src": [rec(CCC)]}
    ut = {"r1": {"unified_title": "Automotive Air Conditioner"}, "r2": {"unified_title": "Heating and Air Conditioning"},
          "r3": {"unified_title": "Brake Lab"}, "r4": {"unified_title": "Weld Src"}}
    db = DB()
    H = "Heating and Air Conditioning (ASE A7 standards)"
    db.add("Automotive Air Conditioner", "issuing_agency_override", ASE, MAP, JUL)
    db.add("Automotive Air Conditioner", "unified_title_override", H, SAM, F1)
    db.add("Heating and Air Conditioning", "unified_title_override", H, SAM, F2)
    db.add("Heating and Air Conditioning", "unified_title_merge_confirm", H, SAM, F2)
    db.add("Heating and Air Conditioning", "issuing_agency_override",
           "California Community College Chancellor's Office", SAM, "2026-11-11T15:47:58Z")
    db.add("Brake Lab", "unified_title_override", "Brakes (ASE A5)", SAM, F2)
    db.add("Brake Lab", "unified_title_merge_confirm", "Brakes (ASE A5)", SAM, F2)
    # still_open 0 and 1: the target's own older additional (an alias spelling of the winner and NCCER);
    # Sam's issuer and additional set with the fold.
    db.add("Welding Cert", "issuing_agency_additional_override",
           "California Community College Chancellor's Office | NCCER", MAP, JUL)
    db.add("Weld Src", "unified_title_override", "Welding Cert", SAM, F1)
    db.add("Weld Src", "unified_title_merge_confirm", "Welding Cert", SAM, F1)
    db.add("Weld Src", "issuing_agency_override", CCC, SAM, F2)
    db.add("Weld Src", "issuing_agency_additional_override", ARC, SAM, F2)
    return creds, ut, db, H


def ov_of(env, t):
    return env.read("credential_review_overlay.json")["overrides"].get(t) or {}


try:
    # ── the clean run ─────────────────────────────────────────────────────
    creds0, ut0, db, H = hvac_fixture()
    env = Env(creds0, ut0, db, related={"titles": [["Heating and Air Conditioning", 0, 1, 1, 0, [], [["ic", 1]]]]})
    env.nightly()   # the workflow's step 1 runs the nightly sync first; the apply's "before" is after it
    s0 = env.files()
    rows0 = copy.deepcopy(db.rows)
    failed = env.workflow(db)
    check("the clean run commits", failed is None, str(failed))
    env.nightly()
    c1 = env.read("credentials.json")
    check("rule 1: HVAC ends with the college system only", issuers(c1, H) == [CCC], str(issuers(c1, H)))
    check("rule 2: Brakes (ASE A5) ends with ASE only", issuers(c1, "Brakes (ASE A5)") == [ASE])
    check("no issuer row a person wrote was updated: the moved July ASE row is as stored",
          db.get(P + H, "issuing_agency_override")["value"] == ASE
          and db.get(P + H, "issuing_agency_override")["reviewer_email"] == MAP)
    res_row = db.get(P + H, "issuer_resolution")
    check("one resolution row on the target, under the cohort", res_row and res_row["reviewer_email"] == fi.COHORT
          and fi.parse_resolution(res_row["value"])["winner"] == CCC)
    wc = ov_of(env, "Welding Cert")
    check("still_open 0: the additional issuer set with the fold survives though its row was superseded",
          ARC in (wc.get("issuing_agency_additional_override") or "") and ARC in issuers(c1, "Welding Cert"),
          json.dumps(wc.get("issuing_agency_additional_override")) + " / " + str(issuers(c1, "Welding Cert")))
    check("still_open 1: the winner under another spelling is not kept as an additional, and no second record",
          "Chancellor" not in (wc.get("issuing_agency_additional_override") or "")
          and not any("Chancellor" in i for i in issuers(c1, "Welding Cert")), str(issuers(c1, "Welding Cert")))
    rdir = env.receipt()
    md = open(os.path.join(rdir, "validation.md"), encoding="utf-8").read()
    check("the receipt names the person-set row the fold reissued", "PERSON-SET record reissued" in md
          and MAP in md)

    # ── i1 / i2: a person's edit one second either side of decided_at ─────
    dec = "2026-11-11T16:00:00Z"
    res = {"rule": "reviewer", "winner": CCC, "dropped": [ASE], "kept_additional": [], "decided_at": dec,
           "fold_id": "f@x"}
    before = {"issuing_agency_override": "NATEF",
              "field_reviews": {"issuing_agency_override": {"by": SAM, "at": "2026-11-11T15:59:59Z"}}}
    e1 = fi.effective_issuer(before, res)
    check("i1: an edit one second before decided_at: the fold's winner stands",
          e1["issuing_agency_override"] == CCC and e1["issuer_fold"]["set_by_fold"])
    check("i1: and the person's row is named as superseded",
          e1["issuer_fold"]["superseded"] and e1["issuer_fold"]["superseded"][0]["value"] == "NATEF"
          and e1["issuer_fold"]["superseded"][0]["by"] == SAM)
    after = {"issuing_agency_override": "NATEF",
             "field_reviews": {"issuing_agency_override": {"by": SAM, "at": "2026-11-11T16:00:01Z"}}}
    e2 = fi.effective_issuer(after, res)
    check("i2: an edit one second after decided_at: the person wins",
          e2["issuing_agency_override"] == "NATEF" and not e2["issuer_fold"]["set_by_fold"])
    # i2 through the nightly: Sam saves NATEF on HVAC after the fold decided.
    decided = fi.parse_resolution(db.get(P + H, "issuer_resolution")["value"])["decided_at"]
    one_after = (fi.ts(decided) + __import__("datetime").timedelta(seconds=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    db.add(H, "issuing_agency_override", "NATEF", SAM, one_after)
    env.nightly()
    c2 = env.read("credentials.json")
    check("i2: through the nightly, the person's later issuer stands and is not struck",
          ov_of(env, H).get("issuing_agency_override") == "NATEF" and "NATEF" in issuers(c2, H), str(issuers(c2, H)))
    # Put things back for what follows: the stored row, and the record the person's issuer added.
    db.add(H, "issuing_agency_override", ASE, MAP, JUL)
    c = env.read("credentials.json")
    c[H] = [r for r in c[H] if r["issuing_agency"] != "NATEF"]
    env.write("credentials.json", c)
    env.nightly()

    # ── still_open 7: a re-appended dropped issuer is removed the next night ──
    c = env.read("credentials.json")
    c["Brakes (ASE A5)"].append(rec(CCC, MAP, JUL))
    c[H].append(rec(ASE))
    env.write("credentials.json", c)
    env.nightly()
    c3 = env.read("credentials.json")
    check("still_open 7: the nightly removes a dropped issuer a partial state left (rules 1 and 2)",
          issuers(c3, "Brakes (ASE A5)") == [ASE] and issuers(c3, H) == [CCC], str(issuers(c3, H)))

    # ── i6: apply, nightly, undo ──────────────────────────────────────────
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        try:
            code = undo.main([rdir, "--apply", "--supabase-plan"])
        except SystemExit as e:
            code = e.code
    check("i6: the undo after a nightly sees no drift (the enforcement's own additions are not drift)",
          code == 0, buf.getvalue()[-800:] + str(code))
    check("i6: the files are back", env.read("credentials.json") == json.loads(s0["credentials.json"])
          and env.read("unified_titles.json") == json.loads(s0["unified_titles.json"]))
    check("i6: undone.json voids the fold for the nightly", os.path.isfile(os.path.join(rdir, "undone.json")))
    # The undo ran the kb_curation half itself, first (round 3, items 6 and 7): the rows are back as they
    # were before the apply and the cohort's resolution rows are gone, so the browser agrees too.
    check("i6: the undo put kb_curation back as it was before the apply, the resolution rows first",
          db.rows == rows0 and db.rest_calls and db.rest_calls[0][0] == "DELETE"
          and "issuer_resolution" in db.rest_calls[0][1],
          json.dumps(sorted(set(db.rows) ^ set(rows0)))[:400] + " " + str(db.rest_calls[:2])[:300])
    env.nightly()
    check("i6: the next nightly leaves the restored files alone (the resolution is void)",
          env.read("credentials.json") == json.loads(s0["credentials.json"]),
          json.dumps({t: (env.read("credentials.json").get(t), v) for t, v in json.loads(s0["credentials.json"]).items()
                      if env.read("credentials.json").get(t) != v})[:600])
    sql = open(os.path.join(rdir, "undo_supabase.sql"), encoding="utf-8").read()
    stmts = [x for x in sql.splitlines() if x.startswith("do $$")]
    check("i6: the SQL deletes the fold's resolution rows by the cohort and their exact value",
          "delete from kb_curation where course_id = '%s%s' and field = 'issuer_resolution' and reviewer_email = '%s'"
          % (P, H, fi.COHORT) in sql)
    check("still_open 4: a moved row moves back only while value, reviewer and stamp still match",
          "set course_id = '%sAutomotive Air Conditioner' where course_id = '%s%s' and field = 'issuing_agency_override' "
          "and value = '%s' and reviewer_email = '%s' and reviewed_at = '%s'" % (P, P, H, ASE, MAP, JUL) in sql)
    check("still_open 5 (round 3 item 7): a guarded statement that matches nothing is reported and the rest run",
          stmts and all("get diagnostics n = row_count; if n = 0 then raise notice" in x for x in stmts)
          and len(stmts) == sum(1 for x in sql.splitlines() if x.strip() and not x.startswith(("--", "begin", "commit"))))
    env.close()

    # ── still_open 6: --force and the SQL plan skip the same groups ───────
    creds0, ut0, db, H = hvac_fixture()
    env = Env(creds0, ut0, db)
    env.workflow(db)
    rdir = env.receipt()
    c = env.read("credentials.json")
    c[H].append(rec("A hand edit"))
    env.write("credentials.json", c)
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir, "--apply", "--force", "--supabase-plan"])
    sql = open(os.path.join(rdir, "undo_supabase.sql"), encoding="utf-8").read()
    c6 = env.read("credentials.json")
    check("still_open 6: --force leaves the drifted group folded in the files",
          "Heating and Air Conditioning" not in c6 and "Brake Lab" in c6)
    check("still_open 6: and the SQL plan leaves the same group's rows and resolution alone",
          (P + H) not in sql and (P + "Automotive Air Conditioner") not in sql and (P + "Brake Lab") in sql)
    env.close()

    # ── i3: the resolution insert fails ───────────────────────────────────
    creds0, ut0, db, H = hvac_fixture()
    env = Env(creds0, ut0, db)
    db.fail_insert_for = {P + "Welding Cert"}
    failed = env.workflow(db)
    check("i3: a failed resolution insert stops the job at that step", failed == "resolution", str(failed))
    wf = open(os.path.join(ROOT, ".github/workflows/cred-rename-apply.yml"), encoding="utf-8").read()
    step = wf[wf.index("name: Write the fold's issuer resolutions"):]
    step = step[:step.index("- name:", 10)]
    check("i3: the workflow step has no continue-on-error and runs before the moves and the commit",
          "continue-on-error" not in step and wf.index("name: Write the fold's issuer resolutions")
          < wf.index("name: Apply Supabase kb_curation row migration") < wf.index("name: Commit + push"))
    check("i3: no row moved (the moves never ran)", db.get(P + "Brake Lab", "unified_title_override") is not None)

    # ── i4: the nightly between the failed apply and its retry ────────────
    # The runner's kb files and receipt are never committed: back to the repo as it was.
    shutil.rmtree(env.out, ignore_errors=True)
    env.write("credentials.json", creds0)
    env.write("unified_titles.json", ut0)
    env.write("coci_articulations.json", {"articulations": []})
    env.nightly()                       # the partial resolution rows are in force overnight
    db.fail_insert_for = set()
    failed = env.workflow(db)           # the retry
    env.nightly()
    ci = env.read("credentials.json")
    creds0b, ut0b, dbc, _ = hvac_fixture()
    clean = Env(creds0b, ut0b, dbc)
    clean.workflow(dbc)
    clean.nightly()
    cc = clean.read("credentials.json")
    check("i4: the retry commits", failed is None, str(failed))
    check("i4: the retry converges on the clean run's issuers, title by title",
          {t: issuers(ci, t) for t in ci} == {t: issuers(cc, t) for t in cc},
          json.dumps({t: issuers(ci, t) for t in ci}))
    check("i4: and on the same resolution rows (rule, winner, dropped)",
          {k: {x: fi.parse_resolution(v["value"])[x] for x in ("rule", "winner", "dropped")}
           for k, v in db.rows.items() if k[1] == "issuer_resolution"}
          == {k: {x: fi.parse_resolution(v["value"])[x] for x in ("rule", "winner", "dropped")}
              for k, v in dbc.rows.items() if k[1] == "issuer_resolution"})
    clean.close()

    # ── i5: a second fold onto the same target ────────────────────────────
    c = env.read("credentials.json")
    c["Brake Lab 2"] = [rec(CCC)]
    env.write("credentials.json", c)
    u = env.read("unified_titles.json")
    u["r9"] = {"unified_title": "Brake Lab 2"}
    env.write("unified_titles.json", u)
    db.add("Brake Lab 2", "unified_title_override", "Brakes (ASE A5)", SAM, "2026-11-12T10:00:00Z")
    db.add("Brake Lab 2", "unified_title_merge_confirm", "Brakes (ASE A5)", SAM, "2026-11-12T10:00:00Z")
    first = db.get(P + "Brakes (ASE A5)", "issuer_resolution")["value"]
    failed = env.workflow(db)
    log = json.load(open(os.path.join(env.receipt(), "resolution_log.json"), encoding="utf-8"))["log"]
    rep = [e for e in log if e["course_id"] == P + "Brakes (ASE A5)"]
    check("i5: the second fold replaces the cohort's own row, guarded, and logs the before-value",
          failed is None and rep and rep[0]["op"] == "replace" and rep[0]["before_row"]["value"] == first
          and db.get(P + "Brakes (ASE A5)", "issuer_resolution")["value"] != first, json.dumps(rep)[:300])
    db.rows[(P + "Brakes (ASE A5)", "issuer_resolution")]["reviewer_email"] = SAM
    env.db.wire()
    lg, nf = resw.write_rows([{"course_id": P + "Brakes (ASE A5)", "field": "issuer_resolution",
                               "value": {"fold_id": "other@x", "decided_at": "2026-11-13T00:00:00Z"}}], "2026-11-13T00:00:00Z")
    check("i5: a row under any other reviewer is never replaced; the write fails", nf == 1 and lg[0]["status"] == "fail")
    first_fid = fi.parse_resolution(first)["fold_id"]
    second = fi.parse_resolution(json.loads(json.dumps(rep[0]["after_row"]["value"])))
    check("r3 item 3: the replacing resolution names the one it carries forward",
          first_fid in (second.get("carried_from") or []), json.dumps(second)[:300])
    env.close()

    # ── Sam's ruling C: a fold into a declared family title is not a merge ──
    B = "ASE Certificate Bundles"
    creds_f = {"ASE Certificate Bundles": [rec(ASE)], "ASE Bundle — A4, A5": [rec(ASE)], "Brakes (ASE A5)": [rec(ASE)],
               "Brake Lab": [rec(CCC)], "ASE A2+A3 — combined": [rec(ASE)]}
    ut_f = {"b1": {"unified_title": "ASE Bundle — A4, A5"}, "b2": {"unified_title": "Brake Lab"},
            "b3": {"unified_title": "ASE A2+A3 — combined"}}
    dbf = DB()
    dbf.add("ASE Bundle — A4, A5", "unified_title_override", B, SAM, F2)
    dbf.add("ASE Bundle — A4, A5", "unified_title_merge_confirm", B, SAM, F2)
    dbf.add("ASE A2+A3 — combined", "unified_title_override", "ASE Certificate Bundles 2", SAM, F1)
    dbf.add("Brake Lab", "unified_title_override", "Brakes (ASE A5)", SAM, F2)
    dbf.add("Brake Lab", "unified_title_merge_confirm", "Brakes (ASE A5)", SAM, F2)
    envf = Env(creds_f, ut_f, dbf)
    envf.write(os.path.join(envf.dir, "credential_families.json"), {"families": [{"title": B}, "ASE Certificate Bundles 2"]})
    failed = envf.workflow(dbf)
    am = json.load(open(app.ALIAS_PATH, encoding="utf-8"))
    cf = envf.read("credentials.json")
    rep_f = open(os.path.join(envf.dry, "report.md"), encoding="utf-8").read()
    md_f = open(os.path.join(envf.receipt(), "validation.md"), encoding="utf-8").read()
    check("family: a confirmed merge into a family title is held, never folded",
          failed is None and "ASE Bundle — A4, A5" in cf and "ASE Bundle — A4, A5" not in am["merges"]
          and any(h["old"] == "ASE Bundle — A4, A5" and h["kind"] == "merge" for h in am["held_family"]))
    check("family: a rename onto a family title is held too", "ASE A2+A3 — combined" in cf
          and "ASE A2+A3 — combined" not in am["renames"])
    check("family: the plain line, in the dry-run report and the apply receipt",
          fi.FAMILY_HELD_LINE in rep_f and fi.FAMILY_HELD_LINE in md_f and fi.FAMILY_HELD_LINE
          == "held: the target is a family title; these rows become family tags")
    check("family: the rows stay in kb_curation for the family-tag converter",
          dbf.get(P + "ASE Bundle — A4, A5", "unified_title_merge_confirm") is not None)
    check("family: the rest of the batch folds as before", "Brake Lab" not in cf and issuers(cf, "Brakes (ASE A5)") == [ASE])
    check("family: no resolution row on a family title", dbf.get(P + B, "issuer_resolution") is None)
    am["merges"]["ASE Bundle — A4, A5"] = B  # a stale map that slipped past the dry-run
    json.dump(am, open(app.ALIAS_PATH, "w", encoding="utf-8"))
    with contextlib.redirect_stdout(io.StringIO()):
        app.main()
    check("family: the apply holds it even when the alias map names it", "ASE Bundle — A4, A5" in envf.read("credentials.json"))
    check("family: an absent file means no families", fi.family_titles(os.path.join(envf.dir, "missing.json")) == set())
    envf.close()

    # ══ Round 3 (S638, 2026-11-11): the third review's confirmed findings ══════════════════════════════
    # item 2: a resolution row is inert until its fold's receipt is committed.
    gate = tempfile.mkdtemp(prefix="fold_gate_")
    try:
        r_orphan = {"rule": "reviewer", "winner": AWS, "dropped": [CCC], "kept_additional": [],
                    "decided_at": "2026-11-11T16:00:00Z", "fold_id": "2026-11-11@2026-11-11T16:05:00Z"}
        entry = {"issuing_agency_override": CCC, "issuer_resolution": json.dumps(r_orphan),
                 "field_reviews": {"issuing_agency_override": {"by": MAP, "at": JUL}}}
        ovs = {"T": dict(entry)}
        check("r3 item 2: a resolution whose fold has no committed receipt is inert",
              acr.apply_resolutions(ovs, gate) == {} and ovs["T"].get("issuing_agency_override") == CCC, json.dumps(ovs)[:300])
        os.makedirs(os.path.join(gate, "2026-11-11"))
        json.dump({"fold_id": r_orphan["fold_id"]}, open(os.path.join(gate, "2026-11-11", "undo.json"), "w"))
        ovs = {"T": dict(entry)}
        check("r3 item 2: the same row stands once the receipt names its fold",
              "T" in acr.apply_resolutions(ovs, gate) and ovs["T"].get("issuing_agency_override") == AWS)
        json.dump({}, open(os.path.join(gate, "2026-11-11", fi.APPLY_FAILED), "w"))
        ovs = {"T": dict(entry)}
        check("r3 item 2: a receipt marked apply_failed.json does not make it stand",
              acr.apply_resolutions(ovs, gate) == {})
    finally:
        shutil.rmtree(gate, ignore_errors=True)
    # item 2: the failure step takes back the rows a partial step 3b wrote, and marks the receipt.
    creds0, ut0, db, H = hvac_fixture()
    env = Env(creds0, ut0, db)
    db.fail_insert_for = {P + "Welding Cert"}
    failed = env.workflow(db)
    rdir = env.receipt()
    wrote = [k for k, v in db.rows.items() if k[1] == "issuer_resolution"]
    with contextlib.redirect_stdout(io.StringIO()):
        resw.main(["--rollback", rdir])
    check("r3 item 2: a partial step 3b left rows, and --rollback takes every one back",
          failed == "resolution" and wrote and not [k for k in db.rows if k[1] == "issuer_resolution"], str(wrote))
    check("r3 item 2: the receipt is marked apply_failed.json, and its fold never counts as applied",
          os.path.isfile(os.path.join(rdir, fi.APPLY_FAILED)) and not fi.applied_fold_ids(env.out)
          and os.path.isfile(os.path.join(rdir, "resolution_rollback_log.json")))
    env.close()
    wf = open(os.path.join(ROOT, ".github/workflows/cred-rename-apply.yml"), encoding="utf-8").read()
    fstep = wf[wf.index("name: Take back the resolutions and commit the receipt"):]
    check("r3 item 2: the workflow's failure step rolls back and commits the receipt alone, never after the kb files land",
          "if: failure() && steps.json.outputs.receipt != '' && steps.commit.outcome != 'success'" in fstep
          and "--rollback" in fstep and 'git add "$RECEIPT"' in fstep and "git reset --hard origin/main" in fstep)
    rb = wf[wf.index("name: Rebuild the files derived from the credential keys"):]
    check("r3 item 2: a crash rebuilding the derived files no longer keeps the receipt off main",
          "continue-on-error: true" in rb[:rb.index("run:")])

    # item 3: a second fold onto the same target keeps what the first struck (the reviewer's scenario).
    T = "Engine Repair (ASE A1)"
    r1 = {"v": 1, "target": T, "rule": "reviewer", "winner": AWS, "dropped": [CCC], "kept_additional": [],
          "decided_at": "2026-11-11T16:00:00Z", "fold_id": "f1"}
    t_entry = {"issuing_agency_override": CCC,
               "field_reviews": {"issuing_agency_override": {"by": "ashley@rccd.edu", "at": "2026-07-01T00:00:00Z"}}}
    g2 = {"resolution": {"target": T, "rule": "additive", "winner": None, "additional": []}}
    r2_old = fi.resolution_value(g2, [rec(AWS), rec("NCCER")], [rec(AWS), rec("NCCER")], "2026-11-12T00:00:00Z", "f2")
    check("r3 item 3 (before): without the earlier resolution, Ashley's struck row comes back",
          fi.effective_issuer(t_entry, r2_old).get("issuing_agency_override") == CCC)
    r2 = fi.resolution_value(g2, [rec(AWS), rec("NCCER")], [rec(AWS), rec("NCCER")], "2026-11-12T00:00:00Z", "f2",
                             [r1], [t_entry])
    e2 = fi.effective_issuer(t_entry, r2)
    check("r3 item 3: the second fold carries the first's dropped issuer and winner forward",
          CCC in r2["dropped"] and r2["winner"] == AWS and r2["carried_from"] == ["f1"]
          and e2.get("issuing_agency_override") == AWS, json.dumps(r2))
    readded = dict(t_entry, field_reviews={"issuing_agency_override": {"by": SAM, "at": "2026-11-11T17:00:00Z"}})
    r2b = fi.resolution_value(g2, [rec(AWS)], [rec(AWS)], "2026-11-12T00:00:00Z", "f2", [r1], [readded])
    check("r3 item 3: an issuer a person saved after the first fold is not carried as dropped",
          CCC not in r2b["dropped"] and r2b["winner"] is None, json.dumps(r2b))

    # item 5: decided_at is the latest reviewed_at among the rows read, and the receipt lists both times.
    creds0, ut0, db, H = hvac_fixture()
    env = Env(creds0, ut0, db)
    env.workflow(db)
    latest = max((r["reviewed_at"] for r in copy.deepcopy(hvac_fixture()[2].rows).values()), key=fi.ts)
    v = fi.parse_resolution(db.get(P + H, "issuer_resolution")["value"])
    md = open(os.path.join(env.receipt(), "validation.md"), encoding="utf-8").read()
    check("r3 item 5: decided_at is the rows' latest reviewed_at, not the runner's clock",
          v["decided_at"] == latest and v.get("read_at") and v["read_at"] != latest, json.dumps(v)[:300])
    check("r3 item 5: the receipt names both times", latest in md and v["read_at"] in md)

    # items 6 and 7: the undo runs kb_curation first; a person's later edit is left and reported; a rerun
    # finishes; a network error stops before the files.
    env.nightly()
    rdir = env.receipt()
    mv = db.rows[(P + H, "issuing_agency_override")]
    mv["value"], mv["reviewed_at"] = "A person's later pick", "2026-11-12T09:00:00Z"
    files_folded = env.files()
    real_rest = db.rest

    def down(*a, **k):
        raise RuntimeError("HTTP Error 503")
    undo.rest = down
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        try:
            code = undo.main([rdir, "--apply"])
        except SystemExit as e:
            code = e.code
    check("r3 item 7: kb_curation unreachable: the undo stops before writing a file",
          code and env.files()["credentials.json"] == files_folded["credentials.json"], str(code)[:200])
    undo.rest = real_rest
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        try:
            code = undo.main([rdir, "--apply"])
        except SystemExit as e:
            code = e.code
    out = buf.getvalue()
    check("r3 item 6: the undo deletes the fold's resolution rows, so every reader (the browser too) drops the fold",
          not [k for k in db.rows if k[1] == "issuer_resolution"], str([k for k in db.rows if k[1] == "issuer_resolution"]))
    check("r3 item 7: a row a person changed after the apply is left as they made it and reported, not a stop",
          code in (0, None) and db.get(P + H, "issuing_agency_override")["value"] == "A person's later pick"
          and "LEFT " + P + H in out, out[-600:])
    check("r3 item 7: the other moved rows went back", db.get(P + "Brake Lab", "unified_title_override") is not None)
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        try:
            code = undo.main([rdir, "--apply"])
        except SystemExit as e:
            code = e.code
    check("r3 item 7: a rerun finishes cleanly (what is back reads as already)", code in (0, None)
          and "already" in buf.getvalue(), buf.getvalue()[-400:])
    env.close()

    # item 8: a lead rename whose title already holds a resolution row (an earlier fold onto it).
    L, NT = "Lead Old Title", "New Common Title"
    db = DB()
    db.add(L, "issuer_resolution", json.dumps({"decided_at": "2026-11-01T00:00:00Z", "fold_id": "old@x"}),
           fi.COHORT, "2026-11-01T00:00:00Z")
    db.add(L, "unified_title_override", NT, SAM, F1)
    db.add("Sibling", "unified_title_override", NT, SAM, F2)
    db.add("Sibling", "unified_title_merge_confirm", NT, SAM, F2)
    env = Env({L: [rec(AWS)], "Sibling": [rec(AWS)]}, {"a": {"unified_title": L}, "b": {"unified_title": "Sibling"}}, db)
    failed = env.workflow(db)
    slog = json.load(open(os.path.join(env.receipt(), "supabase_log.json"), encoding="utf-8"))
    bad = [e for e in slog["log"] if e.get("status") not in ("ok", None) and e.get("op") != "skip"]
    check("r3 item 8: the lead's old resolution row is superseded, not PATCHed into a 409",
          failed is None and not bad and db.get(P + L, "issuer_resolution") is None
          and db.get(P + NT, "issuer_resolution") is not None, json.dumps(bad)[:400])
    env.close()

    # item 9: a title saved into a declared family title is held, with or without a merge confirm, and
    # never becomes the twin group's lead (a clean rename minting the family name).
    FAM = "ASE Certificate Bundles"
    db = DB()
    held_titles = ["ASE Certification (any A1–A8)", "ASE A2+A3", "ASE Master Auto", "ASE Master Truck",
                   "ASE Master Collision", "Advanced Electrical and Electronic Systems"]
    for t in held_titles:
        db.add(t, "unified_title_override", FAM, SAM, F1)
    db.add("ASE Master Auto", "unified_title_merge_confirm", FAM, SAM, F1)
    env = Env({t: [rec(ASE)] for t in held_titles}, {str(i): {"unified_title": t} for i, t in enumerate(held_titles)}, db)
    json.dump({"families": [FAM]}, open(dry.FAMILIES, "w"))
    env.nightly()
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    am = json.load(open(os.path.join(env.dry, "alias_map.json"), encoding="utf-8"))
    coll = json.load(open(os.path.join(env.dry, "collisions.json"), encoding="utf-8"))
    coll = coll if isinstance(coll, list) else (coll.get("collisions") or [])
    check("r3 item 9: no rename or merge into the family title, and no collision a curator could confirm",
          FAM not in (am.get("renames") or {}).values() and FAM not in (am.get("merges") or {}).values()
          and not [c for c in coll if c.get("proposed_new_title") == FAM], json.dumps(am.get("renames"))[:300])
    check("r3 item 9: all six are held as family tags", sorted(h["old"] for h in am.get("held_family") or [])
          == sorted(held_titles), json.dumps(am.get("held_family"))[:300])
    env.close()

    # ── the resolver's spelling and duplicate rules ───────────────────────
    e = fi.effective_issuer({"issuing_agency_additional_override": "ccc | American Welding Society (AWS) | AWS",
                             "field_reviews": {"issuing_agency_additional_override": {"by": MAP, "at": JUL}}},
                            {"rule": "reviewer", "winner": "California Community College Chancellor's Office",
                             "dropped": [], "kept_additional": [], "decided_at": "2026-11-11T16:00:00Z"})
    check("resolver: the winner in the reference spelling, never also an additional",
          e["issuing_agency_override"] == CCC and "ccc" not in e["issuing_agency_additional_override"].lower().split(" | "))
    recs, _ = fi.enforce_records([rec("California Community College Chancellor's Office"), rec(CCC), rec(ASE)],
                                 {"winner": CCC, "dropped": [ASE], "decided_at": "x"}, {})
    check("enforce: one record per issuer in the reference spelling, the dropped one gone",
          [r["issuing_agency"] for r in recs] == [CCC])
except Exception:
    import traceback
    traceback.print_exc()
    check("the test ran to the end", False)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "  -- " + why))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
