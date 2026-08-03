-- A former host may leave after transferring the role. Keep their tasks and
-- release only the member reference instead of blocking the departure.
alter table public.tasks
  alter column created_by drop not null;

alter table public.tasks
  drop constraint if exists tasks_created_by_fkey;

alter table public.tasks
  add constraint tasks_created_by_fkey
  foreign key (created_by)
  references public.room_members(id)
  on delete set null;

comment on column public.tasks.created_by is
  'Member that created the task. Null when that member has left the room.';

