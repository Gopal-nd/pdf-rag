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
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || origin;
  const sessionUrl = `${base.replace(/\/$/, "")}/api/me`;


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

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in"], 
};