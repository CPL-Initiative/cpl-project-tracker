#!/usr/bin/env python3
"""kb/_csr_quarterly_probe.py: the CSR's quarterly routines in probe mode (S431).

The probe reads sources a runner can reach and prints one line per source; it must find the handbook link and its
edition, compare the edition with the one kb/reference/mq_sections.json was read from, report a dead or unreachable
source without raising, write no file, and run from a workflow that only reads the repository. Pure-stdlib python.
"""
import importlib.util
import io
import json
import os
import sys
import contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("probe", os.path.join(ROOT, "kb", "_csr_quarterly_probe.py"))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

passed = failed = 0


def check(label, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print("  ok  " + label)
    else:
        failed += 1
        print("  FAIL " + label + (" — " + detail if detail else ""))


PAGE = (b"<html><head><title>Minimum Qualifications - California Community Colleges</title></head><body>"
        b"<a href='/About-Us/Reports'>Reports</a>"
        b"<a href='/-/media/CCCCO-Website/docs/report/19theditionminimumqualifications18a11y.pdf?la=en'>"
        b"19th Edition Minimum Qualifications for Faculty and Administrators Report (PDF)</a>"
        b"<a href='/-/media/CCCCO-Website/docs/report/19theditionminimumqualifications18a11y.pdf?la=en'>again</a>"
        b"</body></html>")
PDF = b"%PDF-1.7 fixture"


def fake(responses):
    calls = []

    def get(url):
        calls.append(url)
        return responses.get(url, (404, url, "text/html", b"not found"))
    return get, calls


MQ = probe.TARGETS[0]
pdf_url = "https://www.cccco.edu/-/media/CCCCO-Website/docs/report/19theditionminimumqualifications18a11y.pdf?la=en"
get, calls = fake({MQ["url"]: (200, MQ["url"], "text/html; charset=utf-8", PAGE),
                   pdf_url: (200, pdf_url, "application/pdf", PDF)})
r = probe.probe(MQ, get=get, committed=19)

check("the handbook page reads 200 with its title", r["status"] == 200 and r["title"].startswith("Minimum Qualifications"))
check("the handbook link is found, made absolute and listed once", [l["href"] for l in r["links"]] == [pdf_url], str(r["links"]))
check("the edition is read from the link (19)", r["links"][0]["edition"] == 19)
check("the probe follows the handbook link and hashes the PDF",
      r["document"]["status"] == 200 and r["document"]["bytes"] == len(PDF) and len(r["document"]["sha256"]) == 64)
check("the edition is compared with the committed one", r["committed_edition"] == 19 and r["edition_matches"] is True)
check("a later edition reads as a change", probe.probe(MQ, get=get, committed=18)["edition_matches"] is False)
check("the edition reads from an address alone", probe.edition_of("", "/docs/20theditionminimumqualifications1a11y.pdf") == 20)
check("mq_sections.json was read from the 19th edition", probe.committed_edition() == 19, str(probe.committed_edition()))

dead, _ = fake({})
d = probe.probe(MQ, get=dead, committed=19)
check("a dead page reports its status and lists nothing", d["status"] == 404 and d["links"] == [] and "document" not in d)

def unreachable(url):
    return None, url, "error: <urlopen error [Errno -2] Name or service not known>", b""
u = probe.probe(probe.TARGETS[1], get=unreachable)
check("an unreachable host reports the error and does not raise", u["status"] is None and u["content_type"].startswith("error"))

check("every target names a routine in the procedures store",
      {t["routine"] for t in probe.TARGETS} == {"mq_list", "authority_tables"})
with open(os.path.join(ROOT, "kb", "csr_procedures.json"), encoding="utf-8") as f:
    store = json.load(f)
ids = {p.get("id") for p in (store.get("procedures") if isinstance(store, dict) else store) or []}
check("both routines exist in kb/csr_procedures.json", {"mq_list", "authority_tables"} <= ids, str(ids))

before = sorted(os.listdir(ROOT))
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = probe.main(["--dry-run"])
lines = buf.getvalue().splitlines()
check("--dry-run lists every target and fetches nothing", rc == 0 and len(lines) == len(probe.TARGETS)
      and all(l.startswith("TARGET ") for l in lines))
check("the probe writes no file", sorted(os.listdir(ROOT)) == before)

with open(os.path.join(ROOT, ".github", "workflows", "csr-quarterly.yml"), encoding="utf-8") as f:
    wf = f.read()
check("the workflow only reads the repository", "contents: read" in wf and "contents: write" not in wf)
check("the workflow runs quarterly and on dispatch", "schedule:" in wf and "1,4,7,10" in wf and "workflow_dispatch" in wf)
check("the workflow runs the comparison", "kb/_csr_quarterly_probe.py --compare" in wf)

# ── comparison mode ──────────────────────────────────────────────────────────
base = probe.load_baseline()
check("the baseline names every target", {t["key"] for t in probe.TARGETS} <= set(base), str(sorted(base)))
check("the handbook baseline is the 19th edition with a PDF hash",
      base["mq_page"]["edition"] == 19 and len(base["mq_page"]["document_sha256"]) == 64)
pdf_sha = __import__("hashlib").sha256(PDF).hexdigest()
fixture_base = {"edition": 19, "document_sha256": pdf_sha, "read_at": "2026-10-20"}
check("the same PDF and edition read as same", probe.compare(r, fixture_base)["verdict"] == "same")
moved = probe.compare(r, dict(fixture_base, document_sha256="0" * 64))
check("a moved PDF reads as changed and names what moved",
      moved["verdict"] == "changed" and moved["moved"] == ["document_sha256"])
check("a new edition reads as changed", "edition" in probe.compare(r, dict(fixture_base, edition=18))["moved"])
check("a dead page reads as unread, never changed", probe.compare(d, fixture_base)["verdict"] == "unread")
check("a source with no accepted read reads no_baseline",
      probe.compare(u, base["cid_home"])["verdict"] == "no_baseline")
md = probe.summary_md([moved, probe.compare(u, base["cid_home"])])
check("the step summary carries a row per source and the next step on a change",
      md.count("\n| ") == 3 and "opens a card" in md)

saved = probe.TARGETS, probe.fetch
def run_main(get):
    probe.TARGETS = [dict(MQ)]
    orig = probe.probe
    probe.probe = lambda t, committed=None: orig(t, get=get, committed=committed)
    try:
        with contextlib.redirect_stdout(io.StringIO()) as out:
            rc = probe.main(["--compare"])
    finally:
        probe.probe = orig
        probe.TARGETS = saved[0]
    return rc, out.getvalue()
os.environ.pop("GITHUB_STEP_SUMMARY", None)
rc, out = run_main(get)
check("--compare prints a COMPARE line and exits 1 when the PDF differs from the baseline",
      rc == 1 and "COMPARE " in out and '"changed"' in out, out[-300:])
rc, out = run_main(dead)
check("--compare exits 0 when the source does not answer", rc == 0 and '"unread"' in out)

print("\n%d/%d checks passed" % (passed, passed + failed))
sys.exit(1 if failed else 0)
