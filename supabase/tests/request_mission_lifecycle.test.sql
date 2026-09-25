BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(21);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'workflow-lifecycle@example.test', '', now(), '{}', '{}', now(), now()
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

INSERT INTO public.contacts (id, user_id, first_name, last_name, relationship)
VALUES (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Jean', 'Test', 'prospect'
);

INSERT INTO public.requests (id, user_id, contact_id, title)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Première demande'
);

SELECT lives_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Première mission', 'a_demarrer', 0, NULL
  )$$,
  'create mission commits for an open request'
);
SELECT throws_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Refusée', 'a_demarrer', 0, NULL
  )$$,
  'P0001',
  'Request 30000000-0000-4000-8000-000000000001 does not belong to contact 20000000-0000-4000-8000-000000000002.',
  'a request cannot be assigned to a different contact'
);
SELECT is((SELECT count(*) FROM public.missions), 1::bigint, 'contact mismatch creates no mission');
SELECT is(
  (SELECT relationship FROM public.contacts WHERE id = '20000000-0000-4000-8000-000000000001'),
  'client'::public.relationship_type,
  'first mission turns a prospect into a client'
);
SELECT is(
  (SELECT status FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  'mission_confirmee'::public.request_status,
  'mission creation confirms the request'
);
SELECT is(
  (SELECT is_active FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  true,
  'confirmed request stays active'
);

SELECT lives_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Deuxième mission', 'a_demarrer', 0, NULL
  )$$,
  'a second mission can belong to the request'
);
SELECT is(
  (SELECT relationship FROM public.contacts WHERE id = '20000000-0000-4000-8000-000000000001'),
  'client_recurrent'::public.relationship_type,
  'later mission turns a client into a recurrent client'
);

SELECT lives_ok(
  $$SELECT * FROM public.update_mission_with_lifecycle(
    (SELECT id FROM public.missions WHERE title = 'Première mission'),
    'Première mission', false, 'terminee', true, 0, false, NULL, false
  )$$,
  'first mission can be completed'
);
SELECT is(
  (SELECT status FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  'mission_confirmee'::public.request_status,
  'request remains confirmed while another mission is open'
);

SELECT lives_ok(
  $$SELECT * FROM public.update_mission_with_lifecycle(
    (SELECT id FROM public.missions WHERE title = 'Deuxième mission'),
    'Deuxième mission', false, 'terminee', true, 0, false, NULL, false
  )$$,
  'last mission can be completed'
);
SELECT is(
  (SELECT status FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  'terminee'::public.request_status,
  'last mission completion closes the request'
);
SELECT is(
  (SELECT is_active FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  false,
  'terminal request is no longer active'
);
SELECT is(
  (SELECT archived FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  false,
  'completion does not archive the request'
);
SELECT throws_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Refusée', 'a_demarrer', 0, NULL
  )$$,
  'P0001',
  'Cannot create a mission for a closed or archived request.',
  'terminal request refuses a mission'
);
SELECT is((SELECT count(*) FROM public.missions), 2::bigint, 'rejected terminal request creates no mission');

UPDATE public.requests
SET status = 'nouveau'
WHERE id = '30000000-0000-4000-8000-000000000001';
SELECT is(
  (SELECT is_active FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000001'),
  true,
  'reopening a request restores its active flag'
);

UPDATE public.requests
SET archived = true
WHERE id = '30000000-0000-4000-8000-000000000001';
SELECT throws_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Refusée', 'a_demarrer', 0, NULL
  )$$,
  'P0001',
  'Cannot create a mission for a closed or archived request.',
  'archived request refuses a mission'
);

INSERT INTO public.contacts (id, user_id, first_name, last_name, relationship)
VALUES (
  '20000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'Camille', 'Test', 'prospect'
);
INSERT INTO public.requests (id, user_id, contact_id, title)
VALUES (
  '30000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  'Demande avec mission terminée dès sa création'
);
SELECT lives_ok(
  $$SELECT * FROM public.create_mission_with_lifecycle(
    '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'Mission terminée', 'terminee', 100, NULL
  )$$,
  'a mission may be created with terminal status'
);
SELECT is(
  (SELECT status FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000003'),
  'mission_confirmee'::public.request_status,
  'mission creation confirms the request even when the mission starts terminal'
);
SELECT is(
  (SELECT is_active FROM public.requests WHERE id = '30000000-0000-4000-8000-000000000003'),
  true,
  'request remains active after mission creation'
);

SELECT * FROM finish();
ROLLBACK;
