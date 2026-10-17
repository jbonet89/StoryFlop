-- Anonymous aggregate counters: only the server service role can read or mutate them.
create table public.resource_usage_daily (
  day date not null,
  event text not null check (event in ('resource_view','guide_end_reached','demo_started','demo_completed','template_copy','template_download','template_print','room_create_intent','room_created')),
  locale text not null check (locale in ('es','en','fr','it','de','pt','ca','eu','ru')),
  resource text not null check (resource in ('index','demo','template','about','home','primera-sesion','resolver-desacuerdos','historias-listas-para-estimar','dividir-historias','interpretar-resultados','sesiones-remotas')),
  count bigint not null default 1 check (count > 0),
  primary key (day, event, locale, resource)
);
alter table public.resource_usage_daily enable row level security;
revoke all on table public.resource_usage_daily from public, anon, authenticated;
grant select, insert, update, delete on table public.resource_usage_daily to service_role;

create function public.record_resource_usage(p_event text, p_locale text, p_resource text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not (
    (p_event = 'resource_view' and p_resource <> 'home') or
    (p_event = 'guide_end_reached' and p_resource in ('primera-sesion','resolver-desacuerdos','historias-listas-para-estimar','dividir-historias','interpretar-resultados','sesiones-remotas')) or
    (p_event in ('demo_started','demo_completed') and p_resource = 'demo') or
    (p_event in ('template_copy','template_download','template_print') and p_resource = 'template') or
    (p_event = 'room_create_intent' and p_resource <> 'home') or
    (p_event = 'room_created' and p_resource = 'home')
  ) then raise exception 'Invalid event context' using errcode = '22023'; end if;
  insert into public.resource_usage_daily as totals (day,event,locale,resource,count)
  values ((pg_catalog.now() at time zone 'UTC')::date,p_event,p_locale,p_resource,1)
  on conflict (day,event,locale,resource) do update set count = totals.count + 1;
  delete from public.resource_usage_daily where day < (pg_catalog.now() at time zone 'UTC')::date - 400;
end;
$$;
revoke all on function public.record_resource_usage(text,text,text) from public, anon, authenticated;
grant execute on function public.record_resource_usage(text,text,text) to service_role;
comment on table public.resource_usage_daily is 'Daily UTC interaction counts. No visitor identifiers, room codes, votes, free text or IP addresses. Not unique visitors or confirmed reading.';
