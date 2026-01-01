import { useState, useEffect } from "react";
import { 
  Plus, Building2, Calendar, Wallet, Heart, Lightbulb,
  TrendingUp, TrendingDown, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GOAL_TYPES, GOAL_CATEGORIES, PRIORITY_OPTIONS, FLEXIBILITY_OPTIONS,
  type GoalType, type GoalCategory 
} from "./goalTypes";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Property = Tables<"properties">;
type Goal = Tables<"goals">;

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  editingGoal?: Goal | null;
  onSubmit: (data: Partial<TablesInsert<"goals">>) => Promise<void>;
  mode: "create" | "edit";
}

export const GoalFormDialog = ({
  open,
  onOpenChange,
  properties,
  editingGoal,
  onSubmit,
  mode,
}: GoalFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<TablesInsert<"goals">>>({
    naam: "",
    doelbedrag: 0,
    huidig_bedrag: 0,
    bron_property_id: null,
    doel_type: "overig",
    categorie: "persoonlijk",
    prioriteit: "middel",
    flexibiliteit: "adaptief",
    maandelijkse_inleg: 0,
    start_datum: format(new Date(), "yyyy-MM-dd"),
    eind_datum: null,
    notities: "",
    gepauzeerd: false,
  });
  
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>("persoonlijk");

  // Reset form when dialog opens with edit data
  useEffect(() => {
    if (open && editingGoal && mode === "edit") {
      setFormData({
        naam: editingGoal.naam,
        doelbedrag: Number(editingGoal.doelbedrag),
        huidig_bedrag: Number(editingGoal.huidig_bedrag),
        bron_property_id: editingGoal.bron_property_id,
        doel_type: editingGoal.doel_type || "overig",
        categorie: editingGoal.categorie || "persoonlijk",
        prioriteit: editingGoal.prioriteit || "middel",
        flexibiliteit: editingGoal.flexibiliteit || "adaptief",
        maandelijkse_inleg: Number(editingGoal.maandelijkse_inleg || 0),
        start_datum: editingGoal.start_datum || format(new Date(), "yyyy-MM-dd"),
        eind_datum: editingGoal.eind_datum,
        notities: editingGoal.notities || "",
        gepauzeerd: editingGoal.gepauzeerd || false,
      });
      setSelectedCategory((editingGoal.categorie as GoalCategory) || "persoonlijk");
    } else if (open && mode === "create") {
      setFormData({
        naam: "",
        doelbedrag: 0,
        huidig_bedrag: 0,
        bron_property_id: null,
        doel_type: "overig",
        categorie: "persoonlijk",
        prioriteit: "middel",
        flexibiliteit: "adaptief",
        maandelijkse_inleg: 0,
        start_datum: format(new Date(), "yyyy-MM-dd"),
        eind_datum: null,
        notities: "",
        gepauzeerd: false,
      });
      setSelectedCategory("persoonlijk");
    }
  }, [open, editingGoal, mode]);

  const handleGoalTypeSelect = (type: GoalType) => {
    const typeInfo = GOAL_TYPES[type];
    setFormData({
      ...formData,
      doel_type: type,
      categorie: typeInfo.categorie,
      naam: formData.naam || typeInfo.label,
      doelbedrag: formData.doelbedrag || typeInfo.suggestedAmount,
    });
    setSelectedCategory(typeInfo.categorie as GoalCategory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  const filteredGoalTypes = Object.entries(GOAL_TYPES).filter(
    ([_, info]) => info.categorie === selectedCategory
  );

  // Calculate estimated timeline
  const remaining = Number(formData.doelbedrag || 0) - Number(formData.huidig_bedrag || 0);
  const monthlyInleg = Number(formData.maandelijkse_inleg || 0);
  const estimatedMonths = monthlyInleg > 0 ? Math.ceil(remaining / monthlyInleg) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nieuw Doel Toevoegen" : "Doel Bewerken"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Kies een doeltype en vul de details in" 
              : "Pas de gegevens van je doel aan"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Category tabs */}
          <div>
            <Label className="mb-2 block">Categorie</Label>
            <Tabs 
              value={selectedCategory} 
              onValueChange={(v) => setSelectedCategory(v as GoalCategory)}
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="vastgoed" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Vastgoed</span>
                </TabsTrigger>
                <TabsTrigger value="vermogen" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Vermogen</span>
                </TabsTrigger>
                <TabsTrigger value="persoonlijk" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Persoonlijk</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredGoalTypes.map(([type, info]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleGoalTypeSelect(type as GoalType)}
                      className={`p-3 rounded-lg border text-left transition-all hover:border-primary ${
                        formData.doel_type === type 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">{info.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {info.description}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Basic info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Doelnaam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="bijv. Noodfonds, Nieuwe keuken"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doelbedrag">
                  Doelbedrag (€) *
                  <InfoTooltip
                    title="Doelbedrag"
                    content="Het totale bedrag dat je wilt bereiken voor dit doel."
                  />
                </Label>
                <Input
                  id="doelbedrag"
                  type="number"
                  min="0"
                  value={formData.doelbedrag || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, doelbedrag: Number(e.target.value) })
                  }
                  placeholder="10000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="huidig_bedrag">Huidige stand (€)</Label>
                <Input
                  id="huidig_bedrag"
                  type="number"
                  min="0"
                  value={formData.huidig_bedrag || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, huidig_bedrag: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maandelijkse_inleg">
                  Handmatige inleg (€/mnd)
                  <InfoTooltip
                    title="Handmatige inleg"
                    content="Hoeveel je maandelijks apart zet voor dit doel, los van vastgoedopbrengsten."
                  />
                </Label>
                <Input
                  id="maandelijkse_inleg"
                  type="number"
                  min="0"
                  value={formData.maandelijkse_inleg || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, maandelijkse_inleg: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Bronpand (optioneel)
                  <InfoTooltip
                    title="Bronpand"
                    content="Koppel dit doel aan een pand. 10% van het overschot gaat naar dit doel."
                  />
                </Label>
                <Select
                  value={formData.bron_property_id || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      bron_property_id: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een pand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen pand gekoppeld</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_datum">Startdatum</Label>
              <Input
                id="start_datum"
                type="date"
                value={formData.start_datum || ""}
                onChange={(e) =>
                  setFormData({ ...formData, start_datum: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eind_datum">
                Deadline (optioneel)
                <InfoTooltip
                  title="Deadline"
                  content="Wanneer wil je dit doel bereikt hebben? De app waarschuwt als je achterloopt."
                />
              </Label>
              <Input
                id="eind_datum"
                type="date"
                value={formData.eind_datum || ""}
                onChange={(e) =>
                  setFormData({ ...formData, eind_datum: e.target.value || null })
                }
              />
            </div>
          </div>

          {/* Priority & Flexibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioriteit</Label>
              <Select
                value={formData.prioriteit || "middel"}
                onValueChange={(value) =>
                  setFormData({ ...formData, prioriteit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Flexibiliteit
                <InfoTooltip
                  title="Flexibiliteit"
                  content="Vast: de einddatum staat vast, de inleg past zich aan. Adaptief: flexibel in tijd en inleg."
                />
              </Label>
              <Select
                value={formData.flexibiliteit || "adaptief"}
                onValueChange={(value) =>
                  setFormData({ ...formData, flexibiliteit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLEXIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notities">Notities (optioneel)</Label>
            <Textarea
              id="notities"
              value={formData.notities || ""}
              onChange={(e) =>
                setFormData({ ...formData, notities: e.target.value })
              }
              placeholder="Extra informatie over dit doel..."
              rows={2}
            />
          </div>

          {/* Preview calculations */}
          {(monthlyInleg > 0 || formData.bron_property_id) && remaining > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Geschatte doorlooptijd</span>
              </div>
              {estimatedMonths && (
                <p className="text-sm text-muted-foreground">
                  Met €{monthlyInleg.toLocaleString("nl-NL")}/mnd bereik je dit doel in{" "}
                  <span className="font-medium text-foreground">
                    ~{estimatedMonths} maanden
                  </span>{" "}
                  ({(estimatedMonths / 12).toFixed(1)} jaar)
                </p>
              )}
              {formData.bron_property_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  + 10% van het overschot van je gekoppelde pand
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">
              {mode === "create" ? "Toevoegen" : "Opslaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
