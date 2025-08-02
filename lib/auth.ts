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
  callbacks: {
    async signIn({ account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle post-login redirects properly
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If it's the same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to home page after login
      return baseUrl;
    },
    async session({ session, token }) {
      // Ensure session data is properly passed
      if (token && session.user) {
        session.user.id = token.sub;
      }
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
