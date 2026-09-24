create function public.is_room_facilitator(p_room_id uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(
    select 1 from public.room_members m
    where m.room_id=p_room_id and m.user_id=auth.uid()
      and m.role in ('host','collaborator') and not m.is_kicked
  )
$$;

revoke all on function public.is_room_facilitator(uuid) from public;
grant execute on function public.is_room_facilitator(uuid) to authenticated;

create function public.set_member_role(
  p_room_id uuid,
  p_target_member_id uuid,
  p_role public.member_role
) returns public.room_members
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_target public.room_members;
begin
  if not public.is_room_host(p_room_id) then raise exception 'HOST_ONLY'; end if;
  if p_role not in ('participant','collaborator') then raise exception 'MEMBER_ROLE_INVALID'; end if;

  select * into v_target from public.room_members
  where id=p_target_member_id and room_id=p_room_id and not is_kicked
  for update;
  if v_target.id is null then raise exception 'ROOM_MEMBER_NOT_FOUND'; end if;
  if v_target.role='host' then raise exception 'HOST_PROTECTED'; end if;

  update public.room_members set role=p_role where id=v_target.id returning * into v_target;
  return v_target;
end $$;

create function public.remove_room_members(
  p_room_id uuid,
  p_target_member_ids uuid[]
) returns integer
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_actor public.room_members;
  v_requested_count integer;
  v_removed_count integer;
begin
  select * into v_actor from public.current_member(p_room_id);
  if v_actor.id is null or v_actor.role not in ('host','collaborator') then
    raise exception 'FACILITATOR_ONLY';
  end if;
  if p_target_member_ids is null or cardinality(p_target_member_ids)=0 then
    raise exception 'MEMBER_SELECTION_REQUIRED';
  end if;

  select count(distinct target_id) into v_requested_count
  from unnest(p_target_member_ids) as target(target_id);
  if v_requested_count <> cardinality(p_target_member_ids) then
    raise exception 'MEMBER_SELECTION_DUPLICATED';
  end if;
  if v_actor.id=any(p_target_member_ids) then raise exception 'CANNOT_REMOVE_SELF'; end if;
  if exists(
    select 1 from public.room_members m
    where m.id=any(p_target_member_ids)
      and (m.room_id<>p_room_id or m.is_kicked or m.role='host')
  ) or v_requested_count<>(
    select count(*) from public.room_members m
    where m.room_id=p_room_id and m.id=any(p_target_member_ids) and not m.is_kicked
  ) then
    raise exception 'MEMBER_REMOVE_NOT_ALLOWED';
  end if;

  delete from public.votes v
  using public.rounds r
  where v.round_id=r.id and r.room_id=p_room_id and r.status='voting'
    and v.member_id=any(p_target_member_ids);
  delete from public.round_participation rp
  using public.rounds r
  where rp.round_id=r.id and r.room_id=p_room_id and r.status='voting'
    and rp.member_id=any(p_target_member_ids);

  update public.room_members
  set is_kicked=true, role='participant'
  where room_id=p_room_id and id=any(p_target_member_ids) and not is_kicked;
  get diagnostics v_removed_count = row_count;
  return v_removed_count;
end $$;

create or replace function public.join_room(
  p_code text,
  p_display_name text,
  p_avatar_key text
) returns table(room_id uuid)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_room public.rooms;
  v_id uuid;
  v_was_removed boolean := false;
  v_requested_name text;
  v_display_name text;
  v_suffix integer := 1;
  v_suffix_text text;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  select * into v_room from public.rooms r
  where r.code=upper(btrim(p_code)) for update;
  if v_room.id is null then raise exception 'La sala no existe'; end if;
  if v_room.status<>'open' then raise exception 'La sala está cerrada'; end if;

  v_requested_name := btrim(p_display_name);
  if char_length(v_requested_name) not between 2 and 32 then raise exception 'Nombre no válido'; end if;
  if not public.is_valid_avatar_key(p_avatar_key) then raise exception 'Avatar no válido'; end if;

  select m.id,m.is_kicked into v_id,v_was_removed
  from public.room_members m
  where m.room_id=v_room.id and m.user_id=auth.uid();

  v_display_name := v_requested_name;
  while exists(
    select 1 from public.room_members m
    where m.room_id=v_room.id and lower(m.display_name)=lower(v_display_name)
      and not m.is_kicked and m.id is distinct from v_id
  ) loop
    v_suffix := v_suffix+1;
    v_suffix_text := ' ' || v_suffix::text;
    v_display_name := left(v_requested_name,32-char_length(v_suffix_text)) || v_suffix_text;
  end loop;

  if v_id is not null then
    update public.room_members
    set display_name=v_display_name, avatar_key=p_avatar_key,
        is_kicked=false,
        role=case when v_was_removed then 'participant'::public.member_role else role end
    where id=v_id;
  else
    insert into public.room_members(room_id,user_id,display_name,avatar_key)
    values(v_room.id,auth.uid(),v_display_name,p_avatar_key)
    returning id into v_id;
  end if;

  insert into public.round_participation(
    room_id,round_id,member_id,participation_mode,has_voted,voted_at
  )
  select r.room_id,r.id,v_id,m.default_participation_mode,false,null
  from public.rounds r join public.room_members m on m.id=v_id
  where r.room_id=v_room.id and r.status='voting'
  on conflict(round_id,member_id) do nothing;
  return query select v_room.id;
end $$;

create or replace function public.create_task(
  p_room_id uuid,p_title text,p_description text default '',p_task_url text default null
) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks; v_member public.room_members;
  v_title text := btrim(p_title);
  v_description text := nullif(btrim(coalesce(p_description,'')),'');
  v_url text := nullif(btrim(coalesce(p_task_url,'')),'');
begin
  if not public.is_room_facilitator(p_room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  select * into v_member from public.current_member(p_room_id);
  if v_member.id is null then raise exception 'TASK_MEMBER_NOT_FOUND'; end if;
  if v_title is null or char_length(v_title) not between 1 and 160 then raise exception 'TASK_TITLE_INVALID'; end if;
  if v_description is not null and char_length(v_description)>5000 then raise exception 'TASK_DESCRIPTION_TOO_LONG'; end if;
  if not public.is_valid_task_url(v_url) then raise exception 'TASK_URL_INVALID'; end if;
  insert into public.tasks(room_id,title,description,task_url,sort_order,created_by)
  values(p_room_id,v_title,v_description,v_url,
    coalesce((select max(t.sort_order)+1 from public.tasks t where t.room_id=p_room_id),0),v_member.id)
  returning * into v_task;
  return v_task;
end $$;

create or replace function public.update_task(
  p_task_id uuid,p_title text,p_description text default '',p_task_url text default null
) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks; v_title text := btrim(p_title);
  v_description text := nullif(btrim(coalesce(p_description,'')),'');
  v_url text := nullif(btrim(coalesce(p_task_url,'')),'');
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_facilitator(v_task.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if v_title is null or char_length(v_title) not between 1 and 160 then raise exception 'TASK_TITLE_INVALID'; end if;
  if v_description is not null and char_length(v_description)>5000 then raise exception 'TASK_DESCRIPTION_TOO_LONG'; end if;
  if not public.is_valid_task_url(v_url) then raise exception 'TASK_URL_INVALID'; end if;
  update public.tasks set title=v_title,description=v_description,task_url=v_url,updated_at=now()
  where id=p_task_id returning * into v_task;
  return v_task;
end $$;

create or replace function public.reorder_tasks(p_room_id uuid,p_task_ids uuid[]) returns setof public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task_count integer; v_offset integer;
begin
  if not public.is_room_facilitator(p_room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  select count(*) into v_task_count from public.tasks t where t.room_id=p_room_id;
  if p_task_ids is null or cardinality(p_task_ids)<>v_task_count then raise exception 'TASK_REORDER_INCOMPLETE'; end if;
  if (select count(distinct item.id) from unnest(p_task_ids) as item(id))<>v_task_count then raise exception 'TASK_REORDER_DUPLICATE_IDS'; end if;
  if exists(select 1 from unnest(p_task_ids) as item(id)
    where not exists(select 1 from public.tasks t where t.id=item.id and t.room_id=p_room_id))
  then raise exception 'TASK_REORDER_FOREIGN_TASK'; end if;
  select coalesce(max(t.sort_order),0)+v_task_count+1 into v_offset from public.tasks t where t.room_id=p_room_id;
  update public.tasks set sort_order=sort_order+v_offset where room_id=p_room_id;
  update public.tasks t set sort_order=item.ordinality-1,updated_at=now()
  from unnest(p_task_ids) with ordinality as item(id,ordinality)
  where t.id=item.id and t.room_id=p_room_id;
  return query select t.* from public.tasks t where t.room_id=p_room_id order by t.sort_order;
end $$;

create or replace function public.start_round(p_task_id uuid) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_id uuid; v_no int;
begin
  select * into v_task from public.tasks where id=p_task_id for update;
  if v_task.id is null then raise exception 'La tarea no existe'; end if;
  perform 1 from public.rooms where id=v_task.room_id and status='open' for update;
  if not public.is_room_facilitator(v_task.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if exists(select 1 from public.rounds where room_id=v_task.room_id and status in ('voting','revealed')) then raise exception 'Ya existe una ronda activa'; end if;
  if v_task.status='completed' then raise exception 'La tarea ya está finalizada'; end if;
  select coalesce(max(round_number),0)+1 into v_no from public.rounds where task_id=p_task_id;
  insert into public.rounds(room_id,task_id,round_number) values(v_task.room_id,p_task_id,v_no) returning id into v_id;
  insert into public.round_participation(room_id,round_id,member_id,participation_mode,has_voted,voted_at)
  select v_task.room_id,v_id,m.id,m.default_participation_mode,false,null
  from public.room_members m where m.room_id=v_task.room_id and not m.is_kicked;
  update public.tasks set status='voting' where id=p_task_id;
  return v_id;
end $$;

create or replace function public.restart_round(p_round_id uuid) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds; v_id uuid;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_facilitator(v_round.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if v_round.status<>'revealed' then raise exception 'Revela primero la ronda'; end if;
  update public.rounds set status='closed' where id=p_round_id;
  insert into public.rounds(room_id,task_id,round_number)
  values(v_round.room_id,v_round.task_id,v_round.round_number+1) returning id into v_id;
  insert into public.round_participation(room_id,round_id,member_id,participation_mode,has_voted,voted_at)
  select v_round.room_id,v_id,m.id,m.default_participation_mode,false,null
  from public.room_members m where m.room_id=v_round.room_id and not m.is_kicked;
  update public.tasks set status='voting' where id=v_round.task_id;
  return v_id;
end $$;

create or replace function public.reveal_round(p_round_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_facilitator(v_round.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if v_round.status<>'voting' then raise exception 'La ronda no está abierta'; end if;
  if not exists(select 1 from public.round_participation rp
    join public.votes v on v.round_id=rp.round_id and v.member_id=rp.member_id
    where rp.round_id=p_round_id and rp.participation_mode='voter' and rp.has_voted)
  then raise exception 'NO_VOTES_TO_REVEAL'; end if;
  update public.rounds set status='revealed',revealed_at=now() where id=p_round_id;
  update public.tasks set status='revealed' where id=v_round.task_id;
end $$;

create or replace function public.cancel_round(p_round_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_facilitator(v_round.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if v_round.status not in ('voting','revealed') then raise exception 'La ronda ya está cerrada'; end if;
  update public.rounds set status='cancelled' where id=p_round_id;
  update public.tasks set status='pending' where id=v_round.task_id;
end $$;

create or replace function public.finalize_task(p_task_id uuid,p_estimate text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_round public.rounds; v_member public.room_members;
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_facilitator(v_task.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if not exists(select 1 from public.rooms room cross join lateral jsonb_array_elements_text(room.deck) deck(value)
    where room.id=v_task.room_id and deck.value=p_estimate) then raise exception 'FINAL_ESTIMATE_INVALID'; end if;
  select * into v_member from public.current_member(v_task.room_id);
  select * into v_round from public.rounds r where r.task_id=p_task_id and r.status='revealed'
  order by r.revealed_at desc nulls last limit 1 for update;
  if v_round.id is null then raise exception 'NO_REVEALED_ROUND'; end if;
  update public.rounds set status='closed' where id=v_round.id;
  update public.tasks set status='completed',final_estimate=p_estimate,finalized_from_round_id=v_round.id,
    final_estimate_updated_at=now(),final_estimate_updated_by=v_member.id where id=p_task_id;
  insert into public.task_estimate_changes(room_id,task_id,previous_estimate,new_estimate,changed_by,changed_by_name)
  values(v_task.room_id,p_task_id,v_task.final_estimate,p_estimate,v_member.id,v_member.display_name);
end $$;

create or replace function public.update_final_estimate(p_task_id uuid,p_estimate text) returns public.tasks
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_member public.room_members;
begin
  select * into v_task from public.tasks t where t.id=p_task_id for update;
  if v_task.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not public.is_room_facilitator(v_task.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  if v_task.status<>'completed' then raise exception 'FINAL_ESTIMATE_TASK_NOT_COMPLETED'; end if;
  if not exists(select 1 from public.rooms room cross join lateral jsonb_array_elements_text(room.deck) deck(value)
    where room.id=v_task.room_id and deck.value=p_estimate) then raise exception 'FINAL_ESTIMATE_INVALID'; end if;
  if v_task.final_estimate=p_estimate then return v_task; end if;
  select * into v_member from public.current_member(v_task.room_id);
  if v_member.id is null then raise exception 'FINAL_ESTIMATE_MEMBER_NOT_FOUND'; end if;
  insert into public.task_estimate_changes(room_id,task_id,previous_estimate,new_estimate,changed_by,changed_by_name)
  values(v_task.room_id,p_task_id,v_task.final_estimate,p_estimate,v_member.id,v_member.display_name);
  update public.tasks set final_estimate=p_estimate,final_estimate_updated_at=now(),
    final_estimate_updated_by=v_member.id,updated_at=now()
  where id=p_task_id returning * into v_task;
  return v_task;
end $$;

create or replace function public.delete_task(p_task_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_offset integer;
begin
  select * into v_task from public.tasks where id=p_task_id for update;
  if v_task.id is null then raise exception 'La tarea no existe'; end if;
  if not public.is_room_facilitator(v_task.room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  delete from public.tasks where id=p_task_id;
  select coalesce(max(sort_order),0)+1 into v_offset from public.tasks where room_id=v_task.room_id;
  update public.tasks set sort_order=sort_order+v_offset
  where room_id=v_task.room_id and sort_order>v_task.sort_order;
  update public.tasks set sort_order=sort_order-v_offset-1
  where room_id=v_task.room_id and sort_order>v_task.sort_order+v_offset;
end $$;

create or replace function public.clear_backlog(p_room_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  perform 1 from public.rooms where id=p_room_id for update;
  if not found then raise exception 'La sala no existe'; end if;
  if not public.is_room_facilitator(p_room_id) then raise exception 'FACILITATOR_ONLY'; end if;
  delete from public.tasks where room_id=p_room_id;
end $$;

revoke all on function public.set_member_role(uuid,uuid,public.member_role), public.remove_room_members(uuid,uuid[]) from public;
grant execute on function public.set_member_role(uuid,uuid,public.member_role), public.remove_room_members(uuid,uuid[]) to authenticated;

comment on function public.remove_room_members(uuid,uuid[]) is
  'Soft-removes active non-host members while preserving revealed and closed history.';
