export interface AirtableArtwork {
  id: string;
  fields: {
    Citation?: string;
    Photo?: Array<{ url: string; filename: string }>;
    Format?: string;
    Dimension?: string;
    Prix?: number;
    "Date de création"?: string;
    Expositions?: string;
    "Date de vente"?: string;
    "Vendue à"?: string;
    "Lieu de vente"?: string;
    "Mois de vente"?: string;
    "Année de vente"?: string;
    Facture?: Array<{ url: string; filename: string }>;
    "Facture générée"?: boolean;
    Certificat?: Array<{ url: string; filename: string }>;
    "Certificat généré"?: boolean;
    "Numéro de facture"?: string;
    "Test Lovable"?: boolean;
  };
}

export interface Artwork {
  id: string;
  citation: string;
  photo: Array<{ url: string; filename: string }>;
  format: string;
  dimension: string;
  prix: number;
  dateCreation: string;
  expositions: string;
  dateVente: string | null;
  vendueA: string | null;
  lieuVente: string | null;
  moisVente: string | null;
  anneeVente: string | null;
  facture: Array<{ url: string; filename: string }>;
  factureGeneree: boolean;
  certificat: Array<{ url: string; filename: string }>;
  certificatGenere: boolean;
  numeroFacture: string;
  testLovable: boolean;
}

export function mapAirtableToArtwork(record: AirtableArtwork): Artwork {
  const f = record.fields;
  return {
    id: record.id,
    citation: f.Citation || "",
    photo: f.Photo || [],
    format: f.Format || "",
    dimension: f.Dimension || "",
    prix: f.Prix || 0,
    dateCreation: f["Date de création"] || "",
    expositions: f.Expositions || "",
    dateVente: f["Date de vente"] || null,
    vendueA: f["Vendue à"] || null,
    lieuVente: f["Lieu de vente"] || null,
    moisVente: f["Mois de vente"] || null,
    anneeVente: f["Année de vente"] || null,
    facture: f.Facture || [],
    factureGeneree: f["Facture générée"] || false,
    certificat: f.Certificat || [],
    certificatGenere: f["Certificat généré"] || false,
    numeroFacture: f["Numéro de facture"] || "",
    testLovable: f["Test Lovable"] || false,
  };
}
