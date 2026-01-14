-- Gedeelde Vastgoedinvestering Module
-- Tabellen voor co-investment/gedeelde panden

-- Hoofdtabel: Gedeelde investeringen/panden
CREATE TABLE IF NOT EXISTS public.shared_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Eigenaar/creator van deze gedeelde investering
  naam TEXT NOT NULL,
  aankoopprijs DECIMAL(12,2) NOT NULL CHECK (aankoopprijs > 0),
  renovatie_kosten DECIMAL(12,2) DEFAULT 0,
  imt DECIMAL(12,2) DEFAULT 0,
  maand_huur DECIMAL(10,2) NOT NULL CHECK (maand_huur > 0),
  jaarlijkse_opex DECIMAL(10,2) DEFAULT 0,
  verkoopwaarde_10j DECIMAL(12,2) NOT NULL CHECK (verkoopwaarde_10j > 0),
  indexatie_percentage DECIMAL(5,2) DEFAULT 2.0,
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Partners/Investeerders tabel
CREATE TABLE IF NOT EXISTS public.investment_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_investment_id UUID REFERENCES public.shared_investments(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  eigen_hypotheek_bedrag DECIMAL(12,2) DEFAULT 0,
  rente_percentage DECIMAL(5,2) DEFAULT 0,
  looptijd_jaren INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.shared_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_partners ENABLE ROW LEVEL SECURITY;

-- Policies voor shared_investments
DROP POLICY IF EXISTS "Users can view own shared investments" ON public.shared_investments;
CREATE POLICY "Users can view own shared investments" ON public.shared_investments 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shared investments" ON public.shared_investments;
CREATE POLICY "Users can insert own shared investments" ON public.shared_investments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shared investments" ON public.shared_investments;
CREATE POLICY "Users can update own shared investments" ON public.shared_investments 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shared investments" ON public.shared_investments;
CREATE POLICY "Users can delete own shared investments" ON public.shared_investments 
  FOR DELETE USING (auth.uid() = user_id);

-- Policies voor investment_partners (via shared_investments)
DROP POLICY IF EXISTS "Users can view partners of own investments" ON public.investment_partners;
CREATE POLICY "Users can view partners of own investments" ON public.investment_partners 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert partners for own investments" ON public.investment_partners;
CREATE POLICY "Users can insert partners for own investments" ON public.investment_partners 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update partners of own investments" ON public.investment_partners;
CREATE POLICY "Users can update partners of own investments" ON public.investment_partners 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete partners of own investments" ON public.investment_partners;
CREATE POLICY "Users can delete partners of own investments" ON public.investment_partners 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shared_investments 
      WHERE id = shared_investment_id AND user_id = auth.uid()
    )
  );

-- Success message
COMMENT ON TABLE public.shared_investments IS 'Gedeelde vastgoedinvesteringen - voor co-investment scenarios';
COMMENT ON TABLE public.investment_partners IS 'Partners/investeerders per gedeelde investering';
