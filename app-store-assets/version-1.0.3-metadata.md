# Spines & Spins 1.0.3 (build 7)

## What’s New

First Chapter members can now enjoy the free plan with clearly placed, non-personalized banner ads in the Clubhouse and Reading Room. Paid Story Spinner and Shelf Enchanter memberships remain completely ad-free. This update also adds region-appropriate ad privacy choices and behind-the-scenes reliability improvements.

## App Review Notes

Version 1.0.3 adds Google AdMob banner advertising for signed-in members on the free First Chapter plan only.

- Ad format: one adaptive banner anchored to the bottom of the Clubhouse and Reading Room screens.
- Paid plans: Story Spinner and Shelf Enchanter do not request or display ads.
- Personalization: every banner request sets non-personalized ads (`npa: true`). The app does not request App Tracking Transparency authorization and does not access IDFA for personalized advertising.
- Consent: the app uses Google User Messaging Platform. It requests consent information before requesting a banner, presents Google’s consent form when required, and does not request an ad unless UMP returns `canRequestAds = true`.
- Privacy controls: when Google requires a persistent privacy-options entry point, Account displays “Ad privacy choices.”
- Test ads: the submitted build defaults to the production banner unit. Google’s iOS demo unit is reachable only through the developer test-mode switch and is not enabled in this App Store build.
- AdMob app ID: `ca-app-pub-5084669394228535~2467494547`
- Banner unit: `ca-app-pub-5084669394228535/7336446333`

All existing review-account credentials remain unchanged. After signing in with the supplied First Chapter review account, the banner locations are visible on My Clubs and inside a book’s Reading Room. Google may temporarily return no fill while the new app or ad unit finishes review; this does not block navigation or app functionality.

## App Privacy updates to review in App Store Connect

Google’s current iOS disclosure says the Mobile Ads SDK may collect IP-derived coarse location, crash logs, performance data, device ID, advertising data, and product interactions. Add the following categories before submitting this build, using the conservative linked-to-user selection where App Store Connect requires a linkage answer:

- Location → Coarse Location: Third-Party Advertising; Analytics.
- Identifiers → Device ID: Third-Party Advertising; Analytics.
- Usage Data → Product Interaction: App Functionality; Third-Party Advertising; Analytics.
- Usage Data → Advertising Data: Third-Party Advertising; Analytics.
- Diagnostics → Crash Data: App Functionality; Analytics.
- Diagnostics → Performance Data: App Functionality; Third-Party Advertising; Analytics.

Keep “Data Used to Track You” set to **No** because the app requests only non-personalized ads, does not request ATT authorization, and does not use advertising data to track readers across other companies’ apps or websites.

## Release checklist

- Confirm the dedicated Spines & Spins European regulations message is active in AdMob.
- Confirm `https://spinesandspins.netlify.app/app-ads.txt` contains the publisher line and AdMob reports the app as verified.
- Confirm the updated privacy policy is live at the store’s Privacy Policy URL.
- Test First Chapter with a Google demo banner on a simulator or registered test device.
- Test Story Spinner and Shelf Enchanter accounts and confirm no AdMob request is made.
- Update App Privacy before adding version 1.0.3 for review.
