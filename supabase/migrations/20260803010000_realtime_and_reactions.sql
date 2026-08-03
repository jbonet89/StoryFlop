-- Realtime configuration is intentionally idempotent so this migration is safe
-- for projects where some tables were already added from the Dashboard.
do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['room_members','tasks','rounds','round_participation','reactions'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;

alter table public.room_members replica identity full;
alter table public.tasks replica identity full;
alter table public.rounds replica identity full;
alter table public.round_participation replica identity full;
alter table public.reactions replica identity full;

alter table public.reactions drop constraint if exists reactions_emoji_check;
alter table public.reactions add constraint reactions_emoji_check check (emoji = any(array[
  '😂','🔥','👏','🤔','🎯','☕','💩','✈️','🛩️','🛫','🛬','📝','📨','❤️','😍',
  '🥳','🚀','💡','✅','❌','⚡','🐛','🧠','🙌','😅','😮','😴','🤝','🏆','🎉'
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
    '🥳','🚀','💡','✅','❌','⚡','🐛','🧠','🙌','😅','😮','😴','🤝','🏆','🎉'
  ]::text[])) then raise exception 'Emoji no válido'; end if;
  if exists(select 1 from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '750 milliseconds')
    or (select count(*) from public.reactions where sender_member_id=v_sender.id and created_at>now()-interval '10 seconds')>=20
  then raise exception 'Espera un momento antes de reaccionar otra vez'; end if;
  insert into public.reactions(room_id,sender_member_id,target_member_id,emoji)
  values(p_room_id,v_sender.id,p_target_member_id,p_emoji) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.send_reaction(uuid,uuid,text) from public;
grant execute on function public.send_reaction(uuid,uuid,text) to authenticated;
