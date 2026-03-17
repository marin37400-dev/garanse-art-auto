import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLE_NAME = "Garanse Toiles (test Lovable)";

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
    const { action, recordId } = await req.json();
    const tableName = encodeURIComponent(TABLE_NAME);
    const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;

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
