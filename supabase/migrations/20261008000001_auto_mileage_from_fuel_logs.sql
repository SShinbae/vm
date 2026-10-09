-- The auto mileage log is derived from that day's fuel logs: it always holds
-- the highest remaining fuel reading, and disappears when the day has none.
-- The app no longer writes it; it treats source = 'fuel_log' rows as read-only.

ALTER TABLE public.mileage_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'fuel_log'));

UPDATE public.mileage_logs
SET source = 'fuel_log'
WHERE notes = 'Auto-created from fuel log' AND source = 'manual';

CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_date
  ON public.mileage_logs (vehicle_id, date);

CREATE OR REPLACE FUNCTION public.sync_auto_mileage_log(p_vehicle_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max integer;
  v_user uuid;
BEGIN
  SELECT odometer_reading, user_id INTO v_max, v_user
  FROM public.fuel_logs
  WHERE vehicle_id = p_vehicle_id AND date = p_date
  ORDER BY odometer_reading DESC, created_at DESC
  LIMIT 1;

  IF v_max IS NULL THEN
    DELETE FROM public.mileage_logs
    WHERE vehicle_id = p_vehicle_id AND date = p_date AND source = 'fuel_log';
    RETURN;
  END IF;

  UPDATE public.mileage_logs
  SET odometer_reading = v_max
  WHERE vehicle_id = p_vehicle_id AND date = p_date AND source = 'fuel_log'
    AND odometer_reading IS DISTINCT FROM v_max;

  -- Create one only if the day has neither an auto log nor a manual log.
  IF NOT EXISTS (
    SELECT 1 FROM public.mileage_logs
    WHERE vehicle_id = p_vehicle_id AND date = p_date
  ) THEN
    INSERT INTO public.mileage_logs (vehicle_id, user_id, date, odometer_reading, notes, source)
    VALUES (p_vehicle_id, v_user, p_date, v_max, 'Auto-created from fuel log', 'fuel_log');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_auto_mileage_from_fuel_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.sync_auto_mileage_log(NEW.vehicle_id, NEW.date);
  END IF;
  -- Deletes, and updates that moved the log to another vehicle or day.
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id
                               OR OLD.date IS DISTINCT FROM NEW.date)) THEN
    PERFORM public.sync_auto_mileage_log(OLD.vehicle_id, OLD.date);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_auto_mileage_log(uuid, date) FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_auto_mileage_from_fuel_log ON public.fuel_logs;
CREATE TRIGGER sync_auto_mileage_from_fuel_log
  AFTER INSERT OR UPDATE OR DELETE ON public.fuel_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_auto_mileage_from_fuel_log();

-- Backfill: bring every day that has fuel logs into line.
SELECT public.sync_auto_mileage_log(d.vehicle_id, d.date)
FROM (SELECT DISTINCT vehicle_id, date FROM public.fuel_logs) AS d;
