import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InvestmentPartner } from "@/lib/sharedInvestmentCalculations";

interface PartnerMetrics {
  partner: InvestmentPartner;
  eigenInleg: number;
  maandHuur: number;
  jaarHuur: number;
  coc: number;
  exitValue: number;
  irr: number;
}

interface AdvancedMetricsTableProps {
  partners: PartnerMetrics[];
  totalInvestment: number;
  formatCurrency: (amount: number) => string;
}

export const AdvancedMetricsTable = ({
  partners,
  totalInvestment,
  formatCurrency,
}: AdvancedMetricsTableProps) => {
  // Bereken totalen
  const totals = {
    eigenInleg: partners.reduce((sum, p) => sum + p.eigenInleg, 0),
    maandHuur: partners.reduce((sum, p) => sum + p.maandHuur, 0),
    jaarHuur: partners.reduce((sum, p) => sum + p.jaarHuur, 0),
    exitValue: partners.reduce((sum, p) => sum + p.exitValue, 0),
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Verdeling per Investeerder
        </h2>
        <p className="text-sm text-muted-foreground">
          Volledige financiële analyse met alle kengetallen
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Investeerder</TableHead>
                <TableHead className="text-right font-bold">Aandeel</TableHead>
                <TableHead className="text-right font-bold">Eigen Inleg</TableHead>
                <TableHead className="text-right font-bold">Maand Huur (netto)</TableHead>
                <TableHead className="text-right font-bold">Jaar Huur (netto)</TableHead>
                <TableHead className="text-right font-bold">Cash-on-Cash</TableHead>
                <TableHead className="text-right font-bold">Exit (10j)</TableHead>
                <TableHead className="text-right font-bold">IRR (10j)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((metrics, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {metrics.partner.naam}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {metrics.partner.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(metrics.eigenInleg)}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    {formatCurrency(metrics.maandHuur)}
                  </TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {formatCurrency(metrics.jaarHuur)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        metrics.coc >= 10
                          ? "default"
                          : metrics.coc >= 6
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {metrics.coc.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-primary font-medium">
                    {formatCurrency(metrics.exitValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        metrics.irr >= 15
                          ? "default"
                          : metrics.irr >= 10
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {metrics.irr.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totalen rij */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Totaal</TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.eigenInleg)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.maandHuur)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.jaarHuur)}</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.exitValue)}</TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legenda */}
      <Card className="p-4 bg-muted/30">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">📖 Toelichting</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Eigen Inleg:</span> Totaal geïnvesteerd bedrag minus hypotheek
            </div>
            <div>
              <span className="font-medium">Maand Huur (netto):</span> Huur min OPEX en hypotheeklasten
            </div>
            <div>
              <span className="font-medium">Cash-on-Cash:</span> (Jaar netto huur / Eigen inleg) × 100%
            </div>
            <div>
              <span className="font-medium">Exit:</span> Aandeel verkoopwaarde minus restschuld
            </div>
            <div>
              <span className="font-medium">IRR:</span> Gemiddeld jaarlijks rendement over 10 jaar (incl. huur & exit)
            </div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-warning/5 border-warning/20">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">⚠️ Belangrijk</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Als een investeerder een eigen hypotheek heeft, wijkt zijn cashflow af van de anderen</li>
            <li>IRR houdt rekening met alle cashflows over tijd en de uiteindelijke verkoop</li>
            <li>Zorg voor een schriftelijke overeenkomst over deze verdeling</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
