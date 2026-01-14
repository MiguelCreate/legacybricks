-- Uitbreiding Gedeelde Vastgoedinvestering met Strategie Scenario's
-- Voeg extra velden toe aan shared_investments en nieuwe scenario tabel

-- Update shared_investments tabel met extra financiële velden
ALTER TABLE public.shared_investments
ADD COLUMN IF NOT EXISTS notaris_kosten DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS inrichting_kosten DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hypotheek_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hypotheek_rente DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hypotheek_looptijd_jaren INTEGER DEFAULT 30;

-- Nieuwe tabel voor scenario's (3 strategieën)
CREATE TABLE IF NOT EXISTS public.investment_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_investment_id UUID REFERENCES public.shared_investments(id) ON DELETE CASCADE NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('langdurig', 'shortstay', 'verkopen')),
  
  -- Langdurig verhuren
  maand_huur_langdurig DECIMAL(10,2) DEFAULT 0,
  bezetting_langdurig DECIMAL(5,2) DEFAULT 100,
  opex_jaar_langdurig DECIMAL(10,2) DEFAULT 0,
  
  -- Short-stay
  adr_shortstay DECIMAL(10,2) DEFAULT 0,
  bezetting_shortstay DECIMAL(5,2) DEFAULT 70,
  opex_jaar_shortstay DECIMAL(10,2) DEFAULT 0,
  extra_kosten_shortstay DECIMAL(10,2) DEFAULT 0,
  
  -- Verkopen
  verkoopwaarde DECIMAL(12,2) DEFAULT 0,
  verkoopkosten_percentage DECIMAL(5,2) DEFAULT 5,
  
  -- Metadata
  actief BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Unieke constraint: 1 scenario per type per investment
  UNIQUE(shared_investment_id, scenario_type)
);

-- Enable Row Level Security
ALTER TABLE public.investment_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies voor investment_scenarios (via shared_investments)
DROP POLICY IF EXISTS "Users can view scenarios of own investments" ON public.investment_scenarios;
CREATE POLICY "Users can view scenarios of own investments" ON public.investment_scenarios 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert scenarios for own investments" ON public.investment_scenarios;
CREATE POLICY "Users can insert scenarios for own investments" ON public.investment_scenarios 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update scenarios of own investments" ON public.investment_scenarios;
CREATE POLICY "Users can update scenarios of own investments" ON public.investment_scenarios 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete scenarios of own investments" ON public.investment_scenarios;
CREATE POLICY "Users can delete scenarios of own investments" ON public.investment_scenarios 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

-- Comments voor documentatie
COMMENT ON TABLE public.investment_scenarios IS 'Strategie scenarios voor gedeelde investeringen: langdurig, shortstay, of direct verkopen';
COMMENT ON COLUMN public.shared_investments.hypotheek_percentage IS 'Percentage van totaal dat gefinancierd wordt (bijv. 75 = 75%)';
COMMENT ON COLUMN public.investment_scenarios.scenario_type IS 'Type strategie: langdurig, shortstay, of verkopen';

-- Success message
SELECT '✅ Strategie scenario''s toegevoegd aan Gedeelde Investeringen!' as status;
