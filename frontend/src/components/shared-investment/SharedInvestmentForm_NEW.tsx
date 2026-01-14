import { useState } from "react";
import { X, Plus, Trash2, Users, Home, TrendingUp, DollarSign, Percent, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validatePartnerPercentages } from "@/lib/sharedInvestmentCalculations";
import type { InvestmentPartner } from "@/lib/sharedInvestmentCalculations";
import {
  calculateLangdurigScenario,
  calculateShortStayScenario,
  calculateVerkopenScenario,
  calculateTotalInitialInvestment,
  getBestScenario,
  type InvestmentFinancials,
  type ScenarioData,
} from "@/lib/scenarioCalculations";

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

  // Stap 2: Pandgegevens + Financiën
  const [pandData, setPandData] = useState({
    naam: "",
    aankoopprijs: 0,
    renovatie_kosten: 0,
    imt: 0,
    notaris_kosten: 0,
    inrichting_kosten: 0,
    hypotheek_percentage: 75,
    hypotheek_rente: 3.1,
    hypotheek_looptijd_jaren: 30,
    notities: "",
  });

  // Stap 3: Scenario's
  const [scenarioData, setScenarioData] = useState<ScenarioData>({
    // Langdurig
    maand_huur_langdurig: 0,
    bezetting_langdurig: 100,
    opex_jaar_langdurig: 0,
    // Short-stay
    adr_shortstay: 0,
    bezetting_shortstay: 70,
    opex_jaar_shortstay: 0,
    extra_kosten_shortstay: 0,
    // Verkopen
    verkoopwaarde: 0,
    verkoopkosten_percentage: 5,
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

  const handleStap2Submit = () => {
    if (!pandData.naam.trim()) {
      toast({
        title: "Vul pandnaam in",
        variant: "destructive",
      });
      return;
    }

    if (pandData.aankoopprijs <= 0) {
      toast({
        title: "Vul aankoopprijs in",
        variant: "destructive",
      });
      return;
    }

    setStep(3);
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Valideer dat minstens 1 scenario is ingevuld
    const hasScenario = 
      scenarioData.maand_huur_langdurig > 0 ||
      scenarioData.adr_shortstay > 0 ||
      scenarioData.verkoopwaarde > 0;

    if (!hasScenario) {
      toast({
        title: "Vul minimaal één scenario in",
        description: "Kies langdurig verhuren, short-stay of verkopen",
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
          notaris_kosten: pandData.notaris_kosten,
          inrichting_kosten: pandData.inrichting_kosten,
          hypotheek_percentage: pandData.hypotheek_percentage,
          hypotheek_rente: pandData.hypotheek_rente,
          hypotheek_looptijd_jaren: pandData.hypotheek_looptijd_jaren,
          maand_huur: scenarioData.maand_huur_langdurig, // Legacy veld
          jaarlijkse_opex: scenarioData.opex_jaar_langdurig, // Legacy veld
          verkoopwaarde_10j: scenarioData.verkoopwaarde || 0, // Legacy veld
          indexatie_percentage: 2, // Default
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

      // Voeg scenario's toe
      const scenarios = [];
      
      if (scenarioData.maand_huur_langdurig > 0) {
        scenarios.push({
          shared_investment_id: investment.id,
          scenario_type: 'langdurig',
          maand_huur_langdurig: scenarioData.maand_huur_langdurig,
          bezetting_langdurig: scenarioData.bezetting_langdurig,
          opex_jaar_langdurig: scenarioData.opex_jaar_langdurig,
          actief: true,
        });
      }

      if (scenarioData.adr_shortstay > 0) {
        scenarios.push({
          shared_investment_id: investment.id,
          scenario_type: 'shortstay',
          adr_shortstay: scenarioData.adr_shortstay,
          bezetting_shortstay: scenarioData.bezetting_shortstay,
          opex_jaar_shortstay: scenarioData.opex_jaar_shortstay,
          extra_kosten_shortstay: scenarioData.extra_kosten_shortstay,
        });
      }

      if (scenarioData.verkoopwaarde > 0) {
        scenarios.push({
          shared_investment_id: investment.id,
          scenario_type: 'verkopen',
          verkoopwaarde: scenarioData.verkoopwaarde,
          verkoopkosten_percentage: scenarioData.verkoopkosten_percentage,
        });
      }

      if (scenarios.length > 0) {
        const { error: scenariosError } = await supabase
          .from("investment_scenarios")
          .insert(scenarios);

        if (scenariosError) throw scenariosError;
      }

      toast({
        title: "Gedeelde investering aangemaakt!",
        description: `${pandData.naam} met ${partners.length} investeerders en ${scenarios.length} scenario's`,
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

  // Preview berekening voor stap 3
  const getScenarioPreview = () => {
    const financials: InvestmentFinancials = {
      aankoopprijs: pandData.aankoopprijs,
      renovatie_kosten: pandData.renovatie_kosten,
      imt: pandData.imt,
      notaris_kosten: pandData.notaris_kosten,
      inrichting_kosten: pandData.inrichting_kosten,
      hypotheek_percentage: pandData.hypotheek_percentage,
      hypotheek_rente: pandData.hypotheek_rente,
      hypotheek_looptijd_jaren: pandData.hypotheek_looptijd_jaren,
    };

    const totalInvestment = calculateTotalInitialInvestment(financials);
    const results = [];

    if (scenarioData.maand_huur_langdurig > 0) {
      results.push(calculateLangdurigScenario(financials, scenarioData, totalInvestment));
    }
    if (scenarioData.adr_shortstay > 0) {
      results.push(calculateShortStayScenario(financials, scenarioData, totalInvestment));
    }
    if (scenarioData.verkoopwaarde > 0) {
      results.push(calculateVerkopenScenario(financials, scenarioData, totalInvestment));
    }

    if (results.length === 0) return null;
    
    return getBestScenario(results);
  };

  const bestScenario = step === 3 ? getScenarioPreview() : null;

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
              Stap {step} van 3: {
                step === 1 ? "Investeerders" : 
                step === 2 ? "Pandgegevens & Financiën" :
                "Kies Jouw Strategie"
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Content based on step - zie vervolg in volgende message */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Stap 1 content - Partners (zie backup voor volledige code) */}
            {/* ... Partners lijst ... */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>Annuleren</Button>
              <Button className="flex-1 gradient-primary" onClick={handleStap1Submit} disabled={!isPercentageValid}>
                Volgende: Pandgegevens
              </Button>
            </div>
          </div>
        )}

        {/* Volgende stappen komen in vervolg message */}
      </Card>
    </div>
  );
};
