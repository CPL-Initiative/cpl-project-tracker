"""The $40 gate on every paid model caller beside the extraction (S655, card 10; d-one-spend-meter-s654).

Sam's standing limit is $40 a run on the estimate (COBIx relaying him on #3111, comment 6808460886). Each caller
here is checked the way it fails: an estimate or bound over $40 refuses the run before any model call (a stub
that fails the test when it is called), and one just under it proceeds. Expected dollars come from the hand
derivations written beside each check, at Claude Opus 5.5's list rates, the dearest in the meter's table:
$4 per million input tokens and $20 per million output tokens. Also COBIx's two notes on #3330: a second
reading with a refused rate stays refused (6888116814), and the stated most-a-call-costs figure is recomputed
over every committed request so it cannot drift (6888534891).
"""
import glob
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import contextlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
sys.path.insert(0, KB)

import yaml  # noqa: E402

import _spend_meter as M  # noqa: E402
import _model_run_gate as G  # noqa: E402
import _cer_procedures as cp  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_wave as W  # noqa: E402
import _second_reader as R  # noqa: E402

ok = fail = 0


def check(name, cond, detail=""):
    global ok, fail
    if cond:
        ok += 1
        print("PASS", name)
    else:
        fail += 1
        print("FAIL", name, detail)


def near(a, b, tol=1e-6):
    return abs(float(a) - float(b)) <= tol


IN, OUT = 4.00, 20.00   # Opus 5.5, $ per million tokens: the dearest rate in the meter's table


def by_hand(input_tokens, output_tokens):
    return (input_tokens * IN + output_tokens * OUT) / 1e6


# ── the meter's bound and the one standing limit ─────────────────────────────
check("the standing limit is $40, and the extraction's ceiling reads it",
      M.STANDING_LIMIT_USD == 40.0 and W.LIMIT_CEILING_USD == 40.0)
# 100,000 in x $4/M = $0.40; 8,192 out x $20/M = $0.16384; together $0.56384.
check("one call's bound: input and output at the dearest rate for an unknown model",
      near(M.call_bound(100000, 8192), 0.56384), M.call_bound(100000, 8192))
check("an unlisted model is priced at the dearest rate too",
      near(M.call_bound(100000, 8192, "claude-sonnet-5"), 0.56384))
# 70 calls x $0.56384 = $39.4688; 71 calls = $40.03264.
check("a run's bound is calls x attempts x one call", near(M.run_bound(70, 100000, 8192), 39.4688)
      and near(M.run_bound(35, 100000, 8192, attempts=2), 39.4688))
check("at the limit is within it, a cent over is not", M.within_limit(40.0) and not M.within_limit(40.01))


# ── cpl-news-harvest: the bound from its own limits ──────────────────────────
NEWS = G.source("cpl-news-harvest")
lim = G.news_limits(NEWS)
# 25 manual requests + 80 candidates = 105 items, 12 a batch: ceil(105 / 12) = 9 calls, one attempt each.
check("the harvest reads 9 calls from its own limits", lim["calls"] == 9 and lim["attempts"] == 1, lim)
# Each call: the 1,000,000-token context window in ($4.00) and max_tokens 2,000 out ($0.04) = $4.04; 9 x = $36.36.
got = G.gate(lim, lim["calls"])
check("the harvest's worst case is $36.36, within $40", near(got["bound_usd"], 36.36, 0.005) and got["go"], got)
bigger = NEWS.replace("const MAX_NEW_CANDIDATES = 80;", "const MAX_NEW_CANDIDATES = 90;")
# 25 + 90 = 115 items: ceil(115 / 12) = 10 calls x $4.04 = $40.40, over $40.
lim2 = G.news_limits(bigger)
got2 = G.gate(lim2, lim2["calls"])
check("ten batches ($40.40) are refused", lim2["calls"] == 10 and near(got2["bound_usd"], 40.40, 0.005)
      and not got2["go"], got2)
try:
    G.news_limits(NEWS.replace("const ANALYZE_BATCH = 12;", "const ANALYZE_BATCH = BATCH;"))
    check("a limit the gate cannot read refuses", False)
except G.Unreadable:
    check("a limit the gate cannot read refuses", True)
try:
    G.news_limits(NEWS + "\nconst again = await fetch(\"https://api.anthropic.com/v1/messages\", {});\n")
    check("a second model call site refuses (the bound counts one call a batch)", False)
except G.Unreadable:
    check("a second model call site refuses (the bound counts one call a batch)", True)


# ── cpl-chat: one call an answer ─────────────────────────────────────────────
CHAT = G.source("cpl-chat")
cl = G.chat_limits(CHAT)
check("Sierra's limits: MAX_TOKENS 8,192 out, the 100,000-token allowance in, the dearest rate",
      cl["output_tokens"] == 8192 and cl["input_tokens"] == 100000 and cl["model"] is None, cl)
try:
    G.chat_limits(CHAT.replace("fetch(\"https://api.anthropic.com/v1/messages\"", "client.messages.create(", 1)
                  + "\nconst client = new Anthropic();\n")
    check("an SDK client in Sierra's function refuses (its retries bill outside the bound)", False)
except G.Unreadable:
    check("an SDK client in Sierra's function refuses (its retries bill outside the bound)", True)
# The committed scripts, counted by hand: 34 run lines in smoke_test.sh, 10 ask lines in preflight_bgca.sh.
smoke_n = G.script_calls(os.path.join(ROOT, "chatbox", "smoke_test.sh"))
check("the smoke suite asks 34 answers", smoke_n == 34, smoke_n)
check("the preflight battery asks 10 answers", G.script_calls(os.path.join(ROOT, "chatbox", "preflight_bgca.sh")) == 10)
# The A/B: 34 x 2 sides + 2 probes = 70 calls x $0.56384 = $39.4688, within $40.
ab = G.gate(cl, smoke_n * 2 + 2)
check("the A/B's worst case is $39.47, within $40", near(ab["bound_usd"], 39.47, 0.005) and ab["go"], ab)
check("a 71st answer ($40.03) is refused", not G.gate(cl, 71)["go"])


# ── the workflow steps themselves, run with a stub model call ────────────────
def wf(name):
    with open(os.path.join(ROOT, ".github", "workflows", name), encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def step(doc, pred):
    for job in doc["jobs"].values():
        for i, s in enumerate(job.get("steps", [])):
            if pred(s):
                return job["steps"], i
    raise LookupError("no such step")


def mirror(tmp, news_text=None, smoke_runs=None):
    """A repo layout in tmp: kb/ is the real kb/ (a link, so the gate imports the one meter), the function sources
    are the real ones unless given, and smoke_test.sh is a stub whose run() writes a mark when it is called."""
    os.symlink(KB, os.path.join(tmp, "kb"))
    fdir = os.path.join(tmp, "chatbox", "supabase", "functions")
    for fn in ("cpl-news-harvest", "cpl-chat"):
        os.makedirs(os.path.join(fdir, fn))
        dst = os.path.join(fdir, fn, "index.ts")
        if fn == "cpl-news-harvest" and news_text is not None:
            open(dst, "w").write(news_text)
        else:
            os.symlink(os.path.join(ROOT, "chatbox", "supabase", "functions", fn, "index.ts"), dst)
    if smoke_runs is not None:
        body = 'run() { echo asked >> "$MARK"; }\n' + "".join('run "mode %d" \'{}\'\n' % i for i in range(smoke_runs))
        open(os.path.join(tmp, "chatbox", "smoke_test.sh"), "w").write(body)
    bindir = os.path.join(tmp, "bin")
    os.makedirs(bindir)
    with open(os.path.join(bindir, "curl"), "w") as fh:
        fh.write('#!/bin/sh\necho posted >> "$MARK"\necho "{}" > resp.json\nprintf 200\n')
    os.chmod(os.path.join(bindir, "curl"), 0o755)
    return bindir


def run_step(text, tmp, bindir, env=None):
    mark = os.path.join(tmp, "mark")
    e = dict(os.environ, PATH=bindir + os.pathsep + os.environ["PATH"], MARK=mark, **(env or {}))
    e.pop("GITHUB_OUTPUT", None)
    p = subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", text], cwd=tmp, env=e,
                       capture_output=True, text=True, timeout=120)
    calls = open(mark).read().count("\n") if os.path.exists(mark) else 0
    return p.returncode, calls, p.stdout + p.stderr


news_steps, ni = step(wf("cpl-news.yml"), lambda s: "functions/v1/cpl-news-harvest" in (s.get("run") or ""))
news_run = news_steps[ni]["run"]
check("the harvest's step runs the gate before its POST",
      "_model_run_gate.py cpl-news-harvest" in news_run
      and news_run.index("_model_run_gate.py") < news_run.index("curl"))
check("the harvest job checks out the repo before the gate",
      any((s.get("uses") or "").startswith("actions/checkout") for s in news_steps[:ni]))
with tempfile.TemporaryDirectory() as tmp:
    b = mirror(tmp, news_text=bigger)
    rc, n, log = run_step(news_run, tmp, b, {"SVC": "service-key"})
    check("over $40 the harvest's step ends red and never POSTs", rc != 0 and n == 0, (rc, n, log[-400:]))
with tempfile.TemporaryDirectory() as tmp:
    b = mirror(tmp, news_text=NEWS)
    rc, n, log = run_step(news_run, tmp, b, {"SVC": "service-key"})
    check("at $36.36 the harvest's step POSTs once", rc == 0 and n == 1, (rc, n, log[-400:]))

smoke_steps, si = step(wf("cpl-chat-smoke.yml"), lambda s: "smoke_test.sh" in (s.get("run") or ""))
smoke_run = smoke_steps[si]["run"]
# The smoke workflow runs the suite once: 71 run lines x $0.56384 = $40.03 is refused, 70 ($39.47) proceeds.
with tempfile.TemporaryDirectory() as tmp:
    b = mirror(tmp, smoke_runs=71)
    rc, n, log = run_step(smoke_run, tmp, b)
    check("a 71-answer smoke suite ($40.03) is refused before any answer", rc != 0 and n == 0, (rc, n, log[-400:]))
with tempfile.TemporaryDirectory() as tmp:
    b = mirror(tmp, smoke_runs=70)
    rc, n, log = run_step(smoke_run, tmp, b)
    check("a 70-answer smoke suite ($39.47) asks all 70", rc == 0 and n == 70, (rc, n, log[-400:]))

PAID = re.compile(r"smoke_test\.sh|preflight_bgca\.sh|health_check\.sh|functions/v1/cpl-chat|functions/v1/\$slug"
                  r"|functions/v1/cpl-news-harvest")
STATUS_FN = re.compile(r"\b(always|failure|cancelled)\(\)")


def gated(steps, i):
    """A paid step is gated when its own run text runs the gate before the paid command, or an earlier step in the
    job runs it and this step cannot run after that step failed (no status function, or one that also requires
    the gate step's success)."""
    text = steps[i].get("run") or ""
    if "_model_run_gate.py" in text and text.index("_model_run_gate.py") < PAID.search(text).start():
        return True
    for j in range(i):
        if "_model_run_gate.py" in (steps[j].get("run") or ""):
            cond = str(steps[i].get("if") or "")
            if not STATUS_FN.search(cond):
                return True
            gid = steps[j].get("id")
            return bool(gid) and ("steps.%s.outcome == 'success'" % gid) in cond
    return False


every = 0
for path in sorted(glob.glob(os.path.join(ROOT, ".github", "workflows", "*.yml"))):
    doc = yaml.safe_load(open(path, encoding="utf-8"))
    for job in (doc.get("jobs") or {}).values():
        steps = job.get("steps") or []
        for i, s in enumerate(steps):
            text = s.get("run") or ""
            # A comment naming a script is no call; a line that runs one is.
            live = "\n".join(ln for ln in text.splitlines() if not ln.strip().startswith(("#", "echo ")))
            if PAID.search(live):
                every += 1
                check("%s, step %r: no model call before the $40 gate" % (os.path.basename(path), s.get("name")),
                      gated(steps, i))
check("every step that asks a model is counted: news, smoke, the A/B price, both sides and its probe, preflight, "
      "health, ask", every >= 9, every)

# The fixed-count callers: the count the gate is given is the count the step asks for.
h_steps, hi = step(wf("cpl-chat-health.yml"), lambda s: "health_check.sh" in (s.get("run") or ""))
check("the health probe asks twice and its gate prices two",
      h_steps[hi]["run"].count("bash chatbox/health_check.sh") == 2
      and any("--calls 2" in (s.get("run") or "") for s in h_steps[:hi]))
a_steps, ai = step(wf("sierra-ask.yml"), lambda s: "curl" in (s.get("run") or ""))
check("Ask Sierra posts once and its gate prices one",
      a_steps[ai]["run"].count("curl ") == 1 and "--calls 1" in a_steps[ai]["run"])
ab_steps, _ = step(wf("cpl-chat-preview-ab.yml"), lambda s: s.get("id") == "price")
probe = [s for s in ab_steps if "functions/v1/$slug" in (s.get("run") or "")][0]
check("the A/B's gate prices both sides and the two probes",
      "--passes 2 --extra 2" in ab_steps[[s.get("id") for s in ab_steps].index("price")]["run"]
      and probe["run"].count("for slug in cpl-chat cpl-chat-preview") == 1)


# ── cer-classify: the estimate and the hard stop through the meter ───────────
def refuse_call(body, key):
    raise AssertionError("the classifier was called past its $40 gate")


cp.time.sleep = lambda s: None
row = [{"raw_title": "Floral Design", "cpl_types": [], "articulating_colleges_sample": [], "hints": []}]
# One chunk: rules of 9,900,000 characters. M.worst_case counts the request's characters and 40,000 more as input
# and 32,000 output tokens: (9,900,000 + the rest of the body + 40,000) x $4/M >= $39.76, + 32,000 x $20/M = $0.64,
# so at least $40.40: over $40.
rules_over = "x" * 9900000
chars_over = len(json.dumps({"rules": rules_over, "rows": row}))
check("the request is the rules and the row, under 200 characters more", chars_over - 9900000 < 200, chars_over)
check("one chunk of 9.9M characters prices at $40.40 or more",
      near(cp.price_classify(row, rules_over)["estimate_usd"], by_hand(chars_over + 40000, 32000), 0.006)
      and by_hand(chars_over + 40000, 32000) >= 40.40)
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    got, calls, spend = cp.ask_classifier(row, rules_over, "key", call=refuse_call)
check("over $40 the classifier is asked nothing and says why", got == {} and calls == [] and "over the $40" in
      spend.get("refused", ""), spend)

# 9,700,000 characters: (9,700,000 + under 200 + 40,000) x $4/M < $38.97, + $0.64 < $39.61: within $40.
rules_under = "x" * 9700000
chars_under = len(json.dumps({"rules": rules_under, "rows": row}))
sent = []


def answer(body, key):
    sent.append(len(body["rows"]))
    return {"model": "claude-opus-5-5", "usage": {"input_tokens": 1000, "output_tokens": 100},
            "records": [{"raw_title": r["raw_title"], "unified_title": "Floral Design"} for r in body["rows"]]}


with contextlib.redirect_stdout(io.StringIO()):
    got, calls, spend = cp.ask_classifier(row, rules_under, "key", call=answer)
check("just under $40 ($39.61 at most) the classifier is asked once",
      by_hand(chars_under + 40000, 32000) < 39.61 and sent == [1] and "Floral Design" in got
      and not spend.get("refused"), spend)
# The meter records the priced usage: 1,000 in x $4/M + 100 out x $20/M = $0.006.
check("the meter counts the answer's priced usage", near(spend.get("charge_usd"), 0.006), spend)
check("the report's cost is the meter's price", near(cp.cost_usd(calls), 0.01, 0.0051))

# The hard stop: two chunks of one title each and rules of 4,000,000 characters. Each post reserves its worst case,
# (4,000,000 + the body + 40,000) x $4/M + 32,000 x $20/M >= $16.80, so the estimate for two is $33.60 or more,
# within $40. The first chunk's call and its retry both reach the gateway and fail with no usage: each settles at
# its worst case, >= $33.60 together. The second chunk would reserve >= $16.80 more, >= $50.40: the stop holds it.
two = [dict(row[0], raw_title="t%d" % i) for i in range(2)]
tries = []


def fail_twice(body, key):
    tries.append(body["rows"][0]["raw_title"])
    if len(tries) <= 2:
        return {"error": "HTTP 502: upstream", "http_status": 502}
    raise AssertionError("a post past the hard stop was sent")


with contextlib.redirect_stdout(io.StringIO()):
    priced = cp.price_classify(two, "x" * 4000000, chunk=1)
    meter = M.Meter(40.0)
    got, calls = cp.classify(two, "x" * 4000000, "key", chunk=1, workers=1, call=fail_twice, meter=meter)
check("two chunks of 4M characters price at $33.60 or more, within $40",
      priced["calls"] == 2 and 33.6 <= priced["estimate_usd"] <= 40 and priced["within_limit"], priced)
check("the hard stop holds the post that would pass $40, unsent",
      meter.stopped and tries == ["t0", "t0"] and calls[1]["stopped"] and got == {}
      and 33.6 <= meter.spent <= 40, (tries, meter.snapshot()))
src = open(os.path.join(KB, "_cer_procedures.py"), encoding="utf-8").read()
run_src = src[src.index("\ndef run("):src.index("\ndef try_procedure(")]
check("run() asks the classifier only through its gate", "ask_classifier(" in run_src
      and not re.search(r"\bclassify\(rows", run_src))
cer_steps, ci = step(wf("cer-procedures.yml"), lambda s: "_cer_procedures.py --classify" in (s.get("run") or ""))
check("a held classifier ends the CER job red after the commit",
      cer_steps[ci].get("id") == "procedures"
      and any("steps.procedures.outputs.classifier_held == 'true'" in str(s.get("if")) and "exit 1" in s.get("run", "")
              for s in cer_steps[ci + 1:]))


# ── COBIx 6888116814: a refused rate stays a refusal in run() ────────────────
def never(body, key):
    raise AssertionError("the second reader was called with a refused rate")


X_post, X._post = X._post, never
err = io.StringIO()
with contextlib.redirect_stderr(err), contextlib.redirect_stdout(io.StringIO()):
    rc = R.run("Santa Rosa Junior College", None, key="service-key", model="grok-not-in-the-table", ceiling=40.0)
check("a model the price table does not name, with no rate, is refused in run() before any call",
      rc == 1 and "not in the price table" in err.getvalue(), (rc, err.getvalue()[-300:]))
with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
    rc_low = R.run("Santa Rosa Junior College", None, key="service-key", rate="0.01", ceiling=40.0)
check("a rate below the default is refused in run() too", rc_low == 1)
X._post = X_post


# ── COBIx 6888534891: the most a call costs, over every committed request ────
# A request is json.dumps of the body the extraction sends. The pilot's committed sources hold whole requests; a
# college's committed sources.json holds each program's text length and listed count, not its closed list, so
# its request is bounded: the program's fields (under 1,000 characters), its text at 1.25 characters a character
# (JSON escapes; the pilot's texts run to 1.10), each listed course at the longest committed course entry, and,
# for a read in parts, every course code once more in the part's list.
pilot = X.load_sources()
LONGEST_ENTRY = max(len(json.dumps(c)) + 2 for s in pilot for c in s["closed_list"])
LONGEST_CODE = max(len(json.dumps(c.get("code"))) + 2 for s in pilot for c in s["closed_list"])
ESCAPE = 1.25
check("the pilot's texts escape under the 1.25 allowance",
      max(len(json.dumps(s["text"])) / max(1, len(s["text"])) for s in pilot) < ESCAPE)


def body_of(s):
    return {"college": s["college"], "title": s["title"], "award": s["award"], "catalog_year": s.get("catalog_year"),
            "source_url": (s.get("source") or {}).get("url"), "text": s["text"], "closed_list": s["closed_list"]}


sizes = []
for s in pilot:
    b = body_of(s)
    n = len(json.dumps(b))
    if len(s["closed_list"]) > X.SPLIT_AT:
        n += len(json.dumps({"part": {"index": 1, "of": 6, "codes": [c["code"] for c in s["closed_list"]]}}))
    sizes.append((n, s["_file"]))
for path in glob.glob(os.path.join(KB, "program_requirements_college", "*", "sources.json")):
    for e in json.load(open(path, encoding="utf-8")):
        listed, text = int(e.get("listed") or 0), int(e.get("text_chars") or 0)
        n = 1000 + math.ceil(text * ESCAPE) + listed * LONGEST_ENTRY
        if listed > X.SPLIT_AT:
            n += 60 + listed * LONGEST_CODE
        sizes.append((n, "%s %s" % (os.path.basename(os.path.dirname(path)), e.get("control_number"))))
largest, where = max(sizes)
# The most one post costs: (characters + 40,000) x $4/M + 32,000 x $20/M.
most = by_hand(largest + 40000, 32000)
check("the largest committed request (%s, %d characters) costs at most $%.4f, within CALL_MAX_USD $%.2f"
      % (where, largest, most, X.CALL_MAX_USD), most <= X.CALL_MAX_USD and near(M.worst_case(largest), most, 1e-4))
check("CALL_MAX_USD keeps under five cents of headroom, so it stays a measure, not a guess",
      X.CALL_MAX_USD - most < 0.05, (X.CALL_MAX_USD, most))
over = round(X.CALL_MAX_USD - X.call_estimate(), 2)
stated = {"kb/_program_requirements_extract.py": ["$%.2f" % X.CALL_MAX_USD, "$%.2f for" % over],
          "kb/_program_requirements_college.py": ["$%.2f" % X.CALL_MAX_USD, "$%.2f with six" % (6 * over)],
          "kb/_second_reader.py": ["$%.2f" % X.CALL_MAX_USD, "$%.2f with four" % (4 * over)],
          ".github/workflows/program-requirements-extract.yml": ["$%.2f" % X.CALL_MAX_USD, "most $%.2f" % over],
          ".github/workflows/program-requirements-college.yml": ["$%.2f" % X.CALL_MAX_USD, "$%.2f" % (6 * over)],
          ".github/workflows/second-reader.yml": ["$%.2f" % X.CALL_MAX_USD, "$%.2f" % (4 * over)]}
for rel, figures in stated.items():
    text = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    check("%s states the overshoot from CALL_MAX_USD (%s)" % (rel, ", ".join(figures)),
          all(f in text for f in figures) and "$1.12" not in text and "$1.02" not in text)

print("%d/%d checks passed" % (ok, ok + fail))
sys.exit(1 if fail else 0)
