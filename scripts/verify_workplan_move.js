// Behavior check for kb/supabase_workplan_move.sql, against a local Postgres 16
// (PGlite, in-process WebAssembly) holding the seven id-keyed tables as they stand
// live. Not part of `npm test`: PGlite is not a dependency. Run it after any change
// to the function:
//
//   npm i --no-save @electric-sql/pglite@0.2.17 && node scripts/verify_workplan_move.js
//
// It runs the SQL file exactly as committed, then checks:
//   (a) the 1.1.2 -> 4.2.1 move Sam asked for: every table re-keyed, the home link
//       primary, the Activity 1 link kept, update_log re-pointed through its FK,
//       and the before-values filed;
//   (b) the refusals: not a reviewer, an id in use, a sub-activity with children,
//       a malformed id, moving under itself, a missing parent;
//   (c) THE GUARD: a table the function does not know that still holds the old id
//       stops the move and nothing changes;
//   (d) dropping the old home's link when asked;
//   (e) the undo in the SQL file's header puts every row back.
const fs = require("fs");
const path = require("path");

let PGlite;
try { ({ PGlite } = require("@electric-sql/pglite")); }
catch (e) {
  console.log("PGlite is not installed. Run: npm i --no-save @electric-sql/pglite@0.2.17");
  process.exit(2);
}

const SQL = fs.readFileSync(path.join(__dirname, "..", "kb", "supabase_workplan_move.sql"), "utf8");
const results = [];
const check = (name, ok, detail) => results.push([name, !!ok, detail]);

// The live shapes (information_schema, 2026-10-13), reduced to the columns the move reads.
const SCHEMA = `
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
create table public.allowed_reviewers (email text primary key);
create function public.is_allowed_reviewer() returns boolean language sql security definer set search_path = public as
  $$ select exists (select 1 from public.allowed_reviewers where lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))) $$;
create table public.projects (id text primary key, name text not null, description text, workplan_activity text,
  lead text, status text default 'Not Started', kpi_unit text, sprint_tag text, count_note text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.update_log (id serial primary key, project_id text references public.projects(id), update_text text);
create table public.item_raci (item_type text not null, item_id text not null, raci jsonb not null default '{}',
  updated_at timestamptz not null default now(), primary key (item_type, item_id));
create table public.item_updates (id bigserial primary key, item_type text not null, item_id text not null, body text not null);
create table public.project_lifecycle (project_id text primary key, state text not null);
create table public.workplan_goals (id serial primary key, activity_id text not null, name text not null,
  row_type text not null, kind text not null default 'project', total numeric default 0);
create table public.workplan_activity_associations (project_id text not null, activity_id text not null,
  created_at timestamptz not null default now(), is_primary boolean not null default false, primary key (project_id, activity_id));
create table public.nc_artifacts (id serial primary key, item_id text);
insert into public.allowed_reviewers values ('slee@cccco.edu');
insert into public.workplan_goals (activity_id, name, row_type, kind) values
  ('1','Activity 1: Build AI-Enhanced CPL Infrastructure','GOAL','activity'),
  ('4','Activity 4: Coordinate CPL Sprints, Targeted Projects, Professional Learning, and Strategic Partnerships','GOAL','activity');
insert into public.projects (id, name, workplan_activity, lead, sprint_tag) values
  ('1.1', 'MAP Platform Development', 'Activity 1: AI-Enhanced CPL Infrastructure', null, null),
  ('1.1.2', 'AI Apprenticeship CPL Tools', 'Activity 1: AI-Enhanced CPL Infrastructure', 'Terence Nelson', 'Apprenticeship Sprint'),
  ('4.1', 'Veteran Sprint', 'Activity 4: Sprints, Projects & Partnerships', null, null),
  ('4.1.1', '29 Palms', 'Activity 4: Sprints, Projects & Partnerships', null, null),
  ('4.2', 'Apprenticeship Sprint', 'Activity 4: Sprints, Projects & Partnerships', null, null);
insert into public.item_raci (item_type, item_id) values ('project','1.1.2'), ('activity','1'), ('project','4.2');
insert into public.item_updates (item_type, item_id, body) values ('project','1.1.2','June update'), ('activity','1','Activity 1 update');
insert into public.update_log (project_id, update_text) values ('1.1.2', 'old log line');
insert into public.workplan_activity_associations (project_id, activity_id, is_primary) values
  ('1.1.2','4',false), ('1.1.2','1',false), ('4.2','4',true);
insert into public.nc_artifacts (item_id) values ('UC-8a');
`;

async function fresh() {
  const db = new PGlite();
  await db.exec(SCHEMA);
  await db.exec(SQL);
  return db;
}
const as = (db, email) => db.exec("select set_config('test.jwt', '" + JSON.stringify(email ? { email } : {}) + "', false)");
async function one(db, q) { return (await db.query(q)).rows[0]; }
async function count(db, q) { return Number((await db.query(q)).rows[0].n); }
async function err(db, q) { try { await db.query(q); return null; } catch (e) { return e; } }
async function snapshot(db) {
  const tables = ["projects", "update_log", "item_raci", "item_updates", "project_lifecycle",
                  "workplan_goals", "workplan_activity_associations"];
  const out = {};
  for (const t of tables) out[t] = (await db.query("select * from public." + t + " order by 1, 2")).rows;
  return JSON.stringify(out);
}

(async () => {
  // ── (a) the move Sam asked for ──
  let db = await fresh();
  await as(db, "slee@cccco.edu");
  const before = await snapshot(db);
  const r = (await db.query("select public.workplan_move_sub_activity('1.1.2', '4.2.1') as r")).rows[0].r;
  check("(a) the move succeeds and names both ids", r.ok && r.old_id === "1.1.2" && r.new_id === "4.2.1" && r.home === "4");
  check("(a) counts: 1 project, 1 log line, 1 RACI, 1 update, 2 links, no ladder",
    r.counts.projects === 1 && r.counts.update_log === 1 && r.counts.item_raci === 1 && r.counts.item_updates === 1 &&
    r.counts.workplan_activity_associations === 2 && r.counts.workplan_goals === 0, JSON.stringify(r.counts));
  const p = await one(db, "select * from public.projects where id = '4.2.1'");
  check("(a) the project moved with its fields", p && p.name === "AI Apprenticeship CPL Tools" && p.lead === "Terence Nelson" && p.sprint_tag === "Apprenticeship Sprint");
  check("(a) its home label is the one its new siblings use", p && p.workplan_activity === "Activity 4: Sprints, Projects & Partnerships", p && p.workplan_activity);
  check("(a) no table still holds 1.1.2",
    (await count(db, "select count(*) n from public.projects where id = '1.1.2'")) === 0 &&
    (await count(db, "select count(*) n from public.update_log where project_id = '1.1.2'")) === 0 &&
    (await count(db, "select count(*) n from public.item_raci where item_id = '1.1.2'")) === 0 &&
    (await count(db, "select count(*) n from public.item_updates where item_id = '1.1.2'")) === 0 &&
    (await count(db, "select count(*) n from public.workplan_activity_associations where project_id = '1.1.2'")) === 0);
  check("(a) update_log follows through its foreign key", (await count(db, "select count(*) n from public.update_log where project_id = '4.2.1'")) === 1);
  const links = (await db.query("select activity_id, is_primary from public.workplan_activity_associations where project_id = '4.2.1' order by 1")).rows;
  check("(a) Activity 4 is the primary link and the Activity 1 link is kept",
    links.length === 2 && links[0].activity_id === "1" && !links[0].is_primary && links[1].activity_id === "4" && links[1].is_primary,
    JSON.stringify(links));
  check("(a) Activity-level rows are untouched",
    (await count(db, "select count(*) n from public.item_raci where item_type = 'activity' and item_id = '1'")) === 1 &&
    (await count(db, "select count(*) n from public.item_updates where item_type = 'activity'")) === 1);
  const mv = await one(db, "select * from public.workplan_id_moves");
  check("(a) the move is filed with who, the ids and the before-values",
    mv && mv.moved_by === "slee@cccco.edu" && mv.old_id === "1.1.2" && mv.new_id === "4.2.1" &&
    mv.before.projects.id === "1.1.2" && mv.before.workplan_activity_associations.length === 2);

  // ── (e) the undo from the SQL header puts every row back ──
  await db.exec(`
    select public.workplan_move_sub_activity('4.2.1', '1.1.2', true);
    delete from public.workplan_activity_associations where project_id = '1.1.2';
    insert into public.workplan_activity_associations (project_id, activity_id, is_primary, created_at)
    select project_id, activity_id, is_primary, created_at
      from jsonb_to_recordset((select before->'workplan_activity_associations' from public.workplan_id_moves where id = 1))
        as x(project_id text, activity_id text, is_primary boolean, created_at timestamptz);
    update public.projects set workplan_activity = (select before->'projects'->>'workplan_activity'
      from public.workplan_id_moves where id = 1) where id = '1.1.2';`);
  const strip = (s) => s.replace(/"updated_at":"[^"]*"/g, "").replace(/"created_at":"[^"]*"/g, "");
  check("(e) the undo restores every row the move changed", strip(await snapshot(db)) === strip(before));

  // ── (b) the refusals ──
  db = await fresh();
  await as(db, "someone@example.org");
  let e = await err(db, "select public.workplan_move_sub_activity('1.1.2', '4.2.1')");
  check("(b) a non-reviewer is refused (42501)", e && e.code === "42501", e && e.message);
  await as(db, null);
  e = await err(db, "select public.workplan_move_sub_activity('1.1.2', '4.2.1')");
  check("(b) no sign-in is refused (42501)", e && e.code === "42501");
  await as(db, "slee@cccco.edu");
  const b0 = await snapshot(db);
  e = await err(db, "select public.workplan_move_sub_activity('1.1.2', '4.2')");
  check("(b) an id in use is refused (23505)", e && e.code === "23505", e && e.message);
  e = await err(db, "select public.workplan_move_sub_activity('4.1', '3.9')");
  check("(b) a sub-activity with children is refused", e && /move those first/.test(e.message), e && e.message);
  e = await err(db, "select public.workplan_move_sub_activity('1.1.2', 'four')");
  check("(b) a malformed id is refused", e && e.code === "22023");
  e = await err(db, "select public.workplan_move_sub_activity('1.1', '1.1.9')");
  check("(b) a move under itself is refused", e && /under itself/.test(e.message), e && e.message);
  e = await err(db, "select public.workplan_move_sub_activity('1.1.2', '4.7.1')");
  check("(b) a missing parent is refused", e && /no sub-activity 4.7/.test(e.message), e && e.message);
  check("(b) a refused move changes nothing", (await snapshot(db)) === b0);

  // ── (c) THE GUARD ──
  await db.exec("create table public.some_new_table (id serial, project_id text); insert into public.some_new_table (project_id) values ('1.1.2');");
  e = await err(db, "select public.workplan_move_sub_activity('1.1.2', '4.2.1')");
  check("(c) a table the move does not know stops it (55000), naming the table",
    e && e.code === "55000" && /some_new_table\.project_id/.test(e.message), e && e.message);
  check("(c) ...and nothing changed: 1.1.2 is still where it was", (await snapshot(db)) === b0 &&
    (await count(db, "select count(*) n from public.workplan_id_moves")) === 0);
  await db.exec("drop table public.some_new_table;");

  // ── (d) dropping the old home's link ──
  const r2 = (await db.query("select public.workplan_move_sub_activity('1.1.2', '4.2.1', false) as r")).rows[0].r;
  const links2 = (await db.query("select activity_id, is_primary from public.workplan_activity_associations where project_id = '4.2.1'")).rows;
  check("(d) keep_old_link = false leaves only the new home, primary",
    r2.ok && links2.length === 1 && links2[0].activity_id === "4" && links2[0].is_primary, JSON.stringify(links2));

  // ── grants as written ──
  db = await fresh();
  const g = (await db.query(`select has_function_privilege('anon', 'public.workplan_move_sub_activity(text,text,boolean)', 'execute') a,
                                    has_function_privilege('authenticated', 'public.workplan_move_sub_activity(text,text,boolean)', 'execute') u,
                                    has_table_privilege('anon', 'public.workplan_id_moves', 'select') ta`)).rows[0];
  check("grants: anon cannot call it or read the log; a signed-in caller can call it", !g.a && g.u && !g.ta, JSON.stringify(g));

  let fail = 0;
  results.forEach(([n, ok, d]) => { console.log((ok ? "PASS  " : "FAIL  ") + n + (ok || !d ? "" : "  — " + d)); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
