import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const PROJECT_REF = "rogeqnlbbzcrifuiyhsr";
const API_URL = `https://${PROJECT_REF}.supabase.co`;
const REVIEW_EMAIL = "kayladeshasier+appreview@gmail.com";
const APPLY = process.argv.includes("--apply");

const PERSONAS = [
  { key: "maya", name: "Maya", email: "kayladeshasier+demo-maya@gmail.com", outcome: "finished", rating: 5, trigger_warning: false },
  { key: "jordan", name: "Jordan", email: "kayladeshasier+demo-jordan@gmail.com", outcome: "finished", rating: 4, trigger_warning: true },
  { key: "sam", name: "Sam", email: "kayladeshasier+demo-sam@gmail.com", outcome: null, rating: 4, trigger_warning: false },
  { key: "alex", name: "Alex", email: "kayladeshasier+demo-alex@gmail.com", outcome: "finished", rating: 5, trigger_warning: false },
  { key: "riley", name: "Riley", email: "kayladeshasier+demo-riley@gmail.com", outcome: "finished", rating: 5, trigger_warning: false },
];

const CONVERSATIONS = [
  { chapter: 1, by: "maya", rating: 5, body: "I love how Bilbo is trying so hard to be polite while his entire evening gets taken over." },
  { chapter: 1, by: "alex", body: "The party feels chaotic in the best way. I already know this group is going to test every bit of his patience." },
  { chapter: 1, by: "riley", body: "That quiet shift from annoyance to curiosity is what sold me on the adventure." },
  { chapter: 2, by: "jordan", rating: 4, body: "Bilbo's first real attempt at being a burglar went about as smoothly as I expected." },
  { chapter: 2, by: "sam", body: "The comedy helped, but this chapter also made the journey feel genuinely dangerous for the first time." },
  { chapter: 3, by: "maya", body: "Rivendell feels like the first true breath of calm since the journey began." },
  { chapter: 3, by: "riley", rating: 5, body: "The hidden writing was such a satisfying discovery. I love when an old clue changes the whole plan." },
  { chapter: 4, by: "alex", body: "The weather and the mountain made me more nervous than any villain could." },
  { chapter: 4, by: "jordan", body: "I kept thinking that cave was too convenient. I did not trust that shelter for a second." },
  { chapter: 5, by: "maya", rating: 5, body: "The riddle scene is so tense because neither side ever feels fully in control." },
  { chapter: 5, by: "sam", body: "I was trying to solve each one before reading on and doing a terrible job." },
  { chapter: 5, by: "riley", body: "This feels like the moment Bilbo starts depending on his own quick thinking instead of waiting to be rescued." },
  { chapter: 6, by: "alex", rating: 4, body: "Every escape somehow creates a completely new problem. This group cannot catch a break." },
  { chapter: 6, by: "maya", body: "The scene in the trees had me stressed, especially once everyone realized there was nowhere left to go." },
  { chapter: 7, by: "jordan", body: "Beorn is fascinating. I could not decide whether to feel safe or even more nervous around him." },
  { chapter: 7, by: "sam", rating: 4, body: "I liked slowing down here and getting a little time to prepare before the forest." },
  { chapter: 8, by: "jordan", warning: true, body: "Content note for this chapter: giant spiders, characters being restrained, and extended peril." },
  { chapter: 8, by: "maya", rating: 5, body: "Bilbo taking charge here feels like such a huge shift from the beginning of the book." },
  { chapter: 8, by: "alex", body: "This chapter was stressful, but seeing him act decisively made it one of my favorites so far." },
  { chapter: 9, by: "riley", rating: 5, body: "The escape plan is completely ridiculous and somehow brilliant at the same time." },
  { chapter: 9, by: "sam", body: "I could feel how uncomfortable that entire trip must have been, but I was still laughing." },
  { chapter: 10, by: "maya", body: "Lake-town's excitement feels hopeful, but it also puts so much pressure on the group to succeed." },
  { chapter: 10, by: "jordan", rating: 4, body: "Everyone already has expectations for what this journey will mean to them. That makes me nervous." },
  { chapter: 11, by: "alex", body: "The waiting outside the mountain was almost worse than the dangerous parts. You can feel everyone's confidence slipping." },
  { chapter: 11, by: "riley", rating: 4, body: "I like that the obstacle here requires patience and attention instead of another fight." },
  { chapter: 12, by: "maya", rating: 5, body: "Bilbo's conversation with Smaug is terrifying because every answer feels like it could reveal too much." },
  { chapter: 12, by: "jordan", body: "The dragon feels dangerous even when he is only talking. That scene had so much tension." },
  { chapter: 12, by: "sam", body: "I kept changing my mind about whether Bilbo was being clever or pushing his luck too far." },
  { chapter: 13, by: "alex", body: "The empty mountain should feel like a victory, but the atmosphere is somehow even more unsettling." },
  { chapter: 13, by: "riley", rating: 4, body: "The treasure is starting to change the way everyone talks to each other, and I do not like where that is heading." },
  { chapter: 14, by: "jordan", warning: true, body: "Content note: this chapter includes fire, destruction of homes, and deaths during the attack." },
  { chapter: 14, by: "maya", rating: 5, body: "Bard's focus under pressure made this chapter impossible to put down." },
  { chapter: 15, by: "sam", body: "The mood changed so quickly from celebration to conflict. Everyone believes they are being reasonable." },
  { chapter: 15, by: "alex", rating: 4, body: "I understand why each side thinks it is right, which makes the standoff even more frustrating." },
  { chapter: 16, by: "maya", body: "Bilbo making this choice on his own says so much about how far he has come." },
  { chapter: 16, by: "jordan", rating: 5, body: "This feels like courage in a completely different form—not fighting, but risking everyone's anger to do what seems right." },
  { chapter: 17, by: "riley", body: "So many groups arriving with different motives made this chapter feel enormous compared with the quiet beginning." },
  { chapter: 17, by: "alex", rating: 5, body: "I had to slow down to keep track of everyone, but the momentum never let up." },
  { chapter: 18, by: "jordan", rating: 4, body: "This chapter hit much harder than I expected. The quieter moments after everything were the most powerful." },
  { chapter: 18, by: "sam", body: "Bilbo's view of victory feels so different from everyone else's, and that is exactly why I like him." },
  { chapter: 19, by: "maya", rating: 5, body: "I love that the ending gives Bilbo a real homecoming without pretending he is the same person who left." },
  { chapter: 19, by: "riley", body: "Coming home changed is such a good final note. The adventure mattered, even if nobody around him fully understands it." },
  { chapter: 19, by: "alex", body: "Final rating: five hearts. This was warmer and funnier than I expected, with just enough danger." },
];

function getServiceKey() {
  const output = execFileSync(
    "npx",
    ["supabase", "projects", "api-keys", "--project-ref", PROJECT_REF, "-o", "json"],
    { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const keys = JSON.parse(output);
  const serviceKey = keys.find((key) => key.name === "service_role")?.api_key;
  if (!serviceKey) throw new Error("The linked project's service-role key was unavailable.");
  return serviceKey;
}

const serviceKey = getServiceKey();
const baseHeaders = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  "content-type": "application/json",
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...baseHeaders, ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = text.replaceAll(serviceKey, "[redacted]").slice(0, 600);
    throw new Error(`${options.method || "GET"} ${new URL(url).pathname} failed (${response.status}): ${detail}`);
  }
  return text ? JSON.parse(text) : null;
}

function restUrl(table, params = {}) {
  const url = new URL(`/rest/v1/${table}`, API_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function select(table, params) {
  return request(restUrl(table, params));
}

async function upsert(table, rows, onConflict) {
  if (!rows.length) return;
  const url = restUrl(table, { on_conflict: onConflict });
  await request(url, {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

async function listUsers() {
  const all = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = new URL("/auth/v1/admin/users", API_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "1000");
    const result = await request(url);
    const users = result?.users || [];
    all.push(...users);
    if (users.length < 1000) break;
  }
  return all;
}

async function createDemoUser(persona) {
  const password = `${randomBytes(24).toString("base64url")}A1!`;
  const result = await request(new URL("/auth/v1/admin/users", API_URL), {
    method: "POST",
    body: JSON.stringify({
      email: persona.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: persona.name, is_demo: true, demo_purpose: "marketing" },
    }),
  });
  return result.user || result;
}

function stableUuid(value) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = "8";
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const users = await listUsers();
const reviewUser = users.find((user) => user.email?.toLowerCase() === REVIEW_EMAIL.toLowerCase());
if (!reviewUser) throw new Error(`The App Review user ${REVIEW_EMAIL} was not found.`);

const clubs = await select("clubs", {
  created_by: `eq.${reviewUser.id}`,
  select: "id,name,is_public,created_at",
  order: "created_at.asc",
});
const club = clubs.find((item) => item.name === "App Review Book Club") || clubs.find((item) => !item.is_public) || clubs[0];
if (!club) throw new Error("The App Review user does not own a demo club.");
if (club.is_public) throw new Error(`Refusing to seed public club ${club.name}.`);

const books = await select("club_books", {
  club_id: `eq.${club.id}`,
  title: "ilike.*Hobbit*",
  select: "id,title,status",
});
const book = books.find((item) => item.status === "reading") || books[0];
if (!book) throw new Error(`No Hobbit book was found in ${club.name}.`);

const chapters = await select("book_chapters", {
  book_id: `eq.${book.id}`,
  select: "id,chapter_number,chapter_title",
  order: "chapter_number.asc",
});
if (chapters.length < 19) throw new Error(`Expected 19 Hobbit chapters but found ${chapters.length}.`);
const chapterByNumber = new Map(chapters.map((chapter) => [Number(chapter.chapter_number), chapter]));

const existingPersonaUsers = new Map(
  users
    .filter((user) => PERSONAS.some((persona) => persona.email.toLowerCase() === user.email?.toLowerCase()))
    .map((user) => [user.email.toLowerCase(), user]),
);

console.log(JSON.stringify({
  mode: APPLY ? "apply" : "dry-run",
  club: club.name,
  privateClub: !club.is_public,
  book: book.title,
  chapters: chapters.length,
  plannedReaders: PERSONAS.length,
  plannedMessages: CONVERSATIONS.length,
  existingDemoAccounts: existingPersonaUsers.size,
}, null, 2));

if (!APPLY) {
  if (existingPersonaUsers.size === PERSONAS.length) {
    const ids = [...existingPersonaUsers.values()].map((user) => user.id);
    const [profiles, members, updates, messages] = await Promise.all([
      select("profiles", { id: `in.(${ids.join(",")})`, select: "id,display_name" }),
      select("club_members", { club_id: `eq.${club.id}`, user_id: `in.(${ids.join(",")})`, select: "user_id,role" }),
      select("book_member_updates", { book_id: `eq.${book.id}`, user_id: `in.(${ids.join(",")})`, select: "user_id,outcome,rating,trigger_warning" }),
      select("chapter_messages", { author_id: `in.(${ids.join(",")})`, chapter_id: `in.(${chapters.map((chapter) => chapter.id).join(",")})`, select: "id,chapter_id,trigger_warning,chapter_rating" }),
    ]);
    console.log(JSON.stringify({
      currentDemoState: {
        readers: profiles.map((profile) => profile.display_name).sort(),
        clubMemberships: members.length,
        readingUpdates: updates.length,
        chapterMessages: messages.length,
        chaptersWithMessages: new Set(messages.map((message) => message.chapter_id)).size,
        warningMessages: messages.filter((message) => message.trigger_warning).length,
        ratedMessages: messages.filter((message) => message.chapter_rating).length,
      },
    }, null, 2));
  }
  console.log("Dry run complete. Re-run with --apply to seed the private demo club.");
  process.exit(0);
}

const personaUsers = new Map();
for (const persona of PERSONAS) {
  const existing = existingPersonaUsers.get(persona.email.toLowerCase());
  const user = existing || await createDemoUser(persona);
  personaUsers.set(persona.key, user);
}

await upsert("profiles", PERSONAS.map((persona) => ({
  id: personaUsers.get(persona.key).id,
  display_name: persona.name,
  avatar_url: null,
})), "id");

await upsert("club_members", PERSONAS.map((persona) => ({
  club_id: club.id,
  user_id: personaUsers.get(persona.key).id,
  role: "member",
})), "club_id,user_id");

await upsert("book_member_updates", PERSONAS.map((persona, index) => ({
  book_id: book.id,
  user_id: personaUsers.get(persona.key).id,
  outcome: persona.outcome,
  rating: persona.rating,
  trigger_warning: persona.trigger_warning,
  updated_at: hoursAgo(12 - index * 2),
})), "book_id,user_id");

const messageRows = CONVERSATIONS.map((message, index) => {
  const chapter = chapterByNumber.get(message.chapter);
  const author = personaUsers.get(message.by);
  if (!chapter) throw new Error(`Chapter ${message.chapter} is missing.`);
  if (!author) throw new Error(`Persona ${message.by} is missing.`);
  const chapterAge = (20 - message.chapter) * 24;
  const messageOffset = (index % 3) * 2 + (index % 5);
  return {
    id: stableUuid(`spines-and-spins-hobbit-demo-${message.chapter}-${index}-${message.by}`),
    chapter_id: chapter.id,
    author_id: author.id,
    body: message.body,
    audio_path: null,
    trigger_warning: Boolean(message.warning),
    chapter_rating: message.rating || null,
    created_at: hoursAgo(chapterAge + messageOffset),
  };
});

await upsert("chapter_messages", messageRows, "id");

const seededMessages = await select("chapter_messages", {
  author_id: `in.(${[...personaUsers.values()].map((user) => user.id).join(",")})`,
  chapter_id: `in.(${chapters.map((chapter) => chapter.id).join(",")})`,
  select: "id,chapter_id,author_id,trigger_warning,chapter_rating",
});
const seededMembers = await select("club_members", {
  club_id: `eq.${club.id}`,
  user_id: `in.(${[...personaUsers.values()].map((user) => user.id).join(",")})`,
  select: "user_id,role",
});
const seededUpdates = await select("book_member_updates", {
  book_id: `eq.${book.id}`,
  user_id: `in.(${[...personaUsers.values()].map((user) => user.id).join(",")})`,
  select: "user_id,outcome,rating,trigger_warning",
});

console.log(JSON.stringify({
  ok: true,
  demoReaders: seededMembers.length,
  readingUpdates: seededUpdates.length,
  chapterMessages: seededMessages.length,
  chaptersWithMessages: new Set(seededMessages.map((message) => message.chapter_id)).size,
  warningMessages: seededMessages.filter((message) => message.trigger_warning).length,
  ratedMessages: seededMessages.filter((message) => message.chapter_rating).length,
}, null, 2));
