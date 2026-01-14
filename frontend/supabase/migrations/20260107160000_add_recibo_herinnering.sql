-- Recibo de Renda Herinnering Module
-- Voor maandelijkse herinneringen om officiële huurbewijzen aan te vragen

-- Uitbreiding van tenants tabel met Recibo tracking
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS laatste_recibo_datum date,
ADD COLUMN IF NOT EXISTS recibo_bestand_url text,
ADD COLUMN IF NOT EXISTS herinnering_recibo_dag integer DEFAULT 5 CHECK (herinnering_recibo_dag >= 1 AND herinnering_recibo_dag <= 28);

-- Comments voor documentatie
COMMENT ON COLUMN public.tenants.laatste_recibo_datum IS 'Datum waarop de laatste Recibo de Renda is ontvangen';
COMMENT ON COLUMN public.tenants.recibo_bestand_url IS 'Link naar geüploade Recibo de Renda (PDF/screenshot)';
COMMENT ON COLUMN public.tenants.herinnering_recibo_dag IS 'Dag van de maand waarop herinnering verschijnt (standaard: 5e)';

-- Success message
SELECT '✅ Recibo de Renda herinnering module database setup compleet!' as status;
