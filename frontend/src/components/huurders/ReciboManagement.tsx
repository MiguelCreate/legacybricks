import { useState } from "react";
import { FileText, Upload, ExternalLink, Calendar, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getReciboStatus,
  formatReciboDate,
  getNextReminderDate,
  generateReciboCalendarLink,
  getReciboInfoText,
  isValidUploadUrl,
  needsReciboReminder,
  type Huurder,
} from "@/lib/reciboHelpers";

interface ReciboManagementProps {
  huurder: Huurder;
  pandNaam: string;
  onUpdate: () => void;
}

export const ReciboManagement = ({ huurder, pandNaam, onUpdate }: ReciboManagementProps) => {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const status = getReciboStatus(huurder.laatste_recibo_datum);
  const nextReminder = getNextReminderDate(huurder.herinnering_recibo_dag || 5);
  const needsReminder = needsReciboReminder(huurder);

  const handleMarkAsReceived = async (withUrl?: string) => {
    setLoading(true);

    try {
      const updates: any = {
        laatste_recibo_datum: new Date().toISOString().split('T')[0],
      };

      if (withUrl) {
        if (!isValidUploadUrl(withUrl)) {
          toast({
            title: "Ongeldige URL",
            description: "Vul een geldige link in (PDF, screenshot of Google Drive link)",
            variant: "destructive",
          });
          return;
        }
        updates.recibo_bestand_url = withUrl;
      }

      const { error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", huurder.id);

      if (error) throw error;

      toast({
        title: "Recibo gemarkeerd als ontvangen",
        description: `Volgende herinnering: ${nextReminder.toLocaleDateString('nl-NL')}`,
      });

      setShowUploadDialog(false);
      setUploadUrl("");
      onUpdate();
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

  const handleQuickMark = () => {
    if (confirm("Recibo ontvangen markeren? (zonder bestand upload)")) {
      handleMarkAsReceived();
    }
  };

  return (
    <>
      <Card className={`p-5 ${needsReminder ? 'border-warning bg-warning/5' : 'border-border'}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                needsReminder ? 'bg-warning' : 'bg-primary/10'
              }`}>
                <FileText className={`w-5 h-5 ${
                  needsReminder ? 'text-warning-foreground' : 'text-primary'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Recibo de Renda</h3>
                  <InfoTooltip
                    title="Recibo de Renda"
                    content={getReciboInfoText()}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Officieel huurbewijs Portugal
                </p>
              </div>
            </div>
            
            <Badge variant={status.color}>
              {status.label}
            </Badge>
          </div>

          {/* Waarschuwing als actie vereist */}
          {needsReminder && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>Actie vereist:</strong> Vraag de Recibo de Renda aan bij Portal das Finanças
                </p>
              </div>
            </div>
          )}

          {/* Status info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Laatste ontvangst</p>
              <p className="text-sm font-medium text-foreground">
                {formatReciboDate(huurder.laatste_recibo_datum)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status.description}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Volgende herinnering</p>
              <p className="text-sm font-medium text-foreground">
                {nextReminder.toLocaleDateString('nl-NL', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dag {huurder.herinnering_recibo_dag || 5} van de maand
              </p>
            </div>
          </div>

          {/* Bestand */}
          {huurder.recibo_bestand_url && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <p className="text-sm text-foreground">Bestand opgeslagen</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <a
                    href={huurder.recibo_bestand_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Bekijk
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Acties */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowUploadDialog(true)}
            >
              <Check className="w-4 h-4" />
              Recibo Ontvangen
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              asChild
            >
              <a
                href="https://www.portaldasfinancas.gov.pt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                Aanvragen bij Finanças
              </a>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                const link = generateReciboCalendarLink(
                  huurder.naam || 'Huurder',
                  pandNaam,
                  huurder.herinnering_recibo_dag || 5
                );
                window.open(link, '_blank');
              }}
            >
              <Calendar className="w-4 h-4" />
              Agenda herinnering
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Recibo de Renda Ontvangen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Markeer de Recibo als ontvangen en upload optioneel een link naar het bestand.
            </p>

            {/* Info */}
            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">💡 Upload opties:</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Upload naar Google Drive en plak de link</li>
                  <li>Upload naar Dropbox en plak de link</li>
                  <li>Of sla een directe PDF/afbeelding link op</li>
                </ul>
              </div>
            </Card>

            {/* Upload URL */}
            <div className="space-y-2">
              <Label>Link naar Recibo (optioneel)</Label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://drive.google.com/... of https://dropbox.com/..."
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Upload eerst je bestand naar Google Drive of Dropbox, dan plak je de link hier
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUploadDialog(false)}
              >
                Annuleren
              </Button>
              
              {uploadUrl ? (
                <Button
                  className="flex-1 gradient-primary text-primary-foreground gap-2"
                  onClick={() => handleMarkAsReceived(uploadUrl)}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4" />
                  {loading ? "Opslaan..." : "Opslaan met link"}
                </Button>
              ) : (
                <Button
                  className="flex-1 gradient-primary text-primary-foreground gap-2"
                  onClick={() => handleMarkAsReceived()}
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                  {loading ? "Opslaan..." : "Markeer als ontvangen"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
