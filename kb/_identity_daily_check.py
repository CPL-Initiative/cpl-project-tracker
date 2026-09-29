#!/usr/bin/env python3
"""Daily college-identity lint: rebuild the crosswalk against LIVE names and
report any change in its findings.

Sam, 2026-09-11: "We could run it daily in the cron against what we pull from
MAP and flag any diffs."

⚠️ WHY THIS IS A MONITOR AND NOT A PUBLISHER. It never commits. The committed
`college_identity_data.js` stays the reviewed artifact; this run compares a fresh
build against it and says whether the FINDING SET moved. A daily commit of a
regenerated artifact would churn `main` against the dashboard cron (Rule 6's
lesson) and would land un-reviewed identity decisions by schedule, which is
exactly what `kb/reference/college_identity_rulings.json` exists to prevent.

⚠️ THE BUILDER WRITES `college_identity_data.js` AT THE REPO ROOT REGARDLESS OF
`--out`. That is fine on an ephemeral runner and NOT fine anywhere else, so this
script captures the committed copy from git BEFORE building and restores the
working tree afterwards. Run it locally and your tree comes back clean.

WHERE IT RUNS. `map-users-sync.yml`, straight after the MAP roster sync — that
job already holds `SUPABASE_SERVICE_KEY` and is the one that pulls from MAP, so
it has the fresh names in hand. Adding a second scheduled workflow to fetch the
same rows would be a second cron racing the first.

⚠️ THE SOURCES ARE FIXED TO MATCH THE COMMITTED BASELINE: chatbox_college_profiles
+ map_college_contacts, the same two the 2026-08-23 input recorded. Adding a third
(map_college_users is right there) would change the finding set and make the daily
diff incomparable to the artifact it is diffed against — a real option, but a
deliberate one that re-baselines, not a freebie.
"""
import hashlib, io, json, os, subprocess, sys, tempfile, urllib.request
from datetime import date

SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
JS = os.path.join(ROOT, "college_identity_data.js")

# A live table with fewer rows than this is a failed read wearing a success's
# shape — every name would resolve to nothing and the lint would report the whole
# roster as findings. Refuse rather than publish that.
MIN_COLLEGES = 100
MIN_OBSERVED = 100


def get(path, key):
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/" + path, method="GET",
        headers={"apikey": key, "Authorization": "Bearer " + key,
                 "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read() or "[]")


def findings_of(js_text):
    """The finding SET, as {(name, class)} — order and counts are not the signal."""
    try:
        body = js_text[js_text.index("{"):js_text.rindex("}") + 1]
        data = json.loads(body)
    except Exception:
        return None
    return {(f.get("name"), f.get("class")) for f in data.get("findings", [])}


def main():
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        sys.exit("SUPABASE_SERVICE_KEY unset — this lint reads a service-role table "
                 "(chatbox_college_profiles carries one policy, service_full_access).")

    colleges = [r for r in get("map_colleges?select=college_id,college_name,entity_kind&limit=2000", key)
                if (r.get("entity_kind") or "college") != "test"]
    names = set()
    for tbl in ("chatbox_college_profiles?select=college&limit=2000",
                "map_college_contacts?select=college&limit=2000"):
        for r in get(tbl, key):
            if r.get("college"):
                names.add(r["college"])
    names = sorted(names)

    if len(colleges) < MIN_COLLEGES or len(names) < MIN_OBSERVED:
        sys.exit("REFUSING: read %d colleges and %d observed names (floors %d/%d). "
                 "A short read would report the whole roster as findings."
                 % (len(colleges), len(names), MIN_COLLEGES, MIN_OBSERVED))

    tmp = tempfile.mkdtemp(prefix="identity-check-")
    mj, oj = os.path.join(tmp, "map_colleges.json"), os.path.join(tmp, "observed.json")
    json.dump(colleges, io.open(mj, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    json.dump({"_measured": date.today().isoformat(),
               "_about": "Every college-name STRING observed in a live Supabase table "
                         "(chatbox_college_profiles, map_college_contacts).",
               "_provenance": "kb/_identity_daily_check.py, from map-users-sync.yml",
               "_name_set_md5": hashlib.md5("\n".join(names).encode("utf-8")).hexdigest(),
               "_name_count": len(names), "names": names},
              io.open(oj, "w", encoding="utf-8"), indent=1, ensure_ascii=False)

    before = io.open(JS, encoding="utf-8").read() if os.path.exists(JS) else ""
    try:
        r = subprocess.run([sys.executable, os.path.join(HERE, "_build_college_identity_crosswalk.py"),
                            "--map-json", mj, "--observed-json", oj, "--out", os.path.join(tmp, "out")],
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.stderr.write(r.stdout + r.stderr)
            sys.exit("builder failed (exit %d)" % r.returncode)
        after = io.open(JS, encoding="utf-8").read()
    finally:
        # ⚠ Restore whatever git has, ALWAYS — see the header. The builder writes
        # the root artifact even with --out, and this script must not leave it
        # modified on any machine.
        subprocess.run(["git", "-C", ROOT, "checkout", "--", "college_identity_data.js"],
                       capture_output=True)

    old, new = findings_of(before), findings_of(after)
    if old is None or new is None:
        sys.exit("could not parse findings out of college_identity_data.js")

    added, gone = sorted(new - old), sorted(old - new)
    lines = ["## College identity — daily lint (%s)" % date.today().isoformat(), "",
             "Read **%d** colleges and **%d** observed names from "
             "`chatbox_college_profiles` + `map_college_contacts`." % (len(colleges), len(names)), ""]
    if not added and not gone:
        lines += ["No change: **%d** finding(s), the same set the committed "
                  "`college_identity_data.js` carries." % len(new)]
    else:
        lines += ["⚠️ **The finding set moved** — committed %d, live %d." % (len(old), len(new)), ""]
        for label, rows in (("New — a live name no identity claims", added),
                            ("Gone — resolved since the artifact was built", gone)):
            if rows:
                lines += ["**%s:**" % label, ""]
                lines += ["- `%s` — %s" % (n, c) for n, c in rows] + [""]
        lines += ["Rebuild and review: `python3 kb/_build_college_identity_crosswalk.py "
                  "--map-json <…> --observed-json <…>`. A name that resolves to no identity "
                  "is a finding, never something to invent an identity for."]

    summary = "\n".join(lines)
    print(summary)
    gh = os.environ.get("GITHUB_STEP_SUMMARY")
    if gh:
        with io.open(gh, "a", encoding="utf-8") as fh:
            fh.write(summary + "\n")
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with io.open(out, "a", encoding="utf-8") as fh:
            fh.write("changed=%s\n" % ("true" if (added or gone) else "false"))
            fh.write("added=%d\ngone=%d\n" % (len(added), len(gone)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
