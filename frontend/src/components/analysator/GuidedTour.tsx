import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  PiggyBank, 
  Euro, 
  Percent, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  Lightbulb,
  X
} from "lucide-react";

interface GuidedTourProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}

const tourSteps = [
  {
    step: 1,
    title: "Welkom bij de Analysator! 👋",
    section: "intro",
    icon: Lightbulb,
    description: "Deze tool helpt je om snel te bepalen of een pand een goede investering is. We gaan stap voor stap door alle belangrijke gegevens.",
    tip: "Je kunt op elk moment op 'Bereken' klikken om de huidige resultaten te zien.",
  },
  {
    step: 2,
    title: "Stap 1: Aankoopgegevens",
    section: "purchase",
    icon: Building2,
    description: "Vul hier de kosten in die je maakt bij de aankoop van het pand.",
    fields: [
      { name: "Aankoopprijs", explanation: "De prijs die je betaalt voor het pand" },
      { name: "IMT", explanation: "Overdrachtsbelasting in Portugal (0-8% van aankoopprijs)" },
      { name: "Notariskosten", explanation: "Kosten voor de notaris en registratie" },
      { name: "Renovatie", explanation: "Geschatte kosten voor eventuele verbouwingen" },
      { name: "Inrichting", explanation: "Kosten voor meubels en apparatuur" },
    ],
    tip: "IMT kun je berekenen op basis van de aankoopprijs. Voor een tweede woning is dit meestal 6-8%.",
  },
  {
    step: 3,
    title: "Stap 2: Hypotheek",
    section: "mortgage",
    icon: PiggyBank,
    description: "Geef aan hoeveel je leent en tegen welke voorwaarden.",
    fields: [
      { name: "LTV", explanation: "Loan-to-Value: percentage dat je leent. 75% = je betaalt 25% zelf" },
      { name: "Rente", explanation: "Jaarlijkse rentevoet van je hypotheek" },
      { name: "Looptijd", explanation: "Aantal jaren waarin je de lening afbetaalt" },
    ],
    tip: "Een hogere LTV geeft meer rendement op je eigen geld, maar ook meer risico. Banken in Portugal geven vaak max 70-80% LTV.",
  },
  {
    step: 4,
    title: "Stap 3: Verhuurinkomsten",
    section: "rental",
    icon: Euro,
    description: "Schat je verwachte huurinkomsten.",
    fields: [
      { name: "Type verhuur", explanation: "Langdurig (vaste huurder), korte termijn (Airbnb) of gemengd" },
      { name: "Maandelijkse huur", explanation: "Verwachte huur per maand bij langdurige verhuur" },
      { name: "Bezettingsgraad", explanation: "% van het jaar dat je verhuurt bij korte termijn" },
      { name: "ADR", explanation: "Average Daily Rate: gemiddelde prijs per nacht" },
    ],
    tip: "Wees realistisch! Kijk op Idealista voor langdurige huren of AirDNA voor korte termijn data.",
  },
  {
    step: 5,
    title: "Stap 4: Exploitatiekosten",
    section: "opex",
    icon: Percent,
    description: "Vul de jaarlijkse kosten in voor het beheer van je pand.",
    fields: [
      { name: "Beheerkosten", explanation: "Percentage voor property management (vaak 8-15%)" },
      { name: "Onderhoud", explanation: "Jaarlijkse reservering voor reparaties" },
      { name: "IMI", explanation: "Jaarlijkse onroerendgoedbelasting (0.3-0.5% van kadastrale waarde)" },
      { name: "Verzekering", explanation: "Opstal- en aansprakelijkheidsverzekering" },
      { name: "VvE", explanation: "Maandelijkse bijdrage aan de vereniging van eigenaren" },
    ],
    tip: "Reken op minimaal 1-2% van de woningwaarde per jaar voor onderhoud.",
  },
  {
    step: 6,
    title: "Stap 5: Aannames",
    section: "assumptions",
    icon: TrendingUp,
    description: "Stel je verwachtingen in voor de toekomst.",
    fields: [
      { name: "Huurgroei", explanation: "Verwachte jaarlijkse stijging van de huurprijs" },
      { name: "Kostenstijging", explanation: "Verwachte jaarlijkse stijging van exploitatiekosten (inflatie)" },
      { name: "Waardegroei", explanation: "Verwachte jaarlijkse stijging van de woningwaarde" },
    ],
    tip: "Conservatieve aannames: 2% huurgroei, 2% kostenstijging, 2-3% waardegroei.",
  },
  {
    step: 7,
    title: "🎉 Klaar!",
    section: "results",
    icon: Lightbulb,
    description: "Je analyse is compleet! Bekijk nu de resultaten en KPI's om te bepalen of dit een goede investering is.",
    tip: "Let vooral op IRR (> 12% is goed), DSCR (> 1.2 is veilig) en Cash-on-Cash rendement.",
  },
];

export function GuidedTour({ currentStep, onStepChange, onClose }: GuidedTourProps) {
  const step = tourSteps.find(s => s.step === currentStep) || tourSteps[0];
  const progress = (currentStep / tourSteps.length) * 100;
  const Icon = step.icon;

  return (
    <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground">Stap {currentStep} van {tourSteps.length}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1.5 mb-3" />

        {/* Content */}
        <p className="text-sm text-foreground mb-3">{step.description}</p>

        {/* Fields explanation */}
        {step.fields && (
          <div className="space-y-1.5 mb-3">
            {step.fields.map((field, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-foreground min-w-24">{field.name}:</span>
                <span className="text-muted-foreground">{field.explanation}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {step.tip && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 mb-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> {step.tip}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Vorige
          </Button>
          
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => onStepChange(i + 1)}
              />
            ))}
          </div>

          {currentStep < tourSteps.length ? (
            <Button
              size="sm"
              onClick={() => onStepChange(currentStep + 1)}
              className="gap-1"
            >
              Volgende
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={onClose} className="gap-1">
              Bekijk Resultaten
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function getStepForSection(section: string): number {
  const step = tourSteps.find(s => s.section === section);
  return step?.step || 1;
}

export { tourSteps };
