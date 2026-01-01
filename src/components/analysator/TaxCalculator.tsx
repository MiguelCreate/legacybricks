import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Building2, 
  CalendarDays, 
  Euro, 
  Info,
  TrendingDown,
  Receipt
} from "lucide-react";
import {
  calculateIMT2025,
  calculateIMI,
  calculateIRS,
  estimateVPT
} from "@/lib/portugueseTaxCalculations";
import type { AnalysisInputs } from "@/lib/rendementsCalculations";

interface TaxCalculatorProps {
  inputs: AnalysisInputs;
  propertyName?: string;
}

export const TaxCalculator = ({ inputs, propertyName = "Nieuw Pand" }: TaxCalculatorProps) => {
  const taxCalculation = useMemo(() => {
    const aankoopprijs = inputs.purchasePrice || 0;
    
    // Calculate monthly rent based on rental type
    let maandHuur = 0;
    if (inputs.rentalType === "longterm") {
      maandHuur = inputs.monthlyRentLT || 0;
    } else if (inputs.rentalType === "shortterm") {
      // Short-term: (ADR * occupancy% * 30 days)
      maandHuur = (inputs.stADR || 0) * ((inputs.stOccupancy || 0) / 100) * 30;
    } else {
      // Mixed: combine both
      const stIncome = (inputs.stADR || 0) * ((inputs.stOccupancy || 0) / 100) * 30 * 0.5;
      const ltIncome = (inputs.monthlyRentLT || 0) * 0.5;
      maandHuur = stIncome + ltIncome;
    }
    
    const vptWaarde = estimateVPT(aankoopprijs, 60);
    const imiTarief = inputs.imiYearly && aankoopprijs > 0 
      ? (inputs.imiYearly / vptWaarde) * 100 
      : 0.5;

    // Calculate IMT (one-time at purchase)
    const imtResult = calculateIMT2025(aankoopprijs, 'niet-woning');
    
    // Calculate IMI (annual)
    const imiResult = calculateIMI(vptWaarde, 'standaard', imiTarief);
    
    // Calculate IRS (rental income tax) - use new 2026 regime
    const irsResult = calculateIRS({
      jaarHuurinkomst: 2026,
      maandHuur,
      contractduurJaren: 5,
      englobamento: false
    });

    return {
      maandHuur,
      imt: imtResult,
      imi: imiResult,
      irs: irsResult,
      totalJaarlijksBelasting: imiResult.jaarlijksBedrag + irsResult.jaarlijksBedrag,
      totalMaandelijksBelasting: (imiResult.jaarlijksBedrag + irsResult.jaarlijksBedrag) / 12
    };
  }, [inputs]);

  const formatCurrency = (value: number) => 
    `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Portugese Belastingen
          <InfoTooltip 
            title="Belastingberekening"
            content="Berekening van IMT (overdrachtsbelasting), IMI (onroerendgoedbelasting) en IRS (inkomstenbelasting op huur) voor dit pand."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">IMT (eenmalig)</span>
            </div>
            <p className="text-lg font-bold text-primary">{formatCurrency(taxCalculation.imt.bedrag)}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CalendarDays className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">IMI (jaarlijks)</span>
            </div>
            <p className="text-lg font-bold text-warning">{formatCurrency(taxCalculation.imi.jaarlijksBedrag)}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Euro className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">IRS (jaarlijks)</span>
            </div>
            <p className="text-lg font-bold text-destructive">{formatCurrency(taxCalculation.irs.jaarlijksBedrag)}</p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Totaal/maand</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(taxCalculation.totalMaandelijksBelasting)}</p>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-muted/30 rounded-lg gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{propertyName}</span>
            {taxCalculation.maandHuur > 0 ? (
              <Badge variant="outline" className="text-xs bg-success/10 text-success">
                €{taxCalculation.maandHuur.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}/mnd
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-warning/10 text-warning">
                Geen huur
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="gap-1">
              {taxCalculation.imt.marginaalTarief}% IMT
            </Badge>
            <Badge 
              variant="outline" 
              className={`gap-1 ${taxCalculation.irs.tarief <= 10 ? 'bg-success/10' : 'bg-destructive/10'}`}
            >
              {taxCalculation.irs.tarief}% IRS
            </Badge>
          </div>
        </div>

        {/* Netto Huur Summary */}
        {taxCalculation.maandHuur > 0 && (
          <div className="p-3 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Netto huurinkomen na belasting</p>
                <p className="text-muted-foreground">
                  Bruto: {formatCurrency(taxCalculation.irs.brutoJaarHuur)}/jaar → 
                  Netto: <span className="text-success font-medium">{formatCurrency(taxCalculation.irs.nettoJaarHuur)}/jaar</span>
                  {" "}({formatCurrency(taxCalculation.irs.nettoJaarHuur / 12)}/maand)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-xs">
          <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
          <p className="text-muted-foreground">
            <strong>IMT:</strong> {taxCalculation.imt.marginaalTarief}% voor investeerders. 
            <strong> IMI:</strong> ±{taxCalculation.imi.tarief}% van VPT.
            <strong> IRS:</strong> Nieuwe regeling 2026: {taxCalculation.irs.tarief}%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
