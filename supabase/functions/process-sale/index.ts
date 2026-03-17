import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_ID = "appLE4R18nylnmOTF";
const TABLE_ID = "tblocgx4BO6Pqjfa7";

const ARTIST = {
  name: "Garanse",
  address: "21 Rue de Monteaux\n37530 Cangey\nFrance",
  phone: "06 63 77 80 84",
  email: "annegaranse@gmail.com",
  siret: "83533116600024",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

async function generateInvoicePdf(record: any): Promise<Uint8Array> {
  const f = record.fields;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const color = rgb(0.17, 0.17, 0.17);
  const accent = rgb(0.71, 0.40, 0.11);

  let y = 790;
  const left = 50;
  const right = 350;

  const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: options.size || fontSize,
      font: options.bold ? fontBold : font,
      color: options.color || color,
    });
  };

  // Title
  drawText("FACTURE", 230, y, { size: 22, bold: true, color: accent });
  y -= 30;

  // Invoice number
  const dateVente = f["Date de vente"] || new Date().toISOString();
  const invoiceNum = `FAC-${new Date(dateVente).getFullYear()}-${record.id.slice(-6).toUpperCase()}`;
  drawText(`N° ${invoiceNum}`, right + 80, y, { size: 9 });
  y -= 14;
  drawText(`Date : ${formatDate(dateVente)}`, right + 80, y, { size: 9 });
  y -= 30;

  // Artist info
  drawText("ARTISTE", left, y, { size: 11, bold: true, color: accent });
  y -= 16;
  drawText(ARTIST.name, left, y, { bold: true });
  y -= 14;
  for (const line of ARTIST.address.split("\n")) {
    drawText(line, left, y);
    y -= 14;
  }
  drawText(`Tél : ${ARTIST.phone}`, left, y);
  y -= 14;
  drawText(`Email : ${ARTIST.email}`, left, y);
  y -= 14;
  drawText(`SIRET : ${ARTIST.siret}`, left, y);

  // Client info
  let yClient = 790 - 30 - 14 - 30;
  drawText("CLIENT", right, yClient, { size: 11, bold: true, color: accent });
  yClient -= 16;
  drawText(f["Vendue à"] || "—", right, yClient, { bold: true });

  // Table header
  y -= 40;
  page.drawRectangle({ x: left, y: y - 4, width: 495, height: 20, color: rgb(0.96, 0.94, 0.92) });
  drawText("DESCRIPTION", left + 5, y, { size: 9, bold: true });
  drawText("PRIX", 480, y, { size: 9, bold: true });
  y -= 24;

  // Artwork details
  drawText(f["Citation"] || "Sans titre", left + 5, y, { bold: true });
  y -= 14;
  if (f["Format"]) { drawText(`Format : ${f["Format"]}`, left + 5, y); y -= 14; }
  if (f["Dimension"]) { drawText(`Dimensions : ${f["Dimension"]}`, left + 5, y); y -= 14; }
  drawText("Technique : huile sur toile", left + 5, y);
  y -= 14;
  if (f["Date de création"]) { drawText(`Date de création : ${formatDate(f["Date de création"])}`, left + 5, y); y -= 14; }
  if (f["Lieu de vente"]) { drawText(`Lieu de vente : ${f["Lieu de vente"]}`, left + 5, y); y -= 14; }

  // Price
  const prix = `${f["Prix"] || 0} €`;
  drawText(prix, 480, 790 - 30 - 14 - 30 - 40 - 24, { bold: true });

  // Total line
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 1.5, color: accent });
  y -= 18;
  drawText("TOTAL", left + 5, y, { size: 13, bold: true });
  drawText(prix, 470, y, { size: 13, bold: true, color: accent });

  // Legal mention
  y -= 40;
  drawText("TVA non applicable, art. 293 B du CGI", left, y, { size: 9, color: rgb(0.5, 0.5, 0.5) });

  // Footer
  drawText(`${ARTIST.name} — 21 Rue de Monteaux, 37530 Cangey — SIRET ${ARTIST.siret}`, 120, 30, { size: 8, color: rgb(0.6, 0.6, 0.6) });

  return await pdfDoc.save();
}

async function generateCertificatePdf(record: any): Promise<Uint8Array> {
  const f = record.fields;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSize = 11;
  const color = rgb(0.17, 0.17, 0.17);
  const accent = rgb(0.71, 0.40, 0.11);

  let y = 760;
  const center = 297;

  const drawCentered = (text: string, yPos: number, options: any = {}) => {
    const f2 = options.bold ? fontBold : (options.italic ? fontItalic : font);
    const w = f2.widthOfTextAtSize(text, options.size || fontSize);
    page.drawText(text, {
      x: center - w / 2,
      y: yPos,
      size: options.size || fontSize,
      font: f2,
      color: options.color || color,
    });
  };

  const drawLeft = (text: string, x: number, yPos: number, options: any = {}) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: options.size || fontSize,
      font: options.bold ? fontBold : (options.italic ? fontItalic : font),
      color: options.color || color,
    });
  };

  // Title
  drawCentered("CERTIFICAT D'AUTHENTICITÉ", y, { size: 22, bold: true, color: accent });
  y -= 50;

  // Declaration
  const decl = "Je soussignée, Garanse, certifie que l'œuvre désignée ci-dessous";
  const decl2 = "est une œuvre originale et une pièce unique réalisée par moi-même.";
  drawCentered(decl, y, { italic: true, size: 12 });
  y -= 16;
  drawCentered(decl2, y, { italic: true, size: 12 });
  y -= 50;

  // Artwork details table
  const tableX = 150;
  const valX = 290;
  const details: [string, string][] = [
    ["Titre", f["Citation"] || "Sans titre"],
    ["Format", f["Format"] || "—"],
    ["Dimensions", f["Dimension"] || "—"],
    ["Technique", "Huile sur toile"],
    ["Date de création", f["Date de création"] ? formatDate(f["Date de création"]) : "—"],
  ];

  for (const [label, value] of details) {
    drawLeft(label, tableX, y, { bold: true, color: rgb(0.4, 0.4, 0.4) });
    drawLeft(value, valX, y);
    y -= 18;
  }

  y -= 20;
  drawCentered(`SIRET : ${ARTIST.siret}`, y, { size: 10, color: rgb(0.6, 0.6, 0.6) });

  y -= 40;
  const legal = "Le présent certificat et les mentions qui y figurent";
  const legal2 = "constituent le droit de propriété de l'œuvre.";
  drawCentered(legal, y, { italic: true, size: 10, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  drawCentered(legal2, y, { italic: true, size: 10, color: rgb(0.5, 0.5, 0.5) });

  // Signature block
  y -= 60;
  const dateVente = f["Date de vente"] || new Date().toISOString();
  drawLeft(`Fait le ${formatDate(dateVente)}, à Cangey`, 330, y, { color: rgb(0.4, 0.4, 0.4) });
  y -= 30;
  drawLeft(ARTIST.name, 380, y, { size: 18, italic: true, color: accent });

  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!AIRTABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Airtable API token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Supabase credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { recordId } = await req.json();
    if (!recordId) throw new Error("recordId is required");

    const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

    // 1. Fetch the record
    console.log(`Fetching record ${recordId}...`);
    const recordRes = await fetch(`${baseUrl}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!recordRes.ok) {
      const errBody = await recordRes.text();
      throw new Error(`Airtable fetch error [${recordRes.status}]: ${errBody}`);
    }
    const record = await recordRes.json();
    const f = record.fields;
    console.log("Record fields:", JSON.stringify(Object.keys(f)));

    // 2. Check conditions: Test Lovable = true, Date de vente not empty, Facture générée = false
    const isTestLovable = Boolean(f["Test Lovable"] ?? f["Test lovable"]);
    if (!isTestLovable) {
      return new Response(JSON.stringify({ message: "Test Lovable is not checked", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!f["Date de vente"]) {
      return new Response(JSON.stringify({ message: "No sale date", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (f["Facture générée"]) {
      return new Response(JSON.stringify({ message: "Already processed", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Generate PDFs
    console.log("Generating invoice PDF...");
    const invoiceBytes = await generateInvoicePdf(record);
    console.log("Generating certificate PDF...");
    const certificateBytes = await generateCertificatePdf(record);

    // 4. Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const artworkSlug = (f["Citation"] || "oeuvre").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const timestamp = Date.now();
    const invoicePath = `${recordId}/facture_${artworkSlug}_${timestamp}.pdf`;
    const certPath = `${recordId}/certificat_${artworkSlug}_${timestamp}.pdf`;

    console.log("Uploading invoice to storage...");
    const { error: invErr } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, invoiceBytes, { contentType: "application/pdf", upsert: true });
    if (invErr) throw new Error(`Invoice upload error: ${invErr.message}`);

    console.log("Uploading certificate to storage...");
    const { error: certErr } = await supabase.storage
      .from("invoices")
      .upload(certPath, certificateBytes, { contentType: "application/pdf", upsert: true });
    if (certErr) throw new Error(`Certificate upload error: ${certErr.message}`);

    // 5. Get public URLs
    const { data: invUrl } = supabase.storage.from("invoices").getPublicUrl(invoicePath);
    const { data: certUrl } = supabase.storage.from("invoices").getPublicUrl(certPath);
    console.log("Invoice URL:", invUrl.publicUrl);
    console.log("Certificate URL:", certUrl.publicUrl);

    // 6. Update Airtable: attach PDFs + set checkboxes
    console.log("Updating Airtable record...");

    const fieldVariants = [
      { invoice: "Facture", certificate: "Certificat", invoiceDone: "Facture générée", certificateDone: "Certificat généré" },
      { invoice: "facture", certificate: "certificat", invoiceDone: "Facture générée", certificateDone: "Certificat généré" },
      { invoice: "Facture PDF", certificate: "Certificat PDF", invoiceDone: "Facture générée", certificateDone: "Certificat généré" },
      { invoice: "Facture pdf", certificate: "Certificat pdf", invoiceDone: "Facture générée", certificateDone: "Certificat généré" },
      { invoice: "Facture", certificate: "Certificat", invoiceDone: "Facture generee", certificateDone: "Certificat genere" },
    ];

    let updateOk = false;
    let lastError = "";

    for (const fieldsVariant of fieldVariants) {
      const updateRes = await fetch(`${baseUrl}/${recordId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            [fieldsVariant.invoice]: [{ url: invUrl.publicUrl }],
            [fieldsVariant.certificate]: [{ url: certUrl.publicUrl }],
            [fieldsVariant.invoiceDone]: true,
            [fieldsVariant.certificateDone]: true,
          },
        }),
      });

      if (updateRes.ok) {
        updateOk = true;
        break;
      }

      const errText = await updateRes.text();
      lastError = `Airtable update error [${updateRes.status}]: ${errText}`;

      if (!errText.includes("UNKNOWN_FIELD_NAME")) {
        throw new Error(lastError);
      }
    }

    if (!updateOk) {
      throw new Error(lastError || "Airtable update failed with unknown field names");
    }

    console.log("Done! Record processed successfully.");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Documents generated and uploaded",
        invoiceUrl: invUrl.publicUrl,
        certificateUrl: certUrl.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-sale error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
