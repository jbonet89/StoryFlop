-- Rich task details, stable final-estimate provenance and lightweight audit.
alter table public.tasks
  add column if not exists task_url text,
  add column if not exists finalized_from_round_id uuid references public.rounds(id) on delete set null,
  add column if not exists final_estimate_updated_at timestamptz,
  add column if not exists final_estimate_updated_by uuid references public.room_members(id) on delete set null;

alter table public.tasks drop constraint if exists tasks_title_check;
alter table public.tasks add constraint tasks_title_check
  check (char_length(btrim(title)) between 1 and 160);

alter table public.tasks drop constraint if exists tasks_description_check;
alter table public.tasks add constraint tasks_description_check
  check (description is null or char_length(description) <= 5000);

create or replace function public.is_valid_task_url(p_url text) returns boolean
language sql immutable set search_path=pg_catalog,public as $$
  select p_url is null or (
    char_length(p_url) <= 2048
    and p_url = btrim(p_url)
    and p_url ~* '^https?://[^[:space:]]+$'
  )
$$;

alter table public.tasks drop constraint if exists tasks_task_url_check;
alter table public.tasks add constraint tasks_task_url_check
  check (public.is_valid_task_url(task_url));

create table if not exists public.task_estimate_changes (
  id uuid primary key default extensions.gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  previous_estimate text,
  new_estimate text not null check (new_estimate in ('0','1','2','3','5','8','13','21','34','?','☕')),
  changed_by uuid references public.room_members(id) on delete set null,
  changed_by_name text not null,
  changed_at timestamptz not null default now()
);

create index if not exists task_estimate_changes_task_changed_idx
  on public.task_estimate_changes(task_id, changed_at desc);
create index if not exists task_estimate_changes_room_idx
  on public.task_estimate_changes(room_id);

alter table public.task_estimate_changes enable row level security;
drop policy if exists task_estimate_changes_read_room on public.task_estimate_changes;
create policy task_estimate_changes_read_room on public.task_estimate_changes
for select to authenticated using (public.is_room_member(room_id));

revoke all on public.task_estimate_changes from anon, authenticated;
grant select on public.task_estimate_changes to authenticated;

-- Replace the old overloads so PostgREST exposes a single unambiguous RPC.
revoke all on function public.create_task(uuid,text,text) from public;
revoke all on function public.update_task(uuid,text,text) from public;
revoke all on function public.reorder_tasks(uuid,uuid[]) from public;
drop function public.create_task(uuid,text,text);
drop function public.update_task(uuid,text,text);
drop function public.reorder_tasks(uuid,uuid[]);

create function public.create_task(
  p_room_id uuid,
  p_title text,
  p_description text default '',
  p_task_url text default null
) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks;
  v_member public.room_members;
  v_title text := btrim(p_title);
  v_description text := nullif(btrim(coalesce(p_description,'')), '');
  v_url text := nullif(btrim(coalesce(p_task_url,'')), '');
begin
  if not public.is_room_host(p_room_id) then raise exception 'TASK_HOST_ONLY'; end if;
  select * into v_member from public.current_member(p_room_id);
  if v_member.id is null then raise exception 'TASK_MEMBER_NOT_FOUND'; end if;
  if v_title is null or char_length(v_title) not between 1 and 160 then raise exception 'TASK_TITLE_INVALID'; end if;
  if v_description is not null and char_length(v_description) > 5000 then raise exception 'TASK_DESCRIPTION_TOO_LONG'; end if;
  if not public.is_valid_task_url(v_url) then raise exception 'TASK_URL_INVALID'; end if;

  insert into public.tasks(room_id,title,description,task_url,sort_order,created_by)
  values(
    p_room_id,
    v_title,
    v_description,
    v_url,
    coalesce((select max(t.sort_order)+1 from public.tasks t where t.room_id=p_room_id),0),
    v_member.id
  ) returning * into v_task;
  return v_task;
end $$;

create function public.update_task(
  p_task_id uuid,
  p_title text,
  p_description text default '',
  p_task_url text default null
) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks;
  v_title text := btrim(p_title);
  v_description text := nullif(btrim(coalesce(p_description,'')), '');
  v_url text := nullif(btrim(coalesce(p_task_url,'')), '');
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_host(v_task.room_id) then raise exception 'TASK_HOST_ONLY'; end if;
  if v_title is null or char_length(v_title) not between 1 and 160 then raise exception 'TASK_TITLE_INVALID'; end if;
  if v_description is not null and char_length(v_description) > 5000 then raise exception 'TASK_DESCRIPTION_TOO_LONG'; end if;
  if not public.is_valid_task_url(v_url) then raise exception 'TASK_URL_INVALID'; end if;

  update public.tasks
  set title=v_title, description=v_description, task_url=v_url, updated_at=now()
  where id=p_task_id
  returning * into v_task;
  return v_task;
end $$;

create function public.reorder_tasks(p_room_id uuid,p_task_ids uuid[]) returns setof public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task_count integer;
  v_offset integer;
begin
  if not public.is_room_host(p_room_id) then raise exception 'TASK_REORDER_HOST_ONLY'; end if;
  select count(*) into v_task_count from public.tasks t where t.room_id=p_room_id;
  if p_task_ids is null or cardinality(p_task_ids) <> v_task_count then raise exception 'TASK_REORDER_INCOMPLETE'; end if;
  if (select count(distinct item.id) from unnest(p_task_ids) as item(id)) <> v_task_count then raise exception 'TASK_REORDER_DUPLICATE_IDS'; end if;
  if exists(
    select 1 from unnest(p_task_ids) as item(id)
    where not exists(select 1 from public.tasks t where t.id=item.id and t.room_id=p_room_id)
  ) then raise exception 'TASK_REORDER_FOREIGN_TASK'; end if;

  select coalesce(max(t.sort_order),0) + v_task_count + 1
  into v_offset from public.tasks t where t.room_id=p_room_id;
  update public.tasks set sort_order=sort_order+v_offset where room_id=p_room_id;
  update public.tasks t
  set sort_order=item.ordinality-1, updated_at=now()
  from unnest(p_task_ids) with ordinality as item(id,ordinality)
  where t.id=item.id and t.room_id=p_room_id;

  return query select t.* from public.tasks t where t.room_id=p_room_id order by t.sort_order;
end $$;

create or replace function public.finalize_task(p_task_id uuid,p_estimate text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks;
  v_round public.rounds;
  v_member public.room_members;
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_host(v_task.room_id) then raise exception 'TASK_HOST_ONLY'; end if;
  if not exists(
    select 1 from public.rooms room
    cross join lateral jsonb_array_elements_text(room.deck) deck(value)
    where room.id=v_task.room_id and deck.value=p_estimate
  ) then raise exception 'FINAL_ESTIMATE_INVALID'; end if;
  select * into v_member from public.current_member(v_task.room_id);
  select * into v_round
  from public.rounds r
  where r.task_id=p_task_id and r.status='revealed'
  order by r.revealed_at desc nulls last limit 1
  for update;
  if v_round.id is null then raise exception 'NO_REVEALED_ROUND'; end if;

  update public.rounds set status='closed' where id=v_round.id;
  update public.tasks
  set status='completed', final_estimate=p_estimate,
      finalized_from_round_id=v_round.id,
      final_estimate_updated_at=now(), final_estimate_updated_by=v_member.id
  where id=p_task_id;
  insert into public.task_estimate_changes(
    room_id,task_id,previous_estimate,new_estimate,changed_by,changed_by_name
  ) values (
    v_task.room_id,p_task_id,v_task.final_estimate,p_estimate,v_member.id,v_member.display_name
  );
end $$;

create function public.update_final_estimate(p_task_id uuid,p_estimate text) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks;
  v_member public.room_members;
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_host(v_task.room_id) then raise exception 'FINAL_ESTIMATE_HOST_ONLY'; end if;
  if v_task.status<>'completed' then raise exception 'FINAL_ESTIMATE_TASK_NOT_COMPLETED'; end if;
  if not exists(
    select 1 from public.rooms room
    cross join lateral jsonb_array_elements_text(room.deck) deck(value)
    where room.id=v_task.room_id and deck.value=p_estimate
  ) then raise exception 'FINAL_ESTIMATE_INVALID'; end if;
  if v_task.final_estimate=p_estimate then return v_task; end if;
  select * into v_member from public.current_member(v_task.room_id);
  if v_member.id is null then raise exception 'FINAL_ESTIMATE_MEMBER_NOT_FOUND'; end if;

  insert into public.task_estimate_changes(
    room_id,task_id,previous_estimate,new_estimate,changed_by,changed_by_name
  ) values (
    v_task.room_id,p_task_id,v_task.final_estimate,p_estimate,v_member.id,v_member.display_name
  );
  update public.tasks
  set final_estimate=p_estimate,
      final_estimate_updated_at=now(), final_estimate_updated_by=v_member.id,
      updated_at=now()
  where id=p_task_id
  returning * into v_task;
  return v_task;
end $$;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='task_estimate_changes'
    )
  then alter publication supabase_realtime add table public.task_estimate_changes;
  end if;
end $$;

alter table public.task_estimate_changes replica identity full;

revoke all on function public.is_valid_task_url(text) from public;
revoke all on function public.create_task(uuid,text,text,text) from public;
revoke all on function public.update_task(uuid,text,text,text) from public;
revoke all on function public.reorder_tasks(uuid,uuid[]) from public;
revoke all on function public.update_final_estimate(uuid,text) from public;
grant execute on function public.create_task(uuid,text,text,text) to authenticated;
grant execute on function public.update_task(uuid,text,text,text) to authenticated;
grant execute on function public.reorder_tasks(uuid,uuid[]) to authenticated;
grant execute on function public.update_final_estimate(uuid,text) to authenticated;

comment on column public.tasks.task_url is 'Optional absolute HTTP(S) URL for the task source.';
comment on column public.tasks.finalized_from_round_id is 'Round whose revealed result led to the accepted estimate.';
comment on table public.task_estimate_changes is 'Append-only audit written by estimate RPCs.';
