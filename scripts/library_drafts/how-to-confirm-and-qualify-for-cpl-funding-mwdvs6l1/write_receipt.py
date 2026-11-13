"""Writes the S647 store-the-draft SQL, its read-only proof and its Rule 10 receipt for "How to Confirm and Qualify for
CPL Funding".

    python3 scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/write_receipt.py

reads draft.html and the pieces build.mjs puts on the page, and writes, under kb/receipts/:
  cpl_library_s647_<slug>_proof.sql  a read-only SELECT: builds the page on the server and returns md5, length, matches
  cpl_library_s647_<slug>.sql        the forward write, one DO block
  cpl_library_s647_<slug>.json       before-values and the rollback (also in cpl_library_s647_<slug>_rollback.sql)

The page is built on the server from Draft 1 (cpl_library_drafts 0aeed57a, the card's draft in the same starter frame):
the SQL carries only this session's pieces and takes build.mjs fromDraft1's steps, by positions, then refuses unless the
md5 of what it built equals draft.html's. The forward write then re-checks both rows, INSERTs the draft, runs two guarded
UPDATEs (id AND updated_at) and raises, undoing all of it, unless each touches exactly one row. Neither row is retired and
neither row's status changes. Before-values: read by the S647 conductor on 2026-11-13 at about 09:14Z.
"""
import hashlib
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SLUG = "how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1"
OLD_SLUG = "how-to-confirm-and-qualify-for-cpl-funding-mwdv9pl5"
NEW_ID = "4660a13b-984e-4030-a83b-762c507510a7"
OLD_ID = "f1078c28-d9fc-423b-bfc3-0832ae5e43fd"
NEW_AT = "2026-11-12 18:28:48.277161+00"
OLD_AT = "2026-11-12 18:19:23.709551+00"
DRAFT_ID = "b18c5759-b55b-4341-b3fc-f59c1fd5bcf6"
DRAFT1 = "0aeed57a-9855-4abe-84be-3afa59839fa3"
BOT = "library-s647@bot"
MADE_BY = "S647 session"
BASE = ROOT / "kb" / "receipts" / f"cpl_library_s647_{SLUG}"

ASK_1 = "We need three separate cards. The third card should read \"How to confirm\". Each card should be clickable and should show a sidebar with the visual"
ASK_2 = "Add the links in each box to the appropriate visual e.g. \"how to add your CPL coordinator and noncredit lead into MAP\""
BRIEF_LINKS = "Make sure the links open to a side bar view of those visuals instead of opening seperate tabs."

BEFORE_NEW = {
    "status": "requested", "url": None, "retired_at": None,
    "updated_at": NEW_AT, "updated_by": "Ally Barker", "note": None, "refresh_note": None, "rebuild_from": None,
    "regen": {"publish": "show", "draft_id": DRAFT1, "ready_at": "2026-11-12T18:28:48.221Z", "draft_url": None,
              "new_piece": True, "drafted_by": "Ally Barker", "drafted_with": "library-revise-draft",
              "requested_at": "2026-11-12T18:28:27.851Z", "requested_by": "Ally Barker"},
}
BEFORE_OLD = {
    "status": "requested", "url": None, "retired_at": None,
    "updated_at": OLD_AT, "updated_by": "Ally Barker", "note": None, "refresh_note": ASK_2,
    "regen_summary": {"earlier": [
        {"draft_id": "ab6214c8-a24c-4add-a601-b988e0dd9932", "ready_at": "2026-11-12T18:14:51.182Z", "note": None},
        {"draft_id": "62fd17cc-2649-4c39-a995-321b27a9804e", "ready_at": "2026-11-12T18:17:58.455Z", "note": ASK_1}],
        "publish": "show", "requested_at": "2026-11-12T18:19:23.283Z", "requested_by": "Ally Barker",
        "based_on_draft": "62fd17cc-2649-4c39-a995-321b27a9804e"},
    "regen_exact": "filed whole by cpl_library_history_trg (changed_by = 'library-s647@bot') when the forward write runs; "
                   "the rollback restores it from there, byte for byte",
}

SUMMARY = ("Draft 2 (S647, session) from Ally Barker's asks of 2026-11-12: three cards that open beside the page (two guides "
           "and How to confirm), under the four minimum conditions in the published scenario's words. npm run a11y passed.")
REFRESH = ("Carried from " + OLD_SLUG + " (Ally Barker, 2026-11-12): three clickable cards, the third How to confirm, "
           "each opening its visual in a side bar, with the links in each box.")
REBUILD = "node scripts/library_drafts/" + SLUG + "/build.mjs (cpl-project-tracker); write_receipt.py stores it as the card's draft."
OLD_NOTE = ("Superseded by " + SLUG + " (S647, 2026-11-13): its Draft 2 answers this record's last ask (Ally Barker, "
            "2026-11-12 18:19 UTC). Drafts ab6214c8 and 62fd17cc stay. Retiring this duplicate is Ally's press.")


def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def dq(tag, s):
    t = "$" + tag + "$"
    assert t not in s and "$$" not in s, tag
    return t + s + t


def pieces():
    out = subprocess.run(["node", "--input-type=module", "-e",
                          "const m = await import(process.argv[2]); process.stdout.write(JSON.stringify(Object.assign(m.pieces(), { built: m.build() })));", "pieces",
                          str(HERE / "build.mjs")], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def build_query(p):
    """The page, built on the server from Draft 1: build.mjs fromDraft1, step for step, by positions."""
    D = '<meta name="description" content="'
    F = '<footer class="foot"><div class="foot-in">'
    return f"""with d as (select html as h from public.cpl_library_drafts where id = {q(DRAFT1)} and library_id = {q(NEW_ID)}),
p as (select {dq('M', p['main'])}::text as m,
  {dq('P', p['panel'])}::text as pn,
  {dq('T', p['title'])}::text as t, {dq('X', p['description'])}::text as ds,
  {dq('C', p['comment'])}::text as c,
  {dq('U', p['published'])}::text as pu),
s1 as (select left(h, strpos(h, '<main') - 1) || m || substr(h, length(h) - strpos(reverse(h), '>niam/<') + 2) as h from d, p),
s2 as (select left(h, strpos(h, '<title>') + 6) || t || substr(h, strpos(h, '</title>')) as h from s1, p),
s3 as (select left(h, i + {len(D)} - 1) || ds || substr(h, i + strpos(substr(h, i), '">') - 1) as h
  from (select h, strpos(h, {q(D)}) as i from s2) x, p),
s4 as (select left(h, i - 1) || left(r, length(r) - length(ltrim(r, E' \\n\\t\\r'))) || c || ltrim(substr(r, strpos(r, '-->') + 3), E' \\n\\t\\r') as h
  from (select h, strpos(h, '<body>') + 6 as i, substr(h, strpos(h, '<body>') + 6) as r from s3) x, p),
s5 as (select left(h, f + strpos(substr(h, f), '<p>') + 1) || pu || substr(h, f + strpos(substr(h, f), '</p>') - 1) as h
  from (select h, strpos(h, {q(F)}) as f from s4) x, p),
s6 as (select left(h, a - 1) || pn || E'\\n' || substr(h, a) as h from (select h, strpos(h, '<!-- Ask Sierra') as a from s5) x, p)
select h from s6"""


def main():
    html = (HERE / "draft.html").read_text(encoding="utf-8")
    md5 = hashlib.md5(html.encode("utf-8")).hexdigest()
    n = len(html)
    p = pieces()
    assert p.pop("built") == html, "draft.html is not what build.mjs makes now: run build.mjs first"
    request = {"new_piece": True, "session": "S647", "carried_from": OLD_SLUG, "source": "scripts/library_drafts/" + SLUG + "/",
               "deadline_source": "cpl_funding_config Scenario 4 participationDeadline, read 2026-11-13; typed on the page, "
                                  "it does not follow the config"}
    earlier = [{"draft_id": DRAFT1, "draft_url": None, "ready_at": BEFORE_NEW["regen"]["ready_at"],
                "requested_by": "Ally Barker", "note": None, "documents": []}]
    bq = build_query(p)

    proof = f"""-- S647, read-only: build Draft 2 on the server from Draft 1 ({DRAFT1}) and the pieces below, and say whether it is
-- byte for byte the committed scripts/library_drafts/{SLUG}/draft.html (md5 {md5}, {n} characters).
-- Writes nothing. Expect one row: matches = true.
select md5(convert_to(b.h, 'UTF8')) as md5, length(b.h) as chars,
       md5(convert_to(b.h, 'UTF8')) = {q(md5)} and length(b.h) = {n} as matches
from ({bq}) b;
"""
    (BASE.parent / (BASE.name + "_proof.sql")).write_text(proof, encoding="utf-8")

    fwd = f"""-- S647, 2026-11-13: Draft 2 of "How to Confirm and Qualify for CPL Funding" onto mwdvs6l1; close mwdv9pl5's open ask.
-- Run _proof.sql first. Built on the server from Draft 1; refuses unless md5 {md5} ({n} chars); re-checks both rows as read
-- 2026-11-13 ~09:14Z; raises, undoing all, unless each write touches one row. Source: scripts/library_drafts/{SLUG}/.
do $$
declare v_html text; v_n int; v_row record;
begin
  v_html := ({bq});
  if v_html is null or md5(convert_to(v_html, 'UTF8')) <> {q(md5)} or length(v_html) <> {n} then
    raise exception 'S647: the built page is not draft.html (md5 %, length %)', md5(convert_to(v_html, 'UTF8')), length(v_html);
  end if;
  select status, url, retired_at, updated_at into v_row from public.cpl_library where id = {q(NEW_ID)} for update;
  if not found or v_row.status is distinct from 'requested' or v_row.url is not null or v_row.retired_at is not null
     or v_row.updated_at <> {q(NEW_AT)}::timestamptz then
    raise exception 'S647: mwdvs6l1 moved since it was read (status %, updated_at %)', v_row.status, v_row.updated_at;
  end if;
  select updated_at, retired_at into v_row from public.cpl_library where id = {q(OLD_ID)} for update;
  if not found or v_row.updated_at <> {q(OLD_AT)}::timestamptz then
    raise exception 'S647: mwdv9pl5 moved since it was read (updated_at %)', v_row.updated_at;
  end if;

  insert into public.cpl_library_drafts (id, library_id, slug, html, based_on, request, summary, edits, model, made_by)
  values ({q(DRAFT_ID)}, {q(NEW_ID)}, {q(SLUG)}, v_html, {q('draft ' + DRAFT1)},
          {q(json.dumps(request, ensure_ascii=False))}::jsonb, {q(SUMMARY)}, 0, null, {q(MADE_BY)})
  on conflict (id) do nothing;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647: the draft insert touched % rows', v_n; end if;

  update public.cpl_library
  set regen = jsonb_build_object(
        'publish', 'show', 'new_piece', true,
        'requested_at', '2026-11-12T18:19:23.283Z', 'requested_by', 'Ally Barker',
        'based_on_draft', {q(DRAFT1)}, 'carried_from', {q(OLD_SLUG)},
        'draft_id', {q(DRAFT_ID)}, 'draft_url', null,
        'ready_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'drafted_by', 'S647 SkyPipit (session)', 'drafted_with', 'session',
        'earlier', {q(json.dumps(earlier))}::jsonb),
      refresh_note = {q(REFRESH)},
      rebuild_from = {q(REBUILD)},
      updated_by = {q(BOT)}
  where id = {q(NEW_ID)} and updated_at = {q(NEW_AT)};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647: mwdvs6l1 update touched % rows', v_n; end if;

  update public.cpl_library
  set regen = null, refresh_note = null, note = {q(OLD_NOTE)}, updated_by = {q(BOT)}
  where id = {q(OLD_ID)} and updated_at = {q(OLD_AT)};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647: mwdv9pl5 update touched % rows', v_n; end if;

  raise notice 'S647: draft stored on mwdvs6l1; mwdv9pl5 closed';
end $$;
"""
    BASE.with_suffix(".sql").write_text(fwd, encoding="utf-8")

    rollback = f"""-- Rollback for cpl_library_s647_{SLUG}.sql. Restores both rows from the history rows the forward write filed
-- (cpl_library_history_trg, changed_by {BOT}), only while each still stands as the forward write left it, and raises,
-- changing nothing, unless both restores touch exactly one row; only then deletes the stored draft. The restore sets
-- updated_by back to 'Ally Barker', so cpl_library_history files the rollback itself under her name.
do $$
declare v_n int;
begin
  update public.cpl_library l
  set regen = h.before->'regen', refresh_note = h.before->>'refresh_note', rebuild_from = h.before->>'rebuild_from',
      note = h.before->>'note', updated_by = h.before->>'updated_by'
  from (select before from public.cpl_library_history where library_id = {q(NEW_ID)} and changed_by = {q(BOT)}
        order by changed_at asc limit 1) h
  where l.id = {q(NEW_ID)} and l.updated_by = {q(BOT)} and l.regen->>'draft_id' = {q(DRAFT_ID)};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647 rollback: {SLUG} is not as the forward write left it (% rows)', v_n; end if;

  update public.cpl_library l
  set regen = h.before->'regen', refresh_note = h.before->>'refresh_note', note = h.before->>'note',
      updated_by = h.before->>'updated_by'
  from (select before from public.cpl_library_history where library_id = {q(OLD_ID)} and changed_by = {q(BOT)}
        order by changed_at asc limit 1) h
  where l.id = {q(OLD_ID)} and l.updated_by = {q(BOT)} and l.regen is null and l.note like 'Superseded by {SLUG}%';
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647 rollback: {OLD_SLUG} is not as the forward write left it (% rows)', v_n; end if;

  delete from public.cpl_library_drafts where id = {q(DRAFT_ID)} and made_by = {q(MADE_BY)} and published_at is null;
  get diagnostics v_n = row_count;
  raise notice 'S647 rollback: both rows restored; % draft row deleted', v_n;
end $$;
"""
    (BASE.parent / (BASE.name + "_rollback.sql")).write_text(rollback, encoding="utf-8")

    receipt = {
        "_about": "Rule 10 receipt (a2) for kb/receipts/cpl_library_s647_" + SLUG + ".sql: one DO block that builds the page on the "
                  "server from Draft 1 and checks its md5, then one INSERT into cpl_library_drafts and two guarded UPDATEs of "
                  "cpl_library, each required to touch exactly one row. The before-values are the conductor's read of 2026-11-13 at "
                  "about 09:14Z. cpl_library_history files each prior row whole when the write runs; the rollback restores from it. "
                  "The rollback sets updated_by back to 'Ally Barker', so the history row it files carries her name, not the bot's.",
        "session": "S647 (SkyPipit), worker for the CPL Library's carried request",
        "cohort": BOT,
        "proof": "kb/receipts/cpl_library_s647_" + SLUG + "_proof.sql (read-only; expects matches = true)",
        "draft": {"id": DRAFT_ID, "library_id": NEW_ID, "slug": SLUG, "based_on": "draft " + DRAFT1, "made_by": MADE_BY,
                  "source": "scripts/library_drafts/" + SLUG + "/", "md5": md5, "chars": n,
                  "built_from": "Draft 1 (" + DRAFT1 + ") on the server: build.mjs fromDraft1's steps"},
        "rows": {
            SLUG: {"id": NEW_ID, "guard_updated_at": NEW_AT, "before": BEFORE_NEW,
                   "after": {"regen": "draft_id " + DRAFT_ID + ", ready_at at write time, based_on_draft " + DRAFT1 +
                             ", Draft 1 under earlier", "refresh_note": REFRESH, "rebuild_from": REBUILD, "updated_by": BOT}},
            OLD_SLUG: {"id": OLD_ID, "guard_updated_at": OLD_AT, "before": BEFORE_OLD,
                       "after": {"regen": None, "refresh_note": None, "note": OLD_NOTE, "updated_by": BOT,
                                 "status": "unchanged (requested); retiring it is Ally's press"}},
        },
        "rollback": "kb/receipts/cpl_library_s647_" + SLUG + "_rollback.sql",
        "rollback_sql": rollback,
    }
    BASE.with_suffix(".json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for f in (BASE.parent / (BASE.name + "_proof.sql"), BASE.with_suffix(".sql"), BASE.parent / (BASE.name + "_rollback.sql")):
        print(f.relative_to(ROOT), f.stat().st_size, "bytes")
    print("md5", md5, "chars", n)


if __name__ == "__main__":
    main()
