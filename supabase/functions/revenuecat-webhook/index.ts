import { createClient } from "npm:@supabase/supabase-js@2";

const PRODUCT_TIERS: Record<string, string> = {
  spines_and_spins_story_spinner_monthly: "story_spinner",
  spines_and_spins_shelf_enchanter_monthly: "shelf_enchanter",
  spines_and_spins_library_legend_monthly: "library_legend",
};

const TIER_RANK: Record<string, number> = {
  first_chapter: 0,
  story_spinner: 1,
  shelf_enchanter: 2,
  library_legend: 3,
};

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expectedAuthorization = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expectedAuthorization || request.headers.get("authorization") !== expectedAuthorization) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const event = body?.event || {};
  if (!event.id || !event.type) return new Response("Invalid webhook", { status: 400 });

  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases || [])];
  const appUserId = candidates.find(isUuid);
  if (!appUserId) return new Response("No Supabase user ID", { status: 202 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: processed } = await supabase
    .from("revenuecat_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (processed) return new Response("Already processed", { status: 200 });

  // Fetching the subscriber after every lifecycle event avoids races between
  // renewals, product changes, cancellations, refunds, and webhook retries.
  const rcSecret = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!rcSecret) return new Response("RevenueCat secret is not configured", { status: 500 });
  const subscriberResponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${rcSecret}`, Accept: "application/json" } },
  );
  if (!subscriberResponse.ok) return new Response("RevenueCat lookup failed", { status: 502 });

  const customer = await subscriberResponse.json();
  const subscriptions = customer?.subscriber?.subscriptions || {};
  const now = Date.now();
  const active = Object.entries(subscriptions)
    .filter(([, value]: [string, any]) => !value.expires_date || Date.parse(value.expires_date) > now)
    .map(([productId, value]: [string, any]) => ({ productId, value, tier: PRODUCT_TIERS[productId] }))
    .filter((item) => item.tier)
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);

  const best = active[0];
  const update = best
    ? {
        subscription_tier: best.tier,
        subscription_expires_at: best.value.expires_date || null,
        revenuecat_product_id: best.productId,
        subscription_store: best.value.store || event.store || null,
        subscription_updated_at: new Date().toISOString(),
      }
    : {
        subscription_tier: "first_chapter",
        subscription_expires_at: null,
        revenuecat_product_id: null,
        subscription_store: null,
        subscription_updated_at: new Date().toISOString(),
      };

  const { error } = await supabase.from("profiles").update(update).eq("id", appUserId);
  if (error) return new Response(error.message, { status: 500 });
  const { error: eventError } = await supabase.from("revenuecat_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    app_user_id: appUserId,
  });
  if (eventError && eventError.code !== "23505") return new Response(eventError.message, { status: 500 });
  return Response.json({ received: true, tier: update.subscription_tier });
});
