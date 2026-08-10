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
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_member public.room_members;
  v_round public.rounds;
  v_participation public.round_participation;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_mode is null or p_mode not in ('voter', 'observer') then
    raise exception 'PARTICIPATION_MODE_INVALID';
  end if;

  select * into v_member
  from public.room_members m
  where m.room_id = p_room_id
    and m.user_id = auth.uid()
    and not m.is_kicked
  for update;
  if v_member.id is null then raise exception 'NOT_A_ROOM_MEMBER'; end if;

  if p_round_id is not null then
    select * into v_round
    from public.rounds r
    where r.id = p_round_id
    for update;
    if v_round.id is null or v_round.room_id <> p_room_id then
      raise exception 'ROUND_NOT_IN_ROOM';
    end if;
  else
    select * into v_round
    from public.rounds r
    where r.room_id = p_room_id and r.status = 'voting'
    order by r.created_at desc
    limit 1
    for update;
  end if;

  update public.room_members
  set default_participation_mode = p_mode
  where id = v_member.id;

  if v_round.id is not null and v_round.status = 'voting' then
    insert into public.round_participation (
      room_id, round_id, member_id, participation_mode, has_voted, voted_at
    ) values (
      p_room_id, v_round.id, v_member.id, p_mode, false, null
    ) on conflict (round_id, member_id) do nothing;

    if p_mode = 'observer' then
      delete from public.votes v
      where v.round_id = v_round.id and v.member_id = v_member.id;

      update public.round_participation rp
      set participation_mode = 'observer', has_voted = false, voted_at = null
      where rp.round_id = v_round.id and rp.member_id = v_member.id
      returning * into v_participation;
    else
      update public.round_participation rp
      set participation_mode = 'voter'
      where rp.round_id = v_round.id and rp.member_id = v_member.id
      returning * into v_participation;
    end if;
  elsif v_round.id is not null then
    select * into v_participation
    from public.round_participation rp
    where rp.round_id = v_round.id and rp.member_id = v_member.id;
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
end;
$$;

revoke all on function public.set_my_participation_mode(uuid,text,uuid) from public;
grant execute on function public.set_my_participation_mode(uuid,text,uuid) to authenticated;

comment on function public.set_my_participation_mode(uuid,text,uuid) is
  'Changes the authenticated member mode during voting; observer removes an existing vote atomically.';
