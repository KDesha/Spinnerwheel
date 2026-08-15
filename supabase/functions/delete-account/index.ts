import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function chunks<T>(values: T[], size = 100) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);

  let input: { confirmation?: unknown };
  try {
    input = await request.json();
  } catch (_) {
    return json({ message: "Invalid JSON body" }, 400);
  }
  if (input.confirmation !== "DELETE") return json({ message: "Deletion was not confirmed" }, 400);

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ message: "Sign in is required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ message: "Account deletion is not configured" }, 503);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const account = authData?.user;
  if (authError || !account) return json({ message: "Your session is no longer valid. Sign in and try again." }, 401);

  try {
    const revenueCatKey = Deno.env.get("REVENUECAT_SECRET_API_KEY");
    if (revenueCatKey) {
      const revenueCatResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(account.id)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${revenueCatKey}`, Accept: "application/json" } },
      );
      if (!revenueCatResponse.ok && revenueCatResponse.status !== 404) {
        throw new Error("Subscription account data could not be deleted");
      }
    }

    const { data: ownedClubs, error: clubsError } = await admin
      .from("clubs").select("id").eq("created_by", account.id);
    if (clubsError) throw clubsError;
    const clubIds = unique((ownedClubs || []).map((club) => club.id));

    let bookIds: string[] = [];
    if (clubIds.length) {
      const { data, error } = await admin.from("club_books").select("id").in("club_id", clubIds);
      if (error) throw error;
      bookIds = unique((data || []).map((book) => book.id));
    }

    let chapterIds: string[] = [];
    if (bookIds.length) {
      const { data, error } = await admin.from("book_chapters").select("id").in("book_id", bookIds);
      if (error) throw error;
      chapterIds = unique((data || []).map((chapter) => chapter.id));
    }

    const audioPaths: string[] = [];
    if (chapterIds.length) {
      const { data, error } = await admin.from("chapter_messages").select("audio_path").in("chapter_id", chapterIds);
      if (error) throw error;
      audioPaths.push(...(data || []).map((message) => message.audio_path));
    }
    const { data: ownMessages, error: ownMessagesError } = await admin
      .from("chapter_messages").select("audio_path").eq("author_id", account.id);
    if (ownMessagesError) throw ownMessagesError;
    audioPaths.push(...(ownMessages || []).map((message) => message.audio_path));

    for (const batch of chunks(unique(audioPaths))) {
      const { error } = await admin.storage.from("chapter-audio").remove(batch);
      if (error) throw error;
    }

    if (chapterIds.length) {
      const { error } = await admin.from("chapter_messages").delete().in("chapter_id", chapterIds);
      if (error) throw error;
    }
    if (bookIds.length) {
      for (const table of ["book_member_updates", "book_chapters"]) {
        const { error } = await admin.from(table).delete().in("book_id", bookIds);
        if (error) throw error;
      }
    }
    if (clubIds.length) {
      for (const table of ["club_books", "club_members", "clubs"]) {
        const column = table === "clubs" ? "id" : "club_id";
        const { error } = await admin.from(table).delete().in(column, clubIds);
        if (error) throw error;
      }
    }

    for (const [table, column] of [
      ["chapter_messages", "author_id"],
      ["book_member_updates", "user_id"],
      ["club_members", "user_id"],
      ["revenuecat_webhook_events", "app_user_id"],
    ]) {
      const { error } = await admin.from(table).delete().eq(column, account.id);
      if (error) throw error;
    }

    const { error: booksAddedError } = await admin
      .from("club_books").update({ added_by: null }).eq("added_by", account.id);
    if (booksAddedError) throw booksAddedError;
    const { error: profileError } = await admin.from("profiles").delete().eq("id", account.id);
    if (profileError) throw profileError;
    const { error: deleteError } = await admin.auth.admin.deleteUser(account.id);
    if (deleteError) throw deleteError;

    return json({ deleted: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return json({ message: "Your account could not be deleted completely. Please try again or contact support." }, 500);
  }
});
