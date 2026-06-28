-- Permite embarcaciones de auxilio sin patrón asignado (desasignación desde CRM)
ALTER TABLE public.driver_vehicles
  ALTER COLUMN driver_id DROP NOT NULL;
