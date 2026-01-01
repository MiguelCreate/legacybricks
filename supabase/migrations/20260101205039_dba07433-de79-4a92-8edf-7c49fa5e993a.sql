-- Extend goals table with new fields for comprehensive wealth planning
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS doel_type text DEFAULT 'overig',
ADD COLUMN IF NOT EXISTS categorie text DEFAULT 'persoonlijk',
ADD COLUMN IF NOT EXISTS start_datum date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS eind_datum date,
ADD COLUMN IF NOT EXISTS prioriteit text DEFAULT 'middel',
ADD COLUMN IF NOT EXISTS flexibiliteit text DEFAULT 'adaptief',
ADD COLUMN IF NOT EXISTS maandelijkse_inleg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS notities text,
ADD COLUMN IF NOT EXISTS gepauzeerd boolean DEFAULT false;

-- Create a junction table for multiple property sources per goal
CREATE TABLE IF NOT EXISTS public.goal_bronnen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  percentage_bijdrage numeric DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on goal_bronnen
ALTER TABLE public.goal_bronnen ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_bronnen (via goals which has user_id)
CREATE POLICY "Users can view own goal_bronnen"
ON public.goal_bronnen
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.goals
  WHERE goals.id = goal_bronnen.goal_id AND goals.user_id = auth.uid()
));

CREATE POLICY "Users can insert own goal_bronnen"
ON public.goal_bronnen
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.goals
  WHERE goals.id = goal_bronnen.goal_id AND goals.user_id = auth.uid()
));

CREATE POLICY "Users can update own goal_bronnen"
ON public.goal_bronnen
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.goals
  WHERE goals.id = goal_bronnen.goal_id AND goals.user_id = auth.uid()
));

CREATE POLICY "Users can delete own goal_bronnen"
ON public.goal_bronnen
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.goals
  WHERE goals.id = goal_bronnen.goal_id AND goals.user_id = auth.uid()
));