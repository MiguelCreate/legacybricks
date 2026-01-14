import { Bell, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getOpenstaandeRecibos, getReciboReminderText, type Huurder, type Property } from "@/lib/reciboHelpers";

interface ReciboReminderWidgetProps {
  huurders: Huurder[];
  properties: Property[];
}

export const ReciboReminderWidget = ({ huurders, properties }: ReciboReminderWidgetProps) => {
  const navigate = useNavigate();
  const openstaand = getOpenstaandeRecibos(huurders);

  if (openstaand.length === 0) {
    return null; // Geen herinneringen, toon widget niet
  }

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.naam || 'Onbekend pand';
  };

  return (
    <Card className="p-5 bg-warning/10 border-warning/30">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center shadow-glow flex-shrink-0">
          <Bell className="w-6 h-6 text-warning-foreground" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">Recibo de Renda Herinnering</h3>
            <Badge variant="warning">{openstaand.length}</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {openstaand.length === 1 
              ? `1 huurder heeft een Recibo de Renda nodig deze maand`
              : `${openstaand.length} huurders hebben een Recibo de Renda nodig deze maand`
            }
          </p>

          {/* Lijst van huurders */}
          <div className="space-y-2 mb-4">
            {openstaand.slice(0, 3).map((huurder) => (
              <div 
                key={huurder.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-background/50 border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{huurder.naam}</p>
                  <p className="text-xs text-muted-foreground">
                    {getPropertyName(huurder.property_id)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/huurders')}
                >
                  Bekijk
                </Button>
              </div>
            ))}
            
            {openstaand.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                + {openstaand.length - 3} meer
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/huurders')}
            >
              Alle huurders
            </Button>
            <Button
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://www.portaldasfinancas.gov.pt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
                Portal das Finanças
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
