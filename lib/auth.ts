import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { credentialsSchema } from "@/lib/login-schema";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.login, parsed.data.login))
          .limit(1);
        if (!user) return null;
        if (user.password !== parsed.data.password) return null;

        return {
          id: user.id,
          name: user.login,
          role: user.role,
          title: user.title,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role =
          typeof (user as { role?: string }).role === "string"
            ? (user as { role?: string }).role
            : token.role;
        token.title =
          typeof (user as { title?: string }).title === "string"
            ? (user as { title?: string }).title
            : token.title;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub,
        role: token.role as string,
        title: typeof token.title === "string" ? token.title : undefined,
      };
      return session;
    },
  },
};
