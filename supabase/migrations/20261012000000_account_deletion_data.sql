-- Account deletion, part 1 (data safety). See
-- docs/superpowers/specs/2026-10-11-account-deletion-design.md section 4.

-- 1. Logs a deleted user added to other people's vehicles stay, anonymised.
ALTER TABLE public.fuel_logs    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.mileage_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.service_logs ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.fuel_logs DROP CONSTRAINT fuel_logs_user_id_fkey,
  ADD CONSTRAINT fuel_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.mileage_logs DROP CONSTRAINT mileage_logs_user_id_fkey,
  ADD CONSTRAINT mileage_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.service_logs DROP CONSTRAINT service_logs_user_id_fkey,
  ADD CONSTRAINT service_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Pending deletion: NULL = active; timestamp = purge on/after this time.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

-- 3. Purge transactions set app.bulk_purge = 'on'; webhook triggers skip then.
--    Trigger names differ between environments (production has per-operation
--    triggers, local has combined ones), so rewrite every trigger that calls
--    notify_webhook() on the affected tables, keeping its events. Never
--    redefine notify_webhook() itself: its URL is environment-specific.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tg.tgname, tg.tgrelid::regclass AS rel, pg_get_triggerdef(tg.oid) AS d
    FROM pg_trigger tg
    WHERE NOT tg.tgisinternal
      AND tg.tgfoid = 'public.notify_webhook'::regproc
      AND tg.tgrelid IN ('public.fuel_logs'::regclass, 'public.mileage_logs'::regclass,
                         'public.service_logs'::regclass, 'public.group_members'::regclass)
  LOOP
    IF position('WHEN (' IN t.d) > 0 THEN CONTINUE; END IF;  -- already guarded
    EXECUTE format('DROP TRIGGER %I ON %s', t.tgname, t.rel);
    EXECUTE replace(t.d, 'FOR EACH ROW EXECUTE',
      'FOR EACH ROW WHEN (current_setting(''app.bulk_purge'', true) IS DISTINCT FROM ''on'') EXECUTE');
  END LOOP;
END $$;

-- 4. Remove a user's own data ahead of auth.admin.deleteUser, without pushes.
CREATE OR REPLACE FUNCTION public.purge_account_data(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Lock the profile and re-check it is still due: a cancel that lands after
  -- the purge job read its list must win. account-deletion's cancel only
  -- clears a future date, so the two can't both succeed.
  PERFORM 1 FROM public.profiles
  WHERE id = p_user AND deletion_scheduled_at <= now()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account % is not due for deletion', p_user;
  END IF;

  PERFORM set_config('app.bulk_purge', 'on', true);

  DELETE FROM public.vehicles WHERE user_id = p_user;          -- cascades logs, shares, images
  UPDATE public.fuel_logs    SET user_id = NULL WHERE user_id = p_user;
  UPDATE public.mileage_logs SET user_id = NULL WHERE user_id = p_user;
  UPDATE public.service_logs SET user_id = NULL WHERE user_id = p_user;
  DELETE FROM public.group_members WHERE user_id = p_user;      -- no "left group" pushes

  PERFORM set_config('app.bulk_purge', 'off', true);
END;
$$;

-- 5. Every storage object the user owns, for removal through the Storage API.
--    Call after purge_account_data: receipts still attached to a surviving
--    (anonymised) service log on someone else's vehicle are kept, so that
--    vehicle's history stays complete.
CREATE OR REPLACE FUNCTION public.account_storage_objects(p_user uuid)
RETURNS TABLE (bucket_id text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.bucket_id, o.name
  FROM storage.objects o
  WHERE o.owner = p_user
    AND NOT (o.bucket_id = 'receipt-images' AND EXISTS (
      SELECT 1 FROM public.service_logs s
      WHERE s.receipt_image_url IS NOT NULL
        AND right(s.receipt_image_url, length(o.name)) = o.name));
$$;

REVOKE ALL ON FUNCTION public.purge_account_data(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.account_storage_objects(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_account_data(uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.account_storage_objects(uuid) TO service_role;

-- 6. Group ownership transfer (prerequisite for deletion).
--    transfer_group_ownership_admin takes an explicit "from" so the purge job
--    (service_role, no auth.uid()) can use it; the app calls the wrapper.
CREATE OR REPLACE FUNCTION public.transfer_group_ownership_admin(
  p_group uuid, p_from uuid, p_to uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text;
BEGIN
  IF p_to IS NOT DISTINCT FROM p_from THEN
    RAISE EXCEPTION 'new owner is already the owner';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.group_members
                 WHERE group_id = p_group AND user_id = p_to) THEN
    RAISE EXCEPTION 'new owner must be a group member';
  END IF;

  -- Owner check and swap in one statement: two concurrent transfers can't
  -- both succeed.
  UPDATE public.groups SET owner_id = p_to, updated_at = now()
  WHERE id = p_group AND owner_id = p_from
  RETURNING name INTO v_name;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not group owner';
  END IF;

  INSERT INTO public.notifications (user_id, notification_type, title, body, related_group_id, action_url)
  VALUES (p_to, 'group_member', 'You''re now the group owner',
          'You are now the owner of ' || v_name || '.', p_group, '/groups/' || p_group);
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_group_ownership(p_group uuid, p_new_owner uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.transfer_group_ownership_admin(p_group, auth.uid(), p_new_owner);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_group_ownership_admin(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_group_ownership_admin(uuid, uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.transfer_group_ownership(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, uuid) TO authenticated;
