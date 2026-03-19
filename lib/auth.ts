import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;

      // Check if doctor exists and is active
      const doctor = await prisma.doctor.findUnique({
        where: { email: profile.email.toLowerCase() },
      });

      if (!doctor || !doctor.active) return false;
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        const doctor = await prisma.doctor.findUnique({
          where: { email: profile.email.toLowerCase() },
        });
        if (doctor) {
          token.doctorId = doctor.id;
          token.isAdmin = doctor.isAdmin;
        }
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
