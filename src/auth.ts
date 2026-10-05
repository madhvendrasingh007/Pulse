import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/auth/login-limit";
import authConfig from "@/auth.config";

const credentialsSchema = z.object({ username: z.string().trim().min(3).max(80), password: z.string().min(1).max(256) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    name: "Owner access",
    credentials: { username: { label: "Username", type: "text" }, password: { label: "Password", type: "password" } },
    async authorize(raw: Record<string, unknown> | undefined, request: Request) {
      const parsed = credentialsSchema.safeParse(raw);
      const ownerUsername = process.env.PULSE_OWNER_USERNAME?.trim().toLowerCase();
      const passwordHash = process.env.PULSE_OWNER_PASSWORD_HASH;
      if (!ownerUsername || !passwordHash || !process.env.AUTH_SECRET) return null;
      let rate;
      try { rate = await consumeLoginAttempt(request); } catch { return null; }
      if (rate.blocked || !parsed.success) return null;
      const username = parsed.data.username.toLowerCase();
      const valid = await verifyPassword(parsed.data.password, passwordHash);
      if (!valid || username !== ownerUsername) return null;
      try { await clearLoginAttempts(rate.key); } catch { return null; }
      return { id: "pulse-owner", name: "Madhvendra Singh", email: `${ownerUsername}@pulse.local` };
    },
  })],
});
