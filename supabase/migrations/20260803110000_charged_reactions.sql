alter table public.reactions
  add column if not exists scale numeric not null default 1
  check (scale >= 1 and scale <= 3);

drop function if exists public.send_reaction(uuid,uuid,text);

create function public.send_reaction(
  p_room_id uuid,
  p_target_member_id uuid,
  p_emoji text,
  p_scale numeric default 1
) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_sender public.room_members; v_id uuid;
begin
  select * into v_sender from public.current_member(p_room_id);
  if v_sender.id is null then raise exception 'No perteneces a la sala'; end if;
  if not exists(select 1 from public.room_members where id=p_target_member_id and room_id=p_room_id and not is_kicked) or p_target_member_id=v_sender.id then raise exception 'Destinatario no válido'; end if;
  if not (p_emoji = any(array[
    '😂','🔥','👏','🤔','🎯','☕','💩','✈️','🛩️','🛫','🛬','📝','📨','❤️','😍',
    '🥳','🚀','💡','✅','❌','⚡','🐛','🧠','🙌','😅','😮','😴','🤝','🏆','🎉',
    '🫏','🐔','🐸','🦄','🍌'
  ]::text[])) then raise exception 'Emoji no válido'; end if;
  if p_scale is null or p_scale < 1 or p_scale > 3 then raise exception 'Tamaño de reacción no válido'; end if;
  if (select count(*) from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '2 seconds')>=5
  then raise exception 'Ya has enviado 5 reacciones seguidas. Espera un momento'; end if;
  insert into public.reactions(room_id,sender_member_id,target_member_id,emoji,scale)
  values(p_room_id,v_sender.id,p_target_member_id,p_emoji,p_scale) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.send_reaction(uuid,uuid,text,numeric) from public;
grant execute on function public.send_reaction(uuid,uuid,text,numeric) to authenticated;

comment on column public.reactions.scale is 'Visual reaction size from 1x to 3x; charged reactions use values above 1.';
