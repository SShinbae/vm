-- Lets a signed-in device claim its Expo push token, even when the token row
-- currently belongs to another account (same phone, different user). RLS would
-- block that UPDATE, so this runs as SECURITY DEFINER and pins user_id to the caller.
CREATE OR REPLACE FUNCTION public.register_push_token(p_token text, p_device_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_token IS NULL OR p_token !~ '^Expo(nent)?PushToken\[.+\]$' THEN
    RAISE EXCEPTION 'invalid push token' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.push_tokens (user_id, token, device_type)
  VALUES (auth.uid(), p_token, p_device_type)
  ON CONFLICT (token) DO UPDATE
    SET user_id = auth.uid(),
        device_type = EXCLUDED.device_type,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.register_push_token(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_token(text, text) TO authenticated;
