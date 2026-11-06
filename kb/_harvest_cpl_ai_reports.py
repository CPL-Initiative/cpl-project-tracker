"""
Read every CPL-AI report once, so the tracker can host the whole CPL-AI dataset (Sam, 2026-11-06, SkyLantern:
"connect CPL-AI in the Exhibits tab and make sure we can host all the data, which for now will not have any
further updates. Malone is working on how to integrate the process in MAP").

The CPL-AI page (https://map.rccd.edu/CPL-AI/) lists 33,232 course and certification pairs in
preview-data/catalog.json and serves each pair's full report at preview-data/reports/<id>.json: the
certification's description and competencies, the course's description, units, outcomes and skills, the
domain-by-domain alignment with quoted evidence, and the sources. This script reads the catalog and every
report into one gzipped JSON-lines file, resuming where a run stopped, six requests at a time so the
source server is not loaded. kb/_build_cpl_ai_hosted.py then folds the raw read into the hosted shards.

    python3 kb/_harvest_cpl_ai_reports.py OUT_DIR            # catalog.json + reports.jsonl.gz in OUT_DIR
    python3 kb/_harvest_cpl_ai_reports.py OUT_DIR --limit 50  # a trial read

The raw read stays out of git (about 30 MB gzipped); the hosted shards are what the repo keeps.
"""
import gzip
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://map.rccd.edu/CPL-AI/preview-data/"
UA = {"User-Agent": "cpl-project-tracker (CPL Initiative)"}
WORKERS = 6


def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:  # network hiccup: back off and retry
            if k == tries - 1:
                raise
            time.sleep(2 ** (k + 1))


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    out = argv[0]
    limit = int(argv[argv.index("--limit") + 1]) if "--limit" in argv else None
    os.makedirs(out, exist_ok=True)
    cat_path = os.path.join(out, "catalog.json")
    if not os.path.exists(cat_path):
        open(cat_path, "wb").write(get(BASE + "catalog.json"))
    ids = [r["id"] for r in json.load(open(cat_path, encoding="utf-8"))]
    rep_path = os.path.join(out, "reports.jsonl.gz")
    done = set()
    if os.path.exists(rep_path):
        try:
            with gzip.open(rep_path, "rt", encoding="utf-8") as f:
                for line in f:
                    try:
                        done.add(json.loads(line)["id"])
                    except Exception:
                        break  # a torn last line from an interrupted run
        except EOFError:
            pass
    todo = [i for i in ids if i not in done][:limit]
    print("cpl-ai reports: %d in the catalog, %d already read, %d to read" % (len(ids), len(done), len(todo)), flush=True)
    failed = []
    t0 = time.time()
    with gzip.open(rep_path, "at", encoding="utf-8") as f, ThreadPoolExecutor(WORKERS) as ex:
        futs = {ex.submit(get, BASE + "reports/" + urllib.request.quote(i) + ".json"): i for i in todo}
        for n, fu in enumerate(as_completed(futs), 1):
            i = futs[fu]
            try:
                rec = json.loads(fu.result())
                rec.setdefault("id", i)
                f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")
            except Exception as e:
                failed.append([i, str(e)[:120]])
            if n % 1000 == 0:
                f.flush()
                print("  %d/%d read, %d failed, %.0fs" % (n, len(todo), len(failed), time.time() - t0), flush=True)
    json.dump(failed, open(os.path.join(out, "failed.json"), "w"))
    print("done: %d read this run, %d failed (failed.json); rerun to retry them" % (len(todo) - len(failed), len(failed)), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
