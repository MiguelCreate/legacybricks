-- Add co_pilot_standaard column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS co_pilot_standaard boolean DEFAULT true;