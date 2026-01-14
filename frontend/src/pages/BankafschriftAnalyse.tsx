import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  parseAIOutput,
  validateAIOutput,
  convertToTransacties,
  categoriseerOnbekend,
  berekenTotaalUitgaven,
  berekenNettoCashflow,
  getCategorieOptions,
  formatCurrency,
  getMaandNaam,
  getQwenPromptTemplate,
  type GecategoriseerdeTransacties,
} from "@/lib/bankafschriftHelpers";
import {
  FileText,
  Copy,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Building2,
  Save,
  RefreshCw,
  ArrowRight,
  CircleDollarSign,
  Home,
  Banknote,
} from "lucide-react";

interface Property {
  id: string;
  naam: string;
  locatie: string;
}

export default function BankafschriftAnalyse() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedMaand, setSelectedMaand] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [jsonInput, setJsonInput] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [transacties, setTransacties] = useState<GecategoriseerdeTransacties | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPromptHelper, setShowPromptHelper] = useState(false);

  // Laad panden bij mount
  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, naam, locatie")
      .eq("user_id", user?.id)
      .order("naam");

    if (error) {
      console.error("Error loading properties:", error);
      toast({
        title: "Fout bij laden",
        description: "Kon panden niet laden",
        variant: "destructive",
      });
    } else {
      setProperties(data || []);
      if (data && data.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(data[0].id);
      }
    }
  };

  // Parse JSON input
  const handleParseJson = () => {
    setParseError(null);
    setTransacties(null);

    if (!jsonInput.trim()) {
      setParseError("Voer eerst JSON in van de AI analyse.");
      return;
    }

    const parsed = parseAIOutput(jsonInput);
    if (!parsed) {
      setParseError(
        "Kon JSON niet parsen. Controleer of de output het juiste formaat heeft."
      );
      return;
    }

    const validation = validateAIOutput(parsed);
    if (!validation.valid) {
      setParseError(
        `Validatiefouten: ${validation.errors.join(", ")}`
      );
      return;
    }

    const converted = convertToTransacties(parsed);
    setTransacties(converted);

    toast({
      title: "JSON geparsed",
      description: `${converted.onbekend.length} onbekende posten gevonden`,
    });
  };

  // Hercategoriseer onbekende post
  const handleCategoriseer = (index: number, categorie: string) => {
    if (!transacties) return;
    const nieuweTransacties = categoriseerOnbekend(transacties, index, categorie);
    setTransacties(nieuweTransacties);
  };

  // Opslaan naar database
  const handleSave = async () => {
    if (!transacties || !selectedPropertyId || !user) {
      toast({
        title: "Kan niet opslaan",
        description: "Selecteer eerst een pand en parse de JSON.",
        variant: "destructive",
      });
      return;
    }

    if (transacties.onbekend.length > 0) {
      toast({
        title: "Onbekende posten",
        description: "Categoriseer eerst alle onbekende posten voordat je opslaat.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Maak datum voor eerste dag van de maand
    const maandDatum = `${selectedMaand}-01`;

    try {
      // Upsert: update als bestaat, insert als nieuw
      const { error } = await supabase
        .from("maandelijkse_transacties")
        .upsert(
          {
            user_id: user.id,
            property_id: selectedPropertyId,
            maand: maandDatum,
            huur_inkomsten: transacties.huur_inkomsten,
            hypotheek_aflossing: transacties.hypotheek_aflossing,
            hypotheek_rente: transacties.hypotheek_rente,
            imi_belasting: transacties.imi_belasting,
            onderhoud: transacties.onderhoud,
            utilities: transacties.utilities,
            verzekering: transacties.verzekering,
            overig: transacties.overig,
            ai_analyse_gebruikt: true,
          },
          {
            onConflict: "property_id,maand",
          }
        );

      if (error) throw error;

      toast({
        title: "Opgeslagen!",
        description: `Transacties voor ${getMaandNaam(new Date(maandDatum))} zijn opgeslagen.`,
      });

      // Reset form
      setJsonInput("");
      setTransacties(null);
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Kon transacties niet opslaan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Kopieer prompt naar clipboard
  const copyPrompt = () => {
    navigator.clipboard.writeText(getQwenPromptTemplate());
    toast({
      title: "Gekopieerd!",
      description: "Prompt is naar je klembord gekopieerd.",
    });
  };

  // Generate maand options (laatste 12 maanden)
  const getMaandOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = getMaandNaam(date);
      options.push({ value, label });
    }
    return options;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Bankafschrift Analyse
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyseer je bankafschriften met AI en categoriseer transacties per pand
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Linker kolom: Input */}
          <div className="space-y-6">
            {/* Selectie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Selecteer Pand & Periode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pand</Label>
                    <Select
                      value={selectedPropertyId}
                      onValueChange={setSelectedPropertyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer pand" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.naam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Maand</Label>
                    <Select
                      value={selectedMaand}
                      onValueChange={setSelectedMaand}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaandOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Prompt Helper */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Stap 1: AI Analyse
                </CardTitle>
                <CardDescription>
                  Gebruik een AI zoals Qwen om je bankafschrift te analyseren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPromptHelper(!showPromptHelper)}
                  className="w-full"
                >
                  {showPromptHelper ? "Verberg" : "Toon"} AI Prompt Template
                </Button>

                {showPromptHelper && (
                  <div className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Instructies</AlertTitle>
                      <AlertDescription className="text-sm">
                        <ol className="list-decimal list-inside space-y-1 mt-2">
                          <li>Kopieer de prompt hieronder</li>
                          <li>Open Qwen, ChatGPT of een andere AI</li>
                          <li>Plak de prompt samen met je bankafschrift (tekst of screenshot)</li>
                          <li>Kopieer de JSON output terug naar dit formulier</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                        {getQwenPromptTemplate()}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={copyPrompt}
                        className="absolute top-2 right-2"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Kopieer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JSON Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Stap 2: Plak AI Output
                </CardTitle>
                <CardDescription>
                  Plak de JSON output van de AI analyse hieronder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`{\n  "huur_inkomsten": [950, 800],\n  "hypotheek_aflossing": 400,\n  "hypotheek_rente": 277,\n  ...\n}`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />

                {parseError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{parseError}</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleParseJson} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyseer JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Rechter kolom: Resultaten */}
          <div className="space-y-6">
            {transacties ? (
              <>
                {/* Samenvatting */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CircleDollarSign className="h-5 w-5" />
                      Maandoverzicht
                    </CardTitle>
                    <CardDescription>
                      {getMaandNaam(new Date(`${selectedMaand}-01`))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Inkomsten */}
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Inkomsten</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                          {formatCurrency(transacties.huur_inkomsten)}
                        </p>
                      </div>

                      {/* Uitgaven */}
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm font-medium">Uitgaven</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                          {formatCurrency(berekenTotaalUitgaven(transacties))}
                        </p>
                      </div>

                      {/* Netto */}
                      <div className={`p-4 rounded-lg ${
                        berekenNettoCashflow(transacties) >= 0
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : "bg-orange-50 dark:bg-orange-950/30"
                      }`}>
                        <div className={`flex items-center gap-2 ${
                          berekenNettoCashflow(transacties) >= 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          <Banknote className="h-4 w-4" />
                          <span className="text-sm font-medium">Netto Cashflow</span>
                        </div>
                        <p className={`text-2xl font-bold mt-1 ${
                          berekenNettoCashflow(transacties) >= 0
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-orange-700 dark:text-orange-300"
                        }`}>
                          {formatCurrency(berekenNettoCashflow(transacties))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gecategoriseerde Transacties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <TransactionRow
                        label="Huur Inkomsten"
                        amount={transacties.huur_inkomsten}
                        isIncome
                      />
                      <Separator />
                      <TransactionRow
                        label="Hypotheek Aflossing"
                        amount={transacties.hypotheek_aflossing}
                      />
                      <TransactionRow
                        label="Hypotheek Rente"
                        amount={transacties.hypotheek_rente}
                      />
                      <TransactionRow
                        label="IMI Belasting"
                        amount={transacties.imi_belasting}
                      />
                      <TransactionRow
                        label="Onderhoud"
                        amount={transacties.onderhoud}
                      />
                      <TransactionRow
                        label="Utilities"
                        amount={transacties.utilities}
                      />
                      <TransactionRow
                        label="Verzekering"
                        amount={transacties.verzekering}
                      />
                      <TransactionRow
                        label="Overig"
                        amount={transacties.overig}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Onbekende posten */}
                {transacties.onbekend.length > 0 && (
                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        Onbekende Posten ({transacties.onbekend.length})
                      </CardTitle>
                      <CardDescription>
                        Categoriseer deze posten om op te slaan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transacties.onbekend.map((post, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {post.omschrijving}
                              </p>
                              <p className={`text-lg font-bold ${
                                post.bedrag >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}>
                                {formatCurrency(post.bedrag)}
                              </p>
                            </div>
                            <Select
                              onValueChange={(value) =>
                                handleCategoriseer(index, value)
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Selecteer categorie" />
                              </SelectTrigger>
                              <SelectContent>
                                {getCategorieOptions().map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Opslaan knop */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || transacties.onbekend.length > 0}
                      className="w-full"
                      size="lg"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Opslaan...
                        </>
                      ) : transacties.onbekend.length > 0 ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Categoriseer eerst alle onbekende posten
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Transacties Opslaan
                        </>
                      )}
                    </Button>

                    {transacties.onbekend.length === 0 && (
                      <Alert className="mt-4">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          Alle transacties zijn gecategoriseerd. Klaar om op te slaan!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Nog geen analyse
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plak JSON van de AI analyse en klik op "Analyseer JSON"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Helper component voor transactie rij
function TransactionRow({
  label,
  amount,
  isIncome = false,
}: {
  label: string;
  amount: number;
  isIncome?: boolean;
}) {
  if (amount === 0) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-medium ${
          isIncome ? "text-green-600" : "text-red-600"
        }`}
      >
        {isIncome ? "+" : "-"}{formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}
