import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  BarChart3, 
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb
} from "lucide-react";

interface BeginnerFinancienViewProps {
  totalMonthlyRent: number;
  totalMonthlyLoanPayments: number;
  monthlyExpenses: number;
  netCashflow: number;
  portfolioValue: number;
  grossYield: number;
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

export const BeginnerFinancienView = ({
  totalMonthlyRent,
  totalMonthlyLoanPayments,
  monthlyExpenses,
  netCashflow,
  portfolioValue,
  grossYield
}: BeginnerFinancienViewProps) => {
  // Calculate interpretations
  const getCashflowInterpretation = () => {
    if (netCashflow >= 500) return { status: "good" as const, message: "Uitstekend! Sterke positieve cashflow." };
    if (netCashflow >= 0) return { status: "warning" as const, message: "Positief, maar krap. Let op onverwachte kosten." };
    return { status: "danger" as const, message: "Negatief! Je legt maandelijks bij." };
  };

  const getYieldInterpretation = () => {
    if (grossYield >= 6) return { status: "good" as const, message: "Uitstekend bruto rendement!" };
    if (grossYield >= 4) return { status: "warning" as const, message: "Redelijk, maar er is ruimte voor verbetering." };
    return { status: "danger" as const, message: "Laag rendement. Overweeg je strategie te herzien." };
  };

  const getCostRatioInterpretation = () => {
    const ratio = totalMonthlyRent > 0 ? (totalMonthlyLoanPayments / totalMonthlyRent) * 100 : 0;
    if (ratio <= 50) return { status: "good" as const, message: "Gezonde verhouding tussen huur en lasten." };
    if (ratio <= 70) return { status: "warning" as const, message: "Acceptabel, maar weinig buffer." };
    return { status: "danger" as const, message: "Te hoge lasten t.o.v. huurinkomsten." };
  };

  const costRatio = totalMonthlyRent > 0 ? Math.round((totalMonthlyLoanPayments / totalMonthlyRent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Jouw Financieel Overzicht</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Hieronder zie je de belangrijkste financiële kengetallen van je vastgoedportefeuille met uitleg wat ze betekenen en of je op de goede weg bent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          title="Netto Cashflow"
          value={`€${netCashflow.toLocaleString("nl-NL")}/maand`}
          explanation="Dit is wat je maandelijks overhoudt na aftrek van hypotheeklasten en alle kosten. Het is je passief inkomen uit vastgoed."
          interpretation={getCashflowInterpretation()}
          advice={
            netCashflow >= 500 
              ? "Uitstekend! Overweeg dit te herinvesteren of je buffer op te bouwen."
              : netCashflow >= 0
              ? "Bouw een buffer op voor onverwachte kosten. €3-6 maanden aan kosten is ideaal."
              : "Analyseer je kosten of bekijk of je huur kunt verhogen om positief te worden."
          }
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Bruto Rendement"
          value={`${grossYield.toFixed(1)}%`}
          explanation="Het percentage dat je jaarlijks aan huur ontvangt ten opzichte van de totale waarde van je portefeuille. Hoger = beter."
          interpretation={getYieldInterpretation()}
          advice={
            grossYield >= 6
              ? "Je vastgoed presteert boven gemiddeld. Blijf de markt volgen voor kansen."
              : grossYield >= 4
              ? "Overweeg huurverhoging of zoek naar panden met hoger rendementspotentieel."
              : "Bekijk of renovatie of herpositionering het rendement kan verhogen."
          }
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Hypotheeklasten vs Huur"
          value={`${costRatio}%`}
          explanation="Hoeveel procent van je huurinkomsten gaat naar je hypotheeklasten. Ideaal is onder de 50%."
          interpretation={getCostRatioInterpretation()}
          advice={
            costRatio <= 50
              ? "Goede verhouding! Je hebt voldoende buffer voor kosten en leegstand."
              : costRatio <= 70
              ? "Overweeg extra af te lossen of te herfinancieren bij lagere rente."
              : "Je lasten zijn te hoog. Bekijk opties om te herfinancieren of schuld af te lossen."
          }
          icon={<PiggyBank className="w-5 h-5 text-primary" />}
        />

        <MetricCard
          title="Portefeuillewaarde"
          value={`€${portfolioValue.toLocaleString("nl-NL")}`}
          explanation="De totale geschatte waarde van al je panden. Dit is je vermogen in vastgoed."
          interpretation={{
            status: portfolioValue > 0 ? "good" : "warning",
            message: portfolioValue > 0 ? "Je hebt vermogen opgebouwd in vastgoed." : "Voeg panden toe om je vermogen te laten groeien."
          }}
          advice="Laat regelmatig een taxatie doen om je werkelijke waarde te kennen. Waardestijging is rendement bovenop je cashflow!"
          icon={<Euro className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Summary Card */}
      <Card className="bg-secondary/30">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Samenvatting</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Maandelijks Inkomen</p>
              <p className="text-xl font-bold text-success">€{totalMonthlyRent.toLocaleString("nl-NL")}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Maandelijkse Lasten</p>
              <p className="text-xl font-bold text-destructive">€{(totalMonthlyLoanPayments + monthlyExpenses).toLocaleString("nl-NL")}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Netto Resultaat</p>
              <p className={`text-xl font-bold ${netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                €{netCashflow.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
