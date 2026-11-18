#!/usr/bin/env python3
"""The exact-match pass for credit recommendations: a read-only dry run (S683, COBIx's draft on #3480, Sources 29-34).

    python3 kb/_cr_exact_match_pass.py --inventory INV.csv --ace-source csv --ace-csv ACE.csv
    python3 kb/_cr_exact_match_pass.py --inventory-source supabase --ace-source supabase      # the runner

WHAT IT DOES. It gives every inventory row (one credit recommendation wording on one exhibit) exactly one label
against ACE's catalog wording for the same exhibit:

  exact_match       the inventory text and an ACE line for the exhibit are identical, character for character
  light_fix_match   identical only after the typographic rule (kb/cr_typographic.py typo_key, imported, never copied)
  map_only          the row's source is MAP, or the exhibit has no ACE line (no exhibit id, a worklist wording with
                    no exhibit, or an exhibit the catalog does not carry)
  real_difference   the exhibit has ACE lines, the source is not MAP, and neither test holds; sub_cause names the
                    obvious reason when there is one: truncation, different_hours, other_wording (same hours,
                    same topic, a term word or end mark differs), different_topic, several_ace_recommendations

The four labels add up to the inventory count; run() refuses to return when they do not.

WHAT IT WRITES. One CSV of labeled rows and one JSON of counts, to the paths given (a temporary folder by default,
so a run never leaves a file in the repo). Nothing else: no Supabase write, no GitHub write, no curation. The source
text is never changed; the CSV carries it as read, beside the typographic keys.

WHERE ACE'S WORDING COMES FROM. `--ace-source csv` reads a file with an exhibit id column (exhibit_id, AceID,
ace_id) and a wording column (credit_recommendation, CreditRecommendation, ace_source_text, source_text).
`--ace-source supabase` reads public.map_ace_catalog_cr (exhibit_id, credit_recommendation), the table
kb/migrations/2026-11-17_s678_map_ace_catalog_cr.sql made and kb/_sync_map_custom_reports.py fills each night.
exhibit_id there is the catalog's AceID.

THE READ IS REVIEWER-GATED. That table's only policy lets anon and authenticated read when is_allowed_reviewer()
or team_pass_ok() is true; the service role reads past RLS on its explicit SELECT grant. A refused gate returns
zero rows with HTTP 200, never an error, so this script treats an empty ACE read as a refused gate and stops
rather than label every row map_only. Two keys open it, both taken only from the environment:
  SUPABASE_SERVICE_KEY                     the runner's key (read-only use here: GET requests only)
  SUPABASE_ANON_KEY + CPL_TEAM_PASS        the anon key with the team pass in the x-team-pass header
SUPABASE_URL must be set too; this file names no host. Reads are Range-paginated with `Prefer: count=exact`: the read
runs until it holds the Content-Range total, so a server page cap below 1,000 cannot end it early, and it stops when
the rows read do not equal that total.

`--inventory-source supabase` builds the inventory from public.map_college_cr_unit: one row per distinct
(exhibit_id, credit_rec), its source `ACE` when any of its rows carries source_code ACE, `MAP` when one carries
MAP, else `unlabeled`. It selects those three columns only, never a count column. The default is a CSV in COBIx's
crs_inventory.csv shape (exhibit_id, source_text, ace_id, source, inventory_grain).

THE LIVE COUNTS. LIVE_COUNTS_SQL below is the one SELECT the conductor runs for the inventory counts on live data. It
applies the same inventory and map_only rules as inventory_from_units() and classify_row(); the typographic rule
lives in Python only, so it reports light_fix_match and real_difference together. The tests pin that it names
the same two tables and the same map_only predicate.

No ACE website is fetched, ever. The tests pin that the only request this file makes is a GET to SUPABASE_URL.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cr_typographic import clean_rec, typo_key  # noqa: E402  (kb/, beside this file)

ACE_TABLE = "map_ace_catalog_cr"
ACE_ID_COLUMN = "exhibit_id"
ACE_TEXT_COLUMN = "credit_recommendation"
UNIT_TABLE = "map_college_cr_unit"
PAGE = 1000

LABELS = ("exact_match", "light_fix_match", "map_only", "real_difference")
ID_ALIASES = ("exhibit_id", "aceid", "ace_id")
TEXT_ALIASES = ("credit_recommendation", "creditrecommendation", "ace_source_text", "source_text", "credit_rec")

# The cleaned form's head (clean_rec writes it as `3 hours in`, `3-4 hours in`, `3 or 4 hours in`); the amount is
# optional so `hours in Beginning Keyboarding` still yields its topic.
_HEAD = re.compile(r"(?i)^(?P<amt>\d+(?:\.\d+)?(?:(?:-| or | to )\d+(?:\.\d+)?)?)?\s*"
                   r"(?:(?:semester|quarter)\s+)?(?:hours?|units?|credits?)\s+(?:in|of)\s+(?P<topic>.*)$")
DANGLE = re.compile(r"(?i)(?:\b(?:and|of|to|the|in|for|with|or|a|an|as|from|into|by|on)\s*)$")
_END_MARKS = ".,;: "
SEQUEL = re.compile(r"(?i)\s+(I{1,3}|IV|VI{0,3}|IX|X|[A-D]|[0-9]+)$")

OUT_FIELDS = ["exhibit_id", "ace_id", "source", "inventory_grain", "map_source_text", "ace_source_text",
              "n_ace_wordings", "label", "sub_cause", "note", "typo_key_map", "typo_key_ace"]


def squash(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def split_hours_topic(s: str) -> tuple[str | None, str]:
    """(amount, topic) from the cleaned form; (None, typo_key) when the wording has no unit head."""
    m = _HEAD.match(clean_rec(s or ""))
    if not m:
        return None, typo_key(s)
    return m.group("amt") or None, squash(m.group("topic")).casefold().rstrip(_END_MARKS)


def pick_column(fieldnames, aliases) -> str | None:
    lower = {(f or "").lower().strip(): f for f in fieldnames}
    return next((lower[a] for a in aliases if a in lower), None)


def load_inventory(path: Path) -> list[dict]:
    with Path(path).open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_ace_csv(path: Path) -> list[dict]:
    with Path(path).open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return []
        id_col = pick_column(reader.fieldnames, ID_ALIASES)
        text_col = pick_column(reader.fieldnames, TEXT_ALIASES)
        if not id_col or not text_col:
            raise SystemExit(f"{path}: needs an exhibit id column (exhibit_id, AceID, ace_id) and a wording column "
                             f"(credit_recommendation, CreditRecommendation, ace_source_text). It has {reader.fieldnames}")
        out = []
        for row in reader:
            eid, text = (row.get(id_col) or "").strip(), row.get(text_col) or ""
            if eid or squash(text):
                out.append({"exhibit_id": eid, "credit_recommendation": text})
        return out


# ── the gated read (runner or conductor; the sandbox cannot reach the database) ─────────────────────────────────

def gate_headers(env=None) -> dict:
    """The headers that open the reviewer gate, from the environment only. Stops with the reason when none do."""
    env = os.environ if env is None else env
    service = (env.get("SUPABASE_SERVICE_KEY") or "").strip()
    anon = (env.get("SUPABASE_ANON_KEY") or "").strip()
    team = (env.get("CPL_TEAM_PASS") or "").strip()
    if service:
        h = {"apikey": service, "Authorization": f"Bearer {service}"}
    elif anon and team:
        h = {"apikey": anon, "Authorization": f"Bearer {anon}", "x-team-pass": team}
    else:
        raise SystemExit("The ACE catalog table is reviewer-gated. Set SUPABASE_SERVICE_KEY (the runner), or "
                         "SUPABASE_ANON_KEY with CPL_TEAM_PASS, or export the table to a CSV and pass --ace-source csv. "
                         "An anon key alone reads zero rows. Nothing was read.")
    h["Accept"] = "application/json"
    return h


def rest_url(env=None) -> str:
    env = os.environ if env is None else env
    url = (env.get("SUPABASE_URL") or "").strip().rstrip("/")
    if not url:
        raise SystemExit("SUPABASE_URL is not set; this script names no host. Nothing was read.")
    return url + "/rest/v1/"


def _get(url: str, headers: dict, timeout: int = 120):
    """The one request this file makes: a GET. Kept in one place so the tests can pin it.
    Returns (rows, total), total taken from the Content-Range header (`0-999/12345`), None when absent."""
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8")), content_range_total(resp.headers.get("Content-Range"))


def content_range_total(value) -> int | None:
    tail = (value or "").rpartition("/")[2].strip()
    return int(tail) if tail.isdigit() else None


def read_paged(table: str, columns: list[str], order: str, env=None, get=_get) -> list[dict]:
    """Every row of `columns` from `table`, Range-paginated with a stable order, checked against the exact count.

    The read asks for `Prefer: count=exact` and runs until it holds the Content-Range total; a short page (a server
    max-rows below PAGE) does not end it. An empty page before the total, or a total that never comes, stops it."""
    base, headers = rest_url(env), gate_headers(env)
    q = urllib.parse.urlencode({"select": ",".join(columns), "order": order})
    rows: list[dict] = []
    while True:
        h = dict(headers, Range=f"{len(rows)}-{len(rows) + PAGE - 1}", Prefer="count=exact")
        try:
            page, total = get(f"{base}{table}?{q}", h)
        except urllib.error.HTTPError as e:
            raise SystemExit(f"The read of {table} failed (HTTP {e.code}). If it is 404, the S678 migration is not "
                             "applied yet. Nothing was written.") from e
        if total is None:
            raise SystemExit(f"The read of {table} came back without a Content-Range total, so its rows cannot be "
                             "checked as complete. No labels were written.")
        rows.extend(page)
        if len(rows) >= total or not page:
            if len(rows) != total:
                raise SystemExit(f"The read of {table} holds {len(rows):,} rows; the server counts {total:,}. "
                                 "No labels were written.")
            return rows


def load_ace_supabase(env=None, get=_get) -> list[dict]:
    got = read_paged(ACE_TABLE, [ACE_ID_COLUMN, ACE_TEXT_COLUMN], f"{ACE_ID_COLUMN}.asc,cr_md5.asc", env, get)
    if not got:
        raise SystemExit(f"{ACE_TABLE} returned no rows. Either the gate refused this key (it answers an empty list, "
                         "not an error) or the nightly load has not filled it yet. No labels were written.")
    return [{"exhibit_id": str(r.get(ACE_ID_COLUMN) or "").strip(), "credit_recommendation": r.get(ACE_TEXT_COLUMN) or ""}
            for r in got]


def inventory_from_units(units: list[dict]) -> list[dict]:
    """One inventory row per distinct (exhibit_id, credit_rec); the source is ACE, else MAP, else unlabeled."""
    srcs: dict[tuple, set] = defaultdict(set)
    for u in units:
        text = (u.get("credit_rec") or "").strip()
        if text:
            srcs[((u.get("exhibit_id") or "").strip(), text)].add((u.get("source_code") or "").strip().upper())
    out = []
    for (eid, text), s in sorted(srcs.items()):
        source = "ACE" if "ACE" in s else "MAP" if "MAP" in s else "unlabeled"
        out.append({"exhibit_id": eid, "source_text": text, "ace_id": eid, "source": source,
                    "inventory_grain": "exhibit_cr"})
    return out


def load_inventory_supabase(env=None, get=_get) -> list[dict]:
    units = read_paged(UNIT_TABLE, ["exhibit_id", "credit_rec", "source_code"],
                       "exhibit_id.asc,credit_rec.asc,source_code.asc", env, get)
    if not units:
        raise SystemExit(f"{UNIT_TABLE} returned no rows; the gate refused this key. No labels were written.")
    return inventory_from_units(units)


# ── the labels ───────────────────────────────────────────────────────────────────────────────────────────────────

def index_ace(ace_rows: list[dict]) -> dict[str, list[str]]:
    by_id: dict[str, list[str]] = defaultdict(list)
    for row in ace_rows:
        eid, text = (row.get("exhibit_id") or "").strip(), row.get("credit_recommendation") or ""
        if eid and text not in by_id[eid]:
            by_id[eid].append(text)
    return by_id


def is_truncation(inv: str, ace_texts: list[str]) -> bool:
    """One wording is a dangling prefix of the other, or the longer runs on into a new topic.
    The prefix test ignores case (`supervision and` is a prefix of `Supervision and Leadership`); the run-on test
    reads the longer wording's own case."""
    a = squash(inv)
    for raw in ace_texts:
        b = squash(raw)
        if not a or not b or a == b:
            continue
        short, long_ = (a, b) if len(a) <= len(b) else (b, a)
        if len(short) < 12 or not long_.casefold().startswith(short.casefold()):
            continue
        rest = long_[len(short):].strip()
        if not rest or SEQUEL.match(" " + rest):
            continue
        if DANGLE.search(short):
            return True
        if rest[:1].isalpha() and (rest[:1].isupper() or len(rest) >= 12):
            return True
    return False


def sub_cause(inv: str, ace_texts: list[str]) -> str:
    if is_truncation(inv, ace_texts):
        return "truncation"
    inv_h, inv_t = split_hours_topic(inv)
    same_words = False
    for ace in ace_texts:
        ah, at = split_hours_topic(ace)
        if inv_t and at and inv_t == at:
            if inv_h != ah:
                return "different_hours"
            same_words = True
    if same_words:
        return "other_wording"   # same hours and topic: a term word (`semester hours`) or an end mark differs
    return "different_topic" if len(ace_texts) == 1 else "several_ace_recommendations"


def classify_row(row: dict, ace_by_id: dict[str, list[str]]) -> dict:
    source = (row.get("source") or "").strip()
    grain = (row.get("inventory_grain") or "").strip()
    eid = (row.get("exhibit_id") or "").strip()
    ace_id = (row.get("ace_id") or "").strip()
    text = row.get("source_text") or ""
    ace_texts = list(ace_by_id.get(eid, [])) if eid else []
    if ace_id and ace_id != eid:
        ace_texts += [t for t in ace_by_id.get(ace_id, []) if t not in ace_texts]
    note = "worklist_no_exhibit" if grain == "worklist_unmatched" else ("no_exhibit_id" if not eid else "")
    r = {"exhibit_id": row.get("exhibit_id") or "", "ace_id": ace_id, "source": source, "inventory_grain": grain,
         "map_source_text": text, "ace_source_text": "", "n_ace_wordings": len(ace_texts), "label": "",
         "sub_cause": "", "note": note, "typo_key_map": typo_key(text) if text else "", "typo_key_ace": ""}

    def put(label, ace=""):
        r["label"], r["ace_source_text"] = label, ace
        r["typo_key_ace"] = typo_key(ace) if ace else ""
        return r

    # A MAP row is map_only even when ACE carries the same words: checked first.
    if source.upper() == "MAP" or not ace_texts:
        if ace_texts:
            r["note"] = (note + " " if note else "") + "source_is_map"
        return put("map_only", ace_texts[0] if ace_texts else "")
    for ace in ace_texts:
        if text == ace:
            return put("exact_match", ace)
    key = typo_key(text)
    for ace in ace_texts:
        if key and typo_key(ace) == key:
            return put("light_fix_match", ace)
    r["sub_cause"] = sub_cause(text, ace_texts)
    _h, inv_t = split_hours_topic(text)
    chosen = next((a for a in ace_texts if inv_t and split_hours_topic(a)[1] == inv_t), ace_texts[0])
    return put("real_difference", chosen)


def run(inventory: list[dict], ace_rows: list[dict]) -> tuple[list[dict], dict]:
    ace_by_id = index_ace(ace_rows)
    out = [classify_row(row, ace_by_id) for row in inventory]
    labels = Counter(r["label"] for r in out)
    if set(labels) - set(LABELS) or sum(labels[k] for k in LABELS) != len(inventory):
        raise AssertionError(f"the four labels must add up to the inventory: {dict(labels)} vs {len(inventory)}")
    summary = {
        "n_inventory": len(out),
        "n_ace_exhibits": len(ace_by_id),
        "n_ace_wordings": sum(len(v) for v in ace_by_id.values()),
        "labels": {k: labels.get(k, 0) for k in LABELS},
        "labels_add_up": True,
        "real_difference_sub_causes": dict(Counter(r["sub_cause"] for r in out if r["label"] == "real_difference")),
        "map_only_notes": dict(Counter(r["note"] for r in out if r["label"] == "map_only" and r["note"])),
        "ace_table": f"public.{ACE_TABLE}",
    }
    return out, summary


# The one SELECT the conductor runs for the live inventory counts (one JSON value). It mirrors
# inventory_from_units() (one row per distinct trimmed exhibit_id and non-empty credit_rec; source MAP only when no
# row carries ACE) and classify_row()'s map_only rule. tests/cr_exact_match_pass_test.py pins both.
MAP_ONLY_SQL = "((has_map and not has_ace) or exhibit_id = '' or not in_catalog)"
LIVE_COUNTS_SQL = f"""with inv as (
  select coalesce(btrim(exhibit_id), '') as exhibit_id, btrim(credit_rec) as credit_rec,
         bool_or(upper(btrim(source_code)) = 'ACE') as has_ace,
         bool_or(upper(btrim(source_code)) = 'MAP') as has_map
  from public.{UNIT_TABLE}
  where coalesce(btrim(credit_rec), '') <> ''
  group by 1, 2
), lab as (
  select i.*,
         exists (select 1 from public.{ACE_TABLE} c where btrim(c.{ACE_ID_COLUMN}) = i.exhibit_id) as in_catalog,
         exists (select 1 from public.{ACE_TABLE} c where btrim(c.{ACE_ID_COLUMN}) = i.exhibit_id
                   and c.{ACE_TEXT_COLUMN} = i.credit_rec) as exact
  from inv i
)
select json_build_object(
  'n_inventory', count(*),
  'map_only', count(*) filter (where {MAP_ONLY_SQL}),
  'exact_match', count(*) filter (where not {MAP_ONLY_SQL} and exact),
  'light_fix_or_real_difference', count(*) filter (where not {MAP_ONLY_SQL} and not exact),
  'n_ace_exhibits', (select count(distinct btrim({ACE_ID_COLUMN})) from public.{ACE_TABLE}),
  'n_ace_rows', (select count(*) from public.{ACE_TABLE})
) from lab;"""


def write_out(rows: list[dict], path: Path) -> None:
    with Path(path).open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=OUT_FIELDS, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def print_summary(s: dict) -> None:
    print(f"inventory rows: {s['n_inventory']:,}   ACE exhibits: {s['n_ace_exhibits']:,}   "
          f"ACE wordings: {s['n_ace_wordings']:,}")
    for k in LABELS:
        print(f"  {k}: {s['labels'][k]:,}")
    print(f"  the four add up to the inventory: {s['labels_add_up']}")
    for k, v in sorted(s["real_difference_sub_causes"].items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"    real_difference, {k}: {v:,}")


def parse_args(argv=None) -> argparse.Namespace:
    tmp = Path(tempfile.gettempdir()) / "cr_exact_match"
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--print-sql", action="store_true", help="print LIVE_COUNTS_SQL (the conductor's one SELECT) and stop")
    p.add_argument("--ace-source", choices=("csv", "supabase"))
    p.add_argument("--ace-csv", type=Path)
    p.add_argument("--inventory-source", choices=("csv", "supabase"), default="csv")
    p.add_argument("--inventory", type=Path, help="crs_inventory.csv shape; required with --inventory-source csv")
    p.add_argument("--out", type=Path, default=tmp / "cr_exact_match_dryrun.csv")
    p.add_argument("--summary-json", type=Path, default=tmp / "cr_exact_match_dryrun_summary.json")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    if args.print_sql:
        print(LIVE_COUNTS_SQL)
        return 0
    if not args.ace_source:
        raise SystemExit("--ace-source csv|supabase is required")
    if args.ace_source == "csv" and not args.ace_csv:
        raise SystemExit("--ace-source csv needs --ace-csv PATH")
    if args.inventory_source == "csv" and not args.inventory:
        raise SystemExit("--inventory-source csv needs --inventory PATH")
    ace_rows = load_ace_csv(args.ace_csv) if args.ace_source == "csv" else load_ace_supabase()
    inventory = load_inventory(args.inventory) if args.inventory_source == "csv" else load_inventory_supabase()
    rows, summary = run(inventory, ace_rows)
    for path in (args.out, args.summary_json):
        path.parent.mkdir(parents=True, exist_ok=True)
    write_out(rows, args.out)
    args.summary_json.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out}\nwrote {args.summary_json}")
    print_summary(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
