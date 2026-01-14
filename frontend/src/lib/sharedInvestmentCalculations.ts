/**
 * Berekeningsfuncties voor Gedeelde Vastgoedinvesteringen
 */

export interface InvestmentPartner {
  naam: string;
  percentage: number;
  eigen_hypotheek_bedrag: number;
  rente_percentage: number;
  looptijd_jaren: number;
}

export interface SharedInvestmentData {
  aankoopprijs: number;
  renovatie_kosten: number;
  imt: number;
  maand_huur: number;
  jaarlijkse_opex: number;
  verkoopwaarde_10j: number;
  indexatie_percentage: number;
}

/**
 * Bereken totale investering
 */
export const calculateTotalInvestment = (data: SharedInvestmentData): number => {
  return data.aankoopprijs + data.renovatie_kosten + data.imt;
};

/**
 * Bereken inleg per investeerder
 */
export const calculatePartnerInvestment = (
  totalInvestment: number,
  percentage: number,
  eigenHypotheek: number
): number => {
  const share = (totalInvestment * percentage) / 100;
  return Math.max(0, share - eigenHypotheek);
};

/**
 * Bereken maandelijkse hypotheeklasten (annuïteit)
 */
export const calculateMonthlyMortgage = (
  bedrag: number,
  rentePercentage: number,
  looptijdJaren: number
): number => {
  if (bedrag === 0 || rentePercentage === 0) return 0;
  
  const maandRente = rentePercentage / 100 / 12;
  const aantalMaanden = looptijdJaren * 12;
  
  // Annuïteiten formule: M = P * (r(1+r)^n) / ((1+r)^n - 1)
  const maandlast =
    (bedrag * maandRente * Math.pow(1 + maandRente, aantalMaanden)) /
    (Math.pow(1 + maandRente, aantalMaanden) - 1);
  
  return Math.round(maandlast * 100) / 100;
};

/**
 * Bereken resterende schuld na X jaar (annuïteit)
 */
export const calculateRemainingDebt = (
  beginBedrag: number,
  rentePercentage: number,
  looptijdJaren: number,
  jarenVerstreken: number
): number => {
  if (beginBedrag === 0 || rentePercentage === 0) return 0;
  
  const maandRente = rentePercentage / 100 / 12;
  const totaalMaanden = looptijdJaren * 12;
  const verstrekenMaanden = jarenVerstreken * 12;
  const resterendeMaanden = totaalMaanden - verstrekenMaanden;
  
  if (resterendeMaanden <= 0) return 0;
  
  const maandlast = calculateMonthlyMortgage(beginBedrag, rentePercentage, looptijdJaren);
  
  // Restschuld = PV van resterende betalingen
  const restSchuld =
    (maandlast * (Math.pow(1 + maandRente, resterendeMaanden) - 1)) /
    (maandRente * Math.pow(1 + maandRente, resterendeMaanden));
  
  return Math.round(restSchuld * 100) / 100;
};

/**
 * Bereken jaarlijkse netto huur per partner (met indexatie)
 */
export const calculatePartnerAnnualRent = (
  maandHuur: number,
  jaarlijkeOpex: number,
  partner: InvestmentPartner,
  jaar: number = 1,
  indexatiePercentage: number = 2
): number => {
  // Huur met indexatie
  const geïndeexeerdeHuur = maandHuur * Math.pow(1 + indexatiePercentage / 100, jaar - 1);
  const jaarHuur = geïndeexeerdeHuur * 12;
  
  // Partner's aandeel in huur
  const partnerHuur = (jaarHuur * partner.percentage) / 100;
  
  // Partner's aandeel in OPEX
  const partnerOpex = (jaarlijkeOpex * partner.percentage) / 100;
  
  // Hypotheeklasten
  const maandHypotheek = calculateMonthlyMortgage(
    partner.eigen_hypotheek_bedrag,
    partner.rente_percentage,
    partner.looptijd_jaren
  );
  const jaarHypotheek = maandHypotheek * 12;
  
  // Netto = Huur - OPEX - Hypotheek
  return partnerHuur - partnerOpex - jaarHypotheek;
};

/**
 * Bereken maandelijkse netto huur per partner
 */
export const calculatePartnerMonthlyRent = (
  maandHuur: number,
  jaarlijkeOpex: number,
  partner: InvestmentPartner
): number => {
  const jaarNetto = calculatePartnerAnnualRent(maandHuur, jaarlijkeOpex, partner, 1, 0);
  return jaarNetto / 12;
};

/**
 * Bereken Cash-on-Cash Return
 */
export const calculateCashOnCash = (
  jaarlijkseNettoHuur: number,
  eigenInleg: number
): number => {
  if (eigenInleg === 0) return 0;
  return (jaarlijkseNettoHuur / eigenInleg) * 100;
};

/**
 * Bereken exit-opbrengst per partner
 */
export const calculatePartnerExitValue = (
  verkoopwaarde: number,
  partner: InvestmentPartner
): number => {
  // Restschuld na 10 jaar
  const restSchuld = calculateRemainingDebt(
    partner.eigen_hypotheek_bedrag,
    partner.rente_percentage,
    partner.looptijd_jaren,
    10
  );
  
  // Partner's aandeel in verkoopwaarde
  const partnerVerkoopwaarde = (verkoopwaarde * partner.percentage) / 100;
  
  // Netto exit = Verkoopwaarde - Restschuld
  return partnerVerkoopwaarde - restSchuld;
};

/**
 * Bereken IRR (Internal Rate of Return) voor 10 jaar
 * Met stabiele cashflows en indexatie
 */
export const calculateIRR = (
  eigenInleg: number,
  maandHuur: number,
  jaarlijkeOpex: number,
  partner: InvestmentPartner,
  verkoopwaarde: number,
  indexatiePercentage: number,
  jaren: number = 10
): number => {
  if (eigenInleg === 0) return 0;
  
  // Cashflows: jaar 0 = -inleg, jaar 1-10 = netto huur, jaar 10 = + exit
  const cashflows: number[] = [-eigenInleg];
  
  for (let jaar = 1; jaar <= jaren; jaar++) {
    const nettoHuur = calculatePartnerAnnualRent(
      maandHuur,
      jaarlijkeOpex,
      partner,
      jaar,
      indexatiePercentage
    );
    cashflows.push(nettoHuur);
  }
  
  // Voeg exit waarde toe aan laatste jaar
  const exitValue = calculatePartnerExitValue(verkoopwaarde, partner);
  cashflows[cashflows.length - 1] += exitValue;
  
  // Newton-Raphson methode voor IRR berekening
  let irr = 0.1; // Start met 10%
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + irr, t);
      dnpv += (-t * cashflows[t]) / Math.pow(1 + irr, t + 1);
    }
    
    const newIrr = irr - npv / dnpv;
    
    if (Math.abs(newIrr - irr) < tolerance) {
      return Math.round(newIrr * 1000) / 10; // Percentage met 1 decimaal
    }
    
    irr = newIrr;
  }
  
  return Math.round(irr * 1000) / 10;
};

/**
 * Valideer dat percentages optellen tot 100%
 */
export const validatePartnerPercentages = (partners: InvestmentPartner[]): boolean => {
  const total = partners.reduce((sum, p) => sum + p.percentage, 0);
  return Math.abs(total - 100) < 0.01; // Tolerantie voor floating point
};

/**
 * Bepaal of een waarde "goed", "matig" of "risico" is
 */
export const getRatingForCashOnCash = (
  coc: number
): { label: string; color: "success" | "warning" | "destructive" } => {
  if (coc >= 10) return { label: "Uitstekend", color: "success" };
  if (coc >= 6) return { label: "Goed", color: "success" };
  if (coc >= 3) return { label: "Matig", color: "warning" };
  return { label: "Risico", color: "destructive" };
};

export const getRatingForIRR = (
  irr: number
): { label: string; color: "success" | "warning" | "destructive" } => {
  if (irr >= 15) return { label: "Uitstekend", color: "success" };
  if (irr >= 10) return { label: "Goed", color: "success" };
  if (irr >= 5) return { label: "Matig", color: "warning" };
  return { label: "Risico", color: "destructive" };
};

export const getRatingForMonthlyRent = (
  maandHuur: number
): { label: string; color: "success" | "warning" | "destructive" } => {
  if (maandHuur >= 500) return { label: "Sterk", color: "success" };
  if (maandHuur >= 300) return { label: "Redelijk", color: "warning" };
  return { label: "Laag", color: "destructive" };
};
