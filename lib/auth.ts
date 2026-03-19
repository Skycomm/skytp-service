import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const doctor = await prisma.doctor.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!doctor || !doctor.active) return null;

        return {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
          isAdmin: doctor.isAdmin,
        } as Record<string, unknown>;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.doctorId = user.id;
        token.isAdmin = Boolean((user as Record<string, unknown>).isAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.doctorId as string;
        (session.user as unknown as Record<string, unknown>).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
});
