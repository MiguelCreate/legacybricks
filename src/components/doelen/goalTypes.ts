// Goal type definitions and categories

export const GOAL_CATEGORIES = {
  vastgoed: {
    label: "Vastgoed",
    icon: "Building2",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  vermogen: {
    label: "Vermogen & Financiën",
    icon: "Wallet",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  persoonlijk: {
    label: "Persoonlijk & Legacy",
    icon: "Heart",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
} as const;

export const GOAL_TYPES = {
  // Vastgoed
  eerste_pand: {
    label: "Aankoop eerste pand",
    categorie: "vastgoed",
    description: "Sparen voor de aankoop van je eerste beleggingspand",
    suggestedAmount: 50000,
  },
  volgend_pand: {
    label: "Aankoop volgend pand",
    categorie: "vastgoed",
    description: "Uitbreiden van je vastgoedportefeuille",
    suggestedAmount: 30000,
  },
  renovatie: {
    label: "Renovatie / Verduurzaming",
    categorie: "vastgoed",
    description: "Investeren in onderhoud of verduurzaming van een pand",
    suggestedAmount: 15000,
  },
  hypotheek_afbouw: {
    label: "Afbouwen hypotheek",
    categorie: "vastgoed",
    description: "Extra aflossen om sneller schuldenvrij te worden",
    suggestedAmount: 25000,
  },
  overbrugging: {
    label: "Overbrugging aankoop",
    categorie: "vastgoed",
    description: "Tijdelijke financiering voor nieuwe aankoop",
    suggestedAmount: 20000,
  },
  leegstand_buffer: {
    label: "Buffer leegstand",
    categorie: "vastgoed",
    description: "Reserve voor periodes zonder huurinkomsten",
    suggestedAmount: 10000,
  },

  // Vermogen & Financiën
  noodbuffer: {
    label: "Noodbuffer",
    categorie: "vermogen",
    description: "Reserve voor onverwachte uitgaven (3-6 maanden kosten)",
    suggestedAmount: 15000,
  },
  vrij_vermogen: {
    label: "Vrij besteedbaar vermogen",
    categorie: "vermogen",
    description: "Flexibel kapitaal voor toekomstige kansen",
    suggestedAmount: 25000,
  },
  pensioen: {
    label: "Pensioenopbouw",
    categorie: "vermogen",
    description: "Aanvullend pensioen naast vastgoed",
    suggestedAmount: 100000,
  },
  passief_inkomen: {
    label: "Passief inkomen doel",
    categorie: "vermogen",
    description: "Maandelijks passief inkomen opbouwen",
    suggestedAmount: 50000,
  },
  fire: {
    label: "FIRE-doel",
    categorie: "vermogen",
    description: "Financial Independence, Retire Early",
    suggestedAmount: 500000,
  },
  belasting_buffer: {
    label: "Belastingbuffer",
    categorie: "vermogen",
    description: "Reserve voor belastingaanslagen",
    suggestedAmount: 10000,
  },

  // Persoonlijk / Legacy
  studie_kinderen: {
    label: "Studie kinderen",
    categorie: "persoonlijk",
    description: "Sparen voor onderwijs van je kinderen",
    suggestedAmount: 30000,
  },
  sabbatical: {
    label: "Sabbatical / Wereldreis",
    categorie: "persoonlijk",
    description: "Tijd nemen voor jezelf en reizen",
    suggestedAmount: 20000,
  },
  bedrijf_starten: {
    label: "Bedrijf starten",
    categorie: "persoonlijk",
    description: "Kapitaal voor een eigen onderneming",
    suggestedAmount: 50000,
  },
  familie_ondersteunen: {
    label: "Familie ondersteunen",
    categorie: "persoonlijk",
    description: "Financiële hulp aan familieleden",
    suggestedAmount: 10000,
  },
  legacy: {
    label: "Nalaten / Erfenis",
    categorie: "persoonlijk",
    description: "Vermogen opbouwen voor volgende generaties",
    suggestedAmount: 100000,
  },
  overig: {
    label: "Overig doel",
    categorie: "persoonlijk",
    description: "Ander persoonlijk doel",
    suggestedAmount: 10000,
  },
} as const;

export const PRIORITY_OPTIONS = [
  { value: "laag", label: "Laag", color: "text-muted-foreground" },
  { value: "middel", label: "Middel", color: "text-warning" },
  { value: "hoog", label: "Hoog", color: "text-destructive" },
] as const;

export const FLEXIBILITY_OPTIONS = [
  { value: "vast", label: "Vast", description: "Einddatum staat vast, bedrag/inleg kan wijzigen" },
  { value: "adaptief", label: "Adaptief", description: "Flexibel in tijd en inleg, afhankelijk van cashflow" },
] as const;

export type GoalType = keyof typeof GOAL_TYPES;
export type GoalCategory = keyof typeof GOAL_CATEGORIES;
export type Priority = "laag" | "middel" | "hoog";
export type Flexibility = "vast" | "adaptief";
