-- Run as an administrator against the target database. Leaves no test messages.
begin;
do $$
declare
  limited boolean := false;
  denied boolean := false;
  test_hash text := repeat('a', 64);
begin
  if not (select relrowsecurity from pg_class where oid = 'public.feedback_submissions'::regclass) then
    raise exception 'Feedback RLS is disabled';
  end if;
  if has_table_privilege('anon', 'public.feedback_submissions', 'select')
     or has_table_privilege('authenticated', 'public.feedback_submissions', 'select')
     or has_table_privilege('anon', 'public.feedback_submissions', 'insert')
     or has_table_privilege('authenticated', 'public.feedback_submissions', 'insert') then
    raise exception 'Feedback table is exposed';
  end if;
  if has_function_privilege('anon', 'public.submit_feedback(text,text,text,text,text,text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.submit_feedback(text,text,text,text,text,text,text)', 'execute') then
    raise exception 'Feedback function is exposed';
  end if;
  set local role service_role;
  for i in 1..5 loop
    perform public.submit_feedback('idea', 'Verification message', 'Automated test; rolled back.', '', '', 'es', test_hash);
  end loop;
  begin
    perform public.submit_feedback('idea', 'Sixth test message', 'Must be rate limited.', '', '', 'es', test_hash);
  exception when others then
    if sqlerrm = 'FEEDBACK_RATE_LIMITED' then limited := true; else raise; end if;
  end;
  if not limited then raise exception 'Rate limit failed'; end if;
  begin
    perform public.submit_feedback('invalid', 'Invalid kind', 'Must fail the database constraint.', '', '', 'es', repeat('b',64));
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'Constraint validation failed'; end if;
  reset role;
end $$;
rollback;
