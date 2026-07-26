import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const { email, role, branchId } = await request.json();

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email and role are required." },
      { status: 400 },
    );
  }

  // Verify the person making this request is actually an admin, using their session cookie
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

  if (
    !callerRole ||
    !["super_admin", "branch_admin"].includes(callerRole.role)
  ) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  // Now use the service role key — server-side only — to actually create the user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: Math.random().toString(36).slice(-10) + "A1!", // temporary; they'll reset it
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

  // Send them a password-reset style invite so they can set their own password
  await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
  });

  return NextResponse.json({ success: true });
}
