-- ============================================================
-- LEGACYBRICKS - NIEUWE MODULES DATABASE MIGRATIE
-- ============================================================
-- Voer dit SQL-script uit in Supabase SQL Editor
-- https://supabase.com/dashboard -> SQL Editor -> New query
-- ============================================================

-- ============================================================
-- MODULE 1: HUURINDEXATIE
-- ============================================================
-- Voegt velden toe aan contracts tabel voor huurindexatie tracking

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS volgende_huurwijziging date,
ADD COLUMN IF NOT EXISTS nieuw_huurbedrag_na_wijziging numeric;

COMMENT ON COLUMN contracts.volgende_huurwijziging IS 'Datum waarop de volgende huurindexatie plaatsvindt';
COMMENT ON COLUMN contracts.nieuw_huurbedrag_na_wijziging IS 'Berekend nieuw huurbedrag na indexatie';

SELECT '✅ Module 1: Huurindexatie velden toegevoegd' as status;

-- ============================================================
-- MODULE 2: GEDEELDE VASTGOEDINVESTERINGEN
-- ============================================================
-- Tabellen voor co-investment/gedeelde panden

-- Hoofdtabel: Gedeelde investeringen/panden
CREATE TABLE IF NOT EXISTS public.shared_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  naam TEXT NOT NULL,
  aankoopprijs DECIMAL(12,2) NOT NULL CHECK (aankoopprijs > 0),
  renovatie_kosten DECIMAL(12,2) DEFAULT 0,
  imt DECIMAL(12,2) DEFAULT 0,
  maand_huur DECIMAL(10,2) NOT NULL CHECK (maand_huur > 0),
  jaarlijkse_opex DECIMAL(10,2) DEFAULT 0,
  verkoopwaarde_10j DECIMAL(12,2) NOT NULL CHECK (verkoopwaarde_10j > 0),
  indexatie_percentage DECIMAL(5,2) DEFAULT 2.0,
  notities TEXT,
  -- Extra financiële velden voor scenario's
  notaris_kosten DECIMAL(12,2) DEFAULT 0,
  inrichting_kosten DECIMAL(12,2) DEFAULT 0,
  hypotheek_percentage DECIMAL(5,2) DEFAULT 0,
  hypotheek_rente DECIMAL(5,2) DEFAULT 0,
  hypotheek_looptijd_jaren INTEGER DEFAULT 30,
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

-- Policies voor investment_partners
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

COMMENT ON TABLE public.shared_investments IS 'Gedeelde vastgoedinvesteringen - voor co-investment scenarios';
COMMENT ON TABLE public.investment_partners IS 'Partners/investeerders per gedeelde investering';

SELECT '✅ Module 2: Gedeelde Investeringen tabellen aangemaakt' as status;

-- ============================================================
-- MODULE 3: STRATEGIE SCENARIO'S
-- ============================================================
-- Scenario's voor gedeelde investeringen (langdurig, shortstay, verkopen)

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
  
  UNIQUE(shared_investment_id, scenario_type)
);

-- Enable Row Level Security
ALTER TABLE public.investment_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies voor investment_scenarios
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

COMMENT ON TABLE public.investment_scenarios IS 'Strategie scenarios: langdurig, shortstay, of direct verkopen';

SELECT '✅ Module 3: Strategie Scenario''s tabel aangemaakt' as status;

-- ============================================================
-- MODULE 4: FAVORIETEN / MARKTWIJZER
-- ============================================================
-- Voor het opslaan van interessante vastgoedadvertenties

-- Controleer of status kolom al text is (door eerdere migraties)
DO $$
BEGIN
    -- Check if column exists and add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'favorieten' AND column_name = 'status'
    ) THEN
        -- Tabel bestaat nog niet of status kolom ontbreekt - wordt aangemaakt met CREATE TABLE
        NULL;
    END IF;
END $$;

-- Hoofdtabel: Favorieten (als nog niet bestaat)
CREATE TABLE IF NOT EXISTS public.favorieten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  link TEXT NOT NULL,
  locatie TEXT,
  prijs DECIMAL(12,2),
  oppervlakte_m2 DECIMAL(10,2),
  notitie TEXT,
  status TEXT DEFAULT 'nieuw' NOT NULL,
  gearchiveerd BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.favorieten ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own favorieten" ON public.favorieten;
CREATE POLICY "Users can view own favorieten" ON public.favorieten 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorieten" ON public.favorieten;
CREATE POLICY "Users can insert own favorieten" ON public.favorieten 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own favorieten" ON public.favorieten;
CREATE POLICY "Users can update own favorieten" ON public.favorieten 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorieten" ON public.favorieten;
CREATE POLICY "Users can delete own favorieten" ON public.favorieten 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorieten_user_id ON public.favorieten(user_id);

COMMENT ON TABLE public.favorieten IS 'Opgeslagen vastgoedadvertenties - persoonlijke marktwijzer';

SELECT '✅ Module 4: Favorieten tabel aangemaakt' as status;

-- ============================================================
-- MODULE 5: RECIBO DE RENDA HERINNERING
-- ============================================================
-- Maandelijkse herinneringen voor officiële huurbewijzen

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS laatste_recibo_datum date,
ADD COLUMN IF NOT EXISTS recibo_bestand_url text,
ADD COLUMN IF NOT EXISTS herinnering_recibo_dag integer DEFAULT 5;

-- Voeg constraint toe als die nog niet bestaat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenants_herinnering_recibo_dag_check'
    ) THEN
        ALTER TABLE public.tenants
        ADD CONSTRAINT tenants_herinnering_recibo_dag_check 
        CHECK (herinnering_recibo_dag IS NULL OR (herinnering_recibo_dag >= 1 AND herinnering_recibo_dag <= 28));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

COMMENT ON COLUMN public.tenants.laatste_recibo_datum IS 'Datum waarop de laatste Recibo de Renda is ontvangen';
COMMENT ON COLUMN public.tenants.recibo_bestand_url IS 'Link naar geüploade Recibo de Renda';
COMMENT ON COLUMN public.tenants.herinnering_recibo_dag IS 'Dag van de maand waarop herinnering verschijnt';

SELECT '✅ Module 5: Recibo de Renda velden toegevoegd' as status;

-- ============================================================
-- MODULE 6: BANKAFSCHRIFT ANALYSE
-- ============================================================
-- Maandelijkse transacties per pand met AI-categorisatie

CREATE TABLE IF NOT EXISTS public.maandelijkse_transacties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  maand DATE NOT NULL,
  
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_user_id ON public.maandelijkse_transacties(user_id);
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_property_id ON public.maandelijkse_transacties(property_id);
CREATE INDEX IF NOT EXISTS idx_maandelijkse_transacties_maand ON public.maandelijkse_transacties(maand);

COMMENT ON TABLE public.maandelijkse_transacties IS 'Maandelijkse transacties per pand met AI-categorisatie';
COMMENT ON COLUMN public.maandelijkse_transacties.maand IS 'Eerste dag van de maand (bijv. 2026-05-01)';

SELECT '✅ Module 6: Bankafschrift Analyse tabel aangemaakt' as status;

-- ============================================================
-- MIGRATIE COMPLEET!
-- ============================================================
SELECT '🎉 ALLE 6 MODULES SUCCESVOL GEÏNSTALLEERD!' as status;
