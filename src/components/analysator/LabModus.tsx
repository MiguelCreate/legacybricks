import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  FlaskConical, 
  AlertTriangle, 
  TrendingDown, 
  Home,
  Percent,
  Building2,
  Shield,
  XCircle
} from "lucide-react";

interface LabModusProps {
  huidigeRente: number;
  huidigeLeegstand: number;
  huidigeDSCR: number;
  huidigeVrijheidJaren: number;
  maandelijkseCashflow: number;
  jaarlijkseHuur: number;
  jaarlijkseKosten: number;
  hypotheekBedrag: number;
}

interface ScenarioResult {
  nieuweDSCR: number;
  nieuweCashflow: number;
  nieuweVrijheidJaren: number;
  risico: 'laag' | 'matig' | 'hoog' | 'kritiek';
}

export const LabModus = ({
  huidigeRente,
  huidigeLeegstand,
  huidigeDSCR,
  huidigeVrijheidJaren,
  maandelijkseCashflow,
  jaarlijkseHuur,
  jaarlijkseKosten,
  hypotheekBedrag,
}: LabModusProps) => {
  const [scenarioRente, setScenarioRente] = useState(huidigeRente);
  const [scenarioLeegstand, setScenarioLeegstand] = useState(huidigeLeegstand);
  const [scenarioHuurDaling, setScenarioHuurDaling] = useState(0);
  const [airbnbVerbod, setAirbnbVerbod] = useState(false);

  // Bereken scenario impact
  const calculateScenario = (): ScenarioResult => {
    // Nieuwe hypotheeklasten bij andere rente
    const maandRenteOud = huidigeRente / 100 / 12;
    const maandRenteNieuw = scenarioRente / 100 / 12;
    const looptijd = 30 * 12; // Aanname 30 jaar
    
    const oudeHypotheeklast = hypotheekBedrag * (maandRenteOud * Math.pow(1 + maandRenteOud, looptijd)) / 
                              (Math.pow(1 + maandRenteOud, looptijd) - 1) || hypotheekBedrag / looptijd;
    const nieuweHypotheeklast = hypotheekBedrag * (maandRenteNieuw * Math.pow(1 + maandRenteNieuw, looptijd)) / 
                                 (Math.pow(1 + maandRenteNieuw, looptijd) - 1) || hypotheekBedrag / looptijd;

    // Huurinkomsten aanpassing
    let effectieveHuur = jaarlijkseHuur;
    
    // Leegstand impact
    effectieveHuur *= (1 - scenarioLeegstand / 100);
    
    // Huurdaling
    effectieveHuur *= (1 - scenarioHuurDaling / 100);
    
    // Airbnb verbod (30% huurinkomsten daling voor ST verhuur)
    if (airbnbVerbod) {
      effectieveHuur *= 0.7;
    }

    // NOI
    const noi = effectieveHuur - jaarlijkseKosten;
    
    // DSCR
    const jaarlijkseHypotheek = nieuweHypotheeklast * 12;
    const nieuweDSCR = jaarlijkseHypotheek > 0 ? noi / jaarlijkseHypotheek : Infinity;
    
    // Nieuwe cashflow
    const nieuweCashflow = (noi - jaarlijkseHypotheek) / 12;
    
    // Vrijheid jaren (vereenvoudigd)
    const nieuweVrijheidJaren = nieuweCashflow > 0 
      ? huidigeVrijheidJaren * (nieuweCashflow / (maandelijkseCashflow || 1))
      : 0;

    // Risico bepalen
    let risico: 'laag' | 'matig' | 'hoog' | 'kritiek' = 'laag';
    if (nieuweDSCR < 0.8 || nieuweCashflow < -500) risico = 'kritiek';
    else if (nieuweDSCR < 1.0 || nieuweCashflow < 0) risico = 'hoog';
    else if (nieuweDSCR < 1.2 || nieuweCashflow < maandelijkseCashflow * 0.5) risico = 'matig';

    return {
      nieuweDSCR: Math.round(nieuweDSCR * 100) / 100,
      nieuweCashflow: Math.round(nieuweCashflow),
      nieuweVrijheidJaren: Math.round(nieuweVrijheidJaren * 10) / 10,
      risico,
    };
  };

  const result = calculateScenario();

  const getRisicoColor = (risico: string) => {
    switch (risico) {
      case 'kritiek': return 'bg-red-500 text-white animate-pulse';
      case 'hoog': return 'bg-red-400 text-white';
      case 'matig': return 'bg-yellow-400 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getRisicoIcon = (risico: string) => {
    if (risico === 'kritiek' || risico === 'hoog') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const resetScenario = () => {
    setScenarioRente(huidigeRente);
    setScenarioLeegstand(huidigeLeegstand);
    setScenarioHuurDaling(0);
    setAirbnbVerbod(false);
  };

  return (
    <Card className="shadow-card border-2 border-dashed border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Lab-modus
          <Badge variant="secondary" className="ml-2">Experimenteer</Badge>
          <InfoTooltip
            title="Lab-modus"
            content="Test extreme scenario's om te zien hoe je portefeuille reageert op risico's. Dit helpt je beslissen of je buffers groot genoeg zijn."
          />
        </CardTitle>
        <CardDescription>
          Breng je portefeuille in gevaar — zonder echte risico's
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Scenario Sliders */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Rente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Hypotheekrente
              </Label>
              <span className="text-sm font-medium">
                {scenarioRente.toFixed(1)}%
                {scenarioRente !== huidigeRente && (
                  <span className="text-red-500 ml-1">
                    ({scenarioRente > huidigeRente ? '+' : ''}{(scenarioRente - huidigeRente).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <Slider
              value={[scenarioRente]}
              onValueChange={([value]) => setScenarioRente(value)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Huidige: {huidigeRente}% | Test: tot 10%
            </p>
          </div>

          {/* Leegstand */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Leegstand
              </Label>
              <span className="text-sm font-medium">
                {scenarioLeegstand}%
                {scenarioLeegstand !== huidigeLeegstand && (
                  <span className="text-red-500 ml-1">
                    (+{scenarioLeegstand - huidigeLeegstand}%)
                  </span>
                )}
              </span>
            </div>
            <Slider
              value={[scenarioLeegstand]}
              onValueChange={([value]) => setScenarioLeegstand(value)}
              min={0}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Huurdaling */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Huurdaling
              </Label>
              <span className="text-sm font-medium text-red-500">
                -{scenarioHuurDaling}%
              </span>
            </div>
            <Slider
              value={[scenarioHuurDaling]}
              onValueChange={([value]) => setScenarioHuurDaling(value)}
              min={0}
              max={30}
              step={5}
              className="w-full"
            />
          </div>

          {/* Airbnb Verbod */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Airbnb Verbod
              </Label>
              <Button
                variant={airbnbVerbod ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAirbnbVerbod(!airbnbVerbod)}
              >
                {airbnbVerbod ? "Actief" : "Simuleer"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Simuleert 30% daling in huurinkomsten door verbod op korte verhuur
            </p>
          </div>
        </div>

        {/* Resultaten */}
        <div className={`p-6 rounded-xl border-2 ${
          result.risico === 'kritiek' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
          result.risico === 'hoog' ? 'border-red-400 bg-red-50/50 dark:bg-red-950/10' :
          result.risico === 'matig' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' :
          'border-green-400 bg-green-50 dark:bg-green-950/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Scenario Resultaat</h4>
            <Badge className={getRisicoColor(result.risico)}>
              {getRisicoIcon(result.risico)}
              <span className="ml-1 capitalize">{result.risico} risico</span>
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">DSCR</p>
              <p className={`text-xl font-bold ${
                result.nieuweDSCR < 1 ? 'text-red-600' : 
                result.nieuweDSCR < 1.2 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {result.nieuweDSCR === Infinity ? '∞' : result.nieuweDSCR}
              </p>
              <p className="text-xs text-muted-foreground">
                Was: {huidigeDSCR.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cashflow/mnd</p>
              <p className={`text-xl font-bold ${result.nieuweCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{result.nieuweCashflow.toLocaleString("nl-NL")}
              </p>
              <p className="text-xs text-muted-foreground">
                Was: €{maandelijkseCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vrijheid</p>
              <p className={`text-xl font-bold ${result.nieuweVrijheidJaren < huidigeVrijheidJaren * 0.5 ? 'text-red-600' : 'text-foreground'}`}>
                {result.nieuweVrijheidJaren} jr
              </p>
              <p className="text-xs text-muted-foreground">
                Was: {huidigeVrijheidJaren.toFixed(1)} jr
              </p>
            </div>
          </div>

          {/* Waarschuwingen */}
          {result.risico !== 'laag' && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  result.risico === 'kritiek' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <p className="text-muted-foreground">
                  {result.risico === 'kritiek' && "Je DSCR daalt onder 1.0 → risico op hypotheekproblemen!"}
                  {result.risico === 'hoog' && "Negatieve cashflow — je legt maandelijks geld toe."}
                  {result.risico === 'matig' && "Je buffer wordt kleiner. Overweeg extra reserves aan te houden."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reset knop */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetScenario}>
            <XCircle className="w-4 h-4 mr-1" />
            Reset naar huidige situatie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
