-- =====================================================
-- COMPLETE DATABASE SETUP VOOR HUURINDEXATIE
-- Voer dit uit in Supabase SQL Editor
-- =====================================================

-- Stap 1: Check of contracts tabel al bestaat
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        RAISE NOTICE 'Contracts tabel bestaat nog niet. Volledige setup is nodig.';
        RAISE NOTICE 'Ga naar Lovable.dev om database te synchroniseren, OF';
        RAISE NOTICE 'Voer eerst alle basis migraties uit.';
    ELSE
        RAISE NOTICE 'Contracts tabel bestaat al. Voeg alleen indexatie velden toe.';
    END IF;
END $$;

-- Stap 2: Voeg huurindexatie velden toe (werkt of contracts bestaat of niet)
DO $$ 
BEGIN
    -- Controleer of contracts tabel bestaat
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        -- Voeg volgende_huurwijziging toe als deze nog niet bestaat
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contracts' AND column_name = 'volgende_huurwijziging'
        ) THEN
            ALTER TABLE contracts ADD COLUMN volgende_huurwijziging date;
            RAISE NOTICE 'Kolom volgende_huurwijziging toegevoegd';
        ELSE
            RAISE NOTICE 'Kolom volgende_huurwijziging bestaat al';
        END IF;

        -- Voeg nieuw_huurbedrag_na_wijziging toe als deze nog niet bestaat
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contracts' AND column_name = 'nieuw_huurbedrag_na_wijziging'
        ) THEN
            ALTER TABLE contracts ADD COLUMN nieuw_huurbedrag_na_wijziging numeric;
            RAISE NOTICE 'Kolom nieuw_huurbedrag_na_wijziging toegevoegd';
        ELSE
            RAISE NOTICE 'Kolom nieuw_huurbedrag_na_wijziging bestaat al';
        END IF;

        RAISE NOTICE '✅ Huurindexatie setup compleet!';
    ELSE
        RAISE EXCEPTION 'Contracts tabel bestaat niet. Voer eerst basis migraties uit via Lovable.dev';
    END IF;
END $$;
