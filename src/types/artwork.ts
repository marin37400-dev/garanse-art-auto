export interface AirtableArtwork {
  id: string;
  fields: {
    Name?: string;
    Citation?: string;
    Format?: string;
    Dimension?: string;
    Prix?: number;
    "Date de création"?: string;
    "Mise en exposition à"?: string;
    "Date de vente"?: string;
    "Vendue à"?: string;
    Adresse?: string;
    "Numéro tél"?: string;
    "Lieu de vente"?: string;
    "Mois de vente"?: string;
    "Année de vente"?: string;
    "Facture générée"?: boolean;
    Documents?: Array<{ url: string; filename: string }>;
  };
}

export interface Artwork {
  id: string;
  name: string;
  citation: string;
  format: string;
  dimension: string;
  prix: number;
  dateCreation: string;
  exposition: string;
  dateVente: string | null;
  vendueA: string | null;
  adresse: string | null;
  telephone: string | null;
  lieuVente: string | null;
  moisVente: string | null;
  anneeVente: string | null;
  factureGeneree: boolean;
  documents: Array<{ url: string; filename: string }>;
}

export function mapAirtableToArtwork(record: AirtableArtwork): Artwork {
  const f = record.fields;
  return {
    id: record.id,
    name: f.Name || "Sans titre",
    citation: f.Citation || "",
    format: f.Format || "",
    dimension: f.Dimension || "",
    prix: f.Prix || 0,
    dateCreation: f["Date de création"] || "",
    exposition: f["Mise en exposition à"] || "",
    dateVente: f["Date de vente"] || null,
    vendueA: f["Vendue à"] || null,
    adresse: f.Adresse || null,
    telephone: f["Numéro tél"] || null,
    lieuVente: f["Lieu de vente"] || null,
    moisVente: f["Mois de vente"] || null,
    anneeVente: f["Année de vente"] || null,
    factureGeneree: f["Facture générée"] || false,
    documents: f.Documents || [],
  };
}
