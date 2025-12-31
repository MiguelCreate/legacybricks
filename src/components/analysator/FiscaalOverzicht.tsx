import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertCircle } from "lucide-react";

interface FiscaalOverzichtProps {
  jaarlijkseHuur: number;
  verkoopwinst: number;
  renovatieKosten: number;
  portefeuilleWaarde: number;
}

export const FiscaalOverzicht = ({
  jaarlijkseHuur,
  verkoopwinst,
  renovatieKosten,
  portefeuilleWaarde,
}: FiscaalOverzichtProps) => {
  const formatCurrency = (value: number) => 
    `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

  // Belastingberekeningen
  const fiscaleData = [
    {
      categorie: "Huurinkomsten",
      portugal: {
        percentage: "28%",
        bedrag: jaarlijkseHuur * 0.28,
        toelichting: "IRS (niet-ingezetene)",
      },
      nederland: {
        percentage: "30-52%",
        bedrag: jaarlijkseHuur * 0.36, // Gemiddelde schatting
        toelichting: "Box 3 of Box 1 (afhankelijk van structuur)",
      },
    },
    {
      categorie: "Meerwaarde bij verkoop",
      portugal: {
        percentage: "28%",
        bedrag: verkoopwinst * 0.28,
        toelichting: "Plusvalia (50% vrijstelling mogelijk bij herinvestering)",
      },
      nederland: {
        percentage: "0-30%",
        bedrag: verkoopwinst * 0.15, // Gemiddelde schatting
        toelichting: "Afhankelijk van houdduur en structuur",
      },
    },
    {
      categorie: "Erfopvolging",
      portugal: {
        percentage: "Tot 60%",
        bedrag: portefeuilleWaarde * 0.10, // Schatting voor directe familie
        toelichting: "Bij persoonlijk eigendom (niet via BV)",
      },
      nederland: {
        percentage: "0-40%",
        bedrag: portefeuilleWaarde * 0.20, // Gemiddelde schatting
        toelichting: "Afhankelijk van verwantschap",
      },
    },
    {
      categorie: "Renovatie voordeel",
      portugal: {
        percentage: "Tot 100%",
        bedrag: Math.min(renovatieKosten, 15000),
        toelichting: "Reabilitação Urbana subsidie (max €15.000)",
      },
      nederland: {
        percentage: "0%",
        bedrag: 0,
        toelichting: "Geen renovatiesubsidie (tenzij via BV)",
      },
    },
  ];

  const totaalPortugal = fiscaleData.reduce((sum, item) => {
    if (item.categorie === "Renovatie voordeel") {
      return sum - item.portugal.bedrag;
    }
    return sum + item.portugal.bedrag;
  }, 0);

  const totaalNederland = fiscaleData.reduce((sum, item) => {
    if (item.categorie === "Renovatie voordeel") {
      return sum - item.nederland.bedrag;
    }
    return sum + item.nederland.bedrag;
  }, 0);

  const verschil = totaalNederland - totaalPortugal;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Fiscaal Impact-overzicht
          <InfoTooltip
            title="Fiscaal Overzicht"
            content="Vergelijk de belastingimpact tussen Portugal en Nederland voor je vastgoedinvesteringen. Let op: dit is een indicatieve schatting."
          />
        </CardTitle>
        <CardDescription>
          Portugal vs. Nederland belastingvergelijking
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Waarschuwing */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Indicatieve berekening</p>
            <p className="text-muted-foreground">
              Deze cijfers zijn schattingen. Raadpleeg een fiscalist voor exacte berekeningen.
            </p>
          </div>
        </div>

        {/* Vergelijkingstabel */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Belasting</TableHead>
                <TableHead className="text-center">
                  🇵🇹 Portugal
                </TableHead>
                <TableHead className="text-center">
                  🇳🇱 Nederland
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fiscaleData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {item.categorie}
                      <InfoTooltip
                        title={item.categorie}
                        content={`Portugal: ${item.portugal.toelichting}. Nederland: ${item.nederland.toelichting}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">
                        {item.portugal.percentage}
                      </Badge>
                      <p className={`text-sm ${item.categorie === "Renovatie voordeel" ? 'text-green-600' : 'text-red-600'}`}>
                        {item.categorie === "Renovatie voordeel" ? '-' : ''}{formatCurrency(item.portugal.bedrag)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30">
                        {item.nederland.percentage}
                      </Badge>
                      <p className={`text-sm ${item.categorie === "Renovatie voordeel" ? 'text-green-600' : 'text-red-600'}`}>
                        {item.categorie === "Renovatie voordeel" ? '-' : ''}{formatCurrency(item.nederland.bedrag)}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totaal rij */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Totaal Belasting (schatting)</TableCell>
                <TableCell className="text-center text-red-600">
                  {formatCurrency(totaalPortugal)}
                </TableCell>
                <TableCell className="text-center text-red-600">
                  {formatCurrency(totaalNederland)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Samenvatting */}
        <div className={`p-4 rounded-lg ${verschil > 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <p className="text-sm font-medium text-foreground">
            {verschil > 0 
              ? `💡 Portugal kan je ~${formatCurrency(Math.abs(verschil))} per jaar besparen`
              : `⚠️ Nederland kan voordeliger zijn (~${formatCurrency(Math.abs(verschil))} verschil)`
            }
          </p>
        </div>

        {/* BV Tip */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">💼 Tip:</strong> Als je via een Nederlandse BV investeert, 
            daalt jouw Nederlandse belasting, maar stijgen administratiekosten. 
            Overweeg dit bij portefeuilles boven €500.000.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
