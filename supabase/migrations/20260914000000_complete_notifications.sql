-- Mileage-based service reminders.
ALTER TABLE public.service_logs
  ADD COLUMN IF NOT EXISTS next_service_mileage integer;

ALTER TABLE public.service_logs
  DROP CONSTRAINT IF EXISTS service_logs_next_service_mileage_check;

ALTER TABLE public.service_logs
  ADD CONSTRAINT service_logs_next_service_mileage_check
  CHECK (
    next_service_mileage IS NULL
    OR next_service_mileage > odometer_reading
  );

-- Keep the vehicle odometer useful for mileage reminders.
UPDATE public.vehicles AS vehicle
SET current_mileage = GREATEST(
  COALESCE(vehicle.current_mileage, 0),
  COALESCE((
    SELECT MAX(reading)
    FROM (
      SELECT odometer_reading AS reading FROM public.mileage_logs WHERE vehicle_id = vehicle.id
      UNION ALL
      SELECT odometer_reading FROM public.fuel_logs WHERE vehicle_id = vehicle.id
      UNION ALL
      SELECT odometer_reading FROM public.service_logs WHERE vehicle_id = vehicle.id
    ) AS readings
  ), 0)
);

CREATE OR REPLACE FUNCTION public.advance_vehicle_mileage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.vehicles
  SET current_mileage = GREATEST(COALESCE(current_mileage, 0), NEW.odometer_reading)
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_mileage_log ON public.mileage_logs;
CREATE TRIGGER advance_vehicle_mileage_from_mileage_log
  AFTER INSERT OR UPDATE ON public.mileage_logs
  FOR EACH ROW EXECUTE FUNCTION public.advance_vehicle_mileage();

DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_fuel_log ON public.fuel_logs;
CREATE TRIGGER advance_vehicle_mileage_from_fuel_log
  AFTER INSERT OR UPDATE ON public.fuel_logs
  FOR EACH ROW EXECUTE FUNCTION public.advance_vehicle_mileage();

DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_service_log ON public.service_logs;
CREATE TRIGGER advance_vehicle_mileage_from_service_log
  AFTER INSERT OR UPDATE ON public.service_logs
  FOR EACH ROW EXECUTE FUNCTION public.advance_vehicle_mileage();

-- Replace legacy per-event webhooks with one trigger per source table.
DROP TRIGGER IF EXISTS fuel_logs ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_insert ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_update ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_delete ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_insert_webhook ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_update_webhook ON public.fuel_logs;
DROP TRIGGER IF EXISTS fuel_logs_delete_webhook ON public.fuel_logs;

DROP TRIGGER IF EXISTS mileage_logs ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_insert ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_update ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_delete ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_insert_webhook ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_update_webhook ON public.mileage_logs;
DROP TRIGGER IF EXISTS mileage_logs_delete_webhook ON public.mileage_logs;

DROP TRIGGER IF EXISTS service_logs ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_insert ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_update ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_delete ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_insert_webhook ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_update_webhook ON public.service_logs;
DROP TRIGGER IF EXISTS service_logs_delete_webhook ON public.service_logs;

DROP TRIGGER IF EXISTS group_members ON public.group_members;
DROP TRIGGER IF EXISTS group_members_insert ON public.group_members;
DROP TRIGGER IF EXISTS group_members_delete ON public.group_members;
DROP TRIGGER IF EXISTS group_members_insert_webhook ON public.group_members;
DROP TRIGGER IF EXISTS group_members_delete_webhook ON public.group_members;

DROP TRIGGER IF EXISTS group_invitations ON public.group_invitations;
DROP TRIGGER IF EXISTS group_invitations_insert ON public.group_invitations;
DROP TRIGGER IF EXISTS group_invitations_insert_webhook ON public.group_invitations;

DROP TRIGGER IF EXISTS notifications_fuel_logs_webhook ON public.fuel_logs;
CREATE TRIGGER notifications_fuel_logs_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.fuel_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_webhook();

DROP TRIGGER IF EXISTS notifications_mileage_logs_webhook ON public.mileage_logs;
CREATE TRIGGER notifications_mileage_logs_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.mileage_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_webhook();

DROP TRIGGER IF EXISTS notifications_service_logs_webhook ON public.service_logs;
CREATE TRIGGER notifications_service_logs_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.service_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_webhook();

DROP TRIGGER IF EXISTS notifications_group_members_webhook ON public.group_members;
CREATE TRIGGER notifications_group_members_webhook
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_webhook();

DROP TRIGGER IF EXISTS notifications_group_invitations_webhook ON public.group_invitations;
CREATE TRIGGER notifications_group_invitations_webhook
  AFTER INSERT ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION public.notify_webhook();
