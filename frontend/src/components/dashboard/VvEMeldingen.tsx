import { useState, useEffect } from "react";
import { Building2, AlertTriangle, Calendar, PiggyBank, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays } from "date-fns";

interface VvEMelding {
  type: "onderhoud" | "verzekering" | "reservepot";
  message: string;
  propertyId: string;
  propertyName: string;
  urgency: "high" | "medium" | "low";
}

export const VvEMeldingen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meldingen, setMeldingen] = useState<VvEMelding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVvEMeldingen();
    }
  }, [user]);

  const fetchVvEMeldingen = async () => {
    try {
      // Fetch properties with VvE data
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id, naam, vve_reserve_streef, vve_reserve_huidig, gebouw_verzekering_vervaldatum, energie_certificaat_gebouw_vervaldatum")
        .eq("gearchiveerd", false);

      if (propError) throw propError;

      // Fetch onderhoud items
      const { data: onderhoud, error: onderhoudError } = await supabase
        .from("gemeenschappelijk_onderhoud")
        .select("property_id, element_naam, volgend_onderhoud");

      if (onderhoudError) throw onderhoudError;

      const nieuweVermeldingen: VvEMelding[] = [];

      // Check each property
      for (const property of properties || []) {
        // Check reservepot
        const streef = Number(property.vve_reserve_streef) || 0;
        const huidig = Number(property.vve_reserve_huidig) || 0;
        if (streef > 0 && huidig < streef * 0.5) {
          nieuweVermeldingen.push({
            type: "reservepot",
            message: `Reservepot < 50%: €${huidig.toLocaleString("nl-NL")} / €${streef.toLocaleString("nl-NL")}`,
            propertyId: property.id,
            propertyName: property.naam,
            urgency: "medium",
          });
        }

        // Check verzekering
        if (property.gebouw_verzekering_vervaldatum) {
          const dagenTot = differenceInDays(new Date(property.gebouw_verzekering_vervaldatum), new Date());
          if (dagenTot <= 30 && dagenTot >= 0) {
            nieuweVermeldingen.push({
              type: "verzekering",
              message: `Gebouwverzekering vervalt over ${dagenTot} dagen`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 7 ? "high" : "medium",
            });
          }
        }

        // Check energie certificaat
        if (property.energie_certificaat_gebouw_vervaldatum) {
          const dagenTot = differenceInDays(new Date(property.energie_certificaat_gebouw_vervaldatum), new Date());
          if (dagenTot <= 60 && dagenTot >= 0) {
            nieuweVermeldingen.push({
              type: "verzekering",
              message: `Energiecertificaat gebouw vervalt over ${dagenTot} dagen`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 30 ? "high" : "medium",
            });
          }
        }
      }

      // Check onderhoud items
      for (const item of onderhoud || []) {
        if (item.volgend_onderhoud) {
          const dagenTot = differenceInDays(new Date(item.volgend_onderhoud), new Date());
          const property = properties?.find(p => p.id === item.property_id);
          if (dagenTot <= 60 && property) {
            nieuweVermeldingen.push({
              type: "onderhoud",
              message: `${item.element_naam}: ${dagenTot <= 0 ? "Verlopen" : `onderhoud over ${dagenTot} dagen`}`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 0 ? "high" : dagenTot <= 30 ? "medium" : "low",
            });
          }
        }
      }

      // Sort by urgency
      nieuweVermeldingen.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setMeldingen(nieuweVermeldingen);
    } catch (error) {
      console.error("Error fetching VvE meldingen:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || meldingen.length === 0) return null;

  const getIcon = (type: VvEMelding["type"]) => {
    switch (type) {
      case "onderhoud":
        return <Calendar className="w-4 h-4" />;
      case "verzekering":
        return <FileText className="w-4 h-4" />;
      case "reservepot":
        return <PiggyBank className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: VvEMelding["urgency"]) => {
    switch (urgency) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
      <div className="flex items-start gap-3">
        <Building2 className="w-5 h-5 text-warning mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-foreground mb-2">
            {meldingen.length} VvE-{meldingen.length === 1 ? "taak" : "taken"} vereist aandacht
          </p>
          <div className="space-y-1">
            {meldingen.slice(0, 3).map((melding, index) => (
              <button
                key={index}
                onClick={() => navigate(`/panden/${melding.propertyId}`)}
                className="flex items-center gap-2 text-sm text-left hover:underline w-full"
              >
                <span className={getUrgencyColor(melding.urgency)}>
                  {getIcon(melding.type)}
                </span>
                <span className="text-muted-foreground">{melding.propertyName}:</span>
                <span>{melding.message}</span>
              </button>
            ))}
            {meldingen.length > 3 && (
              <p className="text-sm text-muted-foreground">
                + {meldingen.length - 3} meer...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
