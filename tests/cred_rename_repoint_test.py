#!/usr/bin/env python3
"""The credential rename re-points the saved assignments it leaves on a retired title, holds a person's, counts the old
titles left under kb/, and starts the dashboard after a committed apply (#3110, COBIx comments 6813000047 and
6813256997, after the 2026-11-12 apply left "ASE Bundle — A4, A5" saved).

The failure modes, each run through the REAL dry run, apply and undo (kb/_cred_rename_dryrun.py, _cred_rename_apply.py,
_cred_rename_undo.py, _cred_rename_repoint.py) over a scratch kb/ tree:
  1. a rename leaves a bot-saved assignment on the old title: after the apply's file step it names the new title in
     every saved file (the assignments, the classifier's cache, the occupation map, MAP's by_title), the receipt lists
     each change filed from a fresh read, and the undo puts each back; one changed since is drift the undo refuses;
  2. a person's row is held, unchanged, and listed in held_person_rows; the dry run previews the same changes and holds;
  3. the old-title count finds a planted old title, skips the receipt, dated and alias folders, keeps a person's fold
     into a family title, reads 0 on a clean tree, and the dry run's prediction equals the count after the apply;
  4. the kb_curation half PATCHes a bot row only, files a lost response as landed from a fresh read, and the undo
     reverses it;
  5. the workflow dispatches daily-dashboard.yml only after a committed apply, the dashboard's gate runs a
     workflow_dispatch, and the old-title check is the job's last step.

No network. Run from the repo root: python3 tests/cred_rename_repoint_test.py
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_repoint as rp  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


OLD, NEW = "Widget Bundle — A, B", "Widget Certificate Bundles: A + B"
RAW, BOT_RAW, PERSON_RAW = "Widget A and B", "Widget A + B (saved)", "Widget AB (a person's)"
BOT, PERSON, SAM = "cer-procedure-classifier@bot", "map@rccd.edu", "slee@cccco.edu"
FAMILY = "Widget Certificate Bundles"


def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def tree(root, person=True):
    kb = os.path.join(root, "kb")
    write(os.path.join(kb, "credentials.json"), {OLD: [{"issuing_agency": "Widget Board"}],
                                                 "Other": [{"issuing_agency": "Other Board"}]})
    write(os.path.join(kb, "unified_titles.json"), {RAW: {"unified_title": OLD, "reviewed_by": BOT}})
    write(os.path.join(kb, "coci_articulations.json"), {"articulations": [
        {"course_id": "C1", "exhibit_id": "E1", "exhibit_title": RAW, "unified_title": OLD}]})
    assignments = {BOT_RAW: {"unified_title": OLD, "reviewed_by": BOT, "reviewed_at": "2026-10-31T14:01:01+00:00"}}
    if person:
        assignments[PERSON_RAW] = {"unified_title": OLD, "reviewed_by": PERSON, "reviewed_at": "2026-06-02T18:00:00+00:00"}
    write(os.path.join(kb, "unclassified_assignments.json"), {"assignments": assignments, "sweep_kept": {}})
    write(os.path.join(kb, "cer_classified.json"), {"records": {BOT_RAW: {"raw_title": BOT_RAW, "unified_title": OLD}}})
    write(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"),
          {"by_title": {OLD: ["X1"], "Other": ["X2"]}})
    write(os.path.join(kb, "occupation_credential_map.json"), {"occupations": {"widget tech": {
        "credentials": [{"title": OLD, "tier": "D"}], "curated_by": "skywalker-s120@bot", "curated_at": "2026-08-05"}}})
    write(os.path.join(kb, "credential_review_overlay.json"), {"_read_at": "2026-11-12T00:00:00Z", "overrides": {
        OLD: {"unified_title_override": NEW, "reviewed_by": SAM, "reviewed_at": "2026-11-11T15:00:00+00:00",
              "field_reviews": {"unified_title_override": {"by": SAM, "at": "2026-11-11T15:00:00+00:00"}}}}})
    write(os.path.join(kb, "exhibits_related.json"), {"titles": []})
    return kb


real = {m: {k: getattr(m, k) for k in dir(m) if k.isupper()} for m in (dry, app, undo, rp)}


def restore():
    for m, d in real.items():
        for k, v in d.items():
            setattr(m, k, v)


def point(kb):
    for m in (dry, app, undo):
        m.CREDENTIALS = os.path.join(kb, "credentials.json")
        m.UNIFIED_TITLES = os.path.join(kb, "unified_titles.json")
        m.ARTICULATIONS = os.path.join(kb, "coci_articulations.json")
    dry.OVERLAY = app.OVERLAY = os.path.join(kb, "credential_review_overlay.json")
    dry.RELATED = app.RELATED = os.path.join(kb, "exhibits_related.json")
    dry.FAMILIES = app.FAMILIES = os.path.join(kb, "reference", "credential_families.json")
    dry.PLANS_DIR = app.PLANS_DIR = os.path.join(kb, "cred_rename_plans")
    dry.OUT_DIR = app.DRYRUN_OUT = os.path.join(kb, "cred_rename_dryrun")
    app.ALIAS_PATH = os.path.join(dry.OUT_DIR, "alias_map.json")
    app.OUT_ROOT = os.path.join(kb, "cred_rename_out")
    undo.KEY = None


def quiet(fn, *a):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*a)


tmp = tempfile.mkdtemp(prefix="repoint_")
try:
    # ── 1 and 2: the apply re-points a bot's saved rows and holds a person's ────────────────────────────────────
    root = os.path.join(tmp, "a")
    kb = tree(root)
    point(kb)
    quiet(dry.main)
    am = read(os.path.join(dry.OUT_DIR, "alias_map.json"))
    check("dry run: the rename is planned", am["renames"] == {OLD: NEW}, am.get("renames"))
    prev = am.get("repoint_preview") or {}
    check("dry run: previews the four bot re-points", sorted(c["file"] for c in prev.get("changes") or []) == sorted([
        "kb/unclassified_assignments.json", "kb/cer_classified.json", "kb/reference/map_cpl_opportunities_verified.json",
        "kb/occupation_credential_map.json"]), prev.get("changes"))
    check("dry run: previews the person's row as held",
          [h["key"] for h in prev.get("held_person_rows") or []] == [PERSON_RAW], prev.get("held_person_rows"))
    predicted = am.get("would_leave_old_titles") or {}
    check("dry run: predicts one old title left (the person's held row)",
          predicted.get("count") == 1 and PERSON_RAW in predicted["locations"][0]["location"], predicted)

    quiet(app.main)
    ua = read(os.path.join(kb, "unclassified_assignments.json"))["assignments"]
    check("apply: the bot-saved assignment points at the new title", ua[BOT_RAW]["unified_title"] == NEW, ua[BOT_RAW])
    check("apply: the bot's reviewer and save time stay as they were",
          ua[BOT_RAW]["reviewed_by"] == BOT and ua[BOT_RAW]["reviewed_at"] == "2026-10-31T14:01:01+00:00")
    check("apply: the person's row is unchanged", ua[PERSON_RAW]["unified_title"] == OLD, ua[PERSON_RAW])
    check("apply: the classifier's cache names the new title",
          read(os.path.join(kb, "cer_classified.json"))["records"][BOT_RAW]["unified_title"] == NEW)
    bt = read(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"))["by_title"]
    check("apply: MAP's by_title moves the ids to the new title", bt == {NEW: ["X1"], "Other": ["X2"]}, bt)
    occ = read(os.path.join(kb, "occupation_credential_map.json"))["occupations"]["widget tech"]["credentials"]
    check("apply: the bot-curated occupation ruling names the new title", occ[0]["title"] == NEW, occ)
    receipt = os.path.join(kb, "cred_rename_out", sorted(os.listdir(os.path.join(kb, "cred_rename_out")))[0])
    rc = read(os.path.join(receipt, "repoint.json"))
    check("receipt: lists each planned change, each filed landed from a fresh read",
          len(rc["planned"]) == 4 and all(c["filed"] == "landed" for c in rc["filed"]), rc["filed"])
    check("receipt: names the bot row with its before and after",
          any(c["file"] == "kb/unclassified_assignments.json" and c["key"] == BOT_RAW and c["before"] == OLD
              and c["after"] == NEW and c["reviewer"] == BOT for c in rc["planned"]))
    check("receipt: held_person_rows lists the person's row, unchanged",
          [(h["key"], h["reviewer"], h["before"]) for h in rc["held_person_rows"]] == [(PERSON_RAW, PERSON, OLD)])

    # ── 3: the count ────────────────────────────────────────────────────────────────────────────────────────────
    # The workflow re-reads the overlay after the row move, which deletes the fulfilled override; do the same here.
    write(os.path.join(kb, "credential_review_overlay.json"), {"overrides": {}})
    left = rp.old_titles_left({OLD: NEW}, {}, root)
    check("count: after the apply, the person's held row is the one old title left",
          left["count"] == 1 and left["locations"][0]["location"]
          == "kb/unclassified_assignments.json:/assignments/%s/unified_title" % PERSON_RAW, left["locations"])
    check("count: the dry run's prediction equals the count after the apply", predicted.get("count") == left["count"]
          and [x["location"] for x in predicted["locations"]] == [x["location"] for x in left["locations"]])
    write(os.path.join(kb, "planted.json"), {"note": {"title": OLD}})
    write(os.path.join(kb, "somewhere", "2026-11-12", "report.json"), {"t": OLD})
    write(os.path.join(kb, "cer_procedures_out", "saved", "saved_x.json"), {"t": OLD})
    write(os.path.join(kb, "exhibits_related.json"), {"titles": [[NEW, 0, 1, 0, 0, [OLD], []]]})
    write(os.path.join(kb, "reference", "credential_families.json"), [FAMILY])
    write(os.path.join(kb, "credential_review_overlay.json"), {"overrides": {OLD: {
        "unified_title_override": FAMILY, "field_reviews": {"unified_title_override": {"by": SAM, "at": "x"}}}}})
    left = rp.old_titles_left({OLD: NEW}, {}, root)
    locs = [x["location"] for x in left["locations"]]
    check("count: finds a planted old title by its location", "kb/planted.json:/note/title" in locs, locs)
    check("count: skips the receipt, dated and saved/ folders and the alias slot", left["count"] == 2
          and left["alias_entries_skipped"] == 1 and not any("2026-11-12" in x or "saved" in x or "related" in x
                                                              for x in locs), locs)
    check("count: a person's fold into a family title is kept, not left",
          [k["location"] for k in left["kept"]] == ["kb/credential_review_overlay.json:/overrides/%s" % OLD], left)
    # A planted old title written with escaped characters (ensure_ascii) is found too.
    with open(os.path.join(kb, "ascii.json"), "w", encoding="utf-8") as f:
        json.dump({"t": OLD}, f, ensure_ascii=True)
    check("count: finds an old title written with ASCII escapes",
          "kb/ascii.json:/t" in [x["location"] for x in rp.old_titles_left({OLD: NEW}, {}, root)["locations"]])

    clean = os.path.join(tmp, "clean")
    kbc = tree(clean, person=False)
    point(kbc)
    quiet(dry.main)
    quiet(app.main)
    write(os.path.join(kbc, "credential_review_overlay.json"), {"overrides": {}})
    rcpt = os.path.join(kbc, "cred_rename_out", sorted(os.listdir(os.path.join(kbc, "cred_rename_out")))[0])
    check("count: reads 0 on a clean tree", rp.old_titles_left({OLD: NEW}, {}, clean)["count"] == 0)
    code = quiet(rp.main, ["--count", rcpt, "--root", clean])
    code2 = quiet(rp.main, ["--count", rcpt, "--check"])
    check("count: --count writes the receipt and --check passes at 0",
          code == 0 and code2 == 0 and read(os.path.join(rcpt, "old_titles_left.json"))["count"] == 0)
    write(os.path.join(kbc, "planted.json"), {"t": OLD})
    quiet(rp.main, ["--count", rcpt, "--root", clean])
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code3 = rp.main(["--count", rcpt, "--check"])
    check("count: --check exits 1 above 0 and names the location",
          code3 == 1 and "kb/planted.json:/t" in out.getvalue(), out.getvalue())

    # ── 1 (cont.): the undo puts every re-point back, and refuses one changed since ─────────────────────────────
    point(kb)
    write(os.path.join(kb, "credential_review_overlay.json"), {"overrides": {}})
    quiet(undo.main, [receipt, "--apply", "--json-only"])
    ua = read(os.path.join(kb, "unclassified_assignments.json"))["assignments"]
    check("undo: the bot's assignment is back on the old title", ua[BOT_RAW]["unified_title"] == OLD, ua[BOT_RAW])
    check("undo: the person's row is still as they saved it", ua[PERSON_RAW]["unified_title"] == OLD)
    check("undo: the cache, by_title and the occupation ruling are back",
          read(os.path.join(kb, "cer_classified.json"))["records"][BOT_RAW]["unified_title"] == OLD
          and read(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"))["by_title"]
          == {OLD: ["X1"], "Other": ["X2"]}
          and read(os.path.join(kb, "occupation_credential_map.json"))["occupations"]["widget tech"]["credentials"][0][
              "title"] == OLD)
    check("undo: the credential key is back", OLD in read(os.path.join(kb, "credentials.json")))

    point(kbc)
    p = os.path.join(kbc, "unclassified_assignments.json")
    d = read(p)
    d["assignments"][BOT_RAW]["unified_title"] = "Something a later run saved"
    write(p, d)
    try:
        quiet(undo.main, [rcpt, "--apply", "--json-only"])
        refused = False
    except SystemExit:
        refused = True
    check("undo: a re-pointed value changed since is drift, and nothing is written",
          refused and OLD not in read(os.path.join(kbc, "credentials.json")))
    quiet(undo.main, [rcpt, "--apply", "--json-only", "--force"])
    check("undo --force: the drifted value's fold group stays whole as it is",
          read(p)["assignments"][BOT_RAW]["unified_title"] == "Something a later run saved"
          and NEW in read(os.path.join(kbc, "credentials.json"))
          and read(os.path.join(kbc, "cer_classified.json"))["records"][BOT_RAW]["unified_title"] == NEW)

    # ── 4: the kb_curation half ─────────────────────────────────────────────────────────────────────────────────
    rows = {(rp.UNCLASS + BOT_RAW, rp.UNCLASS_FIELD): {"value": OLD, "reviewer_email": BOT,
                                                       "reviewed_at": "2026-10-31T14:01:01+00:00",
                                                       "validated_at": None, "validated_by": None}}
    import urllib.parse

    def fake(method, path, body=None, lose=False):
        q = dict(urllib.parse.parse_qsl(path.split("?", 1)[1]))
        key = (q["course_id"][3:], q["field"][3:])
        r = rows.get(key)
        if method == "GET":
            return [dict(r, course_id=key[0], field=key[1])] if r else []
        ok = r and all(r.get(k) == q[k][3:] for k in ("value", "reviewer_email", "reviewed_at") if k in q)
        if method == "PATCH" and ok:
            r.update(body)
            if fake.lose:
                raise OSError("response lost")
            return [dict(r)]
        return []
    fake.lose = True
    point(kbc)
    undo_rest = undo.rest
    rp.rest = fake
    sup_receipt = os.path.join(tmp, "sup")
    os.makedirs(sup_receipt)
    write(os.path.join(sup_receipt, "repoint.json"), {"planned": [
        {"file": "kb/unclassified_assignments.json", "kind": "value", "key": BOT_RAW, "field": "unified_title",
         "before": OLD, "after": NEW, "reviewer": BOT}]})
    _, ops = rp.run_supabase(sup_receipt)
    check("kb_curation: a bot row's value moves, filed landed from a fresh read though its response was lost",
          rows[(rp.UNCLASS + BOT_RAW, rp.UNCLASS_FIELD)]["value"] == NEW and ops[0]["filed"] == "landed"
          and ops[0]["status"] == "ok" and ops[0]["before_row"]["reviewer_email"] == BOT, ops)
    rows[(rp.UNCLASS + PERSON_RAW, rp.UNCLASS_FIELD)] = {"value": OLD, "reviewer_email": PERSON, "reviewed_at": "t"}
    sup2 = os.path.join(tmp, "sup2")
    os.makedirs(sup2)
    write(os.path.join(sup2, "repoint.json"), {"planned": [
        {"file": "kb/unclassified_assignments.json", "kind": "value", "key": PERSON_RAW, "field": "unified_title",
         "before": OLD, "after": NEW, "reviewer": BOT}]})
    fake.lose = False
    _, ops2 = rp.run_supabase(sup2)
    check("kb_curation: a row a person saved is left, never written",
          ops2[0]["status"] == "left" and rows[(rp.UNCLASS + PERSON_RAW, rp.UNCLASS_FIELD)]["value"] == OLD, ops2)
    back = rp.supabase_undo_ops(sup_receipt)
    undo.rest = fake
    res = [undo.run_op(o) for o in back]
    check("kb_curation undo: the re-pointed row goes back to the old title",
          len(back) == 1 and res[0]["status"] == "ok"
          and rows[(rp.UNCLASS + BOT_RAW, rp.UNCLASS_FIELD)]["value"] == OLD, res)
    check("kb_curation undo: the SQL plan carries the same guarded reversal",
          "update kb_curation set value = " in undo.supabase_plan([], (), (), None, back)[0])
    undo.rest = undo_rest
finally:
    restore()
    shutil.rmtree(tmp, ignore_errors=True)

# ── 5: the workflow ─────────────────────────────────────────────────────────────────────────────────────────────
wf = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8"))
job = wf["jobs"]["apply"]
steps = job["steps"]
names = [s.get("name") for s in steps]
commit_i = names.index("Commit + push")
disp = [i for i, s in enumerate(steps) if "gh workflow run daily-dashboard.yml --ref main" in (s.get("run") or "")]
check("workflow: one step dispatches daily-dashboard.yml on main", len(disp) == 1, names)
d = steps[disp[0]] if disp else {}
check("workflow: the dispatch comes after the commit and runs only when the commit was pushed",
      disp and disp[0] > commit_i and "steps.commit.outputs.pushed == 'true'" in str(d.get("if")), d.get("if"))
crun = steps[commit_i]["run"]
check("workflow: the commit step sets pushed only after a push succeeded, never on a no-op",
      crun.index('echo "pushed=true"') > crun.index("if git push origin HEAD:main; then")
      and crun.index('echo "pushed=true"') > crun.index("No changes to commit"))
check("workflow: the job may dispatch (actions: write) with GITHUB_TOKEN",
      job["permissions"].get("actions") == "write" and "GITHUB_TOKEN" in str(d.get("env")))
check("workflow: the dispatch stands down when a run in the group is pending (a new one would cancel it)",
      "group: daily-dashboard" in d.get("run", "") and "pending" in d.get("run", ""))
check("workflow: the old-title check is the job's last step and reads the committed receipt",
      "--count" in (steps[-1].get("run") or "") and "--check" in steps[-1]["run"]
      and "steps.commit.outputs.pushed == 'true'" in str(steps[-1].get("if")))
check("workflow: the count runs before the commit, and the commit carries the re-pointed files",
      names.index("Count the old titles left under kb/") < commit_i
      and all(f in crun for f in ("kb/unclassified_assignments.json", "kb/cer_classified.json",
                                  "kb/occupation_credential_map.json",
                                  "kb/reference/map_cpl_opportunities_verified.json", "kb/exhibits_related.json")))
check("workflow: the apply and the dashboard share one concurrency group that never cancels a running job",
      wf["concurrency"] == {"group": "daily-dashboard", "cancel-in-progress": False})
dash = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8"))
gate = dash["jobs"]["gate"]["steps"][0]["run"]
check("dashboard: the gate runs every non-scheduled event, so the dispatched run is never skipped",
      'if [ "$EVENT" != "schedule" ]; then echo "run=true"' in gate
      and dash["concurrency"] == {"group": "daily-dashboard", "cancel-in-progress": False}
      and dash["jobs"]["update-dashboard"]["if"] == "needs.gate.outputs.run == 'true'")
check("dashboard: it can be dispatched", "workflow_dispatch" in (dash.get(True) or dash.get("on") or {}))

for name, ok, why in CHECKS:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "  -- %s" % str(why)[:400]))
n = sum(ok for _, ok, _ in CHECKS)
print("%d/%d passed" % (n, len(CHECKS)))
sys.exit(0 if n == len(CHECKS) else 1)
