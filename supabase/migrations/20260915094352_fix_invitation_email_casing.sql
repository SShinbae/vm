-- Fix group-invitation accept failures caused by email-casing mismatches.
--
-- Invitation emails are stored lowercased (client lowercases on insert), but
-- profiles.email was stored as-typed via handle_new_user. RLS on
-- group_invitations compares email = profiles.email (raw), so any profile with
-- uppercase in its email could not SELECT/UPDATE its own invitation, surfacing
-- as "Invitation not found or already processed" on accept.
--
-- Normalize at the source (profiles) and make invitation email comparisons
-- case-insensitive everywhere.

-- 1. Store new profile emails lowercased.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, lower(NEW.email), NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$;

-- 2. Backfill existing rows.
UPDATE public.profiles
SET email = lower(email)
WHERE email <> lower(email);

-- 3. Case-insensitive invitation RLS (belt-and-suspenders alongside the backfill).
DROP POLICY IF EXISTS "Invited users can view invitations" ON public.group_invitations;
CREATE POLICY "Invited users can view invitations"
ON public.group_invitations
FOR SELECT
USING (
  lower(email) = (SELECT lower(p.email) FROM public.profiles p WHERE p.id = auth.uid())
  OR group_id IN (SELECT g.id FROM public.groups g WHERE g.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Invited users can update invitations" ON public.group_invitations;
CREATE POLICY "Invited users can update invitations"
ON public.group_invitations
FOR UPDATE
USING (
  lower(email) = (SELECT lower(p.email) FROM public.profiles p WHERE p.id = auth.uid())
);

-- 4. Case-insensitive invitation lookup RPC.
CREATE OR REPLACE FUNCTION public.get_user_invitations_with_details(user_email text)
RETURNS TABLE(
  invitation_id uuid,
  group_id uuid,
  group_name text,
  group_description text,
  invited_by_id uuid,
  invited_by_name text,
  invited_by_email text,
  status public.invitation_status,
  created_at timestamp with time zone,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id AS invitation_id,
        gi.group_id,
        g.name AS group_name,
        g.description AS group_description,
        gi.invited_by AS invited_by_id,
        p.full_name AS invited_by_name,
        p.email AS invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE lower(gi.email) = lower(user_email)
    ORDER BY gi.created_at DESC;
END;
$$;
