import { useMemo, useState } from "react";
import { 
  ArrowRight, TrendingUp, TrendingDown, Clock, Wallet, 
  AlertTriangle, CheckCircle, Sliders 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;

interface ScenarioComparisonProps {
  goal: Goal;
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyChanges: (changes: Partial<Goal>) => void;
}

export const ScenarioComparison = ({
  goal,
  properties,
  open,
  onOpenChange,
  onApplyChanges,
}: ScenarioComparisonProps) => {
  const [scenarioData, setScenarioData] = useState({
    doelbedrag: Number(goal.doelbedrag),
    maandelijkse_inleg: Number(goal.maandelijkse_inleg || 0),
  });

  const originalRemaining = Number(goal.doelbedrag) - Number(goal.huidig_bedrag);
  const originalMonthly = Number(goal.maandelijkse_inleg || 0);
  const originalMonths = originalMonthly > 0 ? Math.ceil(originalRemaining / originalMonthly) : null;

  const scenarioRemaining = scenarioData.doelbedrag - Number(goal.huidig_bedrag);
  const scenarioMonths = scenarioData.maandelijkse_inleg > 0 
    ? Math.ceil(scenarioRemaining / scenarioData.maandelijkse_inleg) 
    : null;

  const monthsDiff = originalMonths && scenarioMonths ? scenarioMonths - originalMonths : null;
  const inlegDiff = scenarioData.maandelijkse_inleg - originalMonthly;
  const bedragDiff = scenarioData.doelbedrag - Number(goal.doelbedrag);

  const handleApply = () => {
    onApplyChanges({
      doelbedrag: scenarioData.doelbedrag,
      maandelijkse_inleg: scenarioData.maandelijkse_inleg,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Scenario Vergelijken
          </DialogTitle>
          <DialogDescription>
            Pas de waarden aan en zie direct de impact op je doel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Scenario inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Doelbedrag: €{scenarioData.doelbedrag.toLocaleString("nl-NL")}</Label>
              <Slider
                value={[scenarioData.doelbedrag]}
                min={1000}
                max={Math.max(Number(goal.doelbedrag) * 2, 100000)}
                step={1000}
                onValueChange={([value]) => setScenarioData({ ...scenarioData, doelbedrag: value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Maandelijkse inleg: €{scenarioData.maandelijkse_inleg.toLocaleString("nl-NL")}</Label>
              <Slider
                value={[scenarioData.maandelijkse_inleg]}
                min={0}
                max={5000}
                step={50}
                onValueChange={([value]) => setScenarioData({ ...scenarioData, maandelijkse_inleg: value })}
              />
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Huidige situatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Doel:</span>{" "}
                  <span className="font-medium">€{Number(goal.doelbedrag).toLocaleString("nl-NL")}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Inleg:</span>{" "}
                  <span className="font-medium">€{originalMonthly.toLocaleString("nl-NL")}/mnd</span>
                </p>
                {originalMonths && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Bereikt in:</span>{" "}
                    <span className="font-medium">{originalMonths} maanden</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Scenario */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-primary">Nieuw scenario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Doel:</span>{" "}
                  <span className="font-medium">€{scenarioData.doelbedrag.toLocaleString("nl-NL")}</span>
                  {bedragDiff !== 0 && (
                    <span className={`ml-1 text-xs ${bedragDiff > 0 ? "text-destructive" : "text-success"}`}>
                      ({bedragDiff > 0 ? "+" : ""}€{bedragDiff.toLocaleString("nl-NL")})
                    </span>
                  )}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Inleg:</span>{" "}
                  <span className="font-medium">€{scenarioData.maandelijkse_inleg.toLocaleString("nl-NL")}/mnd</span>
                  {inlegDiff !== 0 && (
                    <span className={`ml-1 text-xs ${inlegDiff > 0 ? "text-success" : "text-destructive"}`}>
                      ({inlegDiff > 0 ? "+" : ""}€{inlegDiff.toLocaleString("nl-NL")})
                    </span>
                  )}
                </p>
                {scenarioMonths && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Bereikt in:</span>{" "}
                    <span className="font-medium">{scenarioMonths} maanden</span>
                    {monthsDiff !== null && monthsDiff !== 0 && (
                      <span className={`ml-1 text-xs ${monthsDiff < 0 ? "text-success" : "text-destructive"}`}>
                        ({monthsDiff > 0 ? "+" : ""}{monthsDiff} mnd)
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Impact summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Impact Samenvatting
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {inlegDiff > 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-success" />
                  €{inlegDiff}/mnd extra inleg versnelt je doel
                </li>
              )}
              {inlegDiff < 0 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-warning" />
                  €{Math.abs(inlegDiff)}/mnd minder inleg vertraagt je doel
                </li>
              )}
              {monthsDiff && monthsDiff < 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-success" />
                  Je bereikt je doel {Math.abs(monthsDiff)} maanden eerder
                </li>
              )}
              {monthsDiff && monthsDiff > 0 && (
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-warning" />
                  Je doel schuift {monthsDiff} maanden op
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setScenarioData({
                  doelbedrag: Number(goal.doelbedrag),
                  maandelijkse_inleg: Number(goal.maandelijkse_inleg || 0),
                });
              }}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 gradient-primary text-primary-foreground"
              disabled={
                scenarioData.doelbedrag === Number(goal.doelbedrag) &&
                scenarioData.maandelijkse_inleg === Number(goal.maandelijkse_inleg || 0)
              }
            >
              Wijzigingen Toepassen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
