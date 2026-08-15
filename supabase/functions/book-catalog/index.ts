const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return json({ message: "Sign in is required" }, 401);
  }

  const apiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY")?.trim();
  if (!apiKey) return json({ message: "The Google Books server key is not configured" }, 503);

  let input: { query?: unknown; maxResults?: unknown };
  try {
    input = await request.json();
  } catch (_) {
    return json({ message: "Invalid JSON body" }, 400);
  }

  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query || query.length > 250) {
    return json({ message: "Enter a book query between 1 and 250 characters" }, 400);
  }

  const maxResults = Math.min(Math.max(Number(input.maxResults) || 20, 1), 20);
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("printType", "books");
  url.searchParams.set("projection", "full");

  try {
    const response = await fetch(url, {
      headers: { "x-goog-api-key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({
        error: {
          status: response.status,
          message: payload?.error?.message || "Google Books rejected the catalog request",
        },
      }, response.status);
    }
    return json(payload, 200, { "Cache-Control": "private, max-age=300" });
  } catch (_) {
    return json({ message: "Google Books could not be reached" }, 502);
  }
});
