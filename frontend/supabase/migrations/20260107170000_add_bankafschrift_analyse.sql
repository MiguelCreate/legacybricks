-- Bankafschrift Analyse Module
-- Voor het categoriseren van maandelijkse transacties met AI-assistentie

-- Hoofdtabel: Maandelijkse transacties per pand
CREATE TABLE IF NOT EXISTS public.maandelijkse_transacties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  maand DATE NOT NULL, -- Eerste dag van de maand
  
  -- Inkomsten
  huur_inkomsten DECIMAL(10,2) DEFAULT 0,
  
  -- Uitgaven - Hypotheek
  hypotheek_aflossing DECIMAL(10,2) DEFAULT 0,
  hypotheek_rente DECIMAL(10,2) DEFAULT 0,
  
  -- Uitgaven - Belastingen
  imi_belasting DECIMAL(10,2) DEFAULT 0,
  
  -- Uitgaven - Operationeel
  onderhoud DECIMAL(10,2) DEFAULT 0,
  utilities DECIMAL(10,2) DEFAULT 0,
  verzekering DECIMAL(10,2) DEFAULT 0,
  
  -- Overig
  overig DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  notities TEXT,
  ai_analyse_gebruikt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Unieke constraint: 1 record per pand per maand
  UNIQUE(property_id, maand)
);

-- Enable Row Level Security
ALTER TABLE public.maandelijkse_transacties ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own transacties" ON public.maandelijkse_transacties;
CREATE POLICY "Users can view own transacties" ON public.maandelijkse_transacties 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transacties" ON public.maandelijkse_transacties;
CREATE POLICY "Users can insert own transacties" ON public.maandelijkse_transacties 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transacties" ON public.maandelijkse_transacties;
CREATE POLICY "Users can update own transacties" ON public.maandelijkse_transacties 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transacties" ON public.maandelijkse_transacties;
CREATE POLICY "Users can delete own transacties" ON public.maandelijkse_transacties 
  FOR DELETE USING (auth.uid() = user_id);

-- Index voor betere performance
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_user_id ON public.maandelijkse_transacties(user_id);
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_property_id ON public.maandelijkse_transacties(property_id);
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_maand ON public.maandelijkse_transacties(maand);

-- Comments
COMMENT ON TABLE public.maandelijkse_transacties IS 'Maandelijkse transacties per pand, gecategoriseerd met AI-assistentie';
COMMENT ON COLUMN public.maandelijkse_transacties.maand IS 'Eerste dag van de maand (bijv. 2026-05-01)';
COMMENT ON COLUMN public.maandelijkse_transacties.ai_analyse_gebruikt IS 'Geeft aan of AI (zoals Qwen) is gebruikt voor categorisatie';

-- Success message
SELECT '✅ Bankafschrift analyse module database setup compleet!' as status;
