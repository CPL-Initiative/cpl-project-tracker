#!/usr/bin/env python3
"""The Library's accessibility check run, the footer it writes, and listing on a pass (#3560 part 2; S688).

Sam's go of Nov 19, 2026 (8:23 AM PT, relayed by COBIx on #3560): "Nothing gets Publish it or List publicly until its
accessibility checks pass." Every Library page "carries a footer line generated from that piece's own check record,
never boilerplate", naming the standard, the check date, the tool or reviewer and a link to the check record; a piece
not yet re-checked reads "Not yet certified". His 8:55 AM decisions: the only gate on the Public Library is the passing
check record, and no approval from Sam.

library-publish.yml runs this after --finish has moved the records it published:

  --plan  --finished F --out P   which pages to check, written to P: every page --finish moved (F), and every
                                 Library page whose content on disk differs from the sha its latest check's committed
                                 proof recorded, or that has no such proof (never checked, checked before proofs, or
                                 changed by hand at the same url and version); P also names the pages whose version
                                 label no check record can carry. Prints the count for the workflow.
  --check --plan-file P          for each page in P: a listed piece whose content no longer matches its latest passing
                                 check comes off the Public Library first (a guarded update, before-values in the
                                 receipt, publish_target kept 'public'); then it writes the line the page will carry if
                                 it passes, runs the one engine (scripts/a11y.js with scripts/library_check.config.js,
                                 Light and Dark), writes a plain-words report beside the page, and inserts ONE row per
                                 page into cpl_library_checks with the service key. The receipt (kb/receipts/
                                 library_checks/) is written at once, every Library page's line is rewritten from the
                                 rows actually written, and the output names each passing piece waiting to be listed.
                                 It lists nothing.
  --list  --check-file C         run only after the commit carrying the reports and lines is pushed: lists each piece C
                                 names whose publish_target is 'public', that holds a public summary a person typed,
                                 and whose latest check passed with a committed proof matching its page, with an update
                                 guarded on the record as read (Rule 10); each listing's before-values go into its own
                                 receipt before its update.

The line binds to the page's content (the S688 conductor, third round on #3581): each check records the sha256 of the
page it checked, the accessibility line taken out (content_hash), in a small JSON beside its report with the check
row's id, key and url. A pass line is printed only when the record's latest check (its current key and url, no earlier
than page_changed_at) has that committed record and its sha equals the page on disk now. Any other page, a page
rebuilt or left by --finish included, reads Not yet certified.

The run writes no other table, and only the service role inserts a check (the table's RLS), so the Library tab never
certifies a piece. Test: tests/library_check_test.py; the footer in a browser: tests/library_check_footer.test.js.
"""
import argparse
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import library_publish as lp  # noqa: E402

ROOT = lp.ROOT
PAGES = lp.PAGES
SITE = PAGES.rsplit("library/", 1)[0]   # the Pages site a report beside a page is served from
RECEIPTS = ROOT / "kb" / "receipts" / "library_checks"
BOT = "library-check@bot"
# The CPL Initiative's row as kb/migrations/2026-11-19_library_publishing_model.sql seeds it, for a division with no
# row and for --write, which stamps "Not yet certified" before any check runs.
DEFAULT_SETTINGS = {"division": "cobi", "standard": "WCAG 2.1 AA and Section 508",
                    "reviewer_or_tool": "axe-core automated check",
                    "footer_template": "Accessibility: {standard}, checked {date}, report linked.",
                    "not_certified": "Accessibility: Not yet certified."}

# ── The footer line ───────────────────────────────────────────────────────────────────────────────────────────────
# One marked block, before the Ask Sierra chip's script (which stays last in <body>, tests/library_pages.test.js),
# else before </body>. Its colors are the public header's tokens, which every Library page carries for Light and Dark,
# with inherit as the fallback; the link is an underlined word. No glyph, no style attribute and no backslash, so
# library_publish.py's risk counts read it the same before and after a revision.
START = "<!-- cpl-library-check: one line from this piece's own accessibility check record (scripts/library_check.py) -->"
END = "<!-- /cpl-library-check -->"
BLOCK = re.compile(r"<!-- cpl-library-check:[\s\S]*?<!-- /cpl-library-check -->\n?")
STYLE = ("<style>.cpl-check-line{max-width:var(--cpl-measure,none);margin:24px auto 0;padding:0 16px 24px;"
         "font-size:.875rem;line-height:1.5;text-align:center;color:var(--cplh-muted,inherit)}"
         ".cpl-check-line a{color:var(--cplh-link,inherit);text-decoration:underline}</style>")
SIERRA_MARK = "<!-- Ask Sierra:"


def settings_for(record, settings):
    d = (record or {}).get("division") or "cobi"
    return (settings or {}).get(d) or (settings or {}).get("cobi") or DEFAULT_SETTINGS


def page_key(record):
    """The version key a check of the record's page carries: library.js checkKey()'s page half. Pure."""
    v = str((record or {}).get("version") or "").strip()
    return "version:" + v if v else "page"


def pages_url(slug):
    return PAGES + slug + "/"


def on_pages(record, root=None):
    """True when the record names its own Pages copy and the copy is in the checkout."""
    slug, root = (record or {}).get("slug") or "", root or ROOT
    return bool(lp.SLUG.match(slug)) and record.get("url") == pages_url(slug) and \
        (Path(root) / "library" / slug / "index.html").exists()


def _ts(v):
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def latest_check(checks, record):
    """The newest check of the record's page: its id, its version key, its current url, and no earlier than the page
    last changed (cpl_library.page_changed_at, when the column is there). None when there is none. Pure."""
    if not record or not record.get("url"):
        return None
    key, url, since = page_key(record), record["url"], _ts(record.get("page_changed_at"))
    hit = [c for c in (checks or []) if c.get("library_id") == record.get("id") and c.get("version_key") == key
           and c.get("url") == url and c.get("result") in ("pass", "fail") and _ts(c.get("checked_at"))
           and (since is None or _ts(c["checked_at"]) >= since)]
    if not hit:
        return None
    return max(hit, key=lambda c: (_ts(c["checked_at"]), str(c.get("created_at") or "")))


def latest_pass(checks, record):
    """The newest passing check of the record's page (latest_check's key, url and page_changed_at rule), or None. Pure."""
    return latest_check([c for c in (checks or []) if c.get("result") == "pass"], record)


def drift_unlists(record, checks, page):
    """True when a listed piece comes off the Public Library before its new check: it has a passing check of its page
    and that pass no longer speaks for the page on disk (certified_check). A legacy listing, one with no passing check
    at its current key and url (every listing before the check run, d-library-legacy-listings-stay-s688), stays listed
    with its Not yet certified line whatever its first check finds; from its first pass on, this rule applies."""
    return bool(record and record.get("public_listed") and latest_pass(checks, record)
                and not certified_check(record, checks, page))


def fmt_date(iso):
    """Nov 19, 2026: the check's date in California, where the team reads it. Pure."""
    t = _ts(iso)
    if not t:
        return ""
    try:
        from zoneinfo import ZoneInfo
        t = t.astimezone(ZoneInfo("America/Los_Angeles"))
    except Exception:  # noqa: BLE001 — no tz database: the UTC date is still a true date
        t = t.astimezone(timezone.utc)
    return t.strftime("%b ") + str(t.day) + t.strftime(", %Y")


def footer_line(check, settings):
    """The footer's inner HTML from one check record, or the division's Not yet certified wording when the latest
    check is missing or did not pass. {standard}, {date} and {reviewer} come from the check; {report} is the linked
    word "report". A template with no {report} links its words "report linked" when it has them, as the CPL
    Initiative's does, and otherwise adds "Check record" as the link. Pure."""
    s = settings or DEFAULT_SETTINGS
    if not check or check.get("result") != "pass":
        return html.escape(s.get("not_certified") or DEFAULT_SETTINGS["not_certified"], quote=False)
    tpl = s.get("footer_template") or DEFAULT_SETTINGS["footer_template"]
    report = check.get("report_url") or ""
    if not re.match(r"^https://[^\s\"'<>]+$", report):
        report = ""
    out = html.escape(tpl, quote=False)
    for k, v in (("standard", check.get("standard") or s.get("standard")), ("date", fmt_date(check.get("checked_at"))),
                 ("reviewer", check.get("tool_or_reviewer") or s.get("reviewer_or_tool"))):
        out = out.replace("{" + k + "}", html.escape(str(v or ""), quote=False))
    a = lambda words: '<a href="%s">%s</a>' % (html.escape(report, quote=True), words)  # noqa: E731
    if "{report}" in out:
        return out.replace("{report}", a("report") if report else "report")
    if report and "report linked" in out:
        return out.replace("report linked", a("report linked"), 1)
    return out + (" " + a("Check record") if report else "")


def footer_block(check, settings):
    return (START + "\n" + '<div class="cpl-check-line">' + STYLE + "<p>" + footer_line(check, settings) + "</p></div>\n"
            + END + "\n")


def stamp(page, block):
    """The page with its one footer block replaced, or added before the Ask Sierra script or </body>. Pure."""
    page = BLOCK.sub("", page or "")
    for mark in (SIERRA_MARK, "</body>"):
        i = page.rfind(mark)
        if i >= 0:
            # A block of its own lines: start it on a fresh line.
            pre = page[:i]
            if pre and not pre.endswith("\n"):
                pre += "\n"
            return pre + block + page[i:]
    return page + ("" if page.endswith("\n") or not page else "\n") + block


def content_hash(page):
    """sha256 of the page with its accessibility line taken out: what a check vouches for. The one function both
    writers use (this script and scripts/library_page.py). Pure."""
    import hashlib
    return hashlib.sha256(BLOCK.sub("", page or "").encode("utf-8")).hexdigest()


def proof_rel(report_url):
    """The committed JSON beside a check's report, from the report's Pages address; "" when it is not one of ours."""
    rel = (report_url or "")[len(SITE):] if (report_url or "").startswith(SITE) else ""
    return rel[:-4] + ".json" if re.match(r"^library/[a-z0-9-]+/accessibility/[0-9]{8}-[0-9]{6}Z\.txt$", rel) else ""


def proof_of(check, root=None):
    try:
        f = Path(root or ROOT) / proof_rel((check or {}).get("report_url"))
        return json.loads(f.read_text(encoding="utf-8")) if proof_rel((check or {}).get("report_url")) and f.is_file() else None
    except (OSError, ValueError):
        return None


def certified_check(record, checks, page, root=None):
    """The check a page's line may print as a pass, or None: the record's latest check (latest_check: its current key
    and url, no earlier than page_changed_at) passed, its committed proof names that check, key and url, and the proof's
    sha equals the page as it is now."""
    c = latest_check(checks, record)
    if not c or c.get("result") != "pass":
        return None
    pr = proof_of(c, root)
    if not pr or pr.get("check_id") != c.get("id") or pr.get("version_key") != c.get("version_key") \
            or pr.get("url") != c.get("url") or pr.get("sha256") != content_hash(page):
        return None
    return c


def footer_of(page):
    m = BLOCK.search(page or "")
    return m.group(0) if m else ""


# ── What to check ─────────────────────────────────────────────────────────────────────────────────────────────────
def waits_to_list(record):
    return bool(record and record.get("publish_target") == "public" and not record.get("public_listed")
                and not record.get("retired_at"))


# The key and url shapes cpl_library_checks accepts (its version_key and url checks): a row outside them would refuse
# the whole batch insert, so such a page is skipped with its reason and the rest go in.
KEY_OK = re.compile(r"^(draft:[0-9a-f-]{36}|version:[A-Za-z0-9 ._-]{1,40}|page)$")


def row_problem(record):
    """Why the record's page cannot carry a check record, or "" when it can. Pure."""
    if not KEY_OK.match(page_key(record)):
        return ("its version label, %s, cannot carry a check record: use up to 40 letters, digits, spaces, dots, "
                "dashes or underscores" % str(record.get("version") or "").strip())
    u = record.get("url") or ""
    if not u.startswith("https://") or len(u) > 2000:
        return "its address is not an https address of up to 2,000 characters"
    return ""


def drifted(record, checks, root=None):
    """True when the page on disk is not the page its latest check saw: no latest check (current key and url, no earlier
    than page_changed_at), no committed proof for it, or a proof whose sha differs from the page's content_hash now. A
    failed check whose page has not changed is not drift, so a failed page waits for new content."""
    c = latest_check(checks, record)
    pr = proof_of(c, root) if c else None
    if not pr or pr.get("check_id") != c.get("id"):
        return True
    page = (Path(root or ROOT) / "library" / record["slug"] / "index.html").read_text(encoding="utf-8")
    return pr.get("sha256") != content_hash(page)


def plan(records, checks, moved, root=None):
    """The slugs to check: every page --finish moved this run, then every Library page whose content drifted from its
    latest check's proof (drifted). Only a page this checkout holds, at the address its record names, and whose version
    label a check record can carry."""
    moved, out = set(moved or []), []
    for r in sorted(records or [], key=lambda x: x.get("slug") or ""):
        if r.get("retired_at") or not on_pages(r, root) or row_problem(r):
            continue
        if r["slug"] in moved or drifted(r, checks, root):
            out.append(r["slug"])
    return out


def skipped(records, moved, root=None):
    """The pages the plan would check but for a version label or address no check record can carry. Pure."""
    moved, out = set(moved or []), []
    for r in sorted(records or [], key=lambda x: x.get("slug") or ""):
        if r.get("retired_at") or not on_pages(r, root):
            continue
        why = row_problem(r)
        if why and (r["slug"] in moved or waits_to_list(r) or r.get("public_listed")):
            out.append({"slug": r["slug"], "why": why})
    return out


def report_rel(slug, at):
    return "library/%s/accessibility/%s.txt" % (slug, at.strftime("%Y%m%d-%H%M%SZ"))


def report_text(record, key, url, settings, res, engine, run_url, at):
    """The check report beside the page, in plain words. Pure."""
    lines = ["Accessibility check of a CPL Library page", "",
             "Piece: %s" % (record.get("title") or record.get("slug")),
             "Page: %s" % url, "Version: %s" % key,
             "Standard: %s" % settings.get("standard"),
             "Reviewer or tool: %s" % settings.get("reviewer_or_tool"),
             "Engine: scripts/a11y.js, the same check npm run a11y runs: contrast of every painted pair, target size, "
             "headings, focus, reduced motion and sideways scroll at %s px in Light and at 390 and 1280 px in Dark; and "
             "axe-core %s with the rules tagged %s." % (", ".join(str(w) for w in (engine.get("widths") or [])),
                                                        (engine.get("axe") or {}).get("version") or "(not run)",
                                                        ", ".join((engine.get("axe") or {}).get("tags") or [])),
             "Checked: %s UTC" % at.strftime("%Y-%m-%d %H:%M"),
             "Result: %s" % ("Passed" if res["pass"] else "Did not pass"),
             "Findings: %d" % res["findings"]]
    if run_url:
        lines.append("Run: %s" % run_url)
    if res["lines"]:
        lines += ["", "What the check found:"] + ["  " + ln for ln in res["lines"]]
    return "\n".join(lines) + "\n"


def engine_result(out, slug):
    """One piece's result from the engine's --json: it passes only when Light and Dark both pass. A target the engine
    never reported is a fail, never a pass. Pure."""
    t = (out or {}).get("targets") or {}
    parts = [t.get(slug), t.get(slug + "-dark")]
    if not all(isinstance(p, dict) for p in parts):
        return {"pass": False, "findings": 1, "lines": ["the engine reported no result for this page"]}
    lines = [ln for p, tag in zip(parts, ("Light", "Dark")) for ln in ("%s: %s" % (tag, x) for x in p.get("lines") or [])]
    return {"pass": all(p.get("pass") is True for p in parts), "findings": sum(int(p.get("findings") or 0) for p in parts),
            "lines": lines}


def check_row(record, settings, res, report_url, created_by):
    """The one row a page's check inserts. checked_at is left to the database's now(), after the record moved. Pure."""
    return {"library_id": record["id"], "version_key": page_key(record), "url": record["url"],
            "standard": settings.get("standard"), "tool_or_reviewer": settings.get("reviewer_or_tool"),
            "result": "pass" if res["pass"] else "fail", "findings": int(res["findings"]),
            "report_url": report_url, "created_by": created_by}


def has_public_summary(record):
    return bool(str((record or {}).get("public_summary") or "").strip())


def should_list(record, row):
    """List on a pass: a piece published to the Public Library, not listed, holding a public summary a person typed,
    whose check this run passed at the url and version key the record names now and no earlier than its page last
    changed (latest_check's and the tab's rule). Pure."""
    since, at = _ts((record or {}).get("page_changed_at")), _ts((row or {}).get("checked_at"))
    return bool(waits_to_list(record) and has_public_summary(record) and row and row.get("result") == "pass"
                and row.get("url") == record.get("url") and row.get("version_key") == page_key(record)
                and row.get("library_id") == record.get("id") and at and (since is None or at >= since))


def list_update(record, now_iso):
    """The columns cpl_library_set_public() writes on a listing, written by the service role, whom the guard trigger
    admits. It keeps the public summary a person typed; it never copies the internal summary or the title. Pure."""
    return {"public_listed": True, "seen_by": "public", "public_summary": str(record["public_summary"]).strip()[:600],
            "listed_at": now_iso, "listed_by": BOT, "updated_by": BOT}


def list_guard(record):
    """The PostgREST filter the listing is guarded on: the record as read, still waiting, at the page checked. Pure."""
    v = str(record.get("version") or "").strip()
    q = ["id=eq." + urllib.parse.quote(record["id"]), "updated_at=eq." + urllib.parse.quote(record["updated_at"]),
         "url=eq." + urllib.parse.quote(record["url"], safe=""), "public_listed=is.false", "publish_target=eq.public",
         "retired_at=is.null", ("version=eq." + urllib.parse.quote(v)) if v else "version=is.null"]
    return "&".join(q)


# ── I/O ───────────────────────────────────────────────────────────────────────────────────────────────────────────
def read_state():
    settings = {}
    try:
        for s in lp.api("cpl_library_division_settings?select=*") or []:
            if s.get("division") and s.get("standard"):
                settings[s["division"]] = s
    except Exception as e:  # noqa: BLE001
        print("settings unreadable, using the CPL Initiative's defaults: %s" % e, file=sys.stderr)
    records = lp.api("cpl_library?select=*&retired_at=is.null") or []
    checks = lp.api("cpl_library_checks?select=id,library_id,version_key,url,result,findings,standard,tool_or_reviewer,"
                    "report_url,checked_at,created_at&order=checked_at.desc") or []
    return settings, records, checks


def run_engine(slugs, out_path):
    env = dict(os.environ, LIBRARY_CHECK_PAGES=",".join(slugs))
    subprocess.run(["node", str(ROOT / "scripts" / "a11y.js"), "--config", str(ROOT / "scripts" / "library_check.config.js"),
                    "--json", out_path], cwd=str(ROOT), env=env, check=False)
    with open(out_path, encoding="utf-8") as f:
        return json.load(f)


def run_label():
    """created_by and the run's address. A rerun of the same run is a new attempt, so the label names it. Pure but env."""
    rid, att = os.environ.get("GITHUB_RUN_ID", ""), os.environ.get("GITHUB_RUN_ATTEMPT", "1") or "1"
    url = ("%s/%s/actions/runs/%s/attempts/%s" % (os.environ.get("GITHUB_SERVER_URL", "https://github.com"),
                                                  os.environ.get("GITHUB_REPOSITORY", "CPL-Initiative/cpl-project-tracker"),
                                                  rid, att)) if rid else ""
    return ("library-publish.yml run %s attempt %s" % (rid, att) if rid else BOT), url


def _read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8")) if path and Path(path).exists() else {}
    except ValueError:
        return {}


def plan_phase(finished, out):
    moved = _read_json(finished).get("moved") or []
    _, records, checks = read_state()
    slugs = plan(records, checks, moved)
    Path(out).write_text(json.dumps({"check": slugs, "skipped": skipped(records, moved)}) + "\n", encoding="utf-8")
    print(len(slugs))
    return 0


def landed(created_by, rows):
    """The rows of this run that reached the table though the insert answered with an error (a timeout after the
    commit), read back by created_by and matched to the rows sent. [] when none, or when the read fails too."""
    try:
        got = lp.api("cpl_library_checks?select=id,library_id,version_key,url,result,findings,standard,tool_or_reviewer,"
                     "report_url,checked_at,created_at&created_by=eq." + urllib.parse.quote(created_by)) or []
    except Exception:  # noqa: BLE001
        return []
    sent = {(r["library_id"], r["report_url"]) for r in rows}
    return [g for g in got if (g.get("library_id"), g.get("report_url")) in sent]


def unlist_update():
    """A listed piece whose content its latest passing check never saw comes off the Public Library. Pure."""
    return {"public_listed": False, "updated_by": BOT}


def unlist_guard(record):
    return "&".join(["id=eq." + urllib.parse.quote(record["id"]), "updated_at=eq." + urllib.parse.quote(record["updated_at"]),
                     "public_listed=is.true"])


def write_receipt(path, receipt):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def restamp(records, checks, settings):
    """Every Library page's line: a pass only from certified_check (the latest check's committed proof matches the
    page's content now), Not yet certified otherwise. -> the slugs whose line changed."""
    out = []
    for r in records:
        if r.get("retired_at") or not on_pages(r):
            continue
        p = ROOT / "library" / r["slug"] / "index.html"
        page = p.read_text(encoding="utf-8")
        new = stamp(page, footer_block(certified_check(r, checks, page), settings_for(r, settings)))
        if new != page:
            p.write_text(new, encoding="utf-8")
            out.append(r["slug"])
    return out


def check_phase(plan_path, engine=run_engine, now=None):
    now = now or datetime.now(timezone.utc)
    pl = _read_json(plan_path)
    slugs = pl.get("check") or []
    settings, records, checks = read_state()
    by_slug = {r.get("slug"): r for r in records}
    todo, skip = [], list(pl.get("skipped") or [])
    for s_ in slugs:
        r = by_slug.get(s_)
        if not r or not on_pages(r):
            continue
        why = row_problem(r)
        if why:
            skip.append({"slug": s_, "why": why})
            continue
        todo.append(r)
    created_by, run_url = run_label()
    receipt = {"_about": "Library check receipt (scripts/library_check.py): the cpl_library_checks rows this run inserted "
                         "and each listing's before-values, written before the listing's update. Roll back a listing by "
                         "writing its before-values with the service key; roll back the rows with: delete from "
                         "public.cpl_library_checks where created_by = '<created_by>' (the table's owner; no role may "
                         "delete a check).",
               "at": now.isoformat(), "created_by": created_by, "checks": [], "listed": []}
    rpath = RECEIPTS / ("%s-%s.json" % (now.strftime("%Y-%m-%d-%H%M%S"), re.sub(r"[^a-z0-9]+", "-", created_by.lower()).strip("-")))
    receipt["unlisted"] = []
    rows, report_of, before, got, sha_of, insert_error, errors = [], {}, {}, [], {}, None, []
    # A listed piece whose page is not the page its latest passing check saw comes off the Public Library before its
    # new check runs. The trigger on unlisting resets publish_target to internal, so a second guarded update puts
    # 'public' back and the piece relists once its new page passes. Before-values go into the receipt first.
    for r in list(todo):
        if not r.get("public_listed"):
            continue
        page = (ROOT / "library" / r["slug"] / "index.html").read_text(encoding="utf-8")
        if not drift_unlists(r, checks, page):
            continue
        entry = {"record_id": r["id"], "slug": r["slug"], "unlisted": "pending",
                 "before": {k: r.get(k) for k in ("public_listed", "publish_target", "updated_by", "updated_at")},
                 "update": unlist_update()}
        receipt["unlisted"].append(entry)
        write_receipt(rpath, receipt)
        try:
            ok = lp.api("cpl_library?" + unlist_guard(r), "PATCH", unlist_update())
            entry["unlisted"] = bool(ok)
            if ok:
                # The trigger on unlisting set publish_target to internal; put back the wish to list, and say so when
                # it does not land, or the piece would never relist (COBIx on #3581, 7029334238).
                entry["publish_target_restored"] = "pending"
                write_receipt(rpath, receipt)
                back = lp.api("cpl_library?id=eq.%s&public_listed=is.false&publish_target=eq.internal" % urllib.parse.quote(r["id"]),
                              "PATCH", {"publish_target": "public", "updated_by": BOT})
                entry["publish_target_restored"] = bool(back)
                if not back:
                    errors.append("%s: it came off the Public Library, but putting publish_target back to public matched no "
                                  "row, so it will not relist on a pass until a person presses Publish to Public Library" % r["slug"])
        except Exception as e:  # noqa: BLE001 — its check still runs; the step goes red at the end
            if entry.get("publish_target_restored") == "pending":
                entry["publish_target_restored"] = "unknown: %s" % str(e)[:200]
            else:
                entry["unlisted"] = "unknown: %s" % str(e)[:200]
            errors.append("%s: unlisting answered %s" % (r["slug"], str(e)[:200]))
        finally:
            write_receipt(rpath, receipt)
    if todo:
        try:
            # The page carries the line it will show if it passes, so the page checked is the page served.
            for r in todo:
                p = ROOT / "library" / r["slug"] / "index.html"
                before[r["slug"]] = p.read_text(encoding="utf-8")
                rel = report_rel(r["slug"], now)
                report_of[r["slug"]] = rel
                st = settings_for(r, settings)
                prospective = {"result": "pass", "standard": st.get("standard"), "tool_or_reviewer": st.get("reviewer_or_tool"),
                               "checked_at": now.isoformat(), "report_url": SITE + rel}
                checked = stamp(before[r["slug"]], footer_block(prospective, st))
                p.write_text(checked, encoding="utf-8")
                sha_of[r["slug"]] = content_hash(checked)
            with tempfile.TemporaryDirectory() as tmp:
                out = engine([r["slug"] for r in todo], os.path.join(tmp, "engine.json"))
            for r in todo:
                st, res = settings_for(r, settings), engine_result(out, r["slug"])
                rel = report_of[r["slug"]]
                f = ROOT / rel
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_text(report_text(r, page_key(r), r["url"], st, res, out or {}, run_url, now)
                             + "Page content sha256 (the accessibility line taken out): %s\n" % sha_of[r["slug"]], encoding="utf-8")
                rows.append(check_row(r, st, res, SITE + rel, created_by))
            try:
                got = lp.api("cpl_library_checks", "POST", rows) or []
            except Exception as e:  # noqa: BLE001 — some rows may have landed: read them back before deciding
                insert_error = e
                got = landed(created_by, rows)
                if not got:
                    raise
        except BaseException:
            # No check record, no claim: every page goes back as it was and no report stays behind.
            for slug, text in before.items():
                (ROOT / "library" / slug / "index.html").write_text(text, encoding="utf-8")
            for rel in report_of.values():
                if (ROOT / rel).exists():
                    (ROOT / rel).unlink()
            raise
        # The rows are in: the receipt names them before anything else can fail.
        receipt["checks"] = [{k: g.get(k) for k in ("id", "library_id", "version_key", "url", "result", "findings",
                                                     "checked_at", "report_url")} for g in got]
        write_receipt(rpath, receipt)
        checks = list(got) + list(checks)
        # A report the database never took a row for goes, and its page goes back as it was; each row that landed gets
        # its committed proof: the check's id, key, url and the content hash of the page it checked.
        took = {g.get("library_id"): g for g in got}
        for r in todo:
            g = took.get(r["id"])
            if not g:
                if (ROOT / report_of[r["slug"]]).exists():
                    (ROOT / report_of[r["slug"]]).unlink()
                (ROOT / "library" / r["slug"] / "index.html").write_text(before[r["slug"]], encoding="utf-8")
                continue
            proof = {"check_id": g.get("id"), "library_id": g.get("library_id"), "version_key": g.get("version_key"),
                     "url": g.get("url"), "result": g.get("result"), "sha256": sha_of[r["slug"]],
                     "report": SITE + report_of[r["slug"]],
                     "_about": "The page this check saw: sha256 of library/%s/index.html with the accessibility line taken "
                               "out (scripts/library_check.py content_hash). The line prints this check's pass only while "
                               "the page still has this hash." % r["slug"]}
            (ROOT / report_of[r["slug"]][:-4]).with_suffix(".json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    # Every line from the rows actually written: a failed page reads Not yet certified at once.
    stamped = restamp(records, checks, settings)
    passed = {g.get("library_id"): g for g in got if g.get("result") == "pass"}
    to_list = [{"slug": r["slug"], "record_id": r["id"], "check_id": passed[r["id"]].get("id")}
               for r in todo if r["id"] in passed and (r.get("publish_target") == "public" or r.get("public_listed"))]
    if insert_error is not None:
        errors.append("the insert answered %s; the rows that landed were read back by created_by" % str(insert_error)[:200])
    print(json.dumps({"checked": [{"slug": next((r["slug"] for r in todo if r["id"] == g.get("library_id")), ""),
                                   "result": g.get("result"), "findings": g.get("findings")} for g in got],
                      "to_list": to_list, "unlisted": [u["slug"] for u in receipt["unlisted"] if u["unlisted"] is True],
                      "skipped": skip, "stamped": stamped, "errors": errors}))
    if errors:
        # The rows, lines, reports and receipt on disk are consistent; the step goes red so a person sees it.
        raise RuntimeError("the check run met errors: " + "; ".join(errors))
    return 0


def list_phase(check_file, now=None):
    """List on a pass, after the push of the reports and lines (library-publish.yml runs it only then): each piece
    --check named, fresh-read, listed when it holds a typed public summary and its latest check passed with a committed
    proof matching its page now."""
    now = now or datetime.now(timezone.utc)
    names = _read_json(check_file).get("to_list") or []
    _, records, checks = read_state()
    created_by, _ = run_label()
    receipt = {"_about": "Library listing receipt (scripts/library_check.py --list): each listing's before-values, written "
                         "before its update. Roll back a listing by writing its before-values with the service key, or "
                         "with Remove from the Public Library.", "at": now.isoformat(), "created_by": created_by, "listed": []}
    rpath = RECEIPTS / ("%s-%s-list.json" % (now.strftime("%Y-%m-%d-%H%M%S"), re.sub(r"[^a-z0-9]+", "-", created_by.lower()).strip("-")))
    listed, waiting, errors = [], [], []
    for n in names:
        try:
            fresh = (lp.api("cpl_library?select=*&id=eq." + urllib.parse.quote(n["record_id"])) or [None])[0]
        except Exception as e:  # noqa: BLE001 — nothing was written for it; the next piece still runs
            errors.append("%s: %s" % (n.get("slug"), str(e)[:200]))
            continue
        if not fresh or not on_pages(fresh):
            continue
        page = (ROOT / "library" / fresh["slug"] / "index.html").read_text(encoding="utf-8")
        c = certified_check(fresh, checks, page)
        if not c or c.get("id") != n.get("check_id"):
            waiting.append({"slug": fresh["slug"], "why": "its page is not the page this run's check saw"})
            continue
        if waits_to_list(fresh) and not has_public_summary(fresh):
            waiting.append({"slug": fresh["slug"], "why": "it needs a public summary"})
            continue
        if not should_list(fresh, c):
            continue
        up = list_update(fresh, datetime.now(timezone.utc).isoformat())
        entry = {"record_id": fresh["id"], "slug": fresh["slug"], "check_id": c.get("id"), "listed": "pending",
                 "before": {k: fresh.get(k) for k in sorted(set(up) | {"updated_at"})}, "update": up}
        receipt["listed"].append(entry)
        write_receipt(rpath, receipt)
        try:
            ok = lp.api("cpl_library?" + list_guard(fresh), "PATCH", up)
            entry["listed"] = bool(ok)
        except Exception as e:  # noqa: BLE001 — the next listing still runs; the step fails at the end
            entry["listed"] = "unknown: %s" % str(e)[:200]
            errors.append("%s: %s" % (fresh["slug"], str(e)[:200]))
            continue
        finally:
            write_receipt(rpath, receipt)
        if ok:
            listed.append(fresh["slug"])
    print(json.dumps({"listed": listed, "waiting": waiting, "errors": errors}))
    if errors:
        raise RuntimeError("listing failed for " + "; ".join(errors))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--finished")
    ap.add_argument("--out", default="check_plan.json")
    ap.add_argument("--plan-file", default="check_plan.json")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--check-file", default="check.json")
    ap.add_argument("--summary", help="print the commit message's list from --check's output")
    a = ap.parse_args(argv)
    if a.summary:
        try:
            d = json.loads(Path(a.summary).read_text(encoding="utf-8"))
            words = ", ".join("%s %s" % (c["slug"], "passed" if c["result"] == "pass" else "did not pass")
                              for c in d.get("checked") or [])
        except (OSError, ValueError, KeyError, TypeError):
            words = ""
        print(words or "footer lines only")
        return 0
    if a.plan:
        return plan_phase(a.finished, a.out)
    if a.check:
        return check_phase(a.plan_file)
    if a.list:
        return list_phase(a.check_file)
    ap.error("--plan, --check or --list")


if __name__ == "__main__":
    sys.exit(main())
