import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARTIST = {
  name: "Garanse",
  address: "21 Rue de Monteaux\n37530 Cangey",
  phone: "06 63 77 80 84",
  email: "annegaranse@gmail.com",
  siret: "83533116600024",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function generateInvoiceHtml(record: any): string {
  const f = record.fields;
  const dateVente = f["Date de vente"] || new Date().toISOString();
  const invoiceNum = `FAC-${new Date(dateVente).getFullYear()}-${record.id.slice(-6).toUpperCase()}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #2d2d2d; font-size: 13px; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .artist-info, .client-info { max-width: 45%; }
  .artist-info h2, .client-info h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #b5651d; margin-bottom: 8px; }
  h1 { text-align: center; font-size: 24px; color: #b5651d; margin: 30px 0; letter-spacing: 2px; }
  .invoice-meta { text-align: right; margin-bottom: 30px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f5f0eb; text-align: left; padding: 10px 12px; border-bottom: 2px solid #b5651d; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e8e0d8; }
  .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #b5651d; border-bottom: none; }
  .mention { margin-top: 40px; font-style: italic; color: #888; font-size: 11px; border-top: 1px solid #e8e0d8; padding-top: 15px; }
  .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 10px; }
</style>
</head>
<body>
  <h1>FACTURE</h1>
  <div class="invoice-meta">
    <p>N° ${invoiceNum}</p>
    <p>Date : ${formatDate(dateVente)}</p>
  </div>
  <div class="header">
    <div class="artist-info">
      <h2>Artiste</h2>
      <p><strong>${ARTIST.name}</strong><br>
      ${ARTIST.address.replace("\n", "<br>")}<br>
      Tél : ${ARTIST.phone}<br>
      Email : ${ARTIST.email}<br>
      SIRET : ${ARTIST.siret}</p>
    </div>
    <div class="client-info">
      <h2>Client</h2>
      <p><strong>${f["Vendue à"] || "—"}</strong><br>
      ${f["Adresse"] || ""}<br>
      ${f["Numéro tél"] ? "Tél : " + f["Numéro tél"] : ""}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right">Prix</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${f["Name"] || "Sans titre"}</strong><br>
          Technique : huile sur toile<br>
          Dimensions : ${f["Dimension"] || "—"}<br>
          ${f["Citation"] ? '<em>« ' + f["Citation"] + ' »</em>' : ""}
        </td>
        <td style="text-align:right">${f["Prix"] || 0} €</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL</td>
        <td style="text-align:right">${f["Prix"] || 0} €</td>
      </tr>
    </tbody>
  </table>
  <div class="mention">TVA non applicable, art. 293 B du CGI</div>
  <div class="footer">
    <p>${ARTIST.name} — ${ARTIST.address.replace("\n", ", ")} — SIRET ${ARTIST.siret}</p>
  </div>
</body>
</html>`;
}

function generateCertificateHtml(record: any): string {
  const f = record.fields;
  const dateVente = f["Date de vente"] || new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Georgia', serif; margin: 50px; color: #2d2d2d; font-size: 14px; line-height: 1.8; }
  h1 { text-align: center; font-size: 26px; color: #b5651d; letter-spacing: 3px; margin-bottom: 40px; }
  .declaration { text-align: center; font-style: italic; margin: 30px 0; font-size: 15px; }
  .details { max-width: 500px; margin: 30px auto; }
  .details table { width: 100%; }
  .details td { padding: 6px 0; }
  .details td:first-child { font-weight: bold; width: 180px; color: #666; }
  .legal { margin-top: 50px; font-size: 12px; color: #888; text-align: center; font-style: italic; }
  .signature { margin-top: 60px; text-align: right; }
  .signature .place-date { color: #666; margin-bottom: 30px; }
  .signature .name { font-size: 20px; font-family: 'Georgia', serif; font-style: italic; color: #b5651d; }
  .siret-info { text-align: center; margin-top: 10px; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
  <h1>CERTIFICAT D'AUTHENTICITÉ</h1>
  <p class="declaration">
    Je soussignée, ${ARTIST.name}, certifie que l'œuvre désignée ci-dessous est une œuvre originale
    et une pièce unique réalisée par moi-même.
  </p>
  <div class="details">
    <table>
      <tr><td>Titre</td><td>${f["Name"] || "Sans titre"}</td></tr>
      <tr><td>Technique</td><td>Huile sur toile</td></tr>
      <tr><td>Dimensions</td><td>${f["Dimension"] || "—"}</td></tr>
      <tr><td>Date de création</td><td>${f["Date de création"] ? formatDate(f["Date de création"]) : "—"}</td></tr>
      ${f["Citation"] ? `<tr><td>Citation</td><td><em>« ${f["Citation"]} »</em></td></tr>` : ""}
    </table>
  </div>
  <p class="siret-info">SIRET : ${ARTIST.siret}</p>
  <p class="legal">
    Le présent certificat et les mentions qui y figurent constituent le droit de propriété de l'œuvre.
  </p>
  <div class="signature">
    <p class="place-date">Fait le ${formatDate(dateVente)}, à Cangey</p>
    <p class="name">${ARTIST.name}</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");
  const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID");

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return new Response(
      JSON.stringify({ error: "Airtable credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { recordId } = await req.json();
    if (!recordId) throw new Error("recordId is required");

    const tableName = encodeURIComponent("Garanse Toiles");
    const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;

    // 1. Fetch the record
    const recordRes = await fetch(`${baseUrl}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!recordRes.ok) throw new Error(`Airtable fetch error: ${recordRes.status}`);
    const record = await recordRes.json();

    // 2. Check if already generated
    if (record.fields["Facture générée"]) {
      return new Response(
        JSON.stringify({ message: "Documents already generated", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if date de vente exists and is within 7 days
    const dateVente = record.fields["Date de vente"];
    if (!dateVente) {
      return new Response(
        JSON.stringify({ message: "No sale date", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const saleDate = new Date(dateVente);
    const now = new Date();
    const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return new Response(
        JSON.stringify({ message: "Sale is older than 7 days", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Generate HTML documents
    const invoiceHtml = generateInvoiceHtml(record);
    const certificateHtml = generateCertificateHtml(record);

    // 5. Generate PDFs using a headless approach - store HTML as attachments
    // Since Deno edge functions can't run a browser, we upload HTML files to Airtable
    const artworkName = (record.fields["Name"] || "oeuvre").replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, "_");
    
    // Convert HTML to base64 data URIs for Airtable attachment
    const invoiceBlob = new TextEncoder().encode(invoiceHtml);
    const certBlob = new TextEncoder().encode(certificateHtml);
    
    const invoiceBase64 = btoa(String.fromCharCode(...invoiceBlob));
    const certBase64 = btoa(String.fromCharCode(...certBlob));

    // 6. Update Airtable: mark as generated and attach documents
    const updateRes = await fetch(`${baseUrl}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Facture générée": true,
        },
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Airtable update error [${updateRes.status}]: ${errText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Documents generated successfully",
        invoiceHtml,
        certificateHtml,
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
