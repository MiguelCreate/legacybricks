-- Add utility costs columns to properties table for water/gas/electricity tracking
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS water_maandelijks numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gas_maandelijks numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS elektriciteit_maandelijks numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS condominium_maandelijks numeric DEFAULT 0;