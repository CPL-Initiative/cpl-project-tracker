"""Every extraction is priced before a model call (S653).

Sam's standing limit is $40 a college a run on the estimate (relayed by COBIx on #3111; conductor_mode,
Settings). Until S653 the college workflow priced only a restaged read (sources_from), so a fresh step=read
with extract=1 ran with neither the estimate gate nor the hard stop. This test holds two things:

1. price() in kb/_program_requirements_wave.py: under the limit it goes, over it it stops with the figure, and
   extract=0 never goes but still prices.
2. Every workflow step that calls a paid extraction (`_program_requirements_college.py extract`, or
   `_program_requirements_extract.py` without --price, the pilot's) is gated on a price step that runs
   before it unconditionally, by `steps.<price>.outputs.go == 'true'`, and passes a hard stop (--ceiling-usd)
   that is never empty.

Python with PyYAML (js-tests.yml installs it)."""
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_wave as W  # noqa: E402

FAILS = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


# ── the price ────────────────────────────────────────────────────────────────
under = W.price(100, 0.08, 40.0, True)
check(under["price_usd"] == 10.0 and under["go"], "100 programs at the $0.08 floor with the 1.25 margin: $10, it goes")
over = W.price(500, 0.08, 40.0, True)
check(over["price_usd"] == 50.0 and not over["go"] and not over["within_limit"] and "$50.00" in over["why"],
      "500 programs: $50, over the $40 limit, it stops and names the figure (%s)" % over["why"])
edge = W.price(400, 0.08, 40.0, True)
check(edge["price_usd"] == 40.0 and edge["go"], "exactly $40 is within the limit")
free = W.price(500, 0.08, 40.0, False)
check(not free["go"] and free["price_usd"] == 50.0, "extract=0 never goes, and still prints the estimate")
check(W.price(10, 0.08, 40.0, True, {"partial": True, "why": "1 of 9 pages answered"})["go"] is False
      and W.price(10, 0.08, 40.0, True, None)["go"] is True,
      "a partial capture holds only when its pages are passed to the gate (a restaged read)")

# price_main on a fresh capture: forced programs are priced beside would_extract, and the pages never hold it.
import argparse  # noqa: E402
import json  # noqa: E402
import tempfile  # noqa: E402
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "out")
    os.makedirs(out)
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump({"would_extract": {"programs": 2, "list": [{"control_number": "11111"}, {"control_number": "22222"}]}}, fh)
    args = argparse.Namespace(college="Nowhere Test College", out=out, extract="1", limit_usd="40", attempt="1",
                              write=os.path.join(tmp, "row.json"), run="1", fresh="1", force="22222,33333,44444")
    check(W.price_main(args) == 0, "price_main runs on a fresh capture")
    with open(os.path.join(out, "wave_price.json")) as fh:
        got = json.load(fh)
    check(got["would_extract"] == 4 and got["forced_priced"] == 2 and got["go"],
          "two forced programs not on would_extract are priced beside its two, and a fresh capture's pages hold "
          "nothing (%s)" % {k: got.get(k) for k in ("would_extract", "forced_priced", "go", "why")})
    args.fresh = "0"
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        check(json.load(fh)["go"] is False, "a restaged read's capture that counted no pages holds")
    # Nothing new to read on a fresh read: it goes, free, and refiles (S653 review, item 1).
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump({"would_extract": {"programs": 0, "list": []}}, fh)
    args.fresh, args.force = "1", ""
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        got = json.load(fh)
    check(got["go"] is True and got["price_usd"] == 0.0,
          "a fresh read with nothing new to read goes, free, so it refiles its records (%s)" % got["why"])
    args.fresh = "0"
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        check(json.load(fh)["go"] is False, "a restaged or wave read with nothing to send does not go")
    # A re-run attempt that would send nothing is never refused (item 2); one that would send something is.
    args.fresh, args.attempt = "1", "2"
    check(W.price_main(args) == 0, "attempt 2 of a fresh read that sends nothing passes the price step")
    args.force = "22222"
    check(W.price_main(args) == 1, "attempt 2 of a read that would send something is refused")
    args.attempt, args.force = "1", ""
    # A filed record that does not read is passed over by force=incomplete, and named (item 3).
    import _program_requirements_college as C  # noqa: E402
    folder = os.path.join(tmp, "college")
    os.makedirs(os.path.join(folder, "records"))
    with open(os.path.join(folder, "records", "11111.json"), "w") as fh:
        fh.write("{not json")
    with open(os.path.join(folder, "records", "22222.json"), "w") as fh:
        json.dump({"control_number": "22222", "score": {"arithmetic": {"status": "incomplete"},
                                                          "coverage": {"placed": 3, "listed": 4}}}, fh)
    check(C.forced(folder, "incomplete") == {"22222"},
          "force=incomplete passes over a record that does not read and keeps the rest")

# The pilot extraction's price (program-requirements-extract.yml): free, it calls nothing.
import _program_requirements_extract as XP  # noqa: E402
_n = len([s for s in XP.load_sources("") if (s.get("coverage") or 0) >= XP.MIN_COVERAGE])
_gh = os.environ.pop("GITHUB_OUTPUT", None)
check(XP.main(["--price", "--limit-usd", "40"]) == 0 and _n > 0,
      "the pilot extraction prices its %d programs without a key or a call" % _n)
if _gh is not None:
    os.environ["GITHUB_OUTPUT"] = _gh
# The pilot extraction's hard stop: at $15 a call, the third call reaches $40 and no fourth is sent.
_sent = []
_call, _cost, _key = XP.call, XP.cost, os.environ.get("SUPABASE_SERVICE_KEY")
XP.call = lambda src, key: _sent.append(src["control_number"]) or {"record": None, "model": "m", "usage": None}
XP.cost = lambda model, usage: 15.0
os.environ["SUPABASE_SERVICE_KEY"] = "test-not-a-key"
try:
    XP.main(["--ceiling-usd", "40"])
finally:
    XP.call, XP.cost = _call, _cost
    if _key is None:
        os.environ.pop("SUPABASE_SERVICE_KEY", None)
    else:
        os.environ["SUPABASE_SERVICE_KEY"] = _key
check(len(_sent) == 3, "the pilot extraction stops at its $40 hard stop: %d calls sent at $15 each" % len(_sent))

# ── the workflows ────────────────────────────────────────────────────────────
# Every step that calls a paid extraction: the college script's extract step, or the pilot extraction
# script run without --price.
EXTRACT = re.compile(r"_program_requirements_college\.py\s+extract\b|"
                     r"python3?\s+\S*_program_requirements_extract\.py(?![^\n]*--price)")
checked = 0
wf_dir = os.path.join(ROOT, ".github", "workflows")
for name in sorted(os.listdir(wf_dir)):
    if not name.endswith((".yml", ".yaml")):
        continue
    with open(os.path.join(wf_dir, name)) as fh:
        wf = yaml.safe_load(fh)
    for job_id, job in (wf.get("jobs") or {}).items():
        steps = job.get("steps") or []
        for i, st in enumerate(steps):
            if not EXTRACT.search(str(st.get("run") or "")):
                continue
            checked += 1
            where = "%s, job %s, step %r" % (name, job_id, st.get("name"))
            cond = str(st.get("if") or "")
            m = re.search(r"steps\.([A-Za-z0-9_-]+)\.outputs\.go\s*==\s*'true'", cond)
            check(bool(m), "%s runs only on its price step's go (if: %s)" % (where, cond or "none"))
            # The condition must not offer a way round the price ("||" beside the go).
            check("||" not in cond, "%s: no alternative to the price in its condition" % where)
            if not m:
                continue
            price_steps = [j for j, p in enumerate(steps) if p.get("id") == m.group(1)]
            check(len(price_steps) == 1 and price_steps[0] < i, "%s: the price step runs before it" % where)
            if price_steps:
                ps = steps[price_steps[0]]
                prun = str(ps.get("run") or "")
                check(("_program_requirements_wave.py price" in prun or re.search(r"_program_requirements_extract\.py.*--price", prun))
                      and "--limit-usd" in prun, "%s: the price step prices against a limit" % where)
                check(not ps.get("if"), "%s: the price step runs on every path (no if: on it)" % where)
            run = str(st.get("run") or "")
            check("--ceiling-usd" in run, "%s passes the hard stop" % where)
            ceiling = re.search(r"--ceiling-usd\s+\"?\$\{?([A-Z_]+)", run)
            env = {**(wf.get("env") or {}), **(job.get("env") or {}), **(st.get("env") or {})}
            val = str(env.get(ceiling.group(1), "")) if ceiling else ""
            check(bool(ceiling) and val.strip() != "" and "''" not in val,
                  "%s: the hard stop is never empty (%s=%r)" % (where, ceiling.group(1) if ceiling else "?", val))
check(checked >= 3, "the college, wave and pilot extraction workflows' steps were found (%d)" % checked)

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
