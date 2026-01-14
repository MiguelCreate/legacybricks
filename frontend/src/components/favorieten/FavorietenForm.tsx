import { useState, useEffect } from "react";
import { X, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  calculatePrijsPerM2,
  compareWithRegioGemiddelde,
  isValidUrl,
  type Favoriet,
} from "@/lib/favorietenHelpers";

interface FavorietenFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingFavoriet?: Favoriet | null;
}

export const FavorietenForm = ({
  open,
  onClose,
  onSuccess,
  editingFavoriet,
}: FavorietenFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    link: "",
    locatie: "",
    prijs: "",
    oppervlakte_m2: "",
    notitie: "",
    status: "nieuw" as const,
  });

  useEffect(() => {
    if (editingFavoriet) {
      setFormData({
        link: editingFavoriet.link,
        locatie: editingFavoriet.locatie || "",
        prijs: editingFavoriet.prijs?.toString() || "",
        oppervlakte_m2: editingFavoriet.oppervlakte_m2?.toString() || "",
        notitie: editingFavoriet.notitie || "",
        status: editingFavoriet.status,
      });
    } else {
      setFormData({
        link: "",
        locatie: "",
        prijs: "",
        oppervlakte_m2: "",
        notitie: "",
        status: "nieuw",
      });
    }
  }, [editingFavoriet, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validaties
    if (!formData.link.trim()) {
      toast({
        title: "Link is verplicht",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(formData.link)) {
      toast({
        title: "Ongeldige URL",
        description: "Vul een geldige link in (bijv. https://...)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const data = {
        link: formData.link.trim(),
        locatie: formData.locatie.trim() || null,
        prijs: formData.prijs ? parseFloat(formData.prijs) : null,
        oppervlakte_m2: formData.oppervlakte_m2 ? parseFloat(formData.oppervlakte_m2) : null,
        notitie: formData.notitie.trim() || null,
        status: formData.status,
        user_id: user.id,
      };

      if (editingFavoriet) {
        const { error } = await supabase
          .from("favorieten")
          .update(data)
          .eq("id", editingFavoriet.id);

        if (error) throw error;

        toast({ title: "Favoriet bijgewerkt" });
      } else {
        const { error } = await supabase.from("favorieten").insert(data);

        if (error) throw error;

        toast({ title: "Favoriet toegevoegd" });
      }

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

  // Live berekening prijs/m² en vergelijking
  const prijsPerM2 =
    formData.prijs && formData.oppervlakte_m2
      ? calculatePrijsPerM2(parseFloat(formData.prijs), parseFloat(formData.oppervlakte_m2))
      : null;

  const vergelijking =
    prijsPerM2 && formData.locatie
      ? compareWithRegioGemiddelde(prijsPerM2, formData.locatie)
      : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFavoriet ? "Favoriet Bewerken" : "Nieuwe Favoriet"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info banner */}
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground">
                  Je hoeft niet alle velden in te vullen — <strong>alleen de link is verplicht</strong>.
                  Voeg zoveel informatie toe als je wilt om later gemakkelijker terug te vinden.
                </p>
              </div>
            </div>
          </Card>

          {/* Link (verplicht) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Advertentie-link *</Label>
              <InfoTooltip
                title="Advertentie-link"
                content="Plak hier de URL van de vastgoedadvertentie (bijv. van Idealista, Imovirtual, etc.)"
              />
            </div>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://www.idealista.pt/..."
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Locatie */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Locatie</Label>
                <InfoTooltip
                  title="Locatie"
                  content="Bijv. 'Figueira da Foz' of 'Coimbra, Centro'"
                />
              </div>
              <Input
                value={formData.locatie}
                onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                placeholder="Figueira da Foz"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Status</Label>
                <InfoTooltip
                  title="Status"
                  content="Geef aan in welke fase deze advertentie zich bevindt"
                />
              </div>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nieuw">Nieuw</SelectItem>
                  <SelectItem value="bekeken">Bekeken</SelectItem>
                  <SelectItem value="in_overweging">In Overweging</SelectItem>
                  <SelectItem value="geanalyseerd">Geanalyseerd</SelectItem>
                  <SelectItem value="afgekeurd">Afgekeurd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prijs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Prijs (€)</Label>
                <InfoTooltip
                  title="Prijs"
                  content="Vraagprijs zoals in de advertentie staat"
                />
              </div>
              <Input
                type="number"
                value={formData.prijs}
                onChange={(e) => setFormData({ ...formData, prijs: e.target.value })}
                placeholder="220000"
              />
            </div>

            {/* Oppervlakte */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Oppervlakte (m²)</Label>
                <InfoTooltip
                  title="Oppervlakte"
                  content="Woonoppervlak in vierkante meters"
                />
              </div>
              <Input
                type="number"
                step="0.1"
                value={formData.oppervlakte_m2}
                onChange={(e) => setFormData({ ...formData, oppervlakte_m2: e.target.value })}
                placeholder="95"
              />
            </div>
          </div>

          {/* Auto-analyse */}
          {prijsPerM2 && (
            <Card className="p-4 bg-success/10 border-success/20">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">📊 Automatische Analyse</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Prijs per m²:</span>{' '}
                    <span className="font-medium">
                      €{prijsPerM2.toLocaleString('nl-NL')} /m²
                    </span>
                  </p>
                  {vergelijking && vergelijking.gemiddelde && (
                    <p className="text-muted-foreground">{vergelijking.analyse}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Notitie */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Notitie</Label>
              <InfoTooltip
                title="Notitie"
                content="Voeg eigen opmerkingen toe, bijv. 'Mogelijk goed rendement' of 'Te ver van centrum'"
              />
            </div>
            <Textarea
              value={formData.notitie}
              onChange={(e) => setFormData({ ...formData, notitie: e.target.value })}
              placeholder="Bijv. 'Goed onderhoud, dichtbij strand, mogelijk geschikt voor short-stay'"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuleren
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Opslaan..." : editingFavoriet ? "Bijwerken" : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
