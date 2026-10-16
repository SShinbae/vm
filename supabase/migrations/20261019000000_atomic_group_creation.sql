CREATE OR REPLACE FUNCTION public.create_group_with_owner(
  p_name text,
  p_description text DEFAULT NULL
)
RETURNS SETOF public.groups
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_group public.groups;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Group name is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.groups (name, description, owner_id)
  VALUES (btrim(p_name), NULLIF(btrim(p_description), ''), v_user_id)
  RETURNING * INTO v_group;

  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group.id, v_user_id);

  RETURN NEXT v_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group_with_owner(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_with_owner(text, text) TO authenticated;
