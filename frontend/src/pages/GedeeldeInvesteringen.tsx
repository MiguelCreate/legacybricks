import { useState, useEffect } from "react";
import { Users, Plus, TrendingUp, DollarSign, Calculator, BarChart3, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { SharedInvestmentForm } from "@/components/shared-investment/SharedInvestmentForm";
import { SharedInvestmentList } from "@/components/shared-investment/SharedInvestmentList";

type SharedInvestment = Tables<"shared_investments">;

const GedeeldeInvesteringen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<SharedInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Mode toggle - opslaan in localStorage
  const [isBeginnerMode, setIsBeginnerMode] = useState(() => {
    const saved = localStorage.getItem("sharedInvestmentMode");
    return saved === null ? true : saved === "beginner";
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  useEffect(() => {
    // Sla mode keuze op
    localStorage.setItem("sharedInvestmentMode", isBeginnerMode ? "beginner" : "advanced");
  }, [isBeginnerMode]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon gedeelde investeringen niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsBeginnerMode(!isBeginnerMode);
    toast({
      title: `${!isBeginnerMode ? "Beginners" : "Gevorderden"}modus geactiveerd`,
      description: !isBeginnerMode 
        ? "Stapsgewijze uitleg en visuele indicatoren" 
        : "Volledige financiële analyse",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Gedeelde Vastgoedinvesteringen
                </h1>
                <InfoTooltip
                  title="Gedeelde Investering"
                  content="Voor situaties waarin 2 of meer investeerders samen een pand kopen. Beheer investeringen, bereken rendementen per persoon, en zie wie wat verdient."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {investments.length} {investments.length === 1 ? "gedeelde investering" : "gedeelde investeringen"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card">
                <Label className="text-sm font-medium">Weergave:</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isBeginnerMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    Beginners
                  </span>
                  <Switch
                    checked={!isBeginnerMode}
                    onCheckedChange={handleToggleMode}
                  />
                  <span className={`text-sm ${!isBeginnerMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    Gevorderden
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowForm(true)}
                className="gradient-primary text-primary-foreground gap-2"
              >
                <Plus className="w-4 h-4" />
                Nieuwe Gedeelde Investering
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Co-investment: Samen Investeren in Vastgoed
                </p>
                <p className="text-sm text-muted-foreground">
                  Perfect voor vrienden, familie of zakenpartners die samen een pand kopen in Portugal. 
                  Bereken ieders inleg, huurinkomsten, kosten en rendement op een eerlijke en transparante manier.
                </p>
              </div>
            </div>
          </div>

          {/* Waarschuwingen */}
          {investments.length === 0 && !showForm && (
            <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Belangrijke Tips voor Gedeelde Investeringen</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Zorg dat jullie een schriftelijke overeenkomst hebben over kosten, winst en besluitvorming</li>
                    <li>Als één partij stopt, kan dat juridische complicaties geven</li>
                    <li>Overweeg een 'buy-out'-clausule in jullie akkoord</li>
                    <li>Bespreek scenario's zoals verkoop, renovatie en huurderswisseling vooraf</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : showForm ? (
            <SharedInvestmentForm
              isBeginnerMode={isBeginnerMode}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                fetchInvestments();
              }}
            />
          ) : investments.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nog geen gedeelde investeringen
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start je eerste co-investment en bereken hoe iedereen mee profiteert van jullie gezamenlijke vastgoedinvestering.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="gradient-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Eerste gedeelde investering toevoegen
              </Button>
            </div>
          ) : (
            <SharedInvestmentList
              investments={investments}
              isBeginnerMode={isBeginnerMode}
              onRefresh={fetchInvestments}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GedeeldeInvesteringen;
