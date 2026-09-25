BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(7);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '11000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'atomic-edit@example.test', '', now(), '{}', '{}', now(), now()
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);

INSERT INTO public.contacts (id, user_id, first_name, last_name, relationship)
VALUES (
  '21000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  'Jean', 'Atomic', 'client'
);

INSERT INTO public.requests (id, user_id, contact_id, title, status)
VALUES (
  '31000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  'Demande initiale', 'solution_proposee'
);

INSERT INTO public.request_actions (id, user_id, request_id, type, label, due_at)
VALUES (
  '41000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',
  'appel', 'Appeler le client', now() + interval '1 day'
);

SELECT lives_ok(
  $$SELECT public.update_request_with_action(
    '31000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    'Demande modifiée', true, 'Description modifiée', true,
    'en_attente', true, 'devis', true, 'Envoyer le devis', true,
    now() + interval '2 days', true
  )$$,
  'request and open action update successfully in one transaction'
);
SELECT is(
  (SELECT title FROM public.requests WHERE id = '31000000-0000-4000-8000-000000000001'),
  'Demande modifiée',
  'request fields are persisted'
);
SELECT is(
  (SELECT status FROM public.requests WHERE id = '31000000-0000-4000-8000-000000000001'),
  'en_attente'::public.request_status,
  'request status is persisted'
);
SELECT is(
  (SELECT label FROM public.request_actions WHERE id = '41000000-0000-4000-8000-000000000001'),
  'Envoyer le devis',
  'open action fields are persisted'
);

SELECT throws_ok(
  $$SELECT public.update_request_with_action(
    '31000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    'Ne pas conserver', true, NULL, false,
    'en_attente', false, 'devis', false, '', true,
    NULL, false
  )$$,
  '23514',
  'new row for relation "request_actions" violates check constraint "request_actions_label_check"',
  'invalid action update rolls back its request update'
);
SELECT is(
  (SELECT title FROM public.requests WHERE id = '31000000-0000-4000-8000-000000000001'),
  'Demande modifiée',
  'failed action update does not partially change the request'
);
SELECT is(
  (SELECT label FROM public.request_actions WHERE id = '41000000-0000-4000-8000-000000000001'),
  'Envoyer le devis',
  'failed action update preserves the open action'
);

SELECT * FROM finish();
ROLLBACK;
