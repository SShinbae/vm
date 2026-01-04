-- Fix webhook triggers to include payload data
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Enable pg_net extension (for HTTP requests)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- STEP 2: Drop ALL existing webhook triggers
-- ============================================

-- Drop old triggers (named same as table - from Supabase Dashboard webhooks)
DROP TRIGGER IF EXISTS fuel_logs ON public.fuel_logs;
DROP TRIGGER IF EXISTS mileage_logs ON public.mileage_logs;
DROP TRIGGER IF EXISTS service_logs ON public.service_logs;
DROP TRIGGER IF EXISTS group_members ON public.group_members;
DROP TRIGGER IF EXISTS group_invitations ON public.group_invitations;

-- Drop any new triggers we might have created
DROP TRIGGER IF EXISTS fuel_logs_insert_webhook ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_update_webhook ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_delete_webhook ON public.fuel_logs;
DROP TRIGGER IF EXISTS mileage_logs_insert_webhook ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_update_webhook ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_delete_webhook ON public.mileage_logs;
DROP TRIGGER IF EXISTS service_logs_insert_webhook ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_update_webhook ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_delete_webhook ON public.service_logs;
DROP TRIGGER IF EXISTS group_members_insert_webhook ON public.group_members;
DROP TRIGGER IF EXISTS group_members_delete_webhook ON public.group_members;
DROP TRIGGER IF EXISTS group_invitations_insert_webhook ON public.group_invitations;

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.notify_webhook();

-- ============================================
-- STEP 3: Create webhook function using pg_net
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  webhook_url TEXT := 'https://vm.wanahnaf.dev/.netlify/functions/send-push-notification';
BEGIN
  -- Build the payload based on operation type
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  -- Send the webhook using pg_net
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::jsonb
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create triggers for fuel_logs
-- ============================================

CREATE TRIGGER fuel_logs_insert
  AFTER INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER fuel_logs_update
  AFTER UPDATE ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER fuel_logs_delete
  AFTER DELETE ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

-- ============================================
-- STEP 5: Create triggers for mileage_logs
-- ============================================

CREATE TRIGGER mileage_logs_insert
  AFTER INSERT ON mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER mileage_logs_update
  AFTER UPDATE ON mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER mileage_logs_delete
  AFTER DELETE ON mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

-- ============================================
-- STEP 6: Create triggers for service_logs
-- ============================================

CREATE TRIGGER service_logs_insert
  AFTER INSERT ON service_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER service_logs_update
  AFTER UPDATE ON service_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER service_logs_delete
  AFTER DELETE ON service_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

-- ============================================
-- STEP 7: Create triggers for group_members
-- ============================================

CREATE TRIGGER group_members_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

CREATE TRIGGER group_members_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

-- ============================================
-- STEP 8: Create triggers for group_invitations
-- ============================================

CREATE TRIGGER group_invitations_insert
  AFTER INSERT ON group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook();

-- ============================================
-- DONE! Test by creating a log entry
-- ============================================
