CREATE OR REPLACE FUNCTION public.update_request_with_action(
  p_request_id uuid,
  p_action_id uuid,
  p_title text,
  p_update_title boolean,
  p_description text,
  p_update_description boolean,
  p_status public.request_status,
  p_update_status boolean,
  p_action_type public.request_action_type,
  p_update_action_type boolean,
  p_action_label text,
  p_update_action_label boolean,
  p_action_due_at timestamptz,
  p_update_action_due_at boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_request public.requests;
  v_action public.request_actions;
BEGIN
  SELECT r.* INTO v_request
  FROM public.requests AS r
  WHERE r.id = p_request_id
    AND r.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request % not found.', p_request_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT a.* INTO v_action
  FROM public.request_actions AS a
  WHERE a.id = p_action_id
    AND a.request_id = p_request_id
    AND a.user_id = auth.uid()
    AND a.completed_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Open action % for request % not found.', p_action_id, p_request_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.requests AS r
  SET title = CASE WHEN p_update_title THEN p_title ELSE r.title END,
      description = CASE WHEN p_update_description THEN p_description ELSE r.description END,
      status = CASE WHEN p_update_status THEN p_status ELSE r.status END
  WHERE r.id = p_request_id
    AND r.user_id = auth.uid()
  RETURNING r.* INTO v_request;

  UPDATE public.request_actions AS a
  SET type = CASE WHEN p_update_action_type THEN p_action_type ELSE a.type END,
      label = CASE WHEN p_update_action_label THEN p_action_label ELSE a.label END,
      due_at = CASE WHEN p_update_action_due_at THEN p_action_due_at ELSE a.due_at END
  WHERE a.id = p_action_id
    AND a.request_id = p_request_id
    AND a.user_id = auth.uid()
    AND a.completed_at IS NULL
  RETURNING a.* INTO v_action;

  RETURN jsonb_build_object(
    'request', to_jsonb(v_request),
    'action', to_jsonb(v_action)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_request_with_action(
  uuid, uuid, text, boolean, text, boolean, public.request_status, boolean,
  public.request_action_type, boolean, text, boolean, timestamptz, boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_request_with_action(
  uuid, uuid, text, boolean, text, boolean, public.request_status, boolean,
  public.request_action_type, boolean, text, boolean, timestamptz, boolean
) TO authenticated;
