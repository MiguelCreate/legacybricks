import { 
  Building2, TrendingUp, Calendar, Percent, Trash2, Edit, 
  PauseCircle, PlayCircle, AlertTriangle, Clock, Wallet, Heart,
  Sliders, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { GOAL_TYPES, GOAL_CATEGORIES, PRIORITY_OPTIONS } from "./goalTypes";
import type { Tables } from "@/integrations/supabase/types";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { nl } from "date-fns/locale";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;

interface GoalCardProps {
  goal: Goal;
  properties: Property[];
  monthlySurplus: number | null;
  monthsToGoal: number | null;
  estimatedEndDate: Date | null;
  conflictWarnings: string[];
  riskLevel: "low" | "medium" | "high";
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onTogglePause: (goal: Goal) => void;
  onScenario?: (goal: Goal) => void;
}

const getCategoryIcon = (categorie: string) => {
  switch (categorie) {
    case "vastgoed":
      return Building2;
    case "vermogen":
      return Wallet;
    case "persoonlijk":
      return Heart;
    default:
      return Wallet;
  }
};

export const GoalCard = ({
  goal,
  properties,
  monthlySurplus,
  monthsToGoal,
  estimatedEndDate,
  conflictWarnings,
  riskLevel,
  onEdit,
  onDelete,
  onScenario,
  onTogglePause,
}: GoalCardProps) => {
  // Calculate timeline progress if we have start and end dates
  const timelineProgress = (() => {
    if (!goal.start_datum) return null;
    const startDate = new Date(goal.start_datum);
    const today = new Date();
    
    if (goal.eind_datum) {
      const endDate = new Date(goal.eind_datum);
      const totalDays = differenceInDays(endDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);
      if (totalDays <= 0) return 100;
      return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    } else if (estimatedEndDate) {
      const totalDays = differenceInDays(estimatedEndDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);
      if (totalDays <= 0) return 100;
      return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    }
    return null;
  })();
  
  // Check if behind schedule
  const isBehindSchedule = (() => {
    if (!goal.eind_datum || !estimatedEndDate) return false;
    return estimatedEndDate > new Date(goal.eind_datum);
  })();
  const progress = (Number(goal.huidig_bedrag) / Number(goal.doelbedrag)) * 100;
  const linkedProperty = properties.find(p => p.id === goal.bron_property_id);
  
  const goalTypeInfo = GOAL_TYPES[goal.doel_type as keyof typeof GOAL_TYPES] || GOAL_TYPES.overig;
  const categoryInfo = GOAL_CATEGORIES[goal.categorie as keyof typeof GOAL_CATEGORIES] || GOAL_CATEGORIES.persoonlijk;
  const priorityInfo = PRIORITY_OPTIONS.find(p => p.value === goal.prioriteit) || PRIORITY_OPTIONS[1];
  
  const CategoryIcon = getCategoryIcon(goal.categorie || "persoonlijk");
  const isPaused = goal.gepauzeerd;
  
  return (
    <div
      className={`p-5 bg-card rounded-xl border shadow-card transition-all hover:shadow-lg ${
        isPaused ? "opacity-60" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${categoryInfo.bgColor} flex items-center justify-center`}>
            <CategoryIcon className={`w-5 h-5 ${categoryInfo.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{goal.naam}</h3>
              {isPaused && (
                <Badge variant="outline" className="text-xs">Gepauzeerd</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{goalTypeInfo.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${priorityInfo.color}`}
          >
            {priorityInfo.label}
          </Badge>
          <span className="text-2xl font-bold text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Progress bar with timeline indicator */}
      <div className="space-y-2 mb-4">
        <Progress value={progress} className="h-3" />
        
        {/* Timeline progress bar */}
        {timelineProgress !== null && (
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                Tijdlijn
              </span>
              <span className={isBehindSchedule ? "text-destructive font-medium" : ""}>
                {timelineProgress.toFixed(0)}% verstreken
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isBehindSchedule ? "bg-destructive" : 
                  timelineProgress > progress ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${timelineProgress}%` }}
              />
            </div>
            {isBehindSchedule && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Je loopt achter op schema
              </p>
            )}
          </div>
        )}
      </div>

      {/* Amount info */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-muted-foreground">
          €{Number(goal.huidig_bedrag).toLocaleString("nl-NL")}
        </span>
        <span className="font-medium text-foreground">
          €{Number(goal.doelbedrag).toLocaleString("nl-NL")}
        </span>
      </div>

      {/* Linked source info */}
      <div className="p-3 bg-muted/50 rounded-lg mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Bronpand:</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {linkedProperty?.naam || "Geen gekoppeld"}
          </span>
        </div>
        
        {linkedProperty && monthlySurplus !== null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Maandelijks overschot:</span>
            </div>
            <span className={`text-sm font-medium ${monthlySurplus >= 0 ? 'text-success' : 'text-destructive'}`}>
              €{monthlySurplus.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
        
        {Number(goal.maandelijkse_inleg || 0) > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Handmatige inleg:</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              €{Number(goal.maandelijkse_inleg).toLocaleString('nl-NL')}/mnd
            </span>
          </div>
        )}
      </div>

      {/* Timeline info */}
      <div className="flex flex-col gap-2 mb-4">
        {goal.start_datum && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Start: {format(new Date(goal.start_datum), "d MMM yyyy", { locale: nl })}</span>
          </div>
        )}
        
        {goal.eind_datum && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Deadline: {format(new Date(goal.eind_datum), "d MMM yyyy", { locale: nl })}</span>
          </div>
        )}
        
        {estimatedEndDate && monthsToGoal && monthsToGoal > 0 && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <Calendar className="w-3 h-3" />
            <span>Geschatte einddatum: {format(estimatedEndDate, "d MMM yyyy", { locale: nl })} (~{monthsToGoal} mnd)</span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {conflictWarnings.length > 0 && (
        <div className={`p-3 rounded-lg mb-4 space-y-1 ${
          riskLevel === "high" ? "bg-destructive/10" : "bg-warning/10"
        }`}>
          {conflictWarnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <AlertTriangle className={`w-3 h-3 mt-0.5 ${
                riskLevel === "high" ? "text-destructive" : "text-warning"
              }`} />
              <span className={riskLevel === "high" ? "text-destructive" : "text-warning"}>
                {warning}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {monthsToGoal !== null && monthsToGoal > 0 ? (
            <>
              <Calendar className="w-4 h-4" />
              <span>~{monthsToGoal} maanden</span>
            </>
          ) : monthsToGoal === 0 ? (
            <span className="text-success font-medium">Bijna bereikt!</span>
          ) : (
            <>
              <Percent className="w-4 h-4" />
              <span>Voeg inleg of bron toe</span>
            </>
          )}
        </div>
        
        <div className="flex gap-1">
          {onScenario && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onScenario(goal)}
              title="Scenario vergelijken"
            >
              <Sliders className="w-4 h-4 text-primary" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTogglePause(goal)}
            title={isPaused ? "Hervatten" : "Pauzeren"}
          >
            {isPaused ? (
              <PlayCircle className="w-4 h-4 text-success" />
            ) : (
              <PauseCircle className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(goal)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(goal)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Flexibility indicator */}
      {goal.flexibiliteit && (
        <div className="mt-3 text-xs text-muted-foreground">
          <InfoTooltip
            title="Flexibiliteit"
            content={goal.flexibiliteit === "vast" 
              ? "De einddatum staat vast, de inleg past zich aan" 
              : "Flexibel in tijd en inleg, afhankelijk van cashflow"
            }
          />
          <span className="ml-1">
            {goal.flexibiliteit === "vast" ? "Vaste deadline" : "Adaptief doel"}
          </span>
        </div>
      )}
    </div>
  );
};
