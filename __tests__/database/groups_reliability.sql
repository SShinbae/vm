\set ON_ERROR_STOP on
BEGIN;

\ir ../../supabase/migrations/20261019000000_atomic_group_creation.sql

ALTER TABLE public.groups DISABLE TRIGGER USER;
ALTER TABLE public.group_members DISABLE TRIGGER USER;
ALTER TABLE public.group_invitations DISABLE TRIGGER USER;

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'groups-owner@example.test', '', now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'groups-member@example.test', '', now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'groups-outsider@example.test', '', now(), '{}', '{}')
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

DO $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT id INTO v_group_id
  FROM public.create_group_with_owner('atomic-success', 'created in one transaction');

  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = v_group_id AND owner_id = auth.uid()
  ) OR NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'group and owner membership were not both created';
  END IF;
END;
$$;

RESET ROLE;
CREATE FUNCTION public.test_fail_owner_membership() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.groups WHERE id = NEW.group_id AND name = 'atomic-rollback') THEN
    RAISE EXCEPTION 'forced membership failure';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER test_fail_owner_membership
BEFORE INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.test_fail_owner_membership();

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.create_group_with_owner('atomic-rollback', NULL);
    RAISE EXCEPTION 'expected owner membership insertion to fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'expected owner membership insertion to fail' THEN
      RAISE;
    END IF;
  END;

  IF EXISTS (SELECT 1 FROM public.groups WHERE name = 'atomic-rollback') THEN
    RAISE EXCEPTION 'group insert was not rolled back';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
INSERT INTO public.group_members (group_id, user_id)
SELECT id, auth.uid() FROM public.groups WHERE name = 'atomic-success';
DO $$
BEGIN
  BEGIN
    INSERT INTO public.group_invitations (group_id, email, invited_by, expires_at)
    SELECT id, 'member-invite@example.test', auth.uid(), now() + interval '7 days'
    FROM public.groups WHERE name = 'atomic-success';
    RAISE EXCEPTION 'group member unexpectedly inserted an invitation';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
DO $$
BEGIN
  BEGIN
    INSERT INTO public.group_invitations (group_id, email, invited_by, expires_at)
    SELECT id, 'outsider-invite@example.test', auth.uid(), now() + interval '7 days'
    FROM public.groups WHERE name = 'atomic-success';
    RAISE EXCEPTION 'outsider unexpectedly inserted an invitation';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

RESET ROLE;
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.create_group_with_owner(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anonymous users can execute group creation';
  END IF;
END;
$$;

ROLLBACK;
