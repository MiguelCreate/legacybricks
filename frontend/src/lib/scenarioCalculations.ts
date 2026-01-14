/**
 * Scenario berekeningsfuncties voor Gedeelde Vastgoedinvesteringen
 * Ondersteunt 3 strategieën: Langdurig, Short-stay, Direct verkopen
 */

export interface ScenarioData {
  // Langdurig
  maand_huur_langdurig: number;
  bezetting_langdurig: number;
  opex_jaar_langdurig: number;
  
  // Short-stay
  adr_shortstay: number;
  bezetting_shortstay: number;
  opex_jaar_shortstay: number;
  extra_kosten_shortstay: number;
  
  // Verkopen
  verkoopwaarde: number;
  verkoopkosten_percentage: number;
}

export interface InvestmentFinancials {
  aankoopprijs: number;
  renovatie_kosten: number;
  imt: number;
  notaris_kosten: number;
  inrichting_kosten: number;
  hypotheek_percentage: number;
  hypotheek_rente: number;
  hypotheek_looptijd_jaren: number;
}

export interface ScenarioResult {
  type: 'langdurig' | 'shortstay' | 'verkopen';
  bruto_opbrengst_jaar: number;
  opex_jaar: number;
  noi: number;
  schuldendienst_jaar: number;
  netto_cashflow_jaar: number;
  netto_cashflow_maand: number;
  cash_on_cash: number;
  irr_10jaar?: number;
  netto_verkoop?: number;
  rating: {
    label: string;
    color: "success" | "warning" | "destructive";
  };
}

/**
 * Bereken totale initiële investering
 */
export const calculateTotalInitialInvestment = (financials: InvestmentFinancials): number => {
  return (
    financials.aankoopprijs +
    financials.renovatie_kosten +
    financials.imt +
    financials.notaris_kosten +
    financials.inrichting_kosten
  );
};

/**
 * Bereken hypotheek bedrag
 */
export const calculateHypotheekBedrag = (
  totalInvestment: number,
  hypotheekPercentage: number
): number => {
  return (totalInvestment * hypotheekPercentage) / 100;
};

/**
 * Bereken eigen inbreng totaal
 */
export const calculateEigenInbrengTotaal = (
  totalInvestment: number,
  hypotheekPercentage: number
): number => {
  return totalInvestment - calculateHypotheekBedrag(totalInvestment, hypotheekPercentage);
};

/**
 * Bereken jaarlijkse schuldendienst (hypotheeklasten)
 */
export const calculateSchuldendienst = (
  hypotheekBedrag: number,
  rentePercentage: number,
  looptijdJaren: number
): number => {
  if (hypotheekBedrag === 0 || rentePercentage === 0) return 0;
  
  const maandRente = rentePercentage / 100 / 12;
  const aantalMaanden = looptijdJaren * 12;
  
  // Annuïteiten formule
  const maandlast =
    (hypotheekBedrag * maandRente * Math.pow(1 + maandRente, aantalMaanden)) /
    (Math.pow(1 + maandRente, aantalMaanden) - 1);
  
  return Math.round(maandlast * 12 * 100) / 100;
};

/**
 * Bereken Plusvalia (Portugese vermogenswinstbelasting)
 */
export const calculatePlusvalia = (
  verkoopwaarde: number,
  aankoopprijs: number
): number => {
  const winst = Math.max(0, verkoopwaarde - aankoopprijs);
  return winst * 0.28; // 28% belasting
};

/**
 * SCENARIO 1: Langdurig verhuren
 */
export const calculateLangdurigScenario = (
  financials: InvestmentFinancials,
  scenario: ScenarioData,
  totalInvestment: number
): ScenarioResult => {
  // Bruto opbrengst
  const bezetting = scenario.bezetting_langdurig / 100;
  const bruto_jaar = scenario.maand_huur_langdurig * 12 * bezetting;
  
  // NOI (Net Operating Income)
  const noi = bruto_jaar - scenario.opex_jaar_langdurig;
  
  // Schuldendienst
  const hypotheekBedrag = calculateHypotheekBedrag(totalInvestment, financials.hypotheek_percentage);
  const schuldendienst = calculateSchuldendienst(
    hypotheekBedrag,
    financials.hypotheek_rente,
    financials.hypotheek_looptijd_jaren
  );
  
  // Netto cashflow
  const netto_cashflow_jaar = noi - schuldendienst;
  const netto_cashflow_maand = netto_cashflow_jaar / 12;
  
  // Cash-on-Cash
  const eigenInbreng = calculateEigenInbrengTotaal(totalInvestment, financials.hypotheek_percentage);
  const cash_on_cash = eigenInbreng > 0 ? (netto_cashflow_jaar / eigenInbreng) * 100 : 0;
  
  // Rating
  let rating: ScenarioResult["rating"];
  if (cash_on_cash >= 10) {
    rating = { label: "Uitstekend", color: "success" };
  } else if (cash_on_cash >= 6) {
    rating = { label: "Goed", color: "success" };
  } else if (cash_on_cash >= 3) {
    rating = { label: "Matig", color: "warning" };
  } else {
    rating = { label: "Risico", color: "destructive" };
  }
  
  return {
    type: 'langdurig',
    bruto_opbrengst_jaar: bruto_jaar,
    opex_jaar: scenario.opex_jaar_langdurig,
    noi,
    schuldendienst_jaar: schuldendienst,
    netto_cashflow_jaar,
    netto_cashflow_maand,
    cash_on_cash,
    rating,
  };
};

/**
 * SCENARIO 2: Short-stay (Airbnb/toerisme)
 */
export const calculateShortStayScenario = (
  financials: InvestmentFinancials,
  scenario: ScenarioData,
  totalInvestment: number
): ScenarioResult => {
  // Bruto opbrengst: ADR × dagen × bezetting
  const bezetting = scenario.bezetting_shortstay / 100;
  const dagenPerJaar = 365;
  const bruto_jaar = scenario.adr_shortstay * dagenPerJaar * bezetting;
  
  // OPEX + extra kosten (schoonmaak, beheer, utilities)
  const totale_opex = scenario.opex_jaar_shortstay + scenario.extra_kosten_shortstay;
  
  // NOI
  const noi = bruto_jaar - totale_opex;
  
  // Schuldendienst
  const hypotheekBedrag = calculateHypotheekBedrag(totalInvestment, financials.hypotheek_percentage);
  const schuldendienst = calculateSchuldendienst(
    hypotheekBedrag,
    financials.hypotheek_rente,
    financials.hypotheek_looptijd_jaren
  );
  
  // Netto cashflow
  const netto_cashflow_jaar = noi - schuldendienst;
  const netto_cashflow_maand = netto_cashflow_jaar / 12;
  
  // Cash-on-Cash
  const eigenInbreng = calculateEigenInbrengTotaal(totalInvestment, financials.hypotheek_percentage);
  const cash_on_cash = eigenInbreng > 0 ? (netto_cashflow_jaar / eigenInbreng) * 100 : 0;
  
  // Rating
  let rating: ScenarioResult["rating"];
  if (cash_on_cash >= 10) {
    rating = { label: "Uitstekend", color: "success" };
  } else if (cash_on_cash >= 6) {
    rating = { label: "Goed", color: "success" };
  } else if (cash_on_cash >= 3) {
    rating = { label: "Matig - meer werk", color: "warning" };
  } else {
    rating = { label: "Risico - hoog beheer", color: "destructive" };
  }
  
  return {
    type: 'shortstay',
    bruto_opbrengst_jaar: bruto_jaar,
    opex_jaar: totale_opex,
    noi,
    schuldendienst_jaar: schuldendienst,
    netto_cashflow_jaar,
    netto_cashflow_maand,
    cash_on_cash,
    rating,
  };
};

/**
 * SCENARIO 3: Direct verkopen
 */
export const calculateVerkopenScenario = (
  financials: InvestmentFinancials,
  scenario: ScenarioData,
  totalInvestment: number
): ScenarioResult => {
  const hypotheekBedrag = calculateHypotheekBedrag(totalInvestment, financials.hypotheek_percentage);
  const eigenInbreng = calculateEigenInbrengTotaal(totalInvestment, financials.hypotheek_percentage);
  
  // Verkoopkosten
  const makelaarskosten = (scenario.verkoopwaarde * scenario.verkoopkosten_percentage) / 100;
  
  // Plusvalia (vermogenswinstbelasting)
  const plusvalia = calculatePlusvalia(scenario.verkoopwaarde, financials.aankoopprijs);
  
  // Resterende schuld (we nemen aan: direct verkoop = geen aflossing)
  const resterendeSchuld = hypotheekBedrag;
  
  // Netto opbrengst verkoop
  const netto_verkoop = scenario.verkoopwaarde - makelaarskosten - plusvalia - resterendeSchuld;
  
  // Winst/verlies
  const winst = netto_verkoop - eigenInbreng;
  
  // Rating
  let rating: ScenarioResult["rating"];
  if (winst > eigenInbreng * 0.2) {
    rating = { label: "Goede deal", color: "success" };
  } else if (winst > 0) {
    rating = { label: "Kleine winst", color: "warning" };
  } else {
    rating = { label: "Verlies", color: "destructive" };
  }
  
  return {
    type: 'verkopen',
    bruto_opbrengst_jaar: scenario.verkoopwaarde,
    opex_jaar: makelaarskosten + plusvalia,
    noi: netto_verkoop,
    schuldendienst_jaar: 0,
    netto_cashflow_jaar: 0,
    netto_cashflow_maand: 0,
    cash_on_cash: 0,
    netto_verkoop,
    rating,
  };
};

/**
 * Bereken IRR voor langdurig/shortstay scenario's
 * Vereenvoudigde versie: aanname van stabiele cashflows + exit na 10 jaar
 */
export const calculateScenarioIRR = (
  nettoCashflowJaar: number,
  eigenInbreng: number,
  exitWaarde: number,
  jaren: number = 10
): number => {
  if (eigenInbreng === 0) return 0;
  
  // Cashflows: jaar 0 = -inleg, jaar 1-10 = cashflow, jaar 10 = + exit
  const cashflows: number[] = [-eigenInbreng];
  
  for (let i = 1; i <= jaren; i++) {
    cashflows.push(nettoCashflowJaar);
  }
  
  // Voeg exit toe aan laatste jaar
  cashflows[cashflows.length - 1] += exitWaarde;
  
  // Newton-Raphson methode
  let irr = 0.1;
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
      return Math.round(newIrr * 1000) / 10;
    }
    
    irr = newIrr;
  }
  
  return Math.round(irr * 1000) / 10;
};

/**
 * Bereken scenario per investeerder
 */
export const calculatePartnerScenario = (
  scenarioResult: ScenarioResult,
  partnerPercentage: number
): {
  netto_cashflow_jaar: number;
  netto_cashflow_maand: number;
  netto_verkoop?: number;
} => {
  const factor = partnerPercentage / 100;
  
  return {
    netto_cashflow_jaar: scenarioResult.netto_cashflow_jaar * factor,
    netto_cashflow_maand: scenarioResult.netto_cashflow_maand * factor,
    netto_verkoop: scenarioResult.netto_verkoop ? scenarioResult.netto_verkoop * factor : undefined,
  };
};

/**
 * Bepaal beste scenario op basis van rendement
 */
export const getBestScenario = (
  scenarios: ScenarioResult[]
): ScenarioResult => {
  // Sorteer op Cash-on-Cash (hoogste eerst)
  // Voor verkopen gebruiken we winst/inleg ratio
  return scenarios.reduce((best, current) => {
    const bestScore = best.cash_on_cash || (best.netto_verkoop || 0);
    const currentScore = current.cash_on_cash || (current.netto_verkoop || 0);
    return currentScore > bestScore ? current : best;
  });
};

/**
 * Get scenario naam in Nederlands
 */
export const getScenarioNaam = (type: string): string => {
  const namen: Record<string, string> = {
    langdurig: "Langdurig Verhuren",
    shortstay: "Short-stay (Toerisme)",
    verkopen: "Direct Verkopen",
  };
  return namen[type] || type;
};
