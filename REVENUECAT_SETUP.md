# Spines & Spins RevenueCat setup

The application code and database limits are ready for RevenueCat, but live purchases require store-owned configuration that cannot be committed to source control.

## Apple catalog (created August 1, 2026)

- App name: `Spines & Spins`
- Apple app ID: `6797096355`
- Bundle ID: `com.kayladeshasier.spinesandspins`
- SKU: `SPINES-AND-SPINS-IOS`
- Subscription group: `Spines & Spins Membership`
- Subscription group ID: `22280726`

| Level | Subscription | Product ID | Apple ID | U.S. price |
|---:|---|---|---|---:|
| 1 | Library Legend Monthly | `spines_and_spins_library_legend_monthly` | `6797097051` | $4.99 |
| 2 | Shelf Enchanter Monthly | `spines_and_spins_shelf_enchanter_monthly` | `6797097552` | $3.99 |
| 3 | Story Spinner Monthly | `spines_and_spins_story_spinner_monthly` | `6797097945` | $1.99 |

All three subscriptions have English (U.S.) localizations, one-month durations, worldwide availability (including future storefronts), and Apple-generated local prices. Family Sharing is off. They remain in **Prepare for Submission** and have not been added for review.

## RevenueCat catalog

Create one offering named `spines_and_spins` with these monthly products and entitlements:

| Product ID | Entitlement ID | Price |
|---|---|---:|
| `spines_and_spins_story_spinner_monthly` | `story_spinner` | $1.99 |
| `spines_and_spins_shelf_enchanter_monthly` | `shelf_enchanter` | $3.99 |
| `spines_and_spins_library_legend_monthly` | `library_legend` | $4.99 |

Use the signed-in Supabase UUID as RevenueCat's App User ID. This is already done by `initializeRevenueCat()`.

## Native app

When the Capacitor shell is added:

1. Install `@revenuecat/purchases-capacitor` and sync Capacitor.
2. Enable the In-App Purchase capability in the iOS target.
3. Replace the two public SDK-key placeholders at the top of `app-v2.js`.
4. Connect the existing App Store Connect subscriptions listed above, then configure matching products in Google Play Console when the Android app is ready.

## Supabase

1. Apply `supabase/migrations/202608010001_subscriptions.sql`.
2. Deploy the `revenuecat-webhook` Edge Function.
3. Set `REVENUECAT_SECRET_API_KEY` to a RevenueCat secret API key.
4. Set `REVENUECAT_WEBHOOK_AUTH` to a long random Authorization value.
5. Add the Edge Function URL as a RevenueCat webhook and configure the exact same Authorization header.

Never put the RevenueCat secret API key, webhook authorization value, or Supabase service-role key in `app-v2.js`.

## Web/Android PWA checkout

The Android quick-launch version is the Netlify-hosted web app, installed from Chrome. It uses RevenueCat Billing with Stripe rather than Apple or Google Play billing. The iOS code path remains unchanged.

RevenueCat project-owner access is required for the first two steps. The currently signed-in dashboard user can view the project but does not have permission to add web app configurations.

1. In RevenueCat, open **Web** and connect the production Stripe account to RevenueCat Billing.
2. Add a RevenueCat Billing web configuration.
3. Create these monthly web products with the same identifiers and prices used by the app:
   - `spines_and_spins_story_spinner_monthly` — $1.99
   - `spines_and_spins_shelf_enchanter_monthly` — $3.99
   - `spines_and_spins_library_legend_monthly` — $4.99
4. Attach the products to the existing `story_spinner`, `shelf_enchanter`, and `library_legend` entitlements.
5. Add the web products to offering `spines_and_spins`. Use package identifiers `story_spinner`, `shelf_enchanter`, and `library_legend`; the browser paywall sends that identifier as `package_id`.
6. Under **Funnels → Purchase Links**, create a hosted Web Purchase Link for that offering. Require an identified customer; the app appends the signed-in Supabase UUID and email to the checkout URL.
7. Set the purchase-link success redirect to `https://spinesandspins.netlify.app/club.html?checkout=complete`. This lets the app wait for the existing RevenueCat webhook and confirm the new membership.
8. The production link base, `https://pay.rev.cat/hdkxpnasozwaokez`, is configured as `REVENUECAT_WEB_PURCHASE_LINK` near the top of `app-v2.js`. The link is a public checkout identifier, not a secret API key.
9. Test the RevenueCat sandbox link and webhook with a test account. Then verify one production purchase, renewal, cancellation, expiration, and plan change before sharing the Android install URL broadly.

RevenueCat Billing sends confirmation and renewal emails containing a secure customer-portal link. Android/web customers use that portal to update payment details, download receipts, change an eligible plan, or cancel.
