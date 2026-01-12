-- Add new fields to profiles table for gamification and freedom dashboard
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS salaris_inleg_sneeuwbal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS overige_pot_sneeuwbal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS stilte_modus_aan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vrijheidskosten_maand numeric DEFAULT 2500,
ADD COLUMN IF NOT EXISTS erfgoed_level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS totaal_badges jsonb DEFAULT '[]'::jsonb;

-- Add new fields to properties table for visual storytelling
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS persoonlijke_quote text,
ADD COLUMN IF NOT EXISTS foto_url text;

-- Create milestones table for "Kalender van Klein Geluk"
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'aankoop_verjaardag', 'huurbetaling', 'doel_behaald', 'schuldenvrij'
  titel text NOT NULL,
  beschrijving text,
  datum date NOT NULL,
  celebrated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for milestones
CREATE POLICY "Users can view own milestones" 
ON public.milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" 
ON public.milestones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones" 
ON public.milestones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones" 
ON public.milestones 
FOR DELETE 
USING (auth.uid() = user_id);