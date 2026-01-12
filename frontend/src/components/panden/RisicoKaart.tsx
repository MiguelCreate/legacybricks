import { AlertTriangle, Scale, TrendingDown, Landmark, Wrench, Users, PiggyBank } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Badge } from "@/components/ui/badge";

interface RisicoKaartProps {
  juridisch: number;
  markt: number;
  fiscaal: number;
  fysiek: number;
  operationeel: number;
  onChange?: (field: string, value: number) => void;
  readonly?: boolean;
  vveReservePercentage?: number; // Optional: percentage of VvE reserve filled
}

const risicoConfig = {
  juridisch: {
    label: "Juridisch",
    icon: Scale,
    tooltip: "Risico op juridische problemen: Airbnb-beperkingen, huurwetgeving, vergunningen.",
  },
  markt: {
    label: "Markt",
    icon: TrendingDown,
    tooltip: "Marktrisico: vraag/aanbod, oververhitting, economische omstandigheden.",
  },
  fiscaal: {
    label: "Fiscaal",
    icon: Landmark,
    tooltip: "Fiscaal risico: belastingverhogingen, nieuwe regelgeving, IMI/IRS wijzigingen.",
  },
  fysiek: {
    label: "Fysiek",
    icon: Wrench,
    tooltip: "Fysiek risico: aardbevingsgebied, overstromingsgevaar, onderhoudsstaat.",
  },
  operationeel: {
    label: "Operationeel",
    icon: Users,
    tooltip: "Operationeel risico: beheerderskwaliteit, huurdersproblematiek, afstand.",
  },
};

const getScoreColor = (score: number) => {
  if (score <= 2) return "bg-success text-success-foreground";
  if (score <= 3) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
};

const getTotalScoreColor = (total: number) => {
  if (total < 10) return "text-success";
  if (total <= 15) return "text-warning";
  return "text-destructive";
};

const getTotalScoreLabel = (total: number) => {
  if (total < 10) return "Laag risico";
  if (total <= 15) return "Gemiddeld risico";
  return "Hoog risico";
};

// Calculate fysiek risk modifier based on VvE reserve
const getVvEModifier = (vveReservePercentage: number | undefined): number => {
  if (vveReservePercentage === undefined) return 0;
  if (vveReservePercentage >= 80) return -1; // Reduces physical risk
  if (vveReservePercentage < 50) return 1;   // Increases physical risk
  return 0;
};

export const RisicoKaart = ({
  juridisch,
  markt,
  fiscaal,
  fysiek,
  operationeel,
  onChange,
  readonly = false,
  vveReservePercentage,
}: RisicoKaartProps) => {
  const vveModifier = getVvEModifier(vveReservePercentage);
  const adjustedFysiek = Math.max(1, Math.min(5, fysiek + vveModifier));
  
  const scores = { juridisch, markt, fiscaal, fysiek: adjustedFysiek, operationeel };
  const totalScore = juridisch + markt + fiscaal + adjustedFysiek + operationeel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Risicokaart</h3>
          <InfoTooltip
            title="Risicokaart"
            content="Score per categorie van 1 (laag) tot 5 (hoog). Totaalscore: <10 groen, 10-15 geel, >15 rood. VvE-reservepot beïnvloedt fysiek risico."
          />
        </div>
        <div className="flex items-center gap-2">
          {vveReservePercentage !== undefined && vveModifier !== 0 && (
            <Badge variant={vveModifier < 0 ? "default" : "destructive"} className="text-xs flex items-center gap-1">
              <PiggyBank className="w-3 h-3" />
              VvE {vveModifier < 0 ? "-1" : "+1"}
            </Badge>
          )}
          <div className={`px-3 py-1 rounded-lg font-semibold ${getTotalScoreColor(totalScore)}`}>
            {totalScore}/25 - {getTotalScoreLabel(totalScore)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(risicoConfig) as Array<keyof typeof risicoConfig>).map((key) => {
          const config = risicoConfig[key];
          const Icon = config.icon;
          const score = scores[key];
          const baseScore = key === "fysiek" ? fysiek : score;
          const showModifier = key === "fysiek" && vveModifier !== 0;

          return (
            <div key={key} className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                  {config.label}
                </span>
              </div>
              
              {readonly ? (
                <div className="relative">
                  <div
                    className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold ${getScoreColor(score)}`}
                  >
                    {score}
                  </div>
                  {showModifier && (
                    <span className={`absolute -top-1 -right-1 text-[10px] font-bold ${vveModifier < 0 ? "text-success" : "text-destructive"}`}>
                      {vveModifier < 0 ? "↓" : "↑"}
                    </span>
                  )}
                </div>
              ) : (
                <select
                  value={baseScore}
                  onChange={(e) => onChange?.(key, parseInt(e.target.value))}
                  className={`w-full h-10 rounded-lg text-center font-bold border-0 cursor-pointer ${getScoreColor(score)}`}
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">
                {config.tooltip.split(":")[0]}
              </p>
            </div>
          );
        })}
      </div>
      
      {vveReservePercentage !== undefined && (
        <p className="text-xs text-muted-foreground text-center">
          VvE-reservepot: {vveReservePercentage.toFixed(0)}% gevuld 
          {vveModifier < 0 && " → fysiek risico verlaagd"}
          {vveModifier > 0 && " → fysiek risico verhoogd"}
        </p>
      )}
    </div>
  );
};
