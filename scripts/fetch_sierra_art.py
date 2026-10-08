#!/usr/bin/env python3
"""fetch_sierra_art.py: copy Sierra's paintings from Wikimedia Commons into sierra/art/.

Sam, 2026-10-08: Sierra's landing cycles through First Light's California plein-air
paintings, the way America.gov cycles its photographs. The public page serves its own
copies, so a student's visit sends nothing to a third party and a blocked host never
leaves the card empty (First Light's greeting shows that failure in the sandbox).

Reads sierra/art/manifest.json; for each painting asks Commons' Special:FilePath for a
1920-pixel rendering (then 1280, then 960 if refused), and writes <slug>-1600.webp and
<slug>-800.webp (never wider than the source) plus fetched.json: the address, the
source size, each file's bytes and sha256, and the day. Runs on a GitHub runner
(.github/workflows/sierra-art-fetch.yml); the session's sandbox cannot reach Commons.

Usage, from the repo root: python3 scripts/fetch_sierra_art.py [--only SLUG]
"""
import argparse
import datetime as dt
import hashlib
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "sierra", "art")
UA = "CPL-Initiative-Sierra-art/1.0 (https://cpl-initiative.github.io/cpl-project-tracker/)"
ASK = (1920, 1280, 960)
OUT = (1600, 800)


def source_url(name, width):
    return ("https://commons.wikimedia.org/wiki/Special:FilePath/" +
            urllib.parse.quote(name) + "?width=" + str(width))


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), r.geturl()


def main(argv=None):
    from PIL import Image  # the runner installs Pillow
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only")
    a = ap.parse_args(argv)
    with open(os.path.join(ART, "manifest.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    log, bad = [], 0
    for p in manifest["paintings"]:
        if a.only and p["slug"] != a.only:
            continue
        data = final = None
        for w in ASK:
            try:
                data, final = get(source_url(p["file"], w))
                break
            except Exception as e:  # a refused width falls to the next
                print("  %s at %d: %s" % (p["slug"], w, e))
                time.sleep(2)
        if data is None:
            print("FAILED " + p["slug"])
            bad += 1
            continue
        img = Image.open(io.BytesIO(data)).convert("RGB")
        entry = {"slug": p["slug"], "from": final, "source_px": list(img.size),
                 "fetched": dt.date.today().isoformat(), "files": {}}
        for w in OUT:
            im = img if img.width <= w else img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "WEBP", quality=80, method=6)
            name = "%s-%d.webp" % (p["slug"], w)
            with open(os.path.join(ART, name), "wb") as f:
                f.write(buf.getvalue())
            entry["files"][name] = {"px": list(im.size), "bytes": len(buf.getvalue()),
                                    "sha256": hashlib.sha256(buf.getvalue()).hexdigest()[:16]}
        print("ok %s %s -> %s" % (p["slug"], img.size, ", ".join(
            "%s %d KB" % (k, v["bytes"] // 1024) for k, v in entry["files"].items())))
        log.append(entry)
        time.sleep(1)
    with open(os.path.join(ART, "fetched.json"), "w", encoding="utf-8") as f:
        json.dump({"paintings": log}, f, indent=1)
        f.write("\n")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
