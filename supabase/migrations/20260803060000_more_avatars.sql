-- Keep the avatar catalog in one database predicate so constraints and RPCs
-- cannot drift apart when new options are added.
create or replace function public.is_valid_avatar_key(p_avatar_key text)
returns boolean
language sql immutable
set search_path=pg_catalog,public as $$
  select p_avatar_key = any(array[
    '🦊','🐼','🐙','🦁','🐸','🦄','🐧','🐨',
    '🐶','🐱','🦋','🐷','🦩','🦆','🦅','🦤','🦥',
    '🦔','🦘','🐰','🦈','🫍','🐬','🐋'
  ]::text[])
$$;

alter table public.room_members
  drop constraint if exists room_members_avatar_key_check;

alter table public.room_members
  add constraint room_members_avatar_key_check
  check (public.is_valid_avatar_key(avatar_key));

create or replace function public.create_room(p_room_name text,p_display_name text,p_avatar_key text)
returns table(code text)
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare v_room_id uuid; v_code text; v_member_id uuid; v_chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  if char_length(btrim(p_room_name)) not between 2 and 60 or char_length(btrim(p_display_name)) not between 2 and 32 then raise exception 'Datos no válidos'; end if;
  if not public.is_valid_avatar_key(p_avatar_key) then raise exception 'Avatar no válido'; end if;
  loop select string_agg(substr(v_chars,1+floor(random()*length(v_chars))::int,1),'') into v_code from generate_series(1,8); exit when not exists(select 1 from public.rooms r where r.code=v_code); end loop;
  insert into public.rooms(code,name,owner_user_id) values(v_code,btrim(p_room_name),auth.uid()) returning id into v_room_id;
  insert into public.room_members(room_id,user_id,display_name,avatar_key,role) values(v_room_id,auth.uid(),btrim(p_display_name),p_avatar_key,'host') returning id into v_member_id;
  return query select v_code;
end $$;

create or replace function public.join_room(p_code text,p_display_name text,p_avatar_key text)
returns table(room_id uuid)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_room public.rooms; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;
  select * into v_room from public.rooms r where r.code=upper(btrim(p_code));
  if v_room.id is null then raise exception 'La sala no existe'; end if;
  if v_room.status <> 'open' then raise exception 'La sala está cerrada'; end if;
  if char_length(btrim(p_display_name)) not between 2 and 32 then raise exception 'Nombre no válido'; end if;
  if not public.is_valid_avatar_key(p_avatar_key) then raise exception 'Avatar no válido'; end if;

  select m.id into v_id from public.room_members m where m.room_id=v_room.id and m.user_id=auth.uid();
  if v_id is not null then
    if exists(select 1 from public.room_members m where m.id=v_id and m.is_kicked) then raise exception 'Has sido expulsado de esta sala'; end if;
    update public.room_members set display_name=btrim(p_display_name), avatar_key=p_avatar_key where id=v_id;
  else
    insert into public.room_members(room_id,user_id,display_name,avatar_key)
    values(v_room.id,auth.uid(),btrim(p_display_name),p_avatar_key) returning id into v_id;
  end if;

  insert into public.round_participation(room_id,round_id,member_id,participation_mode,has_voted,voted_at)
  select r.room_id,r.id,v_id,m.default_participation_mode,false,null
  from public.rounds r join public.room_members m on m.id=v_id
  where r.room_id=v_room.id and r.status='voting'
  on conflict(round_id,member_id) do nothing;

  return query select v_room.id;
exception when unique_violation then raise exception 'Ese nombre ya está en uso en esta sala';
end $$;

revoke all on function public.is_valid_avatar_key(text) from public;
revoke all on function public.create_room(text,text,text), public.join_room(text,text,text) from public;
grant execute on function public.create_room(text,text,text), public.join_room(text,text,text) to authenticated;

