/**
 * Helper functies voor Bankafschrift Analyse met AI
 */

export interface AIAnalyseOutput {
  huur_inkomsten: number[];
  hypotheek_aflossing: number | null;
  hypotheek_rente: number | null;
  imi_belasting: number | null;
  onderhoud: number | null;
  utilities: number | null;
  verzekering: number | null;
  onbekend: Array<{
    bedrag: number;
    omschrijving: string;
  }>;
}

export interface OnbekendPost {
  bedrag: number;
  omschrijving: string;
  categorie?: string;
}

export interface GecategoriseerdeTransacties {
  huur_inkomsten: number;
  hypotheek_aflossing: number;
  hypotheek_rente: number;
  imi_belasting: number;
  onderhoud: number;
  utilities: number;
  verzekering: number;
  overig: number;
  onbekend: OnbekendPost[];
}

/**
 * Parse JSON output van AI
 */
export const parseAIOutput = (jsonString: string): AIAnalyseOutput | null => {
  try {
    // Trim whitespace
    const trimmed = jsonString.trim();
    
    // Probeer JSON te parsen
    const parsed = JSON.parse(trimmed);
    
    // Valideer structuur
    if (typeof parsed !== 'object') {
      throw new Error('Output is geen geldig object');
    }
    
    // Converteer naar verwachte structuur
    return {
      huur_inkomsten: Array.isArray(parsed.huur_inkomsten) ? parsed.huur_inkomsten : [],
      hypotheek_aflossing: parsed.hypotheek_aflossing ?? null,
      hypotheek_rente: parsed.hypotheek_rente ?? null,
      imi_belasting: parsed.imi_belasting ?? null,
      onderhoud: parsed.onderhoud ?? null,
      utilities: parsed.utilities ?? null,
      verzekering: parsed.verzekering ?? null,
      onbekend: Array.isArray(parsed.onbekend) ? parsed.onbekend : [],
    };
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

/**
 * Valideer AI output structuur
 */
export const validateAIOutput = (output: AIAnalyseOutput): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check huur_inkomsten is array
  if (!Array.isArray(output.huur_inkomsten)) {
    errors.push('huur_inkomsten moet een array zijn');
  }
  
  // Check alle nummer velden
  const nummerVelden = [
    'hypotheek_aflossing',
    'hypotheek_rente',
    'imi_belasting',
    'onderhoud',
    'utilities',
    'verzekering'
  ] as const;
  
  nummerVelden.forEach(veld => {
    const waarde = output[veld];
    if (waarde !== null && typeof waarde !== 'number') {
      errors.push(`${veld} moet een nummer zijn of null`);
    }
  });
  
  // Check onbekend array
  if (!Array.isArray(output.onbekend)) {
    errors.push('onbekend moet een array zijn');
  } else {
    output.onbekend.forEach((item, index) => {
      if (typeof item.bedrag !== 'number') {
        errors.push(`onbekend[${index}].bedrag moet een nummer zijn`);
      }
      if (typeof item.omschrijving !== 'string') {
        errors.push(`onbekend[${index}].omschrijving moet een string zijn`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Converteer AI output naar gecategoriseerde transacties
 */
export const convertToTransacties = (output: AIAnalyseOutput): GecategoriseerdeTransacties => {
  return {
    huur_inkomsten: output.huur_inkomsten.reduce((sum, val) => sum + val, 0),
    hypotheek_aflossing: output.hypotheek_aflossing ?? 0,
    hypotheek_rente: output.hypotheek_rente ?? 0,
    imi_belasting: output.imi_belasting ?? 0,
    onderhoud: output.onderhoud ?? 0,
    utilities: output.utilities ?? 0,
    verzekering: output.verzekering ?? 0,
    overig: 0,
    onbekend: output.onbekend.map(item => ({
      bedrag: item.bedrag,
      omschrijving: item.omschrijving,
    })),
  };
};

/**
 * Categoriseer onbekende post
 */
export const categoriseerOnbekend = (
  transacties: GecategoriseerdeTransacties,
  onbekendIndex: number,
  categorie: string
): GecategoriseerdeTransacties => {
  const post = transacties.onbekend[onbekendIndex];
  if (!post) return transacties;
  
  const nieuweTransacties = { ...transacties };
  
  // Voeg bedrag toe aan juiste categorie
  switch (categorie) {
    case 'huur':
      nieuweTransacties.huur_inkomsten += post.bedrag;
      break;
    case 'hypotheek_aflossing':
      nieuweTransacties.hypotheek_aflossing += post.bedrag;
      break;
    case 'hypotheek_rente':
      nieuweTransacties.hypotheek_rente += post.bedrag;
      break;
    case 'imi':
      nieuweTransacties.imi_belasting += post.bedrag;
      break;
    case 'onderhoud':
      nieuweTransacties.onderhoud += post.bedrag;
      break;
    case 'utilities':
      nieuweTransacties.utilities += post.bedrag;
      break;
    case 'verzekering':
      nieuweTransacties.verzekering += post.bedrag;
      break;
    case 'overig':
      nieuweTransacties.overig += post.bedrag;
      break;
  }
  
  // Verwijder uit onbekend
  nieuweTransacties.onbekend = transacties.onbekend.filter((_, i) => i !== onbekendIndex);
  
  return nieuweTransacties;
};

/**
 * Bereken totaal uitgaven
 */
export const berekenTotaalUitgaven = (transacties: GecategoriseerdeTransacties): number => {
  return (
    transacties.hypotheek_aflossing +
    transacties.hypotheek_rente +
    transacties.imi_belasting +
    transacties.onderhoud +
    transacties.utilities +
    transacties.verzekering +
    transacties.overig
  );
};

/**
 * Bereken netto cashflow
 */
export const berekenNettoCashflow = (transacties: GecategoriseerdeTransacties): number => {
  return transacties.huur_inkomsten - berekenTotaalUitgaven(transacties);
};

/**
 * Genereer Qwen prompt template
 */
export const getQwenPromptTemplate = (): string => {
  return `Analyseer dit bankafschrift uit Portugal. Identificeer alle transacties gerelateerd aan vastgoed. Geef het resultaat in dit exacte JSON-formaat. Als een categorie ontbreekt, vul dan null in.

{
  "huur_inkomsten": [950, 800],
  "hypotheek_aflossing": 400,
  "hypotheek_rente": 277,
  "imi_belasting": 50,
  "onderhoud": 120,
  "utilities": 80,
  "verzekering": 20,
  "onbekend": [
    {"bedrag": 65, "omschrijving": "MB WAY PAGAMENTO"},
    {"bedrag": 30, "omschrijving": "SUPERMARKT COMPRA"}
  ]
}

Gebruik alleen de bovenstaande veldnamen. Geef geen extra tekst.`;
};

/**
 * Get categorie options voor dropdown
 */
export const getCategorieOptions = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'huur', label: 'Huur Inkomsten' },
    { value: 'hypotheek_aflossing', label: 'Hypotheek Aflossing' },
    { value: 'hypotheek_rente', label: 'Hypotheek Rente' },
    { value: 'imi', label: 'IMI Belasting' },
    { value: 'onderhoud', label: 'Onderhoud' },
    { value: 'utilities', label: 'Utilities (water, elektra, gas)' },
    { value: 'verzekering', label: 'Verzekering' },
    { value: 'overig', label: 'Overig' },
  ];
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get maand naam
 */
export const getMaandNaam = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
};
