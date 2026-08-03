create extension if not exists pgcrypto with schema extensions;

create type public.room_status as enum ('open','closed');
create type public.member_role as enum ('host','participant');
create type public.task_status as enum ('pending','voting','revealed','completed');
create type public.round_status as enum ('voting','revealed','closed','cancelled');

create table public.rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  owner_user_id uuid not null references auth.users(id),
  status public.room_status not null default 'open',
  deck jsonb not null default '["0","1","2","3","5","8","13","21","34","?","☕"]'::jsonb check (jsonb_typeof(deck) = 'array'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.room_members (
  id uuid primary key default extensions.gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 32),
  avatar_key text not null check (avatar_key in ('🦊','🐼','🐙','🦁','🐸','🦄','🐧','🐨')),
  role public.member_role not null default 'participant', joined_at timestamptz not null default now(), is_kicked boolean not null default false,
  unique(room_id,user_id)
);
create unique index room_members_unique_name on public.room_members(room_id,lower(display_name)) where not is_kicked;
create unique index room_single_host on public.room_members(room_id) where role = 'host' and not is_kicked;
create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120), description text check (char_length(description) <= 1000),
  sort_order integer not null check (sort_order >= 0), status public.task_status not null default 'pending', final_estimate text check (final_estimate is null or final_estimate in ('0','1','2','3','5','8','13','21','34','?','☕')),
  created_by uuid not null references public.room_members(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(room_id,sort_order)
);
create table public.rounds (
  id uuid primary key default extensions.gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade, round_number integer not null check (round_number > 0),
  status public.round_status not null default 'voting', revealed_at timestamptz, created_at timestamptz not null default now(), unique(task_id,round_number)
);
create unique index one_active_round_per_room on public.rounds(room_id) where status in ('voting','revealed');
create table public.votes (
  id uuid primary key default extensions.gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade, member_id uuid not null references public.room_members(id) on delete cascade,
  value text not null check (value in ('0','1','2','3','5','8','13','21','34','?','☕')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(round_id,member_id)
);
create table public.round_participation (
  room_id uuid not null references public.rooms(id) on delete cascade, round_id uuid not null references public.rounds(id) on delete cascade,
  member_id uuid not null references public.room_members(id) on delete cascade, has_voted boolean not null default true, voted_at timestamptz, primary key(round_id,member_id)
);
create table public.reactions (
  id uuid primary key default extensions.gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  sender_member_id uuid not null references public.room_members(id) on delete cascade, target_member_id uuid not null references public.room_members(id) on delete cascade,
  emoji text not null check (emoji in ('😂','🔥','👏','🤔','🎯','☕')), created_at timestamptz not null default now(), check(sender_member_id <> target_member_id)
);
create index tasks_room_order_idx on public.tasks(room_id,sort_order);
create index rounds_room_created_idx on public.rounds(room_id,created_at desc);
create index votes_round_idx on public.votes(round_id);
create index participation_room_round_idx on public.round_participation(room_id,round_id);
create index reactions_room_created_idx on public.reactions(room_id,created_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = pg_catalog, public as $$ begin new.updated_at = now(); return new; end $$;
create trigger rooms_updated before update on public.rooms for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();
create trigger votes_updated before update on public.votes for each row execute function public.set_updated_at();

create function public.is_room_member(p_room_id uuid) returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.room_members m where m.room_id=p_room_id and m.user_id=auth.uid() and not m.is_kicked)
$$;
create function public.is_room_host(p_room_id uuid) returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.room_members m where m.room_id=p_room_id and m.user_id=auth.uid() and m.role='host' and not m.is_kicked)
$$;
revoke all on function public.is_room_member(uuid), public.is_room_host(uuid) from public;
grant execute on function public.is_room_member(uuid), public.is_room_host(uuid) to authenticated;

alter table public.rooms enable row level security; alter table public.room_members enable row level security; alter table public.tasks enable row level security;
alter table public.rounds enable row level security; alter table public.votes enable row level security; alter table public.round_participation enable row level security; alter table public.reactions enable row level security;
create policy rooms_read_member on public.rooms for select to authenticated using (public.is_room_member(id));
create policy members_read_room on public.room_members for select to authenticated using (public.is_room_member(room_id));
create policy tasks_read_room on public.tasks for select to authenticated using (public.is_room_member(room_id));
create policy rounds_read_room on public.rounds for select to authenticated using (public.is_room_member(room_id));
create policy participation_read_room on public.round_participation for select to authenticated using (public.is_room_member(room_id));
create policy reactions_read_room on public.reactions for select to authenticated using (public.is_room_member(room_id));
create policy votes_private_until_reveal on public.votes for select to authenticated using (
  public.is_room_member(room_id) and (member_id in (select id from public.room_members where user_id=auth.uid() and room_id=votes.room_id) or exists(select 1 from public.rounds r where r.id=round_id and r.status in ('revealed','closed')))
);

create function public.current_member(p_room_id uuid) returns public.room_members language sql stable security definer set search_path=pg_catalog,public as $$
  select m from public.room_members m where m.room_id=p_room_id and m.user_id=auth.uid() and not m.is_kicked
$$;
revoke all on function public.current_member(uuid) from public; grant execute on function public.current_member(uuid) to authenticated;

create function public.create_room(p_room_name text,p_display_name text,p_avatar_key text) returns table(code text)
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare v_room_id uuid; v_code text; v_member_id uuid; v_chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  if char_length(btrim(p_room_name)) not between 2 and 60 or char_length(btrim(p_display_name)) not between 2 and 32 then raise exception 'Datos no válidos'; end if;
  if p_avatar_key not in ('🦊','🐼','🐙','🦁','🐸','🦄','🐧','🐨') then raise exception 'Avatar no válido'; end if;
  loop select string_agg(substr(v_chars,1+floor(random()*length(v_chars))::int,1),'') into v_code from generate_series(1,8); exit when not exists(select 1 from public.rooms r where r.code=v_code); end loop;
  insert into public.rooms(code,name,owner_user_id) values(v_code,btrim(p_room_name),auth.uid()) returning id into v_room_id;
  insert into public.room_members(room_id,user_id,display_name,avatar_key,role) values(v_room_id,auth.uid(),btrim(p_display_name),p_avatar_key,'host') returning id into v_member_id;
  return query select v_code;
end $$;

create function public.join_room(p_code text,p_display_name text,p_avatar_key text) returns table(room_id uuid)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_room public.rooms; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  select * into v_room from public.rooms r where r.code=upper(btrim(p_code));
  if v_room.id is null then raise exception 'La sala no existe'; end if; if v_room.status <> 'open' then raise exception 'La sala está cerrada'; end if;
  if char_length(btrim(p_display_name)) not between 2 and 32 then raise exception 'Nombre no válido'; end if;
  if p_avatar_key not in ('🦊','🐼','🐙','🦁','🐸','🦄','🐧','🐨') then raise exception 'Avatar no válido'; end if;
  select m.id into v_id from public.room_members m where m.room_id=v_room.id and m.user_id=auth.uid();
  if v_id is not null then
    if exists(select 1 from public.room_members m where m.id=v_id and m.is_kicked) then raise exception 'Has sido expulsado de esta sala'; end if;
    update public.room_members set display_name=btrim(p_display_name),avatar_key=p_avatar_key where id=v_id;
  else insert into public.room_members(room_id,user_id,display_name,avatar_key) values(v_room.id,auth.uid(),btrim(p_display_name),p_avatar_key) returning id into v_id; end if;
  return query select v_room.id;
exception when unique_violation then raise exception 'Ese nombre ya está en uso en esta sala';
end $$;

create function public.leave_room(p_room_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_member public.room_members;
begin select * into v_member from public.current_member(p_room_id); if v_member.id is null then raise exception 'No perteneces a la sala'; end if;
  if v_member.role='host' and exists(select 1 from public.room_members where room_id=p_room_id and id<>v_member.id and not is_kicked) then raise exception 'Transfiere antes el rol de organizador'; end if;
  delete from public.room_members where id=v_member.id; if v_member.role='host' then update public.rooms set status='closed' where id=p_room_id; end if;
end $$;

create function public.create_task(p_room_id uuid,p_title text,p_description text default '') returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_id uuid; v_member public.room_members;
begin if not public.is_room_host(p_room_id) then raise exception 'Solo el organizador puede crear tareas'; end if; select * into v_member from public.current_member(p_room_id);
  insert into public.tasks(room_id,title,description,sort_order,created_by) values(p_room_id,btrim(p_title),nullif(btrim(p_description),''),coalesce((select max(sort_order)+1 from public.tasks where room_id=p_room_id),0),v_member.id) returning id into v_id; return v_id; end $$;
create function public.update_task(p_task_id uuid,p_title text,p_description text default '') returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; begin select * into v_task from public.tasks where id=p_task_id for update; if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if; if v_task.status='completed' then raise exception 'La tarea ya está finalizada'; end if; update public.tasks set title=btrim(p_title),description=nullif(btrim(p_description),'') where id=p_task_id; end $$;
create function public.delete_task(p_task_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; begin select * into v_task from public.tasks where id=p_task_id for update; if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if; if v_task.status<>'pending' or exists(select 1 from public.rounds where task_id=p_task_id and status in ('revealed','closed')) then raise exception 'No se puede eliminar una tarea con resultados'; end if; delete from public.tasks where id=p_task_id; update public.tasks set sort_order=sort_order-1 where room_id=v_task.room_id and sort_order>v_task.sort_order; end $$;
create function public.reorder_tasks(p_room_id uuid,p_task_ids uuid[]) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin if not public.is_room_host(p_room_id) then raise exception 'Acción no permitida'; end if; if cardinality(p_task_ids)<>(select count(*) from public.tasks where room_id=p_room_id) or exists(select 1 from unnest(p_task_ids) id where not exists(select 1 from public.tasks t where t.id=id and t.room_id=p_room_id)) then raise exception 'Orden no válido'; end if;
  update public.tasks set sort_order=-sort_order-1 where room_id=p_room_id; update public.tasks t set sort_order=u.ord-1 from unnest(p_task_ids) with ordinality u(id,ord) where t.id=u.id; end $$;

create function public.start_round(p_task_id uuid) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; v_id uuid; v_no int;
begin select * into v_task from public.tasks where id=p_task_id for update; perform 1 from public.rooms where id=v_task.room_id and status='open' for update; if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if; if exists(select 1 from public.rounds where room_id=v_task.room_id and status in ('voting','revealed')) then raise exception 'Ya existe una ronda activa'; end if; if v_task.status='completed' then raise exception 'La tarea ya está finalizada'; end if;
  select coalesce(max(round_number),0)+1 into v_no from public.rounds where task_id=p_task_id; insert into public.rounds(room_id,task_id,round_number) values(v_task.room_id,p_task_id,v_no) returning id into v_id; update public.tasks set status='voting' where id=p_task_id; return v_id; end $$;
create function public.cast_vote(p_round_id uuid,p_value text) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds; v_member public.room_members; begin select * into v_round from public.rounds where id=p_round_id for update; if v_round.status<>'voting' then raise exception 'La votación está cerrada'; end if; select * into v_member from public.current_member(v_round.room_id); if v_member.id is null then raise exception 'No perteneces a la sala'; end if; if p_value not in ('0','1','2','3','5','8','13','21','34','?','☕') then raise exception 'Carta no válida'; end if;
  insert into public.votes(room_id,round_id,member_id,value) values(v_round.room_id,p_round_id,v_member.id,p_value) on conflict(round_id,member_id) do update set value=excluded.value,updated_at=now(); insert into public.round_participation(room_id,round_id,member_id,has_voted,voted_at) values(v_round.room_id,p_round_id,v_member.id,true,now()) on conflict(round_id,member_id) do update set has_voted=true,voted_at=now(); end $$;
create function public.reveal_round(p_round_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds; begin select * into v_round from public.rounds where id=p_round_id for update; if not public.is_room_host(v_round.room_id) then raise exception 'Acción no permitida'; end if; if v_round.status<>'voting' then raise exception 'La ronda no está abierta'; end if; update public.rounds set status='revealed',revealed_at=now() where id=p_round_id; update public.tasks set status='revealed' where id=v_round.task_id; end $$;
create function public.restart_round(p_round_id uuid) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_round public.rounds; v_id uuid; begin select * into v_round from public.rounds where id=p_round_id for update; if not public.is_room_host(v_round.room_id) then raise exception 'Acción no permitida'; end if; if v_round.status<>'revealed' then raise exception 'Revela primero la ronda'; end if; update public.rounds set status='closed' where id=p_round_id; insert into public.rounds(room_id,task_id,round_number) values(v_round.room_id,v_round.task_id,v_round.round_number+1) returning id into v_id; update public.tasks set status='voting' where id=v_round.task_id; return v_id; end $$;
create function public.finalize_task(p_task_id uuid,p_estimate text) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_task public.tasks; begin select * into v_task from public.tasks where id=p_task_id for update; if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if; if p_estimate not in ('0','1','2','3','5','8','13','21','34','?','☕') then raise exception 'Estimación no válida'; end if; if not exists(select 1 from public.rounds where task_id=p_task_id and status='revealed') then raise exception 'No hay una ronda revelada'; end if; update public.rounds set status='closed' where task_id=p_task_id and status='revealed'; update public.tasks set status='completed',final_estimate=p_estimate where id=p_task_id; end $$;

create function public.transfer_host(p_room_id uuid,p_target_member_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_me public.room_members; begin if not public.is_room_host(p_room_id) then raise exception 'Acción no permitida'; end if; select * into v_me from public.current_member(p_room_id); if not exists(select 1 from public.room_members where id=p_target_member_id and room_id=p_room_id and not is_kicked) then raise exception 'Participante no válido'; end if; update public.room_members set role='participant' where id=v_me.id; update public.room_members set role='host' where id=p_target_member_id; update public.rooms set owner_user_id=(select user_id from public.room_members where id=p_target_member_id) where id=p_room_id; end $$;
create function public.close_room(p_room_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$ begin if not public.is_room_host(p_room_id) then raise exception 'Acción no permitida'; end if; update public.rooms set status='closed' where id=p_room_id; update public.rounds set status='cancelled' where room_id=p_room_id and status in ('voting','revealed'); end $$;
create function public.send_reaction(p_room_id uuid,p_target_member_id uuid,p_emoji text) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_sender public.room_members; v_id uuid; begin select * into v_sender from public.current_member(p_room_id); if v_sender.id is null then raise exception 'No perteneces a la sala'; end if; if not exists(select 1 from public.room_members where id=p_target_member_id and room_id=p_room_id and not is_kicked) or p_target_member_id=v_sender.id then raise exception 'Destinatario no válido'; end if; if p_emoji not in ('😂','🔥','👏','🤔','🎯','☕') then raise exception 'Emoji no válido'; end if;
  if exists(select 1 from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '750 milliseconds') or (select count(*) from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '10 seconds')>=20 then raise exception 'Espera un momento antes de reaccionar otra vez'; end if;
  insert into public.reactions(room_id,sender_member_id,target_member_id,emoji) values(p_room_id,v_sender.id,p_target_member_id,p_emoji) returning id into v_id; return v_id; end $$;

revoke all on all tables in schema public from anon,authenticated; grant select on public.rooms,public.room_members,public.tasks,public.rounds,public.votes,public.round_participation,public.reactions to authenticated;
revoke all on function public.create_room(text,text,text),public.join_room(text,text,text),public.leave_room(uuid),public.create_task(uuid,text,text),public.update_task(uuid,text,text),public.delete_task(uuid),public.reorder_tasks(uuid,uuid[]),public.start_round(uuid),public.cast_vote(uuid,text),public.reveal_round(uuid),public.restart_round(uuid),public.finalize_task(uuid,text),public.transfer_host(uuid,uuid),public.close_room(uuid),public.send_reaction(uuid,uuid,text) from public;
grant execute on function public.create_room(text,text,text),public.join_room(text,text,text),public.leave_room(uuid),public.create_task(uuid,text,text),public.update_task(uuid,text,text),public.delete_task(uuid),public.reorder_tasks(uuid,uuid[]),public.start_round(uuid),public.cast_vote(uuid,text),public.reveal_round(uuid),public.restart_round(uuid),public.finalize_task(uuid,text),public.transfer_host(uuid,uuid),public.close_room(uuid),public.send_reaction(uuid,uuid,text) to authenticated;

alter table public.room_members replica identity full; alter table public.tasks replica identity full; alter table public.rounds replica identity full; alter table public.round_participation replica identity full; alter table public.reactions replica identity full;
alter publication supabase_realtime add table public.room_members,public.tasks,public.rounds,public.round_participation,public.reactions;

comment on table public.reactions is 'Retener solo eventos recientes. Ejecutar periódicamente: delete from public.reactions where created_at < now() - interval ''24 hours'';';
