#!/usr/bin/env python3
"""The Library's accessibility check run, the footer it writes, and listing on a pass (#3560 part 2; S688).

Sam's go of Nov 19, 2026 (8:23 AM PT, relayed by COBIx on #3560): "Nothing gets Publish it or List publicly until its
accessibility checks pass." Every Library page "carries a footer line generated from that piece's own check record,
never boilerplate", naming the standard, the check date, the tool or reviewer and a link to the check record; a piece
not yet re-checked reads "Not yet certified". His 8:55 AM decisions: the only gate on the Public Library is the passing
check record, and no approval from Sam.

library-publish.yml runs this after --finish has moved the records it published:

  --plan  --finished F --out P   which pages to check, written to P: every page this run published (F, --finish's
                                 output) and every piece published to the Public Library that waits with no check of
                                 its page since the page last changed. Prints the count for the workflow.
  --check --plan P               for each page in P: writes the footer the page will carry if it passes, runs the
                                 one engine (scripts/a11y.js with scripts/library_check.config.js, Light and Dark),
                                 writes a plain-words report beside the page (library/<slug>/accessibility/), and
                                 inserts ONE row per page into cpl_library_checks with the service key: the record's
                                 version key, its current url, the division's standard and tool, pass or fail, the
                                 findings count, the report's Pages address, and the run that made it. Then it lists
                                 each piece whose publish_target is 'public' and whose check passed, with an update
                                 guarded on the record as read (Rule 10), and rewrites the footer line on every
                                 Library page from that piece's own latest check. A receipt of the rows and of each
                                 listing's before-values goes to kb/receipts/library_checks/.

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


def footer_of(page):
    m = BLOCK.search(page or "")
    return m.group(0) if m else ""


# ── What to check ─────────────────────────────────────────────────────────────────────────────────────────────────
def waits_to_list(record):
    return bool(record and record.get("publish_target") == "public" and not record.get("public_listed")
                and not record.get("retired_at"))


def plan(records, checks, moved, root=None):
    """The slugs to check: every page --finish moved this run, then every piece waiting on the Public Library whose
    page has no check since it last changed (a failed one waits for a new page, never a second look at the same one).
    Only a page this checkout holds, at the address its record names. Pure but for the file test."""
    moved, out = set(moved or []), []
    for r in sorted(records or [], key=lambda x: x.get("slug") or ""):
        if r.get("retired_at") or not on_pages(r, root):
            continue
        if r["slug"] in moved:
            out.append(r["slug"])
        elif waits_to_list(r) and not latest_check(checks, r):
            out.append(r["slug"])
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


def should_list(record, row):
    """List on a pass: a piece published to the Public Library, not listed, whose check this run passed at the url and
    version key the record names now. Pure."""
    return bool(waits_to_list(record) and row and row.get("result") == "pass" and row.get("url") == record.get("url")
                and row.get("version_key") == page_key(record) and row.get("library_id") == record.get("id"))


def list_update(record, now_iso):
    """The columns cpl_library_set_public() writes on a listing, written by the service role, whom the guard trigger
    admits. The summary is the record's public summary, else its summary, else its title (the listing needs one). Pure."""
    summary = (record.get("public_summary") or record.get("summary") or record.get("title") or "").strip()[:600]
    return {"public_listed": True, "seen_by": "public", "public_summary": summary, "listed_at": now_iso,
            "listed_by": BOT, "updated_by": BOT}


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
    rid = os.environ.get("GITHUB_RUN_ID", "")
    url = ("%s/%s/actions/runs/%s" % (os.environ.get("GITHUB_SERVER_URL", "https://github.com"),
                                      os.environ.get("GITHUB_REPOSITORY", "CPL-Initiative/cpl-project-tracker"), rid)) if rid else ""
    return ("library-publish.yml run %s" % rid if rid else BOT), url


def plan_phase(finished, out):
    moved = []
    if finished and Path(finished).exists():
        try:
            moved = json.loads(Path(finished).read_text(encoding="utf-8")).get("moved") or []
        except ValueError:
            moved = []
    _, records, checks = read_state()
    slugs = plan(records, checks, moved)
    Path(out).write_text(json.dumps({"check": slugs}) + "\n", encoding="utf-8")
    print(len(slugs))
    return 0


def check_phase(plan_path, engine=run_engine, now=None):
    now = now or datetime.now(timezone.utc)
    slugs = []
    if plan_path and Path(plan_path).exists():
        slugs = json.loads(Path(plan_path).read_text(encoding="utf-8")).get("check") or []
    settings, records, checks = read_state()
    by_slug = {r.get("slug"): r for r in records}
    todo = [by_slug[s] for s in slugs if s in by_slug and on_pages(by_slug[s])]
    created_by, run_url = run_label()
    receipt = {"_about": "Library check receipt (scripts/library_check.py): the cpl_library_checks rows this run inserted "
                         "and each listing's before-values. Roll back a listing by writing its before-values with the "
                         "service key; roll back the rows with: delete from public.cpl_library_checks where created_by = "
                         "'<created_by>' (the table's owner; no role may delete a check).",
               "at": now.isoformat(), "created_by": created_by, "checks": [], "listed": []}
    rows, report_of, before = [], {}, {}
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
                p.write_text(stamp(before[r["slug"]], footer_block(prospective, st)), encoding="utf-8")
            with tempfile.TemporaryDirectory() as tmp:
                out = engine([r["slug"] for r in todo], os.path.join(tmp, "engine.json"))
            for r in todo:
                st, res = settings_for(r, settings), engine_result(out, r["slug"])
                rel = report_of[r["slug"]]
                f = ROOT / rel
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_text(report_text(r, page_key(r), r["url"], st, res, out or {}, run_url, now), encoding="utf-8")
                rows.append(check_row(r, st, res, SITE + rel, created_by))
            got = lp.api("cpl_library_checks", "POST", rows) or []
        except BaseException:
            # No check record, no claim: every page goes back as it was and no report stays behind.
            for slug, text in before.items():
                (ROOT / "library" / slug / "index.html").write_text(text, encoding="utf-8")
            for rel in report_of.values():
                if (ROOT / rel).exists():
                    (ROOT / rel).unlink()
            raise
        receipt["checks"] = [{k: g.get(k) for k in ("id", "library_id", "version_key", "url", "result", "findings",
                                                     "checked_at", "report_url")} for g in got]
        checks = list(got) + list(checks)
    listed = []
    for row in receipt["checks"]:
        r0 = next((r for r in todo if r["id"] == row["library_id"]), None)
        if not r0:
            continue
        fresh = (lp.api("cpl_library?select=*&id=eq." + urllib.parse.quote(r0["id"])) or [None])[0]
        if not fresh or not should_list(fresh, row):
            continue
        up = list_update(fresh, datetime.now(timezone.utc).isoformat())
        ok = lp.api("cpl_library?" + list_guard(fresh), "PATCH", up)
        receipt["listed"].append({"record_id": fresh["id"], "slug": fresh["slug"], "listed": bool(ok),
                                  "before": {k: fresh.get(k) for k in sorted(set(up) | {"updated_at"})}, "update": up})
        if ok:
            listed.append(fresh["slug"])
    # Every Library page's line, from its own latest check (the rows just written included).
    stamped = []
    for r in records:
        if r.get("retired_at") or not on_pages(r):
            continue
        p = ROOT / "library" / r["slug"] / "index.html"
        page = p.read_text(encoding="utf-8")
        new = stamp(page, footer_block(latest_check(checks, r), settings_for(r, settings)))
        if new != page:
            p.write_text(new, encoding="utf-8")
            stamped.append(r["slug"])
    if receipt["checks"] or receipt["listed"]:
        RECEIPTS.mkdir(parents=True, exist_ok=True)
        name = "%s-%s.json" % (now.strftime("%Y-%m-%d-%H%M%S"), re.sub(r"[^a-z0-9]+", "-", created_by.lower()).strip("-"))
        (RECEIPTS / name).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checked": [{"slug": r["slug"], "result": row["result"], "findings": row["findings"]}
                                  for r, row in zip(todo, rows)], "listed": listed, "stamped": stamped}))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--finished")
    ap.add_argument("--out", default="check_plan.json")
    ap.add_argument("--plan-file", default="check_plan.json")
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
    ap.error("--plan or --check")


if __name__ == "__main__":
    sys.exit(main())
