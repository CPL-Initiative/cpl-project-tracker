"""Writes the S647 store-the-draft SQL and its Rule 10 receipt for "How to Confirm and Qualify for CPL Funding".

    python3 scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/write_receipt.py

reads draft.html beside this file (build.mjs writes it) and writes
  kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql   the forward write, one transaction
  kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.json  before-values and the rollback

The forward write: (1) INSERT the draft into cpl_library_drafts, ON CONFLICT DO NOTHING; (2) a guarded UPDATE of
mwdvs6l1 (id AND updated_at) pointing its regen at the draft, Draft 1 kept under earlier; (3) a guarded UPDATE of
mwdv9pl5 (id AND updated_at) that closes Ally's open 18:19Z ask with a pointer to mwdvs6l1. Neither row is retired.
Before-values: read by the S647 conductor at 09:12Z and again at 09:35Z on 2026-11-13, unchanged.
"""
import json
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
OUT = ROOT / "kb" / "receipts" / f"cpl_library_s647_{SLUG}"

ASK_1 = "We need three separate cards. The third card should read \"How to confirm\". Each card should be clickable and should show a sidebar with the visual"
ASK_2 = "Add the links in each box to the appropriate visual e.g. \"how to add your CPL coordinator and noncredit lead into MAP\""
BRIEF_LINKS = "Make sure the links open to a side bar view of those visuals instead of opening seperate tabs."

# The rows as they stand (the conductor's reads; key order as stored).
BEFORE_NEW = {
    "updated_at": NEW_AT, "updated_by": "Ally Barker", "note": None, "refresh_note": None, "rebuild_from": None,
    "regen": {"publish": "show", "draft_id": DRAFT1, "ready_at": "2026-11-12T18:28:48.221Z", "draft_url": None,
              "new_piece": True, "drafted_by": "Ally Barker", "drafted_with": "library-revise-draft",
              "requested_at": "2026-11-12T18:28:27.851Z", "requested_by": "Ally Barker"},
}
BEFORE_OLD = {
    "updated_at": OLD_AT, "updated_by": "Ally Barker", "note": None, "refresh_note": ASK_2,
    "regen_summary": {"earlier": [
        {"draft_id": "ab6214c8-a24c-4add-a601-b988e0dd9932", "ready_at": "2026-11-12T18:14:51.182Z", "note": None},
        {"draft_id": "62fd17cc-2649-4c39-a995-321b27a9804e", "ready_at": "2026-11-12T18:17:58.455Z", "note": ASK_1}],
        "publish": "show", "requested_at": "2026-11-12T18:19:23.283Z", "requested_by": "Ally Barker",
        "based_on_draft": "62fd17cc-2649-4c39-a995-321b27a9804e"},
    "regen_exact": "filed whole by cpl_library_history_trg (changed_by = 'library-s647@bot') when the forward write runs; "
                   "the rollback restores it from there, byte for byte",
}

SUMMARY = ("Draft 2, built in session S647 from Ally Barker's brief and her asks of 2026-11-12 (carried from " + OLD_SLUG +
           "): three cards, each opening its guide beside the page (the coordinator and noncredit lead guide, the JST guide, "
           "and How to confirm, which shows the page's own four steps), with Open in a new tab in the panel. Above them, the "
           "four minimum conditions in the published funding scenario's own words. Remediated: npm run a11y passed light and "
           "dark at every width, with each kind of panel open; the panel is a modal dialog with a focus trap, Escape and Close.")

REFRESH = ("Carried from " + OLD_SLUG + " (Ally Barker, 2026-11-12): " + ASK_1 + ". " + ASK_2 + ". " + BRIEF_LINKS)[:600]

REBUILD = ("node scripts/library_drafts/" + SLUG + "/build.mjs (cpl-project-tracker) writes draft.html from main.html and panel.html "
           "in the starter page's frame; write_receipt.py stores it as the card's draft. Publish it on the card writes library/" + SLUG + "/.")

OLD_NOTE = ("Superseded by " + SLUG + " (S647, 2026-11-13): Ally Barker's last ask here (2026-11-12 18:19 UTC, \"" + ASK_2 +
            "\") is answered by that record's Draft 2, " + DRAFT_ID + ". This record's two drafts stay in cpl_library_drafts "
            "(ab6214c8, 62fd17cc). Retiring this duplicate is Ally's press.")


def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def main():
    html = (HERE / "draft.html").read_text(encoding="utf-8")
    tag = "$QDRAFT$"
    assert tag not in html
    request = {"new_piece": True, "session": "S647", "carried_from": OLD_SLUG, "asks": [ASK_1, ASK_2],
               "brief_links": BRIEF_LINKS, "source": "scripts/library_drafts/" + SLUG + "/ (cpl-project-tracker)",
               "sierra": {"before": 0, "after": 2481, "max": 34000},
               "remediated": "npm run a11y: light, dark, the How to confirm panel open, a guide's panel open; all pass"}
    earlier = [{"draft_id": DRAFT1, "draft_url": None, "ready_at": BEFORE_NEW["regen"]["ready_at"],
                "requested_by": "Ally Barker", "note": None, "documents": []}]
    sql = f"""-- S647 (SkyPipit's worker), 2026-11-13: store Draft 2 of "How to Confirm and Qualify for CPL Funding" as the card's draft,
-- and close the duplicate record's open ask. Written by scripts/library_drafts/{SLUG}/write_receipt.py.
-- Receipt and rollback: kb/receipts/cpl_library_s647_{SLUG}.json. Nothing public changes: the draft is not listed and is
-- published only when someone presses Publish it on the card.
-- Guarded: each UPDATE keys on id AND updated_at as read 2026-11-13 09:35Z, and the first only runs once the draft row exists.
-- Run as one transaction; check that each statement reports 1 row (the INSERT 0 on a re-run).
begin;

insert into public.cpl_library_drafts (id, library_id, slug, html, based_on, request, summary, edits, model, made_by)
select {q(DRAFT_ID)}::uuid, l.id, l.slug, {tag}{html}{tag},
       {q('draft ' + DRAFT1)}, {q(json.dumps(request, ensure_ascii=False))}::jsonb, {q(SUMMARY)}, 0, null, {q(MADE_BY)}
from public.cpl_library l
where l.id = {q(NEW_ID)} and l.slug = {q(SLUG)} and l.updated_at = {q(NEW_AT)} and l.retired_at is null
on conflict (id) do nothing;

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
where id = {q(NEW_ID)} and updated_at = {q(NEW_AT)}
  and exists (select 1 from public.cpl_library_drafts d where d.id = {q(DRAFT_ID)} and d.library_id = {q(NEW_ID)});

update public.cpl_library
set regen = null, refresh_note = null, note = {q(OLD_NOTE)}, updated_by = {q(BOT)}
where id = {q(OLD_ID)} and updated_at = {q(OLD_AT)};

commit;
"""
    OUT.with_suffix(".sql").write_text(sql, encoding="utf-8")

    rollback = f"""begin;
-- Restore both rows from the history row the forward write filed (cpl_library_history_trg, changed_by {BOT}), only while
-- each row still stands as the forward write left it.
update public.cpl_library l
set regen = h.before->'regen', refresh_note = h.before->>'refresh_note', rebuild_from = h.before->>'rebuild_from',
    note = h.before->>'note', updated_by = h.before->>'updated_by'
from (select distinct on (library_id) library_id, before from public.cpl_library_history
      where changed_by = {q(BOT)} and library_id in ({q(NEW_ID)}, {q(OLD_ID)})
      order by library_id, changed_at asc) h
where l.id = h.library_id and l.updated_by = {q(BOT)};
-- mwdvs6l1's regen as a literal, should the history row be missing:
-- update public.cpl_library set regen = {q(json.dumps(BEFORE_NEW['regen']))}::jsonb, refresh_note = null, rebuild_from = null, updated_by = 'Ally Barker'
--   where id = {q(NEW_ID)} and updated_by = {q(BOT)};
delete from public.cpl_library_drafts where id = {q(DRAFT_ID)} and made_by = {q(MADE_BY)} and published_at is null;
commit;"""
    receipt = {
        "_about": "Rule 10 receipt (a2) for kb/receipts/cpl_library_s647_" + SLUG + ".sql: two guarded UPDATEs of cpl_library and one "
                  "INSERT into cpl_library_drafts. The before-values below are the conductor's reads of 2026-11-13 09:12Z and 09:35Z "
                  "(unchanged between them). cpl_library_history files each prior row whole when the write runs; the rollback "
                  "restores from it, and carries mwdvs6l1's regen as a literal as well.",
        "session": "S647 (SkyPipit), worker for the CPL Library's carried request",
        "cohort": BOT,
        "draft": {"id": DRAFT_ID, "library_id": NEW_ID, "slug": SLUG, "based_on": "draft " + DRAFT1, "made_by": MADE_BY,
                  "source": "scripts/library_drafts/" + SLUG + "/", "html_chars": len(html)},
        "rows": {
            SLUG: {"id": NEW_ID, "guard_updated_at": NEW_AT, "before": BEFORE_NEW,
                   "after": {"regen": "draft_id " + DRAFT_ID + ", ready_at now, based_on_draft " + DRAFT1 + ", Draft 1 under earlier",
                             "refresh_note": REFRESH, "rebuild_from": REBUILD, "updated_by": BOT}},
            OLD_SLUG: {"id": OLD_ID, "guard_updated_at": OLD_AT, "before": BEFORE_OLD,
                       "after": {"regen": None, "refresh_note": None, "note": OLD_NOTE, "updated_by": BOT}},
        },
        "rollback": rollback,
    }
    OUT.with_suffix(".json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(OUT.with_suffix(".sql"), OUT.with_suffix(".sql").stat().st_size, "bytes")


if __name__ == "__main__":
    main()
