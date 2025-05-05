// auth.config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      // Use the correct environment variables for NextAuth Google login
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Add the redirect URI to match what's in your Google Cloud Console
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  // Fixed secret name to match .env file
  secret: process.env.AUTH_SECRET,
  // Updated callback URL to match Google Cloud console
  callbacks: {
    async signIn({ account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  }
};
