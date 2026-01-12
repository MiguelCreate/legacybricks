-- Add unit_naam column to tenants table for naming units separately from tenant names
ALTER TABLE public.tenants ADD COLUMN unit_naam text;