-- Run as the project owner in Supabase SQL Editor. Counts are interactions, not unique people.
select day,locale,resource,
  sum(count) filter (where event='resource_view') as views,
  sum(count) filter (where event='guide_end_reached') as reached_end,
  sum(count) filter (where event='demo_started') as demo_starts,
  sum(count) filter (where event='demo_completed') as demo_completions,
  sum(count) filter (where event='template_download') as downloads,
  sum(count) filter (where event='room_create_intent') as create_room_clicks,
  sum(count) filter (where event='room_created') as rooms_created
from public.resource_usage_daily
where day >= (now() at time zone 'UTC')::date - 29
group by day,locale,resource order by day desc,locale,resource;
