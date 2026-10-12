#!/usr/bin/env python3
"""fetch_gallery_thumbs.py: small thumbnails for the First Light painting gallery.

Sam, 2026-10-12: "build the painting gallery", to curate First Light's set and add
more California plein air paintings. The gallery is a Claude artifact, and an
artifact cannot load an image from Wikimedia Commons, so the page ships its own
thumbnails. The session's sandbox cannot reach Commons; a runner can
(.github/workflows/first-light-gallery-thumbs.yml), as scripts/fetch_sierra_art.py does.

Reads tools/first_light_selection.json (the current set), sierra/art/manifest.json
(the paintings Sierra's landing cycles) and tools/first_light_candidates.json (the
verified public-domain pool), keeps the candidates in the categories that
tools/first_light_gallery/california.json names, and for each painting asks
Commons' Special:FilePath for a 360-pixel rendering. Writes
tools/first_light_gallery/thumbs/<key>.webp (240 pixels wide) and
tools/first_light_gallery/index.json: one row per painting with its key, file,
title, artist, year, collection, category, whether First Light and Sierra show it
now, and the Commons page. A painting whose thumbnail fails stays in the index
with "thumb": null, so the gallery can still list it.

Usage, from the repo root: python3 scripts/fetch_gallery_thumbs.py [--limit N]
"""
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")
OUT = os.path.join(TOOLS, "first_light_gallery")
THUMBS = os.path.join(OUT, "thumbs")
UA = "CPL-Initiative-painting-gallery/1.0 (https://cpl-initiative.github.io/cpl-project-tracker/)"
WIDTH = 240


def key_for(file_name):
    return hashlib.sha1(file_name.encode("utf-8")).hexdigest()[:12]


def file_path_url(file_name, width):
    return ("https://commons.wikimedia.org/wiki/Special:FilePath/"
            + urllib.parse.quote(file_name) + "?width=%d" % width)


def page_url(file_name):
    return "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(file_name.replace(" ", "_"))


def year_of(raw):
    """The first four-digit year a Commons date string names, or the string trimmed."""
    m = re.search(r"\b(1[5-9]\d\d)\b", raw or "")
    if m:
        circa = re.search(r"\b(c\.|circa|ca\.|about)\s*" + m.group(1), raw or "", re.I)
        return ("c. " if circa else "") + m.group(1)
    return (raw or "").split("date QS")[0].strip()[:24]


def title_of(c):
    t = (c.get("object") or c.get("desc") or "").strip().strip('"')
    if not t:
        t = os.path.splitext(c["file"])[0]
    # "Brittany Boats, by Edgar Alwin Payne" reads as the title plus its byline.
    t = re.sub(r",?\s+by\s+%s\s*$" % re.escape(c.get("artist") or "~"), "", t, flags=re.I)
    return t[:120]


def fetch(url, tries=4):
    delay = 2.0
    for i in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < tries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise
        except Exception:
            if i < tries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise


def to_webp(data):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, max(1, round(im.height * WIDTH / im.width))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=62, method=6)
    return buf.getvalue(), im.width, im.height


def main():
    limit = 0
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    selection = json.load(open(os.path.join(TOOLS, "first_light_selection.json")))
    sierra = json.load(open(os.path.join(ROOT, "sierra", "art", "manifest.json")))["paintings"]
    pool = json.load(open(os.path.join(TOOLS, "first_light_candidates.json")))["candidates"]
    california = set(json.load(open(os.path.join(OUT, "california.json")))["categories"])
    on_sierra = {p["file"] for p in sierra}
    by_file = {c["file"]: c for c in pool}

    rows, seen = [], set()
    for s in selection:
        c = by_file.get(s["file"], {})
        rows.append({"file": s["file"], "title": s.get("title"), "artist": s.get("artist"),
                     "year": s.get("year"), "museum": s.get("museum"),
                     "category": c.get("category"), "in_first_light": True,
                     "on_sierra": s["file"] in on_sierra})
        seen.add(s["file"])
    for c in pool:
        if c["category"] not in california or c["file"] in seen:
            continue
        rows.append({"file": c["file"], "title": title_of(c), "artist": c.get("artist"),
                     "year": year_of(c.get("year")), "museum": (c.get("credit") or "")[:80],
                     "category": c["category"], "in_first_light": False, "on_sierra": False,
                     "size": [c.get("width"), c.get("height")]})
        seen.add(c["file"])
    if limit:
        rows = rows[:limit]

    os.makedirs(THUMBS, exist_ok=True)
    ok = failed = kept = 0
    for i, row in enumerate(rows, 1):
        key = key_for(row["file"])
        row["key"] = key
        row["page"] = page_url(row["file"])
        path = os.path.join(THUMBS, key + ".webp")
        if os.path.exists(path):
            from PIL import Image
            with Image.open(path) as im:
                row["thumb"] = {"w": im.width, "h": im.height}
            kept += 1
            continue
        try:
            data, w, h = to_webp(fetch(file_path_url(row["file"], 360)))
            with open(path, "wb") as f:
                f.write(data)
            row["thumb"] = {"w": w, "h": h}
            ok += 1
        except Exception as e:  # the row stays listed without a picture
            row["thumb"] = None
            row["error"] = str(e)[:160]
            failed += 1
        if i % 25 == 0:
            print("  %d of %d (%d fetched, %d kept, %d failed)" % (i, len(rows), ok, kept, failed), flush=True)
        time.sleep(float(os.environ.get("THUMB_DELAY", "0.35")))

    index = {
        "_note": "Generated by scripts/fetch_gallery_thumbs.py on a runner. One row per painting the gallery "
                 "shows: First Light's current selection (in_first_light), the paintings Sierra's landing "
                 "cycles (on_sierra), and the candidates in tools/first_light_gallery/california.json. Thumbnails "
                 "are thumbs/<key>.webp, %d pixels wide; key is the first 12 hex of sha1(file)." % WIDTH,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "counts": {"rows": len(rows), "in_first_light": sum(r["in_first_light"] for r in rows),
                   "on_sierra": sum(r["on_sierra"] for r in rows),
                   "candidates": sum(not r["in_first_light"] for r in rows),
                   "fetched": ok, "kept": kept, "failed": failed},
        "paintings": rows,
    }
    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump(index, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(json.dumps(index["counts"]))


if __name__ == "__main__":
    main()
