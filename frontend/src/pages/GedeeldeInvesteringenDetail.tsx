import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Download, TrendingUp, DollarSign, Percent, Home } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import {
  calculateTotalInvestment,
  calculatePartnerInvestment,
  calculatePartnerMonthlyRent,
  calculatePartnerAnnualRent,
  calculateCashOnCash,
  calculatePartnerExitValue,
  calculateIRR,
  getRatingForCashOnCash,
  getRatingForIRR,
  getRatingForMonthlyRent,
  type InvestmentPartner,
  type SharedInvestmentData,
} from "@/lib/sharedInvestmentCalculations";
import { BeginnerMetricCard } from "@/components/shared-investment/BeginnerMetricCard";
import { AdvancedMetricsTable } from "@/components/shared-investment/AdvancedMetricsTable";

type SharedInvestment = Tables<"shared_investments">;
type Partner = Tables<"investment_partners">;

const GedeeldeInvesteringenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investment, setInvestment] = useState<SharedInvestment | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mode toggle - opslaan in localStorage
  const [isBeginnerMode, setIsBeginnerMode] = useState(() => {
    const saved = localStorage.getItem("sharedInvestmentMode");
    return saved === null ? true : saved === "beginner";
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    localStorage.setItem("sharedInvestmentMode", isBeginnerMode ? "beginner" : "advanced");
  }, [isBeginnerMode]);

  const fetchData = async () => {
    try {
      const [investmentRes, partnersRes] = await Promise.all([
        supabase.from("shared_investments").select("*").eq("id", id).single(),
        supabase.from("investment_partners").select("*").eq("shared_investment_id", id),
      ]);

      if (investmentRes.error) throw investmentRes.error;
      if (partnersRes.error) throw partnersRes.error;

      setInvestment(investmentRes.data);
      setPartners(partnersRes.data || []);
    } catch (error: any) {
      toast({
        title: "Fout bij laden",
        description: error.message,
        variant: "destructive",
      });
      navigate("/gedeelde-investeringen");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsBeginnerMode(!isBeginnerMode);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto p-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!investment) {
    return null;
  }

  const investmentData: SharedInvestmentData = {
    aankoopprijs: Number(investment.aankoopprijs),
    renovatie_kosten: Number(investment.renovatie_kosten || 0),
    imt: Number(investment.imt || 0),
    maand_huur: Number(investment.maand_huur),
    jaarlijkse_opex: Number(investment.jaarlijkse_opex || 0),
    verkoopwaarde_10j: Number(investment.verkoopwaarde_10j),
    indexatie_percentage: Number(investment.indexatie_percentage || 2),
  };

  const totalInvestment = calculateTotalInvestment(investmentData);

  // Bereken metrics voor alle partners
  const partnerMetrics = partners.map((partner) => {
    const partnerData: InvestmentPartner = {
      naam: partner.naam,
      percentage: Number(partner.percentage),
      eigen_hypotheek_bedrag: Number(partner.eigen_hypotheek_bedrag || 0),
      rente_percentage: Number(partner.rente_percentage || 0),
      looptijd_jaren: Number(partner.looptijd_jaren || 30),
    };

    const eigenInleg = calculatePartnerInvestment(
      totalInvestment,
      partnerData.percentage,
      partnerData.eigen_hypotheek_bedrag
    );

    const maandHuur = calculatePartnerMonthlyRent(
      investmentData.maand_huur,
      investmentData.jaarlijkse_opex,
      partnerData
    );

    const jaarHuur = calculatePartnerAnnualRent(
      investmentData.maand_huur,
      investmentData.jaarlijkse_opex,
      partnerData,
      1,
      investmentData.indexatie_percentage
    );

    const coc = calculateCashOnCash(jaarHuur, eigenInleg);
    const exitValue = calculatePartnerExitValue(investmentData.verkoopwaarde_10j, partnerData);
    const irr = calculateIRR(
      eigenInleg,
      investmentData.maand_huur,
      investmentData.jaarlijkse_opex,
      partnerData,
      investmentData.verkoopwaarde_10j,
      investmentData.indexatie_percentage
    );

    return {
      partner: partnerData,
      eigenInleg,
      maandHuur,
      jaarHuur,
      coc,
      exitValue,
      irr,
    };
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/gedeelde-investeringen")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {investment.naam}
              </h1>
              <p className="text-muted-foreground mt-1">
                {partners.length} {partners.length === 1 ? "investeerder" : "investeerders"}
              </p>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card">
              <Label className="text-sm font-medium">Weergave:</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isBeginnerMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                  Beginners
                </span>
                <Switch checked={!isBeginnerMode} onCheckedChange={handleToggleMode} />
                <span className={`text-sm ${!isBeginnerMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                  Gevorderden
                </span>
              </div>
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exporteer
            </Button>
          </div>

          {/* Overzicht kaarten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale Investering</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalInvestment)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maand Huur</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(investmentData.maand_huur)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indexatie</p>
                  <p className="text-xl font-bold text-foreground">{investmentData.indexatie_percentage}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exit Waarde</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(investmentData.verkoopwaarde_10j)}</p>
                </div>
              </div>
            </Card>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {isBeginnerMode ? (
            // Beginnersmodus: Kaarten per investeerder
            <div className="space-y-8">
              {partnerMetrics.map((metrics, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      {metrics.partner.naam}
                    </h2>
                    <Badge variant="secondary">
                      {metrics.partner.percentage}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BeginnerMetricCard
                      title="Jouw Totale Inleg"
                      value={formatCurrency(metrics.eigenInleg)}
                      whatIsIt="Dit is het bedrag dat je zelf hebt ingelegd."
                      whyImportant="Dit is jouw startinvestering — hoeveel van je eigen geld je hebt gebruikt."
                      isGood={
                        metrics.eigenInleg > 0
                          ? { label: "✓ Ingelegd", color: "success" }
                          : { label: "⚠ Alleen hypotheek", color: "warning" }
                      }
                    />

                    <BeginnerMetricCard
                      title="Jouw Maandelijkse Netto Huur"
                      value={formatCurrency(metrics.maandHuur)}
                      whatIsIt="Dit is wat je elke maand verdient na alle kosten."
                      whyImportant="Dit bepaalt hoeveel passief inkomen je maandelijks ontvangt."
                      isGood={getRatingForMonthlyRent(metrics.maandHuur)}
                    />

                    <BeginnerMetricCard
                      title="Jouw Cash-on-Cash Return"
                      value={`${metrics.coc.toFixed(1)}%`}
                      whatIsIt="Dit is jouw jaarlijkse rendement op je eigen inleg."
                      whyImportant="Dit laat zien hoe hard jouw geld werkt. Hoe hoger, hoe beter!"
                      isGood={getRatingForCashOnCash(metrics.coc)}
                    />

                    <BeginnerMetricCard
                      title="Jouw Aandeel bij Verkoop"
                      value={formatCurrency(metrics.exitValue)}
                      whatIsIt="Dit is wat je krijgt als jullie na 10 jaar verkopen."
                      whyImportant="Dit is jouw totale winst na 10 jaar, inclusief huurinkomsten en waardestijging."
                      isGood={
                        metrics.exitValue > metrics.eigenInleg * 1.5
                          ? { label: "Uitstekend", color: "success" }
                          : metrics.exitValue > metrics.eigenInleg
                          ? { label: "Goed", color: "success" }
                          : { label: "Matig", color: "warning" }
                      }
                    />

                    <BeginnerMetricCard
                      title="Jouw IRR (10 jaar)"
                      value={`${metrics.irr.toFixed(1)}%`}
                      whatIsIt="Dit is jouw gemiddelde jaarlijkse rendement over 10 jaar."
                      whyImportant="De IRR combineert huurinkomsten én waardestijging. Dit is het belangrijkste getal!"
                      isGood={getRatingForIRR(metrics.irr)}
                    />

                    <Card className="p-4 bg-muted/50">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">📊 Jouw Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>• Aandeel: {metrics.partner.percentage}%</p>
                          <p>• Eigen inleg: {formatCurrency(metrics.eigenInleg)}</p>
                          {metrics.partner.eigen_hypotheek_bedrag > 0 && (
                            <p>• Hypotheek: {formatCurrency(metrics.partner.eigen_hypotheek_bedrag)} ({metrics.partner.rente_percentage}%)</p>
                          )}
                          <p>• Jaar huur: {formatCurrency(metrics.jaarHuur)}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Gevorderdenmodus: Tabel
            <AdvancedMetricsTable
              partners={partnerMetrics}
              totalInvestment={totalInvestment}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GedeeldeInvesteringenDetail;
