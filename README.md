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

## Release setup

Read `APP_STORE_RELEASE.md` before publishing. Google and RevenueCat credentials must be configured in their dashboards and Supabase; secret credentials must never be committed to this repository.
