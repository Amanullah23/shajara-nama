import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  // Verify the caller is logged in and is specifically a super_admin
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (userId === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account through this action." },
      { status: 400 },
    );
  }

  const { data: callerRole } = await supabaseAuth
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!callerRole || callerRole.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only Super Admins can delete user accounts." },
      { status: 403 },
    );
  }

  // Server-only client with elevated privileges — never expose this key to the browser
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Clean up the role row first, so nothing points at a soon-to-be-deleted user
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

  // Now permanently delete the actual login account
  const { error: deleteError } =
    await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
