import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { env, isDemo } from "@/lib/env";

const handler = NextAuth({
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  adapter: getDb() ? (DrizzleAdapter(getDb()! as any) as any) : undefined,
  providers: [
    Credentials({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        // In demo mode, any email signs in
        return { id: "u1", name: credentials.email.split("@")[0], email: credentials.email } as any;
      }
    })
  ]
});

export { handler as GET, handler as POST };
