import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
  callbacks: {
    async signIn({ account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after successful login
      return baseUrl;
    },
    async session({ session, token }) {
      // Return session as-is (NextAuth handles user data properly)
      return session;
    },
    async jwt({ token, account, profile }) {
      // Persist user data in JWT
      if (account && profile) {
        token.id = profile.sub;
      }
      return token;
    }
  }
};
