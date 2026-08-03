create or replace function public.update_my_profile(
  p_room_id uuid,
  p_display_name text,
  p_avatar_key text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if char_length(btrim(p_display_name)) not between 2 and 32 then
    raise exception 'Nombre no válido';
  end if;
  if not public.is_valid_avatar_key(p_avatar_key) then
    raise exception 'Avatar no válido';
  end if;

  update public.room_members
  set display_name = btrim(p_display_name),
      avatar_key = p_avatar_key
  where room_id = p_room_id
    and user_id = auth.uid()
    and not is_kicked;

  if not found then
    raise exception 'ROOM_MEMBER_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.update_my_profile(uuid,text,text) from public;
grant execute on function public.update_my_profile(uuid,text,text) to authenticated;
