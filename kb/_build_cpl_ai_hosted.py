"""
The whole CPL-AI dataset, hosted in the tracker for COBI's Exhibits tab (Sam, 2026-11-06, SkyLantern: "connect
CPL-AI in the Exhibits tab and make sure we can host all the data, which for now will not have any further
updates. Malone is working on how to integrate the process in MAP, but we can focus on making the data available
and useful").

Input: the raw read kb/_harvest_cpl_ai_reports.py writes (catalog.json and reports.jsonl.gz). Output, under
kb/cpl_ai/hosted/:

  index.json          the credit and caveat word for word, the three evidence tiers, the counts, and one line per
                      certification (its code, title, pairs by tier, colleges, courses, pairs by tier at each college),
                      so the view lists all 115 without reading a shard.
  shards/<code>.json.gz  one certification, gzipped (the browser unpacks it with DecompressionStream): its title, description and competencies once; each course it pairs with
                      once (college, code, title, discipline, description, units, outcomes, skills); and every pair
                      in all three tiers with the catalog's scores and the report's recommendation, domain-by-domain
                      alignment with quoted evidence, scope note and sources (each source line once per shard, in
                      "sources", the pair naming its lines by number).

Every field the source publishes is kept; only repetition is folded (a course's text appears once per shard, not
once per pair). The credit and caveat travel with the data and the view shows them. The snapshot is frozen: the
source publishes no further updates for now, so nothing schedules a re-read. kb/_build_cpl_ai.py still writes the
Program Requirements dialog's smaller pairs.json from the same catalog.

    python3 kb/_build_cpl_ai_hosted.py RAW_DIR   # build from a raw read
    python3 kb/_build_cpl_ai_hosted.py --check   # the hosted files are whole: every catalog pair in its shard
"""
import gzip
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _build_cpl_ai import CREDIT, CAVEAT, PAGE, SOURCE  # noqa: E402  (one copy of the words)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "cpl_ai", "hosted")
TIERS = {"1": "Strong evidence", "2": "Faculty interpretation", "3": "Limited evidence"}


def read_reports(path):
    """Every whole line of the gzipped JSON-lines read; a torn tail from an interrupted read is skipped."""
    out = {}
    try:
        with gzip.open(path, "rt", encoding="utf-8") as f:
            for line in f:
                try:
                    r = json.loads(line)
                except ValueError:
                    break
                out[r["id"]] = r
    except EOFError:
        pass
    return out


def fold(src, table, at):
    """A source line into the shard's table: [its number in the report, its index in the table]."""
    t = src.get("text") or ""
    if t not in at:
        at[t] = len(table)
        table.append(t)
    return [src.get("number"), at[t]]


def by_college_tiers(rows, cidx):
    """{college index: [strong, faculty interpretation, limited]} for one certification's pairs."""
    out = {}
    for r in rows:
        out.setdefault(str(cidx[r["college"]]), [0, 0, 0])[int(r["tier"]) - 1] += 1
    return dict(sorted(out.items(), key=lambda kv: int(kv[0])))


def safe(code):
    return re.sub(r"[^A-Za-z0-9_-]", "_", code)


def build(catalog, reports, fetched_at):
    by_cred = defaultdict(list)
    for row in catalog:
        by_cred[row["credentialCode"]].append(row)
    lines, shards, missing = [], {}, []
    college_list = sorted({r["college"] for r in catalog})
    cidx = {c: i for i, c in enumerate(college_list)}
    for code in sorted(by_cred, key=lambda c: by_cred[c][0]["credential"].lower()):
        rows = sorted(by_cred[code], key=lambda r: (r["tier"], -r["alignmentRatio"], -r["cosine"], r["college"], r["courseCode"]))
        cred = {"code": code, "title": rows[0]["credential"], "description": "", "competencies": []}
        courses, pairs, srcs, src_at = {}, [], [], {}
        for row in rows:
            rep = reports.get(row["id"])
            if rep is None:
                missing.append(row["id"])
            rc = (rep or {}).get("credential") or {}
            if rc.get("description") and not cred["description"]:
                cred["description"] = rc["description"]
                cred["competencies"] = rc.get("competencies") or []
            cid = row["courseId"]
            if cid not in courses:
                co = (rep or {}).get("course") or {}
                courses[cid] = {"college": row["college"], "code": row["courseCode"], "title": row["courseTitle"],
                                "discipline": row["discipline"], "description": co.get("description") or "",
                                "units": co.get("units") or None, "outcomes": co.get("outcomes") or [],
                                "skills": co.get("skills") or []}
            rec = (rep or {}).get("recommendation") or {}
            al = (rep or {}).get("alignment") or {}
            pairs.append({
                "id": row["id"], "course": cid, "tier": row["tier"], "relevance": row["relevance"],
                "cosine": row["cosine"], "ratio": row["alignmentRatio"],
                "domains_n": row["domainCount"], "matched_n": row["matchedDomainCount"],
                "explicit": rec.get("explicit"), "snapshot": rec.get("snapshot") or [],
                "disclaimer": rec.get("disclaimer") or "", "source_tier_label": rec.get("sourceTierLabel") or "",
                "domains": al.get("domains") or [], "scope_note": al.get("scopeNote") or "",
                "sources": [fold(s, srcs, src_at) for s in (rep or {}).get("sources") or []], "report": rep is not None})
        tiers = Counter(str(r["tier"]) for r in rows)
        lines.append({"code": code, "file": safe(code) + ".json.gz", "title": cred["title"],
                      "pairs": len(rows), "by_tier": {k: tiers.get(k, 0) for k in TIERS},
                      "colleges": len({r["college"] for r in rows}), "courses": len(courses),
                      "disciplines": sorted({r["discipline"] for r in rows if r["discipline"]})[:12],
                      "by_college": by_college_tiers(rows, cidx)})
        shards[safe(code) + ".json.gz"] = {"credential": cred, "courses": courses, "sources": srcs, "pairs": pairs}
    tiers = Counter(str(r["tier"]) for r in catalog)
    index = {
        "_about": ("The whole CPL-AI dataset (Activity 1.1.1) as read from %s on %s, hosted for COBI's Exhibits tab "
                   "(Sam, 2026-11-06). Frozen: the source publishes no further updates for now. Built by "
                   "kb/_build_cpl_ai_hosted.py from kb/_harvest_cpl_ai_reports.py's read." % (PAGE, fetched_at[:10])),
        "page": PAGE, "source": SOURCE, "fetched_at": fetched_at, "credit": CREDIT, "caveat": CAVEAT,
        "tiers": TIERS,
        "counts": {"pairs": len(catalog), "reports": len(catalog) - len(missing), "certifications": len(by_cred),
                   "colleges": len({r["college"] for r in catalog}), "courses": len({r["courseId"] for r in catalog}),
                   "by_tier": {k: tiers.get(k, 0) for k in TIERS}},
        "missing_reports": missing,
        "credentials": lines,
        "colleges": college_list,
    }
    return index, shards


def write(index, shards):
    sd = os.path.join(OUT, "shards")
    os.makedirs(sd, exist_ok=True)
    for name in os.listdir(sd):
        if name not in shards:
            os.remove(os.path.join(sd, name))
    for name, body in shards.items():
        raw = (json.dumps(body, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        with open(os.path.join(sd, name), "wb") as f:   # mtime 0: the same data writes the same bytes
            f.write(gzip.compress(raw, compresslevel=9, mtime=0))
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def check():
    index = json.load(open(os.path.join(OUT, "index.json"), encoding="utf-8"))
    bad = []
    if index.get("credit") != CREDIT or index.get("caveat") != CAVEAT:
        bad.append("credit or caveat altered")
    n = 0
    for line in index["credentials"]:
        p = os.path.join(OUT, "shards", line["file"])
        if not os.path.exists(p):
            bad.append("no shard " + line["file"])
            continue
        s = json.loads(gzip.decompress(open(p, "rb").read()).decode("utf-8"))
        if len(s["pairs"]) != line["pairs"]:
            bad.append("%s holds %d pairs, the index says %d" % (line["file"], len(s["pairs"]), line["pairs"]))
        if any(pr["course"] not in s["courses"] for pr in s["pairs"]):
            bad.append(line["file"] + " names a course it does not hold")
        n += len(s["pairs"])
    if sum(index["counts"]["by_tier"].values()) != index["counts"]["pairs"]:
        bad.append("the tier counts sum to %d, the pairs are %d" % (sum(index["counts"]["by_tier"].values()), index["counts"]["pairs"]))
    if n != index["counts"]["pairs"]:
        bad.append("the shards hold %d pairs, the catalog %d" % (n, index["counts"]["pairs"]))
    if bad:
        print("cpl-ai hosted: " + "; ".join(bad[:10]))
        return 1
    print("cpl-ai hosted ok: %d pairs in %d shards, %d with a full report, read %s"
          % (n, len(index["credentials"]), index["counts"]["reports"], index["fetched_at"][:10]))
    return 0


def main(argv):
    if "--check" in argv:
        return check()
    if not argv:
        print(__doc__)
        return 2
    raw = argv[0]
    cat_path = os.path.join(raw, "catalog.json")
    catalog = json.load(open(cat_path, encoding="utf-8"))
    reports = read_reports(os.path.join(raw, "reports.jsonl.gz"))
    from datetime import datetime, timezone
    fetched_at = datetime.fromtimestamp(os.path.getmtime(cat_path), timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    index, shards = build(catalog, reports, fetched_at)
    write(index, shards)
    c = index["counts"]
    print("cpl-ai hosted: %d pairs, %d certifications, %d colleges, %d courses; %d full reports (%d missing) -> %s"
          % (c["pairs"], c["certifications"], c["colleges"], c["courses"], c["reports"], len(index["missing_reports"]),
             os.path.relpath(OUT)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
