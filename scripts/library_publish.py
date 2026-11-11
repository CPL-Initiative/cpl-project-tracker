#!/usr/bin/env python3
"""Publish the Library drafts a person approved on their card (library-publish.yml).

Sam, 2026-11-05 (SkyBarnard, in session): "Build it", on revising a visual from the Library
card without a session. library-revise-draft drafts a revision of a piece's public page into
cpl_library_drafts and sets regen.ready_at and regen.draft_id on the record. When a person
presses Replace the public copy (regen.approved_at), or asked for it at once when requesting
(regen.publish == "replace"), this script, in the workflow's scheduled run:

  --write    reads every such record and its draft with the service key, writes the draft to
             library/<slug>/index.html, and writes a receipt per piece under
             kb/receipts/library_publish/ holding the record's before-values and the update
             it will make (Rule 10 a2). The workflow commits the pages and receipts to main.
  --finish   with the pushed commit: stamps each draft published, then moves each record
             (the new version Current, the one before it Replaced, Changes to make emptied,
             regen cleared), each a guarded update on the updated_at it read, so an edit made
             on the card since the read wins and the record is left for the next run.

It writes no other file and no other table. A record whose page is not a Pages copy, or whose
draft is missing, is skipped and named. A NEW piece (regen.new_piece, drafted on its card from the
starter page; Sam, 2026-11-10) has no copy yet: --write makes library/<slug>/ for it, and the update
makes it Version 1, filed on the web at its Pages address, a Requested record moving to Draft. Test: tests/library_publish_test.py.

    SUPABASE_SERVICE_KEY=... python3 scripts/library_publish.py --write
    SUPABASE_SERVICE_KEY=... python3 scripts/library_publish.py --finish --commit <sha>
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/"
RECEIPTS = ROOT / "kb" / "receipts" / "library_publish"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
BOT = "library-publish@bot"


# ── pure ──────────────────────────────────────────────────────────────────────
def due(record):
    """A record whose approved draft from the card waits to be published."""
    g = record.get("regen") if isinstance(record.get("regen"), dict) else None
    if not g or not g.get("draft_id") or not g.get("ready_at"):
        return False
    return bool(g.get("approved_at")) or g.get("publish") == "replace"


def next_version(record):
    v = str(record.get("version") or "").strip()
    return int(v) + 1 if v.isdigit() else None


# Fix 3 (Sam, 2026-11-05: "build fixes 1-3"): a draft the card's model made edits the page, never the script
# that builds it, so publishing one leaves that script behind the public copy. The version it makes carries
# source_behind, and the card's Needs attention counts it until a version built from the source replaces it.
SCRIPT = re.compile(r"\.py\b|\.mjs\b|\.js\b|build")


def source_behind(record, draft):
    """True when the model drafted the page and the record names a script that rebuilds it. Pure.
    scripts/library_page.py only copies a page to Pages, so naming it alone is no build script."""
    rb = re.sub(r"\S*library_page\.py", "", str(record.get("rebuild_from") or ""))
    return bool(draft.get("model")) and bool(SCRIPT.search(rb))


# The second gate on a new piece's page (COBIx on #3077): the drafter's allowlist (new_page.mjs mainProblems), run
# again on the stored draft before --write, so a draft altered after the drafter checked it is still refused. Pure.
ALLOWED_TAGS = {"main", "div", "section", "h1", "h2", "h3", "h4", "p", "ol", "ul", "li", "a", "strong", "em", "span",
                "br", "b", "i"}
_TAG = re.compile(r"^<(/?)([a-z][a-z0-9]*)((?:\s[^<>]*)?)>$")
_ATTR = re.compile(r'\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"<>]*)"')


def _decode(v):
    import html as _h
    return re.sub(r"[\x00-\x20\x7f-\x9f]", "", _h.unescape(v))


def main_problems(page):
    """What a new piece's <main> carries outside the allowlist; [] when it is clean. Pure."""
    m = re.search(r'<main\b[^>]*\bid="main"[^>]*>[\s\S]*</main>', page or "")
    if not m:
        return ['no <main id="main">']
    body, out, stack, i = m.group(0), [], [], 0
    while i < len(body):
        lt = body.find("<", i)
        if ">" in body[i:lt if lt >= 0 else len(body)]:
            out.append("a stray >"); break
        if lt < 0:
            break
        gt = body.find(">", lt)
        if gt < 0:
            out.append("an unclosed tag"); break
        tag, i = body[lt:gt + 1], gt + 1
        t = _TAG.match(tag)
        if not t:
            out.append("markup that is not a plain tag"); continue
        close, name, attrs = t.group(1), t.group(2), t.group(3)
        if name not in ALLOWED_TAGS:
            out.append("the tag <%s>" % name); continue
        if close:
            if attrs.strip():
                out.append("a closing tag with attributes")
            if (stack.pop() if stack else None) != name:
                out.append("tags that do not nest")
            continue
        rest = re.sub(r"\s*/?\s*$", "", attrs)
        pos = 0
        while pos < len(rest):
            a = _ATTR.match(rest, pos)
            if not a:
                out.append("an attribute that is not name=\"value\""); break
            pos = a.end()
            an, av = a.group(1).lower(), a.group(2)
            if an in ("class", "id"):
                if not re.match(r"^[A-Za-z0-9 _-]*$", av):
                    out.append("an odd %s" % an)
            elif re.match(r"^aria-[a-z]+$", an):
                pass
            elif an == "href" and name == "a":
                if not re.match(r"^(https://|mailto:)", _decode(av), re.I):
                    out.append("a link that is not https: or mailto:")
            elif an == "target" and name == "a":
                if av != "_blank":
                    out.append("a target other than _blank")
            elif an == "rel" and name == "a":
                if not re.match(r"^[a-z ]+$", av):
                    out.append("an odd rel")
            else:
                out.append("the attribute %s" % an)
        if name != "br" and not attrs.rstrip().endswith("/"):
            stack.append(name)
    if stack:
        out.append("tags left open")
    return sorted(set(out))


# A revision may not add risky markup (COBIx on #3077): the same count as apply_edits.mjs riskCounts, run on the draft
# against the page it replaces, before --write. Pure.
_RISKS = {
    "a script": r"<script\b",
    "an event handler": r"[\s/\"']on[a-z]+\s*=",
    "a frame, object, embed, form, meta, base, link, style, svg or math element":
        r"<(iframe|frame|object|embed|form|meta|base|link|style|svg|math|template)\b",
    "a srcdoc or style attribute": r"[\s/\"'](srcdoc|style)\s*=",
    "a CSS url(, @import, image-set(, src(, @font-face, escape or entity in a style":
        r"url\s*\(|@import\b|image-set\s*\(|\bsrc\s*\(|@font-face\b|\\|style\s*=\s*\"[^\"]*&",
}


def risk_counts(page):
    s, out = page or "", {}
    for k, rx in _RISKS.items():
        out[k] = len(re.findall(rx, s, re.I))
    bad = 0
    for m in re.finditer(r"(href|src|action|formaction|xlink:href)\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", s, re.I):
        v = m.group(2).strip("\"'")
        if re.match(r"^(javascript|data|vbscript):", _decode(v), re.I):
            bad += 1
    out["a javascript:, data: or vbscript: address"] = bad
    return out


_PIECES = [
    r"<script\b[\s\S]*?(?:</script\s*>|$)",
    r"<(?:iframe|frame|object|embed|form|meta|base|link|svg|math|template)\b[^>]*>",
    r"[\s/\"']on[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",
    r"[\s/\"'](?:src|srcdoc|action|formaction|xlink:href)\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",
]


def frozen_pieces(page):
    """The page's executable parts, as apply_edits.mjs frozenPieces finds them. Pure."""
    out = []
    for rx in _PIECES:
        out += [re.sub(r"^[\s/\"']", "", m.group(0)) for m in re.finditer(rx, page or "", re.I)]
    return out


def new_pieces(before, after):
    from collections import Counter
    have = Counter(frozen_pieces(before))
    out = []
    for p in frozen_pieces(after):
        if have[p]:
            have[p] -= 1
        else:
            out.append(p)
    return out


def added_risks(before, after):
    b, a = risk_counts(before), risk_counts(after)
    out = [k for k in a if a[k] > b.get(k, 0)]
    if new_pieces(before, after) and not out:
        out.append("a change to a script, handler or source the page already had (a session makes that change: Copy the request)")
    return out


# ── Pictures (Sam, 2026-11-11) ────────────────────────────────────────────────
# A page may carry one kind of figure: the fixed form pictures.mjs builds from a row of cpl_library_pictures. Its
# address is a file beside the page (img/<n>.webp or .png), which this script writes from the row when it publishes.
# The checks above run on the page with those figures taken out, so any other image or source is still refused.
FIGURE = re.compile(r'<figure class="shot"><a href="img/(\d{1,2})\.(webp|png)" target="_blank" rel="noopener">'
                    r'<img src="img/\1\.\2" alt="([^"<>]*)" width="\d{1,5}" height="\d{1,5}" loading="lazy"></a></figure>')
_EXT = {"image/webp": "webp", "image/png": "png"}
MAX_PICTURE_BYTES = 1_100_000


def unstamp(page):
    """The page without the ?v=<hash> stamps GitHub Pages adds to local scripts and styles (apply_edits.mjs unstamp).
    A draft made from a page read off Pages could carry one; the repo's file never does. Pure."""
    return re.sub(r"(\.(?:js|mjs|css))\?v=[0-9a-f]{6,16}(?=[\"'])", r"\1", page or "")


def strip_figures(page):
    return FIGURE.sub("", page or "")


def picture_bytes(row):
    """The row's picture as bytes, or None when it is not the WebP or PNG it says it is. Pure."""
    import base64
    import binascii
    try:
        b = base64.b64decode(row.get("data") or "", validate=True)
    except (binascii.Error, ValueError):
        return None
    if not b or len(b) > MAX_PICTURE_BYTES:
        return None
    if row.get("mime") == "image/webp":
        return b if b[:4] == b"RIFF" and b[8:12] == b"WEBP" else None
    if row.get("mime") == "image/png":
        return b if b[:8] == b"\x89PNG\r\n\x1a\n" else None
    return None


def place_pictures(page, pictures):
    """The page with each figure matched to its row, and the files to write beside it. A figure whose picture was
    left out, is missing, or is not the type the figure names is dropped. -> (page, {"img/3.webp": bytes}). Pure."""
    by_n = {int(p["n"]): p for p in (pictures or []) if isinstance(p, dict) and not p.get("left_out")}
    files = {}

    def one(m):
        n, ext = int(m.group(1)), m.group(2)
        p = by_n.get(n)
        if not p or _EXT.get(p.get("mime")) != ext:
            return ""
        b = picture_bytes(p)
        if b is None:
            return ""
        files[f"img/{n}.{ext}"] = b
        w, h = int(p.get("width") or 0), int(p.get("height") or 0)
        if not (0 < w < 100000 and 0 < h < 100000):
            return m.group(0)
        return (f'<figure class="shot"><a href="img/{n}.{ext}" target="_blank" rel="noopener">'
                f'<img src="img/{n}.{ext}" alt="{m.group(3)}" width="{w}" height="{h}" loading="lazy"></a></figure>')

    return FIGURE.sub(one, page or ""), files


def pictures_checked(record):
    """True when the approval says who looked at the pictures (COBIx on #3095: the card's tick box was the only
    gate). A draft carrying figures is published only with it. Pure."""
    g = record.get("regen") if isinstance(record.get("regen"), dict) else {}
    return bool(str(g.get("pictures_checked_by") or "").strip()) and bool(g.get("pictures_checked_at"))


def stale_pictures(folder, files):
    """Picture files in a page's img/ folder that the page being written no longer shows (COBIx on #3095: a picture
    left out after publishing stayed served at its address). -> the paths to delete."""
    img = folder / "img"
    if not img.is_dir():
        return []
    keep = {name.split("/", 1)[1] for name in files}
    return sorted(p for p in img.iterdir() if p.is_file() and re.match(r"^\d{1,2}\.(webp|png)$", p.name) and p.name not in keep)


def is_new_piece(record):
    g = record.get("regen") if isinstance(record.get("regen"), dict) else {}
    return bool(g.get("new_piece"))


def record_update(record, draft, today):
    """The update that makes the draft the record's current version. Pure."""
    g = record["regen"]
    n = 1 if is_new_piece(record) and not record.get("version") else next_version(record)
    label = f"Version {n}" if n else "Revised " + today
    versions = [dict(x) for x in (record.get("versions") or []) if isinstance(x, dict)]
    versions = [x for x in versions if not (x.get("label") == label and str(x.get("status", "")).startswith("Draft"))]
    for x in versions:
        if x.get("status") == "Current":
            x["status"] = "Replaced by " + (f"v{n}" if n else label)
    who = g.get("approved_by") or g.get("requested_by") or "the team"
    note = (draft.get("summary") or "Revised from the card.").strip()
    verb = "published the first public copy" if is_new_piece(record) else "replaced the public copy"
    entry = {"url": PAGES + record["slug"] + "/", "date": today, "label": label,
             "status": f"Current: {note} Drafted from the card by {draft.get('made_by') or 'the team'} "
                       f"(draft {draft['id']}); {verb} on {who}'s approval."}
    if source_behind(record, draft):
        entry["source_behind"] = True
    versions.append(entry)
    out = {"versions": versions, "refresh_note": None, "regen": None, "updated_by": BOT,
           "url": PAGES + record["slug"] + "/"}
    if n:
        out["version"] = str(n)
    if is_new_piece(record):
        out.update({"home": "web", "file_type": "html"})
        if record.get("status") in (None, "requested"):
            out["status"] = "draft"
        if not record.get("made_on"):
            out["made_on"] = today
    return out


def receipt(record, draft, update, today):
    keys = sorted(set(update) | {"updated_at"})
    return {"_about": "Library publish receipt (scripts/library_publish.py): the record's before-values and the update "
                      "--finish makes, guarded on updated_at; cpl_library_history also files the prior row. Roll back by "
                      "writing the before-values and reverting the page's commit.",
            "at": today, "slug": record["slug"], "record_id": record["id"], "draft_id": draft["id"],
            "page": f"library/{record['slug']}/index.html",
            "before": {k: record.get(k) for k in keys}, "update": update}


# ── I/O ───────────────────────────────────────────────────────────────────────
def api(path, method="GET", body=None, headers=None):
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_KEY (the service role key).")
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
         "Prefer": "return=representation"}
    h.update(headers or {})
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", method=method, headers=h,
                                 data=None if body is None else json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode()
        return json.loads(t) if t else None


def write_phase(today):
    rows = api("cpl_library?select=id,slug,title,url,version,versions,refresh_note,rebuild_from,regen,updated_at,status,made_on,home,file_type"
               "&regen=not.is.null&retired_at=is.null")
    done, skipped = [], []
    for r in rows:
        if not due(r):
            continue
        if not SLUG.match(r.get("slug") or ""):
            skipped.append(f"{r.get('slug')}: not a Pages address")
            continue
        page = ROOT / "library" / r["slug"] / "index.html"
        if not page.exists() and not is_new_piece(r):
            skipped.append(f"{r.get('slug')}: no Pages copy at library/<slug>/")
            continue
        if page.exists() and is_new_piece(r) and not r.get("url"):
            skipped.append(f"{r['slug']}: a new piece whose folder library/{r['slug']}/ already holds another page")
            continue
        did = urllib.parse.quote(r["regen"]["draft_id"])
        d = api(f"cpl_library_drafts?id=eq.{did}&library_id=eq.{r['id']}&select=id,slug,html,summary,made_by,model,published_at")
        if not d:
            skipped.append(f"{r['slug']}: draft {r['regen']['draft_id']} not found")
            continue
        d = d[0]
        d["html"] = unstamp(d.get("html") or "")
        files = {}
        if FIGURE.search(d.get("html") or ""):
            pics = api(f"cpl_library_pictures?library_id=eq.{r['id']}&select=n,mime,data,width,height,left_out") or []
            d["html"], files = place_pictures(d["html"], pics)
            if files and not pictures_checked(r):
                skipped.append(f"{r['slug']}: draft {d['id']} carries pictures and its approval does not say who checked them")
                continue
        if is_new_piece(r):
            bad = main_problems(strip_figures(d.get("html") or ""))
            if bad:
                skipped.append(f"{r['slug']}: draft {d['id']} refused, its page carries " + ", ".join(bad))
                continue
        else:
            bad = added_risks(strip_figures(page.read_text(encoding="utf-8")), strip_figures(d.get("html") or ""))
            if bad:
                skipped.append(f"{r['slug']}: draft {d['id']} refused, it adds " + ", ".join(bad))
                continue
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(d["html"], encoding="utf-8")
        for name, data in sorted(files.items()):
            out = page.parent / name
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(data)
        for old in stale_pictures(page.parent, files):
            old.unlink()
        up = record_update(r, d, today)
        RECEIPTS.mkdir(parents=True, exist_ok=True)
        (RECEIPTS / f"{today}-{r['slug']}.json").write_text(
            json.dumps(receipt(r, d, up, today), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        done.append(r["slug"])
    print(json.dumps({"published": done, "skipped": skipped}))
    return 0


def finish_phase(today, commit):
    if not re.match(r"^[0-9a-f]{7,40}$", commit or ""):
        sys.exit("--finish needs --commit <sha>")
    left = []
    for p in sorted(RECEIPTS.glob(f"{today}-*.json")):
        rc = json.loads(p.read_text(encoding="utf-8"))
        api(f"cpl_library_drafts?id=eq.{rc['draft_id']}&published_at=is.null", "PATCH",
            {"published_at": datetime.now(timezone.utc).isoformat(), "published_commit": commit})
        guard = urllib.parse.quote(rc["before"]["updated_at"])
        got = api(f"cpl_library?id=eq.{rc['record_id']}&updated_at=eq.{guard}", "PATCH", rc["update"])
        if not got:
            left.append(rc["slug"])
    print(json.dumps({"finished": today, "left_for_next_run": left}))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--finish", action="store_true")
    ap.add_argument("--commit")
    ap.add_argument("--date", default=datetime.now(timezone.utc).date().isoformat())
    a = ap.parse_args(argv)
    if a.write:
        return write_phase(a.date)
    if a.finish:
        return finish_phase(a.date, a.commit)
    ap.error("--write or --finish")


if __name__ == "__main__":
    sys.exit(main())
