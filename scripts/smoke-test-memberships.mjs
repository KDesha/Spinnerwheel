import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "rogeqnlbbzcrifuiyhsr";
const URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_TUtkRHF0gz91QOwDdXTNKQ_iwR_PcbN";

const keys = JSON.parse(execFileSync(
  "npx",
  ["supabase", "projects", "api-keys", "--project-ref", PROJECT_REF, "-o", "json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
));
const serviceKey = keys.find(key => key.name === "service_role")?.api_key;
if (!serviceKey) throw new Error("Service role key is unavailable.");

const admin = createClient(URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const client = createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const email = `kayladeshasier+release-smoke-${suffix}@gmail.com`;
const password = `${randomBytes(22).toString("base64url")}Aa1!`;
let userId = "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Release Smoke Test" } });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;

  const tierUpdate = await admin.from("profiles").update({ subscription_tier: "story_spinner" }).eq("id", userId);
  if (tierUpdate.error) throw tierUpdate.error;

  const limits = await Promise.all([
    client.rpc("subscription_club_limit", { tier: "first_chapter" }),
    client.rpc("subscription_book_limit", { tier: "first_chapter" }),
    client.rpc("subscription_member_limit", { tier: "story_spinner" })
  ]);
  limits.forEach(result => { if (result.error) throw result.error; });
  assert(limits[0].data === 2, "First Chapter club limit is not 2.");
  assert(limits[1].data === 50, "First Chapter book limit is not 50.");
  assert(limits[2].data === 20, "Story Spinner member limit is not 20.");

  const clubs = [];
  for (const name of ["Smoke Test One", "Smoke Test Two"]) {
    const inserted = await client.from("clubs").insert({
      name: `${name} ${suffix}`,
      description: "Temporary automated release validation.",
      is_public: false,
      enabled_genres: ["Fantasy"],
      created_by: userId
    }).select("id").single();
    if (inserted.error) throw inserted.error;
    clubs.push(inserted.data.id);
  }

  const thirdClub = await client.from("clubs").insert({
    name: `Smoke Test Three ${suffix}`,
    description: "This insert should be rejected by the plan limit.",
    is_public: false,
    enabled_genres: ["Fantasy"],
    created_by: userId
  });
  assert(thirdClub.error?.message?.includes("SUBSCRIPTION_LIMIT"), "Story Spinner allowed more than two owned clubs.");

  const usage = await client.rpc("get_club_plan_usage", { target_club_id: clubs[0] });
  if (usage.error) throw usage.error;
  assert(usage.data?.tier === "story_spinner", "Club plan usage did not return Story Spinner.");
  assert(usage.data?.member_count === 1, "The owner should count once across two clubs.");

  const poll = await client.from("club_polls").insert({
    club_id: clubs[0], created_by: userId, question: "Which smoke-test choice wins?"
  }).select("id").single();
  if (poll.error) throw poll.error;
  const options = await client.from("club_poll_options").insert([
    { poll_id: poll.data.id, label: "First choice", position: 1 },
    { poll_id: poll.data.id, label: "Second choice", position: 2 }
  ]).select("id,position");
  if (options.error) throw options.error;
  const firstOption = options.data.find(option => option.position === 1);
  const vote = await client.from("club_poll_votes").insert({
    poll_id: poll.data.id, option_id: firstOption.id, user_id: userId
  });
  if (vote.error) throw vote.error;

  const book = await client.from("club_books").insert({
    club_id: clubs[0], title: "Release Smoke Test", authors: ["Spines & Spins"], genres: ["Fantasy"], status: "wheel", added_by: userId
  }).select("id").single();
  if (book.error) throw book.error;
  const chapter = await client.from("book_chapters").insert({ book_id: book.data.id, chapter_number: 1 }).select("id").single();
  if (chapter.error) throw chapter.error;
  const message = await client.from("chapter_messages").insert({
    chapter_id: chapter.data.id, author_id: userId, body: "Temporary message deletion test."
  }).select("id").single();
  if (message.error) throw message.error;
  const deleted = await client.from("chapter_messages").delete().eq("id", message.data.id).eq("author_id", userId).select("id").maybeSingle();
  if (deleted.error) throw deleted.error;
  assert(deleted.data?.id === message.data.id, "The author could not delete their own message.");

  console.log(JSON.stringify({
    ok: true,
    limits: { firstChapterClubs: limits[0].data, firstChapterBooks: limits[1].data, storySpinnerMembers: limits[2].data },
    planUsage: usage.data,
    polls: "create/options/vote passed",
    ownMessageDeletion: "passed"
  }, null, 2));
} finally {
  if (userId) {
    const cleanup = await admin.auth.admin.deleteUser(userId);
    if (cleanup.error) console.warn(`Temporary user cleanup failed: ${cleanup.error.message}`);
  }
}
