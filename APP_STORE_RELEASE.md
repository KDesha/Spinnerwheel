# Spines & Spins App Store release

Version 1.0.1 build 5 is currently Ready for Distribution. The October 2026 membership, reading-room, poll, message-deletion, and interaction-reliability update is prepared as version 1.0.2 build 6.

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

## 3. RevenueCat and subscriptions — App Store pricing updated

RevenueCat app `appb44aab6308`, offering `spines_and_spins`, products, entitlements, Apple credentials, Supabase secrets, and the authenticated webhook are configured. App Store Connect changes Story Spinner to $0.99/month and Shelf Enchanter to $2.99/month on October 7, 2026. RevenueCat Billing must use the same web prices. Remove Library Legend from the current offering/new sale while retaining its product-to-entitlement mapping for any existing subscribers.

The new paywall has three visible choices: First Chapter (free), Story Spinner, and Shelf Enchanter. Genre themes remain available to everyone. The app no longer advertises unsupported custom branding, scheduled reminders, exports, or backup features.

Before manually releasing the approved version, test purchase, cancellation, renewal, expiration, upgrade, downgrade, and Restore Purchases with an Apple sandbox account on a physical device.

## 4. Public store URLs — live

GitHub Pages is enabled from the repository's `main` branch. These public URLs were verified to return HTTP 200 before submission:

- Privacy Policy: `https://kdesha.github.io/Spinnerwheel/privacy.html`
- Support URL: `https://kdesha.github.io/Spinnerwheel/support.html`
- Terms: `https://kdesha.github.io/Spinnerwheel/terms.html`

The support and marketing URLs are saved on version 1.0, and the privacy-policy URL is published in App Privacy.

## 5. App Store Connect

- Bundle ID: `com.kayladeshasier.spinesandspins`
- Apple app ID: `6797096355`
- Current App Store version: `1.0.1` build `5`
- Next release: `1.0.2` build `6`
- App icon: `app-store-assets/app-icon-1024.png` (1024×1024 RGB, no transparency), bundled through the iOS AppIcon asset catalog.
- Export compliance: the app declares that it does not use non-exempt encryption.
- Age rating: answer for user-generated content and unrestricted web links accurately; do not place the app in the Kids category.
- App Privacy is published. It discloses email address, name, user ID, emails/text messages, other user content, audio data, purchase history, and product interaction as linked to the user for app functionality; no tracking and no advertising.
- Review notes should explain Google Books/Open Library metadata, optional plain Amazon search, microphone use only for user-initiated voice notes, report/block controls, account deletion, subscriptions, and Restore Purchases.
- A durable demo account is confirmed and populated with a private review club, The Hobbit, 19 chapters, a current reading room, and a sample chapter warning/rating. Its credentials are saved in App Store Connect.
- The app is set to Free, public distribution in 174 countries or regions, and manual release after approval. China mainland is excluded; App Store Connect shows its removal as processing.
- Content Rights is complete with the account holder's attestation that the app has the necessary rights to access its third-party content.
- App Review submission `9803b2e0-240b-4f89-adc1-b4abe24c26f3` includes five items: iOS version 1.0 build 3, the Spines & Spins Membership subscription group, and all three monthly subscriptions. Every item is **Waiting for Review** as of August 16, 2026.

## 6. Final commands

```sh
npm ci
npm run release:check
npm run sync:ios
```

These checks passed, including a Release simulator build, build 3 device archive, valid Apple Distribution signature, the embedded `Spines and Spins App Store 2026` provisioning profile, App Store Connect upload validation, and build processing. Build 3 is attached to version 1.0 and was submitted with its subscription group and three products. The release remains manual, so approval will not publish the app until the account holder chooses to release it.

Amazon Associates is not required. The app intentionally generates a normal Amazon search URL without an affiliate tag and does not claim an affiliate relationship.
