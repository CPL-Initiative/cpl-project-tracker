-- cobi_nav — the side menu, as data.
--
-- WHY THIS EXISTS
-- ---------------
-- Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by
-- drag and drop from a single place where I can manage the org where they
-- appear, hierarchy, naming, visibility, and access via either team phrase or
-- magic link. It's getting busy and needs to be organized better."
--
-- Before this, the menu lived in three places, all code: the order and grouping
-- in nav_groups.js, the site mapping in cobi_orgs.js, and the labels in the page
-- markup. There was nothing for a drag to write to.
--
-- ── THE OVERLAY RULE, WHICH IS LOAD-BEARING ──────────────────────────────────
-- Same shape as sierra_rules, and for a sharper reason. This table OVERLAYS the
-- code defaults; it never replaces them. Every group and every tab still ships
-- in nav_groups.js and the markup. A failed read costs the ARRANGEMENT, never
-- the MENU.
--
-- That matters more here than anywhere else in the project, because the nav is
-- the entry point for every visitor including anonymous ones. A nav that fails
-- closed is a site with no navigation at all. So: the page builds its menu from
-- code first and paints it, and the overlay is applied only if and when it
-- arrives. A reader who is offline, blocked, or hitting a broken table gets
-- exactly today's menu.
--
-- ── READ IS PUBLIC, AND HAS TO BE ────────────────────────────────────────────
-- Every visitor's nav depends on this table, so SELECT is open to anon. That is
-- not a new exposure: the menu is already in the page markup and the public
-- repo. Writes are reviewer magic-link only — the same gate as the Admin tab
-- that edits it.
--
-- ⚠ A ROW HERE IS A DISPLAY SETTING, NOT A SECURITY SETTING. `hidden` and `orgs`
-- change who SEES a menu item. They do not protect the data behind it; RLS on
-- the underlying tables does, and the Admin tab shows both side by side so the
-- difference cannot be missed. Hiding a tab whose tables are public-read leaves
-- every row readable by anyone who knows the URL.
--
-- ── THE PROTECTED SET, ENFORCED IN CODE ──────────────────────────────────────
-- `admin` cannot be hidden and cannot lose its pin. The guarantee lives in
-- nav_overlay.js rather than here, because this table is the thing being
-- guarded: a row that hid the Admin tab would remove the only surface that can
-- un-hide it, from every browser at once, with no deploy in between. Same
-- reasoning as PROTECTED_RULE_KEYS in cpl-chat.

create table if not exists public.cobi_nav (
  -- 'tab'   -> key is a data-tab id (e.g. 'sierra-training')
  -- 'group' -> key is a nav_groups.js group id (e.g. 'sierra')
  kind        text not null check (kind in ('tab', 'group')),
  key         text not null check (key ~ '^[a-z0-9][a-z0-9-]{0,48}$'),

  -- NULL means "keep the default": the markup label for a tab, the code label
  -- for a group. Nullable rather than pre-filled so an untouched row is
  -- distinguishable from one deliberately renamed to its own default.
  label       text check (label is null or char_length(label) between 1 and 60),

  -- For kind='tab': the group id it belongs to, or NULL for top level.
  -- Not a foreign key: groups live in code, and a parent naming a group that no
  -- longer exists must degrade to top-level rather than block the write.
  parent      text,

  sort_order  integer,
  hidden      boolean not null default false,

  -- For kind='tab': explicit list of site ids that show it. NULL = the code
  -- default (everywhere except the EXCLUSIVE list).
  orgs        text[],
  -- Survives the per-site filter entirely (cobi_orgs.js ALWAYS).
  pinned      boolean not null default false,

  -- DISPLAY-ONLY audience filter: who SEES this item in the menu.
  --   everyone   — anyone, including anonymous visitors (the default)
  --   signed_in  — anyone holding a team/site phrase OR a magic-link session
  --   magic_link — only a magic-link session (the phrase does not reveal it)
  --
  -- ⚠ THIS IS NOT AN ACCESS CONTROL, and the wording is deliberate: it says who
  -- SEES the menu item, not who can reach the tab. The pane still exists, its
  -- deep link still routes, and the data behind it is exactly as protected as
  -- its RLS policies make it — no more. Someone who "secures" a tab by setting
  -- this has secured nothing. The Admin tab prints the real gate beside this
  -- control for exactly that reason.
  --
  -- The viewer's state is read from local/session storage, which cannot fail
  -- over a network, so there is no third "unknown" case to fall back from. A
  -- storage read that throws is treated as "that credential absent" — per
  -- credential, not globally, so a private-mode localStorage failure cannot
  -- also revoke a magic-link session held in sessionStorage.
  audience    text not null default 'everyone'
                check (audience in ('everyone', 'signed_in', 'magic_link')),

  updated_by  text,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  primary key (kind, key)
);

comment on table public.cobi_nav is
  'Overlay for the COBI side menu. Code holds the defaults; this holds curator '
  'arrangement (order, grouping, labels, site visibility). A failed read costs '
  'the arrangement, never the menu. DISPLAY ONLY — not a security boundary.';

alter table public.cobi_nav enable row level security;

-- Public read: every visitor's nav depends on it, including anonymous ones.
drop policy if exists cobi_nav_public_select on public.cobi_nav;
create policy cobi_nav_public_select on public.cobi_nav
  for select using (true);

-- Reviewer-only writes, matching the Admin tab that edits them.
drop policy if exists cobi_nav_reviewer_insert on public.cobi_nav;
create policy cobi_nav_reviewer_insert on public.cobi_nav
  for insert with check (public.is_allowed_reviewer());

drop policy if exists cobi_nav_reviewer_update on public.cobi_nav;
create policy cobi_nav_reviewer_update on public.cobi_nav
  for update using (public.is_allowed_reviewer())
              with check (public.is_allowed_reviewer());

-- DELETE is allowed here, unlike sierra_rules — and the difference is
-- deliberate. There, a deleted rule loses the record of what was tried, so the
-- posture is deactivate-not-delete. Here, deleting a row means "this menu item
-- goes back to exactly how it ships", which is the cleanest possible reset and
-- the one a curator will reach for after a bad drag. The audit log below keeps
-- the history that the row itself no longer carries.
drop policy if exists cobi_nav_reviewer_delete on public.cobi_nav;
create policy cobi_nav_reviewer_delete on public.cobi_nav
  for delete using (public.is_allowed_reviewer());

-- ── Audit trail ──────────────────────────────────────────────────────────────
-- A drag here changes the menu for every visitor with no PR, no CI and no
-- deploy. That is the point, and it is also why every version is kept.
create table if not exists public.cobi_nav_log (
  id      uuid primary key default gen_random_uuid(),
  at      timestamptz not null default now(),
  actor   text,
  action  text not null check (action in ('create', 'update', 'delete')),
  kind    text,
  key     text,
  before  jsonb,
  after   jsonb
);

create index if not exists cobi_nav_log_at on public.cobi_nav_log (at desc);

alter table public.cobi_nav_log enable row level security;

drop policy if exists cobi_nav_log_reviewer_select on public.cobi_nav_log;
create policy cobi_nav_log_reviewer_select on public.cobi_nav_log
  for select using (public.is_allowed_reviewer());

create or replace function public.cobi_nav_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.cobi_nav_log (actor, action, kind, key, before, after)
    values (old.updated_by, 'delete', old.kind, old.key, to_jsonb(old), null);
    return old;
  end if;
  insert into public.cobi_nav_log (actor, action, kind, key, before, after)
  values (
    new.updated_by,
    case when tg_op = 'INSERT' then 'create' else 'update' end,
    new.kind, new.key,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end $$;

drop trigger if exists cobi_nav_audit_trg on public.cobi_nav;
create trigger cobi_nav_audit_trg
  after insert or update or delete on public.cobi_nav
  for each row execute function public.cobi_nav_audit();

-- ── Seeding ──────────────────────────────────────────────────────────────────
-- DELIBERATELY EMPTY, for the same reason sierra_rules is. Zero rows means the
-- menu is exactly what the code ships, so the overlay is proven to be a no-op on
-- day one and `select * from cobi_nav` reads as "what we have deliberately
-- rearranged" rather than a second copy of nav_groups.js that can drift from it.
