/**
 * Helper functies voor Recibo de Renda herinneringen
 */

import { differenceInDays, addMonths, format } from "date-fns";
import { nl } from "date-fns/locale";

export interface Huurder {
  id: string;
  naam: string;
  property_id: string;
  actief: boolean;
  laatste_recibo_datum?: string | null;
  recibo_bestand_url?: string | null;
  herinnering_recibo_dag?: number;
}

export interface Property {
  id: string;
  naam: string;
}

/**
 * Check of vandaag de herinnering dag is
 */
export const isReciboReminderDay = (herinnering_dag: number = 5): boolean => {
  const today = new Date();
  return today.getDate() === herinnering_dag;
};

/**
 * Bereken dagen sinds laatste Recibo
 */
export const daysSinceLastRecibo = (laatste_datum?: string | null): number | null => {
  if (!laatste_datum) return null;
  
  const lastDate = new Date(laatste_datum);
  const today = new Date();
  return differenceInDays(today, lastDate);
};

/**
 * Check of Recibo ouder is dan 1 maand
 */
export const isReciboOverdue = (laatste_datum?: string | null): boolean => {
  const days = daysSinceLastRecibo(laatste_datum);
  if (days === null) return true; // Nooit ontvangen = openstaand
  return days > 35; // >35 dagen = meer dan 1 maand (buffer)
};

/**
 * Bepaal of huurder herinnering nodig heeft
 */
export const needsReciboReminder = (huurder: Huurder): boolean => {
  // Alleen actieve huurders
  if (!huurder.actief) return false;
  
  // Check of Recibo ouder is dan 1 maand of nooit ontvangen
  return isReciboOverdue(huurder.laatste_recibo_datum);
};

/**
 * Filter huurders die herinnering nodig hebben
 */
export const getOpenstaandeRecibos = (huurders: Huurder[]): Huurder[] => {
  return huurders.filter(needsReciboReminder);
};

/**
 * Bereken volgende herinnering datum
 */
export const getNextReminderDate = (herinnering_dag: number = 5): Date => {
  const today = new Date();
  const nextMonth = addMonths(today, 1);
  
  // Zet de dag van volgende maand
  const next = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), herinnering_dag);
  
  // Als de datum al geweest is deze maand, neem volgende maand
  if (next < today) {
    return new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      herinnering_dag
    );
  }
  
  return next;
};

/**
 * Genereer Google Calendar iCal link voor Recibo herinnering
 */
export const generateReciboCalendarLink = (
  huurderNaam: string,
  pandNaam: string,
  herinnering_dag: number = 5
): string => {
  const nextDate = getNextReminderDate(herinnering_dag);
  
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const title = `Recibo de Renda aanvragen - ${huurderNaam}`;
  const description = `Vraag de Recibo de Renda aan bij Portal das Finanças voor huurder ${huurderNaam} (${pandNaam}).\n\nLink: https://www.portaldasfinancas.gov.pt/`;
  const start = formatICSDate(nextDate);
  const end = formatICSDate(new Date(nextDate.getTime() + 60 * 60 * 1000)); // 1 uur later
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description)}`;
};

/**
 * Genereer Portal das Finanças link
 */
export const getPortalFinancasLink = (): string => {
  return "https://www.portaldasfinancas.gov.pt/";
};

/**
 * Format Recibo status voor UI
 */
export const getReciboStatus = (
  laatste_datum?: string | null
): {
  label: string;
  color: "success" | "warning" | "destructive" | "default";
  description: string;
} => {
  if (!laatste_datum) {
    return {
      label: "Nog niet ontvangen",
      color: "destructive",
      description: "Nog geen Recibo de Renda ontvangen",
    };
  }
  
  const days = daysSinceLastRecibo(laatste_datum);
  
  if (days === null) {
    return {
      label: "Onbekend",
      color: "default",
      description: "Status onbekend",
    };
  }
  
  if (days <= 35) {
    return {
      label: "Up-to-date",
      color: "success",
      description: `Ontvangen ${days} dagen geleden`,
    };
  }
  
  if (days <= 60) {
    return {
      label: "Actie vereist",
      color: "warning",
      description: `Laatste ontvangst ${days} dagen geleden`,
    };
  }
  
  return {
    label: "Te laat",
    color: "destructive",
    description: `Laatste ontvangst ${days} dagen geleden - urgent aanvragen!`,
  };
};

/**
 * Genereer herinnering tekst voor notificatie
 */
export const getReciboReminderText = (
  huurderNaam: string,
  pandNaam: string
): string => {
  return `Vraag Recibo de Renda aan voor ${huurderNaam} (${pandNaam})`;
};

/**
 * Format datum voor weergave
 */
export const formatReciboDate = (datum?: string | null): string => {
  if (!datum) return "Nooit";
  
  try {
    return format(new Date(datum), "d MMMM yyyy", { locale: nl });
  } catch {
    return "Ongeldig";
  }
};

/**
 * Valideer upload URL (simulatie - echte validatie zou server-side zijn)
 */
export const isValidUploadUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.includes('.pdf') || 
           url.includes('.png') || 
           url.includes('.jpg') || 
           url.includes('drive.google.com') ||
           url.includes('dropbox.com');
  } catch {
    return false;
  }
};

/**
 * Info tekst over Recibo de Renda
 */
export const getReciboInfoText = (): string => {
  return `De Recibo de Renda is het officiële bewijs van huurinkomsten in Portugal. 
Dit document is verplicht voor:
• Fiscale aftrek in Nederland (Box 3)
• Bewijs van inkomsten bij Portugese belastingdienst
• Voorkomen van boetes bij controles

De Autoridade Tributária (AT) stuurt dit NIET automatisch. 
Je moet het zelf aanvragen via Portal das Finanças.`;
};
