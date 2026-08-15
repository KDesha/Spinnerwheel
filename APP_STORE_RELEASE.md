# Spines & Spins App Store release

The app code, iOS shell, cloud services, store metadata, subscriptions, privacy screens, account deletion flow, and community-safety controls are prepared. Version 1.0 build 3 was compiled, archived, App Store-signed, uploaded, processed, and attached to the App Store version on August 15, 2026. It includes the matched whole/genre library layout, cleaner interface copy, and the new burgundy-and-gold circle-of-books icon. Its Apple Distribution certificate and matching App Store provisioning profile are installed and valid through August 15, 2027.

## 1. Google Books — complete

The former browser key was removed. Google Cloud project `bookclubbaddies` is displayed as **Spines and Spins**, Books API is enabled, and the replacement key is restricted to Books API and stored only as a Supabase Edge Function secret.

1. Enable **Books API** in the Google Cloud project.
2. Create a new server key and restrict its **API restriction** to **Books API** only.
3. Do not put the new key in `app-v2.js`, Xcode, GitHub, or App Store Connect.
4. Store it as a Supabase Edge Function secret:

   ```sh
   supabase secrets set GOOGLE_BOOKS_API_KEY=YOUR_NEW_KEY --project-ref rogeqnlbbzcrifuiyhsr
   ```

The `book-catalog` Edge Function sends this credential in the `x-goog-api-key` header. Signed-in app clients never receive it.

## 2. Database and server — complete

Project `rogeqnlbbzcrifuiyhsr` has all migrations and the three Edge Functions deployed. Migration `202608150003_fix_club_owner_select.sql` fixes first-club creation with RLS. Migration `202608150004_chapter_warnings_ratings.sql` adds optional chapter trigger-warning flags and one-to-five-heart ratings. Both were verified with the reviewer account.

```sh
supabase link --project-ref rogeqnlbbzcrifuiyhsr
supabase db push
supabase functions deploy book-catalog
supabase functions deploy delete-account
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

Review `public.content_reports` at least daily while the user base is small. Respond promptly, remove violating content, and document the action. This operational step is part of Apple’s user-generated-content requirement.

## 3. RevenueCat and subscriptions — complete

RevenueCat app `appb44aab6308`, offering `spines_and_spins`, all products, entitlements, Apple credentials, Supabase secrets, and the authenticated webhook are configured. All three products show **Ready to Submit** in RevenueCat. Their App Store subscription group and products are in the draft review submission.

Before final submission, test purchase, cancellation, renewal, expiration, upgrade, downgrade, and Restore Purchases with an Apple sandbox account on a physical device.

## 4. Public store URLs

These URLs are prepared but currently return 404 because GitHub Pages has not been enabled:

- Privacy Policy: `https://kdesha.github.io/Spinnerwheel/privacy.html`
- Support URL: `https://kdesha.github.io/Spinnerwheel/support.html`
- Terms: `https://kdesha.github.io/Spinnerwheel/terms.html`

Open each public URL in a private browser before submission. Apple rejects placeholder, broken, or access-controlled policy and support pages.

## 5. App Store Connect

- Bundle ID: `com.kayladeshasier.spinesandspins`
- Apple app ID: `6797096355`
- Version: `1.0`
- Attached build: `3`
- App icon: `app-store-assets/app-icon-1024.png` (1024×1024 RGB, no transparency), bundled through the iOS AppIcon asset catalog.
- Export compliance: the app declares that it does not use non-exempt encryption.
- Age rating: answer for user-generated content and unrestricted web links accurately; do not place the app in the Kids category.
- App Privacy draft discloses email address, name, user ID, emails/text messages, other user content, audio data, purchase history, and product interaction as linked to the user for app functionality; no tracking and no advertising. It still needs its public privacy-policy URL and the final **Publish** action.
- Review notes should explain Google Books/Open Library metadata, optional plain Amazon search, microphone use only for user-initiated voice notes, report/block controls, account deletion, subscriptions, and Restore Purchases.
- A durable demo account is confirmed and populated with a private review club, The Hobbit, 19 chapters, a current reading room, and a sample chapter warning/rating. Its credentials are saved in App Store Connect.
- The app is set to Free, public distribution, all 175 countries or regions, and manual release after approval.
- Content Rights still requires the account holder's legal attestation that the app has the necessary rights to access third-party book metadata and cover content.

## 6. Final commands

```sh
npm ci
npm run release:check
npm run sync:ios
```

These checks passed, including a Release simulator build, build 3 device archive, valid Apple Distribution signature, the embedded `Spines and Spins App Store 2026` provisioning profile, App Store Connect upload validation, and build processing. Build 3 is attached to version 1.0. Complete TestFlight device testing, the public URL/privacy publication, the Content Rights attestation, and submit the app plus its subscriptions together.

Amazon Associates is not required. The app intentionally generates a normal Amazon search URL without an affiliate tag and does not claim an affiliate relationship.
