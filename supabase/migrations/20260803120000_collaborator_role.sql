alter type public.member_role add value if not exists 'collaborator' after 'host';

comment on type public.member_role is
  'Room role: host owns governance, collaborator facilitates work, participant joins voting.';
