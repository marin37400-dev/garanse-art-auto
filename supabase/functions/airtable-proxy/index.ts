import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_ID = "appLE4R18nylnmOTF";
const TABLE_ID = "tblocgx4BO6Pqjfa7";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY");

  if (!AIRTABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Airtable API token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { action, recordId } = await req.json();
    const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

    if (action === "list") {
      const records: any[] = [];
      let offset: string | undefined;

      do {
        const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Airtable API error [${res.status}]: ${errBody}`);
        }
        const data = await res.json();
        records.push(...data.records);
        offset = data.offset;
      } while (offset);

      return new Response(JSON.stringify({ records }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get" && recordId) {
      const res = await fetch(`${baseUrl}/${recordId}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Airtable error [${res.status}]: ${errBody}`);
      }
      const record = await res.json();
      return new Response(JSON.stringify(record), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("airtable-proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
