#!/usr/bin/env python3
"""_commons_data_live.py — the Commons data dashboard's live counts, college by college (#3215).

COBIx and the conductor agreed the design on PR #3222 (COBIx, 2026-11-13): "a builder export on the census
schedule, with one writer and a dated, committed figure, and no new table read in the view. Conditions: It
exports counts per college only, never rows. It runs with the Actions secret, not a browser key, and adds no new
`anon` grant. It carries its `read_at` and names its basis (live), so it never sits in one figure with the
committed-files basis. Teachout and Approved can come the same way."

WHERE IT RUNS. A step of .github/workflows/harvest-gap-census.yml (dispatch only, like the census), with the
repository's existing SUPABASE_SERVICE_KEY at that step's scope alone, and only on a run from main (the step's
`if: github.ref == 'refs/heads/main'`): a branch's copy of this file never runs with the key. It writes out/commons_data_live.json on the
runner, never a committed path; kb/_build_commons_data_status.py --live reads that file and stays the one writer of
kb/status/commons_data.json, which the census job's one push commits. It writes no table, adds no grant, no
function, no migration and no secret. Without the service key it reads nothing: it never falls back to the
public anon key.

WHAT IT READS. Every read is a count, or a narrow column read reduced to counts in memory on the runner; no row
leaves the runner and none is written to a file.

  Tables that hold a person (PEOPLE: program_requirement_records.checked_by, program_source_registry.corrected_by)
  are read by HEAD with Prefer: count=exact only: no select, no body, never a row.
    program_requirement_records  per college and status: rows, rows passing, rows whose record carries PLOs; per
                                 college: all rows and rows a person confirmed (checked = true, a count).
    program_source_registry      per college: whether a row exists, and whether catalog_url, cms_public_view and a
                                 sequence source are held (booleans from counts; never a URL).
  No query names a person column at all, not even as a filter. The other three are read a page at a time (Range,
  through the dated reads' own pager, whose exact count must hold from the first page to the last; each in a total
  order, UNIQUE_KEY) and only the columns in COLUMN_READS:
    coci_college_programs   college, control_number, status    (Active, Active - Teachout Only, Approved)
    coci_program_courses    college, program_control_number, course_code
    course_outcomes         college, course_code, kind, loaded_at

THE RULES, each the repo's own and never restated:
  passing   the census's rule, the Program Requirements tab's count: _program_requirements_score.counts_passing_on_tab
            (coverage and invented true, arithmetic in TAB_PASSING). The census does not call the server's
            public.program_record_machine_pass, so neither does this; the filter is built from TAB_PASSING and
            tests/commons_data_live_test.py pins it to counts_passing_on_tab.
  PLOs      a record whose record.program.outcomes is present and not an empty list (the mock's "Active programs
            whose record.program.outcomes is non-empty", COBIx on #3215).
  courses   the distinct course codes on a college's Active programs (coci_program_courses joined in memory to the
            Active control numbers), compared as upper case with spaces and hyphens removed; "SLO courses on
            Active programs" is the same set met by course_outcomes' codes of kind slo.
  colleges  the identity crosswalk, through the builder's own Resolver: a college's COCI spellings (Calbright's and
            the continuing-education campuses' " Credit" twins) count once, programs deduplicated by control
            number; a name the crosswalk does not hold is listed in "unmatched", with no figures.

FAIL SOFT. A read that fails writes {"state": "failed", "error_class", "http_status", "error"} and exits 0; the
builder then keeps the previous committed block and records the attempt (last_attempt), so the page shows the older
read_at. The class comes from the fixed ERROR_CLASSES, never an exception's text, which can carry the request's
headers (the review of #3232, finding 1). The key is stripped when read and refused, by class alone, if it still
holds whitespace or a control character; the export refuses to write anything that holds the key or a SCRUB_RUN-
character run of it, and the workflow's last step before the commit runs --scrub over out/ and the status file. For
a JWT key only the signature (after the second dot) is tested, and a run that also sits in a committed anon key is
skipped: both keys share the header and the start of the payload (COBIx, 6857150335).

Usage, from the repo root:
  python3 kb/_commons_data_live.py [--out PATH] [--run-id ID]     the live read (needs SUPABASE_SERVICE_KEY)
  python3 kb/_commons_data_live.py --dry-run                       the query plan, no network, writes nothing
  python3 kb/_commons_data_live.py --fixture FILE [--out PATH]     the same code over {table: [rows]} in a file
Guard: tests/commons_data_live_test.py.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _program_requirements_dated_reads as DR  # noqa: E402  (its Range pager and page read, never restated)
import _program_requirements_score as S  # noqa: E402  (the tab's passing statuses)
from _program_requirements_pilot import SUPABASE_URL  # noqa: E402

SCHEMA = 1
OUT = "out/commons_data_live.json"
KEY_ENV = "SUPABASE_SERVICE_KEY"
CHUNK = 150            # control numbers in one in.() filter, as the census asks the Program Course File
WORKERS = 8            # HEAD counts in flight at once

STATUSES = {"Active": "active", "Active - Teachout Only": "teachout", "Approved": "approved"}

# Tables whose rows name a person. Read by count alone. The test derives this set from the committed schemas.
PEOPLE = {"program_requirement_records": ("checked_by",), "program_source_registry": ("corrected_by",)}
# The only columns a page read may select, table by table.
COLUMN_READS = {
    "coci_college_programs": ("college", "control_number", "status"),
    "coci_program_courses": ("college", "program_control_number", "course_code"),
    "course_outcomes": ("college", "course_code", "kind", "loaded_at"),
}

# Each figure's table, in the block.
TABLES = {
    "programs": "coci_college_programs (status Active, Active - Teachout Only, Approved; distinct control numbers)",
    "records": "program_requirement_records (counts by HEAD; by status through the college's control numbers)",
    "program_courses": "coci_program_courses (distinct course codes on Active programs)",
    "outcomes": "course_outcomes (distinct course codes, kind slo or objective)",
    "registry": "program_source_registry (counts by HEAD, read as booleans)",
}

RULE = {
    "passing": "coverage and invented true, arithmetic %s: the census's rule (_program_requirements_score."
               "counts_passing_on_tab), the Program Requirements tab's count" % " or ".join(S.TAB_PASSING),
    "plos": "record.program.outcomes present and not an empty list",
    "courses": "distinct course codes on the college's Active programs (upper case, spaces and hyphens removed)",
    "registry": "catalog link = catalog_url held; course-outline link = cms_public_view held; sequence source = "
                "sequence_source ppm or program_map_page; sequence checked = any recorded value but unknown",
}


class Refused(Exception):
    """A read the counts-only guarantee does not allow."""


PERSON_COLUMNS = sorted({c for cols in PEOPLE.values() for c in cols})


def guard(method: str, table: str, qs: str) -> None:
    """Every read passes here first, live or fixture. A table that holds a person is read by count alone (no
    select); any other table selects only its COLUMN_READS, never *; and no query names a person column anywhere
    (a filter, an order, an or=), so even a count cannot ask about a person (COBIx's finding 3 on #3232)."""
    params = urllib.parse.parse_qs(qs, keep_blank_values=True)
    sel = params.get("select")
    said = urllib.parse.unquote(qs)
    named = [c for c in PERSON_COLUMNS if re.search(r"(?<![A-Za-z0-9_])%s(?![A-Za-z0-9_])" % c, said)]
    if named:
        raise Refused("%s: the query names a person column (%s)" % (table, ", ".join(named)))
    if table in PEOPLE:
        if method != "count" or sel:
            raise Refused("%s holds a person (%s): count reads only, no select" % (table, ", ".join(PEOPLE[table])))
        return
    if table not in COLUMN_READS:
        raise Refused("%s is not a table this export reads" % table)
    if method == "count":
        return
    cols = [c.strip() for c in (sel[0] if sel else "*").split(",")]
    bad = [c for c in cols if c not in COLUMN_READS[table]]
    if bad:
        raise Refused("%s: %s is outside the columns this export reads (%s)" % (table, ", ".join(bad), ", ".join(COLUMN_READS[table])))


class Live:
    """The live tables through PostgREST, with the service key."""

    def __init__(self, key: str):
        self.key = key
        self.log = []

    def count(self, table: str, qs: str) -> int:
        guard("count", table, qs)
        self.log.append(("count", table, qs))
        req = urllib.request.Request("%s/rest/v1/%s?%s" % (SUPABASE_URL, table, qs), method="HEAD", headers={
            "apikey": self.key, "Authorization": "Bearer " + self.key, "Prefer": "count=exact"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            rng = resp.headers.get("Content-Range") or ""
        if "/" not in rng or rng.endswith("/*"):
            raise RuntimeError("%s sent no exact count (Content-Range %r)" % (table, rng))
        return int(rng.rsplit("/", 1)[1])

    def page(self, table: str, qs: str, start: int, size: int):
        guard("page", table, qs)
        self.log.append(("page", table, qs))
        return DR._page(self.key, table, qs, start, size)


# ── a fixture source: the same reads over {table: [rows]}, for --fixture and the tests ──────────────────────
def _path_value(row: dict, col: str):
    """A column, or a JSON path in PostgREST's arrows (a->b->>c), from one fixture row."""
    parts = re.split(r"(->>|->)", col)
    v, text = row.get(parts[0]), False
    for i in range(1, len(parts), 2):
        text = parts[i] == "->>"
        v = v.get(parts[i + 1]) if isinstance(v, dict) else None
    if text and v is not None and not isinstance(v, str):
        v = json.dumps(v, separators=(",", ":")) if isinstance(v, (list, dict)) else str(v).lower() if isinstance(v, bool) else str(v)
    return v


def _in_list(s: str) -> list[str]:
    return [x.strip().strip('"') for x in s[1:-1].split(",")] if s.startswith("(") and s.endswith(")") else [s]


def _match(v, op: str) -> bool:
    neg = op.startswith("not.")
    if neg:
        op = op[4:]
    kind, _, arg = op.partition(".")
    if kind == "is":
        r = (v is None) if arg == "null" else (v is True) if arg == "true" else (v is False)
    elif kind == "eq":
        r = v is not None and str(v).lower() == arg.lower() if isinstance(v, bool) else v is not None and str(v) == arg
    elif kind == "neq":
        r = v is not None and str(v) != arg
    elif kind == "in":
        r = v is not None and str(v) in _in_list(arg)
    else:
        raise ValueError("fixture source: no operator %s" % kind)
    return (not r) if neg else r


class Fixture:
    """{table: [rows]} answering the export's reads as PostgREST would, through the same guard."""

    def __init__(self, tables: dict):
        self.tables = tables
        self.log = []

    def _rows(self, table: str, qs: str) -> list[dict]:
        out = list(self.tables.get(table) or [])
        for k, v in urllib.parse.parse_qsl(qs, keep_blank_values=True):
            if k in ("select", "order", "limit", "offset"):
                continue
            out = [r for r in out if _match(_path_value(r, k), v)]
        return out

    def count(self, table: str, qs: str) -> int:
        guard("count", table, qs)
        self.log.append(("count", table, qs))
        return len(self._rows(table, qs))

    def page(self, table: str, qs: str, start: int, size: int):
        """One Range page in the query's order. Rows the order leaves tied come back in a different order on
        every other page, as a database may return them, so a query without a total order skips and repeats
        rows here the way it can live."""
        guard("page", table, qs)
        self.log.append(("page", table, qs))
        params = urllib.parse.parse_qs(qs)
        sel = params.get("select", [""])[0].split(",")
        order = [o.split(".")[0] for o in params.get("order", [""])[0].split(",") if o]
        rows = self._rows(table, qs)

        def key(r):
            return tuple((r.get(c) is None, r.get(c) if isinstance(r.get(c), (int, float)) else str(r.get(c) or "")) for c in order)
        rows.sort(key=key)
        if (start // max(size, 1)) % 2:
            out, i = [], 0
            while i < len(rows):
                j = i
                while j < len(rows) and key(rows[j]) == key(rows[i]):
                    j += 1
                out += rows[i:j][::-1]
                i = j
            rows = out
        return [{c: r.get(c) for c in sel} for r in rows[start:start + size]], len(rows)


# ── the reads ───────────────────────────────────────────────────────────────────────────────────────────────
def q(v: str) -> str:
    return urllib.parse.quote(v, safe="")


def in_list(values) -> str:
    return "in.(%s)" % ",".join(q('"%s"' % v) for v in values)


def code_key(code) -> str | None:
    c = re.sub(r"[\s\-]+", "", str(code or "")).upper()
    return c or None


PASSING_QS = "checks->>coverage=eq.true&checks->>invented=eq.true&checks->>arithmetic=" + in_list(S.TAB_PASSING)
PLO_QS = "record->program->>outcomes=not.is.null&record->program->>outcomes=neq.%s" % q("[]")
# Every Range-paged read has a total order (COBIx's finding 2 on #3232): over tied rows a database may return
# pages in different orders, skipping one row and repeating another while the exact count still holds. The order
# ends in the table's unique key where the committed schema names one (course_outcomes.id; coci_program_courses'
# primary key). coci_college_programs has no schema in the repo, so its order covers every column read: rows it
# leaves tied are identical (college, control_number, status) tuples, and the export keeps sets of those.
UNIQUE_KEY = {"course_outcomes": ("id",),
              "coci_program_courses": ("college", "program_control_number", "course_control_number"),
              "coci_college_programs": None}
PROGRAMS_QS = "select=college,control_number,status&status=%s&order=college,control_number,status" % in_list(STATUSES)
COURSES_QS = ("select=college,program_control_number,course_code"
              "&order=college,program_control_number,course_control_number")
OUTCOMES_QS = "select=college,course_code,kind,loaded_at&order=college,course_code,kind,loaded_at,id"
REGISTRY_QS = {
    "row": "",
    "catalog_link": "&catalog_url=not.is.null",
    "course_outline_link": "&cms_public_view=not.is.null",
    "sequence_source": "&sequence_source=in.(ppm,program_map_page)",
    "sequence_checked": "&sequence_source=in.(ppm,program_map_page,none_found)",
}


def plan() -> list[tuple[str, str, str]]:
    """Every query shape the export sends, a college name and control numbers stood in by placeholders."""
    name, cns = "college=eq.%3CCOLLEGE%3E", "control_number=in.(%3CCONTROL%20NUMBERS%3E)"
    out = [("page", "coci_college_programs", PROGRAMS_QS), ("page", "coci_program_courses", COURSES_QS),
           ("page", "course_outcomes", OUTCOMES_QS),
           ("count", "program_requirement_records", name), ("count", "program_requirement_records", name + "&checked=is.true")]
    for extra in ("", "&" + PASSING_QS, "&" + PLO_QS):
        out.append(("count", "program_requirement_records", name + "&" + cns + extra))
    for extra in REGISTRY_QS.values():
        out.append(("count", "program_source_registry", name + extra))
    return out


def _counts(src, jobs: list[tuple[str, str]]) -> list[int]:
    if isinstance(src, Live) and len(jobs) > 1:
        with concurrent.futures.ThreadPoolExecutor(WORKERS) as ex:
            return list(ex.map(lambda j: src.count(*j), jobs))
    return [src.count(t, qs) for t, qs in jobs]


def read(src, resolve) -> dict:
    """The per-college counts. `resolve` is the builder's Resolver: a COCI name to a crosswalk college id."""
    programs = DR.paged(src.page, "coci_college_programs", PROGRAMS_QS)
    by_name: dict[str, dict[str, set]] = {}
    for r in programs:
        st = STATUSES.get(r.get("status"))
        if st and r.get("college"):
            by_name.setdefault(r["college"], {k: set() for k in STATUSES.values()})[st].add(str(r.get("control_number") or "").strip())
    names = sorted(by_name)
    ids, unmatched = {}, []
    for n in names:
        cid = resolve(n)
        if cid is None:
            unmatched.append(n)
        else:
            ids[n] = cid

    colleges: dict = {}

    def entry(cid):
        return colleges.setdefault(cid, {
            "names": [], "_cns": {k: set() for k in STATUSES.values()}, "_courses": set(), "_slo": set(), "_obj": set(),
            "programs": {}, "records": {"total": 0, "checked": 0},
            "program_courses": {"rows": 0, "active_courses": 0},
            "outcomes": {"slo_courses": 0, "slo_courses_on_active": 0, "slo_loaded_at": None,
                         "objective_courses": 0, "objective_courses_on_active": 0, "objective_loaded_at": None},
            "registry": {k: False for k in REGISTRY_QS}})

    for n, cid in ids.items():
        e = entry(cid)
        e["names"].append(n)
        for st, cns in by_name[n].items():
            e["_cns"][st] |= cns

    # program_requirement_records: by count alone, per COCI name (the table's own college key).
    jobs, keys = [], []
    for n, cid in ids.items():
        base = "college=eq.%s" % q(n)
        jobs += [("program_requirement_records", base), ("program_requirement_records", base + "&checked=is.true")]
        keys += [(cid, "total"), (cid, "checked")]
        for st, cns in by_name[n].items():
            cl = sorted(c for c in cns if c)
            for i in range(0, len(cl), CHUNK):
                part = base + "&control_number=" + in_list(cl[i:i + CHUNK])
                for fig, extra in ((st, ""), (st + "_passing", "&" + PASSING_QS), (st + "_with_plos", "&" + PLO_QS)):
                    jobs.append(("program_requirement_records", part + extra))
                    keys.append((cid, fig))
        for fig, extra in REGISTRY_QS.items():
            jobs.append(("program_source_registry", base + extra))
            keys.append((cid, "registry:" + fig))
    for (cid, fig), n in zip(keys, _counts(src, jobs)):
        e = colleges[cid]
        if fig.startswith("registry:"):
            e["registry"][fig[9:]] = e["registry"][fig[9:]] or n > 0
        else:
            e["records"][fig] = e["records"].get(fig, 0) + n

    # coci_program_courses: the course codes on each college's Active programs.
    active = {(n, cn) for n in ids for cn in by_name[n]["active"]}
    for r in DR.paged(src.page, "coci_program_courses", COURSES_QS):
        cid = ids.get(r.get("college"))
        if cid is None:
            continue
        e = colleges[cid]
        e["program_courses"]["rows"] += 1
        k = code_key(r.get("course_code"))
        if k and (r["college"], str(r.get("program_control_number") or "").strip()) in active:
            e["_courses"].add(k)

    # course_outcomes: distinct course codes by kind, and the newest load.
    out_unmatched = set()
    for r in DR.paged(src.page, "course_outcomes", OUTCOMES_QS):
        cid = resolve(r.get("college"))
        if cid is None:
            out_unmatched.add(r.get("college"))
            continue
        kind = r.get("kind")
        if kind not in ("slo", "objective"):
            continue
        e = entry(cid)
        k = code_key(r.get("course_code"))
        if k:
            e["_obj" if kind == "objective" else "_slo"].add(k)
        at = r.get("loaded_at")
        o = e["outcomes"]
        if at and (o[kind + "_loaded_at"] or "") < at:
            o[kind + "_loaded_at"] = at

    for cid, e in colleges.items():
        cns = e.pop("_cns")
        e["programs"] = {st: len({c for c in cns[st] if c}) for st in STATUSES.values()}
        for st in STATUSES.values():
            for suffix in ("", "_passing", "_with_plos"):
                e["records"].setdefault(st + suffix, 0)
        courses, slo, obj = e.pop("_courses"), e.pop("_slo"), e.pop("_obj")
        e["program_courses"]["active_courses"] = len(courses)
        e["outcomes"].update({"slo_courses": len(slo), "slo_courses_on_active": len(slo & courses),
                              "objective_courses": len(obj), "objective_courses_on_active": len(obj & courses)})
        e["names"].sort()
    return {"colleges": {str(k): colleges[k] for k in sorted(colleges, key=lambda x: (str(type(x)), x))},
            "unmatched": unmatched + sorted(n for n in out_unmatched if n and n not in unmatched)}


def statewide(colleges: dict) -> dict:
    """The sums of the college figures (booleans count the colleges that hold them)."""
    out = {}
    for e in colleges.values():
        for grp, figs in e.items():
            if grp == "names" or not isinstance(figs, dict):
                continue
            g = out.setdefault(grp, {})
            for k, v in figs.items():
                if isinstance(v, bool) or isinstance(v, int):
                    g[k] = g.get(k, 0) + int(v)
    return {"colleges": len(colleges), **out}


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


# ── never the key in a file (the review of #3232, finding 1) ─────────────────────────────────────────────────
# An exception's text can carry the request's headers: a key holding a newline makes urllib raise
# ValueError("Invalid header value b'<the whole key>\n'"). So no exception text is ever stored. A failure is kept
# as one class from this fixed vocabulary, plus the HTTP status where there is one; the key is stripped when read
# and refused if it still holds whitespace or a control character; and every file written is scrubbed for the key.
ERROR_CLASSES = ("unauthorized", "upstream 5xx", "timeout", "bad header", "count moved", "short read",
                 "no service key", "other")
SCRUB_RUN = 20         # any run of this many characters of the key in an output refuses the output


def error_class(e: BaseException) -> tuple[str, int | None]:
    """(class, HTTP status) for a failed read, from the exception's type and status alone; its text is read only
    for the dated pager's two fixed messages and never kept."""
    import socket
    import urllib.error
    status = getattr(e, "code", None) if isinstance(e, urllib.error.HTTPError) else None
    if status in (401, 403):
        return "unauthorized", status
    if status is not None and 500 <= status <= 599:
        return "upstream 5xx", status
    if status is not None:
        return "other", status
    reason = getattr(e, "reason", None)
    if isinstance(e, (TimeoutError, socket.timeout)) or isinstance(reason, (TimeoutError, socket.timeout)):
        return "timeout", None
    if isinstance(e, ValueError) and "header" in str(e).lower():
        return "bad header", None
    if isinstance(e, SystemExit):
        text = str(e)
        if "changed while it was read" in text:
            return "count moved", None
        if "stopped at" in text:
            return "short read", None
    return "other", None


def failed(at: str, run_id, cls: str, status: int | None = None) -> dict:
    cls = cls if cls in ERROR_CLASSES else "other"
    return {"schema": SCHEMA, "basis": "live", "state": "failed", "at": at, "run_id": run_id,
            "error_class": cls, "http_status": status,
            "error": cls + (" (HTTP %d)" % status if isinstance(status, int) else "")}


def clean_key(raw: str | None) -> tuple[str | None, str | None]:
    """(key, None) or (None, the refusal's class). The key is stripped; one that still holds whitespace or a
    control character is refused, and the refusal names no part of it."""
    if raw is None or not raw.strip():
        return None, "no service key"
    key = raw.strip()
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in key):
        return None, "bad header"
    return key, None


# The project's keys are legacy HS256 JWTs: the service key and the committed anon key share the header and the start
# of the payload, so a run from those parts matches every JWT in the repo (COBIx, 6857150335). The secret part of a
# JWT is its signature, after the second dot; the scrub tests runs from there alone, and skips any run that also sits
# in a committed anon key (ANON_SOURCES), which is public by design.
ANON_SOURCES = ("reviewer_signin.js", "team_phrase.js", "kb/_program_requirements_pilot.py")
_JWT = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")


def _jwt_role(token: str) -> str | None:
    import base64
    try:
        part = token.split(".")[1]
        return json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))).get("role")
    except (ValueError, IndexError, AttributeError):
        return None


def committed_anon_keys(root: str = ROOT) -> list[str]:
    """Every JWT whose payload names the anon role in ANON_SOURCES: public by design, never a hit."""
    out = []
    for rel in ANON_SOURCES:
        p = os.path.join(root, rel)
        if os.path.isfile(p):
            with open(p, encoding="utf-8", errors="replace") as fh:
                out += [t for t in _JWT.findall(fh.read()) if _jwt_role(t) == "anon" and t not in out]
    return out


def _secret_part(key: str) -> str:
    """The part of the key that is secret: a JWT's signature, or the whole of any other key."""
    parts = key.split(".")
    return parts[2] if len(parts) == 3 and key.startswith("eyJ") and parts[2] else key


def holds_key(text: str, key: str | None, public: tuple | list = ()) -> bool:
    """Whether the text holds the key's secret part, or any SCRUB_RUN-character run of it that no public key
    (`public`, the committed anon keys) also holds."""
    if not key:
        return False
    k = _secret_part(key.strip())
    if not k:
        return False
    if len(k) <= SCRUB_RUN:
        return k in text and not any(k in p for p in public)
    for i in range(len(k) - SCRUB_RUN + 1):
        run = k[i:i + SCRUB_RUN]
        if run in text and not any(run in p for p in public):
            return True
    return False


def scrub(paths: list[str], key: str | None, public: tuple | list | None = None) -> list[str]:
    """The files (under each path) that hold the key or a run of it. Names only, never the text."""
    public = committed_anon_keys() if public is None else public
    hits = []
    for p in paths:
        files = [os.path.join(d, f) for d, _, fs in os.walk(p) for f in fs] if os.path.isdir(p) else [p]
        for f in files:
            if not os.path.isfile(f):
                continue
            with open(f, encoding="utf-8", errors="replace") as fh:
                if holds_key(fh.read(), key, public):
                    hits.append(f)
    return hits


def export(src, resolve, run_id: str | None) -> dict:
    at = iso_now()
    try:
        r = read(src, resolve)
    except (Exception, SystemExit) as e:   # the dated reads' pager stops with SystemExit when a count moves
        return failed(at, run_id, *error_class(e))
    return {"schema": SCHEMA, "basis": "live", "state": "read", "read_at": at, "run_id": run_id,
            "source": "kb/_commons_data_live.py in harvest-gap-census.yml, the service key",
            "tables": TABLES, "rule": RULE, "reads": {"counts": sum(1 for m, *_ in src.log if m == "count"),
                                                    "pages": sum(1 for m, *_ in src.log if m == "page")},
            "statewide": statewide(r["colleges"]), "unmatched": r["unmatched"], "colleges": r["colleges"]}


def resolver(root: str = ROOT):
    import _build_commons_data_status as B  # noqa: E402  (the builder's crosswalk and Resolver, never restated)
    cw = B.load(root, os.path.relpath(B.crosswalk_path(root), root))
    return B.Resolver([e for e in cw.get("colleges") or [] if e.get("entity_kind") in B.IN_SCOPE])


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=os.path.join(ROOT, OUT))
    ap.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID"))
    ap.add_argument("--fixture", help="read {table: [rows]} from this file in place of the live tables")
    ap.add_argument("--dry-run", action="store_true", help="print the query plan; no network, write nothing")
    ap.add_argument("--scrub", nargs="+", metavar="PATH", help="exit 1, naming the files, if any file under these "
                    "paths holds the service key (or a %d-character run of it); reads the key from %s"
                    % (SCRUB_RUN, KEY_ENV))
    a = ap.parse_args(argv)
    if a.scrub:
        hits = scrub(a.scrub, os.environ.get(KEY_ENV))
        for h in hits:
            print("::error::%s holds the service key; it must not be committed or uploaded" % h)
        print("scrub: %d file(s) hold the key" % len(hits))
        return 1 if hits else 0
    if a.run_id is not None and not re.fullmatch(r"\d{1,20}", str(a.run_id)):
        a.run_id = None
    if a.dry_run:
        for method, table, qs in plan():
            guard(method, table, qs)
            print("%-5s %-28s %s" % (method, table, urllib.parse.unquote(qs)))
        print("every read passes the counts-only guard")
        return 0
    raw = os.environ.get(KEY_ENV)
    refusal = None
    if a.fixture:
        with open(a.fixture, encoding="utf-8") as f:
            src = Fixture(json.load(f))
    else:
        key, refusal = clean_key(raw)
        src = Live(key) if key else None
    if src is None:
        # Without a usable key it reads nothing; never the anon key. The message names no part of the value.
        print("::warning::%s is %s; the export reads with the service key alone, never the anon key"
              % (KEY_ENV, "not set" if refusal == "no service key" else "refused (it holds whitespace or a control character)"))
        block = failed(iso_now(), a.run_id, refusal or "no service key")
    else:
        block = export(src, resolver(), a.run_id)
    text = json.dumps(block, indent=1, ensure_ascii=False) + "\n"
    if holds_key(text, raw, committed_anon_keys()):
        # Defense in depth: nothing that holds the key is written, whatever put it there.
        block = failed(block.get("at") or block.get("read_at") or iso_now(), a.run_id, "other")
        text = json.dumps(block, indent=1, ensure_ascii=False) + "\n"
        print("::error::the export held the service key; it wrote a failed block in its place")
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(text)
    if block["state"] == "read":
        s = block["statewide"]
        print("live counts: %d colleges, %d Active programs, %d unmatched names (%d counts, %d pages) -> %s"
              % (s["colleges"], (s.get("programs") or {}).get("active", 0), len(block["unmatched"]),
                 block["reads"]["counts"], block["reads"]["pages"], a.out))
    else:
        print("::warning::the Commons live counts were not read (%s); the builder keeps the previous block" % block["error"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
