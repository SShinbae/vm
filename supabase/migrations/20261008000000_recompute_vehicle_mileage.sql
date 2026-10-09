-- vehicles.current_mileage was only ever raised (GREATEST on INSERT/UPDATE), so
-- deleting or correcting a log never lowered it. Recompute it from the logs on
-- every insert, update and delete instead.

CREATE OR REPLACE FUNCTION public.recompute_vehicle_mileage_for(p_vehicle_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.vehicles
  SET current_mileage = (
    SELECT max(reading) FROM (
      SELECT odometer_reading AS reading FROM public.fuel_logs WHERE vehicle_id = p_vehicle_id
      UNION ALL
      SELECT odometer_reading FROM public.mileage_logs WHERE vehicle_id = p_vehicle_id
      UNION ALL
      SELECT odometer_reading FROM public.service_logs WHERE vehicle_id = p_vehicle_id
    ) AS readings
  )
  WHERE id = p_vehicle_id;
$$;

CREATE OR REPLACE FUNCTION public.recompute_vehicle_mileage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recompute_vehicle_mileage_for(NEW.vehicle_id);
  END IF;
  -- Deletes, and updates that moved the log to another vehicle.
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id) THEN
    PERFORM public.recompute_vehicle_mileage_for(OLD.vehicle_id);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_vehicle_mileage_for(uuid) FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_fuel_log ON public.fuel_logs;
DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_mileage_log ON public.mileage_logs;
DROP TRIGGER IF EXISTS advance_vehicle_mileage_from_service_log ON public.service_logs;
DROP FUNCTION IF EXISTS public.advance_vehicle_mileage();

DROP TRIGGER IF EXISTS recompute_vehicle_mileage_from_fuel_log ON public.fuel_logs;
CREATE TRIGGER recompute_vehicle_mileage_from_fuel_log
  AFTER INSERT OR UPDATE OR DELETE ON public.fuel_logs
  FOR EACH ROW EXECUTE FUNCTION public.recompute_vehicle_mileage();

DROP TRIGGER IF EXISTS recompute_vehicle_mileage_from_mileage_log ON public.mileage_logs;
CREATE TRIGGER recompute_vehicle_mileage_from_mileage_log
  AFTER INSERT OR UPDATE OR DELETE ON public.mileage_logs
  FOR EACH ROW EXECUTE FUNCTION public.recompute_vehicle_mileage();

DROP TRIGGER IF EXISTS recompute_vehicle_mileage_from_service_log ON public.service_logs;
CREATE TRIGGER recompute_vehicle_mileage_from_service_log
  AFTER INSERT OR UPDATE OR DELETE ON public.service_logs
  FOR EACH ROW EXECUTE FUNCTION public.recompute_vehicle_mileage();

-- Backfill: correct vehicles that have logs. Vehicles with no logs keep their
-- stored value (it may have been set directly, e.g. seed data or older app
-- versions) instead of being wiped to NULL.
SELECT public.recompute_vehicle_mileage_for(v.id)
FROM public.vehicles v
WHERE EXISTS (SELECT 1 FROM public.fuel_logs f WHERE f.vehicle_id = v.id)
   OR EXISTS (SELECT 1 FROM public.mileage_logs m WHERE m.vehicle_id = v.id)
   OR EXISTS (SELECT 1 FROM public.service_logs s WHERE s.vehicle_id = v.id);
