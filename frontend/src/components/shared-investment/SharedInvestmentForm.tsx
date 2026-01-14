import { useState } from "react";
import { X, Plus, Trash2, Users, Home, DollarSign, Percent, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validatePartnerPercentages } from "@/lib/sharedInvestmentCalculations";
import type { InvestmentPartner } from "@/lib/sharedInvestmentCalculations";

interface SharedInvestmentFormProps {
  isBeginnerMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SharedInvestmentForm = ({ isBeginnerMode, onClose, onSuccess }: SharedInvestmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Stap 1: Investeerders
  const [partners, setPartners] = useState<InvestmentPartner[]>([
    { naam: "", percentage: 0, eigen_hypotheek_bedrag: 0, rente_percentage: 0, looptijd_jaren: 30 }
  ]);

  // Stap 2: Pandgegevens
  const [pandData, setPandData] = useState({
    naam: "",
    aankoopprijs: 0,
    renovatie_kosten: 0,
    imt: 0,
    maand_huur: 0,
    jaarlijkse_opex: 0,
    verkoopwaarde_10j: 0,
    indexatie_percentage: 2,
    notities: "",
  });

  const addPartner = () => {
    setPartners([...partners, { naam: "", percentage: 0, eigen_hypotheek_bedrag: 0, rente_percentage: 0, looptijd_jaren: 30 }]);
  };

  const removePartner = (index: number) => {
    if (partners.length > 1) {
      setPartners(partners.filter((_, i) => i !== index));
    }
  };

  const updatePartner = (index: number, field: keyof InvestmentPartner, value: string | number) => {
    const updated = [...partners];
    updated[index] = { ...updated[index], [field]: value };
    setPartners(updated);
  };

  const getTotalPercentage = () => {
    return partners.reduce((sum, p) => sum + Number(p.percentage), 0);
  };

  const handleStap1Submit = () => {
    // Validaties
    if (partners.some(p => !p.naam.trim())) {
      toast({
        title: "Vul alle namen in",
        description: "Elke investeerder moet een naam hebben",
        variant: "destructive",
      });
      return;
    }

    if (!validatePartnerPercentages(partners)) {
      toast({
        title: "Percentages moeten optellen tot 100%",
        description: `Huidige totaal: ${getTotalPercentage()}%`,
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validaties stap 2
    if (!pandData.naam.trim()) {
      toast({
        title: "Vul pandnaam in",
        variant: "destructive",
      });
      return;
    }

    if (pandData.aankoopprijs <= 0 || pandData.maand_huur <= 0 || pandData.verkoopwaarde_10j <= 0) {
      toast({
        title: "Vul alle verplichte velden in",
        description: "Aankoopprijs, maandhuur en verkoopwaarde zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Maak gedeelde investering aan
      const { data: investment, error: investmentError } = await supabase
        .from("shared_investments")
        .insert({
          user_id: user.id,
          naam: pandData.naam,
          aankoopprijs: pandData.aankoopprijs,
          renovatie_kosten: pandData.renovatie_kosten,
          imt: pandData.imt,
          maand_huur: pandData.maand_huur,
          jaarlijkse_opex: pandData.jaarlijkse_opex,
          verkoopwaarde_10j: pandData.verkoopwaarde_10j,
          indexatie_percentage: pandData.indexatie_percentage,
          notities: pandData.notities,
        })
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Voeg partners toe
      const partnersData = partners.map(p => ({
        shared_investment_id: investment.id,
        naam: p.naam,
        percentage: p.percentage,
        eigen_hypotheek_bedrag: p.eigen_hypotheek_bedrag,
        rente_percentage: p.rente_percentage,
        looptijd_jaren: p.looptijd_jaren,
      }));

      const { error: partnersError } = await supabase
        .from("investment_partners")
        .insert(partnersData);

      if (partnersError) throw partnersError;

      toast({
        title: "Gedeelde investering aangemaakt!",
        description: `${pandData.naam} is toegevoegd met ${partners.length} investeerders`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = getTotalPercentage();
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Nieuwe Gedeelde Investering
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Stap {step} van 2: {step === 1 ? "Voeg investeerders toe" : "Voer pandgegevens in"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Stap 1: Investeerders */}
        {step === 1 && (
          <div className="space-y-6">
            {isBeginnerMode && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Wie investeert mee?</p>
                    <p className="text-sm text-muted-foreground">
                      Voeg alle investeerders toe. De percentages moeten optellen tot 100%. 
                      Bijvoorbeeld: jij 60%, je vriend 40%.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {partners.map((partner, index) => (
                <Card key={index} className="p-4 border-2">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      Investeerder {index + 1}
                    </h3>
                    {partners.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePartner(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Naam *</Label>
                        <InfoTooltip
                          title="Naam investeerder"
                          content="Vul de naam in van deze investeerder"
                        />
                      </div>
                      <Input
                        value={partner.naam}
                        onChange={(e) => updatePartner(index, "naam", e.target.value)}
                        placeholder="bijv. Miguel"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Percentage inbreng (%) *</Label>
                        <InfoTooltip
                          title="Percentage"
                          content="Hoeveel procent van de totale investering komt van deze persoon?"
                        />
                      </div>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          value={partner.percentage || ""}
                          onChange={(e) => updatePartner(index, "percentage", Number(e.target.value))}
                          placeholder="60"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Eigen hypotheek (optioneel)</Label>
                        <InfoTooltip
                          title="Eigen hypotheek"
                          content="Heeft deze investeerder een eigen hypotheek? Vul dan het bedrag in."
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={partner.eigen_hypotheek_bedrag || ""}
                          onChange={(e) => updatePartner(index, "eigen_hypotheek_bedrag", Number(e.target.value))}
                          placeholder="0"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {partner.eigen_hypotheek_bedrag > 0 && (
                      <>
                        <div className="space-y-2">
                          <Label>Rente (%)</Label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.1"
                              value={partner.rente_percentage || ""}
                              onChange={(e) => updatePartner(index, "rente_percentage", Number(e.target.value))}
                              placeholder="3.5"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Looptijd (jaren)</Label>
                          <Input
                            type="number"
                            value={partner.looptijd_jaren || ""}
                            onChange={(e) => updatePartner(index, "looptijd_jaren", Number(e.target.value))}
                            placeholder="30"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addPartner}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Investeerder toevoegen
              </Button>
            </div>

            {/* Percentage check */}
            <Card className={`p-4 border-2 ${isPercentageValid ? "border-success bg-success/5" : "border-warning bg-warning/5"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPercentageValid ? (
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-success-foreground">
                      ✓
                    </div>
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  )}
                  <div>
                    <p className="font-semibold">
                      Totaal percentage: {totalPercentage.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPercentageValid ? "Perfect! Percentages kloppen." : "Moet 100% zijn om door te gaan"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annuleren
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={handleStap1Submit}
                disabled={!isPercentageValid}
              >
                Volgende: Pandgegevens
              </Button>
            </div>
          </div>
        )}

        {/* Stap 2: Pandgegevens */}
        {step === 2 && (
          <div className="space-y-6">
            {isBeginnerMode && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Pandgegevens invoeren</p>
                    <p className="text-sm text-muted-foreground">
                      Vul de financiële details in van het pand dat jullie samen kopen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naam pand *</Label>
                <Input
                  value={pandData.naam}
                  onChange={(e) => setPandData({ ...pandData, naam: e.target.value })}
                  placeholder="bijv. Pand Figueira da Foz"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Aankoopprijs (€) *</Label>
                    <InfoTooltip title="Aankoopprijs" content="De totale aankoopprijs van het pand" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.aankoopprijs || ""}
                    onChange={(e) => setPandData({ ...pandData, aankoopprijs: Number(e.target.value) })}
                    placeholder="250000"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Renovatiekosten (€)</Label>
                    <InfoTooltip title="Renovatie" content="Eventuele renovatie- of verbouwingskosten" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.renovatie_kosten || ""}
                    onChange={(e) => setPandData({ ...pandData, renovatie_kosten: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>IMT (€)</Label>
                    <InfoTooltip title="IMT" content="Portugese overdrachtsbelasting (Imposto Municipal sobre as Transmissões)" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.imt || ""}
                    onChange={(e) => setPandData({ ...pandData, imt: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Maandhuur (€) *</Label>
                    <InfoTooltip title="Maandhuur" content="Bruto huurinkomsten per maand" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.maand_huur || ""}
                    onChange={(e) => setPandData({ ...pandData, maand_huur: Number(e.target.value) })}
                    placeholder="950"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Jaarlijkse OPEX (€)</Label>
                    <InfoTooltip title="OPEX" content="Jaarlijkse operationele kosten (IMI, onderhoud, verzekering, etc.)" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.jaarlijkse_opex || ""}
                    onChange={(e) => setPandData({ ...pandData, jaarlijkse_opex: Number(e.target.value) })}
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Verkoopwaarde over 10 jaar (€) *</Label>
                    <InfoTooltip title="Verkoopwaarde" content="Geschatte verkoopwaarde van het pand over 10 jaar" />
                  </div>
                  <Input
                    type="number"
                    value={pandData.verkoopwaarde_10j || ""}
                    onChange={(e) => setPandData({ ...pandData, verkoopwaarde_10j: Number(e.target.value) })}
                    placeholder="300000"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Huurindexatie (%)</Label>
                    <InfoTooltip title="Indexatie" content="Jaarlijkse huurstijging percentage (typisch 2-3% in Portugal)" />
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={pandData.indexatie_percentage || ""}
                    onChange={(e) => setPandData({ ...pandData, indexatie_percentage: Number(e.target.value) })}
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notities (optioneel)</Label>
                <Textarea
                  value={pandData.notities}
                  onChange={(e) => setPandData({ ...pandData, notities: e.target.value })}
                  placeholder="Extra informatie over deze investering..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Vorige
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Opslaan..." : "Investering Aanmaken"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
