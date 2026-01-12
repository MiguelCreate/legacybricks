import { format, subMonths } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * Berekent het nieuwe huurbedrag op basis van indexatie percentage
 */
export const calculateNewRent = (currentRent: number, indexationPercentage: number): number => {
  if (!currentRent || !indexationPercentage) return currentRent;
  return Math.round(currentRent * (1 + indexationPercentage / 100) * 100) / 100;
};

/**
 * Genereert een Google Calendar iCal link voor huurindexatie herinnering
 */
export const generateIndexationCalendarLink = (
  propertyName: string,
  changeDate: string,
  newRent: number,
  currentRent: number
): string => {
  const date = new Date(changeDate);
  const reminderDate = subMonths(date, 2); // 2 maanden van tevoren
  
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const title = `Huurwijziging ${propertyName}`;
  const description = `Huur stijgt van €${currentRent} naar €${newRent} op ${format(date, "d MMMM yyyy", { locale: nl })}. Informeer huurder.`;
  const start = formatICSDate(reminderDate);
  const end = formatICSDate(new Date(reminderDate.getTime() + 60 * 60 * 1000)); // 1 uur later
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description)}`;
};

/**
 * Genereert template bericht voor huurder notificatie
 */
export const generateTenantNotificationText = (
  tenantName: string,
  propertyName: string,
  changeDate: string,
  currentRent: number,
  newRent: number,
  indexationPercentage: number,
  landlordName: string = "[Jouw naam]"
): string => {
  const formattedDate = format(new Date(changeDate), "d MMMM yyyy", { locale: nl });
  
  return `Beste ${tenantName},

Op ${formattedDate} wordt jouw huur voor ${propertyName} aangepast van €${currentRent} naar €${newRent} op basis van de jaarlijkse indexatie (+${indexationPercentage}%).

Dit is conform de Portugese wetgeving en zoals overeengekomen in het huurcontract.

Vriendelijke groet,
${landlordName}`;
};

/**
 * Valideert de datum voor huurwijziging
 */
export const validateIndexationDate = (changeDate: string): { valid: boolean; warning?: string } => {
  const date = new Date(changeDate);
  const today = new Date();
  
  if (date < today) {
    return { valid: false, warning: "⚠️ Datum ligt in het verleden" };
  }
  
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 30) {
    return { valid: true, warning: "⚠️ Let op: minder dan 30 dagen voorafgaande kennisgeving. Portugese wetgeving vereist meestal minimaal 30 dagen." };
  }
  
  return { valid: true };
};

/**
 * Valideert indexatie percentage
 */
export const validateIndexationPercentage = (percentage: number): { valid: boolean; warning?: string } => {
  if (percentage > 5) {
    return { valid: true, warning: "⚠️ Let op: hoge indexatie (>5%) kan huurder afschrikken" };
  }
  
  if (percentage < 0) {
    return { valid: false, warning: "Percentage kan niet negatief zijn" };
  }
  
  return { valid: true };
};

/**
 * Valideert of indexatie van toepassing is op contract type
 */
export const validateContractTypeForIndexation = (contractType: string): { valid: boolean; warning?: string } => {
  if (contractType === "airbnb") {
    return { valid: false, warning: "⚠️ Indexatie is niet van toepassing op korte-termijnverhuur (Airbnb)" };
  }
  
  if (contractType === "koop") {
    return { valid: false, warning: "⚠️ Indexatie is niet van toepassing op koopcontracten" };
  }
  
  return { valid: true };
};
