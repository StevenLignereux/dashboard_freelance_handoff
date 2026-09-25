CREATE OR REPLACE FUNCTION public.sync_request_active_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.is_active := NOT NEW.archived
    AND NEW.status NOT IN (
      'sans_suite'::public.request_status,
      'terminee'::public.request_status
    );
  RETURN NEW;
END;
$$;

UPDATE public.requests
SET is_active = NOT archived
  AND status NOT IN (
    'sans_suite'::public.request_status,
    'terminee'::public.request_status
  )
WHERE is_active IS DISTINCT FROM (
  NOT archived
  AND status NOT IN (
    'sans_suite'::public.request_status,
    'terminee'::public.request_status
  )
);

DROP TRIGGER IF EXISTS requests_sync_active_state ON public.requests;
CREATE TRIGGER requests_sync_active_state
  BEFORE INSERT OR UPDATE OF status, archived ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_request_active_state();

CREATE OR REPLACE FUNCTION public.create_mission_with_lifecycle(
  p_request_id uuid,
  p_contact_id uuid,
  p_title text,
  p_status public.mission_status,
  p_progress integer,
  p_notes text
)
RETURNS public.missions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_request public.requests%ROWTYPE;
  v_contact public.contacts%ROWTYPE;
  v_mission public.missions%ROWTYPE;
  v_prior_mission_count bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a mission.'
      USING ERRCODE = '42501';
  END IF;

  SELECT r.* INTO v_request
  FROM public.requests AS r
  WHERE r.id = p_request_id
    AND r.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request % not found.', p_request_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT c.* INTO v_contact
  FROM public.contacts AS c
  WHERE c.id = v_request.contact_id
    AND c.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact for request % not found.', p_request_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_request.contact_id IS DISTINCT FROM p_contact_id THEN
    RAISE EXCEPTION 'Request % does not belong to contact %.', p_request_id, p_contact_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_request.archived OR v_request.status IN (
    'terminee'::public.request_status,
    'sans_suite'::public.request_status
  ) THEN
    RAISE EXCEPTION 'Cannot create a mission for a closed or archived request.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_prior_mission_count
  FROM public.missions AS m
  JOIN public.requests AS r ON r.id = m.request_id AND r.user_id = m.user_id
  WHERE r.contact_id = v_request.contact_id
    AND r.user_id = auth.uid();

  INSERT INTO public.missions (
    user_id, request_id, title, status, start_date, progress, notes
  ) VALUES (
    auth.uid(), p_request_id, p_title, p_status, current_date, p_progress, p_notes
  )
  RETURNING * INTO v_mission;

  UPDATE public.requests
  SET status = 'mission_confirmee'::public.request_status
  WHERE id = p_request_id AND user_id = auth.uid();

  UPDATE public.contacts
  SET relationship = CASE
    WHEN relationship = 'prospect'::public.relationship_type
      AND v_prior_mission_count = 0
      THEN 'client'::public.relationship_type
    WHEN relationship = 'prospect'::public.relationship_type
      AND v_prior_mission_count > 0
      THEN 'client_recurrent'::public.relationship_type
    WHEN relationship = 'ancien_client'::public.relationship_type
      OR (
        relationship = 'client'::public.relationship_type
        AND v_prior_mission_count > 0
      ) THEN 'client_recurrent'::public.relationship_type
    ELSE relationship
  END
  WHERE id = v_request.contact_id AND user_id = auth.uid();

  RETURN v_mission;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_mission_with_lifecycle(
  p_mission_id uuid,
  p_title text,
  p_update_title boolean,
  p_status public.mission_status,
  p_update_status boolean,
  p_progress integer,
  p_update_progress boolean,
  p_notes text,
  p_update_notes boolean
)
RETURNS public.missions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_request public.requests%ROWTYPE;
  v_existing public.missions%ROWTYPE;
  v_updated public.missions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update a mission.'
      USING ERRCODE = '42501';
  END IF;

  SELECT r.* INTO v_request
  FROM public.requests AS r
  JOIN public.missions AS m ON m.request_id = r.id AND m.user_id = r.user_id
  WHERE m.id = p_mission_id
    AND r.user_id = auth.uid()
  FOR UPDATE OF r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission % not found.', p_mission_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT m.* INTO v_existing
  FROM public.missions AS m
  WHERE m.id = p_mission_id
    AND m.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission % not found.', p_mission_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.missions
  SET title = CASE WHEN p_update_title THEN p_title ELSE title END,
      status = CASE WHEN p_update_status THEN p_status ELSE status END,
      progress = CASE WHEN p_update_progress THEN p_progress ELSE progress END,
      notes = CASE WHEN p_update_notes THEN p_notes ELSE notes END
  WHERE id = p_mission_id AND user_id = auth.uid()
  RETURNING * INTO v_updated;

  IF p_update_status
    AND p_status = 'terminee'::public.mission_status
    AND v_existing.status <> 'terminee'::public.mission_status
    AND NOT EXISTS (
      SELECT 1 FROM public.missions AS open_mission
      WHERE open_mission.request_id = v_existing.request_id
        AND open_mission.user_id = auth.uid()
        AND open_mission.status <> 'terminee'::public.mission_status
    ) THEN
    UPDATE public.requests
    SET status = 'terminee'::public.request_status
    WHERE id = v_existing.request_id AND user_id = auth.uid();
  END IF;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_request_active_state() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_mission_with_lifecycle(uuid, uuid, text, public.mission_status, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_mission_with_lifecycle(uuid, text, boolean, public.mission_status, boolean, integer, boolean, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_mission_with_lifecycle(uuid, uuid, text, public.mission_status, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mission_with_lifecycle(uuid, text, boolean, public.mission_status, boolean, integer, boolean, text, boolean) TO authenticated;
