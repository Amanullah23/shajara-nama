import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if ((isAdminRoute || isDashboardRoute) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Existing 2FA enforcement
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsMfa = aalData && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2";

    if (needsMfa && !request.nextUrl.pathname.startsWith("/verify-2fa")) {
      return NextResponse.redirect(new URL("/verify-2fa", request.url));
    }

    // Role-based routing between /admin and /dashboard
    if (isAdminRoute || isDashboardRoute) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const role = roleData?.role ?? "guest";

      if (isAdminRoute && role === "member") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (isAdminRoute && role === "guest") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (isDashboardRoute && role !== "member") {
        const dest = role === "guest" ? "/" : "/admin";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};