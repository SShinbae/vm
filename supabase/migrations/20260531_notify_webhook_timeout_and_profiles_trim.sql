-- ============================================================================
-- Task A: 10s timeout on notify_webhook so net._http_response captures 200
--         (pg_net default 1s was shorter than Netlify function processing,
--          leaving status_code NULL even on success).
-- Task B: Trim known-bad profile row + BEFORE INSERT/UPDATE trim trigger
--         on public.profiles to prevent recurrence.
-- ============================================================================

-- ---------- Task A ----------
CREATE OR REPLACE FUNCTION public.notify_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payload     jsonb;
  v_secret    text;
  webhook_url text := 'https://vm.wanahnaf.dev/.netlify/functions/send-push-notification';
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'webhook_secret'
  LIMIT 1;

  payload := jsonb_build_object(
    'type',       TG_OP,
    'table',      TG_TABLE_NAME,
    'schema',     TG_TABLE_SCHEMA,
    'record',     CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_secret
               ),
    body    := payload,
    timeout_milliseconds := 10000
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_webhook() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_webhook() FROM anon, authenticated;

-- ---------- Task B ----------
UPDATE public.profiles
SET full_name = btrim(full_name)
WHERE id = 'b28c4f89-b368-487a-8dad-0fbae293dc9e'
  AND full_name <> btrim(full_name);

CREATE OR REPLACE FUNCTION public.trim_profile_strings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.full_name IS NOT NULL THEN NEW.full_name := btrim(NEW.full_name); END IF;
  IF NEW.username  IS NOT NULL THEN NEW.username  := btrim(NEW.username);  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_trim_strings ON public.profiles;
CREATE TRIGGER profiles_trim_strings
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trim_profile_strings();
