create or replace function public.join_room(
  p_code text,
  p_display_name text,
  p_avatar_key text
) returns table(room_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.rooms;
  v_id uuid;
  v_requested_name text;
  v_display_name text;
  v_suffix integer := 1;
  v_suffix_text text;
begin
  if auth.uid() is null then raise exception 'Sesión no válida'; end if;

  select * into v_room
  from public.rooms r
  where r.code = upper(btrim(p_code))
  for update;

  if v_room.id is null then raise exception 'La sala no existe'; end if;
  if v_room.status <> 'open' then raise exception 'La sala está cerrada'; end if;

  v_requested_name := btrim(p_display_name);
  if char_length(v_requested_name) not between 2 and 32 then raise exception 'Nombre no válido'; end if;
  if not public.is_valid_avatar_key(p_avatar_key) then raise exception 'Avatar no válido'; end if;

  select m.id into v_id
  from public.room_members m
  where m.room_id = v_room.id
    and m.user_id = auth.uid();

  if v_id is not null and exists (
    select 1 from public.room_members m where m.id = v_id and m.is_kicked
  ) then
    raise exception 'Has sido expulsado de esta sala';
  end if;

  v_display_name := v_requested_name;
  while exists (
    select 1
    from public.room_members m
    where m.room_id = v_room.id
      and lower(m.display_name) = lower(v_display_name)
      and not m.is_kicked
      and m.id is distinct from v_id
  ) loop
    v_suffix := v_suffix + 1;
    v_suffix_text := ' ' || v_suffix::text;
    v_display_name := left(v_requested_name, 32 - char_length(v_suffix_text)) || v_suffix_text;
  end loop;

  if v_id is not null then
    update public.room_members
    set display_name = v_display_name,
        avatar_key = p_avatar_key
    where id = v_id;
  else
    insert into public.room_members(room_id, user_id, display_name, avatar_key)
    values(v_room.id, auth.uid(), v_display_name, p_avatar_key)
    returning id into v_id;
  end if;

  insert into public.round_participation(
    room_id, round_id, member_id, participation_mode, has_voted, voted_at
  )
  select r.room_id, r.id, v_id, m.default_participation_mode, false, null
  from public.rounds r
  join public.room_members m on m.id = v_id
  where r.room_id = v_room.id and r.status = 'voting'
  on conflict(round_id, member_id) do nothing;

  return query select v_room.id;
end;
$$;

revoke all on function public.join_room(text,text,text) from public;
grant execute on function public.join_room(text,text,text) to authenticated;

comment on function public.join_room(text,text,text) is
  'Joins a room and assigns a case-insensitive unique display name using numeric suffixes.';
