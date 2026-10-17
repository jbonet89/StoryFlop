-- Private inbox. Only the server-side service role can submit or read messages.
create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('idea', 'problem')),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 4000),
  name text not null default '' check (char_length(name) <= 80),
  email text not null default '' check (char_length(email) <= 254),
  locale text not null check (locale in ('es','en','ca','fr','it','de','pt','eu','ru')),
  fingerprint text check (fingerprint ~ '^[a-f0-9]{64}$')
);
alter table public.feedback_submissions enable row level security;
revoke all on public.feedback_submissions from public, anon, authenticated;
grant select, insert, update, delete on public.feedback_submissions to service_role;

create index feedback_submissions_created_at_idx on public.feedback_submissions (created_at);
create index feedback_submissions_rate_idx on public.feedback_submissions (fingerprint, created_at)
  where fingerprint is not null;

-- SECURITY INVOKER: callable only by the backend, with atomic throttling across instances.
create function public.submit_feedback(
  p_kind text, p_title text, p_description text, p_name text,
  p_email text, p_locale text, p_fingerprint text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_FINGERPRINT';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_fingerprint, 0));
  if (select count(*) from public.feedback_submissions
      where fingerprint = p_fingerprint and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'FEEDBACK_RATE_LIMITED';
  end if;
  insert into public.feedback_submissions(kind, title, description, name, email, locale, fingerprint)
  values (p_kind, btrim(p_title), btrim(p_description), btrim(p_name), btrim(p_email), p_locale, p_fingerprint);
end;
$$;
revoke all on function public.submit_feedback(text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_feedback(text,text,text,text,text,text,text) to service_role;

-- Drop abuse-prevention hashes after one day and inbox messages after 24 months.
select cron.schedule('feedback-retention', '23 3 * * *', $job$
  update public.feedback_submissions set fingerprint = null
    where fingerprint is not null and created_at < now() - interval '1 day';
  delete from public.feedback_submissions where created_at < now() - interval '24 months';
$job$);
