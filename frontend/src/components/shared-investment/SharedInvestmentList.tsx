import { useState } from "react";
import { Building2, Users, TrendingUp, Euro, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type SharedInvestment = Tables<"shared_investments">;

interface SharedInvestmentListProps {
  investments: SharedInvestment[];
  isBeginnerMode: boolean;
  onRefresh: () => void;
}

export const SharedInvestmentList = ({
  investments,
  isBeginnerMode,
  onRefresh,
}: SharedInvestmentListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (investment: SharedInvestment) => {
    if (!confirm(`Weet je zeker dat je "${investment.naam}" wilt verwijderen?`)) return;

    setDeletingId(investment.id);

    try {
      const { error } = await supabase
        .from("shared_investments")
        .delete()
        .eq("id", investment.id);

      if (error) throw error;

      toast({
        title: "Gedeelde investering verwijderd",
        description: `${investment.naam} is verwijderd`,
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {investments.map((investment, index) => {
        const totalInvestment = 
          investment.aankoopprijs + 
          (investment.renovatie_kosten || 0) + 
          (investment.imt || 0);

        return (
          <Card
            key={investment.id}
            className="p-5 hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-slide-up cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/gedeelde-investeringen/${investment.id}`)}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-lg">
                      {investment.naam}
                    </h3>
                    <Badge variant="secondary">
                      Co-investment
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>Totale investering: {formatCurrency(totalInvestment)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      <span>Huur: {formatCurrency(investment.maand_huur)}/mnd</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Exit: {formatCurrency(investment.verkoopwaarde_10j)}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Toegevoegd op {format(new Date(investment.created_at), "d MMMM yyyy", { locale: nl })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/gedeelde-investeringen/${investment.id}`);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Bekijken
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-strong">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/gedeelde-investeringen/${investment.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details bekijken
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(investment);
                      }}
                      className="text-destructive focus:text-destructive"
                      disabled={deletingId === investment.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingId === investment.id ? "Verwijderen..." : "Verwijderen"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
