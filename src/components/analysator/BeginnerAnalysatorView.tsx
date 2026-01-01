import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Percent, 
  PiggyBank,
  Shield,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Calculator,
  Home
} from "lucide-react";
import { InvestmentAnalysis, getRiskAssessment } from "@/lib/rendementsCalculations";

interface BeginnerAnalysatorViewProps {
  analysis: InvestmentAnalysis;
}

interface MetricCardProps {
  title: string;
  value: string;
  explanation: string;
  interpretation: {
    status: "good" | "warning" | "danger";
    message: string;
  };
  advice: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, explanation, interpretation, advice, icon }: MetricCardProps) => {
  const statusConfig = {
    good: {
      bg: "bg-success/10",
      border: "border-success/30",
      icon: <CheckCircle2 className="w-5 h-5 text-success" />,
      badge: "bg-success/20 text-success"
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
      badge: "bg-warning/20 text-warning"
    },
    danger: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      badge: "bg-destructive/20 text-destructive"
    }
  };

  const config = statusConfig[interpretation.status];

  return (
    <Card className={`${config.bg} border ${config.border}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {config.icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What is this? */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            ℹ️ Wat is dit?
          </p>
          <p className="text-sm text-foreground">{explanation}</p>
        </div>

        {/* Your value */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">📊 Jouw waarde</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>

        {/* Interpretation */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">✅ Is dit goed?</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.badge}`}>
            {config.icon}
            {interpretation.message}
          </div>
        </div>

        {/* Advice */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Advies
          </p>
          <p className="text-sm text-foreground">{advice}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const BeginnerAnalysatorView = ({ analysis }: BeginnerAnalysatorViewProps) => {
  const riskAssessment = getRiskAssessment(analysis);

  // BAR interpretation
  const getBARInterpretation = () => {
    if (analysis.bar >= 8) return { status: "good" as const, message: "Uitstekend! >8% is sterk voor Portugal." };
    if (analysis.bar >= 5) return { status: "warning" as const, message: "Redelijk (5-8%), maar controleer de kosten." };
    return { status: "danger" as const, message: "<5% is laag. Overweeg onderhandelen of ander pand." };
  };

  // NAR interpretation
  const getNARInterpretation = () => {
    if (analysis.nar >= 5) return { status: "good" as const, message: "Goed netto rendement na kosten!" };
    if (analysis.nar >= 3) return { status: "warning" as const, message: "Acceptabel, maar kosten drukken het rendement." };
    return { status: "danger" as const, message: "Te laag. Je kosten zijn te hoog of huur te laag." };
  };

  // DSCR interpretation
  const getDSCRInterpretation = () => {
    if (analysis.dscr >= 1.5) return { status: "good" as const, message: "Veilig! Ruime buffer voor schuldaflossing." };
    if (analysis.dscr >= 1.2) return { status: "warning" as const, message: "Acceptabel, maar weinig buffer bij tegenslag." };
    return { status: "danger" as const, message: "Risicovol! Je kunt moeilijk je schulden betalen." };
  };

  // Cash-on-Cash interpretation
  const getCoCInterpretation = () => {
    if (analysis.cashOnCash >= 8) return { status: "good" as const, message: "Uitstekend rendement op je eigen geld!" };
    if (analysis.cashOnCash >= 5) return { status: "warning" as const, message: "Redelijk. Vergelijk met alternatieven." };
    return { status: "danger" as const, message: "Laag. Je eigen geld werkt niet hard genoeg." };
  };

  // IRR interpretation
  const getIRRInterpretation = () => {
    if (analysis.irr >= 12) return { status: "good" as const, message: "Uitstekend totaalrendement over de looptijd!" };
    if (analysis.irr >= 8) return { status: "warning" as const, message: "Redelijk, beter dan de meeste beleggingen." };
    return { status: "danger" as const, message: "Laag totaalrendement. Vergelijk met alternatieven." };
  };

  // Break-even interpretation
  const getBreakEvenInterpretation = () => {
    if (analysis.breakEvenOccupancy <= 50) return { status: "good" as const, message: "Veilig! Je hebt veel speelruimte." };
    if (analysis.breakEvenOccupancy <= 70) return { status: "warning" as const, message: "Redelijk, maar weinig marge bij leegstand." };
    return { status: "danger" as const, message: "Risicovol! Je moet bijna altijd verhuurd zijn." };
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Jouw Analyse Resultaten</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Hieronder zie je de belangrijkste rendementskengetallen voor dit pand met uitleg wat ze betekenen en of het een goede investering is.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Assessment */}
      <Card className={`${
        riskAssessment.level === "good" ? "bg-success/10 border-success/30" :
        riskAssessment.level === "moderate" ? "bg-warning/10 border-warning/30" :
        "bg-destructive/10 border-destructive/30"
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              riskAssessment.level === "good" 
                ? "bg-success/20" 
                : riskAssessment.level === "moderate" 
                ? "bg-warning/20" 
                : "bg-destructive/20"
            }`}>
              {riskAssessment.level === "good" ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : riskAssessment.level === "moderate" ? (
                <AlertTriangle className="w-6 h-6 text-warning" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {riskAssessment.level === "good" ? "👍 Goede Investering" :
                 riskAssessment.level === "moderate" ? "⚠️ Acceptabel, maar let op" :
                 "❌ Risicovol - Overweeg Alternatieven"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {riskAssessment.level === "good" ? "Dit pand heeft een goed rendementsprofiel met acceptabel risico." :
                 riskAssessment.level === "moderate" ? "Dit pand kan werken, maar er zijn aandachtspunten." :
                 "De risico's bij dit pand zijn hoog. Onderhandel de prijs of zoek alternatieven."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-secondary/50">
          <CardContent className="py-4 text-center">
            <Home className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Totale Investering</p>
            <p className="text-xl font-bold text-foreground">€{analysis.totalInvestment.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/50">
          <CardContent className="py-4 text-center">
            <PiggyBank className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Eigen Inleg</p>
            <p className="text-xl font-bold text-foreground">€{analysis.ownCapital.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/50">
          <CardContent className="py-4 text-center">
            <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Netto Cashflow/maand</p>
            <p className={`text-xl font-bold ${(analysis.yearlyCashflows[0]?.netCashflow || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
              €{Math.round((analysis.yearlyCashflows[0]?.netCashflow || 0) / 12).toLocaleString("nl-NL")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          title="Bruto Aanvangsrendement (BAR)"
          value={`${analysis.bar.toFixed(1)}%`}
          explanation="Hoeveel procent huur je per jaar ontvangt ten opzichte van de aankoopprijs. Dit is de eenvoudigste maatstaf voor rendement."
          interpretation={getBARInterpretation()}
          advice={
            analysis.bar >= 8 
              ? "Dit pand heeft een sterk bruto rendement. Ga verder met je analyse."
              : analysis.bar >= 5
              ? "Controleer of de kosten niet te hoog zijn. Een lagere BAR kan nog steeds werken."
              : "Probeer te onderhandelen op de prijs of zoek een pand met hogere huur."
          }
          icon={<Percent className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Netto Aanvangsrendement (NAR)"
          value={`${analysis.nar.toFixed(1)}%`}
          explanation="Het rendement na aftrek van alle exploitatiekosten (zonder hypotheek). Geeft een realistischer beeld dan BAR."
          interpretation={getNARInterpretation()}
          advice={
            analysis.nar >= 5
              ? "Je kosten zijn onder controle. Goed beheer van je investering!"
              : analysis.nar >= 3
              ? "Bekijk waar je kosten kunt verlagen: beheer, onderhoud of verzekeringen."
              : "Je kosten zijn te hoog. Analyseer elke kostenpost kritisch."
          }
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Cash-on-Cash Return"
          value={`${analysis.cashOnCash.toFixed(1)}%`}
          explanation="Hoeveel rendement je maakt op het geld dat je zelf hebt ingelegd (je eigen kapitaal). Meet de effectiviteit van je hefboomwerking."
          interpretation={getCoCInterpretation()}
          advice={
            analysis.cashOnCash >= 8
              ? "Je hefboomwerking werkt uitstekend. Je geld werkt hard voor je!"
              : analysis.cashOnCash >= 5
              ? "Overweeg of je met minder eigen geld (hogere hypotheek) meer rendement kunt maken."
              : "Vergelijk dit met simpelweg beleggen. Is vastgoed de moeite waard voor jou?"
          }
          icon={<PiggyBank className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Schulddekkingsratio (DSCR)"
          value={analysis.dscr.toFixed(2)}
          explanation="Hoeveel keer je je hypotheeklasten kunt betalen uit je netto huurinkomsten. Boven 1.0 = positieve cashflow."
          interpretation={getDSCRInterpretation()}
          advice={
            analysis.dscr >= 1.5
              ? "Ruime buffer! Je kunt een rentestijging of leegstand opvangen."
              : analysis.dscr >= 1.2
              ? "Bouw een financiële buffer op voor onverwachte situaties."
              : "Overweeg een lagere hypotheek of zoek een pand met hogere huur."
          }
          icon={<Shield className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Break-even Bezetting"
          value={`${analysis.breakEvenOccupancy.toFixed(0)}%`}
          explanation="Het minimum percentage dat je pand verhuurd moet zijn om quitte te draaien. Relevant voor korte termijn verhuur."
          interpretation={getBreakEvenInterpretation()}
          advice={
            analysis.breakEvenOccupancy <= 50
              ? "Je hebt veel speelruimte bij seizoensschommelingen of onderhoud."
              : analysis.breakEvenOccupancy <= 70
              ? "Zorg voor goede marketing en reviews om je bezetting hoog te houden."
              : "Overweeg langetermijnverhuur of verlaag je kosten significant."
          }
          icon={<Target className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="IRR (Internal Rate of Return)"
          value={`${analysis.irr.toFixed(1)}%`}
          explanation="Je totale jaarlijkse rendement over de hele looptijd, inclusief cashflow én waardestijging bij verkoop."
          interpretation={getIRRInterpretation()}
          advice={
            analysis.irr >= 12
              ? "Dit is een uitstekende investering. Overweeg vergelijkbare kansen."
              : analysis.irr >= 8
              ? "Solide rendement. Vergelijk met andere vastgoedopties in de regio."
              : "Bekijk of je aankoopprijs kunt verlagen of huurinkomsten verhogen."
          }
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Next Steps */}
      <Card className="bg-secondary/30">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Volgende Stappen</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <span className="text-lg">1️⃣</span>
              <p className="text-sm text-foreground">Schakel naar <strong>Gevorderdenmodus</strong> voor de volledige cashflowtabel en sensitivity-analyse.</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <span className="text-lg">2️⃣</span>
              <p className="text-sm text-foreground">Exporteer deze analyse als <strong>PDF</strong> om te delen met je partner of adviseur.</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <span className="text-lg">3️⃣</span>
              <p className="text-sm text-foreground">Sla dit pand op als <strong>potentiële investering</strong> om later te vergelijken.</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <span className="text-lg">4️⃣</span>
              <p className="text-sm text-foreground">Pas de <strong>aannames</strong> aan om te zien hoe gevoelig je rendement is voor veranderingen.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
