import { useState, useEffect } from "react";
import { Star, Plus, Search, Download, ExternalLink, Trash2, Eye, MoreVertical, Calculator, Archive } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  calculatePrijsPerM2,
  compareWithRegioGemiddelde,
  getStatusLabel,
  getStatusColor,
  extractDomain,
  formatFavorietenForExport,
  type Favoriet,
} from "@/lib/favorietenHelpers";
import { FavorietenForm } from "@/components/favorieten/FavorietenForm";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const Favorieten = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [favorieten, setFavorieten] = useState<Favoriet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingFavoriet, setEditingFavoriet] = useState<Favoriet | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorieten();
    }
  }, [user]);

  const fetchFavorieten = async () => {
    try {
      const { data, error } = await supabase
        .from("favorieten")
        .select("*")
        .eq("gearchiveerd", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorieten(data || []);
    } catch (error: any) {
      toast({
        title: "Fout bij laden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze favoriet wilt verwijderen?")) return;

    try {
      const { error } = await supabase.from("favorieten").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Favoriet verwijderd" });
      fetchFavorieten();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("favorieten")
        .update({ gearchiveerd: true })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Favoriet gearchiveerd" });
      fetchFavorieten();
    } catch (error: any) {
      toast({
        title: "Fout bij archiveren",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("favorieten")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Status bijgewerkt" });
      fetchFavorieten();
    } catch (error: any) {
      toast({
        title: "Fout bij bijwerken",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAnalyseer = (favoriet: Favoriet) => {
    // Navigeer naar analysator met pre-fill
    const params = new URLSearchParams();
    if (favoriet.prijs) params.append('aankoopprijs', favoriet.prijs.toString());
    if (favoriet.locatie) params.append('locatie', favoriet.locatie);
    if (favoriet.oppervlakte_m2) params.append('oppervlakte', favoriet.oppervlakte_m2.toString());
    
    navigate(`/analysator?${params.toString()}`);
  };

  const handleExport = () => {
    const exportData = formatFavorietenForExport(filteredFavorieten);
    
    // Create CSV
    const headers = Object.keys(exportData[0]);
    const csv = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `favorieten_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({ title: "Export gedownload" });
  };

  const filteredFavorieten = favorieten.filter(f => {
    const matchesSearch = 
      !searchQuery ||
      f.locatie?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.notitie?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.link.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: favorieten.length,
    inOverweging: favorieten.filter(f => f.status === 'in_overweging').length,
    geanalyseerd: favorieten.filter(f => f.status === 'geanalyseerd').length,
    nieuw: favorieten.filter(f => f.status === 'nieuw').length,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Favorieten
                </h1>
                <InfoTooltip
                  title="Favorieten / Marktwijzer"
                  content="Sla interessante vastgoedadvertenties op, label ze en analyseer later. Perfect als persoonlijke marktwijzer."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {stats.total} {stats.total === 1 ? "favoriet" : "favorieten"}
                {stats.inOverweging > 0 && ` • ${stats.inOverweging} in overweging`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport} className="gap-2" disabled={favorieten.length === 0}>
                <Download className="w-4 h-4" />
                Exporteer
              </Button>
              <Button onClick={() => { setEditingFavoriet(null); setShowForm(true); }} className="gradient-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Nieuwe Favoriet
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Totaal</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Nieuw</p>
              <p className="text-2xl font-bold text-primary">{stats.nieuw}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">In Overweging</p>
              <p className="text-2xl font-bold text-warning">{stats.inOverweging}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Geanalyseerd</p>
              <p className="text-2xl font-bold text-success">{stats.geanalyseerd}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op locatie of notitie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="nieuw">Nieuw</SelectItem>
                <SelectItem value="bekeken">Bekeken</SelectItem>
                <SelectItem value="in_overweging">In Overweging</SelectItem>
                <SelectItem value="geanalyseerd">Geanalyseerd</SelectItem>
                <SelectItem value="afgekeurd">Afgekeurd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : filteredFavorieten.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || statusFilter !== "all" ? "Geen favorieten gevonden" : "Nog geen favorieten"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Probeer een andere zoekopdracht of filter"
                  : "Begin met het toevoegen van interessante vastgoedadvertenties die je wilt bewaren"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste favoriet toevoegen
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link / Bron</TableHead>
                    <TableHead>Locatie</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead className="text-right">m²</TableHead>
                    <TableHead className="text-right">Prijs/m²</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notitie</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFavorieten.map((fav) => {
                    const prijsPerM2 = fav.prijs && fav.oppervlakte_m2 
                      ? calculatePrijsPerM2(fav.prijs, fav.oppervlakte_m2)
                      : null;
                    
                    const vergelijking = prijsPerM2 && fav.locatie
                      ? compareWithRegioGemiddelde(prijsPerM2, fav.locatie)
                      : null;

                    return (
                      <TableRow key={fav.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a
                              href={fav.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {extractDomain(fav.link) || 'Link'}
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(fav.created_at), "d MMM yyyy", { locale: nl })}
                          </p>
                        </TableCell>
                        <TableCell>{fav.locatie || '-'}</TableCell>
                        <TableCell className="text-right">
                          {fav.prijs ? formatCurrency(fav.prijs) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {fav.oppervlakte_m2 ? `${fav.oppervlakte_m2} m²` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {prijsPerM2 ? (
                            <div>
                              <p className="font-medium">{formatCurrency(prijsPerM2)}/m²</p>
                              {vergelijking && vergelijking.verschilPercentage !== null && (
                                <p className={`text-xs ${
                                  vergelijking.verschilPercentage > 0 ? 'text-destructive' : 'text-success'
                                }`}>
                                  {vergelijking.verschilPercentage > 0 ? '+' : ''}{vergelijking.verschilPercentage}%
                                </p>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={fav.status}
                            onValueChange={(val) => handleStatusChange(fav.id, val)}
                          >
                            <SelectTrigger className="w-36">
                              <Badge variant={getStatusColor(fav.status)}>
                                {getStatusLabel(fav.status)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nieuw">Nieuw</SelectItem>
                              <SelectItem value="bekeken">Bekeken</SelectItem>
                              <SelectItem value="in_overweging">In Overweging</SelectItem>
                              <SelectItem value="geanalyseerd">Geanalyseerd</SelectItem>
                              <SelectItem value="afgekeurd">Afgekeurd</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate" title={fav.notitie || ''}>
                            {fav.notitie || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAnalyseer(fav)}>
                                <Calculator className="w-4 h-4 mr-2" />
                                Analyseer dit pand
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingFavoriet(fav); setShowForm(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Bewerken
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(fav.id)}>
                                <Archive className="w-4 h-4 mr-2" />
                                Archiveren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(fav.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Verwijderen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <FavorietenForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingFavoriet(null); }}
        onSuccess={() => { setShowForm(false); setEditingFavoriet(null); fetchFavorieten(); }}
        editingFavoriet={editingFavoriet}
      />
    </AppLayout>
  );
};

export default Favorieten;
