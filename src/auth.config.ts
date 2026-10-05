import type { NextAuthConfig } from "next-auth";

/** Shared, Edge-compatible Auth.js settings. Keep database and Node-only imports out. */
const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [],
} satisfies NextAuthConfig;

export default authConfig;
