import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artwork } from "@/types/artwork";
import { mapAirtableToArtwork } from "@/types/artwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  FileText,
  ShieldCheck,
  RefreshCw,
  Search,
  Image,
  Clock,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("garanse_webhook_url") || "");

  const { data: artworks = [], isLoading, error, refetch } = useQuery<Artwork[]>({
    queryKey: ["artworks"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("airtable-proxy", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data.records || []).map(mapAirtableToArtwork);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (artworkId: string) => {
      const { data, error } = await supabase.functions.invoke("process-sale", {
        body: { recordId: artworkId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Documents générés", description: "Facture et certificat créés avec succès." });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const saveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem("garanse_webhook_url", url);
  };

  const sold = artworks.filter((a) => a.dateVente);
  const pending = sold.filter((a) => !a.factureGeneree);
  const completed = sold.filter((a) => a.factureGeneree);
  const unsold = artworks.filter((a) => !a.dateVente);

  const filtered = artworks.filter(
    (a) =>
      a.citation.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="font-display text-xl font-semibold">Erreur de connexion</h2>
            <p className="text-muted-foreground text-sm">
              Impossible de charger les données Airtable. Vérifiez votre token API et l'ID de la base.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Garanse
              </h1>
              <p className="text-xs text-muted-foreground font-body">
                Gestion des ventes & documents
              </p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Image className="w-5 h-5" />} label="Total œuvres" value={artworks.length} />
          <StatCard icon={<CircleDollarSign className="w-5 h-5" />} label="Vendues" value={sold.length} color="success" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="En attente" value={pending.length} color="warning" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Facturées" value={completed.length} color="accent" />
        </div>

        {/* Webhook Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Configuration Webhook Zapier/Make</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={(e) => saveWebhookUrl(e.target.value)}
                className="font-body text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast({ title: "URL sauvegardée", description: "L'URL webhook a été enregistrée." })}
              >
                Sauver
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Configurez votre Zap pour appeler l'endpoint <code className="bg-muted px-1 rounded text-xs">/process-sale</code> avec le recordId.
            </p>
          </CardContent>
        </Card>

        {/* Pending Sales */}
        {pending.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Ventes en attente de facturation ({pending.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onGenerate={() => generateMutation.mutate(artwork.id)}
                  isGenerating={generateMutation.isPending && generateMutation.variables === artwork.id}
                />
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* All Artworks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Toutes les œuvres</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-body text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onGenerate={
                    artwork.dateVente && !artwork.factureGeneree
                      ? () => generateMutation.mutate(artwork.id)
                      : undefined
                  }
                  isGenerating={generateMutation.isPending && generateMutation.variables === artwork.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: "success" | "warning" | "accent";
}) {
  const colorClasses = {
    success: "text-success",
    warning: "text-warning",
    accent: "text-accent",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={color ? colorClasses[color] : "text-primary"}>{icon}</div>
          <div>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-xs text-muted-foreground font-body">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArtworkCard({
  artwork,
  onGenerate,
  isGenerating,
}: {
  artwork: Artwork;
  onGenerate?: () => void;
  isGenerating?: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-display leading-tight">{artwork.citation || "Sans titre"}</CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            {artwork.dateVente ? (
              artwork.factureGeneree ? (
                <Badge variant="secondary" className="bg-success/15 text-success text-xs">
                  Facturée
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-warning/15 text-warning text-xs">
                  En attente
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-xs">
                En stock
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {artwork.citation && (
          <p className="text-sm text-muted-foreground italic font-body line-clamp-2">
            « {artwork.citation} »
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground font-body">
          {artwork.dimension && <span>📐 {artwork.dimension}</span>}
          {artwork.prix > 0 && <span>💰 {artwork.prix} €</span>}
          {artwork.dateVente && <span>📅 {artwork.dateVente}</span>}
          {artwork.vendueA && <span>👤 {artwork.vendueA}</span>}
        </div>

        {(artwork.facture.length > 0 || artwork.certificat.length > 0) && (
          <div className="flex gap-2 mt-2">
            {artwork.facture.map((doc, i) => (
              <a key={`f-${i}`} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <FileText className="w-3 h-3" /> Facture
              </a>
            ))}
            {artwork.certificat.map((doc, i) => (
              <a key={`c-${i}`} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ShieldCheck className="w-3 h-3" /> Certificat
              </a>
            ))}
          </div>
        )}

        {onGenerate && (
          <Button
            onClick={onGenerate}
            size="sm"
            className="w-full mt-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                <ShieldCheck className="w-4 h-4 mr-2" />
              </>
            )}
            Générer facture & certificat
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default Index;
