alter table public.rooms
  add column if not exists last_activity_at timestamptz not null default now();

update public.rooms r
set last_activity_at=greatest(
  r.created_at,
  r.updated_at,
  coalesce((select max(m.joined_at) from public.room_members m where m.room_id=r.id),'-infinity'::timestamptz),
  coalesce((select max(t.updated_at) from public.tasks t where t.room_id=r.id),'-infinity'::timestamptz),
  coalesce((select max(greatest(rd.created_at,coalesce(rd.revealed_at,rd.created_at))) from public.rounds rd where rd.room_id=r.id),'-infinity'::timestamptz),
  coalesce((select max(v.updated_at) from public.votes v where v.room_id=r.id),'-infinity'::timestamptz),
  coalesce((select max(rp.updated_at) from public.round_participation rp where rp.room_id=r.id),'-infinity'::timestamptz),
  coalesce((select max(ec.changed_at) from public.task_estimate_changes ec where ec.room_id=r.id),'-infinity'::timestamptz)
);

create index if not exists rooms_last_activity_idx on public.rooms(last_activity_at);
create index if not exists reactions_created_at_idx on public.reactions(created_at);

create function public.touch_room_activity_from_child() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_room_id uuid;
begin
  v_room_id := case when tg_op='DELETE' then old.room_id else new.room_id end;
  if pg_trigger_depth()>1 then
    return case when tg_op='DELETE' then old else new end;
  end if;
  update public.rooms set last_activity_at=now() where id=v_room_id;
  return case when tg_op='DELETE' then old else new end;
end $$;

create function public.touch_room_activity_from_room() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin
  new.last_activity_at := now();
  return new;
end $$;

create trigger room_members_touch_activity_insert_delete
after insert or delete on public.room_members for each row
execute function public.touch_room_activity_from_child();
create trigger room_members_touch_activity_update
after update of role,is_kicked,default_participation_mode on public.room_members for each row
execute function public.touch_room_activity_from_child();
create trigger tasks_touch_room_activity
after insert or update or delete on public.tasks for each row
execute function public.touch_room_activity_from_child();
create trigger rounds_touch_room_activity
after insert or update or delete on public.rounds for each row
execute function public.touch_room_activity_from_child();
create trigger votes_touch_room_activity
after insert or update or delete on public.votes for each row
execute function public.touch_room_activity_from_child();
create trigger participation_touch_room_activity
after insert or update or delete on public.round_participation for each row
execute function public.touch_room_activity_from_child();
create trigger estimate_changes_touch_room_activity
after insert or update or delete on public.task_estimate_changes for each row
execute function public.touch_room_activity_from_child();
create trigger rooms_touch_own_activity
before update of owner_user_id,status,name,deck on public.rooms for each row
execute function public.touch_room_activity_from_room();

create function public.purge_expired_reactions() returns bigint
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_deleted bigint;
begin
  delete from public.reactions where created_at<now()-interval '15 minutes';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

create function public.purge_inactive_rooms() returns bigint
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_deleted bigint;
begin
  delete from public.rooms where last_activity_at<now()-interval '14 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

create function public.purge_orphan_anonymous_users() returns bigint
language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare v_deleted bigint;
begin
  delete from auth.users u
  where u.is_anonymous is true
    and u.created_at<now()-interval '15 days'
    and not exists(select 1 from public.room_members m where m.user_id=u.id)
    and not exists(select 1 from public.rooms r where r.owner_user_id=u.id);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

revoke all on function public.touch_room_activity_from_child(), public.touch_room_activity_from_room(),
  public.purge_expired_reactions(), public.purge_inactive_rooms(), public.purge_orphan_anonymous_users()
from public,anon,authenticated;

create extension if not exists pg_cron with schema pg_catalog;

do $schedule$
declare v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname='storyflop-purge-reactions' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule('storyflop-purge-reactions','*/5 * * * *','select public.purge_expired_reactions()');

  for v_job_id in select jobid from cron.job where jobname='storyflop-purge-rooms' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule('storyflop-purge-rooms','17 * * * *','select public.purge_inactive_rooms()');

  for v_job_id in select jobid from cron.job where jobname='storyflop-purge-anonymous-users' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule('storyflop-purge-anonymous-users','37 3 * * *','select public.purge_orphan_anonymous_users()');

  for v_job_id in select jobid from cron.job where jobname='storyflop-purge-cron-history' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule(
    'storyflop-purge-cron-history',
    '52 3 * * *',
    $command$delete from cron.job_run_details where end_time<now()-interval '30 days'$command$
  );
end $schedule$;

comment on column public.rooms.last_activity_at is
  'Last functional room activity; profile edits, presence and reactions intentionally do not update it.';
