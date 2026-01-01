import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wrench, Calendar, CheckCircle, AlertTriangle, AlertCircle, Sofa, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoomFeature {
  id: string;
  room_id: string;
  naam: string;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  onderhoudsstatus: string | null;
  gepland_onderhoudsjaar: number | null;
  notities: string | null;
}

interface RoomFeaturesManagerProps {
  roomId: string;
  roomName: string;
}

const SUGGESTED_INSTALLATIONS = [
  "Airconditioning",
  "Boiler",
  "Ventilatie",
  "Radiator",
  "Vloerverwarming",
  "Elektrische kachel",
  "Rookmelder",
  "CO-melder",
  "Warmwaterboiler",
  "Thermostaat",
];

const SUGGESTED_FURNITURE = [
  "Bed",
  "Matras",
  "Kledingkast",
  "Bureau",
  "Bureaustoel",
  "Nachtkastje",
  "Lamp",
  "Gordijnen",
  "Spiegel",
  "Boekenplank",
];

const onderhoudLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  geen: { label: "Geen", color: "text-success", icon: CheckCircle },
  licht: { label: "Licht", color: "text-warning", icon: AlertTriangle },
  groot: { label: "Groot", color: "text-destructive", icon: AlertCircle },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  gepland: { label: "Gepland", color: "text-blue-500", icon: Clock },
  uitgevoerd: { label: "Uitgevoerd", color: "text-success", icon: CheckCircle2 },
  verlopen: { label: "Verlopen", color: "text-destructive", icon: XCircle },
};

export const RoomFeaturesManager = ({ roomId, roomName }: RoomFeaturesManagerProps) => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<RoomFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<RoomFeature | null>(null);
  const [formData, setFormData] = useState({
    naam: "",
    merk_type: "",
    onderhoudsbehoefte: "geen",
    onderhoudsstatus: "gepland",
    gepland_onderhoudsjaar: "",
    notities: "",
    type: "installatie" as "installatie" | "inboedel",
  });
  const [activeTab, setActiveTab] = useState<"installatie" | "inboedel">("installatie");

  useEffect(() => {
    fetchFeatures();
  }, [roomId]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from("room_features")
        .select("*")
        .eq("room_id", roomId)
        .order("naam");

      if (error) throw error;
      setFeatures((data as RoomFeature[]) || []);
    } catch (error) {
      console.error("Error fetching room features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const featureData = {
        room_id: roomId,
        naam: formData.naam,
        merk_type: formData.merk_type || null,
        onderhoudsbehoefte: formData.onderhoudsbehoefte,
        onderhoudsstatus: formData.onderhoudsstatus || null,
        gepland_onderhoudsjaar: formData.gepland_onderhoudsjaar ? parseInt(formData.gepland_onderhoudsjaar) : null,
        notities: formData.notities || null,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from("room_features")
          .update(featureData)
          .eq("id", editingFeature.id);
        if (error) throw error;
        toast({ title: "Kenmerk bijgewerkt" });
      } else {
        const { error } = await supabase.from("room_features").insert(featureData);
        if (error) throw error;
        toast({ title: "Kenmerk toegevoegd" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFeatures();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (feature: RoomFeature) => {
    if (!confirm(`Weet je zeker dat je "${feature.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("room_features").delete().eq("id", feature.id);
      if (error) throw error;
      toast({ title: "Kenmerk verwijderd" });
      fetchFeatures();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (feature: RoomFeature) => {
    setEditingFeature(feature);
    setFormData({
      naam: feature.naam,
      merk_type: feature.merk_type || "",
      onderhoudsbehoefte: feature.onderhoudsbehoefte,
      onderhoudsstatus: feature.onderhoudsstatus || "gepland",
      gepland_onderhoudsjaar: feature.gepland_onderhoudsjaar?.toString() || "",
      notities: feature.notities || "",
      type: isInboedel(feature.naam) ? "inboedel" : "installatie",
    });
    setIsDialogOpen(true);
  };

  const resetForm = (type: "installatie" | "inboedel" = "installatie") => {
    setEditingFeature(null);
    setFormData({
      naam: "",
      merk_type: "",
      onderhoudsbehoefte: "geen",
      onderhoudsstatus: "gepland",
      gepland_onderhoudsjaar: "",
      notities: "",
      type,
    });
  };

  // Categorize features by type (installatie vs inboedel)
  const isInboedel = (naam: string) => SUGGESTED_FURNITURE.some(f => naam.toLowerCase().includes(f.toLowerCase()));
  const installations = features.filter(f => !isInboedel(f.naam));
  const furniture = features.filter(f => isInboedel(f.naam));

  // Check for overdue maintenance
  const getEffectiveStatus = (feature: RoomFeature) => {
    if (feature.onderhoudsstatus === "uitgevoerd") return "uitgevoerd";
    if (feature.gepland_onderhoudsjaar && feature.gepland_onderhoudsjaar < currentYear) return "verlopen";
    if (feature.gepland_onderhoudsjaar) return "gepland";
    return feature.onderhoudsstatus || null;
  };

  const currentYear = new Date().getFullYear();

  if (loading) {
    return <div className="animate-pulse h-16 bg-muted rounded-lg" />;
  }

  const FeatureItem = ({ feature }: { feature: RoomFeature }) => {
    const onderhoudInfo = onderhoudLabels[feature.onderhoudsbehoefte] || onderhoudLabels.geen;
    const OnderhoudIcon = onderhoudInfo.icon;
    const effectiveStatus = getEffectiveStatus(feature);
    const statusInfo = effectiveStatus ? statusLabels[effectiveStatus] : null;
    const StatusIcon = statusInfo?.icon || Clock;
    const isFurniture = isInboedel(feature.naam);
    
    return (
      <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-xs group">
        <div className="flex items-center gap-2">
          {isFurniture ? (
            <Sofa className="w-3 h-3 text-muted-foreground" />
          ) : (
            <Wrench className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="font-medium">{feature.naam}</span>
          {feature.merk_type && (
            <span className="text-muted-foreground">({feature.merk_type})</span>
          )}
          {feature.onderhoudsbehoefte !== "geen" && (
            <Badge variant="outline" className={`text-xs py-0 h-5 ${onderhoudInfo.color}`}>
              <OnderhoudIcon className="w-2.5 h-2.5 mr-1" />
              {onderhoudInfo.label}
            </Badge>
          )}
          {effectiveStatus && effectiveStatus !== "geen" && (
            <Badge 
              variant={effectiveStatus === "verlopen" ? "destructive" : effectiveStatus === "uitgevoerd" ? "secondary" : "outline"} 
              className={`text-xs py-0 h-5 gap-1 ${statusInfo?.color}`}
            >
              <StatusIcon className="w-2.5 h-2.5" />
              {feature.gepland_onderhoudsjaar || statusInfo?.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(feature)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive"
            onClick={() => handleDelete(feature)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "installatie" | "inboedel")} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="h-7">
            <TabsTrigger value="installatie" className="text-xs px-2 h-6 gap-1">
              <Wrench className="w-3 h-3" />
              Installaties ({installations.length})
            </TabsTrigger>
            <TabsTrigger value="inboedel" className="text-xs px-2 h-6 gap-1">
              <Sofa className="w-3 h-3" />
              Inboedel ({furniture.length})
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              resetForm(activeTab);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Toevoegen
          </Button>
        </div>

        <TabsContent value="installatie" className="mt-0">
          {installations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Geen installaties</p>
          ) : (
            <div className="space-y-1">
              {installations.map((feature) => (
                <FeatureItem key={feature.id} feature={feature} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inboedel" className="mt-0">
          {furniture.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">Geen inboedel</p>
          ) : (
            <div className="space-y-1">
              {furniture.map((feature) => (
                <FeatureItem key={feature.id} feature={feature} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFeature ? "Installatie Bewerken" : "Nieuwe Installatie"}</DialogTitle>
            <DialogDescription>{roomName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Naam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder={formData.type === "inboedel" ? "bijv. Bed, Bureau" : "bijv. Airconditioning"}
                list={formData.type === "inboedel" ? "suggested-furniture" : "suggested-installations"}
                required
              />
              <datalist id="suggested-installations">
                {SUGGESTED_INSTALLATIONS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <datalist id="suggested-furniture">
                {SUGGESTED_FURNITURE.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merk_type">Merk / Type</Label>
              <Input
                id="merk_type"
                value={formData.merk_type}
                onChange={(e) => setFormData({ ...formData, merk_type: e.target.value })}
                placeholder="bijv. Hyundai, Daikin"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Onderhoudsbehoefte</Label>
                <Select
                  value={formData.onderhoudsbehoefte}
                  onValueChange={(v) => setFormData({ ...formData, onderhoudsbehoefte: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geen">Geen</SelectItem>
                    <SelectItem value="licht">Licht onderhoud</SelectItem>
                    <SelectItem value="groot">Groot onderhoud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.onderhoudsstatus}
                  onValueChange={(v) => setFormData({ ...formData, onderhoudsstatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gepland">Gepland</SelectItem>
                    <SelectItem value="uitgevoerd">Uitgevoerd</SelectItem>
                    <SelectItem value="verlopen">Verlopen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gepland_onderhoudsjaar">Gepland onderhoudsjaar</Label>
              <Input
                id="gepland_onderhoudsjaar"
                type="number"
                min={currentYear - 5}
                max={currentYear + 30}
                value={formData.gepland_onderhoudsjaar}
                onChange={(e) => setFormData({ ...formData, gepland_onderhoudsjaar: e.target.value })}
                placeholder="bijv. 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                {editingFeature ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
