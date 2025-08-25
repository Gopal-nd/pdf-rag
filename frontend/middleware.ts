// middleware.ts
import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import { Session } from "better-auth";

const authRoutes = ["/sign-in"];

export default async function authMiddleware(request: NextRequest) {
  const { nextUrl } = request;
  const path = nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(path);

  const origin = nextUrl.origin;
  const base = process.env.NEXTAUTH_URL || origin;
  const sessionUrl = `${base.replace(/\/$/, "")}/api/auth/get-session`;

  let session: Session | null = null;
  try {
    const res = await betterFetch<Session>(sessionUrl, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    session = res.data;
  } catch (err) {
    console.error("failed to fetch session in middleware:", err);
  }

  if (!session) { 
    if (isAuthRoute) { 
      return NextResponse.next(); 
    }
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  // If accessing dashboard, ensure API key exists; allow account page
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAccountPage = path.startsWith("/dashboard/account");
  if (isDashboardRoute && !isAccountPage) {
    try {
      const apikeyRes = await betterFetch<{ statusCode: number; data: { apiKey: string | null } }>(
        `${base.replace(/\/$/, "")}/api/apikey`,
        { headers: { cookie: request.headers.get("cookie") || "" } }
      );
      const apiKey = apikeyRes?.data?.data?.apiKey || null;
      if (!apiKey) {
        const url = new URL("/dashboard/account", origin);
        url.searchParams.set("message", "Please add your Google AI API key to continue");
        return NextResponse.redirect(url);
      }
    } catch (e) {
      console.error("Failed to verify API key in middleware:", e);
      const url = new URL("/dashboard/account", origin);
      url.searchParams.set("message", "Please add your Google AI API key to continue");
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in"], 
};