import { useMemo } from "react";
import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GOAL_TYPES, type GoalType } from "./goalTypes";
import type { Tables } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;
type Profile = Tables<"profiles">;

interface SmartSuggestionsProps {
  goals: Goal[];
  properties: Property[];
  profile: Profile | null;
  onSuggestGoal: (type: GoalType) => void;
}

export const SmartSuggestions = ({
  goals,
  properties,
  profile,
  onSuggestGoal,
}: SmartSuggestionsProps) => {
  const suggestions = useMemo(() => {
    const activeGoals = goals.filter(g => !g.bereikt);
    const activeGoalTypes = activeGoals.map(g => g.doel_type);
    const suggestionList: { type: GoalType; reason: string; priority: number }[] = [];
    
    const age = profile?.huidige_leeftijd;
    const propertyCount = properties.length;
    const hasNoodbuffer = activeGoalTypes.includes("noodbuffer") || 
      activeGoals.some(g => g.doel_type === "noodbuffer" && g.bereikt);
    
    // Suggest noodbuffer if not present
    if (!hasNoodbuffer) {
      suggestionList.push({
        type: "noodbuffer",
        reason: "Een noodbuffer is essentieel voordat je investeert. Start hier!",
        priority: 10,
      });
    }
    
    // Suggest first property if none owned
    if (propertyCount === 0 && !activeGoalTypes.includes("eerste_pand")) {
      suggestionList.push({
        type: "eerste_pand",
        reason: "Je hebt nog geen pand. Begin met sparen voor je eerste beleggingspand.",
        priority: 8,
      });
    }
    
    // Suggest next property if already owning some
    if (propertyCount > 0 && propertyCount < 5 && !activeGoalTypes.includes("volgend_pand")) {
      suggestionList.push({
        type: "volgend_pand",
        reason: `Met ${propertyCount} pand(en) kun je uitbreiden naar een groter portfolio.`,
        priority: 6,
      });
    }
    
    // Suggest maintenance buffer for existing properties
    if (propertyCount > 0 && !activeGoalTypes.includes("leegstand_buffer") && !activeGoalTypes.includes("renovatie")) {
      suggestionList.push({
        type: "leegstand_buffer",
        reason: "Een buffer voor leegstand en onderhoud beschermt je cashflow.",
        priority: 7,
      });
    }
    
    // Age-based suggestions
    if (age) {
      if (age < 35 && !activeGoalTypes.includes("fire")) {
        suggestionList.push({
          type: "fire",
          reason: "Op jouw leeftijd heb je tijd om naar FIRE te werken. Start nu!",
          priority: 5,
        });
      }
      
      if (age >= 35 && age < 50 && !activeGoalTypes.includes("pensioen")) {
        suggestionList.push({
          type: "pensioen",
          reason: "Begin nu met aanvullend pensioen naast je vastgoed.",
          priority: 6,
        });
      }
      
      if (age >= 50 && !activeGoalTypes.includes("legacy")) {
        suggestionList.push({
          type: "legacy",
          reason: "Denk na over je nalatenschap en vermogensoverdracht.",
          priority: 5,
        });
      }
      
      if (age >= 30 && age < 50 && !activeGoalTypes.includes("studie_kinderen")) {
        suggestionList.push({
          type: "studie_kinderen",
          reason: "Sparen voor de studie van je kinderen kan nu beginnen.",
          priority: 4,
        });
      }
    }
    
    // Tax buffer suggestion
    if (propertyCount > 2 && !activeGoalTypes.includes("belasting_buffer")) {
      suggestionList.push({
        type: "belasting_buffer",
        reason: "Met meerdere panden is een belastingbuffer verstandig.",
        priority: 5,
      });
    }
    
    // Passion project suggestion
    if (activeGoals.length >= 2 && !activeGoalTypes.includes("sabbatical")) {
      suggestionList.push({
        type: "sabbatical",
        reason: "Vergeet niet te genieten! Spaar voor iets leuks voor jezelf.",
        priority: 2,
      });
    }
    
    // Sort by priority and return top 3
    return suggestionList
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }, [goals, properties, profile]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Slimme Suggesties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Op basis van je situatie raden we deze doelen aan:
        </p>
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const typeInfo = GOAL_TYPES[suggestion.type];
            return (
              <div
                key={suggestion.type}
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    {typeInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.reason}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSuggestGoal(suggestion.type)}
                  className="ml-4"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Toevoegen
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
