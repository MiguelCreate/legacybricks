import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface AudioSamenvattingProps {
  nettoVermogen: number;
  maandelijkseCashflow: number;
  laatsteHuurbetaling?: {
    bedrag: number;
    pandNaam: string;
  };
  openActies: number;
}

export const AudioSamenvatting = ({
  nettoVermogen,
  maandelijkseCashflow,
  laatsteHuurbetaling,
  openActies,
}: AudioSamenvattingProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const generateSamenvatting = (): string => {
    const parts: string[] = [];

    // Welkom
    const uur = new Date().getHours();
    if (uur < 12) {
      parts.push("Goedemorgen.");
    } else if (uur < 18) {
      parts.push("Goedemiddag.");
    } else {
      parts.push("Goedenavond.");
    }

    // Laatste huurbetaling
    if (laatsteHuurbetaling && laatsteHuurbetaling.bedrag > 0) {
      parts.push(
        `Vandaag heeft ${laatsteHuurbetaling.pandNaam} €${laatsteHuurbetaling.bedrag.toLocaleString("nl-NL")} huur opgeleverd.`
      );
    }

    // Netto vermogen
    parts.push(
      `Je netto vermogen is nu €${nettoVermogen.toLocaleString("nl-NL")}.`
    );

    // Cashflow
    if (maandelijkseCashflow >= 0) {
      parts.push(
        `Je maandelijkse netto cashflow is €${maandelijkseCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })} positief.`
      );
    } else {
      parts.push(
        `Let op: je maandelijkse cashflow is €${Math.abs(maandelijkseCashflow).toLocaleString("nl-NL", { maximumFractionDigits: 0 })} negatief.`
      );
    }

    // Open acties
    if (openActies === 0) {
      parts.push("Geen acties nodig. Rust maar.");
    } else if (openActies === 1) {
      parts.push("Er is 1 actie die aandacht nodig heeft.");
    } else {
      parts.push(`Er zijn ${openActies} acties die aandacht nodig hebben.`);
    }

    // Afsluiting
    if (maandelijkseCashflow >= 0 && openActies === 0) {
      parts.push("Je portefeuille draait goed. Geniet van je dag.");
    }

    return parts.join(" ");
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Je browser ondersteunt geen spraaksynthese.");
      return;
    }

    // Stop huidige spraak
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "nl-NL";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Probeer een Nederlandse stem te vinden
    const voices = window.speechSynthesis.getVoices();
    const dutchVoice = voices.find(v => v.lang.startsWith("nl"));
    if (dutchVoice) {
      utterance.voice = dutchVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const text = generateSamenvatting();
    
    // Wacht even tot voices geladen zijn
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakText(text);
      };
    } else {
      speakText(text);
    }
  };

  return (
    <Button
      onClick={handlePlay}
      variant={isSpeaking ? "default" : "outline"}
      size="sm"
      className="gap-2"
    >
      {isPlaying && !isSpeaking ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSpeaking ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      {isSpeaking ? "Stop" : "Luister naar portefeuille"}
    </Button>
  );
};
