"""Where the credential family meets the fold (#3116 merged into #3117, S638).

  1. With kb/reference/credential_families.json present, the rename dry-run over the committed overlay holds the
     saved folds into "ASE Certificate Bundles" as family tags and folds only "standards" merges;
     with no family file it would fold them, so the file is what holds them.
  2. A member renamed by the rename batch (to its family form, "ASE Certificate Bundles: A4 + A5") keeps its
     family: the Supabase row move carries the credential_family row to the new key, the credentials.json re-key
     carries the record's `family`, and the nightly sync keeps it on the new title.

Run from the repo root: python3 tests/credential_family_fold_contact_test.py
"""
import contextlib
import glob
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _apply_credential_review as acr  # noqa: E402
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402
import ruled_renames  # noqa: E402

CHECKS = []
FAM = "ASE Certificate Bundles"


def check(name, cond):
    CHECKS.append((name, bool(cond)))


def dryrun(tmp, families, plans=None):
    dry.OUT_DIR, dry.FAMILIES = os.path.join(tmp, "dry"), families
    dry.PLANS_DIR = plans or os.path.join(tmp, "no_plans")
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    return json.load(open(os.path.join(dry.OUT_DIR, "alias_map.json"), encoding="utf-8"))


PRE_FILES = ("credentials.json", "unified_titles.json", "coci_articulations.json")


def pre_apply(into, plan_olds):
    """The three kb files as they stood before Sheet 181's plan was applied: copies of the committed files with every
    applied rename snapshot that carried a plan entry undone over them (the 2026-11-12 apply, da9f2f90, ran it live).
    Before an apply the copies are the committed files as they are."""
    os.makedirs(into)
    for n in PRE_FILES:
        shutil.copy(os.path.join(ROOT, "kb", n), os.path.join(into, n))
    snaps = []
    for path in sorted(glob.glob(os.path.join(ROOT, "kb", "cred_rename_out", "*", "alias_map.json"))):
        d = json.load(open(path, encoding="utf-8"))
        if (d.get("_applied_at") and (set(d.get("renames") or {}) | set(d.get("merges") or {})) & plan_olds
                and os.path.isfile(os.path.join(os.path.dirname(path), "undo.json"))):
            snaps.append(os.path.dirname(path))
    real_u = (undo.CREDENTIALS, undo.UNIFIED_TITLES, undo.ARTICULATIONS, undo.KEY)
    try:
        undo.CREDENTIALS, undo.UNIFIED_TITLES, undo.ARTICULATIONS = (os.path.join(into, n) for n in PRE_FILES)
        undo.KEY = None
        for k, s_ in enumerate(reversed(snaps)):
            rc = os.path.join(into, "receipt%d" % k)
            shutil.copytree(s_, rc)
            with contextlib.redirect_stdout(io.StringIO()):
                undo.main([rc, "--apply", "--json-only", "--force"])
    finally:
        undo.CREDENTIALS, undo.UNIFIED_TITLES, undo.ARTICULATIONS, undo.KEY = real_u
    return {n: os.path.join(into, n) for n in PRE_FILES}


def held_set(d):
    return {h["old"] for h in d["held_family"]}


tmp = tempfile.mkdtemp()
real_out, real_fam, real_plans = dry.OUT_DIR, dry.FAMILIES, dry.PLANS_DIR
real_files = (dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS)
ov = json.load(open(dry.OVERLAY, encoding="utf-8")).get("overrides") or {}
saved_all = {t for t, e in ov.items() if (e or {}).get("unified_title_override") == FAM}
# The plans that rename family members (Sheet 181's); a plan with no family entry (the standards plan, S640) renames
# no member, so its entries are neither family tags nor this test's.
fam_plans = {p["plan_id"] for p in ruled_renames.load(real_plans) if any(e.get("family") == FAM for e in p["entries"])}
plan_olds = {e["old"] for p in ruled_renames.load(real_plans) if p["plan_id"] in fam_plans for e in p["entries"]}
try:
    # ── 1. the dry-run's preview with the family file present (no ruled plan; Sheet 181's is 1b) ─────────
    # Over the pre-apply files, so the checks hold whether or not the plan has run on main: every one of Sam's
    # saved folds into the family title (31 at S638) whose title is still a credential is held as a family tag.
    PRE = pre_apply(os.path.join(tmp, "pre"), plan_olds)
    pre_cr = json.load(open(PRE["credentials.json"], encoding="utf-8"))
    dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS = (PRE[n] for n in PRE_FILES)
    doc = dryrun(tmp, real_fam)
    s = doc["summary"]
    saved = {t for t in saved_all if t in pre_cr}
    check(f"with the family file, every saved fold into the family title is held as a family tag ({len(saved)}, 31 before the plan)",
          held_set(doc) == saved and s["held_as_family_tags"] == len(saved) == len(doc["held_family"])
          and plan_olds <= saved and len(saved) >= 30)
    check("every held fold targets the family title", all(h["target"] == FAM for h in doc["held_family"]))
    check("only 'standards' merges fold (the nightly fold settles others, so the count moves)",
          all(t.endswith(" standards)") for t in doc["merges"].values()))
    check("no rename or merge mints the family title", FAM not in set(doc["renames"].values()) | set(doc["merges"].values()))
    bare = dryrun(tmp, os.path.join(tmp, "absent.json"))
    check("without the family file those folds are not held, so the file is what holds them",
          bare["summary"]["held_as_family_tags"] == 0
          and (not saved or len(bare["renames"]) + len(bare["merges"]) > len(doc["renames"]) + len(doc["merges"])))
    # ── 1b. with Sheet 181's ruled plan: its renames take the place of the family-tag folds they cover ─────
    ruled = dryrun(tmp, real_fam, real_plans)
    applied = {e["old"] for e in ruled["ruled"]["applied"] if e["plan_id"] in fam_plans}
    check("with the ruled plan, the folds it does not rename stay held as family tags, and none is renamed",
          applied == plan_olds and held_set(ruled) == saved - applied
          and ruled["summary"]["held_as_family_tags"] == len(saved) - len(applied))
    check("the ruled merges are the standards merges plus the plan's, and nothing mints the family title",
          set(ruled["merges"]) >= set(doc["merges"]) and FAM not in set(ruled["renames"].values()) | set(ruled["merges"].values()))
    # Over the committed files, before or after a rename: the held folds are exactly the saved folds whose title is
    # still a credential, less what the plan still renames; a renamed-away title is never held and never renamed.
    dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS = real_files
    live_cr = json.load(open(real_files[0], encoding="utf-8"))
    live = dryrun(tmp, real_fam, real_plans)
    live_applied = {e["old"] for e in live["ruled"]["applied"] if e["plan_id"] in fam_plans}
    check("over the committed files, the held family tags are the saved folds still a credential, less the plan's",
          held_set(live) == {t for t in saved_all if t in live_cr} - live_applied
          and live_applied == plan_olds & set(live_cr) and not held_set(live) & live_applied)
finally:
    dry.OUT_DIR, dry.FAMILIES, dry.PLANS_DIR = real_out, real_fam, real_plans
    dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS = real_files

# ── 2. a member renamed into its family form keeps its family ─────────────────────────────────────────────
OLD, NEW = "ASE A4 and A5 Bundle", FAM + ": A4 + A5"


class Rows:
    def __init__(self):
        self.rows = {}
        sup.KEY = "test"
        sup.fetch_credential_review_rows = self.fetch
        sup.delete_row, sup.patch_row = self.delete, self.patch

    def add(self, title, field, value):
        cid = sup.KEY_PREFIX + title
        self.rows[(cid, field)] = {"course_id": cid, "field": field, "value": value,
                                   "reviewer_email": "sam@x", "reviewed_at": "2026-11-11T00:00:00Z"}

    def fetch(self):
        out = {}
        for r in self.rows.values():
            out.setdefault(r["course_id"], []).append(dict(r))
        return out

    def delete(self, cid, field):
        self.rows.pop((cid, field), None)
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok"}

    def patch(self, old, new, field):
        if (new, field) in self.rows:
            return {"op": "patch", "status": "fail", "error": "HTTP Error 409: Conflict"}
        r = self.rows.pop((old, field))
        self.rows[(new, field)] = dict(r, course_id=new)
        return {"op": "patch", "status": "ok"}


db = Rows()
db.add(OLD, "unified_title_override", NEW)
db.add(OLD, "credential_family", FAM)
real_root = sup.OUT_ROOT
try:
    sup.OUT_ROOT = os.path.join(tmp, "out")
    os.makedirs(os.path.join(sup.OUT_ROOT, "2026-11-11"))
    json.dump({"renames": {OLD: NEW}, "merges": {}},
              open(os.path.join(sup.OUT_ROOT, "2026-11-11", "alias_map.json"), "w"))
    with contextlib.redirect_stdout(io.StringIO()):
        sup.main()
finally:
    sup.OUT_ROOT = real_root
moved = db.rows.get((sup.KEY_PREFIX + NEW, "credential_family"))
check("the row move carries credential_family to the renamed title", moved and moved["value"] == FAM)
check("the old key keeps no family row and the fulfilled rename row is dropped",
      not any(k[0] == sup.KEY_PREFIX + OLD for k in db.rows))

cr_path = os.path.join(tmp, "credentials.json")
json.dump({OLD: [{"issuing_agency": "ASE", "family": FAM}], "Other": [{"issuing_agency": "X"}]},
          open(cr_path, "w"))
real_cr = app.CREDENTIALS
try:
    app.CREDENTIALS = cr_path
    app.rekey_credentials({OLD: NEW})
finally:
    app.CREDENTIALS = real_cr
cr = json.load(open(cr_path))
check("the credentials.json re-key carries the record's family to the new title",
      OLD not in cr and cr[NEW][0].get("family") == FAM)
put, cleared, undeclared = acr.promote_families({NEW: {"credential_family": FAM}}, cr_path=cr_path,
                                                families_path=os.path.join(ROOT, "kb", "reference",
                                                                           "credential_families.json"))
cr = json.load(open(cr_path))
check("the nightly sync keeps the family on the renamed title", cr[NEW][0].get("family") == FAM
      and not cleared and not undeclared)
shutil.rmtree(tmp, ignore_errors=True)

failed = [n for n, ok in CHECKS if not ok]
for n, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n)
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
