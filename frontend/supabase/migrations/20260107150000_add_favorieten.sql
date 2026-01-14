-- Favorieten / Marktwijzer Module
-- Voor het opslaan van interessante vastgoedadvertenties

-- Enum voor status
DO $$ BEGIN
    CREATE TYPE favoriet_status AS ENUM ('nieuw', 'bekeken', 'geanalyseerd', 'afgekeurd', 'in_overweging');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Hoofdtabel: Favorieten
CREATE TABLE IF NOT EXISTS public.favorieten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  link TEXT NOT NULL,
  locatie TEXT,
  prijs DECIMAL(12,2),
  oppervlakte_m2 DECIMAL(10,2),
  notitie TEXT,
  status favoriet_status DEFAULT 'nieuw' NOT NULL,
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

-- Index voor betere performance
CREATE INDEX IF NOT EXISTS idx_favorieten_user_id ON public.favorieten(user_id);
CREATE INDEX IF NOT EXISTS idx_favorieten_status ON public.favorieten(status);

-- Comments
COMMENT ON TABLE public.favorieten IS 'Opgeslagen vastgoedadvertenties - persoonlijke marktwijzer';
COMMENT ON COLUMN public.favorieten.link IS 'URL naar advertentie (Idealista, Imovirtual, etc.)';
COMMENT ON COLUMN public.favorieten.status IS 'Status: nieuw, bekeken, geanalyseerd, afgekeurd, in_overweging';

-- Success message
SELECT '✅ Favorieten module database setup compleet!' as status;
