-- Add rent indexation fields to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS volgende_huurwijziging date,
ADD COLUMN IF NOT EXISTS nieuw_huurbedrag_na_wijziging numeric;

-- Add comment for documentation
COMMENT ON COLUMN contracts.volgende_huurwijziging IS 'Datum waarop de volgende huurindexatie plaatsvindt';
COMMENT ON COLUMN contracts.nieuw_huurbedrag_na_wijziging IS 'Berekend nieuw huurbedrag na indexatie';
