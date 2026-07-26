import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const { email, password, role, branchId } = await request.json();

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "Email, password, and role are required." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  // Verify the caller is logged in and is specifically a super_admin — stricter than Invite
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

  const { data: callerRole } = await supabaseAuth
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!callerRole || callerRole.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only Super Admins can create user accounts directly." },
      { status: 403 },
    );
  }

  // Prevent creating another super_admin through this route — that stays a manual/SQL action for safety
  if (role === "super_admin") {
    return NextResponse.json(
      { error: "Super Admin accounts cannot be created through this form." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create user." },
      { status: 500 },
    );
  }

  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
    user_id: newUser.user.id,
    role,
    branch_id: branchId || null,
  });

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
