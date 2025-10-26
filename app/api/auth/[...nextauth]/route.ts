import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { env, isDemo } from "@/lib/env";

const handler = NextAuth({
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  adapter: getDb() ? DrizzleAdapter(getDb() as any) : undefined,
  providers: [
    ...(isDemo() ? [
      Credentials({
        name: "Demo",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "you@example.com" }
        },
        async authorize(credentials) {
          if (!credentials?.email || typeof credentials.email !== "string") return null;
          return { id: "u1", name: credentials.email.split("@")[0], email: credentials.email };
        }
      })
    ] : [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      })
    ])
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
