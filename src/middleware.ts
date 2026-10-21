import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

// Keep Node-only authentication and MongoDB code out of the Edge middleware bundle.
const { auth } = NextAuth(authConfig);

const protect = auth((request) => {
  const { pathname, search } = request.nextUrl;
  if (!process.env.AUTH_SECRET) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login?setup=1", request.url));
  }
  if (!request.auth && pathname !== "/login") {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  if (request.auth && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.cookies.get("pulse-guest-mode")?.value === "1") {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Guest access is read-only." }, { status: 403 });
    if (request.nextUrl.pathname === "/" || /\.[^/]+$/.test(request.nextUrl.pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  return (protect as unknown as (request: NextRequest, event: NextFetchEvent) => Response | Promise<Response>)(request, event);
}

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|icon.svg|manifest.webmanifest|favicon.ico).*)"] };