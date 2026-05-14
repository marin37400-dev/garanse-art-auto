import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Centralized Configuration ───────────────────────────────────────────────
const BASE_ID = "appLE4R18nylnmOTF";
const TABLE_ID = "tblocgx4BO6Pqjfa7";

const AIRTABLE_FIELDS = {
  dateVente: "Date de vente",
  prix: "Prix",
  dimension: "Dim.",
  citation: "Citation",
  emailClient: "Email Client",
  numeroFacture: "Numéro facture",
  factureGeneree: "Facture générée",
  certificatGenere: "Certificat généré",
  factureFile: "Facture",
  certificatFile: "Certificat",
};

const ARTIST = {
  name: "Garanse",
  address: "21 Rue de Monteaux\n37530 Cangey\nFrance",
  phone: "06 63 77 80 84",
  email: "annegaranse@gmail.com",
  siret: "83533116600024",
};

const REQUIRED_FIELDS = [
  AIRTABLE_FIELDS.dateVente,
  AIRTABLE_FIELDS.prix,
  AIRTABLE_FIELDS.dimension,
  AIRTABLE_FIELDS.citation,
  AIRTABLE_FIELDS.numeroFacture,
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── PDF Generation ──────────────────────────────────────────────────────────
async function generateInvoicePdf(record: any): Promise<Uint8Array> {
  const f = record.fields;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
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
      x, y: yPos,
      size: options.size || fontSize,
      font: options.bold ? fontBold : font,
      color: options.color || color,
    });
  };

  drawText("FACTURE", 230, y, { size: 22, bold: true, color: accent });
  y -= 30;

  const dateVente = f[AIRTABLE_FIELDS.dateVente] || new Date().toISOString();
  const invoiceNum = f[AIRTABLE_FIELDS.numeroFacture] || `FAC-${new Date(dateVente).getFullYear()}-${record.id.slice(-6).toUpperCase()}`;
  drawText(`N° ${invoiceNum}`, right + 80, y, { size: 9 });
  y -= 14;
  drawText(`Date : ${formatDate(dateVente)}`, right + 80, y, { size: 9 });
  y -= 30;

  drawText("ARTISTE", left, y, { size: 11, bold: true, color: accent });
  y -= 16;
  drawText(ARTIST.name, left, y, { bold: true });
  y -= 14;
  for (const line of ARTIST.address.split("\n")) { drawText(line, left, y); y -= 14; }
  drawText(`Tél : ${ARTIST.phone}`, left, y); y -= 14;
  drawText(`Email : ${ARTIST.email}`, left, y); y -= 14;
  drawText(`SIRET : ${ARTIST.siret}`, left, y);

  let yClient = 790 - 30 - 14 - 30;
  drawText("CLIENT", right, yClient, { size: 11, bold: true, color: accent });
  yClient -= 16;
  drawText(f["Vendue à"] || "—", right, yClient, { bold: true });

  y -= 40;
  page.drawRectangle({ x: left, y: y - 4, width: 495, height: 20, color: rgb(0.96, 0.94, 0.92) });
  drawText("DESCRIPTION", left + 5, y, { size: 9, bold: true });
  drawText("PRIX", 480, y, { size: 9, bold: true });
  y -= 24;

  drawText(f[AIRTABLE_FIELDS.citation] || "Sans titre", left + 5, y, { bold: true }); y -= 14;
  if (f["Format"]) { drawText(`Format : ${f["Format"]}`, left + 5, y); y -= 14; }
  if (f[AIRTABLE_FIELDS.dimension]) { drawText(`Dimensions : ${f[AIRTABLE_FIELDS.dimension]}`, left + 5, y); y -= 14; }
  drawText("Technique : huile sur toile", left + 5, y); y -= 14;
  if (f["Date de création"]) { drawText(`Date de création : ${formatDate(f["Date de création"])}`, left + 5, y); y -= 14; }
  if (f["Lieu de vente"]) { drawText(`Lieu de vente : ${f["Lieu de vente"]}`, left + 5, y); y -= 14; }

  const prix = `${f[AIRTABLE_FIELDS.prix] || 0} €`;
  drawText(prix, 480, 790 - 30 - 14 - 30 - 40 - 24, { bold: true });

  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 1.5, color: accent });
  y -= 18;
  drawText("TOTAL", left + 5, y, { size: 13, bold: true });
  drawText(prix, 470, y, { size: 13, bold: true, color: accent });

  y -= 40;
  drawText("TVA non applicable, art. 293 B du CGI", left, y, { size: 9, color: rgb(0.5, 0.5, 0.5) });
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
    page.drawText(text, { x: center - w / 2, y: yPos, size: options.size || fontSize, font: f2, color: options.color || color });
  };

  const drawLeft = (text: string, x: number, yPos: number, options: any = {}) => {
    page.drawText(text, { x, y: yPos, size: options.size || fontSize, font: options.bold ? fontBold : (options.italic ? fontItalic : font), color: options.color || color });
  };

  drawCentered("CERTIFICAT D'AUTHENTICITÉ", y, { size: 22, bold: true, color: accent });
  y -= 50;
  drawCentered("Je soussignée, Garanse, certifie que l'œuvre désignée ci-dessous", y, { italic: true, size: 12 });
  y -= 16;
  drawCentered("est une œuvre originale et une pièce unique réalisée par moi-même.", y, { italic: true, size: 12 });
  y -= 50;

  const tableX = 150; const valX = 290;
  const details: [string, string][] = [
    ["Titre", f[AIRTABLE_FIELDS.citation] || "Sans titre"],
    ["Format", f["Format"] || "—"],
    ["Dimensions", f[AIRTABLE_FIELDS.dimension] || "—"],
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
  drawCentered("Le présent certificat et les mentions qui y figurent", y, { italic: true, size: 10, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  drawCentered("constituent le droit de propriété de l'œuvre.", y, { italic: true, size: 10, color: rgb(0.5, 0.5, 0.5) });

  y -= 60;
  const dateVente = f[AIRTABLE_FIELDS.dateVente] || new Date().toISOString();
  drawLeft(`Fait le ${formatDate(dateVente)}, à Cangey`, 330, y, { color: rgb(0.4, 0.4, 0.4) });
  y -= 30;
  drawLeft(ARTIST.name, 380, y, { size: 18, italic: true, color: accent });

  return await pdfDoc.save();
}

// ─── Main Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!AIRTABLE_API_KEY) return respond({ status: "config_error", error: "Airtable API token not configured" }, 500);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return respond({ status: "config_error", error: "Supabase credentials not configured" }, 500);

  try {
    const { recordId } = await req.json();
    if (!recordId) return respond({ status: "validation_failed", error: "recordId is required" }, 400);

    const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

    // ── STEP 1: Fetch record ──
    console.log("[FETCH] Fetching record", recordId);
    const recordRes = await fetch(`${baseUrl}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!recordRes.ok) {
      const errBody = await recordRes.text();
      console.error("[FETCH] Failed:", errBody);
      throw new Error(`Airtable fetch error [${recordRes.status}]: ${errBody}`);
    }
    const record = await recordRes.json();
    const f = record.fields;
    console.log("[FETCH] Fields:", JSON.stringify(Object.keys(f)));

    // ── STEP 2: Idempotency check ──
    if (f[AIRTABLE_FIELDS.factureGeneree] === true && f[AIRTABLE_FIELDS.certificatGenere] === true) {
      console.log("[VALIDATION] Already processed — skipping");
      return respond({ status: "duplicate_skipped", message: "Already processed" });
    }

    // ── STEP 3: Strict validation ──
    const missingFields: string[] = [];
    for (const fieldName of REQUIRED_FIELDS) {
      const val = f[fieldName];
      if (val === undefined || val === null || val === "") {
        missingFields.push(fieldName);
      }
    }
    if (missingFields.length > 0) {
      console.error("[VALIDATION] Missing fields:", missingFields);
      return respond({ status: "validation_failed", missingFields }, 400);
    }
    console.log("[VALIDATION] All required fields present");

    // ── STEP 4: PDF generation ──
    console.log("[PDF_GEN] Generating invoice…");
    const invoiceBytes = await generateInvoicePdf(record);
    if (!invoiceBytes || invoiceBytes.length === 0) {
      console.error("[PDF_GEN] Invoice PDF is empty");
      return respond({ status: "pdf_failed", detail: "Invoice PDF empty" }, 500);
    }
    console.log(`[PDF_GEN] Invoice OK — ${invoiceBytes.length} bytes`);

    console.log("[PDF_GEN] Generating certificate…");
    const certificateBytes = await generateCertificatePdf(record);
    if (!certificateBytes || certificateBytes.length === 0) {
      console.error("[PDF_GEN] Certificate PDF is empty");
      return respond({ status: "pdf_failed", detail: "Certificate PDF empty" }, 500);
    }
    console.log(`[PDF_GEN] Certificate OK — ${certificateBytes.length} bytes`);

    // ── STEP 5: Upload to Supabase Storage ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const artworkSlug = (f[AIRTABLE_FIELDS.citation] || "oeuvre").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const timestamp = Date.now();
    const invoicePath = `${recordId}/facture_${artworkSlug}_${timestamp}.pdf`;
    const certPath = `${recordId}/certificat_${artworkSlug}_${timestamp}.pdf`;

    console.log("[STORAGE] Uploading invoice…");
    const { error: invErr } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, invoiceBytes, { contentType: "application/pdf", upsert: true });
    if (invErr) {
      console.error("[STORAGE] Invoice upload failed:", invErr.message);
      return respond({ status: "supabase_storage_failed", detail: invErr.message }, 500);
    }

    console.log("[STORAGE] Uploading certificate…");
    const { error: certErr } = await supabase.storage
      .from("invoices")
      .upload(certPath, certificateBytes, { contentType: "application/pdf", upsert: true });
    if (certErr) {
      console.error("[STORAGE] Certificate upload failed:", certErr.message);
      return respond({ status: "supabase_storage_failed", detail: certErr.message }, 500);
    }

    const { data: invUrlData } = supabase.storage.from("invoices").getPublicUrl(invoicePath);
    const { data: certUrlData } = supabase.storage.from("invoices").getPublicUrl(certPath);
    const invoicePublicUrl = invUrlData.publicUrl;
    const certPublicUrl = certUrlData.publicUrl;
    console.log("[STORAGE] Invoice URL:", invoicePublicUrl);
    console.log("[STORAGE] Certificate URL:", certPublicUrl);

    // ── STEP 6: Airtable PATCH (single atomic-like request) ──
    const updatePayload = {
      fields: {
        [AIRTABLE_FIELDS.factureFile]: [{ url: invoicePublicUrl }],
        [AIRTABLE_FIELDS.certificatFile]: [{ url: certPublicUrl }],
        [AIRTABLE_FIELDS.factureGeneree]: true,
        [AIRTABLE_FIELDS.certificatGenere]: true,
      },
    };
    console.log("[AIRTABLE_UPDATE] Payload:", JSON.stringify(updatePayload));

    const updateRes = await fetch(`${baseUrl}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    const updateBody = await updateRes.text();
    console.log("[AIRTABLE_UPDATE] Response status:", updateRes.status, "body:", updateBody);

    if (!updateRes.ok) {
      console.error("[AIRTABLE_UPDATE] Failed");
      return respond({ status: "airtable_update_failed", detail: updateBody }, 500);
    }

    // ── STEP 7: Send client email ──
    const clientEmail = f[AIRTABLE_FIELDS.emailClient];
    let emailStatus = "not_sent";
    try {
      console.log("[EMAIL] Sending to", clientEmail);
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.warn("[EMAIL] LOVABLE_API_KEY not configured — skipping email");
        emailStatus = "skipped_no_key";
      } else {
        // Use Supabase edge function invoke for transactional email if available,
        // otherwise fall back to a simple log. For now we log success.
        // In a full setup, invoke send-transactional-email here.
        console.log("[EMAIL] Email would be sent to:", clientEmail);
        console.log("[EMAIL] Subject: Votre facture et certificat d'authenticité");
        console.log("[EMAIL] Invoice URL:", invoicePublicUrl);
        console.log("[EMAIL] Certificate URL:", certPublicUrl);
        emailStatus = "logged_only";
      }
    } catch (emailErr: any) {
      console.error("[EMAIL] Failed:", emailErr.message);
      emailStatus = "email_failed";
    }

    console.log("[DONE] Process complete — email status:", emailStatus);
    return respond({
      status: emailStatus === "email_failed" ? "email_failed" : "success",
      emailStatus,
      invoiceUrl: invoicePublicUrl,
      certificateUrl: certPublicUrl,
    });
  } catch (err: any) {
    console.error("[ERROR]", err.message);
    return respond({ status: "error", error: err.message }, 500);
  }
});
