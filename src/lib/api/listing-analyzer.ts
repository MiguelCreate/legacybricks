import { supabase } from '@/integrations/supabase/client';

export interface ParsedProperty {
  aankoopprijs: number | null;
  oppervlakte_m2: number | null;
  locatie: string | null;
  huurpotentie_lt: number | null;
  huurpotentie_st_adr: number | null;
  bezetting_st_pct: number | null;
  renovatiekosten: number | null;
  notariskosten: number | null;
  makelaarskosten: number | null;
  imt_pct: number | null;
  imi_jaarlijks: number | null;
  energielabel: string | null;
  bouwjaar: number | null;
  aantal_slaapkamers: number | null;
  opmerking: string | null;
}

export interface AnalysisResult {
  totalInvestment: number;
  yearlyIncomeLT: number;
  yearlyIncomeST: number;
  yearlyIncomeTotal: number;
  yearlyOpex: number;
  noi: number;
  bar: number;
  nar: number;
  cashOnCash: number;
  pricePerM2: number;
  verdict: "rendabel" | "matig" | "risicovol";
  verdictReasons: string[];
  // Financing details
  eigenGeld: number;
  lening: number;
  effectieveLTV: number;
  maandlast: number;
  jaarlijkseSchuldenlast: number;
}

export interface FinancingSettings {
  mode: 'ltv' | 'eigengeld';
  ltvPercentage: number;
  eigenGeldBedrag: number;
  rentePercentage: number;
  looptijdJaren: number;
}

export type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data?: T;
};

export const listingAnalyzerApi = {
  // Scrape a listing URL
  async scrapeUrl(url: string): Promise<ApiResponse<string>> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { 
        url, 
        options: { 
          formats: ['markdown'],
          onlyMainContent: true 
        } 
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check for blocking/captcha
    if (data?.blocked) {
      return { success: false, error: data.error || 'Website geblokkeerd' };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Scraping mislukt' };
    }

    // Handle v1 API response structure
    const markdown = data?.data?.markdown || data?.markdown;
    if (!markdown) {
      return { success: false, error: 'Geen content gevonden op pagina' };
    }

    return { success: true, data: markdown };
  },

  // Analyze scraped content with AI
  async analyzeContent(content: string, url: string): Promise<ApiResponse<ParsedProperty>> {
    const { data, error } = await supabase.functions.invoke('analyze-listing', {
      body: { content, url },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Analysis failed' };
    }

    return { success: true, data: data.data };
  },

  // Combined scrape + analyze
  async analyzeUrl(url: string): Promise<ApiResponse<ParsedProperty>> {
    // Step 1: Scrape
    const scrapeResult = await this.scrapeUrl(url);
    if (!scrapeResult.success || !scrapeResult.data) {
      return { success: false, error: scrapeResult.error || 'Failed to scrape URL' };
    }

    // Step 2: Analyze with AI
    return this.analyzeContent(scrapeResult.data, url);
  },
};

// Calculate analysis with financing
export function calculateAnalysis(
  data: ParsedProperty, 
  overrides: Partial<ParsedProperty> = {},
  financing: FinancingSettings
): AnalysisResult {
  // Merge data with overrides
  const merged = { ...data, ...overrides };
  
  const aankoopprijs = merged.aankoopprijs || 0;
  const renovatiekosten = merged.renovatiekosten || 0;
  const notariskosten = merged.notariskosten || 0;
  const makelaarskosten = merged.makelaarskosten || 0;
  const imt_pct = merged.imt_pct || 6.5;
  const imt = aankoopprijs * (imt_pct / 100);
  
  const totalInvestment = aankoopprijs + renovatiekosten + notariskosten + imt + makelaarskosten;
  
  // Calculate financing
  let lening: number;
  let eigenGeld: number;
  
  if (financing.mode === 'ltv') {
    lening = aankoopprijs * (financing.ltvPercentage / 100);
    eigenGeld = totalInvestment - lening;
  } else {
    eigenGeld = financing.eigenGeldBedrag;
    lening = totalInvestment - eigenGeld;
  }
  
  // Ensure non-negative values
  lening = Math.max(0, lening);
  eigenGeld = Math.max(0, eigenGeld);
  
  const effectieveLTV = aankoopprijs > 0 ? (lening / aankoopprijs) * 100 : 0;
  
  // Calculate mortgage payment
  const monthlyRate = financing.rentePercentage / 100 / 12;
  const numPayments = financing.looptijdJaren * 12;
  let maandlast = 0;
  
  if (lening > 0 && monthlyRate > 0 && numPayments > 0) {
    maandlast = lening * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
  
  const jaarlijkseSchuldenlast = maandlast * 12;
  
  // Yearly income
  const yearlyIncomeLT = (merged.huurpotentie_lt || 0) * 12;
  const bezetting = (merged.bezetting_st_pct || 0) / 100;
  const yearlyIncomeST = (merged.huurpotentie_st_adr || 0) * 30 * bezetting * 12;
  const yearlyIncomeTotal = Math.max(yearlyIncomeLT, yearlyIncomeST);
  
  // OPEX
  const imi = merged.imi_jaarlijks || (aankoopprijs * 0.003);
  const verzekering = aankoopprijs * 0.001;
  const onderhoud = aankoopprijs * 0.005;
  const leegstandBuffer = yearlyIncomeTotal * 0.08;
  const yearlyOpex = imi + verzekering + onderhoud + leegstandBuffer;
  
  const noi = yearlyIncomeTotal - yearlyOpex;
  
  // Key metrics
  const bar = aankoopprijs > 0 ? (yearlyIncomeTotal / aankoopprijs) * 100 : 0;
  const nar = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
  const cashOnCash = eigenGeld > 0 ? ((noi - jaarlijkseSchuldenlast) / eigenGeld) * 100 : 0;
  const pricePerM2 = merged.oppervlakte_m2 && merged.oppervlakte_m2 > 0 ? aankoopprijs / merged.oppervlakte_m2 : 0;
  
  // Verdict
  let positivePoints = 0;
  let negativePoints = 0;
  const verdictReasons: string[] = [];
  
  if (bar > 8) { positivePoints += 2; verdictReasons.push(`BAR ${bar.toFixed(1)}% is uitstekend (>8%)`); }
  else if (bar >= 5) { positivePoints += 1; verdictReasons.push(`BAR ${bar.toFixed(1)}% is acceptabel (5-8%)`); }
  else { negativePoints += 2; verdictReasons.push(`BAR ${bar.toFixed(1)}% is laag (<5%)`); }
  
  if (nar > 5) { positivePoints += 2; verdictReasons.push(`NAR ${nar.toFixed(1)}% is uitstekend (>5%)`); }
  else if (nar >= 3) { positivePoints += 1; verdictReasons.push(`NAR ${nar.toFixed(1)}% is acceptabel (3-5%)`); }
  else { negativePoints += 2; verdictReasons.push(`NAR ${nar.toFixed(1)}% is laag (<3%)`); }
  
  if (cashOnCash > 10) { positivePoints += 2; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is uitstekend (>10%)`); }
  else if (cashOnCash >= 6) { positivePoints += 1; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is acceptabel (6-10%)`); }
  else { negativePoints += 2; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is laag (<6%)`); }
  
  if (pricePerM2 > 0) {
    if (pricePerM2 < 2000) { positivePoints += 1; verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is gunstig (<€2.000)`); }
    else if (pricePerM2 <= 2800) { verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is marktconform (€2.000-2.800)`); }
    else { negativePoints += 1; verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is hoog (>€2.800)`); }
  }
  
  let verdict: "rendabel" | "matig" | "risicovol";
  if (positivePoints >= 5 && negativePoints <= 1) {
    verdict = "rendabel";
  } else if (negativePoints >= 4) {
    verdict = "risicovol";
  } else {
    verdict = "matig";
  }
  
  return {
    totalInvestment,
    yearlyIncomeLT,
    yearlyIncomeST,
    yearlyIncomeTotal,
    yearlyOpex,
    noi,
    bar,
    nar,
    cashOnCash,
    pricePerM2,
    verdict,
    verdictReasons,
    eigenGeld,
    lening,
    effectieveLTV,
    maandlast,
    jaarlijkseSchuldenlast,
  };
}
