import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Plane, 
  Coffee, 
  Home, 
  Heart, 
  TrendingUp,
  Sparkles,
  Target
} from "lucide-react";

interface VrijheidsDashboardProps {
  nettoVermogen: number;
  maandelijkseKosten: number;
  maandelijkseCashflow: number;
  laatsteHuurbetaling?: {
    bedrag: number;
    pandNaam: string;
  };
}

export const VrijheidsDashboard = ({
  nettoVermogen,
  maandelijkseKosten,
  maandelijkseCashflow,
  laatsteHuurbetaling,
}: VrijheidsDashboardProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  // Berekeningen
  const vrijheidJaren = maandelijkseKosten > 0 
    ? nettoVermogen / (maandelijkseKosten * 12) 
    : 0;
  
  const vrijheidMaanden = vrijheidJaren * 12;
  
  // Hoeveel vakantieweken per jaar kan je nemen?
  const vakantieBudgetPerWeek = 1500; // Gemiddelde vakantiekosten per week
  const beschikbaarVoorVakantie = Math.max(0, maandelijkseCashflow * 12);
  const vakantieWeken = beschikbaarVoorVakantie / vakantieBudgetPerWeek;

  // Vrijheidspercentage (100% = volledig onafhankelijk)
  const vrijheidsPercentage = maandelijkseKosten > 0 
    ? Math.min(100, (maandelijkseCashflow / maandelijkseKosten) * 100)
    : 0;

  // Hoeveel uur vrijheid per huurbetaling
  const urenVrijheidPerHuur = laatsteHuurbetaling 
    ? (laatsteHuurbetaling.bedrag / (maandelijkseKosten / 720)) // 720 uur per maand
    : 0;

  // Status bepalen
  const getVrijheidsStatus = () => {
    if (vrijheidsPercentage >= 100) return { label: "Financieel Onafhankelijk", color: "bg-green-500", emoji: "🎉" };
    if (vrijheidsPercentage >= 75) return { label: "Bijna Onafhankelijk", color: "bg-green-400", emoji: "🌟" };
    if (vrijheidsPercentage >= 50) return { label: "Op Weg", color: "bg-yellow-400", emoji: "🚀" };
    if (vrijheidsPercentage >= 25) return { label: "Groeiend", color: "bg-blue-400", emoji: "📈" };
    return { label: "Startend", color: "bg-gray-400", emoji: "🌱" };
  };

  const status = getVrijheidsStatus();

  // Animatie bij huurbetaling
  useEffect(() => {
    if (laatsteHuurbetaling && laatsteHuurbetaling.bedrag > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [laatsteHuurbetaling]);

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Vrijheidsdashboard
          <InfoTooltip
            title="Vrijheidsdashboard"
            content="Dit dashboard toont wat je vermogen en cashflow betekenen in termen van vrijheid en levensstijl."
          />
        </CardTitle>
        <CardDescription>
          Wat je vermogen voor je kan doen
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Animatie bij huurbetaling */}
        {showAnimation && laatsteHuurbetaling && (
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  +€{laatsteHuurbetaling.bedrag.toLocaleString("nl-NL")} van {laatsteHuurbetaling.pandNaam}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  → +{Math.round(urenVrijheidPerHuur)} uur vrijheid! 🎉
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vrijheidsmeter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Vrijheid</span>
            <Badge className={`${status.color} text-white`}>
              {status.emoji} {status.label}
            </Badge>
          </div>
          <Progress value={vrijheidsPercentage} className="h-4" />
          <p className="text-center text-2xl font-bold text-primary">
            {Math.round(vrijheidsPercentage)}%
          </p>
        </div>

        {/* Vrijheidsindicatoren */}
        <div className="grid grid-cols-2 gap-4">
          {/* Levensstijl jaren */}
          <div className="p-4 bg-accent/30 rounded-xl text-center space-y-2">
            <Home className="w-6 h-6 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {vrijheidJaren.toFixed(1)} jaar
            </p>
            <p className="text-xs text-muted-foreground">
              levensstijl gedekt
            </p>
            <InfoTooltip
              title="Levensstijl Jaren"
              content={`Je netto vermogen dekt ${vrijheidJaren.toFixed(1)} jaar van je huidige levenskosten (€${maandelijkseKosten.toLocaleString("nl-NL")}/maand).`}
              className="mx-auto"
            />
          </div>

          {/* Vakantie weken */}
          <div className="p-4 bg-accent/30 rounded-xl text-center space-y-2">
            <Plane className="w-6 h-6 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {Math.floor(vakantieWeken)} weken
            </p>
            <p className="text-xs text-muted-foreground">
              vakantie per jaar
            </p>
            <InfoTooltip
              title="Vakantie Weken"
              content={`Je jaarlijkse cashflow (€${beschikbaarVoorVakantie.toLocaleString("nl-NL")}) dekt ongeveer ${Math.floor(vakantieWeken)} weken vakantie.`}
              className="mx-auto"
            />
          </div>
        </div>

        {/* FIRE-status */}
        {vrijheidsPercentage >= 100 ? (
          <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl text-center">
            <Heart className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="font-semibold text-green-700 dark:text-green-300">
              🎉 Je kunt vandaag stoppen met werken!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Je passieve inkomen dekt je levenskosten volledig.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Om vandaag te stoppen...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Je hebt nog €{Math.round((maandelijkseKosten - maandelijkseCashflow) * 12).toLocaleString("nl-NL")} 
              {" "}extra jaarlijkse cashflow nodig om je levenskosten volledig te dekken.
            </p>
          </div>
        )}

        {/* Cashflow impact */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maandelijkse cashflow</span>
            <span className={`font-medium ${maandelijkseCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{maandelijkseCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Maandelijkse kosten</span>
            <span className="font-medium text-foreground">
              €{maandelijkseKosten.toLocaleString("nl-NL")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
