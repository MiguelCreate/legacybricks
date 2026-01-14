import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface BeginnerMetricCardProps {
  title: string;
  value: string;
  whatIsIt: string;
  whyImportant: string;
  isGood: {
    label: string;
    color: "success" | "warning" | "destructive";
  };
}

export const BeginnerMetricCard = ({
  title,
  value,
  whatIsIt,
  whyImportant,
  isGood,
}: BeginnerMetricCardProps) => {
  const colorClasses = {
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
    destructive: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  return (
    <Card className="p-5 space-y-4 hover:shadow-glow transition-all">
      {/* 1. Wat is dit? */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <InfoTooltip title={title} content={whatIsIt} />
        </div>
        <p className="text-xs text-muted-foreground">{whatIsIt}</p>
      </div>

      {/* 2. Jouw waarde */}
      <div className="py-3 px-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground mb-1">Jouw waarde:</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>

      {/* 3. Waarom belangrijk? */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">💡 Waarom belangrijk?</p>
        <p className="text-xs text-muted-foreground">{whyImportant}</p>
      </div>

      {/* 4. Is dit goed? */}
      <div className={`p-3 rounded-lg border ${colorClasses[isGood.color]}`}>
        <p className="text-sm font-semibold">{isGood.label}</p>
      </div>
    </Card>
  );
};
