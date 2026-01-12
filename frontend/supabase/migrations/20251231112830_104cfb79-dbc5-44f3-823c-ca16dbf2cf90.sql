-- Add risk fields to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS risico_juridisch INTEGER DEFAULT 1 CHECK (risico_juridisch >= 1 AND risico_juridisch <= 5),
ADD COLUMN IF NOT EXISTS risico_markt INTEGER DEFAULT 1 CHECK (risico_markt >= 1 AND risico_markt <= 5),
ADD COLUMN IF NOT EXISTS risico_fiscaal INTEGER DEFAULT 1 CHECK (risico_fiscaal >= 1 AND risico_fiscaal <= 5),
ADD COLUMN IF NOT EXISTS risico_fysiek INTEGER DEFAULT 1 CHECK (risico_fysiek >= 1 AND risico_fysiek <= 5),
ADD COLUMN IF NOT EXISTS risico_operationeel INTEGER DEFAULT 1 CHECK (risico_operationeel >= 1 AND risico_operationeel <= 5),
ADD COLUMN IF NOT EXISTS type_verhuur TEXT DEFAULT 'langdurig' CHECK (type_verhuur IN ('langdurig', 'toeristisch', 'gemengd')),
ADD COLUMN IF NOT EXISTS maandelijkse_huur DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subsidie_bedrag DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subsidie_naam TEXT,
ADD COLUMN IF NOT EXISTS imi_percentage DECIMAL(5,3) DEFAULT 0.003,
ADD COLUMN IF NOT EXISTS verzekering_jaarlijks DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS onderhoud_jaarlijks DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS leegstand_buffer_percentage DECIMAL(5,2) DEFAULT 5,
ADD COLUMN IF NOT EXISTS beheerkosten_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imt_betaald DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notaris_kosten DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS eigen_inleg DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aankoopdatum DATE;

-- Update loans table for amortization
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS rente_type TEXT DEFAULT 'vast' CHECK (rente_type IN ('vast', 'variabel')),
ADD COLUMN IF NOT EXISTS restschuld DECIMAL(12,2);

-- Create legacy_settings table
CREATE TABLE IF NOT EXISTS public.legacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  waardenverklaring TEXT,
  jaarlijkse_review_datum DATE,
  erfopvolging_optie TEXT CHECK (erfopvolging_optie IN ('schenking', 'holding', 'usufruct', 'testament', 'onbekend')),
  familie_rollen JSONB DEFAULT '[]'::jsonb,
  fiscale_deadlines JSONB DEFAULT '[]'::jsonb,
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add investment tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS beleggingen DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aow_maandelijks DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pensioen_maandelijks DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overige_inkomsten DECIMAL(10,2) DEFAULT 0;

-- Enable RLS on legacy_settings
ALTER TABLE public.legacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legacy_settings
CREATE POLICY "Users can view own legacy settings" ON public.legacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own legacy settings" ON public.legacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own legacy settings" ON public.legacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at on legacy_settings
CREATE TRIGGER update_legacy_settings_updated_at 
  BEFORE UPDATE ON public.legacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();