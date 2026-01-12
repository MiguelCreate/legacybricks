import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Trophy, 
  Medal, 
  Star, 
  Target, 
  Building2,
  TrendingUp,
  Shield,
  Crown
} from "lucide-react";

interface Badge {
  id: string;
  naam: string;
  beschrijving: string;
  icon: string;
  behaald: boolean;
  datum?: string;
}

interface GamificationBannerProps {
  erfgoedLevel: number;
  totaalPanden: number;
  schuldenvrij: number;
  doelenBehaald: number;
  badges: Badge[];
}

const LEVEL_NAMEN = [
  "Beginner",
  "Starter",
  "Groeier",
  "Bouwer",
  "Expert",
  "Meester",
  "Veteraan",
  "Elite",
  "Legende",
  "Erfgoed Meester"
];

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000];

export const GamificationBanner = ({
  erfgoedLevel,
  totaalPanden,
  schuldenvrij,
  doelenBehaald,
  badges,
}: GamificationBannerProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Bereken XP en voortgang naar volgend level
  const currentXP = (totaalPanden * 100) + (schuldenvrij * 200) + (doelenBehaald * 150) + (badges.filter(b => b.behaald).length * 50);
  const currentLevelXP = LEVEL_THRESHOLDS[Math.min(erfgoedLevel - 1, 9)] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[Math.min(erfgoedLevel, 9)] || LEVEL_THRESHOLDS[9];
  const progressToNextLevel = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const behaaldeeBadges = badges.filter(b => b.behaald);

  const getLevelIcon = () => {
    if (erfgoedLevel >= 8) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (erfgoedLevel >= 5) return <Trophy className="w-6 h-6 text-primary" />;
    if (erfgoedLevel >= 3) return <Medal className="w-6 h-6 text-primary" />;
    return <Star className="w-6 h-6 text-primary" />;
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'building': return <Building2 className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'target': return <Target className="w-4 h-4" />;
      case 'star': return <Star className="w-4 h-4" />;
      default: return <Medal className="w-4 h-4" />;
    }
  };

  return (
    <Card className="shadow-card bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Level Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
              {getLevelIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Level {erfgoedLevel}</span>
                <InfoTooltip
                  title="Erfgoed Level"
                  content="Je level stijgt naarmate je panden toevoegt, schuldenvrij raakt en doelen behaalt. Elk level ontgrendelt nieuwe inzichten."
                />
              </div>
              <p className="text-xl font-bold text-foreground">
                {LEVEL_NAMEN[Math.min(erfgoedLevel - 1, 9)]}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={progressToNextLevel} className="w-32 h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentXP)} / {nextLevelXP} XP
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-1">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold">{totaalPanden}</p>
              <p className="text-xs text-muted-foreground">Panden</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-1">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-lg font-bold">{schuldenvrij}</p>
              <p className="text-xs text-muted-foreground">Schuldenvrij</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mb-1">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-lg font-bold">{doelenBehaald}</p>
              <p className="text-xs text-muted-foreground">Doelen</p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Behaalde Badges</p>
            <div className="flex gap-2 flex-wrap">
              {behaaldeeBadges.length > 0 ? (
                behaaldeeBadges.slice(0, 5).map((badge) => (
                  <Badge
                    key={badge.id}
                    variant="secondary"
                    className="gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {getBadgeIcon(badge.icon)}
                    {badge.naam}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Nog geen badges behaald
                </span>
              )}
              {behaaldeeBadges.length > 5 && (
                <Badge variant="outline">
                  +{behaaldeeBadges.length - 5}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
