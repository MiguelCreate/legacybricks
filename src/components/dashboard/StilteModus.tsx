import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Clock, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StilteModusProps {
  vrijheidMaanden: number;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const StilteModus = ({ vrijheidMaanden, isEnabled, onToggle }: StilteModusProps) => {
  const { user } = useAuth();

  const handleToggle = async (checked: boolean) => {
    onToggle(checked);
    
    if (user) {
      await supabase
        .from("profiles")
        .update({ stilte_modus_aan: checked } as any)
        .eq("user_id", user.id);
    }
  };

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-end gap-2 mb-4">
        <Moon className="w-4 h-4 text-muted-foreground" />
        <Label htmlFor="stilte-modus" className="text-sm text-muted-foreground">
          Stilte-Modus
        </Label>
        <Switch
          id="stilte-modus"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Moon className="w-4 h-4 text-primary" />
        <Label htmlFor="stilte-modus" className="text-sm text-primary font-medium">
          Stilte-Modus Actief
        </Label>
        <Switch
          id="stilte-modus"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <CardContent className="py-12 text-center space-y-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-10 h-10 text-primary animate-pulse" />
          </div>

          <div className="space-y-4">
            <p className="text-3xl font-light text-foreground">
              Je hebt genoeg.
            </p>
            <p className="text-xl text-muted-foreground">
              Je bent veilig.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-lg text-primary">
            <Shield className="w-5 h-5" />
            <span>Je portefeuille geeft je</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <span className="text-4xl font-bold text-primary">
              {Math.round(vrijheidMaanden)} maanden
            </span>
          </div>

          <p className="text-muted-foreground">
            vrijheid zonder inkomen
          </p>

          <div className="pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground italic">
              "Rust maar. Je hebt goed voor jezelf gezorgd."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
