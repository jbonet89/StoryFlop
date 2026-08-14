create or replace function public.delete_task(p_task_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_task public.tasks;
  v_offset integer;
begin
  select * into v_task from public.tasks where id=p_task_id for update;
  if v_task.id is null then raise exception 'La tarea no existe'; end if;
  if not public.is_room_host(v_task.room_id) then raise exception 'Acción no permitida'; end if;

  delete from public.tasks where id=p_task_id;
  select coalesce(max(sort_order), 0) + 1 into v_offset
    from public.tasks where room_id=v_task.room_id;
  update public.tasks
    set sort_order=sort_order+v_offset
    where room_id=v_task.room_id and sort_order>v_task.sort_order;
  update public.tasks
    set sort_order=sort_order-v_offset-1
    where room_id=v_task.room_id and sort_order>v_task.sort_order+v_offset;
end $$;

create or replace function public.clear_backlog(p_room_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  perform 1 from public.rooms where id=p_room_id for update;
  if not found then raise exception 'La sala no existe'; end if;
  if not public.is_room_host(p_room_id) then raise exception 'Acción no permitida'; end if;

  delete from public.tasks where room_id=p_room_id;
end $$;

revoke all on function public.delete_task(uuid), public.clear_backlog(uuid) from public;
grant execute on function public.delete_task(uuid), public.clear_backlog(uuid) to authenticated;

comment on function public.delete_task(uuid) is 'Deletes one task and its cascaded voting history; host only.';
comment on function public.clear_backlog(uuid) is 'Deletes every task and its cascaded voting history in a room; host only.';
