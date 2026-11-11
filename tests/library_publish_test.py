#!/usr/bin/env python3
"""scripts/library_publish.py's pure half: which records are due, and the update and receipt it makes.

    python3 tests/library_publish_test.py

A draft from the card is published only once a person approved it (Replace the public copy) or
asked for it at once; the new version becomes Current, the one before it Replaced, a Draft entry
for the same version is replaced, Changes to make and regen are cleared, and the receipt keeps the
before-values the guarded update is checked against (Rule 10 a2).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import library_publish as lp  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


R = {"id": "r1", "slug": "ell-iet-cpl-starting-points", "version": "2", "updated_at": "2026-11-05T01:00:00+00:00",
     "refresh_note": "December 9", "url": "https://claude.ai/artifact/x",
     "versions": [{"label": "Version 1", "status": "Replaced by v2"}, {"label": "Version 2", "status": "Current"},
                  {"label": "Version 3", "status": "Draft: an earlier session's draft"}],
     "regen": {"requested_at": "t0", "requested_by": "Sam", "publish": "show", "ready_at": "t1", "draft_id": "d1",
               "approved_at": "t2", "approved_by": "Sam"}}
D = {"id": "d1", "summary": "Changed the agenda date.", "made_by": "Ashley"}

check(lp.due(R), "an approved draft from the card is due")
check(not lp.due({**R, "regen": {**R["regen"], "approved_at": None}}), "a draft no one approved is not")
check(lp.due({**R, "regen": {**R["regen"], "approved_at": None, "publish": "replace"}}), "a request to replace at once is due")
check(not lp.due({**R, "regen": {**R["regen"], "draft_id": None}}), "a session's draft (no draft_id) is the session's to publish")
check(not lp.due({**R, "regen": None}), "a record with no request is not")

u = lp.record_update(R, D, "2026-11-05")
cur = [v for v in u["versions"] if str(v.get("status", "")).startswith("Current")]
check(u.get("version") == "3", "the record moves to Version 3")
check(len(cur) == 1 and cur[0]["label"] == "Version 3" and "Changed the agenda date." in cur[0]["status"], "Version 3 is Current, with what changed")
check("Ashley" in cur[0]["status"] and "Sam" in cur[0]["status"], "it names who drafted it and who approved it")
check(any(v["label"] == "Version 2" and v["status"] == "Replaced by v3" for v in u["versions"]), "Version 2 reads Replaced by v3")
check(not any(str(v.get("status", "")).startswith("Draft") for v in u["versions"]), "the older Draft entry for Version 3 is replaced, not kept beside it")
check(u["refresh_note"] is None and u["regen"] is None, "Changes to make and the request are cleared")
check(u["url"] == lp.PAGES + "ell-iet-cpl-starting-points/", "the record links its Pages copy")
check(R["versions"][1]["status"] == "Current", "the record read is not changed in place")

rc = lp.receipt(R, D, u, "2026-11-05")
check(rc["before"]["updated_at"] == R["updated_at"], "the receipt keeps the updated_at the update is guarded on")
check(set(u) <= set(rc["before"]), "the receipt keeps a before-value for every field the update writes")
check(rc["page"] == "library/ell-iet-cpl-starting-points/index.html", "the receipt names the page it wrote")

# Fix 3 (Sam, 2026-11-05: "build fixes 1-3"): a card draft the model made, for a piece a script rebuilds.
SR = {**R, "rebuild_from": "CPLBrain/04-projects/x/make_tabs.py a.html -o b.html"}
u2 = lp.record_update(SR, {**D, "model": "claude-opus-5-5"}, "2026-11-05")
check([v for v in u2["versions"] if str(v.get("status", "")).startswith("Current")][0].get("source_behind") is True,
      "a model's draft of a scripted piece marks its version source_behind")
u3 = lp.record_update(SR, {**D, "model": None}, "2026-11-05")
check(not any(v.get("source_behind") for v in u3["versions"]), "a session's draft, built from the source, does not")
u4 = lp.record_update({**R, "rebuild_from": "Edit the page on its card."}, {**D, "model": "claude-opus-5-5"}, "2026-11-05")
check(not any(v.get("source_behind") for v in u4["versions"]), "nor does a piece with no script behind it")
u5 = lp.record_update({**R, "rebuild_from": "The page itself; python3 scripts/library_page.py x <the built HTML>"}, {**D, "model": "m"}, "2026-11-05")
check(not any(v.get("source_behind") for v in u5["versions"]), "nor one whose only script copies the page to Pages")
check("rebuild_from" in open(lp.__file__).read().split("def write_phase")[1].split("\n")[1] and "made_by,model" in open(lp.__file__).read(),
      "the run reads rebuild_from and the draft's model")

# A new piece drafted on its card from the starter (Sam, 2026-11-10): Version 1, filed on the web, Requested to Draft.
N = {"id": "n1", "slug": "adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5", "version": None, "status": "requested",
     "made_on": None, "home": "not_filed", "url": None, "versions": [], "updated_at": "2026-11-10T18:00:00+00:00",
     "regen": {"requested_at": "t0", "requested_by": "Sam", "new_piece": True, "ready_at": "t1", "draft_id": "d9",
               "approved_at": "t2", "approved_by": "Sam"}}
un = lp.record_update(N, {"id": "d9", "summary": "Steps to add the two contacts.", "made_by": "Sam", "model": "m"}, "2026-11-10")
check(lp.due(N) and lp.is_new_piece(N), "an approved new piece is due, and known as new")
check(un["version"] == "1" and un["versions"][-1]["label"] == "Version 1", "a new piece publishes as Version 1")
check(un["home"] == "web" and un["url"].endswith("/library/" + N["slug"] + "/") and un["file_type"] == "html",
      "it is filed on the web at its Pages address (home and url move together, as cpl_library_filed_ck asks)")
check(un["status"] == "draft" and un["made_on"] == "2026-11-10", "a Requested piece moves to Draft and takes the day as made on")
check("first public copy" in un["versions"][-1]["status"], "its version says it is the first public copy")
check(not lp.is_new_piece(R) and "home" not in lp.record_update(R, D, "2026-11-05"), "a revision moves none of that")
check("mkdir(parents=True" in open(lp.__file__).read(), "--write makes the new piece's folder")

# Pictures (Sam, 2026-11-11): the one figure a page may carry, and the files written beside it.
import base64  # noqa: E402
WEBP = base64.b64encode(b"RIFF\x10\x00\x00\x00WEBPVP8 " + b"x" * 80).decode()
PNG = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"x" * 80).decode()
FIG = ('<figure class="shot"><a href="img/%d.%s" target="_blank" rel="noopener"><img src="img/%d.%s" alt="MAP Main Menu" '
       'width="10" height="10" loading="lazy"></a></figure>')
MAIN = '<main id="main"><h1>T</h1><p>One.</p>%s</main>'
page = MAIN % (FIG % (1, "webp", 1, "webp") + FIG % (2, "png", 2, "png") + FIG % (3, "webp", 3, "webp") + FIG % (4, "webp", 4, "webp"))
pics = [{"n": 1, "mime": "image/webp", "data": WEBP, "width": 800, "height": 600, "left_out": False},
        {"n": 2, "mime": "image/png", "data": PNG, "width": 5, "height": 5, "left_out": True},
        {"n": 3, "mime": "image/webp", "data": PNG, "width": 5, "height": 5, "left_out": False}]
out, files = lp.place_pictures(page, pics)
check(sorted(files) == ["img/1.webp"] and files["img/1.webp"][:4] == b"RIFF", "a placed picture is a file beside the page")
check('src="img/1.webp" alt="MAP Main Menu" width="800" height="600"' in out, "its figure takes the row's size")
check("img/2." not in out, "a picture left out is dropped from the page")
check("img/3." not in out, "a picture that is not the type it says is dropped")
check("img/4." not in out, "a figure with no picture behind it is dropped")
check(lp.main_problems(lp.strip_figures(out)) == [], "the allowlist passes the page with its figures taken out")
check(any("img" in b for b in lp.main_problems(out)), "and still refuses a figure it was not told to take out")
evil = MAIN % '<figure class="shot"><a href="img/1.webp" target="_blank" rel="noopener"><img src="https://x.example/a.png" alt="" width="1" height="1" loading="lazy"></a></figure>'
check(lp.strip_figures(evil) == evil and lp.main_problems(lp.strip_figures(evil)) != [], "a figure pointing anywhere else is not the fixed form, so it is refused")
handler = MAIN % (FIG % (1, "webp", 1, "webp")).replace(' loading="lazy"', ' onerror="x()" loading="lazy"')
check(lp.strip_figures(handler) == handler, "nor is one with a handler added")
check(lp.added_risks(lp.strip_figures("<p>a</p>"), lp.strip_figures("<p>a</p>" + FIG % (1, "webp", 1, "webp"))) == [],
      "a revision that adds a picture is no new source")
check(lp.added_risks("<p>a</p>", '<p>a</p><img src="https://x.example/a.png">') != [], "one that adds any other image still is")
wf = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".github", "workflows", "library-publish.yml")).read()
check("git add -A library/*/img/" in wf, "the publish run commits the picture files, and their removal")
# COBIx on #3095: a picture left out after publishing must leave the site, and the tick box must reach the record.
import pathlib  # noqa: E402
import tempfile  # noqa: E402
with tempfile.TemporaryDirectory() as td:
    folder = pathlib.Path(td)
    (folder / "img").mkdir()
    for nm in ("1.webp", "3.webp", "notes.txt"):
        (folder / "img" / nm).write_bytes(b"x")
    gone = [p.name for p in lp.stale_pictures(folder, {"img/1.webp": b"x"})]
    check(gone == ["3.webp"], "a picture the page no longer shows is deleted from its folder; nothing else is touched")
    check(lp.stale_pictures(folder / "none", {}) == [], "a page with no picture folder has nothing to delete")
src = open(lp.__file__).read()
check("for old in stale_pictures(page.parent, files):" in src and "old.unlink()" in src, "--write deletes them")
check(not lp.pictures_checked(N) and lp.pictures_checked({"regen": {"pictures_checked_by": "Sam", "pictures_checked_at": "t"}})
      and not lp.pictures_checked({"regen": {"pictures_checked_by": " ", "pictures_checked_at": "t"}}),
      "an approval says who checked the pictures, or it does not count")
check("if files and not pictures_checked(r):" in src, "--write skips a draft with pictures nobody is recorded as checking")

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
