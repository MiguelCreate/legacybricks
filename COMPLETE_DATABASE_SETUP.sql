-- ========================================================================
-- VOLLEDIGE DATABASE SETUP VOOR LEGACYBRICKS + HUURINDEXATIE
-- ========================================================================
-- Kopieer en plak dit COMPLETE script in Supabase SQL Editor en klik "Run"
-- Dit script is veilig en kan meerdere keren uitgevoerd worden
-- ========================================================================

-- STAP 1: Maak enum types aan (indien nog niet bestaan)
DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('aankoop', 'renovatie', 'verhuur', 'te_koop');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE energy_label AS ENUM ('A_plus', 'A', 'B', 'C', 'D', 'E', 'F');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_type AS ENUM ('eenvoudig', 'gevorderd');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('onderhoud', 'leegstand', 'verzekering', 'belasting', 'administratie', 'energie', 'overig');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('langdurig', 'kort', 'airbnb', 'koop');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checklist_type AS ENUM ('incheck', 'retour');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_category AS ENUM ('onderhoud', 'energie', 'noodgeval', 'overig');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notulen_status AS ENUM ('gepland', 'in_behandeling', 'afgerond');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- STAP 2: Maak tabellen aan
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  naam TEXT NOT NULL,
  email TEXT NOT NULL,
  huidige_leeftijd INTEGER CHECK (huidige_leeftijd >= 18 AND huidige_leeftijd <= 100),
  gewenste_pensioenleeftijd INTEGER,
  gewenst_maandinkomen DECIMAL(12,2),
  spaargeld DECIMAL(12,2) DEFAULT 0,
  begeleiding_aan BOOLEAN DEFAULT true,
  erfgoed_mantra TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  locatie TEXT NOT NULL,
  status property_status NOT NULL DEFAULT 'aankoop',
  aankoopprijs DECIMAL(12,2) NOT NULL CHECK (aankoopprijs > 0),
  oppervlakte_m2 DECIMAL(10,2),
  energielabel energy_label,
  energie_vervaldatum DATE,
  google_drive_link TEXT,
  gezondheidsscore INTEGER DEFAULT 5 CHECK (gezondheidsscore >= 0 AND gezondheidsscore <= 10),
  waardering DECIMAL(12,2),
  waarom_gekocht TEXT,
  familie_handleiding TEXT,
  is_pinned BOOLEAN DEFAULT false,
  gearchiveerd BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  maandelijkse_huur DECIMAL(10,2) DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  aankoopdatum DATE,
  is_multiunit BOOLEAN DEFAULT false,
  aantal_units INTEGER DEFAULT 1 CHECK (aantal_units >= 1)
);

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  hypotheek_type loan_type NOT NULL DEFAULT 'eenvoudig',
  maandlast DECIMAL(10,2) NOT NULL CHECK (maandlast > 0),
  hoofdsom DECIMAL(12,2),
  rente_percentage DECIMAL(5,2),
  looptijd_jaren INTEGER,
  startdatum DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  email TEXT,
  telefoon TEXT,
  huurbedrag DECIMAL(10,2) NOT NULL CHECK (huurbedrag > 0),
  betaaldag INTEGER NOT NULL CHECK (betaaldag >= 1 AND betaaldag <= 28),
  beoordeling_betrouwbaarheid INTEGER CHECK (beoordeling_betrouwbaarheid >= 1 AND beoordeling_betrouwbaarheid <= 5),
  actief BOOLEAN DEFAULT true NOT NULL,
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unit_nummer INTEGER DEFAULT 1,
  borg DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  datum DATE NOT NULL,
  bedrag DECIMAL(10,2) NOT NULL CHECK (bedrag > 0),
  status TEXT NOT NULL DEFAULT 'betaald' CHECK (status IN ('betaald', 'verzuimd')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  categorie expense_category NOT NULL,
  bedrag DECIMAL(10,2) NOT NULL CHECK (bedrag > 0),
  datum DATE NOT NULL,
  beschrijving TEXT,
  herhalend BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- CONTRACTS TABEL MET HUURINDEXATIE VELDEN
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  type contract_type NOT NULL,
  startdatum DATE NOT NULL,
  einddatum DATE NOT NULL,
  herinnering_ingesteld BOOLEAN DEFAULT true NOT NULL,
  document_link TEXT,
  huurprijs DECIMAL(10,2),
  indexatie_percentage DECIMAL(5,2) DEFAULT 2,
  waarborgsom DECIMAL(10,2),
  room_id UUID,
  herinnering_dagen INTEGER,
  -- HUURINDEXATIE VELDEN
  volgende_huurwijziging DATE,
  nieuw_huurbedrag_na_wijziging NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  type checklist_type NOT NULL,
  datum DATE NOT NULL,
  huurder_naam TEXT NOT NULL,
  foto_link TEXT,
  handtekening TEXT,
  voltooid BOOLEAN DEFAULT false NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  doelbedrag DECIMAL(12,2) NOT NULL CHECK (doelbedrag > 0),
  huidig_bedrag DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (huidig_bedrag >= 0),
  bron_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  bereikt BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  doel_type TEXT,
  categorie TEXT,
  eind_datum DATE,
  flexibiliteit TEXT,
  gepauzeerd BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tekst TEXT NOT NULL,
  categorie note_category NOT NULL DEFAULT 'overig',
  prive BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  oppervlakte_m2 DECIMAL(10,2),
  verdieping INTEGER,
  beschrijving TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  type TEXT NOT NULL,
  huidige_waarde DECIMAL(12,2) NOT NULL DEFAULT 0,
  aankoop_waarde DECIMAL(12,2),
  aankoop_datum DATE,
  land TEXT,
  rendement_percentage DECIMAL(5,2),
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  relatie TEXT NOT NULL,
  geboorte_datum DATE,
  percentage_erfenis DECIMAL(5,2),
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bedrijfsnaam TEXT NOT NULL,
  type_werkzaamheden TEXT NOT NULL,
  contactpersoon TEXT,
  telefoon TEXT,
  email TEXT,
  notities TEXT,
  heeft_contract BOOLEAN DEFAULT false,
  contract_type TEXT,
  contract_document_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.comparable_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  adres TEXT NOT NULL,
  vraagprijs DECIMAL(12,2) NOT NULL,
  oppervlakte_m2 DECIMAL(10,2) NOT NULL,
  prijs_per_m2 DECIMAL(10,2),
  afstand_meter INTEGER,
  status TEXT,
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.goal_bronnen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  percentage_bijdrage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gemeenschappelijk_onderhoud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  element_naam TEXT NOT NULL,
  laatste_onderhoud DATE,
  volgend_onderhoud DATE,
  frequentie_jaren INTEGER,
  geschatte_kosten DECIMAL(10,2),
  notities TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gemeenschappelijke_notulen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  datum DATE NOT NULL,
  beslissing TEXT NOT NULL,
  kostenverdeling_percentage DECIMAL(5,2),
  jouw_aandeel_euro DECIMAL(10,2),
  status notulen_status DEFAULT 'gepland',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- STAP 3: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_bronnen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemeenschappelijk_onderhoud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemeenschappelijke_notulen ENABLE ROW LEVEL SECURITY;

-- STAP 4: RLS Policies (alleen basics, volledige policies kunnen later worden toegevoegd)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Users can view own properties') THEN
    CREATE POLICY "Users can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Users can insert own properties') THEN
    CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Users can update own properties') THEN
    CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Users can delete own properties') THEN
    CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Contracts policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can view contracts of own properties') THEN
    CREATE POLICY "Users can view contracts of own properties" ON public.contracts FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can insert contracts for own properties') THEN
    CREATE POLICY "Users can insert contracts for own properties" ON public.contracts FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can update contracts of own properties') THEN
    CREATE POLICY "Users can update contracts of own properties" ON public.contracts FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can delete contracts of own properties') THEN
    CREATE POLICY "Users can delete contracts of own properties" ON public.contracts FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Tenants policies (via property ownership)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can view tenants of own properties') THEN
    CREATE POLICY "Users can view tenants of own properties" ON public.tenants FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can insert tenants for own properties') THEN
    CREATE POLICY "Users can insert tenants for own properties" ON public.tenants FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can update tenants of own properties') THEN
    CREATE POLICY "Users can update tenants of own properties" ON public.tenants FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can delete tenants of own properties') THEN
    CREATE POLICY "Users can delete tenants of own properties" ON public.tenants FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Success message
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP SUCCESVOL VOLTOOID!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alle tabellen zijn aangemaakt inclusief:';
  RAISE NOTICE '- contracts tabel met huurindexatie velden';
  RAISE NOTICE '- volgende_huurwijziging';
  RAISE NOTICE '- nieuw_huurbedrag_na_wijziging';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Je kunt nu de app gebruiken!';
  RAISE NOTICE '========================================';
END $$;
