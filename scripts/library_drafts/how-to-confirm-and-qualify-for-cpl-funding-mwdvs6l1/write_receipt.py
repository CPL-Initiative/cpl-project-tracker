"""Writes the S647 store-the-draft SQL, its read-only proof and its Rule 10 receipt for "How to Confirm and Qualify for
CPL Funding".

    python3 scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/write_receipt.py

reads draft.html and the pieces build.mjs puts on the page, and writes, under kb/receipts/:
  cpl_library_s647_<slug>_proof.sql  a read-only SELECT: the forward write's dry run (md5, length, each check by name)
  cpl_library_s647_<slug>.sql        the forward write, ONE plain WITH statement
  cpl_library_s647_<slug>.json       before-values and the rollback (also in cpl_library_s647_<slug>_rollback.sql)

The page is built on the server from Draft 1 (cpl_library_drafts 0aeed57a, the card's draft in the same starter frame):
the SQL carries only this session's pieces and takes build.mjs fromDraft1's steps, by positions. A guard CTE yields a row
only when the built page's md5 and length equal draft.html's, both rows still carry the before-values and the new draft id
is free; the INSERT and the two UPDATEs (id AND updated_at) each hang on that guard, so a refusal writes nothing and reads
0 0 0. If the guard holds and a write still misses its row, the last column's cast fails and aborts the whole statement.
No DO block and no plpgsql: scripts/supabase_sql_guard.py lets plain data writes run and refuses DO (the first form of this
receipt, refused 2026-11-13). Neither row is retired and neither row's status changes. Before-values: read by the S647
conductor on 2026-11-13 at about 09:14Z, re-read at 11:28Z.
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


def build_ctes(p):
    """The page, built on the server from Draft 1 as CTEs d, p, s1..s6 (the page is s6.h): build.mjs fromDraft1, step for
    step, by positions. The proof and the forward write both open their one WITH with these."""
    D = '<meta name="description" content="'
    F = '<footer class="foot"><div class="foot-in">'
    return f"""d as (select html as h from public.cpl_library_drafts where id = {q(DRAFT1)} and library_id = {q(NEW_ID)}),
p as (select {dq('M', p['main'])}::text as m,
  {dq('P', p['panel'])}::text as pn,
  {dq('T', p['title'])}::text as t, {dq('X', p['description'])}::text as ds,
  {dq('C', p['comment'])}::text as c,
  {dq('U', p['published'])}::text as pu),
s1 as materialized (select left(h, strpos(h, '<main') - 1) || m || substr(h, length(h) - strpos(reverse(h), '>niam/<') + 2) as h from d, p),
s2 as materialized (select left(h, strpos(h, '<title>') + 6) || t || substr(h, strpos(h, '</title>')) as h from s1, p),
s3 as materialized (select left(h, i + {len(D)} - 1) || ds || substr(h, i + strpos(substr(h, i), '">') - 1) as h
  from (select h, strpos(h, {q(D)}) as i from s2) x, p),
s4 as materialized (select left(h, i - 1) || left(r, length(r) - length(ltrim(r, E' \\n\\t\\r'))) || c || ltrim(substr(r, strpos(r, '-->') + 3), E' \\n\\t\\r') as h
  from (select h, strpos(h, '<body>') + 6 as i, substr(h, strpos(h, '<body>') + 6) as r from s3) x, p),
s5 as materialized (select left(h, f + strpos(substr(h, f), '<p>') + 1) || pu || substr(h, f + strpos(substr(h, f), '</p>') - 1) as h
  from (select h, strpos(h, {q(F)}) as f from s4) x, p),
s6 as materialized (select left(h, a - 1) || pn || E'\\n' || substr(h, a) as h from (select h, strpos(h, '<!-- Ask Sierra') as a from s5) x, p)"""


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
    ctes = build_ctes(p)
    # One row whatever the server holds: the built page's md5 and length, and each check the write needs, by name.
    chk = f"""k as (select md5(convert_to(h, 'UTF8')) as md5, length(h) as len, h,
  md5(convert_to(h, 'UTF8')) = {q(md5)} and length(h) = {n} as page_ok,
  exists (select 1 from public.cpl_library where id = {q(NEW_ID)} and status = 'requested' and url is null and retired_at is null and updated_at = {q(NEW_AT)}) as new_ok,
  exists (select 1 from public.cpl_library where id = {q(OLD_ID)} and updated_at = {q(OLD_AT)}) as old_ok,
  not exists (select 1 from public.cpl_library_drafts where id = {q(DRAFT_ID)}) as draft_free
  from (select 1) o left join s6 on true)"""

    proof = f"""-- S647, read-only dry run of the forward write: builds Draft 2 from Draft 1 and checks it and both rows. Writes nothing.
-- Expect md5 {md5}, len {n}, and page_ok, new_ok, old_ok, draft_free all true.
with {ctes},
{chk}
select md5, len, page_ok, new_ok, old_ok, draft_free from k;
"""
    (BASE.parent / (BASE.name + "_proof.sql")).write_text(proof, encoding="utf-8")

    # One plain statement (no DO, no plpgsql): every write hangs on the one guard g, and a write that misses its row
    # once g holds fails the cast in the last column, which aborts the statement and with it every write.
    fwd = f"""-- S647: Draft 2 of "How to Confirm and Qualify for CPL Funding" onto mwdvs6l1; mwdv9pl5's ask closed. One statement, all or nothing.
-- Expect ins 1, u1 1, u2 1, md5 {md5}, len {n}. A refusal reads 0 0 0 and the false check says why.
with {ctes},
{chk},
g as (select h from k where page_ok and new_ok and old_ok and draft_free),
ins as (insert into public.cpl_library_drafts (id, library_id, slug, html, based_on, request, summary, edits, model, made_by)
  select {q(DRAFT_ID)}, {q(NEW_ID)}, {q(SLUG)}, h, {q('draft ' + DRAFT1)},
    {q(json.dumps(request, ensure_ascii=False))}::jsonb, {q(SUMMARY)}, 0, null, {q(MADE_BY)} from g
  on conflict (id) do nothing returning id),
u1 as (update public.cpl_library
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
  where id = {q(NEW_ID)} and updated_at = {q(NEW_AT)} and exists (select 1 from g) returning id),
u2 as (update public.cpl_library
  set regen = null, refresh_note = null, note = {q(OLD_NOTE)}, updated_by = {q(BOT)}
  where id = {q(OLD_ID)} and updated_at = {q(OLD_AT)} and exists (select 1 from g) returning id),
n as (select (select count(*) from ins) as ins, (select count(*) from u1) as u1, (select count(*) from u2) as u2)
select n.ins, n.u1, n.u2, k.md5, k.len, k.page_ok, k.new_ok, k.old_ok, k.draft_free,
  case when k.page_ok and k.new_ok and k.old_ok and k.draft_free and (n.ins, n.u1, n.u2) <> (1, 1, 1)
    then ('S647: a write missed its row, so none stands: ' || n.ins || n.u1 || n.u2)::int end as undone
from n, k;
"""
    BASE.with_suffix(".sql").write_text(fwd, encoding="utf-8")

    rollback = f"""-- Rollback for cpl_library_s647_{SLUG}.sql, one statement, all or nothing: restores both rows from the history rows the
-- forward write filed (changed_by {BOT}) while each stands as it left them, then deletes the unpublished draft. Expect 1 1 1.
with h1 as (select before from public.cpl_library_history where library_id = {q(NEW_ID)} and changed_by = {q(BOT)} order by changed_at asc limit 1),
h2 as (select before from public.cpl_library_history where library_id = {q(OLD_ID)} and changed_by = {q(BOT)} order by changed_at asc limit 1),
g as (select 1 from h1, h2
  where exists (select 1 from public.cpl_library where id = {q(NEW_ID)} and updated_by = {q(BOT)} and regen->>'draft_id' = {q(DRAFT_ID)})
    and exists (select 1 from public.cpl_library where id = {q(OLD_ID)} and updated_by = {q(BOT)} and regen is null and note like 'Superseded by {SLUG}%')),
r1 as (update public.cpl_library l
  set regen = h1.before->'regen', refresh_note = h1.before->>'refresh_note', rebuild_from = h1.before->>'rebuild_from',
      note = h1.before->>'note', updated_by = h1.before->>'updated_by'
  from h1 where l.id = {q(NEW_ID)} and l.updated_by = {q(BOT)} and l.regen->>'draft_id' = {q(DRAFT_ID)} and exists (select 1 from g) returning l.id),
r2 as (update public.cpl_library l
  set regen = h2.before->'regen', refresh_note = h2.before->>'refresh_note', note = h2.before->>'note', updated_by = h2.before->>'updated_by'
  from h2 where l.id = {q(OLD_ID)} and l.updated_by = {q(BOT)} and l.regen is null and l.note like 'Superseded by {SLUG}%'
    and exists (select 1 from g) returning l.id),
dd as (delete from public.cpl_library_drafts where id = {q(DRAFT_ID)} and made_by = {q(MADE_BY)} and published_at is null
  and exists (select 1 from g) returning id),
n as (select (select count(*) from r1) as r1, (select count(*) from r2) as r2, (select count(*) from dd) as dd, exists (select 1 from g) as ok)
select r1, r2, dd, ok,
  case when ok and (r1, r2) <> (1, 1) then ('S647 rollback: a restore missed its row, so none stands: ' || r1 || r2)::int end as undone
from n;
"""
    (BASE.parent / (BASE.name + "_rollback.sql")).write_text(rollback, encoding="utf-8")

    receipt = {
        "_about": "Rule 10 receipt (a2) for kb/receipts/cpl_library_s647_" + SLUG + ".sql: one plain WITH statement that builds the "
                  "page on the server from Draft 1, and a guard (md5 and length, both rows' before-values, the draft id free) that "
                  "one INSERT into cpl_library_drafts and two id-and-updated_at UPDATEs of cpl_library each depend on; all three "
                  "land or none does. The before-values are the conductor's read of 2026-11-13 at "
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
