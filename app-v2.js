const SUPABASE_URL = "https://rogeqnlbbzcrifuiyhsr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TUtkRHF0gz91QOwDdXTNKQ_iwR_PcbN";
const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const APPLE_STANDARD_EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

// Filled when the native Capacitor shell is created. RevenueCat public SDK
// keys are safe to ship in the app; secret keys belong only in Edge Functions.
const REVENUECAT_IOS_API_KEY = "appl_aHlmxFRtjCcXMMmlRmnFvZWzPkO";
const REVENUECAT_ANDROID_API_KEY = "";
const REVENUECAT_OFFERING_ID = "spines_and_spins";

const SUBSCRIPTION_TIERS = {
  first_chapter: {
    id: "first_chapter",
    name: "First Chapter",
    price: "Free",
    clubLimit: 1,
    bookLimit: 25,
    tagline: "A little magic to begin your reading world.",
    features: ["1 club", "25 books", "Unlimited members", "Book and genre wheels", "Reading rooms and text discussions"]
  },
  story_spinner: {
    id: "story_spinner",
    name: "Story Spinner",
    price: "$1.99/month",
    clubLimit: 2,
    bookLimit: 100,
    tagline: "More room to spin, share, and discover.",
    features: ["2 clubs", "100 books per club", "Member polls", "Voice notes", "Goodreads imports", "6 magical themes"]
  },
  shelf_enchanter: {
    id: "shelf_enchanter",
    name: "Shelf Enchanter",
    price: "$3.99/month",
    clubLimit: 8,
    bookLimit: 500,
    featured: true,
    tagline: "Everything a devoted book-club host needs.",
    features: ["8 clubs", "500 books per club", "Custom wheels", "Advanced voting", "Reading insights and recaps", "Imports, exports, and backups"]
  },
  library_legend: {
    id: "library_legend",
    name: "Library Legend",
    price: "$4.99/month",
    clubLimit: Infinity,
    bookLimit: Infinity,
    tagline: "Your entire reading world, without limits.",
    features: ["Unlimited clubs", "Unlimited books", "Custom club branding", "Advanced admin roles", "Scheduled reminders", "Early access to new magic"]
  }
};

const REVENUECAT_PRODUCTS = {
  story_spinner: "spines_and_spins_story_spinner_monthly",
  shelf_enchanter: "spines_and_spins_shelf_enchanter_monthly",
  library_legend: "spines_and_spins_library_legend_monthly"
};

const GENRES = [
  { name: "Romance", slug: "romance", kind: "Fiction", image: "Romance.jpeg", theme: "romance", description: "Love stories, longing looks, and happily-ever-afters." },
  { name: "Fantasy", slug: "fantasy", kind: "Fiction", image: "Fantasy.jpeg", theme: "fantasy", description: "Magic, quests, and worlds beyond the ordinary." },
  { name: "Sci-Fi", slug: "sci-fi", kind: "Fiction", image: "Scifi .jpeg", theme: "scifi", description: "Future worlds, strange tech, and big what-if questions." },
  { name: "Mystery", slug: "mystery", kind: "Fiction", image: "Mystery.jpeg", theme: "mystery", description: "Clues, secrets, and theories worth sharing." },
  { name: "Thriller & Suspense", slug: "thriller-suspense", kind: "Fiction", image: "Thriller.jpeg", theme: "thriller", description: "Tense turns and pages that refuse to let go." },
  { name: "Horror", slug: "horror", kind: "Fiction", image: "Horror .jpeg", theme: "horror", description: "Dark stories, haunted places, and shadows that move." },
  { name: "Historical Fiction", slug: "historical-fiction", kind: "Fiction", image: "Library .jpeg", theme: "historical", description: "Past worlds brought vividly back to life." },
  { name: "Action & Adventure", slug: "action-adventure", kind: "Fiction", image: "Adventure.jpeg", theme: "adventure", description: "Journeys, danger, discoveries, and daring escapes." },
  { name: "Dystopian", slug: "dystopian", kind: "Fiction", image: "Dystopian .jpg", theme: "dystopian", description: "Broken societies, brave rebels, and futures to question." },
  { name: "Young Adult (YA)", slug: "young-adult", kind: "Fiction", image: "YA.jpeg", theme: "ya", description: "Big feelings, coming-of-age moments, and unforgettable firsts." },
  { name: "Manga & Graphic Novels", slug: "manga-graphic-novels", kind: "Fiction", image: "Manga.jpeg", theme: "manga", description: "Visual storytelling, dramatic panels, and artful adventures." },
  { name: "Memoir & Biography", slug: "memoir-biography", kind: "Nonfiction", image: "Library .jpeg", theme: "memoir", description: "True lives, personal stories, and remarkable people." },
  { name: "History", slug: "history", kind: "Nonfiction", image: "Library .jpeg", theme: "history", description: "People, places, movements, and moments that shaped us." },
  { name: "Self-Help & How-To", slug: "self-help-how-to", kind: "Nonfiction", image: "Main.jpeg", theme: "selfhelp", description: "Ideas, guidance, and practical tools for your next chapter." },
  { name: "True Crime", slug: "true-crime", kind: "Nonfiction", image: "Mystery.jpeg", theme: "truecrime", description: "Real investigations, cases, and stories behind the headlines." },
  { name: "Essays & Journalism", slug: "essays-journalism", kind: "Nonfiction", image: "Library .jpeg", theme: "essays", description: "Sharp observations, reporting, and perspectives worth discussing." }
];

const GENRE_GROUPS = ["Fiction", "Nonfiction"];
const ALL_GENRE_NAMES = GENRES.map(genre => genre.name);

const COLORS = [
  "#a6495d",
  "#8e5aa7",
  "#4b536d",
  "#8a6f2a",
  "#367788",
  "#983936",
  "#d58644",
  "#25161a",
  "#be6e63",
  "#586656",
  "#ad6d30",
  "#7b623e"
];

const clubKey = "bookishBabesCurrentClub";

let sb = null;
let user = null;
let profile = null;
let currentClub = null;
let clubBooks = [];
let currentClubPlan = SUBSCRIPTION_TIERS.first_chapter;
let revenueCatReady = false;
let revenueCatOfferings = null;
let rotation = 0;
let spinning = false;
let selectedTags = new Set();
let blockedUserIds = new Set();

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const escapeHtml = value =>
  String(value ?? "").replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));

const route = document.body.dataset.page || "home";
const getParam = key => new URLSearchParams(location.search).get(key);

const setStatus = (message, tone = "") => {
  const el = $("#statusText");

  if (!el) return;

  el.textContent = message;
  el.className = `status-pill ${tone}`;
};

function initSupabase() {
  if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

function appUrl(path, extra = {}) {
  const url = new URL(path, location.href);
  const clubId = extra.club || currentClub?.id || localStorage.getItem(clubKey);

  if (clubId) {
    url.searchParams.set("club", clubId);
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (key !== "club" && value != null) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname.split("/").pop()}${url.search}`;
}

function genreForSlug(slug) {
  return GENRES.find(genre => genre.slug === slug) || GENRES[3];
}

function isAdmin() {
  return currentClub?.membership?.role === "owner" ||
    currentClub?.membership?.role === "admin";
}

function isOwner() {
  return currentClub?.membership?.role === "owner";
}

async function initialize() {
  const localPreview = ["localhost", "127.0.0.1"].includes(location.hostname)
    ? getParam("preview")
    : "";
  if (localPreview) {
    user = { id: "00000000-0000-4000-8000-000000000001", email: "reader@example.com" };
    profile = { id: user.id, display_name: "Preview Reader", subscription_tier: "first_chapter" };
    currentClub = { id: "preview-club", name: "Midnight Margins", membership: { role: "owner" } };
    updateNav();
    if (localPreview === "paywall") openPaywall();
    if (localPreview === "pick") {
      await openPickDialog({
        id: "preview-book",
        title: "The Night Circus",
        authors: ["Erin Morgenstern"],
        cover_url: "https://covers.openlibrary.org/b/isbn/9780385534635-L.jpg",
        genres: ["Fantasy", "Romance"],
        description: "The circus arrives without warning. Within its black-and-white tents, a fierce competition unfolds between two young magicians who have been trained since childhood for a mysterious contest of imagination and will."
      }, GENRES[1]);
    }
    if (localPreview === "safety") {
      const main = $("main");
      if (main) {
        main.innerHTML = `
          <section class="page-shell">
            <p class="eyebrow">Community safety preview</p>
            <h1>Reading room</h1>
            ${messageCard({
              id: "preview-message",
              author_id: "00000000-0000-4000-8000-000000000002",
              body: "I loved how this chapter changed the story's direction.",
              created_at: new Date().toISOString(),
              profiles: { display_name: "Another Reader" }
            })}
          </section>`;
        bindMessageSafetyActions(main);
      }
    }
    return;
  }

  initSupabase();
  if (nativePlatform() === "web") {
    registerPWA();
  }

  if (!sb) {
    return setStatus("Supabase is not connected yet.", "warning");
  }

  const {
    data: { session }
  } = await sb.auth.getSession();

  user = session?.user || null;

  sb.auth.onAuthStateChange((event, sessionNow) => {
    user = sessionNow?.user || null;

    if (!user) {
      localStorage.removeItem(clubKey);
    }

    updateNav();

    if (event === "PASSWORD_RECOVERY") {
      openPasswordResetDialog();
    }
  });

  if (new URLSearchParams(location.hash.slice(1)).get("type") === "recovery") {
    setTimeout(openPasswordResetDialog, 0);
  }

  if (user) {
    await loadProfile();
    await initializeRevenueCat();
  }

  updateNav();
  await bootRoute();
}

function registerPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.warn);
  }
}

async function loadProfile() {
  let { data, error } = await sb
    .from("profiles")
    .select("id,display_name,avatar_url,subscription_tier,subscription_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  // Keeps development usable until the subscription migration is applied.
  if (error) {
    ({ data } = await sb
      .from("profiles")
      .select("id,display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle());
  }

  profile = data || {
    id: user.id,
    display_name:
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Bookish Reader"
  };

  if (!data) {
    await sb.from("profiles").upsert(profile, { onConflict: "id" });
  }
}

function activeTier() {
  return SUBSCRIPTION_TIERS[profile?.subscription_tier] || SUBSCRIPTION_TIERS.first_chapter;
}

function tierRank(tierId) {
  return ["first_chapter", "story_spinner", "shelf_enchanter", "library_legend"].indexOf(tierId);
}

function clubIncludesTier(minimumTier) {
  return tierRank(currentClubPlan.id) >= tierRank(minimumTier);
}

function formatLimit(value) {
  return Number.isFinite(value) ? String(value) : "Unlimited";
}

function revenueCatPlugin() {
  return window.Capacitor?.Plugins?.Purchases || null;
}

function nativePlatform() {
  return window.Capacitor?.getPlatform?.() || "web";
}

async function initializeRevenueCat() {
  const purchases = revenueCatPlugin();
  const platform = nativePlatform();
  const apiKey = platform === "ios" ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

  if (!purchases || !user || platform === "web" || apiKey.includes("REPLACE")) return;

  try {
    const configuration = await purchases.isConfigured();
    if (!configuration?.isConfigured) {
      await purchases.configure({
        apiKey,
        appUserID: user.id,
        automaticDeviceIdentifierCollectionEnabled: false
      });
    } else {
      const identity = await purchases.getAppUserID();
      if (identity?.appUserID !== user.id) {
        await purchases.logIn({ appUserID: user.id });
      }
    }
    revenueCatReady = true;
    revenueCatOfferings = await purchases.getOfferings();
  } catch (error) {
    console.warn("RevenueCat is not ready yet:", error);
  }
}

function offeringPackages() {
  const offering = revenueCatOfferings?.current ||
    revenueCatOfferings?.all?.[REVENUECAT_OFFERING_ID] ||
    revenueCatOfferings?.[REVENUECAT_OFFERING_ID];
  return offering?.availablePackages || [];
}

function packageForTier(tierId) {
  const productId = REVENUECAT_PRODUCTS[tierId];
  return offeringPackages().find(item =>
    item?.product?.identifier === productId || item?.identifier === tierId
  );
}

function updateNav() {
  const nav = $("#appNav");

  if (!nav) return;

  const isSubGenrePage = route === "genre" || route === "book";
  const isMainLibrary = route === "genres";
  const clubHref = appUrl("club.html");
  const libraryHref = appUrl("genres.html");

  nav.innerHTML = `
    <a class="brand-mark" href="${user ? clubHref : "index.html"}">✦ Spines &amp; Spins</a>
    <div class="nav-actions">
      ${
        user
          ? `
            ${
              isSubGenrePage
                ? `<a class="nav-link" href="${libraryHref}">← Back to Library</a>`
                : isMainLibrary
                  ? `<button class="nav-icon-button" id="clubToolsNav" aria-label="Club settings" title="Club settings">⚙</button>`
                  : route === "home"
                    ? ""
                    : `<a class="nav-link" href="${clubHref}">My Clubs</a>`
            }
            <button class="nav-link" id="openAuth">
              ${escapeHtml(profile?.display_name || "Account")}
            </button>
          `
          : `<button class="nav-link" id="openAuth">Sign in</button>`
      }
    </div>
  `;

  $("#openAuth")?.addEventListener("click", () => {
    if (user) openAccountMenu();
    else openAuthDialog();
  });

  $("#clubToolsNav")?.addEventListener("click", openClubTools);

  const homeSignIn = $("#homeSignIn");
  if (homeSignIn) {
    homeSignIn.hidden = Boolean(user);
  }
}

function openAccountMenu() {
  const plan = activeTier();
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="accountDialog">
      <div class="dialog-card">
        <button class="dialog-close" onclick="this.closest('dialog').close()">×</button>

        <p class="eyebrow">Your reading corner</p>
        <h2>${escapeHtml(profile?.display_name || "Bookish Reader")}</h2>
        <p class="field-help">Signed in as ${escapeHtml(user.email)}</p>

        <button class="account-plan-card" id="managePlan" type="button">
          <span><small>Your current chapter</small><strong>${escapeHtml(plan.name)}</strong></span>
          <span>${escapeHtml(plan.price)} <b>View plans →</b></span>
        </button>

        <label class="field-label">Display name</label>
        <input
          id="profileName"
          value="${escapeHtml(profile?.display_name || "")}"
          maxlength="60"
        >

        <div class="button-row top-gap">
          <button class="secondary-button" id="signOut">Sign out</button>
          <button class="primary-button" id="saveProfile">Save</button>
        </div>

        <div class="account-links" aria-label="Account and legal links">
          <a href="support.html" target="_blank" rel="noopener">Support</a>
          <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a>
          <a href="terms.html" target="_blank" rel="noopener">Terms of use</a>
          <a href="${APPLE_SUBSCRIPTIONS_URL}" target="_blank" rel="noopener">Manage App Store subscription</a>
          <button class="text-button" id="manageBlockedReaders" type="button">Blocked readers</button>
          <button class="text-button danger-link" id="deleteAccount" type="button">Delete account</button>
        </div>
      </div>
    </dialog>
    `
  );

  const dialog = $("#accountDialog");
  dialog.showModal();

  $("#managePlan", dialog).onclick = () => {
    dialog.close();
    openPaywall();
  };

  $("#saveProfile").onclick = async () => {
    const display_name = $("#profileName").value.trim() || "Bookish Reader";

    const { error } = await sb
      .from("profiles")
      .update({ display_name })
      .eq("id", user.id);

    if (error) {
      return alert(error.message);
    }

    profile.display_name = display_name;
    dialog.close();
    dialog.remove();
    updateNav();
  };

  $("#signOut").onclick = async () => {
    const purchases = revenueCatPlugin();
    if (revenueCatReady && purchases) {
      try {
        await purchases.logOut();
      } catch (error) {
        console.warn("RevenueCat sign-out cleanup was skipped:", error);
      }
    }
    await sb.auth.signOut();
    location.href = "index.html";
  };

  $("#deleteAccount", dialog).onclick = () => {
    dialog.close();
    openDeleteAccountDialog();
  };

  $("#manageBlockedReaders", dialog).onclick = () => {
    dialog.close();
    openBlockedReadersDialog();
  };

  dialog.addEventListener("close", () => dialog.remove());
}

async function loadBlockedUsers() {
  if (!sb || !user) return blockedUserIds;
  const { data, error } = await sb
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  if (!error) blockedUserIds = new Set((data || []).map(item => item.blocked_id));
  return blockedUserIds;
}

async function openBlockedReadersDialog() {
  if ($("#blockedReadersDialog")) return;
  await loadBlockedUsers();
  const blockedIds = [...blockedUserIds];
  let profiles = [];
  if (blockedIds.length) {
    const result = await sb.from("profiles").select("id,display_name").in("id", blockedIds);
    profiles = result.data || [];
  }
  const names = new Map(profiles.map(item => [item.id, item.display_name]));

  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="blockedReadersDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">Your safety controls</p>
        <h2>Blocked readers</h2>
        <p class="field-help">Messages from blocked readers are hidden from your reading rooms.</p>
        <div class="blocked-reader-list">
          ${blockedIds.length ? blockedIds.map(id => `
            <div class="blocked-reader-row">
              <span>${escapeHtml(names.get(id) || "Blocked reader")}</span>
              <button class="secondary-button small-button" type="button" data-unblock-user="${id}">Unblock</button>
            </div>`).join("") : `<p class="empty-note">You have not blocked anyone.</p>`}
        </div>
      </div>
    </dialog>`);

  const dialog = $("#blockedReadersDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  $$('[data-unblock-user]', dialog).forEach(button => {
    button.onclick = async () => {
      const blockedId = button.dataset.unblockUser;
      const { error } = await sb.from("user_blocks").delete()
        .eq("blocker_id", user.id).eq("blocked_id", blockedId);
      if (error) return alert(error.message);
      blockedUserIds.delete(blockedId);
      button.closest(".blocked-reader-row")?.remove();
    };
  });
  dialog.addEventListener("close", () => dialog.remove());
}

async function edgeFunctionErrorMessage(error, fallback) {
  try {
    const payload = await error?.context?.json?.();
    return payload?.error?.message || payload?.message || fallback;
  } catch (_) {
    return error?.message || fallback;
  }
}

function openDeleteAccountDialog() {
  if ($("#deleteAccountDialog")) return;
  const hasPaidPlan = activeTier().id !== "first_chapter";
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="deleteAccountDialog">
      <form class="dialog-card" id="deleteAccountForm">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">Permanent account deletion</p>
        <h2>Delete your reading world?</h2>
        <p class="field-help">This permanently deletes your profile, memberships, messages, reading updates, voice notes, and every club you own. This cannot be undone.</p>
        ${hasPaidPlan ? `<p class="deletion-subscription-warning">Deleting this account does not cancel App Store billing. <a href="${APPLE_SUBSCRIPTIONS_URL}" target="_blank" rel="noopener">Cancel your subscription with Apple first</a> if you do not want it to renew.</p>` : ""}
        <label class="field-label field-label-spaced" for="deleteConfirmation">Type DELETE to confirm</label>
        <input id="deleteConfirmation" autocomplete="off" autocapitalize="characters" spellcheck="false" required>
        <p id="deleteAccountStatus" class="field-help" role="status" aria-live="polite"></p>
        <div class="button-row top-gap">
          <button class="secondary-button" id="cancelAccountDeletion" type="button">Keep my account</button>
          <button class="danger-button secondary-button" id="confirmAccountDeletion" type="submit" disabled>Delete permanently</button>
        </div>
      </form>
    </dialog>`);

  const dialog = $("#deleteAccountDialog");
  const confirmation = $("#deleteConfirmation", dialog);
  const submit = $("#confirmAccountDeletion", dialog);
  const status = $("#deleteAccountStatus", dialog);
  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();
  $("#cancelAccountDeletion", dialog).onclick = () => dialog.close();
  confirmation.oninput = () => {
    submit.disabled = confirmation.value.trim().toUpperCase() !== "DELETE";
  };

  $("#deleteAccountForm", dialog).onsubmit = async event => {
    event.preventDefault();
    if (confirmation.value.trim().toUpperCase() !== "DELETE") return;
    confirmation.disabled = true;
    submit.disabled = true;
    status.textContent = "Deleting your account and reading data…";

    const { error } = await sb.functions.invoke("delete-account", { body: { confirmation: "DELETE" } });
    if (error) {
      confirmation.disabled = false;
      submit.disabled = false;
      status.textContent = await edgeFunctionErrorMessage(error, "Your account could not be deleted right now. Please try again.");
      return;
    }

    const purchases = revenueCatPlugin();
    if (revenueCatReady && purchases) {
      try { await purchases.logOut(); } catch (_) {}
    }
    localStorage.clear();
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
    location.href = "index.html";
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function planCardMarkup(plan) {
  const current = activeTier().id === plan.id;
  const storePackage = packageForTier(plan.id);
  const storePrice = storePackage?.product?.priceString || storePackage?.product?.price?.formatted;
  return `
    <article class="plan-card ${plan.featured ? "is-featured" : ""} ${current ? "is-current" : ""}">
      ${plan.featured ? `<span class="plan-ribbon">Most popular</span>` : ""}
      <p class="eyebrow">${escapeHtml(plan.name)}</p>
      <h3>${escapeHtml(storePrice || plan.price)}</h3>
      <p>${escapeHtml(plan.tagline)}</p>
      <ul>${plan.features.map(feature => `<li><span aria-hidden="true">✦</span>${escapeHtml(feature)}</li>`).join("")}</ul>
      ${plan.id === "first_chapter"
        ? `<button class="secondary-button" type="button" disabled>${current ? "Your current plan" : "Included for everyone"}</button>`
        : `<button class="${plan.featured ? "primary-button" : "secondary-button"}" type="button" data-purchase-tier="${plan.id}" ${current ? "disabled" : ""}>${current ? "Your current plan" : `Choose ${escapeHtml(plan.name)}`}</button>`}
    </article>`;
}

function openPaywall({ reason = "", requiredTier = "" } = {}) {
  if ($("#paywallDialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog paywall-dialog" id="paywallDialog">
      <div class="dialog-card paywall-card">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <div class="paywall-heading">
          <span class="paywall-spark" aria-hidden="true">✦</span>
          <p class="eyebrow">Choose your next chapter</p>
          <h2>Make more room for bookish magic.</h2>
          <p>${escapeHtml(reason || "Create more clubs, grow your shelves, and unlock more ways to read together.")}</p>
        </div>
        <div class="plan-grid">
          ${Object.values(SUBSCRIPTION_TIERS).map(plan => planCardMarkup(plan)).join("")}
        </div>
        <div class="paywall-footer">
          <button class="text-button" id="restorePurchases" type="button">Restore purchases</button>
          <p>Each plan is a one-month auto-renewable subscription. Payment is charged to your App Store account when you confirm. It renews monthly unless canceled at least 24 hours before the current period ends.</p>
          <p class="legal-links"><a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a><span aria-hidden="true">·</span><a href="${APPLE_STANDARD_EULA_URL}" target="_blank" rel="noopener">Terms of Use</a><span aria-hidden="true">·</span><a href="${APPLE_SUBSCRIPTIONS_URL}" target="_blank" rel="noopener">Manage Subscription</a></p>
          <p id="purchaseStatus" role="status" aria-live="polite"></p>
        </div>
      </div>
    </dialog>`);

  const dialog = $("#paywallDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  if (requiredTier) $(`[data-purchase-tier="${requiredTier}"]`, dialog)?.focus();

  $$('[data-purchase-tier]', dialog).forEach(button => {
    button.onclick = () => purchaseTier(button.dataset.purchaseTier, dialog);
  });
  $("#restorePurchases", dialog).onclick = () => restorePurchases(dialog);
  dialog.addEventListener("close", () => dialog.remove());
}

async function purchaseTier(tierId, dialog) {
  const status = $("#purchaseStatus", dialog);
  const purchases = revenueCatPlugin();
  const selectedPackage = packageForTier(tierId);
  if (!revenueCatReady || !purchases || !selectedPackage) {
    status.textContent = "Purchases will become available in the installed app after the store products and RevenueCat keys are connected.";
    return;
  }

  status.textContent = "Opening the enchanted checkout…";
  try {
    await purchases.purchasePackage({ aPackage: selectedPackage });
    status.textContent = "Purchase complete. Your new shelves are being prepared…";
    const synced = await waitForSubscriptionProfile(tierId);
    status.textContent = synced
      ? "Purchase complete. Your new shelves are ready."
      : "Purchase complete. Your access is still syncing and will appear shortly.";
    setTimeout(() => location.reload(), 900);
  } catch (error) {
    if (error?.userCancelled || error?.code === "PURCHASE_CANCELLED_ERROR") {
      status.textContent = "No worries—your purchase was canceled.";
    } else {
      status.textContent = "The store could not complete that purchase. Please try again.";
      console.warn(error);
    }
  }
}

async function restorePurchases(dialog) {
  const status = $("#purchaseStatus", dialog);
  const purchases = revenueCatPlugin();
  if (!revenueCatReady || !purchases) {
    status.textContent = "Restore Purchases is available in the installed iOS or Android app.";
    return;
  }
  status.textContent = "Looking through your past purchases…";
  try {
    const result = await purchases.restorePurchases();
    const expectedTier = highestCustomerTier(result?.customerInfo);
    const synced = await waitForSubscriptionProfile(expectedTier);
    status.textContent = synced
      ? "Your purchases have been restored."
      : "Your purchases were found and are still syncing. Your access will appear shortly.";
    setTimeout(() => location.reload(), 900);
  } catch (error) {
    status.textContent = "We could not restore purchases right now. Please try again.";
    console.warn(error);
  }
}

function highestCustomerTier(customerInfo) {
  const activeEntitlements = Object.keys(customerInfo?.entitlements?.active || {})
    .filter(id => SUBSCRIPTION_TIERS[id]);
  return activeEntitlements.sort((a, b) => tierRank(b) - tierRank(a))[0] || "first_chapter";
}

async function waitForSubscriptionProfile(expectedTier, attempts = 8) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await loadProfile();
    if (!expectedTier || activeTier().id === expectedTier) return true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

function authRedirectUrl() {
  return new URL("club.html", window.location.href).href;
}

function openAuthDialog(mode = "signin") {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="authDialog">
      <form class="dialog-card" id="authForm">
        <button class="dialog-close" type="button" aria-label="Close">×</button>

        <p class="eyebrow" id="authEyebrow">Welcome back, book lover</p>
        <h2 id="authTitle">Sign in to your shelves</h2>

        <div id="authNameWrap" hidden>
          <label class="field-label">Display name</label>
          <input id="authName" placeholder="Your bookish name" maxlength="60">
        </div>

        <label class="field-label field-label-spaced">Email</label>
        <input
          id="authEmail"
          type="email"
          placeholder="you@example.com"
          required
          autocomplete="email"
        >

        <label class="field-label field-label-spaced">Password</label>
        <input
          id="authPassword"
          type="password"
          minlength="8"
          placeholder="At least 8 characters"
          required
          autocomplete="current-password"
        >

        <div id="authConsentWrap" hidden>
          <label class="toggle-line auth-consent">
            <input id="authConsent" type="checkbox" disabled>
            <span>I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms and Community Standards</a> and acknowledge the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span>
          </label>
        </div>

        <button class="text-button auth-forgot" type="button" id="forgotPassword">
          Forgot your password?
        </button>

        <p id="authHelp" class="field-help">
          New here? Create an account to save shelves and start a club.
        </p>

        <div class="button-row">
          <button class="secondary-button" type="button" id="toggleAuth">
            Create account
          </button>

          <button class="primary-button" id="authSubmit" type="submit">
            Sign in
          </button>
        </div>
      </form>
    </dialog>
    `
  );

  const dialog = $("#authDialog");
  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  let currentMode = mode;

  const setMode = nextMode => {
    currentMode = nextMode;

    const signup = currentMode === "signup";

    $("#authEyebrow", dialog).textContent = signup
      ? "Welcome, fellow book lover"
      : "Welcome back, book lover";

    $("#authTitle", dialog).textContent = signup
      ? "Create your reading world"
      : "Sign in to your shelves";

    $("#authNameWrap", dialog).hidden = !signup;
    $("#authName", dialog).required = signup;
    $("#authConsentWrap", dialog).hidden = !signup;
    $("#authConsent", dialog).required = signup;
    $("#authConsent", dialog).disabled = !signup;

    $("#authPassword", dialog).autocomplete = signup
      ? "new-password"
      : "current-password";

    $("#authHelp", dialog).textContent = signup
      ? "Already have an account? Sign in instead."
      : "New here? Create an account to save shelves and start a club.";

    $("#toggleAuth", dialog).textContent = signup
      ? "Sign in instead"
      : "Create account";

    $("#authSubmit", dialog).textContent = signup
      ? "Create account"
      : "Sign in";
  };

  setMode(mode);

  $("#toggleAuth", dialog).onclick = () => {
    setMode(currentMode === "signup" ? "signin" : "signup");
  };

  $("#forgotPassword", dialog).onclick = async () => {
    const email = $("#authEmail", dialog).value.trim();

    if (!email) {
      return alert(
        "Enter your email address first, then choose Forgot your password."
      );
    }

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl()
    });

    if (error) {
      return alert(error.message);
    }

    alert(
      "Password reset email sent. Open the newest email, set your new password, then return to Spines & Spins."
    );
  };

  $("#authForm", dialog).onsubmit = async event => {
    event.preventDefault();

    const email = $("#authEmail", dialog).value.trim();
    const password = $("#authPassword", dialog).value;

    if (currentMode === "signup") {
      const displayName = $("#authName", dialog).value.trim() || "Bookish Reader";

      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: {
            display_name: displayName
          }
        }
      });

      if (error) {
        return alert(error.message);
      }

      alert(
        "Your account is ready to confirm. Check your email for the confirmation link, then sign in."
      );

      return;
    }

    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return alert(error.message);
    }

    dialog.close();
    location.href = "club.html";
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function openPasswordResetDialog() {
  if ($("#passwordResetDialog")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="passwordResetDialog">
      <form class="dialog-card" id="passwordResetForm">
        <p class="eyebrow">Your reading world is safe</p>
        <h2>Choose a new password</h2>

        <label class="field-label">New password</label>
        <input
          id="newPassword"
          type="password"
          minlength="8"
          required
          autocomplete="new-password"
          placeholder="At least 8 characters"
        >

        <label class="field-label field-label-spaced">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          minlength="8"
          required
          autocomplete="new-password"
          placeholder="Type it one more time"
        >

        <button class="primary-button full-button" type="submit">
          Save new password
        </button>
      </form>
    </dialog>
    `
  );

  const dialog = $("#passwordResetDialog");
  dialog.showModal();

  $("#passwordResetForm", dialog).onsubmit = async event => {
    event.preventDefault();

    const password = $("#newPassword", dialog).value;

    if (password !== $("#confirmPassword", dialog).value) {
      return alert("Those passwords do not match yet.");
    }

    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      return alert(error.message);
    }

    alert("Your password has been updated. You are signed in.");
    dialog.close();
    location.href = "club.html";
  };

  dialog.addEventListener("close", () => dialog.remove());
}

async function requireUser() {
  if (!user) {
    openAuthDialog();
    return false;
  }

  return true;
}

async function loadCurrentClub() {
  const requested = getParam("club") || localStorage.getItem(clubKey);

  if (!requested || !user) {
    return null;
  }

  const { data: membership, error } = await sb
    .from("club_members")
    .select("club_id,role,clubs(*)")
    .eq("club_id", requested)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership) {
    return null;
  }

  currentClub = {
    ...membership.clubs,
    membership
  };

  try {
    const { data: clubPlan } = await sb.rpc("get_club_plan", {
      target_club_id: currentClub.id
    });
    currentClubPlan = SUBSCRIPTION_TIERS[clubPlan] || SUBSCRIPTION_TIERS.first_chapter;
  } catch (error) {
    currentClubPlan = SUBSCRIPTION_TIERS.first_chapter;
  }

  localStorage.setItem(clubKey, currentClub.id);

  return currentClub;
}

async function bootRoute() {
  if (route === "home") return;

  if (!user) {
    if (route !== "club") {
      openAuthDialog();
    }

    return;
  }

  if (route === "clubs") {
    return renderClubHub();
  }

  await loadCurrentClub();

  if (!currentClub) {
    location.href = "club.html";
    return;
  }

  if (route === "genres") {
    return renderGenreWheel();
  }

  if (route === "genre") {
    return renderBookWheel();
  }

  if (route === "book") {
    return renderBookRoom();
  }
}

async function renderClubHub() {
  const root = $("#clubHub");

  if (!root) return;

  setStatus("Gathering your shelves...");

  const [{ data: memberships }, { data: publicClubs }] = await Promise.all([
    sb
      .from("club_members")
      .select("club_id,role,clubs(id,name,description,is_public,invite_code,created_at)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false }),

    sb
      .from("clubs")
      .select("id,name,description,is_public,created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24)
  ]);

  const memberIds = new Set((memberships || []).map(item => item.club_id));
  const ownedCount = (memberships || []).filter(item => item.role === "owner").length;
  const plan = activeTier();

  root.innerHTML = `
    <section class="hub-section">
      <div class="section-heading">
        <p class="eyebrow">Your clubs</p>
        <h2>Where your stories live</h2>
      </div>

      <div class="club-grid">
        ${
          (memberships || []).length
            ? memberships.map(item => clubCard(item.clubs, item.role)).join("")
            : emptyCard(
                "Your first club is waiting",
                "Create a private reading group or discover a public one below."
              )
        }
      </div>
    </section>

    <button class="plan-usage-banner glass-panel" id="openPlans" type="button">
      <span><small>${escapeHtml(plan.name)}</small><strong>${ownedCount} of ${formatLimit(plan.clubLimit)} owned clubs</strong></span>
      <span>Explore plans <b>→</b></span>
    </button>

    <section class="club-hero glass-panel">
      <div>
        <p class="eyebrow">Your bookish universe</p>
        <h1>Make a club. Invite your readers. Pick your next obsession.</h1>
        <p>
          Every club gets its own wheel, Book of the Month, reading room,
          and spoiler-safe chapter conversations.
        </p>
      </div>

      <div class="club-hero-buttons">
        <button class="primary-button" id="createClub">Create a club</button>
        <button class="secondary-button" id="joinClub">Join with a code</button>
      </div>
    </section>

    <section class="hub-section">
      <div class="section-heading">
        <p class="eyebrow">Discover</p>
        <h2>Public clubs to wander into</h2>
      </div>

      <div class="club-grid">
        ${
          (publicClubs || [])
            .filter(club => !memberIds.has(club.id))
            .map(publicClubCard)
            .join("") ||
          emptyCard(
            "Nothing public yet",
            "The first public book club will appear here."
          )
        }
      </div>
    </section>
  `;

  setStatus("Your club shelves are ready.");

  $("#createClub").onclick = () => openClubDialog();
  $("#joinClub").onclick = () => openJoinDialog();
  $("#openPlans").onclick = () => openPaywall();

  $$("[data-open-club]").forEach(button => {
    button.onclick = () => {
      localStorage.setItem(clubKey, button.dataset.openClub);
      location.href = appUrl("genres.html", {
        club: button.dataset.openClub
      });
    };
  });

  $$("[data-join-public]").forEach(button => {
    button.onclick = () => joinPublic(button.dataset.joinPublic);
  });

  $$("[data-club-members]").forEach(button => {
    button.onclick = () => {
      const matchingMembership = (memberships || []).find(
        item => item.club_id === button.dataset.clubMembers
      );

      openMembersDialog(
        button.dataset.clubMembers,
        matchingMembership?.clubs,
        matchingMembership?.role
      );
    };
  });
}

function emptyCard(title, text) {
  return `
    <article class="club-card empty-club">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function clubCard(club, role) {
  return `
    <article class="club-card">
      <div class="club-card-ribbon">
        ${club.is_public ? "Public club" : "Private circle"}
      </div>

      <p class="eyebrow">${escapeHtml(role)}</p>
      <h3>${escapeHtml(club.name)}</h3>

      <p>
        ${escapeHtml(club.description || "A magical shelf waiting to be filled.")}
      </p>

      <div class="card-footer club-card-footer">
        <span>Invite: <strong>${escapeHtml(club.invite_code)}</strong></span>
        <div class="club-card-actions">
          <button class="secondary-button small-button" data-club-members="${club.id}">
            Members
          </button>
          <button class="primary-button small-button" data-open-club="${club.id}">
            Open club
          </button>
        </div>
      </div>
    </article>
  `;
}

function publicClubCard(club) {
  return `
    <article class="club-card public-card">
      <div class="club-card-ribbon">Public club</div>

      <p class="eyebrow">Open to readers</p>
      <h3>${escapeHtml(club.name)}</h3>
      <p>${escapeHtml(club.description || "A new reading circle.")}</p>

      <div class="card-footer">
        <span>✦ New adventure</span>
        <button class="secondary-button small-button" data-join-public="${club.id}">
          Join club
        </button>
      </div>
    </article>
  `;
}

async function openMembersDialog(clubId, club, viewerRole) {
  const canRemoveMembers = viewerRole === "owner";

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog class="book-dialog" id="membersDialog">
        <div class="dialog-card members-dialog-card">
          <button class="dialog-close" type="button">×</button>
          <p class="eyebrow">${escapeHtml(club?.name || "Your club")}</p>
          <h2>Club members</h2>
          <p class="field-help">Everyone currently sharing this reading corner.</p>
          <div id="membersList" class="members-list">
            <p class="empty-note">Gathering your readers...</p>
          </div>
        </div>
      </dialog>
    `
  );

  const dialog = $("#membersDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());

  let members = [];
  let memberError = null;

  const joined = await sb
    .from("club_members")
    .select("user_id,role,joined_at,profiles(display_name,avatar_url)")
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true });

  members = joined.data || [];
  memberError = joined.error;

  if (memberError) {
    const basic = await sb
      .from("club_members")
      .select("user_id,role,joined_at")
      .eq("club_id", clubId)
      .order("joined_at", { ascending: true });

    members = basic.data || [];
    memberError = basic.error;

    if (!memberError && members.length) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", members.map(member => member.user_id));

      const profileById = new Map((profiles || []).map(item => [item.id, item]));
      members = members.map(member => ({
        ...member,
        profiles: profileById.get(member.user_id) || null
      }));
    }
  }

  const list = $("#membersList", dialog);

  if (memberError) {
    list.innerHTML = `<p class="empty-note">We could not load this club's members yet. ${escapeHtml(memberError.message || "")}</p>`;
    return;
  }

  const roleLabel = role => role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member";

  list.innerHTML = members.length
    ? members.map(member => {
        const memberProfile = Array.isArray(member.profiles)
          ? member.profiles[0]
          : member.profiles;
        const displayName = memberProfile?.display_name || "Bookish Reader";
        const canRemoveThisMember =
          canRemoveMembers &&
          member.user_id !== user.id &&
          member.role !== "owner";

        return `
          <article class="member-row">
            <div class="member-avatar" aria-hidden="true">
              ${escapeHtml(displayName.charAt(0).toUpperCase())}
            </div>
            <div class="member-details">
              <strong>${escapeHtml(displayName)}</strong>
              <span>${roleLabel(member.role)}</span>
            </div>
            ${
              canRemoveThisMember
                ? `<button class="text-button member-remove" data-remove-member="${member.user_id}">Remove</button>`
                : ""
            }
          </article>
        `;
      }).join("")
    : `<p class="empty-note">No members have joined this club yet.</p>`;

  $$("[data-remove-member]", dialog).forEach(button => {
    button.onclick = async () => {
      const target = members.find(member => member.user_id === button.dataset.removeMember);
      const name = (Array.isArray(target?.profiles) ? target?.profiles[0] : target?.profiles)?.display_name || "this member";

      if (!confirm(`Remove ${name} from this club? They can join again later with the invite code.`)) return;

      button.disabled = true;
      button.textContent = "Removing…";

      const { error } = await sb
        .from("club_members")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", button.dataset.removeMember);

      if (error) {
        button.disabled = false;
        button.textContent = "Remove";
        return alert(error.message);
      }

      button.closest(".member-row")?.remove();
    };
  });
}

function genrePickerMarkup(
  selected = ALL_GENRE_NAMES,
  id = "clubGenrePicker",
  compact = false
) {
  const selectedSet = new Set(selected);

  return `
    <div id="${id}" class="club-genre-picker ${compact ? "compact-picker" : ""}">
      ${GENRE_GROUPS.map(group => `
        <section class="genre-choice-group">
          <label class="genre-group-toggle">
            <input
              type="checkbox"
              data-genre-group="${group}"
              ${
                GENRES
                  .filter(genre => genre.kind === group)
                  .every(genre => selectedSet.has(genre.name))
                  ? "checked"
                  : ""
              }
            >
            <strong>${group}</strong>
            <small>Select all ${group.toLowerCase()}</small>
          </label>

          <div class="tag-picker">
            ${GENRES
              .filter(genre => genre.kind === group)
              .map(genre => `
                <button
                  type="button"
                  class="tag-chip ${selectedSet.has(genre.name) ? "selected" : ""}"
                  data-club-genre="${escapeHtml(genre.name)}"
                >
                  ${escapeHtml(genre.name)}
                </button>
              `)
              .join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function bindGenrePicker(dialog, id = "clubGenrePicker") {
  const picker = $(`#${id}`, dialog);

  if (!picker) return;

  const rerender = () => {
    const selected = $$("[data-club-genre].selected", picker).map(
      button => button.dataset.clubGenre
    );

    const holder = picker.parentElement;

    picker.outerHTML = genrePickerMarkup(
      selected,
      id,
      picker.classList.contains("compact-picker")
    );

    bindGenrePicker(dialog, id);
  };

  $$("[data-club-genre]", picker).forEach(button => {
    button.onclick = () => {
      button.classList.toggle("selected");
      rerender();
    };
  });

  $$("[data-genre-group]", picker).forEach(box => {
    box.onchange = () => {
      const groupGenres = GENRES
        .filter(genre => genre.kind === box.dataset.genreGroup)
        .map(genre => genre.name);

      $$("[data-club-genre]", picker).forEach(button => {
        if (groupGenres.includes(button.dataset.clubGenre)) {
          button.classList.toggle("selected", box.checked);
        }
      });

      rerender();
    };
  });
}

function selectedClubGenres(dialog, id = "clubGenrePicker") {
  return $$(`#${id} [data-club-genre].selected`, dialog).map(
    button => button.dataset.clubGenre
  );
}

async function openClubDialog() {
  const plan = activeTier();
  const { count, error: countError } = await sb
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id);

  if (!countError && Number.isFinite(plan.clubLimit) && (count || 0) >= plan.clubLimit) {
    openPaywall({
      reason: `${plan.name} includes ${plan.clubLimit} club${plan.clubLimit === 1 ? "" : "s"}. Choose a new chapter to create another.`,
      requiredTier: plan.id === "first_chapter" ? "story_spinner" : plan.id === "story_spinner" ? "shelf_enchanter" : "library_legend"
    });
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="clubDialog">
      <form class="dialog-card wide-dialog" id="clubForm">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">Start a new chapter</p>
        <h2>Create your book club</h2>

        <label class="field-label">Club name</label>
        <input
          id="clubName"
          maxlength="80"
          required
          placeholder="Example: Midnight Margins"
        >

        <label class="field-label field-label-spaced">
          A little about your club
        </label>

        <textarea
          id="clubDescription"
          maxlength="300"
          placeholder="Fantasy obsessed? Romance-first? A little chaotic?"
        ></textarea>

        <p class="field-label field-label-spaced">Choose your club shelves</p>

        <p class="field-help">
          Pick Fiction, Nonfiction, or both, then fine-tune the genres below.
          You can change this later in Club settings.
        </p>

        ${genrePickerMarkup(ALL_GENRE_NAMES)}

        <label class="toggle-line">
          <input type="checkbox" id="clubPublic">
          Let readers discover this club publicly
        </label>

        <button class="primary-button full-button" type="submit">
          Create our club
        </button>
      </form>
    </dialog>
    `
  );

  const dialog = $("#clubDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  bindGenrePicker(dialog);

  $("#clubForm", dialog).onsubmit = async event => {
    event.preventDefault();

    const enabled_genres = selectedClubGenres(dialog);

    if (!enabled_genres.length) {
      return alert("Choose at least one genre for your club.");
    }

    const payload = {
      name: $("#clubName", dialog).value.trim(),
      description: $("#clubDescription", dialog).value.trim(),
      is_public: $("#clubPublic", dialog).checked,
      enabled_genres,
      created_by: user.id
    };

    const { data, error } = await sb
      .from("clubs")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (String(error.message).includes("SUBSCRIPTION_LIMIT")) {
        dialog.close();
        openPaywall({ reason: "Your current plan has reached its club limit." });
        return;
      }
      return alert(error.message);
    }

    localStorage.setItem(clubKey, data.id);

    location.href = appUrl("genres.html", {
      club: data.id
    });
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function openJoinDialog() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="joinDialog">
      <form class="dialog-card" id="joinForm">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">An invitation awaits</p>
        <h2>Join a private club</h2>

        <label class="field-label">Invite code</label>
        <input
          id="inviteCode"
          maxlength="8"
          required
          placeholder="Example: A1B2C3D4"
          autocapitalize="characters"
        >

        <button class="primary-button full-button" type="submit">
          Open the door
        </button>
      </form>
    </dialog>
    `
  );

  const dialog = $("#joinDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  $("#joinForm", dialog).onsubmit = async event => {
    event.preventDefault();

    const { data, error } = await sb.rpc("join_club_by_code", {
      code: $("#inviteCode", dialog).value
    });

    if (error) {
      return alert(error.message);
    }

    localStorage.setItem(clubKey, data);

    location.href = appUrl("genres.html", {
      club: data
    });
  };

  dialog.addEventListener("close", () => dialog.remove());
}

async function joinPublic(clubId) {
  const clubResult = await sb
    .from("clubs")
    .select("invite_code")
    .eq("id", clubId)
    .single();

  const { data, error } = await sb.rpc("join_club_by_code", {
    code: clubResult.data?.invite_code
  });

  if (error) {
    return alert(error.message);
  }

  localStorage.setItem(clubKey, data);

  location.href = appUrl("genres.html", {
    club: data
  });
}

async function loadClubBooks() {
  const { data, error } = await sb
    .from("club_books")
    .select("*")
    .eq("club_id", currentClub.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  clubBooks = data || [];

  return clubBooks;
}

function topBar(title, subtitle = "", actionMarkup = "") {
  return `
    <section class="club-topbar glass-panel ${route === "genres" ? "" : "subgenre-topbar"}">
      <div>
        <p class="eyebrow">${escapeHtml(currentClub.name)}</p>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${actionMarkup ? `<div class="subgenre-topbar-action">${actionMarkup}</div>` : ""}
    </section>
  `;
}

function bindClubTools() {
  $("#clubTools")?.addEventListener("click", openClubTools);
}

function enabledGenres() {
  const saved = currentClub?.enabled_genres;

  return Array.isArray(saved) && saved.length
    ? saved
    : ALL_GENRE_NAMES;
}

function openClubTools() {
  const canEdit = isAdmin();
  const currentGenres = enabledGenres();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="toolsDialog">
      <div class="dialog-card wide-dialog">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">${escapeHtml(currentClub.name)}</p>
        <h2>Club settings</h2>

        <p class="field-help">Invite friends with this code:</p>
        <div class="invite-code">${escapeHtml(currentClub.invite_code)}</div>

        <p class="field-help">
          ${
            currentClub.is_public
              ? "This club is public and appears in Discover."
              : "This club is private; only invited members can see it."
          }
        </p>

        ${
          canEdit
            ? `
              <label class="toggle-line">
                <input
                  id="toggleVisibility"
                  type="checkbox"
                  ${currentClub.is_public ? "checked" : ""}
                >
                Make this club public
              </label>

              <p class="field-label field-label-spaced">Genre shelves</p>

              <p class="field-help">
                Choose the shelves this club uses.
                Books can live on more than one selected shelf.
              </p>

              ${genrePickerMarkup(currentGenres, "settingsGenrePicker", true)}

              <div class="settings-import-card">
                <div>
                  <p class="field-label">Goodreads library</p>
                  <p class="field-help">Bring in a Goodreads CSV from the place where you manage your club.</p>
                </div>
                <button id="openSettingsGoodreads" class="secondary-button" type="button">${clubIncludesTier("story_spinner") ? "Import Goodreads" : "✦ Unlock imports"}</button>
              </div>

              <button id="saveClubSettings" class="primary-button full-button">
                Save club settings
              </button>
            `
            : `
              <p class="field-help">
                Only the club owner or an admin can change club visibility and genre shelves.
              </p>
            `
        }
      </div>
    </dialog>
    `
  );

  const dialog = $("#toolsDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  if (canEdit) {
    bindGenrePicker(dialog, "settingsGenrePicker");
  }

  $("#openSettingsGoodreads", dialog)?.addEventListener("click", () => {
    if (!clubIncludesTier("story_spinner")) {
      dialog.close();
      openPaywall({ reason: "Goodreads importing begins with Story Spinner.", requiredTier: "story_spinner" });
      return;
    }
    openGoodreadsImport();
  });

  $("#saveClubSettings", dialog)?.addEventListener("click", async () => {
    const enabled_genres = selectedClubGenres(dialog, "settingsGenrePicker");

    if (!enabled_genres.length) {
      return alert("Keep at least one genre shelf selected.");
    }

    const is_public = $("#toggleVisibility", dialog).checked;

    const { error } = await sb
      .from("clubs")
      .update({
        is_public,
        enabled_genres
      })
      .eq("id", currentClub.id);

    if (error) {
      return alert(error.message);
    }

    currentClub.is_public = is_public;
    currentClub.enabled_genres = enabled_genres;

    dialog.close();

    if (route === "genres") {
      renderGenreWheel();
    }

    if (route === "genre") {
      renderBookWheel();
    }
  });

  dialog.addEventListener("close", () => dialog.remove());
}

/* =========================================================
   BOOKSHELF GENRE PAGE
   ========================================================= */

async function renderGenreWheel() {
  await loadClubBooks();

  const reading = clubBooks.find(book => book.status === "reading");
  const genres = GENRES.filter(genre => enabledGenres().includes(genre.name));

  const shelfBook = (genre, index) => {
    const height = 152 + ((index * 19) % 58);
    const width = 43 + ((index * 13) % 20);
    const lean = [-3, 0, 2, -1, 4, 0][index % 6];
    const spineDesigns = {
      romance: "♡", fantasy: "♕", scifi: "⌁", mystery: "⌕", thriller: "⚠",
      horror: "☾", historical: "✒", adventure: "⌖", dystopian: "◆", ya: "✿",
      manga: "⚡", memoir: "❦", history: "⌛", selfhelp: "☀", truecrime: "⚖", essays: "✦"
    };
    const ornament = spineDesigns[genre.theme] || "✦";

    return `
      <button class="shelf-genre-book theme-${genre.theme}" data-genre-book="${genre.slug}"
        style="--book-h:${height}px;--book-w:${width}px;--book-lean:${lean}deg;--book-order:${index};"
        aria-label="Open ${escapeHtml(genre.name)} shelf">
        <span class="book-spine-top" aria-hidden="true">${ornament}</span>
        <span class="book-spine-title">${escapeHtml(genre.name)}</span>
        <span class="book-spine-bottom" aria-hidden="true">${ornament}</span>
      </button>`;
  };

  const makeShelf = (kind, items, offset = 0) => !items.length ? "" : `
    <section class="bookshelf-section">
      <header class="bookshelf-section-heading">
        <p class="eyebrow">${kind}</p>
        <h2>${kind === "Fiction" ? "Stories waiting to sweep you away" : "True stories and ideas to get lost in"}</h2>
      </header>
      <div class="wooden-bookshelf" aria-label="${kind} genre bookshelf" style="--shelf-count:${items.length}">
        <div class="shelf-books">${items.map((genre, index) => shelfBook(genre, index + offset)).join("")}</div>
        <div class="shelf-plank" aria-hidden="true"></div>
      </div>
    </section>`;

  const fiction = genres.filter(genre => genre.kind === "Fiction");
  const nonfiction = genres.filter(genre => genre.kind === "Nonfiction");

  $("#app").innerHTML = `
    ${currentAdventureMarkup(reading)}

    <section class="genre-library glass-panel">
      <div class="genre-library-intro">
        <p class="eyebrow">The Spines &amp; Spins stacks</p>
        <h2>Press the golden book to choose your next genre.</h2>
        <button class="genre-spin-book" id="spinGenreShelf" aria-label="Spin for a genre"><span>✦</span><strong>Spin</strong><small>for a genre</small></button>
      </div>
      <div class="bookshelf-wall">${makeShelf("Fiction", fiction, 0)}${makeShelf("Nonfiction", nonfiction, fiction.length)}</div>
    </section>

    <section class="library-actions glass-panel">
      <div class="library-actions-copy">
        <p class="eyebrow">Build your club library</p>
        <h2>Add your next obsession</h2>
      </div>
      <div class="library-actions-buttons">
        <button id="openLibraryBookEntry" class="primary-button">Add a book</button>
        <button id="openAllLibraryBooks" class="secondary-button">Manage library</button>
      </div>
    </section>`;

  $("#openLibraryBookEntry")?.addEventListener("click", openBookDialog);
  $("#openAllLibraryBooks")?.addEventListener("click", openAllLibraryDialog);
  if (reading) {
    hydrateMemberProgress(reading);
    hydrateCurrentAdventureUnread(reading);
  }
  $("#openAdventureRoom")?.addEventListener("click", () => {
    markAdventureMessagesSeen(reading.id);
    location.href = appUrl("book.html", { book: reading.id });
  });
  $("#currentAdventure")?.addEventListener("click", event => {
    if (!event.target.closest("button, a")) {
      markAdventureMessagesSeen(reading.id);
      location.href = appUrl("book.html", { book: reading.id });
    }
  });

  $$('[data-genre-book]').forEach(book => {
    book.addEventListener("click", () => {
      if (spinning) return;
      book.classList.add("selected-open");
      setTimeout(() => location.href = appUrl("genre.html", { genre: book.dataset.genreBook }), 450);
    });
  });
  $("#spinGenreShelf")?.addEventListener("click", () => spinGenreShelf(genres));
}

function currentAdventureMarkup(book) {
  if (!book) {
    return `
      <section class="current-adventure glass-panel current-adventure-empty">
        <div><p class="eyebrow">Current adventure</p><h1>Nothing is being read just yet.</h1><p>Spin a genre shelf and choose a book when your club is ready to begin its next adventure.</p></div>
      </section>`;
  }

  return `
    <section class="current-adventure glass-panel" id="currentAdventure">
      <div class="current-adventure-cover">${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="">` : `<div class="cover-placeholder">✦</div>`}</div>
      <div class="current-adventure-copy">
        <p class="eyebrow">Current adventure</p>
        <h1>${escapeHtml(book.title)}</h1>
        <p>${escapeHtml((book.authors || []).join(", ") || "A Spines & Spins selection")}</p>
        <div class="current-adventure-actions">
          <button class="primary-button" id="openAdventureRoom">Open reading room</button>
        </div>
        <p class="unread-message-note" id="currentAdventureUnread" hidden></p>
      </div>
      <div class="member-progress" id="memberProgress"><p class="field-help">Loading member updates…</p></div>
    </section>`;
}

function messageSeenKey(bookId) {
  return `bookishBabesSeenMessages:${currentClub?.id || "club"}:${user?.id || "user"}:${bookId}`;
}

function markAdventureMessagesSeen(bookId) {
  if (!bookId) return;
  localStorage.setItem(messageSeenKey(bookId), new Date().toISOString());
}

async function hydrateCurrentAdventureUnread(book) {
  const target = $("#currentAdventureUnread");
  if (!target || !book?.id) return;

  const seenAt = localStorage.getItem(messageSeenKey(book.id)) || book.selected_at || "1970-01-01T00:00:00.000Z";
  const { data: chapterRows, error } = await sb
    .from("book_chapters")
    .select("id")
    .eq("book_id", book.id);
  if (error || !chapterRows?.length) return;

  const chapterIds = chapterRows.map(chapter => chapter.id);
  const { count, error: countError } = await sb
    .from("chapter_messages")
    .select("id", { count: "exact", head: true })
    .in("chapter_id", chapterIds)
    .neq("author_id", user.id)
    .gt("created_at", seenAt);
  if (countError || !count) return;

  target.hidden = false;
  target.textContent = `✦ ${count} new group message${count === 1 ? "" : "s"} waiting in the reading room`;
}

function spinGenreShelf(genres) {
  if (spinning || !genres.length) return;

  spinning = true;

  const books = $$("[data-genre-book]");
  const target = genres[Math.floor(Math.random() * genres.length)];

  const targetBook = books.find(
    book => book.dataset.genreBook === target.slug
  );

  const spinButton = $("#spinGenreShelf");

  spinButton?.classList.add("is-spinning");

  setStatus("The shelves are whispering... ✦");

  let tick = 0;
  const rounds = 26 + Math.floor(Math.random() * 10);

  const flash = () => {
    books.forEach(book => book.classList.remove("is-lit"));

    books[tick % books.length]?.classList.add("is-lit");

    tick += 1;

    if (tick < rounds) {
      setTimeout(flash, 65 + tick * 9);
      return;
    }

    books.forEach(book => book.classList.remove("is-lit"));

    targetBook?.classList.add("is-chosen", "selected-open");

    setStatus(
      `${target.name} has been chosen. Opening its shelf...`,
      "success"
    );

    setTimeout(() => {
      location.href = appUrl("genre.html", {
        genre: target.slug
      });
    }, 900);
  };

  flash();
}

function featuredBook(book) {
  return `
    <a class="featured-book glass-panel" href="${appUrl("book.html", {
      book: book.id
    })}">
      <div>
        ${
          book.cover_url
            ? `<img src="${escapeHtml(book.cover_url)}" alt="">`
            : `<div class="cover-placeholder">✦</div>`
        }
      </div>

      <div>
        <p class="eyebrow">Book of the month</p>
        <h2>${escapeHtml(book.title)}</h2>

        <p>
          ${escapeHtml(
            (book.authors || []).join(", ") ||
            "Your club's current adventure"
          )}
        </p>

        <span class="primary-button small-button">Open reading room</span>
      </div>
    </a>
  `;
}


async function getBookUpdates(bookId) {
  const response = await sb
    .from("book_member_updates")
    .select("user_id,outcome,rating,trigger_warning,updated_at")
    .eq("book_id", bookId)
    .order("updated_at", { ascending: false });

  if (response.error) {
    console.warn("Could not load reading updates:", response.error.message);
    return [];
  }

  const updates = response.data || [];
  const ids = [...new Set(updates.map(update => update.user_id))];
  if (!ids.length) return updates;
  const { data: profiles } = await sb.from("profiles").select("id,display_name").in("id", ids);
  const names = new Map((profiles || []).map(profile => [profile.id, profile.display_name]));
  return updates.map(update => ({ ...update, display_name: names.get(update.user_id) || "Bookish Reader" }));
}

function heartRating(rating = 0, interactive = false) {
  return Array.from({ length: 5 }, (_, index) => {
    const filled = index < Number(rating || 0);
    return interactive
      ? `<button type="button" class="heart-button ${filled ? "is-filled" : ""}" data-heart="${index + 1}" aria-label="${index + 1} hearts">♥</button>`
      : `<span class="heart ${filled ? "is-filled" : ""}">♥</span>`;
  }).join("");
}

function chapterMessageCount(chapter) {
  return Number(
    chapter?.chapter_message_count ??
    chapter?.chapter_messages?.[0]?.count ??
    0
  );
}

function bookTheme(book) {
  const primaryGenre = (book?.genres || []).find(name => GENRES.some(genre => genre.name === name));
  return GENRES.find(genre => genre.name === primaryGenre)?.theme || "romantasy";
}

function applyBookTheme(book) {
  const theme = bookTheme(book);
  [...document.body.classList]
    .filter(className => className.startsWith("theme-"))
    .forEach(className => document.body.classList.remove(className));
  document.body.classList.add(`theme-${theme}`);
  return theme;
}

function groupReadingSummaryMarkup(updates, chapters) {
  const completed = updates.filter(update => update.outcome === "finished").length;
  const dnf = updates.filter(update => update.outcome === "dnf").length;
  const ratings = updates.map(update => Number(update.rating || 0)).filter(Boolean);
  const average = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : null;
  const warnings = updates.filter(update => update.trigger_warning);
  const busiest = (chapters || []).reduce((leading, chapter) => {
    const messages = chapterMessageCount(chapter);
    const leaderMessages = chapterMessageCount(leading);
    return messages > leaderMessages ? chapter : leading;
  }, null);
  const busiestCount = chapterMessageCount(busiest);

  return `
    <section class="group-reading-summary glass-panel" id="groupReadingSummary">
      <div class="group-reading-summary-copy">
        <p class="eyebrow">Group reading updates</p>
        <h2>How the adventure landed</h2>
        <p>Everyone's saved finish, DNF, and heart ratings live together here.</p>
      </div>
      <div class="group-summary-grid">
        <div class="summary-stat"><strong>${completed}</strong><span>finished</span></div>
        <div class="summary-stat"><strong>${dnf}</strong><span>did not finish</span></div>
        <div class="summary-stat"><strong>${average || "—"}</strong><span>average hearts</span></div>
      </div>
      <div class="group-summary-details">
        <div>
          <p class="summary-label">Club feeling</p>
          <div class="summary-hearts">${average ? heartRating(Math.round(Number(average))) : `<span class="empty-note">No ratings yet</span>`}</div>
        </div>
        <div>
          <p class="summary-label">Noisiest chapter</p>
          <strong>${busiestCount ? escapeHtml(busiest.chapter_title || `Chapter ${busiest.chapter_number}`) : "No chapter notes yet"}</strong>
          <span>${busiestCount ? `${busiestCount} group note${busiestCount === 1 ? "" : "s"}` : "The conversations will show up here."}</span>
        </div>
        <div>
          <p class="summary-label">Trigger-warning flags</p>
          <strong>${warnings.length ? warnings.map(update => escapeHtml(update.display_name || "Bookish Reader")).join(", ") : "None flagged"}</strong>
          <span>${warnings.length ? `${warnings.length} reader${warnings.length === 1 ? "" : "s"} flagged a possible TW.` : ""}</span>
        </div>
      </div>
      <div class="group-member-updates">
        ${updates.length ? updates.map(update => `<article class="member-update-row"><div><strong>${escapeHtml(update.display_name || "Bookish Reader")}</strong><span>${update.outcome === "finished" ? "Finished reading" : update.outcome === "dnf" ? "Did not finish" : "Shared a rating"}</span></div><div class="mini-hearts">${update.rating ? heartRating(update.rating) : ""}</div>${update.trigger_warning ? `<span class="tw-badge">TW</span>` : ""}</article>`).join("") : `<p class="empty-note">No group updates have been saved yet.</p>`}
      </div>
    </section>`;
}

async function hydrateMemberProgress(book) {
  const holder = $("#memberProgress");
  if (!holder) return;

  const updates = await getBookUpdates(book.id);
  const completed = updates.filter(update => update.outcome === "finished").length;
  const dnf = updates.filter(update => update.outcome === "dnf").length;
  const warnings = updates.filter(update => update.trigger_warning).length;

  holder.innerHTML = `
    <p class="eyebrow">Reader check-in</p>
    <div class="progress-summary">
      <div class="progress-stat"><strong>${completed}</strong><span>finished</span></div>
      <div class="progress-stat"><strong>${dnf}</strong><span>DNF</span></div>
      <div class="progress-stat"><strong>${warnings}</strong><span>TW flags</span></div>
    </div>
    <div class="member-update-list">
      ${updates.length ? updates.map(update => {
        const name = update.display_name || "Bookish Reader";
        return `<article class="member-update-row">
          <div><strong>${escapeHtml(name)}</strong><span>${update.outcome === "finished" ? "Finished" : update.outcome === "dnf" ? "DNF" : "Reading"}</span></div>
          <div class="mini-hearts">${update.rating ? heartRating(update.rating) : ""}</div>
          ${update.trigger_warning ? `<span class="tw-badge">TW</span>` : ""}
        </article>`;
      }).join("") : `<p class="empty-note">No reading updates yet. Be the first to share how the adventure is going.</p>`}
    </div>`;
}

function openReadingUpdateDialog(book) {
  if (!book) return;
  location.href = appUrl("book.html", { book: book.id });
}

function prettyConfirm({ eyebrow = "One more thing", title, message, confirmLabel = "Continue", danger = false }) {
  return new Promise(resolve => {
    const id = `prettyConfirm${Date.now()}`;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog class="book-dialog confirm-dialog" id="${id}">
        <div class="dialog-card confirmation-card">
          <button class="dialog-close" type="button" aria-label="Close">×</button>
          <div class="confirmation-orb" aria-hidden="true">${danger ? "!" : "✦"}</div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h2>${escapeHtml(title)}</h2>
          <p class="field-help">${escapeHtml(message)}</p>
          <div class="confirmation-actions">
            <button class="secondary-button" type="button" data-confirm-cancel>Keep it</button>
            <button class="${danger ? "danger-button secondary-button" : "primary-button"}" type="button" data-confirm-accept>${escapeHtml(confirmLabel)}</button>
          </div>
        </div>
      </dialog>`);

    const dialog = document.getElementById(id);
    let answered = false;
    const finish = value => {
      if (answered) return;
      answered = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    dialog.showModal();
    $(".dialog-close", dialog).onclick = () => finish(false);
    $("[data-confirm-cancel]", dialog).onclick = () => finish(false);
    $("[data-confirm-accept]", dialog).onclick = () => finish(true);
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
  });
}

function libraryStatusLabel(book) {
  if (book.status === "reading") return "Current adventure";
  if (book.status === "finished") return "Finished adventure";
  return "Waiting on the wheel";
}

async function updateMyLibraryTW(book, triggerWarning) {
  const { data: existing, error: existingError } = await sb
    .from("book_member_updates")
    .select("outcome,rating,note")
    .eq("book_id", book.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) return { error: existingError };

  return sb.from("book_member_updates").upsert({
    book_id: book.id,
    user_id: user.id,
    outcome: existing?.outcome || null,
    rating: Number(existing?.rating || 0) || null,
    note: existing?.note || null,
    trigger_warning: triggerWarning,
    updated_at: new Date().toISOString()
  }, { onConflict: "book_id,user_id" });
}

async function openAllLibraryDialog() {
  await loadClubBooks();
  const ids = clubBooks.map(book => book.id);
  const { data: myUpdates = [] } = ids.length
    ? await sb.from("book_member_updates").select("book_id,trigger_warning").eq("user_id", user.id).in("book_id", ids)
    : { data: [] };
  const twFlags = new Set(myUpdates.filter(update => update.trigger_warning).map(update => update.book_id));

  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="allLibraryDialog">
      <div class="dialog-card wide-dialog all-library-dialog">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">${escapeHtml(currentClub.name)} stacks</p>
        <h2>Your whole club library</h2>
        ${isAdmin() ? `<div class="library-manager-tools"><button id="autoSortLibraryGenres" class="secondary-button" type="button">Find missing genres with book lookup</button><span>Great for Goodreads imports that landed on the default shelf.</span></div>` : ""}
        <label class="library-search"><span aria-hidden="true">⌕</span><input id="allLibrarySearch" type="search" placeholder="Search title, author, or genre"></label>
        <div class="library-count" id="allLibraryCount"></div>
        <div class="all-library-list" id="allLibraryList"></div>
      </div>
    </dialog>`);

  const dialog = $("#allLibraryDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  const list = $("#allLibraryList", dialog);
  const count = $("#allLibraryCount", dialog);

  const render = (query = "") => {
    const needle = query.trim().toLowerCase();
    const shown = clubBooks.filter(book => `${book.title} ${(book.authors || []).join(" ")} ${(book.genres || []).join(" ")}`.toLowerCase().includes(needle));
    count.textContent = `${shown.length} of ${clubBooks.length} book${clubBooks.length === 1 ? "" : "s"}`;
    list.innerHTML = shown.length ? shown.map(book => `
      <article class="all-library-row" data-library-book="${book.id}">
        ${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="">` : `<div class="cover-placeholder">✦</div>`}
        <div class="all-library-copy">
          <div class="all-library-titleline"><strong>${escapeHtml(book.title)}</strong>${twFlags.has(book.id) ? `<span class="tw-badge">TW</span>` : ""}</div>
          <span>${escapeHtml((book.authors || []).join(", ") || "Unknown author")}</span>
          <small>${escapeHtml(libraryStatusLabel(book))} · ${(book.genres || []).map(escapeHtml).join(" · ") || "No genre yet"}</small>
        </div>
        <div class="all-library-actions">
          <a class="secondary-button small-button" href="${appUrl("book.html", { book: book.id })}">Open</a>
          ${isAdmin() ? `<button class="text-button library-tw-button ${twFlags.has(book.id) ? "is-flagged" : ""}" type="button" data-library-tw="${book.id}">${twFlags.has(book.id) ? "Remove TW" : "Add TW"}</button>` : ""}
          ${isAdmin() ? `<button class="text-button delete-book" type="button" data-library-delete="${book.id}">Remove</button>` : ""}
        </div>
      </article>`).join("") : `<p class="empty-note">No books match that search yet.</p>`;

    $$('[data-library-tw]', list).forEach(button => button.onclick = async () => {
      const book = clubBooks.find(item => item.id === button.dataset.libraryTw);
      if (!book) return;
      const newFlag = !twFlags.has(book.id);
      button.disabled = true;
      const { error } = await updateMyLibraryTW(book, newFlag);
      button.disabled = false;
      if (error) return alert(error.message);
      if (newFlag) twFlags.add(book.id); else twFlags.delete(book.id);
      render($("#allLibrarySearch", dialog).value);
    });

    $$('[data-library-delete]', list).forEach(button => button.onclick = async () => {
      const book = clubBooks.find(item => item.id === button.dataset.libraryDelete);
      if (!book) return;
      const confirmed = await prettyConfirm({
        eyebrow: "Library tidy-up",
        title: `Remove ${book.title}?`,
        message: book.status === "reading" ? "This will remove the current adventure and permanently clear its reading updates, ratings, trigger flags, and chapter messages." : "This book will be removed from the club library. This cannot be undone.",
        confirmLabel: "Remove book",
        danger: true
      });
      if (!confirmed) return;
      if (book.status === "reading") {
        const cleanupError = await clearAdventureActivity(book);
        if (cleanupError) return alert(cleanupError.message);
      }
      const { error } = await sb.from("club_books").delete().eq("id", book.id).eq("club_id", currentClub.id);
      if (error) return alert(error.message);
      clubBooks = clubBooks.filter(item => item.id !== book.id);
      twFlags.delete(book.id);
      render($("#allLibrarySearch", dialog).value);
    });
  };

  render();
  $("#allLibrarySearch", dialog).addEventListener("input", event => render(event.target.value));
  $("#autoSortLibraryGenres", dialog)?.addEventListener("click", async event => {
    const defaultGenre = enabledGenres()[0];
    // Goodreads imports often place every title on the first enabled shelf. We also
    // include genuinely untagged books. Existing intentional multi-genre choices
    // are never changed by this bulk helper.
    const candidates = clubBooks.filter(book => {
      const genres = Array.isArray(book.genres) ? book.genres.filter(Boolean) : [];
      return !genres.length || (genres.length === 1 && genres[0] === defaultGenre);
    });
    if (!candidates.length) return alert("There are no untagged or default-shelf books to check.");
    const confirmed = await prettyConfirm({
      eyebrow: "A little shelf magic",
      title: `Check ${candidates.length} book${candidates.length === 1 ? "" : "s"} with book lookup?`,
      message: "Google Books checks first, then Open Library fills in missing descriptions or richer subject tags. It will save confident shelves, covers, and descriptions; books without a clear match stay unchanged.",
      confirmLabel: "Check books"
    });
    if (!confirmed) return;
    event.target.disabled = true;
    event.target.textContent = "Checking books…";
    let genreUpdates = 0;
    let detailUpdates = 0;
    let noMatch = 0;
    for (let index = 0; index < candidates.length; index += 1) {
      const book = candidates[index];
      event.target.textContent = `Checking ${index + 1} of ${candidates.length}…`;
      try {
        // Search the title first. Goodreads author fields are often abbreviated
        // (or contain extra collaborators), which made the old combined lookup
        // miss valid Google results for every book in a bulk import.
        let payload = await getGoogleBooks(bookTitleLookupQuery(book), { maxResults: 10 });
        let found = chooseBestGoogleMatch(payload.items || [], book);

        // Keep the author/ISBN query as a second chance for titles Google treats
        // as too broad or for books with an ISBN in the imported data.
        if (!found) {
          payload = await getGoogleBooks(bookLookupQuery(book), { maxResults: 10 });
          found = chooseBestGoogleMatch(payload.items || [], book);
        }
        let metadata = found ? normalizeGoogleBook(found, { includeLooseSuggestions: true }) : {};
        // If Google has no usable match, Open Library gets a chance to identify
        // the title by ISBN/title before we leave the library entry untouched.
        metadata = await addOpenLibraryBackup(metadata, book, { always: !found });
        if (!metadata?.title || metadata.title === "Untitled") { noMatch += 1; continue; }
        const matchedGenres = metadata.genres.filter(genre => enabledGenres().includes(genre));
        const originalGenres = Array.isArray(book.genres) ? book.genres.filter(Boolean) : [];
        const shouldReplaceDefault = !originalGenres.length || (originalGenres.length === 1 && originalGenres[0] === defaultGenre);
        const nextGenres = matchedGenres.length && shouldReplaceDefault ? matchedGenres : originalGenres;
        const updates = metadataPatch(book, metadata, { genres: nextGenres });
        if (!Object.keys(updates).length) continue;
        const { error } = await sb.from("club_books").update(updates).eq("id", book.id).eq("club_id", currentClub.id);
        if (error) throw error;
        const genreChanged = JSON.stringify(originalGenres) !== JSON.stringify(nextGenres);
        if (genreChanged) genreUpdates += 1;
        if (Object.keys(updates).some(key => key !== "genres")) detailUpdates += 1;
        Object.assign(book, updates);
      } catch (error) {
        noMatch += 1;
        console.warn(`Could not update book details for ${book.title}:`, error);
      }
      // Avoid sending a burst of requests that can make Google reject a whole import.
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    event.target.disabled = false;
    event.target.textContent = "Find missing genres with book lookup";
    render($("#allLibrarySearch", dialog).value);
    alert(`✨ Updated genres for ${genreUpdates} book${genreUpdates === 1 ? "" : "s"} and saved cover/details for ${detailUpdates} book${detailUpdates === 1 ? "" : "s"}.${noMatch ? ` ${noMatch} book${noMatch === 1 ? "" : "s"} did not have a confident Google match and were left alone.` : ""}`);
  });
  dialog.addEventListener("close", () => dialog.remove());
}

async function openGenreLibraryDialog(genre) {
  const books = clubBooks.filter(book => (book.genres || []).includes(genre.name));
  const ids = books.map(book => book.id);
  const { data: myUpdates = [] } = ids.length
    ? await sb.from("book_member_updates").select("book_id,trigger_warning").eq("user_id", user.id).in("book_id", ids)
    : { data: [] };
  const twFlags = new Set(myUpdates.filter(update => update.trigger_warning).map(update => update.book_id));

  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="genreLibraryDialog">
      <div class="dialog-card wide-dialog genre-library-dialog">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">${escapeHtml(genre.name)} shelf</p>
        <h2>${escapeHtml(genre.name)} library</h2>
        <div class="shelf-library-list">${books.length ? books.map(book => `
          <article class="shelf-library-row" data-shelf-book="${book.id}">
            ${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="">` : `<div class="cover-placeholder">✦</div>`}
            <div class="shelf-library-copy">
              <div class="shelf-library-titleline"><strong>${escapeHtml(book.title)}</strong>${twFlags.has(book.id) ? `<span class="tw-badge">TW</span>` : ""}</div>
              <span>${escapeHtml((book.authors || []).join(", ") || "Unknown author")}</span>
              <small>${escapeHtml(libraryStatusLabel(book))}</small>
            </div>
            <div class="shelf-library-actions">
              <a class="secondary-button small-button" href="${appUrl("book.html", { book: book.id })}">Open</a>
              ${isAdmin() ? `<button class="text-button library-tw-button ${twFlags.has(book.id) ? "is-flagged" : ""}" type="button" data-shelf-tw="${book.id}">${twFlags.has(book.id) ? "Remove TW" : "Add TW"}</button>` : ""}
              ${isOwner() && book.status === "reading" ? `<button class="text-button return-adventure" type="button" data-return-adventure="${book.id}">Back to shelf</button>` : ""}
              ${isAdmin() ? `<button class="text-button delete-book" type="button" data-delete-book="${book.id}">${book.status === "reading" ? "Remove from library" : "Remove"}</button>` : ""}
            </div>
          </article>`).join("") : `<p class="empty-note">No books have been added to this shelf yet.</p>`}</div>
      </div>
    </dialog>`);
  const dialog = $("#genreLibraryDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  $$('[data-shelf-tw]', dialog).forEach(button => button.onclick = async () => {
    const book = clubBooks.find(item => item.id === button.dataset.shelfTw);
    if (!book) return;
    const newFlag = !twFlags.has(book.id);
    button.disabled = true;
    const { error } = await updateMyLibraryTW(book, newFlag);
    button.disabled = false;
    if (error) return alert(error.message);
    if (newFlag) twFlags.add(book.id); else twFlags.delete(book.id);
    button.classList.toggle("is-flagged", newFlag);
    button.textContent = newFlag ? "Remove TW" : "Add TW";
    const titleline = button.closest(".shelf-library-row")?.querySelector(".shelf-library-titleline");
    titleline?.querySelector(".tw-badge")?.remove();
    if (newFlag) titleline?.insertAdjacentHTML("beforeend", `<span class="tw-badge">TW</span>`);
  });
  $$('[data-return-adventure]', dialog).forEach(button => button.onclick = async () => {
    const book = clubBooks.find(item => item.id === button.dataset.returnAdventure);
    if (!book) return;
    const confirmed = await prettyConfirm({ eyebrow: "Back to the shelf", title: `Return ${book.title}?`, message: "This will permanently clear every member’s reading update, trigger warning, heart rating, and chapter comments for this adventure.", confirmLabel: "Return to shelf", danger: true });
    if (!confirmed) return;
    const cleanupError = await clearAdventureActivity(book);
    if (cleanupError) return alert(cleanupError.message);
    const { error } = await sb.from("club_books")
      .update({ status: "wheel", selected_at: null, finished_at: null })
      .eq("id", book.id).eq("club_id", currentClub.id);
    if (error) return alert(error.message);
    book.status = "wheel";
    const statusLabel = button.closest(".shelf-library-row")?.querySelector("small");
    if (statusLabel) statusLabel.textContent = "On the wheel";
    button.remove();
  });
  $$('[data-delete-book]', dialog).forEach(button => button.onclick = async () => {
    const book = clubBooks.find(item => item.id === button.dataset.deleteBook);
    if (!book) return;
    const confirmed = await prettyConfirm({ eyebrow: "Library tidy-up", title: `Remove ${book.title}?`, message: "This book will be removed from the club library. This cannot be undone.", confirmLabel: "Remove book", danger: true });
    if (!confirmed) return;
    const { error } = await sb.from("club_books").delete().eq("id", book.id).eq("club_id", currentClub.id);
    if (error) return alert(error.message);
    button.closest(".shelf-library-row")?.remove();
    clubBooks = clubBooks.filter(item => item.id !== book.id);
  });
  dialog.addEventListener("close", () => dialog.remove());
}

async function renderBookWheel() {
  const genre = genreForSlug(getParam("genre"));
  if (!enabledGenres().includes(genre.name)) return location.href = appUrl("genres.html");

  document.body.classList.add(`theme-${genre.theme}`);
  await loadClubBooks();

  const onWheel = clubBooks.filter(book => book.status === "wheel" && (book.genres || []).includes(genre.name));
  const finished = clubBooks.filter(book => book.status === "finished" && (book.genres || []).includes(genre.name));

  $("#app").innerHTML = `
    ${topBar(
      genre.name,
      "",
      `<button class="secondary-button subgenre-library-button" id="openShelfLibrary">View all ${escapeHtml(genre.name)} books <span aria-hidden="true">↗</span></button>`
    )}
    <main class="genre-room">
      <div class="mood-layer" id="moodLayer"></div>
      <section class="stage-card magical-wheel-card ${onWheel.length ? "wheel-ready" : "wheel-empty"}">
        <div class="wheel-wrap wheel-over-book genre-book-wheel"><div class="pointer">◆</div><canvas id="wheelCanvas" width="700" height="700"></canvas></div>
      </section>
      <section class="read-books-panel glass-selection-panel finished-below-wheel">
        <p class="selection-label">Finished adventures</p>
        <div class="read-book-list">${finished.length ? finished.map(book => `<a class="read-book-row" href="${appUrl("book.html", { book: book.id })}"><strong>${escapeHtml(book.title)}</strong><span>View book details</span></a>`).join("") : `<p class="empty-note">No finished books from this genre yet.</p>`}</div>
      </section>
    </main>`;

  makeMood(genre.theme);
  drawWheel(onWheel);
  $("#wheelCanvas").onclick = event => wheelClick(event, onWheel, genre);
  $("#openShelfLibrary")?.addEventListener("click", () => openGenreLibraryDialog(genre));
}

function makeMood(theme) {
  const layer = $("#moodLayer");

  if (!layer) return;

  // Genre pages can render more than once during navigation. Clearing the old
  // decorative nodes prevents duplicate animations from piling up on phones.
  layer.replaceChildren();

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const compactScreen = window.matchMedia?.("(max-width: 760px)").matches;
  if (reducedMotion) return;

  const icons = {
    romance: ["♡", "❀", "✦", "✿"],
    romantasy: ["✦", "♕", "⚔", "☾"],
    mystery: ["⌕", "✦", "🔑", "◌"],
    fantasy: ["✦", "☾", "♕", "♧", "🐉"],
    scifi: ["✦", "☾", "🛸", "⌁"],
    thriller: ["◉", "✦", "⚠", "†"],
    horror: ["☾", "✦", "🦇", "☠"],
    ya: ["♡", "✦", "✿", "☾"],
    dystopian: ["◼", "◆", "△"],
    adventure: ["⌖", "⚓", "✦", "⌁"],
    manga: ["✦", "✧", "♡", "⚡"],
    historical: ["✒", "❦", "⌛"],
    memoir: ["✒", "❦", "✦"],
    history: ["⌛", "✒", "✦"],
    selfhelp: ["☀", "✦", "❀"],
    truecrime: ["⌕", "⚖", "✦"],
    essays: ["✒", "✦", "❦"],
    classics: ["✒", "❦"]
  }[theme] || ["✦"];

  if (theme === "horror" || theme === "thriller") {
    layer.insertAdjacentHTML("beforeend", `
      <svg class="portal-web portal-web-left" viewBox="0 0 240 240" aria-hidden="true"><path d="M0 0H240M0 0V240M0 0C68 12 122 54 156 111C188 164 204 207 240 240M0 42C68 54 109 85 132 132C157 183 172 217 202 240M42 0C54 68 85 109 132 132C183 157 217 172 240 202M82 0C91 48 117 83 155 108C189 131 217 145 240 162M30 30Q74 73 124 116Q172 160 219 210M57 14Q97 62 144 94Q186 125 235 142"/></svg>
      <svg class="portal-web portal-web-right" viewBox="0 0 240 240" aria-hidden="true"><path d="M0 0H240M0 0V240M0 0C68 12 122 54 156 111C188 164 204 207 240 240M0 42C68 54 109 85 132 132C157 183 172 217 202 240M42 0C54 68 85 109 132 132C183 157 217 172 240 202M82 0C91 48 117 83 155 108C189 131 217 145 240 162M30 30Q74 73 124 116Q172 160 219 210M57 14Q97 62 144 94Q186 125 235 142"/></svg>
    `);
  }

  const moodCount = compactScreen
    ? (theme === "horror" ? 12 : 10)
    : (theme === "horror" ? 26 : 18);

  for (let i = 0; i < moodCount; i += 1) {
    const span = document.createElement("span");

    if (theme === "horror") {
      span.className = "blood-drop";
      span.setAttribute("aria-hidden", "true");
      span.style.left = `${Math.random() * 100}%`;
      span.style.setProperty("--drop-size", `${5 + Math.random() * 13}px`);
      span.style.setProperty("--drop-stretch", `${1.2 + Math.random() * 1.85}`);
      span.style.setProperty("--drop-drift", `${-24 + Math.random() * 48}px`);
      span.style.animationDuration = `${5 + Math.random() * 8}s`;
      span.style.animationDelay = `-${Math.random() * 9}s`;
    } else {
      span.textContent = icons[i % icons.length] || "✦";
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDuration = `${8 + Math.random() * 11}s`;
      span.style.animationDelay = `-${Math.random() * 10}s`;
      span.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    }

    layer.append(span);
  }
}

function colorWithAlpha(color, alpha) {
  const value = String(color || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    const red = parseInt(value.slice(1, 3), 16);
    const green = parseInt(value.slice(3, 5), 16);
    const blue = parseInt(value.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return value;
}

function drawWheel(items) {
  const canvas = $("#wheelCanvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const radius = width / 2;
  const outerRadius = radius - 28;
  const themeStyle = getComputedStyle(document.body);
  const themeDeep = themeStyle.getPropertyValue("--theme-deep").trim() || "#28120f";
  const themeGlow = themeStyle.getPropertyValue("--theme-glow").trim() || "#8c3c54";
  const themeAccent = themeStyle.getPropertyValue("--theme-accent").trim() || "#f5cf84";

  ctx.clearRect(0, 0, width, width);

  const drawSparkle = (x, y, size, color = "rgba(255,232,171,.86)") => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const r = i % 2 ? size * .27 : size;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  ctx.save();
  ctx.translate(radius, radius);

  const aura = ctx.createRadialGradient(0, 0, outerRadius * .32, 0, 0, outerRadius * 1.16);
  aura.addColorStop(0, colorWithAlpha(themeAccent, .16));
  aura.addColorStop(.7, colorWithAlpha(themeGlow, .12));
  aura.addColorStop(1, colorWithAlpha(themeGlow, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius * 1.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(0,0,0,.62)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = colorWithAlpha(themeDeep, .34);
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.lineWidth = 6;
  ctx.strokeStyle = colorWithAlpha(themeAccent, .86);
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius + 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = colorWithAlpha(themeGlow, .78);
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius - 9, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14 - Math.PI / 2;
    const x = Math.cos(angle) * (outerRadius + 18);
    const y = Math.sin(angle) * (outerRadius + 18);
    drawSparkle(x, y, i % 3 === 0 ? 10 : 5, i % 3 === 0 ? "rgba(255,237,184,.92)" : "rgba(255,204,108,.7)");
  }

  if (!items.length) {
    const emptyFill = ctx.createRadialGradient(-outerRadius * .3, -outerRadius * .35, 8, 0, 0, outerRadius);
    emptyFill.addColorStop(0, colorWithAlpha(themeGlow, .58));
    emptyFill.addColorStop(1, colorWithAlpha(themeDeep, .56));
    ctx.fillStyle = emptyFill;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius - 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff3d8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 30px Georgia";
    ctx.fillText("Your shelf is waiting", 0, -48);
    ctx.font = "20px Trebuchet MS";
    ctx.fillStyle = "rgba(255,242,221,.86)";
    ctx.fillText("Add a few stories to begin", 0, -13);

    const buttonWidth = 220;
    const buttonHeight = 58;
    const buttonX = -buttonWidth / 2;
    const buttonY = 26;
    ctx.fillStyle = colorWithAlpha(themeDeep, .72);
    ctx.strokeStyle = colorWithAlpha(themeAccent, .78);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff6e6";
    ctx.font = "bold 21px Trebuchet MS";
    ctx.fillText("✦  Add books  ✦", 0, buttonY + buttonHeight / 2 + 1);
    ctx.restore();
    return;
  }

  const slice = (Math.PI * 2) / items.length;
  ctx.save();
  ctx.rotate(rotation);

  items.forEach((book, index) => {
    const start = index * slice;
    const end = start + slice;
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, outerRadius);
    const alternatingGlow = index % 2 ? colorWithAlpha(themeAccent, .58) : colorWithAlpha(themeGlow, .70);
    gradient.addColorStop(0, colorWithAlpha(themeAccent, .46));
    gradient.addColorStop(.22, alternatingGlow);
    gradient.addColorStop(1, colorWithAlpha(themeDeep, .54));

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerRadius - 13, start, end);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(themeAccent, .62);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8ea";
    ctx.shadowColor = "rgba(0,0,0,.86)";
    ctx.shadowBlur = 7;
    ctx.font = items.length > 8 ? "bold 16px Trebuchet MS" : "bold 20px Trebuchet MS";
    wrapText(ctx, book.title, outerRadius - 35, 0, Math.max(84, outerRadius * .42), 20);
    ctx.restore();
  });
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, outerRadius * .245, 0, Math.PI * 2);
  const center = ctx.createRadialGradient(-20, -28, 5, 0, 0, outerRadius * .27);
  center.addColorStop(0, colorWithAlpha(themeGlow, .88));
  center.addColorStop(1, colorWithAlpha(themeDeep, .86));
  ctx.fillStyle = center;
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(themeAccent, .88);
  ctx.lineWidth = 5;
  ctx.stroke();
  drawSparkle(0, -outerRadius * .12, 10);
  ctx.fillStyle = "#fff2dd";
  ctx.textAlign = "center";
  ctx.font = "bold 22px Trebuchet MS";
  ctx.fillText("Spin Book", 0, -1);
  ctx.font = "bold 13px Trebuchet MS";
  ctx.fillStyle = "rgba(255,239,210,.86)";
  ctx.fillText("tap center", 0, 23);
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  const lines = [];

  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;

    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });

  lines.push(line);

  const visible = lines.slice(0, 3);
  const start = y - ((visible.length - 1) * lineHeight) / 2;

  visible.forEach((entry, index) => {
    ctx.fillText(entry, x, start + index * lineHeight);
  });
}

function wheelClick(event, items, genre) {
  if (spinning) return;

  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();

  // Match pointer coordinates to the canvas's 700 × 700 drawing space.
  const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
  const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);

  if (!items.length) {
    const radius = canvas.width / 2;
    const buttonWidth = 220;
    const buttonHeight = 58;
    const buttonX = radius - buttonWidth / 2;
    const buttonY = radius + 26;

    const clickedAddBooks =
      canvasX >= buttonX &&
      canvasX <= buttonX + buttonWidth &&
      canvasY >= buttonY &&
      canvasY <= buttonY + buttonHeight;

    if (clickedAddBooks) {
      location.href = appUrl("genres.html");
    }

    return;
  }

  const x = canvasX - canvas.width / 2;
  const y = canvasY - canvas.height / 2;

  if (Math.hypot(x, y) <= canvas.width * 0.19) {
    spinWheel(items, genre);
  }
}

function spinWheel(items, genre) {
  spinning = true;

  const start = rotation;
  const target =
    start +
    Math.PI * 2 * (5 + Math.random() * 3) +
    Math.random() * Math.PI * 2;

  const started = performance.now();
  const duration = 3400;

  const frame = now => {
    const t = Math.min((now - started) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);

    rotation = start + (target - start) * ease;

    drawWheel(items);

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    spinning = false;
    rotation %= Math.PI * 2;

    const pointer = -Math.PI / 2;
    const slice = (Math.PI * 2) / items.length;

    const normal =
      ((pointer - rotation) % (Math.PI * 2) + Math.PI * 2) %
      (Math.PI * 2);

    const book = items[Math.floor(normal / slice) % items.length];

    openPickDialog(book, genre);
  };

  requestAnimationFrame(frame);
}

async function openPickDialog(book, genre) {
  if (sb) await ensureBookMetadata(book);
  let triggerUpdates = [];
  if (sb) {
    try {
      triggerUpdates = (await getBookUpdates(book.id)).filter(update => update.trigger_warning);
    } catch (error) {
      console.warn("Could not load trigger notes for the chosen book:", error);
    }
  }

  const genres = asTextList(book.genres);
  const describedTriggers = asTextList(book.trigger_warnings || book.content_warnings);
  const triggerCopy = describedTriggers.length
    ? describedTriggers.map(item => `<span>${escapeHtml(item)}</span>`).join("")
    : triggerUpdates.length
      ? `<span class="pick-trigger-flag"><b>TW</b> ${triggerUpdates.length} club reader${triggerUpdates.length === 1 ? " has" : "s have"} flagged a potential trigger.</span>`
      : `<span class="pick-trigger-clear">No trigger notes have been shared by your club yet.</span>`;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog adventure-dialog pick-reveal-dialog" id="pickDialog">
      <div class="dialog-card adventure-card pick-reveal-card">
        <div class="sparkle-ring" aria-hidden="true"></div>
        <button class="dialog-close" id="closePick" type="button" aria-label="Close">×</button>

        <header class="pick-reveal-heading">
          <span class="pick-reveal-star" aria-hidden="true">✦</span>
          <p class="eyebrow">The wheel has chosen</p>
          <h2>Your next adventure is waiting.</h2>
        </header>

        <div class="pick-book-layout">
          <div class="pick-book-cover">
            ${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="Cover of ${escapeHtml(book.title)}">` : `<div class="book-cover-placeholder">✦</div>`}
          </div>
          <div class="pick-book-details">
            <p class="eyebrow">${escapeHtml(genre?.name || "A magical selection")}</p>
            <h3>${escapeHtml(book.title)}</h3>
            <p class="book-authors">${escapeHtml(asTextList(book.authors).join(", ") || "Unknown author")}</p>
            <div class="book-tags pick-book-tags">
              ${(genres.length ? genres : [genre?.name].filter(Boolean)).map(item => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            <section class="pick-description">
              <p class="eyebrow">About this book</p>
              <p>${escapeHtml(book.description || "This book does not have a description on its catalog record yet.")}</p>
            </section>
            <section class="pick-triggers">
              <p class="eyebrow">Content care &amp; triggers</p>
              <div>${triggerCopy}</div>
              <small>Trigger notes are community-submitted and may not cover every sensitive topic.</small>
            </section>
          </div>
        </div>

        <div class="pick-decision-copy">
          <strong>Make this your club’s Book of the Month?</strong>
          <span>Choosing Read opens a shared, spoiler-safe reading room.</span>
        </div>
        <div class="button-row pick-actions">
          <button id="notYet" class="secondary-button" type="button">Skip &amp; spin again</button>
          <button id="beginBook" class="primary-button" type="button">Read this book</button>
        </div>
      </div>
    </dialog>
    `
  );

  const dialog = $("#pickDialog");

  dialog.showModal();

  $("#notYet", dialog).onclick = () => dialog.close();
  $("#closePick", dialog).onclick = () => dialog.close();

  $("#beginBook", dialog).onclick = async () => {
    const beginButton = $("#beginBook", dialog);
    beginButton.disabled = true;
    beginButton.textContent = "Opening your reading room…";
    const previous = clubBooks.find(bookItem => bookItem.status === "reading");

    if (previous && previous.id !== book.id) {
      const { error } = await sb
        .from("club_books")
        .update({
          status: "finished",
          finished_at: new Date().toISOString()
        })
        .eq("id", previous.id);

      if (error) {
        beginButton.disabled = false;
        beginButton.textContent = "Read this book";
        return alert(error.message);
      }
    }

    const { error } = await sb
      .from("club_books")
      .update({
        status: "reading",
        selected_at: new Date().toISOString()
      })
      .eq("id", book.id);

    if (error) {
      beginButton.disabled = false;
      beginButton.textContent = "Read this book";
      return alert(error.message);
    }

    location.href = appUrl("book.html", {
      book: book.id
    });
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function activeGenres() {
  return GENRES.filter(genre => enabledGenres().includes(genre.name));
}

function openBookDialog(defaultGenre) {
  if (Number.isFinite(currentClubPlan.bookLimit) && clubBooks.length >= currentClubPlan.bookLimit) {
    openPaywall({
      reason: `${currentClubPlan.name} shelves hold ${currentClubPlan.bookLimit} books per owned club. The owner can choose a new chapter to keep adding.`,
      requiredTier: currentClubPlan.id === "first_chapter" ? "story_spinner" : currentClubPlan.id === "story_spinner" ? "shelf_enchanter" : "library_legend"
    });
    return;
  }

  selectedTags = new Set(defaultGenre ? [defaultGenre.name] : []);

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="bookDialog">
      <div class="dialog-card book-entry-card wide-dialog">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">Add to the wheel</p>
        <h2>Find the book, then make it yours.</h2>

        <p class="field-help">
          Search by title, author, or ISBN.
          We will pull available cover art, description, and suggested genre shelves.
          You can always adjust them before adding.
        </p>

        <div class="book-search-row">
          <input id="bookSearch" placeholder="Search title, author, or ISBN">
          <button id="searchBooks" class="secondary-button">Find book</button>
        </div>

        <div id="bookResults" class="search-results"></div>

        <div id="manualBook" hidden>
          <label class="field-label">Book title</label>
          <input id="manualTitle" placeholder="Book title">

          <label class="field-label field-label-spaced">
            Put this book on these shelves
          </label>

          <div id="tagPicker" class="tag-picker"></div>

          <label class="field-label field-label-spaced">
            Number of chapters <small>(optional; you can add later)</small>
          </label>

          <input
            id="chapterCount"
            type="number"
            min="1"
            max="500"
            placeholder="Example: 32"
          >

          <div class="button-row genre-confirm-actions">
            <button id="saveManual" class="primary-button">Add with these genres</button>
            <button id="skipManualGenres" class="secondary-button" type="button">Skip for now</button>
          </div>
        </div>

        <button id="showManual" class="text-button">
          Enter a book manually instead
        </button>
      </div>
    </dialog>
    `
  );

  const dialog = $("#bookDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  renderTags(dialog);

  $("#showManual", dialog).onclick = () => {
    $("#manualBook", dialog).hidden = false;
    $("#showManual", dialog).hidden = true;
  };

  $("#searchBooks", dialog).onclick = () => {
    searchBooks($("#bookSearch", dialog).value, dialog);
  };

  $("#bookSearch", dialog).addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      $("#searchBooks", dialog).click();
    }
  });

  const saveManual = (skipGenres = false) => {
    const genres = skipGenres ? [] : [...selectedTags];
    if (!skipGenres && !genres.length) return alert("Choose at least one genre or use Skip for now.");
    saveBook({ title: $("#manualTitle", dialog).value, authors: [], genres, chapter_count: Number($("#chapterCount", dialog).value) || null }, dialog, null, { allowNoGenres: skipGenres });
  };
  $("#saveManual", dialog).onclick = () => saveManual(false);
  $("#skipManualGenres", dialog).onclick = () => saveManual(true);

  dialog.addEventListener("close", () => dialog.remove());
}

function renderTags(dialog) {
  const picker = $("#tagPicker", dialog);

  if (!picker) return;

  picker.innerHTML = activeGenres()
    .map(genre => `
      <button
        type="button"
        class="tag-chip ${selectedTags.has(genre.name) ? "selected" : ""}"
        data-tag="${escapeHtml(genre.name)}"
      >
        ${escapeHtml(genre.name)}
      </button>
    `)
    .join("");

  $$("[data-tag]", picker).forEach(button => {
    button.onclick = () => {
      if (selectedTags.has(button.dataset.tag)) {
        selectedTags.delete(button.dataset.tag);
      } else {
        selectedTags.add(button.dataset.tag);
      }

      renderTags(dialog);
    };
  });
}

function makeBookSearchQuery(rawQuery) {
  const query = rawQuery.trim();
  const cleanedQuery = query.replace(/[-\s]/g, "");

  // ISBN searches are the most exact result Google Books can provide.
  if (/^(?:\d{10}|\d{13})$/.test(cleanedQuery)) {
    return `isbn:${cleanedQuery}`;
  }

  // Let Google Books search title words, author names, and mixed searches.
  // Example: "Rebecca", "Daphne du Maurier", or "Rebecca Daphne du Maurier".
  return query;
}

function googleBooksErrorMessage(status, providerMessage = "") {
  const detail = String(providerMessage || "").trim();

  if (status === 400) {
    return "Google Books could not understand that search. Try a title, author name, or ISBN.";
  }

  if (status === 403) {
    return "Google Books blocked this request. The catalog service needs its server API key checked.";
  }

  if (status === 429) {
    return "Google Books is receiving too many requests right now. Please wait a minute and try again.";
  }

  if (status >= 500) {
    return "Google Books is temporarily unavailable. Please try again in a moment.";
  }

  return detail || "The book search could not be reached right now. Please try again in a moment.";
}

async function getGoogleBooks(query, options = {}) {
  if (!sb || !user) {
    throw new Error("Sign in before searching the shared book catalog.");
  }

  const { data, error } = await sb.functions.invoke("book-catalog", {
    body: {
      query,
      maxResults: Math.min(Math.max(Number(options.maxResults) || 20, 1), 20)
    }
  });

  if (error) {
    throw new Error(await edgeFunctionErrorMessage(error, "The book catalog could not be reached right now."));
  }
  if (data?.error) {
    throw new Error(googleBooksErrorMessage(data.error.status || 500, data.error.message));
  }
  return data || { totalItems: 0, items: [] };
}


function makeOpenLibrarySearchUrl(book) {
  const url = new URL("https://openlibrary.org/search.json");
  const isbn = String(book?.isbn_13 || book?.isbn_10 || "").replace(/[-\s]/g, "");
  const title = String(book?.title || "").trim();
  const authors = asTextList(book?.authors).join(" ").trim();

  // Ask only for the fields we need. This keeps the backup lookup light enough
  // for a browser-based book club instead of downloading giant catalog records.
  url.searchParams.set("limit", "8");
  url.searchParams.set("fields", "key,title,author_name,isbn,subject,subject_key,cover_i");
  if (isbn) url.searchParams.set("isbn", isbn);
  else {
    if (title) url.searchParams.set("title", title);
    if (authors) url.searchParams.set("author", authors);
  }
  return url;
}

function openLibraryErrorMessage(status) {
  if (status === 429) return "Open Library is busy right now. Please try again shortly.";
  if (status >= 500) return "Open Library is temporarily unavailable. Please try again shortly.";
  return "Open Library could not be reached right now.";
}

async function getOpenLibraryMetadata(book) {
  if (!book?.title && !book?.isbn_10 && !book?.isbn_13) return null;

  const response = await fetch(makeOpenLibrarySearchUrl(book).toString());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(openLibraryErrorMessage(response.status));

  const docs = payload.docs || [];
  const ranked = docs
    .map(doc => ({ doc, score: openLibraryMatchScore(doc, book) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked.map(item => item.doc).find(doc => titlesClearlyRelated(book.title, doc.title));
  if (!best) return null;

  let work = {};
  if (best.key && /^\/works\//.test(best.key)) {
    try {
      const workResponse = await fetch(`https://openlibrary.org${best.key}.json`);
      if (workResponse.ok) work = await workResponse.json();
    } catch (error) {
      // Search subjects are still useful even when the optional work detail is busy.
      console.warn("Could not load the Open Library work record:", error);
    }
  }

  return normalizeOpenLibraryBook(best, work);
}

function openLibraryMatchScore(doc, book) {
  const sourceIsbns = [book.isbn_13, book.isbn_10].filter(Boolean).map(value => String(value).replace(/[-\s]/g, ""));
  const resultIsbns = asTextList(doc.isbn).map(value => String(value).replace(/[-\s]/g, ""));
  if (sourceIsbns.some(value => resultIsbns.includes(value))) return 1000;

  const sourceTitle = normalizeComparableText(book.title);
  const resultTitle = normalizeComparableText(doc.title);
  const exactTitle = sourceTitle && sourceTitle === resultTitle;
  const titleScore = overlapScore(book.title, doc.title);
  const authorScore = overlapScore(asTextList(book.authors).join(" "), asTextList(doc.author_name).join(" "));
  return (exactTitle ? 85 : titleScore * 65) + authorScore * 30;
}

function normalizeOpenLibraryBook(doc, work = {}) {
  const rawSubjects = [...asTextList(doc.subject), ...asTextList(work.subjects)];
  const descriptionValue = work.description;
  const description = typeof descriptionValue === "object"
    ? String(descriptionValue?.value || "")
    : String(descriptionValue || "");
  const isbnValues = asTextList(doc.isbn);
  const coverId = doc.cover_i || asTextList(work.covers)[0];
  const mapped = rawSubjects.flatMap(mapGenre);
  const inferred = inferGenreSuggestions({
    title: doc.title || "",
    subtitle: "",
    description,
    categories: rawSubjects
  });

  return {
    title: doc.title || "Untitled",
    authors: asTextList(doc.author_name),
    description,
    cover_url: coverId ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(coverId)}-L.jpg` : "",
    isbn_10: isbnValues.find(value => /^\d{9}[\dX]$/i.test(String(value).replace(/[-\s]/g, ""))) || null,
    isbn_13: isbnValues.find(value => /^\d{13}$/.test(String(value).replace(/[-\s]/g, ""))) || null,
    google_volume_id: "",
    google_info_link: "",
    buy_link: "",
    page_count: null,
    genres: [...new Set([...mapped, ...inferred])]
  };
}

function mergeBookMetadata(primary = {}, backup = {}) {
  const preferred = (field, fallback = "") => primary[field] || backup[field] || fallback;
  return {
    title: preferred("title", "Untitled"),
    authors: asTextList(primary.authors).length ? asTextList(primary.authors) : asTextList(backup.authors),
    description: preferred("description"),
    cover_url: preferred("cover_url"),
    isbn_10: preferred("isbn_10", null),
    isbn_13: preferred("isbn_13", null),
    google_volume_id: preferred("google_volume_id", null),
    google_info_link: preferred("google_info_link", ""),
    buy_link: preferred("buy_link", ""),
    page_count: preferred("page_count", null),
    genres: [...new Set([...asTextList(primary.genres), ...asTextList(backup.genres)])]
  };
}

function needsOpenLibraryHelp(metadata) {
  return !metadata?.description || !metadata?.cover_url || !asTextList(metadata?.genres).length;
}

async function addOpenLibraryBackup(metadata, sourceBook, options = {}) {
  const shouldLookup = options.always || needsOpenLibraryHelp(metadata);
  if (!shouldLookup) return metadata;
  try {
    const backup = await getOpenLibraryMetadata({ ...sourceBook, ...metadata });
    return backup ? mergeBookMetadata(metadata, backup) : metadata;
  } catch (error) {
    // Open Library is supplemental. Google or member-entered data should still save.
    console.warn("Open Library backup lookup failed:", error);
    return metadata;
  }
}

async function searchBooks(query, dialog) {
  query = query.trim();

  if (!query) {
    return alert("Enter a title, author, or ISBN first.");
  }

  const results = $("#bookResults", dialog);
  const searchButton = $("#searchBooks", dialog);

  results.innerHTML = `
    <p class="field-help">Looking through the shelves...</p>
  `;

  if (searchButton) {
    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
  }

  try {
    const payload = await getGoogleBooks(makeBookSearchQuery(query));

    const books = (payload.items || [])
      .map(item => normalizeGoogleBook(item, { includeLooseSuggestions: true }))
      .filter(book => book.title && book.title !== "Untitled");

    results.innerHTML = books.length
      ? `
          <div class="google-attribution"><img src="https://books.google.com/googlebooks/images/poweredby.png" alt="Powered by Google"></div>
          ${books
            .map((book, index) => `
              <article class="search-result">
                <button class="search-result-pick" type="button" data-result="${index}" aria-label="Choose ${escapeHtml(book.title)}">
                  ${book.cover_url
                    ? `<img src="${escapeHtml(book.cover_url)}" alt="Cover for ${escapeHtml(book.title)}">`
                    : `<span class="small-cover">✦</span>`}
                  <span>
                    <strong>${escapeHtml(book.title)}</strong>
                    <small>${escapeHtml(book.authors.join(", ") || "Unknown author")}</small>
                    <small>${book.genres.length
                      ? `Suggested: ${escapeHtml(book.genres.join(", "))}`
                      : "No clear shelf listed — choose one after selecting."}</small>
                  </span>
                </button>
                <a class="google-books-result-link" href="${escapeHtml(book.google_info_link || googleBooksSearchLink(book))}" target="_blank" rel="noopener">View on Google Books ↗</a>
              </article>
            `).join("")}
        `
      : `
          <p class="empty-note">
            We could not find a close match for “${escapeHtml(query)}.”
            Try the full title, the author's full name, or ISBN.
          </p>
        `;

    $$('[data-result]', results).forEach(button => {
      button.onclick = async () => {
        const selected = books[Number(button.dataset.result)];
        button.disabled = true;
        button.classList.add("is-loading");
        try {
          // A member-picked title is worth one richer subject lookup. It improves
          // vague Google categories without making every search result wait on a second API.
          const book = await addOpenLibraryBackup(selected, selected, { always: true });
          selectedTags = new Set(
            book.genres.filter(genre =>
              activeGenres().some(activeGenre => activeGenre.name === genre)
            )
          );
          openMetadataConfirm(book, dialog);
        } finally {
          button.disabled = false;
          button.classList.remove("is-loading");
        }
      };
    });
  } catch (error) {
    console.error("Google Books search error:", error);

    results.innerHTML = `
      <p class="empty-note">
        ${escapeHtml(error.message || "The book search could not be reached right now.")}
      </p>
    `;
  } finally {
    if (searchButton) {
      searchButton.disabled = false;
      searchButton.textContent = "Find book";
    }
  }
}

function normalizeComparableText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(normalizeComparableText(value).split(" ").filter(token => token.length > 1));
}

function overlapScore(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let common = 0;
  a.forEach(token => { if (b.has(token)) common += 1; });
  return common / Math.max(a.size, b.size);
}

function asTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value == null || value === "") return [];
  return [String(value)];
}

function bookLookupQuery(book) {
  const title = String(book.title || "").trim();
  const authors = asTextList(book.authors).join(" ").trim();
  return book.isbn_13
    ? `isbn:${book.isbn_13}`
    : book.isbn_10
      ? `isbn:${book.isbn_10}`
      : `${title} ${authors}`.trim() || title;
}

function bookTitleLookupQuery(book) {
  const title = String(book.title || "").trim();
  // A title-only lookup is much kinder to Goodreads imports. Their author names
  // can include initials, co-authors, or formatting Google does not recognize.
  return title ? `intitle:${title}` : bookLookupQuery(book);
}

function simplifiedTitle(value) {
  return normalizeComparableText(value)
    .replace(/(book|volume|vol|novel|series)\s+\d+/g, "")
    .trim();
}

function titlesClearlyRelated(left, right) {
  const a = simplifiedTitle(left);
  const b = simplifiedTitle(right);
  if (!a || !b) return false;
  if (a === b || a.startsWith(b) || b.startsWith(a)) return true;
  // A one-word title followed by a series subtitle (for example, “Ascendant:
  // Songs of Chaos”) should still count. This deliberately favors helpful
  // suggestions over rejecting every imported book.
  return overlapScore(a, b) >= 0.25;
}

function googleMatchScore(item, book) {
  const meta = normalizeGoogleBook(item, { includeLooseSuggestions: true });
  const sourceIsbns = [book.isbn_13, book.isbn_10].filter(Boolean).map(value => String(value).replace(/[-\s]/g, ""));
  const matchIsbns = [meta.isbn_13, meta.isbn_10].filter(Boolean).map(value => String(value).replace(/[-\s]/g, ""));
  if (sourceIsbns.some(value => matchIsbns.includes(value))) return 1000;

  const sourceTitle = normalizeComparableText(book.title);
  const resultTitle = normalizeComparableText(meta.title);
  const exactTitle = sourceTitle && sourceTitle === resultTitle;
  const titleScore = overlapScore(book.title, meta.title);
  const authorScore = overlapScore(asTextList(book.authors).join(" "), asTextList(meta.authors).join(" "));

  // Goodreads imports can have incomplete or differently formatted author names.
  // An exact title is still a safe enough match for metadata suggestions, and a
  // partial title match may be used for genres/cover rather than being discarded.
  return (exactTitle ? 85 : titleScore * 65) + authorScore * 30;
}

function chooseBestGoogleMatch(items, book) {
  const ranked = (items || [])
    .map(item => ({ item, score: googleMatchScore(item, book) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return null;

  const meta = normalizeGoogleBook(best.item, { includeLooseSuggestions: true });

  // The bulk tool is for loose Goodreads imports, not a cataloging system.
  // Accept a close title even when Google adds a series subtitle or Goodreads
  // stores an abbreviated author. The button only fills suggestions/details;
  // it never changes books deliberately placed on multiple shelves.
  return titlesClearlyRelated(book.title, meta.title) ? best.item : null;
}

function metadataPatch(book, meta, options = {}) {
  const patch = {};
  const fields = ["cover_url", "description", "isbn_10", "isbn_13", "google_volume_id", "google_info_link", "buy_link", "page_count"];
  fields.forEach(field => {
    if (meta[field] && (!book[field] || options.force)) patch[field] = meta[field];
  });
  if (Array.isArray(options.genres) && JSON.stringify(book.genres || []) !== JSON.stringify(options.genres)) {
    patch.genres = options.genres;
  }
  return patch;
}

function normalizeGoogleBook(item, options = {}) {
  const volume = item.volumeInfo || {};
  const ids = volume.industryIdentifiers || [];

  const cover = (
    volume.imageLinks?.extraLarge ||
    volume.imageLinks?.large ||
    volume.imageLinks?.medium ||
    volume.imageLinks?.small ||
    volume.imageLinks?.thumbnail ||
    ""
  ).replace(/^http:/, "https:");

  const rawCategories = volume.categories || [];
  const categorySuggestions = rawCategories.flatMap(mapGenre);
  const looseSuggestions = options.includeLooseSuggestions
    ? inferGenreSuggestions({
        title: volume.title || "",
        subtitle: volume.subtitle || "",
        description: volume.description || "",
        categories: rawCategories
      })
    : [];

  return {
    title: volume.title || "Untitled",
    authors: asTextList(volume.authors),
    description: volume.description || "",
    cover_url: cover,
    isbn_10: ids.find(itemId => itemId.type === "ISBN_10")?.identifier || null,
    isbn_13: ids.find(itemId => itemId.type === "ISBN_13")?.identifier || null,
    google_volume_id: item.id,
    google_info_link: volume.infoLink || volume.previewLink || "",
    buy_link: item.saleInfo?.buyLink || "",
    genres: [...new Set([...categorySuggestions, ...looseSuggestions])],
    page_count: volume.pageCount || null
  };
}

function inferGenreSuggestions(book) {
  const text = [book.title, book.subtitle, book.description, ...asTextList(book.categories)]
    .join(" ")
    .toLowerCase();
  const suggestions = [];
  const add = name => {
    if (!suggestions.includes(name)) suggestions.push(name);
  };

  // Google sometimes supplies only a very broad “Fiction” category. These are
  // deliberately light-touch hints for the add-book screen and bulk importer,
  // never a hard rule: members can still switch any selected shelf before saving.
  if (/\b(romance|romantic|love story|enemies to lovers|fake dating|happily ever after)\b/.test(text)) add("Romance");
  if (/\b(fantasy|dragon|dragons|magic|magical|witch|wizard|fae|fairy|kingdom|sorcer|academy)\b/.test(text)) add("Fantasy");
  if (/\b(science fiction|sci[- ]?fi|space travel|spaceship|alien|cyberpunk|time travel|dystopian future)\b/.test(text)) add("Sci-Fi");
  if (/\b(mystery|detective|whodunit|whodunnit|investigat)\b/.test(text)) add("Mystery");
  if (/\b(thriller|suspense|psychological|serial killer|kidnap|dangerous secret)\b/.test(text)) add("Thriller & Suspense");
  if (/\b(horror|haunted|ghost|supernatural terror|nightmare)\b/.test(text)) add("Horror");
  if (/\b(historical fiction|world war|victorian|regency|medieval|nineteenth century|twentieth century)\b/.test(text)) add("Historical Fiction");
  if (/\b(adventure|quest|expedition|treasure hunt|survival)\b/.test(text)) add("Action & Adventure");
  if (/\b(dystopian|post[- ]?apocalyptic|totalitarian)\b/.test(text)) add("Dystopian");
  if (/\b(young adult|teenage|teenager|high school)\b/.test(text)) add("Young Adult (YA)");
  if (/\b(manga|graphic novel|comic book|comics)\b/.test(text)) add("Manga & Graphic Novels");
  if (/\b(memoir|biography|autobiography|life story)\b/.test(text)) add("Memoir & Biography");
  if (/\b(history|historical account|civil war|ancient history)\b/.test(text)) add("History");
  if (/\b(self[- ]?help|how to|guide to|personal growth|habit)\b/.test(text)) add("Self-Help & How-To");
  if (/\b(true crime|murder case|criminal investigation|unsolved case)\b/.test(text)) add("True Crime");
  if (/\b(essays|journalism|reporting|columnist)\b/.test(text)) add("Essays & Journalism");

  return suggestions;
}

function mapGenre(category) {
  const value = String(category || "").toLowerCase();
  const found = [];

  const add = name => {
    if (!found.includes(name)) {
      found.push(name);
    }
  };

  if (value.includes("romance")) add("Romance");
  if (value.includes("fantasy")) add("Fantasy");

  if (value.includes("science fiction") || value.includes("sci-fi")) {
    add("Sci-Fi");
  }

  if (value.includes("mystery")) add("Mystery");

  if (value.includes("thriller") || value.includes("suspense")) {
    add("Thriller & Suspense");
  }

  if (value.includes("horror")) add("Horror");
  if (value.includes("historical fiction")) add("Historical Fiction");

  if (value.includes("adventure") || value.includes("action")) {
    add("Action & Adventure");
  }

  if (value.includes("dystopian")) add("Dystopian");

  if (value.includes("young adult") || value.includes("juvenile fiction")) {
    add("Young Adult (YA)");
  }

  if (value.includes("manga") || value.includes("graphic novel") || value.includes("comics")) {
    add("Manga & Graphic Novels");
  }

  if (
    value.includes("memoir") ||
    value.includes("biography") ||
    value.includes("autobiography")
  ) {
    add("Memoir & Biography");
  }

  if (value.includes("history")) add("History");

  if (
    value.includes("self-help") ||
    value.includes("self help") ||
    value.includes("how-to") ||
    value.includes("how to")
  ) {
    add("Self-Help & How-To");
  }

  if (value.includes("true crime") || value.includes("crime /")) {
    add("True Crime");
  }

  if (value.includes("essay") || value.includes("journalism")) {
    add("Essays & Journalism");
  }

  return found;
}

function openMetadataConfirm(book, dialog) {
  const old = $("#metadataDialog");
  old?.remove();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="metadataDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">Found on the shelf</p>
        <h2>${escapeHtml(book.title)}</h2>
        <p class="field-help">
          ${escapeHtml(book.authors.join(", ") || "Unknown author")}
        </p>

        <p class="field-help">Choose every shelf that fits this book before adding it, or skip for now and use the book lookup later.</p>
        <div id="confirmTags" class="tag-picker"></div>

        <label class="field-label">
          Number of chapters <small>(optional)</small>
        </label>

        <input
          id="confirmedChapters"
          type="number"
          min="1"
          max="500"
          placeholder="Add now or later"
        >

        <div class="button-row genre-confirm-actions">
          <button id="saveFoundBook" class="primary-button">Add with these genres</button>
          <button id="skipFoundGenres" class="secondary-button" type="button">Skip for now</button>
        </div>
      </div>
    </dialog>
    `
  );

  const confirm = $("#metadataDialog");

  confirm.showModal();

  $(".dialog-close", confirm).onclick = () => confirm.close();

  const tagBox = $("#confirmTags", confirm);

  const render = () => {
    tagBox.innerHTML = activeGenres()
      .map(genre => `
        <button
          type="button"
          class="tag-chip ${selectedTags.has(genre.name) ? "selected" : ""}"
          data-found-tag="${escapeHtml(genre.name)}"
        >
          ${escapeHtml(genre.name)}
        </button>
      `)
      .join("");

    $$("[data-found-tag]", tagBox).forEach(button => {
      button.onclick = () => {
        if (selectedTags.has(button.dataset.foundTag)) {
          selectedTags.delete(button.dataset.foundTag);
        } else {
          selectedTags.add(button.dataset.foundTag);
        }

        render();
      };
    });
  };

  render();

  const saveFound = (skipGenres = false) => {
    const chosenGenres = skipGenres ? [] : [...selectedTags];
    if (!skipGenres && !chosenGenres.length) {
      return alert("Choose at least one genre or use Skip for now.");
    }
    saveBook({ ...book, genres: chosenGenres, chapter_count: Number($("#confirmedChapters", confirm).value) || null }, confirm, dialog, { allowNoGenres: skipGenres });
  };
  $("#saveFoundBook", confirm).onclick = () => saveFound(false);
  $("#skipFoundGenres", confirm).onclick = () => saveFound(true);

  confirm.addEventListener("close", () => confirm.remove());
}

async function saveBook(book, confirmDialog, outerDialog, options = {}) {
  if (!book.title?.trim()) {
    return alert("Please enter a title.");
  }

  if (Number.isFinite(currentClubPlan.bookLimit) && clubBooks.length >= currentClubPlan.bookLimit) {
    confirmDialog?.close();
    outerDialog?.close();
    openPaywall({ reason: `This club has filled all ${currentClubPlan.bookLimit} shelves included with ${currentClubPlan.name}.` });
    return;
  }

  const usableGenres = (book.genres || []).filter(genre =>
    enabledGenres().includes(genre)
  );

  const payload = {
    club_id: currentClub.id,
    title: book.title.trim(),
    authors: book.authors || [],
    description: book.description || null,
    cover_url: book.cover_url || null,
    isbn_10: book.isbn_10 || null,
    isbn_13: book.isbn_13 || null,
    google_volume_id: book.google_volume_id || null,
    google_info_link: book.google_info_link || null,
    buy_link: book.buy_link || null,
    genres: usableGenres.length ? usableGenres : (options.allowNoGenres ? [] : [enabledGenres()[0]]),
    page_count: book.page_count || null,
    chapter_count: book.chapter_count || null,
    added_by: user.id
  };

  const { data, error } = await sb
    .from("club_books")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (String(error.message).includes("SUBSCRIPTION_LIMIT")) {
      confirmDialog?.close();
      outerDialog?.close();
      openPaywall({ reason: "This club has reached the book limit included with its owner’s plan." });
      return;
    }
    return alert(error.message);
  }

  if (data.chapter_count) {
    await generateChapters(data.id, data.chapter_count);
  }

  confirmDialog?.close();
  outerDialog?.close();

  location.reload();
}

async function generateChapters(bookId, count) {
  const chapters = Array.from(
    { length: count },
    (_, index) => ({
      book_id: bookId,
      chapter_number: index + 1
    })
  );

  for (let index = 0; index < chapters.length; index += 100) {
    const { error } = await sb
      .from("book_chapters")
      .insert(chapters.slice(index, index + 100));

    if (error) {
      console.warn(error);
    }
  }
}

function openGoodreadsImport() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="goodreadsDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">Bring your shelves with you</p>
        <h2>Import Goodreads books</h2>

        <p class="field-help">
          Download your Goodreads Library CSV, then choose it here.
          We use its title, author, ISBN, and shelves to place every book
          on the best matching club shelves.
          A book can appear on more than one wheel.
        </p>

        <input id="goodreadsFile" type="file" accept=".csv,text/csv">

        <label class="toggle-line">
          <input id="importRead" type="checkbox">
          Include books marked Read as finished books
        </label>

        <label class="toggle-line">
          <input id="importGoogleGenres" type="checkbox" checked>
          Use Google Books to suggest genres for books without matching Goodreads shelves
        </label>
        <p class="field-help import-note">This adds a quick Google lookup only when your CSV does not provide a matching shelf. It can take a little longer for very large libraries.</p>

        <button
          id="runGoodreadsImport"
          class="primary-button full-button"
          type="button"
        >
          Import my library
        </button>

        <div id="importResults" class="book-list"></div>
      </div>
    </dialog>
    `
  );

  const dialog = $("#goodreadsDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  $("#runGoodreadsImport", dialog).onclick = () => {
    importGoodreadsFile(dialog);
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function parseCSV(text) {
  const rows = [];

  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === "\"" && quoted && next === "\"") {
      field += "\"";
      index += 1;
    } else if (character === "\"") {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }

      row.push(field);

      if (row.some(value => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field);

  if (row.some(value => value !== "")) {
    rows.push(row);
  }

  const headers = rows.shift() || [];

  return rows.map(values =>
    Object.fromEntries(headers.map((header, index) => [
      header,
      values[index] || ""
    ]))
  );
}

async function importGoodreadsFile(dialog) {
  const file = $("#goodreadsFile", dialog).files[0];

  if (!file) {
    return alert("Choose your Goodreads CSV first.");
  }

  const rows = parseCSV(await file.text());
  const includeRead = $("#importRead", dialog).checked;
  const useGoogleGenres = $("#importGoogleGenres", dialog).checked;
  const result = $("#importResults", dialog);

  let usable = rows.filter(row =>
    row["Book Id"] &&
    row.Title &&
    (
      includeRead ||
      String(row["Exclusive Shelf"] || "").toLowerCase() !== "read"
    )
  );

  if (!usable.length) {
    result.innerHTML = `
      <p class="empty-note">No importable books were found in that CSV.</p>
    `;

    return;
  }

  if (Number.isFinite(currentClubPlan.bookLimit)) {
    const remaining = Math.max(0, currentClubPlan.bookLimit - clubBooks.length);
    if (!remaining) {
      dialog.close();
      openPaywall({ reason: `This club has filled all ${currentClubPlan.bookLimit} shelves included with ${currentClubPlan.name}.` });
      return;
    }
    if (usable.length > remaining) {
      result.innerHTML = `<p class="empty-note">Your file contains ${usable.length} books, but this club has room for ${remaining}. Upgrade the owner’s plan to import the full library.</p>`;
      return;
    }
  }

  result.innerHTML = `
    <p class="field-help">
      Importing ${usable.length} books into ${escapeHtml(currentClub.name)}…
    </p>
  `;

  let added = 0;
  let skipped = 0;
  let googleGenreMatches = 0;

  for (const row of usable) {
    const title = row.Title.replace(/\s*\([^)]*\)\s*$/, " ").trim();

    const exists = clubBooks.some(book =>
      book.title.toLowerCase() === title.toLowerCase()
    );

    if (exists) {
      skipped += 1;
      continue;
    }

    const shelf = String(row["Bookshelves"] || "").toLowerCase();
    const genres = new Set();

    const shelfMatches = {
      "Romance": ["romance", "romantasy"],
      "Fantasy": ["fantasy", "romantasy"],
      "Sci-Fi": ["sci-fi", "science fiction", "scifi"],
      "Mystery": ["mystery"],
      "Thriller & Suspense": ["thriller", "suspense"],
      "Horror": ["horror"],
      "Historical Fiction": ["historical fiction"],
      "Action & Adventure": ["action", "adventure"],
      "Dystopian": ["dystopian"],
      "Young Adult (YA)": ["young adult", "ya"],
      "Manga & Graphic Novels": ["manga", "graphic novel", "comics"],
      "Memoir & Biography": ["memoir", "biography", "autobiography"],
      "History": ["history"],
      "Self-Help & How-To": ["self-help", "self help", "how to"],
      "True Crime": ["true crime"],
      "Essays & Journalism": ["essays", "journalism"]
    };

    Object.entries(shelfMatches).forEach(([genre, labels]) => {
      if (
        enabledGenres().includes(genre) &&
        labels.some(label => shelf.includes(label))
      ) {
        genres.add(genre);
      }
    });

    let matchedGenres = [...genres].filter(genre =>
      enabledGenres().includes(genre)
    );
    let googleMetadata = null;

    // Goodreads exports often have no genre column. When its shelves do not
    // give us an answer, Google Books fills the gap with its book categories.
    if (!matchedGenres.length && useGoogleGenres) {
      try {
        const query = row.ISBN13
          ? `isbn:${row.ISBN13}`
          : row.ISBN
            ? `isbn:${row.ISBN}`
            : `${title} ${row.Author || ""}`.trim();
        const googleResult = await getGoogleBooks(query, { maxResults: 1 });
        const found = googleResult.items?.[0];
        googleMetadata = found ? normalizeGoogleBook(found, { includeLooseSuggestions: true }) : {};
        googleMetadata = await addOpenLibraryBackup(googleMetadata, {
          title,
          authors: row.Author ? [row.Author] : [],
          isbn_13: row.ISBN13,
          isbn_10: row.ISBN
        }, { always: !found });
        matchedGenres = googleMetadata.genres.filter(genre => enabledGenres().includes(genre));
        if (matchedGenres.length) googleGenreMatches += 1;
      } catch (error) {
        console.warn(`Could not look up genres for ${title}:`, error);
      }
    }

    const payload = {
      club_id: currentClub.id,
      title,
      authors: row.Author ? [row.Author] : (googleMetadata?.authors || []),
      isbn_13: row.ISBN13 || googleMetadata?.isbn_13 || null,
      isbn_10: row.ISBN || googleMetadata?.isbn_10 || null,
      cover_url: googleMetadata?.cover_url || null,
      description: googleMetadata?.description || null,
      google_volume_id: googleMetadata?.google_volume_id || null,
      google_info_link: googleMetadata?.google_info_link || null,
      buy_link: googleMetadata?.buy_link || null,
      page_count: googleMetadata?.page_count || null,
      genres: matchedGenres.length
        ? matchedGenres
        : [enabledGenres()[0]],
      status:
        String(row["Exclusive Shelf"] || "").toLowerCase() === "read"
          ? "finished"
          : "wheel",
      finished_at:
        String(row["Exclusive Shelf"] || "").toLowerCase() === "read"
          ? new Date().toISOString()
          : null,
      added_by: user.id
    };

    const { error } = await sb.from("club_books").insert(payload);

    if (error) {
      console.warn(error);
    } else {
      added += 1;
    }
  }

  result.innerHTML = `
    <p class="field-help">
      ✨ Added ${added} book${added === 1 ? "" : "s"}.
      Skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}.
      ${useGoogleGenres ? `Book catalog lookup suggested shelves for ${googleGenreMatches} book${googleGenreMatches === 1 ? "" : "s"} that did not have a matching Goodreads shelf.` : "Book catalog lookups were skipped for this import."}
      Covers and descriptions were saved whenever a catalog match was found.
    </p>
  `;

  await loadClubBooks();
}

async function ensureBookMetadata(book) {
  // Imported/manual books can arrive with no cover, description, catalog links,
  // or useful shelves. Google remains the primary record; Open Library fills
  // blanks and contributes richer subject tags when Google is vague.
  if (!book || !book.title) return book;
  const needsDetails = !book.cover_url || !book.description || !book.google_info_link;
  const needsGenres = !asTextList(book.genres).length || (asTextList(book.genres).length === 1 && asTextList(book.genres)[0] === enabledGenres()[0]);
  if (!needsDetails && !needsGenres) return book;

  try {
    let metadata = null;
    const payload = await getGoogleBooks(bookLookupQuery(book), { maxResults: 10 });
    const found = chooseBestGoogleMatch(payload.items || [], book);
    if (found) metadata = normalizeGoogleBook(found, { includeLooseSuggestions: true });
    metadata = await addOpenLibraryBackup(metadata || {}, book, { always: !metadata });
    if (!metadata || !Object.keys(metadata).length) return book;

    const existingGenres = asTextList(book.genres);
    const suggestedGenres = metadata.genres.filter(genre => enabledGenres().includes(genre));
    const nextGenres = needsGenres && suggestedGenres.length ? suggestedGenres : existingGenres;
    const updates = metadataPatch(book, metadata, { genres: nextGenres });
    if (!Object.keys(updates).length) return book;
    const { error } = await sb
      .from("club_books")
      .update(updates)
      .eq("id", book.id)
      .eq("club_id", currentClub.id);
    if (!error) Object.assign(book, updates);
  } catch (error) {
    // Missing public catalog data should never prevent the reading room from opening.
    console.warn("Could not automatically find book metadata:", error);
  }
  return book;
}

async function renderBookRoom() {
  const id = getParam("book");

  if (!id) {
    return location.href = appUrl("genres.html");
  }

  const { data: book, error } = await sb
    .from("club_books")
    .select("*")
    .eq("id", id)
    .eq("club_id", currentClub.id)
    .single();

  if (error) {
    return location.href = appUrl("genres.html");
  }

  await ensureBookMetadata(book);
  applyBookTheme(book);

  const { data: chapters } = await sb
    .from("book_chapters")
    .select("id,chapter_number,chapter_title")
    .eq("book_id", book.id)
    .order("chapter_number");

  const chapterIds = (chapters || []).map(chapter => chapter.id);
  if (chapterIds.length) {
    const { data: chapterActivity, error: activityError } = await sb
      .from("chapter_messages")
      .select("chapter_id,trigger_warning")
      .in("chapter_id", chapterIds);

    if (!activityError) {
      const activityByChapter = new Map();
      (chapterActivity || []).forEach(message => {
        const summary = activityByChapter.get(message.chapter_id) || { count: 0, hasWarning: false };
        summary.count += 1;
        summary.hasWarning ||= Boolean(message.trigger_warning);
        activityByChapter.set(message.chapter_id, summary);
      });
      (chapters || []).forEach(chapter => {
        const summary = activityByChapter.get(chapter.id) || { count: 0, hasWarning: false };
        chapter.chapter_message_count = summary.count;
        chapter.has_trigger_warning = summary.hasWarning;
      });
    }
  }

  const updates = await getBookUpdates(book.id);
  const mine = updates.find(update => update.user_id === user.id) || {};
  const selectedRating = Number(mine.rating || 0);
  const warningReaders = updates.filter(update => update.trigger_warning);
  // A trigger flag is independent from a finished/DNF/rating update.  A reader
  // can safely check or uncheck it without losing access to their update card.
  const hasSavedReadingUpdate = Boolean(mine.outcome || Number(mine.rating || 0));

  const readingUpdateMarkup = hasSavedReadingUpdate
    ? groupReadingSummaryMarkup(updates, chapters || [])
    : `
      <section class="your-update-panel glass-panel inline-reading-update" id="yourBookUpdate">
        <div class="reading-update-copy"><p class="eyebrow">Your reading update</p><h2>How did the adventure land?</h2><p>Choose where you landed and leave a heart rating. Thoughts and reactions can stay in the chapter conversations above.</p></div>
        <form class="inline-reading-form" id="inlineReadingUpdateForm">
          <div class="inline-update-fields">
            <div><label class="field-label">Where are you with it?</label><div class="outcome-choice"><label><input type="radio" name="readingOutcome" value="finished" ${mine.outcome === "finished" ? "checked" : ""}> Finished reading</label><label><input type="radio" name="readingOutcome" value="dnf" ${mine.outcome === "dnf" ? "checked" : ""}> Did not finish</label></div></div>
            <div><label class="field-label">How did it feel?</label><div class="heart-picker" id="inlineHeartPicker">${heartRating(selectedRating, true)}</div></div>
          </div>
          <button class="primary-button" type="submit">Save my reading update</button>
        </form>
      </section>`;

  $("#app").innerHTML = `
    ${topBar(book.status === "reading" ? "Book of the Month" : "Book details", book.title)}

    <section class="book-room glass-panel">
      <div class="book-cover-area">
        ${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="Cover of ${escapeHtml(book.title)}">` : `<div class="book-cover-placeholder">✦</div>`}
      </div>

      <div class="book-details">
        <p class="eyebrow">${book.status === "reading" ? "Currently reading" : "Club shelf"}</p>
        <h2>${escapeHtml(book.title)}</h2>
        <p class="book-authors">${escapeHtml((book.authors || []).join(", ") || "Unknown author")}</p>
        <div class="book-tags">
          ${(book.genres || []).map(genre => `<span>${escapeHtml(genre)}</span>`).join("")}
          ${warningReaders.length ? `<span class="tw-book-tag">TW flagged</span>` : ""}
        </div>
        ${book.description ? `<div class="book-description is-collapsed" id="bookDescription"><p class="eyebrow">About this book</p><p class="book-description-preview">${escapeHtml(descriptionPreview(book.description))}</p><p class="book-description-copy">${escapeHtml(book.description)}</p><button class="text-button description-toggle" id="toggleBookDescription" type="button" aria-expanded="false">Read full description <span aria-hidden="true">↓</span></button></div>` : `<div class="book-description book-description-empty"><p class="eyebrow">About this book</p><p>A description will appear here when Google Books has one available.</p></div>`}
        <div class="button-row book-links">
          <a class="secondary-button" target="_blank" rel="noopener" href="${escapeHtml(book.google_info_link || googleBooksSearchLink(book))}">View on Google Books</a>
          <a class="primary-button" target="_blank" rel="noopener" href="${escapeHtml(amazonSearchLink(book))}">Search Amazon</a>
          ${isAdmin() ? `<button class="text-button book-genre-edit-button" id="editBookGenres" type="button">Edit genres</button>` : ""}
          ${isOwner() && book.status === "reading" ? `<button class="secondary-button" id="returnAdventureToShelf">Return to shelf</button><button class="text-button danger-button" id="removeAdventureFromLibrary">Remove from library</button>` : ""}
        </div>
        ${warningReaders.length ? `<div class="tw-reader-note"><span class="tw-badge">TW</span><span>Flagged by ${warningReaders.map(update => `<strong>${escapeHtml(update.display_name || "Bookish Reader")}</strong>`).join(", ")}</span></div>` : ""}
      </div>
    </section>

    <section class="chapters-section glass-panel">
      <div class="section-heading"><div><p class="eyebrow">Spoiler-safe reading room</p><h2>Chapters &amp; group notes</h2><p>Each chapter opens its own conversation. Voice notes stay with the chapter too.</p></div><div class="chapter-section-actions"><button id="openAllMessages" class="secondary-button">View all messages</button>${isAdmin() ? `<button id="setChapters" class="secondary-button">${chapters?.length ? "Edit chapters" : "Add chapters"}</button>` : ""}</div></div>
      <div class="chapter-list">${chapters?.length ? chapters.map(chapter => chapterCard(chapter, book)).join("") : `<p class="empty-note">No chapters have been added yet. An admin can enter the chapter count to make a private space for each chapter.</p>`}</div>
    </section>

    <section class="trigger-warning-panel glass-panel" id="triggerWarningPanel">
      <div><p class="eyebrow">Content care</p><h2>Potential trigger warning</h2><p>Flag this privately for your club if this story may include a trigger for someone reading with you.</p></div>
      <label class="tw-toggle tw-standalone"><input type="checkbox" id="inlineTriggerWarning" ${mine.trigger_warning ? "checked" : ""}> <span class="tw-badge">TW</span><span id="inlineTriggerCopy">${mine.trigger_warning ? "You flagged a possible trigger warning. You can uncheck this anytime." : "I think this book may include a trigger for someone in our club."}</span></label>
    </section>

    ${readingUpdateMarkup}`;

  bindClubTools();

  let inlineRating = selectedRating;
  const paintInlineHearts = () => {
    const picker = $("#inlineHeartPicker");
    if (!picker) return;
    picker.innerHTML = heartRating(inlineRating, true);
    $$('[data-heart]', picker).forEach(button => {
      button.onclick = () => {
        inlineRating = Number(button.dataset.heart);
        paintInlineHearts();
      };
    });
  };
  paintInlineHearts();

  $("#inlineTriggerWarning")?.addEventListener("change", async event => {
    const triggerWarning = event.target.checked;
    const triggerCopy = $("#inlineTriggerCopy");
    event.target.disabled = true;

    const payload = {
      book_id: book.id,
      user_id: user.id,
      outcome: mine.outcome || null,
      rating: Number(mine.rating || 0) || null,
      note: null,
      trigger_warning: triggerWarning,
      updated_at: new Date().toISOString()
    };

    const { error: triggerError } = await sb
      .from("book_member_updates")
      .upsert(payload, { onConflict: "book_id,user_id" });

    event.target.disabled = false;
    if (triggerError) {
      event.target.checked = !triggerWarning;
      if (triggerCopy) triggerCopy.textContent = "We could not update the trigger flag. Please try again.";
      return alert(triggerError.message);
    }

    mine.trigger_warning = triggerWarning;
    if (triggerCopy) {
      triggerCopy.textContent = triggerWarning
        ? "You flagged a possible trigger warning. You can uncheck this anytime."
        : "I think this book may include a trigger for someone in our club.";
    }

    // Rebuild only this reading-room view so the TW chip, reader note, and
    // content-care state update right away without a browser refresh.
    await renderBookRoom();
  });

  $("#inlineReadingUpdateForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const outcome = $('input[name="readingOutcome"]:checked')?.value || null;
    const payload = { book_id: book.id, user_id: user.id, outcome, rating: inlineRating || null, note: null, trigger_warning: $("#inlineTriggerWarning")?.checked || false, updated_at: new Date().toISOString() };
    const { error: updateError } = await sb.from("book_member_updates").upsert(payload, { onConflict: "book_id,user_id" });
    if (updateError) return alert(updateError.message);
    await renderBookRoom();
  });

  $$('[data-open-chapter]').forEach(button => { button.onclick = () => openChapterDialog(button.dataset.openChapter, book); });
  $("#openAllMessages")?.addEventListener("click", () => openAllChapterMessages(book));
  $("#setChapters")?.addEventListener("click", () => openChapterCountDialog(book, chapters || []));
  $("#editBookGenres")?.addEventListener("click", () => openBookGenreEditor(book));
  $("#toggleBookDescription")?.addEventListener("click", () => {
    const description = $("#bookDescription");
    const button = $("#toggleBookDescription");
    if (!description || !button) return;
    const expanded = description.classList.toggle("is-expanded");
    description.classList.toggle("is-collapsed", !expanded);
    button.setAttribute("aria-expanded", String(expanded));
    button.innerHTML = expanded ? `Show less <span aria-hidden="true">↑</span>` : `Read full description <span aria-hidden="true">↓</span>`;
  });
  $("#returnAdventureToShelf")?.addEventListener("click", () => returnAdventureToShelf(book));
  $("#removeAdventureFromLibrary")?.addEventListener("click", () => removeAdventureFromLibrary(book));
}

async function clearAdventureActivity(book) {
  const { data: chapters, error: chaptersError } = await sb
    .from("book_chapters")
    .select("id")
    .eq("book_id", book.id);
  if (chaptersError) return chaptersError;

  const cleanupRequests = [
    sb.from("book_member_updates").delete().eq("book_id", book.id)
  ];
  const chapterIds = (chapters || []).map(chapter => chapter.id).filter(Boolean);
  if (chapterIds.length) {
    cleanupRequests.push(
      sb.from("chapter_messages").delete().in("chapter_id", chapterIds)
    );
  }

  const cleanupResults = await Promise.all(cleanupRequests);
  const failedCleanup = cleanupResults.find(result => result.error)?.error;
  return failedCleanup || null;
}

async function returnAdventureToShelf(book) {
  if (!isOwner()) return;
  const confirmed = await prettyConfirm({ eyebrow: "Back to the shelf", title: `Return ${book.title}?`, message: "This will permanently clear every member’s reading update, trigger warning, heart rating, and chapter comments for this adventure.", confirmLabel: "Return to shelf", danger: true });
  if (!confirmed) return;
  const cleanupError = await clearAdventureActivity(book);
  if (cleanupError) return alert(cleanupError.message);
  const { error } = await sb.from("club_books")
    .update({ status: "wheel", selected_at: null, finished_at: null })
    .eq("id", book.id).eq("club_id", currentClub.id);
  if (error) return alert(error.message);
  location.href = appUrl("genres.html");
}

async function removeAdventureFromLibrary(book) {
  if (!isOwner()) return;
  const confirmed = await prettyConfirm({ eyebrow: "Library tidy-up", title: `Remove ${book.title}?`, message: "This will remove the current adventure and permanently clear every member’s reading update, trigger warning, heart rating, and chapter comments.", confirmLabel: "Remove book", danger: true });
  if (!confirmed) return;
  const cleanupError = await clearAdventureActivity(book);
  if (cleanupError) return alert(cleanupError.message);
  const { error } = await sb.from("club_books")
    .delete()
    .eq("id", book.id).eq("club_id", currentClub.id);
  if (error) return alert(error.message);
  location.href = appUrl("genres.html");
}

function descriptionPreview(text, sentenceCount = 3) {
  const normalized = String(text || "").trim();
  if (!normalized) return "";
  const sentences = normalized.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [normalized];
  const preview = sentences.slice(0, sentenceCount).join("").trim();
  return preview.length < normalized.length ? `${preview}…` : preview;
}

function googleBooksSearchLink(book) {
  return `https://books.google.com/books?q=${encodeURIComponent(
    `${book.title} ${(book.authors || []).join(" ")}`
  )}`;
}

function amazonSearchLink(book) {
  const query =
    book.isbn_13 ||
    book.isbn_10 ||
    `${book.title} ${(book.authors || []).join(" ")}`;

  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
}

function chapterCard(chapter) {
  const count = chapterMessageCount(chapter);

  return `
    <button class="chapter-card ${chapter.has_trigger_warning ? "has-trigger-warning" : ""}" data-open-chapter="${chapter.id}">
      <span class="chapter-number">${chapter.chapter_number}</span>

      <span>
        <strong>
          ${escapeHtml(chapter.chapter_title || `Chapter ${chapter.chapter_number}`)}
        </strong>

        <small>
          ${
            count
              ? `${count} group note${count === 1 ? "" : "s"}`
              : "Open the conversation"
          }
        </small>
      </span>

      ${chapter.has_trigger_warning ? `<span class="chapter-warning-label"><span class="tw-badge">TW</span><small>Reader warning</small></span>` : ""}
      <span class="chapter-arrow">→</span>
    </button>
  `;
}

function openChapterCountDialog(book, chapters) {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog" id="chapterCountDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">Set up the reading room</p>
        <h2>How many chapters?</h2>

        <p class="field-help">
          This creates conversation spaces only.
          It does not add or reproduce book text.
        </p>

        <input
          id="newChapterCount"
          type="number"
          min="1"
          max="500"
          value="${chapters.length || book.chapter_count || ""}"
          placeholder="Example: 32"
        >

        <button id="saveChapterCount" class="primary-button full-button">
          Create chapter spaces
        </button>
      </div>
    </dialog>
    `
  );

  const dialog = $("#chapterCountDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();

  $("#saveChapterCount", dialog).onclick = async () => {
    const count = Number($("#newChapterCount", dialog).value);

    if (!count) {
      return alert("Enter a chapter count.");
    }

    if (chapters.length) {
      const { error } = await sb
        .from("book_chapters")
        .delete()
        .eq("book_id", book.id);

      if (error) {
        return alert(error.message);
      }
    }

    await generateChapters(book.id, count);

    await sb
      .from("club_books")
      .update({ chapter_count: count })
      .eq("id", book.id);

    dialog.close();
    renderBookRoom();
  };

  dialog.addEventListener("close", () => dialog.remove());
}

function openBookGenreEditor(book) {
  const initial = new Set((book.genres || []).filter(genre => enabledGenres().includes(genre)));
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="bookGenreEditorDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>
        <p class="eyebrow">Book shelves</p>
        <h2>Edit ${escapeHtml(book.title)}</h2>
        <p class="field-help">Add or remove genre shelves. A book can live on more than one shelf.</p>
        <div id="bookGenrePicker" class="tag-picker"></div>
        <div class="button-row genre-confirm-actions">
          <button id="saveBookGenres" class="primary-button" type="button">Save genres</button>
          <button id="refreshBookCatalog" class="secondary-button" type="button">Refresh from Google</button>
        </div>
      </div>
    </dialog>`);
  const dialog = $("#bookGenreEditorDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  const picker = $("#bookGenrePicker", dialog);
  const render = () => {
    picker.innerHTML = activeGenres().map(genre => `<button type="button" class="tag-chip ${initial.has(genre.name) ? "selected" : ""}" data-edit-genre="${escapeHtml(genre.name)}">${escapeHtml(genre.name)}</button>`).join("");
    $$('[data-edit-genre]', picker).forEach(button => button.onclick = () => {
      initial.has(button.dataset.editGenre) ? initial.delete(button.dataset.editGenre) : initial.add(button.dataset.editGenre);
      render();
    });
  };
  render();
  $("#saveBookGenres", dialog).onclick = async () => {
    const { error } = await sb.from("club_books").update({ genres: [...initial] }).eq("id", book.id).eq("club_id", currentClub.id);
    if (error) return alert(error.message);
    dialog.close();
    renderBookRoom();
  };
  $("#refreshBookCatalog", dialog).onclick = async () => {
    await refreshMetadata(book);
    dialog.close();
  };
  dialog.addEventListener("close", () => dialog.remove());
}

async function refreshMetadata(book) {
  try {
    const query = book.isbn_13
      ? `isbn:${book.isbn_13}`
      : book.isbn_10
        ? `isbn:${book.isbn_10}`
        : `${book.title} ${(book.authors || []).join(" ")}`.trim();

    const payload = await getGoogleBooks(query, { maxResults: 10 });
    const found = chooseBestGoogleMatch(payload.items || [], book);

    if (!found) {
      return alert("No confident catalog match was found. Try entering an ISBN for this book, then refresh again.");
    }

    const meta = normalizeGoogleBook(found);
    const genres = (book.genres?.length ? book.genres : meta.genres)
      .filter(genre => enabledGenres().includes(genre));

    const { error } = await sb
      .from("club_books")
      .update({ ...meta, genres })
      .eq("id", book.id);

    if (error) {
      return alert(error.message);
    }

    renderBookRoom();
  } catch (error) {
    console.error("Google Books refresh error:", error);
    alert(error.message || "Book details could not refresh right now.");
  }
}

async function finishBook(book) {
  const confirmed = await prettyConfirm({ eyebrow: "Close this chapter", title: `Mark ${book.title} as finished?`, message: "The book will move into your finished adventures collection.", confirmLabel: "Mark finished" });
  if (!confirmed) return;

  const { error } = await sb
    .from("club_books")
    .update({
      status: "finished",
      finished_at: new Date().toISOString()
    })
    .eq("id", book.id);

  if (error) {
    return alert(error.message);
  }

  location.href = appUrl("genres.html");
}

async function openChapterDialog(chapterId, book) {
  markAdventureMessagesSeen(book.id);
  await loadBlockedUsers();
  const { data: messages, error } = await sb
    .from("chapter_messages")
    .select("id,body,audio_path,trigger_warning,chapter_rating,created_at,author_id,profiles(display_name)")
    .eq("chapter_id", chapterId)
    .order("created_at");

  if (error) {
    return alert(error.message);
  }

  const chapter = (
    await sb
      .from("book_chapters")
      .select("*")
      .eq("id", chapterId)
      .single()
  ).data;

  const visibleMessages = (messages || []).filter(message => !blockedUserIds.has(message.author_id));
  const hydrated = await Promise.all(
    visibleMessages.map(async message => {
      if (message.audio_path) {
        const { data } = await sb
          .storage
          .from("chapter-audio")
          .createSignedUrl(message.audio_path, 3600);

        return {
          ...message,
          signed_audio_url: data?.signedUrl || ""
        };
      }

      return message;
    })
  );

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog class="book-dialog chapter-dialog" id="chapterDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>

        <p class="eyebrow">${escapeHtml(book.title)}</p>
        <h2>
          ${escapeHtml(
            chapter.chapter_title ||
            `Chapter ${chapter.chapter_number}`
          )}
        </h2>

        <div class="message-thread" id="messageThread">
          ${
            hydrated.map(messageCard).join("") ||
            `
              <p class="empty-note">
                No notes yet. Be the first to leave a spoiler-safe thought.
              </p>
            `
          }
        </div>

        <textarea
          id="chapterMessage"
          placeholder="Share a thought, theory, reaction, or question..."
        ></textarea>

        <div class="chapter-note-options">
          <label class="chapter-tw-toggle">
            <input type="checkbox" id="chapterTriggerWarning">
            <span class="tw-badge">TW</span>
            <span><strong>Warn readers about this chapter</strong><small>Adds a thin red outline to the chapter before anyone opens it.</small></span>
          </label>
          <fieldset class="chapter-rating-field">
            <legend>Rate this chapter <small>(optional)</small></legend>
            <div class="chapter-rating-controls">
              <div class="heart-picker" id="chapterHeartPicker" aria-label="Chapter rating">${heartRating(0, true)}</div>
              <button class="text-button clear-chapter-rating" id="clearChapterRating" type="button" hidden>Clear</button>
            </div>
          </fieldset>
        </div>

        <div class="button-row top-gap">
          <button id="recordVoice" class="secondary-button">
            ${clubIncludesTier("story_spinner") ? "🎙 Record voice note" : "✦ Unlock voice notes"}
          </button>

          <button id="sendMessage" class="primary-button">
            Send note
          </button>
        </div>

        <div id="recordingStatus" class="field-help"></div>
      </div>
    </dialog>
    `
  );

  const dialog = $("#chapterDialog");

  dialog.showModal();

  $(".dialog-close", dialog).onclick = () => dialog.close();
  bindMessageSafetyActions(dialog);

  let recorder = null;
  let chunks = [];
  let chapterRating = 0;

  const paintChapterRating = () => {
    const picker = $("#chapterHeartPicker", dialog);
    const clearButton = $("#clearChapterRating", dialog);
    if (!picker) return;
    picker.innerHTML = heartRating(chapterRating, true);
    picker.setAttribute("aria-label", chapterRating ? `Chapter rating: ${chapterRating} out of 5 hearts` : "No chapter rating selected");
    if (clearButton) clearButton.hidden = !chapterRating;
    $$('[data-heart]', picker).forEach(button => {
      button.onclick = () => {
        chapterRating = Number(button.dataset.heart);
        paintChapterRating();
      };
    });
  };
  paintChapterRating();
  $("#clearChapterRating", dialog).onclick = () => {
    chapterRating = 0;
    paintChapterRating();
  };

  const messageOptions = () => ({
    triggerWarning: $("#chapterTriggerWarning", dialog)?.checked || false,
    rating: chapterRating || null
  });

  $("#sendMessage", dialog).onclick = () => {
    sendChapterMessage(
      chapterId,
      $("#chapterMessage", dialog).value,
      null,
      dialog,
      messageOptions()
    );
  };

  $("#recordVoice", dialog).onclick = async () => {
    if (!clubIncludesTier("story_spinner")) {
      dialog.close();
      openPaywall({ reason: "Voice notes begin with Story Spinner, while text discussions stay free for everyone.", requiredTier: "story_spinner" });
      return;
    }
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("Voice recording is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].filter(type => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type));
      const options = supportedTypes.length ? { mimeType: supportedTypes[0] } : undefined;
      chunks = [];
      recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = event => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        $("#recordingStatus", dialog).textContent =
          "Uploading your voice note...";

        const mimeType = recorder.mimeType || chunks[0]?.type || "audio/webm";
        if (!chunks.length) {
          $("#recordingStatus", dialog).textContent = "No audio was captured. Please try recording again.";
          return;
        }
        await sendChapterMessage(chapterId, "", new Blob(chunks, { type: mimeType }), dialog, messageOptions());
      };

      recorder.start(1000);

      $("#recordVoice", dialog).textContent = "■ Stop recording";

      $("#recordingStatus", dialog).textContent =
        "Recording… tap Stop recording when you are done.";
    } catch (error) {
      console.warn("Voice recording could not start:", error);
      alert(error?.message || "Your browser could not access the microphone. Please allow microphone access and try again.");
    }
  };

  dialog.addEventListener("close", () => {
    if (recorder?.state === "recording") {
      recorder.stop();
    }

    dialog.remove();
  });
}

async function openAllChapterMessages(book) {
  await loadBlockedUsers();
  const { data: chapterRows, error } = await sb
    .from("book_chapters")
    .select("id,chapter_number,chapter_title,chapter_messages(id,body,audio_path,trigger_warning,chapter_rating,created_at,author_id,profiles(display_name))")
    .eq("book_id", book.id)
    .order("chapter_number");

  if (error) return alert(error.message);

  const orderedMessages = (chapterRows || [])
    .flatMap(chapter => (chapter.chapter_messages || []).map(message => ({ ...message, chapter })))
    .filter(message => !blockedUserIds.has(message.author_id))
    .sort((a, b) => {
      const chapterDifference = Number(a.chapter.chapter_number) - Number(b.chapter.chapter_number);
      return chapterDifference || new Date(a.created_at) - new Date(b.created_at);
    });

  const hydrated = await Promise.all(
    orderedMessages.map(async message => {
      if (!message.audio_path) return message;
      const { data } = await sb.storage
        .from("chapter-audio")
        .createSignedUrl(message.audio_path, 3600);
      return { ...message, signed_audio_url: data?.signedUrl || "" };
    })
  );

  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog chapter-dialog all-chapter-messages-dialog" id="allChapterMessagesDialog">
      <div class="dialog-card">
        <button class="dialog-close" type="button">×</button>
        <p class="eyebrow">${escapeHtml(book.title)}</p>
        <h2>All chapter messages</h2>
        <p class="field-help">Messages are grouped in chapter order, with the date each one was posted.</p>
        <div class="message-thread all-messages-thread">
          ${hydrated.length ? hydrated.map(message => allChapterMessageCard(message)).join("") : `<p class="empty-note">No chapter messages have been posted yet.</p>`}
        </div>
      </div>
    </dialog>
  `);

  const dialog = $("#allChapterMessagesDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  bindMessageSafetyActions(dialog);
  dialog.addEventListener("close", () => dialog.remove());
}

function voiceNoteMarkup(message) {
  if (!message.audio_path) return "";

  if (!message.signed_audio_url) {
    return `<p class="voice-note-unavailable">🎙 Voice note unavailable while audio storage is still connecting.</p>`;
  }

  return `
    <div class="voice-note-player">
      <audio
        controls
        preload="metadata"
        src="${escapeHtml(message.signed_audio_url)}"
        onerror="this.parentElement.classList.add('is-unavailable')"
      ></audio>
      <p class="voice-note-unavailable">🎙 Voice note unavailable right now.</p>
    </div>
  `;
}

function allChapterMessageCard(message) {
  const chapterName = message.chapter.chapter_title || `Chapter ${message.chapter.chapter_number}`;
  const name = message.profiles?.display_name || "Bookish Reader";
  const time = new Date(message.created_at).toLocaleString();
  return `
    <article class="chapter-message all-chapter-message" data-message-author="${message.author_id || ""}">
      <p class="message-chapter-label">${escapeHtml(chapterName)}</p>
      <header>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(time)}</small>
      </header>
      ${chapterMessageReactionMarkup(message)}
      ${message.body ? `<p>${escapeHtml(message.body)}</p>` : ""}
      ${voiceNoteMarkup(message)}
      ${messageSafetyMarkup(message)}
    </article>
  `;
}

function messageCard(message) {
  const name = message.profiles?.display_name || "Bookish Reader";
  const time = new Date(message.created_at).toLocaleString();

  return `
    <article class="chapter-message" data-message-author="${message.author_id || ""}">
      <header>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(time)}</small>
      </header>

      ${chapterMessageReactionMarkup(message)}
      ${message.body ? `<p>${escapeHtml(message.body)}</p>` : ""}

      ${voiceNoteMarkup(message)}
      ${messageSafetyMarkup(message)}
    </article>
  `;
}

function chapterMessageReactionMarkup(message) {
  const rating = Number(message?.chapter_rating || 0);
  if (!message?.trigger_warning && !rating) return "";

  return `
    <div class="chapter-message-reactions">
      ${message.trigger_warning ? `<span class="chapter-message-warning"><span class="tw-badge">TW</span><strong>Trigger warning shared for this chapter</strong></span>` : ""}
      ${rating ? `<span class="chapter-message-rating" aria-label="Chapter rating: ${rating} out of 5 hearts"><span class="mini-hearts">${heartRating(rating)}</span><small>${rating}/5 chapter rating</small></span>` : ""}
    </div>`;
}

function messageSafetyMarkup(message) {
  if (!message?.id || !message?.author_id || message.author_id === user?.id) return "";
  return `
    <footer class="message-safety-actions">
      <button type="button" data-report-message="${message.id}" data-reported-user="${message.author_id}">Report</button>
      <button type="button" data-block-user="${message.author_id}">Block reader</button>
    </footer>`;
}

function bindMessageSafetyActions(root) {
  $$('[data-report-message]', root).forEach(button => {
    button.onclick = () => openReportContentDialog(
      button.dataset.reportMessage,
      button.dataset.reportedUser
    );
  });
  $$('[data-block-user]', root).forEach(button => {
    button.onclick = async () => {
      const blockedId = button.dataset.blockUser;
      const confirmed = await prettyConfirm({
        eyebrow: "Your safety controls",
        title: "Block this reader?",
        message: "Their messages will be hidden from your reading rooms. You can unblock them later from Account.",
        confirmLabel: "Block reader",
        danger: true
      });
      if (!confirmed) return;
      const { error } = await sb.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: blockedId
      });
      if (error && error.code !== "23505") return alert(error.message);
      blockedUserIds.add(blockedId);
      $$(`[data-message-author="${blockedId}"]`, root).forEach(card => card.remove());
    };
  });
}

function openReportContentDialog(messageId, reportedUserId) {
  if ($("#reportContentDialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="book-dialog" id="reportContentDialog">
      <form class="dialog-card" id="reportContentForm">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">Community safety</p>
        <h2>Report this message</h2>
        <p class="field-help">Reports are sent to the Spines & Spins moderation queue for review.</p>
        <label class="field-label" for="reportReason">Reason</label>
        <select id="reportReason" required>
          <option value="harassment">Harassment or bullying</option>
          <option value="hate">Hateful or discriminatory content</option>
          <option value="sexual">Sexual or explicit content</option>
          <option value="violence">Threats or violent content</option>
          <option value="spam">Spam or scam</option>
          <option value="other">Something else</option>
        </select>
        <label class="field-label field-label-spaced" for="reportDetails">Details <small>(optional)</small></label>
        <textarea id="reportDetails" maxlength="500" placeholder="Tell us what happened"></textarea>
        <p id="reportStatus" class="field-help" role="status" aria-live="polite"></p>
        <button class="danger-button secondary-button full-button" type="submit">Send report</button>
      </form>
    </dialog>`);

  const dialog = $("#reportContentDialog");
  dialog.showModal();
  $(".dialog-close", dialog).onclick = () => dialog.close();
  $("#reportContentForm", dialog).onsubmit = async event => {
    event.preventDefault();
    const submit = $('button[type="submit"]', dialog);
    submit.disabled = true;
    const { error } = await sb.from("content_reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      message_id: messageId,
      club_id: currentClub?.id || null,
      reason: $("#reportReason", dialog).value,
      details: $("#reportDetails", dialog).value.trim() || null
    });
    if (error) {
      submit.disabled = false;
      $("#reportStatus", dialog).textContent = error.message;
      return;
    }
    $("#reportStatus", dialog).textContent = "Report sent. Thank you for helping keep your club safe.";
    setTimeout(() => dialog.close(), 900);
  };
  dialog.addEventListener("close", () => dialog.remove());
}

function containsObjectionableText(value) {
  return /\b(?:kill\s+yourself|n[i1]gg(?:er|a)s?|f[a@]gg?ots?|cunts?)\b/i.test(String(value || ""));
}

async function sendChapterMessage(chapterId, body, audioBlob, dialog, options = {}) {
  body = body.trim();
  const triggerWarning = Boolean(options.triggerWarning);
  const chapterRating = Number(options.rating || 0) || null;

  if (!body && !audioBlob && !triggerWarning && !chapterRating) return;
  if (body && containsObjectionableText(body)) {
    return alert("Please rewrite this message so it follows the Community Standards.");
  }

  let audio_path = null;

  if (audioBlob) {
    const extension = /mp4|aac/i.test(audioBlob.type || "") ? "m4a" : "webm";
    audio_path = `${user.id}/${chapterId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await sb
      .storage
      .from("chapter-audio")
      .upload(audio_path, audioBlob, {
        contentType: audioBlob.type || "audio/webm"
      });

    if (error) {
      return alert(error.message);
    }
  }

  const { error } = await sb
    .from("chapter_messages")
    .insert({
      chapter_id: chapterId,
      author_id: user.id,
      body: body || null,
      audio_path,
      trigger_warning: triggerWarning,
      chapter_rating: chapterRating
    });

  if (error) {
    return alert(error.message);
  }

  dialog.close();
  renderBookRoom();
}

document.addEventListener("DOMContentLoaded", initialize);
