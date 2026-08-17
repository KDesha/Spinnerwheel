import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const passes = [];
const read = file => readFile(path.join(root, file), "utf8");

function check(condition, success, failure) {
  if (condition) passes.push(success);
  else errors.push(failure);
}

const [app, packageJson, infoPlist, privacyManifest, xcodeProject] = await Promise.all([
  read("app-v2.js"),
  read("package.json"),
  read("ios/App/App/Info.plist"),
  read("ios/App/App/PrivacyInfo.xcprivacy"),
  read("ios/App/App.xcodeproj/project.pbxproj"),
]);

check(!/AIza[0-9A-Za-z_-]{20,}/.test(app), "No Google key is shipped in app-v2.js", "A Google API key is still shipped in app-v2.js");
check(!app.includes("AMAZON_AFFILIATE_TAG"), "Amazon works as a plain search link", "Amazon affiliate placeholder remains in client code");
const revenueCatKey = app.match(/const REVENUECAT_IOS_API_KEY = "([^"]*)";/)?.[1] || "";
check(
  /^appl_[A-Za-z0-9]+$/.test(revenueCatKey) && revenueCatKey !== "appl_REPLACE_IN_REVENUECAT",
  "RevenueCat iOS public key is configured",
  "Replace REVENUECAT_IOS_API_KEY with the iOS public SDK key from RevenueCat"
);
check(packageJson.includes('"@supabase/supabase-js"'), "Supabase client is a pinned app dependency", "Supabase client dependency is missing");
check(infoPlist.includes("NSMicrophoneUsageDescription"), "Microphone usage text is present", "NSMicrophoneUsageDescription is missing");
check(infoPlist.includes("ITSAppUsesNonExemptEncryption"), "Export-compliance declaration is present", "ITSAppUsesNonExemptEncryption is missing");
check(privacyManifest.includes("NSPrivacyCollectedDataTypeEmailAddress"), "App privacy manifest declares account data", "App privacy manifest is incomplete");
check(xcodeProject.includes("PrivacyInfo.xcprivacy in Resources"), "Privacy manifest is bundled by Xcode", "PrivacyInfo.xcprivacy is not in the Xcode Resources phase");

for (const file of ["privacy.html", "terms.html", "support.html", "supabase/functions/book-catalog/index.ts", "supabase/functions/delete-account/index.ts"]) {
  try {
    await access(path.join(root, file));
    passes.push(`${file} exists`);
  } catch (_) {
    errors.push(`${file} is missing`);
  }
}

for (const file of ["index.html", "club.html", "genres.html", "genre.html", "book.html"]) {
  const html = await read(file);
  check(html.includes('src="vendor/supabase.js"'), `${file} uses the bundled Supabase client`, `${file} still depends on a remote Supabase script`);
}

try {
  await access(path.join(root, "www", "vendor", "supabase.js"));
  passes.push("Built Supabase browser bundle exists");
} catch (_) {
  errors.push("Run npm run build:web to create www/vendor/supabase.js");
}

try {
  await access(path.join(root, "vendor", "supabase.js"));
  passes.push("GitHub Pages Supabase browser bundle exists");
} catch (_) {
  errors.push("Run npm run build:web to create vendor/supabase.js for GitHub Pages");
}

warnings.push("Deploy both Supabase migrations and all three Edge Functions before review.");
warnings.push("Set the GOOGLE_BOOKS_API_KEY Edge Function secret to a newly rotated key restricted to the Books API.");
warnings.push("Confirm App Store Connect privacy answers match ios/App/App/PrivacyInfo.xcprivacy and privacy.html.");
warnings.push("Provide App Review with a working demo account and keep the backend online during review.");

for (const item of passes) console.log(`✓ ${item}`);
for (const item of warnings) console.warn(`! ${item}`);
for (const item of errors) console.error(`✗ ${item}`);

if (errors.length) {
  console.error(`\nRelease check failed with ${errors.length} required item${errors.length === 1 ? "" : "s"}.`);
  process.exitCode = 1;
} else {
  console.log("\nLocal release checks passed.");
}
