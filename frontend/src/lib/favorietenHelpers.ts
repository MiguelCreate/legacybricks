/**
 * Helper functies voor Favorieten / Marktwijzer module
 */

export interface Favoriet {
  id: string;
  link: string;
  locatie?: string;
  prijs?: number;
  oppervlakte_m2?: number;
  notitie?: string;
  status: 'nieuw' | 'bekeken' | 'geanalyseerd' | 'afgekeurd' | 'in_overweging';
  gearchiveerd: boolean;
  created_at: string;
}

/**
 * Bereken prijs per m²
 */
export const calculatePrijsPerM2 = (prijs: number, oppervlakte: number): number => {
  if (!prijs || !oppervlakte || oppervlakte === 0) return 0;
  return Math.round((prijs / oppervlakte) * 100) / 100;
};

/**
 * Gemiddelde prijzen per regio (hardcoded voor nu, later uit database)
 */
const regioPrijzen: Record<string, number> = {
  'figueira da foz': 2100,
  'coimbra': 2500,
  'lissabon': 4500,
  'porto': 3800,
  'algarve': 3200,
  'braga': 2200,
  'aveiro': 2300,
  'viseu': 1800,
  'leiria': 2000,
};

/**
 * Zoek gemiddelde prijs voor regio (fuzzy match)
 */
const findRegioGemiddelde = (locatie: string): number | null => {
  if (!locatie) return null;
  
  const normalized = locatie.toLowerCase().trim();
  
  // Exacte match
  if (regioPrijzen[normalized]) {
    return regioPrijzen[normalized];
  }
  
  // Partial match
  for (const [regio, prijs] of Object.entries(regioPrijzen)) {
    if (normalized.includes(regio) || regio.includes(normalized)) {
      return prijs;
    }
  }
  
  return null;
};

/**
 * Vergelijk prijs/m² met regio gemiddelde
 */
export const compareWithRegioGemiddelde = (
  prijsPerM2: number,
  locatie?: string
): {
  gemiddelde: number | null;
  verschil: number | null;
  verschilPercentage: number | null;
  analyse: string;
} => {
  if (!locatie) {
    return {
      gemiddelde: null,
      verschil: null,
      verschilPercentage: null,
      analyse: 'Geen locatie opgegeven voor vergelijking',
    };
  }
  
  const gemiddelde = findRegioGemiddelde(locatie);
  
  if (!gemiddelde) {
    return {
      gemiddelde: null,
      verschil: null,
      verschilPercentage: null,
      analyse: `Geen gemiddelde beschikbaar voor ${locatie}`,
    };
  }
  
  const verschil = prijsPerM2 - gemiddelde;
  const verschilPercentage = Math.round((verschil / gemiddelde) * 100);
  
  let analyse = '';
  if (verschilPercentage > 20) {
    analyse = `Aanzienlijk duurder dan gemiddelde (+${verschilPercentage}%)`;
  } else if (verschilPercentage > 10) {
    analyse = `Duurder dan gemiddelde (+${verschilPercentage}%)`;
  } else if (verschilPercentage > 0) {
    analyse = `Iets duurder dan gemiddelde (+${verschilPercentage}%)`;
  } else if (verschilPercentage === 0) {
    analyse = 'Precies op gemiddelde';
  } else if (verschilPercentage > -10) {
    analyse = `Iets goedkoper dan gemiddelde (${verschilPercentage}%)`;
  } else if (verschilPercentage > -20) {
    analyse = `Goedkoper dan gemiddelde (${verschilPercentage}%)`;
  } else {
    analyse = `Aanzienlijk goedkoper dan gemiddelde (${verschilPercentage}%)`;
  }
  
  return {
    gemiddelde,
    verschil,
    verschilPercentage,
    analyse: `Gemiddelde in ${locatie}: €${gemiddelde.toLocaleString()}/m². Dit pand: €${prijsPerM2.toLocaleString()}/m² → ${analyse}`,
  };
};

/**
 * Get status label in Nederlands
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    nieuw: 'Nieuw',
    bekeken: 'Bekeken',
    geanalyseerd: 'Geanalyseerd',
    afgekeurd: 'Afgekeurd',
    in_overweging: 'In Overweging',
  };
  return labels[status] || status;
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
  const colors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    nieuw: 'default',
    bekeken: 'secondary',
    geanalyseerd: 'success',
    afgekeurd: 'destructive',
    in_overweging: 'warning',
  };
  return colors[status] || 'default';
};

/**
 * Valideer URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
};

/**
 * Format export data voor Excel
 */
export const formatFavorietenForExport = (favorieten: Favoriet[]): any[] => {
  return favorieten.map(f => ({
    'Link': f.link,
    'Locatie': f.locatie || '-',
    'Prijs': f.prijs ? `€${f.prijs.toLocaleString()}` : '-',
    'Oppervlakte (m²)': f.oppervlakte_m2 || '-',
    'Prijs/m²': f.prijs && f.oppervlakte_m2 
      ? `€${calculatePrijsPerM2(f.prijs, f.oppervlakte_m2).toLocaleString()}`
      : '-',
    'Status': getStatusLabel(f.status),
    'Notitie': f.notitie || '-',
    'Toegevoegd': new Date(f.created_at).toLocaleDateString('nl-NL'),
  }));
};
