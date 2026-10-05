import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

// Keep Node-only authentication and MongoDB code out of the Edge middleware bundle.
const { auth } = NextAuth(authConfig);

export default auth((request) => {
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

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|icon.svg|manifest.webmanifest|favicon.ico).*)"] };
