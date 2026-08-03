-- A member's room preference is separate from the immutable snapshot stored for
-- each round. Existing members and historical participation remain voters.
alter table public.room_members
  add column if not exists default_participation_mode text not null default 'voter';

alter table public.room_members
  drop constraint if exists room_members_default_participation_mode_check;
alter table public.room_members
  add constraint room_members_default_participation_mode_check
  check (default_participation_mode in ('voter', 'observer'));

alter table public.round_participation
  add column if not exists participation_mode text not null default 'voter',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.round_participation
  drop constraint if exists round_participation_participation_mode_check;
alter table public.round_participation
  add constraint round_participation_participation_mode_check
  check (participation_mode in ('voter', 'observer'));

alter table public.round_participation
  drop constraint if exists round_participation_observer_vote_check;
alter table public.round_participation
  add constraint round_participation_observer_vote_check
  check (participation_mode = 'voter' or (not has_voted and voted_at is null));

update public.room_members
set default_participation_mode = 'voter'
where default_participation_mode is null;

update public.round_participation
set participation_mode = 'voter'
where participation_mode is null;

-- Preserve every existing vote, including votes from historical rounds that
-- predate round snapshots.
insert into public.round_participation (
  room_id, round_id, member_id, participation_mode, has_voted, voted_at
)
select v.room_id, v.round_id, v.member_id, 'voter', true, coalesce(v.updated_at, v.created_at)
from public.votes v
on conflict (round_id, member_id) do update
set participation_mode = 'voter',
    has_voted = true,
    voted_at = coalesce(public.round_participation.voted_at, excluded.voted_at),
    updated_at = now();

-- Current open rounds can be completed safely. We intentionally do not invent
-- participants for old rounds where membership-at-the-time cannot be known.
insert into public.round_participation (
  room_id, round_id, member_id, participation_mode, has_voted, voted_at
)
select r.room_id, r.id, m.id, m.default_participation_mode, false, null
from public.rounds r
join public.room_members m on m.room_id = r.room_id and not m.is_kicked
where r.status = 'voting'
on conflict (round_id, member_id) do nothing;

drop trigger if exists round_participation_updated on public.round_participation;
create trigger round_participation_updated
before update on public.round_participation
for each row execute function public.set_updated_at();

create index if not exists participation_round_mode_voted_idx
  on public.round_participation(round_id, participation_mode, has_voted);

-- Users joining an open voting round receive an idempotent snapshot immediately.
create or replace function public.join_room(p_code text,p_display_name text,p_avatar_key text) returns table(room_id uuid)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_room public.rooms; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  select * into v_room from public.rooms r where r.code=upper(btrim(p_code));
  if v_room.id is null then raise exception 'La sala no existe'; end if;
  if v_room.status <> 'open' then raise exception 'La sala está cerrada'; end if;
  if char_length(btrim(p_display_name)) not between 2 and 32 then raise exception 'Nombre no válido'; end if;
  if p_avatar_key not in ('🦊','🐼','🐙','🦁','🐸','🦄','🐧','🐨') then raise exception 'Avatar no válido'; end if;

  select m.id into v_id
  from public.room_members m
  where m.room_id=v_room.id and m.user_id=auth.uid();

  if v_id is not null then
    if exists(select 1 from public.room_members m where m.id=v_id and m.is_kicked) then
      raise exception 'Has sido expulsado de esta sala';
    end if;
    update public.room_members
    set display_name=btrim(p_display_name), avatar_key=p_avatar_key
    where id=v_id;
  else
    insert into public.room_members(room_id,user_id,display_name,avatar_key)
    values(v_room.id,auth.uid(),btrim(p_display_name),p_avatar_key)
    returning id into v_id;
  end if;

  insert into public.round_participation (
    room_id, round_id, member_id, participation_mode, has_voted, voted_at
  )
  select r.room_id, r.id, v_id, m.default_participation_mode, false, null
  from public.rounds r
  join public.room_members m on m.id = v_id
  where r.room_id = v_room.id and r.status = 'voting'
  on conflict (round_id, member_id) do nothing;

  return query select v_room.id;
exception when unique_violation then
  raise exception 'Ese nombre ya está en uso en esta sala';
end $$;

create or replace function public.start_round(p_task_id uuid) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_id uuid; v_no int;
begin
  select * into v_task from public.tasks where id=p_task_id for update;
  if v_task.id is null then raise exception 'La tarea no existe'; end if;
  perform 1 from public.rooms where id=v_task.room_id and status='open' for update;
  if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if;
  if exists(select 1 from public.rounds where room_id=v_task.room_id and status in ('voting','revealed')) then raise exception 'Ya existe una ronda activa'; end if;
  if v_task.status='completed' then raise exception 'La tarea ya está finalizada'; end if;

  select coalesce(max(round_number),0)+1 into v_no from public.rounds where task_id=p_task_id;
  insert into public.rounds(room_id,task_id,round_number)
  values(v_task.room_id,p_task_id,v_no) returning id into v_id;

  insert into public.round_participation (
    room_id, round_id, member_id, participation_mode, has_voted, voted_at
  )
  select v_task.room_id, v_id, m.id, m.default_participation_mode, false, null
  from public.room_members m
  where m.room_id=v_task.room_id and not m.is_kicked;

  update public.tasks set status='voting' where id=p_task_id;
  return v_id;
end $$;

create or replace function public.restart_round(p_round_id uuid) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds; v_id uuid;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_host(v_round.room_id) then raise exception 'Acción no permitida'; end if;
  if v_round.status<>'revealed' then raise exception 'Revela primero la ronda'; end if;

  update public.rounds set status='closed' where id=p_round_id;
  insert into public.rounds(room_id,task_id,round_number)
  values(v_round.room_id,v_round.task_id,v_round.round_number+1) returning id into v_id;

  insert into public.round_participation (
    room_id, round_id, member_id, participation_mode, has_voted, voted_at
  )
  select v_round.room_id, v_id, m.id, m.default_participation_mode, false, null
  from public.room_members m
  where m.room_id=v_round.room_id and not m.is_kicked;

  update public.tasks set status='voting' where id=v_round.task_id;
  return v_id;
end $$;

create or replace function public.set_my_participation_mode(
  p_room_id uuid,
  p_mode text,
  p_round_id uuid default null
) returns table(
  member_id uuid,
  round_id uuid,
  default_participation_mode text,
  participation_mode text,
  has_voted boolean,
  voted_at timestamptz
)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_member public.room_members;
  v_round public.rounds;
  v_participation public.round_participation;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  if p_mode is null or p_mode not in ('voter','observer') then raise exception 'PARTICIPATION_MODE_INVALID'; end if;

  select * into v_member
  from public.room_members m
  where m.room_id=p_room_id and m.user_id=auth.uid() and not m.is_kicked
  for update;
  if v_member.id is null then raise exception 'No perteneces a la sala'; end if;

  if p_round_id is not null then
    select * into v_round from public.rounds r where r.id=p_round_id for update;
    if v_round.id is null or v_round.room_id<>p_room_id then raise exception 'La ronda no pertenece a la sala'; end if;
  else
    select * into v_round
    from public.rounds r
    where r.room_id=p_room_id and r.status='voting'
    order by r.created_at desc limit 1
    for update;
  end if;

  update public.room_members
  set default_participation_mode=p_mode
  where id=v_member.id;

  if v_round.id is not null and v_round.status='voting' then
    insert into public.round_participation (
      room_id, round_id, member_id, participation_mode, has_voted, voted_at
    ) values (
      p_room_id, v_round.id, v_member.id, v_member.default_participation_mode, false, null
    ) on conflict (round_id, member_id) do nothing;

    select * into v_participation
    from public.round_participation rp
    where rp.round_id=v_round.id and rp.member_id=v_member.id
    for update;

    if p_mode='observer' then
      delete from public.votes v
      where v.round_id=v_round.id and v.member_id=v_member.id;
      update public.round_participation rp
      set participation_mode='observer', has_voted=false, voted_at=null
      where rp.round_id=v_round.id and rp.member_id=v_member.id
      returning * into v_participation;
    else
      update public.round_participation rp
      set participation_mode='voter'
      where rp.round_id=v_round.id and rp.member_id=v_member.id
      returning * into v_participation;
    end if;
  elsif v_round.id is not null then
    select * into v_participation
    from public.round_participation rp
    where rp.round_id=v_round.id and rp.member_id=v_member.id;
  end if;

  if v_participation.round_id is not null then
    return query select
      v_member.id,
      v_participation.round_id,
      p_mode,
      v_participation.participation_mode,
      v_participation.has_voted,
      v_participation.voted_at;
  else
    return query select v_member.id, null::uuid, p_mode, p_mode, false, null::timestamptz;
  end if;
end $$;

create or replace function public.cast_vote(p_round_id uuid,p_value text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_round public.rounds;
  v_member public.room_members;
  v_participation public.round_participation;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if v_round.status<>'voting' then raise exception 'La votación está cerrada'; end if;
  select * into v_member from public.current_member(v_round.room_id);
  if v_member.id is null then raise exception 'No perteneces a la sala'; end if;
  if p_value not in ('0','1','2','3','5','8','13','21','34','?','☕') then raise exception 'Carta no válida'; end if;

  select * into v_participation
  from public.round_participation rp
  where rp.round_id=p_round_id and rp.member_id=v_member.id
  for update;
  if v_participation.round_id is null then raise exception 'ROUND_PARTICIPATION_NOT_FOUND'; end if;
  if v_participation.participation_mode<>'voter' then raise exception 'OBSERVER_CANNOT_VOTE'; end if;

  insert into public.votes(room_id,round_id,member_id,value)
  values(v_round.room_id,p_round_id,v_member.id,p_value)
  on conflict(round_id,member_id) do update set value=excluded.value,updated_at=now();

  update public.round_participation rp
  set has_voted=true,voted_at=now()
  where rp.round_id=p_round_id and rp.member_id=v_member.id;
end $$;

create or replace function public.reveal_round(p_round_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_host(v_round.room_id) then raise exception 'Acción no permitida'; end if;
  if v_round.status<>'voting' then raise exception 'La ronda no está abierta'; end if;
  if not exists(
    select 1
    from public.round_participation rp
    join public.votes v on v.round_id=rp.round_id and v.member_id=rp.member_id
    where rp.round_id=p_round_id and rp.participation_mode='voter' and rp.has_voted
  ) then raise exception 'NO_VOTES_TO_REVEAL'; end if;
  update public.rounds set status='revealed',revealed_at=now() where id=p_round_id;
  update public.tasks set status='revealed' where id=v_round.task_id;
end $$;

create or replace function public.cancel_round(p_round_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id=p_round_id for update;
  if v_round.id is null then raise exception 'La ronda no existe'; end if;
  if not public.is_room_host(v_round.room_id) then raise exception 'Acción no permitida'; end if;
  if v_round.status not in ('voting','revealed') then raise exception 'La ronda ya está cerrada'; end if;
  update public.rounds set status='cancelled' where id=p_round_id;
  update public.tasks set status='pending' where id=v_round.task_id;
end $$;

-- Realtime remains RLS-aware; observers never gain access to private votes.
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='votes'
    )
  then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;

alter table public.votes replica identity full;
alter table public.round_participation replica identity full;

revoke all on function public.set_my_participation_mode(uuid,text,uuid) from public;
grant execute on function public.set_my_participation_mode(uuid,text,uuid) to authenticated;
revoke all on function public.cancel_round(uuid) from public;
grant execute on function public.cancel_round(uuid) to authenticated;

-- Reassert the existing RPC grants after replacing their definitions.
revoke all on function public.join_room(text,text,text), public.start_round(uuid), public.restart_round(uuid), public.cast_vote(uuid,text), public.reveal_round(uuid) from public;
grant execute on function public.join_room(text,text,text), public.start_round(uuid), public.restart_round(uuid), public.cast_vote(uuid,text), public.reveal_round(uuid) to authenticated;

comment on column public.room_members.default_participation_mode is
  'Preference copied into the next round snapshot.';
comment on column public.round_participation.participation_mode is
  'Immutable after voting; historical voter/observer mode for this round.';
