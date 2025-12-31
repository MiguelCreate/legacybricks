-- Create enum types
CREATE TYPE property_status AS ENUM ('aankoop', 'renovatie', 'verhuur', 'te_koop');
CREATE TYPE energy_label AS ENUM ('A_plus', 'A', 'B', 'C', 'D', 'E', 'F');
CREATE TYPE loan_type AS ENUM ('eenvoudig', 'gevorderd');
CREATE TYPE expense_category AS ENUM ('onderhoud', 'leegstand', 'verzekering', 'belasting', 'administratie', 'energie', 'overig');
CREATE TYPE contract_type AS ENUM ('langdurig', 'kort', 'airbnb', 'koop');
CREATE TYPE checklist_type AS ENUM ('incheck', 'retour');
CREATE TYPE note_category AS ENUM ('onderhoud', 'energie', 'noodgeval', 'overig');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
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

-- Properties table
CREATE TABLE public.properties (
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
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Loans table
CREATE TABLE public.loans (
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

-- Tenants table
CREATE TABLE public.tenants (
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
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  datum DATE NOT NULL,
  bedrag DECIMAL(10,2) NOT NULL CHECK (bedrag > 0),
  status TEXT NOT NULL DEFAULT 'betaald' CHECK (status IN ('betaald', 'verzuimd')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  categorie expense_category NOT NULL,
  bedrag DECIMAL(10,2) NOT NULL CHECK (bedrag > 0),
  datum DATE NOT NULL,
  beschrijving TEXT,
  herhalend BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  type contract_type NOT NULL,
  startdatum DATE NOT NULL,
  einddatum DATE NOT NULL,
  herinnering_ingesteld BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Checklists table
CREATE TABLE public.checklists (
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

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naam TEXT NOT NULL,
  doelbedrag DECIMAL(12,2) NOT NULL CHECK (doelbedrag > 0),
  huidig_bedrag DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (huidig_bedrag >= 0),
  bron_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  bereikt BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tekst TEXT NOT NULL,
  categorie note_category NOT NULL DEFAULT 'overig',
  prive BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
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

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for properties
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loans (via property ownership)
CREATE POLICY "Users can view loans of own properties" ON public.loans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert loans for own properties" ON public.loans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update loans of own properties" ON public.loans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete loans of own properties" ON public.loans
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for tenants (via property ownership)
CREATE POLICY "Users can view tenants of own properties" ON public.tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert tenants for own properties" ON public.tenants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update tenants of own properties" ON public.tenants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete tenants of own properties" ON public.tenants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for payments (via property ownership)
CREATE POLICY "Users can view payments of own properties" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert payments for own properties" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete payments of own properties" ON public.payments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for expenses (via property ownership)
CREATE POLICY "Users can view expenses of own properties" ON public.expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert expenses for own properties" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update expenses of own properties" ON public.expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete expenses of own properties" ON public.expenses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for contracts (via property ownership)
CREATE POLICY "Users can view contracts of own properties" ON public.contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert contracts for own properties" ON public.contracts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update contracts of own properties" ON public.contracts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete contracts of own properties" ON public.contracts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for checklists (via property ownership)
CREATE POLICY "Users can view checklists of own properties" ON public.checklists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert checklists for own properties" ON public.checklists
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update checklists of own properties" ON public.checklists
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete checklists of own properties" ON public.checklists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notes (via property ownership)
CREATE POLICY "Users can view notes of own properties" ON public.notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert notes for own properties" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update notes of own properties" ON public.notes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete notes of own properties" ON public.notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, naam, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'naam', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profiles on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();