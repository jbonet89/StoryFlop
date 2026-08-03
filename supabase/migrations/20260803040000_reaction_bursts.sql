alter table public.reactions drop constraint if exists reactions_emoji_check;
alter table public.reactions add constraint reactions_emoji_check check (emoji = any(array[
  '😂','🔥','👏','🤔','🎯','☕','💩','✈️','🛩️','🛫','🛬','📝','📨','❤️','😍',
  '🥳','🚀','💡','✅','❌','⚡','🐛','🧠','🙌','😅','😮','😴','🤝','🏆','🎉',
  '🫏','🐔','🐸','🦄','🍌'
]::text[]));

create or replace function public.send_reaction(p_room_id uuid,p_target_member_id uuid,p_emoji text) returns uuid
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
  if (select count(*) from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '2 seconds')>=5
  then raise exception 'Ya has enviado 5 reacciones seguidas. Espera un momento'; end if;
  insert into public.reactions(room_id,sender_member_id,target_member_id,emoji)
  values(p_room_id,v_sender.id,p_target_member_id,p_emoji) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.send_reaction(uuid,uuid,text) from public;
grant execute on function public.send_reaction(uuid,uuid,text) to authenticated;
