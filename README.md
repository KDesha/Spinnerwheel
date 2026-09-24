# Spines & Spins

Spines & Spins is a Capacitor iOS book-club app with shared clubs, genre and book wheels, Google Books/Open Library metadata, reading rooms, chapter messages, voice notes, and RevenueCat subscription tiers.

## Local development

```sh
npm ci
npm run build:web
npm run serve
```

Open `http://127.0.0.1:4189`. The build copies app pages and assets into `www/` and bundles the installed Supabase browser client, so the native app does not depend on a JavaScript CDN.

## iOS

```sh
npm run sync:ios
npm run open:ios
```

The bundle identifier is `com.kayladeshasier.spinesandspins` and the minimum iOS version is 15.0.

## Android quick launch (installable web app)

Android readers can open `https://spinesandspins.netlify.app/?install=1` in Chrome and add Spines & Spins to their home screen. The manifest, service worker, standard icon, and maskable Android icon are included in the web build.

Browser subscriptions use a RevenueCat Web Purchase Link backed by RevenueCat Billing and Stripe. This is intentionally separate from Apple in-app purchase while sharing the same Supabase account, RevenueCat entitlements, and subscription webhook. Complete the Web/Android PWA section in `REVENUECAT_SETUP.md` before enabling production checkout.

## Release setup

Read `APP_STORE_RELEASE.md` before publishing. Apple, Google, Stripe, and RevenueCat configuration must be completed in their respective dashboards and Supabase; secret credentials must never be committed to this repository.
